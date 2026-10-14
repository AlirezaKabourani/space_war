import { useState } from "react";
import type { ReasonId } from "../model/cognitive/index";
import type { ScenarioFiveReasonContext } from "../../ScenarioFiveTypes";
import { SCENARIO5_ACTION_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_REASON_LABELS_FA } from "./uiContentFa";

const REASON_IDS = Object.keys(SCENARIO5_REASON_LABELS_FA) as ReasonId[];

export const ScenarioFiveReasonPanel = ({
  context,
  onSubmit,
}: {
  context: ScenarioFiveReasonContext;
  onSubmit: (reasonId: ReasonId) => void;
}) => {
  const [reasonId, setReasonId] = useState<ReasonId | "">("");
  return (
    <section className="s5-panel s5-form-panel" aria-labelledby="s5-reason-title">
      <h2 id="s5-reason-title">دلیل اصلی تصمیم</h2>
      <p>پیش از مشاهده پیامد تصمیم، اصلی‌ترین دلیل انتخاب خود را مشخص کنید.</p>
      <div className="s5-confirmed-choice">
        <span>تصمیم تأییدشده</span>
        <strong>{SCENARIO5_ACTION_COPY_FA[context.actionId].title}</strong>
        <em>{context.targetCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[context.targetCorridorId].targetLabel : "بدون هدف انتخابی"}</em>
      </div>
      <div className="s5-reason-options" role="radiogroup" aria-label="دلیل اصلی تصمیم">
        {REASON_IDS.map((id) => (
          <label key={id} className={reasonId === id ? "s5-selected" : ""}>
            <input type="radio" name="s5-reason" value={id} checked={reasonId === id} onChange={() => setReasonId(id)} />
            <span>{SCENARIO5_REASON_LABELS_FA[id]}</span>
          </label>
        ))}
      </div>
      <button type="button" className="s5-primary-button" disabled={!reasonId} onClick={() => reasonId && onSubmit(reasonId)}>
        ثبت دلیل و اجرای تصمیم
      </button>
    </section>
  );
};
