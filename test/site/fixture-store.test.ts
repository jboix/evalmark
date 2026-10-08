import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { indexPath, runPath } from '../../src/format/store.ts';
import { lettersOf, totalsOf } from '../../src/format/totals.ts';
import { generateStore, writeStore } from './fixture-store.ts';

describe('the synthetic history', () => {
  const store = generateStore();

  test('is the same for the same seed', () => {
    expect(JSON.stringify(generateStore().index)).toBe(JSON.stringify(store.index));
  });

  test('has an index that matches its runs, newest first', () => {
    expect(store.index.runs.map((run) => run.id)).toEqual(store.runs.map((run) => run.id));
    for (const run of store.runs) {
      const entry = store.index.runs.find((summary) => summary.id === run.id);
      expect(entry?.totals).toEqual(totalsOf(run.cases));
      expect(entry?.cases).toEqual(
        Object.fromEntries(run.cases.map((stored) => [stored.id, lettersOf(stored.trials)])),
      );
    }
    const starts = store.index.runs.map((run) => run.startedAt);
    expect([...starts].sort().reverse()).toEqual(starts);
  });

  test('has branches, models, flaky cases, errors and pruned transcripts', () => {
    const branches = new Set(store.runs.map((run) => run.source.branch));
    expect([...branches].sort()).toEqual(['feat/new-planner', 'fix/axis-units', 'main']);
    expect(new Set(store.runs.map((run) => run.labels.model)).size).toBe(3);
    const trials = store.runs.flatMap((run) => run.cases.flatMap((stored) => stored.trials));
    expect(trials.some((trial) => trial.status === 'error')).toBe(true);
    expect(
      trials.some(
        (trial) => trial.transcript === undefined && trial.transcriptMessages !== undefined,
      ),
    ).toBe(true);
    for (const trial of trials) {
      if (trial.transcript !== undefined)
        expect(store.transcripts.has(trial.transcript)).toBe(true);
    }
  });

  test('is written as the stored format lays it out', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'evalmark-fixture-'));
    try {
      await writeStore(folder, store);
      const index = JSON.parse(await readFile(join(folder, indexPath), 'utf8'));
      expect(index.runs).toHaveLength(store.runs.length);
      const first = store.runs[0];
      expect(JSON.parse(await readFile(join(folder, runPath(first?.id ?? '')), 'utf8')).id).toBe(
        first?.id,
      );
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
});

describe('the synthetic screenshots', () => {
  test('are small PNG files, kept on new runs and pruned on old ones', () => {
    const store = generateStore();
    for (const bytes of store.attachments.values()) {
      expect([...bytes.slice(1, 4)]).toEqual([80, 78, 71]);
      expect(bytes.length).toBeLessThan(20_000);
    }
    const kept = store.runs[0]?.cases[0]?.trials[0]?.attachments?.[0];
    expect(kept?.file === undefined ? undefined : store.attachments.has(kept.file)).toBe(true);
    const old = store.runs.at(-1)?.cases[0]?.trials.find((trial) => trial.status === 'pass');
    expect(old?.attachments?.[0]?.file).toBeUndefined();
  });
});
