/**
 * Compressione delle immagini nel browser, prima di salvarle.
 *
 * PERCHÉ ESISTE. Senza Firebase Storage, che richiede il piano Blaze e quindi
 * una carta, l'unico posto dove mettere un file è Firestore. Ma un documento
 * Firestore non può superare **1 MiB**, e una foto scattata con un telefono ne
 * pesa dieci. La compressione non è un'ottimizzazione: è ciò che rende
 * possibile la funzione.
 *
 * COME. L'immagine viene disegnata su una canvas ridimensionata e riesportata
 * in JPEG (o WebP, dove supportato), abbassando la qualità finché non sta nel
 * budget. Il risultato è un data URL, cioè una stringa: quello che finisce nel
 * documento.
 *
 * IL COSTO, DETTO CHIARO. Le immagini perdono risoluzione e vengono ricodificate
 * con perdita: quello che si carica non è più l'originale, e non lo si può
 * recuperare. Per le foto di un incontro va benissimo; per un'immagine che deve
 * restare nitida a schermo intero no. In quel caso conviene allegare l'indirizzo
 * di una copia ospitata altrove.
 */

/** Lato lungo massimo, in pixel. 2000 è più della risoluzione a cui una foto
 *  verrà mai mostrata sul sito, anche su uno schermo ad alta densità: serve a
 *  non buttare via qualità che il budget può permettersi. */
const MAX_EDGE = 2000

/**
 * Quanto può pesare un'immagine una volta codificata in base64.
 *
 * Il numero viene da un vincolo preciso: un documento Firestore non può
 * superare **1 MiB**, cioè 1.048.576 byte, e in quel conto ci va TUTTO
 * campi, nomi dei campi, metadati.
 *
 * Ecco perché ogni immagine sta in un documento suo, nella collection `media`,
 * invece che dentro la notizia. Dentro la notizia il megabyte andrebbe diviso
 * fra il testo e tutte le foto: una sola immagine da 1 MB non lascerebbe posto
 * nemmeno al titolo, e tre foto sarebbero da 300 KB l'una. Con un documento per
 * immagine, invece, **ognuna** può usare quasi tutto il megabyte, e una notizia
 * può averne quante ne servono.
 *
 * 900 KB e non 1024: il resto è per contentType, dimensioni, autore e date.
 */
export const MAX_INLINE_BYTES = 900 * 1024

/** I formati che sappiamo comprimere. Il PDF non è qui: non si ricomprime. */
export const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * Quanto occupa davvero un data URL.
 *
 * La lunghezza della stringa non è il peso del file: base64 usa 4 caratteri
 * ogni 3 byte. Ma è la stringa quella che finisce in Firestore, quindi è la
 * sua lunghezza a contare per il limite del documento, ed è questo che
 * misuriamo, non il peso del file originale.
 */
export function dataUrlBytes(dataUrl) {
  return typeof dataUrl === 'string' ? dataUrl.length : 0
}

export function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** WebP comprime meglio di JPEG a parità di qualità, ma non tutti i browser lo
 *  sanno ESPORTARE (saperlo mostrare è un'altra cosa). Lo chiediamo alla canvas
 *  invece di indovinare dallo user agent. */
function bestMime() {
  try {
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    if (c.toDataURL('image/webp').startsWith('data:image/webp')) return 'image/webp'
  } catch {
    /* niente canvas: si ripiega su JPEG */
  }
  return 'image/jpeg'
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      // L'URL temporaneo va revocato SEMPRE, anche in caso di successo:
      // altrimenti ogni immagine caricata resta in memoria fino al reload.
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Non riesco a leggere questa immagine. Il file potrebbe essere danneggiato.'))
    }
    img.src = url
  })
}

/**
 * Comprime un'immagine finché non sta nel budget.
 *
 * @returns {Promise<{dataUrl:string, bytes:number, width:number, height:number,
 *                    originalBytes:number, mime:string}>}
 */
