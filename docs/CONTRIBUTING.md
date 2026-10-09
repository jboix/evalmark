# Contributing to evalmark

Thanks for contributing. Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md),
and agents also follow [AGENTS.md](../AGENTS.md).

## Setup

Node 24 (`.nvmrc`) and pnpm (`corepack enable`).

```sh
pnpm install
pnpm run verify    # everything CI checks: lint, docs, boundaries, knip, types, tests, dist
pnpm run demo      # a synthetic history on http://127.0.0.1:4400
pnpm run site:dev  # the dashboard on a fixture, reloading on each change
```

`dist/` is committed: GitHub runs the action from it and npm publishes it. Run `pnpm run build` and
commit `dist/` with any change to `src/`.

## Layout

| Path           | What it is                                                       |
| -------------- | ---------------------------------------------------------------- |
| `src/format/`  | The result format and the stored format: the contract.           |
| `src/action/`  | The GitHub Action, bundled into `dist/index.js`.                 |
| `src/import/`  | Importers for promptfoo, Inspect AI and JUnit XML.               |
| `src/site/`    | The dashboard, a static Preact app, built into `dist/site/`.     |
| `src/cli/`     | The `evalmark` CLI, bundled into `dist/cli.js`.                  |
| `src/index.ts` | The npm package's entry: the result format's types.              |
| `schema/`      | The result format's JSON Schema, one file per version.           |
| `test/`        | Fixtures, and the action end to end against a local bare remote. |

`.dependency-cruiser.cjs` keeps the boundaries: `format/` imports nothing, the dashboard imports
only `format/` (types only from the zod schemas), and no code uses `Bun`.

## Changing the result format

`src/format/result.ts` is the format; its descriptions become the JSON Schema's. Run
`pnpm run schema` after a change.

- An added optional field keeps the version.
- A change that breaks existing files raises `resultVersion`, which writes a new
  `schema/result.vN.json` beside the old one, and needs a `BREAKING CHANGE:` footer.

Document it in [the result format](result-format.md).

## Commits and releases

Commits follow [Conventional Commits](https://www.conventionalcommits.org). `fix` releases a
patch, `feat` a minor version, a `BREAKING CHANGE:` footer a major one; other types release
nothing.

Once Quality passes on `main`, the Release workflow runs semantic-release: it commits the version,
tags `vX.Y.Z`, publishes to npm, creates the GitHub Release and moves `v1`.
