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
import {ScenarioFiveSummary} from '../src/ui/components/scenario/ScenarioFiveSummary';
import {ScenarioFiveCognitiveDashboard,ScenarioFiveSignedAxis} from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard';
import {COGNITIVE_UNAVAILABLE,CONSTRUCT_GROUPS,INFORMATION_DISCIPLINE_UNMEASURED,REVISION_RATE_UNAVAILABLE,currentRunCognitive,numericText,secondsText,signedAxisPosition,signedText} from '../src/ui/components/scenario/scenario-five/ui/cognitiveDashboardPresentation';
import type {Scenario5CognitiveRunResult} from '../src/ui/components/scenario/scenario-five/model/cognitive/types';

(globalThis as unknown as {React: typeof React}).React=React;
const read=(p:string)=>fs.readFileSync(p,'utf8'),h=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),fileHash=(p:string)=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=JSON.parse(read('docs/scenario5-phase09c2-baseline.json')),beforeCorpus=JSON.parse(read('docs/scenario5-phase09c1-baseline-corpus.json')),scientific=JSON.parse(read('docs/scenario5-phase8d-baseline.json'));
let assertions=0;const equal=(a:unknown,b:unknown,m:string)=>{assert.deepEqual(a,b,m);assertions++;};const check=(v:unknown,m:string)=>{assert.ok(v,m);assertions++;};
for(const[p,expected]of Object.entries(scientific.frozen))equal(fileHash(p),expected,'Frozen '+p);
const allowed=new Set(['src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard.tsx','src/ui/components/scenario/ScenarioFive.css']);
for(const[p,expected]of Object.entries(baseline.hashes))if(!allowed.has(p))equal(fileHash(p),expected,'Unchanged existing source '+p);
const runs=WORLD_CATALOG.flatMap(w=>MISSION_POLICIES.filter(p=>!p.oraclePolicy&&!p.stressPolicy&&!p.randomPolicy).map(policy=>simulateScenario5({worldId:w.worldId,environmentSeed:1,policy})));
const after=runs.map(r=>({worldId:r.worldId,policy:r.policyId,digest:h(r),cognitive:h(r.result.cognitive),domain:h(r.result.domain),mission:h(r.state.missionState),evidence:h(r.cognitiveBundle)}));
equal(after,beforeCorpus,'112 full run/cognitive/domain/mission/telemetry digests equal new pre-change corpus');
equal(after.map(({worldId,policy,digest})=>({worldId,policy,digest})),scientific.corpus,'Same accepted scientific corpus');
const witness=runs[0]!,noop=()=>{};
const render=(r:Scenario5CognitiveRunResult)=>renderToStaticMarkup(<ScenarioFiveCognitiveDashboard cognitive={r} onBack={noop} onComplete={noop} onTechnical={noop} onReviewTrace={noop}/>);
for(const risk of [false,true])for(const value of [-1,-.5,-.14,0,.5,1,null]){
  equal(signedAxisPosition(value),value===null?null:(value+1)*50,'Signed axis coordinate only');
  const html=renderToStaticMarkup(<ScenarioFiveSignedAxis label={risk?'موضع نسبی ریسک':'OSI'} value={value} field="test" risk={risk}/>);
  equal(html.includes('data-signed-marker='),value!==null,'Null omits marker; zero retains marker');
  if(value!==null){check(html.includes(`left:${(value+1)*50}%`),'Exact left-to-right position');check(html.includes(signedText(value)),'Explicit signed two-decimal text');}
  else check(html.includes(COGNITIVE_UNAVAILABLE),'Null does not imply center');
}
equal(signedText(-.5),'−0.50','Minus sign');equal(signedText(0),'+0.00','Measured zero sign');equal(signedText(.5),'+0.50','Plus sign');
equal(numericText(0),'0.00','Numeric zero not missing');equal(secondsText(0),'0.0 ثانیه','Zero ms not null');equal(secondsText(1500),'1.5 ثانیه','Display ms/1000 only');equal(secondsText(null),COGNITIVE_UNAVAILABLE,'Missing timing');
const groups=CONSTRUCT_GROUPS.flatMap(g=>g.items);
equal(groups.map(x=>x.key).sort(),['informationSeeking','evidenceResponsiveUpdating','secondOrderThinking','adversaryModeling','escalationSensitivity','resourceStewardship','planningForesight','multiDomainIntegration','decisionCoherence'].sort(),'Exactly nine measured constructs');
const approved=read('docs/scenario2-cognitive-dashboard-final-spec-09c1.md');for(const d of groups){check(approved.includes(d.label),'Approved label '+d.key);check(approved.includes(d.definition),'Verbatim approved definition '+d.key);}
for(const run of runs){const before=JSON.stringify(run),html=render(run.result.cognitive);equal((html.match(/data-construct=/g)??[]).length,9,'Nine construct cards');equal((html.match(/انضباط اطلاعاتی: در نسخه فعلی این سناریو سنجیده نمی‌شود\./g)??[]).length,1,'One unmeasured note');equal(JSON.stringify(run),before,'Rendering immutable');equal(currentRunCognitive(run.state,run.result),run.result.cognitive,'Current complete typed source');}
const fixture=structuredClone(witness.result.cognitive);fixture.runId='TEST_ONLY_NULL_ZERO';fixture.dataCompleteness={overall:0,decisions:0,timing:0,evidence:0,estimates:0,reasons:0};fixture.orientation={overall:null,phaseScores:[-.5,0,.5,null],operationalStrength:0,strategicStrength:0,integration:null,dispersion:null};fixture.constructs={...fixture.constructs,informationSeeking:0,evidenceResponsiveUpdating:null,riskPosture:null};fixture.telemetrySummary={medianActiveDecisionMs:0,iqrActiveDecisionMs:null,totalRevisions:0,revisedWindows:0,evidenceTriggeredRevisionRate:null};
let html=render(fixture);check(html.includes('0.00٪'),'Completeness 0 displayed');check(html.includes('aria-valuenow="0"'),'Measured construct 0 keeps neutral meter');check(html.includes('width:0%'),'Measured zero bar');
const card=(markup:string,key:string)=>markup.slice(markup.indexOf(`data-construct="${key}"`),markup.indexOf('</article>',markup.indexOf(`data-construct="${key}"`)));
check(!card(html,'evidenceResponsiveUpdating').includes('role="meter"'),'ERU null has no score bar');check(card(html,'evidenceResponsiveUpdating').includes(COGNITIVE_UNAVAILABLE),'ERU null wording');check(html.includes(REVISION_RATE_UNAVAILABLE),'No qualifying revision opportunity message');check(html.includes(INFORMATION_DISCIPLINE_UNMEASURED),'Discipline unmeasured');check(!html.includes('data-signed-marker="orientation.overall"'),'Null overall not filled from phase values');check(html.includes('data-signed-marker="orientation.phaseScores[1]"'),'Phase zero retains marker');
const rateZero=structuredClone(fixture);rateZero.dataCompleteness.overall=62.5;rateZero.dataCompleteness.decisions=50;rateZero.telemetrySummary.evidenceTriggeredRevisionRate=0;rateZero.telemetrySummary.medianActiveDecisionMs=null;rateZero.telemetrySummary.iqrActiveDecisionMs=0;rateZero.constructs.riskPosture=0;
html=render(rateZero);check(html.includes('62.50٪'),'Partial coverage preserves output');check(!html.includes(REVISION_RATE_UNAVAILABLE),'Revision zero distinct from unavailable');check(html.includes('data-signed-marker="constructs.riskPosture"'),'Measured zero risk marker');
const conflict={...witness.result,runId:'other-run'};equal(currentRunCognitive(witness.state,conflict),null,'Result mismatch');equal(currentRunCognitive({...witness.state,runId:'other-user-run'},witness.result),null,'Runtime mismatch');equal(currentRunCognitive(witness.state,{...witness.result,cognitive:{...witness.result.cognitive,runId:'other-cognitive-run'}}),null,'Cognitive mismatch');equal(currentRunCognitive(null,witness.result),null,'Missing runtime');equal(currentRunCognitive(witness.state,null),null,'Missing result');
const incomplete={...witness.state,stage:{...witness.state.stage,stageId:'decision:A1_baseline_monitoring' as const}};equal(currentRunCognitive(incomplete,witness.result),null,'Incomplete stage blocked');
for(const props of [{runtimeState:null,result:null},{runtimeState:witness.state,result:null},{runtimeState:witness.state,result:conflict},{runtimeState:incomplete,result:witness.result}]){const unavailable=renderToStaticMarkup(<ScenarioFiveSummary {...props} onComplete={noop}/>);check(unavailable.includes('گزارش شناختی این اجرا در دسترس نیست.'),'Truthful unavailable state');check(!unavailable.includes('data-cognitive-run'),'No foreign fallback');}
const domainTrap=new Proxy(witness.result,{get(target,key,receiver){if(key==='domain'||key==='missionEndState')throw Error('Forbidden score source');return Reflect.get(target,key,receiver);}});equal(currentRunCognitive(witness.state,domainTrap),witness.result.cognitive,'Gate reads no domain/ending data');
const source=read('src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard.tsx')+read('src/ui/components/scenario/scenario-five/ui/cognitiveDashboardPresentation.ts');
check(!/result\.domain|missionEndState|trueWorldState|actorProfile|localStorage|eventLogger|calculateScenario5|optionProfiles|perWindow|coalitionOrientation|totalEvidenceDwellMs/.test(source),'Score-source and passive-instrumentation firewall');
check(!/s4-|scenario-four|buildCognitiveInsights|Global Cognitive Score|بار شناختی تخمینی/.test(source),'No S4/global computation or extra scores');
const css=read('src/ui/components/scenario/ScenarioFive.css'),originalCss=Buffer.from(baseline.files['src/ui/components/scenario/ScenarioFive.css'],'base64').toString('utf8');check(css.startsWith(originalCss),'All existing gameplay styles preserved exactly');
const uiFixtures={testOnly:true,description:'TEST ONLY — presentation fixtures, never actual user-run/scientific outputs',nullZero:fixture,partialZero:rateZero};fs.writeFileSync('docs/scenario5-phase09c2-visual-fixtures.json',JSON.stringify(uiFixtures,null,2)+'\n');
const parseType=ts.createSourceFile('types.ts',read('src/ui/components/scenario/scenario-five/model/cognitive/types.ts'),ts.ScriptTarget.Latest,true),interfaces=new Map(parseType.statements.filter(ts.isInterfaceDeclaration).map(d=>[d.name.text,d]));const leaves:string[]=[];
function flatten(t:ts.TypeNode,p:string){if(ts.isTypeReferenceNode(t)&&interfaces.has(t.typeName.getText(parseType))){for(const m of interfaces.get(t.typeName.getText(parseType))!.members as ts.NodeArray<ts.PropertySignature>)flatten(m.type!,p?p+'.'+m.name!.getText(parseType):m.name!.getText(parseType));}else if(ts.isTypeLiteralNode(t)){for(const m of t.members as ts.NodeArray<ts.PropertySignature>)flatten(m.type!,p+'.'+m.name!.getText(parseType));}else if(ts.isTypeOperatorNode(t)&&ts.isTupleTypeNode(t.type))t.type.elements.forEach((e,i)=>flatten(e,p+'['+i+']'));else leaves.push('result.cognitive.'+p);}
for(const m of interfaces.get('Scenario5CognitiveRunResult')!.members as ts.NodeArray<ts.PropertySignature>)flatten(m.type!,m.name!.getText(parseType));equal(leaves.length,40,'Actual TS result scalar leaves');

