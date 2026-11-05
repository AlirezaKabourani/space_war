import { loadProfileState } from './profileStorage';
import { readCognitiveArchivePolicy } from './cognitiveArchivePolicy';
import { validateSavedCognitiveRun, type SavedCognitiveRunV1 } from './cognitiveRunValidation';
import { requireCognitiveAdminReadAccess, type CognitiveAdminReadAccess } from './cognitiveAdminReadAccess';

export const COGNITIVE_ARCHIVE_DB = 'space-war.completed-cognitive-runs.v1';
export const COGNITIVE_ARCHIVE_STORE = 'completedRuns';
export class CognitiveStorageError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.name = 'CognitiveStorageError'; this.code = code; }
}
const storageFailure = (error: unknown) => error instanceof CognitiveStorageError ? error : new CognitiveStorageError(
  error instanceof DOMException ? error.name : 'StorageError',
  `ذخیره/خواندن آرشیو شناختی ناموفق بود (${error instanceof Error ? error.message : String(error)}).`,
);

export function requireExistingCognitiveOwner(profileId: string): void {
  // This is an interface-level profile check, not authenticated authorization.
  if (typeof profileId !== 'string' || !profileId.trim() || !loadProfileState(3).profiles.some(p => p.id === profileId)) {
    throw new CognitiveStorageError('OwnerMissing', 'پروفایل معتبر آغازکننده در دسترس نیست؛ گزارش ذخیره نشد.');
  }
  // Detect unavailable localStorage rather than accepting the profile loader's fallback on an exception.
  localStorage.getItem('space-war.profiles.v1');
}

async function openArchive(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') throw new CognitiveStorageError('Unavailable', 'IndexedDB در این مرورگر در دسترس نیست.');
      const request = indexedDB.open(COGNITIVE_ARCHIVE_DB, 1);
      let finished = false;
      const timer = setTimeout(() => { finished = true; reject(new CognitiveStorageError('Unavailable', 'زمان انتظار آرشیو پایان یافت؛ محدودیت ذخیره‌سازی مرورگر را بررسی کنید.')); }, 5000);
      const stop = (error: unknown) => { clearTimeout(timer); finished = true; reject(storageFailure(error)); };
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(COGNITIVE_ARCHIVE_STORE, { keyPath: 'recordId' });
        for (const key of ['userProfileId', 'releasedScenarioId', 'recordedAtIso']) store.createIndex(key, key);
        store.createIndex('ownerScenarioOrder', ['userProfileId', 'releasedScenarioId', 'recordedAtIso', 'recordId']);
      };
      request.onerror = () => stop(request.error);
      request.onblocked = () => stop(new CognitiveStorageError('Blocked', 'آرشیو توسط صفحه دیگری مسدود شده است؛ صفحه‌های قدیمی را ببندید.'));
      request.onsuccess = () => {
        clearTimeout(timer);
        if (finished) { request.result.close(); return; }
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    } catch (error) { reject(storageFailure(error)); }
  });
}

async function transaction<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, result: (v: T) => void, abort: (error: unknown) => void) => void): Promise<T> {
  const db = await openArchive();
  try {
    return await new Promise<T>((resolve, reject) => {
      let value: T;
      let failure: unknown;
      const tx = db.transaction(COGNITIVE_ARCHIVE_STORE, mode);
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(storageFailure(failure ?? tx.error));
      tx.onerror = () => { failure ??= tx.error; };
      const abort = (error: unknown) => { failure = error; tx.abort(); };
      try { work(tx.objectStore(COGNITIVE_ARCHIVE_STORE), v => { value = v; }, abort); }
      catch (error) { abort(error); }
    });
  } catch (error) { throw storageFailure(error); }
  finally { db.close(); }
}

export type CognitiveInsertResult = { status: 'saved' | 'already-saved'; recordId: string } | { status: 'disabled' };

