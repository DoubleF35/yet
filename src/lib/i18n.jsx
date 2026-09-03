import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { EN } from '../i18n/en.js'

/**
 * Due lingue, italiano e inglese, con una decisione architetturale che regge
 * tutto il resto: LE CHIAVI DEL DIZIONARIO SONO LE FRASI ITALIANE.
 *
 * Si scrive `t('Entra in YET')`, non `t('home.cta.primary')`.
 *
 * Il vantaggio non e' la comodita', e' la SICUREZZA DELL'INCOMPLETEZZA. Con
 * chiavi astratte, una traduzione mancante mostra `home.cta.primary` a schermo:
 * il sito si rompe in modo visibile e imbarazzante. Con le frasi come chiavi,
 * una traduzione mancante mostra l'italiano. Il peggio che puo' succedere e'
 * una frase non tradotta in mezzo a un testo inglese, che e' brutto ma
 * leggibile, e permette di tradurre il sito un pezzo alla volta senza che sia
 * mai rotto.
 *
 * Il prezzo: se si cambia una frase italiana, la sua traduzione smette di
 * agganciarsi. Per questo in sviluppo ogni chiave mancante finisce in console
 * una volta sola, cosi' la si vede senza inondare il log.
 *
 * COSA NON VIENE TRADOTTO, e non e' una dimenticanza:
 *  - il pannello di amministrazione. Lo usano quattro persone, tutte italiane:
 *    tradurlo sarebbe lavoro speso per nessuno;
 *  - le bio, le notizie e gli incontri. Sono scritti dai membri, e nessuno
 *    puo' tradurli al posto loro. Un traduttore automatico li renderebbe
 *    goffi, e sarebbero le PAROLE DI QUALCUN ALTRO messe in bocca a loro.
 */

const LINGUE = ['it', 'en']
const CHIAVE = 'yet_lang'

const LangContext = createContext(null)

/* Le chiavi mancanti gia' segnalate. Un Set e non un contatore: serve a
   segnalarle una volta sola, non a contarle. */
const segnalate = new Set()

function leggiSalvata() {
  try {
    const v = window.localStorage.getItem(CHIAVE)
    return LINGUE.includes(v) ? v : null
  } catch {
    /* localStorage puo' LANCIARE in navigazione privata e in certi webview,
       non solo restituire null. Senza questo try il sito si aprirebbe bianco
       proprio sui browser piu' restrittivi. */
    return null
  }
}

function linguaDelBrowser() {
  try {
    const lingue = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const l of lingue) {
      const base = String(l || '').slice(0, 2).toLowerCase()
      if (LINGUE.includes(base)) return base
    }
  } catch {
    /* niente navigator: si ripiega sull'italiano */
  }
  /* Italiano come ripiego e non inglese: il sito e' di una community italiana,
     e chi arriva senza una preferenza dichiarata e' molto piu' probabilmente
     italiano. */
  return 'it'
}

export function LanguageProvider({ children }) {
  /* La scelta esplicita dell'utente vince SEMPRE sulla lingua del browser.
     Chi ha premuto il bottone ha deciso, e non va corretto a ogni visita. */
  const [lang, setLang] = useState(() => leggiSalvata() ?? linguaDelBrowser())

  useEffect(() => {
    /* `<html lang>` non e' un dettaglio: e' quello che dice agli screen reader
       con quale pronuncia leggere, ai motori di ricerca in che lingua e' la
       pagina, e al browser quale dizionario usare per il correttore. Cambiare
       i testi senza cambiarlo lascia un sito inglese che viene letto con la
       fonetica italiana. */
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(CHIAVE, lang)
    } catch {
      /* Non si puo' ricordare: pazienza, la lingua tornera' quella del
         browser al prossimo caricamento. Non e' un errore da mostrare. */
    }
  }, [lang])

  const t = useCallback(
    (testo) => {
      if (lang === 'it') return testo
      const tradotto = EN[testo]
      if (tradotto !== undefined) return tradotto

      if (import.meta.env.DEV && !segnalate.has(testo)) {
        segnalate.add(testo)
        console.warn('[YET i18n] manca la traduzione inglese per:\n  ' + JSON.stringify(testo))
      }
      // Ripiego sull'italiano: brutto, ma leggibile.
      return testo
    },
    [lang],
  )

  const value = useMemo(
    () => ({
      lang,
      t,
      /* `cambia` senza argomenti alterna, con un argomento imposta: serve
         entrambe le forme, il bottone alterna e un eventuale link imposta. */
      cambia: (nuova) =>
        setLang((corrente) =>
          nuova && LINGUE.includes(nuova) ? nuova : corrente === 'it' ? 'en' : 'it',
        ),
      isEn: lang === 'en',
    }),
    [lang, t],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useT() {
  const ctx = useContext(LangContext)
  if (!ctx) {
    /* Errore da sviluppatore, non da utente: succede solo se un componente
       finisce fuori dall'albero del provider. */
    throw new Error('useT() va usato dentro <LanguageProvider>.')
  }
  return ctx
}
