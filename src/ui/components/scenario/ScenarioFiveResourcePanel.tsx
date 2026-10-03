import type { ResourceState } from "../../../core/types/scenario";
import type { ScenarioFiveMissionStatus } from "./ScenarioFiveTypes";

const resourceRows: Array<{ key: keyof ResourceState; label: string; color: string; short: string }> = [
  { key: "satelliteISR", label: "ظرفیت ISR", short: "ISR", color: "#38bdf8" },
  { key: "energy", label: "انرژی عملیاتی", short: "ENG", color: "#22c55e" },
  { key: "time", label: "زمان عملیاتی", short: "TIME", color: "#f59e0b" },
];

const statusRows: Array<{ key: keyof ScenarioFiveMissionStatus; label: string; inverse?: boolean; color: string }> = [
  { key: "logisticsContinuity", label: "پیوستگی لجستیک", color: "#22c55e" },
  { key: "criticalDelivery", label: "تحویل حیاتی", color: "#38bdf8" },
  { key: "navigationIntegrity", label: "سلامت ناوبری", color: "#2dd4bf" },
  { key: "civilianStability", label: "پایداری مدنی", color: "#a3e635" },
  { key: "ambiguity", label: "ابهام", inverse: true, color: "#f97316" },
  { key: "escalationRisk", label: "ریسک تشدید", inverse: true, color: "#ef4444" },
  { key: "gnssExposureRisk", label: "ریسک GNSS آلوده", inverse: true, color: "#fb7185" },
];

const Bar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="s5-bar-row">
    <span>{label}</span>
    <div className="s5-bar-track">
      <div className="s5-bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
    <strong>{Math.round(value)}</strong>
  </div>
);

export const ScenarioFiveResourcePanel = ({
  resources,
  previewCost,
  status,
}: {
  resources: ResourceState;
  previewCost: Partial<ResourceState>;
  status: ScenarioFiveMissionStatus;
}) => {
  return (
    <div className="s5-panel s5-resource-panel">
      <div className="s5-panel-title">منابع عملیاتی</div>
      <div className="s5-resource-gauges">
        {resourceRows.map((row) => {
          const preview = previewCost[row.key] ?? 0;
          const value = resources[row.key];
          const dash = `${Math.max(0, Math.min(100, value))}, 100`;
          return (
            <div key={row.key} className="s5-resource-gauge">
              <svg viewBox="0 0 42 42" aria-hidden="true">
                <circle cx="21" cy="21" r="15.9" className="track" />
                <circle cx="21" cy="21" r="15.9" className="value" stroke={row.color} strokeDasharray={dash} />
              </svg>
              <strong>{value}</strong>
              <span>{row.short}</span>
              <em>{row.label}</em>
              {preview > 0 && <small>-{preview}</small>}
            </div>
          );
        })}
      </div>
      <div className="s5-panel-title s5-status-title">وضعیت مأموریت</div>
      <div className="s5-panel-section">
        {statusRows.map((row) => (
          <Bar key={row.key} label={row.label} value={status[row.key]} color={row.color} />
        ))}
        <div className="s5-delay-chip">تأخیر تجمعی: {status.cumulativeDelay}</div>
      </div>
    </div>
  );
};
