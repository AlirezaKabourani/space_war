import type { CorridorId } from "../model/index";
import { getMissionAction } from "../model/mission/index";
import type { MissionActionId } from "../model/mission/index";
import { getRuntimeAvailableActionIds } from "../model/runtime/index";
import type { Scenario5RuntimeState } from "../model/runtime/index";
import { activeCorridorIds, BALANCED_CONTINUATION_POLICY } from "./missionPolicies";
import { simulateScenario5 } from "./simulationDriver";
import type { CalibrationPolicy, CounterfactualResult } from "./types";
import { round } from "./auditMetrics";

export function counterfactualStateKey(state: Scenario5RuntimeState): string {
  return JSON.stringify({
    stage: state.stage.stageId,
    worldClockMinutes: state.missionState.worldClockMinutes,
    currentRound: state.missionState.currentRound,
    completed: state.missionState.completed,
    resources: state.missionState.resources,
    convoys: state.missionState.convoys,
    visibleEvidence: state.missionState.visibleEvidence,
    pendingEvidenceRequests: state.missionState.pendingEvidenceRequests,
    operationalAttributionStatus: state.missionState.operationalAttributionStatus,
    trueWorldState: state.missionState.trueWorldState,
    domainDecisionRecords: state.domainDecisionRecords,
  });
}
interface OutcomeVector {
  readonly alphaDelivered: number;
  readonly alphaIntegrity: number;
  readonly networkContinuity: number;
  readonly deliveredCount: number;
  readonly onTimeCount: number;
  readonly finalIsr: number;
  readonly finalSupport: number;
  readonly threatContained: number;
  readonly alphaDelay: number;
  readonly totalDelay: number;
  readonly compromisedCount: number;
  readonly disruptionCount: number;
}

const vector = (run: ReturnType<typeof simulateScenario5>): OutcomeVector => ({
  alphaDelivered: Number(run.result.domain.criticalDelivery.deliveredByMissionHorizon),
  alphaIntegrity: run.result.domain.criticalDelivery.integrity,
  networkContinuity: run.result.domain.logisticsResilience.networkContinuityPercent,
  deliveredCount: run.result.domain.logisticsResilience.deliveredConvoyCount,
  onTimeCount: run.result.domain.logisticsResilience.onTimeOperationalConvoyCount,
  finalIsr: run.state.missionState.resources.isrCapacity,
  finalSupport: run.state.missionState.resources.supportReserve,
  threatContained: Number(run.result.domain.logisticsResilience.threatContained),
  alphaDelay: run.result.domain.criticalDelivery.delayMinutes,
  totalDelay: run.result.domain.delayControl.totalFinalDelayMinutes,
  compromisedCount: run.result.domain.navigationIntegrity.compromisedConvoyCount,
  disruptionCount: run.result.domain.civilianImpactProxy.localizedDisruptionEventCount,
});

const dominates = (left: OutcomeVector, right: OutcomeVector): boolean => {
  const maximize = ["alphaDelivered", "alphaIntegrity", "networkContinuity", "deliveredCount", "onTimeCount", "finalIsr", "finalSupport", "threatContained"] as const;
  const minimize = ["alphaDelay", "totalDelay", "compromisedCount", "disruptionCount"] as const;
  const weak = maximize.every((key) => left[key] >= right[key]) && minimize.every((key) => left[key] <= right[key]);
  const strict = maximize.some((key) => left[key] > right[key]) || minimize.some((key) => left[key] < right[key]);
  return weak && strict;
};

export function runCounterfactualAudit(statesByWindow: ReadonlyMap<string, readonly Scenario5RuntimeState[]>): CounterfactualResult {
  const rows: Readonly<Record<string, string | number | boolean>>[] = [];
  let branchCount = 0;
  let universalDominanceFound = false;
  for (const [windowId, states] of statesByWindow) {
    const evaluated = new Map<MissionActionId, number>();
    const dominant = new Map<MissionActionId, number>();
    for (const state of states.slice(0, 256)) {
      const variants: { actionId: MissionActionId; targetCorridorId?: CorridorId; outcome: OutcomeVector }[] = [];
      for (const actionId of getRuntimeAvailableActionIds(state)) {
        evaluated.set(actionId, (evaluated.get(actionId) ?? 0) + 1);
        const targetKind = getMissionAction(actionId).target;
        const targetIds: readonly (CorridorId | undefined)[] = targetKind === "required" ? activeCorridorIds(state)
          : targetKind === "fixed_alpha" ? ["corridor_alpha_east"] : [undefined];
        for (const targetCorridorId of targetIds) {
          const run = simulateScenario5({
            policy: BALANCED_CONTINUATION_POLICY,
            worldId: state.missionState.trueWorldState.worldId,
            environmentSeed: state.missionState.trueWorldState.seed,
            policySeed: 0,
            initialState: state,
            forcedFirstChoice: { actionId, ...(targetCorridorId ? { targetCorridorId } : {}) },
          });
          branchCount += 1;
          variants.push({ actionId, ...(targetCorridorId ? { targetCorridorId } : {}), outcome: vector(run) });
        }
      }
      for (const actionId of new Set(variants.map((item) => item.actionId))) {
        const own = variants.filter((item) => item.actionId === actionId);
        const others = variants.filter((item) => item.actionId !== actionId);
        if (own.some((candidate) => others.every((other) => dominates(candidate.outcome, other.outcome)))) {
          dominant.set(actionId, (dominant.get(actionId) ?? 0) + 1);
        }
      }
    }
    for (const [actionId, evaluatedStateCount] of evaluated) {
      const dominanceCount = dominant.get(actionId) ?? 0;
      const dominanceShare = dominanceCount / evaluatedStateCount;
      const universal = evaluatedStateCount >= 20 && dominanceShare === 1;
      universalDominanceFound ||= universal;
      rows.push({ windowId, actionId, evaluatedStateCount, statesWhereSomeVariantParetoDominatesAllOtherFamilies: dominanceCount, dominanceShare: round(dominanceShare), universalDominance: universal });
    }
  }
  return { rows, branchCount, universalDominanceFound };
}

