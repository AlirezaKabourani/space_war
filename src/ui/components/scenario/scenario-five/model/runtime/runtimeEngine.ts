import { CANONICAL_CORRIDORS } from "../index";
import type { CorridorId } from "../index";
import type { BeliefTelemetry, EvidenceOpenTelemetry, ReasonId } from "../cognitive/index";
import {
  applyMissionDecision,
  createInitialMissionState,
  getAvailableMissionActions,
  getMissionAction,
  validateMissionAction,
} from "../mission/index";
import type {
  MissionActionId,
  MissionActionSelection,
  Scenario5MissionEvent,
} from "../mission/index";
import {
  BELIEF_STAGE_METADATA,
  INITIAL_RUNTIME_STAGE_ID,
  REASON_STAGE_PHASE,
  decisionMetadata,
  isBeliefStage,
  isDecisionStage,
  isReasonStage,
} from "./stageMachine";
import { adaptNewVisibleEvidence } from "./telemetryAdapter";
import type {
  PendingRuntimeDecision,
  RuntimeBeliefInput,
  RuntimeStageId,
  Scenario5DomainDecisionRecord,
  Scenario5RuntimeConfig,
  Scenario5RuntimeEventKind,
  Scenario5RuntimeState,
} from "./types";
import {
  S5_DOMAIN_METRICS_VERSION,
  S5_RUNTIME_MODEL_VERSION,
} from "./versions";

const CORRIDOR_IDS = CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId);
const REASON_IDS = new Set<ReasonId>([
  "reason_mission_speed",
  "reason_reduce_exposure",
  "reason_preserve_resources",
  "reason_network_continuity",
  "reason_information_confidence",
  "reason_limit_actor_reaction",
  "reason_preserve_reversibility",
]);

const assertFiniteAtOrAfter = (value: number, minimum: number, label: string): void => {
  if (!Number.isFinite(value) || value < minimum) throw new Error(`${label} must be finite and >= ${minimum}`);
};

const latestRuntimeEventAtMs = (state: Scenario5RuntimeState): number =>
  state.runtimeEvents.at(-1)?.atMs ?? state.startedAtMs;

const assertRuntimeChronology = (
  state: Scenario5RuntimeState,
  atMs: number,
  label: string,
): void => {
  const latestAtMs = latestRuntimeEventAtMs(state);
  if (atMs < latestAtMs) {
    throw new Error(`${label} violates runtime chronology: ${atMs} < ${latestAtMs}`);
  }
};

const appendEvent = (
  state: Scenario5RuntimeState,
  eventKind: Scenario5RuntimeEventKind,
  atMs: number,
  payload: Readonly<Record<string, unknown>> = {},
  stageId: RuntimeStageId = state.stage.stageId,
): Scenario5RuntimeState => {
  const previousAtMs = latestRuntimeEventAtMs(state);
  if (!Number.isFinite(atMs) || atMs < previousAtMs) {
    throw new Error(`runtime event chronology requires atMs >= ${previousAtMs}`);
  }
  const sequence = state.runtimeEvents.length + 1;
  return {
    ...state,
    runtimeEvents: [...state.runtimeEvents, {
      eventId: `RT-${state.runId}-${sequence}`,
      sequence,
      eventKind,
      atMs,
      stageId,
      payload,
    }],
  };
};

const enterStage = (
  state: Scenario5RuntimeState,
  stageId: RuntimeStageId,
  enteredAtMs: number,
  nextStageId?: RuntimeStageId,
): Scenario5RuntimeState => {
  const transitioned: Scenario5RuntimeState = {
    ...state,
    stage: { stageId, enteredAtMs, ...(nextStageId ? { nextStageId } : {}) },
  };
  return appendEvent(transitioned, "runtime_stage_entered", enteredAtMs, { stageId, ...(nextStageId ? { nextStageId } : {}) });
};

