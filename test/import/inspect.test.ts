import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { type Result, resultSchema } from '../../src/format/result.ts';
import { importResults } from '../../src/import/import-results.ts';
import { checksOfScores, numberOfValue } from '../../src/import/inspect-scores.ts';
import { writeZip } from './zip-writer.ts';

const path = 'test/import/fixtures/inspect-log.json';
const directory = mkdtempSync(join(tmpdir(), 'evalmark-inspect-'));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

/**
 * Writes the JSON fixture as a `.eval` archive: the header without samples, and one file per
 * sample and epoch, compressed in turn with Zstandard, deflate and nothing.
 *
 * @returns The archive's path.
 */
function evalArchive(): string {
  const { samples, ...header } = JSON.parse(readFileSync(path, 'utf8')) as {
    samples: { id: string | number; epoch: number }[];
  };
  const methods = [93, 8, 0] as const;
  const archive = writeZip(
    [
      { name: '_journal/start.json', content: JSON.stringify({ version: 2, eval: {}, plan: {} }) },
      ...samples.map((sample, index) => ({
        name: `samples/${sample.id}_epoch_${sample.epoch}.json`,
        content: JSON.stringify(sample),
        method: methods[index % 3],
      })),
      { name: 'summaries.json', content: '[]' },
      { name: 'header.json', content: JSON.stringify(header), method: 93 as const },
    ],
    'written by the test',
  );
  const file = join(directory, 'weather.eval');
  writeFileSync(file, archive);
  return file;
}

/**
 * Checks the conversion of the fixture, from either format.
 *
 * @param result - The converted result.
 */
function expectFixture(result: Result | undefined): void {
  expect(resultSchema.safeParse(result).success).toBe(true);
  expect(result).toMatchObject({
    suite: 'weather_agent',
    startedAt: '2026-10-08T10:00:01.000Z',
    durationMs: 90000,
    labels: { model: 'claude-sonnet-5', provider: 'anthropic' },
  });
  const [oslo, paris] = result?.cases ?? [];
  expect(paris?.id).toBe('paris');
  expect(paris?.description).toBe('Target: sunny');
  expect(paris?.checks).toEqual([{ id: 'includes' }]);
  expect(paris?.trials.map((trial) => trial.status)).toEqual(['pass', 'fail']);
  expect(oslo?.id).toBe('2');
  expect(oslo?.input).toBe('Will it rain in Oslo tomorrow?');
  expect(oslo?.trials.map((trial) => trial.status)).toEqual(['fail', 'error']);
}

describe('Inspect AI', () => {
  test('converts a JSON log: samples to cases, epochs to trials', async () => {
    const results = await importResults(path);
    expect(results).toHaveLength(1);
    expectFixture(results[0]);
  });

  test('converts a .eval archive the same way', async () => {
    const file = evalArchive();
    const [fromArchive] = await importResults(file);
    expectFixture(fromArchive);
    expect(fromArchive).toEqual((await importResults(path))[0] as Result);
  });

  test('maps usage, duration, output and the transcript with its tool calls', async () => {
    const [result] = await importResults(path, 'inspect');
    const [first, second] = result?.cases[1]?.trials ?? [];
    expect(first).toMatchObject({
      score: 1,
      durationMs: 4100,
      usage: { inputTokens: 1100, outputTokens: 160, costUsd: 0.0057 },
      output: 'It is sunny in Paris, 21°C.',
      checks: [{ id: 'includes', pass: true, message: 'sunny' }],
    });
    expect(first?.transcript).toEqual([
      { role: 'system', content: 'You are a weather assistant. Use the get_weather tool.' },
      { role: 'user', content: 'What is the weather in Paris right now?' },
      {
        role: 'assistant',
        toolCalls: [
          {
            id: 'toolu_01',
            name: 'get_weather',
            input: { city: 'Paris' },
            output: '{"city": "Paris", "sky": "sunny", "celsius": 21}',
          },
        ],
      },
      { role: 'assistant', content: 'It is sunny in Paris, 21°C.' },
    ]);
    expect(second?.transcript?.[1]?.toolCalls?.[0]?.error).toBe('Unknown city: Pariss');
  });

  test('turns a dictionary score into one check per key, and a sample error into an error', async () => {
    const [result] = await importResults(path);
    const [partial, failed] = result?.cases[0]?.trials ?? [];
    expect(partial?.checks).toEqual([
      { id: 'includes', pass: false, message: 'Mentions showers, not rain.' },
      { id: 'rubric/accuracy', pass: true },
      { id: 'rubric/tone', pass: true },
      { id: 'rubric/brevity', pass: false },
    ]);
    expect(partial?.score).toBe(0.75);
    expect(failed).toMatchObject({
      status: 'error',
      error: 'RateLimitError: 429 Too Many Requests',
    });
    expect(result?.cases[0]?.description).toBe('Target: rain, showers');
  });

  test('maps score values as Inspect does', () => {
    expect(['C', 'P', 'I', 'N'].map(numberOfValue)).toEqual([1, 0.5, 0, 0]);
    expect([true, false, 'yes', 'No', '0.25', 7].map(numberOfValue)).toEqual([1, 0, 1, 0, 0.25, 7]);
    expect(numberOfValue('Paris')).toBeUndefined();
    const { checks, score } = checksOfScores({
      exact: { value: 'Paris' },
      rating: { value: 7 },
      votes: { value: [1, 'C', 'I'] },
    });
    expect(checks.map((check) => check.pass)).toEqual([false, true, false]);
    expect(score).toBeCloseTo(2 / 3);
  });

  test('marks an unscored sample as skipped and rejects a log without samples', async () => {
    const log = JSON.parse(readFileSync(path, 'utf8'));
    const file = join(directory, 'unscored.json');
    writeFileSync(file, JSON.stringify({ ...log, samples: [{ ...log.samples[0], scores: null }] }));
    const [result] = await importResults(file);
    expect(result?.cases[0]?.trials[0]?.status).toBe('skip');
    writeFileSync(file, JSON.stringify({ ...log, samples: undefined }));
    await expect(importResults(file)).rejects.toThrow('no sample');
  });
});
