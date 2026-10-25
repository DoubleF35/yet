import { useEffect, useState } from 'react'

import { EVENTI } from '../config/eventi.js'
import { getOspiti, OSPITE_MAX, OSPITI_MAX, setOspiti } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { messaggioErrore, useI18n } from '../lib/i18n.jsx'

import s from './OspitiAdmin.module.css'

/* =========================================================================
   CHI CI HA OSPITATO, DAL PANNELLO

   La striscia sotto "Dove ci siamo visti". Prima i nomi stavano nel codice,
   dentro il campo `ospiti` dei resoconti: aggiungerne uno voleva dire aprire
   un file e fare un deploy.

   SI PARTE DA QUELLI CHE CI SONO GIA'. La prima volta che si apre, la lista
   non e' vuota: dentro ci sono i nomi dei resoconti, cioe' quelli che in
   questo momento si vedono sulla home. Cosi' salvare non fa sparire niente,
   e chi apre questa sezione ritrova quello che ha davanti sul sito invece di
   doverlo ricopiare.

   SALVARE UNA LISTA VUOTA fa sparire la striscia, ed e' l'unico modo per
   toglierla. Scritto anche a schermo, perche' altrimenti sembra un bottone
   che non ha funzionato.
   ========================================================================= */

/**
 * Il perche' di un permesso mancante lo sappiamo gia', ed e' sempre lo stesso:
 * le regole sul database non sono state ripubblicate dopo l'aggiunta di questa
 * sezione. Vale la pena scriverlo invece di lasciare "Missing or insufficient
 * permissions", che e' in inglese e non dice cosa fare.
 */
function testoErrore(t, err) {
  if (err?.code === 'permission-denied') return t('ospitiAdmin.erroreSalvataggio')
  return messaggioErrore(t, err, 'ospitiAdmin.erroreSalvataggio')
}

/** I nomi che il sito mostra adesso, presi dai resoconti. */
function nomiDaiResoconti() {
  return [...new Set(EVENTI.flatMap((e) => e.ospiti ?? []))]
}

export default function OspitiAdmin() {
  const { t } = useI18n()

  const [bozza, setBozza] = useState([])
  const [stato, setStato] = useState(isFirebaseConfigured ? 'caricamento' : 'spento')
  const [salvando, setSalvando] = useState(false)
  const [salvato, setSalvato] = useState(false)
  const [errore, setErrore] = useState(null)
  /* Tenuto separato dall'errore di salvataggio: sono due guai diversi e
     scrivere "non riesco a salvare" quando il problema era la lettura manda
     a cercare nel posto sbagliato. */
  const [letturaRotta, setLetturaRotta] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true

    getOspiti()
      .then((elenco) => {
        if (!vivo) return
        /* null vuol dire "non l'ha mai scritto nessuno": si parte da quelli
           dei resoconti, che sono quelli che si vedono sulla home. */
        setBozza(elenco ?? nomiDaiResoconti())
        setStato('pronto')
      })
      .catch((e) => {
        if (!vivo) return
        console.warn('[YET] Non riesco a leggere gli ospiti salvati.', e)
        setLetturaRotta(true)
        setStato('pronto')
        setBozza(nomiDaiResoconti())
      })

    return () => {
      vivo = false
    }
  }, [])

  function scrivi(i, valore) {
    setSalvato(false)
    setBozza((prec) => prec.map((x, k) => (k === i ? valore : x)))
  }

  function aggiungi() {
    setSalvato(false)
    setBozza((prec) => (prec.length >= OSPITI_MAX ? prec : [...prec, '']))
  }

  function togli(i) {
    setSalvato(false)
    setBozza((prec) => prec.filter((_, k) => k !== i))
  }

  /* Sposta un nome di un posto. L'ordine conta: il primo della striscia e'
     quello che si vede per primo quando il nastro parte. */
  function sposta(i, verso) {
    setSalvato(false)
    setBozza((prec) => {
      const j = i + verso
      if (j < 0 || j >= prec.length) return prec
      const fuori = [...prec]
      ;[fuori[i], fuori[j]] = [fuori[j], fuori[i]]
      return fuori
    })
  }

  async function salva() {
    if (salvando) return
    setSalvando(true)
    setErrore(null)
    setSalvato(false)
    try {
      /* setOspiti ripulisce e restituisce quello che ha davvero scritto: si
         rimette nella bozza, cosi' i vuoti e i doppioni spariscono dal modulo
         invece di restare li' a far credere che siano stati salvati. */
      const puliti = await setOspiti(bozza)
      setBozza(puliti)
      setSalvato(true)
      setLetturaRotta(false)
    } catch (err) {
      setErrore(err)
    } finally {
      setSalvando(false)
    }
  }

  if (stato === 'spento') return null

  return (
    <section className={s.sezione} aria-labelledby="ospiti-admin-titolo">
      <h2 className={s.titolo} id="ospiti-admin-titolo">
        {t('ospitiAdmin.titolo')}
      </h2>
      <p className={s.intro}>{t('ospitiAdmin.intro')}</p>

      {letturaRotta && (
        <p className={s.avviso}>{t('ospitiAdmin.erroreLettura')}</p>
      )}

      {stato === 'pronto' && (
        <>
          {bozza.length === 0 ? (
            <p className={s.vuoto}>{t('ospitiAdmin.nessuno')}</p>
          ) : (
            <ol className={s.elenco}>
              {bozza.map((nome, i) => (
                /* La chiave e' la posizione e non il nome, ed e' il caso in
                   cui ci vuole: due righe nuove sono tutte e due vuote, e con
                   il nome come chiave React le considererebbe la stessa. */
                // eslint-disable-next-line react/no-array-index-key
                <li className={s.voce} key={i}>
                  <label className={s.campo}>
                    <span className="sr-only">{t('ospitiAdmin.nome')}</span>
                    <input
                      className={s.input}
                      type="text"
                      maxLength={OSPITE_MAX}
                      placeholder={t('ospitiAdmin.nome')}
                      value={nome}
                      onChange={(e) => scrivi(i, e.target.value)}
                    />
                  </label>

                  <div className={s.comandi}>
                    <button
                      type="button"
                      className={s.mini}
                      onClick={() => sposta(i, -1)}
                      disabled={i === 0}
                      aria-label={t('ospitiAdmin.suAria')}
                    >
                      &#8593;
                    </button>
                    <button
                      type="button"
                      className={s.mini}
                      onClick={() => sposta(i, 1)}
                      disabled={i === bozza.length - 1}
                      aria-label={t('ospitiAdmin.giuAria')}
                    >
                      &#8595;
                    </button>
                    <button
                      type="button"
                      className={s.mini}
                      onClick={() => togli(i)}
                      aria-label={t('ospitiAdmin.togliAria')}
                    >
                      &#215;
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className={s.azioni}>
            <button
              type="button"
              className={s.piccolo}
              onClick={aggiungi}
              disabled={bozza.length >= OSPITI_MAX}
            >
              {t('ospitiAdmin.aggiungi')}
            </button>
            <button
              type="button"
              className={s.primario}
              onClick={salva}
              disabled={salvando}
            >
              {salvando ? t('ospitiAdmin.salvo') : t('ospitiAdmin.salva')}
            </button>
            {salvato && (
              <span className={s.fatto} role="status">
                {t('ospitiAdmin.fatto')}
              </span>
            )}
          </div>

          <p className={s.aiuto}>{t('ospitiAdmin.perToglierla')}</p>
        </>
      )}

      {errore && (
        <p className={s.errore} role="alert">
          {testoErrore(t, errore)}
        </p>
      )}
    </section>
  )
}
