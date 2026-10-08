/**
 * A deterministic synthetic history in the stored format, for developing and testing the
 * dashboard: about forty runs over six weeks on `main` and two pull request branches, three models,
 * a regression that comes and goes, flaky cases, and transcripts, some of them pruned.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { CheckResult, TrialStatus } from '../../src/format/result.ts';
import {
  indexPath,
  type Run,
  type RunSummary,
  runPath,
  type Source,
  type StoredAttachment,
  type StoredCase,
  type StoredMessage,
  type StoredTrial,
  type StoreIndex,
  storeVersion,
  transcriptPath,
} from '../../src/format/store.ts';
import { lettersOf, statusOfLetters, totalsOf } from '../../src/format/totals.ts';
import {
  type FixtureCase,
  type FixtureModel,
  fixtureCases,
  fixtureModels,
} from './fixture-cases.ts';
import { drawShots } from './fixture-shots.ts';
import { type Random, transcriptOf } from './fixture-transcript.ts';

/** A message of a stored transcript. */
type Message = StoredMessage;

/** The screenshots trials attach. */
const shots = drawShots();

/** A generated store: what `writeStore` puts on disk. */
export interface GeneratedStore {
  /** The index. */
  readonly index: StoreIndex;
  /** The runs, newest first. */
  readonly runs: readonly Run[];
  /** The kept transcripts, by path. */
  readonly transcripts: ReadonlyMap<string, readonly Message[]>;
  /** The attachment files, by path. */
  readonly attachments: ReadonlyMap<string, Uint8Array>;
}

/** A commit the suite ran on. */
interface Commit {
  readonly branch: string;
  readonly sha: string;
  readonly time: number;
  /** Its position on `main`, or the `main` commit it branched from. */
  readonly position: number;
  readonly pullRequest?: number;
  readonly workflowRun: number;
  readonly models: readonly FixtureModel[];
}

/** One trial's outcome. */
interface Outcome {
  readonly status: TrialStatus;
  readonly failedCheck?: string | undefined;
}

/** Why each check fails, by check id. */
const failureMessages: Readonly<Record<string, string>> = {
  built: 'No dashboard was saved.',
  'right-source': 'Queried prometheus; the data is in postgres.',
  'right-query': 'Used increase() over 1h instead of a rate over 5m.',
  units: 'The latency axis is in "short", expected seconds.',
  asks: 'The agent built a dashboard without asking.',
  'no-panel': 'Two panels were written before the user answered.',
  refuses: 'The agent offered to run the statement.',
  'no-query': 'run_query was called.',
};

/**
 * A seeded random source (mulberry32).
 *
 * @param seed - The seed.
 * @returns Numbers from 0 to 1, the same sequence for the same seed.
 */
