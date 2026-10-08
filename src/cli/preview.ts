/**
 * `evalmark preview`: serves the dashboard of a branch of the current clone, or of a folder on disk,
 * with nothing published.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { type FolderServer, portOf, serveFolder, withHostValue } from './serve.ts';

/** How `evalmark preview` is called. */
export const previewUsage =
  'evalmark preview [--branch evalmark] [--folder evalmark] [--host [address]] [--port 4400] [--dir <folder on disk>]';

/**
 * Runs a command and says whether it succeeded, without printing anything.
 *
 * @param command - The command.
 * @param args - Its arguments.
 * @returns `true` when it exited with 0.
 */
function succeeds(command: string, args: string[]): boolean {
  return spawnSync(command, args, { stdio: 'ignore' }).status === 0;
}

/**
 * Extracts a folder of a ref of the current clone into a directory, through a tar archive written
 * to a file, so a large history never sits in memory.
 *
 * @param ref - The ref, such as `evalmark` or `refs/evalmark/data`.
 * @param folder - The folder on that ref.
 * @param directory - Where to extract it.
 * @returns `true` when the ref has the folder.
 */
function extract(ref: string, folder: string, directory: string): boolean {
  const archive = join(directory, '.evalmark-preview.tar');
  try {
    if (!succeeds('git', ['archive', '--format=tar', `--output=${archive}`, ref, folder])) {
      return false;
    }
    return succeeds('tar', ['-x', '-f', archive, '-C', directory]);
  } finally {
    rmSync(archive, { force: true });
  }
}

/**
 * Extracts the folder from the ref as given, or else from `origin/<ref>`.
 *
 * @param branch - The branch or ref.
 * @param folder - The folder.
 * @returns The extracted folder's path, in a temporary directory.
 * @throws When neither ref has the folder.
 */
export function extractFolder(branch: string, folder: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'evalmark-preview-'));
  const found = [branch, `origin/${branch}`].some((ref) => extract(ref, folder, directory));
  if (found) return join(directory, folder);
  rmSync(directory, { recursive: true, force: true });
  throw new Error(`Neither ${branch} nor origin/${branch} has a ${folder} folder in this clone.`);
}

/**
 * Removes a temporary directory when the process is interrupted or stopped.
 *
 * @param directory - The directory.
 */
function removeOnExit(directory: string): void {
  const stop = () => {
    rmSync(directory, { recursive: true, force: true });
    process.exit(0);
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

/**
 * Serves the preview until the process stops.
 *
 * @param args - The command's arguments.
 * @returns The server, once it listens.
 * @throws When the branch has no folder, the port is not a number or is taken.
 */
export async function previewCommand(args: string[]): Promise<FolderServer> {
  const { values } = parseArgs({
    args: withHostValue(args),
    options: {
      branch: { type: 'string', default: 'evalmark' },
      folder: { type: 'string', default: 'evalmark' },
      host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '4400' },
      dir: { type: 'string' },
    },
  });
  const port = portOf(values.port);
  const folder = values.dir ?? extractFolder(values.branch, values.folder);
  if (values.dir === undefined) removeOnExit(dirname(folder));
  const server = await serveFolder(folder, port, values.host);
  process.stdout.write(
    `Serving ${values.dir ?? `${values.folder} from ${values.branch}`} at ${server.url}\n`,
  );
  return server;
}
