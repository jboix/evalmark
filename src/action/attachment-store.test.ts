import { describe, expect, test } from 'vitest';
import type { Result } from '../format/result.ts';
import type { StoredMessage } from '../format/store.ts';
import type { AttachmentFiles } from './attachment-files.ts';
import { keepsAttachments, transcriptWithoutFiles } from './attachment-store.ts';
import { buildRun, type RunDraft } from './build-run.ts';

const sha = 'a'.repeat(64);
const files: AttachmentFiles = new Map([
  ['pass.png', { source: '/r/pass.png', bytes: 10, sha256: 'b'.repeat(64) }],
  ['shot.png', { source: '/r/shot.png', bytes: 20, sha256: sha }],
  ['copy.png', { source: '/r/copy.png', bytes: 20, sha256: sha }],
  ['gone.png', undefined],
]);

const result: Result = {
  version: 1,
  cases: [
    {
      id: 'c',
      trials: [
        { status: 'pass', attachments: [{ path: 'pass.png', mediaType: 'image/png' }] },
        {
          status: 'fail',
          attachments: [
            { path: 'shot.png', mediaType: 'image/png', caption: 'The end' },
            { path: 'gone.png', mediaType: 'image/webp' },
          ],
          transcript: [
            {
              role: 'assistant',
              attachments: [{ path: 'copy.png', mediaType: 'image/png' }],
              toolCalls: [
                { name: 'write', attachments: [{ path: 'shot.png', mediaType: 'image/png' }] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * A draft of the result for the tests.
 *
 * @param attachments - The attachments policy.
 * @returns The draft.
 */
function draft(attachments: RunDraft['attachments']): RunDraft {
  return {
    result,
    id: 'r1',
    suite: 's',
    source: {},
    recordedAt: '2026-10-08T10:00:00.000Z',
    transcripts: 'all',
    attachments,
    attachmentFiles: files,
  };
}

const file = `data/attachments/${sha}.png`;

describe('keepsAttachments', () => {
  test('follows the policy', () => {
    expect(keepsAttachments({ status: 'fail' }, 'failed')).toBe(true);
    expect(keepsAttachments({ status: 'skip' }, 'failed')).toBe(true);
    expect(keepsAttachments({ status: 'pass' }, 'failed')).toBe(false);
    expect(keepsAttachments({ status: 'pass' }, 'all')).toBe(true);
    expect(keepsAttachments({ status: 'fail' }, 'none')).toBe(false);
  });
});

describe('storing attachments', () => {
  test('points a kept trial to one file per content, everywhere it appears', () => {
    const built = buildRun(draft('failed'));
    expect(built.attachments).toEqual([{ path: file, source: '/r/shot.png' }]);
    expect(built.run.attachmentFiles).toEqual([file]);
    expect(built.run.cases[0]?.trials[1]?.attachments).toEqual([
      { mediaType: 'image/png', caption: 'The end', bytes: 20, file },
      { mediaType: 'image/webp', bytes: 0, missing: true },
    ]);
    const message = built.transcripts[0]?.messages[0];
    expect(message?.attachments).toEqual([{ mediaType: 'image/png', bytes: 20, file }]);
    expect(message?.toolCalls?.[0]?.attachments).toEqual([
      { mediaType: 'image/png', bytes: 20, file },
    ]);
  });

  test('keeps a trial the policy leaves out without its files', () => {
    const built = buildRun(draft('failed'));
    expect(built.run.cases[0]?.trials[0]?.attachments).toEqual([
      { mediaType: 'image/png', bytes: 10 },
    ]);
    expect(buildRun(draft('all')).attachments).toHaveLength(2);
    const none = buildRun(draft('none'));
    expect(none.attachments).toEqual([]);
    expect(none.run.attachmentFiles).toBeUndefined();
    expect(none.transcripts[0]?.messages[0]?.attachments).toEqual([
      { mediaType: 'image/png', bytes: 20 },
    ]);
  });

  test('a transcript without files keeps everything else', () => {
    const messages: StoredMessage[] = [
      {
        role: 'assistant',
        content: 'x',
        attachments: [{ mediaType: 'image/png', bytes: 1, file }],
        toolCalls: [
          { name: 't', attachments: [{ mediaType: 'image/png', bytes: 1, file }] },
          { name: 'u' },
        ],
      },
      { role: 'user', content: 'y' },
    ];
    expect(transcriptWithoutFiles(messages)).toEqual([
      {
        role: 'assistant',
        content: 'x',
        attachments: [{ mediaType: 'image/png', bytes: 1 }],
        toolCalls: [
          { name: 't', attachments: [{ mediaType: 'image/png', bytes: 1 }] },
          { name: 'u' },
        ],
      },
      { role: 'user', content: 'y' },
    ]);
  });
});
