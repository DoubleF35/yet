import { useEffect, useState } from 'react'

import { safeImageSrc } from '../lib/attachments.js'
import { useI18n } from '../lib/i18n.jsx'

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
 * @param {string}  [src]  URL della foto
 * @param {string}  [name] nome, per le iniziali e per il testo alternativo
 * @param {number}  [size] lato in px (default 48)
 * @param {boolean} [fill] se vero ignora `size` e riempie il contenitore,
 *                  mantenendo il quadrato con aspect-ratio. Serve alle tessere
 *                  della Vetrina, dove la foto e' una banda a piena larghezza
 *                  e non un bollino accanto al nome: e' l'unico modo di vedere
 *                  davvero chi c'e' nella foto.
 */
export default function Avatar({ src, name, size = 48, fill = false, className = '' }) {
  const [failed, setFailed] = useState(false)
  const { t } = useI18n()

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
  /* Il ripiego serve alle iniziali, che si VEDONO: senza nome e senza foto
     resterebbe un quadrato coral vuoto. */
  const label = name ? String(name) : t('stati.membro')

  // Le iniziali scalano col riquadro: a 32px un font fisso da 18px sborda,
  // a 96px sembra un francobollo.
  /* In modalita' `fill` la dimensione la decide il contenitore, quindi non si
     scrive nessuna misura fissa: si passa solo il corpo delle iniziali, che
     resta proporzionato perche' e' espresso in unita' relative alla tessera. */
  const style = fill
    ? { '--avatar-font': 'clamp(2rem, 14vw, 3.5rem)' }
    : { '--avatar-size': `${size}px`, '--avatar-font': `${Math.round(size * 0.38)}px` }

  if (showImage) {
    return (
      <img
        className={`${s.avatar} ${s.image} ${fill ? s.fill : ''} ${className}`.trim()}
        style={style}
        src={clean}
        // L'immagine è già accompagnata dal nome scritto accanto in ogni punto
        // in cui la usiamo: ripeterlo qui farebbe leggere il nome due volte
        // a uno screen reader. Quindi alt vuoto e aria-hidden.
        alt=""
        aria-hidden="true"
        {...(fill ? {} : { width: size, height: size })}
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
    /* Anche il ripiego con le iniziali deve prendere `fill`: senza, chi non ha
       messo la foto avrebbe un quadratino da 48px dove gli altri hanno una
       banda da 300, e la griglia tornerebbe irregolare proprio sulle tessere
       piu' spoglie. */
    <span
      className={`${s.avatar} ${s.fallback} ${fill ? s.fill : ''} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      {initialsFrom(label)}
    </span>
  )
}
