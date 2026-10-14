import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { CorridorId, EvidenceInstance, WorldId } from "../src/ui/components/scenario/scenario-five/model/index.ts";
import {
  MISSION_ACTION_CATALOG,
  calculateNetworkContinuity,
  getMissionAction,
  isThreatContained,
  resolveMissionEndState,
} from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import type { MissionActionId, MissionActionSelection } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import {
  calculateScenario5CognitiveRunResult,
  validateScenario5CognitiveTelemetry,
} from "../src/ui/components/scenario/scenario-five/model/cognitive/index.ts";
import {
  RUNTIME_STAGE_SEQUENCE,
  S5_DOMAIN_METRICS_VERSION,
  S5_RUNTIME_MODEL_VERSION,
  S5_RUNTIME_VALIDITY_STATUS,
  adaptNewVisibleEvidence,
  buildScenario5CognitiveTelemetryBundle,
  calculateScenario5DomainMetrics,
  calculateScenario5RuntimeResult,
  closeRuntimeEvidence,
  confirmRuntimeDecision,
  continueRuntimeAfterOutcome,
  createScenario5Runtime,
  getRuntimeAvailableActionIds,
  openRuntimeEvidence,
  selectRuntimeAction,
  submitRuntimeBelief,
  submitRuntimeReason,
} from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import type {
  RuntimeStageId,
  Scenario5RuntimeState,
} from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";

let assertions = 0;
const check = (condition: unknown, message: string): void => { assert.ok(condition, message); assertions += 1; };
const equal = (actual: unknown, expected: unknown, message: string): void => { assert.deepEqual(actual, expected, message); assertions += 1; };
const close = (actual: number, expected: number, message: string, tolerance = 1e-9): void => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
  assertions += 1;
};
const rejects = (fn: () => unknown, pattern: RegExp, message: string): void => {
  assert.throws(fn, pattern, message);
  assertions += 1;
};

const CORRIDORS: readonly CorridorId[] = [
  "corridor_alpha_east", "corridor_beta_south", "corridor_gamma_northwest", "corridor_delta_west",
];
const REASONS = {
  B: "reason_information_confidence",
  C: "reason_preserve_resources",
  D: "reason_preserve_reversibility",
} as const;
const BELIEFS = [
  { mostLikelyCorridorId: "corridor_alpha_east", corridorConfidence: 55, targetedInterferenceEstimate: 69, targetedInterferenceConfidence: 100 },
  { mostLikelyCorridorId: "corridor_gamma_northwest", corridorConfidence: 60, targetedInterferenceEstimate: 70, targetedInterferenceConfidence: 59 },
  { mostLikelyCorridorId: "corridor_beta_south", corridorConfidence: 70, targetedInterferenceEstimate: 70, targetedInterferenceConfidence: 60 },
  { mostLikelyCorridorId: "corridor_delta_west", corridorConfidence: 80, targetedInterferenceEstimate: 80, targetedInterferenceConfidence: 70 },
] as const;

type PathId = 1 | 2 | 3;
const PATH_ACTIONS: Readonly<Record<PathId, readonly MissionActionId[]>> = {
  1: ["a1_network_baseline", "a2_broad_sweep", "b1_split_attention", "b2_staged_checkpoints", "c1_checkpoint_spacing", "c2_balanced", "d1_hold_confirm", "d2_network_balanced_finish"],
  2: ["a1_priority_focus", "a2_focused_pnt", "b1_priority_cargo", "b2_reroute", "c1_fallback_nav", "c2_priority_surge", "d1_escorted_continuation", "d2_critical_delivery_surge"],
  3: ["a1_preserve_reserve", "a2_field_radio", "b1_pulse_network", "b2_continue_crosscheck", "c1_preserve_mobile_reserve", "c2_mobility_heavy", "d1_deception_routing", "d2_resilient_handoff"],
};

const activeCorridors = (state: Scenario5RuntimeState): CorridorId[] => state.missionState.convoys
  .filter(({ status }) => status !== "delivered")
  .map(({ corridorId }) => corridorId);

const actionFor = (state: Scenario5RuntimeState, pathId: PathId, round: number): MissionActionId => {
  let actionId = PATH_ACTIONS[pathId][round - 1]!;
  const alphaActive = activeCorridors(state).includes("corridor_alpha_east");
  if (pathId === 2 && round === 6 && !alphaActive) actionId = "c2_mobility_heavy";
  if (pathId === 2 && round === 8 && !alphaActive) actionId = "d2_continuity_first_finish";
  if (pathId === 3 && round === 8 && !alphaActive) actionId = "d2_network_balanced_finish";
  return actionId;
};

const selectionFor = (state: Scenario5RuntimeState, pathId: PathId, round: number): MissionActionSelection => {
  const actionId = actionFor(state, pathId, round);
  if (getMissionAction(actionId).target !== "required") return { actionId };
  const active = activeCorridors(state);
  if (active.length === 0) throw new Error("Verifier path requires an active convoy target");
  let targetCorridorId = active[0]!;
  if (pathId === 1 && round === 4 && active.includes("corridor_gamma_northwest")) targetCorridorId = "corridor_gamma_northwest";
  if (pathId === 1 && round === 5 && active.includes("corridor_beta_south")) targetCorridorId = "corridor_beta_south";
  if (pathId === 1 && round === 7) {
    const primary = state.missionState.trueWorldState.primaryAffectedCorridorId;
    targetCorridorId = active.includes(primary) ? primary : active[0]!;
  }
  return { actionId, targetCorridorId };
};

