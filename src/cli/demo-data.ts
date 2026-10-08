/**
 * The demo's synthetic history: six weeks of eval runs of an agent that builds dashboards from a
 * chat. Most runs are on `main`, with one model; every fourth commit compares three models; two
 * pull requests run on their own branches. One commit breaks the SQL cases and a pull request
 * fixes them three commits later, and two cases are flaky throughout. The same seed always builds
 * the same history.
 */
import type { Case, CheckResult, Result, Trial } from '../format/result.ts';
import {
  commonChecks,
  type DemoCase,
  type DemoModel,
  demoCases,
  demoModels,
} from './demo-catalog.ts';
import { type Random, seededRandom } from './demo-random.ts';
import { screenshotPath } from './demo-screenshot.ts';
import { conversationOf, type DemoOutcome } from './demo-transcript.ts';

/** Where a demo run came from. */
export interface DemoRunSource {
  /** The commit's full SHA. */
  readonly commit: string;
  /** The branch the run tested. */
  readonly branch: string;
  /** The pull request's number, for a run on a pull request. */
  readonly pullRequest?: number;
}

/** One run of the demo history: the result file a harness would write, and where it came from. */
export interface DemoRun {
  /** The result file. */
  readonly result: Result;
  /** The commit and branch it ran on. */
  readonly source: DemoRunSource;
  /** When it was recorded, as an ISO 8601 time. */
  readonly recordedAt: string;
}

/** What the history is built from. */
export interface DemoOptions {
  /** The generator's seed. The default builds the same history every time. */
  readonly seed?: number;
  /** When the history ends. The default is a fixed time, so the output never changes. */
  readonly end?: Date;
}

/** A commit the history runs evals on. */
interface Commit {
  /** Where it came from. */
  readonly source: DemoRunSource;
  /** When its runs start, in milliseconds since the epoch. */
  readonly time: number;
  /** The index of the `main` commit whose cases it has. */
  readonly level: number;
  /** Whether it carries the regression of the SQL cases. */
  readonly regressed: boolean;
  /** The models it runs. */
  readonly models: readonly DemoModel[];
}

/** How many commits `main` gets over the history. */
const mainCommits = 24;
/** How long the history lasts. */
const historyMs = 42 * 24 * 3_600_000;
/** The `main` commits that carry the regression: from the first included to the last excluded. */
const regression = { from: 10, until: 13 } as const;
/** The pull requests: their branch, the cases they have, and where their commits fall. */
const pullRequests = [
  { number: 41, branch: 'feat/heatmap-panels', level: 6, positions: [3.4, 4.3, 4.7] },
  { number: 44, branch: 'fix/sql-dialects', level: 12, positions: [11.5, 12.5] },
] as const;
/** The errors a trial can end in. */
const trialErrors = [
  'The model call timed out after 60 s.',
  'The provider answered 429 Too Many Requests three times.',
  'The model returned a tool call with invalid JSON arguments.',
] as const;

/**
 * The model every commit runs, and the full list on comparison commits.
 *
 * @param index - The `main` commit's index.
 * @returns The models it runs.
 */
function modelsOf(index: number): readonly DemoModel[] {
  return index % 4 === 3 ? demoModels : demoModels.slice(0, 1);
}

/**
 * The commits of the history, in time order.
 *
 * @param random - The generator.
 * @param endMs - When the history ends, in milliseconds since the epoch.
 * @returns The commits.
 */
function commitsOf(random: Random, endMs: number): Commit[] {
  const spacing = historyMs / mainCommits;
  const timeOf = (position: number) =>
    endMs - historyMs + (position + 0.5) * spacing + random.integer(-3, 3) * 3_600_000;
  const main = Array.from({ length: mainCommits }, (_, index) => ({
    source: { commit: random.hex(40), branch: 'main' },
    time: timeOf(index),
    level: index,
    regressed: index >= regression.from && index < regression.until,
    models: modelsOf(index),
  }));
  const branches = pullRequests.flatMap((pull) =>
    pull.positions.map((position) => ({
      source: { commit: random.hex(40), branch: pull.branch, pullRequest: pull.number },
      time: timeOf(position),
      level: pull.level,
      regressed: false,
      models: demoModels.slice(0, 1),
    })),
  );
  return [...main, ...branches].sort((first, second) => first.time - second.time);
}

/**
 * The chance each trial of a case passes in one run. A flaky case's trials pass about half the
 * time. Any other case is either solved in that run, and its trials nearly always pass, or not, and
 * they nearly always fail; a better model solves more cases.
 *
 * @param random - The generator.
 * @param model - The model.
 * @param demoCase - The case.
 * @param regressed - Whether the commit carries the regression of the SQL cases.
 * @returns The probability, from 0 to 1.
 */
function passChance(
  random: Random,
  model: DemoModel,
  demoCase: DemoCase,
  regressed: boolean,
): number {
  if (demoCase.flaky) return 0.35 + model.skill * 0.3;
  const solves = Math.min(0.97, Math.max(0.03, model.skill + 0.3 - demoCase.difficulty));
  const broken = regressed && demoCase.source === 'pg';
  return random.chance(broken ? solves * 0.15 : solves) ? 0.96 : 0.06;
}

