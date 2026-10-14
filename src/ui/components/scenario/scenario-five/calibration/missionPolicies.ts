import { CANONICAL_CORRIDORS } from "../model/index";
import type { CorridorId } from "../model/index";
import type { EvidenceTelemetry } from "../model/cognitive/index";
import { getMissionAction } from "../model/mission/index";
import type { MissionActionId, MissionConvoyState } from "../model/mission/index";
import type { Scenario5RuntimeState } from "../model/runtime/index";
import type { CalibrationPolicy, MissionPolicyId, TargetSelectorId } from "./types";

const CANONICAL_CORRIDOR_IDS = CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId);

const actions = (...entries: readonly MissionActionId[]): Readonly<Record<number, MissionActionId>> =>
  Object.fromEntries(entries.map((actionId, index) => [index + 1, actionId]));
const targets = (entries: Readonly<Record<number, TargetSelectorId>>): Readonly<Record<number, TargetSelectorId>> => entries;

const deterministic = (
  policyId: MissionPolicyId,
  requestedActionByRound: Readonly<Record<number, MissionActionId>>,
  targetSelectorByRound: Readonly<Record<number, TargetSelectorId>>,
  options: Partial<Pick<CalibrationPolicy, "oraclePolicy" | "stressPolicy" | "evidenceBehavior">> = {},
): CalibrationPolicy => ({
  policyId,
  requestedActionByRound,
  targetSelectorByRound,
  oraclePolicy: options.oraclePolicy ?? false,
  stressPolicy: options.stressPolicy ?? false,
  randomPolicy: false,
  evidenceBehavior: options.evidenceBehavior ?? "none",
  beliefBehavior: "neutral",
  reasonBehavior: "neutral",
});

export const MISSION_POLICIES: readonly CalibrationPolicy[] = [
  deterministic("balanced_network", actions("a1_network_baseline", "a2_broad_sweep", "b1_split_attention", "b2_staged_checkpoints", "c1_checkpoint_spacing", "c2_balanced", "d1_hold_confirm", "d2_network_balanced_finish"), targets({ 4: "leastProtectedPlayerVisibleTarget", 5: "leastProtectedPlayerVisibleTarget", 7: "mostSupportedVisibleTarget" })),
  deterministic("priority_alpha", actions("a1_priority_focus", "a2_focused_pnt", "b1_priority_cargo", "b2_continue_crosscheck", "c1_fallback_nav", "c2_priority_surge", "d1_escorted_continuation", "d2_critical_delivery_surge"), targets({ 2: "alphaIfActiveElseFirst", 4: "alphaIfActiveElseFirst", 5: "alphaIfActiveElseFirst", 7: "alphaIfActiveElseFirst" })),
  deterministic("information_heavy", actions("a1_network_baseline", "a2_broad_sweep", "b1_split_attention", "b2_hold_verify", "c1_ground_recon", "c2_isr_heavy", "d1_hold_confirm", "d2_resilient_handoff"), targets({ 4: "mostSupportedVisibleTarget", 5: "mostSupportedVisibleTarget", 7: "mostSupportedVisibleTarget" }), { evidenceBehavior: "all" }),
  deterministic("mobility_resilience", actions("a1_preserve_reserve", "a2_field_radio", "b1_pulse_network", "b2_continue_crosscheck", "c1_fallback_nav", "c2_mobility_heavy", "d1_emergency_reroute", "d2_network_balanced_finish"), targets({ 2: "firstActiveTarget", 4: "leastProtectedPlayerVisibleTarget", 5: "leastProtectedPlayerVisibleTarget", 7: "leastProtectedPlayerVisibleTarget" })),
  deterministic("resource_preserver", actions("a1_preserve_reserve", "a2_field_radio", "b1_pulse_network", "b2_continue_crosscheck", "c1_preserve_mobile_reserve", "c2_balanced", "d1_hold_confirm", "d2_continuity_first_finish"), targets({ 2: "firstActiveTarget", 4: "firstActiveTarget", 7: "firstActiveTarget" })),
  deterministic("high_response", actions("a1_network_baseline", "a2_ground_liaison", "b1_suspect_focus", "b2_reroute", "c1_ground_recon", "c2_mobility_heavy", "d1_ground_containment", "d2_critical_delivery_surge"), targets({ 2: "mostSupportedVisibleTarget", 4: "mostSupportedVisibleTarget", 5: "mostSupportedVisibleTarget", 7: "mostSupportedVisibleTarget" })),
  deterministic("low_response_reversible", actions("a1_preserve_reserve", "a2_field_radio", "b1_pulse_network", "b2_continue_crosscheck", "c1_fallback_nav", "c2_balanced", "d1_hold_confirm", "d2_resilient_handoff"), targets({ 2: "firstActiveTarget", 4: "firstActiveTarget", 5: "firstActiveTarget", 7: "mostSupportedVisibleTarget" })),
  deterministic("oracle_primary_ceiling", actions("a1_network_baseline", "a2_focused_pnt", "b1_suspect_focus", "b2_staged_checkpoints", "c1_ground_recon", "c2_balanced", "d1_ground_containment", "d2_network_balanced_finish"), targets({ 2: "oraclePrimaryTarget", 4: "oraclePrimaryTarget", 5: "oraclePrimaryTarget", 7: "oraclePrimaryTarget" }), { oraclePolicy: true }),
  deterministic("wrong_corridor_stress", actions("a1_priority_focus", "a2_focused_pnt", "b1_suspect_focus", "b2_reroute", "c1_fallback_nav", "c2_priority_surge", "d1_escorted_continuation", "d2_critical_delivery_surge"), targets({ 2: "wrongPrimaryTarget", 4: "wrongPrimaryTarget", 5: "wrongPrimaryTarget", 7: "wrongPrimaryTarget" }), { stressPolicy: true }),
  { policyId: "M10_uniform_random", oraclePolicy: false, stressPolicy: false, randomPolicy: true, evidenceBehavior: "random_half", beliefBehavior: "neutral", reasonBehavior: "neutral", chooseAction: ({ availableActionIds, rng }) => availableActionIds[rng.pickIndex(availableActionIds.length)]! },
] as const;

