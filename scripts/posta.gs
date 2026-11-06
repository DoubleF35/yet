/**
 * LA POSTA DI YET, SU GOOGLE APPS SCRIPT.
 *
 * QUESTO FILE NON FA PARTE DEL SITO. Sta nel repo per non perderlo e per
 * poterne leggere la storia, ma gira su script.google.com, legato all'account
 * Gmail di YET. Il README spiega come pubblicarlo; qui c'e' solo il perche'.
 *
 * ------------------------------------------------------------------------
 * PERCHE' ESISTE
 *
 * Il sito e' fatto di file statici su GitHub Pages e usa Firebase sul piano
 * gratuito, dove le Cloud Functions non ci sono. Mandare una mail pero' vuole
 * del codice che giri da qualche parte che non sia il browser di chi si
 * iscrive: una chiave di posta messa nel sito la leggerebbe chiunque apra il
 * codice, e diventerebbe un modo per spedire posta a nome di YET.
 *
 * Apps Script e' quel "da qualche parte". E' gratis, non vuole una carta, e
 * la mail parte dall'account Gmail che possiede lo script, quindi dall'
 * indirizzo vero di YET: le risposte tornano dove devono e la posta non
 * finisce nello spam come succede con un mittente inventato.
 *
 * ------------------------------------------------------------------------
 * LA COSA DA NON SBAGLIARE
 *
 * Questo indirizzo e' PUBBLICO: chiunque lo trovi nel codice del sito puo'
 * chiamarlo. Quindi la regola, che e' una sola e non si tocca:
 *
 *     CHI CHIAMA NON SCEGLIE NIENTE.
 *
 * Il corpo della richiesta porta un token di accesso e, al massimo, un
 * identificativo. I destinatari li decide questo file, e il testo pure:
 *
 *   ISCRIZIONE   l'indirizzo di YET, piu' quello scritto DENTRO il token
 *   CONFERMA     solo un admin la puo' chiedere, e l'indirizzo e' quello che
 *                questo script si e' tenuto il giorno dell'iscrizione Non si accetta ne' un indirizzo, ne' un oggetto,
 * ne' una riga di messaggio. Il giorno in cui qualcuno aggiunge un parametro
 * "testo" per comodita', questo script diventa un megafono per spammer.
 *
 * Il token si verifica chiamando Google, non leggendolo: un token si scrive
 * a mano in dieci secondi, mentre la verifica dice se e' stato davvero
 * emesso dal progetto Firebase di YET e se non e' scaduto.
 *
 * ------------------------------------------------------------------------
 * I LIMITI, che sono quelli di un account Gmail normale
 *
 * 100 destinatari al giorno. Qui ogni iscrizione ne consuma due, quindi si
 * sta larghi fino a una cinquantina di iscrizioni in un giorno solo. Oltre,
 * MailApp smette di mandare e scrive l'errore nel registro delle esecuzioni:
 * le candidature continuano comunque ad arrivare sul sito, perche' la mail e'
 * un avviso e non il posto dove i dati vivono.
 */

/* --------------------------------------------------------------------------
   LE TRE COSE DA RIEMPIERE PRIMA DI PUBBLICARE
   -------------------------------------------------------------------------- */

/** Dove arriva l'avviso. Lo stesso di CONTACT_EMAIL in src/config/socials.js. */
const INDIRIZZO_YET = 'info.yetcommunity@gmail.com'

/**
 * La chiave web del progetto Firebase, cioe' VITE_FIREBASE_API_KEY.
 *
 * NON E' UN SEGRETO: sta gia' dentro il bundle del sito, e va bene cosi'.
 * Qui non serve a proteggere niente, serve a DIRE QUALE PROGETTO: un token
 * emesso da un altro progetto Firebase, verificato con questa chiave, viene
 * rifiutato. E' quello che lega questo script al vostro sito e non a un
 * altro.
 */
const CHIAVE_FIREBASE = 'INCOLLA-QUI-VITE_FIREBASE_API_KEY'

/** L'indirizzo del sito, per i link dentro le mail. */
const SITO = 'https://yetcommunity.it'

/**
 * Chi puo' chiedere la mail di conferma. In minuscolo.
 *
 * E' la stessa lista di adminEmails() in firestore.rules e di ADMIN_EMAILS in
 * src/config/admins.js: tre copie, perche' tre posti diversi (il database, il
 * sito, questo script) devono saperlo e nessuno dei tre puo' chiederlo agli
 * altri. Se aggiungi un admin, aggiungilo in tutti e tre e ripubblica.
 */
