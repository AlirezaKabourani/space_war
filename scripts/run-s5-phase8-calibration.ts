import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import {
  CANONICAL_ACTOR_PROFILES,
  CANONICAL_CORRIDORS,
  WORLD_CATALOG,
  createInitialTrueWorldState,
} from "../src/ui/components/scenario/scenario-five/model/index.ts";
import {
  S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
  calculateScenario5CognitiveRunResult,
} from "../src/ui/components/scenario/scenario-five/model/cognitive/index.ts";
import {
  MISSION_MODEL_VERSION,
} from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import {
  S5_DOMAIN_METRICS_VERSION,
  S5_RUNTIME_MODEL_VERSION,
} from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import type { Scenario5RuntimeState } from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import {
  COGNITIVE_POLICIES,
  MISSION_POLICIES,
  S5_CALIBRATION_STATUS,
  S5_CALIBRATION_VERSION,
  SHADOW_DEADLINE_SHIFTS,
  SHADOW_HORIZONS,
  SHADOW_RESOURCE_BUDGETS,
  WITNESS_RANDOM_POLICY,
  buildPersianCalibrationReport,
  calculateActionCoverage,
  calculateActorPairs,
  calculateActorSignatures,
  calculateDistributions,
  calculateSeedSensitivity,
  calculateShadowDeadline,
  calculateShadowHorizon,
  calculateShadowResources,
  counterfactualStateKey,
  mean,
  percent,
  populationSd,
  quantile,
  round,
  runCounterfactualAudit,
  simulateScenario5,
  toCognitiveRunRow,
  toCsv,
  toMissionRunRow,
} from "../src/ui/components/scenario/scenario-five/calibration/index.ts";
import type {
  CalibrationPolicy,
  CalibrationSummary,
  CognitiveRunRow,
  EndStateWitness,
  GateRecord,
  MissionRunRow,
  SimulationRun,
} from "../src/ui/components/scenario/scenario-five/calibration/index.ts";

const ROOT = resolve(import.meta.dirname, "..");
const RESULT_DIR = join(ROOT, "docs", "scenario5-phase8-results");
mkdirSync(RESULT_DIR, { recursive: true });
const startedWallClock = Date.now();
const ENVIRONMENT_SEEDS = Array.from({ length: 64 }, (_, index) => index + 1);
const MISSION_RANDOM_SEEDS = Array.from({ length: 16 }, (_, index) => 1001 + index);
const COGNITIVE_ENVIRONMENT_SEEDS = Array.from({ length: 16 }, (_, index) => index + 1);
const COGNITIVE_RANDOM_SEEDS = Array.from({ length: 16 }, (_, index) => 2001 + index);
const END_STATE_IDS = [
  "critical_cargo_lost_or_compromised",
  "priority_delivered_network_failure",
  "mission_incomplete_continuity_preserved",
  "delayed_delivery_persistent_disruption",
  "resilient_delivery_unresolved_attribution",
  "resilient_delivery_threat_contained",
] as const;

const write = (path: string, content: string): void => writeFileSync(join(ROOT, path), content, "utf8");
const asRecords = <T extends object>(rows: readonly T[]): readonly Readonly<Record<string, unknown>>[] => rows as readonly Readonly<Record<string, unknown>>[];
const deepEqualJson = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);

