import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WORLD_CATALOG } from '../src/ui/components/scenario/scenario-five/model/index.ts';
import { MISSION_ACTION_CATALOG, validateMissionAction, calculateNetworkContinuity, resolveMissionEndState } from '../src/ui/components/scenario/scenario-five/model/mission/index.ts';
import { createScenario5Runtime, selectRuntimeAction, confirmRuntimeDecision, continueRuntimeAfterOutcome, openRuntimeEvidence, closeRuntimeEvidence } from '../src/ui/components/scenario/scenario-five/model/runtime/index.ts';
import { simulateScenario5 } from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver.ts';
import { MISSION_POLICIES } from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies.ts';
import { buildScenario5PlayerView, buildStoredScenario5Outcome, buildScenario5OutcomeView } from '../src/ui/components/scenario/scenario-five/ui/presentation.ts';
import { actionPreview, actionTiming, checkpointCorridors, deadlineMargin, reroutedCorridors } from '../src/ui/components/scenario/scenario-five/ui/gameplayPresentation.ts';
import { buildEndingExplanation, buildMissionAar, selectTurningPoints, ENDING_TITLES } from '../src/ui/components/scenario/scenario-five/ui/endingPresentation.ts';
import { ScenarioFiveBeliefPanel } from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveBeliefPanel.tsx';
import { ScenarioFiveMissionEnding } from '../src/ui/components/scenario/scenario-five/ui/ScenarioFiveMissionEnding.tsx';
import { SCENARIO5_BELIEF_COPY_FA } from '../src/ui/components/scenario/scenario-five/ui/uiContentFa.ts';
import type { SimulationRun, CalibrationPolicy } from '../src/ui/components/scenario/scenario-five/calibration/types.ts';
import type { MissionActionId } from '../src/ui/components/scenario/scenario-five/model/mission/index.ts';
import type { CorridorId, WorldId } from '../src/ui/components/scenario/scenario-five/model/index.ts';

