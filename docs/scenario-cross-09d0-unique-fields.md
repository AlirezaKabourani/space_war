# Phase 09D-0: scenario-only fields and category boundaries

STATUS: READ-ONLY AUDIT FAIL (strict untouched-workspace baseline); extraction PASS. Concurrent changes are detailed in the audit report and manifest. “Only” means absent as the corresponding field in the other CURRENT cognitive result; it does not claim that a similar real-world concept cannot occur in that scenario. S1=id=4; S2=id=5. No mission result has been renamed as a cognitive construct.

## Cognitive constructs

| Actual field | Classification | Other-scenario fact | Exact references |
| --- | --- | --- | --- |
| S1 scores.informationDiscipline | Measured cognitive proxy: claim/disclosure proportionality to visible evidence | S2 constructs.informationDiscipline exists with literal type/value null; displayed once as unmeasured, not 0 | S1 cognitiveEngineV3.ts:283-293,372; S2 cognitive/types.ts:167 and cognitiveEngine.ts:442 |
| S1 scores.coalitionOrientation | Measured signed-relative coalition behavior rescaled by engine to 0..100 | S2 result/profile contract has no coalitionOrientation property | S1 cognitiveEngineV3.ts:294,374; S2 cognitive/types.ts:111-124,162-174 |
| S1 attribution evidence-responsive updating vs S2 targeted-interference updating | Shared-name candidate with distinct estimand and evidence context | Both measured where eligible, but no semantic equivalence conclusion | Formula comparison ERU and exact evidenceScoring source |
| S2 fourth phase orientation.phaseScores[3] | Fourth phase-specific cognitive orientation | S1 has exactly three perMove properties; ordinal table placement does not establish equivalent stages | S2 cognitive/types.ts:154-160; S1 CognitiveModelV3Result:218 |

S2 nine measured 0..100 constructs: informationSeeking, secondOrderThinking, adversaryModeling, escalationSensitivity, evidenceResponsiveUpdating, resourceStewardship, planningForesight, multiDomainIntegration, decisionCoherence. RiskPosture is a tenth measured signed construct, shown separately. InformationDiscipline is intentionally unmeasured; coalitionOrientation is absent. “Nine measured” refers to the nine meter constructs, not nine total measured properties.

## S1-only cognitive auxiliary and descriptive outputs

Paths below are relative to `finalSnapshot.cognitiveScoresV3 as CognitiveModelV3Result`; declared return type is strong while the snapshot wrapper is optional/unvalidated. All exact declared leaves, optional parents and arrays are in the CSV.

