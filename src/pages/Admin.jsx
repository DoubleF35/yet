import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import AttachmentEditor from '../components/AttachmentEditor.jsx'
import PendingRequests from '../components/PendingRequests.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { useAuth } from '../lib/auth.jsx'
import { BODY_MAX, createNews, deleteNews, formatDate, listenNews, updateNews } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import s from './Admin.module.css'

/* Limite del titolo: non è una regola di Firestore, è una scelta editoriale.
   Un titolo più lungo di così va a capo tre volte nella card della home. */
const TITLE_MAX = 120

/* Il limite del corpo vive in lib/db.js accanto a quello delle regole. Lo
   rispecchiamo nel form perché scoprirlo DOPO aver scritto ventimila caratteri,
   sotto forma di "permission-denied", sarebbe crudele. */

const EMPTY_DRAFT = { title: '', body: '', published: false, attachments: [] }

/* Traduce un errore Firebase in una frase che dice anche COSA FARE.
   `permission-denied` è l'errore che farà chiunque configuri il progetto la
   prima volta: l'email è in src/config/admins.js (che nasconde solo il menu)
   ma non nella allowlist di firestore.rules (che è la protezione vera). */
function describeError(error) {
  const code = error?.code ?? ''
  const message = error?.message ?? ''

  if (code.includes('permission-denied') || /insufficient permissions/i.test(message)) {
    return (
      'Firestore ha rifiutato la scrittura. Con ogni probabilità la tua email non è nella ' +
      'allowlist di firestore.rules: aggiungerla in src/config/admins.js non basta, quel file ' +
      'decide solo cosa si vede, le regole decidono cosa si può scrivere. Ricordati di ' +
      'ripubblicare le regole dopo la modifica.'
    )
  }
  if (code.includes('unauthenticated')) {
    return 'La sessione è scaduta. Esci e accedi di nuovo, poi riprova.'
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Firestore non risponde. Controlla la connessione e riprova.'
  }
  if (code.includes('not-found')) {
    return 'La notizia non esiste più: forse è stata eliminata da un altro admin.'
  }
  return message || 'Errore inatteso durante l’operazione.'
}

/* Validazione condivisa fra il form di creazione e l'editing in linea, così le
   due strade non possono divergere. */
function validateDraft(draft) {
  const errors = {}
  if (!draft.title.trim()) errors.title = 'Il titolo è obbligatorio.'
  if (!draft.body.trim()) errors.body = 'Il corpo della notizia è obbligatorio.'
  /* maxLength sulla textarea ferma la digitazione ma NON un incolla da
     programma, e non vale per il testo già presente in una notizia vecchia.
     Il controllo esplicito è quello che evita di scoprire il limite come
     "permission-denied" dopo aver premuto Salva. */
  if (draft.body.trim().length > BODY_MAX) {
    errors.body = `Il corpo supera i ${BODY_MAX.toLocaleString('it-IT')} caratteri: accorcialo di ${(
      draft.body.trim().length - BODY_MAX
    ).toLocaleString('it-IT')}.`
  }
  return errors
}

