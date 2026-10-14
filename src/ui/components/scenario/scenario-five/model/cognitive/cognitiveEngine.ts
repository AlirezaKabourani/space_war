import { calculateEvidenceResponsiveUpdating } from "./evidenceScoring";
import { getScenario5OptionProfile, SCENARIO5_OPTION_PROFILES } from "./optionProfiles";
import { calculateReasonAlignment, getCrossDecisionCoherence } from "./reasonModel";
import type {
  CognitiveWindowId,
  DataCompletenessResult,
  DecisionTelemetry,
  DomainSalienceId,
  OptionCognitiveProfile,
  PhaseId,
  Scenario5CognitiveRunResult,
  Scenario5CognitiveTelemetryBundle,
  TelemetrySummaryResult,
} from "./types";
import {
  S5_COGNITIVE_FORMULA_VERSION,
  S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
  S5_EXPERT_PANEL_VERSION,
  S5_OPTION_PROFILE_VERSION,
  S5_REASON_MODEL_VERSION,
  S5_SCENARIO_CONTENT_VERSION,
  S5_VALIDITY_STATUS,
} from "./versions";

const EPSILON = 1e-9;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;
const finiteNonnegative = (value: number | null): value is number => value !== null && Number.isFinite(value) && value >= 0;

interface ExpectedWindow {
  readonly phaseId: PhaseId;
  readonly roundId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}
const EXPECTED_WINDOWS: Readonly<Record<CognitiveWindowId, ExpectedWindow>> = {
  A1_baseline_monitoring: { phaseId: "A", roundId: 1 },
  A2_evidence_acquisition: { phaseId: "A", roundId: 2 },
  B1_monitoring_allocation: { phaseId: "B", roundId: 3 },
  B2_route_policy: { phaseId: "B", roundId: 4 },
  C1_support_and_checkpoints: { phaseId: "C", roundId: 5 },
  C2_resource_portfolio: { phaseId: "C", roundId: 6 },
  D1_crisis_response: { phaseId: "D", roundId: 7 },
  D2_final_delivery_policy: { phaseId: "D", roundId: 8 },
};
const EXPECTED_WINDOW_IDS = Object.keys(EXPECTED_WINDOWS) as CognitiveWindowId[];
const PROFILE_IDS = new Set<string>(SCENARIO5_OPTION_PROFILES.map(({ actionId }) => actionId));
const REASON_IDS = new Set([
  "reason_mission_speed", "reason_reduce_exposure", "reason_preserve_resources", "reason_network_continuity",
  "reason_information_confidence", "reason_limit_actor_reaction", "reason_preserve_reversibility",
]);
const BELIEF_IDS = new Set(["A2_prebelief", "A2_postbelief", "C_belief_checkpoint", "D_final_belief"]);

const assertTimestamp = (value: number | null, label: string): void => {
  if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error(`${label} must be finite and nonnegative`);
};
const assertAction = (value: string | null, label: string): void => {
  if (value !== null && !PROFILE_IDS.has(value)) throw new Error(`${label} contains unknown action/profile ID: ${value}`);
};

