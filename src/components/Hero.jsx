import { Link } from 'react-router-dom'

import { COMMUNITY } from '../config/socials.js'
import { useParallax } from '../lib/motion.js'
import { useT } from '../lib/i18n.jsx'

import s from './Hero.module.css'

/**
 * L'apertura del sito: la foto della platea, il marchio, la promessa.
 *
 * La foto arriva già sfocata e scurita da `public/hero-bg.jpg`, non sfocata
 * qui in CSS. Il motivo è misurabile: un `filter: blur()` su un'immagine da
 * 2000px viene ricalcolato dal browser a ogni frame di scroll, e sui telefoni
 * si sente. Fatto una volta in fase di preparazione, costa zero per sempre.
 *
 * Sopra la foto c'è comunque un velo scuro, e quello serve a un'altra cosa:
 * garantire il contrasto del testo. Senza, la parete chiara della foto
 * lascerebbe il titolo bianco a un rapporto illeggibile proprio nel punto in
 * cui è più grande.
 */
export default function Hero() {
  const { refContenitore, refBersaglio } = useParallax()
  const { t, isEn } = useT()

  const base = import.meta.env.BASE_URL
  const [taglineTesto, taglinePunto] = (() => {
    const t = COMMUNITY.tagline || 'Build ambition.'
    return t.endsWith('.') ? [t.slice(0, -1), '.'] : [t, '']
  })()

  return (
    <header className={s.hero} ref={refContenitore}>
      {/* La foto è decorativa: il contenuto informativo è tutto nel testo qui
          sotto. alt vuoto e aria-hidden, così uno screen reader non annuncia
          "immagine, platea sfocata" prima del titolo. */}
      <img
        ref={refBersaglio}
        className={s.photo}
        src={`${base}hero-bg.jpg`}
        alt=""
        aria-hidden="true"
        /* eager + fetchPriority: è l'immagine più grande sopra la piega, e
           lasciarla in coda alla coda di caricamento sposterebbe il Largest
           Contentful Paint di un secondo abbondante. */
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width="2000"
        height="1116"
      />
      <div className={s.veil} aria-hidden="true" />

      <div className={s.inner}>
        <img className={s.logo} src={`${base}logo-light.png`} alt="YET" width="486" height="291" />

        <h1 className={s.title}>
          {taglineTesto}
          <span className={s.dot}>{taglinePunto}</span>
        </h1>

        <p className={s.lead}>{COMMUNITY.tagline2 || COMMUNITY.shortDescription}</p>

        <div className={s.actions}>
          <Link className={s.primary} to="/join">
            {t('Entra in YET')}
          </Link>
          <Link className={s.secondary} to="/eventi">
            {t('Guarda gli eventi')}
          </Link>
        </div>

        <p className={s.meta}>
          {/* La riga cambia struttura, non solo parole: "dai 16 ai 23 anni"
              in inglese e' "ages 16 to 23", e tradurre pezzo per pezzo darebbe
              "from the 16 to the 23 years". */}
          {isEn
            ? `Ages ${COMMUNITY.ageRangeEn ?? '16 to 23'} · ${COMMUNITY.reachEn ?? 'Starting in Turin, aiming for all of Italy'}`
            : `Dai ${COMMUNITY.ageRange} anni · ${COMMUNITY.reach}`}
        </p>
      </div>

      {/* Invito a scorrere. Puramente decorativo: chi arriva da tastiera o da
          screen reader ha già i due bottoni qui sopra come via d'uscita. */}
      <div className={s.scroll} aria-hidden="true">
        <span className={s.scrollLine} />
      </div>
    </header>
  )
}
