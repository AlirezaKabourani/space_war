import type { CorridorId } from '../model/index';
import type { BeliefCheckpointId, BeliefTelemetry } from '../model/cognitive/types';
import type { Scenario5RuntimeState } from '../model/runtime/index';
import type { Scenario5AarViewModel } from './presentation';
import type { buildMissionAar } from './endingPresentation';
import {
  SCENARIO5_ACTOR_LABELS_FA, SCENARIO5_ATTRIBUTION_STATUS_LABELS_FA,
  SCENARIO5_BELIEF_COPY_FA, SCENARIO5_CORRIDOR_CONTENT_FA,
  SCENARIO5_DIRECTION_LABELS_FA, SCENARIO5_SOURCE_LABELS_FA, SCENARIO5_STRENGTH_LABELS_FA,
} from './uiContentFa';

export const BELIEF_CHECKPOINT_ORDER = ['A2_prebelief', 'A2_postbelief', 'C_belief_checkpoint', 'D_final_belief'] as const;
export const BELIEF_REALITY_COPY = {
  title: 'آنچه تصور می‌کردید، در برابر آنچه واقعاً رخ داد',
  intro: 'در طول مأموریت، برآوردهای شما بر اساس اطلاعات همان لحظه ثبت شد. اکنون می‌توانید این برداشت‌ها را با وضعیت پنهان شبیه‌سازی و شواهدی که بعداً آشکار شدند مقایسه کنید. تفاوت برداشت و واقعیت لزوماً نشانه تصمیم‌گیری ضعیف نیست.',
  same: 'کریدور انتخاب‌شده در برآورد نهایی با کریدور اصلی اختلال در مدل یکسان بود.',
  different: 'کریدور انتخاب‌شده در برآورد نهایی با کریدور اصلی اختلال در مدل متفاوت بود.',
  comparisonNote: 'این مقایسه فقط همسانی نام کریدور را نشان می‌دهد؛ به‌تنهایی معادل انتساب عملیاتی، دقت شناختی یا کیفیت تصمیم نیست.',
  unavailable: 'در دسترس نیست؛ داده معتبر این مورد ثبت نشده است.',
  checkpointUnavailable: 'داده‌های این مقطع ثبت نشده یا کامل و معتبر نیستند؛ مقادیر موجود جداگانه نمایش داده می‌شوند.',
  neutral: 'از داده‌های این اجرا نمی‌توان علت مشخصی برای انتخاب کریدور یا تغییر برداشت بازیکن استنباط کرد.',
  lateNote: 'این شواهد هنگام ثبت برآورد نهایی در اختیار شما نبودند.',
  conclusion: 'در این گزارش، برداشت‌های ثبت‌شده و وضعیت پنهان مدل در کنار هم قرار گرفته‌اند. این بخش برای بازنگری آموزشی مسیر تصمیم‌گیری است و در امتیازهای شناختی یا نتیجه مأموریت تغییری ایجاد نمی‌کند.',
} as const;

const object = (v: unknown): Record<string, unknown> | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
const percent = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
const corridor = (v: unknown): CorridorId | null => typeof v === 'string' && Object.hasOwn(SCENARIO5_CORRIDOR_CONTENT_FA, v) ? v as CorridorId : null;
const label = (catalog: Readonly<Record<string, string>>, v: unknown): string | null => typeof v === 'string' && Object.hasOwn(catalog, v) ? catalog[v] : null;
const snapshot = (v: unknown): readonly string[] | null => Array.isArray(v) && v.every(id => typeof id === 'string' && id.length > 0) ? [...new Set(v)] as string[] : null;

export interface BeliefRealityEvidence {
  readonly evidenceId: string;
  readonly available: boolean;
  readonly sourceLabel: string | null;
  readonly observedCorridorLabel: string | null;
  readonly observedCorridorId: CorridorId | null;
  readonly direction: string | null;
  readonly directionLabel: string | null;
  readonly strengthLabel: string | null;
  readonly sourceType: string | null;
}

export interface BeliefRealityCheckpoint {
  readonly checkpointId: BeliefCheckpointId;
  readonly title: string;
  readonly belief: BeliefTelemetry | null;
  readonly valid: boolean;
  readonly corridorId: CorridorId | null;
  readonly corridorConfidence: number | null;
  readonly targetedInterferenceEstimate: number | null;
  readonly targetedInterferenceConfidence: number | null;
  readonly snapshotIds: readonly string[] | null;
  readonly evidence: readonly BeliefRealityEvidence[] | null;
  readonly freshEvidenceIds: readonly string[] | null;
  readonly matches: boolean | null;
  readonly transition: {
    readonly corridorBefore: CorridorId; readonly corridorAfter: CorridorId;
    readonly confidence: readonly [number, number]; readonly estimate: readonly [number, number];
    readonly estimateConfidence: readonly [number, number];
  } | null;
  readonly observations: readonly string[];
}

