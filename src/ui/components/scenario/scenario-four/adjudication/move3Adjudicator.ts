import { seededNoise } from "./seededRandom.ts";
import { clampScenarioOneState, cloneState } from "../model/initialState.ts";
import type {
  AllyFinalAction,
  FinalBlueObservation,
  FinalEndState,
  FinalMetrics,
  Move2Snapshot,
  Move3ImpactSeverity,
  Move3Snapshot,
  MoveSnapshot,
  RedMove3Action,
  ScenarioOneDecisionRecord,
  ScenarioOneFinalSnapshot,
  ScenarioOneState,
} from "../model/types";

export interface Move3Choices {
  threshold: string;
  coa: string;
  informationPolicy: string;
  offRamp?: string;
  reason: string;
}

const scoreClamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const initializeMove3Severity = (
  state: ScenarioOneState,
  previousMove2: Move2Snapshot,
  seed: string
): ScenarioOneState => {
  const next = cloneState(state);
  next.move = 3;
  if (next.hidden.move3ImpactSeverity) return clampScenarioOneState(next);

  let severityIndex = 1;
  if (previousMove2.redAction === "maintain_pressure" && next.hidden.trueIncidentAttribution === "red") {
    severityIndex += 1;
  }
  if (next.flags.m2FallbackActivated) severityIndex -= 1;
  if (next.visible.operationalReadiness >= 75) severityIndex -= 1;
  if (next.resources.protectiveCapacity < 25) severityIndex += 1;
  if (next.hidden.trueIncidentAttribution === "non_red" && seededNoise(seed, "m3:non-red-severity", 0.5) > 0.25) {
    severityIndex += 1;
  }
  const severity: Move3ImpactSeverity =
    severityIndex <= 0 ? "limited" : severityIndex >= 2 ? "severe" : "significant";
  next.hidden.move3ImpactSeverity = severity;
  next.visible.missionContinuity -= severity === "limited" ? 4 : severity === "significant" ? 9 : 15;
  next.visible.operationalReadiness -= severity === "severe" ? 5 : 2;
  return clampScenarioOneState(next);
};

export const buildConfidencePackage = (state: ScenarioOneState) => {
  const confidence = state.knowledge.systemAttributionConfidence;
  return [
    {
      source: "Military SSA",
      status: "تحلیلی",
      confidence: confidence >= 60 ? "بالا" : confidence >= 40 ? "متوسط" : "پایین",
      finding:
        confidence >= 60
          ? "هم‌بستگی رفتاری و زمانی قابل توجه است، اما نیت قطعی از آن استخراج نمی‌شود."
          : confidence >= 40
            ? "هم‌بستگی متوسط دیده می‌شود و برای انتساب قطعی کافی نیست."
            : "هم‌بستگی موجود محدود و چندتعبیری است.",
      sensitivity: "اشتراک‌پذیری محدود",
    },
    {
      source: "Technical Team",
      status: "ناکامل",
      confidence:
        state.knowledge.technicalFaultProbability && state.knowledge.technicalFaultProbability > 55
          ? "بالا"
          : "متوسط",
      finding:
        state.knowledge.technicalFaultProbability && state.knowledge.technicalFaultProbability > 55
          ? "نقص داخلی همچنان یک توضیح جدی است."
          : "نقص داخلی کاملاً رد نشده، اما تنها توضیح موجود نیست.",
      sensitivity: "داخلی",
    },
    {
      source: "Ally Intelligence",
      status: state.knowledge.evidenceIds.includes("E_M2_ALLY_01") ? "تحلیلی" : "ناکامل",
      confidence: state.hidden.allyTrust >= 65 ? "متوسط" : "پایین",
      finding: state.knowledge.evidenceIds.includes("E_M2_ALLY_01")
        ? "داده متحد برای تصویر کلی مفید است، اما حمایت قطعی از یک روایت واحد نمی‌دهد."
        : "داده متحد کافی در دسترس نیست یا هنوز قابل اتکا نشده است.",
      sensitivity: "حساس برای ائتلاف",
    },
    {
      source: "Commercial Data",
      status: state.knowledge.evidenceIds.includes("E_M2_COMM_01") ? "ناکامل" : "در دسترس نیست",
      confidence: state.flags.m2CommercialRestriction ? "پایین" : "متوسط",
      finding: state.flags.m2CommercialRestriction
        ? "بخشی از داده دقیق‌تر به دلیل حساسیت تجاری محدود شده است."
        : "داده تجاری می‌تواند مقایسه مستقل بدهد، اما به‌تنهایی انتساب را اثبات نمی‌کند.",
      sensitivity: "اشتراک محدود",
    },
  ];
};

