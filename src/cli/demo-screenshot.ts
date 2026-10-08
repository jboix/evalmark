/**
 * The demo's screenshots: a flat drawing of the panel a trial wrote, the right one or a wrong one,
 * alone as the `write_panel` tool saw it or inside the dashboard at the end of the trial. Each is
 * a small indexed PNG, the same for the same case, so the store keeps one file per drawing.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { type DemoCase, demoCases } from './demo-catalog.ts';
import { encodePng, type Rgb } from './demo-png.ts';
import { type Random, seededRandom } from './demo-random.ts';

/** Whether the panel is the one the case asks for. */
export type ScreenshotVariant = 'right' | 'wrong';

/** What the screenshot shows: the panel alone, or the dashboard around it. */
export type ScreenshotView = 'panel' | 'dashboard';

/** A rectangle, in pixels. */
interface Box {
  /** Its left edge. */
  readonly x: number;
  /** Its top edge. */
  readonly y: number;
  /** Its width. */
  readonly width: number;
  /** Its height. */
  readonly height: number;
}

/** An image being drawn: palette indexes, row by row. */
interface Canvas {
  /** Its width. */
  readonly width: number;
  /** Its height. */
  readonly height: number;
  /** Its pixels. */
  readonly pixels: Uint8Array;
}

/** Draws a panel's content into its plot area. */
type Painter = (canvas: Canvas, plot: Box, random: Random, right: boolean) => void;

/** The colours, by name, as indexes into the palette. */
const colour = {
  background: 0,
  border: 1,
  titleBar: 2,
  text: 3,
  blue: 4,
  orange: 5,
  green: 6,
  grid: 7,
  red: 8,
  appBar: 9,
  page: 10,
  paleBlue: 11,
  midBlue: 12,
} as const;

/** The palette, in the order of `colour`. */
const palette: readonly Rgb[] = [
  [255, 255, 255],
  [212, 212, 208],
  [241, 241, 238],
  [138, 138, 133],
  [59, 111, 216],
  [224, 128, 58],
  [47, 158, 110],
  [232, 232, 228],
  [214, 69, 69],
  [35, 39, 46],
  [246, 246, 243],
  [185, 205, 243],
  [122, 157, 230],
];

/** The series colours, in order. */
const seriesColours = [colour.blue, colour.orange, colour.green] as const;

/**
 * Fills a rectangle, clipped to the canvas.
 *
 * @param canvas - The canvas.
 * @param box - The rectangle.
 * @param index - The palette index.
 */
function fill(canvas: Canvas, box: Box, index: number): void {
  const left = Math.max(0, Math.round(box.x));
  const right = Math.min(canvas.width, Math.round(box.x + box.width));
  const bottom = Math.min(canvas.height, Math.round(box.y + box.height));
  for (let row = Math.max(0, Math.round(box.y)); row < bottom; row += 1) {
    canvas.pixels.fill(
      index,
      row * canvas.width + left,
      row * canvas.width + Math.max(left, right),
    );
  }
}

/**
 * Draws a line two pixels thick.
 *
 * @param canvas - The canvas.
 * @param from - Where it starts, as `[x, y]`.
 * @param to - Where it ends, as `[x, y]`.
 * @param index - The palette index.
 */
function line(canvas: Canvas, from: readonly number[], to: readonly number[], index: number): void {
  const [x0 = 0, y0 = 0] = from;
  const [x1 = 0, y1 = 0] = to;
  const steps = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let step = 0; step <= steps; step += 1) {
    const x = x0 + ((x1 - x0) * step) / steps;
    const y = y0 + ((y1 - y0) * step) / steps;
    fill(canvas, { x, y, width: 2, height: 2 }, index);
  }
}

/**
 * Draws the horizontal grid lines of a plot.
 *
 * @param canvas - The canvas.
 * @param plot - The plot area.
 */
function grid(canvas: Canvas, plot: Box): void {
  for (let level = 0; level <= 4; level += 1) {
    const y = plot.y + (plot.height * level) / 4;
    fill(canvas, { x: plot.x, y, width: plot.width, height: 1 }, colour.grid);
    fill(canvas, { x: plot.x - 16, y: y - 2, width: 10, height: 3 }, colour.border);
  }
}

/**
 * Draws lines, one per series: three when right, one when wrong.
 *
 * @param canvas - The canvas.
 * @param plot - The plot area.
 * @param random - The generator.
 * @param right - Whether the panel is the right one.
 */