// This projection reads completed AAR inputs only. It never resolves/replays a game engine.
export function buildBeliefRealityAarView(
  state: Scenario5RuntimeState,
  audit: Scenario5AarViewModel,
  aar: Pick<ReturnType<typeof buildMissionAar>, 'end' | 'lateEvidenceIds'>,
) {
  // Check completion and ownership before accessing any hidden-truth field.
  if (state.stage.stageId !== 'complete' || !state.runId || state.runId !== audit.result.runId
    || state.runId !== audit.result.cognitive?.runId) return null;

  const primary = corridor(audit.truth.primaryAffectedCorridorId);
  const records: readonly unknown[] = Array.isArray(state.beliefs) ? state.beliefs : [];
  const byEvidenceId = new Map<string, Record<string, unknown> | null>();
  for (const raw of state.evidence) {
    const e = object(raw);
    if (e && typeof e.evidenceId === 'string') byEvidenceId.set(e.evidenceId, byEvidenceId.has(e.evidenceId) ? null : e);
  }
  const evidenceFor = (id: string): BeliefRealityEvidence => {
    const e = byEvidenceId.get(id);
    const observed = corridor(e?.observedCorridorId);
    return {
      evidenceId: id, available: !!e,
      sourceLabel: label(SCENARIO5_SOURCE_LABELS_FA, e?.sourceType),
      observedCorridorId: observed,
      observedCorridorLabel: observed ? SCENARIO5_CORRIDOR_CONTENT_FA[observed].corridorLabel
        : e?.observedCorridorId === null ? 'چندکریدوری / کریدور مشخص نشده' : null,
      sourceType: label(SCENARIO5_SOURCE_LABELS_FA, e?.sourceType) ? e!.sourceType as string : null,
      direction: label(SCENARIO5_DIRECTION_LABELS_FA, e?.direction) ? e!.direction as string : null,
      directionLabel: label(SCENARIO5_DIRECTION_LABELS_FA, e?.direction),
      strengthLabel: label(SCENARIO5_STRENGTH_LABELS_FA, e?.strengthBand),
    };
  };

  const checkpoints: BeliefRealityCheckpoint[] = [];
  for (const checkpointId of BELIEF_CHECKPOINT_ORDER) {
    const matches = records.filter(raw => object(raw)?.checkpointId === checkpointId);
    // Ambiguous duplicate checkpoints are unavailable; do not pick an arbitrary record.
    const record = matches.length === 1 ? object(matches[0]) : null;
    const corridorId = corridor(record?.mostLikelyCorridorId);
    const corridorConfidence = percent(record?.corridorConfidence);
    const targetedInterferenceEstimate = percent(record?.targetedInterferenceEstimate);
    const targetedInterferenceConfidence = percent(record?.targetedInterferenceConfidence);
    const snapshotIds = snapshot(record?.visibleEvidenceIdsAtCheckpoint);
    const previous = checkpoints.at(-1);
    const valid = !!record && corridorId !== null && corridorConfidence !== null
      && targetedInterferenceEstimate !== null && targetedInterferenceConfidence !== null && snapshotIds !== null
      && typeof record.recordedAtMs === 'number' && Number.isFinite(record.recordedAtMs) && record.recordedAtMs >= 0
      && (!previous?.belief || record.recordedAtMs >= previous.belief.recordedAtMs);
    const previousIds = previous?.snapshotIds;
    const freshEvidenceIds = previousIds && snapshotIds ? snapshotIds.filter(id => !previousIds.includes(id)) : null;
    const evidence = snapshotIds?.map(evidenceFor) ?? null;
    const observations: string[] = [];
    if (snapshotIds?.length === 0) observations.push('اطلاعات موجود در آن مقطع محدود بود؛ هیچ شاهدی در فهرست ثبت‌شده آن مقطع وجود نداشت.');
    if (evidence?.some(e => e.direction === 'ambiguous')) observations.push('در آن مقطع، شواهدی با برچسب مبهم / چندتفسیره وجود داشت.');
    if (new Set(evidence?.flatMap(e => e.observedCorridorId ? [e.observedCorridorId] : [])).size > 1) observations.push('شواهد به بیش از یک کریدور اشاره داشتند.');
    if (new Set(evidence?.flatMap(e => e.sourceType ? [e.sourceType] : [])).size > 1) observations.push('اطلاعات از چند نوع منبع دریافت شده بود.');
    const prior = previous?.belief;
    const belief = valid ? matches[0] as BeliefTelemetry : null;
    checkpoints.push({
      checkpointId, title: SCENARIO5_BELIEF_COPY_FA[`belief:${checkpointId}`].title, belief, valid,
      corridorId, corridorConfidence, targetedInterferenceEstimate, targetedInterferenceConfidence,
      snapshotIds, evidence, freshEvidenceIds, matches: valid && primary !== null ? corridorId === primary : null,
      transition: prior && belief ? {
        corridorBefore: prior.mostLikelyCorridorId, corridorAfter: belief.mostLikelyCorridorId,
        confidence: [prior.corridorConfidence, belief.corridorConfidence],
        estimate: [prior.targetedInterferenceEstimate, belief.targetedInterferenceEstimate],
        estimateConfidence: [prior.targetedInterferenceConfidence, belief.targetedInterferenceConfidence],
      } : null,
      observations: observations.length ? observations : [BELIEF_REALITY_COPY.neutral],
    });
  }
  const final = checkpoints[3];
  const postureLabels: Readonly<Record<string, string>> = { covert: 'پنهان', probing: 'آزمودن واکنش', committed: 'درگیر', disengaging: 'کاهش درگیری' };
  return {
    runId: state.runId, checkpoints, final,
    primaryCorridorId: primary,
    actorLabel: label(SCENARIO5_ACTOR_LABELS_FA, audit.truth.actorProfile),
    postureLabel: label(postureLabels, audit.truth.finalActorPosture),
    attributionLabel: label(SCENARIO5_ATTRIBUTION_STATUS_LABELS_FA, state.missionState.operationalAttributionStatus),
    threatContained: typeof aar.end.threatContained === 'boolean' ? aar.end.threatContained : null,
    lateEvidence: final.snapshotIds === null ? null : aar.lateEvidenceIds.map(evidenceFor),
  };
}

export type BeliefRealityAarView = NonNullable<ReturnType<typeof buildBeliefRealityAarView>>;
