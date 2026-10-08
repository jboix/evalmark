# The result format

Your eval harness writes one JSON file per run and hands it to the action in the `result` input.
It is the only thing a project has to produce.

- [`src/format/result.ts`](../src/format/result.ts) defines it with zod. The action validates every
  file against it.
- [`schema/result.v1.json`](../schema/result.v1.json) is its JSON Schema, with a description for
  every field. It is published at `https://jboix.github.io/evalmark/schema/result.v1.json`: name it in
  your file's `$schema` and your editor completes and checks it.
- The format has a version. A change that breaks existing files makes a new version, with its own
  schema file, and a new major version of the action; adding an optional field does not.
- Every field but `version` and `cases` is optional. A first version can be a few lines, and each
  field you add makes the dashboard richer.
- Unknown fields are accepted and dropped, so a harness can write more than evalmark reads.

## A minimal result

One case, one trial, a status:

```json
{
  "version": 1,
  "cases": [{ "id": "orders-per-day", "trials": [{ "status": "pass" }] }]
}
```

The action fills in the rest: the suite's name from the repository, the start time from the time it
records the run.

## A rich result

Labels, checks, usage, an output, a screenshot and a transcript with tool calls:

```json
{
  "version": 1,
  "suite": "dashboard-agent",
  "startedAt": "2026-10-08T10:00:00Z",
  "durationMs": 212000,
  "labels": { "model": "gemini-3.8-flash", "provider": "google" },
  "cases": [
    {
      "id": "orders-per-day",
      "title": "Orders per day",
      "description": "A bar per day of the current month.",
      "input": "How many orders did we get each day this month?",
      "tags": ["postgres", "bar"],
      "checks": [
        { "id": "built", "description": "A dashboard was built" },
        { "id": "daily-buckets", "description": "The query groups by day" }
      ],
      "trials": [
        {
          "status": "fail",
          "score": 0.5,
          "durationMs": 33000,
          "usage": { "inputTokens": 9900, "outputTokens": 700, "costUsd": 0.0033 },
          "checks": [
            { "id": "built", "pass": true },
            {
              "id": "daily-buckets",
              "pass": false,
              "message": "The query groups by created_at, not by day."
            }
          ],
          "output": "Built a bar chart of orders, one bar per order time.",
          "attachments": [
            {
              "path": "screenshots/orders-per-day-0.webp",
              "mediaType": "image/webp",
              "caption": "The dashboard at the end"
            }
          ],
          "transcript": [
            { "role": "user", "content": "How many orders did we get each day this month?" },
            {
              "role": "assistant",
              "toolCalls": [
                {
                  "id": "call-1",
                  "name": "run_query",
                  "input": { "source": "pg", "sql": "select created_at, count(*) from order" },
                  "error": "relation \"order\" does not exist"
                }
              ]
            },
            {
              "role": "assistant",
              "content": "The table is called orders. I will fix the query.",
              "toolCalls": [
                {
                  "id": "call-2",
                  "name": "run_query",
                  "input": { "source": "pg", "sql": "select created_at, count(*) from orders" },
                  "output": { "rows": 1843 },
                  "durationMs": 120
                }
              ]
            },
            { "role": "assistant", "content": "The dashboard shows the orders of this month." }
          ]
        },
        {
          "status": "pass",
          "score": 1,
          "durationMs": 29000,
          "usage": { "inputTokens": 9100, "outputTokens": 640, "costUsd": 0.003 },
          "checks": [
            { "id": "built", "pass": true },
            { "id": "daily-buckets", "pass": true }
          ]
        }
      ]
    }
  ]
}
```

[`test/fixtures/result.json`](../test/fixtures/result.json) is a complete example with every
status.

## Fields

### The result

| Field        | Type               | Required | What it is                                                                                       |
| ------------ | ------------------ | -------- | ------------------------------------------------------------------------------------------------ |
| `version`    | `1`                | yes      | The format's version.                                                                            |
| `suite`      | string             | no       | The suite's name. The action's `suite` input overrides it; the repository's name is the default. |
| `startedAt`  | ISO 8601 time      | no       | When the run started, with `Z` or an offset. Defaults to the time the action records it.         |
| `durationMs` | number, at least 0 | no       | The run's wall-clock duration. Defaults to the sum of its trials' durations.                     |
| `labels`     | object of strings  | no       | What the run is grouped and compared by, such as `{ "model": "…" }`.                             |
| `cases`      | array of cases, 1+ | yes      | The cases that ran.                                                                              |

### A case

