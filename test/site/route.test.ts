import { describe, expect, test } from 'vitest';
import { hrefOf, links, parseRoute, redirectOf, withQuery } from '../../src/site/lib/route.ts';

describe('parseRoute', () => {
  test('reads the results from an empty hash', () => {
    expect(parseRoute('')).toEqual({ view: 'results', query: {} });
    expect(parseRoute('#/')).toEqual({ view: 'results', query: {} });
  });

  test('reads each view with its ids and query', () => {
    expect(parseRoute('#/runs?branch=main')).toEqual({ view: 'runs', query: { branch: 'main' } });
    expect(parseRoute('#/runs/abc')).toEqual({ view: 'run', runId: 'abc', query: {} });
    expect(parseRoute('#/runs/abc/case%2F1/2')).toEqual({
      view: 'trial',
      runId: 'abc',
      caseId: 'case/1',
      trial: 2,
      query: {},
    });
    expect(parseRoute('#/cases/q1?by=model')).toEqual({
      view: 'case',
      caseId: 'q1',
      query: { by: 'model' },
    });
    expect(parseRoute('#/compare?base=a&head=b')).toEqual({
      view: 'compare',
      query: { base: 'a', head: 'b' },
    });
  });

  test('sends anything else to not-found', () => {
    expect(parseRoute('#/nowhere').view).toBe('not-found');
    expect(parseRoute('#/runs/abc/q1/x').view).toBe('not-found');
    expect(parseRoute('#/runs/abc/q1').view).toBe('not-found');
    expect(parseRoute('#/labels').view).toBe('not-found');
    expect(parseRoute('#/labels/model').view).toBe('not-found');
    expect(parseRoute('#/cases/a/b').view).toBe('not-found');
  });

  test('keeps a segment that is not valid percent-encoding', () => {
    expect(parseRoute('#/cases/100%')).toMatchObject({ view: 'case', caseId: '100%' });
  });
});

describe('links', () => {
  test('encode ids and drop empty query values', () => {
    expect(hrefOf(['cases', 'a b/c'], { tag: '', q: undefined, show: 'flaky' })).toBe(
      '#/cases/a%20b%2Fc?show=flaky',
    );
    expect(links.trial('r1', 'q/1', 0)).toBe('#/runs/r1/q%2F1/0');
    expect(links.compare({ base: 'a', head: 'b' })).toBe('#/compare?base=a&head=b');
    expect(links.results()).toBe('#/');
  });

  test('round-trip through the parser', () => {
    const route = parseRoute(links.trial('r1', 'case with spaces', 3));
    expect(route).toMatchObject({ view: 'trial', caseId: 'case with spaces', trial: 3 });
  });

  test('withQuery changes one value and keeps the others', () => {
    expect(withQuery('#/runs?branch=main&label.model=x', { branch: 'dev' })).toBe(
      '#/runs?branch=dev&label.model=x',
    );
    expect(withQuery('#/runs?branch=main', { branch: '' })).toBe('#/runs');
  });
});

describe('redirectOf', () => {
  test('sends the old case list to the results, keeping its query', () => {
    expect(redirectOf('#/cases')).toBe('#/');
    expect(redirectOf('#/cases?branch=main')).toBe('#/?branch=main');
  });

  test("sends a label's old page to the compare page's models mode", () => {
    expect(redirectOf('#/labels/model')).toBe('#/compare?mode=models&key=model');
  });

  test('leaves current addresses alone', () => {
    expect(redirectOf('#/')).toBeUndefined();
    expect(redirectOf('#/cases/q1')).toBeUndefined();
    expect(redirectOf('#/labels')).toBeUndefined();
    expect(redirectOf('#/labels/model/x')).toBeUndefined();
    expect(redirectOf('#/runs')).toBeUndefined();
  });
});
