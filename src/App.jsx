import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

import Intro from './pages/Intro.jsx'
import Home from './pages/Home.jsx'
import Membri from './pages/Membri.jsx'
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
          <Route path="/membri" element={<Membri />} />
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
