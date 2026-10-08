/**
 * The dashboard's branding: the title, the line under it and the logo the project gives through
 * the action's inputs, written into the folder on every run.
 */
import { existsSync } from 'node:fs';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { type Branding, brandingFolder, brandingPath } from '../format/store.ts';
import { writeJson } from './index-file.ts';

/** The branding the inputs give: the logo is a path to a file in the workspace. */
export interface BrandingInput {
  /** The title. */
  readonly title: string;
  /** The line under it. */
  readonly subtitle: string;
  /** The logo file's path, when given. */
  readonly logo: string | undefined;
}

/** The image types a logo may have: what every browser shows in an `<img>`. */
const logoExtensions: ReadonlySet<string> = new Set([
  '.svg',
  '.png',
  '.webp',
  '.jpg',
  '.jpeg',
  '.gif',
]);

/**
 * Checks a logo file.
 *
 * @param path - Its path.
 * @returns Its extension, in lower case.
 * @throws When the file is missing or is not an image a browser shows.
 */
function logoExtension(path: string): string {
  const extension = extname(path).toLowerCase();
  if (!logoExtensions.has(extension)) {
    throw new Error(`The logo ${path} must be an SVG, PNG, WebP, JPEG or GIF image.`);
  }
  if (!existsSync(path)) throw new Error(`The logo ${path} does not exist.`);
  return extension;
}

/**
 * Writes the branding into the folder: the logo copied as `data/branding/logo.<ext>`, the previous
 * one removed, and `data/branding.json`.
 *
 * @param folder - The action's folder on disk.
 * @param input - The branding the inputs give.
 * @returns When it is written.
 * @throws When the logo is missing or is not an image.
 */
export async function writeBranding(folder: string, input: BrandingInput): Promise<void> {
  await rm(join(folder, brandingFolder), { recursive: true, force: true });
  let logo: string | undefined;
  if (input.logo !== undefined) {
    logo = `${brandingFolder}/logo${logoExtension(input.logo)}`;
    await mkdir(join(folder, brandingFolder), { recursive: true });
    await copyFile(input.logo, join(folder, logo));
  }
  const branding: Branding = {
    title: input.title,
    subtitle: input.subtitle,
    ...(logo === undefined ? {} : { logo }),
  };
  await writeJson(join(folder, brandingPath), branding);
}
