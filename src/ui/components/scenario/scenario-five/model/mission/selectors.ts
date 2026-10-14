import { CANONICAL_CORRIDORS } from "../index";
import type { ActorVisibleSignals, CorridorId, EvidenceInstance } from "../index";
import { MISSION_ACTION_CATALOG, getMissionAction } from "./actionCatalog";
import type {
  DerivedActorSignals,
  MissionActionConfig,
  MissionActionSelection,
  MissionConvoyState,
  OperationalAttributionStatus,
  Scenario5MissionState,
  ValidatedMissionAction,
} from "./types";

const CANONICAL_IDS = new Set<CorridorId>(CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId));
const LEAST_PROTECTED_ORDER: readonly CorridorId[] = [
  "corridor_beta_south",
  "corridor_gamma_northwest",
  "corridor_delta_west",
  "corridor_alpha_east",
];

export function getAvailableMissionActions(state: Scenario5MissionState): readonly MissionActionConfig[] {
  if (state.completed) return [];
  return MISSION_ACTION_CATALOG.filter(({ roundId }) => roundId === state.currentRound);
}

export function validateMissionAction(state: Scenario5MissionState, selection: MissionActionSelection): ValidatedMissionAction {
  if (state.completed) throw new Error("Mission is already complete");
  const config = getMissionAction(selection.actionId);
  if (config.roundId !== state.currentRound) {
    throw new Error(`Action ${config.actionId} belongs to round ${config.roundId}, not round ${state.currentRound}`);
  }

  let effectiveTargetCorridorId: CorridorId | null = null;
  if (config.target === "required") {
    if (!selection.targetCorridorId || !CANONICAL_IDS.has(selection.targetCorridorId)) {
      throw new Error(`Action ${config.actionId} requires a canonical target corridor`);
    }
    effectiveTargetCorridorId = selection.targetCorridorId;
  } else if (config.target === "fixed_alpha") {
    if (selection.targetCorridorId && selection.targetCorridorId !== "corridor_alpha_east") {
      throw new Error(`Action ${config.actionId} only accepts corridor_alpha_east`);
    }
    effectiveTargetCorridorId = "corridor_alpha_east";
  }

  if (effectiveTargetCorridorId !== null) {
    const targetConvoy = state.convoys.find(({ corridorId }) => corridorId === effectiveTargetCorridorId);
    if (!targetConvoy) throw new Error(`No convoy exists for ${effectiveTargetCorridorId}`);
    if (targetConvoy.status === "delivered") {
      throw new Error(`Target convoy for ${effectiveTargetCorridorId} is already delivered`);
    }
  }

  if (config.isrCost > state.resources.isrCapacity) throw new Error(`Insufficient ISR capacity for ${config.actionId}`);
  if (config.supportCost > state.resources.supportReserve) throw new Error(`Insufficient support reserve for ${config.actionId}`);
  return { config, effectiveTargetCorridorId };
}

export function convoyProtectionScore(convoy: MissionConvoyState, currentRound: number): number {
  return (convoy.fallbackNav ? 2 : 0)
    + (convoy.routeHardened ? 2 : 0)
    + (convoy.groundSupport ? 2 : 0)
    + (convoy.escortedUntilRound === currentRound ? 1 : 0)
    + convoy.temporaryProtectionLevel;
}

export function deriveActorVisibleSignals(
  state: Scenario5MissionState,
  config: MissionActionConfig,
  effectiveTargetCorridorId: CorridorId | null,
): DerivedActorSignals {
  const protectionEntries = state.convoys.map((convoy) => [
    convoy.corridorId,
    convoyProtectionScore(convoy, state.currentRound),
  ] as const);
  const protectionScores = Object.fromEntries(protectionEntries) as Record<CorridorId, number>;
  const activeConvoys = state.convoys.filter(({ status }) => status !== "delivered");
  const activeCorridorIds = new Set(activeConvoys.map(({ corridorId }) => corridorId));
  const minimumActiveProtection = activeConvoys.length > 0
    ? Math.min(...activeConvoys.map(({ corridorId }) => protectionScores[corridorId]))
    : null;
  const leastProtectedCorridorId = minimumActiveProtection === null
    ? null
    : LEAST_PROTECTED_ORDER.find((corridorId) =>
      activeCorridorIds.has(corridorId) && protectionScores[corridorId] === minimumActiveProtection) ?? null;
  const activeProtectedCorridorCount = activeConvoys.filter(({ corridorId }) => protectionScores[corridorId] > 0).length;
  const networkCoverageWeak = state.currentRound <= 2
    ? config.priorityConvoyConcentration
    : activeConvoys.length === 0
      ? false
      : config.priorityConvoyConcentration || activeProtectedCorridorCount < 2;

  const signals: ActorVisibleSignals = {
    routeHardened: config.hardensRoute,
    groundReconVisible: config.groundReconVisible,
    fallbackActivated: config.activatesFallback,
    priorityConvoyConcentration: config.priorityConvoyConcentration,
    networkCoverageWeak,
    containmentVisible: config.containmentVisible,
    executedResponseIntensity: config.responseIntensity,
    leastProtectedCorridorId,
    visibleRerouteCorridorIds: config.visibleReroute && effectiveTargetCorridorId ? [effectiveTargetCorridorId] : [],
  };
  return { signals, protectionScores };
}

export function deriveOperationalAttributionStatus(
  visibleEvidence: readonly EvidenceInstance[],
): OperationalAttributionStatus {
  const corridors = new Set(visibleEvidence.map(({ observedCorridorId }) => observedCorridorId).filter((id): id is CorridorId => id !== null));
  for (const corridorId of corridors) {
    const supporting = visibleEvidence.filter(
      (item) => item.observedCorridorId === corridorId && item.direction === "supports_targeted",
    );
    const sourceTypes = new Set(supporting.map(({ sourceType }) => sourceType));
    const hasSubstantiveItem = supporting.some(({ strengthBand }) => strengthBand === "moderate" || strengthBand === "strong");
    if (sourceTypes.size >= 2 && hasSubstantiveItem) return "resolved";
  }
  return "unresolved";
}