export const DOMINANCE_CONTINUATION_IDS = [
  "balanced_network", "information_heavy", "mobility_resilience", "low_response_reversible",
] as const;

type ContinuationId = typeof DOMINANCE_CONTINUATION_IDS[number];

interface CompleteOutcomeVector {
  readonly alphaDeliveredByHorizon: number;
  readonly alphaIntegrity: number;
  readonly networkContinuityPercent: number;
  readonly deliveredConvoyCount: number;
  readonly onTimeOperationalConvoyCount: number;
  readonly operationalAttributionResolved: number;
  readonly truePrimaryCorridorCorroborated: number;
  readonly finalISR: number;
  readonly finalSupport: number;
  readonly threatContained: number;
  readonly alphaDelayMinutes: number;
  readonly totalFinalDelayMinutes: number;
  readonly compromisedConvoyCount: number;
  readonly localizedDisruptionEventCount: number;
  readonly meanFinalPntExposure: number;
  readonly maxFinalPntExposure: number;
}

const completeVector = (run: ReturnType<typeof simulateScenario5>): CompleteOutcomeVector => ({
  alphaDeliveredByHorizon: Number(run.result.domain.criticalDelivery.deliveredByMissionHorizon),
  alphaIntegrity: run.result.domain.criticalDelivery.integrity,
  networkContinuityPercent: run.result.domain.logisticsResilience.networkContinuityPercent,
  deliveredConvoyCount: run.result.domain.logisticsResilience.deliveredConvoyCount,
  onTimeOperationalConvoyCount: run.result.domain.logisticsResilience.onTimeOperationalConvoyCount,
  operationalAttributionResolved: Number(run.result.domain.logisticsResilience.operationalAttributionStatus === "resolved"),
  truePrimaryCorridorCorroborated: Number(run.result.domain.gnssPntAssessment.truePrimaryCorridorCorroborated),
  finalISR: run.state.missionState.resources.isrCapacity,
  finalSupport: run.state.missionState.resources.supportReserve,
  threatContained: Number(run.result.domain.logisticsResilience.threatContained),
  alphaDelayMinutes: run.result.domain.criticalDelivery.delayMinutes,
  totalFinalDelayMinutes: run.result.domain.delayControl.totalFinalDelayMinutes,
  compromisedConvoyCount: run.result.domain.navigationIntegrity.compromisedConvoyCount,
  localizedDisruptionEventCount: run.result.domain.civilianImpactProxy.localizedDisruptionEventCount,
  meanFinalPntExposure: run.result.domain.navigationIntegrity.meanFinalPntExposure,
  maxFinalPntExposure: run.result.domain.navigationIntegrity.maxFinalPntExposure,
});

const completeDominates = (left: CompleteOutcomeVector, right: CompleteOutcomeVector): boolean => {
  const maximize = [
    "alphaDeliveredByHorizon", "alphaIntegrity", "networkContinuityPercent", "deliveredConvoyCount",
    "onTimeOperationalConvoyCount", "operationalAttributionResolved", "truePrimaryCorridorCorroborated",
    "finalISR", "finalSupport", "threatContained",
  ] as const;
  const minimize = [
    "alphaDelayMinutes", "totalFinalDelayMinutes", "compromisedConvoyCount",
    "localizedDisruptionEventCount", "meanFinalPntExposure", "maxFinalPntExposure",
  ] as const;
  const weak = maximize.every((key) => left[key] >= right[key]) && minimize.every((key) => left[key] <= right[key]);
  const strict = maximize.some((key) => left[key] > right[key]) || minimize.some((key) => left[key] < right[key]);
  return weak && strict;
};

