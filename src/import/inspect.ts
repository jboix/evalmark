/**
 * Inspect AI eval logs, in the JSON format or the default `.eval` format (a zip archive with
 * `header.json` and one `samples/<id>_epoch_<n>.json` per sample and epoch). Samples become
 * cases, epochs become trials, scores become checks, and the eval's model becomes the labels.
 */
import type { Case, CheckDefinition, CheckResult, Result, Trial } from '../format/result.ts';
import {
  amountOf,
  caseIdOf,
  isoTimeOf,
  millisecondsOf,
  modelLabels,
  nonEmpty,
  nonEmptyObject,
  pruned,
  tokenCount,
} from './common.ts';
import { type InspectLog, type InspectSample, logSchema, sampleSchema } from './inspect-schema.ts';
import { checksOfScores } from './inspect-scores.ts';
import { textOfInput, transcriptOf } from './inspect-transcript.ts';
import { readZip } from './zip.ts';

/** The prefix of a reference to a sample's attachment in an Inspect log. */
const attachmentPrefix = 'attachment://';

/**
 * Replaces references to a sample's attachments (`attachment://<id>`), which Inspect writes in
 * place of long strings, with the attachments' content.
 *
 * @param value - Any part of the sample.
 * @param attachments - The sample's attachments, by id.
 * @returns The value with every reference resolved.
 */
function resolveAttachments(
  value: unknown,
  attachments: Readonly<Record<string, unknown>>,
): unknown {
  if (typeof value === 'string' && value.startsWith(attachmentPrefix)) {
    const content = attachments[value.slice(attachmentPrefix.length)];
    return typeof content === 'string' ? content : value;
  }
  if (Array.isArray(value)) return value.map((item) => resolveAttachments(item, attachments));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, resolveAttachments(entry, attachments)]),
  );
}

/**
 * Reads one sample, with its attachments resolved.
 *
 * @param data - The parsed sample.
 * @returns The sample.
 * @throws When it is not an Inspect sample.
 */
function sampleOf(data: unknown): InspectSample {
  const attachments = (data as { attachments?: unknown } | null)?.attachments;
  const resolved =
    attachments !== null && typeof attachments === 'object'
      ? resolveAttachments(data, attachments as Record<string, unknown>)
      : data;
  return sampleSchema.parse(resolved);
}

/**
 * A trial's status: `error` when the sample errored, `skip` when it was not scored, `pass` when
 * every check passed, else `fail`.
 *
 * @param error - The sample's error, if any.
 * @param checks - Its checks.
 * @returns The status.
 */
function statusOf(error: string | undefined, checks: readonly CheckResult[]): Trial['status'] {
  if (error) return 'error';
  if (checks.length === 0) return 'skip';
  return checks.every((check) => check.pass) ? 'pass' : 'fail';
}

/**
 * What a sample spent, summed over the models it used.
 *
 * @param sample - The sample.
 * @returns The usage, or `undefined` when the log has none.
 */
function usageOf(sample: InspectSample): Trial['usage'] {
  const usages = Object.values(sample.model_usage ?? {});
  const sum = (pick: (usage: (typeof usages)[number]) => number | null | undefined) =>
    usages.some((usage) => typeof pick(usage) === 'number')
      ? usages.reduce((total, usage) => total + (pick(usage) ?? 0), 0)
      : undefined;
  return nonEmptyObject(
    pruned<NonNullable<Trial['usage']>>({
      inputTokens: tokenCount(sum((usage) => usage.input_tokens)),
      outputTokens: tokenCount(sum((usage) => usage.output_tokens)),
      costUsd: amountOf(sum((usage) => usage.total_cost)),
    }),
  );
}

/**
 * The trial one sample epoch ran.
 *
 * @param sample - The sample.
 * @returns The trial.
 */
function trialOf(sample: InspectSample): Trial {
  const { checks, score } = checksOfScores(sample.scores);
  const error = sample.error ? sample.error.message || 'The sample failed.' : undefined;
  return pruned<Trial>({
    status: statusOf(error, checks),
    score,
    durationMs: millisecondsOf(sample.total_time),
    usage: usageOf(sample),
    checks: nonEmpty(checks),
    error,
    output: sample.output?.completion || undefined,
    transcript: transcriptOf(sample.messages),
  });
}

