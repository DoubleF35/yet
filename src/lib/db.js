/**
 * Accesso a Firestore.
 *
 * Tutte le pagine passano da qui: nessun componente importa direttamente
 * `firebase/firestore`. Così se domani cambia il modello dati (o il database),
 * il punto da toccare è uno solo.
 *
 * Le funzioni che scrivono lasciano risalire l'errore al chiamante, sono le
 * pagine a sapere dove mostrarlo, ma lo rivestono con un messaggio leggibile.
 */

import {
  addDoc,
  collection,
  getCountFromServer,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import { auth, db, isFirebaseConfigured } from './firebase.js'
import { isAdminEmail } from '../config/admins.js'
import { normalizeAttachments } from './attachments.js'

/** Limite della bio, in caratteri. Vive qui perché lo usano sia il contatore
 *  della pagina Join sia, soprattutto, le regole in firestore.rules, che
 *  sono la validazione vera. Se lo cambi qui, cambialo anche nelle rules. */
export const BIO_MAX = 300

/** Da dove scrive un membro: "Torino", "Bari", "Provincia di Cuneo".
 *  Corto apposta, è un'informazione da riga sotto il nome, non un indirizzo.
 *  Se lo cambi qui, cambialo anche in firestore.rules. */
export const LOCATION_MAX = 60

/** Quanto può essere lunga la stringa della foto profilo.
 *  Copre sia un indirizzo incollato (poche centinaia di caratteri) sia una
 *  foto caricata e compressa (un data URL da qualche decina di migliaia).
 *  Allineato a firestore.rules: se lo cambi qui, cambialo anche là. */
export const PHOTO_MAX_CHARS = 100000

const USERS = 'users'
const NEWS = 'news'
const MEDIA = 'media'

/** Limite del corpo di una notizia. Come BIO_MAX: il valore vero è nelle
 *  regole, questo serve a non far scoprire il limite all'utente dopo che ha
 *  scritto ventimila caratteri. Se lo cambi qui, cambialo in firestore.rules. */
export const BODY_MAX = 20000

/**
 * Abbassa SOLO lo schema di un URL.
 *
 * Il motivo è una divergenza sottile fra due validazioni che sembravano
 * d'accordo. Il client controlla l'URL con `new URL(v).protocol`, e l'API URL
 * normalizza lo schema a minuscolo: `HTTPS://esempio.it/x.jpg` viene quindi
 * accettato. Ma poi salvavamo la stringa GREZZA, e la regola la controlla con
 * `matches('https?://.*')`, che è RE2 e case-sensitive: `HTTPS://` non
 * corrisponde e la scrittura viene respinta con un permission-denied che non
 * c'entra niente con i permessi. Capita davvero, incollando da certi client di
 * posta o da Word con l'autocorrezione.
 *
 * Si tocca solo lo schema: il resto di un URL è case-sensitive, e abbassare
 * tutto romperebbe i percorsi delle immagini.
 */
function normalizeUrlScheme(value) {
  const raw = String(value ?? '').trim()
  return raw.replace(/^([A-Za-z][A-Za-z0-9+.-]*):/, (m, scheme) => `${scheme.toLowerCase()}:`)
}

/**
 * Il ruolo da scrivere nel profilo dell'utente collegato.
 *
 * Perché un campo e non un confronto lato client: i documenti `users` non
 * contengono l'email, è una promessa esplicita dell'informativa privacy, e
 * quindi la pagina Membri non ha alcun modo di sapere chi è amministratore.
 *
 * Perché è sicuro nonostante lo scriva il client: le regole in
 * firestore.rules pretendono che `role` corrisponda ESATTAMENTE all'esito del
 * confronto fra l'email del token e la allowlist. Un utente che provasse a
 * salvarsi `role: 'admin'` senza essere in lista si vedrebbe rifiutare
 * l'intera scrittura. Il campo è quindi un'informazione derivata, verificata
 * dal server, che non espone l'indirizzo di nessuno.
 */
function currentRole() {
  return isAdminEmail(auth?.currentUser?.email) ? 'admin' : 'member'
}

/* Errore usato quando qualcuno chiama una funzione di scrittura con Firebase
   non configurato. Meglio un messaggio esplicito che un "cannot read property
   of null" tre stack frame più in là. */
function notConfigured() {
  const error = new Error(
    'Firebase non è configurato: copia .env.example in .env, riempi i valori e riavvia il server.',
  )
  error.code = 'app/not-configured'
  return error
}

/* --------------------------------------------------------------------------
   Date

   Firestore restituisce un Timestamp, ma nello stesso stato React possono
   passare anche un Date (ottimismo locale), un numero (millisecondi) o null
   (serverTimestamp non ancora risolto). Convertiamo tutto in Date, o niente.
-------------------------------------------------------------------------- */
export function toDate(value) {
  if (!value) return null
  // Timestamp di Firestore: ha toDate(). Non usiamo instanceof perché con
  // due copie del SDK in memoria (succede con le dipendenze duplicate)
  // fallirebbe pur essendo lo stesso tipo.
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate()
    } catch {
      return null
    }
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'string') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * "8 agosto 2026".
 *
 * Con `value` nullo torna 'in pubblicazione': è il caso di una notizia appena
 * creata, il cui serverTimestamp non è ancora tornato dal server. Dura meno di
 * un secondo, ma senza questo ramo si vedrebbe "Invalid Date".
 */
