import { applyMissionDecision, createInitialMissionState, isThreatContained, calculateNetworkContinuity, resolveMissionEndState } from '../model/mission/index';
import type { Scenario5EndStateId, Scenario5MissionState } from '../model/mission/index';
import type { Scenario5RuntimeState } from '../model/runtime/index';
import { buildStoredScenario5Outcome, buildScenario5PlayerView } from './presentation';
import { SCENARIO5_CORRIDOR_CONTENT_FA } from './uiContentFa';

// Phase 08D titles belong to the new mission flow. The existing compatibility
// report keeps its historical copy and mapping unchanged.
export const ENDING_TITLES: Readonly<Record<Scenario5EndStateId, string>> = {
  critical_cargo_lost_or_compromised: 'اختلال شدید در مأموریت حیاتی',
  priority_delivered_network_degradation: 'تحویل محموله اولویت‌دار با افت تداوم شبکه',
  mission_incomplete_continuity_preserved: 'تداوم شبکه حفظ شد، اما تحویل اولویت‌دار تکمیل نشد',
  delivery_complete_threat_persistent: 'تحویل کامل؛ اختلال همچنان مهارنشده',
  delivery_complete_attribution_unresolved: 'تحویل کامل؛ منشأ اختلال همچنان حل‌نشده',
  delivery_complete_threat_contained: 'تحویل و تداوم کامل؛ اختلال مهار شد',
};

export const ENDING_NARRATIVES: Record<Scenario5EndStateId, string> = {
  critical_cargo_lost_or_compromised: 'مأموریت با آسیب جدی به هدف اولویت‌دار یا افت هم‌زمان تداوم شبکه به پایان رسید. محموله پزشکی نتوانست در شرایط مورد نیاز مأموریت به وضعیت قابل قبول برسد و شبکه نیز ظرفیت کافی برای جبران کامل این وضعیت را حفظ نکرد.',
  priority_delivered_network_degradation: 'کاروان الف و محموله پزشکی به مقصد رسیدند، اما همه بخش‌های شبکه نتوانستند شرایط عملیاتی مورد نیاز را تا پایان مأموریت حفظ کنند. هدف اولویت‌دار محقق شد، ولی بخشی از تداوم شبکه از دست رفت.',
  mission_incomplete_continuity_preserved: 'بخش عمده شبکه توانست شرایط عملیاتی خود را حفظ کند، اما محموله اولویت‌دار تا پایان افق مأموریت به مقصد نرسید. شبکه فرو نپاشید، ولی هدف اصلی تحویل در زمان مأموریت تکمیل نشد.',
  delivery_complete_threat_persistent: 'مأموریت لجستیکی با تداوم کامل شبکه به پایان رسید و شواهد برای شکل‌گیری یک انتساب عملیاتی کافی بود، اما عامل فشار تا پایان مأموریت به وضعیت مهارشده نرسید.',
  delivery_complete_attribution_unresolved: 'شبکه لجستیکی مأموریت خود را کامل کرد و همه کاروان‌ها شرایط عملیاتی لازم را حفظ کردند، اما شواهد جمع‌آوری‌شده برای شکل‌گیری یک انتساب عملیاتی کافی نبود. مأموریت تحویل کامل شد، ولی بخشی از ابهام اطلاعاتی باقی ماند.',
  delivery_complete_threat_contained: 'مأموریت لجستیکی با حفظ کامل تداوم شبکه به پایان رسید. شواهد برای شکل‌گیری انتساب عملیاتی کافی بود و وضعیت نهایی نیز نشان می‌دهد فشار مؤثر بر شبکه مهار شده است.',
};

export function continuityRows(mission: Scenario5MissionState) {
  return mission.convoys.map(c => ({corridorId: c.corridorId, integrity: c.integrity,
    arrival: c.baselineArrivalMinute + c.delayMinutes, deadline: c.deadlineMinute,
    healthPass: c.integrity >= 60, deadlinePass: c.baselineArrivalMinute + c.delayMinutes <= c.deadlineMinute,
    // Delegate the contribution to the exact frozen selector, including its thresholds.
    contributes: calculateNetworkContinuity({...mission, convoys: [c]}) === 25,
  }));
}

export function buildEndingExplanation(state: Scenario5RuntimeState) {
  if (state.stage.stageId !== 'complete') throw new Error('Ending requires completed runtime');
  const m = state.missionState;
  const end = resolveMissionEndState(m);
  const alpha = m.convoys.find(c => c.convoyId === 'alpha')!;
  const arrival = alpha.baselineArrivalMinute + alpha.delayMinutes;
  const rows = continuityRows(m);
  const directFacts: string[] = [];
  switch (end.endStateId) {
    case 'critical_cargo_lost_or_compromised':
      if (alpha.integrity < 55) directFacts.push(`سلامت عملیاتی کاروان الف: ${alpha.integrity}؛ کمتر از آستانه 55.`);
      else directFacts.push('کاروان الف تحویل نشد.', `تداوم عملیاتی شبکه: ${end.networkContinuityPercent}٪؛ کمتر از آستانه 75٪.`);
      break;
    case 'priority_delivered_network_degradation':
      directFacts.push('کاروان الف تحویل شد.', `تداوم عملیاتی شبکه: ${end.networkContinuityPercent}٪؛ کمتر از 100٪.`);
      for (const r of rows.filter(r => !r.contributes)) directFacts.push(`${SCENARIO5_CORRIDOR_CONTENT_FA[r.corridorId].convoyLabel}: سلامت ${r.integrity} در برابر حداقل 60 (${r.healthPass ? 'برقرار' : 'برقرار نیست'})؛ رسیدن برآوردی T+${r.arrival} دقیقه در برابر مهلت T+${r.deadline} دقیقه (${r.deadlinePass ? 'برقرار' : 'برقرار نیست'}).`);
      break;
    case 'mission_incomplete_continuity_preserved':
      directFacts.push('کاروان الف تحویل نشد.', `سلامت عملیاتی کاروان الف: ${alpha.integrity}؛ حداقل 55.`, `تداوم عملیاتی شبکه: ${end.networkContinuityPercent}٪؛ حداقل 75٪.`, `رسیدن برآوردی الف: T+${arrival} دقیقه؛ افق مأموریت: T+360 دقیقه؛ ${Math.max(0,arrival-360)} دقیقه عبور از افق.`);
      break;
    default:
      directFacts.push('کاروان الف تحویل شد.', 'تداوم عملیاتی شبکه: 100٪.');
      if (end.endStateId === 'delivery_complete_attribution_unresolved') {
        directFacts.push('انتساب عملیاتی حل‌نشده است.', 'شرط انتساب، همگرایی دست‌کم دو نوع منبعِ سازگار با اخلال هدفمند روی یک کریدور، با دست‌کم یک شاهد متوسط یا قوی است؛ این شرط برقرار نشد.');
      } else {
        directFacts.push('انتساب عملیاتی حل شد.', end.threatContained ? 'اختلال مهار شد.' : 'اختلال مهار نشد.');
      }
  }
  return {end, directFacts, rows, narrative: ENDING_NARRATIVES[end.endStateId]};
}

