import assert from "node:assert/strict";
import {
  activeDurationFromPauses,
  adjustedOrientationForOption,
  applyOptionSelectionV3,
  calculateAttributionBrier,
  calculateCognitiveModelV3,
  calculateEvidenceUpdating,
  calculateSingleEventAttributionAccuracy,
  centerAndNormalizeWithinWindow,
  harmonicIntegration,
  interpretOrientationV3,
  markerPercentForOsi,
  populationDispersion,
  simulateRandomCognitiveRunsV3,
} from "../src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts";
import {
  COGNITIVE_OPTION_PROFILES_V3,
  COGNITIVE_WINDOWS_V3,
  CONSTRUCT_DISTRIBUTION_AUDIT_V3,
  CORE_WINDOWS_BY_MOVE,
  validateCognitiveProfilesV3,
} from "../src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { adjudicateMoveOne, applyBlueDecision, buildRedObservation } from "../src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts";
import { adjudicateMove2, applyMove2Decision, buildMove2Observation, initializeMove2Incident } from "../src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts";
import { adjudicateMove3, applyMove3Decision, buildFinalObservation, initializeMove3Severity, resolvePrimaryEndState } from "../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts";
import { buildOpponentObservationAAR } from "../src/ui/components/scenario/scenario-four/model/aarV3.ts";
import { readFileSync } from "node:fs";

const resources = { ssaCapacity: 100, protectiveCapacity: 100, politicalCapital: 100, disclosureBudget: 100 };
const moveFor = (windowId) => windowId.startsWith("m1_") ? "move_1" : windowId.startsWith("m2_") ? "move_2" : "move_3";
const record = (windowId, optionId) => ({
  moveId: moveFor(windowId), windowId, selectedOptionId: optionId, firstSelectedOptionId: optionId,
  changeCount: 0, responseTimeMs: 5000, stateBefore: {}, stateAfter: {}, resourcesBefore: resources, resourcesAfter: resources,
});
const telemetry = (windowId, optionId, opened = ["E_BASE_01", "E_BASE_02"]) => ({
  runId: "test", moveId: moveFor(windowId), windowId, enteredAt: "2026-01-01T00:00:00.000Z", confirmedAt: "2026-01-01T00:00:05.000Z",
  elapsedMs: 5000, activeDecisionMs: 4000, firstSelectedOptionId: optionId, finalSelectedOptionId: optionId,
  optionChangeCount: 0, selectionTimeline: [{ optionId, ts: "2026-01-01T00:00:01.000Z" }],
  evidenceAvailableIds: ["E_BASE_01", "E_BASE_02"], evidenceOpenedIds: opened,
  evidenceOpenTimeline: opened.map((evidenceId) => ({ evidenceId, sourceType: evidenceId === "E_BASE_01" ? "military_ssa" : "declared_profile", openedAt: "2026-01-01T00:00:01.000Z", closedAt: "2026-01-01T00:00:02.000Z", activeDwellMs: 1000 })),
  helpOpened: false, glossaryOpened: false, systemAttributionConfidenceVisibleAtDecision: 50,
  resourcesBefore: resources, resourcesAfterUserAction: resources,
});
const makeInput = (selection = (windowId, options) => options[0]) => {
  const records = Object.entries(COGNITIVE_WINDOWS_V3).map(([windowId, options]) => record(windowId, selection(windowId, options)));
  return {
    records,
    telemetry: records.map((item) => telemetry(item.windowId, item.selectedOptionId)),
    attributionEstimates: [
      { phase: "m2_pre_investigation", playerEstimate: 40, systemEvidenceConfidence: 35, recordedAt: "2026-01-01T00:01:00.000Z" },
      { phase: "m2_post_investigation", playerEstimate: 55, systemEvidenceConfidence: 55, recordedAt: "2026-01-01T00:02:00.000Z" },
      { phase: "m3_final", playerEstimate: 65, systemEvidenceConfidence: 70, recordedAt: "2026-01-01T00:03:00.000Z" },
    ],
    reasons: { move_1: "کسب اطلاعات بیشتر", move_2: "جلوگیری از تشدید", move_3: "حفظ مأموریت" },
    resourceEvents: [],
  };
};

