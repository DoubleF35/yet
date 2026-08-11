/* =========================================================================
   YET, chi è admin

   ATTENZIONE, LEGGERE PRIMA DI TOCCARE QUESTO FILE.

   Questa lista NON protegge niente. Vive nel bundle JavaScript che il browser
   scarica: chiunque apra i DevTools la legge, e chiunque sappia usare la
   console può forzare l'interfaccia a mostrargli la pagina /admin. Serve a una
   cosa sola: decidere quali voci di menu e quali schermate ha senso mostrare.

   La protezione vera sono le regole in `firestore.rules`. Sono l'unica cosa
   che gira sui server di Google e che un client non può aggirare: se la tua
   email non è nella allowlist delle regole, ogni scrittura viene rifiutata
   con `permission-denied` anche se qui dentro sei elencato.

   QUINDI: per aggiungere o togliere un admin servono DUE modifiche.

     1. questo file  -> l'interfaccia gli mostra /admin
     2. firestore.rules -> il server gli lascia scrivere

   E dopo la 2 va ripubblicato il file delle regole (dalla console Firebase,
   Firestore Database -> Regole -> Pubblica, oppure
   `firebase deploy --only firestore:rules`). Modificare le regole in locale
   senza ripubblicarle non ha alcun effetto: è l'errore più facile da fare.

   Cambiare solo questo file produce il bug più fastidioso possibile, un
   admin che vede la pagina, compila il form e si becca "permission-denied"
   al salvataggio.
   ========================================================================= */

/**
 * Email degli amministratori, in minuscolo.
 *
 * Sono segnaposto: vanno sostituite con gli indirizzi Google reali di chi
 * gestisce le notizie. Devono essere gli stessi account con cui quelle
 * persone fanno login (l'email del provider Google), non un alias.
 */
export const ADMIN_EMAILS = [
  'fedefas.210@gmail.com',
  'greta.dal19@gmail.com',
  'lucafrancesco.rollino@gmail.com',
  'mattiapapa.075@gmail.com',
]

/**
 * Dice se un'email appartiene a un admin.
 *
 * Tollerante di proposito, perché il valore arriva da tre posti diversi e
 * nessuno garantisce la forma:
 *  - `user.email` di Firebase può essere `null` (account senza email);
 *  - Google restituisce a volte la maiuscola iniziale scelta dall'utente,
 *    e le parti locali degli indirizzi email sono formalmente
 *    case-sensitive ma nessun provider reale le distingue;
 *  - un'email incollata a mano in questa lista può portarsi dietro uno
 *    spazio in coda che a occhio non si vede.
 *
 * Il confronto normalizza entrambi i lati invece di fidarsi che la lista sia
 * scritta bene: così una svista nella costante non diventa un admin che non
 * riesce più a entrare.
 *
 * @param {string|null|undefined} email
 * @returns {boolean}
 */
export function isAdminEmail(email) {
  if (typeof email !== 'string') return false

  const normalized = email.trim().toLowerCase()
  if (!normalized) return false

  // Un ciclo su quattro elementi non ha bisogno di un Set. E un Set costruito
  // al caricamento del modulo diventerebbe silenziosamente vecchio se qualcuno
  // modificasse ADMIN_EMAILS a runtime (nei test, per esempio).
  return ADMIN_EMAILS.some(
    (candidate) => typeof candidate === 'string' && candidate.trim().toLowerCase() === normalized,
  )
}
