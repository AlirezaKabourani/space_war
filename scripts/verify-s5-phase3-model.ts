import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_ACTOR_PROFILES,
  CANONICAL_CORRIDORS,
  WORLD_CATALOG,
  adjudicateModelStep,
  createInitialTrueWorldState,
  materializeEvidence,
  projectActorObservableState,
  projectPlayerObservableState,
  resolveActorReaction,
} from "../src/ui/components/scenario/scenario-five/model/index.ts";
import type {
  ActorProfileId,
  ActorVisibleSignals,
  EvidenceRequest,
  TrueWorldState,
  WorldId,
} from "../src/ui/components/scenario/scenario-five/model/index.ts";

let checks = 0;
const check = (condition: unknown, message: string): void => {
  assert.ok(condition, message);
  checks += 1;
};
const equal = (actual: unknown, expected: unknown, message: string): void => {
  assert.deepEqual(actual, expected, message);
  checks += 1;
};

const worldId = (profile: ActorProfileId, corridor = "corridor_alpha_east"): WorldId =>
  `W-${corridor}-${profile}` as WorldId;
const stateFor = (profile: ActorProfileId, seed = 42): TrueWorldState => createInitialTrueWorldState(worldId(profile), seed);
const signals = (patch: Partial<ActorVisibleSignals> = {}): ActorVisibleSignals => ({
  routeHardened: false,
  groundReconVisible: false,
  fallbackActivated: false,
  priorityConvoyConcentration: false,
  networkCoverageWeak: false,
  containmentVisible: false,
  executedResponseIntensity: "low",
  leastProtectedCorridorId: null,
  visibleRerouteCorridorIds: [],
  ...patch,
});
const observable = (state: TrueWorldState, patch: Partial<ActorVisibleSignals> = {}) =>
  projectActorObservableState(state, signals(patch), []);

// World catalog (1-8)
equal(WORLD_CATALOG.length, 16, "catalog must contain 16 worlds");
equal(new Set(WORLD_CATALOG.map(({ worldId: id }) => id)).size, 16, "world IDs must be unique");
for (const { corridorId } of CANONICAL_CORRIDORS) {
  equal(WORLD_CATALOG.filter((world) => world.primaryAffectedCorridorId === corridorId).length, 4, `${corridorId} count`);
}
for (const { profileId } of CANONICAL_ACTOR_PROFILES) {
  equal(WORLD_CATALOG.filter((world) => world.actorProfileId === profileId).length, 4, `${profileId} count`);
}
check(WORLD_CATALOG.every(({ hasActiveActor }) => hasActiveActor), "all worlds must have an actor");
check(new Set(WORLD_CATALOG.map(({ primaryAffectedCorridorId }) => primaryAffectedCorridorId)).size === 4, "alpha must not be universal");
const decoys = {
  corridor_alpha_east: "corridor_gamma_northwest",
  corridor_beta_south: "corridor_delta_west",
  corridor_gamma_northwest: "corridor_alpha_east",
  corridor_delta_west: "corridor_beta_south",
};
for (const world of WORLD_CATALOG.filter(({ actorProfileId }) => actorProfileId === "deceptive_diversion")) {
  equal(world.initialDecoyCorridorId, decoys[world.primaryAffectedCorridorId], "approved decoy mapping");
}
check(WORLD_CATALOG.filter(({ actorProfileId }) => actorProfileId !== "deceptive_diversion").every(({ initialDecoyCorridorId }) => initialDecoyCorridorId === null), "non-deceptive decoys must be null");

// Seed reproducibility (9-12)
equal(stateFor("deceptive_diversion", 88), stateFor("deceptive_diversion", 88), "same world and seed must reproduce");
const sameSeedA = stateFor("cautious_denial", 99);
const sameSeedB = stateFor("cautious_denial", 99);
equal(
  [sameSeedA.backgroundNoiseCorridorId, sameSeedA.latencyVariant],
  [sameSeedB.backgroundNoiseCorridorId, sameSeedB.latencyVariant],
  "same world and seed variants reproduce",
);
const differentSeed = stateFor("cautious_denial", 100);
equal(
  [differentSeed.worldId, differentSeed.primaryAffectedCorridorId, differentSeed.actorProfileId],
  [sameSeedA.worldId, sameSeedA.primaryAffectedCorridorId, sameSeedA.actorProfileId],
  "seed must not alter identity",
);
const otherWorldSameSeed = createInitialTrueWorldState(worldId("cautious_denial", "corridor_beta_south"), 99);
check(otherWorldSameSeed.worldId !== sameSeedA.worldId, "world identity comes from worldId, not seed");
const modelDirectory = fileURLToPath(new URL("../src/ui/components/scenario/scenario-five/model/", import.meta.url));
for (const file of readdirSync(modelDirectory).filter((name) => name.endsWith(".ts"))) {
  check(!/Math\.random/.test(readFileSync(`${modelDirectory}/${file}`, "utf8")), `${file} must not use Math.random`);
}