assert.deepEqual(validateCognitiveProfilesV3(), [], "profiles must be complete and bounded");
for (const [windowId, options] of Object.entries(COGNITIVE_WINDOWS_V3)) {
  const adjusted = options.map((optionId) => adjustedOrientationForOption(windowId, optionId));
  assert.ok(adjusted.every((value) => value != null && value >= -1 && value <= 1));
  assert.ok(Math.abs(adjusted.reduce((sum, value) => sum + value, 0) / adjusted.length) < 1e-12, `${windowId} is not centered`);
}
assert.equal(centerAndNormalizeWithinWindow([.5, .5], 0), 0);
assert.ok(Math.abs(markerPercentForOsi(.1033333333) - 55.166666665) < 1e-12);
assert.equal(harmonicIntegration(80, 80), 80);
assert.equal(harmonicIntegration(90, 10), 18);
assert.equal(harmonicIntegration(20, 20), 20);
assert.ok(Math.abs(populationDispersion([.14, .19, -.02]) - .08956685895) < 1e-9);
assert.equal(interpretOrientationV3(.1, 75, .1), "رویکرد یکپارچه عملیاتی–راهبردی");
assert.equal(interpretOrientationV3(.1, 75, .2), "جهت‌گیری وابسته به موقعیت");
assert.equal(interpretOrientationV3(.1, 40, .1), "الگوی جهت‌گیری ضعیف/نامتمایز");
assert.equal(activeDurationFromPauses(0, 10_000, [{ startedAtMs: 2000, endedAtMs: 5000 }, { startedAtMs: 8000, endedAtMs: 9000 }]), 6000);

let selection = { optionChangeCount: 0, selectionTimeline: [] };
selection = applyOptionSelectionV3(selection, "a", "1");
selection = applyOptionSelectionV3(selection, "a", "2");
selection = applyOptionSelectionV3(selection, "b", "3");
assert.equal(selection.firstSelectedOptionId, "a");
assert.equal(selection.finalSelectedOptionId, "b");
assert.equal(selection.optionChangeCount, 1);

const complete = calculateCognitiveModelV3(makeInput());
const moveValues = Object.values(complete.orientation.perMove);
assert.ok(moveValues.every((value) => value != null));
assert.ok(Math.abs(complete.orientation.overall - moveValues.reduce((sum, value) => sum + value, 0) / 3) < 1e-12, "overall is not exact move mean");
assert.equal(complete.orientation.markerPercent, markerPercentForOsi(complete.orientation.overall));
assert.equal(complete.dataCompleteness.overall, 100);
assert.ok(complete.scores.secondOrderThinking >= 0 && complete.scores.secondOrderThinking <= 100);
assert.ok(complete.scores.adversaryModeling >= 0 && complete.scores.adversaryModeling <= 100);
assert.ok(complete.scores.escalationSensitivity >= 0 && complete.scores.escalationSensitivity <= 100);
assert.ok(complete.scores.informationDiscipline >= 0 && complete.scores.informationDiscipline <= 100);
assert.ok(complete.scores.evidenceResponsiveUpdating >= 0 && complete.scores.evidenceResponsiveUpdating <= 100);
assert.ok(complete.scores.planningForesight >= 0 && complete.scores.planningForesight <= 100);
assert.ok(complete.scores.multiDomainIntegration >= 0 && complete.scores.multiDomainIntegration <= 100);
assert.ok(complete.scores.riskPosture >= -1 && complete.scores.riskPosture <= 1);
assert.ok(complete.scores.decisionCoherence >= 0 && complete.scores.decisionCoherence <= 100);

