import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import ErrorState from '../components/ErrorState.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { ETA_MASSIMA, ETA_MINIMA, chiaveOpzione } from '../config/candidatura.js'
import { ESITI, componiDossier, linkInstagram, linkLinkedin } from '../lib/candidature.js'
import {
  NOTA_CANDIDATURA_MAX,
  aggiornaValutazione,
  getCandidatura,
  getUserProfile,
  setStatoCandidatura,
  toDate,
} from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './Candidatura.module.css'

/* =========================================================================
   LA SCHEDA DI UNA CANDIDATURA

   Una pagina sua e non un pannello che si apre dentro l'elenco, perche' e'
   la pagina su cui si sta al telefono mentre si parla con qualcuno: ha un
   indirizzo che si puo' mandare a un altro admin, un tasto Indietro che
   funziona, e non perde il punto in cui eri quando ricarichi.

   COSA SI PUO' SCRIVERE DA QUI, e si vede dal fatto che sono quattro cose:
   l'esito, la data dell'ultimo contatto, il promemoria di scrivere e gli
   appunti. LE RISPOSTE NO: quelle sono quello che la persona ha detto, e si
   leggono come le ha dette. Lo impongono anche le rules, non solo questa
   pagina.
   ========================================================================= */

/* Le date di questa pagina sono CORTE, e non e' una scelta estetica: qui si
   guarda una scheda alla volta con il telefono in mano, e "29/10/26, 22:21"
   si legge in un colpo d'occhio mentre "29 ottobre 2026 alle 22:21" fa andare
   la riga a capo. Il resto del sito usa il formato disteso di lib/db.js,
   perche' li' le date si leggono, non si consultano. */
const tagLingua = (lang) => (lang === 'en' ? 'en-GB' : 'it-IT')

