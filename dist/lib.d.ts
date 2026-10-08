//#region src/format/result-types.d.ts
/**
 * The result format's types, declared without the schema library: the package's public types for
 * a TypeScript harness. `result.ts` validates against a zod schema of the same shape, and a test
 * fails when the two differ.
 */
/** The version of the result format this code reads. */
export declare const resultVersion = 1;
/** Tokens and money one trial, or one message, spent. */
interface Usage {
  /** Tokens sent to the model. */
  inputTokens?: number | undefined;
  /** Tokens the model wrote. */
  outputTokens?: number | undefined;
  /** What it cost, in US dollars. */
  costUsd?: number | undefined;
}
/**
 * A file saved next to the result, such as a screenshot of what the agent built. Its path is
 * relative to the result file and stays inside the result file's folder.
 */
interface Attachment {
  /** The file's path, relative to the result file, inside its folder. */
  path: string;
  /** The image's type. */
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  /** What the image shows, under it on the dashboard. */
  caption?: string | undefined;
}
/** One call the model made to a tool, with what it sent and what it got back. */
interface ToolCall {
  /** The call's id, as the model gave it. */
  id?: string | undefined;
  /** The tool's name. */
  name: string;
  /** What the model sent: any JSON value. */
  input?: unknown;
  /** What the tool returned: any JSON value. */
  output?: unknown;
  /** The error the tool returned, when it failed. */
  error?: string | undefined;
  /** How long the call took, in milliseconds. */
  durationMs?: number | undefined;
  /** Images, such as screenshots, shown where they belong on the dashboard. */
  attachments?: Attachment[] | undefined;
}
/** One message of a trial's conversation. */
interface Message {
  /** Who wrote the message. */
  role: 'system' | 'user' | 'assistant' | 'tool';
  /** The message's text. */
  content?: string | undefined;
  /** The tools the model called. */
  toolCalls?: ToolCall[] | undefined;
  /** When the message was written, as an ISO 8601 date and time. */
  at?: string | undefined;
  /** Tokens and money spent. */
  usage?: Usage | undefined;
  /** Images, such as screenshots, shown where they belong on the dashboard. */
  attachments?: Attachment[] | undefined;
}
/** A check a case makes on every trial, as the case declares it. */
interface CheckDefinition {
  /** The check's id, as the trials' check results name it. */
  id: string;
  /** What the check makes sure of, in words. */
  description?: string | undefined;
}
/** What one check found on one trial. */
interface CheckResult {
  /** The check's id. */
  id: string;
  /** Whether the trial passed the check. */
  pass: boolean;
  /** What the check found, shown when it failed. */
  message?: string | undefined;
}
/** A trial's outcome: pass, fail (a check failed), error (the trial did not finish), or skip. */
type TrialStatus = 'pass' | 'fail' | 'error' | 'skip';
/** One attempt at a case. A case runs one or more trials, to show how stable the agent is. */
interface Trial {
  /** The trial's outcome. */
  status: TrialStatus;
  /** A score from 0 to 1, when the case has one. */
  score?: number | undefined;
  /** How long the trial took, in milliseconds. */
  durationMs?: number | undefined;
  /** Tokens and money spent. */
  usage?: Usage | undefined;
  /** Each check's result. */
  checks?: CheckResult[] | undefined;
  /** Why the trial errored, or failed. */
  error?: string | undefined;
  /** The agent's final answer. */
  output?: string | undefined;
  /** Images, such as screenshots, shown where they belong on the dashboard. */
  attachments?: Attachment[] | undefined;
  /** The conversation, message by message, with the tool calls. */
  transcript?: Message[] | undefined;
}
/** One eval case: what it asks, what it checks, and its trials. */
interface Case {
  /** The case's id, stable from run to run. */
  id: string;
  /** The case's name on the dashboard. */
  title?: string | undefined;
  /** What the case is about. */
  description?: string | undefined;
  /** What the case asks the agent. */
  input?: string | undefined;
  /** Tags to filter cases by. */
  tags?: string[] | undefined;
  /** The checks every trial gets. */
  checks?: CheckDefinition[] | undefined;
  /** Its trials: one or more attempts, to show how stable the agent is. */
  trials: Trial[];
}
/** One run of an eval suite, as its harness writes it for the evalmark action: a result file. */
interface Result {
  /** This format's JSON Schema, for editors. */
  $schema?: string | undefined;
  /** The result format's version. */
  version: typeof resultVersion;
  /** The suite's name, such as the repository's. */
  suite?: string | undefined;
  /** When the run started, as an ISO 8601 date and time. */
  startedAt?: string | undefined;
  /** How long the run took, in milliseconds. */
  durationMs?: number | undefined;
  /** What to group and compare runs by, such as a "model" label. */
  labels?: Record<string, string> | undefined;
  /** The cases that ran. */
  cases: Case[];
}
//#endregion
export type { Attachment, Case, CheckDefinition, CheckResult, Message, Result, ToolCall, Trial, TrialStatus, Usage };