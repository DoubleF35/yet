import { useEffect, useRef } from 'react'

/**
 * RIMETTE IN CIMA QUANDO LA PAGINA SMETTE DI CRESCERE.
 *
 * Serve alle due pagine delle candidature e non alle altre, perche' sono le
 * sole che cambiano altezza di colpo DOPO essere comparse: si aprono alte
 * quanto uno scheletro di caricamento e, quando Firestore risponde, diventano
 * lunghe venti schede.
 *
 * In quel salto lo scorrimento puo' finire dove non deve, e le strade sono
 * tre, tutte fuori dal nostro controllo:
 *
 *   - ScrollToTop manda in cima con un movimento MORBIDO, che e' asincrono:
 *     mentre l'animazione e' ancora in corso la pagina si allunga sotto, e
 *     dove si ferma lo decide il browser;
 *   - il browser RIPRISTINA da solo la posizione di quando sei uscito da
 *     quella pagina, e lo fa anche parecchio dopo il caricamento, cioe'
 *     proprio quando il documento e' finalmente abbastanza alto da
 *     permetterglielo;
 *   - l'ANCORA DI SCORRIMENTO: quando compare contenuto sopra il punto in cui
 *     stai guardando, il browser sposta lo scorrimento per tenere ferma la
 *     cosa che avevi sotto gli occhi. E' giusto in un feed che si allunga in
 *     cima, e qui no: li' sopra non stavi guardando niente, stava caricando.
 *
 * NON COMBATTE CHI STA SCORRENDO. Se la persona ha gia' mosso la pagina da
 * sola prima che i dati arrivassero, si lascia stare dov'e': strapparla in
 * cima sarebbe un difetto peggiore di quello che si sta togliendo.
 *
 * Si guardano `wheel`, `touchmove` e i tasti, e NON l'evento `scroll`: quello
 * scatta anche per gli scorrimenti fatti dal browser e dal codice, quindi non
 * saprebbe distinguere la persona da cio' che stiamo cercando di correggere.
 *
 * `behavior: 'instant'` e non 'auto': 'auto' vuol dire "fai come dice il
 * CSS", e il CSS di questo sito dice `scroll-behavior: smooth`. Con 'auto' si
 * rimetterebbe in campo l'animazione che e' meta' del problema.
 */
export function useInCimaQuandoPronta(pronta) {
  const giaFatto = useRef(false)
  const haScorso = useRef(false)

  useEffect(() => {
    const segna = () => {
      haScorso.current = true
    }
    window.addEventListener('wheel', segna, { passive: true })
    window.addEventListener('touchmove', segna, { passive: true })
    window.addEventListener('keydown', segna)
    return () => {
      window.removeEventListener('wheel', segna)
      window.removeEventListener('touchmove', segna)
      window.removeEventListener('keydown', segna)
    }
  }, [])

  useEffect(() => {
    if (!pronta || giaFatto.current) return
    giaFatto.current = true
    if (haScorso.current) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pronta])
}
