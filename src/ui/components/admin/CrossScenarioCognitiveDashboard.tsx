import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Profile } from '../../../core/types/profile';
import { requireCognitiveAdminReadAccess, type CognitiveAdminReadAccess } from '../../../services/storage/cognitiveAdminReadAccess';
import { listCognitiveRunsForAdmin } from '../../../services/storage/cognitiveRunRepository';
import type { SavedCognitiveRunV1 } from '../../../services/storage/cognitiveRunValidation';
import { readCognitiveArchivePolicy } from '../../../services/storage/cognitiveArchivePolicy';
import { archiveDate, cognitiveNumber, cognitiveReadError, CROSS_COMPARABILITY, CROSS_CONCEPTS, CROSS_DATA_ERROR, CROSS_EMPTY, CROSS_NULL } from './crossScenarioPresentation';

type ScenarioId = 4 | 5;
type S1Run = Extract<SavedCognitiveRunV1, { releasedScenarioId: 4 }>;
type S2Run = Extract<SavedCognitiveRunV1, { releasedScenarioId: 5 }>;
type Panel = { status: 'loading' } | { status: 'error'; error: ReturnType<typeof cognitiveReadError> } | { status: 'ready'; rows: SavedCognitiveRunV1[]; selectedId: string | null };
const scenarioName = (id: ScenarioId) => id === 4 ? 'سناریو ۱' : 'سناریو ۲';
const usableNumber = (value: unknown, signed = false): value is number => typeof value === 'number' && Number.isFinite(value) && (signed ? value >= -1 && value <= 1 : value >= 0 && value <= 100 + 1e-9);

export function CognitiveSignedSpectrum({ label, value, field, risk = false }: { label: string; value: number | null; field: string; risk?: boolean }) {
  const valid = usableNumber(value, true);
  const shown = value === null || valid ? cognitiveNumber(value, true) : CROSS_DATA_ERROR;
  return <div className="cross-spectrum" data-cross-field={field} data-source-value={value === null ? 'null' : String(value)}>
    <div className="cross-value-heading"><span>{label}</span><strong className={!valid ? 'cross-missing' : ''}><bdi dir={valid ? 'ltr' : 'rtl'}>{shown}</bdi></strong></div>
    <div className="cross-axis" dir="ltr" role="img" aria-label={`${label}: ${shown}`}>
      <div className="cross-axis-track"><i className="cross-axis-center" />{valid && <i className="cross-axis-marker" data-cross-marker={field} style={{ left: `${(value + 1) * 50}%` }} />}</div>
      <div className="cross-axis-ticks" aria-hidden="true"><span>−1</span><span>0</span><span>+1</span></div>
      <div className="cross-axis-ends"><span dir="rtl">{risk ? 'پذیرش ریسک کمتر' : 'عملیاتی'}</span><span dir="rtl">{risk ? 'پذیرش ریسک بیشتر' : 'راهبردی'}</span></div>
    </div>
  </div>;
}

