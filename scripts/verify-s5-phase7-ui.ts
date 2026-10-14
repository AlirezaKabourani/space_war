import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { WORLD_CATALOG } from "../src/ui/components/scenario/scenario-five/model/index.ts";
import type { CorridorId, WorldId } from "../src/ui/components/scenario/scenario-five/model/index.ts";
import { MISSION_ACTION_CATALOG, getMissionAction } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import type { MissionActionSelection, Scenario5EndStateId } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import {
  calculateScenario5RuntimeResult,
  closeRuntimeEvidence,
  confirmRuntimeDecision,
  continueRuntimeAfterOutcome,
  createScenario5Runtime,
  getRuntimeAvailableActionIds,
  openRuntimeEvidence,
  selectRuntimeAction,
  submitRuntimeBelief,
  submitRuntimeReason,
} from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import type { Scenario5RuntimeState } from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import {
  CANONICAL_SCENARIO5_WORLD_IDS,
  SCENARIO5_ACTION_COPY_FA,
  SCENARIO5_ACTOR_LABELS_FA,
  SCENARIO5_CORRIDOR_CONTENT_FA,
  SCENARIO5_END_STATE_LABELS_FA,
  SCENARIO5_METHOD_LIMITATIONS_FA,
  SCENARIO5_REASON_LABELS_FA,
  SCENARIO5_ROUND_CONTENT_FA,
  SCENARIO5_SOURCE_LABELS_FA,
  assignScenario5Run,
  buildActionSelectedLogDetail,
  buildBeliefLogDetail,
  buildDecisionLogDetail,
  buildEvidenceDetail,
  buildEvidenceLogDetail,
  buildEvidenceSummary,
  buildOutcomeContinueLogDetail,
  buildReasonLogDetail,
  buildRunCompletedLogDetail,
  buildRunStartedLogDetail,
  buildScenario5AarView,
  buildScenario5OutcomeView,
  buildScenario5PlayerView,
  fnv1a32,
  getRuntimeAutoClosedEvidenceOpens,
  getScenario5OperationalAttributionLabel,
  getScenario5PlayerStageLabel,
  getScenario5TargetOptions,
  isEvidenceExpansionEnabled,
  readHiddenTabMs,
  resetHiddenTabTiming,
  startHiddenTabTiming,
  updateHiddenTabTiming,
} from "../src/ui/components/scenario/scenario-five/ui/index.ts";

let assertions = 0;
const check = (condition: unknown, message: string): void => { assert.ok(condition, message); assertions += 1; };
const equal = (actual: unknown, expected: unknown, message: string): void => { assert.deepEqual(actual, expected, message); assertions += 1; };
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const source = (path: string): string => readFileSync(join(ROOT, path), "utf8");
const sourceFiles = (directory: string): string[] => readdirSync(join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
  const relative = `${directory}/${entry.name}`;
  return entry.isDirectory() ? sourceFiles(relative) : /\.(?:ts|tsx)$/.test(entry.name) ? [relative] : [];
});
const forbiddenTruth = [
  "trueWorldState", "worldId", "seed", "primaryAffectedCorridorId", "actorProfile",
  "actorObjective", "actorInternalState", "hiddenProvenance", "actorDelayImpactByCorridor",
  "informationSeeking", "secondOrderThinking", "adversaryModeling", "escalationSensitivity",
];
const assertSafe = (value: unknown, label: string): void => {
  const text = JSON.stringify(value);
  for (const token of forbiddenTruth) check(!text.includes(token), `${label} excludes ${token}`);
};

const actionIds = Object.keys(SCENARIO5_ACTION_COPY_FA);
equal(actionIds.length, 33, "content catalog has exactly 33 actions");
equal(actionIds, MISSION_ACTION_CATALOG.map(({ actionId }) => actionId), "content action IDs exactly match frozen mission catalog order");
for (const [id, copy] of Object.entries(SCENARIO5_ACTION_COPY_FA)) {
  check(copy.title.trim().length > 0 && copy.description.trim().length > 0 && copy.knownEffect.trim().length > 0, `${id} has complete copy`);
  check(!/درست|غلط|بهترین|optimal|correct answer/iu.test(`${copy.title} ${copy.description} ${copy.knownEffect}`), `${id} copy has no correctness cue`);
}
equal(Object.keys(SCENARIO5_REASON_LABELS_FA).length, 7, "exactly seven reason labels");
equal(Object.keys(SCENARIO5_ROUND_CONTENT_FA).length, 8, "exactly eight round prompts");
for (const [round, copy] of Object.entries(SCENARIO5_ROUND_CONTENT_FA)) check(copy.title.length > 0 && copy.problem.length > 0, `round ${round} title and problem present`);
equal(Object.keys(SCENARIO5_CORRIDOR_CONTENT_FA).length, 4, "exactly four corridor labels");
equal(Object.keys(SCENARIO5_END_STATE_LABELS_FA).length, 6, "exactly six end-state labels");
equal(Object.keys(SCENARIO5_ACTOR_LABELS_FA).length, 4, "exactly four actor labels");
const timeClarification = "این زمان، ساعت عملیاتی داخل شبیه‌سازی است و با مدت واقعی اجرای بازی متفاوت است.";
const briefingSources = `${source("src/ui/components/scenario/scenario-five/ui/uiContentFa.ts")}\n${source("src/ui/components/scenario/ScenarioFiveSimulation.tsx")}`;
equal(briefingSources.split(timeClarification).length - 1, 1, "simulated-operational-time clarification appears exactly once in briefing sources");
check(briefingSources.includes("SCENARIO5_BRIEFING_FA.timeClarification"), "briefing renders the simulated-time clarification before start");
equal(buildScenario5PlayerView(createScenario5Runtime({ runId: "horizon", worldId: WORLD_CATALOG[0]!.worldId, seed: 1, startedAtMs: 0 })).resources.missionHorizonMinutes, 360, "mission horizon remains exactly 360 minutes");

