import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import { useAuth } from '../lib/auth.jsx'
import { useI18n } from '../lib/i18n.jsx'

import s from './Layout.module.css'

/**
 * L'impaginazione comune a tutte le pagine tranne la intro.
 *
 * Lo skip-link è il primo elemento focalizzabile del documento apposta: chi
 * naviga da tastiera altrimenti dovrebbe attraversare tutta la navbar a ogni
 * cambio pagina prima di arrivare al contenuto.
 */
/* Le pagine che si possono aprire anche senza foto: quella dove la si mette,
   e le due informative, che devono restare leggibili da chiunque prima di
   decidere se dare qualcosa a questo sito. */
const SENZA_FOTO_SI_PUO = ['/join', '/privacy', '/cookie']

export default function Layout() {
  const { t } = useI18n()
  const { user, profile, profileLoading } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  /* CHI HA UN PROFILO SENZA FOTO LA DEVE METTERE PRIMA DI TUTTO.
     Appena entra nel sito con il suo account viene portato su /join, dove
     c'e' l'avviso e il campo, e ci resta finche' non salva con una foto.

     Solo per chi ha GIA' un profilo: chi ha fatto l'accesso ma non si e'
     ancora iscritto arriva comunque su /join, e li' la foto e' obbligatoria
     di suo. Si aspetta che il profilo sia letto, per non rimbalzare qualcuno
     nel mezzo secondo in cui il documento non e' ancora arrivato.

     `replace`, perche' il tasto Indietro non lo riporti sulla pagina da cui
     e' stato appena spostato, che lo rimanderebbe qui. */
  const senzaFoto = Boolean(user && profile && !String(profile.photoURL ?? '').trim())
  useEffect(() => {
    if (profileLoading || !senzaFoto) return
    const libera = SENZA_FOTO_SI_PUO.some((p) => pathname === p || pathname === `${p}/`)
    if (!libera) navigate('/join', { replace: true })
  }, [senzaFoto, profileLoading, pathname, navigate])

  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.vaiAlContenuto')}
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
