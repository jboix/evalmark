import { describe, expect, test } from 'vitest';
import { checkFolder, linesOf, parseLabels, readInputs } from './inputs.ts';

describe('readInputs', () => {
  test('applies the defaults of action.yml', () => {
    const inputs = readInputs({});
    expect(inputs).toMatchObject({
      mode: 'record',
      branch: 'evalmark',
      folder: 'evalmark',
      keepRuns: 500,
      keepDays: 0,
      transcripts: 'failed',
      keepTranscripts: 30,
      attachments: 'failed',
      keepAttachments: 10,
      warnSizeMb: 100,
      history: 'auto',
      comment: true,
      badges: true,
      failOnError: false,
      result: undefined,
      labels: {},
      redact: [],
    });
  });

  test('reads INPUT_ variables with their dashes', () => {
    const inputs = readInputs({
      'INPUT_KEEP-RUNS': '20',
      INPUT_LABELS: 'model=a\n\nprovider = b=c\n',
      INPUT_REDACT: 'one\n two \n',
      'INPUT_FAIL-ON-ERROR': 'True',
      INPUT_BRANCH: 'refs/evalmark/data',
      INPUT_FOLDER: './evals/site/',
    });
    expect(inputs.keepRuns).toBe(20);
    expect(inputs.labels).toEqual({ model: 'a', provider: 'b=c' });
    expect(inputs.redact).toEqual(['one', 'two']);
    expect(inputs.failOnError).toBe(true);
    expect(inputs.branch).toBe('refs/evalmark/data');
    expect(inputs.folder).toBe('evals/site');
  });

  test('falls back to GITHUB_TOKEN', () => {
    expect(readInputs({ GITHUB_TOKEN: 't' }).token).toBe('t');
  });

  test('rejects values an input does not take', () => {
    expect(() => readInputs({ 'INPUT_KEEP-RUNS': '-1' })).toThrow('keep-runs');
    expect(() => readInputs({ INPUT_HISTORY: 'never' })).toThrow('history');
    expect(() => readInputs({ INPUT_COMMENT: 'yes' })).toThrow('comment');
  });
});

describe('labels and folders', () => {
  test('parses labels and rejects lines without a key', () => {
    expect(parseLabels(linesOf('a=1\r\nb='))).toEqual({ a: '1', b: '' });
    expect(() => parseLabels(['novalue'])).toThrow('key=value');
    expect(() => parseLabels(['=x'])).toThrow('key=value');
  });

  test('keeps the folder inside the branch', () => {
    expect(checkFolder('evalmark')).toBe('evalmark');
    for (const folder of ['.', '/abs', '../up', 'a/../b', '']) {
      expect(() => checkFolder(folder)).toThrow('folder');
    }
  });
});
