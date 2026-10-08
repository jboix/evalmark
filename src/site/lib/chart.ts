/**
 * The geometry of the dashboard's charts: scales, ticks and paths, computed apart from the
 * components so they can be tested.
 */
import { linearScale, niceTicks, type Scale, timeTicks } from './scale.ts';
import type { Series } from './series.ts';

/** The space around a chart's plot, for its axes. */
export interface Margins {
  /** Above the plot. */
  readonly top: number;
  /** Right of the plot. */
  readonly right: number;
  /** Below the plot, for the time axis. */
  readonly bottom: number;
  /** Left of the plot, for the value axis. */
  readonly left: number;
}

/** A line chart's geometry. */
export interface LineLayout {
  /** From time to x. */
  readonly x: Scale;
  /** From value to y. */
  readonly y: Scale;
  /** The time ticks. */
  readonly xTicks: readonly number[];
  /** The value ticks. */
  readonly yTicks: readonly number[];
  /** Each series' path, as SVG path data, in the series' order. */
  readonly paths: readonly string[];
}

/** How many categorical colours there are. */
const seriesSlots = 8;

/**
 * The colour slot of a series: its place among every value the label takes, so a series keeps its
 * colour whatever the filters show.
 *
 * @param name - The series' name.
 * @param names - Every name the series could have, in a fixed order.
 * @returns The slot, from 1 to 8.
 */
export function slotOf(name: string, names: readonly string[]): number {
  const index = names.indexOf(name);
  return (Math.max(0, index) % seriesSlots) + 1;
}

/**
 * The extent of the values of every series.
 *
 * @param series - The series.
 * @param pick - Reads a point's value on the axis.
 * @returns `[low, high]`, or `undefined` when there are no points.
 */
function extentOf(
  series: readonly Series[],
  pick: (point: Series['points'][number]) => number,
): [number, number] | undefined {
  const values = series.flatMap((line) => line.points.map(pick));
  if (values.length === 0) return undefined;
  return [Math.min(...values), Math.max(...values)];
}

/**
 * Lays out a line chart: values from zero, time across.
 *
 * @param series - The series.
 * @param size - The chart's width and height, in pixels.
 * @param margins - The space around the plot.
 * @param ceiling - The highest value the axis may show, such as 1 for a ratio.
 * @returns The layout, or `undefined` when there is nothing to draw.
 */
export function lineLayout(
  series: readonly Series[],
  size: { readonly width: number; readonly height: number },
  margins: Margins,
  ceiling = Number.POSITIVE_INFINITY,
): LineLayout | undefined {
  const times = extentOf(series, (point) => point.time);
  const values = extentOf(series, (point) => point.value);
  if (times === undefined || values === undefined) return undefined;
  const yTicks = niceTicks(0, Math.max(values[1], Number.EPSILON)).filter(
    (tick) => tick <= ceiling,
  );
  const top = Math.min(Math.max(values[1], yTicks.at(-1) ?? 1), ceiling);
  const x = linearScale(times, [margins.left, size.width - margins.right]);
  const y = linearScale([0, top], [size.height - margins.bottom, margins.top]);
  const paths = series.map((line) =>
    line.points
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'}${round(x(point.time))},${round(y(point.value))}`,
      )
      .join(''),
  );
  return { x, y, xTicks: timeTicks(times[0], times[1]), yTicks, paths };
}

/**
 * Rounds a coordinate to a tenth of a pixel, to keep path data short.
 *
 * @param value - The coordinate.
 * @returns The rounded coordinate.
 */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** The point of each series nearest a time, for the hover readout. */
export interface Readout {
  /** The time the readout is at: the nearest point's. */
  readonly time: number;
  /** One entry per series that has a point near the time. */
  readonly entries: readonly {
    readonly series: number;
    readonly point: Series['points'][number];
  }[];
}

