import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Avatar from '../components/Avatar.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import Skeleton from '../components/Skeleton.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import { useAuth } from '../lib/auth.jsx'
import { listUsers } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import s from './Membri.module.css'

/* Anteprima della bio: ~120 battute, poi il bottone "Mostra tutto".
   BIO_SLACK evita il caso ridicolo di un bottone che rivela tre caratteri: se
   la bio sfora il limite di meno di questo margine, la mostriamo tutta. */
const BIO_PREVIEW = 120
const BIO_SLACK = 24

/* Quante card fantasma durante il caricamento. Sei riempiono la griglia a
   ogni breakpoint (1, 2 o 3 colonne) senza lasciare una riga spaiata. */
const SKELETON_CARDS = 6

const FALLBACK_NAME = 'Membro YET'

/* Glifi dei social dei MEMBRI.
   Non arrivano da config/socials.js di proposito: quel file descrive gli
   account della community (handle e href fissi), qui invece servono i tre
   campi del profilo utente (socials.linkedin / instagram / other). Sono JSX
   e non semplici path 'd' perché l'icona di Instagram con un path unico
   richiederebbe fill-rule evenodd scritto a mano: con rect + circle il
   disegno è verificabile a occhio e resta coerente con lo stile a spigolo
   vivo (nessun raggio, tratto netto). */
const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const SOCIAL_FIELDS = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    glyph: (
      <>
        <rect x="2.9" y="2.9" width="18.2" height="18.2" {...STROKE} />
        <circle cx="7.3" cy="7.6" r="1.25" fill="currentColor" />
        <path d="M6.25 10.7h2.1v7.6h-2.1z" fill="currentColor" />
        <path
          d="M10.6 18.3v-7.6h2v1a3.1 3.1 0 0 1 2.6-1.2c2 0 3.1 1.3 3.1 3.6v4.2h-2.1v-3.9c0-1.2-.5-1.9-1.6-1.9s-1.9.8-1.9 2v3.8z"
          fill="currentColor"
        />
      </>
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    glyph: (
      <>
        <rect x="2.9" y="2.9" width="18.2" height="18.2" {...STROKE} />
        <circle cx="12" cy="12" r="4.5" {...STROKE} />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </>
    ),
  },
  {
    key: 'other',
    label: 'Sito',
    glyph: (
      <>
        <path d="M14 3.5h6.5V10" {...STROKE} />
        <path d="M20.5 3.5 11.5 12.5" {...STROKE} />
        <path d="M17.5 14v5.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1H10" {...STROKE} />
      </>
    ),
  },
]

/* Ordinamento italiano, insensibile ad accenti e maiuscole. Costruito una
   volta sola a livello di modulo: creare un Intl.Collator dentro un
   comparatore lo ricrea a ogni confronto ed è costoso. */
const collator = new Intl.Collator('it', { sensitivity: 'base', numeric: true })

function memberName(member) {
  const name = typeof member?.displayName === 'string' ? member.displayName.trim() : ''
  return name || FALLBACK_NAME
}

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

/* Un URL scritto a mano in un campo di testo può essere qualunque cosa,
   compreso `javascript:...`, che al click eseguirebbe codice nel nostro
   dominio. Quindi: accettiamo solo http/https, completiamo i domini nudi e in
   tutti gli altri casi NON mostriamo il link. Meglio un social in meno che un
   link pericoloso in una pagina che elenca profili di sconosciuti. */
function httpOnly(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

function toProfileUrl(key, raw) {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value) return null

  // Schema esplicito diverso da http/https: si scarta subito.
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i)
  if (scheme && !/^https?$/i.test(scheme[1])) return null

  if (/^https?:\/\//i.test(value)) return httpOnly(value)

  // Handle nudo ("@mario", "mario.rossi" senza punti né slash): possiamo
  // ricostruire l'URL solo per le piattaforme di cui conosciamo la forma.
  const handle = value.replace(/^@+/, '')
  if (handle && !handle.includes('/') && !handle.includes('.') && !/\s/.test(handle)) {
    if (key === 'instagram') return `https://www.instagram.com/${encodeURIComponent(handle)}`
    if (key === 'linkedin') return `https://www.linkedin.com/in/${encodeURIComponent(handle)}`
    return null // per "other" un handle senza dominio non porta da nessuna parte
  }

  // Dominio senza schema: "linkedin.com/in/mario" -> https://linkedin.com/...
  if (/^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(value)) return httpOnly(`https://${value}`)

  return null
}