export function createScenario5Runtime(config: Scenario5RuntimeConfig): Scenario5RuntimeState {
  if (config.runId.trim().length === 0) throw new Error("runId must be non-empty");
  if (!Number.isFinite(config.startedAtMs) || config.startedAtMs < 0) {
    throw new Error("startedAtMs must be finite and nonnegative");
  }
  let state: Scenario5RuntimeState = {
    runtimeModelVersion: S5_RUNTIME_MODEL_VERSION,
    domainMetricsVersion: S5_DOMAIN_METRICS_VERSION,
    runId: config.runId,
    startedAtMs: config.startedAtMs,
    completedAtMs: null,
    stage: { stageId: INITIAL_RUNTIME_STAGE_ID, enteredAtMs: config.startedAtMs },
    missionState: createInitialMissionState(config.worldId, config.seed),
    decisions: [],
    evidence: [],
    evidenceOpens: [],
    beliefs: [],
    reasons: [],
    currentSelectionHistory: [],
    activeEvidenceOpens: [],
    pendingDecision: null,
    domainDecisionRecords: [],
    runtimeEvents: [],
  };
  state = appendEvent(state, "runtime_created", config.startedAtMs, { runId: config.runId });
  return appendEvent(state, "runtime_stage_entered", config.startedAtMs, { stageId: INITIAL_RUNTIME_STAGE_ID });
}

export function getRuntimeAvailableActionIds(state: Scenario5RuntimeState): readonly MissionActionId[] {
  const hasActiveConvoy = state.missionState.convoys.some(({ status }) => status !== "delivered");
  const alphaActive = state.missionState.convoys.some(
    ({ convoyId, status }) => convoyId === "alpha" && status !== "delivered",
  );
  return getAvailableMissionActions(state.missionState)
    .filter((action) => action.isrCost <= state.missionState.resources.isrCapacity
      && action.supportCost <= state.missionState.resources.supportReserve)
    .filter((action) => action.target === "none"
      || (action.target === "fixed_alpha" ? alphaActive : hasActiveConvoy))
    .map(({ actionId }) => actionId);
}

export function selectRuntimeAction(
  state: Scenario5RuntimeState,
  actionId: MissionActionId,
  selectedAtMs: number,
): Scenario5RuntimeState {
  if (!isDecisionStage(state.stage.stageId)) throw new Error("Action selection is only valid in a decision stage");
  assertFiniteAtOrAfter(selectedAtMs, state.stage.enteredAtMs, "selectedAtMs");
  assertRuntimeChronology(state, selectedAtMs, "selectedAtMs");
  if (!getRuntimeAvailableActionIds(state).includes(actionId)) throw new Error(`Action ${actionId} is not currently available`);
  const previous = state.currentSelectionHistory.at(-1);
  if (previous && selectedAtMs < previous.selectedAtMs) {
    throw new Error(`selectedAtMs violates runtime chronology: ${selectedAtMs} < ${previous.selectedAtMs}`);
  }
  const history = previous?.actionId === actionId
    ? state.currentSelectionHistory
    : [...state.currentSelectionHistory, { actionId, selectedAtMs }];
  const selected = { ...state, currentSelectionHistory: history };
  return appendEvent(selected, "runtime_action_selected", selectedAtMs, { actionId });
}

export function openRuntimeEvidence(
  state: Scenario5RuntimeState,
  evidenceId: string,
  openedAtMs: number,
): Scenario5RuntimeState {
  if (!isDecisionStage(state.stage.stageId)) throw new Error("Evidence opening is only valid in a decision stage");
  assertFiniteAtOrAfter(openedAtMs, state.stage.enteredAtMs, "openedAtMs");
  assertRuntimeChronology(state, openedAtMs, "openedAtMs");
  if (!state.missionState.visibleEvidence.some((item) => item.evidenceId === evidenceId)) {
    throw new Error(`Evidence ${evidenceId} is not currently visible`);
  }
  if (state.activeEvidenceOpens.some((item) => item.evidenceId === evidenceId)) {
    throw new Error(`Evidence ${evidenceId} is already open`);
  }
  const windowId = decisionMetadata(state.stage.stageId).windowId;
  const opened = {
    ...state,
    activeEvidenceOpens: [...state.activeEvidenceOpens, { evidenceId, windowId, openedAtMs }],
  };
  return appendEvent(opened, "runtime_evidence_opened", openedAtMs, { evidenceId, windowId });
}

const closeEvidence = (
  state: Scenario5RuntimeState,
  evidenceId: string,
  closedAtMs: number,
): Scenario5RuntimeState => {
  const active = state.activeEvidenceOpens.find((item) => item.evidenceId === evidenceId);
  if (!active) throw new Error(`Evidence ${evidenceId} is not open`);
  assertFiniteAtOrAfter(closedAtMs, active.openedAtMs, "closedAtMs");
  assertRuntimeChronology(state, closedAtMs, "closedAtMs");
  const telemetry: EvidenceOpenTelemetry = {
    evidenceId,
    windowId: active.windowId,
    openedAtMs: active.openedAtMs,
    closedAtMs,
    activeDwellMs: closedAtMs - active.openedAtMs,
  };
  const closed: Scenario5RuntimeState = {
    ...state,
    evidenceOpens: [...state.evidenceOpens, telemetry],
    activeEvidenceOpens: state.activeEvidenceOpens.filter((item) => item !== active),
  };
  return appendEvent(closed, "runtime_evidence_closed", closedAtMs, {
    evidenceId,
    windowId: active.windowId,
    activeDwellMs: telemetry.activeDwellMs,
  });
};

