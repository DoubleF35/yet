/**
 * Accesso a Firestore.
 *
 * Tutte le pagine passano da qui: nessun componente importa direttamente
 * `firebase/firestore`. Così se domani cambia il modello dati (o il database),
 * il punto da toccare è uno solo.
 *
 * Le funzioni che scrivono lasciano risalire l'errore al chiamante — sono le
 * pagine a sapere dove mostrarlo — ma lo rivestono con un messaggio leggibile.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db, isFirebaseConfigured } from './firebase.js'

/** Limite della bio, in caratteri. Vive qui perché lo usano sia il contatore
 *  della pagina Join sia — soprattutto — le regole in firestore.rules, che
 *  sono la validazione vera. Se lo cambi qui, cambialo anche nelle rules. */
export const BIO_MAX = 300

const USERS = 'users'
const NEWS = 'news'

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
 * Sul `createdAt` nullo: quando l'admin crea una notizia, il documento arriva
 * subito in locale con createdAt a null (serverTimestamp si risolve solo dopo
 * il round-trip). Con `orderBy('createdAt', 'desc')` Firestore mette quel
 * documento in fondo, e per un istante la notizia appena scritta compare in
 * coda invece che in cima. Teniamo l'orderBy nella query — serve a Firestore
 * per usare l'indice e a limitare i dati — e riordiniamo lato client, dove il
 * null lo possiamo trattare come "adesso".
 */
export function listenNews({ onlyPublished = true } = {}, onData, onError) {
  if (!isFirebaseConfigured) {
    onError?.(notConfigured())
    return () => {}
  }

  const constraints = []
  if (onlyPublished) constraints.push(where('published', '==', true))
  constraints.push(orderBy('createdAt', 'desc'))

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
      if (error?.code === 'failed-precondition') {
        console.error(
          '[YET] Firestore chiede un indice per questa query. Apri il link che ' +
            'trova qui sotto e clicca "Crea indice": ci mette un minuto.',
          error,
        )
      }
      onError?.(error)
    },
  )
}

export async function createNews({ title, body, published }, author) {
  if (!isFirebaseConfigured) throw notConfigured()

  const cleanTitle = String(title ?? '').trim()
  const cleanBody = String(body ?? '').trim()
  if (!cleanTitle) throw new Error('Il titolo non può essere vuoto.')
  if (!cleanBody) throw new Error('Il corpo non può essere vuoto.')

  const ref = await addDoc(collection(db, NEWS), {
    title: cleanTitle,
    body: cleanBody,
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
  if (typeof patch.body === 'string') allowed.body = patch.body.trim()
  if (typeof patch.published === 'boolean') allowed.published = patch.published

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

export async function listUsers() {
  if (!isFirebaseConfigured) throw notConfigured()

  const snapshot = await getDocs(collection(db, USERS))
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

  const bio = String(data.bio ?? '').trim()
  if (bio.length > BIO_MAX) {
    throw new Error(`La bio supera i ${BIO_MAX} caratteri.`)
  }

  const ref = doc(db, USERS, uid)
  const existing = await getDoc(ref)

  const payload = {
    displayName: displayName.slice(0, 80),
    bio,
    photoURL: String(data.photoURL ?? '').trim().slice(0, 500),
    socials: {
      linkedin: String(data.socials?.linkedin ?? '').trim().slice(0, 200),
      instagram: String(data.socials?.instagram ?? '').trim().slice(0, 200),
      other: String(data.socials?.other ?? '').trim().slice(0, 200),
    },
    updatedAt: serverTimestamp(),
  }
  if (!existing.exists()) payload.createdAt = serverTimestamp()

  // merge: true perché un domani il documento potrebbe avere campi scritti
  // altrove; un set secco li cancellerebbe in silenzio.
  await setDoc(ref, payload, { merge: true })
  return payload
}

/**
 * Cancella users/{uid}.
 *
 * Le regole permettono la cancellazione solo al proprietario del documento —
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
    bio: '',
    photoURL: (user.photoURL || '').slice(0, 500),
    socials: { linkedin: '', instagram: '', other: '' },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(db, USERS, user.uid), payload, { merge: true })
  return payload
}
