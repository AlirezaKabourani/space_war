import type { Scenario5CognitiveRunResult } from '../model/cognitive/types';
import {
  COGNITIVE_METADATA_FIELDS, COGNITIVE_PHASE_LABELS, COGNITIVE_UNAVAILABLE,
  COMPLETENESS_FIELDS, CONSTRUCT_GROUPS, EXPERIMENTAL_VALIDITY,
  INFORMATION_DISCIPLINE_UNMEASURED, REVISION_RATE_UNAVAILABLE,
  numericText, percentText, secondsText, signedAxisPosition, signedText,
} from './cognitiveDashboardPresentation';

export const ScenarioFiveCognitiveUnavailable = ({ onComplete }: { onComplete: () => void }) =>
  <main className="s5-root s5-cognitive-dashboard" dir="rtl"><h1>الگوی تصمیم‌گیری شما</h1><p role="status">گزارش شناختی این اجرا در دسترس نیست.</p><button type="button" className="s5-primary-button" onClick={onComplete}>پایان سناریو</button></main>;

export const ScenarioFiveSignedAxis = ({ label, value, field, risk = false }: {
  label: string; value: number | null; field: string; risk?: boolean;
}) => {
  const position = signedAxisPosition(value);
  return <div className={`s5-cog-signed${field === 'orientation.overall' ? ' s5-cog-signed-overall' : ''}`} data-cognitive-field={field}>
    {field === 'orientation.overall' && <h3 className="s5-cog-spectrum-title">طیف جهت‌گیری تصمیم عملیاتی–راهبردی در این اجرا</h3>}
    <div className="s5-cog-value-heading"><h3>{label}</h3><strong className={value === null ? 's5-cog-missing' : ''}>{value === null ? COGNITIVE_UNAVAILABLE : <bdi dir="ltr">{signedText(value)}</bdi>}</strong></div>
    <div className="s5-cog-axis" dir="ltr" role="img" aria-label={`${label}: ${signedText(value)}`}>
      <div className="s5-cog-axis-track"><i className="s5-cog-axis-center" />{position !== null && <i className="s5-cog-axis-marker" data-signed-marker={field} data-axis-edge={position === 0 ? 'start' : position === 100 ? 'end' : undefined} style={{ left: `${position}%` }} />}</div>
      <div className="s5-cog-axis-ticks" aria-hidden="true"><span>−1</span><span>0</span><span>+1</span></div>
      <div className="s5-cog-axis-labels"><span dir="rtl">{risk ? 'پذیرش ریسک کمتر' : 'عملیاتی'}</span><span dir="rtl">{risk ? 'پذیرش ریسک بیشتر' : 'راهبردی'}</span></div>
    </div>
  </div>;
};

const NumberCard = ({ label, value, field, unit = '' }: { label: string; value: number | null; field: string; unit?: string }) =>
  <div className="s5-cog-number-card" data-cognitive-field={field}><span>{label}</span><strong className={value === null ? 's5-cog-missing' : ''}>{value === null ? COGNITIVE_UNAVAILABLE : <><bdi dir="ltr">{numericText(value)}</bdi>{unit && <small>{' '}{unit}</small>}</>}</strong></div>;

