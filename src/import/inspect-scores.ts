/**
 * Inspect AI scores as checks. Each scorer is a check; a scorer whose value is a dictionary is one
 * check per key. A value maps to a number the way Inspect's `value_to_float` does (`C` 1, `P` 0.5,
 * `I` and `N` 0, booleans, numbers, `yes` and `no`), and a check passes when that number is at
 * least 1: a partial answer does not pass.
 */
import type { CheckResult } from '../format/result.ts';
import { pruned, unitScore } from './common.ts';
import type { InspectScore } from './inspect-schema.ts';

/** Inspect's letter values. */
const letters: Readonly<Record<string, number>> = { C: 1, P: 0.5, I: 0, N: 0 };

/** Words Inspect reads as booleans. */
const words: Readonly<Record<string, number>> = { yes: 1, true: 1, no: 0, false: 0 };

/** A check with the number its value maps to. */
interface ScoredCheck {
  /** The check result. */
  readonly result: CheckResult;
  /** The value as a number, or `undefined` when it has none. */
  readonly value: number | undefined;
}

/**
 * A scalar score value as a number.
 *
 * @param value - The value: a letter, a word, a number, a boolean or a numeric string.
 * @returns The number, or `undefined` for a value with no number, such as free text.
 */
export function numberOfValue(value: unknown): number | undefined {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  return typeof value === 'string' ? numberOfText(value) : undefined;
}

/**
 * A text score value as a number.
 *
 * @param value - A letter, a word or a numeric string.
 * @returns The number, or `undefined` for free text.
 */
function numberOfText(value: string): number | undefined {
  const known = letters[value] ?? words[value.toLowerCase()];
  if (known !== undefined) return known;
  const number = value.trim() === '' ? Number.NaN : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/**
 * A list of scalar values as one number: their mean.
 *
 * @param values - The values.
 * @returns The mean, or `undefined` when a value has no number.
 */
function meanOf(values: readonly unknown[]): number | undefined {
  const numbers = values.map(numberOfValue);
  if (numbers.length === 0 || numbers.some((number) => number === undefined)) return undefined;
  return (numbers as number[]).reduce((sum, number) => sum + number, 0) / numbers.length;
}

/**
 * One check from a value.
 *
 * @param id - The check's id.
 * @param value - The value: a scalar, or a list whose mean is used.
 * @param message - Why, from the score's explanation.
 * @returns The check and its number.
 */
function checkOf(id: string, value: unknown, message: string | undefined): ScoredCheck {
  const number = Array.isArray(value) ? meanOf(value) : numberOfValue(value);
  return {
    result: pruned<CheckResult>({ id, pass: number !== undefined && number >= 1, message }),
    value: number,
  };
}

/**
 * The checks of one score.
 *
 * @param name - The scorer's name.
 * @param score - The score.
 * @returns One check, or one per key when the value is a dictionary.
 */
function checksOfScore(name: string, score: InspectScore): ScoredCheck[] {
  const message = score.explanation || (score.answer ? `Answer: ${score.answer}` : undefined);
  const { value } = score;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [checkOf(name, value, message)];
  }
  return Object.entries(value).map(([key, entry]) => checkOf(`${name}/${key}`, entry, message));
}

/**
 * A sample's checks and score.
 *
 * @param scores - The sample's scores, by scorer.
 * @returns The checks, and the mean of their numbers from 0 to 1, when there are some.
 */
export function checksOfScores(scores: Readonly<Record<string, InspectScore>> | null | undefined): {
  checks: CheckResult[];
  score: number | undefined;
} {
  const scored = Object.entries(scores ?? {}).flatMap(([name, score]) =>
    checksOfScore(name, score),
  );
  const units = scored.flatMap((check) => {
    const unit = unitScore(check.value);
    return unit === undefined ? [] : [unit];
  });
  const score =
    units.length > 0 ? units.reduce((sum, unit) => sum + unit, 0) / units.length : undefined;
  return { checks: scored.map((check) => check.result), score };
}
