import { useCallback, useEffect, useState } from 'react'

import Avatar from './Avatar.jsx'
import EmptyState from './EmptyState.jsx'
import ErrorState from './ErrorState.jsx'
import Skeleton from './Skeleton.jsx'
import { formatDate, listPendingUsers, setUserStatus } from '../lib/db.js'

import s from './PendingRequests.module.css'

/**
 * La casella delle richieste di iscrizione, dentro /admin.
 *
 * Chi chiede di entrare resta invisibile sul sito finché uno dei quattro
 * amministratori non lo approva da qui. Le regole Firestore fanno rispettare
 * la cosa davvero: nessuno può auto-approvarsi, e un admin può cambiare lo
 * stato di un profilo ma non riscriverne il contenuto.
 *
 * NOTA SULLE NOTIFICHE: senza Cloud Functions (piano Spark) non è possibile
 * mandare una mail automatica quando arriva una richiesta. Il conteggio qui
 * sotto e il pallino sul link "Admin" nella navbar sono la sostituzione
 * onesta: gli amministratori se ne accorgono aprendo il sito, non ricevendo
 * un messaggio. Il README spiega cosa servirebbe per averle via mail.
 */
export default function PendingRequests({ onCountChange }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  /* Quale richiesta sta cambiando stato, e come. Per riga e non globale: con
     un flag solo, cliccare "Approva" su una riga bloccherebbe tutte. */
  const [busy, setBusy] = useState({})
  const [rowError, setRowError] = useState({})

  useEffect(() => {
    let alive = true
    setStatus('loading')
    setError(null)

    listPendingUsers()
      .then((list) => {
        if (!alive) return
        setItems(list)
        setStatus('ready')
        onCountChange?.(list.length)
      })
      .catch((err) => {
        if (!alive) return
        setError(err)
        setStatus('error')
      })

    return () => {
      alive = false
    }
  }, [attempt, onCountChange])

  const decide = useCallback(
    async (uid, next) => {
      setBusy((b) => ({ ...b, [uid]: next }))
      setRowError((e) => ({ ...e, [uid]: null }))
      try {
        await setUserStatus(uid, next)
        // Tolta dalla coda in locale invece di rileggere tutto: la lista è
        // corta e una richiesta in meno non giustifica un altro giro di rete.
        setItems((list) => {
          const rest = list.filter((x) => x.uid !== uid)
          onCountChange?.(rest.length)
          return rest
        })
      } catch (err) {
        setRowError((e) => ({
          ...e,
          [uid]:
            err?.code === 'permission-denied'
              ? 'Rifiutato dal server: la tua email non è nella allowlist dentro firestore.rules, oppure le regole non sono state ripubblicate dopo l’ultima modifica.'
              : err?.message || 'Operazione non riuscita.',
        }))
      } finally {
        setBusy((b) => ({ ...b, [uid]: null }))
      }
    },
    [onCountChange],
  )

  return (
    <section className={s.wrap} aria-labelledby="richieste">
      <div className={s.head}>
        <h2 className={s.title} id="richieste">
          Richieste di iscrizione
        </h2>
        {status === 'ready' && (
          <p className={s.count}>
            {items.length === 0
              ? 'nessuna in attesa'
              : `${items.length} in attesa`}
          </p>
        )}
      </div>

      <p className={s.intro}>
        Chi si iscrive non compare fra i membri finché non lo approvate da qui. Il rifiuto non
        cancella niente ed è reversibile: la persona continua a vedere il proprio profilo, ma non
        lo vede nessun altro.
      </p>

      {status === 'loading' && (
        <div className={s.list} aria-hidden="true">
          <Skeleton height="5rem" count={2} />
        </div>
      )}

      {status === 'error' && (
        <ErrorState
          title="Non riesco a leggere le richieste"
          message={
            error?.code === 'permission-denied'
              ? 'Il server ha rifiutato la lettura. Controlla che la tua email sia nella allowlist dentro firestore.rules e che le regole siano state pubblicate.'
              : 'Qualcosa è andato storto. Può essere la connessione.'
          }
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}

      {status === 'ready' && items.length === 0 && (
        <EmptyState title="Nessuna richiesta in attesa">
          Quando qualcuno si iscriverà comparirà qui, e riceverà accesso solo dopo che uno di voi
          l’avrà approvato.
        </EmptyState>
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className={s.list}>
          {items.map((item) => {
            const name = item.displayName || 'Senza nome'
            const working = busy[item.uid]
            return (
              <li className={s.item} key={item.uid}>
                <div className={s.person}>
                  <Avatar src={item.photoURL} name={name} size={48} />
                  <div className={s.identity}>
                    <p className={s.name}>{name}</p>
                    <p className={s.when}>Richiesta del {formatDate(item.createdAt)}</p>
                  </div>
                </div>

                {item.bio ? (
                  <p className={s.bio}>{item.bio}</p>
                ) : (
                  <p className={s.bioEmpty}>Non ha scritto una presentazione.</p>
                )}

                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.approve}
                    onClick={() => decide(item.uid, 'approved')}
                    disabled={!!working}
                  >
                    {working === 'approved' ? 'Approvo…' : 'Approva'}
                  </button>
                  <button
                    type="button"
                    className={s.reject}
                    onClick={() => decide(item.uid, 'rejected')}
                    disabled={!!working}
                  >
                    {working === 'rejected' ? 'Rifiuto…' : 'Rifiuta'}
                  </button>
                </div>

                {/* L'errore sta sulla riga che l'ha prodotto: un messaggio
                    globale non farebbe capire quale delle richieste è fallita. */}
                {rowError[item.uid] && (
                  <p className={s.rowError} role="alert">
                    {rowError[item.uid]}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
