/**
 * Stato di autenticazione, in un contesto solo.
 *
 * Espone `useAuth()` a tutta l'app. Due cose che sembrano dettagli e non lo
 * sono, e che spiegano metà del codice qui sotto:
 *
 *  1. Login e profilo sono DUE caricamenti distinti. `loading` è "Firebase mi
 *     ha detto se sono loggato?", `profileLoading` è "ho letto users/{uid}?".
 *     Fonderli in un flag solo fa sfarfallare la navbar a ogni cambio pagina.
 *
 *  2. Le risposte asincrone possono tornare dopo un logout. Se l'utente esce
 *     mentre il profilo sta caricando, la risposta tardiva non deve
 *     ripopolare lo stato con i dati di chi non c'è più.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  deleteUser,
} from 'firebase/auth'

import { auth, isFirebaseConfigured } from './firebase.js'
import {
  createUserProfileFromGoogle,
  deleteUserProfile,
  getUserProfile,
  reconcileUserRole,
} from './db.js'
import { isAdminEmail } from '../config/admins.js'

const AuthContext = createContext(null)

/**
 * Siamo nel browser INTERNO di un'app (Instagram, LinkedIn, TikTok, Facebook)
 * invece che in Safari o in Chrome?
 *
 * Serve a dare un messaggio invece di un fallimento muto, e il motivo non
 * dipende da noi: dal 2021 Google RIFIUTA di processare l'accesso OAuth dentro
 * una WebView incorporata e risponde "403 disallowed_useragent". La ragione e'
 * sensata (l'app che possiede la WebView potrebbe leggere quello che digiti,
 * password compresa, o iniettare script nella pagina di login) ed e' imposta
 * da Google: non esiste nessuna impostazione, ne' nostra ne' dell'utente, che
 * la aggiri. L'unica via e' aprire il sito nel browser vero.
 *
 * E' un riconoscimento dallo user agent, cioe' un metodo fragile per
 * definizione. Va bene perche' il costo di sbagliare e' asimmetrico: se
 * riconosce a torto mostra un avviso di troppo, se non riconosce l'utente
 * prende comunque il messaggio d'errore dopo il tentativo. In nessun caso
 * l'accesso viene impedito: il bottone resta sempre cliccabile.
 */
export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''

  /* FBAN/FBAV/FB_IAB/FBIOS sono i marcatori di Facebook e Messenger;
     Instagram e LinkedInApp si dichiarano per nome; `musical_ly` e
     `BytedanceWebview` sono TikTok, che non scrive "TikTok" nello user agent.

     NIENTE \b attorno alle alternative: TikTok si presenta come
     `musical_ly_2023`, e un confine di parola dopo `musical_ly` non
     corrisponde perche' subito dopo c'e' ancora un carattere di parola. Ci
     sono cascato scrivendolo, ed e' venuto fuori solo provando gli user agent
     veri: qui serve la sottostringa secca.

     NON vanno inclusi il browser dell'app Google, Gmail e simili: quelli
     usano le Custom Tabs (Android) o SFSafariViewController (iOS), che sono
     browser veri e l'accesso ci funziona. */
  if (
    /FBAN|FBAV|FB_IAB|FBIOS|Instagram|LinkedInApp|Line\/|TikTok|musical_ly|BytedanceWebview|Snapchat|Twitter|WhatsApp|Telegram|MicroMessenger/i.test(
      ua,
    )
  ) {
    return true
  }

  /* WHATSAPP SU iOS NON SI DICHIARA, ed e' il buco che ha fatto passare il
     caso vero: un utente arrivato dal gruppo WhatsApp e' finito sulla pagina
     "Unable to process request due to missing initial state" di
     firebaseapp.com, perche' il controllo qui sopra cerca la stringa
     "WhatsApp" e su iOS quella stringa non c'e'. Su Android c'e', su iOS no.

     Quindi si riconosce per esclusione. Un WKWebView incorporato si dichiara
     Safari ma NON scrive `Version/`, che il Safari vero mette sempre. E'
     l'euristica su cui si appoggiano tutte le librerie che affrontano questo
     problema, e copre in un colpo WhatsApp, Telegram e ogni altra app iOS che
     non si firma.

     `standalone` va escluso: e' una PWA aggiunta alla schermata home, che e'
     un contesto legittimo dove l'accesso funziona e che non va bloccato. */
  const iOS = /iPhone|iPad|iPod/i.test(ua)
  if (!iOS) return false

  /* Il Safari vero scrive SEMPRE `Version/17.5`. Un WKWebView incorporato no.
     E' l'unico segnale affidabile, e vanno evitate due trappole in cui sono
     cascato scrivendolo, trovate solo provando gli user agent reali:

     1. NON si puo' pretendere la stringa `Safari`. Lo user agent di WhatsApp
        su iOS finisce con `AppleWebKit/605.1.15 (KHTML, like Gecko)
        Mobile/15E148` e la parola Safari non c'e' affatto. Pretenderla
        lasciava passare proprio il caso da cui e' partito tutto.

     2. NON basta l'assenza di `Version/`. Chrome, Firefox ed Edge su iOS sono
        obbligati da Apple a usare WebKit e nemmeno loro scrivono `Version/`,
        ma sono browser veri e l'accesso ci funziona: bloccarli sarebbe un
        danno peggiore del problema. Si riconoscono dal proprio marcatore. */
  const browserVeroIOS = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|DuckDuckGo|Brave/i.test(ua)
  const haVersion = /Version\//i.test(ua)

  /* Una PWA aggiunta alla schermata home e' un contesto legittimo: l'accesso
     ci funziona e non va bloccata. */
  const pwa =
    typeof navigator.standalone === 'boolean'
      ? navigator.standalone
      : typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches

  return !haVersion && !browserVeroIOS && !pwa
}

