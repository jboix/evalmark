import { gzipSync } from 'node:zlib';
import { describe, expect, test } from 'vitest';
import { isGzip, readMaybeGzipped } from '../../src/site/lib/data.ts';
import { sourceLinks } from '../../src/site/lib/source.ts';
import { countsOf, elapsedOf, prettyValue, previewOf } from '../../src/site/lib/transcript.ts';

describe('transcripts', () => {
  test('show tool values as text', () => {
    expect(prettyValue('<b>as is</b>')).toBe('<b>as is</b>');
    expect(prettyValue({ a: 1 })).toBe('{\n  "a": 1\n}');
    expect(prettyValue(undefined)).toBe('');
  });

  test('preview a value on one line', () => {
    expect(previewOf({})).toBe('');
    expect(previewOf('a\n  b')).toBe('a b');
    expect(previewOf('x'.repeat(100), 10)).toBe(`${'x'.repeat(9)}…`);
  });

  test('time messages from the first timed one', () => {
    expect(
      elapsedOf([
        { role: 'system' },
        { role: 'user', at: '2026-10-01T00:00:00Z' },
        { role: 'assistant', at: '2026-10-01T00:01:05Z' },
      ]),
    ).toEqual([undefined, '+0ms', '+1m 05s']);
  });

  test('count messages, calls and failed calls', () => {
    expect(
      countsOf([
        { role: 'assistant', toolCalls: [{ name: 'a' }, { name: 'b', error: 'no' }] },
        { role: 'tool' },
      ]),
    ).toEqual({ messages: 2, toolCalls: 2, toolErrors: 1 });
  });

  test('read gzipped and plain JSON alike', async () => {
    const json = new TextEncoder().encode('[{"role":"user"}]');
    const gzipped = gzipSync(json);
    expect(isGzip(gzipped)).toBe(true);
    expect(isGzip(json)).toBe(false);
    expect(await readMaybeGzipped(gzipped)).toEqual([{ role: 'user' }]);
    expect(await readMaybeGzipped(json)).toEqual([{ role: 'user' }]);
  });
});

describe('sourceLinks', () => {
  test('link to the commit, the pull request and the workflow run', () => {
    const links = sourceLinks({
      repository: 'acme/app',
      commit: 'abcdef1234567',
      pullRequest: 7,
      runUrl: 'https://ghe.example.com/acme/app/actions/runs/1',
    });
    expect(links.map((link) => link.href)).toEqual([
      'https://ghe.example.com/acme/app/commit/abcdef1234567',
      'https://ghe.example.com/acme/app/pull/7',
      'https://ghe.example.com/acme/app/actions/runs/1',
    ]);
  });

  test('never link to anything but the web', () => {
    expect(sourceLinks({ runUrl: 'javascript:alert(1)' })).toEqual([]);
    expect(sourceLinks({ repository: 'acme/app', commit: 'abc' })[0]?.href).toBe(
      'https://github.com/acme/app/commit/abc',
    );
  });
});
