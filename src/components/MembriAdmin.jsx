import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Avatar from './Avatar.jsx'
import ErrorState from './ErrorState.jsx'
import Skeleton from './Skeleton.jsx'
import { adminSaveUserProfile, listUsers } from '../lib/db.js'
import { ordinaPersone } from '../lib/citta.js'
import { COMPRESSIBLE, compressAvatar } from '../lib/imageCompress.js'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'
import { memberName } from '../lib/members.jsx'

import s from './MembriAdmin.module.css'

/* =========================================================================
   SISTEMARE IL PROFILO DI UN MEMBRO

   Nasce da un problema vero e misurato: su 47 profili approvati, sei
   mostrano le iniziali grigie invece di una faccia. Tre non hanno mai
   caricato una foto, e tre ce l'hanno ma puntano a un indirizzo di LinkedIn
   o di Google che non risponde piu'. Le persone a cui chiedere di
   risistemarla, in molti casi, sul sito non tornano da mesi.

   COSA NON SI PUO' FARE DA QUI, e sono limiti delle regole e non dimenticanze:

   - il profilo di un altro ADMIN: per quello serve il superadmin;
   - lo STATO (approvato, in attesa, rifiutato): si cambia dalla coda delle
     richieste, che e' il posto dove quella decisione ha un senso;
   - il RUOLO: non e' un campo, e' la lista di email dentro firestore.rules.
     Scrivere 'admin' in un documento non da' nessun potere a nessuno.

   Se una scrittura torna indietro con permission-denied su un profilo
   normale, quasi sempre vuol dire che le regole pubblicate sul database sono
   ancora quelle vecchie: vanno ripubblicate a mano dalla console.
   ========================================================================= */

const VUOTO = {
  displayName: '',
  location: '',
  bio: '',
  photoURL: '',
  linkedin: '',
  instagram: '',
  other: '',
}

function daProfilo(m) {
  return {
    displayName: m.displayName ?? '',
    location: m.location ?? '',
    bio: m.bio ?? '',
    photoURL: m.photoURL ?? '',
    linkedin: m.socials?.linkedin ?? '',
    instagram: m.socials?.instagram ?? '',
    other: m.socials?.other ?? '',
  }
}

