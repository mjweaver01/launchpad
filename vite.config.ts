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
      },
      manifest: {
        name: 'Launchpad',
        short_name: 'Launchpad',
        theme_color: '#000000',
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
        main: resolve(__dirname, 'index.html'),
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
    proxy: {
      '/api': {
        target: 'http://localhost:8888/.netlify/functions',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