export function validateScenario5CognitiveTelemetry(bundle: Scenario5CognitiveTelemetryBundle): void {
  if (bundle.scenarioId !== "s5_silent_waves_redesign") throw new Error("Invalid Scenario 5 cognitive scenarioId");
  assertTimestamp(bundle.startedAtMs, "startedAtMs");
  assertTimestamp(bundle.completedAtMs, "completedAtMs");
  const evidenceIds = new Set<string>();
  for (const item of bundle.evidence) {
    if (evidenceIds.has(item.evidenceId)) throw new Error(`Duplicate evidence ID: ${item.evidenceId}`);
    evidenceIds.add(item.evidenceId);
    assertTimestamp(item.availableAtMs, `evidence ${item.evidenceId} availableAtMs`);
    for (const windowId of item.relevantWindowIds) {
      if (!(windowId in EXPECTED_WINDOWS)) throw new Error(`Invalid relevant window: ${windowId}`);
    }
  }

  const decisionWindows = new Set<CognitiveWindowId>();
  for (const decision of bundle.decisions) {
    if (decisionWindows.has(decision.windowId)) throw new Error(`Duplicate decision window: ${decision.windowId}`);
    decisionWindows.add(decision.windowId);
    const expected = EXPECTED_WINDOWS[decision.windowId];
    if (!expected || decision.phaseId !== expected.phaseId || decision.roundId !== expected.roundId) {
      throw new Error(`Wrong phase/round/window mapping for ${decision.windowId}`);
    }
    for (const actionId of decision.availableActionIds) assertAction(actionId, decision.windowId);
    assertAction(decision.firstSelectedActionId, decision.windowId);
    assertAction(decision.finalSelectedActionId, decision.windowId);
    if (decision.finalSelectedActionId !== null && !decision.availableActionIds.includes(decision.finalSelectedActionId)) {
      throw new Error(`Final action is not available in ${decision.windowId}`);
    }
    for (const selection of decision.selectionHistory) {
      assertAction(selection.actionId, `${decision.windowId} selection`);
      assertTimestamp(selection.selectedAtMs, `${decision.windowId} selection timestamp`);
    }
    for (const [label, value] of [
      ["enteredAtMs", decision.enteredAtMs], ["confirmedAtMs", decision.confirmedAtMs],
      ["elapsedMs", decision.elapsedMs], ["activeDecisionMs", decision.activeDecisionMs],
      ["hiddenTabMs", decision.hiddenTabMs],
    ] as const) assertTimestamp(value, `${decision.windowId} ${label}`);
    if (decision.enteredAtMs !== null && decision.confirmedAtMs !== null && decision.confirmedAtMs < decision.enteredAtMs) {
      throw new Error(`Confirmation precedes entry in ${decision.windowId}`);
    }
    if (!Number.isInteger(decision.revisionCount) || decision.revisionCount < 0) throw new Error(`Invalid revision count in ${decision.windowId}`);
    for (const id of [...decision.availableEvidenceIds, ...decision.openedEvidenceIds]) {
      if (!evidenceIds.has(id)) throw new Error(`Invalid evidence reference ${id} in ${decision.windowId}`);
    }
    if (decision.openedEvidenceIds.some((id) => !decision.availableEvidenceIds.includes(id))) {
      throw new Error(`Opened evidence was not available in ${decision.windowId}`);
    }
  }

  for (const opened of bundle.evidenceOpens) {
    if (!evidenceIds.has(opened.evidenceId)) throw new Error(`Invalid evidence-open reference: ${opened.evidenceId}`);
    if (!(opened.windowId in EXPECTED_WINDOWS)) throw new Error(`Invalid evidence-open window: ${opened.windowId}`);
    assertTimestamp(opened.openedAtMs, `open ${opened.evidenceId}`);
    assertTimestamp(opened.closedAtMs, `close ${opened.evidenceId}`);
    assertTimestamp(opened.activeDwellMs, `dwell ${opened.evidenceId}`);
    if (opened.closedAtMs !== null && opened.closedAtMs < opened.openedAtMs) throw new Error(`Evidence close precedes open: ${opened.evidenceId}`);
  }

  const checkpoints = new Set<string>();
  for (const belief of bundle.beliefs) {
    if (!BELIEF_IDS.has(belief.checkpointId)) throw new Error(`Invalid belief checkpoint: ${belief.checkpointId}`);
    if (checkpoints.has(belief.checkpointId)) throw new Error(`Duplicate belief checkpoint: ${belief.checkpointId}`);
    checkpoints.add(belief.checkpointId);
    assertTimestamp(belief.recordedAtMs, `${belief.checkpointId} recordedAtMs`);
    for (const value of [belief.corridorConfidence, belief.targetedInterferenceEstimate, belief.targetedInterferenceConfidence]) {
      if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`Belief value outside 0..100 at ${belief.checkpointId}`);
    }
    for (const id of belief.visibleEvidenceIdsAtCheckpoint) {
      if (!evidenceIds.has(id)) throw new Error(`Invalid belief evidence reference: ${id}`);
    }
  }

  const reasonPhases = new Set<string>();
  for (const reason of bundle.reasons) {
    if (reasonPhases.has(reason.phaseId)) throw new Error(`Duplicate reason phase: ${reason.phaseId}`);
    reasonPhases.add(reason.phaseId);
    if (!REASON_IDS.has(reason.reasonId)) throw new Error(`Invalid reason ID: ${reason.reasonId}`);
    assertTimestamp(reason.recordedAtMs, `${reason.phaseId} reason timestamp`);
  }
}

