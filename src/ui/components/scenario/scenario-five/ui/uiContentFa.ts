import type { ActorProfileId, CorridorId, EvidenceDirection, EvidenceSourceType, EvidenceStrengthBand } from "../model/index";
import type { MissionActionId, MissionConvoyStatus, Scenario5EndStateId } from "../model/mission/index";
import type { ReasonId } from "../model/cognitive/index";
import type { RuntimeStageId } from "../model/runtime/index";

export interface Scenario5ActionCopy {
  readonly title: string;
  readonly description: string;
  readonly knownEffect: string;
}

export const SCENARIO5_BRIEFING_FA = {
  title: "امواج خاموش — فرماندهی لجستیک در اختلال PNT",
  body: `چهار کاروان به‌طور هم‌زمان در شبکه لجستیکی در حرکت‌اند. کاروان الف حامل تجهیزات درمانی اضطراری و بالاترین اولویت مأموریتی است، اما موفقیت مأموریت فقط به یک کاروان وابسته نیست: تداوم کل شبکه اهمیت دارد.

در طول مأموریت ممکن است میان داده‌های موقعیت، گزارش‌های میدانی و وضعیت واقعی مسیرها ناهمخوانی ایجاد شود. علت این ناهمخوانی از ابتدا برای شما قطعی نیست. باید با منابع محدود ISR و ذخیره پشتیبانی، اطلاعات را بررسی کنید، مسیرها را مدیریت کنید و توان واکنش برای مراحل بعد را حفظ کنید.

هر تصمیم زمان عملیاتی مصرف می‌کند. ETA و مهلت تحویل کاروان‌ها واقعی‌اند و تصمیم‌های امروز می‌توانند گزینه‌های مراحل بعد را محدود کنند.

در این تمرین «پاسخ صحیح از پیش نمایش‌داده‌شده» وجود ندارد. بر اساس اطلاعاتی که در همان لحظه در اختیار دارید تصمیم بگیرید.`,
  rules: [
    "۸ تصمیم اصلی در چهار فاز",
    "ISR و ذخیره پشتیبانی محدودند",
    "شواهد ممکن است ناقص، متعارض یا گمراه‌کننده باشند",
    "برای دیدن جزئیات و محدودیت یک شاهد، آن را باز کنید",
    "در چند نقطه برداشت فعلی شما ثبت می‌شود؛ نتیجه درست/غلط همان لحظه اعلام نمی‌شود",
    "در پایان، گزارش پس از اقدام حقیقت پنهان و مسیر تصمیم را کنار هم نشان می‌دهد",
  ],
  timeClarification: "این زمان، ساعت عملیاتی داخل شبیه‌سازی است و با مدت واقعی اجرای بازی متفاوت است.",
  button: "آغاز مأموریت",
} as const;

export const getScenario5PlayerStageLabel = (stageId: RuntimeStageId): string => {
  if (stageId.startsWith("decision:")) return "تصمیم عملیاتی";
  if (stageId.startsWith("belief:")) return "ثبت برداشت";
  if (stageId.startsWith("reason:")) return "ثبت دلیل پیش از پیامد";
  if (stageId === "outcome_review") return "مرور پیامد";
  if (stageId === "complete") return "گزارش پس از اقدام";
  throw new Error(`Unknown Scenario 5 runtime stage: ${String(stageId)}`);
};

export const SCENARIO5_PHASE_CONTENT_FA = {
  A: "پایش و شکل‌دهی فرضیه",
  B: "تشخیص و سازگارسازی مسیر",
  C: "فشار لجستیکی و منابع",
  D: "بحران و حل مأموریت",
} as const;

export const SCENARIO5_ROUND_CONTENT_FA = {
  1: { title: "تصویر مبنا", problem: "پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟" },
  2: { title: "بررسی ناهنجاری", problem: "نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟" },
  3: { title: "تخصیص توجه", problem: "ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟" },
  4: { title: "سیاست مسیر", problem: "در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟" },
  5: { title: "تاب‌آوری و پشتیبانی", problem: "برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟" },
  6: { title: "سبد منابع", problem: "ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟" },
  7: { title: "پاسخ به تهدید فعال", problem: "با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟" },
  8: { title: "سیاست نهایی تحویل", problem: "برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟" },
} as const;

