import type { CorridorId } from "../model/index";
import { S5_COGNITIVE_MEASUREMENT_MODEL_VERSION } from "../model/cognitive/index";
import type { BeliefTelemetry, EvidenceOpenTelemetry, EvidenceTelemetry, ReasonTelemetry } from "../model/cognitive/index";
import { MISSION_MODEL_VERSION } from "../model/mission/index";
import type { MissionActionId } from "../model/mission/index";
import {
  DECISION_STAGE_METADATA,
  getRuntimeAvailableActionIds,
  isDecisionStage,
} from "../model/runtime/index";
import type {
  RuntimeStageId,
  Scenario5RuntimeResult,
  Scenario5RuntimeState,
} from "../model/runtime/index";
import type {
  ScenarioFiveEvidenceDetail,
  ScenarioFiveEvidenceSummary,
  ScenarioFiveOutcomeView,
  ScenarioFivePlayerViewModel,
} from "../../ScenarioFiveTypes";

const phaseForRound = (roundId: number): "A" | "B" | "C" | "D" =>
  roundId <= 2 ? "A" : roundId <= 4 ? "B" : roundId <= 6 ? "C" : "D";

export const monotonicNow = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export function buildScenario5PlayerView(state: Scenario5RuntimeState): ScenarioFivePlayerViewModel {
  const decision = isDecisionStage(state.stage.stageId) ? DECISION_STAGE_METADATA[state.stage.stageId] : null;
  const lastRecord = state.domainDecisionRecords.at(-1);
  const roundId = decision?.roundId
    ?? state.pendingDecision?.roundId
    ?? lastRecord?.roundId
    ?? (state.stage.stageId === "complete" ? null : state.missionState.currentRound);
  return {
    stageId: state.stage.stageId,
    phaseId: decision?.phaseId ?? state.pendingDecision?.phaseId ?? (roundId === null ? null : phaseForRound(roundId)),
    roundId,
    resources: {
      isrCapacity: state.missionState.resources.isrCapacity,
      supportReserve: state.missionState.resources.supportReserve,
      worldClockMinutes: state.missionState.worldClockMinutes,
      missionHorizonMinutes: 360,
    },
    convoys: state.missionState.convoys.map((convoy) => ({
      convoyId: convoy.convoyId,
      corridorId: convoy.corridorId,
      integrity: convoy.integrity,
      delayMinutes: convoy.delayMinutes,
      projectedArrivalMinute: convoy.baselineArrivalMinute + convoy.delayMinutes,
      deadlineMinute: convoy.deadlineMinute,
      status: convoy.status,
      fallbackNav: convoy.fallbackNav,
      routeHardened: convoy.routeHardened,
      groundSupport: convoy.groundSupport,
      escortedNow: convoy.escortedUntilRound === state.missionState.currentRound,
    })),
    visibleEvidence: state.evidence,
    availableActionIds: isDecisionStage(state.stage.stageId) ? getRuntimeAvailableActionIds(state) : [],
  };
}

export const buildEvidenceSummary = (evidence: EvidenceTelemetry): ScenarioFiveEvidenceSummary => ({
  evidenceId: evidence.evidenceId,
  sourceType: evidence.sourceType,
  observedCorridorId: evidence.observedCorridorId,
  direction: evidence.direction,
  strengthBand: evidence.strengthBand,
});

export const buildEvidenceDetail = (evidence: EvidenceTelemetry): ScenarioFiveEvidenceDetail => ({
  ...buildEvidenceSummary(evidence),
  qualityLabelVisible: evidence.qualityLabelVisible,
  limitationVisible: evidence.limitationVisible,
});

export const isEvidenceExpansionEnabled = (stageId: RuntimeStageId): boolean => isDecisionStage(stageId);

export const getScenario5TargetOptions = (state: Scenario5RuntimeState): readonly CorridorId[] =>
  state.missionState.convoys.filter(({ status }) => status !== "delivered").map(({ corridorId }) => corridorId);

export function getRuntimeAutoClosedEvidenceOpens(
  before: Scenario5RuntimeState,
  after: Scenario5RuntimeState,
): readonly EvidenceOpenTelemetry[] {
  if (before.runId !== after.runId) throw new Error("Evidence auto-close comparison requires the same runId");
  if (after.evidenceOpens.length < before.evidenceOpens.length) {
    throw new Error("Evidence auto-close comparison cannot shrink evidenceOpens");
  }
  const activeBefore = new Set(before.activeEvidenceOpens.map(({ evidenceId }) => evidenceId));
  return after.evidenceOpens
    .slice(before.evidenceOpens.length)
    .filter(({ evidenceId, closedAtMs }) => activeBefore.has(evidenceId) && closedAtMs !== null);
}