export function closeRuntimeEvidence(
  state: Scenario5RuntimeState,
  evidenceId: string,
  closedAtMs: number,
): Scenario5RuntimeState {
  if (!isDecisionStage(state.stage.stageId)) throw new Error("Evidence closing is only valid in a decision stage");
  return closeEvidence(state, evidenceId, closedAtMs);
}

const closeAllEvidence = (state: Scenario5RuntimeState, closedAtMs: number): Scenario5RuntimeState =>
  state.activeEvidenceOpens.reduce(
    (current, { evidenceId }) => closeEvidence(current, evidenceId, closedAtMs),
    state,
  );

const uniqueOpenedEvidenceIds = (state: Scenario5RuntimeState, windowId: PendingRuntimeDecision["windowId"]): readonly string[] =>
  [...new Set(state.evidenceOpens.filter((item) => item.windowId === windowId).map(({ evidenceId }) => evidenceId))];

const actorDelayImpact = (events: readonly Scenario5MissionEvent[]): Readonly<Record<CorridorId, number>> => {
  const event = events.find(({ eventKind }) => eventKind === "mission_actor_impact_applied");
  if (!event) throw new Error("Mission step omitted mission_actor_impact_applied");
  const impacts = event.payload.impacts;
  if (typeof impacts !== "object" || impacts === null) throw new Error("Actor impact payload is invalid");
  return Object.fromEntries(CORRIDOR_IDS.map((corridorId) => {
    const raw = (impacts as Record<string, unknown>)[corridorId];
    if (raw === undefined) return [corridorId, 0];
    if (typeof raw !== "object" || raw === null) throw new Error(`Actor impact for ${corridorId} is invalid`);
    const delayMinutes = (raw as Record<string, unknown>).delayMinutes;
    if (typeof delayMinutes !== "number" || !Number.isFinite(delayMinutes)) {
      throw new Error(`Actor delay impact for ${corridorId} is invalid`);
    }
    return [corridorId, delayMinutes];
  })) as Readonly<Record<CorridorId, number>>;
};

const commitRuntimeMissionDecision = (
  state: Scenario5RuntimeState,
  draft: PendingRuntimeDecision,
  committedAtMs: number,
): Scenario5RuntimeState => {
  const missionBefore = state.missionState;
  const validated = validateMissionAction(missionBefore, draft.selection);
  const step = applyMissionDecision(missionBefore, draft.selection);
  const missionAfter = step.state;
  const newEvidence = adaptNewVisibleEvidence(missionBefore, missionAfter, draft.roundId, committedAtMs);
  const newEvidenceIds = newEvidence.map(({ evidenceId }) => evidenceId);
  const decision = {
    phaseId: draft.phaseId,
    roundId: draft.roundId,
    windowId: draft.windowId,
    availableActionIds: draft.availableActionIds,
    firstSelectedActionId: draft.selectionHistory[0]?.actionId ?? null,
    finalSelectedActionId: draft.selection.actionId,
    selectionHistory: draft.selectionHistory,
    enteredAtMs: draft.enteredAtMs,
    confirmedAtMs: draft.confirmedAtMs,
    elapsedMs: draft.elapsedMs,
    activeDecisionMs: draft.activeDecisionMs,
    hiddenTabMs: draft.hiddenTabMs,
    revisionCount: draft.revisionCount,
    availableEvidenceIds: draft.availableEvidenceIds,
    openedEvidenceIds: draft.openedEvidenceIds,
    playerVisibleResourcesBefore: draft.playerVisibleResourcesBefore,
    playerVisibleResourcesAfter: {
      isrCapacity: missionAfter.resources.isrCapacity,
      supportReserve: missionAfter.resources.supportReserve,
    },
  } as const;
  const domainRecord: Scenario5DomainDecisionRecord = {
    roundId: draft.roundId,
    windowId: draft.windowId,
    actionId: draft.selection.actionId,
    effectiveTargetCorridorId: validated.effectiveTargetCorridorId,
    worldClockBefore: missionBefore.worldClockMinutes,
    worldClockAfter: missionAfter.worldClockMinutes,
    resourcesBefore: missionBefore.resources,
    resourcesAfter: missionAfter.resources,
    convoyStateBefore: missionBefore.convoys,
    convoyStateAfter: missionAfter.convoys,
    actorDelayImpactByCorridor: actorDelayImpact(step.emittedMissionEvents),
    newVisibleEvidenceIds: newEvidenceIds,
  };
  let committed: Scenario5RuntimeState = {
    ...state,
    missionState: missionAfter,
    decisions: [...state.decisions, decision],
    evidence: [...state.evidence, ...newEvidence],
    currentSelectionHistory: [],
    activeEvidenceOpens: [],
    pendingDecision: null,
    domainDecisionRecords: [...state.domainDecisionRecords, domainRecord],
  };
  committed = appendEvent(committed, "runtime_mission_step_committed", committedAtMs, {
    roundId: draft.roundId,
    windowId: draft.windowId,
    actionId: draft.selection.actionId,
    effectiveTargetCorridorId: validated.effectiveTargetCorridorId,
    newVisibleEvidenceIds: newEvidenceIds,
  });
  const nextStageId = decisionMetadata(`decision:${draft.windowId}`).outcomeNextStageId;
  return enterStage(committed, "outcome_review", committedAtMs, nextStageId);
};

