export type RedIntent =
  | "probe"
  | "coercion"
  | "intelligence_collection"
  | "alliance_fracture"
  | "benign_ambiguous";

export type RedIntentEstimate =
  | "likely_probe"
  | "likely_coercion"
  | "likely_intelligence"
  | "likely_alliance_fracture"
  | "likely_benign"
  | "uncertain";

export type TrueIncidentAttribution = "red" | "non_red" | "mixed";

export interface ScenarioOneState {
  move: 1 | 2 | 3;
  visible: {
    missionContinuity: number;
    situationAwareness: number;
    escalationPressure: number;
    operationalReadiness: number;
    coalitionCohesion: number;
    informationExposure: number;
    strategicLegitimacy: number;
  };
  resources: {
    ssaCapacity: number;
    protectiveCapacity: number;
    politicalCapital: number;
    disclosureBudget: number;
  };
  knowledge: {
    systemAttributionConfidence: number;
    playerAttributionEstimate?: number;
    playerAttributionEstimatePreMove2?: number;
    playerAttributionEstimatePostMove2?: number;
    playerAttributionEstimateFinal?: number;
    redIntentEstimate?: RedIntentEstimate;
    evidenceIds: string[];
    evidenceContradictionLevel?: number;
    technicalFaultProbability?: number;
  };
  hidden: {
    trueRedIntent: RedIntent;
    redRiskAppetite: number;
    redPerceptionBlueResolve: number;
    redPerceptionBlueEscalation: number;
    allyTrust: number;
    commercialTrust: number;
    trueIncidentAttribution: TrueIncidentAttribution;
    move2IncidentCause?: Move2IncidentCause;
    redConfidenceBlueWillEscalate?: number;
    move3ImpactSeverity?: Move3ImpactSeverity;
  };
  flags: Record<string, boolean>;
}

export type Move2IncidentCause =
  | "red_reversible_interference"
  | "technical_fault"
  | "environmental_or_external"
  | "mixed_cause";

export interface CognitiveWeights {
  informationSeeking: number;
  escalationSensitivity: number;
  resourceDiscipline: number;
  adversaryModeling: number;
  secondOrderThinking: number;
  coalitionOrientation: number;
  reversibilityPreference: number;
  cognitiveFlexibility?: number;
}

export type DecisionWindowId =
  | "m1_information"
  | "m1_protection"
  | "m1_communication"
  | "m1_reason"
  | "m2_investigation"
  | "m2_mission"
  | "m2_response"
  | "m2_reason"
  | "m3_threshold"
  | "m3_coa"
  | "m3_info"
  | "m3_offramp"
  | "m3_reason";

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  weights?: Partial<CognitiveWeights>;
}

export interface ScenarioOneDecisionRecord {
  moveId: "move_1" | "move_2" | "move_3";
  windowId: DecisionWindowId;
  selectedOptionId: string;
  firstSelectedOptionId: string;
  changeCount: number;
  responseTimeMs: number;
  stateBefore: ScenarioOneState;
  stateAfter: ScenarioOneState;
  resourcesBefore: ScenarioOneState["resources"];
  resourcesAfter: ScenarioOneState["resources"];
}

export interface RedObservation {
  visibleProtection: number;
  blueResolveSignal: number;
  blueEscalationSignal: number;
  publicPressure: number;
  privateCommunication: boolean;
  coalitionSignal: number;
}

export type RedMove1Action =
  | "continue_approach"
  | "slow_approach"
  | "hold_position"
  | "send_routine_explanation"
  | "break_off";

export type AllyAction =
  | "no_action"
  | "request_more_information"
  | "quiet_support"
  | "public_support"
  | "distance_from_blue";

export type CommercialAction =
  | "no_new_data"
  | "offer_followup_data"
  | "warn_about_public_release";

export interface RedObservationMove2 extends RedObservation {
  fallbackVisible: number;
  missionReconfigurationVisible: number;
  formalAccusationLevel: number;
  defensiveAuthoritySignal: number;
  offRampSignal: number;
}

export type RedMove2Action =
  | "maintain_pressure"
  | "reduce_proximity"
  | "introduce_second_asset"
  | "continue_ambiguous_activity"
  | "issue_denial"
  | "offer_mutual_separation"
  | "pause_and_observe";

export type AllyMove2Action =
  | "request_more_evidence"
  | "share_partial_intel"
  | "quiet_support"
  | "support_joint_message"
  | "reject_public_attribution"
  | "propose_deconfliction";

