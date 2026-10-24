import { useCallback, useEffect, useRef, useState } from 'react'

import { COMPRESSIBLE, compressImage, humanBytes } from '../lib/imageCompress.js'
import {
  createMedia,
  createSponsor,
  deleteSponsor,
  getMedia,
  getSponsorRiservati,
  listSponsors,
  riordinaSponsorPerImporto,
  setSponsorRiservato,
  updateSponsor,
} from '../lib/db.js'
import { safeImageSrc } from '../lib/attachments.js'
import { useAuth } from '../lib/auth.jsx'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'

import s from './SponsorAdmin.module.css'

/* `importo` e non `ordine`: si scrive quanto ha dato lo sponsor, e la fila la
   calcola il sito. L'importo NON finisce sullo sponsor pubblico, che lo legge
   chiunque: va in sponsorRiservato, e in pubblico resta solo la posizione.
   Vedi riordinaSponsorPerImporto() in lib/db.js. */
const VUOTO = { nome: '', url: '', nota: '', importo: '' }

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
  const { user } = useAuth()
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
  const [conferma, setConferma] = useState(null)
  /* Quale sponsor stiamo modificando, o null se ne stiamo aggiungendo uno
     nuovo. Si riusa IL MODULO IN CIMA invece di disegnarne un secondo dentro
     la riga: due moduli uguali sono due moduli che prima o poi divergono. */
  const [inModifica, setInModifica] = useState(null)
  const [riservati, setRiservati] = useState({}) // id in attesa di conferma
  const fileRef = useRef(null)
  const formRef = useRef(null)

  const carica = useCallback(async () => {
    setStato('loading')
    try {
      const l = await listSponsors()
      setLista(l)
      setStato('ready')
      const ids = l.map((x) => x.logoMediaId).filter(Boolean)
      if (ids.length) setMedia(await getMedia(ids))
      /* Gli importi li legge solo un admin, e se la lettura non passa la
         funzione torna {} invece di lanciare: il pannello resta usabile anche
         senza, mostrando solo la fila senza le cifre. */
      setRiservati(await getSponsorRiservati())
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
          /* Un'immagine presa dagli appunti spesso arriva senza nome, o
             chiamata "image.png" da qualunque cosa l'abbia copiata. Il nome
             finisce nel documento del media e serve solo a ritrovarla, quindi
             meglio uno di ripiego che una stringa vuota. */
          name: file.name || 'logo-incollato.png',
          width: esito.width,
          height: esito.height,
          bytes: esito.bytes,
        },
        /* L'utente, non null: le regole pretendono che authorUid coincida con
           chi sta scrivendo, quindi un null qui faceva rifiutare il
           caricamento con permission-denied. E' il motivo per cui non e' mai
           stato caricato nessun logo. */
        user,
      )
      setLogo({ mediaId, dataUrl: esito.dataUrl, nome: file.name, bytes: esito.bytes })
    } catch (err) {
      setErrore(messaggioErrore(t, err, 'sponsorAdmin.erroreLogo'))
    } finally {
      setFase(null)
      if (input) input.value = ''
    }
  }

  /**
   * Prende un'immagine dagli appunti e la tratta come un file scelto.
   *
   * Sta sul <form> intero e non su un riquadro dedicato: cosi' basta avere il
   * cursore da qualche parte nel modulo e premere Ctrl+V, che e' il gesto che
   * uno fa d'istinto dopo aver copiato un logo da una pagina o da uno
   * screenshot. Incollare del TESTO in una casella continua a funzionare
   * normalmente, perche' qui si guarda solo se negli appunti c'e' un file
   * immagine: se non c'e', la funzione non fa niente e lascia passare.
   */
  async function incollaLogo(evento) {
    if (fase) return
    /* Array.from e non direttamente `for...of`: clipboardData.items e' una
       DataTransferItemList, cioe' una collezione indicizzata che la specifica
       NON dichiara iterabile. Su un browser che non ci ha messo di suo un
       Symbol.iterator, il ciclo sarebbe esploso. */
    const elementi = Array.from(evento.clipboardData?.items ?? [])
    if (elementi.length === 0) return

    for (const el of elementi) {
      if (el.kind !== 'file' || !el.type.startsWith('image/')) continue
      const file = el.getAsFile()
      if (!file) continue
      /* preventDefault solo QUI dentro, cioe' solo quando l'immagine c'e'
         davvero: metterlo in cima bloccherebbe anche l'incolla del testo. */
      evento.preventDefault()
      await scegliLogo(file)
      return
    }
  }

  /** Porta uno sponsor gia' salvato dentro il modulo in cima. */
  function modifica(sp) {
    setErrore(null)
    setConferma(null)
    setInModifica(sp.id)
    setForm({
      nome: sp.nome ?? '',
      url: sp.url ?? '',
      nota: sp.nota ?? '',
      importo: riservati[sp.id]?.importo != null ? String(riservati[sp.id].importo) : '',
    })
    /* Il logo gia' caricato si riusa com'e': ha gia' il suo mediaId, quindi
       non va ricaricato. Se se ne incolla uno nuovo, quello vecchio viene
       sostituito e basta. */
    setLogo(
      sp.logoMediaId
        ? { mediaId: sp.logoMediaId, dataUrl: media[sp.logoMediaId]?.dataUrl, nome: sp.nome }
        : null,
    )
    /* Il modulo sta in cima e la riga toccata puo' essere in fondo: senza
       questo si preme "Modifica" e non succede niente di visibile. */
    formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  function annullaModifica() {
    setInModifica(null)
    setForm(VUOTO)
    setLogo(null)
    setErrore(null)
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
      const campi = {
        nome: form.nome,
        url: form.url,
        nota: form.nota,
        logoMediaId: logo?.mediaId || '',
      }

      const id = inModifica
        ? (await updateSponsor(inModifica, campi), inModifica)
        : await createSponsor(campi)

      /* L'importo va nel documento riservato, MAI in quello pubblico. Poi si
         rifa' la fila: cambiare quanto ha dato uno puo' spostare tutti. */
      await setSponsorRiservato(id, {
        livello: riservati[id]?.livello ?? '',
        nota: riservati[id]?.nota ?? '',
        importo: form.importo,
      })
      await riordinaSponsorPerImporto()

      setForm(VUOTO)
      setLogo(null)
      setInModifica(null)
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
      <form className={s.form} onSubmit={salva} onPaste={incollaLogo} ref={formRef}>
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
            <span className={s.etichetta}>{t('sponsorAdmin.importo')}</span>
            <input
              className={s.input}
              type="number"
              min="0"
              max="1000000"
              step="1"
              inputMode="numeric"
              placeholder="0"
              value={form.importo}
              onChange={aggiorna('importo')}
            />
            <span className={s.aiutoCampo}>{t('sponsorAdmin.importoAiuto')}</span>
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

          {!logo && !fase && (
            /* Detto a parole, perche' nessuno prova Ctrl+V se non sa che si
               puo'. Fuori dal <label> del file: dentro, un clic qui aprirebbe
               la finestra di scelta del file invece di non fare niente. */
            <p className={s.incollaNota}>{t('sponsorAdmin.incollaLogo')}</p>
          )}
        </div>

        <div className={s.azioniForm}>
          <button type="submit" className={s.primario} disabled={!!fase}>
            {fase === 'salvo'
              ? t('sponsorAdmin.salvo')
              : inModifica
                ? t('sponsorAdmin.salvaModifiche')
                : t('sponsorAdmin.aggiungi')}
          </button>

          {/* Compare solo in modifica: aggiungendo uno sponsor nuovo non c'e'
              niente da annullare, e un bottone che non fa niente e' peggio di
              un bottone che non c'e'. */}
          {inModifica && (
            <button
              type="button"
              className={s.piccolo}
              onClick={annullaModifica}
              disabled={!!fase}
            >
              {t('sponsorAdmin.annullaModifica')}
            </button>
          )}
        </div>

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
                    {riservati[sp.id]?.importo != null
                      ? t('sponsorAdmin.importoVoce', { n: riservati[sp.id].importo })
                      : t('sponsorAdmin.senzaImporto')}
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
                  <span className={s.conferma}>
                    <button
                      type="button"
                      className={s.piccolo}
                      onClick={() => modifica(sp)}
                      disabled={!!fase}
                      aria-label={t('sponsorAdmin.modificaAria', { nome: sp.nome })}
                    >
                      {t('sponsorAdmin.modifica')}
                    </button>
                    <button
                      type="button"
                      className={s.piccolo}
                      onClick={() => setConferma(sp.id)}
                      aria-label={t('sponsorAdmin.eliminaAria', { nome: sp.nome })}
                    >
                      {t('sponsorAdmin.elimina')}
                    </button>
                  </span>
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
