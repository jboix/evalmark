import { describe, expect, test } from 'vitest';
import { pathSafe, transcriptPath } from './store.ts';

describe('pathSafe', () => {
  test('keeps safe names and encodes the rest without collisions', () => {
    expect(pathSafe('q1-latency.v2')).toBe('q1-latency.v2');
    expect(pathSafe('a/b')).toBe('a_2fb');
    expect(pathSafe('a_2fb')).toBe('a_5f2fb');
    expect(pathSafe('é')).toBe('_e9');
  });

  test('builds transcript paths', () => {
    expect(transcriptPath('r1', 'case 1', 2)).toBe('data/transcripts/r1/case_201/2.json.gz');
  });
});
