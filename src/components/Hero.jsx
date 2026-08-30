import { Link } from 'react-router-dom'

import { COMMUNITY } from '../config/socials.js'

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
  const base = import.meta.env.BASE_URL
  const [taglineTesto, taglinePunto] = (() => {
    const t = COMMUNITY.tagline || 'Build ambition.'
    return t.endsWith('.') ? [t.slice(0, -1), '.'] : [t, '']
  })()

  return (
    <header className={s.hero}>
      {/* La foto è decorativa: il contenuto informativo è tutto nel testo qui
          sotto. alt vuoto e aria-hidden, così uno screen reader non annuncia
          "immagine, platea sfocata" prima del titolo. */}
      <img
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
            Entra in YET
          </Link>
          <Link className={s.secondary} to="/eventi">
            Guarda gli eventi
          </Link>
        </div>

        <p className={s.meta}>
          Dai {COMMUNITY.ageRange} anni <span aria-hidden="true">·</span> {COMMUNITY.reach}
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
