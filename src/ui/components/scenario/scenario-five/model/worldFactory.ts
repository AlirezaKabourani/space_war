import { createSeededRng } from "./seededRng";
import type { ActorProfileId, PressureBand, Scenario5Seed, TrueWorldState, WorldId, WorldTemplate } from "./types";
import { SCENARIO5_WORLD_MODEL_VERSION } from "./versions";
import { CANONICAL_ACTOR_PROFILES, CANONICAL_CORRIDOR_IDS, WORLD_CATALOG } from "./worldCatalog";

const INITIAL_PRESSURE: Readonly<Record<ActorProfileId, PressureBand>> = {
  cautious_denial: "low",
  deceptive_diversion: "low",
  opportunistic_interdiction: "medium",
  pressure_escalator: "medium",
};

export function getWorldTemplate(worldId: WorldId): WorldTemplate {
  const template = WORLD_CATALOG.find((candidate) => candidate.worldId === worldId);
  if (!template) throw new Error(`Unknown Scenario 5 world: ${worldId}`);
  return template;
}

export function createInitialTrueWorldState(worldId: WorldId, seed: Scenario5Seed): TrueWorldState {
  const template = getWorldTemplate(worldId);
  const actor = CANONICAL_ACTOR_PROFILES.find(({ profileId }) => profileId === template.actorProfileId);
  if (!actor) throw new Error(`Missing actor metadata: ${template.actorProfileId}`);
  const rng = createSeededRng(seed);
  const noiseCandidates = CANONICAL_CORRIDOR_IDS.filter(
    (corridorId) => corridorId !== template.primaryAffectedCorridorId && corridorId !== template.initialDecoyCorridorId,
  );

  return {
    modelVersion: SCENARIO5_WORLD_MODEL_VERSION,
    worldId: template.worldId,
    seed,
    primaryAffectedCorridorId: template.primaryAffectedCorridorId,
    actorProfileId: template.actorProfileId,
    actorObjective: template.actorObjective,
    primaryInterferenceMode: template.primaryInterferenceMode,
    initialDecoyCorridorId: template.initialDecoyCorridorId,
    backgroundNoiseCorridorId: rng.pick(noiseCandidates),
    latencyVariant: rng.pick(["early", "nominal", "late"] as const),
    worldClockTick: 0,
    actorInternalState: {
      profileId: actor.profileId,
      objective: actor.objective,
      posture: actor.defaultPosture,
      riskBudget: actor.defaultRiskBudget,
      disruptionPressure: INITIAL_PRESSURE[actor.profileId],
      decoyCorridorId: template.initialDecoyCorridorId,
      relocated: false,
      lastReactionId: null,
    },
    eventSequence: 0,
  };
}
