import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { WORLD_CATALOG } from "../src/ui/components/scenario/scenario-five/model/index.ts";
import { getMissionAction } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import {
  createScenario5Runtime, getRuntimeAvailableActionIds, selectRuntimeAction,
  confirmRuntimeDecision, submitRuntimeBelief, submitRuntimeReason,
  continueRuntimeAfterOutcome, calculateScenario5RuntimeResult,
  openRuntimeEvidence, closeRuntimeEvidence,
} from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import { buildScenario5PlayerView, buildScenario5OutcomeView, buildEvidenceSummary } from "../src/ui/components/scenario/scenario-five/ui/presentation.ts";
import { SCENARIO5_BELIEF_COPY_FA, SCENARIO5_BRIEFING_FA, SCENARIO5_GLOSSARY_FA, SCENARIO5_CORRIDOR_CONTENT_FA } from "../src/ui/components/scenario/scenario-five/ui/uiContentFa.ts";
import { ScenarioFiveBeliefPanel } from "../src/ui/components/scenario/scenario-five/ui/ScenarioFiveBeliefPanel.tsx";
import { ScenarioFiveInformationPicture } from "../src/ui/components/scenario/scenario-five/ui/ScenarioFiveInformationPicture.tsx";

const read = (path: string) => readFileSync(path, "utf8");
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const files = (root: string): string[] => readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? files(`${root}/${entry.name}`) : [`${root}/${entry.name}`]);
const baselinePath = "docs/scenario5-phase8c-baseline.json";
let assertions = 0;
const check = (condition: unknown, message: string) => { assert.ok(condition, message); assertions++; };
const equal = (actual: unknown, expected: unknown, message: string) => { assert.deepEqual(actual, expected, message); assertions++; };
const frozenPaths = () => [
  ...files("src/ui/components/scenario/scenario-five/model"),
  ...files("src/ui/components/scenario/scenario-five/calibration"),
  ...files("src/ui/components/scenario/scenario-four/model").filter((p) => /cognitive|aarV3/.test(p)),
  ...files("src/scenarios/s2_silent_waves"),
  ...files("src/ui/components/scenario").filter((p) => /\/ScenarioTwo[^/]*$/.test(p)),
  ...files("scripts").filter((p) => /s5-phase(?:3|4|5|6|8|8a|8b)-/.test(p)),
  ...files("docs").filter((p) => /scenario5-phase8b/.test(p)),
  "src/ui/components/scenario/ScenarioFiveSummary.tsx", "src/services/analytics/eventLogger.ts", "package.json",
].sort();

// A trace digest covers the entire runtime state at EVERY transition, not only final scores.
function replayCorpus() {
  return WORLD_CATALOG.flatMap((world, worldIndex) => [17, 71, 913, 4099].map((seed, variant) => {
    let state = createScenario5Runtime({ runId: `s5-parity-${worldIndex}-${seed}`, worldId: world.worldId, seed, startedAtMs: 100 });
    const trace: string[] = [];
    const stages: string[] = [];
    let step = 0;
    while (state.stage.stageId !== "complete") {
      trace.push(hash(JSON.stringify(state)));
      stages.push(state.stage.stageId);
      const at = state.stage.enteredAtMs;
      if (state.stage.stageId.startsWith("decision:")) {
        const available = getRuntimeAvailableActionIds(state);
        trace.push(hash(JSON.stringify(available)));
        const actionId = available[(variant + state.missionState.currentRound - 1) % available.length]!;
        state = selectRuntimeAction(state, actionId, at + 10);
        if (state.evidence.length && variant % 2 === 0) {
          const evidenceId = state.evidence[variant % state.evidence.length]!.evidenceId;
          state = openRuntimeEvidence(state, evidenceId, at + 20);
          state = closeRuntimeEvidence(state, evidenceId, at + 420);
        }
        const target = state.missionState.convoys.filter((c) => c.status !== "delivered");
        state = confirmRuntimeDecision(state, {
          actionId,
          ...(getMissionAction(actionId).target === "required" ? { targetCorridorId: target[variant % target.length]!.corridorId } : {}),
        }, at + 1000, 5);
      } else if (state.stage.stageId.startsWith("belief:")) {
        state = submitRuntimeBelief(state, {
          mostLikelyCorridorId: WORLD_CATALOG[(worldIndex + variant + step) % WORLD_CATALOG.length]!.primaryAffectedCorridorId,
          corridorConfidence: 23 + variant * 17, targetedInterferenceEstimate: 18 + variant * 19,
          targetedInterferenceConfidence: 31 + variant * 13, recordedAtMs: at + 100,
        });
      } else if (state.stage.stageId.startsWith("reason:")) {
        state = submitRuntimeReason(state, "reason_information_confidence", at + 100);
      } else if (state.stage.stageId === "outcome_review") {
        state = continueRuntimeAfterOutcome(state, at + 100);
      } else throw new Error(`Unexpected stage ${state.stage.stageId}`);
      if (++step > 40) throw new Error("Replay did not complete");
    }
    trace.push(hash(JSON.stringify(state)));
    return {
      worldId: world.worldId, actor: world.actorProfileId, corridor: world.primaryAffectedCorridorId, seed,
      traceDigest: hash(JSON.stringify(trace)), resultDigest: hash(JSON.stringify(calculateScenario5RuntimeResult(state))), stages,
    };
  }));
}

