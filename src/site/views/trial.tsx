/**
 * One trial: the case's other trials, what the agent did as a timeline, and beside it the checks,
 * what it said at the end, and what it spent.
 */
import type { Run, StoredCase, StoredTrial } from '../../format/store.ts';
import { Page } from '../components/layout.tsx';
import { Empty, Loaded } from '../components/states.tsx';
import { Mark } from '../components/status.tsx';
import { TranscriptSection } from '../components/transcript.tsx';
import { useResource } from '../hooks/use-resource.ts';
import { loadRun } from '../lib/data.ts';
import { formatDateTime } from '../lib/format.ts';
import { markOfTrial, markWords } from '../lib/marks.ts';
import { links } from '../lib/route.ts';
import { runSelectionQuery } from '../lib/selection.ts';
import { TrialSide } from './trial-side.tsx';
import type { ViewProps } from './view-props.ts';

/**
 * The trial view.
 *
 * @param props - The index, the route and the hash.
 * @returns The view.
 */
export function TrialView(props: ViewProps<'trial'>) {
  const { route } = props;
  const resource = useResource(route.runId, loadRun);
  return (
    <Loaded resource={resource} what="run">
      {(run) => {
        const stored = run.cases.find((entry) => entry.id === route.caseId);
        const trial = stored?.trials[route.trial];
        if (stored === undefined || trial === undefined) {
          return (
            <Empty title="This trial is not in the run.">
              <a href={links.run(run.id)}>Back to the run</a>
            </Empty>
          );
        }
        return <TrialPage run={run} stored={stored} trial={trial} index={route.trial} />;
      }}
    </Loaded>
  );
}

/**
 * The trial's page.
 *
 * @param props - The run, the case, the trial and its index.
 * @returns The page.
 */
function TrialPage(props: {
  readonly run: Run;
  readonly stored: StoredCase;
  readonly trial: StoredTrial;
  readonly index: number;
}) {
  const { run, stored, trial } = props;
  return (
    <Page
      above={
        <>
          <a href={links.run(run.id)}>Run of {formatDateTime(run.startedAt)}</a>
          {' / '}
          <a href={links.case(stored.id, runSelectionQuery(run))}>Case history</a>
        </>
      }
      title={stored.title ?? stored.id}
      below={stored.input === undefined ? undefined : <p class="input-text">{stored.input}</p>}
    >
      <TrialPicker run={run} stored={stored} current={props.index} />
      <div class="trial-layout">
        <div class="trial-main">
          <TranscriptSection trial={trial} />
        </div>
        <TrialSide stored={stored} trial={trial} index={props.index} />
      </div>
    </Page>
  );
}

/**
 * The case's trials in the run, the shown one marked.
 *
 * @param props - The run, the case and the shown trial.
 * @returns The picker.
 */
function TrialPicker(props: {
  readonly run: Run;
  readonly stored: StoredCase;
  readonly current: number;
}) {
  // A trial's place never changes, so it serves as its key.
  const trials = props.stored.trials.map((trial, index) => ({ trial, index }));
  return (
    <nav class="picks" aria-label="Trials of this case">
      {trials.map(({ trial, index }) => (
        <a
          key={`t${index}`}
          class="pick"
          href={links.trial(props.run.id, props.stored.id, index)}
          aria-current={index === props.current ? 'page' : undefined}
        >
          <Mark kind={markOfTrial(trial.status)} />
          Trial {index + 1}
          <span class="visually-hidden">: {markWords[markOfTrial(trial.status)]}</span>
        </a>
      ))}
    </nav>
  );
}
