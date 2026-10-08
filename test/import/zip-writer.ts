/**
 * A tiny zip writer for the tests: builds `.eval` archives as Inspect AI writes them, with stored,
 * deflated or Zstandard entries.
 */
import { crc32, deflateRawSync, zstdCompressSync } from 'node:zlib';

/** One file to write. */
export interface ZipFile {
  /** Its path in the archive. */
  readonly name: string;
  /** Its content. */
  readonly content: string;
  /** Its compression method: 0 stored, 8 deflate, 93 Zstandard. */
  readonly method?: 0 | 8 | 93 | undefined;
}

/**
 * Compresses a file's content with its method.
 *
 * @param data - The content.
 * @param method - The method.
 * @returns The compressed bytes.
 */
function compress(data: Buffer, method: 0 | 8 | 93): Buffer {
  if (method === 8) return deflateRawSync(data);
  if (method === 93) return zstdCompressSync(data);
  return data;
}

/**
 * Writes a zip archive.
 *
 * @param files - The files.
 * @param comment - An archive comment, to test that the reader finds the end record before it.
 * @returns The archive's bytes.
 */
export function writeZip(files: readonly ZipFile[], comment = ''): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const method = file.method ?? 8;
    const name = Buffer.from(file.name);
    const data = Buffer.from(file.content);
    const compressed = compress(data, method);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method === 93 ? 63 : 20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(63, 4);
    central.writeUInt16LE(method === 93 ? 63 : 20, 6);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc32(data), 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, compressed);
    centrals.push(central, name);
    offset += local.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(centrals);
  const commentBytes = Buffer.from(comment);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(commentBytes.length, 20);
  return Buffer.concat([...locals, directory, end, commentBytes]);
}