// Information boundaries (13-15)
const hiddenState = stateFor("deceptive_diversion");
const focused = materializeEvidence(hiddenState, { requestId: "focused", requestKind: "focused_pnt_analysis", targetCorridorId: hiddenState.primaryAffectedCorridorId });
const player = projectPlayerObservableState(hiddenState, focused, []);
const playerJson = JSON.stringify(player);
for (const forbidden of ["primaryAffectedCorridorId", "actorProfileId", "actorObjective", "seed", "riskBudget", "hiddenProvenance", "backgroundNoiseCorridorId", "decoyCorridorId"]) {
  check(!playerJson.includes(forbidden), `player projection must omit ${forbidden}`);
}
const actor = projectActorObservableState(hiddenState, signals(), []);
const actorJson = JSON.stringify(actor);
for (const forbidden of ["belief", "evidence", "selectedReasonId", "hover", "preview", "selectionId"]) {
  check(!actorJson.includes(forbidden), `actor projection must omit ${forbidden}`);
}
const actorSource = readFileSync(`${modelDirectory}/actorModel.ts`, "utf8");
check(actorSource.includes("observable: ActorObservableState") && !actorSource.includes("PlayerObservableState"), "actor API boundary must be typed to actor observables only");

// Evidence rules (16-21)
equal([focused[0]?.direction, focused[0]?.strengthBand], ["supports_targeted", "moderate"], "focused primary semantics");
check(!JSON.stringify(player.visibleEvidence).includes("primary"), "visible focused evidence must not reveal primary label");
const decoy = hiddenState.actorInternalState.decoyCorridorId;
assert.ok(decoy);
const decoyEvidence = materializeEvidence(hiddenState, { requestId: "decoy", requestKind: "focused_pnt_analysis", targetCorridorId: decoy })[0];
equal([decoyEvidence?.direction, decoyEvidence?.strengthBand, decoyEvidence?.hiddenProvenance.relation], ["supports_targeted", "moderate", "decoy_linked"], "decoy semantics and audit marker");
const noiseEvidence = materializeEvidence(hiddenState, { requestId: "noise", requestKind: "focused_pnt_analysis", targetCorridorId: hiddenState.backgroundNoiseCorridorId })[0];
equal([noiseEvidence?.direction, noiseEvidence?.strengthBand], ["ambiguous", "weak"], "noise semantics");
const broad = materializeEvidence(hiddenState, { requestId: "broad", requestKind: "broad_pnt_sweep" });
equal(new Set(broad.map(({ observedCorridorId }) => observedCorridorId)).size, 4, "broad sweep coverage");
const broadVisibleJson = JSON.stringify(projectPlayerObservableState(hiddenState, broad, []).visibleEvidence);
equal(
  ["primary", "decoy_linked", "background_noise"].filter((label) => broadVisibleJson.includes(label)),
  [],
  "broad sweep must hide every provenance relation label",
);
const liaisonExpected = {
  cautious_denial: ["supports_targeted", "moderate", "نشانه موضعی فعالیت اختلالی"],
  deceptive_diversion: ["ambiguous", "moderate", "اثر موضعی بدون انتساب قطعی"],
  opportunistic_interdiction: ["supports_targeted", "strong", "نشانه عملیاتی هم‌زمان با اختلال"],
  pressure_escalator: ["supports_targeted", "strong", "نشانه پایدار فعالیت اختلالی"],
} as const;
for (const profile of Object.keys(liaisonExpected) as ActorProfileId[]) {
  const state = stateFor(profile);
  const item = materializeEvidence(state, { requestId: `liaison-${profile}`, requestKind: "ground_liaison", targetCorridorId: state.primaryAffectedCorridorId })[0];
  equal([item?.direction, item?.strengthBand, item?.qualityLabelVisible], liaisonExpected[profile], `${profile} liaison semantics`);
}
for (const item of [...focused, ...broad]) {
  check(Boolean(item.sourceType && item.limitationVisible && item.qualityLabelVisible && item.hiddenProvenance), "evidence completeness");
}

