/**
 * Reading the stored data, relative to the page: the index, run files and gzipped transcripts.
 * Each file is fetched once per page load.
 */
import {
  type Branding,
  brandingFolder,
  brandingPath,
  defaultBranding,
  indexPath,
  type Run,
  runPath,
  type StoredMessage,
  type StoreIndex,
} from '../../format/store.ts';

/** A file that is not there: the dashboard shows it as missing, not as a failure. */
export class MissingFileError extends Error {
  /** The file's path. */
  readonly path: string;

  /**
   * @param path - The file's path.
   */
  constructor(path: string) {
    super(`${path} was not found.`);
    this.path = path;
    this.name = 'MissingFileError';
  }
}

/** Files already asked for, by path. */
const cache = new Map<string, Promise<unknown>>();

/**
 * Fetches a file, failing with a readable error.
 *
 * @param path - The path, relative to the page.
 * @returns The response, when it is a success.
 */
async function fetchFile(path: string): Promise<Response> {
  const response = await fetch(path, { cache: 'no-cache' });
  if (response.status === 404) throw new MissingFileError(path);
  if (!response.ok) throw new Error(`${path} could not be read (HTTP ${response.status}).`);
  return response;
}

/**
 * Whether bytes start with the gzip magic number.
 *
 * @param bytes - The bytes.
 * @returns `true` when they are gzipped.
 */
export function isGzip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/**
 * Reads JSON from bytes, decompressing them when they are gzipped. A host that already sent them
 * with `Content-Encoding: gzip` hands over plain JSON, which is read as it is.
 *
 * @param bytes - The bytes.
 * @returns The parsed JSON.
 */
export async function readMaybeGzipped(bytes: Uint8Array<ArrayBuffer>): Promise<unknown> {
  if (!isGzip(bytes)) return JSON.parse(new TextDecoder().decode(bytes));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).json();
}

/**
 * Fetches and parses a file once, keeping the promise for later calls.
 *
 * @param path - The path, relative to the page.
 * @param read - Reads the response.
 * @returns The parsed content.
 */
function once<T>(path: string, read: (response: Response) => Promise<unknown>): Promise<T> {
  const known = cache.get(path);
  if (known !== undefined) return known as Promise<T>;
  const loading = fetchFile(path).then(read);
  // A failed fetch is not kept, so retrying asks again.
  loading.catch(() => cache.delete(path));
  cache.set(path, loading);
  return loading as Promise<T>;
}

/**
 * The index: every run's summary.
 *
 * @returns The index.
 */
export function loadIndex(): Promise<StoreIndex> {
  return once(indexPath, (response) => response.json());
}

/**
 * One run, with its cases and trials.
 *
 * @param runId - The run's id.
 * @returns The run.
 */
export function loadRun(runId: string): Promise<Run> {
  return once(runPath(runId), (response) => response.json());
}

/**
 * A kept transcript.
 *
 * @param path - Its path, as the stored trial gives it.
 * @returns Its messages.
 */
export function loadTranscript(path: string): Promise<readonly StoredMessage[]> {
  return once(path, async (response) =>
    readMaybeGzipped(new Uint8Array(await response.arrayBuffer())),
  );
}

/**
 * The key of a list of runs, for `loadRunList`.
 *
 * @param runIds - The runs' ids.
 * @returns The ids joined by line breaks, which no run id has.
 */
export function runListKey(runIds: readonly string[]): string {
  return runIds.join('\n');
}

/**
 * Several runs, each fetched once.
 *
 * @param key - Their ids, as `runListKey` joins them.
 * @returns The runs, in the key's order.
 */
export function loadRunList(key: string): Promise<Run[]> {
  if (key === '') return Promise.resolve([]);
  return Promise.all(key.split('\n').map(loadRun));
}

/**
 * Reads a branding file's content, keeping only what has the right shape.
 *
 * @param data - The parsed file.
 * @returns The branding, the defaults filling what is missing.
 */
export function brandingOf(data: unknown): Branding {
  const value = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const text = (key: string, fallback: string) =>
    typeof value[key] === 'string' && value[key] !== '' ? (value[key] as string) : fallback;
  // Only a logo the action copied: a file in the branding folder, never another address.
  const logo =
    typeof value.logo === 'string' && value.logo.startsWith(`${brandingFolder}/`)
      ? value.logo
      : undefined;
  return {
    title: text('title', defaultBranding.title),
    subtitle: text('subtitle', defaultBranding.subtitle),
    ...(logo === undefined ? {} : { logo }),
  };
}

/**
 * The dashboard's title, subtitle and logo, as the action wrote them; the defaults when the file
 * is missing, as it is in folders written before branding existed.
 *
 * @returns The branding.
 */
export function loadBranding(): Promise<Branding> {
  return once<unknown>(brandingPath, (response) => response.json()).then(brandingOf, () =>
    brandingOf(undefined),
  );
}
