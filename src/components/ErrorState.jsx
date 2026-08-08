import s from './ErrorState.module.css'

/**
 * Lo stato "è andato storto qualcosa", con la via d'uscita.
 *
 * `onRetry` deve rifare il tentativo VERO (ri-sottoscrivere il listener,
 * rilanciare la fetch), non ricaricare la pagina: un reload perde lo scroll,
 * lo stato dei form e, sulla intro, fa ripartire tutto da capo.
 *
 * @param {string}   title      cosa non è riuscito, in parole d'uso comune
 * @param {string}   [message]  il dettaglio
 * @param {Function} [onRetry]  se manca, il bottone non compare
 */
export default function ErrorState({ title, message, onRetry, className = '' }) {
  return (
    <div
      className={`${s.error} ${className}`.trim()}
      /* role="alert" e non "status": è un errore, va annunciato subito e non
         quando lo screen reader avrà finito quel che stava leggendo. */
      role="alert"
    >
      <p className={s.title}>{title}</p>
      {message ? <p className={s.message}>{message}</p> : null}

      {typeof onRetry === 'function' ? (
        <button type="button" className={s.retry} onClick={onRetry}>
          Riprova
        </button>
      ) : null}
    </div>
  )
}
