import { PROFILE_STORAGE_KEY } from "./profileStorage";
import { validateProfileInput, type Profile, type ProfileInput } from "../../core/types/profile";
import { SYSTEM_LOG_KEY } from "../analytics/systemLogger";

export const BEHAVIOR_LOG_KEY = "space-war.analytics.events";
export const LOGGING_ENABLED_KEY = "space-war.analytics.enabled";
const APP_PREFIX = "space-war.";

export interface SystemBackup {
  format: "space-war-system-backup";
  version: 1;
  exportedAt: string;
  entries: Record<string, string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const readSystemEntries = (storage: Storage = localStorage): Record<string, string> => {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(APP_PREFIX)) continue;
    const value = storage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return entries;
};

export const createSystemBackup = (storage: Storage = localStorage): SystemBackup => ({
  format: "space-war-system-backup",
  version: 1,
  exportedAt: new Date().toISOString(),
  entries: readSystemEntries(storage),
});

const validateProfiles = (value: unknown) => {
  if (!isRecord(value) || !Array.isArray(value.profiles) || typeof value.activeProfileId !== "string") {
    throw new Error("اطلاعات پروفایل‌های فایل معتبر نیست.");
  }
  const seen: Profile[] = [];
  for (const profile of value.profiles) {
    if (!isRecord(profile) || typeof profile.id !== "string" || typeof profile.name !== "string" ||
      !["admin", "player"].includes(String(profile.role)) || !["released", "full"].includes(String(profile.scenarioCatalog)) ||
      !Number.isInteger(profile.progress) || Number(profile.progress) < 0 || seen.some(({ id }) => id === profile.id)) {
      throw new Error("ساختار یا شناسهٔ پروفایل‌های فایل معتبر نیست.");
    }
    if (!["admin", "test-player", "scenario-tester"].includes(profile.id)) {
      const fields = ["firstName", "lastName", "nationalId", "phoneNumber"] as const;
      if (!profile.id.startsWith("player-") || fields.some((key) => typeof profile[key] !== "string") ||
        Object.keys(validateProfileInput(profile as unknown as ProfileInput, seen)).length) {
        throw new Error("اطلاعات یکی از بازیکنان در فایل معتبر نیست.");
      }
    }
    if ((profile.id === "admin") !== (profile.role === "admin") ||
      profile.scenarioCatalog !== (profile.id === "scenario-tester" ? "full" : "released")) {
      throw new Error("سطح دسترسی پروفایل‌های فایل معتبر نیست.");
    }
    seen.push(profile as unknown as Profile);
  }
  if (!["admin", "scenario-tester", value.activeProfileId].every((id) => seen.some((profile) => profile.id === id))) {
    throw new Error("پروفایل‌های اصلی یا پروفایل فعال در فایل موجود نیستند.");
  }
};

const validateLog = (value: unknown) => {
  if (!Array.isArray(value) || value.some((event) => !isRecord(event) || typeof event.id !== "string" ||
    typeof event.ts !== "number" || !Number.isFinite(event.ts) || Math.abs(event.ts) > 8.64e15 ||
    typeof event.type !== "string" || (event.detail !== undefined && !isRecord(event.detail)) ||
    ["userId", "userName", "userRole", "nodeId", "action"].some((key) => event[key] !== undefined && typeof event[key] !== "string") ||
    (event.scenarioId !== undefined && typeof event.scenarioId !== "string" && (typeof event.scenarioId !== "number" || !Number.isFinite(event.scenarioId))) ||
    (event.elapsedMs !== undefined && (typeof event.elapsedMs !== "number" || !Number.isFinite(event.elapsedMs) || event.elapsedMs < 0)))) {
    throw new Error("ساختار لاگ‌های فایل معتبر نیست.");
  }
};

export const parseSystemBackup = (text: string): SystemBackup => {
  let value: unknown;
  try { value = JSON.parse(text.replace(/^\uFEFF/, "")); } catch { throw new Error("فایل انتخاب‌شده JSON معتبر نیست."); }
  if (!isRecord(value) || value.format !== "space-war-system-backup" || value.version !== 1 ||
    typeof value.exportedAt !== "string" || !Number.isFinite(Date.parse(value.exportedAt)) || !isRecord(value.entries)) {
    throw new Error("فایل، پشتیبان معتبر این سامانه نیست یا نسخهٔ آن پشتیبانی نمی‌شود.");
  }
  if (!(PROFILE_STORAGE_KEY in value.entries)) throw new Error("فایل پشتیبان فاقد اطلاعات پروفایل‌هاست.");
  for (const [key, raw] of Object.entries(value.entries)) {
    if (!key.startsWith(APP_PREFIX) || typeof raw !== "string") throw new Error("فایل دارای دادهٔ نامعتبر یا نامرتبط با سامانه است.");
    if (key === LOGGING_ENABLED_KEY) {
      if (raw !== "true" && raw !== "false") throw new Error("وضعیت لاگ‌برداری در فایل معتبر نیست.");
    } else if (key === PROFILE_STORAGE_KEY || key === BEHAVIOR_LOG_KEY || key === SYSTEM_LOG_KEY || key.startsWith("space-war.scenario4.")) {
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { throw new Error(`دادهٔ ذخیره‌شده در بخش «${key}» معتبر نیست.`); }
      if (key === PROFILE_STORAGE_KEY) validateProfiles(parsed);
      else if (key === BEHAVIOR_LOG_KEY || key === SYSTEM_LOG_KEY) validateLog(parsed);
      else if (!isRecord(parsed)) throw new Error("اطلاعات سناریو در فایل معتبر نیست.");
    }
  }
  return value as unknown as SystemBackup;
};

export const getBackupSummary = (backup: SystemBackup) => {
  const profiles = JSON.parse(backup.entries[PROFILE_STORAGE_KEY] ?? '{"profiles":[]}').profiles as Profile[];
  return {
    profileCount: profiles.length,
    playerCount: profiles.filter((profile) => profile.role === "player").length,
    behaviorEventCount: (JSON.parse(backup.entries[BEHAVIOR_LOG_KEY] ?? "[]") as unknown[]).length,
    systemEventCount: (JSON.parse(backup.entries[SYSTEM_LOG_KEY] ?? "[]") as unknown[]).length,
    entryCount: Object.keys(backup.entries).length,
  };
};

const replaceEntries = (entries: Record<string, string>, storage: Storage) => {
  const previous = readSystemEntries(storage);
  try {
    for (const key of Object.keys(previous)) storage.removeItem(key);
    for (const [key, value] of Object.entries(entries)) storage.setItem(key, value);
  } catch {
    try {
      for (const key of Object.keys(readSystemEntries(storage))) storage.removeItem(key);
      for (const [key, value] of Object.entries(previous)) storage.setItem(key, value);
    } catch {
      throw new Error("ذخیره‌سازی و بازگردانی اطلاعات ناموفق بود. صفحه را باز نگه دارید و فایل پشتیبان را نگه دارید.");
    }
    throw new Error("تغییر اطلاعات انجام نشد؛ اطلاعات قبلی بازگردانده شد. فضای ذخیره‌سازی مرورگر را بررسی کنید.");
  }
};

export const restoreSystemBackup = (backup: SystemBackup, storage: Storage = localStorage) => {
  const validated = parseSystemBackup(JSON.stringify(backup));
  replaceEntries(validated.entries, storage);
};

export const resetSystemStorage = (storage: Storage = localStorage) => replaceEntries({}, storage);
