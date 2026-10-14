import type { BeliefCheckpointId, CognitiveWindowId } from "../cognitive/index";
import type {
  RuntimeDecisionStageMetadata,
  RuntimePhaseId,
  RuntimeStageId,
} from "./types";

export const INITIAL_RUNTIME_STAGE_ID = "decision:A1_baseline_monitoring" as const;

export const DECISION_STAGE_METADATA: Readonly<Record<Extract<RuntimeStageId, `decision:${string}`>, RuntimeDecisionStageMetadata>> = {
  "decision:A1_baseline_monitoring": { phaseId: "A", roundId: 1, windowId: "A1_baseline_monitoring", reasonStageId: null, outcomeNextStageId: "belief:A2_prebelief" },
  "decision:A2_evidence_acquisition": { phaseId: "A", roundId: 2, windowId: "A2_evidence_acquisition", reasonStageId: null, outcomeNextStageId: "belief:A2_postbelief" },
  "decision:B1_monitoring_allocation": { phaseId: "B", roundId: 3, windowId: "B1_monitoring_allocation", reasonStageId: null, outcomeNextStageId: "decision:B2_route_policy" },
  "decision:B2_route_policy": { phaseId: "B", roundId: 4, windowId: "B2_route_policy", reasonStageId: "reason:B", outcomeNextStageId: "decision:C1_support_and_checkpoints" },
  "decision:C1_support_and_checkpoints": { phaseId: "C", roundId: 5, windowId: "C1_support_and_checkpoints", reasonStageId: null, outcomeNextStageId: "decision:C2_resource_portfolio" },
  "decision:C2_resource_portfolio": { phaseId: "C", roundId: 6, windowId: "C2_resource_portfolio", reasonStageId: "reason:C", outcomeNextStageId: "belief:C_belief_checkpoint" },
  "decision:D1_crisis_response": { phaseId: "D", roundId: 7, windowId: "D1_crisis_response", reasonStageId: null, outcomeNextStageId: "belief:D_final_belief" },
  "decision:D2_final_delivery_policy": { phaseId: "D", roundId: 8, windowId: "D2_final_delivery_policy", reasonStageId: "reason:D", outcomeNextStageId: "complete" },
};

export const BELIEF_STAGE_METADATA: Readonly<Record<Extract<RuntimeStageId, `belief:${string}`>, {
  readonly checkpointId: BeliefCheckpointId;
  readonly nextStageId: RuntimeStageId;
}>> = {
  "belief:A2_prebelief": { checkpointId: "A2_prebelief", nextStageId: "decision:A2_evidence_acquisition" },
  "belief:A2_postbelief": { checkpointId: "A2_postbelief", nextStageId: "decision:B1_monitoring_allocation" },
  "belief:C_belief_checkpoint": { checkpointId: "C_belief_checkpoint", nextStageId: "decision:D1_crisis_response" },
  "belief:D_final_belief": { checkpointId: "D_final_belief", nextStageId: "decision:D2_final_delivery_policy" },
};

export const REASON_STAGE_PHASE: Readonly<Record<Extract<RuntimeStageId, `reason:${string}`>, Exclude<RuntimePhaseId, "A">>> = {
  "reason:B": "B",
  "reason:C": "C",
  "reason:D": "D",
};

export const RUNTIME_STAGE_SEQUENCE: readonly RuntimeStageId[] = [
  "decision:A1_baseline_monitoring", "outcome_review", "belief:A2_prebelief",
  "decision:A2_evidence_acquisition", "outcome_review", "belief:A2_postbelief",
  "decision:B1_monitoring_allocation", "outcome_review", "decision:B2_route_policy", "reason:B", "outcome_review",
  "decision:C1_support_and_checkpoints", "outcome_review", "decision:C2_resource_portfolio", "reason:C", "outcome_review",
  "belief:C_belief_checkpoint", "decision:D1_crisis_response", "outcome_review", "belief:D_final_belief",
  "decision:D2_final_delivery_policy", "reason:D", "outcome_review", "complete",
];

export const isDecisionStage = (stageId: RuntimeStageId): stageId is Extract<RuntimeStageId, `decision:${string}`> =>
  stageId.startsWith("decision:");

export const isBeliefStage = (stageId: RuntimeStageId): stageId is Extract<RuntimeStageId, `belief:${string}`> =>
  stageId.startsWith("belief:");

export const isReasonStage = (stageId: RuntimeStageId): stageId is Extract<RuntimeStageId, `reason:${string}`> =>
  stageId.startsWith("reason:");

export function decisionMetadata(stageId: RuntimeStageId): RuntimeDecisionStageMetadata {
  if (!isDecisionStage(stageId)) throw new Error(`Runtime stage ${stageId} is not a decision stage`);
  return DECISION_STAGE_METADATA[stageId];
}

export function cognitiveWindowForDecisionStage(stageId: RuntimeStageId): CognitiveWindowId {
  return decisionMetadata(stageId).windowId;
}
