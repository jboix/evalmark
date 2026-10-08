/**
 * The dashboard's entry point. The theme is applied before the first render: the content security
 * policy forbids the inline script that would usually do it in the page's head.
 */
import { render } from 'preact';
import { App } from './app.tsx';
import { applyTheme, storedTheme } from './lib/theme.ts';

applyTheme(
  document.documentElement,
  storedTheme(() => localStorage),
);
const root = document.getElementById('app');
if (root) render(<App />, root);
