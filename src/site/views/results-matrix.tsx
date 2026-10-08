/**
 * Cases by label values: one column per value with the case's latest mark and its pass rate over
 * the value's runs, so a value that does worse stands out next to the others.
 */
import type { CaseInfo, RunSummary } from '../../format/store.ts';
import { NoMatch } from '../components/states.tsx';
import { Mark } from '../components/status.tsx';
import { CountLine, SortHeader, TableBox } from '../components/table.tsx';
import { type CaseFilters, matchesCase } from '../lib/case-rows.ts';
import { formatDateTime, formatPercent } from '../lib/format.ts';
import { trialToOpen } from '../lib/history.ts';
import { markWords } from '../lib/marks.ts';
import { type MatrixCell, type MatrixRow, matrixColumns, matrixOf } from '../lib/matrix.ts';
import { links, withQuery } from '../lib/route.ts';
import { type SortState, sortStateOf, sortTable } from '../lib/sort.ts';
import { CaseName, clearedFilters } from './results-table.tsx';

/** The table's sort when the query names none. */
const defaultSort: SortState = { key: 'case', direction: 'asc' };

/** What the matrix needs from its page. */
export interface MatrixScope {
  /** The runs, newest first. */
  readonly runs: readonly RunSummary[];
  /** What the index knows of each case. */
  readonly cases: Readonly<Record<string, CaseInfo>>;
  /** The case filters. */
  readonly filters: CaseFilters;
  /** The route's query. */
  readonly query: Readonly<Record<string, string>>;
  /** The location's hash. */
  readonly hash: string;
  /** The query a case's link keeps. */
  readonly caseQuery: Readonly<Record<string, string>>;
}

/**
 * The matrix of cases by the values of a label.
 *
 * @param props - What it needs, and the label key.
 * @returns The table with its count line.
 */
export function MatrixTable(props: { readonly scope: MatrixScope; readonly labelKey: string }) {
  const { scope } = props;
  const matrix = matrixOf(scope.runs, props.labelKey, scope.cases);
  const shown = matrix.rows.filter((row) =>
    matchesCase(
      row,
      row.cells.map((cell) => cell.latest),
      scope.filters,
    ),
  );
  const columns = matrixColumns(matrix.values);
  const sort = sortStateOf(scope.query, Object.keys(columns), defaultSort);
  return (
    <section class="section" aria-label={`Cases by ${props.labelKey}`}>
      <CountLine total={matrix.rows.length} shown={shown.length} noun="case" />
      <p class="count-line">
        Each cell: the case's status in the newest run of that {props.labelKey}, and its pass rate
        over the window.
      </p>
      {shown.length === 0 ? (
        <NoMatch what="cases" clear={withQuery(scope.hash, clearedFilters)} />
      ) : (
        <TableBox legend={true}>
          <table class="table matrix">
            <MatrixHead values={matrix.values} sort={sort} hash={scope.hash} />
            <tbody>
              {sortTable(shown, columns, sort).map((row) => (
                <MatrixLine key={row.id} row={row} caseQuery={scope.caseQuery} />
              ))}
            </tbody>
          </table>
        </TableBox>
      )}
    </section>
  );
}

/**
 * The matrix's header row: the case, then one column per value.
 *
 * @param props - The values, the sort and the current hash.
 * @returns The header.
 */
function MatrixHead(props: {
  readonly values: readonly string[];
  readonly sort: SortState;
  readonly hash: string;
}) {
  return (
    <thead>
      <tr>
        <SortHeader column="case" sort={props.sort} hash={props.hash}>
          Case
        </SortHeader>
        {props.values.map((value) => (
          <SortHeader key={value} column={`v:${value}`} sort={props.sort} hash={props.hash}>
            {value}
          </SortHeader>
        ))}
      </tr>
    </thead>
  );
}

/**
 * One case's row.
 *
 * @param props - The row and the query its case link keeps.
 * @returns The row.
 */
function MatrixLine(props: {
  readonly row: MatrixRow;
  readonly caseQuery: Readonly<Record<string, string>>;
}) {
  const { row } = props;
  return (
    <tr>
      <CaseName id={row.id} title={row.title} query={props.caseQuery} />
      {row.cells.map((cell) => (
        <td key={cell.value}>
          <MatrixValue caseId={row.id} cell={cell} />
        </td>
      ))}
    </tr>
  );
}

/**
 * One case under one value: its latest mark, opening that trial, and its pass rate.
 *
 * @param props - The case and the cell.
 * @returns The cell's content.
 */
function MatrixValue(props: { readonly caseId: string; readonly cell: MatrixCell }) {
  const { cell } = props;
  const run = cell.run;
  const label = `${cell.value}, latest run${run === undefined ? '' : ` ${formatDateTime(run.startedAt)}`}: ${markWords[cell.latest]}`;
  return (
    <span class="matrix-value">
      {run === undefined || cell.letters === undefined ? (
        <Mark kind={cell.latest} label={label} />
      ) : (
        <a
          class="mark-link"
          href={links.trial(run.id, props.caseId, trialToOpen(cell.letters))}
          aria-label={`${label}. Open the trial.`}
          title={label}
        >
          <Mark kind={cell.latest} />
        </a>
      )}
      <span class="num">{formatPercent(cell.passRate)}</span>
    </span>
  );
}
