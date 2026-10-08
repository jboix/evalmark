import { expect, test } from 'vitest';
import { isZip, readZip } from '../../src/import/zip.ts';
import { writeZip } from './zip-writer.ts';

test('reads stored, deflated and Zstandard entries, past an archive comment', () => {
  const archive = readZip(
    writeZip(
      [
        { name: 'stored.txt', content: 'plain', method: 0 },
        { name: 'deflated.txt', content: 'squeezed '.repeat(50), method: 8 },
        { name: 'dir/zstd.json', content: '{"ok":true}', method: 93 },
      ],
      'a comment',
    ),
  );
  expect(archive.names).toEqual(['stored.txt', 'deflated.txt', 'dir/zstd.json']);
  expect(archive.read('stored.txt').toString()).toBe('plain');
  expect(archive.read('deflated.txt').toString()).toBe('squeezed '.repeat(50));
  expect(JSON.parse(archive.read('dir/zstd.json').toString())).toEqual({ ok: true });
  expect(() => archive.read('missing')).toThrow('no missing');
});

test('reads ZIP64 records', () => {
  // One stored entry with ZIP64 sizes, offset and end records, checked with Python's zipfile.
  const base64 =
    'UEsDBC0AAAAAAAAAAACGphA2//////////8FABQAYS50eHQBABAABQAAAAAAAAAFAAAAAAAAAGhlbGxvUEsBAi0ALQAAAAAAAAAAAIamEDb//////////wUAHAAAAAAAAAAAAAAA/////2EudHh0AQAYAAUAAAAAAAAABQAAAAAAAAAAAAAAAAAAAFBLBgYsAAAAAAAAAC0ALQAAAAAAAAAAAAEAAAAAAAAAAQAAAAAAAABPAAAAAAAAADwAAAAAAAAAUEsGBwAAAACLAAAAAAAAAAEAAABQSwUG/////////////////////wAA';
  const archive = readZip(Buffer.from(base64, 'base64'));
  expect(archive.read('a.txt').toString()).toBe('hello');
});

test('rejects bytes that are not a zip archive', () => {
  expect(isZip(Buffer.from('{}'))).toBe(false);
  expect(() => readZip(Buffer.alloc(40))).toThrow('not a zip archive');
});
