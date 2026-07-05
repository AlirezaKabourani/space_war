import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eventLogger } from "../../../services/analytics/eventLogger";
import { Card } from "../common/Card";
import friendlySatelliteAsset from "../../../../assets/s1/A2.png";
import unknownSatelliteAsset from "../../../../assets/s1/A3.png";

type MissionStatus = {
  infoCoverage: number;
  escalationRisk: number;
  operationalReadiness: number;
  remainingResources: number;
  ambiguity: number;
  informationExposureRisk: number;
};

type SatelliteStatus = "normal" | "alert" | "tracking" | "maneuvering";

type SatelliteEntity = {
  id: string;
  label: string;
  side: "friendly" | "unknown" | "rival";
  orbitId: string;
  pathProgress: number;
  status?: SatelliteStatus;
};

type OrbitalPath = {
  id: string;
  label: string;
  radiusX: number;
  radiusY: number;
  rotation: number;
  strokeStyle?: "solid" | "dashed";
};

type GroundTarget = {
  id: string;
  label: string;
  x: number;
  y: number;
  sensitivity: "low" | "medium" | "high";
};

type SensorCone = {
  id: string;
  satelliteId: string;
  angle: number;
  width: number;
  range: number;
  active: boolean;
};

type SceneAlert = {
  id: string;
  text: string;
  level: "low" | "medium" | "high";
  targetId?: string;
};

type TimelineEvent = {
  id: string;
  text: string;
  level?: "low" | "medium" | "high" | "success" | "warning" | "critical";
};

type SceneChange =
  | { type: "move_satellite"; satelliteId: string; toPathProgress: number }
  | { type: "rotate_sensor"; sensorId: string; toAngle: number }
  | { type: "point_sensor_at"; sensorId: string; targetId: string }
  | { type: "set_sensor_profile"; sensorId: string; width?: number; range?: number }
  | { type: "expand_sensor_view"; sensorId: string; toAngle: number; rangeBoost: number; widthBoost: number }
  | { type: "highlight_target"; targetId: string; level: "low" | "medium" | "high" }
  | { type: "change_satellite_status"; satelliteId: string; status: SatelliteStatus }
  | { type: "show_signal_pulse"; fromId: string; toId: string; variant?: "normal" | "limited" | "deceptive" }
  | { type: "show_predicted_path"; satelliteId: string; orbitId: string }
  | { type: "set_alert"; level: "low" | "medium" | "high"; text: string }
  | { type: "show_information_exposure_trace"; fromId: string; toId: string; level: "low" | "medium" | "high" }
  | { type: "pulse_unknown_satellite"; level: "low" | "medium" | "high" }
  | { type: "reduce_information_trace" };

type DecisionWeights = {
  strategicWeight: number;
  escalationWeight: number;
  infoSeekingWeight: number;
  secondOrderThinkingWeight: number;
  adversaryModelingWeight: number;
};

type DecisionOption = {
  id: string;
  label: string;
  description: string;
  previewEffects: {
    statusDelta?: Partial<MissionStatus>;
    sceneChanges?: SceneChange[];
  };
  outcome: {
    statusDelta: Partial<MissionStatus>;
    sceneChanges: SceneChange[];
    feedbackText: string;
    timelineEvents: TimelineEvent[];
  };
  weights: DecisionWeights;
};

type ScenarioRound = {
  id: string;
  title: string;
  narrative: string;
  sceneIntro?: string;
  options: DecisionOption[];
};

type DecisionRecord = {
  roundId: string;
  roundTitle: string;
  selectedOptionId: string;
  selectedOptionLabel: string;
  weights: DecisionWeights;
  responseTimeMs: number;
  changedAnswerCount: number;
  previewOpenCount: number;
  previewTotalTimeMs: number;
};

type DecisionStyleLabel = "operational" | "balanced" | "strategic";

type DecisionStyleSummaryView = {
  band:
    | "strong_operational"
    | "operational"
    | "slightly_operational"
    | "balanced"
    | "slightly_strategic"
    | "strategic"
    | "strong_strategic";
  title: string;
  shortLabel: string;
  text: string;
  uiTone: "red" | "amber" | "cyan" | "blue" | "violet";
};

type FinalNarrativeOutcomeLabel =
  | "major_information_compromise"
  | "limited_information_compromise"
  | "information_control_success"
  | "uncontrolled_escalation"
  | "high_readiness_high_tension"
  | "strategic_information_opportunity"
  | "calm_crisis_control"
  | "remaining_ambiguity"
  | "mixed_crisis_containment";

type InformationCompromiseLevel = "none" | "limited" | "major";

type ScenarioOneCognitiveSummary = {
  operationalStrategicIndex: number;
  decisionStyleLabel: DecisionStyleLabel;
  totalDecisionRounds: number;
  finalNarrativeOutcome: string;
  finalNarrativeOutcomeLabel: FinalNarrativeOutcomeLabel;
  secondOrderThinkingScore: number;
  adversaryModelingScore: number;
  escalationSensitivityScore: number;
  informationDisciplineScore: number;
  cognitiveFlexibilityScore: number;
  avgResponseTimeMs: number;
  totalChangedAnswerCount: number;
  totalPreviewOpenCount: number;
  avgPreviewTimeMs: number;
  informationCompromiseLevel: InformationCompromiseLevel;
};

interface ScenarioOneSimulationProps {
  scenarioId: string | number;
  nodeId: string;
  userProfileId?: string;
  onCompletionUiActiveChange?: (active: boolean) => void;
  onComplete: () => void;
}

const initialMissionStatus: MissionStatus = {
  infoCoverage: 45,
  escalationRisk: 30,
  operationalReadiness: 60,
  remainingResources: 70,
  ambiguity: 65,
  informationExposureRisk: 25,
};

const orbitalPaths: OrbitalPath[] = [
  { id: "leo_inner", label: "LEO-A", radiusX: 230, radiusY: 76, rotation: -12 },
  { id: "leo_mid", label: "LEO-B", radiusX: 275, radiusY: 94, rotation: 12, strokeStyle: "dashed" },
  { id: "leo_outer", label: "LEO-C", radiusX: 315, radiusY: 116, rotation: -24 },
];

const initialSatellites: SatelliteEntity[] = [
  { id: "friendly_1", label: "ماهواره خودی", side: "friendly", orbitId: "leo_inner", pathProgress: 0.18, status: "normal" },
  { id: "unknown_1", label: "ماهواره ناشناس", side: "unknown", orbitId: "leo_mid", pathProgress: 0.62, status: "maneuvering" },
];

const groundTargets: GroundTarget[] = [
  { id: "sensitive_zone", label: "منطقه حساس", x: 400, y: 386, sensitivity: "high" },
];

const initialSensorCones: SensorCone[] = [
  { id: "sensor_main", satelliteId: "friendly_1", angle: 72, width: 34, range: 190, active: true },
];

const orbitMarkers = {
  baseCoveragePoint: 0.28,
  interceptWindow: 0.34,
  safeOffsetPoint: 0.42,
  covertTrackingPoint: 0.22,
  patrolPosture: 0.31,
};

const introStory =
  "در مدار پایین زمین، همه‌چیز سریع اتفاق می‌افتد. ماهواره‌ها با سرعت بالا از فراز مناطق مختلف عبور می‌کنند، پنجره‌های رصد کوتاه‌اند، داده‌ها همیشه کامل نیستند، و هر حرکت می‌تواند چند معنا داشته باشد.\n\n" +
  "در این سناریو، شما در نقش مسئول یک مرکز تصمیم‌گیری فضایی قرار می‌گیرید. مأموریت شما حفظ پوشش اطلاعاتی روی چند منطقه حساس است، اما یک رفتار غیرمنتظره در مدار مشاهده شده: یک ماهواره ناشناس در حال تغییر الگوی عبور خود است.\n\n" +
  "هنوز مشخص نیست این رفتار یک مانور عادی، یک مأموریت شناسایی، یک تست واکنش، یا مقدمه یک اقدام خصمانه است.\n\n" +
  "شما باید در چند مرحله تصمیم بگیرید: چه زمانی واکنش نشان دهید، چه زمانی اطلاعات بیشتری جمع‌آوری کنید، چه زمانی پیام بفرستید، چه زمانی از تشدید تنش جلوگیری کنید، و چگونه بین نیاز عملیاتی فوری و نگاه راهبردی بلندمدت تعادل برقرار کنید.\n\n" +
  "در این سناریو، پاسخ‌ها همیشه «درست» یا «غلط» نیستند. هر انتخاب، نوعی منطق تصمیم‌گیری را نشان می‌دهد. در پایان، یک گزارش کوتاه از سبک تصمیم‌گیری شما در همین مأموریت نمایش داده می‌شود.";

const informationExposureDeltas: Record<string, number> = {
  r1_focus_sensor: 6,
  r1_raise_readiness: 10,
  r1_indirect_warning: 4,
  r1_observe_only: 0,
  r2_direct_threat: 8,
  r2_probe_test: -2,
  r2_routine_maneuver: -1,
  r2_need_more_data: 2,
  r3_motion_data: 2,
  r3_signal_data: 4,
  r3_behavior_history: -2,
  r3_act_now: 8,
  r4_near_threat_focus: 8,
  r4_pattern_analysis: -3,
  r4_split_capacity: 3,
  r4_save_sensor: -1,
  r5_deterrent_maneuver: 16,
  r5_sensor_lock_only: 7,
  r5_short_delay: 1,
  r5_high_level_warning: 12,
  r6_full_alert: 12,
  r6_limited_silent_alert: 3,
  r6_continue_analysis: -2,
  r6_reduce_sensitivity: -4,
  r7_no_message: 0,
  r7_public_ambiguous: 5,
  r7_private_controlled: -4,
  r7_public_severe_warning: 18,
  r8_act_on_current_data: 8,
  r8_second_sensor: 4,
  r8_reassess_analysis: -5,
  r8_ignore_noise: 6,
  r9_share_none: -2,
  r9_share_full: 22,
  r9_share_limited: 4,
  r9_deceptive_data: 24,
  r10_immediate_avoidance: 14,
  r10_track_hold_path: 7,
  r10_small_low_signal_maneuver: 3,
  r10_message_before_maneuver: -2,
  r11_increase_presence: 18,
  r11_long_term_model: -6,
  r11_deconfliction_channel: -5,
  r11_mixed_posture: 2,
  r12_close_controlled: -3,
  r12_covert_monitoring: -8,
  r12_active_threat: 10,
  r12_future_protocol: -6,
};

const getInformationCompromiseLevel = (value: number): InformationCompromiseLevel => {
  if (value >= 80) return "major";
  if (value >= 60) return "limited";
  return "none";
};

const getInformationExposureTimelineEvent = (optionId: string, delta: number): TimelineEvent | null => {
  if (delta > 0 && delta <= 7) {
    return { id: `${optionId}_exposure_low`, text: "ردپای رفتاری شما کمی آشکارتر شد.", level: "warning" };
  }
  if (delta >= 8 && delta <= 15) {
    return { id: `${optionId}_exposure_medium`, text: "طرف مقابل ممکن است بخشی از الگوی واکنش شما را برداشت کرده باشد.", level: "warning" };
  }
  if (delta >= 16) {
    return { id: `${optionId}_exposure_high`, text: "ریسک بالا: بخشی از ظرفیت یا اولویت مأموریت شما قابل برداشت شده است.", level: "critical" };
  }
  if (delta < 0) {
    return { id: `${optionId}_exposure_reduce`, text: "ردپای رفتاری شما کاهش یافت و الگوی تصمیم‌گیری کمتر قابل پیش‌بینی شد.", level: "success" };
  }
  return null;
};

const getInformationExposureSceneChanges = (delta: number): SceneChange[] => {
  if (delta > 0 && delta <= 7) {
    return [{ type: "pulse_unknown_satellite", level: "low" }];
  }
  if (delta >= 8 && delta <= 15) {
    return [
      { type: "pulse_unknown_satellite", level: "medium" },
      { type: "show_information_exposure_trace", fromId: "unknown_1", toId: "sensitive_zone", level: "medium" },
    ];
  }
  if (delta >= 16) {
    return [
      { type: "pulse_unknown_satellite", level: "high" },
      { type: "show_information_exposure_trace", fromId: "unknown_1", toId: "sensitive_zone", level: "high" },
      { type: "highlight_target", targetId: "sensitive_zone", level: "high" },
    ];
  }
  if (delta < 0) {
    return [{ type: "reduce_information_trace" }];
  }
  return [];
};

const getInformationExposureThresholdEvents = (
  previous: MissionStatus,
  current: MissionStatus
): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  if (previous.informationExposureRisk < 45 && current.informationExposureRisk >= 45) {
    events.push({
      id: `info_exposure_45_${Date.now()}`,
      text: "طرف مقابل احتمالاً بخشی از الگوی واکنش شما را شناسایی کرده است.",
      level: "warning",
    });
  }
  if (previous.informationExposureRisk < 60 && current.informationExposureRisk >= 60) {
    events.push({
      id: `info_exposure_60_${Date.now()}`,
      text: "تحلیل هشدار: رفتارهای اخیر ممکن است محدوده حساس مأموریت را آشکار کرده باشد.",
      level: "critical",
    });
  }
  if (previous.informationExposureRisk < 75 && current.informationExposureRisk >= 75) {
    events.push({
      id: `info_exposure_75_${Date.now()}`,
      text: "ریسک بالا: طرف مقابل احتمالاً به سرنخ‌هایی از ظرفیت رصدی و آستانه واکنش شما دست یافته است.",
      level: "critical",
    });
  }
  if (previous.informationExposureRisk - current.informationExposureRisk >= 8) {
    events.push({
      id: `info_exposure_reduce_${Date.now()}`,
      text: "ردپای رفتاری شما کاهش یافت و الگوی تصمیم‌گیری کمتر قابل پیش‌بینی شد.",
      level: "success",
    });
  }
  return events;
};

