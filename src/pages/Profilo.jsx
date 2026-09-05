import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Avatar from '../components/Avatar.jsx'
import ErrorState from '../components/ErrorState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import { useAuth } from '../lib/auth.jsx'
import { formatDate, getMemberProfile, listUsers } from '../lib/db.js'
import { useI18n } from '../lib/i18n.jsx'
import { findMemberByKey, memberLinks, memberName } from '../lib/members.jsx'
import { isFirebaseConfigured } from '../lib/firebase.js'
import s from './Profilo.module.css'

/**
 * La pagina di un singolo membro: /vetrina/federicofassio
 *
 * Il pezzo nell'indirizzo puo' essere lo SLUG (il nome ridotto a lettere e
 * numeri) oppure il vecchio UID. Si prova prima la strada diretta, poi quella
 * lenta, e l'ordine conta:
 *
 *  - se sembra un uid, una singola lettura del documento basta;
 *  - altrimenti si scarica l'elenco dei profili approvati e si cerca il nome.
 *    Costa una query in piu', ma solo per chi arriva da un indirizzo leggibile,
 *    ed e' l'unico modo senza tenere un campo `slug` nel database: Firestore
 *    non sa imporre l'unicita' di un campo fra documenti, quindi garantirla
 *    richiederebbe una seconda collection di prenotazione e una migrazione.
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

/* I tre campi del profilo esteso. In un array e non tre blocchi copiati:
   l'ordine è una decisione di contenuto e si legge in un punto solo.
   `chiave` è il nome del campo sul documento E il pezzo finale della chiave di
   traduzione (`profilo.project`): un nome solo per le due cose evita che
   aggiungendo un campo si aggiorni una lista e non l'altra. */
const SEZIONI = [{ chiave: 'project' }, { chiave: 'looking' }, { chiave: 'skills' }]

