import type { ResourceState } from "../../../core/types/scenario";

export type ScenarioTwoMissionStatus = {
  logisticsContinuity: number;
  criticalDelivery: number;
  navigationIntegrity: number;
  civilianStability: number;
  escalationRisk: number;
  remainingResources: number;
  ambiguity: number;
  cumulativeDelay: number;
  gnssExposureRisk: number;
};

export type ConvoyStatus = "moving" | "rerouted" | "paused" | "delivered" | "compromised";

export type Convoy = {
  id: string;
  name: string;
  cargo: string;
  priority: number;
  deadline: number;
  delay: number;
  status: ConvoyStatus;
  currentZoneId: string;
  routeId: string;
  hasFallbackNav: boolean;
  gnssTrustLevel: number;
};

export type MapZone = {
  id: string;
  name: string;
  x: number;
  y: number;
  threatLevel: "safe" | "suspicious" | "jammed" | "unknown";
  gnssDisruption: number;
  civilianSensitivity: number;
  isRevealed: boolean;
};

export type Route = {
  id: string;
  name: string;
  fromZoneId: string;
  toZoneId: string;
  travelCost: number;
  delayRisk: number;
  gnssRisk: number;
  civilianImpact: number;
  visualStatus: "safe" | "risky" | "danger" | "unknown";
};

export type ScenarioTwoDecisionWeights = {
  logisticsWeight: number;
  criticalDeliveryWeight: number;
  delayControlWeight: number;
  resourceEfficiencyWeight: number;
  navigationIntegrityWeight: number;
  civilianImpactWeight: number;
  escalationWeight: number;
  infoSeekingWeight: number;
  secondOrderThinkingWeight: number;
  adversaryModelingWeight: number;
  cognitiveFlexibilityWeight: number;
};

export type ActionCard = {
  id: string;
  title: string;
  description: string;
  category: "diagnosis" | "navigation" | "logistics" | "command" | "civilian" | "deception" | "risky";
  cost: Partial<ResourceState>;
  effects: Partial<ScenarioTwoMissionStatus>;
  requirements?: Partial<ResourceState>;
  targetType?: "convoy" | "zone" | "route" | "global";
  delayedEffect?: boolean;
  weights: ScenarioTwoDecisionWeights;
};

export type SelectedAction = {
  action: ActionCard;
  targetId?: string;
};

export type ScenarioTwoDecisionRecord = {
  roundId: string;
  selectedActionIds: string[];
  selectedTargets: Record<string, string>;
  responseTimeMs: number;
  changedActionCount: number;
  previewOpenCount: number;
  satelliteISRBefore: number;
  energyBefore: number;
  timeBefore: number;
  satelliteISRAfter: number;
  energyAfter: number;
  timeAfter: number;
  logisticsContinuityBefore: number;
  criticalDeliveryBefore: number;
  navigationIntegrityBefore: number;
  civilianStabilityBefore: number;
  ambiguityBefore: number;
  escalationRiskBefore: number;
  gnssExposureRiskBefore: number;
  cumulativeDelayBefore: number;
  logisticsContinuityAfter: number;
  criticalDeliveryAfter: number;
  navigationIntegrityAfter: number;
  civilianStabilityAfter: number;
  ambiguityAfter: number;
  escalationRiskAfter: number;
  gnssExposureRiskAfter: number;
  cumulativeDelayAfter: number;
} & ScenarioTwoDecisionWeights;

export type ScenarioTwoRound = {
  id: string;
  title: string;
  alertLevel: "زرد" | "نارنجی" | "قرمز";
  narrative: string;
  actionIds: string[];
};

export type ScenarioTwoMetrics = {
  falseGnssRelianceTime: number;
  isrUsageQuality: number;
  routeDiversityScore: number;
  resourceEfficiencyScore: number;
  secondOrderThinkingScore: number;
  adversaryModelingScore: number;
  escalationSensitivityScore: number;
  informationDisciplineScore: number;
  cognitiveFlexibilityScore: number;
  totalChangedActionCount: number;
  totalPreviewOpenCount: number;
};

export type ScenarioTwoSummaryData = {
  logisticsResilienceIndex: number;
  operationalStrategicIndex: number;
  decisionStyleLabel: string;
  decisionStyleText: string;
  criticalDeliveryScore: number;
  delayControlScore: number;
  gnssAnomalyDetectionScore: number;
  navigationCompromiseLevel: number;
  avgResponseTimeMs: number;
  learningNotes: string[];
};
