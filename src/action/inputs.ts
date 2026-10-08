/**
 * The action's inputs, read from the `INPUT_<NAME>` variables GitHub sets, with the defaults of
 * `action.yml` when a variable is absent, so tests and the CLI get the same values as a workflow.
 */
import { type ImportFormat, importFormats } from '../import/import-results.ts';

/** Which transcripts a run keeps. */
export type TranscriptPolicy = 'failed' | 'all' | 'none';

/** Which trials keep their attachment files. */
export type AttachmentPolicy = 'failed' | 'all' | 'none';

/** How the branch's history is kept. */
export type HistoryPolicy = 'auto' | 'squash' | 'keep';

/** The action's inputs, parsed. */
export interface Inputs {
  /** The result file's path, when given. */
  readonly result: string | undefined;
  /** The result file's format, or `auto` to detect it. */
  readonly format: 'auto' | ImportFormat;
  /** `record` or `export`. */
  readonly mode: 'record' | 'export';
  /** The branch, or a full ref. */
  readonly branch: string;
  /** The folder the action owns on the branch. */
  readonly folder: string;
  /** The suite's name, when given. */
  readonly suite: string | undefined;
  /** Labels added over the result's own. */
  readonly labels: Readonly<Record<string, string>>;
  /** The token to push and comment with. */
  readonly token: string;
  /** How many runs to keep; `0` keeps every run. */
  readonly keepRuns: number;
  /** How many days of runs to keep; `0` keeps every day. */
  readonly keepDays: number;
  /** Which transcripts to keep. */
  readonly transcripts: TranscriptPolicy;
  /** How many of the newest runs keep their transcripts; `0` keeps them on every run. */
  readonly keepTranscripts: number;
  /** Which trials keep their attachment files. */
  readonly attachments: AttachmentPolicy;
  /** How many of the newest runs keep their attachment files; `0` keeps them on every run. */
  readonly keepAttachments: number;
  /** The folder's size, in megabytes, above which the action warns; `0` never warns. */
  readonly warnSizeMb: number;
  /** How the history is kept. */
  readonly history: HistoryPolicy;
  /** Whether to comment on a pull request. */
  readonly comment: boolean;
  /** Whether to write the badges. */
  readonly badges: boolean;
  /** The dashboard's title. */
  readonly title: string;
  /** The line under the dashboard's title. */
  readonly subtitle: string;
  /** The dashboard's logo file, when given. */
  readonly logo: string | undefined;
  /** The site's address, when given. */
  readonly siteUrl: string | undefined;
  /** Extra strings to redact. */
  readonly redact: readonly string[];
  /** Where `export` copies the folder, when given. */
  readonly path: string | undefined;
  /** Whether a failure fails the step. */
  readonly failOnError: boolean;
}

/** The defaults of `action.yml`, for the inputs that have one. */
const defaults: Readonly<Record<string, string>> = {
  format: 'auto',
  mode: 'record',
  branch: 'evalmark',
  folder: 'evalmark',
  'keep-runs': '500',
  'keep-days': '0',
  transcripts: 'failed',
  'keep-transcripts': '30',
  attachments: 'failed',
  'keep-attachments': '10',
  'warn-size-mb': '100',
  history: 'auto',
  comment: 'true',
  badges: 'true',
  title: 'evalmark',
  subtitle: 'eval dashboard',
  'fail-on-error': 'false',
};

/** The environment the action reads. */
export type Environment = Readonly<Record<string, string | undefined>>;

/**
 * One input's raw value, trimmed, or its default.
 *
 * @param env - The environment.
 * @param name - The input's name, as `action.yml` spells it.
 * @returns The value, or `''` when it has neither a value nor a default.
 */
export function rawInput(env: Environment, name: string): string {
  const key = `INPUT_${name.replaceAll(' ', '_').toUpperCase()}`;
  const value = env[key]?.trim() ?? '';
  return value === '' ? (defaults[name] ?? '') : value;
}

/**
 * An optional input.
 *
 * @param env - The environment.
 * @param name - The input's name.
 * @returns The value, or `undefined` when it is empty.
 */
function optionalInput(env: Environment, name: string): string | undefined {
  const value = rawInput(env, name);
  return value === '' ? undefined : value;
}

/**
 * A boolean input, as YAML spells booleans.
 *
 * @param env - The environment.
 * @param name - The input's name.
 * @returns The value.
 * @throws When the value is not a boolean.
 */
export function booleanInput(env: Environment, name: string): boolean {
  const value = rawInput(env, name);
  if (['true', 'True', 'TRUE'].includes(value)) return true;
  if (['false', 'False', 'FALSE', ''].includes(value)) return false;
  throw new Error(`The input \`${name}\` must be \`true\` or \`false\`, not \`${value}\`.`);
}