const missing = calculateCognitiveModelV3({ ...makeInput(), records: makeInput().records.slice(0, 8), telemetry: [] });
assert.equal(missing.orientation.overall, null);
assert.equal(missing.dataCompleteness.components.timingIntegrity, 0);
assert.ok(missing.dataCompleteness.overall < 100);

const infoOption = "m1_i_dedicated_ssa";
const infoOnly = calculateCognitiveModelV3({ records: [record("m1_information", infoOption)], telemetry: [telemetry("m1_information", infoOption)], attributionEstimates: [], reasons: {}, resourceEvents: [] });
const profile = COGNITIVE_OPTION_PROFILES_V3[infoOption];
assert.ok(Math.abs(infoOnly.scores.informationSeeking - 100 * (.60 * profile.informationSeeking + .25 + .15)) < 1e-9, "information seeking formula mismatch");
const renderedNotOpened = calculateCognitiveModelV3({ records: [record("m1_information", infoOption)], telemetry: [telemetry("m1_information", infoOption, [])], attributionEstimates: [], reasons: {}, resourceEvents: [] });
assert.ok(renderedNotOpened.scores.informationSeeking < infoOnly.scores.informationSeeking, "rendering evidence counted as opening it");

const withRecovery = calculateCognitiveModelV3({ ...makeInput(), resourceEvents: [{ id: "r", moveId: "move_1", kind: "actor_recovery", resource: "ssaCapacity", source: "actor", rationale: "test", before: 10, delta: 90, after: 100, timestamp: "2026-01-01T00:00:00Z" }] });
assert.equal(withRecovery.scores.resourceStewardship, complete.scores.resourceStewardship, "actor recovery changed stewardship");
const withUserCost = calculateCognitiveModelV3({ ...makeInput(), resourceEvents: [{ id: "r", moveId: "move_1", kind: "user_cost", resource: "ssaCapacity", source: "choice", rationale: "test", before: 100, delta: -90, after: 10, timestamp: "2026-01-01T00:00:00Z" }] });
assert.ok(withUserCost.scores.resourceStewardship < complete.scores.resourceStewardship, "user-only shadow penalty was not applied");

assert.equal(calculateSingleEventAttributionAccuracy(100, "red"), 100);
assert.equal(calculateSingleEventAttributionAccuracy(0, "red"), 0);
assert.equal(calculateSingleEventAttributionAccuracy(undefined, "mixed"), null);
assert.deepEqual(calculateAttributionBrier(50, "non_red"), { estimate: 50, outcome: 0, brier: .25, brierReference: .25, brierSkillScore: 0 });
assert.equal(calculateAttributionBrier(50, "mixed").outcome, 1, "mixed must target role-presence y=1");
assert.equal(calculateAttributionBrier(100, "mixed").brier, 0);
assert.equal(calculateAttributionBrier(50, "red").brierSkillScore, 0);

const unchangedWeakEvidence = calculateEvidenceUpdating([
  { phase: "m2_pre_investigation", playerEstimate: 50, systemEvidenceConfidence: 50, recordedAt: "2026-01-01T00:01:00Z" },
  { phase: "m2_post_investigation", playerEstimate: 50, systemEvidenceConfidence: 52, recordedAt: "2026-01-01T00:02:00Z" },
]);
const unchangedStrongEvidence = calculateEvidenceUpdating([
  { phase: "m2_pre_investigation", playerEstimate: 50, systemEvidenceConfidence: 20, recordedAt: "2026-01-01T00:01:00Z" },
  { phase: "m2_post_investigation", playerEstimate: 50, systemEvidenceConfidence: 80, recordedAt: "2026-01-01T00:02:00Z" },
]);
assert.ok(unchangedWeakEvidence > unchangedStrongEvidence, "unchanged belief must be penalized more after strong evidence movement");
assert.ok(unchangedWeakEvidence >= 90, "barely changed evidence should not heavily penalize unchanged belief");

