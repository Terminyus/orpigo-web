import { defineConfig } from 'vite';

// GitHub Pages preview lives at /orpigo-web/. For the live site set BASE=/
export default defineConfig({
  base: process.env.BASE ?? '/orpigo-web/',
  build: { target: 'es2020' },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