export function formatDate(value) {
  const date = toDate(value)
  if (!date) return 'in pubblicazione'
  return dateFormatter.format(date)
}

/** Millisecondi per l'ordinamento. Un documento senza data va in cima: è
 *  appena stato scritto da noi, quindi è il più recente. */
function sortKey(value) {
  const date = toDate(value)
  return date ? date.getTime() : Number.POSITIVE_INFINITY
}

/* --------------------------------------------------------------------------
   Notizie
-------------------------------------------------------------------------- */

/**
 * Ascolta la collection `news` in tempo reale.
 *
 * @returns una funzione di disiscrizione. Chiamala SEMPRE nel cleanup
 *          dell'effetto: un listener lasciato aperto continua a consumare
 *          quota e a chiamare setState su un componente smontato.
 *
 * PERCHÉ L'ORDINAMENTO È LATO CLIENT E NON NELLA QUERY.
 *
 * La versione naturale - `where('published','==',true)` più
 * `orderBy('createdAt','desc')`, è una query COMPOSTA, e Firestore per quelle
 * pretende un indice creato a mano. Finché non lo crei risponde
 * `failed-precondition` e il feed resta vuoto: un sito appena installato
 * sembra rotto, e l'errore non dice a nessuno che deve aprire la console e
 * cliccare un link. Il filtro da solo, invece, usa l'indice automatico su
 * campo singolo e funziona sempre.
 *
 * Il riordino ci serviva comunque, e questo è il secondo motivo per farlo qui:
 * una notizia appena creata arriva in locale con `createdAt` a null, perché
 * `serverTimestamp()` si risolve solo dopo il giro sul server. Firestore la
 * metterebbe in fondo; noi trattiamo il null come "adesso" e la mettiamo in
 * cima, che è dove l'admin si aspetta di vederla.
 *
 * Il prezzo è che scarichiamo tutte le notizie pubblicate invece delle prime
 * N. Con un feed da club va benissimo. QUANDO RIVEDERE QUESTA SCELTA: se le
 * notizie superano qualche centinaio, crea l'indice composto (published ASC,
 * createdAt DESC) e rimetti l'orderBy qui insieme a un limit().
 */
export function listenNews({ onlyPublished = true } = {}, onData, onError) {
  if (!isFirebaseConfigured) {
    onError?.(notConfigured())
    return () => {}
  }

  const constraints = []
  if (onlyPublished) constraints.push(where('published', '==', true))

  const q = query(collection(db, NEWS), ...constraints)

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => sortKey(b.createdAt) - sortKey(a.createdAt))
      onData?.(items)
    },
    (error) => {
      // Il caso quasi certo alla prima esecuzione: le regole non sono state
      // deployate, oppure manca l'indice composto (published + createdAt).
      // Firestore in quel caso mette in console un link per crearlo: diciamolo.
      // Non dovrebbe più capitare, ora che la query non è composta. Se
      // ricapita vuol dire che qualcuno ha rimesso un orderBy o un secondo
      // where: il messaggio di Firestore contiene un link che crea l'indice
      // giusto con un clic, quindi conviene farlo vedere invece di inghiottirlo.
      if (error?.code === 'failed-precondition') {
        console.error(
          '[YET] Firestore chiede un indice composto per questa query. Il link qui ' +
            'sotto lo crea: aprilo e premi "Crea indice".',
          error,
        )
      }
      onError?.(error)
    },
  )
}

