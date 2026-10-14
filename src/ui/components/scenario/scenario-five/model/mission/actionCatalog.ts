import type { MissionActionConfig, MissionActionId } from "./types";

type ActionInput = Pick<MissionActionConfig,
  "actionId" | "roundId" | "phaseId" | "decisionWindowId" | "target" | "isrCost" | "supportCost" |
  "durationMinutes" | "delayEffect" | "evidence"
> & Partial<Pick<MissionActionConfig,
  "responseIntensity" | "activatesFallback" | "hardensRoute" | "groundReconVisible" |
  "containmentVisible" | "priorityConvoyConcentration" | "visibleReroute" | "grantsGroundSupport" |
  "holdsForStep" | "escortThroughRound" | "temporaryProtection"
>>;

const action = (input: ActionInput): MissionActionConfig => ({
  responseIntensity: "low",
  activatesFallback: false,
  hardensRoute: false,
  groundReconVisible: false,
  containmentVisible: false,
  priorityConvoyConcentration: false,
  visibleReroute: false,
  grantsGroundSupport: false,
  holdsForStep: false,
  escortThroughRound: null,
  temporaryProtection: "none",
  ...input,
});

const none = { kind: "none" } as const;
const evidence = (requestKind: NonNullable<MissionActionConfig["evidence"]>["requestKind"], timing: "immediate" | "pending", target: "none" | "effective_target") => ({ requestKind, timing, target }) as const;

