/**
 * The cases of two runs: each case's status in the base and in the head, and how it changed.
 */
import type { RunSummary } from '../../format/store.ts';
import { ToggleFilter } from '../components/filters.tsx';
import { NoMatch } from '../components/states.tsx';
import { Mark } from '../components/status.tsx';
import { CountLine, SortHeader, TableBox } from '../components/table.tsx';
import { type Change, type ChangeRow, changeColumns } from '../lib/compare-cases.ts';
import { missing } from '../lib/format.ts';
import { trialToOpen } from '../lib/history.ts';
import { type MarkKind, markWords } from '../lib/marks.ts';
import { links, type Query, withQuery } from '../lib/route.ts';
import { runSelectionQuery } from '../lib/selection.ts';
import { type SortState, sortStateOf, sortTable } from '../lib/sort.ts';
import { CaseName } from './results-table.tsx';

/** The table's sort when the query names none: worst changes first. */
const defaultSort: SortState = { key: 'change', direction: 'asc' };

/**
 * The cases table.
 *
 * @param props - The rows, the two runs, the query and the current hash.
 * @returns The toggle, the count line and the table.
 */
export function ChangeTable(props: {
  readonly rows: readonly ChangeRow[];
  readonly base: RunSummary;
  readonly head: RunSummary;
  readonly query: Query;
  readonly hash: string;
}) {
  const { rows, query, hash } = props;
  const changedOnly = query.changed === '1';
  const shown = changedOnly ? rows.filter((row) => row.change !== 'same') : rows;
  const sort = sortStateOf(query, Object.keys(changeColumns), defaultSort);
  return (
    <section class="section" aria-label="Cases">
      <div class="filters">
        <ToggleFilter label="Changed only" name="changed" checked={changedOnly} hash={hash} />
      </div>
      <CountLine total={rows.length} shown={shown.length} noun="case" />
      {shown.length === 0 ? (
        <NoMatch what="cases" clear={withQuery(hash, { changed: undefined })} />
      ) : (
        <TableBox legend={true}>
          <table class="table">
            <ChangeHead sort={sort} hash={hash} />
            <tbody>
              {sortTable(shown, changeColumns, sort).map((row) => (
                <ChangeLine key={row.id} row={row} base={props.base} head={props.head} />
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
function ChangeHead(props: { readonly sort: SortState; readonly hash: string }) {
  const { sort, hash } = props;
  return (
    <thead>
      <tr>
        <SortHeader column="case" sort={sort} hash={hash}>
          Case
        </SortHeader>
        <SortHeader column="base" sort={sort} hash={hash}>
          Base
        </SortHeader>
        <SortHeader column="head" sort={sort} hash={hash}>
          Head
        </SortHeader>
        <SortHeader column="change" sort={sort} hash={hash}>
          Change
        </SortHeader>
      </tr>
    </thead>
  );
}

/** Each change's word. */
const changeWords: Readonly<Record<Change, string>> = {
  regressed: 'Regressed',
  fixed: 'Fixed',
  same: 'Same',
  added: 'Added',
  removed: 'Removed',
};

/**
 * One case's row.
 *
 * @param props - The row and the two runs.
 * @returns The row.
 */
function ChangeLine(props: {
  readonly row: ChangeRow;
  readonly base: RunSummary;
  readonly head: RunSummary;
}) {
  const { row } = props;
  return (
    <tr>
      <CaseName id={row.id} title={row.title} query={runSelectionQuery(props.head)} />
      <td>
        <RunMark run={props.base} caseId={row.id} kind={row.base} letters={row.baseLetters} />
      </td>
      <td>
        <RunMark run={props.head} caseId={row.id} kind={row.head} letters={row.headLetters} />
      </td>
      <td class={`change change-${row.change}`}>{changeWords[row.change]}</td>
    </tr>
  );
}

/**
 * A case's mark in one run, opening its trial, with its word.
 *
 * @param props - The run, the case, its mark and its letters.
 * @returns The mark, or a dash when the run did not have the case.
 */
function RunMark(props: {
  readonly run: RunSummary;
  readonly caseId: string;
  readonly kind: MarkKind | undefined;
  readonly letters: string | undefined;
}) {
  if (props.kind === undefined) return <span class="muted">{missing}</span>;
  return (
    <a
      class="status-word"
      href={links.trial(props.run.id, props.caseId, trialToOpen(props.letters))}
    >
      <Mark kind={props.kind} />
      {markWords[props.kind]}
    </a>
  );
}
