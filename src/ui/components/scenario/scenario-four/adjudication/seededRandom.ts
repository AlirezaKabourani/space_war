import { redIntentWeights } from "../model/initialState";
import type { RedIntent } from "../model/types";

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const createSeededRandom = (seed: string) => {
  let state = hashString(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const seededNoise = (seed: string, key: string, range = 0.08) => {
  const random = createSeededRandom(`${seed}:${key}`);
  return random() * range * 2 - range;
};

export const selectRedIntent = (
  seed: string,
  distribution = redIntentWeights
): RedIntent => {
  const random = createSeededRandom(`${seed}:true-red-intent`);
  const roll = random() * distribution.reduce((sum, item) => sum + item.weight, 0);
  let cursor = 0;
  for (const item of distribution) {
    cursor += item.weight;
    if (roll <= cursor) return item.intent;
  }
  return distribution[distribution.length - 1].intent;
};

export const selectWeighted = <T extends string>(
  seed: string,
  distribution: Array<{ value: T; weight: number }>
): T => {
  const random = createSeededRandom(seed);
  const total = distribution.reduce((sum, item) => sum + item.weight, 0);
  const roll = random() * total;
  let cursor = 0;
  for (const item of distribution) {
    cursor += item.weight;
    if (roll <= cursor) return item.value;
  }
  return distribution[distribution.length - 1].value;
};
