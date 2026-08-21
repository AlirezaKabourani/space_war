import { createSeededRandom } from "./seededRandom";
import { resolveAllyActor } from "../actors/allyActor";
import { resolveCommercialActor } from "../actors/commercialActor";
import { resolveRedActor } from "../actors/redActor";
import { clampScenarioOneState, cloneState } from "../model/initialState";
import type {
  AllyAction,
  CommercialAction,
  MoveSnapshot,
  RedMove1Action,
  RedObservation,
  ScenarioOneDecisionRecord,
  ScenarioOneState,
} from "../model/types";

export interface MoveOneChoices {
  information: string;
  protection: string;
  communication: string;
  reason: string;
}

export interface AdjudicationResult {
  snapshot: MoveSnapshot;
  redScores: Record<RedMove1Action, number>;
  situationUpdate: Array<{ title: string; text: string }>;
}

const addEvidence = (state: ScenarioOneState, evidenceId: string) => {
  if (!state.knowledge.evidenceIds.includes(evidenceId)) {
    state.knowledge.evidenceIds.push(evidenceId);
  }
};

export const applyBlueDecision = (
  state: ScenarioOneState,
  windowId: "m1_information" | "m1_protection" | "m1_communication",
  optionId: string,
  seed: string
) => {
  const next = cloneState(state);
  const random = createSeededRandom(`${seed}:${windowId}:${optionId}`);

  if (windowId === "m1_information") {
    if (optionId === "m1_i_passive") next.visible.situationAwareness += 3;
    if (optionId === "m1_i_dedicated_ssa") {
      next.resources.ssaCapacity -= 18;
      next.visible.situationAwareness += 15;
      next.visible.informationExposure += 2;
      next.knowledge.systemAttributionConfidence += 8;
      addEvidence(next, "E_SSA_01");
    }
    if (optionId === "m1_i_commercial") {
      next.resources.ssaCapacity -= 8;
      next.resources.politicalCapital -= 2;
      next.visible.situationAwareness += 12;
      next.knowledge.systemAttributionConfidence += 5;
      next.hidden.commercialTrust += 3;
      if (random() >= 0.8) {
        next.flags.conflictingCommercialData = true;
        addEvidence(next, "E_COMM_CONFLICT_01");
      }
    }
    if (optionId === "m1_i_allied_network") {
      next.resources.politicalCapital -= 8;
      next.resources.disclosureBudget -= 6;
      next.visible.situationAwareness += 14;
      next.visible.coalitionCohesion += 4;
      next.visible.informationExposure += 5;
      next.knowledge.systemAttributionConfidence += 6;
      next.hidden.allyTrust += 5;
      next.flags.sharedWithAlly = true;
    }
  }

  if (windowId === "m1_protection") {
    if (optionId === "m1_p_hold") next.visible.missionContinuity += 1;
    if (optionId === "m1_p_covert_readiness") {
      next.resources.protectiveCapacity -= 10;
      next.visible.operationalReadiness += 14;
      next.visible.informationExposure += 1;
      next.visible.escalationPressure += 1;
    }
    if (optionId === "m1_p_visible_protection") {
      next.resources.protectiveCapacity -= 18;
      next.visible.operationalReadiness += 18;
      next.visible.missionContinuity -= 3;
      next.visible.informationExposure += 10;
      next.visible.escalationPressure += 7;
      next.flags.visibleProtectionUsed = true;
    }
    if (optionId === "m1_p_mission_reposition") {
      next.resources.protectiveCapacity -= 28;
      next.visible.operationalReadiness += 24;
      next.visible.missionContinuity -= 12;
      next.visible.informationExposure += 18;
      next.visible.escalationPressure += 12;
      next.flags.visibleProtectionUsed = true;
    }
  }

  if (windowId === "m1_communication") {
    if (optionId === "m1_c_private") {
      next.resources.politicalCapital -= 5;
      next.visible.strategicLegitimacy += 5;
      next.visible.escalationPressure -= 3;
      next.visible.informationExposure += 2;
      next.flags.privateCommunication = true;
    }
    if (optionId === "m1_c_allies") {
      next.resources.politicalCapital -= 10;
      next.resources.disclosureBudget -= 8;
      next.visible.coalitionCohesion += next.flags.sharedWithAlly ? 12 : 8;
      next.visible.strategicLegitimacy += 4;
      next.visible.informationExposure += 7;
      if (next.flags.sharedWithAlly) next.hidden.allyTrust += 6;
    }
    if (optionId === "m1_c_public_warning") {
      next.resources.politicalCapital -= 6;
      next.visible.strategicLegitimacy += 3;
      next.visible.escalationPressure += 10;
      next.visible.informationExposure += 10;
      next.flags.publicWarningIssued = true;
      if (next.knowledge.systemAttributionConfidence < 35) {
        next.hidden.allyTrust -= 6;
        next.visible.strategicLegitimacy -= 4;
      }
    }
    if (optionId === "m1_c_private_allied") {
      next.resources.politicalCapital -= 12;
      next.resources.disclosureBudget -= 5;
      next.visible.coalitionCohesion += 7;
      next.visible.strategicLegitimacy += 7;
      next.visible.escalationPressure -= 2;
      next.visible.informationExposure += 4;
      next.hidden.allyTrust += 5;
      next.flags.privateCommunication = true;
    }
  }

  return clampScenarioOneState(next);
};

