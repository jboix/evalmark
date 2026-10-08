import { describe, expect, test } from 'vitest';
import { resultSchema } from '../format/result.ts';
import { lettersOf, statusOfLetters, totalsOf } from '../format/totals.ts';
import { demoHistory } from './demo-data.ts';

const history = demoHistory();

/** The pass rate of the main runs with the default model, by run. */
function mainPassRates() {
  return history
    .filter(
      (run) => run.source.branch === 'main' && run.result.labels?.model === 'gemini-3.8-flash',
    )
    .map((run) => totalsOf(run.result.cases).passRate ?? 0);
}

describe('demoHistory', () => {
  test('every result validates against the result format', () => {
    for (const run of history) {
      const parsed = resultSchema.safeParse(run.result);
      expect(parsed.error).toBeUndefined();
    }
  });

  test('is the same for the same seed and differs for another', () => {
    expect(JSON.stringify(demoHistory())).toBe(JSON.stringify(history));
    expect(JSON.stringify(demoHistory({ seed: 7 }))).not.toBe(JSON.stringify(history));
  });

  test('has about forty runs over six weeks, in time order', () => {
    expect(history.length).toBeGreaterThanOrEqual(35);
    expect(history.length).toBeLessThanOrEqual(50);
    const times = history.map((run) => run.recordedAt);
    expect(times).toEqual([...times].sort());
    const first = Date.parse(times[0] ?? '');
    const last = Date.parse(times.at(-1) ?? '');
    expect((last - first) / 86_400_000).toBeGreaterThan(35);
    expect(last).toBeLessThanOrEqual(Date.parse('2026-10-08T12:00:00Z') + 3_600_000);
  });

  test('ends at the time it is given', () => {
    const end = new Date('2027-01-01T00:00:00Z');
    const last = demoHistory({ end }).at(-1);
    expect(Math.abs(Date.parse(last?.recordedAt ?? '') - end.getTime())).toBeLessThan(86_400_000);
  });

  test('runs mostly on main, and on two pull requests', () => {
    const branches = new Set(history.map((run) => run.source.branch));
    expect([...branches].sort()).toEqual(['feat/heatmap-panels', 'fix/sql-dialects', 'main']);
    const onMain = history.filter((run) => run.source.branch === 'main').length;
    expect(onMain / history.length).toBeGreaterThan(0.8);
    const pulls = history.filter((run) => run.source.pullRequest !== undefined);
    expect(pulls.every((run) => run.source.branch !== 'main')).toBe(true);
  });

  test('compares three models, with about twelve cases of three trials', () => {
    const models = new Set(history.map((run) => run.result.labels?.model));
    expect(models.size).toBe(3);
    const latest = history.at(-1)?.result;
    expect(latest?.cases.length).toBe(12);
    expect(latest?.cases.every((entry) => entry.trials.length === 3)).toBe(true);
    expect(latest?.labels?.provider).toBeTypeOf('string');
  });

  test('has a regression on main that is fixed a few commits later', () => {
    const rates = mainPassRates();
    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(average(rates.slice(10, 13))).toBeLessThan(average(rates.slice(4, 10)) - 0.1);
    expect(average(rates.slice(13))).toBeGreaterThan(average(rates.slice(10, 13)) + 0.1);
  });

  test('has chronically flaky cases', () => {
    const flaky = history.flatMap((run) =>
      run.result.cases.filter((entry) => statusOfLetters(lettersOf(entry.trials)) === 'flaky'),
    );
    const ids = new Set(flaky.map((entry) => entry.id));
    expect(ids.has('error-logs-by-service')).toBe(true);
    expect(ids.has('top-customers')).toBe(true);
  });

  test('has tool calls that error, and trials that error', () => {
    const trials = history.flatMap((run) => run.result.cases.flatMap((entry) => entry.trials));
    expect(trials.some((trial) => trial.status === 'error' && trial.error)).toBe(true);
    const calls = trials.flatMap(
      (trial) => trial.transcript?.flatMap((message) => message.toolCalls ?? []) ?? [],
    );
    expect(calls.some((call) => call.error !== undefined)).toBe(true);
    const names = new Set(calls.map((call) => call.name));
    expect([...names].sort()).toEqual([
      'describe_source',
      'list_sources',
      'propose_plan',
      'run_query',
      'write_panel',
    ]);
    const failed = trials.flatMap((trial) => trial.checks ?? []).filter((check) => !check.pass);
    expect(failed.every((check) => check.message)).toBe(true);
  });
});