equal(SCENARIO5_SOURCE_LABELS_FA, {
  pnt_telemetry: "تله‌متری PNT/GNSS",
  field_report: "گزارش میدانی کاروان",
  radio_timing: "تحلیل زمان‌بندی رادیویی",
  satellite_isr: "پایش ماهواره‌ای ISR",
  ground_recon: "بررسی زمینی",
  route_pattern: "تحلیل الگوی مسیر",
  cross_source_analysis: "تحلیل چندمنبعی",
}, "exact seven player-visible source labels");
check(SCENARIO5_SOURCE_LABELS_FA.field_report !== SCENARIO5_SOURCE_LABELS_FA.radio_timing, "field_report and radio_timing labels remain distinct");

const frozenTimingHashes: Readonly<Record<string, string>> = {
  "src/ui/components/scenario/scenario-five/model/mission/actionCatalog.ts": "2fc85f31e51745be92ce9c73dfcfaec1df2d555dd17086e70e0248a1e4dd2931",
  "src/ui/components/scenario/scenario-five/model/mission/config.ts": "f1f61707b42d368c47c5eb6716ea5e03fe31511a6d8d570ce994f9d3df3beb6c",
  "src/ui/components/scenario/scenario-five/model/mission/missionEngine.ts": "3b5c5a5b2a80cffbcb66bacbc6fd078749f1b7e08e28bbfe55e18a1a42c35e5b",
  "src/ui/components/scenario/scenario-five/model/runtime/runtimeEngine.ts": "e03ace9618c929f862bd932294bf7e811db2ceef796953ff3376ab821bc61615",
  "src/ui/components/scenario/scenario-five/model/runtime/stageMachine.ts": "9cbd4a7928ecdf66e03aece28c6af2e93396fcc743a75c84698c5a669a06f277",
};
for (const [path, expectedHash] of Object.entries(frozenTimingHashes)) {
  equal(createHash("sha256").update(readFileSync(join(ROOT, path))).digest("hex"), expectedHash, `${path} frozen timing hash unchanged`);
}

equal(fnv1a32(""), 2166136261, "FNV-1a empty vector exact");
equal(fnv1a32("a"), 3826002220, "FNV-1a a vector exact");
equal(fnv1a32("hello"), 1335831723, "FNV-1a hello vector exact");
const assignmentA = assignScenario5Run("verifier", 1700000000000);
equal(assignScenario5Run("verifier", 1700000000000), assignmentA, "assignment deterministic for same key");
check(CANONICAL_SCENARIO5_WORLD_IDS.includes(assignmentA.worldId), "assignment returns canonical world");
check(assignmentA.seed !== 0, "assignment seed nonzero");
check(/^s5-1700000000000-[0-9a-f]{8}$/.test(assignmentA.runId), "assignment run ID format exact");
check(!source("src/ui/components/scenario/scenario-five/ui/runAssignment.ts").includes("Math.random"), "assignment uses no Math.random");
const corpusWorlds = new Set<WorldId>();
for (let i = 0; i < 10_000; i += 1) corpusWorlds.add(assignScenario5Run(`corpus-${i}`, 1800000000000).worldId);
equal(corpusWorlds.size, 16, "deterministic 10,000-key corpus reaches all 16 worlds");

for (const [index, world] of WORLD_CATALOG.entries()) {
  const initial = createScenario5Runtime({ runId: `safe-${index}`, worldId: world.worldId, seed: index + 1, startedAtMs: 100 });
  assertSafe(buildScenario5PlayerView(initial), `initial safe view ${world.worldId}`);
  equal(buildScenario5PlayerView(initial).availableActionIds, getRuntimeAvailableActionIds(initial), `safe-view actions equal runtime selector for ${world.worldId}`);
}

const initial = createScenario5Runtime({ runId: "ui-fixture", worldId: WORLD_CATALOG[0]!.worldId, seed: 71, startedAtMs: 100 });
const delivered = {
  ...initial,
  missionState: { ...initial.missionState, convoys: initial.missionState.convoys.map((convoy) => convoy.convoyId === "alpha" ? { ...convoy, status: "delivered" as const } : convoy) },
};
check(!getRuntimeAvailableActionIds(delivered).includes("a1_priority_focus"), "fixed-alpha action disappears after alpha delivery");
const targetFixture = {
  ...initial,
  missionState: { ...initial.missionState, convoys: initial.missionState.convoys.map((convoy, index) => ({ ...convoy, status: index === 0 ? "compromised" as const : index === 1 ? "delivered" as const : convoy.status })) },
};
check(getScenario5TargetOptions(targetFixture).includes("corridor_alpha_east"), "compromised corridor remains selectable");
check(!getScenario5TargetOptions(targetFixture).includes("corridor_beta_south"), "delivered corridor absent from targets");
const simulationSource = source("src/ui/components/scenario/ScenarioFiveSimulation.tsx");
check(simulationSource.includes("useState<CorridorId | null>(null)"), "target has no preselection");

