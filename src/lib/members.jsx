/**
 * Quello che sanno in comune la vetrina e la pagina di un singolo profilo.
 *
 * Esisteva tutto dentro Membri.jsx, e stava bene finché la vetrina era l'unico
 * posto che mostrava i membri. Con la pagina del singolo profilo diventavano
 * due copie, e una delle due è la funzione che decide se un indirizzo scritto
 * da un utente può finire dentro un href: quella non va duplicata, perché la
 * copia che qualcuno dimentica di aggiornare è esattamente il buco.
 *
 * I glifi sono JSX, quindi questo file è .jsx e non .js.
 */

/* Il nome di ripiego per chi non ne ha scritto uno. Resta una costante e non
   una chiave del catalogo perche' serve anche a ORDINARE l'elenco, dove non
   c'e' nessun componente e quindi nessun t(): un ordinamento che cambia con
   la lingua sposterebbe i profili senza nome da un giro all'altro. Nei punti
   in cui si SCRIVE a schermo, chi chiama passa la versione tradotta. */
import { memberSlug, primoFraOmonimi } from './slug.js'

/* Ri-esportata da qui perche' e' una funzione "sui membri" e chi la cerca
   guarda in questo file. Vive in slug.js solo perche' la usa anche lo script
   di build, che gira in Node e non sa leggere il JSX. */
export { memberSlug }

export const FALLBACK_NAME = 'Membro YET'

/* Tratto comune delle icone: nessun riempimento, spessore costante, spigoli
   arrotondati solo nei raccordi. Coerente con lo stile del sito, che non ha
   raggi sui riquadri ma neanche punte vive sui tratti. */
const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/* Glifi dei social dei MEMBRI.
   Non arrivano da config/socials.js di proposito: quel file descrive gli
   account della community (handle e href fissi), qui invece servono i tre
   campi del profilo utente (socials.linkedin / instagram / other). Sono JSX
   e non semplici path 'd' perché l'icona di Instagram con un path unico
   richiederebbe fill-rule evenodd scritto a mano: con rect + circle il
   disegno è verificabile a occhio.

   `chiaveEtichetta` e non `label`: "Sito" in inglese è "Website", e una
   stringa scritta qui resterebbe italiana in tutto il sito. Chi mostra questi
   campi la passa a t(). */
export const SOCIAL_FIELDS = [
  {
    key: 'linkedin',
    chiaveEtichetta: 'social.linkedin',
    glyph: (
      <>
        <rect x="2.9" y="2.9" width="18.2" height="18.2" {...STROKE} />
        <circle cx="7.3" cy="7.6" r="1.25" fill="currentColor" />
        <path d="M6.25 10.7h2.1v7.6h-2.1z" fill="currentColor" />
        <path
          d="M10.6 18.3v-7.6h2v1a3.1 3.1 0 0 1 2.6-1.2c2 0 3.1 1.3 3.1 3.6v4.2h-2.1v-3.9c0-1.2-.5-1.9-1.6-1.9s-1.9.8-1.9 2v3.8z"
          fill="currentColor"
        />
      </>
    ),
  },
  {
    key: 'instagram',
    chiaveEtichetta: 'social.instagram',
    glyph: (
      <>
        <rect x="2.9" y="2.9" width="18.2" height="18.2" {...STROKE} />
        <circle cx="12" cy="12" r="4.5" {...STROKE} />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </>
    ),
  },
  {
    key: 'other',
    chiaveEtichetta: 'social.sito',
    glyph: (
      <>
        <path d="M14 3.5h6.5V10" {...STROKE} />
        <path d="M20.5 3.5 11.5 12.5" {...STROKE} />
        <path d="M17.5 14v5.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1H10" {...STROKE} />
      </>
    ),
  },
]

export function memberName(member, ripiego = FALLBACK_NAME) {
  const name = typeof member?.displayName === 'string' ? member.displayName.trim() : ''
  return name || ripiego
}

