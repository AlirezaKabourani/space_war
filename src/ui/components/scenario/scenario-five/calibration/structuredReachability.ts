import { WORLD_CATALOG } from "../model/index";
import type { CorridorId, WorldId } from "../model/index";
import {
  applyMissionDecision,
  createInitialMissionState,
  getAvailableMissionActions,
  resolveMissionEndState,
} from "../model/mission/index";
import type {
  MissionActionSelection,
  Scenario5EndStateId,
  Scenario5MissionState,
} from "../model/mission/index";

export const STRUCTURED_SEARCH_BEAM_LIMIT = 2500;
export const MISSION_EVENTS_MECHANICS_AUDIT = "missionEvents history is read only for event IDs/causal provenance; future transition physics does not inspect historical payloads";

export interface ReachabilityTraceStep {
  readonly actionId: MissionActionSelection["actionId"];
  readonly targetCorridorId: CorridorId | null;
}

interface SearchNode {
  readonly state: Scenario5MissionState;
  readonly trace: readonly ReachabilityTraceStep[];
  readonly key: string;
}

export interface ReachabilityWitness {
  readonly endStateId: Scenario5EndStateId;
  readonly worldId: WorldId;
  readonly environmentSeed: number;
  readonly latencyVariant: string;
  readonly trace: readonly ReachabilityTraceStep[];
  readonly finalState: Scenario5MissionState;
}

export interface ReachabilityBoundaryRow {
  readonly boundaryId: "A" | "B_projected_arrival" | "B_delay" | "C";
  readonly metric: string;
  readonly value: number | null;
  readonly worldId: WorldId | "";
  readonly environmentSeed: number | null;
  readonly trace: string;
}

export interface StructuredReachabilityResult {
  readonly witnesses: readonly ReachabilityWitness[];
  readonly boundaries: readonly ReachabilityBoundaryRow[];
  readonly representativeEnvironments: readonly { readonly worldId: WorldId; readonly environmentSeed: number; readonly latencyVariant: string }[];
  readonly searchesExecuted: number;
  readonly branchesApplied: number;
  readonly uniqueStatesGenerated: number;
  readonly retainedStates: number;
  readonly maximumBeamWidth: number;
  readonly targetIds: readonly Scenario5EndStateId[];
  readonly missionEventsMechanicsAudit: string;
}

export function missionReachabilityStateKey(state: Scenario5MissionState): string {
  return JSON.stringify({
    missionModelVersion: state.missionModelVersion,
    trueWorldState: state.trueWorldState,
    worldClockMinutes: state.worldClockMinutes,
    currentRound: state.currentRound,
    completed: state.completed,
    resources: state.resources,
    convoys: state.convoys,
    visibleEvidence: state.visibleEvidence,
    pendingEvidenceRequests: state.pendingEvidenceRequests,
    operationalAttributionStatus: state.operationalAttributionStatus,
  });
}

const alpha = (state: Scenario5MissionState) => state.convoys.find(({ convoyId }) => convoyId === "alpha")!;
const arrival = (convoy: Scenario5MissionState["convoys"][number]): number => convoy.baselineArrivalMinute + convoy.delayMinutes;
const secondary = (state: Scenario5MissionState) => state.convoys.filter(({ convoyId }) => convoyId !== "alpha");
const secondaryOnTime = (state: Scenario5MissionState): number => secondary(state)
  .filter((convoy) => convoy.integrity >= 60 && arrival(convoy) <= convoy.deadlineMinute).length;
const resources = (state: Scenario5MissionState): number => state.resources.isrCapacity + state.resources.supportReserve;

const compareBooleanTrueFirst = (left: boolean, right: boolean): number => Number(right) - Number(left);
const comparePriority = (left: SearchNode, right: SearchNode): number => {
  const lAlpha = alpha(left.state); const rAlpha = alpha(right.state);
  return compareBooleanTrueFirst(lAlpha.integrity >= 60, rAlpha.integrity >= 60)
    || compareBooleanTrueFirst(arrival(lAlpha) <= lAlpha.deadlineMinute, arrival(rAlpha) <= rAlpha.deadlineMinute)
    || secondaryOnTime(left.state) - secondaryOnTime(right.state)
    || secondary(right.state).reduce((sum, convoy) => sum + Math.max(0, arrival(convoy) - convoy.deadlineMinute), 0)
      - secondary(left.state).reduce((sum, convoy) => sum + Math.max(0, arrival(convoy) - convoy.deadlineMinute), 0)
    || secondary(left.state).reduce((sum, convoy) => sum + convoy.integrity, 0)
      - secondary(right.state).reduce((sum, convoy) => sum + convoy.integrity, 0)
    || resources(left.state) - resources(right.state)
    || left.key.localeCompare(right.key);
};

