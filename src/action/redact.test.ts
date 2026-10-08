import { describe, expect, test } from 'vitest';
import { createRedactor, redactDeep } from './redact.ts';

describe('createRedactor', () => {
  const redact = createRedactor(['my-secret-value']);

  test('removes common secret shapes', () => {
    const samples = [
      `ghp_${'a'.repeat(36)}`,
      `gho_${'B'.repeat(36)}`,
      `ghs_${'1'.repeat(36)}`,
      `ghu_${'c'.repeat(36)}`,
      `github_pat_${'d'.repeat(40)}`,
      `sk-${'e'.repeat(40)}`,
      `sk-ant-api03-${'f'.repeat(40)}`,
      `AIza${'g'.repeat(35)}`,
      'AKIAABCDEFGHIJKLMNOP',
      'xoxb-1234567890-abcdefghij',
    ];
    for (const sample of samples) {
      expect(redact(`key: ${sample} end`)).toBe('key: [redacted] end');
    }
  });

  test('keeps the word Bearer and removes the token', () => {
    expect(redact('Authorization: Bearer abc.def-ghi_jkl')).toBe(
      'Authorization: Bearer [redacted]',
    );
  });

  test('removes private key blocks', () => {
    const key = '-----BEGIN RSA PRIVATE KEY-----\nMIIE\nabc\n-----END RSA PRIVATE KEY-----';
    expect(redact(`before\n${key}\nafter`)).toBe('before\n[redacted]\nafter');
  });

  test('removes the given strings and leaves ordinary text alone', () => {
    expect(redact('the my-secret-value here')).toBe('the [redacted] here');
    expect(redact('a task, skip this, ask-me')).toBe('a task, skip this, ask-me');
  });
});

describe('redactDeep', () => {
  test('redacts strings at any depth, keys included', () => {
    const redact = createRedactor(['s3cret']);
    const value = {
      text: 's3cret',
      count: 3,
      flag: true,
      nothing: null,
      calls: [{ input: { query: 'use s3cret', s3cret: 1 }, output: ['s3cret'] }],
    };
    expect(redactDeep<unknown>(value, redact)).toEqual({
      text: '[redacted]',
      count: 3,
      flag: true,
      nothing: null,
      calls: [{ input: { query: 'use [redacted]', '[redacted]': 1 }, output: ['[redacted]'] }],
    });
  });
});