const coreA = calculateCognitiveModelV3(makeInput());
const coreB = calculateCognitiveModelV3(structuredClone(makeInput()));
assert.deepEqual(coreA, coreB, "same visible/user data must produce identical core scores regardless of absent hidden state");

const selectExtreme = (direction) => (_windowId, options) => options.reduce((best, current) => {
  const a = adjustedOrientationForOption(_windowId, best); const b = adjustedOrientationForOption(_windowId, current);
  return direction === "min" ? b < a ? current : best : b > a ? current : best;
});
const operational = calculateCognitiveModelV3(makeInput(selectExtreme("min")));
const strategic = calculateCognitiveModelV3(makeInput(selectExtreme("max")));
assert.ok(operational.orientation.overall < 0 && strategic.orientation.overall > 0 && operational.orientation.overall < strategic.orientation.overall);
const highHigh = calculateCognitiveModelV3(makeInput((windowId, options) => options.reduce((best, id) => {
  const p = COGNITIVE_OPTION_PROFILES_V3[id]; const b = COGNITIVE_OPTION_PROFILES_V3[best]; return Math.min(p.operationalLoading, p.strategicLoading) > Math.min(b.operationalLoading, b.strategicLoading) ? id : best;
})));
const lowWeak = calculateCognitiveModelV3(makeInput((windowId, options) => options.reduce((best, id) => {
  const p = COGNITIVE_OPTION_PROFILES_V3[id]; const b = COGNITIVE_OPTION_PROFILES_V3[best]; return p.operationalLoading + p.strategicLoading < b.operationalLoading + b.strategicLoading ? id : best;
})));
assert.ok(highHigh.orientation.integration > lowWeak.orientation.integration, "high-high path must integrate more strongly than weak path");

const monteCarlo = simulateRandomCognitiveRunsV3(100_000);
assert.ok(monteCarlo.passed, `Monte Carlo mean ${monteCarlo.osi.mean} outside tolerance`);
assert.ok(monteCarlo.constructs.multiDomainIntegration.ceilingRate <= .20, "multi-domain ceiling rate remains excessive after profile audit");
assert.deepEqual(monteCarlo.constructWarnings, CONSTRUCT_DISTRIBUTION_AUDIT_V3.warnings, "admin construct warning snapshot is stale");
assert.equal(CONSTRUCT_DISTRIBUTION_AUDIT_V3.multiDomainCeilingWarning, monteCarlo.constructs.multiDomainIntegration.ceilingRate > .20);

