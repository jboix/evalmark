/**
 * How numbers read in the comment, the summary and the badges.
 */

/**
 * A ratio as a percentage.
 *
 * @param ratio - From 0 to 1.
 * @returns Such as `87.5%`.
 */
export function formatPercent(ratio: number): string {
  return `${trimZeros((ratio * 100).toFixed(1))}%`;
}

/**
 * Drops a decimal part made of zeros.
 *
 * @param text - A number with decimals.
 * @returns The number without `.0`.
 */
function trimZeros(text: string): string {
  return text.replace(/\.0+$/, '');
}

/**
 * An amount in US dollars: cents from a cent up, two significant digits below.
 *
 * @param usd - The amount, zero or more.
 * @returns Such as `$1.25` or `$0.0042`.
 */
export function formatCost(usd: number): string {
  const amount = Math.abs(usd);
  const text = amount >= 0.01 || amount === 0 ? amount.toFixed(2) : amount.toPrecision(2);
  return `${usd < 0 ? '-' : ''}$${amount === 0 ? '0' : text}`;
}

/**
 * A token count, short.
 *
 * @param tokens - The count.
 * @returns Such as `950`, `12.3k` or `1.2M`.
 */
export function formatTokens(tokens: number): string {
  const size = Math.abs(tokens);
  if (size >= 1_000_000) return `${trimZeros((tokens / 1_000_000).toFixed(1))}M`;
  if (size >= 1_000) return `${trimZeros((tokens / 1_000).toFixed(1))}k`;
  return String(Math.round(tokens));
}

/**
 * A duration, in the two largest units.
 *
 * @param milliseconds - The duration.
 * @returns Such as `850ms`, `41s`, `4m 10s` or `1h 2m`.
 */
export function formatDuration(milliseconds: number): string {
  const sign = milliseconds < 0 ? '-' : '';
  const size = Math.abs(milliseconds);
  if (size < 1000) return `${sign}${Math.round(size)}ms`;
  const seconds = Math.round(size / 1000);
  if (seconds < 60) return `${sign}${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${sign}${minutes}m ${seconds % 60}s`;
  return `${sign}${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * A change, with its sign.
 *
 * @param delta - The change.
 * @param format - How the size of the change reads.
 * @returns Such as `+3`, `-$0.02` or `0`.
 */
export function formatDelta(delta: number, format: (value: number) => string): string {
  if (delta === 0) return '0';
  const text = format(Math.abs(delta));
  return `${delta > 0 ? '+' : '-'}${text}`;
}

/**
 * A pass rate's change, in percentage points.
 *
 * @param delta - The change, as a ratio.
 * @returns Such as `+5 pp`.
 */
export function formatPointsDelta(delta: number): string {
  return formatDelta(
    Number((delta * 100).toFixed(1)),
    (value) => `${trimZeros(value.toFixed(1))} pp`,
  );
}
