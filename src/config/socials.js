/**
 * Canali ufficiali della community e dati anagrafici di YET.
 *
 * QUESTO È IL FILE DA MODIFICARE per aggiungere, togliere o rinominare un
 * social: le pagine iterano su `SOCIALS` e non conoscono nessun canale per
 * nome. Aggiungere Telegram vuol dire aggiungere un oggetto all'array qui
 * sotto e le due righe `socials.telegram` nei cataloghi delle lingue.
 *
 * QUI STA QUELLO CHE NON SI TRADUCE: l'id, l'indirizzo, il disegno
 * dell'icona, la città, il nome del club. Il NOME che si legge a schermo
 * ("Gruppo WhatsApp" / "WhatsApp group") e ogni frase di presentazione sono
 * testo di interfaccia, e vivono in src/i18n/it.js e en.js. Le due metà le
 * ricuce lib/socials.jsx: i componenti continuano a vedere oggetti con
 * `label` e `handle` e non sanno che sotto ci sono due fonti.
 *
 * Il motivo per cui NON c'è anche una copia italiana qui: due posti in cui
 * scrivere la stessa frase sono due posti che divergono, e quello che nessuno
 * apre più resta a mentire.
 */

/* ---------------------------------------------------------------------------
   Icone.

   Ogni voce porta il solo attributo `d` di un <path> dentro un
   <svg viewBox="0 0 24 24">. Le pagine lo montano con fill="currentColor" e
   fillRule="evenodd", così il segno prende il colore del testo e i loghi con i
   buchi (l'obiettivo di Instagram) restano forati invece di diventare macchie.

   Sono path scritti a mano e volutamente semplici: geometrie pulite che si
   leggono bene a 24px. Se un domani vuoi i loghi ufficiali, sostituisci solo
   queste costanti, la forma del dato non cambia.
--------------------------------------------------------------------------- */

const ICON_LINKEDIN =
  'M4.5 3A1.5 1.5 0 1 0 4.5 6 1.5 1.5 0 0 0 4.5 3ZM3 8h3v13H3V8Zm5.5 0h2.9v1.8h.04c.4-.76 1.4-1.56 2.87-1.56C17.5 8.24 19 10 19 13.1V21h-3v-7c0-1.67-.6-2.8-2.07-2.8-1.13 0-1.8.76-2.1 1.5-.1.26-.13.63-.13 1V21h-3V8Z'

// Cornice arrotondata + obiettivo + punto: il segno di Instagram ridotto
// all'osso. I due sottotracciati in senso opposto creano il foro dell'obiettivo.
const ICON_INSTAGRAM =
  'M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm4.5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-2.65a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z'

// La nota musicale di TikTok, in un solo tracciato pieno.
const ICON_TIKTOK =
  'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z'

// Busta: rettangolo esterno + la "V" del lembo.
const ICON_MAIL =
  'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2v.4l8 5 8-5V7H4Zm16 2.75-7.47 4.67a1 1 0 0 1-1.06 0L4 9.75V17h16V9.75Z'

/* ---------------------------------------------------------------------------
   La mail di contatto.
   Vive anche dentro SOCIALS come ultima riga, ma la esportiamo a parte perché
   la pagina Contatti la mette in evidenza con il bottone "Copia".
--------------------------------------------------------------------------- */
export const CONTACT_EMAIL = 'info.yetcommunity@gmail.com'

/* ---------------------------------------------------------------------------
   I canali.

   Campi:
     id      chiave stabile: è la key React E il pezzo di chiave con cui si
             cercano il nome e il sottotitolo nei cataloghi
             (`socials.<id>.label` e `.handle`). Non cambiarla a cuor leggero.
     href    l'URL COMPLETO. Per la mail serve il prefisso mailto:.
     icon    uno dei path qui sopra, oppure omesso (esce un quadratino coral).

   PER AGGIUNGERNE UNO: copia un blocco, cambia i tre campi, e aggiungi le due
   righe `socials.<id>` in it.js e in en.js.
--------------------------------------------------------------------------- */
export const SOCIALS = [
  {
    id: 'linkedin',
    // Il `?viewAsMember=true` dell'URL copiato dalla barra degli indirizzi è
    // stato tolto di proposito: serve a chi amministra la pagina per vederla
    // come la vede un esterno, e per tutti gli altri è un parametro inutile
    // che si porta dietro nei link condivisi.
    href: 'https://www.linkedin.com/company/yetclub/',
    icon: ICON_LINKEDIN,
  },
  {
    id: 'instagram',
    href: 'https://www.instagram.com/yet.community/',
    icon: ICON_INSTAGRAM,
  },
  {
    id: 'tiktok',
    href: 'https://www.tiktok.com/@yet.community',
    icon: ICON_TIKTOK,
  },
  {
    id: 'email',
    href: `mailto:${CONTACT_EMAIL}`,
    icon: ICON_MAIL,
  },
]


/* ---------------------------------------------------------------------------
   Chi siamo, in forma di dato.

   Resta il nome del club, che non si traduce. Tutto il resto (la tagline, la
   descrizione breve e quella lunga, la fascia d'età, il raggio, e anche la
   CITTÀ, che in inglese si chiama "Turin") è testo e sta nei cataloghi delle
   lingue, sotto `community.*`: la Home e la Join leggono la stessa chiave,
   quindi restano allineate come prima, ma in due lingue invece di una.

   ATTENZIONE quando si scrive una frase che nomina Torino: la città da sola
   si legge come un requisito d'ingresso. Ogni frase che la nomina deve
   nominare anche il raggio (`community.reach`), perché chi legge da Bari deve
   capire alla prima riga che può entrare anche lui.
--------------------------------------------------------------------------- */
export const COMMUNITY = {
  name: 'YET',
}