export default function Admin() {
  /* RequireAdmin ha già fatto il controllo dei permessi: qui non lo ripetiamo.
     Ma `user` va comunque letto e trattato come potenzialmente null: durante un
     logout la rotta resta montata per un frame prima che RequireAdmin cambi
     schermata, e in quel frame l'autore della notizia non esiste. */
  const { user, profile } = useAuth()

  const [form, setForm] = useState(EMPTY_DRAFT)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(null)

  const [news, setNews] = useState([])
  const [listState, setListState] = useState('loading') // loading | ready | error | unconfigured
  const [listError, setListError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(EMPTY_DRAFT)
  const [editErrors, setEditErrors] = useState({})

  const [confirmId, setConfirmId] = useState(null)
  /* Stato PER RIGA e non globale: con un solo flag "busy" l'utente non capisce
     quale notizia sta salvando, e con un solo errore non capisce quale ha
     fallito. Le mappe sono id -> valore. */
  const [rowBusy, setRowBusy] = useState({})
  const [rowErrors, setRowErrors] = useState({})

  const titleRef = useRef(null)
  const bodyRef = useRef(null)
  const editTitleRef = useRef(null)
  /* Quando un bottone viene sostituito dal suo pannello di conferma o dal form
     di editing, il focus cadrebbe sul <body> e chi naviga da tastiera si
     perderebbe. Teniamo un riferimento al bottone che ha aperto il pannello per
     riportarci il focus alla chiusura. */
  const editButtonRefs = useRef(new Map())
  const deleteButtonRefs = useRef(new Map())

  const author = useMemo(() => {
    const uid = user?.uid ?? null
    const name = profile?.displayName || user?.displayName || user?.email || 'Redazione YET'
    /* Passiamo il nome in due forme perché db.js può leggere `displayName`
       (trattando `author` come un utente) oppure già `authorName`: così la
       chiamata regge in entrambi i casi senza indovinare. */
    return { uid, displayName: name, authorUid: uid, authorName: name, email: user?.email ?? null }
  }, [user, profile])

  // --- lista: sottoscrizione con cleanup -----------------------------------
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setListState('unconfigured')
      return undefined
    }

    setListState('loading')
    setListError(null)

    let cancelled = false
    let unsubscribe

    const onData = (items) => {
      if (cancelled) return
      setNews(Array.isArray(items) ? items : [])
      setListState('ready')
    }
    const onError = (error) => {
      if (cancelled) return
      setListError(describeError(error))
      setListState('error')
    }

    try {
      unsubscribe = listenNews({ onlyPublished: false }, onData, onError)
    } catch (error) {
      // Se la query è malformata onSnapshot lancia in modo sincrono.
      onError(error)
    }

    return () => {
      // `cancelled` oltre all'unsubscribe: onSnapshot può avere una callback
      // già in volo quando smontiamo, e un setState dopo lo smontaggio è un leak.
      cancelled = true
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [reloadKey])

  /* Ogni modifica al form spegne la conferma precedente: una scritta
     "Bozza salvata" accanto a un testo nuovo appena digitato è un'informazione
     falsa. L'errore invece resta finché non si riprova. */
  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setFormSuccess(null)
  }, [])

  const setBusy = useCallback((id, value) => {
    setRowBusy((prev) => {
      const next = { ...prev }
      if (value) next[id] = value
      else delete next[id]
      return next
    })
  }, [])

  const setRowError = useCallback((id, message) => {
    setRowErrors((prev) => {
      const next = { ...prev }
      if (message) next[id] = message
      else delete next[id]
      return next
    })
  }, [])

  // --- creazione -----------------------------------------------------------
  async function handleCreate(event) {
    event.preventDefault()

    const errors = validateDraft(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      // Il focus va sul primo campo sbagliato, altrimenti chi usa uno screen
      // reader sente l'errore ma non sa dove tornare.
      if (errors.title) titleRef.current?.focus()
      else bodyRef.current?.focus()
      return
    }

    if (!author.uid) {
      setFormError('Utente non disponibile: ricarica la pagina e accedi di nuovo.')
      return
    }

    setSaving(true)
    setFormError(null)
    setFormSuccess(null)
    const wasPublished = form.published
    try {
      await createNews(
        {
          title: form.title.trim(),
          body: form.body.trim(),
          published: wasPublished,
          attachments: form.attachments,
        },
        author,
      )
      setForm(EMPTY_DRAFT)
      setFormErrors({})
      setFormSuccess(
        wasPublished
          ? 'Notizia pubblicata: è già visibile sul sito.'
          : 'Bozza salvata. Non si vede sul sito finché non la pubblichi da qui sotto.',
      )
      titleRef.current?.focus()
    } catch (error) {
      setFormError(describeError(error))
    } finally {
      // In finally e non nel try: se la scrittura fallisce il bottone deve
      // tornare attivo, altrimenti la pagina resta bloccata e serve un refresh.
      setSaving(false)
    }
  }

  // --- azioni per riga -----------------------------------------------------
  async function handleTogglePublished(item) {
    setRowError(item.id, null)
    setBusy(item.id, item.published ? 'hide' : 'publish')
    try {
      await updateNews(item.id, { published: !item.published })
    } catch (error) {
      setRowError(item.id, describeError(error))
    } finally {
      setBusy(item.id, null)
    }
  }

  function startEditing(item) {
    setConfirmId(null)
    setEditErrors({})
    setRowError(item.id, null)
    setEditingId(item.id)
    setEditDraft({
      title: item.title ?? '',
      body: item.body ?? '',
      attachments: Array.isArray(item.attachments) ? item.attachments : [],
      published: Boolean(item.published),
    })
  }

  const cancelEditing = useCallback((id) => {
    // Annulla = i valori originali restano quelli del documento: l'editing
    // lavora su una copia (editDraft), quindi basta buttarla via.
    setEditingId(null)
    setEditDraft(EMPTY_DRAFT)
    setEditErrors({})
    requestAnimationFrame(() => editButtonRefs.current.get(id)?.focus())
  }, [])

  async function handleSaveEdit(event, item) {
    event.preventDefault()

    const errors = validateDraft(editDraft)
    setEditErrors(errors)
    if (Object.keys(errors).length > 0) {
      editTitleRef.current?.focus()
      return
    }

    setRowError(item.id, null)
    setBusy(item.id, 'save')
    try {
      await updateNews(item.id, {
        title: editDraft.title.trim(),
        body: editDraft.body.trim(),
        attachments: editDraft.attachments,
        published: editDraft.published,
      })
      setEditingId(null)
      setEditDraft(EMPTY_DRAFT)
      requestAnimationFrame(() => editButtonRefs.current.get(item.id)?.focus())
    } catch (error) {
      // Restiamo in editing: il testo appena scritto non va perso.
      setRowError(item.id, describeError(error))
    } finally {
      setBusy(item.id, null)
    }
  }

  const cancelConfirm = useCallback((id) => {
    setConfirmId(null)
    requestAnimationFrame(() => deleteButtonRefs.current.get(id)?.focus())
  }, [])

  async function handleDelete(item) {
    setRowError(item.id, null)
    setBusy(item.id, 'delete')
    try {
      await deleteNews(item.id)
      setConfirmId(null)
      if (editingId === item.id) setEditingId(null)
      // Nessun setBusy(null) in caso di successo servirebbe — la riga sparisce
      // dallo snapshot — ma lo facciamo nel finally per non lasciare voci
      // orfane nella mappa se il documento tornasse (undo lato server).
    } catch (error) {
      setRowError(item.id, describeError(error))
      setConfirmId(null)
      requestAnimationFrame(() => deleteButtonRefs.current.get(item.id)?.focus())
    } finally {
      setBusy(item.id, null)
    }
  }

  const drafts = news.filter((item) => !item.published).length

  return (
    <div className={s.page}>
      <div className="container">
        <header className={s.head}>
          <p className={s.eyebrow}>Area riservata</p>
          <h1>Redazione</h1>
          <p className={s.lead}>
            Da qui si scrivono le notizie che compaiono sulla home. Le bozze restano visibili solo
            in questa pagina.
          </p>

          {/* Promemoria per chi arriva qui fra sei mesi: i due posti da toccare
              sono due, e solo uno protegge davvero i dati. */}
          <p className={s.note}>
            Gli admin si impostano in <code>src/config/admins.js</code> <strong>e</strong> in{' '}
            <code>firestore.rules</code> — le regole sono la protezione vera. Il primo file decide
            solo chi vede questa pagina; senza la mail nella allowlist delle regole ogni scrittura
            viene rifiutata.
          </p>
        </header>

        {listState === 'unconfigured' && (
          <p className={s.warning} role="alert">
            Firebase non è configurato: mancano le variabili <code>VITE_FIREBASE_*</code>. Copia{' '}
            <code>.env.example</code> in <code>.env</code> e riavvia il server di sviluppo. Finché
            manca la configurazione questa pagina non può leggere né scrivere niente.
          </p>
        )}

        {/* 1. Richieste di iscrizione -----------------------------------
            Prima delle notizie di proposito: è l'unica cosa in questa pagina
            in cui qualcuno sta aspettando una risposta. Una notizia può
            attendere domani, una persona in coda no. */}
        {isFirebaseConfigured && <PendingRequests />}

        <HandsDivider />

        {/* 2. Nuova notizia --------------------------------------------- */}
        <section className={s.section} aria-labelledby="nuova-notizia">
          <h2 id="nuova-notizia" className={s.sectionTitle}>
            Nuova notizia
          </h2>

          <form className={s.form} onSubmit={handleCreate} noValidate>
            <div className={s.field}>
              <div className={s.labelRow}>
                <label className={s.label} htmlFor="news-title">
                  Titolo
                </label>
                <span className={s.counter} aria-hidden="true">
                  {form.title.length}/{TITLE_MAX}
                </span>
              </div>
              <input
                id="news-title"
                ref={titleRef}
                className={`${s.input} ${formErrors.title ? s.inputInvalid : ''}`}
                type="text"
                value={form.title}
                maxLength={TITLE_MAX}
                autoComplete="off"
                aria-invalid={formErrors.title ? 'true' : undefined}
                aria-describedby={formErrors.title ? 'news-title-error' : undefined}
                onChange={(e) => {
                  updateForm({ title: e.target.value })
                  if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: undefined }))
                }}
                disabled={saving}
              />
              {formErrors.title && (
                <p className={s.fieldError} id="news-title-error">
                  {formErrors.title}
                </p>
              )}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="news-body">
                Corpo
              </label>
              <textarea
                id="news-body"
                ref={bodyRef}
                className={`${s.textarea} ${formErrors.body ? s.inputInvalid : ''}`}
                rows={12}
                value={form.body}
                aria-invalid={formErrors.body ? 'true' : undefined}
                aria-describedby={formErrors.body ? 'news-body-error news-body-hint' : 'news-body-hint'}
                maxLength={BODY_MAX}
                onChange={(e) => {
                  updateForm({ body: e.target.value })
                  if (formErrors.body) setFormErrors((prev) => ({ ...prev, body: undefined }))
                }}
                disabled={saving}
              />
              <p className={s.hint} id="news-body-hint">
                Gli a-capo vengono rispettati. Niente HTML: il testo viene mostrato così com’è.
              </p>
              {formErrors.body && (
                <p className={s.fieldError} id="news-body-error">
                  {formErrors.body}
                </p>
              )}
            </div>

            <div className={s.field}>
              <span className={s.label}>Allegati</span>
              <AttachmentEditor
                value={form.attachments}
                onChange={(next) => updateForm({ attachments: next })}
                disabled={saving}
              />
            </div>

            <div className={s.field}>
              <label className={s.check} htmlFor="news-published">
                <input
                  id="news-published"
                  className={s.checkbox}
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => updateForm({ published: e.target.checked })}
                  disabled={saving}
                />
                <span>
                  <span className={s.checkLabel}>Pubblicata</span>
                  <span className={s.hint}>
                    Se la lasci spenta la notizia resta una bozza, visibile solo qui.
                  </span>
                </span>
              </label>
            </div>

            <div className={s.actions}>
              <button
                type="submit"
                className={`${s.btn} ${s.primary}`}
                /* Disabilitato durante l'invio: due click = due notizie. */
                disabled={saving || !isFirebaseConfigured}
              >
                {saving ? 'Salvataggio…' : 'Salva notizia'}
              </button>
              {(form.title || form.body || form.published || form.attachments.length > 0) && !saving && (
                <button
                  type="button"
                  className={s.btn}
                  onClick={() => {
                    setForm(EMPTY_DRAFT)
                    setFormErrors({})
                    setFormSuccess(null)
                    setFormError(null)
                    titleRef.current?.focus()
                  }}
                >
                  Svuota
                </button>
              )}
            </div>

            {/* Due live region distinte: `status` non interrompe la lettura in
                corso, `alert` sì. La region del successo è sempre nel DOM —
                se comparisse solo al momento del successo alcuni screen reader
                non la annuncerebbero — e si nasconde da sola quando è vuota. */}
            <p className={s.statusLine} role="status">
              {formSuccess ? <span className={s.success}>{formSuccess}</span> : null}
            </p>
            {formError && (
              <p className={s.formError} role="alert">
                {formError}
              </p>
            )}
          </form>
        </section>

        <HandsDivider />

        {/* 3. Tutte le notizie ------------------------------------------ */}
        <section className={s.section} aria-labelledby="tutte-le-notizie">
          <div className={s.sectionHead}>
            <h2 id="tutte-le-notizie" className={s.sectionTitle}>
              Tutte le notizie
            </h2>
            {listState === 'ready' && news.length > 0 && (
              <p className={s.count}>
                {news.length} {news.length === 1 ? 'notizia' : 'notizie'}
                {drafts > 0 && `, di cui ${drafts} in bozza`}
              </p>
            )}
          </div>

          {listState === 'loading' && (
            <>
              <p className="sr-only" role="status">
                Caricamento delle notizie…
              </p>
              <div className={s.skeletons}>
                <Skeleton height="9rem" count={3} />
              </div>
            </>
          )}

          {listState === 'error' && (
            <ErrorState
              title="Non riesco a leggere le notizie"
              message={listError}
              onRetry={() => setReloadKey((n) => n + 1)}
            />
          )}

          {listState === 'ready' && news.length === 0 && (
            <EmptyState title="Nessuna notizia, per ora">
              Scrivi la prima qui sopra: comparirà in questo elenco e, se pubblicata, sulla home.
            </EmptyState>
          )}

          {listState === 'ready' && news.length > 0 && (
            <ul className={s.list}>
              {news.map((item) => {
                const busy = rowBusy[item.id]
                const isEditing = editingId === item.id
                const isConfirming = confirmId === item.id
                const rowError = rowErrors[item.id]
                const date = formatDate(item.createdAt)

                return (
                  <li key={item.id}>
                    <article
                      className={`${s.item} ${item.published ? '' : s.itemDraft}`}
                      aria-busy={busy ? 'true' : undefined}
                    >
                      <div className={s.itemTop}>
                        <h3 className={s.itemTitle}>{item.title || '(senza titolo)'}</h3>
                        {item.published ? (
                          <span className={s.badgePublished}>Pubblicata</span>
                        ) : (
                          <span className={s.badgeDraft}>Bozza</span>
                        )}
                      </div>

                      <p className={s.meta}>
                        <span>{item.authorName || 'autore sconosciuto'}</span>
                        {/* createdAt è null per un istante dopo la creazione:
                            serverTimestamp non è ancora tornato dal server. */}
                        <span>{date || 'in pubblicazione…'}</span>
                      </p>

                      {isEditing ? (
                        <form className={s.editForm} onSubmit={(e) => handleSaveEdit(e, item)} noValidate>
                          <div className={s.field}>
                            <label className={s.label} htmlFor={`edit-title-${item.id}`}>
                              Titolo
                            </label>
                            <input
                              id={`edit-title-${item.id}`}
                              ref={editTitleRef}
                              className={`${s.input} ${editErrors.title ? s.inputInvalid : ''}`}
                              type="text"
                              value={editDraft.title}
                              maxLength={TITLE_MAX}
                              /* Il campo appena aperto prende il focus: chi ha
                                 premuto "Modifica" si trova già dentro. */
                              autoFocus
                              aria-invalid={editErrors.title ? 'true' : undefined}
                              aria-describedby={
                                editErrors.title ? `edit-title-error-${item.id}` : undefined
                              }
                              onChange={(e) => {
                                setEditDraft((prev) => ({ ...prev, title: e.target.value }))
                                if (editErrors.title)
                                  setEditErrors((prev) => ({ ...prev, title: undefined }))
                              }}
                              disabled={busy === 'save'}
                            />
                            {editErrors.title && (
                              <p className={s.fieldError} id={`edit-title-error-${item.id}`}>
                                {editErrors.title}
                              </p>
                            )}
                          </div>

                          <div className={s.field}>
                            <label className={s.label} htmlFor={`edit-body-${item.id}`}>
                              Corpo
                            </label>
                            <textarea
                              id={`edit-body-${item.id}`}
                              className={`${s.textarea} ${editErrors.body ? s.inputInvalid : ''}`}
                              rows={10}
                              value={editDraft.body}
                              aria-invalid={editErrors.body ? 'true' : undefined}
                              aria-describedby={
                                editErrors.body ? `edit-body-error-${item.id}` : undefined
                              }
                                maxLength={BODY_MAX}
                              onChange={(e) => {
                                setEditDraft((prev) => ({ ...prev, body: e.target.value }))
                                if (editErrors.body)
                                  setEditErrors((prev) => ({ ...prev, body: undefined }))
                              }}
                              disabled={busy === 'save'}
                            />
                            {editErrors.body && (
                              <p className={s.fieldError} id={`edit-body-error-${item.id}`}>
                                {editErrors.body}
                              </p>
                            )}
                          </div>

                          <div className={s.field}>
                            <span className={s.label}>Allegati</span>
                            <AttachmentEditor
                              value={editDraft.attachments}
                              onChange={(next) =>
                                setEditDraft((prev) => ({ ...prev, attachments: next }))
                              }
                              disabled={busy === 'save'}
                            />
                          </div>

                          <label className={s.check} htmlFor={`edit-published-${item.id}`}>
                            <input
                              id={`edit-published-${item.id}`}
                              className={s.checkbox}
                              type="checkbox"
                              checked={editDraft.published}
                              onChange={(e) =>
                                setEditDraft((prev) => ({ ...prev, published: e.target.checked }))
                              }
                              disabled={busy === 'save'}
                            />
                            <span className={s.checkLabel}>Pubblicata</span>
                          </label>

                          <div className={s.rowActions}>
                            <button
                              type="submit"
                              className={`${s.btn} ${s.small} ${s.primary}`}
                              disabled={busy === 'save'}
                            >
                              {busy === 'save' ? 'Salvataggio…' : 'Salva'}
                            </button>
                            <button
                              type="button"
                              className={`${s.btn} ${s.small}`}
                              onClick={() => cancelEditing(item.id)}
                              disabled={busy === 'save'}
                            >
                              Annulla
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {item.body && <p className={s.body}>{item.body}</p>}

                          <div className={s.rowActions}>
                            <button
                              type="button"
                              className={`${s.btn} ${s.small}`}
                              onClick={() => handleTogglePublished(item)}
                              disabled={Boolean(busy)}
                            >
                              {busy === 'publish' && 'Pubblico…'}
                              {busy === 'hide' && 'Nascondo…'}
                              {!busy && (item.published ? 'Nascondi' : 'Pubblica')}
                            </button>

                            <button
                              type="button"
                              className={`${s.btn} ${s.small}`}
                              ref={(el) => {
                                if (el) editButtonRefs.current.set(item.id, el)
                                else editButtonRefs.current.delete(item.id)
                              }}
                              onClick={() => startEditing(item)}
                              disabled={Boolean(busy)}
                            >
                              Modifica
                            </button>

                            {/* Eliminazione in due passi, reversibile fino
                                all'ultimo click. Niente window.confirm: non è
                                stilabile, non è annunciato bene e su mobile è
                                un dialogo di sistema fuori contesto. */}
                            {isConfirming ? (
                              <span
                                className={s.confirm}
                                role="group"
                                aria-label={`Confermi l’eliminazione di “${item.title || 'senza titolo'}”?`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    e.stopPropagation()
                                    cancelConfirm(item.id)
                                  }
                                }}
                              >
                                <span className={s.confirmText} aria-hidden="true">
                                  Sicuro?
                                </span>
                                <button
                                  type="button"
                                  className={`${s.btn} ${s.small} ${s.danger}`}
                                  onClick={() => handleDelete(item)}
                                  disabled={busy === 'delete'}
                                >
                                  {busy === 'delete' ? 'Elimino…' : 'Sì, elimina'}
                                </button>
                                <button
                                  type="button"
                                  className={`${s.btn} ${s.small}`}
                                  /* Il focus va sull'opzione sicura: se qualcuno
                                     tira due Invio di fila non cancella niente. */
                                  autoFocus
                                  onClick={() => cancelConfirm(item.id)}
                                  disabled={busy === 'delete'}
                                >
                                  No
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={`${s.btn} ${s.small} ${s.danger}`}
                                ref={(el) => {
                                  if (el) deleteButtonRefs.current.set(item.id, el)
                                  else deleteButtonRefs.current.delete(item.id)
                                }}
                                onClick={() => setConfirmId(item.id)}
                                disabled={Boolean(busy)}
                              >
                                Elimina
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {rowError && (
                        <p className={s.rowError} role="alert">
                          {rowError}
                        </p>
                      )}
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
