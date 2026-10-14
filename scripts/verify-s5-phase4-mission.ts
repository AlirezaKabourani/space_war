import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  materializeEvidence,
  projectActorObservableState,
  resolveActorReaction,
} from "../src/ui/components/scenario/scenario-five/model/index.ts";
import type { ActorProfileId, CorridorId, EvidenceInstance, WorldId } from "../src/ui/components/scenario/scenario-five/model/index.ts";
import {
  BASE_ROUND_MINUTES,
  INITIAL_ISR_CAPACITY,
  INITIAL_SUPPORT_RESERVE,
  MISSION_ACTION_CATALOG,
  MISSION_HORIZON_MINUTES,
  MISSION_MODEL_VERSION,
  UnclassifiedMissionStateError,
  applyMissionDecision,
  calculateNetworkContinuity,
  calculateOperationalImpact,
  createInitialMissionState,
  deriveActorVisibleSignals,
  deriveOperationalAttributionStatus,
  finalizeMission,
  getAvailableMissionActions,
  getMissionAction,
  resolveMissionEndState,
  validateMissionAction,
} from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import type {
  MissionActionId,
  MissionActionSelection,
  MissionConvoyState,
  Scenario5EndStateId,
  Scenario5MissionState,
} from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";

let assertions = 0;
const check = (condition: unknown, message: string): void => {
  assert.ok(condition, message);
  assertions += 1;
};
const equal = (actual: unknown, expected: unknown, message: string): void => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const rejects = (fn: () => unknown, pattern: RegExp, message: string): void => {
  assert.throws(fn, pattern, message);
  assertions += 1;
};

const worldId = (profile: ActorProfileId, corridor: CorridorId = "corridor_alpha_east"): WorldId =>
  `W-${corridor}-${profile}` as WorldId;
const DEFAULT_WORLD = worldId("cautious_denial");
const target = "corridor_alpha_east" as const;

const runSelections = (
  initial: Scenario5MissionState,
  selections: readonly MissionActionSelection[],
): Scenario5MissionState => selections.reduce((state, selection) => applyMissionDecision(state, selection).state, initial);

const actionIdsByRound: readonly (readonly MissionActionId[])[] = [
  ["a1_network_baseline", "a1_priority_focus", "a1_rotating_watch", "a1_preserve_reserve"],
  ["a2_focused_pnt", "a2_broad_sweep", "a2_field_radio", "a2_ground_liaison"],
  ["b1_suspect_focus", "b1_priority_cargo", "b1_split_attention", "b1_pulse_network"],
  ["b2_continue_crosscheck", "b2_reroute", "b2_staged_checkpoints", "b2_hold_verify"],
  ["c1_fallback_nav", "c1_ground_recon", "c1_checkpoint_spacing", "c1_preserve_mobile_reserve"],
  ["c2_isr_heavy", "c2_mobility_heavy", "c2_balanced", "c2_priority_surge"],
  ["d1_emergency_reroute", "d1_ground_containment", "d1_deception_routing", "d1_escorted_continuation", "d1_hold_confirm"],
  ["d2_critical_delivery_surge", "d2_network_balanced_finish", "d2_resilient_handoff", "d2_continuity_first_finish"],
];
const expectedWindows = [
  "A1_baseline_monitoring", "A2_evidence_acquisition", "B1_monitoring_allocation", "B2_route_policy",
  "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy",
] as const;

// Configuration and action catalog.
equal(MISSION_MODEL_VERSION, "s5-mission-v1.1.0", "mission version");
equal([BASE_ROUND_MINUTES, MISSION_HORIZON_MINUTES, INITIAL_ISR_CAPACITY, INITIAL_SUPPORT_RESERVE], [20, 360, 100, 100], "fixed mission constants");
equal(MISSION_ACTION_CATALOG.length, 33, "exact action count");
equal(new Set(MISSION_ACTION_CATALOG.map(({ actionId }) => actionId)).size, 33, "unique action IDs");
equal(MISSION_ACTION_CATALOG.map(({ actionId, target: actionTarget, isrCost, supportCost, durationMinutes }) =>
  `${actionId}:${actionTarget}:${isrCost}:${supportCost}:${durationMinutes}`), [
  "a1_network_baseline:none:16:0:10", "a1_priority_focus:fixed_alpha:10:0:8", "a1_rotating_watch:none:12:0:10", "a1_preserve_reserve:none:0:0:5",
  "a2_focused_pnt:required:14:0:12", "a2_broad_sweep:none:22:0:18", "a2_field_radio:required:0:4:15", "a2_ground_liaison:required:0:12:20",
  "b1_suspect_focus:required:12:0:10", "b1_priority_cargo:fixed_alpha:10:0:8", "b1_split_attention:none:16:0:12", "b1_pulse_network:none:8:0:8",
  "b2_continue_crosscheck:required:4:8:8", "b2_reroute:required:0:14:20", "b2_staged_checkpoints:required:0:10:16", "b2_hold_verify:required:6:0:25",
  "c1_fallback_nav:required:0:14:12", "c1_ground_recon:required:0:18:20", "c1_checkpoint_spacing:required:0:10:15", "c1_preserve_mobile_reserve:none:0:0:5",
  "c2_isr_heavy:none:18:4:10", "c2_mobility_heavy:none:4:18:10", "c2_balanced:none:10:10:10", "c2_priority_surge:fixed_alpha:12:20:10",
  "d1_emergency_reroute:required:0:16:20", "d1_ground_containment:required:0:22:25", "d1_deception_routing:required:0:12:15", "d1_escorted_continuation:required:0:18:12", "d1_hold_confirm:required:8:0:20",
  "d2_critical_delivery_surge:fixed_alpha:0:14:12", "d2_network_balanced_finish:none:0:10:15", "d2_resilient_handoff:fixed_alpha:0:12:18", "d2_continuity_first_finish:none:0:8:15",
], "exact target, cost, and duration catalog signature");
for (let index = 0; index < actionIdsByRound.length; index += 1) {
  const round = index + 1;
  equal(MISSION_ACTION_CATALOG.filter(({ roundId }) => roundId === round).map(({ actionId }) => actionId), actionIdsByRound[index], `round ${round} action IDs`);
  check(MISSION_ACTION_CATALOG.filter(({ roundId }) => roundId === round).every(({ decisionWindowId }) => decisionWindowId === expectedWindows[index]), `round ${round} decision window`);
}
for (const action of MISSION_ACTION_CATALOG) {
  check(action.isrCost >= 0 && action.supportCost >= 0 && action.durationMinutes >= 0, `${action.actionId} nonnegative parameters`);
  equal(getMissionAction(action.actionId), action, `${action.actionId} lookup`);
}