export const applyMove3Decision = (
  state: ScenarioOneState,
  windowId: "m3_threshold" | "m3_coa" | "m3_info" | "m3_offramp",
  optionId: string
) => {
  const next = cloneState(state);
  if (windowId === "m3_coa") {
    if (optionId === "m3_coa_contain_understand") {
      next.resources.ssaCapacity -= 8;
      next.resources.protectiveCapacity -= 6;
      next.visible.situationAwareness += 7;
      next.visible.escalationPressure -= 4;
      next.visible.strategicLegitimacy += 4;
      next.visible.missionContinuity += 2;
    }
    if (optionId === "m3_coa_controlled_deterrence") {
      next.resources.protectiveCapacity -= 16;
      next.resources.politicalCapital -= 8;
      next.visible.operationalReadiness += 12;
      next.visible.missionContinuity += 4;
      next.visible.escalationPressure += 5;
      next.visible.strategicLegitimacy += 4;
      next.visible.informationExposure += 5;
    }
    if (optionId === "m3_coa_coordinated_response") {
      next.resources.politicalCapital -= 18;
      next.resources.disclosureBudget -= 12;
      next.resources.protectiveCapacity -= 8;
      next.visible.coalitionCohesion += next.flags.m2CoalitionFriction ? 4 : 12;
      next.visible.strategicLegitimacy += 8;
      next.visible.informationExposure += 10;
      next.visible.escalationPressure += 5;
      next.visible.missionContinuity += 3;
    }
    if (optionId === "m3_coa_negotiated_deescalation") {
      next.resources.politicalCapital -= 12;
      next.visible.strategicLegitimacy += 10;
      next.visible.escalationPressure -= 10;
      next.visible.missionContinuity += 2;
      next.flags.m3NegotiatedOffRamp = true;
    }
    if (optionId === "m3_coa_unilateral_strong") {
      next.resources.protectiveCapacity -= 22;
      next.resources.politicalCapital -= 15;
      next.visible.operationalReadiness += 16;
      next.visible.missionContinuity += 3;
      next.visible.escalationPressure += 14;
      next.visible.informationExposure += 12;
    }
  }

  if (windowId === "m3_info") {
    const confidence = next.knowledge.systemAttributionConfidence;
    if (optionId === "m3_info_keep_restricted") {
      next.visible.informationExposure -= 3;
      next.visible.strategicLegitimacy -= next.flags.mediaInjectTriggered ? 1 : 0;
    }
    if (optionId === "m3_info_share_allies") {
      next.resources.disclosureBudget -= 8;
      next.visible.coalitionCohesion += next.hidden.allyTrust < 50 ? 3 : 8;
      next.visible.informationExposure += 5;
      next.visible.strategicLegitimacy += 3;
    }
    if (optionId === "m3_info_public_partial") {
      next.resources.disclosureBudget -= 12;
      next.resources.politicalCapital -= 5;
      next.visible.informationExposure += 12;
      next.visible.escalationPressure += 4;
      next.visible.strategicLegitimacy += confidence >= 60 ? 8 : confidence >= 40 ? 3 : -6;
      next.visible.coalitionCohesion += next.flags.m2CoalitionFriction ? -2 : 2;
    }
    if (optionId === "m3_info_public_attribution") {
      next.resources.disclosureBudget -= 18;
      next.resources.politicalCapital -= 8;
      next.visible.informationExposure += 18;
      next.visible.escalationPressure += 10;
      next.visible.strategicLegitimacy += confidence >= 70 ? 10 : confidence >= 50 ? 2 : -12;
      next.visible.coalitionCohesion += next.flags.m2CoalitionFriction ? -10 : 6;
      next.flags.m3PublicAttribution = true;
    }
  }

  if (windowId === "m3_offramp") {
    if (optionId === "accept_as_interim") {
      next.visible.escalationPressure -= 6;
      next.visible.strategicLegitimacy += 4;
    }
    if (optionId === "renegotiate_terms") {
      next.visible.escalationPressure -= 3;
      next.resources.politicalCapital -= 4;
    }
    if (optionId === "keep_channel_open_no_commitment") next.visible.escalationPressure -= 1;
    if (optionId === "reject") {
      next.visible.escalationPressure += 4;
      next.hidden.redPerceptionBlueResolve += 4;
    }
  }
  return clampScenarioOneState(next);
};

