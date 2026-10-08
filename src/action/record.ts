/**
 * Record mode: read the result, publish the run on the branch, compare it with its baseline, and
 * report through the pull request comment, the job summary and the outputs.
 */
import { dirname } from 'node:path';
import { baselineOf, diffRuns } from '../format/compare.ts';
import type { Result } from '../format/result.ts';
import type { RunSummary, StoreIndex } from '../format/store.ts';
import { loadAttachments } from './attachment-files.ts';
import type { RunDraft } from './build-run.ts';
import { remoteOf } from './git.ts';
import type { Environment, Inputs } from './inputs.ts';
import type { Logger } from './log.ts';
import { type Outputs, writeOutputs, writeSummary } from './outputs.ts';
import { publish } from './publish.ts';
import { upsertComment } from './pull-request.ts';
import { createRedactor } from './redact.ts';
import { markerOf, type ReportInput, reportMarkdown, siteLink } from './report.ts';
import { readResults } from './result-file.ts';
import { type SizeReport, sizeLine, sizeWarning } from './size.ts';
import { type EventContext, readEvent, runIdOf, sourceOf } from './source.ts';
import { recordedSummary, type StoreOptions, type StoreOutcome, storeRun } from './store.ts';

/** What a mode runs with. */
export interface ModeContext {
  /** The inputs. */
  readonly inputs: Inputs;
  /** The environment. */
  readonly env: Environment;
  /** The log. */
  readonly log: Logger;
  /** The built dashboard's folder. */
  readonly siteDir: string;
  /** The current time. */
  readonly now: Date;
}

/**
 * A variable the action cannot run without.
 *
 * @param env - The environment.
 * @param name - The variable's name.
 * @returns Its value.
 * @throws When it is not set.
 */