export type CommercialMove2Action =
  | "offer_followup_data"
  | "partial_data_only"
  | "pause_sensitive_sharing"
  | "neutral_public_statement";

export interface Move2Snapshot {
  moveId: "move_2";
  startedAt: string;
  completedAt: string;
  stateBefore: ScenarioOneState;
  stateAfter: ScenarioOneState;
  attributionEstimatePre: number;
  attributionEstimatePost: number;
  decisions: ScenarioOneDecisionRecord[];
  evidenceSeen: string[];
  redAction: RedMove2Action;
  allyAction: AllyMove2Action;
  commercialAction: CommercialMove2Action;
  injectsTriggered: string[];
  actorObservations: {
    redObserved: RedObservationMove2;
  };
  rngSeed: string;
  previousMoveSnapshotRef: string;
}

export type Move3ImpactSeverity = "limited" | "significant" | "severe";

export interface FinalBlueObservation extends RedObservationMove2 {
  finalResolveSignal: number;
  finalEscalationSignal: number;
  coalitionUnitySignal: number;
  publicAttributionLevel: number;
  missionResilienceSignal: number;
}

export type RedMove3Action =
  | "deescalate_and_separate"
  | "accept_interim_offramp"
  | "maintain_ambiguous_pressure"
  | "deny_and_hold"
  | "increase_non_destructive_pressure"
  | "exploit_coalition_friction"
  | "pause_for_assessment";

export type AllyFinalAction =
  | "support_controlled_response"
  | "support_deconfliction"
  | "request_restraint"
  | "distance_from_public_claim"
  | "quiet_support";

export type FinalEndState =
  | "calm_crisis_control"
  | "costly_deterrence"
  | "persistent_ambiguity"
  | "coalition_fracture"
  | "escalation_spiral"
  | "intelligence_failure"
  | "negotiated_deescalation"
  | "strategic_information_opportunity"
  | "mixed_crisis_containment";

export interface FinalMetrics {
  missionOutcomeScore: number;
  informationQualityScore: number;
  escalationControlScore: number;
  coalitionOutcomeScore: number;
  resourceSustainabilityScore: number;
  informationDisciplineScore: number;
  strategicLegitimacyScore: number;
  resilienceScore: number;
  reversibilityScore: number;
  decisionCoherenceScore: number;
  attributionCalibrationScore: number;
}

export interface Move3Snapshot {
  moveId: "move_3";
  startedAt: string;
  completedAt: string;
  stateBefore: ScenarioOneState;
  stateAfter: ScenarioOneState;
  playerAttributionEstimateFinal: number;
  actionThresholdChoice: string;
  crisisCoa: string;
  informationPolicy: string;
  offRampChoice?: string;
  decisions: ScenarioOneDecisionRecord[];
  evidenceSeen: string[];
  redAction: RedMove3Action;
  allyAction: AllyFinalAction;
  commercialAction: string;
  injectsTriggered: string[];
  finalObservableSignal: FinalBlueObservation;
  rngSeed: string;
}

export interface ScenarioOneFinalSnapshot {
  runId: string;
  scenarioId: string;
  runSeed: string;
  move1: MoveSnapshot;
  move2: Move2Snapshot;
  move3: Move3Snapshot;
  finalState: ScenarioOneState;
  primaryEndState: FinalEndState;
  secondaryOutcomeTags: string[];
  finalMetrics: FinalMetrics;
  playerFacingReport: Array<{ title: string; text: string }>;
  hiddenAarData: {
    trueRedIntent: RedIntent;
    trueIncidentAttribution: TrueIncidentAttribution;
    move2IncidentCause?: Move2IncidentCause;
    redPerceptionTimeline: unknown[];
    evidenceTruthMap: Record<string, unknown>;
  };
  completedAt: string;
}

export interface MoveSnapshot {
  moveId: "move_1";
  startedAt: string;
  completedAt: string;
  stateBefore: ScenarioOneState;
  stateAfter: ScenarioOneState;
  decisions: ScenarioOneDecisionRecord[];
  evidenceSeen: string[];
  redAction: RedMove1Action;
  allyAction: AllyAction;
  commercialAction: CommercialAction;
  injectsTriggered: string[];
  actorObservations: {
    redObserved: RedObservation;
  };
  rngSeed: string;
}