export const SCENARIO5_CORRIDOR_CONTENT_FA: Readonly<Record<CorridorId, {
  readonly convoyId: "alpha" | "beta" | "gamma" | "delta";
  readonly convoyLabel: string;
  readonly cargoLabel: string;
  readonly routeLabel: string;
  readonly corridorLabel: string;
  readonly targetLabel: string;
}>> = {
  corridor_alpha_east: { convoyId: "alpha", convoyLabel: "کاروان الف", cargoLabel: "تجهیزات درمانی اضطراری", routeLabel: "تهران → مشهد", corridorLabel: "کریدور شرقی", targetLabel: "کریدور شرقی / کاروان الف" },
  corridor_beta_south: { convoyId: "beta", convoyLabel: "کاروان ب", cargoLabel: "سوخت عملیاتی", routeLabel: "بندرعباس → تهران", corridorLabel: "کریدور جنوبی", targetLabel: "کریدور جنوبی / کاروان ب" },
  corridor_gamma_northwest: { convoyId: "gamma", convoyLabel: "کاروان ج", cargoLabel: "قطعات ارتباطی", routeLabel: "تبریز → تهران", corridorLabel: "کریدور شمال‌غربی", targetLabel: "کریدور شمال‌غربی / کاروان ج" },
  corridor_delta_west: { convoyId: "delta", convoyLabel: "کاروان د", cargoLabel: "پشتیبانی مرزی", routeLabel: "تهران → محور غرب", corridorLabel: "کریدور غربی", targetLabel: "کریدور غربی / کاروان د" },
};

