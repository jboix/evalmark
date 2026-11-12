/**
 * The dashboard with a keyboard only: every control is reached with Tab and shows where the focus
 * is, and the trend, the tables, the theme button and the screenshots answer their keys. The last
 * tests check that a narrow screen never scrolls sideways.
 */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mount, open, type Place, places, settled } from './dashboard.tsx';

/** The views. */
const views = await places();

/** What a reader can operate: links, buttons, fields, and what the page made focusable. */
const controls = 'a[href], button, select, input, summary, [tabindex="0"]';

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

/**
 * The controls the page shows now.
 *
 * @returns The controls, in the document's order.
 */
function shownControls(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(controls)].filter(
    (control) => control.closest('#app') !== null && control.getClientRects().length > 0,
  );
}

/**
 * Presses Tab from the top of the page until the focus leaves the dashboard.
 *
 * @param most - The most presses to make.
 * @returns What took the focus, in order, each with whether it showed a focus ring.
 */
async function tabThrough(most: number): Promise<{ control: Element; ring: boolean }[]> {
  const visited: { control: Element; ring: boolean }[] = [];
  shownControls()[0]?.focus();
  await userEvent.tab({ shift: true });
  for (let press = 0; press < most; press += 1) {
    await userEvent.tab();
    const control = document.activeElement;
    if (control === null || control.closest('#app') === null) break;
    const style = getComputedStyle(control);
    visited.push({ control, ring: style.outlineStyle !== 'none' && style.outlineWidth !== '0px' });
  }
  return visited;
}

let unmount = () => {};

beforeEach(async () => {
  await page.viewport(1280, 800);
  unmount = mount();
});

afterEach(() => unmount());

describe('the keyboard', () => {
  test.for(views.filter((view) => view.name !== 'the results by cost'))(
    'reaches every control of $name with Tab, each with a focus ring',
    async ({ address }) => {
      await open(address);
      const expected = shownControls();
      // A date field takes several presses: it has a stop for each of its parts.
      const visited = await tabThrough(expected.length * 2 + 20);
      expect(
        expected.filter((control) => !visited.some((stop) => stop.control === control)),
      ).toEqual([]);
      expect(visited.filter((stop) => !stop.ring).map((stop) => stop.control)).toEqual([]);
    },
  );

  test('moves the trend readout with the arrow keys, and opens the run with Enter', async () => {
    await open(addressOf('the results'));
    const plot = document.querySelector<HTMLElement>('[role="slider"]');
    plot?.focus();
    expect(plot?.getAttribute('aria-valuetext')).toBe('No run selected');
    await userEvent.keyboard('{ArrowRight}');
    const first = plot?.getAttribute('aria-valuetext');
    expect(plot?.getAttribute('aria-valuenow')).toBe('0');
    await userEvent.keyboard('{End}');
    expect(plot?.getAttribute('aria-valuenow')).toBe(plot?.getAttribute('aria-valuemax'));
    expect(plot?.getAttribute('aria-valuetext')).not.toBe(first);
    await userEvent.keyboard('{Escape}');
    expect(plot?.getAttribute('aria-valuetext')).toBe('No run selected');
    await userEvent.keyboard('{Home}{Enter}');
    await settled();
    expect(location.hash).toMatch(/^#\/runs\/[^/]+$/);
  });

  test('sorts a table with Enter on its column, and says so', async () => {
    await open(addressOf('the runs'));
    const header = document.querySelector<HTMLElement>('th[aria-sort]');
    const before = header?.getAttribute('aria-sort');
    header?.querySelector('button')?.focus();
    await userEvent.keyboard('{Enter}');
    await settled();
    const after = document.querySelector('th[aria-sort]')?.getAttribute('aria-sort');
    expect([before, after].sort()).toEqual(['ascending', 'descending']);
  });

  test('switches the colour theme with Enter, and names the theme it is in', async () => {
    await open(addressOf('the runs'));
    const button = document.querySelector<HTMLElement>('.theme-switch');
    const before = button?.getAttribute('aria-label');
    button?.focus();
    await userEvent.keyboard('{Enter}');
    expect(button?.getAttribute('aria-label')).not.toBe(before);
    expect(button?.getAttribute('aria-label')).toContain(
      `Colour theme: ${document.documentElement.dataset.theme}`,
    );
  });

  test('says how many cases a search keeps, in a live region', async () => {
    await open(addressOf('the results'));
    document.querySelector<HTMLElement>('input[type="search"]')?.focus();
    await userEvent.keyboard('cart');
    await settled();
    const count = document.querySelector('.count-line');
    expect(count?.getAttribute('aria-live')).toBe('polite');
    expect(count?.textContent).toMatch(/^\d+ cases, \d+ shown$/);
  });

  test('opens a screenshot with Enter, and gives the focus back when Escape closes it', async () => {
    await open(addressOf('a trial'));
    const thumbnail = document.querySelector<HTMLElement>('.shot-button');
    thumbnail?.focus();
    await userEvent.keyboard('{Enter}');
    const dialog = document.querySelector('dialog[open]');
    expect(dialog?.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(document.querySelector('dialog[open]')).toBeNull();
    expect(document.activeElement).toBe(thumbnail);
  });
});

describe('a narrow screen', () => {
  beforeEach(async () => {
    await page.viewport(320, 640);
  });

  test.for(views)('never scrolls sideways in $name', async ({ address }) => {
    await open(address);
    const root = document.documentElement;
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  });

  test('lets the keyboard focus a table that scrolls in its box, and names the box', async () => {
    await open(addressOf('the models compared'));
    const boxes = [...document.querySelectorAll<HTMLElement>('.table-box')];
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
      expect(box.tabIndex).toBe(0);
      expect(box.getAttribute('aria-label')).toBe('Table, scrolls sideways');
    }
  });
});