// Rank important state transitions lexicographically; ties use earlier round.
// No evaluative labels or counterfactual causal claims are generated.
export function selectTurningPoints(state: Scenario5RuntimeState) {
  if (state.stage.stageId !== 'complete') throw new Error('Turning points require completion');
  const end = resolveMissionEndState(state.missionState);
  // After completion only: replay the frozen engine on an isolated value to recover
  // containment transitions absent from the public decision snapshots. Never write back.
  let replay = createInitialMissionState(state.missionState.trueWorldState.worldId, state.missionState.trueWorldState.seed);
  const containmentChanges = state.domainDecisionRecords.map(record => {
    const before = isThreatContained(replay);
    replay = applyMissionDecision(replay, {actionId: record.actionId, ...(record.effectiveTargetCorridorId ? {targetCorridorId:record.effectiveTargetCorridorId} : {})}).state;
    return before !== isThreatContained(replay);
  });
  const ranked = state.domainDecisionRecords.map((record,index) => {
    const outcome = buildStoredScenario5Outcome(state,index);
    const threshold = record.convoyStateBefore.some((b,i) => {
      const a=record.convoyStateAfter[i]!;
      return [55,60].some(t => (b.integrity >= t) !== (a.integrity >= t))
        || (b.baselineArrivalMinute+b.delayMinutes <= b.deadlineMinute) !== (a.baselineArrivalMinute+a.delayMinutes <= a.deadlineMinute)
        || (b.convoyId === 'alpha' && (b.baselineArrivalMinute+b.delayMinutes <= 360) !== (a.baselineArrivalMinute+a.delayMinutes <= 360));
    });
    const resolverChange = outcome.convoyChanges.some(c => c.statusBefore !== c.statusAfter && (c.corridorId === 'corridor_alpha_east' || end.networkContinuityPercent < 100));
    const attribution = state.missionState.missionEvents.some(e => e.roundId === record.roundId && e.eventKind === 'mission_attribution_updated' && e.payload.from !== e.payload.to);
    const mitigation = record.convoyStateBefore.some((b,i) => {
      const a=record.convoyStateAfter[i]!;
      return (!b.fallbackNav&&a.fallbackNav)||(!b.routeHardened&&a.routeHardened)||(!b.groundSupport&&a.groundSupport);
    });
    const eta = Math.max(0,...outcome.convoyChanges.map(c => Math.abs(c.projectedArrivalAfter-c.projectedArrivalBefore)));
    const health = Math.max(0,...outcome.convoyChanges.map(c => Math.abs(c.integrityAfter-c.integrityBefore)));
    return {round:record.roundId,outcome,rank:[+threshold,+resolverChange,+attribution,+containmentChanges[index],+mitigation,eta,health,outcome.newEvidenceCount,outcome.isrSpent+outcome.supportSpent],
      label:threshold ? 'عبور از آستانه مأموریت' : resolverChange ? 'تغییر وضعیت مرتبط با نتیجه' : attribution ? 'تغییر انتساب عملیاتی' : containmentChanges[index] ? 'تغییر وضعیت مهار اختلال' : mitigation ? 'فعال‌سازی پوشش' : eta ? 'تغییر رسیدن برآوردی' : health ? 'تغییر سلامت عملیاتی' : 'تغییر شواهد و منابع'};
  });
  return ranked.sort((a,b) => {for(let i=0;i<a.rank.length;i++){const d=b.rank[i]!-a.rank[i]!; if(d) return d;}return a.round-b.round;}).slice(0,5).sort((a,b)=>a.round-b.round);
}

export function buildMissionAar(state: Scenario5RuntimeState) {
  const explanation = buildEndingExplanation(state);
  const finalBelief = state.beliefs.find(b=>b.checkpointId === 'D_final_belief');
  return {...explanation, view:buildScenario5PlayerView(state), outcomes:state.domainDecisionRecords.map((_,i)=>buildStoredScenario5Outcome(state,i)),
    turningPoints:selectTurningPoints(state), lateEvidenceIds:finalBelief ? state.evidence.filter(e=>!finalBelief.visibleEvidenceIdsAtCheckpoint.includes(e.evidenceId)).map(e=>e.evidenceId) : []};
}
