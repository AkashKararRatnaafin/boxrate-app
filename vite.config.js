import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'BoxRate — Box Price Calculator',
        short_name: 'BoxRate',
        description: 'Scan a box measurement sheet and get instant pricing.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#C7A574',
        theme_color: '#2B2118',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
    }),
  ],
  // GitHub Pages serves project sites from https://username.github.io/repo-name/
  // so the app needs to know it's not living at the domain root.
  // If your repo is named something other than "boxrate-app", change this to match.
  base: '/boxrate-app/',
})
