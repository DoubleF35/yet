import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Galleria, { Foto } from '../components/Galleria.jsx'
import { eventoDiSlug } from '../config/eventi.js'
import gallerie from '../data/gallerie.json'
import { getGalleriaEvento, getMedia } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Evento.module.css'

/**
 * Il resoconto di una serata.
 *
 * SI VEDE TUTTA SENZA FIREBASE, ed e' la regola che vale ancora. Testo e foto
 * del repo stanno nel bundle, quindi questa pagina compare:
 *
 *   - subito, senza lo scheletro di caricamento;
 *   - anche se Firestore e' irraggiungibile o il browser lo blocca (succede,
 *     vedi la voce sul CORS nel README);
 *   - anche nel guscio generato dal prerender, che e' quello che leggono
 *     Google e l'anteprima di WhatsApp.
 *
 * E' la pagina che la gente condivide: e' l'ultima che puo' permettersi di
 * dipendere da una richiesta di rete che potrebbe non arrivare.
 *
 * LE FOTO CARICATE DAL PANNELLO ARRIVANO DOPO, e si AGGIUNGONO a quelle del
 * repo invece di sostituirle. Caricarne due per una serata che ne ha gia'
 * dieci nei file non deve far sparire le dieci. Se la lettura non riesce, la
 * pagina resta esattamente quella di prima: e' un di piu', non una dipendenza.
 */
export default function Evento() {
  const { slug } = useParams()
  const { t, lang } = useI18n()

  const evento = eventoDiSlug(slug)
  const galleria = gallerie[slug] ?? null
  const { scatti: caricate, stato: statoCaricate, riprova } = useFotoCaricate(evento?.meetupId)

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
     anche la misura da 2400 e che qui viene mostrata a tutta larghezza.
     Quando nel repo non c'e' niente, fa da copertina la prima caricata. */
  const copertina =
    galleria?.scatti.find((x) => x.base === galleria.copertina) ?? caricate[0] ?? null

  /* Prima quelle del repo, poi quelle caricate. LA COPERTINA RESTA ANCHE QUI
     dentro, e prima non ci stava: in cima alla pagina e' uno sfondo dietro al
     titolo, con il velo sopra e tagliata alla forma della fascia, quindi chi
     vuole guardarla davvero (o ingrandirla, o scorrere le foto dall'inizio)
     nella griglia non la trovava. Era anche il motivo per cui i due conteggi
     non combaciavano: "3 foto" in cima e "2 foto" sulla galleria. */
  const tutte = [...(galleria?.scatti ?? []), ...caricate]

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
          {tutte.length > 0 && (
            <Fatto etichetta={t('evento.foto')} valore={String(tutte.length)} />
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

        {tutte.length > 0 ? (
          <>
            <Galleria slug={slug} scatti={tutte} />
            {/* Il credito sta SOTTO le foto e non in cima fra i dati della
                serata: chi si chiede chi le ha scattate se lo chiede dopo
                averle guardate, non prima. Compare solo se c'e' qualcosa da
                dire, cosi' le serate senza un fotografo non mostrano una riga
                vuota. */}
            {evento.fotografo && (
              <p className={s.credito}>
                {t('evento.fotoDi', { chi: evento.fotografo.nome })}
                {evento.fotografo.handle && (
                  <>
                    {' - '}
                    {evento.fotografo.url ? (
                      <a
                        className={s.creditoLink}
                        href={evento.fotografo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {evento.fotografo.handle}
                      </a>
                    ) : (
                      evento.fotografo.handle
                    )}
                  </>
                )}
              </p>
            )}
          </>
        ) : statoCaricate === 'attesa' ? (
          /* Finche' la lettura e' in corso non si dice "non ci sono": per una
             serata con le sole foto caricate dal pannello, come Roma, sarebbe
             falso per un secondo, e falso per sempre a chi la rete la perde
             proprio li'. */
          <p className={s.senzaFoto} role="status">
            {t('evento.caricoFoto')}
          </p>
        ) : statoCaricate === 'errore' ? (
          <div className={s.senzaFoto} role="alert">
            <p>{t('evento.erroreFoto')}</p>
            <button type="button" className={s.riprova} onClick={riprova}>
              {t('evento.riprova')}
            </button>
          </div>
        ) : (
          <p className={s.senzaFoto}>{t('evento.senzaFoto')}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Le foto caricate dal pannello per questa serata.
 *
 * La chiave e' l'ID DELL'INCONTRO e non lo slug del resoconto: le gallerie
 * sono salvate cosi' perche' non tutte le serate hanno una pagina di racconto.
 * Il ponte fra i due lo fa `meetupId` in config/eventi.js, ed e' il motivo per
 * cui quel campo va compilato: senza, questa pagina non sa quale galleria
 * cercare e le foto caricate restano invisibili.
 *
 * Due letture e non una: prima la galleria, che contiene solo gli
 * identificativi, poi le immagini vere da /media. In silenzio se qualcosa non
 * arriva, perche' la pagina deve restare quella che era.
 */
function useFotoCaricate(meetupId) {
  const [scatti, setScatti] = useState([])
  /* 'attesa' | 'pronto' | 'errore'. Serve solo alle serate che nel repo non
     hanno foto: per loro "la lettura non e' finita" e "non e' riuscita" non
     possono diventare "non ci sono foto". */
  const [stato, setStato] = useState(isFirebaseConfigured && meetupId ? 'attesa' : 'pronto')
  const [tentativo, setTentativo] = useState(0)
  const riprova = useCallback(() => setTentativo((n) => n + 1), [])

  useEffect(() => {
    if (!isFirebaseConfigured || !meetupId) {
      /* Cambiando serata l'elenco va svuotato, o per un istante la nuova
         pagina mostrerebbe le foto della precedente. */
      setScatti([])
      setStato('pronto')
      return undefined
    }
    let vivo = true
    setStato('attesa')

    getGalleriaEvento(meetupId)
      .then(async (g) => {
        if (!vivo || !g || g.foto.length === 0) {
          if (vivo) {
            setScatti([])
            setStato('pronto')
          }
          return
        }
        const media = await getMedia(g.foto)
        if (!vivo) return
        setScatti(
          g.foto
            .map((id, i) => {
              const m = media[id]
              if (!m?.dataUrl) return null
              return { id, dataUrl: m.dataUrl, alt: g.alt[i] ?? '', w: m.width, h: m.height }
            })
            /* Una foto che non arriva si salta: meglio nove su dieci di un
               riquadro rotto in mezzo alla griglia. */
            .filter(Boolean),
        )
        setStato('pronto')
      })
      .catch((e) => {
        console.warn('[YET] Non riesco a leggere le foto caricate.', e)
        if (vivo) setStato('errore')
      })

    return () => {
      vivo = false
    }
  }, [meetupId, tentativo])

  return { scatti, stato, riprova }
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
