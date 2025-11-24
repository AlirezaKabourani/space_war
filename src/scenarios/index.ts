import { S1_ShadowsInLowOrbit } from "./s1_shadows_low_orbit/tree";

export const AllScenarios = {
  s1_shadows_low_orbit: S1_ShadowsInLowOrbit,
};

export type ScenarioId = keyof typeof AllScenarios;
