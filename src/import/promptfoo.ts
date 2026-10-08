/**
 * promptfoo's results file. Rows are split by provider (and by prompt when there are several), each
 * test becomes a case, and its repeats (`--repeat`) become its trials. A case's id is the test's
 * description, or a hash of its variables when it has none.
 */
import type { Case, CheckDefinition, CheckResult, Result, Trial } from '../format/result.ts';
import {
  amountOf,
  caseIdOf,
  isoTimeOf,
  modelLabels,
  nonEmpty,
  nonEmptyObject,
  pruned,
  stableHash,
  textOf,
  tokenCount,
  unitScore,
} from './common.ts';
import {
  type PromptfooComponent,
  type PromptfooFile,
  type PromptfooRow,
  promptfooFileSchema,
} from './promptfoo-schema.ts';

/** promptfoo's `failureReason` for a test that errored rather than failed an assertion. */
const failureReasonError = 2;

/** The API kinds that sit between a provider and a model in a promptfoo provider id. */
const apiKinds = new Set([
  'chat',
  'completion',
  'messages',
  'responses',
  'embedding',
  'embeddings',
]);

/** The rows of one test, with the case they become. */
interface TestRows {
  /** The test's description. */
  readonly description: string | undefined;
  /** The hash of its variables (and red team plugin and strategy). */
  readonly varsHash: string;
  /** Its rows: one per repeat. */
  readonly rows: PromptfooRow[];
}

/**
 * The labels of a provider: the label as the model when there is one, else the model part of the
 * id, such as `gpt-5` in `openai:chat:gpt-5`, with the provider before the first colon.
 *
 * @param provider - The row's provider.
 * @returns The labels, or `undefined` when the row names no provider.
 */
export function providerLabels(
  provider: PromptfooRow['provider'],
): Record<string, string> | undefined {
  const { id, label } =
    typeof provider === 'string' ? { id: provider, label: undefined } : (provider ?? {});
  if (!id) return modelLabels(label ?? undefined, undefined);
  const [head = '', ...rest] = id.split(':');
  if (rest.length === 0) return modelLabels(label || id, undefined);
  return modelLabels(label || modelOfId(id, rest), head);
}

/**
 * The model part of a provider id, after its provider, without an API kind such as `chat`. An id
 * that is a URL or a path, such as `http://…` or `file://…`, is the model as a whole.
 *
 * @param id - The id.
 * @param rest - The id's parts after the provider.
 * @returns The model.
 */
function modelOfId(id: string, rest: readonly string[]): string {
  if (rest[0]?.startsWith('//')) return id;
  const model = rest.length > 1 && apiKinds.has(rest[0] ?? '') ? rest.slice(1) : rest;
  return model.join(':');
}

/**
 * What tells a test from another with the same description: its variables, without promptfoo's
 * runtime ones (`__` prefixed), and for a red team test its plugin and strategy.
 *
 * @param row - The row.
 * @returns The variables, or the variables with the plugin and strategy.
 */
function identityOf(row: PromptfooRow): unknown {
  const all = row.vars ?? row.testCase?.vars ?? {};
  const vars = Object.fromEntries(Object.entries(all).filter(([key]) => !key.startsWith('__')));
  const metadata = row.testCase?.metadata;
  if (!metadata?.pluginId && !metadata?.strategyId) return vars;
  return { vars, pluginId: metadata.pluginId, strategyId: metadata.strategyId };
}

/**
 * A red team test's tags: its plugin and strategy.
 *
 * @param row - The test's first row.
 * @returns The tags, or `undefined` for a test that is not a red team test.
 */
function tagsOf(row: PromptfooRow | undefined): string[] | undefined {
  const metadata = row?.testCase?.metadata;
  return nonEmpty([metadata?.pluginId, metadata?.strategyId].filter((tag) => !!tag) as string[]);
}

/**
 * The checks of a row: one per assertion, with ids from the assertion's metric or type.
 *
 * @param row - The row.
 * @returns The check results with their definitions, in the assertions' order.
 */
function checksOf(row: PromptfooRow): { definition: CheckDefinition; result: CheckResult }[] {
  const grading = row.gradingResult;
  if (!grading) return [];
  // A grading without components is one assertion, or no assertion at all.
  const components: PromptfooComponent[] = grading.componentResults?.length
    ? grading.componentResults
    : [grading].filter((component) => component.assertion);
  const seen = new Map<string, number>();
  return components.map((component) => {
    const base = component.assertion?.metric || component.assertion?.type || 'assert';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return checkOf(component, base, count === 1 ? base : `${base}-${count}`);
  });
}

/**
 * One assertion's check.
 *
 * @param component - The assertion's verdict.
 * @param base - The assertion's metric or type.
 * @param id - The check's id, unique in the test.
 * @returns The check's definition and result.
 */
function checkOf(
  component: PromptfooComponent,
  base: string,
  id: string,
): { definition: CheckDefinition; result: CheckResult } {
  const value = textOf(component.assertion?.value);
  const description = value && value.length <= 120 ? `${base}: ${value}` : base;
  const result = pruned<CheckResult>({
    id,
    pass: component.pass ?? false,
    message: component.reason || undefined,
  });
  return { definition: { id, description }, result };
}

/**
 * A row's status: `pass` on success, `error` when promptfoo says it errored, else `fail`.
 *
 * @param row - The row.
 * @returns The status.
 */