const initial = createInitialMissionState(DEFAULT_WORLD, 1);
equal(initial.resources, { isrCapacity: 100, supportReserve: 100 }, "initial resources");
equal(initial.convoys.map(({ convoyId, baselineArrivalMinute, deadlineMinute, integrity }) => [convoyId, baselineArrivalMinute, deadlineMinute, integrity]), [
  ["alpha", 210, 300, 100], ["beta", 235, 330, 100], ["gamma", 225, 315, 100], ["delta", 250, 345, 100],
], "initial convoy config");
check(initial.convoys.every((convoy) => convoy.delayMinutes === 0 && convoy.pntExposure === 0 && convoy.status === "moving"), "initial convoy state");
equal(getAvailableMissionActions(initial).map(({ actionId }) => actionId), actionIdsByRound[0], "available actions match current round");
equal(validateMissionAction(initial, { actionId: "a1_preserve_reserve", targetCorridorId: "corridor_beta_south" }).effectiveTargetCorridorId, null, "no-target ignores supplied target");
equal(validateMissionAction(initial, { actionId: "a1_priority_focus" }).effectiveTargetCorridorId, target, "fixed alpha defaults correctly");
rejects(() => validateMissionAction(initial, { actionId: "a1_priority_focus", targetCorridorId: "corridor_beta_south" }), /only accepts/, "fixed alpha rejects other target");
const round2 = applyMissionDecision(initial, { actionId: "a1_preserve_reserve" }).state;
rejects(() => validateMissionAction(round2, { actionId: "a2_focused_pnt" }), /requires/, "required target rejects omission");
rejects(() => validateMissionAction(round2, { actionId: "a1_network_baseline" }), /belongs to round/, "out-of-order action rejects");
const noResources = { ...initial, resources: { isrCapacity: 0, supportReserve: 0 } };
rejects(() => applyMissionDecision(noResources, { actionId: "a1_network_baseline" }), /Insufficient ISR/, "unaffordable action rejects");

// Resources and clock, including maximum-cost legal path.
const maximumCostPath: readonly MissionActionSelection[] = [
  { actionId: "a1_network_baseline" },
  { actionId: "a2_broad_sweep" },
  { actionId: "b1_split_attention" },
  { actionId: "b2_reroute", targetCorridorId: target },
  { actionId: "c1_ground_recon", targetCorridorId: target },
  { actionId: "c2_priority_surge" },
  { actionId: "d1_ground_containment", targetCorridorId: target },
  { actionId: "d2_critical_delivery_surge" },
];
const maxCostState = runSelections(createInitialMissionState(DEFAULT_WORLD, 3), maximumCostPath);
equal(maxCostState.resources, { isrCapacity: 34, supportReserve: 12 }, "maximum-cost path exact resources");
check(maxCostState.resources.isrCapacity >= 0 && maxCostState.resources.supportReserve >= 0, "maximum-cost path remains feasible");
const clockStep = applyMissionDecision(createInitialMissionState(DEFAULT_WORLD, 4), { actionId: "a1_priority_focus" });
equal(clockStep.state.worldClockMinutes, 28, "clock advances base plus duration");
equal(clockStep.state.trueWorldState.worldClockTick, 1, "one structural tick per decision");
equal(clockStep.state.resources, { isrCapacity: 90, supportReserve: 100 }, "cost subtracted once");

