import {
  adjudicateModelStep,
  createInitialTrueWorldState,
  materializeEvidence,
} from "../index";
import type {
  CorridorId,
  EvidenceRequest,
  RoundId,
  Scenario5Seed,
  WorldId,
} from "../index";
import { getMissionAction } from "./actionCatalog";
import {
  BASE_ROUND_MINUTES,
  INITIAL_CONVOY_CONFIG,
  INITIAL_ISR_CAPACITY,
  INITIAL_SUPPORT_RESERVE,
  MISSION_HORIZON_MINUTES,
  MISSION_MODEL_VERSION,
} from "./config";
import { resolveMissionEndState } from "./endStateResolver";
import {
  deriveActorVisibleSignals,
  deriveOperationalAttributionStatus,
  getAvailableMissionActions,
  validateMissionAction,
} from "./selectors";
import type {
  MissionActionConfig,
  MissionActionSelection,
  MissionConvoyState,
  MissionStepResult,
  OperationalImpact,
  OperationalImpactInput,
  PendingEvidenceRequest,
  Scenario5MissionEvent,
  Scenario5MissionState,
} from "./types";

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));

const initialConvoys = (): readonly MissionConvoyState[] => INITIAL_CONVOY_CONFIG.map((config) => ({
  convoyId: config.convoyId,
  corridorId: config.corridorId,
  baselineArrivalMinute: config.baselineArrivalMinute,
  deadlineMinute: config.deadlineMinute,
  integrity: config.initialIntegrity,
  delayMinutes: 0,
  pntExposure: 0,
  fallbackNav: false,
  routeHardened: false,
  groundSupport: false,
  escortedUntilRound: null,
  temporaryProtectionLevel: 0,
  temporaryProtectionUntilRound: null,
  deliveredAtMinute: null,
  status: "moving",
}));

export function createInitialMissionState(worldId: WorldId, seed: Scenario5Seed): Scenario5MissionState {
  return {
    missionModelVersion: MISSION_MODEL_VERSION,
    trueWorldState: createInitialTrueWorldState(worldId, seed),
    worldClockMinutes: 0,
    currentRound: 1,
    completed: false,
    resources: { isrCapacity: INITIAL_ISR_CAPACITY, supportReserve: INITIAL_SUPPORT_RESERVE },
    convoys: initialConvoys(),
    visibleEvidence: [],
    pendingEvidenceRequests: [],
    operationalAttributionStatus: "unresolved",
    missionEvents: [],
  };
}

const evidenceRequestFor = (
  config: MissionActionConfig,
  effectiveTargetCorridorId: CorridorId | null,
  structuralTick: number,
): EvidenceRequest | null => {
  if (!config.evidence) return null;
  return {
    requestId: `${config.actionId}:tick${structuralTick}`,
    requestKind: config.evidence.requestKind,
    ...(config.evidence.target === "effective_target" && effectiveTargetCorridorId
      ? { targetCorridorId: effectiveTargetCorridorId }
      : {}),
  };
};

