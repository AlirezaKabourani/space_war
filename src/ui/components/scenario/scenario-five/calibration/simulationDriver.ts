import type { CorridorId } from "../model/index";
import { calculatePlayerVisibleEvidenceSupport } from "../model/cognitive/index";
import type { ReasonId } from "../model/cognitive/index";
import { getMissionAction, BASE_ROUND_MINUTES } from "../model/mission/index";
import type { MissionActionId, MissionActionSelection } from "../model/mission/index";
import {
  buildScenario5CognitiveTelemetryBundle,
  calculateScenario5RuntimeResult,
  closeRuntimeEvidence,
  confirmRuntimeDecision,
  continueRuntimeAfterOutcome,
  createScenario5Runtime,
  getRuntimeAvailableActionIds,
  isBeliefStage,
  isDecisionStage,
  isReasonStage,
  openRuntimeEvidence,
  selectRuntimeAction,
  submitRuntimeBelief,
  submitRuntimeReason,
} from "../model/runtime/index";
import type { Scenario5RuntimeState } from "../model/runtime/index";
import { alignedReason } from "./cognitivePolicies";
import { createPolicyRng } from "./policyRng";
import {
  activeCorridorIds,
  defaultTargetForAction,
  firstActiveTarget,
  mostSupportedVisibleTarget,
  selectTarget,
} from "./missionPolicies";
import type { CalibrationPolicy, DecisionAuditTrace, SimulationOptions, SimulationRun } from "./types";

const latestAt = (state: Scenario5RuntimeState): number => state.runtimeEvents.at(-1)?.atMs ?? state.stage.enteredAtMs;
const after = (state: Scenario5RuntimeState, delta = 100): number => Math.max(state.stage.enteredAtMs, latestAt(state)) + delta;

const neutralReason: Readonly<Record<"B" | "C" | "D", ReasonId>> = {
  B: "reason_information_confidence",
  C: "reason_preserve_resources",
  D: "reason_preserve_reversibility",
};

const chooseReason = (state: Scenario5RuntimeState, policy: CalibrationPolicy): ReasonId => {
  const phaseId = state.pendingDecision?.phaseId;
  if (!phaseId || phaseId === "A") throw new Error("Reason selection requires a Phase B/C/D pending decision");
  if (policy.reasonBehavior === "neutral") return neutralReason[phaseId];
  const phaseActions = [...state.decisions.filter((decision) => decision.phaseId === phaseId).map((decision) => decision.finalSelectedActionId), state.pendingDecision?.selection.actionId]
    .filter((actionId): actionId is MissionActionId => actionId !== null && actionId !== undefined);
  return alignedReason(phaseActions, policy.reasonBehavior === "maximize_alignment");
};

const inspectEvidence = (state: Scenario5RuntimeState, policy: CalibrationPolicy, rng: ReturnType<typeof createPolicyRng>): Scenario5RuntimeState => {
  let current = state;
  for (const evidence of state.missionState.visibleEvidence) {
    const inspect = policy.evidenceBehavior === "all" || (policy.evidenceBehavior === "random_half" && rng.coinFlip());
    if (!inspect) continue;
    const openedAtMs = after(current, 100);
    current = openRuntimeEvidence(current, evidence.evidenceId, openedAtMs);
    current = closeRuntimeEvidence(current, evidence.evidenceId, openedAtMs + 200);
  }
  return current;
};

const submitBeliefForPolicy = (state: Scenario5RuntimeState, policy: CalibrationPolicy): Scenario5RuntimeState => {
  const visibleEvidenceIds = state.missionState.visibleEvidence.map(({ evidenceId }) => evidenceId);
  const support = calculatePlayerVisibleEvidenceSupport(state.evidence, visibleEvidenceIds);
  const estimate = policy.beliefBehavior === "evidence_responsive" ? Math.round(100 * support)
    : policy.beliefBehavior === "evidence_anti" ? Math.round(100 * (1 - support)) : 50;
  const corridor = policy.beliefBehavior === "neutral" ? firstActiveTarget(state) : mostSupportedVisibleTarget(state);
  return submitRuntimeBelief(state, {
    mostLikelyCorridorId: corridor,
    corridorConfidence: 50,
    targetedInterferenceEstimate: estimate,
    targetedInterferenceConfidence: policy.beliefBehavior === "neutral" ? 50 : 75,
    recordedAtMs: after(state),
  });
};

