import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { detectFormat, importResults } from '../../src/import/import-results.ts';
import { writeZip } from './zip-writer.ts';

const directory = mkdtempSync(join(tmpdir(), 'evalmark-import-'));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

/**
 * Reads a fixture.
 *
 * @param name - The fixture's file name.
 * @returns Its text.
 */
function fixture(name: string): string {
  return readFileSync(join('test/import/fixtures', name), 'utf8');
}

describe('detectFormat', () => {
  test('tells each format from its content', () => {
    expect(detectFormat('results.json', fixture('promptfoo-results.json'))).toBe('promptfoo');
    expect(detectFormat('log.json', fixture('inspect-log.json'))).toBe('inspect');
    expect(detectFormat('report.txt', fixture('junit.xml'))).toBe('junit');
    expect(detectFormat('result.json', readFileSync('test/fixtures/result.json'))).toBe('evalmark');
    expect(detectFormat('x.eval', writeZip([{ name: 'header.json', content: '{}' }]))).toBe(
      'inspect',
    );
  });

  test('uses the extension as a hint for XML, and reads the summary promptfoo returns', () => {
    expect(detectFormat('empty.xml', '﻿<?xml version="1.0"?><report/>')).toBe('junit');
    const summary = JSON.parse(fixture('promptfoo-results.json')).results;
    expect(detectFormat('summary.json', JSON.stringify(summary))).toBe('promptfoo');
  });

  test('throws on anything else', () => {
    expect(() => detectFormat('notes.txt', 'hello')).toThrow('--format');
    expect(() => detectFormat('data.json', '{"rows": []}')).toThrow('not recognised');
  });
});

describe('importResults', () => {
  test('reads an evalmark result as it is', async () => {
    const results = await importResults('test/fixtures/result.json');
    expect(results).toHaveLength(1);
    expect(results[0]?.cases.length).toBeGreaterThan(0);
  });

  test('says which file and format failed', async () => {
    const file = join(directory, 'broken.json');
    writeFileSync(file, '{"results": {"results": [{"success": "yes"}]}}');
    await expect(importResults(file)).rejects.toThrow(`${file} is not a readable promptfoo file`);
    await expect(importResults(file, 'inspect')).rejects.toThrow('inspect');
    await expect(importResults(join(directory, 'missing.json'))).rejects.toThrow(
      'could not be read',
    );
  });

  test('validates what an evalmark file holds', async () => {
    const file = join(directory, 'invalid.json');
    writeFileSync(file, '{"version": 1, "cases": [{"id": "", "trials": []}]}');
    await expect(importResults(file)).rejects.toThrow('did not convert to a valid result');
  });
});
