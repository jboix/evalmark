/**
 * A small PNG encoder for the demo's screenshots: an indexed image of a few colours, compressed
 * with `node:zlib`. Enough for flat drawings of a few kilobytes, with no dependency.
 */
import { deflateSync } from 'node:zlib';

/** A colour, as red, green and blue from 0 to 255. */
export type Rgb = readonly [number, number, number];

/** An image whose pixels are indexes into a palette of up to 256 colours. */
export interface IndexedImage {
  /** Its width in pixels. */
  readonly width: number;
  /** Its height in pixels. */
  readonly height: number;
  /** Its colours. */
  readonly palette: readonly Rgb[];
  /** One palette index per pixel, row by row. */
  readonly pixels: Uint8Array;
}

/** The eight bytes every PNG file starts with. */
const signature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

/** The CRC-32 table of the polynomial PNG uses. */
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

/**
 * The CRC-32 of some bytes, as PNG chunks carry it.
 *
 * @param bytes - The bytes.
 * @returns The checksum, unsigned.
 */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * One PNG chunk: its length, type, data and checksum.
 *
 * @param type - The chunk's four-letter type.
 * @param data - Its data.
 * @returns The chunk's bytes.
 */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const typed = new Uint8Array(4 + data.length);
  typed.set(new TextEncoder().encode(type));
  typed.set(data, 4);
  const bytes = new Uint8Array(12 + data.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  bytes.set(typed, 4);
  view.setUint32(8 + data.length, crc32(typed));
  return bytes;
}

/**
 * The image's header: its size, 8 bits per pixel, indexed colour.
 *
 * @param image - The image.
 * @returns The header's data.
 */
function header(image: IndexedImage): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, image.width);
  view.setUint32(4, image.height);
  data.set([8, 3, 0, 0, 0], 8);
  return data;
}

/**
 * The image's rows, each after a filter byte of 0, compressed.
 *
 * @param image - The image.
 * @returns The compressed data.
 */
function imageData(image: IndexedImage): Uint8Array {
  const rows = new Uint8Array(image.height * (image.width + 1));
  for (let row = 0; row < image.height; row += 1) {
    const start = row * image.width;
    rows.set(image.pixels.subarray(start, start + image.width), row * (image.width + 1) + 1);
  }
  return deflateSync(rows, { level: 9 });
}

/**
 * Encodes an indexed image as a PNG file.
 *
 * @param image - The image.
 * @returns The file's bytes.
 */
export function encodePng(image: IndexedImage): Uint8Array {
  const parts = [
    signature,
    chunk('IHDR', header(image)),
    chunk('PLTE', Uint8Array.from(image.palette.flat())),
    chunk('IDAT', imageData(image)),
    chunk('IEND', new Uint8Array()),
  ];
  const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}
