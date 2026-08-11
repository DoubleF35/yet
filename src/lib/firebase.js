/**
 * Inizializzazione di Firebase.
 *
 * Regola di questo file: NON deve mai lanciare a import-time. Se la config
 * manca, il sito si apre lo stesso, le pagine leggono `isFirebaseConfigured`
 * e mostrano un avviso che dice cosa fare. La pagina bianca senza spiegazioni
 * è il modo più veloce per far arenare chi clona il repo.
 */

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/* Le sei chiavi che servono davvero. measurementId è opzionale: esiste solo se
   sul progetto Firebase hai attivato Google Analytics, e non lo usiamo. */
const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const env = import.meta.env

/* Una variabile può esistere ma essere la stringa vuota: succede sempre a chi
   copia .env.example e si dimentica una riga. Per noi "vuota" e "assente" sono
   lo stesso problema, quindi trattiamole allo stesso modo. */
const missing = REQUIRED_KEYS.filter((key) => {
  const value = env[key]
  return typeof value !== 'string' || value.trim() === ''
})

/** Le chiavi che mancano, per poterlo dire all'utente invece di un generico
 *  "non configurato". Le pagine possono mostrarla, ma di solito basta il flag. */
export const missingEnvKeys = missing

const hasAllKeys = missing.length === 0

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  // Passata solo se c'è: un measurementId undefined nell'oggetto non dà
  // fastidio, ma tenerlo fuori rende più leggibile la config in debug.
  ...(env.VITE_FIREBASE_MEASUREMENT_ID
    ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID }
    : {}),
}

let app = null
let auth = null
let db = null

if (hasAllKeys) {
  try {
    /* getApps() invece di initializeApp() secco: in sviluppo l'HMR di Vite
       riesegue questo modulo a ogni salvataggio e una seconda
       initializeApp con lo stesso nome lancia "duplicate-app". */
    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    // Config presente ma malformata (una chiave incollata a metà, di solito).
    // Meglio degradare come nel caso "non configurato" che far esplodere il
    // bundle: l'utente vede un avviso, non una schermata vuota.
    console.error(
      '[YET] Firebase è configurato ma l’inizializzazione è fallita. ' +
        'Controlla i valori in .env, di solito è una chiave incollata male.',
      error,
    )
    app = null
    auth = null
    db = null
  }
} else {
  /* Un avviso solo, e solo in sviluppo: in produzione riempirebbe la console
     di chi visita il sito senza dargli niente di utile. */
  if (import.meta.env.DEV) {
    console.warn(
      '[YET] Firebase non è configurato: mancano ' +
        missing.join(', ') +
        '.\nCopia .env.example in .env, riempi i valori dalla console Firebase ' +
        'e riavvia `npm run dev` (le variabili d’ambiente non hanno hot reload).',
    )
  }
}

/**
 * L'unico flag che le pagine devono guardare.
 *
 * Non è "le variabili d'ambiente ci sono" ma "posso davvero usare auth e db":
 * se la config è presente ma malformata, l'inizializzazione fallisce e chiamare
 * onSnapshot su un `db` null darebbe un TypeError a schermo intero. Facendo
 * coincidere il flag con la disponibilità reale, le pagine hanno un solo
 * controllo da fare e non possono sbagliarlo.
 */
export const isFirebaseConfigured = Boolean(app && auth && db)

export { app, auth, db }