// Used by the real completion adapter only; this low-level store is not a provenance/security boundary.
export async function insertCompletedCognitiveRunIfAbsent(input: SavedCognitiveRunV1): Promise<CognitiveInsertResult> {
  const policy = readCognitiveArchivePolicy();
  if (policy.error) throw new CognitiveStorageError('PolicyUnavailable', policy.error);
  if (!policy.enabled) return { status: 'disabled' };
  const record = structuredClone(input);
  validateSavedCognitiveRun(record);
  requireExistingCognitiveOwner(record.userProfileId);
  return transaction('readwrite', (store, done, abort) => {
    const get = store.get(record.recordId);
    get.onsuccess = () => {
      try {
        // Re-read after asynchronous DB opening and immediately before mutation.
        const currentPolicy = readCognitiveArchivePolicy();
        if (currentPolicy.error) throw new CognitiveStorageError('PolicyUnavailable', currentPolicy.error);
        if (!currentPolicy.enabled) { done({ status: 'disabled' }); return; }
        requireExistingCognitiveOwner(record.userProfileId);
        if (get.result !== undefined) {
          validateSavedCognitiveRun(get.result);
          const { recordedAtIso: oldTime, ...old } = get.result;
          const { recordedAtIso: newTime, ...next } = record;
          void oldTime; void newTime;
          if (JSON.stringify(old) !== JSON.stringify(next)) throw new CognitiveStorageError('IdentityConflict', 'شناسه تلاش با گزارش دیگری تعارض دارد؛ بازنویسی انجام نشد.');
          done({ status: 'already-saved', recordId: record.recordId });
        } else {
          const add = store.add({ ...record, recordedAtIso: new Date().toISOString() });
          add.onsuccess = () => done({ status: 'saved', recordId: record.recordId });
        }
      } catch (error) { abort(error); }
    };
  });
}

function requireReadAccess(profileId: string, currentProfileId: string): void {
  requireExistingCognitiveOwner(profileId);
  if (profileId !== currentProfileId) throw new CognitiveStorageError('OwnerMismatch', 'گزارش متعلق به پروفایل انتخاب‌شده نیست.');
}

export async function listCognitiveRuns(profileId: string, scenarioId: 4 | 5, currentProfileId: string): Promise<SavedCognitiveRunV1[]> {
  requireReadAccess(profileId, currentProfileId);
  if (scenarioId !== 4 && scenarioId !== 5) throw new CognitiveStorageError('ScenarioMismatch', 'سناریوی آرشیو نامعتبر است.');
  return transaction('readonly', (store, done, abort) => {
    const get = store.index('userProfileId').getAll(profileId);
    get.onsuccess = () => {
      try {
        requireReadAccess(profileId, currentProfileId);
        const rows: SavedCognitiveRunV1[] = [];
        for (const value of get.result) {
          validateSavedCognitiveRun(value);
          if (value.userProfileId !== profileId) throw new CognitiveStorageError('OwnerMismatch', 'مالک رکورد نامعتبر است.');
          if (value.releasedScenarioId === scenarioId) rows.push(value);
        }
        rows.sort((a, b) => b.recordedAtIso.localeCompare(a.recordedAtIso) || b.recordId.localeCompare(a.recordId));
        done(rows);
      } catch (error) { abort(error); }
    };
  });
}

export async function readCognitiveRun(recordId: string, currentProfileId: string): Promise<SavedCognitiveRunV1 | null> {
  requireExistingCognitiveOwner(currentProfileId);
  return transaction('readonly', (store, done, abort) => {
    const get = store.get(recordId);
    get.onsuccess = () => {
      try {
        if (get.result === undefined) { done(null); return; }
        validateSavedCognitiveRun(get.result);
        requireReadAccess(get.result.userProfileId, currentProfileId);
        done(get.result);
      } catch (error) { abort(error); }
    };
  });
}

