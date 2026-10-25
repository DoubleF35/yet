import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Foto } from './Galleria.jsx'
import Ospiti from './Ospiti.jsx'
import Reveal, { stagger } from './Reveal.jsx'
import { eventiRecenti } from '../config/eventi.js'
import gallerie from '../data/gallerie.json'
import { formatMeetupDate, getGallerie, getMedia, listenMeetups } from '../lib/db.js'
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
 * DUE FONTI, E SERVONO TUTTE E DUE
 *
 * I RESOCONTI stanno in config/eventi.js: sono le serate che hanno una pagina
 * loro, col racconto e le foto nel repo. Arrivano col bundle, quindi questo
 * blocco compare subito e c'e' anche se Firestore e' irraggiungibile.
 *
 * Gli INCONTRI PASSATI stanno su Firestore e li aggiungono gli admin dal
 * pannello. Non tutti diventano un resoconto: "YET x Wave" e' una serata vera
 * ma non ha una pagina di racconto, e finche' questo blocco leggeva solo i
 * resoconti la serata piu' recente non si vedeva. Adesso le due liste si
 * uniscono e si ordinano per data, cosi' l'ultima cosa fatta e' la prima che
 * si vede, senza doverla scrivere nel codice ogni volta.
 *
 * Una serata senza resoconto non diventa un link: non c'e' una pagina dove
 * portare. La scheda si vede, con la sua foto se e' stata caricata dal
 * pannello, e basta. Meglio una scheda che non si clicca di un link che apre
 * una pagina vuota.
 *
 * REGGE SENZA FOTO, ed e' una condizione vera e non un'ipotesi: finche' le
 * gallerie sono vuote la scheda non mostra un riquadro grigio col punto
 * interrogativo, mostra solo il testo. Un segnaposto vuoto sulla home fa
 * sembrare il sito rotto, non in costruzione.
 */

/* Quante serate al massimo. La home e' una vetrina, non l'archivio: per
   l'archivio c'e' il bottone "tutti gli incontri" qui sopra. Quattro riempiono
   due righe da due senza lasciare un buco. */
const MAX_SERATE = 4

export default function Serate() {
  const { t } = useI18n()
  const resoconti = eventiRecenti()
  const passati = useIncontriPassati()
  const copertine = useCopertineCaricate()

  const serate = unisciSerate(resoconti, passati)
  if (serate.length === 0) return null

  /* Chi ci ha ospitato. Quello che sta qui sotto e' il valore di partenza:
     se gli admin hanno scritto il loro elenco dal pannello, vince quello. */
  const ospitiDaiResoconti = [...new Set(resoconti.flatMap((e) => e.ospiti ?? []))]

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
        {serate.map((serata, i) => (
          <Reveal as="li" className={s.voce} key={serata.chiave} delay={stagger(i)}>
            <Scheda serata={serata} caricata={copertine[serata.meetupId]} />
          </Reveal>
        ))}
      </ul>

      <Ospiti predefiniti={ospitiDaiResoconti} />
    </Reveal>
  )
}

/**
 * Unisce i resoconti e gli incontri passati in una lista sola, dalla serata
 * piu' recente alla piu' vecchia.
 *
 * Il legame fra le due fonti e' `meetupId`: un incontro che ha gia' il suo
 * resoconto non compare due volte. Se un resoconto ha meetupId null il legame
 * non c'e' e la serata potrebbe comparire doppia, una volta per fonte: e' il
 * motivo per cui quel campo va compilato quando si scrive un resoconto.
 */
function unisciSerate(resoconti, passati) {
  const giaRaccontati = new Set(resoconti.map((e) => e.meetupId).filter(Boolean))

  const daResoconto = resoconti.map((e) => ({
    chiave: e.slug,
    slug: e.slug,
    meetupId: e.meetupId ?? null,
    titolo: e.titolo,
    etichette: [e.citta, e.luogo].filter(Boolean),
    indirizzo: e.indirizzo ?? '',
    quando: e.data ? new Date(e.data) : null,
  }))

  const daIncontro = passati
    .filter((m) => !giaRaccontati.has(m.id))
    .map((m) => ({
      chiave: `incontro:${m.id}`,
      slug: null,
      meetupId: m.id,
      titolo: m.title ?? '',
      etichette: [m.place].filter(Boolean),
      indirizzo: '',
      quando: m._quando ?? null,
    }))
    .filter((m) => m.titolo)

  return [...daResoconto, ...daIncontro]
    .sort((a, b) => (b.quando?.getTime() ?? 0) - (a.quando?.getTime() ?? 0))
    .slice(0, MAX_SERATE)
}

