import { Link } from 'react-router-dom'

import { COMMUNITY, CONTACT_EMAIL } from '../config/socials.js'
import { useI18n } from '../lib/i18n.jsx'
import { useSocials } from '../lib/socials.jsx'

import s from './Footer.module.css'

/* Le pagine del sito, con la chiave dell'etichetta. Stesso elenco della barra
   in cima ma con "Brand identity" al posto di "Brand": qui c'è spazio per il
   nome intero, e in fondo alla pagina serve, perché chi arriva qui non ha il
   contesto della navigazione principale. */
const PAGINE = [
  { to: '/home', chiave: 'nav.home' },
  { to: '/vetrina', chiave: 'nav.vetrina' },
  { to: '/eventi', chiave: 'nav.eventi' },
  { to: '/join', chiave: 'nav.join' },
  { to: '/contatti', chiave: 'nav.contatti' },
  { to: '/brand', chiave: 'footer.brandIdentity' },
  { to: '/sponsor', chiave: 'nav.sponsor' },
]

export default function Footer() {
  const { t } = useI18n()
  const socials = useSocials()
  const logo = `${import.meta.env.BASE_URL}logo-light.png`
  const year = new Date().getFullYear()

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brandBlock}>
          <Link to="/home" className={s.brand} aria-label={t('nav.vaiAllaHome')}>
            <img className={s.logo} src={logo} alt="YET" width="486" height="291" />
          </Link>
          <p className={s.tagline}>{t('community.tagline')}</p>
          {/* Non la sola città: da sola suggerirebbe che se non sei a Torino
              la cosa non ti riguarda. */}
          <p className={s.city}>{t('community.reach')}</p>
        </div>

        <nav className={s.linksBlock} aria-label={t('footer.canaliSocial')}>
          <h2 className={s.heading}>{t('footer.doveTrovarci')}</h2>
          <ul className={s.links}>
            {socials.map((item) => {
              const external = !item.href.startsWith('mailto:')
              return (
                <li key={item.id}>
                  <a
                    className={s.link}
                    href={item.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.label}
                    {external && <span className="sr-only">{t('footer.nuovaScheda')}</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <nav className={s.linksBlock} aria-label={t('footer.pagineDelSito')}>
          <h2 className={s.heading}>{t('footer.ilSito')}</h2>
          <ul className={s.links}>
            {PAGINE.map((pagina) => (
              <li key={pagina.to}>
                <Link className={s.link} to={pagina.to}>
                  {t(pagina.chiave)}
                </Link>
              </li>
            ))}
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
        <nav className={s.legal} aria-label={t('footer.informative')}>
          <Link className={s.legalLink} to="/privacy">
            {t('footer.privacy')}
          </Link>
          <span className={s.legalSep} aria-hidden="true">
            ·
          </span>
          <Link className={s.legalLink} to="/cookie">
            {t('footer.cookie')}
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
