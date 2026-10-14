import type {
  ActorObservableState,
  ActorVisibleSignals,
  EvidenceInstance,
  PlayerObservableState,
  PublicModelEvent,
  TrueWorldState,
} from "./types";

export function projectPlayerObservableState(
  trueState: TrueWorldState,
  visibleEvidence: readonly EvidenceInstance[],
  publicEvents: readonly PublicModelEvent[],
): PlayerObservableState {
  return {
    worldClockTick: trueState.worldClockTick,
    visibleEvidence: visibleEvidence.map(({ hiddenProvenance: _hiddenProvenance, ...visible }) => visible),
    publicEvents: publicEvents.map((event) => ({ ...event })),
  };
}

export function projectActorObservableState(
  trueState: TrueWorldState,
  actorVisibleSignals: ActorVisibleSignals,
  actorPublicEvents: readonly PublicModelEvent[],
): ActorObservableState {
  return {
    worldClockTick: trueState.worldClockTick,
    signals: {
      ...actorVisibleSignals,
      visibleRerouteCorridorIds: [...actorVisibleSignals.visibleRerouteCorridorIds],
    },
    publicEvents: actorPublicEvents.map((event) => ({ ...event })),
  };
}
