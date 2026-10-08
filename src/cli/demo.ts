/**
 * `evalmark demo`: records a synthetic history into a local folder with the action's store, one run
 * at a time as the action would, and serves the dashboard on it.
 */
import { rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { type AttachmentFiles, loadAttachments } from '../action/attachment-files.ts';
import type { RunDraft } from '../action/build-run.ts';
import { readInputs } from '../action/inputs.ts';
import { defaultSiteDir } from '../action/site.ts';
import { runIdOf } from '../action/source.ts';
import { type StoreOptions, storeRun } from '../action/store.ts';
import type { Source } from '../format/store.ts';
import { type DemoRun, demoHistory } from './demo-data.ts';
import { writeScreenshots } from './demo-screenshot.ts';
import { portOf, serveFolder, withHostValue } from './serve.ts';

/** How `evalmark demo` is called. */
export const demoUsage =
  'evalmark demo [--dir .demo] [--host [address]] [--port 4400] [--no-serve]';

/** The repository the demo pretends to be. */
const repository = 'acme/dashboard-agent';

/**
 * A demo run as the action would draft it, with a workflow run number of its own.
 *
 * @param demo - The demo run.
 * @param number - Its position in the history, used as its workflow run id.
 * @param attachmentFiles - Its screenshots, found next to its result.
 * @returns The draft.
 */
function draftOf(demo: DemoRun, number: number, attachmentFiles: AttachmentFiles): RunDraft {
  const runId = String(9_000_000 + number);
  const source: Source = {
    repository,
    commit: demo.source.commit,
    branch: demo.source.branch,
    ...(demo.source.pullRequest === undefined ? {} : { pullRequest: demo.source.pullRequest }),
    event: demo.source.pullRequest === undefined ? 'push' : 'pull_request',
    runUrl: `https://github.com/${repository}/actions/runs/${runId}`,
    actor: 'octocat',
  };
  return {
    result: demo.result,
    id: runIdOf(demo.result.startedAt ?? demo.recordedAt, { GITHUB_RUN_ID: runId }),
    suite: demo.result.suite ?? 'agent',
    source,
    recordedAt: demo.recordedAt,
    transcripts: 'all',
    attachments: readInputs({}).attachments,
    attachmentFiles,
  };
}

/**
 * Records the whole demo history into a fresh folder. The screenshots are written into a
 * temporary folder, which stands for the folder of each run's result, and removed afterwards.
 *
 * @param folder - The folder, emptied first.
 * @param siteDir - The built dashboard's folder.
 * @returns How many runs it recorded.
 */
export async function recordDemo(folder: string, siteDir = defaultSiteDir()): Promise<number> {
  rmSync(folder, { recursive: true, force: true });
  const results = await mkdtemp(join(tmpdir(), 'evalmark-demo-'));
  try {
    await writeScreenshots(results);
    const history = demoHistory({ end: new Date() });
    for (const [number, demo] of history.entries()) {
      const { files } = await loadAttachments(demo.result, results);
      await storeRun(folder, draftOf(demo, number, files), storeOptions(siteDir, demo));
    }
    return history.length;
  } finally {
    await rm(results, { recursive: true, force: true });
  }
}

/**
 * How the demo records a run: every run and its transcripts on 30 runs, and the action's
 * defaults for attachments.
 *
 * @param siteDir - The built dashboard's folder.
 * @param demo - The run.
 * @returns The store's options.
 */
function storeOptions(siteDir: string, demo: DemoRun): StoreOptions {
  return {
    keepRuns: 0,
    keepDays: 0,
    keepTranscripts: 30,
    keepAttachments: readInputs({}).keepAttachments,
    badges: true,
    defaultBranch: 'main',
    siteDir,
    now: new Date(demo.recordedAt),
  };
}

/**
 * Records the demo history and serves it.
 *
 * @param args - The command's arguments.
 * @returns When the history is recorded and the server started.
 */
export async function demoCommand(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args: withHostValue(args),
    options: {
      dir: { type: 'string', default: '.demo' },
      host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '4400' },
      'no-serve': { type: 'boolean', default: false },
    },
  });
  const port = portOf(values.port);
  const folder = resolve(values.dir);
  const count = await recordDemo(folder);
  process.stdout.write(`Recorded ${count} demo runs into ${folder}.\n`);
  if (values['no-serve']) return;
  const server = await serveFolder(folder, port, values.host);
  process.stdout.write(`The dashboard is on ${server.url}\n`);
}
