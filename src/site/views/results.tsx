/**
 * The results page, the home: the branch, label and window filters, a summary line of the newest
 * run they keep, the trend, then the status, tag and search filters right above the table they
 * narrow, and the table of every case over the window, or of every case by label value when a label is set to
 * every value.
 */
import type { StoreIndex } from '../../format/store.ts';
import { optionsOf, SearchFilter, SelectFilter } from '../components/filters.tsx';
import { Page } from '../components/layout.tsx';
import { SelectionFilters, WindowFilter } from '../components/selection-filters.tsx';
import { Empty } from '../components/states.tsx';
import { useRuns } from '../hooks/use-runs.ts';
import { type CaseFilters, caseFiltersOf, tagsOf, usageByRun } from '../lib/case-rows.ts';
import { selectionOf, selectionQuery, selectRuns } from '../lib/selection.ts';
import { MatrixTable } from './results-matrix.tsx';
import type { ResultsScope } from './results-scope.ts';
import { ResultsTrend, SummaryText } from './results-summary.tsx';
import { CaseTable } from './results-table.tsx';
import type { ViewProps } from './view-props.ts';

/** What each status filter's option says. */
const statusOptions = [
  { value: 'all', text: 'All' },
  { value: 'failing', text: 'Failing' },
  { value: 'flaky', text: 'Flaky' },
  { value: 'passing', text: 'Passing' },
  { value: 'not-run', text: 'Not run' },
];

/**
 * The results view.
 *
 * @param props - The index, the route and the hash.
 * @returns The view.
 */
export function Results(props: ViewProps<'results'>) {
  const { index, route, hash } = props;
  const selection = selectionOf(route.query, index.runs);
  const runs = selectRuns(index.runs, selection);
  const filters = caseFiltersOf(route.query);
  return (
    <Page title="Results">
      <div class="filters">
        <SelectionFilters index={index} selection={selection} hash={hash} />
        <WindowFilter selection={selection} hash={hash} />
      </div>
      {runs.length === 0 ? (
        <Empty title="No run matches these filters.">
          Pick another branch or label value, or every one.
        </Empty>
      ) : (
        <ResultsBody scope={{ index, runs, selection, filters, query: route.query, hash }} />
      )}
    </Page>
  );
}

/**
 * The status, tag and search filters.
 *
 * @param props - The index, the filters and the current hash.
 * @returns The controls.
 */
function CaseFilterControls(props: {
  readonly index: StoreIndex;
  readonly filters: CaseFilters;
  readonly hash: string;
}) {
  const tags = tagsOf(props.index.cases);
  return (
    <>
      <SelectFilter
        label="Status"
        name="status"
        value={props.filters.status}
        options={statusOptions}
        hash={props.hash}
      />
      {tags.length === 0 ? null : (
        <SelectFilter
          label="Tag"
          name="tag"
          value={props.filters.tag}
          options={optionsOf(tags, 'All')}
          hash={props.hash}
        />
      )}
      <SearchFilter
        label="Search"
        name="q"
        value={props.filters.search}
        placeholder="Title, id or tag"
        hash={props.hash}
      />
    </>
  );
}

/**
 * The summary line, the trend and the table, once the selection keeps runs.
 *
 * @param props - The page's scope.
 * @returns The page's body.
 */
function ResultsBody(props: { readonly scope: ResultsScope }) {
  const { scope } = props;
  const split = scope.selection.open[0];
  const files = useRuns(split === undefined ? scope.runs.map((run) => run.id) : []);
  const usage = files.state === 'ready' ? usageByRun(files.value) : undefined;
  return (
    <>
      <SummaryText runs={scope.runs} />
      <ResultsTrend scope={scope} split={split} />
      <div class="filters table-tools">
        <CaseFilterControls index={scope.index} filters={scope.filters} hash={scope.hash} />
      </div>
      {split === undefined ? (
        <CaseTable scope={scope} usage={usage} usageState={files.state} />
      ) : (
        <MatrixTable
          scope={{ ...scope, cases: scope.index.cases, caseQuery: selectionQuery(scope.selection) }}
          labelKey={split}
        />
      )}
    </>
  );
}
