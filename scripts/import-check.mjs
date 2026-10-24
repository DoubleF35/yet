/**
 * CONTROLLA CHE NIENTE SIA USATO SENZA ESSERE IMPORTATO.
 *
 * PERCHE' ESISTE. Il 24 ottobre il pannello sponsor si e' rotto in produzione
 * con "getSponsorRiservati is not defined". Erano state aggiunte quattro
 * funzioni a lib/db.js e la riga di import nel componente non era stata
 * aggiornata. `npm run build` e' passato senza dire niente: un identificatore
 * che non esiste non e' un errore di compilazione, e' una variabile globale
 * che al momento non c'e'. Il bundle si costruisce, e salta addosso a chi
 * apre la pagina.
 *
 * Questo script chiude quel buco. Per ogni file di src/ guarda cosa importa
 * dai moduli del progetto, e se usa un nome che quel modulo esporta ma che
 * non ha importato, lo dice e fa fallire il build.
 *
 * COSA NON PRENDE, detto perche' non ci si faccia troppo affidamento:
 * un nome che non e' esportato da nessuna parte (un refuso puro) qui non
 * compare, perche' non c'e' niente con cui confrontarlo. Prende il caso che
 * capita davvero, cioe' la funzione aggiunta al modulo e dimenticata
 * nell'import.
 *
 * Gira dentro `npm run build`, accanto al controllo delle due lingue.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const RADICE = 'src'

function tuttiIFile(cartella, raccolti = []) {
  for (const nome of readdirSync(cartella)) {
    const percorso = join(cartella, nome)
    if (statSync(percorso).isDirectory()) tuttiIFile(percorso, raccolti)
    else if (/\.jsx?$/.test(nome)) raccolti.push(percorso)
  }
  return raccolti
}

/** I nomi che un modulo mette a disposizione. */
function esportatiDa(percorso) {
  if (!existsSync(percorso)) return new Set()
  const sorgente = readFileSync(percorso, 'utf8')
  return new Set(
    [
      ...sorgente.matchAll(/export\s+(?:async\s+)?function\s+(\w+)|export\s+(?:const|let)\s+(\w+)/g),
    ].map((m) => m[1] || m[2]),
  )
}

/** Risolve './pippo' in './pippo.js' o './pippo.jsx', come fa Vite. */
function risolvi(daFile, indirizzo) {
  const base = resolve(dirname(daFile), indirizzo)
  if (existsSync(base) && statSync(base).isFile()) return base
  for (const estensione of ['.js', '.jsx']) {
    if (existsSync(base + estensione)) return base + estensione
  }
  return null
}

const problemi = []

for (const file of tuttiIFile(RADICE)) {
  const sorgente = readFileSync(file, 'utf8')

  /* Il corpo senza le righe di import: serve a non contare come "uso" il
     nome che compare dentro l'import stesso. */
  const corpo = sorgente
    .split('\n')
    .filter((riga) => !riga.trim().startsWith('import'))
    .join('\n')

  for (const imp of sorgente.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(\.[^']*)'/g)) {
    const importati = new Set(
      imp[1]
        .split(',')
        .map((x) => x.trim().split(/\s+as\s+/).pop())
        .filter(Boolean),
    )

    const modulo = risolvi(file, imp[2])
    if (!modulo) continue

    for (const nome of esportatiDa(modulo)) {
      if (importati.has(nome)) continue
      /* Seguito da ( oppure da <, cioe' chiamato come funzione o usato come
         componente. Senza questo, una parola come `db` dentro un commento
         farebbe scattare l'allarme a vuoto. */
      if (new RegExp(`\\b${nome}\\s*[(<]`).test(corpo)) {
        problemi.push({ nome, file, modulo: imp[2] })
      }
    }
  }
}

if (problemi.length === 0) {
  console.log('Niente usato senza importarlo.')
  process.exit(0)
}

console.error('\nUSATO MA NON IMPORTATO:\n')
for (const p of problemi) {
  console.error(`  ${p.nome}`)
  console.error(`    usato in     ${p.file}`)
  console.error(`    esportato da ${p.modulo}\n`)
}
console.error(
  problemi.length === 1
    ? 'Un nome da aggiungere alla riga di import.'
    : `${problemi.length} nomi da aggiungere alle righe di import.`,
)
process.exit(1)
