/**
 * Values as the tables and facts lines show them: dates, commits, labels, changes and figures.
 */
import type { Source, Totals } from '../../format/store.ts';
import {
  formatCost,
  formatDateTime,
  formatDuration,
  formatPercent,
  missing,
  shortSha,
} from '../lib/format.ts';
import { labelsText } from '../lib/runs.ts';
import { sourceLinks } from '../lib/source.ts';

/** Which way a change is an improvement. */
type Better = 'higher' | 'lower';

/**
 * A change with its sign, marked as better or worse by colour and by its sign.
 *
 * @param props - The change, how to write it with its sign, and which way is better.
 * @returns The change, or nothing when it is `null`.
 */
export function Delta(props: {
  readonly value: number | null | undefined;
  readonly format: (value: number) => string;
  readonly better: Better;
}) {
  if (props.value === null || props.value === undefined) return null;
  if (Math.abs(props.value) < 1e-9) return <span class="num">{props.format(0)}</span>;
  const improved = props.better === 'higher' ? props.value > 0 : props.value < 0;
  return (
    <span class={`num ${improved ? 'tone-good' : 'tone-bad'}`}>{props.format(props.value)}</span>
  );
}

/**
 * A date and time, as figures.
 *
 * @param props - The date, as ISO 8601.
 * @returns The date.
 */
export function When(props: { readonly iso: string }) {
  return (
    <time class="tabular nowrap" dateTime={props.iso}>
      {formatDateTime(props.iso)}
    </time>
  );
}

/**
 * A run's commit, linked when the repository is known.
 *
 * @param props - The run's source.
 * @returns The short SHA, or a dash.
 */
export function Commit(props: { readonly source: Source }) {
  const commit = props.source.commit;
  if (commit === undefined) return <span class="muted">{missing}</span>;
  const link = sourceLinks(props.source).find((entry) => entry.kind === 'Commit');
  if (link === undefined) return <span class="mono">{shortSha(commit)}</span>;
  return (
    <a class="mono" href={link.href} rel="noreferrer" target="_blank">
      {link.text}
    </a>
  );
}

/**
 * A run's workflow run and pull request links.
 *
 * @param props - The run's source.
 * @returns The links, or nothing.
 */
export function RunLinks(props: { readonly source: Source }) {
  const found = sourceLinks(props.source).filter((link) => link.kind !== 'Commit');
  return (
    <>
      {found.map((link) => (
        <a key={link.kind} href={link.href} rel="noreferrer" target="_blank">
          {link.kind === 'Workflow run' ? 'workflow run' : `pull request ${link.text}`}
        </a>
      ))}
    </>
  );
}

/**
 * A run's labels in one line.
 *
 * @param props - The labels.
 * @returns Such as `model: pro`, or a dash.
 */
export function Labels(props: { readonly labels: Readonly<Record<string, string>> }) {
  const text = labelsText(props.labels);
  return text === '' ? <span class="muted">{missing}</span> : <span>{text}</span>;
}

/**
 * A figure that may be missing, as a number.
 *
 * @param props - The value and how to write it.
 * @returns The figure, or a dash.
 */
export function Figure(props: {
  readonly value: number | null | undefined;
  readonly format: (value: number) => string;
}) {
  if (props.value === null || props.value === undefined)
    return <span class="muted">{missing}</span>;
  return <>{props.format(props.value)}</>;
}

/**
 * A run's pass rate, cost and duration, each its own fact.
 *
 * @param props - The run's totals.
 * @returns The figures.
 */
export function RunFigures(props: { readonly totals: Totals }) {
  const { totals } = props;
  return (
    <>
      <span>
        <span class="num">{formatPercent(totals.passRate)}</span> of trials passed
      </span>
      <span class="num">{formatCost(totals.costUsd)}</span>
      <span class="num">{formatDuration(totals.durationMs)}</span>
    </>
  );
}