const compareIncomplete = (left: SearchNode, right: SearchNode): number => {
  const lAlpha = alpha(left.state); const rAlpha = alpha(right.state);
  return compareBooleanTrueFirst(lAlpha.integrity >= 55, rAlpha.integrity >= 55)
    || secondaryOnTime(right.state) - secondaryOnTime(left.state)
    || arrival(rAlpha) - arrival(lAlpha)
    || rAlpha.delayMinutes - lAlpha.delayMinutes
    || secondary(right.state).reduce((sum, convoy) => sum + convoy.integrity, 0)
      - secondary(left.state).reduce((sum, convoy) => sum + convoy.integrity, 0)
    || resources(left.state) - resources(right.state)
    || left.key.localeCompare(right.key);
};

const selections = (state: Scenario5MissionState): readonly MissionActionSelection[] => {
  const active = state.convoys.filter(({ status }) => status !== "delivered").map(({ corridorId }) => corridorId);
  const alphaActive = active.includes("corridor_alpha_east");
  return getAvailableMissionActions(state)
    .filter(({ isrCost, supportCost }) => isrCost <= state.resources.isrCapacity && supportCost <= state.resources.supportReserve)
    .flatMap((action) => {
      if (action.target === "none") return [{ actionId: action.actionId }];
      if (action.target === "fixed_alpha") return alphaActive ? [{ actionId: action.actionId, targetCorridorId: "corridor_alpha_east" as const }] : [];
      return active.map((targetCorridorId) => ({ actionId: action.actionId, targetCorridorId }));
    });
};

const traceText = (trace: readonly ReachabilityTraceStep[]): string => JSON.stringify(trace);

