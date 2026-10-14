import type { MissionActionId } from "../mission/types";
import type { DomainSalienceId, OptionCognitiveProfile } from "./types";

type ProfileValues = readonly [number, number, number, number, number, number, number, number, number, number];
const profile = (
  actionId: MissionActionId,
  values: ProfileValues,
  domainSalience: Partial<Record<DomainSalienceId, number>>,
): OptionCognitiveProfile => ({
  actionId,
  operationalLoading: values[0], strategicLoading: values[1], informationSeeking: values[2],
  futureConsequenceThinking: values[3], adversaryModeling: values[4], escalationSensitivity: values[5],
  reversibilityPreference: values[6], resourceStewardship: values[7], contingencyPlanning: values[8],
  riskExposure: values[9], domainSalience,
});

export const SCENARIO5_OPTION_PROFILES: readonly OptionCognitiveProfile[] = [
  profile("a1_network_baseline", [.5,.7,.9,.7,.3,.1,.9,.5,.7,.3], { mission:.3, information:.9, futureOptions:.5, network:.7 }),
  profile("a1_priority_focus", [.7,.3,.7,.3,.1,.1,.7,.5,.3,.5], { mission:.9, information:.7, logistics:.5, network:.2 }),
  profile("a1_rotating_watch", [.5,.7,.9,.7,.3,.1,.9,.7,.7,.3], { information:.9, logistics:.4, futureOptions:.6, network:.9 }),
  profile("a1_preserve_reserve", [.3,.9,.1,.9,.3,.2,.9,.9,.9,.7], { mission:.3, resources:.9, futureOptions:.9, network:.5 }),
  profile("a2_focused_pnt", [.7,.3,.9,.3,.1,.1,.7,.5,.3,.4], { mission:.5, information:.9, navigation:.7 }),
  profile("a2_broad_sweep", [.4,.7,.9,.7,.3,.1,.8,.4,.7,.3], { information:.9, futureOptions:.5, network:.9 }),
  profile("a2_field_radio", [.5,.6,.9,.5,.2,.1,.9,.7,.6,.2], { information:.9, navigation:.6, logistics:.5 }),
  profile("a2_ground_liaison", [.6,.6,.9,.6,.4,.3,.5,.4,.7,.5], { information:.9, navigation:.7, logistics:.6, resources:.4 }),
  profile("b1_suspect_focus", [.7,.4,.8,.4,.4,.2,.7,.5,.4,.5], { mission:.6, information:.8, navigation:.6 }),
  profile("b1_priority_cargo", [.9,.3,.6,.3,.2,.2,.6,.4,.3,.6], { mission:.9, information:.5, logistics:.7 }),
  profile("b1_split_attention", [.5,.8,.8,.7,.5,.2,.8,.6,.7,.3], { information:.8, resources:.5, futureOptions:.6, network:.9 }),
  profile("b1_pulse_network", [.5,.7,.7,.7,.4,.2,.9,.8,.7,.4], { information:.7, resources:.7, futureOptions:.6, network:.9 }),
  profile("b2_continue_crosscheck", [.7,.6,.7,.6,.4,.5,.8,.7,.8,.5], { mission:.7, information:.7, navigation:.9, futureOptions:.6 }),
  profile("b2_reroute", [.9,.5,.2,.6,.5,.5,.4,.4,.7,.3], { mission:.8, navigation:.9, logistics:.9, resources:.5, civilian:.6 }),
  profile("b2_staged_checkpoints", [.7,.8,.7,.8,.5,.5,.8,.6,.9,.3], { information:.6, navigation:.8, logistics:.9, civilian:.6, futureOptions:.8 }),
  profile("b2_hold_verify", [.4,.7,.9,.6,.4,.7,.9,.5,.6,.4], { mission:.6, information:.9, logistics:.6, resources:.4, futureOptions:.6 }),
  profile("c1_fallback_nav", [.8,.7,.2,.8,.4,.4,.7,.6,.9,.3], { mission:.7, navigation:.9, resources:.6, futureOptions:.9 }),
  profile("c1_ground_recon", [.7,.6,.9,.6,.6,.5,.5,.4,.7,.5], { information:.9, navigation:.7, logistics:.6, resources:.5, escalation:.5 }),
  profile("c1_checkpoint_spacing", [.8,.7,.6,.8,.5,.4,.7,.6,.9,.3], { navigation:.8, logistics:.9, resources:.5, civilian:.6, futureOptions:.8 }),
  profile("c1_preserve_mobile_reserve", [.3,.9,.1,.9,.4,.4,.9,.9,.9,.7], { mission:.4, resources:.9, futureOptions:.9, network:.6 }),
  profile("c2_isr_heavy", [.6,.5,.9,.5,.4,.3,.6,.3,.5,.5], { information:.9, resources:.8, futureOptions:.5, network:.6 }),
  profile("c2_mobility_heavy", [.7,.7,.1,.8,.5,.4,.6,.4,.9,.4], { logistics:.8, resources:.9, futureOptions:.8, network:.8 }),
  profile("c2_balanced", [.6,.9,.6,.9,.6,.5,.8,.9,.9,.3], { information:.5, logistics:.8, resources:.9, futureOptions:.9, network:.9 }),
  profile("c2_priority_surge", [.9,.4,.7,.3,.3,.4,.3,.2,.3,.7], { mission:.9, information:.6, resources:.8, futureOptions:.3, network:.7 }),
  profile("d1_emergency_reroute", [.9,.5,.1,.6,.6,.6,.3,.4,.7,.3], { mission:.8, navigation:.9, logistics:.9, civilian:.6, escalation:.6 }),
  profile("d1_ground_containment", [.9,.7,.8,.6,.9,.9,.2,.3,.5,.8], { mission:.8, information:.7, logistics:.6, civilian:.5, escalation:.9 }),
  profile("d1_deception_routing", [.6,.9,.2,.8,.9,.7,.6,.6,.8,.6], { mission:.6, information:.4, escalation:.8, futureOptions:.8, network:.7 }),
  profile("d1_escorted_continuation", [.9,.5,.5,.5,.6,.7,.3,.4,.5,.7], { mission:.9, logistics:.9, resources:.6, escalation:.7 }),
  profile("d1_hold_confirm", [.4,.8,.9,.7,.6,.8,.9,.6,.7,.4], { mission:.6, information:.9, navigation:.5, escalation:.8, futureOptions:.7 }),
  profile("d2_critical_delivery_surge", [.9,.4,.1,.3,.3,.6,.2,.3,.3,.7], { mission:.9, logistics:.8, resources:.7, escalation:.5 }),
  profile("d2_network_balanced_finish", [.7,.9,.1,.8,.6,.6,.6,.8,.8,.4], { mission:.7, logistics:.9, resources:.8, futureOptions:.8, network:.9 }),
  profile("d2_resilient_handoff", [.7,.8,.1,.9,.5,.4,.8,.7,.9,.3], { mission:.7, navigation:.9, logistics:.8, resources:.6, futureOptions:.9 }),
  profile("d2_continuity_first_finish", [.5,.9,.1,.9,.5,.5,.7,.8,.9,.4], { mission:.6, logistics:.9, resources:.8, futureOptions:.9, network:.9 }),
] as const;

const PROFILE_BY_ID = new Map<MissionActionId, OptionCognitiveProfile>(SCENARIO5_OPTION_PROFILES.map((item) => [item.actionId, item]));

export function getScenario5OptionProfile(actionId: MissionActionId): OptionCognitiveProfile {
  const item = PROFILE_BY_ID.get(actionId);
  if (!item) throw new Error(`Unknown Scenario 5 cognitive option profile: ${actionId}`);
  return item;
}
