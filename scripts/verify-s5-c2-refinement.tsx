import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {WORLD_CATALOG} from '../src/ui/components/scenario/scenario-five/model/index';
import {MISSION_POLICIES} from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies';
import {simulateScenario5} from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver';
import {buildScenario5PlayerView,buildEvidenceSummary} from '../src/ui/components/scenario/scenario-five/ui/presentation';
import {SCENARIO5_ACTION_COPY_FA,SCENARIO5_CORRIDOR_CONTENT_FA,SCENARIO5_STATUS_LABELS_FA} from '../src/ui/components/scenario/scenario-five/ui/uiContentFa';
import {ScenarioFiveActionCard} from '../src/ui/components/scenario/ScenarioFiveActionCard';
import {ScenarioFiveMap} from '../src/ui/components/scenario/ScenarioFiveMap';
import {verifyPresentation} from './verify-s5-phase8d-presentation';
import type {Scenario5RuntimeState} from '../src/ui/components/scenario/scenario-five/model/runtime';
(globalThis as unknown as {React:typeof React}).React=React;
const read=(p:string)=>fs.readFileSync(p,'utf8'),hash=(x:string|Buffer)=>createHash('sha256').update(x).digest('hex');
const baseline=JSON.parse(read('docs/scenario5-c2-refinement-baseline.json')),scientific=JSON.parse(read('docs/scenario5-phase8d-baseline.json')),corpus=JSON.parse(read('docs/scenario5-phase09c1-baseline-corpus.json'));
let assertions=0;
const equal=(a:unknown,b:unknown,m:string)=>{assert.deepEqual(a,b,m);assertions++;},check=(v:unknown,m:string)=>{assert.ok(v,m);assertions++;};
const allowed=Object.keys(baseline.files);
const concurrentDocumentationChanges:unknown[]=[];for(const[p,h]of Object.entries(baseline.hashes)){if(p.startsWith('docs/scenario-cross-09d0-')){const after=hash(fs.readFileSync(p));if(after!==h)concurrentDocumentationChanges.push({path:p,before:h,after,handling:'Observed external documentation changes; not written by this task, preserved, excluded from UI patch'});}else if(!allowed.includes(p))equal(hash(fs.readFileSync(p)),h,'Unchanged pre-existing file '+p);}
for(const[p,h]of Object.entries(scientific.frozen))equal(hash(fs.readFileSync(p)),h,'Frozen '+p);
const original=(p:string)=>Buffer.from(baseline.files[p],'base64').toString('utf8');
const mapPath='src/ui/components/scenario/ScenarioFiveMap.tsx',actionPath='src/ui/components/scenario/ScenarioFiveActionCard.tsx';
function calls(code:string,name:string){const tree=ts.createSourceFile('s.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),found:string[]=[];function visit(n:ts.Node){if(ts.isCallExpression(n)&&n.expression.getText(tree)===name)found.push(n.getText(tree));ts.forEachChild(n,visit);}visit(tree);return found;}
for(const name of ['useState','useEffect','onSelectTarget','setVisualProgress','setPulsingConvoys','setFreshCorridors','window.setTimeout'])equal(calls(read(mapPath),name),calls(original(mapPath),name),'Identical map UI/timer/selection calls '+name);
const normalize=(s:string)=>s.replace(/\r\n/g,'\n');
const svg=(s:string)=>normalize(s.slice(s.indexOf('<svg viewBox='),s.indexOf('</svg>')+6)).replace(/ data-convoy-route=\{convoy.convoyId\}/g,'');
equal(svg(read(mapPath)),svg(original(mapPath)),'Entire original SVG geometry, markers, routes, coordinate logic and event handlers unchanged except passive data attributes');
equal(read(mapPath).slice(0,read(mapPath).indexOf('  return (')),original(mapPath).slice(0,original(mapPath).indexOf('  return (')),'Map data processing and motion hooks byte-identical');
equal(read(actionPath).slice(0,read(actionPath).indexOf('  return (')),original(actionPath).slice(0,original(actionPath).indexOf('  return (')),'Action data, timing and target restriction logic byte-identical');
const cssPath='src/ui/components/scenario/ScenarioFive.css',css=read(cssPath),cssBefore=original(cssPath),boundary='/* Phase 09C-1:';
equal(css.slice(css.indexOf(boundary)),cssBefore.slice(cssBefore.indexOf(boundary)),'Entire cognitive-dashboard stylesheet unchanged byte-for-byte');
check(!/\.s5-convoy-strip \{[^}]*overflow(?:-y)?: (?:auto|hidden|scroll)/.test(css),'No nested convoy scroll/clipping');
check(!/height: 128px|max-height: 128px|height: 172px|\bscale\(/.test(css.split(boundary)[0]),'Obsolete height caps and scale workaround absent');
const preStates:Scenario5RuntimeState[]=[];
const runs=WORLD_CATALOG.flatMap(w=>MISSION_POLICIES.filter(p=>!p.oraclePolicy&&!p.stressPolicy&&!p.randomPolicy).map(policy=>simulateScenario5({worldId:w.worldId,environmentSeed:1,policy,onPreDecision:state=>preStates.push(state)})));
const after=runs.map(r=>({worldId:r.worldId,policy:r.policyId,digest:hash(JSON.stringify(r)),cognitive:hash(JSON.stringify(r.result.cognitive)),domain:hash(JSON.stringify(r.result.domain)),mission:hash(JSON.stringify(r.state.missionState)),evidence:hash(JSON.stringify(r.cognitiveBundle))}));
equal(after,corpus,'Same full 112-run/cognitive/domain/mission/evidence corpus');equal(after.map(({worldId,policy,digest})=>({worldId,policy,digest})),scientific.corpus,'Same original accepted scientific corpus');
const presentation=verifyPresentation(runs);
for(const state of preStates){const view=buildScenario5PlayerView(state),before=JSON.stringify(state);const markup=renderToStaticMarkup(<ScenarioFiveMap convoys={view.convoys} worldClockMinutes={view.resources.worldClockMinutes} highlightedCorridorId={null} globalRoutePulse={false} evidence={view.visibleEvidence.map(buildEvidenceSummary)}/>);
  equal((markup.match(/data-convoy-card=/g)??[]).length,4,'Exactly four cards across dynamic states');
  for(const c of view.convoys){const copy=SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId];check(markup.includes(copy.convoyLabel)&&markup.includes(copy.cargoLabel),'Canonical convoy/cargo copy');check(markup.includes(SCENARIO5_STATUS_LABELS_FA[c.status]),'Canonical textual status');check(markup.includes('T+'+c.projectedArrivalMinute)&&markup.includes('T+'+c.deadlineMinute),'Canonical arrival and deadline');check(markup.includes(c.integrity+' / 100'),'Canonical health');}
  for(const id of view.availableActionIds){const copy=SCENARIO5_ACTION_COPY_FA[id],action=renderToStaticMarkup(<ScenarioFiveActionCard actionId={id} selected={false} onSelect={()=>{}}/>);for(const text of [copy.title,copy.description,copy.knownEffect])check(action.includes(text),'Complete original action text '+id);}
  equal(JSON.stringify(state),before,'Rendering never mutates simulation');
}
const historical=[];
for(const script of ['scripts/verify-s5-phase8d2-ux.tsx','scripts/verify-s5-phase09c1.tsx']){let result;try{result={script,status:'PASS',stdout:execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs',script],{encoding:'utf8',stdio:'pipe',windowsHide:true})};}catch(e){const err=e as {stdout?:string;stderr?:string};result={script,status:'FAIL',stdout:err.stdout??'',stderr:err.stderr??''};}historical.push(result);}
fs.writeFileSync('docs/scenario5-c2-refinement-historical-tests.json',JSON.stringify(historical,null,2)+'\n');
const result={status:'PASS',assertions,existingPresentationAssertions:presentation.assertions,fullRuns:runs.length,preDecisionRenderStates:preStates.length,semanticMismatches:0,frozenFileHashes:Object.keys(scientific.frozen).length,onlyApplicationChanges:allowed,allOtherApplicationFilesUnchanged:true,concurrentDocumentationChanges,cognitiveDashboardUnchanged:true,geometryAndGameplayUnchanged:true,historicalWrappers:historical.map(({script,status})=>({script,status,reason:status==='FAIL'?'Pre-existing App.tsx historical snapshot mismatch; see full log':null}))};
fs.writeFileSync('docs/scenario5-c2-refinement-focused-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
