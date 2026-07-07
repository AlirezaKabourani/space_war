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
  { id: "convoy_medical", name: "کاروان الف", cargo: "تجهیزات درمانی اضطراری", priority: 5, deadline: 18, delay: 0, status: "moving", currentZoneId: "zone_east", routeId: "route_main_east", hasFallbackNav: false, gnssTrustLevel: 70 },
  { id: "convoy_fuel", name: "کاروان ب", cargo: "سوخت عملیاتی", priority: 4, deadline: 24, delay: 0, status: "moving", currentZoneId: "zone_central", routeId: "route_western", hasFallbackNav: false, gnssTrustLevel: 75 },
  { id: "convoy_comms", name: "کاروان ج", cargo: "قطعات ارتباطی و مخابراتی", priority: 4, deadline: 28, delay: 0, status: "moving", currentZoneId: "zone_north", routeId: "route_north", hasFallbackNav: false, gnssTrustLevel: 65 },
  { id: "convoy_supplies", name: "کاروان د", cargo: "پشتیبانی عمومی و تدارکات", priority: 2, deadline: 36, delay: 0, status: "moving", currentZoneId: "zone_south", routeId: "route_south", hasFallbackNav: false, gnssTrustLevel: 80 },
];

const initialZones: MapZone[] = [
  { id: "zone_north", name: "محور شمالی", x: 45, y: 18, threatLevel: "suspicious", gnssDisruption: 45, civilianSensitivity: 30, isRevealed: true },
  { id: "zone_east", name: "محور شرقی", x: 75, y: 42, threatLevel: "jammed", gnssDisruption: 70, civilianSensitivity: 55, isRevealed: false },
  { id: "zone_central", name: "محور مرکزی", x: 50, y: 50, threatLevel: "unknown", gnssDisruption: 55, civilianSensitivity: 70, isRevealed: false },
  { id: "zone_south", name: "محور جنوبی", x: 40, y: 78, threatLevel: "safe", gnssDisruption: 20, civilianSensitivity: 45, isRevealed: true },
];

