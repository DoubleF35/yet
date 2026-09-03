import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import App from './App.jsx'
import { AuthProvider } from './lib/auth.jsx'
import { LanguageProvider } from './lib/i18n.jsx'

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
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </HashRouter>
  </React.StrictMode>,
)