/**
 * The checks of a trial that did not error.
 *
 * @param random - The generator.
 * @param demoCase - The case.
 * @param passed - Whether the trial passed.
 * @returns One result per check the case declares.
 */
function checksOf(random: Random, demoCase: DemoCase, passed: boolean): CheckResult[] {
  const common: CheckResult[] = commonChecks.map(({ id }) => ({ id, pass: true }));
  if (passed) return [...common, { id: demoCase.check.id, pass: true }];
  const own = { id: demoCase.check.id, pass: false, message: demoCase.check.failure };
  if (!random.chance(0.25)) return [...common, own];
  const empty = { id: 'query-runs', pass: false, message: "A panel's query returned no rows." };
  return [...common.filter((check) => check.id !== 'query-runs'), empty, own];
}

/**
 * One trial of a case.
 *
 * @param random - The generator.
 * @param model - The model.
 * @param demoCase - The case.
 * @param chance - Its chance to pass.
 * @param startMs - When it starts, in milliseconds since the epoch.
 * @returns The trial.
 */
function trialOf(
  random: Random,
  model: DemoModel,
  demoCase: DemoCase,
  chance: number,
  startMs: number,
): Trial {
  const outcome: DemoOutcome = random.chance(0.012)
    ? 'error'
    : random.chance(chance)
      ? 'pass'
      : 'fail';
  const { transcript, usage, durationMs } = conversationOf(
    random,
    model,
    demoCase,
    outcome,
    startMs,
  );
  const base = { status: outcome, durationMs, usage, transcript };
  if (outcome === 'error') return { ...base, error: random.pick(trialErrors) };
  const checks = checksOf(random, demoCase, outcome === 'pass');
  const score =
    Math.round((checks.filter((check) => check.pass).length / checks.length) * 100) / 100;
  const output = `Built "${demoCase.title}" with one ${demoCase.panel} panel.`;
  const path = screenshotPath(demoCase.id, outcome === 'pass' ? 'right' : 'wrong', 'dashboard');
  const attachments = [
    { path, mediaType: 'image/png' as const, caption: 'The dashboard at the end' },
  ];
  return { ...base, score, checks, output, attachments };
}

/**
 * One case of a run, with three trials run side by side.
 *
 * @param random - The generator.
 * @param commit - The commit.
 * @param model - The model.
 * @param demoCase - The case.
 * @param startMs - When it starts, in milliseconds since the epoch.
 * @returns The case.
 */
function caseOf(
  random: Random,
  commit: Commit,
  model: DemoModel,
  demoCase: DemoCase,
  startMs: number,
): Case {
  const chance = passChance(random, model, demoCase, commit.regressed);
  const trials = Array.from({ length: 3 }, () =>
    trialOf(random, model, demoCase, chance, startMs + random.integer(0, 2000)),
  );
  const { id, title, input, tags, check } = demoCase;
  const checks = [...commonChecks, { id: check.id, description: check.description ?? check.id }];
  return { id, title, input, tags: [...tags], checks, trials };
}

/**
 * One run: a commit's result with one model, cases run one after the other.
 *
 * @param random - The generator.
 * @param commit - The commit.
 * @param model - The model.
 * @param startMs - When it starts, in milliseconds since the epoch.
 * @returns The run.
 */
function runOf(random: Random, commit: Commit, model: DemoModel, startMs: number): DemoRun {
  const cases: Case[] = [];
  let clock = startMs;
  for (const demoCase of demoCases.filter((entry) => (entry.since ?? 0) <= commit.level)) {
    const entry = caseOf(random, commit, model, demoCase, clock);
    cases.push(entry);
    clock += Math.max(...entry.trials.map((trial) => trial.durationMs ?? 0)) + 2000;
  }
  const result: Result = {
    version: 1,
    suite: 'dashboard-agent',
    startedAt: new Date(startMs).toISOString(),
    durationMs: clock - startMs,
    labels: { model: model.name, provider: model.provider },
    cases,
  };
  const recordedAt = new Date(clock + random.integer(10, 40) * 1000).toISOString();
  return { result, source: commit.source, recordedAt };
}

/**
 * A synthetic eval history, for the demo: about forty runs over six weeks, oldest first.
 *
 * @param options - The seed and the end of the history.
 * @returns The runs, in the order they were recorded.
 */
export function demoHistory(options: DemoOptions = {}): DemoRun[] {
  const random = seededRandom(options.seed ?? 20261008);
  const endMs = (options.end ?? new Date('2026-10-08T12:00:00Z')).getTime();
  const runs = commitsOf(random, endMs).flatMap((commit) =>
    commit.models.map((model, index) =>
      runOf(random, commit, model, commit.time + index * 240_000),
    ),
  );
  return runs.sort((first, second) => first.recordedAt.localeCompare(second.recordedAt));
}