export const buildFinalObservation = (choices: Move3Choices, state: ScenarioOneState): FinalBlueObservation => {
  const observation: FinalBlueObservation = {
    visibleProtection: 0,
    blueResolveSignal: 0,
    blueEscalationSignal: 0,
    publicPressure: 0,
    privateCommunication: false,
    coalitionSignal: 0,
    fallbackVisible: state.flags.m2FallbackActivated ? 8 : 0,
    missionReconfigurationVisible: 0,
    formalAccusationLevel: 0,
    defensiveAuthoritySignal: state.flags.m2DefensiveAuthorityRequested ? 8 : 0,
    offRampSignal: 0,
    finalResolveSignal: 0,
    finalEscalationSignal: 0,
    coalitionUnitySignal: 0,
    publicAttributionLevel: 0,
    missionResilienceSignal: state.flags.m2FallbackActivated ? 12 : 4,
  };

  if (choices.coa === "m3_coa_controlled_deterrence") {
    observation.finalResolveSignal += 16;
    observation.finalEscalationSignal += 7;
  }
  if (choices.coa === "m3_coa_coordinated_response") {
    observation.finalResolveSignal += 14;
    observation.coalitionUnitySignal += 18;
    observation.finalEscalationSignal += 6;
  }
  if (choices.coa === "m3_coa_negotiated_deescalation") {
    observation.finalResolveSignal += 5;
    observation.finalEscalationSignal -= 12;
    observation.offRampSignal += 15;
  }
  if (choices.coa === "m3_coa_unilateral_strong") {
    observation.finalResolveSignal += 24;
    observation.finalEscalationSignal += 18;
  }
  if (choices.informationPolicy === "m3_info_public_partial") {
    observation.publicPressure += 8;
    observation.publicAttributionLevel = 60;
  }
  if (choices.informationPolicy === "m3_info_public_attribution") {
    observation.publicPressure += 15;
    observation.publicAttributionLevel = 100;
    observation.formalAccusationLevel = 100;
  }
  if (choices.offRamp && choices.offRamp !== "reject") observation.offRampSignal += 8;
  observation.blueResolveSignal = observation.finalResolveSignal;
  observation.blueEscalationSignal = observation.finalEscalationSignal;
  observation.coalitionSignal = observation.coalitionUnitySignal;
  return observation;
};