export const SCENARIO5_ACTION_COPY_FA: Readonly<Record<MissionActionId, Scenario5ActionCopy>> = {
  a1_network_baseline: { title: "پایش مبنای سراسری", description: "یک تصویر پایه از الگوهای PNT در کل شبکه تهیه کنید.", knownEffect: "پوشش اطلاعاتی گسترده‌تر؛ مصرف ISR بیشتر." },
  a1_priority_focus: { title: "تمرکز اولیه بر کاروان پزشکی", description: "پایش اولیه را روی کریدور شرقی و محموله اولویت‌دار متمرکز کنید.", knownEffect: "تمرکز بالا روی کاروان الف؛ پوشش کمتر برای سایر کریدورها." },
  a1_rotating_watch: { title: "پایش چرخشی شبکه", description: "گزارش‌های میدانی و رادیویی را به‌صورت چرخشی میان کریدورها مقایسه کنید.", knownEffect: "پوشش چندمحوره با شدت متوسط." },
  a1_preserve_reserve: { title: "حفظ ذخیره پایش", description: "پایش روتین را ادامه دهید و ظرفیت ISR را برای مراحل بعد نگه دارید.", knownEffect: "مصرف فوری ناچیز؛ اطلاعات جدید محدودتر." },
  a2_focused_pnt: { title: "تحلیل هدفمند PNT", description: "ناهمخوانی‌های موقعیت را روی یک کریدور منتخب با دقت بیشتری بررسی کنید.", knownEffect: "تحلیل عمیق یک محور؛ نیازمند انتخاب کریدور." },
  a2_broad_sweep: { title: "پویش سراسری چندکریدوری", description: "الگوهای PNT کل شبکه را هم‌زمان برای یافتن ناهمخوانی‌های متقاطع بررسی کنید.", knownEffect: "پوشش وسیع؛ مصرف بالاتر ISR." },
  a2_field_radio: { title: "تطبیق گزارش میدانی و رادیویی", description: "گزارش کاروان و داده ارتباطی یک کریدور را با تصویر موقعیت مقایسه کنید.", knownEffect: "منبع مستقل از PNT؛ نیازمند انتخاب کریدور." },
  a2_ground_liaison: { title: "اعزام رابط زمینی", description: "برای بررسی محلی یک کریدور، تیم رابط زمینی اعزام کنید.", knownEffect: "شاهد زمینی با تأخیر زمانی؛ مصرف ذخیره پشتیبانی." },
  b1_suspect_focus: { title: "تمرکز روی کریدور مشکوک", description: "پایش بعدی را روی کریدوری که در حال حاضر مشکوک‌تر می‌دانید متمرکز کنید.", knownEffect: "وضوح بیشتر در یک محور؛ کاهش پوشش نسبی شبکه." },
  b1_priority_cargo: { title: "پایش ویژه محموله پزشکی", description: "ظرفیت پایش را روی کاروان الف و استمرار حرکت آن متمرکز کنید.", knownEffect: "اولویت به محموله حیاتی؛ پوشش کمتر سایر محورها." },
  b1_split_attention: { title: "تقسیم توجه بین کریدورها", description: "ظرفیت ISR را میان چند محور تقسیم کنید تا یک تصویر مقایسه‌ای حفظ شود.", knownEffect: "پوشش متوازن‌تر؛ تمرکز کمتر روی هر محور." },
  b1_pulse_network: { title: "پایش پالسی کل شبکه", description: "به‌جای رصد پیوسته، نمونه‌های کوتاه و دوره‌ای از کل شبکه بگیرید.", knownEffect: "حفظ بخشی از ذخیره همراه با دید شبکه‌ای." },
  b2_continue_crosscheck: { title: "ادامه مسیر با تطبیق و ناوبری پشتیبان", description: "حرکت کریدور منتخب را ادامه دهید و موقعیت را با روش پشتیبان کنترل کنید.", knownEffect: "فعال‌سازی ناوبری پشتیبان؛ تأخیر مستقیم محدود." },
  b2_reroute: { title: "تغییر مسیر اضطراری", description: "کریدور منتخب را از مسیر فعلی خارج و روی مسیر جایگزین هدایت کنید.", knownEffect: "کاهش وابستگی به مسیر فعلی؛ افزایش محسوس تأخیر." },
  b2_staged_checkpoints: { title: "حرکت مرحله‌ای با نقاط کنترل", description: "حرکت را به چند قطعه کنترل‌شده با نقاط بررسی موقعیت تقسیم کنید.", knownEffect: "کنترل بیشتر مسیر؛ افزایش تأخیر عملیاتی." },
  b2_hold_verify: { title: "توقف موقت برای راستی‌آزمایی", description: "کریدور منتخب را موقتاً نگه دارید تا بررسی هدفمند تکمیل شود.", knownEffect: "اطلاعات بیشتر در برابر بیشترین تأخیر مستقیم این راند." },
  c1_fallback_nav: { title: "فعال‌سازی ناوبری پشتیبان", description: "برای کریدور منتخب، اتکا به GNSS را با روش ناوبری جایگزین کاهش دهید.", knownEffect: "تاب‌آوری ناوبری بیشتر؛ مصرف ذخیره پشتیبانی." },
  c1_ground_recon: { title: "شناسایی و پشتیبانی زمینی", description: "تیم زمینی را برای بررسی مسیر و پشتیبانی محلی اعزام کنید.", knownEffect: "پشتیبانی زمینی پایدارتر؛ شاهد زمینی با تأخیر." },
  c1_checkpoint_spacing: { title: "نقاط کنترل و فاصله‌گذاری حرکت", description: "عبور کریدور منتخب را با فاصله‌گذاری و نقاط کنترل سازمان‌دهی کنید.", knownEffect: "سخت‌سازی مسیر در برابر اختلال؛ تأخیر متوسط." },
  c1_preserve_mobile_reserve: { title: "حفظ ذخیره متحرک", description: "از مصرف پشتیبانی جدید خودداری کنید و ذخیره را برای بحران بعدی نگه دارید.", knownEffect: "حفظ حداکثری ذخیره؛ بدون پوشش جدید فوری." },
  c2_isr_heavy: { title: "سبد اطلاعات‌محور", description: "بخش بیشتری از منابع باقی‌مانده را صرف پایش و شناخت شبکه کنید.", knownEffect: "اطلاعات شبکه‌ای بیشتر؛ پشتیبانی فیزیکی محدودتر." },
  c2_mobility_heavy: { title: "سبد تاب‌آوری حرکتی", description: "منابع را عمدتاً به تحرک، fallback و پشتیبانی شبکه اختصاص دهید.", knownEffect: "پوشش حفاظتی قوی‌تر برای کل شبکه تا پایان راند ۷." },
  c2_balanced: { title: "سبد متوازن شبکه", description: "ISR و پشتیبانی را بدون تمرکز شدید روی یک حوزه تقسیم کنید.", knownEffect: "پوشش حفاظتی متوسط برای کل شبکه تا پایان راند ۷." },
  c2_priority_surge: { title: "تمرکز منابع بر کاروان الف", description: "منابع مرحله را برای حفاظت و پایش محموله پزشکی متمرکز کنید.", knownEffect: "حفاظت قوی‌تر کاروان الف؛ کاهش نسبی پوشش سایر کریدورها." },
  d1_emergency_reroute: { title: "تغییر مسیر فوری", description: "کریدور منتخب را برای خروج سریع از وضعیت فعلی به مسیر جایگزین منتقل کنید.", knownEffect: "سخت‌سازی مسیر در برابر فشار؛ تأخیر قابل توجه." },
  d1_ground_containment: { title: "مهار زمینی منبع اختلال", description: "تیم زمینی را برای شناسایی و مهار محلی منبع اختلال احتمالی وارد عمل کنید.", knownEffect: "اقدام آشکار و پرمنبع؛ شاهد زمینی با تأخیر." },
  d1_deception_routing: { title: "مسیرگذاری فریبنده", description: "الگوی حرکت کریدور منتخب را طوری تغییر دهید که برداشت طرف ناظر از مسیر دشوارتر شود.", knownEffect: "تغییر مسیر قابل مشاهده با تأخیر متوسط." },
  d1_escorted_continuation: { title: "ادامه حرکت با اسکورت", description: "حرکت کریدور منتخب را با پشتیبانی نزدیک تا پایان راند ادامه دهید.", knownEffect: "حفاظت مستقیم موقت؛ مصرف قابل توجه پشتیبانی." },
  d1_hold_confirm: { title: "توقف و تأیید نهایی", description: "کریدور منتخب را موقتاً متوقف کنید و پیش از ادامه، تحلیل هدفمند دیگری انجام دهید.", knownEffect: "اطمینان اطلاعاتی بیشتر در برابر تأخیر عملیاتی." },
  d2_critical_delivery_surge: { title: "شتاب تحویل محموله حیاتی", description: "ظرفیت پشتیبانی نهایی را برای رساندن کاروان الف به مقصد متمرکز کنید.", knownEffect: "کاهش تأخیر کاروان الف و اسکورت نهایی؛ تمرکز بالا روی محموله اولویت‌دار." },
  d2_network_balanced_finish: { title: "پایان متوازن شبکه", description: "منابع نهایی را برای حفظ حرکت و حفاظت همه کریدورهای فعال تقسیم کنید.", knownEffect: "کاهش محدود تأخیر کل شبکه و حفاظت موقت همگانی." },
  d2_resilient_handoff: { title: "تحویل تاب‌آور با ناوبری پشتیبان", description: "تحویل نهایی کاروان الف را با fallback ناوبری و handoff کنترل‌شده انجام دهید.", knownEffect: "تاب‌آوری بیشتر تحویل در برابر مقداری تأخیر اضافی." },
  d2_continuity_first_finish: { title: "پایان با اولویت تداوم شبکه", description: "در پایان، سرعت نسبی کاروان‌های دیگر را بر تمرکز کامل روی الف مقدم کنید.", knownEffect: "کاهش تأخیر کاروان‌های ثانویه در برابر تأخیر بیشتر کاروان الف." },
};

