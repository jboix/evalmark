# Agent guide: evalmark

Read this fully before writing code, then [`CONTRIBUTING.md`](CONTRIBUTING.md): the layout, the
module boundaries and how evalmark works.

## What this project is

evalmark is a GitHub Action, a static dashboard, and an npm package with the CLI and the result
format's types. The action records each eval run of a project on a branch of that project's
repository, and the dashboard, served from that branch, lets you explore the history: runs, trends,
cases, transcripts, models compared.

## Commands

```sh
pnpm install          # install dependencies and the git hooks (husky)
pnpm run verify       # the whole gate: lint, docs:check, arch, knip, typecheck, test, check:dist
pnpm run lint         # Biome check (format + lint)
pnpm run lint:fix     # Biome check --write
pnpm run docs:check   # remark: Markdown formatting and links
pnpm run docs:format  # remark: format the Markdown
pnpm run arch         # dependency-cruiser boundary rules
pnpm run knip         # unused files, exports and dependencies
pnpm run typecheck    # tsc
pnpm run test         # unit and end-to-end tests (Vitest, on Node)
pnpm run build        # tsdown: the action, the CLI, the library; Vite: the dashboard; into dist/
pnpm run check:dist   # build, and fail when dist/ differs from what is committed
pnpm run schema       # write schema/result.v<version>.json from the result format
pnpm run site:dev     # the dashboard on a fixture, with Vite's dev server on :4401
pnpm run demo         # a synthetic history in .demo/, served on :4400
pnpm run evalmark …   # the CLI from its sources: record, import, preview, demo
```

## Non-negotiables

- The action writes only to the configured branch and folder of the repository it runs in. Never
  to another repository, never outside the folder.
- The action never fails the job unless `fail-on-error` is set.
- No secret in a URL, a file or a log. Git gets the token through `http.extraheader`.
- The dashboard is static: no server, no CDN, no inline script, no `eval`, no
  `dangerouslySetInnerHTML`. It renders stored text as text.
- Everything runs on Node 24: `node:` modules, never `Bun`. Scripts and the CLI run from
  their sources with `node`, which strips types: erasable syntax only (`erasableSyntaxOnly`).
- `src/site/` imports only types from the zod schemas, so the bundle ships without zod.
- `dist/` is committed and always matches the sources. Run `pnpm run build` before committing a
  change to `src/`.
- The package installs nothing: every dependency is a dev dependency, bundled into `dist/`.
- `src/index.ts` is the package's public API: the result format's types, from
  `src/format/result-types.ts`, which a test keeps equal to the zod schema.
- TypeScript stays on 6.0.x. No path aliases: relative imports with the `.ts` extension.
- Library versions are newer than most training data: Preact 11, Zod 4, Vite 8, Vitest 5, tsdown
  0.23. Read the installed type definitions before using their APIs.

## Style

- Biome owns formatting and lint: single quotes, semicolons, 2-space indent, 100 columns.
- Cognitive complexity at most 8, functions at most 25 lines, files at most 400 lines. Split the
  code; never raise the limits or disable a rule to pass.
- Guard clauses first, flat happy path. Names carry meaning: no abbreviations such as `err`,
  `res`, `ctx`, `opts`, `msg`.
- TSDoc on every declaration, exported or not, with `@param` and `@returns`. Describe the contract,
  not the implementation. `//` comments are for code inside bodies, two lines at most.
- Prefer the platform (Node and browser APIs, `fetch`, `DecompressionStream`) over a package. Each
  new dependency gets one line of justification in the commit message.

## Writing

Documentation, comments, commit messages and user-facing strings use direct language.

- Write plain declarative sentences. State the fact, then at most one sentence of why.
- No em-dashes. Use commas, colons, parentheses, periods.
- One fact per bullet. Paragraphs of one to three short sentences.
- When the code changes a documented behaviour, update the README, `CONTRIBUTING.md` or `docs/` in
  the same commit.

## Commits

- Conventional Commits (`type(scope): description`), enforced by commitlint. The type sets the
  release: `fix` a patch, `feat` a minor version, a `BREAKING CHANGE:` footer a major one
  (semantic-release, run by the Release workflow once Quality passes on `main`). A `!` after the
  type is not read: write the footer.
- Small commits, each passing `pnpm run verify`.
- Husky runs Biome on staged files before a commit, commitlint on the message, and
  `pnpm run verify` before a push. Do not skip hooks.

## What not to do

- Do not fan out parallel agents over one working tree. Each agent gets its own git worktree.
- Do not add a server, a hosted service, or a dependency on the Actions toolkit.
- Do not weaken a lint, knip or dependency-cruiser rule to get a check green.
