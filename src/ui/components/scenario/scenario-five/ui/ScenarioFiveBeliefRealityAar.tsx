import type { Scenario5RuntimeState } from '../model/runtime/index';
import type { Scenario5AarViewModel } from './presentation';
import type { buildMissionAar } from './endingPresentation';
import { SCENARIO5_CORRIDOR_CONTENT_FA } from './uiContentFa';
import {
  BELIEF_REALITY_COPY as COPY, buildBeliefRealityAarView,
  type BeliefRealityCheckpoint, type BeliefRealityEvidence,
} from './beliefRealityAarPresentation';

const Value = ({ value }: { value: number | null }) => value === null
  ? <span className="s5-br-unavailable">{COPY.unavailable}</span> : <><bdi dir="ltr">{value}</bdi> از ۱۰۰</>;
const Corridor = ({ id }: { id: BeliefRealityCheckpoint['corridorId'] }) => id
  ? <>{SCENARIO5_CORRIDOR_CONTENT_FA[id].corridorLabel}</> : <span className="s5-br-unavailable">{COPY.unavailable}</span>;
const BeliefFields = ({ checkpoint: b }: { checkpoint: BeliefRealityCheckpoint }) => <dl className="s5-br-fields">
  <div><dt>اطمینان به انتخاب کریدور:</dt><dd><Value value={b.corridorConfidence} /></dd></div>
  <div><dt>برآورد اخلال هدفمند:</dt><dd><Value value={b.targetedInterferenceEstimate} /></dd></div>
  <div><dt>اطمینان به برآورد اخلال:</dt><dd><Value value={b.targetedInterferenceConfidence} /></dd></div>
</dl>;
const EvidenceList = ({ items, freshIds = [] }: { items: readonly BeliefRealityEvidence[]; freshIds?: readonly string[] }) => items.length
  ? <ul className="s5-br-evidence-list">{items.map(e => <li key={e.evidenceId} data-belief-evidence={e.evidenceId}>
    <code dir="ltr">{e.evidenceId}</code>{freshIds.includes(e.evidenceId) && <span className="s5-br-fresh">تازه از مقطع قبل</span>}
    {e.available ? <dl className="s5-br-evidence-fields">
      <div><dt>منبع:</dt><dd>{e.sourceLabel ?? COPY.unavailable}</dd></div>
      <div><dt>کریدور مشاهده‌شده:</dt><dd>{e.observedCorridorLabel ?? COPY.unavailable}</dd></div>
      <div><dt>جهت شاهد:</dt><dd>{e.directionLabel ?? COPY.unavailable}</dd></div>
      <div><dt>شدت شاهد:</dt><dd>{e.strengthLabel ?? COPY.unavailable}</dd></div>
    </dl> : <p className="s5-br-unavailable">جزئیات این شاهد در داده‌های این اجرا موجود نیست.</p>}
  </li>)}</ul> : <p>در فهرست این مقطع شاهدی ثبت نشده است.</p>;
const Change = ({ label, values }: { label: string; values: readonly [number, number] }) => <p>{label}: <bdi dir="ltr">{values[0]} → {values[1]}</bdi></p>;