export const BALANCED_CONTINUATION_POLICY = MISSION_POLICIES[0]!;
export const WITNESS_RANDOM_POLICY: CalibrationPolicy = {
  policyId: "witness_random", oraclePolicy: false, stressPolicy: false, randomPolicy: true,
  evidenceBehavior: "none", beliefBehavior: "neutral", reasonBehavior: "neutral",
  chooseAction: ({ availableActionIds, rng }) => availableActionIds[rng.pickIndex(availableActionIds.length)]!,
};

export const activeCorridorIds = (state: Scenario5RuntimeState): readonly CorridorId[] =>
  CANONICAL_CORRIDOR_IDS.filter((corridorId) => state.missionState.convoys.some((convoy) => convoy.corridorId === corridorId && convoy.status !== "delivered"));

export const firstActiveTarget = (state: Scenario5RuntimeState): CorridorId =>
  activeCorridorIds(state)[0] ?? "corridor_alpha_east";

export const alphaIfActiveElseFirst = (state: Scenario5RuntimeState): CorridorId =>
  activeCorridorIds(state).includes("corridor_alpha_east") ? "corridor_alpha_east" : firstActiveTarget(state);

const protectionScore = (convoy: MissionConvoyState, roundId: number): number =>
  2 * Number(convoy.fallbackNav) + 2 * Number(convoy.routeHardened) + 2 * Number(convoy.groundSupport)
  + Number(convoy.escortedUntilRound !== null && convoy.escortedUntilRound >= roundId);

export const leastProtectedPlayerVisibleTarget = (state: Scenario5RuntimeState): CorridorId => {
  const active = state.missionState.convoys.filter(({ status }) => status !== "delivered");
  if (active.length === 0) return "corridor_alpha_east";
  return [...active].sort((left, right) => protectionScore(left, state.missionState.currentRound) - protectionScore(right, state.missionState.currentRound)
    || CANONICAL_CORRIDOR_IDS.indexOf(left.corridorId) - CANONICAL_CORRIDOR_IDS.indexOf(right.corridorId))[0]!.corridorId;
};

const strength = { weak: .25, moderate: .60, strong: .90 } as const;
const direction = { supports_targeted: 1, ambiguous: 0, supports_nonhostile: -1 } as const;
export const mostSupportedVisibleTarget = (state: Scenario5RuntimeState): CorridorId => {
  const active = new Set(activeCorridorIds(state));
  const evidenceByCorridor = new Map<CorridorId, Map<string, number>>();
  for (const item of state.evidence as readonly EvidenceTelemetry[]) {
    if (item.observedCorridorId === null || !active.has(item.observedCorridorId)) continue;
    const signed = strength[item.strengthBand] * direction[item.direction];
    const sources = evidenceByCorridor.get(item.observedCorridorId) ?? new Map<string, number>();
    const previous = sources.get(item.sourceType);
    if (previous === undefined || Math.abs(signed) > Math.abs(previous)) sources.set(item.sourceType, signed);
    evidenceByCorridor.set(item.observedCorridorId, sources);
  }
  if (evidenceByCorridor.size === 0) return firstActiveTarget(state);
  return [...active].sort((left, right) => {
    const score = (id: CorridorId): number => {
      const values = [...(evidenceByCorridor.get(id)?.values() ?? [])];
      return values.length === 0 ? Number.NEGATIVE_INFINITY : values.reduce((sum, value) => sum + value, 0) / values.length;
    };
    return score(right) - score(left) || CANONICAL_CORRIDOR_IDS.indexOf(left) - CANONICAL_CORRIDOR_IDS.indexOf(right);
  })[0] ?? firstActiveTarget(state);
};

export function selectTarget(selectorId: TargetSelectorId, state: Scenario5RuntimeState): CorridorId {
  if (selectorId === "firstActiveTarget") return firstActiveTarget(state);
  if (selectorId === "alphaIfActiveElseFirst") return alphaIfActiveElseFirst(state);
  if (selectorId === "leastProtectedPlayerVisibleTarget") return leastProtectedPlayerVisibleTarget(state);
  if (selectorId === "mostSupportedVisibleTarget") return mostSupportedVisibleTarget(state);
  if (selectorId === "oraclePrimaryTarget") return activeCorridorIds(state).includes(state.missionState.trueWorldState.primaryAffectedCorridorId)
    ? state.missionState.trueWorldState.primaryAffectedCorridorId : firstActiveTarget(state);
  const primary = state.missionState.trueWorldState.primaryAffectedCorridorId;
  return activeCorridorIds(state).find((corridorId) => corridorId !== primary) ?? firstActiveTarget(state);
}

export function defaultTargetForAction(actionId: MissionActionId, state: Scenario5RuntimeState): CorridorId | null {
  const target = getMissionAction(actionId).target;
  if (target === "none") return null;
  if (target === "fixed_alpha") return "corridor_alpha_east";
  return firstActiveTarget(state);
}
