/**
 * Gli eventi che hanno una pagina di resoconto.
 *
 * PERCHE' QUI E NON SU FIRESTORE
 *
 * Su Firestore, nella collection `meetups`, c'e' gia' l'elenco degli incontri,
 * e continua a servire: e' da li' che esce la lista dei PROSSIMI, che cambia
 * spesso e che gli admin devono poter aggiornare dal pannello senza toccare il
 * codice.
 *
 * Un resoconto e' un'altra cosa. E' archivio: una volta scritto non cambia
 * piu'. E soprattutto vive insieme alle foto, che stanno nel repo sotto
 * public/eventi/<slug>/. Tenere il testo qui accanto alle foto significa tre
 * cose concrete:
 *
 *   - la pagina si disegna prima ancora che Firebase risponda, quindi chi apre
 *     il link condiviso vede subito il titolo invece di uno scheletro;
 *   - il prerender puo' scrivere il titolo dentro l'HTML, quindi l'anteprima
 *     su WhatsApp e su LinkedIn funziona;
 *   - se un giorno Firestore e' irraggiungibile, o il browser lo blocca (e
 *     succede, vedi la voce sul CORS nel README), il resoconto si vede lo
 *     stesso.
 *
 * LA REGOLA, per non ritrovarsi due verita' diverse sullo stesso evento
 *
 * Quando un incontro finisce e ha le foto, il resoconto diventa la versione
 * buona e la scheda su Firestore va accorciata a due righe, perche' li' resta
 * solo per comparire nell'elenco. Il testo lungo con la scaletta oraria non
 * serve piu' a nessuno una volta che la serata e' passata.
 *
 * COME SE NE AGGIUNGE UNO
 *
 *   1. foto-originali/<slug>/  con dentro gli scatti, poi `npm run foto`
 *   2. una voce qui sotto con lo STESSO slug
 *   3. il testo alternativo delle foto in src/data/gallerie.json
 *
 * IL CAMPO meetupId
 *
 * E' l'identificativo del documento su Firestore, quello che si legge
 * nell'indirizzo quando apri l'incontro dal pannello admin. Serve a una cosa
 * sola: far comparire il link "guarda la serata" sotto l'incontro giusto
 * nell'elenco. Si lega per IDENTIFICATIVO e non per titolo perche' il titolo
 * qualcuno lo puo' correggere, e un legame che si rompe quando si sistema un
 * refuso non e' un legame. (E' successo davvero: su Firestore questo incontro
 * si chiama ancora "YET - Contact Vol.1", con Contact al posto di Connect.)
 * Se lo lasci null non succede niente di grave: il resoconto resta
 * raggiungibile dal suo indirizzo, solo non viene collegato dall'elenco.
 *
 * Lo slug e' anche l'indirizzo: /eventi/<slug>. Una volta pubblicato non si
 * cambia piu', o si rompono i link gia' condivisi.
 */

export const EVENTI = [
  {
    slug: 'torino-connect-vol1',
    meetupId: 'pKFEdJ5yRlmvVLlfZ5QC',
    titolo: 'YET Connect Vol.1',
    citta: 'Torino',
    /* ISO, e con l'ora: serve a Intl per scrivere "domenica 13 settembre". */
    data: '2026-09-13T17:30:00+02:00',
    luogo: 'Blox Space',
    indirizzo: 'Via Pietro Micca 21',
    /* Chi e' salito a parlare. E' la prova sociale piu' forte che avete: due
       realta' vere che hanno accettato di esserci. */
    ospiti: ['Blox Space', 'Enter Academy'],
    /* Quante persone c'erano. null finche' non lo sai: il riquadro sparisce,
       non mostra uno zero. Non inventarlo, e' il genere di numero che qualcuno
       poi controlla. */
    presenti: null,
    /* Chi ha scattato. Un oggetto e non una stringa: scrivere solo "@tizio" e
       ricavarne l'indirizzo vorrebbe dire dare per scontato che il prossimo
       fotografo stia su Instagram pure lui. null quando non lo sappiamo: la
       riga sparisce invece di uscire vuota. */
    fotografo: {
      nome: 'Pietro Gelati',
      handle: '@_pg_artworks_',
      url: 'https://www.instagram.com/_pg_artworks_/',
    },
    racconto: [
      'Il 13 settembre Blox Space ci ha aperto le porte per un pomeriggio riservato ai membri del club, dai 16 ai 23 anni.',
      'Si e’ partiti con il networking di apertura, per conoscersi prima di cominciare. Poi la presentazione di YET, gli interventi di Blox Space ed Enter Academy, e una sessione di domande aperta a tutti. Si e’ chiuso con l’aperitivo e il networking libero.',
    ],
  },
  {
    slug: 'roma-connect-vol1-1',
    meetupId: 'KjT7cFL8pytDugHYAnyJ',
    titolo: 'YET Connect Vol.1.1',
    citta: 'Roma',
    data: '2026-09-18T17:30:00+02:00',
    luogo: 'YellowBar',
    indirizzo: 'Via Palestro 51',
    ospiti: [],
    presenti: null,
    /* Non sappiamo ancora chi ha fotografato la serata di Roma. */
    fotografo: null,
    racconto: [
      'Il 18 settembre il primo incontro YET a Roma: un aperitivo per conoscersi di persona, confrontarsi sui progetti e incontrare altri della stessa eta’ che stanno costruendo qualcosa.',
    ],
  },
]

const PER_SLUG = new Map(EVENTI.map((e) => [e.slug, e]))
const PER_MEETUP = new Map(EVENTI.filter((e) => e.meetupId).map((e) => [e.meetupId, e]))

/** L'evento con questo slug, o null. */
export function eventoDiSlug(slug) {
  return PER_SLUG.get(String(slug ?? '')) ?? null
}

/** Il resoconto legato a un incontro di Firestore, o null. */
export function eventoDiMeetup(meetupId) {
  return PER_MEETUP.get(String(meetupId ?? '')) ?? null
}

/**
 * Gli eventi dal piu' recente al piu' vecchio.
 * L'ordine e' calcolato dalla data e non dall'ordine nel file, cosi' aggiungere
 * una voce in fondo non manda la cronologia a rovescio.
 */
export function eventiRecenti() {
  return [...EVENTI].sort((a, b) => String(b.data).localeCompare(String(a.data)))
}
