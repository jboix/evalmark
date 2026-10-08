/**
 * Table parts: a header cell that sorts its column, and the box a wide table scrolls in.
 */
import type { ComponentChildren } from 'preact';
import { replaceRoute } from '../hooks/use-route.ts';
import { withQuery } from '../lib/route.ts';
import { nextSort, type SortState } from '../lib/sort.ts';
import { MarkLegend } from './status.tsx';

/**
 * A column's header that sorts the table by it: a click sorts ascending, a second click descending.
 *
 * @param props - What it says, its column's key, the table's sort, the current hash, and whether
 *   the column holds numbers, which sit on the right.
 * @returns The header cell.
 */
export function SortHeader(props: {
  readonly children: ComponentChildren;
  readonly column: string;
  readonly sort: SortState;
  readonly hash: string;
  readonly numeric?: boolean;
}) {
  const active = props.sort.key === props.column;
  const ascending = props.sort.direction === 'asc';
  const next = nextSort(props.sort, props.column);
  const sorted = ascending ? 'ascending' : 'descending';
  return (
    <th
      scope="col"
      class={props.numeric === true ? 'num' : undefined}
      aria-sort={active ? sorted : undefined}
    >
      <button
        type="button"
        class="sort"
        onClick={() => replaceRoute(withQuery(props.hash, { sort: next.key, dir: next.direction }))}
      >
        {props.children}
        <span class={active ? 'sort-arrow' : 'sort-arrow sort-idle'} aria-hidden="true">
          {active && !ascending ? '↓' : '↑'}
        </span>
      </button>
    </th>
  );
}

/**
 * The box a table scrolls in when it is wider than the page, so the page itself never scrolls
 * sideways. Browsers let the keyboard focus a box that scrolls.
 *
 * @param props - The table, and whether the legend of the status marks follows it.
 * @returns The box.
 */
export function TableBox(props: {
  readonly children: ComponentChildren;
  readonly legend?: boolean;
}) {
  return (
    <>
      <div class="table-box">{props.children}</div>
      {props.legend === true ? <MarkLegend /> : null}
    </>
  );
}

/**
 * A count line above a table.
 *
 * @param props - The number of rows in all and shown, and the noun.
 * @returns Such as `12 cases, 3 shown`.
 */
export function CountLine(props: {
  readonly total: number;
  readonly shown: number;
  readonly noun: string;
}) {
  const noun = props.total === 1 ? props.noun : `${props.noun}s`;
  return (
    <p class="count-line" aria-live="polite">
      {props.total} {noun}
      {props.shown === props.total ? '' : `, ${props.shown} shown`}
    </p>
  );
}
