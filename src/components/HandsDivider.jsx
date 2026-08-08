import s from './HandsDivider.module.css'

/**
 * Divisore fra due sezioni: due filetti e, in mezzo, le lancette del marchio.
 *
 * È decorazione pura, quindi tutto il blocco è aria-hidden: uno screen reader
 * che annunciasse "immagine, lancette" tre volte per pagina darebbe solo
 * fastidio. Il ruolo separator sarebbe anche corretto semanticamente, ma qui
 * la separazione è già data dalla struttura in <section>.
 *
 * @param {'left'|'center'|'right'} [align] dove sta il segno (default 'center')
 */
export default function HandsDivider({ align = 'center', className = '' }) {
  const hands = `${import.meta.env.BASE_URL}hands.png`

  return (
    <div className={`${s.divider} ${s[align] ?? s.center} ${className}`.trim()} aria-hidden="true">
      <span className={s.rule} />
      <img className={s.hands} src={hands} alt="" width="162" height="291" loading="lazy" />
      <span className={s.rule} />
    </div>
  )
}