function memberLinks(member) {
  const socials = member?.socials && typeof member.socials === 'object' ? member.socials : {}
  return SOCIAL_FIELDS.map((field) => {
    const href = toProfileUrl(field.key, socials[field.key])
    return href ? { ...field, href } : null
  }).filter(Boolean)
}

function splitBio(bio) {
  const text = typeof bio === 'string' ? bio.trim() : ''
  if (!text) return { text: '', preview: '', truncated: false }
  if (text.length <= BIO_PREVIEW + BIO_SLACK) return { text, preview: text, truncated: false }

  // Taglio all'ultimo spazio utile: troncare a metà parola si legge come un
  // errore di rendering, non come "c'è ancora testo". Se l'ultimo spazio è
  // troppo indietro (parola lunghissima, un URL) si taglia secco.
  const slice = text.slice(0, BIO_PREVIEW)
  const lastSpace = slice.lastIndexOf(' ')
  const head = lastSpace > BIO_PREVIEW * 0.6 ? slice.slice(0, lastSpace) : slice
  return { text, preview: `${head.trimEnd()}…`, truncated: true }
}

function MemberCard({ member, isMe, isAdmin = false }) {
  const [open, setOpen] = useState(false)
  const reactId = useId()
  const bioId = `${reactId}-bio`
  const nameId = `${reactId}-name`

  const name = memberName(member)
  const bio = useMemo(() => splitBio(member.bio), [member.bio])
  const links = useMemo(() => memberLinks(member), [member])

  return (
    <li className={s.item}>
      {/* La card è un <article>, NON un bottone: contiene già dei link, e un
          <a> dentro un <button> è HTML non valido e rompe la tastiera (il
          browser non sa quale dei due attivare con Invio). L'espansione della
          bio è affidata a un vero <button> interno, così i link social
          restano attivabili da soli e non serve nessuno stopPropagation. */}
      <article
        className={[s.card, isMe && s.cardMe, isAdmin && s.cardAdmin].filter(Boolean).join(' ')}
        aria-labelledby={nameId}
      >
        <header className={s.head}>
          <Avatar src={member.photoURL} name={name} size={56} />
          <div className={s.identity}>
            <h2 className={s.name} id={nameId}>
              {name}
            </h2>
            {/* Un distintivo solo per card: "Il tuo profilo" ha la precedenza
                perché è l'informazione che serve a te che stai guardando. */}
            {member.location ? <p className={s.place}>{member.location}</p> : null}
            {isMe ? (
              <p className={s.badge}>Il tuo profilo</p>
            ) : isAdmin ? (
              <p className={`${s.badge} ${s.badgeAdmin}`}>Organizza</p>
            ) : null}
          </div>
        </header>

        {bio.text ? (
          <p className={s.bio} id={bioId}>
            {open ? bio.text : bio.preview}
          </p>
        ) : (
          /* Niente card mezza vuota: una riga di riserva discreta, che dice
             cosa manca senza sembrare un errore di caricamento. */
          <p className={s.bioEmpty}>Bio in arrivo - {name} non si è ancora presentato.</p>
        )}

        {/* Il bottone compare solo se c'è davvero altro da leggere. */}
        {bio.truncated && (
          <button
            type="button"
            className={s.toggle}
            aria-expanded={open}
            aria-controls={bioId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Mostra meno' : 'Mostra tutto'}
            <span className="sr-only"> della bio di {name}</span>
          </button>
        )}

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
                  aria-label={`${link.label} di ${name} (si apre in una nuova scheda)`}
                >
                  <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {link.glyph}
                  </svg>
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>
    </li>
  )
}

function GhostCard() {
  return (
    <li className={s.item}>
      {/* aria-hidden: per chi usa uno screen reader il caricamento è già
          annunciato dalla live region più in alto; sei scheletri letti come
          contenuto sarebbero solo rumore. */}
      <div className={s.ghost} aria-hidden="true">
        <div className={s.ghostHead}>
          <Skeleton height="56px" width="56px" />
          <Skeleton height="1.25rem" width="60%" />
        </div>
        <Skeleton count={3} height="0.7rem" />
        <Skeleton height="2.5rem" width="9rem" />
      </div>
    </li>
  )
}

export default function Membri() {
  const { user } = useAuth()

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
      ? 'Caricamento dei profili in corso.'
      : status === 'error'
        ? 'Caricamento dei profili non riuscito.'
        : status === 'ready'
          ? `${count} ${count === 1 ? 'profilo caricato' : 'profili caricati'}.`
          : ''

  return (
    <>
      <section className={s.hero}>
        <div className="container">
          <p className={s.eyebrow}>La community</p>
          <h1 className={s.title}>Membri</h1>
          {/* Due paragrafi e non uno solo: in una frase unica il ritorno a capo
              cadeva dopo "d'Italia" e la coda ("e trovare i suoi contatti")
              sembrava attaccata alla parte sbagliata. Separare le due idee
              risolve il problema alla radice, invece di sperare in un
              text-wrap che dipende dalla larghezza dello schermo. */}
          <p className={s.lead}>
            Chi costruisce qualcosa dentro YET: studenti, autodidatti, fondatori alle prime armi,
            da Torino e dal resto d’Italia.
          </p>
          <p className={s.leadSecond}>
            Apri un profilo per leggere la presentazione completa e trovare i contatti.
          </p>

          {/* Il contatore compare solo a dati caricati: mostrare "0" mentre si
              carica direbbe una cosa falsa, e su un club appena nato la
              differenza fra "zero membri" e "sto caricando" è tutta. */}
          {status === 'ready' && count > 0 && (
            <p className={s.tally}>
              <span className={s.tallyNumber}>{count}</span>
              <span className={s.tallyLabel}>
                {count === 1 ? 'persona nella community' : 'persone nella community'}
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
              <h2 className={s.noticeTitle}>Elenco non disponibile</h2>
              <p className={s.noticeText}>
                Questa copia del sito non ha le chiavi di Firebase configurate, quindi i profili non
                possono essere caricati. Il resto del sito funziona normalmente.
              </p>
            </div>
          )}

          {status === 'loading' && (
            <>
              <p className={s.count} aria-hidden="true">
                Caricamento…
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
              title="Non riusciamo a caricare i profili"
              message={
                error?.code === 'permission-denied'
                  ? 'La lettura dell’elenco è stata rifiutata dal server. Riprova, e se il problema resta scrivici.'
                  : 'Qualcosa è andato storto nel leggere l’elenco dei membri. Può essere la connessione.'
              }
              onRetry={retry}
            />
          )}

          {status === 'ready' && count === 0 && (
            <EmptyState
              title="Ancora nessun profilo"
              action={
                <Link className={s.cta} to="/join">
                  Entra in YET
                </Link>
              }
            >
              Nessuno si è ancora presentato. Puoi essere il primo: iscriviti, accedi e scrivi due
              righe su cosa stai costruendo.
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
                      Chi organizza
                    </h2>
                    <p className={s.groupNote}>
                      Tengono in piedi la community e pubblicano le notizie del sito.
                    </p>
                  </div>
                  <ul className={s.grid}>
                    {admins.map((member) => (
                      <MemberCard
                        key={member.uid}
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
                      {admins.length > 0 ? 'I membri' : 'La community'}
                    </h2>
                    <p className={s.groupNote}>
                      {regulars.length} {regulars.length === 1 ? 'profilo' : 'profili'}
                    </p>
                  </div>
                  <ul className={s.grid}>
                    {regulars.map((member) => (
                      <MemberCard
                        key={member.uid}
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