interface ReplayResult {
  readonly state: Scenario5RuntimeState;
  readonly stages: readonly RuntimeStageId[];
  readonly reasonGateChecks: number;
}

const replay = (worldId: WorldId, seed: number, pathId: PathId, runId: string): ReplayResult => {
  let state = createScenario5Runtime({ runId, worldId, seed, startedAtMs: 1_000 });
  const stages: RuntimeStageId[] = [state.stage.stageId];
  let beliefIndex = 0;
  let reasonGateChecks = 0;
  while (state.stage.stageId !== "complete") {
    if (state.stage.stageId.startsWith("decision:")) {
      const round = state.missionState.currentRound;
      const selection = selectionFor(state, pathId, round);
      const entered = state.stage.enteredAtMs;
      state = selectRuntimeAction(state, selection.actionId, entered + 10);
      const visible = state.missionState.visibleEvidence;
      if (visible[0]) {
        state = openRuntimeEvidence(state, visible[0].evidenceId, entered + 20);
        state = closeRuntimeEvidence(state, visible[0].evidenceId, entered + 30);
        state = openRuntimeEvidence(state, visible[0].evidenceId, entered + 40);
      }
      if (visible[1]) state = openRuntimeEvidence(state, visible[1].evidenceId, entered + 45);
      const before = state.missionState;
      const eventCountBefore = state.runtimeEvents.length;
      state = confirmRuntimeDecision(state, selection, entered + 100, 10);
      stages.push(state.stage.stageId);
      if (state.stage.stageId.startsWith("reason:")) {
        equal(state.missionState, before, `${runId} reason gate leaves mission state unchanged at round ${round}`);
        equal(state.runtimeEvents.slice(eventCountBefore).some(({ eventKind }) => eventKind === "runtime_mission_step_committed"), false, `${runId} reason gate has no early commit at round ${round}`);
        check(state.pendingDecision !== null, `${runId} reason gate stores pending decision at round ${round}`);
        reasonGateChecks += 3;
      }
      continue;
    }
    if (state.stage.stageId.startsWith("reason:")) {
      const phase = state.stage.stageId.slice(-1) as keyof typeof REASONS;
      const entered = state.stage.enteredAtMs;
      const eventCount = state.runtimeEvents.length;
      rejects(() => submitRuntimeReason(state, "invalid_reason" as typeof REASONS[typeof phase], entered + 1), /Invalid Phase-5 reason ID/, `phase ${phase} invalid reason ID rejects`);
      state = submitRuntimeReason(state, REASONS[phase], entered + 25);
      const newEvents = state.runtimeEvents.slice(eventCount);
      equal(newEvents[0]?.eventKind, "runtime_reason_recorded", `phase ${phase} reason event precedes commit`);
      equal(newEvents[1]?.eventKind, "runtime_mission_step_committed", `phase ${phase} commit follows reason`);
      check(state.reasons.at(-1)?.capturedBeforeOutcome === true, `phase ${phase} reason captured before outcome`);
      reasonGateChecks += 3;
      stages.push(state.stage.stageId);
      continue;
    }
    if (state.stage.stageId === "outcome_review") {
      const clock = state.missionState.worldClockMinutes;
      state = continueRuntimeAfterOutcome(state, state.stage.enteredAtMs + 50);
      equal(state.missionState.worldClockMinutes, clock, `${runId} outcome review does not advance mission clock`);
      stages.push(state.stage.stageId);
      continue;
    }
    if (state.stage.stageId.startsWith("belief:")) {
      const fixture = BELIEFS[beliefIndex++]!;
      const clock = state.missionState.worldClockMinutes;
      state = submitRuntimeBelief(state, { ...fixture, recordedAtMs: state.stage.enteredAtMs + 25 });
      equal(state.missionState.worldClockMinutes, clock, `${runId} belief checkpoint does not advance mission clock`);
      stages.push(state.stage.stageId);
      continue;
    }
    throw new Error(`Unexpected verifier stage ${state.stage.stageId}`);
  }
  return { state, stages, reasonGateChecks };
};

equal(S5_RUNTIME_MODEL_VERSION, "s5-runtime-v1.0.1", "runtime version exact");
equal(S5_DOMAIN_METRICS_VERSION, "s5-domain-metrics-v1.0.0", "domain metrics version exact");
equal(S5_RUNTIME_VALIDITY_STATUS, "experimental_runtime_pending_ui_and_human_validation", "runtime validity status exact");
rejects(() => createScenario5Runtime({ runId: " ", worldId: "W-corridor_alpha_east-cautious_denial", seed: 1, startedAtMs: 0 }), /runId/, "blank run ID rejects");
rejects(() => createScenario5Runtime({ runId: "x", worldId: "W-corridor_alpha_east-cautious_denial", seed: 1, startedAtMs: Number.NaN }), /startedAtMs/, "invalid start time rejects");

const initial = createScenario5Runtime({ runId: "initial", worldId: "W-corridor_alpha_east-cautious_denial", seed: 11, startedAtMs: 100 });
const withLatestRuntimeEventAt = (state: Scenario5RuntimeState, atMs: number): Scenario5RuntimeState => {
  const sequence = state.runtimeEvents.length + 1;
  return {
    ...state,
    runtimeEvents: [...state.runtimeEvents, {
      eventId: `RT-${state.runId}-${sequence}`,
      sequence,
      eventKind: "runtime_stage_entered",
      atMs,
      stageId: state.stage.stageId,
      payload: { verifierChronologyFixture: true },
    }],
  };
};
equal(initial.stage, { stageId: "decision:A1_baseline_monitoring", enteredAtMs: 100 }, "exact initial stage");
equal(initial.runtimeEvents.map(({ eventKind }) => eventKind), ["runtime_created", "runtime_stage_entered"], "creation event order exact");
equal(initial.runtimeEvents.map(({ eventId }) => eventId), ["RT-initial-1", "RT-initial-2"], "runtime event IDs exact");
equal(initial.runtimeEvents.map(({ sequence }) => sequence), [1, 2], "runtime event sequence starts at one");
equal(initial.decisions.length + initial.evidence.length + initial.beliefs.length + initial.reasons.length, 0, "initial cognitive arrays empty");