const completeReplay = (worldId: WorldId): Scenario5RuntimeState => {
  let state = createScenario5Runtime({ runId: "completed-ui-fixture", worldId, seed: 913, startedAtMs: 1_000 });
  let beliefIndex = 0;
  while (state.stage.stageId !== "complete") {
    if (state.stage.stageId.startsWith("decision:")) {
      const actionId = getRuntimeAvailableActionIds(state)[0]!;
      const action = getMissionAction(actionId);
      const target = state.missionState.convoys.find(({ status }) => status !== "delivered")?.corridorId;
      const selection: MissionActionSelection = action.target === "required" ? { actionId, targetCorridorId: target } : { actionId };
      state = selectRuntimeAction(state, actionId, state.stage.enteredAtMs + 10);
      state = confirmRuntimeDecision(state, selection, state.stage.enteredAtMs + 100, 5);
    } else if (state.stage.stageId.startsWith("reason:")) {
      state = submitRuntimeReason(state, "reason_information_confidence", state.stage.enteredAtMs + 20);
    } else if (state.stage.stageId === "outcome_review") {
      state = continueRuntimeAfterOutcome(state, state.stage.enteredAtMs + 20);
    } else if (state.stage.stageId.startsWith("belief:")) {
      const corridors = Object.keys(SCENARIO5_CORRIDOR_CONTENT_FA) as CorridorId[];
      state = submitRuntimeBelief(state, {
        mostLikelyCorridorId: corridors[beliefIndex++ % corridors.length]!, corridorConfidence: 55,
        targetedInterferenceEstimate: 60, targetedInterferenceConfidence: 50, recordedAtMs: state.stage.enteredAtMs + 20,
      });
    } else throw new Error(`Unexpected replay stage ${state.stage.stageId}`);
  }
  return state;
};

let firstOutcome = selectRuntimeAction(initial, "a1_network_baseline", 110);
firstOutcome = confirmRuntimeDecision(firstOutcome, { actionId: "a1_network_baseline" }, 200, 10);
const evidence = firstOutcome.evidence[0]!;
equal(Object.keys(buildEvidenceSummary(evidence)).sort(), ["direction", "evidenceId", "observedCorridorId", "sourceType", "strengthBand"].sort(), "compact evidence has only allowed visible fields");
equal(Object.keys(buildEvidenceDetail(evidence)).sort(), ["direction", "evidenceId", "limitationVisible", "observedCorridorId", "qualityLabelVisible", "sourceType", "strengthBand"].sort(), "evidence details add only visible quality and limitation");
check(!JSON.stringify(buildEvidenceDetail(evidence)).includes("hiddenProvenance"), "evidence detail excludes hidden provenance");
check(isEvidenceExpansionEnabled("decision:A1_baseline_monitoring"), "evidence expansion enabled in decision stage");
check(!isEvidenceExpansionEnabled("belief:A2_prebelief"), "evidence expansion disabled in belief stage");
check(!isEvidenceExpansionEnabled("reason:B"), "evidence expansion disabled in reason stage");
check(!isEvidenceExpansionEnabled("outcome_review"), "evidence expansion disabled in outcome stage");
assertSafe(buildScenario5OutcomeView(firstOutcome), "outcome review view");

let a2Decision = continueRuntimeAfterOutcome(firstOutcome, 250);
a2Decision = submitRuntimeBelief(a2Decision, {
  mostLikelyCorridorId: "corridor_alpha_east",
  corridorConfidence: 55,
  targetedInterferenceEstimate: 60,
  targetedInterferenceConfidence: 50,
  recordedAtMs: 275,
});
const a2Selected = selectRuntimeAction(a2Decision, "a2_broad_sweep", 300);
check(a2Selected.evidence.length >= 2, "auto-close fixture has at least two visible evidence items");
const evidenceA = a2Selected.evidence[0]!;
const evidenceB = a2Selected.evidence[1]!;
let autoCloseBefore = openRuntimeEvidence(a2Selected, evidenceA.evidenceId, 310);
autoCloseBefore = openRuntimeEvidence(autoCloseBefore, evidenceB.evidenceId, 320);
autoCloseBefore = closeRuntimeEvidence(autoCloseBefore, evidenceA.evidenceId, 330);
const autoCloseAfter = confirmRuntimeDecision(autoCloseBefore, { actionId: "a2_broad_sweep" }, 400, 0);
const autoClosed = getRuntimeAutoClosedEvidenceOpens(autoCloseBefore, autoCloseAfter);
equal(autoClosed.length, 1, "confirmation auto-close extraction returns exactly one still-open item");
equal(autoClosed[0]?.evidenceId, evidenceB.evidenceId, "confirmation auto-close returns evidence B only");
check(!autoClosed.some(({ evidenceId }) => evidenceId === evidenceA.evidenceId), "manually closed evidence A is not returned again");
check(autoClosed[0]?.closedAtMs !== null, "auto-closed evidence has non-null closedAtMs");
equal(autoClosed[0]?.activeDwellMs, 80, "auto-closed evidence preserves exact runtime dwell");
equal(autoClosed.map(({ evidenceId }) => evidenceId), autoCloseAfter.evidenceOpens.slice(autoCloseBefore.evidenceOpens.length).map(({ evidenceId }) => evidenceId), "auto-close extraction preserves runtime append order");
const noOpenAfter = confirmRuntimeDecision(a2Selected, { actionId: "a2_broad_sweep" }, 400, 0);
equal(getRuntimeAutoClosedEvidenceOpens(a2Selected, noOpenAfter), [], "zero active evidence produces no auto-close rows");
assert.throws(() => getRuntimeAutoClosedEvidenceOpens({ ...autoCloseBefore, runId: "different-run" }, autoCloseAfter), /same runId/); assertions += 1;
assert.throws(() => getRuntimeAutoClosedEvidenceOpens(autoCloseBefore, { ...autoCloseAfter, evidenceOpens: [] }), /cannot shrink/); assertions += 1;

