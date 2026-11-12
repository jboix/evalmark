/**
 * axe-core for the dashboard's browser tests: the rules of WCAG 2.0, 2.1 and 2.2 at levels A and
 * AA. A test expects the list to be empty, so a violation fails with its rule and its element.
 */
import axe from 'axe-core';

/** The rules that run, by axe-core's tags. */
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

/**
 * What axe-core finds in the page.
 *
 * @returns One line per rule and element: the rule, the element and what is wrong with it.
 */
export async function violations(): Promise<string[]> {
  const result = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
  return result.violations.flatMap((rule) =>
    rule.nodes.map(
      (found) => `${rule.id}: ${found.target.join(' ')} ${found.failureSummary ?? ''}`,
    ),
  );
}
