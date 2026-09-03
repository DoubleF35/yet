import { useCallback, useEffect, useRef, useState } from 'react'

import { COMPRESSIBLE, compressImage, humanBytes } from '../lib/imageCompress.js'
import { createMedia, createSponsor, deleteSponsor, getMedia, listSponsors } from '../lib/db.js'
import { safeImageSrc } from '../lib/attachments.js'

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
  const [lista, setLista] = useState([])
  const [media, setMedia] = useState({})
  const [stato, setStato] = useState('loading')
  const [form, setForm] = useState(VUOTO)

  /* Il logo viene caricato PRIMA di salvare lo sponsor: così se il caricamento
     fallisce non resta uno sponsor senza logo da correggere a mano. */
  const [logo, setLogo] = useState(null) // { mediaId, dataUrl, nome }
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
      setErrore(err?.message || 'Non riesco a leggere gli sponsor.')
      setStato('error')
    }
  }, [])

  useEffect(() => {
    carica()
  }, [carica])

  async function scegliLogo(file, input) {
    if (!file) return
    setErrore(null)

    if (!COMPRESSIBLE.includes(file.type)) {
      setErrore('Il logo dev’essere un’immagine JPEG, PNG, WebP o AVIF.')
      if (input) input.value = ''
      return
    }

    setFase('Preparo il logo…')
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
      setErrore(err?.message || 'Caricamento del logo non riuscito.')
    } finally {
      setFase(null)
      if (input) input.value = ''
    }
  }

  async function salva(e) {
    e.preventDefault()
    setErrore(null)

    if (!form.nome.trim()) {
      setErrore('Il nome è obbligatorio.')
      return
    }

    setFase('Salvo…')
    try {
      await createSponsor({ ...form, logoMediaId: logo?.mediaId || '' })
      setForm(VUOTO)
      setLogo(null)
      await carica()
    } catch (err) {
      setErrore(
        err?.code === 'permission-denied'
          ? 'Rifiutato dal server: le regole pubblicate non conoscono ancora la collection “sponsors”. Ripubblica firestore.rules.'
          : err?.message || 'Salvataggio non riuscito.',
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
      setErrore(err?.message || 'Eliminazione non riuscita.')
    }
  }

  const aggiorna = (campo) => (e) => setForm((p) => ({ ...p, [campo]: e.target.value }))

  return (
    <section className={s.wrap} aria-labelledby="sponsor-admin">
      <h2 className={s.titolo} id="sponsor-admin">
        Sponsor
      </h2>
      <p className={s.intro}>
        Compaiono nella pagina Sponsor. Il numero d’ordine decide chi sta in cima: più basso, più
        in alto. A parità va in ordine alfabetico.
      </p>

      {/* --- nuovo ------------------------------------------------------- */}
      <form className={s.form} onSubmit={salva}>
        <div className={s.riga}>
          <label className={s.campo}>
            <span className={s.etichetta}>Nome</span>
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
              Sito <span className={s.opzionale}>(facoltativo)</span>
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
              Nota <span className={s.opzionale}>(una riga sotto il logo)</span>
            </span>
            <input
              className={s.input}
              value={form.nota}
              onChange={aggiorna('nota')}
              maxLength={120}
              placeholder="Sede del primo incontro"
            />
          </label>

          <label className={`${s.campo} ${s.campoStretto}`}>
            <span className={s.etichetta}>Ordine</span>
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
                Togli
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
              <span className={s.fileBottone}>{fase ?? 'Carica il logo'}</span>
            </label>
          )}
        </div>

        <button type="submit" className={s.primario} disabled={!!fase}>
          {fase === 'Salvo…' ? 'Salvo…' : 'Aggiungi sponsor'}
        </button>

        {/* Sempre nel DOM: una live region aggiunta al momento non viene
            annunciata, perché lo screen reader non la stava osservando. */}
        <p className="sr-only" role="status">
          {fase ?? ''}
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
                    ordine {sp.ordine}
                    {sp.url ? ` · ${sp.url.replace(/^https?:\/\//, '').slice(0, 40)}` : ''}
                  </span>
                </span>

                {/* Conferma a due passi, come per le notizie: niente
                    window.confirm, che si può bloccare a livello di browser. */}
                {conferma === sp.id ? (
                  <span className={s.conferma}>
                    <button type="button" className={s.pericolo} onClick={() => elimina(sp)}>
                      Sicuro? Sì
                    </button>
                    <button type="button" className={s.piccolo} onClick={() => setConferma(null)}>
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={s.piccolo}
                    onClick={() => setConferma(sp.id)}
                    aria-label={`Elimina lo sponsor ${sp.nome}`}
                  >
                    Elimina
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {stato === 'ready' && lista.length === 0 && (
        <p className={s.vuoto}>Nessuno sponsor, per ora.</p>
      )}
    </section>
  )
}
