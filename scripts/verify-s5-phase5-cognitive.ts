import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MISSION_ACTION_CATALOG } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import type { MissionActionId } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import {
  CROSS_DECISION_COHERENCE_MATRICES,
  S5_COGNITIVE_FORMULA_VERSION,
  S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
  S5_EXPERT_PANEL_VERSION,
  S5_OPTION_PROFILE_VERSION,
  S5_REASON_MODEL_VERSION,
  S5_SCENARIO_CONTENT_VERSION,
  S5_VALIDITY_STATUS,
  SCENARIO5_OPTION_PROFILES,
  adjustedOrientationForDecision,
  adjustedRiskForDecision,
  calculateDataCompleteness,
  calculateEvidenceResponsiveUpdating,
  calculateIntegration,
  calculatePlayerVisibleEvidenceSupport,
  calculateReasonAlignment,
  calculateScenario5CognitiveRunResult,
  calculateTelemetrySummary,
  getCrossDecisionCoherence,
  getScenario5OptionProfile,
  multiCriteriaForProfile,
  rawOrientation,
  validateScenario5CognitiveTelemetry,
} from "../src/ui/components/scenario/scenario-five/model/cognitive/index.ts";
import type {
  BeliefTelemetry,
  CognitiveWindowId,
  DecisionTelemetry,
  EvidenceOpenTelemetry,
  EvidenceTelemetry,
  PhaseId,
  ReasonId,
  Scenario5CognitiveTelemetryBundle,
} from "../src/ui/components/scenario/scenario-five/model/cognitive/index.ts";

