import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
let assertions = 0;
const assert = (condition: unknown, message: string): void => {
  assertions += 1;
  if (!condition) throw new Error(`Phase 08B verification failed: ${message}`);
};
const text = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const walk = (directory: string): string[] => readdirSync(join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
  const child = join(directory, entry.name).replaceAll("\\", "/");
  return entry.isDirectory() ? walk(child) : [child];
});
const sha256 = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");
const aggregateHash = (paths: readonly string[], windowsLabels = false): string => sha256([...paths].sort().map((path) => {
  const label = windowsLabels ? path.replaceAll("/", "\\") : path;
  return `${label}\t${sha256(readFileSync(join(ROOT, path)))}`;
}).join("\n"));
const parseCsv = (input: string): string[][] => {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]!;
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
};

const requiredArtifacts = [
  "scripts/run-s5-phase8b-calibration.ts",
  "scripts/verify-s5-phase8b-calibration.ts",
  "docs/scenario5-phase8b-engineering-verification.md",
  "docs/scenario5-phase8b-report-fa.md",
  "docs/scenario5-phase8b-summary.json",
  "docs/scenario5-phase8b.patch",
  "docs/scenario5-phase8b-results/mission-runs.csv",
  "docs/scenario5-phase8b-results/cognitive-runs.csv",
  "docs/scenario5-phase8b-results/end-state-distribution.csv",
  "docs/scenario5-phase8b-results/end-state-witnesses.csv",
  "docs/scenario5-phase8b-results/trajectory-parity.csv",
  "docs/scenario5-phase8b-results/shadow-time-sensitivity.csv",
  "docs/scenario5-phase8b-results/cognitive-distributions.csv",
];
for (const path of requiredArtifacts) assert(existsSync(join(ROOT, path)), `missing artifact ${path}`);

