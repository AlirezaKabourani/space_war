import type {
  DecisionTelemetryV3,
  Move2Snapshot,
  Move3Snapshot,
  MoveSnapshot,
  ScenarioOneDecisionRecord,
  ScenarioOneFinalSnapshot,
  ScenarioOneState,
} from "../model/types";
import { END_STATE_LABELS_FA } from "./narrativeCatalogFa.ts";
import type {
  Scenario4AarNarrativeContext,
  Scenario4NarrativeContext,
  Scenario4NarrativePhase,
} from "./narrativeTypes.ts";

export interface BuildNarrativeContextInput {
  runId: string;
  phase: Scenario4NarrativePhase;
  state: ScenarioOneState;
  move?: 1 | 2 | 3;
  move1?: MoveSnapshot | null;
  move2?: Move2Snapshot | null;
  move3?: Move3Snapshot | null;
  finalSnapshot?: ScenarioOneFinalSnapshot | null;
  decisions?: readonly ScenarioOneDecisionRecord[];
  telemetry?: readonly DecisionTelemetryV3[];
  openedEvidenceIds?: readonly string[];
}

const unique = (values: readonly (string | undefined)[]) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const collectDecisions = (input: BuildNarrativeContextInput) => {
  const records = [
    ...(input.move1?.decisions ?? []),
    ...(input.move2?.decisions ?? []),
    ...(input.move3?.decisions ?? []),
    ...(input.decisions ?? []),
  ];
  const decisions: Record<string, string | undefined> = {};
  const reasons: Record<string, string | undefined> = {};
  for (const record of records) {
    decisions[record.windowId] = record.selectedOptionId;
    if (record.windowId.endsWith("_reason")) reasons[record.moveId] = record.selectedOptionId;
  }
  const resourceEvents = records.flatMap((record) => record.resourceEvents ?? []);
  return { decisions, reasons, resourceEvents };
};

const signalIdsFromObservation = (observation?: Record<string, unknown>) => {
  if (!observation) return [];
  const signals: string[] = [];
  for (const [key, value] of Object.entries(observation)) {
    if (typeof value === "boolean" && value) signals.push(key);
    if (typeof value === "number" && value > 0) signals.push(key);
  }
  return signals;
};

const currentSnapshots = (input: BuildNarrativeContextInput) => {
  const move = input.move ?? input.state.move;
  if (move === 3) return { current: input.move3 ?? undefined, prior: [input.move1, input.move2] };
  if (move === 2) return { current: input.move2 ?? undefined, prior: [input.move1] };
  if (move === 1) return { current: input.move1 ?? undefined, prior: [] };
  return { current: undefined, prior: [] };
};

/**
 * Builds the player-safe, read-only narrative projection. Deliberately never reads
 * state.hidden or finalSnapshot.hiddenAarData.
 */
export const buildNarrativeContext = (input: BuildNarrativeContextInput): Scenario4NarrativeContext => {
  const { decisions, reasons, resourceEvents } = collectDecisions(input);
  const { current, prior } = currentSnapshots(input);
  const currentObservation = current && "actorObservations" in current
    ? current.actorObservations.redObserved as unknown as Record<string, unknown>
    : current && "finalObservableSignal" in current
      ? current.finalObservableSignal as unknown as Record<string, unknown>
      : undefined;
  const currentInjects = current?.injectsTriggered ?? [];
  const openedFromTelemetry = (input.telemetry ?? []).flatMap((item) => item.evidenceOpenedIds);
  const openedFromSnapshots = [input.move1, input.move2, input.move3]
    .flatMap((item) => item?.evidenceSeen ?? []);
  const endStateId = input.finalSnapshot?.primaryEndState;
  const iranSignals = unique([
    input.state.flags.privateCommunication ? "private_communication" : undefined,
    input.state.flags.publicWarningIssued ? "public_warning" : undefined,
    input.state.flags.m3PublicAttribution ? "public_attribution" : undefined,
    input.state.flags.m2FallbackActivated ? "fallback_active" : undefined,
    input.state.flags.m3NegotiatedOffRamp ? "offramp_proposed" : undefined,
  ]);

  return {
    runId: input.runId,
    phase: input.phase,
    move: input.move ?? input.state.move,
    iran: {
      decisions: Object.freeze({ ...decisions }),
      reasons: Object.freeze({ ...reasons }),
      attributionEstimates: Object.freeze({
        pre: input.move2?.attributionEstimatePre ?? input.state.knowledge.playerAttributionEstimatePreMove2,
        post: input.move2?.attributionEstimatePost ?? input.state.knowledge.playerAttributionEstimatePostMove2,
        final: input.move3?.playerAttributionEstimateFinal ?? input.state.knowledge.playerAttributionEstimateFinal,
      }),
      resources: Object.freeze({ ...input.state.resources }),
      resourceEvents: Object.freeze([...resourceEvents]),
      observableSignals: Object.freeze(iranSignals),
    },
    israel: {
      observedSignals: Object.freeze(signalIdsFromObservation(currentObservation)),
      currentAction: current?.redAction,
      previousActions: Object.freeze(unique(prior.map((item) => item?.redAction))),
    },
    ally: { currentAction: current?.allyAction },
    commercial: { currentAction: current?.commercialAction },
    evidence: {
      availableIds: Object.freeze([...input.state.knowledge.evidenceIds]),
      openedIds: Object.freeze(unique([
        ...(input.openedEvidenceIds ?? []),
        ...openedFromTelemetry,
        ...openedFromSnapshots,
      ])),
      visibleConfidence: input.state.knowledge.systemAttributionConfidence,
    },
    injects: { activeIds: Object.freeze([...currentInjects]) },
    mission: {
      status: input.state.visible.missionContinuity,
      situationAwareness: input.state.visible.situationAwareness,
      escalationPressure: input.state.visible.escalationPressure,
      operationalReadiness: input.state.visible.operationalReadiness,
      coalitionCohesion: input.state.visible.coalitionCohesion,
      informationFootprint: input.state.visible.informationExposure,
      strategicLegitimacy: input.state.visible.strategicLegitimacy,
      serviceImpactSeverity: input.state.knowledge.serviceImpactSeverity,
    },
    flags: Object.freeze({ ...input.state.flags }),
    endState: endStateId
      ? {
          id: endStateId,
          labelFa: END_STATE_LABELS_FA[endStateId],
          tags: Object.freeze([...(input.finalSnapshot?.secondaryOutcomeTags ?? [])]),
        }
      : undefined,
    visibility: { canRevealHiddenTruth: false },
  };
};

/** Explicit AAR-only extension. This is the sole narrative builder allowed to expose hidden truth. */
export const buildAarNarrativeContext = (
  input: BuildNarrativeContextInput & { finalSnapshot: ScenarioOneFinalSnapshot }
): Scenario4AarNarrativeContext => {
  const publicContext = buildNarrativeContext({ ...input, phase: "aar" });
  return {
    ...publicContext,
    phase: "aar",
    visibility: { canRevealHiddenTruth: true },
    hiddenTruth: Object.freeze({ ...input.finalSnapshot.hiddenAarData }),
  };
};
