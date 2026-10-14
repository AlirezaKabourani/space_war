import type {
  CorridorId,
  EvidenceDirection,
  EvidenceInstance,
  EvidenceRequest,
  EvidenceSourceType,
  EvidenceStrengthBand,
  TrueWorldState,
} from "./types";
import { CANONICAL_CORRIDOR_IDS } from "./worldCatalog";

const PNT_LIMITATION = "الگوی PNT به‌تنهایی علت اختلال را قطعی نمی‌کند.";
const DECOY_LIMITATION = "هم‌خوانی سیگنال لزوماً به معنای کریدور اصلی تهدید نیست.";
const NOISE_LIMITATION = "این نوسان می‌تواند منشأ فنی یا محیطی داشته باشد.";
const STABLE_LIMITATION = "نبود ناهنجاری در این بازه، سایر کریدورها را رد نمی‌کند.";
const FIELD_LIMITATION = "گزارش میدانی یا زمان‌بندی رادیویی به‌تنهایی انتساب قطعی ایجاد نمی‌کند.";
const GROUND_LIMITATION = "مشاهده زمینی محدود است و برای انتساب قطعی به هم‌سنجی منابع نیاز دارد.";

type Relation = "primary" | "decoy_linked" | "background_noise" | "other";

const relationFor = (state: TrueWorldState, corridorId: CorridorId): Relation => {
  if (corridorId === state.primaryAffectedCorridorId) return "primary";
  if (state.actorProfileId === "deceptive_diversion" && corridorId === state.actorInternalState.decoyCorridorId) {
    return "decoy_linked";
  }
  if (corridorId === state.backgroundNoiseCorridorId) return "background_noise";
  return "other";
};

interface EvidenceParts {
  sourceType: EvidenceSourceType;
  direction: EvidenceDirection;
  strengthBand: EvidenceStrengthBand;
  qualityLabelVisible: string;
  limitationVisible: string;
}

const createEvidence = (
  state: TrueWorldState,
  request: EvidenceRequest,
  corridorId: CorridorId,
  itemIndex: number,
  parts: EvidenceParts,
): EvidenceInstance => ({
  evidenceId: `${request.requestId}:${corridorId}:${parts.sourceType}:${itemIndex}`,
  sourceType: parts.sourceType,
  requestKind: request.requestKind,
  observedCorridorId: corridorId,
  direction: parts.direction,
  strengthBand: parts.strengthBand,
  latencyVariant: state.latencyVariant,
  qualityLabelVisible: parts.qualityLabelVisible,
  limitationVisible: parts.limitationVisible,
  relevantHypothesisIds: [...(request.relevantHypothesisIds ?? [])],
  hiddenProvenance: { worldId: state.worldId, relation: relationFor(state, corridorId) },
});

const pntPartsFor = (relation: Relation): EvidenceParts => {
  switch (relation) {
    case "primary":
      return { sourceType: "pnt_telemetry", direction: "supports_targeted", strengthBand: "moderate", qualityLabelVisible: "ناهنجاری تکرارشونده", limitationVisible: PNT_LIMITATION };
    case "decoy_linked":
      return { sourceType: "pnt_telemetry", direction: "supports_targeted", strengthBand: "moderate", qualityLabelVisible: "ناهنجاری منسجم", limitationVisible: DECOY_LIMITATION };
    case "background_noise":
      return { sourceType: "pnt_telemetry", direction: "ambiguous", strengthBand: "weak", qualityLabelVisible: "نوسان محدود", limitationVisible: NOISE_LIMITATION };
    case "other":
      return { sourceType: "pnt_telemetry", direction: "supports_nonhostile", strengthBand: "weak", qualityLabelVisible: "الگوی پایدار", limitationVisible: STABLE_LIMITATION };
  }
};