// Formal straight-line anchor: first option in all nine core windows, first
// reason choice, no evidence engagement, 50 -> 50 -> 50 attribution.
const anchorInput = makeInput();
anchorInput.telemetry = anchorInput.records.map((item) => ({
  ...telemetry(item.windowId, item.selectedOptionId, []),
  activeDecisionMs: 1_000,
  elapsedMs: 1_000,
  confirmedAt: "2026-01-01T00:00:01.000Z",
}));
anchorInput.attributionEstimates = [
  { phase: "m2_pre_investigation", playerEstimate: 50, systemEvidenceConfidence: 20, recordedAt: "2026-01-01T00:01:00.000Z" },
  { phase: "m2_post_investigation", playerEstimate: 50, systemEvidenceConfidence: 15, recordedAt: "2026-01-01T00:02:00.000Z" },
  { phase: "m3_final", playerEstimate: 50, systemEvidenceConfidence: 17, recordedAt: "2026-01-01T00:03:00.000Z" },
];
anchorInput.reasons = { move_1: "کسب اطلاعات بیشتر", move_2: "افزایش اطمینان درباره علت حادثه", move_3: "حفظ مأموریت" };
const straightlineAnchor = calculateCognitiveModelV3(anchorInput);
assert.ok(Math.abs(straightlineAnchor.orientation.perMove.move1 - (-.3473)) < .0001);
assert.ok(Math.abs(straightlineAnchor.orientation.perMove.move2 - (-.3654)) < .0001);
assert.ok(Math.abs(straightlineAnchor.orientation.perMove.move3 - .1354) < .0001);
assert.ok(Math.abs(straightlineAnchor.orientation.overall - (-.1924)) < .0001);
assert.ok(Math.abs(straightlineAnchor.orientation.dispersion - .23195) < .0001);
assert.ok(Math.abs(straightlineAnchor.orientation.operationalStrength - 46.15) < .02);
assert.ok(Math.abs(straightlineAnchor.orientation.strategicStrength - 46.15) < .02);
assert.ok(Math.abs(straightlineAnchor.orientation.integration - 46.15) < .02);
assert.ok(straightlineAnchor.scores.coalitionOrientation < 40);
assert.ok(straightlineAnchor.scores.informationSeeking < 50);
assert.ok(straightlineAnchor.scores.resourceStewardship <= 65);
assert.ok(straightlineAnchor.scores.planningForesight <= 60);
assert.equal(straightlineAnchor.responseProcess.flags.uniform_option_position, true);
assert.equal(straightlineAnchor.responseProcess.flags.invariant_attribution, true);
assert.equal(straightlineAnchor.responseProcess.flags.zero_evidence_engagement, true);
assert.equal(straightlineAnchor.responseProcess.flags.very_low_active_time, true);
assert.equal(straightlineAnchor.responseProcess.flags.rapid_straightlining, true);
assert.equal(straightlineAnchor.dataCompleteness.overall, 100, "response flags must not reduce data completeness");

const highOutcomeMetrics = {
  missionOutcomeScore: 85, informationQualityScore: 50, escalationControlScore: 80,
  coalitionOutcomeScore: 75, resourceSustainabilityScore: 60, informationDisciplineScore: 80,
  strategicLegitimacyScore: 75, resilienceScore: 75, reversibilityScore: 70,
  decisionCoherenceScore: 70, attributionCalibrationScore: 60,
};
const endStateBase = createInitialScenarioOneState("probe");
endStateBase.knowledge.systemAttributionConfidence = 40;
const neutralFinalChoices = { threshold: "m3_t_insufficient", coa: "m3_coa_contain_understand", informationPolicy: "m3_info_keep_restricted", reason: "حفظ مأموریت" };
assert.equal(resolvePrimaryEndState({ state: endStateBase, metrics: highOutcomeMetrics, redAction: "maintain_ambiguous_pressure", choices: neutralFinalChoices }).primary, "persistent_ambiguity");
assert.equal(resolvePrimaryEndState({ state: endStateBase, metrics: highOutcomeMetrics, redAction: "deescalate_and_separate", choices: neutralFinalChoices }).primary, "calm_crisis_control");
const proposalState = structuredClone(endStateBase); proposalState.flags.m2OffRampOfferedByBlue = true;
assert.equal(resolvePrimaryEndState({ state: proposalState, metrics: highOutcomeMetrics, redAction: "accept_interim_offramp", choices: neutralFinalChoices }).primary, "negotiated_deescalation");
const severeState = structuredClone(endStateBase); severeState.visible.escalationPressure = 80;
assert.equal(resolvePrimaryEndState({ state: severeState, metrics: highOutcomeMetrics, redAction: "increase_non_destructive_pressure", choices: neutralFinalChoices }).primary, "escalation_spiral");
const misattributionState = structuredClone(endStateBase); misattributionState.flags.m3PublicAttribution = true; misattributionState.hidden.trueIncidentAttribution = "non_red";
assert.equal(resolvePrimaryEndState({ state: misattributionState, metrics: { ...highOutcomeMetrics, informationDisciplineScore: 30 }, redAction: "deescalate_and_separate", choices: neutralFinalChoices }).primary, "intelligence_failure");

