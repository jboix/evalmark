/**
 * Badges for the default branch's latest run: pass rate and cost, as flat SVG images and as
 * shields.io endpoint files, in `badges/` inside the folder.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RunSummary } from '../format/store.ts';
import { formatCost, formatPercent } from './numbers.ts';

/** A badge's text and colour. */
export interface Badge {
  /** The left part. */
  readonly label: string;
  /** The right part. */
  readonly message: string;
  /** The right part's colour, as a hex colour. */
  readonly color: string;
}

/** The folder of the badges, inside the action's folder. */
export const badgesFolder = 'badges';

/**
 * Escapes text for XML.
 *
 * @param text - The text.
 * @returns The escaped text.
 */
export function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * The width a text takes in the badge's 11px font, roughly.
 *
 * @param text - The text.
 * @returns The width in pixels.
 */
function textWidth(text: string): number {
  return Math.round(Array.from(text).length * 6.6) + 10;
}

/**
 * A flat badge as SVG.
 *
 * @param badge - Its text and colour.
 * @returns The SVG document.
 */
export function badgeSvg(badge: Badge): string {
  const [label, message] = [escapeXml(badge.label), escapeXml(badge.message)];
  const [left, right] = [textWidth(badge.label), textWidth(badge.message)];
  const width = left + right;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${message}">`,
    `<title>${label}: ${message}</title>`,
    `<rect width="${left}" height="20" fill="#555"/>`,
    `<rect x="${left}" width="${right}" height="20" fill="${escapeXml(badge.color)}"/>`,
    '<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">',
    `<text x="${left / 2}" y="14">${label}</text>`,
    `<text x="${left + right / 2}" y="14">${message}</text>`,
    '</g></svg>',
    '',
  ].join('\n');
}

/**
 * A shields.io endpoint file for a badge.
 *
 * @param badge - Its text and colour.
 * @returns The JSON text.
 */
export function badgeEndpoint(badge: Badge): string {
  const color = badge.color.replace(/^#/, '');
  return `${JSON.stringify({ schemaVersion: 1, label: badge.label, message: badge.message, color })}\n`;
}

/**
 * The colour of a pass rate.
 *
 * @param passRate - The pass rate, from 0 to 1, or `null`.
 * @returns A hex colour.
 */
function passRateColor(passRate: number | null): string {
  if (passRate === null) return '#9f9f9f';
  if (passRate >= 0.9) return '#4c1';
  if (passRate >= 0.75) return '#97ca00';
  if (passRate >= 0.5) return '#dfb317';
  return '#e05d44';
}

/**
 * The badges of a run.
 *
 * @param run - The run.
 * @returns The badges, by file name without extension.
 */
export function badgesOf(run: RunSummary): Record<string, Badge> {
  const { passRate, costUsd } = run.totals;
  return {
    'pass-rate': {
      label: 'pass rate',
      message: passRate === null ? 'n/a' : formatPercent(passRate),
      color: passRateColor(passRate),
    },
    cost: { label: 'eval cost', message: formatCost(costUsd), color: '#007ec6' },
  };
}

/**
 * The run the badges show: the newest on the default branch, or the newest when it is unknown.
 *
 * @param runs - The runs, newest first.
 * @param defaultBranch - The default branch, when known.
 * @returns The run, or `undefined` when the default branch has none.
 */
export function badgeRun(
  runs: readonly RunSummary[],
  defaultBranch: string | undefined,
): RunSummary | undefined {
  if (defaultBranch === undefined) return runs[0];
  return runs.find((run) => run.source.branch === defaultBranch);
}

/**
 * Writes the badges of a run into the folder.
 *
 * @param folder - The action's folder on disk.
 * @param run - The run they show.
 * @returns When they are written.
 */
export async function writeBadges(folder: string, run: RunSummary): Promise<void> {
  const target = join(folder, badgesFolder);
  await mkdir(target, { recursive: true });
  for (const [name, badge] of Object.entries(badgesOf(run))) {
    await writeFile(join(target, `${name}.svg`), badgeSvg(badge));
    await writeFile(join(target, `${name}.json`), badgeEndpoint(badge));
  }
}
