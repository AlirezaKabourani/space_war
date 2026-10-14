import { CANONICAL_CORRIDORS } from "../index";
import type { CorridorId } from "../index";
import {
  S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
  calculateScenario5CognitiveRunResult,
  validateScenario5CognitiveTelemetry,
} from "../cognitive/index";
import type { BeliefCheckpointId } from "../cognitive/index";
import {
  calculateNetworkContinuity,
  isThreatContained,
  resolveMissionEndState,
} from "../mission/index";
import { buildScenario5CognitiveTelemetryBundle } from "./telemetryAdapter";
import type {
  GnssPntCheckpointAssessment,
  Scenario5DomainMetrics,
  Scenario5RuntimeResult,
  Scenario5RuntimeState,
} from "./types";
import { S5_DOMAIN_METRICS_VERSION, S5_RUNTIME_MODEL_VERSION } from "./versions";

const CORRIDOR_IDS = CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId);
const CHECKPOINT_ORDER: readonly BeliefCheckpointId[] = [
  "A2_prebelief", "A2_postbelief", "C_belief_checkpoint", "D_final_belief",
];
const SECONDARY_IDS: readonly CorridorId[] = [
  "corridor_beta_south", "corridor_gamma_northwest", "corridor_delta_west",
];

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);
const mean = (values: readonly number[]): number => sum(values) / values.length;

const convoyFor = (state: Scenario5RuntimeState, corridorId: CorridorId) => {
  const convoy = state.missionState.convoys.find((candidate) => candidate.corridorId === corridorId);
  if (!convoy) throw new Error(`Missing final convoy for ${corridorId}`);
  return convoy;
};

const corroboratedCorridors = (state: Scenario5RuntimeState): readonly CorridorId[] =>
  CORRIDOR_IDS.filter((corridorId) => {
    const supporting = state.missionState.visibleEvidence.filter(
      (item) => item.observedCorridorId === corridorId && item.direction === "supports_targeted",
    );
    return new Set(supporting.map(({ sourceType }) => sourceType)).size >= 2
      && supporting.some(({ strengthBand }) => strengthBand === "moderate" || strengthBand === "strong");
  });

const gnssPntAssessment = (state: Scenario5RuntimeState): Scenario5DomainMetrics["gnssPntAssessment"] => {
  const trueCorridor = state.missionState.trueWorldState.primaryAffectedCorridorId;
  const beliefById = new Map(state.beliefs.map((belief) => [belief.checkpointId, belief]));
  const checkpoints: GnssPntCheckpointAssessment[] = CHECKPOINT_ORDER.flatMap((checkpointId) => {
    const belief = beliefById.get(checkpointId);
    if (!belief) return [];
    return [{
      checkpointId,
      selectedCorridorId: belief.mostLikelyCorridorId,
      corridorCorrect: belief.mostLikelyCorridorId === trueCorridor,
      corridorConfidence: belief.corridorConfidence,
      targetedInterferenceEstimate: belief.targetedInterferenceEstimate,
      targetedInterferenceConfidence: belief.targetedInterferenceConfidence,
      targetedRecognition: belief.targetedInterferenceEstimate >= 70
        && belief.targetedInterferenceConfidence >= 60,
    }];
  });
  const correctCount = checkpoints.filter(({ corridorCorrect }) => corridorCorrect).length;
  const final = checkpoints.at(-1);
  const corroboratedCorridorIds = corroboratedCorridors(state);
  return {
    checkpoints,
    recordedCheckpointCount: checkpoints.length,
    correctCorridorCheckpointRatePercent: checkpoints.length === 0 ? null : 100 * correctCount / checkpoints.length,
    firstCorrectCorridorCheckpoint: checkpoints.find(({ corridorCorrect }) => corridorCorrect)?.checkpointId ?? null,
    finalCorridorCorrect: final?.corridorCorrect ?? null,
    firstTargetedRecognitionCheckpoint: checkpoints.find(({ targetedRecognition }) => targetedRecognition)?.checkpointId ?? null,
    finalTargetedInterferenceEstimate: final?.targetedInterferenceEstimate ?? null,
    finalTargetedInterferenceConfidence: final?.targetedInterferenceConfidence ?? null,
    corroboratedCorridorIds,
    truePrimaryCorridorCorroborated: corroboratedCorridorIds.includes(trueCorridor),
  };
};

