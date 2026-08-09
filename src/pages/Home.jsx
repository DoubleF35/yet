import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import Skeleton from '../components/Skeleton.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import { COMMUNITY } from '../config/socials.js'
import { normalizeAttachments } from '../lib/attachments.js'
import { countApprovedUsers, formatDate, listenNews } from '../lib/db.js'
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

  const allegati = normalizeAttachments(item.attachments)
  const immagini = allegati.filter((a) => a.type === 'image')
  const link = allegati.filter((a) => a.type === 'link')

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
          {immagini.map((a) => (
            <a
              className={s.shot}
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={a.url} alt={a.label} loading="lazy" decoding="async" />
              <span className="sr-only"> (apri a dimensione piena in una nuova scheda)</span>
            </a>
          ))}
        </div>
      )}

      {link.length > 0 && (
        <ul className={s.links}>
          {link.map((a) => (
            <li key={a.url}>
              <a className={s.link} href={a.url} target="_blank" rel="noopener noreferrer">
                <span className={s.linkIcon} aria-hidden="true" />
                <span className={s.linkLabel}>{a.label}</span>
                <span className="sr-only"> (si apre in una nuova scheda)</span>
              </a>
            </li>
          ))}
        </ul>
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

  /* null = non lo sappiamo ancora (o non si è potuto sapere). Non 0, che
     sarebbe un'affermazione: "non c'è nessuno" è una cosa diversa da "sto
     contando", e sulla home di un club appena nato la differenza si vede. */
  const [membri, setMembri] = useState(null)

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

  /* Il conteggio dei membri per la riga di apertura.
     Query di aggregazione: il server risponde con un numero, senza spedire i
     documenti. Se fallisce non si dice niente e non si mostra niente — un
     contatore è un di più, e non deve poter rompere la home. */
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let alive = true
    countApprovedUsers()
      .then((n) => alive && setMembri(n))
      .catch(() => alive && setMembri(null))
    return () => {
      alive = false
    }
  }, [])

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
          Dai {COMMUNITY.ageRange} anni — {COMMUNITY.reach}
        </p>

        {membri !== null && membri > 0 && (
          <p className={s.tally}>
            <Link className={s.tallyLink} to="/membri">
              <span className={s.tallyNumber}>{membri}</span>
              <span className={s.tallyLabel}>
                {membri === 1 ? 'persona sta costruendo con noi' : 'persone stanno costruendo con noi'}
              </span>
            </Link>
          </p>
        )}

        <p className={s.ctaRow}>
          <Link className={s.cta} to="/join">
            Entra in YET
            <span className={s.ctaArrow} aria-hidden="true">
              →
            </span>
          </Link>
          {/* Le due porte d'ingresso, una accanto all'altra: il profilo passa
              da un'approvazione, il gruppo no. Chi arriva sceglie quella che
              gli somiglia invece di trovarne una sola. */}
          <WhatsAppCta variant="button" />
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
            /* Ogni codice ha la sua causa tipica e la sua mossa successiva.
               Il ramo generico è l'ultima spiaggia: quando ci finisce qualcosa
               di ricorrente, gli si dà una riga sua invece di lasciarlo lì. */
            message={
              error?.code === 'permission-denied'
                ? 'Il server ha rifiutato la lettura: le regole Firestore non sono ancora state pubblicate, oppure quelle pubblicate sono più vecchie del sito.'
                : error?.code === 'failed-precondition'
                  ? 'Firestore chiede un indice per questa ricerca. Nella console del browser c’è un link che lo crea con un clic.'
                  : error?.code === 'unavailable'
                    ? 'Non riusciamo a raggiungere il server. Di solito è la connessione: riprova fra un momento.'
                    : 'Qualcosa è andato storto nel leggere il feed. Il dettaglio è nella console del browser.'
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

      {/* Chiude la home: chi è arrivato in fondo ha letto tutto quel che
          c'era da leggere, ed è il momento in cui l'invito serve davvero. */}
      <WhatsAppCta />
    </div>
  )
}
