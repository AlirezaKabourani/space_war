import type { Scenario5CognitiveRunResult } from '../model/cognitive/types';
import type { Scenario5RuntimeResult, Scenario5RuntimeState } from '../model/runtime/types';

export const COGNITIVE_UNAVAILABLE = 'داده کافی برای محاسبه این شاخص ثبت نشده است.';
export const REVISION_RATE_UNAVAILABLE = 'در این اجرا فرصت واجد شرایط برای محاسبه این نرخ ثبت نشد.';
export const INFORMATION_DISCIPLINE_UNMEASURED = 'انضباط اطلاعاتی: در نسخه فعلی این سناریو سنجیده نمی‌شود.';
export const EXPERIMENTAL_VALIDITY = 'آزمایشی؛ در انتظار اعتبارسنجی خبرگان و کاربران';

export function currentRunCognitive(
  state: Pick<Scenario5RuntimeState, 'stage' | 'runId'> | null,
  result: Pick<Scenario5RuntimeResult, 'runId' | 'cognitive'> | null,
): Scenario5CognitiveRunResult | null {
  if (!state || state.stage.stageId !== 'complete' || !result || !result.cognitive) return null;
  const r = result.cognitive;
  return state.runId !== '' && state.runId === result.runId && result.runId === r.runId
    && r.scenarioId === 's5_silent_waves_redesign' ? r : null;
}

// Only graphical coordinates are mapped. Stored scores are never normalized or filled.
export const signedAxisPosition = (value: number | null): number | null => value === null ? null : (value + 1) * 50;
export const signedText = (value: number | null): string => value === null ? COGNITIVE_UNAVAILABLE : `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)}`;
export const numericText = (value: number | null): string => value === null ? COGNITIVE_UNAVAILABLE : value.toFixed(2);
export const secondsText = (milliseconds: number | null): string => milliseconds === null ? COGNITIVE_UNAVAILABLE : `${(milliseconds / 1000).toFixed(1)} ثانیه`;
export const percentText = (value: number): string => `${value.toFixed(2)}٪`;

export const COGNITIVE_PHASE_LABELS = [
  'فاز ۱ — ساخت تصویر اولیه',
  'فاز ۲ — تمرکز و مدیریت مسیر',
  'فاز ۳ — ایجاد تاب‌آوری',
  'فاز ۴ — مدیریت فشار و تحویل',
] as const;

export type MeasuredConstructKey = Exclude<keyof Scenario5CognitiveRunResult['constructs'], 'riskPosture' | 'informationDiscipline'>;
interface ConstructDefinition { readonly key: MeasuredConstructKey; readonly label: string; readonly definition: string }
export const CONSTRUCT_GROUPS: readonly { readonly label: string; readonly items: readonly ConstructDefinition[] }[] = [
  { label: 'اطلاعات و بازنگری', items: [
    { key: 'informationSeeking', label: 'جست‌وجوی اطلاعات', definition: 'الگوی انتخاب روش‌های اطلاعاتی، پوشش شواهد مرتبطِ بازشده و تنوع منابع قابل مشاهده در موقعیت‌های واجد شرایط' },
    { key: 'evidenceResponsiveUpdating', label: 'به‌روزرسانی متناسب با شواهد', definition: 'همسویی تغییر برآورد اخلال هدفمند با تغییر شواهد قابل مشاهده میان نقاط ثبت برداشت؛ نه درستی تشخیص کریدور واقعی' },
  ] },
  { label: 'تعامل و پیامدهای بعدی', items: [
    { key: 'secondOrderThinking', label: 'تفکر مرتبه دوم', definition: 'توجه کدگذاری‌شده انتخاب‌ها به پیامدهای آینده، واکنش طرف مقابل، برگشت‌پذیری و منابع' },
    { key: 'adversaryModeling', label: 'مدل‌سازی طرف مقابل', definition: 'میزان وزن‌دادن انتخاب‌ها به واکنش طرف مقابل در گزینه‌های واجد شرایط؛ نه صحت حدس نیت پنهان' },
    { key: 'escalationSensitivity', label: 'حساسیت به تشدید', definition: 'میزان توجه کدگذاری‌شده به پیامدهای تشدید در تصمیم‌های مرتبط؛ مقدار بیشتر الزاماً بهتر نیست' },
  ] },
  { label: 'منابع و برنامه‌ریزی', items: [
    { key: 'resourceStewardship', label: 'نگهداشت و تخصیص منابع', definition: 'ترکیب پروفایل گزینه‌ها و وضعیت منابع قابل مشاهده؛ صرفاً میزان ذخیره باقیمانده نیست' },
    { key: 'planningForesight', label: 'برنامه‌ریزی و آینده‌نگری', definition: 'توجه کدگذاری‌شده به برنامه جایگزین، برگشت‌پذیری، مدیریت منابع و پیامدهای آینده' },
  ] },
  { label: 'ترکیب و انسجام تصمیم', items: [
    { key: 'multiDomainIntegration', label: 'یکپارچه‌سازی چندمعیاره', definition: 'پوشش هم‌زمان ابعاد مرتبط مأموریت در پروفایل انتخاب‌ها؛ شاخصی وابسته به این سناریو' },
    { key: 'decisionCoherence', label: 'انسجام تصمیم', definition: 'سازگاری دلیل‌های ثبت‌شده با گزینه‌ها و ارتباط انتخاب‌های پیاپی در فازهای واجد شرایط؛ نه درست/غلط بودن تصمیم' },
  ] },
];

export const COMPLETENESS_FIELDS = [
  { key: 'decisions', label: 'ثبت تصمیم‌ها' },
  { key: 'timing', label: 'داده‌های زمانی' },
  { key: 'evidence', label: 'داده‌های شواهد' },
  { key: 'estimates', label: 'ثبت برآوردها' },
  { key: 'reasons', label: 'ثبت دلیل‌ها' },
] as const satisfies readonly { key: keyof Scenario5CognitiveRunResult['dataCompleteness']; label: string }[];

export const COGNITIVE_METADATA_FIELDS = [
  { key: 'measurementModelVersion', label: 'نسخه مدل اندازه‌گیری' },
  { key: 'formulaVersion', label: 'نسخه فرمول' },
  { key: 'optionProfileVersion', label: 'نسخه پروفایل گزینه‌ها' },
  { key: 'reasonModelVersion', label: 'نسخه مدل دلیل‌ها' },
  { key: 'scenarioContentVersion', label: 'نسخه محتوای سناریو' },
  { key: 'expertPanelVersion', label: 'وضعیت پنل خبره' },
  { key: 'validityStatus', label: 'وضعیت اعتبارسنجی' },
  { key: 'runId', label: 'شناسه همین اجرا' },
] as const satisfies readonly { key: keyof Scenario5CognitiveRunResult; label: string }[];
