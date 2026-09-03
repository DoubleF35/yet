import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { CONTACT_EMAIL, COMMUNITY } from '../config/socials.js'
import { getMedia, listSponsors } from '../lib/db.js'
import { safeImageSrc, safeUrl } from '../lib/attachments.js'
import { isFirebaseConfigured } from '../lib/firebase.js'

import s from './Sponsor.module.css'

/* Cosa offriamo, e cosa chiediamo. Sta qui come dato e non sparso nel JSX
   perché è la parte che cambierà: dopo il primo evento vero, questi tre
   riquadri andranno riscritti con numeri al posto delle promesse. */
const OFFERTA = [
  {
    titolo: 'Visibilità dove conta',
    testo:
      'Il logo su questa pagina, sui materiali degli eventi e nei post che li raccontano. Non un banner in fondo a una pagina che nessuno apre.',
  },
  {
    titolo: 'Accesso diretto',
    testo:
      'Ragazzi fra i 16 e i 23 anni che stanno già costruendo qualcosa. Se cercate stagisti, collaboratori o semplicemente gente sveglia, sono qui.',
  },
  {
    titolo: 'Un evento vostro',
    testo:
      'Potete ospitare un incontro, portare una sfida vera da risolvere, o raccontare come avete costruito la vostra azienda. Funziona meglio di qualsiasi logo.',
  },
]

export default function Sponsor() {
  const [sponsor, setSponsor] = useState([])
  const [media, setMedia] = useState({})
  const [status, setStatus] = useState(isFirebaseConfigured ? 'loading' : 'unconfigured')
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const previous = document.title
    document.title = 'Sponsor · YET'
    return () => {
      document.title = previous
    }
  }, [])

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
        <p className={s.eyebrow}>Sponsor</p>
        <h1 className={s.title}>Chi ci sostiene</h1>
        <p className={s.lead}>
          {COMMUNITY.name} non ha quote di iscrizione: chi entra non paga niente. Quello che serve
          per organizzare un evento (una sala, il pranzo, il materiale) arriva da chi decide di
          darci una mano.
        </p>
      </header>

      <div className="container">
        {/* --- chi c'è già --------------------------------------------- */}
        <section className={s.section} aria-labelledby="attuali" aria-busy={status === 'loading'}>
          <h2 className={s.h2} id="attuali">
            Chi c’è
          </h2>

          <p className="sr-only" role="status">
            {status === 'loading' ? 'Caricamento degli sponsor in corso.' : ''}
            {status === 'ready' ? `${sponsor.length} sponsor caricati.` : ''}
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
              title="Non riusciamo a caricare gli sponsor"
              message={
                error?.code === 'permission-denied'
                  ? 'Il server ha rifiutato la lettura: le regole Firestore pubblicate sono più vecchie del sito.'
                  : 'Qualcosa è andato storto. Il dettaglio è nella console del browser.'
              }
              onRetry={retry}
            />
          )}

          {(status === 'empty' || status === 'unconfigured') && (
            <EmptyState title="Nessuno sponsor, per ora">
              Stiamo partendo adesso. Se volete essere i primi, il posto è libero e si vede.
            </EmptyState>
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
                        aria-label={`${sp.nome}, apre il sito in una nuova scheda`}
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
            Cosa offriamo
          </h2>
          <ul className={s.offerta}>
            {OFFERTA.map((o, i) => (
              <li className={s.punto} key={o.titolo}>
                <span className={s.numero} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={s.puntoTitolo}>{o.titolo}</h3>
                <p className={s.puntoTesto}>{o.testo}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* --- come si fa ------------------------------------------------- */}
        <section className={s.section} aria-labelledby="scrivici">
          <h2 className={s.h2} id="scrivici">
            Parliamone
          </h2>
          <p className={s.nota2}>
            Non abbiamo un listino e non vi manderemo una presentazione da venti slide. Scriveteci
            cosa fate e cosa vi interessa, e vi diciamo se ha senso.
          </p>
          <div className={s.azioni}>
            <a className={s.primario} href={`mailto:${CONTACT_EMAIL}?subject=Sponsor%20YET`}>
              Scrivici a {CONTACT_EMAIL}
            </a>
            <Link className={s.secondario} to="/contatti">
              Gli altri canali
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
