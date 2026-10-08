/**
 * Synthetic screenshots for the fixture: small PNG images drawn from rectangles, the same bytes on
 * every run, stored as the action stores attachments (named by the SHA-256 of their content).
 */
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { attachmentPath, type StoredAttachment } from '../../src/format/store.ts';

/** A colour, as red, green and blue from 0 to 255. */
type Colour = readonly [number, number, number];

/** A filled rectangle: left, top, width, height and colour. */
type Box = readonly [number, number, number, number, Colour];

/** A screenshot to draw: its size, background and boxes. */
interface Drawing {
  readonly width: number;
  readonly height: number;
  readonly background: Colour;
  readonly boxes: readonly Box[];
}

/** The CRC-32 table of PNG chunks. */
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

/**
 * The CRC-32 of bytes.
 *
 * @param bytes - The bytes.
 * @returns The checksum.
 */
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * One PNG chunk.
 *
 * @param type - Its four-letter type.
 * @param data - Its data.
 * @returns The chunk's bytes.
 */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const body = new Uint8Array(4 + data.length);
  body.set(new TextEncoder().encode(type), 0);
  body.set(data, 4);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(body, 4);
  view.setUint32(8 + data.length, crc32(body));
  return out;
}

/**
 * The colour of one pixel: the last box that covers it, or the background.
 *
 * @param drawing - The drawing.
 * @param x - The pixel's column.
 * @param y - The pixel's row.
 * @returns The colour.
 */
function pixelOf(drawing: Drawing, x: number, y: number): Colour {
  const box = drawing.boxes.findLast(
    ([left, top, width, height]) => x >= left && x < left + width && y >= top && y < top + height,
  );
  return box?.[4] ?? drawing.background;
}

/**
 * Encodes a drawing as a PNG file: 8-bit RGB, no filter.
 *
 * @param drawing - The drawing.
 * @returns The file's bytes.
 */
export function pngOf(drawing: Drawing): Uint8Array {
  const { width, height } = drawing;
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 3);
    for (let x = 0; x < width; x += 1) raw.set(pixelOf(drawing, x, y), row + 1 + x * 3);
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 2, 0, 0, 0], 8);
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [
    signature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ];
  return new Uint8Array(Buffer.concat(parts));
}

/** The page's colours. */
const paper: Colour = [246, 248, 250];
const ink: Colour = [15, 28, 42];
const line: Colour = [216, 222, 229];
const teal: Colour = [14, 124, 111];
const orange: Colour = [194, 65, 12];

/**
 * Bars of a chart, rising and falling.
 *
 * @param colour - Their colour.
 * @returns The boxes.
 */
function bars(colour: Colour): Box[] {
  return [70, 110, 90, 150, 130, 170, 120, 180].map(
    (height, index): Box => [40 + index * 50, 260 - height, 32, height, colour],
  );
}

/** The screenshots the fixture uses, by name. */
const drawings: Readonly<Record<string, Drawing>> = {
  dashboard: {
    width: 480,
    height: 300,
    background: paper,
    boxes: [[0, 0, 480, 36, ink], [24, 60, 432, 1, line], ...bars(teal)],
  },
  table: {
    width: 480,
    height: 300,
    background: paper,
    boxes: [
      [0, 0, 480, 36, ink],
      ...[0, 1, 2, 3, 4, 5].map((row): Box => [24, 64 + row * 36, 432, 1, line]),
      ...[0, 1, 2, 3, 4].map((row): Box => [24, 76 + row * 36, 120 + row * 40, 12, teal]),
    ],
  },
  error: {
    width: 480,
    height: 300,
    background: paper,
    boxes: [
      [0, 0, 480, 36, ink],
      [24, 80, 432, 120, orange],
      [40, 128, 300, 16, paper],
    ],
  },
};

/** A screenshot's name. */
export type ShotName = 'dashboard' | 'table' | 'error';

/** The fixture's screenshots: the stored attachment and the file's bytes, by name. */
export interface Shot {
  /** The stored attachment, its `file` set. */
  readonly attachment: StoredAttachment;
  /** The file's bytes. */
  readonly bytes: Uint8Array;
}

/**
 * Draws the fixture's screenshots.
 *
 * @returns Each screenshot, by name.
 */
export function drawShots(): Readonly<Record<ShotName, Shot>> {
  const shot = (name: ShotName, caption: string): Shot => {
    const drawing = drawings[name];
    if (drawing === undefined) throw new Error(`No drawing named ${name}.`);
    const bytes = pngOf(drawing);
    const sha = createHash('sha256').update(bytes).digest('hex');
    return {
      bytes,
      attachment: {
        file: attachmentPath(sha, 'image/png'),
        mediaType: 'image/png',
        caption,
        bytes: bytes.length,
      },
    };
  };
  return {
    dashboard: shot('dashboard', 'The dashboard it built'),
    table: shot('table', 'The query result, as a table'),
    error: shot('error', 'The error page the panel showed'),
  };
}
