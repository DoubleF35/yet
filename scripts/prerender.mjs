/**
 * Genera un file HTML vero per ogni rotta pubblica, dopo il build.
 *
 * PERCHE' NON IL TRUCCO SOLITO. La ricetta che si trova ovunque per far
 * funzionare i percorsi veri su GitHub Pages e' far redirigere 404.html verso
 * index.html conservando il percorso. Funziona per le PERSONE, e non risolve
 * niente per i motori di ricerca: la prima risposta del server resta un
 * 404, e Googlebot a quel punto non indicizza la pagina. Verificato prima di
 * scrivere questo file: https://yetcommunity.it/eventi rispondeva 404.
 *
 * Qui invece, per ogni rotta, scriviamo dist/eventi/index.html. GitHub Pages
 * lo serve con 200 perche' il file ESISTE davvero, e l'applicazione parte
 * normalmente da li'. Nessun redirect, nessun 404, nessuno sfarfallio.
 *
 * In piu' ogni file riceve il SUO titolo, la SUA descrizione, il SUO canonico
 * e un blocco di testo diverso dagli altri. E' la differenza fra dieci
 * indirizzi che sembrano la stessa pagina e dieci pagine distinte: senza
 * questo, Google le considererebbe duplicati e ne terrebbe una.
 *
 * NON e' rendering lato server: React non viene eseguito qui. E' un guscio
 * per rotta, con dentro il testo essenziale. Fare SSR vero vorrebbe dire
 * cambiare l'intera architettura del progetto per un sito di otto pagine.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(RADICE, 'dist')
const SITO = 'https://yetcommunity.it'

/**
 * Le rotte pubbliche, con il testo che le distingue.
 *
 * /admin non c'e' e non deve esserci: e' dietro autenticazione, non ha niente
 * da indicizzare, ed e' gia' escluso in robots.txt.
 *
 * I titoli finiscono nella linguetta del browser e nel risultato di ricerca.
 * Vanno scritti per essere LETTI da una persona che sta scegliendo su cosa
 * cliccare, non per infilarci parole chiave: "Eventi · YET" dice cosa
 * troverai, "eventi hackathon torino community giovani" no.
 */
