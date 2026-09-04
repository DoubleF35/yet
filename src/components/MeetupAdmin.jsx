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
import { useI18n } from '../lib/i18n.jsx'

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
  const { lang, t } = useI18n()

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
        setFatto(form.published ? t('incontriAdmin.pubblicatoOk') : t('incontriAdmin.bozzaOk'))
      } catch (err) {
        setErrore(
          err?.code === 'permission-denied'
            ? t('incontriAdmin.errorePermessi')
            : err?.message || t('incontriAdmin.erroreGenerico'),
        )
      } finally {
        setSalvataggio(false)
      }
    },
    [form, user, t],
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
          {t('incontriAdmin.titolo')}
        </h2>
        <button
          type="button"
          className={s.toggle}
          onClick={() => setAperto((v) => !v)}
          aria-expanded={aperto}
        >
          {aperto ? t('incontriAdmin.chiudi') : t('incontriAdmin.nuovo')}
        </button>
      </div>

      <p className={s.intro}>{t('incontriAdmin.intro')}</p>

      {aperto && (
        <form className={s.form} onSubmit={invia}>
          <div className={s.riga}>
            <label className={s.campo}>
              <span className={s.etichetta}>{t('incontriAdmin.titoloCampo')}</span>
              <input
                className={s.input}
                type="text"
                required
                maxLength={MEETUP_TITLE_MAX}
                value={form.title}
                onChange={aggiorna('title')}
                placeholder={t('incontriAdmin.titoloPlaceholder')}
                disabled={salvataggio}
              />
            </label>

            <label className={s.campo}>
              <span className={s.etichetta}>{t('incontriAdmin.quando')}</span>
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
              <span className={s.etichetta}>{t('incontriAdmin.dove')}</span>
              <input
                className={s.input}
                type="text"
                maxLength={MEETUP_PLACE_MAX}
                value={form.place}
                onChange={aggiorna('place')}
                placeholder={t('incontriAdmin.dovePlaceholder')}
                disabled={salvataggio}
              />
            </label>

            <label className={s.campo}>
              <span className={s.etichetta}>
                {t('incontriAdmin.link')}{' '}
                <span className={s.opzionale}>{t('incontriAdmin.facoltativo')}</span>
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
            <span className={s.etichetta}>{t('incontriAdmin.diCosa')}</span>
            <textarea
              className={s.textarea}
              rows={4}
              maxLength={MEETUP_BODY_MAX}
              value={form.body}
              onChange={aggiorna('body')}
              placeholder={t('incontriAdmin.diCosaPlaceholder')}
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
            <span>{t('incontriAdmin.pubblicaSubito')}</span>
          </label>

          <div className={s.azioni}>
            <button type="submit" className={s.primario} disabled={salvataggio}>
              {salvataggio ? t('incontriAdmin.salvataggio') : t('incontriAdmin.salva')}
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
                    {!m.published && <span className={s.bozza}>{t('incontriAdmin.bozza')}</span>}
                    {passato && (
                      <span className={s.passato}>{t('incontriAdmin.giaFatto')}</span>
                    )}
                  </p>
                  <p className={s.voceMeta}>
                    {formatMeetupDate(m.startsAt, lang) ?? t('incontri.dataDaDefinire')}
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
                    {m.published ? t('incontriAdmin.nascondi') : t('incontriAdmin.pubblica')}
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
  const { t } = useI18n()
  const [chiede, setChiede] = useState(false)

  if (!chiede) {
    return (
      <button
        type="button"
        className={`${s.piccolo} ${s.pericolo}`}
        onClick={() => setChiede(true)}
        disabled={disabled}
      >
        {t('incontriAdmin.elimina')}
      </button>
    )
  }

  return (
    <span className={s.conferma}>
      <span className={s.confermaTesto}>{t('incontriAdmin.sicuro')}</span>
      <button
        type="button"
        className={`${s.piccolo} ${s.pericolo}`}
        onClick={onConferma}
        disabled={disabled}
      >
        {t('incontriAdmin.si')}
      </button>
      <button type="button" className={s.piccolo} onClick={() => setChiede(false)}>
        {t('incontriAdmin.no')}
      </button>
    </span>
  )
}
