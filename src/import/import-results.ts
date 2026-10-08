/**
 * Importing other tools' eval output: detect the format of a file and convert it to one or more
 * results, each validated against the result format. A file holding several models gives one
 * result per model, as a result has one set of labels.
 */
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { z } from 'zod';
import type { Result } from '../format/result.ts';
import { validated } from './common.ts';
import { importInspectEval, importInspectJson } from './inspect.ts';
import { importJunit } from './junit.ts';
import { importPromptfoo } from './promptfoo.ts';
import { isZip } from './zip.ts';

/** The formats `importResults` reads. */
export const importFormats = ['evalmark', 'promptfoo', 'inspect', 'junit'] as const;

/** A format `importResults` reads. */
export type ImportFormat = (typeof importFormats)[number];

/** A file's format, with its parsed JSON when it is JSON. */
interface Sniffed {
  /** The format. */
  readonly format: ImportFormat;
  /** The parsed JSON, or `undefined` for XML and zip archives. */
  readonly json?: unknown;
}

/**
 * Whether a value is an object with a property.
 *
 * @param value - The value.
 * @param key - The property.
 * @returns The property's value, or `undefined`.
 */
function property(value: unknown, key: string): unknown {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

/**
 * The format of parsed JSON.
 *
 * @param json - The parsed file.
 * @returns The format, or `undefined` when it is none of the JSON formats.
 */
function jsonFormatOf(json: unknown): ImportFormat | undefined {
  if (property(json, 'version') === 1 && Array.isArray(property(json, 'cases'))) return 'evalmark';
  const evalSpec = property(json, 'eval');
  if (
    typeof property(evalSpec, 'task') === 'string' &&
    typeof property(evalSpec, 'model') === 'string'
  ) {
    return 'inspect';
  }
  const results = property(json, 'results');
  if (Array.isArray(property(results, 'results'))) return 'promptfoo';
  if (Array.isArray(results) && property(json, 'stats') !== undefined) return 'promptfoo';
  return undefined;
}

/**
 * Parses text as JSON.
 *
 * @param text - The text.
 * @returns The parsed value, or `undefined` when it is not JSON.
 */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Finds a file's format from its content, with its extension as a hint for XML.
 *
 * @param path - The file's path.
 * @param bytes - Its content.
 * @returns The format and, for JSON, the parsed file.
 * @throws When the content is none of the formats.
 */
function sniff(path: string, bytes: Uint8Array): Sniffed {
  if (isZip(bytes)) return { format: 'inspect' };
  const text = Buffer.from(bytes).toString('utf8').replace(/^﻿/, '');
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<')) {
    if (/<testsuites?[\s>]/.test(trimmed) || extname(path).toLowerCase() === '.xml')
      return { format: 'junit' };
  }
  const json = parseJson(text);
  const format = jsonFormatOf(json);
  if (format) return { format, json };
  throw new Error(
    `The format of ${path} was not recognised. Pass it with --format: ${importFormats.join(', ')}.`,
  );
}

/**
 * Detects the format of a file from its content, with its extension as a hint.
 *
 * @param path - The file's path.
 * @param content - Its content, as text or bytes.
 * @returns The format.
 * @throws When the content is none of the formats.
 */
export function detectFormat(path: string, content: string | Uint8Array): ImportFormat {
  return sniff(path, typeof content === 'string' ? Buffer.from(content) : content).format;
}

/**
 * Parses a file that must be JSON.
 *
 * @param bytes - The file.
 * @param json - The JSON already parsed by detection, if any.
 * @returns The parsed value.
 * @throws When it is not JSON.
 */
function jsonOf(bytes: Buffer, json: unknown): unknown {
  if (json !== undefined) return json;
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`The file is not JSON: ${String(error)}`);
  }
}

/**
 * Converts a file of a known format.
 *
 * @param format - The format.
 * @param bytes - The file.
 * @param json - The JSON already parsed by detection, if any.
 * @returns The converted results, not yet validated.
 */
function convert(format: ImportFormat, bytes: Buffer, json: unknown): Result[] {
  if (format === 'junit') return importJunit(bytes.toString('utf8'));
  if (format === 'inspect' && isZip(bytes)) return importInspectEval(bytes);
  const data = jsonOf(bytes, json);
  if (format === 'inspect') return importInspectJson(data);
  if (format === 'promptfoo') return importPromptfoo(data);
  return [data as Result];
}

/**
 * Describes a conversion failure, with zod's issues in a line each.
 *
 * @param error - What the conversion threw.
 * @returns The message.
 */
function reasonOf(error: unknown): string {
  if (!(error instanceof z.ZodError)) return error instanceof Error ? error.message : String(error);
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.map(String).join('.') || 'the file'}: ${issue.message}`)
    .join('; ');
}

/**
 * Reads another tool's eval output and converts it to results.
 *
 * @param path - The file: a promptfoo results JSON, an Inspect AI log (`.json` or `.eval`), a JUnit
 *   XML report, or an evalmark result.
 * @param format - Its format, or `auto` to detect it.
 * @returns One result per model or provider in the file, each valid against the result format.
 * @throws When the file cannot be read, its format is not recognised, or it does not convert.
 */
export async function importResults(
  path: string,
  format: ImportFormat | 'auto' = 'auto',
): Promise<Result[]> {
  const bytes = await readFile(path).catch((error: unknown) => {
    throw new Error(`${path} could not be read: ${String(error)}`);
  });
  const sniffed: Sniffed = format === 'auto' ? sniff(path, bytes) : { format };
  let drafts: Result[];
  try {
    drafts = convert(sniffed.format, bytes, sniffed.json);
  } catch (error) {
    throw new Error(`${path} is not a readable ${sniffed.format} file: ${reasonOf(error)}`);
  }
  return drafts.map((draft) => validated(draft, path));
}
