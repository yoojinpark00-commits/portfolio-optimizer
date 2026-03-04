// Add this to your vite.config.js (merge with existing config):
// This proxies /api/* to Yahoo Finance during local development.
// In production on Vercel, the api/prices.js serverless function handles it directly.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, proxy /api/prices to a local handler
      // For full local dev, run: npx vercel dev
      // Or use the Yahoo Finance URL directly (may have CORS issues locally)
    }
  }
});