// Delayed evidence latency and exact-once release.
const findSeed = (variant: "early" | "nominal" | "late"): number => {
  for (let seed = 0; seed < 1000; seed += 1) {
    if (createInitialMissionState(DEFAULT_WORLD, seed).trueWorldState.latencyVariant === variant) return seed;
  }
  throw new Error(`No seed found for ${variant}`);
};
for (const [variant, offset] of [["early", 1], ["nominal", 2], ["late", 3]] as const) {
  let state = applyMissionDecision(createInitialMissionState(DEFAULT_WORLD, findSeed(variant)), { actionId: "a1_preserve_reserve" }).state;
  state = applyMissionDecision(state, { actionId: "a2_ground_liaison", targetCorridorId: target }).state;
  equal(state.pendingEvidenceRequests[0]?.dueWorldTick, state.trueWorldState.worldClockTick + offset, `${variant} due offset`);
  const requestId = state.pendingEvidenceRequests[0]?.request.requestId;
  let releaseCount = 0;
  const followups: readonly MissionActionSelection[] = [
    { actionId: "b1_pulse_network" },
    { actionId: "b2_continue_crosscheck", targetCorridorId: target },
    { actionId: "c1_preserve_mobile_reserve" },
  ];
  for (const selection of followups) {
    const result = applyMissionDecision(state, selection);
    releaseCount += result.emittedMissionEvents.filter(({ eventKind, payload }) =>
      eventKind === "mission_evidence_released"
      && (payload.releasedPendingRequestIds as readonly string[] | undefined)?.includes(requestId ?? ""),
    ).length;
    state = result.state;
  }
  equal(releaseCount, 1, `${variant} request released exactly once`);
  check(!state.pendingEvidenceRequests.some(({ request }) => request.requestId === requestId), `${variant} request removed after release`);
}

const lateSeed = findSeed("late");
const toRound7: readonly MissionActionSelection[] = [
  { actionId: "a1_preserve_reserve" }, { actionId: "a2_field_radio", targetCorridorId: target },
  { actionId: "b1_pulse_network" }, { actionId: "b2_continue_crosscheck", targetCorridorId: target },
  { actionId: "c1_preserve_mobile_reserve" }, { actionId: "c2_balanced" },
];
let finalPending = runSelections(createInitialMissionState(DEFAULT_WORLD, lateSeed), toRound7);
finalPending = applyMissionDecision(finalPending, { actionId: "d1_ground_containment", targetCorridorId: target }).state;
check(finalPending.pendingEvidenceRequests.length === 1 && finalPending.pendingEvidenceRequests[0]!.dueWorldTick > 8, "post-R8 request remains pending before final step");
const finalPendingResult = applyMissionDecision(finalPending, { actionId: "d2_continuity_first_finish" });
equal(finalPendingResult.state.pendingEvidenceRequests.length, 0, "finalization clears pending evidence");
check(finalPendingResult.state.missionEvents.some(({ eventKind, payload }) => eventKind === "mission_evidence_released" && payload.lateArrivingFinalEvidence === true), "late final evidence recorded");

// Actor-visible signal mapping and protection selector.
const directSets = {
  groundReconVisible: new Set(["a2_ground_liaison", "c1_ground_recon", "d1_ground_containment"]),
  fallbackActivated: new Set(["b2_continue_crosscheck", "c1_fallback_nav", "d2_resilient_handoff"]),
  containmentVisible: new Set(["d1_ground_containment"]),
  priorityConvoyConcentration: new Set(["a1_priority_focus", "b1_priority_cargo", "c2_priority_surge", "d2_critical_delivery_surge"]),
  routeHardened: new Set(["b2_reroute", "b2_staged_checkpoints", "c1_checkpoint_spacing", "d1_emergency_reroute"]),
  visibleReroute: new Set(["b2_reroute", "d1_emergency_reroute", "d1_deception_routing"]),
};
for (const action of MISSION_ACTION_CATALOG) {
  equal(action.groundReconVisible, directSets.groundReconVisible.has(action.actionId), `${action.actionId} ground recon flag`);
  equal(action.activatesFallback, directSets.fallbackActivated.has(action.actionId), `${action.actionId} fallback flag`);
  equal(action.containmentVisible, directSets.containmentVisible.has(action.actionId), `${action.actionId} containment flag`);
  equal(action.priorityConvoyConcentration, directSets.priorityConvoyConcentration.has(action.actionId), `${action.actionId} priority flag`);
  equal(action.hardensRoute, directSets.routeHardened.has(action.actionId), `${action.actionId} hardening flag`);
  equal(action.visibleReroute, directSets.visibleReroute.has(action.actionId), `${action.actionId} reroute visibility`);
}
const initialSignals = deriveActorVisibleSignals(initial, getMissionAction("a1_preserve_reserve"), null).signals;
equal(initialSignals.leastProtectedCorridorId, "corridor_beta_south", "least-protected exact tie-break");
equal(initialSignals.networkCoverageWeak, false, "round 1 non-priority coverage is not weak");
equal(deriveActorVisibleSignals(initial, getMissionAction("a1_priority_focus"), target).signals.networkCoverageWeak, true, "round 1 priority coverage is weak");
const round3Initial = { ...initial, currentRound: 3 as const };
equal(deriveActorVisibleSignals(round3Initial, getMissionAction("b1_pulse_network"), null).signals.networkCoverageWeak, true, "round 3 fewer than two protected is weak");
const twoProtected = {
  ...round3Initial,
  convoys: round3Initial.convoys.map((convoy, index) => index < 2 ? { ...convoy, fallbackNav: true } : convoy),
};
equal(deriveActorVisibleSignals(twoProtected, getMissionAction("b1_pulse_network"), null).signals.networkCoverageWeak, false, "round 3 two protected is covered");
equal(deriveActorVisibleSignals(twoProtected, getMissionAction("b1_priority_cargo"), target).signals.networkCoverageWeak, true, "priority concentration overrides coverage");

