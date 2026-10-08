import { expectTypeOf, test } from 'vitest';
import type { z } from 'zod';
import type { resultSchema } from './result.ts';
import type { Result } from './result-types.ts';

test('the declared types are the shape the schema validates (checked by tsc)', () => {
  expectTypeOf<z.infer<typeof resultSchema>>().toEqualTypeOf<Result>();
  expectTypeOf<z.input<typeof resultSchema>>().toEqualTypeOf<Result>();
});
