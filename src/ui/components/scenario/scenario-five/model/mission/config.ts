import type { CorridorId } from "../index";
import type { MissionConvoyState } from "./types";

export const MISSION_MODEL_VERSION = "s5-mission-v1.1.0";
export const BASE_ROUND_MINUTES = 20;
export const MISSION_HORIZON_MINUTES = 360;
export const INITIAL_ISR_CAPACITY = 100;
export const INITIAL_SUPPORT_RESERVE = 100;

interface ConvoyInitialConfig {
  readonly convoyId: MissionConvoyState["convoyId"];
  readonly corridorId: CorridorId;
  readonly baselineArrivalMinute: number;
  readonly deadlineMinute: number;
  readonly initialIntegrity: number;
}

export const INITIAL_CONVOY_CONFIG: readonly ConvoyInitialConfig[] = [
  { convoyId: "alpha", corridorId: "corridor_alpha_east", baselineArrivalMinute: 210, deadlineMinute: 300, initialIntegrity: 100 },
  { convoyId: "beta", corridorId: "corridor_beta_south", baselineArrivalMinute: 235, deadlineMinute: 330, initialIntegrity: 100 },
  { convoyId: "gamma", corridorId: "corridor_gamma_northwest", baselineArrivalMinute: 225, deadlineMinute: 315, initialIntegrity: 100 },
  { convoyId: "delta", corridorId: "corridor_delta_west", baselineArrivalMinute: 250, deadlineMinute: 345, initialIntegrity: 100 },
] as const;
