import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  CANONICAL_ACTOR_PROFILES, CANONICAL_CORRIDORS, WORLD_CATALOG, createInitialTrueWorldState,
} from "../src/ui/components/scenario/scenario-five/model/index.ts";
import {
  S5_COGNITIVE_MEASUREMENT_MODEL_VERSION, calculateScenario5CognitiveRunResult,
} from "../src/ui/components/scenario/scenario-five/model/cognitive/index.ts";
import { MISSION_MODEL_VERSION } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import {
  S5_DOMAIN_METRICS_VERSION, S5_RUNTIME_MODEL_VERSION,
} from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import type { Scenario5RuntimeState } from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import {
  COGNITIVE_POLICIES, EXTENDED_SHADOW_HORIZONS, MISSION_POLICIES, S5_CALIBRATION_STATUS,
  S5_CALIBRATION_VERSION, StructuralOsiCollector, calculateActionCoverage, calculateActorPairs,
  calculateActorSignatures, calculateDistributions, calculateExtendedShadowHorizon,
  calculateSeedSensitivity, cognitiveEffectivePolicySeed, collectExplicitProbeCandidates,
  counterfactualStateKey, mean, missionEffectivePolicySeed, observedRequiredPairs, percent,
  populationSd, quantile, resourceAvailabilitySummary, round, runCounterfactualAuditV2,
  runExplicitTargetProbes, runStructuredReachabilitySearch, simulateScenario5, toCognitiveRunRow,
  toCsv, toMissionRunRow,
} from "../src/ui/components/scenario/scenario-five/calibration/index.ts";
import type {
  CognitiveRunRow, GateRecord, MissionRunRow, SimulationRun,
} from "../src/ui/components/scenario/scenario-five/calibration/index.ts";

const ROOT = resolve(import.meta.dirname, "..");
const RESULT_DIR = join(ROOT, "docs", "scenario5-phase8a-results");
mkdirSync(RESULT_DIR, { recursive: true });
const startedWallClock = Date.now();
const ENVIRONMENT_SEEDS = Array.from({ length: 64 }, (_, index) => index + 1);
const MISSION_BASE_SEEDS = Array.from({ length: 16 }, (_, index) => 1001 + index);
const COGNITIVE_ENVIRONMENT_SEEDS = Array.from({ length: 16 }, (_, index) => index + 1);
const COGNITIVE_BASE_SEEDS = Array.from({ length: 16 }, (_, index) => 2001 + index);
const END_STATE_IDS = [
  "critical_cargo_lost_or_compromised", "priority_delivered_network_failure",
  "mission_incomplete_continuity_preserved", "delayed_delivery_persistent_disruption",
  "resilient_delivery_unresolved_attribution", "resilient_delivery_threat_contained",
] as const;
const COUNTERFACTUAL_SOURCE_POLICIES = [
  "balanced_network", "priority_alpha", "information_heavy", "mobility_resilience",
  "resource_preserver", "high_response", "low_response_reversible", "M10_uniform_random",
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
  "src/services/analytics/eventLogger.ts", "src/App.tsx", "src/App.css",
  "src/ui/components/scenario/MiniGameHost.tsx",
  ...walk("src/scenarios").filter((path) => /\.tsx?$/.test(path)),
  "package.json",
].sort();
const aggregateContentHash = (paths: readonly string[]): string => {
  const hash = createHash("sha256");
  for (const path of paths) {
    hash.update(`${path}\0`); hash.update(readFileSync(join(ROOT, path))); hash.update("\0");
  }
  return hash.digest("hex");
};
const FROZEN_BASELINE_HASH = "1bd32af62f0667d3864eb7b2b0e7354e70bebe43178cdc8a64a880e8a138bef6";
const originalPhase8Paths = [
  "docs/scenario5-phase8-calibration-verification.md", "docs/scenario5-phase8-calibration-report-fa.md",
  "docs/scenario5-phase8-summary.json", ...walk("docs/scenario5-phase8-results"),
].sort();
const originalArtifactHash = (paths: readonly string[]): string => {
  const rows = paths.map((path) => {
    const bytes = readFileSync(join(ROOT, path));
    return `${path}\0${createHash("sha256").update(bytes).digest("hex")}\0${bytes.length}`;
  });
  return createHash("sha256").update(rows.join("\n")).digest("hex");
};
const ORIGINAL_PHASE8_ARTIFACT_HASH = "a3df95fe09cb3ab1d2bc7e741ffbeb66dc70b6bd41720faec284fc38a19beaf6";
const protectedBefore = aggregateContentHash(protectedPaths);
const originalPhase8Before = originalArtifactHash(originalPhase8Paths);
if (protectedPaths.length !== 68 || protectedBefore !== FROZEN_BASELINE_HASH) throw new Error(`Frozen baseline mismatch before 08A: ${protectedPaths.length}/${protectedBefore}`);
if (originalPhase8Paths.length !== 14 || originalPhase8Before !== ORIGINAL_PHASE8_ARTIFACT_HASH) throw new Error(`Original Phase-8 artifact mismatch before 08A: ${originalPhase8Paths.length}/${originalPhase8Before}`);

