import { CANONICAL_CORRIDORS } from "../model/index";
import type { CorridorId } from "../model/index";
import { adjustedOrientationForDecision } from "../model/cognitive/index";
import type { DecisionTelemetry } from "../model/cognitive/index";
import { MISSION_ACTION_CATALOG, getMissionAction } from "../model/mission/index";
import type { MissionActionId } from "../model/mission/index";
import { getRuntimeAvailableActionIds } from "../model/runtime/index";
import type { Scenario5RuntimeState } from "../model/runtime/index";
import { quantile, round } from "./auditMetrics";
import { simulateScenario5 } from "./simulationDriver";
import type { CalibrationPolicy, MissionRunRow, SimulationRun } from "./types";

const OSI_WINDOWS = new Set([
  "A1_baseline_monitoring", "B1_monitoring_allocation", "B2_route_policy",
  "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response",
  "D2_final_delivery_policy",
]);

export const missionEffectivePolicySeed = (
  worldIndex: number,
  environmentSeed: number,
  basePolicySeed: number,
): number => 0x4d000000 + ((worldIndex * 64 + (environmentSeed - 1)) * 16 + (basePolicySeed - 1001));

export const cognitiveEffectivePolicySeed = (
  worldIndex: number,
  environmentSeed: number,
  basePolicySeed: number,
): number => 0x43000000 + ((worldIndex * 16 + (environmentSeed - 1)) * 16 + (basePolicySeed - 2001));

export interface StructuralOsiRow {
  readonly windowId: string;
  readonly availableActionSetKey: string;
  readonly optionCount: number;
  readonly meanAdjustedOrientation: number | null;
  readonly diagnostic: boolean;
  readonly pass: boolean;
}

export class StructuralOsiCollector {
  private readonly decisions = new Map<string, DecisionTelemetry>();

  addRun(run: SimulationRun): void {
    for (const decision of run.cognitiveBundle.decisions) {
      if (!OSI_WINDOWS.has(decision.windowId)) continue;
      const actionSet = [...new Set(decision.availableActionIds)].sort();
      const key = `${decision.windowId}|${actionSet.join("|")}`;
      if (!this.decisions.has(key)) this.decisions.set(key, { ...decision, availableActionIds: actionSet });
    }
  }

  rows(): readonly StructuralOsiRow[] {
    return [...this.decisions.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, decision]) => {
      const values = decision.availableActionIds.map((actionId) => adjustedOrientationForDecision({
        ...decision,
        firstSelectedActionId: actionId,
        finalSelectedActionId: actionId,
      }));
      const numeric = values.filter((value): value is number => value !== null);
      const diagnostic = numeric.length === decision.availableActionIds.length && numeric.length >= 2;
      const average = diagnostic ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null;
      return {
        windowId: decision.windowId,
        availableActionSetKey: decision.availableActionIds.join("|"),
        optionCount: decision.availableActionIds.length,
        meanAdjustedOrientation: average === null ? null : round(average, 15),
        diagnostic,
        pass: !diagnostic || Math.abs(average!) <= 1e-12,
      };
    });
  }
}

export interface ExplicitTargetProbeRow {
  readonly actionId: MissionActionId;
  readonly corridorId: CorridorId;
  readonly roundId: number;
  readonly probeStateFound: boolean;
  readonly actionAvailable: boolean;
  readonly targetActive: boolean;
  readonly commitSucceeded: boolean;
  readonly structuralTickAdvanced: boolean;
  readonly classification: "observed_in_main_audit" | "verified_by_explicit_legal_probe" | "not_observed_as_legal" | "probe_failed";
}