export function buildScenario5OutcomeView(state: Scenario5RuntimeState): ScenarioFiveOutcomeView {
  if (state.stage.stageId !== "outcome_review" || !state.stage.nextStageId) {
    throw new Error("Scenario 5 outcome view requires outcome_review stage");
  }
  const record = state.domainDecisionRecords.at(-1);
  if (!record) throw new Error("Scenario 5 outcome view requires a committed decision");
  const convoyChanges = record.convoyStateBefore.flatMap((before) => {
    const after = record.convoyStateAfter.find(({ corridorId }) => corridorId === before.corridorId);
    if (!after) throw new Error(`Missing outcome convoy ${before.corridorId}`);
    const newMitigations = [
      !before.fallbackNav && after.fallbackNav ? "ناوبری پشتیبان" : null,
      !before.routeHardened && after.routeHardened ? "مسیر سخت‌سازی‌شده" : null,
      !before.groundSupport && after.groundSupport ? "پشتیبانی زمینی" : null,
      before.escortedUntilRound !== record.roundId && after.escortedUntilRound === record.roundId ? "اسکورت فعال" : null,
    ].filter((value): value is string => value !== null);
    const changed = before.status !== after.status
      || before.integrity !== after.integrity
      || before.delayMinutes !== after.delayMinutes
      || newMitigations.length > 0;
    return changed ? [{
      corridorId: before.corridorId,
      statusBefore: before.status,
      statusAfter: after.status,
      integrityBefore: before.integrity,
      integrityAfter: after.integrity,
      delayDelta: after.delayMinutes - before.delayMinutes,
      newMitigations,
    }] : [];
  });
  return {
    roundId: record.roundId,
    worldClockBefore: record.worldClockBefore,
    worldClockAfter: record.worldClockAfter,
    isrSpent: record.resourcesBefore.isrCapacity - record.resourcesAfter.isrCapacity,
    supportSpent: record.resourcesBefore.supportReserve - record.resourcesAfter.supportReserve,
    convoyChanges,
    newEvidenceCount: record.newVisibleEvidenceIds.length,
    nextStageId: state.stage.nextStageId,
  };
}

export interface HiddenTabTimingState {
  readonly accumulatedMs: number;
  readonly hiddenSinceMs: number | null;
}

export const startHiddenTabTiming = (atMs: number, initiallyHidden: boolean): HiddenTabTimingState => ({
  accumulatedMs: 0,
  hiddenSinceMs: initiallyHidden ? atMs : null,
});

export const updateHiddenTabTiming = (
  state: HiddenTabTimingState,
  atMs: number,
  hidden: boolean,
): HiddenTabTimingState => {
  if (hidden && state.hiddenSinceMs === null) return { ...state, hiddenSinceMs: atMs };
  if (!hidden && state.hiddenSinceMs !== null) {
    return { accumulatedMs: state.accumulatedMs + Math.max(0, atMs - state.hiddenSinceMs), hiddenSinceMs: null };
  }
  return state;
};

export const readHiddenTabMs = (state: HiddenTabTimingState, atMs: number): number =>
  state.accumulatedMs + (state.hiddenSinceMs === null ? 0 : Math.max(0, atMs - state.hiddenSinceMs));

export const resetHiddenTabTiming = (): HiddenTabTimingState => ({ accumulatedMs: 0, hiddenSinceMs: null });

export const buildRunStartedLogDetail = (state: Scenario5RuntimeState): Readonly<Record<string, unknown>> => ({
  runId: state.runId,
  runtimeModelVersion: state.runtimeModelVersion,
  missionModelVersion: MISSION_MODEL_VERSION,
  cognitiveMeasurementModelVersion: S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
  domainMetricsVersion: state.domainMetricsVersion,
});

export const buildActionSelectedLogDetail = (
  state: Scenario5RuntimeState,
  actionId: MissionActionId,
): Readonly<Record<string, unknown>> => ({ runId: state.runId, stageId: state.stage.stageId, actionId });

