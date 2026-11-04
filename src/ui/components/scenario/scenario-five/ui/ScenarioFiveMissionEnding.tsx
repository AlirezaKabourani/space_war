import type { Scenario5RuntimeResult, Scenario5RuntimeState } from '../model/runtime/index';
import { INITIAL_ISR_CAPACITY, INITIAL_SUPPORT_RESERVE } from '../model/mission/index';
import { buildMissionAar, ENDING_TITLES } from './endingPresentation';
import { buildScenario5AarView } from './presentation';
import { marginLabel, deadlineMargin } from './gameplayPresentation';
import { ScenarioFiveOutcomeContent } from './ScenarioFiveOutcomePanel';
import { SCENARIO5_ACTION_COPY_FA, SCENARIO5_ACTOR_LABELS_FA, SCENARIO5_BELIEF_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_PROVENANCE_LABELS_FA, SCENARIO5_REASON_LABELS_FA, SCENARIO5_SOURCE_LABELS_FA, SCENARIO5_STATUS_LABELS_FA } from './uiContentFa';
import { getScenario5OperationalAttributionLabel } from './uiContentFa';
import { ENDING_CONDITIONS } from './endingAlternatives';
import type { Scenario5EndStateId } from '../model/mission/index';
import { ScenarioFiveOperationalTime } from './ScenarioFiveTime';

