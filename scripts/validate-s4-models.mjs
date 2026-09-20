import assert from "node:assert/strict";
import {
  calculateOrientationV2,
  getOrientationLoading,
  orientationLoadingMatrix,
  orientationWindows,
  validateOrientationModelV2,
} from "../src/ui/components/scenario/scenario-four/model/orientationModelV2.ts";
import {
  applyResourceRecovery,
  captureDecisionResourceEvents,
  getResourceStatusLabel,
  resourceConsequenceAudit,
} from "../src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";

const moveByWindow = (windowId) => windowId.startsWith("m1_") ? "move_1" : windowId.startsWith("m2_") ? "move_2" : "move_3";
const makeRecord = (windowId, selectedOptionId, responseTimeMs = 5000) => ({
  moveId: moveByWindow(windowId),
  windowId,
  selectedOptionId,
  firstSelectedOptionId: selectedOptionId,
  changeCount: 0,
  responseTimeMs,
  stateBefore: {},
  stateAfter: {},
  resourcesBefore: {},
  resourcesAfter: {},
});

for (const [windowId, optionIds] of Object.entries(orientationWindows)) {
  const centered = optionIds.map((optionId) => getOrientationLoading(windowId, optionId));
  assert.ok(centered.every((value) => value != null && value >= -1 && value <= 1), `${windowId}: invalid centered loading`);
  assert.ok(Math.abs(centered.reduce((sum, value) => sum + value, 0) / centered.length) < 1e-12, `${windowId}: centered mean is not zero`);
  for (const optionId of optionIds) {
    const loading = orientationLoadingMatrix[optionId];
    assert.ok(loading && loading.operationalLoading >= 0 && loading.operationalLoading <= 1);
    assert.ok(loading.strategicLoading >= 0 && loading.strategicLoading <= 1);
    assert.ok(loading.diagnosticWeight >= .5 && loading.diagnosticWeight <= 1.2);
  }
}

const records = Object.entries(orientationWindows).map(([windowId, options]) => makeRecord(windowId, options[0]));
const result = calculateOrientationV2(records);
assert.equal(result.completedCoreDecisions, 9);
assert.ok(result.overall != null);
assert.ok(Math.abs(result.overall - (result.perMove.move1 + result.perMove.move2 + result.perMove.move3) / 3) < 1e-12, "overall must equal exact mean of three moves");
assert.ok(Math.abs(((result.overall + 1) / 2) * 100 - (result.overall * 50 + 50)) < 1e-12, "marker formula mismatch");

const withOptional = calculateOrientationV2([...records, makeRecord("m3_offramp", "reject")]);
const withReason = calculateOrientationV2([...records, makeRecord("m1_reason", "حفظ منابع")]);
const withDifferentTimes = calculateOrientationV2(records.map((record) => ({ ...record, responseTimeMs: 80000 })));
assert.equal(withOptional.overall, result.overall, "optional off-ramp changed core OSI");
assert.equal(withReason.overall, result.overall, "reason capture changed core OSI");
assert.equal(withDifferentTimes.overall, result.overall, "response time changed core OSI");
assert.equal(calculateOrientationV2(records.slice(0, 8)).overall, null, "missing decision should mark OSI incomplete");
assert.ok(calculateOrientationV2(records.slice(0, 8)).dataQuality < result.dataQuality, "missing decision should reduce confidence");

const randomBaseline = validateOrientationModelV2(100_000, 0x5A17);
assert.ok(randomBaseline.passed, `random baseline mean ${randomBaseline.mean} is outside tolerance`);

assert.equal(resourceConsequenceAudit.length, Object.values(orientationWindows).reduce((sum, options) => sum + options.length, 0) + 4, "resource audit must cover every core option and four off-ramp options");
assert.ok(resourceConsequenceAudit.every((entry) => entry.rationale && entry.stateEffects && entry.opportunityCost));
assert.deepEqual(
  [100, 85, 84, 70, 69, 50, 49, 30, 29, 0].map(getResourceStatusLabel),
  ["فراوان", "فراوان", "مناسب", "مناسب", "تحت فشار", "تحت فشار", "محدود", "محدود", "بحرانی", "بحرانی"],
  "resource threshold labels changed"
);

const state = createInitialScenarioOneState("probe");
const spentState = structuredClone(state);
spentState.resources.ssaCapacity = 82;
const decisionEvents = captureDecisionResourceEvents(state.resources, spentState.resources, "m1_i_dedicated_ssa", "move_1");
assert.equal(decisionEvents[0].delta, -18);
assert.equal(decisionEvents[0].after, 82);
const recovery = applyResourceRecovery(spentState, "m1_to_m2", { choices: { information: "m1_i_dedicated_ssa", protection: "m1_p_hold" } });
assert.equal(recovery.state.resources.ssaCapacity, 85);
assert.ok(recovery.events.every((event) => event.kind === "transition_recovery" && event.rationale));
assert.equal(recovery.state.resources.disclosureBudget, 100, "disclosure must not receive baseline refill");
assert.ok(Object.values(recovery.state.resources).every((value) => value >= 0 && value <= 100));

console.log(JSON.stringify({ orientation: "passed", resources: "passed", randomBaseline }, null, 2));
