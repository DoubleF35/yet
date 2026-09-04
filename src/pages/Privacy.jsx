import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { LEGAL, legalUpdatedAt } from '../config/legal.js'
import { COMMUNITY } from '../config/socials.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Legal.module.css'

/**
 * Informativa privacy (art. 13 GDPR).
 *
 * Descrive quello che il codice fa davvero, non un modello copiato. Se un
 * domani aggiungi un servizio (analytics, newsletter, un embed di YouTube),
 * questa pagina va aggiornata insieme al codice, non dopo.
 *
 * DUE VERSIONI INTERE, NON UN CATALOGO DI STRINGHE: il perché sta scritto per
 * esteso in cima a Cookie.jsx, e vale identico qui. In breve: un testo legale
 * è fatto di paragrafi con markup dentro, e la sua traduzione è un secondo
 * testo da rileggere per intero quando cambia il primo, non una sostituzione
 * di stringhe.
 *
 * QUINDI: se tocchi PrivacyIt, tocca anche PrivacyEn. L'italiano fa fede.
 */
export default function Privacy() {
  const { lang, t } = useI18n()

  useEffect(() => {
    const previous = document.title
    document.title = t('titoli.privacy')
    return () => {
      document.title = previous
    }
  }, [t])

  return lang === 'en' ? <PrivacyEn /> : <PrivacyIt />
}

/* ========================================================================= */

