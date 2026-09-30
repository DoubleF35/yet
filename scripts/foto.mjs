/**
 * Prepara le foto degli eventi.
 *
 * COME SI USA
 *
 *   1. metti gli scatti originali in  foto-originali/<slug>/
 *   2. npm run foto
 *   3. commit
 *
 * Lo slug e' il nome della cartella ed e' anche l'indirizzo della pagina:
 * foto-originali/torino-connect-vol1/ diventa /eventi/torino-connect-vol1.
 *
 * COSA FA
 *
 * Per ogni scatto genera due misure in WebP, 800 e 1600 px di lato lungo, e
 * per la sola copertina anche 2400. Poi scrive src/data/gallerie.json, che e'
 * quello che legge il sito.
 *
 * PERCHE' DUE MISURE E NON UNA
 *
 * Con srcset il telefono scarica la 800 e il portatile la 1600. Una misura
 * sola vorrebbe dire o mandare 1600 px a uno schermo da 390, cioe' quattro
 * volte i pixel che servono, oppure mostrare una foto sgranata sul desktop.
 *
 * PERCHE' LE ORIGINALI NON STANNO NEL REPO
 *
 * foto-originali/ e' in .gitignore. Un JPEG da fotocamera pesa 4-8 MB; dieci
 * scatti per evento sarebbero 60 MB a serata, e git non dimentica: resterebbero
 * nella storia per sempre anche cancellandoli dopo. Nel repo vanno solo le
 * WebP, che pesano un ventesimo. Le originali tienile dove le tieni di solito.
 *
 * DUE COSE CHE FA IN SILENZIO E CHE VALE LA PENA SAPERE
 *
 * Ruota gli scatti secondo l'orientamento EXIF, altrimenti le foto verticali
 * scattate col telefono escono coricate.
 *
 * Butta via TUTTI i metadati, e non e' un dettaglio estetico: le foto dei
 * telefoni contengono le coordinate GPS del posto, e pubblicarle vorrebbe dire
 * mettere online l'indirizzo esatto dove c'erano dei minorenni.
 */

import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '..')

const ORIGINALI = join(RADICE, 'foto-originali')
const USCITA = join(RADICE, 'public', 'eventi')
const MANIFESTO = join(RADICE, 'src', 'data', 'gallerie.json')

/* Le misure. La 2400 la generiamo solo per la copertina: e' l'unica che viene
   mostrata a tutta larghezza, per le altre sarebbe peso sprecato. */
const MISURE = [800, 1600]
const MISURA_COPERTINA = 2400

/* 78 e' il punto in cui, su una foto di persone, l'occhio non distingue piu'
   la differenza dal 100 ma il file pesa un terzo. Sotto il 70 iniziano a
   vedersi gli aloni intorno ai visi. */
const QUALITA = 78

const ESTENSIONI = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif'])

/** Un nome file che regge in un URL: niente accenti, spazi o maiuscole. */
function ripulisci(nome) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Vero se la sorgente e' piu' recente dell'uscita, cioe' se c'e' da rifare. */
async function daRifare(sorgente, uscita) {
  try {
    const [a, b] = await Promise.all([stat(sorgente), stat(uscita)])
    return a.mtimeMs > b.mtimeMs
  } catch {
    return true /* l'uscita non esiste ancora */
  }
}

async function cartelle(dove) {
  try {
    const voci = await readdir(dove, { withFileTypes: true })
    return voci.filter((v) => v.isDirectory()).map((v) => v.name).sort()
  } catch (e) {
    if (e.code === 'ENOENT') return []
    throw e
  }
}

async function scatti(dove) {
  const voci = await readdir(dove, { withFileTypes: true })
  return voci
    .filter((v) => v.isFile() && ESTENSIONI.has(extname(v.name).toLowerCase()))
    .map((v) => v.name)
    .sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))
}

/**
 * Una foto, in tutte le sue misure.
 * Ritorna la voce da mettere nel manifesto, o null se il file non e' leggibile.
 */
