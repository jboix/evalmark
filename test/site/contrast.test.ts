/**
 * The theme's colours, by WCAG's contrast formula. axe-core measures the text it can see through;
 * it cannot judge the text of a chart, of a select field or under a sticky table header, nor any
 * mark or line. These tests check the tokens themselves, in the light and the dark theme.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** The stylesheet that declares the tokens. */
const css = readFileSync(new URL('../../src/site/styles/tokens.css', import.meta.url), 'utf8');

/**
 * The colours a rule declares.
 *
 * @param selector - The rule's selector.
 * @returns Each token's colour, by name.
 */
function tokensOf(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No rule for ${selector}.`);
  const block = css.slice(start, css.indexOf('}', start));
  const colours = block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6});/g);
  return Object.fromEntries([...colours].map((match) => [match[1], match[2]]));
}

/**
 * A colour's relative luminance.
 *
 * @param colour - The colour, as `#rrggbb`.
 * @returns The luminance, from 0 to 1.
 */
function luminance(colour: string): number {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((at) => {
    const channel = Number.parseInt(colour.slice(at, at + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * The contrast between two colours.
 *
 * @param first - One colour.
 * @param second - The other.
 * @returns The ratio, from 1 to 21.
 */
function contrast(first: string, second: string): number {
  const [light = 0, dark = 0] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** The themes, each with its tokens. */
const themes = [
  { theme: 'light', tokens: tokensOf(':root') },
  { theme: 'dark', tokens: tokensOf(':root[data-theme="dark"]') },
];

/** What text is written on, and what marks and lines are drawn on. */
const surfaces = ['ground', 'surface', 'sunk'];

/** The colours text is written in. */
const inks = ['ink', 'ink-2', 'ink-3', 'accent', 'pass', 'fail-text'];

/** The colours of the status marks, of the trend's lines and of the focus ring. */
const graphics = ['pass', 'fail', 'flaky', 'error', 'skip', 's1', 's2', 's3', 'accent'];

/**
 * The pairs of a theme that fall short of a contrast.
 *
 * @param tokens - The theme's tokens.
 * @param colours - The colours to check.
 * @param grounds - What they sit on.
 * @param least - The least contrast they need.
 * @returns One line per pair that falls short.
 */
function shortOf(
  tokens: Record<string, string>,
  colours: readonly string[],
  grounds: readonly string[],
  least: number,
): string[] {
  return colours.flatMap((colour) =>
    grounds
      .map((ground) => ({ ground, ratio: contrast(tokens[colour] ?? '', tokens[ground] ?? '') }))
      .filter((pair) => !(pair.ratio >= least))
      .map((pair) => `${colour} on ${pair.ground}: ${pair.ratio.toFixed(2)}`),
  );
}

describe("the theme's contrast", () => {
  test('is the same in the dark theme the system asks for and the one the reader picks', () => {
    expect(tokensOf(':root:not([data-theme="light"])')).toEqual(themes[1]?.tokens);
  });

  test.for(themes)('is at least 4.5:1 for text, in the $theme theme', ({ tokens }) => {
    expect(shortOf(tokens, inks, [...surfaces, 'fail-soft'], 4.5)).toEqual([]);
  });

  test.for(themes)('is at least 3:1 for marks and lines, in the $theme theme', ({ tokens }) => {
    expect(shortOf(tokens, graphics, surfaces, 3)).toEqual([]);
  });
});