const ROTTE = [
  {
    path: '/',
    title: 'YET · Build ambition.',
    desc: 'YET, Young Entrepreneurs Together: la community dei giovani che costruiscono qualcosa, dai 16 ai 23 anni. Primi eventi a Torino, obiettivo tutta Italia. Nessuna selezione, nessuna quota: conta l’attitudine.',
    h1: 'YET, Young Entrepreneurs Together',
    testo: [
      'La community dei giovani che costruiscono qualcosa: un prodotto, un’associazione, un progetto, un’idea ancora confusa. Dai 16 ai 23 anni. E se non hai ancora niente fra le mani va bene lo stesso: quello che cerchiamo è l’attitudine, non il progetto già avviato.',
      'I primi eventi saranno a Torino, ma l’obiettivo è espandersi in tutta Italia. Nessuna selezione, nessuna quota di iscrizione.',
    ],
  },
  {
    path: '/home',
    title: 'YET · Build ambition.',
    desc: 'La community dei giovani che costruiscono qualcosa, dai 16 ai 23 anni. Primi eventi a Torino, obiettivo tutta Italia.',
    h1: 'YET, Young Entrepreneurs Together',
    testo: [
      'Chi siamo, cosa facciamo e le ultime novità della community. Dai 16 ai 23 anni, primi eventi a Torino e obiettivo tutta Italia.',
    ],
  },
  {
    path: '/vetrina',
    title: 'Membri · YET',
    desc: 'Le persone di YET: studenti, autodidatti, fondatori alle prime armi, da Torino e dal resto d’Italia. Guarda chi c’è e cosa sta costruendo.',
    h1: 'I membri di YET',
    testo: [
      'Chi costruisce qualcosa dentro YET: studenti, autodidatti, fondatori alle prime armi, da Torino e dal resto d’Italia.',
      'Apri un profilo per leggere la presentazione completa e trovare i contatti.',
    ],
  },
  {
    path: '/eventi',
    title: 'Eventi · YET',
    desc: 'Gli incontri di YET: quando, dove e di cosa si parla. I primi eventi saranno a Torino, ma l’obiettivo è farne in tutta Italia.',
    h1: 'Gli eventi di YET',
    testo: [
      'Incontri, annunci e cose che stiamo costruendo. I primi eventi saranno a Torino, ma l’obiettivo è farne in tutta Italia: se vuoi organizzarne uno dove stai tu, scrivici.',
    ],
  },
  {
    path: '/join',
    title: 'Entra in YET · Come iscriversi',
    desc: 'Come si entra in YET: accedi con Google, scrivi due righe su di te e compari fra i membri. Nessuna selezione, nessuna quota. Dai 16 ai 23 anni.',
    h1: 'Unisciti a YET',
    testo: [
      'Accedi con Google, scrivi due righe su di te e compari fra i membri. Non c’è quota di iscrizione e non c’è selezione: il passaggio di approvazione serve solo a tenere fuori gli account finti.',
      'E se non hai ancora niente in costruzione va bene lo stesso: quello che cerchiamo è l’attitudine.',
    ],
  },
  {
    path: '/contatti',
    title: 'Contatti · YET',
    desc: 'Come raggiungere YET: LinkedIn, Instagram, il gruppo WhatsApp della community e la mail info.yetcommunity@gmail.com.',
    h1: 'Contatta YET',
    testo: [
      'Che sia un’idea da costruire, una domanda o solo curiosità: qui trovi tutti i modi per raggiungerci. Rispondiamo appena possibile.',
      'Scrivici a info.yetcommunity@gmail.com, oppure trovaci su LinkedIn, Instagram e nel gruppo WhatsApp.',
    ],
  },
  {
    path: '/brand',
    title: 'Brand identity · YET',
    desc: 'Il marchio YET: logo, colori, tipografia e regole d’uso. I file da scaricare per chi ospita un evento o scrive di noi.',
    h1: 'Il marchio YET',
    testo: [
      'Logo, colori, carattere tipografico e cosa non fare. Se ci ospiti a un evento o scrivi di noi, qui trovi i file giusti.',
    ],
  },
  {
    path: '/sponsor',
    title: 'Sponsor · YET',
    desc: 'Chi sostiene YET, e come diventare sostenitore della community dei giovani builder.',
    h1: 'Chi sostiene YET',
    testo: [
      'Le realtà che sostengono la community e rendono possibili gli eventi.',
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy · YET',
    desc: 'Informativa privacy di YET: quali dati raccogliamo, perché, per quanto tempo e come farli cancellare.',
    h1: 'Informativa privacy',
    testo: [
      'Cosa raccoglie questo sito, perché, per quanto tempo e come farlo smettere.',
    ],
  },
  {
    path: '/cookie',
    title: 'Cookie · YET',
    desc: 'Cosa salva YET sul tuo dispositivo, e perché non c’è un banner dei cookie: nessuna profilazione, nessun tracciamento di terze parti.',
    h1: 'Informativa cookie',
    testo: [
      'Non c’è nessun banner perché non ci sono cookie per cui chiedere il permesso. Qui l’elenco completo di quello che questo sito salva sul tuo dispositivo.',
    ],
  },
]

/* Sostituisce il contenuto di un tag, o lo lascia stare se non c'e'.
   Una regex e non un parser HTML: il file di partenza lo generiamo noi, la
   sua forma la conosciamo, e tirarsi dentro una dipendenza per dieci
   sostituzioni sarebbe sproporzionato. */
function sostituisci(html, regex, nuovo) {
  if (!regex.test(html)) {
    console.warn(`  attenzione: nessuna corrispondenza per ${regex}`)
    return html
  }
  return html.replace(regex, nuovo)
}

function scappa(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const base = readFileSync(join(DIST, 'index.html'), 'utf8')
console.log('Genero una pagina per rotta:\n')

for (const rotta of ROTTE) {
  let html = base
  const url = rotta.path === '/' ? `${SITO}/` : `${SITO}${rotta.path}`

  html = sostituisci(html, /<title>[\s\S]*?<\/title>/, `<title>${scappa(rotta.title)}</title>`)
  html = sostituisci(
    html,
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${scappa(rotta.desc)}$2`,
  )
  html = sostituisci(
    html,
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${scappa(rotta.desc)}$2`,
  )
  html = sostituisci(
    html,
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${scappa(rotta.title)}$2`,
  )
  /* Il canonico punta a SE STESSO e non alla home, ed e' il punto di tutta
     questa operazione: dire a Google che queste sono dieci pagine diverse. */
  html = sostituisci(html, /(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`)
  html = sostituisci(html, /(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${url}$2`)

  /* Il testo dentro #root, diverso per ogni pagina. Senza questo, i dieci
     indirizzi avrebbero contenuto identico e Google ne terrebbe uno solo
     considerando gli altri copie. */
  const paragrafi = rotta.testo
    .map(
      (p) =>
        `<p style="margin:16px 0 0;font-size:1.0625rem;line-height:1.75;color:#b5aca3;">${scappa(p)}</p>`,
    )
    .join('\n          ')

  /* Marcatori espliciti e non "il primo </div> dopo #root": Vite sposta il
     tag <script> dentro <head>, quindi qualunque regex basata sulla posizione
     dello script sbaglia in silenzio. Con i marcatori, se un giorno la
     struttura cambia il controllo qui sotto se ne accorge e il build fallisce
     invece di produrre dieci pagine identiche senza dirlo. */
  if (!html.includes('<!--prerender:start-->')) {
    console.error('\n  ERRORE: marcatori prerender assenti in index.html.')
    console.error('  Le pagine sarebbero tutte uguali. Build interrotto.\n')
    process.exit(1)
  }

  html = html.replace(
    /<!--prerender:start-->[\s\S]*?<!--prerender:end-->/,
    `<!--prerender:start-->
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#14120f;color:#f2efe9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <div style="max-width:38rem;">
          <h1 style="margin:0;font-size:clamp(2rem,6vw,3rem);font-weight:800;line-height:1.1;letter-spacing:-0.03em;">${scappa(rotta.h1)}</h1>
          ${paragrafi}
          <p style="margin:28px 0 0;font-size:0.9375rem;color:#b5aca3;">
            <a href="mailto:info.yetcommunity@gmail.com" style="color:#e2603c;">info.yetcommunity@gmail.com</a>
          </p>
        </div>
      </div>
      <!--prerender:end-->`,
  )

  const cartella = rotta.path === '/' ? DIST : join(DIST, rotta.path)
  mkdirSync(cartella, { recursive: true })
  writeFileSync(join(cartella, 'index.html'), html)

  const dove = rotta.path === '/' ? 'index.html' : `${rotta.path.slice(1)}/index.html`
  console.log(`  ${dove.padEnd(22)} ${rotta.title}`)
}

/* La sitemap elenca gli indirizzi VERI. Prima ne conteneva uno solo, ed era
   corretto: con il router a cancelletto esisteva davvero una pagina sola. */
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  ROTTE
    /* /home e' la stessa pagina di / per un lettore: elencarle entrambe
       significherebbe dichiarare a Google due pagine identiche. */
    .filter((r) => r.path !== '/home')
    .map((r) => {
      const url = r.path === '/' ? `${SITO}/` : `${SITO}${r.path}`
      const priorita = r.path === '/' ? '1.0' : r.path === '/join' || r.path === '/eventi' ? '0.8' : '0.6'
      return `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priorita}</priority>\n  </url>`
    })
    .join('\n') +
  '\n</urlset>\n'

writeFileSync(join(DIST, 'sitemap.xml'), sitemap)
console.log(`\n  sitemap.xml            ${ROTTE.length - 1} indirizzi`)
console.log('\nFatto.')
