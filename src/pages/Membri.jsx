import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Avatar from '../components/Avatar.jsx'
import Reveal, { stagger } from '../components/Reveal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import Skeleton from '../components/Skeleton.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import { useAuth } from '../lib/auth.jsx'
import { listUsers } from '../lib/db.js'
import { useI18n } from '../lib/i18n.jsx'
import { memberLinks, memberName, memberPath } from '../lib/members.jsx'
import { isFirebaseConfigured } from '../lib/firebase.js'
import s from './Membri.module.css'

/* Quante card fantasma durante il caricamento. Sei riempiono la griglia a
   ogni breakpoint (1, 2 o 3 colonne) senza lasciare una riga spaiata. */
const SKELETON_CARDS = 6

/* Ordinamento italiano, insensibile ad accenti e maiuscole. Costruito una
   volta sola a livello di modulo: creare un Intl.Collator dentro un
   comparatore lo ricrea a ogni confronto ed è costoso. */
const collator = new Intl.Collator('it', { sensitivity: 'base', numeric: true })

/* Ordine alfabetico e NON per createdAt: un documento appena creato ha
   createdAt null per qualche istante (serverTimestamp torna dal server solo
   dopo), quindi ordinare per data farebbe saltare quel profilo in cima o in
   fondo fra un caricamento e l'altro, e un ordine che cambia da solo sembra
   un bug. Lo spareggio sull'uid rende l'ordine totalmente deterministico
   anche fra due omonimi o fra due profili senza nome. */
function sortMembers(list) {
  return [...list].sort((a, b) => {
    const byName = collator.compare(memberName(a), memberName(b))
    if (byName !== 0) return byName
    return collator.compare(a.uid, b.uid)
  })
}