const roundOneCatalog = MISSION_ACTION_CATALOG.filter(({ roundId }) => roundId === 1).map(({ actionId }) => actionId);
equal(getRuntimeAvailableActionIds(initial), roundOneCatalog, "available actions retain exact catalog order");
const poor = { ...initial, missionState: { ...initial.missionState, resources: { isrCapacity: 0, supportReserve: 0 } } };
equal(getRuntimeAvailableActionIds(poor), ["a1_preserve_reserve"], "unaffordable actions removed");
const alphaDelivered = {
  ...initial,
  missionState: {
    ...initial.missionState,
    convoys: initial.missionState.convoys.map((convoy) => convoy.convoyId === "alpha" ? { ...convoy, status: "delivered" as const } : convoy),
  },
};
check(!getRuntimeAvailableActionIds(alphaDelivered).includes("a1_priority_focus"), "fixed-alpha action removed after alpha delivery");
const compromisedRoundTwo = {
  ...initial,
  missionState: {
    ...initial.missionState,
    currentRound: 2 as const,
    convoys: initial.missionState.convoys.map((convoy, index) => ({ ...convoy, status: index === 2 ? "compromised" as const : "delivered" as const })),
  },
};
check(getRuntimeAvailableActionIds(compromisedRoundTwo).includes("a2_focused_pnt"), "required-target action retained with active convoy");
const compromisedSelection = { ...compromisedRoundTwo, stage: { stageId: "decision:A2_evidence_acquisition" as const, enteredAtMs: 100 } };
let compromisedChosen = selectRuntimeAction(compromisedSelection, "a2_focused_pnt", 110);
compromisedChosen = confirmRuntimeDecision(compromisedChosen, { actionId: "a2_focused_pnt", targetCorridorId: "corridor_gamma_northwest" }, 200, 0);
equal(compromisedChosen.decisions.at(-1)?.finalSelectedActionId, "a2_focused_pnt", "compromised convoy remains a valid target");
equal(compromisedChosen.decisions.at(-1)?.revisionCount, 0, "target choice does not create a shared-cognitive revision");

let revision = selectRuntimeAction(initial, "a1_network_baseline", 110);
revision = selectRuntimeAction(revision, "a1_network_baseline", 111);
equal(revision.currentSelectionHistory.length, 1, "repeated selection creates no revision");
revision = selectRuntimeAction(revision, "a1_rotating_watch", 112);
revision = selectRuntimeAction(revision, "a1_network_baseline", 113);
equal(revision.currentSelectionHistory.map(({ actionId }) => actionId), ["a1_network_baseline", "a1_rotating_watch", "a1_network_baseline"], "selection history captures actual action changes");
rejects(() => confirmRuntimeDecision(revision, { actionId: "a1_rotating_watch" }, 200, 0), /last selected/, "confirmation must match final selected action");
const revisedConfirmed = confirmRuntimeDecision(revision, { actionId: "a1_network_baseline" }, 200, 25);
equal(revisedConfirmed.decisions[0]?.firstSelectedActionId, "a1_network_baseline", "first selection exact");
equal(revisedConfirmed.decisions[0]?.revisionCount, 2, "action changes increment revision count");
equal(revisedConfirmed.decisions[0]?.elapsedMs, 100, "elapsed time exact");
equal(revisedConfirmed.decisions[0]?.activeDecisionMs, 75, "active time excludes hidden-tab time");
equal(revisedConfirmed.decisions[0]?.hiddenTabMs, 25, "hidden-tab time exact");
rejects(() => confirmRuntimeDecision(selectRuntimeAction(initial, "a1_preserve_reserve", 110), { actionId: "a1_preserve_reserve" }, 200, 101), /hiddenTabMs/, "hidden-tab time above elapsed rejects");
rejects(() => selectRuntimeAction(initial, "a1_preserve_reserve", 99), /selectedAtMs/, "selection before entry rejects");
const selectionAt150 = selectRuntimeAction(initial, "a1_network_baseline", 150);
rejects(() => selectRuntimeAction(selectionAt150, "a1_rotating_watch", 149), /runtime chronology/, "changed selection cannot move runtime time backward");
rejects(() => selectRuntimeAction(selectionAt150, "a1_network_baseline", 149), /runtime chronology/, "repeated selection cannot bypass runtime chronology");
const equalTimeSelection = selectRuntimeAction(initial, "a1_network_baseline", 100);
equal(equalTimeSelection.runtimeEvents.at(-1)?.atMs, 100, "equal interaction timestamps remain legal");
const selectedAt160 = selectRuntimeAction(initial, "a1_network_baseline", 160);
const selectedAt160Snapshot = structuredClone(selectedAt160);
rejects(() => confirmRuntimeDecision(selectedAt160, { actionId: "a1_network_baseline" }, 150, 0), /confirmedAtMs/, "confirmation cannot precede last selection");
equal(selectedAt160, selectedAt160Snapshot, "failed early confirmation leaves original runtime state unchanged");
rejects(() => openRuntimeEvidence(initial, "missing", 110), /not currently visible/, "non-visible evidence rejects");
rejects(() => submitRuntimeReason(initial, "reason_information_confidence", 110), /reason stage/, "reason out of order rejects");
rejects(() => submitRuntimeBelief(initial, { ...BELIEFS[0], recordedAtMs: 110 }), /belief stage/, "belief out of order rejects");
rejects(() => continueRuntimeAfterOutcome(initial, 110), /outcome_review/, "outcome continuation out of order rejects");