export const ScenarioFiveMissionEnding = ({state, result, onCognitiveEntry, onComplete}: {
  state: Scenario5RuntimeState; result: Scenario5RuntimeResult; onCognitiveEntry: () => void; onComplete: () => void;
}) => {
  if (state.stage.stageId !== 'complete') throw new Error('Mission ending cannot render before completion');
  const aar = buildMissionAar(state);
  const audit = buildScenario5AarView(state,result);
  const {view} = aar;
  const attribution = getScenario5OperationalAttributionLabel(state.missionState.operationalAttributionStatus);
  return <main className="s5-root s5-aar s5-ending" dir="rtl" data-ending-id={aar.end.endStateId}>
    <header className="s5-aar-header"><span>سناریو ۲ — امواج خاموش</span><h1>پایان مأموریت</h1><p><ScenarioFiveOperationalTime minutes={view.resources.worldClockMinutes} /> · شواهد ثبت‌شده: {view.visibleEvidence.length}</p></header>
    <nav className="s5-ending-nav" aria-label="گزارش مأموریت"><a href="#s5-ending">نتیجه</a><a href="#s5-why">چرا این پایان؟</a><a href="#s5-trace">مسیر تصمیم‌ها</a><a href="#s5-truth">آنچه نمی‌دانستید</a><a href="#s5-belief-timeline">مسیر برداشت</a></nav>
    <section id="s5-ending" className="s5-panel s5-ending-lead" data-aar-section="mission">
      <h2>{ENDING_TITLES[aar.end.endStateId]}</h2><p>{aar.narrative}</p>
      <div className="s5-metric-grid">
        <div className="s5-aar-stat"><span>تداوم عملیاتی شبکه</span><strong>{aar.end.networkContinuityPercent}٪</strong></div>
        <div className="s5-aar-stat"><span>ظرفیت پایش و اطلاعات (ISR)</span><strong>{view.resources.isrCapacity}/100</strong></div>
        <div className="s5-aar-stat"><span>ذخیره پشتیبانی</span><strong>{view.resources.supportReserve}/100</strong></div>
        <div className="s5-aar-stat"><span>انتساب عملیاتی</span><strong>{attribution}</strong><span>مهار اختلال: {aar.end.threatContained ? 'بله' : 'خیر'}</span></div>
      </div>
      <div className="s5-convoy-grid">{view.convoys.map(c => <article className="s5-convoy-card" key={c.convoyId}>
        <h3>{SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId].convoyLabel}</h3><p>{SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId].cargoLabel} · {SCENARIO5_STATUS_LABELS_FA[c.status]}</p>
        <p>سلامت عملیاتی: <bdi dir="ltr">{c.integrity} / 100</bdi> · تأخیر تجمعی: +{c.delayMinutes} دقیقه</p>
        <p>رسیدن برآوردی: <bdi dir="ltr">T+{c.projectedArrivalMinute}</bdi> دقیقه · مهلت تحویل: <bdi dir="ltr">T+{c.deadlineMinute}</bdi> دقیقه</p><p>{marginLabel(deadlineMargin(c))}</p>
      </article>)}</div>
    </section>
    <section id="s5-why" className="s5-panel s5-aar-section" data-aar-section="why">
      <h2>چرا این پایان؟</h2>
      <div className="s5-realized-ending"><span>پایان این اجرا</span><h3>{ENDING_TITLES[aar.end.endStateId]}</h3></div>
      <h3>عوامل مستقیم این نتیجه</h3><ul>{aar.directFacts.map(f => <li key={f}>{f}</li>)}</ul>
      <h3>مسیر مؤثر</h3><p>نقاط زیر گذارهای ثبت‌شده در وضعیت مأموریت‌اند؛ رتبه کیفیت تصمیم نیستند.</p>
      <div className="s5-aar-list">{aar.turningPoints.map(p => <article className="s5-trace-card" key={p.round}><strong>تصمیم {p.round} — {p.label}</strong><p>{SCENARIO5_ACTION_COPY_FA[p.outcome.actionId].title}</p>
        <p>{p.outcome.convoyChanges.map(c => `${SCENARIO5_CORRIDOR_CONTENT_FA[c.corridorId].convoyLabel}: رسیدن برآوردی T+${c.projectedArrivalBefore} → T+${c.projectedArrivalAfter} دقیقه؛ سلامت ${c.integrityBefore} → ${c.integrityAfter}`).join(' · ')}</p>
      </article>)}</div>
      <h3>زمینه اجرا</h3><p>منابع نهایی: ISR {view.resources.isrCapacity}، پشتیبانی {view.resources.supportReserve}؛ {view.visibleEvidence.length} شاهد. این مقادیر زمینه اجرا هستند و به‌تنهایی علت نتیجه را تعیین نمی‌کنند.</p>
      <h3>تداوم عملیاتی شبکه</h3><p>برای تداوم عملیاتی، کاروان باید یکپارچگی حداقل ۶۰ داشته باشد و تا مهلت خود برسد.</p>
      <div className="s5-table-wrap"><table><thead><tr><th>کاروان</th><th>سلامت ≥۶۰</th><th>رسیدن تا مهلت</th><th>سهم در تداوم</th></tr></thead><tbody>{aar.rows.map(r => <tr key={r.corridorId}><td>{SCENARIO5_CORRIDOR_CONTENT_FA[r.corridorId].convoyLabel}</td><td>{r.integrity}: {r.healthPass ? 'برقرار ✓' : 'برقرار نیست ×'}</td><td>رسیدن <bdi dir="ltr">T+{r.arrival}</bdi> / مهلت <bdi dir="ltr">T+{r.deadline}</bdi> دقیقه — {r.deadlinePass ? 'برقرار ✓' : 'برقرار نیست ×'}</td><td>{r.contributes ? 'بله' : 'خیر'}</td></tr>)}</tbody></table></div>
      <section className="s5-other-endings" aria-labelledby="s5-other-endings-title">
        <h3 id="s5-other-endings-title">پایان‌های دیگر که ممکن بود رخ دهند</h3>
        <p>این‌ها شرط‌های پایان‌های دیگرند، نه پیش‌بینی نتیجه یک انتخاب خاص. تحویل محموله حیاتی به سلامت کاروان الف و رسیدن تا پایان ۳۶۰ دقیقه وابسته است؛ تداوم هر کاروان به سلامت حداقل ۶۰ و رسیدن تا مهلت خودش بستگی دارد.</p>
        <div className="s5-ending-alternatives">{(Object.keys(ENDING_TITLES) as Scenario5EndStateId[]).filter(id => id !== aar.end.endStateId).map(id => <article className="s5-ending-alternative" key={id}>
          <h4>{ENDING_TITLES[id]}</h4><p>{ENDING_CONDITIONS[id]}</p>
        </article>)}</div>
        <p className="s5-method-note">حفاظت و پشتیبانی، مدیریت زمان و مسیر، و جمع‌آوری شواهد می‌توانند این شرایط را تغییر دهند. هزینه منابع و واکنش عامل مقابل نیز در مسیر اجرا اثر دارند؛ یک اقدام به‌تنهایی تضمین‌کننده پایان مشخصی نیست.</p>
      </section>
    </section>
    <section id="s5-trace" className="s5-panel s5-aar-section" data-aar-section="decisions"><h2>مسیر تصمیم‌ها — هر ۸ تصمیم</h2>
      {aar.outcomes.map(o => {
        const decision=state.decisions.find(d=>d.roundId===o.roundId)!;
        const reason=[4,6,8].includes(o.roundId) ? state.reasons.find(r=>r.phaseId===decision.phaseId) : null;
        const nearby = state.beliefs.filter(b => (o.roundId===1 && b.checkpointId==='A2_prebelief') || (o.roundId===2 && b.checkpointId==='A2_postbelief') || (o.roundId===6 && b.checkpointId==='C_belief_checkpoint') || (o.roundId===7 && b.checkpointId==='D_final_belief'));
        return <details className="s5-trace-card" key={o.roundId}><summary>تصمیم {o.roundId}: {SCENARIO5_ACTION_COPY_FA[o.actionId].title} — {o.effectiveTargetCorridorId ? SCENARIO5_CORRIDOR_CONTENT_FA[o.effectiveTargetCorridorId].convoyLabel : 'کل شبکه'}<span className="s5-trace-compact">ISR: <bdi dir="ltr">{o.resourcesBefore.isrCapacity} → {o.resourcesAfter.isrCapacity}</bdi> · پشتیبانی: <bdi dir="ltr">{o.resourcesBefore.supportReserve} → {o.resourcesAfter.supportReserve}</bdi> · زمان عملیاتی: <bdi dir="ltr">T+{o.worldClockBefore} → T+{o.worldClockAfter}</bdi> دقیقه · {o.newEvidenceCount} شاهد تازه</span></summary>
          <p>پایش و اطلاعات (ISR): <bdi dir="ltr">{o.resourcesBefore.isrCapacity} → {o.resourcesAfter.isrCapacity}</bdi> · پشتیبانی: <bdi dir="ltr">{o.resourcesBefore.supportReserve} → {o.resourcesAfter.supportReserve}</bdi> · زمان: <bdi dir="ltr">T+{o.worldClockBefore} → T+{o.worldClockAfter}</bdi> · {o.newEvidenceCount} شاهد تازه</p>
          {reason && <p>دلیل: {SCENARIO5_REASON_LABELS_FA[reason.reasonId]}</p>}
          {nearby.map(b => <p key={b.checkpointId}>برداشت نزدیک این تصمیم: {SCENARIO5_BELIEF_COPY_FA[`belief:${b.checkpointId}`].title} — {SCENARIO5_CORRIDOR_CONTENT_FA[b.mostLikelyCorridorId].corridorLabel}؛ اطمینان {b.corridorConfidence}؛ برآورد اخلال {b.targetedInterferenceEstimate}؛ اطمینان برآورد {b.targetedInterferenceConfidence}</p>)}
          <ScenarioFiveOutcomeContent outcome={o} />
        </details>;
      })}
      <h3>مسیر منابع</h3><p>ظرفیت پایش و اطلاعات (ISR): شروع {INITIAL_ISR_CAPACITY} · مصرف {INITIAL_ISR_CAPACITY-view.resources.isrCapacity} · پایان {view.resources.isrCapacity}</p>
      <p>ذخیره پشتیبانی: شروع {INITIAL_SUPPORT_RESERVE} · مصرف {INITIAL_SUPPORT_RESERVE-view.resources.supportReserve} · پایان {view.resources.supportReserve}</p>
      <p>بیشترین مصرف‌ها: {[...aar.outcomes].sort((a,b)=>(b.isrSpent+b.supportSpent)-(a.isrSpent+a.supportSpent)||a.roundId-b.roundId).slice(0,3).map(o=>`تصمیم ${o.roundId}: ISR ${o.isrSpent}، پشتیبانی ${o.supportSpent}`).join(' · ')}</p>
      <h3>مسیر شواهد</h3><p>شروع: ۰ · پایان: {view.visibleEvidence.length} · تنوع منابع: {new Set(view.visibleEvidence.map(e=>e.sourceType)).size} · پوشش کریدورها: {new Set(view.visibleEvidence.flatMap(e=>e.observedCorridorId ? [e.observedCorridorId] : [])).size} از ۴</p>
      <p>{aar.outcomes.map(o=>`تصمیم ${o.roundId}: ${o.newEvidenceCount} شاهد تازه`).join(' · ')}</p>
      <p>جزئیات شواهدی که آگاهانه باز کردید: {[...new Set(state.evidenceOpens.map(e=>e.evidenceId))].join('، ') || 'هیچ‌کدام'}</p>
      {aar.lateEvidenceIds.length>0 && <p className="s5-method-note">پس از برآورد نهایی دریافت شد: {aar.lateEvidenceIds.join('، ')}. این اطلاعات هنگام ثبت برآورد نهایی در اختیار شما نبود.</p>}
    </section>
    <section id="s5-truth" className="s5-panel s5-aar-section" data-aar-section="truth"><h2>آنچه هنگام تصمیم‌گیری نمی‌دانستید</h2>
      <p>کریدور اصلی واقعی: {SCENARIO5_CORRIDOR_CONTENT_FA[audit.truth.primaryAffectedCorridorId].targetLabel}</p>
      <p>الگوی عامل مقابل: {SCENARIO5_ACTOR_LABELS_FA[audit.truth.actorProfile as keyof typeof SCENARIO5_ACTOR_LABELS_FA]}</p>
      <p>وضعیت نهایی عامل مقابل: {{covert:'پنهان',probing:'آزمودن واکنش',committed:'درگیر',disengaging:'کاهش درگیری'}[audit.truth.finalActorPosture] ?? audit.truth.finalActorPosture}</p>
      <p>انتساب عملیاتی: {attribution} · مهار اختلال: {aar.end.threatContained ? 'بله' : 'خیر'}</p>
      <details><summary>حقیقت منشأ شواهد</summary>{audit.evidenceAudit.map(({evidence,hiddenProvenance,opened}) => <p key={evidence.evidenceId}><bdi dir="ltr">{evidence.evidenceId}</bdi> — {SCENARIO5_SOURCE_LABELS_FA[evidence.sourceType]}؛ {SCENARIO5_PROVENANCE_LABELS_FA[hiddenProvenance] ?? hiddenProvenance}؛ {opened ? 'جزئیات باز شد' : 'جزئیات باز نشد'}{aar.lateEvidenceIds.includes(evidence.evidenceId) && '؛ پس از برآورد نهایی دریافت شد'}</p>)}</details>
      <details><summary>اطلاعات پژوهش و بازپخش</summary><p>جهان: <code dir="ltr">{audit.truth.worldId}</code> · بذر: {audit.truth.seed}</p><p>واکنش نهایی: <code dir="ltr">{audit.truth.lastReactionId ?? '—'}</code></p></details>
    </section>
    <section id="s5-belief-timeline" className="s5-panel s5-aar-section" data-aar-section="belief"><h2>مسیر برداشت شما</h2>
      {state.beliefs.map(b=><article className="s5-trace-card" key={b.checkpointId}><h3>{SCENARIO5_BELIEF_COPY_FA[`belief:${b.checkpointId}`].title}</h3><p>{SCENARIO5_CORRIDOR_CONTENT_FA[b.mostLikelyCorridorId].corridorLabel} · اطمینان کریدور: {b.corridorConfidence} · برآورد اخلال هدفمند: {b.targetedInterferenceEstimate} · اطمینان برآورد: {b.targetedInterferenceConfidence}</p><p>شواهد در دسترس آن زمان: {b.visibleEvidenceIdsAtCheckpoint.length} · مقایسه با کریدور واقعی: {b.mostLikelyCorridorId===audit.truth.primaryAffectedCorridorId ? 'یکسان' : 'متفاوت'}</p></article>)}
      <p>شواهدی که پس از برآورد نهایی رسیدند در برداشت‌های ثبت‌شده وارد نمی‌شوند.</p>
    </section>
    <footer className="s5-ending-actions"><button type="button" className="s5-secondary-button" onClick={onCognitiveEntry}>مشاهده الگوی تصمیم‌گیری</button> <button type="button" className="s5-primary-button" onClick={onComplete}>ثبت پایان و بازگشت</button></footer>
  </main>;
};
