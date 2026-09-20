import { clampScenarioOneState, cloneState } from "./initialState.ts";
import type {
  AllyAction,
  AllyMove2Action,
  CommercialAction,
  CommercialMove2Action,
  RedMove1Action,
  RedMove2Action,
  ResourceEvent,
  ResourceKey,
  ScenarioOneState,
} from "./types";

export interface ResourceAuditEntry {
  decisionId: string;
  optionId: string;
  deltas: Partial<Record<ResourceKey, number>>;
  stateEffects: string;
  opportunityCost: string;
  rationale: string;
}

const audit = (
  decisionId: string,
  optionId: string,
  deltas: Partial<Record<ResourceKey, number>>,
  stateEffects: string,
  opportunityCost: string,
  rationale: string
): ResourceAuditEntry => ({ decisionId, optionId, deltas, stateEffects, opportunityCost, rationale });

export const resourceConsequenceAudit: ResourceAuditEntry[] = [
  audit("m1_information", "m1_i_passive", {}, "ادامه پایش پایه و افزایش محدود شناخت", "از دست رفتن بخشی از فرصت کاهش ابهام", "پایش موجود تخصیص تازه‌ای نیاز ندارد."),
  audit("m1_information", "m1_i_dedicated_ssa", { ssaCapacity: -18 }, "افزایش شناخت و ایجاد ردپای محدود", "اشغال ظرفیت رصدی در ادامه مرحله", "پایش اختصاصی حسگر و تحلیل را به R-31 متعهد می‌کند."),
  audit("m1_information", "m1_i_commercial", { ssaCapacity: -8, politicalCapital: -2 }, "داده مستقل و اعتماد تجاری", "وابستگی به دسترسی بیرونی", "اعتبارسنجی و هماهنگی تجاری ظرفیت تحلیل و هماهنگی مصرف می‌کند."),
  audit("m1_information", "m1_i_allied_network", { politicalCapital: -8, disclosureBudget: -6 }, "شناخت و اعتماد ائتلافی بیشتر", "افشای محدود منابع و روش‌ها", "درخواست متحد به سرمایه سیاسی و اشتراک امن داده نیاز دارد."),
  audit("m1_protection", "m1_p_hold", {}, "حفظ مأموریت پایه", "پذیرش ریسک وضعیت موجود", "عدم تغییر وضعیت حفاظتی ظرفیت تازه مصرف نمی‌کند."),
  audit("m1_protection", "m1_p_covert_readiness", { protectiveCapacity: -10 }, "آمادگی بیشتر با مشاهده‌پذیری کم", "بخشی از ذخیره حفاظتی در حالت آماده می‌ماند", "آمادگی ویژه نیروی حفاظتی را متعهد می‌کند."),
  audit("m1_protection", "m1_p_visible_protection", { protectiveCapacity: -18 }, "آمادگی آشکار و فشار تشدید بیشتر", "ارسال سیگنال قابل مشاهده به اسرائیل", "حفاظت آشکار به بازآرایی و آماده‌سازی عملیاتی نیاز دارد."),
  audit("m1_protection", "m1_p_mission_reposition", { protectiveCapacity: -28 }, "فاصله‌گذاری همراه افت موقت مأموریت", "کاهش برگشت‌پذیری و آشکارشدن اولویت‌ها", "تغییر محسوس وضعیت، بیشترین ظرفیت حفاظتی مرحله را مصرف می‌کند."),
  audit("m1_communication", "m1_c_none", {}, "بدون پیام مستقیم", "از دست رفتن فرصت روشن‌سازی نیت", "عدم ارسال پیام سرمایه سیاسی یا افشا مصرف نمی‌کند."),
  audit("m1_communication", "m1_c_private", { politicalCapital: -5 }, "کاهش تنش و ایجاد کانال خصوصی", "صرف اعتبار سازمانی برای تماس", "تماس رسمی خصوصی نیازمند سرمایه سیاسی است."),
  audit("m1_communication", "m1_c_allies", { politicalCapital: -10, disclosureBudget: -8 }, "انسجام ائتلاف و مشروعیت بیشتر", "اشتراک داده و تعهد سیاسی", "هماهنگی ائتلافی هم حمایت و هم اطلاعات امن مصرف می‌کند."),
  audit("m1_communication", "m1_c_public_warning", { politicalCapital: -6 }, "فشار عمومی و افزایش مشاهده‌پذیری", "ریسک تشدید و هزینه ادعای زودهنگام", "هشدار عمومی از اعتبار سیاسی استفاده می‌کند."),
  audit("m1_communication", "m1_c_private_allied", { politicalCapital: -12, disclosureBudget: -5 }, "کانال خصوصی و هماهنگی محدود", "هماهنگی چندطرفه پرهزینه", "ترکیب تماس و ائتلاف بیشترین هماهنگی سیاسی را می‌طلبد."),

  audit("m2_investigation", "m2_a_technical_diagnostics", { ssaCapacity: -4 }, "بررسی نقص داخلی و افزایش شناخت", "زمان فنی و افت محدود مأموریت", "هم‌بستگی فنی مقدار محدودی ظرفیت تحلیل مصرف می‌کند."),
  audit("m2_investigation", "m2_a_second_sensor", { ssaCapacity: -20 }, "اعتبارسنجی سریع چندمنبعی", "اشغال سنگین ظرفیت رصد", "منبع دوم یک task مستقل و پرمصرف است."),
  audit("m2_investigation", "m2_a_ally_intel", { politicalCapital: -8, disclosureBudget: -5 }, "داده مستقل و همکاری متحد", "افشای محدود و وابستگی ائتلافی", "درخواست داده متحد به اعتبار و اشتراک امن نیاز دارد."),
  audit("m2_investigation", "m2_a_commercial_validation", { politicalCapital: -3, ssaCapacity: -6 }, "مقایسه تجاری مستقل", "احتمال تأخیر یا محدودیت دسترسی", "هماهنگی و پردازش داده تجاری منابع تحلیل و سیاسی مصرف می‌کند."),
  audit("m2_investigation", "m2_a_act_with_current_data", {}, "حفظ سرعت مأموریت", "ابهام حل‌نشده و ریسک خطای انتساب", "صرف‌نظر از بررسی تازه منبع مستقیم مصرف نمی‌کند."),
  audit("m2_mission", "m2_m_continue_normal", {}, "حفظ خروجی جاری", "ادامه وابستگی به A-17", "ادامه حالت پایه تخصیص حفاظتی جدید ندارد."),
  audit("m2_mission", "m2_m_activate_fallback", { protectiveCapacity: -18 }, "افزایش تاب‌آوری و تداوم", "تعهد ظرفیت پشتیبان", "فعال‌سازی fallback ذخیره حفاظتی را به سرویس جایگزین اختصاص می‌دهد."),
  audit("m2_mission", "m2_m_reduce_load", { protectiveCapacity: -5 }, "کاهش بار و افزایش آمادگی", "افت موقت تداوم مأموریت", "کاهش کنترل‌شده بار به بازتنظیم محدود نیاز دارد."),
  audit("m2_mission", "m2_m_protective_reconfiguration", { protectiveCapacity: -14 }, "آمادگی و حفاظت بیشتر", "افشای آرایش و فشار محدود", "بازآرایی حفاظتی بخشی از ذخیره را متعهد می‌کند."),
  audit("m2_mission", "m2_m_split_service", { protectiveCapacity: -24 }, "تاب‌آوری بالاتر با تقسیم سرویس", "مصرف گسترده ظرفیت پشتیبان", "تقسیم مأموریت پرهزینه‌ترین گزینه تاب‌آوری این مرحله است."),
  audit("m2_response", "m2_r_no_counteraction", {}, "کاهش محدود فشار و حفظ مشروعیت", "فرصت محدود اثرگذاری بر اسرائیل", "عدم اقدام متقابل منبع مستقیم مصرف نمی‌کند."),
  audit("m2_response", "m2_r_request_explanation", { politicalCapital: -5 }, "مشروعیت و کانال توضیح", "صرف اعتبار برای درخواست رسمی", "درخواست رسمی به هماهنگی سیاسی نیاز دارد."),
  audit("m2_response", "m2_r_private_warning", { politicalCapital: -7 }, "ارسال عزم کنترل‌شده", "افزایش محدود مشاهده‌پذیری", "هشدار خصوصی سطح بالاتری از اعتبار سیاسی مصرف می‌کند."),
  audit("m2_response", "m2_r_joint_allied_response", { politicalCapital: -14, disclosureBudget: -8 }, "پاسخ ائتلافی و مشروعیت", "هزینه هماهنگی و افشای چندطرفه", "پاسخ مشترک به تعهد سیاسی و بسته اطلاعاتی مشترک نیاز دارد."),
  audit("m2_response", "m2_r_request_defensive_authority", { politicalCapital: -10, protectiveCapacity: -4 }, "آمادگی و مجوز دفاعی", "ارسال سیگنال آمادگی", "درخواست authority و آماده‌سازی اولیه هر دو ظرفیت مصرف می‌کنند."),
  audit("m2_response", "m2_r_deconfliction_offer", { politicalCapital: -9 }, "کاهش تنش و مسیر خروج", "هزینه مذاکره و امکان برداشت ضعف", "پیشنهاد رسمی فاصله‌گذاری سرمایه سیاسی مصرف می‌کند."),

  audit("m3_threshold", "m3_t_insufficient", {}, "ثبت آستانه پایین اطمینان", "محدودشدن دامنه ادعای بعدی", "برآورد شناختی به‌تنهایی منبع مصرف نمی‌کند."),
  audit("m3_threshold", "m3_t_sufficient_limited", {}, "اجازه اقدام محدود", "پذیرش عدم قطعیت باقی‌مانده", "تعیین آستانه به‌تنهایی تخصیص عملیاتی نیست."),
  audit("m3_threshold", "m3_t_sufficient_strong", {}, "اجازه اقدام قاطع‌تر", "ریسک اقدام بر پایه شواهد ناکامل", "تعیین آستانه به‌تنهایی منبع مصرف نمی‌کند."),
  audit("m3_coa", "m3_coa_contain_understand", { ssaCapacity: -8, protectiveCapacity: -6 }, "شناخت، مهار و تداوم", "ادامه تعهد رصد و حفاظت", "مهار همراه شناخت به حسگر و حفاظت محدود نیاز دارد."),
  audit("m3_coa", "m3_coa_controlled_deterrence", { protectiveCapacity: -16, politicalCapital: -8 }, "بازدارندگی و آمادگی کنترل‌شده", "هزینه عملیاتی و پیام سیاسی", "بازدارندگی کنترل‌شده ظرفیت حفاظتی و اعتبار سیاسی را ترکیب می‌کند."),
  audit("m3_coa", "m3_coa_coordinated_response", { politicalCapital: -18, disclosureBudget: -12, protectiveCapacity: -8 }, "انسجام، مشروعیت و پاسخ مشترک", "تعهد چندمنبعی و افشای بیشتر", "پاسخ هماهنگ بیشترین هماهنگی و اشتراک را می‌طلبد."),
  audit("m3_coa", "m3_coa_negotiated_deescalation", { politicalCapital: -12 }, "کاهش تنش و سازوکار متقابل", "هزینه مذاکره و اجرای توافق", "مذاکره سطح بحران سرمایه سیاسی قابل توجه مصرف می‌کند."),
  audit("m3_coa", "m3_coa_unilateral_strong", { protectiveCapacity: -22, politicalCapital: -15 }, "عزم و آمادگی فوری", "تشدید، افشا و کاهش گزینه‌های آینده", "اقدام یک‌جانبه شدید به ظرفیت عملیاتی و سیاسی بالا نیاز دارد."),
  audit("m3_info", "m3_info_keep_restricted", {}, "کاهش ردپای اطلاعاتی", "حمایت عمومی کمتر", "حفظ محرمانگی افشای امن مصرف نمی‌کند."),
  audit("m3_info", "m3_info_share_allies", { disclosureBudget: -8 }, "اعتماد و انسجام متحدان", "اشتراک منابع و روش‌ها", "بسته محدود متحدان از ظرفیت افشای امن استفاده می‌کند."),
  audit("m3_info", "m3_info_public_partial", { disclosureBudget: -12, politicalCapital: -5 }, "مشروعیت عمومی وابسته به شواهد", "افشای عمومی و ریسک تشدید", "انتشار جزئی هم اطلاعات امن و هم اعتبار سیاسی مصرف می‌کند."),
  audit("m3_info", "m3_info_public_attribution", { disclosureBudget: -18, politicalCapital: -8 }, "انتساب عمومی و فشار بالا", "بیشترین افشا و ریسک اعتبار", "انتساب عمومی به شواهد حساس و پشتیبانی سیاسی نیاز دارد."),
  audit("m3_offramp", "accept_as_interim", {}, "کاهش فشار و افزایش مشروعیت", "پذیرش یک سازوکار موقت", "پذیرش اولیه تخصیص تازه‌ای ایجاد نمی‌کند."),
  audit("m3_offramp", "renegotiate_terms", { politicalCapital: -4 }, "کاهش نسبی فشار", "ادامه زمان و هزینه مذاکره", "مذاکره دوباره ظرفیت سیاسی محدود مصرف می‌کند."),
  audit("m3_offramp", "keep_channel_open_no_commitment", {}, "حفظ گزینه آینده", "عدم کسب کاهش تنش فوری", "باز نگه‌داشتن کانال بدون تعهد هزینه مستقیم ندارد."),
  audit("m3_offramp", "reject", {}, "نمایش عزم", "افزایش فشار و حذف مسیر برگشت", "رد پیشنهاد منبع مستقیم مصرف نمی‌کند اما پیامد وضعیت دارد."),
];