export function confirmRuntimeDecision(
  state: Scenario5RuntimeState,
  selection: MissionActionSelection,
  confirmedAtMs: number,
  hiddenTabMs: number,
): Scenario5RuntimeState {
  if (!isDecisionStage(state.stage.stageId)) throw new Error("Decision confirmation is only valid in a decision stage");
  const history = state.currentSelectionHistory;
  const last = history.at(-1);
  if (!last) throw new Error("Decision confirmation requires a prior action selection");
  if (selection.actionId !== last.actionId) throw new Error("Confirmed action must equal the last selected action");
  assertFiniteAtOrAfter(confirmedAtMs, state.stage.enteredAtMs, "confirmedAtMs");
  if (confirmedAtMs < last.selectedAtMs) {
    throw new Error(`confirmedAtMs must be >= last selection timestamp ${last.selectedAtMs}`);
  }
  assertRuntimeChronology(state, confirmedAtMs, "confirmedAtMs");
  const availableActionIds = getRuntimeAvailableActionIds(state);
  if (!availableActionIds.includes(selection.actionId)) throw new Error(`Action ${selection.actionId} is no longer available`);

  validateMissionAction(state.missionState, selection);
  const elapsedMs = confirmedAtMs - state.stage.enteredAtMs;
  if (!Number.isFinite(hiddenTabMs) || hiddenTabMs < 0 || hiddenTabMs > elapsedMs) {
    throw new Error("hiddenTabMs must be finite and within 0..elapsedMs");
  }

  const metadata = decisionMetadata(state.stage.stageId);
  let closed = closeAllEvidence(state, confirmedAtMs);
  const draft: PendingRuntimeDecision = {
    selection: { ...selection },
    phaseId: metadata.phaseId,
    roundId: metadata.roundId,
    windowId: metadata.windowId,
    availableActionIds: [...availableActionIds],
    selectionHistory: [...history],
    enteredAtMs: state.stage.enteredAtMs,
    confirmedAtMs,
    elapsedMs,
    activeDecisionMs: elapsedMs - hiddenTabMs,
    hiddenTabMs,
    revisionCount: Math.max(0, history.length - 1),
    availableEvidenceIds: state.missionState.visibleEvidence.map(({ evidenceId }) => evidenceId),
    openedEvidenceIds: uniqueOpenedEvidenceIds(closed, metadata.windowId),
    playerVisibleResourcesBefore: {
      isrCapacity: state.missionState.resources.isrCapacity,
      supportReserve: state.missionState.resources.supportReserve,
    },
  };
  closed = appendEvent(closed, "runtime_decision_confirmed", confirmedAtMs, {
    roundId: metadata.roundId,
    windowId: metadata.windowId,
    actionId: selection.actionId,
  });
  if (metadata.reasonStageId) {
    const waiting: Scenario5RuntimeState = {
      ...closed,
      pendingDecision: draft,
      currentSelectionHistory: [],
    };
    return enterStage(waiting, metadata.reasonStageId, confirmedAtMs);
  }
  return commitRuntimeMissionDecision(closed, draft, confirmedAtMs);
}

