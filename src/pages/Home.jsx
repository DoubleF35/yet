import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { COMMUNITY } from '../config/socials.js'
import { formatDate, listenNews } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'

import s from './Home.module.css'

/* Oltre questa lunghezza il corpo viene mostrato tagliato in altezza, con
   "Leggi tutto" sotto. Il testo resta tutto nel DOM: si nasconde, non si
   tronca, così la ricerca del browser lo trova comunque. */
const CLAMP_OVER = 420

/* --------------------------------------------------------------------------
   Una notizia
-------------------------------------------------------------------------- */
function NewsCard({ item, featured }) {
  const [expanded, setExpanded] = useState(false)
  const body = String(item.body ?? '')
  const isLong = body.length > CLAMP_OVER

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
    </article>
  )
}

function NewsSkeleton({ featured }) {
  return (
    <div className={`${s.card} ${featured ? s.featured : ''}`.trim()} aria-hidden="true">
      <Skeleton height="1.75rem" width="70%" className={s.skelLine} />
      <Skeleton height="0.85rem" width="40%" className={s.skelLine} />
      <Skeleton height="0.85rem" count={4} className={s.skelLine} />
    </div>
  )
}

/* --------------------------------------------------------------------------
   La pagina
-------------------------------------------------------------------------- */
export default function Home() {
  const [news, setNews] = useState([])
  const [status, setStatus] = useState(isFirebaseConfigured ? 'loading' : 'unconfigured')
  const [error, setError] = useState(null)

  /* Cambiare questa chiave ri-esegue l'effetto e quindi ri-sottoscrive il
     listener. È il modo giusto di far funzionare "Riprova": un
     location.reload() perderebbe scroll e stato per rifare la stessa cosa. */
  const [reloadKey, setReloadKey] = useState(0)

  const logo = `${import.meta.env.BASE_URL}logo.png`

  /* Il listener può emettere dopo lo smontaggio (o dopo un retry che ne ha già
     creato un altro): senza questa guardia, il primo listener sovrascriverebbe
     i dati del secondo. */
  const aliveRef = useRef(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStatus('unconfigured')
      return undefined
    }

    aliveRef.current = true
    setStatus('loading')
    setError(null)

    const unsubscribe = listenNews(
      { onlyPublished: true },
      (items) => {
        if (!aliveRef.current) return
        setNews(items)
        setStatus(items.length === 0 ? 'empty' : 'ready')
      },
      (err) => {
        if (!aliveRef.current) return
        console.error('[YET] Non riesco a leggere le notizie.', err)
        setError(err)
        setStatus('error')
      },
    )

    return () => {
      aliveRef.current = false
      unsubscribe()
    }
  }, [reloadKey])

  const retry = useCallback(() => setReloadKey((n) => n + 1), [])

  const [taglineText, taglineDot] = (() => {
    const t = COMMUNITY.tagline || 'Build ambition.'
    return t.endsWith('.') ? [t.slice(0, -1), '.'] : [t, '']
  })()

  return (
    <div>
      {/* ------------------------------------------------------------------
          Apertura
      ------------------------------------------------------------------ */}
      <header className={`${s.hero} container`}>
        <h1 className={s.title}>
          <img className={s.logo} src={logo} alt="YET" width="486" height="291" />
          <span className={s.tagline}>
            {taglineText}
            <span className={s.dot}>{taglineDot}</span>
          </span>
        </h1>

        <p className={s.lead}>{COMMUNITY.description}</p>

        <p className={s.meta}>
          {COMMUNITY.city} — dai {COMMUNITY.ageRange} anni
        </p>

        <p className={s.ctaRow}>
          <Link className={s.cta} to="/join">
            Entra in YET
            <span className={s.ctaArrow} aria-hidden="true">
              →
            </span>
          </Link>
        </p>
      </header>

      <HandsDivider />

      {/* ------------------------------------------------------------------
          Notizie
      ------------------------------------------------------------------ */}
      <section className={`${s.news} container`} aria-labelledby="notizie" aria-busy={status === 'loading'}>
        <div className={s.newsHead}>
          <h2 className={s.newsTitle} id="notizie">
            Notizie
          </h2>
          {status === 'ready' && (
            <p className={s.newsCount}>
              {news.length} {news.length === 1 ? 'notizia' : 'notizie'}
            </p>
          )}
        </div>

        {/* La regione di stato è SEMPRE nel DOM: se comparisse solo durante il
            caricamento, gli screen reader non annuncerebbero il cambiamento
            perché l'elemento con aria-live non era ancora presente. */}
        <p className="sr-only" role="status">
          {status === 'loading' ? 'Caricamento delle notizie in corso.' : ''}
          {status === 'ready' ? `${news.length} notizie caricate.` : ''}
          {status === 'empty' ? 'Non ci sono ancora notizie.' : ''}
        </p>

        {status === 'unconfigured' && (
          <div className={s.notice}>
            <p className={s.noticeTitle}>Le notizie non sono collegate</p>
            <p className={s.noticeText}>
              Manca la configurazione di Firebase, quindi il feed non può caricarsi. Non è un errore
              del sito: è il passo che manca alla prima installazione.
            </p>
            <p className={s.noticeText}>
              Copia <code className={s.code}>.env.example</code> in{' '}
              <code className={s.code}>.env</code>, riempi le sei chiavi dalla console Firebase e
              riavvia <code className={s.code}>npm run dev</code>. I dettagli sono nel README.
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div className={s.grid}>
            <NewsSkeleton featured />
            <NewsSkeleton />
            <NewsSkeleton />
          </div>
        )}

        {status === 'error' && (
          <ErrorState
            title="Non riusciamo a caricare le notizie"
            message={
              error?.code === 'permission-denied'
                ? 'Il server ha rifiutato la lettura. Di solito vuol dire che le regole Firestore non sono ancora state pubblicate.'
                : 'Qualcosa è andato storto nel leggere il feed. Può essere la connessione.'
            }
            onRetry={retry}
          />
        )}

        {status === 'empty' && (
          <EmptyState
            title="Ancora nessuna notizia"
            action={
              <Link className={s.cta} to="/join">
                Entra in YET
                <span className={s.ctaArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            }
          >
            Qui finiranno gli incontri, i progetti e le cose che succedono nella community. Nel
            frattempo puoi già presentarti.
          </EmptyState>
        )}

        {status === 'ready' && (
          <div className={s.grid}>
            {news.map((item, index) => (
              <NewsCard key={item.id} item={item} featured={index === 0 && news.length > 1} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
