import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useI18n } from '../lib/i18n.jsx'

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
  const { t } = useI18n()
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
  /* Parte da false: finche' il browser non concede l'audio, il bottone deve
     dire "attiva", non "disattiva". */
  const [audioAcceso, setAudioAcceso] = useState(false)

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

  /* Avvio del video, in due tentativi.
     
     PRIMA CON L'AUDIO. Il video ha una traccia sonora e va sentita, quindi si
     prova a partire non muti. Quasi sempre il browser rifiuta: dal 2018 in poi
     Chrome, Safari e Firefox concedono l'avvio automatico SOLO se il video e'
     muto, a meno che la persona non abbia gia' interagito parecchio col sito.
     Non e' un difetto da aggirare, e' una difesa contro le pagine che si
     mettono a suonare da sole, e infatti non esiste modo di forzarla.

     POI MUTI. Se il primo tentativo viene rifiutato si riparte muti, che e'
     l'unico avvio automatico concesso, e si mostra il bottone per accendere
     l'audio: un tocco basta, perche' li' il gesto dell'utente c'e'.

     SE FALLISCE ANCHE IL MUTO si passa al poster: succede su iOS in risparmio
     energetico e con certe impostazioni desktop. Senza questo ramo chi lo
     subisce resta davanti a un fotogramma fermo senza capire come proseguire.

     `play()` va chiamata SEMPRE come Promise: in caso di rifiuto non lancia,
     rifiuta, e un catch mancante diventa un errore non gestito in console. */
  useEffect(() => {
    if (mode !== 'video') return undefined
    const video = videoRef.current
    if (!video) return undefined

    let cancelled = false

    async function avvia() {
      video.muted = false
      try {
        await video.play()
        if (!cancelled) setAudioAcceso(true)
        return
      } catch {
        /* Atteso nella stragrande maggioranza dei casi: si passa al muto. */
      }

      if (cancelled) return
      video.muted = true
      try {
        await video.play()
        if (!cancelled) setAudioAcceso(false)
      } catch {
        if (!cancelled) setMode('poster')
      }
    }

    avvia()

    return () => {
      cancelled = true
    }
  }, [mode])

  /* L'interruttore dell'audio. Qui il gesto dell'utente c'e', quindi togliere
     il muto e' sempre concesso: non serve nessun ripiego. */
  function alternaAudio() {
    const video = videoRef.current
    if (!video) return
    const acceso = video.muted
    video.muted = !acceso
    setAudioAcceso(acceso)
  }

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
            /* `muted` NON e' scritto qui: lo decide l'effetto di avvio, che
               prima prova con l'audio e poi ripiega. Lasciare l'attributo
               fisso vorrebbe dire partire sempre muti. */
            playsInline
            /* loop assente di proposito: il video deve finire per far scattare
               onEnded, che è quello che porta alla home. */
            preload="auto"
            onEnded={() => goHome()}
            onError={() => setMode('poster')}
            aria-label={t('intro.animazione')}
          />
        ) : (
          /* Classe sua e non quella del video: il poster è già la regione
             utile ritagliata, quindi non va né sovradimensionato né spostato.
             Le misure sono quelle vere del file (1440x1396): con quelle
             sbagliate il browser riserva un riquadro di rapporto diverso e
             l'immagine salta di posizione appena arriva. Vanno RIMISURATE
             ogni volta che il video cambia: restano giuste solo se qualcuno
             se ne ricorda, ed e' gia' successo di dimenticarsene. */
          <img
            className={s.poster}
            src={posterSrc}
            alt={t('intro.logo')}
            width="1440"
            height="1396"
          />
        )}
      </div>

      {/* --- comandi ------------------------------------------------------ */}
      <div className={s.controls}>
        {mode === 'video' ? (
          <>
            <button
              type="button"
              className={s.audio}
              onClick={alternaAudio}
              aria-pressed={audioAcceso}
            >
              {/* Altoparlante con o senza onde. Decorativo: il testo accanto
                  dice gia' cosa fa il bottone, e `aria-pressed` dice in che
                  stato si trova, quindi annunciare anche l'icona sarebbe una
                  ripetizione per chi ascolta la pagina. */}
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path
                  d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                {audioAcceso ? (
                  <path
                    d="M15.6 9.2a4 4 0 0 1 0 5.6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="m16 9.5 5 5m0-5-5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              {audioAcceso ? t('intro.audioSpegni') : t('intro.audioAccendi')}
            </button>
            <button type="button" className={s.skip} onClick={() => goHome()}>
              {t('intro.skip')}
            </button>
          </>
        ) : (
          <button type="button" className={s.enter} onClick={() => goHome()}>
            {t('intro.entra')}
          </button>
        )}
      </div>

      {/* Velo beige per la dissolvenza. Sempre nel DOM: montarlo al momento
          farebbe partire la transizione dal nulla, senza transizione. */}
      <div className={`${s.fade} ${fading ? s.fadeOn : ''}`.trim()} aria-hidden="true" />
    </div>
  )
}