export const buildEvidenceLogDetail = (
  state: Scenario5RuntimeState,
  evidenceId: string,
  activeDwellMs?: number | null,
): Readonly<Record<string, unknown>> => {
  const opened = [...state.evidenceOpens].reverse().find((item) => item.evidenceId === evidenceId);
  const active = state.activeEvidenceOpens.find((item) => item.evidenceId === evidenceId);
  return {
    runId: state.runId,
    evidenceId,
    windowId: opened?.windowId ?? active?.windowId ?? null,
    ...(activeDwellMs === undefined ? {} : { activeDwellMs }),
  };
};

export const buildDecisionLogDetail = (state: Scenario5RuntimeState): Readonly<Record<string, unknown>> => {
  const decision = state.decisions.at(-1);
  const record = state.domainDecisionRecords.at(-1);
  if (!decision || !record) throw new Error("Decision logger payload requires committed telemetry");
  return {
    runId: state.runId,
    decision,
    effectiveTargetCorridorId: record.effectiveTargetCorridorId,
    missionWorldClockAfter: record.worldClockAfter,
    resourcesAfter: record.resourcesAfter,
  };
};

export const buildBeliefLogDetail = (state: Scenario5RuntimeState, belief: BeliefTelemetry): Readonly<Record<string, unknown>> => ({
  runId: state.runId,
  belief,
});

export const buildReasonLogDetail = (state: Scenario5RuntimeState, reason: ReasonTelemetry): Readonly<Record<string, unknown>> => ({
  runId: state.runId,
  reason,
});

export const buildOutcomeContinueLogDetail = (
  state: Scenario5RuntimeState,
  previousRound: number,
  nextStage: RuntimeStageId,
): Readonly<Record<string, unknown>> => ({ runId: state.runId, previousOutcomeReviewRound: previousRound, nextStage });

export const buildRunCompletedLogDetail = (
  state: Scenario5RuntimeState,
  result: Scenario5RuntimeResult,
): Readonly<Record<string, unknown>> => ({
  runId: state.runId,
  worldId: state.missionState.trueWorldState.worldId,
  seed: state.missionState.trueWorldState.seed,
  truePrimaryAffectedCorridorId: state.missionState.trueWorldState.primaryAffectedCorridorId,
  actorProfile: state.missionState.trueWorldState.actorProfileId,
  runtimeModelVersion: result.runtimeModelVersion,
  missionModelVersion: result.missionModelVersion,
  cognitiveMeasurementModelVersion: result.cognitiveMeasurementModelVersion,
  domainMetricsVersion: result.domainMetricsVersion,
  missionEndState: result.missionEndState,
  cognitive: result.cognitive,
  domain: result.domain,
  dataCompleteness: result.cognitive.dataCompleteness,
});

export interface Scenario5AarViewModel {
  readonly sectionIds: readonly ["mission", "truth", "belief", "evidence", "decisions", "domain", "cognitive", "limitations"];
  readonly truth: {
    readonly worldId: string;
    readonly seed: number;
    readonly primaryAffectedCorridorId: CorridorId;
    readonly actorProfile: string;
    readonly finalActorPosture: string;
    readonly lastReactionId: string | null;
  };
  readonly beliefs: Scenario5RuntimeState["beliefs"];
  readonly evidenceAudit: readonly {
    readonly evidence: EvidenceTelemetry;
    readonly hiddenProvenance: string;
    readonly opened: boolean;
  }[];
  readonly result: Scenario5RuntimeResult;
}

export function buildScenario5AarView(
  state: Scenario5RuntimeState,
  result: Scenario5RuntimeResult,
): Scenario5AarViewModel {
  if (state.stage.stageId !== "complete") throw new Error("AAR truth reveal requires completed runtime");
  const truth = state.missionState.trueWorldState;
  return {
    sectionIds: ["mission", "truth", "belief", "evidence", "decisions", "domain", "cognitive", "limitations"],
    truth: {
      worldId: truth.worldId,
      seed: truth.seed,
      primaryAffectedCorridorId: truth.primaryAffectedCorridorId,
      actorProfile: truth.actorProfileId,
      finalActorPosture: truth.actorInternalState.posture,
      lastReactionId: truth.actorInternalState.lastReactionId,
    },
    beliefs: state.beliefs,
    evidenceAudit: state.evidence.map((evidence) => {
      const source = state.missionState.visibleEvidence.find(({ evidenceId }) => evidenceId === evidence.evidenceId);
      if (!source) throw new Error(`Missing AAR evidence audit source ${evidence.evidenceId}`);
      return {
        evidence,
        hiddenProvenance: source.hiddenProvenance.relation,
        opened: state.evidenceOpens.some(({ evidenceId }) => evidenceId === evidence.evidenceId),
      };
    }),
    result,
  };
}
