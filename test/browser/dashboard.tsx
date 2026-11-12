/// <reference types="vite/client" />
/**
 * The dashboard in the test page: the app and its stylesheet over the synthetic history, which
 * `fixture-data.ts` serves under `data/`.
 */
import { render } from 'preact';
import { expect } from 'vitest';
import { indexPath, type Run, runPath, type StoreIndex } from '../../src/format/store.ts';
import { App } from '../../src/site/app.tsx';
import shell from '../../src/site/index.html?raw';
import { links } from '../../src/site/lib/route.ts';
import { labelParameter } from '../../src/site/lib/runs.ts';
import { every } from '../../src/site/lib/selection.ts';
import { applyTheme, type Theme } from '../../src/site/lib/theme.ts';
import '../../src/site/styles.css';

/** A place in the dashboard a test opens. */
export interface Place {
  /** What the place is, for the test's name. */
  readonly name: string;
  /** Its address, from `#`. */
  readonly address: string;
}

/**
 * Reads a JSON file of the synthetic history.
 *
 * @param path - Its path, relative to the page.
 * @returns Its content.
 */
async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  return (await response.json()) as T;
}

/**
 * Every view of the dashboard, with its modes and its empty states, on the newest run of the
 * synthetic history and a case that failed in it.
 *
 * @returns The places.
 */
export async function places(): Promise<Place[]> {
  const index = await read<StoreIndex>(indexPath);
  const head = index.runs[0];
  if (head === undefined) throw new Error('The fixture has no runs.');
  const run = await read<Run>(runPath(head.id));
  const failed = run.cases.find((entry) => entry.status === 'fail') ?? run.cases[0];
  if (failed === undefined) throw new Error('The newest run has no case.');
  return [
    { name: 'the results', address: links.results() },
    { name: 'the results by cost', address: links.results({ metric: 'cost' }) },
    {
      name: 'the results of every model',
      address: links.results({ [labelParameter('model')]: every }),
    },
    { name: 'the results no case matches', address: links.results({ q: 'no such case' }) },
    { name: 'the runs', address: links.runs() },
    { name: 'a run', address: links.run(head.id) },
    { name: 'a trial', address: links.trial(head.id, failed.id, 0) },
    { name: 'a case', address: links.case(failed.id) },
    { name: 'two runs compared', address: links.compare() },
    { name: 'the models compared', address: links.compare({ mode: 'models' }) },
    { name: 'an address that matches nothing', address: '#/nowhere' },
  ];
}

/**
 * Mounts the dashboard in the test page, with the language the shipped page declares.
 *
 * @returns Removes it and goes back to the first address.
 */
export function mount(): () => void {
  const shipped = new DOMParser().parseFromString(shell, 'text/html');
  document.documentElement.lang = shipped.documentElement.lang;
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);
  render(<App />, root);
  return () => {
    render(null, root);
    root.remove();
    history.replaceState(null, '', location.pathname + location.search);
  };
}

/**
 * Waits until the page shows what it was asked for: nothing loads, and its content has stopped
 * changing.
 */
export async function settled(): Promise<void> {
  let before = '';
  const quiet = () => {
    const now = document.querySelector('main')?.innerHTML ?? '';
    const still = now !== '' && now === before && !now.includes('state-loading');
    before = now;
    return still;
  };
  await expect.poll(quiet, { interval: 50, timeout: 10_000 }).toBe(true);
}

/**
 * Opens an address in a theme, and waits for its view.
 *
 * @param address - The address, from `#`.
 * @param theme - The colour theme.
 */
export async function open(address: string, theme: Theme = 'light'): Promise<void> {
  applyTheme(document.documentElement, theme);
  location.hash = address;
  await settled();
}
