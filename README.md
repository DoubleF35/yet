# YET — Young Entrepreneurs Together

Sito della community YET: giovani builder dai 14 ai 25 anni, con base a Torino.

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
7. [Privacy, cookie e cosa devi compilare](#privacy-cookie-e-cosa-devi-compilare)
8. [Struttura delle cartelle](#struttura-delle-cartelle)
9. [Scelte fatte al posto tuo](#scelte-fatte-al-posto-tuo)
10. [Problemi comuni](#problemi-comuni)

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
mostrano un avviso al posto dei dati, invece di restare bianche. È voluto — così
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
   giorni**. È comoda solo se pubblichi le regole vere nei minuti successivi —
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

### 6. Autorizzare il dominio di produzione — non saltarlo

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

**Modo semplice — dalla console:**

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
> comportamento giusto — non un guasto.
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

## Privacy, cookie e cosa devi compilare

Il sito ha due informative, raggiungibili dal footer di ogni pagina:
`/privacy` e `/cookie`. Non sono un modello copiato: descrivono quello che il
codice fa davvero, riga per riga.

### C'è un campo da riempire prima di pubblicare

Apri `src/config/legal.js` e compila `ownerName` (e, se esistono,
`ownerAddress` e `ownerVat`).

Il **titolare del trattamento** è chi si assume la responsabilità dei dati: se
YET è un'associazione costituita, il suo nome; altrimenti il nome e cognome di
una persona fisica. Non l'ho inventato di proposito — un nome sbagliato in
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
comunque rimosso — la parte che conta — e all'utente viene detto di rientrare e
ripetere l'operazione per togliere anche l'account.

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
se un giorno cambia l'inquadratura — si cambiano cinque numeri.

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
secondo — tagliare di meno farebbe comparire la cornice bianca nei primi
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
banner di consenso — toglierlo lo rende superfluo.

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
dipendono da noi: il bottone **Skip**, la fine del video, e — se l'autoplay
viene bloccato dal browser o il file non carica — il poster con il bottone
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
  `createdAt` nullo per un istante — `serverTimestamp()` si risolve solo dopo il
  giro sul server — e finirebbe in fondo alla lista invece che in cima.
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
- Oppure Firestore chiede un **indice** per la query (`failed-precondition`): il
  messaggio in console contiene un link diretto, aprilo e clicca "Crea indice".
  Ci mette un minuto.

### "Firebase non è configurato"

Manca `.env`, oppure una delle sei chiavi è vuota, oppure non hai riavviato
`npm run dev` dopo averlo scritto. Le variabili d'ambiente non hanno hot reload.

### Il profilo non si salva

Se l'errore parla di `createdAt`: stai provando a modificare un documento
creato prima di un cambio di regole. È il vincolo che impedisce a chiunque di
riscrivere la propria data di iscrizione per finire in cima all'elenco.

---

Testi dell'interfaccia in italiano, codice e identificatori in inglese.
