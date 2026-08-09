/**
 * Backup di Firestore su file JSON.
 *
 *     npm run backup
 *
 * PERCHÉ ESISTE. I dati del sito non stanno nel repo: stanno su Firestore, e
 * un deploy non li tocca mai. Quello che nessuno fa al posto tuo è la copia di
 * sicurezza: sul piano gratuito Spark, Firebase non offre né backup
 * programmati né il ripristino a un istante preciso. Se qualcuno cancella la
 * cosa sbagliata, non c'è un "annulla". Questo script è quel "annulla",
 * a patto di lanciarlo ogni tanto.
 *
 * DUE MODI DI FUNZIONARE, e conviene sapere quale stai usando.
 *
 *   COMPLETO — con una chiave di servizio.
 *     Legge tutto, comprese le richieste in attesa e quelle rifiutate, perché
 *     l'SDK di amministrazione scavalca le regole di sicurezza.
 *     Serve una volta sola:
 *       npm install --save-dev firebase-admin
 *       console Firebase → ingranaggio → Impostazioni progetto →
 *       Account di servizio → "Genera nuova chiave privata" → salvi il file
 *       export GOOGLE_APPLICATION_CREDENTIALS=/percorso/della/chiave.json
 *
 *     ⚠️  QUELLA CHIAVE APRE TUTTO IL PROGETTO, ignorando ogni regola.
 *         Non va nel repo, non va in chat, non va su Drive condiviso.
 *         .gitignore la copre già, ma la vera difesa sei tu.
 *
 *   PARZIALE — senza chiave, e senza installare niente.
 *     Usa lo stesso SDK del sito e legge solo quello che è pubblico: le
 *     notizie (tutte, anche le bozze) e i profili APPROVATI. Restano fuori i
 *     profili in attesa e quelli rifiutati.
 *     È comunque meglio di niente, ed è il modo per farsi una copia al volo.
 *
 * Lo script dice sempre in quale dei due modi ha lavorato: un backup che si
 * crede completo e non lo è sarebbe peggio di nessun backup.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'backups')
const COLLECTIONS = ['users', 'news']

/* ------------------------------------------------------------------------- */

function readEnv() {
  const path = join(ROOT, '.env')
  if (!existsSync(path)) {
    console.error(
      'Manca il file .env. Copia .env.example in .env e riempi i valori,\n' +
        'altrimenti lo script non sa a quale progetto Firebase collegarsi.',
    )
    process.exit(1)
  }
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=')
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
      }),
  )
}

/* I Timestamp di Firestore non sopravvivono a JSON.stringify: diventerebbero
   {_seconds, _nanoseconds} con l'SDK admin e un oggetto opaco con quello
   client. Li portiamo in ISO 8601, che si rilegge ovunque e resta leggibile
   anche aprendo il file a mano — che è metà del valore di un backup. */
function plain(value) {
  if (value === null || value === undefined) return null
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(plain)
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]))
  }
  return value
}

/* ------------------------------------------------------------------------- */

async function viaAdmin(env) {
  const key = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!key) return null

  let admin
  try {
    admin = await import('firebase-admin/app')
  } catch {
    console.warn(
      'GOOGLE_APPLICATION_CREDENTIALS è impostata ma firebase-admin non è installato.\n' +
        'Installalo con:  npm install --save-dev firebase-admin\n' +
        'Per adesso procedo in modo parziale.\n',
    )
    return null
  }

  if (!existsSync(key)) {
    console.warn(`La chiave indicata da GOOGLE_APPLICATION_CREDENTIALS non esiste: ${key}\n`)
    return null
  }

  const { getFirestore } = await import('firebase-admin/firestore')
  const app = admin.initializeApp({
    credential: admin.cert(JSON.parse(readFileSync(key, 'utf8'))),
    projectId: env.VITE_FIREBASE_PROJECT_ID,
  })
  const db = getFirestore(app)

  const data = {}
  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get()
    data[name] = snap.docs.map((d) => ({ id: d.id, ...plain(d.data()) }))
  }
  return { data, modo: 'completo' }
}

async function viaClient(env) {
  const { initializeApp } = await import('firebase/app')
  const { getFirestore, collection, getDocs, query, where } = await import('firebase/firestore')

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const db = getFirestore(app)

  const dump = async (q) => (await getDocs(q)).docs.map((d) => ({ id: d.id, ...plain(d.data()) }))

  /* Il filtro su status non è pigrizia: le regole concedono la lettura
     pubblica ai soli profili approvati, e Firestore rifiuta l'INTERA query se
     non è costruita in modo che ogni risultato la soddisfi. Senza il where
     non otterremmo "meno documenti" ma un permission-denied secco. */
  return {
    data: {
      users: await dump(query(collection(db, 'users'), where('status', '==', 'approved'))),
      news: await dump(collection(db, 'news')),
    },
    modo: 'parziale',
  }
}

/* ------------------------------------------------------------------------- */

const env = readEnv()
const progetto = env.VITE_FIREBASE_PROJECT_ID
console.log(`Progetto: ${progetto}\n`)

let esito
try {
  esito = (await viaAdmin(env)) ?? (await viaClient(env))
} catch (error) {
  console.error('Backup non riuscito:', error?.message || error)
  if (error?.code === 'permission-denied') {
    console.error(
      '\nIl server ha rifiutato la lettura. Controlla che le regole pubblicate\n' +
        'siano allineate a firestore.rules.',
    )
  }
  process.exit(1)
}

const { data, modo } = esito

mkdirSync(OUT_DIR, { recursive: true })
// Data in ISO con i due punti sostituiti: i due punti nei nomi file danno
// problemi su Windows, e prima o poi qualcuno aprirà questa cartella da lì.
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const file = join(OUT_DIR, `yet-${stamp}.json`)

writeFileSync(
  file,
  JSON.stringify(
    { progetto, esportatoIl: new Date().toISOString(), modo, collezioni: data },
    null,
    2,
  ),
)

console.log(`Salvato in  backups/${file.split('/').pop()}`)
for (const [nome, righe] of Object.entries(data)) {
  console.log(`  ${nome.padEnd(6)} ${righe.length} documenti`)
}

if (modo === 'parziale') {
  console.log(
    '\n⚠️  Backup PARZIALE: senza chiave di servizio restano fuori i profili in\n' +
      '   attesa di approvazione e quelli rifiutati. I profili approvati e tutte\n' +
      '   le notizie ci sono. Per la copia completa vedi il commento in cima a\n' +
      '   questo file.',
  )
} else {
  console.log('\nBackup completo: incluse le richieste in attesa e quelle rifiutate.')
}