function PrivacyIt() {
  const { lang, t } = useI18n()

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <p className={s.eyebrow}>Informativa</p>
        <h1 className={s.title}>Privacy</h1>
        <p className={s.updated}>Ultimo aggiornamento: {legalUpdatedAt(lang)}</p>
        <p className={s.lead}>
          Cosa raccoglie questo sito, perché, per quanto tempo e come farlo smettere. In italiano
          leggibile: se qualcosa non è chiaro, scrivici e lo riscriviamo.
        </p>
      </header>

      <div className={s.body}>
        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Chi tratta i tuoi dati</h2>
          <p className={s.p}>
            Questo sito è gestito da <strong>{LEGAL.ownerName}</strong>, {LEGAL.ownerCity}.
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
            Siamo una community informale di ragazzi, non un'azienda: non abbiamo un ufficio
            legale né un Responsabile della protezione dei dati, e non rientriamo nei casi in cui
            sarebbe obbligatorio averlo. Se qualcosa in questa pagina non ti torna, scrivici e ne
            parliamo.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Se navighi e basta, non raccogliamo niente</h2>
          <p className={s.p}>
            Le pagine pubbliche (home, membri, contatti) non richiedono alcun account e non
            attivano nessuna statistica. Non usiamo Google Analytics né strumenti equivalenti. Non
            c’è alcun cookie di profilazione e non c’è alcuna pubblicità.
          </p>
          <p className={s.p}>
            Anche i caratteri tipografici sono serviti dal nostro stesso sito e non dal CDN di
            Google: aprire questa pagina non comunica il tuo indirizzo IP a terzi. È il motivo per
            cui non trovi un banner che ti chiede il consenso, non c’è nulla per cui chiederlo.
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
            Nella pagina Join puoi aggiungere una <strong>presentazione</strong> (fino a 2500
            caratteri), la <strong>città o la zona</strong> da cui scrivi, tre campi facoltativi su{' '}
            <strong>cosa stai costruendo, cosa cerchi e cosa sai fare</strong>, i tuoi{' '}
            <strong>profili social</strong> e una <strong>foto</strong>, che puoi caricare dal
            dispositivo oppure indicare con un link. La foto caricata viene rimpicciolita dal
            browser e salvata dentro il tuo profilo: non finisce su nessun altro servizio. Sono
            tutti campi facoltativi.
          </p>

          <h3 className={s.h3}>L’iscrizione passa da un’approvazione</h3>
          <p className={s.p}>
            Quando crei il profilo, la richiesta arriva agli organizzatori e resta in attesa. Fino a
            quel momento il tuo profilo è visibile <strong>solo a te e a loro</strong>: non compare
            fra i membri e non lo vede nessun altro. Se la richiesta non viene approvata, i tuoi
            dati restano privati allo stesso modo, e puoi cancellarli quando vuoi.
          </p>
          <p className={s.p}>
            Il profilo porta anche due informazioni tecniche che non scrivi tu: lo{' '}
            <strong>stato della richiesta</strong> (in attesa, approvata, non approvata) e un{' '}
            <strong>ruolo</strong> che dice se sei fra gli organizzatori. Servono a far funzionare
            l’approvazione e la sezione «Chi organizza» della pagina Membri.
          </p>

          <h3 className={s.h3}>Cosa diventa pubblico</h3>
          <p className={s.p}>
            Una volta approvato, nome, foto, presentazione, i tre campi su cosa fai e i link social
            sono <strong>visibili a chiunque</strong> visiti la pagina Membri, anche senza account.
            È lo scopo della pagina. Il tuo{' '}
            <strong>indirizzo email non viene mai mostrato</strong> sul sito e non compare fra i
            dati pubblicati, nemmeno per gli organizzatori, che nella lista delle richieste vedono
            il nome e la presentazione, non l’indirizzo.
          </p>
          <p className={s.p}>
            Detto onestamente: scrivi nella presentazione solo cose che ti va di rendere pubbliche
            su internet, indicizzabili dai motori di ricerca.
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
                  <th scope="row">Nome, foto, presentazione, link social</th>
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
              <strong>correggerli</strong> se sono sbagliati, per nome, presentazione, foto e link
              puoi farlo da solo dalla pagina Join, in qualsiasi momento;
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
            {COMMUNITY.name} si rivolge anche ai minorenni: si entra dai{' '}
            {t('community.fasciaEta')} anni.
          </p>
          <p className={s.p}>
            In Italia un minore può acconsentire da solo al trattamento dei propri dati per i
            servizi online <strong>a partire dai 14 anni</strong> (art. 2-<em>quinquies</em> del
            Codice privacy). L’età minima della community è più alta di quella soglia, quindi
            chiunque possa iscriversi qui è già nelle condizioni di decidere da sé: non chiediamo
            il consenso di un genitore perché la legge non lo richiede in questo caso.
          </p>
          <p className={s.p}>
            Resta comunque vero che sei minorenne, e che quello che scrivi nella presentazione
            diventa pubblico. Se sei un genitore e vuoi che rimuoviamo il profilo di tuo figlio,
            scrivi a{' '}
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
            di sostanziale, un servizio nuovo, una finalità nuova, lo scriveremo qui e, se serve,
            ti chiederemo di nuovo il consenso.
          </p>
        </section>
      </div>
    </div>
  )
}

/* ========================================================================= */

