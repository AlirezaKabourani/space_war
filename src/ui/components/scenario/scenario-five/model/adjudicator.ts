import { resolveActorReaction } from "./actorModel";
import { materializeEvidence } from "./evidenceModel";
import { projectActorObservableState, projectPlayerObservableState } from "./projections";
import type {
  AdjudicationInput,
  AdjudicationResult,
  ModelEventSource,
  Scenario5ModelEvent,
  Scenario5ModelEventKind,
  TrueWorldState,
} from "./types";

export function adjudicateModelStep(input: AdjudicationInput): AdjudicationResult {
  const tick = input.trueState.worldClockTick + 1;
  let sequence = input.trueState.eventSequence;
  const events: Scenario5ModelEvent[] = [];
  let lastEventId: string | null = null;

  const emit = (
    eventKind: Scenario5ModelEventKind,
    source: ModelEventSource,
    payload: Readonly<Record<string, unknown>>,
  ): void => {
    sequence += 1;
    const eventId = `${input.trueState.worldId}:t${tick}:e${sequence}`;
    const causeEventId = lastEventId ?? eventId;
    events.push({ eventId, causeEventId, eventKind, worldClockTick: tick, source, payload });
    lastEventId = eventId;
  };

  emit("decision_confirmed", "player", { decisionIntent: input.decisionIntent });
  if ((input.userCostKinds?.length ?? 0) > 0) {
    emit("user_cost_registered", "player", { costKinds: [...(input.userCostKinds ?? [])] });
  }
  emit("world_clock_advanced", "world", { fromTick: input.trueState.worldClockTick, toTick: tick });
  if ((input.worldTransitionKinds?.length ?? 0) > 0) {
    emit("world_transition_registered", "world", { transitionKinds: [...(input.worldTransitionKinds ?? [])] });
  }
  if ((input.playerVisibleSignalKinds?.length ?? 0) > 0) {
    emit("player_visible_signal_derived", "world", { signalKinds: [...(input.playerVisibleSignalKinds ?? [])] });
  }
  emit("actor_visible_signal_derived", "world", { signals: input.actorVisibleSignals });

  const stateAtTick: TrueWorldState = { ...input.trueState, worldClockTick: tick };
  const actorObservableState = projectActorObservableState(
    stateAtTick,
    input.actorVisibleSignals,
    input.actorPublicEvents ?? [],
  );
  const actorReaction = resolveActorReaction(stateAtTick, actorObservableState);
  emit("actor_reaction_resolved", "actor", {
    reactionId: actorReaction.reactionId,
    ruleId: actorReaction.ruleId,
    generatedEventKinds: actorReaction.generatedEventKinds,
    ...(actorReaction.secondaryCorridorId ? { secondaryCorridorId: actorReaction.secondaryCorridorId } : {}),
  });

  if ((input.conditionalInjectKinds?.length ?? 0) > 0) {
    emit("conditional_inject_registered", "world", { injectKinds: [...(input.conditionalInjectKinds ?? [])] });
  }
  const generatedEvidence = (input.evidenceRequests ?? []).flatMap((request) => materializeEvidence(stateAtTick, request));
  if (generatedEvidence.length > 0) {
    emit("evidence_generated", "evidence_engine", { evidenceIds: generatedEvidence.map(({ evidenceId }) => evidenceId) });
  }

  const nextTrueState: TrueWorldState = {
    ...stateAtTick,
    actorInternalState: {
      ...stateAtTick.actorInternalState,
      ...actorReaction.statePatch,
      profileId: stateAtTick.actorInternalState.profileId,
      objective: stateAtTick.actorInternalState.objective,
      riskBudget: Math.max(0, actorReaction.statePatch.riskBudget ?? stateAtTick.actorInternalState.riskBudget),
      lastReactionId: actorReaction.reactionId,
    },
    eventSequence: sequence + 1,
  };
  const allVisibleEvidence = [...input.visibleEvidence, ...generatedEvidence];
  const playerObservableState = projectPlayerObservableState(
    nextTrueState,
    allVisibleEvidence,
    input.playerPublicEvents ?? [],
  );
  emit("observable_state_updated", "world", {
    visibleEvidenceIds: playerObservableState.visibleEvidence.map(({ evidenceId }) => evidenceId),
  });

  return {
    trueState: { ...nextTrueState, eventSequence: sequence },
    events,
    generatedEvidence,
    actorReaction,
    playerObservableState,
    actorObservableState,
  };
}
