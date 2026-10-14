import type { CorridorId, Scenario5Seed, WorldId } from "../index";
import type {
  BeliefTelemetry,
  CognitiveWindowId,
  DecisionTelemetry,
  EvidenceOpenTelemetry,
  EvidenceTelemetry,
  ReasonId,
  ReasonTelemetry,
  Scenario5CognitiveRunResult,
} from "../cognitive/index";
import type {
  MissionActionId,
  MissionActionSelection,
  MissionConvoyState,
  MissionResourceState,
  Scenario5EndState,
  Scenario5MissionState,
} from "../mission/index";

export type RuntimeStageId =
  | "decision:A1_baseline_monitoring"
  | "belief:A2_prebelief"
  | "decision:A2_evidence_acquisition"
  | "belief:A2_postbelief"
  | "decision:B1_monitoring_allocation"
  | "decision:B2_route_policy"
  | "reason:B"
  | "decision:C1_support_and_checkpoints"
  | "decision:C2_resource_portfolio"
  | "reason:C"
  | "belief:C_belief_checkpoint"
  | "decision:D1_crisis_response"
  | "belief:D_final_belief"
  | "decision:D2_final_delivery_policy"
  | "reason:D"
  | "outcome_review"
  | "complete";

export type RuntimeRoundId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type RuntimePhaseId = "A" | "B" | "C" | "D";

export interface Scenario5RuntimeConfig {
  readonly runId: string;
  readonly worldId: WorldId;
  readonly seed: Scenario5Seed;
  readonly startedAtMs: number;
}

export interface RuntimeStageState {
  readonly stageId: RuntimeStageId;
  readonly enteredAtMs: number;
  readonly nextStageId?: RuntimeStageId;
}

export interface RuntimeSelectionRecord {
  readonly actionId: MissionActionId;
  readonly selectedAtMs: number;
}

export interface RuntimeActiveEvidenceOpen {
  readonly evidenceId: string;
  readonly windowId: CognitiveWindowId;
  readonly openedAtMs: number;
}

export interface PendingRuntimeDecision {
  readonly selection: MissionActionSelection;
  readonly phaseId: RuntimePhaseId;
  readonly roundId: RuntimeRoundId;
  readonly windowId: CognitiveWindowId;
  readonly availableActionIds: readonly MissionActionId[];
  readonly selectionHistory: readonly RuntimeSelectionRecord[];
  readonly enteredAtMs: number;
  readonly confirmedAtMs: number;
  readonly elapsedMs: number;
  readonly activeDecisionMs: number;
  readonly hiddenTabMs: number;
  readonly revisionCount: number;
  readonly availableEvidenceIds: readonly string[];
  readonly openedEvidenceIds: readonly string[];
  readonly playerVisibleResourcesBefore: {
    readonly isrCapacity: number;
    readonly supportReserve: number;
  };
}

export interface Scenario5DomainDecisionRecord {
  readonly roundId: RuntimeRoundId;
  readonly windowId: CognitiveWindowId;
  readonly actionId: MissionActionId;
  readonly effectiveTargetCorridorId: CorridorId | null;
  readonly worldClockBefore: number;
  readonly worldClockAfter: number;
  readonly resourcesBefore: MissionResourceState;
  readonly resourcesAfter: MissionResourceState;
  readonly convoyStateBefore: readonly MissionConvoyState[];
  readonly convoyStateAfter: readonly MissionConvoyState[];
  readonly actorDelayImpactByCorridor: Readonly<Record<CorridorId, number>>;
  readonly newVisibleEvidenceIds: readonly string[];
}

export type Scenario5RuntimeEventKind =
  | "runtime_created"
  | "runtime_stage_entered"
  | "runtime_action_selected"
  | "runtime_evidence_opened"
  | "runtime_evidence_closed"
  | "runtime_decision_confirmed"
  | "runtime_reason_recorded"
  | "runtime_belief_recorded"
  | "runtime_mission_step_committed"
  | "runtime_outcome_continued"
  | "runtime_completed";