export interface CounterfactualV2Result {
  readonly rows: readonly Readonly<Record<string, string | number | boolean>>[];
  readonly branchCount: number;
  readonly stateCoverage: readonly { readonly windowId: string; readonly uniqueStateCount: number; readonly pass: boolean }[];
  readonly universalDominanceActions: readonly string[];
  readonly outcomeVectorDimensions: Readonly<Record<"maximize" | "minimize", readonly string[]>>;
}

export function runCounterfactualAuditV2(
  statesByWindow: ReadonlyMap<string, readonly Scenario5RuntimeState[]>,
  policies: readonly CalibrationPolicy[],
): CounterfactualV2Result {
  const continuationPolicies = DOMINANCE_CONTINUATION_IDS.map((policyId) => {
    const policy = policies.find((candidate) => candidate.policyId === policyId);
    if (!policy) throw new Error(`Missing continuation policy ${policyId}`);
    return { continuationId: policyId, policy };
  });
  const interim: { windowId: string; actionId: MissionActionId; continuationId: ContinuationId; evaluatedStateCount: number; dominantStateCount: number; dominanceShare: number }[] = [];
  let branchCount = 0;
  const stateCoverage: { windowId: string; uniqueStateCount: number; pass: boolean }[] = [];

  for (const [windowId, allStates] of statesByWindow) {
    const states = allStates.slice(0, 256);
    stateCoverage.push({ windowId, uniqueStateCount: states.length, pass: states.length >= 64 });
    for (const { continuationId, policy } of continuationPolicies) {
      const evaluated = new Map<MissionActionId, number>();
      const dominant = new Map<MissionActionId, number>();
      for (const state of states) {
        const variants: { actionId: MissionActionId; outcome: CompleteOutcomeVector }[] = [];
        for (const actionId of getRuntimeAvailableActionIds(state)) {
          evaluated.set(actionId, (evaluated.get(actionId) ?? 0) + 1);
          const targetKind = getMissionAction(actionId).target;
          const targetIds: readonly (CorridorId | undefined)[] = targetKind === "required" ? activeCorridorIds(state)
            : targetKind === "fixed_alpha" ? ["corridor_alpha_east"] : [undefined];
          for (const targetCorridorId of targetIds) {
            const run = simulateScenario5({
              policy,
              worldId: state.missionState.trueWorldState.worldId,
              environmentSeed: state.missionState.trueWorldState.seed,
              policySeed: 0,
              initialState: state,
              forcedFirstChoice: { actionId, ...(targetCorridorId ? { targetCorridorId } : {}) },
            });
            branchCount += 1;
            variants.push({ actionId, outcome: completeVector(run) });
          }
        }
        for (const actionId of new Set(variants.map(({ actionId }) => actionId))) {
          const own = variants.filter((variant) => variant.actionId === actionId);
          const others = variants.filter((variant) => variant.actionId !== actionId);
          if (own.some((candidate) => others.every((other) => completeDominates(candidate.outcome, other.outcome)))) {
            dominant.set(actionId, (dominant.get(actionId) ?? 0) + 1);
          }
        }
      }
      for (const [actionId, evaluatedStateCount] of evaluated) {
        const dominantStateCount = dominant.get(actionId) ?? 0;
        interim.push({
          windowId,
          actionId,
          continuationId,
          evaluatedStateCount,
          dominantStateCount,
          dominanceShare: round(dominantStateCount / evaluatedStateCount),
        });
      }
    }
  }

  const universalKeys = new Set<string>();
  for (const item of interim) {
    const family = interim.filter(({ windowId, actionId }) => windowId === item.windowId && actionId === item.actionId);
    if (family.length === 4 && family.every(({ evaluatedStateCount, dominanceShare }) => evaluatedStateCount >= 64 && dominanceShare === 1)) {
      universalKeys.add(`${item.windowId}:${item.actionId}`);
    }
  }
  const rows = interim.map((item) => ({
    ...item,
    universalAcrossContinuations: universalKeys.has(`${item.windowId}:${item.actionId}`),
  }));
  return {
    rows,
    branchCount,
    stateCoverage,
    universalDominanceActions: [...universalKeys].sort(),
    outcomeVectorDimensions: {
      maximize: ["alphaDeliveredByHorizon", "alphaIntegrity", "networkContinuityPercent", "deliveredConvoyCount", "onTimeOperationalConvoyCount", "operationalAttributionResolved", "truePrimaryCorridorCorroborated", "finalISR", "finalSupport", "threatContained"],
      minimize: ["alphaDelayMinutes", "totalFinalDelayMinutes", "compromisedConvoyCount", "localizedDisruptionEventCount", "meanFinalPntExposure", "maxFinalPntExposure"],
    },
  };
}
