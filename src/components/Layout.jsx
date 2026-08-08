import { Outlet } from 'react-router-dom'

import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

import s from './Layout.module.css'

/**
 * L'impaginazione comune a tutte le pagine tranne la intro.
 *
 * Lo skip-link è il primo elemento focalizzabile del documento apposta: chi
 * naviga da tastiera altrimenti dovrebbe attraversare tutta la navbar a ogni
 * cambio pagina prima di arrivare al contenuto.
 */
export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Vai al contenuto
      </a>

      <Navbar />

      {/* tabIndex={-1} rende <main> focalizzabile via codice ma non col tab:
          è quello che permette allo skip-link di spostare davvero il focus
          invece di limitarsi a muovere lo scroll. */}
      <main id="main" className={s.main} tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
    </>
  )
}
