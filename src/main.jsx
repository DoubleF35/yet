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
// anche per un motore di ricerca.

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
