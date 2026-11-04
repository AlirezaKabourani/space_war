import { useState } from "react";
import type { ReasonId } from "../model/cognitive/index";
import { ScenarioFiveInformationPicture } from "./ScenarioFiveInformationPicture";
import { getMissionAction } from "../model/mission/index";
import type { ScenarioFiveEvidenceSummary, ScenarioFiveReasonContext } from "../../ScenarioFiveTypes";
import { SCENARIO5_ACTION_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_REASON_LABELS_FA } from "./uiContentFa";

const REASON_IDS = Object.keys(SCENARIO5_REASON_LABELS_FA) as ReasonId[];

export const ScenarioFiveReasonPanel = ({
  context,
  evidence,
  onSubmit,
}: {
  context: ScenarioFiveReasonContext;
  evidence: readonly ScenarioFiveEvidenceSummary[];
  onSubmit: (reasonId: ReasonId) => void;
}) => {
  const [reasonId, setReasonId] = useState<ReasonId | "">("");
  const action = getMissionAction(context.actionId);
  return (
    <section className="s5-panel s5-form-panel" aria-labelledby="s5-reason-title">
      <div className="s5-control-scroll" tabIndex={0} aria-label="شواهد و دلیل تصمیم">
      <h2 id="s5-reason-title">تصمیم در انتظار اجرا</h2>
      <p>تصمیم پس از ثبت دلیل اجرا می‌شود و نتیجه آن در مرحله بعد نمایش داده خواهد شد.</p>
      <div className="s5-confirmed-choice">
        <span>تصمیم در انتظار ثبت دلیل</span>
        <strong>{SCENARIO5_ACTION_COPY_FA[context.actionId].title}</strong>
        <em>{context.targetCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[context.targetCorridorId].targetLabel : "بدون هدف انتخابی"}</em>
        <span>هزینه پایش و اطلاعات (ISR): {action.isrCost} · هزینه پشتیبانی: {action.supportCost} · زمان اجرای اقدام: {action.durationMinutes} دقیقه</span>
      </div>
      <ScenarioFiveInformationPicture evidence={evidence} />
      <div className="s5-reason-options" role="radiogroup" aria-label="دلیل اصلی تصمیم">
        {REASON_IDS.map((id) => (
          <label key={id} className={reasonId === id ? "s5-selected" : ""}>
            <input type="radio" name="s5-reason" value={id} checked={reasonId === id} onChange={() => setReasonId(id)} />
            <span>{SCENARIO5_REASON_LABELS_FA[id]}</span>
          </label>
        ))}
      </div>
      </div>
      <footer className="s5-control-footer"><button type="button" className="s5-primary-button" disabled={!reasonId} onClick={() => reasonId && onSubmit(reasonId)}>
        ثبت دلیل و اجرای تصمیم
      </button></footer>
    </section>
  );
};