| Field         | Type                       | Required | What it is                                                       |
| ------------- | -------------------------- | -------- | ---------------------------------------------------------------- |
| `id`          | string, 1 to 200 chars     | yes      | A stable id. The dashboard follows a case across runs by its id. |
| `title`       | string                     | no       | A short name for lists and pages.                                |
| `description` | string                     | no       | What the case is about, in a sentence or two.                    |
| `input`       | string                     | no       | What the case asks: the prompt or the question.                  |
| `tags`        | array of strings           | no       | Tags to filter cases by, such as the data source or the feature. |
| `checks`      | array of check definitions | no       | The checks the case makes on every trial.                        |
| `trials`      | array of trials, 1+        | yes      | Its attempts.                                                    |

### A check definition

| Field         | Type   | Required | What it is                                     |
| ------------- | ------ | -------- | ---------------------------------------------- |
| `id`          | string | yes      | The check's id, which trials refer to.         |
| `description` | string | no       | What it checks, in words a reader understands. |

### A trial

| Field         | Type                            | Required | What it is                                         |
| ------------- | ------------------------------- | -------- | -------------------------------------------------- |
| `status`      | `pass`, `fail`, `error`, `skip` | yes      | How the trial ended.                               |
| `score`       | number from 0 to 1              | no       | A graded result, next to the status.               |
| `durationMs`  | number, at least 0              | no       | How long the trial took.                           |
| `usage`       | usage                           | no       | What the trial spent.                              |
| `checks`      | array of check results          | no       | What each check found.                             |
| `error`       | string                          | no       | What went wrong, for an `error` trial.             |
| `output`      | string                          | no       | The trial's final answer or artefact, as text.     |
| `attachments` | array of attachments            | no       | Images of the trial, such as the final screenshot. |
| `transcript`  | array of messages               | no       | The conversation, with its tool calls.             |

### A check result

| Field     | Type    | Required | What it is                               |
| --------- | ------- | -------- | ---------------------------------------- |
| `id`      | string  | yes      | The check's id, as the case declares it. |
| `pass`    | boolean | yes      | Whether the trial passed the check.      |
| `message` | string  | no       | Why it failed, or what it found.         |

### Usage

| Field          | Type                | Required | What it is              |
| -------------- | ------------------- | -------- | ----------------------- |
| `inputTokens`  | integer, at least 0 | no       | Tokens sent to a model. |
| `outputTokens` | integer, at least 0 | no       | Tokens a model wrote.   |
| `costUsd`      | number, at least 0  | no       | Cost in US dollars.     |

### A message

| Field         | Type                                  | Required | What it is                  |
| ------------- | ------------------------------------- | -------- | --------------------------- |
| `role`        | `system`, `user`, `assistant`, `tool` | yes      | Who wrote it.               |
| `content`     | string                                | no       | Its text.                   |
| `toolCalls`   | array of tool calls                   | no       | The tools it called.        |
| `at`          | ISO 8601 time                         | no       | When it was written.        |
| `usage`       | usage                                 | no       | What this message spent.    |
| `attachments` | array of attachments                  | no       | Images the message carries. |

### A tool call

| Field         | Type                 | Required | What it is                                               |
| ------------- | -------------------- | -------- | -------------------------------------------------------- |
| `id`          | string               | no       | The call's id, as the model gave it.                     |
| `name`        | string               | yes      | The tool's name.                                         |
| `input`       | any JSON value       | no       | What the model sent.                                     |
| `output`      | any JSON value       | no       | What the tool returned.                                  |
| `error`       | string               | no       | The error the tool returned instead.                     |
| `durationMs`  | number, at least 0   | no       | How long the call took.                                  |
| `attachments` | array of attachments | no       | Images of what the call did, such as the panel it wrote. |

### An attachment

| Field       | Type                                                 | Required | What it is                                      |
| ----------- | ---------------------------------------------------- | -------- | ----------------------------------------------- |
| `path`      | string                                               | yes      | The file, relative to the result file's folder. |
| `mediaType` | `image/png`, `image/jpeg`, `image/webp`, `image/gif` | yes      | The file's type.                                |
| `caption`   | string                                               | no       | What it shows.                                  |

## Statuses, scores and checks

A trial's `status` is the verdict. The totals, the pass rate and the comparisons count statuses.

- `pass`: the trial did what the case asks.
- `fail`: the trial ran to the end and got it wrong. A failing check usually says why.
- `error`: the trial could not finish, such as a timeout or a provider error. Put the reason in
  `error`.
- `skip`: the trial did not run, such as a case that needs a source the environment lacks. Skipped
  trials are left out of the pass rate.

