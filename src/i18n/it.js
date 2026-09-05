/**
 * Catalogo ITALIANO.
 *
 * E' la lingua di riferimento: una chiave nasce qui e poi si traduce in en.js.
 * Se manca in en.js, `t()` ricade su questa invece di mostrare il nome della
 * chiave (vedi lib/i18n.jsx), quindi una traduzione dimenticata degrada in
 * "una frase italiana in mezzo all'inglese" e non in un difetto visibile.
 *
 * REGOLE DI QUESTO FILE
 * - le chiavi seguono la struttura delle pagine: `join.form.bio.etichetta`;
 * - niente HTML dentro le stringhe. Se un paragrafo ha una parola in grassetto
 *   o un <code>, si spezza in piu' chiavi e il componente le ricompone: una
 *   stringa che contiene markup obbliga a dangerouslySetInnerHTML, e da quel
 *   momento ogni traduzione e' un posto in cui puo' entrare uno script;
 * - i segnaposto sono {nome} e vanno passati a t() come secondo argomento.
 *
 * Le due lingue devono avere le STESSE chiavi: lo verifica
 * `node scripts/i18n-check.mjs`.
 */

export default {
  lingua: {
    etichetta: 'Lingua',
    scegli: 'Scegli la lingua',
    it: 'Italiano',
    en: 'Inglese',
  },

  /* --- navigazione ------------------------------------------------------ */
  nav: {
    home: 'Home',
    vetrina: 'Vetrina',
    eventi: 'Eventi',
    join: 'Join',
    contatti: 'Contatti',
    brand: 'Brand',
    sponsor: 'Sponsor',
    admin: 'Admin',
    principale: 'Navigazione principale',
    vaiAllaHome: 'YET, vai alla home',
    apriMenu: 'Apri il menu',
    chiudiMenu: 'Chiudi il menu',
    accedi: 'Accedi',
    attendi: 'Attendi…',
    menuUtente: 'Menu utente, {nome}',
    ilTuoProfilo: 'Il tuo profilo',
    esci: 'Esci',
    vaiAlContenuto: 'Vai al contenuto',
  },

  /* --- fondo pagina ----------------------------------------------------- */
  footer: {
    doveTrovarci: 'Dove trovarci',
    ilSito: 'Il sito',
    canaliSocial: 'Canali social',
    pagineDelSito: 'Pagine del sito',
    informative: 'Informative',
    privacy: 'Privacy',
    cookie: 'Cookie',
    brandIdentity: 'Brand identity',
    nuovaScheda: ' (si apre in una nuova scheda)',
  },

  /* --- il club, in parole ----------------------------------------------- */
  community: {
    tagline: 'Build ambition.',
    fasciaEta: '16 ai 23',
    /* La città sta qui e non in config/socials.js perché in inglese cambia
       nome: Torino è "Turin". Un esonimo è una traduzione, non un dato. */
    citta: 'Torino',
    raggio: 'tutta Italia',
    reach: 'I primi eventi a Torino, l’obiettivo è tutta Italia',
    descrizioneBreve:
      'Il club dei giovani che costruiscono qualcosa. Anche se non hai ancora niente fra le mani: conta l’attitudine, non il progetto già avviato.',
    descrizione:
      'YET, Young Entrepreneurs Together è il club dei giovani che costruiscono qualcosa: un prodotto, un’associazione, un progetto, un’idea ancora confusa. E se non hai ancora niente fra le mani va bene lo stesso: quello che cerchiamo è l’attitudine, non il progetto già avviato. I primi eventi saranno a Torino, ma l’obiettivo è espandersi in tutta Italia. Nessuna selezione, nessuna quota.',
  },

  /* --- i canali --------------------------------------------------------- */
  socials: {
    linkedin: { label: 'LinkedIn', handle: 'YET Club' },
    instagram: { label: 'Instagram', handle: '@yet.community' },
    whatsapp: { label: 'Gruppo WhatsApp', handle: 'Entra nella chat della community' },
    /* `{email}` e non l'indirizzo scritto: l'indirizzo vero sta in
       config/socials.js, qui ci passa attraverso. Vedi lib/socials.jsx. */
    email: { label: 'Scrivici', handle: '{email}' },
  },

  /* --- apertura --------------------------------------------------------- */
  hero: {
    entra: 'Entra in YET',
    eventi: 'Guarda gli eventi',
    meta: 'Dai {eta} anni',
  },

  /* --- home ------------------------------------------------------------- */
  home: {
    contatorePersona: 'persona sta costruendo con noi',
    contatorePersone: 'persone stanno costruendo con noi',
    notizie: 'Notizie',
    unaNotizia: 'notizia',
    tanteNotizie: 'notizie',
    caricamento: 'Caricamento delle notizie in corso.',
    caricate: '{n} notizie caricate.',
    nessunaAncora: 'Non ci sono ancora notizie.',
    erroreTitolo: 'Non riusciamo a caricare le notizie',
    vuotoTitolo: 'Ancora nessuna notizia',
    vuotoTesto:
      'Qui finiranno gli incontri, i progetti e le cose che succedono nella community. Nel frattempo puoi già presentarti.',
    nonCollegateTitolo: 'Le notizie non sono collegate',
    nonCollegateTesto1:
      'Manca la configurazione di Firebase, quindi il feed non può caricarsi. Non è un errore del sito: è il passo che manca alla prima installazione.',
    nonCollegateTesto2a: 'Copia',
    nonCollegateTesto2b: 'in',
    nonCollegateTesto2c: ', riempi le sei chiavi dalla console Firebase e riavvia',
    nonCollegateTesto2d: '. I dettagli sono nel README.',
  },

  /* --- invito al gruppo ------------------------------------------------- */
  whatsapp: {
    eyebrow: 'Il posto dove succedono le cose',
    titolo: 'Il gruppo WhatsApp',
    testo:
      'È lì che ci si organizza fra un incontro e l’altro: si chiede una mano, si mostra a che punto si è, si decide quando vedersi. Il sito racconta cosa facciamo, il gruppo è dove lo facciamo. Si entra subito, senza aspettare approvazioni.',
    bottone: 'Entra nel gruppo',
    srSuffisso: ' WhatsApp di YET (si apre in una nuova scheda)',
  },

  /* --- stati comuni ----------------------------------------------------- */
  stati: {
    riprova: 'Riprova',
    nuovaScheda: ' (si apre in una nuova scheda)',
    dimensionePiena: ' (apri a dimensione piena in una nuova scheda)',
    leggiTutto: 'Leggi tutto',
    mostraMeno: 'Mostra meno',
    inEvidenza: 'In evidenza',
    inPubblicazione: 'in pubblicazione',
    caricamento: 'Caricamento…',
    lancette: 'immagine, lancette',
    membro: 'Membro',
  },

  /* --- intro ------------------------------------------------------------ */
  intro: {
    skip: 'Skip',
    entra: 'Entra',
    animazione: 'Animazione del logo YET',
    logo: 'Il logo YET',
  },

  /* --- errori del server ------------------------------------------------
     I codici di Firestore, tradotti in cose che si capiscono. Sono qui e non
     dentro le pagine perché lo stesso codice capita leggendo le notizie, gli
     eventi e gli sponsor, e tre versioni della stessa frase divergono al
     primo ritocco. */
  errori: {
    regoleVecchie:
      'Il server ha rifiutato la lettura: le regole Firestore non sono ancora state pubblicate, oppure quelle pubblicate sono più vecchie del sito.',
    indiceMancante:
      'Firestore chiede un indice per questa ricerca. Nella console del browser c’è un link che lo crea con un clic.',
    serverGiu: 'Non riusciamo a raggiungere il server. Di solito è la connessione: riprova fra un momento.',
    generico: 'Qualcosa è andato storto. Il dettaglio è nella console del browser.',

    /* Errori che nascono dentro lib/: quel codice non ha un t() sotto mano,
       quindi allega alla propria eccezione la CHIAVE della frase da mostrare
       (vedi messaggioErrore in lib/i18n.jsx) e chi renderizza la traduce. */
    immagineIlleggibile: 'Non riesco a leggere questa immagine. Il file potrebbe essere danneggiato.',
    immagineTroppoPesante:
      'Non riesco a portare questa immagine sotto {peso} senza rovinarla. Provane una meno complessa, oppure caricala altrove e allega qui il suo indirizzo.',
    fileTroppoPesante:
      'Questo file pesa {peso} e senza Firebase Storage il massimo è circa {massimo}. Caricalo su Drive e allega qui il suo indirizzo.',
    fileTroppoGrande: 'Il file è troppo grande per essere salvato dentro la notizia.',
    fileIlleggibile: 'Non riesco a leggere il file.',
    avatarNonComprimibile: 'Non riesco a comprimere abbastanza questa foto. Provane un’altra.',
    fotoTroppoGrande: 'La foto profilo è troppo grande. Caricane una più piccola.',
    rientraPerCancellare:
      'Il tuo profilo è stato cancellato. Per rimuovere anche l’account di accesso rientra con Google e ripeti l’operazione entro pochi minuti: per sicurezza Firebase non cancella un account con un accesso vecchio.',
  },

  /* --- incontri ---------------------------------------------------------- */
  /* Il feed della pagina Eventi.
     Si chiamava `eventi.*` e diceva "eventi caricati", "nessun evento": ma
     sono NOTIZIE, e gli eventi veri sono gli `incontri` qui sotto, quelli con
     una data e un posto. La confusione era nel nome delle chiavi prima ancora
     che nei testi, ed e' il motivo per cui vale la pena rinominarle invece di
     cambiare solo le stringhe. */
  notizie: {
    titolo: 'Notizie',
    liveCaricamento: 'Caricamento delle notizie in corso.',
    liveCaricati: '{n} notizie caricate.',
    liveVuoto: 'Non c’è ancora nessuna notizia.',
    spentoTitolo: 'Le notizie non sono collegate',
    spentoTesto:
      'Manca la configurazione di Firebase. Non è un errore del sito: è il passo che manca alla prima installazione, ed è spiegato nel README.',
    erroreTitolo: 'Non riusciamo a caricare le notizie',
    vuotoTitolo: 'Ancora nessuna notizia',
    vuotoTesto:
      'Qui finiranno gli annunci e le cose che succedono nella community. Nel frattempo puoi già presentarti.',
    unaNotizia: 'notizia',
    tanteNotizie: 'notizie',
  },

  sponsorRiservato: {
    titolo: 'Dati riservati',
    spiegazione:
      'Visibile solo a voi organizzatori. Il livello NON compare sul sito e non è leggibile da nessun altro: sta in una collection separata che le regole aprono solo agli admin.',
    livello: 'Livello',
    nessuno: 'non impostato',
    nota: 'Nota interna',
    notaAiuto: 'Accordi, contatti, scadenze. Resta fra voi.',
    salva: 'Salva',
    salvato: 'Salvato.',
  },

  incontri: {
    prossimi: 'Prossimi incontri',
    titolo: 'Incontri',
    giaFatti: 'Già fatti',
    iscriviti: 'Iscriviti',
    dataDaDefinire: 'data da definire',
  },

  /* --- cancellazione del profilo ----------------------------------------- */
  cancella: {
    titolo: 'Cancellare il profilo',
    testo:
      'Rimuove il tuo profilo dall’elenco dei membri e il tuo account di accesso. È definitivo: nome, bio, foto e link spariscono e non si recuperano.',
    bottone: 'Cancella il mio profilo',
    gruppo: 'Conferma la cancellazione',
    domanda: 'Sicuro? Non si torna indietro.',
    inCorso: 'Cancellazione…',
    conferma: 'Sì, cancella tutto',
    annulla: 'No, torna indietro',
    errore: 'Non è stato possibile completare la cancellazione.',
  },

  /* --- cancello dell'area riservata -------------------------------------- */
  gate: {
    controllo: 'Sto controllando i permessi…',
    riservataTitolo: 'Area riservata',
    riservataTesto:
      'Questa pagina serve a pubblicare le notizie del sito. Accedi con l’account YET per continuare.',
    accediGoogle: 'Accedi con Google',
    nonAdminTitolo: 'Non hai i permessi',
    nonAdminTesto:
      'Sei entrato come {email}, che non è fra gli amministratori della community. Se pensi che sia un errore, scrivi a chi gestisce il sito.',
    nonAdminDove1: 'La lista si trova in',
    nonAdminDove2: 'e, soprattutto, in',
    tornaHome: 'Torna alla home',
  },

  /* --- i social di un profilo -------------------------------------------- */
  social: {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    sito: 'Sito',
    /* Il testo visibile ("LinkedIn") deve essere CONTENUTO in questa
       etichetta: lo chiede la WCAG 2.5.3, e chi comanda a voce dice "clicca
       LinkedIn". Cambiando l'ordine delle parole va tenuto dentro. */
    aria: '{social} di {nome} (si apre in una nuova scheda)',
  },

  /* --- vetrina ----------------------------------------------------------- */
  vetrina: {
    eyebrow: 'La community',
    titolo: 'Vetrina',
    lead:
      'Chi costruisce qualcosa dentro YET: studenti, autodidatti, fondatori alle prime armi, da Torino e dal resto d’Italia.',
    leadSecond: 'Apri un profilo per leggere la presentazione completa e trovare i contatti.',
    contatoreUno: 'persona nella community',
    contatoreTanti: 'persone nella community',
    nomeRipiego: 'Membro YET',
    tuoProfilo: 'Il tuo profilo',
    organizza: 'Organizza',
    bioVuota: 'Bio in arrivo - {nome} non si è ancora presentato.',
    leggiProfilo: 'Leggi il profilo',
    liveCaricamento: 'Caricamento dei profili in corso.',
    liveErrore: 'Caricamento dei profili non riuscito.',
    liveCaricatoUno: '{n} profilo caricato.',
    liveCaricatiTanti: '{n} profili caricati.',
    spentoTitolo: 'Elenco non disponibile',
    spentoTesto:
      'Questa copia del sito non ha le chiavi di Firebase configurate, quindi i profili non possono essere caricati. Il resto del sito funziona normalmente.',
    erroreTitolo: 'Non riusciamo a caricare i profili',
    errorePermessi:
      'La lettura dell’elenco è stata rifiutata dal server. Riprova, e se il problema resta scrivici.',
    erroreGenerico:
      'Qualcosa è andato storto nel leggere l’elenco dei membri. Può essere la connessione.',
    vuotoTitolo: 'Ancora nessun profilo',
    vuotoTesto:
      'Nessuno si è ancora presentato. Puoi essere il primo: iscriviti, accedi e scrivi due righe su cosa stai costruendo.',
    chiOrganizza: 'Chi organizza',
    chiOrganizzaNota: 'Tengono in piedi la community e pubblicano le notizie del sito.',
    iMembri: 'I membri',
    laCommunity: 'La community',
    profiloUno: 'profilo',
    profiliTanti: 'profili',
  },

  /* --- pagina di un profilo ---------------------------------------------- */
  profilo: {
    caricamento: 'Sto caricando il profilo.',
    nonTrovatoTitolo: 'Questo profilo non c’è',
    nonTrovatoTesto:
      'Può essere stato cancellato, oppure il link è incompleto. L’elenco di chi c’è adesso è nella vetrina.',
    tornaVetrina: 'Torna alla vetrina',
    vetrina: 'Vetrina',
    spentoTitolo: 'Profilo non disponibile',
    spentoTesto:
      'Manca la configurazione di Firebase, quindi i profili non possono essere letti. Non è un errore del sito: è il passo che manca alla prima installazione, ed è spiegato nel README.',
    erroreTitolo: 'Non riesco a leggere questo profilo',
    erroreTesto: 'Riprova fra poco.',
    attesaTitolo: 'Questo profilo non è ancora pubblico.',
    attesaTesto:
      'Lo vedi perché è il tuo, o perché organizzi la community. Comparirà nella vetrina appena approvato.',
    nelClubDal: 'Nel club dal {data}',
    modifica: 'Modifica il profilo',
    chiSono: 'Chi sono',
    presentazioneVuota: '{nome} non ha ancora scritto la sua presentazione.',
    doveTrovarlo: 'Dove trovarlo',
    project: 'Cosa sto costruendo',
    looking: 'Cosa cerco',
    skills: 'Cosa so fare',
  },

  /* --- titolo della scheda del browser ----------------------------------
     Si vede nella linguetta e nella cronologia, quindi è testo come gli
     altri. Il puntino centrale è quello del marchio, non un trattino. */
  titoli: {
    eventi: 'Eventi · YET',
    contatti: 'Contatti · YET',
    brand: 'Brand · YET',
    sponsor: 'Sponsor · YET',
    privacy: 'Privacy · YET',
    cookie: 'Cookie · YET',
    notFound: 'Pagina non trovata · YET',
  },

  /* --- eventi ------------------------------------------------------------ */
  eventi: {
    eyebrow: 'Eventi',
    titolo: 'Cosa succede',
    lead:
      'Incontri, annunci e cose che stiamo costruendo. I primi eventi saranno a Torino, ma l’obiettivo è farne in tutta Italia: se vuoi organizzarne uno dove stai tu, scrivici.',
  },

  /* --- contatti ---------------------------------------------------------- */
  contatti: {
    eyebrow: 'Contatti',
    titolo1: 'Parliamone.',
    titolo2: 'Scegli il canale.',
    lead:
      'Che sia un’idea da costruire, una domanda o solo curiosità: qui trovi tutti i modi per raggiungerci. Rispondiamo appena possibile.',
    mailTitolo: 'Scrivici una mail',
    copia: 'Copia',
    copiaAria: 'Copia l’indirizzo {email}',
    copiato: 'Indirizzo copiato negli appunti.',
    copiaFallita:
      'Non è stato possibile copiare automaticamente: l’indirizzo è selezionato, usa Ctrl+C (⌘+C su Mac).',
    mailMancante:
      'L’indirizzo non è configurato. Nel frattempo scrivici su uno dei canali qui sotto.',
    doveCiTrovi: 'Dove ci trovi',
    nessunCanaleTitolo: 'Nessun canale pubblico, per ora',
    nessunCanaleTesto:
      'Stiamo sistemando i nostri profili. Nel frattempo la mail qui sopra funziona benissimo.',
    doveSiamo: 'Dove siamo',
    partenza: 'Si parte da {citta}, si va verso tutta Italia',
    raggio:
      'I primi eventi saranno a {citta}, ma l’obiettivo è espandersi in tutta Italia: se vivi a Palermo o a Udine, puoi trovare gente della tua stessa città e contribuire a fare eventi proprio dove sei tu.',
    caffe: 'E, ovvio: se sei di passaggio a {citta}, scrivici e ci prendiamo un caffè.',
  },

  /* --- brand identity ---------------------------------------------------- */
  brand: {
    eyebrow: 'Brand identity',
    titolo: 'Il marchio',
    lead:
      'Se devi mettere {nome} su una locandina, una slide o un post, i file e le regole sono qui. Serve a evitare la fine che fanno tutti i loghi delle associazioni: sette versioni diverse in giro, nessuna giusta.',
    logoTitolo: 'Il logo',
    logoChiaroAlt: 'Il logo YET nella versione chiara',
    logoScuroAlt: 'Il logo YET nella versione scura',
    logoChiaro: 'Versione chiara, per fondi scuri',
    logoScuro: 'Versione scura, per fondi chiari',
    scarica: 'Scarica PNG',
    logoNota:
      'Il marchio è un’immagine, non una scritta: non va mai ricomposto scrivendo «YET» con un carattere qualsiasi. La lettera finale è fatta di due segni, e quelli sono il simbolo.',
    lancetteTitolo: 'Le lancette',
    lancetteAlt: 'Le due lancette del marchio YET: una freccia coral e una barra diagonale',
    lancetteNota1:
      'La lettera finale del marchio è fatta di due segni che sembrano le lancette di un orologio. Presi da soli diventano un elemento grafico riutilizzabile: divisori fra le sezioni, decorazione, icona.',
    lancetteNota2: 'Si possono ruotare e scalare. Non si deformano e non si ricolorano.',
    coloriTitolo: 'I colori',
    coloriNota:
      'Tre, e bastano. I rapporti di contrasto qui sotto sono calcolati con la formula WCAG, non stimati a occhio: servono a sapere quando un colore si può usare per il testo e quando no.',
    copiaColore: 'Copia il codice colore {hex}',
    copiato: 'Copiato',
    copiatoLive: '{hex} copiato negli appunti.',
    copiaErroreLive: 'Non riesco a copiare. Selezionalo a mano.',
    copiaErrore: 'Il browser non mi lascia copiare. Selezionalo a mano, è {hex} e simili.',
    colori: {
      coral: {
        nome: 'Coral',
        ruolo: 'L’accento. La freccia del marchio, i dettagli, un solo elemento per schermata.',
        nota: 'Su fondo scuro fa 4,2:1. Va bene per titoli e icone, non per il testo piccolo.',
      },
      beige: {
        nome: 'Beige',
        ruolo: 'Il fondo delle stampe e il testo sul sito scuro. È il colore che si vede di più.',
        nota: 'Sul nero caldo fa 16,3:1, il massimo della scala.',
      },
      nero: {
        nome: 'Nero caldo',
        ruolo: 'Il testo sulle stampe, il fondo del sito. Non è il nero puro, tira al marrone.',
        nota: 'Il nero assoluto (#000) accanto al beige sembra un buco: non usarlo.',
      },
    },
    carattereTitolo: 'Il carattere',
    carattereNota1:
      'Un solo carattere per tutto. Titoli in Extrabold (800), testo in Regular (400), etichette e bottoni in Semibold (600). È gratuito e si scarica da',
    regoleTitolo: 'Sì e no',
    si: 'Sì',
    no: 'No',
    regole: {
      spazio: {
        si: 'Lascia respirare il marchio: almeno l’altezza della “Y” di spazio vuoto tutto intorno.',
        no: 'Non stringerlo fra altri elementi.',
      },
      versione: {
        si: 'Usa la versione chiara sui fondi scuri e quella scura sui fondi chiari.',
        no: 'Non mettere quella scura su una foto scura: la parte nera sparisce e resta una freccia sospesa.',
      },
      scala: {
        si: 'Scalalo tenendo le proporzioni.',
        no: 'Non allargarlo, non stringerlo, non inclinarlo.',
      },
      mono: {
        si: 'Se ti serve monocromatico, usa il beige o il nero pieni.',
        no: 'Non ricolorarlo di altri colori, e non mettere la freccia di un colore diverso dal coral.',
      },
    },
  },

  /* --- sponsor ----------------------------------------------------------- */
  sponsor: {
    eyebrow: 'Sponsor',
    titolo: 'Chi ci sostiene',
    lead:
      '{nome} non ha quote di iscrizione: chi entra non paga niente. Quello che serve per organizzare un evento (una sala, il pranzo, il materiale) arriva da chi decide di darci una mano.',
    chiCe: 'Chi c’è',
    liveCaricamento: 'Caricamento degli sponsor in corso.',
    liveCaricati: '{n} sponsor caricati.',
    erroreTitolo: 'Non riusciamo a caricare gli sponsor',
    errorePermessi:
      'Il server ha rifiutato la lettura: le regole Firestore pubblicate sono più vecchie del sito.',
    vuotoTitolo: 'Nessuno sponsor, per ora',
    vuotoTesto: 'Stiamo partendo adesso. Se volete essere i primi, il posto è libero e si vede.',
    apreSito: '{nome}, apre il sito in una nuova scheda',
    cosaOffriamo: 'Cosa offriamo',
    offerta: {
      visibilita: {
        titolo: 'Visibilità dove conta',
        testo:
          'Il logo su questa pagina, sui materiali degli eventi e nei post che li raccontano. Non un banner in fondo a una pagina che nessuno apre.',
      },
      accesso: {
        titolo: 'Accesso diretto',
        testo:
          'Ragazzi fra i 16 e i 23 anni che stanno già costruendo qualcosa. Se cercate stagisti, collaboratori o semplicemente gente sveglia, sono qui.',
      },
      evento: {
        titolo: 'Un evento vostro',
        testo:
          'Potete ospitare un incontro, portare una sfida vera da risolvere, o raccontare come avete costruito la vostra azienda. Funziona meglio di qualsiasi logo.',
      },
    },
    parliamone: 'Parliamone',
    parliamoneTesto:
      'Non abbiamo un listino e non vi manderemo una presentazione da venti slide. Scriveteci cosa fate e cosa vi interessa, e vi diciamo se ha senso.',
    scriviciA: 'Scrivici a {email}',
    altriCanali: 'Gli altri canali',
  },

  /* --- join: la pagina d'ingresso e il proprio profilo -------------------- */
  join: {
    titolo: 'Unisciti al club',
    liveControllo: 'Sto controllando se hai già effettuato l’accesso.',
    configTitolo: 'Firebase non è configurato.',
    configTesto1: 'Le variabili',
    configTesto2:
      'non sono state impostate, quindi accesso e salvataggio non possono funzionare. Il resto del sito si naviga normalmente.',
    punti: {
      chiSiamo: { titolo: 'Chi siamo' },
      perChi: {
        titolo: 'Per chi',
        testo:
          'Dai {eta} anni, da tutta Italia. I primi eventi saranno a {citta}, ma l’obiettivo è espandersi: se vivi a Palermo o a Udine puoi trovare gente della tua città e contribuire a farne proprio dove sei tu.',
      },
      cosaSiFa: {
        titolo: 'Cosa si fa',
        testo:
          'Ognuno porta il proprio progetto e mostra cosa è cambiato dall’ultima volta. Si fanno domande scomode, si presta una mano, si trova chi ha già risolto il tuo problema.',
      },
      comeSiEntra: {
        titolo: 'Come si entra',
        testo:
          'Accedi con Google e scrivi due righe su di te. La richiesta arriva agli organizzatori e, appena approvata, compari fra i membri. Non c’è quota di iscrizione: il passaggio serve solo a tenere fuori gli account finti.',
      },
      seNonHai: {
        titolo: 'Se non hai ancora niente',
        testo:
          'Va bene lo stesso. Non serve un progetto avviato, né un’idea già chiara: quello che cerchiamo è l’attitudine. Se ti viene voglia di costruire qualcosa e non sai da dove partire, questo è esattamente il posto giusto in cui trovarti.',
      },
    },
    aperturaGoogle: 'Sto aprendo la finestra di Google…',
    inAppTitolo: 'Sei nel browser interno di un’app.',
    inAppTesto:
      'Google non permette l’accesso da qui, per nessun sito. Apri questa pagina in Safari o in Chrome (dal menu dell’app, la voce “Apri nel browser”) e l’accesso funziona.',
    ctaNota:
      'Serve solo un account Google. Niente password nuove, niente newsletter: usiamo nome, email e foto per farti comparire fra i membri.',

    /* Gli errori dell'accesso con Google. Le voci `auth/...` arrivano da
       Firebase; `inApp` è un codice nostro, lo mette lib/auth.jsx quando
       riconosce il browser interno di un'app. */
    accesso: {
      popupChiuso: 'Hai chiuso la finestra di Google prima di finire. Puoi riprovare quando vuoi.',
      popupBloccato:
        'Il browser ha bloccato la finestra di Google. Consenti i popup per questo sito e riprova, oppure apri il sito in Safari o Chrome.',
      inApp:
        'Stai navigando dentro un’altra app (Instagram, LinkedIn o simili), e Google non permette l’accesso da qui. Apri il sito in Safari o in Chrome e riprova.',
      rete: 'Connessione assente o instabile. Controlla la rete e riprova.',
      dominio: 'Questo indirizzo non è fra i domini autorizzati del progetto Firebase.',
      nonAttivo: 'Il login con Google non è ancora attivo su questo progetto Firebase.',
      troppiTentativi: 'Troppi tentativi ravvicinati. Aspetta qualche minuto e riprova.',
      nonConfigurato:
        'Firebase non è configurato, quindi l’accesso non è disponibile: copia .env.example in .env e riavvia il server.',
      generico: 'Accesso non riuscito. Riprova fra un momento.',
    },

    /* Gli errori del salvataggio. `permessi` è lungo di proposito: "le regole
       non permettono questa operazione" è vero e inutile, mentre la causa
       vera è quasi sempre una sola e dirla fa risparmiare mezz'ora. */
    salvataggio: {
      permessi:
        'Firestore ha rifiutato il salvataggio. Quasi sempre vuol dire che le regole pubblicate sul database sono più vecchie di quelle del progetto: apri la console Firebase → Firestore Database → Regole e incolla il contenuto aggiornato di firestore.rules, poi premi Pubblica.',
      lento:
        'Firestore non ha risposto in tempo. Probabilmente è la connessione: riprova fra un momento.',
      sessione: 'La sessione è scaduta. Esci e rientra con Google, poi riprova.',
      generico: 'Qualcosa è andato storto durante il salvataggio.',
    },

    /* Il form del proprio profilo. */
    form: {
      titolo: 'Il tuo profilo',
      lead:
        'È quello che gli altri vedono nella pagina Membri. Due righe fatte bene valgono più di un curriculum.',
      chiSei: 'Chi sei',
      obbligatorio: ' (obbligatorio)',
      nome: 'Nome e cognome',
      nomeHint: 'Come vuoi essere chiamato. Anche solo il nome va bene.',
      nomeErrore: 'Serve un nome: è quello con cui compari fra i membri.',
      luogo: 'Da dove scrivi',
      luogoHint:
        'La città o la zona, non l’indirizzo. Serve a far vedere che YET non è solo torinese e a farti trovare da chi ti sta vicino. Puoi lasciarlo vuoto.',
      bio: 'Presentati',
      bioHint:
        'Raccontati con calma: nella vetrina si vedono le prime due righe, il resto si legge aprendo il tuo profilo. I ritorni a capo restano.',
      bioErrore: 'La bio supera {max} caratteri: togline {troppi}.',
      bioConteggio: '{n} caratteri su {max} disponibili',
      foto: 'Foto del profilo (link)',
      fotoNomeTu: 'Tu',
      caricaFoto: 'Carica una foto',
      preparoFoto: 'Preparo la foto…',
      togli: 'Togli',
      fotoCaricata:
        'Foto caricata dal tuo dispositivo, ridotta a {peso}. Usa «Togli» per sceglierne un’altra o per tornare a un indirizzo.',
      fotoHint:
        'Facoltativo: se non metti niente usiamo le tue iniziali. Puoi caricare una foto dal dispositivo oppure incollare qui sopra l’indirizzo di una già online. Le foto caricate vengono ritagliate quadrate e rimpicciolite a {peso}.',
      fotoErrore: 'Il link della foto deve iniziare con http:// o https://.',
      fotoIncompleto: 'Ci vuole un indirizzo completo, che inizi con http:// o https://.',
      fotoControllo: 'Sto controllando il link…',
      fotoNonCarica:
        'Non riesco a caricare quell’immagine. Controlla il link, oppure lascialo vuoto: le iniziali stanno benissimo.',
      fotoNonUsabile: 'Non riesco a usare questa immagine.',
      cosaFai: 'Cosa fai',
      cosaFaiHint:
        'Facoltativi, e sono quelli che fanno la differenza: chi cerca una mano o un socio legge questi tre. Compaiono nella pagina del tuo profilo.',
      project: 'Cosa stai costruendo',
      projectHint:
        'Il progetto, il prodotto, l’idea. Anche se è appena cominciata, o se è ancora confusa: scrivere com’è adesso vale più di una descrizione perfetta.',
      looking: 'Cosa cerchi',
      lookingHint:
        'Una mano su qualcosa, un socio, qualcuno che ha già risolto il tuo problema, o solo due opinioni sincere. Chiedere è il motivo per cui esiste il club.',
      skills: 'Cosa sai fare',
      skillsHint:
        'Quello su cui gli altri possono chiedere a te. Non serve un titolo: “monto video”, “parlo inglese bene”, “so fare un sito”.',
      doveTrovarti: 'Dove trovarti',
      doveTrovartiHint: 'Tutti facoltativi. Servono a chi vede il tuo progetto e vuole scriverti.',
      altro: 'Altro',
      linkedinPlaceholder: 'https://www.linkedin.com/in/nomecognome',
      instagramPlaceholder: '@nomeutente',
      altroPlaceholder: 'https://ilmiosito.it, o GitHub, o TikTok',
      salva: 'Salva le modifiche',
      crea: 'Crea il mio profilo',
      inCorso: 'Salvataggio…',
      vediComeTiVedono: 'Vedi come ti vedono',
      statoSalvando: 'Sto salvando il profilo…',
      statoSalvato: 'Profilo salvato. Ora compari fra i membri.',
      /* La conferma cambia con lo stato della richiesta: "ora compari fra i
         membri" detto a chi e' ancora in attesa e' una frase FALSA, e produce
         esattamente il "ho salvato e non cambia niente" di chi poi va a
         cercarsi nella vetrina e non si trova. */
      statoSalvatoInAttesa:
        'Profilo salvato. Comparirà nella vetrina appena gli organizzatori approvano la richiesta: fino a lì lo vedi solo tu.',
      statoSalvatoRifiutato:
        'Profilo salvato. Al momento il tuo profilo non è pubblicato nella vetrina: le modifiche restano salvate.',
      statoErrore: 'Salvataggio non riuscito. {dettaglio}',
      attesaTitolo: 'Richiesta inviata, in attesa di approvazione',
      attesaTesto:
        'Il tuo profilo è arrivato agli organizzatori. Finché non lo approvano non compare fra i membri e non lo vede nessun altro: puoi comunque modificarlo quando vuoi da questa pagina, e le modifiche restano.',
      rifiutataTitolo: 'Richiesta non approvata',
      rifiutataTesto:
        'Al momento il tuo profilo non è pubblicato fra i membri. Se pensi che sia un errore, o vuoi capire perché, scrivici: la decisione non è definitiva e si può rivedere.',
    },
  },

  /* --- area riservata: la redazione --------------------------------------
     La vedono solo gli organizzatori, ma è tradotta come il resto: uno
     organizzatore che legge il sito in inglese non deve trovarsi un pannello
     in un'altra lingua a metà del lavoro. */
  admin: {
    eyebrow: 'Area riservata',
    titolo: 'Redazione',
    lead:
      'Da qui si scrivono le notizie che compaiono sulla home. Le bozze restano visibili solo in questa pagina.',
    notaAdmin1: 'Gli admin si impostano in',
    notaAdmin2: 'e',
    notaAdmin3:
      'le regole sono la protezione vera. Il primo file decide solo chi vede questa pagina; senza la mail nella allowlist delle regole ogni scrittura viene rifiutata.',
    spento1: 'Firebase non è configurato: mancano le variabili',
    spento2: '. Copia',
    spento3: 'in',
    spento4:
      'e riavvia il server di sviluppo. Finché manca la configurazione questa pagina non può leggere né scrivere niente.',

    /* Gli errori di scrittura. `permessi` dice anche COSA FARE: è l'errore che
       farà chiunque configuri il progetto la prima volta. */
    errori: {
      permessi:
        'Firestore ha rifiutato la scrittura. Con ogni probabilità la tua email non è nella allowlist di firestore.rules: aggiungerla in src/config/admins.js non basta, quel file decide solo cosa si vede, le regole decidono cosa si può scrivere. Ricordati di ripubblicare le regole dopo la modifica.',
      sessione: 'La sessione è scaduta. Esci e accedi di nuovo, poi riprova.',
      rete: 'Firestore non risponde. Controlla la connessione e riprova.',
      sparita: 'La notizia non esiste più: forse è stata eliminata da un altro admin.',
      generico: 'Errore inatteso durante l’operazione.',
      utenteAssente: 'Utente non disponibile: ricarica la pagina e accedi di nuovo.',
    },

    nuovaNotizia: 'Nuova notizia',
    titoloCampo: 'Titolo',
    titoloObbligatorio: 'Il titolo è obbligatorio.',
    corpo: 'Corpo',
    corpoObbligatorio: 'Il corpo della notizia è obbligatorio.',
    corpoTroppoLungo: 'Il corpo supera i {max} caratteri: accorcialo di {troppi}.',
    corpoHint: 'Gli a-capo vengono rispettati. Niente HTML: il testo viene mostrato così com’è.',
    allegati: 'Allegati',
    pubblicata: 'Pubblicata',
    pubblicataHint: 'Se la lasci spenta la notizia resta una bozza, visibile solo qui.',
    salvaNotizia: 'Salva notizia',
    salvataggio: 'Salvataggio…',
    svuota: 'Svuota',
    pubblicataOk: 'Notizia pubblicata: è già visibile sul sito.',
    bozzaOk: 'Bozza salvata. Non si vede sul sito finché non la pubblichi da qui sotto.',

    tutteLeNotizie: 'Tutte le notizie',
    unaNotizia: 'notizia',
    tanteNotizie: 'notizie',
    diCuiBozze: ', di cui {n} in bozza',
    caricamentoLive: 'Caricamento delle notizie…',
    erroreLista: 'Non riesco a leggere le notizie',
    vuotoTitolo: 'Nessuna notizia, per ora',
    vuotoTesto:
      'Scrivi la prima qui sopra: comparirà in questo elenco e, se pubblicata, sulla home.',
    senzaTitolo: '(senza titolo)',
    bozza: 'Bozza',
    autoreSconosciuto: 'autore sconosciuto',
    inPubblicazione: 'in pubblicazione…',
    salva: 'Salva',
    annulla: 'Annulla',
    pubblico: 'Pubblico…',
    nascondo: 'Nascondo…',
    nascondi: 'Nascondi',
    pubblica: 'Pubblica',
    modifica: 'Modifica',
    confermaEliminazione: 'Confermi l’eliminazione di “{titolo}”?',
    sicuro: 'Sicuro?',
    elimino: 'Elimino…',
    siElimina: 'Sì, elimina',
    no: 'No',
    elimina: 'Elimina',
  },

  /* --- richieste di iscrizione (dentro /admin) ---------------------------- */
  richieste: {
    titolo: 'Richieste di iscrizione',
    nessunaInAttesa: 'nessuna in attesa',
    inAttesa: '{n} in attesa',
    intro:
      'Chi si iscrive non compare fra i membri finché non lo approvate da qui. Il rifiuto non cancella niente ed è reversibile: la persona continua a vedere il proprio profilo, ma non lo vede nessun altro.',
    erroreTitolo: 'Non riesco a leggere le richieste',
    errorePermessi:
      'Il server ha rifiutato la lettura. Controlla che la tua email sia nella allowlist dentro firestore.rules e che le regole siano state pubblicate.',
    erroreGenerico: 'Qualcosa è andato storto. Può essere la connessione.',
    vuotoTitolo: 'Nessuna richiesta in attesa',
    vuotoTesto:
      'Quando qualcuno si iscriverà comparirà qui, e riceverà accesso solo dopo che uno di voi l’avrà approvato.',
    senzaNome: 'Senza nome',
    richiestaDel: 'Richiesta del {data}',
    senzaPresentazione: 'Non ha scritto una presentazione.',
    approva: 'Approva',
    approvo: 'Approvo…',
    rifiuta: 'Rifiuta',
    rifiuto: 'Rifiuto…',
    scritturaRifiutata:
      'Rifiutato dal server: la tua email non è nella allowlist dentro firestore.rules, oppure le regole non sono state ripubblicate dopo l’ultima modifica.',
    operazioneFallita: 'Operazione non riuscita.',
  },

  /* --- gestione degli incontri (in cima alla pagina Eventi) --------------- */
  incontriAdmin: {
    titolo: 'Organizza un incontro',
    chiudi: 'Chiudi',
    nuovo: 'Nuovo incontro',
    intro:
      'Un incontro non è una notizia: ha una data e un posto, compare in cima finché non è passato, e poi scende da solo fra quelli già fatti. Lo vedete solo voi organizzatori.',
    titoloCampo: 'Titolo',
    titoloPlaceholder: 'Primo incontro di settembre',
    quando: 'Quando',
    dove: 'Dove',
    dovePlaceholder: 'Toolbox Coworking, via Agostino da Montefeltro 2, Torino',
    link: 'Link per iscriversi',
    facoltativo: '(facoltativo)',
    diCosa: 'Di cosa si parla',
    diCosaPlaceholder:
      'Ognuno porta il proprio progetto e mostra cosa è cambiato dall’ultima volta.',
    pubblicaSubito: 'Pubblicato subito',
    salva: 'Salva incontro',
    salvataggio: 'Salvataggio…',
    pubblicatoOk: 'Incontro pubblicato: è già visibile qui sotto.',
    bozzaOk: 'Bozza salvata. Non si vede sul sito finché non la pubblichi.',
    errorePermessi:
      'Il server ha rifiutato la scrittura. Controlla che la tua email sia nella allowlist dentro firestore.rules e che le regole siano state ripubblicate.',
    erroreGenerico: 'Non sono riuscito a salvare.',
    bozza: 'Bozza',
    giaFatto: 'Già fatto',
    nascondi: 'Nascondi',
    pubblica: 'Pubblica',
    elimina: 'Elimina',
    sicuro: 'Sicuro?',
    si: 'Sì',
    no: 'No',
  },

  /* --- gestione sponsor (dentro /admin) ----------------------------------- */
  sponsorAdmin: {
    titolo: 'Sponsor',
    intro:
      'Compaiono nella pagina Sponsor. Il numero d’ordine decide chi sta in cima: più basso, più in alto. A parità va in ordine alfabetico.',
    nome: 'Nome',
    sito: 'Sito',
    facoltativo: '(facoltativo)',
    nota: 'Nota',
    notaSpiegazione: '(una riga sotto il logo)',
    notaPlaceholder: 'Sede del primo incontro',
    ordine: 'Ordine',
    ordineVoce: 'ordine {n}',
    togli: 'Togli',
    caricaLogo: 'Carica il logo',
    preparoLogo: 'Preparo il logo…',
    salvo: 'Salvo…',
    aggiungi: 'Aggiungi sponsor',
    vuoto: 'Nessuno sponsor, per ora.',
    eliminaAria: 'Elimina lo sponsor {nome}',
    elimina: 'Elimina',
    sicuroSi: 'Sicuro? Sì',
    no: 'No',
    erroreLettura: 'Non riesco a leggere gli sponsor.',
    formatoLogo: 'Il logo dev’essere un’immagine JPEG, PNG, WebP o AVIF.',
    erroreLogo: 'Caricamento del logo non riuscito.',
    nomeObbligatorio: 'Il nome è obbligatorio.',
    errorePermessi:
      'Rifiutato dal server: le regole pubblicate non conoscono ancora la collection “sponsors”. Ripubblica firestore.rules.',
    erroreSalvataggio: 'Salvataggio non riuscito.',
    erroreEliminazione: 'Eliminazione non riuscita.',
  },

  /* --- allegati di una notizia (dentro /admin) ---------------------------- */
  allegati: {
    hint:
      'Carica un file dal tuo dispositivo, oppure incolla l’indirizzo di qualcosa che è già online. Le immagini vengono mostrate dentro la notizia, tutto il resto come elenco di link sotto al testo.',
    fileCaricato: 'file caricato sul sito',
    trattaComeLink: 'Tratta come link',
    trattaComeImmagine: 'Tratta come immagine',
    togliAria: 'Togli l’allegato {nome}',
    togli: 'Togli',
    indirizzo: 'Indirizzo',
    comeSiChiama: 'Come si chiama',
    facoltativo: '(facoltativo)',
    nomePlaceholder: 'Volantino dell’incontro',
    aggiungi: 'Aggiungi',
    caricaFile: 'Carica una foto o un file',
    comprimo: 'Comprimo l’immagine…',
    leggo: 'Leggo il file…',
    salvo: 'Salvo…',
    uploadHint:
      'Le foto vengono rimpicciolite e compresse qui nel browser, fino a {peso} ciascuna. Puoi caricarne quante ne vuoi: ognuna viene salvata a parte.',
    pieno: 'Hai raggiunto il massimo di {max} allegati. Togline uno per aggiungerne altri.',
    urlNonValido:
      'Serve un indirizzo che inizi per http:// o https://. Altri tipi di link non vengono accettati.',
    urlVuoto: 'Incolla un indirizzo.',
    doppione: 'Questo allegato c’è già.',
    troppi: 'Massimo {max} allegati per notizia.',
    tipoNonAmmesso:
      'Tipo di file non ammesso ({tipo}). Puoi caricare immagini JPEG, PNG, WebP, AVIF oppure un PDF.',
    tipoSconosciuto: 'sconosciuto',
    erroreCaricamento: 'Caricamento non riuscito.',
  },

  /* --- pagina non trovata (la rotta *) ------------------------------------ */
  notFound: {
    codice: 'Errore 404',
    titolo: 'Questa pagina non esiste.',
    lead:
      'Forse il link era vecchio, o c’è un errore di battitura nell’indirizzo. Il resto del sito funziona: da qui torni a casa.',
    haiChiesto: 'Hai chiesto',
    scrivici: 'Scrivici',
    paginePrincipali: 'Pagine principali',
    oppure: 'Oppure vai diretto a',
  },
}
