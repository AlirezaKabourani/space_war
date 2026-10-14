import type { BeliefTelemetry, EvidenceTelemetry } from "./types";

const STRENGTH = { weak: 0.25, moderate: 0.6, strong: 0.9 } as const;
const DIRECTION = { supports_targeted: 1, ambiguous: 0, supports_nonhostile: -1 } as const;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));

export function calculatePlayerVisibleEvidenceSupport(
  evidence: readonly EvidenceTelemetry[],
  visibleEvidenceIds: readonly string[],
): number {
  const visible = new Set(visibleEvidenceIds);
  const byCorridor = new Map<string, Map<string, number>>();
  for (const item of evidence) {
    if (!visible.has(item.evidenceId) || item.observedCorridorId === null) continue;
    const signed = STRENGTH[item.strengthBand] * DIRECTION[item.direction];
    const bySource = byCorridor.get(item.observedCorridorId) ?? new Map<string, number>();
    const existing = bySource.get(item.sourceType);
    if (existing === undefined || Math.abs(signed) > Math.abs(existing)) bySource.set(item.sourceType, signed);
    byCorridor.set(item.observedCorridorId, bySource);
  }
  if (byCorridor.size === 0) return 0.5;
  return Math.max(...[...byCorridor.values()].map((sources) => {
    const values = [...sources.values()];
    const signedMean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return clamp(0.5 + 0.5 * signedMean, 0, 1);
  }));
}

const CHECKPOINT_ORDER = ["A2_prebelief", "A2_postbelief", "C_belief_checkpoint", "D_final_belief"] as const;

export function calculateEvidenceResponsiveUpdating(
  beliefs: readonly BeliefTelemetry[],
  evidence: readonly EvidenceTelemetry[],
): number | null {
  const byCheckpoint = new Map(beliefs.map((item) => [item.checkpointId, item]));
  const scores: number[] = [];
  for (let index = 0; index < CHECKPOINT_ORDER.length - 1; index += 1) {
    const before = byCheckpoint.get(CHECKPOINT_ORDER[index]!);
    const after = byCheckpoint.get(CHECKPOINT_ORDER[index + 1]!);
    if (!before || !after) continue;
    const beforeSupport = calculatePlayerVisibleEvidenceSupport(evidence, before.visibleEvidenceIdsAtCheckpoint);
    const afterSupport = calculatePlayerVisibleEvidenceSupport(evidence, after.visibleEvidenceIdsAtCheckpoint);
    const beliefDelta = after.targetedInterferenceEstimate / 100 - before.targetedInterferenceEstimate / 100;
    const evidenceDelta = afterSupport - beforeSupport;
    if (Math.abs(evidenceDelta) <= 1e-9) continue;
    const directionAgreement = Math.sign(beliefDelta) === Math.sign(evidenceDelta) && Math.abs(beliefDelta) > 1e-9 ? 1 : 0;
    const magnitudeAlignment = 1 - Math.min(Math.abs(beliefDelta - evidenceDelta) / 0.5, 1);
    scores.push(0.6 * directionAgreement + 0.4 * magnitudeAlignment);
  }
  return scores.length === 0 ? null : 100 * scores.reduce((sum, value) => sum + value, 0) / scores.length;
}