| Path(s) | Category and scale | Existing computation / availability / display |
| --- | --- | --- |
| orientation.markerPercent | Graph coordinate, number|null, 0..100 | (overall+1)*50; null when overall null. S2 computes coordinate in renderer rather than storing it. Not another score. |
| orientation.dispersionLabel; orientation.interpretation | Categorical explanation strings | Existing S1 rules over OSI, integration and dispersion; strings even when insufficient. S2 has numeric SD but no returned label/interpretation fields. |
| versions.anchorTestVersion | Scientific-method metadata | s4-anchor-first-options-v1. No S2 result counterpart. |
| perWindow and [].windowId/optionId/adjustedOsi/operationalLoading/strategicLoading/diagnosticWeight/evidenceCoverage | Cognitive calculation trace, not extra construct | Latest core window entries; relative OSI [-1,1], O/S [0,1], weight .55..1.20, coverage [0,1]|null. S2 exposes pure helpers but returns no per-decision contribution array. This audit does not reconstruct S2 contributions. |
| attribution.evidenceAlignment[].phase/score; meanEvidenceAlignment | Descriptive belief/evidence alignment, 0..100|null mean | 100-abs(playerEstimate-systemEvidenceConfidence), mean of existing estimates. Not hidden-truth accuracy. |
| attribution.evidenceUpdatingAudit[] | Cognitive ERU calculation audit | phaseBefore/After, playerBefore/After, evidenceBefore/After, dP/dE, directionAgreement, magnitudeAlignment, weight, rawScore, finalContribution. Full exact types/formulas below and in formula comparison. Empty with <2 records. |
| responseProcess.flags.*; activeFlags[]; status | Descriptive response-process flags | uniform_option_position, very_low_active_time, zero_evidence_engagement, invariant_attribution, minimal_revision, rapid_straightlining. Status normal/caution depends on count, not participant ability or scientific validation. No S2 returned equivalent. |
| missingReasons[] | Coverage diagnostics | Names of components <100; emitted attributionCompleteness differs from result component name attributionEstimates. No S2 equivalent. |
| timing.totalEvidenceDwellMs | Descriptive time, nonnegative ms, 0 on no timelines | Sums all input telemetry evidenceOpenTimeline activeDwellMs??0; UI seconds to 1dp. S2 has raw per-open dwell, no returned total. |
| timing.longestDecision?.windowId/activeDecisionMs; shortestDecision?.windowId/activeDecisionMs | Descriptive extremal time | Present core timings sorted ascending; optional when empty, not null-valued leaf. Implementation returns original telemetry objects, so serialized runtime values can contain additional fields beyond the narrow declared summary. |
| timing.firstToFinalChanges[] and windowId/first?/final | Descriptive revision list | First truthy option differs from final, not every selection change. S2 returns count/rate summaries but no such list. |

References: `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:145-235,249-395`; `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1064-1277`. Complete exact S1 return declarations:


Source `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:145` (through 159):

```ts
export interface EvidenceUpdateAuditV3 {
  phaseBefore: AttributionEstimateTelemetryV3["phase"];
  phaseAfter: AttributionEstimateTelemetryV3["phase"];
  playerBefore: number;
  playerAfter: number;
  evidenceBefore: number;
  evidenceAfter: number;
  dP: number;
  dE: number;
  directionAgreement: number;
  magnitudeAlignment: number;
  weight: number;
  rawScore: number;
  finalContribution: number;
}
```


Source `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:216` (through 235):

```ts
export interface CognitiveModelV3Result {
  versions: { measurementModelVersion: typeof COGNITIVE_MODEL_VERSION; formulaVersion: typeof COGNITIVE_FORMULA_VERSION; optionProfileVersion: typeof OPTION_PROFILE_VERSION; scenarioContentVersion: typeof SCENARIO_CONTENT_VERSION; expertPanelVersion: typeof EXPERT_PANEL_VERSION; anchorTestVersion: typeof ANCHOR_TEST_VERSION };
  orientation: { overall: number | null; markerPercent: number | null; perMove: { move1: number | null; move2: number | null; move3: number | null }; operationalStrength: number | null; strategicStrength: number | null; integration: number | null; dispersion: number | null; dispersionLabel: string; interpretation: string };
  scores: Record<"informationSeeking" | "secondOrderThinking" | "adversaryModeling" | "escalationSensitivity" | "informationDiscipline" | "evidenceResponsiveUpdating" | "coalitionOrientation" | "resourceStewardship" | "planningForesight" | "multiDomainIntegration" | "riskPosture" | "decisionCoherence", number | null>;
  dataCompleteness: { overall: number; components: { coreDecisionRecords: number; timingIntegrity: number; evidenceTelemetry: number; attributionEstimates: number; reasonCapture: number } };
  timing: { medianActiveDecisionMs: number | null; iqrActiveDecisionMs: number | null; totalEvidenceDwellMs: number; longestDecision?: { windowId: string; activeDecisionMs: number }; shortestDecision?: { windowId: string; activeDecisionMs: number }; totalRevisions: number; revisedWindows: number; firstToFinalChanges: Array<{ windowId: string; first?: string; final: string }>; evidenceTriggeredRevisionRate: number | null };
  attribution: { evidenceAlignment: Array<{ phase: string; score: number }>; meanEvidenceAlignment: number | null; evidenceUpdatingAudit: EvidenceUpdateAuditV3[] };
  responseProcess: { flags: ResponseProcessFlags; activeFlags: Array<keyof ResponseProcessFlags>; status: "normal" | "caution" };
  perWindow: Array<{ windowId: string; optionId: string; adjustedOsi: number | null; operationalLoading: number; strategicLoading: number; diagnosticWeight: number; evidenceCoverage: number | null }>;
  missingReasons: string[];
}

export interface ResponseProcessFlags {
  uniform_option_position: boolean;
  very_low_active_time: boolean;
  zero_evidence_engagement: boolean;
  invariant_attribution: boolean;
  minimal_revision: boolean;
  rapid_straightlining: boolean;
}
```


