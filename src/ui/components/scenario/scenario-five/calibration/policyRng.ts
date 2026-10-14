export interface PolicyRng {
  readonly nextUint32: () => number;
  readonly nextFloat: () => number;
  readonly pickIndex: (length: number) => number;
  readonly coinFlip: () => boolean;
}
export function createPolicyRng(seed: number): PolicyRng {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new Error(`Policy seed must be an unsigned 32-bit integer: ${seed}`);
  }
  let state = seed >>> 0;
  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };
  const nextFloat = (): number => nextUint32() / 0x1_0000_0000;
  const pickIndex = (length: number): number => {
    if (!Number.isInteger(length) || length <= 0) throw new Error(`Policy RNG cannot pick from length ${length}`);
    return Math.floor(nextFloat() * length);
  };
  return { nextUint32, nextFloat, pickIndex, coinFlip: () => nextFloat() < 0.5 };
}
