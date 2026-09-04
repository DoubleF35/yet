import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Avatar from '../components/Avatar.jsx'
import DeleteAccount from '../components/DeleteAccount.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import WhatsAppCta from '../components/WhatsAppCta.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { authErrorText, isInAppBrowser, useAuth } from '../lib/auth.jsx'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'
import { memberPath } from '../lib/members.jsx'
import {
  BIO_MAX,
  LOCATION_MAX,
  LOOKING_MAX,
  PROJECT_MAX,
  SKILLS_MAX,
  saveUserProfile,
} from '../lib/db.js'
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
const LOGO_SRC = `${import.meta.env.BASE_URL}logo-light.png`

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

// `t` come primo argomento e non un hook dentro: questa funzione sta fuori dal
// componente perché è pura, ed è il posto giusto per lei. Chi la chiama ha già
// `t` sotto mano.
function saveErrorText(t, err) {
  const code = err && typeof err === 'object' ? err.code : ''
  switch (code) {
    case 'permission-denied':
      /* Il messaggio è lungo di proposito, vedi join.salvataggio.permessi nel
         catalogo: "le regole non permettono questa operazione" è vero e
         inutile, e la causa vera è quasi sempre una sola. */
      return t('join.salvataggio.permessi')
    case 'unavailable':
    case 'deadline-exceeded':
      return t('join.salvataggio.lento')
    case 'unauthenticated':
      return t('join.salvataggio.sessione')
    default:
      /* Un errore che porta con sé una chiave (li lancia lib/db.js: la foto
         troppo grande, per esempio) vince sul suo messaggio. */
      return messaggioErrore(t, err, 'join.salvataggio.generico')
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
  const { t } = useI18n()

  return (
    <p className={s.configNotice}>
      <strong>{t('join.configTitolo')}</strong> {t('join.configTesto1')}{' '}
      <code>VITE_FIREBASE_*</code> {t('join.configTesto2')}
    </p>
  )
}

/** Primo istante: onAuthStateChanged non ha ancora risposto. */
function JoinLoading() {
  const { t } = useI18n()

  return (
    <div className="container">
      <header className={s.head}>
        <img className={s.mark} src={LOGO_SRC} alt="YET" />
        <h1 id="join-title" className={s.title}>
          {t('join.titolo')}
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
        {t('join.liveControllo')}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------------- */

/** Faccia A, visitatore non autenticato. */
function JoinPitch({ firebaseMissing }) {
  const { signIn, error } = useAuth()
  const { t } = useI18n()
  const [pending, setPending] = useState(false)
  const [localError, setLocalError] = useState(null)

  /* Calcolato una volta sola: lo user agent non cambia durante la visita, e
     rifarlo a ogni render sarebbe lavoro buttato. */
  const [inApp] = useState(isInAppBrowser)


  /* I cinque punti. Il numero è decorazione, il testo sta nel catalogo: qui
     resta solo l'ordine, che è una decisione di contenuto.
     Il primo punto riusa la descrizione lunga del club, la stessa della home:
     due copie della stessa presentazione divergerebbero al primo ritocco. */
  const points = [
    { n: '01', title: t('join.punti.chiSiamo.titolo'), text: t('community.descrizione') },
    {
      n: '02',
      title: t('join.punti.perChi.titolo'),
      text: t('join.punti.perChi.testo', {
        eta: t('community.fasciaEta'),
        citta: t('community.citta'),
      }),
    },
    { n: '03', title: t('join.punti.cosaSiFa.titolo'), text: t('join.punti.cosaSiFa.testo') },
    {
      n: '04',
      title: t('join.punti.comeSiEntra.titolo'),
      text: t('join.punti.comeSiEntra.testo'),
    },
    { n: '05', title: t('join.punti.seNonHai.titolo'), text: t('join.punti.seNonHai.testo') },
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
    ? t('join.aperturaGoogle')
    : shownError
      ? authErrorText(t, shownError)
      : ''

  return (
    <div className="container">
      <header className={s.head}>
        <img className={s.mark} src={LOGO_SRC} alt="YET" />
        <h1 id="join-title" className={s.title}>
          {t('join.titolo')}
        </h1>
        <p className={s.lead}>{t('community.descrizioneBreve')}</p>
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
        {/* Avviso PRIMA del tentativo, non dopo: dentro il browser interno di
            un'app Google rifiuta l'accesso a prescindere, e farlo scoprire con
            un errore dopo il tocco e' solo un giro in piu'. Il bottone resta
            attivo perche' il riconoscimento guarda lo user agent e puo'
            sbagliare: non gli lasciamo il potere di bloccare l'accesso. */}
        {inApp && (
          <p className={s.inAppNotice} role="note">
            <strong>{t('join.inAppTitolo')}</strong> {t('join.inAppTesto')}
          </p>
        )}

        <button
          type="button"
          className={s.primary}
          onClick={handleSignIn}
          disabled={pending || firebaseMissing}
          aria-busy={pending || undefined}
        >
          {pending ? t('nav.attendi') : t('gate.accediGoogle')}
        </button>

        <p className={s.ctaNote}>{t('join.ctaNota')}</p>

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
  project: '',
  looking: '',
  skills: '',
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
    /* Su un documento nato prima che questi campi esistessero sono assenti,
       non vuoti: il `|| ''` è quello che tiene il textarea controllato invece
       di farlo passare a undefined, che React tratta come non controllato e
       che fa perdere il valore al primo tasto. */
    project: (profile && profile.project) || '',
    looking: (profile && profile.looking) || '',
    skills: (profile && profile.skills) || '',
    photoURL: (profile && profile.photoURL) || (user && user.photoURL) || '',
    linkedin: socials.linkedin || '',
    instagram: socials.instagram || '',
    other: socials.other || '',
  }
}

/** Faccia B, utente autenticato: crea o aggiorna il proprio profilo. */
function ProfileForm({ firebaseMissing }) {
  const { user, profile, profileLoading, refreshProfile } = useAuth()
  const { t } = useI18n()
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
      setAvatarError(messaggioErrore(t, err, 'join.form.fotoNonUsabile'))
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
      nextErrors.displayName = t('join.form.nomeErrore')
    }
    // Validiamo la lunghezza in JS anche se il textarea ha maxLength: maxLength
    // non tocca i valori impostati da programma, e un profilo salvato prima che
    // il limite esistesse può arrivare già più lungo di BIO_MAX.
    if (bioOver) {
      nextErrors.bio = t('join.form.bioErrore', {
        max: BIO_MAX,
        troppi: Math.abs(bioRemaining),
      })
    }
    if (photoURL && !photoURL.startsWith('data:') && !isHttpUrl(photoURL)) {
      nextErrors.photoURL = t('join.form.fotoErrore')
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
        project: form.project.trim(),
        looking: form.looking.trim(),
        skills: form.skills.trim(),
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
      ? t('join.form.statoSalvando')
      : saveState === 'saved'
        ? t('join.form.statoSalvato')
        : saveState === 'error'
          ? t('join.form.statoErrore', { dettaglio: saveErrorText(t, saveError) })
          : ''

  const photoMessage =
    photoCheck === 'badUrl'
      ? t('join.form.fotoIncompleto')
      : photoCheck === 'checking'
        ? t('join.form.fotoControllo')
        : photoCheck === 'error'
          ? t('join.form.fotoNonCarica')
          : ''

  return (
    <div className="container-narrow">
      <header className={s.head}>
        <h1 id="join-title" className={s.title}>
          {t('join.form.titolo')}
        </h1>
        <p className={s.lead}>{t('join.form.lead')}</p>
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
            <legend className={s.legend}>{t('join.form.chiSei')}</legend>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-name`}>
                {t('join.form.nome')}
                <span className={s.req} aria-hidden="true">
                  *
                </span>
                <span className="sr-only">{t('join.form.obbligatorio')}</span>
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
                {t('join.form.nomeHint')}
              </p>
              {errors.displayName && (
                <p className={s.fieldError} id={`${fid}-name-err`}>
                  {errors.displayName}
                </p>
              )}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-place`}>
                {t('join.form.luogo')}
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
                {t('join.form.luogoHint')}
              </p>
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-bio`}>
                {t('join.form.bio')}
              </label>
              <textarea
                className={cx(s.input, s.textarea, (errors.bio || bioOver) && s.inputInvalid)}
                id={`${fid}-bio`}
                ref={bioRef}
                rows={9}
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
                  {t('join.form.bioHint')}
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
                    {t('join.form.bioConteggio', { n: bioLength, max: BIO_MAX })}
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
                {t('join.form.foto')}
              </label>
              <div className={s.photoRow}>
                <div className={s.photoPreview}>
                  <Avatar
                    src={photoValue.startsWith('data:') || isHttpUrl(photoValue) ? photoValue : ''}
                    name={form.displayName || (user && user.displayName) || t('join.form.fotoNomeTu')}
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
                        {avatarBusy ? t('join.form.preparoFoto') : t('join.form.caricaFoto')}
                      </span>
                    </label>
                    {form.photoURL && (
                      <button
                        type="button"
                        className={s.photoRemove}
                        onClick={() => setForm((prev) => ({ ...prev, photoURL: '' }))}
                        disabled={saving || avatarBusy}
                      >
                        {t('join.form.togli')}
                      </button>
                    )}
                  </div>

                  {avatarError && (
                    <p className={s.fieldError} role="alert">
                      {avatarError}
                    </p>
                  )}

                  {/* Con una foto caricata il campo indirizzo sparisce.
                      Non è cosmesi: un data URL compresso sono decine di
                      migliaia di caratteri, e riversarli in un input a riga
                      singola rende il campo inutilizzabile, con il cursore che
                      scorre all'infinito su base64 illeggibile. */}
                  {form.photoURL.startsWith('data:') ? (
                    <p className={s.hint}>
                      {t('join.form.fotoCaricata', { peso: humanBytes(form.photoURL.length) })}
                    </p>
                  ) : (
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
                  )}
                  <p className={s.hint} id={`${fid}-photo-hint`}>
                    {t('join.form.fotoHint', { peso: humanBytes(AVATAR_MAX_BYTES) })}
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

          {/* I tre campi che rendono la vetrina utile per FARSI TROVARE e non
              solo per essere elencati: sono le domande a cui un altro membro
              cerca risposta prima di scriverti. Corti di proposito, e tutti
              facoltativi: un profilo con solo il nome e la bio deve restare
              legittimo. Si vedono nella pagina del profilo, non nella
              tessera. */}
          <fieldset className={s.group}>
            <legend className={s.legend}>{t('join.form.cosaFai')}</legend>
            <p className={s.groupHint}>{t('join.form.cosaFaiHint')}</p>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-project`}>
                {t('join.form.project')}
              </label>
              <textarea
                className={cx(s.input, s.textarea)}
                id={`${fid}-project`}
                rows={4}
                value={form.project}
                onChange={update('project')}
                maxLength={PROJECT_MAX}
                aria-describedby={`${fid}-project-hint`}
              />
              <p className={s.hint} id={`${fid}-project-hint`}>
                {t('join.form.projectHint')}
              </p>
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-looking`}>
                {t('join.form.looking')}
              </label>
              <textarea
                className={cx(s.input, s.textarea, s.textareaShort)}
                id={`${fid}-looking`}
                rows={3}
                value={form.looking}
                onChange={update('looking')}
                maxLength={LOOKING_MAX}
                aria-describedby={`${fid}-looking-hint`}
              />
              <p className={s.hint} id={`${fid}-looking-hint`}>
                {t('join.form.lookingHint')}
              </p>
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-skills`}>
                {t('join.form.skills')}
              </label>
              <textarea
                className={cx(s.input, s.textarea, s.textareaShort)}
                id={`${fid}-skills`}
                rows={3}
                value={form.skills}
                onChange={update('skills')}
                maxLength={SKILLS_MAX}
                aria-describedby={`${fid}-skills-hint`}
              />
              <p className={s.hint} id={`${fid}-skills-hint`}>
                {t('join.form.skillsHint')}
              </p>
            </div>
          </fieldset>

          <fieldset className={s.group}>
            <legend className={s.legend}>{t('join.form.doveTrovarti')}</legend>
            <p className={s.groupHint}>{t('join.form.doveTrovartiHint')}</p>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-linkedin`}>
                {t('social.linkedin')}
              </label>
              {/* `type="text"` e non `url` di proposito: questi campi accettano
                  anche un handle nudo ("mario-rossi") e la validazione del
                  browser lo rifiuterebbe. Il resto degli attributi però serve,
                  e serve SOLO sul telefono: `inputMode` dà la tastiera con lo
                  slash e il punto invece di quella per le frasi, e senza
                  autoCapitalize/autoCorrect iOS scrive "Mario-rossi" con la
                  maiuscola. Da quell'handle esce
                  linkedin.com/in/Mario-rossi, che è un 404: il link finisce
                  nella pagina Vetrina e non porta da nessuna parte. */}
              <input
                className={s.input}
                id={`${fid}-linkedin`}
                type="text"
                inputMode="url"
                value={form.linkedin}
                onChange={update('linkedin')}
                placeholder={t('join.form.linkedinPlaceholder')}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-instagram`}>
                {t('social.instagram')}
              </label>
              <input
                className={s.input}
                id={`${fid}-instagram`}
                type="text"
                inputMode="url"
                value={form.instagram}
                onChange={update('instagram')}
                placeholder={t('join.form.instagramPlaceholder')}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor={`${fid}-other`}>
                {t('join.form.altro')}
              </label>
              <input
                className={s.input}
                id={`${fid}-other`}
                type="text"
                inputMode="url"
                value={form.other}
                onChange={update('other')}
                placeholder={t('join.form.altroPlaceholder')}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
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
              {saving
                ? t('join.form.inCorso')
                : profile
                  ? t('join.form.salva')
                  : t('join.form.crea')}
            </button>

            {/* Porta alla PAGINA del proprio profilo e non piu' all'elenco:
                "vedi il tuo profilo" che apriva la vetrina obbligava a
                cercarsi in mezzo agli altri. Da qui si vede esattamente
                quello che vedono gli altri aprendo la tessera. */}
            {canSeeMembers && (
              <Link className={s.secondary} to={memberPath(user.uid)}>
                {t('join.form.vediComeTiVedono')}
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
          <p className={s.statusBoxTitle}>{t('join.form.attesaTitolo')}</p>
          <p className={s.statusBoxText}>{t('join.form.attesaTesto')}</p>
        </div>
      )}

      {profile?.status === 'rejected' && (
        <div className={`${s.statusBox} ${s.statusBoxRejected}`}>
          <p className={s.statusBoxTitle}>{t('join.form.rifiutataTitolo')}</p>
          <p className={s.statusBoxText}>{t('join.form.rifiutataTesto')}</p>
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
