export type CorridorId =
  | "corridor_alpha_east"
  | "corridor_beta_south"
  | "corridor_gamma_northwest"
  | "corridor_delta_west";

export type ActorProfileId =
  | "cautious_denial"
  | "deceptive_diversion"
  | "opportunistic_interdiction"
  | "pressure_escalator";

export type WorldId = `W-${CorridorId}-${ActorProfileId}`;
export type Scenario5Seed = number;

export type ActorObjective =
  | "create_delay_while_preserving_ambiguity"
  | "divert_attention_and_resources"
  | "exploit_weakest_observable_logistics_gap"
  | "force_stop_or_major_reroute";

export type InterferenceMode =
  | "intermittent_jamming"
  | "spoofing_with_decoy"
  | "selective_jam_spoof"
  | "persistent_jamming";

export type ActorPosture = "covert" | "probing" | "committed" | "disengaging";
export type PressureBand = "low" | "medium" | "high";
export type EvidenceLatencyVariant = "early" | "nominal" | "late";

export interface CorridorMetadata {
  readonly corridorId: CorridorId;
  readonly convoyId: "alpha" | "beta" | "gamma" | "delta";
  readonly missionRole:
    | "priority_medical"
    | "operational_fuel"
    | "communications_parts"
    | "border_support";
  readonly routeLabel: string;
}

export interface ActorProfileMetadata {
  readonly profileId: ActorProfileId;
  readonly objective: ActorObjective;
  readonly primaryInterferenceMode: InterferenceMode;
  readonly defaultPosture: ActorPosture;
  readonly defaultRiskBudget: number;
}

export interface WorldTemplate {
  readonly worldId: WorldId;
  readonly primaryAffectedCorridorId: CorridorId;
  readonly actorProfileId: ActorProfileId;
  readonly actorObjective: ActorObjective;
  readonly primaryInterferenceMode: InterferenceMode;
  readonly initialDecoyCorridorId: CorridorId | null;
  readonly hasActiveActor: true;
}

export type ActorReactionId =
  | "cautious_relocate_reduce"
  | "cautious_hold_low"
  | "cautious_maintain"
  | "deceptive_shift_pattern"
  | "deceptive_strengthen_decoy"
  | "deceptive_maintain_mix"
  | "opportunistic_secondary_pressure"
  | "opportunistic_press_primary"
  | "opportunistic_probe"
  | "escalator_disengage"
  | "escalator_increase_pressure"
  | "escalator_reduce_due_to_denial"
  | "escalator_maintain";

export interface ActorInternalState {
  readonly profileId: ActorProfileId;
  readonly objective: ActorObjective;
  readonly posture: ActorPosture;
  readonly riskBudget: number;
  readonly disruptionPressure: PressureBand;
  readonly decoyCorridorId: CorridorId | null;
  readonly relocated: boolean;
  readonly lastReactionId: ActorReactionId | null;
}

export interface TrueWorldState {
  readonly modelVersion: string;
  readonly worldId: WorldId;
  readonly seed: Scenario5Seed;
  readonly primaryAffectedCorridorId: CorridorId;
  readonly actorProfileId: ActorProfileId;
  readonly actorObjective: ActorObjective;
  readonly primaryInterferenceMode: InterferenceMode;
  readonly initialDecoyCorridorId: CorridorId | null;
  readonly backgroundNoiseCorridorId: CorridorId;
  readonly latencyVariant: EvidenceLatencyVariant;
  readonly worldClockTick: number;
  readonly actorInternalState: ActorInternalState;
  readonly eventSequence: number;
}

export type EvidenceId = string;
export type EvidenceSourceType =
  | "pnt_telemetry"
  | "field_report"
  | "radio_timing"
  | "satellite_isr"
  | "ground_recon"
  | "route_pattern"
  | "cross_source_analysis";
export type EvidenceDirection = "supports_targeted" | "supports_nonhostile" | "ambiguous";
export type EvidenceStrengthBand = "weak" | "moderate" | "strong";
export type EvidenceRequestKind =
  | "focused_pnt_analysis"
  | "broad_pnt_sweep"
  | "field_radio_corroboration"
  | "ground_liaison";

export interface EvidenceRequest {
  readonly requestId: string;
  readonly requestKind: EvidenceRequestKind;
  readonly targetCorridorId?: CorridorId;
  readonly relevantHypothesisIds?: readonly string[];
}

export interface EvidenceHiddenProvenance {
  readonly worldId: WorldId;
  readonly relation: "primary" | "decoy_linked" | "background_noise" | "other";
}

