/**
 * The report in Markdown: the run's totals, compared with a base run when there is one, and the
 * cases that changed. The pull request comment and the job summary both show it.
 */
import type { CaseChange, RunDiff } from '../format/compare.ts';
import type { RunSummary, Totals } from '../format/store.ts';
import {
  formatCost,
  formatDelta,
  formatDuration,
  formatPercent,
  formatPointsDelta,
  formatTokens,
} from './numbers.ts';

/** What the report shows. */
export interface ReportInput {
  /** The suite's name. */
  readonly suite: string;
  /** The recorded run. */
  readonly head: RunSummary;
  /** The comparison with the base run, when there is one. */
  readonly diff: RunDiff | undefined;
  /** The branch the base run was looked for on, when one was. */
  readonly baseBranch: string | undefined;
  /** The site's address, for the links. */
  readonly siteUrl: string | undefined;
}

/** How many cases a list shows before it says how many more there are. */
const listLimit = 50;

/**
 * The hidden marker that finds a suite's comment on a pull request. Runs with other labels, such
 * as other models, each keep a comment of their own.
 *
 * @param suite - The suite's name.
 * @param labels - The run's labels.
 * @returns The HTML comment.
 */
export function markerOf(suite: string, labels: Readonly<Record<string, string>> = {}): string {
  const pairs = Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`);
  const name = [suite, ...pairs].join(' ');
  return `<!-- evalmark:${name.replaceAll('--', '-').replaceAll('>', '')} -->`;
}

/**
 * Text made safe in Markdown that GitHub renders: no HTML and no line breaks.
 *
 * @param text - The text.
 * @returns The safe text.
 */
export function escapeMarkdown(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/[\r\n|]+/g, ' ');
}

/**
 * Text as inline code.
 *
 * @param text - The text, such as a case id.
 * @returns The code span.
 */
function code(text: string): string {
  return `\`${text.replace(/[`\r\n]+/g, "'")}\``;
}

/**
 * A link into the site.
 *
 * @param siteUrl - The site's address.
 * @param route - The route, such as `#/runs/<id>`.
 * @returns The address.
 */
export function siteLink(siteUrl: string, route: string): string {
  return `${siteUrl.replace(/#.*$/, '')}${route}`;
}

/** A row of the totals table: a name and how each totals read. */
interface Row {
  /** The metric's name. */
  readonly name: string;
  /** How a run's value reads. */
  readonly value: (totals: Totals) => string;
  /** How the change reads, from the base to the head. */
  readonly change: (base: Totals, head: Totals) => string;
}

/** The rows of the totals table. */
const rows: readonly Row[] = [
  {
    name: 'Pass rate',
    value: (totals) => (totals.passRate === null ? 'n/a' : formatPercent(totals.passRate)),
    change: (base, head) =>
      base.passRate === null || head.passRate === null
        ? 'n/a'
        : formatPointsDelta(head.passRate - base.passRate),
  },
  {
    name: 'Cases passed',
    value: (totals) => `${totals.casesPassed}/${totals.cases}`,
    change: (base, head) => formatDelta(head.casesPassed - base.casesPassed, String),
  },
  {
    name: 'Cost',
    value: (totals) => formatCost(totals.costUsd),
    change: (base, head) => formatDelta(head.costUsd - base.costUsd, formatCost),
  },
  {
    name: 'Tokens',
    value: (totals) => formatTokens(totals.inputTokens + totals.outputTokens),
    change: (base, head) =>
      formatDelta(
        head.inputTokens + head.outputTokens - (base.inputTokens + base.outputTokens),
        formatTokens,
      ),
  },
  {
    name: 'Duration',
    value: (totals) => formatDuration(totals.durationMs),
    change: (base, head) => formatDelta(head.durationMs - base.durationMs, formatDuration),
  },
];

/**
 * The totals table: the head alone, or base, head and change.
 *
 * @param head - The head's totals.
 * @param base - The base's totals, when there is a base run.
 * @returns The table's lines.
 */
