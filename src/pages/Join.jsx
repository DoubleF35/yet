import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Avatar from '../components/Avatar.jsx'
import DeleteAccount from '../components/DeleteAccount.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { COMMUNITY } from '../config/socials.js'
import { useAuth } from '../lib/auth.jsx'
import { BIO_MAX, LOCATION_MAX, saveUserProfile } from '../lib/db.js'
import { AVATAR_MAX_BYTES, compressAvatar, humanBytes } from '../lib/imageCompress.js'
import { isFirebaseConfigured } from '../lib/firebase.js'

import s from './Join.module.css'

/* =========================================================================
   /join, due facce sulla stessa rotta.

   Non loggato: cos'è YET e un solo bottone.
   Loggato:     il form del proprio profilo (è ciò che finisce in /membri).

   La pagina non reindirizza mai: chi arriva qui da un link condiviso deve
   vedere di cosa si tratta *prima* di decidere se fare login.
   ========================================================================= */

// La base di GitHub Pages non è '/', quindi ogni asset in public/ va prefissato.
const LOGO_SRC = `${import.meta.env.BASE_URL}logo.png`

// Sotto questa soglia di caratteri residui il contatore passa al coral.
const BIO_WARN_AT = 30

// Quanto resta a schermo il messaggio di conferma del salvataggio.
const SAVED_MESSAGE_MS = 6000

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

// aria-describedby vuole una stringa di id separati da spazi, oppure niente
// attributo: la stringa vuota farebbe puntare il campo a un id inesistente.
function describedBy(...parts) {
  const value = parts.filter(Boolean).join(' ')
  return value || undefined
}

// Accettiamo solo http/https: un `javascript:` in un attributo src sarebbe una
// via d'ingresso per XSS, e i data: URI ci farebbero salvare mezzo megabyte di
// base64 in un documento Firestore.
function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

// L'oggetto `error` può arrivare come Error di Firebase (con .code), come Error
// generico o come semplice stringa: normalizziamo tutto in italiano invece di
// stampare in faccia all'utente "auth/popup-closed-by-user".
function signInErrorText(err) {
  if (!err) return ''
  const code = typeof err === 'object' ? err.code : ''
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Hai chiuso la finestra di Google prima di finire. Puoi riprovare quando vuoi.'
    case 'auth/popup-blocked':
      return 'Il browser ha bloccato la finestra di Google. Consenti i popup per questo sito e riprova.'
    case 'auth/network-request-failed':
      return 'Connessione assente o instabile. Controlla la rete e riprova.'
    case 'auth/unauthorized-domain':
      return 'Questo indirizzo non è fra i domini autorizzati del progetto Firebase.'
    case 'auth/operation-not-allowed':
      return 'Il login con Google non è ancora attivo su questo progetto Firebase.'
    default:
      if (typeof err === 'string') return err
      return err.message || 'Accesso non riuscito. Riprova fra un momento.'
  }
}

function saveErrorText(err) {
  const code = err && typeof err === 'object' ? err.code : ''
  switch (code) {
    case 'permission-denied':
      /* Messaggio lungo di proposito. "Le regole non permettono questa
         operazione" è vero e inutile: chi lo legge non sa da dove cominciare.
         In pratica la causa è quasi sempre una sola, le regole pubblicate sul
         database sono una versione più vecchia di quelle nel repo, e non
         conoscono i campi che il sito scrive adesso. Dirlo qui fa risparmiare
         mezz'ora a chiunque incontri l'errore. */
      return (
        'Firestore ha rifiutato il salvataggio. Quasi sempre vuol dire che le regole ' +
        'pubblicate sul database sono più vecchie di quelle del progetto: apri la console ' +
        'Firebase → Firestore Database → Regole e incolla il contenuto aggiornato di ' +
        'firestore.rules, poi premi Pubblica.'
      )
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Firestore non ha risposto in tempo. Probabilmente è la connessione: riprova fra un momento.'
    case 'unauthenticated':
      return 'La sessione è scaduta. Esci e rientra con Google, poi riprova.'
    default:
      if (typeof err === 'string') return err
      return (err && err.message) || 'Qualcosa è andato storto durante il salvataggio.'
  }
}

/* ------------------------------------------------------------------------- */

