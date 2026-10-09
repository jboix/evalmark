# Contributing to evalmark

Thanks for contributing. Agents working in this repository also follow [AGENTS.md](AGENTS.md).
Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

```sh
pnpm install
pnpm run verify    # everything CI checks
pnpm run demo      # a synthetic history, served on http://127.0.0.1:4400
```

Requirements: Node at the version in `.nvmrc` (24), and pnpm at the version in `package.json`'s
`packageManager` field (`corepack enable` installs it). `verify` runs:

| Step                  | Tool               | Checks                                                 |
| --------------------- | ------------------ | ------------------------------------------------------ |
| `pnpm run lint`       | Biome              | Formatting, lint rules, complexity and length limits   |
| `pnpm run docs:check` | remark             | Markdown formatting, broken links                      |
| `pnpm run arch`       | dependency-cruiser | Module boundaries, cycles                              |
| `pnpm run knip`       | knip               | Dead code, unused exports and dependencies             |
| `pnpm run typecheck`  | tsc                | Type errors, with `exactOptionalPropertyTypes`         |
| `pnpm run test`       | Vitest, on Node    | Unit tests, and the action end to end on a bare remote |
| `pnpm run check:dist` | tsdown and Vite    | `dist/` builds, and matches what is committed          |

`dist/` is committed, as GitHub runs an action from its repository, and npm publishes it as it is.
Run `pnpm run build` and commit `dist/` with any change to `src/`. tsdown bundles the action
(`dist/index.js`), the CLI (`dist/cli.js`) and the library's types (`dist/lib.js`, `dist/lib.d.ts`)
with every dependency inlined; Vite builds the dashboard into `dist/site/`. `pnpm run site:dev`
serves the dashboard on a fixture with Vite's dev server, which reloads on each change.

## Layout

| Path                 | What it is                                                                    |
| -------------------- | ----------------------------------------------------------------------------- |
| `src/format/`        | The result format, the stored format, totals and comparison: the contract.    |
| `src/index.ts`       | The npm package's library entry: the result format's types.                   |
| `src/action/`        | The GitHub Action. Runs on Node 24, bundled into `dist/index.js`.             |
| `src/import/`        | Importers: promptfoo, Inspect AI and JUnit XML output to results.             |
| `src/site/`          | The dashboard. Preact, built into `dist/site/`.                               |
| `src/cli/`           | `evalmark`: record a run locally, import, preview a branch, the demo.         |
| `schema/`            | The result format's JSON Schema, one file per format version.                 |
| `scripts/`           | The dashboard's dev server, the schema writer, the major tag of a release.    |
| `docs/`              | The result format, importing, the brand.                                      |
| `test/`              | Fixtures, and the end-to-end tests of the action against a local bare remote. |
| `.github/workflows/` | Quality, Release, the demo site, and the action run on itself.                |

## Module boundaries

`.dependency-cruiser.cjs` enforces them.

- `format/` imports no other module.
- Everything runs on Node 24: `node:` modules, never `Bun`. `action/` imports `format/` and
  `import/`; `import/` imports `format/` only.
- `site/` runs in the browser. It imports `format/` only, and only types from the zod schemas, so
  the dashboard ships without zod.
- `cli/` may import everything but `site/`.
- `index.ts`, the package's public API, imports `format/` only.

## How it works

**Recording.** The action reads the result file (importing it first when another tool wrote it,
one result per model), validates and redacts it, then for each result:

1. fetches the branch's tip into a temporary repository, or starts an orphan branch;
2. writes the run file, its gzipped transcripts and its attachments, applies retention, rebuilds
   the index from the run files, writes the badges and the branding, and copies the dashboard;
3. commits as `github-actions[bot]` (squashing the history when retention pruned, on a branch it
   owns alone) and pushes, redoing step 2 on the new tip when the push loses a race;
4. comments on the pull request and writes the job summary and the outputs.

Git gets the token through `GIT_CONFIG_*` variables, never a URL, a file or a command line. Tests
point `GITHUB_SERVER_URL` at a local bare repository. A failure is a warning unless
`fail-on-error` is set.

