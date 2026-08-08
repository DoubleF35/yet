import s from './EmptyState.module.css'

/**
 * Lo stato "non c'è ancora niente".
 *
 * Vale la pena curarlo: su un sito appena nato è lo stato che si vede di più,
 * e uno spazio vuoto senza spiegazioni sembra un errore di caricamento.
 *
 * @param {string} title      la frase principale
 * @param {node}   [children] una riga di contesto
 * @param {node}   [action]   un Link o un bottone già pronto
 */
export default function EmptyState({ title, children, action, className = '' }) {
  const hands = `${import.meta.env.BASE_URL}hands.png`

  return (
    <div className={`${s.empty} ${className}`.trim()}>
      <img className={s.mark} src={hands} alt="" aria-hidden="true" width="162" height="291" />

      {/* Volutamente un <p> e non un titolo: infilare un h2 qui dentro
          sfonderebbe la gerarchia della pagina che ospita il componente. */}
      <p className={s.title}>{title}</p>

      {children ? <p className={s.text}>{children}</p> : null}
      {action ? <div className={s.action}>{action}</div> : null}
    </div>
  )
}