## S1 dashboard material outside the cognitive result

| Actual input/path and visible label | Category / exact type / unit | Behavior / truth boundary / source |
| --- | --- | --- |
| finalSnapshot.primaryEndState; END_STATE_LABELS_FA | Mission outcome: FinalEndState string union | «وضعیت پایانی». Not cognitive success. `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1181`; scenario-four/model/types.ts:301-324,347-378 |
| finalSnapshot.move2.attributionEstimatePre/Post; move3.playerAttributionEstimateFinal | Descriptive self-reported beliefs, number 0..100 | «مسیر اطمینان انتساب»: three points, no imputation or correctness inference; direct selected estimates, not confidence intervals. UI:1184-1191 |
| move1/2/3.evidenceSeen string[] | Descriptive evidence engagement | Deduplicated union count displayed as «شواهد بازشده»; distinct from cognitive evidenceCoverage numerator. UI:1089-1093,1177 |
| records[].windowId; telemetryV3?.activeDecisionMs ?? responseTimeMs; changeCount | Descriptive decision time/revisions | Bar max=max(all active/fallback times,1), width=max(4,time/max*100); seconds/1000 1dp; per-row revision count. Records passed into dashboard can include additional offramp decision; the UI's max/all map is broader than engine's nine core-window filter. UI:1088,1194-1203 |
| finalSnapshot.finalState.resources.{ssaCapacity,protectiveCapacity,politicalCapital,disclosureBudget} | Scenario resource state, four number capacities on 0..100 display scale | Labels «ظرفیت SSA»، «ظرفیت حفاظتی»، «سرمایه سیاسی»، «ظرفیت افشای امن». Actual selected start baseline 85/85/85/75. Values are not scientific country-capacity measurements. UI:1108-1122,1207-1263; initialState.ts:3-18 |
| minimumFinalResource | Derived resource telemetry, min raw final capacity | «کمترین ذخیره پایانی», not resourceStewardship cognitive score. UI:1119,1209 |
| mostPressuredResource | Derived resource telemetry, resource identifier | Sort value/current state resourceBaseline; take first; «پرفشارترین منبع». This is a resource-pressure diagnostic, not a participant ranking. UI:1116-1118,1210 |
| anyCriticalResource | Derived resource telemetry, boolean | any RAW final capacity<30; «ورود به سطح بحرانی». Different from cognitive stewardship penalty (<20% direct-cost shadow baseline); no new audit threshold. UI:1120,1211 |
| finalState.resourceAccounting.userSpent/recovered, four fields each | Resource accounting, number units | UI sums values (fallback missing object ->{}), «مصرف مستقیم انتخاب‌ها»/«بازیابی بین مراحل». Values include resource accounting model facts, not separate cognitive metrics. UI:1121-1122,1212-1213 |
| move1.stateBefore.resources, move1.stateAfter.resources, move2.stateAfter.resources, move3.stateAfter.resources | Four-point resource trajectories per resource | «شروع»، «پس از مرحله ۱/۲/۳»; displayed raw /100, bar width value%, delta=current-previous, initial delta=0 with initial label. Four resources × four points, no aggregation across users/scenarios. UI:1215-1249 |
| resourceEvents[].resource/delta/rationale (also id/moveId/kind/source/sourceDecisionId?/sourceActorId?/before/after/timestamp) | Descriptive causal resource trace | Filter by resource, signed delta + rationale; kinds user_cost/actor_recovery/transition_recovery. Cognitive S1 stewardship reads ONLY user_cost; dashboard explanatory trace shows all kinds. UI:1251-1262; model/types.ts:180-193 |
| finalSnapshot.oldOSI; calculateOrientationV2(all,...) | Legacy/admin diagnostics | Admin-only V2/oldOSI display; not current V3 result, not substituted into cross-scenario score. UI:1081,1269 |
| CONSTRUCT_DISTRIBUTION_AUDIT_V3 | Model QA metadata | Seeded reference distribution warnings, not penalties or a live-user result. Admin-only disclosure. UI:1273; cognitiveOptionProfilesV3.ts:10-27 |
| finalSnapshot.decisionTelemetryV3 | Raw descriptive/scoring-input records | Admin-only JSON disclosure; no new metrics inferred by this audit. UI:1277 |
| finalSnapshot.finalMetrics.* | Mission/adjudication metrics, not V3 scores | missionOutcomeScore, informationQualityScore, escalationControlScore, coalitionOutcomeScore, resourceSustainabilityScore, informationDisciplineScore, strategicLegitimacyScore, resilienceScore, reversibilityScore, decisionCoherenceScore, attributionCalibrationScore. Similar labels do not make these the twelve cognitive scores. model/types.ts:312-324 |
| hiddenAarData; calculateAttributionBrier(estimate,truth) | Post-game truth/calibration diagnostic | Binary truth maps non_red→0, red/mixed→1; probability=clamp(estimate/100); Brier=(p-outcome)^2, reference=.25, skill=1-Brier/reference. Null when estimate missing. Separately displayed in AAR, not Cognitive V3. cognitiveEngineV3.ts:397-429; UI:2081,2799 onward |

