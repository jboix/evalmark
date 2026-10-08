/**
 * The page's frame: the header with the name, the navigation and the theme, each page's title, and
 * its sections.
 */

import type { ComponentChildren } from 'preact';
import type { Branding } from '../../format/store.ts';
import { links, type Route } from '../lib/route.ts';
import { ThemeSwitch } from './theme-switch.tsx';

/** One entry of the navigation. */
interface NavEntry {
  /** What it says. */
  readonly text: string;
  /** Where it goes. */
  readonly href: string;
  /** The views it is current for. */
  readonly views: readonly Route['view'][];
}

/** The navigation. */
const navEntries: readonly NavEntry[] = [
  { text: 'Results', href: links.results(), views: ['results', 'case'] },
  { text: 'Runs', href: links.runs(), views: ['runs', 'run', 'trial'] },
  { text: 'Compare', href: links.compare(), views: ['compare'] },
];

/**
 * The mark: the project's logo when it gave one, or else evalmark's hallmark, the clipped frame a
 * hallmark is punched in, with EM inside.
 *
 * @param props - The logo's path, if any.
 * @returns The mark.
 */
function Mark(props: { readonly logo: string | undefined }) {
  if (props.logo !== undefined) return <img class="brand-logo" src={props.logo} alt="" />;
  return (
    <svg class="brand-mark" viewBox="0 0 56 56" width="28" height="28" aria-hidden="true">
      <path
        d="M12 4 H44 L52 12 V44 L44 52 H12 L4 44 V12 Z"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linejoin="round"
      />
      <text x="28" y="36.5" text-anchor="middle" class="brand-mark-text">
        EM
      </text>
    </svg>
  );
}

/**
 * The header: the mark, the title with its subtitle under it, the navigation, and the theme
 * button.
 *
 * @param props - The branding and the current route.
 * @returns The header.
 */
export function Header(props: { readonly branding: Branding; readonly route: Route }) {
  const { branding } = props;
  return (
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href={links.results()}>
          <Mark logo={branding.logo} />
          <span class="brand-text">
            <span class="brand-name">{branding.title}</span>
            <span class="brand-subtitle">{branding.subtitle}</span>
          </span>
        </a>
        <nav class="nav" aria-label="Sections">
          {navEntries.map((entry) => (
            <a
              key={entry.href}
              href={entry.href}
              class="nav-link"
              aria-current={entry.views.includes(props.route.view) ? 'page' : undefined}
            >
              {entry.text}
            </a>
          ))}
        </nav>
        <ThemeSwitch />
      </div>
    </header>
  );
}

/** Where evalmark lives, for the footer's link. */
const evalmarkUrl = 'https://github.com/jboix/evalmark';

/**
 * The footer: a link to evalmark, so people who like the dashboard find where it comes from.
 *
 * @returns The footer.
 */
export function Footer() {
  return (
    <footer class="footer">
      <p>
        Made with <a href={evalmarkUrl}>evalmark</a>, eval history kept in your own repository.
      </p>
    </footer>
  );
}

/**
 * A page: a small line above its title (such as the way back), its title, a line under it, and
 * its content.
 *
 * @param props - The parts of the page.
 * @returns The page.
 */
export function Page(props: {
  readonly title: ComponentChildren;
  readonly above?: ComponentChildren;
  readonly below?: ComponentChildren;
  readonly children?: ComponentChildren;
}) {
  return (
    <>
      <div class="page-head">
        {props.above === undefined ? null : <p class="page-above">{props.above}</p>}
        <h1 class="page-title">{props.title}</h1>
        {props.below === undefined ? null : <div class="page-below">{props.below}</div>}
      </div>
      {props.children}
    </>
  );
}

/**
 * A titled section of a page, separated from the one before by space and a rule.
 *
 * @param props - Its title, controls next to it, a line under it, and its content.
 * @returns The section.
 */
export function Section(props: {
  readonly title: ComponentChildren;
  readonly aside?: ComponentChildren;
  readonly hint?: string;
  readonly children?: ComponentChildren;
}) {
  return (
    <section class="section">
      <div class="section-head">
        <h2 class="section-title">{props.title}</h2>
        {props.aside === undefined ? null : <div class="section-aside">{props.aside}</div>}
      </div>
      {props.hint === undefined ? null : <p class="section-hint">{props.hint}</p>}
      {props.children}
    </section>
  );
}
