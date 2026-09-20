import type {
  AttributionEstimateTelemetryV3,
  DecisionTelemetryV3,
  ResourceEvent,
  ScenarioOneDecisionRecord,
  TrueIncidentAttribution,
} from "./types";
import {
  COGNITIVE_FORMULA_VERSION,
  COGNITIVE_MODEL_VERSION,
  COGNITIVE_OPTION_PROFILES_V3,
  COGNITIVE_WINDOWS_V3,
  CORE_WINDOWS_BY_MOVE,
  EXPERT_PANEL_VERSION,
  ANCHOR_TEST_VERSION,
  OPTION_PROFILE_VERSION,
  REASON_ALIGNMENT_MATRIX_V3,
  MOVE3_CROSS_COHERENCE_V3,
  SCENARIO_CONTENT_VERSION,
  type CognitiveOptionProfileV3,
  type CoreDecisionWindowV3,
} from "./cognitiveOptionProfilesV3.ts";

const EPSILON = 1e-6;
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const weightedMean = (pairs: Array<[number | null | undefined, number]>) => {
  const valid = pairs.filter((pair): pair is [number, number] => pair[0] != null && Number.isFinite(pair[0]) && pair[1] > 0);
  const denominator = valid.reduce((sum, [, weight]) => sum + weight, 0);
  return denominator ? valid.reduce((sum, [value, weight]) => sum + value * weight, 0) / denominator : null;
};

export const centerAndNormalizeWithinWindow = (values: number[], selectedIndex: number) => {
  if (!values.length || selectedIndex < 0 || selectedIndex >= values.length) return null;
  const windowMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map((value) => value - windowMean);
  const maxAbsolute = Math.max(...centered.map(Math.abs));
  return maxAbsolute === 0 ? 0 : clamp(centered[selectedIndex] / maxAbsolute, -1, 1);
};

export const markerPercentForOsi = (overall: number) => ((overall + 1) / 2) * 100;
export const harmonicIntegration = (operational: number, strategic: number) =>
  operational + strategic === 0 ? 0 : (2 * operational * strategic) / (operational + strategic);
export const populationDispersion = (values: number[]) => {
  const valueMean = mean(values);
  return valueMean == null ? null : Math.sqrt(values.reduce((sum, value) => sum + (value - valueMean) ** 2, 0) / values.length);
};

export const activeDurationFromPauses = (
  enteredAtMs: number,
  confirmedAtMs: number,
  pauses: Array<{ startedAtMs: number; endedAtMs: number }>
) => Math.max(0, confirmedAtMs - enteredAtMs - pauses.reduce((sum, pause) => {
  const start = Math.max(enteredAtMs, pause.startedAtMs);
  const end = Math.min(confirmedAtMs, pause.endedAtMs);
  return sum + Math.max(0, end - start);
}, 0));

export interface SelectionTelemetryStateV3 {
  firstSelectedOptionId?: string;
  finalSelectedOptionId?: string;
  optionChangeCount: number;
  selectionTimeline: Array<{ optionId: string; ts: string }>;
}

export const applyOptionSelectionV3 = (
  state: SelectionTelemetryStateV3,
  optionId: string,
  ts: string
): SelectionTelemetryStateV3 => ({
  firstSelectedOptionId: state.firstSelectedOptionId ?? optionId,
  finalSelectedOptionId: optionId,
  optionChangeCount: state.finalSelectedOptionId && state.finalSelectedOptionId !== optionId
    ? state.optionChangeCount + 1
    : state.optionChangeCount,
  selectionTimeline: [...state.selectionTimeline, { optionId, ts }],
});

const rawOrientation = (profile: CognitiveOptionProfileV3) =>
  (profile.strategicLoading - profile.operationalLoading) /
  (profile.strategicLoading + profile.operationalLoading + EPSILON);

export const adjustedOrientationForOption = (windowId: CoreDecisionWindowV3, optionId: string) => {
  const options = COGNITIVE_WINDOWS_V3[windowId];
  const selectedIndex = options.indexOf(optionId);
  return centerAndNormalizeWithinWindow(options.map((id) => rawOrientation(COGNITIVE_OPTION_PROFILES_V3[id])), selectedIndex);
};

type MetricKey = keyof Pick<CognitiveOptionProfileV3,
  "informationSeeking" | "adversaryModeling" | "escalationSensitivity" | "coalitionOrientation" |
  "reversibilityPreference" | "resourceStewardship" | "contingencyPlanning" | "riskExposure">;

const adjustedProfileMetric = (windowId: CoreDecisionWindowV3, optionId: string, key: MetricKey) => {
  const options = COGNITIVE_WINDOWS_V3[windowId];
  return centerAndNormalizeWithinWindow(options.map((id) => Number(COGNITIVE_OPTION_PROFILES_V3[id][key])), options.indexOf(optionId));
};