function PrivacyEn() {
  const { lang, t } = useI18n()

  return (
    <div className={`${s.page} container`}>
      <header className={s.head}>
        <p className={s.eyebrow}>Legal</p>
        <h1 className={s.title}>Privacy</h1>
        <p className={s.updated}>Last updated: {legalUpdatedAt(lang)}</p>

        <p className={s.translationNote}>
          <strong>This is a courtesy translation.</strong> The Italian version of this notice is
          the binding one: if the two ever disagree, the Italian text prevails. Switch the language
          in the top bar to read it.
        </p>

        <p className={s.lead}>
          What this site collects, why, for how long, and how to make it stop. In plain English: if
          anything here is unclear, write to us and we will rewrite it.
        </p>
      </header>

      <div className={s.body}>
        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Who processes your data</h2>
          <p className={s.p}>
            This site is run by <strong>{LEGAL.ownerName}</strong>, {LEGAL.ownerCity}, Italy.
          </p>
          <p className={s.p}>
            For anything concerning your data, including exercising the rights listed below, write
            to{' '}
            <a className={s.link} href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>
            . We answer within one month, as the Regulation requires.
          </p>
          <p className={s.p}>
            We are an informal community of young people, not a company: we have no legal
            department and no Data Protection Officer, and we do not fall into the cases where
            having one would be mandatory. If something on this page does not add up, write to us
            and we will talk about it.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>If you only browse, we collect nothing</h2>
          <p className={s.p}>
            The public pages (home, members, contact) require no account and switch on no
            analytics. We do not use Google Analytics or anything equivalent. There is no profiling
            cookie and there is no advertising.
          </p>
          <p className={s.p}>
            The typefaces too are served from our own site and not from Google’s CDN: opening this
            page does not disclose your IP address to third parties. That is why you will not find
            a banner asking for your consent — there is nothing to ask consent for. The details are
            in the <Link className={s.link} to="/cookie">cookies page</Link>.
          </p>
          <p className={s.p}>
            The little that remains: the site is hosted on <strong>GitHub Pages</strong>, and like
            every web server GitHub logs the requests it receives (IP address, page, timestamp) for
            technical and security reasons. Those logs belong to GitHub and we do not access them.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>If you sign in with Google</h2>
          <p className={s.p}>
            Signing in serves one purpose only: appearing in the members list. It is your choice,
            and you can use the site without it.
          </p>

          <h3 className={s.h3}>What we receive from Google</h3>
          <p className={s.p}>
            When you press “Sign in with Google”, Google passes us your <strong>name</strong>, your{' '}
            <strong>email address</strong>, your <strong>profile picture</strong> and a technical
            identifier of the account. We do not receive your password, your contacts, or anything
            else from your Google account.
          </p>

          <h3 className={s.h3}>What you write yourself</h3>
          <p className={s.p}>
            On the Join page you can add an <strong>introduction</strong> (up to 2500 characters),
            the <strong>city or area</strong> you write from, three optional fields about{' '}
            <strong>what you are building, what you are looking for and what you can do</strong>,
            your <strong>social profiles</strong> and a <strong>photo</strong>, which you can
            either upload from your device or point to with a link. An uploaded photo is shrunk by
            your browser and stored inside your profile: it does not end up on any other service.
            All of these fields are optional.
          </p>

          <h3 className={s.h3}>Joining goes through an approval</h3>
          <p className={s.p}>
            When you create your profile, the request reaches the organisers and stays pending.
            Until then your profile is visible <strong>only to you and to them</strong>: it does
            not appear among the members and nobody else can see it. If the request is not
            approved, your data stays private in the same way, and you can delete it whenever you
            like.
          </p>
          <p className={s.p}>
            The profile also carries two technical pieces of information you do not write: the{' '}
            <strong>status of the request</strong> (pending, approved, not approved) and a{' '}
            <strong>role</strong> saying whether you are one of the organisers. They make the
            approval flow and the “Who runs it” section of the members page work.
          </p>

          <h3 className={s.h3}>What becomes public</h3>
          <p className={s.p}>
            Once approved, your name, photo, introduction, the three fields about what you do and
            your social links are <strong>visible to anyone</strong> who visits the members page,
            even without an account. That is the purpose of the page. Your{' '}
            <strong>email address is never shown</strong> on the site and is not part of the
            published data — not even for the organisers, who see the name and the introduction in
            the list of requests, not the address.
          </p>
          <p className={s.p}>
            Honestly: only write in your introduction things you are happy to make public on the
            internet, indexable by search engines.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Why we may do this, and for how long</h2>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Why</th>
                  <th scope="col">Legal basis</th>
                  <th scope="col">For how long</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Name, photo, introduction, social links</th>
                  <td>Showing you in the members list</td>
                  <td>Consent (art. 6.1.a), given by creating the profile</td>
                  <td>Until you delete the profile</td>
                </tr>
                <tr>
                  <th scope="row">Email address</th>
                  <td>Recognising you at sign-in and telling administrators apart</td>
                  <td>Performance of the requested service (art. 6.1.b)</td>
                  <td>Until you delete the account</td>
                </tr>
                <tr>
                  <th scope="row">Request status and role</th>
                  <td>Running the approval of new members and keeping fake profiles out</td>
                  <td>Legitimate interest (art. 6.1.f)</td>
                  <td>Until you delete the profile</td>
                </tr>
                <tr>
                  <th scope="row">Text of the news items</th>
                  <td>Publishing the community announcements</td>
                  <td>Legitimate interest (art. 6.1.f)</td>
                  <td>As long as the item stays on the site</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={s.tableHint}>The table scrolls horizontally.</p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Where the data ends up</h2>
          <p className={s.p}>
            We use <strong>Google Firebase</strong> (Authentication and Firestore) for signing in
            and for storing the profiles, and <strong>GitHub Pages</strong> to serve the site. They
            are our data processors: they process the data on our behalf and under our
            instructions.
          </p>
          <p className={s.p}>
            The database is configured in the European region, but both companies are ultimately
            US-based and a transfer outside the European Economic Area cannot be ruled out. Where
            it happens, it relies on the standard contractual clauses approved by the European
            Commission and on the EU-US <em>Data Privacy Framework</em>, which both companies
            adhere to.
          </p>
          <p className={s.p}>
            We do not sell your data, we do not pass it to third parties for marketing purposes,
            and we do no profiling.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Deleting everything, right now</h2>
          <p className={s.p}>
            You do not need to ask us and you do not need to wait for an answer:{' '}
            <Link className={s.link} to="/join">
              go to the Join page
            </Link>
            , sign in and use “Delete my profile”. It removes your profile from the members list
            and your sign-in account. It is immediate and permanent.
          </p>
          <p className={s.p}>
            If you prefer, write to{' '}
            <a className={s.link} href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>{' '}
            and we will do it for you.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>Your other rights</h2>
          <p className={s.p}>
            Besides deletion, the Regulation (artt. 15-22) gives you the right to:
          </p>
          <ul className={s.list}>
            <li>
              <strong>know</strong> which data we hold and obtain a copy of it;
            </li>
            <li>
              <strong>correct it</strong> if it is wrong — for name, introduction, photo and links
              you can do it yourself from the Join page, at any time;
            </li>
            <li>
              <strong>restrict</strong> its use or <strong>object</strong> to the processing;
            </li>
            <li>
              <strong>take it away</strong> in a machine-readable format;
            </li>
            <li>
              <strong>withdraw your consent</strong> whenever you like, without this affecting the
              validity of what was done before.
            </li>
          </ul>
          <p className={s.p}>
            If you believe we are handling your data improperly you can turn to the Italian data
            protection authority, the{' '}
            <a
              className={s.link}
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noopener noreferrer"
            >
              Garante per la protezione dei dati personali
            </a>
            <span className="sr-only"> (opens in a new tab)</span>. We would appreciate you trying
            to write to us first, but it is your right and you do not need our permission.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>If you are under 18</h2>
          <p className={s.p}>
            {COMMUNITY.name} is aimed at minors too: the age range is {t('community.fasciaEta')}.
          </p>
          <p className={s.p}>
            In Italy a minor may consent on their own to the processing of their data for online
            services <strong>from the age of 14</strong> (art. 2-<em>quinquies</em> of the Italian
            privacy code). The community’s minimum age is higher than that threshold, so anyone who
            can join here is already in a position to decide for themselves: we do not ask for a
            parent’s consent because the law does not require it in this case.
          </p>
          <p className={s.p}>
            It remains true, though, that you are a minor and that what you write in your
            introduction becomes public. If you are a parent and you want us to remove your child’s
            profile, write to{' '}
            <a className={s.link} href={`mailto:${LEGAL.privacyEmail}`}>
              {LEGAL.privacyEmail}
            </a>
            : we will take it down without argument.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className={s.section}>
          <h2 className={s.h2}>If this notice changes</h2>
          <p className={s.p}>
            The date at the top says from when the version you are reading applies. If anything
            substantial changes — a new service, a new purpose — we will write it here and, if
            needed, we will ask for your consent again.
          </p>
        </section>
      </div>
    </div>
  )
}