export async function createNews({ title, body, published, attachments }, author) {
  if (!isFirebaseConfigured) throw notConfigured()

  const cleanTitle = String(title ?? '').trim()
  const cleanBody = String(body ?? '').trim()
  if (!cleanTitle) throw new Error('Il titolo non può essere vuoto.')
  if (!cleanBody) throw new Error('Il corpo non può essere vuoto.')
  if (cleanBody.length > BODY_MAX) {
    throw new Error(
      `Il corpo supera i ${BODY_MAX.toLocaleString('it-IT')} caratteri consentiti ` +
        `(ne hai ${cleanBody.length.toLocaleString('it-IT')}).`,
    )
  }

  const ref = await addDoc(collection(db, NEWS), {
    title: cleanTitle,
    body: cleanBody,
    // normalizeAttachments scarta quel che non è un http(s) valido, toglie i
    // doppioni e tronca al massimo: quel che finisce nel documento è già
    // pulito, e la pagina che lo legge non deve rifare il lavoro.
    attachments: normalizeAttachments(attachments),
    published: Boolean(published),
    authorUid: author?.uid ?? null,
    authorName: author?.displayName || author?.name || 'Redazione YET',
    // serverTimestamp e non new Date(): l'orologio del browser dell'admin può
    // essere sbagliato di ore, e l'ordine del feed ne risentirebbe.
    // Le regole pretendono createdAt == request.time, quindi è anche obbligatorio.
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateNews(id, patch) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (!id) throw new Error('Manca l’identificativo della notizia.')

  const allowed = {}
  if (typeof patch.title === 'string') allowed.title = patch.title.trim()
  if (typeof patch.body === 'string') {
    allowed.body = patch.body.trim()
    if (allowed.body.length > BODY_MAX) {
      throw new Error(`Il corpo supera i ${BODY_MAX.toLocaleString('it-IT')} caratteri consentiti.`)
    }
  }
  if (typeof patch.published === 'boolean') allowed.published = patch.published
  // Il confronto con undefined e non un controllo di verità: un array vuoto
  // significa "togli tutti gli allegati" ed è una modifica legittima.
  if (patch.attachments !== undefined) {
    allowed.attachments = normalizeAttachments(patch.attachments)
  }

  if (Object.keys(allowed).length === 0) return
  // Nessun createdAt e nessun authorUid qui dentro: le regole rifiutano che
  // cambino, e provarci farebbe fallire l'intera scrittura.
  await updateDoc(doc(db, NEWS, id), allowed)
}

export async function deleteNews(id) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (!id) throw new Error('Manca l’identificativo della notizia.')
  await deleteDoc(doc(db, NEWS, id))
}

/* --------------------------------------------------------------------------
   Profili
-------------------------------------------------------------------------- */

/**
 * I profili APPROVATI. È l'elenco pubblico della pagina Membri.
 *
 * Il `where` non è un filtro di comodo: le regole concedono la lettura
 * pubblica solo ai documenti approvati, e Firestore non filtra i risultati
 * pretende che la query sia costruita in modo che ogni risultato soddisfi la
 * regola. Senza questo where l'intera query verrebbe rifiutata con
 * `permission-denied`, non "filtrata".
 */
export async function listUsers() {
  if (!isFirebaseConfigured) throw notConfigured()

  const snapshot = await getDocs(
    query(collection(db, USERS), where('status', '==', 'approved')),
  )
  return snapshot.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => {
      // Ordine stabile: prima chi si è iscritto prima, e a parità (o senza
      // data) in ordine alfabetico. Un elenco che cambia ordine a ogni
      // caricamento sembra un bug anche quando non lo è.
      const ta = sortKey(a.createdAt)
      const tb = sortKey(b.createdAt)
      if (ta !== tb && Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb
      return String(a.displayName ?? '').localeCompare(String(b.displayName ?? ''), 'it')
    })
}

export async function getUserProfile(uid) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (!uid) return null

  const snapshot = await getDoc(doc(db, USERS, uid))
  return snapshot.exists() ? { uid: snapshot.id, ...snapshot.data() } : null
}