// Deterministic full-path regression: exact adjudicated state is handed to the
// next move and the hidden intent/resources/flags survive cognitive migration.
const seed = "s4-v3-regression";
const initial = createInitialScenarioOneState("probe");
const m1Choices = { information: "m1_i_dedicated_ssa", protection: "m1_p_covert_readiness", communication: "m1_c_private", reason: "کسب اطلاعات بیشتر" };
let m1Blue = initial;
const m1Records = [];
for (const [windowId, optionId] of [["m1_information", m1Choices.information], ["m1_protection", m1Choices.protection], ["m1_communication", m1Choices.communication]]) {
  const before = m1Blue; m1Blue = applyBlueDecision(m1Blue, windowId, optionId, seed); m1Records.push({ ...record(windowId, optionId), stateBefore: before, stateAfter: m1Blue, resourcesBefore: before.resources, resourcesAfter: m1Blue.resources });
}
const m1 = adjudicateMoveOne({ startedAt: "2026-01-01T00:00:00Z", stateBefore: initial, stateAfterBlue: m1Blue, decisions: m1Records, evidenceSeen: initial.knowledge.evidenceIds, choices: m1Choices, rngSeed: seed }).snapshot;
const m2Start = initializeMove2Incident(m1.stateAfter, `${seed}:m2`);
const m2Choices = { investigation: "m2_a_technical_diagnostics", mission: "m2_m_activate_fallback", response: "m2_r_request_explanation", reason: "حفظ تداوم مأموریت" };
let m2Blue = m2Start; const m2Records = [];
for (const [windowId, optionId] of [["m2_investigation", m2Choices.investigation], ["m2_mission", m2Choices.mission], ["m2_response", m2Choices.response]]) {
  const before = m2Blue; m2Blue = applyMove2Decision(m2Blue, windowId, optionId, seed); m2Records.push({ ...record(windowId, optionId), stateBefore: before, stateAfter: m2Blue, resourcesBefore: before.resources, resourcesAfter: m2Blue.resources });
}
const m2 = adjudicateMove2({ startedAt: "2026-01-01T00:10:00Z", stateBefore: m2Start, stateAfterBlue: m2Blue, attributionEstimatePre: 40, attributionEstimatePost: 55, decisions: m2Records, evidenceSeen: m2Blue.knowledge.evidenceIds, choices: m2Choices, rngSeed: `${seed}:m2`, previousMoveSnapshotRef: m1.completedAt }).snapshot;
const m3Start = initializeMove3Severity(m2.stateAfter, m2, `${seed}:m3`);
const m3Choices = { threshold: "m3_t_sufficient_limited", coa: "m3_coa_contain_understand", informationPolicy: "m3_info_share_allies", offRamp: "", reason: "حفظ مأموریت" };
let m3Blue = m3Start; const m3Records = [];
for (const [windowId, optionId] of [["m3_threshold", m3Choices.threshold], ["m3_coa", m3Choices.coa], ["m3_info", m3Choices.informationPolicy]]) {
  const before = m3Blue; m3Blue = applyMove3Decision(m3Blue, windowId, optionId); m3Records.push({ ...record(windowId, optionId), stateBefore: before, stateAfter: m3Blue, resourcesBefore: before.resources, resourcesAfter: m3Blue.resources });
}
const final = adjudicateMove3({ runId: "regression", scenarioId: "4", runSeed: seed, move1: m1, move2: m2, startedAt: "2026-01-01T00:20:00Z", stateBefore: m3Start, stateAfterBlue: m3Blue, playerAttributionEstimateFinal: 65, choices: m3Choices, decisions: m3Records, evidenceSeen: m3Blue.knowledge.evidenceIds, rngSeed: `${seed}:m3` });
assert.equal(m2.stateBefore.hidden.trueRedIntent, m1.stateAfter.hidden.trueRedIntent);
assert.equal(final.move3.stateBefore.hidden.trueRedIntent, m2.stateAfter.hidden.trueRedIntent);
assert.deepEqual(final.finalSnapshot.move1, m1);
assert.deepEqual(final.finalSnapshot.move2, m2);
assert.ok(Object.values(final.finalSnapshot.finalState.resources).every((value) => value >= 0 && value <= 100));
assert.equal(final.finalSnapshot.hiddenAarData.trueRedIntent, "probe");