/**
 * A count input: a whole number, zero or more.
 *
 * @param env - The environment.
 * @param name - The input's name.
 * @returns The value.
 * @throws When the value is not a whole number.
 */
function countInput(env: Environment, name: string): number {
  const value = rawInput(env, name);
  if (!/^\d+$/.test(value)) {
    throw new Error(`The input \`${name}\` must be a whole number, not \`${value}\`.`);
  }
  return Number(value);
}

/**
 * An input that takes one of a few values.
 *
 * @param env - The environment.
 * @param name - The input's name.
 * @param choices - The values it takes.
 * @returns The value.
 * @throws When the value is not one of the choices.
 */
function choiceInput<Choice extends string>(
  env: Environment,
  name: string,
  choices: readonly Choice[],
): Choice {
  const value = rawInput(env, name);
  const choice = choices.find((entry) => entry === value);
  if (choice !== undefined) return choice;
  throw new Error(`The input \`${name}\` must be one of ${choices.join(', ')}, not \`${value}\`.`);
}

/**
 * The non-empty lines of a text.
 *
 * @param text - The text.
 * @returns Its lines, trimmed, empty ones left out.
 */
export function linesOf(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Parses labels written one `key=value` per line.
 *
 * @param lines - The lines.
 * @returns The labels.
 * @throws When a line has no `=` or an empty key.
 */
export function parseLabels(lines: readonly string[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const line of lines) {
    const separator = line.indexOf('=');
    const key = line.slice(0, Math.max(separator, 0)).trim();
    if (separator < 0 || key === '') {
      throw new Error(`A label must be written \`key=value\`, not \`${line}\`.`);
    }
    labels[key] = line.slice(separator + 1).trim();
  }
  return labels;
}

/**
 * Checks the folder is a plain relative path inside the branch, and normalizes it.
 *
 * @param folder - The folder, as given.
 * @returns The folder without leading `./` or trailing `/`.
 * @throws When it is absolute, the branch's root, or climbs out with `..`.
 */
export function checkFolder(folder: string): string {
  const normalized = folder.replace(/^(\.\/)+/, '').replace(/\/+$/, '');
  const parts = normalized.split('/');
  const unsafe = parts.some((part) => part === '' || part === '.' || part === '..');
  if (folder.startsWith('/') || unsafe) {
    throw new Error(`The input \`folder\` must be a folder inside the branch, not \`${folder}\`.`);
  }
  return normalized;
}

/**
 * Reads the inputs about how the run is shown: the comment, the badges, the dashboard's branding
 * and its address.
 *
 * @param env - The environment.
 * @returns Those inputs.
 * @throws When an input has a value it does not take.
 */
function presentationInputs(
  env: Environment,
): Pick<Inputs, 'comment' | 'badges' | 'title' | 'subtitle' | 'logo' | 'siteUrl'> {
  return {
    comment: booleanInput(env, 'comment'),
    badges: booleanInput(env, 'badges'),
    title: rawInput(env, 'title'),
    subtitle: rawInput(env, 'subtitle'),
    logo: optionalInput(env, 'logo'),
    siteUrl: optionalInput(env, 'site-url'),
  };
}

/**
 * Reads every input.
 *
 * @param env - The environment, such as `process.env`.
 * @returns The inputs.
 * @throws When an input has a value it does not take.
 */
export function readInputs(env: Environment): Inputs {
  return {
    result: optionalInput(env, 'result'),
    format: choiceInput(env, 'format', ['auto', ...importFormats]),
    mode: choiceInput(env, 'mode', ['record', 'export']),
    branch: rawInput(env, 'branch'),
    folder: checkFolder(rawInput(env, 'folder')),
    suite: optionalInput(env, 'suite'),
    labels: parseLabels(linesOf(rawInput(env, 'labels'))),
    token: optionalInput(env, 'token') ?? env.GITHUB_TOKEN ?? '',
    keepRuns: countInput(env, 'keep-runs'),
    keepDays: countInput(env, 'keep-days'),
    transcripts: choiceInput(env, 'transcripts', ['failed', 'all', 'none']),
    keepTranscripts: countInput(env, 'keep-transcripts'),
    attachments: choiceInput(env, 'attachments', ['failed', 'all', 'none']),
    keepAttachments: countInput(env, 'keep-attachments'),
    warnSizeMb: countInput(env, 'warn-size-mb'),
    history: choiceInput(env, 'history', ['auto', 'squash', 'keep']),
    ...presentationInputs(env),
    redact: linesOf(rawInput(env, 'redact')),
    path: optionalInput(env, 'path'),
    failOnError: booleanInput(env, 'fail-on-error'),
  };
}
