# YET; Young Entrepreneurs Together

Sito della community YET: giovani builder dai 14 ai 23 anni, con base a Torino.

Sito statico in React, servito da GitHub Pages, con Firebase (Auth + Firestore)
per il login e per i contenuti. **Niente backend, niente Cloud Functions**: tutto
sta nel piano gratuito Spark di Firebase.

---

## Indice

1. [Le rotte](#le-rotte)
2. [Installazione](#installazione)
3. [Configurare Firebase e il file `.env`](#configurare-firebase-e-il-file-env)
4. [Impostare i 4 admin](#impostare-i-4-admin)
5. [Pubblicare le regole di sicurezza](#pubblicare-le-regole-di-sicurezza)
6. [Deploy su GitHub Pages](#deploy-su-github-pages)
7. [Allegati alle notizie](#allegati-alle-notizie)
8. [Iscrizione con approvazione](#iscrizione-con-approvazione)
9. [Privacy, cookie e cosa devi compilare](#privacy-cookie-e-cosa-devi-compilare)
10. [Dove stanno i dati, e come non perderli](#dove-stanno-i-dati-e-come-non-perderli)
11. [Struttura delle cartelle](#struttura-delle-cartelle)
12. [Scelte fatte al posto tuo](#scelte-fatte-al-posto-tuo)
13. [Problemi comuni](#problemi-comuni)

---

## Le rotte

| Rotta       | Pagina   | Cosa fa                                                                 | Serve il login? |
| ----------- | -------- | ----------------------------------------------------------------------- | --------------- |
| `/`         | Intro    | Video a schermo intero, poi passa alla home. Solo alla prima visita.     | no              |
| `/home`     | Home     | Logo, tagline e feed delle notizie pubblicate.                           | no              |
| `/membri`   | Membri   | Griglia dei profili, con bio espandibile e link social.                  | no              |
| `/join`     | Join     | Cos'è YET; dopo il login, il form del proprio profilo.                   | per il form     |
| `/contatti` | Contatti | Canali ufficiali e mail, presi da `src/config/socials.js`.               | no              |
| `/privacy`  | Privacy  | Informativa GDPR. Descrive quello che il codice fa davvero.              | no              |
| `/cookie`   | Cookie   | Cosa viene salvato sul dispositivo, e perché non c'è il banner.          | no              |
| `/admin`    | Admin    | Scrivere, pubblicare, modificare ed eliminare le notizie.                | **solo admin**  |

Gli URL hanno il cancelletto: `https://…/yet/#/membri`. Il perché è
[più sotto](#scelte-fatte-al-posto-tuo).

---

## Installazione

Serve **Node 20 o superiore** (`node --version` per controllare).

```bash
git clone <url-del-repo>
cd yet
npm install
npm run dev
```

Il sito parte su <http://localhost:5173>.

Gli altri comandi:

```bash
npm run build     # compila in dist/
npm run preview   # serve dist/ come in produzione, per un controllo finale
```

Senza il file `.env` (passo successivo) il sito **si apre lo stesso**: le pagine
mostrano un avviso al posto dei dati, invece di restare bianche. È voluto, così
si vede subito cosa manca.

---

## Configurare Firebase e il file `.env`

Passo per passo, per chi non ha mai aperto la console Firebase.

### 1. Creare il progetto

1. Vai su <https://console.firebase.google.com> e accedi con Google.
2. **Aggiungi progetto** → dai un nome (`yet-community` va benissimo) → Continua.
3. Google Analytics: puoi **disattivarlo**, qui non serve.
4. Aspetta la creazione e premi **Continua**.

### 2. Aggiungere l'app web e copiare la configurazione

1. Nella schermata iniziale del progetto, clicca l'icona **`</>`** ("Web").
2. Dai un nickname all'app (`sito`) e **non** spuntare "Firebase Hosting":
   pubblichiamo su GitHub Pages.
3. **Registra app**. Comparirà un blocco di codice con dentro `firebaseConfig`:

   ```js
   const firebaseConfig = {
     apiKey: "AIza….",
     authDomain: "yet-community.firebaseapp.com",
     projectId: "yet-community",
     storageBucket: "yet-community.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123…"
   }
   ```

   Tieni questa pagina aperta: sono i sei valori che servono.
   Se l'hai chiusa: ingranaggio **Impostazioni progetto** → scheda **Generali**
   → in fondo, **Le tue app** → **Configurazione SDK** → **Configurazione**.

### 3. Attivare l'accesso con Google

1. Menu di sinistra → **Build** → **Authentication** → **Inizia**.
2. Scheda **Sign-in method** → **Google** → attiva l'interruttore.
3. Scegli un'email di assistenza per il progetto → **Salva**.

### 4. Creare il database

1. Menu di sinistra → **Build** → **Firestore Database** → **Crea database**.
2. Scegli la posizione (`eur3 (Europe)` per l'Italia). **Non si può cambiare
   dopo.**
3. Alla domanda sulle regole scegli **modalità di produzione**, non la modalità
   di test.

   La modalità di test lascia il database **scrivibile da chiunque per 30
   giorni**. È comoda solo se pubblichi le regole vere nei minuti successivi
   e se lo fai, non ti è servita a niente. Se invece qualcosa ti distrae, hai
   lasciato un database aperto su internet senza accorgertene.

   Con la modalità di produzione tutto è negato in partenza. La conseguenza è
   che il sito mostra `permission-denied` finché non pubblichi
   `firestore.rules`: un errore visibile e innocuo, invece di una finestra
   aperta e invisibile. Vai quindi subito al passo
   [Pubblicare le regole](#pubblicare-le-regole-di-sicurezza).

### 5. Scrivere il `.env`

```bash
cp .env.example .env
```

Apri `.env` e incolla i sei valori, uno per riga:

```
VITE_FIREBASE_API_KEY=AIza….
VITE_FIREBASE_AUTH_DOMAIN=yet-community.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yet-community
VITE_FIREBASE_STORAGE_BUCKET=yet-community.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123…
```

Poi **riavvia `npm run dev`**: le variabili d'ambiente non hanno hot reload, e
finché non riavvii continuerai a vedere l'avviso "Firebase non è configurato".

### 6. Autorizzare il dominio di produzione, non saltarlo

**Authentication** → **Settings** → **Authorized domains** → **Add domain** →
`<tuo-utente>.github.io`.

È la trappola classica: `localhost` è autorizzato in automatico, quindi il login
funziona benissimo in locale e fallisce **solo** una volta pubblicato, con
l'errore `auth/unauthorized-domain`. Fallo adesso che ci pensi.

> **Le chiavi qui sopra non sono segrete.** Finiscono comunque nel JavaScript
> che il browser scarica: Firebase è progettato così. A proteggere i dati sono
> le regole di sicurezza e la lista dei domini autorizzati, non la segretezza
> dell'`apiKey`. Teniamo `.env` fuori dal repo (è in `.gitignore`) solo per non
> legare il codice pubblico a uno specifico progetto Firebase.

---

## Impostare i 4 admin

Le email degli amministratori vanno scritte in **due posti**, e servono a due
cose diverse:

| File                    | A cosa serve                                              |
| ----------------------- | --------------------------------------------------------- |
| `src/config/admins.js`  | mostrare/nascondere il link "Admin" e la pagina `/admin`   |
| `firestore.rules`       | **impedire davvero** di scrivere le notizie                |

```js
// src/config/admins.js
export const ADMIN_EMAILS = [
  'nome.cognome@gmail.com',
  // … le altre tre
]
```

```
// firestore.rules
function adminEmails() {
  return [
    'nome.cognome@gmail.com',
    // … le stesse tre
  ];
}
```

> ### Modificare solo `admins.js` non protegge niente.
>
> Quel file decide cosa si vede, non cosa si può fare. Chiunque apra la console
> del browser può montare la pagina `/admin` lo stesso. A fermarlo c'è solo
> `firestore.rules`, perché quelle condizioni girano sui server di Google e non
> su un computer che l'utente controlla.
>
> Quindi: **cambiare la lista in `admins.js` senza ri-pubblicare le regole non
> cambia i permessi di nessuno.**

Usa le email **degli account Google con cui quelle persone fanno login**, non un
alias e non l'indirizzo aziendale se poi accedono con un altro. Vanno scritte in
minuscolo (il confronto normalizza comunque, ma tenerle pulite aiuta).

---

## Pubblicare le regole di sicurezza

Le regole stanno in [`firestore.rules`](firestore.rules). Vanno **pubblicate**:
il file nel repo, da solo, non ha alcun effetto.

> ### L'ordine conta: PRIMA le regole, POI il sito.
>
> Regole e codice del sito devono conoscere gli stessi campi. Se sfasi i due
> rilasci ottieni un `permission-denied` che non parla di permessi:
>
> - **regole vecchie + sito nuovo** → il sito scrive `role` e `status`, che le
>   regole vecchie non ammettono in `hasOnly()`: **ogni salvataggio di ogni
>   utente viene rifiutato**;
> - **regole nuove + sito vecchio** (o semplicemente non ancora ricaricato dal
>   browser) → il sito non manda `status`, e le regole non possono leggerlo dal
>   documento perché non c'è.
>
> Pubblicare **prima le regole** è l'ordine sicuro: è strettamente non
> regressivo, nessun documento che funzionava smette di funzionare. L'inverso
> lascia aperta una finestra in cui il sito è rotto.

**Modo semplice, dalla console:**

1. Console Firebase → **Firestore Database** → scheda **Regole**.
2. Cancella tutto quello che c'è e incolla il contenuto di `firestore.rules`.
3. **Pubblica**.

**Modo da riga di comando:**

```bash
npm install -g firebase-tools
firebase login
firebase init firestore     # solo la prima volta; scegli il progetto esistente
firebase deploy --only firestore:rules
```

> ### Finché non le pubblichi, il sito non legge e non scrive niente.
>
> Con il database creato in **modalità di produzione** (come consigliato sopra)
> ogni operazione è negata in partenza: il feed resta vuoto, il login riesce ma
> il profilo non si salva, e la console mostra `permission-denied`. È il
> comportamento giusto, non un guasto.
>
> Se invece hai scelto la **modalità di test**, hai il problema opposto e
> peggiore: per 30 giorni **chiunque** può scrivere nel tuo database, e allo
> scadere tutto smette di funzionare da solo. In entrambi i casi la risposta è
> la stessa: pubblica le regole adesso, non "quando c'è tempo".

Cosa fanno le regole, in breve:

- `users` e `news`: **lettura pubblica**, anche senza login.
- `users/{uid}`: uno può creare e modificare **solo il proprio** documento, e
  cancellare solo il proprio.
- `news`: creare, modificare ed eliminare **solo** se l'email è nella allowlist.
- Validazione dei campi lato server: lunghezze massime (la bio a 300 caratteri
  è imposta **qui**, non solo dal contatore della UI), nessun campo estraneo,
  `createdAt` che non può essere riscritto.
- Tutto il resto: negato.

Una cosa da sapere: **`published: false` nasconde una notizia, non la rende
segreta.** La home filtra le bozze, ma la lettura della collection è pubblica e
chiunque può interrogarla senza quel filtro. Non scrivere in una bozza niente
che non possa diventare pubblico.

---

## Deploy su GitHub Pages

### 1. La base in `vite.config.js`

```js
const REPO_NAME = 'yet'   // <-- il nome ESATTO del repository
```

Se il repo è `https://github.com/tizio/yet-site`, qui va `'yet-site'`.
Se pubblichi su `tizio.github.io` (repo "root") o su un dominio tuo, metti
`base: '/'`.

In CI questo valore viene comunque sovrascritto da `VITE_BASE`, che l'action
calcola dal nome del repository: se rinomini il repo, il deploy resta giusto
senza toccare niente.

### 2. I sei secret

**Settings** → **Secrets and variables** → **Actions** → **New repository
secret**, uno alla volta, con gli stessi valori che hai in `.env`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

(`VITE_FIREBASE_MEASUREMENT_ID` è opzionale.)

### 3. Attivare Pages

**Settings** → **Pages** → **Source**: scegli **GitHub Actions**.

Non "Deploy from a branch": con quella impostazione il workflow builda, carica
l'artefatto e poi il deploy viene rifiutato.

### 4. Il primo push

```bash
git add .
git commit -m "Primo commit del sito YET"
git branch -M main
git remote add origin https://github.com/<utente>/<repo>.git
git push -u origin main
```

L'action parte da sola (scheda **Actions**). Al termine il sito è su
`https://<utente>.github.io/<repo>/`.

Da lì in poi ogni push su `main` ripubblica. Puoi anche lanciarlo a mano da
**Actions** → **Deploy su GitHub Pages** → **Run workflow**: utile dopo aver
cambiato un secret, che da solo non fa ripartire niente.

---

## Allegati alle notizie

Da `/admin`, sotto il corpo di ogni notizia, c'è il riquadro **Allegati**: si
incolla un indirizzo e si aggiunge. Massimo 8 per notizia.

- Gli indirizzi che finiscono in `.jpg`, `.png`, `.webp`, `.gif`, `.avif`,
  `.svg` diventano **immagini** e vengono mostrate dentro la notizia, in
  griglia, cliccabili per aprirle a dimensione piena.
- Tutto il resto diventa un **link**, elencato sotto al testo.
- Il tipo si può forzare con «Tratta come immagine / Tratta come link»: serve
  per le immagini servite da un CDN senza estensione nell'URL, e per le foto
  enormi che è meglio non caricare dentro la pagina.

### Sono ammessi solo `http` e `https`

Un URL finisce dentro un attributo `href` o `src`. Uno schema come
`javascript:` in un href è codice che parte al clic, è il classico XSS.
Vengono quindi rifiutati `javascript:`, `data:`, `file:` e gli indirizzi senza
schema.

Il controllo è fatto **due volte**, ed è voluto: quando si salva *e* quando si
mostra. La seconda è quella che conta davvero, perché è l'unica che protegge
anche i dati scritti prima che questa validazione esistesse, o inseriti a mano
dalla console Firebase. La logica sta tutta in `src/lib/attachments.js`, usata
sia dall'editor sia dalla pagina che li mostra, così le due non possono
divergere.

Nelle regole il controllo si ferma a «è una lista e non supera 8 elementi»:
le Security Rules non sanno iterare una lista, non esiste un «per ogni
elemento». Regge lo stesso perché su `news` scrive **solo un admin in
allowlist**: il rischio non è l'estraneo che inietta dati, è l'amministratore
che sbaglia.

### Caricare foto e file dal dispositivo

Nell'editor degli allegati c'è **«Carica una foto o un file»**: si sceglie dal
telefono o dal computer e finisce dentro la notizia. Immagini (JPEG, PNG, WebP,
AVIF) e PDF. Nessuna configurazione, nessun costo, nessuna carta.

#### Come funziona, e perché così

Firebase Storage, il posto naturale per i file, **non è disponibile sul piano
Spark**: dal 3 febbraio 2026 un progetto senza carta collegata non ha accesso a
nessun bucket. Quindi i file finiscono in Firestore.

Ma un documento Firestore non può superare **1 MiB**, e una foto da telefono ne
pesa dieci. Da qui le due scelte che reggono tutto:

1. **Le immagini vengono compresse nel browser** prima di partire
   (`src/lib/imageCompress.js`): ridimensionate a 2000px di lato lungo e
   riesportate in WebP, abbassando la qualità solo se serve.

   Misurato: una foto da **12 MP (2 MB) diventa 279 KB** mantenendo 2000×1500,
   in mezzo secondo.

2. **Ogni file sta in un documento suo**, nella collection `media`. Se stessero
   dentro la notizia, quel megabyte andrebbe diviso fra il testo e tutte le
   foto, una sola immagine grande non lascerebbe posto nemmeno al titolo.
   Separandoli, **ognuna ha il suo megabyte** e una notizia può averne quante
   ne servono. In più la home scarica l'elenco delle notizie senza tirarsi
   dietro le immagini: il testo compare subito, le foto un attimo dopo.

#### Cosa ci perdi, detto chiaro

Le immagini sono ricodificate **con perdita**: quello che si carica non è più
l'originale e non si recupera. Per le foto di un incontro va benissimo. Per
un'immagine che deve restare nitida a schermo intero, no, in quel caso conviene
ospitarla altrove e allegarne l'indirizzo, che continua a funzionare.

I **PDF non si comprimono**: passano solo se stanno sotto circa 650 KB. Sopra,
il messaggio lo dice con il numero in mano e suggerisce Drive.

#### Se un giorno colleghi una carta

Con il piano Blaze, Firebase Storage toglie ogni limite: PDF di qualsiasi peso,
immagini a piena risoluzione, CDN. Il codice per usarlo **non è nel repo**: era
stato scritto, ma non essendo più collegato a nulla sarebbe rimasto lì a
marcire senza che nessuno lo eseguisse mai. Si trova nella storia di git
(`git log --diff-filter=D -- src/lib/storage.js`) e comunque riscriverlo è
mezz'ora.

Attenzione, se lo fai: la soglia gratuita dei bucket `.firebasestorage.app` vale
**solo per `us-central1`, `us-east1`, `us-west1`**. In Europa si paga dal primo
byte, e la regione non si cambia dopo.

---

## Iscrizione con approvazione

Chi si iscrive **non compare subito** fra i membri: il profilo nasce in stato
`pending` e resta invisibile finché uno dei quattro amministratori non lo
approva da `/admin` → «Richieste di iscrizione».

### Cosa lo rende una barriera vera e non una formalità

Sono tre righe in `firestore.rules`, e vale la pena conoscerle perché ognuna
chiude un modo diverso di aggirare l'approvazione:

| Regola | Cosa impedisce |
| ------ | -------------- |
| in creazione `status == 'pending'` | auto-approvarsi al primo salvataggio |
| in modifica `status == stored().status` | promuoversi da soli dopo, con una richiesta scritta a mano |
| l'admin può cambiare `affectedKeys().hasOnly(['status','updatedAt'])` | che un admin riscriva la bio di qualcun altro mentre approva |

E la lettura pubblica è concessa **solo** ai profili approvati: chi è in attesa
lo vedono lui stesso e gli amministratori. Una richiesta rifiutata non lascia
in giro il nome di chi l'aveva fatta.

> Conseguenza tecnica da non dimenticare: `listUsers()` **deve** filtrare su
> `where('status','==','approved')`. Firestore non filtra i risultati in base
> alle regole, pretende che la query sia costruita in modo che ogni risultato
> le soddisfi. Senza quel `where` la query viene rifiutata in blocco, non
> ridotta. Se un giorno vedi `permission-denied` sulla pagina Membri, guarda
> lì per primo.

Gli **admin nascono già approvati**. Non è una scorciatoia: se dovessero passare
dalla propria coda, al primo avvio non ci sarebbe nessuno ad approvare il primo
di loro.

### La notifica agli amministratori

Quando arriva una richiesta, la vedete **aprendo `/admin`**: c'è il conteggio
«N in attesa» accanto al titolo.

Non arriva una mail, e non è una dimenticanza: **sul piano gratuito Spark non è
possibile inviare email**. Serve del codice che giri su un server, e su Firebase
quel codice sono le Cloud Functions, disponibili solo dal piano Blaze (a
consumo). Le alternative, se un giorno la cosa diventa scomoda:

1. **Passare al piano Blaze** e usare l'estensione *Trigger Email*, oppure una
   Cloud Function di venti righe che parte quando nasce un documento `pending`.
   È la strada pulita. Con questi volumi resterebbe dentro la soglia gratuita,
   ma richiede una carta di credito sul progetto.
2. **Un servizio esterno tipo EmailJS**, che manda la mail dal browser di chi si
   iscrive. Funziona senza backend, ma introduce una terza parte che vede i
   dati: andrebbe aggiunta all'informativa privacy, e forse comparirebbe la
   necessità del banner cookie che oggi non c'è.
3. **Lasciare così.** Con quattro amministratori e un volume di iscrizioni
   basso, aprire il pannello ogni tanto è probabilmente sufficiente.

Ho scelto la 3 di default perché è l'unica che non cambia né il piano tariffario
né la storia della privacy. Dimmi se preferisci una delle altre due.

### Il campo `role`

Serve alla sezione «Chi organizza» della pagina Membri. È scritto dal client ma
non deciso dal client: le regole pretendono che corrisponda esattamente
all'esito del confronto fra l'email del token e la allowlist, quindi chi non è
in lista e prova a salvarsi `role: 'admin'` si vede rifiutare l'intera
scrittura.

Esiste perché i documenti `users` **non contengono l'email**, l'informativa
privacy promette che non venga mai pubblicata, e senza un campo apposta la
pagina non avrebbe modo di distinguere gli organizzatori dagli altri.

Se aggiungi qualcuno alla allowlist mesi dopo la sua iscrizione, il suo `role`
viene riallineato da solo al primo accesso successivo (`reconcileUserRole` in
`src/lib/db.js`).

---

## Privacy, cookie e cosa devi compilare

Il sito ha due informative, raggiungibili dal footer di ogni pagina:
`/privacy` e `/cookie`. Non sono un modello copiato: descrivono quello che il
codice fa davvero, riga per riga.

### C'è un campo da riempire prima di pubblicare

Apri `src/config/legal.js` e compila `ownerName` (e, se esistono,
`ownerAddress` e `ownerVat`).

Il **titolare del trattamento** è chi si assume la responsabilità dei dati: se
YET è un'associazione costituita, il suo nome; altrimenti il nome e cognome di
una persona fisica. Non l'ho inventato di proposito, un nome sbagliato in
un'informativa è peggio di un campo vuoto.

Finché il campo resta al segnaposto, la pagina `/privacy` mostra un riquadro
coral che te lo ricorda. Sparisce da solo quando lo compili.

### Perché non c'è il banner dei cookie

Le linee guida del Garante (2021) chiedono il consenso preventivo solo per i
cookie di **profilazione** e per i tracciamenti non necessari. Per quelli
**tecnici** basta l'informativa.

Qui non c'è niente della prima categoria: nessuna statistica, nessuna
pubblicità, nessun widget di terzi. E i caratteri tipografici sono
**impacchettati nel sito** (`@fontsource/inter`) invece di essere chiesti al CDN
di Google: aprire una pagina non comunica l'IP di nessuno a terzi. Da qui la
scelta di mettere l'informativa e non il banner.

> **Se aggiungi Google Analytics, un pixel, una mappa incorporata o un video di
> YouTube, questo ragionamento cade** e il banner con consenso preventivo
> diventa obbligatorio. Aggiornare anche `/privacy` e `/cookie`, non solo il
> codice.

### Il diritto di cancellazione è implementato, non solo promesso

Nella pagina Join, in fondo, chi ha un profilo trova "Cancella il mio profilo":
rimuove il documento Firestore **e** l'account Firebase, con conferma a due
passi. Lo permettono già le regole (`allow delete: if isOwner(uid)`).

Un dettaglio: Firebase rifiuta di cancellare un account con un accesso vecchio
di ore (`auth/requires-recent-login`). In quel caso il profilo pubblico viene
comunque rimosso, la parte che conta, e all'utente viene detto di rientrare e
ripetere l'operazione per togliere anche l'account.

---

## Dove stanno i dati, e come non perderli

### Il deploy non tocca i dati

Sono due posti separati, ed è la cosa più utile da sapere:

| Cosa | Dove sta | Cosa succede a ogni deploy |
| ---- | -------- | -------------------------- |
| Codice del sito | GitHub → GitHub Pages | viene sostituito |
| Profili e notizie | Firestore (Google) | **non viene toccato** |

Puoi ripubblicare il sito cento volte, tornare a un commit vecchio, sbagliare
un merge: i dati restano dove sono. Il codice non li contiene e non li
sovrascrive. L'unica cosa che agisce sui dati sono le **regole**, e anche
quelle possono al massimo bloccare l'accesso, non cancellare.

### Quello che invece può andare perso

Sul piano gratuito Spark **Firebase non fa backup**: niente copie programmate,
niente ripristino a un istante preciso (sono funzioni del piano Blaze). Quindi:

- un admin che elimina la notizia sbagliata → sparita;
- un membro che usa «Cancella il mio profilo» → sparito;
- una regola scritta male che lascia scrivere qualcuno che non doveva → nessun
  modo di tornare indietro.

Per questo c'è l'export.

### Fare un backup

```bash
npm run backup
```

Scrive un JSON in `backups/`, che è già in `.gitignore`, contiene dati
personali dei membri e non deve finire nel repo.

Lo script funziona in due modi e **dice sempre quale ha usato**, perché un
backup che si crede completo e non lo è sarebbe peggio di nessun backup:

- **parziale**, senza configurare niente: prende tutte le notizie (bozze
  comprese) e i profili approvati. Restano fuori le richieste in attesa e
  quelle rifiutate, perché le regole non le rendono leggibili pubblicamente.
- **completo**, con una chiave di servizio: prende tutto.

  ```bash
  npm install --save-dev firebase-admin
  # console Firebase → Impostazioni progetto → Account di servizio
  #                  → "Genera nuova chiave privata"
  export GOOGLE_APPLICATION_CREDENTIALS=/percorso/della/chiave.json
  npm run backup
  ```

> ⚠️ **La chiave di servizio scavalca ogni regola di sicurezza.** Vale più
> delle chiavi in `.env`, che sono pubbliche per progettazione. Non va nel
> repo (`.gitignore` la copre), non va in chat, non va su un Drive condiviso.

Quanto spesso? Non c'è un modo di automatizzarlo senza un server, quindi vale
la regola pratica: **prima di toccare le regole** e ogni tanto quando la
community cresce.

### Ripristinare

```bash
npm run restore -- backups/yet-2026-08-09T06-37-23.json            # prova
npm run restore -- backups/yet-2026-08-09T06-37-23.json --scrivi   # applica
```

Senza `--scrivi` non scrive niente: elenca soltanto cosa verrebbe ricreato e
cosa sovrascritto. È voluto, è lo strumento che si usa quando qualcosa è già
andato storto, cioè nel momento in cui si sbaglia più facilmente.

Il ripristino **non cancella** i documenti creati dopo il backup: chi ha
continuato a usare il sito mentre sistemavi le cose non deve perdere il
proprio lavoro. Se qualcosa va tolto, si toglie a mano.

Serve la chiave di servizio anche qui: riscrivere il documento di un altro
utente è vietato dalle regole a chiunque, amministratori compresi.

> Onestà sul collaudo: il percorso di **scrittura** del ripristino non è mai
> stato eseguito contro un progetto vero, perché richiede una chiave di
> servizio che non è mai esistita su questa macchina. Sono verificati il
> caricamento del backup, il confronto con il server e tutti i controlli che
> impediscono di scrivere per sbaglio. Fai la prova senza `--scrivi` e leggi
> il riepilogo prima di fidarti.

---

## Struttura delle cartelle

```
yet/
├── public/                    asset serviti così come sono
│   ├── logo.png               486x291, trasparente
│   ├── hero.mp4               1280x720, 5,1 s, l'animazione della intro
│   ├── hero-poster.jpg        960x720, fallback della intro
│   ├── hands.png              162x291, le due lancette, elemento decorativo
│   └── icon-32/180/512.png    favicon
│
├── src/
│   ├── main.jsx               entry: HashRouter + AuthProvider
│   ├── App.jsx                tutte le rotte, in un posto solo
│   │
│   ├── config/
│   │   ├── admins.js          allowlist admin (SOLO per la UI)
│   │   ├── socials.js         canali, mail e testi della community
│   │   └── legal.js           titolare del trattamento e data delle informative
│   │
│   ├── lib/
│   │   ├── firebase.js        init difensiva; espone isFirebaseConfigured
│   │   ├── auth.jsx           AuthProvider + useAuth()
│   │   └── db.js              tutte le query Firestore, in un posto solo
│   │
│   ├── components/            Navbar, Layout, Footer, Avatar, Skeleton,
│   │                          EmptyState, ErrorState, HandsDivider,
│   │                          RequireAdmin, ScrollToTop
│   │
│   ├── pages/                 Intro, Home, Membri, Join, Contatti, Admin,
│   │                          Privacy, Cookie
│   │
│   └── styles/
│       ├── theme.css          TUTTI i token: colori, scala tipografica,
│       │                      spazi, ritaglio del video. Si tocca solo qui.
│       └── global.css         reset, tipografia di base, .container, focus
│
├── scripts/
│   ├── backup.mjs             export di Firestore in JSON  (npm run backup)
│   └── restore.mjs            ripristino, dry-run di default (npm run restore)
│
├── firestore.rules            la protezione VERA. Va pubblicata.
├── .env.example               le chiavi da riempire
└── .github/workflows/deploy.yml
```

Due regole che tengono in piedi il resto:

- **Nessun componente importa `firebase/firestore`.** Tutte le query passano da
  `src/lib/db.js`. Cambiare modello dati significa toccare un file.
- **Nessun colore scritto a mano fuori da `theme.css`.** Tutto il CSS usa le
  variabili. Cambiare la palette significa cambiare tre righe.

---

## Scelte fatte al posto tuo

Dove la richiesta lasciava spazio, ho scelto la strada più semplice. Eccole
tutte, con il perché e come cambiarle.

### 1. `HashRouter`, quindi gli URL hanno il `#`

GitHub Pages serve file statici e non sa riscrivere `/membri` su `index.html`:
con un router normale, ricaricare la pagina su una rotta profonda darebbe 404.
Con l'hash il server vede sempre e solo `/`.

Il prezzo sono URL come `…/yet/#/membri`. Se un domani metti un dominio tuo con
un hosting che sa fare i rewrite, si passa a `BrowserRouter` cambiando una riga
in `src/main.jsx`.

### 2. Il video è ritagliato in CSS, non ri-codificato

`hero.mp4` è 1280x720, ma l'animazione vive in un riquadro più piccolo, con
attorno una cornice **bianca** che non è il beige del sito. Andava tolta.

Non ho ri-codificato il file (`ffmpeg` non è disponibile su questa macchina):
il video resta l'originale e il ritaglio lo fa il CSS, mostrando solo la parte
buona. Il vantaggio è che non c'è perdita di qualità e non serve rifare il file
se un giorno cambia l'inquadratura, si cambiano cinque numeri.

I numeri **sono misurati sul file vero**, non stimati: il video è stato
disegnato su una canvas a sette istanti diversi, cercando per ognuno dove il
bianco lascia il posto al beige. Il risultato:

```
bordo sinistro x = 280    bordo destro  x = 999   ->  720 px
bordo superiore y = 10    bordo inferiore y = 711 ->  702 px
```

Una cosa che si vede solo misurando: i bordi laterali sono identici per tutti i
5 secondi, ma **fino a circa 1 s il pannello beige è alto 702 px e dopo si
allarga a 720**. Il ritaglio giusto è l'intersezione, cioè i 702 px del primo
secondo, tagliare di meno farebbe comparire la cornice bianca nei primi
fotogrammi.

Le variabili tengono 4 px di margine interno per lato, contro la frangia di un
pixel che comparirebbe quando il browser scala il video. Stanno in
`src/styles/theme.css`, sezione 8:

```css
--hero-crop-w: 712;   --hero-crop-h: 692;
--hero-crop-x: 284;   --hero-crop-y: 14;
```

Se arriva un video rigirato: cambia questi quattro numeri e basta, nessun
componente va toccato.

C'è anche `--hero-color-fix: brightness(1.04)`, che riallinea il beige del video
(misurato: `rgb(228,223,218)`) a quello del sito (`#ECEAE4`). Senza, durante la
dissolvenza finale si vede il gradino fra i due beige. Se un domani il video
viene riesportato con il colore giusto, portalo a `1`.

### 3. `hero-poster.jpg` è generato, non è il primo fotogramma vero

Sempre per via di `ffmpeg`. È un'immagine 960x720 con il fondo beige e il logo
al centro. Serve come poster del video e come schermata per chi ha attivato
"riduci le animazioni".

Per sostituirlo con un fotogramma vero: esporta il frame che preferisci,
**ritagliato** alla regione utile (`x 284, y 14, 712x692`), e salvalo come
`public/hero-poster.jpg`.

### 4. `hands.png` è ritagliato dal logo

Contiene **entrambe** le lancette come stanno nel marchio: la freccia coral e la
barra nera diagonale. Non l'ho ricolorato tutto in coral per non allontanarlo
dal logo. Lo usano `HandsDivider` (i divisori fra le sezioni) ed `EmptyState`.

### 5. Il font è impacchettato, non chiesto a Google

Inter arriva da `@fontsource/inter`, importato in `src/main.jsx`, e viene
servito dallo stesso dominio del sito. Non è una scelta di prestazioni: chiedere
il font al CDN di Google significa che il browser di ogni visitatore consegna il
proprio indirizzo IP a un server di Google prima ancora che la pagina sia
disegnata, e senza poter dire di no. È il trasferimento che rende necessario il
banner di consenso, toglierlo lo rende superfluo.

Sono importati solo il sottoinsieme latino e i cinque pesi che il tema usa
davvero: spedire cirillico, greco e vietnamita in nove pesi a chi legge italiano
sarebbe mezzo megabyte buttato.

### 6. CSS Modules invece di CSS globale

Ogni componente ha il suo `.module.css` accanto. I nomi delle classi vengono
resi unici in fase di build, quindi due `.card` in due pagine diverse non si
pestano i piedi. Restano globali solo `theme.css` (le variabili) e `global.css`
(reset e utility).

### 7. L'intro si vede una volta sola

Alla prima visita l'intro parte da sola; poi un flag in `localStorage`
(`yet_intro_seen`) fa saltare direttamente alla home.

Per rivederla, dalla console del browser:

```js
localStorage.removeItem('yet_intro_seen'); location.reload()
```

Il flag viene scritto **quando l'intro parte**, non quando finisce: altrimenti
chi ricarica a metà video se la rivedrebbe da capo ogni volta.

L'intro ha tre vie d'uscita, perché il video può non partire per motivi che non
dipendono da noi: il bottone **Skip**, la fine del video, e, se l'autoplay
viene bloccato dal browser o il file non carica, il poster con il bottone
**Entra**. Con "riduci le animazioni" attivo il video non parte proprio.

### 8. Le email admin sono segnaposto

`admin1@yetcommunity.it` … `admin4@yetcommunity.it`, sia in `admins.js` sia in
`firestore.rules`. Vanno sostituite, in entrambi i file.

### 9. Altre scelte minori

- **`CONTACT_EMAIL` è `info.yetcommunity@gmail.com`** e i link social sono segnaposto
  credibili: sono tutti in `src/config/socials.js`, una riga per canale.
- **I testi della community** (descrizione, fascia d'età, città) stanno anch'essi
  in `socials.js`, in `COMMUNITY`, perché li usano sia la Home sia la Join e non
  devono poter divergere.
- **Il feed viene riordinato anche lato client.** Una notizia appena creata ha
  `createdAt` nullo per un istante - `serverTimestamp()` si risolve solo dopo il
  giro sul server, e finirebbe in fondo alla lista invece che in cima.
- **La conferma di eliminazione non usa `window.confirm`**: il bottone diventa
  "Sicuro? Sì / No". Un dialogo di sistema si può bloccare a livello di browser,
  e stona con il resto.

---

## Problemi comuni

### Pagina bianca dopo il deploy

La `base` non corrisponde al nome del repo. Apri la console del browser: se vedi
404 su `/assets/index-….js`, è quello. Correggi `REPO_NAME` in
`vite.config.js` (o lascia fare a `VITE_BASE` nell'action) e ripubblica.

### Il login funziona in locale ma non in produzione

`auth/unauthorized-domain`. Manca il dominio in **Authentication → Settings →
Authorized domains**: aggiungi `<tuo-utente>.github.io`. `localhost` è
autorizzato in automatico, ed è il motivo per cui in locale non te ne accorgi.

### "permission-denied" quando salvo il profilo

Nel 99% dei casi le regole pubblicate sul database sono più vecchie di
`firestore.rules`. Per accertarlo in trenta secondi invece di dedurlo: console
Firebase → Firestore Database → **Regole**, e guarda il testo pubblicato.

- Se dentro `usersKeysOk()` **non compare `'role'`**, sono vecchie: incolla il
  file aggiornato e premi Pubblica.
- Se le regole sono aggiornate ma l'errore resta, apri il documento
  `users/{uid}` di chi non riesce a salvare: se **non ha il campo `status`** è
  un profilo nato prima dell'approvazione. Si sana da solo al primo accesso
  successivo (`reconcileUserRole`), a patto che le regole pubblicate contengano
  `storedStatus()`.

Il sintomo secondario che distingue i due casi senza aprire niente: con le
regole vecchie **nemmeno un iscritto nuovo** riesce a creare il profilo, e la
pagina Join continua a mostrare «Crea il mio profilo». Con le regole nuove i
nuovi funzionano e falliscono solo i preesistenti.

### "permission-denied" quando salvo una notizia

Tre possibilità, in ordine di probabilità:

1. La tua email non è nella allowlist **dentro `firestore.rules`** (averla messa
   solo in `admins.js` non basta: quella nasconde il bottone, non dà i permessi).
2. Le regole non sono state pubblicate dopo la modifica.
3. Stai usando un account Google diverso da quello che hai messo in lista.
   Controlla in alto a destra con quale sei entrato.

### Le notizie non compaiono sulla home

- Sono salvate come **bozza**: apri `/admin` e usa "Pubblica".
- Oppure le regole non sono pubblicate e la lettura viene rifiutata: guarda la
  console, l'errore lo dice.
- Non dovrebbe più essere un problema di **indici**: la query della home usa
  solo `where('published','==',true)` e ordina lato client, apposta per non
  dipendere da un indice composto che va creato a mano. Se rivedi
  `failed-precondition`, qualcuno ha rimesso un `orderBy` o un secondo `where`
  in `listenNews`: il messaggio in console contiene un link che crea l'indice
  con un clic.

### Mi sono iscritto ma non compaio fra i membri

È il comportamento previsto: la richiesta è in attesa di approvazione. Un
amministratore la trova in `/admin` → «Richieste di iscrizione». Nel frattempo
la pagina Join mostra un riquadro che lo dice.

### "Firebase non è configurato"

Manca `.env`, oppure una delle sei chiavi è vuota, oppure non hai riavviato
`npm run dev` dopo averlo scritto. Le variabili d'ambiente non hanno hot reload.

### Il profilo non si salva

Se l'errore parla di `createdAt`: stai provando a modificare un documento
creato prima di un cambio di regole. È il vincolo che impedisce a chiunque di
riscrivere la propria data di iscrizione per finire in cima all'elenco.

---

Testi dell'interfaccia in italiano, codice e identificatori in inglese.
