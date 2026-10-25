import { useCallback, useEffect, useRef, useState } from 'react'

import { getOspiti } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'
import { prefersReducedMotion } from '../lib/motion.js'

import s from './Ospiti.module.css'

/**
 * La striscia di chi ci ha ospitato e di chi e' salito a parlare.
 *
 * DA DOVE VENGONO I NOMI. Se gli admin hanno scritto il loro elenco dal
 * pannello, e' quello. Altrimenti si usano i nomi che stanno nei resoconti in
 * config/eventi.js, che e' quello che si vedeva prima: cosi' la striscia non
 * sparisce il giorno in cui si aggiunge la possibilita' di modificarla, e non
 * c'e' un momento in cui il sito e' peggio di ieri.
 *
 * Un elenco SALVATO VUOTO invece fa sparire la striscia, ed e' voluto: e' il
 * modo di toglierla senza toccare il codice.
 *
 * PERCHE' SCORRE. Da due nomi si passera' a dieci, e dieci nomi in fila su un
 * telefono diventano cinque righe di grassetto che spingono giu' tutto il
 * resto. Scorrendo, occupano sempre una riga sola qualunque sia il loro
 * numero.
 *
 * COME SCORRE, e perche' non come la vetrina delle persone. Li' e' una lista
 * vera che si puo' trascinare, con le frecce, e si ferma alla fine. Qui i
 * nomi sono pochi e corti: il giro e' continuo e senza fine, ottenuto
 * ripetendo l'elenco quanto basta a riempire la riga e spostando il nastro
 * esattamente della larghezza di una copia. A fine corsa il nastro torna a
 * zero e la copia successiva si trova dov'era la prima, quindi il salto non
 * si vede.
 *
 * Si ferma col mouse sopra o col fuoco dentro (stai leggendo un nome), e con
 * "riduci animazioni" non parte proprio: in quel caso i nomi vanno a capo
 * come facevano prima.
 */

/* Pixel al secondo. Lento: non e' una cosa da inseguire con gli occhi, e'
   uno sfondo che si muove. A 40 px/s un nome attraversa uno schermo di
   telefono in una decina di secondi. */
const VELOCITA = 40

export default function Ospiti({ predefiniti = [] }) {
  const { t } = useI18n()
  const salvati = useOspitiSalvati()
  const nomi = salvati ?? predefiniti

  const pista = useRef(null)
  const gruppo = useRef(null)
  const [passo, setPasso] = useState(0)
  const [copie, setCopie] = useState(2)

  /* Letta una volta sola e tenuta: cambia solo se l'utente cambia
     impostazione di sistema, e in quel caso ricaricare la pagina e' normale. */
  const [fermo] = useState(() => prefersReducedMotion())

  /**
   * Quanto e' larga una copia dell'elenco, e quante ne servono.
   *
   * Il passo comprende lo spazio DOPO l'ultimo nome, altrimenti al giro
   * successivo i due elenchi si attaccherebbero senza stacco e si vedrebbe
   * il punto di ricucitura.
   */
  const misura = useCallback(() => {
    const p = pista.current
    const g = gruppo.current
    if (!p || !g) return
    const stacco = parseFloat(getComputedStyle(g).columnGap) || 0
    const largo = g.getBoundingClientRect().width + stacco
    /* Zero capita mentre il blocco e' ancora nascosto (display:none, o prima
       che i caratteri siano pronti). Scriverlo vorrebbe dire chiedere infinite
       copie. */
    if (largo <= 0) return
    setPasso(largo)

    /* Quante copie servono perche' alla fine del giro non si apra un vuoto a
       destra. A fine corsa il nastro e' spostato di un passo, quindi il
       contenuto deve arrivare almeno a un passo piu' la larghezza della
       finestra. Attenzione: n copie non sono larghe n passi, sono larghe
       n passi MENO uno stacco, perche' dopo l'ultimo nome lo stacco non c'e'.
       Era il conto sbagliato che lasciava scoperti 31px sul telefono. */
    setCopie(Math.max(2, Math.ceil((p.clientWidth + stacco) / largo) + 1))
  }, [])

  useEffect(() => {
    if (fermo || nomi.length === 0) return undefined
    misura()

    /* I nomi sono scritti grossi e in grassetto: finche' il carattere del
       sito non e' pronto, il browser li disegna con quello di sistema e la
       larghezza e' un'altra. Senza questa seconda misura il nastro si
       muoverebbe di un passo sbagliato, e la ricucitura si vedrebbe. */
    document.fonts?.ready?.then(misura).catch(() => {})

    window.addEventListener('resize', misura)
    return () => window.removeEventListener('resize', misura)
  }, [fermo, misura, nomi.length])

  if (nomi.length === 0) return null

  const scorre = !fermo && passo > 0
  const quante = scorre ? copie : 1

  return (
    <div className={s.fascia}>
      <div className={`${s.riga} container`}>
        <p className={s.etichetta}>{t('prova.ospiti')}</p>

        <div className={`${s.pista} ${scorre ? s.scorre : s.fermo}`} ref={pista}>
          <div
            className={s.nastro}
            style={
              scorre
                ? { '--passo': `${passo}px`, '--durata': `${passo / VELOCITA}s` }
                : undefined
            }
          >
            {Array.from({ length: quante }, (_, c) => (
              <ul
                className={s.gruppo}
                key={c}
                ref={c === 0 ? gruppo : undefined}
                /* Le copie esistono solo per riempire l'occhio: chi legge con
                   un lettore di schermo sentirebbe la stessa lista tre volte. */
                aria-hidden={c > 0 ? 'true' : undefined}
              >
                {nomi.map((nome) => (
                  <li className={s.ospite} key={nome}>
                    {nome}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * L'elenco salvato dal pannello, o null se non ne esiste uno.
 *
 * In silenzio quando non arriva: restano i nomi dei resoconti. Una striscia
 * di nomi non vale un messaggio di errore sulla home.
 */
function useOspitiSalvati() {
  const [nomi, setNomi] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true

    getOspiti()
      .then((elenco) => {
        if (vivo && elenco) setNomi(elenco)
      })
      .catch((e) => console.warn('[YET] Non riesco a leggere gli ospiti.', e))

    return () => {
      vivo = false
    }
  }, [])

  return nomi
}
