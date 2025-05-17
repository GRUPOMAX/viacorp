import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/viacorp/', // 👈 obrigatório para GitHub Pages
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*'],
      manifest: {
        name: 'ViaCorp - KM Control',
        short_name: 'ViaCorp',
        start_url: '/viacorp/',
        scope: '/viacorp/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3182ce',
        icons: [
          {
            src: '/viacorp/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/viacorp/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
