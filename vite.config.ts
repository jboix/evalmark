/**
 * Builds the dashboard into `dist/site/`, and serves it on the test fixture for development
 * (`pnpm run site:dev`). The page works from any folder of any host: its base is relative, its
 * fonts are files beside it, and nothing is inlined, as its content security policy allows no
 * inline script, no inline style and no `data:` font.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { siteDev } from './scripts/site-dev.ts';

/** The dashboard's sources. */
const root = fileURLToPath(new URL('./src/site/', import.meta.url));

/**
 * Emits the fonts' licences beside the fonts, as the SIL Open Font License asks.
 *
 * @returns The plugin.
 */
function fontLicences(): Plugin {
  return {
    name: 'evalmark:font-licences',
    apply: 'build',
    generateBundle() {
      const fonts = join(root, 'fonts');
      for (const name of readdirSync(fonts).filter((entry) => entry.endsWith('.txt'))) {
        const source = readFileSync(join(fonts, name));
        this.emitFile({ type: 'asset', fileName: `fonts/${name}`, source });
      }
    },
  };
}

/**
 * Where a built asset goes: a font keeps its name in `fonts/`, as the page's licences name it.
 *
 * @param asset - The asset.
 * @param asset.names - Its original file names.
 * @returns Its file name pattern.
 */
function assetFileName(asset: { readonly names: readonly string[] }): string {
  const isFont = asset.names.some((name) => name.endsWith('.woff2'));
  return isFont ? 'fonts/[name][extname]' : 'assets/[name]-[hash][extname]';
}

export default defineConfig({
  root,
  base: './',
  publicDir: false,
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  plugins: [fontLicences(), siteDev()],
  server: { port: Number(process.env.PORT ?? 4401) },
  build: {
    outDir: fileURLToPath(new URL('./dist/site/', import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
    reportCompressedSize: false,
    rolldownOptions: { output: { assetFileNames: assetFileName } },
  },
});
