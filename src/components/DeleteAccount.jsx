import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../lib/auth.jsx'

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
      // rimuovere", che arriva come messaggio già scritto per l'utente.
      setError(err?.message || 'Non è stato possibile completare la cancellazione.')
      setBusy(false)
      setAsking(false)
    }
  }, [deleteAccount, navigate])

  return (
    <section className={s.zone} aria-labelledby="cancella-profilo">
      <h2 className={s.title} id="cancella-profilo">
        Cancellare il profilo
      </h2>

      <p className={s.text}>
        Rimuove il tuo profilo dall’elenco dei membri e il tuo account di accesso. È definitivo:
        nome, bio, foto e link spariscono e non si recuperano.
      </p>

      {!asking ? (
        <button type="button" className={s.danger} onClick={() => setAsking(true)}>
          Cancella il mio profilo
        </button>
      ) : (
        <div className={s.confirm} role="group" aria-label="Conferma la cancellazione">
          <p className={s.question}>Sicuro? Non si torna indietro.</p>
          <div className={s.actions}>
            <button type="button" className={s.danger} onClick={handleDelete} disabled={busy}>
              {busy ? 'Cancellazione…' : 'Sì, cancella tutto'}
            </button>
            <button
              type="button"
              className={s.cancel}
              onClick={() => setAsking(false)}
              disabled={busy}
            >
              No, torna indietro
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
