/**
 * The result file: what an eval harness writes after a run and hands to the action. It is the only
 * thing a project has to produce. Every field but the cases is optional, so a first version can be a
 * few lines; each field added makes the dashboard richer. The descriptions here become the JSON
 * Schema's, which editors show on hover.
 */
import { z } from 'zod';

// Validate without generating code: zod's fast path compiles validators with `new Function`, and
// nothing in evalmark builds code at runtime.
z.config({ jitless: true });

import { resultVersion } from './result-types.ts';

export type {
  Attachment,
  Case,
  CheckDefinition,
  CheckResult,
  Message,
  Result,
  ToolCall,
  Trial,
  TrialStatus,
} from './result-types.ts';
export { resultVersion } from './result-types.ts';

/** Tokens and money one trial, or one message, spent. */
const usageSchema = z
  .object({
    inputTokens: z.number().int().nonnegative().optional().describe('Tokens sent to the model.'),
    outputTokens: z.number().int().nonnegative().optional().describe('Tokens the model wrote.'),
    costUsd: z.number().nonnegative().optional().describe('What it cost, in US dollars.'),
  })
  .describe('Tokens and money spent.');

/** The image types an attachment may have: what every browser shows in an `<img>`. */
export const attachmentTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

/**
 * A file the harness saved next to the result, such as a screenshot of what the agent built. Its
 * path is relative to the result file and stays inside the result file's folder.
 */
const attachmentSchema = z
  .object({
    path: z
      .string()
      .min(1)
      .describe("The file's path, relative to the result file, inside its folder."),
    mediaType: z.enum(attachmentTypes).describe("The image's type."),
    caption: z.string().optional().describe('What the image shows, under it on the dashboard.'),
  })
  .describe('A file saved next to the result, such as a screenshot of what the agent built.');

/** The attachments field, the same wherever it appears. */
const attachmentsSchema = z
  .array(attachmentSchema)
  .optional()
  .describe('Images, such as screenshots, shown where they belong on the dashboard.');

/** One call the model made to a tool, with what it sent and what it got back. */
const toolCallSchema = z
  .object({
    id: z.string().optional().describe("The call's id, as the model gave it."),
    name: z.string().min(1).describe("The tool's name."),
    input: z.unknown().optional().describe('What the model sent: any JSON value.'),
    output: z.unknown().optional().describe('What the tool returned: any JSON value.'),
    error: z.string().optional().describe('The error the tool returned, when it failed.'),
    durationMs: z.number().nonnegative().optional().describe('How long the call took.'),
    attachments: attachmentsSchema,
  })
  .describe('One call the model made to a tool.');

/** One message of a trial's conversation. */
const messageSchema = z
  .object({
    role: z.enum(['system', 'user', 'assistant', 'tool']).describe('Who wrote the message.'),
    content: z.string().optional().describe("The message's text."),
    toolCalls: z.array(toolCallSchema).optional().describe('The tools the model called.'),
    at: z.iso.datetime({ offset: true }).optional().describe('When the message was written.'),
    usage: usageSchema.optional(),
    attachments: attachmentsSchema,
  })
  .describe('One message of the conversation.');

/** A check a case makes on every trial, as the case declares it. */
const checkDefinitionSchema = z
  .object({
    id: z.string().min(1).describe("The check's id, as the trials' check results name it."),
    description: z.string().optional().describe('What the check makes sure of, in words.'),
  })
  .describe('A check the case makes on every trial.');

/** What one check found on one trial. */
const checkResultSchema = z
  .object({
    id: z.string().min(1).describe("The check's id."),
    pass: z.boolean().describe('Whether the trial passed the check.'),
    message: z.string().optional().describe('What the check found, shown when it failed.'),
  })
  .describe('What one check found on this trial.');

/** One attempt at a case. A case runs one or more trials, to show how stable the agent is. */
const trialSchema = z
  .object({
    status: z
      .enum(['pass', 'fail', 'error', 'skip'])
      .describe('pass, fail (a check failed), error (the trial did not finish), or skip.'),
    score: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('A score from 0 to 1, when the case has one.'),
    durationMs: z.number().nonnegative().optional().describe('How long the trial took.'),
    usage: usageSchema.optional(),
    checks: z.array(checkResultSchema).optional().describe("Each check's result."),
    error: z.string().optional().describe('Why the trial errored, or failed.'),
    output: z.string().optional().describe("The agent's final answer."),
    attachments: attachmentsSchema,
    transcript: z
      .array(messageSchema)
      .optional()
      .describe('The conversation, message by message, with the tool calls.'),
  })
  .describe('One attempt at the case.');

/** One eval case: what it asks, what it checks, and its trials. */
const caseSchema = z
  .object({
    id: z.string().min(1).max(200).describe("The case's id, stable from run to run."),
    title: z.string().optional().describe("The case's name on the dashboard."),
    description: z.string().optional().describe('What the case is about.'),
    input: z.string().optional().describe('What the case asks the agent.'),
    tags: z.array(z.string()).optional().describe('Tags to filter cases by.'),
    checks: z.array(checkDefinitionSchema).optional().describe('The checks every trial gets.'),
    trials: z
      .array(trialSchema)
      .min(1)
      .describe('Its trials: one or more attempts, to show how stable the agent is.'),
  })
  .describe('One eval case.');

/** A whole result file. */
export const resultSchema = z
  .object({
    $schema: z.string().optional().describe("This format's JSON Schema, for editors."),
    version: z.literal(resultVersion).describe("The result format's version."),
    suite: z.string().min(1).optional().describe("The suite's name, such as the repository's."),
    startedAt: z.iso.datetime({ offset: true }).optional().describe('When the run started.'),
    durationMs: z.number().nonnegative().optional().describe('How long the run took.'),
    labels: z
      .record(z.string(), z.string())
      .optional()
      .describe('What to group and compare runs by, such as a "model" label.'),
    cases: z.array(caseSchema).min(1).describe('The cases that ran.'),
  })
  .describe('One run of an eval suite, as its harness writes it for the evalmark action.');
