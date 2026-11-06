/**
 * LE CANDIDATURE VISTE DA CHI DECIDE.
 *
 * Qui dentro non si legge e non si scrive niente: ci sono solo i conti che
 * servono alle due pagine del pannello, /admin/candidature (l'elenco) e
 * /admin/candidature/:uid (la scheda). Stanno in un modulo loro per la
 * ragione per cui ci sta anche il punteggio: due pagine che contano la stessa
 * cosa in due posti diversi, prima o poi, la contano in due modi diversi.
 *
 * LA REGOLA CHE VIENE DA punteggio.js VALE ANCHE QUI: niente di quello che
 * questo file calcola va mai scritto su Firestore. Il punteggio esiste
 * mentre un admin lo guarda e non un minuto di piu'.
 *
 * DUE DOCUMENTI PER PERSONA, E PERCHE'.
 * `candidature/{uid}` ha le risposte di selezione, la data di nascita e il
 * numero di telefono: lo leggono l'interessato e gli admin. `users/{uid}` ha
 * il nome, la citta', la presentazione e i social: lo legge chiunque, perche'
 * e' la vetrina. Il dossier qui sotto li rimette insieme per chi deve
 * decidere, senza che nessuno dei due documenti cambi di posto.
 *
 * L'EMAIL NON C'E', e non e' una dimenticanza: i documenti `users` non la
 * contengono (lo promette l'informativa privacy) e Firebase Authentication
 * non lascia leggere l'indirizzo di un altro da un sito senza server. Chi
 * valuta scrive su WhatsApp, che e' il canale che la persona ha autorizzato
 * mandando la candidatura.
 */

import { anniCompiuti, ETA_MASSIMA, ETA_MINIMA } from '../config/candidatura.js'
import { calcolaPunteggio } from './punteggio.js'

/**
 * LE DUE DECISIONI: dentro il sito o fuori.
 *
 * Erano tre (Community Plus, Solo eventi, Escluso) e la terza non serviva:
 * "solo eventi" era una cosa che si diceva a voce a due persone, non uno
 * stato da tenere in un pannello. Quello che la decisione cambia davvero e'
 * una cosa sola, cioe' se il profilo compare in vetrina, e per quello bastano
 * due tasti.
 *
 * I valori restano quelli di `stato` in config/candidatura.js, cosi' i
 * documenti gia' scritti continuano a valere: chi aveva 'eventi' nello stato
 * non diventa invalido, semplicemente nessun tasto lo scrive piu'.
 */
export const ESITI = ['accettato', 'escluso']

/** Le tre fasce d'eta', piu' il caso "non si sa". */
export const FASCE = ['u16', 'dentro', 'over']

/** In che fascia cade chi ha questi anni. null se la data non si capisce. */
export function fasciaDi(anni) {
  if (anni === null || anni === undefined) return null
  if (anni < ETA_MINIMA) return 'u16'
  if (anni > ETA_MASSIMA) return 'over'
  return 'dentro'
}

/**
 * Com'e' finita, letto DAL PROFILO e non dalla candidatura.
 *
 * E' il punto di tutta la faccenda: "Conferma" vuol dire "compare nel sito",
 * e cosa compare nel sito lo decide `users/{uid}.status`, non lo stato della
 * candidatura. Leggere l'esito da li' vuol dire che il pannello non puo'
 * dire "confermato" di qualcuno che in vetrina non c'e'.
 *
 * Ed e' esattamente il caso dei profili confermati prima di questa
 * modifica: allora "Conferma" scriveva solo la candidatura e il profilo
 * restava in attesa, quindi fuori dal sito. Adesso compaiono come "non
 * ancora deciso", che e' la verita', e un clic su Conferma li mette dentro.
 */
export function esitoDi(profilo) {
  if (profilo?.status === 'approved') return 'accettato'
  if (profilo?.status === 'rejected') return 'escluso'
  return null
}

/**
 * Se a questa persona e' gia' stato scritto. UNA sola domanda.
 *
 * Prima le risposte erano due e si pestavano i piedi: la spunta "da
 * scrivere" e il tasto "segna come contattato", che scrivevano due campi
 * diversi e potevano dire cose opposte. Adesso la spunta li scrive tutti e
 * due insieme, e qui si legge in quest'ordine:
 *
 *   1. `daScrivere`, se c'e', perche' e' la cosa che si tocca;
 *   2. altrimenti la data dell'ultimo contatto, o lo stato 'contattato' dei
 *      documenti piu' vecchi, che dicevano la stessa cosa a modo loro.
 *
 * ASSENTE VUOL DIRE "DA SCRIVERE": una candidatura appena arrivata non l'ha
 * toccata nessuno, quindi a nessuno e' ancora stato scritto.
 */
