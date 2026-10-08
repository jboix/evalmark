import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  result,
  runAction,
  type Sandbox,
  sandbox,
  token,
  writeEvent,
  writeResult,
} from './helpers.ts';

/** A comment the fake API holds. */
interface FakeComment {
  id: number;
  body: string;
}

let box: Sandbox;
let server: Server;
let api: string;
let comments: FakeComment[];
let requests: string[];

/**
 * Sends a JSON answer.
 *
 * @param response - The response.
 * @param status - The status.
 * @param value - The body.
 */
function send(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(value));
}

/**
 * Answers one request of the fake GitHub API: the comments of one pull request.
 *
 * @param request - The request.
 * @param response - The response.
 */
async function answer(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  requests.push(`${request.method} ${url.pathname}${url.search}`);
  if (request.headers.authorization !== `Bearer ${token}`) return send(response, 401, {});
  if (request.method === 'GET') {
    const page = Number(url.searchParams.get('page'));
    return send(response, 200, comments.slice((page - 1) * 100, page * 100));
  }
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const { body } = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { body: string };
  if (request.method === 'POST') {
    comments.push({ id: 1000 + comments.length, body });
    return send(response, 201, {});
  }
  const id = Number(url.pathname.split('/').at(-1));
  const existing = comments.find((comment) => comment.id === id);
  if (existing) existing.body = body;
  send(response, 200, {});
}

beforeEach(async () => {
  box = sandbox();
  requests = [];
  // Another bot's comments fill the first page, so the action has to read the second.
  comments = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, body: 'other' }));
  server = createServer((request, response) => void answer(request, response));
  await new Promise<void>((listening) => server.listen(0, '127.0.0.1', listening));
  api = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise((closed) => server.close(closed));
  box.cleanup();
});

test('the pull request comment is created, then updated in place', async () => {
  await runAction(box, { result: writeResult(box, 'main.json', result('2026-10-08T09:00:00Z')) });
  const event = writeEvent(box, {
    pull_request: {
      number: 7,
      base: { ref: 'main', repo: { full_name: 'owner/repo' } },
      head: { sha: 'b'.repeat(40), repo: { full_name: 'owner/repo' } },
    },
    repository: { default_branch: 'main' },
  });
  const pullRequest = {
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: event,
    GITHUB_HEAD_REF: 'feature',
    GITHUB_API_URL: api,
  };
  const inputs = { 'site-url': 'https://owner.github.io/repo/evalmark/' };
  const first = await runAction(
    box,
    {
      ...inputs,
      result: writeResult(
        box,
        'a.json',
        result('2026-10-08T10:00:00Z', { q1: 'fail', q2: 'fail' }),
      ),
    },
    { ...pullRequest, GITHUB_RUN_ID: '1001' },
  );
  expect(first.code).toBe(0);
  expect(first.log).toContain('The pull request comment was created.');
  const posted = comments.filter((comment) =>
    comment.body.includes('<!-- evalmark:agent model=m1 -->'),
  );
  expect(posted).toHaveLength(1);
  expect(posted[0]?.body).toContain('**Regressed (1)**');
  expect(posted[0]?.body).toContain(
    'Compared with run `20261008T090000Z-1000-1` on `main` at `aaaaaaa`.',
  );
  expect(posted[0]?.body).toContain(
    'https://owner.github.io/repo/evalmark/#/compare?base=20261008T090000Z-1000-1&head=20261008T100000Z-1001-1',
  );
  expect(first.outputs['run-url']).toBe(
    'https://owner.github.io/repo/evalmark/#/runs/20261008T100000Z-1001-1',
  );

  const second = await runAction(
    box,
    {
      ...inputs,
      result: writeResult(
        box,
        'b.json',
        result('2026-10-08T11:00:00Z', { q1: 'pass', q2: 'pass' }),
      ),
    },
    { ...pullRequest, GITHUB_RUN_ID: '1002' },
  );
  expect(second.log).toContain('The pull request comment was updated.');
  const updated = comments.filter((comment) =>
    comment.body.includes('<!-- evalmark:agent model=m1 -->'),
  );
  expect(updated).toHaveLength(1);
  expect(updated[0]?.body).toContain('20261008T110000Z-1002-1');
  expect(requests.filter((line) => line.startsWith('PATCH'))).toHaveLength(1);
});

test('a failing API is a warning, and the run is still recorded', async () => {
  const event = writeEvent(box, {
    pull_request: {
      number: 7,
      base: { ref: 'main', repo: { full_name: 'owner/repo' } },
      head: { sha: 'b'.repeat(40), repo: { full_name: 'owner/repo' } },
    },
  });
  const outcome = await runAction(
    box,
    { result: writeResult(box, 'a.json', result('2026-10-08T10:00:00Z')), token: 'wrong' },
    {
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_EVENT_PATH: event,
      GITHUB_API_URL: api,
    },
  );
  expect(outcome.code).toBe(0);
  expect(outcome.log).toContain('::warning::The pull request comment failed: GitHub answered 401');
  expect(outcome.outputs.recorded).toBe('true');
});