function quando(valore, lang) {
  const d = toDate(valore)
  if (!d) return null
  return new Intl.DateTimeFormat(tagLingua(lang), {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * La data di nascita, da "2007-10-18" a "18/10/2007".
 *
 * Il mezzogiorno attaccato in fondo non e' un vezzo: senza, la stringa viene
 * letta come mezzanotte UTC, e in qualunque fuso a ovest di Greenwich la data
 * mostrata scalerebbe di un giorno. Con T12:00:00 viene letta come ora
 * locale, e nessun fuso la sposta abbastanza da cambiarle il giorno.
 */
function dataNascita(iso, lang) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ''))) return null
  return new Intl.DateTimeFormat(tagLingua(lang), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${iso}T12:00:00`))
}

/**
 * L'etichetta tradotta di un'opzione, o null se la risposta non c'e'.
 *
 * chiaveOpzione() torna null su una risposta mancante, e t(null) non e' una
 * stringa vuota: e' il nome di una chiave che non esiste stampato a schermo.
 */
function etichetta(t, gruppo, valore) {
  const chiave = chiaveOpzione(gruppo, valore)
  return chiave ? t(chiave) : null
}

/** Una riga domanda / risposta. Non disegna niente se la risposta manca. */
function Riga({ etichetta, valore, href }) {
  if (!valore) return null
  return (
    <div className={s.riga}>
      <dt className={s.domanda}>{etichetta}</dt>
      <dd className={s.risposta}>
        {href ? (
          <a className={s.link} href={href} target="_blank" rel="noopener noreferrer">
            {valore}
          </a>
        ) : (
          valore
        )}
      </dd>
    </div>
  )
}

export default function Candidatura() {
  const { uid } = useParams()
  const { lang, t } = useI18n()

  const [dossier, setDossier] = useState(null)
  const [stato, setStato] = useState('loading') // loading | ready | assente | error | spento
  const [errore, setErrore] = useState(null)
  const [tentativo, setTentativo] = useState(0)

  const [note, setNote] = useState('')
  const [noteSalvate, setNoteSalvate] = useState(false)
  const [occupato, setOccupato] = useState(null)
  const [erroreAzione, setErroreAzione] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStato('spento')
      return undefined
    }

    let vivo = true
    setStato('loading')
    setErrore(null)

    /* Il profilo con allSettled e la candidatura con il suo errore: senza
       profilo la scheda si legge lo stesso (manca il nome, e si vede), senza
       candidatura non c'e' niente da leggere. */
    Promise.all([getCandidatura(uid), Promise.allSettled([getUserProfile(uid)])])
      .then(([candidatura, [profilo]]) => {
        if (!vivo) return
        if (!candidatura) {
          setStato('assente')
          return
        }
        const d = componiDossier(
          candidatura,
          profilo.status === 'fulfilled' ? profilo.value : null,
        )
        setDossier(d)
        setNote(d.note)
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
  }, [uid, tentativo])

  /* Un solo punto per tutte le scritture della pagina, cosi' il messaggio di
     errore e il bottone bloccato si comportano allo stesso modo qualunque
     tasto si sia premuto. `dopo` aggiorna la scheda in locale: ricaricare
     tutto per aver spuntato una casella sarebbe un giro di rete per niente. */
  const scrivi = useCallback(
    async (azione, lavoro, dopo) => {
      setOccupato(azione)
      setErroreAzione(null)
      try {
        await lavoro()
        setDossier((d) => (d ? { ...d, ...dopo } : d))
        return true
      } catch (err) {
        setErroreAzione(
          err?.code === 'permission-denied'
            ? t('schedaCandidatura.scritturaRifiutata')
            : err?.message || t('schedaCandidatura.operazioneFallita'),
        )
        return false
      } finally {
        setOccupato(null)
      }
    },
    [t],
  )

  const decidi = (esito) =>
    scrivi(esito, () => setStatoCandidatura(uid, esito), { stato: esito, esito })

  const salvaNote = async () => {
    const andata = await scrivi('note', () => aggiornaValutazione(uid, { note }), {
      note: note.trim(),
    })
    if (andata) setNoteSalvate(true)
  }

  if (stato === 'spento') {
    return (
      <main className={`${s.pagina} container`}>
        <p className={s.nota}>{t('candidaturePagina.spento')}</p>
      </main>
    )
  }

  return (
    <main className={`${s.pagina} container`}>
      <p className={s.ritorno}>
        <Link className={s.link} to="/admin/candidature">
          {t('schedaCandidatura.tutte')}
        </Link>
      </p>

      {stato === 'loading' && (
        <div aria-hidden="true">
          <Skeleton height="3rem" count={4} />
        </div>
      )}

      {stato === 'assente' && <p className={s.nota}>{t('schedaCandidatura.nonTrovata')}</p>}

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

      {stato === 'ready' && dossier && (
        <>
          <header className={s.testa}>
            <h1 className={s.titolo}>
              {dossier.nome ?? t('candidaturePagina.senzaNome')}
            </h1>

            <p className={s.etichette}>
              {/* La proposta e' una somma di quattro spunte, non un giudizio:
                  sta accanto al nome perche' la si guarda, non perche' decida. */}
              <span className={`${s.badge} ${s[`proposta_${dossier.proposta}`]}`}>
                {t(`candidatura.proposta.${dossier.proposta}`)}
              </span>
              <span className={`${s.badge} ${s.badge_stato}`}>
                {t(`candidatura.stato.${dossier.stato}`)}
              </span>
            </p>

            <p className={s.meta}>
              {dossier.anni !== null && (
                <>
                  {t('candidatura.eta', { anni: dossier.anni })}
                  {' · '}
                </>
              )}
              {dossier.fascia && (
                <>
                  {t(`schedaCandidatura.fascia.${dossier.fascia}`, {
                    min: ETA_MINIMA,
                    max: ETA_MASSIMA,
                  })}
                  {' · '}
                </>
              )}
              {t('schedaCandidatura.candidataIl', {
                data: quando(dossier.creataIl, lang) ?? '—',
              })}
            </p>

            <p className={s.contatti}>
              {dossier.numeroWa && (
                <a
                  className={s.whatsapp}
                  href={`https://wa.me/${dossier.numeroWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('candidaturePagina.whatsapp')} {dossier.whatsapp}
                </a>
              )}
              {linkInstagram(dossier.instagram) && (
                <a
                  className={s.contatto}
                  href={linkInstagram(dossier.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              )}
              {linkLinkedin(dossier.linkedin) && (
                <a
                  className={s.contatto}
                  href={linkLinkedin(dossier.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              )}
            </p>
          </header>

          {/* --- la decisione ------------------------------------------- */}
          <section className={s.scheda} aria-labelledby="decisione">
            <h2 className={s.schedaTitolo} id="decisione">
              {t('schedaCandidatura.decisione')}
            </h2>

            <p className={s.schedaRiga}>
              {t('schedaCandidatura.esitoFinale')}{' '}
              <strong>
                {dossier.esito
                  ? t(`candidaturePagina.esito.${dossier.esito}`)
                  : t('schedaCandidatura.nonDeciso')}
              </strong>
              {' · '}
              {t('schedaCandidatura.ultimoContatto')}{' '}
              <strong>
                {quando(dossier.contattatoIl, lang) ?? t('schedaCandidatura.mai')}
              </strong>
            </p>

            <div className={s.bottoni}>
              {ESITI.map((e) => (
                <button
                  className={`${s.decide} ${s[`decide_${e}`]}`}
                  key={e}
                  type="button"
                  disabled={occupato !== null || dossier.esito === e}
                  onClick={() => decidi(e)}
                >
                  {occupato === e
                    ? t('schedaCandidatura.salvo')
                    : t(`schedaCandidatura.conferma.${e}`)}
                </button>
              ))}
            </div>

            <div className={s.bottoni}>
              <label className={s.spunta}>
                <input
                  type="checkbox"
                  checked={dossier.daScrivere}
                  disabled={occupato !== null}
                  onChange={(e) =>
                    scrivi(
                      'daScrivere',
                      () => aggiornaValutazione(uid, { daScrivere: e.target.checked }),
                      { daScrivere: e.target.checked },
                    )
                  }
                />
                {t('candidaturePagina.daScrivere')}
              </label>

              {/* Scrive la DATA, non lo stato: se fosse uno stato, segnare
                  come contattata una persona gia' accettata le cancellerebbe
                  l'esito. Vedi il commento in lib/candidature.js. */}
              <button
                className={s.secondario}
                type="button"
                disabled={occupato !== null}
                onClick={() =>
                  scrivi(
                    'contatto',
                    () => aggiornaValutazione(uid, { contattatoIl: !dossier.contattata }),
                    {
                      contattata: !dossier.contattata,
                      contattatoIl: dossier.contattata ? null : new Date(),
                    },
                  )
                }
              >
                {dossier.contattata
                  ? t('schedaCandidatura.annullaContatto')
                  : t('schedaCandidatura.segnaContattata')}
              </button>
            </div>

            {erroreAzione && (
              <p className={s.errore} role="alert">
                {erroreAzione}
              </p>
            )}
          </section>

          {/* --- gli appunti ------------------------------------------- */}
          <section className={s.scheda} aria-labelledby="note">
            <h2 className={s.schedaTitolo} id="note">
              {t('schedaCandidatura.note')}
            </h2>

            <textarea
              className={s.textarea}
              value={note}
              maxLength={NOTA_CANDIDATURA_MAX}
              rows={4}
              placeholder={t('schedaCandidatura.notePlaceholder')}
              onChange={(e) => {
                setNote(e.target.value)
                setNoteSalvate(false)
              }}
            />

            {/* L'avviso sotto al campo e non nel README: queste note stanno
                dentro un documento che la persona puo' leggere. */}
            <p className={s.avviso}>{t('schedaCandidatura.noteAvviso')}</p>

            <button
              className={s.salva}
              type="button"
              disabled={occupato !== null}
              onClick={salvaNote}
            >
              {occupato === 'note' ? t('schedaCandidatura.salvo') : t('schedaCandidatura.salvaNote')}
            </button>
            {noteSalvate && <span className={s.salvate}>{t('schedaCandidatura.salvate')}</span>}
          </section>

          {/* --- il punteggio ------------------------------------------ */}
          <section className={s.scheda} aria-labelledby="punteggio">
            <h2 className={s.schedaTitolo} id="punteggio">
              {t('schedaCandidatura.punteggioTitolo', {
                punti: dossier.punteggio,
                su: dossier.su,
              })}
            </h2>
            <p className={s.spiega}>{t('schedaCandidatura.punteggioSpiega')}</p>

            <ul className={s.criteri}>
              {dossier.dettaglio.map((d) => (
                <li className={d.scattato ? s.criterioSi : s.criterioNo} key={d.id}>
                  {/* Il segno PRIMA e il punteggio accanto al nome: si legge
                      "questo si', e vale uno". Il segno non e' solo colore,
                      perche' chi non distingue il verde dal rosso deve poter
                      dire lo stesso quali criteri sono scattati. */}
                  <span className={s.segno} aria-hidden="true">
                    {d.scattato ? '✓' : '✗'}
                  </span>
                  <span>
                    <strong className={s.criterioNome}>
                      {t(`schedaCandidatura.criterio.${d.id}`)}
                    </strong>{' '}
                    <span className={s.criterioPunto}>
                      {d.scattato
                        ? t('schedaCandidatura.piuUno')
                        : t('schedaCandidatura.zero')}
                    </span>
                    <span className={s.criterioTesto}>{t(d.chiave)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* --- le risposte ------------------------------------------- */}
          <section className={s.scheda} aria-labelledby="risposte">
            <h2 className={s.schedaTitolo} id="risposte">
              {t('schedaCandidatura.risposte')}
            </h2>

            <dl className={s.elenco}>
              <Riga
                etichetta={t('schedaCandidatura.domanda.dataNascita')}
                valore={dataNascita(dossier.candidatura.dataNascita, lang)}
              />
              <Riga etichetta={t('schedaCandidatura.domanda.citta')} valore={dossier.citta} />
              <Riga
                etichetta="Instagram"
                valore={dossier.instagram}
                href={linkInstagram(dossier.instagram)}
              />
              <Riga
                etichetta="LinkedIn"
                valore={dossier.linkedin}
                href={linkLinkedin(dossier.linkedin)}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.occupazione')}
                valore={etichetta(t, 'occupazione', dossier.candidatura.occupazione)}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.ruolo')}
                valore={etichetta(t, 'ruolo', dossier.candidatura.ruolo)}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.stadioProgetto')}
                valore={etichetta(t, 'stadio', dossier.candidatura.stadioProgetto)}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.progettoLink')}
                valore={dossier.candidatura.progettoLink}
                href={dossier.candidatura.progettoLink}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.nPitch')}
                valore={etichetta(t, 'nPitch', dossier.candidatura.nPitch)}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.nEventi')}
                valore={etichetta(t, 'nEventi', dossier.candidatura.nEventi)}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.eventiQuali')}
                valore={dossier.candidatura.eventiQuali}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.fonte')}
                valore={etichetta(t, 'fonte', dossier.candidatura.fonte)}
              />
              <Riga
                etichetta={t('schedaCandidatura.domanda.motivazione')}
                valore={dossier.candidatura.motivazione}
              />
              <Riga etichetta={t('schedaCandidatura.domanda.chiE')} valore={dossier.bio} />
            </dl>

            <p className={s.consensi}>
              {t('schedaCandidatura.consensi', {
                privacy: dossier.candidatura.consensoPrivacy ? '✓' : '✗',
                whatsapp: dossier.candidatura.consensoWhatsapp ? '✓' : '✗',
                data: quando(dossier.creataIl, lang) ?? '—',
              })}
            </p>
          </section>
        </>
      )}
    </main>
  )
}
