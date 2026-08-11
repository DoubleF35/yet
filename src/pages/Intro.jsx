import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import s from './Intro.module.css'

/** Chiave del flag "l'intro l'ho già vista". */
const SEEN_KEY = 'yet_intro_seen'

/** Durata della dissolvenza finale, in ms. Deve combaciare con la transizione
 *  dichiarata su .fade in Intro.module.css. */
const FADE_MS = 450

/* localStorage può LANCIARE, non solo restituire null: succede in Safari
   privato, in alcuni webview e con i cookie di terze parti bloccati. Un
   accesso non protetto qui aprirebbe il sito bianco proprio sui browser più
   restrittivi, cioè sull'iPhone di qualcuno, non su un caso di laboratorio. */
function hasSeenIntro() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    // Non possiamo ricordarcelo: meglio mostrare l'intro una volta di troppo
    // che bloccare l'ingresso al sito.
    return false
  }
}

function markIntroSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* Pazienza: l'intro si rivedrà. Non è un errore da mostrare. */
  }
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export default function Intro() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const fadeTimer = useRef(null)

  /* Le decisioni che non devono cambiare durante la vita del componente si
     calcolano una volta sola, con l'inizializzatore pigro di useState. Se le
     mettessimo in un effect, il primo render mostrerebbe il video anche a chi
     ha chiesto meno movimento, un lampo, ma proprio a chi non lo vuole. */
  const [alreadySeen] = useState(hasSeenIntro)
  const [reduced] = useState(prefersReducedMotion)

  /* 'video'  = sta suonando
     'poster' = autoplay negato, video in errore, o reduced-motion: si entra a mano */
  const [mode, setMode] = useState(reduced ? 'poster' : 'video')
  const [fading, setFading] = useState(false)

  const base = import.meta.env.BASE_URL
  const posterSrc = `${base}hero-poster.jpg`
  const videoSrc = `${base}hero.mp4`

  /* Il flag si scrive appena l'intro viene MOSTRATA, non quando finisce:
     altrimenti chi ricarica la pagina a metà video se la rivede da capo ogni
     volta, che è esattamente quello che l'intro-una-volta-sola deve evitare. */
  useEffect(() => {
    if (!alreadySeen) markIntroSeen()
  }, [alreadySeen])

  const goHome = useCallback(
    ({ animated = true } = {}) => {
      if (!animated || reduced) {
        navigate('/home', { replace: true })
        return
      }
      setFading(true)
      fadeTimer.current = window.setTimeout(() => {
        navigate('/home', { replace: true })
      }, FADE_MS)
    },
    [navigate, reduced],
  )

  /* Avvio del video.
     `play()` restituisce una Promise che viene RIFIUTATA quando il browser
     blocca l'autoplay, la norma su iOS in risparmio energetico e con certe
     impostazioni desktop, non un caso limite. Se non la intercettiamo, chi la
     subisce resta davanti a un fotogramma fermo senza capire come proseguire. */
  useEffect(() => {
    if (mode !== 'video') return undefined
    const video = videoRef.current
    if (!video) return undefined

    let cancelled = false
    const attempt = video.play()

    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        if (!cancelled) setMode('poster')
      })
    }

    return () => {
      cancelled = true
    }
  }, [mode])

  // I timer vanno spenti allo smontaggio, altrimenti un navigate parte dopo
  // che l'utente ha già cliccato Skip ed è altrove.
  useEffect(() => () => window.clearTimeout(fadeTimer.current), [])

  /* Chi l'ha già vista non deve nemmeno montare il video: `replace` così il
     tasto Indietro non riporta sull'intro in un ciclo senza uscita. */
  if (alreadySeen) return <Navigate to="/home" replace />

  return (
    <div className={s.stage}>
      {/* La finestra di ritaglio. Il video ci sta dentro sovradimensionato e
          traslato: i numeri arrivano tutti dalle variabili --hero-* di
          theme.css, così si ritocca il taglio in un punto solo. */}
      <div className={s.frame}>
        {mode === 'video' ? (
          <video
            ref={videoRef}
            className={s.video}
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            muted
            playsInline
            /* loop assente di proposito: il video deve finire per far scattare
               onEnded, che è quello che porta alla home. */
            preload="auto"
            onEnded={() => goHome()}
            onError={() => setMode('poster')}
            aria-label="Animazione del logo YET"
          />
        ) : (
          <img
            className={s.video}
            src={posterSrc}
            alt="Il logo YET"
            width="960"
            height="720"
          />
        )}
      </div>

      {/* --- comandi ------------------------------------------------------ */}
      <div className={s.controls}>
        {mode === 'video' ? (
          <button type="button" className={s.skip} onClick={() => goHome()}>
            Skip
          </button>
        ) : (
          <button type="button" className={s.enter} onClick={() => goHome()}>
            Entra
          </button>
        )}
      </div>

      {/* Velo beige per la dissolvenza. Sempre nel DOM: montarlo al momento
          farebbe partire la transizione dal nulla, senza transizione. */}
      <div className={`${s.fade} ${fading ? s.fadeOn : ''}`.trim()} aria-hidden="true" />
    </div>
  )
}
