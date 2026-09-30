/**
 * Scenario 4 exhaustive outcome explorer
 *
 * Exhausts every END-STATE-RELEVANT player decision combination against every
 * hidden Israel intent. It uses the production Scenario 4 adjudicators directly.
 *
 * It intentionally does NOT expand:
 *   - the 3 "reason" questions (they do not change adjudication/end state)
 *   - the 3 player attribution sliders (they do not change the end-state resolver)
 *
 * Those variables matter for cognitive/Brier outputs, not for reachability of
 * the 9 primary endings.
 *
 * Randomness:
 * There is no finite way to enumerate every possible random seed. Instead,
 * --worlds N runs the entire decision space under N deterministic worlds.
 * Within one world, the same hidden world/noise is reused across all player
 * paths, which makes the run suitable for counterfactual comparison.
 *
 * Usage:
 *   npm i -D tsx
 *   npx tsx scripts/exhaustive-s4-outcomes.ts
 *
 * Examples:
 *   npx tsx scripts/exhaustive-s4-outcomes.ts --worlds 1
 *   npx tsx scripts/exhaustive-s4-outcomes.ts --worlds 3 --summary-only
 *   npx tsx scripts/exhaustive-s4-outcomes.ts --worlds 1 --summary-only --confidence-audit
 *   npx tsx scripts/exhaustive-s4-outcomes.ts --intent alliance_fracture
 *   npx tsx scripts/exhaustive-s4-outcomes.ts --max-paths 10000
 */

import fs from "node:fs";
import path from "node:path";
import { once } from "node:events";
import { createGzip } from "node:zlib";

import {
  adjudicateMoveOne,
  applyBlueDecision,
  type MoveOneChoices,
} from "../src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts";
import {
  adjudicateMove2,
  applyMove2Decision,
  initializeMove2Incident,
  type Move2Choices,
} from "../src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts";
import {
  adjudicateMove3,
  applyMove3Decision,
  initializeMove3Severity,
  type Move3Choices,
} from "../src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts";
import {
  createInitialScenarioOneState,
  cloneState,
  SCENARIO4_RESOURCE_PROFILE_ID,
  SCENARIO4_RESOURCE_PROFILES,
  type Scenario4ResourceProfileId,
} from "../src/ui/components/scenario/scenario-four/model/initialState.ts";
import {
  applyResourceRecovery,
  canAffordResourceCosts,
} from "../src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts";
import {
  informationOptions,
  protectionOptions,
  communicationOptions,
} from "../src/ui/components/scenario/scenario-four/moves/move1.ts";
import {
  investigationOptions,
  missionOptions,
  responseOptions,
} from "../src/ui/components/scenario/scenario-four/moves/move2.ts";
import {
  thresholdOptions,
  crisisCoaOptions,
  informationPolicyOptions,
  offRampOptions,
} from "../src/ui/components/scenario/scenario-four/moves/move3.ts";

import type {
  FinalEndState,
  RedIntent,
  ResourceKey,
  ScenarioOneState,
} from "../src/ui/components/scenario/scenario-four/model/types.ts";

const ALL_INTENTS: RedIntent[] = [
  "probe",
  "intelligence_collection",
  "coercion",
  "alliance_fracture",
  "benign_ambiguous",
];

const END_STATES: FinalEndState[] = [
  "escalation_spiral",
  "intelligence_failure",
  "coalition_fracture",
  "negotiated_deescalation",
  "calm_crisis_control",
  "costly_deterrence",
  "persistent_ambiguity",
  "strategic_information_opportunity",
  "mixed_crisis_containment",
];

const END_STATE_FA: Record<FinalEndState, string> = {
  escalation_spiral: "مارپیچ تشدید",
  intelligence_failure: "شکست اطلاعاتی",
  coalition_fracture: "شکاف ائتلافی",
  negotiated_deescalation: "کاهش تنش مذاکره‌شده",
  calm_crisis_control: "مهار آرام بحران",
  costly_deterrence: "بازدارندگی پرهزینه",
  persistent_ambiguity: "ابهام پایدار",
  strategic_information_opportunity: "فرصت اطلاعاتی راهبردی",
  mixed_crisis_containment: "مهار نسبی بحران",
};

const ids = <T extends { id: string }>(items: T[]) => items.map((x) => x.id);

const M1_I = ids(informationOptions);
const M1_P = ids(protectionOptions);
const M1_C = ids(communicationOptions);

const M2_A = ids(investigationOptions);
const M2_M = ids(missionOptions);
const M2_R = ids(responseOptions);

const M3_T = ids(thresholdOptions);
const M3_C = ids(crisisCoaOptions);
const M3_I = ids(informationPolicyOptions);
const M3_O = ids(offRampOptions);

const optionIndex = (id: string, arr: string[]) => arr.indexOf(id) + 1;

type Args = {
  worlds: number;
  intent?: RedIntent;
  summaryOnly: boolean;
  maxPaths?: number;
  outDir: string;
  examplesPerEnd: number;
  confidenceAudit: boolean;
  resourceProfile: Scenario4ResourceProfileId;
};

