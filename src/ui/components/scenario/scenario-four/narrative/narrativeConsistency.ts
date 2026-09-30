import { ACTOR_ACTION_IDS, ACTOR_REACTION_COPY_FA, END_STATE_NARRATIVES_FA, INJECT_NARRATIVES_FA } from "./narrativeCatalogFa.ts";
import type { NarrativeSection, Scenario4NarrativeContext } from "./narrativeTypes.ts";

export interface NarrativeConsistencyIssue {
  code: string;
  narrativeId: string;
  message: string;
}

const allySupportActions = new Set([
  "quiet_support",
  "public_support",
  "support_joint_message",
  "support_controlled_response",
  "support_deconfliction",
]);

const separationActions = new Set([
  "break_off",
  "reduce_proximity",
  "deescalate_and_separate",
  "accept_interim_offramp",
]);

export const validateNarrativeConsistency = (
  ctx: Scenario4NarrativeContext,
  sections: readonly NarrativeSection[],
  sceneEndStateId?: string
): NarrativeConsistencyIssue[] => {
  const issues: NarrativeConsistencyIssue[] = [];
  const add = (code: string, item: NarrativeSection, message: string) =>
    issues.push({ code, narrativeId: item.id, message });

  for (const item of sections) {
    if ((item.body.includes("یک دارایی دیگر اسرائیل") || item.body.includes("یک دارایی دیگر متعلق به اسرائیل")) &&
      ctx.israel.currentAction !== "introduce_second_asset" &&
      !ctx.flags.m2SecondAssetObserved) {
      add("invented_second_asset", item, "Second asset was narrated without the resolved action or visible flag.");
    }
    if ((item.body.includes("فاصله را افزایش") || item.body.includes("فاصله گرفته")) &&
      !separationActions.has(ctx.israel.currentAction ?? "") &&
      !ctx.israel.previousActions.some((action) => separationActions.has(action))) {
      add("invented_separation", item, "Separation was narrated without a matching Israel action.");
    }
    if ((item.body.includes("پذیرش کاهش تنش") || item.body.includes("کاهش تنش را پذیرفته")) &&
      ctx.israel.currentAction !== "accept_interim_offramp" &&
      !ctx.injects.activeIds.includes("m3_offramp_reciprocated")) {
      add("invented_reciprocity", item, "Reciprocal de-escalation was narrated without actual acceptance.");
    }
    if ((item.body.includes("پیام عمومی ایران") || item.body.includes("ادعای عمومی ایران")) &&
      !ctx.flags.m3PublicAttribution &&
      !ctx.flags.publicWarningIssued) {
      add("invented_public_signal", item, "A public Iranian signal was narrated without a public flag.");
    }
    if (item.body.includes("حمایت") &&
      (item.body.includes("متحدان") || item.body.includes("متحد منطقه‌ای")) &&
      !allySupportActions.has(ctx.ally.currentAction ?? "")) {
      add("invented_ally_support", item, "Ally support was narrated without a supporting ally action.");
    }
  }

  if (sceneEndStateId && ctx.endState && sceneEndStateId !== ctx.endState.id) {
    issues.push({
      code: "scene_end_state_mismatch",
      narrativeId: "scene.caption",
      message: `Scene end state ${sceneEndStateId} does not match narrative end state ${ctx.endState.id}.`,
    });
  }
  return issues;
};

export const getNarrativeCoverageIssues = (): string[] => {
  const issues: string[] = [];
  for (const [actor, actions] of Object.entries(ACTOR_ACTION_IDS)) {
    for (const action of actions) {
      if (!ACTOR_REACTION_COPY_FA[`${actor}:${action}`]) issues.push(`actor:${actor}:${action}`);
    }
  }
  const requiredInjects = [
    "m1_inject_1a_conflicting_data",
    "m1_inject_1b_ally_request",
    "m1_inject_1c_media",
    "m2_inject_2b_intelligence_delay",
    "m2_inject_2c_commercial_restriction",
    "m2_inject_2d_red_offramp",
    "m2_inject_2e_coalition_friction",
    "m3_offramp_reciprocated",
  ];
  for (const inject of requiredInjects) {
    if (!INJECT_NARRATIVES_FA[inject]) issues.push(`inject:${inject}`);
  }
  if (Object.keys(END_STATE_NARRATIVES_FA).length !== 9) issues.push("end_states:expected_9");
  return issues;
};
