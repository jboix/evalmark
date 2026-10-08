/**
 * The `evalmark` package's library entry: the result format's types, for a TypeScript harness
 * that writes result files (`import type { Result } from 'evalmark'`), and the format's version.
 */
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
  Usage,
} from './format/result-types.ts';
export { resultVersion } from './format/result-types.ts';