const deliveredBetaActiveSelection: Scenario5MissionState = {
  ...round3Initial,
  convoys: round3Initial.convoys.map((convoy) => {
    if (convoy.convoyId === "beta") return { ...convoy, status: "delivered" as const, deliveredAtMinute: 235 };
    if (convoy.convoyId === "alpha" || convoy.convoyId === "delta") return { ...convoy, fallbackNav: true };
    return convoy;
  }),
};
const deliveredBetaSignals = deriveActorVisibleSignals(deliveredBetaActiveSelection, getMissionAction("b1_pulse_network"), null);
equal(deliveredBetaSignals.signals.leastProtectedCorridorId, "corridor_gamma_northwest", "delivered beta is excluded from least-protected selection");
equal(Object.keys(deliveredBetaSignals.protectionScores).sort(), [
  "corridor_alpha_east", "corridor_beta_south", "corridor_delta_west", "corridor_gamma_northwest",
], "protection scores retain all four corridors for audit");

const activeTieState: Scenario5MissionState = {
  ...round3Initial,
  convoys: round3Initial.convoys.map((convoy) => {
    if (convoy.convoyId === "beta") return { ...convoy, status: "delivered" as const, deliveredAtMinute: 235 };
    if (convoy.convoyId === "alpha") return { ...convoy, fallbackNav: true };
    return convoy;
  }),
};
equal(deriveActorVisibleSignals(activeTieState, getMissionAction("b1_pulse_network"), null).signals.leastProtectedCorridorId, "corridor_gamma_northwest", "active gamma wins equal-minimum tie before active delta");

const deliveredProtectedOnly: Scenario5MissionState = {
  ...round3Initial,
  convoys: round3Initial.convoys.map((convoy) => convoy.convoyId === "beta" || convoy.convoyId === "gamma"
    ? { ...convoy, status: "delivered" as const, deliveredAtMinute: convoy.baselineArrivalMinute, fallbackNav: true }
    : convoy),
};
equal(deriveActorVisibleSignals(deliveredProtectedOnly, getMissionAction("b1_pulse_network"), null).signals.networkCoverageWeak, true, "delivered protected convoys do not count toward active coverage");

const twoActiveProtected: Scenario5MissionState = {
  ...deliveredProtectedOnly,
  convoys: deliveredProtectedOnly.convoys.map((convoy) => convoy.status === "delivered" ? convoy : { ...convoy, fallbackNav: true }),
};
equal(deriveActorVisibleSignals(twoActiveProtected, getMissionAction("b1_pulse_network"), null).signals.networkCoverageWeak, false, "two protected active convoys provide active coverage");

const noActiveConvoys: Scenario5MissionState = {
  ...round3Initial,
  convoys: round3Initial.convoys.map((convoy) => ({
    ...convoy,
    status: "delivered" as const,
    deliveredAtMinute: convoy.baselineArrivalMinute,
  })),
};
const noActiveSignals = deriveActorVisibleSignals(noActiveConvoys, getMissionAction("b1_priority_cargo"), target).signals;
equal(noActiveSignals.leastProtectedCorridorId, null, "no active convoy has no least-protected corridor");
equal(noActiveSignals.networkCoverageWeak, false, "no active convoy is not weak network coverage in round 3+");

const opportunisticBase = createInitialMissionState(worldId("opportunistic_interdiction"), 83);
const opportunisticActiveState: Scenario5MissionState = {
  ...opportunisticBase,
  currentRound: 3,
  convoys: opportunisticBase.convoys.map((convoy) => {
    if (convoy.convoyId === "beta") return { ...convoy, status: "delivered" as const, deliveredAtMinute: 235 };
    if (convoy.convoyId === "alpha" || convoy.convoyId === "delta") return { ...convoy, fallbackNav: true };
    return convoy;
  }),
};
const opportunisticSignals = deriveActorVisibleSignals(opportunisticActiveState, getMissionAction("b1_priority_cargo"), target).signals;
const opportunisticReaction = resolveActorReaction(
  opportunisticActiveState.trueWorldState,
  projectActorObservableState(opportunisticActiveState.trueWorldState, opportunisticSignals, []),
);
equal(opportunisticReaction.secondaryCorridorId, "corridor_gamma_northwest", "opportunistic Actor selects active gamma, never delivered beta");

