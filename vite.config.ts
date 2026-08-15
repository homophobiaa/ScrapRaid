import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so a static export works unchanged on Vercel, Netlify and
// GitHub Pages project sites (which serve from /<repo>/ rather than /).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
