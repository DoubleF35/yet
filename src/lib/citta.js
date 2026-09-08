/**
 * Le città della vetrina.
 *
 * Due cose diverse che vivono insieme perché parlano dello stesso campo:
 *
 *  - CHI E' REFERENTE di una città. Il dato sta in config/citta.js, cioè nel
 *    repo: il perché è spiegato là, in breve è che un campo scritto dal
 *    client sul proprio profilo permetterebbe a chiunque di nominarsi
 *    referente da solo.
 *
 *  - COME SI RAGGRUPPANO i profili per città. Il campo `location` è testo
 *    libero, facoltativo, e a oggi un profilo su tre non lo ha. Qualunque
 *    raggruppamento deve reggere entrambe le cose.
 *
 * PERCHE' NON UNA SEZIONE PER CITTA'. Nel database ci sono 13 scritture
 * distinte di `location` e otto contengono una persona sola: tredici sezioni
 * su telefono sono più di duemila pixel di sole intestazioni, otto delle
 * quali sopra un'unica tessera. Da cui la regola qui sotto, che tiene il
 * numero di filtri basso da solo, senza che qualcuno debba deciderlo a mano
 * ogni volta che si iscrive qualcuno da una città nuova.
 */

import { REFERENTI } from '../config/citta.js'
import { normalizza } from './slug.js'

/**
 * Quante persone servono perché una città diventi un filtro a sé.
 *
 * Due, e non uno: con uno ci sarebbe un filtro per ogni città d'Italia e
 * ognuno mostrerebbe una tessera, che è esattamente il disordine da evitare.
 * Chi resta fuori NON sparisce: si vede sotto "Tutti", che è la vista
 * predefinita.
 */
const MINIMO_PER_FILTRO = 2

/**
 * Quanti filtri servono perché la riga dei filtri abbia senso.
 *
 * Con una città sola la riga direbbe "Tutti 32 | Torino 7", cioè offrirebbe
 * di filtrare via il resto della community: un comando che non serve a
 * nessuno. La riga compare quando ci sono almeno due città da distinguere.
 */
const MINIMO_FILTRI = 2

/* uid -> città dichiarata nel config. Costruite una volta a livello di
   modulo: REFERENTI non cambia durante la vita della pagina. */
const PER_UID = new Map(REFERENTI.map((r) => [r.uid, r.citta]))

/* chiave -> come va scritta la città. Il config vince su come l'hanno
   scritta i membri, che è testo libero. */
const ETICHETTE = new Map(REFERENTI.map((r) => [normalizza(r.citta), r.citta]))

/** La città di cui questo membro è referente, come va scritta. Null se non lo è. */
export function cittaDelReferente(membro) {
  return PER_UID.get(membro?.uid) ?? null
}

/**
 * Le città a cui questo membro appartiene, come chiavi confrontabili.
 *
 * Un insieme e non una stringa perché le due fonti possono contraddirsi: un
 * referente di Roma che nel profilo ha scritto "Milano" è un errore nei dati,
 * e in quel caso comparire in entrambe è meglio che sparire da una delle due
 * per una regola di precedenza che nessuno si ricorda. Normalmente ne
 * contiene una, o nessuna per chi la città non l'ha scritta.
 */
function chiaviDelMembro(membro) {
  const chiavi = new Set()

  const scritta = normalizza(membro?.location)
  if (scritta) chiavi.add(scritta)

  const referente = PER_UID.get(membro?.uid)
  if (referente) chiavi.add(normalizza(referente))

  return chiavi
}

/** Se questo membro va mostrato quando è selezionata questa città. */
export function membroInCitta(membro, chiave) {
  if (!chiave) return true
  return chiaviDelMembro(membro).has(chiave)
}

