import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

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

// HashRouter e non BrowserRouter: GitHub Pages serve file statici e non sa
// riscrivere /membri su index.html, quindi un refresh su una rotta profonda
// darebbe 404. Con l'hash (#/membri) il server vede sempre e solo "/".
//
// La lingua sta FUORI dal router: non è uno stato della pagina ma della
// persona, e cambiarla non deve far navigare. Per lo stesso motivo non è
// nell'indirizzo (niente /en/...): con HashRouter vorrebbe dire raddoppiare
// ogni rotta e riscrivere ogni link, e su GitHub Pages nessuno dei due
// prefissi sarebbe comunque indicizzabile separatamente.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </I18nProvider>
  </React.StrictMode>,
)
