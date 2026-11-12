/**
 * axe-core over every view of the dashboard, in the states a reader meets: in the light and the
 * dark theme, on a phone's width, with a trend's readout shown, and with a screenshot open. The
 * rules are in `axe.ts`.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { violations } from './axe.ts';
import { mount, open, type Place, places, settled } from './dashboard.tsx';

/** The views. */
const views = await places();

/** The width of a small phone, in CSS pixels: what WCAG asks a page to reflow to. */
const narrow = 320;

/**
 * The address of a place.
 *
 * @param name - The place's name.
 * @returns Its address.
 */
function addressOf(name: Place['name']): string {
  const place = views.find((candidate) => candidate.name === name);
  if (place === undefined) throw new Error(`No place is named ${name}.`);
  return place.address;
}

let unmount = () => {};

beforeEach(async () => {
  await page.viewport(1280, 800);
  unmount = mount();
});

afterEach(() => unmount());

describe('axe-core', () => {
  test('finds a link that has no name', async () => {
    await open(addressOf('the runs'));
    const link = document.createElement('a');
    link.href = '#/runs';
    document.querySelector('main')?.append(link);
    expect((await violations()).some((line) => line.startsWith('link-name'))).toBe(true);
    link.remove();
  });

  test.for(views)('finds nothing in $name, in the light theme', async ({ address }) => {
    await open(address, 'light');
    expect(await violations()).toEqual([]);
  });

  test.for(views)('finds nothing in $name, in the dark theme', async ({ address }) => {
    await open(address, 'dark');
    expect(await violations()).toEqual([]);
  });

  test.for(views)('finds nothing in $name, on a narrow screen', async ({ address }) => {
    await page.viewport(narrow, 640);
    await open(address);
    expect(await violations()).toEqual([]);
  });

  test("finds nothing while a trend's readout shows", async () => {
    await open(addressOf('the results'));
    const plot = document.querySelector<HTMLElement>('[role="slider"]');
    plot?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(plot?.getAttribute('aria-valuetext')).not.toBe('No run selected');
    expect(await violations()).toEqual([]);
  });

  test('finds nothing while a screenshot is open', async () => {
    await open(addressOf('a trial'));
    document.querySelector<HTMLElement>('.shot-button')?.click();
    await settled();
    expect(document.querySelector('dialog[open]')).not.toBeNull();
    expect(await violations()).toEqual([]);
    document.querySelector<HTMLDialogElement>('dialog[open]')?.close();
  });
});
