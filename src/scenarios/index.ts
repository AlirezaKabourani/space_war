// src/scenarios/index.ts
import type { ScenarioDefinition } from "../core/types/scenario";
import { S0_GatewayToSpaceWargaming } from "./s0_gateway_space_wargaming/tree";
import { S1_ShadowsInLowOrbit } from "./s1_shadows_low_orbit/tree";
import { S2_SilentWaves } from "./s2_silent_waves/tree";

export type ScenarioId = "s0_gateway_space_wargaming" | "s1_shadows_low_orbit" | "s2_silent_waves";

export const AllScenarios: Record<ScenarioId, ScenarioDefinition> = {
  s0_gateway_space_wargaming: S0_GatewayToSpaceWargaming,
  s1_shadows_low_orbit: S1_ShadowsInLowOrbit,
  s2_silent_waves: S2_SilentWaves,
};
