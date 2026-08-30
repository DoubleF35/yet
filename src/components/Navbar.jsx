import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import Avatar from './Avatar.jsx'
import { useAuth } from '../lib/auth.jsx'

import s from './Navbar.module.css'

const LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/vetrina', label: 'Vetrina' },
  { to: '/eventi', label: 'Eventi' },
  { to: '/join', label: 'Join' },
  { to: '/contatti', label: 'Contatti' },
  { to: '/brand', label: 'Brand' },
]

export default function Navbar() {
  const { user, profile, loading, isAdmin, signIn, signOutUser } = useAuth()
  const { pathname } = useLocation()

  const [menuOpen, setMenuOpen] = useState(false) // il panino, sotto i 768px
  const [userOpen, setUserOpen] = useState(false) // il menu dell'utente
  const [signingIn, setSigningIn] = useState(false)

  const menuId = useId()
  const userMenuId = useId()

  const userButtonRef = useRef(null)
  const userMenuRef = useRef(null)
  const navRef = useRef(null)

  const logo = `${import.meta.env.BASE_URL}logo-light.png`
  const displayName = profile?.displayName || user?.displayName || user?.email || 'Il tuo profilo'

  /* Cambio pagina: chiudiamo tutto. Senza, si clicca un link dal panino e il
     pannello resta aperto sopra la pagina nuova. */
  useEffect(() => {
    setMenuOpen(false)
    setUserOpen(false)
  }, [pathname])

  /* Il pannello mobile copre lo schermo: lasciare il body scrollabile sotto è
     il difetto classico (si scorre la pagina dietro il menu). Il ripristino
     nel cleanup è la metà che tutti dimenticano, e che lascia il sito bloccato
     se il componente si smonta con il menu aperto. */
  useEffect(() => {
    if (!menuOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  /* Esc chiude il pannello che è aperto e restituisce il focus a chi l'ha
     aperto: senza il ritorno del focus, chi naviga da tastiera riparte
     dall'inizio del documento. */
  useEffect(() => {
    if (!menuOpen && !userOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (userOpen) {
        setUserOpen(false)
        userButtonRef.current?.focus()
      } else if (menuOpen) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, userOpen])

  /* Click fuori. `pointerdown` e non `click`: intercetta il gesto prima che
     React abbia rilanciato il suo evento sintetico, così il menu non si
     riapre da solo quando si clicca di nuovo sul bottone che l'ha aperto. */
  useEffect(() => {
    if (!userOpen && !menuOpen) return undefined

    const onPointerDown = (event) => {
      if (userOpen && !userMenuRef.current?.contains(event.target) && !userButtonRef.current?.contains(event.target)) {
        setUserOpen(false)
      }
      if (menuOpen && !navRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [userOpen, menuOpen])

  const handleSignIn = useCallback(async () => {
    setSigningIn(true)
    try {
      await signIn()
    } finally {
      // Anche in caso di errore il bottone deve tornare cliccabile: l'errore
      // vero lo mostra la pagina Join, che ha lo spazio per spiegarlo.
      setSigningIn(false)
    }
  }, [signIn])

  const handleSignOut = useCallback(async () => {
    setUserOpen(false)
    await signOutUser()
  }, [signOutUser])

  const linkClass = ({ isActive }) => `${s.link} ${isActive ? s.linkActive : ''}`.trim()

  return (
    <header className={s.header} ref={navRef}>
      <nav className={s.bar} aria-label="Navigazione principale">
        {/* --- logo ------------------------------------------------------ */}
        <Link to="/home" className={s.brand} aria-label="YET, vai alla home">
          <img className={s.logo} src={logo} alt="YET" width="486" height="291" />
        </Link>

        {/* --- link, versione desktop ------------------------------------ */}
        <ul className={s.links}>
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => `${s.link} ${s.admin} ${isActive ? s.linkActive : ''}`.trim()}>
                Admin
              </NavLink>
            </li>
          )}
        </ul>

        {/* --- zona destra ------------------------------------------------ */}
        <div className={s.right}>
          {loading ? (
            /* Segnaposto della stessa dimensione dell'avatar: senza, la barra
               si allarga di colpo quando Firebase risponde. */
            <span className={s.authPlaceholder} aria-hidden="true" />
          ) : user ? (
            <div className={s.user}>
              <button
                type="button"
                ref={userButtonRef}
                className={s.userButton}
                onClick={() => setUserOpen((open) => !open)}
                aria-expanded={userOpen}
                aria-haspopup="menu"
                aria-controls={userMenuId}
                aria-label={`Menu utente, ${displayName}`}
              >
                <Avatar src={profile?.photoURL || user.photoURL} name={displayName} size={36} />
              </button>

              {userOpen && (
                <div className={s.userMenu} id={userMenuId} role="menu" ref={userMenuRef}>
                  <p className={s.userName} role="presentation">
                    {displayName}
                  </p>
                  <Link to="/join" className={s.userItem} role="menuitem" onClick={() => setUserOpen(false)}>
                    Il mio profilo
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className={`${s.userItem} ${s.userItemAdmin}`} role="menuitem" onClick={() => setUserOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button type="button" className={s.userItem} role="menuitem" onClick={handleSignOut}>
                    Esci
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className={s.signIn} onClick={handleSignIn} disabled={signingIn}>
              {signingIn ? 'Attendi…' : 'Accedi'}
            </button>
          )}

          {/* --- panino, versione mobile --------------------------------- */}
          <button
            type="button"
            className={s.burger}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Chiudi il menu' : 'Apri il menu'}
          >
            <span className={`${s.burgerBar} ${menuOpen ? s.burgerBarTop : ''}`.trim()} />
            <span className={`${s.burgerBar} ${menuOpen ? s.burgerBarMid : ''}`.trim()} />
            <span className={`${s.burgerBar} ${menuOpen ? s.burgerBarBot : ''}`.trim()} />
          </button>
        </div>
      </nav>

      {/* Il pannello resta fuori dal <nav> per non annidare due liste di
          navigazione con lo stesso ruolo. Montato solo quando serve: così i
          suoi link non sono raggiungibili col tab mentre è chiuso. */}
      {menuOpen && (
        <div className={s.panel} id={menuId}>
          <ul className={s.panelLinks}>
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `${s.panelLink} ${isActive ? s.panelLinkActive : ''}`.trim()}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            {isAdmin && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `${s.panelLink} ${s.admin} ${isActive ? s.panelLinkActive : ''}`.trim()}
                  onClick={() => setMenuOpen(false)}
                >
                  Admin
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
