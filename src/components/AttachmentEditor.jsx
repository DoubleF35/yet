import { useId, useState } from 'react'

import {
  LABEL_MAX,
  MAX_ATTACHMENTS,
  defaultLabel,
  looksLikeImage,
  safeUrl,
} from '../lib/attachments.js'

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
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState(null)

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
    onChange(value.filter((a) => a.url !== target))
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
        Puoi allegare link e immagini incollando il loro indirizzo. Le immagini vengono mostrate
        dentro la notizia, i link come elenco sotto al testo.
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
