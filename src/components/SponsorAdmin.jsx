import { useCallback, useEffect, useRef, useState } from 'react'

import { COMPRESSIBLE, compressImage, humanBytes } from '../lib/imageCompress.js'
import { createMedia, createSponsor, deleteSponsor, getMedia, listSponsors } from '../lib/db.js'
import { safeImageSrc } from '../lib/attachments.js'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'

import s from './SponsorAdmin.module.css'

const VUOTO = { nome: '', url: '', nota: '', ordine: '500' }

/**
 * Gestione degli sponsor, dentro /admin.
 *
 * Volutamente più spartana della redazione delle notizie: gli sponsor si
 * aggiungono una volta ogni tanto e si toccano raramente. Niente modifica in
 * linea, si cancella e si rifà: con quattro campi è più veloce che gestire
 * uno stato di editing.
 */
export default function SponsorAdmin() {
  const { t } = useI18n()
  const [lista, setLista] = useState([])
  const [media, setMedia] = useState({})
  const [stato, setStato] = useState('loading')
  const [form, setForm] = useState(VUOTO)

  /* Il logo viene caricato PRIMA di salvare lo sponsor: così se il caricamento
     fallisce non resta uno sponsor senza logo da correggere a mano. */
  const [logo, setLogo] = useState(null) // { mediaId, dataUrl, nome }
  /* `fase` porta un CODICE ('logo' | 'salvo') e non la frase da mostrare: la
     frase la decide t() al momento del render, e il codice serve anche a
     distinguere le due fasi nel JSX. Con la frase dentro lo stato, il
     confronto `fase === 'Salvo…'` si romperebbe cambiando lingua. */
  const [fase, setFase] = useState(null)
  const [errore, setErrore] = useState(null)
  const [conferma, setConferma] = useState(null) // id in attesa di conferma
  const fileRef = useRef(null)

  const carica = useCallback(async () => {
    setStato('loading')
    try {
      const l = await listSponsors()
      setLista(l)
      setStato('ready')
      const ids = l.map((x) => x.logoMediaId).filter(Boolean)
      if (ids.length) setMedia(await getMedia(ids))
    } catch (err) {
      setErrore(messaggioErrore(t, err, 'sponsorAdmin.erroreLettura'))
      setStato('error')
    }
  }, [t])

  useEffect(() => {
    carica()
  }, [carica])

  async function scegliLogo(file, input) {
    if (!file) return
    setErrore(null)

    if (!COMPRESSIBLE.includes(file.type)) {
      setErrore(t('sponsorAdmin.formatoLogo'))
      if (input) input.value = ''
      return
    }

    setFase('logo')
    try {
      const esito = await compressImage(file)
      const mediaId = await createMedia(
        {
          dataUrl: esito.dataUrl,
          contentType: esito.mime,
          name: file.name,
          width: esito.width,
          height: esito.height,
          bytes: esito.bytes,
        },
        null,
      )
      setLogo({ mediaId, dataUrl: esito.dataUrl, nome: file.name, bytes: esito.bytes })
    } catch (err) {
      setErrore(messaggioErrore(t, err, 'sponsorAdmin.erroreLogo'))
    } finally {
      setFase(null)
      if (input) input.value = ''
    }
  }

  async function salva(e) {
    e.preventDefault()
    setErrore(null)

    if (!form.nome.trim()) {
      setErrore(t('sponsorAdmin.nomeObbligatorio'))
      return
    }

    setFase('salvo')
    try {
      await createSponsor({ ...form, logoMediaId: logo?.mediaId || '' })
      setForm(VUOTO)
      setLogo(null)
      await carica()
    } catch (err) {
      setErrore(
        err?.code === 'permission-denied'
          ? t('sponsorAdmin.errorePermessi')
          : messaggioErrore(t, err, 'sponsorAdmin.erroreSalvataggio'),
      )
    } finally {
      setFase(null)
    }
  }

  async function elimina(sp) {
    setErrore(null)
    try {
      await deleteSponsor(sp.id, sp.logoMediaId)
      setConferma(null)
      await carica()
    } catch (err) {
      setErrore(messaggioErrore(t, err, 'sponsorAdmin.erroreEliminazione'))
    }
  }

  const aggiorna = (campo) => (e) => setForm((p) => ({ ...p, [campo]: e.target.value }))

  /* La frase che corrisponde alla fase in corso, o stringa vuota. In un posto
     solo perché la usano il bottone del file, quello di invio e la live
     region. */
  const faseTesto = fase === 'logo' ? t('sponsorAdmin.preparoLogo') : fase === 'salvo' ? t('sponsorAdmin.salvo') : ''

  return (
    <section className={s.wrap} aria-labelledby="sponsor-admin">
      <h2 className={s.titolo} id="sponsor-admin">
        {t('sponsorAdmin.titolo')}
      </h2>
      <p className={s.intro}>{t('sponsorAdmin.intro')}</p>

      {/* --- nuovo ------------------------------------------------------- */}
      <form className={s.form} onSubmit={salva}>
        <div className={s.riga}>
          <label className={s.campo}>
            <span className={s.etichetta}>{t('sponsorAdmin.nome')}</span>
            <input
              className={s.input}
              value={form.nome}
              onChange={aggiorna('nome')}
              maxLength={80}
              required
            />
          </label>

          <label className={s.campo}>
            <span className={s.etichetta}>
              {t('sponsorAdmin.sito')}{' '}
              <span className={s.opzionale}>{t('sponsorAdmin.facoltativo')}</span>
            </span>
            <input
              className={s.input}
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={form.url}
              onChange={aggiorna('url')}
              maxLength={500}
            />
          </label>
        </div>

        <div className={s.riga}>
          <label className={s.campo}>
            <span className={s.etichetta}>
              {t('sponsorAdmin.nota')}{' '}
              <span className={s.opzionale}>{t('sponsorAdmin.notaSpiegazione')}</span>
            </span>
            <input
              className={s.input}
              value={form.nota}
              onChange={aggiorna('nota')}
              maxLength={120}
              placeholder={t('sponsorAdmin.notaPlaceholder')}
            />
          </label>

          <label className={`${s.campo} ${s.campoStretto}`}>
            <span className={s.etichetta}>{t('sponsorAdmin.ordine')}</span>
            <input
              className={s.input}
              type="number"
              min="0"
              max="9999"
              value={form.ordine}
              onChange={aggiorna('ordine')}
            />
          </label>
        </div>

        <div className={s.logoRiga}>
          {logo ? (
            <>
              <img className={s.anteprima} src={logo.dataUrl} alt="" aria-hidden="true" />
              <span className={s.logoNome}>
                {logo.nome} <span className={s.peso}>{humanBytes(logo.bytes)}</span>
              </span>
              <button type="button" className={s.piccolo} onClick={() => setLogo(null)}>
                {t('sponsorAdmin.togli')}
              </button>
            </>
          ) : (
            <label className={s.fileLabel}>
              <input
                ref={fileRef}
                className={s.file}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => scegliLogo(e.target.files?.[0], e.target)}
                disabled={!!fase}
              />
              <span className={s.fileBottone}>{faseTesto || t('sponsorAdmin.caricaLogo')}</span>
            </label>
          )}
        </div>

        <button type="submit" className={s.primario} disabled={!!fase}>
          {fase === 'salvo' ? t('sponsorAdmin.salvo') : t('sponsorAdmin.aggiungi')}
        </button>

        {/* Sempre nel DOM: una live region aggiunta al momento non viene
            annunciata, perché lo screen reader non la stava osservando. */}
        <p className="sr-only" role="status">
          {faseTesto}
        </p>

        {errore && (
          <p className={s.errore} role="alert">
            {errore}
          </p>
        )}
      </form>

      {/* --- elenco ------------------------------------------------------ */}
      {stato === 'ready' && lista.length > 0 && (
        <ul className={s.elenco}>
          {lista.map((sp) => {
            const src = sp.logoMediaId ? safeImageSrc(media[sp.logoMediaId]?.dataUrl) : null
            return (
              <li className={s.voce} key={sp.id}>
                {src ? (
                  <img className={s.anteprima} src={src} alt="" aria-hidden="true" />
                ) : (
                  <span className={s.senzaLogo} aria-hidden="true" />
                )}
                <span className={s.voceInfo}>
                  <span className={s.voceNome}>{sp.nome}</span>
                  <span className={s.voceMeta}>
                    {t('sponsorAdmin.ordineVoce', { n: sp.ordine })}
                    {sp.url ? ` · ${sp.url.replace(/^https?:\/\//, '').slice(0, 40)}` : ''}
                  </span>
                </span>

                {/* Conferma a due passi, come per le notizie: niente
                    window.confirm, che si può bloccare a livello di browser. */}
                {conferma === sp.id ? (
                  <span className={s.conferma}>
                    <button type="button" className={s.pericolo} onClick={() => elimina(sp)}>
                      {t('sponsorAdmin.sicuroSi')}
                    </button>
                    <button type="button" className={s.piccolo} onClick={() => setConferma(null)}>
                      {t('sponsorAdmin.no')}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={s.piccolo}
                    onClick={() => setConferma(sp.id)}
                    aria-label={t('sponsorAdmin.eliminaAria', { nome: sp.nome })}
                  >
                    {t('sponsorAdmin.elimina')}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {stato === 'ready' && lista.length === 0 && (
        <p className={s.vuoto}>{t('sponsorAdmin.vuoto')}</p>
      )}
    </section>
  )
}
