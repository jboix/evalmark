import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { createRedactor } from './redact.ts';
import { readResult } from './result-file.ts';

const folder = mkdtempSync(join(tmpdir(), 'evalmark-result-'));
afterAll(() => rmSync(folder, { recursive: true, force: true }));

/**
 * Writes a file.
 *
 * @param name - Its name.
 * @param text - Its content.
 * @returns Its path.
 */
function file(name: string, text: string): string {
  const path = join(folder, name);
  writeFileSync(path, text);
  return path;
}

describe('readResult', () => {
  const redact = createRedactor(['hunter2']);

  test('validates, labels and redacts', async () => {
    const path = file(
      'ok.json',
      JSON.stringify({
        version: 1,
        labels: { model: 'a', env: 'ci' },
        cases: [
          {
            id: 'q',
            trials: [
              {
                status: 'pass',
                transcript: [
                  {
                    role: 'assistant',
                    toolCalls: [{ name: 'login', input: { password: 'hunter2' } }],
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
    const result = await readResult(path, { model: 'b' }, redact);
    expect(result.labels).toEqual({ model: 'b', env: 'ci' });
    expect(result.cases[0]?.trials[0]?.transcript?.[0]?.toolCalls?.[0]?.input).toEqual({
      password: '[redacted]',
    });
  });

  test('lists every issue of an invalid result', async () => {
    const path = file('bad.json', JSON.stringify({ version: 2, cases: [{ trials: [] }] }));
    const failure = readResult(path, {}, redact);
    await expect(failure).rejects.toThrow('is not a valid result');
    await expect(failure).rejects.toThrow('- version:');
    await expect(failure).rejects.toThrow('- cases.0.id:');
  });

  test('says when the file is missing or not JSON', async () => {
    await expect(readResult(join(folder, 'missing.json'), {}, redact)).rejects.toThrow(
      'could not be read',
    );
    await expect(readResult(file('text.json', 'nope'), {}, redact)).rejects.toThrow('is not JSON');
  });
});
