import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import EmptyState from '../components/EmptyState.jsx'
import ErrorState from '../components/ErrorState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import {
  ESITI,
  FASCE,
  aCsv,
  componiDossiers,
  conteggi,
  filtra,
  linkInstagram,
  linkLinkedin,
} from '../lib/candidature.js'
import { useAuth } from '../lib/auth.jsx'
import { adminListUsers, aggiornaValutazione, listCandidature } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Candidature.module.css'

/* =========================================================================
   L'ELENCO DELLE CANDIDATURE

   La coda delle richieste (/admin/richieste) risponde a "chi devo approvare
   adesso". Questa pagina risponde a una domanda diversa, che arriva dopo:
   "a chi ho gia' scritto, chi mi manca, e chi ho deciso di prendere". Sono
   due mestieri e stanno su due pagine, come le richieste stanno fuori dal
   pannello per non finire in mezzo alle notizie.

   IL PUNTEGGIO NON SI LEGGE DAL DATABASE perche' nel database non c'e': lo
   calcola componiDossiers() mentre guardi la pagina. Vedi lib/punteggio.js.

   QUANTO PESA. Si leggono tutte le candidature e tutti i profili, e i profili
   si portano dietro la foto come data URL: oggi sono meno di un megabyte in
   tutto. E' il prezzo di poter filtrare e contare senza un server, e lo paga
   solo chi e' admin, una volta per apertura della pagina. Il giorno in cui
   fosse troppo, la strada non e' alleggerire questa lettura: e' smettere di
   tenere le foto dentro i documenti.
   ========================================================================= */

const FILTRI_VUOTI = {
  testo: '',
  stato: 'tutti',
  esito: 'tutti',
  fascia: 'tutte',
  senzaLinkedin: false,
  daScrivere: false,
}

/** Una delle sei caselle in cima. */
function Numero({ etichetta, valore, tono }) {
  return (
    <div className={`${s.numero} ${s[tono] ?? ''}`}>
      <span className={s.numeroEtichetta}>{etichetta}</span>
      <strong className={s.numeroValore}>{valore}</strong>
    </div>
  )
}

