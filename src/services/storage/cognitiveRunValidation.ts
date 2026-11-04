import type { CognitiveModelV3Result } from '../../ui/components/scenario/scenario-four/model/cognitiveEngineV3';
import * as s1 from '../../ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3';
import type { Scenario5CognitiveRunResult } from '../../ui/components/scenario/scenario-five/model/cognitive/types';
import * as s2 from '../../ui/components/scenario/scenario-five/model/cognitive/versions';

export type SavedCognitiveRunV1 = {
  schemaVersion: 'cross-scenario-run-v1';
  recordId: string;
  userProfileId: string;
  sourceRunId: string;
  recordedAtIso: string;
  source: 'new-completion-v1';
  modelStamps: Record<string, string>;
} & (
  { releasedScenarioId: 4; internalScenarioId: 's4_redesigned_scenario_one'; cognitive: CognitiveModelV3Result } |
  { releasedScenarioId: 5; internalScenarioId: 's5_silent_waves_redesign'; cognitive: Scenario5CognitiveRunResult }
);

type Check = (value: unknown, path: string) => void;
const fail = (path: string): never => { throw new Error(`Invalid cognitive archive field: ${path}`); };
const obj = (v: unknown, p: string): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.getPrototypeOf(v) !== Object.prototype) return fail(p);
  return v as Record<string, unknown>;
};
const text: Check = (v, p) => { if (typeof v !== 'string' || !v.trim()) fail(p); };
const bool: Check = (v, p) => { if (typeof v !== 'boolean') fail(p); };
const num = (min: number, max = Infinity): Check => (v, p) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min - 1e-9 || v > max + 1e-9) fail(p);
};
const integer: Check = (v, p) => { num(0)(v, p); if (!Number.isInteger(v)) fail(p); };
const literal = (expected: unknown): Check => (v, p) => { if (v !== expected) fail(p); };
const nullable = (check: Check): Check => (v, p) => { if (v !== null) check(v, p); };
const list = (check: Check): Check => (v, p) => {
  if (!Array.isArray(v)) return fail(p);
  v.forEach((x, i) => check(x, `${p}[${i}]`));
};
const shape = (required: Record<string, Check>, optional: Record<string, Check> = {}): Check => (v, p) => {
  const record = obj(v, p);
  for (const [key, check] of Object.entries(required)) check(record[key], `${p}.${key}`);
  for (const [key, check] of Object.entries(optional)) if (Object.hasOwn(record, key) && record[key] !== undefined) check(record[key], `${p}.${key}`);
  // Fail visibly on schema evolution; never strip unknown scientific fields.
  for (const key of Object.keys(record)) if (!(key in required) && !(key in optional)) fail(`${p}.${key} (unknown)`);
};
const fields = (keys: string[], check: Check) => Object.fromEntries(keys.map(key => [key, check]));
const percent = num(0, 100), signed = num(-1, 1), unit = num(0, 1), nonnegative = num(0);
const npercent = nullable(percent), nsigned = nullable(signed), ntime = nullable(nonnegative);
const iso: Check = (v, p) => { text(v, p); if (!Number.isFinite(Date.parse(v as string)) || new Date(v as string).toISOString() !== v) fail(p); };
const uuid: Check = (v, p) => { if (typeof v !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) fail(p); };
const sourceId: Check = (v, p) => { text(v, p); if (/preview|fixture|demo|dummy|test.only|design.sample/i.test(v as string)) fail(p); };

export const S1_STAMPS = {
  measurementModelVersion: s1.COGNITIVE_MODEL_VERSION, formulaVersion: s1.COGNITIVE_FORMULA_VERSION,
  optionProfileVersion: s1.OPTION_PROFILE_VERSION, scenarioContentVersion: s1.SCENARIO_CONTENT_VERSION,
  expertPanelVersion: s1.EXPERT_PANEL_VERSION, anchorTestVersion: s1.ANCHOR_TEST_VERSION,
};
export const S2_STAMPS = {
  measurementModelVersion: s2.S5_COGNITIVE_MEASUREMENT_MODEL_VERSION, formulaVersion: s2.S5_COGNITIVE_FORMULA_VERSION,
  optionProfileVersion: s2.S5_OPTION_PROFILE_VERSION, scenarioContentVersion: s2.S5_SCENARIO_CONTENT_VERSION,
  reasonModelVersion: s2.S5_REASON_MODEL_VERSION, expertPanelVersion: s2.S5_EXPERT_PANEL_VERSION,
  validityStatus: s2.S5_VALIDITY_STATUS,
};
const stamps = (values: Record<string, string>) => shape(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, literal(value)])));
const constructKeys = ['informationSeeking', 'secondOrderThinking', 'adversaryModeling', 'escalationSensitivity', 'informationDiscipline', 'evidenceResponsiveUpdating', 'resourceStewardship', 'planningForesight', 'multiDomainIntegration', 'decisionCoherence'];
const flagKeys = ['uniform_option_position', 'very_low_active_time', 'zero_evidence_engagement', 'invariant_attribution', 'minimal_revision', 'rapid_straightlining'];
const resources = shape(fields(['ssaCapacity', 'protectiveCapacity', 'politicalCapital', 'disclosureBudget'], percent));
const fullDecisionTime = shape({
  runId: sourceId, moveId: (v, p) => { if (!['move_1', 'move_2', 'move_3'].includes(v as string)) fail(p); },
  windowId: text, enteredAt: iso, confirmedAt: iso, elapsedMs: nonnegative, activeDecisionMs: nonnegative,
  finalSelectedOptionId: text, optionChangeCount: integer, selectionTimeline: list(shape({ optionId: text, ts: iso })),
  evidenceAvailableIds: list(text), evidenceOpenedIds: list(text),
  evidenceOpenTimeline: list(shape({ evidenceId: text, sourceType: text, openedAt: iso }, { closedAt: iso, activeDwellMs: nonnegative })),
  helpOpened: bool, glossaryOpened: bool, resourcesBefore: resources, resourcesAfterUserAction: resources,
}, { firstSelectedOptionId: text, playerAttributionEstimateBefore: percent, playerAttributionEstimateAfter: percent,
  systemAttributionConfidenceVisibleAtDecision: percent, statedReasonId: text, statedReasonText: text });