const evidenceMeta: Record<string, { sourceType: string; shareability: number; relevantWindows: CoreDecisionWindowV3[] }> = {
  E_BASE_01: { sourceType: "military_ssa", shareability: .65, relevantWindows: ["m1_information", "m1_communication"] },
  E_BASE_02: { sourceType: "declared_profile", shareability: .90, relevantWindows: ["m1_information", "m1_communication"] },
  E_BASE_03: { sourceType: "analysis", shareability: .45, relevantWindows: ["m1_information", "m1_communication"] },
  E_SSA_01: { sourceType: "military_ssa", shareability: .40, relevantWindows: ["m1_information", "m1_communication", "m2_investigation"] },
  E_COMM_CONFLICT_01: { sourceType: "commercial", shareability: .75, relevantWindows: ["m1_information", "m1_communication", "m2_investigation"] },
  E_M2_01: { sourceType: "mission_telemetry", shareability: .65, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_02: { sourceType: "technical", shareability: .35, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_03: { sourceType: "analysis", shareability: .40, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_TECH_STRONG: { sourceType: "technical", shareability: .35, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_TECH_INCONCLUSIVE: { sourceType: "technical", shareability: .40, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_TECH_MIXED: { sourceType: "technical", shareability: .35, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_ALLY_01: { sourceType: "ally", shareability: .55, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_COMM_01: { sourceType: "commercial", shareability: .80, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
};

const entropy = (values: number[], divisor: number) => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return 0;
  return -values.reduce((sum, value) => value ? sum + (value / total) * Math.log(value / total) : sum, 0) / Math.log(divisor);
};

const latestCoreRecords = (records: ScenarioOneDecisionRecord[]) => {
  const latest = new Map<CoreDecisionWindowV3, ScenarioOneDecisionRecord>();
  for (const record of records) if (record.windowId in COGNITIVE_WINDOWS_V3) latest.set(record.windowId as CoreDecisionWindowV3, record);
  return latest;
};

const evidenceCoverageFor = (telemetry: DecisionTelemetryV3, windowId: CoreDecisionWindowV3) => {
  const available = telemetry.evidenceAvailableIds.filter((id) => evidenceMeta[id]?.relevantWindows.includes(windowId));
  if (!available.length) return null;
  const opened = new Set(telemetry.evidenceOpenedIds);
  return available.filter((id) => opened.has(id)).length / available.length;
};

const sourceDiversityFor = (telemetry: DecisionTelemetryV3, windowId: CoreDecisionWindowV3) => {
  const availableTypes = new Set(telemetry.evidenceAvailableIds.flatMap((id) => evidenceMeta[id]?.relevantWindows.includes(windowId) ? [evidenceMeta[id].sourceType] : []));
  if (!availableTypes.size) return null;
  if (availableTypes.size <= 1) return 1;
  const openedTypes = telemetry.evidenceOpenedIds.flatMap((id) => evidenceMeta[id]?.relevantWindows.includes(windowId) ? [evidenceMeta[id].sourceType] : []);
  if (!openedTypes.length) return 0;
  const counts = [...availableTypes].map((type) => openedTypes.filter((opened) => opened === type).length);
  return entropy(counts, availableTypes.size);
};

export interface EvidenceUpdateAuditV3 {
  phaseBefore: AttributionEstimateTelemetryV3["phase"];
  phaseAfter: AttributionEstimateTelemetryV3["phase"];
  playerBefore: number;
  playerAfter: number;
  evidenceBefore: number;
  evidenceAfter: number;
  dP: number;
  dE: number;
  directionAgreement: number;
  magnitudeAlignment: number;
  weight: number;
  rawScore: number;
  finalContribution: number;
}

export const calculateEvidenceUpdatingAudit = (estimates: AttributionEstimateTelemetryV3[]) => {
  if (estimates.length < 2) return { score: null, updates: [] as EvidenceUpdateAuditV3[] };
  const ordered = [...estimates].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  const updates: EvidenceUpdateAuditV3[] = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const before = ordered[index - 1];
    const after = ordered[index];
    const dP = (after.playerEstimate - before.playerEstimate) / 100;
    const dE = (after.systemEvidenceConfidence - before.systemEvidenceConfidence) / 100;
    const directionAgreement = Math.abs(dE) < .05 && Math.abs(dP) < .10 ? 1 : Math.sign(dP) === Math.sign(dE) ? 1 : Math.abs(dP) < .05 ? .5 : 0;
    const magnitudeAlignment = 1 - Math.min(Math.abs(dP - dE) / .50, 1);
    const weight = Math.max(.25, Math.min(1, Math.abs(dE) / .25));
    const rawScore = .60 * directionAgreement + .40 * magnitudeAlignment;
    updates.push({
      phaseBefore: before.phase,
      phaseAfter: after.phase,
      playerBefore: before.playerEstimate,
      playerAfter: after.playerEstimate,
      evidenceBefore: before.systemEvidenceConfidence,
      evidenceAfter: after.systemEvidenceConfidence,
      dP,
      dE,
      directionAgreement,
      magnitudeAlignment,
      weight,
      rawScore,
      finalContribution: 0,
    });
  }
  const totalWeight = updates.reduce((sum, update) => sum + update.weight, 0);
  updates.forEach((update) => { update.finalContribution = totalWeight ? update.rawScore * update.weight / totalWeight * 100 : 0; });
  const score = weightedMean(updates.map((update) => [update.rawScore, update.weight]));
  return { score: score == null ? null : score * 100, updates };
};

export const calculateEvidenceUpdating = (estimates: AttributionEstimateTelemetryV3[]) =>
  calculateEvidenceUpdatingAudit(estimates).score;

const percentile = (values: number[], fraction: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};

export interface CognitiveModelV3Input {
  records: ScenarioOneDecisionRecord[];
  telemetry: DecisionTelemetryV3[];
  attributionEstimates: AttributionEstimateTelemetryV3[];
  reasons: Partial<Record<"move_1" | "move_2" | "move_3", string>>;
  resourceEvents: ResourceEvent[];
}

export interface CognitiveModelV3Result {
  versions: { measurementModelVersion: typeof COGNITIVE_MODEL_VERSION; formulaVersion: typeof COGNITIVE_FORMULA_VERSION; optionProfileVersion: typeof OPTION_PROFILE_VERSION; scenarioContentVersion: typeof SCENARIO_CONTENT_VERSION; expertPanelVersion: typeof EXPERT_PANEL_VERSION; anchorTestVersion: typeof ANCHOR_TEST_VERSION };
  orientation: { overall: number | null; markerPercent: number | null; perMove: { move1: number | null; move2: number | null; move3: number | null }; operationalStrength: number | null; strategicStrength: number | null; integration: number | null; dispersion: number | null; dispersionLabel: string; interpretation: string };
  scores: Record<"informationSeeking" | "secondOrderThinking" | "adversaryModeling" | "escalationSensitivity" | "informationDiscipline" | "evidenceResponsiveUpdating" | "coalitionOrientation" | "resourceStewardship" | "planningForesight" | "multiDomainIntegration" | "riskPosture" | "decisionCoherence", number | null>;
  dataCompleteness: { overall: number; components: { coreDecisionRecords: number; timingIntegrity: number; evidenceTelemetry: number; attributionEstimates: number; reasonCapture: number } };
  timing: { medianActiveDecisionMs: number | null; iqrActiveDecisionMs: number | null; totalEvidenceDwellMs: number; longestDecision?: { windowId: string; activeDecisionMs: number }; shortestDecision?: { windowId: string; activeDecisionMs: number }; totalRevisions: number; revisedWindows: number; firstToFinalChanges: Array<{ windowId: string; first?: string; final: string }>; evidenceTriggeredRevisionRate: number | null };
  attribution: { evidenceAlignment: Array<{ phase: string; score: number }>; meanEvidenceAlignment: number | null; evidenceUpdatingAudit: EvidenceUpdateAuditV3[] };
  responseProcess: { flags: ResponseProcessFlags; activeFlags: Array<keyof ResponseProcessFlags>; status: "normal" | "caution" };
  perWindow: Array<{ windowId: string; optionId: string; adjustedOsi: number | null; operationalLoading: number; strategicLoading: number; diagnosticWeight: number; evidenceCoverage: number | null }>;
  missingReasons: string[];
}

export interface ResponseProcessFlags {
  uniform_option_position: boolean;
  very_low_active_time: boolean;
  zero_evidence_engagement: boolean;
  invariant_attribution: boolean;
  minimal_revision: boolean;
  rapid_straightlining: boolean;
}

export const interpretOrientationV3 = (overall: number | null, integration: number | null, dispersion: number | null) => {
  if (overall == null || integration == null || dispersion == null) return "داده کافی برای تفسیر ثبت نشده است";
  if (Math.abs(overall) <= .15 && integration >= 70 && dispersion <= .15) return "رویکرد یکپارچه عملیاتی–راهبردی";
  if (Math.abs(overall) <= .15 && dispersion > .15) return "جهت‌گیری وابسته به موقعیت";
  if (Math.abs(overall) <= .15 && integration < 45) return "الگوی جهت‌گیری ضعیف/نامتمایز";
  if (overall < -.45) return "گرایش عملیاتی مشخص";
  if (overall < -.15) return "تمایل عملیاتی";
  if (overall > .45) return "گرایش راهبردی مشخص";
  if (overall > .15) return "تمایل راهبردی";
  return "مرکز طیف";
};

export const calculateCognitiveModelV3 = (input: CognitiveModelV3Input): CognitiveModelV3Result => {
  const latest = latestCoreRecords(input.records);
  const telemetryByWindow = new Map(input.telemetry.map((item) => [item.windowId, item]));
  const perWindow = [...latest.entries()].map(([windowId, record]) => {
    const profile = COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId];
    const telemetry = telemetryByWindow.get(windowId);
    return { windowId, optionId: record.selectedOptionId, adjustedOsi: adjustedOrientationForOption(windowId, record.selectedOptionId), operationalLoading: profile?.operationalLoading ?? 0, strategicLoading: profile?.strategicLoading ?? 0, diagnosticWeight: profile?.diagnosticity.osi ?? 0, evidenceCoverage: telemetry ? evidenceCoverageFor(telemetry, windowId) : null };
  });
  const moveIndices = Object.values(CORE_WINDOWS_BY_MOVE).map((windows) => {
    const items = windows.map((windowId) => perWindow.find((row) => row.windowId === windowId));
    if (items.some((item) => !item || item.adjustedOsi == null)) return null;
    return weightedMean(items.map((item) => [item!.adjustedOsi, item!.diagnosticWeight]));
  });
  const completeMoves = moveIndices.every((value) => value != null);
  const overall = completeMoves ? (moveIndices[0]! + moveIndices[1]! + moveIndices[2]!) / 3 : null;
  const selectedProfiles = [...latest.values()].map((record) => COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId]).filter(Boolean);
  const operational = weightedMean(selectedProfiles.map((profile) => [profile.operationalLoading, profile.diagnosticity.osi]));
  const strategic = weightedMean(selectedProfiles.map((profile) => [profile.strategicLoading, profile.diagnosticity.osi]));
  const operationalStrength = operational == null ? null : operational * 100;
  const strategicStrength = strategic == null ? null : strategic * 100;
  const integration = operationalStrength == null || strategicStrength == null ? null : harmonicIntegration(operationalStrength, strategicStrength);
  const dispersion = completeMoves ? populationDispersion(moveIndices as number[]) : null;
  const profileScore = (getter: (profile: CognitiveOptionProfileV3) => number, diagnostic: keyof CognitiveOptionProfileV3["diagnosticity"]) => {
    const value = weightedMean(selectedProfiles.map((profile) => [getter(profile), profile.diagnosticity[diagnostic]]));
    return value == null ? null : value * 100;
  };
  const informationParts = (["m1_information", "m2_investigation"] as CoreDecisionWindowV3[]).flatMap((windowId) => {
    const record = latest.get(windowId); const telemetry = telemetryByWindow.get(windowId);
    if (!record || !telemetry) return [];
    const profile = COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId];
    const coverage = evidenceCoverageFor(telemetry, windowId); const diversity = sourceDiversityFor(telemetry, windowId);
    return coverage == null || diversity == null ? [] : [[.60 * profile.informationSeeking + .25 * coverage + .15 * diversity, profile.diagnosticity.informationSeeking] as [number, number]];
  });
  const informationSeekingRaw = weightedMean(informationParts);
  const informationDisciplineParts = (["m1_communication", "m2_response", "m3_info"] as CoreDecisionWindowV3[]).flatMap((windowId) => {
    const record = latest.get(windowId); const telemetry = telemetryByWindow.get(windowId);
    if (!record || !telemetry) return [];
    const profile = COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId];
    if (profile.claimIntensity == null || profile.disclosureIntensity == null || telemetry.systemAttributionConfidenceVisibleAtDecision == null) return [];
    const shareabilities = telemetry.evidenceAvailableIds.map((id) => evidenceMeta[id]?.shareability).filter((value): value is number => value != null);
    const shareability = mean(shareabilities); if (shareability == null) return [];
    const overclaim = Math.max(0, profile.claimIntensity - telemetry.systemAttributionConfidenceVisibleAtDecision / 100);
    const overDisclosure = Math.max(0, profile.disclosureIntensity - shareability);
    return [[clamp(1 - .70 * overclaim - .30 * overDisclosure), 1] as [number, number]];
  });
  const coalition = weightedMean([...latest.entries()].map(([windowId, record]) => [adjustedProfileMetric(windowId, record.selectedOptionId, "coalitionOrientation"), COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId].diagnosticity.coalitionOrientation]));
  const risk = weightedMean([...latest.entries()].map(([windowId, record]) => [adjustedProfileMetric(windowId, record.selectedOptionId, "riskExposure"), COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId].diagnosticity.riskPosture]));
  const userCosts = input.resourceEvents.filter((event) => event.kind === "user_cost");
  const shadow = { ssaCapacity: 100, protectiveCapacity: 100, politicalCapital: 100, disclosureBudget: 100 };
  userCosts.forEach((event) => { shadow[event.resource] = clamp(shadow[event.resource] + event.delta, 0, 100); });
  const resourcePenalty = Math.min(.30, Object.values(shadow).filter((value) => value < 15).length * .10);
  const stewardshipBase = weightedMean(selectedProfiles.map((profile) => [.50 * profile.resourceStewardship + .30 * profile.contingencyPlanning + .20 * profile.reversibilityPreference, profile.diagnosticity.resourceStewardship]));
  const multiDomain = profileScore((profile) => {
    const values = [profile.domainMission, profile.domainInformation, profile.domainEscalation, profile.domainCoalition, profile.domainResources, profile.domainLegitimacy, profile.domainFutureOptions];
    return entropy(values, 7) * Math.min(1, values.reduce((sum, value) => sum + value, 0) / 3.5);
  }, "multiDomain");
  const reasonAlignments = Object.entries(input.reasons).flatMap(([move, reason]) => {
    if (!reason) return [];
    const records = [...latest.values()].filter((record) => record.moveId === move);
    const values = records.map((record) => REASON_ALIGNMENT_MATRIX_V3[reason]?.[record.selectedOptionId]).filter((value): value is number => value != null);
    const result = mean(values); return result == null ? [] : [result];
  });
  const threshold = latest.get("m3_threshold")?.selectedOptionId;
  const coa = latest.get("m3_coa")?.selectedOptionId;
  const info = latest.get("m3_info")?.selectedOptionId;
  const crossRule = MOVE3_CROSS_COHERENCE_V3.rules.find((rule) =>
    (!("threshold" in rule) || rule.threshold === threshold) &&
    (!("coa" in rule) || rule.coa === coa) &&
    (!("informationPolicy" in rule) || rule.informationPolicy === info));
  const crossCoherence = !threshold || !coa || !info ? null : crossRule?.score ?? MOVE3_CROSS_COHERENCE_V3.defaultScore;
  const reasonMean = mean(reasonAlignments);
  const decisionCoherence = reasonMean == null || crossCoherence == null ? null : 100 * (.60 * reasonMean + .40 * crossCoherence);
  const coreDecisionRecords = latest.size / 9 * 100;
  const coreTelemetry = [...latest.keys()].map((windowId) => telemetryByWindow.get(windowId));
  const timingIntegrity = coreTelemetry.filter((item) => item && Number.isFinite(item.activeDecisionMs) && item.activeDecisionMs >= 0).length / 9 * 100;
  const evidenceTelemetry = coreTelemetry.filter((item) => item && Array.isArray(item.evidenceAvailableIds) && Array.isArray(item.evidenceOpenedIds)).length / 9 * 100;
  const attributionCompleteness = Math.min(3, input.attributionEstimates.length) / 3 * 100;
  const reasonCapture = (["move_1", "move_2", "move_3"] as const).filter((move) => input.reasons[move]).length / 3 * 100;
  const completeness = .50 * coreDecisionRecords + .15 * timingIntegrity + .15 * evidenceTelemetry + .10 * attributionCompleteness + .10 * reasonCapture;
  const times = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item)).map((item) => item.activeDecisionMs);
  const q1 = percentile(times, .25); const q3 = percentile(times, .75);
  const sortedTimes = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item)).sort((a, b) => a.activeDecisionMs - b.activeDecisionMs);
  const totalEvidenceDwellMs = input.telemetry.flatMap((item) => item.evidenceOpenTimeline).reduce((sum, item) => sum + (item.activeDwellMs ?? 0), 0);
  const firstToFinalChanges = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item?.firstSelectedOptionId && item.firstSelectedOptionId !== item.finalSelectedOptionId)).map((item) => ({ windowId: item.windowId, first: item.firstSelectedOptionId, final: item.finalSelectedOptionId }));
  const revisionOpportunities = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item && item.optionChangeCount > 0 && item.evidenceOpenTimeline.length > 0));
  const evidenceTriggeredRevisions = revisionOpportunities.filter((item) => item.selectionTimeline.some((selection, index) => index > 0 && item.evidenceOpenTimeline.some((evidence) => Date.parse(evidence.openedAt) <= Date.parse(selection.ts))));
  const evidenceTriggeredRevisionRate = revisionOpportunities.length ? evidenceTriggeredRevisions.length / revisionOpportunities.length * 100 : null;
  const evidenceAlignment = input.attributionEstimates.map((item) => ({ phase: item.phase, score: 100 - Math.abs(item.playerEstimate - item.systemEvidenceConfidence) }));
  const evidenceUpdatingAudit = calculateEvidenceUpdatingAudit(input.attributionEstimates);
  const selectedOrdinals = [...latest.entries()].map(([windowId, record]) => COGNITIVE_WINDOWS_V3[windowId].indexOf(record.selectedOptionId));
  const ordinalCounts = new Map<number, number>();
  selectedOrdinals.forEach((ordinal) => ordinalCounts.set(ordinal, (ordinalCounts.get(ordinal) ?? 0) + 1));
  const maxSameOrdinal = Math.max(0, ...ordinalCounts.values());
  const uniformOptionPosition = selectedOrdinals.length >= 9 && maxSameOrdinal >= 8;
  const medianActiveDecisionMs = percentile(times, .5);
  const veryLowActiveTime = medianActiveDecisionMs != null && medianActiveDecisionMs < 2_000;
  const openedEvidenceCount = new Set(input.telemetry.flatMap((item) => item.evidenceOpenedIds)).size;
  const availableEvidenceCount = new Set(input.telemetry.flatMap((item) => item.evidenceAvailableIds)).size;
  const invariantAttribution = input.attributionEstimates.length >= 3 && new Set(input.attributionEstimates.map((item) => item.playerEstimate)).size === 1;
  const minimalRevision = coreTelemetry.reduce((sum, item) => sum + (item?.optionChangeCount ?? 0), 0) === 0;
  const responseFlags: ResponseProcessFlags = {
    uniform_option_position: uniformOptionPosition,
    very_low_active_time: veryLowActiveTime,
    zero_evidence_engagement: availableEvidenceCount > 0 && openedEvidenceCount === 0,
    invariant_attribution: invariantAttribution,
    minimal_revision: minimalRevision,
    rapid_straightlining: uniformOptionPosition && veryLowActiveTime,
  };
  const activeResponseFlags = (Object.keys(responseFlags) as Array<keyof ResponseProcessFlags>).filter((key) => responseFlags[key]);
  return {
    versions: { measurementModelVersion: COGNITIVE_MODEL_VERSION, formulaVersion: COGNITIVE_FORMULA_VERSION, optionProfileVersion: OPTION_PROFILE_VERSION, scenarioContentVersion: SCENARIO_CONTENT_VERSION, expertPanelVersion: EXPERT_PANEL_VERSION, anchorTestVersion: ANCHOR_TEST_VERSION },
    orientation: {
      overall, markerPercent: overall == null ? null : markerPercentForOsi(overall),
      perMove: { move1: moveIndices[0], move2: moveIndices[1], move3: moveIndices[2] },
      operationalStrength, strategicStrength, integration, dispersion,
      dispersionLabel: dispersion == null ? "داده کافی ثبت نشده است" : dispersion <= .15 ? "جهت‌گیری نسبتاً پایدار" : dispersion <= .35 ? "جهت‌گیری وابسته به موقعیت" : "تغییر جهت محسوس میان مراحل",
      interpretation: interpretOrientationV3(overall, integration, dispersion),
    },
    scores: {
      informationSeeking: informationSeekingRaw == null ? null : informationSeekingRaw * 100,
      secondOrderThinking: profileScore((p) => .35*p.futureConsequenceThinking+.25*p.adversaryModeling+.20*p.reversibilityPreference+.20*p.resourceStewardship, "secondOrder"),
      adversaryModeling: profileScore((p) => p.adversaryModeling, "adversaryModeling"),
      escalationSensitivity: profileScore((p) => p.escalationSensitivity, "escalationSensitivity"),
      informationDiscipline: informationDisciplineParts.length ? (weightedMean(informationDisciplineParts) ?? 0) * 100 : null,
      evidenceResponsiveUpdating: evidenceUpdatingAudit.score,
      coalitionOrientation: coalition == null ? null : 50 * (coalition + 1),
      resourceStewardship: stewardshipBase == null ? null : 100 * clamp(stewardshipBase - resourcePenalty),
      planningForesight: profileScore((p) => .35*p.contingencyPlanning+.25*p.reversibilityPreference+.20*p.resourceStewardship+.20*p.futureConsequenceThinking, "planning"),
      multiDomainIntegration: multiDomain,
      riskPosture: risk,
      decisionCoherence,
    },
    dataCompleteness: { overall: completeness, components: { coreDecisionRecords, timingIntegrity, evidenceTelemetry, attributionEstimates: attributionCompleteness, reasonCapture } },
    timing: {
      medianActiveDecisionMs, iqrActiveDecisionMs: q1 == null || q3 == null ? null : q3 - q1,
      totalEvidenceDwellMs, longestDecision: sortedTimes.at(-1), shortestDecision: sortedTimes[0],
      totalRevisions: coreTelemetry.reduce((sum, item) => sum + (item?.optionChangeCount ?? 0), 0),
      revisedWindows: coreTelemetry.filter((item) => (item?.optionChangeCount ?? 0) > 0).length,
      firstToFinalChanges,
      evidenceTriggeredRevisionRate,
    },
    attribution: { evidenceAlignment, meanEvidenceAlignment: mean(evidenceAlignment.map((item) => item.score)), evidenceUpdatingAudit: evidenceUpdatingAudit.updates },
    responseProcess: { flags: responseFlags, activeFlags: activeResponseFlags, status: activeResponseFlags.length >= 2 ? "caution" : "normal" },
    perWindow,
    missingReasons: Object.entries({ coreDecisionRecords, timingIntegrity, evidenceTelemetry, attributionCompleteness, reasonCapture }).filter(([, value]) => value < 100).map(([key]) => key),
  };
};

