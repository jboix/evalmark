/**
 * A small zip reader: the central directory, ZIP64 included, and entries stored, deflated or
 * compressed with Zstandard, which is what Inspect AI writes in its `.eval` logs.
 */
import { inflateRawSync, zstdDecompressSync } from 'node:zlib';

/** One file of an archive, as the central directory describes it. */
interface ZipEntry {
  /** Its path in the archive. */
  readonly name: string;
  /** Its compression method: 0 stored, 8 deflate, 93 Zstandard. */
  readonly method: number;
  /** Its compressed size in bytes. */
  readonly compressedSize: number;
  /** Where its local header starts. */
  readonly localOffset: number;
}

/** A zip archive, read lazily. */
export interface ZipArchive {
  /** The paths of its files, in the central directory's order. */
  readonly names: readonly string[];
  /** Reads one file, decompressed. Throws when the archive has no such file. */
  readonly read: (name: string) => Buffer;
}

/** The largest 16-bit and 32-bit values, which mean "see the ZIP64 record". */
const max16 = 0xffff;
const max32 = 0xffffffff;

/** The signatures of the records the reader reads. */
const signatures = {
  local: 0x04034b50,
  central: 0x02014b50,
  end: 0x06054b50,
  end64: 0x06064b50,
  locator64: 0x07064b50,
} as const;

/**
 * Whether bytes start like a zip archive.
 *
 * @param bytes - The bytes.
 * @returns `true` when they start with a local file header.
 */
export function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/**
 * Finds the end of central directory record, scanning back over a possible comment.
 *
 * @param buffer - The archive.
 * @returns The record's offset.
 * @throws When there is none.
 */
function endRecordOffset(buffer: Buffer): number {
  const lowest = Math.max(0, buffer.length - 22 - max16);
  for (let offset = buffer.length - 22; offset >= lowest; offset--) {
    if (buffer.readUInt32LE(offset) === signatures.end) return offset;
  }
  throw new Error('This is not a zip archive: it has no end of central directory record.');
}

/**
 * Where the central directory starts and how many entries it has, from the ZIP64 record when the
 * classic one is saturated.
 *
 * @param buffer - The archive.
 * @returns The directory's offset and entry count.
 */
function directoryOf(buffer: Buffer): { offset: number; count: number } {
  const end = endRecordOffset(buffer);
  const count = buffer.readUInt16LE(end + 10);
  const offset = buffer.readUInt32LE(end + 16);
  if (count !== max16 && offset !== max32) return { offset, count };
  const locator = end - 20;
  if (locator < 0 || buffer.readUInt32LE(locator) !== signatures.locator64)
    return { offset, count };
  const end64 = Number(buffer.readBigUInt64LE(locator + 8));
  if (buffer.readUInt32LE(end64) !== signatures.end64) throw new Error('Broken ZIP64 record.');
  return {
    count: Number(buffer.readBigUInt64LE(end64 + 32)),
    offset: Number(buffer.readBigUInt64LE(end64 + 48)),
  };
}

/**
 * Reads the 64-bit sizes and offset of an entry from its ZIP64 extra field.
 *
 * @param extra - The entry's extra fields.
 * @param saturated - Which of its 32-bit fields are saturated, in the field's order.
 * @returns The 64-bit values, in the same order.
 */
function zip64Values(extra: Buffer, saturated: readonly boolean[]): (number | undefined)[] {
  let position = 0;
  while (position + 4 <= extra.length) {
    const id = extra.readUInt16LE(position);
    const size = extra.readUInt16LE(position + 2);
    if (id === 0x0001) {
      let cursor = position + 4;
      return saturated.map((isSaturated) => {
        if (!isSaturated) return undefined;
        const value = Number(extra.readBigUInt64LE(cursor));
        cursor += 8;
        return value;
      });
    }
    position += 4 + size;
  }
  return saturated.map(() => undefined);
}

/**
 * Reads one central directory entry.
 *
 * @param buffer - The archive.
 * @param offset - Where the entry starts.
 * @returns The entry and where the next one starts.
 * @throws When there is no entry there.
 */
function entryAt(buffer: Buffer, offset: number): { entry: ZipEntry; next: number } {
  if (buffer.readUInt32LE(offset) !== signatures.central) throw new Error('Broken zip directory.');
  const nameLength = buffer.readUInt16LE(offset + 28);
  const extraLength = buffer.readUInt16LE(offset + 30);
  const commentLength = buffer.readUInt16LE(offset + 32);
  const fields = [offset + 24, offset + 20, offset + 42].map((at) => buffer.readUInt32LE(at));
  const extraStart = offset + 46 + nameLength;
  const extra = buffer.subarray(extraStart, extraStart + extraLength);
  const [, compressed, local] = zip64Values(
    extra,
    fields.map((value) => value === max32),
  );
  const entry: ZipEntry = {
    name: buffer.toString('utf8', offset + 46, extraStart),
    method: buffer.readUInt16LE(offset + 10),
    compressedSize: compressed ?? fields[1] ?? 0,
    localOffset: local ?? fields[2] ?? 0,
  };
  return { entry, next: extraStart + extraLength + commentLength };
}

/**
 * Decompresses an entry's data.
 *
 * @param buffer - The archive.
 * @param entry - The entry.
 * @returns Its bytes.
 * @throws When its method is not stored, deflate or Zstandard.
 */
function dataOf(buffer: Buffer, entry: ZipEntry): Buffer {
  const local = entry.localOffset;
  if (buffer.readUInt32LE(local) !== signatures.local)
    throw new Error(`Broken entry ${entry.name}.`);
  const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
  const raw = buffer.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return raw;
  if (entry.method === 8) return inflateRawSync(raw);
  if (entry.method === 93) return zstdDecompressSync(raw);
  throw new Error(`${entry.name} uses compression method ${entry.method}, which is not supported.`);
}

/**
 * Opens a zip archive.
 *
 * @param buffer - The archive's bytes.
 * @returns The archive.
 * @throws When the bytes are not a readable zip archive.
 */
export function readZip(buffer: Buffer): ZipArchive {
  const { offset, count } = directoryOf(buffer);
  const entries = new Map<string, ZipEntry>();
  let position = offset;
  for (let index = 0; index < count; index++) {
    const { entry, next } = entryAt(buffer, position);
    entries.set(entry.name, entry);
    position = next;
  }
  return {
    names: [...entries.keys()],
    read: (name) => {
      const entry = entries.get(name);
      if (entry === undefined) throw new Error(`The archive has no ${name}.`);
      return dataOf(buffer, entry);
    },
  };
}