export const SCENARIO5_REASON_LABELS_FA: Readonly<Record<ReasonId, string>> = {
  reason_mission_speed: "حفظ سرعت و پیشروی مأموریت",
  reason_reduce_exposure: "کاهش مواجهه با اختلال یا تهدید",
  reason_preserve_resources: "حفظ منابع برای مراحل بعد",
  reason_network_continuity: "حفظ تداوم کل شبکه لجستیکی",
  reason_information_confidence: "افزایش اطمینان اطلاعاتی پیش از ادامه",
  reason_limit_actor_reaction: "محدودکردن امکان واکنش شدیدتر طرف مقابل",
  reason_preserve_reversibility: "حفظ گزینه‌های برگشت‌پذیر برای تصمیم‌های بعد",
};

export const SCENARIO5_END_STATE_LABELS_FA: Readonly<Record<Scenario5EndStateId, string>> = {
  critical_cargo_lost_or_compromised: "از دست رفتن یا آسیب جدی محموله حیاتی",
  priority_delivered_network_degradation: "تحویل محموله اولویت‌دار با افت تداوم عملیاتی شبکه",
  mission_incomplete_continuity_preserved: "تداوم شبکه حفظ شد، اما تحویل اولویت‌دار تکمیل نشد",
  delivery_complete_threat_persistent: "تحویل و تداوم شبکه کامل؛ تهدید مهار نشد",
  delivery_complete_attribution_unresolved: "تحویل و تداوم شبکه کامل؛ منشأ اختلال حل‌نشده",
  delivery_complete_threat_contained: "تحویل و تداوم شبکه کامل؛ تهدید مهار شد",
};