const anchorSeed = "s4-anchor-first-options-v1";
const anchorInitial = createInitialScenarioOneState("probe");
const anchorM1Choices = { information: "m1_i_passive", protection: "m1_p_hold", communication: "m1_c_none", reason: "کسب اطلاعات بیشتر" };
let anchorM1State = anchorInitial; const anchorM1Records = [];
for (const [windowId, optionId] of [["m1_information", anchorM1Choices.information], ["m1_protection", anchorM1Choices.protection], ["m1_communication", anchorM1Choices.communication]]) {
  const before = anchorM1State; anchorM1State = applyBlueDecision(anchorM1State, windowId, optionId, anchorSeed);
  anchorM1Records.push({ ...record(windowId, optionId), stateBefore: before, stateAfter: anchorM1State, resourcesBefore: before.resources, resourcesAfter: anchorM1State.resources });
}
const anchorM1 = adjudicateMoveOne({ startedAt: "2026-01-01T00:00:00Z", stateBefore: anchorInitial, stateAfterBlue: anchorM1State, decisions: anchorM1Records, evidenceSeen: anchorInitial.knowledge.evidenceIds, choices: anchorM1Choices, rngSeed: anchorSeed }).snapshot;
const anchorM2Start = initializeMove2Incident(anchorM1.stateAfter, `${anchorSeed}:m2`);
const anchorM2Choices = { investigation: "m2_a_technical_diagnostics", mission: "m2_m_continue_normal", response: "m2_r_no_counteraction", reason: "افزایش اطمینان درباره علت حادثه" };
let anchorM2State = anchorM2Start; const anchorM2Records = [];
for (const [windowId, optionId] of [["m2_investigation", anchorM2Choices.investigation], ["m2_mission", anchorM2Choices.mission], ["m2_response", anchorM2Choices.response]]) {
  const before = anchorM2State; anchorM2State = applyMove2Decision(anchorM2State, windowId, optionId, anchorSeed);
  anchorM2Records.push({ ...record(windowId, optionId), stateBefore: before, stateAfter: anchorM2State, resourcesBefore: before.resources, resourcesAfter: anchorM2State.resources });
}
const anchorM2 = adjudicateMove2({ startedAt: "2026-01-01T00:10:00Z", stateBefore: anchorM2Start, stateAfterBlue: anchorM2State, attributionEstimatePre: 50, attributionEstimatePost: 50, decisions: anchorM2Records, evidenceSeen: anchorM2State.knowledge.evidenceIds, choices: anchorM2Choices, rngSeed: `${anchorSeed}:m2`, previousMoveSnapshotRef: anchorM1.completedAt }).snapshot;
const anchorM3Start = initializeMove3Severity(anchorM2.stateAfter, anchorM2, `${anchorSeed}:m3`);
const anchorM3Choices = { threshold: "m3_t_insufficient", coa: "m3_coa_contain_understand", informationPolicy: "m3_info_keep_restricted", reason: "حفظ مأموریت" };
let anchorM3State = anchorM3Start; const anchorM3Records = [];
for (const [windowId, optionId] of [["m3_threshold", anchorM3Choices.threshold], ["m3_coa", anchorM3Choices.coa], ["m3_info", anchorM3Choices.informationPolicy]]) {
  const before = anchorM3State; anchorM3State = applyMove3Decision(anchorM3State, windowId, optionId);
  anchorM3Records.push({ ...record(windowId, optionId), stateBefore: before, stateAfter: anchorM3State, resourcesBefore: before.resources, resourcesAfter: anchorM3State.resources });
}
const anchorFinal = adjudicateMove3({ runId: "anchor", scenarioId: "4", runSeed: anchorSeed, move1: anchorM1, move2: anchorM2, startedAt: "2026-01-01T00:20:00Z", stateBefore: anchorM3Start, stateAfterBlue: anchorM3State, playerAttributionEstimateFinal: 50, choices: anchorM3Choices, decisions: anchorM3Records, evidenceSeen: anchorM3State.knowledge.evidenceIds, rngSeed: `${anchorSeed}:m3` });
const anchorAar = buildOpponentObservationAAR({ move1Snapshot: anchorM1, move2Snapshot: anchorM2, move3Snapshot: anchorFinal.move3 });
const anchorVisibleText = anchorAar.flatMap((row) => row.visibleToIsrael).join(" | ");
assert.doesNotMatch(anchorVisibleText, /حفاظتی قابل مشاهده|هشدار یا فشار عمومی|هماهنگی متحدان/);
assert.equal(anchorM1.actorObservations.redObserved.visibleProtection, 0);
assert.equal(anchorM1.actorObservations.redObserved.publicPressure, 0);
assert.equal(anchorM1.actorObservations.redObserved.coalitionSignal, 0);
assert.equal(anchorM2.actorObservations.redObserved.fallbackVisible, 0);
assert.equal(anchorFinal.move3.finalObservableSignal.publicAttributionLevel, 0);
const anchorResourceUse = Object.values(anchorInitial.resources).reduce((sum, value) => sum + value, 0) - Object.values(anchorM3State.resources).reduce((sum, value) => sum + value, 0);
assert.ok(anchorResourceUse <= 30, "first-option resource consumption should remain low");

