import { describe, expect, test } from 'vitest';
import { lettersOf, statusOfLetters, totalsOf } from './totals.ts';

describe('statusOfLetters', () => {
  test('reads every status', () => {
    expect(statusOfLetters('PPP')).toBe('pass');
    expect(statusOfLetters('PSP')).toBe('pass');
    expect(statusOfLetters('FEF')).toBe('fail');
    expect(statusOfLetters('PFP')).toBe('flaky');
    expect(statusOfLetters('SS')).toBe('skip');
    expect(statusOfLetters('')).toBe('skip');
  });
});

describe('totalsOf', () => {
  test('counts trials, cases, usage and duration', () => {
    const totals = totalsOf([
      {
        trials: [
          {
            status: 'pass',
            durationMs: 10,
            usage: { inputTokens: 5, outputTokens: 1, costUsd: 0.5 },
          },
          { status: 'fail', durationMs: 20 },
        ],
      },
      { trials: [{ status: 'pass' }, { status: 'skip' }] },
      { trials: [{ status: 'error', usage: { costUsd: 0.25 } }] },
    ]);
    expect(totals).toEqual({
      cases: 3,
      casesPassed: 1,
      casesFlaky: 1,
      casesFailed: 1,
      trials: 5,
      passed: 2,
      failed: 1,
      errored: 1,
      skipped: 1,
      passRate: 0.5,
      inputTokens: 5,
      outputTokens: 1,
      costUsd: 0.75,
      durationMs: 30,
    });
  });

  test('prefers the run’s own duration and has no pass rate when nothing ran', () => {
    const totals = totalsOf([{ trials: [{ status: 'skip', durationMs: 4 }] }], 99);
    expect(totals.durationMs).toBe(99);
    expect(totals.passRate).toBeNull();
  });

  test('writes one letter per trial', () => {
    expect(lettersOf([{ status: 'pass' }, { status: 'error' }, { status: 'skip' }])).toBe('PES');
  });
});
