import { useState } from "react";
import type { CorridorId } from "../model/index";
import type { RuntimeBeliefInput } from "../model/runtime/index";
import { SCENARIO5_CORRIDOR_CONTENT_FA } from "./uiContentFa";

const CORRIDORS = Object.keys(SCENARIO5_CORRIDOR_CONTENT_FA) as CorridorId[];

export const ScenarioFiveBeliefPanel = ({
  onSubmit,
}: {
  onSubmit: (input: Omit<RuntimeBeliefInput, "recordedAtMs">) => void;
}) => {
  const [corridorId, setCorridorId] = useState<CorridorId | "">("");
  const [corridorConfidence, setCorridorConfidence] = useState("");
  const [targetedEstimate, setTargetedEstimate] = useState("");
  const [targetedConfidence, setTargetedConfidence] = useState("");
  const values = [corridorConfidence, targetedEstimate, targetedConfidence];
  const valid = corridorId !== "" && values.every((value) => value !== "" && Number(value) >= 0 && Number(value) <= 100);
  return (
    <section className="s5-panel s5-form-panel" aria-labelledby="s5-belief-title">
      <h2 id="s5-belief-title">ثبت برداشت فعلی</h2>
      <p>این ثبت، پاسخ درست/غلط نیست. برداشت فعلی خود را فقط بر اساس اطلاعاتی که تا این لحظه دیده‌اید وارد کنید.</p>
      <label className="s5-belief-field">
        <span className="s5-belief-label">محتمل‌ترین کریدور محل اختلال</span>
        <span className="s5-belief-control"><select className="s5-belief-select" required value={corridorId} onChange={(event) => setCorridorId(event.target.value as CorridorId | "")}>
            <option value="" disabled>انتخاب کنید</option>
            {CORRIDORS.map((id) => <option key={id} value={id}>{SCENARIO5_CORRIDOR_CONTENT_FA[id].targetLabel}</option>)}
          </select></span>
      </label>
      <label className="s5-belief-field">
        <span className="s5-belief-label">اطمینان شما به انتخاب این کریدور</span>
        <span className="s5-belief-control"><input className="s5-belief-number" required type="number" min="0" max="100" dir="ltr" value={corridorConfidence} onChange={(event) => setCorridorConfidence(event.target.value)} /></span>
        <small className="s5-belief-helper">۰ = اطمینان بسیار کم، ۱۰۰ = اطمینان بسیار زیاد</small>
      </label>
      <label className="s5-belief-field">
        <span className="s5-belief-label">تا چه حد احتمال می‌دهید الگوی مشاهده‌شده ناشی از اخلال هدفمند باشد؟</span>
        <span className="s5-belief-control"><input className="s5-belief-number" required type="number" min="0" max="100" dir="ltr" value={targetedEstimate} onChange={(event) => setTargetedEstimate(event.target.value)} /></span>
      </label>
      <label className="s5-belief-field">
        <span className="s5-belief-label">اطمینان شما به برآورد اخلال هدفمند</span>
        <span className="s5-belief-control"><input className="s5-belief-number" required type="number" min="0" max="100" dir="ltr" value={targetedConfidence} onChange={(event) => setTargetedConfidence(event.target.value)} /></span>
      </label>
      <button
        type="button"
        className="s5-primary-button"
        disabled={!valid}
        onClick={() => valid && onSubmit({
          mostLikelyCorridorId: corridorId as CorridorId,
          corridorConfidence: Number(corridorConfidence),
          targetedInterferenceEstimate: Number(targetedEstimate),
          targetedInterferenceConfidence: Number(targetedConfidence),
        })}
      >
        ثبت برداشت و ادامه
      </button>
    </section>
  );
};