export const resourceAuditByOption = Object.fromEntries(resourceConsequenceAudit.map((entry) => [entry.optionId, entry]));

const resourceLabels: Record<ResourceKey, string> = {
  ssaCapacity: "ظرفیت SSA",
  protectiveCapacity: "ظرفیت حفاظتی",
  politicalCapital: "سرمایه سیاسی",
  disclosureBudget: "ظرفیت افشای امن",
};

export const getResourceLabel = (resource: ResourceKey) => resourceLabels[resource];

export const getResourceStatusLabel = (value: number) => {
  if (value < 30) return "بحرانی";
  if (value < 50) return "محدود";
  if (value < 70) return "تحت فشار";
  if (value < 85) return "مناسب";
  return "فراوان";
};

export const captureDecisionResourceEvents = (
  before: ScenarioOneState["resources"],
  after: ScenarioOneState["resources"],
  optionId: string,
  moveId: ResourceEvent["moveId"]
) => {
  const entry = resourceAuditByOption[optionId];
  return (Object.keys(before) as ResourceKey[]).flatMap((resource) => {
    const delta = after[resource] - before[resource];
    if (!delta) return [];
    return [{
      id: `${moveId}:${optionId}:${resource}:${Date.now()}`,
      moveId,
      kind: "user_cost" as const,
      resource,
      source: optionId,
      sourceDecisionId: entry?.decisionId,
      rationale: entry?.rationale ?? "پیامد ثبت‌شده تصمیم",
      before: before[resource],
      delta,
      after: after[resource],
      timestamp: new Date().toISOString(),
    }];
  });
};

