/**
 * The part of an Inspect AI eval log the importer reads. Its fields follow `EvalLog`, `EvalSpec`,
 * `EvalStats` and `EvalSample` in `inspect_ai/log/_log.py`, `Score` in `inspect_ai/scorer/_metric.py`,
 * `ModelUsage` in `inspect_ai/core/_model_output.py` and the chat messages in
 * `inspect_ai/core/_chat_message.py`.
 */
import { z } from 'zod';

/** A message's content: a string, or a list of parts of which the text parts are read. */
const contentSchema = z.union([
  z.string(),
  z.array(z.object({ type: z.string().nullish(), text: z.string().nullish() })),
]);

/** A tool call an assistant message made. */
const toolCallSchema = z.object({
  id: z.string().nullish(),
  function: z.string(),
  arguments: z.unknown().optional(),
  parse_error: z.string().nullish(),
});

/** A chat message. */
const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: contentSchema.nullish(),
  tool_calls: z.array(toolCallSchema).nullish(),
  tool_call_id: z.union([z.string(), z.array(z.string())]).nullish(),
  error: z.object({ message: z.string().nullish() }).nullish(),
});

/** A scorer's verdict on a sample. */
const scoreSchema = z.object({
  value: z.unknown().optional(),
  answer: z.string().nullish(),
  explanation: z.string().nullish(),
});

/** What a model spent on a sample. */
const usageSchema = z.object({
  input_tokens: z.number().nullish(),
  output_tokens: z.number().nullish(),
  total_cost: z.number().nullish(),
});

/** One sample of one epoch. Its input is a prompt, or a list of messages. */
export const sampleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  epoch: z.number().nullish(),
  input: z.union([z.string(), z.array(messageSchema)]).nullish(),
  target: z.union([z.string(), z.array(z.string())]).nullish(),
  messages: z.array(messageSchema).nullish(),
  output: z.object({ completion: z.string().nullish() }).nullish(),
  scores: z.record(z.string(), scoreSchema).nullish(),
  model_usage: z.record(z.string(), usageSchema).nullish(),
  total_time: z.number().nullish(),
  error: z.object({ message: z.string().nullish() }).nullish(),
});

/** The log's header: the eval's task and model, and its stats. Samples are read one by one. */
export const logSchema = z.object({
  eval: z.object({
    task: z.string(),
    model: z.string(),
    created: z.string().nullish(),
  }),
  stats: z
    .object({
      started_at: z.string().nullish(),
      completed_at: z.string().nullish(),
    })
    .nullish(),
});

/** A sample's input. */
export type InspectInput = z.infer<typeof sampleSchema>['input'];
/** A message's content. */
export type InspectContent = z.infer<typeof contentSchema>;
/** A chat message. */
export type InspectMessage = z.infer<typeof messageSchema>;
/** A score. */
export type InspectScore = z.infer<typeof scoreSchema>;
/** One sample of one epoch. */
export type InspectSample = z.infer<typeof sampleSchema>;
/** The log. */
export type InspectLog = z.infer<typeof logSchema>;
