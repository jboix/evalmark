import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterAll, describe, expect, test } from 'vitest';
import { contentTypeOf, fileFor, portOf, serveFolder, withHostValue } from './serve.ts';

const root = mkdtempSync(join(tmpdir(), 'evalmark-serve-'));
const folder = join(root, 'site');
mkdirSync(join(folder, 'data'), { recursive: true });
writeFileSync(join(folder, 'index.html'), '<p>hi</p>');
writeFileSync(join(folder, 'data/t.json.gz'), gzipSync('[]'));
writeFileSync(join(root, 'secret.txt'), 'no');
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('serving a folder', () => {
  test('maps paths to files inside the folder only', () => {
    expect(fileFor(folder, '/')).toBe(join(folder, 'index.html'));
    expect(fileFor(folder, '/data/t.json.gz')).toBe(join(folder, 'data/t.json.gz'));
    expect(fileFor(folder, '/missing')).toBeUndefined();
    expect(fileFor(folder, '/../secret.txt')).toBeUndefined();
    expect(fileFor(folder, '/%2e%2e/secret.txt')).toBeUndefined();
    expect(fileFor(folder, '/%E0%A4%A')).toBeUndefined();
  });

  test('serves gzipped files as bytes, without Content-Encoding', async () => {
    expect(contentTypeOf('a.json.gz')).toBe('application/octet-stream');
    expect(contentTypeOf('a.js')).toBe('text/javascript; charset=utf-8');
    const server = await serveFolder(folder, 0);
    try {
      const page = await fetch(new URL('/', server.url));
      expect(await page.text()).toBe('<p>hi</p>');
      const transcript = await fetch(new URL('/data/t.json.gz', server.url));
      expect(transcript.headers.get('content-type')).toBe('application/octet-stream');
      expect(transcript.headers.get('content-encoding')).toBeNull();
      expect((await fetch(new URL('/nope', server.url))).status).toBe(404);
    } finally {
      await server.close();
    }
  });
});

describe('withHostValue', () => {
  test('reads a bare --host as every interface', () => {
    expect(withHostValue(['--host'])).toEqual(['--host', '0.0.0.0']);
    expect(withHostValue(['--host', '--port', '1'])).toEqual(['--host', '0.0.0.0', '--port', '1']);
  });

  test('keeps a given address', () => {
    expect(withHostValue(['--host', '192.168.1.5'])).toEqual(['--host', '192.168.1.5']);
  });
});

describe('portOf', () => {
  test('reads a port and refuses anything else', () => {
    expect(portOf('8080')).toBe(8080);
    expect(portOf('0')).toBe(0);
    expect(() => portOf('abc')).toThrow('--port takes a number');
    expect(() => portOf('70000')).toThrow('--port takes a number');
    expect(() => portOf('-1')).toThrow('--port takes a number');
  });
});
