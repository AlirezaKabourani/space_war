import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {ScenarioFivePhaseHeader,ScenarioFivePhaseProgress,ScenarioFivePhaseSummary} from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx';
import {buildScenarioFiveHeader} from '../src/ui/components/scenario/scenario-five/ui/phaseHeader.ts';
import {buildScenario5PlayerView} from '../src/ui/components/scenario/scenario-five/ui/presentation.ts';
import {simulateScenario5} from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver.ts';
import {MISSION_POLICIES} from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies.ts';
import {WORLD_CATALOG} from '../src/ui/components/scenario/scenario-five/model/index.ts';
import type {Scenario5RuntimeState} from '../src/ui/components/scenario/scenario-five/model/runtime/index.ts';
const baselinePath='docs/scenario5-phase8d2-baseline.json';
const paths=['src/ui/components/scenario/ScenarioFiveSimulation.tsx','src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx','src/ui/components/scenario/ScenarioFive.css','src/App.tsx'];
if(process.argv.includes('--record-baseline')){
  assert(!existsSync(baselinePath));
  writeFileSync(baselinePath,JSON.stringify({files:Object.fromEntries(paths.map(p=>[p,readFileSync(p).toString('base64')]))},null,2));
  console.log('08D.2 pre-change snapshot captured.');
} else {
  (globalThis as unknown as {React:typeof React}).React=React;
  const read=(p:string)=>readFileSync(p,'utf8');
  const snapshot=JSON.parse(read(baselinePath));
  const original=(p:string)=>Buffer.from(snapshot.files[p],'base64').toString('utf8');
  let assertions=0;
  const equal=(a:unknown,b:unknown,m:string)=>{assert.deepEqual(a,b,m);assertions++;};
  const check=(v:unknown,m:string)=>{assert.ok(v,m);assertions++;};
  equal(read('src/App.tsx'),original('src/App.tsx'),'App, id=2, id=5 routing and all metadata unchanged');
  const frozen=JSON.parse(read('docs/scenario5-phase8d-baseline.json')).frozen;
  for(const [p,h] of Object.entries(frozen))equal(createHash('sha256').update(readFileSync(p)).digest('hex'),h,`Frozen ${p}`);
  const sim='src/ui/components/scenario/ScenarioFiveSimulation.tsx';
  function calls(s:string,name:string){const ast=ts.createSourceFile(sim,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const found:string[]=[];const visit=(n:ts.Node)=>{if(ts.isCallExpression(n)&&n.expression.getText(ast)===name)found.push(n.getText(ast));ts.forEachChild(n,visit);};visit(ast);return found;}
  for(const hook of ['useState','useEffect','useCallback'])equal(calls(read(sim),hook),calls(original(sim),hook),`${hook} and existing runtime/event handlers unchanged`);
  for(const api of ['setRuntime','log','confirmRuntimeDecision','submitRuntimeBelief','submitRuntimeReason','continueRuntimeAfterOutcome','openRuntimeEvidence','closeRuntimeEvidence'])equal(calls(read(sim),api),calls(original(sim),api),`No change to ${api} output or stage transitions`);
  check(read(sim).includes('buildScenarioFiveHeader(view, reviewLastOutcome ? null : phaseSummary)'),'Only visible local summary overrides header');
  const states=new Map<number,Scenario5RuntimeState>();
  simulateScenario5({worldId:WORLD_CATALOG[0]!.worldId,environmentSeed:1,policy:MISSION_POLICIES[0]!,onPreDecision:s=>{if([3,5,7].includes(s.missionState.currentRound))states.set(s.missionState.currentRound,s);}});
  const expected=[
    {phase:'A' as const,round:3,next:'B',stage:'decision:B1_monitoring_allocation',title:'مرور پایان فاز ۱ — ساخت تصویر اولیه',subtitle:'مرحله بعد: فاز ۲ — تمرکز و مدیریت مسیر · تصمیم ۳ از ۸',summary:'فاز ۱ — ساخت تصویر اولیه کامل شد'},
    {phase:'B' as const,round:5,next:'C',stage:'decision:C1_support_and_checkpoints',title:'مرور پایان فاز ۲ — تمرکز و مدیریت مسیر',subtitle:'مرحله بعد: فاز ۳ — ایجاد تاب‌آوری · تصمیم ۵ از ۸',summary:'فاز ۲ — تمرکز و مدیریت مسیر کامل شد'},
    {phase:'C' as const,round:7,next:'D',stage:'decision:D1_crisis_response',title:'مرور پایان فاز ۳ — ایجاد تاب‌آوری',subtitle:'مرحله بعد: فاز ۴ — مدیریت فشار و تحویل · تصمیم ۷ از ۸',summary:'فاز ۳ — ایجاد تاب‌آوری کامل شد'},
  ];
  const observed=[];
  for(const [index,e] of expected.entries()){
    const state=states.get(e.round)!;const before=JSON.stringify(state);const view=buildScenario5PlayerView(state);const safeBefore=JSON.stringify(view);
    equal(state.stage.stageId,e.stage,'Underlying next runtime stage unchanged');
    const header=buildScenarioFiveHeader(view,e.phase);
    equal([header.title,header.subtitle,header.stageLabel],[e.title,e.subtitle,'مرور فاز'],'Exact review header copy');
    const markup=renderToStaticMarkup(React.createElement(ScenarioFivePhaseHeader,{header}));
    check(markup.includes(`<h1>${e.title}</h1>`)&&markup.includes(`<p>${e.subtitle}</p>`)&&markup.includes('مرور فاز'),'Actual header render');
    check(!/<h1>فاز [0-9۰-۹]+ از ۴/.test(markup),'Review does not claim the next phase is current');
    equal(header.progress.map(p=>p.state),['A','B','C','D'].map((_,i)=>i<=index?'completed':'upcoming'),'Reviewed phase completed, next phase neutral');
    const progressMarkup=renderToStaticMarkup(React.createElement(ScenarioFivePhaseProgress,{header}));
    check(!progressMarkup.includes('aria-current=')&&!progressMarkup.includes('s5-current'),'No active upcoming phase in review DOM');
    const summary=renderToStaticMarkup(React.createElement(ScenarioFivePhaseSummary,{phase:e.phase,view,outcomes:[],onContinue:()=>{}}));
    check(summary.includes(`<h2>${e.summary}</h2>`),'Approved left summary unchanged');
    const next=buildScenarioFiveHeader(view,null);
    equal(next.progress.find(p=>p.state==='current')?.phase,e.next,'Continue presents existing next phase as active');
    check(next.subtitle?.startsWith(`تصمیم ${e.round} از ۸`),'Next decision number after Continue');
    equal(next.stageLabel,'تصمیم عملیاتی','Next stage label after Continue');
    equal(JSON.stringify(buildScenario5PlayerView(state)),safeBefore,'Safe clock/resources/evidence/convoys unchanged');
    equal(JSON.stringify(state),before,'Review render/dismissal mutates no runtime, inputs, events or telemetry');
    observed.push({reviewedPhase:e.phase,title:header.title,subtitle:header.subtitle,stageLabel:header.stageLabel,nextRuntimeStage:state.stage.stageId,nextHeader:next.title,nextDecision:next.subtitle,clock:view.resources.worldClockMinutes,ISR:view.resources.isrCapacity,Support:view.resources.supportReserve,evidenceCount:view.visibleEvidence.length});
  }
  const oldPath='docs/scenario5-phase8d1-verification.json';const previousReport=readFileSync(oldPath);
  let prior: {assertions:number;phase08d:{assertions:number};scientificParity:{runs:number;mismatches:number}};
  try{
    const stdout=execFileSync(process.execPath,[resolve('node_modules/tsx/dist/cli.mjs'),'scripts/verify-s5-phase8d1-corrections.tsx'],{encoding:'utf8',windowsHide:true});
    writeFileSync('docs/scenario5-phase8d2-prior-verifiers.txt',stdout);prior=JSON.parse(read(oldPath));
  }finally{writeFileSync(oldPath,previousReport);}
  equal(prior.assertions,1516,'Accepted 08D.1 verifier retained');equal(prior.phase08d.assertions,32798,'Accepted 08D verifier retained');equal(prior.scientificParity,{runs:112,mismatches:0,environmentSeed:1,worlds:16,policyFamilies:7},'Same accepted 112-run scientific parity');
  const result={status:'PASS',assertions,phase08d:{result:'PASS',assertions:32798},phase08d1:{result:'PASS',assertions:1516},scientificParity:prior.scientificParity,frozenGuard:'PASS',frozenHashes:Object.keys(frozen).length,changedFrozenFiles:[],legacyGuard:'PASS',appUnchanged:true,observed};
  writeFileSync('docs/scenario5-phase8d2-verification.json',JSON.stringify(result,null,2));
  console.log(`08D.2 PASS: ${assertions} checks; 08D 32798 PASS; 08D.1 1516 PASS; parity 112 runs / zero mismatches.`);
}