const applyActionEffects = (
  convoys: readonly MissionConvoyState[],
  config: MissionActionConfig,
  target: CorridorId | null,
): readonly MissionConvoyState[] => convoys.map((convoy) => {
  if (convoy.status === "delivered") return convoy;
  let delayDelta = 0;
  if (config.delayEffect.kind === "target" && convoy.corridorId === target) delayDelta = config.delayEffect.minutes;
  if (config.delayEffect.kind === "all") delayDelta = config.delayEffect.minutes;
  if (config.delayEffect.kind === "continuity_finish") delayDelta = convoy.convoyId === "alpha" ? 10 : -5;

  let temporaryProtectionLevel = convoy.temporaryProtectionLevel;
  let temporaryProtectionUntilRound = convoy.temporaryProtectionUntilRound;
  if (config.temporaryProtection === "all_level_2") {
    temporaryProtectionLevel = 2;
    temporaryProtectionUntilRound = 7;
  } else if (config.temporaryProtection === "all_level_1_round7") {
    temporaryProtectionLevel = 1;
    temporaryProtectionUntilRound = 7;
  } else if (config.temporaryProtection === "priority_surge") {
    temporaryProtectionLevel = convoy.convoyId === "alpha" ? 2 : -1;
    temporaryProtectionUntilRound = 7;
  } else if (config.temporaryProtection === "all_level_1_round8") {
    temporaryProtectionLevel = 1;
    temporaryProtectionUntilRound = 8;
  }

  const targeted = convoy.corridorId === target;
  return {
    ...convoy,
    delayMinutes: Math.max(0, convoy.delayMinutes + delayDelta),
    fallbackNav: convoy.fallbackNav || (targeted && config.activatesFallback),
    routeHardened: convoy.routeHardened || (targeted && config.hardensRoute),
    groundSupport: convoy.groundSupport || (targeted && config.grantsGroundSupport),
    escortedUntilRound: targeted && config.escortThroughRound !== null ? config.escortThroughRound : convoy.escortedUntilRound,
    temporaryProtectionLevel,
    temporaryProtectionUntilRound,
    status: targeted && config.holdsForStep && convoy.status === "moving" ? "held" : convoy.status,
  };
});

export function calculateOperationalImpact(input: OperationalImpactInput): OperationalImpact {
  const base = input.pressure === "low"
    ? { delayMinutes: 4, pntExposure: 6, integrityDamage: 0 }
    : input.pressure === "medium"
      ? { delayMinutes: 8, pntExposure: 12, integrityDamage: 3 }
      : { delayMinutes: 14, pntExposure: 20, integrityDamage: 7 };
  const progressive = input.roundId === 1 ? 0.25 : input.roundId === 2 ? 0.5 : 1;
  let delayMultiplier = progressive;
  let exposureMultiplier = progressive;
  let damageMultiplier = progressive;

  if (input.convoy.fallbackNav) {
    delayMultiplier *= 0.75;
    exposureMultiplier *= 0.45;
    damageMultiplier *= 0.65;
  }
  if (input.convoy.routeHardened) {
    delayMultiplier *= 0.75;
    exposureMultiplier *= 0.75;
    damageMultiplier *= 0.75;
  }
  if (input.convoy.groundSupport) {
    delayMultiplier *= 0.85;
    exposureMultiplier *= 0.8;
    damageMultiplier *= 0.7;
  }
  if (input.convoy.escortedUntilRound === input.roundId) {
    delayMultiplier *= 0.9;
    exposureMultiplier *= 0.85;
    damageMultiplier *= 0.6;
  }
  const temporaryMultiplier = Math.max(0.7, 1 - 0.1 * input.convoy.temporaryProtectionLevel);
  delayMultiplier *= temporaryMultiplier;
  exposureMultiplier *= temporaryMultiplier;
  damageMultiplier *= temporaryMultiplier;

  let result: OperationalImpact = {
    delayMinutes: Math.round(base.delayMinutes * delayMultiplier),
    pntExposure: Math.round(base.pntExposure * exposureMultiplier),
    integrityDamage: Math.round(base.integrityDamage * damageMultiplier),
  };
  if (input.secondary) {
    result = {
      delayMinutes: Math.round(result.delayMinutes * 0.6),
      pntExposure: Math.round(result.pntExposure * 0.6),
      integrityDamage: Math.round(result.integrityDamage * 0.6),
    };
  }
  return result;
}

const updateConvoyStatuses = (
  convoys: readonly MissionConvoyState[],
  worldClockMinutes: number,
): readonly MissionConvoyState[] => convoys.map((convoy) => {
  if (convoy.status === "delivered") return convoy;
  const projectedArrivalMinute = convoy.baselineArrivalMinute + convoy.delayMinutes;
  if (convoy.integrity < 55) return { ...convoy, status: "compromised" };
  if (projectedArrivalMinute <= worldClockMinutes) {
    return {
      ...convoy,
      status: "delivered",
      deliveredAtMinute: convoy.deliveredAtMinute ?? projectedArrivalMinute,
    };
  }
  return { ...convoy, status: "moving" };
});