const fieldPartsFor = (relation: Relation): readonly EvidenceParts[] => {
  switch (relation) {
    case "primary":
      return [
        { sourceType: "field_report", direction: "supports_targeted", strengthBand: "weak", qualityLabelVisible: "ناسازگاری در گزارش میدانی", limitationVisible: FIELD_LIMITATION },
        { sourceType: "radio_timing", direction: "supports_targeted", strengthBand: "weak", qualityLabelVisible: "ناسازگاری در زمان‌بندی رادیویی", limitationVisible: FIELD_LIMITATION },
      ];
    case "decoy_linked":
      return [
        { sourceType: "field_report", direction: "ambiguous", strengthBand: "weak", qualityLabelVisible: "گزارش میدانی ناهم‌سو", limitationVisible: FIELD_LIMITATION },
        { sourceType: "radio_timing", direction: "supports_targeted", strengthBand: "weak", qualityLabelVisible: "ناهماهنگی زمان‌بندی رادیویی", limitationVisible: FIELD_LIMITATION },
      ];
    case "background_noise":
      return [{ sourceType: "field_report", direction: "ambiguous", strengthBand: "weak", qualityLabelVisible: "گزارش محدود و نامطمئن", limitationVisible: FIELD_LIMITATION }];
    case "other":
      return [{ sourceType: "field_report", direction: "supports_nonhostile", strengthBand: "weak", qualityLabelVisible: "گزارش میدانی باثبات", limitationVisible: FIELD_LIMITATION }];
  }
};

const groundPartsFor = (state: TrueWorldState, relation: Relation): EvidenceParts => {
  if (relation === "primary") {
    switch (state.actorProfileId) {
      case "cautious_denial":
        return { sourceType: "ground_recon", direction: "supports_targeted", strengthBand: "moderate", qualityLabelVisible: "نشانه موضعی فعالیت اختلالی", limitationVisible: GROUND_LIMITATION };
      case "deceptive_diversion":
        return { sourceType: "ground_recon", direction: "ambiguous", strengthBand: "moderate", qualityLabelVisible: "اثر موضعی بدون انتساب قطعی", limitationVisible: GROUND_LIMITATION };
      case "opportunistic_interdiction":
        return { sourceType: "ground_recon", direction: "supports_targeted", strengthBand: "strong", qualityLabelVisible: "نشانه عملیاتی هم‌زمان با اختلال", limitationVisible: GROUND_LIMITATION };
      case "pressure_escalator":
        return { sourceType: "ground_recon", direction: "supports_targeted", strengthBand: "strong", qualityLabelVisible: "نشانه پایدار فعالیت اختلالی", limitationVisible: GROUND_LIMITATION };
    }
  }
  if (relation === "decoy_linked") {
    return { sourceType: "ground_recon", direction: "ambiguous", strengthBand: "moderate", qualityLabelVisible: "اثر موضعی مبهم", limitationVisible: GROUND_LIMITATION };
  }
  if (relation === "background_noise") {
    return { sourceType: "ground_recon", direction: "ambiguous", strengthBand: "weak", qualityLabelVisible: "نشانه زمینی محدود", limitationVisible: GROUND_LIMITATION };
  }
  return { sourceType: "ground_recon", direction: "supports_nonhostile", strengthBand: "moderate", qualityLabelVisible: "مشاهده زمینی باثبات", limitationVisible: GROUND_LIMITATION };
};

const requireTarget = (request: EvidenceRequest): CorridorId => {
  if (!request.targetCorridorId) throw new Error(`${request.requestKind} requires targetCorridorId`);
  return request.targetCorridorId;
};

export function materializeEvidence(trueState: TrueWorldState, request: EvidenceRequest): EvidenceInstance[] {
  if (request.requestKind === "focused_pnt_analysis") {
    const corridorId = requireTarget(request);
    return [createEvidence(trueState, request, corridorId, 0, pntPartsFor(relationFor(trueState, corridorId)))];
  }
  if (request.requestKind === "broad_pnt_sweep") {
    return CANONICAL_CORRIDOR_IDS.map((corridorId, index) =>
      createEvidence(trueState, request, corridorId, index, pntPartsFor(relationFor(trueState, corridorId))),
    );
  }

  const corridors = request.targetCorridorId ? [request.targetCorridorId] : CANONICAL_CORRIDOR_IDS;
  if (request.requestKind === "field_radio_corroboration") {
    return corridors.flatMap((corridorId) =>
      fieldPartsFor(relationFor(trueState, corridorId)).map((parts, index) => createEvidence(trueState, request, corridorId, index, parts)),
    );
  }
  return corridors.map((corridorId, index) =>
    createEvidence(trueState, request, corridorId, index, groundPartsFor(trueState, relationFor(trueState, corridorId))),
  );
}
