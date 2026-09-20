import type { DecisionWindowId } from "./types";

export const COGNITIVE_MODEL_VERSION = "s4-cog-v3" as const;
export const COGNITIVE_FORMULA_VERSION = "3.0.0" as const;
export const OPTION_PROFILE_VERSION = "s4-options-v3.1-postfix" as const;
export const ANCHOR_TEST_VERSION = "s4-anchor-first-options-v1" as const;
export const EXPERT_PANEL_VERSION = "provisional-unvalidated" as const;
export const SCENARIO_CONTENT_VERSION = "s4-content-2026-09" as const;

// Snapshot of the seeded 100k-run distribution audit for this profile version.
// These are construct-level QA warnings, never player penalties.
export const CONSTRUCT_DISTRIBUTION_AUDIT_V3 = {
  sampleSize: 100_000,
  seed: "0x5a17",
  warnings: {
    integration: ["low_discrimination", "low_variance"],
    informationSeeking: ["ceiling"],
    secondOrderThinking: ["low_discrimination", "low_variance"],
    adversaryModeling: ["low_discrimination", "low_variance"],
    escalationSensitivity: ["low_variance"],
    informationDiscipline: ["low_discrimination", "low_variance"],
    resourceStewardship: ["low_discrimination", "low_variance"],
    planningForesight: ["low_discrimination", "low_variance"],
    multiDomainIntegration: ["low_discrimination", "low_variance"],
  },
  multiDomainCeilingWarning: false,
} as const;

export type CoreDecisionWindowV3 = Exclude<DecisionWindowId, "m1_reason" | "m2_reason" | "m3_offramp" | "m3_reason">;

export interface CognitiveOptionProfileV3 {
  optionId: string;
  optionLabelFa: string;
  windowId: CoreDecisionWindowV3;
  version: "v3";
  operationalLoading: number;
  strategicLoading: number;
  informationSeeking: number;
  futureConsequenceThinking: number;
  adversaryModeling: number;
  escalationSensitivity: number;
  coalitionOrientation: number;
  reversibilityPreference: number;
  resourceStewardship: number;
  contingencyPlanning: number;
  informationDisciplineBase: number;
  riskExposure: number;
  domainMission: number;
  domainInformation: number;
  domainEscalation: number;
  domainCoalition: number;
  domainResources: number;
  domainLegitimacy: number;
  domainFutureOptions: number;
  claimIntensity?: number;
  disclosureIntensity?: number;
  diagnosticity: {
    osi: number;
    informationSeeking: number;
    secondOrder: number;
    adversaryModeling: number;
    escalationSensitivity: number;
    coalitionOrientation: number;
    reversibility: number;
    resourceStewardship: number;
    planning: number;
    multiDomain: number;
    riskPosture: number;
  };
}

type BehavioralVector = [number, number, number, number, number, number, number, number, number, number];
type ProfileSeed = [string, string, number, number, BehavioralVector, number?, number?];

export const CORE_WINDOW_WEIGHTS: Record<CoreDecisionWindowV3, number> = {
  m1_information: .85,
  m1_protection: 1,
  m1_communication: 1,
  m2_investigation: .90,
  m2_mission: 1,
  m2_response: 1.10,
  m3_threshold: .55,
  m3_coa: 1.20,
  m3_info: 1.10,
};

export const CORE_WINDOWS_BY_MOVE = {
  move_1: ["m1_information", "m1_protection", "m1_communication"],
  move_2: ["m2_investigation", "m2_mission", "m2_response"],
  move_3: ["m3_threshold", "m3_coa", "m3_info"],
} as const satisfies Record<"move_1" | "move_2" | "move_3", readonly CoreDecisionWindowV3[]>;

const domainByWindow: Record<CoreDecisionWindowV3, [number, number, number, number, number, number, number]> = {
  m1_information: [.25, 1, .35, .45, .45, .25, .55],
  m1_protection: [1, .25, .65, .20, .70, .30, .65],
  m1_communication: [.25, .55, .85, .80, .25, .80, .70],
  m2_investigation: [.35, 1, .35, .50, .55, .35, .60],
  m2_mission: [1, .30, .45, .30, .85, .30, .80],
  m2_response: [.45, .55, .95, .80, .45, .85, .75],
  m3_threshold: [.45, .80, .75, .35, .30, .90, .65],
  m3_coa: [.85, .65, .90, .80, .75, .80, .90],
  m3_info: [.35, .90, .75, .80, .65, 1, .70],
};

