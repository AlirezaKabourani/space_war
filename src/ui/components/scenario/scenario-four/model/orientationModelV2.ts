import type { DecisionWindowId, ScenarioOneDecisionRecord } from "./types";

export const S4_COGNITIVE_MODEL_V2 = true;

export interface OrientationOptionLoading {
  operationalLoading: number;
  strategicLoading: number;
  diagnosticWeight: number;
}

type CoreWindowId = Exclude<DecisionWindowId, "m1_reason" | "m2_reason" | "m3_offramp" | "m3_reason">;

const loadings: Record<string, OrientationOptionLoading> = {
  m1_i_passive: { operationalLoading: .45, strategicLoading: .20, diagnosticWeight: .85 },
  m1_i_dedicated_ssa: { operationalLoading: .60, strategicLoading: .55, diagnosticWeight: .85 },
  m1_i_commercial: { operationalLoading: .40, strategicLoading: .70, diagnosticWeight: .85 },
  m1_i_allied_network: { operationalLoading: .30, strategicLoading: .85, diagnosticWeight: .85 },
  m1_p_hold: { operationalLoading: .35, strategicLoading: .35, diagnosticWeight: 1 },
  m1_p_covert_readiness: { operationalLoading: .75, strategicLoading: .60, diagnosticWeight: 1 },
  m1_p_visible_protection: { operationalLoading: .90, strategicLoading: .40, diagnosticWeight: 1 },
  m1_p_mission_reposition: { operationalLoading: .95, strategicLoading: .25, diagnosticWeight: 1 },
  m1_c_none: { operationalLoading: .35, strategicLoading: .30, diagnosticWeight: 1 },
  m1_c_private: { operationalLoading: .35, strategicLoading: .80, diagnosticWeight: 1 },
  m1_c_allies: { operationalLoading: .30, strategicLoading: .90, diagnosticWeight: 1 },
  m1_c_public_warning: { operationalLoading: .50, strategicLoading: .75, diagnosticWeight: 1 },
  m1_c_private_allied: { operationalLoading: .35, strategicLoading: .95, diagnosticWeight: 1 },
  m2_a_technical_diagnostics: { operationalLoading: .65, strategicLoading: .55, diagnosticWeight: .90 },
  m2_a_second_sensor: { operationalLoading: .65, strategicLoading: .65, diagnosticWeight: .90 },
  m2_a_ally_intel: { operationalLoading: .35, strategicLoading: .90, diagnosticWeight: .90 },
  m2_a_commercial_validation: { operationalLoading: .45, strategicLoading: .75, diagnosticWeight: .90 },
  m2_a_act_with_current_data: { operationalLoading: .85, strategicLoading: .20, diagnosticWeight: .90 },
  m2_m_continue_normal: { operationalLoading: .90, strategicLoading: .20, diagnosticWeight: 1 },
  m2_m_activate_fallback: { operationalLoading: .75, strategicLoading: .75, diagnosticWeight: 1 },
  m2_m_reduce_load: { operationalLoading: .65, strategicLoading: .65, diagnosticWeight: 1 },
  m2_m_protective_reconfiguration: { operationalLoading: .85, strategicLoading: .50, diagnosticWeight: 1 },
  m2_m_split_service: { operationalLoading: .75, strategicLoading: .85, diagnosticWeight: 1 },
  m2_r_no_counteraction: { operationalLoading: .30, strategicLoading: .50, diagnosticWeight: 1.10 },
  m2_r_request_explanation: { operationalLoading: .35, strategicLoading: .75, diagnosticWeight: 1.10 },
  m2_r_private_warning: { operationalLoading: .55, strategicLoading: .75, diagnosticWeight: 1.10 },
  m2_r_joint_allied_response: { operationalLoading: .45, strategicLoading: .90, diagnosticWeight: 1.10 },
  m2_r_request_defensive_authority: { operationalLoading: .80, strategicLoading: .65, diagnosticWeight: 1.10 },
  m2_r_deconfliction_offer: { operationalLoading: .35, strategicLoading: .95, diagnosticWeight: 1.10 },
  m3_t_insufficient: { operationalLoading: .25, strategicLoading: .60, diagnosticWeight: .55 },
  m3_t_sufficient_limited: { operationalLoading: .50, strategicLoading: .60, diagnosticWeight: .55 },
  m3_t_sufficient_strong: { operationalLoading: .65, strategicLoading: .50, diagnosticWeight: .55 },
  m3_coa_contain_understand: { operationalLoading: .45, strategicLoading: .80, diagnosticWeight: 1.20 },
  m3_coa_controlled_deterrence: { operationalLoading: .80, strategicLoading: .80, diagnosticWeight: 1.20 },
  m3_coa_coordinated_response: { operationalLoading: .55, strategicLoading: .95, diagnosticWeight: 1.20 },
  m3_coa_negotiated_deescalation: { operationalLoading: .35, strategicLoading: .95, diagnosticWeight: 1.20 },
  m3_coa_unilateral_strong: { operationalLoading: .85, strategicLoading: .70, diagnosticWeight: 1.20 },
  m3_info_keep_restricted: { operationalLoading: .40, strategicLoading: .60, diagnosticWeight: 1.10 },
  m3_info_share_allies: { operationalLoading: .35, strategicLoading: .90, diagnosticWeight: 1.10 },
  m3_info_public_partial: { operationalLoading: .45, strategicLoading: .85, diagnosticWeight: 1.10 },
  m3_info_public_attribution: { operationalLoading: .55, strategicLoading: .80, diagnosticWeight: 1.10 },
};

