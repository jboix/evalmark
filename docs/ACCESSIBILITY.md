# Accessibility

The dashboard aims to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) at level AA. Nobody has
audited it by hand, so this is the goal the tests check against, not a claim of conformance.

This covers the dashboard evalmark builds. What your runs put in it is yours to check: the case
titles, the transcripts, the screenshots and your logo.

## How it is checked

Every change runs these checks in CI, as part of `pnpm run verify`. The browser tests run over a
synthetic history, in Chromium, Firefox and WebKit.

- axe-core checks every view for WCAG 2.0, 2.1 and 2.2 A and AA: the results, the results by cost,
  the results split by model, the results of a search that matches nothing, the runs, a run, a
  trial with its transcript and screenshots, a case, two runs compared, the models compared, and an
  address that matches nothing.
- axe-core checks each of these views in the light theme, in the dark theme, and on a screen 320
  pixels wide.
- axe-core checks the results while a trend's readout shows, and a trial while a screenshot is
  open.
- Browser tests check the keyboard: Tab reaches every control, every control shows a focus ring,
  and the trend, the column headers, the theme button and the screenshots answer their keys.
- Browser tests check that no view scrolls sideways on a screen 320 pixels wide.
- A test checks the theme's colours in both themes: 4.5:1 for every text colour on every surface,
  and 3:1 for the status marks, the trend's lines and the focus ring.
- Biome's accessibility lint rules run on the code.

## What the dashboard does

- Every status has a shape as well as a colour: a disc for a pass, a cross for a fail, a half disc
  for flaky, a triangle for an error, a ring for not run. A legend under the tables that show marks
  says so.
- Every mark has its status in words: beside it, or as its name for a screen reader.
- A trend's lines differ by their dashes as well as their colours.
- Every control is reachable with the keyboard, and every control has a name.
- A visible focus ring shows on keyboard focus.
- The trend is a slider. The arrow keys, Home and End move over the runs, Enter opens the run, and
  Escape clears the readout. A screen reader hears the run's date and each value.
- A table has header cells for its columns. A sorted column says which way it is sorted.
- A table wider than a narrow screen scrolls in its own box. While it scrolls, the keyboard can
  focus the box and scroll it.
- A mark that is a link is a target 24 pixels wide and high. A long history folds onto more lines.
- Every filter has a visible label. The line that counts the rows a filter keeps is a live region.
- A loading message is a status, and a failure is an alert.
- A screenshot opens in a dialog. The focus moves into it, Escape closes it, and the focus goes
  back to the thumbnail.
- The dashboard has a light and a dark theme. It follows the system's, and a button switches.
- The loading spinner follows the system's reduce motion setting.
- A link inside a sentence is underlined.
- The page has a header, a navigation, a main part and a footer. A view's title is its main
  heading, and each section's title is a heading under it.

## Known limitations

- axe-core finds part of the WCAG issues, about 57% by its maker Deque's count. The rest needs a
  review by hand, which has not been done.
- VoiceOver, TalkBack, NVDA and JAWS have not been tested by hand.
- Windows high contrast mode (forced colours) has not been checked.
- The page's title is the same on every view.
- After a link to another view, the focus stays where it was and nothing announces the new view.
- There is no skip link. The header has five controls before the content.
- A field's border is fainter than 3:1 against the page. Its label, its text and its focus ring are
  not.
- The dashboard's own words and dates are in English only.
- A screenshot's caption is its text alternative. A screenshot your harness saved without a
  caption is named by its place, such as "image 1".
- The tests run on one synthetic history. A history with many more runs, models or cases is not
  checked.

## Report a barrier

[Open an accessibility issue](https://github.com/jboix/evalmark/issues/new?template=03_accessibility.yml)
and say what stopped you, on which view, with which device, browser and assistive technology. Every
report is read. There is no fixed timeline for a fix.