const environmentWorldCounts = new Map<string, number>();
const environmentActorCounts = new Map<string, number>();
const environmentCorridorCounts = new Map<string, number>();
const latencyVariants = new Set<string>();
const observedNoiseRelations = new Set<string>();
const expectedNoiseRelations = new Set<string>();
for (const world of WORLD_CATALOG) {
  CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId)
    .filter((corridorId) => corridorId !== world.primaryAffectedCorridorId && corridorId !== world.initialDecoyCorridorId)
    .forEach((corridorId) => expectedNoiseRelations.add(`${world.worldId}->${corridorId}`));
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
  worldCounts: Object.fromEntries(environmentWorldCounts), actorCounts: Object.fromEntries(environmentActorCounts),
  primaryCorridorCounts: Object.fromEntries(environmentCorridorCounts), latencyVariants: [...latencyVariants].sort(),
  expectedNoiseRelationCount: expectedNoiseRelations.size, observedNoiseRelationCount: observedNoiseRelations.size,
  missingNoiseRelations: [...expectedNoiseRelations].filter((relation) => !observedNoiseRelations.has(relation)).sort(),
};

const missionRows: MissionRunRow[] = [];
const missionCsvRows: Readonly<Record<string, unknown>>[] = [];
const traceAudits: Pick<SimulationRun, "decisionTrace">[] = [];
const probeCandidates = new Map<string, Scenario5RuntimeState>();
const counterfactualStates = new Map<string, Scenario5RuntimeState[]>();
const counterfactualKeys = new Map<string, Set<string>>();
const structuralOsi = new StructuralOsiCollector();
const m10EffectiveSeeds = new Set<number>();
let delayIdentityFailures = 0;
let negativeResourceRuns = 0;
let chronologyFailures = 0;
let zeroOptionWindows = 0;

const addCounterfactualState = (state: Scenario5RuntimeState): void => {
  const windowId = state.stage.stageId;
  const states = counterfactualStates.get(windowId) ?? [];
  const keys = counterfactualKeys.get(windowId) ?? new Set<string>();
  const key = counterfactualStateKey(state);
  if (states.length < 128 && !keys.has(key)) { states.push(state); keys.add(key); counterfactualStates.set(windowId, states); counterfactualKeys.set(windowId, keys); }
};

for (let worldIndex = 0; worldIndex < WORLD_CATALOG.length; worldIndex += 1) {
  const world = WORLD_CATALOG[worldIndex]!;
  for (const environmentSeed of ENVIRONMENT_SEEDS) for (const policy of MISSION_POLICIES) {
    const baseSeeds: readonly (number | undefined)[] = policy.policyId === "M10_uniform_random" ? MISSION_BASE_SEEDS : [undefined];
    for (const basePolicySeed of baseSeeds) {
      const effectivePolicySeed = basePolicySeed === undefined ? undefined : missionEffectivePolicySeed(worldIndex, environmentSeed, basePolicySeed);
      if (effectivePolicySeed !== undefined) m10EffectiveSeeds.add(effectivePolicySeed);
      const sourceIndex = COUNTERFACTUAL_SOURCE_POLICIES.indexOf(policy.policyId as typeof COUNTERFACTUAL_SOURCE_POLICIES[number]);
      const collectCounterfactual = sourceIndex >= 0
        && environmentSeed === 1 + ((worldIndex * 8 + sourceIndex) % 64)
        && (policy.policyId !== "M10_uniform_random" || basePolicySeed === 1001);
      const run = simulateScenario5({
        policy, worldId: world.worldId, environmentSeed,
        ...(effectivePolicySeed === undefined ? {} : { policySeed: effectivePolicySeed }),
        onPreDecision: (state) => { collectExplicitProbeCandidates(state, probeCandidates); if (collectCounterfactual) addCounterfactualState(state); },
      });
      const baseRow = toMissionRunRow(run);
      const row: MissionRunRow = { ...baseRow, basePolicySeed: basePolicySeed ?? null, effectivePolicySeed: effectivePolicySeed ?? null };
      missionRows.push(row);
      missionCsvRows.push({ ...row, convoySnapshot: JSON.stringify(row.convoySnapshot) });
      if (!run.oraclePolicy) traceAudits.push({ decisionTrace: run.decisionTrace });
      if (policy.policyId === "M10_uniform_random") structuralOsi.addRun(run);
      zeroOptionWindows += Number(run.minimumAvailableActionCount === 0);
      negativeResourceRuns += Number(run.state.missionState.resources.isrCapacity < 0 || run.state.missionState.resources.supportReserve < 0);
      chronologyFailures += Number(run.state.runtimeEvents.some((event, index, events) => index > 0 && event.atMs < events[index - 1]!.atMs));
      for (const corridor of CANONICAL_CORRIDORS) {
        const delay = run.result.domain.delayControl.byCorridor[corridor.corridorId];
        delayIdentityFailures += Number(delay.finalDelayMinutes !== delay.actorDelayAddedMinutes + delay.playerDelayAddedMinutes - delay.playerDelayRecoveredMinutes);
      }
    }
  }
}

