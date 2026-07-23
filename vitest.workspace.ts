import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: { name: 'domain', root: 'packages/domain', environment: 'node' },
  },
  {
    test: { name: 'schemas', root: 'packages/schemas', environment: 'node' },
  },
  {
    test: { name: 'persistence', root: 'packages/persistence', environment: 'node' },
  },
  {
    test: { name: 'curriculum', root: 'packages/curriculum', environment: 'node' },
  },
  {
    test: { name: 'validation', root: 'packages/validation-engine', environment: 'node' },
  },
  {
    test: {
      name: 'client',
      root: 'apps/client',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
    },
  },
]);