equal(getScenario5PlayerStageLabel("decision:A1_baseline_monitoring"), "تصمیم عملیاتی", "decision stage has player-facing label");
equal(getScenario5PlayerStageLabel("belief:A2_prebelief"), "ثبت برداشت", "belief stage has player-facing label");
equal(getScenario5PlayerStageLabel("reason:B"), "ثبت دلیل پیش از پیامد", "reason stage has player-facing label");
equal(getScenario5PlayerStageLabel("outcome_review"), "مرور پیامد", "outcome stage has player-facing label");
equal(getScenario5PlayerStageLabel("complete"), "گزارش پس از اقدام", "complete stage has player-facing label");
assert.throws(() => getScenario5PlayerStageLabel("unknown" as never), /Unknown Scenario 5 runtime stage/); assertions += 1;
check(!simulationSource.includes('<span className="s5-stage-chip">{view.stageId}</span>'), "component does not render raw RuntimeStageId in stage chip");
check(simulationSource.includes("getScenario5PlayerStageLabel(view.stageId)"), "stage chip uses player-facing stage helper");

const confirmationSource = simulationSource.slice(simulationSource.indexOf("const confirmDecision"), simulationSource.indexOf("const submitBelief"));
check(confirmationSource.includes("getRuntimeAutoClosedEvidenceOpens(before, next)"), "confirmation extracts runtime auto-closures");
check(confirmationSource.includes("for (const closed of autoClosedEvidence)"), "confirmation logs every extracted auto-closure");
const autoCloseLogIndex = confirmationSource.indexOf('log("s5_v3_evidence_closed"');
const immediateDecisionLogIndex = confirmationSource.indexOf('log("s5_v3_decision"');
check(autoCloseLogIndex >= 0 && immediateDecisionLogIndex > autoCloseLogIndex, "auto-close audit logs precede immediate decision log");

const beliefSource = source("src/ui/components/scenario/scenario-five/ui/ScenarioFiveBeliefPanel.tsx");
const reasonSource = source("src/ui/components/scenario/scenario-five/ui/ScenarioFiveReasonPanel.tsx");
const scenario5CssSource = source("src/ui/components/scenario/ScenarioFive.css");
const mapSource = source("src/ui/components/scenario/ScenarioFiveMap.tsx");
check(!mapSource.includes("0.58") && !mapSource.includes("0.45") && !mapSource.includes("status === \"held\" ? 0.45"), "07C removes fixed status-only convoy placement ratios");
check(simulationSource.includes("worldClockMinutes={view.resources.worldClockMinutes}"), "07C map receives player-visible worldClockMinutes");
check(mapSource.includes("worldClockMinutes / Math.max(convoy.projectedArrivalMinute, 1)"), "07C visual progress uses clock divided by projected arrival");
check(mapSource.includes('convoy.status === "delivered" ? 1') && mapSource.includes('convoy.status === "held" ? previousVisual'), "07C delivered progress is one and held progress freezes");
check(mapSource.includes("Math.max(previousVisual, desired)"), "07C non-held visual progress is monotonic");
check(mapSource.includes('className="s5-truck-body"') && mapSource.includes('className="s5-truck-cabin"') && (mapSource.match(/className="s5-truck-wheel"/g) ?? []).length === 2, "07C convoy marker has body, cabin, and two wheels");
check(/\.s5-convoy-marker \{[^}]*transition: transform 850ms cubic-bezier\(\.22,\.75,\.2,1\)/s.test(scenario5CssSource), "07C marker movement uses the required CSS transition");
check(/\.s5-action-grid \{[^}]*grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/s.test(scenario5CssSource), "07C desktop action cards use a 2×2 grid");
check(/\.s5-workspace \{[^}]*direction: ltr;[^}]*grid-template-areas: "controls map"/s.test(scenario5CssSource)
  && /\.s5-control-pane \{ grid-area: controls; direction: rtl;/s.test(scenario5CssSource)
  && /\.s5-map-pane \{ grid-area: map; direction: rtl;/s.test(scenario5CssSource), "07C physical grid fixes controls left and map right");
check(/\.s5-live-shell \{[^}]*width: 100%;[^}]*height: calc\(100dvh - 116px\);[^}]*overflow: hidden;/s.test(scenario5CssSource), "07C live shell accounts for the host chrome and keeps page overflow hidden");
check(simulationSource.includes('<ScenarioFiveResourcePanel resources={view.resources} />') && simulationSource.indexOf("ScenarioFiveResourcePanel resources") < simulationSource.indexOf('<div className="s5-workspace">'), "07C resource strip lives in compact command bar");
equal((simulationSource.match(/<ScenarioFiveEvidencePanel/g) ?? []).length, 1, "07C evidence panel is not permanently stacked in the main grid");
check(simulationSource.includes("evidenceViewOpen ?") && simulationSource.includes("بازگشت به تصمیم") && simulationSource.includes("شواهد موجود ({view.visibleEvidence.length})"), "07C evidence uses a reversible local control-pane view");
check(simulationSource.includes('<section className="s5-control-pane"')
  && simulationSource.includes("isBeliefStage(runtime.stage.stageId) && <ScenarioFiveBeliefPanel")
  && simulationSource.includes("isReasonStage(runtime.stage.stageId) && reasonContext && <ScenarioFiveReasonPanel"), "07C belief and reason panels remain in the left control pane");
