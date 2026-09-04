/**
 * Due lingue, italiano e inglese, in un contesto solo.
 *
 * COME SI USA, in un componente:
 *
 *     const { t, lang, setLang } = useI18n()
 *     <h1>{t('home.titolo')}</h1>
 *     <p>{t('vetrina.conteggio', { n: 12 })}</p>
 *
 * PERCHE' NON UNA LIBRERIA. i18next e react-intl portano dentro un motore di
 * pluralizzazione, il caricamento asincrono dei cataloghi, l'ICU MessageFormat:
 * cose che servono a un prodotto con dieci lingue e traduttori esterni. Qui le
 * lingue sono due, i cataloghi stanno nel bundle e li scrive chi scrive il
 * sito. Il costo di una dipendenza in piu' non e' il kilobyte, e' che chi
 * arriva dopo deve conoscere anche quella.
 *
 * LA CHIAVE MANCANTE NON SPARISCE. `t()` su una chiave che non esiste
 * restituisce la chiave stessa e la segnala in console: cosi' in pagina si
 * legge `join.titolo` invece di uno spazio vuoto, e il difetto si vede subito
 * invece di scoprirlo da un utente. La prova automatica (scripts/i18n-check)
 * si appoggia proprio a questo.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import it from '../i18n/it.js'
import en from '../i18n/en.js'

const CATALOGHI = { it, en }

/** Le lingue disponibili, nell'ordine in cui compaiono nel selettore. */
export const LINGUE = [
  { code: 'it', label: 'IT', nome: 'Italiano' },
  { code: 'en', label: 'EN', nome: 'English' },
]

const CHIAVE_SALVATA = 'yet_lang'
const DEFAULT = 'it'

/**
 * La lingua da usare all'apertura.
 *
 * Ordine: quella scelta l'ultima volta, poi quella del browser, poi italiano.
 * L'italiano e' il ripiego e non l'inglese perche' il club e' italiano: chi
 * arriva senza preferenze dichiarate e' molto piu' probabile che parli
 * italiano.
 *
 * localStorage puo' LANCIARE, non solo restituire null: succede in Safari
 * privato e in certe webview. Un accesso non protetto qui aprirebbe il sito
 * bianco proprio sui browser piu' restrittivi.
 */
function lingueIniziale() {
  try {
    const salvata = window.localStorage.getItem(CHIAVE_SALVATA)
    if (salvata && CATALOGHI[salvata]) return salvata
  } catch {
    /* pazienza: si continua col resto */
  }

  try {
    /* `languages` e non `language`: la prima e' la lista in ordine di
       preferenza, e chi ha inglese come seconda lingua ma italiano come prima
       deve vedere italiano. Confrontiamo solo il prefisso, perche' arrivano
       valori come 'en-GB' e 'it-CH'. */
    const preferite = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const tag of preferite) {
      const code = String(tag || '').slice(0, 2).toLowerCase()
      if (CATALOGHI[code]) return code
    }
  } catch {
    /* idem */
  }

  return DEFAULT
}

/** Scende dentro il catalogo seguendo una chiave a punti. */
function cerca(catalogo, chiave) {
  return String(chiave)
    .split('.')
    .reduce((nodo, pezzo) => (nodo != null && typeof nodo === 'object' ? nodo[pezzo] : undefined), catalogo)
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(lingueIniziale)

  /* L'attributo lang su <html> non e' decorativo: e' quello che dice a uno
     screen reader in che lingua leggere, e al browser quali regole di sillabazione
     e quali virgolette usare. index.html parte con lang="it", qui lo teniamo
     allineato alla scelta vera. */
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (!CATALOGHI[code]) return
    setLangState(code)
    try {
      window.localStorage.setItem(CHIAVE_SALVATA, code)
    } catch {
      /* La lingua non si ricordera' al prossimo giro: e' un fastidio, non un
         errore da mostrare. */
    }
  }, [])

  const t = useCallback(
    (chiave, valori) => {
      let testo = cerca(CATALOGHI[lang], chiave)

      /* Ripiego sull'italiano prima di arrendersi: se una chiave e' stata
         aggiunta al catalogo italiano e non ancora tradotta, meglio la frase
         italiana in mezzo alla pagina inglese che il nome della chiave. */
      if (typeof testo !== 'string') {
        const italiano = cerca(CATALOGHI[DEFAULT], chiave)
        if (typeof italiano === 'string') {
          if (import.meta.env.DEV) console.warn(`[YET] i18n: manca la traduzione ${lang}.${chiave}`)
          testo = italiano
        }
      }

      if (typeof testo !== 'string') {
        if (import.meta.env.DEV) console.warn(`[YET] i18n: chiave inesistente ${chiave}`)
        return chiave
      }

      if (!valori) return testo
      /* Sostituzione di {nome}. Niente eval, niente template: una regex su
         chiavi alfanumeriche, e un segnaposto senza valore resta scritto tale
         e quale, cosi' si nota. */
      return testo.replace(/\{(\w+)\}/g, (intero, nome) =>
        valori[nome] === undefined || valori[nome] === null ? intero : String(valori[nome]),
      )
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    // Errore da sviluppatore, non da utente: succede solo se un componente
    // finisce fuori dall'albero del provider.
    throw new Error('useI18n() va usato dentro <I18nProvider>.')
  }
  return context
}

/** Comoda quando serve solo tradurre, che e' il caso di quasi tutti i file. */
export function useT() {
  return useI18n().t
}

/**
 * Il testo da mostrare per un errore.
 *
 * IL PROBLEMA CHE RISOLVE. Le funzioni in lib/ (db.js, imageCompress.js,
 * auth.jsx) lanciano eccezioni che finiscono a schermo, ma non hanno un t()
 * sotto mano: sono moduli, non componenti, e non possono usare un hook. La
 * soluzione e' che allegano all'eccezione la CHIAVE della frase da mostrare:
 *
 *     const e = new Error('...')       // per la console, in italiano
 *     e.chiaveI18n = 'errori.fileIlleggibile'
 *     e.valoriI18n = { peso: '2 MB' }  // se la frase ha segnaposti
 *     throw e
 *
 * e chi renderizza chiama questa funzione. Un errore senza chiave (uno di
 * Firebase, o un TypeError nostro) ricade sul suo `message`, e se non ha
 * nemmeno quello sulla chiave di ripiego.
 */
export function messaggioErrore(t, err, chiaveRipiego = 'errori.generico') {
  if (!err) return ''
  if (typeof err === 'string') return err
  if (err.chiaveI18n) return t(err.chiaveI18n, err.valoriI18n)
  return err.message || t(chiaveRipiego)
}