// Admin reads use their own explicit session scope; never impersonate the owner
// through the original owner-only APIs. No policy, record, telemetry or schema write.
async function scopedAdminRead<T>(targetProfileId: string, access: CognitiveAdminReadAccess | null,
  read: (store: IDBObjectStore, done: (value: T) => void, abort: (error: unknown) => void) => void,
  empty: T): Promise<T> {
  requireCognitiveAdminReadAccess(access, targetProfileId);
  if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
    throw new CognitiveStorageError('Unavailable', 'خواندن بدون تغییر آرشیو در این مرورگر در دسترس نیست.');
  }
  let databases: IDBDatabaseInfo[];
  try { databases = await indexedDB.databases(); }
  catch (error) { throw storageFailure(error); }
  requireCognitiveAdminReadAccess(access, targetProfileId);
  if (!databases.some(db => db.name === COGNITIVE_ARCHIVE_DB)) return empty;
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(COGNITIVE_ARCHIVE_DB, 1);
    const timeout = setTimeout(() => fail(new CognitiveStorageError('Unavailable', 'زمان انتظار خواندن آرشیو پایان یافت.')), 5000);
    let abandoned = false;
    const fail = (error: unknown) => { abandoned = true; clearTimeout(timeout); reject(error); };
    request.onupgradeneeded = () => {
      request.transaction?.abort();
      fail(new CognitiveStorageError('SchemaUnavailable', 'آرشیو موجود نیست یا نسخه آن تغییر کرده است؛ هیچ داده‌ای ساخته نشد.'));
    };
    request.onerror = () => fail(storageFailure(request.error));
    request.onblocked = () => fail(new CognitiveStorageError('Blocked', 'آرشیو توسط صفحه دیگری مسدود شده است.'));
    request.onsuccess = () => {
      clearTimeout(timeout);
      if (abandoned) request.result.close();
      else { request.result.onversionchange = () => request.result.close(); resolve(request.result); }
    };
  });
  try {
    requireCognitiveAdminReadAccess(access, targetProfileId);
    const value = await new Promise<T>((resolve, reject) => {
      let result: T;
      let failure: unknown;
      const tx = db.transaction(COGNITIVE_ARCHIVE_STORE, 'readonly');
      const abort = (error: unknown) => { failure = error; tx.abort(); };
      tx.onabort = () => reject(failure ?? storageFailure(tx.error));
      tx.onerror = () => { failure ??= storageFailure(tx.error); };
      tx.oncomplete = () => {
        try { requireCognitiveAdminReadAccess(access, targetProfileId); resolve(result); }
        catch (error) { reject(error); }
      };
      try { read(tx.objectStore(COGNITIVE_ARCHIVE_STORE), v => { result = v; }, abort); }
      catch (error) { abort(error); }
    });
    requireCognitiveAdminReadAccess(access, targetProfileId);
    return value;
  } finally { db.close(); }
}

export async function listCognitiveRunsForAdmin(targetProfileId: string, scenarioId: 4 | 5, access: CognitiveAdminReadAccess | null): Promise<SavedCognitiveRunV1[]> {
  requireCognitiveAdminReadAccess(access, targetProfileId);
  if (scenarioId !== 4 && scenarioId !== 5) throw new CognitiveStorageError('ScenarioMismatch', 'سناریوی آرشیو نامعتبر است.');
  return scopedAdminRead<SavedCognitiveRunV1[]>(targetProfileId, access, (store, done, abort) => {
    const get = store.index('userProfileId').getAll(targetProfileId);
    get.onsuccess = () => {
      try {
        requireCognitiveAdminReadAccess(access, targetProfileId);
        const rows: SavedCognitiveRunV1[] = [];
        for (const value of get.result) {
          validateSavedCognitiveRun(value);
          if (value.userProfileId !== targetProfileId) throw new CognitiveStorageError('OwnerMismatch', 'مالک رکورد با پروفایل موردنظر تطابق ندارد.');
          if (value.releasedScenarioId === scenarioId) rows.push(value);
        }
        rows.sort((a, b) => a.recordedAtIso === b.recordedAtIso ? (a.recordId < b.recordId ? 1 : a.recordId > b.recordId ? -1 : 0) : a.recordedAtIso < b.recordedAtIso ? 1 : -1);
        done(rows);
      } catch (error) { abort(error); }
    };
  }, []);
}

export async function readCognitiveRunForAdmin(recordId: string, targetProfileId: string, access: CognitiveAdminReadAccess | null): Promise<SavedCognitiveRunV1 | null> {
  return scopedAdminRead<SavedCognitiveRunV1 | null>(targetProfileId, access, (store, done, abort) => {
    const get = store.get(recordId);
    get.onsuccess = () => {
      try {
        requireCognitiveAdminReadAccess(access, targetProfileId);
        if (get.result === undefined) { done(null); return; }
        validateSavedCognitiveRun(get.result);
        if (get.result.userProfileId !== targetProfileId) throw new CognitiveStorageError('OwnerMismatch', 'مالک رکورد با پروفایل موردنظر تطابق ندارد.');
        done(get.result);
      } catch (error) { abort(error); }
    };
  }, null);
}
