import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useI18n } from '../lib/i18n.jsx'
import { CAMPI_PUNTINO, MAPPA, caricaComuni, luoghiDeiMembri } from '../lib/mappa.js'
import s from './MappaItalia.module.css'

/* Il raggio dei puntini, in celle. Quelli di confine sono più piccoli: la
   fila di puntini ristretti è la linea fra due regioni (vedi scripts/mappa.mjs). */
const RAGGIO = 0.34
const RAGGIO_CONFINE = 0.16

/* cella -> regione, per sapere sopra quale regione sta il puntatore senza
   chiedere al DOM quale cerchio c'è sotto: le celle di mare non hanno un
   cerchio, e passarci sopra deve spegnere l'evidenziazione, non lasciarla
   accesa sull'ultima regione toccata. */
const REGIONE_DELLA_CELLA = new Map()
for (let i = 0; i < MAPPA.puntini.length; i += CAMPI_PUNTINO) {
  REGIONE_DELLA_CELLA.set(
    MAPPA.puntini[i] * 1000 + MAPPA.puntini[i + 1],
    MAPPA.puntini[i + 2],
  )
}

/* I puntini di ogni regione, disegnati UNA volta. Sono duemilacinquecento
   cerchi che non cambiano mai: quando cambia la regione evidenziata cambia
   solo la classe del <g> che li contiene, e React non li ripercorre. */
const Strati = memo(function Strati({ classeDi }) {
  const perRegione = useMemo(() => {
    const gruppi = MAPPA.regioni.map(() => [])
    for (let i = 0; i < MAPPA.puntini.length; i += CAMPI_PUNTINO) {
      const [c, r, regione, confine] = MAPPA.puntini.slice(i, i + CAMPI_PUNTINO)
      gruppi[regione].push(
        <circle key={i} cx={c + 0.5} cy={r + 0.5} r={confine ? RAGGIO_CONFINE : RAGGIO} />,
      )
    }
    return gruppi
  }, [])

  return MAPPA.regioni.map((nome, i) => (
    <g key={nome} className={classeDi(i)}>
      {perRegione[i]}
    </g>
  ))
})

/**
 * L'Italia a puntini, con una luce dove c'è qualcuno di YET.
 *
 * Ogni puntino coral è un posto da cui viene almeno una persona, e toccarlo
 * filtra la vetrina su quel posto: la mappa è anche un modo di navigare, non
 * solo un'illustrazione. Le regioni con qualcuno dentro sono più scure, e
 * passandoci sopra si legge il nome e quante persone ci sono.
 *
 * @param membri       i profili caricati ([] finché non arrivano)
 * @param pronto       se i profili sono arrivati: prima la mappa è solo il disegno
 * @param citta        tutte le città dei membri, per sapere quale filtro apre un puntino
 * @param cittaScelta  la chiave della città filtrata adesso, o ''
 * @param onScegli     riceve la chiave da filtrare, o '' per tornare a "Tutti"
 */
