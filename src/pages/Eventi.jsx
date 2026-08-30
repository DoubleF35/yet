import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { NewsCard, NewsSkeleton } from '../components/NewsCard.jsx'
import { mediaIdsOf } from '../lib/attachments.js'
import { getMedia, listenNews } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'

import s from './Eventi.module.css'

/**
 * Tutto quello che succede in YET.
 *
 * Legge la stessa collection `news` che alimenta l'anteprima della home: qui
 * ci sono tutti, lì solo i primi tre. Una fonte sola, due viste.
 */
export default function Eventi() {
  const [news, setNews] = useState([])
  const [status, setStatus] = useState(isFirebaseConfigured ? 'loading' : 'unconfigured')
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [media, setMedia] = useState({})

  useEffect(() => {
    const previous = document.title
    document.title = 'Eventi · YET'
    return () => {
      document.title = previous
    }
  }, [])

  /* Il listener può emettere dopo lo smontaggio, o dopo un "Riprova" che ne ha
     già creato un altro: senza questa guardia il primo sovrascriverebbe i dati
     del secondo. */
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
        console.error('[YET] Non riesco a leggere gli eventi.', err)
        setError(err)
        setStatus('error')
      },
    )

    return () => {
      aliveRef.current = false
      unsubscribe()
    }
  }, [reloadKey])

  /* Gli allegati arrivano dopo il testo, ed è voluto: si legge subito e le
     foto compaiono un attimo dopo, invece di far aspettare il megabyte prima
     di mostrare una parola. */
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

  return (
    <div className={s.page}>
      <header className={`${s.head} container`}>
        <p className={s.eyebrow}>Eventi</p>
        <h1 className={s.title}>Cosa succede</h1>
        <p className={s.lead}>
          Incontri, annunci e cose che stiamo costruendo. I primi eventi saranno a Torino, ma
          l’obiettivo è farne in tutta Italia: se vuoi organizzarne uno dove stai tu, scrivici.
        </p>
      </header>

      <section className={`${s.body} container`} aria-busy={status === 'loading'}>
        {/* Regione di stato sempre presente: se comparisse solo a caricamento
            finito, il cambiamento non verrebbe annunciato, perché la live
            region non era in pagina al momento in cui è avvenuto. */}
        <p className="sr-only" role="status">
          {status === 'loading' ? 'Caricamento degli eventi in corso.' : ''}
          {status === 'ready' ? `${news.length} eventi caricati.` : ''}
          {status === 'empty' ? 'Non c’è ancora nessun evento.' : ''}
        </p>

        {status === 'unconfigured' && (
          <div className={s.notice}>
            <p className={s.noticeTitle}>Gli eventi non sono collegati</p>
            <p className={s.noticeText}>
              Manca la configurazione di Firebase. Non è un errore del sito: è il passo che manca
              alla prima installazione, ed è spiegato nel README.
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
            title="Non riusciamo a caricare gli eventi"
            message={
              error?.code === 'permission-denied'
                ? 'Il server ha rifiutato la lettura: le regole Firestore non sono ancora state pubblicate, oppure quelle pubblicate sono più vecchie del sito.'
                : 'Qualcosa è andato storto. Il dettaglio è nella console del browser.'
            }
            onRetry={retry}
          />
        )}

        {status === 'empty' && (
          <EmptyState
            title="Ancora nessun evento"
            action={
              <Link className={s.cta} to="/join">
                Entra in YET
              </Link>
            }
          >
            Il primo lo stiamo organizzando. Iscriviti e lo saprai prima degli altri.
          </EmptyState>
        )}

        {status === 'ready' && (
          <>
            <p className={s.count}>
              {news.length} {news.length === 1 ? 'evento' : 'eventi'}
            </p>
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
          </>
        )}
      </section>
    </div>
  )
}
