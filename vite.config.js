// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/viacorp/', // 👈 nome do repositório
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png'
      ],
      manifest: false // ❗ Usa o manifest.json externo da pasta public
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
