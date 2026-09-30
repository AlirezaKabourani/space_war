import fs from "node:fs";
import path from "node:path";

import { adjudicateMoveOne, applyBlueDecision, type MoveOneChoices } from "../src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts";
import { adjudicateMove2, applyMove2Decision, initializeMove2Incident, type Move2Choices } from "../src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts";
import { applyMove3Decision, initializeMove3Severity } from "../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts";
import { createInitialScenarioOneState, SCENARIO4_RESOURCE_PROFILES, type Scenario4ResourceProfileId } from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import { applyResourceRecovery, canAffordResourceCosts } from "../src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts";
import { communicationOptions, informationOptions, protectionOptions } from "../src/ui/components/scenario/scenario-four/moves/move1.ts";
import { investigationOptions, missionOptions, responseOptions } from "../src/ui/components/scenario/scenario-four/moves/move2.ts";
import { crisisCoaOptions, informationPolicyOptions, offRampOptions, thresholdOptions } from "../src/ui/components/scenario/scenario-four/moves/move3.ts";
import type { RedIntent, ResourceKey, ScenarioOneState } from "../src/ui/components/scenario/scenario-four/model/types.ts";

const iterations = Number(process.argv[process.argv.indexOf("--iterations") + 1] || 100_000);
const outFile = process.argv[process.argv.indexOf("--out") + 1] || "analysis/scenario4-resource-profile-comparison.json";
const intents: RedIntent[] = ["probe", "intelligence_collection", "coercion", "alliance_fracture", "benign_ambiguous"];
const resourceKeys: ResourceKey[] = ["ssaCapacity", "protectiveCapacity", "politicalCapital", "disclosureBudget"];
const ids = <T extends { id: string }>(values: T[]) => values.map((value) => value.id);
const choices = {
  m1i: ids(informationOptions), m1p: ids(protectionOptions), m1c: ids(communicationOptions),
  m2a: ids(investigationOptions), m2m: ids(missionOptions), m2r: ids(responseOptions),
  m3t: ids(thresholdOptions), m3c: ids(crisisCoaOptions), m3i: ids(informationPolicyOptions), m3o: ids(offRampOptions),
};

let randomState = 0x51A4C17;
const random = () => { randomState = (1664525 * randomState + 1013904223) >>> 0; return randomState / 0x100000000; };
const pick = <T>(values: T[]) => values[Math.floor(random() * values.length)];
const pickAffordable = (state: ScenarioOneState, values: string[], blocked: Record<string, number>) => {
  const first = pick(values);
  if (canAffordResourceCosts(state.resources, first)) return first;
  blocked[first] = (blocked[first] ?? 0) + 1;
  const affordable = values.filter((option) => canAffordResourceCosts(state.resources, option));
  return pick(affordable);
};
const makeStats = () => ({ count: 0, sums: Object.fromEntries(resourceKeys.map((key) => [key, 0])) as Record<ResourceKey, number>, below70: 0, below50: 0, below30: 0, zero: 0 });
const addStats = (stats: ReturnType<typeof makeStats>, resources: ScenarioOneState["resources"]) => {
  const values = resourceKeys.map((key) => resources[key]); stats.count += 1;
  resourceKeys.forEach((key) => { stats.sums[key] += resources[key]; });
  if (values.some((value) => value < 70)) stats.below70 += 1;
  if (values.some((value) => value < 50)) stats.below50 += 1;
  if (values.some((value) => value < 30)) stats.below30 += 1;
  if (values.some((value) => value === 0)) stats.zero += 1;
};
const summarize = (stats: ReturnType<typeof makeStats>) => ({
  paths: stats.count,
  means: Object.fromEntries(resourceKeys.map((key) => [key, Number((stats.sums[key] / stats.count).toFixed(2))])),
  below70: stats.below70 / stats.count,
  below50: stats.below50 / stats.count,
  below30: stats.below30 / stats.count,
  exactZero: stats.zero / stats.count,
});

