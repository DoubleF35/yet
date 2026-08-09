import { Link } from 'react-router-dom'

import { COMMUNITY, CONTACT_EMAIL, SOCIALS } from '../config/socials.js'

import s from './Footer.module.css'

export default function Footer() {
  const logo = `${import.meta.env.BASE_URL}logo.png`
  const year = new Date().getFullYear()

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brandBlock}>
          <Link to="/home" className={s.brand} aria-label="YET, vai alla home">
            <img className={s.logo} src={logo} alt="YET" width="486" height="291" />
          </Link>
          <p className={s.tagline}>{COMMUNITY.tagline}</p>
          {/* Non la sola città: da sola suggerirebbe che se non sei a Torino
              la cosa non ti riguarda. */}
          <p className={s.city}>{COMMUNITY.reach}</p>
        </div>

        <nav className={s.linksBlock} aria-label="Canali social">
          <h2 className={s.heading}>Dove trovarci</h2>
          <ul className={s.links}>
            {SOCIALS.map((item) => {
              const external = !item.href.startsWith('mailto:')
              return (
                <li key={item.id}>
                  <a
                    className={s.link}
                    href={item.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.label}
                    {external && <span className="sr-only"> (si apre in una nuova scheda)</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <nav className={s.linksBlock} aria-label="Pagine del sito">
          <h2 className={s.heading}>Il sito</h2>
          <ul className={s.links}>
            <li>
              <Link className={s.link} to="/home">
                Home
              </Link>
            </li>
            <li>
              <Link className={s.link} to="/membri">
                Membri
              </Link>
            </li>
            <li>
              <Link className={s.link} to="/join">
                Join
              </Link>
            </li>
            <li>
              <Link className={s.link} to="/contatti">
                Contatti
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className={s.bottom}>
        <p className={s.copy}>
          © {year} {COMMUNITY.name}
        </p>

        {/* Privacy e cookie stanno qui e non fra le pagine principali: è il
            posto dove la gente le cerca, e non devono rubare spazio alla
            navigazione vera. Devono però essere raggiungibili da OGNI pagina,
            ed è il motivo per cui vivono nel footer e non solo nei contatti. */}
        <nav className={s.legal} aria-label="Informative">
          <Link className={s.legalLink} to="/privacy">
            Privacy
          </Link>
          <span className={s.legalSep} aria-hidden="true">
            ·
          </span>
          <Link className={s.legalLink} to="/cookie">
            Cookie
          </Link>
          <span className={s.legalSep} aria-hidden="true">
            ·
          </span>
          <a className={s.legalLink} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </nav>
      </div>
    </footer>
  )
}
