import type { ActorObservableState, ActorReaction, PressureBand, TrueWorldState } from "./types";
import { CANONICAL_CORRIDOR_IDS } from "./worldCatalog";

const decreasePressure = (pressure: PressureBand): PressureBand => {
  if (pressure === "high") return "medium";
  return "low";
};

const increasePressure = (pressure: PressureBand): PressureBand => {
  if (pressure === "low") return "medium";
  return "high";
};

export function resolveActorReaction(trueState: TrueWorldState, observable: ActorObservableState): ActorReaction {
  const actor = trueState.actorInternalState;
  const signals = observable.signals;

  switch (actor.profileId) {
    case "cautious_denial":
      if (signals.groundReconVisible || signals.containmentVisible) {
        return {
          reactionId: "cautious_relocate_reduce",
          ruleId: "CD-1",
          observationsUsed: [signals.groundReconVisible ? "groundReconVisible" : "containmentVisible"],
          statePatch: { posture: "covert", disruptionPressure: decreasePressure(actor.disruptionPressure), relocated: true },
          generatedEventKinds: ["actor_relocation_cue"],
        };
      }
      if (signals.fallbackActivated || signals.routeHardened) {
        return {
          reactionId: "cautious_hold_low",
          ruleId: "CD-2",
          observationsUsed: [signals.fallbackActivated ? "fallbackActivated" : "routeHardened"],
          statePatch: { disruptionPressure: "low" },
          generatedEventKinds: ["intermittent_disruption_continues"],
        };
      }
      return { reactionId: "cautious_maintain", ruleId: "CD-3", observationsUsed: [], statePatch: {}, generatedEventKinds: ["intermittent_disruption_continues"] };

    case "deceptive_diversion":
      if (signals.groundReconVisible || signals.containmentVisible) {
        return {
          reactionId: "deceptive_shift_pattern",
          ruleId: "DD-1",
          observationsUsed: [signals.groundReconVisible ? "groundReconVisible" : "containmentVisible"],
          statePatch: { posture: "probing", relocated: true, decoyCorridorId: actor.decoyCorridorId },
          generatedEventKinds: ["decoy_pattern_shift", "mixed_signal"],
        };
      }
      if (signals.networkCoverageWeak) {
        return {
          reactionId: "deceptive_strengthen_decoy",
          ruleId: "DD-2",
          observationsUsed: ["networkCoverageWeak"],
          statePatch: { disruptionPressure: "medium" },
          generatedEventKinds: ["decoy_signal_strengthened", "mixed_signal"],
        };
      }
      return { reactionId: "deceptive_maintain_mix", ruleId: "DD-3", observationsUsed: [], statePatch: {}, generatedEventKinds: ["mixed_signal"] };

    case "opportunistic_interdiction":
      if (signals.priorityConvoyConcentration && signals.leastProtectedCorridorId !== null) {
        const requested = signals.leastProtectedCorridorId;
        const secondaryCorridorId = requested === trueState.primaryAffectedCorridorId
          ? CANONICAL_CORRIDOR_IDS.find((corridorId) => corridorId !== trueState.primaryAffectedCorridorId)
          : requested;
        if (!secondaryCorridorId) throw new Error("No secondary corridor is available");
        return {
          reactionId: "opportunistic_secondary_pressure",
          ruleId: "OI-1",
          observationsUsed: ["priorityConvoyConcentration", "leastProtectedCorridorId"],
          statePatch: { posture: "committed", disruptionPressure: "high", riskBudget: Math.max(0, actor.riskBudget - 1) },
          generatedEventKinds: ["secondary_pressure", "primary_pressure_continues"],
          secondaryCorridorId,
        };
      }
      if (signals.networkCoverageWeak) {
        return {
          reactionId: "opportunistic_press_primary",
          ruleId: "OI-2",
          observationsUsed: ["networkCoverageWeak"],
          statePatch: { disruptionPressure: "high" },
          generatedEventKinds: ["primary_pressure_increases"],
        };
      }
      return { reactionId: "opportunistic_probe", ruleId: "OI-3", observationsUsed: [], statePatch: { disruptionPressure: "medium" }, generatedEventKinds: ["selective_disruption"] };

    case "pressure_escalator":
      if (actor.riskBudget === 0) {
        return {
          reactionId: "escalator_disengage",
          ruleId: "PE-1",
          observationsUsed: ["riskBudgetExhausted"],
          statePatch: { posture: "disengaging", disruptionPressure: "low" },
          generatedEventKinds: ["pressure_reduction"],
        };
      }
      if (signals.containmentVisible || signals.groundReconVisible || signals.executedResponseIntensity === "high") {
        return {
          reactionId: "escalator_increase_pressure",
          ruleId: "PE-2",
          observationsUsed: [
            signals.containmentVisible
              ? "containmentVisible"
              : signals.groundReconVisible
                ? "groundReconVisible"
                : "executedResponseIntensity:high",
          ],
          statePatch: {
            posture: "committed",
            disruptionPressure: increasePressure(actor.disruptionPressure),
            riskBudget: Math.max(0, actor.riskBudget - 1),
          },
          generatedEventKinds: ["persistent_pressure_increases"],
        };
      }
      if (signals.fallbackActivated && signals.routeHardened) {
        return {
          reactionId: "escalator_reduce_due_to_denial",
          ruleId: "PE-3",
          observationsUsed: ["fallbackActivated", "routeHardened"],
          statePatch: { posture: "probing", disruptionPressure: "low" },
          generatedEventKinds: ["pressure_reduction"],
        };
      }
      return {
        reactionId: "escalator_maintain",
        ruleId: "PE-4",
        observationsUsed: [],
        statePatch: { disruptionPressure: actor.disruptionPressure === "low" ? "medium" : actor.disruptionPressure },
        generatedEventKinds: ["persistent_disruption_continues"],
      };
  }
}
