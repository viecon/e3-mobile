import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'E3 Mobile',
        short_name: 'E3',
        description: 'NYCU E3 LMS Mobile Dashboard',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/e3-mobile/',
        start_url: '/e3-mobile/',
        icons: [
          { src: '/e3-mobile/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/e3-mobile/icons/512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*workers\.dev\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxAgeSeconds: 300 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  base: '/e3-mobile/',
});