const patchPath = join(ROOT, "docs", "scenario5-phase8b.patch");
const patchText = readFileSync(patchPath, "utf8");
const patchPaths = [...patchText.matchAll(/^diff --git a\/(.+?) b\//gm)].map((match) => match[1]!).sort();
const expectedPatchPaths = [
  "docs/scenario5-phase8b-engineering-verification.md", "docs/scenario5-phase8b-report-fa.md",
  "docs/scenario5-phase8b-summary.json", "scripts/run-s5-phase8b-calibration.ts",
  "scripts/verify-s5-phase4-mission.ts", "scripts/verify-s5-phase6-runtime.ts", "scripts/verify-s5-phase7-ui.ts",
  "scripts/verify-s5-phase8b-calibration.ts", "src/ui/components/scenario/ScenarioFiveSummary.tsx",
  "src/ui/components/scenario/scenario-five/calibration/auditMetrics.ts",
  "src/ui/components/scenario/scenario-five/calibration/structuredReachability.ts",
  "src/ui/components/scenario/scenario-five/calibration/versions.ts",
  "src/ui/components/scenario/scenario-five/model/mission/config.ts",
  "src/ui/components/scenario/scenario-five/model/mission/endStateResolver.ts",
  "src/ui/components/scenario/scenario-five/model/mission/types.ts",
  "src/ui/components/scenario/scenario-five/ui/uiContentFa.ts",
].sort();
assert(JSON.stringify(patchPaths) === JSON.stringify(expectedPatchPaths), "exact allowed patch manifest");
assert(!patchPaths.some((path) => path.includes("phase8-results/") || path.includes("phase8a-results/") || path.includes("phase7c-screenshots/") || path.includes("phase7d-screenshots/")), "archives excluded from patch");
assert(!patchPaths.some((path) => ["ScenarioFiveSimulation.tsx", "ScenarioFiveMap.tsx", "ScenarioFiveActionCard.tsx", "ScenarioFiveResourcePanel.tsx", "ScenarioFive.css"].some((name) => path.endsWith(name))), "frozen live UI excluded from patch");
assert(execFileSync("git", ["apply", "--stat", patchPath], { cwd: ROOT, encoding: "utf8" }).includes("16 files changed"), "git apply --stat");
execFileSync("git", ["apply", "--check", "--whitespace=error-all", "--reverse", patchPath], { cwd: ROOT, encoding: "utf8" });
assert(true, "patch warning scan and reverse apply check");

const summary = JSON.parse(text("docs/scenario5-phase8b-summary.json")) as Record<string, any>;
assert(summary.missionModelVersion === "s5-mission-v1.1.0", "mission version");
assert(summary.calibrationVersion === "s5-calibration-v1.2.0", "calibration version");
assert(summary.cognitiveModelVersion === "s5-cognitive-v3-adapter-v1.0.0", "cognitive version frozen");
assert(summary.runtimeModelVersion === "s5-runtime-v1.0.1", "runtime version frozen");
assert(summary.domainMetricsVersion === "s5-domain-metrics-v1.0.0", "domain version frozen");
assert(summary.runCounts.missionMainRuns === 25600, "mission run count");
assert(summary.runCounts.cognitiveRuns === 7936, "cognitive run count");
assert(summary.runCounts.randomMissionRuns === 16384, "random mission run count");
assert(summary.runCounts.randomCognitiveRuns === 4096, "random cognitive run count");
assert(summary.trajectoryParity.comparedRows === 25600, "trajectory row count");
assert(summary.trajectoryParity.fieldsPerRow === 22, "trajectory field count");
assert(summary.trajectoryParity.mismatchCount === 0, "trajectory parity mismatch count");

const expectedIds = [
  "critical_cargo_lost_or_compromised", "priority_delivered_network_degradation",
  "mission_incomplete_continuity_preserved", "delivery_complete_threat_persistent",
  "delivery_complete_attribution_unresolved", "delivery_complete_threat_contained",
];
const retiredIds = [
  "priority_delivered_network_failure", "delayed_delivery_persistent_disruption",
  "resilient_delivery_unresolved_attribution", "resilient_delivery_threat_contained",
];
assert(JSON.stringify(summary.taxonomyMigration.exactNewIds) === JSON.stringify(expectedIds), "exact new ID list");
assert(summary.taxonomyMigration.retiredIdsInActiveMissionSource.length === 0, "retired IDs absent from active mission source");
const expectedCounts: Record<string, number> = {
  critical_cargo_lost_or_compromised: 24,
  priority_delivered_network_degradation: 3520,
  mission_incomplete_continuity_preserved: 0,
  delivery_complete_threat_persistent: 13069,
  delivery_complete_attribution_unresolved: 8956,
  delivery_complete_threat_contained: 31,
};
for (const id of expectedIds) assert(summary.expectedReclassificationCounts[id] === expectedCounts[id], `expected count ${id}`);
assert(Object.values(expectedCounts).reduce((sum, count) => sum + count, 0) === 25600, "end-state count total");
assert(summary.sixEndStateCoverage.length === 6 && summary.sixEndStateCoverage.every((row: any) => row.witness !== "none"), "six-state coverage V3");
assert(summary.endStateWitnesses.some((row: any) => row.source === "approved_fixed_witness" && row.endStateId === "mission_incomplete_continuity_preserved"), "fixed incomplete witness");
assert(summary.endStateWitnesses.some((row: any) => row.source === "natural_degradation_gate" && row.alphaDelivered === true && row.networkContinuityPercent === 75), "natural degradation witness");
assert(summary.primaryDeliverySaturation.population === "M1..M7 + M10; non-oracle/non-stress", "saturation population");
assert(summary.shadowHorizon.map((row: any) => row.horizon).join("|") === "270|285|300|315|330|345|360|375|390", "shadow horizons");
assert(summary.effectivePolicySeedUniqueness.m10.actual === 16384, "M10 unique seeds");
assert(summary.effectivePolicySeedUniqueness.c16.actual === 4096, "C16 unique seeds");
assert(summary.hardGates.length === 25, "exact hard-gate count");
for (const gate of summary.hardGates) assert(gate.status === "PASS", `hard gate ${gate.gateId}`);
assert(summary.overallStatus === "PASS", "overall engineering calibration");
assert(!/NaN|Infinity/.test(text("docs/scenario5-phase8b-summary.json")), "finite summary JSON");

const missionCsv = parseCsv(text("docs/scenario5-phase8b-results/mission-runs.csv"));
const cognitiveCsv = parseCsv(text("docs/scenario5-phase8b-results/cognitive-runs.csv"));
const parityCsv = parseCsv(text("docs/scenario5-phase8b-results/trajectory-parity.csv"));
const distributionCsv = parseCsv(text("docs/scenario5-phase8b-results/end-state-distribution.csv"));
const witnessesCsv = parseCsv(text("docs/scenario5-phase8b-results/end-state-witnesses.csv"));
assert(missionCsv.length - 1 === 25600, "mission CSV row count");
assert(cognitiveCsv.length - 1 === 7936, "cognitive CSV row count");
assert(parityCsv.length - 1 === 25600, "trajectory parity CSV row count");
const parityHeaders = parityCsv[0]!; const mismatchIndex = parityHeaders.indexOf("mismatchCount");
assert(mismatchIndex >= 0 && parityCsv.slice(1).every((row) => row[mismatchIndex] === "0"), "trajectory parity CSV zero mismatches");
assert(distributionCsv.length - 1 === 6, "distribution CSV six rows");
assert(witnessesCsv.length - 1 >= 7, "witness CSV includes six states and natural witness");

const missionDir = "src/ui/components/scenario/scenario-five/model/mission";
const activeMissionSource = walk(missionDir).filter((path) => path.endsWith(".ts")).map(text).join("\n");
for (const id of expectedIds) assert(activeMissionSource.includes(id), `active mission includes ${id}`);
for (const id of retiredIds) assert(!activeMissionSource.includes(id), `active mission excludes ${id}`);
const resolver = text(`${missionDir}/endStateResolver.ts`);
const resolverPositions = expectedIds.map((id) => resolver.indexOf(`endStateId: "${id}"`));
assert(resolverPositions.every((position, index) => position >= 0 && (index === 0 || position > resolverPositions[index - 1]!)), "resolver precedence order");
assert(resolver.includes("alpha.integrity < 55"), "critical integrity threshold");
assert(resolver.includes("!alphaDelivered && networkContinuityPercent < 75"), "critical continuity threshold");
assert(resolver.includes("alphaDelivered && networkContinuityPercent < 100"), "degradation threshold");
assert(resolver.includes("networkContinuityPercent >= 75"), "incomplete continuity threshold");
assert((resolver.match(/networkContinuityPercent === 100/g)?.length ?? 0) === 3, "full-continuity branches");
assert(text(`${missionDir}/config.ts`).includes('MISSION_MODEL_VERSION = "s5-mission-v1.1.0"'), "mission source version");
assert(text("src/ui/components/scenario/scenario-five/calibration/versions.ts").includes('S5_CALIBRATION_VERSION = "s5-calibration-v1.2.0"'), "calibration source version");

const uiContent = text("src/ui/components/scenario/scenario-five/ui/uiContentFa.ts");
const labels = [
  "از دست رفتن یا آسیب جدی محموله حیاتی",
  "تحویل محموله اولویت‌دار با افت تداوم عملیاتی شبکه",
  "تداوم شبکه حفظ شد، اما تحویل اولویت‌دار تکمیل نشد",
  "تحویل و تداوم شبکه کامل؛ تهدید مهار نشد",
  "تحویل و تداوم شبکه کامل؛ منشأ اختلال حل‌نشده",
  "تحویل و تداوم شبکه کامل؛ تهدید مهار شد",
];
for (const label of labels) assert(uiContent.includes(label), `exact Persian label: ${label}`);
const continuityNote = "تداوم عملیاتی شبکه، سهم کاروان‌هایی است که با یکپارچگی حداقل ۶۰ و تا مهلت عملیاتی خود به مقصد رسیده‌اند.";
assert(text("src/ui/components/scenario/ScenarioFiveSummary.tsx").includes(continuityNote), "exact AAR continuity note");

const report = text("docs/scenario5-phase8b-report-fa.md");
const reportHeadings = [
  "1. خلاصه اجرایی", "2. علت تغییر taxonomy", "3. چرا «شکست شبکه» به «افت تداوم عملیاتی» تغییر کرد",
  "4. تعریف دقیق شش End State جدید", "5. عدم تغییر mechanics", "6. trajectory parity با Phase 8A",
  "7. توزیع جدید End Stateها", "8. witness طبیعی network degradation", "9. witness حالت mission incomplete",
  "10. وضعیت 360 دقیقه و primary-delivery saturation", "11. وضعیت Actor / Pareto / seed / resources",
  "12. وضعیت Cognitive calibration", "13. Warningهای باقی‌مانده", "14. محدودیت‌ها", "15. وضعیت نهایی engineering calibration",
];
for (const heading of reportHeadings) assert(report.includes(`## ${heading}`), `report heading ${heading}`);
assert(report.includes("آستانه افت تداوم عملیاتی در این فاز یک تصمیم طراحی داخلی مبتنی بر تعریف خود شاخص network continuity و نتایج calibration است، نه یک آستانه تجربی برگرفته از ادبیات عملیاتی."), "required threshold statement");
assert(report.includes("Phase 8B هیچ loading شناختی، رفتار Actor، هزینه اقدام، مدت اقدام، horizon یا budget را تغییر نداده است."), "required no-mechanics-change statement");

const archiveSets = {
  phase8: ["docs/scenario5-phase8-calibration-report-fa.md", "docs/scenario5-phase8-calibration-verification.md", "docs/scenario5-phase8-summary.json", "docs/scenario5-phase8.patch", ...walk("docs/scenario5-phase8-results")],
  phase8a: ["docs/scenario5-phase8a-audit-verification.md", "docs/scenario5-phase8a-diagnostic-report-fa.md", "docs/scenario5-phase8a-summary.json", "docs/scenario5-phase8a.patch", ...walk("docs/scenario5-phase8a-results")],
  phase07c: ["docs/scenario5-phase7c-ui-verification.md", "docs/scenario5-phase7c.patch", ...walk("docs/scenario5-phase7c-screenshots")],
  phase07d: ["docs/scenario5-phase7d-ui-verification.md", "docs/scenario5-phase7d.patch", ...walk("docs/scenario5-phase7d-screenshots")],
};
const expectedArchiveHashes: Record<string, string> = {
  phase8: "dd1e32dce6c1a7486eb9b58f6c1d15962de48860a569b8513891fb2789633b25",
  phase8a: "b0d663033d0b6f18670daa57729893458a9855de88c14134eb88436e0369524b",
  phase07c: "8169b23209aa498bdaea2bb21d819bca1e81361a1e3f2d128e3971f1c76ed566",
  phase07d: "83f19dd15629449cd286993c3828526e292310a543247e47de2a41bf330f2a8c",
};
for (const [key, paths] of Object.entries(archiveSets)) {
  const actual = aggregateHash(paths);
  assert(actual === expectedArchiveHashes[key], `${key} archive hash (${actual})`);
}
const frozenUiPaths = [
  "src/ui/components/scenario/ScenarioFiveSimulation.tsx", "src/ui/components/scenario/ScenarioFiveMap.tsx",
  "src/ui/components/scenario/ScenarioFiveActionCard.tsx", "src/ui/components/scenario/ScenarioFiveResourcePanel.tsx",
  "src/ui/components/scenario/ScenarioFive.css",
];
assert(aggregateHash(frozenUiPaths) === "5935a851ba7ee3ed7a0ee39c50c3c9b49d489491d1842fede617396d62882f7b", "frozen live UI aggregate hash");
const mapSource = text("src/ui/components/scenario/ScenarioFiveMap.tsx");
assert(mapSource.includes('alpha: { x: 0, y: -12 }') && mapSource.includes('delta: { x: 0, y: 12 }'), "Phase 07D deconfliction values");
assert(mapSource.includes("progress / 0.08"), "deconfliction fade threshold");
assert(text("src/ui/components/scenario/ScenarioFive.css").includes('grid-template-areas: "controls map"'), "controls left/map right CSS");
assert(text("scripts/verify-s5-phase7-ui.ts").includes("600"), "prior Phase-7 assertion baseline retained");

console.log(`Scenario 5 Phase 08B verification: PASS — ${assertions} assertions`);