const resolveRedMove3 = (
  state: ScenarioOneState,
  observation: FinalBlueObservation,
  choices: Move3Choices,
  seed: string
) => {
  const intent = state.hidden.trueRedIntent;
  const scores: Record<RedMove3Action, number> = {
    deescalate_and_separate: intent === "benign_ambiguous" ? 0.85 : 0.25,
    accept_interim_offramp: observation.offRampSignal > 0 ? 0.45 : 0,
    maintain_ambiguous_pressure: intent === "probe" ? 0.55 : 0.25,
    deny_and_hold: intent === "benign_ambiguous" ? 0.65 : 0.35,
    increase_non_destructive_pressure: intent === "coercion" ? 0.8 : 0.15,
    exploit_coalition_friction: intent === "alliance_fracture" ? 0.85 : 0.1,
    pause_for_assessment: intent === "intelligence_collection" ? 0.55 : 0.25,
  };
  if (intent === "probe" && observation.finalResolveSignal > 12 && observation.finalEscalationSignal < 10) {
    scores.deescalate_and_separate += 0.25;
    scores.pause_for_assessment += 0.2;
  }
  if (intent === "coercion" && observation.missionResilienceSignal > 8 && observation.coalitionUnitySignal > 10) {
    scores.increase_non_destructive_pressure -= 0.35;
    scores.deescalate_and_separate += 0.2;
  }
  if (state.flags.m2CoalitionFriction || state.visible.coalitionCohesion < 45) {
    scores.exploit_coalition_friction += intent === "alliance_fracture" ? 0.35 : 0.1;
  }
  if (observation.publicAttributionLevel > state.knowledge.systemAttributionConfidence + 30) {
    scores.deny_and_hold += 0.35;
    scores.exploit_coalition_friction += 0.25;
  }
  if (choices.offRamp === "accept_as_interim" || choices.coa === "m3_coa_negotiated_deescalation") {
    scores.accept_interim_offramp += intent === "coercion" ? 0.05 : 0.35;
  }
  for (const action of Object.keys(scores) as RedMove3Action[]) {
    scores[action] += seededNoise(seed, `m3:red:${intent}:${action}`);
  }
  return (Object.entries(scores) as Array<[RedMove3Action, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0][0];
};

const applyRedFinal = (state: ScenarioOneState, action: RedMove3Action) => {
  const next = cloneState(state);
  if (action === "deescalate_and_separate") next.visible.escalationPressure -= 10;
  if (action === "accept_interim_offramp") {
    next.visible.escalationPressure -= 12;
    next.visible.strategicLegitimacy += 3;
  }
  if (action === "maintain_ambiguous_pressure") {
    next.visible.escalationPressure += 6;
    if (!next.flags.m2FallbackActivated) next.visible.missionContinuity -= 4;
  }
  if (action === "deny_and_hold") next.visible.escalationPressure -= 1;
  if (action === "increase_non_destructive_pressure") {
    next.visible.escalationPressure += 12;
    next.visible.missionContinuity -= next.flags.m2FallbackActivated ? 2 : 7;
  }
  if (action === "exploit_coalition_friction") {
    next.visible.coalitionCohesion -= 8;
    next.visible.strategicLegitimacy -= 4;
  }
  if (action === "pause_for_assessment") next.visible.escalationPressure -= 4;
  return clampScenarioOneState(next);
};

const resolveAllyFinal = (state: ScenarioOneState, choices: Move3Choices): AllyFinalAction => {
  if (choices.informationPolicy === "m3_info_public_attribution" && state.knowledge.systemAttributionConfidence < 55) {
    return "distance_from_public_claim";
  }
  if (choices.coa === "m3_coa_negotiated_deescalation") return "support_deconfliction";
  if (choices.coa === "m3_coa_coordinated_response" && state.hidden.allyTrust >= 55) {
    return "support_controlled_response";
  }
  if (state.visible.escalationPressure > 65) return "request_restraint";
  return "quiet_support";
};

const applyAllyFinal = (state: ScenarioOneState, action: AllyFinalAction) => {
  const next = cloneState(state);
  if (action === "support_controlled_response") next.visible.coalitionCohesion += 8;
  if (action === "support_deconfliction") {
    next.visible.coalitionCohesion += 5;
    next.visible.escalationPressure -= 2;
  }
  if (action === "request_restraint") next.visible.escalationPressure -= 1;
  if (action === "distance_from_public_claim") {
    next.visible.coalitionCohesion -= 10;
    next.visible.strategicLegitimacy -= 5;
  }
  if (action === "quiet_support") next.visible.coalitionCohesion += 2;
  return clampScenarioOneState(next);
};

const computeMetrics = (
  state: ScenarioOneState,
  choices: Move3Choices,
  redAction: RedMove3Action
): FinalMetrics => {
  const claimLevel =
    choices.informationPolicy === "m3_info_public_attribution"
      ? 100
      : choices.informationPolicy === "m3_info_public_partial"
        ? 60
        : choices.informationPolicy === "m3_info_share_allies"
          ? 25
          : 0;
  const evidence = state.knowledge.systemAttributionConfidence;
  const overclaimGap = Math.max(0, claimLevel - evidence);
  const hiddenTruthTarget = state.hidden.trueIncidentAttribution === "red" ? 90 : state.hidden.trueIncidentAttribution === "mixed" ? 55 : 10;
  const playerFinal = state.knowledge.playerAttributionEstimateFinal ?? 50;
  const thresholdCoherence =
    choices.threshold === "m3_t_insufficient" && choices.coa === "m3_coa_unilateral_strong"
      ? 35
      : choices.threshold === "m3_t_sufficient_limited" && choices.coa === "m3_coa_controlled_deterrence"
        ? 85
        : choices.threshold === "m3_t_sufficient_strong" && choices.informationPolicy === "m3_info_public_attribution"
          ? 75
          : 65;
  const resourceValues = Object.values(state.resources);
  const totalResourceSpent = Math.max(0, 400 - resourceValues.reduce((sum, value) => sum + value, 0));
  const protectedMissionValue = state.visible.missionContinuity * 0.75 + state.visible.operationalReadiness * 0.25;
  const missionBenefitPerCost = scoreClamp((protectedMissionValue / Math.max(35, totalResourceSpent)) * 100);
  const reserveAtCriticalMoment = scoreClamp(resourceValues.reduce((sum, value) => sum + value, 0) / resourceValues.length);
  const avoidedExhaustion = resourceValues.filter((value) => value >= 20).length * 25;
  const recoveryUtilization = state.flags.m2MissionLoadReduced || state.flags.m2FallbackActivated ? 75 : 50;
  const resourceEfficiency = scoreClamp(
    missionBenefitPerCost * 0.4 +
      reserveAtCriticalMoment * 0.25 +
      avoidedExhaustion * 0.2 +
      recoveryUtilization * 0.15
  );
  return {
    missionOutcomeScore: scoreClamp(state.visible.missionContinuity + (state.flags.m2FallbackActivated ? 8 : 0)),
    informationQualityScore: scoreClamp(state.visible.situationAwareness + evidence * 0.2),
    escalationControlScore: scoreClamp(100 - state.visible.escalationPressure + (redAction.includes("offramp") ? 8 : 0)),
    coalitionOutcomeScore: scoreClamp(state.visible.coalitionCohesion),
    resourceSustainabilityScore: resourceEfficiency,
    informationDisciplineScore: scoreClamp(100 - overclaimGap - state.visible.informationExposure * 0.25),
    strategicLegitimacyScore: scoreClamp(state.visible.strategicLegitimacy),
    resilienceScore: scoreClamp(state.visible.operationalReadiness + (state.flags.m2FallbackActivated ? 12 : 0)),
    reversibilityScore: scoreClamp(
      choices.coa === "m3_coa_negotiated_deescalation" || choices.offRamp ? 82 : choices.coa === "m3_coa_unilateral_strong" ? 35 : 65
    ),
    decisionCoherenceScore: scoreClamp(thresholdCoherence),
    attributionCalibrationScore: scoreClamp(100 - Math.abs(playerFinal - hiddenTruthTarget)),
  };
};

export interface FinalEndStateContext {
  state: ScenarioOneState;
  metrics: FinalMetrics;
  redAction: RedMove3Action;
  choices: Move3Choices;
}

export const resolvePrimaryEndState = ({
  state,
  metrics,
  redAction,
  choices,
}: FinalEndStateContext): { primary: FinalEndState; tags: string[] } => {
  const tags: string[] = [];
  if (state.visible.coalitionCohesion < 45) tags.push("coalition_risk");
  if (state.visible.escalationPressure > 65) tags.push("escalation_risk");
  if (metrics.informationDisciplineScore < 45) tags.push("information_discipline_risk");
  const reciprocalDeescalation = redAction === "deescalate_and_separate" || redAction === "accept_interim_offramp" || Boolean(state.flags.m3ReciprocalDeescalation);
  const actualOffRampProposal = Boolean(
    state.flags.m2OffRampOfferedByBlue ||
    state.flags.m2OffRampOfferedByRed ||
    state.flags.m3NegotiatedOffRamp ||
    (choices.offRamp && choices.offRamp !== "reject") ||
    choices.coa === "m3_coa_negotiated_deescalation"
  );
  const severeEscalation = state.visible.escalationPressure >= 75;
  const strongMisattribution = state.flags.m3PublicAttribution &&
    state.hidden.trueIncidentAttribution === "non_red" &&
    metrics.informationDisciplineScore < 55;
  const missionPreserved = state.visible.missionContinuity >= 55;
  const attributionUnresolved = state.knowledge.systemAttributionConfidence < 55;

  if (severeEscalation) return { primary: "escalation_spiral", tags };
  if (
    strongMisattribution
  ) {
    return { primary: "intelligence_failure", tags };
  }
  if (state.visible.coalitionCohesion < 35) return { primary: "coalition_fracture", tags };
  if (actualOffRampProposal && reciprocalDeescalation && missionPreserved) {
    return { primary: "negotiated_deescalation", tags };
  }
  if (
    metrics.missionOutcomeScore >= 75 &&
    metrics.escalationControlScore >= 70 &&
    metrics.coalitionOutcomeScore >= 60 &&
    reciprocalDeescalation
  ) {
    return { primary: "calm_crisis_control", tags };
  }
  if (redAction === "deescalate_and_separate" && state.visible.informationExposure > 45) {
    return { primary: "costly_deterrence", tags };
  }
  if (
    missionPreserved &&
    attributionUnresolved &&
    ["maintain_ambiguous_pressure", "deny_and_hold", "pause_for_assessment"].includes(redAction)
  ) {
    return { primary: "persistent_ambiguity", tags };
  }
  if (metrics.informationQualityScore >= 70 && metrics.escalationControlScore >= 55) {
    return { primary: "strategic_information_opportunity", tags };
  }
  if (attributionUnresolved) return { primary: "persistent_ambiguity", tags };
  return { primary: "mixed_crisis_containment", tags };
};

export const getEndStateExplanation = (context: FinalEndStateContext, endState?: FinalEndState) => {
  const primary = endState ?? resolvePrimaryEndState(context).primary;
  const explanations: Record<FinalEndState, string> = {
    calm_crisis_control: "مأموریت و انسجام حفظ شد، فشار تشدید کنترل ماند و اسرائیل نیز عملاً از مسیر فشار فاصله گرفت.",
    costly_deterrence: "فاصله‌گیری اسرائیل حاصل شد، اما هزینه منابع یا افشای اطلاعات برای ایران بالا بود.",
    persistent_ambiguity: "مأموریت حفظ شد، اما انتساب همچنان حل‌نشده و رفتار اسرائیل چندتعبیری باقی ماند.",
    coalition_fracture: "کاهش شدید انسجام متحدان، امکان اقدام هماهنگ را محدود کرد.",
    escalation_spiral: "فشار تشدید به سطح شدید رسید و واکنش اسرائیل نیز مسیر بحران را تندتر کرد.",
    intelligence_failure: "ادعای عمومی فراتر از شواهد با حقیقت رخداد سازگار نبود و بر نتیجه غلبه کرد.",
    negotiated_deescalation: "یک مسیر کاهش تنش واقعاً پیشنهاد شد و با پذیرش یا فاصله‌گذاری متقابل اسرائیل همراه بود.",
    strategic_information_opportunity: "کنترل نسبی بحران همراه با شناخت بهتر، امکان بهره‌برداری اطلاعاتی بعدی ایجاد کرد.",
    mixed_crisis_containment: "بخشی از اهداف حفظ شد، اما نتیجه در مأموریت، تشدید یا انسجام کاملاً مطلوب نبود.",
  };
  return explanations[primary];
};

const endStateLabel: Record<FinalEndState, string> = {
  calm_crisis_control: "مهار آرام بحران",
  costly_deterrence: "بازدارندگی پرهزینه",
  persistent_ambiguity: "ابهام پایدار",
  coalition_fracture: "شکاف ائتلافی",
  escalation_spiral: "مارپیچ تشدید",
  intelligence_failure: "شکست اطلاعاتی",
  negotiated_deescalation: "کاهش تنش مذاکره‌شده",
  strategic_information_opportunity: "فرصت اطلاعاتی راهبردی",
  mixed_crisis_containment: "مهار نسبی بحران",
};

export const adjudicateMove3 = ({
  runId,
  scenarioId,
  runSeed,
  move1,
  move2,
  startedAt,
  stateBefore,
  stateAfterBlue,
  playerAttributionEstimateFinal,
  choices,
  decisions,
  evidenceSeen,
  rngSeed,
}: {
  runId: string;
  scenarioId: string;
  runSeed: string;
  move1: MoveSnapshot;
  move2: Move2Snapshot;
  startedAt: string;
  stateBefore: ScenarioOneState;
  stateAfterBlue: ScenarioOneState;
  playerAttributionEstimateFinal: number;
  choices: Move3Choices;
  decisions: ScenarioOneDecisionRecord[];
  evidenceSeen: string[];
  rngSeed: string;
}) => {
  const observed = buildFinalObservation(choices, stateAfterBlue);
  const redAction = resolveRedMove3(stateAfterBlue, observed, choices, rngSeed);
  let working = applyRedFinal(stateAfterBlue, redAction);
  const allyAction = resolveAllyFinal(working, choices);
  working = applyAllyFinal(working, allyAction);
  const commercialAction =
    choices.informationPolicy.includes("public") ? "public_attention_expands" : "commercial_posture_neutral";
  working.move = 3;
  working.knowledge.playerAttributionEstimateFinal = playerAttributionEstimateFinal;
  const finalState = clampScenarioOneState(working);
  const metrics = computeMetrics(finalState, choices, redAction);
  const finalContext: FinalEndStateContext = { state: finalState, metrics, redAction, choices };
  const endState = resolvePrimaryEndState(finalContext);
  const endStateExplanation = getEndStateExplanation(finalContext, endState.primary);

  const move3: Move3Snapshot = {
    moveId: "move_3",
    startedAt,
    completedAt: new Date().toISOString(),
    stateBefore,
    stateAfter: finalState,
    playerAttributionEstimateFinal,
    actionThresholdChoice: choices.threshold,
    crisisCoa: choices.coa,
    informationPolicy: choices.informationPolicy,
    offRampChoice: choices.offRamp,
    decisions,
    evidenceSeen,
    redAction,
    allyAction,
    commercialAction,
    injectsTriggered: redAction === "accept_interim_offramp" ? ["m3_offramp_reciprocated"] : [],
    finalObservableSignal: observed,
    rngSeed,
  };

  const playerFacingReport = [
    {
      title: "مسیر بحران",
      text: "بحران از رفتار مداری مبهم شروع شد، در Move 2 به افت سرویس با انتساب نامطمئن رسید و در Move 3 به تصمیم درباره آستانه اقدام تبدیل شد.",
    },
    {
      title: "وضعیت مأموریت",
      text:
        finalState.visible.missionContinuity >= 70
          ? "مأموریت اصلی حفظ شده و تاب‌آوری قابل قبول باقی مانده است."
          : "مأموریت ادامه دارد، اما بخشی از کیفیت یا ظرفیت آن تحت فشار است.",
    },
    {
      title: "تحول شناخت",
      text: `برآوردهای شما درباره احتمال نقش اسرائیل از ${move2.attributionEstimatePre} به ${move2.attributionEstimatePost} و سپس ${playerAttributionEstimateFinal} رسید.`,
    },
    {
      title: "End State",
      text: `${endStateLabel[endState.primary]}: ${endStateExplanation}`,
    },
  ];

  const finalSnapshot: ScenarioOneFinalSnapshot = {
    runId,
    scenarioId,
    runSeed,
    move1,
    move2,
    move3,
    finalState,
    primaryEndState: endState.primary,
    secondaryOutcomeTags: endState.tags,
    finalMetrics: metrics,
    playerFacingReport,
    hiddenAarData: {
      trueRedIntent: finalState.hidden.trueRedIntent,
      trueIncidentAttribution: finalState.hidden.trueIncidentAttribution,
      move2IncidentCause: finalState.hidden.move2IncidentCause,
      redPerceptionTimeline: [
        move1.actorObservations.redObserved,
        move2.actorObservations.redObserved,
        observed,
      ],
      evidenceTruthMap: {
        trueIncidentAttribution: finalState.hidden.trueIncidentAttribution,
        move2IncidentCause: finalState.hidden.move2IncidentCause,
      },
    },
    completedAt: new Date().toISOString(),
  };

  return { move3, finalSnapshot, playerFacingReport };
};