export const ScenarioFiveBeliefRealityAar = ({ state, audit, aar }: {
  state: Scenario5RuntimeState; audit: Scenario5AarViewModel; aar: Pick<ReturnType<typeof buildMissionAar>, 'end' | 'lateEvidenceIds'>;
}) => {
  const view = buildBeliefRealityAarView(state, audit, aar);
  if (!view) return null;
  const final = view.final;
  return <section id="s5-belief-vs-reality" className="s5-panel s5-aar-section s5-belief-reality" data-aar-section="belief" aria-labelledby="s5-br-title">
    <h2 id="s5-br-title">{COPY.title}</h2><p>{COPY.intro}</p>
    <div className="s5-br-comparison">
      <article className="s5-br-player" aria-labelledby="s5-br-player-title"><h3 id="s5-br-player-title">برآورد نهایی شما</h3>
        <p className="s5-br-corridor"><Corridor id={final.corridorId} /></p>
        {final.corridorId && <p className="s5-br-convoy">{SCENARIO5_CORRIDOR_CONTENT_FA[final.corridorId].convoyLabel}</p>}
        {!final.valid && <p className="s5-br-unavailable">{COPY.checkpointUnavailable}</p>}<BeliefFields checkpoint={final} />
      </article>
      <article className="s5-br-reality" aria-labelledby="s5-br-reality-title"><h3 id="s5-br-reality-title">وضعیت واقعی در شبیه‌سازی</h3>
        <p className="s5-br-corridor"><Corridor id={view.primaryCorridorId} /></p>
        {view.primaryCorridorId && <p className="s5-br-convoy">{SCENARIO5_CORRIDOR_CONTENT_FA[view.primaryCorridorId].convoyLabel}</p>}
        <dl className="s5-br-fields"><div><dt>الگوی عامل مقابل:</dt><dd>{view.actorLabel ?? COPY.unavailable}</dd></div>
          <div><dt>وضعیت نهایی عامل مقابل:</dt><dd>{view.postureLabel ?? COPY.unavailable}</dd></div>
          <div><dt>انتساب عملیاتی در پایان:</dt><dd>{view.attributionLabel ?? COPY.unavailable}</dd></div>
          <div><dt>مهار اختلال:</dt><dd>{view.threatContained === null ? COPY.unavailable : view.threatContained ? 'بله' : 'خیر'}</dd></div>
        </dl>
      </article>
    </div>
    <p className="s5-br-comparison-result" data-belief-match={final.matches === null ? 'unavailable' : final.matches ? 'same' : 'different'}>{final.matches === null ? COPY.unavailable : final.matches ? COPY.same : COPY.different}</p>
    <p className="s5-br-note">{COPY.comparisonNote}</p>
    <div id="s5-belief-timeline"><h3>برداشت شما چگونه تغییر کرد؟</h3>
      <h4>چه اطلاعاتی در هر مقطع در دسترس بود؟</h4>
      <p className="s5-br-note">کریدور مشاهده‌شده در یک شاهد الزاماً کریدور اصلی اختلال نیست. «در دسترس بود» به معنی بازکردن جزئیات شاهد نیست.</p>
      <ol className="s5-br-timeline">{view.checkpoints.map((b, index) => <li key={b.checkpointId}>
        <details className="s5-br-checkpoint" data-belief-checkpoint={b.checkpointId} aria-labelledby={`s5-br-${b.checkpointId}`}>
          <summary><strong id={`s5-br-${b.checkpointId}`}>{b.title}</strong><span><Corridor id={b.corridorId} /> · شواهد در دسترس: {b.snapshotIds === null ? COPY.unavailable : <bdi dir="ltr">{b.snapshotIds.length}</bdi>}</span></summary>
          {!b.valid && <p className="s5-br-unavailable">{COPY.checkpointUnavailable}</p>}
          <BeliefFields checkpoint={b} />
          <p>مقایسه نام کریدور با مدل: {b.matches === null ? COPY.unavailable : b.matches ? 'یکسان' : 'متفاوت'}</p>
          {index > 0 && (b.transition ? <div className="s5-br-transition">
            <p>{b.transition.corridorBefore === b.transition.corridorAfter ? 'کریدور منتخب تغییر نکرد' : <>کریدور منتخب از <Corridor id={b.transition.corridorBefore} /> به <Corridor id={b.transition.corridorAfter} /> تغییر کرد</>}</p>
            <Change label="اطمینان به کریدور" values={b.transition.confidence} /><Change label="برآورد اخلال هدفمند" values={b.transition.estimate} /><Change label="اطمینان به برآورد" values={b.transition.estimateConfidence} />
          </div> : <p className="s5-br-unavailable">تغییرات این دو مقطع به‌دلیل نبود داده معتبر در دسترس نیست.</p>)}
          {index > 0 && <p>شواهد تازه در دسترس از مقطع قبل: {b.freshEvidenceIds === null ? COPY.unavailable : <bdi dir="ltr">{b.freshEvidenceIds.length}</bdi>}</p>}
          {b.evidence === null ? <p className="s5-br-unavailable">فهرست شواهد این مقطع در دسترس نیست.</p> : <details className="s5-br-evidence"><summary>شواهد در دسترس این مقطع — <bdi dir="ltr">{b.evidence.length}</bdi> مورد</summary><EvidenceList items={b.evidence} freshIds={b.freshEvidenceIds ?? []} /></details>}
        </details>
      </li>)}</ol>
    </div>
    <section className="s5-br-late" aria-labelledby="s5-br-late-title" data-belief-late-evidence><h3 id="s5-br-late-title">اطلاعاتی که پس از برآورد نهایی رسیدند</h3>
      <p>{COPY.lateNote}</p>
      {view.lateEvidence === null ? <p className="s5-br-unavailable">بدون فهرست معتبر شواهدِ مقطع نهایی، تفکیک شواهد پس از آن در دسترس نیست.</p> : <>
        <p>تعداد: <bdi dir="ltr">{view.lateEvidence.length}</bdi></p>
        {view.lateEvidence.length > 0 ? <details className="s5-br-evidence"><summary>مشاهده شواهد پس از برآورد نهایی</summary><EvidenceList items={view.lateEvidence} /></details> : <p>شاهد تازه‌ای پس از برآورد نهایی ثبت نشده است.</p>}
      </>}
    </section>
    <details className="s5-br-uncertainty"><summary>چرا تصویر وضعیت می‌توانست مبهم باشد؟</summary>
      <ul>{view.checkpoints.map(b => <li key={b.checkpointId}><strong>{b.title}:</strong> {b.observations.join(' ')}</li>)}
        {!!view.lateEvidence?.length && <li>برخی شواهد پس از برآورد نهایی دریافت شدند.</li>}</ul>
    </details>
    <p className="s5-br-conclusion">{COPY.conclusion}</p>
  </section>;
};