export const buildRedObservation = (choices: MoveOneChoices): RedObservation => {
  const observation: RedObservation = {
    visibleProtection: 0,
    blueResolveSignal: 0,
    blueEscalationSignal: 0,
    publicPressure: 0,
    privateCommunication: false,
    coalitionSignal: 0,
  };

  if (choices.protection === "m1_p_visible_protection") {
    observation.visibleProtection = 12;
    observation.blueResolveSignal += 15;
    observation.blueEscalationSignal += 8;
  }
  if (choices.protection === "m1_p_mission_reposition") {
    observation.visibleProtection = 20;
    observation.blueResolveSignal += 22;
    observation.blueEscalationSignal += 16;
  }
  if (choices.communication === "m1_c_private") {
    observation.blueResolveSignal += 5;
    observation.blueEscalationSignal -= 4;
    observation.privateCommunication = true;
  }
  if (choices.communication === "m1_c_allies") observation.coalitionSignal += 12;
  if (choices.communication === "m1_c_public_warning") {
    observation.blueResolveSignal += 12;
    observation.blueEscalationSignal += 10;
    observation.publicPressure += 10;
  }
  if (choices.communication === "m1_c_private_allied") {
    observation.blueResolveSignal += 7;
    observation.blueEscalationSignal -= 2;
    observation.coalitionSignal += 8;
    observation.privateCommunication = true;
  }
  return observation;
};

const resolveBlueCausedInjects = (
  state: ScenarioOneState,
  choices: MoveOneChoices,
  observation: RedObservation,
  seed: string
) => {
  const next = cloneState(state);
  const injects: string[] = [];
  if (next.flags.conflictingCommercialData) {
    injects.push("m1_inject_1a_conflicting_data");
    next.visible.situationAwareness += 2;
  }
  if (
    !next.flags.sharedWithAlly &&
    (observation.visibleProtection >= 20 || observation.publicPressure > 0)
  ) {
    injects.push("m1_inject_1b_ally_request");
    next.visible.coalitionCohesion -= 3;
  }

  const mediaRandom = createSeededRandom(`${seed}:inject:media`);
  const mediaProbability =
    choices.communication === "m1_c_public_warning"
      ? 1
      : next.flags.visibleProtectionUsed
        ? 0.35
        : 0;
  if (mediaProbability > 0 && mediaRandom() <= mediaProbability) {
    injects.push("m1_inject_1c_media");
    next.flags.mediaInjectTriggered = true;
    next.visible.escalationPressure += 4;
    next.visible.strategicLegitimacy +=
      next.knowledge.systemAttributionConfidence >= 35 &&
      choices.communication !== "m1_c_public_warning"
        ? 1
        : -2;
  }
  return { state: clampScenarioOneState(next), injects };
};

const applyRedConsequences = (
  state: ScenarioOneState,
  action: RedMove1Action
): ScenarioOneState => {
  const next = cloneState(state);
  if (action === "continue_approach") {
    next.visible.escalationPressure += 6;
    next.visible.situationAwareness += 2;
  }
  if (action === "slow_approach") {
    next.visible.escalationPressure += 2;
    next.visible.situationAwareness += 3;
  }
  if (action === "hold_position") next.visible.escalationPressure -= 2;
  if (action === "send_routine_explanation") next.visible.escalationPressure -= 4;
  if (action === "break_off") {
    next.visible.escalationPressure -= 8;
    next.visible.missionContinuity += 2;
    if (next.hidden.trueRedIntent === "probe") {
      next.flags.redLearnedBlueThreshold = true;
    }
  }
  return clampScenarioOneState(next);
};

const applyAllyConsequences = (
  state: ScenarioOneState,
  action: AllyAction
): ScenarioOneState => {
  const next = cloneState(state);
  if (action === "quiet_support") {
    next.visible.coalitionCohesion += 4;
    next.hidden.allyTrust += 3;
  }
  if (action === "public_support") {
    next.visible.coalitionCohesion += 7;
    next.visible.strategicLegitimacy += 3;
  }
  if (action === "request_more_information") next.visible.coalitionCohesion -= 1;
  if (action === "distance_from_blue") {
    next.visible.coalitionCohesion -= 7;
    next.visible.strategicLegitimacy -= 3;
    next.hidden.allyTrust -= 5;
  }
  return clampScenarioOneState(next);
};

const applyCommercialConsequences = (
  state: ScenarioOneState,
  action: CommercialAction
): ScenarioOneState => {
  const next = cloneState(state);
  if (action === "offer_followup_data") next.visible.situationAwareness += 2;
  if (action === "warn_about_public_release") {
    next.visible.informationExposure += 2;
    next.visible.strategicLegitimacy -= 1;
  }
  return clampScenarioOneState(next);
};

