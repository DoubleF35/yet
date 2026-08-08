import s from './Skeleton.module.css'

/**
 * Blocchi grigi in attesa dei dati.
 *
 * Vanno usati con la stessa forma del contenuto che sostituiscono: uno
 * skeleton alto quanto la card vera evita che la pagina salti quando i dati
 * arrivano, che è il motivo per cui esiste invece di uno spinner.
 *
 * @param {string|number} [height] altezza CSS (default '1rem')
 * @param {string|number} [width]  larghezza CSS (default '100%')
 * @param {number}        [count]  quante righe (default 1)
 */
export default function Skeleton({ height = '1rem', width = '100%', count = 1, className = '' }) {
  const rows = Math.max(1, Math.floor(count))
  const toCss = (v) => (typeof v === 'number' ? `${v}px` : v)

  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <span
          key={i}
          className={`${s.bar} ${className}`.trim()}
          style={{
            height: toCss(height),
            // L'ultima riga di un paragrafo è più corta: imitarlo rende
            // l'attesa meno "a blocchi" e più simile al testo che arriverà.
            width: rows > 1 && i === rows - 1 ? '72%' : toCss(width),
          }}
          /* Decorazione pura. Il messaggio di attesa lo dà la pagina con un
             aria-live: annunciare venti rettangoli non aiuta nessuno. */
          aria-hidden="true"
        />
      ))}
    </>
  )
}
