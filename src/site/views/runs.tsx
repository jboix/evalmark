/**
 * The runs: every run the filters keep, in a sortable table, two of them picked to compare.
 */

import { useState } from 'preact/hooks';
import type { RunSummary } from '../../format/store.ts';
import { DateFilter, optionsOf, SelectFilter } from '../components/filters.tsx';
import { Page } from '../components/layout.tsx';
import { NoMatch } from '../components/states.tsx';
import { CountLine } from '../components/table.tsx';
import { fieldName } from '../lib/format.ts';
import { links } from '../lib/route.ts';
import {
  branchesOf,
  filterKeysOf,
  filterRuns,
  labelParameter,
  labelValuesOf,
  runFiltersOf,
} from '../lib/runs.ts';
import { RunsTable } from './runs-table.tsx';
import type { ViewProps } from './view-props.ts';

/**
 * The runs view.
 *
 * @param props - The index, the route and the hash.
 * @returns The view.
 */
export function Runs(props: ViewProps<'runs'>) {
  const { index, route, hash } = props;
  const runs = filterRuns(index.runs, runFiltersOf(route.query));
  const [picked, setPicked] = useState<readonly string[]>([]);
  const toggle = (runId: string) =>
    setPicked((current) =>
      current.includes(runId)
        ? current.filter((id) => id !== runId)
        : [...current.slice(-1), runId],
    );
  return (
    <Page title="Runs">
      <RunFiltersBar runs={index.runs} query={route.query} hash={hash} />
      <CountLine total={index.runs.length} shown={runs.length} noun="run" />
      <CompareBar runs={index.runs} picked={picked} clear={() => setPicked([])} />
      {runs.length === 0 ? (
        <NoMatch what="runs" clear={links.runs()} />
      ) : (
        <RunsTable runs={runs} query={route.query} hash={hash} picked={{ ids: picked, toggle }} />
      )}
    </Page>
  );
}

/**
 * The filters: branch, each label key, and a date range.
 *
 * @param props - Every run, the query and the hash.
 * @returns The bar.
 */
function RunFiltersBar(props: {
  readonly runs: readonly RunSummary[];
  readonly query: Readonly<Record<string, string>>;
  readonly hash: string;
}) {
  const { runs, query, hash } = props;
  const branches = branchesOf(runs).map((branch) => branch.value);
  return (
    <div class="filters">
      <SelectFilter
        label="Branch"
        name="branch"
        value={query.branch ?? ''}
        options={optionsOf(branches, 'Every branch')}
        hash={hash}
      />
      {filterKeysOf(runs).map((key) => (
        <SelectFilter
          key={key}
          label={fieldName(key)}
          name={labelParameter(key)}
          value={query[labelParameter(key)] ?? ''}
          options={optionsOf(labelValuesOf(runs, key), 'All')}
          hash={hash}
        />
      ))}
      <DateFilter label="From" name="from" value={query.from ?? ''} hash={hash} />
      <DateFilter label="To" name="to" value={query.to ?? ''} hash={hash} />
    </div>
  );
}

/**
 * The bar that compares the two picked runs, the older as the base.
 *
 * @param props - Every run, the picked ids, and a way to clear them.
 * @returns The bar.
 */
function CompareBar(props: {
  readonly runs: readonly RunSummary[];
  readonly picked: readonly string[];
  readonly clear: () => void;
}) {
  const picked = props.runs.filter((run) => props.picked.includes(run.id));
  const [head, base] = picked;
  return (
    <div class="compare-bar" aria-live="polite">
      {picked.length === 0 ? <span>Tick two runs to compare them.</span> : null}
      {picked.length === 1 ? <span>One run ticked. Tick another to compare.</span> : null}
      {head !== undefined && base !== undefined ? (
        <a href={links.compare({ base: base.id, head: head.id })}>Compare the two runs</a>
      ) : null}
      {picked.length > 0 ? (
        <button type="button" class="link-button" onClick={props.clear}>
          Clear
        </button>
      ) : null}
    </div>
  );
}
