/**
 * Serving a folder over HTTP on the local machine, for the dashboard: `evalmark preview` and
 * `evalmark demo` both use it.
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer, type RequestListener } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream';

/** Content types of the dashboard's files; anything else is served as bytes. */
const contentTypes: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * The file a request path names inside the folder: `index.html` for a folder, nothing outside.
 *
 * @param folder - The served folder, resolved.
 * @param pathname - The request's path.
 * @returns The file's path, or `undefined` when there is no such file in the folder.
 */
export function fileFor(folder: string, pathname: string): string | undefined {
  let path: string;
  try {
    path = resolve(join(folder, decodeURIComponent(pathname)));
  } catch {
    return undefined;
  }
  if (path !== folder && !path.startsWith(`${folder}${sep}`)) return undefined;
  const stats = statSync(path, { throwIfNoEntry: false });
  if (stats?.isDirectory()) return fileFor(folder, join(pathname, 'index.html'));
  return stats?.isFile() ? path : undefined;
}

/**
 * The content type of a file. A gzipped transcript is plain bytes: the dashboard decompresses it
 * itself, so it is served without `Content-Encoding`.
 *
 * @param path - The file's path.
 * @returns The content type.
 */
export function contentTypeOf(path: string): string {
  if (path.endsWith('.gz')) return 'application/octet-stream';
  return contentTypes[extname(path)] ?? 'application/octet-stream';
}

/** A folder being served. */
export interface FolderServer {
  /** Where it listens, such as `http://127.0.0.1:4400/`. */
  readonly url: URL;
  /** Stops the server and drops its open connections. */
  readonly close: () => Promise<void>;
}

/**
 * Answers requests with the files of a folder: `index.html` for a folder, a 404 for anything
 * else, nothing outside it.
 *
 * @param folder - The folder.
 * @returns A request listener, for `node:http` or as a connect middleware.
 */
export function answerFrom(folder: string): RequestListener {
  const root = resolve(folder);
  return (request, response) => {
    const file = fileFor(root, new URL(request.url ?? '/', 'http://localhost').pathname);
    if (file === undefined) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentTypeOf(file), 'cache-control': 'no-store' });
    pipeline(createReadStream(file), response, () => response.destroy());
  };
}

/**
 * The URL of an address, with an IPv6 address in brackets.
 *
 * @param hostname - The address listened on.
 * @param port - The port.
 * @returns The URL.
 */
function urlOf(hostname: string, port: number): URL {
  return new URL(`http://${hostname.includes(':') ? `[${hostname}]` : hostname}:${port}/`);
}

/**
 * Serves a folder, on this machine only unless a host says otherwise.
 *
 * @param folder - The folder.
 * @param port - The port; `0` picks a free one.
 * @param hostname - The address to listen on, such as `0.0.0.0` for every interface.
 * @returns The server, once it listens: its `url` says where.
 */
export async function serveFolder(
  folder: string,
  port: number,
  hostname = '127.0.0.1',
): Promise<FolderServer> {
  const server = createServer(answerFrom(folder));
  await new Promise<void>((listening, failed) => {
    server.once('error', failed);
    server.listen(port, hostname, listening);
  });
  const { port: bound } = server.address() as AddressInfo;
  const close = () => {
    server.closeAllConnections();
    return new Promise<void>((closed) => server.close(() => closed()));
  };
  return { url: urlOf(hostname, bound), close };
}

/**
 * Reads a bare `--host`, as Vite does, as every interface: it gets the value `0.0.0.0` when no
 * address follows it.
 *
 * @param args - The command's arguments.
 * @returns The arguments, with an address after every `--host`.
 */
export function withHostValue(args: readonly string[]): string[] {
  return args.flatMap((arg, index) => {
    const next = args[index + 1];
    const bare = arg === '--host' && (next === undefined || next.startsWith('-'));
    return bare ? [arg, '0.0.0.0'] : [arg];
  });
}

/**
 * Reads a `--port` value.
 *
 * @param value - The value, as given.
 * @returns The port, from 0 (any free port) to 65535.
 * @throws When the value is not a port.
 */
export function portOf(value: string): number {
  const port = Number(value);
  if (!/^\d+$/.test(value) || port > 65_535) {
    throw new Error(`--port takes a number from 0 to 65535, not \`${value}\`.`);
  }
  return port;
}
