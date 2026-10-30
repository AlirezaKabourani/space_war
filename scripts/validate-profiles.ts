import assert from "node:assert/strict";
import {
  createPlayerProfile,
  normalizeProfileInput,
  validateProfileInput,
} from "../src/core/types/profile";
import {
  deleteProfile,
  loadProfileState,
  PROFILE_STORAGE_KEY,
  saveProfileState,
  selectProfile,
} from "../src/services/storage/profileStorage";
import { eventLogger } from "../src/services/analytics/eventLogger";

const storage = new Map<string, string>();
const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
});

try {
  const defaults = loadProfileState(6);
  assert.deepEqual(defaults.profiles.map(({ id }) => id), ["admin", "test-player", "scenario-tester"]);
  assert.equal(defaults.activeProfileId, "test-player");
  assert.equal(defaults.profiles[0].role, "admin");
  assert.equal(defaults.profiles[2].scenarioCatalog, "full");

  const input = {
    firstName: "  کاربر  ",
    lastName: "  آزمایشی   یک  ",
    nationalId: "۰۰۱۲۳۴۵۶۷۸",
    phoneNumber: "+۹۸ ۹۱۲-۱۲۳-۴۵۶۷",
  };
  assert.deepEqual(normalizeProfileInput(input), {
    firstName: "کاربر",
    lastName: "آزمایشی یک",
    nationalId: "0012345678",
    phoneNumber: "09121234567",
  });
  assert.equal(normalizeProfileInput({ ...input, nationalId: "٠٠١٢٣٤٥٦٧٨", phoneNumber: "٠٢١١٢٣٤٥٦٧٨" }).phoneNumber, "02112345678");
  assert.equal(normalizeProfileInput({ ...input, phoneNumber: "00989121234567" }).phoneNumber, "09121234567");
  assert.deepEqual(validateProfileInput(input), {});
  assert.equal(Object.keys(validateProfileInput({ firstName: " ", lastName: "", nationalId: "", phoneNumber: "" })).length, 4);
  assert.ok(validateProfileInput({ ...input, nationalId: "123456789" }).nationalId);
  assert.ok(validateProfileInput({ ...input, nationalId: "001234567x" }).nationalId);
  assert.ok(validateProfileInput({ ...input, phoneNumber: "9121234567" }).phoneNumber);

  const player = createPlayerProfile(input);
  assert.equal(player.name, "کاربر آزمایشی یک");
  assert.equal(player.role, "player");
  assert.equal(player.scenarioCatalog, "released");
  assert.equal(player.progress, 0);
  assert.ok(!["admin", "test-player", "scenario-tester"].includes(player.id));
  assert.ok(validateProfileInput(input, [player]).nationalId);

  const otherPlayer = createPlayerProfile({ ...input, nationalId: "0012345679" });
  assert.notEqual(player.id, otherPlayer.id, "Players with the same name must have independent identities");
  const state = {
    profiles: [...defaults.profiles, { ...player, progress: 2 }, otherPlayer],
    activeProfileId: player.id,
  };
  saveProfileState(state);
  const restored = loadProfileState(6);
  assert.deepEqual(restored, state, "Contact fields, active selection and individual progress must survive reload");
  assert.equal(restored.profiles.find(({ id }) => id === otherPlayer.id)?.progress, 0);

  assert.strictEqual(deleteProfile(state, otherPlayer.id), state, "Players cannot delete profiles");
  const testerState = { ...state, activeProfileId: "scenario-tester" };
  assert.strictEqual(deleteProfile(testerState, player.id), testerState, "Scenario testers cannot delete profiles");
  const adminState = { ...state, activeProfileId: "admin" };
  for (const password of ["", "wrong", "888", "88888", " 8888 "]) {
    assert.strictEqual(selectProfile(state, "admin", password), state, "Admin selection requires the correct password");
  }
  for (const password of ["8888", "۸۸۸۸", "٨٨٨٨"]) {
    assert.deepEqual(selectProfile(state, "admin", password), adminState);
  }
  assert.equal(selectProfile(adminState, otherPlayer.id).activeProfileId, otherPlayer.id, "Players need no password");
  assert.strictEqual(selectProfile(state, "missing", "8888"), state);
  assert.strictEqual(selectProfile(adminState, "admin", "wrong"), adminState, "Invalid passwords cannot change state even when admin was already selected");
  saveProfileState(adminState);
  assert.equal(loadProfileState(6).activeProfileId, "test-player", "Reload must not restore admin access without a password");
  for (const id of ["admin", "scenario-tester", "missing"]) {
    assert.strictEqual(deleteProfile(adminState, id), adminState, "Protected or missing profiles cannot be deleted");
  }
  const afterPlayerDeletion = deleteProfile(adminState, player.id);
  assert.ok(!afterPlayerDeletion.profiles.some(({ id }) => id === player.id));
  assert.ok(state.profiles.some(({ id }) => id === player.id), "Deletion must not mutate the previous state");
  assert.equal(afterPlayerDeletion.activeProfileId, "admin");
  assert.equal(afterPlayerDeletion.profiles.find(({ id }) => id === otherPlayer.id)?.progress, 0);
  assert.deepEqual(validateProfileInput(input, afterPlayerDeletion.profiles), {}, "Deleted national IDs can be reused");
  const afterTestPlayerDeletion = deleteProfile(afterPlayerDeletion, "test-player");
  saveProfileState(afterTestPlayerDeletion);
  assert.deepEqual(loadProfileState(6), { ...afterTestPlayerDeletion, activeProfileId: "scenario-tester" }, "Deleted profiles must stay deleted and reloading must lock admin access");
  saveProfileState({ ...afterTestPlayerDeletion, activeProfileId: "test-player" });
  assert.equal(loadProfileState(6).activeProfileId, "scenario-tester", "Missing active profiles must fall back to an existing non-admin profile");

  eventLogger.setUserContext({ id: player.id, name: player.name, role: player.role });
  eventLogger.log({ type: "scenario_start", scenarioId: "s0_gateway_space_wargaming" });
  const entry = eventLogger.getEvents()[0];
  assert.equal(entry.userId, player.id);
  assert.equal(entry.userName, "کاربر آزمایشی یک");
  assert.equal(entry.userRole, "player");
  assert.ok(!JSON.stringify(entry).includes(player.nationalId!));
  assert.ok(!JSON.stringify(entry).includes(player.phoneNumber!));

  storage.set(PROFILE_STORAGE_KEY, JSON.stringify({
    ...state,
    profiles: [
      { ...defaults.profiles[0], role: "player", scenarioCatalog: "full", name: "changed" },
      defaults.profiles[1],
      { ...player, role: "admin", scenarioCatalog: "full", name: "changed", progress: 999 },
      { ...otherPlayer, id: "player-invalid", nationalId: null },
      { ...player, id: "player-duplicate" },
    ],
  }));
  const sanitized = loadProfileState(6);
  assert.equal(sanitized.profiles.length, 4);
  assert.equal(sanitized.profiles[0].role, "admin");
  assert.equal(sanitized.profiles[0].name, "ادمین");
  assert.equal(sanitized.profiles[0].scenarioCatalog, "released");
  assert.equal(sanitized.profiles[3].role, "player");
  assert.equal(sanitized.profiles[3].scenarioCatalog, "released");
  assert.equal(sanitized.profiles[3].name, player.name);
  assert.equal(sanitized.profiles[3].progress, 6);

  for (const raw of ["invalid-json", "null", "[]", '{"profiles":{}}']) {
    storage.set(PROFILE_STORAGE_KEY, raw);
    assert.deepEqual(loadProfileState(6), defaults);
  }
  storage.set(PROFILE_STORAGE_KEY, JSON.stringify({ profiles: [], activeProfileId: "missing" }));
  assert.deepEqual(loadProfileState(6).profiles.map(({ id }) => id), ["admin", "scenario-tester"]);
  assert.equal(loadProfileState(6).activeProfileId, "scenario-tester");

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => { throw new Error("Storage unavailable"); },
  });
  assert.deepEqual(loadProfileState(6), defaults);
  assert.throws(() => saveProfileState(state), /Storage unavailable/);
  console.log("Profile validation, persistence, admin password, reload protection, deletion permissions, protected profiles, identity isolation and analytics checks passed.");
} finally {
  if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
  else Reflect.deleteProperty(globalThis, "localStorage");
}
