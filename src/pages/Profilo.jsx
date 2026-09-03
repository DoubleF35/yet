import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Avatar from '../components/Avatar.jsx'
import ErrorState from '../components/ErrorState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import { useAuth } from '../lib/auth.jsx'
import { formatDate, getMemberProfile } from '../lib/db.js'
import { memberLinks, memberName } from '../lib/members.jsx'
import { isFirebaseConfigured } from '../lib/firebase.js'
import s from './Profilo.module.css'

/**
 * La pagina di un singolo membro: /vetrina/:uid
 *
 * Esiste perché la tessera della vetrina non è il posto dove si legge una
 * presentazione: è larga un terzo di schermo e la bio ci sta su due righe.
 * Qui invece c'è spazio, e la bio può arrivare a 2500 battute.
 *
 * NON è una pagina protetta, e non deve esserlo: la vetrina è pubblica. La
 * riservatezza sta a monte, nelle regole del database, che concedono la
 * lettura ai soli profili approvati (più il proprietario e gli admin). Se un
 * profilo non è leggibile, getMemberProfile torna null e qui si vede "questo
 * profilo non c'è": è la risposta giusta anche quando il profilo esiste ma è
 * in attesa, perché il contrario direbbe a chiunque che una certa persona si
 * è iscritta.
 */

/* I tre campi del profilo esteso, con la loro intestazione. In un array e non
   tre blocchi copiati: l'ordine è una decisione di contenuto e si legge in un
   punto solo. `chiave` è il nome del campo sul documento. */
const SEZIONI = [
  {
    chiave: 'project',
    titolo: 'Cosa sto costruendo',
  },
  {
    chiave: 'looking',
    titolo: 'Cosa cerco',
  },
  {
    chiave: 'skills',
    titolo: 'Cosa so fare',
  },
]

