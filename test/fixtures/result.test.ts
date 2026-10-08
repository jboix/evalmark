import { expect, test } from 'vitest';
import { resultSchema } from '../../src/format/result.ts';
import fixture from './result.json';

test('the fixture result validates against the result format', () => {
  const parsed = resultSchema.safeParse(fixture);
  expect(parsed.error).toBeUndefined();
});

test('the fixture covers every trial status', () => {
  const statuses = new Set(
    fixture.cases.flatMap((entry) => entry.trials.map((trial) => trial.status)),
  );
  expect([...statuses].sort()).toEqual(['error', 'fail', 'pass', 'skip']);
});
