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
  "src/services/analytics/eventLogger.ts",
  "src/App.tsx",
  "src/App.css",
  "src/ui/components/scenario/MiniGameHost.tsx",
  ...walk("src/scenarios").filter((path) => /\.tsx?$/.test(path)),
  "package.json",
].sort();
const protectedHash = createHash("sha256");
for (const path of protectedPaths) {
  protectedHash.update(`${path}\0`);
  protectedHash.update(readFileSync(join(ROOT, path)));
  protectedHash.update("\0");
}
equal(protectedPaths.length, 68, "protected manifest contains exactly 68 frozen files");
equal(protectedHash.digest("hex"), "1bd32af62f0667d3864eb7b2b0e7354e70bebe43178cdc8a64a880e8a138bef6", "protected manifest hash matches pre-Phase-8 baseline");

const requiredArtifacts = [
  "docs/scenario5-phase8-calibration-report-fa.md",
  "docs/scenario5-phase8-summary.json",
  "docs/scenario5-phase8-results/mission-runs.csv",
  "docs/scenario5-phase8-results/cognitive-runs.csv",
  "docs/scenario5-phase8-results/end-state-coverage.csv",
  "docs/scenario5-phase8-results/actor-signatures.csv",
  "docs/scenario5-phase8-results/seed-sensitivity.csv",
  "docs/scenario5-phase8-results/action-coverage.csv",
  "docs/scenario5-phase8-results/action-dominance.csv",
  "docs/scenario5-phase8-results/cognitive-distributions.csv",
  "docs/scenario5-phase8-results/shadow-time-sensitivity.csv",
  "docs/scenario5-phase8-results/shadow-deadline-sensitivity.csv",
  "docs/scenario5-phase8-results/shadow-resource-feasibility.csv",
] as const;
for (const path of requiredArtifacts) check(existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).size > 0, `artifact exists and is non-empty: ${path}`);

const parseCsv = (text: string): readonly Readonly<Record<string, string>>[] => {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); records.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); records.push(row); }
  const [headers, ...data] = records.filter((entry) => entry.some((value) => value.length > 0));
  if (!headers) return [];
  return data.map((entry) => Object.fromEntries(headers.map((header, index) => [header, entry[index] ?? ""])));
};
const mission = parseCsv(read("docs/scenario5-phase8-results/mission-runs.csv"));
const cognitive = parseCsv(read("docs/scenario5-phase8-results/cognitive-runs.csv"));
const actionCoverage = parseCsv(read("docs/scenario5-phase8-results/action-coverage.csv"));
const endStates = parseCsv(read("docs/scenario5-phase8-results/end-state-coverage.csv"));
const actorSignatures = parseCsv(read("docs/scenario5-phase8-results/actor-signatures.csv"));
const seedSensitivity = parseCsv(read("docs/scenario5-phase8-results/seed-sensitivity.csv"));
const dominance = parseCsv(read("docs/scenario5-phase8-results/action-dominance.csv"));
const distributions = parseCsv(read("docs/scenario5-phase8-results/cognitive-distributions.csv"));
const shadowTime = parseCsv(read("docs/scenario5-phase8-results/shadow-time-sensitivity.csv"));
const shadowDeadline = parseCsv(read("docs/scenario5-phase8-results/shadow-deadline-sensitivity.csv"));
const shadowResources = parseCsv(read("docs/scenario5-phase8-results/shadow-resource-feasibility.csv"));
const summaryText = read("docs/scenario5-phase8-summary.json");
const summary = JSON.parse(summaryText) as Record<string, any>;