const routes: Route[] = [
  { id: "route_main_east", name: "مسیر اصلی شرق", fromZoneId: "zone_central", toZoneId: "zone_east", travelCost: 8, delayRisk: 35, gnssRisk: 70, civilianImpact: 45, visualStatus: "danger" },
  { id: "route_western", name: "مسیر غربی جایگزین", fromZoneId: "zone_south", toZoneId: "zone_central", travelCost: 12, delayRisk: 42, gnssRisk: 35, civilianImpact: 25, visualStatus: "risky" },
  { id: "route_north", name: "کریدور شمالی", fromZoneId: "zone_north", toZoneId: "zone_central", travelCost: 10, delayRisk: 30, gnssRisk: 48, civilianImpact: 30, visualStatus: "risky" },
  { id: "route_south", name: "کریدور جنوبی", fromZoneId: "zone_south", toZoneId: "zone_east", travelCost: 14, delayRisk: 25, gnssRisk: 22, civilianImpact: 38, visualStatus: "safe" },
  { id: "route_shadow", name: "مسیر خاکستری", fromZoneId: "zone_north", toZoneId: "zone_east", travelCost: 7, delayRisk: 52, gnssRisk: 78, civilianImpact: 62, visualStatus: "unknown" },
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
    title: "بررسی ISR محور مشکوک",
    description: "یک گذر سریع ISR برای آشکارسازی سطح واقعی اختلال و کاهش ابهام عملیاتی.",
    category: "diagnosis",
    cost: { satelliteISR: 20, time: 8 },
    effects: { ambiguity: -20, navigationIntegrity: 10 },
    requirements: { satelliteISR: 20, time: 8 },
    targetType: "zone",
    weights: { logisticsWeight: 4, criticalDeliveryWeight: 3, delayControlWeight: -2, resourceEfficiencyWeight: 3, navigationIntegrityWeight: 8, civilianImpactWeight: 1, escalationWeight: -1, infoSeekingWeight: 9, secondOrderThinkingWeight: 5, adversaryModelingWeight: 3, cognitiveFlexibilityWeight: 4 },
  }),
  action_fallback_nav: makeAction({
    id: "action_fallback_nav",
    title: "سوئیچ به ناوبری پشتیبان",
    description: "کاروان انتخاب‌شده از GNSS جدا شده و به ناوبری پشتیبان منتقل می‌شود.",
    category: "navigation",
    cost: { energy: 15, time: 4 },
    effects: { criticalDelivery: 12, gnssExposureRisk: -15, navigationIntegrity: 8 },
    requirements: { energy: 15, time: 4 },
    targetType: "convoy",
    weights: { logisticsWeight: 6, criticalDeliveryWeight: 9, delayControlWeight: 3, resourceEfficiencyWeight: 4, navigationIntegrityWeight: 8, civilianImpactWeight: 2, escalationWeight: -2, infoSeekingWeight: 1, secondOrderThinkingWeight: 6, adversaryModelingWeight: 2, cognitiveFlexibilityWeight: 5 },
  }),
  action_reroute_convoy: makeAction({
    id: "action_reroute_convoy",
    title: "تغییر مسیر کاروان",
    description: "یک کاروان را از مسیر فعلی خارج کرده و وارد مسیر جایگزین می‌کند.",
    category: "logistics",
    cost: { energy: 10, time: 6 },
    effects: { logisticsContinuity: 5, cumulativeDelay: 6, gnssExposureRisk: -8 },
    requirements: { energy: 10, time: 6 },
    targetType: "route",
    weights: { logisticsWeight: 7, criticalDeliveryWeight: 6, delayControlWeight: -3, resourceEfficiencyWeight: 3, navigationIntegrityWeight: 5, civilianImpactWeight: 2, escalationWeight: -2, infoSeekingWeight: 1, secondOrderThinkingWeight: 6, adversaryModelingWeight: 4, cognitiveFlexibilityWeight: 6 },
  }),
  action_continue_gnss: makeAction({
    id: "action_continue_gnss",
    title: "ادامه عملیات طبق GNSS",
    description: "سریع و بدون هزینه است، اما اگر داده آلوده باشد ریسک سنگین ایجاد می‌کند.",
    category: "risky",
    cost: {},
    effects: { gnssExposureRisk: 15, ambiguity: 8 },
    targetType: "global",
    weights: { logisticsWeight: 2, criticalDeliveryWeight: -2, delayControlWeight: 8, resourceEfficiencyWeight: 5, navigationIntegrityWeight: -8, civilianImpactWeight: -2, escalationWeight: 5, infoSeekingWeight: -6, secondOrderThinkingWeight: -5, adversaryModelingWeight: -3, cognitiveFlexibilityWeight: -4 },
  }),
  action_pause_low_priority: makeAction({
    id: "action_pause_low_priority",
    title: "توقف موقت کاروان کم‌اولویت",
    description: "برای حفظ منابع و کاهش ریسک، یک کاروان کم‌اولویت موقتاً متوقف می‌شود.",
    category: "logistics",
    cost: { time: 5 },
    effects: { logisticsContinuity: -4, civilianStability: 4, escalationRisk: -3 },
    requirements: { time: 5 },
    targetType: "convoy",
    weights: { logisticsWeight: -2, criticalDeliveryWeight: 4, delayControlWeight: -3, resourceEfficiencyWeight: 7, navigationIntegrityWeight: 2, civilianImpactWeight: 4, escalationWeight: -4, infoSeekingWeight: 1, secondOrderThinkingWeight: 5, adversaryModelingWeight: 2, cognitiveFlexibilityWeight: 4 },
  }),
  action_route_diversity: makeAction({
    id: "action_route_diversity",
    title: "تقسیم مسیرها",
    description: "کاروان‌ها برای کاهش پیش‌بینی‌پذیری دشمن در مسیرهای متفاوت پخش می‌شوند.",
    category: "deception",
    cost: { energy: 12, time: 8 },
    effects: { logisticsContinuity: 8, escalationRisk: -6, gnssExposureRisk: -6 },
    requirements: { energy: 12, time: 8 },
    targetType: "global",
    weights: { logisticsWeight: 8, criticalDeliveryWeight: 5, delayControlWeight: -2, resourceEfficiencyWeight: 4, navigationIntegrityWeight: 4, civilianImpactWeight: 2, escalationWeight: -5, infoSeekingWeight: 1, secondOrderThinkingWeight: 7, adversaryModelingWeight: 9, cognitiveFlexibilityWeight: 7 },
  }),
  action_signal_analysis: makeAction({
    id: "action_signal_analysis",
    title: "درخواست تحلیل سیگنال",
    description: "تحلیل سریع ناسازگاری سیگنال‌های GNSS و گزارش‌های میدانی.",
    category: "diagnosis",
    cost: { satelliteISR: 8, time: 10 },
    effects: { ambiguity: -14, navigationIntegrity: 6, gnssExposureRisk: -6 },
    requirements: { satelliteISR: 8, time: 10 },
    targetType: "zone",
    weights: { logisticsWeight: 3, criticalDeliveryWeight: 3, delayControlWeight: -4, resourceEfficiencyWeight: 4, navigationIntegrityWeight: 7, civilianImpactWeight: 1, escalationWeight: -2, infoSeekingWeight: 8, secondOrderThinkingWeight: 6, adversaryModelingWeight: 6, cognitiveFlexibilityWeight: 5 },
  }),
  action_civil_coordination: makeAction({
    id: "action_civil_coordination",
    title: "هماهنگی مدنی",
    description: "مسیرهای حساس مدنی هماهنگ می‌شوند تا اختلال لجستیک به بحران خدمات حیاتی تبدیل نشود.",
    category: "civilian",
    cost: { time: 7, energy: 6 },
    effects: { civilianStability: 10, escalationRisk: -4, logisticsContinuity: -2 },
    requirements: { time: 7, energy: 6 },
    targetType: "zone",
    weights: { logisticsWeight: -1, criticalDeliveryWeight: 1, delayControlWeight: -3, resourceEfficiencyWeight: 3, navigationIntegrityWeight: 1, civilianImpactWeight: 9, escalationWeight: -5, infoSeekingWeight: 2, secondOrderThinkingWeight: 7, adversaryModelingWeight: 3, cognitiveFlexibilityWeight: 4 },
  }),
  action_preserve_resources: makeAction({
    id: "action_preserve_resources",
    title: "حفظ ذخیره عملیاتی",
    description: "بخشی از منابع برای موج بعدی اختلال حفظ می‌شود. اثر فوری محدود است.",
    category: "command",
    cost: {},
    effects: { remainingResources: 5, logisticsContinuity: -2 },
    targetType: "global",
    weights: { logisticsWeight: -1, criticalDeliveryWeight: 1, delayControlWeight: -1, resourceEfficiencyWeight: 8, navigationIntegrityWeight: 1, civilianImpactWeight: 1, escalationWeight: -2, infoSeekingWeight: 0, secondOrderThinkingWeight: 8, adversaryModelingWeight: 5, cognitiveFlexibilityWeight: 5 },
  }),
  action_all_in_critical: makeAction({
    id: "action_all_in_critical",
    title: "تمرکز کامل بر کاروان حیاتی",
    description: "تمام ظرفیت باقی‌مانده برای نجات کاروان حیاتی مصرف می‌شود و سایر بخش‌ها آسیب می‌بینند.",
    category: "logistics",
    cost: { energy: 20, time: 10, satelliteISR: 10 },
    effects: { criticalDelivery: 20, logisticsContinuity: -10, civilianStability: -6, remainingResources: -15 },
    requirements: { energy: 20, time: 10, satelliteISR: 10 },
    targetType: "convoy",
    weights: { logisticsWeight: -3, criticalDeliveryWeight: 10, delayControlWeight: 4, resourceEfficiencyWeight: -4, navigationIntegrityWeight: 3, civilianImpactWeight: -5, escalationWeight: 4, infoSeekingWeight: 1, secondOrderThinkingWeight: 2, adversaryModelingWeight: 1, cognitiveFlexibilityWeight: 3 },
  }),
  action_distribute_resources: makeAction({
    id: "action_distribute_resources",
    title: "تقسیم منابع بین همه کاروان‌ها",
    description: "منابع باقی‌مانده به‌جای یک نقطه بحرانی، بین کل شبکه تقسیم می‌شود.",
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
    title: "راند ۱ — اختلال اولیه GNSS",
    alertLevel: "زرد",
    narrative: "مختصات GNSS با گزارش میدانی هم‌خوان نیست. هنوز فرصت دارید ابهام را کم کنید یا جریان لجستیک را سریع ادامه دهید.",
    actionIds: ["action_isr_scan", "action_signal_analysis", "action_fallback_nav", "action_continue_gnss", "action_pause_low_priority", "action_civil_coordination"],
  },
  {
    id: "round_2",
    title: "راند ۲ — انحراف کاروان حیاتی",
    alertLevel: "نارنجی",
    narrative: "کاروان حامل تجهیزات درمانی وارد محدوده‌ای با نشانه‌های spoofing شده است. منابع تشخیص هنوز کافی است، اما زمان عملیاتی کم می‌شود.",
    actionIds: ["action_isr_scan", "action_fallback_nav", "action_reroute_convoy", "action_route_diversity", "action_continue_gnss", "action_signal_analysis"],
  },
  {
    id: "round_3",
    title: "راند ۳ — فشار مدنی و لجستیکی",
    alertLevel: "نارنجی",
    narrative: "اختلال روی سرویس‌های حیاتی اطراف محور مرکزی اثر گذاشته است. تصمیم شما باید بین تحویل حیاتی، ثبات مدنی و زمان تعادل ایجاد کند.",
    actionIds: ["action_civil_coordination", "action_pause_low_priority", "action_reroute_convoy", "action_fallback_nav", "action_route_diversity", "action_continue_gnss"],
  },
  {
    id: "round_4",
    title: "راند ۴ — موج دوم اختلال",
    alertLevel: "قرمز",
    narrative: "دشمن الگوی واکنش شما را می‌سنجد. اگر مسیرها متمرکز بمانند یا منابع تشخیص تمام شود، شبکه شکننده‌تر می‌شود.",
    actionIds: ["action_route_diversity", "action_isr_scan", "action_signal_analysis", "action_reroute_convoy", "action_civil_coordination", "action_preserve_resources", "action_continue_gnss"],
  },
  {
    id: "round_5",
    title: "راند ۵ — بحران نهایی",
    alertLevel: "قرمز",
    narrative: "یک کاروان حیاتی در آستانه از دست دادن پنجره تحویل قرار دارد. اکنون منابع باقی‌مانده تعیین می‌کند فروپاشی رخ می‌دهد یا آسیب کنترل می‌شود.",
    actionIds: ["action_fallback_nav", "action_reroute_convoy", "action_civil_coordination", "action_pause_low_priority", "action_continue_gnss", "action_all_in_critical", "action_distribute_resources"],
  },
];

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
  const [events, setEvents] = useState<Array<{ id: string; text: string; level: "info" | "success" | "warning" | "critical" }>>([]);
  const [records, setRecords] = useState<ScenarioTwoDecisionRecord[]>([]);
  const [metrics, setMetrics] = useState<ScenarioTwoMetrics>(initialMetrics);
  const [summary, setSummary] = useState<ScenarioTwoSummaryData | null>(null);
  const [openDrawer, setOpenDrawer] = useState<"convoys" | "mission" | "log" | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<{
    title: string;
    messages: Array<{ text: string; level: "info" | "success" | "warning" | "critical" }>;
    nextRoundIndex?: number;
  } | null>(null);
  const roundStartedAtRef = useRef(now());
  const changedActionCountRef = useRef(0);
  const previewOpenCountRef = useRef(0);

  const currentRound = rounds[roundIndex];
  const actions = currentRound.actionIds.map((id) => actionCatalog[id]);
  const previewCost = useMemo(() => sumCosts(selectedActions), [selectedActions]);
  const resourcesAfterPreview = useMemo(() => addResources(resources, previewCost), [resources, previewCost]);
  const hasResourcePreview = selectedActions.length > 0;
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
      changedActionCountRef.current += 1;
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
        const routeIds = ["route_south", "route_western", "route_north", "route_main_east"];
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

    const learningNotes = [
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
      logisticsResilienceIndex,
      operationalStrategicIndex,
      decisionStyleLabel,
      decisionStyleText,
      criticalDeliveryScore,
      delayControlScore,
      gnssAnomalyDetectionScore,
      navigationCompromiseLevel,
      avgResponseTimeMs,
      learningNotes,
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
    const outcomeMessages = [
      ...sideEffects.roundMessages,
      { text: `منابع پس از اجرا: ISR ${nextResources.satelliteISR} | انرژی ${nextResources.energy} | زمان ${nextResources.time}`, level: "info" as const },
      { text: `وضعیت مأموریت: لجستیک ${nextStatus.logisticsContinuity}٪، ابهام ${nextStatus.ambiguity}٪، ریسک GNSS ${nextStatus.gnssExposureRisk}٪`, level: "info" as const },
    ].slice(0, 5);

    setResources(nextResources);
    setStatus(nextStatus);
    setConvoys(sideEffects.nextConvoys);
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
      const deliveredConvoys = sideEffects.nextConvoys.map((convoy) => ({
        ...convoy,
        status: convoy.status === "compromised" || convoy.status === "paused" ? convoy.status : convoy.delay <= convoy.deadline + 10 ? "delivered" as const : "compromised" as const,
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
        <h2>امواج خاموش / Silent Waves</h2>
        <p>
          شما فرمانده قرارگاه لجستیک هستید. داده‌های{" "}
          <span className="s2-term">
            GNSS
            <span className="s2-term-help" tabIndex={0} aria-label="توضیح GNSS">؟</span>
            <span className="s2-term-tooltip" role="tooltip">
              GNSS سامانه‌ای ماهواره‌ای برای تعیین موقعیت، ناوبری و زمان‌سنجی دقیق در سطح زمین است.
            </span>
          </span>{" "}
          آلوده‌اند، گزارش‌های میدانی با نقشه هم‌خوان نیست و فقط سه اقدام عملیاتی در هر راند قابل اجراست.
        </p>
        <div className="s2-briefing">
          <h3>بازیکن باید چه کار کند؟</h3>
          <ol>
            <li>وضعیت کاروان‌ها، نقشه و منابع را بررسی کنید.</li>
            <li>در هر راند حداکثر سه اقدام عملیاتی انتخاب کنید.</li>
            <li>اگر اقدام هدف‌دار است، بعد از انتخاب کارت باید هدف را روی نقشه مشخص کنید.</li>
            <li>وقتی بسته عملیاتی آماده شد، آن را اجرا کنید و پیامدها را در راند بعد ببینید.</li>
          </ol>
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
          <button type="button" onClick={() => setOpenDrawer("mission")}>وضعیت مأموریت</button>
          <button type="button" onClick={() => setOpenDrawer("log")}>لاگ عملیات</button>
        </div>
      </header>
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
            <span>حداکثر سه اقدام؛ کارت هدف‌دار بدون انتخاب هدف ثبت نمی‌شود.</span>
          </div>
          <div className="s2-action-grid">
            {actions.map((action) => {
              const selectedAction = selectedActions.find((item) => item.action.id === action.id);
              const disabledReason = selectedAction
                ? undefined
                : pendingAction && pendingAction.id !== action.id
                  ? "ابتدا هدف اقدام فعال را انتخاب یا لغو کنید."
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
                  onPick={() => handlePickAction(action)}
                  onRemove={() => removeSelectedAction(action.id, selectedAction?.targetId)}
                />
              );
            })}
          </div>
          <div className="s2-execute-row">
            <div className="s2-selected-actions">
              <strong>اقدام‌های انتخاب‌شده: {selectedActions.length}/3</strong>
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
            <button className="primary" disabled={selectedActions.length === 0 || Boolean(pendingAction)} onClick={executeRound}>اجرای بسته عملیاتی</button>
          </div>
        </section>
      </main>

      {openDrawer && (
        <div className="s2-drawer-backdrop" onClick={() => setOpenDrawer(null)}>
          <aside className="s2-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="s2-drawer-head">
              <h3>{openDrawer === "convoys" ? "کاروان‌ها" : openDrawer === "mission" ? "وضعیت مأموریت" : "لاگ عملیات"}</h3>
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