async function preparaScatto(slug, nomeFile, indice, copertina) {
  const sorgente = join(ORIGINALI, slug, nomeFile)
  const base = ripulisci(nomeFile.replace(extname(nomeFile), '')) || `scatto-${indice + 1}`
  const cartellaUscita = join(USCITA, slug)

  let immagine
  let meta
  try {
    immagine = sharp(sorgente, { failOn: 'error' }).rotate()
    meta = await immagine.metadata()
  } catch (e) {
    console.warn(`  ! ${nomeFile}: non riesco a leggerlo (${e.message})`)
    return null
  }

  /* .rotate() gira l'immagine ma metadata() riporta ancora le misure del file
     su disco: se l'orientamento EXIF e' 5-8 lo scatto e' coricato e le due
     misure vanno scambiate, altrimenti il rapporto nel manifesto e' sbagliato
     e la pagina salta quando la foto arriva. */
  const coricata = meta.orientation >= 5 && meta.orientation <= 8
  const larghezza = coricata ? meta.height : meta.width
  const altezza = coricata ? meta.width : meta.height

  if (!larghezza || !altezza) {
    console.warn(`  ! ${nomeFile}: non ha misure leggibili`)
    return null
  }

  const misure = copertina ? [...MISURE, MISURA_COPERTINA] : MISURE
  const fatte = []

  for (const misura of misure) {
    const uscita = join(cartellaUscita, `${base}-${misura}.webp`)

    /* Non ingrandiamo mai: se l'originale e' piu' piccolo della misura
       richiesta, quella misura semplicemente non esiste. Ingrandire non
       aggiunge dettaglio, aggiunge solo byte. */
    if (Math.max(larghezza, altezza) < misura && misura !== MISURE[0]) continue

    if (await daRifare(sorgente, uscita)) {
      await sharp(sorgente, { failOn: 'error' })
        .rotate()
        .resize({ width: misura, height: misura, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITA, effort: 5 })
        .toFile(uscita)
      fatte.push(misura)
    }
  }

  if (fatte.length > 0) {
    console.log(`  ${nomeFile} -> ${base} (${fatte.join(', ')} px)`)
  }

  /* Le misure DAVVERO presenti su disco, non quelle che avremmo voluto: se
     l'originale era piccolo, alcune sono state saltate e il componente non
     deve metterle nel srcset. */
  const disponibili = []
  for (const misura of misure) {
    try {
      await stat(join(cartellaUscita, `${base}-${misura}.webp`))
      disponibili.push(misura)
    } catch {
      /* non generata */
    }
  }

  return {
    base,
    larghezza,
    altezza,
    misure: disponibili,
  }
}

/** Il testo alternativo non si puo' inventare: resta vuoto finche' non lo scrivi. */
function vocePerManifesto(scatto, slug) {
  return {
    id: `${slug}/${scatto.base}`,
    base: scatto.base,
    w: scatto.larghezza,
    h: scatto.altezza,
    misure: scatto.misure,
    alt: '',
  }
}

async function main() {
  const slugs = await cartelle(ORIGINALI)

  if (slugs.length === 0) {
    console.log('Nessuna cartella in foto-originali/.')
    console.log('')
    console.log('  mkdir -p foto-originali/torino-connect-vol1')
    console.log('  (copiaci dentro gli scatti)')
    console.log('  npm run foto')
    console.log('')
    return
  }

  const gallerie = {}
  let totale = 0

  for (const slug of slugs) {
    const cartella = join(ORIGINALI, slug)
    const nomi = await scatti(cartella)

    if (nomi.length === 0) {
      console.warn(`${slug}: cartella vuota, la salto.`)
      continue
    }

    console.log(`${slug}: ${nomi.length} scatti`)
    await mkdir(join(USCITA, slug), { recursive: true })

    /* La copertina e' il file che si chiama "copertina", altrimenti il primo
       in ordine. Nominare gli scatti 01-, 02-, ... e' il modo piu' semplice
       per decidere l'ordine della galleria. */
    const indiceCopertina = Math.max(
      0,
      nomi.findIndex((n) => ripulisci(n.replace(extname(n), '')).startsWith('copertina')),
    )

    const voci = []
    let baseCopertina = null
    for (let i = 0; i < nomi.length; i += 1) {
      const eCopertina = i === indiceCopertina
      const scatto = await preparaScatto(slug, nomi[i], i, eCopertina)
      if (!scatto) continue
      /* La copertina si segna per NOME e non per posizione: se uno scatto
         precedente e' stato scartato perche' illeggibile, gli indici di nomi
         e di voci non coincidono piu' e la copertina finirebbe sulla foto
         sbagliata. */
      if (eCopertina) baseCopertina = scatto.base
      voci.push(vocePerManifesto(scatto, slug))
    }

    if (voci.length === 0) {
      console.warn(`${slug}: nessuno scatto valido, la salto.`)
      continue
    }

    gallerie[slug] = {
      copertina: baseCopertina ?? voci[0].base,
      scatti: voci,
    }
    totale += voci.length
  }

  /* Il manifesto VA committato: il sito lo importa al build, e la CI non ha
     le foto originali per rigenerarlo. */
  await mkdir(dirname(MANIFESTO), { recursive: true })
  const testo = `${JSON.stringify(gallerie, null, 2)}\n`

  let uguale = false
  try {
    uguale = createHash('sha1').update(await readFile(MANIFESTO)).digest('hex') ===
      createHash('sha1').update(testo).digest('hex')
  } catch {
    /* non esisteva */
  }

  if (!uguale) await writeFile(MANIFESTO, testo)

  console.log('')
  console.log(`${Object.keys(gallerie).length} gallerie, ${totale} foto.`)
  console.log(uguale ? 'Il manifesto era gia\' aggiornato.' : `Scritto ${MANIFESTO.replace(RADICE + '/', '')}.`)
  console.log('')
  console.log('Ora manca solo il testo alternativo: apri il manifesto e riempi i campi "alt".')
  console.log('Servono a chi non vede le foto, e Google li legge.')
}

main().catch((e) => {
  console.error('[YET] La preparazione delle foto e\' fallita.')
  console.error(e)
  process.exit(1)
})