// Option-specific scope audit: inactivity and narrow actions must not receive
// broad domain coverage merely because their decision window is broad.
const domainOverrides: Partial<Record<string, [number, number, number, number, number, number, number]>> = {
  m1_i_passive: [.40, .25, 0, 0, .65, 0, .35],
  m1_i_dedicated_ssa: [.35, .90, 0, 0, .65, 0, .45],
  m1_i_commercial: [.30, .90, 0, 0, .55, .45, .45],
  m1_i_allied_network: [0, .85, 0, .85, .45, .45, .50],
  m1_p_hold: [.45, 0, .20, 0, .70, 0, .45],
  m1_p_covert_readiness: [.85, 0, .55, 0, .65, 0, .55],
  m1_p_visible_protection: [.90, 0, .75, 0, .65, .45, .45],
  m1_p_mission_reposition: [.90, 0, .65, 0, .80, 0, .55],
  m1_c_none: [0, 0, .35, 0, .70, .20, .40],
  m1_c_private: [0, .30, .90, 0, 0, .70, .65],
  m1_c_allies: [0, .35, .65, .95, .30, .75, .65],
  m1_c_public_warning: [0, .35, .85, 0, .30, .80, .45],
  m1_c_private_allied: [0, .45, .90, .90, .35, .80, .70],
  m2_a_technical_diagnostics: [.35, .90, 0, 0, .50, .25, .40],
  m2_a_second_sensor: [.30, .95, 0, 0, .70, 0, .50],
  m2_a_ally_intel: [0, .90, 0, .90, .45, .50, .55],
  m2_a_commercial_validation: [.20, .90, 0, 0, .50, .55, .50],
  m2_a_act_with_current_data: [.45, .15, .35, 0, .70, .30, .30],
  m2_m_continue_normal: [.80, 0, .25, 0, .65, 0, .40],
  m2_m_activate_fallback: [.90, 0, .65, 0, .75, 0, .75],
  m2_m_reduce_load: [.85, 0, .65, 0, .75, 0, .70],
  m2_m_protective_reconfiguration: [.90, 0, .70, 0, .75, 0, .55],
  m2_m_split_service: [.90, .25, .60, 0, .80, 0, .80],
  m2_r_no_counteraction: [0, 0, .65, 0, .60, .50, .55],
  m2_r_request_explanation: [0, .35, .85, 0, .25, .75, .65],
  m2_r_private_warning: [0, .25, .85, 0, .35, .65, .55],
  m2_r_joint_allied_response: [.30, .40, .80, .95, .40, .85, .70],
  m2_r_request_defensive_authority: [.75, .20, .75, .25, .70, .75, .65],
  m2_r_deconfliction_offer: [0, .30, .95, .50, .25, .85, .80],
  m3_t_insufficient: [0, .90, .45, 0, 0, .80, .65],
  m3_t_sufficient_limited: [.25, .85, .65, 0, 0, .80, .70],
  m3_t_sufficient_strong: [.40, .75, .75, 0, 0, .70, .60],
  m3_coa_contain_understand: [.80, .85, .80, .25, .60, .70, .85],
  m3_coa_controlled_deterrence: [.90, 0, .85, 0, .70, .75, .75],
  m3_coa_coordinated_response: [.90, .65, .85, .95, .70, .90, .85],
  m3_coa_negotiated_deescalation: [.35, 0, .95, .75, .35, .90, .90],
  m3_coa_unilateral_strong: [.90, 0, .90, 0, .80, .55, .40],
  m3_info_keep_restricted: [0, .55, 0, 0, .65, .55, .60],
  m3_info_share_allies: [0, .80, 0, .90, .55, .75, .70],
  m3_info_public_partial: [0, .85, .65, .45, .60, .85, 0],
  m3_info_public_attribution: [0, .90, .85, .35, .70, .90, 0],
};

