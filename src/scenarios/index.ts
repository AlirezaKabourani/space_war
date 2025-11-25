// src/scenarios/index.ts
import type { ScenarioDefinition } from "../core/types/scenario";
import { S0_GatewayToSpaceWargaming } from "./s0_gateway_space_wargaming/tree";
import { S1_ShadowsInLowOrbit } from "./s1_shadows_low_orbit/tree";

export type ScenarioId = "s0_gateway_space_wargaming" | "s1_shadows_low_orbit";

export const AllScenarios: Record<ScenarioId, ScenarioDefinition> = {
  s0_gateway_space_wargaming: S0_GatewayToSpaceWargaming,
  s1_shadows_low_orbit: S1_ShadowsInLowOrbit,
};
