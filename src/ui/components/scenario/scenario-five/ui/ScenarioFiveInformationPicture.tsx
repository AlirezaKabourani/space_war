import type { ScenarioFiveEvidenceSummary } from "../../ScenarioFiveTypes";
import { SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_DIRECTION_LABELS_FA, SCENARIO5_SOURCE_LABELS_FA, SCENARIO5_STRENGTH_LABELS_FA } from "./uiContentFa";

// Native group disclosures are presentation only; they never open evidence telemetry.
export const ScenarioFiveInformationPicture = ({ evidence, title = "تصویر اطلاعاتی فعلی", emptyText = "هنوز شاهد مشخصی در تصویر عملیاتی ثبت نشده است. اطمینان پایین در این مرحله طبیعی است." }: {
  evidence: readonly ScenarioFiveEvidenceSummary[]; title?: string; emptyText?: string;
}) => {
  const corridors = Object.keys(SCENARIO5_CORRIDOR_CONTENT_FA) as (keyof typeof SCENARIO5_CORRIDOR_CONTENT_FA)[];
  const groups = [...corridors, null].map(corridorId => ({
    corridorId,
    label: corridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[corridorId].targetLabel : "چندمحوره / محل نامشخص",
    items: evidence.filter(item => item.observedCorridorId === corridorId),
  })).filter(group => group.items.length > 0);
  return <section className="s5-information-picture" aria-label={title}>
  <h3>{title}</h3>
  {evidence.length === 0 ? <p className="s5-empty">{emptyText}</p> : <div className="s5-information-groups">
    {groups.map(group => <details className="s5-information-group" key={group.corridorId ?? 'unknown'} open={evidence.length <= 6}>
      <summary><strong>{group.label}</strong><span>{group.items.length} شاهد</span></summary>
      <div className="s5-information-list">{group.items.map((item) => <article className="s5-information-summary" key={item.evidenceId} data-evidence-summary={item.evidenceId}>
      <strong>{SCENARIO5_SOURCE_LABELS_FA[item.sourceType]}</strong>
      <span>{SCENARIO5_DIRECTION_LABELS_FA[item.direction]}</span>
      <small>قدرت: {SCENARIO5_STRENGTH_LABELS_FA[item.strengthBand]}</small>
    </article>)}</div>
    </details>)}
  </div>}
</section>;
};
