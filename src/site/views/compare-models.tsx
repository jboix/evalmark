/**
 * The values of a label compared, such as models: each value's totals, then every case by value.
 */
import type { StoreIndex } from '../../format/store.ts';
import { optionsOf, SelectFilter } from '../components/filters.tsx';
import { Section } from '../components/layout.tsx';
import { WindowFilter } from '../components/selection-filters.tsx';
import { Empty } from '../components/states.tsx';
import { TableBox } from '../components/table.tsx';
import { Figure } from '../components/values.tsx';
import type { CaseFilters } from '../lib/case-rows.ts';
import { fieldName, formatCost, formatDuration, formatPercent } from '../lib/format.ts';
import type { ValueTotals } from '../lib/matrix.ts';
import { valueTotals } from '../lib/matrix.ts';
import { branchesOf, filterKeysOf } from '../lib/runs.ts';
import {
  every,
  type Selection,
  selectionOf,
  selectionQuery,
  selectRuns,
} from '../lib/selection.ts';
import { MatrixTable } from './results-matrix.tsx';
import type { ViewProps } from './view-props.ts';

/** Every case, whatever its status, tag or text. */
const noCaseFilter: CaseFilters = { status: 'all', tag: '', search: '' };

/**
 * The models mode.
 *
 * @param props - The index, the route and the hash.
 * @returns The filters, the totals and the matrix.
 */
export function CompareModels(props: ViewProps<'compare'>) {
  const { index, route, hash } = props;
  const keys = filterKeysOf(index.runs);
  const key = keys.find((candidate) => candidate === route.query.key) ?? keys[0];
  if (key === undefined) {
    return (
      <Empty title="The runs have no labels to compare.">
        Record runs with labels such as model.
      </Empty>
    );
  }
  const chosen = selectionOf(route.query, index.runs);
  const selection: Selection = { ...chosen, labels: {}, open: [key] };
  const runs = selectRuns(index.runs, selection);
  const scope = { runs, cases: index.cases, filters: noCaseFilter, query: route.query, hash };
  return (
    <>
      <ModelFilters index={index} selection={selection} labelKey={key} hash={hash} />
      {runs.length === 0 ? (
        <Empty title="No run matches these filters." />
      ) : (
        <>
          <TotalsTable totals={valueTotals(runs, key)} labelKey={key} />
          <MatrixTable scope={{ ...scope, caseQuery: selectionQuery(selection) }} labelKey={key} />
        </>
      )}
    </>
  );
}

/**
 * The models mode's filters: the branch, the label key when there is more than one, and the
 * window.
 *
 * @param props - The index, the selection, the label key and the current hash.
 * @returns The filters.
 */
function ModelFilters(props: {
  readonly index: StoreIndex;
  readonly selection: Selection;
  readonly labelKey: string;
  readonly hash: string;
}) {
  const { index, selection, hash } = props;
  const branches = branchesOf(index.runs).map((entry) => entry.value);
  const keys = filterKeysOf(index.runs);
  return (
    <div class="filters">
      <SelectFilter
        label="Branch"
        name="branch"
        value={selection.branch ?? every}
        options={optionsOf(branches, 'Every branch', every)}
        hash={hash}
      />
      {keys.length < 2 ? null : (
        <SelectFilter
          label="Compare by"
          name="key"
          value={props.labelKey}
          options={keys.map((key) => ({ value: key, text: fieldName(key) }))}
          hash={hash}
        />
      )}
      <WindowFilter selection={selection} hash={hash} />
    </div>
  );
}

/**
 * Each value's totals: runs, pass rate, cost and duration per run.
 *
 * @param props - The totals and the label key.
 * @returns The section.
 */
function TotalsTable(props: {
  readonly totals: readonly ValueTotals[];
  readonly labelKey: string;
}) {
  return (
    <Section title="Totals">
      <TableBox>
        <table class="table">
          <thead>
            <tr>
              <th scope="col">{fieldName(props.labelKey)}</th>
              <th scope="col" class="num">
                Runs
              </th>
              <th scope="col" class="num">
                Pass rate
              </th>
              <th scope="col" class="num">
                Cost per run
              </th>
              <th scope="col" class="num">
                Duration per run
              </th>
            </tr>
          </thead>
          <tbody>
            {props.totals.map((entry) => (
              <tr key={entry.value}>
                <th scope="row">{entry.value}</th>
                <td class="num">{entry.runs}</td>
                <td class="num">{formatPercent(entry.passRate)}</td>
                <td class="num">
                  <Figure value={entry.costPerRun} format={formatCost} />
                </td>
                <td class="num">
                  <Figure value={entry.durationPerRun} format={formatDuration} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableBox>
    </Section>
  );
}