export function runExplicitTargetProbes(
  candidates: ReadonlyMap<string, Scenario5RuntimeState>,
  observedPairs: ReadonlySet<string>,
  continuationPolicy: CalibrationPolicy,
): readonly ExplicitTargetProbeRow[] {
  const rows: ExplicitTargetProbeRow[] = [];
  for (const action of MISSION_ACTION_CATALOG.filter(({ target }) => target === "required")) {
    for (const { corridorId } of CANONICAL_CORRIDORS) {
      const pairKey = `${action.actionId}:${corridorId}`;
      const state = candidates.get(pairKey);
      const actionAvailable = state ? getRuntimeAvailableActionIds(state).includes(action.actionId) : false;
      const targetActive = state ? state.missionState.convoys.some((convoy) => convoy.corridorId === corridorId && convoy.status !== "delivered") : false;
      let commitSucceeded = false;
      let structuralTickAdvanced = false;
      if (state && actionAvailable && targetActive
        && state.missionState.resources.isrCapacity >= action.isrCost
        && state.missionState.resources.supportReserve >= action.supportCost) {
        try {
          const beforeTick = state.missionState.trueWorldState.worldClockTick;
          const run = simulateScenario5({
            policy: continuationPolicy,
            worldId: state.missionState.trueWorldState.worldId,
            environmentSeed: state.missionState.trueWorldState.seed,
            policySeed: 0,
            initialState: state,
            forcedFirstChoice: { actionId: action.actionId, targetCorridorId: corridorId },
          });
          const first = run.decisionTrace[0];
          commitSucceeded = first?.actualActionId === action.actionId && first.targetCorridorId === corridorId;
          structuralTickAdvanced = run.state.missionState.trueWorldState.worldClockTick > beforeTick;
        } catch {
          commitSucceeded = false;
        }
      }
      const legal = Boolean(state && actionAvailable && targetActive);
      const classification = !legal ? "not_observed_as_legal"
        : !commitSucceeded || !structuralTickAdvanced ? "probe_failed"
        : observedPairs.has(pairKey) ? "observed_in_main_audit"
        : "verified_by_explicit_legal_probe";
      rows.push({
        actionId: action.actionId,
        corridorId,
        roundId: action.roundId,
        probeStateFound: state !== undefined,
        actionAvailable,
        targetActive,
        commitSucceeded,
        structuralTickAdvanced,
        classification,
      });
    }
  }
  return rows;
}

export function collectExplicitProbeCandidates(
  state: Scenario5RuntimeState,
  candidates: Map<string, Scenario5RuntimeState>,
): void {
  const available = new Set(getRuntimeAvailableActionIds(state));
  const active = state.missionState.convoys.filter(({ status }) => status !== "delivered").map(({ corridorId }) => corridorId);
  for (const action of MISSION_ACTION_CATALOG.filter(({ target, actionId }) => target === "required" && available.has(actionId))) {
    for (const corridorId of active) {
      const key = `${action.actionId}:${corridorId}`;
      if (!candidates.has(key)) candidates.set(key, state);
    }
  }
}

export function observedRequiredPairs(runs: readonly Pick<SimulationRun, "decisionTrace">[]): ReadonlySet<string> {
  return new Set(runs.flatMap(({ decisionTrace }) => decisionTrace)
    .filter(({ targetCorridorId, actualActionId }) => targetCorridorId !== null && getMissionAction(actualActionId).target === "required")
    .map(({ actualActionId, targetCorridorId }) => `${actualActionId}:${targetCorridorId}`));
}

export function resourceAvailabilitySummary(rows: readonly MissionRunRow[]): Readonly<Record<string, unknown>> {
  const minimumCounts = [...new Set(rows.map(({ minimumAvailableActionCount }) => minimumAvailableActionCount))]
    .sort((left, right) => left - right)
    .map((count) => ({ count, runs: rows.filter(({ minimumAvailableActionCount }) => minimumAvailableActionCount === count).length }));
  const summarize = (values: readonly number[]) => ({
    p05: round(quantile(values, .05)), p25: round(quantile(values, .25)), median: round(quantile(values, .5)),
    p75: round(quantile(values, .75)), p95: round(quantile(values, .95)),
  });
  return {
    minimumAvailableActionCountDistribution: minimumCounts,
    finalIsr: summarize(rows.map(({ finalIsr }) => finalIsr)),
    finalSupport: summarize(rows.map(({ finalSupport }) => finalSupport)),
  };
}