// PROVISIONAL — requires SME validation. Each row explicitly codes the ten
// behavioral loadings in this order: information, future consequences,
// adversary modeling, escalation sensitivity, coalition, reversibility,
// resource stewardship, contingency planning, information discipline, risk.
const seeds: Record<CoreDecisionWindowV3, ProfileSeed[]> = {
  m1_information: [
    ["m1_i_passive", "ادامه پایش موجود", .45, .20, [.20,.25,.25,.45,.20,.55,.60,.10,.65,.25]],
    ["m1_i_dedicated_ssa", "افزایش SSA اختصاصی", .60, .55, [.90,.60,.55,.55,.20,.55,.45,.60,.75,.45]],
    ["m1_i_commercial", "دریافت داده تجاری مستقل", .40, .70, [.85,.70,.55,.50,.35,.70,.65,.65,.80,.35]],
    ["m1_i_allied_network", "درخواست شبکه متحدان", .30, .85, [.90,.80,.65,.65,.95,.65,.40,.75,.75,.40]],
  ],
  m1_protection: [
    ["m1_p_hold", "بدون تغییر", .35, .35, [.25,.25,.35,.55,.25,.75,.60,.15,.70,.20]],
    ["m1_p_covert_readiness", "افزایش آمادگی پنهان", .75, .60, [.30,.70,.60,.65,.25,.80,.60,.85,.85,.40]],
    ["m1_p_visible_protection", "اقدام حفاظتی آشکار اما برگشت‌پذیر", .90, .40, [.25,.55,.70,.45,.20,.65,.45,.65,.65,.65]],
    ["m1_p_mission_reposition", "تغییر محسوس وضعیت مأموریت", .95, .25, [.20,.45,.55,.30,.15,.25,.25,.50,.55,.90]],
  ],
  m1_communication: [
    ["m1_c_none", "عدم ارسال پیام", .35, .30, [.20,.25,.30,.40,.15,.55,.60,.10,.70,.25], .05, .05],
    ["m1_c_private", "تماس خصوصی برای Deconfliction", .35, .80, [.45,.75,.85,.90,.25,.85,.65,.70,.90,.25], .25, .15],
    ["m1_c_allies", "هماهنگی با متحدان", .30, .90, [.55,.80,.70,.75,1,.70,.45,.75,.80,.35], .30, .55],
    ["m1_c_public_warning", "هشدار عمومی درباره رفتار ناایمن", .50, .75, [.35,.60,.75,.35,.35,.35,.45,.55,.45,.70], .55, .50],
    ["m1_c_private_allied", "پیام خصوصی + هماهنگی محدود متحدان", .35, .95, [.60,.90,.90,.90,.90,.85,.45,.85,.90,.30], .30, .40],
  ],
  m2_investigation: [
    ["m2_a_technical_diagnostics", "تمرکز بر بررسی فنی داخلی", .65, .55, [.85,.60,.45,.55,.20,.60,.70,.70,.90,.30]],
    ["m2_a_second_sensor", "فعال‌سازی منبع رصد دوم", .65, .65, [.95,.75,.60,.60,.25,.65,.35,.80,.90,.40]],
    ["m2_a_ally_intel", "درخواست داده تکمیلی متحد", .35, .90, [.90,.80,.65,.65,.95,.70,.45,.80,.85,.35]],
    ["m2_a_commercial_validation", "اعتبارسنجی تجاری مستقل", .45, .75, [.90,.75,.55,.60,.35,.75,.65,.75,.85,.35]],
    ["m2_a_act_with_current_data", "عدم صرف زمان بیشتر برای بررسی", .85, .20, [.10,.25,.35,.30,.15,.35,.90,.20,.35,.80]],
  ],
  m2_mission: [
    ["m2_m_continue_normal", "ادامه مأموریت بدون تغییر", .90, .20, [.20,.20,.30,.30,.20,.35,.55,.10,.65,.65]],
    ["m2_m_activate_fallback", "فعال‌سازی ظرفیت جایگزین", .75, .75, [.30,.85,.45,.65,.25,.80,.55,.95,.80,.35]],
    ["m2_m_reduce_load", "کاهش موقت بار مأموریت", .65, .65, [.25,.75,.40,.70,.20,.85,.80,.75,.85,.20]],
    ["m2_m_protective_reconfiguration", "بازآرایی حفاظتی", .85, .50, [.25,.65,.55,.50,.20,.65,.55,.75,.70,.55]],
    ["m2_m_split_service", "تقسیم مأموریت میان A-17 و ظرفیت پشتیبان", .75, .85, [.35,.90,.50,.70,.30,.80,.40,.95,.80,.40]],
  ],
  m2_response: [
    ["m2_r_no_counteraction", "فعلاً اقدام متقابل انجام نشود", .30, .50, [.35,.35,.55,.80,.25,.80,.60,.15,.85,.15], .05, .05],
    ["m2_r_request_explanation", "درخواست توضیح رسمی", .35, .75, [.50,.70,.80,.85,.35,.80,.70,.65,.90,.25], .25, .15],
    ["m2_r_private_warning", "هشدار خصوصی کنترل‌شده", .55, .75, [.35,.65,.85,.65,.25,.65,.60,.65,.75,.55], .50, .15],
    ["m2_r_joint_allied_response", "پاسخ هماهنگ با متحدان", .45, .90, [.55,.85,.80,.70,1,.65,.35,.85,.80,.50], .50, .55],
    ["m2_r_request_defensive_authority", "درخواست مجوز برای اقدام دفاعی برگشت‌پذیر", .80, .65, [.30,.70,.70,.55,.35,.75,.45,.85,.70,.65], .55, .20],
    ["m2_r_deconfliction_offer", "پیشنهاد فاصله‌گذاری و Deconfliction متقابل", .35, .95, [.45,.90,.90,.95,.50,.90,.55,.85,.90,.20], .20, .15],
  ],
  m3_threshold: [
    ["m3_t_insufficient", "برای انتساب راهبردی هنوز کافی نیست", .25, .60, [.65,.50,.65,.80,.30,.80,.65,.20,.95,.15], .10, .05],
    ["m3_t_sufficient_limited", "برای اقدام محدود و برگشت‌پذیر کافی است", .50, .60, [.55,.70,.65,.65,.30,.85,.75,.70,.80,.45], .45, .10],
    ["m3_t_sufficient_strong", "برای اقدام قاطع‌تر کافی است", .65, .50, [.40,.55,.65,.40,.25,.35,.70,.55,.55,.80], .80, .15],
  ],
  m3_coa: [
    ["m3_coa_contain_understand", "مهار و شناخت", .45, .80, [.85,.90,.75,.90,.40,.90,.65,.70,.90,.25]],
    ["m3_coa_controlled_deterrence", "بازدارندگی کنترل‌شده", .80, .80, [.50,.80,.90,.65,.35,.70,.45,.85,.75,.60]],
    ["m3_coa_coordinated_response", "پاسخ هماهنگ ائتلافی", .55, .95, [.65,.90,.85,.75,1,.70,.30,.90,.80,.50]],
    ["m3_coa_negotiated_deescalation", "کاهش تنش مذاکره‌شده", .35, .95, [.55,.95,.95,.98,.65,.90,.55,.90,.90,.20]],
    ["m3_coa_unilateral_strong", "اقدام یک‌جانبه شدیدتر در سطح حفاظتی/سیاسی", .85, .70, [.30,.65,.75,.25,.10,.30,.25,.65,.45,.95]],
  ],
  m3_info: [
    ["m3_info_keep_restricted", "محرمانه باقی بماند", .40, .60, [.35,.45,.55,.70,.20,.85,.65,.20,.95,.15], .05, .05],
    ["m3_info_share_allies", "اشتراک محدود با متحدان", .35, .90, [.60,.85,.70,.75,1,.75,.55,.80,.90,.30], .30, .45],
    ["m3_info_public_partial", "انتشار عمومی بخشی از شواهد", .45, .85, [.45,.75,.75,.55,.45,.60,.40,.70,.70,.55], .60, .65],
    ["m3_info_public_attribution", "انتساب عمومی به اسرائیل", .55, .80, [.35,.70,.80,.35,.35,.35,.25,.65,.45,.90], .95, .90],
  ],
};

