import { useMemo, useState } from 'react'

import { numeroWhatsapp } from '../lib/candidature.js'
import { adminSalvaGruppo, estraiNumeri } from '../lib/db.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './GruppoWhatsApp.module.css'

/* =========================================================================
   IL GRUPPO WHATSAPP, NEL PANNELLO

   Due cose, che vanno in due posti diversi del database:

     QUANTE PERSONE ci sono nel gruppo: e' il numero della home, e lo legge
     chiunque (gruppo/pubblico). Si scrive a mano, guardando WhatsApp, perche'
     molti contatti in rubrica WhatsApp li mostra col nome e non col numero,
     quindi contare i numeri incollati darebbe un totale sbagliato per difetto.

     I NUMERI: si incollano da dove capita, e servono SOLO qui, a riconoscere
     chi del gruppo si e' gia' candidato e chi no (gruppo/numeri, solo admin).
     Non compaiono su nessuna pagina pubblica: quelle persone non si sono
     iscritte al sito.
   ========================================================================= */
export default function GruppoWhatsApp({ gruppo, onSalvato, numeriCandidati }) {
  const { t } = useI18n()
  const [persone, setPersone] = useState(String(gruppo?.persone || ''))
  const [testo, setTesto] = useState('')
  const [stato, setStato] = useState(null) // null | salvo | salvato | errore
  const [errore, setErrore] = useState(null)

  const numeri = gruppo?.numeri ?? []
  /* I numeri del gruppo che non hanno ancora mandato una candidatura: e' la
     lista a cui scrivere. */
  const mancanti = useMemo(
    () => numeri.filter((n) => !numeriCandidati.has(n)),
    [numeri, numeriCandidati],
  )
  const nuovi = useMemo(() => estraiNumeri(testo), [testo])

  const salva = async () => {
    setStato('salvo')
    setErrore(null)
    try {
      /* I numeri incollati si AGGIUNGONO a quelli che c'erano: incollare una
         seconda pagina dell'elenco non deve cancellare la prima. */
      const tutti = [...new Set([...numeri, ...nuovi])]
      const salvato = await adminSalvaGruppo({ persone, numeri: tutti })
      onSalvato(salvato)
      setTesto('')
      setStato('salvato')
    } catch (err) {
      setErrore(
        err?.code === 'permission-denied'
          ? t('gruppo.regole')
          : err?.message || t('candidaturePagina.operazioneFallita'),
      )
      setStato('errore')
    }
  }

  return (
    <details className={s.gruppo}>
      <summary className={s.titolo}>
        {t('gruppo.titolo')}
        <span className={s.riassunto}>
          {t('gruppo.riassunto', {
            persone: gruppo?.persone || 0,
            numeri: numeri.length,
            mancanti: mancanti.length,
          })}
        </span>
      </summary>

      <p className={s.spiega}>{t('gruppo.spiega')}</p>

      <label className={s.etichetta} htmlFor="gruppo-persone">
        {t('gruppo.persone')}
      </label>
      <input
        className={s.campo}
        id="gruppo-persone"
        type="number"
        inputMode="numeric"
        min="0"
        value={persone}
        onChange={(e) => setPersone(e.target.value)}
      />

      <label className={s.etichetta} htmlFor="gruppo-numeri">
        {t('gruppo.incolla')}
      </label>
      <textarea
        className={s.campo}
        id="gruppo-numeri"
        rows={4}
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="+39 349 691 0331&#10;+39 350 065 5948"
      />
      <p className={s.spiega}>{t('gruppo.trovati', { n: nuovi.length })}</p>

      <button className={s.salva} type="button" disabled={stato === 'salvo'} onClick={salva}>
        {stato === 'salvo' ? t('schedaCandidatura.salvo') : t('gruppo.salva')}
      </button>
      {stato === 'salvato' && <span className={s.ok}>{t('gruppo.salvato')}</span>}
      {errore && (
        <p className={s.errore} role="alert">
          {errore}
        </p>
      )}

      {mancanti.length > 0 && (
        <>
          <h3 className={s.sottotitolo}>{t('gruppo.mancantiTitolo', { n: mancanti.length })}</h3>
          <ul className={s.lista}>
            {mancanti.map((n) => (
              <li key={n}>
                <a
                  className={s.link}
                  href={`https://wa.me/${numeroWhatsapp(n)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {n}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  )
}
