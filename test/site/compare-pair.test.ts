import { describe, expect, test } from 'vitest';
import type { StoreIndex } from '../../src/format/store.ts';
import { candidatesOf, pairOf } from '../../src/site/lib/compare-pair.ts';
import { summary } from './summaries.ts';

const runs = [
  summary({
    id: 'q2',
    startedAt: '2026-10-07T12:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'q' },
  }),
  summary({
    id: 'g2',
    startedAt: '2026-10-07T11:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'g' },
  }),
  summary({
    id: 'q1',
    startedAt: '2026-10-06T12:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'q' },
  }),
  summary({
    id: 'g1',
    startedAt: '2026-10-06T11:00:00Z',
    cases: {},
    branch: 'main',
    labels: { model: 'g' },
  }),
];
const index = { runs } as unknown as StoreIndex;
const gemini = { branch: 'main', labels: { model: 'g' }, open: [], window: 20 };

describe('the two runs to compare', () => {
  test('are picked among the runs of one model', () => {
    const candidates = candidatesOf(index, gemini);
    expect(candidates.map((run) => run.id)).toEqual(['g2', 'g1']);
    const pair = pairOf(candidates, {});
    expect([pair.base?.id, pair.head?.id]).toEqual(['g1', 'g2']);
  });

  test('ignore runs the query names that the filters leave out', () => {
    const pair = pairOf(candidatesOf(index, gemini), { base: 'q1', head: 'q2' });
    expect([pair.base?.id, pair.head?.id]).toEqual(['g1', 'g2']);
  });

  test('are nothing when no run matches', () => {
    const none = { ...gemini, labels: { model: 'x' } };
    expect(pairOf(candidatesOf(index, none), {})).toEqual({ base: undefined, head: undefined });
  });
});