function MemberCard({ member, isMe, isAdmin = false, revealDelay = 0 }) {
  const reactId = useId()
  const nameId = `${reactId}-name`
  const { t } = useI18n()

  const name = memberName(member, t('vetrina.nomeRipiego'))
  const links = useMemo(() => memberLinks(member), [member])
  const bio = typeof member.bio === 'string' ? member.bio.trim() : ''

  return (
    <li className={s.item}>
      <Reveal delay={revealDelay} className={s.reveal}>
      <article
        className={[s.card, isMe && s.cardMe, isAdmin && s.cardAdmin].filter(Boolean).join(' ')}
        aria-labelledby={nameId}
      >
        <header className={s.head}>
          <Avatar src={member.photoURL} name={name} fill />
          <div className={s.identity}>
            {/* LA TESSERA È CLICCABILE, ma il link vero è UNO SOLO: il nome.
                Il resto lo copre uno pseudo-elemento steso su tutta la
                tessera (vedi .nameLink::after nel modulo).

                Perché non avvolgere tutto in un <a>: dentro ci sono già i
                link social, e un <a> dentro un <a> è HTML non valido, il
                browser lo spezza e la tastiera non sa più cosa attivare. E
                perché non un onClick sull'<article>: un div cliccabile non si
                raggiunge col tab, non si apre con Invio, non si apre in una
                scheda nuova col tasto centrale e non mostra l'indirizzo nella
                barra di stato. Così invece c'è un link normale, che fa tutte
                queste cose, e chi usa uno screen reader ne sente uno per
                tessera invece di due. */}
            <h2 className={s.name} id={nameId}>
              <Link className={s.nameLink} to={memberPath(member.uid)}>
                {name}
              </Link>
            </h2>
            {member.location ? <p className={s.place}>{member.location}</p> : null}
            {/* Un distintivo solo per tessera: "Il tuo profilo" ha la
                precedenza perché è l'informazione che serve a te che guardi. */}
            {isMe ? (
              <p className={s.badge}>{t('vetrina.tuoProfilo')}</p>
            ) : isAdmin ? (
              <p className={`${s.badge} ${s.badgeAdmin}`}>{t('vetrina.organizza')}</p>
            ) : null}
          </div>
        </header>

        {bio ? (
          /* Il testo INTERO sta nel DOM e lo taglia il CSS a due righe: così
             la ricerca del browser trova anche le parole che non si vedono.
             Non c'è più nessun "Mostra tutto": la bio adesso può essere lunga
             2500 battute e il posto per leggerla è la pagina del profilo, che
             è dove porta la tessera. Un espansore dentro una tessera
             cliccabile sarebbe anche un bersaglio in più da sbagliare col
             pollice, che è il problema da cui siamo partiti. */
          <p className={s.bio}>{bio}</p>
        ) : (
          /* Niente tessera mezza vuota: una riga di riserva discreta, che dice
             cosa manca senza sembrare un errore di caricamento. */
          <p className={s.bioEmpty}>{t('vetrina.bioVuota', { nome: name })}</p>
        )}

        {/* Sta dove stava "Mostra tutto", e serve per la stessa ragione: la
            bio finisce con i puntini e senza una riga come questa niente dice
            come leggere il resto. Non è un controllo a sé, è l'etichetta
            dell'azione della tessera: aria-hidden perché chi usa uno screen
            reader ha già il link del nome, e sentire due volte la stessa cosa
            per trenta tessere è solo rumore. */}
        <p className={s.more} aria-hidden="true">
          {t('vetrina.leggiProfilo')}
        </p>

        {links.length > 0 && (
          <ul className={s.socials}>
            {links.map((link) => (
              <li key={link.key}>
                {/* aria-label con il nome della persona: uno screen reader che
                    scorre i link della pagina sentirebbe altrimenti
                    "LinkedIn" trenta volte di fila. Il testo visibile
                    ("LinkedIn") è contenuto nell'etichetta accessibile, come
                    richiede la WCAG 2.5.3 Label in Name. */}
                <a
                  className={s.social}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('social.aria', { social: t(link.chiaveEtichetta), nome: name })}
                >
                  <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {link.glyph}
                  </svg>
                  <span>{t(link.chiaveEtichetta)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>
      </Reveal>
    </li>
  )
}

function GhostCard() {
  return (
    <li className={s.item}>
      {/* aria-hidden: per chi usa uno screen reader il caricamento è già
          annunciato dalla live region più in alto; sei scheletri letti come
          contenuto sarebbero solo rumore.

          LA FORMA DEVE ESSERE QUELLA DELLA TESSERA VERA, ed è tutta la ragione
          per cui uno scheletro esiste invece di una rotella: se le due forme
          non combaciano, all'arrivo dei dati la pagina salta.
          Questo modellava ancora la tessera vecchia, con il bollino da 56px
          accanto al nome, e conteneva una barra da 9rem: in una tessera da
          132px quella barra sfondava di 76px e, non essendoci overflow
          nascosto sullo scheletro, portava lo scroll orizzontale a tutta la
          pagina della vetrina. */}
      <div className={s.ghost} aria-hidden="true">
        {/* height="auto" perché il componente scrive l'altezza inline, e uno
            stile inline vince sul CSS: senza, l'aspect-ratio del modulo non
            avrebbe voce in capitolo e la banda non sarebbe quadrata. */}
        <Skeleton className={s.ghostPhoto} height="auto" />
        <div className={s.ghostText}>
          <Skeleton height="1.25rem" width="70%" />
          <Skeleton count={2} height="0.7rem" />
        </div>
      </div>
    </li>
  )
}

export default function Membri() {
  const { user } = useAuth()
  const { t } = useI18n()

  /* `isFirebaseConfigured === false` e non `!isFirebaseConfigured`: se per
     qualsiasi motivo il flag arrivasse undefined preferiamo provare a leggere
     e mostrare un errore vero, invece di accusare l'ambiente. */
  const configured = isFirebaseConfigured !== false

  const [status, setStatus] = useState(configured ? 'loading' : 'unconfigured')
  const [members, setMembers] = useState([])
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!configured) {
      setStatus('unconfigured')
      return undefined
    }

    // `alive` serve sia allo smontaggio sia al doppio effetto di StrictMode in
    // sviluppo: senza, la prima fetch potrebbe risolvere dopo la seconda e
    // riscrivere uno stato più vecchio.
    let alive = true
    setStatus('loading')
    setError(null)

    listUsers()
      .then((list) => {
        if (!alive) return
        // Un doc senza uid non è indicizzabile come key di React e non è
        // nemmeno un profilo utile: si scarta invece di far esplodere la lista.
        const clean = (Array.isArray(list) ? list : []).filter((item) => item && item.uid)
        setMembers(sortMembers(clean))
        setStatus('ready')
      })
      .catch((err) => {
        if (!alive) return
        setError(err)
        setStatus('error')
      })

    return () => {
      alive = false
    }
  }, [configured, attempt])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  /* Due elenchi invece di uno. Il campo `role` è scritto nel profilo ma
     verificato dalle regole (vedi roleOk() in firestore.rules), quindi
     fidarsene qui è legittimo: nessuno può auto-promuoversi.
     Il fallback su 'member' copre i profili creati prima che il campo
     esistesse, senza, finirebbero in un limbo e sparirebbero dalla pagina. */
  const admins = members.filter((m) => m.role === 'admin')
  const regulars = members.filter((m) => m.role !== 'admin')

  const count = members.length
  const liveMessage =
    status === 'loading'
      ? t('vetrina.liveCaricamento')
      : status === 'error'
        ? t('vetrina.liveErrore')
        : status === 'ready'
          ? t(count === 1 ? 'vetrina.liveCaricatoUno' : 'vetrina.liveCaricatiTanti', { n: count })
          : ''

  return (
    <>
      <section className={s.hero}>
        <div className="container">
          <p className={s.eyebrow}>{t('vetrina.eyebrow')}</p>
          <h1 className={s.title}>{t('vetrina.titolo')}</h1>
          {/* Due paragrafi e non uno solo: in una frase unica il ritorno a capo
              cadeva dopo "d'Italia" e la coda ("e trovare i suoi contatti")
              sembrava attaccata alla parte sbagliata. Separare le due idee
              risolve il problema alla radice, invece di sperare in un
              text-wrap che dipende dalla larghezza dello schermo. */}
          <p className={s.lead}>{t('vetrina.lead')}</p>
          <p className={s.leadSecond}>{t('vetrina.leadSecond')}</p>

          {/* Il contatore compare solo a dati caricati: mostrare "0" mentre si
              carica direbbe una cosa falsa, e su un club appena nato la
              differenza fra "zero membri" e "sto caricando" è tutta. */}
          {status === 'ready' && count > 0 && (
            <p className={s.tally}>
              <span className={s.tallyNumber}>{count}</span>
              <span className={s.tallyLabel}>
                {count === 1 ? t('vetrina.contatoreUno') : t('vetrina.contatoreTanti')}
              </span>
            </p>
          )}
        </div>
      </section>

      <HandsDivider />

      <section className={s.body} aria-busy={status === 'loading'}>
        <div className="container">
          {/* Regione di stato sempre presente nel DOM: se comparisse solo a
              caricamento finito, molti screen reader non annuncerebbero nulla,
              perché la live region non era in pagina al momento del cambio. */}
          <p className={s.srStatus} role="status">
            {liveMessage}
          </p>

          {status === 'unconfigured' && (
            <div className={s.notice}>
              <h2 className={s.noticeTitle}>{t('vetrina.spentoTitolo')}</h2>
              <p className={s.noticeText}>{t('vetrina.spentoTesto')}</p>
            </div>
          )}

          {status === 'loading' && (
            <>
              <p className={s.count} aria-hidden="true">
                {t('stati.caricamento')}
              </p>
              <ul className={s.grid}>
                {Array.from({ length: SKELETON_CARDS }, (_, index) => (
                  <GhostCard key={index} />
                ))}
              </ul>
            </>
          )}

          {status === 'error' && (
            <ErrorState
              title={t('vetrina.erroreTitolo')}
              message={
                error?.code === 'permission-denied'
                  ? t('vetrina.errorePermessi')
                  : t('vetrina.erroreGenerico')
              }
              onRetry={retry}
            />
          )}

          {status === 'ready' && count === 0 && (
            <EmptyState
              title={t('vetrina.vuotoTitolo')}
              action={
                <Link className={s.cta} to="/join">
                  {t('hero.entra')}
                </Link>
              }
            >
              {t('vetrina.vuotoTesto')}
            </EmptyState>
          )}

          {status === 'ready' && count > 0 && (
            <>
              {/* --- Chi organizza -------------------------------------------
                  Compare solo se c'è davvero qualcuno: un'intestazione sopra
                  una griglia vuota fa sembrare che manchi del contenuto.
                  Va per prima perché è la domanda che si fa chi arriva da
                  fuori, "chi c'è dietro?", prima ancora di sfogliare i
                  membri. */}
              {admins.length > 0 && (
                <section className={s.group} aria-labelledby="chi-organizza">
                  <div className={s.groupHead}>
                    <h2 className={s.groupTitle} id="chi-organizza">
                      {t('vetrina.chiOrganizza')}
                    </h2>
                    <p className={s.groupNote}>{t('vetrina.chiOrganizzaNota')}</p>
                  </div>
                  <ul className={s.grid}>
                    {admins.map((member, i) => (
                      <MemberCard
                        key={member.uid}
                        revealDelay={stagger(i)}
                        member={member}
                        isMe={!!user && user.uid === member.uid}
                        isAdmin
                      />
                    ))}
                  </ul>
                </section>
              )}

              {/* --- Tutti gli altri ---------------------------------------- */}
              {regulars.length > 0 && (
                <section className={s.group} aria-labelledby="i-membri">
                  <div className={s.groupHead}>
                    <h2 className={s.groupTitle} id="i-membri">
                      {admins.length > 0 ? t('vetrina.iMembri') : t('vetrina.laCommunity')}
                    </h2>
                    <p className={s.groupNote}>
                      {regulars.length}{' '}
                      {regulars.length === 1 ? t('vetrina.profiloUno') : t('vetrina.profiliTanti')}
                    </p>
                  </div>
                  <ul className={s.grid}>
                    {regulars.map((member, i) => (
                      <MemberCard
                        key={member.uid}
                        revealDelay={stagger(i)}
                        member={member}
                        isMe={!!user && user.uid === member.uid}
                      />
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </section>

      <WhatsAppCta />
    </>
  )
}