const scheduledMissionRuns = missionRows.length;
const nonOracleRows = missionRows.filter(({ oraclePolicy }) => !oraclePolicy);
const normalPolicyIds = ["balanced_network", "priority_alpha", "information_heavy", "mobility_resilience", "resource_preserver", "high_response", "low_response_reversible", "M10_uniform_random"];
const normalOutcomeRows = missionRows.filter(({ policyId }) => normalPolicyIds.includes(String(policyId)));
const actionCoverage = calculateActionCoverage(traceAudits);
const resourcePreserver = MISSION_POLICIES.find(({ policyId }) => policyId === "resource_preserver")!;
const explicitTargetProbes = runExplicitTargetProbes(probeCandidates, observedRequiredPairs(traceAudits), resourcePreserver);
const coverageV2Passed = actionCoverage.every(({ selectionCount }) => selectionCount > 0)
  && explicitTargetProbes.every(({ classification }) => classification !== "probe_failed")
  && explicitTargetProbes.filter(({ classification }) => classification !== "not_observed_as_legal").every(({ commitSucceeded }) => commitSucceeded);

let replayCases = 0;
let deterministicReplayPassed = true;
for (const policy of MISSION_POLICIES.slice(0, 4)) for (let worldIndex = 0; worldIndex < WORLD_CATALOG.length; worldIndex += 1) for (const environmentSeed of [1, 17, 33, 64]) {
  const world = WORLD_CATALOG[worldIndex]!;
  const first = simulateScenario5({ policy, worldId: world.worldId, environmentSeed });
  const second = simulateScenario5({ policy, worldId: world.worldId, environmentSeed });
  replayCases += 1;
  deterministicReplayPassed &&= deepEqualJson(first.state, second.state) && deepEqualJson(first.result, second.result) && deepEqualJson(first.cognitiveBundle, second.cognitiveBundle);
}
const m10 = MISSION_POLICIES.find(({ policyId }) => policyId === "M10_uniform_random")!;
for (let worldIndex = 0; worldIndex < WORLD_CATALOG.length; worldIndex += 1) for (const environmentSeed of [1, 17, 33, 64]) for (const basePolicySeed of [1001, 1016]) {
  const world = WORLD_CATALOG[worldIndex]!;
  const policySeed = missionEffectivePolicySeed(worldIndex, environmentSeed, basePolicySeed);
  const first = simulateScenario5({ policy: m10, worldId: world.worldId, environmentSeed, policySeed });
  const second = simulateScenario5({ policy: m10, worldId: world.worldId, environmentSeed, policySeed });
  replayCases += 1;
  deterministicReplayPassed &&= deepEqualJson(first.state, second.state) && deepEqualJson(first.result, second.result) && deepEqualJson(first.cognitiveBundle, second.cognitiveBundle);
}

const matchedActorRows = missionRows.filter(({ policyId }) => normalPolicyIds.slice(0, 7).includes(String(policyId)));
const actorSignatures = calculateActorSignatures(matchedActorRows);
const actorPairResults = calculateActorPairs(actorSignatures);
const seedSensitivityRows = calculateSeedSensitivity(matchedActorRows);
console.log("Phase 08A mission main audit complete; starting corrected multi-continuation Pareto audit.");
const counterfactual = runCounterfactualAuditV2(counterfactualStates, MISSION_POLICIES);
console.log(`Phase 08A Pareto audit complete (${counterfactual.branchCount} branches); starting structured reachability.`);
const structuredReachability = runStructuredReachabilitySearch();
console.log(`Phase 08A structured reachability complete (${structuredReachability.branchesApplied} branches).`);
const mainEndStateCounts = Object.fromEntries(END_STATE_IDS.map((endStateId) => [endStateId, nonOracleRows.filter((row) => row.endStateId === endStateId).length]));
const endStateCoverageV2 = END_STATE_IDS.map((endStateId) => {
  const witness = structuredReachability.witnesses.find((item) => item.endStateId === endStateId);
  return {
    endStateId, mainAuditCount: mainEndStateCounts[endStateId],
    classification: mainEndStateCounts[endStateId] > 0 ? "observed_in_main_audit" : witness ? "observed_in_structured_search" : "not_observed_under_phase8a_structured_search",
    witnessWorldId: witness?.worldId ?? "", witnessEnvironmentSeed: witness?.environmentSeed ?? "",
    latencyVariant: witness?.latencyVariant ?? "", witnessTrace: witness ? JSON.stringify(witness.trace) : "",
  };
});

