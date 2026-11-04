import type { CognitiveModelV3Result } from '../../ui/components/scenario/scenario-four/model/cognitiveEngineV3';
import type { ScenarioOneFinalSnapshot } from '../../ui/components/scenario/scenario-four/model/types';
import type { Scenario5RuntimeResult, Scenario5RuntimeState } from '../../ui/components/scenario/scenario-five/model/runtime/types';
import { insertCompletedCognitiveRunIfAbsent, requireExistingCognitiveOwner } from './cognitiveRunRepository';
import { S1_STAMPS, S2_STAMPS, type SavedCognitiveRunV1 } from './cognitiveRunValidation';

// Identity is separate from scientific runId; object identity rejects rehydrated fixtures.
export interface CognitiveAttempt { readonly recordId: string; readonly userProfileId: string; readonly releasedScenarioId: 4 | 5; readonly sourceRunId: string }
const liveAttempts = new WeakSet<CognitiveAttempt>();
export function beginCognitiveAttempt(userProfileId: string | undefined, scenarioId: string | number, sourceRunId: string): CognitiveAttempt {
  if (!userProfileId) throw new Error('شناسه پروفایل آغازکننده موجود نیست؛ آرشیو انجام نمی‌شود.');
  requireExistingCognitiveOwner(userProfileId);
  const releasedScenarioId = scenarioId === 4 || scenarioId === 's4_redesigned_scenario_one' ? 4 : scenarioId === 5 || scenarioId === 's5_silent_waves_redesign' ? 5 : null;
  if (!releasedScenarioId || !sourceRunId || /preview|fixture|demo|dummy|test.only|design.sample/i.test(sourceRunId)) throw new Error('مسیر واقعی اجرای سناریوی منتشرشده معتبر نیست.');
  const attempt = Object.freeze({ recordId: crypto.randomUUID(), userProfileId, releasedScenarioId, sourceRunId });
  liveAttempts.add(attempt);
  return attempt;
}
function base(attempt: CognitiveAttempt | null) {
  if (!attempt || !liveAttempts.has(attempt)) throw new Error('هویت تلاش آغازشده در دسترس نیست؛ گزارش ذخیره نشد.');
  requireExistingCognitiveOwner(attempt.userProfileId);
  return { schemaVersion: 'cross-scenario-run-v1' as const, ...attempt, recordedAtIso: new Date().toISOString(), source: 'new-completion-v1' as const };
}
export function archiveS1Completion(attempt: CognitiveAttempt | null, snapshot: ScenarioOneFinalSnapshot, cognitive: CognitiveModelV3Result) {
  const record = base(attempt);
  if (record.releasedScenarioId !== 4 || snapshot.scenarioId !== 's4_redesigned_scenario_one' || snapshot.runId !== record.sourceRunId || !snapshot.completedAt || snapshot.cognitiveScoresV3 !== (cognitive as unknown) || !snapshot.move1 || !snapshot.move2 || !snapshot.move3) {
    throw new Error('گزارش تکمیل‌شده سناریوی ۱ با تلاش آغازشده تطابق ندارد.');
  }
  return insertCompletedCognitiveRunIfAbsent({ ...record, releasedScenarioId: 4, internalScenarioId: 's4_redesigned_scenario_one', cognitive, modelStamps: { ...S1_STAMPS } });
}
export function archiveS2Completion(attempt: CognitiveAttempt | null, runtime: Scenario5RuntimeState, result: Scenario5RuntimeResult) {
  const record = base(attempt);
  if (record.releasedScenarioId !== 5 || runtime.stage.stageId !== 'complete' || runtime.runId !== record.sourceRunId || runtime.runId !== result.runId || result.runId !== result.cognitive.runId) throw new Error('گزارش تکمیل‌شده سناریوی ۲ با تلاش آغازشده تطابق ندارد.');
  const saved: SavedCognitiveRunV1 = { ...record, releasedScenarioId: 5, internalScenarioId: 's5_silent_waves_redesign', cognitive: result.cognitive, modelStamps: { ...S2_STAMPS } };
  return insertCompletedCognitiveRunIfAbsent(saved);
}

export async function completionArchiveStatus(action: () => ReturnType<typeof archiveS2Completion>): Promise<string> {
  try {
    const result = await action();
    return result.status === 'disabled' ? 'ذخیره گزارش شناختی غیرفعال است؛ گزارش جدیدی آرشیو نشد.' : 'گزارش شناختی این اجرا برای پروفایل آغازکننده در این مرورگر ذخیره شد.';
  } catch (error) { return `گزارش شناختی ذخیره نشد: ${error instanceof Error ? error.message : String(error)}`; }
}