/**
 * Come si scrive una città, viste tutte le forme in cui l'hanno scritta i
 * membri.
 *
 * Vince la forma più frequente. A pari frequenza vince quella che comincia
 * per maiuscola, che è il caso vero di "londra" contro "Londra": senza
 * questo spareggio la scelta dipenderebbe dall'ordine in cui il database
 * restituisce i documenti, quindi l'etichetta potrebbe cambiare da un
 * caricamento all'altro. L'ultimo spareggio è alfabetico, per non lasciare
 * niente al caso.
 */
function etichettaDi(chiave, scritture) {
  const dichiarata = ETICHETTE.get(chiave)
  if (dichiarata) return dichiarata

  const candidate = [...scritture.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    const maiuscolaA = /^\p{Lu}/u.test(a[0]) ? 0 : 1
    const maiuscolaB = /^\p{Lu}/u.test(b[0]) ? 0 : 1
    if (maiuscolaA !== maiuscolaB) return maiuscolaA - maiuscolaB

    /* Poi la forma accentata: fra "Forli" e "Forli'" scritte una volta
       ciascuna, quella giusta in italiano e' la seconda. L'alfabeto da solo
       preferirebbe l'altra, perche' la lettera senza segno viene prima. */
    const accentataA = /[^\u0000-\u007f]/.test(a[0]) ? 0 : 1
    const accentataB = /[^\u0000-\u007f]/.test(b[0]) ? 0 : 1
    if (accentataA !== accentataB) return accentataA - accentataB

    return a[0].localeCompare(b[0], 'it')
  })

  return candidate.length > 0 ? candidate[0][0] : chiave
}

/**
 * I filtri da mostrare, senza "Tutti", che lo aggiunge chi disegna la riga.
 *
 * Torna [] quando non ce ne sono abbastanza: così la pagina non deve
 * conoscere la soglia, le basta guardare se l'elenco è vuoto.
 *
 * Ordinati per numero di profili e non alfabeticamente: la riga racconta
 * dov'è arrivata YET, e la città con più gente è la prima cosa vera da
 * dire. A pari numero decide l'alfabeto.
 */
export function filtriCitta(membri) {
  const gruppi = new Map()

  for (const membro of Array.isArray(membri) ? membri : []) {
    for (const chiave of chiaviDelMembro(membro)) {
      let gruppo = gruppi.get(chiave)
      if (!gruppo) {
        gruppo = { chiave, conteggio: 0, scritture: new Map() }
        gruppi.set(chiave, gruppo)
      }
      gruppo.conteggio += 1

      /* La forma grezza serve solo a scegliere l'etichetta. Si conta anche
         quella vuota? No: un referente senza `location` non deve poter
         diventare l'etichetta della propria città. */
      const grezza = typeof membro?.location === 'string' ? membro.location.trim() : ''
      if (grezza && normalizza(grezza) === chiave) {
        gruppo.scritture.set(grezza, (gruppo.scritture.get(grezza) ?? 0) + 1)
      }
    }
  }

  const filtri = [...gruppi.values()]
    .filter((g) => g.conteggio >= MINIMO_PER_FILTRO || ETICHETTE.has(g.chiave))
    .map((g) => ({
      chiave: g.chiave,
      etichetta: etichettaDi(g.chiave, g.scritture),
      conteggio: g.conteggio,
    }))
    .sort((a, b) => {
      if (b.conteggio !== a.conteggio) return b.conteggio - a.conteggio
      return a.etichetta.localeCompare(b.etichetta, 'it')
    })

  return filtri.length >= MINIMO_FILTRI ? filtri : []
}

/**
 * La città selezionata, ripulita di quello che c'è nell'indirizzo.
 *
 * Un `?citta=` che non corrisponde a nessun filtro torna stringa vuota, cioè
 * "Tutti": un indirizzo scritto a mano, o il link a una città che nel
 * frattempo è scesa sotto la soglia, non deve produrre una griglia vuota con
 * nessun filtro evidenziato, che sembrerebbe un guasto.
 */
export function cittaValida(grezza, filtri) {
  const chiave = normalizza(grezza)
  if (!chiave) return ''
  return filtri.some((f) => f.chiave === chiave) ? chiave : ''
}
