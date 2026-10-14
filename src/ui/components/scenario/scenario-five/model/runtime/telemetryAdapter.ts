import type { EvidenceInstance } from "../index";
import type { CognitiveWindowId, EvidenceTelemetry, Scenario5CognitiveTelemetryBundle } from "../cognitive/index";
import type { Scenario5MissionState } from "../mission/index";
import type { RuntimeRoundId, Scenario5RuntimeState } from "./types";

const WINDOWS_AFTER_RELEASE: Readonly<Record<RuntimeRoundId, readonly CognitiveWindowId[]>> = {
  1: ["A2_evidence_acquisition", "B1_monitoring_allocation", "B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  2: ["B1_monitoring_allocation", "B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  3: ["B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  4: ["C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  5: ["C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"],
  6: ["D1_crisis_response", "D2_final_delivery_policy"],
  7: ["D2_final_delivery_policy"],
  8: [],
};

const adaptEvidence = (
  item: EvidenceInstance,
  releasedAfterRound: RuntimeRoundId,
  availableAtMs: number,
): EvidenceTelemetry => ({
  evidenceId: item.evidenceId,
  sourceType: item.sourceType,
  observedCorridorId: item.observedCorridorId,
  direction: item.direction,
  strengthBand: item.strengthBand,
  relevantWindowIds: [...WINDOWS_AFTER_RELEASE[releasedAfterRound]],
  availableAtMs,
  qualityLabelVisible: item.qualityLabelVisible,
  limitationVisible: item.limitationVisible,
});

export function adaptNewVisibleEvidence(
  missionBefore: Scenario5MissionState,
  missionAfter: Scenario5MissionState,
  releasedAfterRound: RuntimeRoundId,
  availableAtMs: number,
): readonly EvidenceTelemetry[] {
  const beforeIds = new Set(missionBefore.visibleEvidence.map(({ evidenceId }) => evidenceId));
  return missionAfter.visibleEvidence
    .filter(({ evidenceId }) => !beforeIds.has(evidenceId))
    .map((item) => adaptEvidence(item, releasedAfterRound, availableAtMs));
}

export function buildScenario5CognitiveTelemetryBundle(
  state: Scenario5RuntimeState,
): Scenario5CognitiveTelemetryBundle {
  return {
    scenarioId: "s5_silent_waves_redesign",
    runId: state.runId,
    startedAtMs: state.startedAtMs,
    completedAtMs: state.completedAtMs,
    decisions: state.decisions,
    evidence: state.evidence,
    evidenceOpens: state.evidenceOpens,
    beliefs: state.beliefs,
    reasons: state.reasons,
  };
}