/** Codice interno, non di Firebase: la WebView non produce un errore suo,
 *  perche' il tentativo non arriva nemmeno a partire. */
const IN_APP_BROWSER = 'yet/in-app-browser'

/**
 * I codici di errore di Firebase in italiano.
 *
 * Non è cosmesi: "auth/unauthorized-domain" non dice a nessuno che deve
 * aggiungere il dominio in console, ed è esattamente l'errore che prende
 * chiunque deployi per la prima volta su GitHub Pages.
 */
function describeAuthError(error) {
  const code = error?.code ?? ''
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Accesso annullato: la finestra di Google è stata chiusa.'
    case 'auth/popup-blocked':
    case 'auth/operation-not-supported-in-this-environment':
      return (
        'Il browser ha bloccato la finestra di Google. Consenti i popup per questo sito e ' +
        'riprova, oppure apri il sito in Safari o Chrome.'
      )
    case IN_APP_BROWSER:
      return (
        'Stai navigando dentro un’altra app (Instagram, LinkedIn o simili), e Google non ' +
        'permette l’accesso da qui. Apri il sito in Safari o in Chrome e riprova: dal menu ' +
        'dell’app, la voce “Apri nel browser”.'
      )
    case 'auth/network-request-failed':
      return 'Nessuna connessione con Google. Controlla la rete e riprova.'
    case 'auth/unauthorized-domain':
      return (
        'Questo dominio non è autorizzato in Firebase. Aggiungilo in ' +
        'Authentication → Settings → Authorized domains.'
      )
    case 'auth/operation-not-allowed':
      return (
        'L’accesso con Google non è attivo sul progetto Firebase. ' +
        'Attivalo in Authentication → Sign-in method.'
      )
    case 'auth/too-many-requests':
      return 'Troppi tentativi ravvicinati. Aspetta qualche minuto e riprova.'
    case 'app/not-configured':
      return error.message
    default:
      return error?.message || 'Accesso non riuscito. Riprova fra poco.'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  // Parte a false se Firebase non c'è: senza, l'app resterebbe in caricamento
  // per sempre perché onAuthStateChanged non verrà mai chiamato.
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState(
    isFirebaseConfigured
      ? null
      : 'Firebase non è configurato: copia .env.example in .env e riavvia il server.',
  )

  /* L'uid di cui stiamo caricando il profilo. Confrontarlo alla fine della
     richiesta è quello che impedisce a una risposta lenta di sovrascrivere lo
     stato di un utente diverso (o del logout appena avvenuto). */
  const pendingUidRef = useRef(null)

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      pendingUidRef.current = null
      setProfile(null)
      setProfileLoading(false)
      return
    }

    const uid = currentUser.uid
    pendingUidRef.current = uid
    setProfileLoading(true)

    try {
      let data = await getUserProfile(uid)

      /* Primo accesso: il documento non c'è, lo creiamo con quel che Google ci
         ha dato. Così il membro compare in /membri anche se non passa mai da
         /join, e la pagina Join trova già i campi pieni. */
      if (!data) {
        await createUserProfileFromGoogle(currentUser)
        data = await getUserProfile(uid)
      }

      /* Se la allowlist è cambiata da quando questa persona si è iscritta, il
         suo `role` è vecchio: lo correggiamo qui, una volta, in silenzio.
         Se fallisce non è grave, al massimo la sezione Admin della pagina
         Membri non la mostra, quindi non deve impedire il login. */
      try {
        const fixed = await reconcileUserRole(uid, data)
        if (fixed) data = { ...data, ...fixed }
      } catch (roleErr) {
        console.warn(
          '[YET] Non riesco ad allineare ruolo e stato del profilo. Di solito le regole ' +
            'pubblicate sul database sono più vecchie di quelle in firestore.rules.',
          roleErr,
        )
      }

      if (pendingUidRef.current === uid) setProfile(data)
    } catch (err) {
      // Il profilo che non carica non deve impedire di usare il sito: si resta
      // loggati, semplicemente senza dati estesi.
      console.error('[YET] Non riesco a leggere il profilo utente.', err)
      if (pendingUidRef.current === uid) setProfile(null)
    } finally {
      if (pendingUidRef.current === uid) setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    /* Resta anche se `signIn` non usa piu' il redirect (vedi il blocco lungo
       piu' sotto): raccoglie il ritorno di chi era partito con la versione
       precedente del sito e torna qui a giro iniziato. Senza redirect in
       corso risolve con null e non fa niente. */
    getRedirectResult(auth).catch((err) => {
      if (err?.code !== 'auth/no-auth-event') setError(describeAuthError(err))
    })

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setLoading(false)
        loadProfile(nextUser)
      },
      (err) => {
        setError(describeAuthError(err))
        setLoading(false)
      },
    )

    return unsubscribe
  }, [loadProfile])

  const signIn = useCallback(async () => {
    /* L'esito torna al chiamante come { ok, code } e non come booleano secco:
       la barra deve poter distinguere "non e' riuscito" da "l'utente ha
       annullato", perche' nel primo caso serve portarlo dove la spiegazione
       si vede e nel secondo no. */
    if (!isFirebaseConfigured) {
      setError('Firebase non è configurato: l’accesso non è disponibile.')
      return { ok: false, code: 'app/not-configured' }
    }

    setError(null)

    /* Dentro il browser interno di un'app non si prova nemmeno: Google
       risponderebbe 403 e l'utente resterebbe davanti a una pagina di errore
       di Google, senza capire che deve cambiare browser. Meglio dirglielo
       prima, in italiano, sulla nostra pagina. */
    if (isInAppBrowser()) {
      setError(describeAuthError({ code: IN_APP_BROWSER }))
      return { ok: false, code: IN_APP_BROWSER }
    }

    const provider = new GoogleAuthProvider()
    // Forza la scelta dell'account: senza, chi ha già una sessione Google
    // entra sempre con lo stesso account e non capisce come cambiarlo.
    provider.setCustomParameters({ prompt: 'select_account' })

    /* SOLO POPUP, e il ripiego su signInWithRedirect e' stato TOLTO. Non e'
       una semplificazione: su questo sito il redirect non puo' funzionare.

       Il flusso di signInWithRedirect si appoggia a un iframe cross-origin
       verso <progetto>.firebaseapp.com, e i browser che bloccano l'accesso
       allo storage di terze parti lo interrompono. Google lo documenta e da'
       le date: obbligatorio adottare una delle contromisure su Safari 16.1+,
       Firefox 109+ e, dal 24 giugno 2024, Chrome M115+. L'unica esenzione e'
       per i siti ospitati su un sottodominio di firebaseapp.com: noi stiamo
       su github.io, quindi non ci riguarda.
       Vedi: firebase.google.com/docs/auth/web/redirect-best-practices

       Il ripiego era quindi peggio di niente. Scattava proprio quando il popup
       veniva bloccato, cioe' nei browser interni delle app, e li' l'utente
       veniva sbalzato su Google e riportato indietro ANCORA SCOLLEGATO, senza
       un messaggio: il difetto si presentava come "l'accesso non funziona e
       non si capisce perche'".

       SE UN GIORNO SERVE DAVVERO IL REDIRECT: la strada e' quella indicata da
       Google, cioe' servire il gestore /__/auth/ dal nostro stesso dominio con
       un reverse proxy, oppure un dominio personalizzato su Firebase Hosting.
       Con GitHub Pages, che serve solo file statici, la prima non e'
       possibile. */
    try {
      await signInWithPopup(auth, provider)
      return { ok: true }
    } catch (err) {
      // Il popup chiuso a mano non è un errore da sbandierare, ma va comunque
      // riportato: altrimenti il bottone resta in "caricamento" senza spiegazioni.
      setError(describeAuthError(err))
      return { ok: false, code: err?.code ?? '' }
    }
  }, [])

  const signOutUser = useCallback(async () => {
    if (!isFirebaseConfigured) return
    setError(null)
    try {
      await firebaseSignOut(auth)
      // Non aspettiamo onAuthStateChanged per svuotare il profilo: il ritardo
      // si vedrebbe come un avatar che resta in navbar dopo il logout.
      pendingUidRef.current = null
      setProfile(null)
    } catch (err) {
      setError(describeAuthError(err))
    }
  }, [])

  /** Ricarica users/{uid}. La chiama la pagina Join dopo un salvataggio, così
   *  navbar e /membri vedono subito i dati nuovi. */
  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user)
  }, [user, loadProfile])

  /**
   * Cancella profilo e account: il diritto di cancellazione, per davvero.
   *
   * L'ordine conta. Prima il documento Firestore, poi l'account: le regole
   * concedono la cancellazione del profilo solo al proprietario autenticato,
   * quindi se sparisse prima l'account resterebbe un documento orfano che
   * nessuno può più togliere, nemmeno un admin, per come sono scritte le
   * regole. Facendo il contrario, se il secondo passo fallisce resta al più un
   * account senza dati, che è il modo giusto di sbagliare.
   *
   * `deleteUser` pretende un login recente: Firebase non lascia cancellare un
   * account con un token vecchio di ore. Non è un errore da nascondere, è una
   * cosa che l'utente può risolvere da solo, quindi la traduciamo in
   * un'istruzione invece che in un codice.
   */
  const deleteAccount = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase non è configurato.')
    const current = auth.currentUser
    if (!current) throw new Error('Non risulti collegato.')

    await deleteUserProfile(current.uid)

    try {
      await deleteUser(current)
    } catch (err) {
      if (err?.code === 'auth/requires-recent-login') {
        // I dati pubblici sono già spariti: è la parte che conta, e va detto.
        await firebaseSignOut(auth).catch(() => {})
        throw new Error(
          'Il tuo profilo è stato cancellato. Per rimuovere anche l’account di accesso ' +
            'rientra con Google e ripeti l’operazione entro pochi minuti: per sicurezza ' +
            'Firebase non cancella un account con un accesso vecchio.',
        )
      }
      throw err
    }

    pendingUidRef.current = null
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      // Lato client serve SOLO a mostrare o nascondere l'interfaccia.
      // La protezione vera sono le regole in firestore.rules.
      isAdmin: isAdminEmail(user?.email),
      error,
      signIn,
      signOutUser,
      refreshProfile,
      deleteAccount,
    }),
    [user, profile, loading, profileLoading, error, signIn, signOutUser, refreshProfile, deleteAccount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Errore da sviluppatore, non da utente: succede solo se un componente
    // finisce fuori dall'albero del provider.
    throw new Error('useAuth() va usato dentro <AuthProvider>.')
  }
  return context
}
