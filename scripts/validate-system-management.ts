import assert from "node:assert/strict";
import { createPlayerProfile } from "../src/core/types/profile";
import { loadProfileState, PROFILE_STORAGE_KEY, saveProfileState } from "../src/services/storage/profileStorage";
import {
  BEHAVIOR_LOG_KEY, LOGGING_ENABLED_KEY, createSystemBackup, getBackupSummary,
  parseSystemBackup, readSystemEntries, resetSystemStorage, restoreSystemBackup,
} from "../src/services/storage/systemStorage";
import { eventLogger, type EventLogEntry } from "../src/services/analytics/eventLogger";
import { systemLogger, SYSTEM_LOG_KEY } from "../src/services/analytics/systemLogger";
import { buildLogCSV } from "../src/services/analytics/logExport";

class MemoryStorage implements Storage {
  private entries = new Map<string, string>();
  failNextKey: string | null = null;
  get length() { return this.entries.size; }
  key(index: number) { return [...this.entries.keys()][index] ?? null; }
  getItem(key: string) { return this.entries.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (key === this.failNextKey) {
      this.failNextKey = null;
      throw new Error("Simulated quota error");
    }
    this.entries.set(key, value);
  }
  removeItem(key: string) { this.entries.delete(key); }
  clear() { this.entries.clear(); }
}

const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const bindStorage = (storage: Storage) => Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });

