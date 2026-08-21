import type { ResourceState } from "../../../core/types/scenario";
import type { Convoy, ScenarioTwoDecisionRecord, ScenarioTwoMetrics, ScenarioTwoMissionStatus, ScenarioTwoSummaryData } from "./ScenarioTwoTypes";

const routeLabelById: Record<string, string> = {
  route_main_east: "مسیر اصلی شرق",
  route_north_alt: "جایگزین شمالی",
  route_staged_east: "مسیر مرحله‌ای کنترل‌شده",
  route_central_alt: "مسیر مرکزی",
  route_south: "جنوب به مرکز",
  route_north: "شمال غرب",
  route_west_iraq: "تهران به مرز عراق",
  route_ambush_spur: "مسیر فرعی کمین",
  route_phantom: "مسیر فریب",
  route_shadow: "مسیر خاکستری",
};

const statusLabelByStatus: Record<Convoy["status"], string> = {
  moving: "در مسیر",
  normal: "در مسیر",
  monitored: "پایش ویژه",
  suspicious: "مشکوک",
  rerouted: "اصلاح مسیر شده",
  paused: "متوقف",
  supported: "پشتیبانی‌شده",
  near_threat: "نزدیک تهدید",
  delivered: "تحویل‌شده",
  delivered_delayed: "تحویل‌شده با تأخیر",
  compromised: "آسیب‌دیده",
  lost_contact: "ناپدیدشده",
};

const primaryStatusLabel: Record<ScenarioTwoSummaryData["primaryObjectiveStatus"], string> = {
  delivered_on_time: "تحویل‌شده به‌موقع",
  delivered_delayed: "تحویل‌شده با تأخیر",
  rerouted_not_delivered: "اصلاح مسیر شده، اما تحویل نشده",
  compromised: "منحرف / آسیب‌دیده",
  lost: "از دست‌رفته",
};

const SummaryBar = ({
  label,
  value,
  color = "#38bdf8",
  description,
}: {
  label: string;
  value: number;
  color?: string;
  description?: string;
}) => (
  <div className="s2-summary-bar-block">
    <div className="s2-summary-bar">
      <span>{label}</span>
      <div><i style={{ width: `${Math.max(3, Math.min(100, value))}%`, background: color }} /></div>
      <strong>{Math.round(value)}</strong>
    </div>
    {description && <p>{description}</p>}
  </div>
);

const resourceAnalysis = (label: string, before: number, after: number) => {
  const spent = Math.max(0, before - after);
  if (after < 15) return `${label} تقریباً تخلیه شد و گزینه‌های پایانی محدود شدند.`;
  if (spent > before * 0.65) return `${label} سنگین مصرف شد، اما هنوز حداقل ذخیره باقی ماند.`;
  if (spent < before * 0.3) return `${label} محافظه‌کارانه مصرف شد و ظرفیت اصلاح در راندهای بعدی باقی ماند.`;
  return `${label} مرحله‌ای مصرف شد و فشار مأموریت را قابل کنترل نگه داشت.`;
};