const generateSituationUpdate = (
  state: ScenarioOneState,
  redAction: RedMove1Action,
  allyAction: AllyAction,
  commercialAction: CommercialAction
) => [
  {
    title: "وضعیت مأموریت",
    text:
      state.visible.missionContinuity >= 80
        ? "A-17 بدون اختلال به فعالیت خود ادامه می‌دهد و مأموریت در وضعیت بسیار پایدار باقی مانده است."
        : "A-17 به فعالیت خود ادامه می‌دهد، اما بخشی از انعطاف عملیاتی مأموریت تحت فشار قرار گرفته است.",
  },
  {
    title: "رفتار R-31",
    text:
      redAction === "continue_approach"
        ? "روند نزدیکی ادامه دارد و هنوز نشانه قطعی از اقدام خصمانه ثبت نشده است."
        : redAction === "slow_approach"
          ? "نرخ نزدیک‌شدن کاهش یافته، اما دارایی از محدوده خارج نشده است."
          : redAction === "hold_position"
            ? "موقعیت نسبی R-31 تثبیت شده و حرکت تازه‌ای دیده نمی‌شود."
            : redAction === "send_routine_explanation"
              ? "اپراتور R-31 رفتار فعلی را بخشی از مأموریت عادی اعلام کرده است."
              : "R-31 فاصله خود را افزایش داده، اما علت تصمیم آن هنوز قطعی نیست.",
  },
  {
    title: "تصویر اطلاعاتی",
    text:
      state.visible.situationAwareness >= 50
        ? "داده‌های تازه تصویر دقیق‌تری از حرکت ساخته‌اند، اما نیت عملیات همچنان نامشخص است."
        : "اطلاعات موجود هنوز محدود است و برای انتساب نیت کافی نیست.",
  },
  {
    title: "وضعیت ائتلاف",
    text:
      allyAction === "quiet_support" || allyAction === "public_support"
        ? "متحد منطقه‌ای از ادامه هماهنگی حمایت کرده و مسیر تبادل اطلاعات باز مانده است."
        : allyAction === "distance_from_blue"
          ? "متحد منطقه‌ای با احتیاط بیشتری عمل می‌کند و از موضع Blue فاصله گرفته است."
          : allyAction === "request_more_information"
            ? "متحد منطقه‌ای درخواست داده تکمیلی کرده و منتظر روشن‌تر شدن شواهد است."
            : "وضعیت ائتلاف تغییر عمده‌ای نشان نمی‌دهد.",
  },
  {
    title: "محیط عمومی / تجاری",
    text:
      state.flags.mediaInjectTriggered
        ? "منابع رسانه‌ای از افزایش تنش مداری خبر داده‌اند، بدون اینکه اقدام خصمانه‌ای تأیید شده باشد."
        : commercialAction === "offer_followup_data"
          ? "اپراتور تجاری برای داده تکمیلی اعلام آمادگی کرده است."
          : "بحران هنوز توجه گسترده رسانه‌ای یا تجاری پیدا نکرده است.",
  },
  {
    title: "ارزیابی",
    text: "هیچ اقدام خصمانه‌ای به‌طور قطعی تأیید نشده و عدم قطعیت برای Move 2 باقی است.",
  },
];

export const adjudicateMoveOne = ({
  startedAt,
  stateBefore,
  stateAfterBlue,
  decisions,
  evidenceSeen,
  choices,
  rngSeed,
}: {
  startedAt: string;
  stateBefore: ScenarioOneState;
  stateAfterBlue: ScenarioOneState;
  decisions: ScenarioOneDecisionRecord[];
  evidenceSeen: string[];
  choices: MoveOneChoices;
  rngSeed: string;
}): AdjudicationResult => {
  const redObserved = buildRedObservation(choices);
  const blueInjects = resolveBlueCausedInjects(
    stateAfterBlue,
    choices,
    redObserved,
    rngSeed
  );
  const red = resolveRedActor({
    state: blueInjects.state,
    observation: redObserved,
    seed: rngSeed,
  });
  const afterRed = applyRedConsequences(blueInjects.state, red.selectedAction);
  const allyAction = resolveAllyActor(afterRed, redObserved);
  const afterAlly = applyAllyConsequences(afterRed, allyAction);
  const commercialAction = resolveCommercialActor(afterAlly);
  const stateAfter = applyCommercialConsequences(afterAlly, commercialAction);

  const snapshot: MoveSnapshot = {
    moveId: "move_1",
    startedAt,
    completedAt: new Date().toISOString(),
    stateBefore,
    stateAfter,
    decisions,
    evidenceSeen,
    redAction: red.selectedAction,
    allyAction,
    commercialAction,
    injectsTriggered: blueInjects.injects,
    actorObservations: { redObserved },
    rngSeed,
  };

  return {
    snapshot,
    redScores: red.candidateUtilityScores,
    situationUpdate: generateSituationUpdate(
      stateAfter,
      red.selectedAction,
      allyAction,
      commercialAction
    ),
  };
};