const decisionTime: Check = (v, p) => {
  // The engine currently returns full telemetry objects here although its public type is narrower.
  if ('runId' in obj(v, p)) fullDecisionTime(v, p);
  else shape({ windowId: text, activeDecisionMs: nonnegative })(v, p);
};
const summaryFields = { medianActiveDecisionMs: ntime, iqrActiveDecisionMs: ntime, totalRevisions: integer, revisedWindows: integer, evidenceTriggeredRevisionRate: npercent };
const s1Cognitive = shape({
  versions: stamps(S1_STAMPS),
  orientation: shape({ overall: nsigned, markerPercent: npercent, perMove: shape(fields(['move1', 'move2', 'move3'], nsigned)), operationalStrength: npercent, strategicStrength: npercent, integration: npercent, dispersion: nullable(unit), dispersionLabel: text, interpretation: text }),
  scores: shape({ ...fields([...constructKeys, 'coalitionOrientation'], npercent), riskPosture: nsigned }),
  dataCompleteness: shape({ overall: percent, components: shape(fields(['coreDecisionRecords', 'timingIntegrity', 'evidenceTelemetry', 'attributionEstimates', 'reasonCapture'], percent)) }),
  timing: shape({ ...summaryFields, totalEvidenceDwellMs: nonnegative, firstToFinalChanges: list(shape({ windowId: text, final: text }, { first: text })) }, { longestDecision: decisionTime, shortestDecision: decisionTime }),
  attribution: shape({ evidenceAlignment: list(shape({ phase: text, score: percent })), meanEvidenceAlignment: npercent, evidenceUpdatingAudit: list(shape({ phaseBefore: text, phaseAfter: text, ...fields(['playerBefore', 'playerAfter', 'evidenceBefore', 'evidenceAfter', 'finalContribution'], percent), dP: signed, dE: signed, ...fields(['directionAgreement', 'magnitudeAlignment', 'weight', 'rawScore'], unit) })) }),
  responseProcess: shape({ flags: shape(fields(flagKeys, bool)), activeFlags: list((v, p) => { if (!flagKeys.includes(v as string)) fail(p); }), status: (v, p) => { if (v !== 'normal' && v !== 'caution') fail(p); } }),
  perWindow: list(shape({ windowId: text, optionId: text, adjustedOsi: nsigned, operationalLoading: nonnegative, strategicLoading: nonnegative, diagnosticWeight: nonnegative, evidenceCoverage: nullable(unit) })),
  missingReasons: list(text),
});
const s2Cognitive = shape({
  ...Object.fromEntries(Object.entries(S2_STAMPS).map(([key, value]) => [key, literal(value)])),
  scenarioId: literal('s5_silent_waves_redesign'), runId: sourceId,
  orientation: shape({ overall: nsigned, operationalStrength: npercent, strategicStrength: npercent, integration: npercent, dispersion: nullable(unit), phaseScores: (v, p) => { list(nsigned)(v, p); if ((v as unknown[]).length !== 4) fail(p); } }),
  constructs: shape({ ...fields(constructKeys, npercent), informationDiscipline: literal(null), riskPosture: nsigned }),
  dataCompleteness: shape(fields(['overall', 'decisions', 'timing', 'evidence', 'estimates', 'reasons'], percent)),
  telemetrySummary: shape(summaryFields),
});

export function validateSavedCognitiveRun(value: unknown): asserts value is SavedCognitiveRunV1 {
  const row = obj(value, 'record');
  if (row.releasedScenarioId !== 4 && row.releasedScenarioId !== 5) fail('releasedScenarioId');
  const isS1 = row.releasedScenarioId === 4;
  shape({ schemaVersion: literal('cross-scenario-run-v1'), recordId: uuid, userProfileId: text,
    releasedScenarioId: literal(isS1 ? 4 : 5), internalScenarioId: literal(isS1 ? 's4_redesigned_scenario_one' : 's5_silent_waves_redesign'),
    sourceRunId: sourceId, recordedAtIso: iso, source: literal('new-completion-v1'), modelStamps: stamps(isS1 ? S1_STAMPS : S2_STAMPS), cognitive: isS1 ? s1Cognitive : s2Cognitive,
  })(value, 'record');
  if (!isS1 && obj(row.cognitive, 'cognitive').runId !== row.sourceRunId) fail('sourceRunId mismatch');
  if (isS1) {
    const windows = (row.cognitive as CognitiveModelV3Result).perWindow.map(x => x.windowId);
    const expected = Object.keys(s1.COGNITIVE_WINDOWS_V3);
    if (windows.length !== expected.length || new Set(windows).size !== expected.length || windows.some(w => !expected.includes(w))) fail('incomplete S1 core windows');
  }
}
