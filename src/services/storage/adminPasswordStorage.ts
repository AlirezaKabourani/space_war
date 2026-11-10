import { normalizeDigits } from "../../core/types/profile";
import { requireCognitiveAdminReadAccess, type CognitiveAdminReadAccess } from "./cognitiveAdminReadAccess";

export const ADMIN_PASSWORD_KEY = "space-war.admin-password.v1";
const ITERATIONS = 600000;
const DEFAULT_PASSWORD = "8888";

interface PasswordRecord {
  version: 1;
  algorithm: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  hash: string;
}

export function validateAdminPasswordRecord(value: unknown): asserts value is PasswordRecord {
  if (!value || typeof value !== "object" ||
    !("version" in value) || value.version !== 1 ||
    !("algorithm" in value) || value.algorithm !== "PBKDF2-SHA256" ||
    !("iterations" in value) || value.iterations !== ITERATIONS ||
    !("salt" in value) || typeof value.salt !== "string" || !/^[a-f0-9]{32}$/.test(value.salt) ||
    !("hash" in value) || typeof value.hash !== "string" || !/^[a-f0-9]{64}$/.test(value.hash)) {
    throw new Error("اطلاعات ذخیره‌شده رمز ادمین معتبر نیست.");
  }
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

async function deriveHash(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("تغییر یا بررسی رمز در این محیط ممکن نیست؛ برنامه را با HTTPS یا روی localhost باز کنید.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(normalizeDigits(password)), "PBKDF2", false, ["deriveBits"]);
  const bytes = Uint8Array.from(salt.match(/../g)!, (pair) => parseInt(pair, 16));
  const result = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytes, iterations: ITERATIONS }, key, 256);
  return hex(new Uint8Array(result));
}

function readPassword(): { raw: string | null; record: PasswordRecord | null } {
  try {
    const raw = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (raw === null) return { raw, record: null };
    const record: unknown = JSON.parse(raw);
    validateAdminPasswordRecord(record);
    return { raw, record };
  } catch {
    throw new Error("خواندن رمز ادمین ممکن نشد؛ ذخیره‌سازی مرورگر را بررسی کنید.");
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password || password.length > 256) return false;
  const { raw, record } = readPassword();
  const matches = record ? await deriveHash(password, record.salt) === record.hash : normalizeDigits(password) === DEFAULT_PASSWORD;
  return matches && localStorage.getItem(ADMIN_PASSWORD_KEY) === raw;
}

export async function changeAdminPassword(access: CognitiveAdminReadAccess | null, currentPassword: string, newPassword: string): Promise<void> {
  requireCognitiveAdminReadAccess(access, "admin");
  if (!newPassword.trim()) throw new Error("رمز جدید را وارد کنید.");
  if (newPassword.length > 256) throw new Error("رمز جدید باید حداکثر ۲۵۶ نویسه باشد.");
  const { raw } = readPassword();
  if (!await verifyAdminPassword(currentPassword)) throw new Error("رمز فعلی ادمین نادرست است.");
  if (normalizeDigits(currentPassword) === normalizeDigits(newPassword)) throw new Error("رمز جدید باید با رمز فعلی متفاوت باشد.");
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await deriveHash(newPassword, salt);
  requireCognitiveAdminReadAccess(access, "admin");
  if (localStorage.getItem(ADMIN_PASSWORD_KEY) !== raw) throw new Error("رمز ادمین در صفحه دیگری تغییر کرده است؛ دوباره تلاش کنید.");
  try {
    localStorage.setItem(ADMIN_PASSWORD_KEY, JSON.stringify({ version: 1, algorithm: "PBKDF2-SHA256", iterations: ITERATIONS, salt, hash } satisfies PasswordRecord));
  } catch {
    throw new Error("رمز جدید ذخیره نشد؛ رمز قبلی همچنان معتبر است. فضای ذخیره‌سازی مرورگر را بررسی کنید.");
  }
}
