import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import HandsDivider from '../components/HandsDivider.jsx'
import { useI18n } from '../lib/i18n.jsx'

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
 *
 * L'altra 404, quella per un PERCORSO sbagliato (yetcommunity.it/qualcosa),
 * e' public/404.html: la serve GitHub Pages prima che questa app esista,
 * quindi e' autosufficiente e si traduce con quindici righe di JavaScript che
 * leggono la stessa `yet_lang` scritta dal selettore.
 */
export default function NotFound() {
  const { t } = useI18n()
  const { pathname } = useLocation()

  useEffect(() => {
    const precedente = document.title
    document.title = t('titoli.notFound')
    return () => {
      document.title = precedente
    }
  }, [t])

  return (
    <div className={`${s.page} container`}>
      <p className={s.code}>{t('notFound.codice')}</p>

      <h1 className={s.title}>{t('notFound.titolo')}</h1>

      <p className={s.lead}>{t('notFound.lead')}</p>

      {/* L'indirizzo che ha portato qui. `<code>` e non un paragrafo: e' una
          stringa tecnica da copiare, e va letta carattere per carattere. */}
      <p className={s.wrong}>
        {t('notFound.haiChiesto')} <code className={s.path}>#{pathname}</code>
      </p>

      <div className={s.actions}>
        <Link className={s.primary} to="/home">
          {t('gate.tornaHome')}
        </Link>
        <Link className={s.secondary} to="/contatti">
          {t('notFound.scrivici')}
        </Link>
      </div>

      {/* Le scorciatoie: chi e' finito qui da un link rotto molto spesso
          cercava una di queste quattro, e offrirle costa una riga. */}
      <nav className={s.altre} aria-label={t('notFound.paginePrincipali')}>
        <p className={s.altreTitolo}>{t('notFound.oppure')}</p>
        <ul className={s.altreLista}>
          {['vetrina', 'eventi', 'join', 'brand'].map((chiave) => (
            <li key={chiave}>
              <Link className={s.altroLink} to={`/${chiave}`}>
                {t(`nav.${chiave}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <HandsDivider />
    </div>
  )
}