export function submitRuntimeBelief(
  state: Scenario5RuntimeState,
  input: RuntimeBeliefInput,
): Scenario5RuntimeState {
  if (!isBeliefStage(state.stage.stageId)) throw new Error("Belief submission is only valid in a belief stage");
  const metadata = BELIEF_STAGE_METADATA[state.stage.stageId];
  if (state.beliefs.some(({ checkpointId }) => checkpointId === metadata.checkpointId)) {
    throw new Error(`Belief checkpoint ${metadata.checkpointId} was already submitted`);
  }
  for (const [label, value] of [
    ["corridorConfidence", input.corridorConfidence],
    ["targetedInterferenceEstimate", input.targetedInterferenceEstimate],
    ["targetedInterferenceConfidence", input.targetedInterferenceConfidence],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${label} must be finite and within 0..100`);
  }
  assertFiniteAtOrAfter(input.recordedAtMs, state.stage.enteredAtMs, "recordedAtMs");
  assertRuntimeChronology(state, input.recordedAtMs, "recordedAtMs");
  const belief: BeliefTelemetry = {
    checkpointId: metadata.checkpointId,
    recordedAtMs: input.recordedAtMs,
    mostLikelyCorridorId: input.mostLikelyCorridorId,
    corridorConfidence: input.corridorConfidence,
    targetedInterferenceEstimate: input.targetedInterferenceEstimate,
    targetedInterferenceConfidence: input.targetedInterferenceConfidence,
    visibleEvidenceIdsAtCheckpoint: state.missionState.visibleEvidence.map(({ evidenceId }) => evidenceId),
  };
  let recorded: Scenario5RuntimeState = { ...state, beliefs: [...state.beliefs, belief] };
  recorded = appendEvent(recorded, "runtime_belief_recorded", input.recordedAtMs, { checkpointId: metadata.checkpointId });
  return enterStage(recorded, metadata.nextStageId, input.recordedAtMs);
}

export function submitRuntimeReason(
  state: Scenario5RuntimeState,
  reasonId: ReasonId,
  recordedAtMs: number,
): Scenario5RuntimeState {
  if (!isReasonStage(state.stage.stageId)) throw new Error("Reason submission is only valid in a reason stage");
  if (!state.pendingDecision) throw new Error("Reason stage requires a pending decision");
  if (!REASON_IDS.has(reasonId)) throw new Error(`Invalid Phase-5 reason ID: ${reasonId}`);
  const phaseId = REASON_STAGE_PHASE[state.stage.stageId];
  if (state.reasons.some((reason) => reason.phaseId === phaseId)) throw new Error(`Reason for phase ${phaseId} was already submitted`);
  assertFiniteAtOrAfter(recordedAtMs, state.pendingDecision.confirmedAtMs, "recordedAtMs");
  assertRuntimeChronology(state, recordedAtMs, "recordedAtMs");
  const reason = { phaseId, reasonId, recordedAtMs, capturedBeforeOutcome: true } as const;
  let recorded: Scenario5RuntimeState = { ...state, reasons: [...state.reasons, reason] };
  recorded = appendEvent(recorded, "runtime_reason_recorded", recordedAtMs, { phaseId, reasonId });
  return commitRuntimeMissionDecision(recorded, state.pendingDecision, recordedAtMs);
}

export function continueRuntimeAfterOutcome(
  state: Scenario5RuntimeState,
  atMs: number,
): Scenario5RuntimeState {
  if (state.stage.stageId !== "outcome_review" || !state.stage.nextStageId) {
    throw new Error("Outcome continuation is only valid in outcome_review with a next stage");
  }
  assertFiniteAtOrAfter(atMs, state.stage.enteredAtMs, "atMs");
  assertRuntimeChronology(state, atMs, "atMs");
  const nextStageId = state.stage.nextStageId;
  let continued = appendEvent(state, "runtime_outcome_continued", atMs, { nextStageId });
  if (nextStageId === "complete") {
    if (!continued.missionState.completed) throw new Error("Mission must be completed before runtime completion");
    continued = {
      ...continued,
      completedAtMs: atMs,
      stage: { stageId: "complete", enteredAtMs: atMs },
      currentSelectionHistory: [],
      activeEvidenceOpens: [],
    };
    return appendEvent(continued, "runtime_completed", atMs, {});
  }
  continued = { ...continued, currentSelectionHistory: [], activeEvidenceOpens: [] };
  return enterStage(continued, nextStageId, atMs);
}

export function runtimeCorridorIds(): readonly CorridorId[] {
  return CORRIDOR_IDS;
}

export function runtimeActionRequiresTarget(actionId: MissionActionId): boolean {
  return getMissionAction(actionId).target === "required";
}
