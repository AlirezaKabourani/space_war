import type { AllyAction, RedObservation, ScenarioOneState } from "../model/types";

export const resolveAllyActor = (
  state: ScenarioOneState,
  observation: RedObservation
): AllyAction => {
  const infoSharedScore = state.flags.sharedWithAlly ? 12 : 0;
  const observedBlueEscalation = observation.blueEscalationSignal;
  const evidenceWeaknessPenalty =
    state.knowledge.systemAttributionConfidence < 35 ? 12 : 0;
  const allySupportScore =
    state.hidden.allyTrust +
    infoSharedScore +
    state.visible.strategicLegitimacy -
    observedBlueEscalation -
    evidenceWeaknessPenalty;

  if (state.flags.publicWarningIssued && evidenceWeaknessPenalty > 0) {
    return allySupportScore < 105 ? "request_more_information" : "quiet_support";
  }
  if (allySupportScore >= 150 && state.flags.publicWarningIssued) return "public_support";
  if (allySupportScore >= 125) return "quiet_support";
  if (allySupportScore < 85 && observation.publicPressure > 0) return "distance_from_blue";
  if (allySupportScore < 105) return "request_more_information";
  return "no_action";
};
