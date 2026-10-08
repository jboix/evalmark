/**
 * The runs table: one row per run, every column sortable, a box to tick each run for comparing.
 */
import type { RunSummary } from '../../format/store.ts';
import { SortHeader, TableBox } from '../components/table.tsx';
import { Commit, Labels, When } from '../components/values.tsx';
import {
  formatCost,
  formatDateTime,
  formatDuration,
  formatPercent,
  missing,
} from '../lib/format.ts';
import { links, type Query } from '../lib/route.ts';
import { runColumns } from '../lib/runs.ts';
import { type SortState, sortStateOf, sortTable } from '../lib/sort.ts';

/** The table's sort when the query names none: newest first. */
const defaultSort: SortState = { key: 'date', direction: 'desc' };

/** The runs ticked for comparing, and the way to tick one. */
interface Picked {
  /** The ticked runs' ids. */
  readonly ids: readonly string[];
  /** Ticks or unticks a run. */
  readonly toggle: (runId: string) => void;
}

/** The sortable columns after the date: key, header, and whether they hold numbers. */
const columns: readonly (readonly [string, string, boolean])[] = [
  ['branch', 'Branch', false],
  ['commit', 'Commit', false],
  ['labels', 'Labels', false],
  ['passed', 'Passed', true],
  ['flaky', 'Flaky', true],
  ['failed', 'Failed', true],
  ['passRate', 'Pass rate', true],
  ['cost', 'Cost', true],
  ['duration', 'Duration', true],
];

/**
 * The runs table.
 *
 * @param props - The runs, the query, the current hash and the ticked runs.
 * @returns The table.
 */
export function RunsTable(props: {
  readonly runs: readonly RunSummary[];
  readonly query: Query;
  readonly hash: string;
  readonly picked: Picked;
}) {
  const sort = sortStateOf(props.query, Object.keys(runColumns), defaultSort);
  return (
    <TableBox>
      <table class="table">
        <thead>
          <tr>
            <th scope="col" class="tick-cell">
              <span class="visually-hidden">Compare</span>
            </th>
            <SortHeader column="date" sort={sort} hash={props.hash}>
              Date
            </SortHeader>
            {columns.map(([key, text, numeric]) => (
              <SortHeader key={key} column={key} sort={sort} hash={props.hash} numeric={numeric}>
                {text}
              </SortHeader>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortTable(props.runs, runColumns, sort).map((run) => (
            <RunLine key={run.id} run={run} picked={props.picked} />
          ))}
        </tbody>
      </table>
    </TableBox>
  );
}

/**
 * One run's row.
 *
 * @param props - The run and the ticked runs.
 * @returns The row.
 */
function RunLine(props: { readonly run: RunSummary; readonly picked: Picked }) {
  const { run, picked } = props;
  const { totals } = run;
  return (
    <tr>
      <td class="tick-cell">
        <input
          type="checkbox"
          checked={picked.ids.includes(run.id)}
          onChange={() => picked.toggle(run.id)}
          aria-label={`Compare the run of ${formatDateTime(run.startedAt)}`}
        />
      </td>
      <th scope="row">
        <a href={links.run(run.id)}>
          <When iso={run.startedAt} />
        </a>
      </th>
      <td>{run.source.branch ?? missing}</td>
      <td>
        <Commit source={run.source} />
      </td>
      <td>
        <Labels labels={run.labels} />
      </td>
      <td class="num">{totals.casesPassed}</td>
      <td class="num">{totals.casesFlaky}</td>
      <td class="num">{totals.casesFailed}</td>
      <td class="num">{formatPercent(totals.passRate)}</td>
      <td class="num">{formatCost(totals.costUsd)}</td>
      <td class="num">{formatDuration(totals.durationMs)}</td>
    </tr>
  );
}