function testo(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/* --------------------------------------------------------------------------
   Stati della pagina
-------------------------------------------------------------------------- */

function Caricamento() {
  const { t } = useI18n()

  return (
    <div className="container-narrow">
      <div className={s.loading} aria-hidden="true">
        <Skeleton height="clamp(11rem, 40vw, 18rem)" />
        <Skeleton height="2rem" width="60%" />
        <Skeleton height="1rem" width="35%" />
        <Skeleton count={4} height="0.8rem" />
      </div>
      <p className="sr-only" role="status">
        {t('profilo.caricamento')}
      </p>
    </div>
  )
}

function NonTrovato() {
  const { t } = useI18n()

  return (
    <div className="container-narrow">
      <h1 className={s.title}>{t('profilo.nonTrovatoTitolo')}</h1>
      <p className={s.lead}>{t('profilo.nonTrovatoTesto')}</p>
      <Link className={s.back} to="/vetrina">
        {t('profilo.tornaVetrina')}
      </Link>
    </div>
  )
}

/* --------------------------------------------------------------------------
   La pagina
-------------------------------------------------------------------------- */

/**
 * Da quel che c'e' nell'indirizzo al profilo.
 *
 * Un uid di Firebase e' lungo 20 caratteri o piu' e mescola maiuscole e
 * minuscole; uno slug e' tutto minuscolo. Non e' una distinzione perfetta, ed
 * e' per questo che quando la lettura diretta non trova niente si ricade
 * comunque sulla ricerca per nome, invece di dire "non esiste".
 */
async function risolviMembro(chiave) {
  const sembraUid = /[A-Z]/.test(chiave) && chiave.length >= 16

  if (sembraUid) {
    const diretto = await getMemberProfile(chiave)
    if (diretto) return diretto
  }

  const tutti = await listUsers()
  const trovato = findMemberByKey(tutti, chiave)
  if (trovato) return trovato

  // Ultimo tentativo: poteva essere un uid tutto minuscolo.
  return sembraUid ? null : getMemberProfile(chiave)
}

export default function Profilo() {
  const { uid: chiave } = useParams()
  const { user } = useAuth()
  const { lang, t } = useI18n()

  const configured = isFirebaseConfigured !== false
  const [stato, setStato] = useState(configured ? 'loading' : 'unconfigured')
  const [membro, setMembro] = useState(null)
  const [errore, setErrore] = useState(null)

  /* `chiave` nelle dipendenze: senza, passando da un profilo all'altro senza
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

    risolviMembro(chiave)
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
  }, [chiave, configured])

  /* Il titolo della scheda.
     Il guscio generato dal build lo porta gia' giusto per chi apre il link da
     fuori, ma non basta in due casi: chi arriva dalla vetrina cliccando (la
     pagina non viene ricaricata, e il titolo resterebbe "Membri · YET") e chi
     e' stato approvato dopo l'ultima pubblicazione, che passa dal recupero e
     quindi parte dal guscio della vetrina. E' anche il nome che finisce nel
     segnalibro e nella cronologia. */
  useEffect(() => {
    if (stato !== 'ok' || !membro) return undefined
    const precedente = document.title
    document.title = `${memberName(membro)} · YET`
    return () => {
      document.title = precedente
    }
  }, [stato, membro])

  if (stato === 'unconfigured') {
    return (
      <section className={s.page}>
        <div className="container-narrow">
          <h1 className={s.title}>{t('profilo.spentoTitolo')}</h1>
          <p className={s.lead}>{t('profilo.spentoTesto')}</p>
          <Link className={s.back} to="/vetrina">
            {t('profilo.tornaVetrina')}
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
            title={t('profilo.erroreTitolo')}
            message={errore?.message || t('profilo.erroreTesto')}
          />
          <Link className={s.back} to="/vetrina">
            {t('profilo.tornaVetrina')}
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

  const nome = memberName(membro, t('vetrina.nomeRipiego'))
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
          <span aria-hidden="true">←</span> {t('profilo.vetrina')}
        </Link>

        {/* Solo il proprietario e gli admin possono leggere un profilo non
            approvato (lo dicono le regole), quindi questo avviso lo vede
            soltanto chi ha senso che lo veda. */}
        {inAttesa && (
          <p className={s.pending} role="note">
            <strong>{t('profilo.attesaTitolo')}</strong> {t('profilo.attesaTesto')}
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
              {/* La riga compare solo se la data c'è: createdAt torna dal
                  server un istante dopo la creazione del profilo, e "nel club
                  dal ..." senza data non vuol dire niente. */}
              {membro.createdAt ? (
                <span className={s.since}>
                  {t('profilo.nelClubDal', { data: formatDate(membro.createdAt, lang) })}
                </span>
              ) : null}
            </p>

            <div className={s.badges}>
              {organizza && <span className={s.badge}>{t('vetrina.organizza')}</span>}
              {sonoIo && (
                <span className={`${s.badge} ${s.badgeMe}`}>{t('vetrina.tuoProfilo')}</span>
              )}
            </div>

            {sonoIo && (
              <Link className={s.edit} to="/join">
                {t('profilo.modifica')}
              </Link>
            )}
          </div>
        </header>

        {bio ? (
          <div className={s.block}>
            <h2 className={s.blockTitle}>{t('profilo.chiSono')}</h2>
            {/* pre-wrap: i ritorni a capo che la persona ha scritto sono parte
                di come si è presentata, e schiacciarli in un blocco unico
                cambia quello che ha scritto. */}
            <p className={s.text}>{bio}</p>
          </div>
        ) : (
          <p className={s.empty}>{t('profilo.presentazioneVuota', { nome })}</p>
        )}

        {sezioni.map((sez) => (
          <div className={s.block} key={sez.chiave}>
            <h2 className={s.blockTitle}>{t(`profilo.${sez.chiave}`)}</h2>
            <p className={s.text}>{sez.valore}</p>
          </div>
        ))}

        {links.length > 0 && (
          <div className={s.block}>
            <h2 className={s.blockTitle}>{t('profilo.doveTrovarlo')}</h2>
            <ul className={s.socials}>
              {links.map((link) => (
                <li key={link.key}>
                  <a
                    className={s.social}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('social.aria', { social: t(link.chiaveEtichetta), nome })}
                  >
                    <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      {link.glyph}
                    </svg>
                    <span>{t(link.chiaveEtichetta)}</span>
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
