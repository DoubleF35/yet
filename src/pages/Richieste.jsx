import { Link } from 'react-router-dom'

import PendingRequests from '../components/PendingRequests.jsx'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Richieste.module.css'

/**
 * SOLO LE RICHIESTE DI ISCRIZIONE.
 *
 * Nasce da una cosa detta da Greta, che il sito vecchio lo aveva fatto lei:
 * del pannello di prima si trovava bene perche' faceva una cosa sola. Qui
 * /admin fa cinque cose (notizie, incontri, sponsor, profili, richieste) ed e'
 * una pagina lunghissima in cui le richieste sono un pezzo in mezzo.
 *
 * Quindi: stesso componente, stessi dati, stessi permessi, ma da solo.
 * Non e' una copia del pannello, e' lo stesso componente montato su un
 * indirizzo suo. Se un domani cambia come si approva qualcuno, cambia in un
 * posto solo e tutte e due le pagine lo seguono.
 *
 * SULLE MAIL. Il sito vecchio mandava una mail a ogni nuova candidatura: usava
 * Resend da dentro un server Next.js. Qui un server non c'e', il sito e' fatto
 * di file statici, e una chiave di posta messa nel sito la leggerebbe chiunque
 * apra il codice. Finche' resta cosi', questa pagina E' la notifica: si apre e
 * si vede quante ce ne sono. Il README spiega cosa servirebbe per riaverle.
 */
export default function Richieste() {
  const { t } = useI18n()

  return (
    <main className={`${s.pagina} container`}>
      <p className={s.ritorno}>
        <Link className={s.link} to="/admin">
          {t('richiestePagina.tornaAlPannello')}
        </Link>
      </p>

      <h1 className={s.titolo}>{t('richiestePagina.titolo')}</h1>
      <p className={s.intro}>{t('richiestePagina.intro')}</p>

      {/* Niente mail automatiche senza un server: detto qui e non nascosto nel
          README, perche' chi apre questa pagina e' esattamente la persona che
          si sta chiedendo perche' non gli e' arrivato niente. */}
      <p className={s.nota}>{t('richiestePagina.nota')}</p>

      {isFirebaseConfigured ? (
        <PendingRequests />
      ) : (
        <p className={s.nota}>{t('richiestePagina.spento')}</p>
      )}
    </main>
  )
}
