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

// Fumetto con la cornetta. I tre sottotracciati (cornetta, bordo interno,
// bordo esterno) con fillRule evenodd danno il fumetto VUOTO con la cornetta
// piena, che è il segno giusto: il conteggio degli attraversamenti è 2 dentro
// il fumetto (pari, quindi trasparente) e 3 sulla cornetta (dispari, piena).
const ICON_WHATSAPP =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z'

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
    id: 'whatsapp',
    // Link d'invito al gruppo. È pubblico per definizione: chiunque apra
    // questa pagina può entrare nel gruppo senza passare da nessuno.
    // Se un domani serve chiudere il rubinetto (spam, o gruppo diventato
    // troppo grande), NON basta togliere la riga da qui: il vecchio link
    // resta valido per chi l'ha salvato. Va invalidato da WhatsApp
    // Info gruppo → Invita tramite link → Reimposta link, e poi va
    // incollato qui quello nuovo.
    href: 'https://chat.whatsapp.com/KgpSEPKBuP712TN9XhjEIH',
    icon: ICON_WHATSAPP,
  },
  {
    id: 'email',
    href: `mailto:${CONTACT_EMAIL}`,
    icon: ICON_MAIL,
  },
]

/**
 * Il gruppo WhatsApp, cercato per id dentro SOCIALS.
 *
 * Cercarlo invece di duplicarne l'URL è il punto: il gruppo compare in cinque
 * posti del sito (home, join, membri, contatti, footer) e un link cambiato in
 * quattro su cinque sarebbe peggio che non averlo. Se un domani il gruppo
 * sparisce o cambia id, restituisce undefined e i blocchi che lo usano non si
 * mostrano, invece di puntare nel vuoto.
 */
export const WHATSAPP = SOCIALS.find((item) => item.id === 'whatsapp')

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
