import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { LEGAL, legalUpdatedAt } from '../config/legal.js'
import { useI18n } from '../lib/i18n.jsx'

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
 *
 * DUE VERSIONI INTERE, NON UN CATALOGO DI STRINGHE. Le altre pagine del sito
 * prendono il testo da src/i18n; queste due no, ed è una decisione:
 *
 * - un'informativa è fatta di paragrafi con dentro <strong>, <em>, <code>,
 *   link e una tabella. Spezzarla in chiavi vorrebbe dire trenta frammenti per
 *   pagina, ricomposti nel JSX in un ordine che l'inglese non rispetta;
 * - la traduzione di un testo legale non è una sostituzione di stringhe: è un
 *   secondo testo, che va riletto per intero quando cambia il primo. Tenere i
 *   due componenti uno sotto l'altro rende visibile questo obbligo, che una
 *   chiave dimenticata in un file di catalogo nasconderebbe.
 *
 * QUINDI: se tocchi CookieIt, tocca anche CookieEn. E l'italiano è la versione
 * che fa fede, come dice la nota in cima alla versione inglese.
 */
export default function Cookie() {
  const { lang, t } = useI18n()

  useEffect(() => {
    const previous = document.title
    document.title = t('titoli.cookie')
    return () => {
      document.title = previous
    }
  }, [t])

  return lang === 'en' ? <CookieEn /> : <CookieIt />
}

/* ========================================================================= */

function CookieIt() {
  const { lang } = useI18n()

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <p className={s.eyebrow}>Informativa</p>
        <h1 className={s.title}>Cookie</h1>
        <p className={s.updated}>Ultimo aggiornamento: {legalUpdatedAt(lang)}</p>
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
            Se non fai il login, questo sito salva sul tuo dispositivo solo le due preferenze
            descritte qui sotto: la lingua che hai scelto e il promemoria dell’animazione
            iniziale. Nient’altro.
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
                    <code className={s.code}>yet_lang</code>
                  </th>
                  <td>Questo sito</td>
                  <td>
                    Ricordare se leggi il sito in italiano o in inglese, per non farti riscegliere
                    la lingua a ogni visita. Contiene <code className={s.code}>it</code> oppure{' '}
                    <code className={s.code}>en</code> e nient’altro: non identifica nessuno.
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

/* ========================================================================= */

function CookieEn() {
  const { lang } = useI18n()

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <p className={s.eyebrow}>Legal</p>
        <h1 className={s.title}>Cookies</h1>
        <p className={s.updated}>Last updated: {legalUpdatedAt(lang)}</p>

        {/* In cima e non in fondo: chi legge un testo legale deve sapere prima
            di leggerlo quale versione fa fede. */}
        <p className={s.translationNote}>
          <strong>This is a courtesy translation.</strong> The Italian version of this notice is
          the binding one: if the two ever disagree, the Italian text prevails. Switch the language
          in the top bar to read it.
        </p>

        <p className={s.lead}>
          We did not show you a banner. That is not an oversight: there are no cookies we need your
          permission for. Below is the complete list of what this site stores on your device.
        </p>
      </header>

      <div className={s.body}>
        <section className={s.section}>
          <h2 className={s.h2}>Why there is no banner</h2>
          <p className={s.p}>
            Prior consent is required for <strong>profiling</strong> cookies and for tracking tools
            that are not necessary to run the site. For <strong>technical</strong> ones, informing
            you is enough, and that is what this page is doing.
          </p>
          <p className={s.p}>There is nothing from the first category on this site:</p>
          <ul className={s.list}>
            <li>no statistics, no Google Analytics or equivalent;</li>
            <li>no advertising and no third-party cookies for advertising purposes;</li>
            <li>no social buttons that load code from other sites;</li>
            <li>no maps, no embedded videos, no external widgets;</li>
            <li>
              the typefaces are <strong>hosted on our own site</strong> and not requested from
              Google’s CDN: opening a page does not disclose your IP address to anyone.
            </li>
          </ul>
          <p className={s.p}>
            If you do not sign in, this site stores only the two preferences described below: the
            language you chose and the reminder about the opening animation. Nothing else.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>What is stored, in detail</h2>
          <p className={s.p}>
            Technically these are not even “cookies”: they are browser storage areas
            (<code className={s.code}>localStorage</code> and{' '}
            <code className={s.code}>IndexedDB</code>) that stay on your device and are not sent
            with every request. The rules are the same, though, so we list them anyway.
          </p>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Written by</th>
                  <th scope="col">What it is for</th>
                  <th scope="col">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">
                    <code className={s.code}>yet_intro_seen</code>
                  </th>
                  <td>This site</td>
                  <td>
                    Remembering that you have already seen the opening animation, so we do not play
                    it again on every visit. It contains the value{' '}
                    <code className={s.code}>1</code> and nothing else: it identifies nobody.
                  </td>
                  <td>Until you clear your browser data</td>
                </tr>
                <tr>
                  <th scope="row">
                    <code className={s.code}>yet_lang</code>
                  </th>
                  <td>This site</td>
                  <td>
                    Remembering whether you read the site in Italian or in English, so you do not
                    have to pick the language again on every visit. It contains{' '}
                    <code className={s.code}>it</code> or <code className={s.code}>en</code> and
                    nothing else: it identifies nobody.
                  </td>
                  <td>Until you clear your browser data</td>
                </tr>
                <tr>
                  <th scope="row">
                    <code className={s.code}>firebase:authUser:…</code>
                  </th>
                  <td>Google Firebase</td>
                  <td>
                    Keeping you signed in from one page to the next after you have logged in. It is
                    created <strong>only</strong> if you sign in.
                  </td>
                  <td>Until you sign out</td>
                </tr>
                <tr>
                  <th scope="row">google.com cookies</th>
                  <td>Google</td>
                  <td>
                    During sign-in, the Google window uses its own cookies to recognise your
                    account. They belong to Google, they live on Google’s domain, and Google
                    manages them under its own privacy notice.
                  </td>
                  <td>Set by Google</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={s.tableHint}>The table scrolls horizontally.</p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>How to delete them</h2>
          <p className={s.p}>
            The simplest way to clear the Firebase ones is to <strong>sign out</strong>: the menu at
            the top right, “Sign out”.
          </p>
          <p className={s.p}>
            To remove everything, site preferences included, use your browser’s function for
            clearing website data (usually: Settings → Privacy → Clear browsing data) and pick this
            domain. You can also block cookies entirely from your browser settings: the site keeps
            working, but you will not be able to sign in and you will see the opening animation on
            every visit.
          </p>
          <p className={s.p}>
            One useful detail: if you want to <em>watch the opening animation again</em>, all you
            have to do is delete <code className={s.code}>yet_intro_seen</code>.
          </p>
        </section>

        <section className={s.section}>
          <h2 className={s.h2}>Everything else</h2>
          <p className={s.p}>
            Which data we collect, why, for how long and how to have it deleted is in the{' '}
            <Link className={s.link} to="/privacy">
              privacy notice
            </Link>
            .
          </p>
          <p className={s.p}>
            For any question:{' '}
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
