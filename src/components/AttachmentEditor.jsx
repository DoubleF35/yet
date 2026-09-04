import { useId, useRef, useState } from 'react'

import {
  LABEL_MAX,
  MAX_ATTACHMENTS,
  defaultLabel,
  looksLikeImage,
  safeUrl,
} from '../lib/attachments.js'

import {
  COMPRESSIBLE,
  MAX_INLINE_BYTES,
  compressImage,
  humanBytes,
  readAsDataUrl,
} from '../lib/imageCompress.js'
import { createMedia, deleteMedia } from '../lib/db.js'
import { useAuth } from '../lib/auth.jsx'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'

import s from './AttachmentEditor.module.css'

/**
 * Aggiunge link e immagini a una notizia.
 *
 * Usato sia dal form "Nuova notizia" sia dalla modifica in linea, così le due
 * strade non possono divergere.
 *
 * @param {Array}    value    allegati correnti
 * @param {Function} onChange riceve il nuovo array
 * @param {boolean}  disabled durante il salvataggio
 */
export default function AttachmentEditor({ value = [], onChange, disabled = false }) {
  const { user } = useAuth()
  const { t } = useI18n()

  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState(null)

  /* null = nessun caricamento in corso; 0..100 = percentuale. Lo zero è uno
     stato legittimo (caricamento appena partito), quindi non si può usare la
     verità del valore per sapere se sta caricando: da qui il null. */
  const [progress, setProgress] = useState(null)
  const fileRef = useRef(null)

  /* Stato del caricamento: la compressione di una foto da dodici megapixel
     dura qualche secondo, e senza una parola a schermo sembra che il sito si
     sia piantato.
     Porta un CODICE e non la frase: la frase la decide t() al render, così
     cambiando lingua non resta appesa quella di prima. */
  const [fase, setFase] = useState(null)

  const reactId = useId()
  const urlId = `${reactId}-url`
  const labelId = `${reactId}-label`
  const errorId = `${reactId}-error`

  const pieno = value.length >= MAX_ATTACHMENTS

  function aggiungi() {
    const pulito = safeUrl(url)

    if (!pulito) {
      setError(url.trim() ? t('allegati.urlNonValido') : t('allegati.urlVuoto'))
      return
    }
    if (value.some((a) => a.url === pulito)) {
      setError(t('allegati.doppione'))
      return
    }
    if (pieno) {
      setError(t('allegati.troppi', { max: MAX_ATTACHMENTS }))
      return
    }

    const tipo = looksLikeImage(pulito) ? 'image' : 'link'
    onChange([
      ...value,
      { type: tipo, url: pulito, label: label.trim().slice(0, LABEL_MAX) || defaultLabel(pulito) },
    ])
    setUrl('')
    setLabel('')
    setError(null)
  }

  const chiaveDi = (a) => (a.mediaId ? `media:${a.mediaId}` : a.url)

  function rimuovi(chiave) {
    const tolto = value.find((a) => chiaveDi(a) === chiave)
    onChange(value.filter((a) => chiaveDi(a) !== chiave))

    /* Il file viene cancellato SOLO se è stato caricato in questa sessione di
       modifica, cioè se non è ancora finito in nessuna notizia salvata.
       Il perché è un guaio vero: modificando una notizia già pubblicata,
       "Togli" seguito da "Annulla" cancellava il file dal database ma lasciava
       intatta la notizia, che continuava a puntarci. Risultato: la foto
       spariva dalla home e nessuno lo veniva a sapere. Annullare non deve
       poter distruggere niente.
       Il prezzo è che togliere un allegato da una notizia salvata lascia il
       file orfano nel database. Costa qualche centinaio di KB e si vede nel
       backup: molto meno di una foto pubblicata che sparisce. */
    if (tolto?.mediaId && tolto?.justUploaded) deleteMedia(tolto.mediaId)
  }

  async function carica(file) {
    if (!file) return
    setError(null)

    if (value.length >= MAX_ATTACHMENTS) {
      setError(t('allegati.troppi', { max: MAX_ATTACHMENTS }))
      return
    }

    const isImmagine = COMPRESSIBLE.includes(file.type)
    if (!isImmagine && file.type !== 'application/pdf') {
      setError(
        t('allegati.tipoNonAmmesso', { tipo: file.type || t('allegati.tipoSconosciuto') }),
      )
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setProgress(0)
    try {
      setFase(isImmagine ? 'comprimo' : 'leggo')
      const esito = isImmagine ? await compressImage(file) : await readAsDataUrl(file)
      setProgress(50)

      setFase('salvo')
      const mediaId = await createMedia(
        {
          dataUrl: esito.dataUrl,
          contentType: esito.mime || file.type,
          name: file.name,
          width: esito.width,
          height: esito.height,
          bytes: esito.bytes,
        },
        user,
      )
      setProgress(100)

      onChange([
        ...value,
        {
          type: isImmagine ? 'image' : 'file',
          mediaId,
          label: label.trim().slice(0, LABEL_MAX) || file.name,
          /* Marchio "appena caricato": distingue i file che possiamo ancora
             cancellare senza rischi da quelli che una notizia salvata sta già
             mostrando. normalizeAttachments lo scarta prima di scrivere. */
          justUploaded: true,
          /* Solo per l'anteprima qui nell'editor: normalizeAttachments lo
             scarta prima di salvare, così il documento della notizia non si
             porta dietro il megabyte che sta già in media/{id}. */
          previewUrl: esito.dataUrl,
        },
      ])
      setLabel('')
    } catch (err) {
      setError(messaggioErrore(t, err, 'allegati.erroreCaricamento'))
    } finally {
      setProgress(null)
      setFase(null)
      // Azzerare l'input è necessario, non cosmesi: senza, scegliere DI NUOVO
      // lo stesso file non fa scattare onChange e sembra che il bottone si sia
      // rotto.
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /* Serve davvero: un URL che finisce in .jpg ma pesa otto megabyte è meglio
     come link, e un'immagine servita da un indirizzo senza estensione (capita
     con i CDN) altrimenti non verrebbe mai mostrata. */
  function cambiaTipo(target) {
    onChange(
      value.map((a) =>
        a.url === target ? { ...a, type: a.type === 'image' ? 'link' : 'image' } : a,
      ),
    )
  }

  /* La frase della fase in corso, o stringa vuota. In un posto solo: la usano
     il bottone del file e la live region qui sotto. */
  const faseTesto = fase ? t(`allegati.${fase}`) : ''

  return (
    <div className={s.wrap}>
      <p className={s.hint}>{t('allegati.hint')}</p>

      {value.length > 0 && (
        <ul className={s.list}>
          {value.map((a) => {
            const chiave = chiaveDi(a)
            const anteprima = a.previewUrl || (a.mediaId ? null : a.url)
            return (
              <li className={s.item} key={chiave}>
                {a.type === 'image' && anteprima ? (
                  <img className={s.thumb} src={anteprima} alt="" aria-hidden="true" loading="lazy" />
                ) : (
                  <span className={s.thumbFallback} aria-hidden="true" />
                )}

                <span className={s.info}>
                  <span className={s.label}>{a.label}</span>
                  <span className={s.url}>
                    {a.mediaId ? t('allegati.fileCaricato') : a.url}
                  </span>
                </span>

                <span className={s.itemActions}>
                  {/* Il cambio di tipo ha senso solo per gli indirizzi
                      incollati: di un file caricato sappiamo già con certezza
                      se è un'immagine o no. */}
                  {!a.mediaId && (
                    <button
                      type="button"
                      className={s.small}
                      onClick={() => cambiaTipo(a.url)}
                      disabled={disabled}
                    >
                      {a.type === 'image'
                        ? t('allegati.trattaComeLink')
                        : t('allegati.trattaComeImmagine')}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${s.small} ${s.remove}`}
                    onClick={() => rimuovi(chiave)}
                    disabled={disabled}
                    aria-label={t('allegati.togliAria', { nome: a.label })}
                  >
                    {t('allegati.togli')}
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <div className={s.form}>
        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={urlId}>
            {t('allegati.indirizzo')}
          </label>
          <input
            id={urlId}
            className={s.input}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError(null)
            }}
            /* Invio aggiunge l'allegato invece di inviare tutta la notizia:
               dentro un <form>, un input di tipo url farebbe il submit, e
               l'admin si ritroverebbe la notizia pubblicata a metà. */
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                aggiungi()
              }
            }}
            disabled={disabled || pieno}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
          />
        </div>

        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={labelId}>
            {t('allegati.comeSiChiama')}{' '}
            <span className={s.optional}>{t('allegati.facoltativo')}</span>
          </label>
          <input
            id={labelId}
            className={s.input}
            type="text"
            placeholder={t('allegati.nomePlaceholder')}
            maxLength={LABEL_MAX}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                aggiungi()
              }
            }}
            disabled={disabled || pieno}
          />
        </div>

        <button type="button" className={s.add} onClick={aggiungi} disabled={disabled || pieno}>
          {t('allegati.aggiungi')}
        </button>
      </div>

      <div className={s.upload}>
        <label className={s.fileLabel}>
          <input
            ref={fileRef}
            className={s.file}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
            onChange={(e) => carica(e.target.files?.[0])}
            disabled={disabled || pieno || progress !== null}
          />
          <span className={s.fileButton}>{faseTesto || t('allegati.caricaFile')}</span>
        </label>
        <span className={s.uploadHint}>
          {t('allegati.uploadHint', { peso: humanBytes(MAX_INLINE_BYTES) })}
        </span>

        {progress !== null && (
          <progress className={s.progress} value={progress} max="100">
            {progress}%
          </progress>
        )}
      </div>

      {/* Sempre nel DOM, anche vuota: una live region aggiunta al momento non
          viene annunciata, perché lo screen reader non la stava osservando.
          Il testo di fase da solo non basta: vive dentro il nome accessibile
          di un bottone che nello stesso istante viene disabilitato, e un
          controllo disabilitato non viene riletto. */}
      <p className="sr-only" role="status">
        {faseTesto}
      </p>

      {error && (
        <p className={s.error} id={errorId} role="alert">
          {error}
        </p>
      )}

      {pieno && (
        <p className={s.full}>{t('allegati.pieno', { max: MAX_ATTACHMENTS })}</p>
      )}
    </div>
  )
}
