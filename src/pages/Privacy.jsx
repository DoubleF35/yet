import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { LEGAL, legalUpdatedAt } from '../config/legal.js'
import { COMMUNITY } from '../config/socials.js'

import s from './Legal.module.css'

/**
 * Informativa privacy (art. 13 GDPR).
 *
 * Descrive quello che il codice fa davvero — non un modello copiato. Se un
 * domani aggiungi un servizio (analytics, newsletter, un embed di YouTube),
 * questa pagina va aggiornata insieme al codice, non dopo.
 */
export default function Privacy() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Privacy — YET'
    return () => {
      document.title = previous
    }
  }, [])

  const ownerIncomplete = LEGAL.ownerName.startsWith('YET —')

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <p className={s.eyebrow}>Informativa</p>
        <h1 className={s.title}>Privacy</h1>
        <p className={s.updated}>Ultimo aggiornamento: {legalUpdatedAt()}</p>
        <p className={s.lead}>
          Cosa raccoglie questo sito, perché, per quanto tempo e come farlo smettere. In italiano
          leggibile: se qualcosa non è chiaro, scrivici e lo riscriviamo.
        </p>
      </header>

      <div className={s.body}>
        {ownerIncomplete && (
          <div className={s.todo}>
            <p className={s.todoTitle}>Da completare prima di pubblicare</p>
            <p className={s.todoText}>
              Il titolare del trattamento in <code className={s.code}>src/config/legal.js</code> è
              ancora il segnaposto. Va indicato chi si assume la responsabilità dei dati — l’
              associazione, se costituita, altrimenti una persona fisica con nome e cognome. Questo
              riquadro sparisce da solo quando il campo è compilato.
            </p>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Chi tratta i tuoi dati</h2>
          <p className={s.p}>
            Il titolare del trattamento è <strong>{LEGAL.ownerName}</strong>
            {LEGAL.ownerAddress ? `, ${LEGAL.ownerAddress}` : ''}
            {LEGAL.ownerVat ? ` (P. IVA / C.F. ${LEGAL.ownerVat})` : ''}.
          </p>
          <p className={s.p}>
            Per qualsiasi cosa riguardi i tuoi dati, compreso l’esercizio dei diritti elencati più
            sotto, scrivi a{' '}
            <a className={s.link} href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>
            . Rispondiamo entro un mese, come previsto dal Regolamento.
          </p>
          <p className={s.p}>
            Non abbiamo nominato un Responsabile della protezione dei dati (DPO): non rientriamo nei
            casi in cui è obbligatorio.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Se navighi e basta, non raccogliamo niente</h2>
          <p className={s.p}>
            Le pagine pubbliche — home, membri, contatti — non richiedono alcun account e non
            attivano nessuna statistica. Non usiamo Google Analytics né strumenti equivalenti. Non
            c’è alcun cookie di profilazione e non c’è alcuna pubblicità.
          </p>
          <p className={s.p}>
            Anche i caratteri tipografici sono serviti dal nostro stesso sito e non dal CDN di
            Google: aprire questa pagina non comunica il tuo indirizzo IP a terzi. È il motivo per
            cui non trovi un banner che ti chiede il consenso — non c’è nulla per cui chiederlo.
            I dettagli sono nella <Link className={s.link} to="/cookie">pagina sui cookie</Link>.
          </p>
          <p className={s.p}>
            Quel poco che resta: il sito è ospitato su <strong>GitHub Pages</strong>, e come ogni
            server web GitHub registra le richieste ricevute (indirizzo IP, pagina, orario) per
            motivi tecnici e di sicurezza. Quei registri sono di GitHub e noi non vi accediamo.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Se accedi con Google</h2>
          <p className={s.p}>
            Il login serve a una cosa sola: comparire nell’elenco dei membri. È una scelta tua e
            puoi usare il sito senza.
          </p>

          <h3 className={s.h3}>Cosa riceviamo da Google</h3>
          <p className={s.p}>
            Quando premi «Accedi con Google», Google ci comunica il tuo <strong>nome</strong>, il
            tuo <strong>indirizzo email</strong>, la tua <strong>immagine del profilo</strong> e un
            identificativo tecnico dell’account. Non riceviamo la password, né i contatti, né altro
            del tuo account Google.
          </p>

          <h3 className={s.h3}>Cosa scrivi tu</h3>
          <p className={s.p}>
            Nella pagina Join puoi aggiungere una <strong>biografia</strong> (fino a 300 caratteri),
            un <strong>link a una tua foto</strong> e i tuoi <strong>profili social</strong>.
            Sono campi facoltativi.
          </p>

          <h3 className={s.h3}>L’iscrizione passa da un’approvazione</h3>
          <p className={s.p}>
            Quando crei il profilo, la richiesta arriva agli organizzatori e resta in attesa. Fino a
            quel momento il tuo profilo è visibile <strong>solo a te e a loro</strong>: non compare
            fra i membri e non lo vede nessun altro. Se la richiesta non viene approvata, i tuoi
            dati restano privati allo stesso modo — e puoi cancellarli quando vuoi.
          </p>
          <p className={s.p}>
            Il profilo porta anche due informazioni tecniche che non scrivi tu: lo{' '}
            <strong>stato della richiesta</strong> (in attesa, approvata, non approvata) e un{' '}
            <strong>ruolo</strong> che dice se sei fra gli organizzatori. Servono a far funzionare
            l’approvazione e la sezione «Chi organizza» della pagina Membri.
          </p>

          <h3 className={s.h3}>Cosa diventa pubblico</h3>
          <p className={s.p}>
            Una volta approvato, nome, foto, bio e link social sono{' '}
            <strong>visibili a chiunque</strong> visiti la pagina Membri, anche senza account. È lo
            scopo della pagina. Il tuo <strong>indirizzo email non viene mai mostrato</strong> sul
            sito e non compare fra i dati pubblicati — nemmeno per gli organizzatori, che nella
            lista delle richieste vedono il nome e la presentazione, non l’indirizzo.
          </p>
          <p className={s.p}>
            Detto onestamente: scrivi nella bio solo cose che ti va di rendere pubbliche su
            internet, indicizzabili dai motori di ricerca.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Perché possiamo farlo, e per quanto</h2>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Dati</th>
                  <th scope="col">Perché</th>
                  <th scope="col">Base giuridica</th>
                  <th scope="col">Per quanto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Nome, foto, bio, link social</th>
                  <td>Mostrarti nell’elenco dei membri</td>
                  <td>Consenso (art. 6.1.a), che dai creando il profilo</td>
                  <td>Finché non cancelli il profilo</td>
                </tr>
                <tr>
                  <th scope="row">Indirizzo email</th>
                  <td>Riconoscerti all’accesso e distinguere gli amministratori</td>
                  <td>Esecuzione del servizio richiesto (art. 6.1.b)</td>
                  <td>Finché non cancelli l’account</td>
                </tr>
                <tr>
                  <th scope="row">Stato della richiesta e ruolo</th>
                  <td>Gestire l’approvazione delle iscrizioni ed evitare profili falsi</td>
                  <td>Interesse legittimo (art. 6.1.f)</td>
                  <td>Finché non cancelli il profilo</td>
                </tr>
                <tr>
                  <th scope="row">Testo delle notizie</th>
                  <td>Pubblicare gli avvisi della community</td>
                  <td>Interesse legittimo (art. 6.1.f)</td>
                  <td>Finché la notizia resta sul sito</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={s.tableHint}>La tabella scorre in orizzontale.</p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Dove finiscono i dati</h2>
          <p className={s.p}>
            Usiamo <strong>Google Firebase</strong> (Authentication e Firestore) per l’accesso e per
            conservare i profili, e <strong>GitHub Pages</strong> per servire il sito. Sono i nostri
            responsabili del trattamento: trattano i dati per conto nostro e secondo le nostre
            istruzioni.
          </p>
          <p className={s.p}>
            Il database è configurato nella regione europea, ma entrambe le società fanno capo agli
            Stati Uniti e un trasferimento fuori dallo Spazio economico europeo non è escluso. Ove
            avvenga, si appoggia alle clausole contrattuali tipo approvate dalla Commissione europea
            e al <em>Data Privacy Framework</em> UE-USA, a cui entrambe aderiscono.
          </p>
          <p className={s.p}>
            Non vendiamo i tuoi dati, non li cediamo a terzi per finalità di marketing e non
            facciamo profilazione.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Cancellare tutto, subito</h2>
          <p className={s.p}>
            Non serve chiedercelo e non serve aspettare una risposta:{' '}
            <Link className={s.link} to="/join">
              vai alla pagina Join
            </Link>
            , accedi e usa «Cancella il mio profilo». Rimuove il tuo profilo dall’elenco dei membri
            e il tuo account di accesso. È immediato e definitivo.
          </p>
          <p className={s.p}>
            Se preferisci, scrivi a{' '}
            <a className={s.link} href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>{' '}
            e lo facciamo noi.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Gli altri tuoi diritti</h2>
          <p className={s.p}>
            Oltre alla cancellazione, il Regolamento (artt. 15-22) ti riconosce il diritto di:
          </p>
          <ul className={s.list}>
            <li>
              <strong>sapere</strong> quali dati abbiamo e ottenerne una copia;
            </li>
            <li>
              <strong>correggerli</strong> se sono sbagliati — per nome, bio, foto e link puoi farlo
              da solo dalla pagina Join, in qualsiasi momento;
            </li>
            <li>
              <strong>limitarne</strong> l’uso o <strong>opporti</strong> al trattamento;
            </li>
            <li>
              <strong>portarli via</strong> in un formato leggibile da una macchina;
            </li>
            <li>
              <strong>revocare il consenso</strong> quando vuoi, senza che questo tolga validità a
              quanto fatto prima.
            </li>
          </ul>
          <p className={s.p}>
            Se pensi che stiamo trattando i tuoi dati in modo scorretto puoi rivolgerti al{' '}
            <a
              className={s.link}
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noopener noreferrer"
            >
              Garante per la protezione dei dati personali
            </a>
            <span className="sr-only"> (si apre in una nuova scheda)</span>. Ci farebbe piacere che
            provassi prima a scriverci, ma è un tuo diritto e non serve il nostro permesso.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Chi ha meno di 18 anni</h2>
          <p className={s.p}>
            {COMMUNITY.name} si rivolge anche ai minorenni: si entra dai {COMMUNITY.ageRange} anni.
            In Italia un minore può acconsentire da solo al trattamento dei propri dati per i
            servizi online <strong>a partire dai 14 anni</strong> (art. 2-<em>quinquies</em> del
            Codice privacy). Sotto quella soglia serve il consenso di chi esercita la
            responsabilità genitoriale — ed è il motivo per cui l’età minima della community
            coincide con quella soglia.
          </p>
          <p className={s.p}>
            Se sei un genitore e vuoi che rimuoviamo il profilo di tuo figlio, scrivi a{' '}
            <a className={s.link} href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>
            : lo togliamo senza discutere.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Se questa informativa cambia</h2>
          <p className={s.p}>
            La data in cima dice da quando vale la versione che stai leggendo. Se cambierà qualcosa
            di sostanziale — un servizio nuovo, una finalità nuova — lo scriveremo qui e, se serve,
            ti chiederemo di nuovo il consenso.
          </p>
        </section>
      </div>
    </div>
  )
}
