import { describe, expect, test } from 'vitest';
import { diffRuns } from '../format/compare.ts';
import type { RunSummary } from '../format/store.ts';
import { totalsOf } from '../format/totals.ts';
import { escapeMarkdown, markerOf, reportMarkdown, siteLink } from './report.ts';

/**
 * A run summary for the tests.
 *
 * @param id - Its id.
 * @param cases - Its cases' letters.
 * @returns The summary.
 */
function summary(id: string, cases: Record<string, string>): RunSummary {
  const statuses = { P: 'pass', F: 'fail' } as const;
  return {
    id,
    recordedAt: '2026-10-01T00:00:00Z',
    startedAt: '2026-10-01T00:00:00Z',
    labels: {},
    source: { branch: 'main', commit: '0123456789abcdef' },
    totals: totalsOf(
      Object.values(cases).map((letters) => ({
        trials: letters.split('').map((letter) => ({
          status: statuses[letter as 'P' | 'F'],
          durationMs: 1000,
          usage: { inputTokens: 1000, costUsd: 0.01 },
        })),
      })),
    ),
    cases,
    transcripts: false,
  };
}

const base = summary('base', { a: 'P', b: 'F', c: 'F', gone: 'P' });
const head = summary('head', { a: 'F', b: 'P', c: 'F', fresh: 'P' });

describe('reportMarkdown', () => {
  test('compares with the base run, regressions in sight', () => {
    const markdown = reportMarkdown({
      suite: 'agent',
      head,
      diff: diffRuns(base, head),
      baseBranch: 'main',
      siteUrl: 'https://o.github.io/r/evalmark/',
    });
    expect(markdown.startsWith('<!-- evalmark:agent -->\n### evalmark: agent\n')).toBe(true);
    expect(markdown).toContain('Compared with run `base` on `main` at `0123456`.');
    expect(markdown).toContain('| | Base | Head | Change |');
    expect(markdown).toContain('| Pass rate | 50% | 50% | 0 |');
    expect(markdown).toContain('| Cases passed | 2/4 | 2/4 | 0 |');
    expect(markdown).toContain('**Regressed (1)**\n\n- `a`: pass → fail');
    expect(markdown).toContain('<summary>Fixed (1)</summary>\n\n- `b`: fail → pass');
    expect(markdown).toContain('<summary>Still failing (1)</summary>');
    expect(markdown).toContain('<summary>Added (1)</summary>\n\n- `fresh`: pass');
    expect(markdown).toContain('<summary>Removed (1)</summary>\n\n- `gone`');
    expect(markdown).toContain(
      '[This run](https://o.github.io/r/evalmark/#/runs/head) · [The comparison](https://o.github.io/r/evalmark/#/compare?base=base&head=head)',
    );
  });

  test('shows the totals alone without a base run', () => {
    const markdown = reportMarkdown({
      suite: 'agent',
      head,
      diff: undefined,
      baseBranch: 'main',
      siteUrl: undefined,
    });
    expect(markdown).toContain('No earlier run on `main` to compare with');
    expect(markdown).toContain('| | This run |');
    expect(markdown).toContain('| Cost | $0.04 |');
    expect(markdown).not.toContain('Regressed');
    expect(markdown).not.toContain('](');
  });

  test('cuts long lists', () => {
    const many = Object.fromEntries(Array.from({ length: 60 }, (_, index) => [`c${index}`, 'P']));
    const broken = Object.fromEntries(Object.keys(many).map((id) => [id, 'F']));
    const markdown = reportMarkdown({
      suite: 's',
      head: summary('h', broken),
      diff: diffRuns(summary('b', many), summary('h', broken)),
      baseBranch: 'main',
      siteUrl: undefined,
    });
    expect(markdown).toContain('- and 10 more');
  });
});

describe('helpers', () => {
  test('the marker cannot close early', () => {
    expect(markerOf('a-->b')).toBe('<!-- evalmark:a-b -->');
  });

  test('the marker names the labels, sorted, so each model keeps its own comment', () => {
    expect(markerOf('agent', { provider: 'x', model: 'm1' })).toBe(
      '<!-- evalmark:agent model=m1 provider=x -->',
    );
  });

  test('escapes HTML and table breaks', () => {
    expect(escapeMarkdown('<b>|x\ny')).toBe('&lt;b&gt; x y');
  });

  test('links drop the site address fragment', () => {
    expect(siteLink('https://x/#/old', '#/runs/r')).toBe('https://x/#/runs/r');
  });
});
