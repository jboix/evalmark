import { describe, expect, test } from 'vitest';
import { majorTagOf } from './major-tag.ts';

describe('majorTagOf', () => {
  test('names the major version', () => {
    expect(majorTagOf('1.4.2')).toBe('v1');
    expect(majorTagOf('12.0.0')).toBe('v12');
  });

  test('refuses anything but a release version', () => {
    expect(() => majorTagOf('1.4')).toThrow('Not a release version');
    expect(() => majorTagOf('1.4.2-beta.1')).toThrow('Not a release version');
  });
});
