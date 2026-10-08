/**
 * The step's outputs and its job summary, appended to the files GitHub names in `GITHUB_OUTPUT`
 * and `GITHUB_STEP_SUMMARY`. Without those variables, nothing is written.
 */
import { randomBytes } from 'node:crypto';
import { appendFile } from 'node:fs/promises';

/** The action's outputs, as `action.yml` names them. */
export interface Outputs {
  /** The recorded run's id. */
  readonly 'run-id': string;
  /** The run's pass rate, from 0 to 1, or `''` when no trial ran. */
  readonly 'pass-rate': string;
  /** `true` when the run was pushed. */
  readonly recorded: string;
  /** The run's page on the site, or `''`. */
  readonly 'run-url': string;
  /** The folder's size on disk after recording, in bytes, or `''` when nothing was recorded. */
  readonly 'evalmark-size': string;
}

/**
 * The outputs in the file format GitHub reads, each value between delimiters so any text is safe.
 *
 * @param outputs - The outputs.
 * @returns The text to append.
 */
export function outputsText(outputs: Readonly<Record<string, string>>): string {
  return Object.entries(outputs)
    .map(([name, value]) => {
      const delimiter = `evalmark_${randomBytes(8).toString('hex')}`;
      return `${name}<<${delimiter}\n${value}\n${delimiter}\n`;
    })
    .join('');
}

/**
 * Appends the outputs to the outputs file.
 *
 * @param file - `GITHUB_OUTPUT`, when set.
 * @param outputs - The outputs.
 * @returns When they are written.
 */
export async function writeOutputs(file: string | undefined, outputs: Outputs): Promise<void> {
  if (!file) return;
  await appendFile(file, outputsText({ ...outputs }));
}

/**
 * Appends Markdown to the job summary.
 *
 * @param file - `GITHUB_STEP_SUMMARY`, when set.
 * @param markdown - The Markdown.
 * @returns When it is written.
 */
export async function writeSummary(file: string | undefined, markdown: string): Promise<void> {
  if (!file) return;
  await appendFile(file, `${markdown}\n`);
}
