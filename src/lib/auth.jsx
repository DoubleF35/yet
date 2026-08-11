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
  signInWithRedirect,
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
      return 'Il browser ha bloccato la finestra di Google. Ti riproviamo con un redirect.'
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

    /* Chiude il giro del fallback con redirect: al ritorno da Google la pagina
       è stata ricaricata, e il risultato va raccolto qui. Se non c'è stato
       nessun redirect, risolve con null e non fa niente. */
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
    if (!isFirebaseConfigured) {
      setError('Firebase non è configurato: l’accesso non è disponibile.')
      return
    }

    setError(null)
    const provider = new GoogleAuthProvider()
    // Forza la scelta dell'account: senza, chi ha già una sessione Google
    // entra sempre con lo stesso account e non capisce come cambiarlo.
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      /* Popup bloccato o non supportato (succede negli in-app browser di
         Instagram e LinkedIn, cioè proprio da dove arriverà metà della gente):
         si ricade sul redirect, che funziona ovunque. */
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, provider)
          return
        } catch (redirectErr) {
          setError(describeAuthError(redirectErr))
          return
        }
      }
      // Il popup chiuso a mano non è un errore da sbandierare, ma va comunque
      // riportato: altrimenti il bottone resta in "caricamento" senza spiegazioni.
      setError(describeAuthError(err))
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
