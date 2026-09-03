import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

import Intro from './pages/Intro.jsx'
import Home from './pages/Home.jsx'
import Vetrina from './pages/Membri.jsx'
import Profilo from './pages/Profilo.jsx'
import Eventi from './pages/Eventi.jsx'
import Brand from './pages/Brand.jsx'
import Sponsor from './pages/Sponsor.jsx'
import Join from './pages/Join.jsx'
import Contatti from './pages/Contatti.jsx'
import Privacy from './pages/Privacy.jsx'
import Cookie from './pages/Cookie.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* L'intro sta fuori dal Layout: è full-screen e non ha navbar. */}
        <Route path="/" element={<Intro />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/vetrina" element={<Vetrina />} />
          {/* La pagina di un singolo membro. Annidata sotto /vetrina e non a
              parte, perche' l'indirizzo dice da dove si arriva e dove si
              torna. Pubblica come la vetrina: chi puo' essere letto lo
              decidono le regole del database, non questa rotta. */}
          <Route path="/vetrina/:uid" element={<Profilo />} />
          <Route path="/eventi" element={<Eventi />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="/sponsor" element={<Sponsor />} />

          {/* La sezione si chiamava "Membri" e i link condivisi in giro
              puntano ancora li'. `replace` per non lasciare il vecchio
              indirizzo nella cronologia: chi preme Indietro deve tornare da
              dove veniva, non rimbalzare di nuovo qui. */}
          <Route path="/membri" element={<Navigate to="/vetrina" replace />} />
          <Route path="/join" element={<Join />} />
          <Route path="/contatti" element={<Contatti />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookie" element={<Cookie />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          {/* Qualunque altra rotta torna alla home invece di lasciare il bianco. */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </>
  )
}
