/**
 * The tests: unit tests beside the sources, and the end-to-end tests of the action in `test/`, on
 * Node, which the action and the CLI ship on.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
  },
});
