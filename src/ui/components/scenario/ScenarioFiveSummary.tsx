import type { ReactNode } from "react";
import type { Scenario5RuntimeResult, Scenario5RuntimeState } from "./scenario-five/model/runtime/index";
import {
  SCENARIO5_ACTION_COPY_FA,
  SCENARIO5_ACTOR_LABELS_FA,
  SCENARIO5_CONSTRUCT_LABELS_FA,
  SCENARIO5_CORRIDOR_CONTENT_FA,
  SCENARIO5_DIRECTION_LABELS_FA,
  SCENARIO5_END_STATE_LABELS_FA,
  SCENARIO5_METHOD_LIMITATIONS_FA,
  SCENARIO5_PHASE_CONTENT_FA,
  SCENARIO5_PROVENANCE_LABELS_FA,
  SCENARIO5_REASON_LABELS_FA,
  SCENARIO5_ROUND_CONTENT_FA,
  SCENARIO5_SOURCE_LABELS_FA,
  SCENARIO5_STRENGTH_LABELS_FA,
  buildScenario5AarView,
  getScenario5OperationalAttributionLabel,
} from "./scenario-five/ui/index";

const yesNo = (value: boolean) => value ? "بله" : "خیر";
const valueOrUnavailable = (value: number | null, suffix = "") => value === null ? "در این اجرا قابل اندازه‌گیری نبود" : `${value.toFixed(2)}${suffix}`;
const listCorridors = (ids: readonly (keyof typeof SCENARIO5_CORRIDOR_CONTENT_FA)[]) =>
  ids.length === 0 ? "—" : ids.map((id) => SCENARIO5_CORRIDOR_CONTENT_FA[id].corridorLabel).join("، ");
const SIGNED_RISK_NOTE = "منفی‌تر یا مثبت‌تر فقط جایگاه نسبی انتخاب در برابر گزینه‌های همان موقعیت است و ارزش‌گذاری خوب/بد ندارد.";

const AarStat = ({
  label,
  value,
  technical = false,
  note,
}: {
  label: string;
  value: ReactNode;
  technical?: boolean;
  note?: string;
}) => (
  <div className="s5-aar-stat">
    <span className="s5-aar-stat-label">{label}</span>
    <strong className="s5-aar-stat-value">
      {technical ? <code dir="ltr" className="s5-technical-id">{value}</code> : value}
    </strong>
    {note && <span className="s5-method-note s5-aar-stat-note">{note}</span>}
  </div>
);

