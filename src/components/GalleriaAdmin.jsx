import { useCallback, useEffect, useState } from 'react'

import ErrorState from './ErrorState.jsx'
import Skeleton from './Skeleton.jsx'
import {
  createMedia,
  formatMeetupDate,
  getGallerie,
  getMedia,
  listenMeetups,
  setGalleriaEvento,
} from '../lib/db.js'
import { safeImageSrc } from '../lib/attachments.js'
import { useAuth } from '../lib/auth.jsx'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { COMPRESSIBLE, compressImage } from '../lib/imageCompress.js'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'

import s from './GalleriaAdmin.module.css'

/* =========================================================================
   LE FOTO DI UNA SERATA, CARICATE DAL PANNELLO

   Prima le foto degli eventi erano file nel repo: si mettevano in una
   cartella, si lanciava `npm run foto` e si committava il risultato. Funziona
   benissimo ed e' anche piu' leggero, ma richiede il computer di chi mantiene
   il sito. Da qui si caricano dal browser.

   LA CHIAVE E' L'ID DELL'INCONTRO e non lo slug del resoconto, perche' non
   tutte le serate ne hanno uno: "YET x Wave" esiste come incontro ma non ha
   una pagina di racconto. Usando l'id, ogni serata puo' avere le sue foto a
   prescindere.

   QUANTO PESA, scritto anche a schermo perche' chi carica deve saperlo: ogni
   foto e' un documento che il browser scarica per intero, senza la cache dei
   file statici. Dieci foto fanno circa un megabyte e mezzo, ogni volta che
   qualcuno apre la pagina.
   ========================================================================= */

/* Oltre questo numero la pagina della serata diventa pesante davvero. Lo
   stesso limite sta nelle regole: li' impedisce, qui spiega. */
const MAX_FOTO = 30

