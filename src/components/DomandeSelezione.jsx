import { useId } from 'react'

import {
  FONTI,
  N_EVENTI,
  N_PITCH,
  OCCUPAZIONI,
  RUOLI,
  STADI_PROGETTO,
  anniCompiuti,
  chiaveOpzione,
  ETA_MASSIMA,
  ETA_MINIMA,
} from '../config/candidatura.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './DomandeSelezione.module.css'

/* =========================================================================
   LE DOMANDE DI SELEZIONE

   Stanno in un componente a parte e non dentro Join.jsx, che e' gia' a
   quasi mille righe. Il confine e' netto: QUESTE RISPOSTE NON SI VEDONO MAI
   in vetrina, mentre tutto il resto del form di Join e' roba pubblica. Due
   destini diversi, due file diversi.

   Il componente non parla con Firestore e non valida niente da solo: riceve
   i valori e li rimanda su. Chi lo usa decide cosa farne, cosi' la stessa
   lista di domande si puo' anche solo mostrare, in sola lettura, nel
   pannello di chi valuta.
   ========================================================================= */

/**
 * Una domanda a scelta singola.
 *
 * <fieldset> e <legend> e non un <div> con un <p>: per chi naviga con uno
 * screen reader e' quello che lega la domanda alle risposte. Senza, si
 * sentono cinque opzioni sciolte senza sapere a cosa rispondono.
 */
function Scelta({
  nome,
  gruppo,
  opzioni,
  valore,
  onCambia,
  obbligatoria = true,
  errore,
  /* Di norma la domanda ha la stessa chiave del gruppo. `stadio` e' l'unico
     caso in cui non combaciano: il gruppo si chiama cosi' per via dei nomi
     delle opzioni (stadioNessuno, stadioIdea), ma la domanda e' "a che punto
     e' il progetto". Un parametro invece di una chiave inventata apposta. */
  chiaveDomanda,
}) {
  const { t } = useI18n()
  const id = useId()
  const idErrore = `${id}-err`

  return (
    <fieldset
      className={s.scelta}
      aria-required={obbligatoria ? 'true' : undefined}
      aria-invalid={errore ? 'true' : undefined}
      aria-describedby={errore ? idErrore : undefined}
    >
      <legend className={s.domanda}>
        {t(chiaveDomanda ?? `candidatura.${gruppo}`)}
        {obbligatoria && (
          <span className={s.req} aria-hidden="true">
            {' *'}
          </span>
        )}
      </legend>

      <div className={s.opzioni}>
        {opzioni.map((o) => {
          const idOpzione = `${id}-${o}`
          return (
            <label
              className={valore === o ? `${s.opzione} ${s.opzioneScelta}` : s.opzione}
              key={o}
              htmlFor={idOpzione}
            >
              <input
                className={s.radio}
                id={idOpzione}
                type="radio"
                name={nome}
                value={o}
                checked={valore === o}
                onChange={() => onCambia(nome, o)}
              />
              <span className={s.opzioneTesto}>{t(chiaveOpzione(gruppo, o))}</span>
            </label>
          )
        })}
      </div>

      {errore && (
        <p className={s.errore} id={idErrore}>
          {errore}
        </p>
      )}
    </fieldset>
  )
}

/**
 * @param facoltative  true quando chi compila ha gia' un profilo e lo sta
 *                     modificando: niente asterischi e niente `required`,
 *                     perche' in quel caso la pagina Join non le pretende.
 */
