/**
 * ENGLISH catalogue.
 *
 * Italian (it.js) is the reference language: a key is born there and then
 * translated here. If a key is missing here, `t()` falls back to the Italian
 * string instead of printing the key name (see lib/i18n.jsx), so a forgotten
 * translation degrades into "an Italian sentence inside the English page"
 * rather than a visible defect.
 *
 * Same rules as it.js: no HTML inside the strings, placeholders are {name},
 * and both catalogues must carry the SAME keys. Checked by
 * `node scripts/i18n-check.mjs`.
 *
 * A note on tone. The Italian copy of this site talks to a sixteen-year-old
 * without talking down to them: short sentences, concrete words, no startup
 * jargon. The English keeps that, which is why it is not a literal
 * translation everywhere: "conta l'attitudine, non il progetto già avviato"
 * becomes "what counts is the attitude, not a project that is already
 * running", because the literal "started project" says nothing in English.
 */

export default {
  lingua: {
    etichetta: 'Language',
    scegli: 'Choose the language',
    it: 'Italian',
    en: 'English',
  },

  /* --- navigation ------------------------------------------------------- */
  nav: {
    home: 'Home',
    vetrina: 'Members',
    eventi: 'Events',
    join: 'Join',
    contatti: 'Contact',
    brand: 'Brand',
    sponsor: 'Sponsor',
    admin: 'Admin',
    principale: 'Main navigation',
    vaiAllaHome: 'YET, go to the home page',
    apriMenu: 'Open the menu',
    chiudiMenu: 'Close the menu',
    accedi: 'Sign in',
    attendi: 'Wait…',
    menuUtente: 'User menu, {nome}',
    ilTuoProfilo: 'Your profile',
    esci: 'Sign out',
    vaiAlContenuto: 'Skip to content',
  },

  /* --- footer ----------------------------------------------------------- */
  footer: {
    doveTrovarci: 'Where to find us',
    ilSito: 'The site',
    canaliSocial: 'Social channels',
    pagineDelSito: 'Site pages',
    informative: 'Legal',
    privacy: 'Privacy',
    cookie: 'Cookies',
    brandIdentity: 'Brand identity',
    nuovaScheda: ' (opens in a new tab)',
  },

  /* --- the club, in words ----------------------------------------------- */
  community: {
    tagline: 'Build ambition.',
    fasciaEta: '16 to 23',
    citta: 'Turin',
    raggio: 'all of Italy',
    reach: 'First events in Turin, the goal is all of Italy',
    descrizioneBreve:
      'The club for young people building something. Even if you have nothing in your hands yet: what counts is the attitude, not a project that is already running.',
    descrizione:
      'YET, Young Entrepreneurs Together, is the club for young people building something: a product, an association, a project, an idea that is still unclear. And if you have nothing in your hands yet, that is fine too: what we look for is the attitude, not a project that is already running. The first events will be in Turin, but the goal is to spread across all of Italy. No selection, no membership fee.',
  },

  /* --- channels --------------------------------------------------------- */
  socials: {
    linkedin: { label: 'LinkedIn', handle: 'YET Club' },
    instagram: { label: 'Instagram', handle: '@yet.community' },
    whatsapp: { label: 'WhatsApp group', handle: 'Join the community chat' },
    email: { label: 'Write to us', handle: '{email}' },
  },

  /* --- opening ---------------------------------------------------------- */
  hero: {
    entra: 'Join YET',
    eventi: 'See the events',
    meta: 'Ages {eta}',
  },

  /* --- home ------------------------------------------------------------- */
  home: {
    contatorePersona: 'person is building with us',
    contatorePersone: 'people are building with us',
    notizie: 'News',
    unaNotizia: 'story',
    tanteNotizie: 'stories',
    caricamento: 'Loading the news.',
    caricate: '{n} stories loaded.',
    nessunaAncora: 'There is no news yet.',
    erroreTitolo: 'We cannot load the news',
    vuotoTitolo: 'No news yet',
    vuotoTesto:
      'Meetups, projects and everything that happens in the community will end up here. In the meantime you can already introduce yourself.',
    nonCollegateTitolo: 'The news feed is not connected',
    nonCollegateTesto1:
      'The Firebase configuration is missing, so the feed cannot load. This is not a fault of the site: it is the step left over from the first install.',
    nonCollegateTesto2a: 'Copy',
    nonCollegateTesto2b: 'to',
    nonCollegateTesto2c: ', fill in the six keys from the Firebase console and restart',
    nonCollegateTesto2d: '. The details are in the README.',
  },

  /* --- group invite ----------------------------------------------------- */
  whatsapp: {
    eyebrow: 'Where things actually happen',
    titolo: 'The WhatsApp group',
    testo:
      'That is where we organise between one meetup and the next: you ask for a hand, you show where you have got to, you agree on when to meet. The site tells you what we do, the group is where we do it. You are in straight away, no approval to wait for.',
    bottone: 'Join the group',
    srSuffisso: ', the YET WhatsApp group (opens in a new tab)',
  },

  /* --- shared states ---------------------------------------------------- */
  stati: {
    riprova: 'Try again',
    nuovaScheda: ' (opens in a new tab)',
    dimensionePiena: ' (open full size in a new tab)',
    leggiTutto: 'Read more',
    mostraMeno: 'Show less',
    inEvidenza: 'Featured',
    inPubblicazione: 'publishing',
    caricamento: 'Loading…',
    lancette: 'illustration, clock hands',
    membro: 'Member',
  },

  /* --- intro ------------------------------------------------------------ */
  intro: {
    skip: 'Skip',
    entra: 'Enter',
    animazione: 'YET logo animation',
    logo: 'The YET logo',
  },

  /* --- server errors ----------------------------------------------------- */
  errori: {
    regoleVecchie:
      'The server refused the read: the Firestore rules have not been published yet, or the published ones are older than the site.',
    indiceMancante:
      'Firestore needs an index for this query. The browser console has a link that creates it in one click.',
    serverGiu: 'We cannot reach the server. It is usually the connection: try again in a moment.',
    generico: 'Something went wrong. The details are in the browser console.',

    immagineIlleggibile: 'I cannot read this image. The file may be damaged.',
    immagineTroppoPesante:
      'I cannot get this image under {peso} without ruining it. Try a less complex one, or upload it elsewhere and attach its address here.',
    fileTroppoPesante:
      'This file weighs {peso} and without Firebase Storage the maximum is about {massimo}. Upload it to Drive and attach its address here.',
    fileTroppoGrande: 'The file is too large to be stored inside the news item.',
    fileIlleggibile: 'I cannot read the file.',
    avatarNonComprimibile: 'I cannot compress this photo enough. Try another one.',
    fotoTroppoGrande: 'The profile photo is too large. Upload a smaller one.',
    rientraPerCancellare:
      'Your profile has been deleted. To remove the sign-in account too, sign back in with Google and repeat the operation within a few minutes: for safety, Firebase does not delete an account with an old sign-in.',
  },

  /* --- meetups ----------------------------------------------------------- */
  incontri: {
    prossimi: 'Next meetups',
    titolo: 'Meetups',
    giaFatti: 'Already happened',
    iscriviti: 'Sign up',
    dataDaDefinire: 'date to be confirmed',
  },

  /* --- deleting the profile ---------------------------------------------- */
  cancella: {
    titolo: 'Deleting your profile',
    testo:
      'This removes your profile from the members list and your sign-in account. It is permanent: name, bio, photo and links disappear and cannot be recovered.',
    bottone: 'Delete my profile',
    gruppo: 'Confirm the deletion',
    domanda: 'Sure? There is no going back.',
    inCorso: 'Deleting…',
    conferma: 'Yes, delete everything',
    annulla: 'No, go back',
    errore: 'We could not complete the deletion.',
  },

  /* --- the admin gate ---------------------------------------------------- */
  gate: {
    controllo: 'Checking your permissions…',
    riservataTitolo: 'Restricted area',
    riservataTesto:
      'This page is for publishing the site news. Sign in with your YET account to continue.',
    accediGoogle: 'Sign in with Google',
    nonAdminTitolo: 'You do not have permission',
    nonAdminTesto:
      'You are signed in as {email}, which is not one of the community administrators. If you think this is a mistake, write to whoever runs the site.',
    nonAdminDove1: 'The list is in',
    nonAdminDove2: 'and, above all, in',
    tornaHome: 'Back to the home page',
  },

  /* --- a member's social links ------------------------------------------- */
  social: {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    sito: 'Website',
    aria: '{nome} on {social} (opens in a new tab)',
  },

  /* --- members ----------------------------------------------------------- */
  vetrina: {
    eyebrow: 'The community',
    titolo: 'Members',
    lead:
      'The people building something inside YET: students, self-taught makers, first-time founders, from Turin and from the rest of Italy.',
    leadSecond: 'Open a profile to read the full introduction and find the contacts.',
    contatoreUno: 'person in the community',
    contatoreTanti: 'people in the community',
    nomeRipiego: 'YET member',
    tuoProfilo: 'Your profile',
    organizza: 'Organiser',
    bioVuota: 'Bio coming soon - {nome} has not introduced themselves yet.',
    leggiProfilo: 'Read the profile',
    liveCaricamento: 'Loading the profiles.',
    liveErrore: 'The profiles could not be loaded.',
    liveCaricatoUno: '{n} profile loaded.',
    liveCaricatiTanti: '{n} profiles loaded.',
    spentoTitolo: 'List not available',
    spentoTesto:
      'This copy of the site has no Firebase keys configured, so the profiles cannot be loaded. The rest of the site works normally.',
    erroreTitolo: 'We cannot load the profiles',
    errorePermessi:
      'The server refused to return the list. Try again, and if it keeps happening write to us.',
    erroreGenerico: 'Something went wrong while reading the members list. It may be the connection.',
    vuotoTitolo: 'No profiles yet',
    vuotoTesto:
      'Nobody has introduced themselves yet. You can be the first: join, sign in and write a couple of lines about what you are building.',
    chiOrganizza: 'Who runs it',
    chiOrganizzaNota: 'They keep the community running and publish the news on the site.',
    iMembri: 'The members',
    laCommunity: 'The community',
    profiloUno: 'profile',
    profiliTanti: 'profiles',
  },

  /* --- a single profile page --------------------------------------------- */
  profilo: {
    caricamento: 'Loading the profile.',
    nonTrovatoTitolo: 'This profile is not here',
    nonTrovatoTesto:
      'It may have been deleted, or the link is incomplete. The list of who is here now is in the members page.',
    tornaVetrina: 'Back to the members',
    vetrina: 'Members',
    spentoTitolo: 'Profile not available',
    spentoTesto:
      'The Firebase configuration is missing, so profiles cannot be read. This is not a fault of the site: it is the step left over from the first install, and the README explains it.',
    erroreTitolo: 'I cannot read this profile',
    erroreTesto: 'Try again shortly.',
    attesaTitolo: 'This profile is not public yet.',
    attesaTesto:
      'You can see it because it is yours, or because you run the community. It will show up in the members page as soon as it is approved.',
    nelClubDal: 'In the club since {data}',
    modifica: 'Edit the profile',
    chiSono: 'About me',
    presentazioneVuota: '{nome} has not written an introduction yet.',
    doveTrovarlo: 'Where to find them',
    project: 'What I am building',
    looking: 'What I am looking for',
    skills: 'What I can do',
  },

  /* --- browser tab title ------------------------------------------------- */
  titoli: {
    eventi: 'Events · YET',
    contatti: 'Contact · YET',
    brand: 'Brand · YET',
    sponsor: 'Sponsor · YET',
    privacy: 'Privacy · YET',
    cookie: 'Cookies · YET',
  },

  /* --- events ------------------------------------------------------------ */
  eventi: {
    eyebrow: 'Events',
    titolo: 'What is happening',
    lead:
      'Meetups, announcements and things we are building. The first events will be in Turin, but the goal is to run them all over Italy: if you want to organise one where you are, write to us.',
    liveCaricamento: 'Loading the events.',
    liveCaricati: '{n} events loaded.',
    liveVuoto: 'There are no events yet.',
    spentoTitolo: 'The events are not connected',
    spentoTesto:
      'The Firebase configuration is missing. This is not a fault of the site: it is the step left over from the first install, and the README explains it.',
    erroreTitolo: 'We cannot load the events',
    vuotoTitolo: 'No events yet',
    vuotoTesto: 'We are organising the first one. Join and you will know before anyone else.',
    unoEvento: 'event',
    tantiEventi: 'events',
  },

  /* --- contact ----------------------------------------------------------- */
  contatti: {
    eyebrow: 'Contact',
    titolo1: 'Let us talk.',
    titolo2: 'Pick a channel.',
    lead:
      'An idea to build, a question, or just curiosity: here is every way to reach us. We answer as soon as we can.',
    mailTitolo: 'Send us an email',
    copia: 'Copy',
    copiaAria: 'Copy the address {email}',
    copiato: 'Address copied to the clipboard.',
    copiaFallita:
      'We could not copy it automatically: the address is selected, use Ctrl+C (⌘+C on a Mac).',
    mailMancante:
      'The address is not configured. In the meantime, write to us on one of the channels below.',
    doveCiTrovi: 'Where to find us',
    nessunCanaleTitolo: 'No public channel yet',
    nessunCanaleTesto:
      'We are still setting up our profiles. In the meantime the email above works perfectly.',
    doveSiamo: 'Where we are',
    partenza: 'We start from {citta} and we are heading across Italy',
    raggio:
      'The first events will be in {citta}, but the goal is to spread across all of Italy: if you live in Palermo or in Udine, you can find people from your own city and help run events right where you are.',
    caffe: 'And of course: if you are passing through {citta}, write to us and we will grab a coffee.',
  },

  /* --- brand identity ---------------------------------------------------- */
  brand: {
    eyebrow: 'Brand identity',
    titolo: 'The mark',
    lead:
      'If you need to put {nome} on a poster, a slide or a post, the files and the rules are here. It exists to avoid the fate of every association logo: seven different versions going around, none of them right.',
    logoTitolo: 'The logo',
    logoChiaroAlt: 'The YET logo, light version',
    logoScuroAlt: 'The YET logo, dark version',
    logoChiaro: 'Light version, for dark backgrounds',
    logoScuro: 'Dark version, for light backgrounds',
    scarica: 'Download PNG',
    logoNota:
      'The mark is an image, not a piece of type: never rebuild it by writing “YET” in whatever font is at hand. The final letter is made of two strokes, and those strokes are the symbol.',
    lancetteTitolo: 'The clock hands',
    lancetteAlt: 'The two hands of the YET mark: a coral arrow and a diagonal bar',
    lancetteNota1:
      'The final letter of the mark is made of two strokes that look like the hands of a clock. On their own they become a reusable graphic element: dividers between sections, decoration, an icon.',
    lancetteNota2: 'They can be rotated and scaled. They are never distorted and never recoloured.',
    coloriTitolo: 'The colours',
    coloriNota:
      'Three, and that is enough. The contrast ratios below are computed with the WCAG formula, not estimated by eye: they tell you when a colour can carry text and when it cannot.',
    copiaColore: 'Copy the colour code {hex}',
    copiato: 'Copied',
    copiatoLive: '{hex} copied to the clipboard.',
    copiaErroreLive: 'I cannot copy it. Select it by hand.',
    copiaErrore: 'The browser will not let me copy. Select it by hand, it is {hex} and similar.',
    colori: {
      coral: {
        nome: 'Coral',
        ruolo: 'The accent. The arrow of the mark, the details, one element per screen.',
        nota: 'On a dark background it is 4.2:1. Fine for headings and icons, not for small text.',
      },
      beige: {
        nome: 'Beige',
        ruolo: 'The background of print and the text on the dark site. It is the colour you see most.',
        nota: 'On the warm black it is 16.3:1, the top of the scale.',
      },
      nero: {
        nome: 'Warm black',
        ruolo: 'The text in print, the background of the site. Not pure black: it leans brown.',
        nota: 'Absolute black (#000) next to the beige looks like a hole: do not use it.',
      },
    },
    carattereTitolo: 'The typeface',
    carattereNota1:
      'One typeface for everything. Headings in Extrabold (800), body in Regular (400), labels and buttons in Semibold (600). It is free and you can download it from',
    regoleTitolo: 'Do and do not',
    si: 'Do',
    no: 'Do not',
    regole: {
      spazio: {
        si: 'Let the mark breathe: at least the height of the “Y” of empty space all around it.',
        no: 'Do not squeeze it between other elements.',
      },
      versione: {
        si: 'Use the light version on dark backgrounds and the dark one on light backgrounds.',
        no: 'Do not put the dark one on a dark photo: the black part disappears and an arrow is left hanging.',
      },
      scala: {
        si: 'Scale it keeping the proportions.',
        no: 'Do not stretch it, do not squash it, do not tilt it.',
      },
      mono: {
        si: 'If you need it in one colour, use solid beige or solid black.',
        no: 'Do not recolour it, and do not make the arrow any colour other than the coral.',
      },
    },
  },

  /* --- sponsor ----------------------------------------------------------- */
  sponsor: {
    eyebrow: 'Sponsor',
    titolo: 'Who supports us',
    lead:
      '{nome} has no membership fee: joining costs nothing. What it takes to run an event (a room, lunch, materials) comes from the people who decide to give us a hand.',
    chiCe: 'Who is here',
    liveCaricamento: 'Loading the sponsors.',
    liveCaricati: '{n} sponsors loaded.',
    erroreTitolo: 'We cannot load the sponsors',
    errorePermessi:
      'The server refused the read: the published Firestore rules are older than the site.',
    vuotoTitolo: 'No sponsors yet',
    vuotoTesto:
      'We are just starting. If you want to be the first, the spot is free and it shows.',
    apreSito: '{nome}, opens the website in a new tab',
    cosaOffriamo: 'What we offer',
    offerta: {
      visibilita: {
        titolo: 'Visibility where it counts',
        testo:
          'Your logo on this page, on the event materials and in the posts that tell the story. Not a banner at the bottom of a page nobody opens.',
      },
      accesso: {
        titolo: 'Direct access',
        testo:
          'People between 16 and 23 who are already building something. If you are looking for interns, collaborators or simply sharp people, they are here.',
      },
      evento: {
        titolo: 'An event of your own',
        testo:
          'You can host a meetup, bring a real problem to solve, or tell the story of how you built your company. It works better than any logo.',
      },
    },
    parliamone: 'Let us talk',
    parliamoneTesto:
      'We have no price list and we will not send you a twenty-slide deck. Write to us about what you do and what interests you, and we will tell you whether it makes sense.',
    scriviciA: 'Write to us at {email}',
    altriCanali: 'The other channels',
  },

  /* --- join: the entry page and your own profile -------------------------- */
  join: {
    titolo: 'Join the club',
    liveControllo: 'Checking whether you are already signed in.',
    configTitolo: 'Firebase is not configured.',
    configTesto1: 'The',
    configTesto2:
      'variables have not been set, so signing in and saving cannot work. The rest of the site browses normally.',
    punti: {
      chiSiamo: { titolo: 'Who we are' },
      perChi: {
        titolo: 'Who it is for',
        testo:
          'From {eta} years old, from all over Italy. The first events will be in {citta}, but the goal is to spread out: if you live in Palermo or in Udine you can find people from your own city and help run events right where you are.',
      },
      cosaSiFa: {
        titolo: 'What we do',
        testo:
          'Everyone brings their own project and shows what has changed since last time. Awkward questions get asked, hands get lent, and you find the person who has already solved your problem.',
      },
      comeSiEntra: {
        titolo: 'How to get in',
        testo:
          'Sign in with Google and write a couple of lines about yourself. The request reaches the organisers and, as soon as it is approved, you show up among the members. There is no membership fee: the step only exists to keep fake accounts out.',
      },
      seNonHai: {
        titolo: 'If you have nothing yet',
        testo:
          'That is fine too. You do not need a running project, or even a clear idea: what we look for is the attitude. If you feel like building something and have no idea where to start, this is exactly the right place to be found.',
      },
    },
    aperturaGoogle: 'Opening the Google window…',
    inAppTitolo: 'You are in an app’s built-in browser.',
    inAppTesto:
      'Google does not allow signing in from here, for any site. Open this page in Safari or in Chrome (from the app menu, the “Open in browser” item) and signing in works.',
    ctaNota:
      'All you need is a Google account. No new passwords, no newsletter: we use your name, email and photo to list you among the members.',

    accesso: {
      popupChiuso: 'You closed the Google window before finishing. You can try again whenever you like.',
      popupBloccato:
        'The browser blocked the Google window. Allow pop-ups for this site and try again, or open the site in Safari or Chrome.',
      inApp:
        'You are browsing inside another app (Instagram, LinkedIn or similar), and Google does not allow signing in from there. Open the site in Safari or in Chrome and try again.',
      rete: 'No connection, or an unstable one. Check the network and try again.',
      dominio: 'This address is not one of the authorised domains of the Firebase project.',
      nonAttivo: 'Google sign-in is not enabled yet on this Firebase project.',
      troppiTentativi: 'Too many attempts in a row. Wait a few minutes and try again.',
      nonConfigurato:
        'Firebase is not configured, so signing in is not available: copy .env.example to .env and restart the server.',
      generico: 'Sign-in failed. Try again in a moment.',
    },

    salvataggio: {
      permessi:
        'Firestore refused the save. Almost always this means the rules published on the database are older than the ones in the project: open the Firebase console → Firestore Database → Rules, paste the updated contents of firestore.rules and press Publish.',
      lento: 'Firestore did not answer in time. It is probably the connection: try again in a moment.',
      sessione: 'The session has expired. Sign out and back in with Google, then try again.',
      generico: 'Something went wrong while saving.',
    },

    form: {
      titolo: 'Your profile',
      lead:
        'This is what other people see on the members page. Two well-written lines are worth more than a CV.',
      chiSei: 'Who you are',
      obbligatorio: ' (required)',
      nome: 'Name and surname',
      nomeHint: 'How you want to be called. Just a first name is fine.',
      nomeErrore: 'A name is needed: it is the one you appear with among the members.',
      luogo: 'Where you are writing from',
      luogoHint:
        'The city or the area, not the street address. It shows that YET is not only a Turin thing, and it helps people near you find you. You can leave it empty.',
      bio: 'Introduce yourself',
      bioHint:
        'Take your time: the members page shows the first two lines, the rest is read by opening your profile. Line breaks are kept.',
      bioErrore: 'The bio is over {max} characters: remove {troppi}.',
      bioConteggio: '{n} characters out of {max} available',
      foto: 'Profile photo (link)',
      fotoNomeTu: 'You',
      caricaFoto: 'Upload a photo',
      preparoFoto: 'Preparing the photo…',
      togli: 'Remove',
      fotoCaricata:
        'Photo uploaded from your device, reduced to {peso}. Use “Remove” to pick another one or to go back to an address.',
      fotoHint:
        'Optional: if you leave it empty we use your initials. You can upload a photo from your device or paste the address of one already online. Uploaded photos are cropped square and shrunk to {peso}.',
      fotoErrore: 'The photo link has to start with http:// or https://.',
      fotoIncompleto: 'A complete address is needed, starting with http:// or https://.',
      fotoControllo: 'Checking the link…',
      fotoNonCarica:
        'I cannot load that image. Check the link, or leave it empty: the initials look perfectly good.',
      fotoNonUsabile: 'I cannot use this image.',
      cosaFai: 'What you do',
      cosaFaiHint:
        'All optional, and they are the ones that make the difference: anyone looking for a hand or a co-founder reads these three. They appear on your profile page.',
      project: 'What you are building',
      projectHint:
        'The project, the product, the idea. Even if it has just started, or is still fuzzy: writing what it is right now is worth more than a perfect description.',
      looking: 'What you are looking for',
      lookingHint:
        'A hand with something, a co-founder, someone who has already solved your problem, or just two honest opinions. Asking is the reason the club exists.',
      skills: 'What you can do',
      skillsHint:
        'The things other people can ask you about. No job title needed: “I edit video”, “my English is good”, “I can build a website”.',
      doveTrovarti: 'Where to find you',
      doveTrovartiHint:
        'All optional. They are for the people who see your project and want to write to you.',
      altro: 'Other',
      linkedinPlaceholder: 'https://www.linkedin.com/in/yourname',
      instagramPlaceholder: '@username',
      altroPlaceholder: 'https://mysite.com, or GitHub, or TikTok',
      salva: 'Save the changes',
      crea: 'Create my profile',
      inCorso: 'Saving…',
      vediComeTiVedono: 'See what they see',
      statoSalvando: 'Saving the profile…',
      statoSalvato: 'Profile saved. You now appear among the members.',
      statoSalvatoInAttesa:
        'Profile saved. It will show up on the members page as soon as the organisers approve the request: until then only you can see it.',
      statoSalvatoRifiutato:
        'Profile saved. Right now your profile is not published on the members page: your changes are kept.',
      statoErrore: 'Saving failed. {dettaglio}',
      attesaTitolo: 'Request sent, waiting for approval',
      attesaTesto:
        'Your profile has reached the organisers. Until they approve it, it does not appear among the members and nobody else can see it: you can still edit it whenever you like from this page, and the changes are kept.',
      rifiutataTitolo: 'Request not approved',
      rifiutataTesto:
        'Right now your profile is not published among the members. If you think it is a mistake, or you want to understand why, write to us: the decision is not final and can be revisited.',
    },
  },

  /* --- restricted area: the newsroom -------------------------------------- */
  admin: {
    eyebrow: 'Restricted area',
    titolo: 'Newsroom',
    lead:
      'This is where the news that shows on the home page gets written. Drafts stay visible only on this page.',
    notaAdmin1: 'Administrators are set in',
    notaAdmin2: 'and',
    notaAdmin3:
      'the rules are the real protection. The first file only decides who sees this page; without the address in the rules allowlist every write is refused.',
    spento1: 'Firebase is not configured: the',
    spento2: 'variables are missing. Copy',
    spento3: 'to',
    spento4:
      'and restart the dev server. While the configuration is missing this page can neither read nor write anything.',

    errori: {
      permessi:
        'Firestore refused the write. Most likely your email is not in the firestore.rules allowlist: adding it to src/config/admins.js is not enough — that file only decides what is shown, the rules decide what can be written. Remember to publish the rules again after the change.',
      sessione: 'The session has expired. Sign out and back in, then try again.',
      rete: 'Firestore is not answering. Check the connection and try again.',
      sparita: 'The news item no longer exists: it may have been deleted by another admin.',
      generico: 'Unexpected error during the operation.',
      utenteAssente: 'User not available: reload the page and sign in again.',
    },

    nuovaNotizia: 'New news item',
    titoloCampo: 'Title',
    titoloObbligatorio: 'The title is required.',
    corpo: 'Body',
    corpoObbligatorio: 'The body of the news item is required.',
    corpoTroppoLungo: 'The body is over {max} characters: shorten it by {troppi}.',
    corpoHint: 'Line breaks are kept. No HTML: the text is shown exactly as it is.',
    allegati: 'Attachments',
    pubblicata: 'Published',
    pubblicataHint: 'If you leave it off the item stays a draft, visible only here.',
    salvaNotizia: 'Save the news item',
    salvataggio: 'Saving…',
    svuota: 'Clear',
    pubblicataOk: 'News item published: it is already visible on the site.',
    bozzaOk: 'Draft saved. It does not show on the site until you publish it from below.',

    tutteLeNotizie: 'All the news',
    unaNotizia: 'item',
    tanteNotizie: 'items',
    diCuiBozze: ', {n} of them drafts',
    caricamentoLive: 'Loading the news…',
    erroreLista: 'I cannot read the news',
    vuotoTitolo: 'No news yet',
    vuotoTesto:
      'Write the first one above: it will show up in this list and, once published, on the home page.',
    senzaTitolo: '(untitled)',
    bozza: 'Draft',
    autoreSconosciuto: 'unknown author',
    inPubblicazione: 'publishing…',
    salva: 'Save',
    annulla: 'Cancel',
    pubblico: 'Publishing…',
    nascondo: 'Hiding…',
    nascondi: 'Hide',
    pubblica: 'Publish',
    modifica: 'Edit',
    confermaEliminazione: 'Confirm the deletion of “{titolo}”?',
    sicuro: 'Sure?',
    elimino: 'Deleting…',
    siElimina: 'Yes, delete',
    no: 'No',
    elimina: 'Delete',
  },

  /* --- membership requests (inside /admin) -------------------------------- */
  richieste: {
    titolo: 'Membership requests',
    nessunaInAttesa: 'none waiting',
    inAttesa: '{n} waiting',
    intro:
      'People who join do not appear among the members until you approve them here. Rejecting deletes nothing and can be undone: the person still sees their own profile, but nobody else does.',
    erroreTitolo: 'I cannot read the requests',
    errorePermessi:
      'The server refused the read. Check that your email is in the allowlist inside firestore.rules and that the rules have been published.',
    erroreGenerico: 'Something went wrong. It may be the connection.',
    vuotoTitolo: 'No requests waiting',
    vuotoTesto:
      'When somebody joins they will show up here, and they will only get access once one of you has approved them.',
    senzaNome: 'No name',
    richiestaDel: 'Requested on {data}',
    senzaPresentazione: 'They have not written an introduction.',
    approva: 'Approve',
    approvo: 'Approving…',
    rifiuta: 'Reject',
    rifiuto: 'Rejecting…',
    scritturaRifiutata:
      'Refused by the server: your email is not in the allowlist inside firestore.rules, or the rules have not been published again after the last change.',
    operazioneFallita: 'The operation failed.',
  },

  /* --- managing the meetups (top of the Events page) ---------------------- */
  incontriAdmin: {
    titolo: 'Organise a meetup',
    chiudi: 'Close',
    nuovo: 'New meetup',
    intro:
      'A meetup is not a news item: it has a date and a place, it sits at the top until it is over, and then it drops down among the ones already held on its own. Only you organisers see this.',
    titoloCampo: 'Title',
    titoloPlaceholder: 'First meetup of September',
    quando: 'When',
    dove: 'Where',
    dovePlaceholder: 'Toolbox Coworking, via Agostino da Montefeltro 2, Turin',
    link: 'Sign-up link',
    facoltativo: '(optional)',
    diCosa: 'What it is about',
    diCosaPlaceholder:
      'Everyone brings their own project and shows what has changed since last time.',
    pubblicaSubito: 'Published right away',
    salva: 'Save the meetup',
    salvataggio: 'Saving…',
    pubblicatoOk: 'Meetup published: it is already visible below.',
    bozzaOk: 'Draft saved. It does not show on the site until you publish it.',
    errorePermessi:
      'The server refused the write. Check that your email is in the allowlist inside firestore.rules and that the rules have been published again.',
    erroreGenerico: 'I could not save it.',
    bozza: 'Draft',
    giaFatto: 'Already held',
    nascondi: 'Hide',
    pubblica: 'Publish',
    elimina: 'Delete',
    sicuro: 'Sure?',
    si: 'Yes',
    no: 'No',
  },

  /* --- managing sponsors (inside /admin) ---------------------------------- */
  sponsorAdmin: {
    titolo: 'Sponsors',
    intro:
      'They show up on the Sponsor page. The order number decides who sits at the top: lower means higher. Ties go alphabetically.',
    nome: 'Name',
    sito: 'Website',
    facoltativo: '(optional)',
    nota: 'Note',
    notaSpiegazione: '(one line under the logo)',
    notaPlaceholder: 'Venue of the first meetup',
    ordine: 'Order',
    ordineVoce: 'order {n}',
    togli: 'Remove',
    caricaLogo: 'Upload the logo',
    preparoLogo: 'Preparing the logo…',
    salvo: 'Saving…',
    aggiungi: 'Add sponsor',
    vuoto: 'No sponsors yet.',
    eliminaAria: 'Delete the sponsor {nome}',
    elimina: 'Delete',
    sicuroSi: 'Sure? Yes',
    no: 'No',
    erroreLettura: 'I cannot read the sponsors.',
    formatoLogo: 'The logo has to be a JPEG, PNG, WebP or AVIF image.',
    erroreLogo: 'The logo upload failed.',
    nomeObbligatorio: 'The name is required.',
    errorePermessi:
      'Refused by the server: the published rules do not know the “sponsors” collection yet. Publish firestore.rules again.',
    erroreSalvataggio: 'Saving failed.',
    erroreEliminazione: 'The deletion failed.',
  },

  /* --- attachments of a news item (inside /admin) ------------------------- */
  allegati: {
    hint:
      'Upload a file from your device, or paste the address of something already online. Images are shown inside the news item, everything else as a list of links below the text.',
    fileCaricato: 'file uploaded to the site',
    trattaComeLink: 'Treat as a link',
    trattaComeImmagine: 'Treat as an image',
    togliAria: 'Remove the attachment {nome}',
    togli: 'Remove',
    indirizzo: 'Address',
    comeSiChiama: 'What it is called',
    facoltativo: '(optional)',
    nomePlaceholder: 'Flyer for the meetup',
    aggiungi: 'Add',
    caricaFile: 'Upload a photo or a file',
    comprimo: 'Compressing the image…',
    leggo: 'Reading the file…',
    salvo: 'Saving…',
    uploadHint:
      'Photos are shrunk and compressed here in the browser, up to {peso} each. You can upload as many as you like: each one is stored separately.',
    pieno: 'You have reached the maximum of {max} attachments. Remove one to add more.',
    urlNonValido:
      'An address starting with http:// or https:// is needed. Other kinds of link are not accepted.',
    urlVuoto: 'Paste an address.',
    doppione: 'This attachment is already there.',
    troppi: 'At most {max} attachments per news item.',
    tipoNonAmmesso:
      'File type not allowed ({tipo}). You can upload JPEG, PNG, WebP or AVIF images, or a PDF.',
    tipoSconosciuto: 'unknown',
    erroreCaricamento: 'The upload failed.',
  },
}
