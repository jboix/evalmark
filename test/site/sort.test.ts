import { describe, expect, test } from 'vitest';
import { nextSort, sortRows, sortStateOf, sortTable } from '../../src/site/lib/sort.ts';

describe('sortStateOf', () => {
  const fallback = { key: 'case', direction: 'asc' } as const;

  test('reads a known column and its direction from the query', () => {
    expect(sortStateOf({ sort: 'cost', dir: 'desc' }, ['case', 'cost'], fallback)).toEqual({
      key: 'cost',
      direction: 'desc',
    });
    expect(sortStateOf({ sort: 'cost' }, ['case', 'cost'], fallback).direction).toBe('asc');
  });

  test('falls back for a missing or unknown column', () => {
    expect(sortStateOf({}, ['case'], fallback)).toBe(fallback);
    expect(sortStateOf({ sort: 'nope', dir: 'desc' }, ['case'], fallback)).toBe(fallback);
  });
});

describe('nextSort', () => {
  test('flips the sorted column and starts another ascending', () => {
    const current = { key: 'cost', direction: 'asc' } as const;
    expect(nextSort(current, 'cost')).toEqual({ key: 'cost', direction: 'desc' });
    expect(nextSort({ key: 'cost', direction: 'desc' }, 'cost').direction).toBe('asc');
    expect(nextSort(current, 'case')).toEqual({ key: 'case', direction: 'asc' });
  });
});

describe('sortRows', () => {
  const rows = [
    { id: 'a', value: 2 as number | null },
    { id: 'b', value: null },
    { id: 'c', value: 1 },
    { id: 'd', value: 2 },
  ];

  test('is stable and puts empty values last in either direction', () => {
    const ids = (direction: 'asc' | 'desc') =>
      sortRows(rows, (row) => row.value, direction).map((row) => row.id);
    expect(ids('asc')).toEqual(['c', 'a', 'd', 'b']);
    expect(ids('desc')).toEqual(['a', 'd', 'c', 'b']);
  });

  test('compares text naturally, ignoring case', () => {
    const names = ['case 10', 'Case 9', 'apple', ''].map((name) => ({ name }));
    expect(sortRows(names, (row) => row.name, 'asc').map((row) => row.name)).toEqual([
      'apple',
      'Case 9',
      'case 10',
      '',
    ]);
  });

  test('leaves the rows in their order for an unknown column', () => {
    const sorted = sortTable(rows, { value: (row) => row.value }, { key: 'x', direction: 'desc' });
    expect(sorted.map((row) => row.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