export function required(env: Environment, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is not set: the action runs in a GitHub workflow.`);
  return value;
}

/**
 * Makes a run's draft from a result.
 *
 * @param context - The mode's context.
 * @param result - The result, labelled and redacted.
 * @param resultPath - The result file, whose folder holds the attachments.
 * @returns The draft.
 */
async function draftOf(
  context: ModeContext,
  result: Result,
  resultPath: string,
): Promise<RunDraft> {
  const { inputs, env, now } = context;
  const loaded = await loadAttachments(result, dirname(resultPath));
  if (loaded.missing.length > 0) context.log.warning(missingText(loaded.missing));
  const repositoryName = env.GITHUB_REPOSITORY?.split('/')[1];
  return {
    result,
    id: runIdOf(result.startedAt ?? now.toISOString(), env),
    suite: inputs.suite ?? result.suite ?? repositoryName ?? 'evals',
    source: sourceOf(env, readEvent(env)),
    recordedAt: now.toISOString(),
    transcripts: inputs.transcripts,
    attachments: inputs.attachments,
    attachmentFiles: loaded.files,
  };
}

/**
 * The warning about attachment files the result names but that are not there.
 *
 * @param paths - Their paths.
 * @returns The warning, naming the first ten.
 */
export function missingText(paths: readonly string[]): string {
  const named = paths.slice(0, 10).join(', ');
  const more = paths.length > 10 ? ` and ${paths.length - 10} more` : '';
  return `The result names ${paths.length} attachment file(s) that are not there, recorded without their file: ${named}${more}.`;
}

/**
 * The report's input: the run compared with the newest earlier run on the pull request's base
 * branch, or on its own branch outside a pull request.
 *
 * @param context - The mode's context.
 * @param index - The index after recording.
 * @param head - The recorded run.
 * @param event - The event's context.
 * @returns The report's input.
 */
function reportOf(
  context: ModeContext,
  index: StoreIndex,
  head: RunSummary,
  event: EventContext,
): ReportInput {
  const baseBranch = event.pullRequest === undefined ? head.source.branch : event.baseBranch;
  const base = baseBranch === undefined ? undefined : baselineOf(index.runs, head, baseBranch);
  return {
    suite: index.suite,
    head,
    diff: base === undefined ? undefined : diffRuns(base, head),
    baseBranch,
    siteUrl: context.inputs.siteUrl,
  };
}

/**
 * Comments on the pull request; a failure is a warning.
 *
 * @param context - The mode's context.
 * @param pullRequest - The pull request's number.
 * @param report - The report's input.
 * @returns When it is done.
 */
async function comment(
  context: ModeContext,
  pullRequest: number,
  report: ReportInput,
): Promise<void> {
  const { env, inputs, log } = context;
  const target = {
    apiUrl: env.GITHUB_API_URL || 'https://api.github.com',
    repository: required(env, 'GITHUB_REPOSITORY'),
    pullRequest,
    token: inputs.token,
  };
  try {
    const done = await upsertComment(
      target,
      markerOf(report.suite, report.head.labels),
      reportMarkdown(report),
    );
    log.info(`The pull request comment was ${done}.`);
  } catch (error) {
    log.warning(`The pull request comment failed: ${errorMessage(error)}`);
  }
}

/**
 * An error's message.
 *
 * @param error - Anything thrown.
 * @returns Its message.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Records the runs of the result file: one, or one per model for a file another tool wrote.
 *
 * @param context - The mode's context.
 * @returns When every run is recorded and reported.
 * @throws When the result is missing or invalid, or a run could not be pushed.
 */
export async function record(context: ModeContext): Promise<void> {
  const { inputs } = context;
  if (!inputs.result) throw new Error('The input `result` is required to record a run.');
  const redact = createRedactor([...inputs.redact, inputs.token]);
  const results = await readResults(inputs.result, inputs.format, inputs.labels, redact);
  if (results.length > 1) context.log.info(`The file holds ${results.length} runs, one per model.`);
  for (const result of results) {
    await recordOne(context, await draftOf(context, result, inputs.result));
  }
}

/**
 * Records one run: publishes it on the branch and reports it.
 *
 * @param context - The mode's context.
 * @param draft - The run's draft.
 * @returns When it is recorded and reported.
 * @throws When the run could not be pushed.
 */
async function recordOne(context: ModeContext, draft: RunDraft): Promise<void> {
  const { inputs, env, log } = context;
  const event = readEvent(env);
  const remote = remoteOf(
    required(env, 'GITHUB_SERVER_URL'),
    required(env, 'GITHUB_REPOSITORY'),
    inputs.branch,
    inputs.token,
  );
  log.group(`Recording run ${draft.id}`);
  const published = await publish({
    remote,
    folder: inputs.folder,
    history: inputs.history,
    push: !event.fork,
    record: (folder) => storeRun(folder, draft, { ...inputs, ...storeSettings(context, event) }),
    log,
  }).finally(log.endGroup);
  if (event.fork) log.info('The pull request comes from a fork: the run is compared, not pushed.');
  await report(context, event, published.outcome, published.pushed);
}

/**
 * The store's settings besides retention.
 *
 * @param context - The mode's context.
 * @param event - The event's context.
 * @returns The settings.
 */
function storeSettings(
  context: ModeContext,
  event: EventContext,
): Pick<StoreOptions, 'defaultBranch' | 'siteDir' | 'now' | 'branding'> {
  const { title, subtitle, logo } = context.inputs;
  return {
    branding: { title, subtitle, logo },
    defaultBranch: event.defaultBranch,
    siteDir: context.siteDir,
    now: context.now,
  };
}

/**
 * Reports a recorded run: the comment, the size warning, the summary and the outputs.
 *
 * @param context - The mode's context.
 * @param event - The event's context.
 * @param outcome - What recording did.
 * @param pushed - Whether it was pushed.
 * @returns When it is reported.
 */
async function report(
  context: ModeContext,
  event: EventContext,
  outcome: StoreOutcome,
  pushed: boolean,
): Promise<void> {
  const { inputs, env, log } = context;
  const head = recordedSummary(outcome);
  const input = reportOf(context, outcome.index, head, event);
  if (event.pullRequest !== undefined && inputs.comment) {
    await comment(context, event.pullRequest, input);
  }
  const size = sizeReportOf(outcome, inputs.folder, inputs.warnSizeMb);
  const warning = sizeWarning(size);
  if (warning !== undefined) log.warning(warning);
  await writeSummary(env.GITHUB_STEP_SUMMARY, `${reportMarkdown(input)}\n${sizeLine(size)}`);
  await writeOutputs(env.GITHUB_OUTPUT, outputsOf(context, head, pushed, outcome.folderBytes));
  log.info(`Recorded run ${head.id}${pushed ? '' : ' (not pushed)'}.`);
}

/**
 * The step's outputs for a recorded run.
 *
 * @param context - The mode's context.
 * @param head - The recorded run.
 * @param pushed - Whether it was pushed.
 * @param folderBytes - The folder's size after recording.
 * @returns The outputs.
 */
function outputsOf(
  context: ModeContext,
  head: RunSummary,
  pushed: boolean,
  folderBytes: number,
): Outputs {
  const { siteUrl } = context.inputs;
  const passRate = head.totals.passRate;
  return {
    'run-id': head.id,
    'pass-rate': passRate === null ? '' : String(passRate),
    recorded: String(pushed),
    'run-url': siteUrl ? siteLink(siteUrl, `#/runs/${head.id}`) : '',
    'evalmark-size': String(folderBytes),
  };
}

/**
 * The size report of a recording.
 *
 * @param outcome - What recording did.
 * @param folder - The folder, as the inputs name it.
 * @param warnSizeMb - The size in megabytes above which the action warns.
 * @returns The report.
 */
export function sizeReportOf(
  outcome: StoreOutcome,
  folder: string,
  warnSizeMb: number,
): SizeReport {
  const { folderBytes, addedBytes, retention } = outcome;
  return { folder, folderBytes, addedBytes, warnSizeMb, pruned: retention };
}
