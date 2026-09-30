import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import Galleria, { Foto } from '../components/Galleria.jsx'
import { eventoDiSlug } from '../config/eventi.js'
import gallerie from '../data/gallerie.json'
import { useI18n } from '../lib/i18n.jsx'

import s from './Evento.module.css'

/**
 * Il resoconto di una serata.
 *
 * NON TOCCA FIREBASE, ed e' voluto. Testo e foto stanno nel bundle e nel
 * repo, quindi questa pagina si vede:
 *
 *   - subito, senza lo scheletro di caricamento;
 *   - anche se Firestore e' irraggiungibile o il browser lo blocca (succede,
 *     vedi la voce sul CORS nel README);
 *   - anche nel guscio generato dal prerender, che e' quello che leggono
 *     Google e l'anteprima di WhatsApp.
 *
 * E' la pagina che la gente condivide: e' l'ultima che puo' permettersi di
 * dipendere da una richiesta di rete che potrebbe non arrivare.
 */
export default function Evento() {
  const { slug } = useParams()
  const { t, lang } = useI18n()

  const evento = eventoDiSlug(slug)
  const galleria = gallerie[slug] ?? null

  useEffect(() => {
    if (!evento) return undefined
    const prima = document.title
    document.title = `${evento.titolo} · YET`
    return () => {
      document.title = prima
    }
  }, [evento])

  const quando = useMemo(() => formattaData(evento?.data, lang), [evento, lang])

  if (!evento) {
    return (
      <div className={`${s.page} container`}>
        <h1 className={s.titoloMancante}>{t('evento.mancanteTitolo')}</h1>
        <p className={s.testoMancante}>{t('evento.mancanteTesto')}</p>
        <Link className={s.indietro} to="/eventi">
          {t('evento.tuttiGliIncontri')}
        </Link>
      </div>
    )
  }

  /* La copertina e' uno scatto come gli altri: la differenza e' solo che ha
     anche la misura da 2400 e che qui viene mostrata a tutta larghezza. */
  const copertina = galleria?.scatti.find((x) => x.base === galleria.copertina) ?? null
  /* Se c'e' una copertina, nella griglia sotto non si ripete. */
  const resto = galleria ? galleria.scatti.filter((x) => x !== copertina) : []

  return (
    <div className={s.page}>
      <header className={`${s.copertina} ${copertina ? '' : s.copertinaVuota}`.trim()}>
        {copertina && (
          <div className={s.copertinaFoto} aria-hidden="true">
            <Foto slug={slug} scatto={copertina} grande priorita classe={s.copertinaImg} />
          </div>
        )}
        <div className={s.velo} aria-hidden="true" />

        <div className={`${s.copertinaTesto} container`}>
          <Link className={s.indietro} to="/eventi">
            {t('evento.tuttiGliIncontri')}
          </Link>
          <ul className={s.etichette}>
            <li className={s.etichetta}>{evento.citta}</li>
            {quando && <li className={s.etichetta}>{quando}</li>}
            {evento.luogo && <li className={s.etichetta}>{evento.luogo}</li>}
          </ul>
          <h1 className={s.titolo}>{evento.titolo}</h1>
        </div>
      </header>

      <div className={s.fatti}>
        <dl className={`${s.fattiLista} container`}>
          {/* presenti resta fuori finche' non e' un numero vero: uno zero o un
              trattino al posto di una cifra fa piu' danno che l'assenza. */}
          {typeof evento.presenti === 'number' && (
            <Fatto etichetta={t('evento.presenti')} valore={String(evento.presenti)} />
          )}
          {galleria && (
            <Fatto etichetta={t('evento.foto')} valore={String(galleria.scatti.length)} />
          )}
          <Fatto
            etichetta={t('evento.dove')}
            valore={evento.luogo}
            secondaria={evento.indirizzo}
          />
          {evento.ospiti.length > 0 && (
            <Fatto etichetta={t('evento.ospiti')} valore={evento.ospiti.join(', ')} />
          )}
        </dl>
      </div>

      <div className="container">
        <div className={s.racconto}>
          {evento.racconto.map((paragrafo, i) => (
            <p className={i === 0 ? s.raccontoApertura : s.raccontoTesto} key={paragrafo.slice(0, 40)}>
              {paragrafo}
            </p>
          ))}
        </div>

        {galleria ? (
          <Galleria slug={slug} scatti={resto.length > 0 ? resto : galleria.scatti} />
        ) : (
          <p className={s.senzaFoto}>{t('evento.senzaFoto')}</p>
        )}
      </div>
    </div>
  )
}

function Fatto({ etichetta, valore, secondaria = null }) {
  return (
    <div className={s.fatto}>
      <dt className={s.fattoEtichetta}>{etichetta}</dt>
      <dd className={s.fattoValore}>
        {valore}
        {secondaria && <span className={s.fattoSecondaria}>{secondaria}</span>}
      </dd>
    </div>
  )
}

/**
 * "domenica 13 settembre 2026".
 * Intl e non una stringa scritta a mano, cosi' in inglese esce nel formato
 * inglese senza un secondo campo nel file di configurazione.
 */
function formattaData(iso, lang) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const tag = lang === 'en' ? 'en-GB' : 'it-IT'
  return new Intl.DateTimeFormat(tag, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
