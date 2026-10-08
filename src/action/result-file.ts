/**
 * Reading the result file: parse it, validate it against the result format, add the workflow's
 * labels and redact secrets. A file another tool wrote (promptfoo, Inspect AI, JUnit XML) is
 * imported first, into one result per model.
 */
import { readFile } from 'node:fs/promises';
import type { z } from 'zod';
import { type Result, resultSchema } from '../format/result.ts';
import { detectFormat, type ImportFormat, importResults } from '../import/import-results.ts';
import { type Redactor, redactDeep } from './redact.ts';

/**
 * Lists a validation's issues, one per line, each with where it is in the file.
 *
 * @param issues - The issues zod found.
 * @returns The lines.
 */
export function describeIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues
    .slice(0, 20)
    .map((issue) => {
      const where = issue.path.length === 0 ? 'the file' : issue.path.map(String).join('.');
      return `- ${where}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Validates parsed JSON as a result.
 *
 * @param data - The parsed file.
 * @param path - The file's path, for the message.
 * @returns The result.
 * @throws When the data is not a valid result, with every issue listed.
 */
export function parseResult(data: unknown, path: string): Result {
  const parsed = resultSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error(
    `The result file ${path} is not a valid result:\n${describeIssues(parsed.error.issues)}`,
  );
}

/**
 * Reads and validates a result file, adds labels over its own, and redacts it.
 *
 * @param path - The file's path.
 * @param labels - Labels to add, which win over the result's own.
 * @param redact - The redactor.
 * @returns The result, ready to record.
 * @throws When the file is missing, is not JSON, or is not a valid result.
 */
export async function readResult(
  path: string,
  labels: Readonly<Record<string, string>>,
  redact: Redactor,
): Promise<Result> {
  const text = await readFile(path, 'utf8').catch((error: unknown) => {
    throw new Error(`The result file ${path} could not be read: ${String(error)}`);
  });
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`The result file ${path} is not JSON: ${String(error)}`);
  }
  const result = parseResult(data, path);
  return redactDeep({ ...result, labels: { ...result.labels, ...labels } }, redact);
}

/**
 * The format of a result file: the one given, or the one its content shows.
 *
 * @param path - The file's path.
 * @param format - The `format` input.
 * @returns The format.
 * @throws When the file cannot be read, or `auto` recognizes no format.
 */
async function formatOf(path: string, format: 'auto' | ImportFormat): Promise<ImportFormat> {
  if (format !== 'auto') return format;
  const content = await readFile(path).catch((error: unknown) => {
    throw new Error(`The result file ${path} could not be read: ${String(error)}`);
  });
  return detectFormat(path, content);
}

/**
 * Reads a result file in any format the action knows: an evalmark result is read as it is, any other
 * is imported into one result per model. Each gets the labels and is redacted.
 *
 * @param path - The file's path.
 * @param format - The `format` input.
 * @param labels - Labels to add, which win over the results' own.
 * @param redact - The redactor.
 * @returns The results, ready to record.
 * @throws When the file is missing, its format is unknown, or it is not valid.
 */
export async function readResults(
  path: string,
  format: 'auto' | ImportFormat,
  labels: Readonly<Record<string, string>>,
  redact: Redactor,
): Promise<Result[]> {
  const found = await formatOf(path, format);
  if (found === 'evalmark') return [await readResult(path, labels, redact)];
  const results = await importResults(path, found);
  return results.map((result) =>
    redactDeep({ ...result, labels: { ...result.labels, ...labels } }, redact),
  );
}
