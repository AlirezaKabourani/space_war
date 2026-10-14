import { CANONICAL_ACTOR_PROFILES, CANONICAL_CORRIDORS } from "../model/index";
import type { ActorProfileId, CorridorId, WorldId } from "../model/index";
import { MISSION_ACTION_CATALOG } from "../model/mission/index";
import type { MissionActionId, Scenario5EndStateId } from "../model/mission/index";
import type {
  ActorPairResult,
  CognitiveRunRow,
  DistributionSummary,
  MissionRunRow,
  SimulationRun,
} from "./types";
import { S5_CALIBRATION_VERSION } from "./versions";

const CANONICAL_CORRIDOR_IDS = CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId);

export const mean = (values: readonly number[]): number => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
export const round = (value: number, digits = 6): number => Number(value.toFixed(digits));
export const quantile = (values: readonly number[], probability: number): number => {
  if (values.length === 0) throw new Error("Quantile requires at least one value");
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower]! + (index - lower) * (sorted[upper]! - sorted[lower]!);
};
export const populationSd = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};
export const percent = (numerator: number, denominator: number): number => denominator === 0 ? 0 : round(100 * numerator / denominator);

export function toMissionRunRow(run: SimulationRun): MissionRunRow {
  const { state, result } = run;
  const alpha = result.domain.criticalDelivery;
  return {
    calibrationVersion: S5_CALIBRATION_VERSION,
    policyId: run.policyId,
    oraclePolicy: run.oraclePolicy,
    worldId: run.worldId,
    primaryCorridorId: state.missionState.trueWorldState.primaryAffectedCorridorId,
    actorProfile: state.missionState.trueWorldState.actorProfileId,
    environmentSeed: run.environmentSeed,
    policySeed: run.policySeed,
    completed: state.stage.stageId === "complete" && state.missionState.completed,
    endStateId: result.missionEndState.endStateId,
    alphaDelivered: alpha.deliveredByMissionHorizon,
    alphaIntegrity: alpha.integrity,
    alphaDelayMinutes: alpha.delayMinutes,
    alphaProjectedArrivalMinute: alpha.projectedArrivalMinute,
    alphaDeadlineMinute: alpha.deadlineMinute,
    alphaOnTimeOperational: alpha.onTimeOperational,
    networkContinuityPercent: result.domain.logisticsResilience.networkContinuityPercent,
    deliveredConvoyCount: result.domain.logisticsResilience.deliveredConvoyCount,
    onTimeOperationalConvoyCount: result.domain.logisticsResilience.onTimeOperationalConvoyCount,
    compromisedConvoyCount: result.domain.navigationIntegrity.compromisedConvoyCount,
    operationalAttributionStatus: result.domain.logisticsResilience.operationalAttributionStatus,
    threatContained: result.domain.logisticsResilience.threatContained,
    totalFinalDelayMinutes: result.domain.delayControl.totalFinalDelayMinutes,
    totalActorDelayAddedMinutes: result.domain.delayControl.totalActorDelayAddedMinutes,
    totalPlayerDelayAddedMinutes: result.domain.delayControl.totalPlayerDelayAddedMinutes,
    totalPlayerDelayRecoveredMinutes: result.domain.delayControl.totalPlayerDelayRecoveredMinutes,
    finalIsr: state.missionState.resources.isrCapacity,
    finalSupport: state.missionState.resources.supportReserve,
    worldClockBeforeFinalization: run.worldClockBeforeFinalization,
    localizedDisruptionEventCount: result.domain.civilianImpactProxy.localizedDisruptionEventCount,
    targetedAttentionHhi: result.domain.networkLogisticsBalance.targetedAttentionHhi,
    fallbackCount: run.fallbackCount,
    minimumAvailableActionCount: run.minimumAvailableActionCount,
    singleOptionWindowCount: run.singleOptionWindowCount,
    secondaryActorImpactDecisionCount: run.secondaryActorImpactDecisionCount,
    convoySnapshot: state.missionState.convoys.map((convoy) => ({
      corridorId: convoy.corridorId,
      integrity: convoy.integrity,
      projectedArrivalMinute: convoy.baselineArrivalMinute + convoy.delayMinutes,
      deadlineMinute: convoy.deadlineMinute,
    })),
  };
}

