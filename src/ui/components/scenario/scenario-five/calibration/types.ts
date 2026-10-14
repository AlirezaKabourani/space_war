import type { ActorProfileId, CorridorId, WorldId } from "../model/index";
import type { ReasonId, Scenario5CognitiveRunResult, Scenario5CognitiveTelemetryBundle } from "../model/cognitive/index";
import type { MissionActionId, Scenario5EndStateId } from "../model/mission/index";
import type { Scenario5RuntimeResult, Scenario5RuntimeState } from "../model/runtime/index";
import type { PolicyRng } from "./policyRng";

export type CalibrationGateStatus = "PASS" | "FAIL" | "WARNING" | "NOT_APPLICABLE";
export type MissionPolicyId =
  | "balanced_network" | "priority_alpha" | "information_heavy" | "mobility_resilience"
  | "resource_preserver" | "high_response" | "low_response_reversible"
  | "oracle_primary_ceiling" | "wrong_corridor_stress" | "M10_uniform_random" | "witness_random";
export type CognitivePolicyId =
  | "operational_anchor" | "strategic_anchor" | "information_max" | "information_min"
  | "second_order_max" | "adversary_max" | "stewardship_max" | "planning_max" | "mci_max"
  | "risk_low" | "risk_high" | "coherence_high" | "coherence_low"
  | "evidence_responsive" | "evidence_anti" | "uniform_random_cognitive";
export type CalibrationPolicyId = MissionPolicyId | CognitivePolicyId;
export type TargetSelectorId =
  | "firstActiveTarget" | "alphaIfActiveElseFirst" | "leastProtectedPlayerVisibleTarget"
  | "mostSupportedVisibleTarget" | "oraclePrimaryTarget" | "wrongPrimaryTarget";
export type EvidenceBehavior = "none" | "all" | "random_half";
export type BeliefBehavior = "neutral" | "evidence_responsive" | "evidence_anti";
export type ReasonBehavior = "neutral" | "maximize_alignment" | "minimize_alignment";

export interface PolicyChoiceContext {
  readonly state: Scenario5RuntimeState;
  readonly availableActionIds: readonly MissionActionId[];
  readonly rng: PolicyRng;
}

export interface CalibrationPolicy {
  readonly policyId: CalibrationPolicyId;
  readonly oraclePolicy: boolean;
  readonly stressPolicy: boolean;
  readonly randomPolicy: boolean;
  readonly evidenceBehavior: EvidenceBehavior;
  readonly beliefBehavior: BeliefBehavior;
  readonly reasonBehavior: ReasonBehavior;
  readonly requestedActionByRound?: Readonly<Record<number, MissionActionId>>;
  readonly targetSelectorByRound?: Readonly<Record<number, TargetSelectorId>>;
  readonly chooseAction?: (context: PolicyChoiceContext) => MissionActionId;
}

export interface DecisionAuditTrace {
  readonly roundId: number;
  readonly windowId: string;
  readonly requestedActionId: MissionActionId;
  readonly actualActionId: MissionActionId;
  readonly targetCorridorId: CorridorId | null;
  readonly fallbackUsed: boolean;
  readonly availableActionIds: readonly MissionActionId[];
  readonly legalActiveTargetIds: readonly CorridorId[];
}

export interface SimulationRun {
  readonly policyId: CalibrationPolicyId;
  readonly oraclePolicy: boolean;
  readonly stressPolicy: boolean;
  readonly worldId: WorldId;
  readonly environmentSeed: number;
  readonly policySeed: number | null;
  readonly state: Scenario5RuntimeState;
  readonly result: Scenario5RuntimeResult;
  readonly cognitiveBundle: Scenario5CognitiveTelemetryBundle;
  readonly decisionTrace: readonly DecisionAuditTrace[];
  readonly minimumAvailableActionCount: number;
  readonly singleOptionWindowCount: number;
  readonly fallbackCount: number;
  readonly worldClockBeforeFinalization: number;
  readonly secondaryActorImpactDecisionCount: number;
}

export interface SimulationOptions {
  readonly policy: CalibrationPolicy;
  readonly worldId: WorldId;
  readonly environmentSeed: number;
  readonly policySeed?: number;
  readonly initialState?: Scenario5RuntimeState;
  readonly forcedFirstChoice?: {
    readonly actionId: MissionActionId;
    readonly targetCorridorId?: CorridorId;
  };
  readonly onPreDecision?: (state: Scenario5RuntimeState) => void;
}

