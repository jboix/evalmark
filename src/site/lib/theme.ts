/**
 * The colour theme: light, dark, or the system's, remembered in the browser. The page reads it
 * before its first render, as the content security policy forbids an inline script in the head.
 */

/** The themes a reader can pick. */
export const themes = ['light', 'dark', 'system'] as const;

/** One of the themes. */
export type Theme = (typeof themes)[number];

/** The storage key of the reader's pick. */
const storageKey = 'evalmark-theme';

/**
 * Reads a theme from a stored value.
 *
 * @param value - The stored value, if any.
 * @returns The theme; `system` for anything unknown.
 */
export function themeOf(value: string | null | undefined): Theme {
  return themes.find((theme) => theme === value) ?? 'system';
}

/**
 * The reader's stored pick. Storage can be missing or throw (a private window, blocked site data),
 * and then the system's theme applies.
 *
 * @param storage - Gives the storage; it may throw.
 * @returns The theme.
 */
export function storedTheme(storage: () => Pick<Storage, 'getItem'>): Theme {
  try {
    return themeOf(storage().getItem(storageKey));
  } catch {
    return 'system';
  }
}

/**
 * Remembers the reader's pick, when storage allows it.
 *
 * @param storage - Gives the storage; it may throw.
 * @param theme - The theme.
 */
export function storeTheme(storage: () => Pick<Storage, 'setItem'>, theme: Theme): void {
  try {
    storage().setItem(storageKey, theme);
  } catch {
    // The pick then lasts until the page is reloaded.
  }
}

/**
 * Applies a theme to the page: `data-theme` on the root element, which the stylesheet reads.
 *
 * @param root - The root element.
 * @param theme - The theme.
 */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  root.dataset.theme = theme;
}

/** The order the theme button goes through, as quanthea's site does: system, light, dark. */
const cycle: readonly Theme[] = ['system', 'light', 'dark'];

/**
 * The theme after this one, when the reader presses the theme button.
 *
 * @param theme - The current theme.
 * @returns The next one.
 */
export function nextTheme(theme: Theme): Theme {
  return cycle[(cycle.indexOf(theme) + 1) % cycle.length] ?? 'system';
}
