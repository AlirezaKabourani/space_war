import type { DecisionOption } from "../model/types";

export const thresholdOptions: DecisionOption[] = [
  { id: "m3_t_insufficient", label: "برای انتساب راهبردی هنوز کافی نیست" },
  { id: "m3_t_sufficient_limited", label: "برای اقدام محدود و برگشت‌پذیر کافی است" },
  { id: "m3_t_sufficient_strong", label: "برای اقدام قاطع‌تر کافی است" },
];

export const crisisCoaOptions: DecisionOption[] = [
  {
    id: "m3_coa_contain_understand",
    label: "مهار و شناخت",
    description: "تمرکز بر حفظ مأموریت، افزایش شناخت و خودداری از گسترش رویارویی.",
  },
  {
    id: "m3_coa_controlled_deterrence",
    label: "بازدارندگی کنترل‌شده",
    description: "آمادگی و حفاظت افزایش یابد و Red یک هشدار روشن اما محدود دریافت کند.",
  },
  {
    id: "m3_coa_coordinated_response",
    label: "پاسخ هماهنگ ائتلافی",
    description: "پاسخ سیاسی، اطلاعاتی و حفاظتی با متحدان هماهنگ شود.",
  },
  {
    id: "m3_coa_negotiated_deescalation",
    label: "کاهش تنش مذاکره‌شده",
    description: "یک سازوکار موقت فاصله‌گذاری، اطلاع‌رسانی و رفتار ایمن متقابل پیشنهاد یا پذیرفته شود.",
  },
  {
    id: "m3_coa_unilateral_strong",
    label: "اقدام یک‌جانبه شدیدتر در سطح حفاظتی/سیاسی",
    description: "بدون انتظار برای اجماع کامل، سطح موضع و اقدامات حفاظتی به‌طور محسوس افزایش یابد.",
  },
];

export const informationPolicyOptions: DecisionOption[] = [
  { id: "m3_info_keep_restricted", label: "محرمانه باقی بماند" },
  { id: "m3_info_share_allies", label: "اشتراک محدود با متحدان" },
  { id: "m3_info_public_partial", label: "انتشار عمومی بخشی از شواهد" },
  { id: "m3_info_public_attribution", label: "انتساب عمومی به Red" },
];

export const offRampOptions: DecisionOption[] = [
  { id: "accept_as_interim", label: "پذیرش موقت" },
  { id: "renegotiate_terms", label: "مذاکره دوباره درباره شرایط" },
  { id: "keep_channel_open_no_commitment", label: "باز نگه‌داشتن کانال بدون تعهد" },
  { id: "reject", label: "رد سازوکار" },
];

export const move3ReasonOptions = [
  "حفظ مأموریت",
  "سطح اطمینان انتساب",
  "بازدارندگی",
  "جلوگیری از تشدید",
  "انسجام ائتلاف",
  "مشروعیت سیاسی/حقوقی",
  "حفظ منابع و قابلیت‌های آینده",
  "ایجاد مسیر خروج از بحران",
  "سایر",
];
