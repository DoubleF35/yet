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
   disegno è verificabile a occhio. */
export const SOCIAL_FIELDS = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
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
    label: 'Instagram',
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
    label: 'Sito',
    glyph: (
      <>
        <path d="M14 3.5h6.5V10" {...STROKE} />
        <path d="M20.5 3.5 11.5 12.5" {...STROKE} />
        <path d="M17.5 14v5.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1H10" {...STROKE} />
      </>
    ),
  },
]

export function memberName(member) {
  const name = typeof member?.displayName === 'string' ? member.displayName.trim() : ''
  return name || FALLBACK_NAME
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

/** L'indirizzo della pagina di un profilo. In un posto solo perché lo usano
 *  la tessera della vetrina, la pagina Join ("vedi come ti vedono") e i test. */
export function memberPath(uid) {
  return `/vetrina/${encodeURIComponent(uid)}`
}
