# Importing other tools' output

evalmark reads the output of other eval tools as it is, so a team that already runs promptfoo,
Inspect AI or a JUnit-reporting test runner gets the dashboard without writing a result file.

- `evalmark import` converts a file to result files you can read before recording them.
- `src/import/` does the conversion. Its `importResults(path, format)` returns one validated
  result per model or provider in the file.
- Every converted result is validated against [the result format](result-format.md).

## The command

```sh
npx evalmark import --from results.json --out converted
npx evalmark import --from logs/2026-10-08T10-00-00_weather.eval --out converted
npx evalmark import --from junit.xml --format junit --out converted
```

- `--from` is the file to convert.
- `--out` is the folder to write to. It is created when it does not exist.
- `--format` is `auto` (the default), `promptfoo`, `inspect`, `junit` or `evalmark`.
- Each result is written as `<n>-<model>.json`, such as `1-gpt-5-mini.json`. A file without a model
  gives `1-result.json`.

Then record one with `evalmark record --result converted/1-gpt-5-mini.json --dir <dir>`.

The action needs no conversion: give it the tool's own file in its `result` input. Its `format`
input (`auto` by default) detects the format, and a file with several models records one run per
model, each with its own pull request comment.

## Detecting the format

`auto` reads the content, with the extension as a hint.

| Content                                                     | Format      |
| ----------------------------------------------------------- | ----------- |
| A zip archive                                               | `inspect`   |
| XML with a `testsuites` or `testsuite` element, or a `.xml` | `junit`     |
| JSON with `"version": 1` and `cases`                        | `evalmark`  |
| JSON with `eval.task` and `eval.model`                      | `inspect`   |
| JSON with `results.results`, or `results` and `stats`       | `promptfoo` |

Anything else is an error that asks for `--format`.

## Splitting by model

A result has one set of labels, so a file with several models becomes several results, each with
`labels.model` and, when it is known, `labels.provider`. Record each as its own run, and the
dashboard compares them.

## promptfoo

The file `promptfoo eval -o results.json` writes (format version 3, and the older ones with the
same rows). The evaluation summary alone, with `results` and `stats` at the top, reads too.

| promptfoo                                            | Result                                     |
| ---------------------------------------------------- | ------------------------------------------ |
| `config.description`                                 | `suite`                                    |
| `results.timestamp`                                  | `startedAt`                                |
| `results.stats.durationMs`                           | `durationMs`                               |
| `provider.label`, else the model in `provider.id`    | `labels.model`                             |
| The part of `provider.id` before the first colon     | `labels.provider`                          |
| `prompt.label`, when the file has several prompts    | `labels.prompt`, and one result per prompt |
| A test: its description and variables                | A case                                     |
| A test's repeats (`--repeat`)                        | Its trials                                 |
| `testCase.description`                               | The case's `id` and `title`                |
| `prompt.raw`, the rendered prompt                    | The case's `input`                         |
| `testCase.metadata.pluginId` and `strategyId`        | The case's `tags`                          |
| `success`, `failureReason`                           | `status`                                   |
| `score`                                              | `score`, when it is from 0 to 1            |
| `latencyMs`                                          | `durationMs`                               |
| `tokenUsage.prompt`, `tokenUsage.completion`, `cost` | `usage`                                    |
| `gradingResult.componentResults`, one per assertion  | `checks`, with `reason` as the message     |
| `response.output`                                    | `output`, as JSON text when it is not text |
| `error`, `response.error`                            | `error`                                    |

- `provider.id` such as `openai:chat:gpt-5-mini` gives the model `gpt-5-mini` and the provider
  `openai`. An API kind (`chat`, `completion`, `messages`, `responses`, `embedding`) is dropped.
- A URL or path provider, such as `http://localhost:3110/chat`, is the model as a whole.
- A test without a description gets the id `vars-<hash>`: the first 12 hex digits of the SHA-256 of
  its variables, keys sorted, so the id is stable across runs.
- Two tests with one description and different variables get `<description> (<hash>)`.
- A red team test's plugin and strategy are part of its identity, so each strategy is its own case.
- A check's id is the assertion's `metric`, else its `type`, with `-2`, `-3` for repeats in a test.
- `success` gives `pass`. `failureReason` 2 (an error), or a failure with an error and no grading,
  gives `error`. Any other failure gives `fail`.

Lost: the prompt template, named scores, the grader's own token usage, traces, and the
conversation, as promptfoo keeps no transcript.

## Inspect AI

