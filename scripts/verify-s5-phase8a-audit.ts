import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

let assertions = 0;
const check = (condition: unknown, message: string): void => { assert.ok(condition, message); assertions += 1; };
const equal = (actual: unknown, expected: unknown, message: string): void => { assert.deepEqual(actual, expected, message); assertions += 1; };
const ROOT = resolve(import.meta.dirname, "..");
const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");
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
const protectedHash = createHash("sha256");
for (const path of protectedPaths) { protectedHash.update(`${path}\0`); protectedHash.update(readFileSync(join(ROOT, path))); protectedHash.update("\0"); }
equal(protectedPaths.length, 68, "frozen manifest has 68 paths");
equal(protectedHash.digest("hex"), "1bd32af62f0667d3864eb7b2b0e7354e70bebe43178cdc8a64a880e8a138bef6", "frozen model/UI hash unchanged");

const originalPhase8Paths = [
  "docs/scenario5-phase8-calibration-verification.md", "docs/scenario5-phase8-calibration-report-fa.md",
  "docs/scenario5-phase8-summary.json", ...walk("docs/scenario5-phase8-results"),
].sort();
const originalRows = originalPhase8Paths.map((path) => {
  const bytes = readFileSync(join(ROOT, path));
  return `${path}\0${createHash("sha256").update(bytes).digest("hex")}\0${bytes.length}`;
});
equal(originalPhase8Paths.length, 14, "original Phase-8 archive has 14 artifacts");
equal(createHash("sha256").update(originalRows.join("\n")).digest("hex"), "a3df95fe09cb3ab1d2bc7e741ffbeb66dc70b6bd41720faec284fc38a19beaf6", "original Phase-8 artifacts unchanged");

const required = [
  "docs/scenario5-phase8a-diagnostic-report-fa.md", "docs/scenario5-phase8a-summary.json",
  "docs/scenario5-phase8a-results/mission-runs.csv", "docs/scenario5-phase8a-results/cognitive-runs.csv",
  "docs/scenario5-phase8a-results/explicit-action-target-probes.csv", "docs/scenario5-phase8a-results/end-state-reachability.csv",
  "docs/scenario5-phase8a-results/reachability-boundaries.csv", "docs/scenario5-phase8a-results/action-dominance-multicontinuation.csv",
  "docs/scenario5-phase8a-results/random-osi-centering.csv", "docs/scenario5-phase8a-results/structural-osi-centering.csv",
  "docs/scenario5-phase8a-results/cognitive-distributions.csv", "docs/scenario5-phase8a-results/shadow-time-sensitivity-extended.csv",
] as const;
for (const path of required) check(existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).size > 0, `artifact exists: ${path}`);

const parseCsv = (text: string): readonly Readonly<Record<string, string>>[] => {
  const records: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false; else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); records.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field.length || row.length) { row.push(field); records.push(row); }
  const [headers, ...data] = records.filter((entry) => entry.some((value) => value.length));
  if (!headers) return [];
  return data.map((entry) => Object.fromEntries(headers.map((header, index) => [header, entry[index] ?? ""])));
};

const mission = parseCsv(read("docs/scenario5-phase8a-results/mission-runs.csv"));
const cognitive = parseCsv(read("docs/scenario5-phase8a-results/cognitive-runs.csv"));
const probes = parseCsv(read("docs/scenario5-phase8a-results/explicit-action-target-probes.csv"));
const reachability = parseCsv(read("docs/scenario5-phase8a-results/end-state-reachability.csv"));
const boundaries = parseCsv(read("docs/scenario5-phase8a-results/reachability-boundaries.csv"));
const dominance = parseCsv(read("docs/scenario5-phase8a-results/action-dominance-multicontinuation.csv"));
const randomOsi = parseCsv(read("docs/scenario5-phase8a-results/random-osi-centering.csv"));
const structuralOsi = parseCsv(read("docs/scenario5-phase8a-results/structural-osi-centering.csv"));
const distributions = parseCsv(read("docs/scenario5-phase8a-results/cognitive-distributions.csv"));
const shadows = parseCsv(read("docs/scenario5-phase8a-results/shadow-time-sensitivity-extended.csv"));
const summaryText = read("docs/scenario5-phase8a-summary.json");
const summary = JSON.parse(summaryText) as Record<string, any>;

equal(summary.calibrationVersion, "s5-calibration-v1.1.0", "08A calibration version exact");
equal(summary.calibrationStatus, "engineering_audit_not_human_validated", "engineering-only status exact");
check(!/NaN|Infinity/.test(summaryText), "summary has no NaN/Infinity");
equal(mission.length, 25_600, "exact mission main row count");
equal(mission.filter((row) => row.policyId === "M10_uniform_random").length, 16_384, "exact M10 row count");
equal(mission.filter((row) => row.policyId !== "M10_uniform_random").length, 9_216, "exact deterministic mission row count");
equal(cognitive.length, 7_936, "exact cognitive row count");
equal(cognitive.filter((row) => row.policyId === "uniform_random_cognitive").length, 4_096, "exact C16 row count");
equal(cognitive.filter((row) => row.policyId !== "uniform_random_cognitive").length, 3_840, "exact deterministic cognitive row count");
check(mission.every((row) => row.completed === "true" && Number(row.finalIsr) >= 0 && Number(row.finalSupport) >= 0), "all mission runs complete with nonnegative resources");
check(mission.every((row) => Number(row.minimumAvailableActionCount) > 0), "zero 0-option mission windows");
check(mission.every((row) => Number(row.totalFinalDelayMinutes) === Number(row.totalActorDelayAddedMinutes) + Number(row.totalPlayerDelayAddedMinutes) - Number(row.totalPlayerDelayRecoveredMinutes)), "aggregate delay identity exact");

