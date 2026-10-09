<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/evalmark-logo-dark.svg">
  <img alt="evalmark" src="docs/brand/evalmark-logo.svg" height="44">
</picture>

[![Quality](https://github.com/jboix/evalmark/actions/workflows/quality.yml/badge.svg)](https://github.com/jboix/evalmark/actions/workflows/quality.yml)
[![Release](https://github.com/jboix/evalmark/actions/workflows/release.yml/badge.svg)](https://github.com/jboix/evalmark/actions/workflows/release.yml)
[![version](https://img.shields.io/github/v/release/jboix/evalmark?label=version)](https://github.com/jboix/evalmark/releases/latest)
[![demo](https://img.shields.io/badge/demo-live-0f6b63)](https://jboix.github.io/evalmark/)
[![result format](https://img.shields.io/badge/result_format-v1-0f6b63)](schema/result.v1.json)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

evalmark keeps the history of your eval runs in your own repository and lets you explore it on a
static site.

- A GitHub Action records each run on a branch of your repository.
- A static dashboard, written next to the data on that branch, shows runs, trends, cases,
  transcripts and models compared.
- There is no server, no database and no third party. Your data stays in your repository.
- On a pull request, a comment compares the run with the base branch.

**See it:** [the demo](https://jboix.github.io/evalmark/) is the dashboard on a synthetic history of
an agent that builds dashboards, three models compared over six weeks.

Your harness writes one JSON file per run. [The result format](docs/result-format.md) describes it,
and [its JSON Schema](schema/result.v1.json) lets your editor check it.

## Quick start

Add one step after your evals, with the result file your harness wrote:

```yaml
- uses: jboix/evalmark@v1
  if: ${{ !cancelled() }}
  with:
    result: eval-result.json
```

`if: ${{ !cancelled() }}` records the run even when the eval step fails.

The first run creates the branch, the folder and the dashboard. There is no configuration file.

## A full example

A workflow you can copy into `.github/workflows/evals.yml`. It runs the evals for two models on
every push to `main` and every pull request, records each model as its own run, and comments on the
pull request with the comparison against `main`.

```yaml
name: Evals

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  evals:
    name: Evals (${{ matrix.model }})
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write # evalmark pushes the run to its branch
      pull-requests: write # evalmark comments on the pull request
    strategy:
      fail-fast: false # one model failing still records the others
      matrix:
        model: [gemini-3.8-flash, claude-sonnet-5]
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false # evalmark pushes with its own token input

      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - run: npm ci

      # Your harness: it writes evals/out/result.json, and any screenshots next to it.
      - name: Run the evals
        run: npm run evals -- --model "$MODEL" --out evals/out/result.json
        env:
          MODEL: ${{ matrix.model }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Record the run
        uses: jboix/evalmark@v1
        if: ${{ !cancelled() }} # record failing evals too
        with:
          result: evals/out/result.json
          labels: |
            model=${{ matrix.model }}
          site-url: https://acme.github.io/agent/evalmark/
          title: Acme agent
          logo: docs/logo.svg
          redact: |
            ${{ secrets.GEMINI_API_KEY }}
            ${{ secrets.ANTHROPIC_API_KEY }}
```

- The matrix jobs push at the same time: each run is its own file, and a push that loses the race
  is redone on the new tip.
- `labels` names the model, so the dashboard and the comment compare each model with itself.
- `site-url` puts links to the run and the comparison in the comment and the job summary.
- `redact` removes those values from anything stored, should a transcript echo them.
- To publish the dashboard, set GitHub Pages to deploy from the `evalmark` branch, root folder.

With promptfoo, the step that runs the evals writes promptfoo's own output, and evalmark reads it as
it is, one run per provider:

```yaml
- run: npx promptfoo@latest eval -o results.json
- uses: jboix/evalmark@v1
  if: ${{ !cancelled() }}
  with:
    result: results.json
```

## Where the data and the site live

The action writes only inside the `folder` of the `branch` you choose. Every other file on that
branch stays as it is.

### A dedicated branch (the default)

```yaml
with:
  result: eval-result.json
  branch: evalmark # the default
  folder: evalmark # the default
```

The runs and the dashboard live in the `evalmark/` folder of the `evalmark` branch. To publish it, set
GitHub Pages to deploy from the `evalmark` branch, root folder. The dashboard is then at
`https://<owner>.github.io/<repository>/evalmark/`.

### A site served from a branch

When GitHub Pages already serves a branch, such as `gh-pages`, give the action a folder on it:

```yaml
with:
  result: eval-result.json
  branch: gh-pages
  folder: evals
```

The dashboard is at `https://<owner>.github.io/<repository>/evals/`. The rest of the site is left
untouched.

### A site deployed from Actions

When an Actions workflow builds and deploys your site, keep the data on a ref that is not a branch.
A normal clone does not fetch it, so it does not grow your contributors' clones.

Record to that ref:

```yaml
with:
  result: eval-result.json
  branch: refs/evalmark/data
```

In the deploy workflow, copy the dashboard and the data into the site before uploading it:

```yaml
- uses: jboix/evalmark@v1
  with:
    mode: export
    branch: refs/evalmark/data
    path: _site/evals
- uses: actions/upload-pages-artifact@v4
  with:
    path: _site
```

The dashboard is at `https://<owner>.github.io/<repository>/evals/`. The site shows the data as of
its last deploy, so run the deploy after the evals, for example with `on: workflow_run`.

## Inputs

| Input              | Default               | Description                                                                                                                                                                                       |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `result`           |                       | The result file your eval harness wrote (see [the result format](docs/result-format.md)). Required to record.                                                                                     |
| `format`           | `auto`                | The result file's format: `auto` detects it; `evalmark`, `promptfoo`, `inspect` (Inspect AI) or `junit` (JUnit XML). A file with several models records one run per model.                        |
| `mode`             | `record`              | `record` stores the run and publishes the site; `export` copies the stored site and data into `path`, for a site deployed from Actions.                                                           |
| `branch`           | `evalmark`            | The branch the data and the site live on, or a full ref such as `refs/evalmark/data`, which a normal clone does not fetch.                                                                        |
| `folder`           | `evalmark`            | The folder on that branch the action owns. It never writes outside it.                                                                                                                            |
| `suite`            |                       | The suite's name. Defaults to the result's `suite`, then to the repository's name.                                                                                                                |
| `labels`           |                       | Extra labels, one `key=value` per line, added over the result's own, such as the model a workflow input chose.                                                                                    |
| `token`            | `${{ github.token }}` | The token used to push and to comment.                                                                                                                                                            |
| `keep-runs`        | `500`                 | How many runs to keep. Older runs are pruned. `0` keeps every run.                                                                                                                                |
| `keep-days`        | `0`                   | How many days of runs to keep. `0` keeps every day.                                                                                                                                               |
| `transcripts`      | `failed`              | Which transcripts to keep: `failed` (trials that did not pass), `all`, or `none`.                                                                                                                 |
| `keep-transcripts` | `30`                  | How many of the newest runs keep their transcripts. `0` keeps them on every run.                                                                                                                  |
| `attachments`      | `failed`              | Which trials keep their attachment files, such as screenshots: `failed` (trials that did not pass), `all`, or `none`. A trial that does not keep them still records their type, caption and size. |
| `keep-attachments` | `10`                  | How many of the newest runs keep their attachment files. `0` keeps them on every run.                                                                                                             |
| `warn-size-mb`     | `100`                 | Warn when the folder grows above this many megabytes. `0` never warns.                                                                                                                            |
| `history`          | `auto`                | `auto` squashes the branch's history when pruning, unless the branch holds files outside the folder; `squash` always does; `keep` never does.                                                     |
| `comment`          | `true`                | Comment on the pull request with the comparison against its base branch.                                                                                                                          |
| `badges`           | `true`                | Write SVG badges for the default branch's latest run into the folder.                                                                                                                             |
| `title`            | `evalmark`            | The dashboard's title, in its header and the browser tab.                                                                                                                                         |
| `subtitle`         | `eval dashboard`      | The line under the dashboard's title.                                                                                                                                                             |
| `logo`             |                       | An image in your repository shown beside the title (SVG, PNG, WebP, JPEG or GIF), such as `docs/logo.svg`. Without it, the dashboard shows evalmark's mark.                                       |
| `site-url`         |                       | The address the site is served at, for the links in the comment and the summary.                                                                                                                  |
| `redact`           |                       | Extra strings to remove from everything stored, one per line, such as a secret the harness may echo.                                                                                              |
| `path`             |                       | Where `export` mode copies the site and the data.                                                                                                                                                 |
| `fail-on-error`    | `false`               | Fail the step when recording fails. By default a failure is a warning and the job goes on.                                                                                                        |

## Outputs

When a file holds several runs (one per model), each run gets its own comment and summary, and
the outputs describe the last one.

| Output          | Description                                          |
| --------------- | ---------------------------------------------------- |
| `run-id`        | The recorded run's id.                               |
| `pass-rate`     | The run's pass rate, from 0 to 1.                    |
| `recorded`      | Whether the run was pushed.                          |
| `run-url`       | The run's page on the site, when `site-url` is set.  |
| `evalmark-size` | The folder's size on disk after recording, in bytes. |

## Permissions

- `contents: write` lets the action push to its branch.
- `pull-requests: write` lets it comment on a pull request. Without it, set `comment: false`.
- `export` mode needs only `contents: read`.
- On a pull request from a fork, the token is read-only. The action records nothing there, and the
  job goes on.
- The action's commits say `[skip ci]`, and pushes made with the workflow's token start no workflow.
- By default the action never fails the job: a failure to record is a warning. Set
  `fail-on-error: true` to change that.

## Retention and repository size

Every recorded run is a commit on the branch, and git keeps every version of every file it has
seen. The retention inputs keep the branch small.

- `keep-runs` and `keep-days` prune old runs.
- Transcripts are the largest part of a run. By default the action keeps them only for trials that
  did not pass (`transcripts: failed`), and only on the newest 30 runs (`keep-transcripts: 30`).
- A run whose transcripts are pruned keeps its statuses, checks, scores and usage.
- Attachments, such as screenshots, are stored once per distinct content in `data/attachments/`.
- By default only trials that did not pass keep their attachment files (`attachments: failed`),
  and only on the newest 10 runs (`keep-attachments: 10`).
- A pruned attachment keeps its type, caption and size, so the dashboard says it was not kept.
- The action does not resize images. Write them small, such as WebP at 1280 pixels wide.

### History

Deleting a file does not shrink a repository while an old commit still holds it. So when it prunes,
the action squashes the branch's history into one commit, and pruning frees the space.

- `history: auto`, the default, squashes only when the branch holds nothing outside the folder.
- On a dedicated branch, the default, every pruning frees space.
- On a shared branch such as `gh-pages`, the history is kept, so every attachment ever pushed stays
  in the repository. Set `attachments: none` there.
- `squash` always squashes; `keep` never does.

### Size

After each run, the action measures the folder. The job summary ends with its size, the warning
threshold, what the run added and what retention pruned, and the `evalmark-size` output gives the size
in bytes.

Above `warn-size-mb` (100 MB by default), the run also warns. To make the folder smaller, lower
`keep-runs`, `keep-transcripts` or `keep-attachments`, or set `attachments: none`.

## Privacy

- The dashboard, with its data and transcripts, is published wherever the branch is served.
- GitHub Pages of a private repository is public, unless your plan supports private Pages.
- Everyone who can read the repository can read the branch.
- Every clone fetches every branch. A ref outside `refs/heads/`, such as `refs/evalmark/data`, is not
  fetched by a normal clone.
- Transcripts hold what the model saw and wrote, data from your sources included.
- Attachments, such as screenshots, are stored as they are. Redaction applies to text, not images.
- The action redacts values that look like secrets before it stores anything. The `redact` input
  adds strings of your own.

## Your own title and logo

The dashboard shows evalmark's name and mark by default. Give it yours with three inputs:

```yaml
- uses: jboix/evalmark@v1
  with:
    result: evals/result.json
    title: Acme agent
    subtitle: eval dashboard
    logo: docs/logo.svg
```

- `title` names the dashboard in its header and the browser tab.
- `subtitle` is the line under the title.
- `logo` is an image in your repository (SVG, PNG, WebP, JPEG or GIF), shown at 28 pixels high.
- Each run writes them again, so a change takes effect on the next run, and removing `logo` brings
  back evalmark's mark.

The footer links to evalmark's repository.

## Badges

With `badges: true`, the action writes `badges/pass-rate.svg` and `badges/cost.svg` into the folder,
for the default branch's latest run. Link them from the served site:

```markdown
![Eval pass rate](https://<owner>.github.io/<repository>/evalmark/badges/pass-rate.svg)
```

## Comparing models

A run has one set of labels, such as `model`. To compare models, run the suite once per model; the
action records each result as its own run. The dashboard draws one trend line per model and compares
them case by case, with cost against pass rate.

```yaml
strategy:
  matrix:
    model: [gemini-3.8-flash, claude-sonnet-5]
steps:
  - uses: actions/checkout@v7
  - run: npm run evals -- --model ${{ matrix.model }}
  - uses: jboix/evalmark@v1
    if: ${{ !cancelled() }}
    with:
      result: eval-result.json
      labels: |
        model=${{ matrix.model }}
```

Runs recorded at the same time never conflict: each run is its own file, and a push that loses a
race is redone on the new tip.

## Types for your harness

The `evalmark` package on npm has the result format's TypeScript types:

```sh
npm i -D evalmark
```

```ts
import type { Result } from 'evalmark';

const result: Result = { version: 1, labels: { model }, cases };
```

The JSON Schema checks a file in your editor. Name it in the file:

```json
{ "$schema": "https://jboix.github.io/evalmark/schema/result.v1.json", "version": 1, "cases": [] }
```

## The CLI

The same package has the `evalmark` command. It runs on Node 24 and installs nothing else:

```sh
npx evalmark preview   # serve the dashboard of the evalmark branch of this clone
npx evalmark import --from results.json --out converted   # another tool's output to result files
npx evalmark record --result eval-result.json --dir .evalmark   # record a run into a local folder
npx evalmark demo      # a synthetic history, served on http://127.0.0.1:4400
```

`npx evalmark --help` lists every option.

## Importing from other tools

evalmark reads promptfoo results, Inspect AI logs (`.json` and `.eval`) and JUnit XML as they are.
`evalmark import` converts one into result files, one per model:

```sh
npx evalmark import --from results.json --out converted
```

[Importing](docs/importing.md) describes what each format maps to and what is lost.

## Previewing locally

`evalmark preview` serves the dashboard from a branch of the clone, with nothing published:

```sh
npx evalmark preview                                  # the evalmark branch and folder
npx evalmark preview --branch gh-pages --folder evals # another branch and folder
```

`npx evalmark demo` serves a synthetic history, to see the dashboard without recording a run. Both
commands listen on this machine only; `--host` alone serves every interface, such as for a
virtual machine's host, and `--host <address>` one address.

## Removing it

- Remove the step from your workflow.
- Delete the folder, or the branch: `git push origin --delete evalmark`.
- For a full ref: `git push origin --delete refs/evalmark/data`.
- Turn off GitHub Pages for that branch, if it served nothing else.

## Versions

Each release is a tag, cut by semantic-release from the commit messages once the checks pass on
`main`: `fix` makes a patch, `feat` a minor version, a breaking change a major one.

- `jboix/evalmark@v1` follows every 1.x release: fixes and features, never a breaking change.
- `jboix/evalmark@v1.2.3` stays on one release.
- `jboix/evalmark@<commit SHA>` is the safest: a tag can move, a commit cannot. Dependabot keeps such
  a pin up to date.
- The npm package `evalmark` has the same version as the action's release.

The [releases](https://github.com/jboix/evalmark/releases) list what changed in each.

## Contributing

[The contributing guide](docs/CONTRIBUTING.md) has the setup, the layout and how releases work.
Security problems go through [the security policy](docs/SECURITY.md), and everyone follows the
[Code of Conduct](docs/CODE_OF_CONDUCT.md).

## License

MIT.