try {
  const source = new MemoryStorage();
  bindStorage(source);
  const defaults = loadProfileState(6);
  const player = { ...createPlayerProfile({ firstName: "بازیکن", lastName: "منتقل‌شده", nationalId: "0012345678", phoneNumber: "09121234567" }), progress: 2 };
  const sourceState = { profiles: [...defaults.profiles.filter(({ id }) => id !== "test-player"), player], activeProfileId: player.id };
  saveProfileState(sourceState);
  const events: EventLogEntry[] = [
    { id: "legacy-0", ts: 1700000000000, type: "scenario_start", scenarioId: 0, userId: player.id },
    { id: "s4-1", ts: 1700000001000, type: "s4_orientation_models", scenarioId: "s4_redesigned_scenario_one", userId: player.id, detail: { runId: "run-s4", modelVersion: "v3", cognitive: { score: -0.25, completeness: null }, decisions: [{ id: "m1", choice: "stay" }] } },
    { id: "s5-1", ts: 1700000002000, type: "s5_v3_decision", scenarioId: "s5_silent_waves_redesign", userId: player.id, userName: '=HYPERLINK("https://invalid")', detail: { runId: "run-s5", decision: { roundId: 2, selection: { actionId: "reroute", targetCorridorId: "alpha" } }, resourcesAfter: { isr: 50 }, note: 'comma, quote"\nnext line' } },
    { id: "s5-2", ts: 1700000003000, type: "s5_v3_run_completed", scenarioId: "s5_silent_waves_redesign", detail: { domain: { metric: 3 }, cognitive: { dataCompleteness: { overall: "complete" } } } },
  ];
  source.setItem(BEHAVIOR_LOG_KEY, JSON.stringify(events));
  source.setItem(LOGGING_ENABLED_KEY, "false");
  source.setItem("space-war.scenario4.redesigned-s1.final.snapshot", JSON.stringify({ runId: "run-s4", primaryEndState: "calm_crisis_control" }));
  source.setItem("space-war.future.setting", "preserve future settings");
  source.setItem("other-application-key", "not part of this application");
  assert.equal(eventLogger.log({ type: "must_not_log" }), null);
  systemLogger.log("behavior_logging_stopped", defaults.profiles[0]);
  assert.equal(systemLogger.getEvents().length, 1, "Administrative auditing continues while behavior logging is stopped");

  const backup = parseSystemBackup(JSON.stringify(createSystemBackup()));
  assert.ok(!("other-application-key" in backup.entries));
  assert.deepEqual(getBackupSummary(backup), { profileCount: 3, playerCount: 2, behaviorEventCount: 4, systemEventCount: 1, entryCount: 6 });
  const destination = new MemoryStorage();
  destination.setItem("other-application-key", "destination only");
  destination.setItem("space-war.stale", "must be removed on replace");
  restoreSystemBackup(backup, destination);
  assert.deepEqual(readSystemEntries(destination), backup.entries, "Transfer preserves every app-owned value byte for byte");
  assert.equal(destination.getItem("other-application-key"), "destination only");
  bindStorage(destination);
  assert.deepEqual(loadProfileState(6), sourceState, "Profiles, contact information, progress, active player and deletions survive transfer");
  assert.deepEqual(eventLogger.getEvents(), events, "All modern and legacy log payloads survive transfer");
  assert.equal(eventLogger.isLoggingEnabled(), false);
  saveProfileState({ ...sourceState, activeProfileId: "admin" });
  assert.equal(loadProfileState(6).activeProfileId, "scenario-tester", "Import cannot unlock admin without its password");

  const csv = buildLogCSV(events);
  assert.ok(csv.startsWith("\uFEFF"), "CSV uses a UTF-8 BOM for Persian Excel text");
  for (const header of ["detail.decision.selection.actionId", "detail.resourcesAfter.isr", "detail.cognitive.score", "detail.domain.metric", "detail.decisions"]) assert.ok(csv.includes(header));
  assert.ok(csv.includes("حریم خاکستری مدار"));
  assert.ok(csv.includes("۲ — امواج خاموش"));
  assert.ok(csv.includes('"-0.25"'), "Negative numeric metrics remain numeric");
  assert.ok(csv.includes("'=HYPERLINK"), "Spreadsheet formula injection is neutralized");
  assert.ok(csv.includes('quote""\nnext line'), "CSV escapes quotes and preserves embedded newlines");
  assert.ok(buildLogCSV([]).includes("timestamp"), "Empty downloads still contain a valid header");

  const beforeInvalid = readSystemEntries(destination);
  for (const corrupt of [
    "invalid-json", "null", JSON.stringify({ ...backup, version: 999 }),
    JSON.stringify({ ...backup, entries: {} }),
    JSON.stringify({ ...backup, entries: { ...backup.entries, "other-application-key": "bad" } }),
    JSON.stringify({ ...backup, entries: { ...backup.entries, [LOGGING_ENABLED_KEY]: "sometimes" } }),
    JSON.stringify({ ...backup, entries: { ...backup.entries, [BEHAVIOR_LOG_KEY]: '[{"ts":null}]' } }),
    JSON.stringify({ ...backup, entries: { ...backup.entries, [BEHAVIOR_LOG_KEY]: JSON.stringify([{ ...events[0], userName: { invalid: true } }]) } }),
    JSON.stringify({ ...backup, entries: { ...backup.entries, [PROFILE_STORAGE_KEY]: JSON.stringify({ ...sourceState, profiles: [...sourceState.profiles, { ...player, id: "player-admin", role: "admin" }] }) } }),
  ]) assert.throws(() => parseSystemBackup(corrupt));
  assert.deepEqual(readSystemEntries(destination), beforeInvalid, "Invalid files never modify destination data");
  assert.throws(() => restoreSystemBackup({ ...backup, version: 999 } as unknown as typeof backup, destination));
  assert.deepEqual(readSystemEntries(destination), beforeInvalid, "Restore revalidates instead of trusting the preview object");

  destination.failNextKey = SYSTEM_LOG_KEY;
  assert.throws(() => restoreSystemBackup(backup, destination));
  assert.deepEqual(readSystemEntries(destination), beforeInvalid, "Partial writes roll back all original data on a quota failure");
  eventLogger.setLoggingEnabled(true);
  eventLogger.setUserContext(player);
  eventLogger.startTimer("before-pause");
  eventLogger.setLoggingEnabled(false);
  assert.equal(eventLogger.stopTimer("before-pause"), undefined, "Pause discards timers to avoid including paused time");
  const count = eventLogger.getEvents().length;
  eventLogger.log({ type: "not-recorded" });
  assert.equal(eventLogger.getEvents().length, count);
  eventLogger.setLoggingEnabled(true);
  assert.ok(eventLogger.log({ type: "recording-resumed" }));
  assert.equal(eventLogger.getEvents().length, count + 1);
  destination.failNextKey = LOGGING_ENABLED_KEY;
  assert.throws(() => eventLogger.setLoggingEnabled(false));
  assert.equal(eventLogger.isLoggingEnabled(), true, "A failed settings write must not claim recording was stopped");
  destination.failNextKey = BEHAVIOR_LOG_KEY;
  eventLogger.log({ type: "quota-test" });
  assert.ok(eventLogger.getStorageError(), "Lost behavioral writes must be visible to the admin");

  resetSystemStorage(destination);
  assert.deepEqual(readSystemEntries(destination), {});
  assert.equal(destination.getItem("other-application-key"), "destination only");
  assert.deepEqual(loadProfileState(6), defaults, "Reset restores initial profiles, progress and active selection");
  assert.equal(eventLogger.isLoggingEnabled(), true);
  assert.deepEqual(eventLogger.getEvents(), []);
  assert.deepEqual(systemLogger.getEvents(), []);
  console.log("System transfer, profile identity, modern logs/CSV, access protection, invalid imports, rollback, logging controls and scoped reset checks passed.");
} finally {
  if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
  else Reflect.deleteProperty(globalThis, "localStorage");
}