let assertions = 0;
const check = (condition: unknown, message: string): void => { assert.ok(condition, message); assertions += 1; };
const equal = (actual: unknown, expected: unknown, message: string): void => { assert.deepEqual(actual, expected, message); assertions += 1; };
const close = (actual: number | null, expected: number, message: string, tolerance = 1e-9): void => {
  assert.ok(actual !== null && Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
  assertions += 1;
};
const rejects = (fn: () => unknown, pattern: RegExp, message: string): void => { assert.throws(fn, pattern, message); assertions += 1; };

const windowRows = [
  ["A1_baseline_monitoring", "A", 1], ["A2_evidence_acquisition", "A", 2],
  ["B1_monitoring_allocation", "B", 3], ["B2_route_policy", "B", 4],
  ["C1_support_and_checkpoints", "C", 5], ["C2_resource_portfolio", "C", 6],
  ["D1_crisis_response", "D", 7], ["D2_final_delivery_policy", "D", 8],
] as const;
const actionsForRound = (roundId: number): MissionActionId[] =>
  MISSION_ACTION_CATALOG.filter((item) => item.roundId === roundId).map(({ actionId }) => actionId);

const makeDecision = (
  windowId: CognitiveWindowId,
  finalSelectedActionId?: MissionActionId,
  availableActionIds?: readonly MissionActionId[],
  evidenceIds: readonly string[] = [],
): DecisionTelemetry => {
  const row = windowRows.find(([id]) => id === windowId)!;
  const available = availableActionIds ? [...availableActionIds] : actionsForRound(row[2]);
  const final = finalSelectedActionId ?? available[0] ?? null;
  const revised = row[2] % 2 === 0;
  const first = revised ? (available[1] ?? final) : final;
  const enteredAtMs = row[2] * 10_000;
  return {
    phaseId: row[1], roundId: row[2], windowId,
    availableActionIds: available,
    firstSelectedActionId: first,
    finalSelectedActionId: final,
    selectionHistory: first ? [{ actionId: first, selectedAtMs: enteredAtMs + 100 }] : [],
    enteredAtMs, confirmedAtMs: enteredAtMs + 900, elapsedMs: 900,
    activeDecisionMs: row[2] * 1000, hiddenTabMs: 0, revisionCount: revised ? 1 : 0,
    availableEvidenceIds: [...evidenceIds], openedEvidenceIds: [...evidenceIds],
    playerVisibleResourcesBefore: { isrCapacity: 101 - row[2] * 10, supportReserve: 101 - row[2] * 10 },
    playerVisibleResourcesAfter: { isrCapacity: 100 - row[2] * 10, supportReserve: 100 - row[2] * 10 },
  };
};

const evidenceFor = (windowId: CognitiveWindowId, index: number): EvidenceTelemetry => ({
  evidenceId: `e${index}`,
  sourceType: index % 2 === 0 ? "field_report" : "pnt_telemetry",
  observedCorridorId: "corridor_alpha_east",
  direction: "supports_targeted",
  strengthBand: index < 3 ? "weak" : "moderate",
  relevantWindowIds: [windowId], availableAtMs: index * 10_000,
  qualityLabelVisible: "visible quality", limitationVisible: "visible limitation",
});

const perfectEvidence = windowRows.map(([windowId], index) => evidenceFor(windowId, index + 1));
const perfectDecisions = windowRows.map(([windowId], index) => makeDecision(windowId, undefined, undefined, [perfectEvidence[index]!.evidenceId]));
const perfectOpens: EvidenceOpenTelemetry[] = perfectDecisions.map((decision, index) => ({
  evidenceId: perfectEvidence[index]!.evidenceId,
  windowId: decision.windowId,
  openedAtMs: decision.enteredAtMs! + 200,
  closedAtMs: decision.enteredAtMs! + 400,
  activeDwellMs: 200,
}));
const perfectBeliefs: BeliefTelemetry[] = [
  ["A2_prebelief", 35, ["e1"]], ["A2_postbelief", 50, ["e1", "e2"]],
  ["C_belief_checkpoint", 65, ["e1", "e2", "e3", "e4"]],
  ["D_final_belief", 80, perfectEvidence.map(({ evidenceId }) => evidenceId)],
].map(([checkpointId, estimate, ids], index) => ({
  checkpointId: checkpointId as BeliefTelemetry["checkpointId"], recordedAtMs: 30_000 + index * 10_000,
  mostLikelyCorridorId: "corridor_alpha_east", corridorConfidence: 70,
  targetedInterferenceEstimate: estimate as number, targetedInterferenceConfidence: 75,
  visibleEvidenceIdsAtCheckpoint: ids as string[],
}));
const perfectBundle: Scenario5CognitiveTelemetryBundle = {
  scenarioId: "s5_silent_waves_redesign", runId: "perfect", startedAtMs: 0, completedAtMs: 100_000,
  decisions: perfectDecisions, evidence: perfectEvidence, evidenceOpens: perfectOpens, beliefs: perfectBeliefs,
  reasons: [
    { phaseId: "B", reasonId: "reason_information_confidence", recordedAtMs: 45_000, capturedBeforeOutcome: true },
    { phaseId: "C", reasonId: "reason_preserve_resources", recordedAtMs: 65_000, capturedBeforeOutcome: true },
    { phaseId: "D", reasonId: "reason_limit_actor_reaction", recordedAtMs: 85_000, capturedBeforeOutcome: true },
  ],
};
const bundleWith = (patch: Partial<Scenario5CognitiveTelemetryBundle>): Scenario5CognitiveTelemetryBundle => ({ ...perfectBundle, ...patch });

// Exact versions and profile catalog.
equal([
  S5_COGNITIVE_MEASUREMENT_MODEL_VERSION, S5_COGNITIVE_FORMULA_VERSION, S5_OPTION_PROFILE_VERSION,
  S5_REASON_MODEL_VERSION, S5_SCENARIO_CONTENT_VERSION, S5_EXPERT_PANEL_VERSION, S5_VALIDITY_STATUS,
], [
  "s5-cognitive-v3-adapter-v1.0.0", "cognitive-v3-semantic-v1.0.0", "s5-option-profiles-internal-v1.0.0",
  "s5-reason-model-internal-v1.0.0", "s5-silent-waves-redesign-content-v1.0.0", "not-yet-expert-validated",
  "experimental_pending_expert_and_human_validation",
], "exact version constants");
equal(SCENARIO5_OPTION_PROFILES.length, 33, "exact profile count");
equal(SCENARIO5_OPTION_PROFILES.map(({ actionId }) => actionId), MISSION_ACTION_CATALOG.map(({ actionId }) => actionId), "profile IDs exactly match mission action catalog");
for (const item of SCENARIO5_OPTION_PROFILES) {
  const scalarValues = [item.operationalLoading, item.strategicLoading, item.informationSeeking,
    item.futureConsequenceThinking, item.adversaryModeling, item.escalationSensitivity,
    item.reversibilityPreference, item.resourceStewardship, item.contingencyPlanning, item.riskExposure];
  check(scalarValues.every((value) => value >= 0 && value <= 1 && Number.isInteger(value * 10)), `${item.actionId} scalar profile range and precision`);
  check(Object.values(item.domainSalience).every((value) => value >= 0 && value <= 1 && Number.isInteger(value * 10)), `${item.actionId} domain range and precision`);
  equal(getScenario5OptionProfile(item.actionId), item, `${item.actionId} profile lookup`);
}
const profileSpots: readonly [MissionActionId, readonly number[], Readonly<Record<string, number>>][] = [
  ["a1_network_baseline", [.5,.7,.9,.7,.3,.1,.9,.5,.7,.3], { information:.9, network:.7 }],
  ["a2_ground_liaison", [.6,.6,.9,.6,.4,.3,.5,.4,.7,.5], { navigation:.7, resources:.4 }],
  ["b1_priority_cargo", [.9,.3,.6,.3,.2,.2,.6,.4,.3,.6], { mission:.9, logistics:.7 }],
  ["b2_hold_verify", [.4,.7,.9,.6,.4,.7,.9,.5,.6,.4], { information:.9, futureOptions:.6 }],
  ["c1_ground_recon", [.7,.6,.9,.6,.6,.5,.5,.4,.7,.5], { information:.9, escalation:.5 }],
  ["c2_balanced", [.6,.9,.6,.9,.6,.5,.8,.9,.9,.3], { resources:.9, network:.9 }],
  ["d1_deception_routing", [.6,.9,.2,.8,.9,.7,.6,.6,.8,.6], { escalation:.8, futureOptions:.8 }],
  ["d2_resilient_handoff", [.7,.8,.1,.9,.5,.4,.8,.7,.9,.3], { navigation:.9, futureOptions:.9 }],
];
for (const [actionId, values, domains] of profileSpots) {
  const item = getScenario5OptionProfile(actionId);
  equal([item.operationalLoading, item.strategicLoading, item.informationSeeking, item.futureConsequenceThinking,
    item.adversaryModeling, item.escalationSensitivity, item.reversibilityPreference, item.resourceStewardship,
    item.contingencyPlanning, item.riskExposure], values, `${actionId} exact scalar spot check`);
  for (const [key, value] of Object.entries(domains)) equal(item.domainSalience[key as keyof typeof item.domainSalience], value, `${actionId} ${key} domain spot check`);
}

// OSI: raw, centering, actual option set, anchors, and phase balance.
close(rawOrientation(getScenario5OptionProfile("a1_network_baseline")), .2 / 1.200000001, "raw orientation formula");
const twoOptionDecision = makeDecision("A1_baseline_monitoring", "a1_preserve_reserve", ["a1_priority_focus", "a1_preserve_reserve"]);
const rawTwo = ["a1_priority_focus", "a1_preserve_reserve"].map((id) => rawOrientation(getScenario5OptionProfile(id as MissionActionId)));
const baselineTwo = (rawTwo[0]! + rawTwo[1]!) / 2;
const maximumTwo = Math.max(...rawTwo.map((value) => Math.abs(value - baselineTwo)));
close(adjustedOrientationForDecision(twoOptionDecision), (rawTwo[1]! - baselineTwo) / maximumTwo, "centered normalized orientation");
const withUnavailableProfiles = adjustedOrientationForDecision(twoOptionDecision);
equal(withUnavailableProfiles, adjustedOrientationForDecision({ ...twoOptionDecision, selectionHistory: [] }), "unavailable profiles cannot influence adjusted score");
const unavailableProbe = makeDecision("A1_baseline_monitoring", "a1_network_baseline", ["a1_priority_focus", "a1_network_baseline"]);
check(adjustedOrientationForDecision(unavailableProbe) !== adjustedOrientationForDecision({
  ...unavailableProbe,
  availableActionIds: [...unavailableProbe.availableActionIds, "a1_preserve_reserve"],
}), "profile influences orientation only when added to actual available set");
equal(adjustedOrientationForDecision(makeDecision("A1_baseline_monitoring", "a1_priority_focus", ["a1_priority_focus"])), null, "single option excluded");
equal(adjustedOrientationForDecision(makeDecision("A1_baseline_monitoring", "a1_network_baseline", ["a1_network_baseline", "a1_rotating_watch"])), null, "no-spread orientation excluded");
const osiWindows = windowRows.filter(([id]) => id !== "A2_evidence_acquisition");
for (const [windowId, , roundId] of osiWindows) {
  const available = actionsForRound(roundId);
  const rawValues = available.map((id) => rawOrientation(getScenario5OptionProfile(id)));
  check(Math.max(...rawValues) - Math.min(...rawValues) > 1e-9, `${windowId} frozen OSI set has spread`);
  const adjustedAll = available.map((id) => adjustedOrientationForDecision(makeDecision(windowId, id, available))!);
  close(adjustedAll.reduce((sum, value) => sum + value, 0) / adjustedAll.length, 0, `${windowId} adjusted set mean is zero`, 1e-8);
}
const anchorBundle = (selected: readonly MissionActionId[]) => bundleWith({
  decisions: windowRows.map(([windowId], index) => makeDecision(windowId, selected[index])),
  evidence: [], evidenceOpens: [], beliefs: [], reasons: [],
});
const operationalAnchor = ["a1_priority_focus","a2_focused_pnt","b1_priority_cargo","b2_reroute","c1_fallback_nav","c2_priority_surge","d1_emergency_reroute","d2_critical_delivery_surge"] as const;
const strategicAnchor = ["a1_preserve_reserve","a2_broad_sweep","b1_split_attention","b2_staged_checkpoints","c1_preserve_mobile_reserve","c2_balanced","d1_deception_routing","d2_continuity_first_finish"] as const;
check(calculateScenario5CognitiveRunResult(anchorBundle(operationalAnchor)).orientation.overall! < 0, "operational anchor is negative");
check(calculateScenario5CognitiveRunResult(anchorBundle(strategicAnchor)).orientation.overall! > 0, "strategic anchor is positive");
const strategicResult = calculateScenario5CognitiveRunResult(anchorBundle(strategicAnchor));
close(strategicResult.orientation.overall, strategicResult.orientation.phaseScores.reduce((sum, value) => sum + value!, 0) / 4, "four phases receive equal OSI weight");
const oneBWindow = anchorBundle(strategicAnchor);
const withoutB2 = bundleWith({ ...oneBWindow, decisions: oneBWindow.decisions.filter(({ windowId }) => windowId !== "B2_route_policy") });
const withoutB2Result = calculateScenario5CognitiveRunResult(withoutB2);
close(withoutB2Result.orientation.overall, withoutB2Result.orientation.phaseScores.reduce((sum, value) => sum + value!, 0) / 4, "window count cannot increase phase weight");
const equalBWindows = anchorBundle(strategicAnchor);
const equalBDecisions = equalBWindows.decisions.map((decision) => {
  if (decision.windowId === "B1_monitoring_allocation") return makeDecision(decision.windowId, "b1_split_attention", ["b1_priority_cargo", "b1_split_attention"]);
  if (decision.windowId === "B2_route_policy") return makeDecision(decision.windowId, "b2_hold_verify", ["b2_reroute", "b2_hold_verify"]);
  return decision;
});
const equalBFull = calculateScenario5CognitiveRunResult(bundleWith({ ...equalBWindows, decisions: equalBDecisions })).orientation.overall;
const equalBReduced = calculateScenario5CognitiveRunResult(bundleWith({ ...equalBWindows, decisions: equalBDecisions.filter(({ windowId }) => windowId !== "B2_route_policy") })).orientation.overall;
close(equalBFull, equalBReduced!, "adding an equal-valued window inside phase B does not increase phase weight");

// Strengths, integration, and population dispersion.
for (const value of [strategicResult.orientation.operationalStrength, strategicResult.orientation.strategicStrength, strategicResult.orientation.integration]) {
  check(value !== null && value >= 0 && value <= 100, "strength/integration range");
}
close(strategicResult.orientation.integration,
  2 * strategicResult.orientation.operationalStrength! * strategicResult.orientation.strategicStrength!
    / (strategicResult.orientation.operationalStrength! + strategicResult.orientation.strategicStrength!), "harmonic integration exact");
check(strategicResult.orientation.integration! < 100, "balanced finite loadings do not look maximally integrated");
close(calculateIntegration(80, 60), 2 * 80 * 60 / 140, "integration harmonic-mean example");
close(calculateIntegration(20, 20), 20, "low-low balance remains low integration");
equal(calculateIntegration(0, 0), null, "zero integration denominator is unavailable");
const phaseValues = strategicResult.orientation.phaseScores.filter((value): value is number => value !== null);
const phaseMean = phaseValues.reduce((sum, value) => sum + value, 0) / phaseValues.length;
close(strategicResult.orientation.dispersion, Math.sqrt(phaseValues.reduce((sum, value) => sum + (value - phaseMean) ** 2, 0) / phaseValues.length), "population SD exact");

// Information seeking coverage, diversity, evidence relevance, renormalization, and dwell firewall.
const infoDecision = makeDecision("A2_evidence_acquisition", "a2_focused_pnt", undefined, ["info1", "info2"]);
const infoEvidence: EvidenceTelemetry[] = [
  { ...evidenceFor("A2_evidence_acquisition", 2), evidenceId: "info1", sourceType: "pnt_telemetry" },
  { ...evidenceFor("A2_evidence_acquisition", 2), evidenceId: "info2", sourceType: "field_report" },
  { ...evidenceFor("B1_monitoring_allocation", 3), evidenceId: "unrelated", sourceType: "radio_timing" },
];
const infoBundle = (opens: readonly EvidenceOpenTelemetry[], evidence = infoEvidence) => bundleWith({
  decisions: [infoDecision], evidence, evidenceOpens: opens, beliefs: [], reasons: [],
});
const openInfo1: EvidenceOpenTelemetry = { evidenceId: "info1", windowId: "A2_evidence_acquisition", openedAtMs: 20_200, closedAtMs: 20_300, activeDwellMs: 100 };
close(calculateScenario5CognitiveRunResult(infoBundle([openInfo1])).constructs.informationSeeking, 66.5, "coverage half and zero diversity exact");
close(calculateScenario5CognitiveRunResult(infoBundle([])).constructs.informationSeeking, 54, "diversity zero with no opened evidence");
const oneSourceEvidence = [{ ...infoEvidence[0]!, evidenceId: "info1" }];
const oneSourceDecision = { ...infoDecision, availableEvidenceIds: ["info1"], openedEvidenceIds: ["info1"] };
close(calculateScenario5CognitiveRunResult(bundleWith({ decisions: [oneSourceDecision], evidence: oneSourceEvidence, evidenceOpens: [openInfo1], beliefs: [], reasons: [] })).constructs.informationSeeking, 94, "K=1 opened source diversity rule");
const openInfo2: EvidenceOpenTelemetry = { ...openInfo1, evidenceId: "info2", openedAtMs: 20_250 };
close(calculateScenario5CognitiveRunResult(infoBundle([openInfo1, openInfo2])).constructs.informationSeeking, 94, "two-source entropy diversity exact");
const noEvidenceDecision = makeDecision("A1_baseline_monitoring", "a1_network_baseline", undefined, []);
close(calculateScenario5CognitiveRunResult(bundleWith({ decisions: [noEvidenceDecision], evidence: [], evidenceOpens: [], beliefs: [], reasons: [] })).constructs.informationSeeking, 90, "no-evidence diagnostic window renormalizes to option loading");
const unrelatedAdded = calculateScenario5CognitiveRunResult(infoBundle([openInfo1])).constructs.informationSeeking;
close(calculateScenario5CognitiveRunResult(infoBundle([openInfo1, { ...openInfo1, evidenceId: "unrelated" }])).constructs.informationSeeking, unrelatedAdded!, "unrelated evidence excluded");
close(calculateScenario5CognitiveRunResult(infoBundle([{ ...openInfo1, activeDwellMs: 999999 }])).constructs.informationSeeking, unrelatedAdded!, "dwell does not alter score");

// Player-visible evidence support and responsive updating.
const supportEvidence: EvidenceTelemetry[] = [
  { ...evidenceFor("A1_baseline_monitoring", 1), evidenceId: "weakT", strengthBand: "weak", direction: "supports_targeted", sourceType: "pnt_telemetry" },
  { ...evidenceFor("A1_baseline_monitoring", 1), evidenceId: "moderateT", strengthBand: "moderate", direction: "supports_targeted", sourceType: "field_report" },
  { ...evidenceFor("A1_baseline_monitoring", 1), evidenceId: "strongT", strengthBand: "strong", direction: "supports_targeted", sourceType: "radio_timing" },
  { ...evidenceFor("A1_baseline_monitoring", 1), evidenceId: "amb", strengthBand: "strong", direction: "ambiguous", sourceType: "ground_recon" },
  { ...evidenceFor("A1_baseline_monitoring", 1), evidenceId: "non", strengthBand: "strong", direction: "supports_nonhostile", sourceType: "satellite_isr" },
];
close(calculatePlayerVisibleEvidenceSupport(supportEvidence, ["weakT"]), .625, "weak targeted support");
close(calculatePlayerVisibleEvidenceSupport(supportEvidence, ["moderateT"]), .8, "moderate targeted support");
close(calculatePlayerVisibleEvidenceSupport(supportEvidence, ["strongT"]), .95, "strong targeted support");
close(calculatePlayerVisibleEvidenceSupport(supportEvidence, ["amb"]), .5, "ambiguous sign exact");
close(calculatePlayerVisibleEvidenceSupport(supportEvidence, ["non"]), .05, "nonhostile sign exact");
const duplicateSource = [...supportEvidence, { ...supportEvidence[2]!, evidenceId: "strongSame", sourceType: "pnt_telemetry" as const }];
close(calculatePlayerVisibleEvidenceSupport(duplicateSource, ["weakT", "strongSame"]), .95, "duplicate source collapses to greatest absolute strength");
const otherCorridor = { ...supportEvidence[0]!, evidenceId: "otherCorridor", observedCorridorId: "corridor_beta_south" as const, strengthBand: "strong" as const };
close(calculatePlayerVisibleEvidenceSupport([...supportEvidence, otherCorridor], ["non", "otherCorridor"]), .95, "corridor maximum behavior");
close(calculatePlayerVisibleEvidenceSupport([], []), .5, "no evidence neutral support");
const belief = (checkpointId: BeliefTelemetry["checkpointId"], estimate: number, ids: string[]): BeliefTelemetry => ({
  checkpointId, recordedAtMs: 1, mostLikelyCorridorId: "corridor_delta_west", corridorConfidence: 50,
  targetedInterferenceEstimate: estimate, targetedInterferenceConfidence: 50, visibleEvidenceIdsAtCheckpoint: ids,
});
close(calculateEvidenceResponsiveUpdating([belief("A2_prebelief", 50, []), belief("A2_postbelief", 95, ["strongT"])], supportEvidence), 100, "direction and magnitude agreement exact");
close(calculateEvidenceResponsiveUpdating([belief("A2_prebelief", 50, []), belief("A2_postbelief", 5, ["strongT"])], supportEvidence), 0, "opposite direction exact");
close(calculateEvidenceResponsiveUpdating([belief("A2_prebelief", 50, []), belief("A2_postbelief", 75, ["strongT"])], supportEvidence), 84, "magnitude alignment exact");
equal(calculateEvidenceResponsiveUpdating([belief("A2_prebelief", 50, []), belief("A2_postbelief", 80, [])], supportEvidence), null, "zero evidence delta omitted");
equal(calculateEvidenceResponsiveUpdating([belief("A2_postbelief", 50, []), belief("C_belief_checkpoint", 95, ["strongT"])], supportEvidence), 100, "checkpoint order uses adjacent CP2 to CP3");
equal(calculateEvidenceResponsiveUpdating([belief("A2_prebelief", 50, []), belief("A2_postbelief", 95, ["strongT"])], supportEvidence),
  calculateEvidenceResponsiveUpdating([belief("A2_prebelief", 50, []), { ...belief("A2_postbelief", 95, ["strongT"]), mostLikelyCorridorId: "corridor_gamma_northwest" }], supportEvidence),
  "corridor hypothesis correctness does not enter score");

// Second order, adversary, escalation, stewardship, and planning formulas/windows.
const constructBundle = anchorBundle(strategicAnchor);
const constructResult = calculateScenario5CognitiveRunResult(constructBundle);
const selectedProfile = getScenario5OptionProfile("c2_balanced");
const expectedSecond = .35 * selectedProfile.futureConsequenceThinking + .25 * selectedProfile.adversaryModeling
  + .2 * selectedProfile.reversibilityPreference + .2 * selectedProfile.resourceStewardship;
const singleC2 = bundleWith({ decisions: [makeDecision("C2_resource_portfolio", "c2_balanced")], evidence: [], evidenceOpens: [], beliefs: [], reasons: [] });
close(calculateScenario5CognitiveRunResult(singleC2).constructs.secondOrderThinking, 100 * expectedSecond, "second-order exact formula in eligible C2 window");
close(calculateScenario5CognitiveRunResult(singleC2).constructs.adversaryModeling, 100 * selectedProfile.adversaryModeling, "adversary modeling exact C2 formula");
const singleD1 = bundleWith({ decisions: [makeDecision("D1_crisis_response", "d1_ground_containment")], evidence: [], evidenceOpens: [], beliefs: [], reasons: [] });
close(calculateScenario5CognitiveRunResult(singleD1).constructs.escalationSensitivity, 100 * getScenario5OptionProfile("d1_ground_containment").escalationSensitivity, "escalation exact D1 formula");
equal(calculateScenario5CognitiveRunResult(bundleWith({ decisions: [makeDecision("A1_baseline_monitoring")], evidence: [], evidenceOpens: [], beliefs: [], reasons: [] })).constructs.adversaryModeling, null, "adversary modeling excludes ineligible window");
equal(calculateScenario5CognitiveRunResult(bundleWith({ decisions: [makeDecision("C1_support_and_checkpoints")], evidence: [], evidenceOpens: [], beliefs: [], reasons: [] })).constructs.escalationSensitivity, null, "escalation excludes ineligible window");
const missingResources = bundleWith({ decisions: perfectDecisions.map((decision, index) => index === 0 ? { ...decision, playerVisibleResourcesBefore: null } : decision) });
equal(calculateScenario5CognitiveRunResult(missingResources).constructs.resourceStewardship, null, "missing resource snapshot makes stewardship unavailable");
const penaltyBundle = (isrCapacity: number, supportReserve: number) => bundleWith({
  decisions: perfectDecisions.map((decision) => decision.windowId === "D2_final_delivery_policy"
    ? { ...decision, playerVisibleResourcesAfter: { isrCapacity, supportReserve } } : decision),
});
const noPenalty = calculateScenario5CognitiveRunResult(penaltyBundle(10, 10)).constructs.resourceStewardship!;
const stewardshipEntries = perfectDecisions.map((decision) => {
  const item = getScenario5OptionProfile(decision.finalSelectedActionId!);
  return { phaseId: decision.phaseId, value: .5*item.resourceStewardship+.3*item.contingencyPlanning+.2*item.reversibilityPreference };
});
const expectedStewardship = ["A","B","C","D"].map((phaseId) => {
  const values = stewardshipEntries.filter((entry) => entry.phaseId === phaseId).map(({ value }) => value);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}).reduce((sum, value) => sum + value, 0) / 4 * 100;
close(noPenalty, expectedStewardship, "resource stewardship exact base formula and zero exhaustion penalty");
close(calculateScenario5CognitiveRunResult(penaltyBundle(5, 10)).constructs.resourceStewardship, Math.max(0, noPenalty - 5), "one exhausted resource penalty 0.05");
close(calculateScenario5CognitiveRunResult(penaltyBundle(5, 5)).constructs.resourceStewardship, Math.max(0, noPenalty - 10), "two exhausted resources penalty 0.10");
const c2Planning = .35*selectedProfile.contingencyPlanning+.25*selectedProfile.reversibilityPreference
  +.2*selectedProfile.resourceStewardship+.2*selectedProfile.futureConsequenceThinking;
close(calculateScenario5CognitiveRunResult(singleC2).constructs.planningForesight, 100*c2Planning, "planning exact formula in eligible C2 window");

// Multi-criteria entropy/mean salience and relative risk.
const narrow = { ...getScenario5OptionProfile("a1_network_baseline"), domainSalience: { mission: .9 } };
const broad = { ...getScenario5OptionProfile("a1_network_baseline"), domainSalience: { mission: .3, information: .3, navigation: .3 } };
close(multiCriteriaForProfile(narrow), 0, "single-domain normalized entropy is zero");
const broadTotal = .9;
const broadEntropy = Math.log(3) / Math.log(9);
close(multiCriteriaForProfile(broad), broadEntropy * (broadTotal / 9), "multi-domain entropy and mean salience exact");
check(multiCriteriaForProfile(broad)! > multiCriteriaForProfile(narrow)!, "comparable multi-domain option exceeds narrow option");
equal(getScenario5OptionProfile("a1_network_baseline").domainSalience.navigation ?? 0, 0, "omitted domain is exactly zero");
const riskDecision = makeDecision("B2_route_policy", "b2_continue_crosscheck", ["b2_reroute", "b2_continue_crosscheck"]);
const risks = [.3, .5];
close(adjustedRiskForDecision(riskDecision), 1, "relative risk high option centered to +1");
close(adjustedRiskForDecision({ ...riskDecision, finalSelectedActionId: "b2_reroute" }), -1, "relative risk low option centered to -1");
check(risks[1]! > risks[0]!, "risk polarity is exposure-only and non-normative");

// Exact matrices, seven reason rubrics, validity timing, and 60/40 coherence.
for (const phaseId of ["B", "C", "D"] as const) {
  const matrix = CROSS_DECISION_COHERENCE_MATRICES[phaseId];
  for (const [first, row] of Object.entries(matrix)) {
    for (const [second, expected] of Object.entries(row)) {
      equal(getCrossDecisionCoherence(phaseId, first as MissionActionId, second as MissionActionId), expected, `${phaseId} matrix ${first}/${second}`);
    }
  }
}
const reasonAction = getScenario5OptionProfile("d1_ground_containment");
const domain = (key: keyof typeof reasonAction.domainSalience) => reasonAction.domainSalience[key] ?? 0;
const reasonExpected: Readonly<Record<ReasonId, number>> = {
  reason_mission_speed: .45*reasonAction.operationalLoading+.35*domain("mission")+.2*reasonAction.riskExposure,
  reason_reduce_exposure: .35*(1-reasonAction.riskExposure)+.25*domain("navigation")+.2*reasonAction.contingencyPlanning+.2*reasonAction.reversibilityPreference,
  reason_preserve_resources: .6*reasonAction.resourceStewardship+.25*reasonAction.futureConsequenceThinking+.15*reasonAction.reversibilityPreference,
  reason_network_continuity: .4*domain("network")+.25*domain("logistics")+.2*reasonAction.strategicLoading+.15*reasonAction.contingencyPlanning,
  reason_information_confidence: .6*reasonAction.informationSeeking+.25*domain("information")+.15*reasonAction.reversibilityPreference,
  reason_limit_actor_reaction: .4*reasonAction.adversaryModeling+.35*reasonAction.escalationSensitivity+.25*reasonAction.reversibilityPreference,
  reason_preserve_reversibility: .5*reasonAction.reversibilityPreference+.3*reasonAction.contingencyPlanning+.2*reasonAction.futureConsequenceThinking,
};
for (const [reasonId, expected] of Object.entries(reasonExpected)) close(calculateReasonAlignment("d1_ground_containment", reasonId as ReasonId), expected, `${reasonId} exact rubric`);
const afterOutcomeReasons = perfectBundle.reasons.map((reason) => ({ ...reason, capturedBeforeOutcome: false }));
equal(calculateScenario5CognitiveRunResult(bundleWith({ reasons: afterOutcomeReasons })).constructs.decisionCoherence, null, "after-outcome reasons invalid for coherence");
equal(calculateScenario5CognitiveRunResult(bundleWith({ reasons: perfectBundle.reasons.slice(0, 1) })).constructs.decisionCoherence, null, "fewer than two reason phases unavailable");
const coherenceResult = calculateScenario5CognitiveRunResult(perfectBundle).constructs.decisionCoherence!;
const phaseReasonAndCross = (["B", "C", "D"] as const).map((phaseId) => {
  const reason = perfectBundle.reasons.find((item) => item.phaseId === phaseId)!;
  const decisions = perfectBundle.decisions.filter((item) => item.phaseId === phaseId);
  const first = decisions[0]!.finalSelectedActionId!; const second = decisions[1]!.finalSelectedActionId!;
  return { reason: (calculateReasonAlignment(first, reason.reasonId)+calculateReasonAlignment(second, reason.reasonId))/2, cross: getCrossDecisionCoherence(phaseId, first, second)! };
});
close(coherenceResult, 100*(.6*phaseReasonAndCross.reduce((s,x)=>s+x.reason,0)/3+.4*phaseReasonAndCross.reduce((s,x)=>s+x.cross,0)/3), "decision coherence exact 60/40 formula");

// Completeness, summary, and malformed-input validation.
validateScenario5CognitiveTelemetry(perfectBundle);
equal(calculateDataCompleteness(perfectBundle), { overall:100, decisions:100, timing:100, evidence:100, estimates:100, reasons:100 }, "perfect telemetry completeness 100");
const missingDecisionCompleteness = calculateDataCompleteness(bundleWith({ decisions: perfectDecisions.slice(0, 7) }));
close(missingDecisionCompleteness.decisions, 87.5, "missing decision exact completeness reduction");
close(missingDecisionCompleteness.overall, 90, "missing decision affects decision, timing, and evidence components exactly");
const missingTimingBundle = bundleWith({ decisions: perfectDecisions.map((decision) => ({ ...decision, activeDecisionMs: null })) });
equal(calculateDataCompleteness(missingTimingBundle).timing, 0, "missing timing records data quality as zero completeness");
equal(calculateScenario5CognitiveRunResult(missingTimingBundle).orientation, calculateScenario5CognitiveRunResult(perfectBundle).orientation, "missing timing does not become zero performance");
equal(calculateDataCompleteness(bundleWith({ beliefs: [], reasons: [] })).estimates, 0, "missing estimates respected");
equal(calculateDataCompleteness(bundleWith({ beliefs: [], reasons: [] })).reasons, 0, "missing reasons respected");
const alteredChoices = bundleWith({ decisions: perfectDecisions.map((decision) => ({ ...decision, finalSelectedActionId: decision.availableActionIds.at(-1)! })) });
equal(calculateDataCompleteness(alteredChoices), calculateDataCompleteness(perfectBundle), "completeness independent of score profile choice");
equal(calculateTelemetrySummary(perfectBundle), {
  medianActiveDecisionMs:4500, iqrActiveDecisionMs:3500, totalRevisions:4, revisedWindows:4, evidenceTriggeredRevisionRate:50,
}, "median, interpolated IQR, revisions, and evidence-triggered revisions exact");
equal(calculateTelemetrySummary(bundleWith({ decisions: perfectDecisions.map((decision) => ({ ...decision, activeDecisionMs:null })), evidenceOpens:[] })).medianActiveDecisionMs, null, "no valid timing summary is null");
equal(calculateTelemetrySummary(bundleWith({ evidenceOpens:[] })).evidenceTriggeredRevisionRate, null, "no eligible evidence-trigger window is null");

rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ decisions:[perfectDecisions[0]!, perfectDecisions[0]!] })), /Duplicate decision/, "duplicate decision rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ decisions:[{ ...perfectDecisions[0]!, finalSelectedActionId:"unknown" as MissionActionId }] })), /unknown action/, "unknown profile rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ decisions:[{ ...perfectDecisions[0]!, finalSelectedActionId:"a2_broad_sweep" }] })), /not available/, "unavailable final action rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ decisions:[{ ...perfectDecisions[0]!, phaseId:"B" }] })), /Wrong phase/, "wrong mapping rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ beliefs:[perfectBeliefs[0]!, perfectBeliefs[0]!] })), /Duplicate belief/, "duplicate belief rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ beliefs:[{ ...perfectBeliefs[0]!, corridorConfidence:101 }] })), /outside/, "belief range rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ reasons:[perfectBundle.reasons[0]!, perfectBundle.reasons[0]!] })), /Duplicate reason/, "duplicate reason phase rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ decisions:[{ ...perfectDecisions[0]!, activeDecisionMs:-1 }] })), /nonnegative/, "negative duration rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ evidence:[perfectEvidence[0]!, perfectEvidence[0]!] })), /Duplicate evidence/, "duplicate evidence rejects");
rejects(() => validateScenario5CognitiveTelemetry(bundleWith({ decisions:[{ ...perfectDecisions[0]!, availableEvidenceIds:["missing"] }] })), /Invalid evidence reference/, "invalid evidence reference rejects");