let beliefStage = selectRuntimeAction(initial, "a1_preserve_reserve", 110);
beliefStage = confirmRuntimeDecision(beliefStage, { actionId: "a1_preserve_reserve" }, 200, 0);
beliefStage = continueRuntimeAfterOutcome(beliefStage, 250);
rejects(() => openRuntimeEvidence(beliefStage, "missing", 260), /decision stage/, "evidence viewing outside decision stage is not scored");
rejects(() => submitRuntimeBelief(beliefStage, { ...BELIEFS[0], corridorConfidence: 101, recordedAtMs: 260 }), /0\.\.100/, "belief range validation rejects");
rejects(() => submitRuntimeBelief(beliefStage, { ...BELIEFS[0], recordedAtMs: 249 }), /recordedAtMs/, "belief timestamp before stage rejects");
const afterBelief = submitRuntimeBelief(beliefStage, { ...BELIEFS[0], recordedAtMs: 260 });
equal(afterBelief.beliefs[0]?.visibleEvidenceIdsAtCheckpoint, beliefStage.missionState.visibleEvidence.map(({ evidenceId }) => evidenceId), "runtime supplies belief evidence snapshot");
rejects(() => submitRuntimeBelief({ ...afterBelief, stage: beliefStage.stage }, { ...BELIEFS[0], recordedAtMs: 270 }), /already submitted/, "duplicate belief checkpoint rejects");
const beliefLatest300 = withLatestRuntimeEventAt(beliefStage, 300);
rejects(() => submitRuntimeBelief(beliefLatest300, { ...BELIEFS[0], recordedAtMs: 299 }), /runtime chronology/, "belief cannot precede latest runtime event");

let reasonStage = createScenario5Runtime({ runId: "reason-chronology", worldId: "W-corridor_alpha_east-cautious_denial", seed: 17, startedAtMs: 100 });
reasonStage = selectRuntimeAction(reasonStage, "a1_preserve_reserve", 110);
reasonStage = confirmRuntimeDecision(reasonStage, { actionId: "a1_preserve_reserve" }, 200, 0);
reasonStage = continueRuntimeAfterOutcome(reasonStage, 250);
reasonStage = submitRuntimeBelief(reasonStage, { ...BELIEFS[0], recordedAtMs: 260 });
reasonStage = selectRuntimeAction(reasonStage, "a2_field_radio", 270);
reasonStage = confirmRuntimeDecision(reasonStage, { actionId: "a2_field_radio", targetCorridorId: "corridor_alpha_east" }, 350, 0);
reasonStage = continueRuntimeAfterOutcome(reasonStage, 400);
reasonStage = submitRuntimeBelief(reasonStage, { ...BELIEFS[1], recordedAtMs: 410 });
reasonStage = selectRuntimeAction(reasonStage, "b1_pulse_network", 420);
reasonStage = confirmRuntimeDecision(reasonStage, { actionId: "b1_pulse_network" }, 500, 0);
reasonStage = continueRuntimeAfterOutcome(reasonStage, 550);
reasonStage = selectRuntimeAction(reasonStage, "b2_continue_crosscheck", 560);
reasonStage = confirmRuntimeDecision(reasonStage, { actionId: "b2_continue_crosscheck", targetCorridorId: "corridor_alpha_east" }, 650, 0);
equal(reasonStage.stage.stageId, "reason:B", "reason chronology fixture reaches reason stage");
const reasonLatest660 = withLatestRuntimeEventAt(reasonStage, 660);
rejects(() => submitRuntimeReason(reasonLatest660, "reason_information_confidence", 655), /runtime chronology/, "reason cannot precede latest runtime event");

let outcomeChronology = selectRuntimeAction(initial, "a1_preserve_reserve", 110);
outcomeChronology = confirmRuntimeDecision(outcomeChronology, { actionId: "a1_preserve_reserve" }, 200, 0);
const outcomeLatest210 = withLatestRuntimeEventAt(outcomeChronology, 210);
rejects(() => continueRuntimeAfterOutcome(outcomeLatest210, 205), /runtime chronology/, "outcome continuation cannot precede latest runtime event");

