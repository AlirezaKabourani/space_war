import { useEffect, useRef } from "react";
import type { ScenarioFiveEvidenceSummary, ScenarioFiveOutcomeView } from "../../ScenarioFiveTypes";
import { SCENARIO5_ACTION_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_STATUS_LABELS_FA } from "./uiContentFa";
import { ScenarioFiveInformationPicture } from "./ScenarioFiveInformationPicture";
export const ScenarioFiveOutcomePanel = ({ outcome, newEvidence, onContinue }: {
  outcome: ScenarioFiveOutcomeView; newEvidence: readonly ScenarioFiveEvidenceSummary[]; onContinue: () => void;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="s5-outcome-dialog" aria-labelledby="s5-outcome-title" dir="rtl" onCancel={(event) => event.preventDefault()}>
    <div className="s5-outcome-modal">
      <div className="s5-control-scroll" tabIndex={0} aria-label="جزئیات پیامد تصمیم">
        <h2 id="s5-outcome-title">پیامد قابل مشاهده — راند {outcome.roundId}</h2>
        <section className="s5-outcome-block"><h3>اقدام اجراشده</h3>
          <strong>{SCENARIO5_ACTION_COPY_FA[outcome.actionId].title}</strong>
          {outcome.effectiveTargetCorridorId && <p>{SCENARIO5_CORRIDOR_CONTENT_FA[outcome.effectiveTargetCorridorId].targetLabel}</p>}
          <p>زمان عملیاتی: <bdi dir="ltr">T+{outcome.worldClockBefore} → T+{outcome.worldClockAfter}</bdi> دقیقه</p>
          <div className="s5-inline-facts"><span>ISR مصرف‌شده: {outcome.isrSpent}</span><span>پشتیبانی مصرف‌شده: {outcome.supportSpent}</span></div>
        </section>
        <section className="s5-outcome-block"><h3>اطلاعات تازه</h3>
          <p>{newEvidence.length ? `${newEvidence.length} شاهد تازه به تصویر عملیاتی اضافه شد.` : "شاهد تازه‌ای به تصویر عملیاتی اضافه نشد."}</p>
          {newEvidence.length > 0 && <ScenarioFiveInformationPicture title="شواهد تازه" evidence={newEvidence} />}
        </section>
        <section className="s5-outcome-block"><h3>تغییرات قابل مشاهده</h3>
          <div className="s5-outcome-list">{outcome.convoyChanges.map((change) => <article key={change.corridorId}>
            <strong>{SCENARIO5_CORRIDOR_CONTENT_FA[change.corridorId].targetLabel}</strong>
            {change.statusBefore !== change.statusAfter && <span>وضعیت: {SCENARIO5_STATUS_LABELS_FA[change.statusBefore]} ← {SCENARIO5_STATUS_LABELS_FA[change.statusAfter]}</span>}
            {change.integrityBefore !== change.integrityAfter && <span>یکپارچگی: <bdi dir="ltr">{change.integrityBefore} → {change.integrityAfter}</bdi></span>}
            <span>تأخیر: <bdi dir="ltr">{change.delayBefore} → {change.delayAfter}</bdi> دقیقه (تغییر {change.delayDelta >= 0 ? "+" : ""}{change.delayDelta})</span>
            <span>زمان برآوردی رسیدن: <bdi dir="ltr">T+{change.projectedArrivalBefore} → T+{change.projectedArrivalAfter}</bdi></span>
            <span>مهلت تحویل: <bdi dir="ltr">T+{change.deadlineMinute}</bdi> دقیقه</span>
            <span>{change.deadlineMargin >= 0 ? `فاصله تا مهلت: ${change.deadlineMargin} دقیقه` : `عبور از مهلت: ${Math.abs(change.deadlineMargin)} دقیقه`}</span>
            {change.newMitigations.length > 0 && <span>فعال‌شده: {change.newMitigations.join("، ")}</span>}
          </article>)}</div>
          {outcome.convoyChanges.length === 0 && <p>تغییر قابل مشاهده‌ای در وضعیت کاروان‌ها ثبت نشد.</p>}
        </section>
      </div>
      <footer className="s5-control-footer"><button type="button" className="s5-primary-button" onClick={onContinue}>ادامه</button></footer>
    </div>
  </dialog>;
};
