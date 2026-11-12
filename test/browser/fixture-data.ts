/**
 * Serves the synthetic history to the browser tests: a Vite plugin that writes the fixture to a
 * temporary folder and answers every request under a `data/` folder from it, as a static host
 * does.
 */
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { answerFrom } from '../../src/cli/serve.ts';
import { dataFolder } from '../../src/format/store.ts';
import { generateStore, writeStore } from '../site/fixture-store.ts';

/** A request under a `data/` folder, wherever the test page is: the file's path is the capture. */
const dataRequest = new RegExp(`/${dataFolder}(/[^?]*)`);

/**
 * The plugin of one browser's test server.
 *
 * @param name - The browser's name: each server writes its own copy of the fixture.
 * @returns The plugin.
 */
export function fixtureData(name: string): Plugin {
  const folder = join(tmpdir(), `evalmark-browser-tests-${name}`);
  return {
    name: 'evalmark:fixture-data',
    async configureServer(server) {
      await rm(folder, { recursive: true, force: true });
      await writeStore(folder, generateStore());
      const answer = answerFrom(join(folder, dataFolder));
      server.middlewares.use((request, response, next) => {
        const path = dataRequest.exec(request.url ?? '')?.[1];
        if (path === undefined) return next();
        request.url = path;
        answer(request, response);
      });
    },
  };
}
