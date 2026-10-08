import { describe, expect, test } from 'vitest';
import {
  formatCost,
  formatDelta,
  formatDuration,
  formatPercent,
  formatPointsDelta,
  formatTokens,
} from './numbers.ts';

describe('numbers', () => {
  test('percentages', () => {
    expect(formatPercent(0.875)).toBe('87.5%');
    expect(formatPercent(1)).toBe('100%');
  });

  test('costs', () => {
    expect(formatCost(0)).toBe('$0');
    expect(formatCost(1.234)).toBe('$1.23');
    expect(formatCost(0.0042)).toBe('$0.0042');
    expect(formatCost(-0.5)).toBe('-$0.50');
  });

  test('tokens', () => {
    expect(formatTokens(950)).toBe('950');
    expect(formatTokens(12_345)).toBe('12.3k');
    expect(formatTokens(2_000_000)).toBe('2M');
  });

  test('durations', () => {
    expect(formatDuration(850)).toBe('850ms');
    expect(formatDuration(41_000)).toBe('41s');
    expect(formatDuration(250_000)).toBe('4m 10s');
    expect(formatDuration(3_720_000)).toBe('1h 2m');
  });

  test('changes', () => {
    expect(formatDelta(3, String)).toBe('+3');
    expect(formatDelta(-0.02, formatCost)).toBe('-$0.02');
    expect(formatDelta(0, String)).toBe('0');
    expect(formatPointsDelta(0.05)).toBe('+5 pp');
    expect(formatPointsDelta(-0.125)).toBe('-12.5 pp');
    expect(formatPointsDelta(0.00001)).toBe('0');
  });
});