// Actor operational impact values, progression, protection, secondary target, and decoy boundary.
const baseConvoy = initial.convoys[0]!;
equal(calculateOperationalImpact({ convoy: baseConvoy, pressure: "low", roundId: 3, secondary: false }), { delayMinutes: 4, pntExposure: 6, integrityDamage: 0 }, "low base impact");
equal(calculateOperationalImpact({ convoy: baseConvoy, pressure: "medium", roundId: 3, secondary: false }), { delayMinutes: 8, pntExposure: 12, integrityDamage: 3 }, "medium base impact");
equal(calculateOperationalImpact({ convoy: baseConvoy, pressure: "high", roundId: 3, secondary: false }), { delayMinutes: 14, pntExposure: 20, integrityDamage: 7 }, "high base impact");
equal(calculateOperationalImpact({ convoy: baseConvoy, pressure: "high", roundId: 1, secondary: false }), { delayMinutes: 4, pntExposure: 5, integrityDamage: 2 }, "round 1 multiplier");
equal(calculateOperationalImpact({ convoy: baseConvoy, pressure: "high", roundId: 2, secondary: false }), { delayMinutes: 7, pntExposure: 10, integrityDamage: 4 }, "round 2 multiplier");
equal(calculateOperationalImpact({ convoy: { ...baseConvoy, fallbackNav: true }, pressure: "high", roundId: 3, secondary: false }), { delayMinutes: 11, pntExposure: 9, integrityDamage: 5 }, "fallback multipliers");
equal(calculateOperationalImpact({ convoy: { ...baseConvoy, routeHardened: true }, pressure: "high", roundId: 3, secondary: false }), { delayMinutes: 11, pntExposure: 15, integrityDamage: 5 }, "route multipliers");
equal(calculateOperationalImpact({ convoy: { ...baseConvoy, groundSupport: true }, pressure: "high", roundId: 3, secondary: false }), { delayMinutes: 12, pntExposure: 16, integrityDamage: 5 }, "ground multipliers");
equal(calculateOperationalImpact({ convoy: { ...baseConvoy, escortedUntilRound: 3 }, pressure: "high", roundId: 3, secondary: false }), { delayMinutes: 13, pntExposure: 17, integrityDamage: 4 }, "escort multipliers");
for (const [level, expected] of [[-1, [15, 22, 8]], [0, [14, 20, 7]], [1, [13, 18, 6]], [2, [11, 16, 6]]] as const) {
  const impact = calculateOperationalImpact({ convoy: { ...baseConvoy, temporaryProtectionLevel: level }, pressure: "high", roundId: 3, secondary: false });
  equal([impact.delayMinutes, impact.pntExposure, impact.integrityDamage], expected, `temporary level ${level}`);
}
equal(calculateOperationalImpact({ convoy: baseConvoy, pressure: "high", roundId: 3, secondary: true }), { delayMinutes: 8, pntExposure: 12, integrityDamage: 4 }, "secondary impact is rounded 60 percent");
const deceptiveState = createInitialMissionState(worldId("deceptive_diversion"), 5);
const decoyId = deceptiveState.trueWorldState.initialDecoyCorridorId;
const deceptiveResult = applyMissionDecision(deceptiveState, { actionId: "a1_preserve_reserve" }).state;
const decoyAfter = deceptiveResult.convoys.find(({ corridorId }) => corridorId === decoyId)!;
equal([decoyAfter.delayMinutes, decoyAfter.pntExposure, decoyAfter.integrity], [0, 0, 100], "decoy alone receives no physical impact");

// Mission status, clamping, persistence, delay floor, and temporary expiry.
const syntheticRound3: Scenario5MissionState = {
  ...createInitialMissionState(worldId("pressure_escalator"), 6),
  currentRound: 3,
  worldClockMinutes: 210,
  trueWorldState: {
    ...createInitialMissionState(worldId("pressure_escalator"), 6).trueWorldState,
    worldClockTick: 2,
  },
  convoys: createInitialMissionState(worldId("pressure_escalator"), 6).convoys.map((convoy) =>
    convoy.convoyId === "alpha" ? { ...convoy, pntExposure: 99, integrity: 1 } : convoy),
};
const clamped = applyMissionDecision(syntheticRound3, { actionId: "b1_pulse_network" }).state;
const clampedAlpha = clamped.convoys.find(({ convoyId }) => convoyId === "alpha")!;
equal([clampedAlpha.pntExposure, clampedAlpha.integrity, clampedAlpha.status], [100, 0, "compromised"], "exposure and integrity clamp with compromise");
equal(validateMissionAction(clamped, { actionId: "b2_hold_verify", targetCorridorId: target }).effectiveTargetCorridorId, target, "compromised target remains eligible");
check(clamped.convoys.find(({ convoyId }) => convoyId === "beta")?.status === "delivered", "arrival calculation delivers eligible convoy");
const round4State = runSelections(createInitialMissionState(DEFAULT_WORLD, 8), [
  { actionId: "a1_preserve_reserve" }, { actionId: "a2_field_radio", targetCorridorId: target }, { actionId: "b1_pulse_network" },
]);
const heldResult = applyMissionDecision(round4State, { actionId: "b2_hold_verify", targetCorridorId: "corridor_beta_south" }).state;
equal(heldResult.convoys.find(({ convoyId }) => convoyId === "beta")?.status, "moving", "held resets after step");

