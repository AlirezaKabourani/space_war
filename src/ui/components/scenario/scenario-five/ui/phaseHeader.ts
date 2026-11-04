import type {ScenarioFivePlayerViewModel} from '../../ScenarioFiveTypes';
import {phaseNumber} from './gameplayPresentation';
import {getScenario5PlayerStageLabel,SCENARIO5_PHASE_CONTENT_FA,SCENARIO5_ROUND_CONTENT_FA} from './uiContentFa';

const phases = ['A','B','C','D'] as const;
const persianNumber = (value: number) => String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
export function buildScenarioFiveHeader(view: Pick<ScenarioFivePlayerViewModel,'phaseId'|'roundId'|'stageId'>, reviewedPhase: 'A'|'B'|'C'|null) {
  const completed = reviewedPhase ? phaseNumber(reviewedPhase) : phaseNumber(view.phaseId ?? 'A') - 1;
  return {
    reviewing: reviewedPhase !== null,
    title: reviewedPhase ? `مرور پایان فاز ${persianNumber(phaseNumber(reviewedPhase))} — ${SCENARIO5_PHASE_CONTENT_FA[reviewedPhase]}`
      : view.phaseId ? `فاز ${phaseNumber(view.phaseId)} از ۴ — ${SCENARIO5_PHASE_CONTENT_FA[view.phaseId]}` : 'گذار مأموریت',
    subtitle: reviewedPhase && view.phaseId && view.roundId
      ? `مرحله بعد: فاز ${persianNumber(phaseNumber(view.phaseId))} — ${SCENARIO5_PHASE_CONTENT_FA[view.phaseId]} · تصمیم ${persianNumber(view.roundId)} از ۸`
      : view.roundId ? `تصمیم ${view.roundId} از ۸ — ${SCENARIO5_ROUND_CONTENT_FA[view.roundId].title}` : null,
    stageLabel: reviewedPhase ? 'مرور فاز' : getScenario5PlayerStageLabel(view.stageId),
    progress: phases.map((phase,index) => ({phase,label:['ساخت تصویر','مدیریت مسیر','تاب‌آوری','پایان مأموریت'][index],
      state: index < completed ? 'completed' as const : !reviewedPhase && view.phaseId === phase ? 'current' as const : 'upcoming' as const})),
  };
}
export type ScenarioFiveHeaderPresentation = ReturnType<typeof buildScenarioFiveHeader>;
