import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WORLD_CATALOG, CANONICAL_CORRIDORS } from "../src/ui/components/scenario/scenario-five/model/index.ts";
import { MISSION_ACTION_CATALOG, INITIAL_CONVOY_CONFIG, BASE_ROUND_MINUTES, validateMissionAction } from "../src/ui/components/scenario/scenario-five/model/mission/index.ts";
import { SCENARIO5_OPTION_PROFILES } from "../src/ui/components/scenario/scenario-five/model/cognitive/index.ts";
import { RUNTIME_STAGE_SEQUENCE, DECISION_STAGE_METADATA, BELIEF_STAGE_METADATA, getRuntimeAvailableActionIds, createScenario5Runtime, selectRuntimeAction, confirmRuntimeDecision, submitRuntimeBelief } from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import type { Scenario5RuntimeState } from "../src/ui/components/scenario/scenario-five/model/runtime/index.ts";
import { MISSION_POLICIES, simulateScenario5, missionEffectivePolicySeed } from "../src/ui/components/scenario/scenario-five/calibration/index.ts";
import { buildScenario5PlayerView, buildScenario5OutcomeView, buildScenario5AarView } from "../src/ui/components/scenario/scenario-five/ui/presentation.ts";
import * as copy from "../src/ui/components/scenario/scenario-five/ui/uiContentFa.ts";
import { ScenarioFiveMap } from "../src/ui/components/scenario/ScenarioFiveMap.tsx";
import { ScenarioFiveResourcePanel } from "../src/ui/components/scenario/ScenarioFiveResourcePanel.tsx";
import { ScenarioFiveActionCard } from "../src/ui/components/scenario/ScenarioFiveActionCard.tsx";
import { ScenarioFiveSummary } from "../src/ui/components/scenario/ScenarioFiveSummary.tsx";

export const read = (p: string) => readFileSync(p, "utf8");
export const walk = (p: string): string[] => readdirSync(p, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(`${p}/${e.name}`) : [`${p}/${e.name}`]);
const sha = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
export const write = (p: string, s: string) => writeFileSync(`docs/${p}`, s, "utf8");
export const csv = (p: string, rows: Record<string, unknown>[], columns = Object.keys(rows[0] ?? {})) => {
  const cell = (v: unknown) => `"${String(v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : v).replaceAll('"', '""')}"`;
  write(p, `${columns.map(cell).join(",")}\n${rows.map((r) => columns.map((c) => cell(r[c])).join(",")).join("\n")}\n`);
};
const hashesPath = "docs/scenario5-current-audit-source-hashes.json";
const protectedPaths = [...walk("src"), ...walk("scripts").filter((p) => !p.includes("audit-s5-current-flow")), ...walk("docs").filter((p) => /scenario5-phase/.test(p)), "package.json", "package-lock.json"].filter(existsSync).sort();
if (!existsSync(hashesPath)) writeFileSync(hashesPath, JSON.stringify({ before: Object.fromEntries(protectedPaths.map((p) => [p, sha(readFileSync(p))])) }, null, 2));
const before = JSON.parse(read(hashesPath)).before as Record<string, string>;
for (const [p, h] of Object.entries(before)) assert.equal(sha(readFileSync(p)), h, `Read-only boundary before extraction: ${p}`);
if (process.argv.includes("--hashes-only")) {
  writeFileSync(hashesPath, JSON.stringify({ before, after: Object.fromEntries(Object.keys(before).map((p) => [p, sha(readFileSync(p))])), status: "PASS" }, null, 2));
  console.log(`READ_ONLY_SOURCE_FREEZE = PASS (${Object.keys(before).length} files)`);
  process.exit(0);
}
(globalThis as unknown as { React: typeof React }).React = React;

