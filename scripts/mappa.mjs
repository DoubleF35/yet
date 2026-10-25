/* =========================================================================
   YET, i dati della mappa della vetrina

   Genera due file in src/data/, e si lancia a mano solo quando si vuole
   cambiare la griglia (passo, confini). Il sito non lo esegue mai: legge i
   file prodotti, che sono nel repo.

     italia-mappa.json   la griglia di puntini, divisa per regione
     italia-comuni.json  nome normalizzato del comune -> indice del puntino

   LE FONTI, da scaricare prima:

     confini ISTAT delle regioni e dei comuni, nella versione di openpolis:
       https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson
       https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_municipalities.geojson
     i centri abitati italiani di GeoNames (licenza CC BY 4.0):
       https://download.geonames.org/export/dump/IT.zip  (dentro c'e' IT.txt)

   Uso:
     node scripts/mappa.mjs <regioni.geojson> <comuni.geojson> <IT.txt>

   PERCHE' DUE FONTI PER I NOMI. I comuni vengono dall'ISTAT, che li scrive
   come li scrivono gli italiani. GeoNames da solo non basta: per le citta'
   grandi il nome principale e' quello inglese ("Turin", "Milan", "Rome"), e
   la prima versione di questo script metteva fuori mappa proprio Torino.
   GeoNames serve solo per quello che l'ISTAT non elenca perche' non e' un
   comune: le frazioni e i quartieri grandi, come Mestre o Ostia.

   PERCHE' PUNTINI E NON I CONFINI DISEGNATI. Un tracciato vero delle venti
   regioni pesa centinaia di kilobyte e a quella scala non dice niente in
   piu'. Una griglia di qualche migliaio di puntini, ognuno con la sua
   regione, si disegna in un SVG leggero, e ogni regione si accende da sola.

   PERCHE' I COMUNI SONO GIA' "AGGANCIATI" A UN PUNTINO. Il campo `location`
   e' testo libero e la mappa deve sapere dove mettere "Borgomanero" senza
   chiederlo a un servizio esterno a ogni visita. Il dizionario si porta
   dietro tutti i comuni, non solo i capoluoghi: chi scrive il proprio paese
   deve vedersi sulla mappa, ed e' proprio chi abita fuori dalle grandi citta'
   che ci tiene di piu'. Ogni comune e' gia' ridotto al puntino piu' vicino,
   cosi' il browser non fa nessun calcolo geografico.
   ========================================================================= */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { normalizza } from '../src/lib/slug.js'

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..')

/* Il passo della griglia in gradi di latitudine. 0.1 da' un centinaio di
   righe dalla Vetta d'Italia a Capo Passero: abbastanza fitto da riconoscere
   il Gargano e lo Stretto, abbastanza rado da restare sotto i tremila
   puntini. */
const PASSO_LAT = 0.1

/* In longitudine il grado si accorcia andando a nord. Correggere con il
   coseno della latitudine media fa la griglia QUADRATA sul terreno, e
   l'Italia non esce schiacciata. */
const LAT_MEDIA = 42
const PASSO_LON = PASSO_LAT / Math.cos((LAT_MEDIA * Math.PI) / 180)

/* Come vanno scritte le regioni a schermo. Il geojson usa i nomi ufficiali
   bilingui ("Valle d'Aosta/Vallée d'Aoste"), lunghi per un'etichetta.
   Nell'ordine del codice ISTAT: la regione col codice "01" e' la prima. */
const NOMI = [
  'Piemonte',
  "Valle d'Aosta",
  'Lombardia',
  'Trentino-Alto Adige',
  'Veneto',
  'Friuli-Venezia Giulia',
  'Liguria',
  'Emilia-Romagna',
  'Toscana',
  'Umbria',
  'Marche',
  'Lazio',
  'Abruzzo',
  'Molise',
  'Campania',
  'Puglia',
  'Basilicata',
  'Calabria',
  'Sicilia',
  'Sardegna',
]

const [percorsoConfini, percorsoComuni, percorsoGeonames] = process.argv.slice(2)
if (!percorsoConfini || !percorsoComuni || !percorsoGeonames) {
  console.error('Uso: node scripts/mappa.mjs <regioni.geojson> <comuni.geojson> <IT.txt>')
  process.exit(1)
}

/* --- confini --------------------------------------------------------------- */

const confini = JSON.parse(readFileSync(percorsoConfini, 'utf8'))

