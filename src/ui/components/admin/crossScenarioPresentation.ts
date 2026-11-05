export const CROSS_CONCEPTS = [
  ['informationSeeking', 'جست‌وجوی اطلاعات'],
  ['secondOrderThinking', 'تفکر مرتبه دوم'],
  ['adversaryModeling', 'مدل‌سازی طرف مقابل'],
  ['escalationSensitivity', 'حساسیت به تشدید'],
  ['evidenceResponsiveUpdating', 'بازنگری مبتنی بر شواهد'],
  ['resourceStewardship', 'نگهداشت و تخصیص منابع'],
  ['planningForesight', 'برنامه‌ریزی و آینده‌نگری'],
  ['multiDomainIntegration', 'یکپارچه‌سازی چندمعیاره'],
  ['decisionCoherence', 'انسجام تصمیم'],
] as const;
export const CROSS_NULL = 'داده کافی برای محاسبه وجود ندارد';
export const CROSS_EMPTY = 'برای این کاربر اجرای تکمیل‌شدهٔ آرشیوشده از این سناریو وجود ندارد.';
export const CROSS_DATA_ERROR = 'خطای داده: مقدار ثبت‌شده معتبر نیست.';
export const CROSS_COMPARABILITY = 'مقادیر دو سناریو از مدل‌ها و موقعیت‌های متفاوت محاسبه شده‌اند و فعلاً میانگین‌گیری یا رتبه‌بندی بین‌سناریویی نمی‌شوند.';

export function cognitiveNumber(value: unknown, signed = false): string {
  if (value === null) return CROSS_NULL;
  if (typeof value !== 'number' || !Number.isFinite(value)) return CROSS_DATA_ERROR;
  return signed ? (value >= 0 ? '+' : '−') + value.toFixed(2).replace('-', '') : value.toFixed(2);
}
export function archiveDate(iso: string): string {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(iso));
}
export function cognitiveReadError(error: unknown): { code: string; message: string } {
  const code = error instanceof DOMException ? error.name : error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : 'InvalidData';
  if (code === 'PermissionDenied' || code === 'OwnerMissing' || code === 'ProfileStorageUnavailable') return { code, message: error instanceof Error ? error.message : 'دسترسی به گزارش ممکن نیست.' };
  const messages: Record<string, string> = {
    Unavailable: 'آرشیو مرورگر در دسترس نیست؛ این وضعیت با نبود اجرای ذخیره‌شده تفاوت دارد.',
    Blocked: 'خواندن آرشیو توسط صفحه دیگری مسدود شده است؛ دوباره تلاش کنید.',
    QuotaExceededError: 'مرورگر به علت محدودیت فضای ذخیره‌سازی اجازه خواندن آرشیو را نداد.',
    OwnerMismatch: 'مالک رکورد با پروفایل موردنظر تطابق ندارد؛ گزارش نمایش داده نشد.',
    SchemaUnavailable: 'ساختار آرشیو در دسترس نیست یا نسخه آن پشتیبانی نمی‌شود.',
  };
  return { code, message: messages[code] ?? 'خواندن یا اعتبارسنجی آرشیو ناموفق بود؛ داده نامعتبر به‌عنوان نبود اجرا یا مقدار صفر نمایش داده نمی‌شود.' };
}
