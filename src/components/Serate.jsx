import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Foto } from './Galleria.jsx'
import Reveal, { stagger } from './Reveal.jsx'
import { eventiRecenti } from '../config/eventi.js'
import gallerie from '../data/gallerie.json'
import { getGallerie, getMedia } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
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
  const copertine = useCopertineCaricate(eventi)

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
            <Scheda evento={evento} caricata={copertine[evento.slug]} />
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

/**
 * Le copertine caricate dal pannello, indicizzate per SLUG della serata.
 *
 * Le gallerie caricate stanno sotto l'id dell'incontro, mentre qui le serate
 * si conoscono per slug: il ponte fra i due lo fa `meetupId` dentro
 * config/eventi.js, che e' gia' il campo con cui un resoconto sa a quale
 * incontro appartiene.
 *
 * Se la lettura non riesce non succede niente: restano le foto nei file, che
 * e' quello che si vedeva prima. Questa sezione deve poter comparire anche
 * col database irraggiungibile.
 */
function useCopertineCaricate(eventi) {
  const [perSlug, setPerSlug] = useState({})

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true

    getGallerie()
      .then(async (g) => {
        if (!vivo) return
        const coppie = eventi
          .map((e) => [e.slug, g[e.meetupId]?.foto?.[0], g[e.meetupId]?.alt?.[0] ?? ''])
          .filter(([, mediaId]) => mediaId)
        if (coppie.length === 0) return

        const media = await getMedia(coppie.map(([, mediaId]) => mediaId))
        if (!vivo) return

        const out = {}
        for (const [slug, mediaId, alt] of coppie) {
          const dato = media[mediaId]
          if (dato?.dataUrl) out[slug] = { dataUrl: dato.dataUrl, alt }
        }
        setPerSlug(out)
      })
      .catch(() => {
        /* In silenzio: restano le foto nei file. */
      })

    return () => {
      vivo = false
    }
    /* La lista di serate viene da una costante, non cambia fra un render e
       l'altro: niente nelle dipendenze o si rileggerebbe a ogni giro. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return perSlug
}

function Scheda({ evento, caricata = null }) {
  const { t } = useI18n()
  const galleria = gallerie[evento.slug] ?? null
  const copertinaFile = galleria?.scatti.find((x) => x.base === galleria.copertina) ?? null
  /* Vince quella caricata dal pannello: e' la piu' recente e l'ha messa
     qualcuno apposta. */
  const copertina = caricata ?? copertinaFile

  return (
    <Link className={s.scheda} to={`/eventi/${evento.slug}`}>
      {/* Niente riquadro vuoto quando la foto non c'e': o la scheda ha una
          copertina, o non ha proprio quello spazio. */}
      {copertina && (
        <div className={s.copertina}>
          {caricata ? (
            <img
              className={s.copertinaImg}
              src={caricata.dataUrl}
              alt={caricata.alt || ''}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Foto slug={evento.slug} scatto={copertinaFile} classe={s.copertinaImg} />
          )}
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
