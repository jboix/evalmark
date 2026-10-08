/**
 * Builds the package's Node bundles into `dist/`: the action (`index.js`, as `action.yml` runs it),
 * the CLI (`cli.js`, the package's `bin`) and the library entry (`lib.js` and its types). Every
 * dependency is inlined, as GitHub runs the action and npm runs the CLI without installing
 * anything. `vite build` then writes the dashboard into `dist/site/`.
 */
import { defineConfig, type UserConfig } from 'tsdown';

/** What every bundle shares: Node 24, ESM, `.js` names without hashes, so `dist/` is stable. */
const node = {
  platform: 'node',
  target: 'node24',
  format: 'esm',
  fixedExtension: false,
  hash: false,
  report: false,
} satisfies UserConfig;

export default defineConfig([
  {
    ...node,
    entry: { index: 'src/action/main.ts' },
    dts: false,
    deps: { onlyBundle: ['zod'] },
  },
  {
    ...node,
    entry: { cli: 'src/cli/main.ts' },
    dts: false,
    banner: '#!/usr/bin/env node',
    deps: { onlyBundle: ['zod'] },
  },
  {
    ...node,
    entry: { lib: 'src/index.ts' },
    dts: true,
    deps: { onlyBundle: [] },
  },
]);