export function toCognitiveRunRow(run: SimulationRun): CognitiveRunRow {
  const result = run.result.cognitive;
  return {
    policyId: run.policyId as CognitiveRunRow["policyId"],
    worldId: run.worldId,
    actorProfile: run.state.missionState.trueWorldState.actorProfileId,
    primaryCorridorId: run.state.missionState.trueWorldState.primaryAffectedCorridorId,
    environmentSeed: run.environmentSeed,
    policySeed: run.policySeed,
    dataCompletenessOverall: result.dataCompleteness.overall,
    overallOSI: result.orientation.overall,
    phaseAOSI: result.orientation.phaseScores[0],
    phaseBOSI: result.orientation.phaseScores[1],
    phaseCOSI: result.orientation.phaseScores[2],
    phaseDOSI: result.orientation.phaseScores[3],
    operationalStrength: result.orientation.operationalStrength,
    strategicStrength: result.orientation.strategicStrength,
    integration: result.orientation.integration,
    dispersion: result.orientation.dispersion,
    informationSeeking: result.constructs.informationSeeking,
    secondOrderThinking: result.constructs.secondOrderThinking,
    adversaryModeling: result.constructs.adversaryModeling,
    escalationSensitivity: result.constructs.escalationSensitivity,
    evidenceResponsiveUpdating: result.constructs.evidenceResponsiveUpdating,
    resourceStewardship: result.constructs.resourceStewardship,
    planningForesight: result.constructs.planningForesight,
    multiDomainIntegration: result.constructs.multiDomainIntegration,
    riskPosture: result.constructs.riskPosture,
    decisionCoherence: result.constructs.decisionCoherence,
    medianActiveDecisionMs: result.telemetrySummary.medianActiveDecisionMs,
    totalRevisions: result.telemetrySummary.totalRevisions,
    evidenceTriggeredRevisionRate: result.telemetrySummary.evidenceTriggeredRevisionRate,
  };
}

export interface ActionCoverageRow {
  readonly actionId: MissionActionId;
  readonly selectionCount: number;
  readonly selectionCountByRound: string;
  readonly targetAlphaCount: number;
  readonly targetBetaCount: number;
  readonly targetGammaCount: number;
  readonly targetDeltaCount: number;
  readonly fallbackSelectionCount: number;
  readonly alphaLegality: string;
  readonly betaLegality: string;
  readonly gammaLegality: string;
  readonly deltaLegality: string;
}

export function calculateActionCoverage(runs: readonly Pick<SimulationRun, "decisionTrace">[]): readonly ActionCoverageRow[] {
  return MISSION_ACTION_CATALOG.map(({ actionId, target }) => {
    const selections = runs.flatMap(({ decisionTrace }) => decisionTrace).filter(({ actualActionId }) => actualActionId === actionId);
    const legal = new Set<CorridorId>();
    for (const run of runs) for (const trace of run.decisionTrace) {
      if (trace.availableActionIds.includes(actionId) && target === "required") trace.legalActiveTargetIds.forEach((id) => legal.add(id));
    }
    const targetCount = (corridorId: CorridorId): number => selections.filter(({ targetCorridorId }) => targetCorridorId === corridorId).length;
    const legality = (corridorId: CorridorId): string => target !== "required" ? "not_applicable"
      : !legal.has(corridorId) ? "not_observed_as_legal"
      : targetCount(corridorId) > 0 ? "observed" : "legal_but_not_selected";
    const byRound = Object.fromEntries([...new Set(selections.map(({ roundId }) => roundId))].sort().map((roundId) => [roundId, selections.filter((item) => item.roundId === roundId).length]));
    return {
      actionId,
      selectionCount: selections.length,
      selectionCountByRound: JSON.stringify(byRound),
      targetAlphaCount: targetCount("corridor_alpha_east"),
      targetBetaCount: targetCount("corridor_beta_south"),
      targetGammaCount: targetCount("corridor_gamma_northwest"),
      targetDeltaCount: targetCount("corridor_delta_west"),
      fallbackSelectionCount: selections.filter(({ fallbackUsed }) => fallbackUsed).length,
      alphaLegality: legality("corridor_alpha_east"), betaLegality: legality("corridor_beta_south"),
      gammaLegality: legality("corridor_gamma_northwest"), deltaLegality: legality("corridor_delta_west"),
    };
  });
}

export interface ActorSignatureRow {
  readonly actorProfile: ActorProfileId;
  readonly meanActorDelayAddedMinutes: number;
  readonly medianActorDelayAddedMinutes: number;
  readonly threatContainedRate: number;
  readonly resolvedAttributionRate: number;
  readonly meanNetworkContinuity: number;
  readonly meanAlphaDelay: number;
  readonly endStateDistribution: string;
  readonly secondaryActorImpactRate: number;
}

