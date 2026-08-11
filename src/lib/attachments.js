/**
 * Allegati di una notizia: link e immagini.
 *
 * Sta in un file suo perché le stesse regole servono in due momenti lontani
 * fra loro, quando un admin scrive (pagina Admin) e quando un visitatore
 * legge (pagina Home), e devono essere le stesse. Se divergessero, potremmo
 * salvare qualcosa che poi non sappiamo mostrare, o peggio mostrare qualcosa
 * che non avremmo dovuto accettare.
 *
 * PERCHÉ LA VALIDAZIONE VERA È AL MOMENTO DI MOSTRARE, NON DI SALVARE.
 *
 * Un URL finisce dentro un attributo `href` o `src`. Uno schema come
 * `javascript:` in un href è codice che parte al clic: è il classico XSS.
 * Controllarlo solo in scrittura proteggerebbe solo i dati scritti da domani
 * non quelli già in archivio, non quelli scritti da una versione futura con un
 * bug, non quelli messi a mano dalla console Firebase. Quindi si controlla
 * ANCHE, e soprattutto, in lettura, che è il punto in cui il danno
 * accadrebbe.
 */

/** Quanti allegati per notizia. Non è una limitazione tecnica: oltre questo
 *  numero la card diventa un elenco di link e la notizia non si legge più. */
export const MAX_ATTACHMENTS = 8

/** Gli id dei media referenziati da un elenco di allegati. */
export function mediaIdsOf(list) {
  return normalizeAttachments(list)
    .map((a) => a.mediaId)
    .filter(Boolean)
}

/** Lunghezza massima dell'etichetta visibile. */
export const LABEL_MAX = 120

/** Lunghezza massima dell'URL. Allineata al limite delle regole. */
export const URL_MAX = 2000

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i

/**
 * I data URL che accettiamo come sorgente di un <img>.
 *
 * NOTA LA MANCANZA DI `svg`, ed è la riga più importante di questo file.
 * Un SVG è un documento XML che può contenere `<script>`: dato in pasto a un
 * tag <img> il codice non parte, ma basta che un domani qualcuno lo apra in
 * una scheda o lo metta in un <object> perché parta. Un elenco chiuso che non
 * lo comprende è più solido di qualunque controllo aggiunto dopo.
 *
 * Il PDF è a parte: non va in un <img>, va in un link di download.
 */
const DATA_IMAGE = /^data:image\/(jpeg|png|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/
const DATA_PDF = /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/

/**
 * Sorgente valida per un <img>: un http(s) oppure un data URL di immagine.
 *
 * Separata da safeUrl() di proposito. safeUrl continua a RIFIUTARE i data URL,
 * perché serve per gli `href`, e un data URL dentro un href è navigabile
 * cioè è una pagina che apriamo noi con i nostri permessi. Qui invece siamo
 * dentro un `src`, dove un'immagine è solo un'immagine.
 * Due usi diversi, due controlli diversi: fonderli sarebbe comodo e sbagliato.
 */
export function safeImageSrc(value) {
  const raw = String(value ?? '').trim()
  if (DATA_IMAGE.test(raw)) return raw
  return safeUrl(raw)
}

/** Sorgente valida per il download di un file caricato. */
export function safeFileSrc(value) {
  const raw = String(value ?? '').trim()
  if (DATA_PDF.test(raw) || DATA_IMAGE.test(raw)) return raw
  return safeUrl(raw)
}

/**
 * Riconosce e normalizza un URL, oppure restituisce null.
 *
 * Ammessi SOLO http e https. Niente `javascript:`, niente `data:` (che
 * permetterebbe di infilare un'immagine da mezzo megabyte dentro un documento
 * Firestore), niente `file:`.
 *
 * La normalizzazione dello schema in minuscolo serve per lo stesso motivo che
 * ci ha già morso con photoURL: l'API URL abbassa lo schema quando analizza,
 * quindi un `HTTPS://` passa il controllo, ma se poi salviamo la stringa
 * grezza le regex lato server non lo riconoscono più.
 */
export function safeUrl(value) {
  const raw = String(value ?? '').trim()
  if (!raw || raw.length > URL_MAX) return null

  let parsed
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  return parsed.href
}

/** Indovina se un URL punta a un'immagine, dall'estensione. */
export function looksLikeImage(url) {
  const safe = safeUrl(url)
  if (!safe) return false
  try {
    return IMAGE_EXT.test(new URL(safe).pathname)
  } catch {
    return false
  }
}

/**
 * Un'etichetta sensata quando l'admin non ne scrive una.
 *
 * Il dominio più il nome del file dice molto più dell'URL intero, che in una
 * card occuperebbe tre righe e non si leggerebbe comunque.
 */
export function defaultLabel(url) {
  const safe = safeUrl(url)
  if (!safe) return ''
  try {
    const { hostname, pathname } = new URL(safe)
    const host = hostname.replace(/^www\./, '')
    const last = pathname.split('/').filter(Boolean).pop()
    return last ? `${host} - ${decodeURIComponent(last)}`.slice(0, LABEL_MAX) : host
  } catch {
    return safe.slice(0, LABEL_MAX)
  }
}

/**
 * Porta un allegato qualsiasi nella forma canonica, o lo scarta.
 *
 * @returns {{type:'link'|'image', url:string, label:string}|null}
 */
export function normalizeAttachment(item) {
  if (!item || typeof item !== 'object') return null

  /* Allegato caricato: il contenuto non sta qui, sta in media/{id}. Nel
     documento della notizia resta solo il riferimento, così la notizia pesa
     una manciata di byte anche con cinque foto attaccate. */
  if (item.mediaId) {
    const mediaId = String(item.mediaId).trim()
    if (!mediaId || mediaId.length > 64) return null
    const type = item.type === 'file' ? 'file' : 'image'
    return {
      type,
      mediaId,
      label: String(item.label ?? '').trim().slice(0, LABEL_MAX) || 'Allegato',
    }
  }

  const url = safeUrl(item.url)
  if (!url) return null

  // Il tipo dichiarato ha la precedenza (l'admin può forzare "link" su un URL
  // che finisce in .jpg, per esempio se l'immagine è enorme), ma se manca o è
  // sconosciuto lo deduciamo.
  const declared = item.type === 'image' || item.type === 'link' ? item.type : null
  const type = declared ?? (looksLikeImage(url) ? 'image' : 'link')

  const label = String(item.label ?? '').trim().slice(0, LABEL_MAX) || defaultLabel(url)

  return { type, url, label }
}

/**
 * Ripulisce l'intero elenco: scarta il non valido, toglie i doppioni,
 * tronca al massimo consentito.
 *
 * Tollerante con l'ingresso (può arrivare null, o roba scritta a mano nella
 * console Firebase) e severa con l'uscita: chi la chiama può fidarsi.
 */
export function normalizeAttachments(list) {
  if (!Array.isArray(list)) return []

  const visti = new Set()
  const out = []

  for (const item of list) {
    const norm = normalizeAttachment(item)
    if (!norm) continue
    const chiave = norm.mediaId ? `media:${norm.mediaId}` : norm.url
    if (visti.has(chiave)) continue
    visti.add(chiave)
    out.push(norm)
    if (out.length >= MAX_ATTACHMENTS) break
  }
  return out
}
