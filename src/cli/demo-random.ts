/**
 * A seeded random number generator for the demo, so the same seed always builds the same history.
 */

/** A seeded source of random values: the same seed gives the same sequence. */
export interface Random {
  /** A number from 0 included to 1 excluded. */
  readonly next: () => number;
  /** `true` with the given probability, from 0 to 1. */
  readonly chance: (probability: number) => boolean;
  /** An integer from `min` to `max`, both included. */
  readonly integer: (min: number, max: number) => number;
  /** One of the items, which must not be empty. */
  readonly pick: <Item>(items: readonly Item[]) => Item;
  /** A string of lowercase hexadecimal digits of the given length. */
  readonly hex: (length: number) => string;
}

/**
 * A step of the mulberry32 generator.
 *
 * @param state - The generator's state, as an unsigned 32-bit integer.
 * @returns The next state and its value, from 0 included to 1 excluded.
 */
function mulberry32(state: number): { readonly state: number; readonly value: number } {
  const next = (state + 0x6d2b79f5) >>> 0;
  let mixed = Math.imul(next ^ (next >>> 15), next | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  return { state: next, value: ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296 };
}

/**
 * A random number generator seeded with `seed`.
 *
 * @param seed - Any integer.
 * @returns The generator.
 */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    const step = mulberry32(state);
    state = step.state;
    return step.value;
  };
  const integer = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <Item>(items: readonly Item[]): Item => {
    const item = items[integer(0, items.length - 1)];
    if (item === undefined) throw new RangeError('Cannot pick from an empty list.');
    return item;
  };
  const hex = (length: number) =>
    Array.from({ length }, () => integer(0, 15).toString(16)).join('');
  return { next, chance: (probability) => next() < probability, integer, pick, hex };
}