// Hidden/outcome firewall and architectural regression boundary.
const cognitiveDirectory = fileURLToPath(new URL("../src/ui/components/scenario/scenario-five/model/cognitive/", import.meta.url));
const forbidden = [
  "TrueWorldState", "ActorInternalState", "worldId", "seed", "endState", "resolveMissionEndState",
  "isThreatContained", "integrity", "deliveredAtMinute", "Math.random", "hiddenProvenance", "ActorReaction", "actorReaction",
];
for (const file of readdirSync(cognitiveDirectory).filter((name) => name.endsWith(".ts"))) {
  const source = readFileSync(`${cognitiveDirectory}/${file}`, "utf8");
  for (const token of forbidden) check(!source.includes(token), `${file} excludes forbidden token ${token}`);
  check(!/from\s+["']react(?:\/[^"']*)?["']|import\s+["']react(?:\/[^"']*)?["']/i.test(source), `${file} has no React import`);
  check(!/missionEngine|endStateResolver/.test(source), `${file} has no mission engine/resolver import`);
}
check(!Object.hasOwn(perfectBundle, "worldId") && !Object.hasOwn(perfectBundle, "endState"), "telemetry contract has no hidden/outcome fields");
check(!Object.hasOwn(calculateScenario5CognitiveRunResult(perfectBundle), "overallCognitiveScore"), "result has no global cognitive score");

console.log(`Scenario 5 Phase-5 cognitive verification passed (${assertions} assertions).`);
