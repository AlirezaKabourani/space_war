import type { Profile } from '../../core/types/profile';
import { loadProfileState, PROFILE_STORAGE_KEY, type ProfileState } from './profileStorage';

export interface CognitiveAdminReadAccess { readonly sessionId: symbol }
type LiveSession = () => ProfileState;
const sessions = new WeakMap<CognitiveAdminReadAccess, LiveSession>();

export class CognitiveAdminReadError extends Error {
  readonly code: 'PermissionDenied' | 'OwnerMissing' | 'ProfileStorageUnavailable';
  constructor(code: CognitiveAdminReadError['code'], message: string) {
    super(message); this.name = 'CognitiveAdminReadError'; this.code = code;
  }
}

// App calls this only after its existing password-based admin selection succeeds.
// A live callback, rather than an admin-shaped object, grounds every read in that session.
export function createCognitiveAdminReadAccess(readLiveSession: LiveSession): CognitiveAdminReadAccess {
  const access = Object.freeze({ sessionId: Symbol('cognitive-admin-read-session') });
  sessions.set(access, readLiveSession);
  return access;
}

export function revokeCognitiveAdminReadAccess(access: CognitiveAdminReadAccess | null): void {
  if (access) sessions.delete(access);
}

export function requireCognitiveAdminReadAccess(access: CognitiveAdminReadAccess | null, targetProfileId: string): Profile {
  const readSession = access && sessions.get(access);
  if (!readSession) throw new CognitiveAdminReadError('PermissionDenied', 'مشاهده این گزارش فقط در نشست فعال ادمین امکان‌پذیر است.');
  const live = readSession();
  const actor = live.profiles.find(p => p.id === live.activeProfileId);
  if (!actor || actor.role !== 'admin') throw new CognitiveAdminReadError('PermissionDenied', 'نشست ادمین پایان یافته است؛ دوباره وارد شوید.');
  let stored: ReturnType<typeof loadProfileState>;
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object' || !('profiles' in raw) || !Array.isArray(raw.profiles) || !('activeProfileId' in raw)) throw new Error('Invalid profile state');
    if (raw.activeProfileId !== actor.id) throw new CognitiveAdminReadError('PermissionDenied', 'پروفایل فعال تغییر کرده است؛ گزارش ادمین قابل مشاهده نیست.');
    stored = loadProfileState(3);
  } catch (error) {
    if (error instanceof CognitiveAdminReadError) throw error;
    throw new CognitiveAdminReadError('ProfileStorageUnavailable', 'خواندن وضعیت پروفایل‌ها ممکن نیست؛ گزارش نمایش داده نشد.');
  }
  if (!stored.profiles.some(p => p.id === actor.id && p.role === 'admin')) throw new CognitiveAdminReadError('PermissionDenied', 'پروفایل ادمین معتبر نیست.');
  const target = live.profiles.find(p => p.id === targetProfileId);
  if (typeof targetProfileId !== 'string' || !targetProfileId.trim() || !target || !stored.profiles.some(p => p.id === targetProfileId)) {
    throw new CognitiveAdminReadError('OwnerMissing', 'پروفایل موردنظر وجود ندارد یا حذف شده است.');
  }
  return target;
}
