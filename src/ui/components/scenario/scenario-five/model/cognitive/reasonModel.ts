import type { MissionActionId } from "../mission/types";
import { getScenario5OptionProfile } from "./optionProfiles";
import type { OptionCognitiveProfile, ReasonId } from "./types";

const domain = (profile: OptionCognitiveProfile, key: keyof OptionCognitiveProfile["domainSalience"]): number =>
  profile.domainSalience[key] ?? 0;

export function calculateReasonAlignment(actionId: MissionActionId, reasonId: ReasonId): number {
  const item = getScenario5OptionProfile(actionId);
  switch (reasonId) {
    case "reason_mission_speed":
      return 0.45 * item.operationalLoading + 0.35 * domain(item, "mission") + 0.2 * item.riskExposure;
    case "reason_reduce_exposure":
      return 0.35 * (1 - item.riskExposure) + 0.25 * domain(item, "navigation")
        + 0.2 * item.contingencyPlanning + 0.2 * item.reversibilityPreference;
    case "reason_preserve_resources":
      return 0.6 * item.resourceStewardship + 0.25 * item.futureConsequenceThinking + 0.15 * item.reversibilityPreference;
    case "reason_network_continuity":
      return 0.4 * domain(item, "network") + 0.25 * domain(item, "logistics")
        + 0.2 * item.strategicLoading + 0.15 * item.contingencyPlanning;
    case "reason_information_confidence":
      return 0.6 * item.informationSeeking + 0.25 * domain(item, "information") + 0.15 * item.reversibilityPreference;
    case "reason_limit_actor_reaction":
      return 0.4 * item.adversaryModeling + 0.35 * item.escalationSensitivity + 0.25 * item.reversibilityPreference;
    case "reason_preserve_reversibility":
      return 0.5 * item.reversibilityPreference + 0.3 * item.contingencyPlanning + 0.2 * item.futureConsequenceThinking;
  }
}

const B_MATRIX: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  b1_suspect_focus: { b2_continue_crosscheck: 1, b2_reroute: .75, b2_staged_checkpoints: .75, b2_hold_verify: 1 },
  b1_priority_cargo: { b2_continue_crosscheck: .75, b2_reroute: .75, b2_staged_checkpoints: .5, b2_hold_verify: .5 },
  b1_split_attention: { b2_continue_crosscheck: .75, b2_reroute: .5, b2_staged_checkpoints: 1, b2_hold_verify: .75 },
  b1_pulse_network: { b2_continue_crosscheck: 1, b2_reroute: .5, b2_staged_checkpoints: .75, b2_hold_verify: .75 },
};
const C_MATRIX: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  c1_fallback_nav: { c2_isr_heavy: .5, c2_mobility_heavy: 1, c2_balanced: 1, c2_priority_surge: .75 },
  c1_ground_recon: { c2_isr_heavy: 1, c2_mobility_heavy: .75, c2_balanced: 1, c2_priority_surge: .5 },
  c1_checkpoint_spacing: { c2_isr_heavy: .5, c2_mobility_heavy: 1, c2_balanced: 1, c2_priority_surge: .5 },
  c1_preserve_mobile_reserve: { c2_isr_heavy: .75, c2_mobility_heavy: .5, c2_balanced: 1, c2_priority_surge: .25 },
};
const D_MATRIX: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  d1_emergency_reroute: { d2_critical_delivery_surge: .75, d2_network_balanced_finish: .75, d2_resilient_handoff: 1, d2_continuity_first_finish: .75 },
  d1_ground_containment: { d2_critical_delivery_surge: .75, d2_network_balanced_finish: 1, d2_resilient_handoff: .5, d2_continuity_first_finish: .75 },
  d1_deception_routing: { d2_critical_delivery_surge: .5, d2_network_balanced_finish: .75, d2_resilient_handoff: .75, d2_continuity_first_finish: 1 },
  d1_escorted_continuation: { d2_critical_delivery_surge: 1, d2_network_balanced_finish: .75, d2_resilient_handoff: .5, d2_continuity_first_finish: .5 },
  d1_hold_confirm: { d2_critical_delivery_surge: .5, d2_network_balanced_finish: .75, d2_resilient_handoff: 1, d2_continuity_first_finish: .75 },
};

export function getCrossDecisionCoherence(
  phaseId: "B" | "C" | "D",
  firstActionId: MissionActionId,
  secondActionId: MissionActionId,
): number | null {
  const matrix = phaseId === "B" ? B_MATRIX : phaseId === "C" ? C_MATRIX : D_MATRIX;
  return matrix[firstActionId]?.[secondActionId] ?? null;
}

export const CROSS_DECISION_COHERENCE_MATRICES = { B: B_MATRIX, C: C_MATRIX, D: D_MATRIX } as const;