const timeseries: Painter = (canvas, plot, random, right) => {
  grid(canvas, plot);
  const points = 24;
  for (const index of seriesColours.slice(0, right ? 3 : 1)) {
    let level = random.next() * 0.6 + 0.2;
    let previous: number[] | undefined;
    for (let point = 0; point < points; point += 1) {
      level = Math.min(0.95, Math.max(0.05, level + (random.next() - 0.5) * 0.2));
      const here = [plot.x + (plot.width * point) / (points - 1), plot.y + plot.height * level];
      if (previous) line(canvas, previous, here, index);
      previous = here;
    }
  }
};

/**
 * Draws bars: seven when right, three grey ones when wrong.
 *
 * @param canvas - The canvas.
 * @param plot - The plot area.
 * @param random - The generator.
 * @param right - Whether the panel is the right one.
 */
const bars: Painter = (canvas, plot, random, right) => {
  grid(canvas, plot);
  const count = right ? 7 : 3;
  const slot = plot.width / count;
  for (let bar = 0; bar < count; bar += 1) {
    const height = plot.height * (0.25 + random.next() * 0.7);
    const box = { x: plot.x + bar * slot + slot * 0.2, y: plot.y + plot.height - height };
    fill(canvas, { ...box, width: slot * 0.6, height }, right ? colour.blue : colour.text);
  }
};

/**
 * Draws one row of a table: three cells, the last a number, blue in a right panel's body.
 *
 * @param canvas - The canvas.
 * @param row - The row's area.
 * @param random - The generator.
 * @param numbers - The colour of the last cell.
 */
function tableRow(canvas: Canvas, row: Box, random: Random, numbers: number): void {
  for (const [column, share] of [0, 0.4, 0.75].entries()) {
    const last = column === 2;
    const width = (last ? 0.15 : 0.25) * row.width * (0.5 + random.next() * 0.5);
    const box = { x: row.x + 6 + row.width * share, y: row.y + 6, width, height: 4 };
    fill(canvas, box, last ? numbers : colour.border);
  }
}

/**
 * Draws a table: a header and striped rows, three rows when wrong.
 *
 * @param canvas - The canvas.
 * @param plot - The plot area.
 * @param random - The generator.
 * @param right - Whether the panel is the right one.
 */
const table: Painter = (canvas, plot, random, right) => {
  const height = 16;
  const rows = right ? Math.floor(plot.height / height) : 3;
  fill(canvas, { ...plot, height }, colour.titleBar);
  tableRow(canvas, { ...plot, height }, random, colour.text);
  for (let row = 1; row < rows; row += 1) {
    const box = { ...plot, y: plot.y + row * height, height };
    if (row % 2 === 0) fill(canvas, box, colour.page);
    tableRow(canvas, box, random, right ? colour.blue : colour.border);
  }
};

/**
 * Draws a big number with a sparkline under it; grey when wrong.
 *
 * @param canvas - The canvas.
 * @param plot - The plot area.
 * @param random - The generator.
 * @param right - Whether the panel is the right one.
 */
const stat: Painter = (canvas, plot, random, right) => {
  const digit = { width: 20, height: 36 };
  const left = plot.x + plot.width / 2 - 2 * (digit.width + 6);
  for (let place = 0; place < 4; place += 1) {
    const box = { x: left + place * (digit.width + 6), y: plot.y + 12, ...digit };
    fill(canvas, box, right ? colour.blue : colour.text);
    fill(canvas, { ...box, x: box.x + 5, y: box.y + 7, width: 10, height: 8 }, colour.background);
  }
  const spark = { ...plot, y: plot.y + plot.height - 30, height: 26 };
  let previous: number[] = [spark.x, spark.y + spark.height / 2];
  for (let point = 1; point <= 20; point += 1) {
    const here = [spark.x + (spark.width * point) / 20, spark.y + random.next() * spark.height];
    line(canvas, previous, here, colour.paleBlue);
    previous = here;
  }
};

/**
 * Draws a heatmap of cells shaded in blues; a single line, as a time series would, when wrong.
 *
 * @param canvas - The canvas.
 * @param plot - The plot area.
 * @param random - The generator.
 * @param right - Whether the panel is the right one.
 */
