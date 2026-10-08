/**
 * A trial's side column: its checks in words, the error it ended in, what it said at the end with
 * its own screenshots, and what it spent.
 */
import type { StoredCase, StoredTrial } from '../../format/store.ts';
import { Shots } from '../components/shots.tsx';
import { Mark } from '../components/status.tsx';
import { formatCost, formatCount, formatDuration, formatPercent } from '../lib/format.ts';
import { type CheckRow, checkRows } from '../lib/run.ts';
import { checksSummary } from '../lib/timeline.ts';

/**
 * The side column.
 *
 * @param props - The case, the trial and its index.
 * @returns The column.
 */
export function TrialSide(props: {
  readonly stored: StoredCase;
  readonly trial: StoredTrial;
  readonly index: number;
}) {
  const { stored, trial } = props;
  return (
    <aside class="trial-side" aria-label="About this trial">
      <Checks rows={checkRows(stored.checks ?? [], trial.checks ?? [])} />
      {trial.error === undefined ? null : (
        <section class="side-block">
          <h2 class="side-title">
            <Mark kind="error" />
            Error
          </h2>
          <pre class="code code-error">{trial.error}</pre>
        </section>
      )}
      <FinalWords trial={trial} index={props.index} />
      <Usage trial={trial} />
    </aside>
  );
}

/** Each check state's mark. */
const checkMarks = { pass: 'pass', fail: 'fail', none: 'skip' } as const;

/** Each check state's word, read out with its mark. */
const checkWords = { pass: 'passed', fail: 'failed', none: 'not run' } as const;

/**
 * The mark of the checks' heading.
 *
 * @param failed - Whether a check failed.
 * @param rows - The checks.
 * @returns A cross when one failed, a hollow circle when none ran, else a pass.
 */
function summaryMark(failed: boolean, rows: readonly CheckRow[]) {
  if (failed) return 'fail';
  return rows.every((row) => row.state === 'none') ? 'skip' : 'pass';
}

/**
 * The checks, each described in words, failed ones with what they found.
 *
 * @param props - The checks.
 * @returns The card, or nothing when the case has none.
 */
function Checks(props: { readonly rows: readonly CheckRow[] }) {
  if (props.rows.length === 0) return null;
  const summary = checksSummary(props.rows.map((row) => row.state));
  return (
    <section class="side-block">
      <h2 class="side-title">
        <Mark kind={summaryMark(summary.failed, props.rows)} />
        {summary.title}
      </h2>
      <ul class="checks-list">
        {props.rows.map((row) => (
          <li key={row.id} class="check">
            <Mark kind={checkMarks[row.state]} label={checkWords[row.state]} />
            <div class="check-text">
              <span class="strong">{row.description ?? row.id}</span>
              {row.description === undefined ? null : <span class="case-sub">{row.id}</span>}
              {row.message === undefined ? null : <span class="check-message">{row.message}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * What the agent said at the end, with the trial's own screenshots.
 *
 * @param props - The trial and its index.
 * @returns The card, or nothing when it has neither.
 */
function FinalWords(props: { readonly trial: StoredTrial; readonly index: number }) {
  const { trial } = props;
  const attachments = trial.attachments ?? [];
  if (trial.output === undefined && attachments.length === 0) return null;
  return (
    <section class="side-block">
      <h2 class="side-title">Output</h2>
      {trial.output === undefined ? null : <p class="side-text">{trial.output}</p>}
      <Shots attachments={attachments} owner={`trial ${props.index + 1}`} />
    </section>
  );
}

/**
 * What the trial spent and scored; values it does not have are left out.
 *
 * @param props - The trial.
 * @returns The card, or nothing when it has none.
 */
function Usage(props: { readonly trial: StoredTrial }) {
  const { trial } = props;
  const usage = trial.usage;
  const items = [
    ['Duration', trial.durationMs === undefined ? undefined : formatDuration(trial.durationMs)],
    ['Cost', usage?.costUsd === undefined ? undefined : formatCost(usage.costUsd)],
    ['Input tokens', usage?.inputTokens === undefined ? undefined : formatCount(usage.inputTokens)],
    [
      'Output tokens',
      usage?.outputTokens === undefined ? undefined : formatCount(usage.outputTokens),
    ],
    ['Score', trial.score === undefined ? undefined : formatPercent(trial.score)],
  ].filter((item): item is [string, string] => item[1] !== undefined);
  if (items.length === 0) return null;
  return (
    <section class="side-block">
      <h2 class="side-title">Usage</h2>
      <dl class="usage-list">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd class="num">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