equal(summary.calibrationVersion, "s5-calibration-v1.0.0", "calibration version exact");
equal(summary.modelVersions.calibrationStatus, "engineering_audit_not_human_validated", "calibration status exact");
check(!/NaN|Infinity/.test(summaryText), "summary JSON contains no NaN or Infinity");
equal(mission.length, 25_600, "exactly 25,600 scheduled mission rows");
equal(mission.filter((row) => row.policyId === "M10_uniform_random").length, 16_384, "exactly 16,384 random mission rows");
equal(mission.filter((row) => row.policyId !== "M10_uniform_random").length, 9_216, "exactly 9,216 deterministic mission rows");
for (const policyId of ["balanced_network", "priority_alpha", "information_heavy", "mobility_resilience", "resource_preserver", "high_response", "low_response_reversible", "oracle_primary_ceiling", "wrong_corridor_stress"])
  equal(mission.filter((row) => row.policyId === policyId).length, 1_024, `${policyId} has exactly 1,024 rows`);
check(mission.every((row) => row.completed === "true"), "all mission runs completed");
check(mission.every((row) => Number(row.finalIsr) >= 0 && Number(row.finalSupport) >= 0), "all mission rows retain nonnegative resources");
check(mission.every((row) => Number(row.minimumAvailableActionCount) > 0), "all mission rows have zero 0-option windows");
check(mission.every((row) => Number(row.totalFinalDelayMinutes) === Number(row.totalActorDelayAddedMinutes) + Number(row.totalPlayerDelayAddedMinutes) - Number(row.totalPlayerDelayRecoveredMinutes)), "all mission rows satisfy aggregate delay identity");
check(mission.every((row) => Number(row.worldClockBeforeFinalization) <= 360), "all mission decision clocks are <=360");

equal(Object.keys(summary.environmentCoverage.worldCounts).length, 16, "environment panel has 16 worlds");
check(Object.values(summary.environmentCoverage.worldCounts).every((count) => count === 64), "each world has 64 environment seeds");
equal(Object.keys(summary.environmentCoverage.actorCounts).length, 4, "environment panel has four actors");
check(Object.values(summary.environmentCoverage.actorCounts).every((count) => count === 256), "each actor has 256 environment instances");
equal(Object.keys(summary.environmentCoverage.primaryCorridorCounts).length, 4, "environment panel has four primary corridors");
check(Object.values(summary.environmentCoverage.primaryCorridorCounts).every((count) => count === 256), "each primary corridor has 256 environment instances");
equal(summary.environmentCoverage.latencyVariants, ["early", "late", "nominal"], "all latency variants observed");
equal(summary.environmentCoverage.missingNoiseRelations, [], "all legal background-noise relations observed");

equal(actionCoverage.length, 33, "action coverage has all 33 action IDs");
check(actionCoverage.every((row) => Number(row.selectionCount) > 0), "all 33 actions were selected");
check(actionCoverage.every((row) => [row.alphaLegality, row.betaLegality, row.gammaLegality, row.deltaLegality].every((status) => ["observed", "not_observed_as_legal", "not_applicable", "legal_but_not_selected"].includes(status))), "every action-target status has a valid audit classification");
equal(summary.actionCoverage.observedActionCount, 33, "summary action count matches action CSV");
equal(endStates.length, 6, "six end-state classifications are present");
check(endStates.every((row) => ["observed_in_main_audit", "observed_in_witness_search", "not_observed_under_phase8_search"].includes(row.classification)), "every end state has a valid Phase-8 classification");
equal(summary.runCounts.witnessSearchRuns, 20_000, "witness search respected exact reported count");

equal(actorSignatures.length, 4, "four actor signatures are present");
equal(summary.actorPairResults.length, 6, "six actor pairs evaluated");
check(summary.actorPairResults.every((row: Record<string, unknown>) => typeof row.distinguishable === "boolean"), "every actor pair has a gate result");
equal(seedSensitivity.length, 112, "seed sensitivity has 16 worlds × 7 policies");
check(seedSensitivity.every((row) => Number(row.modalEndStateShare) >= 0 && Number(row.modalEndStateShare) <= 1), "seed sensitivity shares are bounded");
check(dominance.length > 0 && dominance.every((row) => Number(row.evaluatedStateCount) > 0), "Pareto audit reports evaluated contexts");
equal(summary.runCounts.counterfactualBranches, 2_590, "counterfactual branch count exact");

