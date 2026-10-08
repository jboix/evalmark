/**
 * How the dashboard writes numbers, money, tokens, durations and dates.
 */

/** A missing value, as every formatter writes it. */
export const missing = '–';

/**
 * A ratio as a percentage: one decimal, none for whole numbers.
 *
 * @param ratio - From 0 to 1, or `null` when there is none.
 * @returns Such as `87.5%`.
 */
export function formatPercent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return missing;
  const percent = Math.round(ratio * 1000) / 10;
  return `${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)}%`;
}

/**
 * A change of a ratio, in percentage points with its sign.
 *
 * @param delta - The change, as a difference of ratios.
 * @returns Such as `+2.5 pt`.
 */
export function formatPointsDelta(delta: number): string {
  const points = Math.round(delta * 1000) / 10;
  if (points === 0) return '±0 pt';
  return `${points > 0 ? '+' : '−'}${Math.abs(points).toFixed(Number.isInteger(points) ? 0 : 1)} pt`;
}

/**
 * An amount in US dollars, with the precision its size needs.
 *
 * @param usd - The amount.
 * @returns Such as `$1.24`, `$0.083` or `$0.0042`.
 */
export function formatCost(usd: number): string {
  const size = Math.abs(usd);
  const sign = usd < 0 ? '−' : '';
  if (size === 0) return '$0';
  if (size >= 100) return `${sign}$${Math.round(size).toLocaleString('en-US')}`;
  if (size >= 1) return `${sign}$${size.toFixed(2)}`;
  if (size >= 0.01) return `${sign}$${size.toFixed(3)}`;
  return `${sign}$${size.toPrecision(2)}`;
}

/**
 * A count in a short form.
 *
 * @param count - The count, such as a number of tokens.
 * @returns Such as `950`, `12.3k` or `1.25M`.
 */
export function formatCount(count: number): string {
  const size = Math.abs(count);
  const sign = count < 0 ? '−' : '';
  if (size < 1000) return `${sign}${Math.round(size)}`;
  if (size < 999_500) return `${sign}${trimZero((size / 1000).toFixed(size < 10_000 ? 2 : 1))}k`;
  return `${sign}${trimZero((size / 1_000_000).toFixed(2))}M`;
}

/**
 * Drops trailing zeros after a decimal point.
 *
 * @param fixed - A number written with `toFixed`.
 * @returns Such as `12` for `12.0`, `1.5` for `1.50`.
 */
function trimZero(fixed: string): string {
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed;
}

/**
 * A duration, in the units a reader expects at its size.
 *
 * @param milliseconds - The duration.
 * @returns Such as `850ms`, `4.2s`, `41s`, `1m 05s` or `1h 02m`.
 */
export function formatDuration(milliseconds: number): string {
  const size = Math.abs(milliseconds);
  const sign = milliseconds < 0 ? '−' : '';
  if (size < 1000) return `${sign}${Math.round(size)}ms`;
  if (size < 10_000) return `${sign}${(size / 1000).toFixed(1)}s`;
  const seconds = Math.round(size / 1000);
  if (seconds < 60) return `${sign}${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${sign}${minutes}m ${pad(seconds % 60)}s`;
  return `${sign}${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}

/**
 * Pads a number to two digits.
 *
 * @param value - The number, from 0 to 59.
 * @returns Such as `05`.
 */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * A signed change, written by a formatter of the unsigned value.
 *
 * @param delta - The change.
 * @param format - Writes the size of the change.
 * @returns Such as `+$0.12` or `−1.2k`; `±0` when there is no change.
 */
export function formatDelta(delta: number, format: (value: number) => string): string {
  if (delta === 0) return '±0';
  return `${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`;
}

/** The steps of a relative date: the unit, its length in seconds, and the step to the next. */
const relativeSteps: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400],
  ['month', 30 * 86_400],
  ['week', 7 * 86_400],
  ['day', 86_400],
  ['hour', 3600],
  ['minute', 60],
];

/**
 * A date relative to now.
 *
 * @param iso - The date, as ISO 8601.
 * @param now - The current time, in milliseconds since the epoch.
 * @returns Such as `3 hours ago`, `yesterday` or `just now`.
 */
export function formatRelative(iso: string, now: number): string {
  const seconds = (Date.parse(iso) - now) / 1000;
  if (Number.isNaN(seconds)) return missing;
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const step = relativeSteps.find(([, length]) => Math.abs(seconds) >= length);
  if (step === undefined) return 'just now';
  const [unit, length] = step;
  return format.format(Math.round(seconds / length), unit);
}

/**
 * A date written in full, in the reader's time zone.
 *
 * @param iso - The date, as ISO 8601.
 * @returns Such as `Oct 8, 2026, 10:00`.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return missing;
  return date.toLocaleString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

/**
 * A short date, for an axis or a column.
 *
 * @param time - Milliseconds since the epoch.
 * @returns Such as `Oct 8`.
 */
export function formatShortDate(time: number): string {
  return new Date(time).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/**
 * A commit's short form.
 *
 * @param sha - The full SHA.
 * @returns Its first seven characters.
 */
export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/**
 * A value that is a count of something, with the noun in the right number.
 *
 * @param count - The count.
 * @param singular - The noun for one.
 * @param pluralForm - The noun for many; the singular with `s` when left out.
 * @returns Such as `1 case` or `3 cases`.
 */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * An amount in US dollars for an axis: no more digits than the value has.
 *
 * @param usd - The amount.
 * @returns Such as `$0`, `$0.5` or `$1.25`.
 */
export function formatCostTick(usd: number): string {
  if (usd === 0) return '$0';
  if (Math.abs(usd) < 0.01) return `$${Number(usd.toPrecision(2))}`;
  return `$${Number(usd.toFixed(2))}`;
}

/**
 * A label key as a field's name: its first letter in capitals, as the other fields have it.
 *
 * @param key - The key, such as `model`.
 * @returns Such as `Model`.
 */
export function fieldName(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
