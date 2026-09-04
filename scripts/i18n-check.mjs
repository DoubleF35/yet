/**
 * Confronta i due cataloghi e si lamenta se non hanno le stesse chiavi.
 *
 *     node scripts/i18n-check.mjs
 *
 * PERCHE' ESISTE. Tradurre un sito intero vuol dire toccare centinaia di
 * stringhe in venti file, e l'errore tipico non e' una frase tradotta male:
 * e' una chiave aggiunta in una lingua e dimenticata nell'altra. A schermo si
 * vedrebbe una riga italiana in mezzo all'inglese (o, senza il ripiego di
 * lib/i18n.jsx, il nome della chiave), e nessuno se ne accorge finche' non
 * capita sotto gli occhi di un utente. Questo script lo trova in un secondo.
 *
 * Segnala tre cose, e sono tutte difetti:
 *   MANCA IN en      la chiave c'e' in italiano e non in inglese
 *   MANCA IN it      il contrario: una chiave inglese orfana, cioe' morta,
 *                    perche' nessun componente puo' averla scritta prima che
 *                    esistesse in italiano
 *   TIPO DIVERSO     da una parte una stringa, dall'altra un oggetto
 *
 * Esce con codice 1 se trova qualcosa, cosi' si puo' mettere in CI.
 */

import it from '../src/i18n/it.js'
import en from '../src/i18n/en.js'

/** Tutte le chiavi a punti di un catalogo, con il tipo della foglia. */
function appiattisci(nodo, prefisso = '', fuori = new Map()) {
  for (const [chiave, valore] of Object.entries(nodo)) {
    const percorso = prefisso ? `${prefisso}.${chiave}` : chiave
    if (valore && typeof valore === 'object' && !Array.isArray(valore)) {
      appiattisci(valore, percorso, fuori)
    } else {
      fuori.set(percorso, typeof valore)
    }
  }
  return fuori
}

const chiaviIt = appiattisci(it)
const chiaviEn = appiattisci(en)

const problemi = []

for (const [chiave, tipo] of chiaviIt) {
  if (!chiaviEn.has(chiave)) problemi.push(`MANCA IN en    ${chiave}`)
  else if (chiaviEn.get(chiave) !== tipo) {
    problemi.push(`TIPO DIVERSO   ${chiave}: it=${tipo} en=${chiaviEn.get(chiave)}`)
  }
}

for (const chiave of chiaviEn.keys()) {
  if (!chiaviIt.has(chiave)) problemi.push(`MANCA IN it    ${chiave}`)
}

/* Una stringa vuota passerebbe i controlli qui sopra ma a schermo e' un buco:
   la trattiamo come una chiave mancante, perche' e' quello che sembra. */
for (const [catalogo, nome] of [
  [it, 'it'],
  [en, 'en'],
]) {
  for (const [chiave, tipo] of appiattisci(catalogo)) {
    if (tipo !== 'string') continue
    const valore = chiave.split('.').reduce((n, p) => n[p], catalogo)
    if (valore.trim() === '') problemi.push(`VUOTA IN ${nome}   ${chiave}`)
  }
}

console.log(`italiano: ${chiaviIt.size} chiavi`)
console.log(`inglese:  ${chiaviEn.size} chiavi`)

if (problemi.length === 0) {
  console.log('\nI due cataloghi combaciano.')
  process.exit(0)
}

console.error(`\n${problemi.length} problemi:`)
for (const p of problemi) console.error('  ' + p)
process.exit(1)
