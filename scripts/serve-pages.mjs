/**
 * Un server statico che si comporta come GitHub Pages, per provare in locale
 * quello che succedera' in produzione.
 *
 * `vite preview` NON va bene per questa verifica: ha una modalita' SPA che
 * serve index.html per qualunque percorso, quindi mostrerebbe tutto
 * funzionante anche se il file non esistesse. Le due regole che contano qui
 * sono esattamente quelle di Pages:
 *   - /x/  ->  x/index.html
 *   - se non c'e' nessun file, 404.html con stato 404 (non 200).
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'

const DIST = resolve(process.argv[2] ?? 'dist')
const TIPI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain' }

createServer((req, res) => {
  const percorso = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = join(DIST, percorso)

  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')

  /* Pages redirige /eventi su /eventi/ con un 301 quando esiste la cartella. */
  if (!existsSync(file) && existsSync(join(DIST, percorso, 'index.html'))) {
    res.writeHead(301, { Location: `${percorso}/` })
    return res.end()
  }

  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    return createReadStream(join(DIST, '404.html')).pipe(res)
  }

  res.writeHead(200, { 'Content-Type': TIPI[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(4173, () => console.log('Come GitHub Pages su http://localhost:4173'))
