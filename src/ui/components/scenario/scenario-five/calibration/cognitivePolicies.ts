import { calculateReasonAlignment, getScenario5OptionProfile, multiCriteriaForProfile } from "../model/cognitive/index";
import type { OptionCognitiveProfile, ReasonId } from "../model/cognitive/index";
import type { MissionActionId } from "../model/mission/index";
import type { CalibrationPolicy, CognitivePolicyId, PolicyChoiceContext } from "./types";
import { MISSION_POLICIES } from "./missionPolicies";

const byMetric = (metric: (profile: OptionCognitiveProfile) => number, maximum: boolean) =>
  ({ availableActionIds }: PolicyChoiceContext): MissionActionId => availableActionIds.reduce((best, actionId) => {
    const delta = metric(getScenario5OptionProfile(actionId)) - metric(getScenario5OptionProfile(best));
    return (maximum ? delta > 0 : delta < 0) ? actionId : best;
  });
const maxMetric = (key: keyof Pick<OptionCognitiveProfile,
  "operationalLoading" | "strategicLoading" | "informationSeeking" | "adversaryModeling" | "riskExposure">) =>
  byMetric((profile) => profile[key], true);
const minMetric = (key: keyof Pick<OptionCognitiveProfile, "informationSeeking" | "riskExposure">) =>
  byMetric((profile) => profile[key], false);
const secondOrder = (profile: OptionCognitiveProfile): number => .35 * profile.futureConsequenceThinking + .25 * profile.adversaryModeling + .2 * profile.reversibilityPreference + .2 * profile.resourceStewardship;
const stewardship = (profile: OptionCognitiveProfile): number => .5 * profile.resourceStewardship + .3 * profile.contingencyPlanning + .2 * profile.reversibilityPreference;
const planning = (profile: OptionCognitiveProfile): number => .35 * profile.contingencyPlanning + .25 * profile.reversibilityPreference + .2 * profile.resourceStewardship + .2 * profile.futureConsequenceThinking;

const cognitive = (
  policyId: CognitivePolicyId,
  chooseAction: CalibrationPolicy["chooseAction"],
  options: Partial<Pick<CalibrationPolicy, "evidenceBehavior" | "beliefBehavior" | "reasonBehavior" | "requestedActionByRound">> = {},
): CalibrationPolicy => ({
  policyId, chooseAction, oraclePolicy: false, stressPolicy: false, randomPolicy: policyId === "uniform_random_cognitive",
  evidenceBehavior: options.evidenceBehavior ?? "none", beliefBehavior: options.beliefBehavior ?? "neutral",
  reasonBehavior: options.reasonBehavior ?? "neutral", ...(options.requestedActionByRound ? { requestedActionByRound: options.requestedActionByRound } : {}),
});

const preferredHigh = { 3: "b1_split_attention", 4: "b2_staged_checkpoints", 5: "c1_checkpoint_spacing", 6: "c2_balanced", 7: "d1_deception_routing", 8: "d2_continuity_first_finish" } as const;
const preferredLow = { 3: "b1_priority_cargo", 4: "b2_staged_checkpoints", 5: "c1_preserve_mobile_reserve", 6: "c2_priority_surge", 7: "d1_escorted_continuation", 8: "d2_resilient_handoff" } as const;
const balanced = MISSION_POLICIES.find(({ policyId }) => policyId === "balanced_network")!;

export const COGNITIVE_POLICIES: readonly CalibrationPolicy[] = [
  cognitive("operational_anchor", maxMetric("operationalLoading")),
  cognitive("strategic_anchor", maxMetric("strategicLoading")),
  cognitive("information_max", maxMetric("informationSeeking"), { evidenceBehavior: "all" }),
  cognitive("information_min", minMetric("informationSeeking")),
  cognitive("second_order_max", byMetric(secondOrder, true)),
  cognitive("adversary_max", maxMetric("adversaryModeling")),
  cognitive("stewardship_max", byMetric(stewardship, true)),
  cognitive("planning_max", byMetric(planning, true)),
  cognitive("mci_max", byMetric((profile) => multiCriteriaForProfile(profile) ?? 0, true)),
  cognitive("risk_low", minMetric("riskExposure")),
  cognitive("risk_high", maxMetric("riskExposure")),
  cognitive("coherence_high", maxMetric("strategicLoading"), { requestedActionByRound: preferredHigh, reasonBehavior: "maximize_alignment" }),
  cognitive("coherence_low", maxMetric("operationalLoading"), { requestedActionByRound: preferredLow, reasonBehavior: "minimize_alignment" }),
  cognitive("evidence_responsive", undefined, { requestedActionByRound: balanced.requestedActionByRound, evidenceBehavior: "all", beliefBehavior: "evidence_responsive" }),
  cognitive("evidence_anti", undefined, { requestedActionByRound: balanced.requestedActionByRound, evidenceBehavior: "all", beliefBehavior: "evidence_anti" }),
  cognitive("uniform_random_cognitive", ({ availableActionIds, rng }) => availableActionIds[rng.pickIndex(availableActionIds.length)]!, { evidenceBehavior: "random_half" }),
] as const;

export const REASON_IDS: readonly ReasonId[] = [
  "reason_mission_speed", "reason_reduce_exposure", "reason_preserve_resources", "reason_network_continuity",
  "reason_information_confidence", "reason_limit_actor_reaction", "reason_preserve_reversibility",
] as const;

export function alignedReason(actionIds: readonly MissionActionId[], maximize: boolean): ReasonId {
  return REASON_IDS.reduce((best, reasonId) => {
    const score = (candidate: ReasonId): number => actionIds.reduce((sum, actionId) => sum + calculateReasonAlignment(actionId, candidate), 0) / actionIds.length;
    const delta = score(reasonId) - score(best);
    return (maximize ? delta > 0 : delta < 0) ? reasonId : best;
  });
}
