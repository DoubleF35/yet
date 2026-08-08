import { Link } from 'react-router-dom'

import { useAuth } from '../lib/auth.jsx'

import s from './RequireAdmin.module.css'

/**
 * Cancello della pagina /admin.
 *
 * NON reindirizza in silenzio: chi arriva qui senza permessi deve capire cosa
 * è successo, altrimenti sembra che il link sia rotto. Tre casi distinti,
 * tre schermate diverse.
 *
 * ATTENZIONE — questo componente nasconde l'interfaccia, non protegge i dati.
 * Chi apre la console può montare la pagina lo stesso: a fermarlo sono le
 * regole in firestore.rules, che rifiutano la scrittura lato server.
 */
export default function RequireAdmin({ children }) {
  const { user, loading, isAdmin, signIn } = useAuth()

  if (loading) {
    return (
      <div className={s.gate}>
        <div className="container">
          <p className={s.loading} role="status">
            Sto controllando i permessi…
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={s.gate}>
        <div className="container">
          <h1 className={s.title}>Area riservata</h1>
          <p className={s.text}>
            Questa pagina serve a pubblicare le notizie del sito. Accedi con l’account YET per
            continuare.
          </p>
          <button type="button" className={s.button} onClick={signIn}>
            Accedi con Google
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className={s.gate}>
        <div className="container">
          <h1 className={s.title}>Non hai i permessi</h1>
          <p className={s.text}>
            Sei entrato come <strong>{user.email}</strong>, che non è fra gli amministratori della
            community. Se pensi che sia un errore, scrivi a chi gestisce il sito: la lista si trova
            in <code className={s.code}>src/config/admins.js</code> e, soprattutto, in{' '}
            <code className={s.code}>firestore.rules</code>.
          </p>
          <Link className={s.button} to="/home">
            Torna alla home
          </Link>
        </div>
      </div>
    )
  }

  return children
}
