/**
 * The dashboard's files: found next to the running bundle, and copied into the folder over the
 * previous version, leaving the data and the badges alone.
 */
import { existsSync } from 'node:fs';
import { cp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataFolder } from '../format/store.ts';
import { badgesFolder } from './badges.ts';

/** What the folder holds besides the dashboard, which a new dashboard never replaces. */
const kept: ReadonlySet<string> = new Set([dataFolder, badgesFolder]);

/**
 * The built dashboard's folder: `site/` next to the bundle, `dist/index.js`, or the repository's
 * `dist/site/` when the action runs from its sources.
 *
 * @returns The folder's path.
 */
export function defaultSiteDir(): string {
  const bundled = fileURLToPath(new URL('./site/', import.meta.url));
  if (existsSync(join(bundled, 'index.html'))) return bundled;
  return fileURLToPath(new URL('../../dist/site/', import.meta.url));
}

/**
 * Copies the dashboard into the folder. Files of a previous dashboard are removed first; `data/`
 * and `badges/` stay as they are.
 *
 * @param siteDir - The built dashboard's folder.
 * @param folder - The action's folder on disk.
 * @returns When it is copied.
 * @throws When the dashboard is not built.
 */
export async function copySite(siteDir: string, folder: string): Promise<void> {
  if (!existsSync(join(siteDir, 'index.html'))) {
    throw new Error(`The dashboard is not built: ${siteDir} has no index.html.`);
  }
  const current = await readdir(folder).catch(() => [] as string[]);
  for (const name of current.filter((entry) => !kept.has(entry))) {
    await rm(join(folder, name), { recursive: true, force: true });
  }
  const files = await readdir(siteDir);
  for (const name of files.filter((entry) => !kept.has(entry))) {
    await cp(join(siteDir, name), join(folder, name), { recursive: true });
  }
}
