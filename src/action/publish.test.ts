import { describe, expect, test } from 'vitest';
import { authEnvironment, fullRef } from './git.ts';
import { hasFilesOutside, shouldSquash } from './publish.ts';

describe('history', () => {
  test('squashes as the policy says', () => {
    expect(shouldSquash('squash', false, true)).toBe(true);
    expect(shouldSquash('keep', true, false)).toBe(false);
    expect(shouldSquash('auto', true, false)).toBe(true);
    expect(shouldSquash('auto', true, true)).toBe(false);
    expect(shouldSquash('auto', false, false)).toBe(false);
  });

  test('sees files outside the folder', () => {
    expect(hasFilesOutside(['evalmark/index.html', 'evalmark/data/index.json'], 'evalmark')).toBe(
      false,
    );
    expect(hasFilesOutside(['evalmark/index.html', 'index.html'], 'evalmark')).toBe(true);
    expect(hasFilesOutside(['evalmarkx/file'], 'evalmark')).toBe(true);
  });
});

describe('git', () => {
  test('takes a branch or a full ref', () => {
    expect(fullRef('evalmark')).toBe('refs/heads/evalmark');
    expect(fullRef('refs/evalmark/data')).toBe('refs/evalmark/data');
  });

  test('sends the token as a basic auth header only', () => {
    expect(authEnvironment('')).toEqual({});
    const header = Buffer.from('x-access-token:t0k').toString('base64');
    expect(authEnvironment('t0k')).toEqual({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.extraheader',
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${header}`,
    });
  });
});