/**
 * Crea o aggiorna users/{uid}.
 *
 * `createdAt` viene scritto solo se il documento non esisteva: le regole
 * vietano di cambiarlo in update, quindi rimandarlo a ogni salvataggio farebbe
 * fallire tutti i salvataggi successivi al primo. Da qui la lettura preventiva.
 */
export async function saveUserProfile(uid, data) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (!uid) throw new Error('Manca l’identificativo dell’utente.')

  const displayName = String(data.displayName ?? '').trim()
  if (!displayName) throw new Error('Il nome non può essere vuoto.')

  const photo = String(data.photoURL ?? '').trim().startsWith('data:')
    ? String(data.photoURL).trim()
    : normalizeUrlScheme(data.photoURL).slice(0, 500)

  if (photo.length > PHOTO_MAX_CHARS) {
    throw new Error('La foto profilo è troppo grande. Caricane una più piccola.')
  }

  const location = String(data.location ?? '').trim()
  if (location.length > LOCATION_MAX) {
    throw new Error(`La provenienza supera i ${LOCATION_MAX} caratteri.`)
  }

  const bio = String(data.bio ?? '').trim()
  if (bio.length > BIO_MAX) {
    throw new Error(`La bio supera i ${BIO_MAX} caratteri.`)
  }

  const ref = doc(db, USERS, uid)
  const existing = await getDoc(ref)

  const payload = {
    displayName: displayName.slice(0, 80),
    location,
    bio,
    /* Una foto caricata è un data URL lungo decine di migliaia di caratteri:
       il vecchio slice(0, 500) l'avrebbe troncata a metà, producendo
       un'immagine rotta e, peggio, nessun errore. Il tetto vero è
       PHOTO_MAX_CHARS, e viene fatto rispettare prima, con un messaggio. */
    photoURL: photo,
    socials: {
      linkedin: String(data.socials?.linkedin ?? '').trim().slice(0, 200),
      instagram: String(data.socials?.instagram ?? '').trim().slice(0, 200),
      other: String(data.socials?.other ?? '').trim().slice(0, 200),
    },
    role: currentRole(),
    updatedAt: serverTimestamp(),
  }

  /* Lo status iniziale: approvato per gli admin, in attesa per tutti gli altri.
     Gli admin nascono approvati perché farli passare dalla loro stessa coda
     sarebbe un giro a vuoto, e al primo avvio non ci sarebbe nessuno ad
     approvare il primo di loro. */
  const initialStatus = currentRole() === 'admin' ? 'approved' : 'pending'

  if (!existing.exists()) {
    payload.createdAt = serverTimestamp()
    payload.status = initialStatus
  } else if (existing.data()?.status === undefined) {
    /* Documento nato prima che l'approvazione esistesse.
       Va migrato QUI, al primo salvataggio, perché le regole non possono
       leggere un campo che non c'è: `stored().status` su una chiave assente
       non vale "vuoto", fa fallire l'intera condizione, e il salvataggio
       verrebbe respinto con un permission-denied che non spiega niente.
       Il valore deve combaciare con il ripiego di storedStatus() in
       firestore.rules, se cambi uno, cambia anche l'altro. */
    payload.status = initialStatus
  }
  /* Negli altri casi lo status NON si tocca: le regole pretendono che resti
     identico a quello sul server, ed è la riga che impedisce di auto-approvarsi
     salvando di nuovo il proprio profilo. */

  // merge: true perché un domani il documento potrebbe avere campi scritti
  // altrove; un set secco li cancellerebbe in silenzio.
  await setDoc(ref, payload, { merge: true })
  return payload
}

