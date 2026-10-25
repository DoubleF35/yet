/**
 * La mappa della vetrina: da dove viene la gente di YET.
 *
 * Il disegno (la griglia di puntini divisa per regione) e il dizionario dei
 * comuni li genera scripts/mappa.mjs, e il perché di quella forma è scritto
 * là. Qui c'è solo il passo che dipende dai profili: leggere il campo
 * `location`, che è testo libero, e capire su quale puntino cade.
 *
 * PERCHE' IL DIZIONARIO SI CARICA A PARTE. Sono ottomila comuni, una
 * cinquantina di kilobyte compressi: la griglia va nel bundle della pagina
 * perché serve subito, il dizionario arriva dopo con un import dinamico, in
 * parallelo con i profili, e non pesa su chi la vetrina non la apre.
 */

import MAPPA from '../data/italia-mappa.json'
import { cittaDelReferente, chiaviDelMembro } from './citta.js'
import { normalizza } from './slug.js'

export { MAPPA }

/** Quanti numeri descrivono un puntino nell'array piatto: colonna, riga, regione, confine. */
export const CAMPI_PUNTINO = 4

let comuniInArrivo = null

/**
 * Il dizionario nome normalizzato -> indice del puntino.
 *
 * Una promessa sola per tutta la vita della pagina: tornando sulla vetrina
 * non si riscarica. Se il caricamento fallisce si dimentica la promessa,
 * così la volta dopo si riprova invece di restare rotti fino al ricarico.
 */
export function caricaComuni() {
  comuniInArrivo ??= import('../data/italia-comuni.json')
    .then((modulo) => modulo.default)
    .catch((errore) => {
      comuniInArrivo = null
      throw errore
    })
  return comuniInArrivo
}

/* I nomi inglesi delle città che li hanno. Il sito ha anche la versione
   inglese, e chi la usa può aver scritto "Turin": il dizionario è italiano. */
const ESONIMI = {
  turin: 'torino',
  milan: 'milano',
  rome: 'roma',
  naples: 'napoli',
  florence: 'firenze',
  venice: 'venezia',
  genoa: 'genova',
  padua: 'padova',
  mantua: 'mantova',
  syracuse: 'siracusa',
}

/* Quello che le persone scrivono attorno al nome della città: "provincia di
   Torino", "zona Milano". Si toglie prima di cercare nel dizionario. */
const PREFISSI = /^(provinciadi|provincia|prov|zona|area|hinterland)/

function cerca(pezzo, comuni) {
  const chiave = normalizza(pezzo)
  if (!chiave) return null
  const nome = ESONIMI[chiave] ?? chiave
  if (nome in comuni) return nome
  const senzaPrefisso = nome.replace(PREFISSI, '')
  return senzaPrefisso !== nome && senzaPrefisso in comuni ? senzaPrefisso : null
}

/**
 * I comuni scritti in un `location`, ciascuno con la forma in cui l'ha
 * scritto la persona.
 *
 * Prima si prova il testo intero: "San Damiano d'Asti" è un comune solo, e
 * spezzarlo non serve. Se non c'è, si spezza dove le persone mettono più di
 * un posto ("Sondrio/Milano", "Torino e Milano") o una sigla ("Moncalieri
 * (TO)"), e si tengono i pezzi che sono comuni veri. Di un pezzo che non si
 * trova non si inventa niente.
 */
function comuniScritti(testo, comuni) {
  const grezzo = typeof testo === 'string' ? testo.trim() : ''
  if (!grezzo) return []

  const intero = cerca(grezzo, comuni)
  if (intero) return [{ chiave: intero, scritta: grezzo }]

  const trovati = []
  for (const pezzo of grezzo.split(/[/,;|()+&]|\s+e\s+|\s+-\s+/i)) {
    const chiave = cerca(pezzo, comuni)
    if (chiave && !trovati.some((t) => t.chiave === chiave)) {
      trovati.push({ chiave, scritta: pezzo.trim() })
    }
  }
  return trovati
}

/* "londra" -> "Londra". Solo la prima lettera: "dall'Olio" o "d'Asti"
   scritti dentro il nome restano come li ha scritti la persona. */
function maiuscola(testo) {
  return testo.charAt(0).toLocaleUpperCase('it') + testo.slice(1)
}