const AMMINISTRATORI = [
  'fedefas.210@gmail.com',
  'greta.dal19@gmail.com',
  'lucafrancesco.rollino3@gmail.com',
  'mattiapapa.075@gmail.com',
]

/* --------------------------------------------------------------------------
   IL PUNTO DI INGRESSO
   -------------------------------------------------------------------------- */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return rispondi({ ok: false, errore: 'corpo mancante' })
    }

    var corpo = JSON.parse(e.postData.contents)
    var token = corpo.idToken
    /* La lingua e' l'unica cosa che chi chiama puo' davvero scegliere, e non
       puo' fare danni: decide quale dei due testi scritti qui sotto parte. */
    var lingua = corpo.lang === 'en' ? 'en' : 'it'

    if (!token || typeof token !== 'string') {
      return rispondi({ ok: false, errore: 'token mancante' })
    }

    var utente = verificaToken(token)
    if (!utente) {
      return rispondi({ ok: false, errore: 'token non valido' })
    }

    if (corpo.azione === 'accettata') {
      return confermaAccettazione(utente, corpo.uid)
    }

    /* UNA VOLTA SOLA PER PERSONA, per sei ore.
       Il sito chiama questo indirizzo solo alla prima candidatura, ma il
       sito non e' l'unico che puo' chiamarlo: senza questo freno, chi ha un
       account valido potrebbe riempire di posta la casella di YET e la
       propria.

       La cache si scrive DOPO aver mandato e non prima: prima voleva dire
       che una mail fallita (la quota del giorno finita, un intoppo di Gmail)
       bloccava anche il secondo tentativo per sei ore, cioe' che l'avviso
       non arrivava mai. */
    var cache = CacheService.getScriptCache()
    var chiave = 'avvisata-' + utente.uid
    if (cache.get(chiave)) {
      return rispondi({ ok: true, nota: 'gia mandata di recente' })
    }

    /* L'indirizzo si conserva QUI, nelle proprieta' dello script, e non nel
       database: servira' il giorno in cui un admin preme Conferma, per dire
       alla persona che e' dentro. Nel database non ci va perche' i profili
       li legge chiunque e l'informativa promette che l'email non ci finisce;
       qui la vede solo l'account di YET, che l'ha gia' nella mail di avviso. */
    PropertiesService.getScriptProperties().setProperty(
      'iscritto-' + utente.uid,
      JSON.stringify({ email: utente.email, nome: utente.nome, lingua: lingua }),
    )

    mandaAYet(utente)
    mandaAChiSiIscrive(utente, lingua)
    cache.put(chiave, '1', 21600)

    return rispondi({ ok: true })
  } catch (errore) {
    /* L'errore resta nel registro delle esecuzioni e NON torna a chi chiama:
       un messaggio dettagliato verso l'esterno racconta com'e' fatto dentro
       un indirizzo che chiunque puo' interrogare. */
    console.error(errore)
    return rispondi({ ok: false, errore: 'errore interno' })
  }
}

/** Aprendo l'indirizzo con il browser si legge questo, invece di un errore. */
function doGet() {
  return rispondi({ ok: true, cosa: 'La posta di YET. Si usa con una POST.' })
}

/* --------------------------------------------------------------------------
   LA VERIFICA
   -------------------------------------------------------------------------- */

/**
 * Chiede a Google se questo token vale, e chi e'.
 *
 * Si usa accounts:lookup e non si legge il contenuto del token: leggerlo
 * direbbe soltanto cosa c'e' scritto dentro, e dentro ci si scrive quello che
 * si vuole. Questa chiamata invece risponde solo per un token emesso davvero
 * dal progetto a cui appartiene CHIAVE_FIREBASE, e solo finche' non e'
 * scaduto.
 *
 * Torna null per qualunque motivo di rifiuto, senza distinguerli: a chi
 * chiama non serve sapere se il token era scaduto o inventato.
 */
