/**
 * Ripristino di un backup su Firestore.
 *
 *     npm run restore -- backups/yet-2026-08-09T06-37-23.json          # prova
 *     npm run restore -- backups/yet-2026-08-09T06-37-23.json --scrivi # davvero
 *
 * DI PROPOSITO NON SCRIVE NIENTE FINCHÉ NON GLIELO DICI DUE VOLTE.
 * Senza `--scrivi` fa solo il confronto e ti mostra cosa cambierebbe. È lo
 * strumento che si usa quando qualcosa è già andato storto: è il momento in
 * cui si sbaglia più facilmente, e in cui un comando che parte al primo colpo
 * fa più danni di quelli che ripara.
 *
 * SERVE UNA CHIAVE DI SERVIZIO. Scrivere il documento di un altro utente è
 * vietato dalle regole a chiunque, admin compresi (possono solo cambiare lo
 * status). Il ripristino quindi passa per forza dall'SDK di amministrazione,
 * che le regole le scavalca:
 *
 *     npm install --save-dev firebase-admin
 *     export GOOGLE_APPLICATION_CREDENTIALS=/percorso/della/chiave.json
 *
 * COSA FA E COSA NON FA.
 *   Riscrive i documenti presenti nel backup, con il loro id originale.
 *   NON cancella i documenti creati dopo il backup: un ripristino non deve
 *   portarsi via il lavoro di chi ha continuato a usare il sito mentre tu
 *   sistemavi le cose. Se un documento va tolto, si toglie a mano.
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const scrivi = args.includes('--scrivi')
const fileArg = args.find((a) => !a.startsWith('--'))

if (!fileArg) {
  console.error(
    'Uso:\n' +
      '  npm run restore -- <file di backup>            prova, non scrive\n' +
      '  npm run restore -- <file di backup> --scrivi   applica\n',
  )
  process.exit(1)
}

const file = resolve(ROOT, fileArg)
if (!existsSync(file)) {
  console.error(`File non trovato: ${file}`)
  process.exit(1)
}

const backup = JSON.parse(readFileSync(file, 'utf8'))
if (!backup.collezioni) {
  console.error('Questo file non sembra un backup prodotto da `npm run backup`.')
  process.exit(1)
}

console.log(`Backup      ${fileArg}`)
console.log(`Progetto    ${backup.progetto}`)
console.log(`Esportato   ${backup.esportatoIl}`)
console.log(`Modo        ${backup.modo}`)
if (backup.modo === 'parziale') {
  console.log(
    '\n⚠️  Questo backup è PARZIALE: non contiene i profili in attesa né quelli\n' +
      '   rifiutati. Ripristinandolo NON li cancelli (lo script non cancella\n' +
      '   niente), ma non li recuperi nemmeno.',
  )
}
console.log()

const key = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!key || !existsSync(key)) {
  console.error(
    'Serve una chiave di servizio: le regole vietano a chiunque di riscrivere il\n' +
      'documento di un altro utente, quindi il ripristino passa per forza dall’SDK\n' +
      'di amministrazione.\n\n' +
      '  npm install --save-dev firebase-admin\n' +
      '  export GOOGLE_APPLICATION_CREDENTIALS=/percorso/della/chiave.json\n',
  )
  process.exit(1)
}

let appMod
try {
  appMod = await import('firebase-admin/app')
} catch {
  console.error('firebase-admin non è installato:\n  npm install --save-dev firebase-admin\n')
  process.exit(1)
}

const { getFirestore, Timestamp } = await import('firebase-admin/firestore')
const app = appMod.initializeApp({
  credential: appMod.cert(JSON.parse(readFileSync(key, 'utf8'))),
  projectId: backup.progetto,
})
const db = getFirestore(app)

/* Il backup salva le date in ISO per restare leggibile. Qui vanno riportate a
   Timestamp, altrimenti tornerebbero dentro come stringhe e ogni ordinamento e
   ogni confronto nelle regole smetterebbe di funzionare — in silenzio. */
const DATE_FIELDS = new Set(['createdAt', 'updatedAt'])
function hydrate(doc) {
  const out = {}
  for (const [k, v] of Object.entries(doc)) {
    if (k === 'id') continue
    out[k] = DATE_FIELDS.has(k) && typeof v === 'string' ? Timestamp.fromDate(new Date(v)) : v
  }
  return out
}

let nuovi = 0
let modificati = 0
let identici = 0

for (const [nome, righe] of Object.entries(backup.collezioni)) {
  console.log(`${nome} — ${righe.length} documenti nel backup`)

  for (const riga of righe) {
    const ref = db.collection(nome).doc(riga.id)
    const attuale = await ref.get()
    const dati = hydrate(riga)

    if (!attuale.exists) {
      nuovi++
      console.log(`  + ${riga.id}  (assente sul server, verrebbe ricreato)`)
    } else {
      // Confronto sul JSON normalizzato: basta a dire "uguale o diverso", che
      // è tutto quel che serve per decidere se scrivere.
      const a = JSON.stringify(hydrate({ ...attuale.data(), id: riga.id }))
      const b = JSON.stringify(dati)
      if (a === b) {
        identici++
        continue
      }
      modificati++
      console.log(`  ~ ${riga.id}  (diverso sul server, verrebbe sovrascritto)`)
    }

    if (scrivi) await ref.set(dati)
  }
}

console.log(
  `\n${nuovi} da ricreare, ${modificati} da sovrascrivere, ${identici} già identici.`,
)

if (scrivi) {
  console.log('\nRipristino applicato.')
} else {
  console.log(
    '\nNiente è stato scritto: questa era una prova.\n' +
      'Se il riepilogo qui sopra è quello che ti aspetti, rilancia con --scrivi.',
  )
}