/**
 * Dove sta la gente, pronto da disegnare.
 *
 * @param membri  i profili della vetrina
 * @param comuni  il dizionario di caricaComuni()
 * @param citta   l'elenco di tutte le città (vedi lib/citta.js), da cui
 *                ogni puntino prende il filtro
 * @returns {{
 *   punti: Array<{indice, c, r, regione, etichetta, persone, filtro}>,
 *   perRegione: number[],
 *   citta: number,
 *   regioni: number,
 *   fuori: number,
 * }}
 *   `fuori` conta chi ha scritto un posto che la mappa non sa mettere: quasi
 *   sempre l'estero ("londra"), a volte un nome scritto storto. Non si
 *   distinguono i due casi perché non c'è modo di farlo senza indovinare.
 */
export function luoghiDeiMembri(membri, comuni, citta = []) {
  const perPuntino = new Map()
  const perRegione = new Array(MAPPA.regioni.length).fill(0)
  const comuniVisti = new Set()
  let fuori = 0

  for (const membro of membri) {
    const trovati = comuniScritti(membro.location, comuni)

    /* Il referente di una città sta su quella città anche se nel profilo ha
       scritto altro, come succede già nei filtri (vedi chiaviDelMembro). */
    const referente = cittaDelReferente(membro)
    const chiaveReferente = referente ? cerca(referente, comuni) : null
    if (chiaveReferente && !trovati.some((t) => t.chiave === chiaveReferente)) {
      trovati.push({ chiave: chiaveReferente, scritta: referente })
    }

    if (trovati.length === 0) {
      if (typeof membro.location === 'string' && membro.location.trim()) fuori += 1
      continue
    }

    const regioniDelMembro = new Set()
    const chiaviFiltro = chiaviDelMembro(membro)

    for (const { chiave, scritta } of trovati) {
      comuniVisti.add(chiave)
      const indice = comuni[chiave]
      const base = indice * CAMPI_PUNTINO
      const regione = MAPPA.puntini[base + 2]
      regioniDelMembro.add(regione)

      /* Più comuni possono cadere sullo stesso puntino (Torino e Moncalieri
         distano meno di una cella): diventano un puntino solo, con il nome
         del comune che ha più gente e il totale di tutti. */
      let punto = perPuntino.get(indice)
      if (!punto) {
        punto = {
          indice,
          c: MAPPA.puntini[base],
          r: MAPPA.puntini[base + 1],
          regione,
          persone: 0,
          nomi: new Map(),
          chiaviFiltro: new Set(),
        }
        perPuntino.set(indice, punto)
      }
      punto.persone += 1
      const nome = punto.nomi.get(chiave) ?? { conteggio: 0, scritture: new Map() }
      nome.conteggio += 1
      nome.scritture.set(scritta, (nome.scritture.get(scritta) ?? 0) + 1)
      punto.nomi.set(chiave, nome)
      for (const k of chiaviFiltro) punto.chiaviFiltro.add(k)
    }

    for (const regione of regioniDelMembro) perRegione[regione] += 1
  }

  const punti = [...perPuntino.values()]
    .map((punto) => {
      const [, piuScritto] = [...punto.nomi].sort((a, b) => b[1].conteggio - a[1].conteggio)[0]
      /* La forma scritta più spesso, con la maiuscola: è la stessa scelta che
         fanno i filtri, in piccolo. */
      const [scritta] = [...piuScritto.scritture].sort((a, b) => b[1] - a[1])[0]
      return {
        indice: punto.indice,
        c: punto.c,
        r: punto.r,
        regione: punto.regione,
        etichetta: maiuscola(scritta),
        persone: punto.persone,
        /* Il filtro della vetrina che corrisponde a questo puntino: fra le
           città scritte dalle persone che ci stanno sopra, quella con più
           gente. `citta` è già in quell'ordine. */
        filtro: citta.find((c) => punto.chiaviFiltro.has(c.chiave))?.chiave ?? null,
      }
    })
    /* I più grandi per ultimi, così nel disegno stanno sopra i piccoli vicini
       invece di esserne coperti. */
    .sort((a, b) => a.persone - b.persone)

  return {
    punti,
    perRegione,
    citta: comuniVisti.size,
    regioni: perRegione.filter((n) => n > 0).length,
    fuori,
  }
}
