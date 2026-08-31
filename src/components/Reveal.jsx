import { useReveal } from '../lib/motion.js'

import s from './Reveal.module.css'

/**
 * Avvolge un blocco e lo fa comparire quando entra nello schermo.
 *
 * Il movimento è volutamente piccolo: 14px di risalita e 520ms. Le animazioni
 * che si notano sono quelle sbagliate — se ti accorgi che è animato mentre
 * leggi, l'animazione sta rubando attenzione al contenuto invece di
 * accompagnarlo.
 *
 * @param {number}  [delay] ritardo in ms, per scaglionare una lista.
 * @param {string}  [as]    il tag da usare (default div), così non si è
 *                          costretti a infilare un div dentro una <ul>.
 */
export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const { ref, revealed } = useReveal({ delay })

  return (
    <Tag
      ref={ref}
      /* La classe di partenza è `hidden`, aggiunta dal JS al primo render.
         Nel CSS non c'è nessun `opacity: 0` di default: se gli script non
         partono, questo elemento resta un normale blocco visibile. */
      className={`${s.base} ${revealed ? s.in : s.out} ${className}`.trim()}
      /* Gli attributi passano all'elemento vero: senza, aria-labelledby e
         aria-busy finirebbero su un div in piu' e la relazione semantica si
         perderebbe per strada. */
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * Scaglionamento per le liste.
 *
 * 70ms fra un elemento e l'altro, e un tetto a 6: oltre, l'ultimo elemento di
 * una griglia da venti card aspetterebbe più di un secondo, e l'effetto
 * "cascata" diventa attesa.
 */
export function stagger(index, step = 70, max = 6) {
  return Math.min(index, max) * step
}
