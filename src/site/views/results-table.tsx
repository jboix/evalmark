/**
 * The results table: one row per case over the window, every column sortable.
 */

import { NoMatch } from '../components/states.tsx';
import { HistoryStrip, StatusWord } from '../components/status.tsx';
import { CountLine, SortHeader, TableBox } from '../components/table.tsx';
import { Figure } from '../components/values.tsx';
import type { Resource } from '../hooks/use-resource.ts';
import {
  type CaseRow,
  caseColumns,
  caseRows,
  matchesCase,
  type UsageByRun,
} from '../lib/case-rows.ts';
import { formatCost, formatDuration, formatPercent } from '../lib/format.ts';
import { links, withQuery } from '../lib/route.ts';
import { selectionQuery } from '../lib/selection.ts';
import { type SortState, sortStateOf, sortTable } from '../lib/sort.ts';
import type { ResultsScope } from './results-scope.ts';

/** The table's sort when the query names none. */
const defaultSort: SortState = { key: 'case', direction: 'asc' };

/** The query values the case filters use, cleared together. */
export const clearedFilters = { status: undefined, tag: undefined, q: undefined };

/**
 * The results table.
 *
 * @param props - The page's scope, what each case spent, and the state of that load.
 * @returns The table with its count line.
 */
export function CaseTable(props: {
  readonly scope: ResultsScope;
  readonly usage: UsageByRun | undefined;
  readonly usageState: Resource<unknown>['state'];
}) {
  const { scope } = props;
  const rows = caseRows(scope.runs, scope.index.cases, props.usage);
  const shown = rows.filter((row) => matchesCase(row, [row.latest], scope.filters));
  const sort = sortStateOf(scope.query, Object.keys(caseColumns), defaultSort);
  return (
    <section class="section" aria-label="Cases">
      <CountLine total={rows.length} shown={shown.length} noun="case" />
      {shown.length === 0 ? (
        <NoMatch what="cases" clear={withQuery(scope.hash, clearedFilters)} />
      ) : (
        <TableBox legend={true}>
          <table class="table">
            <CaseHead sort={sort} hash={scope.hash} />
            <tbody>
              {sortTable(shown, caseColumns, sort).map((row) => (
                <CaseLine key={row.id} row={row} scope={scope} pending={props.usageState} />
              ))}
            </tbody>
          </table>
        </TableBox>
      )}
    </section>
  );
}

/**
 * The table's header row.
 *
 * @param props - The sort and the current hash.
 * @returns The header.
 */
function CaseHead(props: { readonly sort: SortState; readonly hash: string }) {
  const { sort, hash } = props;
  return (
    <thead>
      <tr>
        <SortHeader column="case" sort={sort} hash={hash}>
          Case
        </SortHeader>
        <SortHeader column="latest" sort={sort} hash={hash}>
          Latest
        </SortHeader>
        <SortHeader column="history" sort={sort} hash={hash}>
          History
        </SortHeader>
        <SortHeader column="passRate" sort={sort} hash={hash} numeric={true}>
          Pass rate
        </SortHeader>
        <SortHeader column="cost" sort={sort} hash={hash} numeric={true}>
          Avg cost
        </SortHeader>
        <SortHeader column="duration" sort={sort} hash={hash} numeric={true}>
          Avg duration
        </SortHeader>
      </tr>
    </thead>
  );
}

/**
 * A case's name cell: its title linking to its page, its id under it.
 *
 * @param props - The case's id and title, and the query its link keeps.
 * @returns The cell.
 */
export function CaseName(props: {
  readonly id: string;
  readonly title: string;
  readonly query: Readonly<Record<string, string>>;
}) {
  return (
    <th scope="row" class="case-cell">
      <a href={links.case(props.id, props.query)}>{props.title}</a>
      {props.title === props.id ? null : <span class="sub mono">{props.id}</span>}
    </th>
  );
}

/**
 * A figure the run files give, with a placeholder while they load.
 *
 * @param props - The value, how to write it, and the state of the load.
 * @returns The cell's content.
 */
function Loadable(props: {
  readonly value: number | null;
  readonly format: (value: number) => string;
  readonly pending: Resource<unknown>['state'];
}) {
  if (props.pending === 'loading') return <span class="muted">…</span>;
  return <Figure value={props.value} format={props.format} />;
}

/**
 * One case's row.
 *
 * @param props - The row, the page's scope and the state of the usage's load.
 * @returns The row.
 */
function CaseLine(props: {
  readonly row: CaseRow;
  readonly scope: ResultsScope;
  readonly pending: Resource<unknown>['state'];
}) {
  const { row, pending } = props;
  return (
    <tr>
      <CaseName id={row.id} title={row.title} query={selectionQuery(props.scope.selection)} />
      <td>
        <StatusWord kind={row.latest} />
      </td>
      <td>
        <HistoryStrip caseId={row.id} cells={row.cells} />
      </td>
      <td class="num">{formatPercent(row.passRate)}</td>
      <td class="num">
        <Loadable value={row.costUsd} format={formatCost} pending={pending} />
      </td>
      <td class="num">
        <Loadable value={row.durationMs} format={formatDuration} pending={pending} />
      </td>
    </tr>
  );
}
