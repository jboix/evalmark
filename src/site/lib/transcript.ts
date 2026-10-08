/**
 * Reading a transcript: tool inputs and outputs as text, previews, and time from the start.
 */
import type { StoredMessage } from '../../format/store.ts';
import { formatDuration } from './format.ts';

/**
 * A tool's input or output as text: a string as it is, anything else as indented JSON.
 *
 * @param value - The value.
 * @returns The text.
 */
export function prettyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * A value on one line, cut to a length, for a tool call's summary.
 *
 * @param value - The value.
 * @param length - The longest the preview may be.
 * @returns The preview; empty for an empty object or nothing.
 */
export function previewOf(value: unknown, length = 80): string {
  if (value === undefined) return '';
  const text = typeof value === 'string' ? value : (JSON.stringify(value) ?? '');
  const flat = text === '{}' ? '' : text.replaceAll(/\s+/g, ' ').trim();
  return flat.length > length ? `${flat.slice(0, length - 1)}…` : flat;
}

/**
 * The time of each message from the conversation's first timed message.
 *
 * @param messages - The messages.
 * @returns For each message, such as `+12s`, or `undefined` when it has no time.
 */
export function elapsedOf(messages: readonly StoredMessage[]): (string | undefined)[] {
  const first = messages
    .map((message) => (message.at === undefined ? Number.NaN : Date.parse(message.at)))
    .find((time) => !Number.isNaN(time));
  return messages.map((message) => {
    if (message.at === undefined || first === undefined) return undefined;
    return `+${formatDuration(Date.parse(message.at) - first)}`;
  });
}

/** A transcript's counts, for its heading. */
export interface TranscriptCounts {
  /** How many messages. */
  readonly messages: number;
  /** How many tool calls. */
  readonly toolCalls: number;
  /** How many tool calls failed. */
  readonly toolErrors: number;
}

/**
 * Counts a transcript's messages and tool calls.
 *
 * @param messages - The messages.
 * @returns The counts.
 */
export function countsOf(messages: readonly StoredMessage[]): TranscriptCounts {
  const calls = messages.flatMap((message) => message.toolCalls ?? []);
  return {
    messages: messages.length,
    toolCalls: calls.length,
    toolErrors: calls.filter((call) => call.error !== undefined).length,
  };
}