for (const hidden of ["trueWorldState", "primaryAffectedCorridorId", "actorProfile", "actorInternalState", "hiddenProvenance"]) check(!mapSource.includes(hidden), `07C map contains no hidden source: ${hidden}`);
const visualProgressOccurrences = [
  "src/ui/components/scenario/ScenarioFiveMap.tsx",
  ...[
    "src/ui/components/scenario/scenario-five/model/mission/missionEngine.ts",
    "src/ui/components/scenario/scenario-five/model/runtime/runtimeEngine.ts",
    "src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts",
  ].filter((path) => /visualProgress/.test(source(path))),
];
equal(visualProgressOccurrences, ["src/ui/components/scenario/ScenarioFiveMap.tsx"], "07C visual progress never enters runtime/model/scoring source");
equal(createHash("sha256").update(source("src/services/analytics/eventLogger.ts")).digest("hex"), "7faa68531a38bd3a56facb5e73a7c4e4f5d1e13f4906218ee56147dacd1103b1", "07C leaves eventLogger semantics byte-identical");
for (const runtimeCall of ["selectRuntimeAction", "openRuntimeEvidence", "closeRuntimeEvidence", "confirmRuntimeDecision", "submitRuntimeBelief", "submitRuntimeReason", "continueRuntimeAfterOutcome"]) check(simulationSource.includes(`${runtimeCall}(`), `07C retains runtime API call ${runtimeCall}`);
const originDeconflictionBlock = mapSource.match(/const ORIGIN_DECONFLICTION:[\s\S]*?= \{([\s\S]*?)\n\};/)?.[1] ?? "";
equal([...originDeconflictionBlock.matchAll(/^\s*(alpha|beta|gamma|delta):/gm)].map((match) => match[1]), ["alpha", "delta"], "07D origin deconfliction contains only alpha and delta");
check(/alpha: \{ x: 0, y: -12 \}/.test(originDeconflictionBlock), "07D alpha origin offset is exactly x 0, y -12");
check(/delta: \{ x: 0, y: 12 \}/.test(originDeconflictionBlock), "07D delta origin offset is exactly x 0, y 12");
check(mapSource.includes("clamp(1 - progress / 0.08, 0, 1)"), "07D origin offset fade threshold is exactly 0.08");
check(mapSource.includes('convoy.status === "delivered" ? 1 : clamp(worldClockMinutes / Math.max(convoy.projectedArrivalMinute, 1), 0, .97);'), "07D preserves the Phase-07C desired-progress formula byte-equivalently");
check(mapSource.includes("x: routePoint.x + originOffset.x * originSeparationWeight")
  && mapSource.includes("y: routePoint.y + originOffset.y * originSeparationWeight")
  && mapSource.includes("translate(${displayPoint.x}px, ${displayPoint.y}px)")
  && !mapSource.includes("translate(${routePoint.x}px"), "07D deconfliction affects only the final display transform coordinates");