function verificaToken(token) {
  var url =
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' +
    encodeURIComponent(CHIAVE_FIREBASE)

  var risposta = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ idToken: token }),
    muteHttpExceptions: true,
  })

  if (risposta.getResponseCode() !== 200) return null

  var dati = JSON.parse(risposta.getContentText())
  var trovato = dati.users && dati.users[0]
  if (!trovato || !trovato.email) return null

  return {
    uid: trovato.localId,
    email: trovato.email,
    /* Il nome viene da Google, non da chi chiama. Puo' non esserci: chi
       usa un account senza nome resta "una persona" invece di diventare
       una riga vuota. */
    nome: trovato.displayName || '',
    /* Serve per gli admin: la lista li riconosce dall'indirizzo, e un
       indirizzo non verificato e' un indirizzo che chiunque puo' dichiarare.
       Con l'accesso Google e' sempre vero; lo si controlla lo stesso, per lo
       stesso motivo per cui lo controllano le regole del database. */
    verificata: trovato.emailVerified === true,
  }
}

/* --------------------------------------------------------------------------
   LA CONFERMA
   -------------------------------------------------------------------------- */

/**
 * "Sei dentro": la chiede un admin quando preme Conferma nel pannello.
 *
 * Tre controlli, e nessuno si salta:
 *   1. chi chiama e' un admin, con l'indirizzo verificato;
 *   2. la persona si e' iscritta da quando le mail esistono, cosi' questo
 *      script ha il suo indirizzo (chi si e' iscritto prima non ce l'ha:
 *      in quel caso si dice e basta, e il pannello avvisa di scrivergli a
 *      mano);
 *   3. non le e' gia' stata mandata nelle ultime sei ore, cosi' un doppio
 *      clic non diventa due mail.
 */
function confermaAccettazione(admin, uid) {
  if (!admin.verificata || AMMINISTRATORI.indexOf(admin.email.toLowerCase()) === -1) {
    return rispondi({ ok: false, errore: 'non sei un admin' })
  }
  if (!uid || typeof uid !== 'string' || uid.length > 128) {
    return rispondi({ ok: false, errore: 'chi?' })
  }

  var salvato = PropertiesService.getScriptProperties().getProperty('iscritto-' + uid)
  if (!salvato) {
    return rispondi({ ok: false, errore: 'indirizzo sconosciuto' })
  }

  var cache = CacheService.getScriptCache()
  var chiave = 'accettata-' + uid
  if (cache.get(chiave)) {
    return rispondi({ ok: true, nota: 'gia mandata di recente' })
  }

  var persona = JSON.parse(salvato)
  mandaAccettazione(persona)
  cache.put(chiave, '1', 21600)
  return rispondi({ ok: true })
}

/* --------------------------------------------------------------------------
   LE DUE MAIL
   -------------------------------------------------------------------------- */

/**
 * L'avviso a YET.
 *
 * Dentro c'e' il minimo: chi e' e dove guardare. Le risposte di selezione NON
 * ci finiscono, ed e' voluto: stanno dietro l'accesso del pannello, dove le
 * legge chi ha il diritto di leggerle, e una casella di posta e' il posto
 * sbagliato per una data di nascita e un numero di telefono.
 *
 * replyTo sull'indirizzo di chi si iscrive: cosi' "Rispondi" scrive a lui.
 */
function mandaAYet(utente) {
  var nome = utente.nome || 'Una persona'

  MailApp.sendEmail({
    to: INDIRIZZO_YET,
    replyTo: utente.email,
    name: 'YET',
    subject: 'Nuova candidatura: ' + nome,
    htmlBody:
      '<p><strong>' + scappa(nome) + '</strong> ha mandato la candidatura.</p>' +
      '<p>Indirizzo: ' + scappa(utente.email) + '</p>' +
      '<p><a href="' + SITO + '/admin/candidature">Apri le candidature</a></p>' +
      '<hr>' +
      '<p style="color:#666;font-size:13px">Le risposte e i contatti stanno nel pannello, ' +
      'non in questa mail: li' + "'" + ' sono protetti dall' + "'" + 'accesso, qui no.</p>',
  })
}

/**
 * La conferma a chi si e' iscritto.
 *
 * Dice tre cose e si ferma: e' arrivata, non e' ancora approvata, e si puo'
 * cancellare quando si vuole. Promettere tempi che non si possono mantenere
 * ("ti rispondiamo entro 48 ore") e' il modo piu' veloce per deludere
 * qualcuno che ha appena deciso di fidarsi.
 */