const resolveChoice = (
  state: Scenario5RuntimeState,
  policy: CalibrationPolicy,
  rng: ReturnType<typeof createPolicyRng>,
  forced: SimulationOptions["forcedFirstChoice"] | undefined,
): { requestedActionId: MissionActionId; actualActionId: MissionActionId; targetCorridorId: CorridorId | null; fallbackUsed: boolean } => {
  const availableActionIds = getRuntimeAvailableActionIds(state);
  if (availableActionIds.length === 0) throw new Error(`Zero available actions at ${state.stage.stageId}`);
  const roundId = state.missionState.currentRound;
  const requestedActionId = forced?.actionId
    ?? policy.requestedActionByRound?.[roundId]
    ?? policy.chooseAction?.({ state, availableActionIds, rng });
  if (!requestedActionId) throw new Error(`Policy ${policy.policyId} has no action for round ${roundId}`);
  const fallbackUsed = !availableActionIds.includes(requestedActionId);
  const actualActionId = fallbackUsed ? availableActionIds[0]! : requestedActionId;
  const action = getMissionAction(actualActionId);
  if (action.target === "none") return { requestedActionId, actualActionId, targetCorridorId: null, fallbackUsed };
  if (action.target === "fixed_alpha") return { requestedActionId, actualActionId, targetCorridorId: "corridor_alpha_east", fallbackUsed };
  if (forced?.targetCorridorId && activeCorridorIds(state).includes(forced.targetCorridorId)) {
    return { requestedActionId, actualActionId, targetCorridorId: forced.targetCorridorId, fallbackUsed };
  }
  if (fallbackUsed) return { requestedActionId, actualActionId, targetCorridorId: firstActiveTarget(state), fallbackUsed };
  if (policy.randomPolicy) {
    const targets = activeCorridorIds(state);
    return { requestedActionId, actualActionId, targetCorridorId: targets[rng.pickIndex(targets.length)]!, fallbackUsed };
  }
  const selector = policy.targetSelectorByRound?.[roundId];
  return { requestedActionId, actualActionId, targetCorridorId: selector ? selectTarget(selector, state) : defaultTargetForAction(actualActionId, state), fallbackUsed };
};

export function simulateScenario5(options: SimulationOptions): SimulationRun {
  const { policy, worldId, environmentSeed } = options;
  const policySeed = options.policySeed ?? 0;
  const rng = createPolicyRng(policySeed);
  let state = options.initialState ?? createScenario5Runtime({
    runId: `cal-${policy.policyId}-${worldId}-${environmentSeed}-${options.policySeed ?? "none"}`,
    worldId,
    seed: environmentSeed,
    startedAtMs: 0,
  });
  const decisionTrace: DecisionAuditTrace[] = [];
  let minimumAvailableActionCount = Number.POSITIVE_INFINITY;
  let singleOptionWindowCount = 0;
  let worldClockBeforeFinalization = 0;
  let forcedPending = options.forcedFirstChoice;

  while (state.stage.stageId !== "complete") {
    if (isDecisionStage(state.stage.stageId)) {
      options.onPreDecision?.(state);
      const availableActionIds = getRuntimeAvailableActionIds(state);
      minimumAvailableActionCount = Math.min(minimumAvailableActionCount, availableActionIds.length);
      singleOptionWindowCount += Number(availableActionIds.length === 1);
      const legalActiveTargetIds = activeCorridorIds(state);
      state = inspectEvidence(state, policy, rng);
      const choice = resolveChoice(state, policy, rng, forcedPending);
      forcedPending = undefined;
      const selectedAtMs = after(state);
      state = selectRuntimeAction(state, choice.actualActionId, selectedAtMs);
      const selection: MissionActionSelection = choice.targetCorridorId === null
        ? { actionId: choice.actualActionId }
        : { actionId: choice.actualActionId, targetCorridorId: choice.targetCorridorId };
      if (state.missionState.currentRound === 8) {
        worldClockBeforeFinalization = state.missionState.worldClockMinutes + BASE_ROUND_MINUTES + getMissionAction(choice.actualActionId).durationMinutes;
      }
      const windowId = state.stage.stageId.slice("decision:".length);
      decisionTrace.push({
        roundId: state.missionState.currentRound,
        windowId,
        ...choice,
        availableActionIds: [...availableActionIds],
        legalActiveTargetIds: [...legalActiveTargetIds],
      });
      state = confirmRuntimeDecision(state, selection, after(state), 0);
    } else if (isBeliefStage(state.stage.stageId)) {
      state = submitBeliefForPolicy(state, policy);
    } else if (isReasonStage(state.stage.stageId)) {
      state = submitRuntimeReason(state, chooseReason(state, policy), after(state));
    } else if (state.stage.stageId === "outcome_review") {
      state = continueRuntimeAfterOutcome(state, after(state));
    } else {
      throw new Error(`Unexpected calibration runtime stage: ${state.stage.stageId}`);
    }
  }

  const result = calculateScenario5RuntimeResult(state);
  const cognitiveBundle = buildScenario5CognitiveTelemetryBundle(state);
  const primary = state.missionState.trueWorldState.primaryAffectedCorridorId;
  const secondaryActorImpactDecisionCount = state.domainDecisionRecords.filter((record) =>
    Object.entries(record.actorDelayImpactByCorridor).some(([corridorId, delay]) => corridorId !== primary && delay > 0)).length;
  return {
    policyId: policy.policyId,
    oraclePolicy: policy.oraclePolicy,
    stressPolicy: policy.stressPolicy,
    worldId,
    environmentSeed,
    policySeed: options.policySeed ?? null,
    state,
    result,
    cognitiveBundle,
    decisionTrace,
    minimumAvailableActionCount: Number.isFinite(minimumAvailableActionCount) ? minimumAvailableActionCount : 0,
    singleOptionWindowCount,
    fallbackCount: decisionTrace.filter(({ fallbackUsed }) => fallbackUsed).length,
    worldClockBeforeFinalization,
    secondaryActorImpactDecisionCount,
  };
}
