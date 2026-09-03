import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import HandsDivider from '../components/HandsDivider.jsx'
import { useT } from '../lib/i18n.jsx'

import s from './NotFound.module.css'

/**
 * La pagina per una rotta che non esiste, tipo /#/qualcosa-di-sbagliato.
 *
 * PERCHE' NON E' PIU' UN REDIRECT. Prima la rotta `*` mandava alla home con
 * `<Navigate replace />`, e sembrava una scelta gentile: l'utente finisce
 * comunque in un posto buono. In realta' fa danno in tre modi.
 *
 *  1. Chi ha cliccato un link rotto non sa di averlo fatto. Vede la home e
 *     pensa che il link portasse li', quindi non segnala niente e chi ha
 *     scritto il link non lo corregge mai.
 *  2. Con `replace` l'indirizzo sbagliato scompare dalla cronologia, quindi
 *     non si puo' nemmeno tornare indietro a copiarlo per capire cos'era.
 *  3. Un indirizzo inesistente che risponde con una pagina buona e' un "soft
 *     404": per un motore di ricerca vuol dire che qualunque cosa inventata
 *     esiste, e nel tempo diluisce l'indicizzazione delle pagine vere.
 *
 * Mostrare l'indirizzo sbagliato serve a chi lo ha ricevuto per capire cosa
 * chiedere, e a chi lo legge in una segnalazione per correggerlo.
 */
export default function NotFound() {
  const { t, isEn } = useT()
  const { pathname } = useLocation()

  useEffect(() => {
    const precedente = document.title
    document.title = isEn ? 'Page not found · YET' : 'Pagina non trovata · YET'
    return () => {
      document.title = precedente
    }
  }, [isEn])

  return (
    <div className={`${s.page} container`}>
      <p className={s.code}>{isEn ? 'Error 404' : 'Errore 404'}</p>

      <h1 className={s.title}>
        {isEn ? 'This page doesn’t exist.' : 'Questa pagina non esiste.'}
      </h1>

      <p className={s.lead}>
        {isEn
          ? 'The link may be old, or there’s a typo in the address. The rest of the site works fine: head back from here.'
          : 'Forse il link era vecchio, o c’è un errore di battitura nell’indirizzo. Il resto del sito funziona: da qui torni a casa.'}
      </p>

      {/* L'indirizzo che ha portato qui. `<code>` e non un paragrafo: e' una
          stringa tecnica da copiare, e va letta carattere per carattere. */}
      <p className={s.wrong}>
        {isEn ? 'You asked for' : 'Hai chiesto'} <code className={s.path}>#{pathname}</code>
      </p>

      <div className={s.actions}>
        <Link className={s.primary} to="/home">
          {isEn ? 'Back to the homepage' : 'Torna alla home'}
        </Link>
        <Link className={s.secondary} to="/contatti">
          {isEn ? 'Get in touch' : 'Scrivici'}
        </Link>
      </div>

      {/* Le scorciatoie: chi e' finito qui da un link rotto molto spesso
          cercava una di queste quattro, e offrirle costa una riga. */}
      <nav className={s.altre} aria-label={isEn ? 'Main pages' : 'Pagine principali'}>
        <p className={s.altreTitolo}>{isEn ? 'Or go straight to' : 'Oppure vai diretto a'}</p>
        <ul className={s.altreLista}>
          {[
            { to: '/vetrina', label: t('Vetrina') },
            { to: '/eventi', label: t('Eventi') },
            { to: '/join', label: t('Join') },
            { to: '/brand', label: t('Brand') },
          ].map((v) => (
            <li key={v.to}>
              <Link className={s.altroLink} to={v.to}>
                {v.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <HandsDivider />
    </div>
  )
}