const getArg = (name: string) => {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
};

const parseArgs = (): Args => {
  const worlds = Number(getArg("--worlds") ?? "1");
  const maxPathsRaw = getArg("--max-paths");
  const intentRaw = getArg("--intent");
  const intent =
    intentRaw && intentRaw !== "all"
      ? (intentRaw as RedIntent)
      : undefined;
  const resourceProfile = (getArg("--resource-profile") ?? SCENARIO4_RESOURCE_PROFILE_ID) as Scenario4ResourceProfileId;

  if (!Number.isInteger(worlds) || worlds < 1) {
    throw new Error("--worlds must be a positive integer");
  }
  if (intent && !ALL_INTENTS.includes(intent)) {
    throw new Error(`Invalid --intent. Use one of: ${ALL_INTENTS.join(", ")}, all`);
  }
  if (!(resourceProfile in SCENARIO4_RESOURCE_PROFILES)) {
    throw new Error(`Invalid --resource-profile. Use one of: ${Object.keys(SCENARIO4_RESOURCE_PROFILES).join(", ")}`);
  }

  return {
    worlds,
    intent,
    summaryOnly: process.argv.includes("--summary-only"),
    maxPaths: maxPathsRaw ? Number(maxPathsRaw) : undefined,
    outDir:
      getArg("--out-dir") ??
      path.resolve("analysis", `scenario4-exhaustive-${new Date().toISOString().replace(/[:.]/g, "-")}`),
    examplesPerEnd: Number(getArg("--examples-per-end") ?? "20"),
    confidenceAudit: process.argv.includes("--confidence-audit"),
    resourceProfile,
  };
};

const csv = (v: unknown) => {
  if (v === undefined || v === null) return "";
  const s = Array.isArray(v) ? v.join("|") : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
};

const FIXED_MOVE1_COMPLETED_AT = "2030-01-01T00:00:01.000Z";
const FIXED_MOVE2_COMPLETED_AT = "2030-01-01T00:00:02.000Z";
const FIXED_STARTED_AT = "2030-01-01T00:00:00.000Z";

const columns = [
  "world",
  "world_seed",
  "intent",
  "signature",
  "m1_information",
  "m1_protection",
  "m1_communication",
  "m1_red_action",
  "m1_ally_action",
  "m1_commercial_action",
  "incident_cause",
  "true_incident_attribution",
  "m2_investigation",
  "m2_mission",
  "m2_response",
  "m2_red_action",
  "m2_ally_action",
  "m2_commercial_action",
  "move3_severity",
  "m3_threshold",
  "m3_coa",
  "m3_information",
  "m3_offramp",
  "m3_red_action",
  "m3_ally_action",
  "end_state",
  "end_state_fa",
  "mission_continuity",
  "situation_awareness",
  "escalation_pressure",
  "operational_readiness",
  "coalition_cohesion",
  "information_exposure",
  "strategic_legitimacy",
  "system_attribution_confidence",
  "ssa_capacity",
  "protective_capacity",
  "political_capital",
  "disclosure_budget",
  "metric_mission",
  "metric_information_quality",
  "metric_escalation_control",
  "metric_coalition",
  "metric_resource_sustainability",
  "metric_information_discipline",
  "metric_legitimacy",
  "metric_resilience",
  "metric_reversibility",
  "metric_decision_coherence",
  "tags",
];

type Summary = {
  metadata: Record<string, unknown>;
  totalPaths: number;
  endStates: Record<string, number>;
  byIntent: Record<string, Record<string, number>>;
  byWorld: Record<string, Record<string, number>>;
  examples: Record<string, Array<Record<string, unknown>>>;
  hiddenWorlds: Array<{
    world: number;
    worldSeed: string;
    intent: RedIntent;
    incidentCause?: string;
    trueIncidentAttribution?: string;
  }>;
  confidence?: ConfidenceAudit;
  resources?: ResourceAudit;
};

const RESOURCE_KEYS: ResourceKey[] = ["ssaCapacity", "protectiveCapacity", "politicalCapital", "disclosureBudget"];
const RESOURCE_PHASES = ["move1", "move2", "final"] as const;
type ResourcePhase = typeof RESOURCE_PHASES[number];
type NumberAccumulator = { count: number; sum: number; min: number; max: number; histogram: number[] };
type ResourcePhaseAccumulator = {
  paths: number;
  resources: Record<ResourceKey, NumberAccumulator>;
  anyBelow70: number;
  anyBelow50: number;
  anyBelow30: number;
  anyZero: number;
};
type ResourceAudit = {
  profile: Scenario4ResourceProfileId;
  baseline: ScenarioOneState["resources"];
  blockedAttemptsTotal: number;
  blockedAttemptsByOption: Record<string, number>;
  phases: Record<ResourcePhase, ReturnType<typeof summarizeResourcePhase>>;
  byEndState: Record<string, Record<ResourceKey, ReturnType<typeof summarizeNumber>>>;
  pathCost: {
    userSpent: ReturnType<typeof summarizeNumber>;
    recovered: ReturnType<typeof summarizeNumber>;
    netConsumed: ReturnType<typeof summarizeNumber>;
  };
  representativePaths: Record<"low" | "medium" | "high", Record<string, unknown> | null>;
};

