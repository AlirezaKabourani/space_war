import type { ActorReactionId } from "../index";
import type { Scenario5EndState, Scenario5MissionState } from "./types";

export class UnclassifiedMissionStateError extends Error {
  constructor() {
    super("Mission state does not match any approved Scenario 5 end state");
    this.name = "UnclassifiedMissionStateError";
  }
}

const deliveredByHorizon = (state: Scenario5MissionState, corridorId: string): boolean => {
  const convoy = state.convoys.find((item) => item.corridorId === corridorId);
  if (!convoy) throw new Error(`Missing convoy for ${corridorId}`);
  return convoy.baselineArrivalMinute + convoy.delayMinutes <= 360 && convoy.integrity >= 55;
};

export function calculateNetworkContinuity(state: Scenario5MissionState): 0 | 25 | 50 | 75 | 100 {
  const count = state.convoys.filter(
    (convoy) => convoy.integrity >= 60 && convoy.baselineArrivalMinute + convoy.delayMinutes <= convoy.deadlineMinute,
  ).length;
  return (count * 25) as 0 | 25 | 50 | 75 | 100;
}

export function isThreatContained(state: Scenario5MissionState): boolean {
  const actor = state.trueWorldState.actorInternalState;
  const containingReactions: readonly ActorReactionId[] = [
    "cautious_relocate_reduce",
    "escalator_reduce_due_to_denial",
    "escalator_disengage",
  ];
  return actor.posture === "disengaging"
    || (actor.lastReactionId !== null && containingReactions.includes(actor.lastReactionId));
}

export function resolveMissionEndState(state: Scenario5MissionState): Scenario5EndState {
  const alpha = state.convoys.find(({ convoyId }) => convoyId === "alpha");
  if (!alpha) throw new Error("Alpha convoy is missing");
  const alphaDelivered = deliveredByHorizon(state, "corridor_alpha_east");
  const networkContinuityPercent = calculateNetworkContinuity(state);
  const threatContained = isThreatContained(state);

  if (
    alpha.integrity < 55
    || (!alphaDelivered && networkContinuityPercent < 75)
  ) {
    return {
      endStateId: "critical_cargo_lost_or_compromised",
      networkContinuityPercent,
      threatContained,
    };
  }

  if (alphaDelivered && networkContinuityPercent < 100) {
    return {
      endStateId: "priority_delivered_network_degradation",
      networkContinuityPercent,
      threatContained,
    };
  }

  if (
    !alphaDelivered
    && alpha.integrity >= 55
    && networkContinuityPercent >= 75
  ) {
    return {
      endStateId: "mission_incomplete_continuity_preserved",
      networkContinuityPercent,
      threatContained,
    };
  }

  if (
    alphaDelivered
    && networkContinuityPercent === 100
    && state.operationalAttributionStatus === "resolved"
    && !threatContained
  ) {
    return {
      endStateId: "delivery_complete_threat_persistent",
      networkContinuityPercent,
      threatContained,
    };
  }

  if (
    alphaDelivered
    && networkContinuityPercent === 100
    && state.operationalAttributionStatus === "unresolved"
  ) {
    return {
      endStateId: "delivery_complete_attribution_unresolved",
      networkContinuityPercent,
      threatContained,
    };
  }

  if (
    alphaDelivered
    && networkContinuityPercent === 100
    && state.operationalAttributionStatus === "resolved"
    && threatContained
  ) {
    return {
      endStateId: "delivery_complete_threat_contained",
      networkContinuityPercent,
      threatContained,
    };
  }

  throw new UnclassifiedMissionStateError();
}