const END_STATES: readonly Scenario5EndStateId[] = [
  "critical_cargo_lost_or_compromised", "priority_delivered_network_degradation", "mission_incomplete_continuity_preserved",
  "delivery_complete_threat_persistent", "delivery_complete_attribution_unresolved", "delivery_complete_threat_contained",
];

export function calculateActorSignatures(rows: readonly MissionRunRow[]): readonly ActorSignatureRow[] {
  return CANONICAL_ACTOR_PROFILES.map(({ profileId }) => {
    const matched = rows.filter(({ actorProfile }) => actorProfile === profileId);
    const distribution = Object.fromEntries(END_STATES.map((endStateId) => [endStateId, matched.filter((row) => row.endStateId === endStateId).length / matched.length]));
    return {
      actorProfile: profileId,
      meanActorDelayAddedMinutes: round(mean(matched.map(({ totalActorDelayAddedMinutes }) => totalActorDelayAddedMinutes))),
      medianActorDelayAddedMinutes: round(quantile(matched.map(({ totalActorDelayAddedMinutes }) => totalActorDelayAddedMinutes), .5)),
      threatContainedRate: round(matched.filter(({ threatContained }) => threatContained).length / matched.length),
      resolvedAttributionRate: round(matched.filter(({ operationalAttributionStatus }) => operationalAttributionStatus === "resolved").length / matched.length),
      meanNetworkContinuity: round(mean(matched.map(({ networkContinuityPercent }) => networkContinuityPercent))),
      meanAlphaDelay: round(mean(matched.map(({ alphaDelayMinutes }) => alphaDelayMinutes))),
      endStateDistribution: JSON.stringify(distribution),
      secondaryActorImpactRate: round(matched.reduce((sum, row) => sum + row.secondaryActorImpactDecisionCount, 0) / (matched.length * 8)),
    };
  });
}

export function calculateActorPairs(signatures: readonly ActorSignatureRow[]): readonly ActorPairResult[] {
  const pairs: ActorPairResult[] = [];
  for (let leftIndex = 0; leftIndex < signatures.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < signatures.length; rightIndex += 1) {
    const left = signatures[leftIndex]!;
    const right = signatures[rightIndex]!;
    const leftDistribution = JSON.parse(left.endStateDistribution) as Record<string, number>;
    const rightDistribution = JSON.parse(right.endStateDistribution) as Record<string, number>;
    const meanDelayDifference = Math.abs(left.meanActorDelayAddedMinutes - right.meanActorDelayAddedMinutes);
    const threatContainedRateDifference = Math.abs(left.threatContainedRate - right.threatContainedRate);
    const endStateTvDistance = .5 * END_STATES.reduce((sum, id) => sum + Math.abs((leftDistribution[id] ?? 0) - (rightDistribution[id] ?? 0)), 0);
    const secondaryImpactRateDifference = Math.abs(left.secondaryActorImpactRate - right.secondaryActorImpactRate);
    pairs.push({
      actorA: left.actorProfile, actorB: right.actorProfile, meanDelayDifference: round(meanDelayDifference),
      threatContainedRateDifference: round(threatContainedRateDifference), endStateTvDistance: round(endStateTvDistance),
      secondaryImpactRateDifference: round(secondaryImpactRateDifference),
      distinguishable: meanDelayDifference >= 5 || threatContainedRateDifference >= .1 || endStateTvDistance >= .1 || secondaryImpactRateDifference >= .1,
    });
  }
  return pairs;
}

export interface SeedSensitivityRow {
  readonly worldId: WorldId;
  readonly policyId: string;
  readonly modalEndStateShare: number;
  readonly uniqueEndStateCount: number;
  readonly alphaDeliveryRate: number;
  readonly networkContinuityMin: number;
  readonly networkContinuityMax: number;
  readonly alphaDelayP25: number;
  readonly alphaDelayMedian: number;
  readonly alphaDelayP75: number;
  readonly alphaDelayIqr: number;
  readonly actorDelayP25: number;
  readonly actorDelayMedian: number;
  readonly actorDelayP75: number;
  readonly highSeedSensitivity: boolean;
}