const latencyOffset = (variant: Scenario5MissionState["trueWorldState"]["latencyVariant"]): number => {
  if (variant === "early") return 1;
  if (variant === "nominal") return 2;
  return 3;
};

export function applyMissionDecision(
  state: Scenario5MissionState,
  selection: MissionActionSelection,
): MissionStepResult {
  const { config, effectiveTargetCorridorId } = validateMissionAction(state, selection);
  const emitted: Scenario5MissionEvent[] = [];
  let eventCounter = state.missionEvents.length;
  let lastCause: string | null = null;
  const nextClock = state.worldClockMinutes + BASE_ROUND_MINUTES + config.durationMinutes;
  const emit = (eventKind: string, payload: Readonly<Record<string, unknown>>, explicitCause?: string): Scenario5MissionEvent => {
    eventCounter += 1;
    const eventId = `M-${state.trueWorldState.worldId}-r${state.currentRound}-e${eventCounter}`;
    const event = {
      eventId,
      causeEventId: explicitCause ?? lastCause ?? eventId,
      roundId: state.currentRound,
      worldClockMinute: nextClock,
      eventKind,
      payload,
    } satisfies Scenario5MissionEvent;
    emitted.push(event);
    lastCause = eventId;
    return event;
  };

  emit("mission_action_validated", { actionId: config.actionId, decisionWindowId: config.decisionWindowId, effectiveTargetCorridorId });
  const resources = {
    isrCapacity: state.resources.isrCapacity - config.isrCost,
    supportReserve: state.resources.supportReserve - config.supportCost,
  };
  emit("mission_resource_spent", { isrCost: config.isrCost, supportCost: config.supportCost, resources });
  emit("mission_clock_advanced", {
    fromMinute: state.worldClockMinutes,
    toMinute: nextClock,
    durationMinutes: config.durationMinutes,
    fromRound: state.currentRound,
    toRound: state.currentRound < 8 ? state.currentRound + 1 : 8,
  });

  const actionConvoys = applyActionEffects(state.convoys, config, effectiveTargetCorridorId);
  emit("mission_action_effect_applied", {
    actionId: config.actionId,
    effectiveTargetCorridorId,
    delayEffect: config.delayEffect,
    temporaryProtection: config.temporaryProtection,
  });

  const postActionState: Scenario5MissionState = { ...state, resources, worldClockMinutes: nextClock, convoys: actionConvoys };
  const { signals } = deriveActorVisibleSignals(postActionState, config, effectiveTargetCorridorId);
  const nextStructuralTick = state.trueWorldState.worldClockTick + 1;
  const duePending = state.pendingEvidenceRequests.filter(({ dueWorldTick }) => dueWorldTick === nextStructuralTick);
  const remainingPending = state.pendingEvidenceRequests.filter(({ dueWorldTick }) => dueWorldTick !== nextStructuralTick);
  const currentRequest = evidenceRequestFor(config, effectiveTargetCorridorId, nextStructuralTick);
  const immediateRequests = currentRequest && config.evidence?.timing === "immediate" ? [currentRequest] : [];
  const structuralResult = adjudicateModelStep({
    trueState: state.trueWorldState,
    decisionIntent: {
      phaseId: config.phaseId,
      roundId: config.roundId,
      decisionWindowId: config.decisionWindowId,
      actionId: config.actionId,
    },
    actorVisibleSignals: signals,
    visibleEvidence: state.visibleEvidence,
    evidenceRequests: [...duePending.map(({ request }) => request), ...immediateRequests],
    userCostKinds: config.isrCost > 0 || config.supportCost > 0 ? ["mission_resources"] : [],
    worldTransitionKinds: ["mission_action_effect"],
    playerVisibleSignalKinds: immediateRequests.length > 0 || duePending.length > 0 ? ["mission_evidence"] : [],
  });

  if (structuralResult.generatedEvidence.length > 0) {
    const evidenceCause = structuralResult.events.find(({ eventKind }) => eventKind === "evidence_generated")?.eventId;
    emit("mission_evidence_released", {
      evidenceIds: structuralResult.generatedEvidence.map(({ evidenceId }) => evidenceId),
      releasedPendingRequestIds: duePending.map(({ request }) => request.requestId),
    }, evidenceCause);
  }

  let pendingEvidenceRequests: readonly PendingEvidenceRequest[] = remainingPending;
  if (currentRequest && config.evidence?.timing === "pending") {
    const pending = {
      request: currentRequest,
      dueWorldTick: structuralResult.trueState.worldClockTick + latencyOffset(structuralResult.trueState.latencyVariant),
    } satisfies PendingEvidenceRequest;
    pendingEvidenceRequests = [...pendingEvidenceRequests, pending];
    emit("mission_evidence_scheduled", { requestId: pending.request.requestId, dueWorldTick: pending.dueWorldTick });
  }

  const reactionEvent = structuralResult.events.find(({ eventKind }) => eventKind === "actor_reaction_resolved");
  const impactedCorridors = new Map<CorridorId, boolean>([[structuralResult.trueState.primaryAffectedCorridorId, false]]);
  if (structuralResult.actorReaction.secondaryCorridorId) {
    impactedCorridors.set(structuralResult.actorReaction.secondaryCorridorId, true);
  }
  const impacts: Record<string, OperationalImpact> = {};
  const skippedDeliveredCorridorIds: CorridorId[] = [];
  let impactedConvoys = actionConvoys.map((convoy) => {
    const secondary = impactedCorridors.get(convoy.corridorId);
    if (secondary === undefined) return convoy;
    if (convoy.status === "delivered") {
      skippedDeliveredCorridorIds.push(convoy.corridorId);
      return convoy;
    }
    const impact = calculateOperationalImpact({
      convoy,
      pressure: structuralResult.trueState.actorInternalState.disruptionPressure,
      roundId: state.currentRound,
      secondary,
    });
    impacts[convoy.corridorId] = impact;
    return {
      ...convoy,
      delayMinutes: Math.max(0, convoy.delayMinutes + impact.delayMinutes),
      pntExposure: clamp(convoy.pntExposure + impact.pntExposure, 0, 100),
      integrity: clamp(convoy.integrity - impact.integrityDamage, 0, 100),
    };
  });
  emit("mission_actor_impact_applied", { impacts, skippedDeliveredCorridorIds }, reactionEvent?.eventId);

  if (state.currentRound === 7 || state.currentRound === 8) {
    const expiring = impactedConvoys.some(({ status, temporaryProtectionUntilRound }) =>
      status !== "delivered" && temporaryProtectionUntilRound === state.currentRound);
    if (expiring) {
      impactedConvoys = impactedConvoys.map((convoy) => convoy.status !== "delivered" && convoy.temporaryProtectionUntilRound === state.currentRound
        ? { ...convoy, temporaryProtectionLevel: 0 as const, temporaryProtectionUntilRound: null }
        : convoy);
      emit("mission_temporary_protection_expired", { expiredAfterRound: state.currentRound });
    }
  }

  const statusConvoys = updateConvoyStatuses(impactedConvoys, nextClock);
  emit("mission_convoy_status_updated", {
    statuses: Object.fromEntries(statusConvoys.map(({ convoyId, status }) => [convoyId, status])),
  });

  const visibleEvidence = [...state.visibleEvidence, ...structuralResult.generatedEvidence];
  const operationalAttributionStatus = deriveOperationalAttributionStatus(visibleEvidence);
  emit("mission_attribution_updated", { from: state.operationalAttributionStatus, to: operationalAttributionStatus });

  const nextRound = state.currentRound < 8 ? (state.currentRound + 1) as RoundId : state.currentRound;
  let nextState: Scenario5MissionState = {
    ...state,
    trueWorldState: structuralResult.trueState,
    worldClockMinutes: nextClock,
    currentRound: nextRound,
    resources,
    convoys: statusConvoys,
    visibleEvidence,
    pendingEvidenceRequests,
    operationalAttributionStatus,
    missionEvents: [...state.missionEvents, ...emitted],
  };

  let endState = null;
  if (state.currentRound === 8) {
    const beforeFinalizationCount = nextState.missionEvents.length;
    nextState = finalizeMission(nextState);
    emitted.push(...nextState.missionEvents.slice(beforeFinalizationCount));
    endState = resolveMissionEndState(nextState);
  }
  return { state: nextState, structuralResult, emittedMissionEvents: emitted, endState };
}

