/**
 * English dictionary. Keys are the Italian source strings.
 *
 * WHY THE KEYS LOOK LIKE THIS: see the long note at the top of
 * `src/lib/i18n.jsx`. In short, a missing entry falls back to Italian instead
 * of printing something like `home.cta.primary` on the page, which means the
 * site is never broken while translation is incomplete.
 *
 * TWO RULES WHEN ADDING ENTRIES.
 *
 * 1. Copy the Italian string EXACTLY, apostrophes included. YET's copy uses
 *    the typographic apostrophe (’, U+2019) and not the straight one, so
 *    `l'accesso` and `l’accesso` are different keys and only one of them will
 *    match. This is the single most likely reason a translation silently
 *    fails to appear.
 *
 * 2. Translate the MEANING, not the words. This copy was written to sound
 *    like a person, and a literal translation makes it sound like a machine,
 *    which is exactly what we spent this whole project avoiding.
 *
 * NOT TRANSLATED, on purpose:
 *  - the admin panel: four people use it, all Italian speakers;
 *  - bios, news and meetups: members wrote those, and putting a machine
 *    translation in their mouth would be worse than leaving them as they are.
 */

export const EN = {
  /* ---------------------------------------------------------------------
     Navigation and shell
     ------------------------------------------------------------------ */
  Home: 'Home',
  Vetrina: 'Members',
  Eventi: 'Events',
  Join: 'Join',
  Contatti: 'Contact',
  Brand: 'Brand',
  Sponsor: 'Sponsors',
  Admin: 'Admin',

  Accedi: 'Sign in',
  'Attendi…': 'One moment…',
  Esci: 'Sign out',
  'Il mio profilo': 'My profile',
  'Vai al contenuto': 'Skip to content',
  'Apri il menu': 'Open menu',
  'Chiudi il menu': 'Close menu',
  'YET, vai alla home': 'YET, go to the homepage',
  'Navigazione principale': 'Main navigation',
  'Dove trovarci': 'Find us',
  'Il sito': 'This site',
  Informative: 'Legal',
  Privacy: 'Privacy',
  Cookie: 'Cookies',
  'Canali social': 'Social channels',
  'Pagine del sito': 'Site pages',
  ' (si apre in una nuova scheda)': ' (opens in a new tab)',

  /* ---------------------------------------------------------------------
     Home and hero
     ------------------------------------------------------------------ */
  'Entra in YET': 'Join YET',
  'Guarda gli eventi': 'See the events',
  Notizie: 'News',
  'Ancora nessuna notizia': 'No news yet',
  'persone stanno costruendo con noi': 'people are building with us',
  'persona sta costruendo con noi': 'person is building with us',
  'Leggi tutto': 'Read more',
  'Mostra meno': 'Show less',
  'In evidenza': 'Featured',
  notizia: 'item',
  notizie: 'items',

  'Non riusciamo a caricare le notizie': 'We can’t load the news',
  'Il server ha rifiutato la lettura: le regole Firestore non sono ancora state pubblicate, oppure quelle pubblicate sono più vecchie del sito.':
    'The server refused the request: the Firestore rules haven’t been published yet, or the published ones are older than the site.',
  'Firestore chiede un indice per questa ricerca. Nella console del browser c’è un link che lo crea con un clic.':
    'Firestore needs an index for this query. There’s a one-click link in the browser console that creates it.',
  'Non riusciamo a raggiungere il server. Di solito è la connessione: riprova fra un momento.':
    'We can’t reach the server. It’s usually the connection: try again in a moment.',
  'Qualcosa è andato storto nel leggere il feed. Il dettaglio è nella console del browser.':
    'Something went wrong loading the feed. The details are in the browser console.',
  Riprova: 'Try again',

  /* ---------------------------------------------------------------------
     Members / Vetrina
     ------------------------------------------------------------------ */
  'La community': 'The community',
  Membri: 'Members',
  'Chi organizza': 'Who runs it',
  'I membri': 'The members',
  'Il tuo profilo': 'Your profile',
  Organizza: 'Organiser',
  'Mostra tutto': 'Show all',
  profilo: 'profile',
  profili: 'profiles',
  'Ancora nessun profilo': 'No profiles yet',
  'Non riusciamo a caricare i profili': 'We can’t load the profiles',
  'Elenco non disponibile': 'List unavailable',
  'Tengono in piedi la community e pubblicano le notizie del sito.':
    'They keep the community running and publish what you read here.',

  /* ---------------------------------------------------------------------
     Events
     ------------------------------------------------------------------ */
  'Cosa succede': 'What’s on',
  'In arrivo': 'Coming up',
  'Già fatti': 'Past events',
  Iscriviti: 'Sign up',
  'data da definire': 'date to be confirmed',
  'in pubblicazione': 'publishing',

  /* ---------------------------------------------------------------------
     Join
     ------------------------------------------------------------------ */
  'Unisciti al club': 'Join the club',
  'Accedi con Google': 'Sign in with Google',
  'Chi siamo': 'Who we are',
  'Per chi': 'Who it’s for',
  'Cosa si fa': 'What we do',
  'Come si entra': 'How to join',
  'Se non hai ancora niente': 'If you haven’t started anything yet',

  'Il mio nome': 'My name',
  'Da dove scrivi': 'Where you’re based',
  Bio: 'Bio',
  'Foto profilo': 'Profile photo',
  'Carica una foto': 'Upload a photo',
  Togli: 'Remove',
  'Salva le modifiche': 'Save changes',
  'Crea il mio profilo': 'Create my profile',
  'Vedi il tuo profilo tra i membri': 'See your profile in Members',
  'Salvataggio…': 'Saving…',
  'Cancellare il profilo': 'Delete your profile',
  'Cancella il mio profilo': 'Delete my profile',
  'Sicuro? Non si torna indietro.': 'Are you sure? This can’t be undone.',
  'Sì, cancella tutto': 'Yes, delete everything',
  'No, torna indietro': 'No, go back',
  'Cancellazione…': 'Deleting…',
  'Facoltativo. Se lo lasci vuoto usiamo le tue iniziali.':
    'Optional. Leave it empty and we’ll use your initials.',

  'Richiesta inviata — in attesa di approvazione': 'Request sent, waiting for approval',
  'Richiesta inviata, in attesa di approvazione': 'Request sent, waiting for approval',
  'Richiesta non approvata': 'Request not approved',

  /* ---------------------------------------------------------------------
     Contact
     ------------------------------------------------------------------ */
  Copia: 'Copy',
  Copiato: 'Copied',
  'Scrivici una mail': 'Email us',
  'Dove siamo': 'Where we are',

  /* ---------------------------------------------------------------------
     Sponsors and brand
     ------------------------------------------------------------------ */
  'Chi ci sostiene': 'Who supports us',
  'Il marchio': 'The brand',
  'Il logo': 'The logo',
  'I colori': 'The colours',
  'Il carattere': 'The typeface',
  'Cosa non fare': 'What not to do',
  Scarica: 'Download',

  /* ---------------------------------------------------------------------
     Sign-in errors. These are the strings a foreigner is most likely to
     hit and least able to guess at, so they matter more than the marketing
     copy.
     ------------------------------------------------------------------ */
  'Accesso annullato: la finestra di Google è stata chiusa.':
    'Sign-in cancelled: the Google window was closed.',
  'Nessuna connessione con Google. Controlla la rete e riprova.':
    'Couldn’t reach Google. Check your connection and try again.',
  'Troppi tentativi ravvicinati. Aspetta qualche minuto e riprova.':
    'Too many attempts in a row. Wait a few minutes and try again.',
  'Accesso non riuscito. Riprova fra poco.': 'Sign-in failed. Please try again shortly.',

  /* ---------------------------------------------------------------------
     Empty and loading states
     ------------------------------------------------------------------ */
  'Caricamento…': 'Loading…',
  'Sto controllando i permessi…': 'Checking your permissions…',
  'Area riservata': 'Restricted area',
  'Non hai i permessi': 'You don’t have access',
  'Torna alla home': 'Back to the homepage',
}