export async function compressImage(file, { maxBytes = MAX_INLINE_BYTES } = {}) {
  const img = await loadImage(file)

  const scala = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  let w = Math.round(img.naturalWidth * scala)
  let h = Math.round(img.naturalHeight * scala)

  const mime = bestMime()
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const disegna = (larghezza, altezza, qualita) => {
    canvas.width = larghezza
    canvas.height = altezza
    /* I PNG con trasparenza, riesportati in JPEG, avrebbero il fondo NERO:
       JPEG non ha canale alfa e il vuoto resta a zero. Dipingiamo prima il
       beige del sito, così un logo trasparente resta leggibile invece di
       diventare una macchia scura. */
    ctx.fillStyle = '#ECEAE4'
    ctx.fillRect(0, 0, larghezza, altezza)
    ctx.drawImage(img, 0, 0, larghezza, altezza)
    return canvas.toDataURL(mime, qualita)
  }

  /* Prima si abbassa la qualità, poi, solo se non basta, si rimpicciolisce.
     È l'ordine giusto: fra un'immagine grande e sgranata e una piccola e
     pulita, sullo schermo di un telefono vince quasi sempre la seconda, ma
     conviene provare prima a tenere le dimensioni. */
  /* Si parte da una qualità alta e si scende solo se serve. Con 900 KB di
     budget, una foto di un incontro ci sta quasi sempre al primo tentativo:
     il ciclo esiste per le immagini difficili (molto dettagliate, o molto
     grandi), non come comportamento normale. */
  let dataUrl = disegna(w, h, 0.92)
  for (const q of [0.86, 0.78, 0.68, 0.58, 0.48]) {
    if (dataUrlBytes(dataUrl) <= maxBytes) break
    dataUrl = disegna(w, h, q)
  }

  let tentativi = 0
  while (dataUrlBytes(dataUrl) > maxBytes && tentativi < 5 && w > 480) {
    w = Math.round(w * 0.8)
    h = Math.round(h * 0.8)
    dataUrl = disegna(w, h, 0.72)
    tentativi++
  }

  if (dataUrlBytes(dataUrl) > maxBytes) {
    throw new Error(
      `Non riesco a portare questa immagine sotto ${humanBytes(maxBytes)} senza rovinarla. ` +
        'Provane una meno complessa, oppure caricala altrove e allega qui il suo indirizzo.',
    )
  }

  return {
    dataUrl,
    bytes: dataUrlBytes(dataUrl),
    width: w,
    height: h,
    originalBytes: file.size,
    mime,
  }
}

/**
 * Legge un file così com'è, senza toccarlo. Per i PDF, che non si comprimono.
 *
 * Se non ci sta nel budget non c'è niente da fare: meglio dirlo con il numero
 * in mano che lasciare fallire la scrittura su Firestore con un errore che
 * parla di dimensione del documento e non del file.
 */
export function readAsDataUrl(file, { maxBytes = MAX_INLINE_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    // base64 aggiunge circa un terzo: lo stimiamo PRIMA di leggere, per non
    // caricare in memoria un file che comunque scarteremmo.
    const stimato = Math.ceil(file.size * 1.37)
    if (stimato > maxBytes) {
      reject(
        new Error(
          `Questo file pesa ${humanBytes(file.size)} e senza Firebase Storage il massimo è ` +
            `circa ${humanBytes(Math.floor(maxBytes / 1.37))}. Caricalo su Drive e allega qui ` +
            'il suo indirizzo.',
        ),
      )
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      if (dataUrlBytes(dataUrl) > maxBytes) {
        reject(new Error('Il file è troppo grande per essere salvato dentro la notizia.'))
        return
      }
      resolve({ dataUrl, bytes: dataUrlBytes(dataUrl), originalBytes: file.size, mime: file.type })
    }
    reader.onerror = () => reject(new Error('Non riesco a leggere il file.'))
    reader.readAsDataURL(file)
  })
}

/* ---------------------------------------------------------------------------
   Foto profilo

   Budget molto più stretto di quello degli allegati, e il motivo è dove finisce
   il dato: la foto profilo sta DENTRO il documento dell'utente, e la pagina
   Membri scarica tutti i profili in una volta. Una foto da 900 KB a testa
   vorrebbe dire decine di megabyte su un elenco di trenta persone, sulla
   connessione di chi la apre dal telefono.

   320px basta e avanza: l'avatar si vede a 36-56px, e 320 copre gli schermi ad
   alta densità con margine.
--------------------------------------------------------------------------- */

export const AVATAR_MAX_EDGE = 320
export const AVATAR_MAX_BYTES = 70 * 1024

/** Comprime una foto profilo: quadrata, piccola, ritagliata al centro. */
export async function compressAvatar(file) {
  const img = await loadImage(file)

  const lato = AVATAR_MAX_EDGE
  const canvas = document.createElement('canvas')
  canvas.width = lato
  canvas.height = lato
  const ctx = canvas.getContext('2d')
  const mime = bestMime()

  /* Ritaglio quadrato dal centro, invece di deformare. Una foto verticale
     schiacciata in un quadrato fa una faccia larga il doppio: meglio tagliare
     i lati, che è quello che fa qualunque social. */
  const lastoCorto = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - lastoCorto) / 2
  const sy = (img.naturalHeight - lastoCorto) / 2

  const disegna = (qualita) => {
    ctx.fillStyle = '#ECEAE4'
    ctx.fillRect(0, 0, lato, lato)
    ctx.drawImage(img, sx, sy, lastoCorto, lastoCorto, 0, 0, lato, lato)
    return canvas.toDataURL(mime, qualita)
  }

  let dataUrl = disegna(0.85)
  for (const q of [0.75, 0.65, 0.55, 0.45]) {
    if (dataUrlBytes(dataUrl) <= AVATAR_MAX_BYTES) break
    dataUrl = disegna(q)
  }

  if (dataUrlBytes(dataUrl) > AVATAR_MAX_BYTES) {
    throw new Error('Non riesco a comprimere abbastanza questa foto. Provane un\u2019altra.')
  }

  return { dataUrl, bytes: dataUrlBytes(dataUrl), mime }
}