const m10Seeds = mission.filter((row) => row.policyId === "M10_uniform_random").map((row) => Number(row.effectivePolicySeed));
const c16Seeds = cognitive.filter((row) => row.policyId === "uniform_random_cognitive").map((row) => Number(row.effectivePolicySeed));
equal(new Set(m10Seeds).size, 16_384, "M10 effective seeds unique");
equal(new Set(c16Seeds).size, 4_096, "C16 effective seeds unique");
check(mission.filter((row) => row.policyId === "M10_uniform_random").every((row) => Number(row.basePolicySeed) >= 1001 && Number(row.basePolicySeed) <= 1016), "M10 base seeds preserved");
check(cognitive.filter((row) => row.policyId === "uniform_random_cognitive").every((row) => Number(row.basePolicySeed) >= 2001 && Number(row.basePolicySeed) <= 2016), "C16 base seeds preserved");

equal(summary.explicitTargetCoverage.observedActionCount, 33, "all 33 actions main-audit observed");
equal(probes.length, 64, "explicit table covers 16 required actions × four corridors");
check(probes.every((row) => ["observed_in_main_audit", "verified_by_explicit_legal_probe", "not_observed_as_legal", "probe_failed"].includes(row.classification)), "probe classifications exact");
check(probes.every((row) => row.classification !== "probe_failed"), "zero failed legal probes");
const originalGap = probes.find((row) => row.actionId === "a2_focused_pnt" && row.corridorId === "corridor_delta_west");
check(originalGap !== undefined
  && ["observed_in_main_audit", "verified_by_explicit_legal_probe"].includes(originalGap.classification)
  && originalGap.probeStateFound === "true" && originalGap.actionAvailable === "true"
  && originalGap.targetActive === "true" && originalGap.commitSucceeded === "true"
  && originalGap.structuralTickAdvanced === "true", "original a2_focused_pnt:delta gap explicitly probed and verified");

check(structuralOsi.length > 0, "structural OSI rows present");
check(structuralOsi.filter((row) => row.diagnostic === "true").every((row) => Math.abs(Number(row.meanAdjustedOrientation)) <= 1e-12 && row.pass === "true"), "every diagnostic structural OSI set centered to 1e-12");
equal(summary.structuralOsiCentering.pass, true, "structural centering summary passes");
const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;
const rounded = (value: number): number => Number(value.toFixed(6));
const randomCognitive = cognitive.filter((row) => row.policyId === "uniform_random_cognitive");
for (const [column, scope] of [["overallOSI", "overall"], ["phaseAOSI", "phaseA"], ["phaseBOSI", "phaseB"], ["phaseCOSI", "phaseC"], ["phaseDOSI", "phaseD"]] as const) {
  const expected = rounded(mean(randomCognitive.map((row) => Number(row[column]))));
  equal(Number(randomOsi.find((row) => row.scope === scope)?.mean), expected, `C16 ${scope} mean independently recomputed`);
  check(Math.abs(expected) <= .05, `C16 ${scope} corrected mean within ±0.05`);
}

equal(summary.dominanceStateCoverage.length, 8, "all eight decision windows have dominance coverage");
check(summary.dominanceStateCoverage.every((row: Record<string, unknown>) => Number(row.uniqueStateCount) >= 64), "every dominance window has at least 64 unique states");
equal(new Set(dominance.map((row) => row.continuationId)), new Set(["balanced_network", "information_heavy", "mobility_resilience", "low_response_reversible"]), "K1..K4 all represented");
for (const actionId of ["a1_preserve_reserve", "b1_pulse_network", "c1_preserve_mobile_reserve"]) equal(dominance.filter((row) => row.actionId === actionId).length, 4, `${actionId} has four explicit V2 continuation rows`);
const maximize = summary.paretoOutcomeVector.maximize as string[];
const minimize = summary.paretoOutcomeVector.minimize as string[];
check(maximize.includes("operationalAttributionResolved") && maximize.includes("truePrimaryCorridorCorroborated"), "corrected vector includes attribution and corroboration");
check(minimize.includes("meanFinalPntExposure") && minimize.includes("maxFinalPntExposure"), "corrected vector includes PNT exposure dimensions");
equal(maximize.length + minimize.length, 16, "corrected Pareto vector has 16 dimensions");
const counterfactualSource = read("src/ui/components/scenario/scenario-five/calibration/counterfactualAudit.ts");
check(!/weightedScore|outcomeScore|scalarScore/.test(counterfactualSource), "no scalar outcome score exists");

