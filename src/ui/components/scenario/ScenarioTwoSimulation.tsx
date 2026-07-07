import { useMemo, useRef, useState } from "react";
import { eventLogger } from "../../../services/analytics/eventLogger";
import type { ResourceState } from "../../../core/types/scenario";
import { ScenarioTwoActionCard } from "./ScenarioTwoActionCard";
import { ScenarioTwoMap } from "./ScenarioTwoMap";
import { ScenarioTwoSummary } from "./ScenarioTwoSummary";
import type {
  ActionCard,
  Convoy,
  MapZone,
  Route,
  ScenarioTwoDecisionRecord,
  ScenarioTwoDecisionWeights,
  ScenarioTwoMetrics,
  ScenarioTwoMissionStatus,
  ScenarioTwoRound,
  ScenarioTwoSummaryData,
  SelectedAction,
} from "./ScenarioTwoTypes";

interface ScenarioTwoSimulationProps {
  scenarioId: string | number;
  nodeId: string;
  userProfileId?: string;
  onCompletionUiActiveChange?: (active: boolean) => void;
  onComplete: () => void;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const initialResources: ResourceState = { satelliteISR: 60, energy: 80, time: 100 };

const initialStatus: ScenarioTwoMissionStatus = {
  logisticsContinuity: 85,
  criticalDelivery: 80,
  navigationIntegrity: 75,
  civilianStability: 90,
  escalationRisk: 20,
  remainingResources: 80,
  ambiguity: 35,
  cumulativeDelay: 0,
  gnssExposureRisk: 25,
};

const initialConvoys: Convoy[] = [
  { id: "convoy_medical", name: "کاروان الف", cargo: "تجهیزات درمانی اضطراری", origin: "تهران", destination: "مشهد", priority: 5, deadline: 5, delay: 0, status: "moving", currentZoneId: "zone_central", routeId: "route_main_east", hasFallbackNav: false, gnssTrustLevel: 70, progress: 18 },
  { id: "convoy_fuel", name: "کاروان ب", cargo: "سوخت عملیاتی", origin: "بندرعباس", destination: "تهران", priority: 4, deadline: 5, delay: 0, status: "moving", currentZoneId: "zone_south", routeId: "route_south", hasFallbackNav: false, gnssTrustLevel: 75, progress: 22 },
  { id: "convoy_comms", name: "کاروان ج", cargo: "قطعات ارتباطی و مخابراتی", origin: "تبریز", destination: "تهران", priority: 4, deadline: 5, delay: 0, status: "moving", currentZoneId: "zone_north", routeId: "route_north", hasFallbackNav: false, gnssTrustLevel: 65, progress: 28 },
  { id: "convoy_supplies", name: "کاروان د", cargo: "پشتیبانی عمومی و تدارکات", origin: "جنوب", destination: "مرکز", priority: 2, deadline: 5, delay: 0, status: "moving", currentZoneId: "zone_south", routeId: "route_south", hasFallbackNav: false, gnssTrustLevel: 80, progress: 35 },
];

const initialZones: MapZone[] = [
  { id: "zone_north", name: "محور شمالی", x: 45, y: 18, threatLevel: "suspicious", gnssDisruption: 45, civilianSensitivity: 30, isRevealed: true },
  { id: "zone_east", name: "محور شرقی", x: 75, y: 42, threatLevel: "jammed", gnssDisruption: 70, civilianSensitivity: 55, isRevealed: false },
  { id: "zone_central", name: "محور مرکزی", x: 50, y: 50, threatLevel: "unknown", gnssDisruption: 55, civilianSensitivity: 70, isRevealed: false },
  { id: "zone_south", name: "محور جنوبی", x: 40, y: 78, threatLevel: "safe", gnssDisruption: 20, civilianSensitivity: 45, isRevealed: true },
];

const routes: Route[] = [
  { id: "route_main_east", name: "Route A — مسیر اصلی شرق", fromZoneId: "zone_central", toZoneId: "zone_east", travelCost: 8, delayRisk: 35, gnssRisk: 70, civilianImpact: 45, visualStatus: "danger" },
  { id: "route_north_alt", name: "Route B — جایگزین شمالی", fromZoneId: "zone_central", toZoneId: "zone_north", travelCost: 14, delayRisk: 28, gnssRisk: 28, civilianImpact: 32, visualStatus: "safe" },
  { id: "route_central_alt", name: "Route C — مسیر مرکزی", fromZoneId: "zone_central", toZoneId: "zone_east", travelCost: 10, delayRisk: 30, gnssRisk: 42, civilianImpact: 40, visualStatus: "risky" },
  { id: "route_south", name: "Route D — جنوب به مرکز", fromZoneId: "zone_south", toZoneId: "zone_central", travelCost: 12, delayRisk: 42, gnssRisk: 35, civilianImpact: 48, visualStatus: "risky" },
  { id: "route_north", name: "Route E — شمال غرب", fromZoneId: "zone_north", toZoneId: "zone_central", travelCost: 10, delayRisk: 30, gnssRisk: 35, civilianImpact: 30, visualStatus: "safe" },
  { id: "route_shadow", name: "مسیر خاکستری دشمن", fromZoneId: "zone_north", toZoneId: "zone_east", travelCost: 7, delayRisk: 52, gnssRisk: 78, civilianImpact: 62, visualStatus: "unknown" },
];

const zeroWeights: ScenarioTwoDecisionWeights = {
  logisticsWeight: 0,
  criticalDeliveryWeight: 0,
  delayControlWeight: 0,
  resourceEfficiencyWeight: 0,
  navigationIntegrityWeight: 0,
  civilianImpactWeight: 0,
  escalationWeight: 0,
  infoSeekingWeight: 0,
  secondOrderThinkingWeight: 0,
  adversaryModelingWeight: 0,
  cognitiveFlexibilityWeight: 0,
};

const makeAction = (action: ActionCard) => action;

const actionCatalog: Record<string, ActionCard> = {
  action_isr_scan: makeAction({
    id: "action_isr_scan",
    title: "اول اختلال را تأیید کن",
    subtitle: "بررسی ISR روی محور مشکوک برای آشکارسازی spoofing",
    description: "قبل از حرکت یا تغییر مسیر، یک گذر سریع ISR انجام می‌دهید تا مشخص شود اختلاف GNSS واقعی است یا خطای گزارش میدانی.",
    expectedResult: "ابهام عملیاتی کم می‌شود و سلامت ناوبری بهتر می‌شود.",
    mapEffect: "ناحیه هدف با sweep دایره‌ای scan می‌شود و fog-of-war کمتر می‌شود.",
    riskText: "اگر دیر انجام شود، زمان تحویل کاروان الف از دست می‌رود.",
    missionImpact: "متوسط",
    objectiveTags: ["کاهش ابهام", "تشخیص GNSS آلوده"],
    category: "diagnosis",
    cost: { satelliteISR: 20, time: 8 },
    effects: { ambiguity: -20, navigationIntegrity: 10 },
    requirements: { satelliteISR: 20, time: 8 },
    targetType: "zone",
    weights: { logisticsWeight: 4, criticalDeliveryWeight: 3, delayControlWeight: -2, resourceEfficiencyWeight: 3, navigationIntegrityWeight: 8, civilianImpactWeight: 1, escalationWeight: -1, infoSeekingWeight: 9, secondOrderThinkingWeight: 5, adversaryModelingWeight: 3, cognitiveFlexibilityWeight: 4 },
  }),
  action_fallback_nav: makeAction({
    id: "action_fallback_nav",
    title: "کاروان الف را از GNSS جدا کن",
    subtitle: "فعال‌سازی ناوبری پشتیبان برای کاهش ریسک spoofing",
    description: "کاروان انتخاب‌شده از اتکای مستقیم به GNSS جدا می‌شود و با ناوبری پشتیبان ادامه می‌دهد.",
    expectedResult: "ریسک GNSS کم می‌شود و شانس رسیدن کاروان حیاتی بالا می‌رود.",
    mapEffect: "آیکون کاروان badge NAV و glow آبی می‌گیرد.",
    riskText: "انرژی مصرف می‌کند و اگر دیر انتخاب شود ممکن است برای اصلاح مسیر کافی نباشد.",
    missionImpact: "زیاد",
    objectiveTags: ["نجات کاروان حیاتی", "کاهش ریسک GNSS"],
    category: "navigation",
    cost: { energy: 15, time: 4 },
    effects: { criticalDelivery: 12, gnssExposureRisk: -15, navigationIntegrity: 8 },
    requirements: { energy: 15, time: 4 },
    targetType: "convoy",
    weights: { logisticsWeight: 6, criticalDeliveryWeight: 9, delayControlWeight: 3, resourceEfficiencyWeight: 4, navigationIntegrityWeight: 8, civilianImpactWeight: 2, escalationWeight: -2, infoSeekingWeight: 1, secondOrderThinkingWeight: 6, adversaryModelingWeight: 2, cognitiveFlexibilityWeight: 5 },
  }),
  action_reroute_convoy: makeAction({
    id: "action_reroute_convoy",
    title: "کاروان الف را از مسیر آلوده خارج کن",
    subtitle: "تغییر مسیر از محور شرق به مسیر جایگزین امن‌تر",
    description: "کاروان هدف از مسیر فعلی خارج می‌شود و وارد مسیر جایگزین می‌گردد تا از محدوده spoofing دور شود.",
    expectedResult: "ریسک GNSS کم می‌شود، اما تأخیر و مصرف انرژی بالا می‌رود.",
    mapEffect: "مسیر قبلی کم‌رنگ و مسیر جدید با خط روشن فعال می‌شود.",
    riskText: "اگر مسیر جایگزین بررسی نشده باشد، دشمن ممکن است در راند بعد آن را مختل کند.",
    missionImpact: "زیاد",
    objectiveTags: ["تحویل مأموریت اصلی", "اصلاح مسیر"],
    category: "logistics",
    cost: { energy: 10, time: 6 },
    effects: { logisticsContinuity: 5, cumulativeDelay: 6, gnssExposureRisk: -8 },
    requirements: { energy: 10, time: 6 },
    targetType: "route",
    weights: { logisticsWeight: 7, criticalDeliveryWeight: 6, delayControlWeight: -3, resourceEfficiencyWeight: 3, navigationIntegrityWeight: 5, civilianImpactWeight: 2, escalationWeight: -2, infoSeekingWeight: 1, secondOrderThinkingWeight: 6, adversaryModelingWeight: 4, cognitiveFlexibilityWeight: 6 },
  }),
  action_continue_gnss: makeAction({
    id: "action_continue_gnss",
    title: "ریسک کن و سرعت را حفظ کن",
    subtitle: "ادامه مسیر بر اساس GNSS بدون مصرف منابع",
    description: "کاروان‌ها طبق GNSS ادامه می‌دهند و منابع مصرف نمی‌شود، اما اگر داده آلوده باشد تصمیم شما به انحراف نزدیک می‌شود.",
    expectedResult: "progress سریع‌تر می‌شود و منابع حفظ می‌شوند.",
    mapEffect: "کاروان روی مسیر فعلی جلو می‌رود؛ اگر مسیر آلوده باشد هاله هشدار ظاهر می‌شود.",
    riskText: "در ابهام بالا می‌تواند ریسک GNSS و احتمال compromised شدن کاروان الف را زیاد کند.",
    missionImpact: "پرریسک",
    objectiveTags: ["حفظ زمان و منابع", "ریسک انحراف"],
    category: "risky",
    cost: {},
    effects: { gnssExposureRisk: 15, ambiguity: 8 },
    targetType: "global",
    weights: { logisticsWeight: 2, criticalDeliveryWeight: -2, delayControlWeight: 8, resourceEfficiencyWeight: 5, navigationIntegrityWeight: -8, civilianImpactWeight: -2, escalationWeight: 5, infoSeekingWeight: -6, secondOrderThinkingWeight: -5, adversaryModelingWeight: -3, cognitiveFlexibilityWeight: -4 },
  }),
  action_pause_low_priority: makeAction({
    id: "action_pause_low_priority",
    title: "کاروان کم‌اولویت را قربانی کن",
    subtitle: "توقف موقت کاروان د یا کاروان کم‌اهمیت برای حفظ تمرکز عملیاتی",
    description: "یک کاروان کم‌اولویت موقتاً متوقف می‌شود تا فشار عملیاتی، ریسک و مصرف منابع برای کاروان‌های حیاتی کنترل شود.",
    expectedResult: "منابع و تمرکز برای کاروان الف بهتر حفظ می‌شود.",
    mapEffect: "کاروان هدف badge PAUSED می‌گیرد و روی نقشه ثابت می‌ماند.",
    riskText: "پیوستگی لجستیک و زمان‌بندی کاروان متوقف‌شده آسیب می‌بیند.",
    missionImpact: "متوسط",
    objectiveTags: ["حفظ منابع", "اولویت‌دهی به کاروان الف"],
    category: "logistics",
    cost: { time: 5 },
    effects: { logisticsContinuity: -4, civilianStability: 4, escalationRisk: -3 },
    requirements: { time: 5 },
    targetType: "convoy",
    weights: { logisticsWeight: -2, criticalDeliveryWeight: 4, delayControlWeight: -3, resourceEfficiencyWeight: 7, navigationIntegrityWeight: 2, civilianImpactWeight: 4, escalationWeight: -4, infoSeekingWeight: 1, secondOrderThinkingWeight: 5, adversaryModelingWeight: 2, cognitiveFlexibilityWeight: 4 },
  }),
  action_route_diversity: makeAction({
    id: "action_route_diversity",
    title: "مسیرها را پخش کن",
    subtitle: "کاهش پیش‌بینی‌پذیری شبکه برای دشمن",
    description: "کاروان‌ها در مسیرهای متفاوت پخش می‌شوند تا دشمن نتواند با یک موج اختلال همه شبکه را هدف بگیرد.",
    expectedResult: "پایداری شبکه و مدل‌سازی دشمن بهتر می‌شود.",
    mapEffect: "چند مسیر هم‌زمان روشن می‌شوند و کاروان‌ها از تمرکز خارج می‌شوند.",
    riskText: "زمان و انرژی مصرف می‌شود و ممکن است کاروان الف کمتر تقویت شود.",
    missionImpact: "متوسط",
    objectiveTags: ["حفظ شبکه", "کاهش پیش‌بینی‌پذیری"],
    category: "deception",
    cost: { energy: 12, time: 8 },
    effects: { logisticsContinuity: 8, escalationRisk: -6, gnssExposureRisk: -6 },
    requirements: { energy: 12, time: 8 },
    targetType: "global",
    weights: { logisticsWeight: 8, criticalDeliveryWeight: 5, delayControlWeight: -2, resourceEfficiencyWeight: 4, navigationIntegrityWeight: 4, civilianImpactWeight: 2, escalationWeight: -5, infoSeekingWeight: 1, secondOrderThinkingWeight: 7, adversaryModelingWeight: 9, cognitiveFlexibilityWeight: 7 },
  }),
  action_signal_analysis: makeAction({
    id: "action_signal_analysis",
    title: "عملیات را کند کن و منتظر تحلیل بمان",
    subtitle: "تحلیل ناسازگاری GNSS و گزارش میدانی پیش از تصمیم پرریسک",
    description: "سرعت عملیات کمی کم می‌شود تا تحلیل سیگنال تصویر دقیق‌تری از spoofing یا jamming بدهد.",
    expectedResult: "ابهام و ریسک GNSS کاهش می‌یابد، اما زمان از دست می‌رود.",
    mapEffect: "لایه تحلیل روی ناحیه هدف فعال می‌شود و حرکت کاروان کندتر می‌شود.",
    riskText: "اگر پنجره تحویل تنگ باشد، تأخیر تحلیلی می‌تواند مأموریت اصلی را تهدید کند.",
    missionImpact: "متوسط",
    objectiveTags: ["کاهش ابهام", "تأیید مستقل داده"],
    category: "diagnosis",
    cost: { satelliteISR: 8, time: 10 },
    effects: { ambiguity: -14, navigationIntegrity: 6, gnssExposureRisk: -6 },
    requirements: { satelliteISR: 8, time: 10 },
    targetType: "zone",
    weights: { logisticsWeight: 3, criticalDeliveryWeight: 3, delayControlWeight: -4, resourceEfficiencyWeight: 4, navigationIntegrityWeight: 7, civilianImpactWeight: 1, escalationWeight: -2, infoSeekingWeight: 8, secondOrderThinkingWeight: 6, adversaryModelingWeight: 6, cognitiveFlexibilityWeight: 5 },
  }),
  action_civil_coordination: makeAction({
    id: "action_civil_coordination",
    title: "فشار مدنی را کنترل کن",
    subtitle: "هماهنگی با مدیریت بحران برای عبور امن‌تر مسیرهای شهری",
    description: "مسیرهای حساس مدنی هماهنگ می‌شوند تا اختلال لجستیک به بحران خدمات حیاتی تبدیل نشود.",
    expectedResult: "پایداری مدنی بهتر می‌شود و ریسک تشدید کاهش می‌یابد.",
    mapEffect: "روی مناطق شهری نشان هماهنگی/حفاظت نمایش داده می‌شود.",
    riskText: "زمان و انرژی مصرف می‌کند و بخشی از سرعت لجستیک را کم می‌کند.",
    missionImpact: "متوسط",
    objectiveTags: ["پایداری مدنی", "کاهش ریسک تشدید"],
    category: "civilian",
    cost: { time: 7, energy: 6 },
    effects: { civilianStability: 10, escalationRisk: -4, logisticsContinuity: -2 },
    requirements: { time: 7, energy: 6 },
    targetType: "zone",
    weights: { logisticsWeight: -1, criticalDeliveryWeight: 1, delayControlWeight: -3, resourceEfficiencyWeight: 3, navigationIntegrityWeight: 1, civilianImpactWeight: 9, escalationWeight: -5, infoSeekingWeight: 2, secondOrderThinkingWeight: 7, adversaryModelingWeight: 3, cognitiveFlexibilityWeight: 4 },
  }),
  action_preserve_resources: makeAction({
    id: "action_preserve_resources",
    title: "ذخیره عملیاتی نگه دار",
    subtitle: "حفظ منابع برای پنجره نهایی تحویل",
    description: "از اقدام سنگین فوری پرهیز می‌کنید تا برای راند نهایی هنوز ظرفیت اصلاح مسیر یا نجات کاروان الف باقی بماند.",
    expectedResult: "کارایی منابع بهتر می‌شود، اما اثر فوری محدود است.",
    mapEffect: "حرکت نقشه محافظه‌کارانه ادامه پیدا می‌کند و اقدام نمایشی بزرگی رخ نمی‌دهد.",
    riskText: "اگر وضعیت کاروان الف بحرانی باشد، محافظه‌کاری بیش از حد می‌تواند دیر شود.",
    missionImpact: "کم",
    objectiveTags: ["مدیریت منابع", "آمادگی راند نهایی"],
    category: "command",
    cost: {},
    effects: { remainingResources: 5, logisticsContinuity: -2 },
    targetType: "global",
    weights: { logisticsWeight: -1, criticalDeliveryWeight: 1, delayControlWeight: -1, resourceEfficiencyWeight: 8, navigationIntegrityWeight: 1, civilianImpactWeight: 1, escalationWeight: -2, infoSeekingWeight: 0, secondOrderThinkingWeight: 8, adversaryModelingWeight: 5, cognitiveFlexibilityWeight: 5 },
  }),
  action_all_in_critical: makeAction({
    id: "action_all_in_critical",
    title: "همه توان روی کاروان الف",
    subtitle: "مصرف ظرفیت باقی‌مانده برای رساندن محموله درمانی",
    description: "بیشترین ظرفیت باقی‌مانده برای نجات کاروان الف مصرف می‌شود و سایر بخش‌های شبکه آسیب می‌بینند.",
    expectedResult: "احتمال تحویل کاروان الف بالا می‌رود.",
    mapEffect: "کاروان الف با highlight قوی به سمت مشهد حرکت نهایی می‌کند.",
    riskText: "شبکه لجستیک، پایداری مدنی و منابع باقی‌مانده آسیب جدی می‌بینند.",
    missionImpact: "زیاد",
    objectiveTags: ["نجات کاروان الف", "تحویل نهایی"],
    category: "logistics",
    cost: { energy: 20, time: 10, satelliteISR: 10 },
    effects: { criticalDelivery: 20, logisticsContinuity: -10, civilianStability: -6, remainingResources: -15 },
    requirements: { energy: 20, time: 10, satelliteISR: 10 },
    targetType: "convoy",
    weights: { logisticsWeight: -3, criticalDeliveryWeight: 10, delayControlWeight: 4, resourceEfficiencyWeight: -4, navigationIntegrityWeight: 3, civilianImpactWeight: -5, escalationWeight: 4, infoSeekingWeight: 1, secondOrderThinkingWeight: 2, adversaryModelingWeight: 1, cognitiveFlexibilityWeight: 3 },
  }),
  action_distribute_resources: makeAction({
    id: "action_distribute_resources",
    title: "تحویل کنترل‌شده و حفظ شبکه",
    subtitle: "تقسیم منابع بین کاروان الف و شبکه پشتیبانی",
    description: "منابع باقی‌مانده به جای تمرکز کامل روی یک نقطه، بین کاروان حیاتی و شبکه پشتیبانی تقسیم می‌شود.",
    expectedResult: "شبکه پایدارتر می‌ماند و کاروان الف هم پشتیبانی محدود می‌گیرد.",
    mapEffect: "کاروان الف و چند کاروان دیگر هم‌زمان حرکت کنترل‌شده می‌گیرند.",
    riskText: "اگر کاروان الف خیلی عقب باشد، این تصمیم ممکن است برای تحویل نهایی کافی نباشد.",
    missionImpact: "متوسط",
    objectiveTags: ["حفظ شبکه", "پایداری مأموریت"],
    category: "command",
    cost: { energy: 16, time: 8, satelliteISR: 6 },
    effects: { logisticsContinuity: 10, criticalDelivery: 5, remainingResources: -8, escalationRisk: -2 },
    requirements: { energy: 16, time: 8, satelliteISR: 6 },
    targetType: "global",
    weights: { logisticsWeight: 8, criticalDeliveryWeight: 5, delayControlWeight: 2, resourceEfficiencyWeight: 2, navigationIntegrityWeight: 3, civilianImpactWeight: 4, escalationWeight: -2, infoSeekingWeight: 1, secondOrderThinkingWeight: 6, adversaryModelingWeight: 4, cognitiveFlexibilityWeight: 6 },
  }),
};

const rounds: ScenarioTwoRound[] = [
  {
    id: "round_1",
    title: "راند ۱ — ناسازگاری اولیه",
    alertLevel: "زرد",
    narrative: "مختصات GNSS کاروان الف را در مسیر اصلی تهران به مشهد نشان می‌دهد، اما گزارش میدانی می‌گوید کاروان از محور امن فاصله گرفته است. هنوز اختلال قابل مدیریت است.",
    operationalProblem: "آیا باید به GNSS اعتماد کنید یا اول داده را تأیید کنید؟",
    roundGoal: "جلوگیری از اعتماد کور به GNSS و تشخیص زودهنگام spoofing.",
    actionIds: ["action_isr_scan", "action_fallback_nav", "action_continue_gnss", "action_signal_analysis", "action_pause_low_priority", "action_civil_coordination"],
    mainActionIds: ["action_isr_scan", "action_fallback_nav", "action_continue_gnss", "action_signal_analysis"],
    supportActionIds: ["action_pause_low_priority", "action_civil_coordination"],
  },
  {
    id: "round_2",
    title: "راند ۲ — انحراف کاروان حیاتی",
    alertLevel: "نارنجی",
    narrative: "کاروان الف در محدوده مشکوک به spoofing قرار گرفته است. اگر مسیر اصلاح نشود، احتمال انحراف و از دست رفتن پنجره تحویل بالا می‌رود.",
    operationalProblem: "آیا باید مسیر کاروان الف را تغییر دهید یا با ناوبری پشتیبان از همان مسیر عبور کنید؟",
    roundGoal: "نجات مسیر کاروان الف پیش از ورود به انحراف بحرانی.",
    actionIds: ["action_reroute_convoy", "action_fallback_nav", "action_isr_scan", "action_pause_low_priority", "action_continue_gnss", "action_signal_analysis"],
    mainActionIds: ["action_reroute_convoy", "action_fallback_nav", "action_signal_analysis", "action_continue_gnss"],
    supportActionIds: ["action_isr_scan", "action_pause_low_priority"],
  },
  {
    id: "round_3",
    title: "راند ۳ — فشار هم‌زمان روی شبکه",
    alertLevel: "نارنجی",
    narrative: "تمرکز کامل روی کاروان الف، شبکه سوخت و ارتباطات را آسیب‌پذیر می‌کند. اما اگر کاروان الف دیر برسد، مأموریت اصلی شکست می‌خورد.",
    operationalProblem: "آیا مأموریت اصلی را اولویت مطلق می‌دهید یا شبکه لجستیک را متعادل نگه می‌دارید؟",
    roundGoal: "تعادل بین نجات کاروان الف و حفظ شبکه سوخت و ارتباطات.",
    actionIds: ["action_fallback_nav", "action_distribute_resources", "action_isr_scan", "action_civil_coordination", "action_route_diversity", "action_pause_low_priority"],
    mainActionIds: ["action_fallback_nav", "action_distribute_resources", "action_pause_low_priority", "action_route_diversity"],
    supportActionIds: ["action_isr_scan", "action_civil_coordination"],
  },
  {
    id: "round_4",
    title: "راند ۴ — واکنش دشمن",
    alertLevel: "قرمز",
    narrative: "دشمن مسیر تصمیم شما را می‌سنجد. اگر مسیرها متمرکز بمانند، اختلال به مسیر جایگزین هم منتقل می‌شود؛ اگر متنوع عمل کرده باشید، اثر دشمن محدودتر می‌ماند.",
    operationalProblem: "آیا تصمیم قبلی را اصلاح می‌کنید یا روی همان الگو ادامه می‌دهید؟",
    roundGoal: "تصمیم تطبیقی و حفظ ظرفیت برای راند نهایی.",
    actionIds: ["action_route_diversity", "action_isr_scan", "action_signal_analysis", "action_reroute_convoy", "action_civil_coordination", "action_preserve_resources", "action_continue_gnss"],
    mainActionIds: ["action_reroute_convoy", "action_preserve_resources", "action_isr_scan", "action_continue_gnss"],
    supportActionIds: ["action_route_diversity", "action_signal_analysis", "action_civil_coordination"],
  },
  {
    id: "round_5",
    title: "راند ۵ — پنجره نهایی تحویل",
    alertLevel: "قرمز",
    narrative: "پنجره تحویل رو به بسته شدن است. تصمیم نهایی شما مشخص می‌کند کاروان الف به مرکز درمانی شرق می‌رسد یا شبکه لجستیک زیر فشار اختلال فرو می‌پاشد.",
    operationalProblem: "آیا همه‌چیز را برای رساندن کاروان الف مصرف می‌کنید یا شبکه را هم حفظ می‌کنید؟",
    roundGoal: "تکمیل مأموریت اصلی با منابع باقی‌مانده.",
    actionIds: ["action_fallback_nav", "action_reroute_convoy", "action_civil_coordination", "action_pause_low_priority", "action_continue_gnss", "action_all_in_critical", "action_distribute_resources"],
    mainActionIds: ["action_all_in_critical", "action_distribute_resources", "action_fallback_nav", "action_continue_gnss"],
    supportActionIds: ["action_reroute_convoy", "action_civil_coordination", "action_pause_low_priority"],
  },
];

const actionTitleById: Record<string, string> = Object.fromEntries(Object.entries(actionCatalog).map(([id, action]) => [id, action.title]));
const roundTitleById: Record<string, string> = Object.fromEntries(rounds.map((round) => [round.id, round.title]));

const mapEffectByActionId: Record<string, string> = {
  action_isr_scan: "ناحیه هدف با sweep شناسایی آشکار شد.",
  action_signal_analysis: "لایه تحلیل سیگنال برای مسیر مشکوک فعال شد.",
  action_fallback_nav: "آیکون کاروان هدف glow آبی و NAV پشتیبان گرفت.",
  action_reroute_convoy: "مسیر قبلی کم‌رنگ و مسیر جایگزین فعال شد.",
  action_continue_gnss: "کاروان‌ها طبق داده GNSS حرکت کردند؛ در مسیر آلوده احتمال انحراف بالا رفت.",
  action_pause_low_priority: "کاروان هدف متوقف شد و delay گرفت.",
  action_route_diversity: "کاروان‌ها روی مسیرهای متفاوت پخش شدند.",
  action_civil_coordination: "مناطق شهری با هماهنگی مدنی پوشش داده شدند.",
  action_preserve_resources: "حرکت فوری محدود شد تا ذخیره عملیاتی حفظ شود.",
  action_all_in_critical: "منابع روی کاروان حیاتی متمرکز شد.",
  action_distribute_resources: "منابع بین چند کاروان پخش شد.",
};

const objectiveEffectByActionId: Record<string, string> = {
  action_isr_scan: "ابهام و ریسک اعتماد کور به GNSS کاهش یافت.",
  action_signal_analysis: "تشخیص اخلال ناوبری دقیق‌تر شد.",
  action_fallback_nav: "احتمال نجات کاروان حیاتی و کنترل ریسک GNSS افزایش یافت.",
  action_reroute_convoy: "شانس خروج کاروان از مسیر آلوده افزایش یافت.",
  action_continue_gnss: "زمان و منابع حفظ شد، اما ریسک GNSS آلوده بالا رفت.",
  action_pause_low_priority: "منابع برای اولویت‌های حیاتی آزاد شد، اما پیوستگی لجستیک کاهش یافت.",
  action_route_diversity: "پیش‌بینی‌پذیری شبکه برای دشمن کاهش یافت.",
  action_civil_coordination: "پایداری مدنی و کنترل تشدید بهتر شد.",
  action_preserve_resources: "ظرفیت راند پایانی حفظ شد.",
  action_all_in_critical: "تحویل کاروان الف تقویت شد، اما شبکه آسیب‌پذیرتر شد.",
  action_distribute_resources: "پایداری شبکه بهتر شد، اما تمرکز روی کاروان الف کمتر شد.",
};

const initialMetrics: ScenarioTwoMetrics = {
  falseGnssRelianceTime: 0,
  isrUsageQuality: 50,
  routeDiversityScore: 45,
  resourceEfficiencyScore: 70,
  secondOrderThinkingScore: 50,
  adversaryModelingScore: 45,
  escalationSensitivityScore: 55,
  informationDisciplineScore: 55,
  cognitiveFlexibilityScore: 50,
  totalChangedActionCount: 0,
  totalPreviewOpenCount: 0,
};

const applyStatusDelta = (
  base: ScenarioTwoMissionStatus,
  delta: Partial<ScenarioTwoMissionStatus>
): ScenarioTwoMissionStatus => ({
  logisticsContinuity: clamp(base.logisticsContinuity + (delta.logisticsContinuity ?? 0)),
  criticalDelivery: clamp(base.criticalDelivery + (delta.criticalDelivery ?? 0)),
  navigationIntegrity: clamp(base.navigationIntegrity + (delta.navigationIntegrity ?? 0)),
  civilianStability: clamp(base.civilianStability + (delta.civilianStability ?? 0)),
  escalationRisk: clamp(base.escalationRisk + (delta.escalationRisk ?? 0)),
  remainingResources: clamp(base.remainingResources + (delta.remainingResources ?? 0)),
  ambiguity: clamp(base.ambiguity + (delta.ambiguity ?? 0)),
  cumulativeDelay: Math.max(0, Math.round(base.cumulativeDelay + (delta.cumulativeDelay ?? 0))),
  gnssExposureRisk: clamp(base.gnssExposureRisk + (delta.gnssExposureRisk ?? 0)),
});

const addResources = (base: ResourceState, delta: Partial<ResourceState>, sign = -1): ResourceState => ({
  satelliteISR: clamp(base.satelliteISR + sign * (delta.satelliteISR ?? 0)),
  energy: clamp(base.energy + sign * (delta.energy ?? 0)),
  time: clamp(base.time + sign * (delta.time ?? 0)),
});

const sumCosts = (items: SelectedAction[]) =>
  items.reduce<Partial<ResourceState>>((sum, item) => ({
    satelliteISR: (sum.satelliteISR ?? 0) + (item.action.cost.satelliteISR ?? 0),
    energy: (sum.energy ?? 0) + (item.action.cost.energy ?? 0),
    time: (sum.time ?? 0) + (item.action.cost.time ?? 0),
  }), {});

const canAfford = (resources: ResourceState, action: ActionCard, selectedActions: SelectedAction[]) => {
  const preview = sumCosts(selectedActions);
  const requirements = action.requirements ?? action.cost;
  if ((requirements.satelliteISR ?? 0) + (preview.satelliteISR ?? 0) > resources.satelliteISR) return "برای اجرای این اقدام، ظرفیت ISR کافی نیست.";
  if ((requirements.energy ?? 0) + (preview.energy ?? 0) > resources.energy) return "برای اجرای این اقدام، انرژی عملیاتی کافی نیست.";
  if ((requirements.time ?? 0) + (preview.time ?? 0) > resources.time) return "برای اجرای این اقدام، زمان عملیاتی کافی نیست.";
  if (selectedActions.length >= 3) return "بودجه اقدام عملیاتی این راند تکمیل شده است.";
  return undefined;
};

const getResourceRiskReason = (resources: ResourceState, action: ActionCard, selectedActions: SelectedAction[]) => {
  const preview = sumCosts(selectedActions);
  const next = addResources(resources, {
    satelliteISR: (preview.satelliteISR ?? 0) + (action.cost.satelliteISR ?? 0),
    energy: (preview.energy ?? 0) + (action.cost.energy ?? 0),
    time: (preview.time ?? 0) + (action.cost.time ?? 0),
  });
  if ((action.cost.satelliteISR ?? 0) > 0 && next.satelliteISR < 25) return "اجرای این اقدام ظرفیت ISR را به سطح بحرانی نزدیک می‌کند.";
  if ((action.cost.energy ?? 0) > 0 && next.energy < 25) return "اجرای این اقدام انرژی عملیاتی را به سطح بحرانی نزدیک می‌کند.";
  if ((action.cost.time ?? 0) > 0 && next.time < 25) return "اجرای این اقدام زمان عملیاتی را به سطح بحرانی نزدیک می‌کند.";
  return undefined;
};

const sumWeights = (items: SelectedAction[]) =>
  items.reduce<ScenarioTwoDecisionWeights>((sum, item) => ({
    logisticsWeight: sum.logisticsWeight + item.action.weights.logisticsWeight,
    criticalDeliveryWeight: sum.criticalDeliveryWeight + item.action.weights.criticalDeliveryWeight,
    delayControlWeight: sum.delayControlWeight + item.action.weights.delayControlWeight,
    resourceEfficiencyWeight: sum.resourceEfficiencyWeight + item.action.weights.resourceEfficiencyWeight,
    navigationIntegrityWeight: sum.navigationIntegrityWeight + item.action.weights.navigationIntegrityWeight,
    civilianImpactWeight: sum.civilianImpactWeight + item.action.weights.civilianImpactWeight,
    escalationWeight: sum.escalationWeight + item.action.weights.escalationWeight,
    infoSeekingWeight: sum.infoSeekingWeight + item.action.weights.infoSeekingWeight,
    secondOrderThinkingWeight: sum.secondOrderThinkingWeight + item.action.weights.secondOrderThinkingWeight,
    adversaryModelingWeight: sum.adversaryModelingWeight + item.action.weights.adversaryModelingWeight,
    cognitiveFlexibilityWeight: sum.cognitiveFlexibilityWeight + item.action.weights.cognitiveFlexibilityWeight,
  }), { ...zeroWeights });

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const riskMetricColor = (value: number) => {
  if (value < 35) return "#22c55e";
  if (value < 65) return "#f59e0b";
  return "#f43f5e";
};

const getMedicalConvoy = (convoys: Convoy[]) => convoys.find((convoy) => convoy.id === "convoy_medical") ?? convoys[0];

const getPrimaryObjectiveStatus = (medical: Convoy): ScenarioTwoSummaryData["primaryObjectiveStatus"] => {
  if (medical.status === "delivered") return medical.delay <= 10 ? "delivered_on_time" : "delivered_delayed";
  if (medical.status === "rerouted" || medical.progress >= 70) return "rerouted_not_delivered";
  if (medical.status === "compromised") return "compromised";
  return "lost";
};

const calculateMissionCompletion = (status: ScenarioTwoMissionStatus, convoys: Convoy[], resources?: ResourceState) => {
  const medical = getMedicalConvoy(convoys);
  const primaryStatus = getPrimaryObjectiveStatus(medical);
  const primaryScoreByStatus: Record<ScenarioTwoSummaryData["primaryObjectiveStatus"], number> = {
    delivered_on_time: 50,
    delivered_delayed: 38,
    rerouted_not_delivered: 22,
    compromised: 8,
    lost: 0,
  };
  const resourceEfficiency = resources ? (resources.satelliteISR + resources.energy + resources.time) / 3 : 50;
  return clamp(
    primaryScoreByStatus[primaryStatus] +
    status.criticalDelivery * 0.2 +
    (100 - status.gnssExposureRisk) * 0.1 +
    status.logisticsContinuity * 0.1 +
    status.civilianStability * 0.05 +
    resourceEfficiency * 0.05
  );
};

const getObjectiveChecks = (status: ScenarioTwoMissionStatus, convoys: Convoy[], resources: ResourceState) => {
  const medical = getMedicalConvoy(convoys);
  const activeConvoys = convoys.filter((convoy) => convoy.status !== "compromised" && convoy.status !== "paused").length;
  return [
    { label: "کاروان الف به مشهد برسد", done: medical.status === "delivered", value: `${medical.progress}%` },
    { label: "حداقل ۲ کاروان فعال بمانند", done: activeConvoys >= 2, value: `${activeConvoys}/4` },
    { label: "ابهام کمتر از ۳۰", done: status.ambiguity < 30, value: `${status.ambiguity}` },
    { label: "ریسک GNSS کمتر از ۴۰", done: status.gnssExposureRisk < 40, value: `${status.gnssExposureRisk}` },
    { label: "پایداری مدنی بالای ۶۰", done: status.civilianStability > 60, value: `${status.civilianStability}` },
    { label: "حداقل یک منبع بالای ۱۵", done: Math.max(resources.satelliteISR, resources.energy, resources.time) >= 15, value: `ISR ${resources.satelliteISR} / ENG ${resources.energy} / TIME ${resources.time}` },
  ];
};

const advanceConvoys = (baseConvoys: Convoy[], routeList: Route[], selectedItems: SelectedAction[]) => {
  let statusDelta: Partial<ScenarioTwoMissionStatus> = {};
  const messages: Array<{ text: string; level: "info" | "success" | "warning" | "critical" }> = [];
  const selectedIds = new Set(selectedItems.map((item) => item.action.id));
  const nextConvoys = baseConvoys.map((convoy) => {
    if (convoy.status === "delivered" || convoy.status === "compromised") return convoy;
    if (convoy.status === "paused") {
      return { ...convoy, delay: convoy.delay + 5, status: "moving" as const };
    }

    const route = routeList.find((entry) => entry.id === convoy.routeId);
    const gnssRisk = route?.gnssRisk ?? 45;
    const isRisky = gnssRisk >= 55;
    const isDanger = gnssRisk >= 68;
    let progressGain = gnssRisk < 35 ? 25 : gnssRisk < 60 ? 15 : 5;
    let delayGain = isDanger ? 10 : isRisky ? 5 : 0;
    let nextStatus: Convoy["status"] = convoy.status;
    let nextGnssTrust = convoy.gnssTrustLevel;

    if (convoy.hasFallbackNav) {
      progressGain = Math.max(progressGain, isDanger ? 15 : 18);
      delayGain = Math.max(0, delayGain - 4);
      nextGnssTrust = clamp(convoy.gnssTrustLevel - 8);
      statusDelta = {
        ...statusDelta,
        gnssExposureRisk: (statusDelta.gnssExposureRisk ?? 0) - 3,
        navigationIntegrity: (statusDelta.navigationIntegrity ?? 0) + 2,
      };
    } else if (isDanger) {
      statusDelta = {
        ...statusDelta,
        gnssExposureRisk: (statusDelta.gnssExposureRisk ?? 0) + (convoy.id === "convoy_medical" ? 8 : 4),
        ambiguity: (statusDelta.ambiguity ?? 0) + 3,
      };
      if (convoy.id === "convoy_medical" && convoy.progress > 45 && !convoy.hasFallbackNav && !selectedIds.has("action_reroute_convoy")) {
        nextStatus = "compromised";
        messages.push({ text: "کاروان الف به‌دلیل ادامه در مسیر آلوده وارد وضعیت انحراف بحرانی شد.", level: "critical" });
      }
    }

    if (convoy.status === "rerouted") {
      progressGain = Math.max(10, progressGain - 4);
      delayGain += 4;
    }

    const nextProgress = clamp(convoy.progress + progressGain);
    if (nextProgress >= 100) {
      nextStatus = "delivered";
      messages.push({
        text: `${convoy.name} به مقصد ${convoy.destination} رسید.`,
        level: convoy.id === "convoy_medical" ? "success" : "info",
      });
    }

    return {
      ...convoy,
      progress: nextProgress,
      delay: convoy.delay + delayGain,
      gnssTrustLevel: nextGnssTrust,
      currentZoneId: route && nextProgress > 55 ? route.toZoneId : convoy.currentZoneId,
      status: nextStatus,
    };
  });

  return { nextConvoys, statusDelta, messages };
};

const alertHelp: Record<ScenarioTwoRound["alertLevel"], string> = {
  زرد: "اختلال اولیه یا ابهام قابل مدیریت؛ هنوز فرصت تشخیص و اصلاح مسیر وجود دارد.",
  نارنجی: "ریسک عملیاتی فعال؛ تأخیر یا انتخاب اشتباه می‌تواند به کاروان‌های حیاتی آسیب بزند.",
  قرمز: "بحران جدی؛ منابع باقی‌مانده و هدف‌گیری دقیق تعیین‌کننده نتیجه مأموریت است.",
};

export const ScenarioTwoSimulation = ({
  scenarioId,
  nodeId,
  userProfileId,
  onCompletionUiActiveChange,
  onComplete,
}: ScenarioTwoSimulationProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [resources, setResources] = useState<ResourceState>(initialResources);
  const [status, setStatus] = useState<ScenarioTwoMissionStatus>(initialStatus);
  const [convoys, setConvoys] = useState<Convoy[]>(initialConvoys);
  const [zones, setZones] = useState<MapZone[]>(initialZones);
  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);
  const [pendingAction, setPendingAction] = useState<ActionCard | null>(null);
  const [selectedConvoyForRoute, setSelectedConvoyForRoute] = useState<string | undefined>();
  const [hoveredAction, setHoveredAction] = useState<ActionCard | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; text: string; level: "info" | "success" | "warning" | "critical" }>>([]);
  const [records, setRecords] = useState<ScenarioTwoDecisionRecord[]>([]);
  const [metrics, setMetrics] = useState<ScenarioTwoMetrics>(initialMetrics);
  const [summary, setSummary] = useState<ScenarioTwoSummaryData | null>(null);
  const [openDrawer, setOpenDrawer] = useState<"convoys" | "mission" | "objectives" | "log" | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<{
    title: string;
    messages: Array<{ text: string; level: "info" | "success" | "warning" | "critical" }>;
    nextRoundIndex?: number;
  } | null>(null);
  const roundStartedAtRef = useRef(now());
  const changedActionCountRef = useRef(0);
  const previewOpenCountRef = useRef(0);

  const currentRound = rounds[roundIndex];
  const mainActions = currentRound.mainActionIds.map((id) => actionCatalog[id]).filter(Boolean);
  const supportActions = currentRound.supportActionIds.map((id) => actionCatalog[id]).filter(Boolean);
  const previewCost = useMemo(() => sumCosts(selectedActions), [selectedActions]);
  const resourcesAfterPreview = useMemo(() => addResources(resources, previewCost), [resources, previewCost]);
  const hasResourcePreview = selectedActions.length > 0;
  const medicalConvoy = getMedicalConvoy(convoys);
  const objectiveChecks = getObjectiveChecks(status, convoys, resources);
  const missionCompletion = calculateMissionCompletion(status, convoys, resources);
  const keyMetrics = [
    { label: "لجستیک", value: status.logisticsContinuity, color: "#22c55e" },
    { label: "تحویل حیاتی", value: status.criticalDelivery, color: "#38bdf8" },
    { label: "ابهام", value: status.ambiguity, color: riskMetricColor(status.ambiguity) },
    { label: "ریسک GNSS", value: status.gnssExposureRisk, color: riskMetricColor(status.gnssExposureRisk) },
  ];

  const addEvent = (text: string, level: "info" | "success" | "warning" | "critical" = "info") => {
    setEvents((prev) => [{ id: `${Date.now()}-${prev.length}`, text, level }, ...prev].slice(0, 12));
  };

  const begin = () => {
    setHasStarted(true);
    roundStartedAtRef.current = now();
    eventLogger.log({
      type: "mini_game_start",
      scenarioId,
      nodeId,
      userId: userProfileId,
      detail: { miniGameId: "s2_gnss_logistics_simulation", totalRounds: rounds.length },
    });
  };

  const addSelectedAction = (action: ActionCard, targetId?: string) => {
    setSelectedActions((prev) => {
      if (prev.some((item) => item.action.id === action.id && item.targetId === targetId)) return prev;
      const isMain = currentRound.mainActionIds.includes(action.id);
      changedActionCountRef.current += 1;
      if (isMain) {
        return [...prev.filter((item) => !currentRound.mainActionIds.includes(item.action.id)), { action, targetId }];
      }
      return [...prev, { action, targetId }];
    });
    setPendingAction(null);
    if (action.targetType !== "route") {
      setSelectedConvoyForRoute(undefined);
    }
    if (action.targetType && action.targetType !== "global") {
      addEvent(`اقدام «${action.title}» روی هدف ${targetId} آماده اجرا شد.`, "info");
    }
  };

  const handlePickAction = (action: ActionCard) => {
    const isMain = currentRound.mainActionIds.includes(action.id);
    const supportCount = selectedActions.filter((item) => currentRound.supportActionIds.includes(item.action.id)).length;
    if (!isMain && supportCount >= 2 && !selectedActions.some((item) => item.action.id === action.id)) {
      addEvent("حداکثر دو اقدام پشتیبان برای هر راند قابل انتخاب است.", "warning");
      return;
    }
    if (pendingAction) {
      addEvent("ابتدا هدف اقدام در حال هدف‌گیری را روی نقشه انتخاب کنید یا هدف‌گیری را لغو کنید.", "warning");
      return;
    }
    previewOpenCountRef.current += 1;
    if (action.targetType && action.targetType !== "global") {
      setPendingAction(action);
      addEvent(`برای «${action.title}» هدف را روی نقشه انتخاب کنید.`, "info");
      return;
    }
    addSelectedAction(action);
  };

  const removeSelectedAction = (actionId: string, targetId?: string) => {
    changedActionCountRef.current += 1;
    setSelectedActions((prev) => prev.filter((item) => !(item.action.id === actionId && item.targetId === targetId)));
  };

  const hasMainDecision = selectedActions.some((item) => currentRound.mainActionIds.includes(item.action.id));
  const supportSelectionCount = selectedActions.filter((item) => currentRound.supportActionIds.includes(item.action.id)).length;

  const getTargetInstruction = () => {
    if (!pendingAction) return "";
    if (pendingAction.targetType === "zone") return "روی یکی از محورهای نقشه کلیک کنید.";
    if (pendingAction.targetType === "convoy") return "روی یکی از کاروان‌ها روی نقشه کلیک کنید.";
    if (pendingAction.targetType === "route") {
      return selectedConvoyForRoute
        ? "حالا مسیر مقصد را روی نقشه انتخاب کنید."
        : "اول یک کاروان را از نقشه یا پنل کاروان‌ها انتخاب کنید، سپس مسیر مقصد را بزنید.";
    }
    return "";
  };
  const renderResourceMeterChip = (key: keyof ResourceState, label: string) => {
    const value = resources[key];
    const nextValue = resourcesAfterPreview[key];
    const delta = previewCost[key] ?? 0;
    const isDanger = nextValue < 20;
    const isWarning = nextValue < 35;
    return (
      <span
        className={`${isDanger ? "danger" : isWarning ? "warning" : ""} ${delta > 0 ? "preview" : ""}`}
        title={delta > 0 ? `بعد از اجرای بسته عملیاتی: ${nextValue} باقی می‌ماند.` : undefined}
      >
        <b>{label}</b>
        <strong>{value}</strong>
        {delta > 0 && (
          <>
            <em>→ {nextValue}</em>
            <small>-{delta}</small>
          </>
        )}
      </span>
    );
  };

  const applyActionSideEffects = (items: SelectedAction[], nextStatus: ScenarioTwoMissionStatus) => {
    let updatedStatus = nextStatus;
    let nextConvoys = convoys.slice();
    let nextZones = zones.slice();
    const nextMetrics = { ...metrics };
    const roundMessages: Array<{ text: string; level: "info" | "success" | "warning" | "critical" }> = [];

    for (const item of items) {
      const targetId = item.targetId;
      if (item.action.id === "action_isr_scan" || item.action.id === "action_signal_analysis") {
        const zone = nextZones.find((entry) => entry.id === targetId);
        if (zone) {
          nextZones = nextZones.map((entry) => entry.id === zone.id ? { ...entry, isRevealed: true } : entry);
          if (zone.gnssDisruption > 50 || nextConvoys.some((convoy) => convoy.currentZoneId === zone.id && convoy.priority >= 4)) {
            updatedStatus = applyStatusDelta(updatedStatus, { ambiguity: -10, navigationIntegrity: 8 });
            nextMetrics.isrUsageQuality = clamp(nextMetrics.isrUsageQuality + 12);
            roundMessages.push({ text: "ISR روی محور پرریسک اجرا شد و ابهام واقعی کاهش یافت.", level: "success" });
          } else {
            updatedStatus = applyStatusDelta(updatedStatus, { remainingResources: -4 });
            nextMetrics.isrUsageQuality = clamp(nextMetrics.isrUsageQuality - 8);
            roundMessages.push({ text: "بخشی از ظرفیت تشخیص روی محور کم‌ریسک مصرف شد.", level: "warning" });
          }
        }
      }

      if (item.action.id === "action_fallback_nav" && targetId) {
        nextConvoys = nextConvoys.map((convoy) => convoy.id === targetId ? { ...convoy, hasFallbackNav: true, gnssTrustLevel: clamp(convoy.gnssTrustLevel - 35), status: convoy.status === "moving" ? "rerouted" : convoy.status } : convoy);
        roundMessages.push({ text: "کاروان منتخب از وابستگی مستقیم به GNSS جدا شد.", level: "success" });
      }

      if (item.action.id === "action_reroute_convoy" && targetId) {
        const route = routes.find((entry) => entry.id === targetId);
        const convoyId = selectedConvoyForRoute ?? nextConvoys.find((convoy) => convoy.priority >= 4 && convoy.status !== "delivered")?.id;
        if (route && convoyId) {
          nextConvoys = nextConvoys.map((convoy) => convoy.id === convoyId ? { ...convoy, routeId: route.id, currentZoneId: route.toZoneId, delay: convoy.delay + route.travelCost, status: "rerouted", gnssTrustLevel: clamp(convoy.gnssTrustLevel - route.gnssRisk / 5) } : convoy);
          updatedStatus = applyStatusDelta(updatedStatus, { cumulativeDelay: Math.round(route.travelCost / 2), civilianStability: -Math.round(route.civilianImpact / 20) });
          roundMessages.push({ text: `مسیر ${route.name} برای یک کاروان فعال شد؛ تأخیر عملیاتی افزایش یافت.`, level: route.gnssRisk > 60 ? "warning" : "success" });
        }
      }

      if (item.action.id === "action_pause_low_priority" && targetId) {
        nextConvoys = nextConvoys.map((convoy) => convoy.id === targetId ? { ...convoy, status: "paused", delay: convoy.delay + 8 } : convoy);
      }

      if (item.action.id === "action_route_diversity") {
        const routeIds = ["route_main_east", "route_south", "route_north", "route_north_alt"];
        nextConvoys = nextConvoys.map((convoy, index) => ({ ...convoy, routeId: routeIds[index] ?? convoy.routeId, status: convoy.status === "moving" ? "rerouted" : convoy.status }));
        nextMetrics.routeDiversityScore = clamp(nextMetrics.routeDiversityScore + 15);
        nextMetrics.adversaryModelingScore = clamp(nextMetrics.adversaryModelingScore + 10);
        roundMessages.push({ text: "تقسیم هوشمند مسیرها پیش‌بینی‌پذیری شبکه را کاهش داد.", level: "success" });
      }

      if (item.action.id === "action_continue_gnss" && status.ambiguity > 45) {
        updatedStatus = applyStatusDelta(updatedStatus, { criticalDelivery: -6, cumulativeDelay: 8, navigationIntegrity: -5 });
        nextMetrics.falseGnssRelianceTime += 1;
        nextMetrics.informationDisciplineScore = clamp(nextMetrics.informationDisciplineScore - 10);
        roundMessages.push({ text: "ادامه اتکا به GNSS در شرایط ابهام بالا، شبکه را آسیب‌پذیرتر کرد.", level: "critical" });
      }
    }

    const continueGnssCount = records.reduce((sum, record) => sum + (record.selectedActionIds.includes("action_continue_gnss") ? 1 : 0), 0) + (items.some((item) => item.action.id === "action_continue_gnss") ? 1 : 0);
    if (continueGnssCount >= 2 && updatedStatus.ambiguity > 45) {
      updatedStatus = applyStatusDelta(updatedStatus, { criticalDelivery: -10, cumulativeDelay: 15, gnssExposureRisk: 20 });
      nextMetrics.falseGnssRelianceTime += 1;
      roundMessages.push({ text: "ادامه اتکا به GNSS در دو راند، باعث انحراف عملیاتی کاروان شد.", level: "critical" });
    }

    if (roundIndex <= 1 && resources.satelliteISR - (previewCost.satelliteISR ?? 0) < 20) {
      updatedStatus = applyStatusDelta(updatedStatus, { ambiguity: 15, navigationIntegrity: -10 });
      nextMetrics.isrUsageQuality = clamp(nextMetrics.isrUsageQuality - 10);
      roundMessages.push({ text: "مصرف زودهنگام ظرفیت ISR توان آشکارسازی موج بعدی را کاهش داد.", level: "warning" });
    }

    const routeCounts = new Map<string, number>();
    nextConvoys.forEach((convoy) => routeCounts.set(convoy.routeId, (routeCounts.get(convoy.routeId) ?? 0) + 1));
    if (Array.from(routeCounts.values()).some((count) => count > 3)) {
      updatedStatus = applyStatusDelta(updatedStatus, { escalationRisk: 10, logisticsContinuity: -8 });
      nextMetrics.routeDiversityScore = clamp(nextMetrics.routeDiversityScore - 15);
      nextMetrics.adversaryModelingScore = clamp(nextMetrics.adversaryModelingScore - 8);
      roundMessages.push({ text: "تمرکز بیش از حد کاروان‌ها در یک مسیر، الگوی واکنش شما را آشکارتر کرد.", level: "warning" });
    }

    nextMetrics.secondOrderThinkingScore = clamp(nextMetrics.secondOrderThinkingScore + sumWeights(items).secondOrderThinkingWeight);
    nextMetrics.adversaryModelingScore = clamp(nextMetrics.adversaryModelingScore + Math.round(sumWeights(items).adversaryModelingWeight / 2));
    nextMetrics.cognitiveFlexibilityScore = clamp(nextMetrics.cognitiveFlexibilityScore + Math.round(sumWeights(items).cognitiveFlexibilityWeight / 2));
    nextMetrics.escalationSensitivityScore = clamp(nextMetrics.escalationSensitivityScore - Math.round(sumWeights(items).escalationWeight / 2));

    return { updatedStatus, nextConvoys, nextZones, nextMetrics, roundMessages };
  };

  const makeSummary = (
    finalStatus: ScenarioTwoMissionStatus,
    finalResources: ResourceState,
    finalConvoys: Convoy[],
    finalRecords: ScenarioTwoDecisionRecord[],
    finalMetrics: ScenarioTwoMetrics
  ): ScenarioTwoSummaryData => {
    const weightedDelivered = finalConvoys.reduce((sum, convoy) => {
      const deliveredScore = convoy.status === "compromised" ? 20 : convoy.status === "delivered" ? 100 : convoy.delay <= convoy.deadline ? 82 : 58;
      return sum + convoy.priority * deliveredScore;
    }, 0);
    const totalPriority = finalConvoys.reduce((sum, convoy) => sum + convoy.priority, 0);
    const criticalDeliveryScore = clamp(weightedDelivered / totalPriority);
    const delayControlScore = clamp(100 - finalStatus.cumulativeDelay);
    const resourceEfficiencyScore = clamp((finalResources.satelliteISR + finalResources.energy + finalResources.time) / 3 + (finalMetrics.isrUsageQuality - 50) / 3);
    const gnssAnomalyDetectionScore = clamp(100 - finalStatus.ambiguity + finalMetrics.isrUsageQuality / 4 - finalMetrics.falseGnssRelianceTime * 8);
    const logisticsResilienceIndex = clamp(
      0.3 * criticalDeliveryScore +
      0.2 * finalStatus.logisticsContinuity +
      0.15 * finalStatus.navigationIntegrity +
      0.15 * resourceEfficiencyScore +
      0.1 * finalStatus.civilianStability +
      0.1 * delayControlScore
    );
    const operationalStrategicIndex = clamp((finalMetrics.secondOrderThinkingScore + finalMetrics.adversaryModelingScore + finalMetrics.informationDisciplineScore - finalStatus.escalationRisk) / 3, 0, 100);
    const avgResponseTimeMs = Math.round(average(finalRecords.map((record) => record.responseTimeMs)));
    const navigationCompromiseLevel = clamp(100 - finalStatus.navigationIntegrity + finalStatus.gnssExposureRisk / 3);
    const medicalConvoy = getMedicalConvoy(finalConvoys);
    const primaryObjectiveStatus = getPrimaryObjectiveStatus(medicalConvoy);
    const missionObjectiveCompletion = calculateMissionCompletion(finalStatus, finalConvoys, finalResources);
    const secondaryObjectives = {
      logisticsMaintained: finalStatus.logisticsContinuity >= 65,
      ambiguityControlled: finalStatus.ambiguity <= 30,
      gnssRiskControlled: finalStatus.gnssExposureRisk <= 40,
      civilianStabilityMaintained: finalStatus.civilianStability >= 60,
      resourcesPreserved: Math.max(finalResources.satelliteISR, finalResources.energy, finalResources.time) >= 15,
    };
    let missionOutcome: ScenarioTwoSummaryData["missionOutcome"] = "limited_success";
    let missionOutcomeLabel = "مأموریت با موفقیت محدود انجام شد.";
    if (primaryObjectiveStatus === "delivered_on_time" && finalStatus.criticalDelivery > 80 && finalStatus.logisticsContinuity > 65 && finalStatus.ambiguity < 30 && finalStatus.gnssExposureRisk < 40) {
      missionOutcome = "complete_success";
      missionOutcomeLabel = "مأموریت با نتیجه عالی انجام شد.";
    } else if (primaryObjectiveStatus === "lost" || primaryObjectiveStatus === "compromised" || (medicalConvoy.status !== "delivered" && (finalStatus.criticalDelivery < 40 || finalStatus.logisticsContinuity < 40))) {
      missionOutcome = "failure";
      missionOutcomeLabel = "مأموریت شکست خورد.";
    } else if (medicalConvoy.status !== "delivered" || finalStatus.gnssExposureRisk > 70 || finalStatus.logisticsContinuity < 40) {
      missionOutcome = "partial_failure";
      missionOutcomeLabel = "مأموریت ناقص انجام شد.";
    }
    const primaryObjectiveText = medicalConvoy.status === "delivered"
      ? `کاروان الف با ${medicalConvoy.delay} واحد تأخیر به مقصد ${medicalConvoy.destination} رسید.`
      : `کاروان الف به مقصد نرسید؛ پیشروی نهایی ${medicalConvoy.progress}٪ و وضعیت ${medicalConvoy.status} بود.`;
    const subObjectiveNotes = [
      `${medicalConvoy.status === "delivered" ? "✓" : "✕"} کاروان الف به مقصد برسد: ${medicalConvoy.progress}%`,
      `${secondaryObjectives.logisticsMaintained ? "✓" : "✕"} شبکه لجستیک پایدار بماند: ${finalStatus.logisticsContinuity}`,
      `${secondaryObjectives.ambiguityControlled ? "✓" : "✕"} ابهام عملیاتی کنترل شود: ${finalStatus.ambiguity}`,
      `${secondaryObjectives.gnssRiskControlled ? "✓" : "✕"} ریسک GNSS آلوده کنترل شود: ${finalStatus.gnssExposureRisk}`,
      `${secondaryObjectives.civilianStabilityMaintained ? "✓" : "✕"} پایداری مدنی حفظ شود: ${finalStatus.civilianStability}`,
      `${secondaryObjectives.resourcesPreserved ? "✓" : "✕"} حداقل یک منبع ذخیره بماند: ISR ${finalResources.satelliteISR} / ENG ${finalResources.energy} / TIME ${finalResources.time}`,
    ];
    const roundTimeline = finalRecords.map((record) => ({
      roundId: record.roundId,
      roundTitle: roundTitleById[record.roundId] ?? record.roundId,
      selectedActions: record.selectedActionIds.map((id) => actionTitleById[id] ?? id),
      mapEffects: record.selectedActionIds.map((id) => mapEffectByActionId[id]).filter(Boolean),
      objectiveEffects: record.selectedActionIds.map((id) => objectiveEffectByActionId[id]).filter(Boolean),
      resourceChanges: {
        satelliteISRDelta: record.satelliteISRAfter - record.satelliteISRBefore,
        energyDelta: record.energyAfter - record.energyBefore,
        timeDelta: record.timeAfter - record.timeBefore,
      },
      statusChanges: {
        logisticsContinuityDelta: record.logisticsContinuityAfter - record.logisticsContinuityBefore,
        criticalDeliveryDelta: record.criticalDeliveryAfter - record.criticalDeliveryBefore,
        navigationIntegrityDelta: record.navigationIntegrityAfter - record.navigationIntegrityBefore,
        civilianStabilityDelta: record.civilianStabilityAfter - record.civilianStabilityBefore,
        ambiguityDelta: record.ambiguityAfter - record.ambiguityBefore,
        gnssExposureRiskDelta: record.gnssExposureRiskAfter - record.gnssExposureRiskBefore,
        cumulativeDelayDelta: record.cumulativeDelayAfter - record.cumulativeDelayBefore,
      },
    }));
    const keyTurningPointRecord = finalRecords.find((record) => record.selectedActionIds.includes("action_reroute_convoy") || record.selectedActionIds.includes("action_fallback_nav"));
    const keyTurningPoint = keyTurningPointRecord
      ? `${roundTitleById[keyTurningPointRecord.roundId] ?? keyTurningPointRecord.roundId}: اصلاح مسیر یا ناوبری پشتیبان، شانس نجات کاروان الف را بالا برد.`
      : "نقطه عطف مشخصی ثبت نشد؛ تصمیم‌ها بیشتر روی حفظ شبکه و منابع متمرکز بودند.";
    const criticalMistake = finalResources.energy < 15
      ? "مصرف سنگین انرژی باعث شد گزینه‌های پایانی محدود شوند."
      : finalMetrics.falseGnssRelianceTime > 0
        ? "ادامه اتکا به GNSS در شرایط ابهام، ریسک انحراف را بالا برد."
        : finalStatus.ambiguity > 40
          ? "ابهام عملیاتی دیر کنترل شد و بخشی از تصمیم‌ها با تصویر ناقص گرفته شد."
          : "اشتباه بحرانی پررنگی ثبت نشد؛ ریسک‌ها عمدتاً کنترل شدند.";

    let decisionStyleLabel = "Adaptive Logistics Commander";
    let decisionStyleText = "شما تصمیم‌ها را با تغییر وضعیت اصلاح کردید، منابع را مرحله‌ای مصرف کردید و مسیرها را بر اساس اهمیت و ریسک تفکیک کردید.";
    if (finalMetrics.falseGnssRelianceTime >= 2 || navigationCompromiseLevel > 65) {
      decisionStyleLabel = "System-Dependent Commander";
      decisionStyleText = "شما بیش از حد به داده‌های GNSS اتکا کردید و دیر به سراغ منابع تأییدکننده رفتید.";
    } else if (finalStatus.escalationRisk < 25 && finalStatus.civilianStability > 75 && finalStatus.cumulativeDelay > 28) {
      decisionStyleLabel = "Conservative Stabilizer";
      decisionStyleText = "شما بحران را با احتیاط مدیریت کردید، اما بخشی از سرعت عملیاتی را از دست دادید.";
    } else if (resourceEfficiencyScore < 42 && avgResponseTimeMs < 5000) {
      decisionStyleLabel = "Reactive Commander";
      decisionStyleText = "شما سریع واکنش نشان دادید، اما بخشی از منابع را زودتر از زمان مناسب مصرف کردید.";
    } else if (finalStatus.gnssExposureRisk > 65 && finalStatus.escalationRisk > 55) {
      decisionStyleLabel = "High-Risk Operator";
      decisionStyleText = "شما سرعت و استمرار عملیات را بر کاهش ریسک ترجیح دادید.";
    } else if (avgResponseTimeMs > 35000 && finalStatus.cumulativeDelay > 30) {
      decisionStyleLabel = "Analysis-Paralysis Commander";
      decisionStyleText = "برای رسیدن به قطعیت، زمان زیادی صرف بررسی کردید و تأخیر عملیاتی افزایش یافت.";
    }

    const personalizedLessons = [
      finalResources.satelliteISR < 15
        ? "شما بخش بزرگی از ظرفیت ISR را زود مصرف کردید؛ در موج‌های بعدی، توان آشکارسازی محدود شد."
        : "ظرفیت ISR تا پایان کاملاً تخلیه نشد و امکان اصلاح تصمیم در راندهای بعدی باقی ماند.",
      finalMetrics.falseGnssRelianceTime > 0
        ? "در چند لحظه با وجود ابهام بالا، اتکا به GNSS ادامه پیدا کرد و ریسک وابستگی غلط افزایش یافت."
        : "از اعتماد کور به GNSS پرهیز شد و منابع تأییدکننده نقش واقعی در تصمیم‌ها داشتند.",
      finalMetrics.routeDiversityScore >= 60
        ? "تفکیک مسیرها باعث شد اختلال دشمن اثر محدودتری بر شبکه لجستیک داشته باشد."
        : "تمرکز مسیرها یا تأخیر در پراکندگی، پیش‌بینی‌پذیری واکنش شبکه را بالا نگه داشت.",
    ];

    return {
      missionOutcome,
      missionObjectiveCompletion,
      missionCompletionPercent: missionObjectiveCompletion,
      missionOutcomeLabel,
      primaryObjectiveText,
      primaryObjectiveStatus,
      primaryConvoyId: "convoy_medical",
      primaryConvoyDelay: medicalConvoy.delay,
      secondaryObjectives,
      subObjectiveNotes,
      roundTimeline,
      personalizedLessons,
      keyTurningPoint,
      criticalMistake,
      logisticsResilienceIndex,
      operationalStrategicIndex,
      decisionStyleLabel,
      decisionStyleText,
      criticalDeliveryScore,
      delayControlScore,
      gnssAnomalyDetectionScore,
      navigationCompromiseLevel,
      avgResponseTimeMs,
      learningNotes: personalizedLessons,
    };
  };

  const executeRound = () => {
    if (selectedActions.length === 0) return;
    const resourcesBefore = resources;
    const statusBefore = status;
    const weights = sumWeights(selectedActions);
    const nextResources = addResources(resources, previewCost);
    let nextStatus = selectedActions.reduce((current, item) => applyStatusDelta(current, item.action.effects), status);
    nextStatus = applyStatusDelta(nextStatus, {
      remainingResources: Math.round(((nextResources.satelliteISR + nextResources.energy + nextResources.time) / 3) - status.remainingResources),
    });

    const sideEffects = applyActionSideEffects(selectedActions, nextStatus);
    nextStatus = sideEffects.updatedStatus;
    const movement = advanceConvoys(sideEffects.nextConvoys, routes, selectedActions);
    nextStatus = applyStatusDelta(nextStatus, movement.statusDelta);
    const nextConvoysAfterMovement = movement.nextConvoys;
    const nextMetrics = {
      ...sideEffects.nextMetrics,
      resourceEfficiencyScore: clamp((nextResources.satelliteISR + nextResources.energy + nextResources.time) / 3),
      totalChangedActionCount: metrics.totalChangedActionCount + changedActionCountRef.current,
      totalPreviewOpenCount: metrics.totalPreviewOpenCount + previewOpenCountRef.current,
    };

    const responseTimeMs = Math.round(now() - roundStartedAtRef.current);
    const record: ScenarioTwoDecisionRecord = {
      roundId: currentRound.id,
      selectedActionIds: selectedActions.map((item) => item.action.id),
      selectedTargets: Object.fromEntries(selectedActions.map((item) => [item.action.id, item.targetId ?? "global"])),
      responseTimeMs,
      changedActionCount: changedActionCountRef.current,
      previewOpenCount: previewOpenCountRef.current,
      satelliteISRBefore: resourcesBefore.satelliteISR,
      energyBefore: resourcesBefore.energy,
      timeBefore: resourcesBefore.time,
      satelliteISRAfter: nextResources.satelliteISR,
      energyAfter: nextResources.energy,
      timeAfter: nextResources.time,
      logisticsContinuityBefore: statusBefore.logisticsContinuity,
      criticalDeliveryBefore: statusBefore.criticalDelivery,
      navigationIntegrityBefore: statusBefore.navigationIntegrity,
      civilianStabilityBefore: statusBefore.civilianStability,
      ambiguityBefore: statusBefore.ambiguity,
      escalationRiskBefore: statusBefore.escalationRisk,
      gnssExposureRiskBefore: statusBefore.gnssExposureRisk,
      cumulativeDelayBefore: statusBefore.cumulativeDelay,
      logisticsContinuityAfter: nextStatus.logisticsContinuity,
      criticalDeliveryAfter: nextStatus.criticalDelivery,
      navigationIntegrityAfter: nextStatus.navigationIntegrity,
      civilianStabilityAfter: nextStatus.civilianStability,
      ambiguityAfter: nextStatus.ambiguity,
      escalationRiskAfter: nextStatus.escalationRisk,
      gnssExposureRiskAfter: nextStatus.gnssExposureRisk,
      cumulativeDelayAfter: nextStatus.cumulativeDelay,
      ...weights,
    };

    eventLogger.log({
      type: "s2_decision",
      scenarioId,
      nodeId,
      userId: userProfileId,
      elapsedMs: responseTimeMs,
      detail: {
        roundId: currentRound.id,
        selectedActionIds: record.selectedActionIds,
        selectedTargets: record.selectedTargets,
        responseTimeMs,
        changedActionCount: record.changedActionCount,
        previewOpenCount: record.previewOpenCount,
        resourcesBefore,
        resourcesAfter: nextResources,
        statusBefore,
        statusAfter: nextStatus,
        decisionWeights: weights,
      },
    });

    selectedActions.forEach((item) => {
      if (Object.keys(item.action.cost).length > 0) {
        eventLogger.log({
          type: "s2_resource_allocation",
          scenarioId,
          nodeId,
          userId: userProfileId,
          detail: {
            roundId: currentRound.id,
            actionId: item.action.id,
            targetId: item.targetId,
            satelliteISRSpent: item.action.cost.satelliteISR ?? 0,
            energySpent: item.action.cost.energy ?? 0,
            timeSpent: item.action.cost.time ?? 0,
            allocationEfficiency: nextMetrics.resourceEfficiencyScore,
          },
        });
      }

      if (item.action.targetType && item.action.targetType !== "global") {
        const zone = zones.find((entry) => entry.id === item.targetId);
        const route = routes.find((entry) => entry.id === item.targetId);
        eventLogger.log({
          type: "s2_map_action",
          scenarioId,
          nodeId,
          userId: userProfileId,
          detail: {
            roundId: currentRound.id,
            actionId: item.action.id,
            targetType: item.action.targetType,
            targetId: item.targetId,
            selectedZoneId: item.action.targetType === "zone" ? item.targetId : undefined,
            selectedConvoyId: item.action.targetType === "convoy" ? item.targetId : selectedConvoyForRoute,
            selectedRouteId: item.action.targetType === "route" ? item.targetId : undefined,
      routeRiskLevel: route?.visualStatus,
            gnssDisruptionLevel: zone?.gnssDisruption ?? route?.gnssRisk,
            civilianImpact: zone?.civilianSensitivity ?? route?.civilianImpact,
          },
        });
      }
    });

    const updatedRecords = [...records, record];
    const completionBefore = calculateMissionCompletion(statusBefore, convoys, resourcesBefore);
    const completionAfter = calculateMissionCompletion(nextStatus, nextConvoysAfterMovement, nextResources);
    const outcomeMessages = [
      ...sideEffects.roundMessages,
      ...movement.messages,
      { text: `منابع پس از اجرا: ISR ${nextResources.satelliteISR} | انرژی ${nextResources.energy} | زمان ${nextResources.time}`, level: "info" as const },
      { text: `وضعیت مأموریت: لجستیک ${nextStatus.logisticsContinuity}٪، ابهام ${nextStatus.ambiguity}٪، ریسک GNSS ${nextStatus.gnssExposureRisk}٪`, level: "info" as const },
      { text: `تحقق هدف مأموریت: ${completionBefore}٪ → ${completionAfter}٪`, level: completionAfter >= completionBefore ? "success" as const : "warning" as const },
    ].slice(0, 5);

    setResources(nextResources);
    setStatus(nextStatus);
    setConvoys(nextConvoysAfterMovement);
    setZones(sideEffects.nextZones);
    setMetrics(nextMetrics);
    sideEffects.roundMessages.forEach((message) => addEvent(message.text, message.level));
    addEvent(`بسته عملیاتی ${currentRound.title} اجرا شد.`, "success");
    setRecords(updatedRecords);
    setSelectedActions([]);
    setPendingAction(null);
    setSelectedConvoyForRoute(undefined);
    changedActionCountRef.current = 0;
    previewOpenCountRef.current = 0;

    if (roundIndex + 1 >= rounds.length) {
      const deliveredConvoys = nextConvoysAfterMovement.map((convoy) => ({
        ...convoy,
        status: convoy.status === "delivered" || convoy.status === "compromised"
          ? convoy.status
          : convoy.id === "convoy_medical" && convoy.progress < 100
            ? "compromised" as const
            : convoy.progress >= 85
              ? "delivered" as const
              : convoy.status,
      }));
      const finalStatus = applyStatusDelta(nextStatus, {
        criticalDelivery: deliveredConvoys.some((convoy) => convoy.priority >= 5 && convoy.status === "delivered") ? 8 : -16,
      });
      const finalSummary = makeSummary(finalStatus, nextResources, deliveredConvoys, updatedRecords, nextMetrics);
      setConvoys(deliveredConvoys);
      setStatus(finalStatus);
      setSummary(finalSummary);
      onCompletionUiActiveChange?.(true);
      eventLogger.log({
        type: "s2_cognitive_summary",
        scenarioId,
        nodeId,
        userId: userProfileId,
        detail: {
          ...finalSummary,
          cumulativeDelay: finalStatus.cumulativeDelay,
          falseGnssRelianceTime: nextMetrics.falseGnssRelianceTime,
          isrUsageQuality: nextMetrics.isrUsageQuality,
          routeDiversityScore: nextMetrics.routeDiversityScore,
          resourceEfficiencyScore: nextMetrics.resourceEfficiencyScore,
          secondOrderThinkingScore: nextMetrics.secondOrderThinkingScore,
          adversaryModelingScore: nextMetrics.adversaryModelingScore,
          escalationSensitivityScore: nextMetrics.escalationSensitivityScore,
          informationDisciplineScore: nextMetrics.informationDisciplineScore,
          cognitiveFlexibilityScore: nextMetrics.cognitiveFlexibilityScore,
          totalChangedActionCount: nextMetrics.totalChangedActionCount,
          totalPreviewOpenCount: nextMetrics.totalPreviewOpenCount,
        },
      });
      return;
    }

    setRoundOutcome({
      title: `پیامد ${currentRound.title}`,
      messages: outcomeMessages,
      nextRoundIndex: roundIndex + 1,
    });
  };

  const continueAfterOutcome = () => {
    if (roundOutcome?.nextRoundIndex != null) {
      setRoundIndex(roundOutcome.nextRoundIndex);
      roundStartedAtRef.current = now();
    }
    setRoundOutcome(null);
  };

  if (!hasStarted) {
    return (
      <div className="s2-start">
        <h2>سناریو ۲ — امواج خاموش</h2>
        <h3>مدیریت کاروان‌های حیاتی تحت اخلال GNSS</h3>
        <p>
          شما فرمانده قرارگاه لجستیک و پشتیبانی عملیاتی هستید. چند کاروان حیاتی در حال حرکت‌اند، اما داده‌های{" "}
          <span className="s2-term">
            GNSS
            <span className="s2-term-help" tabIndex={0} aria-label="توضیح GNSS">؟</span>
            <span className="s2-term-tooltip" role="tooltip">
              GNSS سامانه‌ای ماهواره‌ای برای تعیین موقعیت، ناوبری و زمان‌سنجی دقیق در سطح زمین است.
            </span>
          </span>{" "}
          آلوده‌اند. دشمن مستقیماً حمله نکرده؛ او مسیرها، مختصات و اعتماد شما به داده‌ها را هدف گرفته است.
        </p>
        <p>
          در ساعت ۰۴:۲۰، کاروان الف، حامل تجهیزات درمانی اضطراری، باید به مرکز درمانی شرق کشور برسد؛ اما نشانه‌های اولیه نشان می‌دهد مسیر آن احتمالاً تحت spoofing قرار گرفته است.
        </p>
        <div className="s2-briefing">
          <h3>مأموریت شما</h3>
          <ol>
            <li>کاروان الف را تا پایان راند ۵ به مقصد برسانید.</li>
            <li>جریان لجستیک را حفظ کنید و اجازه ندهید شبکه فروبپاشد.</li>
            <li>قبل از اعتماد به مختصات آلوده، منبع اختلال را تشخیص دهید.</li>
            <li>در هر راند حداکثر سه اقدام عملیاتی انتخاب کنید.</li>
            <li>اگر اقدام هدف‌دار است، بعد از انتخاب کارت باید هدف را روی نقشه مشخص کنید.</li>
          </ol>
          <div className="s2-terms-grid">
            <span><b>Spoofing</b> ارسال داده جعلی برای فریب ناوبری</span>
            <span><b>Jamming</b> اخلال در سیگنال و کاهش دقت ناوبری</span>
            <span><b>ISR</b> ظرفیت شناسایی و پایش مناطق مشکوک</span>
            <span><b>ابهام عملیاتی</b> نامطمئن بودن وضعیت واقعی میدان</span>
          </div>
          <div className="s2-briefing-alerts">
            <span><b className="yellow" /> زرد: ابهام قابل مدیریت</span>
            <span><b className="orange" /> نارنجی: ریسک فعال</span>
            <span><b className="red" /> قرمز: بحران جدی</span>
          </div>
        </div>
        <div className="s2-start-grid">
          <span>۵ راند</span>
          <span>۴ کاروان</span>
          <span>بودجه اقدام ۳/راند</span>
          <span>قفل منابع واقعی</span>
        </div>
        <button className="primary" onClick={begin}>ورود به اتاق فرماندهی</button>
      </div>
    );
  }

  if (summary) {
    return (
      <ScenarioTwoSummary
        summary={summary}
        status={status}
        resources={resources}
        convoys={convoys}
        records={records}
        metrics={metrics}
        onComplete={onComplete}
      />
    );
  }

  return (
    <div className="s2-sim-root" dir="rtl">
      <header className="s2-command-bar">
        <div>
          <span>سناریو ۲ — امواج خاموش</span>
          <h2>{currentRound.title}</h2>
        </div>
        <div className={`s2-alert s2-alert-${currentRound.alertLevel}`} title={alertHelp[currentRound.alertLevel]}>
          هشدار {currentRound.alertLevel}
        </div>
        <div className="s2-alert-help">{alertHelp[currentRound.alertLevel]}</div>
        <div className="s2-action-budget">بودجه اقدام عملیاتی: {selectedActions.length}/3</div>
        <div className="s2-resource-chips">
          {renderResourceMeterChip("satelliteISR", "ISR")}
          {renderResourceMeterChip("energy", "ENG")}
          {renderResourceMeterChip("time", "TIME")}
        </div>
        <div className="s2-command-actions">
          <button type="button" onClick={() => setOpenDrawer("convoys")}>کاروان‌ها</button>
          <button type="button" onClick={() => setOpenDrawer("objectives")}>اهداف</button>
          <button type="button" onClick={() => setOpenDrawer("mission")}>وضعیت مأموریت</button>
          <button type="button" onClick={() => setOpenDrawer("log")}>لاگ عملیات</button>
        </div>
      </header>
      <section className="s2-objective-strip">
        <div>
          <span>مأموریت اصلی</span>
          <strong>کاروان الف را تا پایان راند ۵ به مشهد برسانید.</strong>
        </div>
        <div className="s2-primary-progress">
          <span>کاروان الف: {medicalConvoy.progress}% مسیر</span>
          <i><em style={{ width: `${medicalConvoy.progress}%` }} /></i>
        </div>
        <div>
          <span>مهلت</span>
          <strong>{rounds.length - roundIndex} راند باقی‌مانده</strong>
        </div>
        <div>
          <span>وضعیت</span>
          <strong>{medicalConvoy.status === "delivered" ? "تحویل‌شده" : medicalConvoy.status === "compromised" ? "از دست‌رفته" : medicalConvoy.status === "rerouted" ? "اصلاح مسیر" : medicalConvoy.hasFallbackNav ? "ناوبری پشتیبان" : "در معرض spoofing"}</strong>
        </div>
        <div>
          <span>تحقق هدف</span>
          <strong>{missionCompletion}%</strong>
        </div>
      </section>
      <div className="s2-kpi-strip">
        {keyMetrics.map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <b>{metric.value}</b>
            <i><em style={{ width: `${metric.value}%`, background: metric.color }} /></i>
          </div>
        ))}
      </div>
      {hasResourcePreview && (
        <div className={`s2-resource-preview ${Object.values(resourcesAfterPreview).some((value) => value < 25) ? "warning" : ""}`}>
          <strong>پیش‌نمایش مصرف منابع</strong>
          <span>ISR: {resources.satelliteISR} → {resourcesAfterPreview.satelliteISR}</span>
          <span>ENG: {resources.energy} → {resourcesAfterPreview.energy}</span>
          <span>TIME: {resources.time} → {resourcesAfterPreview.time}</span>
          {Object.values(resourcesAfterPreview).some((value) => value < 25) && <em>هشدار: یکی از منابع پس از اجرای بسته به سطح بحرانی می‌رسد.</em>}
        </div>
      )}

      <p className="s2-round-narrative">{currentRound.narrative}</p>
      {pendingAction && (
        <div className="s2-targeting-banner">
          <strong>هدف‌گیری فعال: {pendingAction.title}</strong>
          <span>{getTargetInstruction()}</span>
          <button
            type="button"
            onClick={() => {
              setPendingAction(null);
              setSelectedConvoyForRoute(undefined);
            }}
          >
            لغو هدف‌گیری
          </button>
        </div>
      )}

      <main className="s2-layout">
        <ScenarioTwoMap
          zones={zones}
          routes={routes}
          convoys={convoys}
          selectedConvoyId={selectedConvoyForRoute}
          activeTargetType={pendingAction?.targetType}
          pendingActionId={pendingAction?.id}
          selectedActions={selectedActions}
          previewAction={hoveredAction}
          ambiguity={status.ambiguity}
          navigationIntegrity={status.navigationIntegrity}
          onSelectZone={(zoneId) => pendingAction && addSelectedAction(pendingAction, zoneId)}
          onSelectConvoy={(convoyId) => pendingAction && addSelectedAction(pendingAction, convoyId)}
          onSelectConvoyForRoute={(convoyId) => setSelectedConvoyForRoute(convoyId)}
          onSelectRoute={(routeId) => pendingAction && addSelectedAction(pendingAction, routeId)}
        />

        <section className="s2-actions-section">
          <div className="s2-section-header">
            <h3>کارت‌های اقدام عملیاتی</h3>
            <span>۱ تصمیم اصلی انتخاب کنید؛ سپس حداکثر ۲ اقدام پشتیبان اضافه کنید.</span>
            <div className="s2-round-problem">
              <strong>مسئله این راند چیست؟</strong>
              <p>{currentRound.operationalProblem}</p>
              <em>هدف راند: {currentRound.roundGoal}</em>
            </div>
          </div>
          <div className="s2-action-groups">
            <div>
              <h4>تصمیم اصلی</h4>
              <div className="s2-action-grid">
            {mainActions.map((action) => {
              const selectedAction = selectedActions.find((item) => item.action.id === action.id);
              const selectedForAfford = currentRound.mainActionIds.includes(action.id)
                ? selectedActions.filter((item) => !currentRound.mainActionIds.includes(item.action.id))
                : selectedActions;
              const disabledReason = selectedAction
                ? undefined
                : pendingAction && pendingAction.id !== action.id
                  ? "ابتدا هدف اقدام فعال را انتخاب یا لغو کنید."
                  : canAfford(resources, action, selectedForAfford);
              const riskReason = selectedAction || disabledReason ? undefined : getResourceRiskReason(resources, action, selectedActions);
              return (
                <ScenarioTwoActionCard
                  key={action.id}
                  action={action}
                  selectedAction={selectedAction}
                  disabledReason={disabledReason}
                  isTargeting={pendingAction?.id === action.id}
                  riskReason={riskReason}
                  decisionRole="main"
                  onPreviewChange={setHoveredAction}
                  onPick={() => handlePickAction(action)}
                  onRemove={() => removeSelectedAction(action.id, selectedAction?.targetId)}
                />
              );
            })}
              </div>
            </div>
            <div>
              <h4>اقدام‌های پشتیبان ({supportSelectionCount}/2)</h4>
              <div className="s2-action-grid">
            {supportActions.map((action) => {
              const selectedAction = selectedActions.find((item) => item.action.id === action.id);
              const disabledReason = selectedAction
                ? undefined
                : pendingAction && pendingAction.id !== action.id
                  ? "ابتدا هدف اقدام فعال را انتخاب یا لغو کنید."
                  : supportSelectionCount >= 2
                    ? "حداکثر دو اقدام پشتیبان قابل انتخاب است."
                    : canAfford(resources, action, selectedActions);
              const riskReason = selectedAction || disabledReason ? undefined : getResourceRiskReason(resources, action, selectedActions);
              return (
                <ScenarioTwoActionCard
                  key={action.id}
                  action={action}
                  selectedAction={selectedAction}
                  disabledReason={disabledReason}
                  isTargeting={pendingAction?.id === action.id}
                  riskReason={riskReason}
                  decisionRole="support"
                  onPreviewChange={setHoveredAction}
                  onPick={() => handlePickAction(action)}
                  onRemove={() => removeSelectedAction(action.id, selectedAction?.targetId)}
                />
              );
            })}
              </div>
            </div>
          </div>
          <div className="s2-execute-row">
            <div className="s2-selected-actions">
              <strong>تصمیم انتخاب‌شده: {hasMainDecision ? "۱/۱" : "۰/۱"} | پشتیبان: {supportSelectionCount}/2</strong>
              {selectedActions.length === 0 ? <span>هنوز اقدامی انتخاب نشده است.</span> : selectedActions.map((item) => (
                <button
                  type="button"
                  key={`${item.action.id}-${item.targetId ?? "global"}`}
                  onClick={() => removeSelectedAction(item.action.id, item.targetId)}
                  title="حذف اقدام"
                >
                  {item.action.title} {item.targetId ? `← ${item.targetId}` : ""} ×
                </button>
              ))}
              {selectedActions.length > 0 && (
                <em>پس از اجرا: ISR {resourcesAfterPreview.satelliteISR} | ENG {resourcesAfterPreview.energy} | TIME {resourcesAfterPreview.time}</em>
              )}
            </div>
            <button className="primary" disabled={!hasMainDecision || Boolean(pendingAction)} onClick={executeRound}>اجرای بسته عملیاتی</button>
          </div>
        </section>
      </main>

      {openDrawer && (
        <div className="s2-drawer-backdrop" onClick={() => setOpenDrawer(null)}>
          <aside className="s2-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="s2-drawer-head">
              <h3>{openDrawer === "convoys" ? "کاروان‌ها" : openDrawer === "objectives" ? "اهداف مأموریت" : openDrawer === "mission" ? "وضعیت مأموریت" : "لاگ عملیات"}</h3>
              <button type="button" onClick={() => setOpenDrawer(null)}>بستن</button>
            </div>
            {openDrawer === "convoys" && (
              <div className="s2-drawer-list">
                {convoys.map((convoy) => (
                  <button
                    key={convoy.id}
                    type="button"
                    className={`s2-convoy-row priority-${convoy.priority}`}
                    onClick={() => {
                      setSelectedConvoyForRoute(convoy.id);
                      setOpenDrawer(null);
                    }}
                  >
                    <strong>{convoy.name}</strong>
                    <span>{convoy.cargo}</span>
                    <small>اولویت {convoy.priority} | مهلت {convoy.deadline} | تأخیر {convoy.delay}</small>
                    <em>{convoy.hasFallbackNav ? "ناوبری پشتیبان فعال" : `اعتماد GNSS ${convoy.gnssTrustLevel}`}</em>
                  </button>
                ))}
              </div>
            )}
            {openDrawer === "mission" && (
              <div className="s2-drawer-list">
                {[
                  ["پیوستگی لجستیک", status.logisticsContinuity],
                  ["تحویل حیاتی", status.criticalDelivery],
                  ["سلامت ناوبری", status.navigationIntegrity],
                  ["پایداری مدنی", status.civilianStability],
                  ["ابهام", status.ambiguity],
                  ["ریسک تشدید", status.escalationRisk],
                  ["ریسک GNSS آلوده", status.gnssExposureRisk],
                  ["تأخیر تجمعی", status.cumulativeDelay],
                ].map(([label, value]) => (
                  <div key={label} className="s2-drawer-metric">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}
            {openDrawer === "objectives" && (
              <div className="s2-drawer-list">
                <div className="s2-objective-detail">
                  <strong>هدف اصلی</strong>
                  <p>کاروان الف، حامل تجهیزات درمانی اضطراری، باید قبل از پایان راند ۵ به مشهد برسد. اگر این کاروان نرسد، مأموریت کامل موفق محسوب نمی‌شود.</p>
                </div>
                {objectiveChecks.map((objective) => (
                  <div key={objective.label} className={`s2-objective-row ${objective.done ? "done" : ""}`}>
                    <b>{objective.done ? "✓" : "○"}</b>
                    <span>{objective.label}</span>
                    <strong>{objective.value}</strong>
                  </div>
                ))}
              </div>
            )}
            {openDrawer === "log" && (
              <div className="s2-drawer-list">
                {events.length === 0 && <p className="s2-empty-log">پس از اجرای بسته عملیاتی، پیامدها اینجا ثبت می‌شوند.</p>}
                {events.map((event) => <div key={event.id} className={`s2-log-item ${event.level}`}>{event.text}</div>)}
              </div>
            )}
          </aside>
        </div>
      )}

      {roundOutcome && (
        <div className="s2-outcome-backdrop">
          <div className="s2-outcome-modal">
            <h3>{roundOutcome.title}</h3>
            <div>
              {roundOutcome.messages.map((message) => (
                <p key={message.text} className={message.level}>{message.text}</p>
              ))}
            </div>
            <button className="primary" type="button" onClick={continueAfterOutcome}>ادامه به راند بعد</button>
          </div>
        </div>
      )}
    </div>
  );
};
