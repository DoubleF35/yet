import { useCallback, useEffect, useId, useRef, useState } from 'react'

import EmptyState from '../components/EmptyState.jsx'
import HandsDivider from '../components/HandsDivider.jsx'
import { CONTACT_EMAIL, COMMUNITY, SOCIALS } from '../config/socials.js'

import s from './Contatti.module.css'
import { useT } from '../lib/i18n.jsx'

/* Quanto resta a schermo il messaggio dopo il tentativo di copia.
   Abbastanza per leggerlo, non tanto da restare lì a distrarre. */
const FEEDBACK_MS = 3000

/**
 * Copia `text` negli appunti e dice se ci è riuscita.
 *
 * Perché non basta `navigator.clipboard.writeText`: l'API esiste solo in
 * contesti sicuri (https, o localhost). Aperto il sito in http semplice
 * un'anteprima su IP locale, una LAN - `navigator.clipboard` è `undefined`
 * e un bottone che chiama il metodo a occhi chiusi esplode e non fa niente.
 * Anche dove esiste può rifiutare: permesso negato, documento non a fuoco.
 *
 * Quindi: prima la strada buona, poi il ripiego con `execCommand`, che è
 * deprecato ma è l'unica cosa che funziona fuori dai contesti sicuri. Se
 * fallisce anche quello si ritorna `false` e la UI lo dice all'utente
 * invece di far finta di aver copiato.
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Nessun rethrow: scendiamo al ripiego qui sotto.
  }

  try {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    /* Fuori dallo schermo ma NON `display:none` né `hidden`: un elemento non
       renderizzato non è selezionabile e la copia non partirebbe. */
    field.style.position = 'fixed'
    field.style.top = '-2000px'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    // iOS ignora select() sui campi readonly: serve il range esplicito.
    field.setSelectionRange(0, text.length)
    const done = document.execCommand('copy')
    document.body.removeChild(field)
    return done
  } catch {
    return false
  }
}

