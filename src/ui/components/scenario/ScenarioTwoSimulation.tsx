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

type MissionFlag = "mashhadIdentified" | "alphaMonitored" | "safeRouteChosen" | "groundSupportReady" | "resourcesPreserved" | "ambushCountered" | "lateDiscoveryPenalty";

const initialResources: ResourceState = { satelliteISR: 80, energy: 80, time: 100 };

const initialStatus: ScenarioTwoMissionStatus = {
  alphaHealth: 82,
  alphaProgress: 15,
  threatIdentification: 0,
  secondaryConvoyStability: 78,
  resourceReserve: 87,
  ambushRisk: 8,
  logisticsContinuity: 82,
  criticalDelivery: 72,
  navigationIntegrity: 76,
  civilianStability: 88,
  escalationRisk: 18,
  remainingResources: 87,
  ambiguity: 25,
  cumulativeDelay: 0,
  gnssExposureRisk: 18,
};

const initialConvoys: Convoy[] = [
  { id: "convoy_medical", name: "کاروان الف", cargo: "تجهیزات درمانی اضطراری", origin: "تهران", destination: "مشهد", priority: 5, deadline: 8, delay: 0, health: 82, status: "normal", currentZoneId: "zone_central", routeId: "route_main_east", hasFallbackNav: false, hasGroundSupport: false, gnssTrustLevel: 75, progress: 15 },
  { id: "convoy_fuel", name: "کاروان ب", cargo: "سوخت عملیاتی", origin: "بندرعباس", destination: "تهران", priority: 4, deadline: 8, delay: 0, health: 86, status: "normal", currentZoneId: "zone_south", routeId: "route_south", hasFallbackNav: false, hasGroundSupport: false, gnssTrustLevel: 78, progress: 20 },
  { id: "convoy_comms", name: "کاروان ج", cargo: "قطعات ارتباطی", origin: "تبریز", destination: "تهران", priority: 4, deadline: 8, delay: 0, health: 84, status: "normal", currentZoneId: "zone_north", routeId: "route_north", hasFallbackNav: false, hasGroundSupport: false, gnssTrustLevel: 76, progress: 18 },
  { id: "convoy_supplies", name: "کاروان د", cargo: "تدارکات پشتیبانی مرزی", origin: "تهران", destination: "مرز عراق", priority: 3, deadline: 8, delay: 0, health: 80, status: "normal", currentZoneId: "zone_central", routeId: "route_west_iraq", hasFallbackNav: false, hasGroundSupport: false, gnssTrustLevel: 80, progress: 16 },
];

const initialZones: MapZone[] = [
  { id: "zone_north", name: "تبریز", x: 45, y: 18, threatLevel: "safe", gnssDisruption: 5, civilianSensitivity: 30, isRevealed: true },
  { id: "zone_east", name: "مشهد", x: 75, y: 42, threatLevel: "unknown", gnssDisruption: 12, civilianSensitivity: 55, isRevealed: false },
  { id: "zone_central", name: "تهران", x: 50, y: 50, threatLevel: "safe", gnssDisruption: 6, civilianSensitivity: 70, isRevealed: true },
  { id: "zone_south", name: "بندرعباس", x: 40, y: 78, threatLevel: "safe", gnssDisruption: 4, civilianSensitivity: 45, isRevealed: true },
  { id: "zone_west", name: "مرز عراق", x: 24, y: 48, threatLevel: "safe", gnssDisruption: 7, civilianSensitivity: 50, isRevealed: true },
  { id: "zone_support_east", name: "پایگاه پشتیبانی مشهد", x: 68, y: 48, threatLevel: "safe", gnssDisruption: 18, civilianSensitivity: 35, isRevealed: true },
  { id: "zone_ambush", name: "نقطه مشکوک محور مشهد", x: 70, y: 39, threatLevel: "unknown", gnssDisruption: 65, civilianSensitivity: 45, isRevealed: false },
];

