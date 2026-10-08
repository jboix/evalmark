/**
 * The filters of a selection: the branch, each label key's value or every value, and the window.
 */

import type { StoreIndex } from '../../format/store.ts';
import { fieldName } from '../lib/format.ts';
import { branchesOf, filterKeysOf, labelParameter, labelValuesOf } from '../lib/runs.ts';
import { every, type Selection, windows, windowValue } from '../lib/selection.ts';
import { type Option, optionsOf, SelectFilter } from './filters.tsx';

/** What each window's option says. */
const windowNames: Readonly<Record<(typeof windows)[number], string>> = {
  '10': 'Last 10 runs',
  '20': 'Last 20 runs',
  '50': 'Last 50 runs',
  all: 'All runs',
};

/**
 * The options of a label key: every value, then each value on the branch, the chosen one kept
 * even when the branch does not have it.
 *
 * @param index - The index.
 * @param selection - The selection.
 * @param key - The label key.
 * @returns The options.
 */
function labelOptions(index: StoreIndex, selection: Selection, key: string): Option[] {
  const onBranch = index.runs.filter(
    (run) => selection.branch === undefined || run.source.branch === selection.branch,
  );
  const chosen = selection.labels[key];
  const values = labelValuesOf(onBranch, key);
  if (chosen !== undefined && !values.includes(chosen)) values.push(chosen);
  return optionsOf(values, 'All', every);
}

/**
 * The selection's branch and label filters, each bound to the query.
 *
 * @param props - The index, the selection and the current hash.
 * @returns The controls.
 */
export function SelectionFilters(props: {
  readonly index: StoreIndex;
  readonly selection: Selection;
  readonly hash: string;
}) {
  const { index, selection, hash } = props;
  const branches = branchesOf(index.runs).map((entry) => entry.value);
  return (
    <>
      <SelectFilter
        label="Branch"
        name="branch"
        value={selection.branch ?? every}
        options={optionsOf(branches, 'Every branch', every)}
        hash={hash}
      />
      {filterKeysOf(index.runs).map((key) => (
        <SelectFilter
          key={key}
          label={fieldName(key)}
          name={labelParameter(key)}
          value={selection.labels[key] ?? every}
          options={labelOptions(index, selection, key)}
          hash={hash}
        />
      ))}
    </>
  );
}

/**
 * The window filter, bound to the query.
 *
 * @param props - The selection and the current hash.
 * @returns The control.
 */
export function WindowFilter(props: { readonly selection: Selection; readonly hash: string }) {
  return (
    <SelectFilter
      label="Window"
      name="window"
      value={windowValue(props.selection.window)}
      options={windows.map((value) => ({ value, text: windowNames[value] }))}
      hash={props.hash}
    />
  );
}
