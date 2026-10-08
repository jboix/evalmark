import { describe, expect, test } from 'vitest';
import {
  caseHistory,
  caseIdsOf,
  passRateOfLetters,
  trialToOpen,
} from '../../src/site/lib/history.ts';
import { summary } from './summaries.ts';

const runs = [
  summary({
    id: 'r3',
    startedAt: '2026-10-03T00:00:00Z',
    cases: { steady: 'PPP', wobbly: 'PFP', broken: 'FFF' },
  }),
  summary({
    id: 'r2',
    startedAt: '2026-10-02T00:00:00Z',
    cases: { steady: 'PPP', wobbly: 'PPP', broken: 'FEF' },
  }),
  summary({ id: 'r1', startedAt: '2026-10-01T00:00:00Z', cases: { steady: 'PPS', wobbly: 'FPF' } }),
];

describe('caseHistory', () => {
  test('is oldest first and marks runs without the case', () => {
    const cells = caseHistory(runs, 'broken');
    expect(cells.map((cell) => cell.run.id)).toEqual(['r1', 'r2', 'r3']);
    expect(cells.map((cell) => cell.status)).toEqual([undefined, 'fail', 'fail']);
  });
});

describe('passRateOfLetters', () => {
  test('counts passed trials over trials that ran, skipped ones left out', () => {
    expect(passRateOfLetters(['PPS', 'PFP'])).toBeCloseTo(4 / 5);
    expect(passRateOfLetters([undefined, 'FEF'])).toBe(0);
    expect(passRateOfLetters(['SS', undefined])).toBeNull();
    expect(passRateOfLetters([])).toBeNull();
  });
});

describe('trialToOpen', () => {
  test('opens the first trial that did not pass', () => {
    expect(trialToOpen('PPF')).toBe(2);
    expect(trialToOpen('PEP')).toBe(1);
    expect(trialToOpen('PPP')).toBe(0);
    expect(trialToOpen(undefined)).toBe(0);
  });
});

describe('caseIdsOf', () => {
  test('orders the cases the runs have by title, then id', () => {
    expect(caseIdsOf(runs, { broken: { title: 'Zebra' }, steady: { title: 'Apple' } })).toEqual([
      'steady',
      'wobbly',
      'broken',
    ]);
    expect(caseIdsOf(runs.slice(2), { gone: { title: 'Gone' } })).toEqual(['steady', 'wobbly']);
  });
});