export const MISSION_ACTION_CATALOG: readonly MissionActionConfig[] = [
  action({ actionId: "a1_network_baseline", roundId: 1, phaseId: "A", decisionWindowId: "A1_baseline_monitoring", target: "none", isrCost: 16, supportCost: 0, durationMinutes: 10, delayEffect: none, evidence: evidence("broad_pnt_sweep", "immediate", "none") }),
  action({ actionId: "a1_priority_focus", roundId: 1, phaseId: "A", decisionWindowId: "A1_baseline_monitoring", target: "fixed_alpha", isrCost: 10, supportCost: 0, durationMinutes: 8, delayEffect: none, evidence: evidence("focused_pnt_analysis", "immediate", "effective_target"), priorityConvoyConcentration: true }),
  action({ actionId: "a1_rotating_watch", roundId: 1, phaseId: "A", decisionWindowId: "A1_baseline_monitoring", target: "none", isrCost: 12, supportCost: 0, durationMinutes: 10, delayEffect: none, evidence: evidence("field_radio_corroboration", "immediate", "none") }),
  action({ actionId: "a1_preserve_reserve", roundId: 1, phaseId: "A", decisionWindowId: "A1_baseline_monitoring", target: "none", isrCost: 0, supportCost: 0, durationMinutes: 5, delayEffect: none, evidence: null }),

  action({ actionId: "a2_focused_pnt", roundId: 2, phaseId: "A", decisionWindowId: "A2_evidence_acquisition", target: "required", isrCost: 14, supportCost: 0, durationMinutes: 12, delayEffect: none, evidence: evidence("focused_pnt_analysis", "immediate", "effective_target") }),
  action({ actionId: "a2_broad_sweep", roundId: 2, phaseId: "A", decisionWindowId: "A2_evidence_acquisition", target: "none", isrCost: 22, supportCost: 0, durationMinutes: 18, delayEffect: none, evidence: evidence("broad_pnt_sweep", "immediate", "none") }),
  action({ actionId: "a2_field_radio", roundId: 2, phaseId: "A", decisionWindowId: "A2_evidence_acquisition", target: "required", isrCost: 0, supportCost: 4, durationMinutes: 15, delayEffect: none, evidence: evidence("field_radio_corroboration", "immediate", "effective_target") }),
  action({ actionId: "a2_ground_liaison", roundId: 2, phaseId: "A", decisionWindowId: "A2_evidence_acquisition", target: "required", isrCost: 0, supportCost: 12, durationMinutes: 20, delayEffect: none, evidence: evidence("ground_liaison", "pending", "effective_target"), groundReconVisible: true }),

  action({ actionId: "b1_suspect_focus", roundId: 3, phaseId: "B", decisionWindowId: "B1_monitoring_allocation", target: "required", isrCost: 12, supportCost: 0, durationMinutes: 10, delayEffect: none, evidence: evidence("focused_pnt_analysis", "immediate", "effective_target") }),
  action({ actionId: "b1_priority_cargo", roundId: 3, phaseId: "B", decisionWindowId: "B1_monitoring_allocation", target: "fixed_alpha", isrCost: 10, supportCost: 0, durationMinutes: 8, delayEffect: none, evidence: evidence("focused_pnt_analysis", "immediate", "effective_target"), priorityConvoyConcentration: true }),
  action({ actionId: "b1_split_attention", roundId: 3, phaseId: "B", decisionWindowId: "B1_monitoring_allocation", target: "none", isrCost: 16, supportCost: 0, durationMinutes: 12, delayEffect: none, evidence: evidence("broad_pnt_sweep", "immediate", "none") }),
  action({ actionId: "b1_pulse_network", roundId: 3, phaseId: "B", decisionWindowId: "B1_monitoring_allocation", target: "none", isrCost: 8, supportCost: 0, durationMinutes: 8, delayEffect: none, evidence: evidence("field_radio_corroboration", "immediate", "none") }),

  action({ actionId: "b2_continue_crosscheck", roundId: 4, phaseId: "B", decisionWindowId: "B2_route_policy", target: "required", isrCost: 4, supportCost: 8, durationMinutes: 8, delayEffect: { kind: "target", minutes: 5 }, evidence: evidence("field_radio_corroboration", "immediate", "effective_target"), activatesFallback: true }),
  action({ actionId: "b2_reroute", roundId: 4, phaseId: "B", decisionWindowId: "B2_route_policy", target: "required", isrCost: 0, supportCost: 14, durationMinutes: 20, delayEffect: { kind: "target", minutes: 25 }, evidence: null, hardensRoute: true, visibleReroute: true, responseIntensity: "medium" }),
  action({ actionId: "b2_staged_checkpoints", roundId: 4, phaseId: "B", decisionWindowId: "B2_route_policy", target: "required", isrCost: 0, supportCost: 10, durationMinutes: 16, delayEffect: { kind: "target", minutes: 15 }, evidence: evidence("field_radio_corroboration", "immediate", "effective_target"), hardensRoute: true }),
  action({ actionId: "b2_hold_verify", roundId: 4, phaseId: "B", decisionWindowId: "B2_route_policy", target: "required", isrCost: 6, supportCost: 0, durationMinutes: 25, delayEffect: { kind: "target", minutes: 30 }, evidence: evidence("focused_pnt_analysis", "immediate", "effective_target"), holdsForStep: true }),

  action({ actionId: "c1_fallback_nav", roundId: 5, phaseId: "C", decisionWindowId: "C1_support_and_checkpoints", target: "required", isrCost: 0, supportCost: 14, durationMinutes: 12, delayEffect: { kind: "target", minutes: 5 }, evidence: null, activatesFallback: true }),
  action({ actionId: "c1_ground_recon", roundId: 5, phaseId: "C", decisionWindowId: "C1_support_and_checkpoints", target: "required", isrCost: 0, supportCost: 18, durationMinutes: 20, delayEffect: { kind: "target", minutes: 10 }, evidence: evidence("ground_liaison", "pending", "effective_target"), groundReconVisible: true, grantsGroundSupport: true, responseIntensity: "medium" }),
  action({ actionId: "c1_checkpoint_spacing", roundId: 5, phaseId: "C", decisionWindowId: "C1_support_and_checkpoints", target: "required", isrCost: 0, supportCost: 10, durationMinutes: 15, delayEffect: { kind: "target", minutes: 10 }, evidence: evidence("field_radio_corroboration", "immediate", "effective_target"), hardensRoute: true }),
  action({ actionId: "c1_preserve_mobile_reserve", roundId: 5, phaseId: "C", decisionWindowId: "C1_support_and_checkpoints", target: "none", isrCost: 0, supportCost: 0, durationMinutes: 5, delayEffect: { kind: "all", minutes: 0 }, evidence: null }),

  action({ actionId: "c2_isr_heavy", roundId: 6, phaseId: "C", decisionWindowId: "C2_resource_portfolio", target: "none", isrCost: 18, supportCost: 4, durationMinutes: 10, delayEffect: none, evidence: evidence("broad_pnt_sweep", "immediate", "none") }),
  action({ actionId: "c2_mobility_heavy", roundId: 6, phaseId: "C", decisionWindowId: "C2_resource_portfolio", target: "none", isrCost: 4, supportCost: 18, durationMinutes: 10, delayEffect: none, evidence: null, temporaryProtection: "all_level_2" }),
  action({ actionId: "c2_balanced", roundId: 6, phaseId: "C", decisionWindowId: "C2_resource_portfolio", target: "none", isrCost: 10, supportCost: 10, durationMinutes: 10, delayEffect: none, evidence: evidence("field_radio_corroboration", "immediate", "none"), temporaryProtection: "all_level_1_round7" }),
  action({ actionId: "c2_priority_surge", roundId: 6, phaseId: "C", decisionWindowId: "C2_resource_portfolio", target: "fixed_alpha", isrCost: 12, supportCost: 20, durationMinutes: 10, delayEffect: none, evidence: evidence("focused_pnt_analysis", "immediate", "effective_target"), temporaryProtection: "priority_surge", priorityConvoyConcentration: true }),

  action({ actionId: "d1_emergency_reroute", roundId: 7, phaseId: "D", decisionWindowId: "D1_crisis_response", target: "required", isrCost: 0, supportCost: 16, durationMinutes: 20, delayEffect: { kind: "target", minutes: 20 }, evidence: null, hardensRoute: true, visibleReroute: true, responseIntensity: "medium" }),
  action({ actionId: "d1_ground_containment", roundId: 7, phaseId: "D", decisionWindowId: "D1_crisis_response", target: "required", isrCost: 0, supportCost: 22, durationMinutes: 25, delayEffect: { kind: "target", minutes: 15 }, evidence: evidence("ground_liaison", "pending", "effective_target"), groundReconVisible: true, containmentVisible: true, grantsGroundSupport: true, responseIntensity: "high" }),
  action({ actionId: "d1_deception_routing", roundId: 7, phaseId: "D", decisionWindowId: "D1_crisis_response", target: "required", isrCost: 0, supportCost: 12, durationMinutes: 15, delayEffect: { kind: "target", minutes: 10 }, evidence: null, visibleReroute: true, responseIntensity: "medium" }),
  action({ actionId: "d1_escorted_continuation", roundId: 7, phaseId: "D", decisionWindowId: "D1_crisis_response", target: "required", isrCost: 0, supportCost: 18, durationMinutes: 12, delayEffect: { kind: "target", minutes: 5 }, evidence: evidence("field_radio_corroboration", "immediate", "effective_target"), escortThroughRound: 7, responseIntensity: "medium" }),
  action({ actionId: "d1_hold_confirm", roundId: 7, phaseId: "D", decisionWindowId: "D1_crisis_response", target: "required", isrCost: 8, supportCost: 0, durationMinutes: 20, delayEffect: { kind: "target", minutes: 20 }, evidence: evidence("focused_pnt_analysis", "immediate", "effective_target"), holdsForStep: true }),

  action({ actionId: "d2_critical_delivery_surge", roundId: 8, phaseId: "D", decisionWindowId: "D2_final_delivery_policy", target: "fixed_alpha", isrCost: 0, supportCost: 14, durationMinutes: 12, delayEffect: { kind: "target", minutes: -10 }, evidence: null, escortThroughRound: 8, priorityConvoyConcentration: true, responseIntensity: "high" }),
  action({ actionId: "d2_network_balanced_finish", roundId: 8, phaseId: "D", decisionWindowId: "D2_final_delivery_policy", target: "none", isrCost: 0, supportCost: 10, durationMinutes: 15, delayEffect: { kind: "all", minutes: -5 }, evidence: null, temporaryProtection: "all_level_1_round8", responseIntensity: "medium" }),
  action({ actionId: "d2_resilient_handoff", roundId: 8, phaseId: "D", decisionWindowId: "D2_final_delivery_policy", target: "fixed_alpha", isrCost: 0, supportCost: 12, durationMinutes: 18, delayEffect: { kind: "target", minutes: 5 }, evidence: null, activatesFallback: true }),
  action({ actionId: "d2_continuity_first_finish", roundId: 8, phaseId: "D", decisionWindowId: "D2_final_delivery_policy", target: "none", isrCost: 0, supportCost: 8, durationMinutes: 15, delayEffect: { kind: "continuity_finish" }, evidence: null }),
] as const;

const ACTION_BY_ID = new Map<MissionActionId, MissionActionConfig>(MISSION_ACTION_CATALOG.map((item) => [item.actionId, item]));

export function getMissionAction(actionId: MissionActionId): MissionActionConfig {
  const config = ACTION_BY_ID.get(actionId);
  if (!config) throw new Error(`Unknown mission action: ${actionId}`);
  return config;
}
