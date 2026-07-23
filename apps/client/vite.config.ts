import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Allow importing bundled curriculum content from the repo-root content/ tree.
  server: { port: 5173, fs: { allow: ['../..'] } },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split vendor, content-validation, and curriculum content into separate
        // cacheable chunks so the initial app shell loads faster (REL-004).
        manualChunks(id: string): string | undefined {
          if (id.includes('/content/mvp/')) return 'curriculum-content';
          if (id.includes('/node_modules/ajv') || id.includes('/node_modules/ajv-formats')) {
            return 'validation';
          }
          if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
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