/**
 * The readout at a time: the nearest point overall, and each series' point within a window of it.
 *
 * @param series - The series.
 * @param time - The pointer's time.
 * @param window - How far a series' point may be from the nearest one, in milliseconds.
 * @returns The readout, or `undefined` when there are no points.
 */
export function readoutAt(
  series: readonly Series[],
  time: number,
  window: number,
): Readout | undefined {
  const all = series.flatMap((line) => line.points.map((point) => point.time));
  const nearest = all.reduce<number | undefined>(
    (best, candidate) =>
      best === undefined || Math.abs(candidate - time) < Math.abs(best - time) ? candidate : best,
    undefined,
  );
  if (nearest === undefined) return undefined;
  const entries = series.flatMap((line, index) => {
    const point = closestPoint(line, nearest);
    return point !== undefined && Math.abs(point.time - nearest) <= window
      ? [{ series: index, point }]
      : [];
  });
  return { time: nearest, entries };
}

/**
 * A series' point nearest a time.
 *
 * @param line - The series.
 * @param time - The time.
 * @returns The point, or `undefined` when the series is empty.
 */
function closestPoint(line: Series, time: number): Series['points'][number] | undefined {
  return line.points.reduce<Series['points'][number] | undefined>(
    (best, point) =>
      best === undefined || Math.abs(point.time - time) < Math.abs(best.time - time) ? point : best,
    undefined,
  );
}

/**
 * Every distinct time of the series, ascending: the stops of keyboard navigation.
 *
 * @param series - The series.
 * @returns The times.
 */
export function stopsOf(series: readonly Series[]): number[] {
  return [...new Set(series.flatMap((line) => line.points.map((point) => point.time)))].sort(
    (first, second) => first - second,
  );
}

/**
 * Where a key moves the readout.
 *
 * @param key - The key pressed.
 * @param stops - The times the readout can stop at, ascending.
 * @param active - The current time, if any.
 * @returns The new time, `open`, `clear`, or `undefined` for a key the chart ignores.
 */
export function keyStop(
  key: string,
  stops: readonly number[],
  active: number | undefined,
): number | 'open' | 'clear' | undefined {
  const index = active === undefined ? -1 : stops.indexOf(active);
  const moves: Readonly<Record<string, () => number | 'open' | 'clear' | undefined>> = {
    Enter: () => 'open',
    Escape: () => 'clear',
    Home: () => stops[0],
    End: () => stops.at(-1),
    ArrowRight: () => stops[Math.min(stops.length - 1, index + 1)],
    ArrowLeft: () => stops[index === -1 ? stops.length - 1 : Math.max(0, index - 1)],
  };
  return moves[key]?.();
}

/**
 * Moves labels apart vertically so none overlap, keeping each as close to its point as it can.
 *
 * @param positions - Each label's wanted position, in any order.
 * @param gap - The least distance between two labels.
 * @returns The positions to draw them at, in the same order.
 */
export function spreadLabels(positions: readonly number[], gap: number): number[] {
  const order = positions
    .map((position, index) => ({ position, index }))
    .sort((first, second) => first.position - second.position);
  const placed: number[] = [];
  for (const entry of order) {
    const previous = placed.at(-1);
    placed.push(previous === undefined ? entry.position : Math.max(entry.position, previous + gap));
  }
  // Centre the pushed group on the wanted positions again, so it does not only drift down.
  const shift =
    order.reduce((total, entry, rank) => total + (placed[rank] ?? 0) - entry.position, 0) /
    Math.max(1, order.length);
  const result = new Array<number>(positions.length);
  order.forEach((entry, rank) => {
    result[entry.index] = (placed[rank] ?? entry.position) - shift;
  });
  return result;
}

/**
 * The lower end of a ratio axis: a round step under the lowest value, or zero.
 *
 * @param values - The ratios, from 0 to 1.
 * @returns The lower end, a multiple of 0.1.
 */
export function ratioFloor(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.max(0, Math.floor((Math.min(...values) - 0.05) * 10) / 10);
}