## S2-only result metadata and scenario descriptive/mission material

| Actual input/path | Category / contract / unit | Availability / boundary |
| --- | --- | --- |
| result.cognitive.scenarioId; runId | Explicit identity metadata | S1 inner CognitiveModelV3Result lacks these but wrapper/telemetry have IDs. S2 current-run gate checks these; literal scenarioId s5_silent_waves_redesign. |
| result.cognitive.reasonModelVersion; validityStatus | Model metadata | Separate S2 reason stamp and experimental_pending_expert_and_human_validation status. S1 has no such inner properties. |
| orientation.phaseScores[0..3] | Four-stage cognitive orientation | A/B/C/D, four signed values; no claim that first three match S1 moves. |
| runtimeState.beliefs[].checkpointId/recordedAtMs/mostLikelyCorridorId/corridorConfidence/targetedInterferenceEstimate/targetedInterferenceConfidence/visibleEvidenceIdsAtCheckpoint | Descriptive belief timeline/scoring inputs | Four checkpoint IDs; numbers are 0..100 estimates, time is runtime ms. ERU uses targetedInterferenceEstimate ONLY among belief magnitudes; corridor confidence and corridor choice are not ERU accuracy. Visible in mission/technical AAR, not nine meter scores. cognitive/types.ts:82-90; ui/presentation.ts:280-310; ScenarioFiveSummary.tsx:belief section |
| runtimeState.evidence[] and evidenceOpens[] | Public evidence and descriptive interaction | Source/direction/strength/corridor/relevance/availability; open/close/dwell runtime ms. Hidden provenance is excluded from cognitive adapter, but is disclosed separately in post-game technical AAR. cognitive/types.ts:62-80; runtime/telemetryAdapter.ts:17-58 |
| runtimeState.domainDecisionRecords[].resourcesBefore/resourcesAfter; convoy changes; world clock/effectiveTargetCorridorId/actionId | Descriptive mission decision/resource/convoy trace | 8 committed rounds, ISR/support resource units and simulated mission minutes; public action/target trace, NOT per-decision cognitive contribution. ui/presentation.ts:232-242; ScenarioFiveMissionEnding.tsx; endingPresentation.ts |
| result.domain.gnssPntAssessment | Domain truth/assessment metric | Includes truth/corridor assessment; distinct from ERU. Source runtime/domainMetrics.ts and runtime/types.ts; not a cognition score. |
| result.domain.navigationIntegrity | Domain metric | finalPntExposureByCorridor, mean/max exposure, fallback/routeHardened/groundSupport corridor IDs, compromisedConvoyCount; not cognitive information seeking or decision quality. |
| result.domain.criticalDelivery | Mission metric | Delivery, integrity, delay, arrival/deadline and Alpha-targeted spending/share; output can depend on mission truth/state. There is no convoyAlphaProtection result property. |
| result.domain.logisticsResilience | Mission metric | Continuity, delivered/on-time/fallback/hardening/ground-support counts, attribution status, ending, threat containment. |
| result.domain.delayControl | Mission metric | By-corridor final/actor/player delay and recovery minutes, totals and means. |
| result.domain.civilianImpactProxy | Descriptive domain proxy | Diversion/checkpoint/ground/hold/disruption counts, medical delay; not a cognitive trait. |
| result.domain.networkLogisticsBalance | Mission/domain distribution | Secondary integrity/delivery, continuity, mean delay/population SD, targeted attention counts/HHI; not cognitive dispersion or participant ranking. |
| result.missionEndState; trueWorldState; actor state | Mission ending / post-game truth | End-state, world ID/seed, true affected corridor/actor; not inputs passed into cognitive engine. Truth release requires complete stage. runtime/domainMetrics.ts:253-266; ui/presentation.ts:299-310 |

