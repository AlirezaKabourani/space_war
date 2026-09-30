import type { RedIntent, ScenarioOneState } from "./types";

export const SCENARIO4_RESOURCE_SCALE_MAX = 100;

export const SCENARIO4_RESOURCE_PROFILES = {
  current: { ssaCapacity: 100, protectiveCapacity: 100, politicalCapital: 100, disclosureBudget: 100 },
  A: { ssaCapacity: 85, protectiveCapacity: 85, politicalCapital: 85, disclosureBudget: 75 },
  B: { ssaCapacity: 80, protectiveCapacity: 80, politicalCapital: 80, disclosureBudget: 70 },
  C: { ssaCapacity: 75, protectiveCapacity: 75, politicalCapital: 75, disclosureBudget: 65 },
} as const;

export type Scenario4ResourceProfileId = keyof typeof SCENARIO4_RESOURCE_PROFILES;

/** Selected after the resource-scarcity calibration audit. */
export const SCENARIO4_RESOURCE_PROFILE_ID: Scenario4ResourceProfileId = "A";
export const SCENARIO4_INITIAL_RESOURCE_BASELINE = {
  ...SCENARIO4_RESOURCE_PROFILES[SCENARIO4_RESOURCE_PROFILE_ID],
};

export const redIntentWeights: Array<{ intent: RedIntent; weight: number }> = [
  { intent: "probe", weight: 30 },
  { intent: "intelligence_collection", weight: 25 },
  { intent: "coercion", weight: 20 },
  { intent: "alliance_fracture", weight: 15 },
  { intent: "benign_ambiguous", weight: 10 },
];

export const redRiskByIntent: Record<RedIntent, number> = {
  probe: 58,
  intelligence_collection: 52,
  coercion: 72,
  alliance_fracture: 48,
  benign_ambiguous: 22,
};

export const createInitialScenarioOneState = (
  trueRedIntent: RedIntent
): ScenarioOneState => ({
  move: 1,
  visible: {
    missionContinuity: 90,
    situationAwareness: 38,
    escalationPressure: 18,
    operationalReadiness: 55,
    coalitionCohesion: 65,
    informationExposure: 15,
    strategicLegitimacy: 70,
  },
  resources: { ...SCENARIO4_INITIAL_RESOURCE_BASELINE },
  resourceBaseline: { ...SCENARIO4_INITIAL_RESOURCE_BASELINE },
  resourceAccounting: {
    userSpent: { ssaCapacity: 0, protectiveCapacity: 0, politicalCapital: 0, disclosureBudget: 0 },
    recovered: { ssaCapacity: 0, protectiveCapacity: 0, politicalCapital: 0, disclosureBudget: 0 },
  },
  knowledge: {
    systemAttributionConfidence: 20,
    evidenceIds: ["E_BASE_01", "E_BASE_02", "E_BASE_03"],
    redIntentEstimate: "uncertain",
  },
  hidden: {
    trueRedIntent,
    redRiskAppetite: redRiskByIntent[trueRedIntent],
    redPerceptionBlueResolve: 40,
    redPerceptionBlueEscalation: 20,
    allyTrust: 65,
    commercialTrust: 70,
    trueIncidentAttribution: "non_red",
  },
  flags: {
    sharedWithAlly: false,
    publicWarningIssued: false,
    visibleProtectionUsed: false,
    mediaInjectTriggered: false,
    conflictingCommercialData: false,
    redLearnedBlueThreshold: false,
    privateCommunication: false,
  },
});

export const cloneState = (state: ScenarioOneState): ScenarioOneState =>
  structuredClone(state);

export const clampScenarioOneState = (state: ScenarioOneState): ScenarioOneState => {
  const next = cloneState(state);
  const clamp = (value: number) => Math.max(0, Math.min(SCENARIO4_RESOURCE_SCALE_MAX, Math.round(value)));

  for (const key of Object.keys(next.visible) as Array<keyof ScenarioOneState["visible"]>) {
    next.visible[key] = clamp(next.visible[key]);
  }
  for (const key of Object.keys(next.resources) as Array<keyof ScenarioOneState["resources"]>) {
    next.resources[key] = clamp(next.resources[key]);
  }
  next.resourceBaseline ??= { ...SCENARIO4_INITIAL_RESOURCE_BASELINE };
  next.resourceAccounting ??= {
    userSpent: { ssaCapacity: 0, protectiveCapacity: 0, politicalCapital: 0, disclosureBudget: 0 },
    recovered: { ssaCapacity: 0, protectiveCapacity: 0, politicalCapital: 0, disclosureBudget: 0 },
  };
  next.knowledge.systemAttributionConfidence = clamp(
    next.knowledge.systemAttributionConfidence
  );
  next.hidden.redRiskAppetite = clamp(next.hidden.redRiskAppetite);
  next.hidden.redPerceptionBlueResolve = clamp(next.hidden.redPerceptionBlueResolve);
  next.hidden.redPerceptionBlueEscalation = clamp(
    next.hidden.redPerceptionBlueEscalation
  );
  next.hidden.allyTrust = clamp(next.hidden.allyTrust);
  next.hidden.commercialTrust = clamp(next.hidden.commercialTrust);
  return next;
};