function testo(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/* --------------------------------------------------------------------------
   Stati della pagina
-------------------------------------------------------------------------- */

function Caricamento() {
  return (
    <div className="container-narrow">
      <div className={s.loading} aria-hidden="true">
        <Skeleton height="clamp(11rem, 40vw, 18rem)" />
        <Skeleton height="2rem" width="60%" />
        <Skeleton height="1rem" width="35%" />
        <Skeleton count={4} height="0.8rem" />
      </div>
      <p className="sr-only" role="status">
        Sto caricando il profilo.
      </p>
    </div>
  )
}

function NonTrovato() {
  return (
    <div className="container-narrow">
      <h1 className={s.title}>Questo profilo non c’è</h1>
      <p className={s.lead}>
        Può essere stato cancellato, oppure il link è incompleto. L’elenco di chi c’è adesso è
        nella vetrina.
      </p>
      <Link className={s.back} to="/vetrina">
        Torna alla vetrina
      </Link>
    </div>
  )
}

/* --------------------------------------------------------------------------
   La pagina
-------------------------------------------------------------------------- */

export default function Profilo() {
  const { uid } = useParams()
  const { user } = useAuth()

  const configured = isFirebaseConfigured !== false
  const [stato, setStato] = useState(configured ? 'loading' : 'unconfigured')
  const [membro, setMembro] = useState(null)
  const [errore, setErrore] = useState(null)

  /* `uid` nelle dipendenze: senza, passando da un profilo all'altro senza
     ricaricare la pagina (succede se un domani due profili si linkano fra
     loro) resterebbe a schermo il membro precedente. */
  useEffect(() => {
    if (!configured) {
      setStato('unconfigured')
      return undefined
    }

    /* La guardia sullo smontaggio: la risposta può arrivare dopo che l'utente
       è già andato altrove, e uno setState su un componente smontato è un
       aggiornamento buttato che in sviluppo diventa un avviso in console. */
    let vivo = true
    setStato('loading')
    setErrore(null)
    setMembro(null)

    getMemberProfile(uid)
      .then((dati) => {
        if (!vivo) return
        setMembro(dati)
        setStato(dati ? 'ok' : 'missing')
      })
      .catch((err) => {
        if (!vivo) return
        setErrore(err)
        setStato('error')
      })

    return () => {
      vivo = false
    }
  }, [uid, configured])

  if (stato === 'unconfigured') {
    return (
      <section className={s.page}>
        <div className="container-narrow">
          <h1 className={s.title}>Profilo non disponibile</h1>
          <p className={s.lead}>
            Manca la configurazione di Firebase, quindi i profili non possono essere letti. Non è
            un errore del sito: è il passo che manca alla prima installazione, ed è spiegato nel
            README.
          </p>
          <Link className={s.back} to="/vetrina">
            Torna alla vetrina
          </Link>
        </div>
      </section>
    )
  }

  if (stato === 'loading') {
    return (
      <section className={s.page}>
        <Caricamento />
      </section>
    )
  }

  if (stato === 'error') {
    return (
      <section className={s.page}>
        <div className="container-narrow">
          <ErrorState
            title="Non riesco a leggere questo profilo"
            message={errore?.message || 'Riprova fra poco.'}
          />
          <Link className={s.back} to="/vetrina">
            Torna alla vetrina
          </Link>
        </div>
      </section>
    )
  }

  if (stato === 'missing') {
    return (
      <section className={s.page}>
        <NonTrovato />
      </section>
    )
  }

  const nome = memberName(membro)
  const links = memberLinks(membro)
  const bio = testo(membro.bio)
  const sezioni = SEZIONI.map((sez) => ({ ...sez, valore: testo(membro[sez.chiave]) })).filter(
    (sez) => sez.valore,
  )
  const sonoIo = Boolean(user && user.uid === membro.uid)
  const organizza = membro.role === 'admin'
  const inAttesa = membro.status !== 'approved'

  return (
    <section className={s.page} aria-labelledby="profilo-nome">
      <div className="container-narrow">
        {/* Il ritorno sta in cima e non in fondo: chi apre un profilo per
            sbaglio non deve scorrere tutta la pagina per uscirne. */}
        <Link className={s.back} to="/vetrina">
          <span aria-hidden="true">←</span> Vetrina
        </Link>

        {/* Solo il proprietario e gli admin possono leggere un profilo non
            approvato (lo dicono le regole), quindi questo avviso lo vede
            soltanto chi ha senso che lo veda. */}
        {inAttesa && (
          <p className={s.pending} role="note">
            <strong>Questo profilo non è ancora pubblico.</strong> Lo vedi perché è il tuo, o
            perché organizzi la community. Comparirà nella vetrina appena approvato.
          </p>
        )}

        <header className={s.head}>
          <div className={s.photo}>
            <Avatar src={membro.photoURL} name={nome} fill />
          </div>

          <div className={s.identity}>
            <h1 className={s.name} id="profilo-nome">
              {nome}
            </h1>

            <p className={s.meta}>
              {membro.location ? <span className={s.place}>{membro.location}</span> : null}
              {/* formatDate risponde "in pubblicazione" quando createdAt non
                  è ancora tornato dal server: qui quel testo non avrebbe
                  senso, quindi la riga compare solo se la data c'è. */}
              {membro.createdAt ? (
                <span className={s.since}>Nel club dal {formatDate(membro.createdAt)}</span>
              ) : null}
            </p>

            <div className={s.badges}>
              {organizza && <span className={s.badge}>Organizza</span>}
              {sonoIo && <span className={`${s.badge} ${s.badgeMe}`}>Il tuo profilo</span>}
            </div>

            {sonoIo && (
              <Link className={s.edit} to="/join">
                Modifica il profilo
              </Link>
            )}
          </div>
        </header>

        {bio ? (
          <div className={s.block}>
            <h2 className={s.blockTitle}>Chi sono</h2>
            {/* pre-wrap: i ritorni a capo che la persona ha scritto sono parte
                di come si è presentata, e schiacciarli in un blocco unico
                cambia quello che ha scritto. */}
            <p className={s.text}>{bio}</p>
          </div>
        ) : (
          <p className={s.empty}>{nome} non ha ancora scritto la sua presentazione.</p>
        )}

        {sezioni.map((sez) => (
          <div className={s.block} key={sez.chiave}>
            <h2 className={s.blockTitle}>{sez.titolo}</h2>
            <p className={s.text}>{sez.valore}</p>
          </div>
        ))}

        {links.length > 0 && (
          <div className={s.block}>
            <h2 className={s.blockTitle}>Dove trovarlo</h2>
            <ul className={s.socials}>
              {links.map((link) => (
                <li key={link.key}>
                  <a
                    className={s.social}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} di ${nome} (si apre in una nuova scheda)`}
                  >
                    <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      {link.glyph}
                    </svg>
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chi arriva su un profilo dai social sta guardando una persona, non
            il club: l'invito al gruppo è l'unico modo che ha di entrarci in
            contatto senza aspettare un'approvazione. */}
        <WhatsAppCta />
      </div>
    </section>
  )
}