function statusOf(row: PromptfooRow): Trial['status'] {
  if (row.success) return 'pass';
  if (row.failureReason === failureReasonError) return 'error';
  return !row.gradingResult && (row.error || row.response?.error) ? 'error' : 'fail';
}

/**
 * The trial a row ran.
 *
 * @param row - The row.
 * @returns The trial.
 */
function trialOf(row: PromptfooRow): Trial {
  const tokens = row.tokenUsage ?? row.response?.tokenUsage;
  const usage = pruned<NonNullable<Trial['usage']>>({
    inputTokens: tokenCount(tokens?.prompt),
    outputTokens: tokenCount(tokens?.completion),
    costUsd: amountOf(row.cost ?? row.response?.cost),
  });
  return pruned<Trial>({
    status: statusOf(row),
    score: unitScore(row.score),
    durationMs: tokenCount(row.latencyMs),
    usage: nonEmptyObject(usage),
    checks: nonEmpty(checksOf(row).map((check) => check.result)),
    error: row.error || row.response?.error || undefined,
    output: textOf(row.response?.output),
  });
}

/**
 * Groups rows by test: same description and same variables.
 *
 * @param rows - The rows of one provider and prompt.
 * @returns The tests, in the order they first appear.
 */
function testsOf(rows: readonly PromptfooRow[]): TestRows[] {
  const tests = new Map<string, TestRows>();
  for (const row of rows) {
    const description = row.testCase?.description || row.description || undefined;
    const varsHash = stableHash(identityOf(row));
    const key = `${description ?? ''}\u0000${varsHash}`;
    const test = tests.get(key) ?? { description, varsHash, rows: [] };
    test.rows.push(row);
    tests.set(key, test);
  }
  return [...tests.values()];
}

/**
 * The case of a test.
 *
 * @param test - The test's rows.
 * @param shared - Whether another test has the same description, so the id needs the hash.
 * @returns The case.
 */
function caseOf(test: TestRows, shared: boolean): Case {
  const { description, varsHash, rows } = test;
  const name = description
    ? shared
      ? `${description} (${varsHash})`
      : description
    : `vars-${varsHash}`;
  const definitions = new Map(
    rows.flatMap(checksOf).map((check) => [check.definition.id, check.definition]),
  );
  return pruned<Case>({
    id: caseIdOf(name),
    title: description,
    input: rows[0]?.prompt?.raw ?? undefined,
    tags: tagsOf(rows[0]),
    checks: nonEmpty([...definitions.values()]),
    trials: rows.map(trialOf),
  });
}

/**
 * The cases of one provider and prompt.
 *
 * @param rows - Their rows.
 * @returns The cases.
 */
function casesOf(rows: readonly PromptfooRow[]): Case[] {
  const tests = testsOf(rows);
  const counts = new Map<string, number>();
  for (const test of tests) {
    if (test.description) counts.set(test.description, (counts.get(test.description) ?? 0) + 1);
  }
  return tests.map((test) => caseOf(test, (counts.get(test.description ?? '') ?? 0) > 1));
}

/**
 * Splits rows by provider and prompt.
 *
 * @param rows - Every row.
 * @returns The rows of each provider and prompt, with their labels.
 */
function groupsOf(
  rows: readonly PromptfooRow[],
): { labels: Record<string, string> | undefined; rows: PromptfooRow[] }[] {
  const prompts = new Set(rows.map((row) => row.promptIdx ?? 0));
  const groups = new Map<
    string,
    { labels: Record<string, string> | undefined; rows: PromptfooRow[] }
  >();
  for (const row of rows) {
    const promptIndex = row.promptIdx ?? 0;
    const prompt =
      prompts.size > 1 ? (row.prompt?.label ?? `prompt-${promptIndex + 1}`) : undefined;
    const labels = pruned<Record<string, string>>({ ...providerLabels(row.provider), prompt });
    const key = JSON.stringify([labels, promptIndex]);
    const group = groups.get(key) ?? {
      labels: Object.keys(labels).length > 0 ? labels : undefined,
      rows: [],
    };
    group.rows.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/**
 * Reads promptfoo's results, as `promptfoo eval -o results.json` writes them, or the evaluation
 * summary alone.
 *
 * @param data - The parsed file.
 * @returns The file.
 * @throws When it is not a promptfoo results file.
 */
function fileOf(data: unknown): PromptfooFile {
  const wrapped =
    data !== null &&
    typeof data === 'object' &&
    Array.isArray((data as { results?: unknown }).results)
      ? { results: data }
      : data;
  const parsed = promptfooFileSchema.safeParse(wrapped);
  if (parsed.success) return parsed.data;
  throw new Error(`This is not a promptfoo results file: ${parsed.error.issues[0]?.message ?? ''}`);
}

/**
 * Converts promptfoo's results.
 *
 * @param data - The parsed file.
 * @returns One result per provider (and per prompt, when the file has several).
 * @throws When the file is not a promptfoo results file or has no row.
 */
export function importPromptfoo(data: unknown): Result[] {
  const file = fileOf(data);
  if (file.results.results.length === 0)
    throw new Error('The promptfoo results file has no result.');
  return groupsOf(file.results.results).map((group) =>
    pruned<Result>({
      version: 1,
      suite: file.config?.description || undefined,
      startedAt: isoTimeOf(file.results.timestamp),
      durationMs: tokenCount(file.results.stats?.durationMs),
      labels: group.labels,
      cases: casesOf(group.rows),
    }),
  );
}
