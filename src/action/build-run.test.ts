import { describe, expect, test } from 'vitest';
import type { Result } from '../format/result.ts';
import { noAttachmentFiles } from './attachment-files.ts';
import { buildRun, keepsTranscript, type RunDraft } from './build-run.ts';

const result: Result = {
  version: 1,
  startedAt: '2026-10-08T12:00:00+02:00',
  durationMs: 5000,
  labels: { model: 'm' },
  cases: [
    {
      id: 'ok',
      trials: [{ status: 'pass', transcript: [{ role: 'user', content: 'hi' }] }],
    },
    {
      id: 'a/b',
      tags: ['t'],
      trials: [
        { status: 'pass', usage: { costUsd: 0.5 } },
        { status: 'fail', transcript: [{ role: 'user' }, { role: 'assistant' }] },
      ],
    },
  ],
};

/**
 * A draft for the tests.
 *
 * @param transcripts - The policy.
 * @returns The draft.
 */
function draft(transcripts: RunDraft['transcripts']): RunDraft {
  return {
    result,
    id: 'r1',
    suite: 's',
    source: { branch: 'main' },
    recordedAt: '2026-10-08T10:05:00.000Z',
    transcripts,
    attachments: 'failed',
    attachmentFiles: noAttachmentFiles,
  };
}

describe('keepsTranscript', () => {
  test('follows the policy', () => {
    const transcript = [{ role: 'user' as const }];
    expect(keepsTranscript({ status: 'fail', transcript }, 'failed')).toBe(true);
    expect(keepsTranscript({ status: 'error', transcript }, 'failed')).toBe(true);
    expect(keepsTranscript({ status: 'pass', transcript }, 'failed')).toBe(false);
    expect(keepsTranscript({ status: 'pass', transcript }, 'all')).toBe(true);
    expect(keepsTranscript({ status: 'fail', transcript }, 'none')).toBe(false);
    expect(keepsTranscript({ status: 'fail', transcript: [] }, 'all')).toBe(false);
  });
});

describe('buildRun', () => {
  test('builds the run, its statuses and totals', () => {
    const { run } = buildRun(draft('failed'));
    expect(run.id).toBe('r1');
    expect(run.startedAt).toBe('2026-10-08T10:00:00.000Z');
    expect(run.labels).toEqual({ model: 'm' });
    expect(run.cases.map((entry) => entry.status)).toEqual(['pass', 'flaky']);
    expect(run.totals.durationMs).toBe(5000);
    expect(run.totals.costUsd).toBe(0.5);
    expect(run.totals.passRate).toBeCloseTo(2 / 3);
  });

  test('moves the kept transcripts out and counts every transcript', () => {
    const { run, transcripts } = buildRun(draft('failed'));
    expect(transcripts).toEqual([
      {
        path: 'data/transcripts/r1/a_2fb/1.json.gz',
        messages: [{ role: 'user' }, { role: 'assistant' }],
      },
    ]);
    expect(run.cases[0]?.trials[0]).toEqual({ status: 'pass', transcriptMessages: 1 });
    expect(run.cases[1]?.trials[0]).toEqual({ status: 'pass', usage: { costUsd: 0.5 } });
    expect(run.cases[1]?.trials[1]).toEqual({
      status: 'fail',
      transcript: 'data/transcripts/r1/a_2fb/1.json.gz',
      transcriptMessages: 2,
    });
    expect(buildRun(draft('all')).transcripts).toHaveLength(2);
    expect(buildRun(draft('none')).transcripts).toHaveLength(0);
  });

  test('starts at the time it was recorded when the result has no time', () => {
    const { startedAt: _ignored, ...withoutTime } = result;
    const { run } = buildRun({ ...draft('none'), result: withoutTime });
    expect(run.startedAt).toBe('2026-10-08T10:05:00.000Z');
  });
});
