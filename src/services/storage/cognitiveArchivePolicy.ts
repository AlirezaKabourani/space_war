import type { Profile } from '../../core/types/profile';

// Deliberately outside the legacy space-war.* backup/reset namespace. An imported
// legacy backup must not enable result recording on a different browser/origin.
export const COGNITIVE_ARCHIVE_POLICY_KEY = 'space-war-cognitive-archive.policy.v1';
export const ARCHIVE_DISCLOSURE_FA = 'با تکمیل این اجرا، گزارش شناختی برای پروفایل آغازکننده در همین مرورگر و مبدأ سایت ذخیره می‌شود. همگام‌سازی بین دستگاه‌ها وجود ندارد؛ این تنظیم از ثبت رویدادهای رفتاری مستقل است.';

export function readCognitiveArchivePolicy(): { enabled: boolean; error?: string } {
  try {
    const raw = localStorage.getItem(COGNITIVE_ARCHIVE_POLICY_KEY);
    if (raw === null) return { enabled: false };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 ||
        !('enabled' in value) || typeof value.enabled !== 'boolean') throw new Error('Invalid archive policy');
    return { enabled: value.enabled };
  } catch {
    return { enabled: false, error: 'خواندن تنظیم آرشیو ممکن نشد؛ ذخیره گزارش غیرفعال است.' };
  }
}

export function setCognitiveArchivePolicy(actor: Profile, enabled: boolean): void {
  if (actor.role !== 'admin') throw new Error('تنظیم آرشیو فقط در نشست ادمین در دسترس است.');
  localStorage.setItem(COGNITIVE_ARCHIVE_POLICY_KEY, JSON.stringify({ version: 1, enabled }));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cognitive-archive-policy-change'));
}
