import type { ResourceState } from "../../../core/types/scenario";
import type { Convoy, ScenarioTwoDecisionRecord, ScenarioTwoMetrics, ScenarioTwoMissionStatus, ScenarioTwoSummaryData } from "./ScenarioTwoTypes";

const SummaryBar = ({ label, value, color = "#38bdf8" }: { label: string; value: number; color?: string }) => (
  <div className="s2-summary-bar">
    <span>{label}</span>
    <div><i style={{ width: `${Math.max(3, Math.min(100, value))}%`, background: color }} /></div>
    <strong>{Math.round(value)}</strong>
  </div>
);

export const ScenarioTwoSummary = ({
  summary,
  status,
  resources,
  convoys,
  records,
  metrics,
  onComplete,
}: {
  summary: ScenarioTwoSummaryData;
  status: ScenarioTwoMissionStatus;
  resources: ResourceState;
  convoys: Convoy[];
  records: ScenarioTwoDecisionRecord[];
  metrics: ScenarioTwoMetrics;
  onComplete: () => void;
}) => {
  return (
    <div className="s2-summary">
      <div className="s2-summary-hero">
        <span>امتیاز کل تاب‌آوری لجستیکی</span>
        <strong>{summary.logisticsResilienceIndex}</strong>
        <p>{summary.decisionStyleLabel}: {summary.decisionStyleText}</p>
      </div>

      <div className="s2-summary-grid">
        <section className="s2-summary-card">
          <h3>شاخص‌های عملیاتی</h3>
          <SummaryBar label="تحویل محموله حیاتی" value={summary.criticalDeliveryScore} />
          <SummaryBar label="پیوستگی لجستیک" value={status.logisticsContinuity} color="#22c55e" />
          <SummaryBar label="سلامت ناوبری" value={status.navigationIntegrity} color="#2dd4bf" />
          <SummaryBar label="کنترل تأخیر" value={summary.delayControlScore} color="#f59e0b" />
          <SummaryBar label="تشخیص اختلال GNSS" value={summary.gnssAnomalyDetectionScore} color="#a78bfa" />
        </section>

        <section className="s2-summary-card">
          <h3>منابع نهایی</h3>
          <SummaryBar label="ISR" value={resources.satelliteISR} />
          <SummaryBar label="انرژی" value={resources.energy} color="#22c55e" />
          <SummaryBar label="زمان" value={resources.time} color="#f59e0b" />
          <SummaryBar label="کارایی مصرف منابع" value={metrics.resourceEfficiencyScore} color="#84cc16" />
        </section>

        <section className="s2-summary-card">
          <h3>وضعیت کاروان‌ها</h3>
          <div className="s2-convoy-table">
            {convoys.map((convoy) => (
              <div key={convoy.id}>
                <span>{convoy.name}</span>
                <strong>{convoy.status}</strong>
                <em>{convoy.delay} تأخیر</em>
              </div>
            ))}
          </div>
        </section>

        <section className="s2-summary-card">
          <h3>شاخص‌های شناختی</h3>
          <SummaryBar label="تفکر مرحله دوم" value={metrics.secondOrderThinkingScore} />
          <SummaryBar label="مدل‌سازی دشمن" value={metrics.adversaryModelingScore} color="#a78bfa" />
          <SummaryBar label="انضباط اطلاعاتی" value={metrics.informationDisciplineScore} color="#2dd4bf" />
          <SummaryBar label="انعطاف شناختی" value={metrics.cognitiveFlexibilityScore} color="#22c55e" />
        </section>
      </div>

      <section className="s2-summary-card">
        <h3>نمودار مصرف منابع در راندها</h3>
        <div className="s2-resource-timeline">
          {records.map((record) => (
            <div key={record.roundId}>
              <span>{record.roundId.replace("round_", "راند ")}</span>
              <i style={{ height: `${Math.max(8, record.satelliteISRBefore - record.satelliteISRAfter)}px`, background: "#38bdf8" }} />
              <i style={{ height: `${Math.max(8, record.energyBefore - record.energyAfter)}px`, background: "#22c55e" }} />
              <i style={{ height: `${Math.max(8, record.timeBefore - record.timeAfter)}px`, background: "#f59e0b" }} />
            </div>
          ))}
        </div>
      </section>

      <section className="s2-summary-card">
        <h3>سه نکته آموزشی شخصی‌سازی‌شده</h3>
        {summary.learningNotes.map((note) => <p key={note}>{note}</p>)}
      </section>

      <button className="primary" onClick={onComplete}>پایان سناریو</button>
    </div>
  );
};
