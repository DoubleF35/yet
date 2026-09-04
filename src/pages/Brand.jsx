import { useEffect, useState } from 'react'

import { COMMUNITY } from '../config/socials.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Brand.module.css'

/* I colori del marchio. Qui resta il DATO, cioè il codice esadecimale: un
   valore sbagliato qui diventa un logo sbagliato sulla locandina di qualcun
   altro, e non è una cosa che si traduce. Il nome, il ruolo e la nota sul
   contrasto sono testo e stanno nel catalogo, sotto `brand.colori.<id>`. */
const COLORI = [
  { id: 'coral', hex: '#D14A2C' },
  { id: 'beige', hex: '#ECEAE4' },
  { id: 'nero', hex: '#1E1B18' },
]

/* Le quattro regole d'uso. Solo gli id: le due frasi di ognuna stanno in
   `brand.regole.<id>.si` e `.no`. L'ordine dell'array è l'ordine a schermo. */
const REGOLE = ['spazio', 'versione', 'scala', 'mono']

export default function Brand() {
  const { t } = useI18n()
  const base = import.meta.env.BASE_URL
  const [copiato, setCopiato] = useState(null)

  useEffect(() => {
    const previous = document.title
    document.title = t('titoli.brand')
    return () => {
      document.title = previous
    }
  }, [t])

  /* clipboard può non esistere (http non sicuro) o essere negata: senza il
     catch il bottone resterebbe muto e sembrerebbe rotto. */
  async function copia(valore) {
    try {
      await navigator.clipboard.writeText(valore)
      setCopiato(valore)
      window.setTimeout(() => setCopiato((c) => (c === valore ? null : c)), 2000)
    } catch {
      setCopiato('errore')
      window.setTimeout(() => setCopiato((c) => (c === 'errore' ? null : c)), 3000)
    }
  }

  return (
    <div className={s.page}>
      <header className={`${s.head} container`}>
        <p className={s.eyebrow}>{t('brand.eyebrow')}</p>
        <h1 className={s.title}>{t('brand.titolo')}</h1>
        <p className={s.lead}>{t('brand.lead', { nome: COMMUNITY.name })}</p>
      </header>

      <div className="container">
        {/* --- il logo ---------------------------------------------------- */}
        <section className={s.section} aria-labelledby="logo">
          <h2 className={s.h2} id="logo">
            {t('brand.logoTitolo')}
          </h2>

          <div className={s.loghi}>
            <figure className={s.provaScura}>
              <img src={`${base}logo-light.png`} alt={t('brand.logoChiaroAlt')} />
              <figcaption>
                {t('brand.logoChiaro')}
                <a className={s.download} href={`${base}logo-light.png`} download="yet-logo-chiaro.png">
                  {t('brand.scarica')}
                </a>
              </figcaption>
            </figure>

            <figure className={s.provaChiara}>
              <img src={`${base}logo.png`} alt={t('brand.logoScuroAlt')} />
              <figcaption>
                {t('brand.logoScuro')}
                <a className={s.download} href={`${base}logo.png`} download="yet-logo-scuro.png">
                  {t('brand.scarica')}
                </a>
              </figcaption>
            </figure>
          </div>

          <p className={s.nota}>{t('brand.logoNota')}</p>
        </section>

        {/* --- le lancette ------------------------------------------------ */}
        <section className={s.section} aria-labelledby="lancette">
          <h2 className={s.h2} id="lancette">
            {t('brand.lancetteTitolo')}
          </h2>

          <div className={s.lancetteRiga}>
            <img
              className={s.lancette}
              src={`${base}hands-light.png`}
              alt={t('brand.lancetteAlt')}
            />
            <div>
              <p className={s.nota}>{t('brand.lancetteNota1')}</p>
              <p className={s.nota}>{t('brand.lancetteNota2')}</p>
              <a
                className={s.download}
                href={`${base}hands-light.png`}
                download="yet-lancette-chiaro.png"
              >
                {t('brand.scarica')}
              </a>
            </div>
          </div>
        </section>

        {/* --- i colori --------------------------------------------------- */}
        <section className={s.section} aria-labelledby="colori">
          <h2 className={s.h2} id="colori">
            {t('brand.coloriTitolo')}
          </h2>
          <p className={s.nota}>{t('brand.coloriNota')}</p>

          <ul className={s.colori}>
            {COLORI.map((c) => (
              <li className={s.colore} key={c.hex}>
                <span
                  className={s.campione}
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                <div className={s.coloreInfo}>
                  <p className={s.coloreNome}>{t(`brand.colori.${c.id}.nome`)}</p>
                  <button
                    type="button"
                    className={s.hex}
                    onClick={() => copia(c.hex)}
                    aria-label={t('brand.copiaColore', { hex: c.hex })}
                  >
                    {copiato === c.hex ? t('brand.copiato') : c.hex}
                  </button>
                  <p className={s.coloreRuolo}>{t(`brand.colori.${c.id}.ruolo`)}</p>
                  <p className={s.coloreNota}>{t(`brand.colori.${c.id}.nota`)}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="sr-only" role="status">
            {copiato === 'errore'
              ? t('brand.copiaErroreLive')
              : copiato
                ? t('brand.copiatoLive', { hex: copiato })
                : ''}
          </p>
          {copiato === 'errore' && (
            <p className={s.erroreCopia}>{t('brand.copiaErrore', { hex: COLORI[0].hex })}</p>
          )}
        </section>

        {/* --- il carattere ----------------------------------------------- */}
        <section className={s.section} aria-labelledby="carattere">
          <h2 className={s.h2} id="carattere">
            {t('brand.carattereTitolo')}
          </h2>
          <p className={s.campioneFont}>Inter</p>
          <p className={s.nota}>
            {t('brand.carattereNota1')}{' '}
            <a
              className={s.link}
              href="https://rsms.me/inter/"
              target="_blank"
              rel="noopener noreferrer"
            >
              rsms.me/inter
            </a>
            <span className="sr-only">{t('stati.nuovaScheda')}</span>.
          </p>
          <div className={s.pesi}>
            <span style={{ fontWeight: 400 }}>400 Regular</span>
            <span style={{ fontWeight: 600 }}>600 Semibold</span>
            <span style={{ fontWeight: 800 }}>800 Extrabold</span>
          </div>
        </section>

        {/* --- cosa non fare ---------------------------------------------- */}
        <section className={s.section} aria-labelledby="regole">
          <h2 className={s.h2} id="regole">
            {t('brand.regoleTitolo')}
          </h2>
          <ul className={s.regole}>
            {REGOLE.map((id) => (
              <li className={s.regola} key={id}>
                <p className={s.si}>
                  <span className={s.segno} aria-hidden="true">
                    {t('brand.si')}
                  </span>
                  {t(`brand.regole.${id}.si`)}
                </p>
                <p className={s.no}>
                  <span className={s.segno} aria-hidden="true">
                    {t('brand.no')}
                  </span>
                  {t(`brand.regole.${id}.no`)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