The result/trace source contracts below are retained without recasting mission metrics as cognitive constructs. No combined score, normalized outcome, ranking or invented cognitive contribution is produced.

## Raw input codebook: exact TypeScript fields and nullability

S1 record/telemetry fields: ISO enteredAt/confirmedAt/openedAt/recordedAt are calendar strings; elapsed/activeDecision/activeDwell/responseTime are milliseconds, optionChangeCount/changeCount integer counts; estimate/confidence/capacity fields scenario-scaled 0..100. The runtime UI activeDecisionMs excludes visibility pauses; formulas consume recorded active times. Optional fields mean undefined/absent, not 0 or null. S1 does not validate arbitrary records with a S2-style runtime schema validator.


Source `src/ui/components/scenario/scenario-four/model/types.ts:122` (through 193):

```ts
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
  resourceEvents?: ResourceEvent[];
  telemetryV3?: DecisionTelemetryV3;
}

export interface EvidenceOpenTelemetryV3 {
  evidenceId: string;
  sourceType: string;
  openedAt: string;
  closedAt?: string;
  activeDwellMs?: number;
}

export interface DecisionTelemetryV3 {
  runId: string;
  moveId: "move_1" | "move_2" | "move_3";
  windowId: DecisionWindowId;
  enteredAt: string;
  confirmedAt: string;
  elapsedMs: number;
  activeDecisionMs: number;
  firstSelectedOptionId?: string;
  finalSelectedOptionId: string;
  optionChangeCount: number;
  selectionTimeline: Array<{ optionId: string; ts: string }>;
  evidenceAvailableIds: string[];
  evidenceOpenedIds: string[];
  evidenceOpenTimeline: EvidenceOpenTelemetryV3[];
  helpOpened: boolean;
  glossaryOpened: boolean;
  playerAttributionEstimateBefore?: number;
  playerAttributionEstimateAfter?: number;
  systemAttributionConfidenceVisibleAtDecision?: number;
  statedReasonId?: string;
  statedReasonText?: string;
  resourcesBefore: ScenarioOneState["resources"];
  resourcesAfterUserAction: ScenarioOneState["resources"];
}

export interface AttributionEstimateTelemetryV3 {
  phase: "m2_pre_investigation" | "m2_post_investigation" | "m3_final";
  playerEstimate: number;
  systemEvidenceConfidence: number;
  recordedAt: string;
}

export type ResourceKey = keyof ScenarioOneState["resources"];

export interface ResourceEvent {
  id: string;
  moveId: "move_1" | "move_2" | "move_3";
  kind: "user_cost" | "actor_recovery" | "transition_recovery";
  resource: ResourceKey;
  source: string;
  sourceDecisionId?: string;
  sourceActorId?: string;
  rationale: string;
  before: number;
  delta: number;
  after: number;
  timestamp: string;
}
```


