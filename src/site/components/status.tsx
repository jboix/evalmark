/**
 * Statuses as marks: each has a shape as well as a colour, and a word for assistive technology.
 */
import type { Totals } from '../../format/store.ts';
import { formatDateTime } from '../lib/format.ts';
import type { HistoryCell } from '../lib/history.ts';
import { trialToOpen } from '../lib/history.ts';
import { type MarkKind, markOfLetter, markOfLetters, markWords } from '../lib/marks.ts';
import { links } from '../lib/route.ts';

/**
 * A status mark. With a label it is read out; without one it only repeats the word next to it.
 *
 * @param props - The mark, and the label read out for it.
 * @returns The mark.
 */
export function Mark(props: { readonly kind: MarkKind; readonly label?: string | undefined }) {
  const className = `m m-${props.kind}`;
  if (props.label === undefined) return <span class={className} aria-hidden="true" />;
  return <span class={className} role="img" aria-label={props.label} title={props.label} />;
}

/** The marks the legend explains, in its order. */
const legendKinds: readonly MarkKind[] = ['pass', 'flaky', 'fail', 'error', 'skip'];

/**
 * What each mark means.
 *
 * @returns The legend.
 */
export function MarkLegend() {
  return (
    <ul class="mark-legend" aria-label="What the marks mean">
      {legendKinds.map((kind) => (
        <li key={kind}>
          <Mark kind={kind} />
          {markWords[kind]}
        </li>
      ))}
    </ul>
  );
}

/** Each mark's word, as a status column shows it. */
const statusWords: Readonly<Record<MarkKind, string>> = {
  pass: 'Pass',
  fail: 'Fail',
  flaky: 'Flaky',
  error: 'Error',
  skip: 'Not run',
};

/**
 * A status as a mark and a word.
 *
 * @param props - The mark.
 * @returns The status.
 */
export function StatusWord(props: { readonly kind: MarkKind }) {
  return (
    <span class={`status-word status-${props.kind}`}>
      <Mark kind={props.kind} />
      {statusWords[props.kind]}
    </span>
  );
}

/**
 * A history cell's description, read out and shown on hover.
 *
 * @param cell - The cell.
 * @returns Such as `Oct 8, 2026, 10:00, gemini: flaky (PFP). Open the trial.`
 */
function cellLabel(cell: HistoryCell): string {
  const labels = Object.values(cell.run.labels).join(', ');
  const when = [formatDateTime(cell.run.startedAt), labels].filter((part) => part !== '');
  const outcome =
    cell.letters === undefined
      ? 'not run. Open the run.'
      : `${markWords[markOfLetters(cell.letters)]} (${cell.letters}). Open the trial.`;
  return `${when.join(', ')}: ${outcome}`;
}

/**
 * A case's history: one mark per run, oldest first, each opening the run's trial.
 *
 * @param props - The case and its cells.
 * @returns The strip.
 */
export function HistoryStrip(props: {
  readonly caseId: string;
  readonly cells: readonly HistoryCell[];
}) {
  return (
    <ol class="strip" aria-label="History, oldest first">
      {props.cells.map((cell) => (
        <li key={cell.run.id}>
          <a
            class="strip-link"
            href={
              cell.letters === undefined
                ? links.run(cell.run.id)
                : links.trial(cell.run.id, props.caseId, trialToOpen(cell.letters))
            }
            aria-label={cellLabel(cell)}
            title={cellLabel(cell)}
          >
            <Mark kind={markOfLetters(cell.letters)} />
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * A case's trials in a run: one mark each, opening the trial.
 *
 * @param props - The run, the case and its trials' letters.
 * @returns The marks.
 */
export function TrialMarks(props: {
  readonly runId: string;
  readonly caseId: string;
  readonly letters: string;
}) {
  // A trial's place never changes, so it serves as its key.
  const trials = [...props.letters].map((letter, trial) => ({ letter, trial }));
  return (
    <ul class="trial-marks" aria-label="Trials">
      {trials.map(({ letter, trial }) => (
        <li key={`t${trial}`}>
          <a
            class="trial-mark"
            href={links.trial(props.runId, props.caseId, trial)}
            aria-label={`Trial ${trial + 1}: ${markWords[markOfLetter(letter)]}. Open it.`}
            title={`Trial ${trial + 1}: ${markWords[markOfLetter(letter)]}`}
          >
            <Mark kind={markOfLetter(letter)} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * A run's case counts, each with its mark: passed, flaky and failed.
 *
 * @param props - The run's totals.
 * @returns The counts.
 */
export function CaseCounts(props: { readonly totals: Totals }) {
  const { casesPassed, casesFlaky, casesFailed } = props.totals;
  return (
    <span class="counts">
      <span class="nowrap">
        <Mark kind="pass" /> {casesPassed} passed
      </span>
      <span class="nowrap">
        <Mark kind="flaky" /> {casesFlaky} flaky
      </span>
      <span class="nowrap">
        <Mark kind="fail" /> {casesFailed} failed
      </span>
    </span>
  );
}