// Mask string INITIALIZERS only: AST structure and every byte outside authorized fields stay protected.
function boundedApp(text: string, ids: number[]) {
  const ast = ts.createSourceFile("App.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const replacements: { start: number; end: number }[] = [];
  const allowed = new Set(["summary", "descriptionPreview", "fullDescription", "introTitle", "introText"]);
  const visit = (node: ts.Node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const id = node.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(ast) === "id");
      if (id && ts.isPropertyAssignment(id) && ids.includes(Number(id.initializer.getText(ast)))) {
        for (const p of node.properties) if (ts.isPropertyAssignment(p) && allowed.has(p.name.getText(ast))) {
          replacements.push({ start: p.initializer.getStart(ast), end: p.initializer.end });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  for (const { start, end } of replacements.sort((a, b) => b.start - a.start)) text = `${text.slice(0, start)}"AUTHORIZED_METADATA"${text.slice(end)}`;
  return text;
}

if (process.argv.includes("--phase6-portable")) {
  // The accepted verifier hashes LF source bytes. This Windows checkout contains CRLF.
  // Execute its BYTE-IDENTICAL source in a temporary LF checkout; never touch originals.
  const root = mkdtempSync(join(tmpdir(), "s5-phase8c-phase6-lf-"));
  const paths = [...files("src/ui/components/scenario/scenario-five/model"), "scripts/verify-s5-phase6-runtime.ts", "package.json"];
  for (const path of paths) {
    const target = join(root, path);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, path.includes("/model/") ? read(path).replace(/\r\n/g, "\n") : readFileSync(path));
  }
  const output = execFileSync(process.execPath, [resolve("node_modules/tsx/dist/cli.mjs"), "scripts/verify-s5-phase6-runtime.ts"], { cwd: root, encoding: "utf8" });
  writeFileSync("docs/scenario5-phase8c-phase6-portable.txt", output);
  console.log(`Isolated LF checkout: ${root}\n${output}`);
} else if (process.argv.includes("--record-baseline")) {
  assert.ok(!existsSync(baselinePath), "Baseline must never be overwritten");
  writeFileSync(baselinePath, JSON.stringify({
    createdAt: new Date().toISOString(), frozen: Object.fromEntries(frozenPaths().map((p) => [p, hash(readFileSync(p))])),
    appOriginal: read("src/App.tsx"), phase7Original: read("scripts/verify-s5-phase7-ui.ts"), corpus: replayCorpus(),
  }, null, 2));
  console.log("Phase 08C baseline captured: frozen hashes + 64 complete runtime traces.");
} else {
  const baseline = JSON.parse(read(baselinePath));
  for (const [path, expected] of Object.entries(baseline.frozen)) equal(hash(readFileSync(path)), expected, `Frozen source/archive: ${path}`);
  const corpus = replayCorpus();
  for (const [index, run] of corpus.entries()) equal(run, baseline.corpus[index], `Scientific trace and result parity: ${run.worldId}/${run.seed}`);
  equal(corpus.length, 64, "64 complete deterministic runs");
  equal(new Set(corpus.map((run) => run.worldId)).size, 16, "All 16 worlds covered");
  equal(new Set(corpus.map((run) => run.actor)).size, 4, "All four Actor profiles covered");
  equal(new Set(corpus.map((run) => run.corridor)).size, 4, "All four primary corridors covered");
  equal(new Set(corpus.map((run) => run.seed)).size, 4, "Four distinct supplied seeds");
  equal(boundedApp(read("src/App.tsx"), [5]), boundedApp(baseline.appOriginal, [5]), "APP_SCENARIO2_DIFF_BOUNDARY: only five id=5 metadata initializers changed (user-approved mapping)");
  const app = ts.createSourceFile("App.tsx", read("src/App.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const metadata: Record<string, string> = {};
  const visit = (node: ts.Node) => {
    if (ts.isObjectLiteralExpression(node) && node.properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText(app) === "id" && p.initializer.getText(app) === "5")) {
      for (const p of node.properties) if (ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.initializer)) metadata[p.name.getText(app)] = p.initializer.text;
    }
    ts.forEachChild(node, visit);
  };
  visit(app);
  equal(metadata.introTitle, "سناریو ۲ — امواج خاموش", "Product intro is Scenario 2");
  for (const field of ["summary", "descriptionPreview", "fullDescription", "introText"]) {
    check(Boolean(metadata[field]) && !/انرژی|تا پایان راند ۸|سناریو ۵|دشمن دیده نمی‌شود/.test(metadata[field]!), `Coherent nonlegacy narrative in ${field}`);
  }
  equal(SCENARIO5_GLOSSARY_FA, {
    PNT: "موقعیت‌یابی، ناوبری و زمان‌بندی؛ اطلاعاتی که برای تعیین موقعیت، جهت/مسیر حرکت و زمان دقیق استفاده می‌شود.",
    GNSS: "سامانه‌های ناوبری ماهواره‌ای جهانی، مانند GPS؛ یکی از منابع اصلی داده PNT.",
    ISR: "ظرفیت شناسایی، مراقبت و جمع‌آوری اطلاعات برای ساختن تصویر عملیاتی.",
  }, "Exact glossary definitions");
  equal(SCENARIO5_BRIEFING_FA.heading, metadata.introTitle, "Briefing and outer introduction agree");
  equal(SCENARIO5_BRIEFING_FA.title, "فرماندهی لجستیک در اختلال PNT", "Exact briefing main title");
  equal(SCENARIO5_BRIEFING_FA.known.length, 4, "All four known facts");
  equal(SCENARIO5_BRIEFING_FA.unknown.length, 3, "All three unknown facts");
  check(SCENARIO5_BRIEFING_FA.known.includes("کاروان الف اولویت مأموریتی دارد؛ اولویت مأموریتی به معنی هدف‌بودن آن نیست."), "Alpha priority is not evidence");
  const simulation = read("src/ui/components/scenario/ScenarioFiveSimulation.tsx");
  for (const section of ["وضعیت", "آنچه می‌دانید", "آنچه هنوز نمی‌دانید", "قاعده تصمیم"]) check(simulation.includes(`<h2>${section}</h2>`), `Briefing section ${section}`);
  check(!/سناریو (۵|پنج)/.test(simulation + read("src/ui/components/scenario/ScenarioFiveMap.tsx")), "Live product has no Scenario 5 numbering");
  check(simulation.includes("<ScenarioFiveGlossary inline />") && simulation.includes("<ScenarioFiveGlossary />"), "Reusable glossary on briefing and live header");
  const ui = "src/ui/components/scenario/scenario-five/ui/";
  const belief = read(`${ui}ScenarioFiveBeliefPanel.tsx`);
  const reason = read(`${ui}ScenarioFiveReasonPanel.tsx`);
  const information = read(`${ui}ScenarioFiveInformationPicture.tsx`);
  const glossary = read(`${ui}ScenarioFiveGlossary.tsx`);
  const outcome = read(`${ui}ScenarioFiveOutcomePanel.tsx`);
  for (const [label, content] of Object.entries({ belief, reason, information, glossary, outcome })) {
    check(!/openRuntimeEvidence|closeRuntimeEvidence|eventLogger|buildEvidenceLogDetail/.test(content), `${label} cannot emit evidence-open/cognitive telemetry`);
    check(!/trueWorldState|hiddenProvenance|actorInternalState|actorProfile|cognitive\.scores/.test(content), `${label} does not consume hidden/scoring sources`);
  }
  (globalThis as unknown as { React: typeof React }).React = React;
  const renderBelief = (stageId: keyof typeof SCENARIO5_BELIEF_COPY_FA, evidence: Parameters<typeof ScenarioFiveBeliefPanel>[0]["evidence"] = [], recentEvidenceIds = new Set<string>()) => renderToStaticMarkup(React.createElement(ScenarioFiveBeliefPanel, { stageId, evidence, recentEvidenceIds, onSubmit: () => {} }));
  for (const stage of Object.keys(SCENARIO5_BELIEF_COPY_FA) as (keyof typeof SCENARIO5_BELIEF_COPY_FA)[]) {
    const markup = renderBelief(stage);
    check(markup.includes(SCENARIO5_BELIEF_COPY_FA[stage].title), `${stage} contextual title`);
    equal((markup.match(/type="range" min="0" max="100" step="1"/g) ?? []).length, 3, `${stage} three bounded integer sliders`);
    equal((markup.match(/aria-valuetext="ثبت نشده"/g) ?? []).length, 3, `${stage} announces three uninitialized responses`);
    equal((markup.match(/name="s5-belief-corridor"/g) ?? []).length, 4, `${stage} has four corridor cards`);
    check(!/checked=""|type="number"|<select/.test(markup), `${stage} no default corridor or numeric/dropdown controls`);
    check(/disabled=""/.test(markup), `${stage} submit initially disabled`);
    check(/class="s5-control-footer"/.test(markup), `${stage} sticky primary action`);
  }
  equal((belief.match(/useState<number \| null>\(null\)/g) ?? []).length, 3, "All three semantic response states are null");
  check(belief.includes("corridorId !== null && corridorConfidence !== null && targetedEstimate !== null && targetedConfidence !== null"), "Submit requires all four answers");
  check(belief.includes('value={value ?? 50}') && belief.includes('value === null ? "ثبت نشده"'), "50 is only the native range display value");
  check(belief.includes("onPointerDown") && belief.includes("onKeyDown") && belief.includes('"ArrowRight"'), "Pointer midpoint and keyboard register a real response");
  check(reason.includes("<ScenarioFiveInformationPicture evidence={evidence} />") && reason.includes('className="s5-control-footer"'), "Reason keeps read-only evidence and sticky submit");
  check(outcome.indexOf("اقدام اجراشده") < outcome.indexOf("اطلاعات تازه") && outcome.indexOf("اطلاعات تازه") < outcome.indexOf("تغییرات قابل مشاهده"), "Outcome three blocks in exact order");
  check(outcome.includes('<ScenarioFiveInformationPicture title="شواهد تازه" evidence={newEvidence} />'), "Outcome displays actual new evidence");
  check(outcome.includes("projectedArrivalBefore") && outcome.includes("deadlineMinute") && outcome.includes("deadlineMargin"), "Outcome includes ETA, deadline, and margin");
  check(simulation.includes("preCommitEvidenceIdsRef = useRef") && simulation.includes("investigationEvidenceIdsRef = useRef"), "Evidence snapshots are local UI refs");
  check(simulation.includes("!preCommitEvidenceIdsRef.current.has(item.evidenceId)") && simulation.includes("!investigationEvidenceIdsRef.current.has(item.evidenceId)"), "Fresh evidence is an ID-set difference per decision/investigation");
  const map = read("src/ui/components/scenario/ScenarioFiveMap.tsx");
  check(map.includes("evidence.filter((item) => item.observedCorridorId === corridorId).length") && map.includes("شاهد {evidenceCount}"), "Map route badges count observed visible evidence only");
  check(map.includes("شواهد چندمحوره:") && map.includes("item.observedCorridorId === null"), "Map identifies multi-corridor visible evidence");
  check(!/probability|threatScore|trueWorldState|hiddenProvenance/.test(map), "Map has no risk probabilities or hidden truth");
  const css = read("src/ui/components/scenario/ScenarioFive.css");
  check(/\.s5-control-scroll \{[^}]*min-height: 0;[^}]*overflow-y: auto;[^}]*overflow-x: hidden;[^}]*scrollbar-gutter: stable;[^}]*overscroll-behavior: contain;/s.test(css), "Required internal scrolling CSS");
  check(/\.s5-control-footer \{[^}]*position: sticky;[^}]*bottom: 0;/s.test(css), "Sticky primary actions");
  check(/\.s5-live-shell \{[^}]*height: calc\(100dvh - 116px\);[^}]*overflow: hidden;/s.test(css), "Desktop no-page-scroll shell preserved");
  check(css.includes('.s5-belief-range.s5-untouched::-webkit-slider-thumb { opacity: 0; }') && css.includes('.s5-belief-range.s5-untouched::-webkit-slider-runnable-track { background: #31506c; }'), "Uninitialized slider has neither answer thumb nor colored fill");
  // Serialize the SAME whitelisted view models used as precompletion component props.
  const forbidden = /"(?:worldId|seed|trueWorldState|primaryAffectedCorridorId|actorProfileId|actorInternalState|hiddenProvenance|actorDelayImpactByCorridor|endStateId|cognitive|loadings)"/;
  for (const world of WORLD_CATALOG) {
    let state = createScenario5Runtime({ runId: "firewall", worldId: world.worldId, seed: 71, startedAtMs: 0 });
    const beforeIds = new Set(state.evidence.map((item) => item.evidenceId));
    state = selectRuntimeAction(state, "a1_network_baseline", 10);
    state = confirmRuntimeDecision(state, { actionId: "a1_network_baseline" }, 100, 0);
    const untouched = hash(JSON.stringify(state));
    const view = buildScenario5PlayerView(state);
    const summaries = view.visibleEvidence.map(buildEvidenceSummary);
    const fresh = summaries.filter((item) => !beforeIds.has(item.evidenceId));
    const outcomeView = buildScenario5OutcomeView(state);
    const props = {
      map: { convoys: view.convoys, evidence: summaries, worldClockMinutes: view.resources.worldClockMinutes, highlightedCorridorId: null, globalRoutePulse: false },
      information: { evidence: summaries }, outcome: { outcome: outcomeView, newEvidence: fresh },
      belief: { stageId: "belief:A2_prebelief", evidence: summaries, recentEvidenceIds: [] },
      reason: { context: { actionId: "a1_network_baseline", targetCorridorId: null }, evidence: summaries }, glossary: {},
    };
    check(!forbidden.test(JSON.stringify(props)), `Player-information firewall ${world.worldId}`);
    equal(hash(JSON.stringify(state)), untouched, `Presentation is pure ${world.worldId}`);
    for (const change of outcomeView.convoyChanges) equal(change.deadlineMargin, change.deadlineMinute - change.projectedArrivalAfter, `Presentation margin ${world.worldId}/${change.corridorId}`);
    const pre = renderBelief("belief:A2_prebelief", summaries);
    equal((pre.match(/class="s5-information-summary"/g) ?? []).length, summaries.length, `Prebelief evidence visible ${world.worldId}`);
    const post = renderBelief("belief:A2_postbelief", summaries, new Set(fresh.map((e) => e.evidenceId)));
    check(post.includes("شواهد تازه از بررسی اخیر") && post.includes("شواهد قبلی"), `Postbelief groups ${world.worldId}`);
    const empty = renderToStaticMarkup(React.createElement(ScenarioFiveInformationPicture, { evidence: [] }));
    check(empty.includes("هنوز شاهد مشخصی") && !empty.includes("s5-information-summary"), "No synthetic evidence for empty information picture");
  }
  const inspection = JSON.parse(read("docs/scenario5-phase8c-screenshots/inspection.json"));
  equal(inspection.snapshots.length, 10, "Ten required browser captures");
  for (const item of inspection.snapshots) {
    check(!item.hiddenTruthInDom && !item.hasNumericBeliefInput, `${item.stage} DOM firewall and range controls`);
    if (item.stage !== "intro") check(item.noPageScroll, `${item.stage} no document scroll`);
  }
  equal(inspection.playerInformationFirewall, "PASS", "Actual mounted component props serialized and safe");
  check(inspection.glossaryTelemetryUnchanged && inspection.explicitEvidenceOpenEvents === 1, "Browser glossary/read-only telemetry parity");
  check(inspection.beliefEntryTelemetryUnchanged, "Real slider/card editing generates no telemetry");
  check(inspection.realRunCompleted && inspection.completionEvents === 1, "Real browser reaches AAR with exactly one completion event");
  for (const item of inspection.supplemental) check(item.document.scrollWidth <= item.viewport.width, `${item.stage} accepted mobile horizontal bounds`);
  for (const item of inspection.layoutChecks) check(item.scrollHeight <= item.height && item.scrollWidth <= item.width, `${item.width}x${item.height} desktop page fits`);
  check(inspection.scrollTest.scroll.after > inspection.scrollTest.scroll.initial, "Actual left pane scrolls");
  equal(inspection.scrollTest.before, inspection.scrollTest.after, "Map/header stationary during left scroll");
  const phase7 = read("scripts/verify-s5-phase7-ui.ts");
  equal((phase7.match(/\b(?:check|equal)\(/g) ?? []).length, (baseline.phase7Original.match(/\b(?:check|equal)\(/g) ?? []).length, "Every Phase-7 assertion retained; retired control assertions migrated one for one");
  const report = { status: "PASS", assertions, scientificOutputParity: "PASS", completeRuns: 64, frozenFiles: Object.keys(baseline.frozen).length, appBoundary: "id=5 metadata only (explicit user clarification)", phase8bArchiveIntegrity: "PASS", playerInformationFirewall: "PASS" };
  writeFileSync("docs/scenario5-phase8c-verifier-result.json", JSON.stringify(report, null, 2));
  console.log(`Scenario 5 Phase 08C UI verifier passed: ${assertions} assertions. SCIENTIFIC_OUTPUT_PARITY = PASS (64 runs).`);
}