Source `src/ui/components/scenario/scenario-four/model/types.ts:347` (through 396):

```ts
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
  resourceEvents?: ResourceEvent[];
  measurementModelVersion?: "s4-cog-v3";
  formulaVersion?: "3.0.0";
  optionProfileVersion?: "s4-options-v3.1-postfix";
  scenarioContentVersion?: string;
  expertPanelVersion?: "provisional-unvalidated";
  anchorTestVersion?: "s4-anchor-first-options-v1";
  decisionTelemetryV3?: DecisionTelemetryV3[];
  attributionTelemetryV3?: AttributionEstimateTelemetryV3[];
  oldOSI?: number | null;
  cognitiveScoresV3?: Record<string, unknown>;
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
```


S2 timestamps are numeric nonnegative runtime clock milliseconds; entered/confirmed/elapsed/active/hidden may be null in telemetry. revisionCount is nonnegative integer; evidence lists may be empty; resource before/after may be null; beliefs recorded as bounded 0..100 values; reasons B/C/D carry capturedBeforeOutcome. Selection/evidence/belief/reason entries are not scores. Strong TS types do not guarantee all optional/missing telemetry has been recorded; the validator rejects specified malformed non-null records, not every possible invalid resource/enum condition.


Source `src/ui/components/scenario/scenario-five/model/cognitive/types.ts:9` (through 141):

```ts
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
```


Source `src/ui/components/scenario/scenario-five/model/cognitive/types.ts:143` (through 176):

```ts
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
```


All 41 S1 and 33 S2 option profiles, all domain loadings, S1 per-window diagnostic weights and exact reason-matrix coefficients are in scenario-cross-09d0-formula-comparison.md. They are scientific model inputs. Neither profile vector nor raw input record is an extra returned cognitive construct.

## Exact S2 domain-result declaration (mission fields, not cognitive scores)

Source `src/ui/components/scenario/scenario-five/model/runtime/types.ts:145` through line 247. These are separate `result.domain` and wrapper fields. Percentages/capacities/integrity are scenario units, delay/world-clock fields are simulated minutes, count fields are nonnegative counts, correctness/containment/delivery fields are booleans. HHI is an attention concentration descriptor. None is a participant cognitive ranking. Their domain equations are in `runtime/domainMetrics.ts`, separate from the cognitive engine.

```ts
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
```

## Unavailable counterparts

S2 does not return coalitionOrientation, markerPercent, dispersionLabel, interpretation, responseProcess, missingReasons, perWindow, ERU contribution audit, total evidence dwell or longest/shortest decision objects. It does expose raw evidence dwell, decision times and pure relative-adjustment helpers; availability of helpers is not availability of a stored contribution trace. S1 inner result lacks explicit runId/scenarioId, separate reasonModelVersion/validityStatus and S2's fourth phase. S1 wrapper IDs and model stamps remain separately inventoried. Missing fields are not inferred from another scenario or forced to 0.