const navigationIntegrity = (state: Scenario5RuntimeState): Scenario5DomainMetrics["navigationIntegrity"] => {
  const exposureEntries = CORRIDOR_IDS.map((corridorId) => [corridorId, convoyFor(state, corridorId).pntExposure] as const);
  const exposures = exposureEntries.map(([, value]) => value);
  return {
    finalPntExposureByCorridor: Object.fromEntries(exposureEntries) as Readonly<Record<CorridorId, number>>,
    meanFinalPntExposure: mean(exposures),
    maxFinalPntExposure: Math.max(...exposures),
    fallbackCorridorIds: CORRIDOR_IDS.filter((corridorId) => convoyFor(state, corridorId).fallbackNav),
    routeHardenedCorridorIds: CORRIDOR_IDS.filter((corridorId) => convoyFor(state, corridorId).routeHardened),
    groundSupportCorridorIds: CORRIDOR_IDS.filter((corridorId) => convoyFor(state, corridorId).groundSupport),
    compromisedConvoyCount: state.missionState.convoys.filter(({ status }) => status === "compromised").length,
  };
};

const criticalDelivery = (state: Scenario5RuntimeState): Scenario5DomainMetrics["criticalDelivery"] => {
  const alpha = convoyFor(state, "corridor_alpha_east");
  let totalResourceSpentUnits = 0;
  let alphaTargetedResourceUnits = 0;
  let alphaTargetedDecisionCount = 0;
  for (const record of state.domainDecisionRecords) {
    const isrSpent = record.resourcesBefore.isrCapacity - record.resourcesAfter.isrCapacity;
    const supportSpent = record.resourcesBefore.supportReserve - record.resourcesAfter.supportReserve;
    if (isrSpent < 0 || supportSpent < 0) throw new Error(`Negative resource spend in ${record.windowId}`);
    const spent = isrSpent + supportSpent;
    totalResourceSpentUnits += spent;
    if (record.effectiveTargetCorridorId === "corridor_alpha_east") {
      alphaTargetedResourceUnits += spent;
      alphaTargetedDecisionCount += 1;
    }
  }
  const projectedArrivalMinute = alpha.baselineArrivalMinute + alpha.delayMinutes;
  return {
    deliveredByMissionHorizon: alpha.status === "delivered",
    onTimeOperational: alpha.integrity >= 60 && projectedArrivalMinute <= alpha.deadlineMinute,
    integrity: alpha.integrity,
    delayMinutes: alpha.delayMinutes,
    projectedArrivalMinute,
    deadlineMinute: alpha.deadlineMinute,
    deliveredAtMinute: alpha.deliveredAtMinute,
    alphaTargetedResourceUnits,
    totalResourceSpentUnits,
    alphaTargetedResourceSharePercent: totalResourceSpentUnits === 0
      ? null
      : 100 * alphaTargetedResourceUnits / totalResourceSpentUnits,
    alphaTargetedDecisionCount,
  };
};

