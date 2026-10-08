/**
 * A transcript as a timeline: one numbered step per message, who wrote it, when, what it cost,
 * what it said, and the tools it called, each with what it sent and got back.
 */
import type { Message } from '../../format/result.ts';
import type { StoredAttachment, StoredMessage, StoredToolCall } from '../../format/store.ts';
import { formatCost, formatCount, formatDuration } from './format.ts';
import { elapsedOf, prettyValue, previewOf } from './transcript.ts';

/** One tool call of a step. */
export interface CallStep {
  /** Its key, unique in the step. */
  readonly key: string;
  /** The tool's name. */
  readonly name: string;
  /** Its input on one line, cut short. */
  readonly brief: string;
  /** Its input, as text. */
  readonly input: string;
  /** What it got back, or its error, as text. */
  readonly output: string;
  /** Whether it failed. */
  readonly failed: boolean;
  /** How long it took, if known. */
  readonly duration?: string | undefined;
  /** What it saved, such as screenshots. */
  readonly attachments: readonly StoredAttachment[];
}

/** One step of the timeline. */
export interface Step {
  /** Its number, from 1. */
  readonly number: number;
  /** Who wrote it. */
  readonly who: 'You' | 'Agent' | 'System' | 'Tool';
  /** Its time from the first timed message, such as `+12s`. */
  readonly elapsed?: string | undefined;
  /** What it cost, such as `1.9k in · 58 out · $0.0001`. */
  readonly usage: string;
  /** What it said. */
  readonly text: string;
  /** Its tool calls. */
  readonly calls: readonly CallStep[];
  /** Its own attachments. */
  readonly attachments: readonly StoredAttachment[];
  /** Whether one of its tool calls failed. */
  readonly failed: boolean;
}

/** Who each role is, as the timeline names it. */
const whoOf: Readonly<Record<Message['role'], Step['who']>> = {
  system: 'System',
  user: 'You',
  assistant: 'Agent',
  tool: 'Tool',
};

/**
 * A message's usage on one line.
 *
 * @param usage - The usage, if any.
 * @returns Such as `1.9k in · 58 out · $0.0001`; empty when there is none.
 */
export function usageText(usage: Message['usage']): string {
  if (usage === undefined) return '';
  return [
    usage.inputTokens === undefined ? undefined : `${formatCount(usage.inputTokens)} in`,
    usage.outputTokens === undefined ? undefined : `${formatCount(usage.outputTokens)} out`,
    usage.costUsd === undefined ? undefined : formatCost(usage.costUsd),
  ]
    .filter((part) => part !== undefined)
    .join(' · ');
}

/**
 * One tool call as a step's block.
 *
 * @param call - The call.
 * @param position - Its place in the message.
 * @returns The block.
 */
function callStep(call: StoredToolCall, position: number): CallStep {
  const failed = call.error !== undefined;
  return {
    key: call.id ?? `call-${position}`,
    name: call.name,
    brief: previewOf(call.input),
    input: prettyValue(call.input),
    output: failed ? (call.error ?? '') : prettyValue(call.output),
    failed,
    duration: call.durationMs === undefined ? undefined : formatDuration(call.durationMs),
    attachments: call.attachments ?? [],
  };
}

/**
 * The timeline of a transcript.
 *
 * @param messages - The transcript's messages, as stored.
 * @returns One step per message, in order.
 */
export function timelineOf(messages: readonly StoredMessage[]): Step[] {
  const elapsed = elapsedOf(messages);
  return messages.map((message, position) => {
    const calls = (message.toolCalls ?? []).map(callStep);
    return {
      number: position + 1,
      who: whoOf[message.role],
      elapsed: elapsed[position],
      usage: usageText(message.usage),
      text: message.content ?? '',
      calls,
      attachments: message.attachments ?? [],
      failed: calls.some((call) => call.failed),
    };
  });
}

/** What a trial's checks came to, for its heading. */
export interface ChecksSummary {
  /** The heading, such as `Failed 1 of 3 checks`. */
  readonly title: string;
  /** Whether any check failed. */
  readonly failed: boolean;
}

/**
 * A trial's checks in a heading.
 *
 * @param states - Each check's state.
 * @returns The heading and whether any failed.
 */
export function checksSummary(states: readonly ('pass' | 'fail' | 'none')[]): ChecksSummary {
  const ran = states.filter((state) => state !== 'none').length;
  const failed = states.filter((state) => state === 'fail').length;
  const noun = (count: number) => (count === 1 ? 'check' : 'checks');
  if (ran === 0) return { title: 'No check ran', failed: false };
  if (failed > 0) return { title: `Failed ${failed} of ${ran} ${noun(ran)}`, failed: true };
  return { title: ran === 1 ? 'Passed the one check' : `Passed all ${ran} checks`, failed: false };
}
