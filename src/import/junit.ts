/**
 * JUnit XML: `testsuites`, `testsuite` and `testcase` elements with `failure`, `error` and
 * `skipped`. Each test case is a case with one trial; a test case that appears again, as a rerun
 * does, adds a trial. A `model` or `provider` property on a suite labels its cases, and suites
 * with different models become different results.
 */
import type { Case, CheckResult, Result, Trial } from '../format/result.ts';
import { caseIdOf, isoTimeOf, millisecondsOf, modelLabels, pruned } from './common.ts';
import { childrenNamed, descendantsNamed, parseXml, type XmlElement } from './xml.ts';

/** The one check a JUnit test case makes: that it passed. */
const passedCheck = { id: 'passed', description: 'The test passed' } as const;

/** The elements that end a test case other than with a pass, with the status each means. */
const outcomeElements = [
  ['failure', 'fail'],
  ['error', 'error'],
  ['skipped', 'skip'],
] as const;

/** The cases of one set of labels, as they are collected. */
interface Group {
  /** The labels. */
  readonly labels: Record<string, string> | undefined;
  /** The cases, by id. */
  readonly cases: Map<string, Case>;
  /** The suites' start times. */
  readonly startTimes: string[];
}

/**
 * A suite's property, from its `properties` element.
 *
 * @param suite - The `testsuite` element.
 * @param name - The property's name.
 * @returns Its value or text, or `undefined`.
 */
function propertyOf(suite: XmlElement, name: string): string | undefined {
  const property = childrenNamed(suite, 'properties')
    .flatMap((properties) => childrenNamed(properties, 'property'))
    .find((candidate) => candidate.attributes.name === name);
  if (property === undefined) return undefined;
  return (property.attributes.value ?? property.text.trim()) || undefined;
}

/**
 * The text of an outcome element: its message, with its type, and its body.
 *
 * @param outcome - The `failure`, `error` or `skipped` element.
 * @returns The message.
 */
function messageOf(outcome: XmlElement): string | undefined {
  const { message, type } = outcome.attributes;
  const head = [type, message].filter(Boolean).join(': ');
  const body = outcome.text.trim();
  return [head, body].filter(Boolean).join('\n\n') || undefined;
}

/**
 * How a test case ended: the first of `failure`, `error` and `skipped` it holds, else a pass.
 *
 * @param testcase - The `testcase` element.
 * @returns The status, and the failure's or the error's message.
 */
function outcomeOf(testcase: XmlElement): { status: Trial['status']; message?: string } {
  for (const [name, status] of outcomeElements) {
    const element = childrenNamed(testcase, name)[0];
    if (element)
      return pruned({ status, message: status === 'skip' ? undefined : messageOf(element) });
  }
  return { status: 'pass' };
}

/**
 * The trial a test case ran.
 *
 * @param testcase - The `testcase` element.
 * @returns The trial.
 */
function trialOf(testcase: XmlElement): Trial {
  const { status, message } = outcomeOf(testcase);
  const checks: CheckResult[] | undefined =
    status === 'skip'
      ? undefined
      : [pruned<CheckResult>({ id: passedCheck.id, pass: status === 'pass', message })];
  return pruned<Trial>({
    status,
    durationMs: millisecondsOf(Number.parseFloat(testcase.attributes.time ?? '')),
    checks,
    error: message,
    output: childrenNamed(testcase, 'system-out')[0]?.text.trim() || undefined,
  });
}

/**
 * Adds a test case to a group, as a new case or as another trial of one already seen.
 *
 * @param group - The group.
 * @param testcase - The `testcase` element.
 * @param suiteName - The suite's name, used as a tag.
 */
function addTestcase(group: Group, testcase: XmlElement, suiteName: string | undefined): void {
  const { classname, name = '' } = testcase.attributes;
  const id = caseIdOf(classname ? `${classname}.${name}` : name);
  const trial = trialOf(testcase);
  const seen = group.cases.get(id);
  if (seen) {
    seen.trials.push(trial);
    return;
  }
  group.cases.set(
    id,
    pruned<Case>({
      id,
      title: name || undefined,
      description: classname,
      tags: suiteName ? [suiteName] : undefined,
      checks: [{ ...passedCheck }],
      trials: [trial],
    }),
  );
}

/**
 * The group a suite's cases go to, made when it is the first suite with its labels.
 *
 * @param groups - The groups, by their labels' key.
 * @param suite - The `testsuite` element.
 * @returns The group.
 */
function groupOf(groups: Map<string, Group>, suite: XmlElement): Group {
  const labels = modelLabels(propertyOf(suite, 'model'), propertyOf(suite, 'provider'));
  const key = JSON.stringify(labels ?? {});
  const existing = groups.get(key);
  if (existing) return existing;
  const group: Group = { labels, cases: new Map(), startTimes: [] };
  groups.set(key, group);
  return group;
}

/**
 * Adds a suite's test cases to the group of its labels.
 *
 * @param groups - The groups, by their labels' key.
 * @param suite - The `testsuite` element.
 */
function addSuite(groups: Map<string, Group>, suite: XmlElement): void {
  const testcases = childrenNamed(suite, 'testcase');
  if (testcases.length === 0) return;
  const group = groupOf(groups, suite);
  const time = isoTimeOf(suite.attributes.timestamp);
  if (time) group.startTimes.push(time);
  for (const testcase of testcases) addTestcase(group, testcase, suite.attributes.name);
}

/**
 * Converts a JUnit XML report.
 *
 * @param source - The report's text.
 * @returns One result per model the suites name, or one result when they name none.
 * @throws When the report has no test case.
 */
export function importJunit(source: string): Result[] {
  const document = parseXml(source);
  const suites = descendantsNamed(document, 'testsuite');
  const groups = new Map<string, Group>();
  for (const suite of suites) addSuite(groups, suite);
  if (groups.size === 0) throw new Error('The JUnit report has no test case.');
  const suiteName =
    descendantsNamed(document, 'testsuites')[0]?.attributes.name ??
    (suites.length === 1 ? suites[0]?.attributes.name : undefined);
  return [...groups.values()].map((group) =>
    pruned<Result>({
      version: 1,
      suite: suiteName || undefined,
      startedAt: group.startTimes.sort()[0],
      labels: group.labels,
      cases: [...group.cases.values()],
    }),
  );
}