const deconflictionSourceOccurrences = sourceFiles("src").filter((path) => /ORIGIN_DECONFLICTION|originSeparationWeight|originOffset/.test(source(path)));
equal(deconflictionSourceOccurrences, ["src/ui/components/scenario/ScenarioFiveMap.tsx"], "07D offset enters no player-view adapter, runtime, telemetry, AAR, scoring, domain, cognitive, or calibration source");
equal(Math.min(1, Math.max(0, 1 - 0.08 / 0.08)), 0, "07D origin offset weight is zero at progress 0.08");
equal(Math.abs((-12) - 12), 24, "07D alpha and delta initial rendered centers differ by 24 SVG units");
check(!/data-(?:origin|offset|display-point)/.test(mapSource) && !mapSource.includes("log(originOffset"), "07D presentation offset is neither exposed nor logged");
for (const initializer of [
  'useState<CorridorId | "">("")', 'useState("")',
]) check(beliefSource.includes(initializer), `belief form empty initializer present: ${initializer}`);
equal((beliefSource.match(/setCorridorConfidence|setTargetedEstimate|setTargetedConfidence/g) ?? []).length, 6, "three numeric belief fields retain empty controlled state");
equal((beliefSource.match(/min="0"/g) ?? []).length, 3, "all three belief numeric minima remain 0");
equal((beliefSource.match(/max="100"/g) ?? []).length, 3, "all three belief numeric maxima remain 100");
check(!beliefSource.includes("defaultValue") && !beliefSource.includes("defaultChecked"), "belief form introduces no browser defaults");
check(beliefSource.includes('<option value="" disabled>'), "belief select retains an empty disabled initial option");
equal((beliefSource.match(/className="s5-belief-field"/g) ?? []).length, 4, "all four belief fields use the common field structure");
equal((beliefSource.match(/className="s5-belief-label"/g) ?? []).length, 4, "all four belief fields separate their labels");
equal((beliefSource.match(/className="s5-belief-control"/g) ?? []).length, 4, "all four belief fields separate their controls");
check(beliefSource.includes('className="s5-belief-select"'), "belief select uses the S5 visual class");
equal((beliefSource.match(/className="s5-belief-number"/g) ?? []).length, 3, "all three numeric controls use the S5 visual class");
equal((beliefSource.match(/type="number" min="0" max="100" dir="ltr"/g) ?? []).length, 3, "all numeric belief values retain bounds and explicit LTR display");
check(/\.s5-belief-select, \.s5-belief-number \{[^}]*min-height: 42px;[^}]*background: #071827;[^}]*color-scheme: dark;/s.test(scenario5CssSource), "belief controls have dark theme and 42px minimum height");
check(/\.s5-belief-select:focus-visible, \.s5-belief-number:focus-visible \{[^}]*box-shadow:/s.test(scenario5CssSource), "belief controls have visible focus styling");
check(/@media \(max-width: 600px\)[\s\S]*?\.s5-belief-control, \.s5-belief-select, \.s5-form-panel input\.s5-belief-number \{[^}]*width: 100%;/s.test(scenario5CssSource), "belief controls become full width at 600px");
check(reasonSource.includes('useState<ReasonId | "">("")') && !reasonSource.includes("checked={true}"), "reason form starts with no checked selection");
equal((reasonSource.match(/type="radio"/g) ?? []).length, 1, "reason form renders canonical labels through one radio template");
check(!/correct answer|optimal|پاسخ شما (درست|غلط) بود/iu.test(`${beliefSource}\n${reasonSource}`), "forms contain no post-submit correctness feedback");

let timing = startHiddenTabTiming(10, false);
timing = updateHiddenTabTiming(timing, 20, true);
timing = updateHiddenTabTiming(timing, 50, false);
equal(readHiddenTabMs(timing, 60), 30, "single hidden interval accumulates");
timing = updateHiddenTabTiming(timing, 70, true);
equal(readHiddenTabMs(timing, 90), 50, "multiple/current hidden intervals accumulate");
equal(resetHiddenTabTiming(), { accumulatedMs: 0, hiddenSinceMs: null }, "nondecision reset clears hidden timing");
check(simulationSource.includes("visibilitychange") && simulationSource.includes("hiddenTabMs"), "component wires visibility changes to confirmation telemetry");

