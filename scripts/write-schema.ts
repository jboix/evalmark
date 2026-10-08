/**
 * Writes the result format's JSON Schema from the zod schema the action validates with, into
 * `schema/result.v<version>.json`. A breaking change to the format makes a new version and a new
 * file; the old ones stay, so a harness pinned to them keeps validating. `pnpm run schema` runs it
 * and formats the output; a test checks that the committed file matches.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { resultSchema, resultVersion } from '../src/format/result.ts';

/** The schema's file name, by format version. */
const schemaFile = `result.v${resultVersion}.json`;

/** Where the schema is written, relative to the repository. */
export const schemaPath = `schema/${schemaFile}`;

/** Where the schema is published, by the GitHub Pages site: its `$id`. */
export const schemaId = `https://jboix.github.io/evalmark/schema/${schemaFile}`;

/**
 * Keeps a date's schema readable: `format: date-time` says what zod's long pattern checks.
 *
 * @param context - The generated schema of one part of the format.
 * @param context.jsonSchema - That schema, changed in place.
 */
function readableDates(context: { readonly jsonSchema: Record<string, unknown> }): void {
  if (context.jsonSchema.format === 'date-time') delete context.jsonSchema.pattern;
}

/**
 * The result format's JSON Schema, with its id, title and description first.
 *
 * @returns The schema, as a JSON value.
 */
export function resultJsonSchema(): Record<string, unknown> {
  // The input side: the action accepts and drops unknown fields, so the schema allows them.
  const { $schema, description, ...schema } = z.toJSONSchema(resultSchema, {
    target: 'draft-2020-12',
    io: 'input',
    override: readableDates,
  });
  return {
    $schema,
    $id: schemaId,
    title: `evalmark result, version ${resultVersion}`,
    description,
    ...schema,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(schemaPath, `${JSON.stringify(resultJsonSchema(), null, 2)}\n`);
}
