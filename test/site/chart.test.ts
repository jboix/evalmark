import { describe, expect, test } from 'vitest';
import {
  keyStop,
  lineLayout,
  ratioFloor,
  readoutAt,
  slotOf,
  spreadLabels,
  stopsOf,
} from '../../src/site/lib/chart.ts';
import { linearScale, niceTicks, timeTicks } from '../../src/site/lib/scale.ts';
import { seriesOf } from '../../src/site/lib/series.ts';
import { summary } from './summaries.ts';

describe('scales', () => {
  test('map a domain onto a range', () => {
    const scale = linearScale([0, 10], [100, 0]);
    expect(scale(0)).toBe(100);
    expect(scale(5)).toBe(50);
    expect(linearScale([3, 3], [0, 10])(3)).toBe(5);
  });

  test('put ticks at round values that cover the data', () => {
    expect(niceTicks(0, 1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(0, 1.34, 4)).toEqual([0, 0.5, 1, 1.5]);
    expect(niceTicks(0, 640_700, 4)).toEqual([0, 200_000, 400_000, 600_000, 800_000]);
    expect(niceTicks(0, 0)).toEqual([0, 1]);
    expect(niceTicks(Number.NaN, 1)).toEqual([]);
  });

  test('put time ticks at midnight, inside the range', () => {
    const start = Date.parse('2026-09-01T10:00:00Z');
    const end = Date.parse('2026-09-05T10:00:00Z');
    const ticks = timeTicks(start, end);
    expect(ticks.every((tick) => tick >= start && tick <= end && tick % 86_400_000 === 0)).toBe(
      true,
    );
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(timeTicks(start, start)).toEqual([start]);
  });
});

describe('the line chart', () => {
  const runs = [
    summary({
      id: 'b',
      startedAt: '2026-10-02T00:00:00Z',
      labels: { model: 'm' },
      cases: { q: 'P' },
    }),
    summary({
      id: 'a',
      startedAt: '2026-10-01T00:00:00Z',
      labels: { model: 'm' },
      cases: { q: 'F' },
    }),
    summary({
      id: 'c',
      startedAt: '2026-10-01T00:00:20Z',
      labels: { model: 'n' },
      cases: { q: 'P' },
    }),
  ];
  const series = seriesOf(runs, 'passRate', 'model');
  const margins = { top: 10, right: 10, bottom: 10, left: 10 };

  test('lays out paths from zero, under the ceiling', () => {
    const layout = lineLayout(series, { width: 110, height: 110 }, margins, 1);
    expect(layout?.paths[0]).toBe('M10,100L100,10');
    expect(layout?.yTicks.at(-1)).toBe(1);
    expect(lineLayout([], { width: 1, height: 1 }, margins)).toBeUndefined();
  });

  test('reads every series near the nearest point', () => {
    const readout = readoutAt(series, Date.parse('2026-10-01T01:00:00Z'), 60_000);
    expect(readout?.entries.map((entry) => entry.point.run.id)).toEqual(['a', 'c']);
  });

  test('steps through the runs with the keyboard', () => {
    const stops = stopsOf(series);
    expect(stops).toHaveLength(3);
    expect(keyStop('ArrowRight', stops, undefined)).toBe(stops[0]);
    expect(keyStop('ArrowLeft', stops, undefined)).toBe(stops[2]);
    expect(keyStop('ArrowRight', stops, stops[2])).toBe(stops[2]);
    expect(keyStop('Home', stops, stops[1])).toBe(stops[0]);
    expect(keyStop('End', stops, stops[0])).toBe(stops[2]);
    expect(keyStop('Enter', stops, stops[0])).toBe('open');
    expect(keyStop('Escape', stops, stops[0])).toBe('clear');
    expect(keyStop('a', stops, stops[0])).toBeUndefined();
  });

  test('keeps a series colour whatever is shown', () => {
    expect(slotOf('b', ['a', 'b', 'c'])).toBe(2);
    expect(slotOf('i', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])).toBe(1);
    expect(slotOf('unknown', ['a'])).toBe(1);
  });
});

describe('the scatter', () => {
  test('moves overlapping labels apart and keeps the order', () => {
    const spread = spreadLabels([50, 52, 100], 15);
    expect(spread[1]! - spread[0]!).toBeGreaterThanOrEqual(15);
    expect(spread[2]! - spread[1]!).toBeGreaterThanOrEqual(15);
    expect(spreadLabels([10, 80], 15)).toEqual([10, 80]);
  });

  test('starts the pass rate axis at a round step under the data', () => {
    expect(ratioFloor([0.58, 0.9])).toBe(0.5);
    expect(ratioFloor([0.02])).toBe(0);
    expect(ratioFloor([])).toBe(0);
  });
});
