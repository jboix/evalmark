/**
 * Serves the dashboard on the synthetic history, for development: `pnpm run site:dev` starts
 * Vite's dev server with this plugin. The fixture is written to a temporary folder at start, and
 * its files are served under `data/` as a static host does: transcripts as plain bytes, without
 * `Content-Encoding`.
 */
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { answerFrom } from '../src/cli/serve.ts';
import { dataFolder } from '../src/format/store.ts';
import { generateStore, writeStore } from '../test/site/fixture-store.ts';

/** Where the fixture goes. */
const folder = join(tmpdir(), 'evalmark-site-dev');

/**
 * Lets the page take the styles Vite's dev server injects as `<style>` elements. The built page
 * keeps the strict policy: its styles are files.
 *
 * @param html - The page.
 * @returns The page, with inline styles allowed.
 */
function devPolicy(html: string): string {
  return html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
}

/**
 * The development server's plugin: the fixture under `data/`, and the relaxed style policy.
 *
 * @returns The plugin.
 */
export function siteDev(): Plugin {
  return {
    name: 'evalmark:site-dev',
    apply: 'serve',
    async configureServer(server) {
      await rm(folder, { recursive: true, force: true });
      await writeStore(folder, generateStore());
      server.middlewares.use(`/${dataFolder}`, answerFrom(join(folder, dataFolder)));
      server.config.logger.info(`The fixture is in ${folder}.`);
    },
    transformIndexHtml: devPolicy,
  };
}
