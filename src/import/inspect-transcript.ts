/**
 * Inspect AI messages as a transcript. A tool message's result goes into the `output` (or the
 * `error`) of the assistant's call it answers; a tool message that answers no call stays a `tool`
 * message. Text parts are kept, other parts (images, reasoning, audio) are dropped.
 */
import type { Message, ToolCall } from '../format/result.ts';
import { nonEmpty, pruned } from './common.ts';
import type { InspectContent, InspectInput, InspectMessage } from './inspect-schema.ts';

/** A tool's result, by the id of the call it answers. */
type ToolResults = Map<string, { output: string | undefined; error: string | undefined }>;

/**
 * The text of a message's content.
 *
 * @param content - A string, or parts.
 * @returns The text parts joined by blank lines, or `undefined` when there is none.
 */
export function textOfContent(content: InspectContent | null | undefined): string | undefined {
  if (content === null || content === undefined) return undefined;
  if (typeof content === 'string') return content || undefined;
  const texts = content.flatMap((part) => (part.text ? [part.text] : []));
  return texts.join('\n\n') || undefined;
}

/**
 * The text of a sample's input.
 *
 * @param input - A prompt, or messages.
 * @returns The prompt, or the messages' texts joined by blank lines.
 */
export function textOfInput(input: InspectInput): string | undefined {
  if (input === null || input === undefined || typeof input === 'string') return input || undefined;
  const texts = input.flatMap((message) => textOfContent(message.content) ?? []);
  return texts.join('\n\n') || undefined;
}

/**
 * Collects the results of tool messages, by the id of the call each answers.
 *
 * @param messages - The messages.
 * @returns The results.
 */
function toolResultsOf(messages: readonly InspectMessage[]): ToolResults {
  const results: ToolResults = new Map();
  for (const message of messages) {
    if (message.role !== 'tool' || typeof message.tool_call_id !== 'string') continue;
    results.set(message.tool_call_id, {
      output: textOfContent(message.content),
      error: message.error?.message ?? undefined,
    });
  }
  return results;
}

/**
 * Converts an assistant's tool calls, with their results.
 *
 * @param message - The assistant message.
 * @param results - The tool results.
 * @returns The calls, or `undefined` when there is none.
 */
function toolCallsOf(message: InspectMessage, results: ToolResults): ToolCall[] | undefined {
  const calls = (message.tool_calls ?? []).map((call) => {
    const result = call.id ? results.get(call.id) : undefined;
    return pruned<ToolCall>({
      id: call.id ?? undefined,
      name: call.function,
      input: call.arguments ?? undefined,
      output: result?.output,
      error: result?.error ?? call.parse_error ?? undefined,
    });
  });
  return nonEmpty(calls);
}

/**
 * Whether a tool message answers a call an assistant message made, so it is shown on the call.
 *
 * @param message - The message.
 * @param answered - The ids of the calls assistant messages made.
 * @returns `true` when it is a tool message for one of them.
 */
function isAnswer(message: InspectMessage, answered: ReadonlySet<string>): boolean {
  return (
    message.role === 'tool' &&
    typeof message.tool_call_id === 'string' &&
    answered.has(message.tool_call_id)
  );
}

/**
 * Converts a sample's messages to a transcript.
 *
 * @param messages - The messages.
 * @returns The transcript, or `undefined` when there is no message.
 */
export function transcriptOf(
  messages: readonly InspectMessage[] | null | undefined,
): Message[] | undefined {
  const list = messages ?? [];
  const results = toolResultsOf(list);
  const answered = new Set(
    list.flatMap((message) =>
      (message.tool_calls ?? []).flatMap((call) => (call.id ? [call.id] : [])),
    ),
  );
  const transcript = list
    .filter((message) => !isAnswer(message, answered))
    .map((message) =>
      pruned<Message>({
        role: message.role,
        content: textOfContent(message.content),
        toolCalls: message.role === 'assistant' ? toolCallsOf(message, results) : undefined,
      }),
    );
  return nonEmpty(transcript);
}
