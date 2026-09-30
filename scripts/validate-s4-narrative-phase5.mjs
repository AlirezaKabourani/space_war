import assert from "node:assert/strict";
import fs from "node:fs";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { resolvePrimaryEndState } from "../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts";
import { buildNarrativeContext } from "../src/ui/components/scenario/scenario-four/narrative/buildNarrativeContext.ts";
import {
  ACTOR_REACTION_COPY_FA,
  AAR_TRUTH_LABELS_FA,
  END_STATE_NARRATIVES_FA,
  MOVE3_NARRATIVE_COPY_FA,
  MOVE3_OPTION_COPY_FA,
  MOVE3_REASON_OPTIONS_FA,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import {
  canRenderAdminDebugPanel,
  canRenderNarrativeTrace,
  finalReportToSections,
  formatAttributionEvolution,
  getEndStateNarrative,
  getFinalReport,
  getMove3EvidencePackage,
  getMove3OpeningNarrative,
  getMove3ResourceConsequence,
  getMove3SceneCaption,
  getMoveSituationUpdate,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts";
import { crisisCoaOptions, informationPolicyOptions, move3ReasonOptions, offRampOptions, thresholdOptions } from "../src/ui/components/scenario/scenario-four/moves/move3.ts";

const ids = {
  threshold: ["m3_t_insufficient", "m3_t_sufficient_limited", "m3_t_sufficient_strong"],
  coa: ["m3_coa_contain_understand", "m3_coa_controlled_deterrence", "m3_coa_coordinated_response", "m3_coa_negotiated_deescalation", "m3_coa_unilateral_strong"],
  information: ["m3_info_keep_restricted", "m3_info_share_allies", "m3_info_public_partial", "m3_info_public_attribution"],
  offRamp: ["accept_as_interim", "renegotiate_terms", "keep_channel_open_no_commitment", "reject"],
};
assert.deepEqual(thresholdOptions.map((item) => item.id), ids.threshold);
assert.deepEqual(crisisCoaOptions.map((item) => item.id), ids.coa);
assert.deepEqual(informationPolicyOptions.map((item) => item.id), ids.information);
assert.deepEqual(offRampOptions.map((item) => item.id), ids.offRamp);
assert.deepEqual(move3ReasonOptions.map((item) => item.id), MOVE3_REASON_OPTIONS_FA.map((item) => item.id));
assert.equal(move3ReasonOptions.length, 8);
for (const group of Object.values(MOVE3_OPTION_COPY_FA)) for (const option of group) {
  assert.ok(option.description && option.tradeoff, `${option.id} lacks balanced copy`);
  assert.ok(!/بهترین|هوشمندترین|تنها راه درست/.test(`${option.label} ${option.description} ${option.tradeoff}`));
}

assert.equal(formatAttributionEvolution(40, 60), "برآورد شما از 40٪ به 60٪ افزایش یافت.");
assert.equal(formatAttributionEvolution(60, 40), "برآورد شما از 60٪ به 40٪ کاهش یافت.");
assert.equal(formatAttributionEvolution(50, 50), "برآورد شما بدون تغییر در 50٪ باقی ماند.");
assert.equal(canRenderAdminDebugPanel(false), false);
assert.equal(canRenderAdminDebugPanel(true), true);
assert.equal(canRenderNarrativeTrace(false, true), false);
assert.equal(canRenderNarrativeTrace(true, false), false);
assert.equal(canRenderNarrativeTrace(true, true), true);

const baseContext = (overrides = {}) => ({
  runId: "phase5",
  phase: "move3",
  move: 3,
  iran: {
    decisions: { m3_threshold: "m3_t_sufficient_limited", m3_coa: "m3_coa_contain_understand", m3_info: "m3_info_keep_restricted", ...overrides.decisions },
    reasons: {},
    attributionEstimates: { pre: 40, post: 55, final: 60 },
    resources: { ssaCapacity: 64, protectiveCapacity: 58, politicalCapital: 62, disclosureBudget: 70 },
    resourceEvents: overrides.resourceEvents ?? [],
    observableSignals: [],
  },
  israel: { observedSignals: [], currentAction: "maintain_ambiguous_pressure", previousActions: [], ...overrides.israel },
  ally: { currentAction: "request_restraint" },
  commercial: { currentAction: "commercial_posture_neutral" },
  evidence: { availableIds: ["E_M2_01", "E_M2_02", "E_M2_03"], openedIds: [], visibleConfidence: 48, ...overrides.evidence },
  injects: { activeIds: [] },
  mission: { status: 72, situationAwareness: 62, escalationPressure: 45, operationalReadiness: 68, coalitionCohesion: 66, informationFootprint: 28, strategicLegitimacy: 70, serviceImpactSeverity: "significant", ...overrides.mission },
  flags: { ...overrides.flags },
  endState: overrides.endState,
  visibility: { canRevealHiddenTruth: false },
});

const opening = getMove3OpeningNarrative(baseContext({ flags: { m2FallbackActivated: true, m2CoalitionFriction: true, m2OffRampOfferedByRed: true }, israel: { previousActions: ["reduce_proximity"] } }))[0];
assert.equal(opening.title, MOVE3_NARRATIVE_COPY_FA.opening.title);
assert.equal(opening.kicker, MOVE3_NARRATIVE_COPY_FA.opening.situationLabel);
for (const fragment of [MOVE3_NARRATIVE_COPY_FA.opening.impact.significant, MOVE3_NARRATIVE_COPY_FA.opening.fallback, MOVE3_NARRATIVE_COPY_FA.opening.coalitionFriction, MOVE3_NARRATIVE_COPY_FA.opening.offRampOpen, MOVE3_NARRATIVE_COPY_FA.opening.israelReducedProximity]) assert.ok(opening.body.includes(fragment));
assert.equal(opening.closingLine, MOVE3_NARRATIVE_COPY_FA.opening.closing);

const baseEvidence = getMove3EvidencePackage(baseContext());
assert.equal(baseEvidence.length, 2);
assert.ok(baseEvidence.every((card) => card.limitation));
const richEvidence = getMove3EvidencePackage(baseContext({ evidence: { availableIds: ["E_M2_01", "E_M2_03", "E_M2_TECH_MIXED", "E_M2_ALLY_01", "E_M2_COMM_01", "E_COMM_CONFLICT_01"] } }));
assert.deepEqual(richEvidence.map((card) => card.id), ["E_M2_TECH_MIXED", "E_M2_03", "E_M2_ALLY_01", "E_M2_COMM_01", "E_COMM_CONFLICT_01"]);
assert.ok(richEvidence.some((card) => card.status === "متناقض"));

const finalActions = ["deescalate_and_separate", "accept_interim_offramp", "maintain_ambiguous_pressure", "deny_and_hold", "increase_non_destructive_pressure", "exploit_coalition_friction", "pause_for_assessment"];
assert.equal(new Set(finalActions.map(getMove3SceneCaption)).size, 7);
for (const action of finalActions) assert.ok(ACTOR_REACTION_COPY_FA[`israel:${action}`]);
for (const action of ["support_controlled_response", "support_deconfliction", "request_restraint", "distance_from_public_claim"]) assert.ok(ACTOR_REACTION_COPY_FA[`ally:${action}`]);
for (const action of ["neutral_public_statement", "public_attention_expands", "commercial_posture_neutral"]) assert.ok(ACTOR_REACTION_COPY_FA[`commercial:${action}`]);

const resourceEvents = [{ id: "cost", moveId: "move_3", kind: "user_cost", resource: "politicalCapital", source: "m3", rationale: "test", before: 70, delta: -8, after: 62, timestamp: "2026-01-01" }];
assert.equal(getMove3ResourceConsequence(resourceEvents), "هزینه ثبت‌شده: سرمایه سیاسی −8");
assert.equal(getMove3ResourceConsequence([]), MOVE3_NARRATIVE_COPY_FA.resource.noDirectCost);

const endStates = Object.keys(END_STATE_NARRATIVES_FA);
assert.equal(endStates.length, 9);
assert.equal(new Set(endStates.map((id) => END_STATE_NARRATIVES_FA[id].shortSummary)).size, 9);
for (const id of endStates) {
  const narrative = getEndStateNarrative(id, baseContext({ endState: { id, labelFa: END_STATE_NARRATIVES_FA[id].title }, resourceEvents }));
  assert.ok(narrative.causalFacts.length >= 2 && narrative.causalFacts.length <= 4);
  assert.ok(narrative.closingLine);
}

const reportContext = baseContext({ endState: { id: "persistent_ambiguity", labelFa: "ابهام پایدار" }, resourceEvents });
const report = getFinalReport(reportContext);
const reportSections = finalReportToSections(report);
assert.deepEqual(reportSections.map((item) => item.title), ["مسیر بحران", "وضعیت مأموریت", "تحول برآورد انتساب", "تصمیم نهایی ایران", "واکنش بازیگران", "وضعیت منابع", MOVE3_NARRATIVE_COPY_FA.finalReport.endStateTitle]);
assert.match(report.resources.body, /ظرفیت SSA: 64/);
assert.match(report.resources.body, /سرمایه سیاسی −8/);
assert.ok(!/trueRedIntent|trueIncidentAttribution|move2IncidentCause|seed|utility|snapshot/.test(JSON.stringify(reportSections)));

const metrics = (overrides = {}) => ({ missionOutcomeScore: 65, informationQualityScore: 50, escalationControlScore: 60, coalitionOutcomeScore: 65, resourceSustainabilityScore: 60, informationDisciplineScore: 65, strategicLegitimacyScore: 65, resilienceScore: 60, reversibilityScore: 65, decisionCoherenceScore: 65, attributionCalibrationScore: 60, ...overrides });
const choices = (overrides = {}) => ({ threshold: "m3_t_insufficient", coa: "m3_coa_contain_understand", informationPolicy: "m3_info_keep_restricted", reason: "حفظ مأموریت", ...overrides });
const resolved = ({ tune, redAction = "maintain_ambiguous_pressure", metric = {}, choice = {} }) => {
  const state = createInitialScenarioOneState("probe");
  state.visible.missionContinuity = 70;
  state.visible.escalationPressure = 45;
  state.visible.coalitionCohesion = 65;
  state.visible.informationExposure = 30;
  state.knowledge.systemAttributionConfidence = 45;
  if (tune) tune(state);
  return resolvePrimaryEndState({ state, metrics: metrics(metric), redAction, choices: choices(choice) }).primary;
};

// A–N branch QA cases from the Phase 5 brief.
assert.equal(resolved({}), "persistent_ambiguity"); // A
assert.notEqual(resolved({ choice: { threshold: "m3_t_sufficient_limited", coa: "m3_coa_controlled_deterrence" } }), "intelligence_failure"); // B
assert.notEqual(resolved({ choice: { threshold: "m3_t_sufficient_strong", coa: "m3_coa_coordinated_response" } }), "coalition_fracture"); // C
assert.notEqual(resolved({ tune: (state) => { state.flags.m3PublicAttribution = true; state.hidden.trueIncidentAttribution = "red"; }, metric: { informationDisciplineScore: 40 } }), "intelligence_failure"); // D
assert.equal(resolved({ redAction: "accept_interim_offramp", choice: { coa: "m3_coa_negotiated_deescalation", offRamp: "accept_as_interim" } }), "negotiated_deescalation"); // E
assert.notEqual(resolved({ redAction: "deny_and_hold", choice: { coa: "m3_coa_negotiated_deescalation", offRamp: "accept_as_interim" } }), "negotiated_deescalation"); // F
assert.equal(resolved({ tune: (state) => { state.visible.escalationPressure = 80; } }), "escalation_spiral"); // G
assert.equal(resolved({ tune: (state) => { state.visible.coalitionCohesion = 30; } }), "coalition_fracture"); // H
assert.equal(resolved({ redAction: "deescalate_and_separate", tune: (state) => { state.visible.informationExposure = 60; }, metric: { missionOutcomeScore: 60, escalationControlScore: 60 } }), "costly_deterrence"); // I
assert.equal(resolved({ redAction: "pause_for_assessment" }), "persistent_ambiguity"); // J
assert.equal(resolved({ redAction: "deescalate_and_separate", tune: (state) => { state.knowledge.systemAttributionConfidence = 65; }, metric: { missionOutcomeScore: 80, escalationControlScore: 75, coalitionOutcomeScore: 70 } }), "calm_crisis_control"); // K
assert.equal(resolved({ redAction: "pause_for_assessment", tune: (state) => { state.knowledge.systemAttributionConfidence = 65; }, metric: { informationQualityScore: 75, escalationControlScore: 60 } }), "strategic_information_opportunity"); // L
const visibleA = createInitialScenarioOneState("probe");
const visibleB = structuredClone(visibleA); visibleB.hidden.trueRedIntent = "coercion"; visibleB.hidden.trueIncidentAttribution = "non_red";
const publicA = buildNarrativeContext({ runId: "same", phase: "move3", move: 3, state: visibleA });
const publicB = buildNarrativeContext({ runId: "same", phase: "move3", move: 3, state: visibleB });
assert.deepEqual(getMove3OpeningNarrative(publicA).map(({ title, body }) => ({ title, body })), getMove3OpeningNarrative(publicB).map(({ title, body }) => ({ title, body }))); // M
assert.notEqual(AAR_TRUTH_LABELS_FA.intent.probe, AAR_TRUTH_LABELS_FA.intent.coercion); // N

const update = getMoveSituationUpdate(reportContext);
assert.ok(update.length <= 6);
assert.deepEqual(update.map((item) => item.title), ["وضعیت مأموریت", "برآورد نهایی شما", "مسیر اقدام ایران", "سیاست اطلاعاتی", "واکنش اسرائیل و متحدان"]);

const jsx = fs.readFileSync("src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", "utf8");
assert.ok(jsx.includes("showAdminDebugPanel &&"));
assert.ok(!jsx.includes("{isAdmin && (\n            <Card>\n              <h3 style={{ marginTop: 0 }}>پنل اشکال‌زدایی مدیر"));
const finalSliderStart = jsx.indexOf('phase === "move3_attr_final"');
assert.match(jsx.slice(finalSliderStart, jsx.indexOf('phase === "move3_dw7"', finalSliderStart)), /min=\{0\}[\s\S]*max=\{100\}[\s\S]*step=\{5\}/);
assert.ok(jsx.includes('setPhase("move3_update")'));
assert.ok(jsx.includes('setPhase("final_report")'));
assert.ok(!jsx.includes("پایان سناریو و ورود به تحلیل پس از اقدام"));
assert.ok(!jsx.includes("75/100"));

console.log(JSON.stringify({ phase: "scenario4-narrative-phase5", optionCounts: [thresholdOptions.length, crisisCoaOptions.length, informationPolicyOptions.length, offRampOptions.length], reasons: move3ReasonOptions.length, endStates: endStates.length, actorActionsCovered: finalActions.length, branchQaCases: 14, hiddenStateIndependence: "passed", adminRenderGate: "passed", result: "passed" }, null, 2));
