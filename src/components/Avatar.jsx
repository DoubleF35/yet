import { useEffect, useState } from 'react'

import { safeImageSrc } from '../lib/attachments.js'

import s from './Avatar.module.css'

/**
 * Ricava le iniziali da un nome.
 *
 * Regge i casi veri: un nome solo ("Federico" -> FE, non F), spazi doppi,
 * spazi in testa e in coda, nomi con il trattino, e la stringa vuota. Prende
 * la prima lettera del primo e dell'ultimo pezzo, con tre nomi, "Anna Maria
 * Rossi" dà AR e non AM, che è quello che ci si aspetta.
 */
export function initialsFrom(name) {
  const parts = String(name ?? '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    // Una parola sola: due lettere si leggono meglio di una in un cerchio.
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Avatar quadrato: la foto se c'è ed è caricabile, altrimenti le iniziali su
 * fondo coral.
 *
 * @param {string} [src]  URL della foto
 * @param {string} [name] nome, per le iniziali e per il testo alternativo
 * @param {number} [size] lato in px (default 48)
 */
export default function Avatar({ src, name, size = 48, className = '' }) {
  const [failed, setFailed] = useState(false)

  /* Se cambia la foto (succede nell'anteprima della pagina Join, a ogni tasto)
     va azzerato il fallimento precedente: senza, un URL sbagliato inserito una
     volta lascerebbe le iniziali anche dopo averlo corretto. */
  useEffect(() => {
    setFailed(false)
  }, [src])

  /* safeImageSrc e non la stringa grezza: la foto può essere un indirizzo
     incollato oppure un data URL di una foto caricata dall'utente, e in
     entrambi i casi finisce dentro un `src`. Il controllo qui è l'ultima
     barriera prima del DOM, protegge anche dalle foto salvate prima che
     questa validazione esistesse. Un `javascript:` o un SVG non passano. */
  const clean = safeImageSrc(src) ?? ''
  const showImage = clean !== '' && !failed
  const label = name ? String(name) : 'Membro'

  // Le iniziali scalano col riquadro: a 32px un font fisso da 18px sborda,
  // a 96px sembra un francobollo.
  const style = { '--avatar-size': `${size}px`, '--avatar-font': `${Math.round(size * 0.38)}px` }

  if (showImage) {
    return (
      <img
        className={`${s.avatar} ${s.image} ${className}`.trim()}
        style={style}
        src={clean}
        // L'immagine è già accompagnata dal nome scritto accanto in ogni punto
        // in cui la usiamo: ripeterlo qui farebbe leggere il nome due volte
        // a uno screen reader. Quindi alt vuoto e aria-hidden.
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        // Una foto Google che non carica (link scaduto, utente offline) deve
        // lasciare le iniziali, non il rettangolo con l'icona rotta.
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span className={`${s.avatar} ${s.fallback} ${className}`.trim()} style={style} aria-hidden="true">
      {initialsFrom(label)}
    </span>
  )
}
