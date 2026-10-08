/**
 * The part of promptfoo's results file (`promptfoo eval -o results.json`) the importer reads. Its
 * fields follow `OutputFile`, `EvaluateSummaryV3`, `EvaluateResult` and `GradingResult` in
 * promptfoo's `src/types/index.ts`. Every field is optional, so files of older versions read too.
 */
import { z } from 'zod';

/** Token counts: `prompt` and `completion` are the input and output tokens. */
const tokenUsageSchema = z.object({
  prompt: z.number().nullish(),
  completion: z.number().nullish(),
});

/** The assertion a grading result checked. */
const assertionSchema = z.object({
  type: z.string().nullish(),
  value: z.unknown().optional(),
  metric: z.string().nullish(),
});

/** One assertion's verdict. */
const componentSchema = z.object({
  pass: z.boolean().nullish(),
  score: z.number().nullish(),
  reason: z.string().nullish(),
  assertion: assertionSchema.nullish(),
});

/** A test's grading: its verdict, and one component per assertion. */
const gradingSchema = componentSchema.extend({
  componentResults: z.array(componentSchema).nullish(),
});

/** The provider, as an id and a label, or as an id alone in older files. */
const providerSchema = z.union([
  z.string(),
  z.object({ id: z.string().nullish(), label: z.string().nullish() }),
]);

/** One row of results: a test, run against one prompt and one provider. */
const rowSchema = z.object({
  description: z.string().nullish(),
  promptIdx: z.number().nullish(),
  testIdx: z.number().nullish(),
  testCase: z
    .object({
      description: z.string().nullish(),
      vars: z.record(z.string(), z.unknown()).nullish(),
      metadata: z
        .object({ pluginId: z.string().nullish(), strategyId: z.string().nullish() })
        .nullish(),
    })
    .nullish(),
  provider: providerSchema.nullish(),
  prompt: z.object({ raw: z.string().nullish(), label: z.string().nullish() }).nullish(),
  vars: z.record(z.string(), z.unknown()).nullish(),
  response: z
    .object({
      output: z.unknown().optional(),
      error: z.string().nullish(),
      cost: z.number().nullish(),
      tokenUsage: tokenUsageSchema.nullish(),
    })
    .nullish(),
  error: z.string().nullish(),
  failureReason: z.number().nullish(),
  success: z.boolean(),
  score: z.number().nullish(),
  latencyMs: z.number().nullish(),
  gradingResult: gradingSchema.nullish(),
  cost: z.number().nullish(),
  tokenUsage: tokenUsageSchema.nullish(),
});

/** The evaluation summary: its time, its rows and its stats. */
const summarySchema = z.object({
  timestamp: z.string().nullish(),
  results: z.array(rowSchema),
  stats: z.object({ durationMs: z.number().nullish() }).nullish(),
});

/** The file `promptfoo eval -o` writes. */
export const promptfooFileSchema = z.object({
  results: summarySchema,
  config: z.object({ description: z.string().nullish() }).nullish(),
});

/** One row of results. */
export type PromptfooRow = z.infer<typeof rowSchema>;
/** One assertion's verdict. */
export type PromptfooComponent = z.infer<typeof componentSchema>;
/** The output file. */
export type PromptfooFile = z.infer<typeof promptfooFileSchema>;
