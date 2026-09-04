import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { CONTACT_EMAIL, COMMUNITY } from '../config/socials.js'
import { getMedia, listSponsors } from '../lib/db.js'
import { safeImageSrc, safeUrl } from '../lib/attachments.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Sponsor.module.css'

/* Cosa offriamo. Qui restano solo gli id, in ORDINE: è la parte che cambierà
   (dopo il primo evento vero questi tre riquadri andranno riscritti con
   numeri al posto delle promesse), e l'ordine è una decisione di contenuto
   che si legge in un punto solo. I due testi di ognuno stanno nel catalogo,
   sotto `sponsor.offerta.<id>`. */
const OFFERTA = ['visibilita', 'accesso', 'evento']

export default function Sponsor() {
  const { t } = useI18n()
  const [sponsor, setSponsor] = useState([])
  const [media, setMedia] = useState({})
  const [status, setStatus] = useState(isFirebaseConfigured ? 'loading' : 'unconfigured')
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const previous = document.title
    document.title = t('titoli.sponsor')
    return () => {
      document.title = previous
    }
  }, [t])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStatus('unconfigured')
      return undefined
    }
    let alive = true
    setStatus('loading')
    setError(null)

    listSponsors()
      .then(async (lista) => {
        if (!alive) return
        setSponsor(lista)
        setStatus(lista.length === 0 ? 'empty' : 'ready')

        /* I loghi stanno in `media` come tutto il resto che si carica: una
           lettura in più, ma nessuna collection nuova e nessuna regola nuova
           da tenere allineata. */
        const ids = lista.map((x) => x.logoMediaId).filter(Boolean)
        if (ids.length) {
          const m = await getMedia(ids)
          if (alive) setMedia(m)
        }
      })
      .catch((err) => {
        if (!alive) return
        setError(err)
        setStatus('error')
      })

    return () => {
      alive = false
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return (
    <div className={s.page}>
      <header className={`${s.head} container`}>
        <p className={s.eyebrow}>{t('sponsor.eyebrow')}</p>
        <h1 className={s.title}>{t('sponsor.titolo')}</h1>
        <p className={s.lead}>{t('sponsor.lead', { nome: COMMUNITY.name })}</p>
      </header>

      <div className="container">
        {/* --- chi c'è già --------------------------------------------- */}
        <section className={s.section} aria-labelledby="attuali" aria-busy={status === 'loading'}>
          <h2 className={s.h2} id="attuali">
            {t('sponsor.chiCe')}
          </h2>

          <p className="sr-only" role="status">
            {status === 'loading' ? t('sponsor.liveCaricamento') : ''}
            {status === 'ready' ? t('sponsor.liveCaricati', { n: sponsor.length }) : ''}
          </p>

          {status === 'loading' && (
            <div className={s.griglia} aria-hidden="true">
              <Skeleton height="7rem" />
              <Skeleton height="7rem" />
              <Skeleton height="7rem" />
            </div>
          )}

          {status === 'error' && (
            <ErrorState
              title={t('sponsor.erroreTitolo')}
              message={
                error?.code === 'permission-denied'
                  ? t('sponsor.errorePermessi')
                  : t('errori.generico')
              }
              onRetry={retry}
            />
          )}

          {(status === 'empty' || status === 'unconfigured') && (
            <EmptyState title={t('sponsor.vuotoTitolo')}>{t('sponsor.vuotoTesto')}</EmptyState>
          )}

          {status === 'ready' && (
            <ul className={s.griglia}>
              {sponsor.map((sp) => {
                const logo = sp.logoMediaId ? safeImageSrc(media[sp.logoMediaId]?.dataUrl) : null
                const sito = safeUrl(sp.url)
                const Contenuto = (
                  <>
                    {logo ? (
                      <img className={s.logo} src={logo} alt={sp.nome} loading="lazy" />
                    ) : (
                      /* Senza logo il nome scritto grande funziona meglio di un
                         riquadro vuoto: la griglia resta piena e leggibile. */
                      <span className={s.nomeGrande}>{sp.nome}</span>
                    )}
                    {sp.nota && <span className={s.nota}>{sp.nota}</span>}
                  </>
                )

                return (
                  <li className={s.cella} key={sp.id}>
                    {sito ? (
                      <a
                        className={s.link}
                        href={sito}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        aria-label={t('sponsor.apreSito', { nome: sp.nome })}
                      >
                        {Contenuto}
                      </a>
                    ) : (
                      <div className={s.link}>{Contenuto}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* --- perché conviene ------------------------------------------- */}
        <section className={s.section} aria-labelledby="offerta">
          <h2 className={s.h2} id="offerta">
            {t('sponsor.cosaOffriamo')}
          </h2>
          <ul className={s.offerta}>
            {OFFERTA.map((id, i) => (
              <li className={s.punto} key={id}>
                <span className={s.numero} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={s.puntoTitolo}>{t(`sponsor.offerta.${id}.titolo`)}</h3>
                <p className={s.puntoTesto}>{t(`sponsor.offerta.${id}.testo`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* --- come si fa ------------------------------------------------- */}
        <section className={s.section} aria-labelledby="scrivici">
          <h2 className={s.h2} id="scrivici">
            {t('sponsor.parliamone')}
          </h2>
          <p className={s.nota2}>{t('sponsor.parliamoneTesto')}</p>
          <div className={s.azioni}>
            <a className={s.primario} href={`mailto:${CONTACT_EMAIL}?subject=Sponsor%20YET`}>
              {t('sponsor.scriviciA', { email: CONTACT_EMAIL })}
            </a>
            <Link className={s.secondario} to="/contatti">
              {t('sponsor.altriCanali')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
