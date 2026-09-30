import assert from "node:assert/strict";
import fs from "node:fs";

import { applyBlueDecision } from "../src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts";
import { applyMove2Decision } from "../src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts";
import { applyMove3Decision } from "../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts";
import {
  SCENARIO4_INITIAL_RESOURCE_BASELINE,
  SCENARIO4_RESOURCE_PROFILE_ID,
  createInitialScenarioOneState,
} from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import {
  applyResourceRecovery,
  canAffordResourceCosts,
  formatDirectResourceCost,
  getPersistentResourceWarning,
  getProjectedScarcityWarning,
  getResourceProjection,
  getResourceStatusLabel,
  resourceConsequenceAudit,
} from "../src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts";
import type { ResourceKey, ScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/types.ts";

const tests: string[] = [];
const check = (name: string, fn: () => void) => { fn(); tests.push(name); };
const seed = "resource-calibration-test";

check("selected profile and starting baseline", () => {
  assert.equal(SCENARIO4_RESOURCE_PROFILE_ID, "A");
  assert.deepEqual(SCENARIO4_INITIAL_RESOURCE_BASELINE, { ssaCapacity: 85, protectiveCapacity: 85, politicalCapital: 85, disclosureBudget: 75 });
  const state = createInitialScenarioOneState("probe");
  assert.deepEqual(state.resources, SCENARIO4_INITIAL_RESOURCE_BASELINE);
  assert.deepEqual(state.resourceBaseline, SCENARIO4_INITIAL_RESOURCE_BASELINE);
});

check("status band boundaries", () => {
  const expected: Array<[number, string]> = [[29, "بحرانی"], [30, "محدود"], [49, "محدود"], [50, "تحت فشار"], [69, "تحت فشار"], [70, "مناسب"], [84, "مناسب"], [85, "ظرفیت بالا"], [100, "ظرفیت بالا"]];
  expected.forEach(([value, label]) => assert.equal(getResourceStatusLabel(value), label));
});

check("selected-option direct-cost summary uses canonical audit costs", () => {
  assert.equal(formatDirectResourceCost("m3_coa_negotiated_deescalation"), "هزینه مستقیم منابع: سرمایه سیاسی −12");
  assert.equal(formatDirectResourceCost("m3_coa_coordinated_response"), "هزینه مستقیم منابع: سرمایه سیاسی −18، ظرفیت افشای امن −12، ظرفیت حفاظتی −8");
  assert.equal(formatDirectResourceCost("m3_t_insufficient"), "هزینه مستقیم منابع: ندارد");
  let selectedOptionId = "m3_t_insufficient";
  assert.equal(formatDirectResourceCost(selectedOptionId), "هزینه مستقیم منابع: ندارد");
  selectedOptionId = "m3_coa_negotiated_deescalation";
  assert.equal(formatDirectResourceCost(selectedOptionId), "هزینه مستقیم منابع: سرمایه سیاسی −12");
});

check("scarcity warnings distinguish pressure, limited, critical, and exhaustion", () => {
  assert.equal(getProjectedScarcityWarning(69, true), "این انتخاب ذخیره این منبع را کاهش می‌دهد و انعطاف شما را در تصمیم‌های بعدی کمتر می‌کند.");
  assert.equal(getProjectedScarcityWarning(49, true), "این انتخاب این منبع را وارد وضعیت محدود می‌کند و فضای مانور شما را برای تصمیم‌های بعدی کاهش می‌دهد.");
  assert.equal(getProjectedScarcityWarning(29, true), "این انتخاب این منبع را وارد وضعیت بحرانی می‌کند و انعطاف شما را برای تصمیم‌های بعدی به‌شدت کاهش می‌دهد.");
  assert.equal(getPersistentResourceWarning(49), "این منبع محدود شده است و ذخیره کمتری برای تصمیم‌های بعدی در اختیار دارید.");
  assert.equal(getPersistentResourceWarning(29), "این منبع در وضعیت بحرانی است و ظرفیت باقی‌مانده برای تصمیم‌های بعدی بسیار محدود شده است.");
  assert.equal(getPersistentResourceWarning(0), "ظرفیت قابل تخصیص این منبع باقی نمانده است.");
});

check("no resource starts limited or critical", () => {
  const state = createInitialScenarioOneState("probe");
  assert.ok(Object.values(state.resources).every((value) => value >= 50));
});

check("recovery is capped at starting availability", () => {
  const state = createInitialScenarioOneState("probe");
  state.resources.ssaCapacity = 84;
  const result = applyResourceRecovery(state, "m1_to_m2", { choices: { information: "m1_i_passive", protection: "m1_p_hold" } });
  assert.equal(result.state.resources.ssaCapacity, 85);
  assert.equal(result.state.resources.protectiveCapacity, 85);
});

check("spending and recovery accounting stay separate", () => {
  let state = createInitialScenarioOneState("probe");
  state = applyBlueDecision(state, "m1_information", "m1_i_dedicated_ssa", seed);
  assert.equal(state.resourceAccounting.userSpent.ssaCapacity, 18);
  const result = applyResourceRecovery(state, "m1_to_m2", { choices: { information: "m1_i_dedicated_ssa", protection: "m1_p_hold" } });
  assert.equal(result.state.resourceAccounting.userSpent.ssaCapacity, 18);
  assert.equal(result.state.resourceAccounting.recovered.ssaCapacity, 3);
});

check("projection exposes post-decision status and shortfall", () => {
  const state = createInitialScenarioOneState("probe");
  state.resources.politicalCapital = 4;
  const projection = getResourceProjection(state.resources, "m2_r_request_explanation");
  assert.equal(projection.affordable, false);
  assert.equal(projection.items[0].projected, 0);
  assert.equal(projection.items[0].afterStatus, "بحرانی");
});

check("all audited direct costs match production effects", () => {
  const windows = new Map(resourceConsequenceAudit.map((entry) => [entry.optionId, entry.decisionId]));
  for (const entry of resourceConsequenceAudit) {
    const state = createInitialScenarioOneState("probe");
    state.resources = { ssaCapacity: 100, protectiveCapacity: 100, politicalCapital: 100, disclosureBudget: 100 };
    state.resourceBaseline = { ...state.resources };
    let after: ScenarioOneState;
    const windowId = windows.get(entry.optionId)!;
    if (windowId.startsWith("m1_")) after = applyBlueDecision(state, windowId as "m1_information" | "m1_protection" | "m1_communication", entry.optionId, seed);
    else if (windowId.startsWith("m2_")) after = applyMove2Decision(state, windowId as "m2_investigation" | "m2_mission" | "m2_response", entry.optionId, seed);
    else after = applyMove3Decision(state, windowId as "m3_threshold" | "m3_coa" | "m3_info" | "m3_offramp", entry.optionId);
    for (const resource of Object.keys(state.resources) as ResourceKey[]) {
      assert.equal(after.resources[resource] - state.resources[resource], entry.deltas[resource] ?? 0, `${entry.optionId}:${resource}`);
    }
  }
});

check("insufficient options are blocked without partial benefit", () => {
  const state = createInitialScenarioOneState("probe");
  state.resources.protectiveCapacity = 21;
  assert.equal(canAffordResourceCosts(state.resources, "m3_coa_unilateral_strong"), false);
  const after = applyMove3Decision(state, "m3_coa", "m3_coa_unilateral_strong");
  assert.deepEqual(after, state);
});

check("conservative path remains safe", () => {
  let state = createInitialScenarioOneState("probe");
  state = applyBlueDecision(state, "m1_information", "m1_i_passive", seed);
  state = applyBlueDecision(state, "m1_protection", "m1_p_hold", seed);
  state = applyBlueDecision(state, "m1_communication", "m1_c_none", seed);
  state = applyMove2Decision(state, "m2_investigation", "m2_a_act_with_current_data", seed);
  state = applyMove2Decision(state, "m2_mission", "m2_m_continue_normal", seed);
  state = applyMove2Decision(state, "m2_response", "m2_r_no_counteraction", seed);
  state = applyMove3Decision(state, "m3_coa", "m3_coa_contain_understand");
  state = applyMove3Decision(state, "m3_info", "m3_info_keep_restricted");
  assert.ok(Object.values(state.resources).every((value) => value >= 64));
});

check("high-cost path creates real scarcity without negative values", () => {
  let state = createInitialScenarioOneState("coercion");
  for (const [windowId, optionId] of [
    ["m1_information", "m1_i_allied_network"], ["m1_protection", "m1_p_mission_reposition"], ["m1_communication", "m1_c_allies"],
  ] as const) state = applyBlueDecision(state, windowId, optionId, seed);
  for (const [windowId, optionId] of [
    ["m2_investigation", "m2_a_ally_intel"], ["m2_mission", "m2_m_split_service"], ["m2_response", "m2_r_joint_allied_response"],
  ] as const) state = applyMove2Decision(state, windowId, optionId, seed);
  if (canAffordResourceCosts(state.resources, "m3_coa_coordinated_response")) state = applyMove3Decision(state, "m3_coa", "m3_coa_coordinated_response");
  if (canAffordResourceCosts(state.resources, "m3_info_public_attribution")) state = applyMove3Decision(state, "m3_info", "m3_info_public_attribution");
  assert.ok(Object.values(state.resources).some((value) => value < 30));
  assert.ok(Object.values(state.resources).every((value) => value >= 0));
});

check("legacy 400 baseline is removed", () => {
  const source = fs.readFileSync("src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts", "utf8");
  assert.equal(/400\s*-\s*resourceValues/.test(source), false);
});

check("player UI contains projection, warnings, and scientific boundary", () => {
  const ui = fs.readFileSync("src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", "utf8");
  const resourceEngine = fs.readFileSync("src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts", "utf8");
  assert.match(ui, /برآورد منابع پس از ثبت این تصمیم/);
  assert.match(resourceEngine, /منبع کافی برای این انتخاب وجود ندارد/);
  assert.match(ui, /مقادیر منابع، ظرفیت‌های نرمال‌شده/);
  assert.doesNotMatch(ui, /<Move3ResourceNotice/);
});

console.log(`Scenario 4 resource calibration validation passed (${tests.length} checks).`);
tests.forEach((name) => console.log(`- ${name}`));