export function scrittoA(candidatura) {
  const c = candidatura ?? {}
  if (c.daScrivere === false) return true
  if (c.daScrivere === true) return false
  return Boolean(c.contattatoIl) || c.stato === 'contattato'
}

/**
 * Il numero come lo vuole wa.me: solo cifre, senza il piu'.
 *
 * Torna stringa vuota se non resta niente, cosi' chi chiama puo' decidere di
 * non disegnare affatto il bottone invece di disegnarne uno che apre una
 * chat con nessuno.
 */
export function numeroWhatsapp(grezzo) {
  return String(grezzo ?? '').replace(/[^\d]/g, '')
}

/**
 * Un indirizzo Instagram a partire da quello che la persona ha scritto.
 *
 * Nel profilo il campo e' libero: c'e' chi incolla il link e chi scrive
 * "@nome". Le due forme vanno distinte prima di metterle in un href, perche'
 * "@nome" dentro un href diventa un link rotto e non si vede finche' non ci
 * clicchi sopra.
 */
export function linkInstagram(valore) {
  const v = String(valore ?? '').trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  return `https://instagram.com/${v.replace(/^@/, '')}`
}

/** Lo stesso, per LinkedIn: li' pero' quasi tutti incollano il link intero. */
export function linkLinkedin(valore) {
  const v = String(valore ?? '').trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  return `https://www.linkedin.com/in/${v.replace(/^@/, '')}`
}

/**
 * Una candidatura e il profilo della stessa persona, messi insieme.
 *
 * Tutto quello che l'elenco deve poter filtrare o contare viene calcolato
 * QUI, una volta sola: i filtri scorrono una lista di oggetti gia' pronti e
 * non ricalcolano il punteggio a ogni tasto premuto.
 *
 * @param {object} candidatura il documento di `candidature/{uid}`
 * @param {object} [profilo] il documento di `users/{uid}`, se c'e'
 */
export function componiDossier(candidatura, profilo) {
  const c = candidatura ?? {}
  const p = profilo ?? {}

  const { punteggio, su, dettaglio, proposta } = calcolaPunteggio(c)
  const anni = anniCompiuti(c.dataNascita)
  const linkedin = String(p.socials?.linkedin ?? '').trim()

  return {
    uid: c.uid ?? p.uid ?? null,
    candidatura: c,
    profilo: p,

    /* Il nome viene dal profilo: nella candidatura non c'e', e non deve
       esserci. Senza profilo resta null e la pagina mostra l'avviso: vuol
       dire che qualcuno ha mandato le risposte e non ha salvato il profilo,
       il che capita ed e' bene vederlo. */
    nome: String(p.displayName ?? '').trim() || null,
    foto: p.photoURL ?? '',
    citta: String(p.location ?? '').trim(),
    bio: String(p.bio ?? '').trim(),
    instagram: String(p.socials?.instagram ?? '').trim(),
    linkedin,
    senzaLinkedin: linkedin === '',

    whatsapp: String(c.whatsapp ?? ''),
    numeroWa: numeroWhatsapp(c.whatsapp),

    anni,
    fascia: fasciaDi(anni),

    punteggio,
    su,
    dettaglio,
    proposta,

    stato: c.stato ?? 'nuovo',
    esito: esitoDi(p),
    note: String(c.note ?? ''),
    scritto: scrittoA(c),
    /* Le date restano come arrivano, cioe' Timestamp di Firestore: a
       trasformarle ci pensa formatDate() nel momento in cui si disegnano.
       Convertirle qui vorrebbe dire importare lib/db.js, e con lui Firebase,
       dentro un modulo che non legge e non scrive niente. */
    contattatoIl: c.contattatoIl ?? null,
    creataIl: c.createdAt ?? null,
  }
}

/** I dossier di tutte le candidature, gia' incrociati con i profili. */
export function componiDossiers(candidature = [], profili = []) {
  const perUid = new Map(profili.map((p) => [p.uid, p]))
  return candidature.map((c) => componiDossier(c, perUid.get(c.uid)))
}

/**
 * I numeri in cima all'elenco.
 *
 * Quelli che servono a chi scrive alle persone: quante ne restano da
 * scrivere, quante sono gia' nel sito, quante sono state escluse. Le caselle
 * Plus, Event e Da valutare sono sparite insieme ai tasti che le riempivano.
 */