const makeNumberAccumulator = (): NumberAccumulator => ({ count: 0, sum: 0, min: Infinity, max: -Infinity, histogram: Array.from({ length: 401 }, () => 0) });
const recordNumber = (acc: NumberAccumulator, value: number) => {
  const normalized = Math.max(0, Math.min(acc.histogram.length - 1, Math.round(value)));
  acc.count += 1; acc.sum += value; acc.min = Math.min(acc.min, value); acc.max = Math.max(acc.max, value); acc.histogram[normalized] += 1;
};
const percentileFromHistogram = (acc: NumberAccumulator, ratio: number) => {
  if (!acc.count) return null;
  const target = Math.floor((acc.count - 1) * ratio); let cumulative = 0;
  for (let value = 0; value < acc.histogram.length; value += 1) { cumulative += acc.histogram[value]; if (cumulative > target) return value; }
  return acc.histogram.length - 1;
};
const summarizeNumber = (acc: NumberAccumulator) => ({
  count: acc.count,
  min: acc.count ? acc.min : null,
  max: acc.count ? acc.max : null,
  mean: acc.count ? Number((acc.sum / acc.count).toFixed(3)) : null,
  p05: percentileFromHistogram(acc, .05),
  p50: percentileFromHistogram(acc, .5),
  p95: percentileFromHistogram(acc, .95),
});
const makeResourcePhaseAccumulator = (): ResourcePhaseAccumulator => ({
  paths: 0,
  resources: Object.fromEntries(RESOURCE_KEYS.map((key) => [key, makeNumberAccumulator()])) as Record<ResourceKey, NumberAccumulator>,
  anyBelow70: 0, anyBelow50: 0, anyBelow30: 0, anyZero: 0,
});
const recordResourcePhase = (acc: ResourcePhaseAccumulator, resources: ScenarioOneState["resources"]) => {
  const values = RESOURCE_KEYS.map((key) => resources[key]); acc.paths += 1;
  RESOURCE_KEYS.forEach((key) => recordNumber(acc.resources[key], resources[key]));
  if (values.some((value) => value < 70)) acc.anyBelow70 += 1;
  if (values.some((value) => value < 50)) acc.anyBelow50 += 1;
  if (values.some((value) => value < 30)) acc.anyBelow30 += 1;
  if (values.some((value) => value === 0)) acc.anyZero += 1;
};
const summarizeResourcePhase = (acc: ResourcePhaseAccumulator) => ({
  paths: acc.paths,
  resources: Object.fromEntries(RESOURCE_KEYS.map((key) => [key, summarizeNumber(acc.resources[key])])) as Record<ResourceKey, ReturnType<typeof summarizeNumber>>,
  thresholdShares: {
    below70: acc.paths ? acc.anyBelow70 / acc.paths : 0,
    below50: acc.paths ? acc.anyBelow50 / acc.paths : 0,
    below30: acc.paths ? acc.anyBelow30 / acc.paths : 0,
    exactZero: acc.paths ? acc.anyZero / acc.paths : 0,
  },
});

const CONFIDENCE_THRESHOLDS = [35, 40, 45, 50, 55, 60, 70] as const;

type ConfidenceAccumulator = {
  count: number;
  histogram: number[];
};

type ConfidenceSummary = {
  count: number;
  min: number | null;
  max: number | null;
  p05: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p95: number | null;
  thresholdCoverage: Record<string, { count: number; share: number }>;
  histogram: Record<string, number>;
};

type ConfidenceAudit = {
  overall: ConfidenceSummary;
  byIntent: Record<string, ConfidenceSummary>;
  byIncidentCause: Record<string, ConfidenceSummary>;
};

const makeConfidenceAccumulator = (): ConfidenceAccumulator => ({
  count: 0,
  histogram: Array.from({ length: 101 }, () => 0),
});

const recordConfidence = (accumulator: ConfidenceAccumulator, value: number) => {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  accumulator.count += 1;
  accumulator.histogram[normalized] += 1;
};

