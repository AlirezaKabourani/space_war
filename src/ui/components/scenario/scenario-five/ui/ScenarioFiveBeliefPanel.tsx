import { useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { CorridorId } from "../model/index";
import type { RuntimeBeliefInput } from "../model/runtime/index";
import type { ScenarioFiveEvidenceSummary } from "../../ScenarioFiveTypes";
import { SCENARIO5_BELIEF_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA } from "./uiContentFa";
import { ScenarioFiveInformationPicture } from "./ScenarioFiveInformationPicture";
const CORRIDORS = Object.keys(SCENARIO5_CORRIDOR_CONTENT_FA) as CorridorId[];
export type ScenarioFiveBeliefStage = keyof typeof SCENARIO5_BELIEF_COPY_FA;
export const ScenarioFiveBeliefPanel = ({ stageId, evidence, recentEvidenceIds, onSubmit }: {
  stageId: ScenarioFiveBeliefStage; evidence: readonly ScenarioFiveEvidenceSummary[]; recentEvidenceIds: ReadonlySet<string>;
  onSubmit: (input: Omit<RuntimeBeliefInput, "recordedAtMs">) => void;
}) => {
  const [corridorId, setCorridorId] = useState<CorridorId | null>(null);
  const [corridorConfidence, setCorridorConfidence] = useState<number | null>(null);
  const [targetedEstimate, setTargetedEstimate] = useState<number | null>(null);
  const [targetedConfidence, setTargetedConfidence] = useState<number | null>(null);
  const valid = corridorId !== null && corridorConfidence !== null && targetedEstimate !== null && targetedConfidence !== null;
  const copy = SCENARIO5_BELIEF_COPY_FA[stageId];
  const fresh = evidence.filter((item) => recentEvidenceIds.has(item.evidenceId));
  const previous = evidence.filter((item) => !recentEvidenceIds.has(item.evidenceId));
  const slider = (id: string, label: string, value: number | null, setValue: Dispatch<SetStateAction<number | null>>, probability = false) => (
    <div className="s5-belief-field" key={id}>
      <label className="s5-belief-label" htmlFor={id}>{label}</label>
      <output htmlFor={id} aria-live="polite">{value === null ? "ثبت نشده" : <bdi dir="ltr">{value} / 100</bdi>}</output>
      <div className="s5-belief-control">
        <input id={id} className={`s5-belief-range ${value === null ? "s5-untouched" : ""}`} type="range" min="0" max="100" step="1" dir="ltr"
          value={value ?? 50} aria-valuetext={value === null ? "ثبت نشده" : `${value} از ۱۰۰`} aria-describedby={`${id}-bounds s5-slider-help`}
          style={{ "--s5-range-fill": `${value ?? 0}%` } as CSSProperties}
          onChange={(event) => setValue(Number(event.target.value))}
          onPointerDown={(event) => {
            // A real midpoint click registers 50 even if the native input does not emit change.
            const rect = event.currentTarget.getBoundingClientRect();
            setValue(Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * 100));
          }}
          onKeyDown={(event) => {
            if (value === null && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
              event.preventDefault();
              setValue(event.key === "Home" ? 0 : event.key === "End" ? 100 : ["ArrowLeft", "ArrowDown", "PageDown"].includes(event.key) ? 49 : 51);
            }
          }} />
      </div>
      <div id={`${id}-bounds`} className="s5-slider-bounds"><span>۰ = {probability ? "احتمال بسیار کم" : "اطمینان بسیار کم"}</span><span>۱۰۰ = {probability ? "احتمال بسیار زیاد" : "اطمینان بسیار زیاد"}</span></div>
    </div>
  );
  return <section className="s5-panel s5-form-panel s5-belief-panel" aria-labelledby="s5-belief-title">
    <div className="s5-control-scroll" tabIndex={0} aria-label="شواهد و ثبت برداشت">
      <h2 id="s5-belief-title">{copy.title}</h2><p className="s5-stage-instruction">{copy.instruction}</p>
      {stageId === "belief:A2_postbelief" ? <>
        {fresh.length === 0 && <p className="s5-method-note">در بررسی اخیر شاهد تازه‌ای اضافه نشد؛ می‌توانید برداشت قبلی خود را حفظ یا بازنگری کنید.</p>}
        <ScenarioFiveInformationPicture title="شواهد تازه از بررسی اخیر" evidence={fresh} emptyText="شاهد تازه‌ای اضافه نشد." />
        <ScenarioFiveInformationPicture title="شواهد قبلی" evidence={previous} emptyText="شاهد قبلی ثبت نشده است." />
      </> : <ScenarioFiveInformationPicture title={stageId === "belief:A2_prebelief" ? "اطلاعاتی که اکنون در اختیار دارید" : "تصویر اطلاعاتی فعلی"} evidence={evidence} />}
      <fieldset className="s5-corridor-field"><legend>محتمل‌ترین کریدور محل اختلال</legend>
        <div className="s5-corridor-cards">{CORRIDORS.map((id) => <label key={id} className={`s5-corridor-card ${corridorId === id ? "s5-selected" : ""}`}>
          <input type="radio" name="s5-belief-corridor" value={id} checked={corridorId === id} onChange={() => setCorridorId(id)} />
          <span>{SCENARIO5_CORRIDOR_CONTENT_FA[id].targetLabel}</span>{corridorId === id && <b aria-hidden="true">✓</b>}
        </label>)}</div>
      </fieldset>
      <p id="s5-slider-help" className="s5-belief-helper">برای ثبت مقدار، روی نوار کلیک کنید یا با کلیدهای جهت مقدار را تغییر دهید.</p>
      {slider("s5-corridor-confidence", "اطمینان شما به انتخاب این کریدور", corridorConfidence, setCorridorConfidence)}
      {slider("s5-targeted-estimate", "تا چه حد احتمال می‌دهید الگوی مشاهده‌شده ناشی از اخلال هدفمند باشد؟", targetedEstimate, setTargetedEstimate, true)}
      {slider("s5-targeted-confidence", "اطمینان شما به برآورد اخلال هدفمند", targetedConfidence, setTargetedConfidence)}
    </div>
    <footer className="s5-control-footer"><button type="button" className="s5-primary-button" disabled={!valid}
      onClick={() => valid && onSubmit({ mostLikelyCorridorId: corridorId, corridorConfidence, targetedInterferenceEstimate: targetedEstimate, targetedInterferenceConfidence: targetedConfidence })}>
      ثبت برداشت و ادامه
    </button></footer>
  </section>;
};
