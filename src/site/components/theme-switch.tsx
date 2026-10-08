/**
 * The theme button: system, light and dark in turn, remembered in the browser. Its icon shows the
 * current choice, as on quanthea's site.
 */
import { useState } from 'preact/hooks';
import { applyTheme, nextTheme, storedTheme, storeTheme, type Theme } from '../lib/theme.ts';

/** What each theme is called, for the button's label. */
const themeNames: Readonly<Record<Theme, string>> = {
  light: 'light',
  dark: 'dark',
  system: 'the system’s',
};

/**
 * The icon of a theme.
 *
 * @param props - The theme.
 * @returns The icon.
 */
function ThemeIcon(props: { readonly theme: Theme }) {
  if (props.theme === 'light') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    );
  }
  if (props.theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The button.
 *
 * @returns The control.
 */
export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(() => storedTheme(() => localStorage));
  const next = nextTheme(theme);
  const choose = () => {
    setTheme(next);
    applyTheme(document.documentElement, next);
    storeTheme(() => localStorage, next);
  };
  return (
    <button
      type="button"
      class="theme-switch"
      onClick={choose}
      aria-label={`Colour theme: ${themeNames[theme]}. Switch to ${themeNames[next]}.`}
      title={`Colour theme: ${themeNames[theme]}`}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