const uniqueAvailableProfiles = (decision: DecisionTelemetry): OptionCognitiveProfile[] =>
  [...new Set(decision.availableActionIds)].map((actionId) => getScenario5OptionProfile(actionId));

const scoreEligible = (decision: DecisionTelemetry): boolean => decision.finalSelectedActionId !== null
  && decision.availableActionIds.includes(decision.finalSelectedActionId)
  && decision.availableActionIds.every((id) => PROFILE_IDS.has(id))
  && new Set(decision.availableActionIds).size >= 2;

export function rawOrientation(profile: OptionCognitiveProfile): number {
  return (profile.strategicLoading - profile.operationalLoading)
    / (profile.strategicLoading + profile.operationalLoading + EPSILON);
}

const adjustedRelative = (
  decision: DecisionTelemetry,
  metric: (profile: OptionCognitiveProfile) => number,
): number | null => {
  if (!scoreEligible(decision) || decision.finalSelectedActionId === null) return null;
  const profiles = uniqueAvailableProfiles(decision);
  const values = profiles.map(metric);
  const baseline = mean(values);
  const centered = values.map((value) => value - baseline);
  const maximum = Math.max(...centered.map(Math.abs));
  if (maximum < EPSILON) return null;
  return clamp((metric(getScenario5OptionProfile(decision.finalSelectedActionId)) - baseline) / maximum, -1, 1);
};

export function adjustedOrientationForDecision(decision: DecisionTelemetry): number | null {
  return adjustedRelative(decision, rawOrientation);
}

export function adjustedRiskForDecision(decision: DecisionTelemetry): number | null {
  return adjustedRelative(decision, ({ riskExposure }) => riskExposure);
}

const diagnostic = (decision: DecisionTelemetry, metric: (profile: OptionCognitiveProfile) => number): boolean => {
  if (!scoreEligible(decision)) return false;
  const values = uniqueAvailableProfiles(decision).map(metric);
  return Math.max(...values) - Math.min(...values) + EPSILON >= 0.1;
};

const phaseBalanced = (entries: readonly { phaseId: PhaseId; value: number }[]): number | null => {
  const phaseMeans = (["A", "B", "C", "D"] as const).flatMap((phaseId) => {
    const values = entries.filter((entry) => entry.phaseId === phaseId).map(({ value }) => value);
    return values.length === 0 ? [] : [mean(values)];
  });
  return phaseMeans.length === 0 ? null : mean(phaseMeans);
};

const scoreMetric = (
  decisions: readonly DecisionTelemetry[],
  windows: ReadonlySet<CognitiveWindowId>,
  metric: (profile: OptionCognitiveProfile) => number,
): number | null => {
  const entries = decisions.flatMap((decision) => {
    if (!windows.has(decision.windowId) || !diagnostic(decision, metric) || decision.finalSelectedActionId === null) return [];
    return [{ phaseId: decision.phaseId, value: metric(getScenario5OptionProfile(decision.finalSelectedActionId)) }];
  });
  const value = phaseBalanced(entries);
  return value === null ? null : 100 * clamp(value, 0, 1);
};