export const orientationWindows: Record<CoreWindowId, string[]> = {
  m1_information: ["m1_i_passive", "m1_i_dedicated_ssa", "m1_i_commercial", "m1_i_allied_network"],
  m1_protection: ["m1_p_hold", "m1_p_covert_readiness", "m1_p_visible_protection", "m1_p_mission_reposition"],
  m1_communication: ["m1_c_none", "m1_c_private", "m1_c_allies", "m1_c_public_warning", "m1_c_private_allied"],
  m2_investigation: ["m2_a_technical_diagnostics", "m2_a_second_sensor", "m2_a_ally_intel", "m2_a_commercial_validation", "m2_a_act_with_current_data"],
  m2_mission: ["m2_m_continue_normal", "m2_m_activate_fallback", "m2_m_reduce_load", "m2_m_protective_reconfiguration", "m2_m_split_service"],
  m2_response: ["m2_r_no_counteraction", "m2_r_request_explanation", "m2_r_private_warning", "m2_r_joint_allied_response", "m2_r_request_defensive_authority", "m2_r_deconfliction_offer"],
  m3_threshold: ["m3_t_insufficient", "m3_t_sufficient_limited", "m3_t_sufficient_strong"],
  m3_coa: ["m3_coa_contain_understand", "m3_coa_controlled_deterrence", "m3_coa_coordinated_response", "m3_coa_negotiated_deescalation", "m3_coa_unilateral_strong"],
  m3_info: ["m3_info_keep_restricted", "m3_info_share_allies", "m3_info_public_partial", "m3_info_public_attribution"],
};

const coreWindowIds = Object.keys(orientationWindows) as CoreWindowId[];
const moveWindows = {
  move_1: coreWindowIds.filter((id) => id.startsWith("m1_")),
  move_2: coreWindowIds.filter((id) => id.startsWith("m2_")),
  move_3: coreWindowIds.filter((id) => id.startsWith("m3_")),
};

export const getOrientationLoading = (windowId: DecisionWindowId, optionId: string) => {
  if (!(windowId in orientationWindows) || !loadings[optionId]) return null;
  const options = orientationWindows[windowId as CoreWindowId];
  if (!options.includes(optionId)) return null;
  const differences = options.map((id) => loadings[id].strategicLoading - loadings[id].operationalLoading);
  const mean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const centered = loadings[optionId].strategicLoading - loadings[optionId].operationalLoading - mean;
  const maxAbsolute = Math.max(...differences.map((value) => Math.abs(value - mean)), Number.EPSILON);
  return Math.max(-1, Math.min(1, centered / maxAbsolute));
};

const latestCoreRecords = (records: ScenarioOneDecisionRecord[]) => {
  const byWindow = new Map<CoreWindowId, ScenarioOneDecisionRecord>();
  for (const record of records) {
    if (record.windowId in orientationWindows) byWindow.set(record.windowId as CoreWindowId, record);
  }
  return byWindow;
};

const weightedMoveIndex = (records: Map<CoreWindowId, ScenarioOneDecisionRecord>, windows: CoreWindowId[]) => {
  if (windows.some((windowId) => !records.has(windowId))) return null;
  let numerator = 0;
  let denominator = 0;
  for (const windowId of windows) {
    const record = records.get(windowId)!;
    const loading = loadings[record.selectedOptionId];
    const orientation = getOrientationLoading(windowId, record.selectedOptionId);
    if (!loading || orientation == null) return null;
    numerator += loading.diagnosticWeight * orientation;
    denominator += loading.diagnosticWeight;
  }
  return Math.max(-1, Math.min(1, numerator / denominator));
};

const stabilityFor = (values: number[]) => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
};

export interface OrientationResultV2 {
  overall: number | null;
  perMove: { move1: number | null; move2: number | null; move3: number | null };
  integrationScore: number;
  stabilitySd: number | null;
  stabilityLabel: string;
  dataQuality: number;
  confidenceLabel: "بالا" | "متوسط" | "پایین";
  interpretation: string;
  completedCoreDecisions: number;
}

