import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves project sites from https://username.github.io/repo-name/
  // so the app needs to know it's not living at the domain root.
  // If your repo is named something other than "boxrate-app", change this to match.
  base: '/boxrate-app/',
})
