import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { I18nProvider } from './lib/i18n.jsx'

/* Inter, servito dal nostro dominio invece che dal CDN di Google.
   Solo il sottoinsieme latino e solo i cinque pesi che il tema usa davvero:
   importare tutto vorrebbe dire spedire cirillico, greco e vietnamita in nove
   pesi a gente che legge italiano. Il perché non-tecnico sta in index.html. */
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'

import './styles/theme.css'
import './styles/global.css'

// BrowserRouter, quindi indirizzi veri: /eventi e non /#/eventi.
//
// Su GitHub Pages di solito non si puo', perche' un percorso che non
// corrisponde a un file da 404. La ricetta diffusa e' far redirigere 404.html
// verso index.html conservando il percorso: funziona per le persone e non
// risolve niente per i motori di ricerca, perche' la prima risposta resta un
// 404 e a quel punto Googlebot non indicizza.
//
// Qui il problema e' risolto a monte: scripts/prerender.mjs genera un file
// HTML VERO per ogni rotta dopo il build, quindi dist/eventi/index.html
// esiste davvero e GitHub Pages lo serve con 200. Ogni pagina ha il suo
// titolo, la sua descrizione e il suo canonico, cioe' e' una pagina distinta
// anche per un motore di ricerca. Lo stesso vale per le pagine dei membri:
// il build ne genera una per ogni profilo approvato.

/**
 * Rimette a posto l'indirizzo dopo un recupero fatto da 404.html.
 *
 * QUANDO SUCCEDE. Il build genera una pagina per ogni membro approvato in quel
 * momento. Chi viene approvato DOPO non ha ancora il suo file: il suo
 * indirizzo esiste per l'applicazione ma non per GitHub Pages, che risponde
 * con 404.html. Quella pagina riconosce il caso e rimbalza qui portandosi
 * dietro il nome in `?p=`; da questa parte lo rimettiamo nell'indirizzo.
 *
 * PERCHE' UN PARAMETRO E NON sessionStorage, che e' la ricetta piu' diffusa:
 * su questo stesso sito un utente ha gia' incontrato un errore di Firebase
 * causato dallo storage partizionato del browser. Uno storage che lancia o che
 * viene isolato fra un dominio e l'altro qui romperebbe il recupero in
 * silenzio; un parametro nell'indirizzo viaggia sempre.
 *
 * `replaceState` e non `pushState`: il passaggio da /vetrina/?p=nome a
 * /vetrina/nome non e' una navigazione che l'utente ha fatto, e finire nella
 * cronologia significherebbe che il tasto "indietro" lo riporta a un indirizzo
 * di servizio invece che alla pagina da cui era arrivato.
 *
 * Gira PRIMA di createRoot: BrowserRouter legge l'indirizzo quando parte, e se
 * lo correggessimo dopo mostrerebbe la vetrina per un istante prima di
 * saltare al profilo.
 */
function ripristinaIndirizzo() {
  const parametri = new URLSearchParams(window.location.search)
  const nome = parametri.get('p')
  if (!nome) return

  /* Si accetta solo la forma che 404.html puo' aver prodotto: un segmento
     solo, senza barre. Senza questo controllo un indirizzo costruito a mano
     con ?p=//altrosito.example diventerebbe un salto fuori dal sito. */
  if (!/^[^/\\]+$/.test(nome)) return

  window.history.replaceState(null, '', `/vetrina/${nome}`)
}

ripristinaIndirizzo()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>,
)