export function verifyPresentation(runs: readonly SimulationRun[]) {
  (globalThis as unknown as {React: typeof React}).React=React;
  let assertions=0;
  const equal=(a:unknown,b:unknown,m:string)=>{assert.deepEqual(a,b,m);assertions++;};
  const check=(v:unknown,m:string)=>{assert.ok(v,m);assertions++;};
  const rejects=(fn:()=>unknown,m:string)=>{assert.throws(fn,undefined,m);assertions++;};
  const forbidden=/"(?:worldId|seed|primaryAffectedCorridorId|actorProfileId|actorInternalState|hiddenProvenance|actorDelayImpactByCorridor|endStateId|cognitive|loadings)"/;
  const read=(p:string)=>readFileSync(p,'utf8');
  const base='src/ui/components/scenario/';
  for(const action of MISSION_ACTION_CATALOG){
    equal(actionTiming(action.actionId),{duration:action.durationMinutes,assessment:20+action.durationMinutes,final:action.roundId===8},'Timing from frozen catalog');
  }
  for(const {state} of runs){
    const untouched=JSON.stringify(state);
    const view=buildScenario5PlayerView(state);
    equal(view.resources.worldClockMinutes,state.missionState.worldClockMinutes,'Header canonical clock');
    equal(Math.max(0,360-view.resources.worldClockMinutes),0,'Remaining horizon');
    equal(view.resources.isrCapacity,state.missionState.resources.isrCapacity,'ISR exact');
    equal(view.resources.supportReserve,state.missionState.resources.supportReserve,'Support exact');
    equal(view.visibleEvidence.length,state.evidence.length,'Visible count exact');
    equal(view.resources.evidenceCount,view.visibleEvidence.length,'Header evidence count exact');
    check(!forbidden.test(JSON.stringify(view)),'Safe player view firewall');
    for(const [i,r] of state.domainDecisionRecords.entries()){
      const o=buildStoredScenario5Outcome(state,i);
      equal(o.resourcesBefore,r.resourcesBefore,'Outcome resource before'); equal(o.resourcesAfter,r.resourcesAfter,'Outcome resource after');
      equal(o.worldClockAfter,r.worldClockAfter,'Outcome postcommit clock');equal(o.worldClockBefore,r.worldClockBefore,'Outcome clock before');
      equal(o.newEvidence.map(e=>e.evidenceId),r.newVisibleEvidenceIds,'Exact evidence burst');
      equal(o.totalEvidenceCount,state.domainDecisionRecords.slice(0,i+1).flatMap(r=>r.newVisibleEvidenceIds).length,'Accumulated evidence count');
      check(!forbidden.test(JSON.stringify(o)),'Outcome safe whitelist');
      for(const [j,c] of o.convoys.entries()){
        const raw=r.convoyStateAfter[j]!;
        equal(c.projectedArrivalMinute,raw.baselineArrivalMinute+raw.delayMinutes,'ETA exact');equal(c.deadlineMinute,raw.deadlineMinute,'Deadline exact');
        equal(deadlineMargin(c),raw.deadlineMinute-raw.baselineArrivalMinute-raw.delayMinutes,'Exact margin');
        equal(c.integrity,raw.integrity,'Integrity exact');equal(c.delayMinutes,raw.delayMinutes,'Delay exact');equal(c.status,raw.status,'Status exact');
      }
      if(i<7){
        equal(r.convoyStateAfter,state.domainDecisionRecords[i+1]!.convoyStateBefore,'Next stage shares outcome convoy state');
        equal(r.resourcesAfter,state.domainDecisionRecords[i+1]!.resourcesBefore,'Next stage shares outcome resources');
        equal(r.worldClockAfter,state.domainDecisionRecords[i+1]!.worldClockBefore,'Next stage shares outcome clock');
      }else equal(o.worldClockBefore+o.actionDurationMinutes+o.baselineMinutes+o.passiveHorizonMinutes,360,'R8 complete time reconciliation');
    }
    const aar=buildMissionAar(state);
    equal(aar.end,resolveMissionEndState(state.missionState),'Ending ID from frozen resolver');
    equal(aar.rows.filter(r=>r.contributes).length*25,calculateNetworkContinuity(state.missionState),'Continuity contribution from frozen selector');
    equal(aar.outcomes.length,8,'Trace has all eight decisions');equal(selectTurningPoints(state),selectTurningPoints(state),'Deterministic turning points');
    check(aar.turningPoints.length>=3&&aar.turningPoints.length<=5,'3..5 turning points');
    check(!/بهترین|بدترین|هوشمند|تصمیم خوب|تصمیم بد/.test(JSON.stringify(aar.turningPoints)),'No hindsight quality labels');
    const belief=state.beliefs.find(b=>b.checkpointId==='D_final_belief')!;
    equal(aar.lateEvidenceIds,state.evidence.filter(e=>!belief.visibleEvidenceIdsAtCheckpoint.includes(e.evidenceId)).map(e=>e.evidenceId),'Late evidence chronology');
    for(const id of aar.lateEvidenceIds)check(!belief.visibleEvidenceIdsAtCheckpoint.includes(id),'Late evidence not retroactively included');
    equal(JSON.stringify(state),untouched,'All presentation reads immutable');
  }
  for(const world of WORLD_CATALOG){
    let s=createScenario5Runtime({worldId:world.worldId,seed:1,startedAtMs:0,runId:'firewall'});
    const view=buildScenario5PlayerView(s);
    check(actionPreview(view,'a1_priority_focus','corridor_beta_south').effectiveTarget==='corridor_alpha_east','Fixed alpha cannot retarget in preview');
    rejects(()=>validateMissionAction(s.missionState,{actionId:'a1_priority_focus',targetCorridorId:'corridor_beta_south'}),'Model rejects fixed-alpha retarget');
    const delivered={...s.missionState,convoys:s.missionState.convoys.map(c=>({...c,status:'delivered' as const}))};
    rejects(()=>validateMissionAction(delivered,{actionId:'a1_priority_focus'}),'Delivered alpha illegal');
    const compromised={...s.missionState,convoys:s.missionState.convoys.map(c=>({...c,status:'compromised' as const}))};
    check(!!validateMissionAction(compromised,{actionId:'a1_priority_focus'}),'Compromised target legal');
    rejects(()=>buildEndingExplanation(s),'Hidden ending cannot be accessed before completion');
    s=selectRuntimeAction(s,'a1_network_baseline',10);s=confirmRuntimeDecision(s,{actionId:'a1_network_baseline'},100,0);
    const o=buildScenario5OutcomeView(s);check(!forbidden.test(JSON.stringify(o)),'Live outcome has no hidden truth');
    const next=continueRuntimeAfterOutcome(s,110);
    equal(buildScenario5PlayerView(s).resources,buildScenario5PlayerView(next).resources,'Actual outcome continuation numeric equality');
    equal(buildScenario5PlayerView(s).convoys,buildScenario5PlayerView(next).convoys,'Actual map/card continuation equality');
    const r=simulateScenario5({worldId:world.worldId,environmentSeed:1,policy:MISSION_POLICIES[0]!,onPreDecision:stage=>{
      const v=buildScenario5PlayerView(stage);check(!forbidden.test(JSON.stringify(v)),'Every decision safe props');
      const required=v.availableActionIds.find(id=>MISSION_ACTION_CATALOG.find(a=>a.actionId===id)?.target==='required');
      if(required)check(!actionPreview(v,required,null).valid,'Required target cannot confirm without input');
      equal(v.resources.worldClockMinutes,stage.missionState.worldClockMinutes,'Live header clock exact');
      if(v.visibleEvidence.length){
        const original=JSON.stringify(stage);
        const at=stage.stage.enteredAtMs+10;
        const opened=openRuntimeEvidence(stage,v.visibleEvidence[0]!.evidenceId,at);
        const closed=closeRuntimeEvidence(opened,v.visibleEvidence[0]!.evidenceId,at+200);
        equal(closed.evidenceOpens.length,stage.evidenceOpens.length+1,'Deliberate decision evidence open still logs');
        equal(JSON.stringify(stage),original,'Evidence interaction copy does not alter reference snapshot');
      }
    }});
    check(r.state.stage.stageId==='complete','Runtime stage completes');
    const decision=createScenario5Runtime({worldId:world.worldId,seed:1,startedAtMs:0,runId:'inspect'});
    let inspected=continueRuntimeAfterOutcome(s,110);
    // Explicit evidence opens remain constrained by the existing runtime API.
    rejects(()=>openRuntimeEvidence(inspected,inspected.evidence[0]!.evidenceId,120),'Belief read-only rejects evidence-open');
    const evidenceState=runs.find(run=>run.state.evidence.length>0)!.state;
    rejects(()=>openRuntimeEvidence(evidenceState,evidenceState.evidence[0]!.evidenceId,999999),'Complete cannot log evidence open');
    equal(decision.evidenceOpens.length,0,'No synthetic evidence opens');
  }
  for(const stageId of Object.keys(SCENARIO5_BELIEF_COPY_FA) as (keyof typeof SCENARIO5_BELIEF_COPY_FA)[]){
    const markup=renderToStaticMarkup(<ScenarioFiveBeliefPanel stageId={stageId} evidence={[]} recentEvidenceIds={new Set()} previousBelief={{mostLikelyCorridorId:'corridor_alpha_east',corridorConfidence:99,targetedInterferenceEstimate:88,targetedInterferenceConfidence:77}} onSubmit={()=>{}} />);
    equal((markup.match(/aria-valuetext="ثبت نشده"/g)??[]).length,3,'Previous belief does not initialize inputs');
    equal((markup.match(/type="range" min="0" max="100" step="1"/g)??[]).length,3,'Three bounded labeled sliders');
    check(!markup.includes('checked=""'),'No default corridor');check(markup.includes('disabled=""'),'Submit disabled initially');
  }
  const beliefSource=read(base+'scenario-five/ui/ScenarioFiveBeliefPanel.tsx');
  equal((beliefSource.match(/useState<number \| null>\(null\)/g)??[]).length,3,'Semantic null responses');
  check(beliefSource.includes('onSubmit({ mostLikelyCorridorId: corridorId, corridorConfidence, targetedInterferenceEstimate: targetedEstimate, targetedInterferenceConfidence: targetedConfidence })'),'Submitted 0..100 values passed unchanged');
  for(const name of ['ScenarioFiveOutcomePanel','ScenarioFiveBeliefPanel','ScenarioFiveReasonPanel','ScenarioFiveInformationPicture','ScenarioFiveProgress'])check(!/openRuntimeEvidence|closeRuntimeEvidence|eventLogger/.test(read(base+`scenario-five/ui/${name}.tsx`)),'Passive panels cannot emit evidence telemetry');
  const sim=read(base+'ScenarioFiveSimulation.tsx');
  check(read('src/App.tsx').includes('5: "s5_silent_waves_redesign"'),'Active product id=5 routing unchanged');
  check(sim.includes('const ANALYTICS_SCENARIO_ID = "s5_silent_waves_redesign"'),'Internal analytics identity retained');
  const tree=read('src/scenarios/s5_silent_waves_redesign/tree.ts');
  check(tree.includes('id: "s5_silent_waves_redesign"')&&tree.includes('game: "s5_gnss_logistics_simulation"'),'Internal runtime identities retained');
  check(sim.includes('!isDecisionStage(runtime.stage.stageId)')&&sim.includes('openRuntimeEvidence(runtime, evidenceId'),'Explicit evidence interaction kept');
  const map=read(base+'ScenarioFiveMap.tsx');
  check(!/missionEngine|eventLogger|trueWorldState|hiddenProvenance/.test(map),'Map cannot mutate model or consume truth');
  check(map.includes('Math.max(previousVisual, desired)')&&map.includes('convoy.status === "delivered" ? 1'),'Monotonic marker progress remains presentation-only');
  equal(reroutedCorridors([{actionId:'b2_reroute',effectiveTargetCorridorId:'corridor_beta_south'}]),['corridor_beta_south'],'Reroute uses own visible history');
  equal(checkpointCorridors([{actionId:'b2_reroute',effectiveTargetCorridorId:'corridor_beta_south'}]),[],'Reroute alone does not invent checkpoints');
  equal(checkpointCorridors([{actionId:'b2_staged_checkpoints',effectiveTargetCorridorId:'corridor_beta_south'}]),['corridor_beta_south'],'Checkpoint geometry uses only its own visible action history');
  const css=read(base+'ScenarioFive.css');
  check(css.includes('overflow-y: auto;')&&css.includes('.s5-control-scroll'),'Left internal scroll');check(css.includes('position: sticky; bottom: 0;'),'Sticky submit');
  check(map.includes('s5-map-target')&&sim.includes('s5-target-picker'),'Map target has non-map equivalent');
  check(!/Global Cognitive Score|امتیاز شناختی|نمره شناختی کل/.test(read(base+'scenario-five/ui/ScenarioFiveMissionEnding.tsx')),'Ending no cognitive/global score');
  const witnesses=verifyWitnesses(runs,check,equal);
  return {assertions, witnesses};
}

