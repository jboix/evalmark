/**
 * Chart scales and ticks, for the dashboard's own SVG charts.
 */

/** A function from data values to positions. */
export type Scale = (value: number) => number;

/**
 * A linear scale.
 *
 * @param domain - The data range, `[low, high]`.
 * @param range - The position range, `[start, end]`.
 * @returns The scale; a flat domain maps to the middle of the range.
 */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): Scale {
  const [low, high] = domain;
  const [start, end] = range;
  if (high === low) return () => (start + end) / 2;
  return (value) => start + ((value - low) / (high - low)) * (end - start);
}

/**
 * A step between ticks that is 1, 2 or 5 times a power of ten, the nearest to the rough step.
 *
 * @param span - The range to cover.
 * @param count - About how many ticks to have.
 * @returns The step.
 */
function niceStep(span: number, count: number): number {
  const rough = span / Math.max(1, count);
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / power;
  // The thresholds are the geometric means of 1, 2, 5 and 10, so the step is the nearest one.
  if (fraction < Math.SQRT2) return power;
  if (fraction < Math.sqrt(10)) return 2 * power;
  if (fraction < Math.sqrt(50)) return 5 * power;
  return 10 * power;
}

/**
 * Ticks for a value axis, at round values covering the data.
 *
 * @param low - The smallest value.
 * @param high - The largest value.
 * @param count - About how many ticks to have.
 * @returns The ticks, ascending; the first is at or below `low`, the last at or above `high`.
 */
export function niceTicks(low: number, high: number, count = 4): number[] {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return [];
  if (high === low) return low === 0 ? [0, 1] : niceTicks(Math.min(0, low), Math.max(0, high));
  const step = niceStep(high - low, count);
  const first = Math.floor(low / step) * step;
  const ticks: number[] = [];
  const tolerance = step / 1e6;
  for (
    let tick = first;
    ticks.length === 0 || (ticks.at(-1) ?? high) < high - tolerance;
    tick += step
  ) {
    ticks.push(Number(tick.toPrecision(12)));
  }
  return ticks;
}