export function CognitiveStoredValue({ label, value, field, unit = '', bar = false }: { label: string; value: number | null; field: string; unit?: string; bar?: boolean }) {
  const valid = usableNumber(value);
  const shown = value === null || (typeof value === 'number' && Number.isFinite(value)) ? cognitiveNumber(value) : CROSS_DATA_ERROR;
  return <div className="cross-stored-value" data-cross-field={field} data-source-value={value === null ? 'null' : String(value)}>
    <div className="cross-value-heading"><span>{label}</span><strong className={value === null ? 'cross-missing' : ''}><bdi dir={value === null ? 'rtl' : 'ltr'}>{shown}</bdi>{value !== null && shown !== CROSS_DATA_ERROR && unit && <small> {unit}</small>}</strong></div>
    {bar && valid && <div className="cross-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><i style={{ width: `${value}%` }} /></div>}
  </div>;
}

function PanelNotice({ panel }: { panel: Panel }) {
  if (panel.status === 'loading') return <p role="status" className="cross-empty">در حال خواندن آرشیو…</p>;
  if (panel.status === 'error') return <p role="alert" className="cross-error" data-cross-error={panel.error.code}>{panel.error.message}</p>;
  return <p className="cross-empty" role="status">{CROSS_EMPTY}</p>;
}

function Orientation({ run }: { run: SavedCognitiveRunV1 }) {
  const r = run.cognitive, id = run.releasedScenarioId;
  const phases = run.releasedScenarioId === 4 ? [run.cognitive.orientation.perMove.move1, run.cognitive.orientation.perMove.move2, run.cognitive.orientation.perMove.move3] : run.cognitive.orientation.phaseScores;
  return <>
    <CognitiveSignedSpectrum label="شاخص جهت‌گیری این اجرا (OSI)" value={r.orientation.overall} field={`${id}.orientation.overall`} />
    <div className="cross-strengths">{([['operationalStrength', 'قدرت عملیاتی'], ['strategicStrength', 'قدرت راهبردی'], ['integration', 'یکپارچگی عملیاتی–راهبردی']] as const).map(([key, label]) => <CognitiveStoredValue key={key} label={label} value={r.orientation[key]} field={`${id}.orientation.${key}`} unit="از ۱۰۰" />)}</div>
    <CognitiveStoredValue label="پراکندگی جهت‌گیری" value={r.orientation.dispersion} field={`${id}.orientation.dispersion`} />
    <h4>{id === 4 ? 'سه مرحله سناریو ۱' : 'چهار فاز سناریو ۲'}</h4>
    <div className="cross-phase-spectra">{phases.map((value, i) => <CognitiveSignedSpectrum key={i} label={id === 4 ? `مرحله ${['۱', '۲', '۳'][i]}` : `فاز ${['A', 'B', 'C', 'D'][i]}`} value={value} field={`${id}.orientation.${id === 4 ? `perMove.move${i + 1}` : `phaseScores[${i}]`}`} />)}</div>
  </>;
}

const timingLabels = [
  ['medianActiveDecisionMs', 'میانه زمان فعال تصمیم', 'میلی‌ثانیه'], ['iqrActiveDecisionMs', 'دامنه میان‌چارکی زمان فعال', 'میلی‌ثانیه'],
  ['totalRevisions', 'تعداد بازنگری‌ها', ''], ['revisedWindows', 'پنجره‌های دارای بازنگری', ''], ['evidenceTriggeredRevisionRate', 'نرخ بازنگری پس از مشاهده شواهد', '٪'],
] as const;
function Timing({ run }: { run: SavedCognitiveRunV1 }) {
  const timing = run.releasedScenarioId === 4 ? run.cognitive.timing : run.cognitive.telemetrySummary;
  return <div className="cross-timing">{timingLabels.map(([key, label, unit]) => <CognitiveStoredValue key={key} label={label} value={timing[key]} field={`${run.releasedScenarioId}.${run.releasedScenarioId === 4 ? 'timing' : 'telemetrySummary'}.${key}`} unit={unit} />)}</div>;
}

function S1Details({ run }: { run: S1Run }) {
  const r = run.cognitive;
  return <>
    <CognitiveStoredValue label="انضباط اطلاعاتی" value={r.scores.informationDiscipline} field="4.scores.informationDiscipline" unit="از ۱۰۰" bar />
    <CognitiveStoredValue label="گرایش ائتلافی" value={r.scores.coalitionOrientation} field="4.scores.coalitionOrientation" unit="از ۱۰۰" bar />
    <details><summary>زمان و فرایند پاسخ سناریو ۱</summary><Timing run={run} /><CognitiveStoredValue label="زمان فعال مشاهده شواهد" value={r.timing.totalEvidenceDwellMs} field="4.timing.totalEvidenceDwellMs" unit="میلی‌ثانیه" />
      {(['longestDecision', 'shortestDecision'] as const).map(key => r.timing[key] && <div key={key}><h4>{key === 'longestDecision' ? 'طولانی‌ترین تصمیم' : 'کوتاه‌ترین تصمیم'}</h4><code>{r.timing[key].windowId}</code><CognitiveStoredValue label="زمان فعال" value={r.timing[key].activeDecisionMs} field={`4.timing.${key}.activeDecisionMs`} unit="میلی‌ثانیه" /></div>)}
      <p>وضعیت ثبت‌شده فرایند پاسخ: <code>{r.responseProcess.status}</code></p><dl>{Object.entries(r.responseProcess.flags).map(([key, flag]) => <div key={key}><dt><code>{key}</code></dt><dd>{flag ? 'فعال' : 'غیرفعال'}</dd></div>)}</dl>
    </details>
    <details><summary>جزئیات انتساب و هم‌سویی با شواهد</summary><CognitiveStoredValue label="میانگین هم‌سویی شواهد در همین اجرا" value={r.attribution.meanEvidenceAlignment} field="4.attribution.meanEvidenceAlignment" unit="از ۱۰۰" />
      {r.attribution.evidenceAlignment.map((x, i) => <CognitiveStoredValue key={i} label={x.phase} value={x.score} field={`4.attribution.evidenceAlignment[${i}].score`} />)}
      {r.attribution.evidenceUpdatingAudit.map((x, i) => <details key={i}><summary>ثبت {i + 1}: <bdi>{x.phaseBefore} → {x.phaseAfter}</bdi></summary><dl>{Object.entries(x).map(([key, value]) => <div key={key}><dt><code>{key}</code></dt><dd><bdi>{typeof value === 'number' ? cognitiveNumber(value) : value}</bdi></dd></div>)}</dl></details>)}
    </details>
    <details><summary>مقادیر ثبت‌شده هر پنجره تصمیم</summary>{r.perWindow.map((x, i) => <article className="cross-window" key={x.windowId}><h4><code>{x.windowId}</code></h4><p>گزینه ثبت‌شده: <code>{x.optionId}</code></p><CognitiveSignedSpectrum label="جهت‌گیری پنجره" value={x.adjustedOsi} field={`4.perWindow[${i}].adjustedOsi`} />
      {(['operationalLoading', 'strategicLoading', 'diagnosticWeight', 'evidenceCoverage'] as const).map(key => <CognitiveStoredValue key={key} label={key} value={x[key]} field={`4.perWindow[${i}].${key}`} />)}</article>)}</details>
  </>;
}

function Quality({ run }: { run: SavedCognitiveRunV1 }) {
  const r = run.cognitive;
  const fields = run.releasedScenarioId === 4 ? [
    ['coreDecisionRecords', 'رکورد تصمیم‌های اصلی'], ['timingIntegrity', 'کامل‌بودن زمان‌ها'], ['evidenceTelemetry', 'ثبت تعامل با شواهد'], ['attributionEstimates', 'برآوردهای انتساب'], ['reasonCapture', 'ثبت دلایل'],
  ] : [['decisions', 'تصمیم‌ها'], ['timing', 'زمان‌ها'], ['evidence', 'شواهد'], ['estimates', 'برآوردها'], ['reasons', 'دلایل']];
  const components = run.releasedScenarioId === 4 ? run.cognitive.dataCompleteness.components : run.cognitive.dataCompleteness;
  return <><CognitiveStoredValue label="کامل‌بودن داده‌های همین اجرا" value={r.dataCompleteness.overall} field={`${run.releasedScenarioId}.dataCompleteness.overall`} unit="٪" bar />
    {fields.map(([key, label]) => <CognitiveStoredValue key={key} label={label} value={(components as Record<string, number>)[key]} field={`${run.releasedScenarioId}.dataCompleteness.${run.releasedScenarioId === 4 ? 'components.' : ''}${key}`} unit="٪" />)}
    <p className="cross-muted">نسخه مدل: <code>{run.modelStamps.measurementModelVersion}</code><br />نسخه فرمول: <code>{run.modelStamps.formulaVersion}</code></p>
    <p className="cross-muted">این مدل‌ها آزمایشی‌اند؛ برچسب نسخه یا وضعیت اعتبار، تأیید روان‌سنجی محسوب نمی‌شود.</p>
  </>;
}

export function CrossScenarioCognitiveDashboard({ targetProfileId, access, profiles, onBack }: { targetProfileId: string; access: CognitiveAdminReadAccess | null; profiles: readonly Profile[]; onBack: () => void }) {
  const [loaded, setLoaded] = useState<{ owner: string; access: CognitiveAdminReadAccess | null; panels: Record<ScenarioId, Panel> } | null>(null);
  const [revision, setRevision] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [policy, setPolicy] = useState(readCognitiveArchivePolicy);
  let target: Profile | null = null;
  let denied: ReturnType<typeof cognitiveReadError> | null = null;
  try { target = requireCognitiveAdminReadAccess(access, targetProfileId); }
  catch (error) { denied = cognitiveReadError(error); }
  const permitted = !denied;
  useEffect(() => { headingRef.current?.focus(); }, [targetProfileId]);
  useEffect(() => {
    const update = () => { setPolicy(readCognitiveArchivePolicy()); setRevision(x => x + 1); };
    window.addEventListener('storage', update);
    window.addEventListener('cognitive-archive-policy-change', update);
    return () => { window.removeEventListener('storage', update); window.removeEventListener('cognitive-archive-policy-change', update); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (!permitted) return;
    setLoaded({ owner: targetProfileId, access, panels: { 4: { status: 'loading' }, 5: { status: 'loading' } } });
    for (const id of [4, 5] as const) {
      void listCognitiveRunsForAdmin(targetProfileId, id, access).then(rows => {
        requireCognitiveAdminReadAccess(access, targetProfileId);
        return { status: 'ready', rows, selectedId: rows[0]?.recordId ?? null } as Panel;
      }).catch(error => ({ status: 'error', error: cognitiveReadError(error) }) as Panel).then(panel => {
        if (!cancelled) setLoaded(previous => previous?.owner === targetProfileId && previous.access === access ? { ...previous, panels: { ...previous.panels, [id]: panel } } : previous);
      });
    }
    return () => { cancelled = true; };
  }, [targetProfileId, access, profiles, revision, permitted]);

  const panels: Record<ScenarioId, Panel> = loaded?.owner === targetProfileId && loaded.access === access ? loaded.panels : { 4: { status: 'loading' }, 5: { status: 'loading' } };
  const selected = (id: ScenarioId) => {
    const p = panels[id];
    return p.status === 'ready' ? p.rows.find(r => r.recordId === p.selectedId) ?? null : null;
  };
  const s1 = selected(4) as S1Run | null, s2 = selected(5) as S2Run | null;
  const inColumns = (render: (run: SavedCognitiveRunV1) => ReactNode) => <div className="cross-columns">{([4, 5] as const).map(id => <article className={`cross-scenario cross-scenario-${id}`} key={id}><h3>{scenarioName(id)}</h3>{selected(id) ? render(selected(id)!) : <PanelNotice panel={panels[id]} />}</article>)}</div>;

  return <main className="cross-dashboard" dir="rtl" data-cross-dashboard data-cross-owner={permitted ? targetProfileId : undefined}>
    <header className="cross-dashboard-header"><div><span className="cross-eyebrow">گزارش‌های آرشیوشده · مرورگر فعلی</span><h1 ref={headingRef} tabIndex={-1}>داشبورد شناختی تجمیعی</h1><p>نمای مشترک سناریوهای ۱ و ۲ — بدون امتیاز شناختی تلفیقی</p>{target && <p className="cross-target">پروفایل: <strong>{target.name}</strong><span>فقط مشاهده</span></p>}</div><button className="secondary" onClick={onBack}>بازگشت به مدیریت پروفایل‌ها</button></header>
    {denied ? <p className="cross-error" role="alert" data-cross-error={denied.code}>{denied.message}</p> : <>
      <div className="cross-archive-notice" role="note">{policy.enabled ? 'گزارش‌های تکمیل‌شده و ذخیره‌شده در این مرورگر نمایش داده می‌شوند.' : 'ذخیره گزارش جدید غیرفعال است؛ گزارش‌های قبلی قابل مشاهده‌اند'}<span>داده‌ها فقط متعلق به همین مرورگر و مبدأ سایت‌اند؛ همگام‌سازی بین دستگاه‌ها وجود ندارد.</span>{policy.error && <span role="status">{policy.error}</span>}</div>
      <section className="cross-run-pickers" aria-label="انتخاب مستقل اجراهای سناریوها">{([4, 5] as const).map(id => {
        const p = panels[id], run = selected(id);
        return <article className={`cross-run-picker cross-scenario-${id}`} key={id}><div className="cross-picker-heading"><span className="cross-scenario-number">{id === 4 ? '۰۱' : '۰۲'}</span><div><h2>{scenarioName(id)}</h2><p>{id === 4 ? 'حریم خاکستری مدار' : 'امواج خاموش'}</p></div><span className="cross-run-count">{p.status === 'ready' ? `${p.rows.length.toLocaleString('fa-IR')} اجرای آرشیوشده` : p.status === 'error' ? 'خطای خواندن' : 'در حال خواندن'}</span></div>
          {p.status === 'ready' && p.rows.length > 0 ? <><label htmlFor={`cross-run-${id}`}>اجرای انتخاب‌شده {scenarioName(id)}</label><select id={`cross-run-${id}`} value={p.selectedId ?? ''} onChange={event => { const recordId = event.target.value; setLoaded(old => old && old.owner === targetProfileId && old.access === access ? { ...old, panels: { ...old.panels, [id]: { ...p, selectedId: recordId } } } : old); }}>{p.rows.map(r => <option key={r.recordId} value={r.recordId}>{archiveDate(r.recordedAtIso)} · {r.recordId.slice(0, 8)}</option>)}</select>
            {run && <div className="cross-picker-metadata"><time dateTime={run.recordedAtIso}>{archiveDate(run.recordedAtIso)}</time><span>زمان محلی تهران</span><span>مدل <code>{run.modelStamps.measurementModelVersion}</code></span><span>فرمول <code>{run.modelStamps.formulaVersion}</code></span></div>}</> : <PanelNotice panel={p} />}
        </article>;
      })}</section>
      <section className="cross-coverage" aria-label="پوشش گزارش‌ها">{([4, 5] as const).map(id => <div key={id}><span>{scenarioName(id)}</span><strong>{selected(id) ? 'گزارش در دسترس' : panels[id].status === 'ready' ? 'اجرای آرشیوشده ندارد' : panels[id].status === 'error' ? 'خطای خواندن آرشیو' : 'در حال خواندن'}</strong>{selected(id) && <span>کامل‌بودن داده‌ها: <bdi>{cognitiveNumber(selected(id)!.cognitive.dataCompleteness.overall)}٪</bdi></span>}</div>)}</section>
      <nav className="cross-section-nav" aria-label="بخش‌های گزارش"><a href="#cross-orientation">جهت‌گیری</a><a href="#cross-concepts">شاخص‌های هم‌موضوع</a><a href="#cross-risk">ریسک</a><a href="#cross-unique">جزئیات اختصاصی</a><a href="#cross-quality">کیفیت داده‌ها</a></nav>
      <section className="cross-section" id="cross-orientation" aria-labelledby="cross-orientation-title"><div className="cross-section-heading"><span>۰۱</span><h2 id="cross-orientation-title">جهت‌گیری عملیاتی–راهبردی</h2></div><p className="cross-muted">هر طیف، جهت‌گیری همان اجرای سناریو را نسبت به گزینه‌های در دسترس آن نشان می‌دهد. عملیاتی‌تر یا راهبردی‌تر بودن به معنی بهتر یا بدتر بودن نیست.</p>{inColumns(run => <Orientation run={run} />)}</section>
      <section className="cross-section" id="cross-concepts" aria-labelledby="cross-concepts-title"><div className="cross-section-heading"><span>۰۲</span><h2 id="cross-concepts-title">شاخص‌های شناختی هم‌موضوع</h2></div><p className="cross-comparability">{CROSS_COMPARABILITY}</p><p className="cross-muted">هم‌موضوع؛ محاسبه مستقل در هر سناریو</p>
        <div className="cross-concept-table">{CROSS_CONCEPTS.map(([key, label]) => <article className="cross-concept-row" key={key} data-cross-concept={key}><h3>{label}</h3><div className="cross-concept-values">{([4, 5] as const).map(id => <div className={`cross-concept-cell cross-scenario-${id}`} key={id}><span className="cross-cell-scenario">{scenarioName(id)}</span>{id === 4 && s1 ? <CognitiveStoredValue label={`${label} — سناریو ۱`} value={s1.cognitive.scores[key]} field={`4.scores.${key}`} unit="از ۱۰۰" bar /> : id === 5 && s2 ? <CognitiveStoredValue label={`${label} — سناریو ۲`} value={s2.cognitive.constructs[key]} field={`5.constructs.${key}`} unit="از ۱۰۰" bar /> : <PanelNotice panel={panels[id]} />}</div>)}</div></article>)}</div>
      </section>
      <section className="cross-section" id="cross-risk" aria-labelledby="cross-risk-title"><div className="cross-section-heading"><span>۰۳</span><h2 id="cross-risk-title">موضع نسبی ریسک</h2></div><p className="cross-muted">موقعیت نسبی در طیف گزینه‌های همان سناریو؛ بدون قضاوت بهتر یا بدتر و بدون مقدار مشترک ریسک.</p>{inColumns(run => <CognitiveSignedSpectrum label="موضع نسبی ریسک همین اجرا" value={run.releasedScenarioId === 4 ? run.cognitive.scores.riskPosture : run.cognitive.constructs.riskPosture} field={`${run.releasedScenarioId}.${run.releasedScenarioId === 4 ? 'scores' : 'constructs'}.riskPosture`} risk />)}</section>
      <section className="cross-section" id="cross-unique" aria-labelledby="cross-unique-title"><div className="cross-section-heading"><span>۰۴</span><h2 id="cross-unique-title">شاخص‌ها و جزئیات اختصاصی</h2></div><p className="cross-unmeasured" data-cross-unmeasured>انضباط اطلاعاتی: در سناریو ۲ سنجیده نمی‌شود</p>{inColumns(run => run.releasedScenarioId === 4 ? <S1Details run={run} /> : <><p className="cross-muted">چهار فاز A، B، C و D در بخش جهت‌گیری همین گزارش نمایش داده شده‌اند.</p><h4>خلاصه تعامل ثبت‌شده</h4><Timing run={run} /><p className="cross-muted">آرشیو شناختی شامل مسیر کامل مأموریت، وضعیت کاروان‌ها، فهرست شواهد یا خط زمانی برآوردها نیست؛ این موارد از نتایج شناختی بازسازی نمی‌شوند.</p></>)}</section>
      <section className="cross-section" id="cross-quality" aria-labelledby="cross-quality-title"><div className="cross-section-heading"><span>۰۵</span><h2 id="cross-quality-title">کامل‌بودن داده‌ها و محدودیت‌ها</h2></div><p className="cross-comparability">کامل‌بودن داده‌ها فقط پوشش ثبت داده است و شاخص هوش یا عملکرد نیست. صفر با نبود داده کافی و با سنجیده‌نشدن یک ویژگی تفاوت دارد.</p>{inColumns(run => <Quality run={run} />)}<p className="cross-muted">این گزارش فقط مقادیر آرشیوشده را نمایش می‌دهد. انتخاب پروفایل و نشست ادمین، محدودیت رابط کاربری‌اند؛ مجوزدهی سرور، رمزنگاری یا حفاظت در برابر کد همان مبدأ وجود ندارد. آرشیو در پشتیبان فعلی سامانه گنجانده نمی‌شود.</p></section>
      <details className="cross-section cross-technical"><summary>جزئیات فنی</summary>{inColumns(run => <dl><div><dt>شناسه رکورد</dt><dd><code>{run.recordId}</code></dd></div><div><dt>شناسه علمی اجرا</dt><dd><code>{run.sourceRunId}</code></dd></div><div><dt>زمان ذخیره</dt><dd><code>{run.recordedAtIso}</code></dd></div><div><dt>منبع</dt><dd><code>{run.source}</code></dd></div><div><dt>نسخه ساختار</dt><dd><code>{run.schemaVersion}</code></dd></div>{Object.entries(run.modelStamps).map(([key, value]) => <div key={key}><dt><code>{key}</code></dt><dd><code>{value}</code></dd></div>)}</dl>)}</details>
      <footer className="cross-footer"><button className="secondary" onClick={onBack}>بازگشت به مدیریت پروفایل‌ها</button><button className="link" onClick={() => setRevision(x => x + 1)}>خواندن دوباره آرشیو</button><span>{CROSS_NULL} ≠ ۰</span></footer>
    </>}
  </main>;
}