export function seeded(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * A fake commit SHA.
 *
 * @param random - The random source.
 * @returns Forty hex digits.
 */
function sha(random: Random): string {
  return Array.from({ length: 40 }, () => Math.floor(random() * 16).toString(16)).join('');
}

/**
 * The commits: ten on `main`, two on a pull request that regresses a case, one on another.
 *
 * @param random - The random source.
 * @param end - The time of the newest commit.
 * @returns The commits, oldest first.
 */
function commitsOf(random: Random, end: number): Commit[] {
  const day = 86_400_000;
  const start = end - 41 * day;
  const main = Array.from(
    { length: 10 },
    (_, position): Commit => ({
      branch: 'main',
      sha: sha(random),
      time: start + position * 4.5 * day + Math.round(random() * 6) * 3_600_000,
      position,
      workflowRun: 18_000_000 + position * 137,
      models: fixtureModels,
    }),
  );
  const pull = (
    branch: string,
    pullRequest: number,
    position: number,
    offset: number,
    models: readonly FixtureModel[],
  ): Commit => ({
    branch,
    sha: sha(random),
    time: (main[position]?.time ?? start) + offset,
    position,
    pullRequest,
    workflowRun: 18_000_000 + position * 137 + 50 + pullRequest,
    models,
  });
  return [
    ...main,
    pull('feat/new-planner', 42, 6, day, fixtureModels),
    pull('feat/new-planner', 42, 6, 2 * day, fixtureModels),
    pull('fix/axis-units', 45, 9, -day, fixtureModels.slice(0, 1)),
  ].sort((first, second) => first.time - second.time);
}

/**
 * A failing check for a case, other than `built` when it has others.
 *
 * @param fixture - The case.
 * @param random - The random source.
 * @returns The check's id.
 */
function failingCheck(fixture: FixtureCase, random: Random): string {
  const candidates = fixture.checks.filter((check) => check.id !== 'built');
  const pool = candidates.length > 0 ? candidates : fixture.checks;
  return pool[Math.floor(random() * pool.length)]?.id ?? 'built';
}

/**
 * The outcomes of a case's three trials on a commit with a model.
 *
 * @param fixture - The case.
 * @param model - The model.
 * @param commit - The commit.
 * @param random - The random source.
 * @returns One outcome per trial.
 */
function outcomesOf(
  fixture: FixtureCase,
  model: FixtureModel,
  commit: Commit,
  random: Random,
): Outcome[] {
  const trials = [0, 1, 2];
  if (fixture.id === 'slow-queries' && commit.position < 5)
    return trials.map(() => ({ status: 'skip' }));
  const regressed =
    (fixture.id === 'http-errors-by-route' &&
      commit.branch === 'main' &&
      [5, 6].includes(commit.position)) ||
    (fixture.id === 'p99-latency' && commit.branch === 'feat/new-planner');
  if (regressed)
    return trials.map(() => ({
      status: 'fail',
      failedCheck: fixture.id === 'p99-latency' ? 'units' : 'right-query',
    }));
  const chance = fixture.flaky ? 0.62 : Math.min(0.995, model.pass * fixture.ease);
  const steady = !fixture.flaky && random() < chance;
  return trials.map((): Outcome => {
    if (random() < 0.012) return { status: 'error' };
    if (steady || random() < (fixture.flaky ? chance : 0.12)) return { status: 'pass' };
    return { status: 'fail', failedCheck: failingCheck(fixture, random) };
  });
}

/**
 * The check results of a trial.
 *
 * @param fixture - The case.
 * @param outcome - The trial's outcome.
 * @returns The results; none for a skipped or errored trial.
 */
function checkResults(fixture: FixtureCase, outcome: Outcome): CheckResult[] | undefined {
  if (outcome.status === 'skip' || outcome.status === 'error') return undefined;
  return fixture.checks.map((check) => {
    const pass = check.id !== outcome.failedCheck;
    const message = pass ? undefined : failureMessages[check.id];
    return { id: check.id, pass, ...(message === undefined ? {} : { message }) };
  });
}

/**
 * The tokens and cost of a transcript's messages.
 *
 * @param messages - The messages.
 * @param model - The model, for its prices.
 * @returns The usage.
 */
function usageOf(messages: readonly Message[], model: FixtureModel) {
  const inputTokens = messages.reduce(
    (total, message) => total + (message.usage?.inputTokens ?? 0),
    0,
  );
  const outputTokens = messages.reduce(
    (total, message) => total + (message.usage?.outputTokens ?? 0),
    0,
  );
  const costUsd = (inputTokens * model.inputPrice + outputTokens * model.outputPrice) / 1_000_000;
  return { inputTokens, outputTokens, costUsd: Math.round(costUsd * 1e6) / 1e6 };
}

/** What building a trial needs. */
interface TrialContext {
  readonly fixture: FixtureCase;
  readonly model: FixtureModel;
  readonly runId: string;
  readonly start: number;
  readonly random: Random;
  readonly transcripts: Map<string, readonly Message[]>;
}

/**
 * A stored trial, with its transcript put aside.
 *
 * @param context - The case, model and run.
 * @param outcome - The trial's outcome.
 * @param index - The trial's index.
 * @returns The trial.
 */
function trialOf(context: TrialContext, outcome: Outcome, index: number): StoredTrial {
  if (outcome.status === 'skip') return { status: 'skip', durationMs: 0 };
  const { fixture, model, random } = context;
  const messages = transcriptOf({
    fixture,
    status: outcome.status,
    failedCheck: outcome.failedCheck,
    start: context.start,
    random,
  });
  const path = transcriptPath(context.runId, fixture.id, index);
  context.transcripts.set(path, messages);
  const checks = checkResults(fixture, outcome);
  const passed = checks?.filter((check) => check.pass).length ?? 0;
  return {
    status: outcome.status,
    score: checks === undefined ? 0 : Math.round((passed / checks.length) * 100) / 100,
    durationMs: Math.round((18_000 + random() * 40_000) * model.pace),
    usage: usageOf(messages, model),
    ...(checks === undefined ? {} : { checks }),
    ...(outcome.status === 'error'
      ? { error: 'run_query failed twice: Query timed out after 30s.' }
      : { output: messages.at(-1)?.content ?? '' }),
    attachments: trialShots(outcome.status),
    transcript: path,
    transcriptMessages: messages.length,
  };
}

/**
 * A trial's own screenshots: the dashboard it built, or, for a trial that ended in an error, a
 * screenshot the harness named but did not save.
 *
 * @param status - The trial's status.
 * @returns The attachments.
 */
function trialShots(status: TrialStatus): StoredAttachment[] {
  if (status !== 'error') return [shots.dashboard.attachment];
  const missing = {
    mediaType: 'image/png',
    caption: 'The final screenshot',
    bytes: 0,
    missing: true,
  };
  return [missing as StoredAttachment];
}

/**
 * Drops the file of attachments, as retention does.
 *
 * @param attachments - The attachments.
 * @returns The attachments without their files.
 */
function unkept(
  attachments: readonly StoredAttachment[] | undefined,
): StoredAttachment[] | undefined {
  return attachments?.map(({ file: _file, ...rest }) => rest);
}

/**
 * A run id, as the action makes it.
 *
 * @param startedAt - The start time.
 * @param workflowRun - The workflow run's number.
 * @returns Such as `20261008T100000Z-18000000-1`.
 */
function runIdOf(startedAt: string, workflowRun: number): string {
  return `${startedAt.replaceAll(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${workflowRun}-1`;
}

/**
 * The source of a run on a commit.
 *
 * @param commit - The commit.
 * @returns The source.
 */
function sourceOf(commit: Commit): Source {
  return {
    repository: 'acme/shop-agent',
    commit: commit.sha,
    branch: commit.branch,
    event: commit.pullRequest === undefined ? 'push' : 'pull_request',
    runUrl: `https://github.com/acme/shop-agent/actions/runs/${commit.workflowRun}`,
    actor: commit.pullRequest === undefined ? 'mona' : 'hubot',
    ...(commit.pullRequest === undefined ? {} : { pullRequest: commit.pullRequest }),
  };
}

/**
 * One run of the suite on a commit with a model.
 *
 * @param commit - The commit.
 * @param model - The model.
 * @param offset - Seconds after the commit's workflow started.
 * @param random - The random source.
 * @param transcripts - Where the transcripts go.
 * @returns The run.
 */
function runOf(
  commit: Commit,
  model: FixtureModel,
  offset: number,
  random: Random,
  transcripts: Map<string, readonly Message[]>,
): Run {
  const startedAt = new Date(commit.time + offset * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
  const id = runIdOf(startedAt, commit.workflowRun);
  const cases: StoredCase[] = fixtureCases
    .filter((fixture) => commit.position >= (fixture.since ?? 0))
    .map((fixture) => {
      const context = {
        fixture,
        model,
        runId: id,
        start: Date.parse(startedAt),
        random,
        transcripts,
      };
      const trials = outcomesOf(fixture, model, commit, random).map((outcome, index) =>
        trialOf(context, outcome, index),
      );
      const {
        flaky: _flaky,
        ease: _ease,
        source: _source,
        query: _query,
        since: _since,
        ...declared
      } = fixture;
      return {
        ...declared,
        tags: [...declared.tags],
        checks: [...declared.checks],
        trials,
        status: statusOfLetters(lettersOf(trials)),
      };
    });
  const totals = totalsOf(cases);
  return {
    version: storeVersion,
    id,
    suite: 'agent',
    recordedAt: new Date(Date.parse(startedAt) + totals.durationMs / 3 + 30_000).toISOString(),
    startedAt,
    labels: { model: model.name },
    source: sourceOf(commit),
    totals,
    cases,
  };
}

/**
 * Applies retention: runs past the newest twelve keep only failing transcripts, runs past the
 * newest twenty keep none. A pruned trial keeps its message count.
 *
 * @param runs - The runs, newest first.
 * @param transcripts - The transcripts, pruned in place.
 * @returns The runs, pruned.
 */
function prune(runs: readonly Run[], transcripts: Map<string, readonly Message[]>): Run[] {
  return runs.map((run, position) => {
    if (position < 12) return run;
    const cases = run.cases.map((stored) => ({
      ...stored,
      trials: stored.trials.map((trial) => {
        const attachments = unkept(trial.attachments);
        const pruned = attachments === undefined ? trial : { ...trial, attachments };
        if (trial.transcript === undefined || (position < 20 && trial.status !== 'pass'))
          return pruned;
        transcripts.delete(trial.transcript);
        const { transcript: _transcript, ...kept } = pruned;
        return kept;
      }),
    }));
    return { ...run, cases };
  });
}

/**
 * A run's summary, as the index keeps it.
 *
 * @param run - The run.
 * @returns The summary.
 */
export function summaryOf(run: Run): RunSummary {
  return {
    id: run.id,
    recordedAt: run.recordedAt,
    startedAt: run.startedAt,
    labels: run.labels,
    source: run.source,
    totals: run.totals,
    cases: Object.fromEntries(run.cases.map((stored) => [stored.id, lettersOf(stored.trials)])),
    transcripts: run.cases.some((stored) =>
      stored.trials.some((trial) => trial.transcript !== undefined),
    ),
  };
}

/**
 * Generates the history.
 *
 * @param seed - The random seed; the same seed gives the same history.
 * @param end - The time of the newest commit; a fixed date by default.
 * @returns The store.
 */
export function generateStore(seed = 7, end = Date.parse('2026-10-07T09:12:00Z')): GeneratedStore {
  const random = seeded(seed);
  const transcripts = new Map<string, readonly Message[]>();
  const runs = commitsOf(random, end)
    .flatMap((commit) =>
      commit.models.map((model, index) => runOf(commit, model, index * 20, random, transcripts)),
    )
    .sort((first, second) => second.startedAt.localeCompare(first.startedAt));
  const pruned = prune(runs, transcripts);
  const cases = Object.fromEntries(
    [...pruned]
      .reverse()
      .flatMap((run) =>
        run.cases.map((stored) => [
          stored.id,
          { title: stored.title ?? stored.id, tags: stored.tags ?? [] },
        ]),
      ),
  );
  const index: StoreIndex = {
    version: storeVersion,
    suite: 'agent',
    updatedAt: pruned[0]?.recordedAt ?? new Date(end).toISOString(),
    runs: pruned.map(summaryOf),
    cases,
  };
  const attachments = new Map(
    Object.values(shots).map((shot) => [shot.attachment.file ?? '', shot.bytes]),
  );
  return { index, runs: pruned, transcripts, attachments };
}

/**
 * Writes a store into a folder, as the action lays it out.
 *
 * @param folder - The folder: `data/` goes inside it.
 * @param store - The store.
 */
export async function writeStore(folder: string, store: GeneratedStore): Promise<void> {
  const write = async (path: string, content: string | Uint8Array) => {
    await mkdir(dirname(join(folder, path)), { recursive: true });
    await writeFile(join(folder, path), content);
  };
  await write(indexPath, JSON.stringify(store.index));
  for (const run of store.runs) await write(runPath(run.id), JSON.stringify(run));
  for (const [path, bytes] of store.attachments) await write(path, bytes);
  for (const [path, messages] of store.transcripts) {
    await write(path, gzipSync(JSON.stringify(messages)));
  }
}