export default function DomandeSelezione({ fid, valori, onCambia, errori = {}, facoltative = false }) {
  const { t } = useI18n()

  const anni = anniCompiuti(valori.dataNascita)
  const minorenne = anni !== null && anni < ETA_MINIMA
  const fuoriFascia = anni !== null && anni > ETA_MASSIMA

  const rimasti = 200 - String(valori.motivazione ?? '').length

  return (
    <>
      <fieldset className={s.gruppo}>
        <legend className={s.legend}>{t('candidatura.titolo')}</legend>
        <p className={s.lead}>{t('candidatura.lead')}</p>
        {/* Detto subito e non in fondo: chi scrive un numero di telefono ha
            il diritto di sapere dove finisce PRIMA di scriverlo. */}
        <p className={s.privato}>{t('candidatura.privato')}</p>

        <div className={s.campo}>
          <label className={s.etichetta} htmlFor={`${fid}-nascita`}>
            {t('candidatura.dataNascita')}
            {!facoltative && (
              <span className={s.req} aria-hidden="true">
                {' *'}
              </span>
            )}
          </label>
          <input
            className={s.input}
            id={`${fid}-nascita`}
            type="date"
            value={valori.dataNascita ?? ''}
            onChange={(e) => onCambia('dataNascita', e.target.value)}
            required={!facoltative}
            aria-required={facoltative ? undefined : 'true'}
            aria-describedby={`${fid}-nascita-hint`}
          />
          <p className={s.aiuto} id={`${fid}-nascita-hint`}>
            {t('candidatura.dataNascitaHint')}
          </p>

          {/* L'avviso compare mentre si scrive, non dopo aver mandato: dire a
              qualcuno che ha sbagliato quando ha gia' finito e' il modo piu'
              sicuro di fargli chiudere la pagina. */}
          {minorenne && <p className={s.avviso}>{t('candidatura.minorenne')}</p>}
          {fuoriFascia && <p className={s.avviso}>{t('candidatura.fuoriFascia')}</p>}
          {errori.dataNascita && <p className={s.errore}>{errori.dataNascita}</p>}
        </div>

        <div className={s.campo}>
          <label className={s.etichetta} htmlFor={`${fid}-whatsapp`}>
            {t('candidatura.whatsapp')}
            {!facoltative && (
              <span className={s.req} aria-hidden="true">
                {' *'}
              </span>
            )}
          </label>
          <input
            className={s.input}
            id={`${fid}-whatsapp`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+39 333 1234567"
            value={valori.whatsapp ?? ''}
            onChange={(e) => onCambia('whatsapp', e.target.value)}
            required={!facoltative}
            aria-required={facoltative ? undefined : 'true'}
            aria-describedby={`${fid}-whatsapp-hint`}
          />
          <p className={s.aiuto} id={`${fid}-whatsapp-hint`}>
            {t('candidatura.whatsappHint')}
          </p>
          {errori.whatsapp && <p className={s.errore}>{errori.whatsapp}</p>}
        </div>

        <Scelta
          nome="occupazione"
          gruppo="occupazione"
          opzioni={OCCUPAZIONI}
          valore={valori.occupazione}
          onCambia={onCambia}
          obbligatoria={!facoltative}
          errore={errori.occupazione}
        />

        <Scelta
          nome="ruolo"
          gruppo="ruolo"
          opzioni={RUOLI}
          valore={valori.ruolo}
          onCambia={onCambia}
          obbligatoria={!facoltative}
          errore={errori.ruolo}
        />
      </fieldset>

      <fieldset className={s.gruppo}>
        <legend className={s.legend}>{t('candidatura.sezioneProgetto')}</legend>

        <Scelta
          nome="stadioProgetto"
          gruppo="stadio"
          chiaveDomanda="candidatura.stadioProgetto"
          opzioni={STADI_PROGETTO}
          valore={valori.stadioProgetto}
          onCambia={onCambia}
          obbligatoria={!facoltative}
          errore={errori.stadioProgetto}
        />

        {/* Il link compare solo se c'e' qualcosa da linkare: chiederlo a chi
            ha appena detto "niente, per ora" e' una domanda che fa sentire
            indietro, e la risposta sarebbe comunque vuota. */}
        {valori.stadioProgetto && valori.stadioProgetto !== 'nessuno' && (
          <div className={s.campo}>
            <label className={s.etichetta} htmlFor={`${fid}-progetto`}>
              {t('candidatura.progettoLink')}
            </label>
            <input
              className={s.input}
              id={`${fid}-progetto`}
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={200}
              value={valori.progettoLink ?? ''}
              onChange={(e) => onCambia('progettoLink', e.target.value)}
              aria-describedby={`${fid}-progetto-hint`}
            />
            <p className={s.aiuto} id={`${fid}-progetto-hint`}>
              {t('candidatura.progettoLinkHint')}
            </p>
          </div>
        )}

        <Scelta
          nome="nPitch"
          gruppo="nPitch"
          opzioni={N_PITCH}
          valore={valori.nPitch}
          onCambia={onCambia}
          obbligatoria={!facoltative}
          errore={errori.nPitch}
        />

        <Scelta
          nome="nEventi"
          gruppo="nEventi"
          opzioni={N_EVENTI}
          valore={valori.nEventi}
          onCambia={onCambia}
          obbligatoria={!facoltative}
          errore={errori.nEventi}
        />

        {valori.nEventi && valori.nEventi !== 'zero' && (
          <div className={s.campo}>
            <label className={s.etichetta} htmlFor={`${fid}-quali`}>
              {t('candidatura.eventiQuali')}
            </label>
            <input
              className={s.input}
              id={`${fid}-quali`}
              type="text"
              maxLength={300}
              value={valori.eventiQuali ?? ''}
              onChange={(e) => onCambia('eventiQuali', e.target.value)}
              aria-describedby={`${fid}-quali-hint`}
            />
            <p className={s.aiuto} id={`${fid}-quali-hint`}>
              {t('candidatura.eventiQualiHint')}
            </p>
          </div>
        )}
      </fieldset>

      <fieldset className={s.gruppo}>
        <legend className={s.legend}>{t('candidatura.sezioneAltro')}</legend>

        <div className={s.campo}>
          <label className={s.etichetta} htmlFor={`${fid}-motivazione`}>
            {t('candidatura.motivazione')}
            {!facoltative && (
              <span className={s.req} aria-hidden="true">
                {' *'}
              </span>
            )}
          </label>
          <textarea
            className={s.textarea}
            id={`${fid}-motivazione`}
            rows={3}
            maxLength={200}
            value={valori.motivazione ?? ''}
            onChange={(e) => onCambia('motivazione', e.target.value)}
            required={!facoltative}
            aria-required={facoltative ? undefined : 'true'}
            aria-describedby={`${fid}-motivazione-hint`}
          />
          {/* Il contatore e' dentro l'aiuto e non in un elemento a parte:
              un numero che cambia da solo, fuori da una frase, chi usa uno
              screen reader se lo sente leggere a ogni lettera battuta. */}
          <p className={s.aiuto} id={`${fid}-motivazione-hint`}>
            {t('candidatura.motivazioneHint', { rimasti })}
          </p>
          {errori.motivazione && <p className={s.errore}>{errori.motivazione}</p>}
        </div>

        <Scelta
          nome="fonte"
          gruppo="fonte"
          opzioni={FONTI}
          valore={valori.fonte}
          onCambia={onCambia}
          obbligatoria={!facoltative}
          errore={errori.fonte}
        />
      </fieldset>

      <fieldset className={s.gruppo}>
        <legend className={s.legend}>{t('candidatura.consensi')}</legend>

        <label className={s.consenso}>
          <input
            className={s.checkbox}
            type="checkbox"
            checked={valori.consensoPrivacy === true}
            onChange={(e) => onCambia('consensoPrivacy', e.target.checked)}
          />
          <span>{t('candidatura.consensoPrivacy')}</span>
        </label>

        <label className={s.consenso}>
          <input
            className={s.checkbox}
            type="checkbox"
            checked={valori.consensoWhatsapp === true}
            onChange={(e) => onCambia('consensoWhatsapp', e.target.checked)}
          />
          <span>{t('candidatura.consensoWhatsapp')}</span>
        </label>

        {errori.consensi && <p className={s.errore}>{errori.consensi}</p>}
      </fieldset>
    </>
  )
}