const visiblePathAar = buildOpponentObservationAAR({
  move1Snapshot: {
    ...anchorM1,
    actorObservations: { redObserved: buildRedObservation({ information: "m1_i_allied_network", protection: "m1_p_visible_protection", communication: "m1_c_private_allied", reason: "حفظ هماهنگی متحدان" }) },
  },
  move2Snapshot: {
    ...anchorM2,
    actorObservations: { redObserved: buildMove2Observation({ investigation: "m2_a_ally_intel", mission: "m2_m_activate_fallback", response: "m2_r_joint_allied_response", reason: "حفظ ائتلاف" }) },
  },
  move3Snapshot: {
    ...anchorFinal.move3,
    finalObservableSignal: buildFinalObservation({ threshold: "m3_t_sufficient_strong", coa: "m3_coa_coordinated_response", informationPolicy: "m3_info_public_attribution", reason: "انسجام ائتلاف" }, anchorM3State),
  },
});
const visiblePathText = visiblePathAar.flatMap((row) => row.visibleToIsrael).join(" | ");
assert.match(visiblePathText, /وضعیت حفاظتی قابل مشاهده/);
assert.match(visiblePathText, /هماهنگی متحدان ایران/);
assert.match(visiblePathText, /انتساب عمومی رخداد به اسرائیل/);

const playerUiSource = [
  readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("../src/ui/components/scenario/scenario-four/moves/move2.ts", import.meta.url), "utf8"),
  readFileSync(new URL("../src/ui/components/scenario/scenario-four/moves/move3.ts", import.meta.url), "utf8"),
].join("\n");
assert.doesNotMatch(playerUiSource, /تیم آبی|نیت واقعی Red|رفتار Red|نقش Red|انتساب عمومی به Red|بازیگر Red/);
assert.doesNotMatch(playerUiSource, /دقت برآورد انتساب در این رخداد/);

console.log(JSON.stringify({ model: "s4-cog-v3", unitTests: 60, hiddenStateIndependence: "passed", anchorTestVersion: "s4-anchor-first-options-v1", anchorPaths: "passed", aarConsistency: "passed", countryNaming: "passed", endStateConsistency: "passed", fullPathRegression: "passed", monteCarlo }, null, 2));
