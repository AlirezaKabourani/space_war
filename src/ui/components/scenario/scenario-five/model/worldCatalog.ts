import type {
  ActorProfileId,
  ActorProfileMetadata,
  CorridorId,
  CorridorMetadata,
  WorldTemplate,
} from "./types";

export const CANONICAL_CORRIDORS: readonly CorridorMetadata[] = [
  { corridorId: "corridor_alpha_east", convoyId: "alpha", missionRole: "priority_medical", routeLabel: "تهران → مشهد" },
  { corridorId: "corridor_beta_south", convoyId: "beta", missionRole: "operational_fuel", routeLabel: "بندرعباس → تهران" },
  { corridorId: "corridor_gamma_northwest", convoyId: "gamma", missionRole: "communications_parts", routeLabel: "تبریز → تهران" },
  { corridorId: "corridor_delta_west", convoyId: "delta", missionRole: "border_support", routeLabel: "تهران → محور غرب" },
] as const;

export const CANONICAL_CORRIDOR_IDS = CANONICAL_CORRIDORS.map(({ corridorId }) => corridorId);

export const CANONICAL_ACTOR_PROFILES: readonly ActorProfileMetadata[] = [
  {
    profileId: "cautious_denial",
    objective: "create_delay_while_preserving_ambiguity",
    primaryInterferenceMode: "intermittent_jamming",
    defaultPosture: "covert",
    defaultRiskBudget: 2,
  },
  {
    profileId: "deceptive_diversion",
    objective: "divert_attention_and_resources",
    primaryInterferenceMode: "spoofing_with_decoy",
    defaultPosture: "probing",
    defaultRiskBudget: 3,
  },
  {
    profileId: "opportunistic_interdiction",
    objective: "exploit_weakest_observable_logistics_gap",
    primaryInterferenceMode: "selective_jam_spoof",
    defaultPosture: "probing",
    defaultRiskBudget: 3,
  },
  {
    profileId: "pressure_escalator",
    objective: "force_stop_or_major_reroute",
    primaryInterferenceMode: "persistent_jamming",
    defaultPosture: "committed",
    defaultRiskBudget: 3,
  },
] as const;

export const DECEPTIVE_DECOY_MAPPING: Readonly<Record<CorridorId, CorridorId>> = {
  corridor_alpha_east: "corridor_gamma_northwest",
  corridor_beta_south: "corridor_delta_west",
  corridor_gamma_northwest: "corridor_alpha_east",
  corridor_delta_west: "corridor_beta_south",
};

const createTemplate = (corridorId: CorridorId, profileId: ActorProfileId): WorldTemplate => {
  const actor = CANONICAL_ACTOR_PROFILES.find((candidate) => candidate.profileId === profileId);
  if (!actor) throw new Error(`Unknown actor profile: ${profileId}`);
  return {
    worldId: `W-${corridorId}-${profileId}`,
    primaryAffectedCorridorId: corridorId,
    actorProfileId: profileId,
    actorObjective: actor.objective,
    primaryInterferenceMode: actor.primaryInterferenceMode,
    initialDecoyCorridorId: profileId === "deceptive_diversion" ? DECEPTIVE_DECOY_MAPPING[corridorId] : null,
    hasActiveActor: true,
  };
};

export const WORLD_CATALOG: readonly WorldTemplate[] = CANONICAL_CORRIDOR_IDS.flatMap((corridorId) =>
  CANONICAL_ACTOR_PROFILES.map(({ profileId }) => createTemplate(corridorId, profileId)),
);
