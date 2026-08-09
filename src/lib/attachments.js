/**
 * Allegati di una notizia: link e immagini.
 *
 * Sta in un file suo perché le stesse regole servono in due momenti lontani
 * fra loro — quando un admin scrive (pagina Admin) e quando un visitatore
 * legge (pagina Home) — e devono essere le stesse. Se divergessero, potremmo
 * salvare qualcosa che poi non sappiamo mostrare, o peggio mostrare qualcosa
 * che non avremmo dovuto accettare.
 *
 * PERCHÉ LA VALIDAZIONE VERA È AL MOMENTO DI MOSTRARE, NON DI SALVARE.
 *
 * Un URL finisce dentro un attributo `href` o `src`. Uno schema come
 * `javascript:` in un href è codice che parte al clic: è il classico XSS.
 * Controllarlo solo in scrittura proteggerebbe solo i dati scritti da domani —
 * non quelli già in archivio, non quelli scritti da una versione futura con un
 * bug, non quelli messi a mano dalla console Firebase. Quindi si controlla
 * ANCHE — e soprattutto — in lettura, che è il punto in cui il danno
 * accadrebbe.
 */

/** Quanti allegati per notizia. Non è una limitazione tecnica: oltre questo
 *  numero la card diventa un elenco di link e la notizia non si legge più. */
export const MAX_ATTACHMENTS = 8

/** Lunghezza massima dell'etichetta visibile. */
export const LABEL_MAX = 120

/** Lunghezza massima dell'URL. Allineata al limite delle regole. */
export const URL_MAX = 2000

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i

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
    return last ? `${host} — ${decodeURIComponent(last)}`.slice(0, LABEL_MAX) : host
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
    if (visti.has(norm.url)) continue
    visti.add(norm.url)
    out.push(norm)
    if (out.length >= MAX_ATTACHMENTS) break
  }
  return out
}
