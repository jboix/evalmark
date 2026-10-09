import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { resultSchema } from './result.ts';

describe('the result format', () => {
  test('validates with zod set to jitless, so no code is built at runtime', () => {
    expect(resultSchema).toBeDefined();
    expect(z.config().jitless).toBe(true);
  });
});
