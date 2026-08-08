import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Riporta in cima a ogni cambio di rotta.
 *
 * Serve perché con un router client-side il browser non tocca lo scroll: chi
 * clicca "Membri" stando in fondo alla Home si ritrova a metà della pagina
 * nuova, e sembra che manchi del contenuto.
 *
 * Non renderizza niente: sta in App.jsx accanto alle Routes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    /* Chi ha chiesto meno movimento non vuole vedere mezza pagina sfilare via:
       per lui il salto è istantaneo. Per tutti gli altri lo scorrimento
       morbido rende evidente che è cambiata la pagina, non solo il contenuto. */
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'auto' : 'smooth' })
  }, [pathname])

  return null
}