const evidenceTemplate: EvidenceInstance = {
  evidenceId: "adapter-evidence",
  sourceType: "pnt_telemetry",
  requestKind: "broad_pnt_sweep",
  observedCorridorId: "corridor_alpha_east",
  direction: "supports_targeted",
  strengthBand: "moderate",
  latencyVariant: "nominal",
  qualityLabelVisible: "quality",
  limitationVisible: "limit",
  relevantHypothesisIds: [],
  hiddenProvenance: { worldId: "W-corridor_alpha_east-cautious_denial", relation: "primary" },
};
const expectedRelevantWindows = [
  ["A2_evidence_acquisition", "B1_monitoring_allocation", "B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  ["B1_monitoring_allocation", "B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  ["B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  ["C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  ["C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  ["D1_crisis_response", "D2_final_delivery_policy"],
  ["D2_final_delivery_policy"],
  [],
] as const;
for (let round = 1; round <= 8; round += 1) {
  const before = { ...initial.missionState, visibleEvidence: [] };
  const item = { ...evidenceTemplate, evidenceId: `adapter-${round}` };
  const after = { ...before, visibleEvidence: [item] };
  const adapted = adaptNewVisibleEvidence(before, after, round as 1|2|3|4|5|6|7|8, 1_000 + round)[0]!;
  equal(adapted.relevantWindowIds, expectedRelevantWindows[round - 1], `round ${round} relevant-window mapping exact`);
  equal(adapted.availableAtMs, 1_000 + round, `round ${round} evidence availability timestamp exact`);
  check(!Object.hasOwn(adapted, "hiddenProvenance") && !Object.hasOwn(adapted, "worldId"), `round ${round} adapter omits hidden provenance`);
}

const evidenceA = { ...evidenceTemplate, evidenceId: "chronology-evidence-a" };
const evidenceB = { ...evidenceTemplate, evidenceId: "chronology-evidence-b", sourceType: "field_report" as const };
const evidenceDecision: Scenario5RuntimeState = {
  ...initial,
  missionState: { ...initial.missionState, visibleEvidence: [evidenceA, evidenceB] },
};
let reversedEvidence = openRuntimeEvidence(evidenceDecision, evidenceA.evidenceId, 120);
reversedEvidence = openRuntimeEvidence(reversedEvidence, evidenceB.evidenceId, 140);
rejects(() => closeRuntimeEvidence(reversedEvidence, evidenceA.evidenceId, 130), /runtime chronology/, "evidence close cannot move runtime time backward");
let overlappingEvidence = openRuntimeEvidence(evidenceDecision, evidenceA.evidenceId, 120);
overlappingEvidence = openRuntimeEvidence(overlappingEvidence, evidenceB.evidenceId, 140);
overlappingEvidence = closeRuntimeEvidence(overlappingEvidence, evidenceA.evidenceId, 150);
overlappingEvidence = closeRuntimeEvidence(overlappingEvidence, evidenceB.evidenceId, 160);
equal(overlappingEvidence.evidenceOpens.map(({ activeDwellMs }) => activeDwellMs), [30, 20], "overlapping evidence dwell values exact");
check(overlappingEvidence.runtimeEvents.every((event, index, events) => index === 0 || event.atMs >= events[index - 1]!.atMs), "normal overlapping-evidence event times are nondecreasing");

const worlds: readonly WorldId[] = [
  "W-corridor_alpha_east-cautious_denial",
  "W-corridor_beta_south-deceptive_diversion",
  "W-corridor_gamma_northwest-opportunistic_interdiction",
  "W-corridor_delta_west-pressure_escalator",
];
const completedRuns: Scenario5RuntimeState[] = [];
for (let worldIndex = 0; worldIndex < worlds.length; worldIndex += 1) {
  for (const pathId of [1, 2, 3] as const) {
    const runId = `replay-w${worldIndex + 1}-p${pathId}`;
    const first = replay(worlds[worldIndex]!, 100 + worldIndex, pathId, runId);
    const duplicate = replay(worlds[worldIndex]!, 100 + worldIndex, pathId, runId);
    equal(first.state, duplicate.state, `${runId} full runtime deterministic replay`);
    equal(first.stages, RUNTIME_STAGE_SEQUENCE, `${runId} exact full stage sequence`);
    equal(first.state.domainDecisionRecords.length, 8, `${runId} exactly eight mission commits`);
    equal(first.state.decisions.length, 8, `${runId} exactly eight cognitive decisions`);
    equal(first.state.beliefs.map(({ checkpointId }) => checkpointId), ["A2_prebelief", "A2_postbelief", "C_belief_checkpoint", "D_final_belief"], `${runId} belief order exact`);
    equal(first.state.reasons.map(({ phaseId }) => phaseId), ["B", "C", "D"], `${runId} reason phases exact`);
    equal(first.reasonGateChecks, 18, `${runId} all reason-gate assertions exercised`);
    equal(first.state.runtimeEvents.map(({ sequence }) => sequence), first.state.runtimeEvents.map((_, index) => index + 1), `${runId} event sequence contiguous`);
    equal(first.state.runtimeEvents.map(({ eventId }) => eventId), first.state.runtimeEvents.map((_, index) => `RT-${runId}-${index + 1}`), `${runId} event IDs contiguous`);
    check(first.state.runtimeEvents.every((event, index, events) => index === 0 || event.atMs >= events[index - 1]!.atMs), `${runId} runtime event timestamps nondecreasing`);
    const bundle = buildScenario5CognitiveTelemetryBundle(first.state);
    validateScenario5CognitiveTelemetry(bundle);
    check(bundle.decisions.every((decision) => decision.availableActionIds.length > 0), `${runId} cognitive decisions carry filtered option sets`);
    check(bundle.decisions.every((decision, index) => decision.availableActionIds.includes(decision.finalSelectedActionId!)), `${runId} final actions belong to filtered sets`);
    check(bundle.decisions.every((decision) => decision.playerVisibleResourcesBefore && decision.playerVisibleResourcesAfter), `${runId} all resource snapshots present`);
    check(bundle.decisions.every(({ elapsedMs }) => elapsedMs === 100), `${runId} outcome-review time excluded from subsequent decision timing`);
    check(calculateScenario5CognitiveRunResult(bundle).constructs.resourceStewardship !== null, `${runId} resource stewardship available`);
    const forbidden = ["worldId", "seed", "trueWorldState", "actorInternalState", "missionState", "endState", "domainDecisionRecords"];
    const serializedBundle = JSON.stringify(bundle);
    check(forbidden.every((key) => !Object.hasOwn(bundle, key) && !serializedBundle.includes(`\"${key}\"`)), `${runId} cognitive bundle firewall`);
    for (const decision of bundle.decisions) {
      check(decision.openedEvidenceIds.every((id, index, ids) => ids.indexOf(id) === index), `${runId} ${decision.windowId} opened evidence IDs unique`);
      check(decision.openedEvidenceIds.every((id) => decision.availableEvidenceIds.includes(id)), `${runId} ${decision.windowId} newly released evidence excluded from same decision`);
      const historyTimes = decision.selectionHistory.map(({ selectedAtMs }) => selectedAtMs);
      check(decision.enteredAtMs !== null
        && decision.confirmedAtMs !== null
        && historyTimes.length > 0
        && decision.enteredAtMs <= historyTimes[0]!
        && historyTimes.every((time, index) => index === 0 || time >= historyTimes[index - 1]!)
        && historyTimes.at(-1)! <= decision.confirmedAtMs, `${runId} ${decision.windowId} decision telemetry chronology`);
    }
    for (const opened of bundle.evidenceOpens) {
      equal(opened.activeDwellMs, opened.closedAtMs! - opened.openedAtMs, `${runId} ${opened.evidenceId} dwell exact`);
      check(opened.closedAtMs !== null && opened.openedAtMs <= opened.closedAtMs, `${runId} ${opened.evidenceId} evidence telemetry chronology`);
      const openEvent = first.state.runtimeEvents.find((event) => event.eventKind === "runtime_evidence_opened"
        && event.payload.evidenceId === opened.evidenceId && event.atMs === opened.openedAtMs);
      const closeEvent = first.state.runtimeEvents.find((event) => event.eventKind === "runtime_evidence_closed"
        && event.payload.evidenceId === opened.evidenceId && event.atMs === opened.closedAtMs);
      check(openEvent !== undefined && closeEvent !== undefined && openEvent.sequence <= closeEvent.sequence,
        `${runId} ${opened.evidenceId} runtime open event precedes close event`);
    }
    check(bundle.evidenceOpens.some(({ activeDwellMs }) => activeDwellMs === 60), `${runId} auto-close dwell exact`);
    check(bundle.decisions.some((decision) => decision.openedEvidenceIds.length >= 2), `${runId} multiple simultaneous evidence opens supported`);
    const lateEvidence = bundle.evidence.filter(({ relevantWindowIds }) => relevantWindowIds.length === 0);
    check(lateEvidence.every(({ availableAtMs }) => availableAtMs <= first.state.completedAtMs!), `${runId} late evidence commit time bounded by completion`);
    const metrics = calculateScenario5DomainMetrics(first.state);
    const result = calculateScenario5RuntimeResult(first.state);
    equal(result.cognitive, calculateScenario5CognitiveRunResult(bundle), `${runId} cognitive result equals direct Phase-5 calculation`);
    equal(result.domain, metrics, `${runId} runtime domain result equals direct calculation`);
    equal(result.missionEndState, resolveMissionEndState(first.state.missionState), `${runId} end state parity`);
    equal(metrics.logisticsResilience.networkContinuityPercent, calculateNetworkContinuity(first.state.missionState), `${runId} continuity parity`);
    equal(metrics.logisticsResilience.threatContained, isThreatContained(first.state.missionState), `${runId} containment parity`);
    for (const corridorId of CORRIDORS) {
      const trace = metrics.delayControl.byCorridor[corridorId];
      equal(trace.finalDelayMinutes, trace.actorDelayAddedMinutes + trace.playerDelayAddedMinutes - trace.playerDelayRecoveredMinutes, `${runId} ${corridorId} delay identity`);
      const actorFromRecords = first.state.domainDecisionRecords.reduce((total, record) => total + record.actorDelayImpactByCorridor[corridorId], 0);
      equal(trace.actorDelayAddedMinutes, actorFromRecords, `${runId} ${corridorId} actor delay extraction`);
      const expectedPlayer = first.state.domainDecisionRecords.reduce((totals, record) => {
        const before = record.convoyStateBefore.find((convoy) => convoy.corridorId === corridorId)!;
        const after = record.convoyStateAfter.find((convoy) => convoy.corridorId === corridorId)!;
        const net = after.delayMinutes - before.delayMinutes - record.actorDelayImpactByCorridor[corridorId];
        return { added: totals.added + Math.max(0, net), recovered: totals.recovered + Math.max(0, -net) };
      }, { added: 0, recovered: 0 });
      equal([trace.playerDelayAddedMinutes, trace.playerDelayRecoveredMinutes], [expectedPlayer.added, expectedPlayer.recovered], `${runId} ${corridorId} player net-delay decomposition`);
    }
    for (const record of first.state.domainDecisionRecords) {
      const actorEvent = first.state.missionState.missionEvents.find(({ roundId, eventKind }) => roundId === record.roundId && eventKind === "mission_actor_impact_applied")!;
      const impacts = actorEvent.payload.impacts as Record<string, { delayMinutes: number }>;
      for (const corridorId of CORRIDORS) {
        equal(record.actorDelayImpactByCorridor[corridorId], impacts[corridorId]?.delayMinutes ?? 0, `${runId} r${record.roundId} ${corridorId} actor event extraction exact`);
      }
    }
    const finalConvoys = first.state.missionState.convoys;
    const finalExposure = finalConvoys.map(({ pntExposure }) => pntExposure);
    close(metrics.navigationIntegrity.meanFinalPntExposure, finalExposure.reduce((a, b) => a + b, 0) / 4, `${runId} mean PNT exposure`);
    equal(metrics.navigationIntegrity.maxFinalPntExposure, Math.max(...finalExposure), `${runId} max PNT exposure`);
    equal(metrics.navigationIntegrity.fallbackCorridorIds, finalConvoys.filter(({ fallbackNav }) => fallbackNav).map(({ corridorId }) => corridorId), `${runId} fallback corridor list exact`);
    equal(metrics.navigationIntegrity.routeHardenedCorridorIds, finalConvoys.filter(({ routeHardened }) => routeHardened).map(({ corridorId }) => corridorId), `${runId} route-hardened corridor list exact`);
    equal(metrics.navigationIntegrity.groundSupportCorridorIds, finalConvoys.filter(({ groundSupport }) => groundSupport).map(({ corridorId }) => corridorId), `${runId} ground-support corridor list exact`);
    const alpha = finalConvoys.find(({ convoyId }) => convoyId === "alpha")!;
    equal(metrics.criticalDelivery.projectedArrivalMinute, alpha.baselineArrivalMinute + alpha.delayMinutes, `${runId} alpha projected arrival`);
    equal(metrics.criticalDelivery.onTimeOperational, alpha.integrity >= 60 && alpha.baselineArrivalMinute + alpha.delayMinutes <= alpha.deadlineMinute, `${runId} alpha on-time operational rule`);
    const allSpent = first.state.domainDecisionRecords.reduce((total, record) => total
      + record.resourcesBefore.isrCapacity - record.resourcesAfter.isrCapacity
      + record.resourcesBefore.supportReserve - record.resourcesAfter.supportReserve, 0);
    equal(metrics.criticalDelivery.totalResourceSpentUnits, allSpent, `${runId} total resource spending exact`);
    if (allSpent > 0) close(metrics.criticalDelivery.alphaTargetedResourceSharePercent!, 100 * metrics.criticalDelivery.alphaTargetedResourceUnits / allSpent, `${runId} alpha resource share`);
    equal(metrics.logisticsResilience.deliveredConvoyCount, finalConvoys.filter(({ status }) => status === "delivered").length, `${runId} delivered count`);
    equal(metrics.logisticsResilience.secondaryDeliveredConvoyCount, finalConvoys.filter(({ convoyId, status }) => convoyId !== "alpha" && status === "delivered").length, `${runId} secondary delivered count`);
    equal(metrics.civilianImpactProxy.localizedDisruptionEventCount, metrics.civilianImpactProxy.routeDiversionCount + metrics.civilianImpactProxy.checkpointOperationCount + metrics.civilianImpactProxy.groundResponseCount + metrics.civilianImpactProxy.holdOperationCount, `${runId} civilian proxy transparent sum`);
    equal(metrics.civilianImpactProxy.routeDiversionCount, first.state.decisions.filter(({ finalSelectedActionId }) => ["b2_reroute", "d1_emergency_reroute", "d1_deception_routing"].includes(finalSelectedActionId!)).length, `${runId} route-diversion action count exact`);
    equal(metrics.civilianImpactProxy.checkpointOperationCount, first.state.decisions.filter(({ finalSelectedActionId }) => ["b2_staged_checkpoints", "c1_checkpoint_spacing"].includes(finalSelectedActionId!)).length, `${runId} checkpoint action count exact`);
    equal(metrics.civilianImpactProxy.groundResponseCount, first.state.decisions.filter(({ finalSelectedActionId }) => ["c1_ground_recon", "d1_ground_containment"].includes(finalSelectedActionId!)).length, `${runId} ground-response action count exact`);
    equal(metrics.civilianImpactProxy.holdOperationCount, first.state.decisions.filter(({ finalSelectedActionId }) => ["b2_hold_verify", "d1_hold_confirm"].includes(finalSelectedActionId!)).length, `${runId} hold action count exact`);
    equal(metrics.civilianImpactProxy.medicalDeliveryDelayMinutes, alpha.delayMinutes, `${runId} medical delay exact`);
    check(!Object.hasOwn(metrics.civilianImpactProxy, "weightedCivilianScore"), `${runId} no weighted civilian score`);
    const secondary = finalConvoys.filter(({ convoyId }) => convoyId !== "alpha");
    equal(metrics.networkLogisticsBalance.secondaryMinimumIntegrity, Math.min(...secondary.map(({ integrity }) => integrity)), `${runId} secondary minimum integrity`);
    close(metrics.networkLogisticsBalance.secondaryMeanIntegrity, secondary.reduce((total, convoy) => total + convoy.integrity, 0) / 3, `${runId} secondary mean integrity`);
    const delays = finalConvoys.map(({ delayMinutes }) => delayMinutes);
    const meanDelay = delays.reduce((a, b) => a + b, 0) / 4;
    close(metrics.networkLogisticsBalance.delayPopulationSd, Math.sqrt(delays.reduce((total, delay) => total + (delay - meanDelay) ** 2, 0) / 4), `${runId} delay population SD`);
    const targetCounts = Object.values(metrics.networkLogisticsBalance.targetedDecisionCountByCorridor);
    equal(metrics.networkLogisticsBalance.targetedDecisionCount, targetCounts.reduce((a, b) => a + b, 0), `${runId} targeted decision counts sum`);
    if (metrics.networkLogisticsBalance.targetedDecisionCount > 0) {
      const count = metrics.networkLogisticsBalance.targetedDecisionCount;
      close(metrics.networkLogisticsBalance.targetedAttentionHhi!, targetCounts.reduce((total, value) => total + (value / count) ** 2, 0), `${runId} targeted HHI exact`);
    }
    completedRuns.push(first.state);
  }
}

const representative = completedRuns.find(({ runId }) => runId === "replay-w2-p1")!;
const domain = calculateScenario5DomainMetrics(representative);
equal(domain.gnssPntAssessment.checkpoints.map(({ targetedRecognition }) => targetedRecognition), [false, false, true, true], "70/60 targeted-recognition threshold exact");
equal(domain.gnssPntAssessment.firstTargetedRecognitionCheckpoint, "C_belief_checkpoint", "first targeted recognition exact");
equal(domain.gnssPntAssessment.checkpoints.map(({ corridorCorrect }) => corridorCorrect), [false, false, true, false], "belief corridor truth comparison exact");
equal(domain.gnssPntAssessment.firstCorrectCorridorCheckpoint, "C_belief_checkpoint", "first correct checkpoint exact");
equal(domain.gnssPntAssessment.finalTargetedInterferenceEstimate, 80, "final interference estimate exact");
equal(domain.gnssPntAssessment.finalTargetedInterferenceConfidence, 70, "final interference confidence exact");

const corroborationEvidence: EvidenceInstance[] = [
  { ...evidenceTemplate, evidenceId: "corr-delta-1", sourceType: "pnt_telemetry", observedCorridorId: "corridor_delta_west", strengthBand: "weak" },
  { ...evidenceTemplate, evidenceId: "corr-delta-2", sourceType: "field_report", observedCorridorId: "corridor_delta_west", strengthBand: "moderate" },
  { ...evidenceTemplate, evidenceId: "corr-alpha-1", sourceType: "pnt_telemetry", observedCorridorId: "corridor_alpha_east", strengthBand: "strong" },
];
const corroborationState = { ...representative, missionState: { ...representative.missionState, visibleEvidence: corroborationEvidence } };
equal(calculateScenario5DomainMetrics(corroborationState).gnssPntAssessment.corroboratedCorridorIds, ["corridor_delta_west"], "corroboration requires two source types and substantive strength");

const noTargetState: Scenario5RuntimeState = {
  ...representative,
  domainDecisionRecords: representative.domainDecisionRecords.map((record) => ({ ...record, effectiveTargetCorridorId: null })),
};
equal(calculateScenario5DomainMetrics(noTargetState).networkLogisticsBalance.targetedAttentionHhi, null, "no-target HHI is null");

const hiddenChanged: Scenario5RuntimeState = {
  ...representative,
  missionState: {
    ...representative.missionState,
    trueWorldState: {
      ...representative.missionState.trueWorldState,
      primaryAffectedCorridorId: "corridor_alpha_east",
    },
  },
};
equal(calculateScenario5CognitiveRunResult(buildScenario5CognitiveTelemetryBundle(hiddenChanged)), calculateScenario5CognitiveRunResult(buildScenario5CognitiveTelemetryBundle(representative)), "hidden truth change cannot alter cognitive result");
check(JSON.stringify(calculateScenario5DomainMetrics(hiddenChanged).gnssPntAssessment) !== JSON.stringify(calculateScenario5DomainMetrics(representative).gnssPntAssessment), "hidden truth change can alter domain evaluation");
check(!Object.hasOwn(calculateScenario5RuntimeResult(representative).cognitive, "domain"), "domain metrics remain outside cognitive result");

const d2Recovery = completedRuns.flatMap((state) => {
  const record = state.domainDecisionRecords[7]!;
  return CORRIDORS.map((corridorId) => {
    const before = record.convoyStateBefore.find((convoy) => convoy.corridorId === corridorId)!;
    const after = record.convoyStateAfter.find((convoy) => convoy.corridorId === corridorId)!;
    return after.delayMinutes - before.delayMinutes - record.actorDelayImpactByCorridor[corridorId];
  });
});
check(d2Recovery.some((delta) => delta < 0), "D2 actual delay recovery represented after clamping");

rejects(() => calculateScenario5DomainMetrics(initial), /complete runtime/, "domain metrics reject incomplete runtime");
rejects(() => calculateScenario5RuntimeResult(initial), /complete runtime/, "runtime result rejects incomplete runtime");
const missingRecord = { ...representative, domainDecisionRecords: representative.domainDecisionRecords.slice(0, 7) };
rejects(() => calculateScenario5DomainMetrics(missingRecord), /exactly 8/, "domain metrics reject incomplete trace");

const modelDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "ui", "components", "scenario", "scenario-five", "model");
const runtimeDirectory = join(modelDirectory, "runtime");
for (const file of readdirSync(runtimeDirectory).filter((name) => name.endsWith(".ts"))) {
  const source = readFileSync(join(runtimeDirectory, file), "utf8");
  check(!/from\s+["']react["']/.test(source), `${file} has no React import`);
  check(!/eventLogger/.test(source), `${file} has no eventLogger import`);
  check(!/Math\.random/.test(source), `${file} has no Math.random`);
}

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return entry.name === "runtime" ? [] : sourceFiles(path);
  return entry.name.endsWith(".ts") ? [path] : [];
});
const frozenHash = createHash("sha256");
for (const file of sourceFiles(modelDirectory).sort()) {
  frozenHash.update(relative(process.cwd(), file).replaceAll("\\", "/"));
  frozenHash.update("\0");
  frozenHash.update(readFileSync(file));
}
equal(frozenHash.digest("hex"), "e4baaeb09a44c106b3138882f2d2e81c3a36d9ff20ecd0b362ec2c866a2ae42b", "Phase-3/4/5 source hash unchanged");

console.log(`Scenario 5 Phase-6 runtime verification passed (${assertions} assertions).`);
