import type { ScenarioFiveOutcomeView, ScenarioFivePlayerViewModel } from '../../ScenarioFiveTypes';
import type { VisibleDecision } from './gameplayPresentation';
import { mitigationLabels, reroutedCorridors } from './gameplayPresentation';
import { SCENARIO5_ACTION_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_PHASE_CONTENT_FA, SCENARIO5_SOURCE_LABELS_FA } from './uiContentFa';
import type {ScenarioFiveHeaderPresentation} from './phaseHeader';
import { ScenarioFiveOperationalTime } from './ScenarioFiveTime';

export const ScenarioFivePhaseHeader = ({header}: {header:ScenarioFiveHeaderPresentation}) => <>
  <div className="s5-command-identity"><span>سناریو ۲ — امواج خاموش</span><h1>{header.title}</h1>{header.subtitle && <p>{header.subtitle}</p>}</div>
  <span className="s5-stage-chip">{header.stageLabel}</span>
</>;
export const ScenarioFivePhaseProgress = ({header}: {header:ScenarioFiveHeaderPresentation}) => <nav className="s5-phase-progress" aria-label="پیشرفت مأموریت">
  {header.progress.map((p,index) => <span key={p.phase} aria-current={p.state === 'current' ? 'step' : undefined} className={p.state === 'current' ? 's5-current' : p.state === 'completed' ? 's5-done' : ''}>{p.state === 'completed' ? '✓ ' : ''}{p.label}{index < 3 && ' ← '}</span>)}
</nav>;

export const ScenarioFiveLastDecision = ({outcome, onReview}: {outcome: ScenarioFiveOutcomeView; onReview: () => void}) => <aside className="s5-last-decision">
  <div className="s5-recent-identity"><span>آخرین تصمیم</span><strong>{SCENARIO5_ACTION_COPY_FA[outcome.actionId].title}</strong></div>
  <span className="s5-recent-facts">ISR −{outcome.isrSpent} · پشتیبانی −{outcome.supportSpent} · زمان سپری‌شده: {outcome.worldClockAfter - outcome.worldClockBefore} دقیقه · {outcome.newEvidenceCount} شاهد جدید
    {outcome.convoyChanges.filter(c => c.delayDelta !== 0).map(c => ` · ${SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId].convoyLabel} ${c.delayDelta > 0 ? '+' : ''}${c.delayDelta} دقیقه تأخیر`)}</span>
  <button type="button" onClick={onReview}>مشاهده جزئیات</button>
</aside>;

export const ScenarioFiveAccumulatedProgress = ({view, history}: {view: ScenarioFivePlayerViewModel; history: readonly VisibleDecision[]}) => <details className="s5-accumulated">
  <summary>آنچه تا اینجا ساخته‌اید</summary>
  <h3>شناخت</h3><p>{view.visibleEvidence.length} شاهد · منابع: {[...new Set(view.visibleEvidence.map(e => SCENARIO5_SOURCE_LABELS_FA[e.sourceType]))].join('، ') || 'هنوز ثبت نشده'}</p>
  <p>پوشش: {[...new Set(view.visibleEvidence.flatMap(e => e.observedCorridorId ? [SCENARIO5_CORRIDOR_CONTENT_FA[e.observedCorridorId].corridorLabel] : []))].join('، ') || 'هنوز ثبت نشده'}</p>
  <h3>تاب‌آوری</h3>{view.convoys.map(c => <p key={c.convoyId}>{SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId].convoyLabel}: {mitigationLabels(c).join('، ') || 'پوشش پایدار تازه ثبت نشده'}</p>)}
  <p>سوابق اقدامات: {history.filter(r => /fallback|ground|checkpoint|escort|crosscheck/.test(r.actionId)).map((r,i) => <span key={i}>{SCENARIO5_ACTION_COPY_FA[r.actionId].title}؛ </span>)}</p>
  <h3>مسیر</h3><p>{[...new Set(reroutedCorridors(history))].map(id => SCENARIO5_CORRIDOR_CONTENT_FA[id].targetLabel).join('، ') || 'تغییر مسیر ثبت نشده'}</p>
  <h3>منابع</h3><p>ظرفیت پایش و اطلاعات (ISR): {view.resources.isrCapacity} · ذخیره پشتیبانی: {view.resources.supportReserve}</p>
</details>;

export const ScenarioFivePhaseSummary = ({phase, outcomes, view, onContinue}: {
  phase: 'A'|'B'|'C'; outcomes: readonly ScenarioFiveOutcomeView[]; view: ScenarioFivePlayerViewModel; onContinue: () => void;
}) => <section className="s5-panel s5-phase-summary">
  <div className="s5-control-scroll"><h2>فاز {{A:'۱',B:'۲',C:'۳'}[phase]} — {SCENARIO5_PHASE_CONTENT_FA[phase]} کامل شد</h2>
    <p>تصمیم‌های تکمیل‌شده: {outcomes.map(o => o.roundId).join('، ')}</p>
    <p><ScenarioFiveOperationalTime minutes={view.resources.worldClockMinutes} horizon={view.resources.missionHorizonMinutes} /> · زمان باقی‌مانده: {Math.max(0, view.resources.missionHorizonMinutes - view.resources.worldClockMinutes)} دقیقه</p>
    <p>ظرفیت پایش و اطلاعات (ISR): {view.resources.isrCapacity} · ذخیره پشتیبانی: {view.resources.supportReserve}</p>
    <p>شواهد ثبت‌شده: {view.visibleEvidence.length}</p>
    {outcomes.map(o => <article key={o.roundId}><h3>{SCENARIO5_ACTION_COPY_FA[o.actionId].title}</h3><p>{o.newEvidenceCount} شاهد تازه · {o.effectiveTargetCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[o.effectiveTargetCorridorId].targetLabel : 'کل شبکه'}</p>
      {o.convoyChanges.map(c => <p key={c.corridorId}>{SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId].convoyLabel}: رسیدن برآوردی <bdi dir="ltr">T+{c.projectedArrivalBefore} → T+{c.projectedArrivalAfter}</bdi> دقیقه · {c.newMitigations.join('، ')}</p>)}</article>)}
  </div><footer className="s5-control-footer"><button type="button" className="s5-primary-button" onClick={onContinue}>ادامه به مرحله بعد</button></footer>
</section>;
