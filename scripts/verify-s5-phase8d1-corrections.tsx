import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import ts from 'typescript';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScenarioFiveMap } from '../src/ui/components/scenario/ScenarioFiveMap.tsx';
import { ScenarioFivePhaseSummary } from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx';
import { ScenarioFiveOutcomeContent } from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveOutcomePanel.tsx';
import { alternateRouteControlPoint, routePresentationPoint, mitigationLabels, ESCORT_ACTIVE, ESCORT_COMPLETED, ESCORT_EXPIRED } from '../src/ui/components/scenario/scenario-five/ui/gameplayPresentation.ts';
import { buildScenario5PlayerView, buildStoredScenario5Outcome } from '../src/ui/components/scenario/scenario-five/ui/presentation.ts';
import { WORLD_CATALOG } from '../src/ui/components/scenario/scenario-five/model/index.ts';
import { MISSION_POLICIES } from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies.ts';
import { simulateScenario5 } from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver.ts';
const snapshotPath='docs/scenario5-phase8d1-baseline.json';
const paths=[
  'src/App.tsx',
  'src/ui/components/scenario/ScenarioFiveMap.tsx',
  'src/ui/components/scenario/ScenarioFiveSimulation.tsx',
  'src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx',
  'src/ui/components/scenario/scenario-five/ui/gameplayPresentation.ts',
  'src/ui/components/scenario/scenario-five/ui/presentation.ts',
  'scripts/verify-s5-phase8d-integrated-gameplay.ts',
];
if(process.argv.includes('--record-baseline')){
  assert(!existsSync(snapshotPath),'Never overwrite the pre-correction snapshot');
  writeFileSync(snapshotPath,JSON.stringify({files:Object.fromEntries(paths.map(p=>[p,readFileSync(p).toString('base64')])),priorVerification:JSON.parse(readFileSync('docs/scenario5-phase8d-verification.json','utf8'))},null,2));
  console.log('Phase 08D.1 before snapshot recorded; accepted scientific baseline retained.');
} else {
  (globalThis as unknown as {React:typeof React}).React=React;
  const snapshot=JSON.parse(readFileSync(snapshotPath,'utf8'));
  const original=(p:string)=>Buffer.from(snapshot.files[p],'base64').toString('utf8');
  const read=(p:string)=>readFileSync(p,'utf8');
  const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
  let assertions=0;
  const equal=(a:unknown,b:unknown,label:string)=>{assert.deepEqual(a,b,label);assertions++;};
  const check=(v:unknown,label:string)=>{assert.ok(v,label);assertions++;};
  const near=(a:number,b:number,label:string)=>check(Math.abs(a-b)<1e-9,label);
  const baseline=JSON.parse(read('docs/scenario5-phase8d-baseline.json'));
  for(const [p,h] of Object.entries(baseline.frozen))equal(hash(readFileSync(p)),h,`Frozen scientific/archive/legacy file ${p}`);

  const previous='تصمیم‌های شما زمان عملیاتی و منابع ISR یا پشتیبانی مصرف می‌کنند و می‌توانند گزینه‌های مراحل بعد را محدود کنند.';
  const approved='تصمیم‌های شما زمان عملیاتی و منابع ISR یا پشتیبانی مصرف می‌کنند. منابع محدودند و نحوه مصرف آنها بر ظرفیت باقی‌مانده، تاب‌آوری و نتیجه مأموریت اثر می‌گذارد.';
  const app=read('src/App.tsx');
  equal(app,original('src/App.tsx').replace(previous,approved),'Every App byte unchanged except the exact approved sentence');
  const parse=(s:string)=>ts.createSourceFile('App.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function objectById(s:string,id:number){
    const ast=parse(s);let found:ts.ObjectLiteralExpression|undefined;
    const visit=(n:ts.Node)=>{if(ts.isObjectLiteralExpression(n)&&n.properties.some(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='id'&&p.initializer.getText(ast)===String(id)))found=n;ts.forEachChild(n,visit);};
    visit(ast);assert(found);return {ast,node:found,text:s.slice(found.getStart(ast),found.end)};
  }
  equal(objectById(app,2).text,objectById(original('src/App.tsx'),2).text,'Legacy id=2 byte-identical');
  const active=objectById(app,5);
  check(active.text.includes(approved),'Only active id=5 approved resource wording');
  check(!active.text.includes('می‌توانند گزینه‌های مراحل بعد را محدود کنند'),'No unsupported affordability claim in active id=5');
  for(const name of ['SCENARIO_TREE_IDS','RELEASED_SCENARIO_IDS','RELEASED_SCENARIO_TITLES']){
    const extract=(s:string)=>{const ast=parse(s);let value='';const visit=(n:ts.Node)=>{if(ts.isVariableDeclaration(n)&&n.name.getText(ast)===name)value=n.getText(ast);ts.forEachChild(n,visit);};visit(ast);return value;};
    equal(extract(app),extract(original('src/App.tsx')),`${name} unchanged`);
  }
  check(app.includes('5: "s5_silent_waves_redesign"')&&app.includes('5: "۲ — امواج خاموش"'),'Active routing and released title retained');

  const mapPath='src/ui/components/scenario/ScenarioFiveMap.tsx';
  const currentMap=read(mapPath),oldMap=original(mapPath);
  const progressSection=(s:string)=>s.slice(s.indexOf('const clamp ='),s.indexOf('const convoySignature'));
  equal(progressSection(currentMap),progressSection(oldMap),'Canonical progress function byte-identical');
  const progressEffect=(s:string)=>s.slice(s.indexOf('    const nextProgress:'),s.indexOf('  }, [convoys, worldClockMinutes]);'));
  equal(progressEffect(currentMap),progressEffect(oldMap),'Monotonic progress/held/delivered effect byte-identical');
  const originSection=(s:string)=>s.slice(s.indexOf('const ORIGIN_DECONFLICTION:'),s.indexOf('const clamp ='));
  equal(originSection(currentMap),originSection(oldMap),'Tehran origin offsets unchanged');
  const offsetSection=(s:string)=>s.slice(s.indexOf('            const originSeparationWeight'),s.indexOf('            const letter'));
  equal(offsetSection(currentMap),offsetSection(oldMap),'Original deconfliction applied after route geometry unchanged');

  const runs=WORLD_CATALOG.flatMap(w=>MISSION_POLICIES.filter(p=>!p.oraclePolicy&&!p.stressPolicy&&!p.randomPolicy).map(policy=>{
    const run=simulateScenario5({worldId:w.worldId,environmentSeed:1,policy});
    return {worldId:w.worldId,policy:policy.policyId,digest:hash(JSON.stringify(run)),run};
  }));
  equal(runs.map(({run:_,...r})=>r),baseline.corpus,'Exact accepted 112-run scientific corpus: zero mismatches');
  equal(runs.length,112,'Same 16 worlds x seven valid policies');

  const witness=runs.find(({run})=>run.state.domainDecisionRecords.some(r=>r.actionId==='b2_reroute'))!.run;
  const beforeState=JSON.stringify(witness.state);
  const outcome=buildStoredScenario5Outcome(witness.state,3);
  const target=outcome.effectiveTargetCorridorId!;
  const view=buildScenario5PlayerView(witness.state);
  const mapProps={convoys:outcome.convoys,evidence:outcome.newEvidence,worldClockMinutes:outcome.worldClockAfter,highlightedCorridorId:null,globalRoutePulse:false};
  const normalMarkup=renderToStaticMarkup(React.createElement(ScenarioFiveMap,mapProps));
  const rerouteMarkup=renderToStaticMarkup(React.createElement(ScenarioFiveMap,{...mapProps,reroutes:[target]}));
  function marker(markup:string,id:string){
    const tag=[...markup.matchAll(/<g[^>]*data-convoy-id="[^"]+"[^>]*>/g)].map(m=>m[0]).find(t=>t.includes(`data-convoy-id="${id}"`))!;
    assert(tag);const p=Number(tag.match(/data-visual-progress="([^"]+)"/)![1]);
    const coords=tag.match(/translate\(([-\d.e+]+)px, ([-\d.e+]+)px\)/)!;
    return {progress:p,point:{x:Number(coords[1]),y:Number(coords[2])}};
  }
  const convoy=outcome.convoys.find(c=>c.corridorId===target)!;
  const n=marker(normalMarkup,convoy.convoyId),a=marker(rerouteMarkup,convoy.convoyId);
  equal(a.progress,n.progress,'Reroute and normal marker use identical progress scalar');
  check(a.progress>.08&&a.progress<1,'Deterministic reroute witness strictly in transit after origin separation');
  const path=rerouteMarkup.match(/<path data-corridor-id="[^"]+" d="M([\d.-]+) ([\d.-]+) Q([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/)!;
  const route={from:{x:Number(path[1]),y:Number(path[2])},to:{x:Number(path[5]),y:Number(path[6])}};
  equal(alternateRouteControlPoint(route),{x:Number(path[3]),y:Number(path[4])},'SVG path and marker share the same control point');
  const alternate=routePresentationPoint(route,a.progress,true);
  near(a.point.x,alternate.x,'SSR reroute marker x follows alternate path');near(a.point.y,alternate.y,'SSR reroute marker y follows alternate path');
  check(Math.hypot(a.point.x-n.point.x,a.point.y-n.point.y)>1,'Different in-transit presentation coordinates');
  for(const progress of [0,.01,.05,.25,.5,.75,.97,1]){
    const straight=routePresentationPoint(route,progress,false);
    equal(straight,{x:route.from.x+(route.to.x-route.from.x)*progress,y:route.from.y+(route.to.y-route.from.y)*progress},'Original route coordinates unchanged');
    if(progress>0&&progress<1)check(JSON.stringify(routePresentationPoint(route,progress,true))!==JSON.stringify(straight),'Same scalar gives alternate position');
  }
  equal(routePresentationPoint(route,0,true),route.from,'Same origin');
  equal(routePresentationPoint(route,1,true),route.to,'Same delivered destination');
  const delivered={...convoy,status:'delivered' as const};
  const deliveredMarker=marker(renderToStaticMarkup(React.createElement(ScenarioFiveMap,{...mapProps,convoys:outcome.convoys.map(c=>c.convoyId===convoy.convoyId?delivered:c),reroutes:[target]})),convoy.convoyId);
  equal(deliveredMarker.progress,1,'Delivered progress is one');equal(deliveredMarker.point,route.to,'Delivered marker at same destination');
  equal(JSON.stringify(witness.state),beforeState,'Geometry and SSR reads never mutate mission/runtime');

  const phaseTitles={A:'فاز ۱ — ساخت تصویر اولیه کامل شد',B:'فاز ۲ — تمرکز و مدیریت مسیر کامل شد',C:'فاز ۳ — ایجاد تاب‌آوری کامل شد'} as const;
  for(const [phase,title] of Object.entries(phaseTitles)){
    const html=renderToStaticMarkup(React.createElement(ScenarioFivePhaseSummary,{phase:phase as 'A'|'B'|'C',view,outcomes:[],onContinue:()=>{}}));
    equal(html.match(/<h2>(.*?)<\/h2>/)![1],title,'Exact numbered phase-summary heading');
    check(!/فاز [ABCD]/.test(html),'No player-facing internal phase letter');
  }
  for(const r of runs){
    const state=r.run.state;
    for(const i of state.domainDecisionRecords.keys()){
      const o=buildStoredScenario5Outcome(state,i);
      for(const c of o.convoyChanges)check(!(c.newMitigations.includes(ESCORT_ACTIVE)&&(c.expiredMitigations.includes(ESCORT_EXPIRED)||c.newMitigations.includes(ESCORT_COMPLETED))),'No simultaneous active/expired labels');
    }
  }
  const escorted=runs.find(r=>r.run.state.domainDecisionRecords[6]?.actionId==='d1_escorted_continuation')!.run;
  const escortOutcome=buildStoredScenario5Outcome(escorted.state,6);
  const applied=escortOutcome.convoyChanges.find(c=>c.newMitigations.includes(ESCORT_COMPLETED))!;
  check(!!applied,'Real R7 escort completes at the stage boundary');
  equal(applied.expiredMitigations,[],'R7 outcome has one lifecycle message, no duplicate expiry');
  const escortHtml=renderToStaticMarkup(React.createElement(ScenarioFiveOutcomeContent,{outcome:escortOutcome}));
  check(escortHtml.includes(ESCORT_COMPLETED),'R7 outcome exact lifecycle wording');
  check(!escortHtml.includes(ESCORT_ACTIVE)&&!escortHtml.includes(ESCORT_EXPIRED),'R7 outcome has no conflicting active/expired labels');
  const escortConvoy=escortOutcome.convoys.find(c=>c.corridorId===applied.corridorId)!;
  check(!escortConvoy.escortedNow,'R7 next-stage convoy is already outside escort window');
  const nextStageMap=renderToStaticMarkup(React.createElement(ScenarioFiveMap,{...mapProps,convoys:escortOutcome.convoys,expiredEscortCorridors:[applied.corridorId]}));
  check(nextStageMap.includes(ESCORT_EXPIRED)&&!nextStageMap.includes(ESCORT_ACTIVE),'Next-stage history uses only expiry text');
  const activeRun=runs.find(r=>buildStoredScenario5Outcome(r.run.state,7).convoys.some(c=>c.escortedNow))!.run;
  const activeOutcome=buildStoredScenario5Outcome(activeRun.state,7);
  const activeConvoy=activeOutcome.convoys.find(c=>c.escortedNow)!;
  check(mitigationLabels(activeConvoy).includes(ESCORT_ACTIVE),'Existing valid window shows active escort');
  const activeMap=renderToStaticMarkup(React.createElement(ScenarioFiveMap,{...mapProps,convoys:activeOutcome.convoys,expiredEscortCorridors:[activeConvoy.corridorId]}));
  check(activeMap.includes(ESCORT_ACTIVE)&&!activeMap.includes(ESCORT_EXPIRED),'Active window suppresses stale expiry history');

  const priorOutput=execFileSync(process.execPath,[resolve('node_modules/tsx/dist/cli.mjs'),'scripts/verify-s5-phase8d-integrated-gameplay.ts'],{encoding:'utf8',windowsHide:true});
  writeFileSync('docs/scenario5-phase8d1-phase8d-verifier.txt',priorOutput);
  const prior=JSON.parse(read('docs/scenario5-phase8d-verification.json'));
  equal(prior.assertions,snapshot.priorVerification.assertions,'All 32,798 existing Phase-08D presentation assertions retained');
  equal(prior.status,'PASS','Existing Phase-08D verifier PASS');
  equal(prior.mismatchCount,0,'Existing Phase-08D scientific parity PASS');
  const result={status:'PASS',assertions,frozenScientificGuard:'PASS',frozenFileCount:Object.keys(baseline.frozen).length,changedFrozenFiles:[],scientificParity:{runs:runs.length,mismatches:0,environmentSeed:1,worlds:16,policyFamilies:7},phase08d:{assertions:prior.assertions,result:'PASS'},legacyId2Guard:'PASS',activeId5Guard:'PASS',phaseSummaryGuard:'PASS',escortLifecycleGuard:'PASS',reroute:{convoyId:convoy.convoyId,progress:a.progress,originalPoint:n.point,alternatePoint:alternate,renderedPoint:a.point,projectedArrivalMinute:convoy.projectedArrivalMinute,delayMinutes:convoy.delayMinutes,result:'PASS'}};
  writeFileSync('docs/scenario5-phase8d1-verification.json',JSON.stringify(result,null,2));
  console.log(`Phase 08D.1 PASS: ${assertions} checks; Phase 08D ${prior.assertions} PASS; scientific parity 112/112, zero mismatches.`);
}