const extendedShadowHorizon = calculateExtendedShadowHorizon(nonOracleRows);
const cognitiveRows: CognitiveRunRow[] = [];
const cognitiveCsvRows: Readonly<Record<string, unknown>>[] = [];
const c16EffectiveSeeds = new Set<number>();
let cognitiveFirewallPassed = true;
let cognitiveFirewallPairs = 0;
for (let worldIndex = 0; worldIndex < WORLD_CATALOG.length; worldIndex += 1) {
  const world = WORLD_CATALOG[worldIndex]!;
  for (const environmentSeed of COGNITIVE_ENVIRONMENT_SEEDS) for (const policy of COGNITIVE_POLICIES) {
    const baseSeeds: readonly (number | undefined)[] = policy.policyId === "uniform_random_cognitive" ? COGNITIVE_BASE_SEEDS : [undefined];
    for (const basePolicySeed of baseSeeds) {
      const effectivePolicySeed = basePolicySeed === undefined ? undefined : cognitiveEffectivePolicySeed(worldIndex, environmentSeed, basePolicySeed);
      if (effectivePolicySeed !== undefined) c16EffectiveSeeds.add(effectivePolicySeed);
      const run = simulateScenario5({ policy, worldId: world.worldId, environmentSeed, ...(effectivePolicySeed === undefined ? {} : { policySeed: effectivePolicySeed }) });
      structuralOsi.addRun(run);
      const baseRow = toCognitiveRunRow(run);
      const row: CognitiveRunRow = { ...baseRow, basePolicySeed: basePolicySeed ?? null, effectivePolicySeed: effectivePolicySeed ?? null };
      cognitiveRows.push(row); cognitiveCsvRows.push(row as unknown as Readonly<Record<string, unknown>>);
      const serializedBundle = JSON.stringify(run.cognitiveBundle);
      cognitiveFirewallPassed &&= !/["'](?:worldId|seed|endState|domain)["']\s*:/.test(serializedBundle);
      if (cognitiveFirewallPairs < 100) {
        const first = calculateScenario5CognitiveRunResult(run.cognitiveBundle);
        const second = calculateScenario5CognitiveRunResult(run.cognitiveBundle);
        cognitiveFirewallPassed &&= deepEqualJson(first, second); cognitiveFirewallPairs += 1;
      }
    }
  }
}

const structuralOsiRows = structuralOsi.rows();
const structuralOsiPassed = structuralOsiRows.filter(({ diagnostic }) => diagnostic).every(({ pass }) => pass);
const randomCognitive = cognitiveRows.filter(({ policyId }) => policyId === "uniform_random_cognitive");
const summarizeRandom = (key: keyof Pick<CognitiveRunRow, "overallOSI" | "phaseAOSI" | "phaseBOSI" | "phaseCOSI" | "phaseDOSI">) => {
  const values = randomCognitive.map((row) => row[key]).filter((value): value is number => value !== null);
  return { mean: round(mean(values)), sd: round(populationSd(values)), p025: round(quantile(values, .025)), p975: round(quantile(values, .975)), n: values.length };
};
const randomOsiMonteCarlo = {
  overall: summarizeRandom("overallOSI"), phaseA: summarizeRandom("phaseAOSI"), phaseB: summarizeRandom("phaseBOSI"),
  phaseC: summarizeRandom("phaseCOSI"), phaseD: summarizeRandom("phaseDOSI"),
};
const randomOsiPassed = Object.values(randomOsiMonteCarlo).every(({ mean: average }) => Math.abs(average) <= .05);

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
const distributions = calculateDistributions(cognitiveRows);

const totalDecisionWindows = nonOracleRows.length * 8;
const forcedChoiceRate = nonOracleRows.reduce((sum, row) => sum + row.singleOptionWindowCount, 0) / totalDecisionWindows;
const tooLooseRate = nonOracleRows.filter(({ finalIsr, finalSupport }) => finalIsr >= 50 && finalSupport >= 50).length / nonOracleRows.length;
const exhaustionRate = nonOracleRows.filter(({ finalIsr, finalSupport }) => finalIsr <= 5 || finalSupport <= 5).length / nonOracleRows.length;
const outcomeCounts = END_STATE_IDS.map((endStateId) => ({ endStateId, count: normalOutcomeRows.filter((row) => row.endStateId === endStateId).length }));
const modalOutcome = [...outcomeCounts].sort((left, right) => right.count - left.count)[0]!;
const outcomeConcentrationShare = modalOutcome.count / normalOutcomeRows.length;
const actorOutcomeVarietyFailures = CANONICAL_ACTOR_PROFILES.filter(({ profileId }) => new Set(normalOutcomeRows.filter(({ actorProfile }) => actorProfile === profileId).map(({ endStateId }) => endStateId)).size < 2).map(({ profileId }) => profileId);
const corridorOutcomeVarietyFailures = CANONICAL_CORRIDORS.filter(({ corridorId }) => new Set(normalOutcomeRows.filter(({ primaryCorridorId }) => primaryCorridorId === corridorId).map(({ endStateId }) => endStateId)).size < 2).map(({ corridorId }) => corridorId);
const highSeedSensitivityRate = seedSensitivityRows.filter(({ highSeedSensitivity }) => highSeedSensitivity).length / seedSensitivityRows.length;
const decisionClocks = normalOutcomeRows.map(({ worldClockBeforeFinalization }) => worldClockBeforeFinalization);
const clockSummary = { min: Math.min(...decisionClocks), p05: round(quantile(decisionClocks, .05)), p25: round(quantile(decisionClocks, .25)), median: round(quantile(decisionClocks, .5)), p75: round(quantile(decisionClocks, .75)), p95: round(quantile(decisionClocks, .95)), max: Math.max(...decisionClocks), atOrBelow300Percent: percent(decisionClocks.filter((value) => value <= 300).length, decisionClocks.length), from301To330Percent: percent(decisionClocks.filter((value) => value >= 301 && value <= 330).length, decisionClocks.length), from331To360Percent: percent(decisionClocks.filter((value) => value >= 331 && value <= 360).length, decisionClocks.length) };
const resourceSummary = resourceAvailabilitySummary(nonOracleRows);

const sourceFiles = walk("src/ui/components/scenario/scenario-five/calibration");
const noForbiddenRandom = sourceFiles.every((path) => !readFileSync(join(ROOT, path), "utf8").includes(["Math", "random"].join(".")));
const dominanceCoveragePassed = counterfactual.stateCoverage.every(({ pass }) => pass);
const sixStatesPassed = endStateCoverageV2.every(({ classification }) => classification !== "not_observed_under_phase8a_structured_search");
const hardGates: GateRecord[] = [
  { gateId: "ENVIRONMENT_PANEL_COVERAGE", status: environmentWorldCounts.size === 16 && [...environmentWorldCounts.values()].every((count) => count === 64) && latencyVariants.size === 3 && environmentCoverage.missingNoiseRelations.length === 0 ? "PASS" : "FAIL", detail: `worlds=${environmentWorldCounts.size}; latency=${[...latencyVariants].sort().join("|")}; missingNoise=${environmentCoverage.missingNoiseRelations.length}` },
  { gateId: "EXECUTION_COMPLETION", status: scheduledMissionRuns === 25600 && missionRows.every(({ completed }) => completed) ? "PASS" : "FAIL", detail: `${missionRows.filter(({ completed }) => completed).length}/${scheduledMissionRuns}` },
  { gateId: "DETERMINISTIC_REPLAY", status: deterministicReplayPassed ? "PASS" : "FAIL", detail: `${replayCases} cases` },
  { gateId: "LEGAL_ACTION_SAFETY", status: zeroOptionWindows === 0 && negativeResourceRuns === 0 && chronologyFailures === 0 ? "PASS" : "FAIL", detail: `zeroOption=${zeroOptionWindows}; negativeResource=${negativeResourceRuns}; chronology=${chronologyFailures}` },
  { gateId: "DOMAIN_DELAY_IDENTITY", status: delayIdentityFailures === 0 ? "PASS" : "FAIL", detail: `${delayIdentityFailures} failures` },
  { gateId: "NO_MATH_RANDOM", status: noForbiddenRandom ? "PASS" : "FAIL", detail: `${sourceFiles.length} calibration files scanned` },
  { gateId: "ACTION_TARGET_COVERAGE_V2", status: coverageV2Passed ? "PASS" : "FAIL", detail: `actions=${actionCoverage.filter(({ selectionCount }) => selectionCount > 0).length}/33; probes=${explicitTargetProbes.filter(({ commitSucceeded }) => commitSucceeded).length}/${explicitTargetProbes.length}; failed=${explicitTargetProbes.filter(({ classification }) => classification === "probe_failed").length}` },
  { gateId: "OSI_STRUCTURAL_CENTERING", status: structuralOsiPassed ? "PASS" : "FAIL", detail: `diagnosticSets=${structuralOsiRows.filter(({ diagnostic }) => diagnostic).length}; maxAbs=${Math.max(...structuralOsiRows.filter(({ diagnostic }) => diagnostic).map(({ meanAdjustedOrientation }) => Math.abs(meanAdjustedOrientation ?? 0)))}` },
  { gateId: "RANDOM_OSI_MONTE_CARLO_CENTERING", status: randomOsiPassed ? "PASS" : "FAIL", detail: JSON.stringify(randomOsiMonteCarlo) },
  { gateId: "DOMINANCE_STATE_COVERAGE", status: dominanceCoveragePassed ? "PASS" : "FAIL", detail: counterfactual.stateCoverage.map(({ windowId, uniqueStateCount }) => `${windowId}:${uniqueStateCount}`).join(";") },
  { gateId: "NO_UNIVERSAL_ACTION_DOMINANCE_V2", status: counterfactual.universalDominanceActions.length === 0 ? "PASS" : "FAIL", detail: counterfactual.universalDominanceActions.join("|") || "none" },
  { gateId: "SIX_END_STATES_OBSERVED_V2", status: sixStatesPassed ? "PASS" : "FAIL", detail: endStateCoverageV2.map(({ endStateId, classification }) => `${endStateId}:${classification}`).join(";") },
  { gateId: "ACTOR_PAIR_DISTINCTIVENESS", status: actorPairResults.every(({ distinguishable }) => distinguishable) ? "PASS" : "FAIL", detail: `${actorPairResults.filter(({ distinguishable }) => distinguishable).length}/6` },
  { gateId: "COGNITIVE_ANCHOR_GATES", status: anchorChecks.every(({ pass }) => pass) ? "PASS" : "FAIL", detail: `${anchorChecks.filter(({ pass }) => pass).length}/${anchorChecks.length}` },
  { gateId: "COGNITIVE_FIREWALL", status: cognitiveFirewallPassed && cognitiveFirewallPairs === 100 ? "PASS" : "FAIL", detail: `${cognitiveFirewallPairs} pairs` },
  { gateId: "MAX_DECISION_CLOCK_360", status: clockSummary.max <= 360 ? "PASS" : "FAIL", detail: `max=${clockSummary.max}` },
];
const warnings: GateRecord[] = [
  { gateId: "FORCED_CHOICE_WARNING", status: forcedChoiceRate > .05 ? "WARNING" : "PASS", detail: `${round(100 * forcedChoiceRate)}%` },
  { gateId: "RESOURCE_TOO_LOOSE_WARNING", status: tooLooseRate > .8 ? "WARNING" : "PASS", detail: `${round(100 * tooLooseRate)}%` },
  { gateId: "RESOURCE_EXHAUSTION_WARNING", status: exhaustionRate > .25 ? "WARNING" : "PASS", detail: `${round(100 * exhaustionRate)}%` },
  { gateId: "OUTCOME_CONCENTRATION_WARNING", status: outcomeConcentrationShare > .85 || actorOutcomeVarietyFailures.length > 0 || corridorOutcomeVarietyFailures.length > 0 ? "WARNING" : "PASS", detail: `modal=${modalOutcome.endStateId}:${round(100 * outcomeConcentrationShare)}%; actor=${actorOutcomeVarietyFailures.join("|") || "none"}; corridor=${corridorOutcomeVarietyFailures.join("|") || "none"}` },
  { gateId: "SEED_SENSITIVITY_WARNING", status: highSeedSensitivityRate > .2 ? "WARNING" : "PASS", detail: `${round(100 * highSeedSensitivityRate)}%` },
  { gateId: "COGNITIVE_DISTRIBUTION_WARNING", status: distributions.some(({ warnings: items }) => items.length > 0) ? "WARNING" : "PASS", detail: distributions.filter(({ warnings: items }) => items.length > 0).map(({ metric, warnings: items }) => `${metric}:${items.join("|")}`).join(";") || "none" },
];
const overallStatus = hardGates.every(({ status }) => status === "PASS") ? "PASS" : "FAIL";
const originalPhase8FailureDisposition = {
  ACTION_TARGET_COVERAGE: coverageV2Passed ? "audit_sampling_issue" : "persists_after_correction",
  SIX_END_STATES_OBSERVED: sixStatesPassed ? "resolved_by_structured_search" : "model_or_taxonomy_issue_confirmed",
  NO_UNIVERSAL_ACTION_DOMINANCE: counterfactual.universalDominanceActions.length === 0 ? "original_audit_incomplete" : "dominance_persists_after_corrected_audit",
  RANDOM_OSI_CENTERING: structuralOsiPassed && randomOsiPassed ? "random_sampling_issue" : "centering_issue_persists",
} as const;

const protectedAfter = aggregateContentHash(protectedPaths);
const originalPhase8After = originalArtifactHash(originalPhase8Paths);
if (protectedAfter !== protectedBefore) throw new Error("Frozen source changed during Phase 08A");
if (originalPhase8After !== originalPhase8Before) throw new Error("Original Phase-8 artifact changed during Phase 08A");

const boundaryC = structuredReachability.boundaries.find(({ boundaryId }) => boundaryId === "C")?.value ?? null;
const boundaryA = structuredReachability.boundaries.find(({ boundaryId }) => boundaryId === "A")?.value ?? null;
const summary = {
  calibrationVersion: S5_CALIBRATION_VERSION,
  calibrationStatus: S5_CALIBRATION_STATUS,
  frozenModelVersions: { mission: MISSION_MODEL_VERSION, cognitive: S5_COGNITIVE_MEASUREMENT_MODEL_VERSION, runtime: S5_RUNTIME_MODEL_VERSION, domainMetrics: S5_DOMAIN_METRICS_VERSION, phase7UiAar: "07B frozen", frozenProtectedManifestSha256: protectedAfter, originalPhase8ArtifactAggregateSha256: originalPhase8After },
  runCounts: { missionMainRuns: scheduledMissionRuns, deterministicMissionRuns: 9216, randomMissionRuns: 16384, cognitiveRuns: cognitiveRows.length, deterministicCognitiveRuns: 3840, randomCognitiveRuns: randomCognitive.length, deterministicReplayCases: replayCases, correctedCounterfactualBranches: counterfactual.branchCount },
  effectivePolicySeedUniqueness: { m10: { expected: 16384, unique: m10EffectiveSeeds.size, pass: m10EffectiveSeeds.size === 16384 }, c16: { expected: 4096, unique: c16EffectiveSeeds.size, pass: c16EffectiveSeeds.size === 4096 } },
  environmentCoverage,
  explicitTargetCoverage: { observedActionCount: actionCoverage.filter(({ selectionCount }) => selectionCount > 0).length, probeRowCount: explicitTargetProbes.length, successfulProbeCount: explicitTargetProbes.filter(({ commitSucceeded }) => commitSucceeded).length, failedProbeCount: explicitTargetProbes.filter(({ classification }) => classification === "probe_failed").length, originalMissingPair: explicitTargetProbes.find(({ actionId, corridorId }) => actionId === "a2_focused_pnt" && corridorId === "corridor_delta_west") },
  structuralOsiCentering: { rowCount: structuralOsiRows.length, diagnosticRowCount: structuralOsiRows.filter(({ diagnostic }) => diagnostic).length, maximumAbsoluteMean: Math.max(...structuralOsiRows.filter(({ diagnostic }) => diagnostic).map(({ meanAdjustedOrientation }) => Math.abs(meanAdjustedOrientation ?? 0))), pass: structuralOsiPassed },
  randomOsiMonteCarlo,
  dominanceStateCoverage: counterfactual.stateCoverage,
  dominanceByContinuation: counterfactual.rows,
  universalDominanceV2: { actions: counterfactual.universalDominanceActions, formerPhase8Actions: ["a1_preserve_reserve", "b1_pulse_network", "c1_preserve_mobile_reserve"].map((actionId) => ({ actionId, rows: counterfactual.rows.filter((row) => row.actionId === actionId) })) },
  paretoOutcomeVector: counterfactual.outcomeVectorDimensions,
  endStateCoverageV2,
  structuredSearchRunCounts: { searchesExecuted: structuredReachability.searchesExecuted, branchesApplied: structuredReachability.branchesApplied, uniqueStatesGenerated: structuredReachability.uniqueStatesGenerated, retainedStates: structuredReachability.retainedStates, maximumBeamWidth: structuredReachability.maximumBeamWidth, representativeEnvironmentCount: structuredReachability.representativeEnvironments.length, beamLimit: 2500, randomPruning: false, missionEventsMechanicsAudit: structuredReachability.missionEventsMechanicsAudit },
  reachabilityBoundaries: { rows: structuredReachability.boundaries, boundaryStatements: [
    ...(boundaryC !== null && boundaryC <= 360 ? ["No Phase-08A structured witness can satisfy the current mission_incomplete_continuity_preserved non-delivery-by-360 condition."] : []),
    ...(boundaryA !== null && boundaryA > 50 ? ["No Phase-08A structured witness reaches the current priority_delivered_network_failure <=50 continuity condition."] : []),
  ] },
  extendedShadowHorizon,
  resourceAvailabilitySummary: resourceSummary,
  actorPairResults,
  cognitiveAnchorSummary: anchorChecks,
  cognitiveFirewall: { pairs: cognitiveFirewallPairs, pass: cognitiveFirewallPassed },
  runtimeClock: clockSummary,
  distributionWarnings: distributions,
  originalPhase8FailureDisposition,
  originalPhase8FindingsPreserved: { overallStatus: "FAIL", originalHardGateFailures: 4, cognitiveLowVarianceWarnings: 3 },
  hardGates, warnings, overallStatus,
};

const failed = hardGates.filter(({ status }) => status === "FAIL");
const activeWarnings = warnings.filter(({ status }) => status === "WARNING");
const warningState = (metric: string): string => distributions.find((item) => item.metric === metric)?.warnings.length ? "ادامه دارد" : "برطرف شده است";
const report = `# گزارش تشخیصی فاز ۸A — سناریو ۵

## 1. خلاصه اجرایی Phase 8A

وضعیت audit اصلاح‌شده: **${overallStatus}**. Phase 8A مدل سناریو را تغییر نداده است.

## 2. چرا Phase 8A لازم شد

چهار failure فاز ۸ باید میان نقص روش نمونه‌گیری و مسئله واقعی مدل/طبقه‌بندی تفکیک می‌شدند. نتیجه اصلی فاز ۸ با وضعیت FAIL محفوظ است.

## 3. اصلاح sampling policy RNG

برای M10 تعداد ${m10EffectiveSeeds.size} و برای C16 تعداد ${c16EffectiveSeeds.size} effective seed یکتا با ساخت index بدون hash ثبت شد.

## 4. پوشش صریح Action/Target

همه ۳۳ Action در audit اصلی مشاهده شدند و ${explicitTargetProbes.length} زوج required-action/corridor بررسی شدند. زوج a2_focused_pnt/corridor_delta_west دارای disposition برابر ${explicitTargetProbes.find(({ actionId, corridorId }) => actionId === "a2_focused_pnt" && corridorId === "corridor_delta_west")?.classification} است. پاس شدن یک coverage probe به معنی فراوانی طبیعی آن انتخاب نیست.

## 5. OSI structural centering

${structuralOsiRows.filter(({ diagnostic }) => diagnostic).length} مجموعه diagnostic بررسی شد؛ بیشینه قدرمطلق میانگین ${summary.structuralOsiCentering.maximumAbsoluteMean} و gate برابر ${structuralOsiPassed ? "PASS" : "FAIL"} است.

## 6. OSI Monte Carlo پس از اصلاح sampling

نتایج C16: ${JSON.stringify(randomOsiMonteCarlo)}. Structural centering ویژگی فرمول را می‌سنجد؛ Monte Carlo رفتار نمونه‌گیری مصنوعی را.

## 7. Pareto audit چند-Continuation

برای هر state چهار continuation و بردار کامل ۱۶بعدی بدون scalar score اجرا شد؛ ${counterfactual.branchCount} شاخه بررسی شد.

## 8. بازبینی سه Action دارای dominance قبلی

سه Action قبلی a1_preserve_reserve، b1_pulse_network و c1_preserve_mobile_reserve در K1..K4 صریحاً بازبینی شدند. universal V2: ${counterfactual.universalDominanceActions.join("، ") || "هیچ‌کدام"}.

## 9. Structured reachability دو End State مفقود

با mission engine، beam حداکثر ۲۵۰۰، بدون random pruning، ${structuredReachability.branchesApplied} شاخه و ${structuredReachability.uniqueStatesGenerated} state یکتا بررسی شد. Structured search اثبات ریاضی reachability یا unreachability نیست.

## 10. Reachability boundary diagnostics

${structuredReachability.boundaries.map(({ metric, value }) => `- ${metric}: ${value ?? "null"}`).join("\n")}

${summary.reachabilityBoundaries.boundaryStatements.join("\n\n")}

## 11. تحلیل گسترده افق زمانی

افق‌های ${EXTENDED_SHADOW_HORIZONS.join("، ")} دقیقه به‌صورت post-hoc ثبت شدند. 360 minutes remains a design parameter pending reviewer/expert decision.

## 12. وضعیت منابع و option availability

بودجه رسمی ۱۰۰/۱۰۰ تغییر نکرد. توزیع minimum option و صدک‌های ISR/support در summary ثبت شده‌اند.

## 13. وضعیت Warningهای شناختی

- escalationSensitivity: ${warningState("escalationSensitivity")}
- multiDomainIntegration: ${warningState("multiDomainIntegration")}
- integration: ${warningState("integration")}

هیچ loading تغییر نکرد. نتایج synthetic agent اعتبار انسانی یا روان‌سنجی ایجاد نمی‌کنند.

## 14. تعیین تکلیف چهار failure اولیه

${Object.entries(originalPhase8FailureDisposition).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## 15. Hard Gateهای 08A

${hardGates.map(({ gateId, status, detail }) => `- ${gateId}: ${status} — ${detail}`).join("\n")}

## 16. Warningها

${activeWarnings.length ? activeWarnings.map(({ gateId, detail }) => `- ${gateId}: ${detail}`).join("\n") : "- none"}

## 17. مواردی که واقعاً نیازمند تغییر مدل هستند

${failed.length ? failed.map(({ gateId, detail }) => `- ${gateId}: ${detail}`).join("\n") : "- none"}

## 18. محدودیت‌ها

Structured search اثبات ریاضی reachability یا unreachability نیست. فراوانی synthetic policy احتمال رخداد بیرونی نیست و هیچ اعتبار انسانی/روان‌سنجی ایجاد نمی‌کند. هیچ عدد جایگزین مأموریتی یا شناختی پیشنهاد یا اعمال نشده است.
`;

write("docs/scenario5-phase8a-results/mission-runs.csv", toCsv(missionCsvRows));
write("docs/scenario5-phase8a-results/cognitive-runs.csv", toCsv(cognitiveCsvRows));
write("docs/scenario5-phase8a-results/explicit-action-target-probes.csv", toCsv(asRecords(explicitTargetProbes)));
write("docs/scenario5-phase8a-results/end-state-reachability.csv", toCsv(asRecords(endStateCoverageV2)));
write("docs/scenario5-phase8a-results/reachability-boundaries.csv", toCsv(asRecords(structuredReachability.boundaries)));
write("docs/scenario5-phase8a-results/action-dominance-multicontinuation.csv", toCsv(counterfactual.rows));
write("docs/scenario5-phase8a-results/random-osi-centering.csv", toCsv(asRecords(Object.entries(randomOsiMonteCarlo).map(([scope, stats]) => ({ scope, ...stats, pass: Math.abs(stats.mean) <= .05 })))));
write("docs/scenario5-phase8a-results/structural-osi-centering.csv", toCsv(asRecords(structuralOsiRows)));
write(
  "docs/scenario5-phase8a-results/cognitive-distributions.csv",
  toCsv(asRecords(distributions.map(({ warnings: items, ...row }) => ({ ...row, warnings: items.join("|") })))),
);
write("docs/scenario5-phase8a-results/shadow-time-sensitivity-extended.csv", toCsv(asRecords(extendedShadowHorizon)));
write("docs/scenario5-phase8a-summary.json", `${JSON.stringify(summary, null, 2)}\n`);
write("docs/scenario5-phase8a-diagnostic-report-fa.md", report);

console.log(`Scenario 5 Phase 08A completed in ${Date.now() - startedWallClock} ms (console-only wall clock).`);
console.log(`Mission=${scheduledMissionRuns}; cognitive=${cognitiveRows.length}; structured branches=${structuredReachability.branchesApplied}; counterfactual branches=${counterfactual.branchCount}.`);
console.log(`Overall=${overallStatus}; frozen=${protectedAfter}; originalPhase8=${originalPhase8After}.`);