const regioni = confini.features.map((f) => {
  const codice = Number(f.properties.reg_istat_code) - 1
  const poligoni =
    f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  return { codice, nome: NOMI[codice], poligoni }
})

/* Ray casting classico. Gli anelli dopo il primo sono buchi, e un punto in
   un buco non e' dentro: e' il caso di San Marino e del Vaticano. */
function dentroAnello(lon, lat, anello) {
  let dentro = false
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [xi, yi] = anello[i]
    const [xj, yj] = anello[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      dentro = !dentro
    }
  }
  return dentro
}

function dentroPoligono(lon, lat, poligono) {
  if (!dentroAnello(lon, lat, poligono[0])) return false
  return !poligono.slice(1).some((buco) => dentroAnello(lon, lat, buco))
}

function regioneDi(lon, lat) {
  return regioni.find((r) => r.poligoni.some((p) => dentroPoligono(lon, lat, p))) ?? null
}

/* --- griglia --------------------------------------------------------------- */

const [minLon, minLat, maxLon, maxLat] = confini.bbox
const colonneRiquadro = Math.ceil((maxLon - minLon) / PASSO_LON) + 1
const righeRiquadro = Math.ceil((maxLat - minLat) / PASSO_LAT) + 1

/* Un puntino e' terra se il CENTRO della sua cella cade dentro una regione.
   La riga 0 e' in alto, cioe' a nord, come in un SVG. */
const puntini = []
for (let r = 0; r < righeRiquadro; r++) {
  const lat = maxLat - r * PASSO_LAT
  for (let c = 0; c < colonneRiquadro; c++) {
    const lon = minLon + c * PASSO_LON
    const regione = regioneDi(lon, lat)
    if (regione) puntini.push({ c, r, lon, lat, regione: regione.codice })
  }
}

/* Il riquadro dei confini arriva fino a Lampedusa, che a questo passo non
   prende nessun puntino: senza questo taglio sotto la Sicilia resterebbe una
   fascia vuota, e la mappa in pagina sembrerebbe scivolata in alto. */
const primaColonna = Math.min(...puntini.map((p) => p.c))
const primaRiga = Math.min(...puntini.map((p) => p.r))
for (const p of puntini) {
  p.c -= primaColonna
  p.r -= primaRiga
}
const colonne = Math.max(...puntini.map((p) => p.c)) + 1
const righe = Math.max(...puntini.map((p) => p.r)) + 1

/* Un puntino di CONFINE ha a destra o sotto un puntino di un'altra regione.
   La pagina li disegna piu' piccoli, e quella fila di puntini ristretti e' la
   linea che separa due regioni: senza, con tutta la penisola dello stesso
   colore, le regioni non si leggerebbero.
   Solo destra e sotto, e non tutti e quattro i lati: guardando anche sinistra
   e sopra si restringerebbero i puntini da ENTRAMBE le parti, e la linea
   verrebbe larga due puntini invece di uno. */
const perCella = new Map(puntini.map((p) => [`${p.c},${p.r}`, p.regione]))
for (const p of puntini) {
  p.confine = [
    [1, 0],
    [0, 1],
  ].some(([dc, dr]) => {
    const vicina = perCella.get(`${p.c + dc},${p.r + dr}`)
    return vicina !== undefined && vicina !== p.regione
  })
}

/* --- comuni ---------------------------------------------------------------- */

/* Area e baricentro di un anello, con la formula del laccio da scarpe. Sui
   gradi e non sui metri: per confrontare due comuni vicini e trovare il
   centro di uno solo, la deformazione non conta. */
function misuraAnello(anello) {
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [x0, y0] = anello[j]
    const [x1, y1] = anello[i]
    const f = x0 * y1 - x1 * y0
    area += f
    cx += (x0 + x1) * f
    cy += (y0 + y1) * f
  }
  area /= 2
  return area === 0
    ? { area: 0, lon: anello[0][0], lat: anello[0][1] }
    : { area: Math.abs(area), lon: cx / (6 * area), lat: cy / (6 * area) }
}

/* Il centro di un comune e' il baricentro del suo pezzo piu' grande: un
   comune con un'isola o un'exclave (ce ne sono) non deve finire in mare a
   meta' strada fra i due pezzi. */
function centroDelComune(geometria) {
  const poligoni = geometria.type === 'Polygon' ? [geometria.coordinates] : geometria.coordinates
  const pezzi = poligoni.map((p) => misuraAnello(p[0]))
  const maggiore = pezzi.reduce((a, b) => (b.area > a.area ? b : a))
  return { ...maggiore, area: pezzi.reduce((somma, p) => somma + p.area, 0) }
}

