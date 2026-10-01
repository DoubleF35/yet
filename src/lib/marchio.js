/**
 * I file del marchio, chiamati per RUOLO e non per colore.
 *
 * In public/ ci sono due versioni di ogni segno: `logo.png` e `hands.png` sono
 * scuri, `logo-light.png` e `hands-light.png` sono chiari. Finora i componenti
 * nominavano direttamente il file, e ha funzionato finche' il tema e' stato
 * uno solo.
 *
 * Non ha funzionato quando e' cambiato. Invertendo il sito da chiaro a scuro e
 * poi di nuovo a chiaro, ogni volta bisognava ricordarsi quali degli undici
 * punti che citano un logo andavano cambiati e quali no. E non sono tutti
 * uguali: quello dentro l'apertura sta sopra una FOTOGRAFIA, quindi resta
 * chiaro qualunque cosa faccia il resto del sito.
 *
 * Da qui questi tre nomi. Dicono dove va il segno, non di che colore e':
 *
 *   LOGO           sul foglio del sito      -> segue il tema
 *   LOGO_SU_FOTO   dentro l'apertura        -> sempre chiaro
 *   MANI           divisori e stati vuoti   -> segue il tema
 *
 * Se il tema si rigira, si cambiano le tre righe qui sotto e basta.
 *
 * La pagina /brand e' l'unica che continua a nominare i file per nome, ed e'
 * giusto cosi': li' le due versioni si mostrano INSIEME, perche' il punto
 * della pagina e' far scaricare l'una o l'altra.
 */

const BASE = import.meta.env.BASE_URL

/** Il logo sul fondo del sito. Tema chiaro, quindi la versione scura. */
export const LOGO = `${BASE}logo.png`

/** Il logo sopra una fotografia: chiaro sempre, perche' sotto c'e' un velo scuro. */
export const LOGO_SU_FOTO = `${BASE}logo-light.png`

/** Le due lancette, come divisore o dentro uno stato vuoto. */
export const MANI = `${BASE}hands.png`

/** Le misure native, per non far saltare il layout prima che l'immagine arrivi. */
export const LOGO_W = 486
export const LOGO_H = 291
export const MANI_W = 162
export const MANI_H = 291
