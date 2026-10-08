/**
 * Status marks: each status has a shape as well as a colour, so it reads without colour. A pass is
 * a filled circle, a fail a cross, a flaky case a half-filled circle, an error a triangle, and a
 * case that did not run a hollow circle.
 */
import type { TrialStatus } from '../../format/result.ts';
import { statusOfLetters } from '../../format/totals.ts';

/** The kinds of mark. */
export type MarkKind = 'pass' | 'fail' | 'flaky' | 'error' | 'skip';

/** The word each mark stands for, read out with it. */
export const markWords: Readonly<Record<MarkKind, string>> = {
  pass: 'pass',
  fail: 'fail',
  flaky: 'flaky',
  error: 'error',
  skip: 'not run',
};

/** Each trial status's mark. */
const trialMarks: Readonly<Record<TrialStatus, MarkKind>> = {
  pass: 'pass',
  fail: 'fail',
  error: 'error',
  skip: 'skip',
};

/**
 * The mark of one trial.
 *
 * @param status - The trial's status.
 * @returns The mark.
 */
export function markOfTrial(status: TrialStatus): MarkKind {
  return trialMarks[status];
}

/**
 * The mark of a case in a run, from its trials' letters: an error when every trial that ran ended
 * in one, else the case's status.
 *
 * @param letters - The trials' letters, or `undefined` when the run did not have the case.
 * @returns The mark.
 */
export function markOfLetters(letters: string | undefined): MarkKind {
  if (letters === undefined) return 'skip';
  const ran = letters.replaceAll('S', '');
  if (ran !== '' && /^E+$/.test(ran)) return 'error';
  return statusOfLetters(letters);
}

/** The mark of each trial letter. */
const letterMarks: Readonly<Record<string, MarkKind>> = {
  P: 'pass',
  F: 'fail',
  E: 'error',
  S: 'skip',
};

/**
 * The mark of one trial letter.
 *
 * @param letter - The letter, such as `P`.
 * @returns The mark; `skip` for an unknown letter.
 */
export function markOfLetter(letter: string): MarkKind {
  return letterMarks[letter] ?? 'skip';
}
