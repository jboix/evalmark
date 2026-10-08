/**
 * Compare: two runs case by case, or the values of a label, such as models, side by side.
 */
import { Segmented } from '../components/filters.tsx';
import { Page } from '../components/layout.tsx';
import { CompareModels } from './compare-models.tsx';
import { CompareRuns } from './compare-runs.tsx';
import type { ViewProps } from './view-props.ts';

/** The modes. */
const modes = [
  { value: 'runs', text: 'Two runs' },
  { value: 'models', text: 'Models' },
];

/**
 * The compare view.
 *
 * @param props - The index, the route and the hash.
 * @returns The view.
 */
export function Compare(props: ViewProps<'compare'>) {
  const mode = props.route.query.mode === 'models' ? 'models' : 'runs';
  return (
    <Page title="Compare">
      <Segmented label="Mode" name="mode" value={mode} options={modes} hash={props.hash} />
      {mode === 'models' ? <CompareModels {...props} /> : <CompareRuns {...props} />}
    </Page>
  );
}
