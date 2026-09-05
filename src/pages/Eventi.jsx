import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { NewsCard, NewsSkeleton } from '../components/NewsCard.jsx'
import Reveal, { stagger } from '../components/Reveal.jsx'
import MeetupAdmin from '../components/MeetupAdmin.jsx'
import MeetupList from '../components/MeetupList.jsx'
import { mediaIdsOf } from '../lib/attachments.js'
import { getMedia, listenNews } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Eventi.module.css'

/**
 * Tutto quello che succede in YET.
 *
 * Legge la stessa collection `news` che alimenta l'anteprima della home: qui
 * ci sono tutti, lì solo i primi tre. Una fonte sola, due viste.
 */
export default function Eventi() {
  const { t } = useI18n()
  const [news, setNews] = useState([])
  const [status, setStatus] = useState(isFirebaseConfigured ? 'loading' : 'unconfigured')
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [media, setMedia] = useState({})

  /* `t` fra le dipendenze: cambiando lingua l'effetto rigira e la linguetta
     del browser si riscrive. Senza, resterebbe quella di prima. */
  useEffect(() => {
    const previous = document.title
    document.title = t('titoli.eventi')
    return () => {
      document.title = previous
    }
  }, [t])

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
        <p className={s.eyebrow}>{t('eventi.eyebrow')}</p>
        <h1 className={s.title}>{t('eventi.titolo')}</h1>
        <p className={s.lead}>{t('eventi.lead')}</p>
      </header>

      <div className="container">
        {/* Il pannello si mostra da solo ai soli admin: se non lo sei, questo
            componente non renderizza niente. */}
        <MeetupAdmin />

        {/* Gli incontri stanno SOPRA le notizie, ed e' la gerarchia giusta:
            chi apre questa pagina vuole sapere prima quando ci si vede, e poi
            cos'e' successo. */}
        <MeetupList />
      </div>

      <section
        className={`${s.body} container`}
        aria-busy={status === 'loading'}
        aria-labelledby="titolo-notizie"
      >
        {/* Il feed aveva gli incontri sopra e nessuna intestazione propria:
            sembrava la loro continuazione, ed e' da li' che nasceva la
            confusione fra le due cose. */}
        <h2 className={s.sezioneTitolo} id="titolo-notizie">
          {t('notizie.titolo')}
        </h2>
        {/* Regione di stato sempre presente: se comparisse solo a caricamento
            finito, il cambiamento non verrebbe annunciato, perché la live
            region non era in pagina al momento in cui è avvenuto. */}
        <p className="sr-only" role="status">
          {status === 'loading' ? t('notizie.liveCaricamento') : ''}
          {status === 'ready' ? t('notizie.liveCaricati', { n: news.length }) : ''}
          {status === 'empty' ? t('notizie.liveVuoto') : ''}
        </p>

        {status === 'unconfigured' && (
          <div className={s.notice}>
            <p className={s.noticeTitle}>{t('notizie.spentoTitolo')}</p>
            <p className={s.noticeText}>{t('notizie.spentoTesto')}</p>
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
            title={t('notizie.erroreTitolo')}
            message={
              error?.code === 'permission-denied' ? t('errori.regoleVecchie') : t('errori.generico')
            }
            onRetry={retry}
          />
        )}

        {status === 'empty' && (
          <EmptyState
            title={t('notizie.vuotoTitolo')}
            action={
              <Link className={s.cta} to="/join">
                {t('hero.entra')}
              </Link>
            }
          >
            {t('notizie.vuotoTesto')}
          </EmptyState>
        )}

        {status === 'ready' && (
          <>
            <p className={s.count}>
              {news.length} {news.length === 1 ? t('notizie.unaNotizia') : t('notizie.tanteNotizie')}
            </p>
            <div className={s.grid}>
              {news.map((item, index) => (
                /* Lo scaglionamento e' 70ms per card e si ferma alla sesta:
                   oltre, l'ultima di una lista lunga aspetterebbe piu' di un
                   secondo e la cascata diventerebbe attesa. */
                <Reveal key={item.id} delay={stagger(index)}>
                  <NewsCard
                    item={item}
                    media={media}
                    featured={index === 0 && news.length > 1}
                  />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