export default function Candidature() {
  const { t } = useI18n()
  const { signOutUser } = useAuth()

  const [dossiers, setDossiers] = useState([])
  const [stato, setStato] = useState('loading') // loading | ready | error | spento
  const [errore, setErrore] = useState(null)
  const [tentativo, setTentativo] = useState(0)

  const [filtri, setFiltri] = useState(FILTRI_VUOTI)
  const [esitoCsv, setEsitoCsv] = useState('accettato')

  /* Quale riga sta salvando la spunta, e l'errore di quella riga. Per riga e
     non globale: con un flag solo, spuntare una casella bloccherebbe tutte le
     altre e un errore non direbbe quale persona non e' stata salvata. */
  const [occupato, setOccupato] = useState({})
  const [erroriRiga, setErroriRiga] = useState({})

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStato('spento')
      return undefined
    }

    let vivo = true
    setStato('loading')
    setErrore(null)

    /* Le due letture insieme. Qui pero' servono TUTTE E DUE: senza i profili
       l'elenco non avrebbe nemmeno i nomi, e un elenco di identificativi non
       e' una pagina, e' un dump. Quindi Promise.all e non allSettled. */
    Promise.all([listCandidature(), adminListUsers()])
      .then(([candidature, profili]) => {
        if (!vivo) return
        setDossiers(componiDossiers(candidature, profili))
        setStato('ready')
      })
      .catch((err) => {
        if (!vivo) return
        setErrore(err)
        setStato('error')
      })

    return () => {
      vivo = false
    }
  }, [tentativo])

  const numeri = useMemo(() => conteggi(dossiers), [dossiers])
  const visibili = useMemo(() => filtra(dossiers, filtri), [dossiers, filtri])

  const cambia = (campo) => (e) => {
    const valore = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFiltri((f) => ({ ...f, [campo]: valore }))
  }

  /* La spunta "da scrivere" si cambia anche da qui e non solo dalla scheda:
     il giro che si fa davvero e' scorrere l'elenco col telefono in mano,
     scrivere, e spuntare. Farlo aprendo e chiudendo venti schede non lo
     farebbe nessuno. */
  const segnaDaScrivere = useCallback(
    async (uid, valore) => {
      setOccupato((o) => ({ ...o, [uid]: true }))
      setErroriRiga((e) => ({ ...e, [uid]: null }))
      try {
        await aggiornaValutazione(uid, { daScrivere: valore })
        setDossiers((lista) =>
          lista.map((d) => (d.uid === uid ? { ...d, daScrivere: valore } : d)),
        )
      } catch (err) {
        setErroriRiga((e) => ({
          ...e,
          [uid]:
            err?.code === 'permission-denied'
              ? t('candidaturePagina.scritturaRifiutata')
              : err?.message || t('candidaturePagina.operazioneFallita'),
        }))
      } finally {
        setOccupato((o) => ({ ...o, [uid]: false }))
      }
    },
    [t],
  )

  /* Il CSV si fabbrica nel browser e si scarica da un indirizzo che vive il
     tempo di un clic: non c'e' un server a cui chiederlo, e non serve. */
  const scaricaCsv = useCallback(() => {
    const scelti = dossiers.filter((d) => d.esito === esitoCsv)
    const testo = aCsv(scelti, [
      t('candidaturePagina.csv.nome'),
      t('candidaturePagina.csv.whatsapp'),
      t('candidaturePagina.csv.citta'),
      t('candidaturePagina.csv.instagram'),
      t('candidaturePagina.csv.linkedin'),
    ])

    const blob = new Blob([testo], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yet-${esitoCsv}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [dossiers, esitoCsv, t])

  return (
    <main className={`${s.pagina} container`}>
      <p className={s.ritorno}>
        <Link className={s.link} to="/admin">
          {t('candidaturePagina.tornaAlPannello')}
        </Link>
      </p>

      <header className={s.testa}>
        <div className={s.testaRiga}>
          <h1 className={s.titolo}>{t('candidaturePagina.titolo')}</h1>
          {/* L'uscita sta qui e non solo in navbar perche' e' una pagina su
              cui si sta a lungo, con i dati di altre persone sotto gli occhi,
              spesso su un telefono passato di mano. */}
          <button className={s.esci} type="button" onClick={() => signOutUser()}>
            {t('nav.esci')}
          </button>
        </div>
        <p className={s.intro}>{t('candidaturePagina.intro')}</p>
        {/* Detto a schermo e non solo nel README: chi apre questa pagina e'
            esattamente la persona che si sta chiedendo dove sia l'email. */}
        <p className={s.nota}>{t('candidaturePagina.nienteEmail')}</p>
      </header>

      {stato === 'spento' && <p className={s.nota}>{t('candidaturePagina.spento')}</p>}

      {stato === 'loading' && (
        <div aria-hidden="true">
          <Skeleton height="4rem" count={3} />
        </div>
      )}

      {stato === 'error' && (
        <ErrorState
          title={t('candidaturePagina.erroreTitolo')}
          message={
            errore?.code === 'permission-denied'
              ? t('candidaturePagina.errorePermessi')
              : t('candidaturePagina.erroreGenerico')
          }
          onRetry={() => setTentativo((n) => n + 1)}
        />
      )}

      {stato === 'ready' && dossiers.length === 0 && (
        <EmptyState title={t('candidaturePagina.vuotoTitolo')}>
          {t('candidaturePagina.vuotoTesto')}
        </EmptyState>
      )}

      {stato === 'ready' && dossiers.length > 0 && (
        <>
          <section className={s.numeri} aria-label={t('candidaturePagina.numeriAria')}>
            <Numero etichetta={t('candidaturePagina.conteggi.totale')} valore={numeri.totale} />
            <Numero
              etichetta={t('candidaturePagina.conteggi.plus')}
              valore={numeri.plus}
              tono="plus"
            />
            <Numero
              etichetta={t('candidaturePagina.conteggi.daValutare')}
              valore={numeri.daValutare}
              tono="attesa"
            />
            <Numero
              etichetta={t('candidaturePagina.conteggi.event')}
              valore={numeri.event}
              tono="event"
            />
            <Numero
              etichetta={t('candidaturePagina.conteggi.u16')}
              valore={numeri.u16}
              tono="u16"
            />
            <Numero
              etichetta={t('candidaturePagina.conteggi.senzaLinkedin')}
              valore={`${numeri.senzaLinkedinPerc}%`}
            />
          </section>

          {/* I filtri si applicano MENTRE scrivi, non premendo "Filtra".
              Il bottone resta perche' su un telefono serve a chiudere la
              tastiera, e perche' una casella di ricerca senza un bottone
              accanto lascia il dubbio di non aver cercato: qui non fa altro
              che mandare il fuoco ai risultati. */}
          <form
            className={s.filtri}
            onSubmit={(e) => {
              e.preventDefault()
              document.getElementById('risultati')?.focus()
            }}
          >
            <input
              className={s.cerca}
              type="search"
              value={filtri.testo}
              onChange={cambia('testo')}
              placeholder={t('candidaturePagina.cerca')}
              aria-label={t('candidaturePagina.cerca')}
            />

            <select
              className={s.select}
              value={filtri.stato}
              onChange={cambia('stato')}
              aria-label={t('candidaturePagina.stato.aria')}
            >
              <option value="tutti">{t('candidaturePagina.stato.tutti')}</option>
              <option value="nuovo">{t('candidaturePagina.stato.nuovo')}</option>
              <option value="contattato">{t('candidaturePagina.stato.contattato')}</option>
            </select>

            <select
              className={s.select}
              value={filtri.esito}
              onChange={cambia('esito')}
              aria-label={t('candidaturePagina.esito.aria')}
            >
              <option value="tutti">{t('candidaturePagina.esito.tutti')}</option>
              <option value="non-deciso">{t('candidaturePagina.esito.nonDeciso')}</option>
              {ESITI.map((e) => (
                <option key={e} value={e}>
                  {t(`candidaturePagina.esito.${e}`)}
                </option>
              ))}
            </select>

            <select
              className={s.select}
              value={filtri.fascia}
              onChange={cambia('fascia')}
              aria-label={t('candidaturePagina.fascia.aria')}
            >
              <option value="tutte">{t('candidaturePagina.fascia.tutte')}</option>
              {FASCE.map((f) => (
                <option key={f} value={f}>
                  {t(`candidaturePagina.fascia.${f}`)}
                </option>
              ))}
              <option value="ignota">{t('candidaturePagina.fascia.ignota')}</option>
            </select>

            <label className={s.spunta}>
              <input
                type="checkbox"
                checked={filtri.senzaLinkedin}
                onChange={cambia('senzaLinkedin')}
              />
              {t('candidaturePagina.soloSenzaLinkedin')}
            </label>

            <label className={s.spunta}>
              <input
                type="checkbox"
                checked={filtri.daScrivere}
                onChange={cambia('daScrivere')}
              />
              {t('candidaturePagina.soloDaScrivere')}
            </label>

            <div className={s.bottoniFiltri}>
              <button className={s.filtra} type="submit">
                {t('candidaturePagina.filtra')}
              </button>
              <button
                className={s.azzera}
                type="button"
                onClick={() => setFiltri(FILTRI_VUOTI)}
              >
                {t('candidaturePagina.azzera')}
              </button>
            </div>
          </form>

          <div className={s.esporta}>
            <label className={s.esportaEtichetta} htmlFor="csv-esito">
              {t('candidaturePagina.esporta')}
            </label>
            <div className={s.esportaRiga}>
              <select
                className={s.select}
                id="csv-esito"
                value={esitoCsv}
                onChange={(e) => setEsitoCsv(e.target.value)}
              >
                {ESITI.map((e) => (
                  <option key={e} value={e}>
                    {t(`candidaturePagina.esito.${e}`)}
                  </option>
                ))}
              </select>
              <button className={s.scarica} type="button" onClick={scaricaCsv}>
                {t('candidaturePagina.scarica')}
              </button>
            </div>
          </div>

          {/* tabIndex -1 per poterci mandare il fuoco da "Filtra", aria-live
              perche' chi non vede lo schermo sappia quante ne sono rimaste
              senza dover rileggere tutto l'elenco. */}
          <p className={s.risultati} id="risultati" tabIndex={-1} aria-live="polite">
            {visibili.length === 1
              ? t('candidaturePagina.unRisultato')
              : t('candidaturePagina.risultati', { n: visibili.length })}
          </p>

          {visibili.length === 0 ? (
            <p className={s.nota}>{t('candidaturePagina.nessunRisultato')}</p>
          ) : (
            <ul className={s.elenco}>
              {visibili.map((d) => (
                <li className={s.riga} key={d.uid}>
                  <div className={s.rigaTesta}>
                    <Link className={s.nome} to={`/admin/candidature/${d.uid}`}>
                      {d.nome ?? t('candidaturePagina.senzaNome')}
                    </Link>

                    {/* UNA SPUNTA SOLA, CHE CAMBIA NOME. Non due controlli:
                        "da scrivere" e "scritto" sono lo stesso fatto visto
                        dai due lati, e due caselle che dicono la stessa cosa
                        finiscono prima o poi in disaccordo. */}
                    <label
                      className={d.daScrivere ? s.rigaSpunta : s.rigaSpuntaFatta}
                    >
                      <input
                        type="checkbox"
                        checked={!d.daScrivere}
                        disabled={!!occupato[d.uid]}
                        onChange={(e) => segnaDaScrivere(d.uid, !e.target.checked)}
                      />
                      {d.daScrivere
                        ? t('candidaturePagina.daScrivere')
                        : t('candidaturePagina.scritto')}
                    </label>
                  </div>

                  <p className={s.etichette}>
                    {d.esito ? (
                      <span className={`${s.badge} ${s[`badge_${d.esito}`]}`}>
                        {t(`candidaturePagina.badge.${d.esito}`)}
                      </span>
                    ) : (
                      <span className={`${s.badge} ${s[`proposta_${d.proposta}`]}`}>
                        {t(`candidatura.proposta.${d.proposta}`)}
                      </span>
                    )}
                    {d.senzaLinkedin && (
                      <span className={`${s.badge} ${s.badge_attenzione}`}>
                        {t('candidaturePagina.senzaLinkedin')}
                      </span>
                    )}
                    <span className={s.statoRiga}>
                      {d.contattata
                        ? t('candidaturePagina.stato.contattato')
                        : t('candidaturePagina.stato.nuovo')}
                    </span>
                    <span className={s.punti}>
                      {t('candidaturePagina.punti', { punti: d.punteggio, su: d.su })}
                    </span>
                    {d.citta && <span className={s.citta}>{d.citta}</span>}
                  </p>

                  <p className={s.azioni}>
                    {d.numeroWa && (
                      <a
                        className={s.whatsapp}
                        href={`https://wa.me/${d.numeroWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('candidaturePagina.whatsapp')}
                      </a>
                    )}
                    {linkLinkedin(d.linkedin) && (
                      <a
                        className={s.social}
                        href={linkLinkedin(d.linkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn ↗
                      </a>
                    )}
                    {linkInstagram(d.instagram) && (
                      <a
                        className={s.social}
                        href={linkInstagram(d.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram ↗
                      </a>
                    )}
                    <Link className={s.apri} to={`/admin/candidature/${d.uid}`}>
                      {t('candidaturePagina.apri')}
                    </Link>
                  </p>

                  {erroriRiga[d.uid] && (
                    <p className={s.erroreRiga} role="alert">
                      {erroriRiga[d.uid]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
