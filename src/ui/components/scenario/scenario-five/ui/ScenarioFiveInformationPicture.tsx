import type { ScenarioFiveEvidenceSummary } from "../../ScenarioFiveTypes";
import { SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_DIRECTION_LABELS_FA, SCENARIO5_SOURCE_LABELS_FA, SCENARIO5_STRENGTH_LABELS_FA } from "./uiContentFa";

// Read-only by design: no runtime state, callbacks, or evidence-open APIs.
export const ScenarioFiveInformationPicture = ({ evidence, title = "تصویر اطلاعاتی فعلی", emptyText = "هنوز شاهد مشخصی در تصویر عملیاتی ثبت نشده است. اطمینان پایین در این مرحله طبیعی است." }: {
  evidence: readonly ScenarioFiveEvidenceSummary[]; title?: string; emptyText?: string;
}) => <section className="s5-information-picture" aria-label={title}>
  <h3>{title}</h3>
  {evidence.length === 0 ? <p className="s5-empty">{emptyText}</p> : <div className="s5-information-list">
    {evidence.map((item) => <article className="s5-information-summary" key={item.evidenceId}>
      <strong>{SCENARIO5_SOURCE_LABELS_FA[item.sourceType]}</strong>
      <span>{item.observedCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[item.observedCorridorId].corridorLabel : "چندمحوره / محل نامشخص"}</span>
      <span>{SCENARIO5_DIRECTION_LABELS_FA[item.direction]}</span>
      <small>قدرت: {SCENARIO5_STRENGTH_LABELS_FA[item.strengthBand]}</small>
    </article>)}
  </div>}
</section>;
