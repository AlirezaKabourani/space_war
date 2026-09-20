import { seededNoise, selectWeighted } from "./seededRandom.ts";
import { clampScenarioOneState, cloneState } from "../model/initialState.ts";
import type {
  AllyMove2Action,
  CommercialMove2Action,
  Move2IncidentCause,
  Move2Snapshot,
  RedMove2Action,
  RedObservationMove2,
  ScenarioOneDecisionRecord,
  ScenarioOneState,
} from "../model/types";

export interface Move2Choices {
  investigation: string;
  mission: string;
  response: string;
  reason: string;
}

const addEvidence = (state: ScenarioOneState, evidenceId: string) => {
  if (!state.knowledge.evidenceIds.includes(evidenceId)) {
    state.knowledge.evidenceIds.push(evidenceId);
  }
};

export const initializeMove2Incident = (
  state: ScenarioOneState,
  seed: string
): ScenarioOneState => {
  const next = cloneState(state);
  next.move = 2;
  if (next.hidden.move2IncidentCause && next.flags.m2IncidentInitialized) {
    return clampScenarioOneState(next);
  }

  const byIntent: Record<string, Array<{ value: Move2IncidentCause; weight: number }>> = {
    coercion: [
      { value: "red_reversible_interference", weight: 60 },
      { value: "mixed_cause", weight: 20 },
      { value: "technical_fault", weight: 10 },
      { value: "environmental_or_external", weight: 10 },
    ],
    probe: [
      { value: "red_reversible_interference", weight: 30 },
      { value: "mixed_cause", weight: 20 },
      { value: "technical_fault", weight: 25 },
      { value: "environmental_or_external", weight: 25 },
    ],
    intelligence_collection: [
      { value: "red_reversible_interference", weight: 25 },
      { value: "mixed_cause", weight: 20 },
      { value: "technical_fault", weight: 30 },
      { value: "environmental_or_external", weight: 25 },
    ],
    alliance_fracture: [
      { value: "red_reversible_interference", weight: 35 },
      { value: "mixed_cause", weight: 30 },
      { value: "technical_fault", weight: 15 },
      { value: "environmental_or_external", weight: 20 },
    ],
    benign_ambiguous: [
      { value: "red_reversible_interference", weight: 5 },
      { value: "mixed_cause", weight: 10 },
      { value: "technical_fault", weight: 45 },
      { value: "environmental_or_external", weight: 40 },
    ],
  };

  const cause = selectWeighted(
    `${seed}:move2:incident-cause`,
    byIntent[next.hidden.trueRedIntent]
  );
  next.hidden.move2IncidentCause = cause;
  next.hidden.trueIncidentAttribution =
    cause === "red_reversible_interference"
      ? "red"
      : cause === "mixed_cause"
        ? "mixed"
        : "non_red";
  next.flags.m2IncidentInitialized = true;
  next.visible.missionContinuity -= 8;
  next.visible.operationalReadiness -= 3;
  addEvidence(next, "E_M2_01");
  addEvidence(next, "E_M2_02");
  addEvidence(next, "E_M2_03");
  return clampScenarioOneState(next);
};