function verifyWitnesses(runs: readonly SimulationRun[], check:(v:unknown,m:string)=>void, equal:(a:unknown,b:unknown,m:string)=>void) {
  const witnesses=new Map(runs.map(r=>[r.result.missionEndState.endStateId,r]));
  const rows=readFileSync('docs/scenario5-phase8b-results/mission-runs.csv','utf8').trim().split(/\r?\n/);
  const headers=rows.shift()!.split(',');
  const parse=(line:string)=>Object.fromEntries(line.split(',').map((v,i)=>[headers[i]!,v]));
  // Replay archived witness seeds/policies, never alter mission parameters.
  for(const id of Object.keys(ENDING_TITLES)){
    if(witnesses.has(id as any))continue;
    const row=rows.map(parse).find(r=>r.endStateId===id);
    if(row){
      const policy=MISSION_POLICIES.find(p=>p.policyId===row.policyId)!;
      if(policy){const r=simulateScenario5({worldId:row.worldId as WorldId,environmentSeed:Number(row.environmentSeed),policySeed:Number(row.policySeed)||undefined,policy});if(r.result.missionEndState.endStateId===id)witnesses.set(id as any,r);}
    }
  }
  const actions:MissionActionId[]=['a1_priority_focus','a2_broad_sweep','b1_split_attention','b2_hold_verify','c1_ground_recon','c2_isr_heavy','d1_hold_confirm','d2_continuity_first_finish'];
  const policy:CalibrationPolicy={...MISSION_POLICIES[0]!,policyId:'witness_random',requestedActionByRound:Object.fromEntries(actions.map((a,i)=>[i+1,a])),targetSelectorByRound:{4:'alphaIfActiveElseFirst',5:'alphaIfActiveElseFirst',7:'alphaIfActiveElseFirst'}};
  const fixed=simulateScenario5({worldId:'W-corridor_alpha_east-opportunistic_interdiction' as WorldId,environmentSeed:1,policy});
  equal(fixed.result.missionEndState.endStateId,'mission_incomplete_continuity_preserved','Approved fixed E3 witness');witnesses.set(fixed.result.missionEndState.endStateId,fixed);
  const results=[];
  const fixtures=[];
  for(const [id,title] of Object.entries(ENDING_TITLES)){
    const run=witnesses.get(id as any);check(!!run,`Reachable witness ${id}`);if(!run)continue;
    const explanation=buildEndingExplanation(run.state);
    equal(explanation.end,run.result.missionEndState,'Witness resolver exact');
    check(explanation.directFacts.length>=1,'Direct facts present');
    const facts=explanation.directFacts.join(' ');
    const alpha=run.state.missionState.convoys.find(c=>c.convoyId==='alpha')!;
    const continuity=calculateNetworkContinuity(run.state.missionState);
    if(id==='critical_cargo_lost_or_compromised') {
      if(alpha.integrity<55)check(facts.includes(String(alpha.integrity))&&facts.includes('55'),'E1 exact integrity/threshold');
      else check(facts.includes('تحویل نشد')&&facts.includes(String(continuity))&&facts.includes('75'),'E1 exact non-delivery/continuity branch');
    } else if(id==='priority_delivered_network_degradation') {
      check(facts.includes('الف تحویل شد')&&facts.includes(String(continuity))&&continuity<100,'E2 delivery and continuity');
      for(const row of explanation.rows.filter(r=>!r.contributes))check(facts.includes(String(row.integrity))&&facts.includes(`T+${row.arrival}`)&&facts.includes(`T+${row.deadline}`),'E2 each failing convoy has both criteria');
    } else if(id==='mission_incomplete_continuity_preserved') {
      const arrival=alpha.baselineArrivalMinute+alpha.delayMinutes;
      check(facts.includes('تحویل نشد')&&facts.includes(String(alpha.integrity))&&facts.includes('55')&&facts.includes('75')&&facts.includes(`T+${arrival}`)&&facts.includes(`${Math.max(0,arrival-360)} دقیقه`),'E3 exact health, continuity, arrival, horizon miss');
    } else {
      check(facts.includes('الف تحویل شد')&&facts.includes('100٪'),'E4/E5/E6 delivery and continuity');
      if(id==='delivery_complete_attribution_unresolved')check(facts.includes('انتساب عملیاتی حل‌نشده')&&facts.includes('دو نوع منبع'),'E5 attribution and corroboration');
      else check(facts.includes('انتساب عملیاتی حل شد')&&facts.includes(id==='delivery_complete_threat_contained'?'اختلال مهار شد.':'اختلال مهار نشد.'),'E4/E6 attribution and containment match resolver');
    }
    const html=renderToStaticMarkup(<ScenarioFiveMissionEnding state={run.state} result={run.result} onComplete={()=>{}} onCognitiveEntry={()=>{}} />);
    check(html.includes(title)&&html.includes(`data-ending-id="${id}"`),'Correct rendered ending title/id');
    equal((html.match(/class="s5-trace-card"><summary>تصمیم /g)??[]).length,8,'Rendered trace contains eight decisions');
    results.push({id,title,result:'PASS',worldId:run.worldId,seed:run.environmentSeed,directFacts:explanation.directFacts});
    fixtures.push({id,state:run.state,result:run.result});
  }
  writeFileSync('docs/scenario5-phase8d-witnesses.json',JSON.stringify(fixtures,null,2));
  return results;
}
