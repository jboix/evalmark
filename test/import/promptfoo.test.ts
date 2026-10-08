import { describe, expect, test } from 'vitest';
import { resultSchema } from '../../src/format/result.ts';
import { importResults } from '../../src/import/import-results.ts';
import { importPromptfoo, providerLabels } from '../../src/import/promptfoo.ts';
import fixture from './fixtures/promptfoo-results.json';

const path = 'test/import/fixtures/promptfoo-results.json';

describe('promptfoo', () => {
  test('splits the results by provider, with the model and provider as labels', async () => {
    const results = await importResults(path);
    expect(results.map((result) => result.labels)).toEqual([
      { model: 'gpt-5-mini', provider: 'openai' },
      { model: 'sonnet', provider: 'anthropic' },
    ]);
    for (const result of results) {
      expect(resultSchema.safeParse(result).success).toBe(true);
      expect(result.suite).toBe('Customer support answers');
      expect(result.startedAt).toBe('2026-10-08T10:00:00.000Z');
      expect(result.durationMs).toBe(4210);
    }
  });

  test('makes the repeats of a test the trials of one case', async () => {
    const [openai] = await importResults(path, 'promptfoo');
    const refund = openai?.cases.find((entry) => entry.id === 'Refund policy');
    expect(refund?.trials.map((trial) => trial.status)).toEqual(['pass', 'fail']);
    expect(refund?.input).toBe("Answer the customer's question: Can I get a refund after 40 days?");
    expect(refund?.checks).toEqual([
      { id: 'contains', description: 'contains: 30 days' },
      { id: 'llm-rubric', description: 'llm-rubric: Is polite and does not promise a refund' },
    ]);
    expect(refund?.trials[1]).toMatchObject({
      score: 0,
      durationMs: 790,
      usage: { inputTokens: 120, outputTokens: 30, costUsd: 0.0002 },
      output: "Sure, I've issued a refund for you.",
      checks: [
        { id: 'contains', pass: false, message: 'Expected output to contain "30 days"' },
        { id: 'llm-rubric', pass: false, message: 'The answer promises a refund.' },
      ],
    });
  });

  test('names a test without a description by a hash of its variables, and keeps errors', async () => {
    const [openai, anthropic] = await importResults(path);
    const hours = openai?.cases[1];
    expect(hours?.id).toMatch(/^vars-[0-9a-f]{12}$/);
    expect(anthropic?.cases[1]?.id).toBe(hours?.id ?? '');
    expect(hours?.trials[0]).toMatchObject({
      status: 'error',
      error: 'API error: 429 Too Many Requests',
    });
    expect(anthropic?.cases[1]?.trials[0]?.checks).toEqual([
      { id: 'hours', pass: true, message: 'Assertion passed' },
    ]);
  });

  test('reads the evaluation summary alone, and splits by prompt when there are several', () => {
    const rows = fixture.results.results.filter((row) => row.provider.id.startsWith('openai'));
    const second = rows.map((row) => ({
      ...row,
      promptIdx: 1,
      prompt: { ...row.prompt, label: 'terse' },
    }));
    const results = importPromptfoo({ ...fixture.results, results: [...rows, ...second] });
    expect(results.map((result) => result.labels)).toEqual([
      { model: 'gpt-5-mini', provider: 'openai', prompt: 'support-prompt' },
      { model: 'gpt-5-mini', provider: 'openai', prompt: 'terse' },
    ]);
  });

  test('gives tests with one description and different variables different ids', () => {
    const [row] = fixture.results.results;
    const other = { ...row, vars: { question: 'And after 10 days?' } };
    const [result] = importPromptfoo({ results: { results: [row, other] } });
    const ids = result?.cases.map((entry) => entry.id) ?? [];
    expect(ids).toHaveLength(2);
    expect(ids[0]).toMatch(/^Refund policy \([0-9a-f]{12}\)$/);
  });

  test('reads provider ids', () => {
    expect(providerLabels('openai:chat:gpt-5')).toEqual({ model: 'gpt-5', provider: 'openai' });
    expect(providerLabels('bedrock:anthropic.claude-v2:1')).toEqual({
      model: 'anthropic.claude-v2:1',
      provider: 'bedrock',
    });
    expect(providerLabels({ id: 'echo' })).toEqual({ model: 'echo' });
    expect(providerLabels('http://localhost:3110/chat')).toEqual({
      model: 'http://localhost:3110/chat',
      provider: 'http',
    });
    expect(providerLabels({ id: 'file://agent.py', label: 'agent' })).toEqual({
      model: 'agent',
      provider: 'file',
    });
    expect(providerLabels(undefined)).toBeUndefined();
  });

  test('rejects a file that is not promptfoo results', () => {
    expect(() => importPromptfoo({ results: { nothing: [] } })).toThrow('not a promptfoo');
    expect(() => importPromptfoo({ results: { results: [] } })).toThrow('no result');
  });
});

describe('promptfoo red team and assertion-free tests', () => {
  test('tells red team tests apart by plugin and strategy, and tags them', () => {
    const [row] = fixture.results.results;
    const redTeam = (strategyId: string) => ({
      ...row,
      testCase: { ...row?.testCase, metadata: { pluginId: 'harmful:hate', strategyId } },
    });
    const [result] = importPromptfoo({
      results: { results: [redTeam('basic'), redTeam('jailbreak')] },
    });
    expect(result?.cases).toHaveLength(2);
    expect(result?.cases[1]?.tags).toEqual(['harmful:hate', 'jailbreak']);
  });

  test('gives a test without assertions no check', () => {
    const [row] = fixture.results.results;
    const graded = { ...row, gradingResult: { pass: true, score: 1, reason: 'No assertions' } };
    const [result] = importPromptfoo({ results: { results: [graded] } });
    expect(result?.cases[0]?.checks).toBeUndefined();
    expect(result?.cases[0]?.trials[0]?.checks).toBeUndefined();
  });
});