const sync = Object.fromEntries("ABCDEFGHIJKLMNOPQ".split("").map((id) => [id, { checks: 0, failed: 0, failures: [] as string[] }]));
function check(id: string, pass: boolean, context: string) {
  sync[id]!.checks++;
  if (!pass) { sync[id]!.failed++; sync[id]!.failures.push(context); }
}
const strip = (s: string) => s.replace(/<[^>]*>/g, "").replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&");
const noOp = () => {};
const records: Record<string, unknown>[] = [];
const runs: any[] = [];
let captured: Scenario5RuntimeState[] = [];
// Add an observer to an IN-MEMORY copy of the existing calibration driver.
// No selection, chronology, RNG, evidence, reason, or belief logic is replaced.
const driverPath = "src/ui/components/scenario/scenario-five/calibration/simulationDriver.ts";
let driver = read(driverPath);
assert.equal(driver.split('while (state.stage.stageId !== "complete") {').length, 2);
driver = driver.replace('while (state.stage.stageId !== "complete") {', 'while (state.stage.stageId !== "complete") {\n__auditStage(state);');
driver = driver.replace('  const result = calculateScenario5RuntimeResult(state);', '  __auditStage(state);\n  const result = calculateScenario5RuntimeResult(state);');
const compiled = ts.transpileModule(driver, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const auditModule = { exports: {} as { simulateScenario5: typeof simulateScenario5 } };
new Function("require", "module", "exports", "__auditStage", compiled)(createRequire(resolve(driverPath)), auditModule, auditModule.exports, (state: Scenario5RuntimeState) => captured.push(state));
// Execute the real map body/effects with persistent audit-only hooks. This observes
// its current formulas across a whole run rather than re-mounting an SSR map each stage.
const mapPath="src/ui/components/scenario/ScenarioFiveMap.tsx";
const mapCompiled=ts.transpileModule(read(mapPath),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function persistentMap(){
  const slots:any[]=[];let cursor=0;let pending:(()=>void)[]=[];
  const hooks={...React,
    useRef:(initial:any)=>{const index=cursor++;return slots[index]??(slots[index]={current:initial});},
    useState:(initial:any)=>{const index=cursor++;if(!(index in slots))slots[index]=typeof initial==="function"?initial():initial;return[slots[index],(next:any)=>{slots[index]=typeof next==="function"?next(slots[index]):next;}];},
    useEffect:(effect:()=>any,deps:any[])=>{const index=cursor++;const old=slots[index];if(!old||deps.some((d,i)=>!Object.is(d,old.deps[i]))){pending.push(()=>{old?.cleanup?.();slots[index]={deps,cleanup:effect()};});}},
  };
  const module={exports:{} as any};const originalRequire=createRequire(resolve(mapPath));
  new Function("require","module","exports","window",mapCompiled)((id:string)=>id==="react"?hooks:originalRequire(id),module,module.exports,{setTimeout:()=>0,clearTimeout:()=>{}});
  return(props:any)=>{
    cursor=0;pending=[];module.exports.ScenarioFiveMap(props);pending.forEach(fn=>fn());
    cursor=0;pending=[];const tree=module.exports.ScenarioFiveMap(props);
    const markers:any[]=[];
    const visit=(node:any)=>{if(Array.isArray(node)){node.forEach(visit);return;}if(!node||!node.props)return;if(node.props["data-convoy-id"])markers.push(node.props);visit(node.props.children);};visit(tree);
    return markers;
  };
}
const policies = MISSION_POLICIES.filter((p) => ["balanced_network", "priority_alpha", "information_heavy", "mobility_resilience", "resource_preserver", "high_response", "low_response_reversible", "M10_uniform_random"].includes(p.policyId));
assert.equal(policies.length, 8);
for (const [policyIndex, policy] of policies.entries()) for (const [worldIndex, world] of WORLD_CATALOG.entries()) {
  captured = [];
  const policySeed = policy.randomPolicy ? missionEffectivePolicySeed(worldIndex, 1, 1001) : undefined;
  const options = { policy, worldId: world.worldId, environmentSeed: 1, ...(policySeed === undefined ? {} : { policySeed }) };
  const run = auditModule.exports.simulateScenario5(options);
  const reference = simulateScenario5(options);
  assert.deepEqual(run, reference, "Observation must not change ANY current driver output");
  assert.deepEqual(captured.map((s) => s.stage.stageId), RUNTIME_STAGE_SEQUENCE);
  const traceId = `${policyIndex < 7 ? `M${policyIndex + 1}` : "M10"}-W${String(worldIndex + 1).padStart(2, "0")}-E1`;
  let priorProgress: Record<string, number> = {};
  const renderPersistentMap=persistentMap();
  let lastCommitEvidence = new Set<string>();
  const stageRows: any[] = [];
  for (const [sequence, state] of captured.entries()) {
    const previous = captured[sequence - 1] ?? state;
    const next = captured[sequence + 1] ?? state;
    const view = buildScenario5PlayerView(state);
    const committed = state.stage.stageId === "outcome_review" ? state.domainDecisionRecords.at(-1) : undefined;
    const nextDecision = run.decisionTrace.find((d) => d.roundId === view.roundId);
    const belief = next.beliefs.length > state.beliefs.length ? next.beliefs.at(-1) : undefined;
    const reason = next.reasons.length > state.reasons.length ? next.reasons.at(-1) : undefined;
    if (state.stage.stageId.startsWith("decision:")) lastCommitEvidence = new Set(state.evidence.map((e) => e.evidenceId));
    const fresh = state.stage.stageId === "outcome_review" ? state.evidence.filter((e) => !lastCommitEvidence.has(e.evidenceId)) : [];
    const resourceMarkup = renderToStaticMarkup(React.createElement(ScenarioFiveResourcePanel, { resources: view.resources }));
    const resourceText = strip(resourceMarkup);
    check("A", resourceText.includes(`T+${state.missionState.worldClockMinutes}`), `${traceId}/${sequence}`);
    check("B", resourceText.includes(`${Math.max(0, 360 - state.missionState.worldClockMinutes)}′`), `${traceId}/${sequence}`);
    const mapMarkup = renderToStaticMarkup(React.createElement(ScenarioFiveMap, { convoys: view.convoys, evidence: view.visibleEvidence, worldClockMinutes: view.resources.worldClockMinutes, highlightedCorridorId: null, globalRoutePulse: false }));
    const persistentMarkers=renderPersistentMap({convoys:view.convoys,evidence:view.visibleEvidence,worldClockMinutes:view.resources.worldClockMinutes,highlightedCorridorId:null,globalRoutePulse:false});
    const badgeCounts=[...strip(mapMarkup).matchAll(/شاهد\s+(\d+)/g)].map(m=>Number(m[1]));
    const expectedBadges=view.convoys.map(c=>state.evidence.filter(e=>e.observedCorridorId===c.corridorId).length).filter(Boolean);
    for (const convoy of view.convoys) {
      const model = state.missionState.convoys.find((c) => c.convoyId === convoy.convoyId)!;
      const fragment = mapMarkup.match(new RegExp(`<article[^>]*class="s5-convoy-mini s5-status-${convoy.status}"[^>]*>[\\s\\S]*?<\\/article>`, "g"))?.find((s) => s.includes(copy.SCENARIO5_CORRIDOR_CONTENT_FA[convoy.corridorId].convoyLabel)) ?? "";
      const text = strip(fragment);
      check("C", convoy.projectedArrivalMinute === model.baselineArrivalMinute + model.delayMinutes && text.includes(`ETA T+${convoy.projectedArrivalMinute}`), `${traceId}/${sequence}/${convoy.convoyId}`);
      check("D", convoy.deadlineMinute === model.deadlineMinute && text.includes(`D T+${model.deadlineMinute}`), `${traceId}/${sequence}/${convoy.convoyId}`);
      check("E", convoy.integrity === model.integrity && text.includes(`یکپارچگی ${model.integrity}`), `${traceId}/${sequence}/${convoy.convoyId}`);
      check("F", convoy.delayMinutes === model.delayMinutes && text.includes(`تأخیر ${model.delayMinutes}′`), `${traceId}/${sequence}/${convoy.convoyId}`);
      check("G", mapMarkup.includes(`s5-convoy-marker s5-status-${model.status}`) && text.includes(copy.SCENARIO5_STATUS_LABELS_FA[model.status]), `${traceId}/${sequence}/${convoy.convoyId}`);
      const desired = model.status === "delivered" ? 1 : Math.max(0, Math.min(.97, view.resources.worldClockMinutes / Math.max(convoy.projectedArrivalMinute, 1)));
      const visual = model.status === "delivered" ? 1 : model.status === "held" ? priorProgress[model.convoyId] ?? desired : Math.max(priorProgress[model.convoyId] ?? desired, desired);
      const actualMarker=persistentMarkers.find(m=>m["data-convoy-id"]===model.convoyId);
      check("H", actualMarker?.["data-visual-progress"]===visual && visual >= 0 && visual <= 1 && !JSON.stringify(state).includes('"visualProgress"'), `${traceId}/${sequence}/${convoy.convoyId}`);
      priorProgress[model.convoyId] = visual;
      const count = state.evidence.filter((e) => e.observedCorridorId === model.corridorId).length;
      check("I", view.visibleEvidence.filter((e) => e.observedCorridorId === model.corridorId).length === count && JSON.stringify(badgeCounts)===JSON.stringify(expectedBadges), `${traceId}/${sequence}/${convoy.convoyId}`);
    }
    check("J", JSON.stringify(view.visibleEvidence.map((e) => e.evidenceId)) === JSON.stringify(state.evidence.map((e) => e.evidenceId)), `${traceId}/${sequence}`);
    if (committed) {
      const outcome = buildScenario5OutcomeView(state);
      check("K", fresh.length === outcome.newEvidenceCount && JSON.stringify(fresh.map((e) => e.evidenceId)) === JSON.stringify(committed.newVisibleEvidenceIds), `${traceId}/${sequence}`);
    }
    if (state.stage.stageId.startsWith("decision:")) for (const id of getRuntimeAvailableActionIds(state)) {
      const config = MISSION_ACTION_CATALOG.find((a) => a.actionId === id)!;
      const text = strip(renderToStaticMarkup(React.createElement(ScenarioFiveActionCard, { actionId: id, selected: false, onSelect: noOp })));
      check("L", text.includes(`ISR: ${config.isrCost}`) && text.includes(`پشتیبانی: ${config.supportCost}`) && text.includes(`مدت: ${config.durationMinutes} دقیقه`), `${traceId}/${sequence}/${id}`);
      if (config.target === "fixed_alpha") {
        check("M", text.includes("هدف ثابت: کریدور شرقی / کاروان الف"), `${traceId}/${sequence}/${id}`);
        assert.throws(() => validateMissionAction(state.missionState, { actionId: id, targetCorridorId: "corridor_beta_south" }));
      }
      if (config.target === "required") {
        const selected = selectRuntimeAction(state, id, Math.max(state.stage.enteredAtMs, state.runtimeEvents.at(-1)!.atMs) + 1);
        let rejected = false;
        try { confirmRuntimeDecision(selected, { actionId: id }, selected.runtimeEvents.at(-1)!.atMs + 1, 0); } catch { rejected = true; }
        check("N", rejected, `${traceId}/${sequence}/${id}`);
      }
    }
    const row: Record<string, unknown> = {
      traceId, policyId: policy.policyId, worldId: world.worldId, actorProfile: world.actorProfileId,
      primaryCorridor: world.primaryAffectedCorridorId, environmentSeed: 1, runtimeSequence: sequence + 1, runtimeStageId: state.stage.stageId,
      phase: view.phaseId ?? "", round: view.roundId ?? "", selectedAction: committed?.actionId ?? state.pendingDecision?.selection.actionId ?? (state.stage.stageId.startsWith("decision:") ? nextDecision?.actualActionId : ""),
      selectedTarget: committed?.effectiveTargetCorridorId ?? state.pendingDecision?.selection.targetCorridorId ?? (state.stage.stageId.startsWith("decision:") ? nextDecision?.targetCorridorId : ""),
      isrBefore: committed?.resourcesBefore.isrCapacity ?? previous.missionState.resources.isrCapacity, isrAfter: state.missionState.resources.isrCapacity,
      supportBefore: committed?.resourcesBefore.supportReserve ?? previous.missionState.resources.supportReserve, supportAfter: state.missionState.resources.supportReserve,
      clockBefore: committed?.worldClockBefore ?? previous.missionState.worldClockMinutes, clockAfter: state.missionState.worldClockMinutes,
    };
    for (const c of view.convoys) for (const [suffix, value] of Object.entries({ Status: c.status, Integrity: c.integrity, Delay: c.delayMinutes, ETA: c.projectedArrivalMinute })) row[`${c.convoyId}${suffix}`] = value;
    Object.assign(row, {
      visibleEvidenceCount: state.evidence.length, newVisibleEvidenceCount: fresh.length, visibleEvidenceIds: state.evidence.map((e) => e.evidenceId),
      beliefCorridor: belief?.mostLikelyCorridorId, beliefCorridorConfidence: belief?.corridorConfidence, beliefTargetedEstimate: belief?.targetedInterferenceEstimate, beliefTargetedConfidence: belief?.targetedInterferenceConfidence,
      reasonId: reason?.reasonId, observableOutcomeSummary: committed ? buildScenario5OutcomeView(state) : "", endStateIfComplete: state.stage.stageId === "complete" ? run.result.missionEndState.endStateId : "",
      auditHiddenFields: "worldId|actorProfile|primaryCorridor|environmentSeed; research only", policySeed: policySeed ?? "", availableActionIds: view.availableActionIds,
      nextStage: next.stage.stageId, evidenceOpenCount: state.evidenceOpens.length,
    });
    records.push(row); stageRows.push(row);
  }
  const aarText = strip(renderToStaticMarkup(React.createElement(ScenarioFiveSummary, { runtimeState: run.state, result: run.result, onComplete: noOp })));
  check("Q", aarText.includes(copy.SCENARIO5_END_STATE_LABELS_FA[run.result.missionEndState.endStateId]) && buildScenario5AarView(run.state, run.result).result === run.result, traceId);
  runs.push({ traceId, policyId: policy.policyId, world, environmentSeed: 1, policySeed, result: run.result, stages: stageRows, evidence: run.state.evidence, finalConvoys: buildScenario5PlayerView(run.state).convoys, decisionTrace: run.decisionTrace });
}
// Boundary payload tests use current runtime APIs; actual UI submission is also checked in the browser.
for (const corridor of CANONICAL_CORRIDORS) for (const value of [0, 1, 49, 50, 51, 99, 100]) {
  const first = runs[0]!;
  let initial = createScenario5Runtime({ runId: "audit-input", worldId: WORLD_CATALOG[0]!.worldId, seed: 1, startedAtMs: 0 });
  const runtimeApi = createRequire(import.meta.url)(resolve("src/ui/components/scenario/scenario-five/model/runtime/index.ts"));
  initial = selectRuntimeAction(initial, "a1_network_baseline", 1);
  initial = confirmRuntimeDecision(initial, { actionId: "a1_network_baseline" }, 2, 0);
  initial = runtimeApi.continueRuntimeAfterOutcome(initial, 3);
  const after = submitRuntimeBelief(initial, { mostLikelyCorridorId: corridor.corridorId, corridorConfidence: value, targetedInterferenceEstimate: value, targetedInterferenceConfidence: value, recordedAtMs: 4 });
  check("O", after.beliefs[0]!.mostLikelyCorridorId === corridor.corridorId, corridor.corridorId);
  check("P", [after.beliefs[0]!.corridorConfidence, after.beliefs[0]!.targetedInterferenceEstimate, after.beliefs[0]!.targetedInterferenceConfidence].every((v) => v === value), `${corridor.corridorId}/${value}`);
}
csv("scenario5-current-path-traces.csv", records);
write("scenario5-current-sync-results.json", JSON.stringify({ status: Object.values(sync).every((v) => v.failed === 0) ? "PASS" : "FAIL", checks: sync, runCount: runs.length, stageRows: records.length, parityWithUninstrumentedDriver: "PASS", policySeedRule: "missionEffectivePolicySeed(worldIndex,1,1001) for M10; current Phase-8B first base seed" }, null, 2));
write("scenario5-current-audit-data.json", JSON.stringify({ copy, runs, stageSequence: RUNTIME_STAGE_SEQUENCE, decisionMetadata: DECISION_STAGE_METADATA, beliefMetadata: BELIEF_STAGE_METADATA, actions: MISSION_ACTION_CATALOG, profiles: SCENARIO5_OPTION_PROFILES, convoyConfig: INITIAL_CONVOY_CONFIG, sync }, null, 2));
console.log(`Read-only extraction: ${runs.length} complete runs, ${records.length} stage rows; observed driver outputs equal untouched driver.`);
