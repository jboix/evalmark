/**
 * Synthetic transcripts: a conversation of the agent with its tools, shaped by the trial's outcome.
 */
import type { TrialStatus } from '../../src/format/result.ts';
import type { StoredMessage, StoredToolCall } from '../../src/format/store.ts';
import type { FixtureCase } from './fixture-cases.ts';
import { drawShots } from './fixture-shots.ts';

/** The screenshots tool calls attach. */
const shots = drawShots();

/** A message of a stored transcript. */
type Message = StoredMessage;

/** A tool call of a stored transcript. */
type ToolCall = StoredToolCall;

/** A seeded source of numbers from 0 to 1. */
export type Random = () => number;

/** What a transcript is written from. */
export interface TranscriptPlan {
  /** The case. */
  readonly fixture: FixtureCase;
  /** The trial's outcome. */
  readonly status: TrialStatus;
  /** The id of the check that failed, for a failed trial. */
  readonly failedCheck?: string | undefined;
  /** When the trial started, in milliseconds since the epoch. */
  readonly start: number;
  /** The random source. */
  readonly random: Random;
}

/**
 * An assistant message with usage.
 *
 * @param plan - The transcript's plan.
 * @param at - When it was written.
 * @param content - Its text.
 * @param toolCalls - Its tool calls.
 * @returns The message.
 */
function assistant(
  plan: TranscriptPlan,
  at: number,
  content: string,
  toolCalls?: ToolCall[],
): Message {
  const usage = {
    inputTokens: 1500 + Math.round(plan.random() * 6000),
    outputTokens: 80 + Math.round(plan.random() * 600),
  };
  return {
    role: 'assistant',
    content,
    at: new Date(at).toISOString(),
    usage,
    ...(toolCalls === undefined ? {} : { toolCalls }),
  };
}

/**
 * The tool call that lists sources.
 *
 * @param plan - The transcript's plan.
 * @returns The call.
 */
function listSources(plan: TranscriptPlan): ToolCall {
  return {
    id: 'call_1',
    name: 'list_sources',
    input: {},
    output: {
      sources: [
        { name: 'prometheus', kind: 'prometheus', url: 'http://prometheus:9090' },
        { name: 'postgres', kind: 'postgres', database: 'shop' },
        { name: 'loki', kind: 'loki' },
        { name: 'mysql', kind: 'mysql', database: 'ops' },
      ],
    },
    durationMs: 40 + Math.round(plan.random() * 200),
  };
}

/**
 * The query call, failing on an errored trial.
 *
 * @param plan - The transcript's plan.
 * @param id - The call's id.
 * @param fails - Whether the call fails.
 * @returns The call.
 */
function runQuery(plan: TranscriptPlan, id: string, fails: boolean): ToolCall {
  const input = { source: plan.fixture.source, query: plan.fixture.query, range: '24h' };
  if (fails) {
    return {
      id,
      name: 'run_query',
      input,
      error: 'Query timed out after 30s: the range is too wide for a 5m step.',
      durationMs: 30_000,
      attachments: [shots.error.attachment],
    };
  }
  const rows = 3 + Math.floor(plan.random() * 8);
  return {
    id,
    name: 'run_query',
    input,
    output: {
      columns: ['time', 'series', 'value'],
      rows,
      sample: [['2026-10-07T10:00:00Z', 'checkout', 0.0123]],
    },
    durationMs: 300 + Math.round(plan.random() * 2500),
  };
}

/**
 * The calls that propose and write the dashboard.
 *
 * @param plan - The transcript's plan.
 * @returns The calls.
 */
function buildCalls(plan: TranscriptPlan): ToolCall[] {
  const panels = [
    { title: plan.fixture.title, kind: 'timeseries' },
    { title: `${plan.fixture.title}, totals`, kind: 'stat' },
  ];
  return [
    {
      id: 'call_4',
      name: 'propose_plan',
      input: { title: plan.fixture.title, panels },
      output: 'Plan accepted.',
      durationMs: 12,
    },
    ...panels.map((panel, index) => ({
      id: `call_${5 + index}`,
      name: 'write_panel',
      input: {
        ...panel,
        query: plan.fixture.query,
        unit: plan.failedCheck === 'units' ? 'short' : 'auto',
      },
      output: { panelId: `p${index + 1}`, status: 'written' },
      durationMs: 20 + Math.round(plan.random() * 80),
      ...(index === 0 ? { attachments: [shots.dashboard.attachment] } : {}),
    })),
  ];
}

/**
 * The final answer of the agent.
 *
 * @param plan - The transcript's plan.
 * @returns The text.
 */
function finalAnswer(plan: TranscriptPlan): string {
  if (plan.status === 'error') return 'I could not finish: the query kept timing out.';
  if (plan.failedCheck === 'right-source') {
    return `I built "${plan.fixture.title}" from the closest source I found. Let me know if another source holds this data.`;
  }
  return `I built "${plan.fixture.title}" with two panels.\n\n- ${plan.fixture.title}: a time series.\n- Totals: one number for the whole range.\n\nOpen it from the dashboards list.`;
}

/**
 * A trial's transcript.
 *
 * @param plan - What it is written from.
 * @returns Its messages.
 */
export function transcriptOf(plan: TranscriptPlan): Message[] {
  let at = plan.start;
  const tick = () => {
    at += 1500 + Math.round(plan.random() * 6000);
    return at;
  };
  const errored = plan.status === 'error';
  const retryFails = errored || plan.random() < 0.15;
  const messages: Message[] = [
    {
      role: 'system',
      content:
        'You build dashboards from the data sources the user connected. Use the tools; never invent data.',
    },
    { role: 'user', content: plan.fixture.input, at: new Date(at).toISOString() },
    assistant(plan, tick(), 'Let me see which sources are connected.', [listSources(plan)]),
    assistant(plan, tick(), `The data is in ${plan.fixture.source}. I will query it first.`, [
      runQuery(plan, 'call_2', retryFails),
    ]),
  ];
  if (retryFails) {
    messages.push({
      role: 'tool',
      content: 'run_query failed: Query timed out after 30s.',
      at: new Date(tick()).toISOString(),
    });
    messages.push(
      assistant(plan, tick(), 'The query timed out. I will retry with a narrower range.', [
        runQuery(plan, 'call_3', errored),
      ]),
    );
  }
  if (errored) {
    messages.push(assistant(plan, tick(), finalAnswer(plan)));
    return messages;
  }
  messages.push(
    assistant(plan, tick(), 'The query returns what we need. Here is the plan.', buildCalls(plan)),
  );
  messages.push(assistant(plan, tick(), finalAnswer(plan)));
  return messages;
}
