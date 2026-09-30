import assert from "node:assert/strict";
import fs from "node:fs";

import { adjudicateMoveOne, applyBlueDecision } from "../src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts";
import {
  adjudicateMove2,
  applyMove2Decision,
  getInvestigationConfidenceDelta,
  initializeMove2Incident,
} from "../src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts";
import {
  adjudicateMove3,
  applyMove3Decision,
  getAttributionConfidenceBandFa,
  initializeMove3Severity,
} from "../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts";
import { createInitialScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { applyResourceRecovery } from "../src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts";

const withCause = (cause, intent = "probe") => {
  const state = createInitialScenarioOneState(intent);
  state.hidden.move2IncidentCause = cause;
  state.hidden.trueIncidentAttribution = cause === "red_reversible_interference"
    ? "red"
    : cause === "mixed_cause"
      ? "mixed"
      : "non_red";
  state.flags.m2IncidentInitialized = true;
  return state;
};

const applyEvidencePath = ({ cause, move1Information, investigation, intent = "probe" }) => {
  let state = withCause(cause, intent);
  state = applyBlueDecision(state, "m1_information", move1Information, "confidence-fixture");
  return applyMove2Decision(state, "m2_investigation", investigation, "confidence-fixture:m2");
};

// A — pure red + strongest independent evidence crosses 70 only as a multi-source path.
const pureRedStrong = applyEvidencePath({
  cause: "red_reversible_interference",
  move1Information: "m1_i_dedicated_ssa",
  investigation: "m2_a_second_sensor",
  intent: "coercion",
});
assert.equal(pureRedStrong.knowledge.systemAttributionConfidence, 72);
assert.ok(pureRedStrong.knowledge.systemAttributionConfidence >= 70);

// B — pure red + weak evidence remains unresolved.
const pureRedWeak = applyEvidencePath({
  cause: "red_reversible_interference",
  move1Information: "m1_i_passive",
  investigation: "m2_a_act_with_current_data",
});
assert.equal(pureRedWeak.knowledge.systemAttributionConfidence, 20);
assert.ok(pureRedWeak.knowledge.systemAttributionConfidence < 55);

// C — mixed cause responds to strong evidence but remains distinct from pure red.
const mixedStrong = applyEvidencePath({
  cause: "mixed_cause",
  move1Information: "m1_i_dedicated_ssa",
  investigation: "m2_a_second_sensor",
});
assert.equal(mixedStrong.knowledge.systemAttributionConfidence, 59);
assert.ok(mixedStrong.knowledge.systemAttributionConfidence >= 55);
assert.ok(mixedStrong.knowledge.systemAttributionConfidence < pureRedStrong.knowledge.systemAttributionConfidence);

// D — a diagnosed technical fault meaningfully reduces confidence.
const technicalDiagnostics = applyEvidencePath({
  cause: "technical_fault",
  move1Information: "m1_i_dedicated_ssa",
  investigation: "m2_a_technical_diagnostics",
});
assert.equal(technicalDiagnostics.knowledge.systemAttributionConfidence, 14);
assert.ok(technicalDiagnostics.knowledge.systemAttributionConfidence < 20);

// E — environmental/non-red with weak evidence stays low.
const environmentalWeak = applyEvidencePath({
  cause: "environmental_or_external",
  move1Information: "m1_i_passive",
  investigation: "m2_a_act_with_current_data",
});
assert.equal(environmentalWeak.knowledge.systemAttributionConfidence, 20);

// F — prior conflicting commercial evidence caps later commercial corroboration.
const commercialWithoutConflict = getInvestigationConfidenceDelta({
  optionId: "m2_a_commercial_validation",
  cause: "red_reversible_interference",
  attribution: "red",
  allyTrust: 65,
  commercialResult: "consistent",
});
const commercialWithConflict = getInvestigationConfidenceDelta({
  optionId: "m2_a_commercial_validation",
  cause: "red_reversible_interference",
  attribution: "red",
  allyTrust: 65,
  commercialResult: "consistent",
  conflictingCommercialData: true,
});
assert.equal(commercialWithoutConflict, 22);
assert.equal(commercialWithConflict, 2);

// G — allied reporting is corroboration whose effect depends on trust, not a truth oracle.
const allyLowerTrust = getInvestigationConfidenceDelta({
  optionId: "m2_a_ally_intel",
  cause: "red_reversible_interference",
  attribution: "red",
  allyTrust: 69,
});
const allyHigherTrust = getInvestigationConfidenceDelta({
  optionId: "m2_a_ally_intel",
  cause: "red_reversible_interference",
  attribution: "red",
  allyTrust: 70,
});
assert.equal(allyLowerTrust, 22);
assert.equal(allyHigherTrust, 30);
assert.ok(allyHigherTrust < 40);

// A complete production path reaches the ninth ending through the actual UI option IDs.
const rngSeed = "scenario4-exhaustive-world-0:probe";
const move1Choices = {
  information: "m1_i_dedicated_ssa",
  protection: "m1_p_hold",
  communication: "m1_c_none",
  reason: "",
};
const initial = createInitialScenarioOneState("probe");
let move1State = applyBlueDecision(initial, "m1_information", move1Choices.information, rngSeed);
move1State = applyBlueDecision(move1State, "m1_protection", move1Choices.protection, rngSeed);
move1State = applyBlueDecision(move1State, "m1_communication", move1Choices.communication, rngSeed);
const move1 = adjudicateMoveOne({
  startedAt: "2030-01-01T00:00:00.000Z",
  stateBefore: initial,
  stateAfterBlue: move1State,
  decisions: [],
  evidenceSeen: [],
  choices: move1Choices,
  rngSeed,
}).snapshot;
move1.completedAt = "2030-01-01T00:00:01.000Z";
const recoveredMove1 = applyResourceRecovery(move1.stateAfter, "m1_to_m2", {
  choices: move1Choices,
  redAction: move1.redAction,
  allyAction: move1.allyAction,
  commercialAction: move1.commercialAction,
});
const move2Initial = initializeMove2Incident(recoveredMove1.state, `${rngSeed}:move2:${move1.completedAt}`);
const move2Choices = {
  investigation: "m2_a_second_sensor",
  mission: "m2_m_continue_normal",
  response: "m2_r_private_warning",
  reason: "",
};
let move2State = applyMove2Decision(move2Initial, "m2_investigation", move2Choices.investigation, `${rngSeed}:move2`);
move2State = applyMove2Decision(move2State, "m2_mission", move2Choices.mission, `${rngSeed}:move2`);
move2State = applyMove2Decision(move2State, "m2_response", move2Choices.response, `${rngSeed}:move2`);
const move2 = adjudicateMove2({
  startedAt: "2030-01-01T00:00:00.000Z",
  stateBefore: move2Initial,
  stateAfterBlue: move2State,
  attributionEstimatePre: 50,
  attributionEstimatePost: 50,
  decisions: [],
  evidenceSeen: [],
  choices: move2Choices,
  rngSeed: `${rngSeed}:move2`,
  previousMoveSnapshotRef: move1.completedAt,
}).snapshot;
move2.completedAt = "2030-01-01T00:00:02.000Z";
const recoveredMove2 = applyResourceRecovery(move2.stateAfter, "m2_to_m3", {
  choices: move2Choices,
  redAction: move2.redAction,
  allyAction: move2.allyAction,
  commercialAction: move2.commercialAction,
});
let move3State = initializeMove3Severity(recoveredMove2.state, move2, `${rngSeed}:move3`);
const move3Choices = {
  threshold: "m3_t_insufficient",
  coa: "m3_coa_unilateral_strong",
  informationPolicy: "m3_info_public_partial",
  reason: "",
};
move3State = applyMove3Decision(move3State, "m3_threshold", move3Choices.threshold);
move3State = applyMove3Decision(move3State, "m3_coa", move3Choices.coa);
move3State = applyMove3Decision(move3State, "m3_info", move3Choices.informationPolicy);
const mixedContainment = adjudicateMove3({
  runId: "confidence-reachability",
  scenarioId: "4",
  runSeed: rngSeed,
  move1,
  move2,
  startedAt: "2030-01-01T00:00:00.000Z",
  stateBefore: move2.stateAfter,
  stateAfterBlue: move3State,
  playerAttributionEstimateFinal: 50,
  choices: move3Choices,
  decisions: [],
  evidenceSeen: [],
  rngSeed: `${rngSeed}:move3`,
});
assert.equal(move2Initial.hidden.move2IncidentCause, "mixed_cause");
assert.equal(mixedContainment.finalSnapshot.finalState.knowledge.systemAttributionConfidence, 59);
assert.equal(mixedContainment.finalSnapshot.primaryEndState, "mixed_crisis_containment");

assert.deepEqual(
  [0, 20, 40, 55, 70, 85].map(getAttributionConfidenceBandFa),
  ["بسیار ضعیف", "ضعیف", "متوسط", "نسبتاً قوی", "قوی", "بسیار قوی"],
);

assert.deepEqual(createInitialScenarioOneState("probe").resources, {
  ssaCapacity: 85,
  protectiveCapacity: 85,
  politicalCapital: 85,
  disclosureBudget: 75,
});

const resolverSource = fs.readFileSync(
  new URL("../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts", import.meta.url),
  "utf8",
);
assert.match(resolverSource, /const attributionUnresolved = state\.knowledge\.systemAttributionConfidence < 55/);
assert.doesNotMatch(resolverSource, /attributionUnresolved\s*=.*playerAttributionEstimate/);

console.log(JSON.stringify({
  suite: "scenario4-attribution-confidence",
  fixtures: 7,
  pureRedStrong: pureRedStrong.knowledge.systemAttributionConfidence,
  pureRedWeak: pureRedWeak.knowledge.systemAttributionConfidence,
  mixedStrong: mixedStrong.knowledge.systemAttributionConfidence,
  technicalDiagnostics: technicalDiagnostics.knowledge.systemAttributionConfidence,
  environmentalWeak: environmentalWeak.knowledge.systemAttributionConfidence,
  realMixedContainmentPath: "passed",
  result: "passed",
}, null, 2));
