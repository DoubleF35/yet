/**
 * IL PUNTEGGIO DI UNA CANDIDATURA.
 *
 * Quattro criteri, un punto ciascuno. Portato dal form di Greta senza
 * cambiargli i conti: le stesse regole, la stessa soglia. Cambiare i numeri
 * qui cambia chi entra, quindi si cambiano apposta e non per caso.
 *
 * DOVE GIRA, CHE E' IL PUNTO DELICATO.
 *
 * Nel form originale il punteggio lo calcolava il SERVER, e c'era scritto
 * perche': "calcolato dal server, mai mostrato al candidato". Questo sito un
 * server non ce l'ha. E' un sito statico su GitHub Pages con Firebase sul
 * piano gratuito, quindi niente Cloud Functions: qualunque cosa calcoli il
 * browser di chi si candida, chi si candida se la puo' leggere.
 *
 * Quindi il punteggio NON SI CALCOLA AL MOMENTO DELL'INVIO e non si salva nel
 * database. La candidatura porta solo le risposte grezze. Questa funzione la
 * chiama il pannello admin, che apre solo chi e' amministratore, nel momento
 * in cui guarda la scheda.
 *
 * Il risultato e' che la proprieta' che contava davvero resta in piedi senza
 * un server: il punteggio non esiste da nessuna parte finche' non lo guarda un
 * admin, quindi non c'e' niente da leggere nella console, niente da intercet-
 * tare nella rete e niente da trovare dentro il documento.
 *
 * Il prezzo e' che non si puo' cercare o ordinare per punteggio dentro una
 * query: va calcolato su quelle che hai gia' letto. Con i numeri di un club
 * e' un prezzo che non si sente.
 */

/**
 * Quanti punti servono per la proposta piu' alta.
 *
 * Con 3: tre o quattro punti propongono "accettato", due "da valutare", zero o
 * uno "solo eventi". E' una PROPOSTA e non una decisione: il pannello la mostra
 * accanto alle risposte, poi decide una persona.
 */
export const SOGLIA_ACCETTATO = 3

/**
 * I quattro criteri, scritti come dati e non come una catena di if.
 *
 * Cosi' la scheda dell'admin puo' mostrare quali sono scattati e quali no
 * senza riscrivere le stesse condizioni una seconda volta, che e' il modo
 * tipico in cui la spiegazione smette di combaciare col conto.
 */
export const CRITERI = [
  {
    id: 'pitch',
    chiave: 'candidatura.criterio.pitch',
    scattato: (r) => r.nPitch === 'piu',
  },
  {
    id: 'prodotto',
    chiave: 'candidatura.criterio.prodotto',
    scattato: (r) => r.stadioProgetto === 'prodotto' || r.stadioProgetto === 'utenti',
  },
  {
    id: 'eventi',
    chiave: 'candidatura.criterio.eventi',
    scattato: (r) => r.nEventi === 'uno' || r.nEventi === 'piu',
  },
  {
    id: 'ambizione',
    chiave: 'candidatura.criterio.ambizione',
    scattato: (r) => ['aspirante_founder', 'founder', 'startup'].includes(r.ruolo),
  },
]

/**
 * Il punteggio di una candidatura, piu' il dettaglio di come ci si e' arrivati.
 *
 * LinkedIn non conta, ed e' voluto: averlo dice quanto uno e' presentabile, non
 * quanto sta costruendo.
 *
 * @param {object} risposte le risposte grezze, come stanno su Firestore
 * @returns {{ punteggio: number, su: number, dettaglio: Array, proposta: string }}
 */
export function calcolaPunteggio(risposte = {}) {
  const dettaglio = CRITERI.map((c) => ({
    id: c.id,
    chiave: c.chiave,
    scattato: Boolean(c.scattato(risposte)),
  }))

  const punteggio = dettaglio.filter((d) => d.scattato).length

  let proposta
  if (punteggio >= SOGLIA_ACCETTATO) proposta = 'accettato'
  else if (punteggio === SOGLIA_ACCETTATO - 1) proposta = 'valutare'
  else proposta = 'eventi'

  return { punteggio, su: CRITERI.length, dettaglio, proposta }
}

/** Le tre proposte possibili, per chi deve tradurle o colorarle. */
export const PROPOSTE = ['accettato', 'valutare', 'eventi']
