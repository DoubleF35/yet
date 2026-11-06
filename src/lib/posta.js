import { auth, isFirebaseConfigured } from './firebase.js'

/**
 * L'AVVISO PER MAIL, QUANDO ARRIVA UNA CANDIDATURA.
 *
 * Due messaggi: uno a YET e uno a chi si e' appena iscritto. A mandarli non
 * e' questo file e non e' il browser: e' uno script su Google Apps Script,
 * legato all'account Gmail di YET, e il suo codice sta in scripts/posta.gs
 * con la spiegazione di tutto il meccanismo. Il README dice come pubblicarlo.
 *
 * QUI DENTRO NON C'E' NIENTE DI SEGRETO, ed e' il punto. Da questa parte
 * passa solo un token di accesso, cioe' la prova che chi chiede e' davvero
 * entrato con Google. I destinatari e il testo li decide lo script, che non
 * accetta ne' un indirizzo ne' una riga di messaggio: l'indirizzo di chi si
 * iscrive lo legge DENTRO il token, non da noi.
 *
 * L'INDIRIZZO DELLO SCRIPT NON E' UNA CHIAVE. Finisce nel bundle come tutto
 * il resto, e va bene: senza un token valido non manda niente.
 */

/* L'indirizzo pubblicato dello script, in .env. Se manca, la funzione non fa
   niente e non si lamenta: un sito senza posta configurata deve restare un
   sito che funziona, e in locale quella variabile non la mette nessuno. */
const INDIRIZZO = import.meta.env.VITE_URL_POSTA ?? ''

/**
 * Avvisa che e' arrivata una candidatura. Non aspetta, non riprova.
 *
 * NON DEVE MAI FAR FALLIRE L'ISCRIZIONE, e la chiamata e' scritta per
 * questo. La candidatura e' gia' salvata su Firestore quando si arriva qui:
 * una mail che non parte e' un avviso perso, un errore mostrato a schermo
 * sarebbe invece una persona convinta di non essersi iscritta, che riprova e
 * riscrive tutto. Di quei due difetti il secondo e' molto peggio.
 *
 * @param {string} lang 'it' o 'en', per sapere in che lingua scrivere
 * @returns {Promise<boolean>} se la richiesta e' partita, per i test e per
 *   chi un domani volesse dirlo a schermo
 */
export async function avvisaDellaCandidatura(lang = 'it') {
  if (!INDIRIZZO || !isFirebaseConfigured) return false

  const utente = auth?.currentUser
  if (!utente) return false

  try {
    const idToken = await utente.getIdToken()

    await fetch(INDIRIZZO, {
      method: 'POST',
      /* text/plain e non application/json, e NON e' una svista: con un tipo
         "non semplice" il browser manda prima una richiesta OPTIONS di
         controllo, e le web app di Apps Script non rispondono a quella. La
         richiesta fallirebbe prima di partire. Lo script legge comunque il
         corpo grezzo e ci fa un JSON.parse. */
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ idToken, lang }),
      /* Se la persona chiude la scheda subito dopo aver mandato, il browser
         lascia comunque partire la richiesta invece di annullarla. */
      keepalive: true,
    })

    return true
  } catch {
    /* In silenzio, e al piano di sopra non risale niente. Vedi sopra. */
    return false
  }
}

/**
 * LA MAIL «SEI DENTRO», quando un admin preme Conferma.
 *
 * Qui il token e' quello DELL'ADMIN, non della persona: lo script controlla
 * che chi chiama sia fra gli amministratori, e solo allora scrive. A chi?
 * Non lo diciamo noi: lo script si e' tenuto l'indirizzo della persona il
 * giorno in cui si e' iscritta, e da qui passa soltanto l'identificativo.
 * Quindi nemmeno un admin puo' usare questa chiamata per scrivere a un
 * indirizzo qualunque, e l'indirizzo continua a non stare nel database.
 *
 * A differenza dell'altra, questa la risposta la legge: chi ha appena
 * confermato qualcuno deve sapere se la mail e' partita o se deve scrivergli
 * lui, e "forse" non e' una risposta che aiuta.
 *
 * @returns {Promise<'mandata'|'sconosciuto'|'spenta'|'errore'>}
 *   sconosciuto: si e' iscritto prima che le mail esistessero, e lo script
 *   il suo indirizzo non l'ha mai visto.
 */
export async function avvisaAccettazione(uid) {
  if (!INDIRIZZO || !isFirebaseConfigured) return 'spenta'
  const admin = auth?.currentUser
  if (!admin || !uid) return 'errore'

  try {
    const idToken = await admin.getIdToken()
    const risposta = await fetch(INDIRIZZO, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ idToken, azione: 'accettata', uid }),
    })
    const dati = await risposta.json()
    if (dati?.ok) return 'mandata'
    if (dati?.errore === 'indirizzo sconosciuto') return 'sconosciuto'
    return 'errore'
  } catch {
    return 'errore'
  }
}