export function calculateSeedSensitivity(rows: readonly MissionRunRow[]): readonly SeedSensitivityRow[] {
  const result: SeedSensitivityRow[] = [];
  for (const worldId of [...new Set(rows.map(({ worldId }) => worldId))]) for (const policyId of [...new Set(rows.map(({ policyId }) => policyId))]) {
    const matched = rows.filter((row) => row.worldId === worldId && row.policyId === policyId);
    if (matched.length === 0) continue;
    const counts = new Map<string, number>();
    matched.forEach(({ endStateId }) => counts.set(endStateId, (counts.get(endStateId) ?? 0) + 1));
    const modalEndStateShare = Math.max(...counts.values()) / matched.length;
    const continuity = matched.map(({ networkContinuityPercent }) => networkContinuityPercent);
    const alphaDelay = matched.map(({ alphaDelayMinutes }) => alphaDelayMinutes);
    const actorDelay = matched.map(({ totalActorDelayAddedMinutes }) => totalActorDelayAddedMinutes);
    const alphaDelayIqr = quantile(alphaDelay, .75) - quantile(alphaDelay, .25);
    result.push({
      worldId, policyId: String(policyId), modalEndStateShare: round(modalEndStateShare), uniqueEndStateCount: counts.size,
      alphaDeliveryRate: round(matched.filter(({ alphaDelivered }) => alphaDelivered).length / matched.length),
      networkContinuityMin: Math.min(...continuity), networkContinuityMax: Math.max(...continuity),
      alphaDelayP25: round(quantile(alphaDelay, .25)), alphaDelayMedian: round(quantile(alphaDelay, .5)), alphaDelayP75: round(quantile(alphaDelay, .75)), alphaDelayIqr: round(alphaDelayIqr),
      actorDelayP25: round(quantile(actorDelay, .25)), actorDelayMedian: round(quantile(actorDelay, .5)), actorDelayP75: round(quantile(actorDelay, .75)),
      highSeedSensitivity: modalEndStateShare < .6 || Math.max(...continuity) - Math.min(...continuity) > 50 || alphaDelayIqr > 30,
    });
  }
  return result;
}

const distributionMetrics: readonly { key: keyof CognitiveRunRow; scale: "0..100" | "-1..1" }[] = [
  { key: "informationSeeking", scale: "0..100" }, { key: "secondOrderThinking", scale: "0..100" },
  { key: "adversaryModeling", scale: "0..100" }, { key: "escalationSensitivity", scale: "0..100" },
  { key: "evidenceResponsiveUpdating", scale: "0..100" }, { key: "resourceStewardship", scale: "0..100" },
  { key: "planningForesight", scale: "0..100" }, { key: "multiDomainIntegration", scale: "0..100" },
  { key: "decisionCoherence", scale: "0..100" }, { key: "operationalStrength", scale: "0..100" },
  { key: "strategicStrength", scale: "0..100" }, { key: "integration", scale: "0..100" },
  { key: "overallOSI", scale: "-1..1" }, { key: "riskPosture", scale: "-1..1" },
];

export function calculateDistributions(rows: readonly CognitiveRunRow[]): readonly DistributionSummary[] {
  return distributionMetrics.map(({ key, scale }) => {
    const values = rows.map((row) => row[key]).filter((value): value is number => typeof value === "number");
    const sd = values.length === 0 ? null : populationSd(values);
    const floor = scale === "0..100" ? percent(values.filter((value) => value <= 5).length, values.length) : null;
    const ceiling = scale === "0..100" ? percent(values.filter((value) => value >= 95).length, values.length) : null;
    const warnings = [
      ...(floor !== null && floor > 80 ? ["engineering_floor"] : []),
      ...(ceiling !== null && ceiling > 80 ? ["engineering_ceiling"] : []),
      ...(sd !== null && sd < (scale === "0..100" ? 5 : .05) ? ["engineering_low_variance"] : []),
    ];
    return {
      metric: key, scale, n: values.length, nullRate: round(1 - values.length / rows.length),
      mean: values.length ? round(mean(values)) : null, sd: sd === null ? null : round(sd),
      min: values.length ? round(Math.min(...values)) : null, p05: values.length ? round(quantile(values, .05)) : null,
      p25: values.length ? round(quantile(values, .25)) : null, median: values.length ? round(quantile(values, .5)) : null,
      p75: values.length ? round(quantile(values, .75)) : null, p95: values.length ? round(quantile(values, .95)) : null,
      max: values.length ? round(Math.max(...values)) : null, percentAtOrBelow5: floor, percentAtOrAbove95: ceiling, warnings,
    };
  });
}

export const canonicalEnvironmentCounts = (rows: readonly MissionRunRow[]) => ({
  worlds: [...new Set(rows.map(({ worldId }) => worldId))].length,
  actors: Object.fromEntries(CANONICAL_ACTOR_PROFILES.map(({ profileId }) => [profileId, rows.filter(({ actorProfile }) => actorProfile === profileId).length])),
  corridors: Object.fromEntries(CANONICAL_CORRIDOR_IDS.map((corridorId) => [corridorId, rows.filter(({ primaryCorridorId }) => primaryCorridorId === corridorId).length])),
});