export function runStructuredReachabilitySearch(): StructuredReachabilityResult {
  const targetIds = ["priority_delivered_network_degradation", "mission_incomplete_continuity_preserved"] as const;
  const representativeEnvironments: { worldId: WorldId; environmentSeed: number; latencyVariant: string }[] = [];
  for (const world of WORLD_CATALOG) {
    const firstByVariant = new Map<string, number>();
    for (let seed = 1; seed <= 64 && firstByVariant.size < 3; seed += 1) {
      const variant = createInitialMissionState(world.worldId, seed).trueWorldState.latencyVariant;
      if (!firstByVariant.has(variant)) firstByVariant.set(variant, seed);
    }
    for (const latencyVariant of ["early", "nominal", "late"]) {
      const environmentSeed = firstByVariant.get(latencyVariant);
      if (environmentSeed !== undefined) representativeEnvironments.push({ worldId: world.worldId, environmentSeed, latencyVariant });
    }
  }

  const witnesses: ReachabilityWitness[] = [];
  let searchesExecuted = 0;
  let branchesApplied = 0;
  let uniqueStatesGenerated = 0;
  let retainedStates = 0;
  let maximumBeamWidth = 0;
  let boundaryA: { value: number; worldId: WorldId; seed: number; trace: readonly ReachabilityTraceStep[] } | null = null;
  let boundaryBArrival: { value: number; worldId: WorldId; seed: number; trace: readonly ReachabilityTraceStep[] } | null = null;
  let boundaryBDelay: { value: number; worldId: WorldId; seed: number; trace: readonly ReachabilityTraceStep[] } | null = null;
  let boundaryC: { value: number; worldId: WorldId; seed: number; trace: readonly ReachabilityTraceStep[] } | null = null;

  const inspectBoundary = (state: Scenario5MissionState, worldId: WorldId, seed: number, trace: readonly ReachabilityTraceStep[]): void => {
    const a = alpha(state);
    const alphaArrival = arrival(a);
    if (a.integrity >= 55 && alphaArrival <= 360) {
      const continuity = resolveMissionEndState(state).networkContinuityPercent;
      if (boundaryA === null || continuity < boundaryA.value) boundaryA = { value: continuity, worldId, seed, trace };
    }
    if (a.integrity >= 55 && secondaryOnTime(state) >= 3) {
      if (boundaryBArrival === null || alphaArrival > boundaryBArrival.value) boundaryBArrival = { value: alphaArrival, worldId, seed, trace };
      if (boundaryBDelay === null || a.delayMinutes > boundaryBDelay.value) boundaryBDelay = { value: a.delayMinutes, worldId, seed, trace };
    }
    if (a.integrity >= 55 && (boundaryC === null || alphaArrival > boundaryC.value)) boundaryC = { value: alphaArrival, worldId, seed, trace };
  };

  for (const targetId of targetIds) {
    const targetPrimaryCorridors: readonly CorridorId[] = targetId === "priority_delivered_network_degradation"
      ? ["corridor_beta_south", "corridor_gamma_northwest", "corridor_delta_west"]
      : ["corridor_alpha_east"];
    const worlds = WORLD_CATALOG.filter(({ primaryAffectedCorridorId }) => targetPrimaryCorridors.includes(primaryAffectedCorridorId));
    for (const world of worlds) {
      for (const environment of representativeEnvironments.filter(({ worldId }) => worldId === world.worldId)) {
        searchesExecuted += 1;
        const initialState = createInitialMissionState(world.worldId, environment.environmentSeed);
        let beam: SearchNode[] = [{ state: initialState, trace: [], key: missionReachabilityStateKey(initialState) }];
        let found: ReachabilityWitness | null = null;
        for (let depth = 1; depth <= 8 && found === null; depth += 1) {
          const deduplicated = new Map<string, SearchNode>();
          for (const node of beam) {
            for (const selection of selections(node.state)) {
              const step = applyMissionDecision(node.state, selection);
              branchesApplied += 1;
              const nextTrace = [...node.trace, { actionId: selection.actionId, targetCorridorId: selection.targetCorridorId ?? null }];
              if (step.state.completed) {
                inspectBoundary(step.state, world.worldId, environment.environmentSeed, nextTrace);
                const end = step.endState ?? resolveMissionEndState(step.state);
                if (end.endStateId === targetId) {
                  found = { endStateId: targetId, worldId: world.worldId, environmentSeed: environment.environmentSeed, latencyVariant: environment.latencyVariant, trace: nextTrace, finalState: step.state };
                  break;
                }
              } else {
                const key = missionReachabilityStateKey(step.state);
                const searchState = { ...step.state, missionEvents: [] };
                if (!deduplicated.has(key)) deduplicated.set(key, { state: searchState, trace: nextTrace, key });
              }
            }
            if (found) break;
          }
          if (found) break;
          uniqueStatesGenerated += deduplicated.size;
          const ranked = [...deduplicated.values()].sort(targetId === "priority_delivered_network_degradation" ? comparePriority : compareIncomplete);
          beam = ranked.slice(0, STRUCTURED_SEARCH_BEAM_LIMIT);
          retainedStates += beam.length;
          maximumBeamWidth = Math.max(maximumBeamWidth, beam.length);
        }
        if (found) witnesses.push(found);
      }
    }
  }

  const boundaryRow = (
    boundaryId: ReachabilityBoundaryRow["boundaryId"],
    metric: string,
    item: { value: number; worldId: WorldId; seed: number; trace: readonly ReachabilityTraceStep[] } | null,
  ): ReachabilityBoundaryRow => ({
    boundaryId,
    metric,
    value: item?.value ?? null,
    worldId: item?.worldId ?? "",
    environmentSeed: item?.seed ?? null,
    trace: item ? traceText(item.trace) : "",
  });
  return {
    witnesses,
    boundaries: [
      boundaryRow("A", "minimumNetworkContinuityWithAlphaDelivered", boundaryA),
      boundaryRow("B_projected_arrival", "maximumAlphaProjectedArrivalMinute", boundaryBArrival),
      boundaryRow("B_delay", "maximumAlphaDelayMinutes", boundaryBDelay),
      boundaryRow("C", "maximumAlphaProjectedArrivalMinuteWithIntegrityAtLeast55", boundaryC),
    ],
    representativeEnvironments,
    searchesExecuted,
    branchesApplied,
    uniqueStatesGenerated,
    retainedStates,
    maximumBeamWidth,
    targetIds,
    missionEventsMechanicsAudit: MISSION_EVENTS_MECHANICS_AUDIT,
  };
}
