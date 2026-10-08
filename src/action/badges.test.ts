import { describe, expect, test } from 'vitest';
import type { RunSummary } from '../format/store.ts';
import { totalsOf } from '../format/totals.ts';
import { badgeEndpoint, badgeRun, badgeSvg, badgesOf, escapeXml } from './badges.ts';

/**
 * A run summary for the tests.
 *
 * @param id - Its id.
 * @param branch - Its branch.
 * @param statuses - Its trials' statuses.
 * @returns The summary.
 */
function summary(id: string, branch: string, statuses: ('pass' | 'fail')[]): RunSummary {
  return {
    id,
    recordedAt: '2026-10-01T00:00:00Z',
    startedAt: '2026-10-01T00:00:00Z',
    labels: {},
    source: { branch },
    totals: totalsOf([
      { trials: statuses.map((status) => ({ status, usage: { costUsd: 0.25 } })) },
    ]),
    cases: {},
    transcripts: false,
  };
}

describe('badges', () => {
  test('escape XML', () => {
    expect(escapeXml(`<a & "b" 'c'>`)).toBe('&lt;a &amp; &quot;b&quot; &apos;c&apos;&gt;');
  });

  test('show the pass rate and the cost', () => {
    const badges = badgesOf(summary('r', 'main', ['pass', 'pass', 'pass', 'fail']));
    expect(badges['pass-rate']).toEqual({ label: 'pass rate', message: '75%', color: '#97ca00' });
    expect(badges.cost).toEqual({ label: 'eval cost', message: '$1.00', color: '#007ec6' });
  });

  test('render a flat SVG with escaped text', () => {
    const svg = badgeSvg({ label: 'a<b', message: '1&2', color: '#4c1' });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('<title>a&lt;b: 1&amp;2</title>');
    expect(svg).not.toContain('a<b');
  });

  test('write a shields.io endpoint', () => {
    expect(
      JSON.parse(badgeEndpoint({ label: 'pass rate', message: '75%', color: '#97ca00' })),
    ).toEqual({
      schemaVersion: 1,
      label: 'pass rate',
      message: '75%',
      color: '97ca00',
    });
  });

  test('come from the newest run on the default branch', () => {
    const runs = [summary('pr', 'feature', ['fail']), summary('main', 'main', ['pass'])];
    expect(badgeRun(runs, 'main')?.id).toBe('main');
    expect(badgeRun(runs, undefined)?.id).toBe('pr');
    expect(badgeRun(runs, 'trunk')).toBeUndefined();
  });
});