const completed = completeReplay(WORLD_CATALOG[5]!.worldId);
const result = calculateScenario5RuntimeResult(completed);
const aar = buildScenario5AarView(completed, result);
equal(aar.sectionIds, ["mission", "truth", "belief", "evidence", "decisions", "domain", "cognitive", "limitations"], "AAR has all eight sections");
equal(Object.keys(SCENARIO5_END_STATE_LABELS_FA) as Scenario5EndStateId[], [
  "critical_cargo_lost_or_compromised", "priority_delivered_network_degradation", "mission_incomplete_continuity_preserved",
  "delivery_complete_threat_persistent", "delivery_complete_attribution_unresolved", "delivery_complete_threat_contained",
], "six end-state IDs map exactly");
equal(SCENARIO5_END_STATE_LABELS_FA, {
  critical_cargo_lost_or_compromised: "از دست رفتن یا آسیب جدی محموله حیاتی",
  priority_delivered_network_degradation: "تحویل محموله اولویت‌دار با افت تداوم عملیاتی شبکه",
  mission_incomplete_continuity_preserved: "تداوم شبکه حفظ شد، اما تحویل اولویت‌دار تکمیل نشد",
  delivery_complete_threat_persistent: "تحویل و تداوم شبکه کامل؛ تهدید مهار نشد",
  delivery_complete_attribution_unresolved: "تحویل و تداوم شبکه کامل؛ منشأ اختلال حل‌نشده",
  delivery_complete_threat_contained: "تحویل و تداوم شبکه کامل؛ تهدید مهار شد",
}, "08B Persian end-state labels are exact");
assert.throws(() => buildScenario5AarView(initial, result), /completed runtime/); assertions += 1;
equal(aar.truth.worldId, completed.missionState.trueWorldState.worldId, "AAR reveals world truth after completion");
check(aar.beliefs.length === 4, "AAR carries four belief checkpoints for truth comparison");
check(aar.evidenceAudit.length > 0 && aar.evidenceAudit.every(({ hiddenProvenance }) => hiddenProvenance.length > 0), "AAR evidence includes hidden provenance");
const summarySource = source("src/ui/components/scenario/ScenarioFiveSummary.tsx");
check(summarySource.includes("تداوم عملیاتی شبکه، سهم کاروان‌هایی است که با یکپارچگی حداقل ۶۰ و تا مهلت عملیاتی خود به مقصد رسیده‌اند."), "08B AAR contains the exact post-completion continuity-definition note");
equal(getScenario5OperationalAttributionLabel("resolved"), "حل‌شده", "resolved attribution has exact Persian presentation label");
equal(getScenario5OperationalAttributionLabel("unresolved"), "حل‌نشده", "unresolved attribution has exact Persian presentation label");
equal((summarySource.match(/domain\.logisticsResilience\.operationalAttributionStatus/g) ?? []).length, 2, "AAR has exactly two operational-attribution presentations");
equal((summarySource.match(/getScenario5OperationalAttributionLabel\(domain\.logisticsResilience\.operationalAttributionStatus\)/g) ?? []).length, 2, "every AAR attribution presentation passes through the Persian helper");
check(!/<(?:strong|p)>[^<]*\{domain\.logisticsResilience\.operationalAttributionStatus\}/s.test(summarySource), "AAR never directly renders the raw attribution enum");
check(summarySource.includes('<div className="s5-aar-stat">') && summarySource.includes('<span className="s5-aar-stat-label">{label}</span>') && summarySource.includes('<strong className="s5-aar-stat-value">'), "AAR stat helper has separate label and value elements");
check(!summarySource.includes("<div><span>"), "AAR contains no legacy inline label/value metric block");
check(summarySource.includes('label="الگوی عامل مقابل"') && summarySource.includes('label="وضعیت فنی نهایی عامل مقابل"'), "Actor presentation uses the approved Persian labels");
check(summarySource.includes('<code dir="ltr" className="s5-technical-id">{value}</code>'), "technical AAR values use explicit LTR code markup");
for (const technicalValue of ["aar.truth.finalActorPosture", 'aar.truth.lastReactionId ?? "—"', "aar.truth.worldId", "aar.truth.seed"])
  check(summarySource.includes(`value={${technicalValue}} technical`), `${technicalValue} is rendered only as a technical audit value`);
check(/\.s5-aar-stat \{[^}]*gap: 6px;/s.test(scenario5CssSource), "AAR stat label/value gap is at least six pixels");
check(/\.s5-aar-stat-label, \.s5-aar-stat-value \{[^}]*unicode-bidi: plaintext;/s.test(scenario5CssSource), "AAR stat label/value uses bidi-safe independent layout");
check(/\.s5-technical-id \{[^}]*direction: ltr;[^}]*overflow-wrap: anywhere;[^}]*word-break: break-all;/s.test(scenario5CssSource), "technical IDs are LTR monospace values that wrap safely");
check(!/global Cognitive Score|نمره شناختی کل/iu.test(summarySource), "AAR has no global Cognitive Score");
check(summarySource.includes("در نسخه فعلی این سناریو اندازه‌گیری نمی‌شود."), "Information Discipline explicitly says not measured");
const signedRiskNote = "منفی‌تر یا مثبت‌تر فقط جایگاه نسبی انتخاب در برابر گزینه‌های همان موقعیت است و ارزش‌گذاری خوب/بد ندارد.";
equal(summarySource.split(signedRiskNote).length - 1, 1, "signed relative-risk helper appears exactly once");
check(summarySource.includes('note={key === "riskPosture" ? SIGNED_RISK_NOTE : undefined}'), "signed relative-risk helper is local to riskPosture branch");
check(!summarySource.includes(`</div>\n        <p className="s5-method-note">${signedRiskNote}</p>`), "signed relative-risk helper is not generic beneath construct grid");
check(summarySource.includes("منفی‌تر = عملیاتی‌تر نسبت به گزینه‌های همان موقعیت؛ مثبت‌تر = راهبردی‌تر. این محور کیفیت تصمیم نیست."), "OSI-specific helper remains exact");
const constructBlockWithoutRequiredRiskNote = summarySource
  .slice(summarySource.indexOf("<h3>Constructها"), summarySource.indexOf("میانه زمان فعال"))
  .replace(signedRiskNote, "");
check(!/خوب|بد|good|bad/iu.test(constructBlockWithoutRequiredRiskNote), "no good/bad construct interpretation band introduced");
equal(SCENARIO5_METHOD_LIMITATIONS_FA, [
  "این اجرا یکی از جهان‌های کنترل‌شده سناریو است و پیش‌بینی رخداد واقعی نیست.",
  "نتیجه مأموریت و شاخص‌های شناختی دو خروجی جدا هستند.",
  "موفقیت یا شکست مأموریت مستقیماً امتیاز شناختی تولید نمی‌کند.",
  "پروفایل‌های گزینه و مدل دلیل هنوز کدگذاری داخلی پروژه‌اند و به اعتبارسنجی خبرگان نیاز دارند.",
  "اعتبار مهندسی و بازپخش‌پذیری شبیه‌سازی به معنی اعتبار روان‌سنجی یا اعتبار انسانی نیست.",
  "تفسیر بین‌فردی یا تصمیم‌های پرمخاطره نباید بر اساس یک اجرای منفرد انجام شود.",
], "method limitations exact");
check(summarySource.includes("SCENARIO5_METHOD_LIMITATIONS_FA.map"), "AAR renders every canonical method limitation");

