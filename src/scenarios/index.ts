// src/scenarios/index.ts
import type { ScenarioDefinition } from "../core/types/scenario";
import { S0_GatewayToSpaceWargaming } from "./s0_gateway_space_wargaming/tree";
import { S1_ShadowsInLowOrbit } from "./s1_shadows_low_orbit/tree";
import { S2_SilentWaves } from "./s2_silent_waves/tree";
import { S3_SecureCorridor } from "./s3_secure_corridor/tree";
import { S4_RedesignedScenarioOne } from "./s4_redesigned_scenario_one/tree";

export type ScenarioId =
  | "s0_gateway_space_wargaming"
  | "s1_shadows_low_orbit"
  | "s2_silent_waves"
  | "s3_secure_corridor"
  | "s4_redesigned_scenario_one";

export const AllScenarios: Record<ScenarioId, ScenarioDefinition> = {
  s0_gateway_space_wargaming: S0_GatewayToSpaceWargaming,
  s1_shadows_low_orbit: S1_ShadowsInLowOrbit,
  s2_silent_waves: S2_SilentWaves,
  s3_secure_corridor: S3_SecureCorridor,
  s4_redesigned_scenario_one: S4_RedesignedScenarioOne,
};