interface RecoveryContext {
  choices: { information?: string; protection?: string; communication?: string; investigation?: string; mission?: string; response?: string };
  redAction?: RedMove1Action | RedMove2Action;
  allyAction?: AllyAction | AllyMove2Action;
  commercialAction?: CommercialAction | CommercialMove2Action;
}

export const applyResourceRecovery = (
  state: ScenarioOneState,
  transition: "m1_to_m2" | "m2_to_m3",
  context: RecoveryContext
) => {
  const next = cloneState(state);
  const planned: Array<{ resource: ResourceKey; delta: number; source: string; rationale: string }> = [];
  if (transition === "m1_to_m2") {
    planned.push({ resource: "ssaCapacity", delta: context.choices.information === "m1_i_dedicated_ssa" ? 3 : 6, source: "پایان task مرحله ۱", rationale: context.choices.information === "m1_i_dedicated_ssa" ? "پایش اختصاصی هنوز بخشی از ظرفیت را اشغال می‌کند." : "ظرفیت taskهای کوتاه‌مدت رصد آزاد شد." });
    if (context.choices.protection === "m1_p_hold" || context.choices.protection === "m1_p_covert_readiness") planned.push({ resource: "protectiveCapacity", delta: 4, source: "تثبیت وضعیت حفاظتی", rationale: "وضعیت پایدار یا پنهان بخشی از ذخیره آماده را آزاد کرد." });
    if (context.allyAction === "public_support") planned.push({ resource: "politicalCapital", delta: 4, source: "حمایت علنی متحد", rationale: "حمایت معتبر متحد فضای مانور سیاسی را افزایش داد." });
    else if (context.allyAction === "quiet_support") planned.push({ resource: "politicalCapital", delta: 2, source: "حمایت آرام متحد", rationale: "حمایت محدود بخشی از سرمایه هماهنگی را بازسازی کرد." });
    if (context.choices.communication?.includes("private") && context.redAction === "send_routine_explanation") planned.push({ resource: "politicalCapital", delta: 2, source: "پاسخ سازنده کانال خصوصی", rationale: "تماس خصوصی نتیجه سازنده ایجاد کرد." });
    if (context.commercialAction === "offer_followup_data") planned.push({ resource: "disclosureBudget", delta: 2, source: "داده تجاری قابل‌اشتراک", rationale: "یک محصول غیرحساس تازه، ظرفیت افشای امن محدودی ایجاد کرد." });
  } else {
    planned.push({ resource: "ssaCapacity", delta: state.flags.m2IntelDelay ? 2 : 5, source: "آزادسازی تحلیل مرحله ۲", rationale: state.flags.m2IntelDelay ? "تأخیر اطلاعاتی اجازه آزادسازی کامل ظرفیت را نداد." : "taskهای اصلی تحلیل مرحله ۲ خاتمه یافتند." });
    if (context.commercialAction === "offer_followup_data" || context.allyAction === "share_partial_intel") planned.push({ resource: "ssaCapacity", delta: 3, source: "offload داده شریک", rationale: "داده آماده شریک بخشی از بار تحلیل خودی را کاهش داد." });
    if (context.redAction !== "maintain_pressure") {
      if (state.flags.m2MissionLoadReduced) planned.push({ resource: "protectiveCapacity", delta: 6, source: "کاهش بار مأموریت", rationale: "کاهش بار، ذخیره حفاظتی را برای مرحله بعد آزاد کرد." });
      else if (state.flags.m2FallbackActivated) planned.push({ resource: "protectiveCapacity", delta: 4, source: "تثبیت fallback", rationale: "ظرفیت جایگزین پایدار شد و بخشی از آمادگی آزاد شد." });
    }
    if (context.redAction === "offer_mutual_separation" && (context.allyAction === "support_joint_message" || context.allyAction === "quiet_support")) planned.push({ resource: "politicalCapital", delta: 5, source: "پیشنهاد فاصله‌گذاری و حمایت متحد", rationale: "هم‌زمانی مسیر خروج و حمایت ائتلافی فضای مانور سیاسی ساخت." });
    else if (context.choices.response === "m2_r_joint_allied_response" && state.visible.coalitionCohesion >= 50) planned.push({ resource: "politicalCapital", delta: 3, source: "پاسخ مشترک موفق", rationale: "هماهنگی پایدار بخشی از هزینه سیاسی را جبران کرد." });
    if (context.commercialAction === "offer_followup_data" || context.allyAction === "share_partial_intel") planned.push({ resource: "disclosureBudget", delta: 2, source: "شاهد تازه قابل‌انتشار", rationale: "شاهد غیرحساس تازه ظرفیت افشای امن محدودی ایجاد کرد." });
  }
  const events: ResourceEvent[] = [];
  for (const item of planned) {
    const before = next.resources[item.resource];
    next.resources[item.resource] = Math.max(0, Math.min(100, before + item.delta));
    const delta = next.resources[item.resource] - before;
    if (!delta) continue;
    events.push({ id: `${transition}:${item.resource}:${events.length}:${Date.now()}`, moveId: transition === "m1_to_m2" ? "move_1" : "move_2", kind: "transition_recovery", resource: item.resource, source: item.source, sourceActorId: "transition_engine", rationale: item.rationale, before, delta, after: next.resources[item.resource], timestamp: new Date().toISOString() });
  }
  return { state: clampScenarioOneState(next), events };
};

export const getCertainResourceCosts = (optionId: string) => {
  const entry = resourceAuditByOption[optionId];
  if (!entry) return [];
  return (Object.entries(entry.deltas) as Array<[ResourceKey, number]>).filter(([, delta]) => delta < 0).map(([resource, delta]) => ({ resource, label: resourceLabels[resource], delta }));
};
