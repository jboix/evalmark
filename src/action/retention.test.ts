import { describe, expect, test } from 'vitest';
import type { Run } from '../format/store.ts';
import { totalsOf } from '../format/totals.ts';
import { planRetention, withoutTranscripts } from './retention.ts';

/**
 * A stored run for the tests.
 *
 * @param id - Its id.
 * @param startedAt - When it started.
 * @param transcript - Whether its trial keeps a transcript.
 * @returns The run.
 */
function storedRun(id: string, startedAt: string, transcript = true): Run {
  return {
    version: 1,
    id,
    suite: 's',
    recordedAt: startedAt,
    startedAt,
    labels: {},
    source: {},
    totals: totalsOf([]),
    cases: [
      {
        id: 'c',
        status: 'fail',
        trials: [
          transcript
            ? {
                status: 'fail',
                transcript: `data/transcripts/${id}/c/0.json.gz`,
                transcriptMessages: 3,
              }
            : { status: 'fail' },
        ],
      },
    ],
  };
}

const runs = [
  storedRun('r4', '2026-10-04T00:00:00.000Z'),
  storedRun('r3', '2026-10-03T00:00:00.000Z'),
  storedRun('r2', '2026-10-02T00:00:00.000Z'),
  storedRun('r1', '2026-10-01T00:00:00.000Z', false),
];
const now = new Date('2026-10-04T12:00:00Z');
const ids = (list: readonly Run[]) => list.map((run) => run.id);

describe('planRetention', () => {
  test('keeps everything with zeros', () => {
    const plan = planRetention(
      runs,
      'r4',
      { keepRuns: 0, keepDays: 0, keepTranscripts: 0, keepAttachments: 0 },
      now,
    );
    expect(ids(plan.kept)).toEqual(['r4', 'r3', 'r2', 'r1']);
    expect(plan.removed).toEqual([]);
    expect(plan.stripped).toEqual([]);
  });

  test('keeps the newest runs', () => {
    const plan = planRetention(
      runs,
      'r4',
      { keepRuns: 2, keepDays: 0, keepTranscripts: 0, keepAttachments: 0 },
      now,
    );
    expect(ids(plan.kept)).toEqual(['r4', 'r3']);
    expect(ids(plan.removed)).toEqual(['r2', 'r1']);
  });

  test('keeps the recent days', () => {
    const plan = planRetention(
      runs,
      'r4',
      { keepRuns: 0, keepDays: 2, keepTranscripts: 0, keepAttachments: 0 },
      now,
    );
    expect(ids(plan.kept)).toEqual(['r4', 'r3']);
  });

  test('always keeps the run just recorded', () => {
    const plan = planRetention(
      runs,
      'r1',
      { keepRuns: 1, keepDays: 1, keepTranscripts: 0, keepAttachments: 0 },
      now,
    );
    expect(ids(plan.kept)).toEqual(['r4', 'r1']);
  });

  test('strips transcripts beyond the newest runs, keeping the message counts', () => {
    const plan = planRetention(
      runs,
      'r4',
      { keepRuns: 0, keepDays: 0, keepTranscripts: 2, keepAttachments: 0 },
      now,
    );
    expect(ids(plan.stripped)).toEqual(['r2']);
    const stripped = plan.kept.find((run) => run.id === 'r2');
    expect(stripped?.cases[0]?.trials[0]).toEqual({ status: 'fail', transcriptMessages: 3 });
    expect(plan.kept[0]?.cases[0]?.trials[0]?.transcript).toBeDefined();
  });

  test('withoutTranscripts leaves the original as it was', () => {
    const original = storedRun('x', '2026-10-01T00:00:00.000Z');
    withoutTranscripts(original);
    expect(original.cases[0]?.trials[0]?.transcript).toBeDefined();
  });

  test('strips attachment files beyond the newest runs, keeping what they were', () => {
    const file = 'data/attachments/x.png';
    const attached = (id: string, startedAt: string): Run => {
      const run = storedRun(id, startedAt);
      const [entry] = run.cases;
      const trial = {
        status: 'fail' as const,
        attachments: [{ mediaType: 'image/png' as const, bytes: 3, file }],
      };
      return {
        ...run,
        cases: [{ ...(entry ?? { id: 'c', status: 'fail' }), trials: [trial] }],
        attachmentFiles: [file],
      };
    };
    const list = [
      attached('b', '2026-10-02T00:00:00.000Z'),
      attached('a', '2026-10-01T00:00:00.000Z'),
    ];
    const options = { keepRuns: 0, keepDays: 0, keepTranscripts: 0, keepAttachments: 1 };
    const plan = planRetention(list, 'b', options, now);
    expect(ids(plan.unattached)).toEqual(['a']);
    expect(plan.kept[1]?.attachmentFiles).toBeUndefined();
    expect(plan.kept[1]?.cases[0]?.trials[0]?.attachments).toEqual([
      { mediaType: 'image/png', bytes: 3 },
    ]);
    expect(plan.kept[0]?.attachmentFiles).toEqual([file]);
    expect(planRetention(list, 'b', { ...options, keepAttachments: 0 }, now).unattached).toEqual(
      [],
    );
  });

  test('withoutTranscripts keeps only the files the trials point to', () => {
    const run = storedRun('x', '2026-10-01T00:00:00.000Z');
    const withFiles: Run = { ...run, attachmentFiles: ['data/attachments/t.png'] };
    expect(withoutTranscripts(withFiles).attachmentFiles).toBeUndefined();
  });
});