const summarizeConfidence = (accumulator: ConfidenceAccumulator): ConfidenceSummary => {
  const nonZero = accumulator.histogram
    .map((count, value) => ({ value, count }))
    .filter((entry) => entry.count > 0);
  const percentile = (ratio: number) => {
    if (!accumulator.count) return null;
    const target = Math.floor((accumulator.count - 1) * ratio);
    let cumulative = 0;
    for (let value = 0; value < accumulator.histogram.length; value += 1) {
      cumulative += accumulator.histogram[value];
      if (cumulative > target) return value;
    }
    return 100;
  };
  return {
    count: accumulator.count,
    min: nonZero[0]?.value ?? null,
    max: nonZero.at(-1)?.value ?? null,
    p05: percentile(0.05),
    p25: percentile(0.25),
    p50: percentile(0.5),
    p75: percentile(0.75),
    p95: percentile(0.95),
    thresholdCoverage: Object.fromEntries(CONFIDENCE_THRESHOLDS.map((threshold) => {
      const count = accumulator.histogram.slice(threshold).reduce((sum, value) => sum + value, 0);
      return [`gte${threshold}`, { count, share: accumulator.count ? count / accumulator.count : 0 }];
    })),
    histogram: Object.fromEntries(nonZero.map(({ value, count }) => [String(value), count])),
  };
};

const makeCounter = () =>
  Object.fromEntries(END_STATES.map((x) => [x, 0])) as Record<string, number>;

const signature = (
  i: string,
  p: string,
  c: string,
  a: string,
  m: string,
  r: string,
  t: string,
  coa: string,
  info: string,
  off?: string,
) =>
  [
    `${optionIndex(i, M1_I)}-${optionIndex(p, M1_P)}-${optionIndex(c, M1_C)}`,
    `${optionIndex(a, M2_A)}-${optionIndex(m, M2_M)}-${optionIndex(r, M2_R)}`,
    `${optionIndex(t, M3_T)}-${optionIndex(coa, M3_C)}-${optionIndex(info, M3_I)}`,
    off ? `O${optionIndex(off, M3_O)}` : "O-",
  ].join("|");

const rowFromResult = ({
  world,
  worldSeed,
  intent,
  sig,
  m1Choices,
  m1,
  move2State,
  m2Choices,
  m2,
  m3Choices,
  result,
}: {
  world: number;
  worldSeed: string;
  intent: RedIntent;
  sig: string;
  m1Choices: MoveOneChoices;
  m1: ReturnType<typeof adjudicateMoveOne>["snapshot"];
  move2State: ScenarioOneState;
  m2Choices: Move2Choices;
  m2: ReturnType<typeof adjudicateMove2>["snapshot"];
  m3Choices: Move3Choices;
  result: ReturnType<typeof adjudicateMove3>;
}): Record<string, unknown> => {
  const s = result.finalSnapshot.finalState as ScenarioOneState;
  const metrics = result.finalSnapshot.finalMetrics;
  const end = result.finalSnapshot.primaryEndState as FinalEndState;

  return {
    world,
    world_seed: worldSeed,
    intent,
    signature: sig,

    m1_information: m1Choices.information,
    m1_protection: m1Choices.protection,
    m1_communication: m1Choices.communication,
    m1_red_action: m1.redAction,
    m1_ally_action: m1.allyAction,
    m1_commercial_action: m1.commercialAction,

    incident_cause: move2State.hidden.move2IncidentCause,
    true_incident_attribution: move2State.hidden.trueIncidentAttribution,

    m2_investigation: m2Choices.investigation,
    m2_mission: m2Choices.mission,
    m2_response: m2Choices.response,
    m2_red_action: m2.redAction,
    m2_ally_action: m2.allyAction,
    m2_commercial_action: m2.commercialAction,

    move3_severity: s.knowledge.serviceImpactSeverity,

    m3_threshold: m3Choices.threshold,
    m3_coa: m3Choices.coa,
    m3_information: m3Choices.informationPolicy,
    m3_offramp: m3Choices.offRamp ?? "",
    m3_red_action: result.move3.redAction,
    m3_ally_action: result.move3.allyAction,

    end_state: end,
    end_state_fa: END_STATE_FA[end],

    mission_continuity: s.visible.missionContinuity,
    situation_awareness: s.visible.situationAwareness,
    escalation_pressure: s.visible.escalationPressure,
    operational_readiness: s.visible.operationalReadiness,
    coalition_cohesion: s.visible.coalitionCohesion,
    information_exposure: s.visible.informationExposure,
    strategic_legitimacy: s.visible.strategicLegitimacy,
    system_attribution_confidence: s.knowledge.systemAttributionConfidence,

    ssa_capacity: s.resources.ssaCapacity,
    protective_capacity: s.resources.protectiveCapacity,
    political_capital: s.resources.politicalCapital,
    disclosure_budget: s.resources.disclosureBudget,

    metric_mission: metrics.missionOutcomeScore,
    metric_information_quality: metrics.informationQualityScore,
    metric_escalation_control: metrics.escalationControlScore,
    metric_coalition: metrics.coalitionOutcomeScore,
    metric_resource_sustainability: metrics.resourceSustainabilityScore,
    metric_information_discipline: metrics.informationDisciplineScore,
    metric_legitimacy: metrics.strategicLegitimacyScore,
    metric_resilience: metrics.resilienceScore,
    metric_reversibility: metrics.reversibilityScore,
    metric_decision_coherence: metrics.decisionCoherenceScore,
    tags: result.finalSnapshot.secondaryOutcomeTags,
  };
};