export const ScenarioFiveSummary = ({
  runtimeState,
  result,
  onComplete,
}: {
  runtimeState: Scenario5RuntimeState;
  result: Scenario5RuntimeResult;
  onComplete: () => void;
}) => {
  const aar = buildScenario5AarView(runtimeState, result);
  const { domain, cognitive } = result;
  const alpha = domain.criticalDelivery;
  const phaseNames = ["A", "B", "C", "D"] as const;
  const reasonByPhase = new Map(runtimeState.reasons.map((reason) => [reason.phaseId, reason.reasonId]));
  return (
    <main className="s5-root s5-aar" dir="rtl">
      <header className="s5-aar-header">
        <span>گزارش پس از اقدام</span>
        <h1>امواج خاموش — تحلیل اجرای مأموریت</h1>
        <p>این گزارش، یک تحلیل پس از اقدام برای همین اجرای سناریو است. شاخص‌های شناختی زیر پروکسی‌های رفتاری وابسته به موقعیت‌اند و نمره هوش، شخصیت، توانایی ثابت یا کیفیت کلی فرد نیستند. وزن‌ها و کدگذاری‌های شناختی نسخه فعلی هنوز در انتظار اعتبارسنجی خبرگان و کاربران انسانی‌اند.</p>
      </header>

      <section className="s5-panel s5-aar-section" data-aar-section="mission">
        <h2>۱. نتیجه مأموریت</h2>
        <h3>{SCENARIO5_END_STATE_LABELS_FA[result.missionEndState.endStateId]}</h3>
        <div className="s5-metric-grid">
          <AarStat label="تحویل کاروان الف" value={yesNo(alpha.deliveredByMissionHorizon)} />
          <AarStat label="یکپارچگی کاروان الف" value={alpha.integrity} />
          <AarStat label="تأخیر کاروان الف" value={`${alpha.delayMinutes} دقیقه`} />
          <AarStat label="ورود / مهلت" value={`T+${alpha.projectedArrivalMinute} / T+${alpha.deadlineMinute}`} />
          <AarStat label="تداوم شبکه" value={`${domain.logisticsResilience.networkContinuityPercent}%`} />
          <AarStat label="کاروان‌های تحویل‌شده" value={domain.logisticsResilience.deliveredConvoyCount} />
          <AarStat label="تحویل عملیاتی به‌موقع" value={domain.logisticsResilience.onTimeOperationalConvoyCount} />
          <AarStat label="وضعیت انتساب عملیاتی" value={getScenario5OperationalAttributionLabel(domain.logisticsResilience.operationalAttributionStatus)} />
          <AarStat label="مهار تهدید" value={yesNo(domain.logisticsResilience.threatContained)} />
        </div>
        <p className="s5-method-note">تداوم عملیاتی شبکه، سهم کاروان‌هایی است که با یکپارچگی حداقل ۶۰ و تا مهلت عملیاتی خود به مقصد رسیده‌اند.</p>
      </section>

      <section className="s5-panel s5-aar-section" data-aar-section="truth">
        <h2>۲. حقیقت پنهان این اجرا</h2>
        <div className="s5-metric-grid">
          <AarStat label="کریدور اصلی واقعی" value={SCENARIO5_CORRIDOR_CONTENT_FA[aar.truth.primaryAffectedCorridorId].targetLabel} />
          <AarStat label="الگوی عامل مقابل" value={SCENARIO5_ACTOR_LABELS_FA[aar.truth.actorProfile as keyof typeof SCENARIO5_ACTOR_LABELS_FA]} />
          <AarStat label="وضعیت فنی نهایی عامل مقابل" value={aar.truth.finalActorPosture} technical />
          <AarStat label="شناسه فنی واکنش نهایی" value={aar.truth.lastReactionId ?? "—"} technical />
        </div>
        <p>این جهان یکی از شرایط کنترل‌شده شبیه‌سازی است و فراوانی آن به معنی احتمال واقعی در جهان خارج نیست.</p>
        <details>
          <summary>اطلاعات بازپخش فنی</summary>
          <div className="s5-metric-grid s5-replay-grid">
            <AarStat label="شناسه جهان" value={aar.truth.worldId} technical />
            <AarStat label="بذر بازپخش" value={aar.truth.seed} technical />
          </div>
        </details>
      </section>

      <section className="s5-panel s5-aar-section" data-aar-section="belief">
        <h2>۳. مسیر برداشت شما</h2>
        <div className="s5-table-wrap"><table><thead><tr><th>نقطه ثبت</th><th>کریدور منتخب</th><th>اطمینان کریدور</th><th>کریدور درست؟</th><th>برآورد اخلال هدفمند</th><th>اطمینان برآورد</th></tr></thead>
          <tbody>{domain.gnssPntAssessment.checkpoints.map((checkpoint, index) => <tr key={checkpoint.checkpointId}><td>CP{index + 1}</td><td>{SCENARIO5_CORRIDOR_CONTENT_FA[checkpoint.selectedCorridorId].corridorLabel}</td><td>{checkpoint.corridorConfidence}</td><td>{yesNo(checkpoint.corridorCorrect)}</td><td>{checkpoint.targetedInterferenceEstimate}</td><td>{checkpoint.targetedInterferenceConfidence}</td></tr>)}</tbody>
        </table></div>
        <div className="s5-metric-grid">
          <AarStat label="اولین تشخیص درست" value={domain.gnssPntAssessment.firstCorrectCorridorCheckpoint ?? "—"} />
          <AarStat label="تشخیص نهایی درست" value={domain.gnssPntAssessment.finalCorridorCorrect === null ? "—" : yesNo(domain.gnssPntAssessment.finalCorridorCorrect)} />
          <AarStat label="اولین تشخیص اخلال هدفمند" value={domain.gnssPntAssessment.firstTargetedRecognitionCheckpoint ?? "—"} />
          <AarStat label="همگرایی شواهد روی کریدور واقعی" value={yesNo(domain.gnssPntAssessment.truePrimaryCorridorCorroborated)} />
        </div>
      </section>

      <section className="s5-panel s5-aar-section" data-aar-section="evidence">
        <h2>۴. مسیر شواهد</h2>
        <div className="s5-aar-list">{aar.evidenceAudit.map(({ evidence, hiddenProvenance, opened }) => (
          <article key={evidence.evidenceId}>
            <header><strong>{SCENARIO5_SOURCE_LABELS_FA[evidence.sourceType]}</strong><span>{opened ? "جزئیات مشاهده شد" : "جزئیات باز نشد"}</span></header>
            <p>{evidence.observedCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[evidence.observedCorridorId].targetLabel : "چندمحوره / محل نامشخص"}</p>
            <p>{SCENARIO5_DIRECTION_LABELS_FA[evidence.direction]} · {SCENARIO5_STRENGTH_LABELS_FA[evidence.strengthBand]}</p>
            <p>کیفیت گزارش: {evidence.qualityLabelVisible}</p><p>محدودیت: {evidence.limitationVisible}</p>
            <p className="s5-audit-line">نسبت واقعی در این جهان: {SCENARIO5_PROVENANCE_LABELS_FA[hiddenProvenance] ?? hiddenProvenance}</p>
          </article>
        ))}</div>
      </section>

      <section className="s5-panel s5-aar-section" data-aar-section="decisions">
        <h2>۵. خط زمانی تصمیم‌ها</h2>
        <div className="s5-aar-list">{runtimeState.decisions.map((decision, index) => {
          const record = runtimeState.domainDecisionRecords[index]!;
          const reason = decision.roundId === 4 || decision.roundId === 6 || decision.roundId === 8
            ? reasonByPhase.get(decision.phaseId as "B" | "C" | "D")
            : undefined;
          return <article key={decision.windowId}><header><strong>فاز {decision.phaseId} — راند {decision.roundId}: {SCENARIO5_ROUND_CONTENT_FA[decision.roundId].title}</strong><span>{decision.activeDecisionMs} ms</span></header>
            <p>{SCENARIO5_ACTION_COPY_FA[decision.finalSelectedActionId!].title}</p>
            <p>هدف: {record.effectiveTargetCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[record.effectiveTargetCorridorId].targetLabel : "بدون هدف انتخابی"}</p>
            <p>بازنگری: {decision.revisionCount} · منابع ISR {record.resourcesBefore.isrCapacity} → {record.resourcesAfter.isrCapacity} · پشتیبانی {record.resourcesBefore.supportReserve} → {record.resourcesAfter.supportReserve}</p>
            <p>زمان عملیاتی: T+{record.worldClockBefore} → T+{record.worldClockAfter}</p>
            {reason && <p>دلیل: {SCENARIO5_REASON_LABELS_FA[reason]}</p>}
          </article>;
        })}</div>
      </section>

      <section className="s5-panel s5-aar-section" data-aar-section="domain">
        <h2>۶. شاخص‌های مأموریتی</h2>
        <h3>GNSS / PNT</h3>
        <p>نرخ تشخیص درست کریدور: {valueOrUnavailable(domain.gnssPntAssessment.correctCorridorCheckpointRatePercent, "%")} · اولین/نهایی: {domain.gnssPntAssessment.firstCorrectCorridorCheckpoint ?? "—"} / {domain.gnssPntAssessment.finalCorridorCorrect === null ? "—" : yesNo(domain.gnssPntAssessment.finalCorridorCorrect)}</p>
        <p>برآورد نهایی اخلال/اطمینان: {domain.gnssPntAssessment.finalTargetedInterferenceEstimate ?? "—"} / {domain.gnssPntAssessment.finalTargetedInterferenceConfidence ?? "—"} · کریدورهای corroborated: {listCorridors(domain.gnssPntAssessment.corroboratedCorridorIds)}</p>
        <h3>یکپارچگی ناوبری</h3>
        <p>میانگین/بیشینه مواجهه نهایی PNT: {domain.navigationIntegrity.meanFinalPntExposure.toFixed(2)} / {domain.navigationIntegrity.maxFinalPntExposure} · آسیب‌دیده: {domain.navigationIntegrity.compromisedConvoyCount}</p>
        <p>fallback: {listCorridors(domain.navigationIntegrity.fallbackCorridorIds)} · سخت‌سازی: {listCorridors(domain.navigationIntegrity.routeHardenedCorridorIds)} · پشتیبانی زمینی: {listCorridors(domain.navigationIntegrity.groundSupportCorridorIds)}</p>
        <h3>تحویل محموله حیاتی</h3>
        <p>تحویل: {yesNo(alpha.deliveredByMissionHorizon)} · عملیاتی به‌موقع: {yesNo(alpha.onTimeOperational)} · یکپارچگی: {alpha.integrity} · تأخیر: {alpha.delayMinutes} · ورود/مهلت: {alpha.projectedArrivalMinute}/{alpha.deadlineMinute}</p>
        <p>سهم منابع هدف‌گرفته روی الف: {valueOrUnavailable(alpha.alphaTargetedResourceSharePercent, "%")} · تعداد تصمیم: {alpha.alphaTargetedDecisionCount}</p>
        <h3>تاب‌آوری لجستیک</h3>
        <p>تداوم: {domain.logisticsResilience.networkContinuityPercent}% · تحویل‌شده/به‌موقع/ثانویه: {domain.logisticsResilience.deliveredConvoyCount}/{domain.logisticsResilience.onTimeOperationalConvoyCount}/{domain.logisticsResilience.secondaryDeliveredConvoyCount}</p>
        <p>پوشش fallback/سخت‌سازی/زمینی: {domain.logisticsResilience.fallbackCoverageCount}/{domain.logisticsResilience.routeHardeningCoverageCount}/{domain.logisticsResilience.groundSupportCoverageCount} · انتساب: {getScenario5OperationalAttributionLabel(domain.logisticsResilience.operationalAttributionStatus)} · مهار: {yesNo(domain.logisticsResilience.threatContained)}</p>
        <h3>کنترل تأخیر</h3>
        <div className="s5-table-wrap"><table><thead><tr><th>کریدور</th><th>تأخیر نهایی</th><th>افزوده Actor</th><th>افزوده بازیکن</th><th>بازیابی بازیکن</th></tr></thead><tbody>{Object.entries(domain.delayControl.byCorridor).map(([id, row]) => <tr key={id}><td>{SCENARIO5_CORRIDOR_CONTENT_FA[id as keyof typeof SCENARIO5_CORRIDOR_CONTENT_FA].corridorLabel}</td><td>{row.finalDelayMinutes}</td><td>{row.actorDelayAddedMinutes}</td><td>{row.playerDelayAddedMinutes}</td><td>{row.playerDelayRecoveredMinutes}</td></tr>)}</tbody></table></div>
        <h3>اثر محلی بر محیط غیرنظامی</h3>
        <p className="s5-method-note">پروکسی توصیفی، نه سنجه معتبر آسیب غیرنظامی</p>
        <p>تغییر مسیر/نقاط کنترل/پاسخ زمینی/توقف: {domain.civilianImpactProxy.routeDiversionCount}/{domain.civilianImpactProxy.checkpointOperationCount}/{domain.civilianImpactProxy.groundResponseCount}/{domain.civilianImpactProxy.holdOperationCount} · رخداد محلی: {domain.civilianImpactProxy.localizedDisruptionEventCount} · تأخیر پزشکی: {domain.civilianImpactProxy.medicalDeliveryDelayMinutes}</p>
        <h3>تعادل شبکه</h3>
        <p>کمینه/میانگین یکپارچگی ثانویه: {domain.networkLogisticsBalance.secondaryMinimumIntegrity}/{domain.networkLogisticsBalance.secondaryMeanIntegrity.toFixed(2)} · SD تأخیر: {domain.networkLogisticsBalance.delayPopulationSd.toFixed(2)} · HHI توجه هدفمند: {valueOrUnavailable(domain.networkLogisticsBalance.targetedAttentionHhi)}</p>
        <p>{Object.entries(domain.networkLogisticsBalance.targetedDecisionCountByCorridor).map(([id, count]) => `${SCENARIO5_CORRIDOR_CONTENT_FA[id as keyof typeof SCENARIO5_CORRIDOR_CONTENT_FA].corridorLabel}: ${count}`).join(" · ")}</p>
      </section>

      <section className="s5-panel s5-aar-section" data-aar-section="cognitive">
        <h2>۷. الگوهای تصمیم‌گیری ثبت‌شده</h2>
        <h3>کامل‌بودن داده</h3>
        <p>کل: {cognitive.dataCompleteness.overall}% · تصمیم‌ها: {cognitive.dataCompleteness.decisions}% · زمان: {cognitive.dataCompleteness.timing}% · شواهد: {cognitive.dataCompleteness.evidence}% · برآوردها: {cognitive.dataCompleteness.estimates}% · دلیل‌ها: {cognitive.dataCompleteness.reasons}%</p>
        {cognitive.dataCompleteness.overall < 100 && <p className="s5-method-note">بخشی از داده رفتاری این اجرا ناقص است؛ مقادیر زیر باید با توجه به کامل‌بودن داده تفسیر شوند.</p>}
        <h3>Orientation</h3>
        <p>OSI کل: {valueOrUnavailable(cognitive.orientation.overall)} · عملیاتی: {valueOrUnavailable(cognitive.orientation.operationalStrength)} · راهبردی: {valueOrUnavailable(cognitive.orientation.strategicStrength)} · یکپارچگی: {valueOrUnavailable(cognitive.orientation.integration)} · پراکندگی: {valueOrUnavailable(cognitive.orientation.dispersion)}</p>
        <p>{phaseNames.map((phase, index) => `فاز ${phase} (${SCENARIO5_PHASE_CONTENT_FA[phase]}): ${valueOrUnavailable(cognitive.orientation.phaseScores[index])}`).join(" · ")}</p>
        <p className="s5-method-note">منفی‌تر = عملیاتی‌تر نسبت به گزینه‌های همان موقعیت؛ مثبت‌تر = راهبردی‌تر. این محور کیفیت تصمیم نیست.</p>
        <h3>Constructها</h3>
        <div className="s5-metric-grid">{Object.entries(cognitive.constructs).map(([key, value]) => (
          <AarStat
            key={key}
            label={SCENARIO5_CONSTRUCT_LABELS_FA[key as keyof typeof SCENARIO5_CONSTRUCT_LABELS_FA]}
            value={key === "informationDiscipline" ? "در نسخه فعلی این سناریو اندازه‌گیری نمی‌شود." : valueOrUnavailable(value)}
            note={key === "riskPosture" ? SIGNED_RISK_NOTE : undefined}
          />
        ))}</div>
        <p>میانه زمان فعال: {valueOrUnavailable(cognitive.telemetrySummary.medianActiveDecisionMs, " ms")} · IQR: {valueOrUnavailable(cognitive.telemetrySummary.iqrActiveDecisionMs, " ms")} · بازنگری کل: {cognitive.telemetrySummary.totalRevisions} · پنجره‌های بازنگری‌شده: {cognitive.telemetrySummary.revisedWindows} · نرخ بازنگری پس از شواهد: {valueOrUnavailable(cognitive.telemetrySummary.evidenceTriggeredRevisionRate, "%")}</p>
      </section>

      <section className="s5-panel s5-aar-section" data-aar-section="limitations">
        <h2>۸. محدودیت تفسیر</h2>
        <ul>{SCENARIO5_METHOD_LIMITATIONS_FA.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <button type="button" className="s5-primary-button s5-finish-button" onClick={onComplete}>ثبت پایان و بازگشت</button>
    </main>
  );
};
