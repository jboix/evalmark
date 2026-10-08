/**
 * Where a run comes from: the workflow's `GITHUB_*` variables and its event payload give the
 * repository, commit, branch, pull request and workflow run, and the run's id.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Source } from '../format/store.ts';
import type { Environment } from './inputs.ts';

/** What the action needs from the event payload. */
export interface EventContext {
  /** The event's name, such as `push`. */
  readonly name: string | undefined;
  /** The pull request's number, on a pull request event. */
  readonly pullRequest: number | undefined;
  /** The pull request's base branch. */
  readonly baseBranch: string | undefined;
  /** The pull request's head commit. */
  readonly headCommit: string | undefined;
  /** Whether the pull request comes from another repository. */
  readonly fork: boolean;
  /** The repository's default branch. */
  readonly defaultBranch: string | undefined;
}

/** The parts of a payload the action reads. */
interface Payload {
  /** The pull request, on a pull request event. */
  readonly pull_request?: {
    readonly number?: number;
    readonly base?: { readonly ref?: string; readonly repo?: { readonly full_name?: string } };
    readonly head?: { readonly sha?: string; readonly repo?: { readonly full_name?: string } };
  };
  /** The repository. */
  readonly repository?: { readonly default_branch?: string };
}

/** The events that run on a pull request. */
const pullRequestEvents: ReadonlySet<string> = new Set(['pull_request', 'pull_request_target']);

/**
 * Reads the event payload, or an empty one when there is none or it is not JSON.
 *
 * @param env - The environment.
 * @returns The payload.
 */
function readPayload(env: Environment): Payload {
  const path = env.GITHUB_EVENT_PATH;
  if (!path) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Payload;
  } catch {
    return {};
  }
}

/**
 * The event's context.
 *
 * @param env - The environment.
 * @returns What the action needs from the event.
 */
export function readEvent(env: Environment): EventContext {
  const payload = readPayload(env);
  const name = env.GITHUB_EVENT_NAME;
  const pullRequest = pullRequestEvents.has(name ?? '') ? payload.pull_request : undefined;
  const headRepository = pullRequest?.head?.repo?.full_name;
  const baseRepository = pullRequest?.base?.repo?.full_name;
  return {
    name,
    pullRequest: pullRequest?.number,
    baseBranch: pullRequest?.base?.ref,
    headCommit: pullRequest?.head?.sha,
    fork: headRepository !== undefined && headRepository !== baseRepository,
    defaultBranch: payload.repository?.default_branch,
  };
}

/**
 * Drops the keys whose value is `undefined` or empty.
 *
 * @param source - The source with every key.
 * @returns The source with the known ones.
 */
function compact(source: Record<string, string | number | undefined>): Source {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ''),
  ) as Source;
}

/**
 * Where the run comes from.
 *
 * @param env - The environment.
 * @param event - The event's context.
 * @returns The source, with the fields that are known.
 */
export function sourceOf(env: Environment, event: EventContext): Source {
  const onPullRequest = event.pullRequest !== undefined;
  const runUrl =
    env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
      : undefined;
  return compact({
    repository: env.GITHUB_REPOSITORY,
    commit: (onPullRequest ? event.headCommit : undefined) ?? env.GITHUB_SHA,
    branch: (onPullRequest ? env.GITHUB_HEAD_REF : undefined) || env.GITHUB_REF_NAME,
    pullRequest: event.pullRequest,
    event: event.name,
    runUrl,
    actor: env.GITHUB_ACTOR,
  });
}

/**
 * A run's id: its start time, then the workflow run and attempt, or a random suffix outside
 * Actions. It is safe in a path and a URL.
 *
 * @param startedAt - When the run started, as an ISO time.
 * @param env - The environment.
 * @returns The id, such as `20261008T100000Z-1234567-1`.
 */
export function runIdOf(startedAt: string, env: Environment): string {
  const time = new Date(startedAt).toISOString().replace(/\.\d+Z$/, 'Z');
  const stamp = time.replaceAll('-', '').replaceAll(':', '');
  const suffix = env.GITHUB_RUN_ID
    ? `${env.GITHUB_RUN_ID}-${env.GITHUB_RUN_ATTEMPT ?? '1'}`
    : randomBytes(4).toString('hex');
  return `${stamp}-${suffix}`.replace(/[^A-Za-z0-9.-]/g, '_');
}