An eval log in the JSON format, or in the default `.eval` format: a zip archive with `header.json`
(or `_journal/start.json` for a log cut short) and one `samples/<id>_epoch_<n>.json` per sample and
epoch. Entries stored, deflated or compressed with Zstandard all read, as does ZIP64. A log holds
one model, so it gives one result.

| Inspect AI                                        | Result                                       |
| ------------------------------------------------- | -------------------------------------------- |
| `eval.task`                                       | `suite`                                      |
| `stats.started_at`, else `eval.created`           | `startedAt`                                  |
| `stats.completed_at` minus `stats.started_at`     | `durationMs`                                 |
| `eval.model`, such as `anthropic/claude-sonnet-5` | `labels.provider` and `labels.model`         |
| A sample                                          | A case, with the sample's `id` as its id     |
| Its epochs                                        | Its trials, in epoch order                   |
| `input`                                           | `input`, the text of its messages for a list |
| `target`                                          | `description`, as `Target: …`                |
| `scores`, one per scorer                          | `checks`                                     |
| `output.completion`                               | `output`                                     |
| `messages`                                        | `transcript`                                 |
| `model_usage`, summed over its models             | `usage`                                      |
| `total_time`                                      | `durationMs`                                 |
| `error.message`                                   | `error`, and the status `error`              |

### Scores, checks and statuses

Each scorer is a check named after it. A scorer whose value is a dictionary gives one check per
key, named `<scorer>/<key>`.

A value maps to a number as Inspect's `value_to_float` does:

| Value                             | Number   |
| --------------------------------- | -------- |
| `C` (correct)                     | 1        |
| `P` (partial)                     | 0.5      |
| `I` (incorrect), `N` (no answer)  | 0        |
| `true`, `yes`; `false`, `no`      | 1; 0     |
| A number, or a string of a number | Itself   |
| A list                            | The mean |
| Any other text                    | None     |

- A check passes when its number is at least 1. A partial answer fails its check.
- The check's message is the score's `explanation`, else `Answer: <answer>`.
- The trial's `score` is the mean of its checks' numbers that are from 0 to 1.
- The status is `error` when the sample has an error, `skip` when it has no score, `pass` when every
  check passes, and `fail` otherwise.

### The transcript

- System, user and assistant messages keep their text parts. Reasoning, images, audio and other
  parts are dropped.
- An assistant's tool calls keep their id, function and arguments.
- A tool message's content goes into the `output` of the call it answers, and its error into the
  call's `error`. A tool message that answers no call stays a `tool` message.
- References to a sample's attachments (`attachment://…`) are replaced by their content.

Lost: events, the store, metadata, epoch reductions, the eval's metrics, sandbox details, and
images in messages.

## JUnit XML

`testsuites`, `testsuite` and `testcase` elements with `failure`, `error`, `skipped`,
`system-out` and `properties`, as most test runners write them. The reader handles entities,
CDATA, comments and nested suites, and closes elements a cut-short report leaves open.

| JUnit XML                                         | Result                                    |
| ------------------------------------------------- | ----------------------------------------- |
| `testsuites` `name`, else the only `testsuite`'s  | `suite`                                   |
| The earliest `testsuite` `timestamp`              | `startedAt`, as UTC when it has no zone   |
| A `model` or `provider` property of a `testsuite` | `labels.model`, `labels.provider`         |
| `testcase`                                        | A case, with one trial                    |
| `classname.name`, or `name` alone                 | The case's `id`                           |
| `name`, `classname`, the suite's `name`           | `title`, `description`, `tags`            |
| No outcome element, `failure`, `error`, `skipped` | `pass`, `fail`, `error`, `skip`           |
| The outcome's `type: message` and its text        | `error`, and the `passed` check's message |
| `time`, in seconds                                | `durationMs`                              |
| The test case's `system-out`                      | `output`                                  |

- Each case declares one check, `passed`, which a skipped trial leaves out.
- A test case that appears again, as a rerun does, adds a trial to its case.
- Suites with different `model` properties become different results.

Lost: `system-err`, suite-level output, assertions counts, files and lines, and properties other
than `model` and `provider`.

## From code

Node code can call the importer directly, as the action does:

```ts
import { importResults } from './src/import/import-results.ts';

const results = await importResults('results.json'); // or importResults(path, 'promptfoo')
for (const result of results) console.log(result.labels?.model, result.cases.length);
```

`detectFormat(path, content)` returns the format alone, and throws when it does not recognise it.
