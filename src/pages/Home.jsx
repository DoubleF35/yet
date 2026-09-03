import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import Hero from '../components/Hero.jsx'
import ErrorState from '../components/ErrorState.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import Skeleton from '../components/Skeleton.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import { COMMUNITY } from '../config/socials.js'
import {
  mediaIdsOf,
  normalizeAttachments,
  safeFileSrc,
  safeImageSrc,
  safeUrl,
} from '../lib/attachments.js'
import { countApprovedUsers, formatDate, getMedia, listenNews } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'

import s from './Home.module.css'

/* Oltre questa lunghezza il corpo viene mostrato tagliato in altezza, con
   "Leggi tutto" sotto. Il testo resta tutto nel DOM: si nasconde, non si
   tronca, così la ricerca del browser lo trova comunque. */
const CLAMP_OVER = 420

/* --------------------------------------------------------------------------
   Una notizia
-------------------------------------------------------------------------- */
import { NewsCard, NewsSkeleton } from '../components/NewsCard.jsx'
import Reveal, { stagger } from '../components/Reveal.jsx'
import { useCountUp, useReveal } from '../lib/motion.js'


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

  /* Il conteggio si anima solo quando lo si guarda davvero. */
  /* Soglia bassa: il numero sta in cima alla sezione, quindi deve partire
     appena il bordo superiore entra nello schermo. Con una soglia alta si
     vedeva la sezione comparire con lo zero e restare li' finche' non era
     visibile per il 40%. */
  const contatore = useReveal({ threshold: 0.05 })
  const numeroMostrato = useCountUp(membri ?? 0, { start: contatore.revealed })

  /* I contenuti dei file caricati, per id. Stanno qui e non dentro le card
     perché una lettura sola serve a tutte: due notizie che allegano la stessa
     foto non devono scaricarla due volte. */
  const [media, setMedia] = useState({})

  const logo = `${import.meta.env.BASE_URL}logo-light.png`

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
     documenti. Se fallisce non si dice niente e non si mostra niente, un
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

  /* I media arrivano dopo l'elenco delle notizie, ed è voluto: il testo si
     legge subito e le immagini compaiono un attimo dopo, invece di far
     aspettare tutto il megabyte prima di mostrare una parola. */
  useEffect(() => {
    const ids = news.flatMap((n) => mediaIdsOf(n.attachments))
    if (ids.length === 0) return undefined
    let alive = true
    getMedia(ids)
      .then((m) => alive && setMedia((prec) => ({ ...prec, ...m })))
      .catch((err) => console.warn('[YET] Non riesco a leggere gli allegati.', err))
    return () => {
      alive = false
    }
  }, [news])

  const retry = useCallback(() => setReloadKey((n) => n + 1), [])

  const [taglineText, taglineDot] = (() => {
    const t = COMMUNITY.tagline || 'Build ambition.'
    return t.endsWith('.') ? [t.slice(0, -1), '.'] : [t, '']
  })()

  return (
    <div>
      {/* L'apertura vive in un componente suo: e' l'unico pezzo del sito con
          una fotografia sotto, quindi ha regole di contrasto e di impaginazione
          che non valgono da nessun'altra parte. Tenerla qui dentro avrebbe
          significato mescolarle a quelle del feed. */}
      <Hero />

      {/* Il contatore resta sulla home ma sotto la piega: sopra la foto sarebbe
          un numero in mezzo a due bottoni, e ruberebbe la scena alla frase che
          conta. Qui invece e' la prima cosa che si incontra scorrendo. */}
      {membri !== null && membri > 0 && (
        /* La sezione resta invisibile finche' il conteggio non parte, ed e'
           una correzione di sostanza, non di stile: mostrare "0 persone stanno
           costruendo con noi" e' una frase FALSA, e restava a schermo per
           tutto il tempo in cui la sezione era visibile ma non ancora
           abbastanza da far scattare l'osservatore. Nascondendola, lo zero non
           lo vede nessuno e il numero compare gia' mentre sale. */
        <section
          className={`${s.tallyBlock} container ${contatore.revealed ? s.tallyIn : s.tallyOut}`}
          ref={contatore.ref}
        >
          <Link className={s.tallyLink} to="/vetrina">
            {/* Il numero sale da zero quando la sezione entra nello schermo,
                non al caricamento della pagina: partire mentre e' ancora
                sotto la piega vuol dire che nessuno lo vede salire, e resta
                solo il costo dell'animazione.
                Con "riduci animazioni" attivo useCountUp restituisce subito il
                valore finale. */}
            <span className={s.tallyNumber}>{numeroMostrato}</span>
            <span className={s.tallyLabel}>
              {membri === 1
                ? 'persona sta costruendo con noi'
                : 'persone stanno costruendo con noi'}
            </span>
          </Link>
          <p className={s.tallyLead}>{COMMUNITY.description}</p>
        </section>
      )}

      <HandsDivider />

      {/* ------------------------------------------------------------------
          Notizie
      ------------------------------------------------------------------ */}
      <Reveal
        as="section"
        className={`${s.news} container`}
        aria-labelledby="notizie"
        aria-busy={status === 'loading'}
      >
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
              <NewsCard
                key={item.id}
                item={item}
                media={media}
                featured={index === 0 && news.length > 1}
              />
            ))}
          </div>
        )}
      </Reveal>

      {/* Chiude la home: chi è arrivato in fondo ha letto tutto quel che
          c'era da leggere, ed è il momento in cui l'invito serve davvero. */}
      <WhatsAppCta />
    </div>
  )
}