export const applyMove2Decision = (
  state: ScenarioOneState,
  windowId: "m2_investigation" | "m2_mission" | "m2_response",
  optionId: string,
  seed: string
) => {
  const next = cloneState(state);
  const cause = next.hidden.move2IncidentCause;
  const attributionIsRed = next.hidden.trueIncidentAttribution === "red";

  if (windowId === "m2_investigation") {
    if (optionId === "m2_a_technical_diagnostics") {
      next.resources.ssaCapacity -= 4;
      next.visible.situationAwareness += 9;
      next.visible.missionContinuity -= 1;
      next.knowledge.technicalFaultProbability =
        cause === "technical_fault" ? 70 : cause === "mixed_cause" ? 45 : 25;
      if (cause === "technical_fault") {
        next.knowledge.systemAttributionConfidence -= 10;
        addEvidence(next, "E_M2_TECH_STRONG");
      } else if (cause === "mixed_cause") {
        next.knowledge.systemAttributionConfidence += 3;
        addEvidence(next, "E_M2_TECH_MIXED");
      } else if (cause === "red_reversible_interference") {
        next.knowledge.systemAttributionConfidence += 1;
        addEvidence(next, "E_M2_TECH_INCONCLUSIVE");
      } else {
        next.knowledge.systemAttributionConfidence -= 5;
        addEvidence(next, "E_M2_TECH_INCONCLUSIVE");
      }
    }
    if (optionId === "m2_a_second_sensor") {
      next.resources.ssaCapacity -= 20;
      next.visible.situationAwareness += 16;
      next.visible.informationExposure += 3;
      next.flags.m2RapidValidationRequested = true;
      next.knowledge.systemAttributionConfidence +=
        6 +
        (cause === "red_reversible_interference"
          ? 8
          : cause === "mixed_cause"
            ? 4
            : cause === "technical_fault"
              ? -2
              : -3);
    }
    if (optionId === "m2_a_ally_intel") {
      next.resources.politicalCapital -= 8;
      next.resources.disclosureBudget -= 5;
      next.visible.coalitionCohesion += 3;
      next.visible.informationExposure += 4;
      next.visible.situationAwareness += next.hidden.allyTrust >= 60 ? 14 : 7;
      next.knowledge.systemAttributionConfidence +=
        next.hidden.trueIncidentAttribution === "red"
          ? 7
          : next.hidden.trueIncidentAttribution === "mixed"
            ? 3
            : -4;
      addEvidence(next, "E_M2_ALLY_01");
    }
    if (optionId === "m2_a_commercial_validation") {
      const result = selectWeighted(`${seed}:m2:commercial-validation`, [
        { value: "consistent", weight: 45 },
        { value: "ambiguous", weight: 35 },
        { value: "unavailable", weight: 20 },
      ]);
      next.resources.politicalCapital -= 3;
      next.resources.ssaCapacity -= 6;
      next.visible.situationAwareness += result === "unavailable" ? 5 : 10;
      next.knowledge.systemAttributionConfidence += attributionIsRed ? 4 : -2;
      if (result === "unavailable") next.flags.m2CommercialRestriction = true;
      addEvidence(next, "E_M2_COMM_01");
    }
    if (optionId === "m2_a_act_with_current_data") {
      next.visible.missionContinuity += 2;
    }
    if (next.resources.ssaCapacity < 45 || optionId === "m2_a_second_sensor") {
      next.flags.m2IntelDelay = true;
      next.visible.situationAwareness -= 3;
    }
  }

  if (windowId === "m2_mission") {
    if (optionId === "m2_m_continue_normal") {
      next.visible.missionContinuity += 4;
      next.visible.operationalReadiness -= 2;
    }
    if (optionId === "m2_m_activate_fallback") {
      next.resources.protectiveCapacity -= 18;
      next.visible.missionContinuity += 10;
      next.visible.operationalReadiness += 10;
      next.visible.informationExposure += 4;
      next.flags.m2FallbackActivated = true;
    }
    if (optionId === "m2_m_reduce_load") {
      next.resources.protectiveCapacity -= 5;
      next.visible.missionContinuity -= 5;
      next.visible.operationalReadiness += 8;
      next.visible.informationExposure += 1;
      next.flags.m2MissionLoadReduced = true;
    }
    if (optionId === "m2_m_protective_reconfiguration") {
      next.resources.protectiveCapacity -= 14;
      next.visible.missionContinuity += 3;
      next.visible.operationalReadiness += 14;
      next.visible.informationExposure += 7;
      next.visible.escalationPressure += 3;
    }
    if (optionId === "m2_m_split_service") {
      next.resources.protectiveCapacity -= 24;
      next.visible.missionContinuity += 12;
      next.visible.operationalReadiness += 12;
      next.visible.informationExposure += 6;
      next.flags.m2FallbackActivated = true;
    }
    if (
      next.flags.m2CommercialRestriction ||
      (next.flags.mediaInjectTriggered && next.hidden.commercialTrust < 75)
    ) {
      next.flags.m2CommercialRestriction = true;
      next.visible.situationAwareness -= 2;
    }
  }

  if (windowId === "m2_response") {
    if (optionId === "m2_r_no_counteraction") {
      next.visible.escalationPressure -= 1;
      next.visible.strategicLegitimacy += 1;
    }
    if (optionId === "m2_r_request_explanation") {
      next.resources.politicalCapital -= 5;
      next.visible.strategicLegitimacy += 5;
      next.visible.informationExposure += 2;
      next.flags.privateCommunication = true;
    }
    if (optionId === "m2_r_private_warning") {
      next.resources.politicalCapital -= 7;
      next.visible.escalationPressure += 2;
      next.visible.strategicLegitimacy += 4;
      next.visible.informationExposure += 4;
    }
    if (optionId === "m2_r_joint_allied_response") {
      next.resources.politicalCapital -= 14;
      next.resources.disclosureBudget -= 8;
      next.visible.coalitionCohesion += next.hidden.allyTrust < 45 ? 3 : 9;
      next.visible.strategicLegitimacy += 6;
      next.visible.informationExposure += 8;
      next.visible.escalationPressure += 4;
    }
    if (optionId === "m2_r_request_defensive_authority") {
      next.resources.politicalCapital -= 10;
      next.resources.protectiveCapacity -= 4;
      next.visible.operationalReadiness += 10;
      next.visible.escalationPressure += 5;
      next.visible.informationExposure += 5;
      next.flags.m2DefensiveAuthorityRequested = true;
    }
    if (optionId === "m2_r_deconfliction_offer") {
      next.resources.politicalCapital -= 9;
      next.visible.strategicLegitimacy += 9;
      next.visible.escalationPressure -= 5;
      next.visible.informationExposure += 3;
      next.flags.m2OffRampOfferedByBlue = true;
    }
  }

  return clampScenarioOneState(next);
};