// Delivered-convoy target rejection and full in-transit state immutability.
const deliveredBetaRound4 = {
  ...round4State,
  convoys: round4State.convoys.map((convoy) => convoy.convoyId === "beta" ? {
    ...convoy,
    status: "delivered" as const,
    deliveredAtMinute: 235,
    temporaryProtectionLevel: 1 as const,
    temporaryProtectionUntilRound: 7 as const,
  } : convoy),
};
const deliveredBetaSnapshot = structuredClone(deliveredBetaRound4);
rejects(
  () => applyMissionDecision(deliveredBetaRound4, { actionId: "b2_hold_verify", targetCorridorId: "corridor_beta_south" }),
  /already delivered/,
  "required target rejects delivered convoy",
);
equal(deliveredBetaRound4, deliveredBetaSnapshot, "required-target rejection occurs before state mutation");

const deliveredAlphaRound1 = {
  ...createInitialMissionState(DEFAULT_WORLD, 81),
  convoys: createInitialMissionState(DEFAULT_WORLD, 81).convoys.map((convoy) => convoy.convoyId === "alpha"
    ? { ...convoy, status: "delivered" as const, deliveredAtMinute: 210 }
    : convoy),
};
const deliveredAlphaRound1Snapshot = structuredClone(deliveredAlphaRound1);
rejects(
  () => applyMissionDecision(deliveredAlphaRound1, { actionId: "a1_priority_focus" }),
  /already delivered/,
  "fixed-alpha target rejects delivered alpha",
);
equal(deliveredAlphaRound1, deliveredAlphaRound1Snapshot, "fixed-target rejection occurs before state mutation");

const deliveredBetaBeforeDifferentTarget = deliveredBetaRound4.convoys.find(({ convoyId }) => convoyId === "beta")!;
const differentTargetResult = applyMissionDecision(deliveredBetaRound4, {
  actionId: "b2_hold_verify",
  targetCorridorId: "corridor_alpha_east",
});
equal(
  differentTargetResult.state.convoys.find(({ convoyId }) => convoyId === "beta"),
  deliveredBetaBeforeDifferentTarget,
  "targeting a different active convoy preserves delivered convoy exactly",
);

const primaryDeliveredBefore = {
  ...round4State,
  convoys: round4State.convoys.map((convoy) => convoy.convoyId === "alpha"
    ? { ...convoy, status: "delivered" as const, deliveredAtMinute: 210 }
    : convoy),
};
const primaryDeliveredConvoy = primaryDeliveredBefore.convoys.find(({ convoyId }) => convoyId === "alpha")!;
const skippedPrimaryResult = applyMissionDecision(primaryDeliveredBefore, {
  actionId: "b2_hold_verify",
  targetCorridorId: "corridor_beta_south",
});
equal(skippedPrimaryResult.state.convoys.find(({ convoyId }) => convoyId === "alpha"), primaryDeliveredConvoy, "Actor impact preserves delivered primary convoy");
const impactEvent = skippedPrimaryResult.emittedMissionEvents.find(({ eventKind }) => eventKind === "mission_actor_impact_applied")!;
check((impactEvent.payload.skippedDeliveredCorridorIds as readonly CorridorId[]).includes("corridor_alpha_east"), "Actor impact records skipped delivered primary corridor");
check(!Object.hasOwn(impactEvent.payload.impacts as object, "corridor_alpha_east"), "Actor impact object omits delivered primary corridor");

const globalBase: Scenario5MissionState = {
  ...finalPending,
  pendingEvidenceRequests: [],
  convoys: finalPending.convoys.map((convoy) => convoy.convoyId === "alpha" || convoy.convoyId === "beta" ? {
    ...convoy,
    status: "delivered" as const,
    deliveredAtMinute: convoy.baselineArrivalMinute,
    temporaryProtectionLevel: 2 as const,
    temporaryProtectionUntilRound: 8 as const,
  } : convoy),
};
const deliveredBeforeGlobals = globalBase.convoys.filter(({ status }) => status === "delivered");
for (const actionId of ["d2_network_balanced_finish", "d2_continuity_first_finish"] as const) {
  const globalResult = applyMissionDecision(globalBase, { actionId });
  equal(
    globalResult.state.convoys.filter(({ convoyId }) => deliveredBeforeGlobals.some((before) => before.convoyId === convoyId)),
    deliveredBeforeGlobals,
    `${actionId} preserves every delivered convoy across global effects and expiry`,
  );
}

