/**
 * A case's runs over the window: one row per run, newest first, with its trials, the checks that
 * failed, and what it cost.
 */
import type { Run, RunSummary } from '../../format/store.ts';
import { Section } from '../components/layout.tsx';
import { TrialMarks } from '../components/status.tsx';
import { TableBox } from '../components/table.tsx';
import { Commit, Figure, Labels, When } from '../components/values.tsx';
import { formatCost, formatDuration } from '../lib/format.ts';
import { links } from '../lib/route.ts';
import { caseUsage, failingChecks } from '../lib/run.ts';

/**
 * The runs table.
 *
 * @param props - The runs, newest first, their files in the same order, and the case.
 * @returns The section.
 */
export function CaseRuns(props: {
  readonly runs: readonly RunSummary[];
  readonly files: readonly Run[];
  readonly caseId: string;
}) {
  return (
    <Section title="Runs">
      <TableBox legend={true}>
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Commit</th>
              <th scope="col">Labels</th>
              <th scope="col">Trials</th>
              <th scope="col">Failing checks</th>
              <th scope="col" class="num">
                Cost
              </th>
              <th scope="col" class="num">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {props.runs.map((run, position) => (
              <CaseRunLine
                key={run.id}
                run={run}
                file={props.files[position]}
                caseId={props.caseId}
              />
            ))}
          </tbody>
        </table>
      </TableBox>
    </Section>
  );
}

/**
 * One run of the case.
 *
 * @param props - The run, its file, and the case.
 * @returns The row.
 */
function CaseRunLine(props: {
  readonly run: RunSummary;
  readonly file: Run | undefined;
  readonly caseId: string;
}) {
  const { run, caseId } = props;
  const stored = props.file?.cases.find((entry) => entry.id === caseId);
  const usage = stored === undefined ? undefined : caseUsage(stored.trials);
  const failing = stored === undefined ? [] : failingChecks(stored.trials);
  return (
    <tr>
      <th scope="row">
        <a href={links.run(run.id)}>
          <When iso={run.startedAt} />
        </a>
      </th>
      <td>
        <Commit source={run.source} />
      </td>
      <td>
        <Labels labels={run.labels} />
      </td>
      <td>
        <TrialMarks runId={run.id} caseId={caseId} letters={run.cases[caseId] ?? ''} />
      </td>
      <td class="wrap">{failing.map((check) => check.id).join(', ')}</td>
      <td class="num">
        <Figure value={usage?.costUsd} format={formatCost} />
      </td>
      <td class="num">
        <Figure value={usage?.durationMs} format={formatDuration} />
      </td>
    </tr>
  );
}