const OSI_WINDOWS = new Set<CognitiveWindowId>([
  "A1_baseline_monitoring", "B1_monitoring_allocation", "B2_route_policy", "C1_support_and_checkpoints",
  "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy",
]);
const INFO_WINDOWS = new Set<CognitiveWindowId>([
  "A1_baseline_monitoring", "A2_evidence_acquisition", "B1_monitoring_allocation", "B2_route_policy",
  "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response",
]);
const SECOND_ORDER_WINDOWS = OSI_WINDOWS;
const ADVERSARY_WINDOWS = new Set<CognitiveWindowId>(["C2_resource_portfolio", "D1_crisis_response"]);
const ESCALATION_WINDOWS = new Set<CognitiveWindowId>(["B2_route_policy", "D1_crisis_response", "D2_final_delivery_policy"]);
const PLANNING_WINDOWS = new Set<CognitiveWindowId>([
  "A1_baseline_monitoring", "B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio",
  "D1_crisis_response", "D2_final_delivery_policy",
]);
const MCI_WINDOWS = new Set<CognitiveWindowId>(["B1_monitoring_allocation", "B2_route_policy", "C2_resource_portfolio", "D1_crisis_response"]);
const RISK_WINDOWS = new Set<CognitiveWindowId>(["B2_route_policy", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"]);
const ALL_WINDOWS = new Set<CognitiveWindowId>(EXPECTED_WINDOW_IDS);

const secondOrder = (item: OptionCognitiveProfile): number => .35 * item.futureConsequenceThinking
  + .25 * item.adversaryModeling + .2 * item.reversibilityPreference + .2 * item.resourceStewardship;
const stewardship = (item: OptionCognitiveProfile): number => .5 * item.resourceStewardship
  + .3 * item.contingencyPlanning + .2 * item.reversibilityPreference;
const planning = (item: OptionCognitiveProfile): number => .35 * item.contingencyPlanning
  + .25 * item.reversibilityPreference + .2 * item.resourceStewardship + .2 * item.futureConsequenceThinking;
export const DOMAIN_ORDER: readonly DomainSalienceId[] = [
  "mission", "information", "navigation", "logistics", "resources", "civilian", "escalation", "futureOptions", "network",
];
export function multiCriteriaForProfile(item: OptionCognitiveProfile): number | null {
  const values = DOMAIN_ORDER.map((key) => item.domainSalience[key] ?? 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= EPSILON) return null;
  const entropy = -values.reduce((sum, value) => value <= 0 ? sum : sum + (value / total) * Math.log(value / total), 0) / Math.log(9);
  return clamp(entropy * (total / 9), 0, 1);
}

export function calculateIntegration(operationalStrength: number | null, strategicStrength: number | null): number | null {
  if (operationalStrength === null || strategicStrength === null) return null;
  const denominator = operationalStrength + strategicStrength;
  return denominator === 0 ? null : clamp(2 * operationalStrength * strategicStrength / denominator, 0, 100);
}

const orientationResult = (decisions: readonly DecisionTelemetry[]) => {
  const entries = decisions.flatMap((decision) => {
    if (!OSI_WINDOWS.has(decision.windowId)) return [];
    const value = adjustedOrientationForDecision(decision);
    return value === null ? [] : [{ phaseId: decision.phaseId, value }];
  });
  const byPhase = (["A", "B", "C", "D"] as const).map((phaseId) => {
    const values = entries.filter((entry) => entry.phaseId === phaseId).map(({ value }) => value);
    return values.length === 0 ? null : clamp(mean(values), -1, 1);
  }) as [number | null, number | null, number | null, number | null];
  const overall = byPhase.every((value): value is number => value !== null) ? clamp(mean(byPhase), -1, 1) : null;

  const rawEntries = decisions.flatMap((decision) => {
    if (!OSI_WINDOWS.has(decision.windowId) || !scoreEligible(decision) || decision.finalSelectedActionId === null) return [];
    return [{ phaseId: decision.phaseId, profile: getScenario5OptionProfile(decision.finalSelectedActionId) }];
  });
  const strength = (key: "operationalLoading" | "strategicLoading"): number | null => {
    const value = phaseBalanced(rawEntries.map(({ phaseId, profile }) => ({ phaseId, value: profile[key] })));
    return value === null ? null : clamp(100 * value, 0, 100);
  };
  const operationalStrength = strength("operationalLoading");
  const strategicStrength = strength("strategicLoading");
  const integration = calculateIntegration(operationalStrength, strategicStrength);
  const availablePhases = byPhase.filter((value): value is number => value !== null);
  const dispersion = availablePhases.length < 2
    ? null
    : Math.sqrt(mean(availablePhases.map((value) => (value - mean(availablePhases)) ** 2)));
  return { overall, operationalStrength, strategicStrength, integration, dispersion, phaseScores: byPhase };
};

const informationSeeking = (bundle: Scenario5CognitiveTelemetryBundle): number | null => {
  const evidenceById = new Map(bundle.evidence.map((item) => [item.evidenceId, item]));
  const entries = bundle.decisions.flatMap((decision) => {
    if (!INFO_WINDOWS.has(decision.windowId) || !scoreEligible(decision) || decision.finalSelectedActionId === null) return [];
    const relevant = decision.confirmedAtMs === null ? [] : bundle.evidence.filter((item) =>
      item.relevantWindowIds.includes(decision.windowId) && item.availableAtMs <= decision.confirmedAtMs!);
    const relevantIds = new Set(relevant.map(({ evidenceId }) => evidenceId));
    const openedIds = new Set(bundle.evidenceOpens.filter((opened) =>
      opened.windowId === decision.windowId
      && relevantIds.has(opened.evidenceId)
      && decision.enteredAtMs !== null
      && decision.confirmedAtMs !== null
      && opened.openedAtMs >= decision.enteredAtMs
      && opened.openedAtMs <= decision.confirmedAtMs).map(({ evidenceId }) => evidenceId));
    const selected = getScenario5OptionProfile(decision.finalSelectedActionId);
    if (!diagnostic(decision, ({ informationSeeking: value }) => value) && relevant.length === 0) return [];
    const components: { weight: number; value: number }[] = [{ weight: .6, value: selected.informationSeeking }];
    if (relevant.length > 0) {
      components.push({ weight: .25, value: openedIds.size / new Set(relevant.map(({ evidenceId }) => evidenceId)).size });
      const availableSources = new Set(relevant.map(({ sourceType }) => sourceType));
      let diversity = 0;
      if (openedIds.size > 0 && availableSources.size === 1) diversity = 1;
      else if (openedIds.size > 0 && availableSources.size >= 2) {
        const counts = new Map<string, number>();
        for (const id of openedIds) {
          const source = evidenceById.get(id)?.sourceType;
          if (source) counts.set(source, (counts.get(source) ?? 0) + 1);
        }
        diversity = -[...counts.values()].reduce((sum, count) => {
          const proportion = count / openedIds.size;
          return sum + proportion * Math.log(proportion);
        }, 0) / Math.log(availableSources.size);
      }
      components.push({ weight: .15, value: clamp(diversity, 0, 1) });
    }
    const weighted = components.reduce((sum, component) => sum + component.weight * component.value, 0)
      / components.reduce((sum, component) => sum + component.weight, 0);
    return [{ phaseId: decision.phaseId, value: weighted }];
  });
  const value = phaseBalanced(entries);
  return value === null ? null : 100 * clamp(value, 0, 1);
};

const resourceStewardship = (bundle: Scenario5CognitiveTelemetryBundle): number | null => {
  if (bundle.decisions.length !== 8 || EXPECTED_WINDOW_IDS.some((windowId) => {
    const decision = bundle.decisions.find((item) => item.windowId === windowId);
    return !decision || decision.playerVisibleResourcesBefore === null || decision.playerVisibleResourcesAfter === null;
  })) return null;
  const base = scoreMetric(bundle.decisions, ALL_WINDOWS, stewardship);
  if (base === null) return null;
  const final = bundle.decisions.find(({ windowId }) => windowId === "D2_final_delivery_policy")!.playerVisibleResourcesAfter!;
  const penalty = .05 * Number(final.isrCapacity <= 5) + .05 * Number(final.supportReserve <= 5);
  return 100 * clamp(base / 100 - penalty, 0, 1);
};

const multiDomainIntegration = (decisions: readonly DecisionTelemetry[]): number | null => {
  const metric = (item: OptionCognitiveProfile): number => multiCriteriaForProfile(item) ?? 0;
  return scoreMetric(decisions, MCI_WINDOWS, metric);
};

const riskPosture = (decisions: readonly DecisionTelemetry[]): number | null => {
  const entries = decisions.flatMap((decision) => {
    if (!RISK_WINDOWS.has(decision.windowId)) return [];
    const value = adjustedRiskForDecision(decision);
    return value === null ? [] : [{ phaseId: decision.phaseId, value }];
  });
  const value = phaseBalanced(entries);
  return value === null ? null : clamp(value, -1, 1);
};

const decisionCoherence = (bundle: Scenario5CognitiveTelemetryBundle): number | null => {
  const windows = { B: ["B1_monitoring_allocation", "B2_route_policy"], C: ["C1_support_and_checkpoints", "C2_resource_portfolio"], D: ["D1_crisis_response", "D2_final_delivery_policy"] } as const;
  const phases = (["B", "C", "D"] as const).flatMap((phaseId) => {
    const reason = bundle.reasons.find((item) => item.phaseId === phaseId && item.capturedBeforeOutcome);
    const first = bundle.decisions.find((item) => item.windowId === windows[phaseId][0]);
    const second = bundle.decisions.find((item) => item.windowId === windows[phaseId][1]);
    if (!reason || !first?.finalSelectedActionId || !second?.finalSelectedActionId) return [];
    const cross = getCrossDecisionCoherence(phaseId, first.finalSelectedActionId, second.finalSelectedActionId);
    if (cross === null) return [];
    return [{
      reason: mean([
        calculateReasonAlignment(first.finalSelectedActionId, reason.reasonId),
        calculateReasonAlignment(second.finalSelectedActionId, reason.reasonId),
      ]),
      cross,
    }];
  });
  if (phases.length < 2) return null;
  return 100 * clamp(.6 * mean(phases.map(({ reason }) => reason)) + .4 * mean(phases.map(({ cross }) => cross)), 0, 1);
};

export function calculateDataCompleteness(bundle: Scenario5CognitiveTelemetryBundle): DataCompletenessResult {
  const evidenceIds = new Set(bundle.evidence.map(({ evidenceId }) => evidenceId));
  const validDecisions = bundle.decisions.filter((decision) => {
    const expected = EXPECTED_WINDOWS[decision.windowId];
    return expected && expected.phaseId === decision.phaseId && expected.roundId === decision.roundId
      && decision.finalSelectedActionId !== null && decision.availableActionIds.includes(decision.finalSelectedActionId);
  }).length;
  const timingComplete = bundle.decisions.filter((decision) =>
    finiteNonnegative(decision.enteredAtMs) && finiteNonnegative(decision.confirmedAtMs)
    && finiteNonnegative(decision.elapsedMs) && finiteNonnegative(decision.activeDecisionMs)
    && finiteNonnegative(decision.hiddenTabMs) && decision.confirmedAtMs >= decision.enteredAtMs).length;
  const evidenceComplete = bundle.decisions.filter((decision) =>
    decision.availableEvidenceIds.every((id) => evidenceIds.has(id))
    && decision.openedEvidenceIds.every((id) => evidenceIds.has(id) && decision.availableEvidenceIds.includes(id))).length;
  const validBeliefs = bundle.beliefs.filter((belief) => BELIEF_IDS.has(belief.checkpointId)
    && [belief.corridorConfidence, belief.targetedInterferenceEstimate, belief.targetedInterferenceConfidence]
      .every((value) => Number.isFinite(value) && value >= 0 && value <= 100)).length;
  const validReasons = bundle.reasons.filter((reason) => REASON_IDS.has(reason.reasonId) && reason.capturedBeforeOutcome).length;
  const decisions = 100 * validDecisions / 8;
  const timing = 100 * timingComplete / 8;
  const evidence = 100 * evidenceComplete / 8;
  const estimates = 100 * validBeliefs / 4;
  const reasons = 100 * validReasons / 3;
  return { overall: clamp(.5 * decisions + .15 * timing + .15 * evidence + .1 * estimates + .1 * reasons, 0, 100), decisions, timing, evidence, estimates, reasons };
}

const quantile = (sorted: readonly number[], probability: number): number => {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower]! + (index - lower) * (sorted[upper]! - sorted[lower]!);
};

export function calculateTelemetrySummary(bundle: Scenario5CognitiveTelemetryBundle): TelemetrySummaryResult {
  const activeTimes = bundle.decisions.map(({ activeDecisionMs }) => activeDecisionMs)
    .filter(finiteNonnegative).sort((left, right) => left - right);
  const medianActiveDecisionMs = activeTimes.length === 0 ? null : quantile(activeTimes, .5);
  const iqrActiveDecisionMs = activeTimes.length === 0 ? null : quantile(activeTimes, .75) - quantile(activeTimes, .25);
  const totalRevisions = bundle.decisions.reduce((sum, { revisionCount }) => sum + revisionCount, 0);
  const revisedWindows = bundle.decisions.filter(({ revisionCount }) => revisionCount > 0).length;
  const eligible = bundle.decisions.filter((decision) => {
    const firstSelectionAt = decision.selectionHistory[0]?.selectedAtMs;
    return firstSelectionAt !== undefined && decision.confirmedAtMs !== null && bundle.evidenceOpens.some((opened) =>
      opened.windowId === decision.windowId && opened.openedAtMs > firstSelectionAt! && opened.openedAtMs < decision.confirmedAtMs!);
  });
  const triggered = eligible.filter((decision) =>
    decision.firstSelectedActionId !== null && decision.firstSelectedActionId !== decision.finalSelectedActionId).length;
  return {
    medianActiveDecisionMs,
    iqrActiveDecisionMs,
    totalRevisions,
    revisedWindows,
    evidenceTriggeredRevisionRate: eligible.length === 0 ? null : 100 * triggered / eligible.length,
  };
}

export function calculateScenario5CognitiveRunResult(
  bundle: Scenario5CognitiveTelemetryBundle,
): Scenario5CognitiveRunResult {
  validateScenario5CognitiveTelemetry(bundle);
  return {
    scenarioId: bundle.scenarioId,
    runId: bundle.runId,
    measurementModelVersion: S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
    formulaVersion: S5_COGNITIVE_FORMULA_VERSION,
    optionProfileVersion: S5_OPTION_PROFILE_VERSION,
    scenarioContentVersion: S5_SCENARIO_CONTENT_VERSION,
    reasonModelVersion: S5_REASON_MODEL_VERSION,
    expertPanelVersion: S5_EXPERT_PANEL_VERSION,
    validityStatus: S5_VALIDITY_STATUS,
    dataCompleteness: calculateDataCompleteness(bundle),
    orientation: orientationResult(bundle.decisions),
    constructs: {
      informationSeeking: informationSeeking(bundle),
      secondOrderThinking: scoreMetric(bundle.decisions, SECOND_ORDER_WINDOWS, secondOrder),
      adversaryModeling: scoreMetric(bundle.decisions, ADVERSARY_WINDOWS, ({ adversaryModeling }) => adversaryModeling),
      escalationSensitivity: scoreMetric(bundle.decisions, ESCALATION_WINDOWS, ({ escalationSensitivity }) => escalationSensitivity),
      informationDiscipline: null,
      evidenceResponsiveUpdating: calculateEvidenceResponsiveUpdating(bundle.beliefs, bundle.evidence),
      resourceStewardship: resourceStewardship(bundle),
      planningForesight: scoreMetric(bundle.decisions, PLANNING_WINDOWS, planning),
      multiDomainIntegration: multiDomainIntegration(bundle.decisions),
      riskPosture: riskPosture(bundle.decisions),
      decisionCoherence: decisionCoherence(bundle),
    },
    telemetrySummary: calculateTelemetrySummary(bundle),
  };
}
