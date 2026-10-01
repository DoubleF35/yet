import { Link } from 'react-router-dom'

import { Foto } from './Galleria.jsx'
import Reveal, { stagger } from './Reveal.jsx'
import { eventiRecenti } from '../config/eventi.js'
import gallerie from '../data/gallerie.json'
import { useI18n } from '../lib/i18n.jsx'

import s from './Serate.module.css'

/**
 * Le serate gia' fatte, sulla home.
 *
 * E' il blocco che risponde alla domanda che si fa chi arriva da fuori: questi
 * qui le cose le fanno davvero, o le hanno solo in programma? Finche' la home
 * parlava solo al futuro, la risposta non c'era.
 *
 * NON TOCCA FIREBASE: legge la configurazione e il manifesto delle foto, che
 * stanno nel bundle. Quindi compare subito, senza scheletro di caricamento, e
 * c'e' anche quando il browser blocca Firestore.
 *
 * REGGE SENZA FOTO, ed e' una condizione vera e non un'ipotesi: finche' le
 * gallerie sono vuote la scheda non mostra un riquadro grigio col punto
 * interrogativo, mostra solo il testo. Un segnaposto vuoto sulla home fa
 * sembrare il sito rotto, non in costruzione.
 */
export default function Serate() {
  const { t } = useI18n()
  const eventi = eventiRecenti()

  if (eventi.length === 0) return null

  /* Chi ci ha ospitato, una volta sola anche se e' venuto a piu' serate, e
     nell'ordine in cui compare. Si ricava dagli eventi invece di essere un
     secondo elenco da tenere aggiornato a mano. */
  const ospiti = [...new Set(eventi.flatMap((e) => e.ospiti ?? []))]

  return (
    <Reveal as="section" className={s.wrap} aria-labelledby="serate-fatte">
      <div className={`${s.testa} container`}>
        <div className={s.testaTesto}>
          <p className={s.occhiello}>{t('prova.serateOcchiello')}</p>
          <h2 className={s.titolo} id="serate-fatte">
            {t('prova.serateTitolo')}
          </h2>
          <p className={s.sottotitolo}>{t('prova.serateTesto')}</p>
        </div>
        <Link className={s.tutte} to="/eventi">
          {t('prova.serateTutte')}
        </Link>
      </div>

      <ul className={`${s.lista} container`}>
        {eventi.map((evento, i) => (
          <Reveal as="li" className={s.voce} key={evento.slug} delay={stagger(i)}>
            <Scheda evento={evento} />
          </Reveal>
        ))}
      </ul>

      {ospiti.length > 0 && (
        <div className={s.ospiti}>
          <div className={`${s.ospitiRiga} container`}>
            <p className={s.ospitiEtichetta}>{t('prova.ospiti')}</p>
            <ul className={s.ospitiElenco}>
              {ospiti.map((nome) => (
                <li className={s.ospite} key={nome}>
                  {nome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Reveal>
  )
}

function Scheda({ evento }) {
  const { t } = useI18n()
  const galleria = gallerie[evento.slug] ?? null
  const copertina = galleria?.scatti.find((x) => x.base === galleria.copertina) ?? null

  return (
    <Link className={s.scheda} to={`/eventi/${evento.slug}`}>
      {/* Niente riquadro vuoto quando la foto non c'e': o la scheda ha una
          copertina, o non ha proprio quello spazio. */}
      {copertina && (
        <div className={s.copertina}>
          <Foto slug={evento.slug} scatto={copertina} classe={s.copertinaImg} />
        </div>
      )}

      <div className={s.corpo}>
        <ul className={s.etichette}>
          <li className={s.etichetta}>{evento.citta}</li>
          {evento.luogo && <li className={s.etichetta}>{evento.luogo}</li>}
        </ul>
        <h3 className={s.nome}>{evento.titolo}</h3>
        <p className={s.riga}>
          {/* Il conteggio delle foto compare solo quando ce ne sono: un
              "0 foto" sarebbe una promessa mancata scritta a schermo. */}
          {galleria
            ? t(galleria.scatti.length === 1 ? 'galleria.unaFoto' : 'galleria.tanteFoto', {
                n: galleria.scatti.length,
              })
            : evento.indirizzo}
        </p>
        <span className={s.vai}>{t('evento.guarda')}</span>
      </div>
    </Link>
  )
}