const convoyAnalysis = (convoy: Convoy, records: ScenarioTwoDecisionRecord[]) => {
  const selected = records.flatMap((record) => record.selectedActionIds);
  if (convoy.id === "convoy_medical") {
    if (convoy.status === "delivered") return "مأموریت اصلی نجات یافت، اما کیفیت نتیجه به میزان تأخیر و منابع مصرف‌شده وابسته است.";
    if (selected.includes("action_reroute_convoy") || selected.includes("action_fallback_nav")) return "برای نجات کاروان الف اقدام اصلاحی انجام شد، اما برای تحویل نهایی کافی نبود.";
    return "اعتماد به مسیر آلوده یا تأخیر در اصلاح مسیر باعث شد هدف اصلی از دست برود.";
  }
  if (convoy.status === "paused") return "این کاروان برای آزادسازی فشار عملیاتی و حفظ منابع مأموریت اصلی متوقف شد.";
  if (convoy.status === "delivered") return "این کاروان بدون آسیب جدی به هدف فرعی شبکه کمک کرد.";
  if (convoy.hasFallbackNav) return "ناوبری پشتیبان ریسک اتکا به GNSS را برای این کاروان کاهش داد.";
  return "این کاروان بخشی از ظرفیت شبکه را حفظ کرد، اما تصمیم کلیدی مستقلی روی آن ثبت نشد.";
};

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
  const primaryConvoy = convoys.find((convoy) => convoy.id === summary.primaryConvoyId) ?? convoys[0];
  const firstRecord = records[0];
  const initialResources = {
    satelliteISR: firstRecord?.satelliteISRBefore ?? 60,
    energy: firstRecord?.energyBefore ?? 80,
    time: firstRecord?.timeBefore ?? 100,
  };
  const resourceRows = [
    { key: "satelliteISR" as const, label: "ISR", before: initialResources.satelliteISR, after: resources.satelliteISR, color: "#38bdf8" },
    { key: "energy" as const, label: "انرژی", before: initialResources.energy, after: resources.energy, color: "#22c55e" },
    { key: "time" as const, label: "زمان", before: initialResources.time, after: resources.time, color: "#f59e0b" },
  ];
  const decisionStyleLabelFa: Record<string, string> = {
    "Mission-Oriented Rescuer": "نجات‌دهنده مأموریت‌محور",
    "Adaptive Logistics Commander": "فرمانده لجستیک تطبیقی",
    "System-Dependent Commander": "فرمانده وابسته به سامانه",
  };

  return (
    <div className="s2-summary">
      <section className={`s2-summary-outcome ${summary.missionOutcome}`}>
        <div>
          <span>نتیجه مأموریت</span>
          <h2>{summary.missionOutcomeLabel}</h2>
          <p>{summary.primaryObjectiveText}</p>
          <p>سبک تصمیم‌گیری: {decisionStyleLabelFa[summary.decisionStyleLabel] ?? summary.decisionStyleLabel}. {summary.decisionStyleText}</p>
        </div>
        <div className="s2-summary-scoreboard">
          <strong>{summary.missionCompletionPercent}%</strong>
          <span>تحقق مأموریت</span>
          <em>تاب‌آوری لجستیکی: {summary.logisticsResilienceIndex}</em>
        </div>
      </section>

      <div className="s2-summary-grid mission-first">
        <section className="s2-summary-card s2-primary-objective-card">
          <h3>هدف اصلی مأموریت</h3>
          <div className="s2-primary-objective-result">
            <span>نجات کاروان الف</span>
            <strong>{primaryStatusLabel[summary.primaryObjectiveStatus]}</strong>
          </div>
          <dl>
            <div><dt>محموله</dt><dd>{primaryConvoy.cargo}</dd></div>
            <div><dt>مقصد</dt><dd>{primaryConvoy.destination}</dd></div>
            <div><dt>مسیر نهایی</dt><dd>{routeLabelById[primaryConvoy.routeId] ?? primaryConvoy.routeId}</dd></div>
            <div><dt>پیشرفت مسیر</dt><dd>{primaryConvoy.progress}%</dd></div>
            <div><dt>تأخیر</dt><dd>{summary.primaryConvoyDelay}</dd></div>
          </dl>
        </section>

        <section className="s2-summary-card">
          <h3>چرا این نتیجه اتفاق افتاد؟</h3>
          <div className="s2-summary-checklist">
            {(summary.whyThisOutcome ?? []).map((note) => (
              <div key={note} className="done">
                <b>•</b>
                <span>{note}</span>
              </div>
            ))}
          </div>
          {summary.alphaFinalStatus && (
            <p>وضعیت نهایی الف: <strong>{statusLabelByStatus[summary.alphaFinalStatus]}</strong> | سلامت {summary.alphaHealth} | پیشرفت {summary.alphaProgress}%</p>
          )}
        </section>
      </div>

      <div className="s2-summary-grid wide-left">
        <section className="s2-summary-card">
          <h3>وضعیت کاروان‌ها</h3>
          <div className="s2-convoy-outcome-list">
            {convoys.map((convoy) => (
              <article key={convoy.id} className={convoy.id === summary.primaryConvoyId ? "primary" : ""}>
                <header>
                  <strong>{convoy.name}</strong>
                  <span>اهمیت {convoy.priority}/5</span>
                </header>
                <p>{convoy.cargo}</p>
                <dl>
                  <div><dt>وضعیت</dt><dd>{statusLabelByStatus[convoy.status]}</dd></div>
                  <div><dt>مسیر</dt><dd>{routeLabelById[convoy.routeId] ?? convoy.routeId}</dd></div>
                  <div><dt>تأخیر</dt><dd>{convoy.delay}</dd></div>
                  <div><dt>پیشرفت</dt><dd>{convoy.progress}%</dd></div>
                </dl>
                <em>{convoyAnalysis(convoy, records)}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="s2-summary-card">
          <h3>بازپخش تصمیم‌ها</h3>
          <div className="s2-decision-timeline">
            {summary.roundTimeline.map((round) => (
              <details key={round.roundId}>
                <summary>
                  <strong>{round.roundTitle}</strong>
                  <span>ISR {round.resourceChanges.satelliteISRDelta} | ENG {round.resourceChanges.energyDelta} | TIME {round.resourceChanges.timeDelta}</span>
                </summary>
                <p>تصمیم‌ها: {round.selectedActions.join("، ") || "بدون اقدام ثبت‌شده"}</p>
                <p>اثر نقشه: {round.mapEffects.slice(0, 2).join(" ") || "اثر نقشه‌ای مستقیم ثبت نشد."}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <div className="s2-summary-grid">
        <section className="s2-summary-card">
          <h3>تحلیل مصرف منابع</h3>
          <div className="s2-resource-analysis">
            {resourceRows.map((row) => (
              <div key={row.key}>
                <header>
                  <strong>{row.label}</strong>
                  <span>{row.before} → {row.after}</span>
                </header>
                <i><em style={{ width: `${Math.max(0, Math.min(100, row.after))}%`, background: row.color }} /></i>
                <p>مصرف‌شده: {row.before - row.after}. {resourceAnalysis(row.label, row.before, row.after)}</p>
              </div>
            ))}
          </div>
          <p>{metrics.resourceEfficiencyScore < 35 ? "کارایی مصرف منابع پایین بود، چون بخش زیادی از ظرفیت برای نجات یا کنترل بحران مصرف شد." : "مصرف منابع به اندازه‌ای بود که امکان اصلاح تصمیم در چند راند حفظ شد."}</p>
        </section>

        <section className="s2-summary-card">
          <h3>شاخص‌های عملیاتی</h3>
          <SummaryBar label="تحقق مأموریت" value={summary.missionCompletionPercent} color="#facc15" />
          <SummaryBar label="سلامت/تحویل کاروان الف" value={summary.criticalDeliveryScore} />
          <SummaryBar label="ثبات کاروان‌های فرعی" value={status.logisticsContinuity} color="#22c55e" />
          <SummaryBar label="کنترل تهدید مشهد" value={summary.gnssAnomalyDetectionScore} color="#a78bfa" />
          <SummaryBar label="مدیریت منابع" value={metrics.resourceEfficiencyScore} color="#f59e0b" />
        </section>
      </div>

      <div className="s2-summary-grid">
        <section className="s2-summary-card">
          <h3>شاخص‌های شناختی</h3>
          <SummaryBar label="تشخیص تهدید" value={summary.gnssAnomalyDetectionScore} />
          <SummaryBar label="انعطاف تصمیم‌گیری" value={metrics.cognitiveFlexibilityScore} color="#22c55e" />
          <SummaryBar label="مدیریت منابع" value={metrics.resourceEfficiencyScore} color="#f59e0b" />
        </section>

        <section className="s2-summary-card s2-lessons-card">
          <h3>درس‌های شخصی‌سازی‌شده</h3>
          <p><strong>نقطه عطف:</strong> {summary.keyTurningPoint}</p>
          <p><strong>اشتباه بحرانی:</strong> {summary.criticalMistake}</p>
          {summary.personalizedLessons.slice(0, 3).map((note) => <p key={note}>{note}</p>)}
        </section>
      </div>

      <button className="primary" onClick={onComplete}>پایان سناریو</button>
    </div>
  );
};
