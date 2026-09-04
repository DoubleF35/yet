import { useCallback, useEffect, useState } from 'react'

import Avatar from './Avatar.jsx'
import EmptyState from './EmptyState.jsx'
import ErrorState from './ErrorState.jsx'
import Skeleton from './Skeleton.jsx'
import { formatDate, listPendingUsers, setUserStatus } from '../lib/db.js'
import { useI18n } from '../lib/i18n.jsx'

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
  const { lang, t } = useI18n()
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
              ? t('richieste.scritturaRifiutata')
              : err?.message || t('richieste.operazioneFallita'),
        }))
      } finally {
        setBusy((b) => ({ ...b, [uid]: null }))
      }
    },
    [onCountChange, t],
  )

  return (
    <section className={s.wrap} aria-labelledby="richieste">
      <div className={s.head}>
        <h2 className={s.title} id="richieste">
          {t('richieste.titolo')}
        </h2>
        {status === 'ready' && (
          <p className={s.count}>
            {items.length === 0
              ? t('richieste.nessunaInAttesa')
              : t('richieste.inAttesa', { n: items.length })}
          </p>
        )}
      </div>

      <p className={s.intro}>{t('richieste.intro')}</p>

      {status === 'loading' && (
        <div className={s.list} aria-hidden="true">
          <Skeleton height="5rem" count={2} />
        </div>
      )}

      {status === 'error' && (
        <ErrorState
          title={t('richieste.erroreTitolo')}
          message={
            error?.code === 'permission-denied'
              ? t('richieste.errorePermessi')
              : t('richieste.erroreGenerico')
          }
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}

      {status === 'ready' && items.length === 0 && (
        <EmptyState title={t('richieste.vuotoTitolo')}>{t('richieste.vuotoTesto')}</EmptyState>
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className={s.list}>
          {items.map((item) => {
            const name = item.displayName || t('richieste.senzaNome')
            const working = busy[item.uid]
            return (
              <li className={s.item} key={item.uid}>
                <div className={s.person}>
                  <Avatar src={item.photoURL} name={name} size={48} />
                  <div className={s.identity}>
                    <p className={s.name}>{name}</p>
                    <p className={s.when}>
                      {t('richieste.richiestaDel', { data: formatDate(item.createdAt, lang) })}
                    </p>
                  </div>
                </div>

                {item.bio ? (
                  <p className={s.bio}>{item.bio}</p>
                ) : (
                  <p className={s.bioEmpty}>{t('richieste.senzaPresentazione')}</p>
                )}

                <div className={s.actions}>
                  <button
                    type="button"
                    className={s.approve}
                    onClick={() => decide(item.uid, 'approved')}
                    disabled={!!working}
                  >
                    {working === 'approved' ? t('richieste.approvo') : t('richieste.approva')}
                  </button>
                  <button
                    type="button"
                    className={s.reject}
                    onClick={() => decide(item.uid, 'rejected')}
                    disabled={!!working}
                  >
                    {working === 'rejected' ? t('richieste.rifiuto') : t('richieste.rifiuta')}
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