export interface AttributionBrierResult {
  estimate: number;
  outcome: 0 | 1;
  brier: number;
  brierReference: number;
  brierSkillScore: number | null;
}

export const binaryAttributionOutcome = (truth: TrueIncidentAttribution): 0 | 1 =>
  truth === "non_red" ? 0 : 1;

export const calculateAttributionBrier = (
  estimate: number | undefined,
  truth: TrueIncidentAttribution
): AttributionBrierResult | null => {
  if (estimate == null) return null;
  const outcome = binaryAttributionOutcome(truth);
  const probability = clamp(estimate / 100);
  const brier = (probability - outcome) ** 2;
  const brierReference = (.5 - outcome) ** 2;
  return {
    estimate,
    outcome,
    brier,
    brierReference,
    brierSkillScore: brierReference > 0 ? 1 - brier / brierReference : null,
  };
};

/** @deprecated Player UI should display calculateAttributionBrier instead. */
export const calculateSingleEventAttributionAccuracy = (estimate: number | undefined, truth: TrueIncidentAttribution) => {
  const result = calculateAttributionBrier(estimate, truth);
  return result == null ? null : 100 * (1 - result.brier);
};

export interface ConstructDistributionSummaryV3 {
  mean: number;
  sd: number;
  min: number;
  max: number;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  floorRate: number;
  ceilingRate: number;
  warnings: string[];
}