const heatmap: Painter = (canvas, plot, random, right) => {
  if (!right) return timeseries(canvas, plot, random, right);
  const shades = [colour.grid, colour.paleBlue, colour.midBlue, colour.blue];
  const [columns, rows] = [16, 6];
  const cell = { width: plot.width / columns, height: plot.height / rows };
  for (let index = 0; index < columns * rows; index += 1) {
    const x = plot.x + (index % columns) * cell.width;
    const y = plot.y + Math.floor(index / columns) * cell.height;
    const box = { x: x + 1, y: y + 1, width: cell.width - 2, height: cell.height - 2 };
    fill(canvas, box, random.pick(shades));
  }
};

/** The painter of each panel type. */
const painters: Readonly<Record<string, Painter>> = { timeseries, bar: bars, table, stat, heatmap };

/**
 * A number from a case's id, to seed its drawing.
 *
 * @param text - The id.
 * @returns The seed.
 */
function seedOf(text: string): number {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619);
  return hash >>> 0;
}

/**
 * Draws a panel: its frame, title bar and content.
 *
 * @param canvas - The canvas.
 * @param box - Where the panel goes.
 * @param demoCase - The case, for the panel's type and title.
 * @param variant - Whether the panel is the right one.
 */
function panel(canvas: Canvas, box: Box, demoCase: DemoCase, variant: ScreenshotVariant): void {
  fill(canvas, box, colour.border);
  fill(canvas, { x: box.x + 1, y: box.y + 1, width: box.width - 2, height: box.height - 2 }, 0);
  fill(canvas, { x: box.x + 1, y: box.y + 1, width: box.width - 2, height: 18 }, colour.titleBar);
  const titleWidth = Math.min(box.width - 40, demoCase.title.length * 4);
  fill(canvas, { x: box.x + 8, y: box.y + 8, width: titleWidth, height: 4 }, colour.text);
  if (variant === 'wrong') {
    fill(canvas, { x: box.x + box.width - 14, y: box.y + 6, width: 7, height: 7 }, colour.red);
  }
  const plot = { x: box.x + 26, y: box.y + 28, width: box.width - 38, height: box.height - 40 };
  const paint = painters[demoCase.panel] ?? timeseries;
  paint(canvas, plot, seededRandom(seedOf(demoCase.id)), variant === 'right');
}

/**
 * Draws one screenshot.
 *
 * @param demoCase - The case.
 * @param variant - Whether the panel is the right one.
 * @param view - The panel alone, or the dashboard around it.
 * @returns The PNG file's bytes.
 */
export function screenshotOf(
  demoCase: DemoCase,
  variant: ScreenshotVariant,
  view: ScreenshotView,
): Uint8Array {
  const [width, height] = view === 'panel' ? [320, 180] : [320, 200];
  const canvas = { width, height, pixels: new Uint8Array(width * height) };
  if (view === 'panel') {
    panel(canvas, { x: 0, y: 0, width, height }, demoCase, variant);
    return encodePng({ ...canvas, palette });
  }
  fill(canvas, { x: 0, y: 0, width, height }, colour.page);
  fill(canvas, { x: 0, y: 0, width, height: 14 }, colour.appBar);
  fill(canvas, { x: 6, y: 4, width: 6, height: 6 }, colour.orange);
  fill(canvas, { x: 8, y: 20, width: Math.min(200, demoCase.title.length * 5), height: 5 }, 3);
  panel(canvas, { x: 8, y: 32, width: width - 16, height: height - 40 }, demoCase, variant);
  return encodePng({ ...canvas, palette });
}

/**
 * Where a screenshot is, relative to the demo's result.
 *
 * @param caseId - The case's id.
 * @param variant - Whether the panel is the right one.
 * @param view - The panel alone, or the dashboard around it.
 * @returns The path.
 */
export function screenshotPath(
  caseId: string,
  variant: ScreenshotVariant,
  view: ScreenshotView,
): string {
  return `screenshots/${caseId}-${view}-${variant}.png`;
}

/**
 * Writes every screenshot the demo history may point to.
 *
 * @param folder - The folder its paths are relative to.
 * @returns When they are written.
 */
export async function writeScreenshots(folder: string): Promise<void> {
  for (const demoCase of demoCases) {
    for (const variant of ['right', 'wrong'] as const) {
      for (const view of ['panel', 'dashboard'] as const) {
        const path = join(folder, screenshotPath(demoCase.id, variant, view));
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, screenshotOf(demoCase, variant, view));
      }
    }
  }
}
