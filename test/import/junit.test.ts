import { describe, expect, test } from 'vitest';
import { resultSchema } from '../../src/format/result.ts';
import { importResults } from '../../src/import/import-results.ts';
import { importJunit } from '../../src/import/junit.ts';
import { decodeEntities, parseXml } from '../../src/import/xml.ts';

const path = 'test/import/fixtures/junit.xml';

describe('JUnit XML', () => {
  test('splits suites by their model property', async () => {
    const results = await importResults(path);
    expect(results.map((result) => result.labels)).toEqual([
      { model: 'gemini-3.8-flash', provider: 'google' },
      { model: 'claude-sonnet-5' },
    ]);
    for (const result of results) {
      expect(resultSchema.safeParse(result).success).toBe(true);
      expect(result.suite).toBe('agent evals');
    }
    expect(results[0]?.startedAt).toBe('2026-10-08T10:00:00.000Z');
    expect(results[1]?.startedAt).toBe('2026-10-08T10:00:05.000Z');
  });

  test('maps test cases to cases with one trial, and outcomes to statuses', async () => {
    const [gemini] = await importResults(path, 'junit');
    expect(gemini?.cases.map((entry) => [entry.id, entry.trials[0]?.status])).toEqual([
      ['evals.orders.orders per day', 'pass'],
      ['evals.orders.revenue & refunds', 'fail'],
      ['evals.orders.timeout', 'error'],
      ['evals.orders.needs clickhouse', 'skip'],
    ]);
    const [passed, failed, errored, skipped] = gemini?.cases ?? [];
    expect(passed?.trials[0]).toEqual({
      status: 'pass',
      durationMs: 2500,
      checks: [{ id: 'passed', pass: true }],
      output: "SELECT date_trunc('day', created_at) <ok>",
    });
    const message =
      'AssertionError: expected count > 0, got 0\n\nat evals/orders.test.ts:42\n  expect(rows.length > 0)';
    expect(failed?.trials[0]).toMatchObject({
      status: 'fail',
      error: message,
      checks: [{ id: 'passed', pass: false, message }],
    });
    expect(errored?.trials[0]?.error).toBe('TimeoutError: Timed out after 2s');
    expect(skipped?.trials[0]).toEqual({ status: 'skip' });
    expect(passed).toMatchObject({
      title: 'orders per day',
      description: 'evals.orders',
      tags: ['orders'],
      checks: [{ id: 'passed', description: 'The test passed' }],
    });
  });

  test('makes a test case that appears again another trial', async () => {
    const [, claude] = await importResults(path);
    expect(claude?.cases).toHaveLength(1);
    expect(claude?.cases[0]?.trials.map((trial) => trial.durationMs)).toEqual([2250, 2000]);
  });

  test('reads a single testsuite without a testsuites element', () => {
    const [result] = importJunit(
      '<testsuite name="unit"><testcase name="adds"/><testcase name="subtracts"><failure/></testcase></testsuite>',
    );
    expect(result?.suite).toBe('unit');
    expect(result?.labels).toBeUndefined();
    expect(result?.cases.map((entry) => entry.id)).toEqual(['adds', 'subtracts']);
    expect(() => importJunit('<testsuites/>')).toThrow('no test case');
  });

  test('parses XML tolerantly', () => {
    const document = parseXml(
      '<?xml version="1.0"?><!DOCTYPE x><a title=\'x > y\' b="&#65;&#x42;"><!-- <c/> --><d>1 &lt; 2<![CDATA[ & <raw>]]></d><e></a>',
    );
    const [a] = document.children;
    expect(a?.attributes).toEqual({ title: 'x > y', b: 'AB' });
    expect(a?.children.map((child) => child.name)).toEqual(['d', 'e']);
    expect(a?.children[0]?.text).toBe('1 < 2 & <raw>');
    expect(decodeEntities('&unknown; &amp;')).toBe('&unknown; &');
  });
});