const routes: Route[] = [
  { id: "route_main_east", name: "تهران به مشهد", fromZoneId: "zone_central", toZoneId: "zone_east", travelCost: 8, delayRisk: 22, gnssRisk: 38, civilianImpact: 45, visualStatus: "risky" },
  { id: "route_south", name: "بندرعباس به تهران", fromZoneId: "zone_south", toZoneId: "zone_central", travelCost: 12, delayRisk: 30, gnssRisk: 22, civilianImpact: 48, visualStatus: "safe" },
  { id: "route_north", name: "تبریز به تهران", fromZoneId: "zone_north", toZoneId: "zone_central", travelCost: 10, delayRisk: 24, gnssRisk: 20, civilianImpact: 30, visualStatus: "safe" },
  { id: "route_west_iraq", name: "تهران به مرز عراق", fromZoneId: "zone_central", toZoneId: "zone_west", travelCost: 11, delayRisk: 32, gnssRisk: 26, civilianImpact: 42, visualStatus: "safe" },
  { id: "route_north_alt", name: "مسیر جایگزین شمالی به مشهد", fromZoneId: "zone_central", toZoneId: "zone_east", travelCost: 16, delayRisk: 34, gnssRisk: 20, civilianImpact: 34, visualStatus: "safe" },
  { id: "route_staged_east", name: "مسیر مرحله‌ای کنترل‌شده", fromZoneId: "zone_central", toZoneId: "zone_support_east", travelCost: 18, delayRisk: 28, gnssRisk: 24, civilianImpact: 36, visualStatus: "safe" },
  { id: "route_ambush_spur", name: "مسیر فرعی کمین نزدیک مشهد", fromZoneId: "zone_support_east", toZoneId: "zone_ambush", travelCost: 6, delayRisk: 54, gnssRisk: 82, civilianImpact: 52, visualStatus: "unknown" },
  { id: "route_phantom", name: "مسیر فریب دشمن", fromZoneId: "zone_support_east", toZoneId: "zone_ambush", travelCost: 5, delayRisk: 20, gnssRisk: 70, civilianImpact: 20, visualStatus: "unknown" },
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

const weights = (partial: Partial<ScenarioTwoDecisionWeights> = {}): ScenarioTwoDecisionWeights => ({ ...zeroWeights, ...partial });

const actionCatalog: Record<string, ActionCard> = {
  routine_routes: {
    id: "routine_routes",
    title: "بررسی وضعیت مسیرها",
    subtitle: "روشن کردن مسیر چهار کاروان و تثبیت تصویر اولیه",
    description: "مسیرهای چهار کاروان طبق برنامه بررسی می‌شوند.",
    expectedResult: "پایداری کاروان‌های فرعی بهتر می‌شود، اما تهدید پنهان هنوز آشکار نمی‌شود.",
    mapEffect: "چهار مسیر اصلی برای چند ثانیه روشن می‌شوند.",
    riskText: "اطلاعات تهدید احتمالی هنوز قطعی نمی‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["پایش روتین", "ثبات شبکه"],
    category: "diagnosis",
    cost: { time: 3 },
    effects: { secondaryConvoyStability: 5, logisticsContinuity: 4 },
    targetType: "global",
    weights: weights({ logisticsWeight: 4, secondOrderThinkingWeight: 3 }),
  },
  routine_gnss: {
    id: "routine_gnss",
    title: "بررسی موقعیت GNSS کاروان‌ها",
    subtitle: "ثبت ping موقعیت اولیه همه کاروان‌ها",
    description: "مختصات GNSS همه کاروان‌ها با طرح حرکت مقایسه می‌شود.",
    expectedResult: "تصویر اولیه کامل‌تر می‌شود، اما اعتماد صرف به GNSS می‌تواند خطرناک باشد.",
    mapEffect: "کنار هر کاروان ping موقعیت ظاهر می‌شود.",
    riskText: "اگر فقط به GNSS اعتماد شود، راند بعد ریسک اعتماد کاذب بالا می‌رود.",
    missionImpact: "کم",
    objectiveTags: ["موقعیت اولیه", "GNSS"],
    category: "diagnosis",
    cost: { time: 2 },
    effects: { navigationIntegrity: 4, gnssExposureRisk: 4 },
    targetType: "global",
    weights: weights({ infoSeekingWeight: 2, navigationIntegrityWeight: 2 }),
  },
  routine_radio: {
    id: "routine_radio",
    title: "بررسی ارتباطات رادیویی",
    subtitle: "تثبیت کانال هشدار بین قرارگاه و کاروان‌ها",
    description: "ارتباط رادیویی با هر چهار کاروان چک می‌شود تا در صورت اختلال، هشدار سریع‌تر برسد.",
    expectedResult: "پایداری شبکه بهتر می‌شود.",
    mapEffect: "موج ارتباطی از تهران به هر کاروان نمایش داده می‌شود.",
    riskText: "زمان اندکی مصرف می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["ارتباطات", "هشدار سریع"],
    category: "command",
    cost: { time: 3 },
    effects: { secondaryConvoyStability: 5, logisticsContinuity: 3 },
    targetType: "global",
    weights: weights({ logisticsWeight: 4, secondOrderThinkingWeight: 4 }),
  },
  routine_preserve: {
    id: "routine_preserve",
    title: "ذخیره منابع و ادامه طبق برنامه",
    subtitle: "حرکت عادی بدون مصرف منابع",
    description: "کاروان‌ها طبق برنامه ادامه می‌دهند و منابع برای مرحله‌های بعدی حفظ می‌شود.",
    expectedResult: "منابع حفظ می‌شوند.",
    mapEffect: "حرکت عادی کاروان‌ها ادامه پیدا می‌کند.",
    riskText: "شناخت اولیه کمتر است.",
    missionImpact: "کم",
    objectiveTags: ["ذخیره منابع"],
    category: "command",
    cost: {},
    effects: { resourceReserve: 3, ambiguity: 5 },
    targetType: "global",
    weights: weights({ resourceEfficiencyWeight: 6, infoSeekingWeight: -3 }),
  },
  scan_all_nodes: {
    id: "scan_all_nodes",
    title: "اسکن سراسری چهار گره عملیاتی",
    subtitle: "تهران، مشهد، تبریز و بندرعباس هم‌زمان بررسی شوند",
    description: "یک اسکن پرهزینه اما جامع روی چهار گره عملیاتی اجرا می‌شود.",
    expectedResult: "گره دارای بیشترین ناسازگاری مشخص می‌شود.",
    mapEffect: "هر چهار شهر scan pulse می‌گیرند و گره مشکوک آشکار می‌شود.",
    riskText: "ISR و زمان زیادی مصرف می‌شود.",
    missionImpact: "زیاد",
    objectiveTags: ["کشف اختلال", "کاهش ابهام"],
    category: "diagnosis",
    cost: { satelliteISR: 25, time: 10 },
    effects: { threatIdentification: 35, ambiguity: -30, navigationIntegrity: 8 },
    targetType: "global",
    weights: weights({ infoSeekingWeight: 9, secondOrderThinkingWeight: 6 }),
  },
  scan_mashhad: {
    id: "scan_mashhad",
    title: "اسکن هدفمند مشهد",
    subtitle: "تمرکز روی یکی از گره‌های شرقی شبکه",
    description: "گره شرقی شبکه هدف اسکن قرار می‌گیرد تا فرض اختلال در مقصد بررسی شود.",
    expectedResult: "اگر این گره منشأ ناسازگاری باشد، سریع و کم‌هزینه‌تر تأیید می‌شود.",
    mapEffect: "گره شرقی و محور ورودی آن scan می‌شوند.",
    riskText: "اگر نشانه را اشتباه خوانده باشید، گره‌های دیگر کمتر بررسی می‌شوند.",
    missionImpact: "زیاد",
    objectiveTags: ["کشف اختلال", "تصمیم دقیق"],
    category: "diagnosis",
    cost: { satelliteISR: 15, time: 6 },
    effects: { threatIdentification: 40, ambiguity: -35, gnssExposureRisk: -6 },
    targetType: "zone",
    weights: weights({ infoSeekingWeight: 10, secondOrderThinkingWeight: 7, cognitiveFlexibilityWeight: 4 }),
  },
  scan_tehran: {
    id: "scan_tehran",
    title: "اسکن تهران",
    subtitle: "پاک‌سازی گره فرماندهی از فرض اختلال",
    description: "تهران بررسی می‌شود تا مشخص شود مشکل از مرکز فرماندهی نیست.",
    expectedResult: "مشخص می‌کند آیا هشدار از گره تهران منشأ گرفته یا نه.",
    mapEffect: "تهران scan می‌شود.",
    riskText: "اگر منشأ اختلال در گره دیگری باشد، بخشی از زمان و ISR مصرف می‌شود.",
    missionImpact: "کم",
    objectiveTags: ["رد فرض غلط"],
    category: "diagnosis",
    cost: { satelliteISR: 10, time: 5 },
    effects: { ambiguity: -8, threatIdentification: 8 },
    targetType: "zone",
    weights: weights({ infoSeekingWeight: 4 }),
  },
  scan_tabriz: {
    id: "scan_tabriz",
    title: "اسکن تبریز",
    subtitle: "بررسی گره شمال‌غرب و مسیر کاروان ج",
    description: "گره تبریز و مسیر کاروان ج بررسی می‌شود تا نقش آن در هشدار مشخص شود.",
    expectedResult: "می‌تواند منشأ هشدار در شمال‌غرب را تأیید یا رد کند.",
    mapEffect: "روی شهر تبریز انیمیشن scan اجرا می‌شود.",
    riskText: "اگر منشأ اختلال در گره دیگری باشد، بخشی از زمان و ISR مصرف می‌شود.",
    missionImpact: "کم",
    objectiveTags: ["ثبات فرعی"],
    category: "diagnosis",
    cost: { satelliteISR: 10, time: 5 },
    effects: { secondaryConvoyStability: 5, ambiguity: -4 },
    targetType: "zone",
    weights: weights({ logisticsWeight: 3, infoSeekingWeight: 2 }),
  },
  scan_bandar: {
    id: "scan_bandar",
    title: "اسکن بندرعباس",
    subtitle: "بررسی گره جنوب و مسیر کاروان ب",
    description: "گره بندرعباس و مسیر کاروان ب بررسی می‌شود تا نقش آن در هشدار مشخص شود.",
    expectedResult: "می‌تواند منشأ هشدار در جنوب را تأیید یا رد کند.",
    mapEffect: "روی بندرعباس انیمیشن scan اجرا می‌شود.",
    riskText: "اگر منشأ اختلال در گره دیگری باشد، بخشی از زمان و ISR مصرف می‌شود.",
    missionImpact: "کم",
    objectiveTags: ["ثبات فرعی"],
    category: "diagnosis",
    cost: { satelliteISR: 10, time: 5 },
    effects: { secondaryConvoyStability: 5, ambiguity: -4 },
    targetType: "zone",
    weights: weights({ logisticsWeight: 3, infoSeekingWeight: 2 }),
  },
  wait_normal: {
    id: "wait_normal",
    title: "صبر و ادامه پایش عادی",
    subtitle: "عدم مصرف منبع در برابر هشدار مبهم",
    description: "کاروان‌ها حرکت می‌کنند و هشدار مبهم قطعی نمی‌شود.",
    expectedResult: "منابع حفظ می‌شوند.",
    mapEffect: "fog روی گره مشکوک باقی می‌ماند.",
    riskText: "ابهام، ریسک GNSS و ریسک کمین افزایش می‌یابد.",
    missionImpact: "پرریسک",
    objectiveTags: ["حفظ منابع", "ریسک ابهام"],
    category: "risky",
    cost: {},
    effects: { ambiguity: 15, gnssExposureRisk: 10, ambushRisk: 5 },
    targetType: "global",
    weights: weights({ resourceEfficiencyWeight: 4, infoSeekingWeight: -7, secondOrderThinkingWeight: -4 }),
  },
  alpha_special_monitoring: {
    id: "alpha_special_monitoring",
    title: "پایش ویژه کاروان مشکوک",
    subtitle: "تمرکز روی کاروانی که با داده‌های متناقض درگیر شده",
    description: "کاروان مشکوک glow پایش می‌گیرد و مسیر آن با حساسیت بالاتر دنبال می‌شود.",
    expectedResult: "سلامت کاروان درگیر و شناسایی تهدید بهتر می‌شود.",
    mapEffect: "کاروان درگیر glow و مسیر آن پررنگ می‌شود.",
    riskText: "مسیرهای دیگر کمتر کنترل می‌شوند.",
    missionImpact: "زیاد",
    objectiveTags: ["پایش ویژه", "کاهش ابهام"],
    category: "diagnosis",
    cost: { satelliteISR: 15, time: 6 },
    effects: { alphaHealth: 10, threatIdentification: 10, secondaryConvoyStability: -5 },
    targetType: "convoy",
    weights: weights({ criticalDeliveryWeight: 8, infoSeekingWeight: 7, secondOrderThinkingWeight: 5 }),
  },
  balanced_monitoring: {
    id: "balanced_monitoring",
    title: "پایش متعادل همه کاروان‌ها",
    subtitle: "الف زیر نظر، شبکه هم رها نمی‌شود",
    description: "روی همه کاروان‌ها ping پایش می‌آید و الف کمی قوی‌تر دنبال می‌شود.",
    expectedResult: "تعادل بین مأموریت اصلی و روتین شبکه حفظ می‌شود.",
    mapEffect: "روی همه کاروان‌ها ping پایش ظاهر می‌شود.",
    riskText: "مصرف ISR و زمان بیشتر است.",
    missionImpact: "متوسط",
    objectiveTags: ["تعادل", "ثبات شبکه"],
    category: "command",
    cost: { satelliteISR: 20, time: 8 },
    effects: { alphaHealth: 7, secondaryConvoyStability: 10, ambiguity: -8 },
    targetType: "global",
    weights: weights({ logisticsWeight: 7, criticalDeliveryWeight: 5, secondOrderThinkingWeight: 7 }),
  },
  alpha_only_focus: {
    id: "alpha_only_focus",
    title: "تمرکز کامل روی کاروان مشکوک",
    subtitle: "توقف چک روتین بقیه مسیرها",
    description: "فقط کاروان مشکوک پایش سنگین می‌گیرد و مسیرهای ب، ج و د کم‌رنگ می‌شوند.",
    expectedResult: "کاروان درگیر بهتر کنترل می‌شود.",
    mapEffect: "فقط مسیر کاروان درگیر روشن می‌ماند.",
    riskText: "کاروان‌های دیگر در ریسک رهاشدگی قرار می‌گیرند.",
    missionImpact: "متوسط",
    objectiveTags: ["تمرکز عملیاتی"],
    category: "command",
    cost: { satelliteISR: 12, time: 4 },
    effects: { alphaHealth: 12, secondaryConvoyStability: -15, ambushRisk: -5 },
    targetType: "global",
    weights: weights({ criticalDeliveryWeight: 8, logisticsWeight: -4 }),
  },
  normal_routine: {
    id: "normal_routine",
    title: "ادامه روتین معمولی",
    subtitle: "بدون پایش ویژه برای الف",
    description: "همه کاروان‌ها طبق روال عادی ادامه می‌دهند.",
    expectedResult: "شبکه فرعی کمی پایدار می‌ماند.",
    mapEffect: "حرکت عادی ادامه دارد.",
    riskText: "الف در محور مشهد پایش ویژه ندارد.",
    missionImpact: "پرریسک",
    objectiveTags: ["روتین", "ریسک الف"],
    category: "risky",
    cost: { time: 2 },
    effects: { secondaryConvoyStability: 5, alphaHealth: -5, ambiguity: 10, ambushRisk: 5 },
    targetType: "global",
    weights: weights({ logisticsWeight: 3, criticalDeliveryWeight: -5 }),
  },
  route_main_heavy_watch: {
    id: "route_main_heavy_watch",
    title: "ادامه مسیر اصلی با پایش سنگین",
    subtitle: "سرعت حفظ شود، مسیر مشکوک زیر sweep بماند",
    description: "کاروان الف مسیر اصلی را ادامه می‌دهد اما ISR سنگین روی آن اجرا می‌شود.",
    expectedResult: "پیشرفت خوب است، اما کاروان در محور مشکوک باقی می‌ماند.",
    mapEffect: "مسیر اصلی زرد/قرمز و sweep پایش روی آن اجرا می‌شود.",
    riskText: "ریسک کمین بالا می‌رود.",
    missionImpact: "پرریسک",
    objectiveTags: ["سرعت", "پایش"],
    category: "risky",
    cost: { satelliteISR: 20, time: 5 },
    effects: { alphaProgress: 20, threatIdentification: 10, ambushRisk: 8, alphaHealth: -3 },
    targetType: "route",
    weights: weights({ delayControlWeight: 6, infoSeekingWeight: 5, secondOrderThinkingWeight: -2 }),
  },
  route_northern: {
    id: "route_northern",
    title: "تغییر مسیر به مسیر شمالی",
    subtitle: "دور کردن الف از محور مشکوک مشهد",
    description: "مسیر اصلی کم‌رنگ می‌شود و مسیر جایگزین شمالی برای نزدیک شدن امن‌تر فعال می‌شود.",
    expectedResult: "ریسک کمین کم می‌شود و سلامت الف بهتر می‌شود.",
    mapEffect: "مسیر جدید آبی/سبز از شمال به مشهد روشن می‌شود.",
    riskText: "تأخیر عملیاتی افزایش می‌یابد.",
    missionImpact: "زیاد",
    objectiveTags: ["مسیر امن", "نجات الف"],
    category: "logistics",
    cost: { energy: 15, time: 10 },
    effects: { alphaProgress: 12, ambushRisk: -15, alphaHealth: 10, cumulativeDelay: 10 },
    targetType: "route",
    weights: weights({ criticalDeliveryWeight: 8, secondOrderThinkingWeight: 7, cognitiveFlexibilityWeight: 7 }),
  },
  route_staged: {
    id: "route_staged",
    title: "مسیر مرحله‌ای با توقف‌های کنترل‌شده",
    subtitle: "عبور کندتر اما قابل کنترل‌تر",
    description: "چند waypoint امن و کنترل موقعیت برای کاروان الف تعریف می‌شود.",
    expectedResult: "احتمال انحراف کم می‌شود.",
    mapEffect: "waypointهای امن روی مسیر ظاهر می‌شوند.",
    riskText: "تأخیر افزایش پیدا می‌کند.",
    missionImpact: "زیاد",
    objectiveTags: ["کنترل مسیر", "سلامت الف"],
    category: "navigation",
    cost: { time: 12, energy: 8 },
    effects: { alphaHealth: 15, ambushRisk: -10, alphaProgress: 8, cumulativeDelay: 12 },
    targetType: "route",
    weights: weights({ criticalDeliveryWeight: 7, secondOrderThinkingWeight: 8, navigationIntegrityWeight: 7 }),
  },
  pause_alpha: {
    id: "pause_alpha",
    title: "توقف موقت تا روشن شدن وضعیت",
    subtitle: "کاهش ریسک فوری به قیمت از دست دادن زمان",
    description: "کاروان الف متوقف می‌شود تا تصویر تهدید روشن‌تر شود.",
    expectedResult: "سلامت الف کمی بهتر و ریسک کمین کمتر می‌شود.",
    mapEffect: "کاروان الف badge PAUSED می‌گیرد.",
    riskText: "زمان تحویل به خطر می‌افتد.",
    missionImpact: "متوسط",
    objectiveTags: ["کاهش ریسک", "تأخیر"],
    category: "command",
    cost: { time: 15 },
    effects: { alphaHealth: 5, ambushRisk: -8, cumulativeDelay: 15 },
    targetType: "convoy",
    weights: weights({ secondOrderThinkingWeight: 4, delayControlWeight: -6 }),
  },
  more_checkpoints: {
    id: "more_checkpoints",
    title: "افزایش توقف‌های کنترل موقعیت",
    subtitle: "کنترل دقیق‌تر در بخش حساس مسیر",
    description: "توقف‌های کنترل موقعیت بیشتر می‌شود.",
    expectedResult: "سلامت و کنترل مسیر بهتر می‌شود.",
    mapEffect: "waypointهای کنترل روی مسیر ظاهر می‌شوند.",
    riskText: "سرعت کاهش می‌یابد.",
    missionImpact: "متوسط",
    objectiveTags: ["کنترل", "سلامت"],
    category: "navigation",
    cost: { time: 12 },
    effects: { alphaHealth: 12, ambushRisk: -10, alphaProgress: 8, cumulativeDelay: 12 },
    targetType: "global",
    weights: weights({ navigationIntegrityWeight: 7, secondOrderThinkingWeight: 6 }),
  },
  fewer_stops: {
    id: "fewer_stops",
    title: "کاهش توقف‌های غیرضروری",
    subtitle: "جبران زمان با پذیرش ریسک انحراف",
    description: "کاروان الف توقف‌های کم‌اهمیت را حذف می‌کند و سریع‌تر حرکت می‌کند.",
    expectedResult: "زمان جبران می‌شود.",
    mapEffect: "waypointهای غیرضروری حذف و حرکت سریع‌تر می‌شود.",
    riskText: "ریسک خطا و انحراف بالا می‌رود.",
    missionImpact: "پرریسک",
    objectiveTags: ["سرعت", "ریسک"],
    category: "risky",
    cost: { energy: 5 },
    effects: { alphaProgress: 22, cumulativeDelay: -5, ambushRisk: 10, alphaHealth: -5 },
    targetType: "global",
    weights: weights({ delayControlWeight: 8, secondOrderThinkingWeight: -4 }),
  },
  dispatch_ground_support: {
    id: "dispatch_ground_support",
    title: "اعزام نیروی پشتیبانی زمینی",
    subtitle: "آماده‌سازی مقابله برای محور مشهد",
    description: "تیم پشتیبانی از پایگاه نزدیک مشهد به سمت مسیر الف اعزام می‌شود.",
    expectedResult: "اگر تهدید آشکار شود، واکنش زمینی آماده است.",
    mapEffect: "آیکون تیم پشتیبانی به سمت مسیر الف حرکت می‌کند.",
    riskText: "انرژی و زمان مصرف می‌شود.",
    missionImpact: "زیاد",
    objectiveTags: ["مقابله زمینی", "آمادگی راند ۷"],
    category: "logistics",
    cost: { energy: 15, time: 6 },
    effects: { alphaHealth: 12, ambushRisk: -12 },
    targetType: "zone",
    weights: weights({ secondOrderThinkingWeight: 9, adversaryModelingWeight: 7, criticalDeliveryWeight: 7 }),
  },
  prioritize_secondary: {
    id: "prioritize_secondary",
    title: "اولویت دادن به روتین سایر کاروان‌ها",
    subtitle: "حفظ ب، ج و د در برابر رهاشدگی",
    description: "کاروان‌های ب، ج و د ping پایش و حرکت منظم می‌گیرند.",
    expectedResult: "شبکه پایدار می‌ماند.",
    mapEffect: "ب، ج و د ping و حرکت منظم می‌گیرند.",
    riskText: "تمرکز روی کاروان الف کمتر می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["ثبات شبکه"],
    category: "command",
    cost: { time: 8, satelliteISR: 8 },
    effects: { secondaryConvoyStability: 15, alphaProgress: 5 },
    targetType: "global",
    weights: weights({ logisticsWeight: 8, secondOrderThinkingWeight: 5 }),
  },
  alpha_priority: {
    id: "alpha_priority",
    title: "اولویت مطلق با کاروان الف",
    subtitle: "تقویت محموله درمانی به قیمت کند شدن شبکه",
    description: "بیشتر منابع باقی‌مانده به کاروان الف اختصاص می‌یابد.",
    expectedResult: "الف تقویت می‌شود.",
    mapEffect: "الف حرکت و پشتیبانی بیشتر می‌گیرد و ب/ج/د کندتر می‌شوند.",
    riskText: "شبکه لجستیک آسیب‌پذیرتر می‌شود.",
    missionImpact: "زیاد",
    objectiveTags: ["نجات الف"],
    category: "command",
    cost: { energy: 15, satelliteISR: 10, time: 8 },
    effects: { alphaHealth: 15, alphaProgress: 18, secondaryConvoyStability: -15, resourceReserve: -10 },
    targetType: "global",
    weights: weights({ criticalDeliveryWeight: 10, logisticsWeight: -4 }),
  },
  balanced_resources: {
    id: "balanced_resources",
    title: "تقسیم متعادل منابع",
    subtitle: "هیچ مسیر کاملاً رها نشود",
    description: "منابع بین الف و روتین سایر کاروان‌ها تقسیم می‌شود.",
    expectedResult: "تعادل حفظ می‌شود.",
    mapEffect: "همه کاروان‌ها حرکت کنترل‌شده دارند.",
    riskText: "اثر مستقیم روی الف کمتر از اولویت مطلق است.",
    missionImpact: "متوسط",
    objectiveTags: ["تعادل", "حفظ شبکه"],
    category: "command",
    cost: { energy: 12, satelliteISR: 12, time: 10 },
    effects: { alphaHealth: 8, alphaProgress: 12, secondaryConvoyStability: 10 },
    targetType: "global",
    weights: weights({ logisticsWeight: 8, secondOrderThinkingWeight: 8 }),
  },
  preserve_final_resources: {
    id: "preserve_final_resources",
    title: "حفظ منابع برای مرحله نهایی",
    subtitle: "حرکت کندتر اما با ذخیره واکنش",
    description: "اقدام سنگین انجام نمی‌شود تا راند ۷ و ۸ امکان نجات باقی بماند.",
    expectedResult: "ذخیره عملیاتی بالا می‌ماند.",
    mapEffect: "حرکت کندتر اما منظم ادامه دارد.",
    riskText: "پیشرفت الف کمتر می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["ذخیره عملیاتی"],
    category: "command",
    cost: { time: 3 },
    effects: { resourceReserve: 15, alphaProgress: 6, alphaHealth: 2 },
    targetType: "global",
    weights: weights({ resourceEfficiencyWeight: 9, secondOrderThinkingWeight: 8 }),
  },
  sacrifice_delta: {
    id: "sacrifice_delta",
    title: "قربانی کردن روتین کاروان د",
    subtitle: "کم کردن اولویت مسیر عراق برای حفظ مأموریت اصلی",
    description: "کاروان د کند یا متوقف می‌شود تا ظرفیت بیشتری برای الف باقی بماند.",
    expectedResult: "منابع مأموریت اصلی بهتر حفظ می‌شود.",
    mapEffect: "کاروان د کند یا PAUSED می‌شود.",
    riskText: "ثبات شبکه فرعی کمی کاهش می‌یابد.",
    missionImpact: "متوسط",
    objectiveTags: ["ذخیره منابع", "اولویت‌بندی"],
    category: "logistics",
    cost: {},
    effects: { resourceReserve: 10, alphaHealth: 6, secondaryConvoyStability: -5 },
    targetType: "convoy",
    weights: weights({ resourceEfficiencyWeight: 8, secondOrderThinkingWeight: 6 }),
  },
  emergency_safe_route: {
    id: "emergency_safe_route",
    title: "تغییر فوری مسیر کاروان در خطر",
    subtitle: "قطع مسیر کمین و روشن کردن مسیر امن",
    description: "مسیر قرمز/آلوده قطع می‌شود و کاروان از محور امن‌تر ادامه می‌دهد.",
    expectedResult: "کاروان در خطر از مسیر کمین دور می‌شود.",
    mapEffect: "مسیر قرمز قطع و مسیر امن روشن می‌شود.",
    riskText: "تأخیر افزایش می‌یابد.",
    missionImpact: "زیاد",
    objectiveTags: ["فرار از کمین", "نجات محموله"],
    category: "navigation",
    cost: { energy: 18, time: 10 },
    effects: { ambushRisk: -25, alphaHealth: 15, alphaProgress: 8, cumulativeDelay: 10 },
    targetType: "route",
    weights: weights({ criticalDeliveryWeight: 10, cognitiveFlexibilityWeight: 9, adversaryModelingWeight: 6 }),
  },
  attack_signal_source: {
    id: "attack_signal_source",
    title: "اعزام نیروی زمینی به منبع اختلال",
    subtitle: "فشار مستقیم روی سیگنال فریبنده",
    description: "نیروی زمینی به منبع اختلال نزدیک محور مشهد اعزام می‌شود.",
    expectedResult: "سیگنال فریبنده تضعیف می‌شود.",
    mapEffect: "آیکون نیروی زمینی به سمت نقطه تهدید حرکت می‌کند.",
    riskText: "اگر زودتر آماده نشده باشد، هزینه بالاتر است.",
    missionImpact: "زیاد",
    objectiveTags: ["مقابله زمینی", "کاهش کمین"],
    category: "logistics",
    cost: { energy: 15, time: 8 },
    effects: { threatIdentification: 20, ambushRisk: -20 },
    targetType: "zone",
    weights: weights({ adversaryModelingWeight: 8, secondOrderThinkingWeight: 8, criticalDeliveryWeight: 7 }),
  },
  deception_route: {
    id: "deception_route",
    title: "ایجاد مسیر فریب برای دشمن",
    subtitle: "هدایت دشمن به مسیر جعلی و عبور واقعی الف",
    description: "یک مسیر phantom برای دشمن ساخته می‌شود و مسیر واقعی با امضای کم‌تر ادامه می‌یابد.",
    expectedResult: "دشمن به مسیر جعلی هدایت می‌شود.",
    mapEffect: "مسیر phantom کم‌رنگ و مسیر واقعی آبی کم‌رنگ نمایش داده می‌شود.",
    riskText: "اگر ISR کم باشد، فریب ناقص اجرا می‌شود.",
    missionImpact: "زیاد",
    objectiveTags: ["فریب", "مدل‌سازی دشمن"],
    category: "deception",
    cost: { satelliteISR: 12, energy: 8 },
    effects: { ambushRisk: -18 },
    targetType: "route",
    weights: weights({ adversaryModelingWeight: 10, infoSeekingWeight: 5, secondOrderThinkingWeight: 8 }),
  },
  fast_escort: {
    id: "fast_escort",
    title: "ادامه با اسکورت و سرعت بالا",
    subtitle: "عبور سریع از محور تهدید",
    description: "کاروان با اسکورت و سرعت بالا از محدوده عبور می‌کند.",
    expectedResult: "پیشرفت زیاد می‌شود.",
    mapEffect: "آیکون اسکورت کنار کاروان اضافه می‌شود.",
    riskText: "اگر مسیر قبلاً شناخته نشده باشد، ریسک کمین بالا می‌رود.",
    missionImpact: "پرریسک",
    objectiveTags: ["سرعت", "اسکورت"],
    category: "risky",
    cost: { energy: 20, time: 4 },
    effects: { alphaProgress: 25, alphaHealth: 5, ambushRisk: 10 },
    targetType: "convoy",
    weights: weights({ delayControlWeight: 9, criticalDeliveryWeight: 5, secondOrderThinkingWeight: -4 }),
  },
  final_guide: {
    id: "final_guide",
    title: "هدایت نهایی به مقصد مشهد",
    subtitle: "آخرین اصلاح مسیر برای رساندن الف",
    description: "اگر وضعیت بحرانی نباشد، کاروان به مقصد مشهد هدایت نهایی می‌شود.",
    expectedResult: "پیشرفت الف کامل می‌شود.",
    mapEffect: "الف وارد مشهد می‌شود و badge DELIVERED می‌گیرد.",
    riskText: "در ریسک کمین بالا کافی نیست.",
    missionImpact: "زیاد",
    objectiveTags: ["تحویل نهایی"],
    category: "navigation",
    cost: { time: 5, energy: 5 },
    effects: { alphaProgress: 25, alphaHealth: 5 },
    targetType: "global",
    weights: weights({ criticalDeliveryWeight: 8 }),
  },
  final_ground_support: {
    id: "final_ground_support",
    title: "درخواست پشتیبانی نهایی زمینی",
    subtitle: "جلوگیری از آسیب در ریسک متوسط",
    description: "پشتیبانی زمینی برای عبور نهایی فعال می‌شود.",
    expectedResult: "اگر ریسک متوسط باشد، از compromised شدن جلوگیری می‌کند.",
    mapEffect: "پشتیبانی زمینی در محور مشهد روشن می‌شود.",
    riskText: "در ریسک خیلی بالا کافی نیست.",
    missionImpact: "متوسط",
    objectiveTags: ["پشتیبانی نهایی"],
    category: "logistics",
    cost: { energy: 10 },
    effects: { ambushRisk: -12, alphaHealth: 8 },
    targetType: "global",
    weights: weights({ secondOrderThinkingWeight: 5, criticalDeliveryWeight: 5 }),
  },
  final_no_action: {
    id: "final_no_action",
    title: "ادامه بدون اقدام",
    subtitle: "نتیجه بر اساس وضعیت قبلی محاسبه شود",
    description: "هیچ منبعی مصرف نمی‌شود و نتیجه از تصمیم‌های قبلی به دست می‌آید.",
    expectedResult: "منابع حفظ می‌شوند.",
    mapEffect: "حرکت نهایی بدون تغییر ادامه پیدا می‌کند.",
    riskText: "اگر ریسک کمین بالا باشد، الف ممکن است ناپدید شود.",
    missionImpact: "پرریسک",
    objectiveTags: ["بدون اقدام"],
    category: "risky",
    cost: {},
    effects: {},
    targetType: "global",
    weights: weights({ resourceEfficiencyWeight: 3 }),
  },
  support_alpha_radio: {
    id: "support_alpha_radio",
    title: "چک رادیویی کاروان الف",
    subtitle: "کاهش ابهام در ارتباط با الف",
    description: "کانال ارتباطی کاروان الف چک می‌شود.",
    expectedResult: "سلامت عملیاتی الف بهتر حفظ می‌شود.",
    mapEffect: "موج ارتباطی روی الف ظاهر می‌شود.",
    riskText: "زمان کمی مصرف می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["ارتباط الف"],
    category: "command",
    cost: { time: 3 },
    effects: { alphaHealth: 5 },
    targetType: "convoy",
    weights: weights({ criticalDeliveryWeight: 3 }),
  },
  support_secondary_check: {
    id: "support_secondary_check",
    title: "چک روتین ب/ج/د",
    subtitle: "پایداری مسیرهای فرعی",
    description: "وضعیت کاروان‌های فرعی بررسی می‌شود.",
    expectedResult: "پایداری شبکه فرعی بهتر می‌شود.",
    mapEffect: "ب، ج و د ping روتین می‌گیرند.",
    riskText: "زمان مصرف می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["ثبات فرعی"],
    category: "logistics",
    cost: { time: 5 },
    effects: { secondaryConvoyStability: 8 },
    targetType: "global",
    weights: weights({ logisticsWeight: 5 }),
  },
  support_mashhad_quick: {
    id: "support_mashhad_quick",
    title: "بررسی سریع مشهد",
    subtitle: "افزایش شناسایی تهدید محور ورودی",
    description: "یک بررسی سریع روی محور مشهد اجرا می‌شود.",
    expectedResult: "سطح شناسایی تهدید بهتر می‌شود.",
    mapEffect: "مشهد scan کوتاه می‌گیرد.",
    riskText: "ISR مصرف می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["کشف تهدید"],
    category: "diagnosis",
    cost: { satelliteISR: 10 },
    effects: { threatIdentification: 10, ambiguity: -6 },
    targetType: "zone",
    weights: weights({ infoSeekingWeight: 4 }),
  },
  support_medical_dest: {
    id: "support_medical_dest",
    title: "هماهنگی با مقصد درمانی مشهد",
    subtitle: "آماده‌سازی تحویل نهایی",
    description: "مرکز درمانی مشهد برای دریافت محموله آماده می‌شود.",
    expectedResult: "کیفیت تحویل نهایی بهتر می‌شود.",
    mapEffect: "مقصد مشهد highlight می‌شود.",
    riskText: "زمان مصرف می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["تحویل نهایی"],
    category: "civilian",
    cost: { time: 5 },
    effects: { criticalDelivery: 8, civilianStability: 4 },
    targetType: "zone",
    weights: weights({ civilianImpactWeight: 5 }),
  },
  support_fuel: {
    id: "support_fuel",
    title: "سوخت‌گیری اضطراری",
    subtitle: "حفظ توان حرکت کاروان الف",
    description: "توقف کوتاه سوخت‌گیری برای الف انجام می‌شود.",
    expectedResult: "سلامت عملیاتی الف بهتر می‌شود.",
    mapEffect: "نقطه سوخت‌گیری روی مسیر ظاهر می‌شود.",
    riskText: "زمان مصرف می‌شود.",
    missionImpact: "متوسط",
    objectiveTags: ["سلامت الف"],
    category: "logistics",
    cost: { time: 5 },
    effects: { alphaHealth: 5 },
    targetType: "convoy",
    weights: weights({ criticalDeliveryWeight: 3 }),
  },
};

const rounds: ScenarioTwoRound[] = [
  {
    id: "round_1",
    title: "راند ۱ — وضعیت عادی / پایش روتین",
    alertLevel: "زرد",
    narrative: "ساعت ۰۴:۲۰. چهار کاروان طبق برنامه در حال حرکت‌اند. مسیرها امن ارزیابی شده‌اند، ارتباطات برقرار است و GNSS موقعیت کاروان‌ها را عادی نشان می‌دهد.",
    operationalProblem: "در شروع شیفت عملیاتی، کدام پایش‌های روتین را انجام می‌دهید؟",
    roundGoal: "آشنایی با نقشه، کاروان‌ها و روال عادی قرارگاه.",
    actionIds: ["routine_routes", "routine_gnss", "routine_radio", "routine_preserve"],
    mainActionIds: ["routine_routes", "routine_gnss", "routine_radio", "routine_preserve"],
    supportActionIds: [],
  },
  {
    id: "round_2",
    title: "راند ۲ — هشدار مبهم / اختلال نامعلوم",
    alertLevel: "زرد",
    narrative: "سیستم هشدار سطح زرد می‌دهد. GNSS هنوز موقعیت‌ها را عادی نشان می‌دهد، اما یکی از گزارش‌های میدانی با مختصات ثبت‌شده هم‌خوان نیست.",
    operationalProblem: "هشدار نامشخص است. برای پیدا کردن محل اختلال، کدام گره‌های عملیاتی را اسکن می‌کنید؟",
    roundGoal: "پیدا کردن محل اختلال پیش از اثرگذاری روی جریان کاروان‌ها.",
    actionIds: ["scan_all_nodes", "scan_mashhad", "scan_tehran", "scan_tabriz", "scan_bandar", "wait_normal"],
    mainActionIds: ["scan_all_nodes", "scan_mashhad", "scan_tehran", "scan_tabriz", "scan_bandar", "wait_normal"],
    supportActionIds: [],
  },
  {
    id: "round_3",
    title: "راند ۳ — پایش ویژه مسیر مشکوک",
    alertLevel: "نارنجی",
    narrative: "اکنون مشخص شده اختلال به محور مشهد مربوط است. کاروان الف در مسیر تهران-مشهد قرار دارد و باید پایش ویژه شود.",
    operationalProblem: "چطور کاروان الف را زیر پایش ویژه می‌برید، بدون اینکه روتین سایر مسیرها مختل شود؟",
    roundGoal: "پایش ویژه کاروان الف بدون رها کردن روتین سایر مسیرها.",
    actionIds: ["alpha_special_monitoring", "balanced_monitoring", "alpha_only_focus", "normal_routine", "support_alpha_radio", "support_secondary_check"],
    mainActionIds: ["alpha_special_monitoring", "balanced_monitoring", "alpha_only_focus", "normal_routine"],
    supportActionIds: ["support_alpha_radio", "support_secondary_check"],
  },
  {
    id: "round_4",
    title: "راند ۴ — طراحی مسیر جدید",
    alertLevel: "نارنجی",
    narrative: "اکنون مسیر درگیر با اختلال مشخص شده است. هنوز تهدید واقعی معلوم نیست، اما ادامه مسیر بدون اصلاح خطرناک است.",
    operationalProblem: "کاروان درگیر چگونه باید به مقصد نزدیک شود؟",
    roundGoal: "تعیین راهبرد مسیر برای کاروان درگیر.",
    actionIds: ["route_main_heavy_watch", "route_northern", "route_staged", "pause_alpha", "support_fuel", "support_secondary_check"],
    mainActionIds: ["route_main_heavy_watch", "route_northern", "route_staged", "pause_alpha"],
    supportActionIds: ["support_fuel", "support_secondary_check"],
  },
  {
    id: "round_5",
    title: "راند ۵ — مدیریت توقف‌ها و پشتیبانی",
    alertLevel: "نارنجی",
    narrative: "کاروان درگیر وارد بخش حساس مسیر شده است. باید توقف سوخت، کنترل موقعیت، پشتیبانی زمینی و روتین سایر کاروان‌ها مدیریت شود.",
    operationalProblem: "برای عبور از بخش حساس مسیر، توقف‌ها و پشتیبانی را چگونه تنظیم می‌کنید؟",
    roundGoal: "تنظیم کیفیت حرکت کاروان درگیر و مدیریت مصرف منابع.",
    actionIds: ["more_checkpoints", "fewer_stops", "dispatch_ground_support", "prioritize_secondary", "support_mashhad_quick", "support_medical_dest", "support_fuel", "support_secondary_check"],
    mainActionIds: ["more_checkpoints", "fewer_stops", "dispatch_ground_support", "prioritize_secondary"],
    supportActionIds: ["support_mashhad_quick", "support_medical_dest", "support_fuel", "support_secondary_check"],
  },
  {
    id: "round_6",
    title: "راند ۶ — فشار منابع",
    alertLevel: "نارنجی",
    narrative: "منابع کاهش یافته‌اند. کاروان الف مهم‌ترین مأموریت است، اما کاروان‌های ب، ج و د هم نباید از روتین خارج شوند.",
    operationalProblem: "منابع باقی‌مانده را چگونه میان کاروان الف و روتین سایر مسیرها تقسیم می‌کنید؟",
    roundGoal: "تصمیم درباره اولویت منابع پیش از آشکار شدن تهدید اصلی.",
    actionIds: ["alpha_priority", "balanced_resources", "preserve_final_resources", "sacrifice_delta", "support_mashhad_quick", "support_secondary_check"],
    mainActionIds: ["alpha_priority", "balanced_resources", "preserve_final_resources", "sacrifice_delta"],
    supportActionIds: ["support_mashhad_quick", "support_secondary_check"],
  },
  {
    id: "round_7",
    title: "راند ۷ — تهدید آشکار / مسیر کمین",
    alertLevel: "قرمز",
    narrative: "اختلال از یک منبع زمینی نزدیک محور ورودی مشهد تقویت می‌شود. هدف دشمن فقط تأخیر نیست؛ او می‌خواهد کاروان الف را به مسیر فرعی کشانده و محموله را سرقت کند.",
    operationalProblem: "دشمن در حال کشاندن کاروان الف به مسیر فرعی است. چطور محموله را از کمین دور می‌کنید؟",
    roundGoal: "دور کردن کاروان الف از مسیر کمین و فعال کردن مقابله زمینی.",
    actionIds: ["emergency_safe_route", "attack_signal_source", "deception_route", "fast_escort", "support_medical_dest", "support_fuel"],
    mainActionIds: ["emergency_safe_route", "attack_signal_source", "deception_route", "fast_escort"],
    supportActionIds: ["support_medical_dest", "support_fuel"],
  },
  {
    id: "round_8",
    title: "راند ۸ — نتیجه نهایی",
    alertLevel: "قرمز",
    narrative: "آخرین راند نتیجه تمام تصمیم‌هاست. اگر مسیر، منابع، روتین‌ها و واکنش راند ۷ درست بوده باشند، کاروان‌ها به مقصد می‌رسند.",
    operationalProblem: "آیا برای رساندن نهایی کاروان الف اقدام اضطراری انجام می‌دهید؟",
    roundGoal: "نمایش نتیجه نهایی: رسیدن، تأخیر، آسیب یا ناپدید شدن محموله.",
    actionIds: ["final_guide", "final_ground_support", "final_no_action"],
    mainActionIds: ["final_guide", "final_ground_support", "final_no_action"],
    supportActionIds: [],
  },
];

const actionTitleById: Record<string, string> = Object.fromEntries(Object.entries(actionCatalog).map(([id, action]) => [id, action.title]));
const roundTitleById: Record<string, string> = Object.fromEntries(rounds.map((round) => [round.id, round.title]));

const initialMetrics: ScenarioTwoMetrics = {
  falseGnssRelianceTime: 0,
  isrUsageQuality: 50,
  routeDiversityScore: 45,
  resourceEfficiencyScore: 80,
  secondOrderThinkingScore: 50,
  adversaryModelingScore: 45,
  escalationSensitivityScore: 55,
  informationDisciplineScore: 55,
  cognitiveFlexibilityScore: 50,
  totalChangedActionCount: 0,
  totalPreviewOpenCount: 0,
};

const alertHelp: Record<ScenarioTwoRound["alertLevel"], string> = {
  زرد: "اختلال اولیه یا ابهام قابل مدیریت؛ هنوز فرصت تشخیص وجود دارد.",
  نارنجی: "ریسک عملیاتی فعال؛ مسیر و منابع باید با دقت مدیریت شوند.",
  قرمز: "تهدید آشکار؛ تصمیم مستقیم روی بقای کاروان الف اثر می‌گذارد.",
};

const statusLabel: Record<Convoy["status"], string> = {
  moving: "در مسیر",
  normal: "در مسیر",
  monitored: "پایش ویژه",
  suspicious: "مشکوک",
  rerouted: "تغییر مسیر یافته",
  paused: "متوقف",
  supported: "پشتیبانی‌شده",
  near_threat: "نزدیک تهدید",
  compromised: "آسیب‌دیده",
  lost_contact: "ناپدیدشده",
  delivered: "تحویل‌شده",
  delivered_delayed: "تحویل‌شده با تأخیر",
};

const addResources = (base: ResourceState, delta: Partial<ResourceState>, sign = -1): ResourceState => ({
  satelliteISR: clamp(base.satelliteISR + sign * (delta.satelliteISR ?? 0)),
  energy: clamp(base.energy + sign * (delta.energy ?? 0)),
  time: clamp(base.time + sign * (delta.time ?? 0)),
});

const applyStatusDelta = (base: ScenarioTwoMissionStatus, delta: Partial<ScenarioTwoMissionStatus>): ScenarioTwoMissionStatus => {
  const next = {
    ...base,
    alphaHealth: clamp(base.alphaHealth + (delta.alphaHealth ?? 0)),
    alphaProgress: clamp(base.alphaProgress + (delta.alphaProgress ?? 0)),
    threatIdentification: clamp(base.threatIdentification + (delta.threatIdentification ?? 0)),
    secondaryConvoyStability: clamp(base.secondaryConvoyStability + (delta.secondaryConvoyStability ?? 0)),
    resourceReserve: clamp(base.resourceReserve + (delta.resourceReserve ?? 0)),
    ambushRisk: clamp(base.ambushRisk + (delta.ambushRisk ?? 0)),
    logisticsContinuity: clamp(base.logisticsContinuity + (delta.logisticsContinuity ?? 0)),
    criticalDelivery: clamp(base.criticalDelivery + (delta.criticalDelivery ?? 0)),
    navigationIntegrity: clamp(base.navigationIntegrity + (delta.navigationIntegrity ?? 0)),
    civilianStability: clamp(base.civilianStability + (delta.civilianStability ?? 0)),
    escalationRisk: clamp(base.escalationRisk + (delta.escalationRisk ?? 0)),
    remainingResources: clamp(base.remainingResources + (delta.remainingResources ?? 0)),
    ambiguity: clamp(base.ambiguity + (delta.ambiguity ?? 0)),
    cumulativeDelay: Math.max(0, Math.round(base.cumulativeDelay + (delta.cumulativeDelay ?? 0))),
    gnssExposureRisk: clamp(base.gnssExposureRisk + (delta.gnssExposureRisk ?? 0)),
  };

  next.criticalDelivery = clamp((next.alphaHealth + next.alphaProgress) / 2);
  next.logisticsContinuity = clamp((next.secondaryConvoyStability * 0.65) + (next.resourceReserve * 0.35));
  next.navigationIntegrity = clamp(100 - next.ambiguity - next.gnssExposureRisk / 4 + next.threatIdentification / 5);
  next.remainingResources = next.resourceReserve;
  return next;
};

const sumCosts = (items: SelectedAction[]) =>
  items.reduce<Partial<ResourceState>>((sum, item) => ({
    satelliteISR: (sum.satelliteISR ?? 0) + (item.action.cost.satelliteISR ?? 0),
    energy: (sum.energy ?? 0) + (item.action.cost.energy ?? 0),
    time: (sum.time ?? 0) + (item.action.cost.time ?? 0),
  }), {});

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

const canAfford = (resources: ResourceState, action: ActionCard, selectedActions: SelectedAction[]) => {
  const preview = sumCosts(selectedActions);
  if ((action.cost.satelliteISR ?? 0) + (preview.satelliteISR ?? 0) > resources.satelliteISR) return "برای اجرای این اقدام، ظرفیت ISR کافی نیست.";
  if ((action.cost.energy ?? 0) + (preview.energy ?? 0) > resources.energy) return "برای اجرای این اقدام، انرژی عملیاتی کافی نیست.";
  if ((action.cost.time ?? 0) + (preview.time ?? 0) > resources.time) return "برای اجرای این اقدام، زمان عملیاتی کافی نیست.";
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
  if ((action.cost.satelliteISR ?? 0) > 0 && next.satelliteISR < 20) return "اجرای این اقدام ظرفیت ISR را به سطح بحرانی نزدیک می‌کند.";
  if ((action.cost.energy ?? 0) > 0 && next.energy < 20) return "اجرای این اقدام انرژی عملیاتی را به سطح بحرانی نزدیک می‌کند.";
  if ((action.cost.time ?? 0) > 0 && next.time < 20) return "اجرای این اقدام زمان عملیاتی را به سطح بحرانی نزدیک می‌کند.";
  return undefined;
};

const calculateMissionCompletion = (status: ScenarioTwoMissionStatus, resources: ResourceState, alphaStatus: Convoy["status"]) => {
  const statusScore = alphaStatus === "delivered" ? 35 : alphaStatus === "delivered_delayed" ? 28 : alphaStatus === "lost_contact" ? 0 : alphaStatus === "compromised" ? 8 : 18;
  const resourceReserve = (resources.satelliteISR + resources.energy + resources.time) / 3;
  return clamp(
    statusScore +
    status.alphaHealth * 0.2 +
    status.alphaProgress * 0.15 +
    (100 - status.ambushRisk) * 0.12 +
    status.threatIdentification * 0.08 +
    status.secondaryConvoyStability * 0.06 +
    resourceReserve * 0.04
  );
};

const getMedicalConvoy = (convoys: Convoy[]) => convoys.find((convoy) => convoy.id === "convoy_medical") ?? convoys[0];
const getResourceReserve = (resources: ResourceState) => clamp((resources.satelliteISR + resources.energy + resources.time) / 3);
const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const riskMetricColor = (value: number) => value < 35 ? "#22c55e" : value < 65 ? "#f59e0b" : "#f43f5e";

const getObjectiveChecks = (status: ScenarioTwoMissionStatus, convoys: Convoy[], resources: ResourceState) => {
  const alpha = getMedicalConvoy(convoys);
  const secondarySafe = convoys.filter((convoy) => convoy.id !== "convoy_medical" && !["compromised", "lost_contact"].includes(convoy.status)).length;
  return [
    { label: "کاروان الف تا پایان راند ۸ سالم به مشهد برسد", done: ["delivered", "delivered_delayed"].includes(alpha.status), value: `${alpha.progress}% | سلامت ${alpha.health}` },
    { label: "حداقل دو کاروان دیگر امن بمانند", done: secondarySafe >= 2, value: `${secondarySafe}/3` },
    { label: "محل اختلال قبل از راند ۴ شناسایی شود", done: status.threatIdentification >= 40, value: `${status.threatIdentification}` },
    { label: "منابع تا راند ۷ کاملاً مصرف نشوند", done: getResourceReserve(resources) >= 20, value: `ISR ${resources.satelliteISR} / ENG ${resources.energy} / TIME ${resources.time}` },
    { label: "الف از مسیر کمین دور شود", done: status.ambushRisk < 45, value: `${status.ambushRisk}` },
    { label: "روتین مسیرهای دیگر رها نشود", done: status.secondaryConvoyStability >= 55, value: `${status.secondaryConvoyStability}` },
  ];
};

const defaultTargetByActionId: Record<string, string | undefined> = {
  scan_mashhad: "zone_east",
  scan_tehran: "zone_central",
  scan_tabriz: "zone_north",
  scan_bandar: "zone_south",
  alpha_special_monitoring: "convoy_medical",
  support_alpha_radio: "convoy_medical",
  support_fuel: "convoy_medical",
  pause_alpha: "convoy_medical",
  dispatch_ground_support: "zone_support_east",
  support_mashhad_quick: "zone_east",
  support_medical_dest: "zone_east",
  route_main_heavy_watch: "route_main_east",
  route_northern: "route_north_alt",
  route_staged: "route_staged_east",
  emergency_safe_route: "route_north_alt",
  attack_signal_source: "zone_ambush",
  deception_route: "route_phantom",
  fast_escort: "convoy_medical",
  sacrifice_delta: "convoy_supplies",
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
  const [flags, setFlags] = useState<Record<MissionFlag, boolean>>({
    mashhadIdentified: false,
    alphaMonitored: false,
    safeRouteChosen: false,
    groundSupportReady: false,
    resourcesPreserved: false,
    ambushCountered: false,
    lateDiscoveryPenalty: false,
  });
  const [threatWasIdentifiedRound, setThreatWasIdentifiedRound] = useState<string | undefined>();

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
  const isAlphaThreatRevealed = flags.mashhadIdentified;
  const keyMetrics = [
    ...(isAlphaThreatRevealed ? [
      { label: "سلامت محموله در خطر", value: status.alphaHealth, color: "#38bdf8" },
      { label: "پیشرفت محموله در خطر", value: status.alphaProgress, color: "#22c55e" },
    ] : []),
    { label: "شناسایی تهدید", value: status.threatIdentification, color: "#a78bfa" },
    { label: "ثبات فرعی", value: status.secondaryConvoyStability, color: "#84cc16" },
    { label: "ذخیره منابع", value: getResourceReserve(resources), color: "#facc15" },
    ...(isAlphaThreatRevealed ? [{ label: "ریسک کمین", value: status.ambushRisk, color: riskMetricColor(status.ambushRisk) }] : []),
  ];

  const addEvent = (text: string, level: "info" | "success" | "warning" | "critical" = "info") => {
    setEvents((prev) => [{ id: `${Date.now()}-${prev.length}`, text, level }, ...prev].slice(0, 14));
  };

  const begin = () => {
    setHasStarted(true);
    roundStartedAtRef.current = now();
    eventLogger.log({
      type: "mini_game_start",
      scenarioId,
      nodeId,
      userId: userProfileId,
      detail: { miniGameId: "s2_gnss_logistics_simulation_v2", totalRounds: rounds.length },
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
    if (action.targetType !== "route") {
      setSelectedConvoyForRoute(undefined);
    }
    addEvent(`اقدام «${action.title}» آماده اجرا شد.`, "info");
  };

  const handlePickAction = (action: ActionCard) => {
    const isMain = currentRound.mainActionIds.includes(action.id);
    const supportCount = selectedActions.filter((item) => currentRound.supportActionIds.includes(item.action.id)).length;
    if (!isMain && supportCount >= 2 && !selectedActions.some((item) => item.action.id === action.id)) {
      addEvent("حداکثر دو اقدام پشتیبان برای هر راند قابل انتخاب است.", "warning");
      return;
    }
    previewOpenCountRef.current += 1;
    addSelectedAction(action, defaultTargetByActionId[action.id]);
  };

  const removeSelectedAction = (actionId: string, targetId?: string) => {
    changedActionCountRef.current += 1;
    setSelectedActions((prev) => prev.filter((item) => !(item.action.id === actionId && item.targetId === targetId)));
  };

  const hasMainDecision = selectedActions.some((item) => currentRound.mainActionIds.includes(item.action.id));
  const supportSelectionCount = selectedActions.filter((item) => currentRound.supportActionIds.includes(item.action.id)).length;

  const renderResourceMeterChip = (key: keyof ResourceState, label: string) => {
    const value = resources[key];
    const nextValue = resourcesAfterPreview[key];
    const delta = previewCost[key] ?? 0;
    const isDanger = nextValue < 20;
    const isWarning = nextValue < 35;
    return (
      <span
        className={`${isDanger ? "danger" : isWarning ? "warning" : ""} ${delta > 0 ? "preview" : ""}`}
        title={delta > 0 ? `بعد از اجرای تصمیم: ${nextValue} باقی می‌ماند.` : undefined}
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

  const revealScenarioMapState = (actionIds: Set<string>, nextZones: MapZone[], nextRoundIndex: number) => {
    let zonesAfter = nextZones;
    if (actionIds.has("scan_all_nodes") || actionIds.has("scan_mashhad") || status.threatIdentification >= 35) {
      zonesAfter = zonesAfter.map((zone) => zone.id === "zone_east" ? { ...zone, isRevealed: true, threatLevel: "suspicious", gnssDisruption: 58 } : zone);
    }
    if (nextRoundIndex >= 6 || actionIds.has("attack_signal_source") || actionIds.has("emergency_safe_route") || actionIds.has("deception_route")) {
      zonesAfter = zonesAfter.map((zone) => zone.id === "zone_ambush" ? { ...zone, isRevealed: true, threatLevel: "jammed", gnssDisruption: 82 } : zone);
    }
    return zonesAfter;
  };

  const applyActionSideEffects = (
    items: SelectedAction[],
    nextStatus: ScenarioTwoMissionStatus,
    nextResources: ResourceState
  ) => {
    const actionIds = new Set(items.map((item) => item.action.id));
    let updatedStatus = nextStatus;
    let nextConvoys = convoys.slice();
    let nextZones = zones.slice();
    const nextFlags = { ...flags };
    const nextMetrics = { ...metrics };
    const roundMessages: Array<{ text: string; level: "info" | "success" | "warning" | "critical" }> = [];

    const setAlpha = (patch: Partial<Convoy>) => {
      nextConvoys = nextConvoys.map((convoy) => convoy.id === "convoy_medical" ? { ...convoy, ...patch } : convoy);
    };

    if (actionIds.has("scan_mashhad") || actionIds.has("scan_all_nodes")) {
      nextFlags.mashhadIdentified = true;
      if (!threatWasIdentifiedRound) setThreatWasIdentifiedRound(currentRound.id);
      roundMessages.push({ text: "اختلال اصلی در محور ورودی مشهد شناسایی شد.", level: "success" });
    }
    if (actionIds.has("scan_tehran")) {
      nextZones = nextZones.map((zone) => zone.id === "zone_central" ? { ...zone, gnssDisruption: 3, threatLevel: "safe", isRevealed: true } : zone.id === "zone_east" ? { ...zone, gnssDisruption: Math.max(zone.gnssDisruption, 16) } : zone);
      roundMessages.push({ text: "تهران پاک است. داده‌ها نشان می‌دهد منشأ اختلال احتمالاً به مسیر شرقی نزدیک‌تر است.", level: "info" });
    }
    if (actionIds.has("scan_tabriz")) {
      nextZones = nextZones.map((zone) => zone.id === "zone_north" ? { ...zone, gnssDisruption: 3, threatLevel: "safe", isRevealed: true } : zone.id === "zone_east" ? { ...zone, gnssDisruption: Math.max(zone.gnssDisruption, 16) } : zone);
      roundMessages.push({ text: "تبریز پاک است و اختلال اصلی در این گره دیده نشد.", level: "info" });
    }
    if (actionIds.has("scan_bandar")) {
      nextZones = nextZones.map((zone) => zone.id === "zone_south" ? { ...zone, gnssDisruption: 3, threatLevel: "safe", isRevealed: true } : zone.id === "zone_east" ? { ...zone, gnssDisruption: Math.max(zone.gnssDisruption, 16) } : zone);
      roundMessages.push({ text: "بندرعباس پاک است و اختلال اصلی در این گره دیده نشد.", level: "info" });
    }
    if (currentRound.id === "round_2" && !actionIds.has("scan_mashhad") && !actionIds.has("scan_all_nodes")) {
      updatedStatus = applyStatusDelta(updatedStatus, { ambushRisk: 8, ambiguity: 8 });
      roundMessages.push({ text: "محل دقیق اختلال هنوز قطعی نیست؛ محور مشهد مشکوک باقی ماند.", level: "warning" });
    }
    if (actionIds.has("alpha_special_monitoring") || actionIds.has("balanced_monitoring") || actionIds.has("alpha_only_focus")) {
      nextFlags.alphaMonitored = true;
      setAlpha({ status: "monitored", lastRoundAction: "پایش ویژه" });
    }
    if (actionIds.has("route_northern") || actionIds.has("route_staged") || actionIds.has("emergency_safe_route")) {
      nextFlags.safeRouteChosen = true;
      setAlpha({ routeId: actionIds.has("route_staged") ? "route_staged_east" : "route_north_alt", status: "rerouted", lastRoundAction: "تغییر مسیر" });
    }
    if (actionIds.has("pause_alpha")) {
      setAlpha({ status: "paused", lastRoundAction: "توقف موقت" });
    }
    if (actionIds.has("route_main_heavy_watch")) {
      setAlpha({ status: "near_threat", lastRoundAction: "ادامه مسیر اصلی" });
    }
    if (actionIds.has("dispatch_ground_support")) {
      nextFlags.groundSupportReady = true;
      setAlpha({ hasGroundSupport: true, status: "supported", lastRoundAction: "پشتیبانی زمینی" });
      roundMessages.push({ text: "نیروی پشتیبانی زمینی برای محور مشهد آماده شد.", level: "success" });
    }
    if (actionIds.has("preserve_final_resources")) {
      nextFlags.resourcesPreserved = true;
    }
    if (actionIds.has("sacrifice_delta")) {
      nextConvoys = nextConvoys.map((convoy) => convoy.id === "convoy_supplies" ? { ...convoy, status: "paused", delay: convoy.delay + 10, lastRoundAction: "کاهش اولویت" } : convoy);
    }
    if (currentRound.id === "round_6") {
      roundMessages.push({ text: "یک منبع ارسال سیگنال مشکوک نزدیک محور ورودی مشهد فعال دیده شد؛ احتمال اقدام هدفمند دشمن بالا است.", level: "warning" });
    }
    if (actionIds.has("attack_signal_source")) {
      const supportBonus = flags.groundSupportReady ? { ambushRisk: -10, threatIdentification: 8 } : {};
      updatedStatus = applyStatusDelta(updatedStatus, supportBonus);
      nextFlags.ambushCountered = true;
      setAlpha({ hasGroundSupport: true, status: "supported", lastRoundAction: "فشار روی منبع اختلال" });
      roundMessages.push({ text: flags.groundSupportReady ? "نیروی آماده‌شده زودتر وارد عمل شد و سیگنال فریبنده را شدیداً تضعیف کرد." : "نیروی زمینی به منبع اختلال نزدیک شد و سیگنال فریبنده تضعیف شد.", level: "success" });
    }
    if (actionIds.has("deception_route")) {
      if (nextResources.satelliteISR < 15) {
        updatedStatus = applyStatusDelta(updatedStatus, { ambushRisk: 10, ambiguity: 8 });
        roundMessages.push({ text: "به‌دلیل کمبود ISR، مسیر فریب ناقص اجرا شد.", level: "warning" });
      } else {
        nextFlags.ambushCountered = true;
        setAlpha({ routeId: "route_north_alt", status: "rerouted", lastRoundAction: "مسیر فریب" });
        roundMessages.push({ text: "دشمن به مسیر جعلی هدایت شد و کاروان واقعی از محور امن‌تر عبور کرد.", level: "success" });
      }
    }
    if (actionIds.has("emergency_safe_route")) {
      nextFlags.ambushCountered = true;
      setAlpha({ routeId: "route_north_alt", status: "rerouted", lastRoundAction: "فرار از کمین" });
      roundMessages.push({ text: "کاروان الف از مسیر کمین دور شد، اما تأخیر افزایش یافت.", level: "success" });
    }
    if (actionIds.has("fast_escort")) {
      if (!flags.safeRouteChosen && status.threatIdentification < 60) {
        updatedStatus = applyStatusDelta(updatedStatus, { ambushRisk: 18, alphaHealth: -12 });
        setAlpha({ status: "near_threat", lastRoundAction: "اسکورت پرریسک" });
        roundMessages.push({ text: "اسکورت سریع بدون شناخت کافی مسیر، کاروان را به محدوده خطر نزدیک کرد.", level: "critical" });
      } else {
        setAlpha({ status: "supported", lastRoundAction: "اسکورت سریع" });
        roundMessages.push({ text: "کاروان با اسکورت از محور تهدید عبور کرد.", level: "success" });
      }
    }

    const progressPenalty = currentRound.id === "round_4" && actionIds.has("pause_alpha") ? 0 : 7;
    updatedStatus = applyStatusDelta(updatedStatus, {
      alphaProgress: progressPenalty,
      resourceReserve: getResourceReserve(nextResources) - status.resourceReserve,
    });

    if (currentRound.id === "round_7" && !nextFlags.ambushCountered && updatedStatus.ambushRisk > 55) {
      updatedStatus = applyStatusDelta(updatedStatus, { alphaHealth: -18, ambushRisk: 12 });
      setAlpha({ status: "lost_contact", lastRoundAction: "ورود به محدوده کور" });
      roundMessages.push({ text: "کاروان الف وارد محدوده کور ارتباطی شد و موقعیت واقعی آن برای چند دقیقه از نقشه ناپدید شد.", level: "critical" });
    }

    const alphaStatus = nextConvoys.find((convoy) => convoy.id === "convoy_medical")?.status ?? "normal";
    nextConvoys = nextConvoys.map((convoy) => {
      if (convoy.id === "convoy_medical") {
        return {
          ...convoy,
          progress: updatedStatus.alphaProgress,
          health: updatedStatus.alphaHealth,
          delay: updatedStatus.cumulativeDelay,
          status: alphaStatus === "paused" && !actionIds.has("pause_alpha") ? "normal" : alphaStatus,
        };
      }
      const gain = updatedStatus.secondaryConvoyStability > 70 ? 12 : updatedStatus.secondaryConvoyStability > 45 ? 8 : 4;
      const nextProgress = clamp(convoy.progress + gain);
      return {
        ...convoy,
        progress: nextProgress,
        health: clamp(convoy.health + (updatedStatus.secondaryConvoyStability > 60 ? 2 : -4)),
        status: nextProgress >= 100 ? "delivered" : convoy.status === "paused" ? "paused" : "normal",
      };
    });

    nextZones = revealScenarioMapState(actionIds, nextZones, roundIndex + 1);

    nextMetrics.secondOrderThinkingScore = clamp(nextMetrics.secondOrderThinkingScore + sumWeights(items).secondOrderThinkingWeight);
    nextMetrics.adversaryModelingScore = clamp(nextMetrics.adversaryModelingScore + Math.round(sumWeights(items).adversaryModelingWeight / 2));
    nextMetrics.informationDisciplineScore = clamp(nextMetrics.informationDisciplineScore + Math.round(sumWeights(items).infoSeekingWeight / 2) - (actionIds.has("wait_normal") ? 10 : 0));
    nextMetrics.cognitiveFlexibilityScore = clamp(nextMetrics.cognitiveFlexibilityScore + Math.round(sumWeights(items).cognitiveFlexibilityWeight / 2));
    nextMetrics.resourceEfficiencyScore = getResourceReserve(nextResources);

    return { updatedStatus, nextConvoys, nextZones, nextMetrics, nextFlags, roundMessages };
  };

  const finalizeMission = (
    finalStatus: ScenarioTwoMissionStatus,
    finalResources: ResourceState,
    finalConvoys: Convoy[],
    finalRecords: ScenarioTwoDecisionRecord[],
    finalMetrics: ScenarioTwoMetrics,
    finalFlags: Record<MissionFlag, boolean>
  ): { finalStatus: ScenarioTwoMissionStatus; finalConvoys: Convoy[]; finalSummary: ScenarioTwoSummaryData } => {
    const resourceReserve = getResourceReserve(finalResources);
    const secondarySafe = finalConvoys.filter((convoy) => convoy.id !== "convoy_medical" && !["compromised", "lost_contact"].includes(convoy.status)).length;
    let alphaStatus: Convoy["status"] = "delivered_delayed";
    let missionOutcome: ScenarioTwoSummaryData["missionOutcome"] = "limited_success";
    let missionOutcomeLabel = "مأموریت با موفقیت محدود انجام شد.";
    let primaryObjectiveText = "کاروان الف سالم ماند و با تأخیر به مقصد می‌رسد. تهدید کامل حذف نشد، اما سرقت محموله شکست خورد.";

    if (finalStatus.ambushRisk >= 68 || finalStatus.alphaHealth < 35 || (!finalFlags.ambushCountered && finalStatus.ambushRisk > 55)) {
      alphaStatus = "lost_contact";
      missionOutcome = "failure";
      missionOutcomeLabel = "مأموریت شکست خورد.";
      primaryObjectiveText = "کاروان الف از نقشه ناپدید شد. آخرین موقعیت ثبت‌شده آن با داده GNSS هم‌خوان نیست.";
    } else if (finalStatus.alphaHealth < 52 || (secondarySafe >= 2 && finalStatus.alphaProgress < 86 && !finalFlags.safeRouteChosen)) {
      alphaStatus = "compromised";
      missionOutcome = "partial_failure";
      missionOutcomeLabel = "مأموریت اصلی ناقص شد.";
      primaryObjectiveText = "کاروان‌های فرعی مدیریت شدند، اما کاروان الف در محدوده تهدید دچار مشکل شد.";
    } else if (finalStatus.alphaHealth >= 68 && finalStatus.ambushRisk < 35 && finalStatus.alphaProgress >= 88 && secondarySafe >= 2 && resourceReserve >= 15 && !finalFlags.lateDiscoveryPenalty && finalStatus.cumulativeDelay <= 15) {
      alphaStatus = "delivered";
      missionOutcome = "complete_success";
      missionOutcomeLabel = "مأموریت با موفقیت کامل انجام شد.";
      primaryObjectiveText = "کاروان الف با تأخیر کنترل‌شده به مشهد رسید. کاروان‌های دیگر نیز امن ماندند و تهدید شناسایی و کنترل شد.";
    }

    const deliveredProgress = alphaStatus === "delivered" || alphaStatus === "delivered_delayed" ? 100 : finalStatus.alphaProgress;
    const nextStatus = applyStatusDelta(finalStatus, { alphaProgress: deliveredProgress - finalStatus.alphaProgress });
    const nextConvoys = finalConvoys.map((convoy) => {
      if (convoy.id === "convoy_medical") {
        return { ...convoy, status: alphaStatus, progress: deliveredProgress, health: nextStatus.alphaHealth };
      }
      if (convoy.progress >= 82 && nextStatus.secondaryConvoyStability >= 55) return { ...convoy, status: "delivered" as const, progress: 100 };
      return convoy;
    });

    const secondaryDelivered = nextConvoys.filter((convoy) => convoy.id !== "convoy_medical" && convoy.status === "delivered").length;
    const missionObjectiveCompletion = calculateMissionCompletion(nextStatus, finalResources, alphaStatus);
    const criticalDeliveryScore = clamp((nextStatus.alphaHealth + nextStatus.alphaProgress) / 2);
    const delayControlScore = clamp(100 - nextStatus.cumulativeDelay);
    const gnssAnomalyDetectionScore = clamp(nextStatus.threatIdentification - nextStatus.ambiguity / 2 + (finalFlags.mashhadIdentified ? 25 : 0));
    const logisticsResilienceIndex = clamp(
      criticalDeliveryScore * 0.35 +
      nextStatus.secondaryConvoyStability * 0.2 +
      (100 - nextStatus.ambushRisk) * 0.2 +
      resourceReserve * 0.15 +
      nextStatus.threatIdentification * 0.1
    );
    const operationalStrategicIndex = clamp((finalMetrics.secondOrderThinkingScore + finalMetrics.adversaryModelingScore + finalMetrics.informationDisciplineScore + finalMetrics.cognitiveFlexibilityScore) / 4);
    const primaryObjectiveStatus: ScenarioTwoSummaryData["primaryObjectiveStatus"] =
      alphaStatus === "delivered" ? "delivered_on_time" :
        alphaStatus === "delivered_delayed" ? "delivered_delayed" :
          alphaStatus === "compromised" ? "compromised" : "lost";

    const whyThisOutcome = [
      finalFlags.lateDiscoveryPenalty ? "اختلال مشهد در راند ۲ شناسایی نشد و قرارگاه با جریمه منابع وارد راند ۳ شد." : "محل اختلال در راند ۲ زود شناسایی شد.",
      finalFlags.safeRouteChosen ? "مسیر کاروان الف پیش از کمین اصلاح شد." : "مسیر کاروان الف دیر یا ناقص اصلاح شد.",
      finalFlags.ambushCountered ? "در راند ۷ تهدید کمین کنترل شد." : "در راند ۷ تهدید کمین به اندازه کافی کنترل نشد.",
    ];
    const personalizedLessons = [
      finalFlags.lateDiscoveryPenalty ? "دفعه بعد، نوسان‌های ضعیف مقصد را زودتر با اسکن هدفمند بررسی کنید." : "تشخیص زودهنگام مشهد باعث شد تصمیم‌های مسیر دقیق‌تر شوند.",
      finalFlags.safeRouteChosen ? "اصلاح مسیر الف، ریسک کمین را پایین آورد هرچند زمان مصرف کرد." : "تأخیر در اصلاح مسیر، کاروان حیاتی را به تهدید نزدیک نگه داشت.",
      resourceReserve < 20 ? "منابع نزدیک پایان مأموریت بیش از حد مصرف شده بودند و گزینه‌های نجات محدود شد." : "ذخیره عملیاتی تا پایان باقی ماند و امکان واکنش نهایی حفظ شد.",
      finalFlags.groundSupportReady ? "اعزام زودهنگام نیروی زمینی، مقابله راند ۷ را مؤثرتر کرد." : "نبود آمادگی زمینی باعث شد مقابله با منبع اختلال سخت‌تر شود.",
      nextStatus.secondaryConvoyStability < 55 ? "تمرکز بیش از حد روی الف، روتین سایر مسیرها را آسیب‌پذیر کرد." : "روتین کاروان‌های دیگر کاملاً رها نشد و شبکه از فروپاشی دور ماند.",
    ];

    const roundTimeline = finalRecords.map((record) => ({
      roundId: record.roundId,
      roundTitle: roundTitleById[record.roundId] ?? record.roundId,
      selectedActions: record.selectedActionIds.map((id) => actionTitleById[id] ?? id),
      mapEffects: record.selectedActionIds.map((id) => actionCatalog[id]?.mapEffect).filter(Boolean),
      objectiveEffects: record.selectedActionIds.map((id) => actionCatalog[id]?.expectedResult).filter(Boolean),
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

    const finalSummary: ScenarioTwoSummaryData = {
      missionOutcome,
      missionObjectiveCompletion,
      missionCompletionPercent: missionObjectiveCompletion,
      missionOutcomeLabel,
      primaryObjectiveText,
      primaryObjectiveStatus,
      primaryConvoyId: "convoy_medical",
      primaryConvoyDelay: nextStatus.cumulativeDelay,
      secondaryObjectives: {
        logisticsMaintained: nextStatus.secondaryConvoyStability >= 55,
        ambiguityControlled: nextStatus.ambiguity <= 35,
        gnssRiskControlled: nextStatus.gnssExposureRisk <= 45,
        civilianStabilityMaintained: nextStatus.civilianStability >= 60,
        resourcesPreserved: resourceReserve >= 15,
      },
      subObjectiveNotes: [
        `${["delivered", "delivered_delayed"].includes(alphaStatus) ? "✓" : "✕"} کاروان الف سالم به مشهد برسد: ${deliveredProgress}% | سلامت ${nextStatus.alphaHealth}`,
        `${secondarySafe >= 2 ? "✓" : "✕"} حداقل دو کاروان دیگر امن بمانند: ${secondarySafe}/3`,
        `${finalFlags.mashhadIdentified ? "✓" : "✕"} محل اختلال قبل از راند ۴ شناسایی شود`,
        `${resourceReserve >= 15 ? "✓" : "✕"} منابع کاملاً تخلیه نشوند: ${resourceReserve}`,
        `${nextStatus.ambushRisk < 45 ? "✓" : "✕"} الف از مسیر کمین دور شود: ریسک ${nextStatus.ambushRisk}`,
        `${nextStatus.secondaryConvoyStability >= 55 ? "✓" : "✕"} روتین سایر مسیرها حفظ شود: ${nextStatus.secondaryConvoyStability}`,
      ],
      roundTimeline,
      personalizedLessons,
      keyTurningPoint: finalFlags.ambushCountered
        ? "راند ۷: مقابله با کمین، مسیر نهایی کاروان الف را نجات داد."
        : finalFlags.safeRouteChosen
          ? "راند ۴: تغییر مسیر الف، ریسک کمین را پیش از آشکار شدن تهدید پایین آورد."
          : "نقطه عطف نجات‌بخش روشنی ثبت نشد؛ تصمیم‌ها بیشتر واکنشی بودند.",
      criticalMistake: finalFlags.lateDiscoveryPenalty
        ? "اختلال مشهد در راند ۲ شناسایی نشد و قرارگاه با جریمه منابع وارد راند ۳ شد."
        : !finalFlags.safeRouteChosen
          ? "مسیر الف به‌موقع از محور مشکوک جدا نشد."
          : resourceReserve < 20
            ? "منابع واکنش نهایی بیش از حد مصرف شدند."
            : !finalFlags.ambushCountered
              ? "تهدید کمین در راند ۷ کامل کنترل نشد."
              : "اشتباه بحرانی پررنگی ثبت نشد؛ ریسک‌ها عمدتاً کنترل شدند.",
      alphaFinalStatus: alphaStatus,
      alphaHealth: nextStatus.alphaHealth,
      alphaProgress: deliveredProgress,
      threatWasIdentifiedRound,
      secondaryConvoysDelivered: secondaryDelivered,
      groundSupportUsed: finalFlags.groundSupportReady || finalFlags.ambushCountered,
      ambushAvoided: nextStatus.ambushRisk < 45,
      resourceExhaustion: resourceReserve < 15,
      whyThisOutcome,
      logisticsResilienceIndex,
      operationalStrategicIndex,
      decisionStyleLabel: finalMetrics.falseGnssRelianceTime > 1 ? "System-Dependent Commander" : finalFlags.ambushCountered ? "Mission-Oriented Rescuer" : "Adaptive Logistics Commander",
      decisionStyleText: finalFlags.ambushCountered
        ? "تصمیم‌های شما روی کشف تهدید، اصلاح مسیر و مقابله عملی با کمین متمرکز بود."
        : "تصمیم‌های شما مأموریت را پیش برد، اما در لحظه تهدید آشکار هنوز بخشی از ریسک باقی ماند.",
      criticalDeliveryScore,
      delayControlScore,
      gnssAnomalyDetectionScore,
      navigationCompromiseLevel: clamp(100 - nextStatus.navigationIntegrity + nextStatus.ambushRisk / 2),
      avgResponseTimeMs: Math.round(average(finalRecords.map((record) => record.responseTimeMs))),
      learningNotes: personalizedLessons,
    };

    return { finalStatus: nextStatus, finalConvoys: nextConvoys, finalSummary };
  };

  const executeRound = () => {
    if (selectedActions.length === 0) return;
    const resourcesBefore = resources;
    const statusBefore = status;
    const convoyStatesBefore = convoys;
    const weightsForRecord = sumWeights(selectedActions);
    const nextResources = addResources(resources, previewCost);
    let nextStatus = selectedActions.reduce((current, item) => applyStatusDelta(current, item.action.effects), status);
    nextStatus = applyStatusDelta(nextStatus, {
      resourceReserve: getResourceReserve(nextResources) - status.resourceReserve,
    });

    const sideEffects = applyActionSideEffects(selectedActions, nextStatus, nextResources);
    nextStatus = sideEffects.updatedStatus;
    const nextConvoys = sideEffects.nextConvoys;
    const nextMetrics = {
      ...sideEffects.nextMetrics,
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
      ...weightsForRecord,
    };

    const actionIds = selectedActions.map((item) => item.action.id);
    const narrativeOutcome = sideEffects.roundMessages[0]?.text ?? actionIds.map((id) => actionCatalog[id]?.expectedResult).filter(Boolean).join(" ");
    eventLogger.log({
      type: "s2_decision",
      scenarioId,
      nodeId,
      userId: userProfileId,
      elapsedMs: responseTimeMs,
      detail: {
        roundId: currentRound.id,
        roundTitle: currentRound.title,
        mainDecisionId: actionIds.find((id) => currentRound.mainActionIds.includes(id)),
        supportActionIds: actionIds.filter((id) => currentRound.supportActionIds.includes(id)),
        resourceBefore: resourcesBefore,
        resourceAfter: nextResources,
        convoyStatesBefore,
        convoyStatesAfter: nextConvoys,
        mapEffects: actionIds.map((id) => actionCatalog[id]?.mapEffect).filter(Boolean),
        narrativeOutcome,
        alphaProgressDelta: nextStatus.alphaProgress - statusBefore.alphaProgress,
        alphaHealthDelta: nextStatus.alphaHealth - statusBefore.alphaHealth,
        ambushRiskDelta: nextStatus.ambushRisk - statusBefore.ambushRisk,
        threatIdentificationDelta: nextStatus.threatIdentification - statusBefore.threatIdentification,
        secondaryConvoyStabilityDelta: nextStatus.secondaryConvoyStability - statusBefore.secondaryConvoyStability,
        resourceReserveDelta: nextStatus.resourceReserve - statusBefore.resourceReserve,
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
    });

    const updatedRecords = [...records, record];
    const completionBefore = calculateMissionCompletion(statusBefore, resourcesBefore, medicalConvoy.status);
    const completionAfter = calculateMissionCompletion(nextStatus, nextResources, getMedicalConvoy(nextConvoys).status);
    const outcomeMessages = [
      ...sideEffects.roundMessages,
      { text: `منابع پس از اجرا: ISR ${nextResources.satelliteISR} | انرژی ${nextResources.energy} | زمان ${nextResources.time}`, level: "info" as const },
      sideEffects.nextFlags.mashhadIdentified
        ? { text: `وضعیت محموله در خطر: پیشرفت ${nextStatus.alphaProgress}٪، سلامت ${nextStatus.alphaHealth}، ریسک کمین ${nextStatus.ambushRisk}`, level: nextStatus.ambushRisk > 60 ? "critical" as const : "info" as const }
        : { text: `وضعیت شبکه: ثبات کاروان‌ها ${nextStatus.secondaryConvoyStability}٪، شناسایی تهدید ${nextStatus.threatIdentification}٪`, level: "info" as const },
      { text: `تحقق هدف مأموریت: ${completionBefore}٪ → ${completionAfter}٪`, level: completionAfter >= completionBefore ? "success" as const : "warning" as const },
    ].filter((message) => message.text).slice(0, 5);

    setResources(nextResources);
    setStatus(nextStatus);
    setConvoys(nextConvoys);
    setZones(sideEffects.nextZones);
    setMetrics(nextMetrics);
    setFlags(sideEffects.nextFlags);
    sideEffects.roundMessages.forEach((message) => addEvent(message.text, message.level));
    addEvent(`تصمیم ${currentRound.title} اجرا شد.`, "success");
    setRecords(updatedRecords);
    setSelectedActions([]);
      setSelectedConvoyForRoute(undefined);
    changedActionCountRef.current = 0;
    previewOpenCountRef.current = 0;

    if (roundIndex + 1 >= rounds.length) {
      const { finalStatus, finalConvoys, finalSummary } = finalizeMission(nextStatus, nextResources, nextConvoys, updatedRecords, nextMetrics, sideEffects.nextFlags);
      setConvoys(finalConvoys);
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
          alphaFinalStatus: finalSummary.alphaFinalStatus,
          alphaDelay: finalSummary.primaryConvoyDelay,
          alphaProgress: finalSummary.alphaProgress,
          alphaHealth: finalSummary.alphaHealth,
          secondaryConvoysDelivered: finalSummary.secondaryConvoysDelivered,
          threatWasIdentifiedRound: finalSummary.threatWasIdentifiedRound,
          groundSupportUsed: finalSummary.groundSupportUsed,
          ambushAvoided: finalSummary.ambushAvoided,
          resourceExhaustion: finalSummary.resourceExhaustion,
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
      if (roundOutcome.nextRoundIndex === 2 && !flags.mashhadIdentified) {
        const penalty = { satelliteISR: 12, time: 8 };
        setResources((current) => addResources(current, penalty));
        setStatus((current) => applyStatusDelta(current, { ambiguity: 10, ambushRisk: 8, threatIdentification: 40 }));
        setZones((current) => current.map((zone) => zone.id === "zone_east" ? { ...zone, isRevealed: true, threatLevel: "suspicious", gnssDisruption: 34 } : zone));
        setFlags((current) => ({ ...current, mashhadIdentified: true, lateDiscoveryPenalty: true }));
        if (!threatWasIdentifiedRound) setThreatWasIdentifiedRound("forced_round_3");
        addEvent("جریمه تشخیص دیرهنگام: ISR -12 | TIME -8. تیم کاوش قرارگاه منشأ اصلی اختلال را با بررسی اضطراری در محور ورودی مشهد پیدا کرد.", "warning");
      }
      setRoundIndex(roundOutcome.nextRoundIndex);
      roundStartedAtRef.current = now();
    }
    setRoundOutcome(null);
  };

  if (!hasStarted) {
    return (
      <div className="s2-start">
        <h2>سناریو ۲ — امواج خاموش</h2>
        <h3>مدیریت کاروان‌ها تحت اختلال GNSS</h3>
        <p>
          شما فرمانده قرارگاه لجستیک هستید. چهار کاروان حیاتی و پشتیبانی در مسیرهای مختلف کشور در حال حرکت‌اند.
          در آغاز، همه‌چیز عادی است؛ اما یک اختلال خاموش در داده‌های ناوبری ظاهر می‌شود.
        </p>
        <p>
          مأموریت شما این است که محل اختلال را پیدا کنید، همه کاروان‌ها را تا مقصد هدایت کنید
          و شبکه لجستیک را از فروپاشی حفظ کنید.
        </p>
        <div className="s2-briefing">
          <h3>مأموریت شما</h3>
          <ol>
            <li>تمام کاروان‌ها را تا پایان راند ۸ به مقصد برسانید.</li>
            <li>حداقل سه کاروان را در وضعیت امن یا تحویل‌شده نگه دارید.</li>
            <li>محل اختلال را تا قبل از راند ۴ شناسایی کنید.</li>
            <li>منابع را تا راند ۷ کاملاً مصرف نکنید.</li>
            <li>در صورت آشکار شدن تهدید، مسیر یا منبع اختلال را کنترل کنید.</li>
          </ol>
          <div className="s2-terms-grid">
            <span><b>GNSS</b> سامانه ناوبری ماهواره‌ای</span>
            <span><b>Spoofing</b> داده جعلی برای فریب ناوبری</span>
            <span><b>ISR</b> ظرفیت شناسایی و پایش</span>
            <span><b>ریسک کمین</b> احتمال کشیده شدن یک کاروان به مسیر جعلی</span>
          </div>
          <div className="s2-briefing-alerts">
            <span><b className="yellow" /> زرد: وضعیت عادی یا هشدار مبهم</span>
            <span><b className="orange" /> نارنجی: ریسک فعال مسیر و منابع</span>
            <span><b className="red" /> قرمز: تهدید آشکار و تصمیم نجات</span>
          </div>
        </div>
        <div className="s2-start-grid">
          <span>۸ راند</span>
          <span>۴ کاروان</span>
          <span>۱ تصمیم اصلی/راند</span>
          <span>حداکثر ۲ اقدام پشتیبان</span>
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
        <div className="s2-alert-help">هدف: {currentRound.roundGoal}</div>
        <div className="s2-action-budget">تصمیم: {hasMainDecision ? "۱/۱" : "۰/۱"} | پشتیبان: {supportSelectionCount}/2</div>
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
          <span>هدف اصلی</span>
          <strong>تمام کاروان‌ها تا پایان راند ۸ به مقصد برسند.</strong>
        </div>
        <div className="s2-primary-progress">
          {isAlphaThreatRevealed ? (
            <>
              <span>پیشرفت محموله در خطر: {medicalConvoy.progress}% | سلامت {medicalConvoy.health}</span>
              <i><em style={{ width: `${medicalConvoy.progress}%` }} /></i>
            </>
          ) : (
            <>
              <span>&nbsp;</span>
              <i><em style={{ width: "0%" }} /></i>
            </>
          )}
        </div>
        <div>
          <span>مهلت</span>
          <strong>{rounds.length - roundIndex} راند باقی‌مانده</strong>
        </div>
        {isAlphaThreatRevealed ? (
          <>
            <div>
              <span>وضعیت محموله در خطر</span>
              <strong>{statusLabel[medicalConvoy.status]}</strong>
            </div>
            <div>
              <span>ریسک کمین</span>
              <strong>{status.ambushRisk}</strong>
            </div>
          </>
        ) : (
          <>
            <div><span>&nbsp;</span><strong>&nbsp;</strong></div>
            <div><span>&nbsp;</span><strong>&nbsp;</strong></div>
          </>
        )}
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
        <div className={`s2-resource-preview ${Object.values(resourcesAfterPreview).some((value) => value < 20) ? "warning" : ""}`}>
          <strong>پیش‌نمایش مصرف منابع</strong>
          <span>ISR: {resources.satelliteISR} → {resourcesAfterPreview.satelliteISR}</span>
          <span>ENG: {resources.energy} → {resourcesAfterPreview.energy}</span>
          <span>TIME: {resources.time} → {resourcesAfterPreview.time}</span>
          {Object.values(resourcesAfterPreview).some((value) => value < 20) && <em>هشدار: یکی از منابع پس از اجرای تصمیم به سطح بحرانی می‌رسد.</em>}
        </div>
      )}

      <p className="s2-round-narrative">{currentRound.narrative}</p>
      <main className="s2-layout">
        <ScenarioTwoMap
          zones={zones}
          routes={routes}
          convoys={convoys}
          selectedConvoyId={selectedConvoyForRoute}
          activeTargetType={undefined}
          pendingActionId={hoveredAction?.id}
          selectedActions={selectedActions}
          previewAction={hoveredAction}
          ambiguity={status.ambiguity}
          navigationIntegrity={status.navigationIntegrity}
          onSelectZone={() => undefined}
          onSelectConvoy={() => undefined}
          onSelectConvoyForRoute={(convoyId) => setSelectedConvoyForRoute(convoyId)}
          onSelectRoute={() => undefined}
        />

        <section className="s2-actions-section">
          <div className="s2-section-header">
            <h3>پنل تصمیم راند</h3>
            <span>یک تصمیم اصلی انتخاب کنید؛ سپس در صورت نیاز حداکثر دو اقدام پشتیبان اضافه کنید.</span>
            <div className="s2-round-problem">
              <strong>مسئله عملیاتی راند</strong>
              <p>{currentRound.operationalProblem}</p>
              <em>هدف راند: {currentRound.roundGoal}</em>
            </div>
          </div>
          <div className="s2-action-groups">
            <div>
              <h4>Main Decision</h4>
              <div className="s2-action-grid">
                {mainActions.map((action) => {
                  const selectedAction = selectedActions.find((item) => item.action.id === action.id);
                  const selectedForAfford = currentRound.mainActionIds.includes(action.id)
                    ? selectedActions.filter((item) => !currentRound.mainActionIds.includes(item.action.id))
                    : selectedActions;
                  const disabledReason = selectedAction
                    ? undefined
                      : canAfford(resources, action, selectedForAfford);
                  const riskReason = selectedAction || disabledReason ? undefined : getResourceRiskReason(resources, action, selectedActions);
                  return (
                    <ScenarioTwoActionCard
                      key={action.id}
                      action={action}
                      selectedAction={selectedAction}
                      disabledReason={disabledReason}
                      isTargeting={hoveredAction?.id === action.id}
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
            {supportActions.length > 0 && (
              <div>
                <h4>Support Actions ({supportSelectionCount}/2)</h4>
                <div className="s2-action-grid">
                  {supportActions.map((action) => {
                    const selectedAction = selectedActions.find((item) => item.action.id === action.id);
                    const disabledReason = selectedAction
                      ? undefined
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
                      isTargeting={hoveredAction?.id === action.id}
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
            )}
          </div>
          <div className="s2-execute-row">
            <div className="s2-selected-actions">
              <strong>Selected Decision Preview</strong>
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
            <button className="primary" disabled={!hasMainDecision} onClick={executeRound}>اجرای تصمیم راند</button>
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
                    <small>اهمیت {convoy.priority} | پیشرفت {convoy.progress}% | سلامت {convoy.health}</small>
                    <em>{statusLabel[convoy.status]}</em>
                  </button>
                ))}
              </div>
            )}
            {openDrawer === "mission" && (
              <div className="s2-drawer-list">
                {[
                  ...(isAlphaThreatRevealed ? [
                    ["سلامت محموله در خطر", status.alphaHealth],
                    ["پیشرفت محموله در خطر", status.alphaProgress],
                  ] as Array<[string, number]> : []),
                  ["سطح شناسایی تهدید", status.threatIdentification],
                  ["پایداری کاروان‌های فرعی", status.secondaryConvoyStability],
                  ["ذخیره منابع", getResourceReserve(resources)],
                  ...(isAlphaThreatRevealed ? [["ریسک سرقت/کمین", status.ambushRisk]] as Array<[string, number]> : []),
                  ["ابهام", status.ambiguity],
                  ["ریسک GNSS", status.gnssExposureRisk],
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
                  <p>تمام کاروان‌ها باید تا پایان راند ۸ به مقصد برسند و شبکه لجستیک پایدار بماند.</p>
                </div>
                {(isAlphaThreatRevealed
                  ? objectiveChecks
                  : [
                    { label: "تمام کاروان‌ها به مقصد برسند", done: false, value: "در جریان" },
                    { label: "حداقل سه کاروان امن بمانند", done: status.secondaryConvoyStability >= 65, value: `${status.secondaryConvoyStability}` },
                    { label: "محل اختلال قبل از راند ۴ شناسایی شود", done: status.threatIdentification >= 40, value: `${status.threatIdentification}` },
                    { label: "منابع تا راندهای پایانی حفظ شوند", done: getResourceReserve(resources) >= 20, value: `ISR ${resources.satelliteISR} / ENG ${resources.energy} / TIME ${resources.time}` },
                  ]).map((objective) => (
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
                {events.length === 0 && <p className="s2-empty-log">پس از اجرای تصمیم راند، پیامدها اینجا ثبت می‌شوند.</p>}
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
