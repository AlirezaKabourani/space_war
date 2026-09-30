import assert from "node:assert/strict";
import fs from "node:fs";
import { adjudicateMoveOne, applyBlueDecision, buildRedObservation } from "../src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { buildNarrativeContext } from "../src/ui/components/scenario/scenario-four/narrative/buildNarrativeContext.ts";
import {
  ACTOR_REACTION_COPY_FA,
  INJECT_NARRATIVES_FA,
  MOVE1_EVIDENCE_COPY_FA,
  MOVE1_NARRATIVE_COPY_FA,
  MOVE1_OPTION_COPY_FA,
  MOVE1_REASON_OPTIONS_FA,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import {
  getMove1CommunicationContext,
  getMove1OpeningNarrative,
  getMove1ProtectionContext,
  getMove1ResourceConsequence,
  getMove1SceneCaption,
  getMoveSituationUpdate,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts";
import {
  communicationOptions,
  informationOptions,
  intelCards,
  protectionOptions,
  reasonOptions,
} from "../src/ui/components/scenario/scenario-four/moves/move1.ts";

const expectedIds = {
  information: ["m1_i_passive", "m1_i_dedicated_ssa", "m1_i_commercial", "m1_i_allied_network"],
  protection: ["m1_p_hold", "m1_p_covert_readiness", "m1_p_visible_protection", "m1_p_mission_reposition"],
  communication: ["m1_c_none", "m1_c_private", "m1_c_allies", "m1_c_public_warning", "m1_c_private_allied"],
  reason: ["کسب اطلاعات بیشتر", "حفاظت از A-17", "جلوگیری از تشدید", "نمایش عزم", "حفظ هماهنگی متحدان", "حفظ منابع"],
};
assert.deepEqual(informationOptions.map((item) => item.id), expectedIds.information);
assert.deepEqual(protectionOptions.map((item) => item.id), expectedIds.protection);
assert.deepEqual(communicationOptions.map((item) => item.id), expectedIds.communication);
assert.deepEqual(reasonOptions.map((item) => item.id), expectedIds.reason);
assert.deepEqual(informationOptions.map((item) => item.weights), [
  { informationSeeking: -0.4, resourceDiscipline: 0.7, escalationSensitivity: 0.2 },
  { informationSeeking: 0.8, resourceDiscipline: -0.2, secondOrderThinking: 0.4 },
  { informationSeeking: 0.7, resourceDiscipline: 0.2, cognitiveFlexibility: 0.5 },
  { informationSeeking: 0.8, coalitionOrientation: 0.8, resourceDiscipline: -0.3, secondOrderThinking: 0.5 },
], "Move 1 cognitive weights changed");

assert.equal(intelCards, MOVE1_EVIDENCE_COPY_FA, "Move 1 evidence must come from the narrative catalog");
assert.equal(MOVE1_EVIDENCE_COPY_FA.filter((card) => card.id.startsWith("E_BASE_")).length, 3);
for (const card of MOVE1_EVIDENCE_COPY_FA.filter((item) => item.id.startsWith("E_BASE_"))) {
  assert.ok(card.text.trim(), `${card.id} lost its claim`);
  assert.ok(card.limitation.trim(), `${card.id} lost its limitation`);
  assert.ok(!/حقیقت پنهان|trueRedIntent|trueIncidentAttribution/.test(`${card.text} ${card.limitation}`));
}
assert.match(MOVE1_EVIDENCE_COPY_FA[0].text, /کاهش یافته/);
assert.match(MOVE1_EVIDENCE_COPY_FA[1].text, /قابلیت عملیات نزدیکی/);
assert.match(MOVE1_EVIDENCE_COPY_FA[2].text, /چند فرضیه/);

const openingText = Object.values(MOVE1_NARRATIVE_COPY_FA.opening).join(" ");
assert.ok(openingText.includes("هیچ اقدام خصمانه‌ای تأیید نشده است"));
assert.ok(!/حمله قریب‌الوقوع|تهدید قطعی|واکنش قاطع لازم است|بی‌عملی خطرناک است/.test(openingText));
assert.ok(!/trueRedIntent|benign_ambiguous|alliance_fracture/.test(openingText));

for (const group of Object.values(MOVE1_OPTION_COPY_FA)) {
  for (const option of group) {
    assert.ok(option.description.trim(), `${option.id} is missing action detail`);
    assert.ok(option.tradeoff.trim(), `${option.id} is missing a trade-off`);
    assert.ok(!/قاطع|هوشمند|منفعل|ضعیف|بی‌عملی/.test(`${option.label} ${option.description} ${option.tradeoff}`), `${option.id} contains biased wording`);
  }
  const lengths = group.map((option) => `${option.description} ${option.tradeoff}`.split(/\s+/).length);
  assert.ok(Math.max(...lengths) / Math.min(...lengths) < 2.4, "Option detail lengths are visibly imbalanced");
}

const makeRecord = (windowId, selectedOptionId, before, after) => ({
  moveId: "move_1",
  windowId,
  selectedOptionId,
  firstSelectedOptionId: selectedOptionId,
  changeCount: 0,
  responseTimeMs: 1000,
  stateBefore: before,
  stateAfter: after,
  resourcesBefore: before.resources,
  resourcesAfter: after.resources,
  resourceEvents: Object.keys(before.resources).flatMap((resource) => {
    const delta = after.resources[resource] - before.resources[resource];
    return delta === 0 ? [] : [{
      kind: "user_cost",
      moveId: "move_1",
      resource,
      source: selectedOptionId,
      before: before.resources[resource],
      delta,
      after: after.resources[resource],
      rationale: "test",
    }];
  }),
});

const runBranch = ({ information, protection, communication, seed, intent = "probe" }) => {
  const initial = createInitialScenarioOneState(intent);
  let current = initial;
  const records = [];
  for (const [windowId, optionId] of [
    ["m1_information", information],
    ["m1_protection", protection],
    ["m1_communication", communication],
  ]) {
    const before = current;
    current = applyBlueDecision(current, windowId, optionId, seed);
    records.push(makeRecord(windowId, optionId, before, current));
  }
  const choices = { information, protection, communication, reason: "حفظ منابع" };
  const result = adjudicateMoveOne({
    startedAt: "2026-01-01T00:00:00.000Z",
    stateBefore: initial,
    stateAfterBlue: current,
    decisions: records,
    evidenceSeen: ["E_BASE_01", "E_BASE_02", "E_BASE_03"],
    choices,
    rngSeed: seed,
  });
  const ctx = buildNarrativeContext({
    runId: `qa-${seed}`,
    phase: "move1",
    move: 1,
    state: result.snapshot.stateAfter,
    move1: result.snapshot,
    decisions: records,
  });
  return { initial, afterBlue: current, records, choices, result, ctx, update: getMoveSituationUpdate(ctx) };
};

const branchA = runBranch({ information: "m1_i_passive", protection: "m1_p_hold", communication: "m1_c_none", seed: "phase3-a" });
assert.deepEqual(buildRedObservation(branchA.choices), {
  visibleProtection: 0, blueResolveSignal: 0, blueEscalationSignal: 0,
  publicPressure: 0, privateCommunication: false, coalitionSignal: 0,
});
assert.equal(getMove1ResourceConsequence(branchA.records[0].resourceEvents), "هزینه مستقیم منابع: ندارد");
assert.ok(branchA.update.some((item) => /نامشخص|کافی نیست/.test(item.body)), "Branch A invented certainty");

const branchB = runBranch({ information: "m1_i_dedicated_ssa", protection: "m1_p_covert_readiness", communication: "m1_c_private", seed: "phase3-b" });
assert.ok(branchB.afterBlue.knowledge.evidenceIds.includes("E_SSA_01"));
assert.equal(branchB.afterBlue.flags.privateCommunication, true);
assert.equal(Boolean(branchB.afterBlue.flags.publicWarningIssued), false);
assert.equal(buildRedObservation(branchB.choices).visibleProtection, 0);
assert.equal(getMove1ResourceConsequence(branchB.records[0].resourceEvents), "هزینه ثبت‌شده: ظرفیت SSA −18");

const baseForConflict = createInitialScenarioOneState("probe");
let conflictSeed;
for (let index = 0; index < 200; index += 1) {
  const candidate = `phase3-conflict-${index}`;
  if (applyBlueDecision(baseForConflict, "m1_information", "m1_i_commercial", candidate).flags.conflictingCommercialData) {
    conflictSeed = candidate;
    break;
  }
}
assert.ok(conflictSeed, "Could not find deterministic commercial-conflict seed");
const branchC = runBranch({ information: "m1_i_commercial", protection: "m1_p_visible_protection", communication: "m1_c_public_warning", seed: conflictSeed });
assert.equal(branchC.afterBlue.flags.conflictingCommercialData, true);
assert.equal(branchC.afterBlue.flags.publicWarningIssued, true);
assert.ok(branchC.result.snapshot.injectsTriggered.includes("m1_inject_1a_conflicting_data"));
assert.ok(branchC.result.snapshot.injectsTriggered.includes("m1_inject_1c_media"));
assert.ok(!/حمله را انجام داده|حمله اسرائیل|انتساب قطعی/.test(branchC.update.map((item) => item.body).join(" ")));

const branchD = runBranch({ information: "m1_i_allied_network", protection: "m1_p_mission_reposition", communication: "m1_c_allies", seed: "phase3-d" });
assert.equal(branchD.afterBlue.flags.sharedWithAlly, true);
assert.equal(branchD.afterBlue.resources.protectiveCapacity, branchD.initial.resources.protectiveCapacity - 28);
assert.equal(branchD.afterBlue.resources.politicalCapital, branchD.initial.resources.politicalCapital - 18);
assert.equal(branchD.afterBlue.resources.disclosureBudget, branchD.initial.resources.disclosureBudget - 14);
assert.ok(buildRedObservation(branchD.choices).coalitionSignal > 0);

for (const action of ["break_off", "send_routine_explanation"]) {
  const snapshot = { ...branchA.result.snapshot, redAction: action };
  const ctx = buildNarrativeContext({ runId: `qa-${action}`, phase: "move1", move: 1, state: snapshot.stateAfter, move1: snapshot, decisions: branchA.records });
  const update = getMoveSituationUpdate(ctx);
  assert.ok(update[0].body.includes(ACTOR_REACTION_COPY_FA[`israel:${action}`].body));
  if (action === "break_off") assert.equal(getMove1SceneCaption(action), "R-31 در حال افزایش فاصله از A-17 است.");
  if (action === "send_routine_explanation") assert.match(update[0].body, /مستقلاً تأیید نشده/);
}

for (const action of ["continue_approach", "slow_approach", "hold_position", "send_routine_explanation", "break_off"]) {
  assert.ok(ACTOR_REACTION_COPY_FA[`israel:${action}`]);
  assert.ok(getMove1SceneCaption(action));
}
assert.equal(new Set(["continue_approach", "slow_approach", "hold_position", "send_routine_explanation", "break_off"].map(getMove1SceneCaption)).size, 5);

assert.equal(INJECT_NARRATIVES_FA.m1_inject_1a_conflicting_data.cta, "ادامه با اطلاعات فعلی");
for (const id of ["m1_inject_1a_conflicting_data", "m1_inject_1b_ally_request", "m1_inject_1c_media"]) {
  assert.equal(INJECT_NARRATIVES_FA[id].visibility, "immediate");
}
assert.ok(!branchA.update.some((item) => /توجه رسانه‌ای|درخواست توضیح از سوی متحد|اختلاف در برآورد مسیر/.test(item.body)), "Inactive inject leaked into Branch A");

for (const branch of [branchA, branchB, branchC, branchD]) {
  assert.ok(branch.update.length <= 5, "Move 1 situation update exceeded five sections");
  assert.ok(branch.update.at(-1).body.endsWith(MOVE1_NARRATIVE_COPY_FA.update.closingLine));
  assert.ok(getMove1ProtectionContext(branch.ctx).length > MOVE1_NARRATIVE_COPY_FA.decisions.protection.baseContext.length);
  assert.ok(getMove1CommunicationContext(branch.ctx).length > MOVE1_NARRATIVE_COPY_FA.decisions.communication.baseContext.length);
}

const hiddenVariant = structuredClone(branchA.initial);
hiddenVariant.hidden.trueRedIntent = "coercion";
hiddenVariant.hidden.trueIncidentAttribution = "red";
const publicA = buildNarrativeContext({ runId: "hidden-a", phase: "move1", move: 1, state: branchA.initial });
const publicB = buildNarrativeContext({ runId: "hidden-a", phase: "move1", move: 1, state: hiddenVariant });
assert.deepEqual(getMove1OpeningNarrative(publicA), getMove1OpeningNarrative(publicB), "Hidden truth changed Move 1 opening");

const playerFacing = JSON.stringify({
  narrative: MOVE1_NARRATIVE_COPY_FA,
  evidence: MOVE1_EVIDENCE_COPY_FA,
  options: MOVE1_OPTION_COPY_FA,
  reasons: MOVE1_REASON_OPTIONS_FA,
  actors: Object.fromEntries(Object.entries(ACTOR_REACTION_COPY_FA).filter(([key]) => /^(israel|ally|commercial):/.test(key))),
  injects: Object.fromEntries(Object.entries(INJECT_NARRATIVES_FA).filter(([key]) => key.startsWith("m1_"))),
});
assert.ok(!/\b(?:Blue|Red)\b/.test(playerFacing));
assert.ok(!/trueRedIntent|trueIncidentAttribution|benign_ambiguous|alliance_fracture/.test(playerFacing));
assert.ok(!/Deconfliction/.test(playerFacing));

const jsx = fs.readFileSync("src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", "utf8");
for (const fragment of [
  "سامانه پایش مداری ایران تغییر محدودی",
  "داده فعلی نزدیک‌شدن R-31 را تأیید می‌کند",
  "مهم‌ترین عامل در مجموعه تصمیم‌های این مرحله",
]) assert.ok(!jsx.includes(fragment), `Move 1 business prose leaked into JSX: ${fragment}`);
assert.ok(jsx.includes("getMove1ProtectionContext(narrativeContext)"));
assert.ok(jsx.includes("getMove1CommunicationContext(narrativeContext)"));
assert.ok(jsx.includes("getMove1SceneCaption(redAction)"));

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const evidenceWords = MOVE1_EVIDENCE_COPY_FA
  .filter((card) => card.id.startsWith("E_BASE_"))
  .reduce((sum, card) => sum + wordCount(`${card.title} ${card.status} ${card.text} ${card.limitation}`), 0);

console.log(JSON.stringify({
  phase: "scenario4-narrative-phase3-move1",
  baselineEvidenceCards: 3,
  baselineEvidenceWords: evidenceWords,
  move1OptionCounts: [informationOptions.length, protectionOptions.length, communicationOptions.length],
  reasonOptions: reasonOptions.length,
  actorActionsCovered: 5,
  injectsCovered: 3,
  branchQaCases: 6,
  result: "passed",
}, null, 2));