function mandaAChiSiIscrive(utente, lingua) {
  var nome = utente.nome ? utente.nome.split(' ')[0] : ''

  var testi = {
    it: {
      oggetto: 'La tua candidatura a YET è arrivata',
      ciao: nome ? 'Ciao ' + scappa(nome) + ',' : 'Ciao,',
      corpo:
        '<p>abbiamo ricevuto la tua candidatura. Adesso la leggiamo: finché non è ' +
        'approvata il tuo profilo non compare fra i membri e non lo vede nessun altro.</p>' +
        '<p>Ti scriviamo noi, su WhatsApp o qui. Nel frattempo puoi correggere quello ' +
        'che hai scritto dalla <a href="' + SITO + '/join">tua pagina</a>, e da lì puoi ' +
        'anche cancellare tutto quando vuoi.</p>' +
        '<p>A presto,<br>YET</p>',
    },
    en: {
      oggetto: 'Your YET application has arrived',
      ciao: nome ? 'Hi ' + scappa(nome) + ',' : 'Hi,',
      corpo:
        '<p>we have received your application. We are reading it now: until it is ' +
        'approved your profile does not show up among the members and nobody else sees it.</p>' +
        '<p>We will get in touch, on WhatsApp or here. In the meantime you can change what ' +
        'you wrote from <a href="' + SITO + '/join">your page</a>, and from there you can ' +
        'also delete everything whenever you want.</p>' +
        '<p>See you soon,<br>YET</p>',
    },
  }

  var testo = testi[lingua]

  MailApp.sendEmail({
    to: utente.email,
    replyTo: INDIRIZZO_YET,
    name: 'YET',
    subject: testo.oggetto,
    htmlBody: '<p>' + testo.ciao + '</p>' + testo.corpo,
  })
}

/**
 * La mail a chi e' stato confermato.
 *
 * Dice che il profilo adesso e' nel sito e dove sistemarlo. La ragione per
 * mandarla e' quella seconda cosa: chi si e' iscritto settimane fa non si
 * ricorda cosa ha scritto, e scoprirlo in vetrina insieme a tutti gli altri
 * non e' bello.
 */
function mandaAccettazione(persona) {
  var nome = persona.nome ? persona.nome.split(' ')[0] : ''

  var testi = {
    it: {
      oggetto: 'Sei dentro YET',
      ciao: nome ? 'Ciao ' + scappa(nome) + ',' : 'Ciao,',
      corpo:
        '<p>abbiamo letto la tua candidatura e sei dentro: il tuo profilo adesso compare ' +
        'fra i membri, su <a href="' + SITO + '/vetrina">yetcommunity.it</a>.</p>' +
        '<p>Se vuoi cambiare qualcosa — la foto, la presentazione, un link — lo fai ' +
        'dalla <a href="' + SITO + '/join">tua pagina</a>, quando vuoi.</p>' +
        '<p>Benvenuto,<br>YET</p>',
    },
    en: {
      oggetto: 'You are in YET',
      ciao: nome ? 'Hi ' + scappa(nome) + ',' : 'Hi,',
      corpo:
        '<p>we have read your application and you are in: your profile now shows up ' +
        'among the members, on <a href="' + SITO + '/vetrina">yetcommunity.it</a>.</p>' +
        '<p>If you want to change something — the photo, the introduction, a link — you ' +
        'can do it from <a href="' + SITO + '/join">your page</a>, whenever you like.</p>' +
        '<p>Welcome,<br>YET</p>',
    },
  }

  var testo = testi[persona.lingua === 'en' ? 'en' : 'it']

  MailApp.sendEmail({
    to: persona.email,
    replyTo: INDIRIZZO_YET,
    name: 'YET',
    subject: testo.oggetto,
    htmlBody: '<p>' + testo.ciao + '</p>' + testo.corpo,
  })
}

/* --------------------------------------------------------------------------
   DUE AIUTANTI
   -------------------------------------------------------------------------- */

/**
 * Il nome di una persona finisce dentro dell'HTML, quindi va scappato.
 *
 * Viene da Google e non da chi chiama, quindi non e' il caso piu' pericoloso
 * del mondo. Ma un nome con dentro una virgoletta romperebbe comunque il
 * messaggio, e scappare costa quattro righe.
 */
function scappa(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function rispondi(oggetto) {
  return ContentService.createTextOutput(JSON.stringify(oggetto)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