export interface Scenario5RuntimeEvent {
  readonly eventId: string;
  readonly sequence: number;
  readonly eventKind: Scenario5RuntimeEventKind;
  readonly atMs: number;
  readonly stageId: RuntimeStageId;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface Scenario5RuntimeState {
  readonly runtimeModelVersion: string;
  readonly domainMetricsVersion: string;
  readonly runId: string;
  readonly startedAtMs: number;
  readonly completedAtMs: number | null;
  readonly stage: RuntimeStageState;
  readonly missionState: Scenario5MissionState;
  readonly decisions: readonly DecisionTelemetry[];
  readonly evidence: readonly EvidenceTelemetry[];
  readonly evidenceOpens: readonly EvidenceOpenTelemetry[];
  readonly beliefs: readonly BeliefTelemetry[];
  readonly reasons: readonly ReasonTelemetry[];
  readonly currentSelectionHistory: readonly RuntimeSelectionRecord[];
  readonly activeEvidenceOpens: readonly RuntimeActiveEvidenceOpen[];
  readonly pendingDecision: PendingRuntimeDecision | null;
  readonly domainDecisionRecords: readonly Scenario5DomainDecisionRecord[];
  readonly runtimeEvents: readonly Scenario5RuntimeEvent[];
}

export interface GnssPntCheckpointAssessment {
  readonly checkpointId: BeliefTelemetry["checkpointId"];
  readonly selectedCorridorId: CorridorId;
  readonly corridorCorrect: boolean;
  readonly corridorConfidence: number;
  readonly targetedInterferenceEstimate: number;
  readonly targetedInterferenceConfidence: number;
  readonly targetedRecognition: boolean;
}

export interface Scenario5DomainMetrics {
  readonly domainMetricsVersion: string;
  readonly missionModelVersion: string;
  readonly gnssPntAssessment: {
    readonly checkpoints: readonly GnssPntCheckpointAssessment[];
    readonly recordedCheckpointCount: number;
    readonly correctCorridorCheckpointRatePercent: number | null;
    readonly firstCorrectCorridorCheckpoint: BeliefTelemetry["checkpointId"] | null;
    readonly finalCorridorCorrect: boolean | null;
    readonly firstTargetedRecognitionCheckpoint: BeliefTelemetry["checkpointId"] | null;
    readonly finalTargetedInterferenceEstimate: number | null;
    readonly finalTargetedInterferenceConfidence: number | null;
    readonly corroboratedCorridorIds: readonly CorridorId[];
    readonly truePrimaryCorridorCorroborated: boolean;
  };
  readonly navigationIntegrity: {
    readonly finalPntExposureByCorridor: Readonly<Record<CorridorId, number>>;
    readonly meanFinalPntExposure: number;
    readonly maxFinalPntExposure: number;
    readonly fallbackCorridorIds: readonly CorridorId[];
    readonly routeHardenedCorridorIds: readonly CorridorId[];
    readonly groundSupportCorridorIds: readonly CorridorId[];
    readonly compromisedConvoyCount: number;
  };
  readonly criticalDelivery: {
    readonly deliveredByMissionHorizon: boolean;
    readonly onTimeOperational: boolean;
    readonly integrity: number;
    readonly delayMinutes: number;
    readonly projectedArrivalMinute: number;
    readonly deadlineMinute: number;
    readonly deliveredAtMinute: number | null;
    readonly alphaTargetedResourceUnits: number;
    readonly totalResourceSpentUnits: number;
    readonly alphaTargetedResourceSharePercent: number | null;
    readonly alphaTargetedDecisionCount: number;
  };
  readonly logisticsResilience: {
    readonly networkContinuityPercent: 0 | 25 | 50 | 75 | 100;
    readonly deliveredConvoyCount: number;
    readonly onTimeOperationalConvoyCount: number;
    readonly secondaryDeliveredConvoyCount: number;
    readonly fallbackCoverageCount: number;
    readonly routeHardeningCoverageCount: number;
    readonly groundSupportCoverageCount: number;
    readonly operationalAttributionStatus: Scenario5MissionState["operationalAttributionStatus"];
    readonly endStateId: Scenario5EndState["endStateId"];
    readonly threatContained: boolean;
  };
  readonly delayControl: {
    readonly byCorridor: Readonly<Record<CorridorId, {
      readonly finalDelayMinutes: number;
      readonly actorDelayAddedMinutes: number;
      readonly playerDelayAddedMinutes: number;
      readonly playerDelayRecoveredMinutes: number;
    }>>;
    readonly totalFinalDelayMinutes: number;
    readonly meanFinalDelayMinutes: number;
    readonly totalActorDelayAddedMinutes: number;
    readonly totalPlayerDelayAddedMinutes: number;
    readonly totalPlayerDelayRecoveredMinutes: number;
  };
  readonly civilianImpactProxy: {
    readonly routeDiversionCount: number;
    readonly checkpointOperationCount: number;
    readonly groundResponseCount: number;
    readonly holdOperationCount: number;
    readonly localizedDisruptionEventCount: number;
    readonly medicalDeliveryDelayMinutes: number;
  };
  readonly networkLogisticsBalance: {
    readonly secondaryMinimumIntegrity: number;
    readonly secondaryMeanIntegrity: number;
    readonly secondaryDeliveredCount: number;
    readonly networkContinuityPercent: 0 | 25 | 50 | 75 | 100;
    readonly meanDelay: number;
    readonly delayPopulationSd: number;
    readonly targetedDecisionCount: number;
    readonly targetedDecisionCountByCorridor: Readonly<Record<CorridorId, number>>;
    readonly targetedAttentionHhi: number | null;
  };
}

export interface Scenario5RuntimeResult {
  readonly runId: string;
  readonly runtimeModelVersion: string;
  readonly missionModelVersion: string;
  readonly cognitiveMeasurementModelVersion: string;
  readonly domainMetricsVersion: string;
  readonly missionEndState: Scenario5EndState;
  readonly cognitive: Scenario5CognitiveRunResult;
  readonly domain: Scenario5DomainMetrics;
}

export interface RuntimeDecisionStageMetadata {
  readonly phaseId: RuntimePhaseId;
  readonly roundId: RuntimeRoundId;
  readonly windowId: CognitiveWindowId;
  readonly reasonStageId: Extract<RuntimeStageId, `reason:${string}`> | null;
  readonly outcomeNextStageId: RuntimeStageId;
}

export interface RuntimeBeliefInput {
  readonly mostLikelyCorridorId: CorridorId;
  readonly corridorConfidence: number;
  readonly targetedInterferenceEstimate: number;
  readonly targetedInterferenceConfidence: number;
  readonly recordedAtMs: number;
}

export type { CognitiveWindowId, MissionActionId, MissionActionSelection, ReasonId };
