import assert from "node:assert/strict";
import { ADMIN_PASSWORD_KEY, changeAdminPassword, verifyAdminPassword } from "../src/services/storage/adminPasswordStorage";
import { createCognitiveAdminReadAccess, revokeCognitiveAdminReadAccess } from "../src/services/storage/cognitiveAdminReadAccess";
import { loadProfileState, saveProfileState, selectProfile } from "../src/services/storage/profileStorage";
import { createSystemBackup, parseSystemBackup, resetSystemStorage, restoreSystemBackup } from "../src/services/storage/systemStorage";

class MemoryStorage implements Storage {
  entries = new Map<string, string>();
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

const storage = new MemoryStorage();
const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
try {
  let state = loadProfileState(6);
  saveProfileState(state);
  assert.equal(await verifyAdminPassword("8888"), true);
  assert.equal(await verifyAdminPassword("۸۸۸۸"), true);
  assert.equal(await verifyAdminPassword("wrong"), false);
  const access = createCognitiveAdminReadAccess(() => state);
  await assert.rejects(changeAdminPassword(null, "8888", "new-password"), /ادمین/);
  await assert.rejects(changeAdminPassword(access, "8888", "new-password"), /ادمین/);
  state = await selectProfile(state, "admin", "8888");
  saveProfileState(state);
  await assert.rejects(changeAdminPassword(access, "wrong", "new-password"), /فعلی/);
  await assert.rejects(changeAdminPassword(access, "8888", " \n "), /جدید/);
  await assert.rejects(changeAdminPassword(access, "8888", "x".repeat(257)), /حداکثر/);
  await assert.rejects(changeAdminPassword(access, "8888", "۸۸۸۸"), /متفاوت/);
  assert.equal(storage.getItem(ADMIN_PASSWORD_KEY), null);
  storage.failWrites = true;
  await assert.rejects(changeAdminPassword(access, "8888", "new-password"), /ذخیره نشد/);
  storage.failWrites = false;
  assert.equal(await verifyAdminPassword("8888"), true);
  await changeAdminPassword(access, "8888", "New-Password-۱۲۳");
  assert.equal(await verifyAdminPassword("8888"), false);
  assert.equal(await verifyAdminPassword("New-Password-123"), true);
  const stored = storage.getItem(ADMIN_PASSWORD_KEY)!;
  assert.ok(!stored.includes("New-Password"), "Raw passwords must not be persisted");
  assert.equal(await verifyAdminPassword("new-password-123"), false, "Letters remain case-sensitive");
  assert.equal(await verifyAdminPassword(" New-Password-123"), false, "Passwords are not silently trimmed");
  const reloaded = loadProfileState(6);
  assert.notEqual(reloaded.activeProfileId, "admin");
  assert.strictEqual(await selectProfile(reloaded, "admin", "8888"), reloaded);
  assert.equal((await selectProfile(reloaded, "admin", "New-Password-123")).activeProfileId, "admin");

  const backup = parseSystemBackup(JSON.stringify(createSystemBackup()));
  assert.equal(backup.entries[ADMIN_PASSWORD_KEY], stored);
  resetSystemStorage();
  assert.equal(await verifyAdminPassword("8888"), true);
  restoreSystemBackup(backup);
  assert.equal(await verifyAdminPassword("New-Password-123"), true);
  for (const raw of ["broken JSON", "null", JSON.stringify({ ...JSON.parse(stored), iterations: 1 }), JSON.stringify({ ...JSON.parse(stored), hash: "wrong" })]) {
    storage.setItem(ADMIN_PASSWORD_KEY, raw);
    await assert.rejects(verifyAdminPassword("8888"), /خواندن/);
    await assert.rejects(changeAdminPassword(access, "8888", "replacement"), /خواندن/);
    assert.equal(storage.getItem(ADMIN_PASSWORD_KEY), raw);
    assert.throws(() => parseSystemBackup(JSON.stringify({ ...backup, entries: { ...backup.entries, [ADMIN_PASSWORD_KEY]: raw } })));
  }
  storage.setItem(ADMIN_PASSWORD_KEY, stored);
  // Losing the live admin session during password hashing must prevent the update.
  const pendingChange = changeAdminPassword(access, "New-Password-123", "Should-not-be-saved");
  revokeCognitiveAdminReadAccess(access);
  await assert.rejects(pendingChange, /ادمین/);
  assert.equal(storage.getItem(ADMIN_PASSWORD_KEY), stored);
  console.log("Admin password: current-password checks, validation, salted hashing, new-password login after reload, old-password rejection, digit normalization, denied/revoked sessions, storage failures, corrupt data, backup/restore and reset passed.");
} finally {
  if (previous) Object.defineProperty(globalThis, "localStorage", previous);
  else Reflect.deleteProperty(globalThis, "localStorage");
}