export function finalizeMission(state: Scenario5MissionState): Scenario5MissionState {
  if (state.completed) return state;
  const emitted: Scenario5MissionEvent[] = [];
  let counter = state.missionEvents.length;
  let lastCause = state.missionEvents.at(-1)?.eventId ?? null;
  const emit = (eventKind: string, payload: Readonly<Record<string, unknown>>): void => {
    counter += 1;
    const eventId = `M-${state.trueWorldState.worldId}-r8-e${counter}`;
    emitted.push({
      eventId,
      causeEventId: lastCause ?? eventId,
      roundId: 8,
      worldClockMinute: MISSION_HORIZON_MINUTES,
      eventKind,
      payload,
    });
    lastCause = eventId;
  };

  const lateEvidence = state.pendingEvidenceRequests.flatMap(({ request }) => materializeEvidence(state.trueWorldState, request));
  if (lateEvidence.length > 0) {
    emit("mission_evidence_released", {
      evidenceIds: lateEvidence.map(({ evidenceId }) => evidenceId),
      lateArrivingFinalEvidence: true,
    });
  }
  const visibleEvidence = [...state.visibleEvidence, ...lateEvidence];
  const operationalAttributionStatus = deriveOperationalAttributionStatus(visibleEvidence);
  if (operationalAttributionStatus !== state.operationalAttributionStatus) {
    emit("mission_attribution_updated", { from: state.operationalAttributionStatus, to: operationalAttributionStatus });
  }
  const convoys = updateConvoyStatuses(state.convoys, MISSION_HORIZON_MINUTES);
  emit("mission_finalized", {
    horizonMinute: MISSION_HORIZON_MINUTES,
    pendingEvidenceReleased: state.pendingEvidenceRequests.length,
    statuses: Object.fromEntries(convoys.map(({ convoyId, status }) => [convoyId, status])),
  });

  const finalized: Scenario5MissionState = {
    ...state,
    worldClockMinutes: MISSION_HORIZON_MINUTES,
    completed: true,
    convoys,
    visibleEvidence,
    pendingEvidenceRequests: [],
    operationalAttributionStatus,
    missionEvents: [...state.missionEvents, ...emitted],
  };
  const endState = resolveMissionEndState(finalized);
  counter += 1;
  const endEventId = `M-${state.trueWorldState.worldId}-r8-e${counter}`;
  const endEvent: Scenario5MissionEvent = {
    eventId: endEventId,
    causeEventId: emitted.at(-1)?.eventId ?? state.missionEvents.at(-1)?.eventId ?? endEventId,
    roundId: 8,
    worldClockMinute: MISSION_HORIZON_MINUTES,
    eventKind: "mission_end_state_resolved",
    payload: { endStateId: endState.endStateId },
  };
  return { ...finalized, missionEvents: [...finalized.missionEvents, endEvent] };
}

export { getAvailableMissionActions, getMissionAction };
