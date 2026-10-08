/**
 * What the agent did: a trial's transcript as a numbered timeline. Tool calls are blocks that open
 * to what they sent and got back; failed ones start open and stand out. Everything is text.
 */
import { Fragment } from 'preact';
import type { StoredMessage, StoredTrial } from '../../format/store.ts';
import { useResource } from '../hooks/use-resource.ts';
import { loadTranscript, MissingFileError } from '../lib/data.ts';
import { plural } from '../lib/format.ts';
import { type CallStep, type Step, timelineOf } from '../lib/timeline.ts';
import { countsOf } from '../lib/transcript.ts';
import { Section } from './layout.tsx';
import { Shots } from './shots.tsx';
import { Empty, Failure, Loading } from './states.tsx';

/** The section's title. */
const title = 'What the agent did';

/**
 * The timeline of a trial.
 *
 * @param props - The trial.
 * @returns The section.
 */
export function TranscriptSection(props: { readonly trial: StoredTrial }) {
  const { trial } = props;
  if (trial.transcript !== undefined) return <LoadedTranscript path={trial.transcript} />;
  const recorded = trial.transcriptMessages !== undefined;
  return (
    <Section title={title}>
      <Empty title={recorded ? 'The transcript was pruned.' : 'No transcript was recorded.'}>
        {recorded
          ? `It had ${plural(trial.transcriptMessages ?? 0, 'message')}. Retention removed it to keep the branch small.`
          : 'The harness did not write one for this trial.'}
      </Empty>
    </Section>
  );
}

/**
 * Loads and shows a kept transcript.
 *
 * @param props - The transcript's path.
 * @returns The section.
 */
function LoadedTranscript(props: { readonly path: string }) {
  const resource = useResource(props.path, loadTranscript);
  if (resource.state === 'ready') return <Timeline messages={resource.value} />;
  const gone = resource.state === 'error' && resource.error instanceof MissingFileError;
  return (
    <Section title={title}>
      {resource.state === 'loading' ? <Loading what="transcript" /> : null}
      {gone ? (
        <Empty title="The transcript file is gone.">
          It was probably pruned after this page's data was written.
        </Empty>
      ) : null}
      {resource.state === 'error' && !gone ? (
        <Failure error={resource.error} what="transcript" />
      ) : null}
    </Section>
  );
}

/**
 * A loaded transcript as a timeline, with its counts.
 *
 * @param props - The messages.
 * @returns The section.
 */
function Timeline(props: { readonly messages: readonly StoredMessage[] }) {
  const counts = countsOf(props.messages);
  const failed = counts.toolErrors > 0 ? `, ${counts.toolErrors} failed` : '';
  return (
    <Section
      title={title}
      hint={`${plural(counts.messages, 'step')}, ${plural(counts.toolCalls, 'tool call')}${failed}.`}
    >
      <ol class="timeline">
        {timelineOf(props.messages).map((step) => (
          <StepItem key={step.number} step={step} />
        ))}
      </ol>
    </Section>
  );
}

/**
 * The class of a step's number.
 *
 * @param step - The step.
 * @returns The class.
 */
function dotClass(step: Step): string {
  if (step.failed) return 'step-dot step-dot-failed';
  return step.who === 'You' ? 'step-dot step-dot-you' : 'step-dot';
}

/**
 * One step.
 *
 * @param props - The step.
 * @returns The step.
 */
function StepItem(props: { readonly step: Step }) {
  const { step } = props;
  return (
    <li class="step">
      <div class="step-rail">
        <span class={dotClass(step)}>{step.number}</span>
        <span class="step-line" />
      </div>
      <div class="step-body">
        <div class="step-head">
          <strong class="step-who">{step.who}</strong>
          {step.elapsed === undefined ? null : <span class="step-meta">{step.elapsed}</span>}
          {step.usage === '' ? null : <span class="step-meta step-usage">{step.usage}</span>}
        </div>
        <StepText step={step} />
        {step.calls.map((call) => (
          <Fragment key={call.key}>
            <ToolBlock call={call} />
            <Shots attachments={call.attachments} owner={call.name} />
          </Fragment>
        ))}
        <Shots attachments={step.attachments} owner={`step ${step.number}`} />
      </div>
    </li>
  );
}

/**
 * What a step said; a system prompt starts closed.
 *
 * @param props - The step.
 * @returns The text, or nothing when it said nothing.
 */
function StepText(props: { readonly step: Step }) {
  const { step } = props;
  if (step.text === '') return null;
  if (step.who !== 'System') return <p class="step-text">{step.text}</p>;
  return (
    <details class="step-system">
      <summary>System prompt, {plural(step.text.length, 'character')}</summary>
      <p class="step-text">{step.text}</p>
    </details>
  );
}

/**
 * One tool call, as a block that opens to what it sent and what it got back or its error.
 *
 * @param props - The call.
 * @returns The block.
 */
function ToolBlock(props: { readonly call: CallStep }) {
  const { call } = props;
  const status = [call.failed ? 'failed' : undefined, call.duration].filter((part) => part);
  return (
    <details class={call.failed ? 'tool tool-failed' : 'tool'} open={call.failed}>
      <summary>
        <svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span class="tool-name">{call.name}</span>
        <span class="tool-brief">{call.brief}</span>
        {status.length === 0 ? null : <span class="tool-status">{status.join(' · ')}</span>}
      </summary>
      <div class="tool-body">
        <div class="tool-pane">
          <span class="tool-pane-label">Sent</span>
          <pre class="code">{call.input === '' ? 'Nothing' : call.input}</pre>
        </div>
        <div class="tool-pane">
          <span class="tool-pane-label">{call.failed ? 'Error' : 'Got back'}</span>
          <pre class={call.failed ? 'code code-error' : 'code'}>
            {call.output === '' ? 'Nothing' : call.output}
          </pre>
        </div>
      </div>
    </details>
  );
}
