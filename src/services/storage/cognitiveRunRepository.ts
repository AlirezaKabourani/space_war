import { loadProfileState } from './profileStorage';
import { readCognitiveArchivePolicy } from './cognitiveArchivePolicy';
import { validateSavedCognitiveRun, type SavedCognitiveRunV1 } from './cognitiveRunValidation';

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