equal(cognitive.length, 7_936, "exactly 7,936 cognitive rows");
equal(cognitive.filter((row) => row.policyId === "uniform_random_cognitive").length, 4_096, "exactly 4,096 random cognitive rows");
equal(new Set(cognitive.map((row) => row.policyId)).size, 16, "all 16 cognitive policies present");
const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;
const rounded = (value: number): number => Number(value.toFixed(6));
const randomRows = cognitive.filter((row) => row.policyId === "uniform_random_cognitive");
for (const [column, summaryKey] of [["overallOSI", "overall"], ["phaseAOSI", "phaseA"], ["phaseBOSI", "phaseB"], ["phaseCOSI", "phaseC"], ["phaseDOSI", "phaseD"]] as const) {
  const values = randomRows.map((row) => Number(row[column]));
  equal(rounded(mean(values)), summary.randomOsiSummary[summaryKey].mean, `random OSI mean exact for ${column}`);
  equal(summary.randomOsiSummary[summaryKey].n, 4_096, `random OSI n exact for ${column}`);
}
equal(summary.cognitiveAnchorSummary.length, 12, "all 12 cognitive anchor checks computed");
check(summary.cognitiveAnchorSummary.every((row: Record<string, unknown>) => typeof row.pass === "boolean"), "every cognitive anchor has a boolean result");
equal(distributions.length, 14, "distribution screen covers 14 required metrics");
check(distributions.every((row) => ["0..100", "-1..1"].includes(row.scale) && Number(row.n) >= 0), "distribution rows have valid scales and counts");
equal(summary.runCounts.cognitiveFirewallPairs, 100, "at least 100 paired firewall cases recorded");

equal(shadowTime.map((row) => Number(row.horizon)), [330, 345, 360, 375, 390], "shadow horizon set exact");
equal(shadowDeadline.map((row) => Number(row.deadlineShift)), [-30, -15, 0, 15, 30], "shadow deadline shift set exact");
equal(shadowResources.map((row) => Number(row.budget)), [80, 90, 100, 110, 120], "shadow resource budget set exact");
check(shadowResources.every((row) => row.analysisLabel === "path-feasibility shadow analysis, not a full counterfactual replay"), "resource shadow label exact");

equal(summary.warnings.length, 6, "all six warning screeners calculated");
check(summary.warnings.every((row: Record<string, unknown>) => row.status === "PASS" || row.status === "WARNING"), "warning screeners do not masquerade as hard failures");
const expectedOverall = summary.hardGates.every((gate: Record<string, unknown>) => gate.status === "PASS") ? "PASS" : "FAIL";
equal(summary.overallStatus, expectedOverall, "overall status is derived only from hard gates");
check(summary.hardGates.some((gate: Record<string, unknown>) => gate.status === "FAIL"), "failing evidence is preserved rather than tuned away");

const calibrationSourcePaths = walk("src/ui/components/scenario/scenario-five/calibration");
const calibrationSource = calibrationSourcePaths.map(read).join("\n");
check(!calibrationSource.includes(["Math", "random"].join(".")), "calibration source uses no nondeterministic built-in RNG");
check(!/from\s+["']react["']|import\s+["']react["']/.test(calibrationSource), "calibration source imports no React");
equal(calibrationSourcePaths.length, 11, "all 11 required calibration source files present");

const report = read("docs/scenario5-phase8-calibration-report-fa.md");
for (const exact of [
  "فراوانی جهان‌ها و seedها احتمال واقعی رخدادهای بیرونی نیست.",
  "عامل‌های مصنوعی این فاز نماینده رفتار انسان نیستند.",
  "موفقیت در calibration مهندسی به معنی اعتبار روان‌سنجی نیست.",
  "پارامترهای زمان، هزینه، threshold و loadingها هنوز برای اعتبار نهایی به بازبینی خبرگان و اجرای انسانی نیاز دارند.",
  "Phase 8 هیچ پارامتر مدل را به‌صورت خودکار تغییر نمی‌دهد.",
]) check(report.includes(exact), `Persian report contains exact limitation: ${exact}`);

console.log(`Scenario 5 Phase 8 calibration verifier passed: ${assertions} assertions.`);
