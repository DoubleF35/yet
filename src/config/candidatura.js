/**
 * LE DOMANDE DI SELEZIONE.
 *
 * Vengono dal form che Greta aveva scritto a parte (gretadall/Diventa-uno-Yets,
 * Next.js e Supabase). Qui restano le domande e sparisce tutto il resto: il
 * sito ha gia' l'accesso Google, il suo database e la sua approvazione, e
 * tenere in piedi una seconda applicazione per fare le stesse cose vorrebbe
 * dire avere due elenchi di persone che prima o poi non combaciano.
 *
 * QUI CI SONO SOLO I VALORI, non le etichette. Le etichette stanno nei due
 * cataloghi di traduzione sotto `candidatura.*`, perche' il sito e' bilingue e
 * c'e' uno script che controlla che italiano e inglese combacino. Scrivendo le
 * etichette qui quel controllo non le vedrebbe, e la versione inglese
 * resterebbe indietro senza che nessuno se ne accorga.
 *
 * I VALORI NON SI CAMBIANO A CUOR LEGGERO: sono quelli gia' salvati nelle
 * candidature, e il punteggio in lib/punteggio.js li confronta per nome. Un
 * valore rinominato non rompe niente di visibile, fa solo smettere di contare
 * un criterio, che e' molto peggio.
 */

/** Cosa fa adesso nella vita. */
export const OCCUPAZIONI = ['scuola', 'universita', 'lavoro', 'altro']

/** Come si colloca rispetto al fare impresa. Pesa sul punteggio. */
export const RUOLI = ['aspirante_founder', 'founder', 'startup', 'curioso']

/** A che punto e' quello che sta costruendo. Pesa sul punteggio. */
export const STADI_PROGETTO = ['nessuno', 'idea', 'prodotto', 'utenti']

/** Quante volte ha presentato un progetto a un pubblico. Pesa sul punteggio. */
export const N_PITCH = ['mai', 'uno', 'piu']

/** A quanti eventi del settore e' stato. Pesa sul punteggio. */
export const N_EVENTI = ['zero', 'uno', 'piu']

/** Come ci ha conosciuti. Non pesa sul punteggio, serve a noi per capire. */
export const FONTI = ['instagram', 'whatsapp', 'evento', 'passaparola', 'altro']

/**
 * Lo stato della candidatura, che muove l'admin.
 *
 * E' una lista piu' ricca del solo pending/approved che il sito usa per i
 * profili, e la ragione e' che una candidatura ha una vita piu' lunga di un
 * profilo: la si legge, si scrive alla persona, si aspetta la risposta. Lo
 * stato del PROFILO resta separato e lo decide l'approvazione.
 */
export const STATI = ['nuovo', 'contattato', 'accettato', 'eventi', 'escluso', 'minorenne']

/**
 * Quanti anni servono per entrare senza passare da una chiacchierata.
 *
 * Sotto questa eta' la candidatura non viene rifiutata: viene messa da parte
 * con lo stato "minorenne", perche' il club parte dai 16 e sotto serve il
 * consenso di chi esercita la responsabilita' genitoriale, che non e' una cosa
 * da spuntare dentro un form.
 */
export const ETA_MINIMA = 16

/** Oltre questa eta' si e' fuori dalla fascia del club, ma si puo' sempre scrivere. */
export const ETA_MASSIMA = 23

/**
 * Gli anni compiuti a oggi, da una data scritta come "2008-03-14".
 *
 * Torna null se la data non si capisce o sta nel futuro, invece di un numero
 * sbagliato: chi chiama deve poter distinguere "non lo so" da "ha zero anni".
 *
 * Il conto e' sui mesi e sui giorni e non sui millisecondi, perche' i
 * millisecondi passano dagli anni bisestili e dall'ora legale e ogni tanto
 * sbagliano di un giorno. Qui un giorno e' esattamente la differenza fra il
 * compleanno passato e quello che deve ancora arrivare.
 */
export function anniCompiuti(iso, adesso = new Date()) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [anno, mese, giorno] = iso.split('-').map(Number)
  const nascita = new Date(Date.UTC(anno, mese - 1, giorno))
  if (Number.isNaN(nascita.getTime())) return null
  if (nascita.getUTCMonth() !== mese - 1 || nascita.getUTCDate() !== giorno) return null
  if (nascita > adesso) return null

  let anni = adesso.getUTCFullYear() - anno
  const primaDelCompleanno =
    adesso.getUTCMonth() < mese - 1 ||
    (adesso.getUTCMonth() === mese - 1 && adesso.getUTCDate() < giorno)
  if (primaDelCompleanno) anni -= 1
  return anni
}

/**
 * La chiave di traduzione dell'etichetta di un'opzione.
 *
 * Costruita dal valore invece che scritta a mano: 'aspirante_founder' nel
 * gruppo 'ruolo' diventa 'candidatura.ruoloAspiranteFounder'. Cosi'
 * aggiungere un'opzione vuol dire toccare questo file e i due cataloghi, e
 * non anche ogni punto che la mostra.
 *
 * Sta qui e non nel componente del form perche' la stessa etichetta serve
 * anche al pannello di chi valuta, che il form non lo disegna.
 */
export function chiaveOpzione(gruppo, valore) {
  if (!valore) return null
  const camel = String(valore).replace(/_(.)/g, (_, c) => c.toUpperCase())
  return `candidatura.${gruppo}${camel.charAt(0).toUpperCase()}${camel.slice(1)}`
}
