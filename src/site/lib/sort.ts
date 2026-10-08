/**
 * Sorting tables by any column: the column and direction live in the route's query as `sort` and
 * `dir`, so a sorted table is a permanent link. Sorting is stable, and empty values go last in
 * either direction.
 */
import type { Query } from './route.ts';

/** A sort direction. */
export type Direction = 'asc' | 'desc';

/** A table's sort: which column, which way. */
export interface SortState {
  /** The column's key. */
  readonly key: string;
  /** The direction. */
  readonly direction: Direction;
}

/** What a column sorts by: a string, a number, or nothing. */
export type SortValue = string | number | null | undefined;

/** A table's columns: how to read each one's sort value from a row, by key. */
export type Columns<T> = Readonly<Record<string, (row: T) => SortValue>>;

/**
 * Reads a table's sort from a query.
 *
 * @param query - The query: `sort` names a column, `dir` is `asc` or `desc`.
 * @param keys - The table's column keys.
 * @param fallback - The sort when the query names no known column.
 * @returns The sort.
 */
export function sortStateOf(query: Query, keys: readonly string[], fallback: SortState): SortState {
  const key = query.sort;
  if (key === undefined || !keys.includes(key)) return fallback;
  return { key, direction: query.dir === 'desc' ? 'desc' : 'asc' };
}

/**
 * The sort a click on a column's header asks for: the other direction on the sorted column, else
 * ascending.
 *
 * @param current - The current sort.
 * @param key - The clicked column.
 * @returns The new sort.
 */
export function nextSort(current: SortState, key: string): SortState {
  if (current.key !== key) return { key, direction: 'asc' };
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

/**
 * Whether a sort value is empty.
 *
 * @param value - The value.
 * @returns `true` for `null`, `undefined`, `NaN` and the empty string.
 */
function isEmpty(value: SortValue): value is null | undefined {
  return value === null || value === undefined || value === '' || Number.isNaN(value);
}

/**
 * Compares two values that are both there.
 *
 * @param first - One value.
 * @param second - The other.
 * @returns Negative, zero or positive, numbers before strings.
 */
function compareValues(first: string | number, second: string | number): number {
  if (typeof first === 'number' && typeof second === 'number') return first - second;
  if (typeof first === 'number') return -1;
  if (typeof second === 'number') return 1;
  return first.localeCompare(second, 'en', { numeric: true, sensitivity: 'base' });
}

/**
 * Sorts rows by a value, stably, empty values last in either direction.
 *
 * @param rows - The rows, in their default order.
 * @param value - Reads a row's value.
 * @param direction - The direction.
 * @returns A sorted copy.
 */
export function sortRows<T>(
  rows: readonly T[],
  value: (row: T) => SortValue,
  direction: Direction,
): T[] {
  const sign = direction === 'asc' ? 1 : -1;
  return rows
    .map((row, position) => ({ row, position, value: value(row) }))
    .sort((first, second) => {
      const [left, right] = [first.value, second.value];
      if (isEmpty(left) || isEmpty(right)) {
        return Number(isEmpty(left)) - Number(isEmpty(right)) || first.position - second.position;
      }
      return sign * compareValues(left, right) || first.position - second.position;
    })
    .map((entry) => entry.row);
}

/**
 * Sorts rows by a table's sort.
 *
 * @param rows - The rows, in their default order.
 * @param columns - The table's columns.
 * @param state - The sort.
 * @returns A sorted copy; the rows as they are when the sort names no column.
 */
export function sortTable<T>(rows: readonly T[], columns: Columns<T>, state: SortState): T[] {
  const value = columns[state.key];
  return value === undefined ? [...rows] : sortRows(rows, value, state.direction);
}
