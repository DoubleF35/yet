import { useCallback, useEffect, useState } from 'react'

/**
 * Movimento, con una regola sola: se JavaScript non parte, il contenuto si
 * vede lo stesso.
 *
 * È il motivo per cui lo stato iniziale nascosto viene applicato QUI, dal
 * codice, e non nel CSS. Scrivere `opacity: 0` in un foglio di stile e
 * toglierlo con JS significa che un errore di rete, un browser vecchio o un
 * blocco degli script lasciano la pagina bianca con tutto il testo presente ma
 * invisibile. Aggiungendo la classe dal JS, il caso peggiore è che il
 * contenuto compaia senza animazione, che è esattamente quello che deve
 * succedere.
 *
 * Seconda regola: chi ha chiesto meno movimento non ne riceve nessuno. Non
 * "meno", nessuno.
 */

/** Se l'utente ha chiesto di ridurre le animazioni nelle impostazioni. */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Rivela un elemento quando entra nello schermo.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.threshold] quanta parte dell'elemento deve essere
 *                  visibile perché scatti. 0.15 e non 0: su un blocco alto una
 *                  soglia a zero fa partire l'animazione quando si vede il
 *                  primo pixel, cioè quando è ancora fuori dall'occhio.
 * @param {number}  [opts.delay]     ritardo in ms, per scaglionare una lista.
 *
 * @returns {{ref, revealed}} `ref` va sull'elemento, `revealed` sulla classe.
 *
 * L'osservatore si disconnette al primo scatto: sono animazioni d'ingresso,
 * non un effetto che deve rifarsi ogni volta che si scorre su e giù. Un
 * elemento che si ri-anima a ogni passaggio è il segno più riconoscibile di un
 * sito fatto col pilota automatico.
 */
export function useReveal({ threshold = 0.15, delay = 0 } = {}) {
  /* Un ref di CALLBACK, non useRef, e la differenza è tutto il punto di
     questa funzione.
     Con useRef, l'effetto gira una volta sola dopo il primo render. Se
     l'elemento in quel momento non esiste ancora, perché il blocco che lo
     contiene è dietro una condizione, per esempio `{conteggio > 0 && ...}` e
     il conteggio arriva dalla rete, l'effetto trova `null`, esce, e non viene
     più rieseguito: l'osservatore non si aggancia mai e il contenuto resta
     nascosto per sempre.
     È esattamente il bug che mostrava "0 persone stanno costruendo con noi":
     la sezione del contatore compare solo quando il numero è arrivato, cioè
     sempre DOPO il primo render.
     Tenendo il nodo in uno stato, ogni volta che React lo attacca o lo stacca
     lo stato cambia, e l'effetto riparte con l'elemento vero in mano. */
  const [el, setEl] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const ref = useCallback((node) => setEl(node), [])

  useEffect(() => {
    if (!el) return undefined

    /* Niente movimento richiesto, oppure browser senza IntersectionObserver:
       si mostra e basta, subito. Non è un ripiego degradato, è il
       comportamento corretto per quei casi. */
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return undefined
    }

    /* Due casi in cui non si aspetta nessun osservatore.
       1. L'elemento è già dentro lo schermo (tutto ciò che sta sopra la
          piega): aspettare un evento di scroll che potrebbe non arrivare mai
          lo lascerebbe invisibile su una pagina corta.
       2. L'elemento è già stato SUPERATO, cioè sta sopra il bordo alto della
          finestra. È il caso che mi ha morso in prova: saltando in fondo alla
          pagina, l'elemento non interseca più niente e l'osservatore non
          scatterà mai. Capita anche con un link ad ancora, e con il browser
          che ripristina la posizione di scroll al ricaricamento. Un contenuto
          che resta invisibile per sempre è molto peggio di un'animazione
          saltata. */
    const rect = el.getBoundingClientRect()
    const giaVisibile = rect.top < window.innerHeight * 0.9 && rect.bottom > 0
    const giaSuperato = rect.bottom <= 0

    if (giaVisibile || giaSuperato) {
      if (giaSuperato) {
        setRevealed(true)
        return undefined
      }
      const t = window.setTimeout(() => setRevealed(true), delay)
      return () => window.clearTimeout(t)
    }

    let timer
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          /* Stessa rete di sicurezza dentro l'osservatore: uno scroll molto
             veloce può far arrivare la notifica quando l'elemento è già
             passato oltre. In quel caso si mostra subito, senza ritardo:
             il ritardo serve a scaglionare una cascata che si sta guardando,
             non ad allungare l'attesa di qualcosa di già superato. */
          if (!entry.isIntersecting) {
            if (entry.boundingClientRect.bottom <= 0) {
              setRevealed(true)
              obs.disconnect()
            }
            continue
          }
          timer = window.setTimeout(() => setRevealed(true), delay)
          obs.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )

    obs.observe(el)
    return () => {
      obs.disconnect()
      window.clearTimeout(timer)
    }
  }, [el, threshold, delay])

  return { ref, revealed }
}

/**
 * Conta da zero fino a `target`.
 *
 * Con `prefersReducedMotion` mostra direttamente il numero finale: un
 * contatore che sale è esattamente il tipo di movimento che dà fastidio a chi
 * ha chiesto di non averne.
 *
 * L'andamento è ease-out cubico e non lineare, perché un conteggio a velocità
 * costante sembra un caricamento rotto: deve partire veloce e frenare.
 */
export function useCountUp(target, { duration = 900, start = false } = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (typeof target !== 'number' || !Number.isFinite(target)) return undefined
    if (!start) return undefined

    if (prefersReducedMotion() || target <= 0) {
      setValue(target)
      return undefined
    }

    let raf
    const t0 = performance.now()

    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])

  return value
}