/* chiave -> { lon, lat, regione, peso }. Il peso decide fra due posti con lo
   stesso nome: vince il comune sulla frazione, e fra due comuni il piu'
   esteso, che in mancanza della popolazione e' l'indizio migliore di quale
   intende chi scrive soltanto "Castro" o "Calliano". */
const candidati = new Map()
function proponi(chiave, posto) {
  if (!chiave) return
  const prima = candidati.get(chiave)
  if (!prima || posto.peso > prima.peso) candidati.set(chiave, posto)
}

const comuniIstat = JSON.parse(readFileSync(percorsoComuni, 'utf8'))
for (const f of comuniIstat.features) {
  const { lon, lat, area } = centroDelComune(f.geometry)
  const regione = Number(f.properties.reg_istat_code) - 1
  const posto = { lon, lat, regione, peso: 1e6 + area }
  /* In Alto Adige e in Valle d'Aosta il nome ufficiale e' bilingue,
     "Bolzano/Bozen": vale ciascuno dei due, e anche i due insieme. */
  const nome = f.properties.name
  proponi(normalizza(nome), posto)
  for (const parte of nome.split('/')) proponi(normalizza(parte), posto)
}

/* Colonne di IT.txt: 1 nome, 4 lat, 5 lon, 6 classe, 7 codice, 10 codice
   della regione (quello di GeoNames, non l'ISTAT), 14 popolazione. Solo i
   centri abitati sopra i cinquemila abitanti: sotto quella soglia GeoNames
   elenca anche le case sparse. Le sedi di comune si saltano, perche' quelle
   le ha gia' l'ISTAT e GeoNames le chiamerebbe in inglese. */
const SEDI = new Set(['PPLA', 'PPLA2', 'PPLA3', 'PPLC'])
for (const riga of readFileSync(percorsoGeonames, 'utf8').split('\n')) {
  const col = riga.split('\t')
  if (col[6] !== 'P' || SEDI.has(col[7])) continue
  if ((Number(col[14]) || 0) < 5000) continue
  const lon = Number(col[5])
  const lat = Number(col[4])
  const regione = regioneDi(lon, lat)?.codice
  if (regione === undefined) continue
  proponi(normalizza(col[1]), { lon, lat, regione, peso: Number(col[14]) })
}

/* Il puntino piu' vicino DELLA STESSA REGIONE. Senza quel vincolo un comune
   sul confine (Borgomanero, a due passi dalla Lombardia) potrebbe finire su
   un puntino lombardo, e la regione accesa sarebbe quella sbagliata. Ricerca
   lineare: e' uno script che gira una volta, non vale un indice spaziale. */
function puntinoVicino(lon, lat, regione) {
  let migliore = -1
  let distanza = Infinity
  puntini.forEach((p, i) => {
    if (p.regione !== regione) return
    const dx = (p.lon - lon) / PASSO_LON
    const dy = (p.lat - lat) / PASSO_LAT
    const d = dx * dx + dy * dy
    if (d < distanza) {
      distanza = d
      migliore = i
    }
  })
  return migliore
}

const comuni = {}
for (const [chiave, { lon, lat, regione }] of [...candidati].sort((a, b) =>
  a[0].localeCompare(b[0]),
)) {
  const i = puntinoVicino(lon, lat, regione)
  if (i >= 0) comuni[chiave] = i
}

/* --- scrittura ------------------------------------------------------------- */

const mappa = {
  /* Generato da scripts/mappa.mjs. Non modificare a mano. */
  colonne,
  righe,
  regioni: NOMI,
  /* Un puntino e' [colonna, riga, regione, confine]: un array piatto e non
     oggetti, perche' sono qualche migliaio e il file va nel bundle. La
     regione e' l'indice in `regioni`, il confine vale 1 o 0. */
  puntini: puntini.flatMap((p) => [p.c, p.r, p.regione, p.confine ? 1 : 0]),
}

writeFileSync(join(RADICE, 'src/data/italia-mappa.json'), JSON.stringify(mappa))
writeFileSync(join(RADICE, 'src/data/italia-comuni.json'), JSON.stringify(comuni))

console.log(
  `  ${colonne}x${righe}, ${puntini.length} puntini, ${Object.keys(comuni).length} comuni agganciati`,
)
