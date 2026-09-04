import { useEffect, useState } from 'react'

import Reveal, { stagger } from './Reveal.jsx'
import { formatMeetupDate, listenMeetups } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './MeetupList.module.css'

/**
 * Gli incontri, sopra le notizie.
 *
 * Se non ce n'e' nessuno il componente non renderizza niente: uno stato vuoto
 * ha senso quando l'utente sta CERCANDO qualcosa che manca, non in cima a una
 * pagina che ha comunque altro da mostrare. Un riquadro "nessun incontro" fa
 * sembrare il sito piu' vuoto di quanto sia.
 */
export default function MeetupList() {
  const { t } = useI18n()
  const [dati, setDati] = useState({ prossimi: [], passati: [] })
  const [stato, setStato] = useState(isFirebaseConfigured ? 'caricamento' : 'spento')

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true

    const stop = listenMeetups(
      { onlyPublished: true },
      (d) => {
        if (!vivo) return
        setDati(d)
        setStato('pronto')
      },
      (e) => {
        if (!vivo) return
        console.warn('[YET] Non riesco a leggere gli incontri.', e)
        setStato('errore')
      },
    )

    return () => {
      vivo = false
      stop()
    }
  }, [])

  if (stato !== 'pronto') return null
  if (dati.prossimi.length === 0 && dati.passati.length === 0) return null

  return (
    <section className={s.wrap} aria-labelledby="incontri">
      <h2 className={s.titolo} id="incontri">
        {dati.prossimi.length > 0 ? t('incontri.prossimi') : t('incontri.titolo')}
      </h2>

      {dati.prossimi.length > 0 && (
        <ul className={s.lista}>
          {dati.prossimi.map((m, i) => (
            <Reveal as="li" key={m.id} delay={stagger(i)} className={s.voce}>
              <Scheda incontro={m} />
            </Reveal>
          ))}
        </ul>
      )}

      {/* I passati restano, ma piu' in basso e attenuati: servono a far vedere
          che la community si trova davvero, non a essere letti uno per uno. */}
      {dati.passati.length > 0 && (
        <>
          <h3 className={s.sottotitolo}>{t('incontri.giaFatti')}</h3>
          <ul className={`${s.lista} ${s.listaPassati}`}>
            {dati.passati.slice(0, 6).map((m, i) => (
              <Reveal as="li" key={m.id} delay={stagger(i)} className={s.voce}>
                <Scheda incontro={m} passato />
              </Reveal>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function Scheda({ incontro, passato = false }) {
  const { title, place, body, url } = incontro
  const { lang, t } = useI18n()

  return (
    <article className={`${s.scheda} ${passato ? s.schedaPassata : ''}`.trim()}>
      {/* La data la formatta Intl nella lingua scelta; la frase di ripiego,
          quando la data non c'è, è testo di interfaccia e sta nel catalogo. */}
      <p className={s.quando}>
        {formatMeetupDate(incontro.startsAt, lang) ?? t('incontri.dataDaDefinire')}
      </p>
      <h3 className={s.nome}>{title}</h3>
      {place && <p className={s.dove}>{place}</p>}
      {body && <p className={s.testo}>{body}</p>}

      {/* Il link compare solo sui prossimi: iscriversi a un incontro gia'
          fatto non ha senso, e lasciarlo li' sarebbe una porta che non porta
          da nessuna parte. */}
      {url && !passato && (
        <a className={s.cta} href={url} target="_blank" rel="noopener noreferrer">
          {t('incontri.iscriviti')}
          <span className="sr-only">{t('stati.nuovaScheda')}</span>
        </a>
      )}
    </article>
  )
}
