import { inflateSync } from 'node:zlib';
import { expect, test } from 'vitest';
import { demoCases } from './demo-catalog.ts';
import { crc32, encodePng } from './demo-png.ts';
import { screenshotOf } from './demo-screenshot.ts';

test('crc32 matches the standard check value', () => {
  expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
});

test('encodePng writes the signature, the header and rows that inflate back', () => {
  const pixels = Uint8Array.of(0, 1, 1, 0);
  const png = encodePng({
    width: 2,
    height: 2,
    palette: [
      [0, 0, 0],
      [255, 255, 255],
    ],
    pixels,
  });
  expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(png.buffer);
  expect(new TextDecoder().decode(png.subarray(12, 16))).toBe('IHDR');
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([2, 2]);
  const data = png.indexOf(0x49, 33 + 12 + 6);
  const idat = new TextDecoder().decode(png.subarray(data, data + 4));
  expect(idat).toBe('IDAT');
  const length = view.getUint32(data - 4);
  expect([...inflateSync(png.subarray(data + 4, data + 4 + length))]).toEqual([0, 0, 1, 0, 1, 0]);
});

test('the demo screenshots are small and the same each time', () => {
  for (const demoCase of demoCases) {
    const png = screenshotOf(demoCase, 'right', 'dashboard');
    expect(png.length).toBeLessThan(8000);
    expect(screenshotOf(demoCase, 'right', 'dashboard')).toEqual(png);
    expect(screenshotOf(demoCase, 'wrong', 'dashboard')).not.toEqual(png);
  }
});
