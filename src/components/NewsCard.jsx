import { useState } from 'react'

import {
  mediaIdsOf,
  normalizeAttachments,
  safeFileSrc,
  safeImageSrc,
  safeUrl,
} from '../lib/attachments.js'
import { formatDate } from '../lib/db.js'
import Skeleton from './Skeleton.jsx'

import s from './NewsCard.module.css'

/* Oltre questa lunghezza il corpo viene mostrato tagliato in altezza, con
   "Leggi tutto" sotto. Il testo resta tutto nel DOM: si nasconde, non si
   tronca, così la ricerca del browser lo trova comunque. */
const CLAMP_OVER = 420

/* =========================================================================
   La card di un evento.

   Estratta dalla Home perché ora la usano in due: la home ne mostra le prime
   tre come anteprima, la pagina Eventi le mostra tutte. Tenerne due copie
   avrebbe garantito solo che prima o poi divergessero.
   ========================================================================= */
export function NewsCard({ item, featured, media }) {
  const [expanded, setExpanded] = useState(false)
  const body = String(item.body ?? '')
  const isLong = body.length > CLAMP_OVER

  /* Un allegato può essere un indirizzo incollato oppure un file caricato, e
     nel secondo caso il contenuto arriva da media/{id}. `sorgente` appiattisce
     i due casi in una cosa sola, così il rendering più sotto non deve sapere
     da dove viene niente.
     safeImageSrc / safeFileSrc ricontrollano SEMPRE, anche sul contenuto che
     arriva dal nostro database: è il controllo che protegge dai dati scritti
     prima che questa validazione esistesse, o messi a mano dalla console. */
  const allegati = normalizeAttachments(item.attachments).map((a) => {
    if (!a.mediaId) return { ...a, src: a.type === 'image' ? safeImageSrc(a.url) : safeUrl(a.url) }
    const m = media?.[a.mediaId]
    if (!m) return { ...a, src: null }
    return {
      ...a,
      src: a.type === 'image' ? safeImageSrc(m.dataUrl) : safeFileSrc(m.dataUrl),
      name: m.name,
    }
  })

  const immagini = allegati.filter((a) => a.type === 'image' && a.src)
  const link = allegati.filter((a) => a.type !== 'image' && a.src)

  return (
    <article className={`${s.card} ${featured ? s.featured : ''}`.trim()}>
      {featured && <p className={s.badge}>In evidenza</p>}

      {/* h2: l'h1 della pagina è il logo. */}
      <h2 className={s.cardTitle}>{item.title}</h2>

      <p className={s.cardMeta}>
        <span>{formatDate(item.createdAt)}</span>
        {item.authorName ? (
          <>
            <span className={s.sep} aria-hidden="true">
              /
            </span>
            <span>{item.authorName}</span>
          </>
        ) : null}
      </p>

      <div className={`${s.body} ${isLong && !expanded ? s.bodyClamped : ''}`.trim()}>{body}</div>

      {isLong && (
        <button
          type="button"
          className={s.moreBtn}
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? 'Mostra meno' : 'Leggi tutto'}
        </button>
      )}

      {/* Gli allegati ripassano da normalizeAttachments anche qui, in lettura.
          Non è una ripetizione inutile: è l'unico controllo che protegge dai
          dati scritti prima che la validazione esistesse, o messi a mano dalla
          console Firebase. Un `javascript:` finito in un href diventerebbe
          codice al primo clic, e il posto giusto per fermarlo è quello in cui
          l'URL viene usato. */}
      {immagini.length > 0 && (
        <div className={s.gallery}>
          {immagini.map((a) =>
            /* Le immagini ospitate altrove si aprono a dimensione piena in una
               scheda nuova. Quelle caricate da noi no: il loro `src` è un data
               URL, e un data URL dentro un href è una PAGINA che si apre con i
               permessi del nostro dominio. In un <img> è innocuo, in un link
               no, quindi lì il link non si mette proprio. */
            a.mediaId ? (
              <span className={s.shot} key={`media:${a.mediaId}`}>
                <img src={a.src} alt={a.label} loading="lazy" decoding="async" />
              </span>
            ) : (
              <a
                className={s.shot}
                key={a.src}
                href={a.src}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={a.src} alt={a.label} loading="lazy" decoding="async" />
                <span className="sr-only"> (apri a dimensione piena in una nuova scheda)</span>
              </a>
            ),
          )}
        </div>
      )}

      {link.length > 0 && (
        <ul className={s.links}>
          {link.map((a) => (
            <li key={a.mediaId ? `media:${a.mediaId}` : a.src}>
              <a
                className={s.link}
                href={a.src}
                /* Un file caricato si scarica invece di aprirsi: `download`
                   suggerisce il nome giusto al posto di una stringa base64
                   lunga un chilometro. */
                {...(a.mediaId
                  ? { download: a.name || a.label }
                  : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                <span className={s.linkIcon} aria-hidden="true" />
                <span className={s.linkLabel}>{a.label}</span>
                {!a.mediaId && <span className="sr-only"> (si apre in una nuova scheda)</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function NewsSkeleton({ featured }) {
  return (
    <div className={`${s.card} ${featured ? s.featured : ''}`.trim()} aria-hidden="true">
      <Skeleton height="1.75rem" width="70%" className={s.skelLine} />
      <Skeleton height="0.85rem" width="40%" className={s.skelLine} />
      <Skeleton height="0.85rem" count={4} className={s.skelLine} />
    </div>
  )
}