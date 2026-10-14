import type { ScenarioFiveEvidencePanelProps } from "../../ScenarioFiveTypes";
import {
  SCENARIO5_CORRIDOR_CONTENT_FA,
  SCENARIO5_DIRECTION_LABELS_FA,
  SCENARIO5_SOURCE_LABELS_FA,
  SCENARIO5_STRENGTH_LABELS_FA,
} from "./uiContentFa";

export const ScenarioFiveEvidencePanel = ({
  evidence,
  interactive,
  expandedEvidenceIds,
  onOpen,
  onClose,
}: ScenarioFiveEvidencePanelProps) => (
  <section className="s5-panel s5-evidence-panel" aria-labelledby="s5-evidence-title">
    <div className="s5-section-heading">
      <div>
        <span>تصویر عملیاتی</span>
        <h3 id="s5-evidence-title">شواهد قابل مشاهده</h3>
      </div>
      <b>{evidence.length} مورد</b>
    </div>
    {evidence.length === 0 ? (
      <p className="s5-empty">هنوز شاهد جدیدی به تصویر عملیاتی اضافه نشده است.</p>
    ) : (
      <div className="s5-evidence-list">
        {evidence.map((item) => {
          const expanded = interactive && expandedEvidenceIds.has(item.evidenceId);
          return (
            <article className={`s5-evidence-card ${expanded ? "s5-expanded" : ""}`} key={item.evidenceId} tabIndex={0}>
              <div className="s5-evidence-compact">
                <strong>{SCENARIO5_SOURCE_LABELS_FA[item.sourceType] ?? item.sourceType}</strong>
                <span>{item.observedCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[item.observedCorridorId].targetLabel : "چندمحوره / محل نامشخص"}</span>
                <span>{SCENARIO5_DIRECTION_LABELS_FA[item.direction]}</span>
                <span>قدرت: {SCENARIO5_STRENGTH_LABELS_FA[item.strengthBand]}</span>
              </div>
              {expanded && (
                <div className="s5-evidence-detail">
                  <p>کیفیت گزارش: {item.qualityLabelVisible}</p>
                  <p>محدودیت: {item.limitationVisible}</p>
                </div>
              )}
              {interactive && (
                <button
                  type="button"
                  className="s5-secondary-button"
                  aria-expanded={expanded}
                  onClick={() => expanded ? onClose(item.evidenceId) : onOpen(item.evidenceId)}
                >
                  {expanded ? "بستن جزئیات" : "بازکردن جزئیات"}
                </button>
              )}
            </article>
          );
        })}
      </div>
    )}
    {!interactive && evidence.length > 0 && <p className="s5-readonly-note">خلاصه شواهد در این مرحله فقط خواندنی است.</p>}
  </section>
);
