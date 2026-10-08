/**
 * Two runs compared: the branch and labels to pick them from, their totals in one line with the
 * changes, and every case with its status in each and how it changed. The labels default to the
 * branch's lead run's, so a model is compared with itself unless the reader asks otherwise.
 */
import type { RunSummary } from '../../format/store.ts';
import { SelectFilter } from '../components/filters.tsx';
import { SelectionFilters } from '../components/selection-filters.tsx';
import { Empty } from '../components/states.tsx';
import { Delta } from '../components/values.tsx';
import { changeCounts, changeRows } from '../lib/compare-cases.ts';
import { candidatesOf, pairOf } from '../lib/compare-pair.ts';
import {
  formatCost,
  formatDateTime,
  formatDelta,
  formatDuration,
  formatPercent,
  formatPointsDelta,
  shortSha,
} from '../lib/format.ts';
import { labelsText } from '../lib/runs.ts';
import { type Selection, selectionOf } from '../lib/selection.ts';
import { ChangeTable } from './compare-table.tsx';
import type { ViewProps } from './view-props.ts';

/**
 * A run as an option of the pickers: its time and commit, plus its branch and labels only when the
 * filters leave them open.
 *
 * @param run - The run.
 * @param selection - The filters the runs were picked with.
 * @returns Such as `Oct 8, 2026, 10:00 · af84a18`.
 */
function runText(run: RunSummary, selection: Selection): string {
  const branch = selection.branch === undefined ? run.source.branch : undefined;
  const labels = selection.open.length > 0 ? labelsText(run.labels) : '';
  const commit = run.source.commit === undefined ? undefined : shortSha(run.source.commit);
  return [formatDateTime(run.startedAt), commit, branch, labels]
    .filter((part) => part !== undefined && part !== '')
    .join(' · ');
}

/**
 * The two runs mode.
 *
 * @param props - The index, the route and the hash.
 * @returns The pickers, the totals and the table.
 */
export function CompareRuns(props: ViewProps<'compare'>) {
  const { index, route, hash } = props;
  const selection = selectionOf(route.query, index.runs);
  const candidates = candidatesOf(index, selection);
  const { base, head } = pairOf(candidates, route.query);
  return (
    <>
      <div class="filters">
        <SelectionFilters index={index} selection={selection} hash={hash} />
        <RunPickers runs={candidates} selection={selection} base={base} head={head} hash={hash} />
      </div>
      {base === undefined || head === undefined ? (
        <Empty title="Pick the two runs to compare." />
      ) : (
        <>
          <TotalsLine base={base} head={head} />
          <ChangeTable
            rows={changeRows(base, head, index.cases)}
            base={base}
            head={head}
            query={route.query}
            hash={hash}
          />
        </>
      )}
    </>
  );
}

/**
 * The two runs' pickers.
 *
 * @param props - The runs to pick from, the filters, the two picked, and the current hash.
 * @returns The pickers.
 */
function RunPickers(props: {
  readonly runs: readonly RunSummary[];
  readonly selection: Selection;
  readonly base: RunSummary | undefined;
  readonly head: RunSummary | undefined;
  readonly hash: string;
}) {
  const options = props.runs.map((run) => ({
    value: run.id,
    text: runText(run, props.selection),
  }));
  const { hash } = props;
  return (
    <>
      <SelectFilter
        label="Base"
        name="base"
        value={props.base?.id ?? ''}
        options={options}
        hash={hash}
      />
      <SelectFilter
        label="Head"
        name="head"
        value={props.head?.id ?? ''}
        options={options}
        hash={hash}
      />
    </>
  );
}

/**
 * The totals of both runs in one line, with the changes.
 *
 * @param props - The two runs.
 * @returns The line.
 */
function TotalsLine(props: { readonly base: RunSummary; readonly head: RunSummary }) {
  const [before, after] = [props.base.totals, props.head.totals];
  const counts = changeCounts(changeRows(props.base, props.head, {}));
  const passRate =
    before.passRate === null || after.passRate === null ? null : after.passRate - before.passRate;
  return (
    <p class="facts">
      <span>
        <span class="num">
          {formatPercent(before.passRate)} → {formatPercent(after.passRate)}
        </span>{' '}
        of trials passed <Delta value={passRate} format={formatPointsDelta} better="higher" />
      </span>
      <span class="num">
        {formatCost(after.costUsd)}{' '}
        <Delta
          value={after.costUsd - before.costUsd}
          format={(value) => formatDelta(value, formatCost)}
          better="lower"
        />
      </span>
      <span class="num">
        {formatDuration(after.durationMs)}{' '}
        <Delta
          value={after.durationMs - before.durationMs}
          format={(value) => formatDelta(value, formatDuration)}
          better="lower"
        />
      </span>
      <span>
        {counts.regressed} regressed, {counts.fixed} fixed, {counts.added} added, {counts.removed}{' '}
        removed
      </span>
    </p>
  );
}
