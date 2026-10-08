import { describe, expect, test } from 'vitest';
import type { StoredMessage } from '../../src/format/store.ts';
import { markOfLetter, markOfLetters, markOfTrial } from '../../src/site/lib/marks.ts';
import {
  applyTheme,
  nextTheme,
  storedTheme,
  storeTheme,
  themeOf,
} from '../../src/site/lib/theme.ts';
import { checksSummary, timelineOf, usageText } from '../../src/site/lib/timeline.ts';

describe('the theme', () => {
  test('the button goes from system to light to dark and back', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });

  test('reads a stored pick, the system by default', () => {
    expect(themeOf('dark')).toBe('dark');
    expect(themeOf('purple')).toBe('system');
    expect(themeOf(null)).toBe('system');
    expect(storedTheme(() => ({ getItem: () => 'light' }))).toBe('light');
  });

  test('survives storage that throws', () => {
    const blocked = () => {
      throw new Error('blocked');
    };
    expect(storedTheme(blocked)).toBe('system');
    expect(() => storeTheme(blocked, 'dark')).not.toThrow();
    const saved = new Map<string, string>();
    storeTheme(() => ({ setItem: (key: string, value: string) => saved.set(key, value) }), 'dark');
    expect([...saved.values()]).toEqual(['dark']);
  });

  test('is applied on the root element', () => {
    const root = { dataset: {} as Record<string, string> } as unknown as HTMLElement;
    applyTheme(root, 'dark');
    expect(root.dataset.theme).toBe('dark');
  });
});

describe('marks', () => {
  test('give each status its shape', () => {
    expect(markOfTrial('error')).toBe('error');
    expect(markOfLetters(undefined)).toBe('skip');
    expect(markOfLetters('EE')).toBe('error');
    expect(markOfLetters('EF')).toBe('fail');
    expect(markOfLetters('PFP')).toBe('flaky');
    expect(markOfLetters('SS')).toBe('skip');
    expect(markOfLetter('P')).toBe('pass');
    expect(markOfLetter('?')).toBe('skip');
  });
});

describe('a timeline', () => {
  const messages: StoredMessage[] = [
    { role: 'system', content: 'Be helpful.' },
    { role: 'user', content: 'How much?', at: '2026-10-07T10:00:00Z' },
    {
      role: 'assistant',
      content: 'Let me look.',
      at: '2026-10-07T10:00:09Z',
      usage: { inputTokens: 1900, outputTokens: 58, costUsd: 0.0001 },
      toolCalls: [
        { name: 'list_sources', input: {}, output: ['pg'], durationMs: 212 },
        {
          id: 'q',
          name: 'run_query',
          input: { sql: 'select 1' },
          error: 'column "amount" does not exist',
          attachments: [{ file: 'data/attachments/a.png', mediaType: 'image/png', bytes: 10 }],
        },
      ],
      attachments: [{ mediaType: 'image/png', caption: 'Gone', bytes: 10 }],
    },
  ];

  test('numbers each message and says who wrote it, when and at what cost', () => {
    const steps = timelineOf(messages);
    expect(steps.map((step) => step.who)).toEqual(['System', 'You', 'Agent']);
    expect(steps.map((step) => step.number)).toEqual([1, 2, 3]);
    expect(steps[2]?.elapsed).toBe('+9.0s');
    expect(steps[2]?.usage).toBe('1.9k in · 58 out · $0.00010');
    expect(steps[2]?.attachments).toHaveLength(1);
  });

  test('shows tool calls with what they sent and got back, failures marked', () => {
    const [listed, failed] = timelineOf(messages)[2]?.calls ?? [];
    expect(listed).toMatchObject({ key: 'call-0', name: 'list_sources', brief: '', failed: false });
    expect(listed?.duration).toBe('212ms');
    expect(failed).toMatchObject({
      key: 'q',
      brief: '{"sql":"select 1"}',
      output: 'column "amount" does not exist',
      failed: true,
    });
    expect(failed?.attachments).toHaveLength(1);
    expect(timelineOf(messages)[2]?.failed).toBe(true);
  });

  test('writes usage and checks in words', () => {
    expect(usageText(undefined)).toBe('');
    expect(usageText({ outputTokens: 12 })).toBe('12 out');
    expect(checksSummary(['pass', 'fail', 'pass'])).toEqual({
      title: 'Failed 1 of 3 checks',
      failed: true,
    });
    expect(checksSummary(['pass', 'pass']).title).toBe('Passed all 2 checks');
    expect(checksSummary(['pass']).title).toBe('Passed the one check');
    expect(checksSummary(['none']).title).toBe('No check ran');
  });
});
