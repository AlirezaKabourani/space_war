import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { WORLD_CATALOG } from '../src/ui/components/scenario/scenario-five/model/index';
import { MISSION_POLICIES } from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies';
import { simulateScenario5 } from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver';
import { verifyPresentation } from './verify-s5-phase8d-presentation';
import { ScenarioFiveInformationPicture } from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveInformationPicture';
import { ScenarioFiveMissionEnding } from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveMissionEnding';
import { ScenarioFiveOperationalTime } from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveTime';
import { ScenarioFiveResourcePanel } from '../src/ui/components/scenario/ScenarioFiveResourcePanel';
import { buildScenario5PlayerView, buildEvidenceSummary } from '../src/ui/components/scenario/scenario-five/ui/presentation';
import { ENDING_CONDITIONS } from '../src/ui/components/scenario/scenario-five/ui/endingAlternatives';
import { ENDING_TITLES } from '../src/ui/components/scenario/scenario-five/ui/endingPresentation';
import type { Scenario5RuntimeState } from '../src/ui/components/scenario/scenario-five/model/runtime';

(globalThis as unknown as { React: typeof React }).React = React;
const read = (p: string) => readFileSync(p, 'utf8');
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const before = JSON.parse(read('docs/scenario5-phase8d2-ux-baseline.json'));
const scientific = JSON.parse(read('docs/scenario5-phase8d-baseline.json'));
let checks = 0;
const equal = (a: unknown, b: unknown, label: string) => { assert.deepEqual(a,b,label); checks++; };
const check = (value: unknown, label: string) => { assert.ok(value,label); checks++; };
for (const [p,h] of Object.entries(scientific.frozen)) equal(digest(readFileSync(p)),h,'Protected/frozen '+p);
equal(digest(readFileSync('src/App.tsx')),before.hashes['src/App.tsx'],'App including legacy id=2 and active id=5 unchanged');
function calls(code: string, name: string) {
  const tree=ts.createSourceFile('source.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), found:string[]=[];
  const visit=(n:ts.Node) => {if(ts.isCallExpression(n)&&n.expression.getText(tree)===name)found.push(n.getText(tree));ts.forEachChild(n,visit);};visit(tree);return found;
}
for(const p of ['src/ui/components/scenario/ScenarioFiveSimulation.tsx','src/ui/components/scenario/ScenarioFiveMap.tsx']) {
  const original=Buffer.from(before.sources[p],'base64').toString('utf8');
  for(const api of ['useState','useEffect','useCallback','setRuntime','log','confirmRuntimeDecision','submitRuntimeBelief','submitRuntimeReason','continueRuntimeAfterOutcome','openRuntimeEvidence','closeRuntimeEvidence'])
    equal(calls(read(p),api),calls(original,api),'Unchanged runtime/timing/telemetry API '+api+' in '+p);
}
equal(Object.keys(ENDING_CONDITIONS).sort(),Object.keys(ENDING_TITLES).sort(),'Copy describes exactly the existing six endings');
const preStates:Scenario5RuntimeState[]=[];
const runs=WORLD_CATALOG.flatMap(world=>MISSION_POLICIES.filter(p=>!p.oraclePolicy&&!p.stressPolicy&&!p.randomPolicy).map(policy=>simulateScenario5({worldId:world.worldId,environmentSeed:1,policy,onPreDecision:state=>{if(preStates.length<8)preStates.push(state);}})));
equal(runs.map(run=>({worldId:run.worldId,policy:run.policyId,digest:digest(JSON.stringify(run))})),scientific.corpus,'Same 112 complete run digests; no semantic mismatches');
const savedWitness=readFileSync('docs/scenario5-phase8d-witnesses.json');let accepted;
try { accepted=verifyPresentation(runs); } finally {writeFileSync('docs/scenario5-phase8d-witnesses.json',savedWitness);}
equal(accepted.assertions,32798,'Accepted 08D presentation assertions unchanged');
for(const run of runs) {
  const snapshot=JSON.stringify(run),view=buildScenario5PlayerView(run.state),evidence=view.visibleEvidence.map(buildEvidenceSummary);
  const markup=renderToStaticMarkup(<ScenarioFiveInformationPicture evidence={evidence} />);
  equal((markup.match(/data-evidence-summary=/g)??[]).length,evidence.length,'Every evidence item retained exactly once');
  for(const item of evidence) check(markup.includes(`data-evidence-summary="${item.evidenceId}"`),'Evidence id retained in group');
  const html=renderToStaticMarkup(<ScenarioFiveMissionEnding state={run.state} result={run.result} onCognitiveEntry={()=>{}} onComplete={()=>{}} />);
  equal((html.match(/class="s5-ending-alternative"/g)??[]).length,5,'Five other endings, realized ending excluded');
  check(html.includes(`data-ending-id="${run.result.missionEndState.endStateId}"`),'Actual frozen resolver ending retained');
  for(const [id,condition] of Object.entries(ENDING_CONDITIONS)) {
    const isActual=id===run.result.missionEndState.endStateId;
    equal(html.includes(condition),!isActual,'Alternative condition copy only for other endings');
  }
  equal(JSON.stringify(run),snapshot,'Grouping and completed report do not mutate runtime/result');
}
for(const state of preStates) {
  const view=buildScenario5PlayerView(state),text=renderToStaticMarkup(<ScenarioFiveResourcePanel resources={view.resources} />);
  check(text.includes(`T+${view.resources.worldClockMinutes}`)&&text.includes('از 360 دقیقه')&&text.includes('زمان باقی‌مانده'),'Canonical time and explicit labels');
  assert.throws(()=>renderToStaticMarkup(<ScenarioFiveMissionEnding state={state} result={runs[0]!.result} onCognitiveEntry={()=>{}} onComplete={()=>{}} />));checks++;
}
check(renderToStaticMarkup(<ScenarioFiveOperationalTime minutes={30} />).includes('از 360 دقیقه'),'Time convention retains T+ and horizon');
const info=read('src/ui/components/scenario/scenario-five/ui/ScenarioFiveInformationPicture.tsx');
check(!/eventLogger|openRuntimeEvidence|onOpen|hiddenProvenance|trueWorldState/.test(info),'Corridor grouping is strictly passive and public');
const result={status:'PASS',phase:'PHASE 08D.2 — Scenario 2 UI/UX refinement and ending explanation pass',assertions:checks,accepted08DAssertions:accepted.assertions,scientificParity:{runs:runs.length,mismatches:0,worlds:16,policyFamilies:7,seed:1},frozenHashes:Object.keys(scientific.frozen).length,legacyId2:'UNCHANGED',runtimeAndTelemetryHandlers:'UNCHANGED',cognitiveFormulas:'UNCHANGED',endStateSemantics:'UNCHANGED',liveTruthFirewall:'PASS'};
writeFileSync('docs/scenario5-phase8d2-ux-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