const makeProfile = (windowId: CoreDecisionWindowV3, seed: ProfileSeed): CognitiveOptionProfileV3 => {
  const [optionId, optionLabelFa, operationalLoading, strategicLoading, b, claimIntensity, disclosureIntensity] = seed;
  const [domainMission, domainInformation, domainEscalation, domainCoalition, domainResources, domainLegitimacy, domainFutureOptions] = domainOverrides[optionId] ?? domainByWindow[windowId];
  const diagnosticity = {
    osi: CORE_WINDOW_WEIGHTS[windowId],
    informationSeeking: windowId === "m1_information" || windowId === "m2_investigation" ? 1 : .25,
    secondOrder: 1,
    adversaryModeling: windowId.includes("communication") || windowId.includes("response") || windowId === "m3_coa" ? 1 : .55,
    escalationSensitivity: windowId === "m1_communication" || windowId === "m2_response" || windowId === "m3_coa" ? 1 : .55,
    coalitionOrientation: windowId === "m1_communication" || windowId === "m2_response" || windowId === "m3_coa" || windowId === "m3_info" ? 1 : .35,
    reversibility: 1,
    resourceStewardship: 1,
    planning: 1,
    multiDomain: 1,
    riskPosture: 1,
  };
  return {
    optionId, optionLabelFa, windowId, version: "v3", operationalLoading, strategicLoading,
    informationSeeking: b[0], futureConsequenceThinking: b[1], adversaryModeling: b[2],
    escalationSensitivity: b[3], coalitionOrientation: b[4], reversibilityPreference: b[5],
    resourceStewardship: b[6], contingencyPlanning: b[7], informationDisciplineBase: b[8], riskExposure: b[9],
    domainMission, domainInformation, domainEscalation, domainCoalition, domainResources, domainLegitimacy, domainFutureOptions,
    claimIntensity, disclosureIntensity, diagnosticity,
  };
};