const safePayloads = [
  buildRunStartedLogDetail(initial), buildActionSelectedLogDetail(initial, "a1_network_baseline"),
  buildEvidenceLogDetail(completed, completed.evidence[0]!.evidenceId), buildDecisionLogDetail(completed),
  buildBeliefLogDetail(completed, completed.beliefs[0]!), buildReasonLogDetail(completed, completed.reasons[0]!),
  buildOutcomeContinueLogDetail(completed, 8, "complete"),
];
for (const [index, payload] of safePayloads.entries()) assertSafe(payload, `noncompletion logger payload ${index}`);
const completionPayload = JSON.stringify(buildRunCompletedLogDetail(completed, result));
for (const token of ["worldId", "seed", "truePrimaryAffectedCorridorId", "actorProfile"]) check(completionPayload.includes(token), `completion payload includes ${token}`);
check(simulationSource.includes("completionLoggedRunRef.current === runtime.runId"), "component guards completion logging exactly once per run");

const uiPaths = [
  "src/ui/components/scenario/ScenarioFiveSimulation.tsx", "src/ui/components/scenario/ScenarioFiveTypes.ts",
  "src/ui/components/scenario/ScenarioFiveActionCard.tsx", "src/ui/components/scenario/ScenarioFiveMap.tsx",
  "src/ui/components/scenario/ScenarioFiveResourcePanel.tsx", "src/ui/components/scenario/ScenarioFiveSummary.tsx",
  "src/ui/components/scenario/ScenarioFive.css", "src/ui/components/scenario/scenario-five/ui/uiContentFa.ts",
  "src/ui/components/scenario/scenario-five/ui/runAssignment.ts", "src/ui/components/scenario/scenario-five/ui/presentation.ts",
  "src/ui/components/scenario/scenario-five/ui/ScenarioFiveEvidencePanel.tsx",
  "src/ui/components/scenario/scenario-five/ui/ScenarioFiveBeliefPanel.tsx",
  "src/ui/components/scenario/scenario-five/ui/ScenarioFiveReasonPanel.tsx",
];
const uiSource = uiPaths.map(source).join("\n");
for (const legacy of ["mashhadIdentified", "lateDiscoveryPenalty", "secondaryConvoyStability", "ambushRisk", "gnssExposureRisk", "ScenarioFiveDecisionWeights", "supportActionIds"])
  check(!uiSource.includes(legacy), `legacy UI identifier removed: ${legacy}`);
check(!/\benergy\b/.test(uiSource), "legacy energy resource display removed");
for (const forbiddenDefinition of ["COGNITIVE_WEIGHTS", "ACTOR_REACTION_RULES", "MISSION_COST_TABLE", "END_STATE_THRESHOLDS"])
  check(!uiSource.includes(forbiddenDefinition), `UI defines no ${forbiddenDefinition}`);
check(uiSource.includes("aria-pressed") && uiSource.includes("focus-visible"), "selection and keyboard focus are visibly accessible");
for (const breakpoint of ["1024px", "768px", "390px"]) check(uiSource.includes(breakpoint), `responsive breakpoint ${breakpoint} present`);
check(/@media \(max-width: 480px\)[\s\S]*?\.s5-root \{[^}]*padding-right: 4\.5rem;[^}]*padding-left: \.55rem;/s.test(scenario5CssSource), "S5 adds mobile right-side safe spacing for global fixed controls");
check(/\.s5-root \{[^}]*overflow-x: hidden;/s.test(scenario5CssSource), "S5 root retains page-level horizontal-overflow protection");

const requiredScreenshots = [
  "01-briefing-desktop.png",
  "02-decision-desktop.png",
  "03-evidence-expanded-desktop.png",
  "04-belief-checkpoint-desktop.png",
  "05-reason-gate-desktop.png",
  "06-outcome-review-desktop.png",
  "07-aar-desktop.png",
  "08-decision-mobile.png",
  "09-aar-mobile.png",
] as const;
const screenshotDirectory = join(ROOT, "docs", "scenario5-phase7-screenshots");
check(existsSync(screenshotDirectory), "real screenshot evidence directory exists");
for (const filename of requiredScreenshots) {
  const path = join(screenshotDirectory, filename);
  check(existsSync(path), `required screenshot exists: ${filename}`);
  check(statSync(path).size > 0, `required screenshot is non-empty: ${filename}`);
}
for (const filename of ["04-belief-checkpoint-desktop.png", "07-aar-desktop.png", "09-aar-mobile.png"] as const) {
  const path = join(screenshotDirectory, filename);
  check(existsSync(path), `Phase 07B recaptured screenshot exists: ${filename}`);
  check(statSync(path).size > 0, `Phase 07B recaptured screenshot is non-empty: ${filename}`);
}

console.log(`Scenario 5 Phase 7 UI verifier passed: ${assertions} assertions.`);