equal(reachability.length, 6, "all six end states classified under V2");
equal(summary.structuredSearchRunCounts.beamLimit, 2500, "beam limit exact");
check(Number(summary.structuredSearchRunCounts.maximumBeamWidth) <= 2500, "observed beam never exceeds 2500");
equal(summary.structuredSearchRunCounts.randomPruning, false, "no random pruning");
equal(summary.structuredSearchRunCounts.representativeEnvironmentCount, 48, "three representative latency environments for each world");
equal(summary.structuredSearchRunCounts.searchesExecuted, 48, "exact structured environment-search count");
equal(summary.structuredSearchRunCounts.branchesApplied, 4_966_163, "structured branch count exact");
check(Number(summary.structuredSearchRunCounts.uniqueStatesGenerated) > 0, "structured unique-state count recorded");
const structuredSource = read("src/ui/components/scenario/scenario-five/calibration/structuredReachability.ts");
for (const symbol of ["createInitialMissionState", "getAvailableMissionActions", "applyMissionDecision", "resolveMissionEndState"]) check(structuredSource.includes(symbol), `structured search uses mission-engine ${symbol}`);
check(!structuredSource.includes(["Math", "random"].join(".")) && !/createPolicyRng|PolicyRng/.test(structuredSource), "structured search has no random pruning path");
equal(summary.structuredSearchRunCounts.missionEventsMechanicsAudit, "missionEvents history is read only for event IDs/causal provenance; future transition physics does not inspect historical payloads", "mission-event static audit recorded");
equal(boundaries.map((row) => row.boundaryId), ["A", "B_projected_arrival", "B_delay", "C"], "boundary A/B/C rows exact");
check(boundaries.every((row) => row.value !== "" && row.trace !== ""), "every boundary has value and witness trace");
equal(summary.structuredSearchRunCounts.randomPruning, false, "bounded search is deterministic");

equal(shadows.map((row) => Number(row.horizon)), [270, 285, 300, 315, 330, 345, 360, 375, 390], "extended horizons exact");
equal(distributions.length, 14, "all cognitive distribution screens recomputed");
check(summary.resourceAvailabilitySummary.minimumAvailableActionCountDistribution.length > 0, "minimum option-count distribution reported");
for (const key of ["p05", "p25", "median", "p75", "p95"]) {
  check(typeof summary.resourceAvailabilitySummary.finalIsr[key] === "number", `final ISR ${key} present`);
  check(typeof summary.resourceAvailabilitySummary.finalSupport[key] === "number", `final support ${key} present`);
}

equal(summary.originalPhase8FindingsPreserved, { overallStatus: "FAIL", originalHardGateFailures: 4, cognitiveLowVarianceWarnings: 3 }, "original Phase-8 findings preserved exactly");
equal(summary.originalPhase8FailureDisposition.ACTION_TARGET_COVERAGE, "audit_sampling_issue", "coverage disposition evidence-derived");
equal(summary.originalPhase8FailureDisposition.SIX_END_STATES_OBSERVED, "model_or_taxonomy_issue_confirmed", "end-state disposition evidence-derived");
equal(summary.originalPhase8FailureDisposition.NO_UNIVERSAL_ACTION_DOMINANCE, "original_audit_incomplete", "dominance disposition evidence-derived");
equal(summary.originalPhase8FailureDisposition.RANDOM_OSI_CENTERING, "random_sampling_issue", "OSI disposition evidence-derived");

const calibrationPaths = walk("src/ui/components/scenario/scenario-five/calibration");
const calibrationSource = calibrationPaths.map(read).join("\n");
check(!calibrationSource.includes(["Math", "random"].join(".")), "calibration source contains no nondeterministic built-in RNG");
check(!/from\s+["']react["']|import\s+["']react["']/.test(calibrationSource), "calibration source imports no React");
equal(calibrationPaths.length, 13, "13 calibration source modules present after 08A");
const expectedOverall = summary.hardGates.every((gate: Record<string, unknown>) => gate.status === "PASS") ? "PASS" : "FAIL";
equal(summary.overallStatus, expectedOverall, "overall status matches corrected hard gates");
equal(summary.overallStatus, "FAIL", "persistent corrected failure preserved");

const report = read("docs/scenario5-phase8a-diagnostic-report-fa.md");
for (const concept of [
  "Phase 8A مدل سناریو را تغییر نداده است.",
  "پاس شدن یک coverage probe به معنی فراوانی طبیعی آن انتخاب نیست.",
  "Structural centering ویژگی فرمول را می‌سنجد؛ Monte Carlo رفتار نمونه‌گیری مصنوعی را.",
  "Structured search اثبات ریاضی reachability یا unreachability نیست.",
  "نتایج synthetic agent اعتبار انسانی یا روان‌سنجی ایجاد نمی‌کنند.",
  "360 minutes remains a design parameter pending reviewer/expert decision.",
]) check(report.includes(concept), `diagnostic report contains required concept: ${concept}`);

console.log(`Scenario 5 Phase 08A audit verifier passed: ${assertions} assertions.`);