/* Un URL scritto a mano in un campo di testo può essere qualunque cosa,
   compreso `javascript:...`, che al click eseguirebbe codice nel nostro
   dominio. Quindi: accettiamo solo http/https, completiamo i domini nudi e in
   tutti gli altri casi NON mostriamo il link. Meglio un social in meno che un
   link pericoloso in una pagina che elenca profili di sconosciuti. */
function httpOnly(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

export function toProfileUrl(key, raw) {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value) return null

  // Schema esplicito diverso da http/https: si scarta subito.
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i)
  if (scheme && !/^https?$/i.test(scheme[1])) return null

  if (/^https?:\/\//i.test(value)) return httpOnly(value)

  // Handle nudo ("@mario", "mario.rossi" senza punti né slash): possiamo
  // ricostruire l'URL solo per le piattaforme di cui conosciamo la forma.
  const handle = value.replace(/^@+/, '')
  if (handle && !handle.includes('/') && !handle.includes('.') && !/\s/.test(handle)) {
    if (key === 'instagram') return `https://www.instagram.com/${encodeURIComponent(handle)}`
    if (key === 'linkedin') return `https://www.linkedin.com/in/${encodeURIComponent(handle)}`
    return null // per "other" un handle senza dominio non porta da nessuna parte
  }

  // Dominio senza schema: "linkedin.com/in/mario" -> https://linkedin.com/...
  if (/^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(value)) return httpOnly(`https://${value}`)

  return null
}

export function memberLinks(member) {
  const socials = member?.socials && typeof member.socials === 'object' ? member.socials : {}
  return SOCIAL_FIELDS.map((field) => {
    const href = toProfileUrl(field.key, socials[field.key])
    return href ? { ...field, href } : null
  }).filter(Boolean)
}

/**
 * L'indirizzo della pagina di un profilo.
 *
 * Preferisce il nome all'identificativo: /vetrina/federicofassio invece di
 * /vetrina/k46VxF5qWedKa7mK1AJV8axHIzQ2. Un indirizzo si legge ad alta voce,
 * si scrive in una biografia di Instagram e si riconosce in un risultato di
 * ricerca; una stringa casuale no.
 *
 * L'uid resta come ripiego quando il nome non produce niente di utilizzabile
 * (un nome fatto di soli simboli, o un profilo senza nome).
 */
export function memberPath(membro) {
  /* Accetta sia l'oggetto sia il solo uid: la firma vecchia era
     memberPath(uid) ed e' chiamata da piu' punti. Cambiarli tutti insieme
     avrebbe voluto dire rompere qualcosa senza accorgersene. */
  if (typeof membro === 'string') return `/vetrina/${encodeURIComponent(membro)}`

  const slug = memberSlug(membro?.displayName)
  return `/vetrina/${encodeURIComponent(slug || membro?.uid || '')}`
}

/**
 * Trova un membro dato quel che c'e' nell'indirizzo, che puo' essere lo slug
 * oppure il vecchio uid.
 *
 * Perche' si risolve QUI e non con un campo `slug` salvato nel database:
 * Firestore non sa imporre l'unicita' di un campo fra documenti diversi, quindi
 * garantirla richiederebbe una seconda collection di prenotazione, scritture
 * transazionali e una migrazione dei profili esistenti. Con i numeri di un
 * club, cercare nella lista gia' scaricata costa niente e non puo' andare fuori
 * sincrono, perche' il nome e lo slug sono la stessa cosa per costruzione.
 *
 * L'uid continua a funzionare: i link condivisi prima di questo cambiamento
 * non si rompono.
 */
export function findMemberByKey(membri, chiave) {
  if (!Array.isArray(membri) || !chiave) return null

  const k = String(chiave)
  const perUid = membri.find((m) => m.uid === k)
  if (perUid) return perUid

  const cercato = memberSlug(k)
  const corrispondenti = membri.filter((m) => memberSlug(m.displayName) === cercato)

  /* Due persone con lo stesso nome: la regola sta in slug.js perche' la deve
     applicare anche lo script di build, e le due devono coincidere. */
  return primoFraOmonimi(corrispondenti)
}
