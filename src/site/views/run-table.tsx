/**
 * A run's cases table: status, trials, the checks that failed with the first message, cost and
 * time, with a status filter, a search, and every column sortable.
 */
import type { Run } from '../../format/store.ts';
import { SearchFilter, SelectFilter } from '../components/filters.tsx';
import { NoMatch } from '../components/states.tsx';
import { StatusWord, TrialMarks } from '../components/status.tsx';
import { CountLine, SortHeader, TableBox } from '../components/table.tsx';
import { type CaseFilters, caseFiltersOf, matchesCase } from '../lib/case-rows.ts';
import { formatCost, formatDuration } from '../lib/format.ts';
import { type Query, withQuery } from '../lib/route.ts';
import { type RunCaseRow, runCaseColumns, runCaseRows } from '../lib/run.ts';
import { runSelectionQuery } from '../lib/selection.ts';
import { type SortState, sortStateOf, sortTable } from '../lib/sort.ts';
import { CaseName, clearedFilters } from './results-table.tsx';

/** The table's sort when the query names none. */
const defaultSort: SortState = { key: 'case', direction: 'asc' };

/** The status filter's options. */
const statusOptions = [
  { value: 'all', text: 'All' },
  { value: 'failing', text: 'Failing' },
  { value: 'flaky', text: 'Flaky' },
  { value: 'passing', text: 'Passing' },
];

/**
 * The run's cases.
 *
 * @param props - The run, the query and the current hash.
 * @returns The filters, the count line and the table.
 */
export function RunTable(props: {
  readonly run: Run;
  readonly query: Query;
  readonly hash: string;
}) {
  const { run, query, hash } = props;
  const filters = caseFiltersOf(query);
  const rows = runCaseRows(run);
  const shown = rows.filter((row) => matchesCase(row, [row.mark], filters));
  const sort = sortStateOf(query, Object.keys(runCaseColumns), defaultSort);
  return (
    <section class="section" aria-label="Cases">
      <RunFilters filters={filters} hash={hash} />
      <CountLine total={rows.length} shown={shown.length} noun="case" />
      {shown.length === 0 ? (
        <NoMatch what="cases" clear={withQuery(hash, clearedFilters)} />
      ) : (
        <TableBox legend={true}>
          <table class="table">
            <RunHead sort={sort} hash={hash} />
            <tbody>
              {sortTable(shown, runCaseColumns, sort).map((row) => (
                <RunCaseLine key={row.id} row={row} run={run} />
              ))}
            </tbody>
          </table>
        </TableBox>
      )}
    </section>
  );
}

/**
 * The status filter and the search.
 *
 * @param props - The filters and the current hash.
 * @returns The controls.
 */
function RunFilters(props: { readonly filters: CaseFilters; readonly hash: string }) {
  return (
    <div class="filters">
      <SelectFilter
        label="Status"
        name="status"
        value={props.filters.status}
        options={statusOptions}
        hash={props.hash}
      />
      <SearchFilter
        label="Search"
        name="q"
        value={props.filters.search}
        placeholder="Title, id or tag"
        hash={props.hash}
      />
    </div>
  );
}

/**
 * The table's header row.
 *
 * @param props - The sort and the current hash.
 * @returns The header.
 */
function RunHead(props: { readonly sort: SortState; readonly hash: string }) {
  const { sort, hash } = props;
  return (
    <thead>
      <tr>
        <SortHeader column="case" sort={sort} hash={hash}>
          Case
        </SortHeader>
        <SortHeader column="status" sort={sort} hash={hash}>
          Status
        </SortHeader>
        <th scope="col">Trials</th>
        <SortHeader column="checks" sort={sort} hash={hash}>
          Failing checks
        </SortHeader>
        <SortHeader column="cost" sort={sort} hash={hash} numeric={true}>
          Cost
        </SortHeader>
        <SortHeader column="duration" sort={sort} hash={hash} numeric={true}>
          Time
        </SortHeader>
      </tr>
    </thead>
  );
}

/**
 * One case's row.
 *
 * @param props - The row and its run.
 * @returns The row.
 */
function RunCaseLine(props: { readonly row: RunCaseRow; readonly run: Run }) {
  const { row, run } = props;
  const first = row.failing[0];
  return (
    <tr>
      <CaseName id={row.id} title={row.title} query={runSelectionQuery(run)} />
      <td>
        <StatusWord kind={row.mark} />
      </td>
      <td>
        <TrialMarks runId={run.id} caseId={row.id} letters={row.letters} />
      </td>
      <td class="wrap">
        {row.failing.map((check) => check.id).join(', ')}
        {first?.message === undefined ? null : <span class="sub">{first.message}</span>}
      </td>
      <td class="num">{formatCost(row.costUsd)}</td>
      <td class="num">{formatDuration(row.durationMs)}</td>
    </tr>
  );
}
