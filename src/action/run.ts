/**
 * The action: reads the inputs, runs the mode, and turns any failure into a warning, or into an
 * error that fails the step when `fail-on-error` is set.
 */
import { exportFolder } from './export.ts';
import { remoteOf } from './git.ts';
import { booleanInput, type Environment, readInputs } from './inputs.ts';
import { createLogger, type Logger, type Write, writeToStdout } from './log.ts';
import { writeOutputs } from './outputs.ts';
import { errorMessage, type ModeContext, record, required } from './record.ts';
import { defaultSiteDir } from './site.ts';

/** What the action runs with; each part defaults to the real one. */
export interface RunOptions {
  /** The environment; `process.env` by default. */
  readonly env?: Environment;
  /** Where the log goes; standard output by default. */
  readonly write?: Write;
  /** The built dashboard's folder; the one next to the bundle by default. */
  readonly siteDir?: string;
  /** The current time; now by default. */
  readonly now?: Date;
}

/**
 * Export mode.
 *
 * @param context - The mode's context.
 * @returns When the folder is copied, or found missing.
 * @throws When `path` is not set or git fails.
 */
async function exportMode(context: ModeContext): Promise<void> {
  const { inputs, env, log } = context;
  if (!inputs.path) throw new Error('The input `path` is required to export.');
  const remote = remoteOf(
    required(env, 'GITHUB_SERVER_URL'),
    required(env, 'GITHUB_REPOSITORY'),
    inputs.branch,
    inputs.token,
  );
  const copied = await exportFolder(remote, inputs.folder, inputs.path);
  if (copied) log.info(`Exported ${inputs.folder} from ${remote.ref} into ${inputs.path}.`);
  else log.warning(`Nothing to export: ${remote.ref} has no ${inputs.folder} folder yet.`);
}

/**
 * Reports a failure: a warning, or an error when the step fails on errors.
 *
 * @param log - The log.
 * @param env - The environment.
 * @param error - What was thrown.
 * @returns The exit code: 1 when the step fails, 0 otherwise.
 */
async function fail(log: Logger, env: Environment, error: unknown): Promise<number> {
  let failOnError = false;
  try {
    failOnError = booleanInput(env, 'fail-on-error');
  } catch {
    // An invalid value is reported by the inputs; the step does not fail on it.
  }
  const message = `evalmark did not record the run: ${errorMessage(error)}`;
  await writeOutputs(env.GITHUB_OUTPUT, {
    'run-id': '',
    'pass-rate': '',
    recorded: 'false',
    'run-url': '',
    'evalmark-size': '',
  }).catch(() => undefined);
  if (!failOnError) log.warning(message);
  else log.error(message);
  return failOnError ? 1 : 0;
}

/**
 * Runs the action.
 *
 * @param options - The environment, the log, the dashboard and the time.
 * @returns The exit code.
 */
export async function run(options: RunOptions = {}): Promise<number> {
  const env = options.env ?? process.env;
  const log = createLogger(options.write ?? writeToStdout);
  try {
    const inputs = readInputs(env);
    log.mask(inputs.token);
    const now = options.now ?? new Date();
    const context = { inputs, env, log, siteDir: options.siteDir ?? defaultSiteDir(), now };
    await (inputs.mode === 'export' ? exportMode(context) : record(context));
    return 0;
  } catch (error) {
    return fail(log, env, error);
  }
}