export default function Join() {
  const { user, loading } = useAuth()

  // `isFirebaseConfigured` potrebbe non esistere se lib/firebase.js cambia:
  // confrontiamo con `false` esplicito, così un `undefined` non fa comparire
  // un avviso falso e non disabilita il bottone senza motivo.
  const firebaseMissing = isFirebaseConfigured === false

  return (
    <section className={s.page} aria-labelledby="join-title">
      {loading ? (
        <JoinLoading />
      ) : user ? (
        <ProfileForm firebaseMissing={firebaseMissing} />
      ) : (
        <JoinPitch firebaseMissing={firebaseMissing} />
      )}
    </section>
  )
}

/* ------------------------------------------------------------------------- */

/** Avviso di configurazione mancante. Il sito deve aprirsi comunque. */
function ConfigNotice() {
  return (
    <p className={s.configNotice}>
      <strong>Firebase non è configurato.</strong> Le variabili <code>VITE_FIREBASE_*</code> non sono
      state impostate, quindi accesso e salvataggio non possono funzionare. Il resto del sito si
      naviga normalmente.
    </p>
  )
}

/** Primo istante: onAuthStateChanged non ha ancora risposto. */
function JoinLoading() {
  return (
    <div className="container">
      <header className={s.head}>
        <img className={s.mark} src={LOGO_SRC} alt="YET" />
        <h1 id="join-title" className={s.title}>
          Unisciti al club
        </h1>
      </header>

      {/* Gli scheletri sono decorativi: il messaggio parlato è quello sotto. */}
      <div className={s.loadingBlocks} aria-hidden="true">
        <Skeleton height="1.5rem" width="55%" />
        <Skeleton height="4rem" />
        <Skeleton height="4rem" />
        <Skeleton height="3rem" width="14rem" />
      </div>
      <p className="sr-only" role="status">
        Sto controllando se hai già effettuato l&apos;accesso.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------------- */

/** Faccia A, visitatore non autenticato. */
function JoinPitch({ firebaseMissing }) {
  const { signIn, error } = useAuth()
  const [pending, setPending] = useState(false)
  const [localError, setLocalError] = useState(null)

  // COMMUNITY arriva da config/socials.js: destrutturiamo con dei default così
  // un campo aggiunto dopo (o rimasto vuoto) non lascia buchi nel testo.
  const {
    name = 'YET',
    tagline = '',
    city = 'Torino',
    ageRange = '14 ai 23',
    description = '',
  } = COMMUNITY || {}

  const points = [
    {
      n: '01',
      title: 'Chi siamo',
      text:
        description ||
        `${name} è un club di giovani che costruiscono cose: progetti, prodotti, associazioni, idee ancora confuse.`,
    },
    {
      n: '02',
      title: 'Per chi',
      text: `Dai ${ageRange} anni, da tutta Italia. I primi eventi saranno a ${city}, ma l’obiettivo è espandersi: se vivi a Palermo o a Udine puoi trovare gente della tua città e contribuire a farne proprio dove sei tu.`,
    },
    {
      n: '03',
      title: 'Cosa si fa',
      text:
        'Ognuno porta il proprio progetto e mostra cosa è cambiato dall’ultima volta. Si fanno domande scomode, si presta una mano, si trova chi ha già risolto il tuo problema.',
    },
    {
      n: '04',
      title: 'Come si entra',
      text:
        'Accedi con Google e scrivi due righe su di te. La richiesta arriva agli organizzatori e, appena approvata, compari fra i membri. Non c’è quota di iscrizione: il passaggio serve solo a tenere fuori gli account finti.',
    },
  ]

  async function handleSignIn() {
    setLocalError(null)
    setPending(true)
    try {
      // Per contratto signIn() non lancia, ma il try resta: se un domani
      // lanciasse, qui l'utente vedrebbe un messaggio invece di niente.
      await signIn()
    } catch (err) {
      setLocalError(err)
    } finally {
      // Con il fallback su signInWithRedirect la pagina se ne va prima di
      // arrivare qui, e va bene: al ritorno il componente è nuovo.
      setPending(false)
    }
  }

  const shownError = localError || error
  const statusText = pending
    ? 'Sto aprendo la finestra di Google…'
    : shownError
      ? signInErrorText(shownError)
      : ''

  return (
    <div className="container">
      <header className={s.head}>
        <img className={s.mark} src={LOGO_SRC} alt="YET" />
        <h1 id="join-title" className={s.title}>
          Unisciti al club
        </h1>
        <p className={s.lead}>
          {tagline || `Giovani builder ${ageRange} anni, con base a ${city}.`}
        </p>
      </header>

      {firebaseMissing && <ConfigNotice />}

      <ul className={s.points}>
        {points.map((point) => (
          <li className={s.point} key={point.n}>
            <span className={s.pointNum} aria-hidden="true">
              {point.n}
            </span>
            <h2 className={s.pointTitle}>{point.title}</h2>
            <p className={s.pointText}>{point.text}</p>
          </li>
        ))}
      </ul>

      {/* Prima del login: il profilo richiede un'approvazione, il gruppo no.
          Chi non se la sente di aspettare ha comunque un modo di entrare
          oggi, invece di chiudere la pagina. */}
      <WhatsAppCta />

      <HandsDivider />

      <div className={s.cta}>
        <button
          type="button"
          className={s.primary}
          onClick={handleSignIn}
          disabled={pending || firebaseMissing}
          aria-busy={pending || undefined}
        >
          {pending ? 'Attendi…' : 'Accedi con Google'}
        </button>

        <p className={s.ctaNote}>
          Serve solo un account Google. Niente password nuove, niente newsletter: usiamo nome, email
          e foto per farti comparire fra i membri.
        </p>

        {/* Il paragrafo di stato resta SEMPRE nel DOM, anche vuoto: uno
            role="status" inserito insieme al suo testo spesso non viene
            annunciato, perché lo screen reader non lo stava osservando. */}
        <p className={cx(s.status, shownError && !pending && s.statusError)} role="status">
          {statusText}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------- */

const EMPTY_FORM = {
  displayName: '',
  location: '',
  bio: '',
  photoURL: '',
  linkedin: '',
  instagram: '',
  other: '',
}

/** Dal documento Firestore (più i dati Google come ripiego) allo stato del form. */
function formFromProfile(profile, user) {
  const socials = (profile && profile.socials) || {}
  return {
    displayName: (profile && profile.displayName) || (user && user.displayName) || '',
    location: (profile && profile.location) || '',
    bio: (profile && profile.bio) || '',
    photoURL: (profile && profile.photoURL) || (user && user.photoURL) || '',
    linkedin: socials.linkedin || '',
    instagram: socials.instagram || '',
    other: socials.other || '',
  }
}

/** Faccia B, utente autenticato: crea o aggiorna il proprio profilo. */
function ProfileForm({ firebaseMissing }) {
  const { user, profile, profileLoading, refreshProfile } = useAuth()
  const fid = useId()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null)
  const [savedNow, setSavedNow] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState(null)

  /* Comprime la foto scelta e la mette nel campo come data URL.
     Il ridimensionamento non è un vezzo: la foto profilo finisce DENTRO il
     documento dell'utente, e la pagina Membri scarica tutti i profili in una
     volta. Una foto da telefono non compressa vorrebbe dire decine di megabyte
     su un elenco di trenta persone, sulla connessione di chi lo apre in giro. */
  async function caricaAvatar(file, input) {
    if (!file) return
    setAvatarError(null)
    setAvatarBusy(true)
    try {
      const esito = await compressAvatar(file)
      setForm((prev) => ({ ...prev, photoURL: esito.dataUrl }))
      setErrors((prev) => ({ ...prev, photoURL: undefined }))
    } catch (err) {
      setAvatarError(err?.message || 'Non riesco a usare questa immagine.')
    } finally {
      setAvatarBusy(false)
      // Senza azzerare, riscegliere lo STESSO file non fa scattare onChange e
      // sembra che il bottone si sia rotto.
      if (input) input.value = ''
    }
  }

  const [photoCheck, setPhotoCheck] = useState('idle') // idle | badUrl | checking | ok | error

  const nameRef = useRef(null)
  const bioRef = useRef(null)
  const photoRef = useRef(null)
  const savedTimer = useRef(null)

  // `dirty` distingue "form mai toccato" da "l'utente sta scrivendo". Serve
  // all'effect di sotto e NON viene mai riazzerato: una volta che l'utente ha
  // scritto qualcosa, nessun aggiornamento del profilo può più sovrascriverlo.
  const dirty = useRef(false)
  const hydratedUid = useRef(null)

  /* Pre-riempimento. `profile` arriva in modo asincrono, quindi lo stato del
     form si inizializza qui e non in useState.

     Tre casi da non sbagliare:
     - l'utente sta già scrivendo -> non tocchiamo niente;
     - il profilo non è ancora arrivato e lo stiamo ancora caricando ->
       aspettiamo, perché riempire ora con i soli dati Google cancellerebbe la
       bio salvata nel momento in cui il documento arriva;
     - cambio di account (uid diverso) -> si ricomincia da zero. */
  useEffect(() => {
    if (!user) return

    const switched = hydratedUid.current !== user.uid
    if (switched) dirty.current = false
    if (!switched && dirty.current) return
    if (profile == null && profileLoading) return

    hydratedUid.current = user.uid
    setForm(formFromProfile(profile, user))
  }, [user, profile, profileLoading])

  // Un timer pendente su un componente smontato scriverebbe su uno stato morto.
  useEffect(() => () => clearTimeout(savedTimer.current), [])

  /* Anteprima della foto. Non basta l'onError di <Avatar> (che ricade sulle
     iniziali in silenzio): qui vogliamo dirlo all'utente. Sondiamo l'URL con
     un Image() fuori dal DOM, con mezzo secondo di debounce per non fare una
     richiesta di rete a ogni tasto. */
  const photoValue = form.photoURL.trim()
  useEffect(() => {
    if (!photoValue) {
      setPhotoCheck('idle')
      return
    }
    if (photoValue.startsWith('data:')) {
      // Foto appena compressa da noi: è già stata decodificata per comprimerla,
      // quindi sondarla di nuovo sarebbe lavoro inutile.
      setPhotoCheck('ok')
      return
    }
    if (!isHttpUrl(photoValue)) {
      setPhotoCheck('badUrl')
      return
    }

    setPhotoCheck('checking')
    let cancelled = false
    const timer = setTimeout(() => {
      const probe = new Image()
      probe.onload = () => {
        if (!cancelled) setPhotoCheck('ok')
      }
      probe.onerror = () => {
        if (!cancelled) setPhotoCheck('error')
      }
      probe.src = photoValue
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [photoValue])

  function update(field) {
    return (event) => {
      dirty.current = true
      const { value } = event.target
      setForm((prev) => ({ ...prev, [field]: value }))
      // L'errore di un campo sparisce appena lo si modifica: tenerlo lì mentre
      // l'utente corregge è solo rumore.
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
      // Anche il messaggio di errore del salvataggio non ha più senso.
      if (saveState === 'error') setSaveState('idle')
    }
  }

  const bioLength = form.bio.length
  const bioRemaining = BIO_MAX - bioLength
  const bioOver = bioRemaining < 0
  const bioWarn = bioRemaining < BIO_WARN_AT

  const saving = saveState === 'saving'

  // Il link ai membri compare dopo il primo salvataggio, ma anche a chi ha già
  // un profilo salvato: è già in quella lista, non ha senso nascondergli la via.
  const canSeeMembers = savedNow || profile != null

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const displayName = form.displayName.trim()
    const photoURL = form.photoURL.trim()
    const nextErrors = {}

    if (!displayName) {
      nextErrors.displayName = 'Serve un nome: è quello con cui compari fra i membri.'
    }
    // Validiamo la lunghezza in JS anche se il textarea ha maxLength: maxLength
    // non tocca i valori impostati da programma, e un profilo salvato prima che
    // il limite esistesse può arrivare già più lungo di BIO_MAX.
    if (bioOver) {
      nextErrors.bio = `La bio supera ${BIO_MAX} caratteri: togline ${Math.abs(bioRemaining)}.`
    }
    if (photoURL && !photoURL.startsWith('data:') && !isHttpUrl(photoURL)) {
      nextErrors.photoURL = 'Il link della foto deve iniziare con http:// o https://.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      // Spostiamo il focus sul primo campo sbagliato: senza questo, chi naviga
      // da tastiera resta in fondo alla pagina e non sa dove sia il problema.
      const first = nextErrors.displayName
        ? nameRef.current
        : nextErrors.bio
          ? bioRef.current
          : photoRef.current
      if (first) first.focus()
      setSaveState('idle')
      return
    }

    clearTimeout(savedTimer.current)
    setSaveState('saving')
    setSaveError(null)

    try {
      await saveUserProfile(user.uid, {
        displayName,
        location: form.location.trim(),
        bio: form.bio.trim(),
        photoURL,
        socials: {
          linkedin: form.linkedin.trim(),
          instagram: form.instagram.trim(),
          other: form.other.trim(),
        },
      })

      // Il profilo in memoria è ora vecchio: navbar e /membri devono vedere i
      // dati nuovi. Se il refresh fallisce il salvataggio è comunque riuscito,
      // quindi l'errore non deve diventare un errore di salvataggio.
      try {
        if (typeof refreshProfile === 'function') await refreshProfile()
      } catch {
        /* ignorato di proposito */
      }

      setSaveState('saved')
      setSavedNow(true)
      savedTimer.current = setTimeout(() => {
        // Il messaggio di conferma resta qualche secondo e poi si toglie di
        // mezzo; il link ai membri invece rimane.
        setSaveState((prev) => (prev === 'saved' ? 'idle' : prev))
      }, SAVED_MESSAGE_MS)
    } catch (err) {
      setSaveError(err)
      setSaveState('error')
    }
  }

  const statusText =
    saveState === 'saving'
      ? 'Sto salvando il profilo…'
      : saveState === 'saved'
        ? 'Profilo salvato. Ora compari fra i membri.'
        : saveState === 'error'
          ? `Salvataggio non riuscito. ${saveErrorText(saveError)}`
          : ''

  const photoMessage =
    photoCheck === 'badUrl'
      ? 'Ci vuole un indirizzo completo, che inizi con http:// o https://.'
      : photoCheck === 'checking'
        ? 'Sto controllando il link…'
        : photoCheck === 'error'
          ? 'Non riesco a caricare quell’immagine. Controlla il link, oppure lascialo vuoto: le iniziali stanno benissimo.'
          : ''

  return (
    <div className="container-narrow">
      <header className={s.head}>
        <h1 id="join-title" className={s.title}>
          Il tuo profilo
        </h1>
        <p className={s.lead}>
          È quello che gli altri vedono nella pagina Membri. Due righe fatte bene valgono più di un
          curriculum.
        </p>
      </header>

      {firebaseMissing && <ConfigNotice />}

      {/* Il profilo può ancora essere in arrivo: lo diciamo invece di mostrare
          un form vuoto che poi si riempie da solo sotto le dita. */}
      {profile == null && profileLoading ? (
        <div className={s.loadingBlocks} aria-hidden="true">
          <Skeleton height="1rem" width="8rem" />
          <Skeleton height="3rem" />
          <Skeleton height="1rem" width="8rem" />
          <Skeleton height="7rem" />
        </div>
      ) : (
        <form className={s.form} onSubmit={handleSubmit} noValidate>
          <fieldset className={s.group}>
            <legend className={s.legend}>Chi sei</legend>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-name`}>
                Nome e cognome
                <span className={s.req} aria-hidden="true">
                  *
                </span>
                <span className="sr-only">{' (obbligatorio)'}</span>
              </label>
              <input
                className={cx(s.input, errors.displayName && s.inputInvalid)}
                id={`${fid}-name`}
                ref={nameRef}
                type="text"
                value={form.displayName}
                onChange={update('displayName')}
                maxLength={80}
                autoComplete="name"
                required
                aria-required="true"
                aria-invalid={errors.displayName ? 'true' : undefined}
                aria-describedby={describedBy(
                  `${fid}-name-hint`,
                  errors.displayName && `${fid}-name-err`,
                )}
              />
              <p className={s.hint} id={`${fid}-name-hint`}>
                Come vuoi essere chiamato. Anche solo il nome va bene.
              </p>
              {errors.displayName && (
                <p className={s.fieldError} id={`${fid}-name-err`}>
                  {errors.displayName}
                </p>
              )}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-place`}>
                Da dove scrivi
              </label>
              <input
                className={s.input}
                id={`${fid}-place`}
                type="text"
                value={form.location}
                onChange={update('location')}
                maxLength={LOCATION_MAX}
                placeholder="Torino"
                /* address-level2 e non "address": non vogliamo l'indirizzo di
                   casa di nessuno, solo la città. Il browser suggerisce la
                   cosa giusta e non compila un modulo di spedizione. */
                autoComplete="address-level2"
                aria-describedby={`${fid}-place-hint`}
              />
              <p className={s.hint} id={`${fid}-place-hint`}>
                La città o la zona, non l’indirizzo. Serve a far vedere che YET non è solo torinese
                e a farti trovare da chi ti sta vicino. Puoi lasciarlo vuoto.
              </p>
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-bio`}>
                Due righe su di te
              </label>
              <textarea
                className={cx(s.input, s.textarea, (errors.bio || bioOver) && s.inputInvalid)}
                id={`${fid}-bio`}
                ref={bioRef}
                rows={5}
                value={form.bio}
                onChange={update('bio')}
                maxLength={BIO_MAX}
                aria-invalid={errors.bio || bioOver ? 'true' : undefined}
                aria-describedby={describedBy(
                  `${fid}-bio-hint`,
                  `${fid}-bio-count`,
                  errors.bio && `${fid}-bio-err`,
                )}
              />
              <div className={s.bioFoot}>
                <p className={s.hint} id={`${fid}-bio-hint`}>
                  Cosa stai costruendo, o cosa vorresti costruire.
                </p>
                {/* Nessun aria-live su questo contatore: cambiando a ogni tasto
                    farebbe parlare lo screen reader sopra alla digitazione.
                    È in aria-describedby del campo, quindi viene letto quando
                    il campo prende il focus, che è il momento utile. */}
                <p
                  className={cx(s.count, bioWarn && s.countWarn, bioOver && s.countOver)}
                  id={`${fid}-bio-count`}
                >
                  <span aria-hidden="true">
                    {bioLength}/{BIO_MAX}
                  </span>
                  <span className="sr-only">
                    {bioLength} caratteri su {BIO_MAX} disponibili
                  </span>
                </p>
              </div>
              {errors.bio && (
                <p className={s.fieldError} id={`${fid}-bio-err`}>
                  {errors.bio}
                </p>
              )}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-photo`}>
                Foto del profilo (link)
              </label>
              <div className={s.photoRow}>
                <div className={s.photoPreview}>
                  <Avatar
                    src={photoValue.startsWith('data:') || isHttpUrl(photoValue) ? photoValue : ''}
                    name={form.displayName || (user && user.displayName) || 'Tu'}
                    size={80}
                  />
                </div>
                <div className={s.photoCol}>
                  {/* Il caricamento viene PRIMA del campo indirizzo, perché è
                      quello che quasi tutti vogliono fare: incollare il link di
                      una foto è il ripiego, non il percorso principale. */}
                  <div className={s.photoUpload}>
                    <label className={s.photoFileLabel}>
                      <input
                        className={s.photoFile}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={saving || avatarBusy}
                        onChange={(e) => caricaAvatar(e.target.files?.[0], e.target)}
                      />
                      <span className={s.photoFileButton}>
                        {avatarBusy ? 'Preparo la foto…' : 'Carica una foto'}
                      </span>
                    </label>
                    {form.photoURL && (
                      <button
                        type="button"
                        className={s.photoRemove}
                        onClick={() => setForm((prev) => ({ ...prev, photoURL: '' }))}
                        disabled={saving || avatarBusy}
                      >
                        Togli
                      </button>
                    )}
                  </div>

                  {avatarError && (
                    <p className={s.fieldError} role="alert">
                      {avatarError}
                    </p>
                  )}

                  <input
                    className={cx(s.input, errors.photoURL && s.inputInvalid)}
                    id={`${fid}-photo`}
                    ref={photoRef}
                    type="url"
                    inputMode="url"
                    value={form.photoURL}
                    onChange={update('photoURL')}
                    placeholder="https://.../foto.jpg"
                    autoComplete="off"
                    spellCheck="false"
                    aria-invalid={errors.photoURL ? 'true' : undefined}
                    aria-describedby={describedBy(
                      `${fid}-photo-hint`,
                      photoMessage && `${fid}-photo-note`,
                      errors.photoURL && `${fid}-photo-err`,
                    )}
                  />
                  <p className={s.hint} id={`${fid}-photo-hint`}>
                    Facoltativo: se non metti niente usiamo le tue iniziali. Puoi caricare una foto
                    dal dispositivo oppure incollare qui sopra l’indirizzo di una già online. Le
                    foto caricate vengono ritagliate quadrate e rimpicciolite a{' '}
                    {humanBytes(AVATAR_MAX_BYTES)}.
                  </p>
                  {photoMessage && (
                    <p className={s.photoNote} id={`${fid}-photo-note`}>
                      {photoMessage}
                    </p>
                  )}
                  {errors.photoURL && (
                    <p className={s.fieldError} id={`${fid}-photo-err`}>
                      {errors.photoURL}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className={s.group}>
            <legend className={s.legend}>Dove trovarti</legend>
            <p className={s.groupHint}>
              Tutti facoltativi. Servono a chi vede il tuo progetto e vuole scriverti.
            </p>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-linkedin`}>
                LinkedIn
              </label>
              <input
                className={s.input}
                id={`${fid}-linkedin`}
                type="text"
                value={form.linkedin}
                onChange={update('linkedin')}
                placeholder="https://www.linkedin.com/in/nomecognome"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-instagram`}>
                Instagram
              </label>
              <input
                className={s.input}
                id={`${fid}-instagram`}
                type="text"
                value={form.instagram}
                onChange={update('instagram')}
                placeholder="@nomeutente"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-other`}>
                Altro
              </label>
              <input
                className={s.input}
                id={`${fid}-other`}
                type="text"
                value={form.other}
                onChange={update('other')}
                placeholder="https://ilmiosito.it, o GitHub, o TikTok"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </fieldset>

          <div className={s.actions}>
            <button
              type="submit"
              className={s.primary}
              disabled={saving || firebaseMissing}
              aria-busy={saving || undefined}
            >
              {saving ? 'Salvataggio…' : profile ? 'Salva le modifiche' : 'Crea il mio profilo'}
            </button>

            {canSeeMembers && (
              <Link className={s.secondary} to="/membri">
                Vedi il tuo profilo tra i membri
              </Link>
            )}
          </div>

          {/* Sempre presente, anche vuoto: vedi la nota sullo status di JoinPitch. */}
          <p
            className={cx(
              s.status,
              saveState === 'saved' && s.statusOk,
              saveState === 'error' && s.statusError,
            )}
            role="status"
          >
            {statusText}
          </p>
        </form>
      )}

      {/* Stato della richiesta.
          Senza questo riquadro, chi si iscrive salva il profilo, va su /membri,
          non si trova e pensa che il sito sia rotto. Dirglielo qui è metà del
          lavoro dell'approvazione. */}
      {profile?.status === 'pending' && (
        <div className={s.statusBox}>
          <p className={s.statusBoxTitle}>Richiesta inviata, in attesa di approvazione</p>
          <p className={s.statusBoxText}>
            Il tuo profilo è arrivato agli organizzatori. Finché non lo approvano non compare fra i
            membri e non lo vede nessun altro: puoi comunque modificarlo quando vuoi da questa
            pagina, e le modifiche restano.
          </p>
        </div>
      )}

      {profile?.status === 'rejected' && (
        <div className={`${s.statusBox} ${s.statusBoxRejected}`}>
          <p className={s.statusBoxTitle}>Richiesta non approvata</p>
          <p className={s.statusBoxText}>
            Al momento il tuo profilo non è pubblicato fra i membri. Se pensi che sia un errore, o
            vuoi capire perché, scrivici: la decisione non è definitiva e si può rivedere.
          </p>
        </div>
      )}

      {/* Fuori dal <form>: è un'azione a sé, irreversibile, e non deve poter
          partire per un Invio premuto dentro un campo del profilo. Compare
          solo a chi un profilo ce l'ha già, a chi non l'ha ancora creato non
          serve un bottone per cancellarlo. */}
      {profile && !firebaseMissing && <DeleteAccount />}
    </div>
  )
}
