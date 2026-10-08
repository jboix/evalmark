import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Attachment, Result } from '../format/result.ts';
import { attachmentPathsOf, loadAttachments, sha256Of, staysInside } from './attachment-files.ts';

let root: string;
let folder: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'evalmark-attachments-'));
  folder = join(root, 'results');
  mkdirSync(join(folder, 'shots'), { recursive: true });
  writeFileSync(join(folder, 'shots/a.png'), 'image a');
  writeFileSync(join(root, 'outside.png'), 'secret');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/**
 * A result whose one trial has the given attachments, and a tool call with one more.
 *
 * @param paths - The trial's attachment paths.
 * @param toolPath - The tool call's attachment path.
 * @returns The result.
 */
function resultWith(paths: readonly string[], toolPath = 'shots/a.png'): Result {
  const attachment = (path: string): Attachment => ({ path, mediaType: 'image/png' });
  return {
    version: 1,
    cases: [
      {
        id: 'c',
        trials: [
          {
            status: 'fail',
            attachments: paths.map(attachment),
            transcript: [
              {
                role: 'assistant',
                toolCalls: [{ name: 't', attachments: [attachment(toolPath)] }],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('staysInside', () => {
  test('accepts a path inside the folder', () => {
    expect(staysInside('/r', 'a.png')).toBe(true);
    expect(staysInside('/r', 'shots/../a.png')).toBe(true);
    expect(staysInside('/r', '..a.png')).toBe(true);
  });

  test('refuses an absolute path, the folder itself, or a path that climbs out', () => {
    expect(staysInside('/r', '/etc/passwd')).toBe(false);
    expect(staysInside('/r', 'C:\\a.png')).toBe(false);
    expect(staysInside('/r', '.')).toBe(false);
    expect(staysInside('/r', '../a.png')).toBe(false);
    expect(staysInside('/r', 'shots/../../a.png')).toBe(false);
  });
});

describe('loadAttachments', () => {
  test('lists every path once, tool calls included', () => {
    expect(attachmentPathsOf(resultWith(['shots/a.png', 'b.png']))).toEqual([
      'shots/a.png',
      'b.png',
    ]);
  });

  test('finds a file with its size and hash, and reports a missing one', async () => {
    const loaded = await loadAttachments(resultWith(['shots/a.png', 'gone.png']), folder);
    const found = loaded.files.get('shots/a.png');
    expect(found?.bytes).toBe(7);
    expect(found?.sha256).toBe(await sha256Of(join(folder, 'shots/a.png')));
    expect(found?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(loaded.files.get('gone.png')).toBeUndefined();
    expect(loaded.missing).toEqual(['gone.png']);
  });

  test('refuses absolute paths and paths out of the folder, naming each', async () => {
    const result = resultWith([join(root, 'outside.png'), '../outside.png']);
    const refused = loadAttachments(result, folder);
    await expect(refused).rejects.toThrow('not inside the result file');
    await expect(refused).rejects.toThrow(`- ${join(root, 'outside.png')}\n- ../outside.png`);
  });

  test('refuses a symbolic link that leads out, and follows one that stays in', async () => {
    symlinkSync(join(root, 'outside.png'), join(folder, 'link.png'));
    symlinkSync(join(folder, 'shots/a.png'), join(folder, 'inner.png'));
    await expect(loadAttachments(resultWith(['link.png']), folder)).rejects.toThrow('link.png');
    const loaded = await loadAttachments(resultWith(['inner.png']), folder);
    expect(loaded.files.get('inner.png')?.source.endsWith('shots/a.png')).toBe(true);
  });
});