export const buildMove2Observation = (choices: Move2Choices): RedObservationMove2 => {
  const observed: RedObservationMove2 = {
    visibleProtection: 0,
    blueResolveSignal: 0,
    blueEscalationSignal: 0,
    publicPressure: 0,
    privateCommunication: false,
    coalitionSignal: 0,
    fallbackVisible: 0,
    missionReconfigurationVisible: 0,
    formalAccusationLevel: 0,
    defensiveAuthoritySignal: 0,
    offRampSignal: 0,
  };

  if (choices.mission === "m2_m_activate_fallback" || choices.mission === "m2_m_split_service") {
    observed.fallbackVisible = 8;
    observed.missionReconfigurationVisible += 5;
  }
  if (choices.mission === "m2_m_protective_reconfiguration") {
    observed.visibleProtection = 10;
    observed.missionReconfigurationVisible += 10;
    observed.blueEscalationSignal += 3;
  }
  if (choices.response === "m2_r_request_explanation") {
    observed.blueResolveSignal += 4;
    observed.blueEscalationSignal -= 2;
    observed.privateCommunication = true;
  }
  if (choices.response === "m2_r_private_warning") {
    observed.blueResolveSignal += 12;
    observed.blueEscalationSignal += 4;
  }
  if (choices.response === "m2_r_joint_allied_response") {
    observed.blueResolveSignal += 12;
    observed.coalitionSignal += 14;
    observed.blueEscalationSignal += 5;
  }
  if (choices.response === "m2_r_request_defensive_authority") {
    observed.blueResolveSignal += 14;
    observed.blueEscalationSignal += 7;
    observed.defensiveAuthoritySignal += 12;
  }
  if (choices.response === "m2_r_deconfliction_offer") {
    observed.blueResolveSignal += 6;
    observed.blueEscalationSignal -= 8;
    observed.privateCommunication = true;
    observed.offRampSignal += 15;
  }
  return observed;
};

