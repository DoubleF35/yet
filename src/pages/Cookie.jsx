import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { LEGAL, legalUpdatedAt } from '../config/legal.js'

import s from './Legal.module.css'

/**
 * Informativa cookie.
 *
 * Il punto di questa pagina è che qui NON c'è un banner, e va spiegato perché
 * invece di lasciar pensare che ce lo siamo dimenticato.
 *
 * In breve: le linee guida del Garante (giugno 2021) impongono il consenso
 * preventivo solo per i cookie di profilazione e per gli strumenti di
 * tracciamento non necessari. Per quelli tecnici basta l'informativa. Qui non
 * esiste nulla della prima categoria: niente analytics, niente pubblicità,
 * niente widget di terzi, e i font sono serviti dal nostro dominio. Quindi
 * informativa sì, banner no.
 *
 * ATTENZIONE PER IL FUTURO: se aggiungi Google Analytics, un pixel, una mappa
 * incorporata o un player YouTube, questo ragionamento cade e il banner con
 * consenso preventivo diventa obbligatorio.
 */
export default function Cookie() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Cookie · YET'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <p className={s.eyebrow}>Informativa</p>
        <h1 className={s.title}>Cookie</h1>
        <p className={s.updated}>Ultimo aggiornamento: {legalUpdatedAt()}</p>
        <p className={s.lead}>
          Non ti abbiamo mostrato nessun banner. Non è una dimenticanza: non ci sono cookie per cui
          chiederti il permesso. Qui c’è l’elenco completo di quello che questo sito salva sul tuo
          dispositivo.
        </p>
      </header>

      <div className={s.body}>
        <section className={s.section}>
          <h2 className={s.h2}>Perché non c’è il banner</h2>
          <p className={s.p}>
            Il consenso preventivo serve per i cookie di <strong>profilazione</strong> e per gli
            strumenti di tracciamento non necessari al funzionamento del sito. Per quelli{' '}
            <strong>tecnici</strong> è sufficiente informare, ed è quello che sta facendo questa
            pagina.
          </p>
          <p className={s.p}>Su questo sito non c’è nulla della prima categoria:</p>
          <ul className={s.list}>
            <li>nessuna statistica, nessun Google Analytics o equivalente;</li>
            <li>nessuna pubblicità e nessun cookie di terze parti a scopo pubblicitario;</li>
            <li>nessun pulsante social che carica codice da altri siti;</li>
            <li>nessuna mappa, nessun video incorporato, nessun widget esterno;</li>
            <li>
              i caratteri tipografici sono <strong>ospitati sul nostro sito</strong> e non chiesti
              al CDN di Google: aprire una pagina non comunica il tuo indirizzo IP a nessuno.
            </li>
          </ul>
          <p className={s.p}>
            Se non fai il login, questo sito non salva <strong>niente</strong> sul tuo dispositivo,
            a parte il promemoria dell’animazione iniziale descritto qui sotto.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Cosa viene salvato, nel dettaglio</h2>
          <p className={s.p}>
            Tecnicamente non sono nemmeno «cookie»: sono spazi di memoria del browser
            (<code className={s.code}>localStorage</code> e <code className={s.code}>IndexedDB</code>
            ), che restano sul tuo dispositivo e non vengono inviati a ogni richiesta. Le regole,
            però, sono le stesse, quindi te li elenchiamo comunque.
          </p>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Chi lo scrive</th>
                  <th scope="col">A cosa serve</th>
                  <th scope="col">Durata</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    <code className={s.code}>yet_intro_seen</code>
                  </th>
                  <td>Questo sito</td>
                  <td>
                    Ricordare che hai già visto l’animazione di apertura, per non riproportela a
                    ogni visita. Contiene il valore <code className={s.code}>1</code> e nient’altro:
                    non identifica nessuno.
                  </td>
                  <td>Finché non svuoti i dati del browser</td>
                </tr>
                <tr>
                  <th scope="row">
                    <code className={s.code}>firebase:authUser:…</code>
                  </th>
                  <td>Google Firebase</td>
                  <td>
                    Tenerti collegato fra una pagina e l’altra dopo che hai fatto il login. Viene
                    creato <strong>solo</strong> se accedi.
                  </td>
                  <td>Fino al logout</td>
                </tr>
                <tr>
                  <th scope="row">Cookie di google.com</th>
                  <td>Google</td>
                  <td>
                    Durante il login, la finestra di Google usa i propri cookie per riconoscere il
                    tuo account. Sono di Google, sul dominio di Google, e li gestisce Google secondo
                    la propria informativa.
                  </td>
                  <td>Stabilita da Google</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={s.tableHint}>La tabella scorre in orizzontale.</p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Come cancellarli</h2>
          <p className={s.p}>
            Il modo più semplice per quelli di Firebase è <strong>uscire dall’account</strong>: il
            menu in alto a destra, «Esci».
          </p>
          <p className={s.p}>
            Per togliere tutto, comprese le preferenze del sito, usa la funzione del tuo browser per
            cancellare i dati dei siti web (di solito: Impostazioni → Privacy → Cancella dati di
            navigazione), scegliendo questo dominio. Puoi anche bloccare del tutto i cookie dalle
            impostazioni del browser: il sito continua a funzionare, ma non potrai fare il login e
            rivedrai l’animazione di apertura a ogni visita.
          </p>
          <p className={s.p}>
            Piccola curiosità utile: se vuoi <em>rivedere</em> l’animazione iniziale, ti basta
            cancellare <code className={s.code}>yet_intro_seen</code>.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Il resto</h2>
          <p className={s.p}>
            Quali dati raccogliamo, perché, per quanto tempo e come farli cancellare sta nell’
            <Link className={s.link} to="/privacy">
              informativa privacy
            </Link>
            .
          </p>
          <p className={s.p}>
            Per qualsiasi domanda:{' '}
            <a className={s.link} href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
