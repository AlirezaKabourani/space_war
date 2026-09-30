import assert from "node:assert/strict";
import fs from "node:fs";
import {
  adjudicateMove2,
  applyMove2Decision,
  buildMove2Observation,
  initializeMove2Incident,
} from "../src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { buildNarrativeContext } from "../src/ui/components/scenario/scenario-four/narrative/buildNarrativeContext.ts";
import {
  ACTOR_REACTION_COPY_FA,
  INJECT_NARRATIVES_FA,
  MOVE2_EVIDENCE_COPY_FA,
  MOVE2_NARRATIVE_COPY_FA,
  MOVE2_OPTION_COPY_FA,
  MOVE2_REASON_OPTIONS_FA,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import {
  canRenderNarrativeTrace,
  formatAttributionEvolution,
  getActorReactionNarrative,
  getMove2OpeningNarrative,
  getMove2ResourceConsequence,
  getMove2SceneCaption,
  getMoveSituationUpdate,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts";
import {
  investigationOptions,
  missionOptions,
  move2EvidenceCards,
  move2ReasonOptions,
  responseOptions,
} from "../src/ui/components/scenario/scenario-four/moves/move2.ts";

const expectedIds = {
  investigation: ["m2_a_technical_diagnostics", "m2_a_second_sensor", "m2_a_ally_intel", "m2_a_commercial_validation", "m2_a_act_with_current_data"],
  mission: ["m2_m_continue_normal", "m2_m_activate_fallback", "m2_m_reduce_load", "m2_m_protective_reconfiguration", "m2_m_split_service"],
  response: ["m2_r_no_counteraction", "m2_r_request_explanation", "m2_r_private_warning", "m2_r_joint_allied_response", "m2_r_request_defensive_authority", "m2_r_deconfliction_offer"],
  reason: ["افزایش اطمینان درباره علت حادثه", "حفظ تداوم مأموریت", "صرفه‌جویی در منابع", "جلوگیری از تشدید", "نمایش عزم", "حفظ ائتلاف", "ایجاد مسیر کاهش تنش"],
};

assert.deepEqual(investigationOptions.map((item) => item.id), expectedIds.investigation);
assert.deepEqual(missionOptions.map((item) => item.id), expectedIds.mission);
assert.deepEqual(responseOptions.map((item) => item.id), expectedIds.response);
assert.deepEqual(move2ReasonOptions.map((item) => item.id), expectedIds.reason);
assert.equal(investigationOptions.length + missionOptions.length + responseOptions.length, 16);
assert.equal(move2EvidenceCards, MOVE2_EVIDENCE_COPY_FA);

for (const group of Object.values(MOVE2_OPTION_COPY_FA)) {
  for (const option of group) {
    assert.ok(option.description.trim(), `${option.id} lost its action description`);
    assert.ok(option.tradeoff.trim(), `${option.id} lost its trade-off`);
    assert.ok(!/قاطع|هوشمند|منفعل|ضعیف|بی‌اعتنایی|نادیده گرفتن/.test(`${option.label} ${option.description} ${option.tradeoff}`), `${option.id} contains biased wording`);
  }
}
for (const card of MOVE2_EVIDENCE_COPY_FA) {
  assert.ok(card.title && card.status && card.text && card.limitation, `${card.id} is incomplete`);
  assert.ok(!/trueIncidentAttribution|move2IncidentCause|حقیقت پنهان/.test(`${card.text} ${card.limitation}`), `${card.id} leaks hidden truth`);
}
assert.equal(MOVE2_EVIDENCE_COPY_FA[0].title, "ثبت افت سرویس");
assert.match(MOVE2_EVIDENCE_COPY_FA[0].limitation, /علت افت را مشخص نمی‌کند/);
assert.match(MOVE2_EVIDENCE_COPY_FA[1].limitation, /اثبات مداخله خارجی نیست/);
assert.match(MOVE2_EVIDENCE_COPY_FA[2].limitation, /رابطه علّی را ثابت نمی‌کند/);

const baseContext = (overrides = {}) => ({
  runId: "phase4-opening",
  phase: "move2",
  move: 2,
  iran: { decisions: {}, reasons: {}, attributionEstimates: {}, resources: { ssaCapacity: 70, protectiveCapacity: 70, politicalCapital: 70, disclosureBudget: 70 }, observableSignals: [] },
  israel: { observedSignals: [], previousActions: [], ...overrides.israel },
  ally: {},
  commercial: {},
  evidence: { availableIds: ["E_M2_01", "E_M2_02", "E_M2_03"], openedIds: [], visibleConfidence: 40 },
  injects: { activeIds: [] },
  mission: { status: 75, situationAwareness: 50, escalationPressure: 30, operationalReadiness: 60, coalitionCohesion: 65, informationFootprint: 20, strategicLegitimacy: 60 },
  flags: { ...overrides.flags },
  visibility: { canRevealHiddenTruth: false },
});

const openingBase = getMove2OpeningNarrative(baseContext());
assert.equal(openingBase[0].title, "مرحله دوم — اختلال بدون امضا");
assert.equal(openingBase[0].kicker, "اثر عملیاتی، علت نامطمئن");
assert.ok(!openingBase[0].body.includes(MOVE2_NARRATIVE_COPY_FA.opening.secondAsset));
assert.ok(!/حمله اسرائیل|اختلال اسرائیلی|خرابکاری|شواهد ثابت می‌کند/.test(openingBase.map((item) => item.body).join(" ")));
const openingSecondAsset = getMove2OpeningNarrative(baseContext({ flags: { m2SecondAssetObserved: true } }));
assert.ok(openingSecondAsset[0].body.includes(MOVE2_NARRATIVE_COPY_FA.opening.secondAsset));
const openingBreakOff = getMove2OpeningNarrative(baseContext({ israel: { previousActions: ["break_off"] } }));
assert.ok(openingBreakOff.some((item) => item.body === MOVE2_NARRATIVE_COPY_FA.opening.priorBreakOff));
const openingMedia = getMove2OpeningNarrative(baseContext({ flags: { mediaInjectTriggered: true } }));
assert.ok(openingMedia.some((item) => item.body === MOVE2_NARRATIVE_COPY_FA.opening.priorMedia));

const resourceKeys = ["ssaCapacity", "protectiveCapacity", "politicalCapital", "disclosureBudget"];
const makeRecord = (windowId, selectedOptionId, before, after) => ({
  moveId: "move_2",
  windowId,
  selectedOptionId,
  firstSelectedOptionId: selectedOptionId,
  changeCount: 0,
  responseTimeMs: 1000,
  stateBefore: before,
  stateAfter: after,
  resourcesBefore: before.resources,
  resourcesAfter: after.resources,
  resourceEvents: resourceKeys.flatMap((resource) => {
    const delta = after.resources[resource] - before.resources[resource];
    return delta === 0 ? [] : [{ kind: "user_cost", moveId: "move_2", resource, source: selectedOptionId, before: before.resources[resource], delta, after: after.resources[resource], rationale: "test" }];
  }),
});

const runBranch = ({ investigation, mission, response, seed, intent = "probe", tune }) => {
  let initial = initializeMove2Incident(createInitialScenarioOneState(intent), `${seed}:incident`);
  if (tune) initial = tune(structuredClone(initial));
  let current = initial;
  const records = [];
  for (const [windowId, optionId] of [["m2_investigation", investigation], ["m2_mission", mission], ["m2_response", response]]) {
    const before = current;
    current = applyMove2Decision(current, windowId, optionId, `${seed}:move2`);
    records.push(makeRecord(windowId, optionId, before, current));
  }
  const choices = { investigation, mission, response, reason: "جلوگیری از تشدید" };
  const result = adjudicateMove2({
    startedAt: "2026-01-01T00:00:00.000Z",
    stateBefore: initial,
    stateAfterBlue: current,
    attributionEstimatePre: 45,
    attributionEstimatePost: 60,
    decisions: records,
    evidenceSeen: current.knowledge.evidenceIds,
    choices,
    rngSeed: seed,
    previousMoveSnapshotRef: "phase4-move1",
  });
  const ctx = buildNarrativeContext({ runId: `qa-${seed}`, phase: "move2", move: 2, state: result.snapshot.stateAfter, move2: result.snapshot, decisions: records });
  return { initial, current, records, choices, result, ctx, update: getMoveSituationUpdate(ctx) };
};

const branchA = runBranch({ investigation: "m2_a_technical_diagnostics", mission: "m2_m_continue_normal", response: "m2_r_no_counteraction", seed: "phase4-a" });
assert.ok(branchA.current.knowledge.evidenceIds.some((id) => id.startsWith("E_M2_TECH_")));
assert.ok(!/اسرائیل علت افت را ایجاد کرده|مداخله اسرائیل ثابت/.test(branchA.update.map((item) => item.body).join(" ")), "Branch A invented external attribution");

const branchB = runBranch({ investigation: "m2_a_second_sensor", mission: "m2_m_continue_normal", response: "m2_r_no_counteraction", seed: "phase4-b" });
assert.equal(branchB.records[0].resourcesAfter.ssaCapacity - branchB.records[0].resourcesBefore.ssaCapacity, -20);
assert.equal(branchB.records[0].stateAfter.flags.m2IntelDelay, true);
assert.ok(branchB.result.snapshot.injectsTriggered.includes("m2_inject_2b_intelligence_delay"));
assert.equal(getMove2ResourceConsequence(branchB.records[0].resourceEvents), "هزینه ثبت‌شده: ظرفیت SSA −20");

const branchC = runBranch({ investigation: "m2_a_ally_intel", mission: "m2_m_continue_normal", response: "m2_r_no_counteraction", seed: "phase4-c" });
assert.equal(branchC.records[0].resourcesAfter.politicalCapital - branchC.records[0].resourcesBefore.politicalCapital, -8);
assert.equal(branchC.records[0].resourcesAfter.disclosureBudget - branchC.records[0].resourcesBefore.disclosureBudget, -5);
assert.ok(branchC.current.knowledge.evidenceIds.includes("E_M2_ALLY_01"));
assert.notEqual(branchC.result.snapshot.allyAction, "support_joint_message", "Ally-intel request auto-created allied agreement");

let commercialRestricted;
let commercialAvailable;
for (let index = 0; index < 250 && (!commercialRestricted || !commercialAvailable); index += 1) {
  const seed = `phase4-commercial-${index}`;
  const state = initializeMove2Incident(createInitialScenarioOneState("probe"), `${seed}:incident`);
  const after = applyMove2Decision(state, "m2_investigation", "m2_a_commercial_validation", `${seed}:move2`);
  if (after.flags.m2CommercialRestriction) commercialRestricted = { seed, state: after };
  else commercialAvailable = { seed, state: after };
}
assert.ok(commercialRestricted && commercialAvailable, "Commercial validation did not exercise both trigger outcomes");
assert.equal(Boolean(commercialRestricted.state.flags.m2CommercialRestriction), true);
assert.equal(Boolean(commercialAvailable.state.flags.m2CommercialRestriction), false);

const actState = initializeMove2Incident(createInitialScenarioOneState("probe"), "phase4-e:incident");
const actAfter = applyMove2Decision(actState, "m2_investigation", "m2_a_act_with_current_data", "phase4-e:move2");
assert.equal(actAfter.visible.situationAwareness, actState.visible.situationAwareness, "Act-with-current-data invented information gain");
assert.deepEqual(actAfter.knowledge.evidenceIds, actState.knowledge.evidenceIds);

const branchF = runBranch({ investigation: "m2_a_act_with_current_data", mission: "m2_m_activate_fallback", response: "m2_r_no_counteraction", seed: "phase4-f" });
assert.equal(branchF.records[1].resourcesAfter.protectiveCapacity - branchF.records[1].resourcesBefore.protectiveCapacity, -18);
assert.ok(branchF.records[1].stateAfter.visible.missionContinuity > branchF.records[1].stateBefore.visible.missionContinuity);
assert.equal(buildMove2Observation(branchF.choices).blueResolveSignal, 0);
assert.equal(buildMove2Observation(branchF.choices).coalitionSignal, 0);

const branchG = runBranch({ investigation: "m2_a_act_with_current_data", mission: "m2_m_continue_normal", response: "m2_r_joint_allied_response", seed: "phase4-g", tune: (state) => { state.hidden.allyTrust = 70; return state; } });
assert.equal(branchG.records[2].resourcesAfter.politicalCapital - branchG.records[2].resourcesBefore.politicalCapital, -14);
assert.equal(branchG.records[2].resourcesAfter.disclosureBudget - branchG.records[2].resourcesBefore.disclosureBudget, -8);
assert.ok(buildMove2Observation(branchG.choices).coalitionSignal > 0);
assert.equal(branchG.result.snapshot.allyAction, "support_joint_message");

const authorityState = initializeMove2Incident(createInitialScenarioOneState("probe"), "phase4-h:incident");
const authorityAfter = applyMove2Decision(authorityState, "m2_response", "m2_r_request_defensive_authority", "phase4-h:move2");
assert.equal(authorityAfter.flags.m2DefensiveAuthorityRequested, true);
assert.ok(buildMove2Observation({ investigation: "", mission: "", response: "m2_r_request_defensive_authority", reason: "" }).defensiveAuthoritySignal > 0);
assert.match(JSON.stringify(MOVE2_OPTION_COPY_FA.response.find((item) => item.id === "m2_r_request_defensive_authority")), /دفاعی.*برگشت|دفاعی محدود/);

const offRampState = initializeMove2Incident(createInitialScenarioOneState("benign_ambiguous"), "phase4-i:incident");
const offRampAfter = applyMove2Decision(offRampState, "m2_response", "m2_r_deconfliction_offer", "phase4-i:move2");
assert.equal(offRampAfter.flags.m2OffRampOfferedByBlue, true);
assert.equal(Boolean(offRampAfter.flags.m3NegotiatedOffRamp), false, "Proposal incorrectly resolved negotiated de-escalation");
assert.match(INJECT_NARRATIVES_FA.m2_inject_2d_red_offramp.whyItMatters, /هنوز به معنی حل مسئله انتساب نیست/);

const denialContext = baseContext({ israel: { currentAction: "issue_denial", previousActions: [] } });
const denial = getActorReactionNarrative("israel", "issue_denial", denialContext);
assert.match(denial.body, /رد کرده است/);
assert.match(denial.body, /به‌تنهایی علت رخداد را تعیین نمی‌کند/);
assert.ok(!/تأیید شد|ثابت شد|حقیقت/.test(denial.body));

for (const action of ["maintain_pressure", "reduce_proximity", "introduce_second_asset", "continue_ambiguous_activity", "issue_denial", "offer_mutual_separation", "pause_and_observe"]) {
  assert.ok(ACTOR_REACTION_COPY_FA[`israel:${action}`], `Missing actor reaction ${action}`);
  assert.ok(getMove2SceneCaption(action), `Missing scene caption ${action}`);
}
assert.equal(new Set(["maintain_pressure", "reduce_proximity", "introduce_second_asset", "continue_ambiguous_activity", "issue_denial", "offer_mutual_separation", "pause_and_observe"].map(getMove2SceneCaption)).size, 7);
for (const injectId of ["m2_inject_2b_intelligence_delay", "m2_inject_2c_commercial_restriction", "m2_inject_2d_red_offramp", "m2_inject_2e_coalition_friction"]) {
  assert.equal(INJECT_NARRATIVES_FA[injectId].visibility, "immediate");
}
assert.match(INJECT_NARRATIVES_FA.m2_inject_2e_coalition_friction.whatHappened, /کافی نمی‌داند/);
assert.ok(!/شکاف ائتلافی/.test(`${INJECT_NARRATIVES_FA.m2_inject_2e_coalition_friction.whatHappened} ${INJECT_NARRATIVES_FA.m2_inject_2e_coalition_friction.whyItMatters}`));

assert.ok(branchG.update.length <= 6);
assert.ok(branchG.update.some((item) => item.body === formatAttributionEvolution(45, 60)));
assert.ok(branchG.update.at(-1).body.endsWith(MOVE2_NARRATIVE_COPY_FA.update.transition));
assert.equal(getMove2SceneCaption(branchG.result.snapshot.redAction), MOVE2_NARRATIVE_COPY_FA.sceneCaptions[branchG.result.snapshot.redAction]);
const playerRenderedUpdate = branchG.update.map(({ title, body, kicker, closingLine }) => ({ title, body, kicker, closingLine }));
assert.ok(!/move2\.update|mission\.status|iran\.resources|m2_[a-z0-9_]+/.test(JSON.stringify(playerRenderedUpdate)), "Internal narrative IDs leaked into player-rendered update");

assert.equal(canRenderNarrativeTrace(false, true), false);
assert.equal(canRenderNarrativeTrace(true, false), false);
assert.equal(canRenderNarrativeTrace(true, true), true);
const jsx = fs.readFileSync("src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", "utf8");
assert.ok(jsx.includes('const [narrativeDebugEnabled, setNarrativeDebugEnabled] = useState(false)'));
assert.ok(jsx.includes("enabled={showNarrativeTrace}"));
assert.ok(jsx.includes("enabled && section.trace"));
assert.ok(!jsx.includes('isAdmin && section.trace'));
for (const fragment of [
  "افت سرویس واقعی است، اما علت آن هنوز میان چند فرضیه توزیع شده است.",
  "پس از اطلاعات جدید، اکنون احتمال نقش اسرائیل را چقدر می‌دانید؟",
  "در برابر مجموعه رفتارهای اسرائیل و افت سرویس، چه موضعی اتخاذ شود؟",
]) assert.ok(!jsx.includes(fragment), `Move 2 business prose leaked into JSX: ${fragment}`);
for (const phaseName of ["move2_attr_pre", "move2_attr_post"]) {
  const start = jsx.indexOf(`phase === "${phaseName}"`);
  const end = jsx.indexOf("phase ===", start + 20);
  const block = jsx.slice(start, end);
  assert.match(block, /min=\{0\}/);
  assert.match(block, /max=\{100\}/);
  assert.match(block, /step=\{5\}/);
}

const playerCopy = JSON.stringify({ narrative: MOVE2_NARRATIVE_COPY_FA, evidence: MOVE2_EVIDENCE_COPY_FA, options: MOVE2_OPTION_COPY_FA, reasons: MOVE2_REASON_OPTIONS_FA, actors: Object.fromEntries(Object.entries(ACTOR_REACTION_COPY_FA).filter(([key]) => key.startsWith("israel:") && expectedIds)), injects: Object.fromEntries(Object.entries(INJECT_NARRATIVES_FA).filter(([key]) => key.startsWith("m2_"))) });
assert.ok(!/\b(?:Blue|Red)\b/.test(playerCopy));
assert.ok(!/trueRedIntent|trueIncidentAttribution|move2IncidentCause|seed|utility|snapshot/.test(playerCopy));
assert.ok(!/حمله اسرائیل|اختلال اسرائیلی|خرابکاری/.test(playerCopy));

console.log(JSON.stringify({
  phase: "scenario4-narrative-phase4-move2",
  optionCounts: [investigationOptions.length, missionOptions.length, responseOptions.length],
  reasonOptions: move2ReasonOptions.length,
  actorActionsCovered: 7,
  injectsCovered: 4,
  branchQaCases: 10,
  traceLeakageGate: "passed",
  result: "passed",
}, null, 2));
