import type {
  CorridorId,
  EvidenceDirection,
  EvidenceSourceType,
  EvidenceStrengthBand,
} from "../index";
import type { MissionActionId } from "../mission/types";

export type PhaseId = "A" | "B" | "C" | "D";
export type CognitiveWindowId =
  | "A1_baseline_monitoring"
  | "A2_evidence_acquisition"
  | "B1_monitoring_allocation"
  | "B2_route_policy"
  | "C1_support_and_checkpoints"
  | "C2_resource_portfolio"
  | "D1_crisis_response"
  | "D2_final_delivery_policy";
export type BeliefCheckpointId = "A2_prebelief" | "A2_postbelief" | "C_belief_checkpoint" | "D_final_belief";
export type ReasonId =
  | "reason_mission_speed"
  | "reason_reduce_exposure"
  | "reason_preserve_resources"
  | "reason_network_continuity"
  | "reason_information_confidence"
  | "reason_limit_actor_reaction"
  | "reason_preserve_reversibility";
export type DomainSalienceId =
  | "mission" | "information" | "navigation" | "logistics" | "resources"
  | "civilian" | "escalation" | "futureOptions" | "network";

export interface SelectionTelemetry {
  readonly actionId: MissionActionId;
  readonly selectedAtMs: number;
}

export interface VisibleResourceTelemetry {
  readonly isrCapacity: number;
  readonly supportReserve: number;
}

export interface DecisionTelemetry {
  readonly phaseId: PhaseId;
  readonly roundId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly windowId: CognitiveWindowId;
  readonly availableActionIds: readonly MissionActionId[];
  readonly firstSelectedActionId: MissionActionId | null;
  readonly finalSelectedActionId: MissionActionId | null;
  readonly selectionHistory: readonly SelectionTelemetry[];
  readonly enteredAtMs: number | null;
  readonly confirmedAtMs: number | null;
  readonly elapsedMs: number | null;
  readonly activeDecisionMs: number | null;
  readonly hiddenTabMs: number | null;
  readonly revisionCount: number;
  readonly availableEvidenceIds: readonly string[];
  readonly openedEvidenceIds: readonly string[];
  readonly playerVisibleResourcesBefore: VisibleResourceTelemetry | null;
  readonly playerVisibleResourcesAfter: VisibleResourceTelemetry | null;
}

export interface EvidenceTelemetry {
  readonly evidenceId: string;
  readonly sourceType: EvidenceSourceType;
  readonly observedCorridorId: CorridorId | null;
  readonly direction: EvidenceDirection;
  readonly strengthBand: EvidenceStrengthBand;
  readonly relevantWindowIds: readonly CognitiveWindowId[];
  readonly availableAtMs: number;
  readonly qualityLabelVisible: string;
  readonly limitationVisible: string;
}

export interface EvidenceOpenTelemetry {
  readonly evidenceId: string;
  readonly windowId: CognitiveWindowId;
  readonly openedAtMs: number;
  readonly closedAtMs: number | null;
  readonly activeDwellMs: number | null;
}

export interface BeliefTelemetry {
  readonly checkpointId: BeliefCheckpointId;
  readonly recordedAtMs: number;
  readonly mostLikelyCorridorId: CorridorId;
  readonly corridorConfidence: number;
  readonly targetedInterferenceEstimate: number;
  readonly targetedInterferenceConfidence: number;
  readonly visibleEvidenceIdsAtCheckpoint: readonly string[];
}

export interface ReasonTelemetry {
  readonly phaseId: "B" | "C" | "D";
  readonly reasonId: ReasonId;
  readonly recordedAtMs: number;
  readonly capturedBeforeOutcome: boolean;
}

export interface Scenario5CognitiveTelemetryBundle {
  readonly scenarioId: "s5_silent_waves_redesign";
  readonly runId: string;
  readonly startedAtMs: number | null;
  readonly completedAtMs: number | null;
  readonly decisions: readonly DecisionTelemetry[];
  readonly evidence: readonly EvidenceTelemetry[];
  readonly evidenceOpens: readonly EvidenceOpenTelemetry[];
  readonly beliefs: readonly BeliefTelemetry[];
  readonly reasons: readonly ReasonTelemetry[];
}

export interface OptionCognitiveProfile {
  readonly actionId: MissionActionId;
  readonly operationalLoading: number;
  readonly strategicLoading: number;
  readonly informationSeeking: number;
  readonly futureConsequenceThinking: number;
  readonly adversaryModeling: number;
  readonly escalationSensitivity: number;
  readonly reversibilityPreference: number;
  readonly resourceStewardship: number;
  readonly contingencyPlanning: number;
  readonly riskExposure: number;
  readonly domainSalience: Partial<Record<DomainSalienceId, number>>;
}

export interface DataCompletenessResult {
  readonly overall: number;
  readonly decisions: number;
  readonly timing: number;
  readonly evidence: number;
  readonly estimates: number;
  readonly reasons: number;
}

export interface TelemetrySummaryResult {
  readonly medianActiveDecisionMs: number | null;
  readonly iqrActiveDecisionMs: number | null;
  readonly totalRevisions: number;
  readonly revisedWindows: number;
  readonly evidenceTriggeredRevisionRate: number | null;
}

export interface Scenario5CognitiveRunResult {
  readonly scenarioId: "s5_silent_waves_redesign";
  readonly runId: string;
  readonly measurementModelVersion: string;
  readonly formulaVersion: string;
  readonly optionProfileVersion: string;
  readonly scenarioContentVersion: string;
  readonly reasonModelVersion: string;
  readonly expertPanelVersion: string;
  readonly validityStatus: string;
  readonly dataCompleteness: DataCompletenessResult;
  readonly orientation: {
    readonly overall: number | null;
    readonly operationalStrength: number | null;
    readonly strategicStrength: number | null;
    readonly integration: number | null;
    readonly dispersion: number | null;
    readonly phaseScores: readonly [number | null, number | null, number | null, number | null];
  };
  readonly constructs: {
    readonly informationSeeking: number | null;
    readonly secondOrderThinking: number | null;
    readonly adversaryModeling: number | null;
    readonly escalationSensitivity: number | null;
    readonly informationDiscipline: null;
    readonly evidenceResponsiveUpdating: number | null;
    readonly resourceStewardship: number | null;
    readonly planningForesight: number | null;
    readonly multiDomainIntegration: number | null;
    readonly riskPosture: number | null;
    readonly decisionCoherence: number | null;
  };
  readonly telemetrySummary: TelemetrySummaryResult;
}