const visualFixtures=JSON.parse(read('docs/scenario5-phase09c2-visual-fixtures.json'));
for(const [key,value]of Object.entries({negativeEdge:-1,negativeReal:-.14,zero:0,positive:.5,positiveEdge:1})){const r=structuredClone(witness.result.cognitive);r.runId='TEST_ONLY_09C2_'+key;r.orientation.overall=value;r.orientation.phaseScores=[-1,0,.5,1];r.constructs.riskPosture=value;visualFixtures[key]=r;}
fs.writeFileSync('docs/scenario5-phase09c2-visual-fixtures.json',JSON.stringify(visualFixtures,null,2)+'\n');
const rows=read('docs/scenario5-phase09c1-field-to-ui-map.csv').trimEnd().split(/\r?\n/).slice(1).map(l=>[...l.matchAll(/"((?:[^" ]| |"")*)"(?:,|$)/g)].map(m=>m[1].replace(/""/g,'"')));
equal(rows.length,40,'Frozen mapping retains forty scalar fields');equal(rows.map(r=>r[2]).sort(),[...leaves].sort(),'Actual typed scalar leaves equal existing field-to-UI map');
const frozenDefinitions=fileHash('src/ui/components/scenario/scenario-five/ui/cognitiveDashboardPresentation.ts');
check(source.includes('طیف جهت‌گیری تصمیم عملیاتی–راهبردی در این اجرا'),'Exact descriptive title');
check(source.includes("{' '}{unit}"),'Visible text separator for 0..100 units');
for(const value of [-1,1]){const axis=renderToStaticMarkup(<ScenarioFiveSignedAxis label="OSI" value={value} field="orientation.overall"/>);check(axis.includes('data-axis-edge="'+(value===-1?'start':'end')+'"'),'Edge containment hook');}
check(css.includes('linear-gradient(90deg,#f59e0b,#22c55e,#38bdf8)'),'Actual S4 spectrum palette');
const unchanged09c1={status:'NOT_RUN',exitCode:0,stdout:'',stderr:''};
try{unchanged09c1.stdout=execFileSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-phase09c1.tsx'],{encoding:'utf8',windowsHide:true,stdio:'pipe',maxBuffer:16*1024*1024});unchanged09c1.status='PASS';}catch(error){const e=error as {status?:number;stdout?:string;stderr?:string};Object.assign(unchanged09c1,{status:'FAIL',exitCode:e.status,stdout:e.stdout??'',stderr:e.stderr??''});}
fs.writeFileSync('docs/scenario5-phase09c2-09c1-after.txt',unchanged09c1.stdout+unchanged09c1.stderr);
equal(unchanged09c1.status,baseline.unchanged09c1VerifierBeforeChanges.status,'Historical verifier result unchanged');
check(unchanged09c1.stderr.includes('Unchanged existing source src/App.tsx')&&baseline.unchanged09c1VerifierBeforeChanges.stderr.includes('Unchanged existing source src/App.tsx'),'Known pre-existing App hash mismatch, before and after');
const result={status:'PASS',assertions,typedScalarLeaves:leaves,scientificParity:{runs:runs.length,worlds:16,policyFamilies:7,environmentSeed:1,semanticMismatches:0,fullObjectDigestsEqual:true,cognitiveDomainMissionEvidenceDigestsEqual:true},frozenHashes:Object.keys(scientific.frozen).length,applicationFilesChanged:[...allowed],allOtherExistingFilesUnchanged:true,releasedS1Unchanged:true,legacyId2Unchanged:true,gameplaySourcesUnchanged:true,nullZeroCases:'PASS',signedAxisCases:'PASS',sameRunGate:'PASS',sourceAndInstrumentationFirewall:'PASS',definitionsAndHelperHash:frozenDefinitions,unchanged09c1:{status:unchanged09c1.status,preExisting:true,failure:'Unchanged existing source src/App.tsx; existing temporary admin shortcut predates 09C-2',beforeLog:'docs/scenario5-phase09c2-09c1-before.txt',afterLog:'docs/scenario5-phase09c2-09c1-after.txt'}};
fs.writeFileSync('docs/scenario5-phase09c2-focused-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,typedScalarLeaves:40},null,2));