const resolveRedMove2 = (
  state: ScenarioOneState,
  observation: RedObservationMove2,
  choices: Move2Choices,
  seed: string
) => {
  const intent = state.hidden.trueRedIntent;
  const scores: Record<RedMove2Action, number> = {
    maintain_pressure: intent === "coercion" ? 0.8 : 0.2,
    reduce_proximity: intent === "benign_ambiguous" ? 0.6 : 0.15,
    introduce_second_asset: intent === "alliance_fracture" ? 0.55 : 0.25,
    continue_ambiguous_activity: intent === "intelligence_collection" ? 0.65 : 0.35,
    issue_denial: intent === "alliance_fracture" ? 0.7 : 0.25,
    offer_mutual_separation: intent === "benign_ambiguous" ? 0.75 : 0.15,
    pause_and_observe: intent === "probe" ? 0.55 : 0.25,
  };

  if (state.flags.redLearnedBlueThreshold && (intent === "probe" || intent === "coercion")) {
    scores.maintain_pressure += 0.25;
    scores.continue_ambiguous_activity += 0.2;
  }
  if (observation.offRampSignal > 0) {
    if (intent !== "coercion") {
      scores.offer_mutual_separation += 0.4;
      scores.reduce_proximity += 0.25;
    } else if (observation.blueResolveSignal > 12) {
      scores.maintain_pressure -= 0.2;
    }
  }
  if (observation.coalitionSignal > 10 && observation.blueResolveSignal > 10) {
    scores.reduce_proximity += 0.25;
    scores.pause_and_observe += 0.2;
  }
  if (observation.fallbackVisible > 0) scores.maintain_pressure -= 0.15;
  if (choices.response === "m2_r_no_counteraction" && intent === "coercion") {
    scores.maintain_pressure += 0.3;
  }
  if (state.knowledge.systemAttributionConfidence < 45 && observation.blueEscalationSignal > 5) {
    scores.issue_denial += intent === "alliance_fracture" ? 0.5 : 0.15;
  }

  for (const action of Object.keys(scores) as RedMove2Action[]) {
    scores[action] += seededNoise(seed, `m2:red:${intent}:${action}`);
  }
  return (Object.entries(scores) as Array<[RedMove2Action, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0][0];
};

const applyRedMove2 = (state: ScenarioOneState, action: RedMove2Action) => {
  const next = cloneState(state);
  if (action === "maintain_pressure") {
    next.visible.escalationPressure += 7;
    next.visible.situationAwareness += 2;
  }
  if (action === "reduce_proximity") next.visible.escalationPressure -= 4;
  if (action === "introduce_second_asset") {
    next.flags.m2SecondAssetObserved = true;
    next.visible.escalationPressure += 6;
    next.visible.situationAwareness += 4;
  }
  if (action === "continue_ambiguous_activity") {
    next.visible.escalationPressure += 5;
    if (!next.flags.m2FallbackActivated) next.visible.missionContinuity -= 3;
  }
  if (action === "issue_denial") {
    next.visible.escalationPressure -= 1;
    next.visible.strategicLegitimacy += next.knowledge.systemAttributionConfidence >= 45 ? 1 : -2;
  }
  if (action === "offer_mutual_separation") {
    next.flags.m2OffRampOfferedByRed = true;
    next.visible.escalationPressure -= 7;
    next.visible.strategicLegitimacy += 2;
  }
  if (action === "pause_and_observe") next.visible.escalationPressure -= 3;
  return clampScenarioOneState(next);
};

const resolveAllyMove2 = (
  state: ScenarioOneState,
  observation: RedObservationMove2
): AllyMove2Action => {
  if (
    observation.blueEscalationSignal > 6 &&
    state.knowledge.systemAttributionConfidence < 45 &&
    state.hidden.allyTrust < 60
  ) {
    return "reject_public_attribution";
  }
  if (observation.offRampSignal > 0) return "propose_deconfliction";
  if (observation.coalitionSignal > 8 && state.hidden.allyTrust >= 55) {
    return "support_joint_message";
  }
  if (state.hidden.allyTrust >= 65) return "quiet_support";
  if (state.flags.sharedWithAlly) return "share_partial_intel";
  return "request_more_evidence";
};

const applyAllyMove2 = (state: ScenarioOneState, action: AllyMove2Action) => {
  const next = cloneState(state);
  if (action === "support_joint_message") next.visible.coalitionCohesion += 7;
  if (action === "quiet_support") next.visible.coalitionCohesion += 4;
  if (action === "share_partial_intel") next.visible.situationAwareness += 3;
  if (action === "reject_public_attribution") {
    next.flags.m2CoalitionFriction = true;
    next.visible.coalitionCohesion -= 8;
    next.visible.strategicLegitimacy -= 3;
  }
  if (action === "propose_deconfliction") next.visible.escalationPressure -= 2;
  return clampScenarioOneState(next);
};

const resolveCommercialMove2 = (state: ScenarioOneState): CommercialMove2Action => {
  if (state.flags.m2CommercialRestriction) return "partial_data_only";
  if (state.flags.mediaInjectTriggered || state.visible.informationExposure > 45) {
    return "neutral_public_statement";
  }
  if (state.hidden.commercialTrust < 50) return "pause_sensitive_sharing";
  return "offer_followup_data";
};

const applyCommercialMove2 = (state: ScenarioOneState, action: CommercialMove2Action) => {
  const next = cloneState(state);
  if (action === "offer_followup_data") next.visible.situationAwareness += 2;
  if (action === "partial_data_only") next.visible.situationAwareness -= 1;
  if (action === "pause_sensitive_sharing") next.visible.situationAwareness -= 2;
  return clampScenarioOneState(next);
};

export const adjudicateMove2 = ({
  startedAt,
  stateBefore,
  stateAfterBlue,
  attributionEstimatePre,
  attributionEstimatePost,
  decisions,
  evidenceSeen,
  choices,
  rngSeed,
  previousMoveSnapshotRef,
}: {
  startedAt: string;
  stateBefore: ScenarioOneState;
  stateAfterBlue: ScenarioOneState;
  attributionEstimatePre: number;
  attributionEstimatePost: number;
  decisions: ScenarioOneDecisionRecord[];
  evidenceSeen: string[];
  choices: Move2Choices;
  rngSeed: string;
  previousMoveSnapshotRef: string;
}) => {
  const injects: string[] = [];
  const observed = buildMove2Observation(choices);
  let working = cloneState(stateAfterBlue);

  if (working.flags.m2IntelDelay) injects.push("m2_inject_2b_intelligence_delay");
  if (working.flags.m2CommercialRestriction) injects.push("m2_inject_2c_commercial_restriction");

  const redAction = resolveRedMove2(working, observed, choices, rngSeed);
  working = applyRedMove2(working, redAction);
  if (redAction === "offer_mutual_separation") injects.push("m2_inject_2d_red_offramp");

  const allyAction = resolveAllyMove2(working, observed);
  working = applyAllyMove2(working, allyAction);
  if (working.flags.m2CoalitionFriction) injects.push("m2_inject_2e_coalition_friction");

  const commercialAction = resolveCommercialMove2(working);
  working = applyCommercialMove2(working, commercialAction);
  working.move = 2;

  const snapshot: Move2Snapshot = {
    moveId: "move_2",
    startedAt,
    completedAt: new Date().toISOString(),
    stateBefore,
    stateAfter: clampScenarioOneState(working),
    attributionEstimatePre,
    attributionEstimatePost,
    decisions,
    evidenceSeen,
    redAction,
    allyAction,
    commercialAction,
    injectsTriggered: Array.from(new Set(injects)),
    actorObservations: { redObserved: observed },
    rngSeed,
    previousMoveSnapshotRef,
  };

  const update = [
    {
      title: "وضعیت A-17",
      text:
        snapshot.stateAfter.visible.missionContinuity >= 75
          ? "سرویس اصلی پایدار شده، اما علت افت قبلی هنوز قطعی نیست."
          : "سرویس A-17 ادامه دارد، اما کیفیت مأموریت هنوز تحت فشار است.",
    },
    {
      title: "وضعیت تداوم مأموریت",
      text: snapshot.stateAfter.flags.m2FallbackActivated
        ? "بخشی از بار به ظرفیت پشتیبان منتقل شده و وابستگی به A-17 کاهش یافته است."
        : "مأموریت هنوز عمدتاً به A-17 متکی است.",
    },
    {
      title: "ارزیابی علت حادثه",
      text:
        snapshot.stateAfter.knowledge.systemAttributionConfidence >= 55
          ? "شواهد احتمال مداخله خارجی را افزایش داده‌اند، اما انتساب قطعی هنوز شکل نگرفته است."
          : "شواهد همچنان چندفرضیه‌ای است و نقص داخلی یا عامل غیرخصمانه کاملاً رد نشده است.",
    },
    {
      title: "رفتار اسرائیل",
      text:
        redAction === "offer_mutual_separation"
          ? "اسرائیل مسیر فاصله‌گذاری متقابل را پیشنهاد داده است."
          : redAction === "introduce_second_asset"
            ? "یک دارایی دیگر اسرائیل در محیط عملیاتی مشاهده شده است."
            : "اسرائیل همچنان در محیط عملیاتی حضور دارد و رفتار آن قابل تفسیر چندگانه است.",
    },
    {
      title: "وضعیت ائتلاف",
      text:
        allyAction === "reject_public_attribution"
          ? "متحد درباره انتساب قطعی احتیاط کرده و اصطکاک ائتلافی ایجاد شده است."
          : "مسیر هماهنگی با متحدان باز مانده، اما حمایت مکانیکی یا نامحدود نیست.",
    },
    {
      title: "محیط تجاری/رسانه‌ای",
      text:
        commercialAction === "partial_data_only" || commercialAction === "pause_sensitive_sharing"
          ? "دسترسی تجاری به داده‌های دقیق‌تر محدود شده است."
          : "محیط تجاری هنوز امکان داده تکمیلی محدود را حفظ کرده است.",
    },
    {
      title: "منابع باقی‌مانده",
      text: "مصرف منابع Move 1 و Move 2 در وضعیت بعدی حفظ شده و به Move 3 منتقل می‌شود.",
    },
    {
      title: "ارزیابی انتقال به Move 3",
      text: "بحران اکنون حول آستانه اقدام در شرایط انتساب ناقص شکل گرفته است.",
    },
  ];

  return { snapshot, situationUpdate: update };
};
