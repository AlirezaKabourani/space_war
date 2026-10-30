import {
  canDeleteProfile,
  normalizeDigits,
  normalizeProfileInput,
  validateProfileInput,
  type Profile,
} from "../../core/types/profile";

export const PROFILE_STORAGE_KEY = "space-war.profiles.v1";

export interface ProfileState {
  profiles: Profile[];
  activeProfileId: string;
}

const createDefaultProfiles = (scenarioCount: number): Profile[] => [
  { id: "admin", name: "ادمین", role: "admin", scenarioCatalog: "released", progress: scenarioCount },
  { id: "test-player", name: "بازیکن تست", role: "player", scenarioCatalog: "released", progress: 0 },
  { id: "scenario-tester", name: "تست سناریو", role: "player", scenarioCatalog: "full", progress: scenarioCount },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readProgress = (value: unknown, scenarioCount: number) =>
  typeof value === "number" && Number.isInteger(value)
    ? Math.max(0, Math.min(value, scenarioCount))
    : 0;

export const loadProfileState = (scenarioCount: number): ProfileState => {
  const defaults = createDefaultProfiles(scenarioCount);
  const fallback = { profiles: defaults, activeProfileId: "test-player" };
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return fallback;
    const stored: unknown = JSON.parse(raw);
    if (!isRecord(stored) || !Array.isArray(stored.profiles)) return fallback;
    const storedProfiles = stored.profiles;

    const profiles = defaults.filter((profile) =>
      profile.id !== "test-player" || storedProfiles.some(
        (candidate: unknown) => isRecord(candidate) && candidate.id === "test-player"
      )
    );

    for (const candidate of storedProfiles) {
      if (!isRecord(candidate) || typeof candidate.id !== "string") continue;
      const builtIn = profiles.find((profile) => profile.id === candidate.id);
      if (builtIn) {
        if (builtIn.id === "test-player") builtIn.progress = readProgress(candidate.progress, scenarioCount);
        continue;
      }
      if (
        !candidate.id.startsWith("player-") ||
        typeof candidate.firstName !== "string" ||
        typeof candidate.lastName !== "string" ||
        typeof candidate.nationalId !== "string" ||
        typeof candidate.phoneNumber !== "string"
      ) continue;
      const values = normalizeProfileInput({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        nationalId: candidate.nationalId,
        phoneNumber: candidate.phoneNumber,
      });
      if (Object.keys(validateProfileInput(values, profiles)).length) continue;
      profiles.push({
        ...values,
        id: candidate.id,
        name: `${values.firstName} ${values.lastName}`,
        role: "player",
        scenarioCatalog: "released",
        progress: readProgress(candidate.progress, scenarioCount),
      });
    }
    const storedActiveProfile = profiles.find((profile) => profile.id === stored.activeProfileId);
    const fallbackProfileId = profiles.some((profile) => profile.id === "test-player")
      ? "test-player"
      : "scenario-tester";
    return {
      profiles,
      // Admin access must be unlocked again after loading the application.
      activeProfileId: storedActiveProfile && storedActiveProfile.role !== "admin"
        ? storedActiveProfile.id
        : fallbackProfileId,
    };
  } catch {
    return fallback;
  }
};

export const selectProfile = (state: ProfileState, profileId: string, password = ""): ProfileState => {
  const target = state.profiles.find((profile) => profile.id === profileId);
  if (!target || (target.role === "admin" && normalizeDigits(password) !== "8888")) return state;
  return { ...state, activeProfileId: target.id };
};

export const deleteProfile = (state: ProfileState, profileId: string): ProfileState => {
  const actor = state.profiles.find((profile) => profile.id === state.activeProfileId);
  const target = state.profiles.find((profile) => profile.id === profileId);
  if (!actor || !target || !canDeleteProfile(actor, target)) return state;
  return { ...state, profiles: state.profiles.filter((profile) => profile.id !== profileId) };
};

export const saveProfileState = (state: ProfileState) => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
};