**Storage.** Inside the folder on the branch:

```text
index.html, *.js, *.css, fonts/          the dashboard
data/index.json                          every run's summary, newest first
data/runs/<run>.json                     one run, its cases and trials
data/transcripts/<run>/<case>/<n>.json.gz  a kept transcript
data/attachments/<sha256>.<ext>          a kept attachment, one file per distinct content
data/branding.json, data/branding/       the title, subtitle and logo
badges/                                  pass rate and cost, SVG and shields.io JSON
```

`src/format/store.ts` defines these files. The index keeps one letter per trial for each case
(`P`, `F`, `E`, `S`), enough for every table and chart without opening the run files.

**The dashboard** is a static Preact app with hash routes, so every view and filter is a permanent
link and it works in any folder of any host. Its content security policy allows no inline script,
no inline style element and no other origin; its fonts are files beside the page.

## Changing the result format

`src/format/result.ts` is the format, and its descriptions become the JSON Schema's.

- An added optional field keeps the version. Run `pnpm run schema` and commit
  `schema/result.v1.json`.
- A change that breaks existing files makes a new version: raise `resultVersion`, run
  `pnpm run schema` to write `schema/result.v2.json`, keep the old file, and commit with a
  `BREAKING CHANGE:` footer, which releases a new major version of the action.

Document the change in [the result format](docs/result-format.md).

## Commits and releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org), which commitlint
checks. The type sets the release:

- `fix` releases a patch, `feat` a minor version.
- A `BREAKING CHANGE:` footer releases a major version. A `!` after the type is not read.
- `docs`, `chore`, `ci`, `test`, `build` and `refactor` release nothing.

Once Quality passes on `main`, the Release workflow runs semantic-release: it commits the new
version in `package.json` as `chore(release): X.Y.Z [skip ci]`, tags that commit `vX.Y.Z`,
publishes the package `evalmark` to npm with the committed `dist/`, creates the GitHub Release with
its notes, and moves the major tag (`v1`) to it. It pushes with the release bot's token, a GitHub
App the `main` ruleset lets push without a pull request, whose `RELEASE_APP_ID` and
`RELEASE_APP_PRIVATE_KEY` are secrets of the `release` environment.

Husky runs Biome on staged files before a commit, commitlint on the message, and
`pnpm run verify` before a push.

## Repository settings

Four settings no commit makes:

- Pages serves the `gh-pages` branch (Settings, Pages, Deploy from a branch). The GitHub Page
  workflow writes the demo and the JSON Schemas there on every push to `main`.
- Actions may create tags and releases with the workflow's token (Settings, Actions, General,
  Workflow permissions: read and write).
- The `release` environment exists and deploys from `main` only (Settings, Environments, New
  environment `release`, Deployment branches and tags: Selected branches, `main`). The Release job
  runs in it. It holds the release bot's secrets, `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY`,
  and the bot (a GitHub App) is installed on the repository and may bypass the `main` ruleset.
- npm trusts the Release workflow to publish `evalmark`, without a token, and only from that
  environment. On npmjs.com, the package's Settings, Trusted publishing, GitHub Actions:
  organization or user `jboix`, repository `evalmark`, workflow `release.yml`, environment
  `release`.

npm only configures a trusted publisher for a package that exists, and the Release workflow stops
before tagging when npm does not trust it. So the name is reserved by hand, once, before the first
release:

1. In a clean clone of `main`, run `npm login`, `npm pkg delete scripts.prepare`, then
   `npm publish --tag reserve --provenance=false`. This publishes the placeholder version
   `0.0.0-development`, from the committed `dist/`, without the contributors' husky script, as
   the Release workflow does.
2. Configure the trusted publisher as above. Then, in Settings, Publishing access, choose "Require
   two-factor authentication and disallow tokens".
3. Run `npm deprecate evalmark@0.0.0-development "A placeholder: install a released version."`.

From then on, every release publishes from the workflow, with provenance.

## Pull requests

- One change per pull request, with tests.
- Update the README or the docs when a documented behaviour changes.
- `pnpm run verify` passes locally.
