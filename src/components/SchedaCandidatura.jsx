import { anniCompiuti, chiaveOpzione } from '../config/candidatura.js'
import { calcolaPunteggio } from '../lib/punteggio.js'
import { useI18n } from '../lib/i18n.jsx'

import s from './SchedaCandidatura.module.css'

/* =========================================================================
   LE RISPOSTE DI UNA CANDIDATURA, NEL PANNELLO

   QUESTO COMPONENTE E' L'UNICO POSTO DOVE IL PUNTEGGIO ESISTE.

   Non e' salvato da nessuna parte e non viaggia in nessuna risposta di rete:
   lo calcola questa funzione, qui, mentre un admin guarda la scheda. Il
   motivo sta per esteso in src/lib/punteggio.js, e in breve e' che il sito
   non ha un server, quindi qualunque cosa fosse scritta nel documento la
   potrebbe leggere anche chi si e' candidato.

   Di conseguenza: non mettere mai il risultato di calcolaPunteggio() dentro
   una chiamata che scrive su Firestore. Se un giorno servisse ordinare per
   punteggio, si ordina in memoria dopo aver letto, non con una query.
   ========================================================================= */

/** Una riga domanda/risposta. Non disegna niente se la risposta non c'e'. */
function Riga({ etichetta, valore }) {
  if (!valore) return null
  return (
    <div className={s.riga}>
      <dt className={s.domanda}>{etichetta}</dt>
      <dd className={s.risposta}>{valore}</dd>
    </div>
  )
}

export default function SchedaCandidatura({ candidatura }) {
  const { t } = useI18n()

  if (!candidatura) {
    return <p className={s.nessuna}>{t('candidatura.nessuna')}</p>
  }

  const c = candidatura
  const { punteggio, su, dettaglio, proposta } = calcolaPunteggio(c)
  const anni = anniCompiuti(c.dataNascita)

  /* Il numero senza spazi ne' trattini: wa.me non li accetta, e il piu'
     iniziale va tolto perche' lo rimette lui. */
  const numeroPulito = String(c.whatsapp ?? '').replace(/[^\d]/g, '')

  const etichettaDi = (gruppo, valore) => {
    const chiave = chiaveOpzione(gruppo, valore)
    return chiave ? t(chiave) : null
  }

  return (
    <div className={s.scheda}>
      {/* La proposta in cima, ma detta come proposta: e' una somma di quattro
          spunte, non un giudizio su una persona. Chi decide sei tu. */}
      <div className={`${s.verdetto} ${s[proposta]}`}>
        <span className={s.proposta}>{t(`candidatura.proposta.${proposta}`)}</span>
        <span className={s.punti}>{t('candidatura.punteggio', { punti: punteggio, su })}</span>
      </div>

      {/* Quali criteri sono scattati e quali no. Scritto per esteso e non
          solo col totale: un numero da solo non si puo' contestare, e qui
          serve poter dire "questo non e' vero" guardando la riga. */}
      <ul className={s.criteri}>
        {dettaglio.map((d) => (
          <li className={d.scattato ? s.criterioSi : s.criterioNo} key={d.id}>
            <span className={s.segno} aria-hidden="true">
              {d.scattato ? '+' : '-'}
            </span>
            {t(d.chiave)}
          </li>
        ))}
      </ul>

      <dl className={s.elenco}>
        {anni !== null && (
          <Riga etichetta={t('candidatura.dataNascita')} valore={t('candidatura.eta', { anni })} />
        )}

        {numeroPulito && (
          <div className={s.riga}>
            <dt className={s.domanda}>{t('candidatura.whatsapp')}</dt>
            <dd className={s.risposta}>
              <a
                className={s.link}
                href={`https://wa.me/${numeroPulito}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.whatsapp}
              </a>
            </dd>
          </div>
        )}

        <Riga
          etichetta={t('candidatura.occupazione')}
          valore={etichettaDi('occupazione', c.occupazione)}
        />
        <Riga etichetta={t('candidatura.ruolo')} valore={etichettaDi('ruolo', c.ruolo)} />
        <Riga
          etichetta={t('candidatura.stadioProgetto')}
          valore={etichettaDi('stadio', c.stadioProgetto)}
        />

        {c.progettoLink && (
          <div className={s.riga}>
            <dt className={s.domanda}>{t('candidatura.progettoLink')}</dt>
            <dd className={s.risposta}>
              <a
                className={s.link}
                href={c.progettoLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.progettoLink}
              </a>
            </dd>
          </div>
        )}

        <Riga etichetta={t('candidatura.nPitch')} valore={etichettaDi('nPitch', c.nPitch)} />
        <Riga etichetta={t('candidatura.nEventi')} valore={etichettaDi('nEventi', c.nEventi)} />
        <Riga etichetta={t('candidatura.eventiQuali')} valore={c.eventiQuali} />
        <Riga etichetta={t('candidatura.fonte')} valore={etichettaDi('fonte', c.fonte)} />
      </dl>

      {c.motivazione && (
        <blockquote className={s.motivazione}>
          <p>{c.motivazione}</p>
        </blockquote>
      )}
    </div>
  )
}
