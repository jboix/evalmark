/**
 * The tests: unit tests beside the sources and the end-to-end tests of the action in `test/`, on
 * Node, which the action and the CLI ship on; and the dashboard's tests in `test/browser/`, in
 * Chromium, Firefox and WebKit.
 */
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { fixtureData } from './test/browser/fixture-data.ts';

/** How the sources' JSX compiles: to Preact. */
const oxc = { jsx: { runtime: 'automatic', importSource: 'preact' } } as const;

/** The dashboard's tests, which run in a browser. */
const browserTests = 'test/browser/**/*.test.{ts,tsx}';

/**
 * The dashboard's tests in one browser, over the synthetic history. The browsers run one after
 * another: side by side they starve each other on a small machine.
 *
 * @param browser - The browser.
 * @param order - Its place in the sequence.
 * @returns The project.
 */
function browserProject(browser: 'chromium' | 'firefox' | 'webkit', order: number) {
  return {
    oxc,
    plugins: [fixtureData(browser)],
    test: {
      name: browser,
      include: [browserTests],
      sequence: { groupOrder: order },
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        viewport: { width: 1280, height: 800 },
        screenshotFailures: false,
        instances: [{ browser }],
      },
    },
  };
}

export default defineConfig({
  test: {
    projects: [
      {
        oxc,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'test/**/*.test.ts'],
          exclude: [browserTests],
        },
      },
      browserProject('chromium', 1),
      browserProject('firefox', 2),
      browserProject('webkit', 3),
    ],
  },
});