export const calculateOrientationV2 = (
  records: ScenarioOneDecisionRecord[],
  options?: { evidenceInteractionValid?: boolean; timingLogsConsistent?: boolean }
): OrientationResultV2 => {
  const latest = latestCoreRecords(records);
  const move1 = weightedMoveIndex(latest, moveWindows.move_1);
  const move2 = weightedMoveIndex(latest, moveWindows.move_2);
  const move3 = weightedMoveIndex(latest, moveWindows.move_3);
  const moveValues = [move1, move2, move3].filter((value): value is number => value != null);
  const overall = moveValues.length === 3 ? (moveValues[0] + moveValues[1] + moveValues[2]) / 3 : null;
  const selected = [...latest.values()].filter((record) => loadings[record.selectedOptionId]);
  const integrationWeight = selected.reduce((sum, record) => sum + loadings[record.selectedOptionId].diagnosticWeight, 0);
  const integrationScore = integrationWeight
    ? Math.round(selected.reduce((sum, record) => {
        const model = loadings[record.selectedOptionId];
        return sum + ((model.operationalLoading + model.strategicLoading) / 2) * model.diagnosticWeight;
      }, 0) / integrationWeight * 100)
    : 0;
  const stabilitySd = moveValues.length === 3 ? stabilityFor(moveValues) : null;
  const stabilityLabel = stabilitySd == null ? "داده ناکافی" : stabilitySd <= .15 ? "جهت‌گیری نسبتاً پایدار" : stabilitySd <= .35 ? "جهت‌گیری وابسته به موقعیت" : "تغییر جهت محسوس میان مراحل";
  const duplicateCount = records.filter((record) => record.windowId in orientationWindows).length - latest.size;
  let dataQuality = 100 - (9 - latest.size) * 10;
  if (selected.filter((record) => record.responseTimeMs < 1000).length > 3) dataQuality -= 5;
  if (options?.timingLogsConsistent === false || selected.some((record) => !Number.isFinite(record.responseTimeMs) || record.responseTimeMs < 0)) dataQuality -= 10;
  if (duplicateCount > 0) dataQuality -= 10;
  if (options?.evidenceInteractionValid === false) dataQuality -= 10;
  dataQuality = Math.max(0, Math.min(100, dataQuality));
  const confidenceLabel = dataQuality >= 80 ? "بالا" : dataQuality >= 55 ? "متوسط" : "پایین";
  const interpretation = overall == null
    ? "برای تفسیر شاخص هنوز همه ۹ تصمیم اصلی ثبت نشده‌اند."
    : Math.abs(overall) <= .15
      ? integrationScore >= 70 && (stabilitySd ?? 1) <= .15
        ? "رویکرد یکپارچه عملیاتی–راهبردی"
        : (stabilitySd ?? 0) > .15
          ? "رویکرد وابسته به موقعیت"
          : "الگوی جهت‌گیری ضعیف یا نامتمایز"
      : overall < -.45 ? "گرایش عملیاتی مشخص"
        : overall < -.15 ? "تمایل عملیاتی"
          : overall > .45 ? "گرایش راهبردی مشخص" : "تمایل راهبردی";
  return { overall, perMove: { move1, move2, move3 }, integrationScore, stabilitySd, stabilityLabel, dataQuality, confidenceLabel, interpretation, completedCoreDecisions: latest.size };
};

export const validateOrientationModelV2 = (iterations = 100_000) => {
  let seed = 0x4f1bbcdc;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const samples: number[] = [];
  for (let run = 0; run < iterations; run += 1) {
    const perMoveValues: number[] = [];
    for (const windows of Object.values(moveWindows)) {
      let numerator = 0;
      let denominator = 0;
      for (const windowId of windows) {
        const choices = orientationWindows[windowId];
        const optionId = choices[Math.floor(random() * choices.length)];
        const model = loadings[optionId];
        numerator += getOrientationLoading(windowId, optionId)! * model.diagnosticWeight;
        denominator += model.diagnosticWeight;
      }
      perMoveValues.push(numerator / denominator);
    }
    samples.push(perMoveValues.reduce((sum, value) => sum + value, 0) / 3);
  }
  samples.sort((a, b) => a - b);
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const sd = stabilityFor(samples);
  const percentile = (fraction: number) => samples[Math.floor((samples.length - 1) * fraction)];
  return { iterations, randomMean: mean, randomSD: sd, p5: percentile(.05), p25: percentile(.25), p50: percentile(.5), p75: percentile(.75), p95: percentile(.95), passed: Math.abs(mean) < .02 };
};

export const orientationLoadingMatrix = loadings;