const normalDeliveryPath: readonly MissionActionSelection[] = [
  { actionId: "a1_network_baseline" },
  { actionId: "a2_broad_sweep" },
  { actionId: "b1_split_attention" },
  { actionId: "b2_hold_verify", targetCorridorId: "corridor_gamma_northwest" },
  { actionId: "c1_ground_recon", targetCorridorId: "corridor_delta_west" },
  { actionId: "c2_isr_heavy" },
  { actionId: "d1_ground_containment", targetCorridorId: "corridor_delta_west" },
];
const afterNormalDelivery = runSelections(createInitialMissionState(DEFAULT_WORLD, 82), normalDeliveryPath);
const deliveredBetaNormally = afterNormalDelivery.convoys.find(({ convoyId }) => convoyId === "beta")!;
equal(deliveredBetaNormally.status, "delivered", "convoy becomes delivered during normal execution");
const afterSubsequentRound = applyMissionDecision(afterNormalDelivery, { actionId: "d2_network_balanced_finish" }).state;
const deliveredBetaAfterSubsequentRound = afterSubsequentRound.convoys.find(({ convoyId }) => convoyId === "beta")!;
equal(deliveredBetaAfterSubsequentRound, deliveredBetaNormally, "normal delivered convoy remains deeply immutable in subsequent round");
equal(
  [deliveredBetaAfterSubsequentRound.deliveredAtMinute, deliveredBetaAfterSubsequentRound.delayMinutes, deliveredBetaAfterSubsequentRound.integrity, deliveredBetaAfterSubsequentRound.pntExposure, deliveredBetaAfterSubsequentRound.status],
  [deliveredBetaNormally.deliveredAtMinute, deliveredBetaNormally.delayMinutes, deliveredBetaNormally.integrity, deliveredBetaNormally.pntExposure, "delivered"],
  "delivery timestamp and transit values remain final",
);
check(maxCostState.convoys.every(({ delayMinutes }) => delayMinutes >= 0), "delay never negative");
check(maxCostState.convoys.every(({ pntExposure, integrity }) => pntExposure >= 0 && pntExposure <= 100 && integrity >= 0 && integrity <= 100), "convoy bounded values");
check(maxCostState.convoys.every(({ temporaryProtectionLevel, temporaryProtectionUntilRound }) => temporaryProtectionLevel === 0 && temporaryProtectionUntilRound === null), "temporary protection expires after round 8");

// Operational attribution is visible-evidence only.
const evidenceState = createInitialMissionState(DEFAULT_WORLD, 9).trueWorldState;
const moderate = materializeEvidence(evidenceState, { requestId: "attr-pnt", requestKind: "focused_pnt_analysis", targetCorridorId: target })[0]!;
const weakField: EvidenceInstance = { ...moderate, evidenceId: "attr-field", sourceType: "field_report", strengthBand: "weak" };
const weakRadio: EvidenceInstance = { ...moderate, evidenceId: "attr-radio", sourceType: "radio_timing", strengthBand: "weak" };
equal(deriveOperationalAttributionStatus([moderate]), "unresolved", "one source insufficient");
equal(deriveOperationalAttributionStatus([{ ...weakField, strengthBand: "weak" }, weakRadio]), "unresolved", "two weak sources insufficient");
equal(deriveOperationalAttributionStatus([moderate, weakField]), "resolved", "two sources with moderate resolves");
equal(deriveOperationalAttributionStatus([
  { ...moderate, hiddenProvenance: { ...moderate.hiddenProvenance, relation: "other" } },
  { ...weakField, hiddenProvenance: { ...weakField.hiddenProvenance, relation: "background_noise" } },
]), "resolved", "hidden provenance is irrelevant");

// Six end states, precedence, invariant, and no default success.
const fixture = (options: {
  alphaIntegrity?: number;
  alphaDelay?: number;
  otherOperationalCount?: number;
  attribution?: "resolved" | "unresolved";
  contained?: boolean;
}): Scenario5MissionState => {
  const base = createInitialMissionState(DEFAULT_WORLD, 10);
  const otherOperationalCount = options.otherOperationalCount ?? 3;
  return {
    ...base,
    completed: true,
    worldClockMinutes: 360,
    operationalAttributionStatus: options.attribution ?? "unresolved",
    trueWorldState: {
      ...base.trueWorldState,
      actorInternalState: {
        ...base.trueWorldState.actorInternalState,
        posture: options.contained ? "disengaging" : "covert",
        lastReactionId: options.contained ? "escalator_disengage" : null,
      },
    },
    convoys: base.convoys.map((convoy, index) => {
      if (convoy.convoyId === "alpha") return { ...convoy, integrity: options.alphaIntegrity ?? 100, delayMinutes: options.alphaDelay ?? 1 };
      return index <= otherOperationalCount ? convoy : { ...convoy, integrity: 59 };
    }),
  };
};
const endFixtures: readonly [Scenario5EndStateId, Scenario5MissionState][] = [
  ["critical_cargo_lost_or_compromised", fixture({ alphaIntegrity: 54, otherOperationalCount: 3 })],
  ["priority_delivered_network_degradation", fixture({ otherOperationalCount: 2 })],
  ["mission_incomplete_continuity_preserved", fixture({ alphaDelay: 151, otherOperationalCount: 3 })],
  ["delivery_complete_threat_persistent", fixture({ attribution: "resolved", contained: false })],
  ["delivery_complete_attribution_unresolved", fixture({ attribution: "unresolved" })],
  ["delivery_complete_threat_contained", fixture({ attribution: "resolved", contained: true })],
];
for (const [expected, state] of endFixtures) equal(resolveMissionEndState(state).endStateId, expected, `${expected} fixture`);
equal(calculateNetworkContinuity(endFixtures[3]![1]), 100, "persistent-threat state requires full continuity rather than a delay condition");
equal(resolveMissionEndState(fixture({ alphaIntegrity: 54, otherOperationalCount: 3 })).endStateId, "critical_cargo_lost_or_compromised", "critical integrity precedence over otherwise preserved continuity");
const invalidAttribution = { ...fixture({}), operationalAttributionStatus: "invalid" as Scenario5MissionState["operationalAttributionStatus"] };
rejects(() => resolveMissionEndState(invalidAttribution), UnclassifiedMissionStateError, "unclassified state throws rather than succeeds");
equal(calculateNetworkContinuity(fixture({ otherOperationalCount: 2 })), 75, "network continuity exact quarters");
equal([
  calculateNetworkContinuity(fixture({ alphaIntegrity: 59, otherOperationalCount: 0 })),
  calculateNetworkContinuity(fixture({ otherOperationalCount: 0 })),
  calculateNetworkContinuity(fixture({ otherOperationalCount: 1 })),
  calculateNetworkContinuity(fixture({ otherOperationalCount: 2 })),
  calculateNetworkContinuity(fixture({ otherOperationalCount: 3 })),
], [0, 25, 50, 75, 100], "calculateNetworkContinuity retains exact quarter values");

