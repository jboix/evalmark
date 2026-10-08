/**
 * Links to where a run came from: its commit, its pull request and its workflow run.
 */
import type { Source } from '../../format/store.ts';

/** A link out of the dashboard. */
export interface SourceLink {
  /** What it shows, such as `a1b2c3d`. */
  readonly text: string;
  /** What it is, such as `Commit`. */
  readonly kind: string;
  /** Its address. */
  readonly href: string;
}

/**
 * The server a source's repository lives on: the workflow run's, or else GitHub.
 *
 * @param source - The source.
 * @returns The origin, such as `https://github.com`.
 */
function serverOf(source: Source): string {
  if (source.runUrl === undefined) return 'https://github.com';
  try {
    return new URL(source.runUrl).origin;
  } catch {
    return 'https://github.com';
  }
}

/**
 * Whether an address is safe to link to: http or https only.
 *
 * @param href - The address.
 * @returns `true` when it is.
 */
function isWebAddress(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * The links a source has.
 *
 * @param source - The run's source.
 * @returns The commit, pull request and workflow run links it can make.
 */
export function sourceLinks(source: Source): SourceLink[] {
  const links: SourceLink[] = [];
  const repository =
    source.repository === undefined ? undefined : `${serverOf(source)}/${source.repository}`;
  if (repository !== undefined && source.commit !== undefined) {
    links.push({
      kind: 'Commit',
      text: source.commit.slice(0, 7),
      href: `${repository}/commit/${source.commit}`,
    });
  }
  if (repository !== undefined && source.pullRequest !== undefined) {
    links.push({
      kind: 'Pull request',
      text: `#${source.pullRequest}`,
      href: `${repository}/pull/${source.pullRequest}`,
    });
  }
  if (source.runUrl !== undefined && isWebAddress(source.runUrl)) {
    links.push({ kind: 'Workflow run', text: 'Logs', href: source.runUrl });
  }
  return links;
}
