import type { ScenarioFiveEvidenceSummary, ScenarioFiveOutcomeView } from "../../ScenarioFiveTypes";
import { getMissionAction } from "../model/mission/index";
import { SCENARIO5_ACTION_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_STATUS_LABELS_FA } from "./uiContentFa";
import { ScenarioFiveInformationPicture } from "./ScenarioFiveInformationPicture";
import { ScenarioFiveOperationalTime } from "./ScenarioFiveTime";

const Arrow = ({before, after, prefix = ''}: {before: number; after: number; prefix?: string}) => <bdi dir="ltr">{prefix}{before} → {prefix}{after}</bdi>;
export const ScenarioFiveOutcomeContent = ({outcome, newEvidence = outcome.newEvidence}: {
  outcome: ScenarioFiveOutcomeView; newEvidence?: readonly ScenarioFiveEvidenceSummary[];
}) => <>
  <section className="s5-outcome-block"><h3>اقدام اجراشده</h3>
    <strong>{SCENARIO5_ACTION_COPY_FA[outcome.actionId].title}</strong>
    <p>هدف: {outcome.effectiveTargetCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[outcome.effectiveTargetCorridorId].targetLabel : 'کل شبکه / بدون هدف انتخابی'}</p>
    <p>ظرفیت پایش و اطلاعات (ISR): <Arrow before={outcome.resourcesBefore.isrCapacity} after={outcome.resourcesAfter.isrCapacity} /></p>
    <p>ذخیره پشتیبانی: <Arrow before={outcome.resourcesBefore.supportReserve} after={outcome.resourcesAfter.supportReserve} /></p>
    <p>زمان عملیاتی پیش و پس از اقدام: <Arrow before={outcome.worldClockBefore} after={outcome.worldClockAfter} prefix="T+" /> دقیقه از آغاز مأموریت</p>
    {outcome.roundId === 8 && <div className="s5-time-breakdown">
      <p>زمان اجرای تصمیم نهایی: {outcome.actionDurationMinutes} دقیقه</p>
      <p>زمان پایه ارزیابی این تصمیم: {outcome.baselineMinutes} دقیقه</p>
      <p>ادامه مأموریت تا پایان پنجره ارزیابی: {outcome.passiveHorizonMinutes} دقیقه</p>
      <p>پایان مأموریت: <bdi dir="ltr">T+360</bdi> دقیقه از آغاز مأموریت</p>
    </div>}
    {getMissionAction(outcome.actionId).holdsForStep && <p>توقف کوتاه برای راستی‌آزمایی انجام شد؛ کاروان اکنون حرکت را ادامه می‌دهد.</p>}
  </section>
  <section className="s5-outcome-block"><h3>اطلاعات تازه</h3>
    <p>{newEvidence.length ? `${newEvidence.length} شاهد تازه به تصویر عملیاتی اضافه شد.` : 'شاهد تازه‌ای در این مرحله دریافت نشد.'}</p>
    {outcome.pendingGroundRequest && <p>بررسی زمینی آغاز شد. گزارش ممکن است در یکی از مراحل بعد دریافت شود.</p>}
    {newEvidence.length > 0 && <ScenarioFiveInformationPicture title="شواهد تازه" evidence={newEvidence} />}
    {outcome.lateEvidenceIds.length > 0 && <p className="s5-method-note">پس از برآورد نهایی دریافت شد: {outcome.lateEvidenceIds.join('، ')}. این اطلاعات هنگام ثبت برآورد نهایی در اختیار شما نبود.</p>}
  </section>
  <section className="s5-outcome-block"><h3>تغییرات قابل مشاهده</h3>
    <div className="s5-outcome-list">{outcome.convoyChanges.map(change => <article key={change.corridorId}>
      <strong>{SCENARIO5_CORRIDOR_CONTENT_FA[change.corridorId].targetLabel}</strong>
      {change.statusBefore !== change.statusAfter && <span>وضعیت: {SCENARIO5_STATUS_LABELS_FA[change.statusBefore]} ← {SCENARIO5_STATUS_LABELS_FA[change.statusAfter]}</span>}
      {change.integrityBefore !== change.integrityAfter && <span>سلامت عملیاتی: <Arrow before={change.integrityBefore} after={change.integrityAfter} /></span>}
      <span>تأخیر تجمعی: <Arrow before={change.delayBefore} after={change.delayAfter} /> دقیقه</span>
      <span>رسیدن برآوردی: <Arrow before={change.projectedArrivalBefore} after={change.projectedArrivalAfter} prefix="T+" /> دقیقه</span>
      <span>مهلت تحویل: <bdi dir="ltr">T+{change.deadlineMinute}</bdi> دقیقه</span>
      <span>فاصله تا مهلت (منفی یعنی عبور): <Arrow before={change.deadlineMarginBefore} after={change.deadlineMargin} /> دقیقه</span>
      {change.newMitigations.length > 0 && <span>فعال‌شده: {change.newMitigations.join('، ')}</span>}
      {change.expiredMitigations.map(m => <span key={m}>{m}</span>)}
    </article>)}</div>
    {outcome.convoyChanges.length === 0 && <p>تغییر قابل مشاهده‌ای در وضعیت کاروان‌ها ثبت نشد.</p>}
  </section>
  <section className="s5-outcome-block"><h3>وضعیت جدید</h3>
    <p>ظرفیت پایش و اطلاعات (ISR): {outcome.resourcesAfter.isrCapacity} · ذخیره پشتیبانی: {outcome.resourcesAfter.supportReserve}</p>
    <p><ScenarioFiveOperationalTime minutes={outcome.worldClockAfter} /> · شواهد ثبت‌شده: {outcome.totalEvidenceCount}</p>
    <p>{outcome.convoys.map(c => `${SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId].convoyLabel}: ${SCENARIO5_STATUS_LABELS_FA[c.status]}`).join(' · ')}</p>
  </section>
</>;

export const ScenarioFiveOutcomePanel = ({ outcome, newEvidence, onContinue, review = false }: {
  outcome: ScenarioFiveOutcomeView; newEvidence?: readonly ScenarioFiveEvidenceSummary[]; onContinue: () => void; review?: boolean;
}) => <section className="s5-panel s5-outcome-panel" aria-labelledby="s5-outcome-title" dir="rtl">
  <div className="s5-control-scroll" tabIndex={0} aria-label="جزئیات پیامد تصمیم">
    <h2 id="s5-outcome-title">پیامد قابل مشاهده — تصمیم {outcome.roundId}</h2>
    <ScenarioFiveOutcomeContent outcome={outcome} newEvidence={newEvidence} />
  </div>
  <footer className="s5-control-footer"><button type="button" className="s5-primary-button" onClick={onContinue}>{review ? 'بازگشت به مرحله جاری' : 'ادامه'}</button></footer>
</section>;
