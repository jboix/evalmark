import { describe, expect, test } from 'vitest';
import { createLogger, escapeData } from './log.ts';

describe('log', () => {
  test('escapes workflow command data', () => {
    expect(escapeData('50%\r\nnext')).toBe('50%25%0D%0Anext');
  });

  test('writes workflow commands', () => {
    let text = '';
    const log = createLogger((chunk) => {
      text += chunk;
    });
    log.group('Recording');
    log.info('line');
    log.warning('two\nlines');
    log.error('bad');
    log.mask('secret');
    log.mask('');
    log.endGroup();
    expect(text).toBe(
      '::group::Recording\nline\n::warning::two%0Alines\n::error::bad\n::add-mask::secret\n::endgroup::\n',
    );
  });
});