export default function MappaItalia({ membri, pronto, citta, cittaScelta, onScegli }) {
  const { t } = useI18n()
  const [comuni, setComuni] = useState(null)
  const [sopra, setSopra] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    let vivo = true
    caricaComuni()
      .then((dizionario) => vivo && setComuni(dizionario))
      /* Senza dizionario la mappa resta il disegno dell'Italia senza luci:
         peccato, ma la vetrina sotto funziona lo stesso, e un errore rosso
         in cima alla pagina per una decorazione sarebbe sproporzionato. */
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  const luoghi = useMemo(
    () => (pronto && comuni ? luoghiDeiMembri(membri, comuni, citta) : null),
    [pronto, comuni, membri, citta],
  )

  const regioneSopra = sopra?.tipo === 'regione' ? sopra.regione : sopra?.punto.regione ?? -1
  const regioneScelta = luoghi?.punti.find((p) => p.filtro && p.filtro === cittaScelta)?.regione ?? -1

  const classeDi = useCallback(
    (i) =>
      [
        s.regione,
        luoghi?.perRegione[i] > 0 && s.abitata,
        (i === regioneSopra || i === regioneScelta) && s.accesa,
      ]
        .filter(Boolean)
        .join(' '),
    [luoghi, regioneSopra, regioneScelta],
  )

  const muovi = useCallback((evento) => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    const c = Math.floor(((evento.clientX - box.left) / box.width) * MAPPA.colonne)
    const r = Math.floor(((evento.clientY - box.top) / box.height) * MAPPA.righe)
    const regione = REGIONE_DELLA_CELLA.get(c * 1000 + r)
    setSopra((prima) => {
      if (regione === undefined) return prima?.tipo === 'regione' ? null : prima
      if (prima?.tipo === 'regione' && prima.regione === regione) return prima
      return { tipo: 'regione', regione }
    })
  }, [])

  const persone = (n) => t(n === 1 ? 'mappa.personaUna' : 'mappa.personeTante', { n })

  /* La riga sotto la mappa. Dice cosa c'è sotto il puntatore, e quando il
     puntatore non c'è dice il riassunto: è lo stesso posto, così su telefono,
     dove il passaggio sopra non esiste, non manca niente di importante. */
  let didascalia = null
  if (sopra?.tipo === 'punto') {
    didascalia = (
      <>
        <strong>{sopra.punto.etichetta}</strong> · {persone(sopra.punto.persone)}
      </>
    )
  } else if (sopra?.tipo === 'regione') {
    const n = luoghi?.perRegione[sopra.regione] ?? 0
    didascalia = (
      <>
        <strong>{MAPPA.regioni[sopra.regione]}</strong> ·{' '}
        {n > 0 ? persone(n) : t('mappa.ancoraNessuno')}
      </>
    )
  } else if (luoghi) {
    didascalia = (
      <>
        {t(luoghi.citta === 1 ? 'mappa.cittaUna' : 'mappa.cittaTante', { n: luoghi.citta })}{' '}
        {t('mappa.regioni', { n: luoghi.regioni, totale: MAPPA.regioni.length })}
        {luoghi.fuori > 0 ? ` ${t('mappa.fuori', { n: luoghi.fuori })}` : ''}
      </>
    )
  }

  return (
    <figure className={s.mappa}>
      <p className={s.titolo}>{t('mappa.titolo')}</p>
      <div
        className={s.tela}
        style={{ aspectRatio: `${MAPPA.colonne} / ${MAPPA.righe}` }}
        onPointerLeave={() => setSopra(null)}
      >
        <svg
          ref={svgRef}
          className={s.puntini}
          viewBox={`0 0 ${MAPPA.colonne} ${MAPPA.righe}`}
          aria-hidden="true"
          focusable="false"
          onPointerMove={muovi}
        >
          <Strati classeDi={classeDi} />
        </svg>

        {/* I posti sono BOTTONI HTML sopra il disegno, non cerchi dentro l'SVG:
            così si raggiungono col tab, hanno un nome per gli screen reader e
            l'anello di focus del resto del sito, cose che un <circle> non sa
            fare da solo. */}
        {luoghi?.punti.map((punto) => {
          const scelto = punto.filtro !== null && punto.filtro === cittaScelta
          return (
            <button
              key={punto.indice}
              type="button"
              className={s.posto}
              style={{
                left: `${((punto.c + 0.5) / MAPPA.colonne) * 100}%`,
                top: `${((punto.r + 0.5) / MAPPA.righe) * 100}%`,
                '--persone': punto.persone,
              }}
              aria-pressed={scelto}
              aria-label={t(scelto ? 'mappa.postoAriaScelto' : 'mappa.postoAria', {
                citta: punto.etichetta,
                persone: persone(punto.persone),
              })}
              onPointerEnter={() => setSopra({ tipo: 'punto', punto })}
              onPointerLeave={() => setSopra(null)}
              onFocus={() => setSopra({ tipo: 'punto', punto })}
              onBlur={() => setSopra(null)}
              onClick={() => punto.filtro && onScegli(scelto ? '' : punto.filtro)}
            >
              {punto.persone > 1 ? <span aria-hidden="true">{punto.persone}</span> : null}
            </button>
          )
        })}
      </div>

      <figcaption className={s.didascalia}>
        {/* Sempre presente e sempre di una riga: se comparisse solo a dati
            arrivati, o cambiasse altezza passando sopra le regioni, la pagina
            sotto sobbalzerebbe a ogni movimento del mouse. */}
        <p className={s.riga}>{didascalia ?? ' '}</p>
        <ul className={s.legenda}>
          <li>
            <span className={`${s.segno} ${s.segnoPosto}`} aria-hidden="true" />
            {t('mappa.legendaPosto')}
          </li>
          <li>
            <span className={`${s.segno} ${s.segnoAbitata}`} aria-hidden="true" />
            {t('mappa.legendaRegione')}
          </li>
          <li>
            <span className={`${s.segno} ${s.segnoVuota}`} aria-hidden="true" />
            {t('mappa.legendaVuota')}
          </li>
        </ul>
      </figcaption>
    </figure>
  )
}
