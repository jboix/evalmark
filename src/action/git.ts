/**
 * Git, as the `git` command in a temporary repository. The token reaches git only as an
 * `http.extraheader` set through git's `GIT_CONFIG_*` environment variables, for the commands that
 * talk to the remote: never in a remote URL, a file, a command line or a log line.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** The remote and how to reach it. */
export interface Remote {
  /** The remote's URL, without credentials. */
  readonly url: string;
  /** The token, or `''` for none. */
  readonly token: string;
  /** The full ref the action writes, such as `refs/heads/evalmark`. */
  readonly ref: string;
}

/** The identity of the action's commits. */
const bot = {
  name: 'github-actions[bot]',
  email: '41898282+github-actions[bot]@users.noreply.github.com',
};

/**
 * The full ref of a branch input.
 *
 * @param branch - A branch name, or a full ref such as `refs/evalmark/data`.
 * @returns The full ref.
 */
export function fullRef(branch: string): string {
  return branch.startsWith('refs/') ? branch : `refs/heads/${branch}`;
}

/**
 * The remote of the repository the workflow runs in.
 *
 * @param serverUrl - `GITHUB_SERVER_URL`.
 * @param repository - `GITHUB_REPOSITORY`, as `owner/name`.
 * @param branch - The branch input.
 * @param token - The token.
 * @returns The remote.
 */
export function remoteOf(
  serverUrl: string,
  repository: string,
  branch: string,
  token: string,
): Remote {
  return { url: `${serverUrl}/${repository}.git`, token, ref: fullRef(branch) };
}

/**
 * The environment that makes git send the token, as GitHub's checkout sends it. Environment
 * variables, unlike arguments, are not visible to other users' processes.
 *
 * @param token - The token.
 * @returns The variables, or none without a token.
 */
export function authEnvironment(token: string): Record<string, string> {
  if (token === '') return {};
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
  };
}

/**
 * Runs git. A failure's message names the subcommand and git's output, with the token masked.
 *
 * @param directory - The repository.
 * @param args - The arguments.
 * @param token - The token, sent only when the command talks to the remote.
 * @returns What git printed.
 * @throws When git fails.
 */
export function git(directory: string, args: readonly string[], token = ''): Promise<string> {
  const subcommand = args.find((arg, index) => !arg.startsWith('-') && args[index - 1] !== '-c');
  return new Promise((resolve, reject) => {
    const options = {
      cwd: directory,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C', ...authEnvironment(token) },
    };
    execFile('git', [...args], options, (error, stdout, stderr) => {
      if (!error) return resolve(stdout);
      const output = `${stderr}`
        .split(token || '\0')
        .join('***')
        .trim();
      reject(new Error(`git ${subcommand} failed: ${output || error.code}`));
    });
  });
}

/**
 * Makes a temporary directory.
 *
 * @param prefix - The name's start.
 * @returns Its path.
 */
export function temporaryDirectory(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

/**
 * Removes a temporary directory.
 *
 * @param directory - Its path.
 * @returns When it is removed.
 */
export function removeDirectory(directory: string): Promise<void> {
  return rm(directory, { recursive: true, force: true });
}

/**
 * The commit the remote's ref points to.
 *
 * @param directory - A repository to run git in.
 * @param remote - The remote.
 * @returns The commit, or `undefined` when the ref does not exist.
 */
async function remoteTip(directory: string, remote: Remote): Promise<string | undefined> {
  const listing = await git(directory, ['ls-remote', remote.url, remote.ref], remote.token);
  const line = listing.split('\n').find((entry) => entry.split('\t')[1] === remote.ref);
  return line?.split('\t')[0];
}

/**
 * Makes a repository in a directory holding the ref's tip, fetched with depth 1, checked out.
 *
 * @param directory - An empty directory.
 * @param remote - The remote.
 * @returns The tip's commit, or `undefined` when the ref does not exist yet.
 */
export async function checkoutTip(directory: string, remote: Remote): Promise<string | undefined> {
  await git(directory, ['init', '-q']);
  const tip = await remoteTip(directory, remote);
  if (tip === undefined) return undefined;
  const fetch = [
    'fetch',
    '-q',
    '--depth=1',
    '--no-tags',
    remote.url,
    `+${remote.ref}:refs/evalmark/tip`,
  ];
  await git(directory, fetch, remote.token);
  const fetched = (await git(directory, ['rev-parse', 'refs/evalmark/tip'])).trim();
  await git(directory, ['checkout', '-q', '--detach', fetched]);
  return fetched;
}

/**
 * The tracked files of the checked-out tip.
 *
 * @param directory - The repository.
 * @returns Their paths.
 */
export async function trackedFiles(directory: string): Promise<string[]> {
  const listing = await git(directory, ['ls-files', '-z']);
  return listing.split('\0').filter((path) => path.length > 0);
}

/**
 * Commits the working tree as the action's bot.
 *
 * @param directory - The repository.
 * @param message - The commit message.
 * @param parent - The parent commit, or `undefined` for an orphan commit.
 * @returns The new commit.
 */
export async function commitAll(
  directory: string,
  message: string,
  parent: string | undefined,
): Promise<string> {
  await git(directory, ['add', '-A']);
  const tree = (await git(directory, ['write-tree'])).trim();
  const identity = ['-c', `user.name=${bot.name}`, '-c', `user.email=${bot.email}`];
  const parents = parent === undefined ? [] : ['-p', parent];
  const commit = [...identity, 'commit-tree', tree, ...parents, '-m', message];
  return (await git(directory, commit)).trim();
}

/**
 * Pushes a commit to the remote's ref. A rewritten history is pushed with a lease on the tip it
 * was built on, so a run recorded meanwhile is never lost.
 *
 * @param directory - The repository.
 * @param remote - The remote.
 * @param commit - The commit.
 * @param lease - With `expected`, the tip the commit replaces (`undefined` when there was none).
 * @returns When it is pushed.
 * @throws When the push is rejected.
 */
export async function push(
  directory: string,
  remote: Remote,
  commit: string,
  lease?: { readonly expected: string | undefined },
): Promise<void> {
  const force = lease ? [`--force-with-lease=${remote.ref}:${lease.expected ?? ''}`] : [];
  await git(
    directory,
    ['push', '-q', ...force, remote.url, `${commit}:${remote.ref}`],
    remote.token,
  );
}
