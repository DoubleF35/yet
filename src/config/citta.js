/* =========================================================================
   YET, chi è referente di una città

   Questo file dice chi organizza YET in una certa città. È un file del REPO
   e non un campo del database, e la ragione è di sicurezza, non di comodità.

   PERCHE' NON SUL PROFILO. Le regole di Firestore lasciano scrivere a
   ciascuno il proprio documento, e `usersKeysOk()` usa `hasOnly()` proprio
   per impedire che qualcuno vi attacchi campi inventati. Aggiungere
   `referente` a quella lista vorrebbe dire che chiunque può nominarsi
   referente della propria città, perché il documento lo scrive lui.
   Guardarlo con una regola si scontrerebbe poi con i salvataggi interi che
   manda la pagina Join: è lo stesso inciampo già pagato con `status`, e
   costerebbe un permission-denied che non spiega niente.

   PERCHE' NON LA ALLOWLIST DEGLI ADMIN. Quella dà tutto insieme: approvare e
   rifiutare i membri, pubblicare le notizie, gestire eventi e sponsor, e
   leggere `sponsorRiservato`, cioè quanto paga ogni sponsor. Un referente di
   città non ha bisogno di niente di tutto questo.

   Quindi sta qui: cambiarlo richiede una modifica al repo e una
   pubblicazione, cioè qualcosa che può fare solo chi ha accesso al repo. E
   non tocca né il database né le regole.

   ⚠️  A DIFFERENZA di src/config/admins.js, questo file NON ha una copia
   dentro firestore.rules, e non deve averla: non concede alcun permesso.
   È un'etichetta. Chi è elencato qui resta `role: 'member'` nel database e
   non può scrivere niente più di prima.
   ========================================================================= */

/**
 * uid -> città di cui la persona è referente.
 *
 * L'UID E NON L'EMAIL: è quello che la vetrina ha già in mano per ogni
 * profilo, quindi non serve nessuna lettura in più, e non cambia se la
 * persona cambia indirizzo di posta. Si legge dalla console Firebase
 * (Firestore Database -> users) oppure dalla barra degli indirizzi aprendo
 * il profilo con l'identificativo interno.
 *
 * La città scritta qui è anche l'ETICHETTA che si legge a schermo, quindi va
 * scritta come si vuole vederla: "Roma", non "roma". Vince su come l'hanno
 * scritta i membri nel proprio profilo, che è testo libero e infatti nel
 * database contiene già una "londra" minuscola.
 *
 * Il nome della persona NON sta qui di proposito: a schermo si usa il
 * `displayName` del profilo, così non esistono due nomi che possono
 * divergere. Qui il nome sta nei commenti, dove non può essere confuso con
 * un dato che il sito legge.
 */
export const REFERENTI = [
  /* Daniele Colasanti, referente di Roma.

     Attenzione: nel suo profilo il nome è scritto "Daniele", quindi la
     tessera dice "Daniele" e il suo indirizzo è /vetrina/daniele. Il nome lo
     può cambiare SOLO LUI, dalla pagina Join: le regole limitano gli admin a
     `status` e `updatedAt` sui profili altrui, quindi nemmeno un admin può
     scriverlo per lui. */
  { uid: 'NpHMVMQBDVMp99nL0rhQfdWqbCw2', citta: 'Roma' },
]
