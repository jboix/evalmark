/**
 * Helpers for the action's end-to-end tests: a local bare repository standing in for GitHub, the
 * `GITHUB_*` environment pointing at it, result files, and reading back what a run pushed.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../../src/action/run.ts';
import type { Result } from '../../src/format/result.ts';

/** The token the tests run with, which must never be stored or logged unmasked. */
export const token = 'ghs_testTokenThatMustNeverLeak0123456789';

/** A sandbox: a temporary directory with a bare repository at `owner/repo.git`. */
export interface Sandbox {
  /** The temporary directory. */
  readonly root: string;
  /** The bare repository. */
  readonly bare: string;
  /** `GITHUB_SERVER_URL` pointing at the root. */
  readonly serverUrl: string;
  /** Removes everything. */
  readonly cleanup: () => void;
}

/**
 * Runs git, failing the test on error.
 *
 * @param directory - Where.
 * @param args - The arguments.
 * @returns What git printed.
 */
export function gitIn(directory: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: directory, encoding: 'utf8' });
}

/**
 * Makes a sandbox.
 *
 * @returns The sandbox.
 */
export function sandbox(): Sandbox {
  const root = mkdtempSync(join(tmpdir(), 'evalmark-test-'));
  const bare = join(root, 'owner', 'repo.git');
  mkdirSync(bare, { recursive: true });
  gitIn(bare, 'init', '-q', '--bare');
  return {
    root,
    bare,
    serverUrl: `file://${root}`,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

/**
 * A small valid result.
 *
 * @param startedAt - When it started.
 * @param statuses - Each case's single trial status, by case id.
 * @returns The result.
 */
export function result(
  startedAt: string,
  statuses: Record<string, 'pass' | 'fail' | 'error' | 'skip'> = { q1: 'pass', q2: 'fail' },
): Result {
  return {
    version: 1,
    suite: 'agent',
    startedAt,
    labels: { model: 'm1' },
    cases: Object.entries(statuses).map(([id, status]) => ({
      id,
      title: `Case ${id}`,
      trials: [
        {
          status,
          durationMs: 1000,
          usage: { inputTokens: 100, outputTokens: 10, costUsd: 0.01 },
          transcript: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: `Using ${token} and Bearer abcdefghijkl` },
          ],
        },
      ],
    })),
  };
}

/**
 * Writes a result file.
 *
 * @param box - The sandbox.
 * @param name - The file's name.
 * @param data - The result, or any text.
 * @returns The file's path.
 */
export function writeResult(box: Sandbox, name: string, data: unknown): string {
  const path = join(box.root, name);
  writeFileSync(path, typeof data === 'string' ? data : JSON.stringify(data));
  return path;
}

/** What a run of the action produced. */
export interface ActionRun {
  /** The exit code. */
  readonly code: number;
  /** The log. */
  readonly log: string;
  /** The outputs, parsed. */
  readonly outputs: Record<string, string>;
  /** The job summary. */
  readonly summary: string;
}

/**
 * Runs the action with a workflow's environment pointing at the sandbox.
 *
 * @param box - The sandbox.
 * @param inputs - The inputs, by name as `action.yml` spells them.
 * @param extra - Other variables, such as the event.
 * @returns What it produced.
 */
export async function runAction(
  box: Sandbox,
  inputs: Record<string, string>,
  extra: Record<string, string> = {},
): Promise<ActionRun> {
  const files = mkdtempSync(join(box.root, 'step-'));
  const [output, summary] = [join(files, 'output'), join(files, 'summary')];
  writeFileSync(output, '');
  writeFileSync(summary, '');
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    GITHUB_SERVER_URL: box.serverUrl,
    GITHUB_REPOSITORY: 'owner/repo',
    GITHUB_RUN_ID: '1000',
    GITHUB_RUN_ATTEMPT: '1',
    GITHUB_SHA: 'a'.repeat(40),
    GITHUB_REF_NAME: 'main',
    GITHUB_EVENT_NAME: 'push',
    GITHUB_OUTPUT: output,
    GITHUB_STEP_SUMMARY: summary,
    INPUT_TOKEN: token,
    ...Object.fromEntries(
      Object.entries(inputs).map(([name, value]) => [`INPUT_${name.toUpperCase()}`, value]),
    ),
    ...extra,
  };
  let log = '';
  const code = await run({
    env,
    write: (text) => {
      log += text;
    },
  });
  return {
    code,
    log,
    outputs: parseOutputs(readFileSync(output, 'utf8')),
    summary: readFileSync(summary, 'utf8'),
  };
}

/**
 * Parses an outputs file.
 *
 * @param text - The file.
 * @returns The outputs.
 */
function parseOutputs(text: string): Record<string, string> {
  const outputs: Record<string, string> = {};
  for (const match of text.matchAll(/^(.+?)<<(\S+)\n([\s\S]*?)\n\2$/gm)) {
    outputs[match[1] ?? ''] = match[3] ?? '';
  }
  return outputs;
}

/**
 * Clones the bare repository's ref into a fresh directory.
 *
 * @param box - The sandbox.
 * @param ref - The full ref.
 * @returns The clone's path.
 */
export function cloneRef(box: Sandbox, ref = 'refs/heads/evalmark'): string {
  const directory = mkdtempSync(join(box.root, 'clone-'));
  gitIn(directory, 'init', '-q');
  gitIn(directory, 'fetch', '-q', box.bare, `${ref}:refs/remotes/tip`);
  gitIn(directory, 'checkout', '-q', 'refs/remotes/tip');
  return directory;
}

/**
 * The commits on a ref of the bare repository.
 *
 * @param box - The sandbox.
 * @param ref - The full ref.
 * @returns The commit subjects, newest first.
 */
export function commitsOf(box: Sandbox, ref = 'refs/heads/evalmark'): string[] {
  return gitIn(box.bare, 'log', '--format=%s', ref).trim().split('\n');
}

/**
 * Writes an event payload.
 *
 * @param box - The sandbox.
 * @param payload - The payload.
 * @returns Its path.
 */
export function writeEvent(box: Sandbox, payload: unknown): string {
  const path = join(box.root, `event-${Math.random().toString(16).slice(2)}.json`);
  writeFileSync(path, JSON.stringify(payload));
  return path;
}

/**
 * Every file under a directory, `.git` left out.
 *
 * @param directory - The directory.
 * @returns The paths.
 */
export function filesUnder(directory: string): string[] {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((path) => !path.startsWith('.git'))
    .map((path) => join(directory, path))
    .filter((path) => statSync(path).isFile());
}