/**
 * Cancella users/{uid}.
 *
 * Le regole permettono la cancellazione solo al proprietario del documento
 * nemmeno un admin può togliere di mezzo il profilo di un altro. Serve al
 * diritto di cancellazione (art. 17 GDPR) e alla pagina Join, che espone il
 * bottone: una privacy policy che promette la cancellazione senza un modo per
 * chiederla è una promessa e basta.
 *
 * NOTA: questo toglie il PROFILO, non l'account Firebase. A cancellare anche
 * l'account pensa `deleteAccount()` in lib/auth.jsx, che chiama questa e poi
 * rimuove l'utente da Authentication.
 */
export async function deleteUserProfile(uid) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (!uid) throw new Error('Manca l’identificativo dell’utente.')
  await deleteDoc(doc(db, USERS, uid))
}

/**
 * Il documento del primo accesso.
 *
 * Chiamato da auth.jsx quando users/{uid} non esiste ancora. Riempie quel che
 * Google ci dà e lascia il resto vuoto, così il profilo compare fra i membri
 * anche prima che l'utente passi dalla pagina Join.
 */
export async function createUserProfileFromGoogle(user) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (!user?.uid) throw new Error('Utente non valido.')

  const payload = {
    displayName: (user.displayName || user.email?.split('@')[0] || 'Membro YET').slice(0, 80),
    location: '',
    bio: '',
    photoURL: normalizeUrlScheme(user.photoURL).slice(0, 500),
    socials: { linkedin: '', instagram: '', other: '' },
    role: currentRole(),
    status: currentRole() === 'admin' ? 'approved' : 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(db, USERS, user.uid), payload, { merge: true })
  return payload
}

/**
 * Riallinea `role` se la allowlist è cambiata dopo l'iscrizione.
 *
 * Il caso vero: qualcuno viene aggiunto (o tolto) da ADMIN_EMAILS mesi dopo
 * essersi registrato. Il suo documento continuerebbe a dire `member`, e la
 * sezione Admin della pagina Membri non lo mostrerebbe, pur vedendo lui il
 * pannello /admin, perché quello guarda l'email e non il documento. Due verità
 * diverse per la stessa persona: il tipo di incoerenza che poi nessuno capisce.
 *
 * Scrive solo se il valore è diverso da quello atteso, quindi al login normale
 * non costa nulla.
 */
export async function reconcileUserRole(uid, existing) {
  if (!isFirebaseConfigured || !uid) return null

  const expected = currentRole()
  const roleOutdated = existing?.role !== expected
  // Un profilo nato prima dell'approvazione non ha status: va sanato adesso,
  // perché senza quel campo TUTTI i salvataggi successivi verrebbero respinti
  // (le regole non possono leggere una chiave assente, vedi storedStatus()
  // in firestore.rules).
  const statusMissing = existing?.status === undefined

  if (!roleOutdated && !statusMissing) return null

  const patch = { role: expected, updatedAt: serverTimestamp() }
  if (statusMissing) patch.status = expected === 'admin' ? 'approved' : 'pending'

  await updateDoc(doc(db, USERS, uid), patch)
  return { role: expected, status: patch.status ?? existing?.status }
}

/* --------------------------------------------------------------------------
   Coda delle richieste di iscrizione
-------------------------------------------------------------------------- */

/**
 * Le richieste in attesa. Solo gli admin possono leggerle: le regole
 * concedono la lettura di un profilo non approvato al proprietario e agli
 * amministratori, e a nessun altro.
 *
 * In ordine di arrivo, non inverso: una coda si smaltisce dal più vecchio,
 * altrimenti chi ha chiesto per primo resta in fondo per sempre.
 */
export async function listPendingUsers() {
  if (!isFirebaseConfigured) throw notConfigured()

  const snapshot = await getDocs(
    query(collection(db, USERS), where('status', '==', 'pending')),
  )
  return snapshot.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => sortKey(a.createdAt) - sortKey(b.createdAt))
}

/**
 * Approva o rifiuta una richiesta.
 *
 * Scrive solo `status` e `updatedAt`: le regole rifiutano qualsiasi altra
 * modifica fatta da un admin sul documento di un altro. Un rifiuto non
 * cancella niente, resta reversibile, e il diretto interessato continua a
 * vedere il proprio profilo (nessun altro lo vede).
 */
