import { copyFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { StoreIndex } from '../../src/format/store.ts';
import { cloneRef, commitsOf, runAction, type Sandbox, sandbox } from './helpers.ts';

/** The promptfoo output the importer tests read. */
const promptfooFixture = join(
  dirname(fileURLToPath(import.meta.url)),
  '../import/fixtures/promptfoo-results.json',
);

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
});

afterEach(() => {
  box.cleanup();
});

describe('recording another tool’s output', () => {
  test('a promptfoo file with two providers records one run per model', async () => {
    const file = join(box.root, 'results.json');
    copyFileSync(promptfooFixture, file);
    const outcome = await runAction(box, { result: file });
    expect(outcome.code).toBe(0);
    expect(outcome.log).not.toContain('::warning::');
    expect(commitsOf(box)).toHaveLength(2);
    const clone = cloneRef(box);
    const index: StoreIndex = JSON.parse(
      readFileSync(join(clone, 'evalmark/data/index.json'), 'utf8'),
    );
    const models = index.runs.map((run) => run.labels.model).sort();
    expect(models).toEqual(['gpt-5-mini', 'sonnet']);
    expect(new Set(index.runs.map((run) => run.id)).size).toBe(2);
  });

  test('a format given that does not match the file is a warning', async () => {
    const file = join(box.root, 'results.json');
    copyFileSync(promptfooFixture, file);
    const outcome = await runAction(box, { result: file, format: 'junit' });
    expect(outcome.code).toBe(0);
    expect(outcome.log).toContain('::warning::');
    expect(outcome.outputs.recorded).toBe('false');
  });
});