export function totalsTable(head: Totals, base: Totals | undefined): string[] {
  if (base === undefined) {
    return [
      '| | This run |',
      '| --- | --- |',
      ...rows.map((row) => `| ${row.name} | ${row.value(head)} |`),
    ];
  }
  return [
    '| | Base | Head | Change |',
    '| --- | --- | --- | --- |',
    ...rows.map(
      (row) =>
        `| ${row.name} | ${row.value(base)} | ${row.value(head)} | ${row.change(base, head)} |`,
    ),
  ];
}

/**
 * A list of cases, as Markdown bullets, cut at the limit.
 *
 * @param items - The bullets' text.
 * @returns The bullets.
 */
function bullets(items: readonly string[]): string[] {
  const shown = items.slice(0, listLimit).map((item) => `- ${item}`);
  const more = items.length - shown.length;
  return more > 0 ? [...shown, `- and ${more} more`] : shown;
}

/**
 * A case change as text.
 *
 * @param change - The change.
 * @returns Such as `` `q1`: pass → fail ``.
 */
function changeText(change: CaseChange): string {
  return `${code(change.id)}: ${change.before ?? 'new'} → ${change.after}`;
}

/**
 * A collapsed section, left out when empty.
 *
 * @param title - Its title.
 * @param items - Its bullets' text.
 * @returns Its lines.
 */
function collapsed(title: string, items: readonly string[]): string[] {
  if (items.length === 0) return [];
  const summary = `<summary>${title} (${items.length})</summary>`;
  return ['', '<details>', summary, '', ...bullets(items), '', '</details>'];
}

/**
 * The cases that changed: regressed ones in sight, the others collapsed.
 *
 * @param diff - The comparison.
 * @returns The lines.
 */
function caseSections(diff: RunDiff): string[] {
  const regressed =
    diff.regressed.length === 0
      ? []
      : [
          '',
          `**Regressed (${diff.regressed.length})**`,
          '',
          ...bullets(diff.regressed.map(changeText)),
        ];
  return [
    ...regressed,
    ...collapsed('Fixed', diff.fixed.map(changeText)),
    ...collapsed('Still failing', diff.stillFailing.map(changeText)),
    ...collapsed(
      'Added',
      diff.added.map((change) => `${code(change.id)}: ${change.after}`),
    ),
    ...collapsed('Removed', diff.removed.map(code)),
  ];
}

/**
 * The line that says what the run is compared with.
 *
 * @param input - The report's input.
 * @returns The line.
 */
function baselineLine(input: ReportInput): string {
  const base = input.diff?.base;
  if (base === undefined) {
    const where = input.baseBranch === undefined ? '' : ` on ${code(input.baseBranch)}`;
    return `No earlier run${where} to compare with: this run's totals are below.`;
  }
  const commit = base.source.commit ? ` at ${code(base.source.commit.slice(0, 7))}` : '';
  const branch = base.source.branch ? ` on ${code(base.source.branch)}` : '';
  return `Compared with run ${code(base.id)}${branch}${commit}.`;
}

/**
 * The links into the site, when its address is known.
 *
 * @param input - The report's input.
 * @returns The lines.
 */
function linkLines(input: ReportInput): string[] {
  if (input.siteUrl === undefined) return [];
  const links = [`[This run](${siteLink(input.siteUrl, `#/runs/${input.head.id}`)})`];
  const base = input.diff?.base;
  if (base !== undefined) {
    const route = `#/compare?base=${base.id}&head=${input.head.id}`;
    links.push(`[The comparison](${siteLink(input.siteUrl, route)})`);
  }
  return ['', links.join(' · ')];
}

/**
 * The report.
 *
 * @param input - What it shows.
 * @returns The Markdown, starting with the suite's marker.
 */
export function reportMarkdown(input: ReportInput): string {
  const lines = [
    markerOf(input.suite, input.head.labels),
    `### evalmark: ${escapeMarkdown(input.suite)}`,
    '',
    baselineLine(input),
    '',
    ...totalsTable(input.head.totals, input.diff?.base.totals),
    ...(input.diff === undefined ? [] : caseSections(input.diff)),
    ...linkLines(input),
  ];
  return `${lines.join('\n')}\n`;
}