const logisticsResilience = (state: Scenario5RuntimeState): Scenario5DomainMetrics["logisticsResilience"] => {
  const end = resolveMissionEndState(state.missionState);
  const onTime = state.missionState.convoys.filter(
    (convoy) => convoy.integrity >= 60
      && convoy.baselineArrivalMinute + convoy.delayMinutes <= convoy.deadlineMinute,
  );
  return {
    networkContinuityPercent: calculateNetworkContinuity(state.missionState),
    deliveredConvoyCount: state.missionState.convoys.filter(({ status }) => status === "delivered").length,
    onTimeOperationalConvoyCount: onTime.length,
    secondaryDeliveredConvoyCount: state.missionState.convoys.filter(
      ({ corridorId, status }) => SECONDARY_IDS.includes(corridorId) && status === "delivered",
    ).length,
    fallbackCoverageCount: state.missionState.convoys.filter(({ fallbackNav }) => fallbackNav).length,
    routeHardeningCoverageCount: state.missionState.convoys.filter(({ routeHardened }) => routeHardened).length,
    groundSupportCoverageCount: state.missionState.convoys.filter(({ groundSupport }) => groundSupport).length,
    operationalAttributionStatus: state.missionState.operationalAttributionStatus,
    endStateId: end.endStateId,
    threatContained: isThreatContained(state.missionState),
  };
};

const delayControl = (state: Scenario5RuntimeState): Scenario5DomainMetrics["delayControl"] => {
  const entries = CORRIDOR_IDS.map((corridorId) => {
    let actorDelayAddedMinutes = 0;
    let playerDelayAddedMinutes = 0;
    let playerDelayRecoveredMinutes = 0;
    for (const record of state.domainDecisionRecords) {
      const before = record.convoyStateBefore.find((convoy) => convoy.corridorId === corridorId);
      const after = record.convoyStateAfter.find((convoy) => convoy.corridorId === corridorId);
      if (!before || !after) throw new Error(`Incomplete convoy trace for ${corridorId} in ${record.windowId}`);
      const actorDelta = record.actorDelayImpactByCorridor[corridorId];
      if (!Number.isFinite(actorDelta)) throw new Error(`Invalid actor delay trace for ${corridorId}`);
      const totalDelta = after.delayMinutes - before.delayMinutes;
      const playerNetDelta = totalDelta - actorDelta;
      actorDelayAddedMinutes += actorDelta;
      playerDelayAddedMinutes += Math.max(0, playerNetDelta);
      playerDelayRecoveredMinutes += Math.max(0, -playerNetDelta);
    }
    const finalDelayMinutes = convoyFor(state, corridorId).delayMinutes;
    if (finalDelayMinutes !== actorDelayAddedMinutes + playerDelayAddedMinutes - playerDelayRecoveredMinutes) {
      throw new Error(`Delay decomposition does not reconcile for ${corridorId}`);
    }
    return [corridorId, {
      finalDelayMinutes,
      actorDelayAddedMinutes,
      playerDelayAddedMinutes,
      playerDelayRecoveredMinutes,
    }] as const;
  });
  const byCorridor = Object.fromEntries(entries) as Scenario5DomainMetrics["delayControl"]["byCorridor"];
  const values = Object.values(byCorridor);
  return {
    byCorridor,
    totalFinalDelayMinutes: sum(values.map(({ finalDelayMinutes }) => finalDelayMinutes)),
    meanFinalDelayMinutes: mean(values.map(({ finalDelayMinutes }) => finalDelayMinutes)),
    totalActorDelayAddedMinutes: sum(values.map(({ actorDelayAddedMinutes }) => actorDelayAddedMinutes)),
    totalPlayerDelayAddedMinutes: sum(values.map(({ playerDelayAddedMinutes }) => playerDelayAddedMinutes)),
    totalPlayerDelayRecoveredMinutes: sum(values.map(({ playerDelayRecoveredMinutes }) => playerDelayRecoveredMinutes)),
  };
};

const countActions = (state: Scenario5RuntimeState, ids: ReadonlySet<string>): number =>
  state.domainDecisionRecords.filter(({ actionId }) => ids.has(actionId)).length;