export const ScenarioFiveCognitiveDashboard = ({ cognitive: r, onBack, onComplete, onTechnical, onReviewTrace }: {
  cognitive: Scenario5CognitiveRunResult;
  onBack: () => void; onComplete: () => void; onTechnical?: () => void; onReviewTrace?: () => void;
}) => <main className="s5-root s5-cognitive-dashboard" dir="rtl" data-cognitive-run={r.runId}>
  <header className="s5-cog-header"><div><span>گزارش تصمیم‌گیری</span><h1>الگوی تصمیم‌گیری شما</h1><p>سناریو ۲ — امواج خاموش | گزارش توصیفی یک اجرای کامل</p></div>
    <div className="s5-cog-actions"><button type="button" className="s5-secondary-button" onClick={onBack}>بازگشت به گزارش مأموریت</button><button type="button" className="s5-secondary-button" onClick={onTechnical} disabled={!onTechnical} title={onTechnical ? undefined : 'در اجرای کامل سناریو در دسترس است'}>گزارش فنی کامل</button><button type="button" className="s5-primary-button" onClick={onComplete}>پایان سناریو</button></div>
  </header>

  <section className="s5-cog-module s5-cog-coverage-module" aria-labelledby="s5-cog-m0" data-cognitive-module="M0">
    <h2 id="s5-cog-m0">درباره داده‌های این گزارش</h2>
    <div className="s5-cog-coverage" data-cognitive-field="dataCompleteness.overall"><span>کامل‌بودن داده‌های ثبت‌شده</span><strong><bdi dir="ltr">{percentText(r.dataCompleteness.overall)}</bdi></strong><p>این درصد پوشش داده‌های ثبت‌شده را نشان می‌دهد و شاخص عملکرد شما نیست.</p></div>
    <details className="s5-cog-details"><summary>جزئیات کامل‌بودن داده‌ها</summary><dl className="s5-cog-coverage-details">{COMPLETENESS_FIELDS.map(item => <div key={item.key} data-cognitive-field={`dataCompleteness.${item.key}`}><dt>{item.label}</dt><dd><bdi dir="ltr">{percentText(r.dataCompleteness[item.key])}</bdi></dd></div>)}</dl></details>
    <p className="s5-cog-note" data-cognitive-field="validityStatus">{r.validityStatus === 'experimental_pending_expert_and_human_validation' ? EXPERIMENTAL_VALIDITY : 'وضعیت اعتبارسنجی این نسخه ثبت نشده است.'}</p>
  </section>

  <section className="s5-cog-module s5-cog-orientation" aria-labelledby="s5-cog-m1" data-cognitive-module="M1">
    <h2 id="s5-cog-m1">جهت‌گیری تصمیم‌ها</h2>
    <ScenarioFiveSignedAxis label="شاخص جهت‌گیری این اجرا (OSI)" value={r.orientation.overall} field="orientation.overall" />
    <p className="s5-cog-definition">این اعداد جهت‌گیری نسبی انتخاب‌های ثبت‌شده را نسبت به گزینه‌های همان موقعیت نشان می‌دهند. عملیاتی‌تر یا راهبردی‌تر بودن، به‌خودی‌خود به معنی تصمیم بهتر یا بدتر نیست.</p>
    <div className="s5-cog-phase-grid">{COGNITIVE_PHASE_LABELS.map((label,index) => <ScenarioFiveSignedAxis key={label} label={label} value={r.orientation.phaseScores[index]} field={`orientation.phaseScores[${index}]`} />)}</div>
    <div className="s5-cog-strength-grid"><NumberCard label="قدرت عملیاتی" field="orientation.operationalStrength" value={r.orientation.operationalStrength} unit="از ۱۰۰" /><NumberCard label="قدرت راهبردی" field="orientation.strategicStrength" value={r.orientation.strategicStrength} unit="از ۱۰۰" /><NumberCard label="یکپارچگی عملیاتی–راهبردی" field="orientation.integration" value={r.orientation.integration} unit="از ۱۰۰" /></div>
    <details className="s5-cog-details"><summary>پراکندگی جهت‌گیری بین فازها</summary><NumberCard label="پراکندگی جهت‌گیری بین فازها" field="orientation.dispersion" value={r.orientation.dispersion} unit="دامنه ۰ تا ۱" /></details>
  </section>

  <section className="s5-cog-module" aria-labelledby="s5-cog-m2" data-cognitive-module="M2"><h2 id="s5-cog-m2">الگوهای رفتاری مشاهده‌شده</h2>
    <div className="s5-cog-groups">{CONSTRUCT_GROUPS.map(group => <section key={group.label} className="s5-cog-construct-group"><h3>{group.label}</h3><div className="s5-cog-constructs">{group.items.map(item => {
      const value = r.constructs[item.key];
      return <article key={item.key} className="s5-cog-construct" data-construct={item.key} data-cognitive-field={`constructs.${item.key}`}>
        <h4>{item.label}</h4><strong className={value === null ? 's5-cog-missing' : 's5-cog-measured'}>{value === null ? COGNITIVE_UNAVAILABLE : <bdi dir="ltr">{numericText(value)} / 100</bdi>}</strong>
        {value !== null && <div className="s5-cog-construct-track" role="meter" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><i style={{ width: `${value}%` }} /></div>}
        <details className="s5-cog-details"><summary>این شاخص چه چیزی را بازتاب می‌دهد؟</summary><p>{item.definition}</p></details>
      </article>;
    })}</div></section>)}</div>
  </section>

  <section className="s5-cog-module" aria-labelledby="s5-cog-m3" data-cognitive-module="M3"><h2 id="s5-cog-m3">موضع ریسک و ویژگی‌های تعامل</h2>
    <ScenarioFiveSignedAxis label="موضع نسبی ریسک" field="constructs.riskPosture" value={r.constructs.riskPosture} risk />
    <p className="s5-cog-definition">موضع ریسک نسبت به گزینه‌های در دسترس همان موقعیت بیان می‌شود و نشانه مهارت یا شایستگی مدیریت ریسک نیست.</p>
    <div className="s5-cog-telemetry">
      <div className="s5-cog-number-card" data-cognitive-field="telemetrySummary.medianActiveDecisionMs"><span>میانه زمان فعال تصمیم‌ها</span><strong className={r.telemetrySummary.medianActiveDecisionMs === null ? 's5-cog-missing' : ''}>{secondsText(r.telemetrySummary.medianActiveDecisionMs)}</strong></div>
      <div className="s5-cog-number-card" data-cognitive-field="telemetrySummary.iqrActiveDecisionMs"><span>دامنه میان‌چارکی زمان فعال تصمیم‌ها (IQR)</span><strong className={r.telemetrySummary.iqrActiveDecisionMs === null ? 's5-cog-missing' : ''}>{secondsText(r.telemetrySummary.iqrActiveDecisionMs)}</strong></div>
      <div className="s5-cog-number-card" data-cognitive-field="telemetrySummary.totalRevisions"><span>تعداد بازنگری‌ها</span><strong>{r.telemetrySummary.totalRevisions}</strong></div>
      <div className="s5-cog-number-card" data-cognitive-field="telemetrySummary.revisedWindows"><span>پنجره‌های تصمیم دارای بازنگری</span><strong>{r.telemetrySummary.revisedWindows}</strong></div>
      <div className="s5-cog-number-card" data-cognitive-field="telemetrySummary.evidenceTriggeredRevisionRate"><span>نرخ بازنگری پس از مشاهده شواهد</span><strong className={r.telemetrySummary.evidenceTriggeredRevisionRate === null ? 's5-cog-missing' : ''}>{r.telemetrySummary.evidenceTriggeredRevisionRate === null ? REVISION_RATE_UNAVAILABLE : <bdi dir="ltr">{percentText(r.telemetrySummary.evidenceTriggeredRevisionRate)}</bdi>}</strong></div>
    </div>
    <p className="s5-cog-note">زمان‌ها فقط توصیفی‌اند و بیانگر توانایی یا سرعت پردازش فرد نیستند. نرخ بازنگری، همراهی در توالی زمانیِ بازکردن شواهد و تغییر انتخاب را نشان می‌دهد و اثبات نمی‌کند که شواهد علت بازنگری بوده‌اند.</p>
  </section>

  <section className="s5-cog-module" aria-labelledby="s5-cog-m4" data-cognitive-module="M4"><h2 id="s5-cog-m4">روش محاسبه و محدودیت‌ها</h2>
    <ul><li>این شاخص‌ها پروکسی‌های رفتاری وابسته به همین اجرای سناریو هستند؛ نمره هوش، توانایی، شخصیت، تشخیص قطعی روان‌سنجی، درستی تصمیم یا نتیجه مأموریت نیستند.</li>
      <li>بارگذاری گزینه‌ها و معیارهای کدگذاری دلیل‌ها در پروژه تعریف شده‌اند و هنوز در انتظار اعتبارسنجی تجربی‌اند.</li>
      <li>در این داشبورد، حقیقت پنهان، تحویل نهایی، برد و باخت مأموریت و حقیقت عامل مقابل ورودی محاسبه یا رتبه‌بندی شناختی نیستند.</li>
      <li>صفر یک مقدار اندازه‌گیری‌شده است؛ مقدار ناموجود با صفر فرق دارد. سنجیده‌نشدن یک ویژگی نیز با نبود داده کافی برای محاسبه آن یکسان نیست.</li>
      <li>نتایج عددی سناریوهای ۱ و ۲ به‌طور خودکار قابل مقایسه یا تجمیع نیستند.</li>
      <li>مسیر کامل هشت تصمیم در گزارش پس از اقدام در دسترس است؛ موتور این سناریو سهم شناختی عددی هر تصمیم را ارائه نمی‌کند.</li>
      <li>تصمیم ۲، مربوط به گردآوری شواهد، در شاخص جهت‌گیری لحاظ نمی‌شود. OSI کل از نتیجه ذخیره‌شده خوانده می‌شود؛ با نبود یک فاز، جهت‌گیری متعادل فرض نمی‌شود.</li>
      <li>نبود مقدار به‌روزرسانی متناسب با شواهد به معنی بازنگری ضعیف نیست؛ ممکن است جفتِ واجد شرایط با تغییر اطلاعاتی ثبت نشده باشد. قدرت‌های موجود نیز هنگام ناموجودبودن OSI کل نمایش داده می‌شوند.</li>
    </ul>
    {r.constructs.informationDiscipline === null && <p className="s5-cog-note" data-cognitive-field="constructs.informationDiscipline">{INFORMATION_DISCIPLINE_UNMEASURED}</p>}
    <button type="button" className="s5-secondary-button" onClick={onReviewTrace} disabled={!onReviewTrace} title={onReviewTrace ? undefined : 'در اجرای کامل سناریو در دسترس است'}>مرور مسیر تصمیم‌ها</button>
    <details className="s5-cog-details s5-cog-technical"><summary>مشخصات فنی همین اجرا</summary><dl>{COGNITIVE_METADATA_FIELDS.map(item => <div key={item.key} data-cognitive-field={item.key}><dt>{item.label}</dt><dd><code dir="ltr">{r[item.key]}</code></dd></div>)}</dl></details>
  </section>
  <footer className="s5-cog-actions"><button type="button" className="s5-secondary-button" onClick={onBack}>بازگشت به گزارش مأموریت</button><button type="button" className="s5-primary-button" onClick={onComplete}>پایان سناریو</button></footer>
</main>;