/**
 * Gli incontri gia' fatti, da Firestore.
 *
 * In silenzio se non arrivano: restano i resoconti, che e' esattamente quello
 * che si vedeva prima che questo blocco leggesse Firestore. La home non deve
 * perdere una sezione perche' il database non risponde.
 */
function useIncontriPassati() {
  const [passati, setPassati] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true

    const stop = listenMeetups(
      { onlyPublished: true },
      (d) => vivo && setPassati(d.passati ?? []),
      (e) => console.warn('[YET] Non riesco a leggere gli incontri per la home.', e),
    )

    return () => {
      vivo = false
      stop?.()
    }
  }, [])

  return passati
}

/**
 * Le copertine caricate dal pannello, indicizzate per ID DELL'INCONTRO.
 *
 * E' la stessa chiave con cui le gallerie sono salvate, quindi qui non c'e'
 * niente da tradurre: una serata senza resoconto ha comunque il suo id, ed e'
 * il motivo per cui le gallerie non sono mai state indicizzate per slug.
 *
 * Se la lettura non riesce non succede niente: restano le foto nei file.
 */
function useCopertineCaricate() {
  const [perIncontro, setPerIncontro] = useState({})

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true

    getGallerie()
      .then(async (g) => {
        if (!vivo) return
        const primi = Object.entries(g)
          .map(([id, x]) => [id, x.foto?.[0], x.alt?.[0] ?? ''])
          .filter(([, mediaId]) => mediaId)
        if (primi.length === 0) return

        const media = await getMedia(primi.map(([, mediaId]) => mediaId))
        if (!vivo) return

        const out = {}
        for (const [id, mediaId, alt] of primi) {
          const dato = media[mediaId]
          if (dato?.dataUrl) out[id] = { dataUrl: dato.dataUrl, alt }
        }
        setPerIncontro(out)
      })
      .catch(() => {
        /* In silenzio: restano le foto nei file. */
      })

    return () => {
      vivo = false
    }
  }, [])

  return perIncontro
}

function Scheda({ serata, caricata = null }) {
  const { lang, t } = useI18n()

  const galleria = serata.slug ? gallerie[serata.slug] ?? null : null
  const copertinaFile = galleria?.scatti.find((x) => x.base === galleria.copertina) ?? null
  /* Vince quella caricata dal pannello: e' la piu' recente e l'ha messa
     qualcuno apposta. */
  const copertina = caricata ?? copertinaFile

  /* Una serata senza pagina non e' un link. Stessa veste, stesso contenuto,
     ma non finge di portare da qualche parte. */
  const Contenitore = serata.slug ? Link : 'div'
  const propsLink = serata.slug ? { to: `/eventi/${serata.slug}` } : {}

  return (
    <Contenitore className={s.scheda} {...propsLink}>
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
            <Foto slug={serata.slug} scatto={copertinaFile} classe={s.copertinaImg} />
          )}
        </div>
      )}

      <div className={s.corpo}>
        {serata.etichette.length > 0 && (
          <ul className={s.etichette}>
            {serata.etichette.map((x) => (
              <li className={s.etichetta} key={x}>
                {x}
              </li>
            ))}
          </ul>
        )}
        <h3 className={s.nome}>{serata.titolo}</h3>
        <p className={s.riga}>
          {/* Il conteggio delle foto compare solo quando ce ne sono: un
              "0 foto" sarebbe una promessa mancata scritta a schermo. Senza
              foto si scrive dove si era, e in mancanza di quello la data. */}
          {galleria
            ? t(galleria.scatti.length === 1 ? 'galleria.unaFoto' : 'galleria.tanteFoto', {
                n: galleria.scatti.length,
              })
            : serata.indirizzo || formatMeetupDate(serata.quando, lang) || ''}
        </p>
        {serata.slug && <span className={s.vai}>{t('evento.guarda')}</span>}
      </div>
    </Contenitore>
  )
}
