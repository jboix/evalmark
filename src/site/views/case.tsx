/**
 * One case over the window: what it asks, its tags, how often each check failed, and one row per
 * run with its trials, failing checks, cost and time.
 */
import type { Run, RunSummary, StoreIndex } from '../../format/store.ts';
import { Page, Section } from '../components/layout.tsx';
import { SelectionFilters, WindowFilter } from '../components/selection-filters.tsx';
import { Empty, Loaded } from '../components/states.tsx';
import { useRuns } from '../hooks/use-runs.ts';
import { type CheckCounts, checkCounts } from '../lib/checks.ts';
import { plural } from '../lib/format.ts';
import { links } from '../lib/route.ts';
import { type Selection, selectionOf, selectionQuery, selectRuns } from '../lib/selection.ts';
import { CaseRuns } from './case-runs.tsx';
import type { ViewProps } from './view-props.ts';

/**
 * The case view.
 *
 * @param props - The index, the route and the hash.
 * @returns The view.
 */
export function CaseView(props: ViewProps<'case'>) {
  const { index, route, hash } = props;
  const selection = selectionOf(route.query, index.runs);
  const runs = selectRuns(index.runs, selection).filter(
    (run) => run.cases[route.caseId] !== undefined,
  );
  const info = index.cases[route.caseId];
  return (
    <Page
      above={<a href={links.results(selectionQuery(selection))}>Results</a>}
      title={info?.title ?? route.caseId}
      below={<CaseTags id={route.caseId} tags={info?.tags ?? []} />}
    >
      <div class="filters">
        <SelectionFilters index={index} selection={selection} hash={hash} />
        <WindowFilter selection={selection} hash={hash} />
      </div>
      {runs.length === 0 ? (
        <Empty title="No run in these filters has this case." />
      ) : (
        <CaseBody index={index} runs={runs} caseId={route.caseId} selection={selection} />
      )}
    </Page>
  );
}

/**
 * The case's id and tags, under its title.
 *
 * @param props - The id and the tags.
 * @returns The line.
 */
function CaseTags(props: { readonly id: string; readonly tags: readonly string[] }) {
  return (
    <p class="facts">
      <span class="mono">{props.id}</span>
      {props.tags.map((tag) => (
        <span key={tag} class="tag">
          {tag}
        </span>
      ))}
    </p>
  );
}

/**
 * The case's definition, checks and runs, once the window's run files are loaded.
 *
 * @param props - The index, the window's runs that have the case, the case and the selection.
 * @returns The body.
 */
function CaseBody(props: {
  readonly index: StoreIndex;
  readonly runs: readonly RunSummary[];
  readonly caseId: string;
  readonly selection: Selection;
}) {
  const files = useRuns(props.runs.map((run) => run.id));
  return (
    <Loaded resource={files} what="runs of this case">
      {(loaded) => (
        <>
          <Definition runs={loaded} caseId={props.caseId} />
          <CaseRuns runs={props.runs} files={loaded} caseId={props.caseId} />
        </>
      )}
    </Loaded>
  );
}

/**
 * What the case asks, as the newest run has it, and how often each check failed.
 *
 * @param props - The window's run files, newest first, and the case.
 * @returns The sections.
 */
function Definition(props: { readonly runs: readonly Run[]; readonly caseId: string }) {
  const stored = props.runs[0]?.cases.find((entry) => entry.id === props.caseId);
  if (stored === undefined) return null;
  const counts = checkCounts(stored.checks ?? [], props.runs, props.caseId);
  return (
    <>
      {stored.input === undefined ? null : <blockquote class="quote">{stored.input}</blockquote>}
      {stored.description === undefined ? null : <p class="muted">{stored.description}</p>}
      <CheckList counts={counts} runs={props.runs.length} />
    </>
  );
}

/**
 * Each check with how many trials failed it.
 *
 * @param props - The counts and the number of runs they cover.
 * @returns The section.
 */
function CheckList(props: { readonly counts: CheckCounts; readonly runs: number }) {
  const { counts } = props;
  return (
    <Section title="Checks">
      <p class="count-line">
        Failures over {plural(counts.trials, 'trial')} in {plural(props.runs, 'run')}
        {counts.errored === 0 ? '' : `; ${plural(counts.errored, 'trial')} ended in an error`}.
      </p>
      <ul class="check-counts">
        {counts.checks.map((check) => (
          <li key={check.id}>
            <span class="check-name">
              {check.description ?? check.id}
              {check.description === undefined ? null : <span class="sub mono">{check.id}</span>}
            </span>
            <span class={check.failed > 0 ? 'num tone-bad' : 'num muted'}>
              {check.failed} of {check.trials} failed
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
