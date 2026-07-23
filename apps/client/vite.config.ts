import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: true },
  // Internal workspace packages are TypeScript source; let Vite transform them
  // rather than pre-bundling with esbuild.
  optimizeDeps: { exclude: ['@learn/domain', '@learn/persistence'] },
});
