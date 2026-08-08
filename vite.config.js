import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO — DEPLOY SU GITHUB PAGES: sostituisci 'yet' con il nome ESATTO del repo.
//
//   repo  https://github.com/<utente>/yet        ->  base = '/yet/'
//   repo  https://github.com/<utente>/yet-site   ->  base = '/yet-site/'
//
// Se invece pubblichi su un dominio custom o su <utente>.github.io (repo
// "root"), la base deve essere '/' e basta.
//
// La barra iniziale e quella finale servono entrambe: senza, gli asset
// (logo.png, hero.mp4) vengono cercati nella root del dominio e il sito si
// apre bianco con dei 404 in console.
//
// In CI la sovrascriviamo con la env var VITE_BASE (vedi deploy.yml), così il
// valore qui sotto conta solo se builda a mano.
const REPO_NAME = 'yet'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // In dev la base resta '/' altrimenti il server locale servirebbe da /yet/.
  base: command === 'build' ? (process.env.VITE_BASE ?? `/${REPO_NAME}/`) : '/',
  build: {
    outDir: 'dist',
    // Il video sta in /public: Vite lo copia senza toccarlo. Alziamo comunque
    // il limite di inline così nessun asset medio finisce in base64 nel JS.
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    host: true,
  },
}))