// Actor rules (22-27)
const reaction = (profile: ActorProfileId, signalPatch: Partial<ActorVisibleSignals>, statePatch: Partial<TrueWorldState["actorInternalState"]> = {}) => {
  const base = stateFor(profile);
  const state = { ...base, actorInternalState: { ...base.actorInternalState, ...statePatch } };
  return resolveActorReaction(state, observable(state, signalPatch));
};
equal(reaction("cautious_denial", { groundReconVisible: true }).ruleId, "CD-1", "CD-1");
equal(reaction("cautious_denial", { routeHardened: true }).ruleId, "CD-2", "CD-2");
equal(reaction("cautious_denial", {}).ruleId, "CD-3", "CD-3");
equal(reaction("deceptive_diversion", { containmentVisible: true }).ruleId, "DD-1", "DD-1");
equal(reaction("deceptive_diversion", { networkCoverageWeak: true }).ruleId, "DD-2", "DD-2");
equal(reaction("deceptive_diversion", {}).ruleId, "DD-3", "DD-3");
equal(reaction("opportunistic_interdiction", { priorityConvoyConcentration: true, leastProtectedCorridorId: "corridor_beta_south" }).ruleId, "OI-1", "OI-1");
equal(reaction("opportunistic_interdiction", { networkCoverageWeak: true }).ruleId, "OI-2", "OI-2");
equal(reaction("opportunistic_interdiction", {}).ruleId, "OI-3", "OI-3");
equal(reaction("pressure_escalator", {}, { riskBudget: 0 }).ruleId, "PE-1", "PE-1");
equal(reaction("pressure_escalator", { executedResponseIntensity: "high" }).ruleId, "PE-2", "PE-2");
equal(reaction("pressure_escalator", { fallbackActivated: true, routeHardened: true }).ruleId, "PE-3", "PE-3");
equal(reaction("pressure_escalator", {}).ruleId, "PE-4", "PE-4");
for (const profile of CANONICAL_ACTOR_PROFILES.map(({ profileId }) => profileId)) {
  const state = stateFor(profile);
  const result = adjudicateModelStep({
    trueState: { ...state, actorInternalState: { ...state.actorInternalState, riskBudget: 0 } },
    decisionIntent: { phaseId: "A", roundId: 1, decisionWindowId: "A1_baseline_monitoring", actionId: "verify" },
    actorVisibleSignals: signals({ containmentVisible: true, priorityConvoyConcentration: true, leastProtectedCorridorId: "corridor_beta_south" }),
    visibleEvidence: [],
  });
  check(result.trueState.actorInternalState.riskBudget >= 0, `${profile} risk budget floor`);
  equal(result.trueState.actorInternalState.profileId, profile, `${profile} identity stability`);
}

// Adjudication (28-31)
const input = {
  trueState: stateFor("pressure_escalator"),
  decisionIntent: { phaseId: "C", roundId: 5, decisionWindowId: "C2_resource_portfolio", actionId: "normalized-action" },
  actorVisibleSignals: signals({ routeHardened: true }),
  visibleEvidence: focused,
  evidenceRequests: [{ requestId: "step-evidence", requestKind: "broad_pnt_sweep" }] as readonly EvidenceRequest[],
  userCostKinds: ["reserved_cost_slot"],
  worldTransitionKinds: ["registered_transition"],
  playerVisibleSignalKinds: ["registered_signal"],
  conditionalInjectKinds: ["registered_inject"],
} as const;
const result = adjudicateModelStep(input);
equal(result.events.map(({ eventKind }) => eventKind), [
  "decision_confirmed",
  "user_cost_registered",
  "world_clock_advanced",
  "world_transition_registered",
  "player_visible_signal_derived",
  "actor_visible_signal_derived",
  "actor_reaction_resolved",
  "conditional_inject_registered",
  "evidence_generated",
  "observable_state_updated",
], "pipeline order");
check(result.events.every(({ causeEventId }) => Boolean(causeEventId)), "every event needs a cause");
equal(adjudicateModelStep(input), result, "adjudication must replay deterministically");
const adjudicatorSource = readFileSync(`${modelDirectory}/adjudicator.ts`, "utf8");
check(!/mission.?end|cognitive.?scor|damage|delay.?minute|resource.?cost/i.test(adjudicatorSource), "adjudicator must omit later-phase logic");

console.log(`Scenario 5 Phase-3 model verification passed (${checks} assertions).`);
