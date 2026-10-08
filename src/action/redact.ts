/**
 * Redaction: values that look like secrets, and the strings the workflow names, are replaced in
 * every string of a result before anything is stored.
 */

/** What a redacted value becomes. */
export const redacted = '[redacted]';

/** The shapes of common secrets. */
const secretPatterns: readonly RegExp[] = [
  /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g,
  /\bgh[opsur]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  /\bAIza[A-Za-z0-9_-]{30,}/g,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  /\bxox[abeprs]-[A-Za-z0-9-]{10,}/g,
];

/** A bearer token in a header or a log line; the word `Bearer` stays. */
const bearerPattern = /\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi;

/** Replaces secrets in one string. */
export type Redactor = (text: string) => string;

/**
 * A redactor for the common secret shapes and the given strings.
 *
 * @param extra - Strings to remove wherever they appear, such as the workflow's token.
 * @returns The redactor.
 */
export function createRedactor(extra: readonly string[]): Redactor {
  const literals = [...new Set(extra.filter((entry) => entry.length > 0))].sort(
    (first, second) => second.length - first.length,
  );
  return (text) => {
    let clean = literals.reduce((current, literal) => current.replaceAll(literal, redacted), text);
    for (const pattern of secretPatterns) clean = clean.replace(pattern, redacted);
    return clean.replace(bearerPattern, `$1${redacted}`);
  };
}

/**
 * Redacts every string of a value, deep: object keys, object values and array items.
 *
 * @param value - Any JSON value.
 * @param redact - The redactor.
 * @returns A copy with every string redacted.
 */
export function redactDeep<Value>(value: Value, redact: Redactor): Value {
  return redactValue(value, redact) as Value;
}

/**
 * Redacts one value of any type.
 *
 * @param value - The value.
 * @param redact - The redactor.
 * @returns The redacted copy.
 */
function redactValue(value: unknown, redact: Redactor): unknown {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, redact));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [redact(key), redactValue(item, redact)]),
  );
}
