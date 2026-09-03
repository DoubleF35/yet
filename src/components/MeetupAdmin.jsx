import { useCallback, useEffect, useState } from 'react'

import {
  MEETUP_BODY_MAX,
  MEETUP_PLACE_MAX,
  MEETUP_TITLE_MAX,
  createMeetup,
  deleteMeetup,
  formatMeetupDate,
  listenMeetups,
  updateMeetup,
} from '../lib/db.js'
import { useAuth } from '../lib/auth.jsx'

import s from './MeetupAdmin.module.css'

const VUOTO = { title: '', startsAt: '', place: '', body: '', url: '', published: true }

/**
 * Il pannello con cui gli organizzatori mettono un incontro vero.
 *
 * Compare in cima alla pagina Eventi e SOLO agli admin. Sta li' e non in
 * /admin per una ragione pratica: si scrive un incontro guardando quelli che
 * ci sono gia', e dover cambiare pagina per vedere il risultato e' il modo
 * piu' sicuro di pubblicare due volte lo stesso.
 */
export default function MeetupAdmin() {
  const { user, isAdmin } = useAuth()

  const [form, setForm] = useState(VUOTO)
  const [salvataggio, setSalvataggio] = useState(false)
  const [errore, setErrore] = useState(null)
  const [fatto, setFatto] = useState(null)
  const [aperto, setAperto] = useState(false)

  const [elenco, setElenco] = useState({ prossimi: [], passati: [] })
  const [inCorso, setInCorso] = useState({})

  /* Anche gli admin vedono qui SOLO la loro lista di servizio, con le bozze.
     La pagina pubblica ha il suo listener con onlyPublished. */
  useEffect(() => {
    if (!isAdmin) return undefined
    const stop = listenMeetups({ onlyPublished: false }, setElenco, (e) =>
      console.warn('[YET] Non riesco a leggere gli incontri.', e),
    )
    return stop
  }, [isAdmin])

  const aggiorna = (campo) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prec) => ({ ...prec, [campo]: v }))
    if (errore) setErrore(null)
  }

  const invia = useCallback(
    async (e) => {
      e.preventDefault()
      setErrore(null)
      setFatto(null)
      setSalvataggio(true)
      try {
        await createMeetup(form, user)
        setForm(VUOTO)
        setFatto(
          form.published
            ? 'Incontro pubblicato: e’ gia’ visibile qui sotto.'
            : 'Bozza salvata. Non si vede sul sito finche’ non la pubblichi.',
        )
      } catch (err) {
        setErrore(
          err?.code === 'permission-denied'
            ? 'Il server ha rifiutato la scrittura. Controlla che la tua email sia nella allowlist dentro firestore.rules e che le regole siano state ripubblicate.'
            : err?.message || 'Non sono riuscito a salvare.',
        )
      } finally {
        setSalvataggio(false)
      }
    },
    [form, user],
  )

  const azione = useCallback(async (id, fn, etichetta) => {
    setInCorso((p) => ({ ...p, [id]: etichetta }))
    try {
      await fn()
    } catch (err) {
      console.error('[YET] Azione sull’incontro non riuscita.', err)
    } finally {
      setInCorso((p) => ({ ...p, [id]: null }))
    }
  }, [])

  if (!isAdmin) return null

  const tutti = [...elenco.prossimi, ...elenco.passati]

  return (
    <section className={s.wrap} aria-labelledby="gestione-incontri">
      <div className={s.head}>
        <h2 className={s.title} id="gestione-incontri">
          Organizza un incontro
        </h2>
        <button
          type="button"
          className={s.toggle}
          onClick={() => setAperto((v) => !v)}
          aria-expanded={aperto}
        >
          {aperto ? 'Chiudi' : 'Nuovo incontro'}
        </button>
      </div>

      <p className={s.intro}>
        Un incontro non e’ una notizia: ha una data e un posto, compare in cima finche’ non e’
        passato, e poi scende da solo fra quelli gia’ fatti. Lo vedete solo voi organizzatori.
      </p>

      {aperto && (
        <form className={s.form} onSubmit={invia}>
          <div className={s.riga}>
            <label className={s.campo}>
              <span className={s.etichetta}>Titolo</span>
              <input
                className={s.input}
                type="text"
                required
                maxLength={MEETUP_TITLE_MAX}
                value={form.title}
                onChange={aggiorna('title')}
                placeholder="Primo incontro di settembre"
                disabled={salvataggio}
              />
            </label>

            <label className={s.campo}>
              <span className={s.etichetta}>Quando</span>
              {/* datetime-local e non due campi separati: sul telefono apre il
                  selettore nativo, che e' molto piu' veloce di far scrivere
                  una data a mano e molto piu' difficile da sbagliare. */}
              <input
                className={s.input}
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={aggiorna('startsAt')}
                disabled={salvataggio}
              />
            </label>
          </div>

          <div className={s.riga}>
            <label className={s.campo}>
              <span className={s.etichetta}>Dove</span>
              <input
                className={s.input}
                type="text"
                maxLength={MEETUP_PLACE_MAX}
                value={form.place}
                onChange={aggiorna('place')}
                placeholder="Toolbox Coworking, via Agostino da Montefeltro 2, Torino"
                disabled={salvataggio}
              />
            </label>

            <label className={s.campo}>
              <span className={s.etichetta}>
                Link per iscriversi <span className={s.opzionale}>(facoltativo)</span>
              </span>
              <input
                className={s.input}
                type="url"
                value={form.url}
                onChange={aggiorna('url')}
                placeholder="https://..."
                disabled={salvataggio}
              />
            </label>
          </div>

          <label className={s.campo}>
            <span className={s.etichetta}>Di cosa si parla</span>
            <textarea
              className={s.textarea}
              rows={4}
              maxLength={MEETUP_BODY_MAX}
              value={form.body}
              onChange={aggiorna('body')}
              placeholder="Ognuno porta il proprio progetto e mostra cosa e’ cambiato dall’ultima volta."
              disabled={salvataggio}
            />
          </label>

          <label className={s.check}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={aggiorna('published')}
              disabled={salvataggio}
            />
            <span>Pubblicato subito</span>
          </label>

          <div className={s.azioni}>
            <button type="submit" className={s.primario} disabled={salvataggio}>
              {salvataggio ? 'Salvataggio…' : 'Salva incontro'}
            </button>
          </div>

          {/* role="status" e non un semplice paragrafo: chi non guarda lo
              schermo deve sapere che il salvataggio e’ andato. */}
          <p className={s.stato} role="status">
            {fatto ?? ''}
          </p>
          {errore && (
            <p className={s.errore} role="alert">
              {errore}
            </p>
          )}
        </form>
      )}

      {tutti.length > 0 && (
        <ul className={s.lista}>
          {tutti.map((m) => {
            const passato = elenco.passati.some((x) => x.id === m.id)
            return (
              <li className={s.voce} key={m.id}>
                <div className={s.voceTesto}>
                  <p className={s.voceTitolo}>
                    {m.title}
                    {!m.published && <span className={s.bozza}>Bozza</span>}
                    {passato && <span className={s.passato}>Gia’ fatto</span>}
                  </p>
                  <p className={s.voceMeta}>
                    {formatMeetupDate(m.startsAt)}
                    {m.place ? ` · ${m.place}` : ''}
                  </p>
                </div>

                <div className={s.voceAzioni}>
                  <button
                    type="button"
                    className={s.piccolo}
                    disabled={!!inCorso[m.id]}
                    onClick={() =>
                      azione(m.id, () => updateMeetup(m.id, { published: !m.published }), 'pub')
                    }
                  >
                    {m.published ? 'Nascondi' : 'Pubblica'}
                  </button>
                  <ConfermaElimina
                    disabled={!!inCorso[m.id]}
                    onConferma={() => azione(m.id, () => deleteMeetup(m.id), 'del')}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/**
 * Conferma in due tempi, come per le notizie.
 *
 * Niente `window.confirm`: un dialogo di sistema si puo’ bloccare a livello di
 * browser, e qui sarebbe l’unica barriera prima di una cancellazione
 * definitiva.
 */
function ConfermaElimina({ onConferma, disabled }) {
  const [chiede, setChiede] = useState(false)

  if (!chiede) {
    return (
      <button
        type="button"
        className={`${s.piccolo} ${s.pericolo}`}
        onClick={() => setChiede(true)}
        disabled={disabled}
      >
        Elimina
      </button>
    )
  }

  return (
    <span className={s.conferma}>
      <span className={s.confermaTesto}>Sicuro?</span>
      <button
        type="button"
        className={`${s.piccolo} ${s.pericolo}`}
        onClick={onConferma}
        disabled={disabled}
      >
        Si’
      </button>
      <button type="button" className={s.piccolo} onClick={() => setChiede(false)}>
        No
      </button>
    </span>
  )
}