The pass rate is passed trials over trials that ran and were not skipped. A case passes when every
trial that ran passed, fails when none did, and is flaky when some did.

`score` is for graded evals, such as a judge's mark or the share of checks passed. It is stored with the trial and does not change its status: your harness decides what score passes.

Checks name what a case verifies, so a failure says what broke and not just that something did.

- Declare each check once on the case, with an `id` and a `description`.
- Give each trial one result per check, with the same `id`.
- Put the reason in `message` when a check fails.

## Transcripts and tool calls

A transcript is the trial's conversation, in order. The dashboard shows it as a conversation, with
each tool call's input, output and error.

- Put a tool's result in the `output` of the call that made it. A `tool` message is for a harness
  that logs results as separate messages.
- Write `input` and `output` as JSON values, not JSON strings, so they are shown structured.
- Set `error` on a call that failed, so the failure and the turn that repairs it are both visible.
- `usage` and `at` on a message show where the tokens and the time went.

Transcripts are the largest part of a result. The action stores each one gzipped in its own file,
and its retention inputs decide which to keep (`transcripts`) and for how many runs
(`keep-transcripts`). By default only trials that did not pass keep theirs, for the newest 30 runs.

## Attachments

An attachment is an image the harness saved next to the result file, such as a screenshot of what
the agent built. A trial, a message and a tool call can each have some. The dashboard shows them
with the trial and in the conversation.

- `path` is relative to the result file's folder, and must stay inside it. The action refuses a
  path that is absolute, climbs out with `..`, or goes through a symbolic link that leads out.
- A file that is missing is a warning: the run is recorded, and the attachment is marked missing.
- The action stores each distinct file once, named by its content, so an image repeated across
  trials and runs costs nothing more.
- The action does not resize or convert images. Write WebP at a sensible width, such as 1280
  pixels, so a screenshot is tens of kilobytes rather than megabytes.
- Images are stored as they are. The action redacts text, not pixels, so keep secrets off screen.

The action's retention inputs decide which trials keep their files (`attachments`, by default
those that did not pass) and for how many runs (`keep-attachments`, by default the newest 10).
An attachment whose file is not kept still records its type, caption and size.

## Labels and comparing models

A run has one set of labels, such as `{ "model": "gemini-3.8-flash", "provider": "google" }`. The
dashboard filters runs by label, draws one trend line per label value, and compares label values
case by case, with cost against pass rate.

To compare models, run the suite once per model and write one result per model. The action records
each as its own run. The `labels` input adds labels from the workflow, such as a model chosen in a
matrix, over the result's own.

On a pull request, the comment compares a run with the base branch's latest run, preferring one with the same labels.

## Versioning

`version` is the format's version, and `1` is the only one. A change that would make an existing file invalid, or change its meaning, gets a new version. Adding an optional field does not.

## Writing it from your harness

Write the file anywhere in the workspace, then pass its path in `result`.

TypeScript, with the types from the `evalmark` package (`npm i -D evalmark`):

```ts
import { writeFile } from 'node:fs/promises';
import type { Case, Result, Trial } from 'evalmark';

const cases = await Promise.all(
  suite.map(async (evalCase): Promise<Case> => ({
    id: evalCase.id,
    title: evalCase.title,
    input: evalCase.prompt,
    trials: await Promise.all(
      [1, 2, 3].map(async (): Promise<Trial> => {
        const run = await runAgent(evalCase.prompt);
        return {
          status: run.ok ? 'pass' : 'fail',
          durationMs: run.durationMs,
          usage: { inputTokens: run.inputTokens, outputTokens: run.outputTokens },
          transcript: run.messages,
        };
      }),
    ),
  })),
);
const result: Result = { version: 1, labels: { model }, cases };
await writeFile('eval-result.json', JSON.stringify(result));
```

Python:

```python
import json

cases = []
for case in suite:
    trials = []
    for _ in range(3):
        run = run_agent(case["prompt"])
        trials.append({
            "status": "pass" if run.ok else "fail",
            "durationMs": run.duration_ms,
            "checks": [
                {"id": check.id, "pass": check.ok, "message": check.reason}
                for check in run.checks
            ],
            "transcript": run.messages,
        })
    cases.append({"id": case["id"], "input": case["prompt"], "trials": trials})

with open("eval-result.json", "w") as file:
    json.dump({"version": 1, "labels": {"model": model}, "cases": cases}, file)
```

To check a file before a run, validate it against [`schema/result.v1.json`](../schema/result.v1.json)
with any JSON Schema validator.
