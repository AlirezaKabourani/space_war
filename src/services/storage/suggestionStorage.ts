import type { Profile } from "../../core/types/profile";
import { MAX_SUGGESTION_LENGTH, type Suggestion, type SuggestionKind } from "../../core/types/suggestion";
import { requireCognitiveAdminReadAccess, type CognitiveAdminReadAccess } from "./cognitiveAdminReadAccess";
import { loadProfileState, PROFILE_STORAGE_KEY } from "./profileStorage";

export const SUGGESTION_STORAGE_KEY = "space-war.suggestions.v1";
export const SUGGESTIONS_CHANGED_EVENT = "space-war-suggestions-changed";

export function validateSuggestions(value: unknown): asserts value is Suggestion[] {
  if (!Array.isArray(value)) throw new Error("اطلاعات پیشنهادها معتبر نیست.");
  const ids = new Set<string>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object" ||
      typeof entry.id !== "string" || !entry.id.trim() || ids.has(entry.id) ||
      typeof entry.userId !== "string" || !entry.userId.trim() ||
      typeof entry.userName !== "string" || !entry.userName.trim() ||
      (entry.kind !== "scenario" && entry.kind !== "general") ||
      typeof entry.text !== "string" || !entry.text.trim() || entry.text.length > MAX_SUGGESTION_LENGTH ||
      typeof entry.createdAt !== "string" || !Number.isFinite(Date.parse(entry.createdAt))) {
      throw new Error("اطلاعات یکی از پیشنهادها معتبر نیست؛ اطلاعات قبلی بازنویسی نشد.");
    }
    ids.add(entry.id);
  }
}

function readSuggestions(): Suggestion[] {
  try {
    const raw = localStorage.getItem(SUGGESTION_STORAGE_KEY);
    if (raw === null) return [];
    const entries: unknown = JSON.parse(raw);
    validateSuggestions(entries);
    return entries;
  } catch {
    throw new Error("خواندن پیشنهادهای ذخیره‌شده ممکن نشد. اطلاعات قبلی حفظ شده است؛ دوباره تلاش کنید.");
  }
}

export function submitSuggestion(actor: Profile, kind: SuggestionKind, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("متن پیشنهاد را وارد کنید.");
  if (trimmed.length > MAX_SUGGESTION_LENGTH) throw new Error("متن پیشنهاد باید حداکثر ۱۰٬۰۰۰ نویسه باشد.");
  if (kind !== "scenario" && kind !== "general") throw new Error("نوع پیشنهاد معتبر نیست.");

  // Match the current profile before writing; retain a name snapshot after profile deletion.
  const raw: unknown = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? "null");
  const profile = loadProfileState(3).profiles.find((item) => item.id === actor.id);
  if (!raw || typeof raw !== "object" || !("activeProfileId" in raw) || raw.activeProfileId !== actor.id || !profile) {
    throw new Error("پروفایل فعال تغییر کرده است؛ دوباره پروفایل خود را انتخاب کنید.");
  }
  const entries = readSuggestions();
  const entry: Suggestion = {
    id: crypto.randomUUID(), userId: profile.id, userName: profile.name,
    kind, text: trimmed, createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SUGGESTION_STORAGE_KEY, JSON.stringify([...entries, entry]));
  } catch {
    throw new Error("پیشنهاد ذخیره نشد. فضای ذخیره‌سازی مرورگر را بررسی و دوباره تلاش کنید؛ متن شما حفظ شده است.");
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SUGGESTIONS_CHANGED_EVENT));
}

export function listSuggestionsForAdmin(access: CognitiveAdminReadAccess | null): Suggestion[] {
  // Reuse the application's password-unlocked live admin session, including revocation.
  requireCognitiveAdminReadAccess(access, "admin");
  return readSuggestions().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