/**
 * The case of a sample, from its epochs.
 *
 * @param epochs - The sample's epochs, in order.
 * @returns The case.
 */
function caseOf(epochs: readonly InspectSample[]): Case {
  const [first] = epochs;
  const trials = epochs.map(trialOf);
  const definitions = new Map<string, CheckDefinition>();
  for (const check of trials.flatMap((trial) => trial.checks ?? []))
    definitions.set(check.id, { id: check.id });
  const target = Array.isArray(first?.target) ? first.target.join(', ') : first?.target;
  return pruned<Case>({
    id: caseIdOf(String(first?.id ?? '')),
    description: target ? `Target: ${target}` : undefined,
    input: textOfInput(first?.input),
    checks: nonEmpty([...definitions.values()]),
    trials,
  });
}

/**
 * Groups samples by id, each with its epochs in order.
 *
 * @param samples - The samples.
 * @returns The epochs of each sample, the samples sorted by id.
 */
function epochsById(samples: readonly InspectSample[]): InspectSample[][] {
  const byId = new Map<string, InspectSample[]>();
  for (const sample of samples) {
    const key = String(sample.id);
    byId.set(key, [...(byId.get(key) ?? []), sample]);
  }
  // A `.eval` archive lists samples in the order they finished: sort by id, numbers as numbers.
  return [...byId.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'en', { numeric: true }))
    .map(([, epochs]) => epochs.sort((left, right) => (left.epoch ?? 1) - (right.epoch ?? 1)));
}

/**
 * Converts a log and its samples.
 *
 * @param log - The log's header.
 * @param samples - Its samples.
 * @returns The result.
 * @throws When the log has no sample, as when it was written with `log_samples` off.
 */
function resultOf(log: InspectLog, samples: readonly InspectSample[]): Result {
  if (samples.length === 0) throw new Error('The Inspect log has no sample.');
  const [provider, ...model] = log.eval.model.split('/');
  const startedAt = isoTimeOf(log.stats?.started_at) ?? isoTimeOf(log.eval.created);
  const completedAt = isoTimeOf(log.stats?.completed_at);
  const durationMs =
    startedAt && completedAt ? Date.parse(completedAt) - Date.parse(startedAt) : undefined;
  return pruned<Result>({
    version: 1,
    suite: log.eval.task,
    startedAt,
    durationMs: durationMs !== undefined && durationMs >= 0 ? durationMs : undefined,
    labels:
      model.length > 0 ? modelLabels(model.join('/'), provider) : modelLabels(provider, undefined),
    cases: epochsById(samples).map(caseOf),
  });
}

/**
 * Converts an Inspect log in the JSON format.
 *
 * @param data - The parsed log.
 * @returns The result, with the eval's model as its label.
 * @throws When it is not an Inspect log or has no sample.
 */
export function importInspectJson(data: unknown): Result[] {
  const log = logSchema.parse(data);
  const samples = ((data as { samples?: unknown[] }).samples ?? []).map(sampleOf);
  return [resultOf(log, samples)];
}

/**
 * Converts an Inspect log in the `.eval` format.
 *
 * @param bytes - The archive.
 * @returns The result, with the eval's model as its label.
 * @throws When it is not an Inspect `.eval` archive or has no sample.
 */
export function importInspectEval(bytes: Buffer): Result[] {
  const archive = readZip(bytes);
  const headerName = archive.names.includes('header.json') ? 'header.json' : '_journal/start.json';
  const readJson = (name: string): unknown => JSON.parse(archive.read(name).toString('utf8'));
  const log = logSchema.parse(readJson(headerName));
  const samples = archive.names
    .filter((name) => name.startsWith('samples/') && name.endsWith('.json'))
    .map((name) => sampleOf(readJson(name)));
  return [resultOf(log, samples)];
}
