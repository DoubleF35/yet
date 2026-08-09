/**
 * Caricamento di file su Firebase Storage.
 *
 * ⚠️  NON COLLAUDATO CONTRO UN BUCKET VERO.
 *     Al momento in cui è stato scritto, Storage su questo progetto non era
 *     attivo: entrambi i bucket rispondevano 404. Il codice segue l'SDK
 *     ufficiale ed è quello che serve, ma nessuno l'ha ancora visto caricare
 *     un file davvero. Alla prima prova, se qualcosa non torna, il sospetto
 *     numero uno sono le regole di Storage (storage.rules), che sono un file
 *     separato da firestore.rules e vanno pubblicate a parte.
 *
 * ⚠️  STORAGE NON ESISTE SUL PIANO SPARK. Non è una soglia da superare: dal
 *     3 febbraio 2026 un progetto Spark non ha accesso a NESSUN bucket, nemmeno
 *     quello predefinito, e le chiamate rispondono 402 o 403. Serve per forza il
 *     piano Blaze, cioè una carta collegata al progetto — anche per caricare un
 *     solo file da 50 KB.
 *
 * COME ATTIVARE STORAGE
 *   1. Passa il progetto al piano Blaze (serve una carta).
 *   2. console Firebase → Storage → «Inizia» → SCEGLI LA REGIONE CON CURA:
 *      la soglia «Always Free» dei bucket .firebasestorage.app vale SOLO per
 *      us-central1, us-east1 e us-west1. In una regione europea si paga dal
 *      primo byte — pochi centesimi al mese con questi volumi, ma non zero.
 *      È un compromesso vero: gli Stati Uniti costano zero ma spostano i file
 *      fuori dall'Europa, e l'informativa privacy va aggiornata di conseguenza.
 *   3. Storage → scheda «Regole» → incolla storage.rules → Pubblica.
 */

import { getApp } from 'firebase/app'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'

import { isFirebaseConfigured } from './firebase.js'

/** Tetto per file. Non è un limite di Storage: è una scelta nostra, perché
 *  un allegato da 40 MB in una notizia non lo scarica nessuno da telefono. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

/** I tipi che accettiamo. Elenco chiuso e non "tutto tranne": un elenco di
 *  esclusioni si dimentica sempre qualcosa. */
export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
]

export const ACCEPT_ATTR = ACCEPTED_TYPES.join(',')

let storage = null
if (isFirebaseConfigured) {
  try {
    storage = getStorage(getApp())
  } catch {
    // Nessun bucket configurato: si degrada, non si esplode.
    storage = null
  }
}

/**
 * ATTENZIONE AL SIGNIFICATO: vuol dire «l'SDK è inizializzato», NON «il bucket
 * esiste».
 *
 * `getStorage()` riesce sempre, purché in .env ci sia un nome di bucket: non
 * va a controllare che quel bucket sia mai stato creato. Fidarsi di questo
 * flag da solo farebbe comparire un bottone «Carica un file» perfettamente
 * funzionante all'aspetto, che fallisce al primo clic. Per sapere la verità
 * serve `probeStorage()` qui sotto.
 */
export const isStorageSdkReady = Boolean(storage)

/* Il risultato della sonda, tenuto da parte: il bucket non nasce nel mezzo di
   una sessione, quindi chiederlo una volta basta. */
let probeCache = null

/**
 * Chiede al server se il bucket esiste davvero.
 *
 * Una sola richiesta, fatta quando l'editor degli allegati compare — cioè solo
 * per gli admin, e non a ogni visita del sito.
 *
 * Come si legge la risposta: 404 significa che il bucket non è mai stato
 * creato. Qualunque altra cosa — compreso un 401 o un 403 — significa che
 * esiste ed è solo protetto, che è esattamente quel che vogliamo sapere.
 */