const rounds: ScenarioRound[] = [
  {
    id: "round_1_initial_observation",
    title: "راند ۱ — مشاهده رفتار غیرعادی",
    narrative:
      "یک ماهواره ناشناس الگوی عبور خود را تغییر داده و اکنون وارد پنجره‌ای شده که می‌تواند روی پوشش اطلاعاتی شما اثر بگذارد. هنوز مشخص نیست این رفتار یک مانور عادی، یک مأموریت شناسایی یا تست واکنش شماست.",
    options: [
      makeOption("r1_focus_sensor", "تمرکز سنسور روی هدف", "سنسور اصلی روی ماهواره ناشناس متمرکز می‌شود و ابهام کاهش می‌یابد، اما بخشی از ظرفیت رصدی مصرف می‌شود.", { infoCoverage: 15, ambiguity: -20, remainingResources: -10, operationalReadiness: -5 }, { strategicWeight: 0.6, escalationWeight: -0.1, infoSeekingWeight: 0.8, secondOrderThinkingWeight: 0.3, adversaryModelingWeight: 0.3 }, "مخروط سنسور به سمت ماهواره ناشناس چرخید.", "medium", undefined, [{ type: "move_satellite", satelliteId: "unknown_1", toPathProgress: 0.7 }, { type: "rotate_sensor", sensorId: "sensor_main", toAngle: 221 }, { type: "change_satellite_status", satelliteId: "unknown_1", status: "tracking" }]),
      makeOption("r1_raise_readiness", "افزایش آماده‌باش عملیاتی", "آمادگی فوری بالا می‌رود، اما طرف مقابل ممکن است آن را نشانه تهدید بداند.", { operationalReadiness: 20, escalationRisk: 15, remainingResources: -8, ambiguity: -5 }, { strategicWeight: -0.7, escalationWeight: 0.6, infoSeekingWeight: -0.2, secondOrderThinkingWeight: -0.2, adversaryModelingWeight: -0.1 }, "هشدار نارنجی عملیاتی فعال شد.", "medium", undefined, [{ type: "change_satellite_status", satelliteId: "friendly_1", status: "alert" }, { type: "show_predicted_path", satelliteId: "friendly_1", orbitId: "leo_inner" }]),
      makeOption("r1_indirect_warning", "ارسال هشدار غیرمستقیم", "پیام عمومی بدون اتهام مستقیم ارسال می‌شود؛ سیگنال دیده‌شدن رفتار طرف مقابل منتقل می‌شود.", { escalationRisk: 5, ambiguity: -8, remainingResources: -4 }, { strategicWeight: 0.4, escalationWeight: 0.2, infoSeekingWeight: 0.2, secondOrderThinkingWeight: 0.5, adversaryModelingWeight: 0.5 }, "پالس هشدار غیرمستقیم روی نقشه ارسال شد.", "low", "normal"),
      makeOption("r1_observe_only", "ادامه مشاهده بدون اقدام", "تنش ایجاد نمی‌شود، اما فرصت واکنش سریع کاهش پیدا می‌کند.", { ambiguity: -3, operationalReadiness: -8 }, { strategicWeight: -0.1, escalationWeight: -0.2, infoSeekingWeight: -0.3, secondOrderThinkingWeight: 0, adversaryModelingWeight: 0 }, "ماهواره ناشناس کمی به پنجره حساس نزدیک‌تر شد.", "medium", undefined, [{ type: "move_satellite", satelliteId: "unknown_1", toPathProgress: 0.68 }]),
    ],
  },
  {
    id: "round_2_interpretation",
    title: "راند ۲ — تفسیر رفتار طرف مقابل",
    narrative:
      "بعد از واکنش شما، ماهواره ناشناس مسیر خود را کمی اصلاح کرده است. این تغییر می‌تواند ناشی از محدودیت فنی، تست واکنش شما، یا بخشی از یک الگوی بزرگ‌تر باشد.",
    sceneIntro: "سه فرضیه روی صحنه فعال است: مانور عادی، تست آستانه واکنش، و الگوی راهبردی.",
    options: [
      makeOption("r2_direct_threat", "این نشانه تهدید مستقیم است و باید فشار را بیشتر کرد.", "برداشت تهدید مستقیم آمادگی را بالا می‌برد، اما خطر تشدید را هم زیاد می‌کند.", { operationalReadiness: 10, escalationRisk: 18, ambiguity: -5 }, { strategicWeight: -0.7, escalationWeight: 0.7, infoSeekingWeight: -0.2, secondOrderThinkingWeight: -0.2, adversaryModelingWeight: -0.1 }, "فرضیه تهدید مستقیم برجسته شد.", "high"),
      makeOption("r2_probe_test", "احتمالاً طرف مقابل در حال تست آستانه واکنش ماست.", "رفتار طرف مقابل به‌عنوان تست واکنش مدل می‌شود و از واکنش شتاب‌زده جلوگیری می‌کند.", { infoCoverage: 8, ambiguity: -10, escalationRisk: -3 }, { strategicWeight: 0.8, escalationWeight: -0.1, infoSeekingWeight: 0.3, secondOrderThinkingWeight: 0.8, adversaryModelingWeight: 0.9 }, "فرضیه تست آستانه واکنش برجسته شد.", "medium"),
      makeOption("r2_routine_maneuver", "ممکن است مانور فنی عادی باشد و نباید سریع نتیجه گرفت.", "ریسک تشدید کنترل می‌شود و تحلیل محتاطانه ادامه پیدا می‌کند.", { ambiguity: -6, escalationRisk: -6 }, { strategicWeight: 0.4, escalationWeight: -0.4, infoSeekingWeight: 0.5, secondOrderThinkingWeight: 0.4, adversaryModelingWeight: 0.3 }, "فرضیه مانور عادی فعال شد.", "low"),
      makeOption("r2_need_more_data", "هنوز نمی‌شود نیت را تشخیص داد؛ باید داده بیشتری گرفت.", "تمرکز روی کاهش ابهام و پرهیز از نتیجه‌گیری زودهنگام باقی می‌ماند.", { infoCoverage: 12, ambiguity: -12, remainingResources: -8 }, { strategicWeight: 0.6, escalationWeight: -0.3, infoSeekingWeight: 0.8, secondOrderThinkingWeight: 0.6, adversaryModelingWeight: 0.6 }, "جمع‌آوری داده تکمیلی آغاز شد.", "medium", undefined, [{ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
    ],
  },
  {
    id: "round_3_information_source",
    title: "راند ۳ — انتخاب منبع اطلاعاتی اولیه",
    narrative:
      "مرکز تحلیل اعلام می‌کند فقط یک منبع اطلاعاتی را می‌توان فوراً تقویت کرد. انتخاب شما تعیین می‌کند ابهام سناریو از چه زاویه‌ای کاهش پیدا کند.",
    options: [
      makeOption("r3_motion_data", "داده مسیر حرکتی ماهواره", "مسیر حرکتی با دقت بالاتر دنبال می‌شود و trajectory line برجسته می‌شود.", { infoCoverage: 10, ambiguity: -10, remainingResources: -6 }, { strategicWeight: -0.2, escalationWeight: 0, infoSeekingWeight: 0.5, secondOrderThinkingWeight: 0.1, adversaryModelingWeight: 0.1 }, "خط مسیر حرکتی پررنگ شد.", "low", undefined, [{ type: "move_satellite", satelliteId: "unknown_1", toPathProgress: 0.7 }, { type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_mid" }, { type: "rotate_sensor", sensorId: "sensor_main", toAngle: 221 }]),
      makeOption("r3_signal_data", "داده سیگنال‌های ارتباطی", "تحلیل سیگنال کمک می‌کند نیت و ارتباطات احتمالی بهتر دیده شود.", { infoCoverage: 12, ambiguity: -12, remainingResources: -8 }, { strategicWeight: 0.3, escalationWeight: 0, infoSeekingWeight: 0.7, secondOrderThinkingWeight: 0.3, adversaryModelingWeight: 0.4 }, "موج ارتباطی کنار ماهواره ناشناس ثبت شد.", "low", "normal"),
      makeOption("r3_behavior_history", "سابقه رفتار قبلی بازیگر مقابل", "رفتار فعلی با الگوهای قبلی مقایسه می‌شود و تصویر راهبردی روشن‌تر می‌شود.", { infoCoverage: 8, ambiguity: -10, remainingResources: -6 }, { strategicWeight: 0.7, escalationWeight: -0.1, infoSeekingWeight: 0.6, secondOrderThinkingWeight: 0.8, adversaryModelingWeight: 0.9 }, "آرشیو الگوی رفتاری روی نقشه فعال شد.", "low", undefined, [{ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r3_act_now", "همین داده‌ها کافی است؛ وارد اقدام شویم", "تصمیم سریع‌تر می‌شود، اما بخشی از ابهام حل‌نشده باقی می‌ماند.", { operationalReadiness: 10, ambiguity: 5, escalationRisk: 6 }, { strategicWeight: -0.6, escalationWeight: 0.3, infoSeekingWeight: -0.6, secondOrderThinkingWeight: -0.3, adversaryModelingWeight: -0.2 }, "هشدار عملیاتی زودهنگام فعال شد.", "medium", undefined, [{ type: "change_satellite_status", satelliteId: "friendly_1", status: "alert" }]),
    ],
  },
  {
    id: "round_4_sensor_allocation",
    title: "راند ۴ — تخصیص سنسور دقیق",
    narrative:
      "یک پنجره کوتاه برای استفاده از سنسور دقیق دارید. اگر روی تهدید نزدیک تمرکز کنید، تصویر کلی را از دست می‌دهید. اگر الگوی کلی را بررسی کنید، پاسخ فوری کندتر می‌شود.",
    options: [
      makeOption("r4_near_threat_focus", "تمرکز کامل روی تهدید نزدیک", "تهدید نزدیک بهتر پوشش داده می‌شود، اما تصویر کلان محدود می‌ماند.", { infoCoverage: 10, operationalReadiness: 10, remainingResources: -15, ambiguity: -10 }, { strategicWeight: -0.5, escalationWeight: 0.1, infoSeekingWeight: 0.3, secondOrderThinkingWeight: -0.2, adversaryModelingWeight: 0 }, "قفل سنسوری روی تهدید نزدیک فعال شد.", "medium", undefined, [{ type: "rotate_sensor", sensorId: "sensor_main", toAngle: 318 }, { type: "change_satellite_status", satelliteId: "unknown_1", status: "tracking" }]),
      makeOption("r4_pattern_analysis", "تحلیل الگوی کلی مدارهای طرف مقابل", "چند مسیر رقیب و نقاط داده روشن می‌شوند و نگاه کلان تقویت می‌شود.", { infoCoverage: 18, ambiguity: -15, operationalReadiness: -8, remainingResources: -15 }, { strategicWeight: 0.8, escalationWeight: -0.1, infoSeekingWeight: 0.7, secondOrderThinkingWeight: 0.8, adversaryModelingWeight: 0.9 }, "چند مدار تحلیلی روی نقشه روشن شد.", "low", undefined, [{ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r4_split_capacity", "تقسیم ظرفیت بین تهدید نزدیک و الگوی کلی", "بین نیاز فوری و تصویر کلان تعادل نسبی ایجاد می‌شود.", { infoCoverage: 14, ambiguity: -12, operationalReadiness: 3, remainingResources: -15 }, { strategicWeight: 0.3, escalationWeight: -0.1, infoSeekingWeight: 0.5, secondOrderThinkingWeight: 0.5, adversaryModelingWeight: 0.5 }, "ظرفیت سنسور بین دو هدف تقسیم شد.", "medium", undefined, [{ type: "rotate_sensor", sensorId: "sensor_main", toAngle: 300 }, { type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r4_save_sensor", "ذخیره سنسور دقیق برای بحران بعدی", "منبع دقیق حفظ می‌شود، اما ابهام فعلی کمی بیشتر باقی می‌ماند.", { remainingResources: 0, infoCoverage: 0, ambiguity: 5, operationalReadiness: -5 }, { strategicWeight: 0, escalationWeight: -0.1, infoSeekingWeight: -0.4, secondOrderThinkingWeight: 0.1, adversaryModelingWeight: 0 }, "سنسور دقیق برای پنجره بعدی ذخیره شد.", "low"),
    ],
  },
  {
    id: "round_5_second_maneuver",
    title: "راند ۵ — مانور دوم ماهواره ناشناس",
    narrative:
      "ماهواره ناشناس یک مانور دوم انجام داده است. این مانور کوچک است، اما مسیر آن را به پنجره رصدی حساس نزدیک‌تر می‌کند. تیم عملیاتی درخواست تصمیم فوری دارد.",
    options: [
      makeOption("r5_deterrent_maneuver", "مانور بازدارنده ماهواره خودی", "ماهواره خودی مسیر خود را تغییر می‌دهد و بازدارندگی فوری ایجاد می‌کند، اما تنش بالا می‌رود.", { operationalReadiness: 18, escalationRisk: 22, remainingResources: -14, ambiguity: -5 }, { strategicWeight: -0.8, escalationWeight: 0.8, infoSeekingWeight: -0.3, secondOrderThinkingWeight: -0.2, adversaryModelingWeight: 0 }, "مانور بازدارنده ماهواره خودی اجرا شد.", "high", undefined, [{ type: "move_satellite", satelliteId: "friendly_1", toPathProgress: 0.28 }, { type: "rotate_sensor", sensorId: "sensor_main", toAngle: 296 }, { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" }]),
      makeOption("r5_sensor_lock_only", "قفل سنسوری بدون مانور", "قفل رصدی اجرا می‌شود، اما اقدام فیزیکی انجام نمی‌گیرد.", { infoCoverage: 16, ambiguity: -15, remainingResources: -8, escalationRisk: 4 }, { strategicWeight: 0.4, escalationWeight: 0.1, infoSeekingWeight: 0.7, secondOrderThinkingWeight: 0.4, adversaryModelingWeight: 0.4 }, "قفل سنسوری روی ماهواره ناشناس اجرا شد.", "medium", undefined, [{ type: "change_satellite_status", satelliteId: "unknown_1", status: "tracking" }, { type: "rotate_sensor", sensorId: "sensor_main", toAngle: 330 }]),
      makeOption("r5_short_delay", "تأخیر کوتاه برای تأیید مسیر", "زمان کوتاهی صرف تأیید مسیر می‌شود؛ واکنش فوری کندتر می‌شود اما ابهام کاهش می‌یابد.", { ambiguity: -8, operationalReadiness: -5, remainingResources: -4 }, { strategicWeight: 0.2, escalationWeight: -0.2, infoSeekingWeight: 0.5, secondOrderThinkingWeight: 0.4, adversaryModelingWeight: 0.3 }, "پنجره رصدی کوتاه‌تر شد و شمارش تصمیم فعال شد.", "medium"),
      makeOption("r5_high_level_warning", "ارسال هشدار سطح بالا", "هشدار جدی ارسال می‌شود و پیام سیاسی/عملیاتی واضح‌تر می‌شود.", { escalationRisk: 15, ambiguity: -6, operationalReadiness: 6 }, { strategicWeight: -0.2, escalationWeight: 0.5, infoSeekingWeight: 0, secondOrderThinkingWeight: 0.2, adversaryModelingWeight: 0.3 }, "هشدار سطح بالا صحنه را نارنجی کرد.", "high", "deceptive"),
    ],
  },
  {
    id: "round_6_internal_alert_management",
    title: "راند ۶ — مدیریت هشدار داخلی",
    narrative:
      "در مرکز عملیات اختلاف نظر ایجاد شده است. تیم عملیاتی خواهان اقدام سریع است. تیم تحلیل می‌گوید هنوز الگوی رفتاری کامل نشده. شما باید سطح هشدار داخلی را تعیین کنید.",
    options: [
      makeOption("r6_full_alert", "هشدار کامل عملیاتی", "مرکز کنترل وارد وضعیت عملیاتی کامل می‌شود؛ آمادگی بالا اما پرهزینه است.", { operationalReadiness: 25, escalationRisk: 10, remainingResources: -10 }, { strategicWeight: -0.7, escalationWeight: 0.4, infoSeekingWeight: -0.2, secondOrderThinkingWeight: -0.2, adversaryModelingWeight: 0 }, "سطح هشدار داخلی به کامل افزایش یافت.", "high", undefined, [{ type: "change_satellite_status", satelliteId: "friendly_1", status: "alert" }]),
      makeOption("r6_limited_silent_alert", "هشدار محدود و آماده‌باش خاموش", "آمادگی محدود ایجاد می‌شود بدون اینکه سیگنال شدید بیرونی ارسال شود.", { operationalReadiness: 12, escalationRisk: 2, remainingResources: -6 }, { strategicWeight: 0.3, escalationWeight: -0.1, infoSeekingWeight: 0.2, secondOrderThinkingWeight: 0.5, adversaryModelingWeight: 0.3 }, "هشدار محدود و کم‌سیگنال فعال شد.", "medium"),
      makeOption("r6_continue_analysis", "ادامه تحلیل بدون تغییر هشدار", "تیم تحلیل زمان بیشتری برای تکمیل تصویر رفتاری می‌گیرد.", { infoCoverage: 8, ambiguity: -8, operationalReadiness: -5 }, { strategicWeight: 0.5, escalationWeight: -0.3, infoSeekingWeight: 0.6, secondOrderThinkingWeight: 0.6, adversaryModelingWeight: 0.5 }, "تحلیل ادامه یافت و هشدار تغییری نکرد.", "low", undefined, [{ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r6_reduce_sensitivity", "کاهش سطح حساسیت برای جلوگیری از واکنش بیش‌ازحد", "ریسک واکنش بیش‌ازحد کاهش می‌یابد، اما آمادگی فوری افت می‌کند.", { escalationRisk: -8, operationalReadiness: -10, ambiguity: 3 }, { strategicWeight: 0.1, escalationWeight: -0.5, infoSeekingWeight: 0, secondOrderThinkingWeight: 0.2, adversaryModelingWeight: 0.2 }, "حساسیت هشدار برای جلوگیری از واکنش بیش‌ازحد کاهش یافت.", "low"),
    ],
  },
  {
    id: "round_7_external_signaling",
    title: "راند ۷ — انتخاب سطح پیام‌دهی بیرونی",
    narrative:
      "اکنون باید تصمیم بگیرید آیا پیام بیرونی ارسال شود یا نه. پیام می‌تواند سوءبرداشت را کم کند، اما ممکن است طرف مقابل آن را تهدید یا ضعف تعبیر کند.",
    options: [
      makeOption("r7_no_message", "عدم ارسال پیام", "سکوت بیرونی حفظ می‌شود، اما احتمال سوءبرداشت یا ابهام بیشتر می‌ماند.", { escalationRisk: 4, ambiguity: 4, remainingResources: 0 }, { strategicWeight: -0.2, escalationWeight: 0.1, infoSeekingWeight: -0.2, secondOrderThinkingWeight: 0, adversaryModelingWeight: 0.1 }, "هیچ پیام بیرونی ارسال نشد.", "medium"),
      makeOption("r7_public_ambiguous", "پیام عمومی و مبهم", "پیام عمومی ارسال می‌شود؛ ابهام کمی کاهش می‌یابد اما تعبیر آن باز می‌ماند.", { escalationRisk: 3, ambiguity: -6 }, { strategicWeight: 0.3, escalationWeight: 0.1, infoSeekingWeight: 0.1, secondOrderThinkingWeight: 0.4, adversaryModelingWeight: 0.5 }, "پیام عمومی و مبهم منتشر شد.", "medium", "normal"),
      makeOption("r7_private_controlled", "پیام خصوصی و کنترل‌شده", "مسیر ارتباطی کنترل‌شده سوءبرداشت را کم می‌کند بدون اینکه نمایش عمومی تنش بسازد.", { escalationRisk: -6, ambiguity: -10, remainingResources: -4 }, { strategicWeight: 0.8, escalationWeight: -0.5, infoSeekingWeight: 0.3, secondOrderThinkingWeight: 0.8, adversaryModelingWeight: 0.8 }, "پیام خصوصی کنترل‌شده ارسال شد.", "low", "limited"),
      makeOption("r7_public_severe_warning", "هشدار علنی شدید", "هشدار عمومی قوی ارسال می‌شود؛ بازدارندگی بالا می‌رود اما تشدید هم محتمل‌تر می‌شود.", { escalationRisk: 20, operationalReadiness: 8, ambiguity: -5 }, { strategicWeight: -0.5, escalationWeight: 0.8, infoSeekingWeight: -0.1, secondOrderThinkingWeight: -0.1, adversaryModelingWeight: 0.2 }, "موج هشدار قرمز روی نقشه فعال شد.", "high", "deceptive"),
    ],
  },
  {
    id: "round_8_sensor_noise",
    title: "راند ۸ — اختلال در داده‌های سنسور",
    narrative:
      "داده‌های سنسور دچار اختلال شده‌اند. بخشی از مسیر ماهواره ناشناس با نویز ثبت شده و ممکن است برداشت فعلی شما اشتباه باشد.",
    options: [
      makeOption("r8_act_on_current_data", "تصمیم بر اساس داده موجود", "با داده ناقص تصمیم می‌گیرید؛ سرعت حفظ می‌شود اما ابهام بالا می‌رود.", { operationalReadiness: 8, ambiguity: 10, remainingResources: 0 }, { strategicWeight: -0.6, escalationWeight: 0.3, infoSeekingWeight: -0.6, secondOrderThinkingWeight: -0.3, adversaryModelingWeight: -0.1 }, "تصمیم بر اساس داده نویزی ثبت شد.", "medium"),
      makeOption("r8_second_sensor", "درخواست تأیید از سنسور دوم", "سنسور دوم فعال می‌شود و خطای مسیر کاهش پیدا می‌کند.", { infoCoverage: 14, ambiguity: -16, remainingResources: -10, operationalReadiness: -4 }, { strategicWeight: 0.6, escalationWeight: -0.2, infoSeekingWeight: 0.8, secondOrderThinkingWeight: 0.6, adversaryModelingWeight: 0.4 }, "سنسور دوم برای تأیید مسیر فعال شد.", "low", undefined, [{ type: "rotate_sensor", sensorId: "sensor_main", toAngle: 292 }, { type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r8_reassess_analysis", "کاهش اعتماد به تحلیل فعلی و بازنگری تصمیم", "مسیر قبلی کم‌رنگ‌تر می‌شود و تحلیل جایگزین روی نقشه ظاهر می‌شود.", { ambiguity: -8, operationalReadiness: -6, escalationRisk: -5 }, { strategicWeight: 0.5, escalationWeight: -0.4, infoSeekingWeight: 0.5, secondOrderThinkingWeight: 0.7, adversaryModelingWeight: 0.5 }, "تحلیل فعلی بازنگری شد و مسیر جایگزین نمایش یافت.", "low", undefined, [{ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r8_ignore_noise", "نادیده گرفتن نویز به‌عنوان اختلال جزئی", "اختلال کم‌اهمیت فرض می‌شود؛ سرعت تصمیم حفظ می‌شود اما خطای تحلیل ممکن است باقی بماند.", { operationalReadiness: 5, ambiguity: 8 }, { strategicWeight: -0.4, escalationWeight: 0.2, infoSeekingWeight: -0.4, secondOrderThinkingWeight: -0.2, adversaryModelingWeight: -0.1 }, "نویز داده به‌عنوان اختلال جزئی کنار گذاشته شد.", "medium"),
    ],
  },
  {
    id: "round_9_limited_cooperation",
    title: "راند ۹ — همکاری محدود یا امنیت اطلاعاتی",
    narrative:
      "تحلیلگران می‌گویند اشتراک محدود داده‌های مداری می‌تواند احتمال سوءبرداشت یا برخورد ناخواسته را کاهش دهد. اما اشتراک داده ممکن است بخشی از توان رصدی شما را آشکار کند.",
    options: [
      makeOption("r9_share_none", "هیچ داده‌ای به اشتراک گذاشته نشود", "امنیت اطلاعاتی حفظ می‌شود، اما سوءبرداشت احتمالی کاهش جدی پیدا نمی‌کند.", { escalationRisk: 8, ambiguity: 5 }, { strategicWeight: -0.3, escalationWeight: 0.2, infoSeekingWeight: -0.2, secondOrderThinkingWeight: 0, adversaryModelingWeight: 0.1 }, "ارتباط داده‌ای قطع باقی ماند.", "medium"),
      makeOption("r9_share_full", "داده کامل به اشتراک گذاشته شود", "ریسک سوءبرداشت کم می‌شود، اما بخشی از توان رصدی آشکار می‌شود.", { escalationRisk: -10, ambiguity: -12, remainingResources: -4 }, { strategicWeight: 0.3, escalationWeight: -0.4, infoSeekingWeight: 0.2, secondOrderThinkingWeight: 0.3, adversaryModelingWeight: 0.2 }, "پالس داده کامل ارسال شد.", "low", "normal"),
      makeOption("r9_share_limited", "داده محدود و کنترل‌شده به اشتراک گذاشته شود", "اشتراک محدود ریسک سوءبرداشت را کم می‌کند بدون آشکارکردن کامل توان رصدی.", { escalationRisk: -14, ambiguity: -10, remainingResources: -3 }, { strategicWeight: 0.9, escalationWeight: -0.5, infoSeekingWeight: 0.4, secondOrderThinkingWeight: 0.8, adversaryModelingWeight: 0.8 }, "پالس باریک و کنترل‌شده ارسال شد.", "low", "limited"),
      makeOption("r9_deceptive_data", "داده گمراه‌کننده ارسال شود", "مزیت کوتاه‌مدت ممکن است ایجاد شود، اما ریسک تنش و سوءبرداشت بالا می‌رود.", { escalationRisk: 24, ambiguity: 8, operationalReadiness: 6 }, { strategicWeight: -0.7, escalationWeight: 0.8, infoSeekingWeight: -0.3, secondOrderThinkingWeight: -0.2, adversaryModelingWeight: -0.1 }, "داده گمراه‌کننده باعث هشدار قرمز شد.", "high", "deceptive"),
    ],
  },
  {
    id: "round_10_unexpected_close_approach",
    title: "راند ۱۰ — نزدیک‌شدن غیرمنتظره",
    narrative:
      "در آخرین عبور، ماهواره ناشناس به شکل غیرمنتظره‌ای به مسیر ماهواره خودی نزدیک‌تر شده است. فاصله هنوز بحرانی نیست، اما پنجره تصمیم کوتاه است.",
    options: [
      makeOption("r10_immediate_avoidance", "مانور فوری دورشدن", "مسیر ماهواره خودی به‌وضوح تغییر می‌کند؛ ریسک برخورد کم می‌شود اما پیام عملیاتی قوی ارسال می‌شود.", { operationalReadiness: 15, remainingResources: -20, escalationRisk: 10, ambiguity: -5 }, { strategicWeight: -0.6, escalationWeight: 0.4, infoSeekingWeight: -0.2, secondOrderThinkingWeight: -0.1, adversaryModelingWeight: 0 }, "مانور فوری دورشدن اجرا شد.", "high", undefined, [{ type: "move_satellite", satelliteId: "friendly_1", toPathProgress: 0.36 }, { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" }]),
      makeOption("r10_track_hold_path", "قفل رصدی و حفظ مسیر", "مسیر حفظ می‌شود و قفل رصدی اطلاعات بیشتری جمع می‌کند.", { infoCoverage: 18, ambiguity: -14, operationalReadiness: -4, escalationRisk: 4 }, { strategicWeight: 0.4, escalationWeight: 0.1, infoSeekingWeight: 0.7, secondOrderThinkingWeight: 0.5, adversaryModelingWeight: 0.5 }, "فاصله نسبی دو ماهواره با خط هشدار دنبال شد.", "medium", undefined, [{ type: "change_satellite_status", satelliteId: "unknown_1", status: "tracking" }]),
      makeOption("r10_small_low_signal_maneuver", "مانور کوچک و کم‌سیگنال", "تغییر مسیر محدود انجام می‌شود تا هم ریسک کاهش یابد و هم پیام تهدیدآمیز شدید ارسال نشود.", { remainingResources: -10, escalationRisk: 2, operationalReadiness: 8, ambiguity: -6 }, { strategicWeight: 0.3, escalationWeight: -0.1, infoSeekingWeight: 0.2, secondOrderThinkingWeight: 0.5, adversaryModelingWeight: 0.4 }, "مانور کوچک و کم‌سیگنال اجرا شد.", "medium", undefined, [{ type: "move_satellite", satelliteId: "friendly_1", toPathProgress: 0.32 }]),
      makeOption("r10_message_before_maneuver", "ارسال پیام کاهش سوءبرداشت قبل از مانور", "قبل از تغییر مسیر، پیام کاهش سوءبرداشت ارسال می‌شود تا تعبیر خصمانه کمتر شود.", { escalationRisk: -8, remainingResources: -6, ambiguity: -8, operationalReadiness: 2 }, { strategicWeight: 0.7, escalationWeight: -0.5, infoSeekingWeight: 0.3, secondOrderThinkingWeight: 0.8, adversaryModelingWeight: 0.7 }, "پالس کوتاه کاهش سوءبرداشت قبل از مانور ارسال شد.", "low", "limited"),
    ],
  },
  {
    id: "round_11_future_posture",
    title: "راند ۱۱ — دکترین ادامه بحران",
    narrative:
      "بحران فوری کنترل شده، اما هنوز معلوم نیست طرف مقابل در آینده چه خواهد کرد. باید رویکرد ادامه مأموریت را انتخاب کنید.",
    options: [
      makeOption("r11_increase_presence", "افزایش حضور عملیاتی در مدار", "حضور عملیاتی بیشتر می‌شود، اما احتمال برداشت تهدیدآمیز افزایش می‌یابد.", { operationalReadiness: 20, escalationRisk: 14, remainingResources: -14 }, { strategicWeight: -0.8, escalationWeight: 0.6, infoSeekingWeight: -0.2, secondOrderThinkingWeight: -0.1, adversaryModelingWeight: 0 }, "حضور عملیاتی در مدار افزایش یافت.", "high", undefined, [{ type: "change_satellite_status", satelliteId: "friendly_1", status: "alert" }]),
      makeOption("r11_long_term_model", "ساخت مدل رفتاری بلندمدت از طرف مقابل", "بحران به فرصت شناخت الگوی بلندمدت تبدیل می‌شود.", { infoCoverage: 18, ambiguity: -18, remainingResources: -8 }, { strategicWeight: 0.9, escalationWeight: -0.3, infoSeekingWeight: 0.8, secondOrderThinkingWeight: 0.9, adversaryModelingWeight: 1.0 }, "pattern map و خطوط تحلیلی فعال شد.", "low", undefined, [{ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r11_deconfliction_channel", "ایجاد کانال کاهش سوءبرداشت", "مسیر ارتباطی پایدار برای کاهش سوءبرداشت ایجاد می‌شود.", { escalationRisk: -16, ambiguity: -8, remainingResources: -5 }, { strategicWeight: 0.7, escalationWeight: -0.6, infoSeekingWeight: 0.3, secondOrderThinkingWeight: 0.7, adversaryModelingWeight: 0.6 }, "کانال پایدار کاهش سوءبرداشت ایجاد شد.", "low", "limited"),
      makeOption("r11_mixed_posture", "ترکیب آمادگی عملیاتی و تحلیل بلندمدت", "هم sensor cone و هم مسیر عملیاتی محدود فعال می‌شود.", { operationalReadiness: 8, infoCoverage: 10, ambiguity: -10, remainingResources: -10 }, { strategicWeight: 0.4, escalationWeight: -0.2, infoSeekingWeight: 0.5, secondOrderThinkingWeight: 0.6, adversaryModelingWeight: 0.6 }, "وضعیت ترکیبی برای ادامه بحران تنظیم شد.", "medium", undefined, [{ type: "rotate_sensor", sensorId: "sensor_main", toAngle: 312 }, { type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
    ],
  },
  {
    id: "round_12_final_decision",
    title: "راند ۱۲ — جمع‌بندی عملیاتی و تصمیم نهایی",
    narrative:
      "اکنون باید جمع‌بندی نهایی مأموریت را انجام دهید. تصمیم شما تعیین می‌کند خروجی سناریو به‌عنوان کنترل بحران، تشدید کنترل‌شده، فرصت اطلاعاتی یا وضعیت مبهم ثبت شود.",
    options: [
      makeOption("r12_close_controlled", "بستن پرونده به‌عنوان مانور مشکوک اما کنترل‌شده", "پرونده با هشدار پایین‌تر بسته می‌شود؛ بحران کنترل‌شده اما همچنان قابل پایش می‌ماند.", { escalationRisk: -8, ambiguity: -8, operationalReadiness: -4 }, { strategicWeight: 0.3, escalationWeight: -0.3, infoSeekingWeight: 0.2, secondOrderThinkingWeight: 0.4, adversaryModelingWeight: 0.4 }, "پرونده به‌عنوان مانور مشکوک اما کنترل‌شده ثبت شد.", "low"),
      makeOption("r12_covert_monitoring", "ادامه پایش مخفیانه و ساخت پرونده رفتاری", "پایش مخفیانه ادامه پیدا می‌کند و آرشیو رفتاری تقویت می‌شود.", { infoCoverage: 14, ambiguity: -12, remainingResources: -8 }, { strategicWeight: 0.8, escalationWeight: -0.4, infoSeekingWeight: 0.8, secondOrderThinkingWeight: 0.9, adversaryModelingWeight: 1.0 }, "پایش مخفیانه و پرونده رفتاری فعال شد.", "low", undefined, [{ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" }]),
      makeOption("r12_active_threat", "ثبت وضعیت به‌عنوان تهدید فعال", "وضعیت به‌عنوان تهدید فعال ثبت می‌شود؛ آمادگی بالا می‌رود اما تنش هم افزایش می‌یابد.", { operationalReadiness: 15, escalationRisk: 16, ambiguity: -6 }, { strategicWeight: -0.6, escalationWeight: 0.7, infoSeekingWeight: -0.1, secondOrderThinkingWeight: -0.1, adversaryModelingWeight: 0.1 }, "UI وارد وضعیت هشدار قرمز تهدید فعال شد.", "high", undefined, [{ type: "change_satellite_status", satelliteId: "friendly_1", status: "alert" }, { type: "change_satellite_status", satelliteId: "unknown_1", status: "alert" }]),
      makeOption("r12_future_protocol", "پیشنهاد پروتکل کاهش سوءبرداشت برای آینده", "مسیر آینده به سمت کاهش سوءبرداشت و مدیریت راهبردی بحران می‌رود.", { escalationRisk: -18, ambiguity: -8, infoCoverage: 6 }, { strategicWeight: 0.9, escalationWeight: -0.7, infoSeekingWeight: 0.4, secondOrderThinkingWeight: 0.9, adversaryModelingWeight: 0.8 }, "پروتکل آینده برای کاهش سوءبرداشت پیشنهاد شد.", "low", "limited"),
    ],
  },
];

function makeOption(
  id: string,
  label: string,
  feedbackText: string,
  statusDelta: Partial<MissionStatus>,
  weights: DecisionWeights,
  timelineText: string,
  alertLevel: "low" | "medium" | "high",
  signalVariant?: "normal" | "limited" | "deceptive",
  extraSceneChanges: SceneChange[] = []
): DecisionOption {
  const progressSeed = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const nextProgress = 0.58 + (progressSeed % 22) / 100;
  const informationExposureDelta = informationExposureDeltas[id] ?? 0;
  const statusDeltaWithExposure: Partial<MissionStatus> = {
    ...statusDelta,
    informationExposureRisk: informationExposureDelta,
  };
  const exposureTimelineEvent = getInformationExposureTimelineEvent(id, informationExposureDelta);
  const hasExplicitUnknownMove = extraSceneChanges.some(
    (change) => change.type === "move_satellite" && change.satelliteId === "unknown_1"
  );
  const semanticSceneChanges = getScenarioOneSceneGuidance(id);
  const sceneChanges: SceneChange[] = [
    ...(hasExplicitUnknownMove ? [] : [{ type: "move_satellite" as const, satelliteId: "unknown_1", toPathProgress: nextProgress }]),
    { type: "set_alert", level: alertLevel, text: timelineText },
    ...extraSceneChanges,
    ...semanticSceneChanges,
    ...getInformationExposureSceneChanges(informationExposureDelta),
  ];
  if (signalVariant) {
    sceneChanges.push({ type: "show_signal_pulse", fromId: "friendly_1", toId: "unknown_1", variant: signalVariant });
  }
  if (id.includes("pattern") || id.includes("model") || id.includes("history") || id.includes("monitoring")) {
    sceneChanges.push({ type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" });
  }
  if (
    (id.includes("focus") || id.includes("threat") || id.includes("lock")) &&
    !sceneChanges.some((change) => change.type === "rotate_sensor" || change.type === "point_sensor_at")
  ) {
    sceneChanges.push({ type: "point_sensor_at", sensorId: "sensor_main", targetId: "unknown_1" });
  }
  return {
    id,
    label,
    description: feedbackText,
    previewEffects: { statusDelta: statusDeltaWithExposure, sceneChanges },
    outcome: {
      statusDelta: statusDeltaWithExposure,
      sceneChanges,
      feedbackText,
      timelineEvents: [
        { id: `${id}_event`, text: timelineText, level: alertLevel },
        ...(exposureTimelineEvent ? [exposureTimelineEvent] : []),
      ],
    },
    weights,
  };
}

function getScenarioOneSceneGuidance(optionId: string): SceneChange[] {
  const trackUnknown: SceneChange[] = [
    { type: "point_sensor_at", sensorId: "sensor_main", targetId: "unknown_1" },
    { type: "set_sensor_profile", sensorId: "sensor_main", width: 30, range: 220 },
  ];
  const lockUnknown: SceneChange[] = [
    { type: "point_sensor_at", sensorId: "sensor_main", targetId: "unknown_1" },
    { type: "set_sensor_profile", sensorId: "sensor_main", width: 22, range: 235 },
    { type: "change_satellite_status", satelliteId: "unknown_1", status: "tracking" },
  ];
  const broadSweep: SceneChange[] = [
    { type: "point_sensor_at", sensorId: "sensor_main", targetId: "sensitive_zone" },
    { type: "set_sensor_profile", sensorId: "sensor_main", width: 58, range: 245 },
    { type: "show_predicted_path", satelliteId: "unknown_1", orbitId: "leo_outer" },
  ];
  const passiveTrack: SceneChange[] = [
    { type: "point_sensor_at", sensorId: "sensor_main", targetId: "unknown_1" },
    { type: "set_sensor_profile", sensorId: "sensor_main", width: 24, range: 185 },
  ];

  switch (optionId) {
    case "r1_focus_sensor":
    case "r2_direct_threat":
    case "r4_near_threat_focus":
    case "r5_sensor_lock_only":
    case "r10_track_hold_path":
    case "r12_active_threat":
      return lockUnknown;
    case "r1_raise_readiness":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: orbitMarkers.interceptWindow },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" },
        ...trackUnknown,
      ];
    case "r1_indirect_warning":
    case "r5_high_level_warning":
    case "r7_public_severe_warning":
      return trackUnknown;
    case "r1_observe_only":
    case "r2_routine_maneuver":
    case "r3_behavior_history":
    case "r4_pattern_analysis":
    case "r6_continue_analysis":
    case "r7_public_ambiguous":
    case "r11_long_term_model":
    case "r12_close_controlled":
    case "r12_future_protocol":
      return broadSweep;
    case "r2_probe_test":
    case "r2_need_more_data":
    case "r3_motion_data":
    case "r4_split_capacity":
    case "r6_limited_silent_alert":
    case "r7_private_controlled":
    case "r8_second_sensor":
    case "r11_mixed_posture":
      return trackUnknown;
    case "r3_signal_data":
    case "r8_reassess_analysis":
    case "r9_share_none":
      return passiveTrack;
    case "r6_reduce_sensitivity":
      return [
        { type: "point_sensor_at", sensorId: "sensor_main", targetId: "sensitive_zone" },
        { type: "set_sensor_profile", sensorId: "sensor_main", width: 46, range: 190 },
      ];
    case "r12_covert_monitoring":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: orbitMarkers.covertTrackingPoint },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "normal" },
        ...passiveTrack,
      ];
    case "r3_act_now":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: orbitMarkers.interceptWindow },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" },
        ...trackUnknown,
      ];
    case "r4_save_sensor":
      return [
        { type: "point_sensor_at", sensorId: "sensor_main", targetId: "sensitive_zone" },
        { type: "set_sensor_profile", sensorId: "sensor_main", width: 52, range: 170 },
      ];
    case "r5_short_delay":
    case "r7_no_message":
    case "r8_ignore_noise":
      return [];
    case "r5_deterrent_maneuver":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: orbitMarkers.baseCoveragePoint },
        ...lockUnknown,
      ];
    case "r6_full_alert":
    case "r11_increase_presence":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: orbitMarkers.patrolPosture },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" },
        ...trackUnknown,
      ];
    case "r8_act_on_current_data":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: orbitMarkers.interceptWindow },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" },
        ...trackUnknown,
      ];
    case "r9_share_full":
    case "r9_share_limited":
    case "r9_deceptive_data":
      return trackUnknown;
    case "r11_deconfliction_channel":
      return passiveTrack;
    case "r10_immediate_avoidance":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: orbitMarkers.safeOffsetPoint },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" },
        ...trackUnknown,
      ];
    case "r10_small_low_signal_maneuver":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: 0.36 },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" },
        ...passiveTrack,
      ];
    case "r10_message_before_maneuver":
      return [
        { type: "move_satellite", satelliteId: "friendly_1", toPathProgress: 0.35 },
        { type: "change_satellite_status", satelliteId: "friendly_1", status: "maneuvering" },
        ...passiveTrack,
      ];
    default:
      return [];
  }
}

const interRoundEvents: Record<string, TimelineEvent[]> = {
  round_2_interpretation: [
    {
      id: "inter_after_r2",
      text: "رخداد بین‌راندی: تحلیل اولیه نشان می‌دهد مسیر ماهواره ناشناس با دو مأموریت متفاوت سازگار است؛ مانور عادی یا تست واکنش.",
      level: "medium",
    },
  ],
  round_4_sensor_allocation: [
    {
      id: "inter_after_r4",
      text: "رخداد بین‌راندی: پنجره رصدی بعدی کوتاه‌تر از انتظار است و زمان تصمیم‌گیری کاهش می‌یابد.",
      level: "high",
    },
  ],
  round_6_internal_alert_management: [
    {
      id: "inter_after_r6",
      text: "رخداد بین‌راندی: تیم عملیات و تیم تحلیل دو تفسیر متفاوت از وضعیت ارائه کرده‌اند.",
      level: "medium",
    },
  ],
  round_8_sensor_noise: [
    {
      id: "inter_after_r8",
      text: "رخداد بین‌راندی: نویز داده باعث شده مسیر پیش‌بینی‌شده با خطای بیشتری نمایش داده شود.",
      level: "medium",
    },
  ],
  round_10_unexpected_close_approach: [
    {
      id: "inter_after_r10",
      text: "رخداد بین‌راندی: فاصله نسبی دو دارایی کاهش یافته، اما شواهد کافی برای اقدام خصمانه قطعی وجود ندارد.",
      level: "high",
    },
  ],
};

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const clampStatus = (value: number) => clamp(Math.round(value), 0, 100);

const applyDelta = (status: MissionStatus, delta?: Partial<MissionStatus>) => {
  if (!delta) return status;
  return {
    infoCoverage: clampStatus(status.infoCoverage + (delta.infoCoverage ?? 0)),
    escalationRisk: clampStatus(status.escalationRisk + (delta.escalationRisk ?? 0)),
    operationalReadiness: clampStatus(status.operationalReadiness + (delta.operationalReadiness ?? 0)),
    remainingResources: clampStatus(status.remainingResources + (delta.remainingResources ?? 0)),
    ambiguity: clampStatus(status.ambiguity + (delta.ambiguity ?? 0)),
    informationExposureRisk: clampStatus(status.informationExposureRisk + (delta.informationExposureRisk ?? 0)),
  };
};

const getFinalNarrativeOutcome = (
  finalStatus: MissionStatus,
  adversaryModelingScore: number
): { label: FinalNarrativeOutcomeLabel; text: string } => {
  const {
    infoCoverage,
    escalationRisk,
    operationalReadiness,
    remainingResources,
    ambiguity,
    informationExposureRisk,
  } = finalStatus;

  if (informationExposureRisk >= 80 && (ambiguity > 45 || escalationRisk > 70)) {
    return {
      label: "major_information_compromise",
      text: "سناریو با شکست اطلاعاتی شدید پایان یافت. در حالی که بخشی از ابهام یا تنش همچنان بالا بود، طرف مقابل احتمالاً توانسته از رفتارها و واکنش‌های شما سرنخ‌های مهمی درباره ظرفیت، اولویت‌ها و آستانه واکنش مأموریت برداشت کند.",
    };
  }

  if (escalationRisk > 75 && (ambiguity > 50 || remainingResources < 20)) {
    return {
      label: "uncontrolled_escalation",
      text: "بحران وارد مسیر پرتنش شد. واکنش‌ها سریع یا شدید بودند، اما ابهام یا فشار منابع اجازه نداد وضعیت به‌صورت کنترل‌شده مدیریت شود.",
    };
  }

  if (informationExposureRisk > 65 && informationExposureRisk < 80) {
    return {
      label: "limited_information_compromise",
      text: "بحران از نظر کلی تا حدی مدیریت شد، اما طرف مقابل احتمالاً بخشی از الگوی واکنش، اولویت‌های رصدی یا محدوده حساس شما را شناسایی کرده است. این یک شکست اطلاعاتی محدود محسوب می‌شود.",
    };
  }

  if (
    informationExposureRisk < 40 &&
    infoCoverage > 65 &&
    ambiguity < 45 &&
    escalationRisk < 55 &&
    remainingResources > 20
  ) {
    return {
      label: "information_control_success",
      text: "شما توانستید بدون آشکار کردن بخش مهمی از الگوی رفتاری یا ظرفیت رصدی خود، ابهام را کاهش دهید و کنترل اطلاعاتی مأموریت را حفظ کنید.",
    };
  }

  if (ambiguity > 60 && escalationRisk <= 75 && informationExposureRisk <= 75) {
    return {
      label: "remaining_ambiguity",
      text: "بخشی از ابهام همچنان باقی ماند. تصمیم‌ها باعث تشدید جدی یا شکست اطلاعاتی شدید نشدند، اما تصویر کامل از رفتار طرف مقابل ساخته نشد.",
    };
  }

  if (
    operationalReadiness > 75 &&
    escalationRisk > 60 &&
    ambiguity <= 60 &&
    informationExposureRisk <= 75
  ) {
    return {
      label: "high_readiness_high_tension",
      text: "آمادگی عملیاتی شما بالا رفت، اما هزینه آن افزایش تنش بود. این مسیر در بحران‌های فوری می‌تواند مؤثر باشد، اما فضای تصمیم‌گیری آینده را محدودتر می‌کند.",
    };
  }

  if (
    infoCoverage > 70 &&
    adversaryModelingScore > 0.5 &&
    informationExposureRisk < 60 &&
    escalationRisk < 65 &&
    ambiguity < 55
  ) {
    return {
      label: "strategic_information_opportunity",
      text: "سناریو به یک فرصت اطلاعاتی تبدیل شد. شما از بحران برای شناخت بهتر الگوی رفتاری طرف مقابل استفاده کردید، بدون اینکه تنش یا ریسک افشای اطلاعات از کنترل خارج شود.",
    };
  }

  if (
    escalationRisk < 45 &&
    ambiguity < 45 &&
    remainingResources > 25 &&
    informationExposureRisk < 55
  ) {
    return {
      label: "calm_crisis_control",
      text: "بحران بدون تشدید جدی کنترل شد. شما توانستید ابهام را کاهش دهید، پوشش اطلاعاتی را حفظ کنید و از واکنش بیش‌ازحد جلوگیری کنید.",
    };
  }

  return {
    label: "mixed_crisis_containment",
    text: "بحران در وضعیت میانی پایان یافت. بخشی از ریسک‌ها کنترل شد، اما هیچ‌کدام از مسیرهای موفقیت کامل، شکست اطلاعاتی جدی، یا تشدید کنترل‌نشده به‌طور قطعی غالب نشد.",
  };
};

const getNow = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

const formatIndex = (value: number) => value.toFixed(2);

const starPoints = [
  [44, 82, 1.2], [96, 184, 0.8], [138, 42, 1], [184, 314, 0.7], [226, 118, 1.4],
  [284, 64, 0.8], [342, 204, 1.1], [388, 88, 0.7], [452, 156, 1.3], [508, 56, 0.9],
  [572, 254, 0.8], [612, 112, 1.4], [676, 198, 0.9], [726, 72, 1.1], [764, 344, 0.8],
  [810, 142, 1.2], [852, 286, 0.8], [112, 426, 0.7], [318, 468, 0.9], [642, 438, 0.8],
];

const getSeverityColor = (level?: TimelineEvent["level"]) =>
  level === "critical" || level === "high"
    ? "#ef4444"
    : level === "warning" || level === "medium"
      ? "#f59e0b"
      : "#22c55e";

const toSceneAlertLevel = (level?: TimelineEvent["level"]): SceneAlert["level"] =>
  level === "critical" || level === "high"
    ? "high"
    : level === "warning" || level === "medium"
      ? "medium"
      : "low";

const getOptionUiMeta = (option: DecisionOption) => {
  if (option.weights.escalationWeight >= 0.55) {
    return { label: "پرریسک", color: "#fb923c", border: "rgba(251,146,60,0.55)" };
  }
  if (option.weights.escalationWeight <= -0.35) {
    return { label: "کم‌تنش", color: "#22c55e", border: "rgba(34,197,94,0.42)" };
  }
  if (option.weights.infoSeekingWeight >= 0.65) {
    return { label: "اطلاعاتی", color: "#38bdf8", border: "rgba(56,189,248,0.45)" };
  }
  if (option.weights.strategicWeight >= 0.55) {
    return { label: "راهبردی", color: "#818cf8", border: "rgba(129,140,248,0.45)" };
  }
  if (option.weights.strategicWeight <= -0.45) {
    return { label: "عملیاتی", color: "#facc15", border: "rgba(250,204,21,0.42)" };
  }
  if (option.weights.secondOrderThinkingWeight >= 0.45 || option.weights.adversaryModelingWeight >= 0.45) {
    return { label: "سیگنال‌دهی", color: "#2dd4bf", border: "rgba(45,212,191,0.42)" };
  }
  return { label: "ترکیبی", color: "#cbd5e1", border: "rgba(148,163,184,0.42)" };
};

const getDecisionStyleToneColor = (tone: DecisionStyleSummaryView["uiTone"]) =>
  tone === "red"
    ? "#ef4444"
    : tone === "amber"
      ? "#f59e0b"
      : tone === "blue"
        ? "#38bdf8"
        : tone === "violet"
          ? "#818cf8"
          : "#22d3ee";

const OperationalStrategicScale = ({
  value,
  bandLabel,
  tone = "cyan",
}: {
  value: number;
  bandLabel?: string;
  tone?: DecisionStyleSummaryView["uiTone"];
}) => {
  const markerPosition = clamp(((value + 1) / 2) * 100, 0, 100);
  const toneColor = getDecisionStyleToneColor(tone);
  return (
    <div
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: 16,
        padding: "1rem",
        background: "rgba(15, 23, 42, 0.72)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.65rem" }}>
        <strong>طیف نوع تفکر</strong>
        <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
          {bandLabel && <strong style={{ color: toneColor }}>{bandLabel}</strong>}
          <span>{formatIndex(value)}</span>
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 18,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, #ef4444 0%, #f59e0b 36%, #22c55e 50%, #38bdf8 64%, #6366f1 100%)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -7,
            left: `${markerPosition}%`,
            width: 4,
            height: 32,
            borderRadius: 999,
            background: "#fff",
            transform: "translateX(-50%)",
            boxShadow: "0 0 16px rgba(255,255,255,0.85)",
          }}
        />
      </div>
      <div style={{ direction: "ltr", display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "0.35rem", marginTop: "0.65rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
        {["عملیاتی شدید", "عملیاتی", "متمایل به عملیاتی", "ترکیبی", "متمایل به راهبردی", "راهبردی", "راهبردی شدید"].map((label) => (
          <span key={label} style={{ direction: "rtl", textAlign: "center", color: label === bandLabel ? toneColor : undefined, fontWeight: label === bandLabel ? 800 : 500 }}>{label}</span>
        ))}
      </div>
    </div>
  );
};

export const ScenarioOneSimulation = ({
  scenarioId,
  nodeId,
  userProfileId,
  onCompletionUiActiveChange,
  onComplete,
}: ScenarioOneSimulationProps) => {
  const [introOpen, setIntroOpen] = useState(true);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [status, setStatus] = useState<MissionStatus>(initialMissionStatus);
  const [satellites, setSatellites] = useState<SatelliteEntity[]>(initialSatellites);
  const [sensorCones, setSensorCones] = useState<SensorCone[]>(initialSensorCones);
  const [alerts, setAlerts] = useState<SceneAlert[]>([
    { id: "initial_alert", text: "ماهواره ناشناس الگوی عبور خود را تغییر داده است.", level: "medium" },
  ]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { id: "initial_event", text: "ماهواره ناشناس مسیر خود را تغییر داد.", level: "medium" },
  ]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [statusPreviewOptionId, setStatusPreviewOptionId] = useState<string | null>(null);
  const [confirmedOption, setConfirmedOption] = useState<DecisionOption | null>(null);
  const [feedbackModalOption, setFeedbackModalOption] = useState<DecisionOption | null>(null);
  const [autoDecisionMessage, setAutoDecisionMessage] = useState<string | null>(null);
  const [changedAnswerCount, setChangedAnswerCount] = useState(0);
  const [previewOpenCount, setPreviewOpenCount] = useState(0);
  const [previewTotalTimeMs, setPreviewTotalTimeMs] = useState(0);
  const [sceneAnimation, setSceneAnimation] = useState<SceneChange[] | null>(null);
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [summary, setSummary] = useState<ScenarioOneCognitiveSummary | null>(null);
  const [pendingFinalSummary, setPendingFinalSummary] = useState<ScenarioOneCognitiveSummary | null>(null);
  const [roundTimerRemaining, setRoundTimerRemaining] = useState<number | null>(null);
  const [interRoundMapEvents, setInterRoundMapEvents] = useState<TimelineEvent[]>([]);
  const roundStartedAtRef = useRef(getNow());
  const previewStartedAtRef = useRef<number | null>(null);
  const sceneAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentRound = rounds[roundIndex];
  const selectedOption = currentRound.options.find((option) => option.id === selectedOptionId) ?? null;
  const statusPreviewOption = currentRound.options.find((option) => option.id === statusPreviewOptionId) ?? selectedOption;
  const previewStatus = statusPreviewOption && !confirmedOption ? applyDelta(status, statusPreviewOption.previewEffects.statusDelta) : undefined;

  useEffect(() => {
    return () => {
      if (sceneAnimationTimeoutRef.current) {
        clearTimeout(sceneAnimationTimeoutRef.current);
      }
      if (roundTimerIntervalRef.current) {
        clearInterval(roundTimerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (introOpen) return;
    const activeRound = rounds[roundIndex];
    if (activeRound.id === "round_5_second_maneuver") {
      startRoundFiveTimer(activeRound);
      return;
    }
    clearRoundTimer();
  }, [introOpen, roundIndex]);

  useEffect(() => {
    onCompletionUiActiveChange?.(Boolean(summary || pendingFinalSummary));
    return () => onCompletionUiActiveChange?.(false);
  }, [onCompletionUiActiveChange, pendingFinalSummary, summary]);

  const closePreviewTimer = () => {
    if (previewStartedAtRef.current == null) return previewTotalTimeMs;
    const elapsed = getNow() - previewStartedAtRef.current;
    previewStartedAtRef.current = null;
    const next = previewTotalTimeMs + elapsed;
    setPreviewTotalTimeMs(next);
    return next;
  };

  const handleStart = () => {
    const started = new Date().toISOString();
    setStartedAt(started);
    setIntroOpen(false);
    roundStartedAtRef.current = getNow();
    eventLogger.log({
      type: "node_enter",
      scenarioId,
      nodeId: currentRound.id,
      detail: {
        interactionMode: "decision_simulation",
        scenarioTitle: "سایه‌های مدار پایین",
        nodeType: "decision_round",
        roundId: currentRound.id,
        roundTitle: currentRound.title,
      },
    });
  };

  const handleSelectOption = (optionId: string) => {
    if (confirmedOption) return;
    if (selectedOptionId && selectedOptionId !== optionId) {
      setChangedAnswerCount((prev) => prev + 1);
    }
    setSelectedOptionId(optionId);
  };

  const handlePreviewOption = (optionId: string) => {
    if (confirmedOption) return;
    if (statusPreviewOptionId !== optionId) {
      closePreviewTimer();
      previewStartedAtRef.current = getNow();
      setPreviewOpenCount((prev) => prev + 1);
    }
    setStatusPreviewOptionId(optionId);
  };

  const applySceneChanges = (changes: SceneChange[]) => {
    const nextSatellites = applySatelliteSceneChanges(satellites, changes);
    setSatellites(nextSatellites);
    setSensorCones((prev) => applySensorSceneChanges(prev, nextSatellites, changes));

    const alertChanges = changes.filter((change): change is Extract<SceneChange, { type: "set_alert" }> => change.type === "set_alert");
    if (alertChanges.length > 0) {
      setAlerts((prev) => [
        ...alertChanges.map((change, index) => ({
          id: `${Date.now()}_${prev.length}_${index}`,
          text: change.text,
          level: change.level,
        })),
        ...prev,
      ].slice(0, 3));
    }
  };

  const buildSummary = (nextRecords: DecisionRecord[], finalStatus: MissionStatus): ScenarioOneCognitiveSummary => {
    const choiceStrategyScore = average(nextRecords.map((record) => record.weights.strategicWeight));
    const secondOrderThinkingScore = average(nextRecords.map((record) => record.weights.secondOrderThinkingWeight));
    const adversaryModelingScore = average(nextRecords.map((record) => record.weights.adversaryModelingWeight));
    const informationDisciplineScore = average(nextRecords.map((record) => record.weights.infoSeekingWeight));
    const escalationSensitivityScore = -average(nextRecords.map((record) => record.weights.escalationWeight));
    const cognitiveFlexibilityScore = average([
      secondOrderThinkingScore,
      adversaryModelingScore,
      informationDisciplineScore,
      escalationSensitivityScore,
    ]);
    const operationalStrategicIndex = clamp(
      0.6 * choiceStrategyScore +
        0.15 * secondOrderThinkingScore +
        0.1 * informationDisciplineScore +
        0.1 * escalationSensitivityScore +
        0.05 * adversaryModelingScore,
      -1,
      1
    );
    const decisionStyleLabel: DecisionStyleLabel =
      operationalStrategicIndex <= -0.25
        ? "operational"
        : operationalStrategicIndex >= 0.25
          ? "strategic"
          : "balanced";
    const finalOutcome = getFinalNarrativeOutcome(finalStatus, adversaryModelingScore);
    const informationCompromiseLevel = getInformationCompromiseLevel(finalStatus.informationExposureRisk);

    return {
      operationalStrategicIndex: Number(operationalStrategicIndex.toFixed(3)),
      decisionStyleLabel,
      totalDecisionRounds: nextRecords.length,
      finalNarrativeOutcome: finalOutcome.text,
      finalNarrativeOutcomeLabel: finalOutcome.label,
      secondOrderThinkingScore: Number(secondOrderThinkingScore.toFixed(3)),
      adversaryModelingScore: Number(adversaryModelingScore.toFixed(3)),
      escalationSensitivityScore: Number(escalationSensitivityScore.toFixed(3)),
      informationDisciplineScore: Number(informationDisciplineScore.toFixed(3)),
      cognitiveFlexibilityScore: Number(cognitiveFlexibilityScore.toFixed(3)),
      avgResponseTimeMs: Math.round(average(nextRecords.map((record) => record.responseTimeMs))),
      totalChangedAnswerCount: nextRecords.reduce((sum, record) => sum + record.changedAnswerCount, 0),
      totalPreviewOpenCount: nextRecords.reduce((sum, record) => sum + record.previewOpenCount, 0),
      avgPreviewTimeMs: Math.round(average(nextRecords.map((record) => record.previewTotalTimeMs))),
      informationCompromiseLevel,
    };
  };

  const clearRoundTimer = () => {
    if (roundTimerIntervalRef.current) {
      clearInterval(roundTimerIntervalRef.current);
      roundTimerIntervalRef.current = null;
    }
    setRoundTimerRemaining(null);
  };

  const confirmDecision = (option: DecisionOption, autoReason?: string) => {
    if (confirmedOption) return;
    clearRoundTimer();
    const statusBefore = status;
    const statusAfter = applyDelta(status, option.outcome.statusDelta);
    const informationExposureDelta = statusAfter.informationExposureRisk - statusBefore.informationExposureRisk;
    const finalPreviewTime = closePreviewTimer();
    const responseTimeMs = Math.round(getNow() - roundStartedAtRef.current);
    const confirmedAt = new Date().toISOString();
    const record: DecisionRecord = {
      roundId: currentRound.id,
      roundTitle: currentRound.title,
      selectedOptionId: option.id,
      selectedOptionLabel: option.label,
      weights: option.weights,
      responseTimeMs,
      changedAnswerCount,
      previewOpenCount,
      previewTotalTimeMs: Math.round(finalPreviewTime),
    };
    const nextRecords = [...records, record];

    setRecords(nextRecords);
    setSelectedOptionId(option.id);
    setConfirmedOption(option);
    setStatusPreviewOptionId(null);
    setSceneAnimation(option.outcome.sceneChanges);

    if (sceneAnimationTimeoutRef.current) {
      clearTimeout(sceneAnimationTimeoutRef.current);
    }
    sceneAnimationTimeoutRef.current = setTimeout(() => {
      setStatus(statusAfter);
      applySceneChanges(option.outcome.sceneChanges);
      const exposureThresholdEvents = getInformationExposureThresholdEvents(statusBefore, statusAfter);
      setTimeline((prev) => [...exposureThresholdEvents, ...option.outcome.timelineEvents, ...prev]);
      setSceneAnimation(null);
      sceneAnimationTimeoutRef.current = null;

      if (roundIndex === rounds.length - 1) {
        const finalSummary = buildSummary(nextRecords, statusAfter);
        setPendingFinalSummary(finalSummary);
        const completedAt = new Date().toISOString();
        eventLogger.log({
          type: "s1_cognitive_summary",
          scenarioId,
          nodeId,
          detail: {
            eventType: "s1_cognitive_summary",
            interactionMode: "decision_simulation",
            scenarioId: "s1_shadows_low_orbit",
            scenarioTitle: "سایه‌های مدار پایین",
            ...finalSummary,
            final_infoCoverage: statusAfter.infoCoverage,
            final_escalationRisk: statusAfter.escalationRisk,
            final_operationalReadiness: statusAfter.operationalReadiness,
            final_remainingResources: statusAfter.remainingResources,
            final_ambiguity: statusAfter.ambiguity,
            final_informationExposureRisk: statusAfter.informationExposureRisk,
            informationCompromiseLevel: finalSummary.informationCompromiseLevel,
            userProfileId: userProfileId ?? "",
            startedAt: startedAt ?? "",
            completedAt,
          },
        });
        return;
      }

      if (autoReason) {
        setAutoDecisionMessage(autoReason);
      } else {
        setFeedbackModalOption(option);
      }
    }, 900);

    eventLogger.log({
      type: "s1_decision",
      scenarioId,
      nodeId: currentRound.id,
      elapsedMs: responseTimeMs,
      detail: {
        eventType: "s1_decision",
        interactionMode: "decision_simulation",
        scenarioId: "s1_shadows_low_orbit",
        scenarioTitle: "سایه‌های مدار پایین",
        roundId: currentRound.id,
        roundTitle: currentRound.title,
        selectedOptionId: option.id,
        selectedOptionLabel: option.label,
        optionStrategicWeight: option.weights.strategicWeight,
        escalationWeight: option.weights.escalationWeight,
        infoSeekingWeight: option.weights.infoSeekingWeight,
        secondOrderThinkingWeight: option.weights.secondOrderThinkingWeight,
        adversaryModelingWeight: option.weights.adversaryModelingWeight,
        responseTimeMs,
        changedAnswerCount,
        previewOpenCount,
        previewTotalTimeMs: Math.round(finalPreviewTime),
        statusBefore_infoCoverage: statusBefore.infoCoverage,
        statusBefore_escalationRisk: statusBefore.escalationRisk,
        statusBefore_operationalReadiness: statusBefore.operationalReadiness,
        statusBefore_remainingResources: statusBefore.remainingResources,
        statusBefore_ambiguity: statusBefore.ambiguity,
        statusBefore_informationExposureRisk: statusBefore.informationExposureRisk,
        statusAfter_infoCoverage: statusAfter.infoCoverage,
        statusAfter_escalationRisk: statusAfter.escalationRisk,
        statusAfter_operationalReadiness: statusAfter.operationalReadiness,
        statusAfter_remainingResources: statusAfter.remainingResources,
        statusAfter_ambiguity: statusAfter.ambiguity,
        statusAfter_informationExposureRisk: statusAfter.informationExposureRisk,
        informationExposureDelta,
        userProfileId: userProfileId ?? "",
        timestamp: confirmedAt,
        confirmedAt,
      },
    });

  };

  const handleConfirm = () => {
    if (!selectedOption || confirmedOption) return;
    confirmDecision(selectedOption);
  };

  const startRoundFiveTimer = (round: ScenarioRound) => {
    clearRoundTimer();
    setRoundTimerRemaining(45);
    roundTimerIntervalRef.current = setInterval(() => {
      setRoundTimerRemaining((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          if (roundTimerIntervalRef.current) {
            clearInterval(roundTimerIntervalRef.current);
            roundTimerIntervalRef.current = null;
          }
          const autoOption = round.options.find((option) => option.id === "r5_deterrent_maneuver");
          if (autoOption) {
            setTimeout(() => {
              confirmDecision(
                autoOption,
                "چون خیلی تعلل کردی، اپراتور تصمیم به مانور بازدارنده ماهواره خودی گرفت."
              );
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleContinue = () => {
    if (summary) return;
    const nextIndex = roundIndex + 1;
    const dynamicEvents = interRoundEvents[currentRound.id] ?? [];
    if (dynamicEvents.length > 0) {
      setInterRoundMapEvents((prev) => [...dynamicEvents, ...prev]);
      setAlerts((prev) => [
        ...dynamicEvents.map((event) => ({
          id: event.id,
          text: event.text.replace("رخداد بین‌راندی: ", ""),
          level: toSceneAlertLevel(event.level),
        })),
        ...prev,
      ].slice(0, 3));
    }
    setRoundIndex(nextIndex);
    setSelectedOptionId(null);
    setStatusPreviewOptionId(null);
    setConfirmedOption(null);
    setFeedbackModalOption(null);
    setAutoDecisionMessage(null);
    setSceneAnimation(null);
    setChangedAnswerCount(0);
    setPreviewOpenCount(0);
    setPreviewTotalTimeMs(0);
    previewStartedAtRef.current = null;
    roundStartedAtRef.current = getNow();
    const nextRound = rounds[nextIndex];
    eventLogger.log({
      type: "node_enter",
      scenarioId,
      nodeId: nextRound.id,
      detail: {
        interactionMode: "decision_simulation",
        scenarioTitle: "سایه‌های مدار پایین",
        nodeType: "decision_round",
        roundId: nextRound.id,
        roundTitle: nextRound.title,
      },
    });
  };

  if (introOpen) {
    return <ScenarioOneIntroModal onStart={handleStart} />;
  }

  if (summary) {
    return <ScenarioOneSummary summary={summary} finalStatus={status} onComplete={onComplete} />;
  }

  return (
    <div className="s1-sim-root">
      <div className="screen-header">
        <div>
          <h2 className="screen-title">سناریو ۱ — سایه‌های مدار پایین</h2>
          <p className="subtitle">شبیه‌سازی تصمیم‌محور مدار پایین زمین</p>
        </div>
      </div>

      <div className="s1-sim-grid">
        <div className="s1-panel s1-status">
          <MissionStatusPanel
            status={status}
            previewStatus={previewStatus}
          />
        </div>

        <div className="s1-panel s1-timeline">
          <EventTimeline events={timeline} />
        </div>

        <div className="s1-panel s1-scene">
        <SpaceScenarioScene
          satellites={satellites}
          orbitalPaths={orbitalPaths}
          groundTargets={groundTargets}
          sensorCones={sensorCones}
          alerts={alerts}
          status={status}
          previewAction={sceneAnimation}
          timerRemaining={roundTimerRemaining}
        />
        <InterRoundMapEvents events={interRoundMapEvents} />
        </div>

        <div className="s1-panel s1-decision">
        <DecisionPanel
          round={currentRound}
          selectedOptionId={selectedOptionId}
          confirmedOption={confirmedOption}
          onSelectOption={handleSelectOption}
          onPreviewOption={handlePreviewOption}
          onConfirm={handleConfirm}
        />
        </div>
      </div>
      {feedbackModalOption && (
        <FeedbackModal
          option={feedbackModalOption}
          isLastRound={roundIndex === rounds.length - 1}
          warningText={currentRound.id === "round_4_sensor_allocation" ? "راند بعد حواستون به تایمر باشه" : undefined}
          onContinue={() => {
            if (roundIndex === rounds.length - 1) {
              setFeedbackModalOption(null);
              return;
            }
            setFeedbackModalOption(null);
            handleContinue();
          }}
          onClose={() => setFeedbackModalOption(null)}
        />
      )}
      {autoDecisionMessage && (
        <AutoDecisionModal
          message={autoDecisionMessage}
          onContinue={() => {
            setAutoDecisionMessage(null);
            handleContinue();
          }}
        />
      )}
      {pendingFinalSummary && (
        <FinalConclusionModal
          summary={pendingFinalSummary}
          onShowReport={() => {
            setSummary(pendingFinalSummary);
            setPendingFinalSummary(null);
          }}
        />
      )}
    </div>
  );
};

const ScenarioOneIntroModal = ({ onStart }: { onStart: () => void }) => (
  <div
    style={{
      border: "1px solid rgba(56,189,248,0.42)",
      borderRadius: 24,
      padding: "1.4rem",
      overflow: "hidden",
      position: "relative",
      background:
        "radial-gradient(circle at 25% 110%, rgba(37,99,235,0.52), transparent 36%), radial-gradient(circle at 88% 8%, rgba(56,189,248,0.2), transparent 34%), linear-gradient(145deg, rgba(2,6,23,0.98), rgba(15,23,42,0.94))",
      boxShadow: "0 30px 90px rgba(0,0,0,0.62), inset 0 0 70px rgba(56,189,248,0.08)",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.18,
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.2) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
      }}
    />
    <div style={{ position: "relative", display: "grid", gap: "1rem" }}>
      <div>
        <p style={{ margin: "0 0 0.35rem", color: "#38bdf8", letterSpacing: "0.16em", fontSize: "0.78rem" }}>
          LEO DECISION SIMULATION
        </p>
        <h2 style={{ margin: 0, fontSize: "2rem" }}>سناریو ۱ — سایه‌های مدار پایین</h2>
      </div>
      <p style={{ margin: 0, lineHeight: 1.85, whiteSpace: "pre-wrap", color: "#dbeafe" }}>{introStory}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.85rem" }}>
        <InfoList title="اهداف مأموریت" items={[
          "حفظ پوشش اطلاعاتی روی منطقه حساس",
          "تحلیل رفتار ماهواره ناشناس",
          "مدیریت منابع محدود رصدی",
          "جلوگیری از تشدید تنش غیرضروری",
          "تعادل بین اقدام فوری و تصویر کلان",
        ]} />
        <InfoList title="محدودیت‌ها" items={[
          "اطلاعات کامل نیست.",
          "زمان تصمیم‌گیری محدود است.",
          "منابع رصدی محدودند.",
          "طرف مقابل تصمیم شما را تفسیر می‌کند.",
          "هر تصمیم مسیر سناریو را تغییر می‌دهد.",
        ]} />
      </div>
      <p style={{ margin: 0, color: "#a5f3fc", fontWeight: 700 }}>
        تصمیم‌های شما مسیر بحران را تغییر می‌دهند.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <button className="primary start-button" onClick={onStart}>اجرای سناریو</button>
      </div>
    </div>
  </div>
);

const InfoList = ({ title, items }: { title: string; items: string[] }) => (
  <div style={{ border: "1px solid var(--border-soft)", borderRadius: "14px", padding: "0.9rem" }}>
    <strong>{title}</strong>
    <ul style={{ margin: "0.6rem 0 0", lineHeight: 1.9 }}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  </div>
);

const getOrbitPoint = (path: OrbitalPath, progress: number) => {
  const cx = 400;
  const cy = 245;
  const angle = progress * Math.PI * 2;
  const rotation = (path.rotation * Math.PI) / 180;
  const x0 = path.radiusX * Math.cos(angle);
  const y0 = path.radiusY * Math.sin(angle);
  return {
    x: cx + x0 * Math.cos(rotation) - y0 * Math.sin(rotation),
    y: cy + x0 * Math.sin(rotation) + y0 * Math.cos(rotation),
  };
};

const getSatellitePointFromList = (satellites: SatelliteEntity[], satelliteId: string) => {
  const satellite = satellites.find((item) => item.id === satelliteId);
  const path = satellite ? orbitalPaths.find((item) => item.id === satellite.orbitId) : undefined;
  return satellite && path ? getOrbitPoint(path, satellite.pathProgress) : null;
};

const getScenePointFromList = (satellites: SatelliteEntity[], targetId: string) => {
  const satellitePoint = getSatellitePointFromList(satellites, targetId);
  if (satellitePoint) return satellitePoint;
  const target = groundTargets.find((item) => item.id === targetId);
  return target ? { x: target.x, y: target.y } : null;
};

const getSensorTargetAngle = (sensor: SensorCone, satellites: SatelliteEntity[], targetId: string) => {
  const origin = getSatellitePointFromList(satellites, sensor.satelliteId);
  const target = getScenePointFromList(satellites, targetId);
  if (!origin || !target) return sensor.angle;
  return (Math.atan2(target.y - origin.y, target.x - origin.x) * 180) / Math.PI;
};

const applySatelliteSceneChanges = (satellites: SatelliteEntity[], changes: SceneChange[]) =>
  satellites.map((satellite) =>
    changes.reduce<SatelliteEntity>((nextSatellite, change) => {
      if (change.type === "move_satellite" && change.satelliteId === nextSatellite.id) {
        return { ...nextSatellite, pathProgress: clamp(change.toPathProgress, 0, 1), status: "maneuvering" };
      }
      if (change.type === "change_satellite_status" && change.satelliteId === nextSatellite.id) {
        return { ...nextSatellite, status: change.status };
      }
      return nextSatellite;
    }, satellite)
  );

const applySensorSceneChanges = (sensors: SensorCone[], satellites: SatelliteEntity[], changes: SceneChange[]) =>
  sensors.map((sensor) =>
    changes.reduce<SensorCone>((nextSensor, change) => {
      if (change.type === "rotate_sensor" && change.sensorId === nextSensor.id) {
        return { ...nextSensor, angle: change.toAngle };
      }
      if (change.type === "point_sensor_at" && change.sensorId === nextSensor.id) {
        return { ...nextSensor, angle: getSensorTargetAngle(nextSensor, satellites, change.targetId) };
      }
      if (change.type === "set_sensor_profile" && change.sensorId === nextSensor.id) {
        return {
          ...nextSensor,
          width: change.width ?? nextSensor.width,
          range: change.range ?? nextSensor.range,
        };
      }
      if (change.type === "expand_sensor_view" && change.sensorId === nextSensor.id) {
        return { ...nextSensor, angle: change.toAngle };
      }
      return nextSensor;
    }, sensor)
  );

const SensorConeShape = ({
  origin,
  angle,
  range,
  width,
  color = "#38bdf8",
  animate = false,
}: {
  origin: { x: number; y: number };
  angle: number;
  range: number;
  width: number;
  color?: string;
  animate?: boolean;
}) => {
  const radians = (angle * Math.PI) / 180;
  const spread = (width * Math.PI) / 180;
  const left = {
    x: origin.x + Math.cos(radians - spread / 2) * range,
    y: origin.y + Math.sin(radians - spread / 2) * range,
  };
  const right = {
    x: origin.x + Math.cos(radians + spread / 2) * range,
    y: origin.y + Math.sin(radians + spread / 2) * range,
  };
  return (
    <g>
      <path
        d={`M ${origin.x} ${origin.y} L ${left.x} ${left.y} Q ${origin.x + Math.cos(radians) * range} ${origin.y + Math.sin(radians) * range} ${right.x} ${right.y} Z`}
        fill={color}
        opacity="0.16"
        stroke={color}
        strokeWidth="1.8"
      >
        {animate && <animate attributeName="opacity" values="0.12;0.25;0.12" dur="1.8s" repeatCount="indefinite" />}
      </path>
      <line x1={origin.x} y1={origin.y} x2={left.x} y2={left.y} stroke={color} strokeWidth="1.2" opacity="0.8" />
      <line x1={origin.x} y1={origin.y} x2={right.x} y2={right.y} stroke={color} strokeWidth="1.2" opacity="0.8" />
    </g>
  );
};

const SatelliteIcon = ({
  x,
  y,
  label,
  side,
  status,
}: {
  x: number;
  y: number;
  label: string;
  side: SatelliteEntity["side"];
  status?: SatelliteStatus;
}) => {
  const isFriendly = side === "friendly";
  const color = isFriendly ? "#22d3ee" : "#fb923c";
  const identityGlowColor = isFriendly ? "#38bdf8" : "#ef4444";
  const asset = isFriendly ? friendlySatelliteAsset : unknownSatelliteAsset;
  const glow = side === "unknown" && (status === "tracking" || status === "maneuvering") ? 0.38 : 0.24;
  const rotation = isFriendly ? -18 : 16;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <circle r="34" fill={identityGlowColor} opacity={isFriendly ? 0.1 : 0.12} />
      <circle r="42" fill="none" stroke={identityGlowColor} strokeWidth="2.2" opacity={isFriendly ? 0.38 : 0.42}>
        <animate attributeName="r" values="36;47;36" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.42;0.16;0.42" dur="2.2s" repeatCount="indefinite" />
      </circle>
      {status === "maneuvering" && (
        <path d="M -54 18 C -36 8, -24 3, -12 0" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.42" />
      )}
      {(status === "tracking" || status === "alert") && (
        <g>
          <circle r="28" fill="none" stroke={color} strokeWidth="1.6" opacity={glow}>
            <animate attributeName="r" values="22;34;22" dur="1.7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0.08;0.45" dur="1.7s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      <image href={asset} x="-46" y="-33" width="92" height="66" preserveAspectRatio="xMidYMid meet" opacity="0.98" />
      <text x="18" y="-22" transform={`rotate(${-rotation})`} fill="#f8fafc" fontSize="12" fontWeight="700">{label}</text>
    </g>
  );
};

const SignalPulseShape = ({
  from,
  to,
  variant,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  variant?: "normal" | "limited" | "deceptive";
}) => {
  const color = variant === "deceptive" ? "#ef4444" : variant === "limited" ? "#22c55e" : "#38bdf8";
  const strokeWidth = variant === "limited" ? 2.4 : 3.8;
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const controlY = Math.min(from.y, to.y) - Math.min(70, Math.max(34, distance * 0.18));
  const controlX = (from.x + to.x) / 2;

  return (
    <g>
      <path
        d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="10 9"
        strokeLinecap="round"
        opacity={variant === "deceptive" ? 0.9 : 0.78}
      >
        <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="0.9s" repeatCount="indefinite" />
      </path>
      <g transform={`translate(${from.x} ${from.y}) rotate(${angle})`}>
        {[0, 1, 2].map((index) => {
          const offset = 16 + index * 12;
          const spread = 9 + index * 7;
          const reach = 22 + index * 12;
          return (
            <path
              key={`signal-wave-${index}`}
              d={`M ${offset} ${-spread} Q ${offset + reach} 0 ${offset} ${spread}`}
              fill="none"
              stroke={color}
              strokeWidth={2.6 - index * 0.25}
              strokeLinecap="round"
              opacity={0.72 - index * 0.12}
            >
              <animate attributeName="opacity" values="0;0.82;0" dur="1.05s" begin={`${index * 0.16}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 0;10 0;0 0" dur="1.05s" begin={`${index * 0.16}s`} repeatCount="indefinite" />
            </path>
          );
        })}
      </g>
      <circle cx={to.x} cy={to.y} r="18" fill="none" stroke={color} strokeWidth="2" opacity="0.72">
        <animate attributeName="r" values="12;28;12" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.85;0.18;0.85" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  );
};

const SpaceScenarioScene = ({
  satellites,
  orbitalPaths,
  groundTargets,
  sensorCones,
  alerts,
  status,
  previewAction,
  timerRemaining,
}: {
  satellites: SatelliteEntity[];
  orbitalPaths: OrbitalPath[];
  groundTargets: GroundTarget[];
  sensorCones: SensorCone[];
  alerts: SceneAlert[];
  status: MissionStatus;
  previewAction: SceneChange[] | null;
  timerRemaining: number | null;
}) => {
  const previewAlert = previewAction?.find((change) => change.type === "set_alert") as SceneChange | undefined;
  const activeAlert = (previewAlert?.type === "set_alert" ? previewAlert : alerts[0]) as SceneAlert | undefined;
  const signal = previewAction?.find((change) => change.type === "show_signal_pulse") as SceneChange | undefined;
  const targetColor = status.infoCoverage < 50 ? "#fb923c" : status.infoCoverage > 65 ? "#22c55e" : "#22d3ee";
  const predictedPath = previewAction?.some((change) => change.type === "show_predicted_path");
  const exposureTrace = previewAction?.find((change) => change.type === "show_information_exposure_trace") as SceneChange | undefined;
  const exposurePulse = previewAction?.find((change) => change.type === "pulse_unknown_satellite") as SceneChange | undefined;
  const exposureReduction = previewAction?.some((change) => change.type === "reduce_information_trace");
  const highlightedTarget = previewAction?.find((change) => change.type === "highlight_target") as SceneChange | undefined;
  const getSatellitePointById = (satelliteId: string) => {
    const satellite = satellites.find((item) => item.id === satelliteId);
    const path = satellite ? orbitalPaths.find((item) => item.id === satellite.orbitId) : undefined;
    if (!satellite || !path) return null;
    const previewMove = previewAction?.find((change) => change.type === "move_satellite" && change.satelliteId === satellite.id) as SceneChange | undefined;
    const progress = previewMove && previewMove.type === "move_satellite" ? previewMove.toPathProgress : satellite.pathProgress;
    return getOrbitPoint(path, progress);
  };
  const getScenePointById = (id: string) => {
    const satellitePoint = getSatellitePointById(id);
    if (satellitePoint) return satellitePoint;
    const target = groundTargets.find((item) => item.id === id);
    return target ? { x: target.x, y: target.y } : null;
  };
  const exposureTraceFrom = exposureTrace?.type === "show_information_exposure_trace" ? getScenePointById(exposureTrace.fromId) : null;
  const exposureTraceTo = exposureTrace?.type === "show_information_exposure_trace" ? getScenePointById(exposureTrace.toId) : null;
  const signalFrom = signal?.type === "show_signal_pulse" ? getScenePointById(signal.fromId) : null;
  const signalTo = signal?.type === "show_signal_pulse" ? getScenePointById(signal.toId) : null;
  return (
    <Card>
      {activeAlert && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            width: "min(490px, calc(100% - 84px))",
            minHeight: 58,
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.2)",
            background: activeAlert.level === "high" ? "rgba(239,68,68,0.24)" : activeAlert.level === "medium" ? "rgba(245,158,11,0.22)" : "rgba(34,197,94,0.17)",
            color: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.55rem 1rem",
            boxSizing: "border-box",
            fontSize: 13,
            lineHeight: 1.45,
            textAlign: "center",
            direction: "rtl",
            fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
          }}
        >
          {activeAlert.text}
        </div>
      )}
      {timerRemaining != null && (
        <div
          style={{
            position: "absolute",
            top: 12,
            insetInlineEnd: 18,
            zIndex: 4,
            border: "1px solid rgba(239,68,68,0.62)",
            borderRadius: 12,
            background: "rgba(127,29,29,0.82)",
            color: "#fee2e2",
            padding: "0.45rem 0.7rem",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            boxShadow: "0 10px 26px rgba(0,0,0,0.36)",
          }}
        >
          {Math.floor(timerRemaining / 60).toString().padStart(2, "0")}:{(timerRemaining % 60).toString().padStart(2, "0")}
        </div>
      )}
      <svg
        viewBox="0 0 800 500"
        style={{
          width: "calc(100% + 2.5rem)",
          height: "min(68vh, 650px)",
          minHeight: 520,
          display: "block",
          margin: "-1rem -1.25rem 0",
        }}
      >
        <defs>
          <linearGradient id="spaceBgS1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="48%" stopColor="#07142d" />
            <stop offset="100%" stopColor="#140b2d" />
          </linearGradient>
          <radialGradient id="earthGlowS1" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.88" />
            <stop offset="34%" stopColor="#1d4ed8" stopOpacity="0.72" />
            <stop offset="70%" stopColor="#172554" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.1" />
          </radialGradient>
          <radialGradient id="earthBodyS1" cx="45%" cy="24%" r="76%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.78" />
            <stop offset="40%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <linearGradient id="earthAtmosphereS1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.65" />
            <stop offset="32%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
          <clipPath id="earthClipS1">
            <circle cx="400" cy="650" r="342" />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="800" height="500" rx="18" fill="url(#spaceBgS1)" />
        {starPoints.map(([x, y, r], index) => (
          <circle key={`star-${index}`} cx={x} cy={y} r={r} fill="#e0f2fe" opacity={0.28 + (index % 3) * 0.12} />
        ))}
        <g>
          <circle cx="400" cy="636" r="368" fill="url(#earthGlowS1)" opacity="0.22" />
          <circle cx="400" cy="650" r="342" fill="url(#earthBodyS1)" opacity="0.48" />
          <g clipPath="url(#earthClipS1)">
            <rect x="58" y="308" width="684" height="384" fill="url(#earthBodyS1)" opacity="0.68" />
            <path d="M 98 436 C 144 402, 218 398, 260 426 C 292 448, 274 474, 322 489 C 376 506, 418 474, 456 496 C 494 518, 460 556, 508 578 C 556 600, 618 582, 686 612 L 730 700 L 70 700 Z" fill="#1f8a70" opacity="0.34" />
            <path d="M 276 388 C 334 360, 418 374, 448 416 C 468 444, 444 468, 484 489 C 522 509, 572 486, 620 514 C 650 532, 664 568, 706 586 L 742 650 L 300 650 C 288 610, 322 568, 286 534 C 248 498, 214 420, 276 388 Z" fill="#4d9f57" opacity="0.3" />
            <path d="M 560 366 C 610 354, 666 380, 694 424 C 724 472, 686 506, 724 548 L 762 610 L 704 622 C 658 586, 618 564, 580 520 C 548 482, 512 454, 520 412 C 524 390, 538 372, 560 366 Z" fill="#a3b65f" opacity="0.24" />
            <path d="M 84 504 C 146 482, 210 488, 274 516 C 344 546, 408 538, 472 526 C 552 510, 626 526, 704 570" fill="none" stroke="#e0f2fe" strokeWidth="10" strokeLinecap="round" opacity="0.14" />
            <path d="M 134 414 C 214 384, 322 400, 410 430 C 500 460, 576 452, 674 430" fill="none" stroke="#f8fafc" strokeWidth="7" strokeLinecap="round" opacity="0.12" />
            <path d="M 188 585 C 266 552, 374 562, 470 590 C 558 616, 626 610, 712 586" fill="none" stroke="#bae6fd" strokeWidth="8" strokeLinecap="round" opacity="0.11" />
            <path d="M 74 384 C 232 332, 474 330, 730 390" fill="none" stroke="#7dd3fc" strokeWidth="4" opacity="0.14" />
            <rect x="58" y="308" width="684" height="384" fill="url(#earthAtmosphereS1)" opacity="0.34" />
          </g>
          <circle cx="400" cy="650" r="342" fill="none" stroke="#bae6fd" strokeWidth="3" opacity="0.3" />
          <path d="M 92 422 C 238 360, 550 358, 716 426" fill="none" stroke="#e0f2fe" strokeWidth="1.4" opacity="0.34" />
          <path d="M 118 454 C 274 398, 518 400, 690 458" fill="none" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.25" />
        </g>
        {orbitalPaths.map((path) => (
          <ellipse
            key={path.id}
            cx="400"
            cy="245"
            rx={path.radiusX}
            ry={path.radiusY}
            transform={`rotate(${path.rotation} 400 245)`}
            fill="none"
            stroke={path.id === "leo_inner" ? "rgba(56,189,248,0.62)" : path.id === "leo_mid" ? "rgba(251,146,60,0.58)" : "rgba(203,213,225,0.32)"}
            strokeWidth={path.id === "leo_inner" ? 2.1 : 1.7}
            strokeDasharray={path.id === "leo_mid" ? "9 7" : path.strokeStyle === "dashed" ? "7 7" : undefined}
          />
        ))}
        <ellipse cx="400" cy="245" rx="300" ry="104" transform="rotate(2 400 245)" fill="none" stroke="rgba(226,232,240,0.42)" strokeWidth="1.2" strokeDasharray="4 8" />
        {predictedPath && (
          <ellipse cx="400" cy="245" rx="315" ry="116" transform="rotate(-24 400 245)" fill="none" stroke="#facc15" strokeWidth="2.7" strokeDasharray="10 7" opacity="0.95">
            <animate attributeName="stroke-dashoffset" from="0" to="-34" dur="1.3s" repeatCount="indefinite" />
          </ellipse>
        )}
        {groundTargets.map((target) => (
          <g key={target.id}>
            <circle cx={target.x} cy={target.y} r="15" fill={targetColor} opacity="0.86" />
            {highlightedTarget?.type === "highlight_target" && highlightedTarget.targetId === target.id && (
              <circle cx={target.x} cy={target.y} r="46" fill="none" stroke="#ef4444" strokeWidth="2.6" opacity="0.9">
                <animate attributeName="r" values="38;55;38" dur="0.9s" repeatCount="2" />
                <animate attributeName="opacity" values="0.95;0.25;0.95" dur="0.9s" repeatCount="2" />
              </circle>
            )}
            <circle cx={target.x} cy={target.y} r="31" fill="none" stroke={targetColor} strokeWidth="1.8" opacity="0.75">
              <animate attributeName="r" values="25;42;25" dur="2.1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.75;0.16;0.75" dur="2.1s" repeatCount="indefinite" />
            </circle>
            <text x={target.x + 22} y={target.y + 5} fill="#f8fafc" fontSize="14" fontWeight="700">{target.label}</text>
          </g>
        ))}
        {sensorCones.map((sensor) => {
          const sat = satellites.find((item) => item.id === sensor.satelliteId);
          const point = sat ? getSatellitePointById(sat.id) : null;
          if (!sat || !point || !sensor.active) return null;
          const previewRotate = [...(previewAction ?? [])].reverse().find((change) => change.type === "rotate_sensor" && change.sensorId === sensor.id) as SceneChange | undefined;
          const previewPointTarget = [...(previewAction ?? [])].reverse().find((change) => change.type === "point_sensor_at" && change.sensorId === sensor.id) as SceneChange | undefined;
          const previewProfile = [...(previewAction ?? [])].reverse().find((change) => change.type === "set_sensor_profile" && change.sensorId === sensor.id) as SceneChange | undefined;
          const previewExpand = [...(previewAction ?? [])].reverse().find((change) => change.type === "expand_sensor_view" && change.sensorId === sensor.id) as SceneChange | undefined;
          const targetPoint = previewPointTarget?.type === "point_sensor_at" ? getScenePointById(previewPointTarget.targetId) : null;
          const angle =
            previewPointTarget?.type === "point_sensor_at" && targetPoint
              ? (Math.atan2(targetPoint.y - point.y, targetPoint.x - point.x) * 180) / Math.PI
              : previewExpand && previewExpand.type === "expand_sensor_view"
                ? previewExpand.toAngle
                : previewRotate && previewRotate.type === "rotate_sensor"
                  ? previewRotate.toAngle
                  : sensor.angle;
          const rangeBoost = previewExpand && previewExpand.type === "expand_sensor_view" ? previewExpand.rangeBoost : 55;
          const widthBoost = previewExpand && previewExpand.type === "expand_sensor_view" ? previewExpand.widthBoost : 10;
          const baseRange = previewProfile?.type === "set_sensor_profile" ? previewProfile.range ?? sensor.range : sensor.range;
          const baseWidth = previewProfile?.type === "set_sensor_profile" ? previewProfile.width ?? sensor.width : sensor.width;
          return (
            <g key={sensor.id}>
              <SensorConeShape origin={point} angle={angle} range={baseRange + rangeBoost} width={baseWidth + widthBoost} animate={Boolean(previewRotate || previewExpand || previewPointTarget || previewProfile)} />
              {previewRotate && <SensorConeShape origin={point} angle={angle + 18} range={sensor.range + 10} width={sensor.width - 4} color="#a78bfa" animate />}
              {previewExpand && <SensorConeShape origin={point} angle={angle - 10} range={sensor.range + 55} width={sensor.width + 6} color="#7dd3fc" animate />}
            </g>
          );
        })}
        {signal?.type === "show_signal_pulse" && signalFrom && signalTo && (
          <SignalPulseShape from={signalFrom} to={signalTo} variant={signal.variant} />
        )}
        {exposureTrace?.type === "show_information_exposure_trace" && exposureTraceFrom && exposureTraceTo && (
          <g opacity={exposureReduction ? 0.24 : 0.92}>
            <path
              d={`M ${exposureTraceFrom.x} ${exposureTraceFrom.y} C ${(exposureTraceFrom.x + exposureTraceTo.x) / 2} ${exposureTraceFrom.y - 52}, ${(exposureTraceFrom.x + exposureTraceTo.x) / 2} ${exposureTraceTo.y - 28}, ${exposureTraceTo.x} ${exposureTraceTo.y}`}
              fill="none"
              stroke={exposureTrace.level === "high" ? "#ef4444" : "#f59e0b"}
              strokeWidth={exposureTrace.level === "high" ? 3 : 2}
              strokeDasharray="7 7"
              strokeLinecap="round"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="0.8s" repeatCount="2" />
            </path>
            <circle cx={exposureTraceTo.x} cy={exposureTraceTo.y - 18} r="7" fill={exposureTrace.level === "high" ? "#ef4444" : "#f59e0b"}>
              <animate attributeName="r" values="5;10;5" dur="0.8s" repeatCount="2" />
            </circle>
          </g>
        )}
        {satellites.map((satellite) => {
          const path = orbitalPaths.find((item) => item.id === satellite.orbitId)!;
          const previewMove = previewAction?.find((change) => change.type === "move_satellite" && change.satelliteId === satellite.id) as SceneChange | undefined;
          const progress = previewMove && previewMove.type === "move_satellite" ? previewMove.toPathProgress : satellite.pathProgress;
          const point = getOrbitPoint(path, progress);
          const previewStatus = previewAction?.find((change) => change.type === "change_satellite_status" && change.satelliteId === satellite.id) as SceneChange | undefined;
          const satelliteStatus = previewStatus && previewStatus.type === "change_satellite_status" ? previewStatus.status : satellite.status;
          return (
            <g key={satellite.id}>
              {satellite.side !== "friendly" && satelliteStatus === "tracking" && (
                <circle cx={point.x} cy={point.y} r="38" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="7 5" opacity="0.9" />
              )}
              {satellite.side === "unknown" && exposurePulse?.type === "pulse_unknown_satellite" && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="46"
                  fill="none"
                  stroke={exposurePulse.level === "high" ? "#ef4444" : exposurePulse.level === "medium" ? "#f59e0b" : "#fb923c"}
                  strokeWidth={exposurePulse.level === "high" ? 3 : 2}
                  opacity={exposureReduction ? 0.18 : 0.9}
                >
                  <animate attributeName="r" values="34;56;34" dur="0.8s" repeatCount="2" />
                  <animate attributeName="opacity" values="0.9;0.18;0.9" dur="0.8s" repeatCount="2" />
                </circle>
              )}
              {satellite.side === "unknown" && exposureReduction && (
                <circle cx={point.x} cy={point.y} r="40" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.55">
                  <animate attributeName="r" values="54;36;30" dur="0.9s" repeatCount="1" />
                  <animate attributeName="opacity" values="0.55;0.22;0" dur="0.9s" repeatCount="1" />
                </circle>
              )}
              <SatelliteIcon x={point.x} y={point.y} label={satellite.label} side={satellite.side} status={satelliteStatus} />
            </g>
          );
        })}
        <path d="M 110 390 C 230 314, 512 294, 662 365" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeDasharray="10 8" opacity="0.55" />
        <text x="400" y="482" textAnchor="middle" fill="#f8fafc" fontSize="18" fontWeight="800">صحنه فضایی</text>
      </svg>
    </Card>
  );
};

const MissionStatusPanel = ({ status, previewStatus }: { status: MissionStatus; previewStatus?: MissionStatus }) => {
  const rows: Array<{ key: keyof MissionStatus; label: string }> = [
    { key: "infoCoverage", label: "پوشش اطلاعاتی" },
    { key: "escalationRisk", label: "ریسک تشدید تنش" },
    { key: "operationalReadiness", label: "آمادگی عملیاتی" },
    { key: "remainingResources", label: "منابع باقی‌مانده" },
    { key: "ambiguity", label: "ابهام وضعیت" },
    { key: "informationExposureRisk", label: "ریسک افشای اطلاعات" },
  ];
  const getStatusBarColor = (key: keyof MissionStatus, value: number) => {
    if (key === "informationExposureRisk") {
      if (value < 40) return "#22c55e";
      if (value < 65) return "#f59e0b";
      return "#ef4444";
    }
    return key === "escalationRisk" || key === "ambiguity" ? "#f97316" : "#38bdf8";
  };
  const getDeltaColor = (key: keyof MissionStatus, delta: number) => {
    if (key === "informationExposureRisk") {
      return delta > 0 ? "#fb7185" : "#22c55e";
    }
    return delta > 0 ? "#22c55e" : "#fb7185";
  };
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>وضعیت مأموریت</h3>
      <div style={{ display: "grid", gap: "0.8rem" }}>
        {rows.map((row) => {
          const value = status[row.key];
          const preview = previewStatus?.[row.key];
          const delta = preview != null ? preview - value : 0;
          return (
            <div key={row.key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span>{row.label}</span>
                <strong>{preview ?? value}% {delta !== 0 && <span style={{ color: getDeltaColor(row.key, delta) }}>({delta > 0 ? "+" : ""}{delta})</span>}</strong>
              </div>
              <div style={{ position: "relative", height: 9, borderRadius: 999, background: "rgba(148,163,184,0.18)", overflow: "hidden" }}>
                <div style={{ width: `${value}%`, height: "100%", background: getStatusBarColor(row.key, value), opacity: 0.72 }} />
                {preview != null && delta !== 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: `${preview}%`,
                      height: "100%",
                      background: delta > 0 ? "rgba(34,197,94,0.55)" : "rgba(251,113,133,0.55)",
                      mixBlendMode: "screen",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const HypothesisChips = () => {
  const items = [
    {
      label: "مانور عادی",
      description: "ممکن است تغییر مسیر ناشی از اصلاح مداری، محدودیت فنی یا رفتار غیرخصمانه باشد.",
    },
    {
      label: "تست آستانه واکنش",
      description: "طرف مقابل ممکن است عمداً بسنجد شما به چه رفتارهایی و با چه شدتی واکنش نشان می‌دهید.",
    },
    {
      label: "الگوی راهبردی",
      description: "رفتار فعلی ممکن است بخشی از روند بلندمدت برای شناخت اولویت‌ها، حساسیت‌ها و ظرفیت رصدی شما باشد.",
    },
  ];
  return (
    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
      {items.map((item) => (
        <span
          key={item.label}
          title={item.description}
          style={{
            border: "1px solid rgba(56,189,248,0.42)",
            borderRadius: 999,
            padding: "0.2rem 0.55rem",
            background: "rgba(8,47,73,0.34)",
            color: "#dff7ff",
            fontSize: "0.78rem",
            cursor: "help",
          }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
};

const DecisionPanel = ({
  round,
  selectedOptionId,
  confirmedOption,
  onSelectOption,
  onPreviewOption,
  onConfirm,
}: {
  round: ScenarioRound;
  selectedOptionId: string | null;
  confirmedOption: DecisionOption | null;
  onSelectOption: (optionId: string) => void;
  onPreviewOption: (optionId: string) => void;
  onConfirm: () => void;
}) => (
  <Card>
    <div style={{ display: "grid", gap: "0.8rem" }}>
      <div>
        <h3 style={{ margin: 0 }}>{round.title}</h3>
        <p style={{ lineHeight: 1.72, marginBottom: 0, fontSize: "0.94rem", textAlign: "justify" }}>{round.narrative}</p>
        {round.id === "round_2_interpretation" ? <HypothesisChips /> : round.sceneIntro && <p className="hint">{round.sceneIntro}</p>}
      </div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {round.options.map((option) => {
          const meta = getOptionUiMeta(option);
          const selected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onMouseEnter={() => onPreviewOption(option.id)}
              onClick={() => onSelectOption(option.id)}
              disabled={Boolean(confirmedOption)}
              style={{
                border: selected ? "1px solid var(--accent)" : `1px solid ${meta.border}`,
                borderRadius: 15,
                background: selected ? "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(15,23,42,0.92))" : "rgba(15,23,42,0.76)",
                color: "var(--text-main)",
                padding: "0.7rem",
                textAlign: "right",
                cursor: confirmedOption ? "default" : "pointer",
                boxShadow: selected ? "0 0 0 1px rgba(56,189,248,0.3), 0 12px 28px rgba(8,47,73,0.28)" : "none",
              }}
            >
              <div>
                <span style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "center" }}>
                  <strong>{option.label}</strong>
                  <small style={{ color: meta.color, border: `1px solid ${meta.border}`, borderRadius: 999, padding: "0.1rem 0.45rem", whiteSpace: "nowrap" }}>{meta.label}</small>
                </span>
                <span style={{ color: "var(--text-muted)", marginTop: "0.32rem", lineHeight: 1.55, display: "block", fontSize: "0.86rem", textAlign: "justify" }}>{option.description}</span>
              </div>
            </button>
          );
        })}
      </div>
      {!confirmedOption && (
        <button className={`primary ${selectedOptionId ? "s1-confirm-ready" : ""}`} onClick={onConfirm} disabled={!selectedOptionId}>تأیید تصمیم</button>
      )}
    </div>
  </Card>
);

const FeedbackModal = ({
  option,
  isLastRound,
  warningText,
  onContinue,
  onClose,
}: {
  option: DecisionOption;
  isLastRound: boolean;
  warningText?: string;
  onContinue: () => void;
  onClose: () => void;
}) => {
  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(2, 6, 23, 0.34  )",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(620px, calc(100vw - 2rem))",
          maxHeight: "calc(100vh - 2rem)",
          overflow: "auto",
          border: "1px solid var(--border-soft)",
          borderRadius: 18,
          background: "rgba(15, 23, 42, 0.1)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.38)",
          padding: "1.2rem",
          direction: "rtl",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>بازخورد تصمیم</h3>
          <button onClick={onClose} style={{ padding: "0.35rem 0.7rem" }}>✕</button>
        </div>
        <p style={{ lineHeight: 1.9, margin: "1rem 0" }}>{option.outcome.feedbackText}</p>
        {warningText && (
          <p
            style={{
              margin: "0 0 1rem",
              color: "#fca5a5",
              fontWeight: 900,
              lineHeight: 1.8,
            }}
          >
            ({warningText})
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button className="primary" onClick={onContinue}>
            {isLastRound ? "نمایش جمع‌بندی" : "ادامه به راند بعد"}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
};

const FinalConclusionModal = ({
  summary,
  onShowReport,
}: {
  summary: ScenarioOneCognitiveSummary;
  onShowReport: () => void;
}) => {
  const styleSummary = getDecisionStyleSummaryView(summary);
  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(2, 6, 23, 0.68)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(680px, calc(100vw - 2rem))",
          maxHeight: "calc(100vh - 2rem)",
          overflow: "auto",
          border: "1px solid var(--border-soft)",
          borderRadius: 18,
          background: "rgba(15, 23, 42, 0.98)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
          padding: "1.2rem",
          direction: "rtl",
        }}
      >
        <h3 style={{ margin: 0 }}>نتیجه‌گیری سناریو</h3>
        <p style={{ margin: "0.75rem 0 0", color: getDecisionStyleToneColor(styleSummary.uiTone), fontWeight: 800 }}>{styleSummary.title}</p>
        <p style={{ lineHeight: 1.95, margin: "0.6rem 0 1rem" }}>{styleSummary.text}</p>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button className="primary" onClick={onShowReport}>نمایش گزارش</button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
};

const AutoDecisionModal = ({
  message,
  onContinue,
}: {
  message: string;
  onContinue: () => void;
}) => {
  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(2, 6, 23, 0.68)",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, calc(100vw - 2rem))",
          border: "1px solid rgba(239,68,68,0.52)",
          borderRadius: 18,
          background: "rgba(15, 23, 42, 0.98)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
          padding: "1.2rem",
          direction: "rtl",
        }}
      >
        <h3 style={{ margin: 0 }}>پایان زمان تصمیم‌گیری</h3>
        <p style={{ lineHeight: 1.9, margin: "1rem 0" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button className="primary" onClick={onContinue}>ادامه</button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
};

const EventTimeline = ({ events }: { events: TimelineEvent[] }) => (
  <Card>
    <h3 style={{ marginTop: 0, flex: "0 0 auto" }}>نوار رویدادها</h3>
    <div
      style={{
        display: "grid",
        gap: "0.55rem",
        flex: "0 1 auto",
        maxHeight: events.length > 2 ? 260 : undefined,
        minHeight: 0,
        overflowY: events.length > 2 ? "auto" : "visible",
        paddingInlineEnd: "0.15rem",
        scrollbarGutter: "stable",
      }}
    >
      {events.map((event) => {
        const color = getSeverityColor(event.level);
        return (
          <div
            key={event.id}
            className="s1-event-item"
            style={{
              border: `1px solid ${color}55`,
              borderRight: `4px solid ${color}`,
              borderRadius: 12,
              padding: "0.6rem 0.7rem",
              background: "rgba(15,23,42,0.68)",
              color: "var(--text-main)",
              lineHeight: 1.65,
            }}
          >
            <span>{event.text}</span>
          </div>
        );
      })}
    </div>
  </Card>
);

const InterRoundMapEvents = ({ events }: { events: TimelineEvent[] }) => {
  if (events.length === 0) return null;
  return (
    <div style={{ display: "grid", gap: "0.45rem", marginTop: "0.55rem" }}>
      {events.map((event) => (
        <div
          key={`map-${event.id}`}
          style={{
            border: `1px solid ${getSeverityColor(event.level)}66`,
            borderRadius: 12,
            background: "rgba(15,23,42,0.76)",
            color: "var(--text-main)",
            padding: "0.55rem 0.75rem",
            lineHeight: 1.65,
            fontSize: "0.88rem",
          }}
        >
          <strong style={{ color: getSeverityColor(event.level), marginInlineEnd: "0.4rem" }}>!</strong>
          {event.text.replace("رخداد بین‌راندی: ", "")}
        </div>
      ))}
    </div>
  );
};

function getDecisionStyleSummaryView(
  summary: ScenarioOneCognitiveSummary
): DecisionStyleSummaryView {
  const osi = summary.operationalStrategicIndex;

  if (osi <= -0.75) {
    return {
      band: "strong_operational",
      title: "سبک تصمیم‌گیری بسیار عملیاتی",
      shortLabel: "عملیاتی شدید",
      uiTone: "red",
      text:
        "در این مأموریت، سبک تصمیم‌گیری شما بسیار عملیاتی و واکنشی بود. در بیشتر لحظه‌ها، تهدید فوری، آمادگی سریع و اقدام مستقیم برای شما اولویت اصلی داشت. این سبک در موقعیت‌های بحرانی می‌تواند سرعت واکنش را بالا ببرد، اما اگر با تحلیل مرحله بعد همراه نشود، ممکن است ریسک تشدید تنش یا آشکار شدن الگوی رفتاری را افزایش دهد.",
    };
  }

  if (osi <= -0.35) {
    return {
      band: "operational",
      title: "سبک تصمیم‌گیری عملیاتی",
      shortLabel: "عملیاتی",
      uiTone: "amber",
      text:
        "در این مأموریت، تصمیم‌های شما بیشتر عملیاتی بود. یعنی معمولاً به حفظ آمادگی، کنترل فوری وضعیت و پاسخ سریع به رفتار ماهواره ناشناس توجه کردید. این رویکرد برای مدیریت تهدید نزدیک مفید است، اما در بازی جنگ فضایی باید مراقب بود که واکنش‌های آشکار، فرصت برداشت اطلاعاتی به طرف مقابل ندهد.",
    };
  }

  if (osi <= -0.10) {
    return {
      band: "slightly_operational",
      title: "تمایل ملایم به تصمیم‌گیری عملیاتی",
      shortLabel: "متمایل به عملیاتی",
      uiTone: "amber",
      text:
        "در این مأموریت، سبک تصمیم‌گیری شما کمی به سمت عملیاتی متمایل بود. در چند موقعیت، اقدام سریع و حفظ آمادگی را به جمع‌آوری اطلاعات بیشتر یا کنترل تنش ترجیح دادید. این تعادل می‌تواند در بحران‌های کوتاه‌مدت مفید باشد، اما بهتر است در تصمیم‌های بعدی، پیامدهای مرحله دوم و رفتار احتمالی طرف مقابل هم بیشتر در نظر گرفته شود.",
    };
  }

  if (osi < 0.10) {
    return {
      band: "balanced",
      title: "سبک تصمیم‌گیری ترکیبی",
      shortLabel: "ترکیبی",
      uiTone: "cyan",
      text:
        "در این مأموریت، سبک تصمیم‌گیری شما ترکیبی و نسبتاً متعادل بود. در بعضی موقعیت‌ها سریع و عملیاتی تصمیم گرفتید و در بعضی موقعیت‌ها به اطلاعات بیشتر، رفتار طرف مقابل و پیامدهای بعدی توجه کردید. این سبک در بازی جنگ فضایی می‌تواند مؤثر باشد، به‌شرطی که بدانید چه زمانی باید سریع عمل کرد و چه زمانی باید تصویر بزرگ‌تر را دید.",
    };
  }

  if (osi < 0.35) {
    return {
      band: "slightly_strategic",
      title: "تمایل به تصمیم‌گیری راهبردی",
      shortLabel: "متمایل به راهبردی",
      uiTone: "blue",
      text:
        "در این مأموریت، سبک تصمیم‌گیری شما کمی به سمت راهبردی متمایل بود. معمولاً تلاش کردید قبل از اقدام مستقیم، ابهام را کاهش دهید و رفتار طرف مقابل را بهتر بفهمید. این رویکرد به کنترل تنش و کاهش خطای تصمیم کمک می‌کند، اما در شرایطی که پنجره واکنش کوتاه است، باید مراقب از دست رفتن زمان عملیاتی هم بود.",
    };
  }

  if (osi < 0.75) {
    return {
      band: "strategic",
      title: "سبک تصمیم‌گیری راهبردی",
      shortLabel: "راهبردی",
      uiTone: "blue",
      text:
        "در این مأموریت، تصمیم‌های شما بیشتر راهبردی بود. یعنی به‌جای واکنش فوری در همه موقعیت‌ها، به جمع‌آوری اطلاعات، پیامدهای مرحله بعد، کنترل تنش و مدل‌سازی رفتار طرف مقابل توجه کردید. این سبک برای تحلیل بازی جنگ فضایی ارزشمند است، اما اگر بیش از حد ادامه پیدا کند، ممکن است سرعت واکنش عملیاتی را کاهش دهد.",
    };
  }

  return {
    band: "strong_strategic",
    title: "سبک تصمیم‌گیری بسیار راهبردی",
    shortLabel: "راهبردی شدید",
    uiTone: "violet",
    text:
      "در این مأموریت، سبک تصمیم‌گیری شما بسیار راهبردی و آینده‌نگر بود. در بیشتر تصمیم‌ها، تلاش کردید رفتار طرف مقابل، پیامدهای بعدی، کنترل تنش و ریسک افشای اطلاعات را در نظر بگیرید. این سبک برای ساختن تصویر کلان و جلوگیری از سوءبرداشت بسیار مهم است، اما در وضعیت‌های فوری باید مراقب بود که تحلیل زیاد باعث تأخیر در اقدام ضروری نشود.",
  };
}

const getFinalNarrativeOutcomeTitle = (label: FinalNarrativeOutcomeLabel) => {
  const titles: Record<FinalNarrativeOutcomeLabel, string> = {
    major_information_compromise: "شکست اطلاعاتی شدید",
    limited_information_compromise: "شکست اطلاعاتی محدود",
    information_control_success: "موفقیت در کنترل اطلاعاتی",
    uncontrolled_escalation: "تشدید کنترل‌نشده بحران",
    high_readiness_high_tension: "آمادگی بالا همراه با تنش بالا",
    strategic_information_opportunity: "فرصت اطلاعاتی راهبردی",
    calm_crisis_control: "کنترل آرام بحران",
    remaining_ambiguity: "باقی‌ماندن ابهام",
    mixed_crisis_containment: "مهار نسبی بحران",
  };
  return titles[label];
};

const ScenarioOneSummary = ({
  summary,
  finalStatus,
  onComplete,
}: {
  summary: ScenarioOneCognitiveSummary;
  finalStatus: MissionStatus;
  onComplete: () => void;
}) => {
  const styleSummary = getDecisionStyleSummaryView(summary);
  const styleToneColor = getDecisionStyleToneColor(styleSummary.uiTone);
  const speed = summary.avgResponseTimeMs <= 3000 ? "سریع" : summary.avgResponseTimeMs <= 8000 ? "متوسط" : "کند";
  const changes = summary.totalChangedAnswerCount <= 1 ? "کم" : summary.totalChangedAnswerCount <= 4 ? "متوسط" : "زیاد";
  const adversary = summary.adversaryModelingScore < 0.2 ? "کم" : summary.adversaryModelingScore < 0.6 ? "متوسط" : "زیاد";
  const outcomeIcon = styleSummary.band.includes("operational") ? "⚡" : styleSummary.band.includes("strategic") ? "✎" : "◎";
  const finalOutcomeTitle = getFinalNarrativeOutcomeTitle(summary.finalNarrativeOutcomeLabel);
  const informationExposureText =
    summary.informationCompromiseLevel === "major"
      ? "ریسک افشای اطلاعات در این مأموریت بالا بود. طرف مقابل احتمالاً توانسته از واکنش‌ها، مسیرهای تصمیم‌گیری یا حساسیت‌های مأموریت شما سرنخ‌هایی برداشت کند."
      : summary.informationCompromiseLevel === "limited"
        ? "در این مأموریت بخشی از الگوی رفتاری یا حساسیت‌های عملیاتی شما قابل برداشت شد. این به معنی شکست کامل نیست، اما نشان می‌دهد برخی تصمیم‌ها ردپای اطلاعاتی ایجاد کرده‌اند."
        : "ریسک افشای اطلاعات در این مأموریت کنترل شد. تصمیم‌های شما باعث نشد الگوی رفتاری یا ظرفیت مأموریت به‌صورت جدی آشکار شود.";
  const snapshotRows: Array<{ label: string; value: number; color: string }> = [
    { label: "پوشش اطلاعاتی", value: finalStatus.infoCoverage, color: "#38bdf8" },
    { label: "ریسک تنش", value: finalStatus.escalationRisk, color: "#fb923c" },
    { label: "ابهام", value: finalStatus.ambiguity, color: "#f97316" },
    { label: "منابع باقی‌مانده", value: finalStatus.remainingResources, color: "#22c55e" },
    { label: "ریسک افشا", value: finalStatus.informationExposureRisk, color: finalStatus.informationExposureRisk < 40 ? "#22c55e" : finalStatus.informationExposureRisk < 65 ? "#f59e0b" : "#ef4444" },
  ];
  return (
    <Card>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.9rem", alignItems: "center" }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", background: `${styleToneColor}24`, border: `1px solid ${styleToneColor}88` }}>
            {outcomeIcon}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>جمع‌بندی سایه‌های مدار پایین</h2>
            <p className="subtitle" style={{ marginTop: "0.25rem" }}>تصویر نهایی مأموریت و سبک تصمیم‌گیری</p>
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${styleToneColor}66`,
            borderRadius: 16,
            padding: "0.9rem",
            background: `${styleToneColor}1f`,
            lineHeight: 1.85,
          }}
        >
          <strong style={{ color: styleToneColor }}>{styleSummary.title}</strong>
          <span style={{ display: "inline-block", marginInlineStart: "0.5rem", color: "var(--text-muted)", fontSize: "0.86rem" }}>
            {styleSummary.shortLabel}
          </span>
          <p style={{ lineHeight: 1.9, margin: "0.45rem 0 0" }}>{styleSummary.text}</p>
        </div>
        <div
          style={{
            border: "1px solid rgba(56,189,248,0.38)",
            borderRadius: 16,
            padding: "0.9rem",
            background: "rgba(8,47,73,0.24)",
            lineHeight: 1.85,
          }}
        >
          <strong>خروجی روایی مأموریت</strong>
          <p style={{ margin: "0.45rem 0 0" }}>
            <strong>{finalOutcomeTitle}:</strong>
            {" "}
            {summary.finalNarrativeOutcome}
          </p>
        </div>
        <div
          style={{
            border: "1px solid rgba(245,158,11,0.38)",
            borderRadius: 16,
            padding: "0.9rem",
            background: "rgba(120,53,15,0.18)",
            lineHeight: 1.85,
          }}
        >
          <strong>ریسک افشای اطلاعات</strong>
          <p style={{ margin: "0.45rem 0 0" }}>{informationExposureText}</p>
        </div>
        <OperationalStrategicScale value={summary.operationalStrategicIndex} bandLabel={styleSummary.shortLabel} tone={styleSummary.uiTone} />
        <div style={{ border: "1px solid rgba(148,163,184,0.35)", borderRadius: 16, padding: "0.9rem", background: "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(8,47,73,0.22))" }}>
          <strong>Snapshot وضعیت نهایی</strong>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.75rem" }}>
            {snapshotRows.map((row) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr 42px", gap: "0.55rem", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>{row.label}</span>
                <div style={{ height: 9, borderRadius: 999, overflow: "hidden", background: "rgba(148,163,184,0.16)" }}>
                  <div style={{ width: `${row.value}%`, height: "100%", background: row.color }} />
                </div>
                <strong>{row.value}%</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="analytics-grid">
          <div className="analytics-stat"><span>شاخص عملیاتی–راهبردی</span><strong>{formatIndex(summary.operationalStrategicIndex)}</strong></div>
          <div className="analytics-stat"><span>برچسب طیفی دقیق</span><strong>{styleSummary.shortLabel}</strong></div>
          <div className="analytics-stat"><span>تعداد راند تصمیم</span><strong>{summary.totalDecisionRounds}</strong></div>
          <div className="analytics-stat"><span>سرعت تصمیم‌گیری</span><strong>{speed}</strong></div>
          <div className="analytics-stat"><span>میزان تغییر پاسخ</span><strong>{changes}</strong></div>
          <div className="analytics-stat"><span>توجه به رفتار طرف مقابل</span><strong>{adversary}</strong></div>
        </div>
        <button className="primary" onClick={onComplete}>پایان سناریو</button>
      </div>
    </Card>
  );
};
