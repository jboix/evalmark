/**
 * One run: a facts line, then its cases in a table with their status, trials, failing checks, cost
 * and time, filtered and sorted from the query.
 */
import { baselineOf } from '../../format/compare.ts';
import type { Run, RunSummary, StoreIndex } from '../../format/store.ts';
import { Page } from '../components/layout.tsx';
import { Loaded } from '../components/states.tsx';
import { CaseCounts } from '../components/status.tsx';
import { Commit, Labels, RunFigures, RunLinks } from '../components/values.tsx';
import { useResource } from '../hooks/use-resource.ts';
import { loadRun } from '../lib/data.ts';
import { formatDateTime } from '../lib/format.ts';
import { links } from '../lib/route.ts';
import { baselineBranchOf, defaultBranch } from '../lib/runs.ts';
import { RunTable } from './run-table.tsx';
import type { ViewProps } from './view-props.ts';

/**
 * The run view.
 *
 * @param props - The index, the route and the hash.
 * @returns The view.
 */
export function RunView(props: ViewProps<'run'>) {
  const resource = useResource(props.route.runId, loadRun);
  return (
    <Loaded resource={resource} what="run">
      {(run) => (
        <RunPage run={run} index={props.index} query={props.route.query} hash={props.hash} />
      )}
    </Loaded>
  );
}

/**
 * The run it is compared with: the one before it on its branch, or the default branch for a pull
 * request, with the same labels when there is one.
 *
 * @param index - The index.
 * @param run - The run.
 * @returns The previous run, or `undefined`.
 */
function previousOf(index: StoreIndex, run: Run): RunSummary | undefined {
  const summary = index.runs.find((entry) => entry.id === run.id);
  if (summary === undefined) return undefined;
  return baselineOf(index.runs, summary, baselineBranchOf(summary, defaultBranch(index.runs)));
}

/**
 * The run's page, once it is loaded.
 *
 * @param props - The run, the index, the query and the current hash.
 * @returns The page.
 */
function RunPage(props: {
  readonly run: Run;
  readonly index: StoreIndex;
  readonly query: Readonly<Record<string, string>>;
  readonly hash: string;
}) {
  const { run } = props;
  const previous = previousOf(props.index, run);
  return (
    <Page
      above={<a href={links.runs()}>Runs</a>}
      title={`Run of ${formatDateTime(run.startedAt)}`}
      below={<RunFacts run={run} previous={previous} />}
    >
      <RunTable run={run} query={props.query} hash={props.hash} />
    </Page>
  );
}

/**
 * The run's facts in one line.
 *
 * @param props - The run and the run before it.
 * @returns The line.
 */
function RunFacts(props: { readonly run: Run; readonly previous: RunSummary | undefined }) {
  const { run, previous } = props;
  return (
    <p class="facts">
      <span>{run.source.branch ?? 'no branch'}</span>
      <Commit source={run.source} />
      <Labels labels={run.labels} />
      <RunLinks source={run.source} />
      <CaseCounts totals={run.totals} />
      <RunFigures totals={run.totals} />
      {previous === undefined ? null : (
        <a href={links.compare({ base: previous.id, head: run.id })}>
          Compare with the previous run
        </a>
      )}
    </p>
  );
}