export async function probeStorage() {
  if (!isStorageSdkReady) return false
  if (probeCache !== null) return probeCache

  const bucket = storage?.app?.options?.storageBucket
  if (!bucket) {
    probeCache = false
    return false
  }

  try {
    const res = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?maxResults=1`,
      { method: 'GET' },
    )
    probeCache = res.status !== 404
  } catch {
    // Rete assente: non possiamo dire che Storage non c'è. Meglio lasciar
    // provare e far parlare l'errore vero del caricamento.
    probeCache = true
  }
  return probeCache
}

export function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Un nome file che non collide e non si porta dietro sorprese.
 *
 * Il nome originale non va usato così com'è: può contenere accenti, spazi,
 * barre e caratteri che nel percorso di Storage significano altro. Lo
 * ripuliamo e gli mettiamo davanti un prefisso casuale, così due persone che
 * caricano entrambe `foto.jpg` non si sovrascrivono a vicenda.
 */
function safeName(name) {
  const pulito = String(name || 'file')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(-60)
  const rnd = Math.random().toString(36).slice(2, 8)
  return `${Date.now()}-${rnd}-${pulito || 'file'}`
}

/**
 * Carica un file e restituisce l'URL pubblico.
 *
 * @param {File}     file
 * @param {object}   opts
 * @param {string}   opts.uid        chi carica: finisce nel percorso, così le
 *                                   regole possono legarlo a chi ha il diritto
 * @param {Function} opts.onProgress riceve 0..100
 * @returns {Promise<{url:string, path:string, name:string, size:number, contentType:string}>}
 */
export function uploadNewsFile(file, { uid, onProgress } = {}) {
  if (!isStorageSdkReady) {
    return Promise.reject(
      new Error(
        'Firebase Storage non è attivo su questo progetto: apri la console Firebase, ' +
          'sezione Storage, e premi «Inizia». Finché è spento puoi allegare l’indirizzo ' +
          'di un file, ma non il file.',
      ),
    )
  }
  if (!file) return Promise.reject(new Error('Nessun file selezionato.'))

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return Promise.reject(
      new Error(
        `Tipo di file non ammesso (${file.type || 'sconosciuto'}). ` +
          'Puoi caricare immagini JPEG, PNG, WebP, GIF, AVIF oppure un PDF.',
      ),
    )
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(
      new Error(
        `Il file pesa ${humanSize(file.size)}: il massimo è ${humanSize(MAX_UPLOAD_BYTES)}.`,
      ),
    )
  }

  const path = `news/${uid || 'anonimo'}/${safeName(file.name)}`
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type,
    // Un anno di cache: il nome contiene già un elemento casuale, quindi un
    // file caricato non cambia mai contenuto a parità di URL.
    cacheControl: 'public, max-age=31536000, immutable',
  })

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (typeof onProgress === 'function' && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
        }
      },
      (error) => {
        // I codici che capitano davvero, tradotti nella mossa successiva.
        const codice = error?.code ?? ''
        if (codice === 'storage/unauthorized') {
          reject(
            new Error(
              'Storage ha rifiutato il caricamento. Controlla di aver pubblicato storage.rules: ' +
                'sono un file separato da firestore.rules e vanno pubblicate dalla scheda ' +
                '«Regole» della sezione Storage.',
            ),
          )
        } else if (codice === 'storage/unknown' || codice === 'storage/object-not-found') {
          reject(
            new Error(
              'Storage non risponde: probabilmente il bucket non è mai stato creato. ' +
                'Console Firebase → Storage → «Inizia».',
            ),
          )
        } else if (codice === 'storage/canceled') {
          reject(new Error('Caricamento annullato.'))
        } else {
          reject(error)
        }
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve({
            url,
            path,
            name: file.name,
            size: file.size,
            contentType: file.type,
          })
        } catch (error) {
          reject(error)
        }
      },
    )
  })
}

/**
 * Cancella un file caricato.
 *
 * Chiamata quando si toglie un allegato appena caricato, per non lasciare
 * rifiuti nel bucket. Non lancia: se il file non c'è più o la cancellazione è
 * vietata, l'utente ha comunque ottenuto quel che voleva — l'allegato via
 * dalla notizia — e un errore qui sarebbe rumore.
 */
export async function deleteUploadedFile(path) {
  if (!isStorageSdkReady || !path) return false
  try {
    await deleteObject(ref(storage, path))
    return true
  } catch (error) {
    console.warn('[YET] Non sono riuscito a cancellare il file da Storage:', path, error)
    return false
  }
}
