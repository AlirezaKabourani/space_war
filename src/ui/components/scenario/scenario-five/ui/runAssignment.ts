import { WORLD_CATALOG } from "../model/index";
import type { Scenario5Seed, WorldId } from "../model/index";

export const fnv1a32 = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export interface Scenario5RunAssignment {
  readonly assignmentKey: string;
  readonly worldId: WorldId;
  readonly seed: Scenario5Seed;
  readonly runId: string;
  readonly epochStartedAt: number;
}

export const CANONICAL_SCENARIO5_WORLD_IDS = WORLD_CATALOG.map(({ worldId }) => worldId);

export function assignScenario5Run(userProfileId: string | undefined, epochStartedAt: number): Scenario5RunAssignment {
  const assignmentKey = `${userProfileId ?? "anonymous"}|${epochStartedAt}|s5-v3`;
  const worldHash = fnv1a32(`${assignmentKey}|world`);
  const seedHash = fnv1a32(`${assignmentKey}|seed`);
  const worldId = CANONICAL_SCENARIO5_WORLD_IDS[worldHash % CANONICAL_SCENARIO5_WORLD_IDS.length];
  if (!worldId) throw new Error("Scenario 5 canonical world catalog is empty");
  return {
    assignmentKey,
    worldId,
    seed: seedHash === 0 ? 1 : seedHash,
    runId: `s5-${epochStartedAt}-${worldHash.toString(16).padStart(8, "0")}`,
    epochStartedAt,
  };
}
