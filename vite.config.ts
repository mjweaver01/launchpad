import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      workbox: {
        cleanupOutdatedCaches: true,
        // Include the self-hosted clock fonts so they work offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Launchpad',
        short_name: 'Launchpad',
        description: 'Personal dashboard: clock, weather, news, calendar and tasks.',
        theme_color: '#000000',
        background_color: '#000000',
        // fullscreen hides Android's status bar and navigation buttons when
        // launched from the home screen; browsers without it fall back to standalone.
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
  esbuild: {
    // Suppress warnings about invalid package.json sideEffects from node_modules
    logOverride: {
      'invalid-package-json': 'silent',
    },
  },
  server: {
    // 1234 and 5173 are taken by other local projects. netlify dev serves on
    // 7410 (see netlify.toml) and proxies to this Vite server on 7411.
    port: 7411,
    strictPort: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:7410',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});