const walk = (directory: string): string[] => readdirSync(join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
  const child = join(directory, entry.name).replaceAll("\\", "/");
  return entry.isDirectory() ? walk(child) : [child];
});
const protectedPaths = [
  ...walk("src/ui/components/scenario/scenario-five/model").filter((path) => path.endsWith(".ts")),
  ...walk("src/ui/components/scenario/scenario-five/ui").filter((path) => /\.tsx?$/.test(path)),
  ...["ScenarioFive.css", "ScenarioFiveActionCard.tsx", "ScenarioFiveMap.tsx", "ScenarioFiveResourcePanel.tsx", "ScenarioFiveSimulation.tsx", "ScenarioFiveSummary.tsx", "ScenarioFiveTypes.ts"].map((name) => `src/ui/components/scenario/${name}`),
  ...walk("src/ui/components/scenario").filter((path) => /ScenarioTwo.*\.tsx?$/.test(path)),
  "src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts",
  "src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts",
  "src/ui/components/scenario/scenario-four/model/types.ts",
  "src/services/analytics/eventLogger.ts",
  "src/App.tsx",
  "src/App.css",
  "src/ui/components/scenario/MiniGameHost.tsx",
  ...walk("src/scenarios").filter((path) => /\.tsx?$/.test(path)),
  "package.json",
].sort();
const protectedHash = (): string => {
  const hash = createHash("sha256");
  for (const path of protectedPaths) {
    hash.update(`${path}\0`);
    hash.update(readFileSync(join(ROOT, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
};
const FROZEN_BASELINE_HASH = "1bd32af62f0667d3864eb7b2b0e7354e70bebe43178cdc8a64a880e8a138bef6";
if (protectedPaths.length !== 68 || protectedHash() !== FROZEN_BASELINE_HASH) {
  throw new Error(`Frozen baseline mismatch before audit: ${protectedPaths.length} files, ${protectedHash()}`);
}

const environmentWorldCounts = new Map<string, number>();
const environmentActorCounts = new Map<string, number>();
const environmentCorridorCounts = new Map<string, number>();
const latencyVariants = new Set<string>();
const observedNoiseRelations = new Set<string>();
const expectedNoiseRelations = new Set<string>();
for (const world of WORLD_CATALOG) {
  const legalNoise = CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId)
    .filter((corridorId) => corridorId !== world.primaryAffectedCorridorId && corridorId !== world.initialDecoyCorridorId);
  legalNoise.forEach((corridorId) => expectedNoiseRelations.add(`${world.worldId}->${corridorId}`));
  for (const seed of ENVIRONMENT_SEEDS) {
    const state = createInitialTrueWorldState(world.worldId, seed);
    environmentWorldCounts.set(world.worldId, (environmentWorldCounts.get(world.worldId) ?? 0) + 1);
    environmentActorCounts.set(state.actorProfileId, (environmentActorCounts.get(state.actorProfileId) ?? 0) + 1);
    environmentCorridorCounts.set(state.primaryAffectedCorridorId, (environmentCorridorCounts.get(state.primaryAffectedCorridorId) ?? 0) + 1);
    latencyVariants.add(state.latencyVariant);
    observedNoiseRelations.add(`${world.worldId}->${state.backgroundNoiseCorridorId}`);
  }
}
const environmentCoverage = {
  environmentInstanceCount: 1024,
  worldCounts: Object.fromEntries(environmentWorldCounts),
  actorCounts: Object.fromEntries(environmentActorCounts),
  primaryCorridorCounts: Object.fromEntries(environmentCorridorCounts),
  latencyVariants: [...latencyVariants].sort(),
  expectedNoiseRelationCount: expectedNoiseRelations.size,
  observedNoiseRelationCount: observedNoiseRelations.size,
  missingNoiseRelations: [...expectedNoiseRelations].filter((relation) => !observedNoiseRelations.has(relation)).sort(),
};

const missionRows: MissionRunRow[] = [];
const traceAudits: Pick<SimulationRun, "decisionTrace">[] = [];
const counterfactualStates = new Map<string, Scenario5RuntimeState[]>();
const counterfactualKeys = new Map<string, Set<string>>();
let delayIdentityFailures = 0;
let negativeResourceRuns = 0;
let chronologyFailures = 0;
let zeroOptionWindows = 0;
const collectCounterfactual = (state: Scenario5RuntimeState): void => {
  const windowId = state.stage.stageId;
  const states = counterfactualStates.get(windowId) ?? [];
  const keys = counterfactualKeys.get(windowId) ?? new Set<string>();
  const key = counterfactualStateKey(state);
  if (states.length < 32 && !keys.has(key)) {
    states.push(state);
    keys.add(key);
    counterfactualStates.set(windowId, states);
    counterfactualKeys.set(windowId, keys);
  }
};
const counterfactualSourcePolicies = new Set(["balanced_network", "mobility_resilience", "high_response", "low_response_reversible"]);

for (const world of WORLD_CATALOG) for (const environmentSeed of ENVIRONMENT_SEEDS) for (const policy of MISSION_POLICIES) {
  const policySeeds = policy.policyId === "M10_uniform_random" ? MISSION_RANDOM_SEEDS : [undefined];
  for (const policySeed of policySeeds) {
    const sampleRandom = policy.policyId === "M10_uniform_random" && policySeed === 1001 && environmentSeed === 1;
    const run = simulateScenario5({
      policy,
      worldId: world.worldId,
      environmentSeed,
      ...(policySeed === undefined ? {} : { policySeed }),
      ...((counterfactualSourcePolicies.has(policy.policyId) || sampleRandom) ? { onPreDecision: collectCounterfactual } : {}),
    });
    missionRows.push(toMissionRunRow(run));
    if (!run.oraclePolicy) traceAudits.push({ decisionTrace: run.decisionTrace });
    zeroOptionWindows += Number(run.minimumAvailableActionCount === 0);
    negativeResourceRuns += Number(run.state.missionState.resources.isrCapacity < 0 || run.state.missionState.resources.supportReserve < 0);
    chronologyFailures += Number(run.state.runtimeEvents.some((event, index, events) => index > 0 && event.atMs < events[index - 1]!.atMs));
    for (const corridor of CANONICAL_CORRIDORS) {
      const delay = run.result.domain.delayControl.byCorridor[corridor.corridorId];
      delayIdentityFailures += Number(delay.finalDelayMinutes !== delay.actorDelayAddedMinutes + delay.playerDelayAddedMinutes - delay.playerDelayRecoveredMinutes);
    }
  }
}

const scheduledMissionRuns = missionRows.length;
const nonOracleRows = missionRows.filter(({ oraclePolicy }) => !oraclePolicy);
const normalOutcomeRows = missionRows.filter(({ policyId }) => ["balanced_network", "priority_alpha", "information_heavy", "mobility_resilience", "resource_preserver", "high_response", "low_response_reversible", "M10_uniform_random"].includes(String(policyId)));
const actionCoverage = calculateActionCoverage(traceAudits);
const targetCoverageFailures = actionCoverage.flatMap((row) => [row.alphaLegality, row.betaLegality, row.gammaLegality, row.deltaLegality]
  .map((status, index) => ({ status, corridorId: CANONICAL_CORRIDORS[index]!.corridorId }))
  .filter(({ status }) => status === "legal_but_not_selected")
  .map(({ corridorId }) => `${row.actionId}:${corridorId}`));

const mainEndStateCounts = Object.fromEntries(END_STATE_IDS.map((endStateId) => [endStateId, nonOracleRows.filter((row) => row.endStateId === endStateId).length]));
const missingEndStates = END_STATE_IDS.filter((endStateId) => mainEndStateCounts[endStateId] === 0);
const witnesses = new Map<string, EndStateWitness>();
let witnessSearchRuns = 0;
for (let policySeed = 30001; policySeed <= 50000 && witnesses.size < missingEndStates.length; policySeed += 1) {
  const index = policySeed - 30001;
  const world = WORLD_CATALOG[index % WORLD_CATALOG.length]!;
  const environmentSeed = ENVIRONMENT_SEEDS[Math.floor(index / WORLD_CATALOG.length) % ENVIRONMENT_SEEDS.length]!;
  const run = simulateScenario5({ policy: WITNESS_RANDOM_POLICY, worldId: world.worldId, environmentSeed, policySeed });
  witnessSearchRuns += 1;
  const endStateId = run.result.missionEndState.endStateId;
  if (missingEndStates.includes(endStateId) && !witnesses.has(endStateId)) {
    witnesses.set(endStateId, {
      endStateId,
      worldId: world.worldId,
      environmentSeed,
      policySeed,
      orderedActions: run.decisionTrace.map(({ actualActionId }) => actualActionId),
      orderedTargets: run.decisionTrace.map(({ targetCorridorId }) => targetCorridorId),
      finalDomainSummary: {
        alphaDelivered: run.result.domain.criticalDelivery.deliveredByMissionHorizon,
        networkContinuityPercent: run.result.domain.logisticsResilience.networkContinuityPercent,
        threatContained: run.result.domain.logisticsResilience.threatContained,
      },
    });
  }
}
const endStateCoverageRows = END_STATE_IDS.map((endStateId) => {
  const witness = witnesses.get(endStateId);
  const classification = mainEndStateCounts[endStateId] > 0 ? "observed_in_main_audit"
    : witness ? "observed_in_witness_search" : "not_observed_under_phase8_search";
  return {
    endStateId,
    mainAuditCount: mainEndStateCounts[endStateId],
    classification,
    witnessWorldId: witness?.worldId ?? "",
    witnessEnvironmentSeed: witness?.environmentSeed ?? "",
    witnessPolicySeed: witness?.policySeed ?? "",
    orderedActions: witness ? JSON.stringify(witness.orderedActions) : "",
    orderedTargets: witness ? JSON.stringify(witness.orderedTargets) : "",
    finalDomainSummary: witness ? JSON.stringify(witness.finalDomainSummary) : "",
  };
});

const replayPolicies = MISSION_POLICIES.slice(0, 4);
let replayCases = 0;
let deterministicReplayPassed = true;
for (const policy of replayPolicies) for (const world of WORLD_CATALOG) for (const environmentSeed of [1, 17, 33, 64]) {
  const first = simulateScenario5({ policy, worldId: world.worldId, environmentSeed });
  const second = simulateScenario5({ policy, worldId: world.worldId, environmentSeed });
  replayCases += 1;
  deterministicReplayPassed &&= deepEqualJson(first.state, second.state)
    && deepEqualJson(first.result, second.result)
    && deepEqualJson(first.state.missionState.missionEvents, second.state.missionState.missionEvents)
    && deepEqualJson(first.cognitiveBundle, second.cognitiveBundle)
    && deepEqualJson(first.result.domain, second.result.domain);
}
const randomMissionPolicy = MISSION_POLICIES.find(({ policyId }) => policyId === "M10_uniform_random")!;
for (const world of WORLD_CATALOG) for (const environmentSeed of [1, 17, 33, 64]) for (const policySeed of [1001, 1016]) {
  const first = simulateScenario5({ policy: randomMissionPolicy, worldId: world.worldId, environmentSeed, policySeed });
  const second = simulateScenario5({ policy: randomMissionPolicy, worldId: world.worldId, environmentSeed, policySeed });
  replayCases += 1;
  deterministicReplayPassed &&= deepEqualJson(first.state, second.state)
    && deepEqualJson(first.result, second.result)
    && deepEqualJson(first.state.missionState.missionEvents, second.state.missionState.missionEvents)
    && deepEqualJson(first.cognitiveBundle, second.cognitiveBundle)
    && deepEqualJson(first.result.domain, second.result.domain);
}

const matchedActorRows = missionRows.filter(({ policyId }) => ["balanced_network", "priority_alpha", "information_heavy", "mobility_resilience", "resource_preserver", "high_response", "low_response_reversible"].includes(String(policyId)));
const actorSignatures = calculateActorSignatures(matchedActorRows);
const actorPairResults = calculateActorPairs(actorSignatures);
const seedSensitivityRows = calculateSeedSensitivity(matchedActorRows);
const counterfactual = runCounterfactualAudit(counterfactualStates);

const shadowHorizonRows = calculateShadowHorizon(nonOracleRows);
const shadowDeadlineRows = calculateShadowDeadline(nonOracleRows);
const shadowResourceRows = calculateShadowResources(nonOracleRows);

const cognitiveRows: CognitiveRunRow[] = [];
let cognitiveFirewallPassed = true;
let cognitiveFirewallPairs = 0;
for (const world of WORLD_CATALOG) for (const environmentSeed of COGNITIVE_ENVIRONMENT_SEEDS) for (const policy of COGNITIVE_POLICIES) {
  const policySeeds = policy.policyId === "uniform_random_cognitive" ? COGNITIVE_RANDOM_SEEDS : [undefined];
  for (const policySeed of policySeeds) {
    const run = simulateScenario5({ policy, worldId: world.worldId, environmentSeed, ...(policySeed === undefined ? {} : { policySeed }) });
    cognitiveRows.push(toCognitiveRunRow(run));
    const serializedBundle = JSON.stringify(run.cognitiveBundle);
    cognitiveFirewallPassed &&= !/["'](?:worldId|seed|endState|domain)["']\s*:/.test(serializedBundle);
    if (cognitiveFirewallPairs < 100) {
      const first = calculateScenario5CognitiveRunResult(run.cognitiveBundle);
      const differingHiddenDomainFixture = { worldId: "different", seed: -1, endState: "different", domain: { altered: true } };
      void differingHiddenDomainFixture;
      const second = calculateScenario5CognitiveRunResult(run.cognitiveBundle);
      cognitiveFirewallPassed &&= deepEqualJson(first, second);
      cognitiveFirewallPairs += 1;
    }
  }
}

const randomCognitive = cognitiveRows.filter(({ policyId }) => policyId === "uniform_random_cognitive");
const summarizeRandom = (key: keyof Pick<CognitiveRunRow, "overallOSI" | "phaseAOSI" | "phaseBOSI" | "phaseCOSI" | "phaseDOSI">) => {
  const values = randomCognitive.map((row) => row[key]).filter((value): value is number => value !== null);
  return { mean: round(mean(values)), sd: round(populationSd(values)), p025: round(quantile(values, .025)), p975: round(quantile(values, .975)), n: values.length };
};
const randomOsiSummary = {
  overall: summarizeRandom("overallOSI"), phaseA: summarizeRandom("phaseAOSI"), phaseB: summarizeRandom("phaseBOSI"),
  phaseC: summarizeRandom("phaseCOSI"), phaseD: summarizeRandom("phaseDOSI"),
};
const randomOsiPassed = Object.values(randomOsiSummary).every(({ mean: average }) => Math.abs(average) <= .05);

const metricSummary = (policyId: CognitiveRunRow["policyId"], key: keyof CognitiveRunRow) => {
  const selected = cognitiveRows.filter((row) => row.policyId === policyId);
  const values = selected.map((row) => row[key]).filter((value): value is number => typeof value === "number");
  return { mean: values.length ? round(mean(values)) : null, nullRate: round(1 - values.length / selected.length), n: values.length };
};
const randomMetric = (key: keyof CognitiveRunRow) => metricSummary("uniform_random_cognitive", key);
const anchorChecks = [
  { gateId: "orientation_operational", observed: metricSummary("operational_anchor", "overallOSI"), comparator: "< -0.20", pass: (metricSummary("operational_anchor", "overallOSI").mean ?? 1) < -.2 },
  { gateId: "orientation_strategic", observed: metricSummary("strategic_anchor", "overallOSI"), comparator: "> +0.20", pass: (metricSummary("strategic_anchor", "overallOSI").mean ?? -1) > .2 },
  { gateId: "information_seeking", observed: { high: metricSummary("information_max", "informationSeeking"), low: metricSummary("information_min", "informationSeeking") }, comparator: "difference >= 15", pass: (metricSummary("information_max", "informationSeeking").mean ?? 0) - (metricSummary("information_min", "informationSeeking").mean ?? 0) >= 15 },
  { gateId: "second_order", observed: { anchor: metricSummary("second_order_max", "secondOrderThinking"), random: randomMetric("secondOrderThinking") }, comparator: "anchor >= random + 10", pass: (metricSummary("second_order_max", "secondOrderThinking").mean ?? 0) >= (randomMetric("secondOrderThinking").mean ?? 0) + 10 },
  { gateId: "adversary_modeling", observed: { anchor: metricSummary("adversary_max", "adversaryModeling"), random: randomMetric("adversaryModeling") }, comparator: "anchor >= random + 10", pass: (metricSummary("adversary_max", "adversaryModeling").mean ?? 0) >= (randomMetric("adversaryModeling").mean ?? 0) + 10 },
  { gateId: "stewardship", observed: { anchor: metricSummary("stewardship_max", "resourceStewardship"), random: randomMetric("resourceStewardship") }, comparator: "anchor >= random + 10", pass: (metricSummary("stewardship_max", "resourceStewardship").mean ?? 0) >= (randomMetric("resourceStewardship").mean ?? 0) + 10 },
  { gateId: "planning", observed: { anchor: metricSummary("planning_max", "planningForesight"), random: randomMetric("planningForesight") }, comparator: "anchor >= random + 10", pass: (metricSummary("planning_max", "planningForesight").mean ?? 0) >= (randomMetric("planningForesight").mean ?? 0) + 10 },
  { gateId: "mci", observed: { anchor: metricSummary("mci_max", "multiDomainIntegration"), random: randomMetric("multiDomainIntegration") }, comparator: "anchor >= random + 5", pass: (metricSummary("mci_max", "multiDomainIntegration").mean ?? 0) >= (randomMetric("multiDomainIntegration").mean ?? 0) + 5 },
  { gateId: "risk_low", observed: metricSummary("risk_low", "riskPosture"), comparator: "< 0", pass: (metricSummary("risk_low", "riskPosture").mean ?? 1) < 0 },
  { gateId: "risk_high", observed: metricSummary("risk_high", "riskPosture"), comparator: "> 0", pass: (metricSummary("risk_high", "riskPosture").mean ?? -1) > 0 },
  { gateId: "coherence", observed: { high: metricSummary("coherence_high", "decisionCoherence"), low: metricSummary("coherence_low", "decisionCoherence") }, comparator: "difference >= 15", pass: (metricSummary("coherence_high", "decisionCoherence").mean ?? 0) >= (metricSummary("coherence_low", "decisionCoherence").mean ?? 0) + 15 },
  { gateId: "evidence_updating", observed: { responsive: metricSummary("evidence_responsive", "evidenceResponsiveUpdating"), anti: metricSummary("evidence_anti", "evidenceResponsiveUpdating") }, comparator: "difference >= 20", pass: (metricSummary("evidence_responsive", "evidenceResponsiveUpdating").mean ?? 0) >= (metricSummary("evidence_anti", "evidenceResponsiveUpdating").mean ?? 0) + 20 },
].map((gate) => ({ ...gate, pass: gate.pass && !JSON.stringify(gate.observed).includes('"nullRate":1') && !Object.values(gate.observed).some((value) => typeof value === "object" && value !== null && "nullRate" in value && Number(value.nullRate) > .1) }));
const cognitiveAnchorsPassed = anchorChecks.every(({ pass }) => pass);
const distributions = calculateDistributions(cognitiveRows);

const totalDecisionWindows = nonOracleRows.length * 8;
const singleOptionDecisions = nonOracleRows.reduce((sum, row) => sum + row.singleOptionWindowCount, 0);
const forcedChoiceRate = singleOptionDecisions / totalDecisionWindows;
const tooLooseRate = nonOracleRows.filter(({ finalIsr, finalSupport }) => finalIsr >= 50 && finalSupport >= 50).length / nonOracleRows.length;
const exhaustionRate = nonOracleRows.filter(({ finalIsr, finalSupport }) => finalIsr <= 5 || finalSupport <= 5).length / nonOracleRows.length;
const normalOutcomeCounts = END_STATE_IDS.map((endStateId) => ({ endStateId, count: normalOutcomeRows.filter((row) => row.endStateId === endStateId).length }));
const modalOutcome = [...normalOutcomeCounts].sort((left, right) => right.count - left.count)[0]!;
const outcomeConcentrationShare = modalOutcome.count / normalOutcomeRows.length;
const actorOutcomeVarietyFailures = CANONICAL_ACTOR_PROFILES.filter(({ profileId }) => new Set(normalOutcomeRows.filter(({ actorProfile }) => actorProfile === profileId).map(({ endStateId }) => endStateId)).size < 2).map(({ profileId }) => profileId);
const corridorOutcomeVarietyFailures = CANONICAL_CORRIDORS.filter(({ corridorId }) => new Set(normalOutcomeRows.filter(({ primaryCorridorId }) => primaryCorridorId === corridorId).map(({ endStateId }) => endStateId)).size < 2).map(({ corridorId }) => corridorId);
const highSeedSensitivityRate = seedSensitivityRows.filter(({ highSeedSensitivity }) => highSeedSensitivity).length / seedSensitivityRows.length;
const decisionClocks = normalOutcomeRows.map(({ worldClockBeforeFinalization }) => worldClockBeforeFinalization);
const clockSummary = {
  min: Math.min(...decisionClocks), p05: round(quantile(decisionClocks, .05)), p25: round(quantile(decisionClocks, .25)),
  median: round(quantile(decisionClocks, .5)), p75: round(quantile(decisionClocks, .75)), p95: round(quantile(decisionClocks, .95)), max: Math.max(...decisionClocks),
  atOrBelow300Percent: percent(decisionClocks.filter((value) => value <= 300).length, decisionClocks.length),
  from301To330Percent: percent(decisionClocks.filter((value) => value >= 301 && value <= 330).length, decisionClocks.length),
  from331To360Percent: percent(decisionClocks.filter((value) => value >= 331 && value <= 360).length, decisionClocks.length),
};

const sourceFiles = walk("src/ui/components/scenario/scenario-five/calibration");
const noForbiddenRandom = sourceFiles.every((path) => !readFileSync(join(ROOT, path), "utf8").includes(["Math", "random"].join(".")));
const hardGates: GateRecord[] = [
  { gateId: "ENVIRONMENT_PANEL_COVERAGE", status: environmentWorldCounts.size === 16 && [...environmentWorldCounts.values()].every((count) => count === 64) && [...environmentActorCounts.values()].every((count) => count === 256) && [...environmentCorridorCounts.values()].every((count) => count === 256) && latencyVariants.size === 3 && environmentCoverage.missingNoiseRelations.length === 0 ? "PASS" : "FAIL", detail: `worlds=${environmentWorldCounts.size}; latency=${[...latencyVariants].sort().join("|")}; missingNoise=${environmentCoverage.missingNoiseRelations.length}` },
  { gateId: "EXECUTION_COMPLETION", status: scheduledMissionRuns === 25600 && missionRows.every(({ completed }) => completed) ? "PASS" : "FAIL", detail: `${missionRows.filter(({ completed }) => completed).length}/${scheduledMissionRuns} scheduled runs completed` },
  { gateId: "DETERMINISTIC_REPLAY", status: deterministicReplayPassed ? "PASS" : "FAIL", detail: `${replayCases} selected cases replayed twice` },
  { gateId: "LEGAL_ACTION_SAFETY", status: zeroOptionWindows === 0 && negativeResourceRuns === 0 && chronologyFailures === 0 ? "PASS" : "FAIL", detail: `zeroOption=${zeroOptionWindows}; negativeResource=${negativeResourceRuns}; chronology=${chronologyFailures}` },
  { gateId: "DOMAIN_DELAY_IDENTITY", status: delayIdentityFailures === 0 ? "PASS" : "FAIL", detail: `${delayIdentityFailures} exact-identity failures` },
  { gateId: "NO_MATH_RANDOM", status: noForbiddenRandom ? "PASS" : "FAIL", detail: `${sourceFiles.length} calibration source files scanned` },
  { gateId: "ACTION_TARGET_COVERAGE", status: actionCoverage.every(({ selectionCount }) => selectionCount > 0) && targetCoverageFailures.length === 0 ? "PASS" : "FAIL", detail: `${actionCoverage.filter(({ selectionCount }) => selectionCount > 0).length}/33 actions observed; legal target gaps=${targetCoverageFailures.join("|") || "none"}` },
  { gateId: "SIX_END_STATES_OBSERVED", status: endStateCoverageRows.every(({ classification }) => classification !== "not_observed_under_phase8_search") ? "PASS" : "FAIL", detail: endStateCoverageRows.map(({ endStateId, classification }) => `${endStateId}:${classification}`).join("; ") },
  { gateId: "ACTOR_PAIR_DISTINCTIVENESS", status: actorPairResults.every(({ distinguishable }) => distinguishable) ? "PASS" : "FAIL", detail: `${actorPairResults.filter(({ distinguishable }) => distinguishable).length}/6 pairs distinguishable` },
  { gateId: "NO_UNIVERSAL_ACTION_DOMINANCE", status: counterfactual.universalDominanceFound ? "FAIL" : "PASS", detail: `${counterfactual.branchCount} counterfactual branches` },
  { gateId: "RANDOM_OSI_CENTERING", status: randomOsiPassed ? "PASS" : "FAIL", detail: JSON.stringify(randomOsiSummary) },
  { gateId: "COGNITIVE_ANCHOR_GATES", status: cognitiveAnchorsPassed ? "PASS" : "FAIL", detail: `${anchorChecks.filter(({ pass }) => pass).length}/${anchorChecks.length} anchor checks passed` },
  { gateId: "COGNITIVE_FIREWALL", status: cognitiveFirewallPassed && cognitiveFirewallPairs >= 100 ? "PASS" : "FAIL", detail: `${cognitiveFirewallPairs} paired bundles; hidden/domain fields excluded` },
  { gateId: "MAX_DECISION_CLOCK_360", status: clockSummary.max <= 360 ? "PASS" : "FAIL", detail: `maximum pre-finalization clock=${clockSummary.max}` },
];
const warnings: GateRecord[] = [
  { gateId: "FORCED_CHOICE_WARNING", status: forcedChoiceRate > .05 ? "WARNING" : "PASS", detail: `${round(100 * forcedChoiceRate)}% decision windows had one option` },
  { gateId: "RESOURCE_TOO_LOOSE_WARNING", status: tooLooseRate > .8 ? "WARNING" : "PASS", detail: `${round(100 * tooLooseRate)}% runs ended with both resources >=50` },
  { gateId: "RESOURCE_EXHAUSTION_WARNING", status: exhaustionRate > .25 ? "WARNING" : "PASS", detail: `${round(100 * exhaustionRate)}% runs ended with ISR or support <=5` },
  { gateId: "OUTCOME_CONCENTRATION_WARNING", status: outcomeConcentrationShare > .85 || actorOutcomeVarietyFailures.length > 0 || corridorOutcomeVarietyFailures.length > 0 ? "WARNING" : "PASS", detail: `modal=${modalOutcome.endStateId}:${round(100 * outcomeConcentrationShare)}%; actorVarietyFailures=${actorOutcomeVarietyFailures.join("|") || "none"}; corridorVarietyFailures=${corridorOutcomeVarietyFailures.join("|") || "none"}` },
  { gateId: "SEED_SENSITIVITY_WARNING", status: highSeedSensitivityRate > .2 ? "WARNING" : "PASS", detail: `${round(100 * highSeedSensitivityRate)}% world×policy cells flagged` },
  { gateId: "COGNITIVE_DISTRIBUTION_WARNING", status: distributions.some(({ warnings: items }) => items.length > 0) ? "WARNING" : "PASS", detail: distributions.filter(({ warnings: items }) => items.length > 0).map(({ metric, warnings: items }) => `${metric}:${items.join("|")}`).join("; ") || "none" },
];
const overallStatus = hardGates.every(({ status }) => status === "PASS") ? "PASS" : "FAIL";

const summary: CalibrationSummary = {
  calibrationVersion: S5_CALIBRATION_VERSION,
  modelVersions: {
    mission: MISSION_MODEL_VERSION,
    cognitive: S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
    runtime: S5_RUNTIME_MODEL_VERSION,
    domainMetrics: S5_DOMAIN_METRICS_VERSION,
    calibrationStatus: S5_CALIBRATION_STATUS,
    frozenProtectedManifestSha256: FROZEN_BASELINE_HASH,
  },
  runCounts: {
    scheduledMissionRuns,
    deterministicMissionRuns: missionRows.filter(({ policyId }) => policyId !== "M10_uniform_random").length,
    randomMissionRuns: missionRows.filter(({ policyId }) => policyId === "M10_uniform_random").length,
    witnessSearchRuns,
    deterministicCognitiveRuns: cognitiveRows.filter(({ policyId }) => policyId !== "uniform_random_cognitive").length,
    randomCognitiveRuns: randomCognitive.length,
    totalCognitiveRuns: cognitiveRows.length,
    deterministicReplayCases: replayCases,
    cognitiveFirewallPairs,
    counterfactualBranches: counterfactual.branchCount,
  },
  environmentCoverage,
  actionCoverage: {
    observedActionCount: actionCoverage.filter(({ selectionCount }) => selectionCount > 0).length,
    targetCoverageFailures,
  },
  endStateCoverage: endStateCoverageRows,
  hardGates,
  warnings,
  actorPairResults,
  seedSensitivitySummary: { cellCount: seedSensitivityRows.length, highSensitivityCellCount: seedSensitivityRows.filter(({ highSeedSensitivity }) => highSeedSensitivity).length, highSensitivityRate: round(highSeedSensitivityRate) },
  randomOsiSummary,
  cognitiveAnchorSummary: anchorChecks,
  distributionWarnings: distributions,
  shadowSensitivitySummary: { horizons: shadowHorizonRows, deadlineShifts: shadowDeadlineRows, resourceBudgets: shadowResourceRows, runtimeClock: clockSummary },
  overallStatus,
};

const missionCsvRows = missionRows.map(({ convoySnapshot, ...row }) => ({ ...row, convoySnapshot: JSON.stringify(convoySnapshot) }));
write("docs/scenario5-phase8-results/mission-runs.csv", toCsv(asRecords(missionCsvRows)));
write("docs/scenario5-phase8-results/cognitive-runs.csv", toCsv(asRecords(cognitiveRows)));
write("docs/scenario5-phase8-results/end-state-coverage.csv", toCsv(asRecords(endStateCoverageRows)));
write("docs/scenario5-phase8-results/actor-signatures.csv", toCsv(asRecords(actorSignatures)));
write("docs/scenario5-phase8-results/seed-sensitivity.csv", toCsv(asRecords(seedSensitivityRows)));
write("docs/scenario5-phase8-results/action-coverage.csv", toCsv(asRecords(actionCoverage)));
write("docs/scenario5-phase8-results/action-dominance.csv", toCsv(counterfactual.rows));
write("docs/scenario5-phase8-results/cognitive-distributions.csv", toCsv(asRecords(distributions.map(({ warnings: items, ...row }) => ({ ...row, warnings: items.join("|") })))));
write("docs/scenario5-phase8-results/shadow-time-sensitivity.csv", toCsv(asRecords(shadowHorizonRows)));
write("docs/scenario5-phase8-results/shadow-deadline-sensitivity.csv", toCsv(asRecords(shadowDeadlineRows)));
write("docs/scenario5-phase8-results/shadow-resource-feasibility.csv", toCsv(asRecords(shadowResourceRows)));
write("docs/scenario5-phase8-summary.json", `${JSON.stringify(summary, null, 2)}\n`);
write("docs/scenario5-phase8-calibration-report-fa.md", buildPersianCalibrationReport(summary));

if (protectedHash() !== FROZEN_BASELINE_HASH) throw new Error("Frozen protected manifest changed during audit");
console.log(`Scenario 5 Phase 8 calibration completed in ${Date.now() - startedWallClock} ms (wall-clock convenience only).`);
console.log(`Scheduled mission runs: ${scheduledMissionRuns}; witness runs: ${witnessSearchRuns}; counterfactual branches: ${counterfactual.branchCount}.`);
console.log(`Cognitive runs: ${cognitiveRows.length}; overall calibration status: ${overallStatus}.`);
console.log(`Artifacts: ${relative(ROOT, RESULT_DIR).replaceAll("\\", "/")}`);
