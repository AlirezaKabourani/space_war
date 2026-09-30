import assert from "node:assert/strict";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { buildOpponentObservationAAR } from "../src/ui/components/scenario/scenario-four/model/aarV3.ts";
import { buildNarrativeContext } from "../src/ui/components/scenario/scenario-four/narrative/buildNarrativeContext.ts";
import {
  ACTOR_ACTION_IDS,
  ACTOR_REACTION_COPY_FA,
  END_STATE_NARRATIVES_FA,
  INJECT_NARRATIVES_FA,
  INTRO_NARRATIVE_SCREENS_FA,
  MOVE2_NARRATIVE_COPY_FA,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import {
  getActorReactionNarrative,
  getEndStateNarrative,
  getFinalReport,
  getMove1OpeningNarrative,
  getMove2OpeningNarrative,
  getMove3OpeningNarrative,
  getMoveSituationUpdate,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts";
import {
  getNarrativeCoverageIssues,
  validateNarrativeConsistency,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeConsistency.ts";

const baseState = createInitialScenarioOneState("probe");
const redObservation = {
  visibleProtection: 0,
  blueResolveSignal: 0,
  blueEscalationSignal: 0,
  publicPressure: 0,
  privateCommunication: false,
  coalitionSignal: 0,
};
const finalObservation = {
  ...redObservation,
  fallbackVisible: 0,
  missionReconfigurationVisible: 0,
  formalAccusationLevel: 0,
  defensiveAuthoritySignal: 0,
  offRampSignal: 0,
  finalResolveSignal: 0,
  finalEscalationSignal: 0,
  coalitionUnitySignal: 0,
  publicAttributionLevel: 0,
  missionResilienceSignal: 0,
};

const move1 = {
  moveId: "move_1", startedAt: "a", completedAt: "b", stateBefore: baseState, stateAfter: baseState,
  decisions: [], evidenceSeen: [], redAction: "hold_position", allyAction: "no_action",
  commercialAction: "no_new_data", injectsTriggered: [], actorObservations: { redObserved: redObservation }, rngSeed: "seed",
};
const move2 = {
  moveId: "move_2", startedAt: "b", completedAt: "c", stateBefore: baseState, stateAfter: baseState,
  attributionEstimatePre: 35, attributionEstimatePost: 55, decisions: [], evidenceSeen: [],
  redAction: "pause_and_observe", allyAction: "request_more_evidence", commercialAction: "partial_data_only",
  injectsTriggered: [], actorObservations: { redObserved: { ...finalObservation } }, rngSeed: "seed2", previousMoveSnapshotRef: "b",
};
const move3 = {
  moveId: "move_3", startedAt: "c", completedAt: "d", stateBefore: baseState, stateAfter: baseState,
  playerAttributionEstimateFinal: 60, actionThresholdChoice: "threshold", crisisCoa: "coa",
  informationPolicy: "policy", decisions: [], evidenceSeen: [], redAction: "pause_for_assessment",
  allyAction: "request_restraint", commercialAction: "commercial_posture_neutral", injectsTriggered: [],
  finalObservableSignal: finalObservation, rngSeed: "seed3",
};
const finalSnapshot = {
  runId: "run", scenarioId: "4", runSeed: "seed", move1, move2, move3, finalState: baseState,
  primaryEndState: "persistent_ambiguity", secondaryOutcomeTags: [], finalMetrics: {}, playerFacingReport: [],
  hiddenAarData: { trueRedIntent: "probe", trueIncidentAttribution: "non_red", redPerceptionTimeline: [], evidenceTruthMap: {} },
  completedAt: "d",
};

const context = (overrides = {}) => buildNarrativeContext({
  runId: "run", phase: "move2", move: 2, state: baseState, move1, move2: null, ...overrides,
});

const noSecondAsset = getMove2OpeningNarrative(context()).map((item) => item.body).join(" ");
assert.ok(!noSecondAsset.includes(MOVE2_NARRATIVE_COPY_FA.opening.secondAsset), "Move 2 opening invented a second asset");
const secondAssetState = structuredClone(baseState);
secondAssetState.flags.m2SecondAssetObserved = true;
const secondAssetMove = { ...move2, stateAfter: secondAssetState, redAction: "introduce_second_asset" };
const withSecondAsset = getMove2OpeningNarrative(context({ state: secondAssetState, move2: secondAssetMove })).map((item) => item.body).join(" ");
assert.ok(withSecondAsset.includes(MOVE2_NARRATIVE_COPY_FA.opening.secondAsset), "Move 2 opening omitted the actual second asset");

const severityBodies = {};
for (const severity of ["limited", "significant", "severe"]) {
  const state = structuredClone(baseState);
  state.move = 3;
  state.knowledge.serviceImpactSeverity = severity;
  const ctx = context({ phase: "move3", move: 3, state, move2, move3: null });
  severityBodies[severity] = getMove3OpeningNarrative(ctx)[0].body;
}
assert.equal(new Set(Object.values(severityBodies)).size, 3, "Move 3 opening does not respect all severity values");

assert.equal(Object.keys(END_STATE_NARRATIVES_FA).length, 9, "Expected nine end states");
assert.equal(new Set(Object.values(END_STATE_NARRATIVES_FA).map((item) => `${item.shortSummary}|${item.closingLine}`)).size, 9, "End-state narratives must be distinct");

const reportCtx = context({ phase: "report", move: 3, state: baseState, move2, move3, finalSnapshot });
const highMission = getFinalReport(reportCtx).missionOutcome.body;
const lowState = structuredClone(baseState);
lowState.visible.missionContinuity = 45;
const lowFinal = { ...finalSnapshot, finalState: lowState, move3: { ...move3, stateAfter: lowState } };
const lowReport = getFinalReport(context({ phase: "report", move: 3, state: lowState, move2, move3: lowFinal.move3, finalSnapshot: lowFinal })).missionOutcome.body;
assert.notEqual(highMission, lowReport, "Final report mission prose did not derive from state");

const hiddenVariant = structuredClone(baseState);
hiddenVariant.hidden.trueRedIntent = "alliance_fracture";
hiddenVariant.hidden.trueIncidentAttribution = "red";
hiddenVariant.hidden.allyTrust = 1;
const publicA = context({ state: baseState });
const publicB = context({ state: hiddenVariant });
assert.deepEqual(publicA, publicB, "Hidden truth changed a pre-AAR narrative context");
assert.deepEqual(getMove2OpeningNarrative(publicA), getMove2OpeningNarrative(publicB), "Hidden truth changed pre-AAR prose");
assert.deepEqual(getMove1OpeningNarrative(publicA), getMove1OpeningNarrative(publicB), "Hidden truth changed Move 1 prose");
assert.deepEqual(getMoveSituationUpdate(publicA), getMoveSituationUpdate(publicB), "Hidden truth changed situation-update prose");
const reportHiddenSnapshot = { ...finalSnapshot, finalState: hiddenVariant, hiddenAarData: { ...finalSnapshot.hiddenAarData, trueRedIntent: "alliance_fracture", trueIncidentAttribution: "red" } };
const reportHiddenCtx = context({ phase: "report", move: 3, state: hiddenVariant, move2, move3, finalSnapshot: reportHiddenSnapshot });
assert.deepEqual(getFinalReport(reportCtx), getFinalReport(reportHiddenCtx), "Hidden truth changed final-report prose");
for (const endStateId of Object.keys(END_STATE_NARRATIVES_FA)) {
  assert.deepEqual(
    getEndStateNarrative(endStateId, reportCtx),
    getEndStateNarrative(endStateId, reportHiddenCtx),
    `Hidden truth changed ${endStateId} prose`
  );
}

assert.deepEqual(getNarrativeCoverageIssues(), [], "Narrative catalog coverage has gaps");
for (const [actor, actions] of Object.entries(ACTOR_ACTION_IDS)) {
  for (const action of actions) assert.doesNotThrow(() => getActorReactionNarrative(actor, action, reportCtx));
}
assert.equal(Object.keys(INJECT_NARRATIVES_FA).length, 8, "Expected all eight inject narratives");

const playerFacingValues = [
  ...Object.values(INTRO_NARRATIVE_SCREENS_FA).flatMap((item) => [item.title, item.subtitle, item.body, item.disclaimer, item.cta]),
  ...Object.values(ACTOR_REACTION_COPY_FA).flatMap((item) => [item.title, item.body]),
  ...Object.values(INJECT_NARRATIVES_FA).flatMap((item) => [item.title, item.whatHappened, item.whyItMatters]),
  ...Object.values(END_STATE_NARRATIVES_FA).flatMap((item) => [item.title, item.shortSummary, item.closingLine]),
].filter(Boolean);
assert.ok(playerFacingValues.every((value) => !/\b(?:Blue|Red)\b/.test(value)), "Player-facing narrative contains Blue/Red naming");

for (const endStateId of Object.keys(END_STATE_NARRATIVES_FA)) {
  const narrative = getEndStateNarrative(endStateId, { ...reportCtx, endState: { id: endStateId, labelFa: "", tags: [] } });
  assert.ok(narrative.causalFacts.length >= 3, `${endStateId} lacks state-derived causal facts`);
}

const inventedSection = { id: "test", title: "test", body: "یک دارایی دیگر اسرائیل در محیط عملیاتی مشاهده شده است.", source: "state" };
assert.equal(validateNarrativeConsistency(publicA, [inventedSection])[0]?.code, "invented_second_asset");
assert.deepEqual(validateNarrativeConsistency(context({ state: secondAssetState, move2: secondAssetMove }), [inventedSection]), []);
const separationSection = { ...inventedSection, id: "separation", body: "اسرائیل فاصله را افزایش داد." };
assert.equal(validateNarrativeConsistency(publicA, [separationSection])[0]?.code, "invented_separation");
assert.deepEqual(validateNarrativeConsistency({ ...publicA, israel: { ...publicA.israel, currentAction: "reduce_proximity" } }, [separationSection]), []);
const reciprocalSection = { ...inventedSection, id: "reciprocal", body: "اسرائیل کاهش تنش را پذیرفته است." };
assert.equal(validateNarrativeConsistency(publicA, [reciprocalSection])[0]?.code, "invented_reciprocity");
assert.deepEqual(validateNarrativeConsistency({ ...publicA, israel: { ...publicA.israel, currentAction: "accept_interim_offramp" } }, [reciprocalSection]), []);
const publicSignalSection = { ...inventedSection, id: "public", body: "پیام عمومی ایران منتشر شد." };
assert.equal(validateNarrativeConsistency(publicA, [publicSignalSection])[0]?.code, "invented_public_signal");
assert.deepEqual(validateNarrativeConsistency({ ...publicA, flags: { ...publicA.flags, m3PublicAttribution: true } }, [publicSignalSection]), []);
const allySection = { ...inventedSection, id: "ally", body: "متحدان از پاسخ ایران حمایت کردند." };
assert.equal(validateNarrativeConsistency(publicA, [allySection])[0]?.code, "invented_ally_support");
assert.deepEqual(validateNarrativeConsistency({ ...publicA, ally: { currentAction: "support_controlled_response" } }, [allySection]), []);
assert.equal(validateNarrativeConsistency(reportCtx, [], "calm_crisis_control")[0]?.code, "scene_end_state_mismatch");
assert.deepEqual(validateNarrativeConsistency(reportCtx, [], "persistent_ambiguity"), []);

const aarA = buildOpponentObservationAAR({ move1Snapshot: move1, move2Snapshot: move2, move3Snapshot: move3 });
const changedMove3 = { ...move3, finalObservableSignal: { ...finalObservation, publicAttributionLevel: 17 } };
const aarB = buildOpponentObservationAAR({ move1Snapshot: move1, move2Snapshot: move2, move3Snapshot: changedMove3 });
assert.notDeepEqual(aarA, aarB, "AAR opponent observation is no longer run-derived");

const before = structuredClone(baseState);
buildNarrativeContext({ runId: "run", phase: "move1", state: baseState, move: 1 });
assert.deepEqual(baseState, before, "Narrative context builder mutated scenario state");

console.log(JSON.stringify({
  phase: "scenario4-narrative-phase1",
  actorActionsCovered: Object.values(ACTOR_ACTION_IDS).reduce((sum, actions) => sum + actions.length, 0),
  injectsCovered: Object.keys(INJECT_NARRATIVES_FA).length,
  endStatesCovered: Object.keys(END_STATE_NARRATIVES_FA).length,
  result: "passed",
}, null, 2));