const main = async () => {
  const args = parseArgs();
  fs.mkdirSync(args.outDir, { recursive: true });

  const intents = args.intent ? [args.intent] : ALL_INTENTS;

  const summary: Summary = {
    metadata: {
      generatedAt: new Date().toISOString(),
      worlds: args.worlds,
      intents,
      summaryOnly: args.summaryOnly,
      maxPaths: args.maxPaths ?? null,
      resourceProfile: args.resourceProfile,
      resourceBaseline: SCENARIO4_RESOURCE_PROFILES[args.resourceProfile],
      note:
        "Reasons and player attribution slider values are held constant because they do not alter the primary end-state resolver.",
      deterministicTimestampSalt: {
        move1: FIXED_MOVE1_COMPLETED_AT,
        move2: FIXED_MOVE2_COMPLETED_AT,
      },
    },
    totalPaths: 0,
    endStates: makeCounter(),
    byIntent: Object.fromEntries(intents.map((x) => [x, makeCounter()])),
    byWorld: {},
    examples: Object.fromEntries(END_STATES.map((x) => [x, []])),
    hiddenWorlds: [],
  };
  const confidenceOverall = makeConfidenceAccumulator();
  const confidenceByIntent = Object.fromEntries(intents.map((intent) => [intent, makeConfidenceAccumulator()]));
  const confidenceByIncidentCause: Record<string, ConfidenceAccumulator> = {};
  const resourcePhaseAccumulators = Object.fromEntries(RESOURCE_PHASES.map((phase) => [phase, makeResourcePhaseAccumulator()])) as Record<ResourcePhase, ResourcePhaseAccumulator>;
  const resourceByEndState = Object.fromEntries(END_STATES.map((end) => [end, Object.fromEntries(RESOURCE_KEYS.map((key) => [key, makeNumberAccumulator()]))])) as Record<string, Record<ResourceKey, NumberAccumulator>>;
  const userSpentAccumulator = makeNumberAccumulator();
  const recoveredAccumulator = makeNumberAccumulator();
  const netConsumedAccumulator = makeNumberAccumulator();
  const blockedAttemptsByOption: Record<string, number> = {};
  const pathExamplesBySpend = new Map<number, Record<string, unknown>>();
  const recordBlocked = (optionId: string) => { blockedAttemptsByOption[optionId] = (blockedAttemptsByOption[optionId] ?? 0) + 1; };

  let gzip: ReturnType<typeof createGzip> | undefined;
  let resultFile: fs.WriteStream | undefined;

  if (!args.summaryOnly) {
    gzip = createGzip({ level: 9 });
    resultFile = fs.createWriteStream(path.join(args.outDir, "all-paths.csv.gz"));
    gzip.pipe(resultFile);
    gzip.write(columns.join(",") + "\n");
  }

  const startMs = Date.now();
  let stop = false;

  for (let world = 0; world < args.worlds && !stop; world += 1) {
    const worldSeed = `scenario4-exhaustive-world-${world}`;
    summary.byWorld[String(world)] = makeCounter();

    for (const intent of intents) {
      if (stop) break;

      /*
       * Important counterfactual property:
       * all player paths inside the same (world,intent) reuse the same base seed.
       * Thus hidden/random differences are not accidentally caused by the path id.
       */
      const rngSeed = `${worldSeed}:${intent}`;

      for (const information of M1_I) {
        if (stop) break;
        for (const protection of M1_P) {
          if (stop) break;
          for (const communication of M1_C) {
            if (stop) break;

            const m1Choices: MoveOneChoices = {
              information,
              protection,
              communication,
              reason: "",
            };

            const initial = createInitialScenarioOneState(intent);
            const profileBaseline = { ...SCENARIO4_RESOURCE_PROFILES[args.resourceProfile] };
            initial.resources = { ...profileBaseline };
            initial.resourceBaseline = { ...profileBaseline };
            initial.resourceAccounting = {
              userSpent: { ssaCapacity: 0, protectiveCapacity: 0, politicalCapital: 0, disclosureBudget: 0 },
              recovered: { ssaCapacity: 0, protectiveCapacity: 0, politicalCapital: 0, disclosureBudget: 0 },
            };
            let s1 = cloneState(initial);
            if (!canAffordResourceCosts(s1.resources, information)) { recordBlocked(information); continue; }
            s1 = applyBlueDecision(s1, "m1_information", information, rngSeed);
            if (!canAffordResourceCosts(s1.resources, protection)) { recordBlocked(protection); continue; }
            s1 = applyBlueDecision(s1, "m1_protection", protection, rngSeed);
            if (!canAffordResourceCosts(s1.resources, communication)) { recordBlocked(communication); continue; }
            s1 = applyBlueDecision(s1, "m1_communication", communication, rngSeed);

            const m1Result = adjudicateMoveOne({
              startedAt: FIXED_STARTED_AT,
              stateBefore: initial,
              stateAfterBlue: s1,
              decisions: [],
              evidenceSeen: [],
              choices: m1Choices,
              rngSeed,
            });
            // Production uses completedAt as salt for Move 2 incident seed.
            // Fix it here so exhaustive runs are reproducible.
            m1Result.snapshot.completedAt = FIXED_MOVE1_COMPLETED_AT;
            recordResourcePhase(resourcePhaseAccumulators.move1, m1Result.snapshot.stateAfter.resources);

            const rec1 = applyResourceRecovery(m1Result.snapshot.stateAfter, "m1_to_m2", {
              choices: m1Choices,
              redAction: m1Result.snapshot.redAction,
              allyAction: m1Result.snapshot.allyAction,
              commercialAction: m1Result.snapshot.commercialAction,
            });

            const move2Initial = initializeMove2Incident(
              rec1.state,
              `${rngSeed}:move2:${FIXED_MOVE1_COMPLETED_AT}`,
            );

            const hiddenWorldAlreadyLogged = summary.hiddenWorlds.some(
              (x) => x.world === world && x.intent === intent,
            );
            if (!hiddenWorldAlreadyLogged) {
              summary.hiddenWorlds.push({
                world,
                worldSeed,
                intent,
                incidentCause: move2Initial.hidden.move2IncidentCause,
                trueIncidentAttribution: move2Initial.hidden.trueIncidentAttribution,
              });
            }

            for (const investigation of M2_A) {
              if (stop) break;
              for (const mission of M2_M) {
                if (stop) break;
                for (const response of M2_R) {
                  if (stop) break;

                  const m2Choices: Move2Choices = {
                    investigation,
                    mission,
                    response,
                    reason: "",
                  };

                  let s2 = cloneState(move2Initial);
                  if (!canAffordResourceCosts(s2.resources, investigation)) { recordBlocked(investigation); continue; }
                  s2 = applyMove2Decision(s2, "m2_investigation", investigation, `${rngSeed}:move2`);
                  if (!canAffordResourceCosts(s2.resources, mission)) { recordBlocked(mission); continue; }
                  s2 = applyMove2Decision(s2, "m2_mission", mission, `${rngSeed}:move2`);
                  if (!canAffordResourceCosts(s2.resources, response)) { recordBlocked(response); continue; }
                  s2 = applyMove2Decision(s2, "m2_response", response, `${rngSeed}:move2`);

                  const m2Result = adjudicateMove2({
                    startedAt: FIXED_STARTED_AT,
                    stateBefore: move2Initial,
                    stateAfterBlue: s2,
                    attributionEstimatePre: 50,
                    attributionEstimatePost: 50,
                    decisions: [],
                    evidenceSeen: [],
                    choices: m2Choices,
                    rngSeed: `${rngSeed}:move2`,
                    previousMoveSnapshotRef: FIXED_MOVE1_COMPLETED_AT,
                  });
                  m2Result.snapshot.completedAt = FIXED_MOVE2_COMPLETED_AT;
                  recordResourcePhase(resourcePhaseAccumulators.move2, m2Result.snapshot.stateAfter.resources);

                  const rec2 = applyResourceRecovery(m2Result.snapshot.stateAfter, "m2_to_m3", {
                    choices: m2Choices,
                    redAction: m2Result.snapshot.redAction,
                    allyAction: m2Result.snapshot.allyAction,
                    commercialAction: m2Result.snapshot.commercialAction,
                  });

                  const move3Initial = initializeMove3Severity(
                    rec2.state,
                    m2Result.snapshot,
                    `${rngSeed}:move3`,
                  );

                  for (const threshold of M3_T) {
                    if (stop) break;

                    const s3Threshold = applyMove3Decision(
                      move3Initial,
                      "m3_threshold",
                      threshold,
                    );

                    for (const coa of M3_C) {
                      if (stop) break;

                      if (!canAffordResourceCosts(s3Threshold.resources, coa)) { recordBlocked(coa); continue; }

                      const s3Coa = applyMove3Decision(
                        s3Threshold,
                        "m3_coa",
                        coa,
                      );

                      const needsOffRamp =
                        s3Coa.flags.m2OffRampOfferedByRed ||
                        s3Coa.flags.m2OffRampOfferedByBlue ||
                        coa === "m3_coa_negotiated_deescalation";

                      for (const informationPolicy of M3_I) {
                        if (stop) break;

                        if (!canAffordResourceCosts(s3Coa.resources, informationPolicy)) { recordBlocked(informationPolicy); continue; }

                        const s3Info = applyMove3Decision(
                          s3Coa,
                          "m3_info",
                          informationPolicy,
                        );

                        const offRampValues: Array<string | undefined> =
                          needsOffRamp ? M3_O : [undefined];

                        for (const offRamp of offRampValues) {
                          let s3Final = cloneState(s3Info);
                          if (offRamp) {
                            if (!canAffordResourceCosts(s3Final.resources, offRamp)) { recordBlocked(offRamp); continue; }
                            s3Final = applyMove3Decision(
                              s3Final,
                              "m3_offramp",
                              offRamp,
                            );
                          }

                          const m3Choices: Move3Choices = {
                            threshold,
                            coa,
                            informationPolicy,
                            offRamp,
                            reason: "",
                          };

                          const sig = signature(
                            information,
                            protection,
                            communication,
                            investigation,
                            mission,
                            response,
                            threshold,
                            coa,
                            informationPolicy,
                            offRamp,
                          );

                          const finalResult = adjudicateMove3({
                            runId: `exhaustive:${world}:${intent}:${sig}`,
                            scenarioId: "4",
                            runSeed: rngSeed,
                            move1: m1Result.snapshot,
                            move2: m2Result.snapshot,
                            startedAt: FIXED_STARTED_AT,
                            stateBefore: m2Result.snapshot.stateAfter,
                            stateAfterBlue: s3Final,
                            playerAttributionEstimateFinal: 50,
                            choices: m3Choices,
                            decisions: [],
                            evidenceSeen: [],
                            rngSeed: `${rngSeed}:move3`,
                            includeNarrative: false,
                          });

                          const row = rowFromResult({
                            world,
                            worldSeed,
                            intent,
                            sig,
                            m1Choices,
                            m1: m1Result.snapshot,
                            move2State: move2Initial,
                            m2Choices,
                            m2: m2Result.snapshot,
                            m3Choices,
                            result: finalResult,
                          });

                          const end = row.end_state as FinalEndState;
                          const finalState = finalResult.finalSnapshot.finalState;
                          recordResourcePhase(resourcePhaseAccumulators.final, finalState.resources);
                          RESOURCE_KEYS.forEach((key) => recordNumber(resourceByEndState[end][key], finalState.resources[key]));
                          const userSpent = Object.values(finalState.resourceAccounting.userSpent).reduce((sum, value) => sum + value, 0);
                          const recovered = Object.values(finalState.resourceAccounting.recovered).reduce((sum, value) => sum + value, 0);
                          const netConsumed = RESOURCE_KEYS.reduce((sum, key) => sum + finalState.resourceBaseline[key] - finalState.resources[key], 0);
                          recordNumber(userSpentAccumulator, userSpent);
                          recordNumber(recoveredAccumulator, recovered);
                          recordNumber(netConsumedAccumulator, netConsumed);
                          if (!pathExamplesBySpend.has(userSpent)) pathExamplesBySpend.set(userSpent, {
                            signature: sig,
                            intent,
                            userSpent,
                            recovered,
                            finalResources: finalState.resources,
                            endState: end,
                          });
                          summary.totalPaths += 1;
                          summary.endStates[end] += 1;
                          summary.byIntent[intent][end] += 1;
                          summary.byWorld[String(world)][end] += 1;
                          const confidence = finalResult.finalSnapshot.finalState.knowledge.systemAttributionConfidence;
                          const incidentCause = String(row.incident_cause ?? "unknown");
                          confidenceByIncidentCause[incidentCause] ??= makeConfidenceAccumulator();
                          recordConfidence(confidenceOverall, confidence);
                          recordConfidence(confidenceByIntent[intent], confidence);
                          recordConfidence(confidenceByIncidentCause[incidentCause], confidence);

                          if (summary.examples[end].length < args.examplesPerEnd) {
                            summary.examples[end].push({
                              world,
                              intent,
                              signature: sig,
                              incidentCause: row.incident_cause,
                              trueIncidentAttribution: row.true_incident_attribution,
                              redFinalAction: row.m3_red_action,
                              mission: row.mission_continuity,
                              escalation: row.escalation_pressure,
                              coalition: row.coalition_cohesion,
                              informationQuality: row.metric_information_quality,
                              systemAttributionConfidence:
                                finalResult.finalSnapshot.finalState.knowledge.systemAttributionConfidence,
                            });
                          }

                          if (gzip) {
                            const line =
                              columns.map((c) => csv(row[c])).join(",") + "\n";
                            if (!gzip.write(line)) await once(gzip, "drain");
                          }

                          if (summary.totalPaths % 50_000 === 0) {
                            const sec = (Date.now() - startMs) / 1000;
                            const rate = Math.round(summary.totalPaths / Math.max(1, sec));
                            process.stdout.write(
                              `\rpaths=${summary.totalPaths.toLocaleString()} rate=${rate.toLocaleString()}/s`,
                            );
                          }

                          if (
                            args.maxPaths &&
                            summary.totalPaths >= args.maxPaths
                          ) {
                            stop = true;
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (gzip && resultFile) {
    gzip.end();
    await once(resultFile, "close");
  }

  const durationSec = (Date.now() - startMs) / 1000;
  summary.metadata.durationSeconds = durationSec;
  summary.metadata.pathsPerSecond = Math.round(
    summary.totalPaths / Math.max(1, durationSec),
  );
  summary.confidence = {
    overall: summarizeConfidence(confidenceOverall),
    byIntent: Object.fromEntries(Object.entries(confidenceByIntent).map(([key, value]) => [key, summarizeConfidence(value)])),
    byIncidentCause: Object.fromEntries(Object.entries(confidenceByIncidentCause).map(([key, value]) => [key, summarizeConfidence(value)])),
  };
  const spentSummary = summarizeNumber(userSpentAccumulator);
  summary.resources = {
    profile: args.resourceProfile,
    baseline: { ...SCENARIO4_RESOURCE_PROFILES[args.resourceProfile] },
    blockedAttemptsTotal: Object.values(blockedAttemptsByOption).reduce((sum, value) => sum + value, 0),
    blockedAttemptsByOption,
    phases: Object.fromEntries(RESOURCE_PHASES.map((phase) => [phase, summarizeResourcePhase(resourcePhaseAccumulators[phase])])) as ResourceAudit["phases"],
    byEndState: Object.fromEntries(END_STATES.map((end) => [end, Object.fromEntries(RESOURCE_KEYS.map((key) => [key, summarizeNumber(resourceByEndState[end][key])]))])) as ResourceAudit["byEndState"],
    pathCost: {
      userSpent: spentSummary,
      recovered: summarizeNumber(recoveredAccumulator),
      netConsumed: summarizeNumber(netConsumedAccumulator),
    },
    representativePaths: {
      low: spentSummary.min == null ? null : pathExamplesBySpend.get(spentSummary.min) ?? null,
      medium: spentSummary.p50 == null ? null : pathExamplesBySpend.get(spentSummary.p50) ?? null,
      high: spentSummary.max == null ? null : pathExamplesBySpend.get(spentSummary.max) ?? null,
    },
  };

  fs.writeFileSync(
    path.join(args.outDir, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  if (args.confidenceAudit) {
    fs.writeFileSync(
      path.join(args.outDir, "confidence-audit.json"),
      JSON.stringify(summary.confidence, null, 2),
      "utf8",
    );
  }

  const summaryCsv = [
    "end_state,end_state_fa,count,share",
    ...END_STATES.map((end) => {
      const count = summary.endStates[end] ?? 0;
      const share = summary.totalPaths ? count / summary.totalPaths : 0;
      return [
        end,
        csv(END_STATE_FA[end]),
        count,
        share.toFixed(8),
      ].join(",");
    }),
  ].join("\n");

  fs.writeFileSync(
    path.join(args.outDir, "end-state-summary.csv"),
    summaryCsv + "\n",
    "utf8",
  );

  const examplesRows = [
    [
      "end_state",
      "end_state_fa",
      "world",
      "intent",
      "signature",
      "incidentCause",
      "trueIncidentAttribution",
      "redFinalAction",
      "mission",
      "escalation",
      "coalition",
      "informationQuality",
      "systemAttributionConfidence",
    ].join(","),
  ];

  for (const end of END_STATES) {
    for (const ex of summary.examples[end]) {
      examplesRows.push(
        [
          end,
          csv(END_STATE_FA[end]),
          ex.world,
          ex.intent,
          ex.signature,
          ex.incidentCause,
          ex.trueIncidentAttribution,
          ex.redFinalAction,
          ex.mission,
          ex.escalation,
          ex.coalition,
          ex.informationQuality,
          ex.systemAttributionConfidence,
        ].map(csv).join(","),
      );
    }
  }

  fs.writeFileSync(
    path.join(args.outDir, "example-paths-by-end-state.csv"),
    examplesRows.join("\n") + "\n",
    "utf8",
  );

  const unreachable = END_STATES.filter((e) => (summary.endStates[e] ?? 0) === 0);

  console.log("\n\nDone.");
  console.log(`Output: ${args.outDir}`);
  console.log(`Total paths: ${summary.totalPaths.toLocaleString()}`);
  console.log(`Duration: ${durationSec.toFixed(1)}s`);
  console.log("");
  for (const end of END_STATES) {
    const count = summary.endStates[end] ?? 0;
    const pct = summary.totalPaths ? (count / summary.totalPaths) * 100 : 0;
    console.log(
      `${END_STATE_FA[end]}: ${count.toLocaleString()} (${pct.toFixed(3)}%)`,
    );
  }
  console.log("");
  if (args.confidenceAudit && summary.confidence) {
    const confidence = summary.confidence.overall;
    console.log("Confidence audit:");
    console.log(JSON.stringify({
      confidence_min: confidence.min,
      confidence_max: confidence.max,
      confidence_p05: confidence.p05,
      confidence_p25: confidence.p25,
      confidence_p50: confidence.p50,
      confidence_p75: confidence.p75,
      confidence_p95: confidence.p95,
      ...Object.fromEntries(Object.entries(confidence.thresholdCoverage).map(([key, value]) => [`share_${key}`, value.share])),
    }, null, 2));
    console.log("");
  }
  console.log(
    unreachable.length
      ? `UNREACHABLE IN THIS RUN: ${unreachable.map((x) => `${END_STATE_FA[x]} [${x}]`).join(", ")}`
      : "All 9 end states were reached in this run.",
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
