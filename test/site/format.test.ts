import { describe, expect, test } from 'vitest';
import { brandingOf } from '../../src/site/lib/data.ts';
import {
  fieldName,
  formatCost,
  formatCostTick,
  formatCount,
  formatDelta,
  formatDuration,
  formatPercent,
  formatPointsDelta,
  formatRelative,
  plural,
} from '../../src/site/lib/format.ts';

describe('numbers', () => {
  test('percentages keep one decimal only when needed', () => {
    expect(formatPercent(0.875)).toBe('87.5%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(2 / 3)).toBe('66.7%');
    expect(formatPercent(null)).toBe('–');
  });

  test('point changes carry their sign', () => {
    expect(formatPointsDelta(0.025)).toBe('+2.5 pt');
    expect(formatPointsDelta(-0.1)).toBe('−10 pt');
    expect(formatPointsDelta(0)).toBe('±0 pt');
  });

  test('money has the precision its size needs', () => {
    expect(formatCost(0)).toBe('$0');
    expect(formatCost(0.0042)).toBe('$0.0042');
    expect(formatCost(0.083)).toBe('$0.083');
    expect(formatCost(1.236)).toBe('$1.24');
    expect(formatCost(1234.5)).toBe('$1,235');
    expect(formatCost(-0.5)).toBe('−$0.500');
    expect(formatCostTick(0.5)).toBe('$0.5');
    expect(formatCostTick(1)).toBe('$1');
    expect(formatCostTick(0.0025)).toBe('$0.0025');
  });

  test('counts are short', () => {
    expect(formatCount(950)).toBe('950');
    expect(formatCount(1200)).toBe('1.2k');
    expect(formatCount(12_345)).toBe('12.3k');
    expect(formatCount(640_700)).toBe('640.7k');
    expect(formatCount(999_999)).toBe('1M');
    expect(formatCount(1_250_000)).toBe('1.25M');
  });

  test('durations read as a person would say them', () => {
    expect(formatDuration(850)).toBe('850ms');
    expect(formatDuration(4200)).toBe('4.2s');
    expect(formatDuration(41_000)).toBe('41s');
    expect(formatDuration(65_000)).toBe('1m 05s');
    expect(formatDuration(3_720_000)).toBe('1h 02m');
  });

  test('signed changes use a real minus', () => {
    expect(formatDelta(-1200, formatCount)).toBe('−1.2k');
    expect(formatDelta(0.12, formatCost)).toBe('+$0.120');
    expect(formatDelta(0, formatCount)).toBe('±0');
  });

  test('plurals', () => {
    expect(plural(1, 'case')).toBe('1 case');
    expect(plural(2, 'case')).toBe('2 cases');
  });
});

describe('formatRelative', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');

  test('picks the largest unit that fits', () => {
    expect(formatRelative('2026-10-08T11:59:30Z', now)).toBe('just now');
    expect(formatRelative('2026-10-08T09:00:00Z', now)).toBe('3 hours ago');
    expect(formatRelative('2026-10-07T12:00:00Z', now)).toBe('yesterday');
    expect(formatRelative('2026-09-24T12:00:00Z', now)).toBe('2 weeks ago');
  });

  test('writes a dash for a date it cannot read', () => {
    expect(formatRelative('not a date', now)).toBe('–');
  });
});

describe('fieldName', () => {
  test('capitalises a label key', () => {
    expect(fieldName('model')).toBe('Model');
  });
});

describe('brandingOf', () => {
  test('keeps what has the right shape and fills the rest with the defaults', () => {
    expect(brandingOf(undefined)).toEqual({ title: 'evalmark', subtitle: 'eval dashboard' });
    expect(brandingOf({ title: 'Acme', logo: 'data/branding/logo.svg' })).toEqual({
      title: 'Acme',
      subtitle: 'eval dashboard',
      logo: 'data/branding/logo.svg',
    });
  });

  test('ignores a logo outside the branding folder', () => {
    expect(brandingOf({ logo: 'https://example.com/x.svg' }).logo).toBeUndefined();
  });
});
