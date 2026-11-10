import assert from "node:assert/strict";
import { loadProfileState, saveProfileState } from "../src/services/storage/profileStorage";
import { createCognitiveAdminReadAccess, revokeCognitiveAdminReadAccess } from "../src/services/storage/cognitiveAdminReadAccess";
import { listSuggestionsForAdmin, submitSuggestion, SUGGESTION_STORAGE_KEY } from "../src/services/storage/suggestionStorage";
import { MAX_SUGGESTION_LENGTH } from "../src/core/types/suggestion";
import { createSystemBackup, parseSystemBackup, restoreSystemBackup, resetSystemStorage } from "../src/services/storage/systemStorage";

class MemoryStorage implements Storage {
  private entries = new Map<string, string>();
  failWrites = false;
  get length() { return this.entries.size; }
  key(index: number) { return [...this.entries.keys()][index] ?? null; }
  getItem(key: string) { return this.entries.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error("Quota exceeded");
    this.entries.set(key, value);
  }
  removeItem(key: string) { this.entries.delete(key); }
  clear() { this.entries.clear(); }
}

const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const storage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
try {
  let state = loadProfileState(6);
  saveProfileState(state);
  const player = state.profiles.find((profile) => profile.id === state.activeProfileId)!;
  const admin = state.profiles.find((profile) => profile.role === "admin")!;
  const access = createCognitiveAdminReadAccess(() => state);
  assert.throws(() => listSuggestionsForAdmin(null), /ادمین/);
  assert.throws(() => listSuggestionsForAdmin(access), /ادمین/);
  assert.throws(() => submitSuggestion(player, "general", " \n "), /متن/);
  assert.throws(() => submitSuggestion(player, "scenario", "x".repeat(MAX_SUGGESTION_LENGTH + 1)), /حداکثر/);
  assert.equal(storage.getItem(SUGGESTION_STORAGE_KEY), null);
  submitSuggestion(player, "scenario", "  ایده سناریو\nخط دوم  ");
  submitSuggestion(player, "general", "<script>alert('text only')</script>");
  assert.throws(() => submitSuggestion(admin, "general", "wrong actor"), /پروفایل فعال/);
  state = { ...state, activeProfileId: admin.id };
  saveProfileState(state);
  submitSuggestion(admin, "general", "نظر ادمین");
  let entries = listSuggestionsForAdmin(access);
  assert.equal(entries.length, 3);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 3);
  assert.deepEqual(entries.filter((entry) => entry.userId === player.id).map((entry) => entry.kind).sort(), ["general", "scenario"]);
  assert.equal(entries.find((entry) => entry.kind === "scenario")?.text, "ایده سناریو\nخط دوم");
  const beforeFailure = storage.getItem(SUGGESTION_STORAGE_KEY);
  storage.failWrites = true;
  assert.throws(() => submitSuggestion(admin, "general", "quota failure"), /ذخیره نشد/);
  storage.failWrites = false;
  assert.equal(storage.getItem(SUGGESTION_STORAGE_KEY), beforeFailure);

  // Deleted owners remain reviewable, without merging into another user's identity.
  state = { ...state, profiles: state.profiles.filter((profile) => profile.id !== player.id) };
  saveProfileState(state);
  entries = listSuggestionsForAdmin(access);
  assert.equal(entries.filter((entry) => entry.userId === player.id).length, 2);
  const backup = parseSystemBackup(JSON.stringify(createSystemBackup()));
  const destination = new MemoryStorage();
  restoreSystemBackup(backup, destination);
  assert.equal(destination.getItem(SUGGESTION_STORAGE_KEY), beforeFailure);
  resetSystemStorage(destination);
  assert.equal(destination.getItem(SUGGESTION_STORAGE_KEY), null);
  assert.throws(() => parseSystemBackup(JSON.stringify({ ...backup, entries: { ...backup.entries, [SUGGESTION_STORAGE_KEY]: "[{}]" } })), /پیشنهاد/);

  storage.setItem(SUGGESTION_STORAGE_KEY, "broken JSON");
  assert.throws(() => submitSuggestion(admin, "general", "must not overwrite"), /خواندن/);
  assert.equal(storage.getItem(SUGGESTION_STORAGE_KEY), "broken JSON");
  assert.throws(() => listSuggestionsForAdmin(access), /خواندن/);
  storage.setItem(SUGGESTION_STORAGE_KEY, beforeFailure!);
  state = { ...state, activeProfileId: "scenario-tester" };
  saveProfileState(state);
  assert.throws(() => listSuggestionsForAdmin(access), /ادمین/);
  state = { ...state, activeProfileId: admin.id };
  saveProfileState(state);
  revokeCognitiveAdminReadAccess(access);
  assert.throws(() => listSuggestionsForAdmin(access), /ادمین/);
  console.log("Suggestion validation, ownership, persistence, admin session restrictions, deleted owners, quota errors, backup/restore and reset passed.");
} finally {
  if (previous) Object.defineProperty(globalThis, "localStorage", previous);
  else Reflect.deleteProperty(globalThis, "localStorage");
}