export const SCENARIO5_ACTOR_LABELS_FA: Readonly<Record<ActorProfileId, string>> = {
  cautious_denial: "اخلال محتاطانه و کم‌نمایان",
  deceptive_diversion: "انحراف و فریب چندکریدوری",
  opportunistic_interdiction: "بهره‌برداری فرصت‌طلبانه از شکاف شبکه",
  pressure_escalator: "فشار تصاعدی مشروط",
};

export const SCENARIO5_DIRECTION_LABELS_FA: Readonly<Record<EvidenceDirection, string>> = {
  supports_targeted: "با فرضیه اخلال هدفمند سازگار",
  ambiguous: "مبهم / چندتفسیره",
  supports_nonhostile: "بیشتر با علت غیرخصمانه سازگار",
};

export const SCENARIO5_STRENGTH_LABELS_FA: Readonly<Record<EvidenceStrengthBand, string>> = {
  weak: "ضعیف",
  moderate: "متوسط",
  strong: "قوی",
};

export const SCENARIO5_SOURCE_LABELS_FA: Readonly<Record<EvidenceSourceType, string>> = {
  pnt_telemetry: "تله‌متری PNT/GNSS",
  field_report: "گزارش میدانی کاروان",
  radio_timing: "تحلیل زمان‌بندی رادیویی",
  satellite_isr: "پایش ماهواره‌ای ISR",
  ground_recon: "بررسی زمینی",
  route_pattern: "تحلیل الگوی مسیر",
  cross_source_analysis: "تحلیل چندمنبعی",
};

export const SCENARIO5_STATUS_LABELS_FA: Readonly<Record<MissionConvoyStatus, string>> = {
  moving: "در حرکت",
  held: "متوقف",
  delivered: "تحویل‌شده",
  compromised: "آسیب‌دیده",
};

export const SCENARIO5_ATTRIBUTION_STATUS_LABELS_FA = {
  resolved: "حل‌شده",
  unresolved: "حل‌نشده",
} as const;

export const getScenario5OperationalAttributionLabel = (
  status: keyof typeof SCENARIO5_ATTRIBUTION_STATUS_LABELS_FA,
): string => SCENARIO5_ATTRIBUTION_STATUS_LABELS_FA[status];

export const SCENARIO5_PROVENANCE_LABELS_FA: Readonly<Record<string, string>> = {
  primary: "مرتبط با کریدور اصلی اختلال",
  decoy_linked: "مرتبط با الگوی فریب/انحراف",
  background_noise: "نویز یا عامل زمینه‌ای",
};

export const SCENARIO5_METHOD_LIMITATIONS_FA = [
  "این اجرا یکی از جهان‌های کنترل‌شده سناریو است و پیش‌بینی رخداد واقعی نیست.",
  "نتیجه مأموریت و شاخص‌های شناختی دو خروجی جدا هستند.",
  "موفقیت یا شکست مأموریت مستقیماً امتیاز شناختی تولید نمی‌کند.",
  "پروفایل‌های گزینه و مدل دلیل هنوز کدگذاری داخلی پروژه‌اند و به اعتبارسنجی خبرگان نیاز دارند.",
  "اعتبار مهندسی و بازپخش‌پذیری شبیه‌سازی به معنی اعتبار روان‌سنجی یا اعتبار انسانی نیست.",
  "تفسیر بین‌فردی یا تصمیم‌های پرمخاطره نباید بر اساس یک اجرای منفرد انجام شود.",
] as const;

export const SCENARIO5_CONSTRUCT_LABELS_FA = {
  informationSeeking: "جست‌وجوی اطلاعات",
  secondOrderThinking: "تفکر مرحله دوم",
  adversaryModeling: "مدل‌سازی طرف مقابل",
  escalationSensitivity: "حساسیت به تشدید",
  informationDiscipline: "نظم اطلاعاتی",
  evidenceResponsiveUpdating: "به‌روزرسانی متناسب با شواهد",
  resourceStewardship: "نگهداشت و تخصیص منابع",
  planningForesight: "برنامه‌ریزی و آینده‌نگری",
  multiDomainIntegration: "یکپارچه‌سازی چندمعیاره",
  riskPosture: "وضعیت نسبی پذیرش ریسک",
  decisionCoherence: "انسجام تصمیم",
} as const;