export interface MissionRunRow {
  readonly calibrationVersion: string;
  readonly policyId: CalibrationPolicyId;
  readonly oraclePolicy: boolean;
  readonly worldId: WorldId;
  readonly primaryCorridorId: CorridorId;
  readonly actorProfile: ActorProfileId;
  readonly environmentSeed: number;
  readonly policySeed: number | null;
  readonly basePolicySeed?: number | null;
  readonly effectivePolicySeed?: number | null;
  readonly completed: boolean;
  readonly endStateId: Scenario5EndStateId;
  readonly alphaDelivered: boolean;
  readonly alphaIntegrity: number;
  readonly alphaDelayMinutes: number;
  readonly alphaProjectedArrivalMinute: number;
  readonly alphaDeadlineMinute: number;
  readonly alphaOnTimeOperational: boolean;
  readonly networkContinuityPercent: number;
  readonly deliveredConvoyCount: number;
  readonly onTimeOperationalConvoyCount: number;
  readonly compromisedConvoyCount: number;
  readonly operationalAttributionStatus: string;
  readonly threatContained: boolean;
  readonly totalFinalDelayMinutes: number;
  readonly totalActorDelayAddedMinutes: number;
  readonly totalPlayerDelayAddedMinutes: number;
  readonly totalPlayerDelayRecoveredMinutes: number;
  readonly finalIsr: number;
  readonly finalSupport: number;
  readonly worldClockBeforeFinalization: number;
  readonly localizedDisruptionEventCount: number;
  readonly targetedAttentionHhi: number | null;
  readonly fallbackCount: number;
  readonly minimumAvailableActionCount: number;
  readonly singleOptionWindowCount: number;
  readonly secondaryActorImpactDecisionCount: number;
  readonly convoySnapshot: readonly {
    readonly corridorId: CorridorId;
    readonly integrity: number;
    readonly projectedArrivalMinute: number;
    readonly deadlineMinute: number;
  }[];
}

export interface CognitiveRunRow {
  readonly policyId: CognitivePolicyId;
  readonly worldId: WorldId;
  readonly actorProfile: ActorProfileId;
  readonly primaryCorridorId: CorridorId;
  readonly environmentSeed: number;
  readonly policySeed: number | null;
  readonly basePolicySeed?: number | null;
  readonly effectivePolicySeed?: number | null;
  readonly dataCompletenessOverall: number;
  readonly overallOSI: number | null;
  readonly phaseAOSI: number | null;
  readonly phaseBOSI: number | null;
  readonly phaseCOSI: number | null;
  readonly phaseDOSI: number | null;
  readonly operationalStrength: number | null;
  readonly strategicStrength: number | null;
  readonly integration: number | null;
  readonly dispersion: number | null;
  readonly informationSeeking: number | null;
  readonly secondOrderThinking: number | null;
  readonly adversaryModeling: number | null;
  readonly escalationSensitivity: number | null;
  readonly evidenceResponsiveUpdating: number | null;
  readonly resourceStewardship: number | null;
  readonly planningForesight: number | null;
  readonly multiDomainIntegration: number | null;
  readonly riskPosture: number | null;
  readonly decisionCoherence: number | null;
  readonly medianActiveDecisionMs: number | null;
  readonly totalRevisions: number;
  readonly evidenceTriggeredRevisionRate: number | null;
}

export interface GateRecord {
  readonly gateId: string;
  readonly status: CalibrationGateStatus;
  readonly detail: string;
}

export interface ActorPairResult {
  readonly actorA: ActorProfileId;
  readonly actorB: ActorProfileId;
  readonly meanDelayDifference: number;
  readonly threatContainedRateDifference: number;
  readonly endStateTvDistance: number;
  readonly secondaryImpactRateDifference: number;
  readonly distinguishable: boolean;
}

export interface DistributionSummary {
  readonly metric: string;
  readonly scale: "0..100" | "-1..1";
  readonly n: number;
  readonly nullRate: number;
  readonly mean: number | null;
  readonly sd: number | null;
  readonly min: number | null;
  readonly p05: number | null;
  readonly p25: number | null;
  readonly median: number | null;
  readonly p75: number | null;
  readonly p95: number | null;
  readonly max: number | null;
  readonly percentAtOrBelow5: number | null;
  readonly percentAtOrAbove95: number | null;
  readonly warnings: readonly string[];
}

export interface CalibrationSummary {
  readonly calibrationVersion: string;
  readonly modelVersions: Readonly<Record<string, string>>;
  readonly runCounts: Readonly<Record<string, number>>;
  readonly environmentCoverage: unknown;
  readonly actionCoverage: unknown;
  readonly endStateCoverage: unknown;
  readonly hardGates: readonly GateRecord[];
  readonly warnings: readonly GateRecord[];
  readonly actorPairResults: readonly ActorPairResult[];
  readonly seedSensitivitySummary: unknown;
  readonly randomOsiSummary: unknown;
  readonly cognitiveAnchorSummary: unknown;
  readonly distributionWarnings: readonly DistributionSummary[];
  readonly shadowSensitivitySummary: unknown;
  readonly overallStatus: "PASS" | "FAIL";
}

export interface EndStateWitness {
  readonly endStateId: Scenario5EndStateId;
  readonly worldId: WorldId;
  readonly environmentSeed: number;
  readonly policySeed: number;
  readonly orderedActions: readonly MissionActionId[];
  readonly orderedTargets: readonly (CorridorId | null)[];
  readonly finalDomainSummary: Readonly<Record<string, unknown>>;
}

export interface CounterfactualResult {
  readonly rows: readonly Readonly<Record<string, string | number | boolean>>[];
  readonly branchCount: number;
  readonly universalDominanceFound: boolean;
}

export type CognitiveResult = Scenario5CognitiveRunResult;
export type CalibrationReasonId = ReasonId;