export function conteggi(dossiers = []) {
  const totale = dossiers.length
  const senzaLinkedin = dossiers.filter((d) => d.senzaLinkedin).length

  return {
    totale,
    daScrivere: dossiers.filter((d) => !d.scritto).length,
    nelSito: dossiers.filter((d) => d.esito === 'accettato').length,
    esclusi: dossiers.filter((d) => d.esito === 'escluso').length,
    /* Minorenni per ETA', non per stato: lo stato 'minorenne' lo mette una
       persona a mano e quasi nessuno si ricorda di metterlo, l'eta' invece
       c'e' sempre. Chi lo ha messo lo si conta lo stesso. */
    u16: dossiers.filter((d) => d.fascia === 'u16' || d.stato === 'minorenne').length,
    senzaLinkedin,
    /* La percentuale si arrotonda, e con zero candidature e' zero e non NaN:
       "NaN%" in cima a una pagina vuota sembra un sito rotto. */
    senzaLinkedinPerc: totale === 0 ? 0 : Math.round((senzaLinkedin / totale) * 100),
  }
}

/**
 * L'elenco filtrato.
 *
 * I filtri assenti (stringa vuota, `tutti`, false) non filtrano: cosi' la
 * pagina puo' passare sempre lo stesso oggetto senza montare la condizione
 * caso per caso.
 *
 * La ricerca guarda nome, numero e citta'. Non l'email, che non abbiamo, e
 * non le risposte: cercare dentro le motivazioni sembra comodo e in pratica
 * restituisce mezza pagina ogni volta che si digita "startup".
 */
export function filtra(dossiers = [], filtri = {}) {
  const testo = String(filtri.testo ?? '').trim().toLowerCase()
  const cifre = testo.replace(/[^\d]/g, '')

  return dossiers.filter((d) => {
    /* Scritto o no, e com'e' finita: due domande che si incrociano. Una
       persona a cui si e' gia' scritto puo' non essere ancora decisa, e una
       confermata puo' non essere ancora stata avvisata. */
    if (filtri.scritto === 'da-scrivere' && d.scritto) return false
    if (filtri.scritto === 'scritto' && !d.scritto) return false

    if (filtri.esito === 'non-deciso' && d.esito !== null) return false
    if (ESITI.includes(filtri.esito) && d.esito !== filtri.esito) return false

    if (FASCE.includes(filtri.fascia) && d.fascia !== filtri.fascia) return false
    if (filtri.fascia === 'ignota' && d.fascia !== null) return false

    if (filtri.senzaLinkedin && !d.senzaLinkedin) return false

    if (testo) {
      const nome = (d.nome ?? '').toLowerCase()
      const citta = d.citta.toLowerCase()
      const numero = d.numeroWa
      const nelNumero = cifre.length >= 3 && numero.includes(cifre)
      if (!nome.includes(testo) && !citta.includes(testo) && !nelNumero) return false
    }

    return true
  })
}

/**
 * Una riga di CSV, con le virgolette messe come si deve.
 *
 * Un numero di telefono comincia con il piu' e un nome puo' contenere una
 * virgola: senza virgolette il file si apre storto, e lo si scopre dentro
 * Excel con le colonne sfasate. Le virgolette interne si raddoppiano, che e'
 * l'unico modo che il formato conosce per scriverne una.
 */
function rigaCsv(valori) {
  return valori.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
}

/**
 * I contatti in CSV, per portarli dove si scrive davvero alle persone.
 *
 * Le intestazioni arrivano da fuori perche' il sito e' in due lingue e questo
 * modulo non ha un t() sotto mano.
 *
 * NIENTE PUNTEGGIO E NIENTE NOTE nel file: un CSV si gira per WhatsApp senza
 * pensarci, e li' dentro finirebbero un giudizio su una persona e gli
 * appunti di una telefonata. Esce quello che serve per scrivere a qualcuno.
 */
export function aCsv(dossiers = [], intestazioni = []) {
  const righe = [rigaCsv(intestazioni)]
  for (const d of dossiers) {
    righe.push(rigaCsv([d.nome ?? '', d.whatsapp, d.citta, d.instagram, d.linkedin]))
  }
  /* Il BOM davanti: senza, Excel apre il file in Latin-1 e tutti gli accenti
     diventano caratteri strani. Gli altri programmi lo ignorano. */
  return `﻿${righe.join('\r\n')}\r\n`
}