// Finalization and deterministic replay over 4 worlds and 3 paths.
const paths: readonly (readonly MissionActionSelection[])[] = [
  [
    { actionId: "a1_preserve_reserve" }, { actionId: "a2_field_radio", targetCorridorId: target },
    { actionId: "b1_pulse_network" }, { actionId: "b2_continue_crosscheck", targetCorridorId: target },
    { actionId: "c1_preserve_mobile_reserve" }, { actionId: "c2_balanced" },
    { actionId: "d1_hold_confirm", targetCorridorId: target }, { actionId: "d2_continuity_first_finish" },
  ],
  [
    { actionId: "a1_network_baseline" }, { actionId: "a2_focused_pnt", targetCorridorId: target },
    { actionId: "b1_split_attention" }, { actionId: "b2_reroute", targetCorridorId: target },
    { actionId: "c1_fallback_nav", targetCorridorId: target }, { actionId: "c2_isr_heavy" },
    { actionId: "d1_deception_routing", targetCorridorId: target }, { actionId: "d2_resilient_handoff" },
  ],
  [
    { actionId: "a1_rotating_watch" }, { actionId: "a2_ground_liaison", targetCorridorId: target },
    { actionId: "b1_priority_cargo" }, { actionId: "b2_staged_checkpoints", targetCorridorId: target },
    { actionId: "c1_ground_recon", targetCorridorId: target }, { actionId: "c2_mobility_heavy" },
    { actionId: "d1_escorted_continuation", targetCorridorId: target }, { actionId: "d2_network_balanced_finish" },
  ],
];
const replayWorlds = [
  worldId("cautious_denial", "corridor_alpha_east"),
  worldId("deceptive_diversion", "corridor_beta_south"),
  worldId("opportunistic_interdiction", "corridor_gamma_northwest"),
  worldId("pressure_escalator", "corridor_delta_west"),
] as const;
for (const id of replayWorlds) {
  for (let pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
    const first = runSelections(createInitialMissionState(id, 100 + pathIndex), paths[pathIndex]!);
    const second = runSelections(createInitialMissionState(id, 100 + pathIndex), paths[pathIndex]!);
    equal(second, first, `${id} path ${pathIndex + 1} deterministic replay`);
    equal(first.worldClockMinutes, 360, `${id} path ${pathIndex + 1} final horizon`);
    equal(first.trueWorldState.worldClockTick, 8, `${id} path ${pathIndex + 1} eight structural ticks`);
    check(first.completed && first.missionEvents.some(({ eventKind }) => eventKind === "mission_end_state_resolved"), `${id} path ${pathIndex + 1} finalized with end state event`);
    check(first.missionEvents.every(({ causeEventId }) => Boolean(causeEventId)), `${id} path ${pathIndex + 1} event causality`);
  }
}
equal(finalizeMission(finalPendingResult.state), finalPendingResult.state, "finalization is idempotent after completion");

// Frozen architectural boundaries.
const missionDirectory = fileURLToPath(new URL("../src/ui/components/scenario/scenario-five/model/mission/", import.meta.url));
const activeMissionSource = readdirSync(missionDirectory).filter((name) => name.endsWith(".ts"))
  .map((file) => readFileSync(`${missionDirectory}/${file}`, "utf8")).join("\n");
for (const retiredId of [
  "priority_delivered_network_failure",
  "delayed_delivery_persistent_disruption",
  "resilient_delivery_unresolved_attribution",
  "resilient_delivery_threat_contained",
]) check(!activeMissionSource.includes(retiredId), `active mission source excludes retired end-state ID ${retiredId}`);
const resolverSource = readFileSync(`${missionDirectory}/endStateResolver.ts`, "utf8");
check(resolverSource.includes("alphaDelivered && networkContinuityPercent < 100")
  && (resolverSource.match(/networkContinuityPercent === 100/g) ?? []).length === 3,
"resolver uses exact degradation and full-continuity thresholds");
for (const file of readdirSync(missionDirectory).filter((name) => name.endsWith(".ts"))) {
  const source = readFileSync(`${missionDirectory}/${file}`, "utf8");
  check(!/from\s+["']react(?:\/[^"']*)?["']|import\s+["']react(?:\/[^"']*)?["']/i.test(source), `${file} has no React import`);
  check(!/ScenarioTwo/.test(source), `${file} has no Scenario 2 import`);
  check(!/cognitive/i.test(source), `${file} has no Cognitive V3 import`);
  check(!/Math\.random/.test(source), `${file} has no Math.random`);
}

console.log(`Scenario 5 Phase-4 mission verification passed (${assertions} assertions).`);
