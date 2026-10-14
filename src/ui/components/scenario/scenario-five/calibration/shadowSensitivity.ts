import type { MissionRunRow } from "./types";
import { mean, round } from "./auditMetrics";

export const SHADOW_HORIZONS = [330, 345, 360, 375, 390] as const;
export const EXTENDED_SHADOW_HORIZONS = [270, 285, 300, 315, 330, 345, 360, 375, 390] as const;
export const SHADOW_DEADLINE_SHIFTS = [-30, -15, 0, 15, 30] as const;
export const SHADOW_RESOURCE_BUDGETS = [80, 90, 100, 110, 120] as const;

export function calculateShadowHorizon(rows: readonly MissionRunRow[]) {
  return SHADOW_HORIZONS.map((horizon) => {
    const deliveredCounts = rows.map((row) => row.convoySnapshot.filter(({ integrity, projectedArrivalMinute }) => integrity >= 55 && projectedArrivalMinute <= horizon).length);
    return {
      horizon,
      alphaDeliveryRate: round(rows.filter((row) => {
        const alpha = row.convoySnapshot.find(({ corridorId }) => corridorId === "corridor_alpha_east")!;
        return alpha.integrity >= 55 && alpha.projectedArrivalMinute <= horizon;
      }).length / rows.length),
      allConvoyDeliveryRate: round(deliveredCounts.filter((count) => count === 4).length / rows.length),
      meanDeliveredConvoyCount: round(mean(deliveredCounts)),
    };
  });
}

export function calculateExtendedShadowHorizon(rows: readonly MissionRunRow[]) {
  return EXTENDED_SHADOW_HORIZONS.map((horizon) => {
    const deliveredCounts = rows.map((row) => row.convoySnapshot.filter(({ integrity, projectedArrivalMinute }) => integrity >= 55 && projectedArrivalMinute <= horizon).length);
    return {
      horizon,
      alphaDeliveryRate: round(rows.filter((row) => {
        const alpha = row.convoySnapshot.find(({ corridorId }) => corridorId === "corridor_alpha_east")!;
        return alpha.integrity >= 55 && alpha.projectedArrivalMinute <= horizon;
      }).length / rows.length),
      allConvoyDeliveryRate: round(deliveredCounts.filter((count) => count === 4).length / rows.length),
      meanDeliveredConvoyCount: round(mean(deliveredCounts)),
    };
  });
}
export function calculateShadowDeadline(rows: readonly MissionRunRow[]) {
  return SHADOW_DEADLINE_SHIFTS.map((deadlineShift) => {
    const onTimeCounts = rows.map((row) => row.convoySnapshot.filter(({ integrity, projectedArrivalMinute, deadlineMinute }) => integrity >= 60 && projectedArrivalMinute <= deadlineMinute + deadlineShift).length);
    return {
      deadlineShift,
      meanNetworkContinuity: round(25 * mean(onTimeCounts)),
      alphaOnTimeRate: round(rows.filter((row) => {
        const alpha = row.convoySnapshot.find(({ corridorId }) => corridorId === "corridor_alpha_east")!;
        return alpha.integrity >= 60 && alpha.projectedArrivalMinute <= alpha.deadlineMinute + deadlineShift;
      }).length / rows.length),
      allConvoyOnTimeRate: round(onTimeCounts.filter((count) => count === 4).length / rows.length),
    };
  });
}

export function calculateShadowResources(rows: readonly MissionRunRow[]) {
  return SHADOW_RESOURCE_BUDGETS.map((budget) => {
    const isrFeasible = rows.filter(({ finalIsr }) => 100 - finalIsr <= budget).length;
    const supportFeasible = rows.filter(({ finalSupport }) => 100 - finalSupport <= budget).length;
    const bothFeasible = rows.filter(({ finalIsr, finalSupport }) => 100 - finalIsr <= budget && 100 - finalSupport <= budget).length;
    return {
      budget,
      analysisLabel: "path-feasibility shadow analysis, not a full counterfactual replay",
      isrPathFeasibilityRate: round(isrFeasible / rows.length),
      supportPathFeasibilityRate: round(supportFeasible / rows.length),
      bothResourcePathFeasibilityRate: round(bothFeasible / rows.length),
    };
  });
}
