import type {
  ActorVisibleSignals,
  AdjudicationResult,
  CorridorId,
  DecisionWindowId,
  EvidenceInstance,
  EvidenceRequest,
  EvidenceRequestKind,
  PhaseId,
  PressureBand,
  RoundId,
  Scenario5Seed,
  TrueWorldState,
  WorldId,
} from "../index";

export type MissionConvoyId = "alpha" | "beta" | "gamma" | "delta";
export type MissionConvoyStatus = "moving" | "held" | "delivered" | "compromised";

export interface MissionResourceState {
  readonly isrCapacity: number;
  readonly supportReserve: number;
}

export interface MissionConvoyState {
  readonly convoyId: MissionConvoyId;
  readonly corridorId: CorridorId;
  readonly baselineArrivalMinute: number;
  readonly deadlineMinute: number;
  readonly integrity: number;
  readonly delayMinutes: number;
  readonly pntExposure: number;
  readonly fallbackNav: boolean;
  readonly routeHardened: boolean;
  readonly groundSupport: boolean;
  readonly escortedUntilRound: RoundId | null;
  readonly temporaryProtectionLevel: -1 | 0 | 1 | 2;
  readonly temporaryProtectionUntilRound: RoundId | null;
  readonly deliveredAtMinute: number | null;
  readonly status: MissionConvoyStatus;
}

export interface PendingEvidenceRequest {
  readonly request: EvidenceRequest;
  readonly dueWorldTick: number;
}

export type OperationalAttributionStatus = "unresolved" | "resolved";

export interface Scenario5MissionEvent {
  readonly eventId: string;
  readonly causeEventId: string;
  readonly roundId: RoundId;
  readonly worldClockMinute: number;
  readonly eventKind: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface Scenario5MissionState {
  readonly missionModelVersion: string;
  readonly trueWorldState: TrueWorldState;
  readonly worldClockMinutes: number;
  readonly currentRound: RoundId;
  readonly completed: boolean;
  readonly resources: MissionResourceState;
  readonly convoys: readonly MissionConvoyState[];
  readonly visibleEvidence: readonly EvidenceInstance[];
  readonly pendingEvidenceRequests: readonly PendingEvidenceRequest[];
  readonly operationalAttributionStatus: OperationalAttributionStatus;
  readonly missionEvents: readonly Scenario5MissionEvent[];
}

export type MissionActionId =
  | "a1_network_baseline"
  | "a1_priority_focus"
  | "a1_rotating_watch"
  | "a1_preserve_reserve"
  | "a2_focused_pnt"
  | "a2_broad_sweep"
  | "a2_field_radio"
  | "a2_ground_liaison"
  | "b1_suspect_focus"
  | "b1_priority_cargo"
  | "b1_split_attention"
  | "b1_pulse_network"
  | "b2_continue_crosscheck"
  | "b2_reroute"
  | "b2_staged_checkpoints"
  | "b2_hold_verify"
  | "c1_fallback_nav"
  | "c1_ground_recon"
  | "c1_checkpoint_spacing"
  | "c1_preserve_mobile_reserve"
  | "c2_isr_heavy"
  | "c2_mobility_heavy"
  | "c2_balanced"
  | "c2_priority_surge"
  | "d1_emergency_reroute"
  | "d1_ground_containment"
  | "d1_deception_routing"
  | "d1_escorted_continuation"
  | "d1_hold_confirm"
  | "d2_critical_delivery_surge"
  | "d2_network_balanced_finish"
  | "d2_resilient_handoff"
  | "d2_continuity_first_finish";

export interface MissionActionSelection {
  readonly actionId: MissionActionId;
  readonly targetCorridorId?: CorridorId;
}

export type MissionActionTarget = "none" | "required" | "fixed_alpha";
export type MissionResponseIntensity = "low" | "medium" | "high";
export type MissionDelayEffect =
  | { readonly kind: "none" }
  | { readonly kind: "target"; readonly minutes: number }
  | { readonly kind: "all"; readonly minutes: number }
  | { readonly kind: "continuity_finish" };

export interface MissionEvidenceSpec {
  readonly requestKind: EvidenceRequestKind;
  readonly timing: "immediate" | "pending";
  readonly target: "none" | "effective_target";
}

export interface MissionActionConfig {
  readonly actionId: MissionActionId;
  readonly roundId: RoundId;
  readonly phaseId: PhaseId;
  readonly decisionWindowId: DecisionWindowId;
  readonly target: MissionActionTarget;
  readonly isrCost: number;
  readonly supportCost: number;
  readonly durationMinutes: number;
  readonly delayEffect: MissionDelayEffect;
  readonly evidence: MissionEvidenceSpec | null;
  readonly responseIntensity: MissionResponseIntensity;
  readonly activatesFallback: boolean;
  readonly hardensRoute: boolean;
  readonly groundReconVisible: boolean;
  readonly containmentVisible: boolean;
  readonly priorityConvoyConcentration: boolean;
  readonly visibleReroute: boolean;
  readonly grantsGroundSupport: boolean;
  readonly holdsForStep: boolean;
  readonly escortThroughRound: RoundId | null;
  readonly temporaryProtection: "none" | "all_level_2" | "all_level_1_round7" | "priority_surge" | "all_level_1_round8";
}

export type Scenario5EndStateId =
  | "critical_cargo_lost_or_compromised"
  | "priority_delivered_network_degradation"
  | "mission_incomplete_continuity_preserved"
  | "delivery_complete_threat_persistent"
  | "delivery_complete_attribution_unresolved"
  | "delivery_complete_threat_contained";

export interface Scenario5EndState {
  readonly endStateId: Scenario5EndStateId;
  readonly networkContinuityPercent: 0 | 25 | 50 | 75 | 100;
  readonly threatContained: boolean;
}

export interface MissionStepResult {
  readonly state: Scenario5MissionState;
  readonly structuralResult: AdjudicationResult;
  readonly emittedMissionEvents: readonly Scenario5MissionEvent[];
  readonly endState: Scenario5EndState | null;
}

export interface OperationalImpact {
  readonly delayMinutes: number;
  readonly pntExposure: number;
  readonly integrityDamage: number;
}

export interface OperationalImpactInput {
  readonly convoy: MissionConvoyState;
  readonly pressure: PressureBand;
  readonly roundId: RoundId;
  readonly secondary: boolean;
}

export interface ValidatedMissionAction {
  readonly config: MissionActionConfig;
  readonly effectiveTargetCorridorId: CorridorId | null;
}

export interface MissionReplayInput {
  readonly worldId: WorldId;
  readonly seed: Scenario5Seed;
  readonly selections: readonly MissionActionSelection[];
}

export interface DerivedActorSignals {
  readonly signals: ActorVisibleSignals;
  readonly protectionScores: Readonly<Record<CorridorId, number>>;
}
