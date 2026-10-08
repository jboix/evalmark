/**
 * The demo's transcripts: the conversation of one trial, with the agent's tool calls, their inputs
 * and outputs, the time of each message and what each turn cost.
 */
import type { Message, ToolCall } from '../format/result.ts';
import { type DemoCase, type DemoModel, demoSources } from './demo-catalog.ts';
import type { Random } from './demo-random.ts';
import { screenshotPath } from './demo-screenshot.ts';

/** How a trial ends, which decides how far its conversation goes. */
export type DemoOutcome = 'pass' | 'fail' | 'error';

/** A trial's conversation, with its usage and duration. */
export interface DemoConversation {
  /** The messages. */
  readonly transcript: Message[];
  /** What the assistant's turns spent, added up. */
  readonly usage: Spent;
  /** From the question to the last message. */
  readonly durationMs: number;
}

/** Tokens and money spent, every field set. */
interface Spent {
  /** Input tokens. */
  readonly inputTokens: number;
  /** Output tokens. */
  readonly outputTokens: number;
  /** US dollars. */
  readonly costUsd: number;
}

/** One assistant turn: what it says and the tools it calls. */
interface Turn {
  /** What it says. */
  readonly content?: string;
  /** The tools it calls. */
  readonly toolCalls?: ToolCall[];
}

/** Writes a conversation one message at a time, keeping its clock and its usage. */
interface Writer {
  /** Adds the user's question. */
  readonly user: (content: string) => void;
  /** Adds an assistant turn. */
  readonly assistant: (turn: Turn) => void;
  /** The conversation so far. */
  readonly finish: () => DemoConversation;
}

/**
 * Rounds an amount of US dollars to the millionth.
 *
 * @param amount - The amount.
 * @returns The rounded amount.
 */
function dollars(amount: number): number {
  return Math.round(amount * 1_000_000) / 1_000_000;
}

/**
 * What one assistant turn spends.
 *
 * @param random - The generator.
 * @param model - The model, for its prices.
 * @param context - The tokens of the conversation so far, which the turn reads.
 * @returns The turn's usage.
 */
function turnUsage(random: Random, model: DemoModel, context: number): Spent {
  const outputTokens = random.integer(40, 320);
  const cost = (context * model.inputPrice + outputTokens * model.outputPrice) / 1_000_000;
  return { inputTokens: context, outputTokens, costUsd: dollars(cost) };
}

/**
 * A writer for one conversation. Each assistant turn reads the whole conversation so far, so its
 * input tokens grow turn after turn.
 *
 * @param random - The generator.
 * @param model - The model that answers.
 * @param startMs - When the trial starts, in milliseconds since the epoch.
 * @returns The writer.
 */
function writer(random: Random, model: DemoModel, startMs: number): Writer {
  const messages: Message[] = [];
  const usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  let clock = startMs;
  let context = random.integer(1500, 2200);
  const assistant = (turn: Turn) => {
    clock += Math.round(model.secondsPerTurn * 1000 * (0.6 + random.next()));
    const spent = turnUsage(random, model, context);
    messages.push({ role: 'assistant', ...turn, at: new Date(clock).toISOString(), usage: spent });
    usage.inputTokens += spent.inputTokens;
    usage.outputTokens += spent.outputTokens;
    usage.costUsd = dollars(usage.costUsd + spent.costUsd);
    context += spent.outputTokens + random.integer(200, 1200);
  };
  const user = (content: string) => {
    messages.push({ role: 'user', content, at: new Date(clock).toISOString() });
  };
  const finish = () => ({ transcript: messages, usage, durationMs: clock - startMs });
  return { user, assistant, finish };
}

/**
 * A tool call that returned.
 *
 * @param random - The generator, for its id and duration.
 * @param name - The tool's name.
 * @param input - What the model sent.
 * @param output - What the tool returned.
 * @returns The tool call.
 */
function called(random: Random, name: string, input: unknown, output: unknown): ToolCall {
  return { id: `call-${random.hex(8)}`, name, input, output, durationMs: random.integer(8, 900) };
}