export default function Contatti() {
  const { t } = useT()
  // useId e non stringhe fisse: se un giorno questa pagina venisse montata
  // due volte (una sezione riusata altrove) gli id resterebbero unici.
  const mailHeadingId = useId()
  const socialsHeadingId = useId()
  const placeHeadingId = useId()

  // 'idle' | 'ok' | 'error', tre stati, perché "non riuscita" è un esito
  // possibile e va mostrato, non nascosto.
  const [copyState, setCopyState] = useState('idle')
  const feedbackTimer = useRef(null)
  const emailRef = useRef(null)

  /* Il titolo del documento aiuta chi tiene molte schede aperte e chi usa uno
     screen reader per orientarsi. Lo ripristiniamo allo smontaggio: senza il
     ripristino, uscendo da questa rotta il titolo resterebbe "Contatti" su
     tutte le pagine che non lo impostano. */
  useEffect(() => {
    const previous = document.title
    document.title = `Contatti - ${COMMUNITY?.name || 'YET'}`
    return () => {
      document.title = previous
    }
  }, [])

  // Un timer in volo che scrive lo stato di un componente già smontato è un
  // warning e un piccolo leak: lo puliamo sempre.
  useEffect(() => () => clearTimeout(feedbackTimer.current), [])

  const handleCopy = useCallback(async () => {
    if (!CONTACT_EMAIL) return

    const done = await copyToClipboard(CONTACT_EMAIL)
    setCopyState(done ? 'ok' : 'error')

    /* Se la copia non è andata, selezioniamo noi l'indirizzo: così all'utente
       resta un solo gesto (Ctrl+C) invece di dover trascinare il mouse su un
       testo piccolo. Tutto dentro try: la Selection API non è disponibile in
       ogni contesto e questo è un extra, non deve rompere niente. */
    if (!done && emailRef.current) {
      try {
        const range = document.createRange()
        range.selectNodeContents(emailRef.current)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      } catch {
        // Pazienza: il messaggio di errore spiega comunque cosa fare.
      }
    }

    clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setCopyState('idle'), FEEDBACK_MS)
  }, [])

  /* Difensivo di proposito: questa pagina non deve andare in bianco se il file
     di configurazione è momentaneamente vuoto o mal formato. Scartiamo le voci
     senza href, che renderebbero un link che non porta da nessuna parte. */
  const socials = (Array.isArray(SOCIALS) ? SOCIALS : []).filter((item) => item && item.href)

  const city = COMMUNITY?.city || 'Torino'

  return (
    <div className={s.page}>
      <div className="container">
        <header className={s.head}>
          <p className={s.eyebrow}>{t('Contatti')}</p>
          <h1 className={s.title}>
            Parliamone.
            <br />
            <span className={s.titleAccent}>Scegli il canale.</span>
          </h1>
          <p className={s.lead}>
            Che sia un&apos;idea da costruire, una domanda o solo curiosità: qui trovi tutti i modi
            per raggiungerci. Rispondiamo appena possibile.
          </p>
        </header>

        {/* ------------------------------------------------------------------
            La mail. È il canale che vogliamo far notare di più, quindi è
            fuori dall'elenco dei social e ha un blocco tutto suo.
            ------------------------------------------------------------------ */}
        <section className={s.mailBlock} aria-labelledby={mailHeadingId}>
          <h2 className={s.mailLabel} id={mailHeadingId}>
            Scrivici una mail
          </h2>

          {CONTACT_EMAIL ? (
            <>
              <div className={s.mailRow}>
                <a className={s.mailLink} href={`mailto:${CONTACT_EMAIL}`} ref={emailRef}>
                  {CONTACT_EMAIL}
                </a>

                <button
                  type="button"
                  className={s.copyButton}
                  onClick={handleCopy}
                  aria-label={`Copia l'indirizzo ${CONTACT_EMAIL}`}
                >
                  <svg
                    className={s.copyIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M9 3h9a2 2 0 0 1 2 2v11M6 7h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="square"
                    />
                  </svg>
                  Copia
                </button>
              </div>

              {/* La regione live sta SEMPRE nel DOM, anche vuota: se la
                  montassimo solo al momento del messaggio, molti screen
                  reader non annuncerebbero nulla perché la regione non
                  esisteva prima del cambiamento. Per lo stesso motivo ha
                  un'altezza minima: il messaggio che appare non deve far
                  saltare in giù il resto della pagina. */}
              <p
                className={[
                  s.feedback,
                  copyState === 'ok' ? s.feedbackOk : '',
                  copyState === 'error' ? s.feedbackError : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="status"
                aria-live="polite"
              >
                {copyState === 'ok' && 'Indirizzo copiato negli appunti.'}
                {copyState === 'error' &&
                  'Non è stato possibile copiare automaticamente: l’indirizzo è selezionato, usa Ctrl+C (⌘+C su Mac).'}
              </p>
            </>
          ) : (
            <p className={s.mailMissing}>
              L&apos;indirizzo non è configurato. Nel frattempo scrivici su uno dei canali qui
              sotto.
            </p>
          )}
        </section>

        {/* ------------------------------------------------------------------
            I social. Vengono TUTTI da src/config/socials.js: aggiungere un
            canale è una riga in quel file, questo componente non si tocca.
            ------------------------------------------------------------------ */}
        <section className={s.section} aria-labelledby={socialsHeadingId}>
          <h2 className={s.sectionTitle} id={socialsHeadingId}>
            Dove ci trovi
          </h2>

          {socials.length > 0 ? (
            <ul className={s.list}>
              {socials.map((item, index) => {
                /* Solo http(s) apre una scheda nuova: su mailto: o tel:
                   target="_blank" lascerebbe una scheda vuota aperta. */
                const isExternal = /^https?:\/\//i.test(item.href)
                const key = item.id || item.href || index

                return (
                  <li className={s.item} key={key}>
                    <a
                      className={s.row}
                      href={item.href}
                      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
                    >
                      {/* L'icona arriva dal config come solo attributo `d`.
                          fillRule/clipRule evenodd servono ai loghi che hanno
                          dei buchi (la fotocamera di Instagram): senza, i
                          fori si riempiono e il segno diventa una macchia. */}
                      <span className={s.iconWrap}>
                        {item.icon ? (
                          <svg
                            className={s.icon}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path
                              d={item.icon}
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          /* Nessuna icona nel config: un quadratino coral
                             tiene la colonna allineata invece di far
                             collassare la griglia su quella riga. */
                          <span className={s.iconFallback} aria-hidden="true" />
                        )}
                      </span>

                      <span className={s.rowText}>
                        <span className={s.rowLabel}>{item.label || item.id}</span>
                        {item.handle && <span className={s.rowHandle}>{item.handle}</span>}
                      </span>

                      {isExternal && (
                        <span className="sr-only"> (si apre in una nuova scheda)</span>
                      )}

                      <svg
                        className={s.arrow}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M5 12h13M12 5l7 7-7 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="square"
                        />
                      </svg>
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState title="Nessun canale pubblico, per ora">
              Stiamo sistemando i nostri profili. Nel frattempo la mail qui sopra funziona
              benissimo.
            </EmptyState>
          )}
        </section>

        <HandsDivider />

        {/* ------------------------------------------------------------------
            Dove siamo. Città e nulla più: un indirizzo preciso non ce l'ha
            dato nessuno e inventarlo sarebbe peggio che ometterlo.
            La città da sola, però, si legge come un filtro all'ingresso
            quindi il raggio va detto nella stessa schermata, non altrove.
            ------------------------------------------------------------------ */}
        <section className={s.place} aria-labelledby={placeHeadingId}>
          <h2 className={s.sectionTitle} id={placeHeadingId}>
            {t('Dove siamo')}
          </h2>
          <p className={s.placeCity}>Si parte da {city}, si va verso tutta Italia</p>
          <p className={s.placeNote}>
            I primi eventi saranno a {city}, ma l’obiettivo è espandersi in tutta Italia: se vivi
            a Palermo o a Udine, puoi trovare gente della tua stessa città e contribuire a fare
            eventi proprio dove sei tu.
          </p>
          <p className={s.placeNote}>
            E, ovvio: se sei di passaggio a {city}, scrivici e ci prendiamo un caffè.
          </p>
        </section>
      </div>
    </div>
  )
}