const result: Record<string, unknown> = { generatedAt: new Date().toISOString(), iterationsPerProfile: iterations, profiles: {} };
for (const profileId of Object.keys(SCENARIO4_RESOURCE_PROFILES) as Scenario4ResourceProfileId[]) {
  randomState = 0x51A4C17;
  const move1Stats = makeStats(); const move2Stats = makeStats(); const finalStats = makeStats();
  const blocked: Record<string, number> = {};
  for (let index = 0; index < iterations; index += 1) {
    const intent = intents[index % intents.length]; const rngSeed = `resource-profile:${index}:${intent}`;
    const initial = createInitialScenarioOneState(intent); const baseline = { ...SCENARIO4_RESOURCE_PROFILES[profileId] };
    initial.resources = { ...baseline }; initial.resourceBaseline = { ...baseline };
    let state = initial;
    const m1Choices: MoveOneChoices = {
      information: pickAffordable(state, choices.m1i, blocked), protection: "", communication: "", reason: "",
    };
    state = applyBlueDecision(state, "m1_information", m1Choices.information, rngSeed);
    m1Choices.protection = pickAffordable(state, choices.m1p, blocked); state = applyBlueDecision(state, "m1_protection", m1Choices.protection, rngSeed);
    m1Choices.communication = pickAffordable(state, choices.m1c, blocked); state = applyBlueDecision(state, "m1_communication", m1Choices.communication, rngSeed);
    const m1 = adjudicateMoveOne({ startedAt: "2030-01-01T00:00:00Z", stateBefore: initial, stateAfterBlue: state, decisions: [], evidenceSeen: [], choices: m1Choices, rngSeed });
    addStats(move1Stats, m1.snapshot.stateAfter.resources);
    const rec1 = applyResourceRecovery(m1.snapshot.stateAfter, "m1_to_m2", { choices: m1Choices, redAction: m1.snapshot.redAction, allyAction: m1.snapshot.allyAction, commercialAction: m1.snapshot.commercialAction });
    const move2Initial = initializeMove2Incident(rec1.state, `${rngSeed}:move2`);
    const m2Choices: Move2Choices = { investigation: pickAffordable(move2Initial, choices.m2a, blocked), mission: "", response: "", reason: "" };
    state = applyMove2Decision(move2Initial, "m2_investigation", m2Choices.investigation, rngSeed);
    m2Choices.mission = pickAffordable(state, choices.m2m, blocked); state = applyMove2Decision(state, "m2_mission", m2Choices.mission, rngSeed);
    m2Choices.response = pickAffordable(state, choices.m2r, blocked); state = applyMove2Decision(state, "m2_response", m2Choices.response, rngSeed);
    const m2 = adjudicateMove2({ startedAt: "2030-01-01T00:00:00Z", stateBefore: move2Initial, stateAfterBlue: state, attributionEstimatePre: 50, attributionEstimatePost: 50, decisions: [], evidenceSeen: [], choices: m2Choices, rngSeed, previousMoveSnapshotRef: "fixed" });
    addStats(move2Stats, m2.snapshot.stateAfter.resources);
    const rec2 = applyResourceRecovery(m2.snapshot.stateAfter, "m2_to_m3", { choices: m2Choices, redAction: m2.snapshot.redAction, allyAction: m2.snapshot.allyAction, commercialAction: m2.snapshot.commercialAction });
    state = initializeMove3Severity(rec2.state, m2.snapshot, `${rngSeed}:move3`);
    state = applyMove3Decision(state, "m3_threshold", pick(choices.m3t));
    const coa = pickAffordable(state, choices.m3c, blocked); state = applyMove3Decision(state, "m3_coa", coa);
    const informationPolicy = pickAffordable(state, choices.m3i, blocked); state = applyMove3Decision(state, "m3_info", informationPolicy);
    if (state.flags.m2OffRampOfferedByRed || state.flags.m2OffRampOfferedByBlue || coa === "m3_coa_negotiated_deescalation") {
      const offRamp = pickAffordable(state, choices.m3o, blocked); state = applyMove3Decision(state, "m3_offramp", offRamp);
    }
    addStats(finalStats, state.resources);
  }
  (result.profiles as Record<string, unknown>)[profileId] = {
    baseline: SCENARIO4_RESOURCE_PROFILES[profileId],
    move1: summarize(move1Stats), move2: summarize(move2Stats), final: summarize(finalStats),
    blockedAttempts: Object.values(blocked).reduce((sum, value) => sum + value, 0), blockedByOption: blocked,
  };
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf8");
console.log(`Wrote ${outFile}`);
