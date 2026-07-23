import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Allow importing bundled curriculum content from the repo-root content/ tree.
  server: { port: 5173, fs: { allow: ['../..'] } },
  build: { outDir: 'dist', sourcemap: true },
  // Internal workspace packages are TypeScript source; let Vite transform them
  // rather than pre-bundling with esbuild.
  optimizeDeps: {
    exclude: [
      '@learn/domain',
      '@learn/persistence',
      '@learn/curriculum',
      '@learn/validation-engine',
      '@learn/learning-engine',
      '@learn/diagnostic',
      '@learn/ai-gateway',
    ],
  },
});