export const COGNITIVE_OPTION_PROFILES_V3 = Object.fromEntries(
  (Object.entries(seeds) as Array<[CoreDecisionWindowV3, ProfileSeed[]]>).flatMap(([windowId, rows]) => rows.map((row) => {
    const profile = makeProfile(windowId, row);
    return [profile.optionId, profile];
  }))
) as Record<string, CognitiveOptionProfileV3>;

export const COGNITIVE_WINDOWS_V3 = Object.fromEntries(
  (Object.entries(seeds) as Array<[CoreDecisionWindowV3, ProfileSeed[]]>).map(([windowId, rows]) => [windowId, rows.map(([id]) => id)])
) as Record<CoreDecisionWindowV3, string[]>;

export const validateCognitiveProfilesV3 = () => {
  const errors: string[] = [];
  for (const [windowId, optionIds] of Object.entries(COGNITIVE_WINDOWS_V3)) {
    for (const optionId of optionIds) {
      const profile = COGNITIVE_OPTION_PROFILES_V3[optionId];
      if (!profile || profile.windowId !== windowId) {
        errors.push(`${windowId}/${optionId}: missing or mismatched profile`);
        continue;
      }
      const values = Object.entries(profile).filter(([, value]) => typeof value === "number") as Array<[string, number]>;
      for (const [key, value] of values) if (value < 0 || value > 1) errors.push(`${optionId}.${key}=${value}`);
      for (const [key, value] of Object.entries(profile.diagnosticity)) if (value < 0 || value > 1.2) errors.push(`${optionId}.diagnosticity.${key}=${value}`);
    }
  }
  if (errors.length && import.meta.env?.DEV) throw new Error(`Invalid V3 cognitive profiles:\n${errors.join("\n")}`);
  return errors;
};

validateCognitiveProfilesV3();

export const REASON_DIMENSION_V3: Record<string, keyof CognitiveOptionProfileV3> = {
  "کسب اطلاعات بیشتر": "informationSeeking", "افزایش اطمینان درباره علت حادثه": "informationSeeking",
  "حفاظت از A-17": "contingencyPlanning", "حفظ مأموریت": "contingencyPlanning", "حفظ تداوم مأموریت": "contingencyPlanning",
  "جلوگیری از تشدید": "escalationSensitivity", "ایجاد مسیر کاهش تنش": "escalationSensitivity", "ایجاد مسیر خروج از بحران": "escalationSensitivity",
  "نمایش عزم": "riskExposure", "بازدارندگی": "adversaryModeling", "حفظ هماهنگی متحدان": "coalitionOrientation",
  "حفظ ائتلاف": "coalitionOrientation", "انسجام ائتلاف": "coalitionOrientation", "حفظ منابع": "resourceStewardship",
  "صرفه‌جویی در منابع": "resourceStewardship", "حفظ منابع و قابلیت‌های آینده": "resourceStewardship",
  "سطح اطمینان انتساب": "informationDisciplineBase", "مشروعیت سیاسی/حقوقی": "informationDisciplineBase",
};

export const REASON_ALIGNMENT_MATRIX_V3: Record<string, Record<string, number>> = Object.fromEntries(
  Object.entries(REASON_DIMENSION_V3).map(([reason, dimension]) => [reason, Object.fromEntries(
    Object.values(COGNITIVE_OPTION_PROFILES_V3).map((profile) => [profile.optionId, Number(profile[dimension])])
  )])
);

export const MOVE3_CROSS_COHERENCE_V3 = {
  defaultScore: .80,
  rules: [
    { threshold: "m3_t_insufficient", informationPolicy: "m3_info_public_attribution", score: .15 },
    { threshold: "m3_t_sufficient_strong", coa: "m3_coa_contain_understand", score: .45 },
    { coa: "m3_coa_negotiated_deescalation", informationPolicy: "m3_info_public_attribution", score: .35 },
  ],
} as const;
