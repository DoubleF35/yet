import { useEffect, useId, useRef, useState } from 'react'

import {
  LABEL_MAX,
  MAX_ATTACHMENTS,
  defaultLabel,
  looksLikeImage,
  safeUrl,
} from '../lib/attachments.js'

import {
  ACCEPT_ATTR,
  MAX_UPLOAD_BYTES,
  deleteUploadedFile,
  humanSize,
  probeStorage,
  uploadNewsFile,
} from '../lib/storage.js'
import { useAuth } from '../lib/auth.jsx'

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

  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState(null)

  /* null = nessun caricamento in corso; 0..100 = percentuale. Lo zero è uno
     stato legittimo (caricamento appena partito), quindi non si può usare la
     verità del valore per sapere se sta caricando: da qui il null. */
  const [progress, setProgress] = useState(null)
  const fileRef = useRef(null)

  /* null = non lo sappiamo ancora. Finché non sappiamo, non mostriamo né il
     bottone né l'avviso: far comparire «non è attivo» per mezzo secondo a chi
     ce l'ha attivo sarebbe peggio di aspettare. */
  const [storageOk, setStorageOk] = useState(null)

  useEffect(() => {
    let alive = true
    probeStorage().then((ok) => alive && setStorageOk(ok))
    return () => {
      alive = false
    }
  }, [])

  const reactId = useId()
  const urlId = `${reactId}-url`
  const labelId = `${reactId}-label`
  const errorId = `${reactId}-error`

  const pieno = value.length >= MAX_ATTACHMENTS

  function aggiungi() {
    const pulito = safeUrl(url)

    if (!pulito) {
      setError(
        url.trim()
          ? 'Serve un indirizzo che inizi per http:// o https://. Altri tipi di link non vengono accettati.'
          : 'Incolla un indirizzo.',
      )
      return
    }
    if (value.some((a) => a.url === pulito)) {
      setError('Questo allegato c’è già.')
      return
    }
    if (pieno) {
      setError(`Massimo ${MAX_ATTACHMENTS} allegati per notizia.`)
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

  function rimuovi(target) {
    const tolto = value.find((a) => a.url === target)
    onChange(value.filter((a) => a.url !== target))
    /* Se il file l'avevamo caricato noi, va tolto anche dal bucket: senza,
       ogni ripensamento lascerebbe un file pagato e mai mostrato. Non si
       aspetta l'esito — l'allegato è già sparito dalla notizia, che è quello
       che l'utente ha chiesto. */
    if (tolto?.storagePath) deleteUploadedFile(tolto.storagePath)
  }

  async function carica(file) {
    if (!file) return
    setError(null)

    if (value.length >= MAX_ATTACHMENTS) {
      setError(`Massimo ${MAX_ATTACHMENTS} allegati per notizia.`)
      return
    }

    setProgress(0)
    try {
      const caricato = await uploadNewsFile(file, { uid: user?.uid, onProgress: setProgress })
      onChange([
        ...value,
        {
          type: caricato.contentType.startsWith('image/') ? 'image' : 'link',
          url: caricato.url,
          label: label.trim().slice(0, LABEL_MAX) || caricato.name,
          // Serve solo a noi, per poter cancellare il file se l'allegato viene
          // tolto. normalizeAttachments lo scarta prima di salvare su
          // Firestore: le regole ammettono solo type/url/label.
          storagePath: caricato.path,
        },
      ])
      setLabel('')
    } catch (err) {
      setError(err?.message || 'Caricamento non riuscito.')
    } finally {
      setProgress(null)
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

  return (
    <div className={s.wrap}>
      <p className={s.hint}>
        Carica un file dal tuo dispositivo, oppure incolla l’indirizzo di qualcosa che è già
        online. Le immagini vengono mostrate dentro la notizia, tutto il resto come elenco di
        link sotto al testo.
      </p>

      {value.length > 0 && (
        <ul className={s.list}>
          {value.map((a) => (
            <li className={s.item} key={a.url}>
              {a.type === 'image' ? (
                <img className={s.thumb} src={a.url} alt="" aria-hidden="true" loading="lazy" />
              ) : (
                <span className={s.thumbFallback} aria-hidden="true" />
              )}

              <span className={s.info}>
                <span className={s.label}>{a.label}</span>
                <span className={s.url}>{a.url}</span>
              </span>

              <span className={s.itemActions}>
                <button
                  type="button"
                  className={s.small}
                  onClick={() => cambiaTipo(a.url)}
                  disabled={disabled}
                >
                  {a.type === 'image' ? 'Tratta come link' : 'Tratta come immagine'}
                </button>
                <button
                  type="button"
                  className={`${s.small} ${s.remove}`}
                  onClick={() => rimuovi(a.url)}
                  disabled={disabled}
                  aria-label={`Togli l’allegato ${a.label}`}
                >
                  Togli
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className={s.form}>
        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={urlId}>
            Indirizzo
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
            Come si chiama <span className={s.optional}>(facoltativo)</span>
          </label>
          <input
            id={labelId}
            className={s.input}
            type="text"
            placeholder="Volantino dell’incontro"
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
          Aggiungi
        </button>
      </div>

      <div className={s.upload}>
        {storageOk === null ? null : storageOk ? (
          <>
            <label className={s.fileLabel}>
              <input
                ref={fileRef}
                className={s.file}
                type="file"
                accept={ACCEPT_ATTR}
                onChange={(e) => carica(e.target.files?.[0])}
                disabled={disabled || pieno || progress !== null}
              />
              <span className={s.fileButton}>
                {progress !== null ? `Caricamento ${progress}%` : 'Carica un file'}
              </span>
            </label>
            <span className={s.uploadHint}>
              Immagini o PDF, fino a {humanSize(MAX_UPLOAD_BYTES)}.
            </span>

            {progress !== null && (
              <progress className={s.progress} value={progress} max="100">
                {progress}%
              </progress>
            )}
          </>
        ) : (
          /* Spiegare invece di nascondere: un bottone che sparisce senza dire
             niente sembra una funzione che non esiste, non una da attivare. */
          <p className={s.uploadOff}>
            <strong>Il caricamento di file non è attivo.</strong> Serve Firebase Storage: console
            Firebase → Storage → «Inizia», poi pubblica <code>storage.rules</code>. Nel frattempo
            puoi incollare qui sopra l’indirizzo di un file già online.
          </p>
        )}
      </div>

      {error && (
        <p className={s.error} id={errorId} role="alert">
          {error}
        </p>
      )}

      {pieno && (
        <p className={s.full}>
          Hai raggiunto il massimo di {MAX_ATTACHMENTS} allegati. Togline uno per aggiungerne altri.
        </p>
      )}
    </div>
  )
}
