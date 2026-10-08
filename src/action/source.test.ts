import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { readEvent, runIdOf, sourceOf } from './source.ts';

const folder = mkdtempSync(join(tmpdir(), 'evalmark-source-'));
afterAll(() => rmSync(folder, { recursive: true, force: true }));

/**
 * Writes an event payload.
 *
 * @param payload - The payload.
 * @returns Its path.
 */
function eventFile(payload: unknown): string {
  const path = join(folder, `${Math.random()}.json`);
  writeFileSync(path, JSON.stringify(payload));
  return path;
}

const pullRequest = {
  pull_request: {
    number: 12,
    base: { ref: 'main', repo: { full_name: 'o/r' } },
    head: { sha: 'headsha', repo: { full_name: 'o/r' } },
  },
  repository: { default_branch: 'main' },
};

describe('readEvent and sourceOf', () => {
  test('reads a pull request', () => {
    const env = {
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_EVENT_PATH: eventFile(pullRequest),
      GITHUB_HEAD_REF: 'feature',
      GITHUB_REF_NAME: '12/merge',
      GITHUB_SHA: 'mergesha',
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_REPOSITORY: 'o/r',
      GITHUB_RUN_ID: '99',
      GITHUB_ACTOR: 'me',
    };
    const event = readEvent(env);
    expect(event).toEqual({
      name: 'pull_request',
      pullRequest: 12,
      baseBranch: 'main',
      headCommit: 'headsha',
      fork: false,
      defaultBranch: 'main',
    });
    expect(sourceOf(env, event)).toEqual({
      repository: 'o/r',
      commit: 'headsha',
      branch: 'feature',
      pullRequest: 12,
      event: 'pull_request',
      runUrl: 'https://github.com/o/r/actions/runs/99',
      actor: 'me',
    });
  });

  test('tells a fork', () => {
    const payload = structuredClone(pullRequest);
    payload.pull_request.head.repo.full_name = 'fork/r';
    const env = { GITHUB_EVENT_NAME: 'pull_request_target', GITHUB_EVENT_PATH: eventFile(payload) };
    expect(readEvent(env).fork).toBe(true);
  });

  test('reads a push, and survives a missing payload', () => {
    const env = { GITHUB_EVENT_NAME: 'push', GITHUB_REF_NAME: 'main', GITHUB_SHA: 'sha' };
    const event = readEvent({ ...env, GITHUB_EVENT_PATH: join(folder, 'missing.json') });
    expect(event.pullRequest).toBeUndefined();
    expect(sourceOf(env, event)).toEqual({ commit: 'sha', branch: 'main', event: 'push' });
  });
});

describe('runIdOf', () => {
  test('uses the start time and the workflow run', () => {
    const env = { GITHUB_RUN_ID: '1234567', GITHUB_RUN_ATTEMPT: '2' };
    expect(runIdOf('2026-10-08T12:00:00+02:00', env)).toBe('20261008T100000Z-1234567-2');
  });

  test('adds a random suffix outside Actions', () => {
    expect(runIdOf('2026-10-08T10:00:00.123Z', {})).toMatch(/^20261008T100000Z-[0-9a-f]{8}$/);
  });
});