export const simulateRandomCognitiveRunsV3 = (iterations = 100_000, initialSeed = 0x5a17) => {
  let seed = initialSeed >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const samples: Record<string, number[]> = {
    osi: [], integration: [], informationSeeking: [], secondOrderThinking: [], adversaryModeling: [],
    escalationSensitivity: [], informationDiscipline: [], evidenceResponsiveUpdating: [], coalitionOrientation: [],
    resourceStewardship: [], planningForesight: [], multiDomainIntegration: [], riskPosture: [],
  };
  for (let run = 0; run < iterations; run += 1) {
    const selectedByWindow = Object.fromEntries((Object.entries(COGNITIVE_WINDOWS_V3) as Array<[CoreDecisionWindowV3, string[]]>).map(([windowId, options]) => {
      const optionId = options[Math.floor(random() * options.length)];
      return [windowId, COGNITIVE_OPTION_PROFILES_V3[optionId]];
    })) as Record<CoreDecisionWindowV3, CognitiveOptionProfileV3>;
    const selected = Object.values(selectedByWindow);
    const moveValues = Object.values(CORE_WINDOWS_BY_MOVE).map((windows) => weightedMean(windows.map((windowId) => {
      const profile = selectedByWindow[windowId];
      return [adjustedOrientationForOption(windowId, profile.optionId), profile.diagnosticity.osi] as [number | null, number];
    }))!);
    samples.osi.push((moveValues[0] + moveValues[1] + moveValues[2]) / 3);
    const o = weightedMean(selected.map((p) => [p.operationalLoading, p.diagnosticity.osi]))! * 100;
    const s = weightedMean(selected.map((p) => [p.strategicLoading, p.diagnosticity.osi]))! * 100;
    samples.integration.push(harmonicIntegration(o, s));
    const selectedScore = (getter: (profile: CognitiveOptionProfileV3) => number, diagnostic: keyof CognitiveOptionProfileV3["diagnosticity"]) =>
      weightedMean(selected.map((profile) => [getter(profile), profile.diagnosticity[diagnostic]]))! * 100;
    samples.informationSeeking.push(mean([selectedByWindow.m1_information.informationSeeking, selectedByWindow.m2_investigation.informationSeeking])! * 100);
    samples.secondOrderThinking.push(selectedScore((p) => .35*p.futureConsequenceThinking+.25*p.adversaryModeling+.20*p.reversibilityPreference+.20*p.resourceStewardship, "secondOrder"));
    samples.adversaryModeling.push(selectedScore((p) => p.adversaryModeling, "adversaryModeling"));
    samples.escalationSensitivity.push(selectedScore((p) => p.escalationSensitivity, "escalationSensitivity"));
    samples.informationDiscipline.push(selectedScore((p) => p.informationDisciplineBase, "planning"));
    const evidenceStart = 10 + random() * 70;
    const evidenceMiddle = clamp((evidenceStart + (random() - .5) * 50) / 100) * 100;
    const evidenceEnd = clamp((evidenceMiddle + (random() - .5) * 50) / 100) * 100;
    const evidenceScore = calculateEvidenceUpdating([
      { phase: "m2_pre_investigation", playerEstimate: random() * 100, systemEvidenceConfidence: evidenceStart, recordedAt: "2026-01-01T00:00:00Z" },
      { phase: "m2_post_investigation", playerEstimate: random() * 100, systemEvidenceConfidence: evidenceMiddle, recordedAt: "2026-01-01T00:01:00Z" },
      { phase: "m3_final", playerEstimate: random() * 100, systemEvidenceConfidence: evidenceEnd, recordedAt: "2026-01-01T00:02:00Z" },
    ]);
    samples.evidenceResponsiveUpdating.push(evidenceScore ?? 0);
    const coalition = weightedMean((Object.entries(selectedByWindow) as Array<[CoreDecisionWindowV3, CognitiveOptionProfileV3]>).map(([windowId, profile]) => [adjustedProfileMetric(windowId, profile.optionId, "coalitionOrientation"), profile.diagnosticity.coalitionOrientation]))!;
    samples.coalitionOrientation.push(50 * (coalition + 1));
    samples.resourceStewardship.push(selectedScore((p) => .50*p.resourceStewardship+.30*p.contingencyPlanning+.20*p.reversibilityPreference, "resourceStewardship"));
    samples.planningForesight.push(selectedScore((p) => .35*p.contingencyPlanning+.25*p.reversibilityPreference+.20*p.resourceStewardship+.20*p.futureConsequenceThinking, "planning"));
    samples.multiDomainIntegration.push(selectedScore((profile) => {
      const values = [profile.domainMission, profile.domainInformation, profile.domainEscalation, profile.domainCoalition, profile.domainResources, profile.domainLegitimacy, profile.domainFutureOptions];
      return entropy(values, 7) * Math.min(1, values.reduce((sum, value) => sum + value, 0) / 3.5);
    }, "multiDomain"));
    const risk = weightedMean((Object.entries(selectedByWindow) as Array<[CoreDecisionWindowV3, CognitiveOptionProfileV3]>).map(([windowId, profile]) => [adjustedProfileMetric(windowId, profile.optionId, "riskExposure"), profile.diagnosticity.riskPosture]))!;
    samples.riskPosture.push(50 * (risk + 1));
  }
  const summarize = (values: number[], isOsi = false): ConstructDistributionSummaryV3 => {
    const p05 = percentile(values, .05)!; const p95 = percentile(values, .95)!;
    const floorLimit = isOsi ? -.8 : 10; const ceilingLimit = isOsi ? .8 : 90;
    const floorRate = values.filter((value) => value <= floorLimit).length / values.length;
    const ceilingRate = values.filter((value) => value >= ceilingLimit).length / values.length;
    const warnings: string[] = [];
    if (!isOsi && p95 - p05 < 20) warnings.push("low_discrimination");
    if (!isOsi && ceilingRate > .20) warnings.push("ceiling");
    const sd = populationDispersion(values)!;
    if (!isOsi && sd < 8) warnings.push("low_variance");
    return { mean: mean(values)!, sd, min: Math.min(...values), max: Math.max(...values), p05, p25: percentile(values,.25)!, p50: percentile(values,.50)!, p75: percentile(values,.75)!, p95, floorRate, ceilingRate, warnings };
  };
  const constructs = Object.fromEntries(Object.entries(samples).map(([key, values]) => [key, summarize(values, key === "osi")])) as Record<string, ConstructDistributionSummaryV3>;
  return {
    iterations,
    constructs,
    osi: constructs.osi,
    integration: constructs.integration,
    constructWarnings: Object.fromEntries(Object.entries(constructs).filter(([, summary]) => summary.warnings.length).map(([key, summary]) => [key, summary.warnings])),
    passed: Math.abs(constructs.osi.mean) < .02,
  };
};
