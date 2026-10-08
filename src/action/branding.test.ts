import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { writeBranding } from './branding.ts';

const folders: string[] = [];

/**
 * A temporary folder, removed after the test.
 *
 * @returns Its path.
 */
function temporary(): string {
  const folder = mkdtempSync(join(tmpdir(), 'evalmark-branding-'));
  folders.push(folder);
  return folder;
}

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe('writeBranding', () => {
  test('copies the logo and writes the title and subtitle', async () => {
    const root = temporary();
    const logo = join(root, 'logo.svg');
    writeFileSync(logo, '<svg xmlns="http://www.w3.org/2000/svg"/>');
    const folder = join(root, 'evalmark');
    await writeBranding(folder, { title: 'Acme evals', subtitle: 'agent', logo });
    expect(JSON.parse(readFileSync(join(folder, 'data/branding.json'), 'utf8'))).toEqual({
      title: 'Acme evals',
      subtitle: 'agent',
      logo: 'data/branding/logo.svg',
    });
    expect(existsSync(join(folder, 'data/branding/logo.svg'))).toBe(true);
  });

  test('removes a previous logo when none is given any more', async () => {
    const root = temporary();
    const logo = join(root, 'logo.png');
    writeFileSync(logo, 'png');
    const folder = join(root, 'evalmark');
    await writeBranding(folder, { title: 't', subtitle: 's', logo });
    await writeBranding(folder, { title: 't', subtitle: 's', logo: undefined });
    expect(existsSync(join(folder, 'data/branding'))).toBe(false);
  });

  test('refuses a logo that is missing or not an image', async () => {
    const root = temporary();
    const folder = join(root, 'evalmark');
    const missing = { title: 't', subtitle: 's', logo: join(root, 'none.svg') };
    await expect(writeBranding(folder, missing)).rejects.toThrow('does not exist');
    const text = join(root, 'logo.txt');
    writeFileSync(text, 'x');
    await expect(writeBranding(folder, { ...missing, logo: text })).rejects.toThrow('SVG, PNG');
  });
});