export default function MembriAdmin() {
  const { t } = useI18n()

  const [membri, setMembri] = useState([])
  const [stato, setStato] = useState('loading')
  const [errore, setErrore] = useState(null)
  const [tentativo, setTentativo] = useState(0)

  const [apertoUid, setApertoUid] = useState(null)
  const [form, setForm] = useState(VUOTO)
  const [fase, setFase] = useState(null) // 'foto' | 'salvo'
  const [fatto, setFatto] = useState(null)
  const [cerca, setCerca] = useState('')

  const fileRef = useRef(null)

  const carica = useCallback(async () => {
    setStato('loading')
    setErrore(null)
    try {
      const elenco = await listUsers()
      /* Lo stesso ordine della vetrina: chi cerca qualcuno lo cerca dove lo
         ha visto, non in un secondo ordine inventato per il pannello. */
      setMembri(ordinaPersone(elenco).tutti)
      setStato('ready')
    } catch (err) {
      setErrore(err)
      setStato('error')
    }
  }, [])

  useEffect(() => {
    carica()
  }, [carica, tentativo])

  const visibili = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    if (!q) return membri
    return membri.filter((m) =>
      `${m.displayName ?? ''} ${m.location ?? ''}`.toLowerCase().includes(q),
    )
  }, [membri, cerca])

  function apri(m) {
    setApertoUid(m.uid)
    setForm(daProfilo(m))
    setFatto(null)
    setErrore(null)
  }

  function chiudi() {
    setApertoUid(null)
    setForm(VUOTO)
    setErrore(null)
  }

  function scrivi(campo) {
    return (e) => setForm((prec) => ({ ...prec, [campo]: e.target.value }))
  }

  /** Comprime la foto scelta e la mette nel modulo. Non salva: lo fa il bottone. */
  async function prendiFoto(file, input) {
    if (!file) return
    setErrore(null)
    if (!COMPRESSIBLE.includes(file.type)) {
      setErrore(new Error(t('membriAdmin.formatoFoto')))
      if (input) input.value = ''
      return
    }
    setFase('foto')
    try {
      const esito = await compressAvatar(file)
      setForm((prec) => ({ ...prec, photoURL: esito.dataUrl }))
    } catch (err) {
      setErrore(err)
    } finally {
      setFase(null)
      /* Senza azzerare, riscegliere lo STESSO file non fa scattare onChange e
         sembra che il bottone si sia rotto. */
      if (input) input.value = ''
    }
  }

  /** Stessa cosa, ma dagli appunti: si copia una foto e si incolla qui. */
  async function incollaFoto(evento) {
    if (fase) return
    const elementi = Array.from(evento.clipboardData?.items ?? [])
    for (const el of elementi) {
      if (el.kind !== 'file' || !el.type.startsWith('image/')) continue
      const file = el.getAsFile()
      if (!file) continue
      /* Solo quando l'immagine c'e' davvero, altrimenti si bloccherebbe anche
         l'incolla del testo dentro le caselle. */
      evento.preventDefault()
      await prendiFoto(file)
      return
    }
  }

  async function salva(e) {
    e.preventDefault()
    if (fase) return
    setErrore(null)
    setFase('salvo')
    try {
      await adminSaveUserProfile(apertoUid, {
        displayName: form.displayName,
        location: form.location,
        bio: form.bio,
        photoURL: form.photoURL,
        socials: {
          linkedin: form.linkedin,
          instagram: form.instagram,
          other: form.other,
        },
      })
      setFatto(apertoUid)
      setApertoUid(null)
      await carica()
    } catch (err) {
      setErrore(err)
    } finally {
      setFase(null)
    }
  }

  return (
    <section className={s.sezione} aria-labelledby="membri-admin-titolo">
      <h2 className={s.titolo} id="membri-admin-titolo">
        {t('membriAdmin.titolo')}
      </h2>
      <p className={s.intro}>{t('membriAdmin.intro')}</p>

      {stato === 'loading' && <Skeleton count={3} height="3.5rem" />}

      {stato === 'error' && (
        <ErrorState
          title={t('membriAdmin.erroreLettura')}
          onRetry={() => setTentativo((n) => n + 1)}
        />
      )}

      {stato === 'ready' && (
        <>
          <label className={s.cerca}>
            <span className="sr-only">{t('membriAdmin.cerca')}</span>
            <input
              className={s.input}
              type="search"
              value={cerca}
              onChange={(e) => setCerca(e.target.value)}
              placeholder={t('membriAdmin.cerca')}
            />
          </label>

          <ul className={s.elenco}>
            {visibili.map((m) => {
              const nome = memberName(m)
              const aperto = apertoUid === m.uid
              /* Avatar ricade sulle iniziali anche quando l'indirizzo c'e' ma
                 non risponde: il modo onesto di sapere se una foto si vede e'
                 guardare se e' caricata, non se il campo e' pieno. Qui basta
                 segnalare chi non ha proprio niente. */
              const senzaFoto = !String(m.photoURL ?? '').trim()

              return (
                <li className={s.voce} key={m.uid}>
                  <div className={s.riga}>
                    <Avatar src={m.photoURL} name={nome} size={44} />
                    <span className={s.info}>
                      <span className={s.nome}>{nome}</span>
                      <span className={s.meta}>
                        {m.location || t('membriAdmin.senzaCitta')}
                        {senzaFoto ? ` · ${t('membriAdmin.senzaFoto')}` : ''}
                      </span>
                    </span>

                    {fatto === m.uid && <span className={s.fatto}>{t('membriAdmin.salvato')}</span>}

                    <button
                      type="button"
                      className={s.piccolo}
                      onClick={() => (aperto ? chiudi() : apri(m))}
                      aria-expanded={aperto}
                      aria-label={t('membriAdmin.modificaAria', { nome })}
                    >
                      {aperto ? t('membriAdmin.chiudi') : t('membriAdmin.modifica')}
                    </button>
                  </div>

                  {aperto && (
                    <form className={s.form} onSubmit={salva} onPaste={incollaFoto}>
                      <div className={s.fotoRiga}>
                        <Avatar src={form.photoURL} name={form.displayName || nome} size={64} />
                        <div className={s.fotoAzioni}>
                          <label className={s.fileLabel}>
                            <input
                              className="sr-only"
                              ref={fileRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif"
                              onChange={(e) => prendiFoto(e.target.files?.[0], e.target)}
                              disabled={!!fase}
                            />
                            <span className={s.fileBottone}>
                              {fase === 'foto' ? t('membriAdmin.preparo') : t('membriAdmin.cambiaFoto')}
                            </span>
                          </label>
                          <p className={s.aiuto}>{t('membriAdmin.incollaFoto')}</p>
                        </div>
                      </div>

                      <label className={s.campo}>
                        <span className={s.etichetta}>{t('membriAdmin.nome')}</span>
                        <input
                          className={s.input}
                          type="text"
                          maxLength={80}
                          value={form.displayName}
                          onChange={scrivi('displayName')}
                          required
                        />
                      </label>

                      <label className={s.campo}>
                        <span className={s.etichetta}>{t('membriAdmin.citta')}</span>
                        <input
                          className={s.input}
                          type="text"
                          value={form.location}
                          onChange={scrivi('location')}
                        />
                      </label>

                      <label className={s.campo}>
                        <span className={s.etichetta}>{t('membriAdmin.bio')}</span>
                        <textarea
                          className={s.textarea}
                          rows={4}
                          value={form.bio}
                          onChange={scrivi('bio')}
                        />
                      </label>

                      <div className={s.treCampi}>
                        <label className={s.campo}>
                          <span className={s.etichetta}>LinkedIn</span>
                          <input
                            className={s.input}
                            type="url"
                            value={form.linkedin}
                            onChange={scrivi('linkedin')}
                          />
                        </label>
                        <label className={s.campo}>
                          <span className={s.etichetta}>Instagram</span>
                          <input
                            className={s.input}
                            type="url"
                            value={form.instagram}
                            onChange={scrivi('instagram')}
                          />
                        </label>
                        <label className={s.campo}>
                          <span className={s.etichetta}>{t('membriAdmin.sito')}</span>
                          <input
                            className={s.input}
                            type="url"
                            value={form.other}
                            onChange={scrivi('other')}
                          />
                        </label>
                      </div>

                      <div className={s.azioni}>
                        <button type="submit" className={s.primario} disabled={!!fase}>
                          {fase === 'salvo' ? t('membriAdmin.salvo') : t('membriAdmin.salva')}
                        </button>
                        <button
                          type="button"
                          className={s.piccolo}
                          onClick={chiudi}
                          disabled={!!fase}
                        >
                          {t('membriAdmin.annulla')}
                        </button>
                      </div>

                      {errore && (
                        <p className={s.errore} role="alert">
                          {messaggioErrore(t, errore, 'membriAdmin.erroreSalvataggio')}
                        </p>
                      )}
                    </form>
                  )}
                </li>
              )
            })}
          </ul>

          {visibili.length === 0 && <p className={s.vuoto}>{t('membriAdmin.nessuno')}</p>}
        </>
      )}
    </section>
  )
}