export interface EvidenceInstance {
  readonly evidenceId: EvidenceId;
  readonly sourceType: EvidenceSourceType;
  readonly requestKind: EvidenceRequestKind;
  readonly observedCorridorId: CorridorId | null;
  readonly direction: EvidenceDirection;
  readonly strengthBand: EvidenceStrengthBand;
  readonly latencyVariant: EvidenceLatencyVariant;
  readonly qualityLabelVisible: string;
  readonly limitationVisible: string;
  readonly relevantHypothesisIds: readonly string[];
  readonly hiddenProvenance: EvidenceHiddenProvenance;
}

export type PlayerVisibleEvidence = Omit<EvidenceInstance, "hiddenProvenance">;
export interface PublicModelEvent {
  readonly eventId: string;
  readonly eventKind: string;
  readonly worldClockTick: number;
}

export interface PlayerObservableState {
  readonly worldClockTick: number;
  readonly visibleEvidence: readonly PlayerVisibleEvidence[];
  readonly publicEvents: readonly PublicModelEvent[];
}

export type ResponseIntensity = "low" | "medium" | "high";
export interface ActorVisibleSignals {
  readonly routeHardened: boolean;
  readonly groundReconVisible: boolean;
  readonly fallbackActivated: boolean;
  readonly priorityConvoyConcentration: boolean;
  readonly networkCoverageWeak: boolean;
  readonly containmentVisible: boolean;
  readonly executedResponseIntensity: ResponseIntensity;
  readonly leastProtectedCorridorId: CorridorId | null;
  readonly visibleRerouteCorridorIds: readonly CorridorId[];
}

export interface ActorObservableState {
  readonly worldClockTick: number;
  readonly signals: ActorVisibleSignals;
  readonly publicEvents: readonly PublicModelEvent[];
}

export interface ActorReaction {
  readonly reactionId: ActorReactionId;
  readonly ruleId: "CD-1" | "CD-2" | "CD-3" | "DD-1" | "DD-2" | "DD-3" | "OI-1" | "OI-2" | "OI-3" | "PE-1" | "PE-2" | "PE-3" | "PE-4";
  readonly observationsUsed: readonly string[];
  readonly statePatch: Partial<ActorInternalState>;
  readonly generatedEventKinds: readonly string[];
  readonly secondaryCorridorId?: CorridorId;
}

export type PhaseId = "A" | "B" | "C" | "D";
export type RoundId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DecisionWindowId =
  | "A1_baseline_monitoring"
  | "A2_prebelief"
  | "A2_evidence_acquisition"
  | "A2_postbelief"
  | "B1_monitoring_allocation"
  | "B2_route_policy"
  | "B_reason"
  | "C1_support_and_checkpoints"
  | "C2_resource_portfolio"
  | "C_reason"
  | "C_belief_checkpoint"
  | "D1_crisis_response"
  | "D_final_belief"
  | "D2_final_delivery_policy"
  | "D_reason";

export interface DecisionIntent {
  readonly phaseId: PhaseId;
  readonly roundId: RoundId;
  readonly decisionWindowId: DecisionWindowId;
  readonly actionId: string;
}

export type CauseEventId = string;
export type ModelEventSource = "player" | "world" | "actor" | "evidence_engine";
export type Scenario5ModelEventKind =
  | "decision_confirmed"
  | "user_cost_registered"
  | "world_clock_advanced"
  | "world_transition_registered"
  | "player_visible_signal_derived"
  | "actor_visible_signal_derived"
  | "actor_reaction_resolved"
  | "conditional_inject_registered"
  | "evidence_generated"
  | "observable_state_updated";

export interface Scenario5ModelEvent {
  readonly eventId: string;
  readonly causeEventId: CauseEventId;
  readonly eventKind: Scenario5ModelEventKind;
  readonly worldClockTick: number;
  readonly source: ModelEventSource;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface AdjudicationInput {
  readonly trueState: TrueWorldState;
  readonly decisionIntent: DecisionIntent;
  readonly actorVisibleSignals: ActorVisibleSignals;
  readonly visibleEvidence: readonly EvidenceInstance[];
  readonly evidenceRequests?: readonly EvidenceRequest[];
  readonly playerPublicEvents?: readonly PublicModelEvent[];
  readonly actorPublicEvents?: readonly PublicModelEvent[];
  readonly userCostKinds?: readonly string[];
  readonly worldTransitionKinds?: readonly string[];
  readonly playerVisibleSignalKinds?: readonly string[];
  readonly conditionalInjectKinds?: readonly string[];
}

export interface AdjudicationResult {
  readonly trueState: TrueWorldState;
  readonly events: readonly Scenario5ModelEvent[];
  readonly generatedEvidence: readonly EvidenceInstance[];
  readonly actorReaction: ActorReaction;
  readonly playerObservableState: PlayerObservableState;
  readonly actorObservableState: ActorObservableState;
}

export interface HiddenAuditRecord {
  readonly worldId: WorldId;
  readonly seed: Scenario5Seed;
  readonly eventSequence: number;
  readonly causeEventId: CauseEventId;
  readonly hiddenEventKind: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
