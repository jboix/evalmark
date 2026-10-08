/**
 * Export mode: copies the stored site and data from the branch into a folder, for a site that an
 * Actions workflow builds and deploys.
 */
import { existsSync } from 'node:fs';
import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { checkoutTip, type Remote, removeDirectory, temporaryDirectory } from './git.ts';

/**
 * Copies the folder from the branch's tip into a path.
 *
 * @param remote - The remote and its ref.
 * @param folder - The action's folder on the branch.
 * @param path - Where to copy it.
 * @returns `true` when it was copied, `false` when the branch or the folder does not exist yet.
 */
export async function exportFolder(remote: Remote, folder: string, path: string): Promise<boolean> {
  const directory = await temporaryDirectory('evalmark-export-');
  try {
    const tip = await checkoutTip(directory, remote);
    const source = join(directory, folder);
    if (tip === undefined || !existsSync(source)) return false;
    await mkdir(path, { recursive: true });
    await cp(source, path, { recursive: true });
    return true;
  } finally {
    await removeDirectory(directory);
  }
}