export async function setUserStatus(uid, status) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (!uid) throw new Error('Manca l’identificativo dell’utente.')
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new Error(`Stato non valido: ${status}`)
  }

  await updateDoc(doc(db, USERS, uid), { status, updatedAt: serverTimestamp() })
}

/**
 * Quanti membri approvati ci sono.
 *
 * `getCountFromServer` e non un getDocs seguito da .length: l'aggregazione la
 * calcola il server e ci rimanda un numero, senza spedire i documenti. Costa
 * una lettura ogni mille documenti invece di una per documento, e non scarica
 * bio e foto di tutti per poi buttarle via, il che conta, perché questo
 * numero sta sulla home e la home la apre chiunque.
 *
 * Il filtro su status è obbligatorio, non estetico: le regole concedono la
 * lettura pubblica ai soli profili approvati, e senza il where l'aggregazione
 * verrebbe rifiutata in blocco.
 */
export async function countApprovedUsers() {
  if (!isFirebaseConfigured) throw notConfigured()

  const snap = await getCountFromServer(
    query(collection(db, USERS), where('status', '==', 'approved')),
  )
  return snap.data().count
}

/* --------------------------------------------------------------------------
   media/, i file caricati, uno per documento

   Perché una collection a parte e non un campo dentro la notizia: un documento
   Firestore non può superare 1 MiB, e quel megabyte dovrebbe bastare al testo
   E a tutte le foto insieme. Separandoli, ogni immagine ha il suo megabyte e
   la notizia resta piccola, il che si sente anche in lettura, perché la home
   scarica l'elenco delle notizie senza tirarsi dietro le foto.
-------------------------------------------------------------------------- */

/** Salva un file già compresso e restituisce l'id del documento. */
export async function createMedia({ dataUrl, contentType, name, width, height, bytes }, author) {
  if (!isFirebaseConfigured) throw notConfigured()
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    throw new Error('Contenuto del file non valido.')
  }

  const ref = await addDoc(collection(db, MEDIA), {
    dataUrl,
    contentType: String(contentType || 'application/octet-stream'),
    name: String(name || 'file').slice(0, 120),
    width: Number(width) || 0,
    height: Number(height) || 0,
    bytes: Number(bytes) || dataUrl.length,
    authorUid: author?.uid ?? null,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * Legge più media in un colpo solo, saltando quelli già in memoria.
 *
 * La cache non è un'ottimizzazione prematura: la stessa immagine compare nella
 * card e poi di nuovo se la notizia viene riletta dopo un aggiornamento del
 * listener, e senza cache la rileggeremmo ogni volta, con documenti da
 * quasi un megabyte, si vedrebbe.
 */
const mediaCache = new Map()

export async function getMedia(ids) {
  if (!isFirebaseConfigured) return {}

  const daLeggere = [...new Set(ids.filter((id) => id && !mediaCache.has(id)))]
  await Promise.all(
    daLeggere.map(async (id) => {
      try {
        const snap = await getDoc(doc(db, MEDIA, id))
        // Anche l'assenza va messa in cache: un id rimasto in una notizia
        // vecchia il cui file è stato cancellato verrebbe altrimenti richiesto
        // a ogni render, per sempre.
        mediaCache.set(id, snap.exists() ? { id: snap.id, ...snap.data() } : null)
      } catch (error) {
        console.warn('[YET] Non riesco a leggere il media', id, error)
        mediaCache.set(id, null)
      }
    }),
  )

  const out = {}
  for (const id of ids) {
    if (id && mediaCache.get(id)) out[id] = mediaCache.get(id)
  }
  return out
}

/** Cancella un file caricato. Non lancia: chi lo chiama sta già togliendo
 *  l'allegato, e un errore qui sarebbe rumore su un'operazione riuscita. */
export async function deleteMedia(id) {
  if (!isFirebaseConfigured || !id) return false
  try {
    await deleteDoc(doc(db, MEDIA, id))
    mediaCache.delete(id)
    return true
  } catch (error) {
    console.warn('[YET] Non riesco a cancellare il media', id, error)
    return false
  }
}
