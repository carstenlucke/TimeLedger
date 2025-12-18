import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf-8'));

export default defineConfig({
  plugins: [react()],
  base: './',
  root: './src/renderer',
  publicDir: '../../assets',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
    },
  },
  server: {
    port: 5173,
  },
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
  },
});