export default function GalleriaAdmin() {
  const { t } = useI18n()
  const { user } = useAuth()

  const [passati, setPassati] = useState([])
  const [gallerie, setGallerie] = useState({})
  const [media, setMedia] = useState({})
  const [stato, setStato] = useState(isFirebaseConfigured ? 'caricamento' : 'spento')
  const [errore, setErrore] = useState(null)

  const [apertoId, setApertoId] = useState(null)
  const [fase, setFase] = useState(null) // 'carico' | 'salvo'
  const [bozza, setBozza] = useState({ foto: [], alt: [] })

  /* Gli incontri passati. Si ascoltano invece di leggerli una volta perche'
     un incontro appena pubblicato deve comparire qui senza ricaricare. */
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true
    const stop = listenMeetups(
      {},
      (d) => {
        if (!vivo) return
        setPassati(d.passati ?? [])
        setStato('pronto')
      },
      (e) => {
        if (!vivo) return
        setErrore(e)
        setStato('errore')
      },
    )
    return () => {
      vivo = false
      stop?.()
    }
  }, [])

  const caricaGallerie = useCallback(async () => {
    try {
      const g = await getGallerie()
      setGallerie(g)
      const ids = Object.values(g).flatMap((x) => x.foto)
      if (ids.length) setMedia(await getMedia(ids))
    } catch (e) {
      console.warn('[YET] Non riesco a leggere le gallerie.', e)
    }
  }, [])

  useEffect(() => {
    caricaGallerie()
  }, [caricaGallerie])

  function apri(incontro) {
    const g = gallerie[incontro.id] ?? { foto: [], alt: [] }
    setApertoId(incontro.id)
    /* Una COPIA, non il riferimento: si modifica la bozza e si salva alla
       fine, cosi' chiudere senza salvare non lascia niente a meta'. */
    setBozza({ foto: [...g.foto], alt: [...g.alt] })
    setErrore(null)
  }

  function chiudi() {
    setApertoId(null)
    setBozza({ foto: [], alt: [] })
    setErrore(null)
  }

  /** Comprime e carica una foto, e la mette in fondo alla bozza. */
  async function aggiungiFoto(file) {
    if (!file || fase) return
    if (!COMPRESSIBLE.includes(file.type)) {
      setErrore(new Error(t('galleriaAdmin.formato')))
      return
    }
    if (bozza.foto.length >= MAX_FOTO) {
      setErrore(new Error(t('galleriaAdmin.troppe', { max: MAX_FOTO })))
      return
    }

    setFase('carico')
    setErrore(null)
    try {
      const esito = await compressImage(file)
      const mediaId = await createMedia(
        {
          dataUrl: esito.dataUrl,
          contentType: esito.mime,
          name: file.name || 'foto.jpg',
          width: esito.width,
          height: esito.height,
          bytes: esito.bytes,
        },
        /* L'utente e non null: le regole pretendono che authorUid sia chi
           scrive. Era il bug per cui i loghi sponsor non si caricavano. */
        user,
      )
      setMedia((prec) => ({ ...prec, [mediaId]: { dataUrl: esito.dataUrl } }))
      setBozza((prec) => ({ foto: [...prec.foto, mediaId], alt: [...prec.alt, ''] }))
    } catch (err) {
      setErrore(err)
    } finally {
      setFase(null)
    }
  }

  /** Dagli appunti: si copia una foto e si incolla qui dentro. */
  async function incolla(evento) {
    if (fase) return
    for (const el of Array.from(evento.clipboardData?.items ?? [])) {
      if (el.kind !== 'file' || !el.type.startsWith('image/')) continue
      const file = el.getAsFile()
      if (!file) continue
      evento.preventDefault()
      await aggiungiFoto(file)
      return
    }
  }

  function togli(i) {
    setBozza((prec) => ({
      foto: prec.foto.filter((_, k) => k !== i),
      alt: prec.alt.filter((_, k) => k !== i),
    }))
  }

  /* Sposta una foto di un posto. La PRIMA e' la copertina, quindi questo e'
     anche il modo di scegliere quale lo diventa. */
  function sposta(i, verso) {
    const j = i + verso
    setBozza((prec) => {
      if (j < 0 || j >= prec.foto.length) return prec
      const foto = [...prec.foto]
      const alt = [...prec.alt]
      ;[foto[i], foto[j]] = [foto[j], foto[i]]
      ;[alt[i], alt[j]] = [alt[j], alt[i]]
      return { foto, alt }
    })
  }

  function scriviAlt(i, valore) {
    setBozza((prec) => ({
      ...prec,
      alt: prec.alt.map((x, k) => (k === i ? valore : x)),
    }))
  }

  async function salva() {
    if (fase) return
    setFase('salvo')
    setErrore(null)
    try {
      await setGalleriaEvento(apertoId, bozza)
      await caricaGallerie()
      setApertoId(null)
    } catch (err) {
      setErrore(err)
    } finally {
      setFase(null)
    }
  }

  if (stato === 'spento') return null

  return (
    <section className={s.sezione} aria-labelledby="galleria-admin-titolo">
      <h2 className={s.titolo} id="galleria-admin-titolo">
        {t('galleriaAdmin.titolo')}
      </h2>
      <p className={s.intro}>{t('galleriaAdmin.intro')}</p>
      <p className={s.peso}>{t('galleriaAdmin.peso')}</p>

      {stato === 'caricamento' && <Skeleton count={2} height="3rem" />}

      {stato === 'errore' && (
        <ErrorState title={t('galleriaAdmin.erroreLettura')} />
      )}

      {stato === 'pronto' && passati.length === 0 && (
        <p className={s.vuoto}>{t('galleriaAdmin.nessunaSerata')}</p>
      )}

      {stato === 'pronto' && passati.length > 0 && (
        <ul className={s.elenco}>
          {passati.map((incontro) => {
            const g = gallerie[incontro.id] ?? { foto: [] }
            const aperto = apertoId === incontro.id
            return (
              <li className={s.voce} key={incontro.id}>
                <div className={s.riga}>
                  <span className={s.info}>
                    <span className={s.nome}>{incontro.title}</span>
                    <span className={s.meta}>
                      {formatMeetupDate(incontro.startsAt, 'it') ?? ''}
                      {' · '}
                      {t('galleriaAdmin.quante', { n: g.foto.length })}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={s.piccolo}
                    onClick={() => (aperto ? chiudi() : apri(incontro))}
                    aria-expanded={aperto}
                  >
                    {aperto ? t('galleriaAdmin.chiudi') : t('galleriaAdmin.gestisci')}
                  </button>
                </div>

                {aperto && (
                  <div className={s.pannello} onPaste={incolla}>
                    <div className={s.azioniAlto}>
                      <label className={s.fileLabel}>
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          multiple
                          onChange={async (e) => {
                            const scelti = Array.from(e.target.files ?? [])
                            /* Uno alla volta e non in parallelo: ogni foto e'
                               una scrittura su Firestore, e dieci insieme
                               fanno scattare i limiti di frequenza. */
                            for (const f of scelti) await aggiungiFoto(f)
                            e.target.value = ''
                          }}
                          disabled={!!fase}
                        />
                        <span className={s.fileBottone}>
                          {fase === 'carico'
                            ? t('galleriaAdmin.carico')
                            : t('galleriaAdmin.aggiungi')}
                        </span>
                      </label>
                      <span className={s.aiuto}>{t('galleriaAdmin.incolla')}</span>
                    </div>

                    {bozza.foto.length === 0 ? (
                      <p className={s.vuoto}>{t('galleriaAdmin.ancoraNiente')}</p>
                    ) : (
                      <ol className={s.griglia}>
                        {bozza.foto.map((mediaId, i) => (
                          <li className={s.scatto} key={mediaId}>
                            <img
                              className={s.anteprima}
                              src={safeImageSrc(media[mediaId]?.dataUrl)}
                              alt=""
                              aria-hidden="true"
                            />
                            {i === 0 && (
                              <span className={s.copertinaTag}>
                                {t('galleriaAdmin.copertina')}
                              </span>
                            )}

                            <label className={s.altCampo}>
                              <span className="sr-only">
                                {t('galleriaAdmin.descrizione')}
                              </span>
                              <input
                                className={s.input}
                                type="text"
                                maxLength={300}
                                placeholder={t('galleriaAdmin.descrizione')}
                                value={bozza.alt[i] ?? ''}
                                onChange={(e) => scriviAlt(i, e.target.value)}
                              />
                            </label>

                            <div className={s.comandi}>
                              <button
                                type="button"
                                className={s.mini}
                                onClick={() => sposta(i, -1)}
                                disabled={i === 0}
                                aria-label={t('galleriaAdmin.suAria')}
                              >
                                &#8593;
                              </button>
                              <button
                                type="button"
                                className={s.mini}
                                onClick={() => sposta(i, 1)}
                                disabled={i === bozza.foto.length - 1}
                                aria-label={t('galleriaAdmin.giuAria')}
                              >
                                &#8595;
                              </button>
                              <button
                                type="button"
                                className={s.mini}
                                onClick={() => togli(i)}
                                aria-label={t('galleriaAdmin.togliAria')}
                              >
                                &#215;
                              </button>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}

                    <div className={s.azioni}>
                      <button
                        type="button"
                        className={s.primario}
                        onClick={salva}
                        disabled={!!fase}
                      >
                        {fase === 'salvo'
                          ? t('galleriaAdmin.salvo')
                          : t('galleriaAdmin.salva')}
                      </button>
                      <button
                        type="button"
                        className={s.piccolo}
                        onClick={chiudi}
                        disabled={!!fase}
                      >
                        {t('galleriaAdmin.annulla')}
                      </button>
                    </div>

                    {errore && (
                      <p className={s.errore} role="alert">
                        {messaggioErrore(t, errore, 'galleriaAdmin.erroreSalvataggio')}
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