/**
 * A tool call that failed.
 *
 * @param random - The generator, for its id and duration.
 * @param name - The tool's name.
 * @param input - What the model sent.
 * @param error - The error the tool returned.
 * @returns The tool call.
 */
function failed(random: Random, name: string, input: unknown, error: string): ToolCall {
  return { id: `call-${random.hex(8)}`, name, input, error, durationMs: random.integer(8, 400) };
}

/**
 * The turns that find the source and plan the dashboard.
 *
 * @param random - The generator.
 * @param write - The conversation's writer.
 * @param demoCase - The case.
 */
function explore(random: Random, write: Writer, demoCase: DemoCase): void {
  const sources = demoSources.map(({ id, kind }) => ({ id, kind }));
  const source = demoSources.find((entry) => entry.id === demoCase.source);
  write.assistant({
    content: 'I will look for a source that has this data.',
    toolCalls: [called(random, 'list_sources', {}, sources)],
  });
  write.assistant({
    toolCalls: [
      called(random, 'describe_source', { source: demoCase.source }, source?.schema ?? {}),
    ],
  });
  const panel = { title: demoCase.title, type: demoCase.panel, source: demoCase.source };
  write.assistant({
    content: `Plan: one ${demoCase.panel} panel, "${demoCase.title}".`,
    toolCalls: [called(random, 'propose_plan', { panels: [panel] }, { accepted: true })],
  });
}

/**
 * The turns that run the query, repairing a wrong first one when `repair` is set.
 *
 * @param random - The generator.
 * @param write - The conversation's writer.
 * @param demoCase - The case.
 * @param repair - Whether the first query fails and the agent fixes it.
 */
function query(random: Random, write: Writer, demoCase: DemoCase, repair: boolean): void {
  const run = (text: string) => ({ source: demoCase.source, query: text });
  const rows = { rows: random.integer(6, 1800), columns: 2 };
  if (!repair) {
    write.assistant({ toolCalls: [called(random, 'run_query', run(demoCase.query), rows)] });
    return;
  }
  const { mistake } = demoCase;
  write.assistant({ toolCalls: [failed(random, 'run_query', run(mistake.query), mistake.error)] });
  write.assistant({
    content: `The query failed: ${mistake.error}. I will fix it.`,
    toolCalls: [called(random, 'run_query', run(demoCase.query), rows)],
  });
}

/**
 * A trial's conversation. An `error` trial stops after the first turn; the others go on to write
 * the panel and answer.
 *
 * @param random - The generator.
 * @param model - The model that answers.
 * @param demoCase - The case.
 * @param outcome - How the trial ends.
 * @param startMs - When it starts, in milliseconds since the epoch.
 * @returns The conversation.
 */
export function conversationOf(
  random: Random,
  model: DemoModel,
  demoCase: DemoCase,
  outcome: DemoOutcome,
  startMs: number,
): DemoConversation {
  const write = writer(random, model, startMs);
  write.user(demoCase.input);
  if (outcome === 'error') {
    write.assistant({ toolCalls: [called(random, 'list_sources', {}, [])] });
    return write.finish();
  }
  explore(random, write, demoCase);
  query(random, write, demoCase, random.chance(outcome === 'fail' ? 0.5 : 0.2));
  const panel = { dashboard: 'draft', title: demoCase.title, type: demoCase.panel };
  const variant = outcome === 'pass' ? 'right' : 'wrong';
  const screenshot = {
    path: screenshotPath(demoCase.id, variant, 'panel'),
    mediaType: 'image/png' as const,
    caption: 'The panel as written',
  };
  const written = called(random, 'write_panel', panel, { panel: 'p1', version: 1 });
  write.assistant({ toolCalls: [{ ...written, attachments: [screenshot] }] });
  write.assistant({
    content: `The dashboard is ready: "${demoCase.title}", one ${demoCase.panel} panel.`,
  });
  return write.finish();
}
