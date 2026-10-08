/**
 * Helpers every importer shares: stable ids, units, labels and the final validation against the
 * result format.
 */
import { createHash } from 'node:crypto';
import { type Result, resultSchema } from '../format/result.ts';

/** The longest case id the result format accepts. */
const maxCaseIdLength = 200;

/**
 * Serializes a value as JSON with object keys sorted, so equal values give equal text.
 *
 * @param value - Any JSON value.
 * @returns The JSON text.
 */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  const entries = Object.entries(value)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : 1));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`).join(',')}}`;
}

/**
 * A short, stable hash of a value: the first 12 hex digits of the SHA-256 of its stable JSON.
 *
 * @param value - Any JSON value.
 * @returns The hash.
 */
export function stableHash(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex').slice(0, 12);
}

/**
 * A case id from a name: the name itself, or, when it is too long for the result format, its start
 * followed by its hash.
 *
 * @param name - The name, such as a test's description.
 * @returns An id of 1 to 200 characters.
 */
export function caseIdOf(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'case';
  if (trimmed.length <= maxCaseIdLength) return trimmed;
  return `${trimmed.slice(0, maxCaseIdLength - 13)}-${stableHash(trimmed)}`;
}

/**
 * Copies an object without its `undefined` properties, as the result format's optional fields
 * must be absent rather than undefined.
 *
 * @param value - The object, with possibly undefined properties.
 * @returns The object, typed as the result type it stands for.
 */
export function pruned<Type extends object>(
  value: {
    [Key in keyof Type]?: Type[Key] | undefined;
  },
): Type {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Type;
}

/**
 * A value as text: a string as it is, anything else as JSON.
 *
 * @param value - The value.
 * @returns The text, or `undefined` for `null`, `undefined` and the empty string.
 */
export function textOf(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * A score the result format accepts: a finite number from 0 to 1.
 *
 * @param value - The score.
 * @returns The score, or `undefined` when it is outside that range.
 */
export function unitScore(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value >= 0 && value <= 1 ? value : undefined;
}

/**
 * A token count the result format accepts: a non-negative integer.
 *
 * @param value - The count.
 * @returns The count, rounded, or `undefined` when it is missing or negative.
 */
export function tokenCount(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value);
}

/**
 * An amount the result format accepts, such as a cost: a finite, non-negative number.
 *
 * @param value - The amount.
 * @returns The amount, or `undefined` when it is missing or negative.
 */
export function amountOf(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return value;
}

/**
 * A list, or `undefined` when it is empty, so an empty list is left out of a result.
 *
 * @param items - The list.
 * @returns The list, or `undefined`.
 */
export function nonEmpty<Item>(items: Item[]): Item[] | undefined {
  return items.length > 0 ? items : undefined;
}

/**
 * An object, or `undefined` when it has no property, so an empty object is left out of a result.
 *
 * @param value - The object.
 * @returns The object, or `undefined`.
 */
export function nonEmptyObject<Type extends object>(value: Type): Type | undefined {
  return Object.keys(value).length > 0 ? value : undefined;
}

/**
 * A duration in milliseconds from seconds.
 *
 * @param seconds - The duration in seconds, possibly missing or negative.
 * @returns The milliseconds, or `undefined`.
 */
export function millisecondsOf(seconds: number | null | undefined): number | undefined {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.round(seconds * 1000);
}

/**
 * A time as the result format writes it, from any date text `Date` reads. A time without a zone
 * is read as UTC.
 *
 * @param text - The time, such as `2026-10-08T10:00:00` or `2026-10-08T10:00:00.123+02:00`.
 * @returns The ISO 8601 time in UTC, or `undefined` when the text is not a time.
 */
export function isoTimeOf(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  const hasZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(text.trim());
  const time = new Date(hasZone ? text : `${text.trim().replace(' ', 'T')}Z`);
  return Number.isNaN(time.getTime()) ? undefined : time.toISOString();
}

/**
 * Labels from a model name: the model, and the provider when it is known.
 *
 * @param model - The model, or `undefined`.
 * @param provider - The provider, or `undefined`.
 * @returns The labels, or `undefined` when there is no model.
 */
export function modelLabels(
  model: string | undefined,
  provider: string | undefined,
): Record<string, string> | undefined {
  if (!model) return undefined;
  return provider ? { model, provider } : { model };
}

/**
 * Validates a converted result against the result format.
 *
 * @param draft - The converted result.
 * @param path - The file it was read from, for the message.
 * @returns The validated result.
 * @throws When the conversion does not give a valid result, with the first issues listed.
 */
export function validated(draft: Result, path: string): Result {
  const parsed = resultSchema.safeParse(draft);
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues
    .slice(0, 10)
    .map((issue) => `- ${issue.path.map(String).join('.') || 'the result'}: ${issue.message}`);
  throw new Error(`${path} did not convert to a valid result:\n${issues.join('\n')}`);
}
