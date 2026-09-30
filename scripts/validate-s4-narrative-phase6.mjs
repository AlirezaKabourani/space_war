import assert from "node:assert/strict";
import fs from "node:fs";
import { adjudicateMoveOne, applyBlueDecision } from "../src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts";
import { adjudicateMove2, applyMove2Decision, initializeMove2Incident } from "../src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts";
import { adjudicateMove3, applyMove3Decision, initializeMove3Severity, resolvePrimaryEndState } from "../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { applyResourceRecovery } from "../src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts";
import { createSeededRandom, selectRedIntent } from "../src/ui/components/scenario/scenario-four/adjudication/seededRandom.ts";
import { buildAarNarrativeContext, buildNarrativeContext } from "../src/ui/components/scenario/scenario-four/narrative/buildNarrativeContext.ts";
import { getNarrativeCoverageIssues } from "../src/ui/components/scenario/scenario-four/narrative/narrativeConsistency.ts";
import {
  ACTOR_REACTION_COPY_FA,
  END_STATE_NARRATIVES_FA,
  INJECT_NARRATIVES_FA,
  MOVE1_EVIDENCE_COPY_FA,
  MOVE2_EVIDENCE_COPY_FA,
  MOVE3_NARRATIVE_COPY_FA,
  MOVE3_OPTION_COPY_FA,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import {
  finalReportToSections,
  formatAttributionEvolution,
  formatAttributionPath,
  getActorReactionNarrative,
  getFinalReport,
  getInjectNarrativeDefinition,
  getMove1OpeningNarrative,
  getMove2OpeningNarrative,
  getMove3EvidencePackage,
  getMove3OpeningNarrative,
  getMoveSituationUpdate,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts";
import { informationOptions, protectionOptions, communicationOptions } from "../src/ui/components/scenario/scenario-four/moves/move1.ts";
import { investigationOptions, missionOptions, responseOptions } from "../src/ui/components/scenario/scenario-four/moves/move2.ts";
import { thresholdOptions, crisisCoaOptions, informationPolicyOptions, offRampOptions } from "../src/ui/components/scenario/scenario-four/moves/move3.ts";

assert.equal(formatAttributionEvolution(50, 50), "برآورد شما بدون تغییر در 50٪ باقی ماند.");
assert.equal(formatAttributionPath(50, 50, 50), "برآورد شما در هر سه نقطه روی 50٪ باقی ماند.");
assert.equal(formatAttributionPath(40, 55, 55), "مسیر برآورد شما: 40٪ ← 55٪ ← 55٪. برآورد شما از 40٪ به 55٪ افزایش یافت. برآورد شما بدون تغییر در 55٪ باقی ماند.");
assert.equal(MOVE3_OPTION_COPY_FA.threshold.find((item) => item.id === "m3_t_sufficient_strong").label, "برای اقدام با دامنه بیشتر کافی است");
assert.equal(MOVE3_NARRATIVE_COPY_FA.aar.bssTitle, "BSS نسبت به مبنای 50/50");
assert.equal("brierExample" in MOVE3_NARRATIVE_COPY_FA.aar, false);
assert.match(MOVE3_NARRATIVE_COPY_FA.aar.boundary, /سنجه توانایی عمومی، شخصیت یا آزمون روان‌سنجی نیست/);
assert.match(MOVE3_NARRATIVE_COPY_FA.aar.title, /تحلیل پس از اقدام \(AAR\)/);
assert.deepEqual(getNarrativeCoverageIssues(), []);
for (const card of [...MOVE1_EVIDENCE_COPY_FA, ...MOVE2_EVIDENCE_COPY_FA]) {
  for (const key of ["id", "title", "status", "text", "limitation", "sourceSemantics", "visibilityRule"]) assert.ok(card[key], `${card.id} missing ${key}`);
}

const baseMetrics = { missionOutcomeScore: 65, informationQualityScore: 50, escalationControlScore: 60, coalitionOutcomeScore: 65, resourceSustainabilityScore: 60, informationDisciplineScore: 65, strategicLegitimacyScore: 65, resilienceScore: 60, reversibilityScore: 65, decisionCoherenceScore: 65, attributionCalibrationScore: 60 };
const baseChoices = { threshold: "m3_t_insufficient", coa: "m3_coa_contain_understand", informationPolicy: "m3_info_keep_restricted", offRamp: "", reason: "حفظ مأموریت" };
const fixture = (expected, { tune, metrics = {}, redAction = "deny_and_hold", choices = {} } = {}) => {
  const state = createInitialScenarioOneState("probe");
  state.visible.missionContinuity = 70;
  state.visible.escalationPressure = 45;
  state.visible.coalitionCohesion = 65;
  state.visible.informationExposure = 20;
  state.knowledge.systemAttributionConfidence = 65;
  if (tune) tune(state);
  const actual = resolvePrimaryEndState({ state, metrics: { ...baseMetrics, ...metrics }, redAction, choices: { ...baseChoices, ...choices } }).primary;
  assert.equal(actual, expected, `End-state fixture ${expected} resolved to ${actual}`);
  return { expected, actual, redAction, choices: { ...baseChoices, ...choices }, metrics: { ...baseMetrics, ...metrics }, state: { visible: state.visible, flags: state.flags, confidence: state.knowledge.systemAttributionConfidence, truth: state.hidden.trueIncidentAttribution }, narrative: END_STATE_NARRATIVES_FA[actual] };
};
const endStateFixtures = [
  fixture("escalation_spiral", { tune: (s) => { s.visible.escalationPressure = 75; } }),
  fixture("intelligence_failure", { tune: (s) => { s.flags.m3PublicAttribution = true; s.hidden.trueIncidentAttribution = "non_red"; }, metrics: { informationDisciplineScore: 30 } }),
  fixture("coalition_fracture", { tune: (s) => { s.visible.coalitionCohesion = 30; } }),
  fixture("negotiated_deescalation", { redAction: "accept_interim_offramp", choices: { coa: "m3_coa_negotiated_deescalation", offRamp: "accept_as_interim" } }),
  fixture("calm_crisis_control", { redAction: "deescalate_and_separate", metrics: { missionOutcomeScore: 80, escalationControlScore: 75, coalitionOutcomeScore: 70 } }),
  fixture("costly_deterrence", { redAction: "deescalate_and_separate", tune: (s) => { s.visible.informationExposure = 60; }, metrics: { missionOutcomeScore: 60, escalationControlScore: 60 } }),
  fixture("persistent_ambiguity", { redAction: "pause_for_assessment", tune: (s) => { s.knowledge.systemAttributionConfidence = 40; } }),
  fixture("strategic_information_opportunity", { redAction: "pause_for_assessment", metrics: { informationQualityScore: 75, escalationControlScore: 60 } }),
  fixture("mixed_crisis_containment", { redAction: "deny_and_hold" }),
];
fs.writeFileSync("docs/scenario4-end-state-resolver-fixtures.json", JSON.stringify(endStateFixtures, null, 2));

const resourceShape = { ssaCapacity: 100, protectiveCapacity: 100, politicalCapital: 100, disclosureBudget: 100 };
const makeRecord = (moveId, windowId, optionId, before, after) => ({ moveId, windowId, selectedOptionId: optionId, firstSelectedOptionId: optionId, changeCount: 0, responseTimeMs: 1000, stateBefore: before, stateAfter: after, resourcesBefore: before?.resources ?? resourceShape, resourcesAfter: after?.resources ?? resourceShape, resourceEvents: [] });
const choose = (random, options) => options[Math.floor(random() * options.length)].id;
const frequency = (target, key) => { target[key] = (target[key] ?? 0) + 1; };
const aggregate = { requestedRuns: 10_000, completedRuns: 0, endStates: {}, actorActions: { israel: {}, ally: {}, commercial: {} }, injects: {}, intents: {}, incidentAttribution: {}, missingMappings: [], assertionFailures: [], undefinedNarrativeCount: 0 };
const forbiddenPlayerText = /trueRedIntent|trueIncidentAttribution|move2IncidentCause|\bSeed\b|\bIntent\b|Checkpoint|Red action|m[123]_[a-z0-9_]+|utility/i;
const playerSections = (sections) => sections.map(({ title, body, kicker, closingLine, severity }) => ({ title, body, kicker, closingLine, severity }));

for (let index = 0; index < 10_000; index += 1) {
  const seed = `s4-phase6-${index.toString().padStart(5, "0")}`;
  const random = createSeededRandom(`${seed}:choices`);
  try {
    const intent = selectRedIntent(seed);
    frequency(aggregate.intents, intent);
    const initial = createInitialScenarioOneState(intent);
    const m1Choices = { information: choose(random, informationOptions), protection: choose(random, protectionOptions), communication: choose(random, communicationOptions), reason: "کسب اطلاعات بیشتر" };
    let m1State = initial; const m1Records = [];
    for (const [windowId, optionId] of [["m1_information", m1Choices.information], ["m1_protection", m1Choices.protection], ["m1_communication", m1Choices.communication]]) { const before = m1State; m1State = applyBlueDecision(m1State, windowId, optionId, seed); m1Records.push(makeRecord("move_1", windowId, optionId, before, m1State)); }
    const m1 = adjudicateMoveOne({ startedAt: "2026-01-01T00:00:00Z", stateBefore: initial, stateAfterBlue: m1State, decisions: m1Records, evidenceSeen: m1State.knowledge.evidenceIds, choices: m1Choices, rngSeed: seed }).snapshot;
    const m1Recovery = applyResourceRecovery(m1.stateAfter, "m1_to_m2", { choices: m1Choices, redAction: m1.redAction, allyAction: m1.allyAction, commercialAction: m1.commercialAction });
    const m2Start = initializeMove2Incident(m1Recovery.state, `${seed}:move2:incident`);
    frequency(aggregate.incidentAttribution, m2Start.hidden.trueIncidentAttribution);
    const m2Choices = { investigation: choose(random, investigationOptions), mission: choose(random, missionOptions), response: choose(random, responseOptions), reason: "جلوگیری از تشدید" };
    let m2State = m2Start; const m2Records = [];
    for (const [windowId, optionId] of [["m2_investigation", m2Choices.investigation], ["m2_mission", m2Choices.mission], ["m2_response", m2Choices.response]]) { const before = m2State; m2State = applyMove2Decision(m2State, windowId, optionId, seed); m2Records.push(makeRecord("move_2", windowId, optionId, before, m2State)); }
    const pre = Math.floor(random() * 21) * 5;
    const post = Math.floor(random() * 21) * 5;
    const m2 = adjudicateMove2({ startedAt: "2026-01-01T00:10:00Z", stateBefore: m2Start, stateAfterBlue: m2State, attributionEstimatePre: pre, attributionEstimatePost: post, decisions: m2Records, evidenceSeen: m2State.knowledge.evidenceIds, choices: m2Choices, rngSeed: `${seed}:move2`, previousMoveSnapshotRef: m1.completedAt }).snapshot;
    const m2Recovery = applyResourceRecovery(m2.stateAfter, "m2_to_m3", { choices: m2Choices, redAction: m2.redAction, allyAction: m2.allyAction, commercialAction: m2.commercialAction });
    const m3Start = initializeMove3Severity(m2Recovery.state, m2, `${seed}:move3`);
    const m3Choices = { threshold: choose(random, thresholdOptions), coa: choose(random, crisisCoaOptions), informationPolicy: choose(random, informationPolicyOptions), offRamp: "", reason: "حفظ مأموریت" };
    let m3State = m3Start; const m3Records = [];
    for (const [windowId, optionId] of [["m3_threshold", m3Choices.threshold], ["m3_coa", m3Choices.coa], ["m3_info", m3Choices.informationPolicy]]) { const before = m3State; m3State = applyMove3Decision(m3State, windowId, optionId); m3Records.push(makeRecord("move_3", windowId, optionId, before, m3State)); }
    if (m3State.flags.m2OffRampOfferedByRed || m3State.flags.m2OffRampOfferedByBlue || m3Choices.coa === "m3_coa_negotiated_deescalation") { m3Choices.offRamp = choose(random, offRampOptions); const before = m3State; m3State = applyMove3Decision(m3State, "m3_offramp", m3Choices.offRamp); m3Records.push(makeRecord("move_3", "m3_offramp", m3Choices.offRamp, before, m3State)); }
    const finalEstimate = Math.floor(random() * 21) * 5;
    const final = adjudicateMove3({ runId: `phase6-${index}`, scenarioId: "4", runSeed: seed, move1: m1, move2: m2, startedAt: "2026-01-01T00:20:00Z", stateBefore: m3Start, stateAfterBlue: m3State, playerAttributionEstimateFinal: finalEstimate, choices: m3Choices, decisions: m3Records, evidenceSeen: m3State.knowledge.evidenceIds, rngSeed: `${seed}:move3` });

    frequency(aggregate.endStates, final.finalSnapshot.primaryEndState);
    for (const [actor, action] of [["israel", m1.redAction], ["ally", m1.allyAction], ["commercial", m1.commercialAction], ["israel", m2.redAction], ["ally", m2.allyAction], ["commercial", m2.commercialAction], ["israel", final.move3.redAction], ["ally", final.move3.allyAction], ["commercial", final.move3.commercialAction]]) {
      frequency(aggregate.actorActions[actor], action);
      getActorReactionNarrative(actor, action, buildNarrativeContext({ runId: seed, phase: "move3", move: 3, state: final.finalSnapshot.finalState, move1: m1, move2: m2, move3: final.move3, finalSnapshot: final.finalSnapshot }));
    }
    for (const injectId of [...m1.injectsTriggered, ...m2.injectsTriggered, ...final.move3.injectsTriggered]) { frequency(aggregate.injects, injectId); getInjectNarrativeDefinition(injectId); }

    const ctx1 = buildNarrativeContext({ runId: seed, phase: "move1", move: 1, state: m1.stateAfter, move1: m1 });
    const ctx2 = buildNarrativeContext({ runId: seed, phase: "move2", move: 2, state: m2.stateAfter, move1: m1, move2: m2 });
    const ctx3 = buildNarrativeContext({ runId: seed, phase: "move3", move: 3, state: final.finalSnapshot.finalState, move1: m1, move2: m2, move3: final.move3, finalSnapshot: final.finalSnapshot });
    const publicNarrative = [getMove1OpeningNarrative(ctx1), getMoveSituationUpdate(ctx1), getMove2OpeningNarrative(ctx2), getMoveSituationUpdate(ctx2), getMove3OpeningNarrative(ctx3), getMove3EvidencePackage(ctx3), getMoveSituationUpdate(ctx3), finalReportToSections(getFinalReport(ctx3))].flat();
    const rendered = JSON.stringify(playerSections(publicNarrative));
    if (rendered.includes("undefined")) aggregate.undefinedNarrativeCount += 1;
    assert.doesNotMatch(rendered, forbiddenPlayerText, `Player narrative leak in ${seed}`);
    const aar = buildAarNarrativeContext({ runId: seed, phase: "aar", move: 3, state: final.finalSnapshot.finalState, move1: m1, move2: m2, move3: final.move3, finalSnapshot: final.finalSnapshot });
    assert.equal(aar.visibility.canRevealHiddenTruth, true);
    assert.equal(aar.hiddenTruth.trueRedIntent, intent);
    aggregate.completedRuns += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Unmapped|Missing|undefined/i.test(message)) aggregate.missingMappings.push({ index, seed, message });
    else aggregate.assertionFailures.push({ index, seed, message });
  }
}

aggregate.actorCoverage = Object.fromEntries(Object.entries(aggregate.actorActions).map(([actor, values]) => [actor, Object.keys(values).sort()]));
aggregate.injectCoverage = Object.keys(aggregate.injects).sort();
aggregate.endStateCoverage = Object.keys(aggregate.endStates).sort();
fs.writeFileSync("docs/scenario4-seeded-qa-10000.json", JSON.stringify(aggregate, null, 2));
assert.equal(aggregate.completedRuns, 10_000, `Only ${aggregate.completedRuns}/10000 seeded runs completed`);
assert.equal(aggregate.missingMappings.length, 0);
assert.equal(aggregate.assertionFailures.length, 0);
assert.equal(aggregate.undefinedNarrativeCount, 0);
assert.ok(Object.keys(aggregate.actorActions.israel).length >= 7);
assert.ok(Object.keys(aggregate.endStates).length >= 5);

console.log(JSON.stringify({ phase: "scenario4-narrative-phase6", completedRuns: aggregate.completedRuns, endStates: aggregate.endStates, actorCoverage: aggregate.actorCoverage, injectCoverage: aggregate.injectCoverage, missingMappings: 0, assertionFailures: 0, result: "passed" }, null, 2));
