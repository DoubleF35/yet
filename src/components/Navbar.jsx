import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import Avatar from './Avatar.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import { useT } from '../lib/i18n.jsx'
import { useAuth } from '../lib/auth.jsx'

import s from './Navbar.module.css'

const LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/vetrina', label: 'Vetrina' },
  { to: '/eventi', label: 'Eventi' },
  { to: '/join', label: 'Join' },
  { to: '/contatti', label: 'Contatti' },
  { to: '/brand', label: 'Brand' },
  { to: '/sponsor', label: 'Sponsor' },
]

export default function Navbar() {
  const { user, profile, loading, isAdmin, signIn, signOutUser } = useAuth()
  const { t } = useT()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  /* La barra è trasparente sopra la foto d'apertura e diventa piena appena si
     scorre. Senza, un rettangolo nero taglia in due l'immagine proprio nel
     punto in cui dovrebbe fare impatto.
     Solo sulla home, però: le altre pagine non hanno una foto sotto, e lì una
     barra trasparente lascerebbe il logo sospeso nel vuoto. */
  const sopraLaFoto = pathname === '/home'
  const [scrolled, setScrolled] = useState(!sopraLaFoto)

  useEffect(() => {
    if (!sopraLaFoto) {
      setScrolled(true)
      return undefined
    }

    /* La soglia è una frazione dello schermo e non un numero fisso: su un
       telefono in verticale 80px sono un decimo dell'apertura, su un monitor
       largo sono niente. */
    const soglia = () => window.innerHeight * 0.12

    const onScroll = () => setScrolled(window.scrollY > soglia())
    onScroll()

    /* passive: true. Senza, il browser deve aspettare che il gestore finisca
       prima di sapere se lo scroll è stato annullato, e lo scorrimento perde
       fluidità proprio sui dispositivi più lenti. */
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [sopraLaFoto])

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

  /* Il pannello esiste solo sotto i 768px, e oltre il CSS lo nasconde. Lo
     STATO però resterebbe aperto, e con lui il blocco dello scroll qui sopra:
     bastava aprire il menu e girare il telefono in orizzontale per ritrovarsi
     la pagina ferma, senza niente da chiudere. La soglia è la stessa della
     media query in fondo al modulo: se cambia una, cambia l'altra. */
  useEffect(() => {
    if (!menuOpen) return undefined

    const desktop = window.matchMedia('(min-width: 768px)')
    if (desktop.matches) {
      setMenuOpen(false)
      return undefined
    }

    const onChange = (event) => {
      if (event.matches) setMenuOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
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

  /* I due pannelli si escludono a vicenda, e non è una finezza: si aprivano
     insieme (il click sull'avatar è "dentro" la barra, quindi non contava come
     click fuori dal panino) e il pannello del panino, che sta su un piano più
     alto, copriva il menu utente lasciando solo la pagina a vedersi in mezzo.
     Su telefono sembrava che le sezioni si sovrapponessero. */
  const toggleMenu = useCallback(() => {
    setUserOpen(false)
    setMenuOpen((open) => !open)
  }, [])

  const toggleUser = useCallback(() => {
    setMenuOpen(false)
    setUserOpen((open) => !open)
  }, [])

  const handleSignIn = useCallback(async () => {
    setSigningIn(true)
    try {
      /* Se l'accesso non riesce si porta l'utente su /join, che l'errore lo
         mostra e ha lo spazio per spiegarlo. Prima non lo faceva nessuno: chi
         premeva "Accedi" dalla barra e incappava in un popup bloccato o nel
         browser interno di un'app vedeva il bottone tornare come prima e
         NIENTE ALTRO. Da fuori si presenta come "l'accesso non funziona", che
         e' il modo piu' rapido di trasformare un messaggio mancante in una
         segnalazione. */
      const { ok, code } = await signIn()

      /* Chiudere la finestra di Google e' una decisione, non un guasto: chi ha
         appena annullato non va portato altrove. Per tutto il resto la
         spiegazione serve, e sta su /join. */
      const annullato =
        code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
      if (!ok && !annullato) navigate('/join')
    } finally {
      // Anche in caso di errore il bottone deve tornare cliccabile.
      setSigningIn(false)
    }
  }, [signIn, navigate])

  const handleSignOut = useCallback(async () => {
    setUserOpen(false)
    await signOutUser()
  }, [signOutUser])

  const linkClass = ({ isActive }) => `${s.link} ${isActive ? s.linkActive : ''}`.trim()

  return (
    <header
      className={`${s.header} ${scrolled ? s.headerSolid : s.headerClear}`}
      ref={navRef}
    >
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
                {t(link.label)}
              </NavLink>
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => `${s.link} ${s.admin} ${isActive ? s.linkActive : ''}`.trim()}>
                {t('Admin')}
              </NavLink>
            </li>
          )}
        </ul>

        {/* --- zona destra ------------------------------------------------ */}
        <div className={s.right}>
          {/* Prima dell'area utente e non dopo: chi arriva e non capisce la
              lingua deve trovarlo SUBITO, prima di dover interpretare un
              avatar o un bottone di accesso che non sa leggere. */}
          <LanguageToggle className={s.lang} />

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
                onClick={toggleUser}
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
              {signingIn ? t('Attendi…') : t('Accedi')}
            </button>
          )}

          {/* --- panino, versione mobile --------------------------------- */}
          <button
            type="button"
            className={s.burger}
            onClick={toggleMenu}
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
          {/* Copia dell'interruttore: sotto i 480px quello in barra e'
              nascosto per far posto al logo, e senza questa copia la lingua
              diventerebbe irraggiungibile proprio sui telefoni piu' piccoli. */}
          <div className={s.panelLang}>
            <LanguageToggle />
          </div>

          <ul className={s.panelLinks}>
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `${s.panelLink} ${isActive ? s.panelLinkActive : ''}`.trim()}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(link.label)}
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
