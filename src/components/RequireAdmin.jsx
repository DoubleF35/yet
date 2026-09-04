import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { authErrorText, useAuth } from '../lib/auth.jsx'
import { useI18n } from '../lib/i18n.jsx'

import s from './RequireAdmin.module.css'

/**
 * Cancello della pagina /admin.
 *
 * NON reindirizza in silenzio: chi arriva qui senza permessi deve capire cosa
 * è successo, altrimenti sembra che il link sia rotto. Tre casi distinti,
 * tre schermate diverse.
 *
 * ATTENZIONE, questo componente nasconde l'interfaccia, non protegge i dati.
 * Chi apre la console può montare la pagina lo stesso: a fermarlo sono le
 * regole in firestore.rules, che rifiutano la scrittura lato server.
 */
export default function RequireAdmin({ children }) {
  const { user, loading, isAdmin, signIn, error } = useAuth()
  const { t } = useI18n()
  const [signingIn, setSigningIn] = useState(false)

  /* `onClick={signIn}` secco non bastava: passava l'oggetto evento come primo
     argomento, non mostrava nessuna attesa e, se l'accesso falliva, lasciava
     la schermata identica a prima. Chi non riusciva a entrare non aveva modo
     di sapere perche'. */
  const handleSignIn = useCallback(async () => {
    setSigningIn(true)
    try {
      await signIn()
    } finally {
      setSigningIn(false)
    }
  }, [signIn])

  if (loading) {
    return (
      <div className={s.gate}>
        <div className="container">
          <p className={s.loading} role="status">
            {t('gate.controllo')}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={s.gate}>
        <div className="container">
          <h1 className={s.title}>{t('gate.riservataTitolo')}</h1>
          <p className={s.text}>{t('gate.riservataTesto')}</p>
          <button type="button" className={s.button} onClick={handleSignIn} disabled={signingIn}>
            {signingIn ? t('nav.attendi') : t('gate.accediGoogle')}
          </button>

          {error && (
            <p className={s.error} role="alert">
              {/* L'errore arriva grezzo dal contesto: la frase la compone
                  authErrorText, nella lingua scelta. */}
              {authErrorText(t, error)}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className={s.gate}>
        <div className="container">
          <h1 className={s.title}>{t('gate.nonAdminTitolo')}</h1>
          {/* L'indirizzo entra come segnaposto invece di stare fra due pezzi
              di frase: spezzare una frase in due stringhe obbliga chi traduce
              a rispettare l'ordine delle parole dell'italiano, e in inglese
              quell'ordine cambia. */}
          <p className={s.text}>{t('gate.nonAdminTesto', { email: user.email })}</p>
          <p className={s.text}>
            {t('gate.nonAdminDove1')} <code className={s.code}>src/config/admins.js</code>{' '}
            {t('gate.nonAdminDove2')} <code className={s.code}>firestore.rules</code>.
          </p>
          <Link className={s.button} to="/home">
            {t('gate.tornaHome')}
          </Link>
        </div>
      </div>
    )
  }

  return children
}
