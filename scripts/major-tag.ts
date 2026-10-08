/**
 * Moves the major tag, such as `v1`, to the release just cut, so workflows that use `evalmark@v1`
 * get every fix and feature of that major version. semantic-release runs it after a release, with
 * the release's version as its argument. The token reaches git through `GIT_CONFIG_*` variables,
 * never a URL or the command line.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * The major tag of a version.
 *
 * @param version - The version, such as `1.4.2`.
 * @returns The tag, such as `v1`.
 * @throws When the version is not `major.minor.patch`.
 */
export function majorTagOf(version: string): string {
  const match = /^(\d+)\.\d+\.\d+$/.exec(version);
  if (!match) throw new Error(`Not a release version: ${version}.`);
  return `v${match[1]}`;
}

/**
 * Points the major tag at the release's tag, here and on GitHub.
 *
 * @param version - The release's version.
 */
function moveMajorTag(version: string): void {
  const token = process.env.GITHUB_TOKEN ?? '';
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  const env = {
    ...process.env,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}`,
  };
  const major = majorTagOf(version);
  execFileSync('git', ['tag', '--force', major, `v${version}^{commit}`], { stdio: 'inherit' });
  const remote = `https://github.com/${repository}.git`;
  execFileSync('git', ['push', '--force', remote, `refs/tags/${major}`], { env, stdio: 'inherit' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) moveMajorTag(process.argv[2] ?? '');
