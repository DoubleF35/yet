import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../lib/auth.jsx'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'

import s from './DeleteAccount.module.css'

/**
 * "Cancella il mio profilo".
 *
 * Sta in fondo alla pagina Join, staccato dal form: è l'unica azione
 * irreversibile del sito e non deve stare accanto a "Salva".
 *
 * La conferma è a due passi e non usa `window.confirm`, come per l'eliminazione
 * delle notizie: un dialogo di sistema si può bloccare a livello di browser, e
 * qui sarebbe l'unica barriera prima di una cancellazione definitiva.
 */
export default function DeleteAccount() {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount()
      // replace: il tasto Indietro non deve riportare su una pagina che parla
      // di un profilo che non esiste più.
      navigate('/home', { replace: true })
    } catch (err) {
      // Fra questi c'è il caso "profilo cancellato ma account ancora da
      // rimuovere", che arriva con la chiave della frase da mostrare.
      setError(messaggioErrore(t, err, 'cancella.errore'))
      setBusy(false)
      setAsking(false)
    }
  }, [deleteAccount, navigate, t])

  return (
    <section className={s.zone} aria-labelledby="cancella-profilo">
      <h2 className={s.title} id="cancella-profilo">
        {t('cancella.titolo')}
      </h2>

      <p className={s.text}>{t('cancella.testo')}</p>

      {!asking ? (
        <button type="button" className={s.danger} onClick={() => setAsking(true)}>
          {t('cancella.bottone')}
        </button>
      ) : (
        <div className={s.confirm} role="group" aria-label={t('cancella.gruppo')}>
          <p className={s.question}>{t('cancella.domanda')}</p>
          <div className={s.actions}>
            <button type="button" className={s.danger} onClick={handleDelete} disabled={busy}>
              {busy ? t('cancella.inCorso') : t('cancella.conferma')}
            </button>
            <button
              type="button"
              className={s.cancel}
              onClick={() => setAsking(false)}
              disabled={busy}
            >
              {t('cancella.annulla')}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