const civilianImpactProxy = (state: Scenario5RuntimeState): Scenario5DomainMetrics["civilianImpactProxy"] => {
  const routeDiversionCount = countActions(state, new Set(["b2_reroute", "d1_emergency_reroute", "d1_deception_routing"]));
  const checkpointOperationCount = countActions(state, new Set(["b2_staged_checkpoints", "c1_checkpoint_spacing"]));
  const groundResponseCount = countActions(state, new Set(["c1_ground_recon", "d1_ground_containment"]));
  const holdOperationCount = countActions(state, new Set(["b2_hold_verify", "d1_hold_confirm"]));
  return {
    routeDiversionCount,
    checkpointOperationCount,
    groundResponseCount,
    holdOperationCount,
    localizedDisruptionEventCount: routeDiversionCount + checkpointOperationCount + groundResponseCount + holdOperationCount,
    medicalDeliveryDelayMinutes: convoyFor(state, "corridor_alpha_east").delayMinutes,
  };
};

const networkLogisticsBalance = (state: Scenario5RuntimeState): Scenario5DomainMetrics["networkLogisticsBalance"] => {
  const secondary = SECONDARY_IDS.map((corridorId) => convoyFor(state, corridorId));
  const delays = CORRIDOR_IDS.map((corridorId) => convoyFor(state, corridorId).delayMinutes);
  const meanDelay = mean(delays);
  const targetedDecisionCountByCorridor = Object.fromEntries(CORRIDOR_IDS.map((corridorId) => [
    corridorId,
    state.domainDecisionRecords.filter(({ effectiveTargetCorridorId }) => effectiveTargetCorridorId === corridorId).length,
  ])) as Readonly<Record<CorridorId, number>>;
  const targetedDecisionCount = sum(Object.values(targetedDecisionCountByCorridor));
  return {
    secondaryMinimumIntegrity: Math.min(...secondary.map(({ integrity }) => integrity)),
    secondaryMeanIntegrity: mean(secondary.map(({ integrity }) => integrity)),
    secondaryDeliveredCount: secondary.filter(({ status }) => status === "delivered").length,
    networkContinuityPercent: calculateNetworkContinuity(state.missionState),
    meanDelay,
    delayPopulationSd: Math.sqrt(mean(delays.map((delay) => (delay - meanDelay) ** 2))),
    targetedDecisionCount,
    targetedDecisionCountByCorridor,
    targetedAttentionHhi: targetedDecisionCount === 0
      ? null
      : sum(Object.values(targetedDecisionCountByCorridor).map((count) => (count / targetedDecisionCount) ** 2)),
  };
};

export function calculateScenario5DomainMetrics(state: Scenario5RuntimeState): Scenario5DomainMetrics {
  if (state.stage.stageId !== "complete") throw new Error("Domain metrics require a complete runtime");
  if (!state.missionState.completed) throw new Error("Domain metrics require a completed mission");
  if (state.domainDecisionRecords.length !== 8) throw new Error("Domain metrics require exactly 8 decision records");
  resolveMissionEndState(state.missionState);
  return {
    domainMetricsVersion: S5_DOMAIN_METRICS_VERSION,
    missionModelVersion: state.missionState.missionModelVersion,
    gnssPntAssessment: gnssPntAssessment(state),
    navigationIntegrity: navigationIntegrity(state),
    criticalDelivery: criticalDelivery(state),
    logisticsResilience: logisticsResilience(state),
    delayControl: delayControl(state),
    civilianImpactProxy: civilianImpactProxy(state),
    networkLogisticsBalance: networkLogisticsBalance(state),
  };
}

export function calculateScenario5RuntimeResult(state: Scenario5RuntimeState): Scenario5RuntimeResult {
  if (state.stage.stageId !== "complete") throw new Error("Runtime result requires a complete runtime");
  const bundle = buildScenario5CognitiveTelemetryBundle(state);
  validateScenario5CognitiveTelemetry(bundle);
  return {
    runId: state.runId,
    runtimeModelVersion: S5_RUNTIME_MODEL_VERSION,
    missionModelVersion: state.missionState.missionModelVersion,
    cognitiveMeasurementModelVersion: S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
    domainMetricsVersion: S5_DOMAIN_METRICS_VERSION,
    missionEndState: resolveMissionEndState(state.missionState),
    cognitive: calculateScenario5CognitiveRunResult(bundle),
    domain: calculateScenario5DomainMetrics(state),
  };
}
