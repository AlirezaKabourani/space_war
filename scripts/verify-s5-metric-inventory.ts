import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

type InventoryItem = Record<string, unknown> & { id: string };
type Inventory = {
  schemaVersion: string;
  generatedFor: Record<string, string>;
  counts: Record<string, number>;
  items: InventoryItem[];
  implementationOnlyFields: string[];
  deprecatedLegacyExcluded: string[];
};

const root = process.cwd();
let assertions = 0;
const assert = (condition: unknown, message: string): asserts condition => {
  assertions += 1;
  if (!condition) throw new Error(message);
};
const read = (file: string): string => readFileSync(join(root, file), "utf8");

const outputFiles = [
  "docs/scenario5-metric-inventory.md",
  "docs/scenario5-metric-inventory.csv",
  "docs/scenario5-metric-inventory.json",
  "docs/scenario5-dashboard-metric-shortlist.md",
  "docs/scenario5-metric-inventory-verification.md",
] as const;
for (const file of outputFiles) assert(existsSync(join(root, file)), `Missing required output: ${file}`);

const inventory = JSON.parse(read("docs/scenario5-metric-inventory.json")) as Inventory;
const items = inventory.items;
const byId = new Map(items.map((item) => [item.id, item]));

assert(inventory.schemaVersion === "s5-metric-inventory-v1.0.0", "Unexpected inventory schema version");
assert(inventory.generatedFor.mission === "s5-mission-v1.1.0", "Mission version mismatch");
assert(inventory.generatedFor.cognitive === "s5-cognitive-v3-adapter-v1.0.0", "Cognitive version mismatch");
assert(inventory.generatedFor.runtime === "s5-runtime-v1.0.1", "Runtime version mismatch");
assert(inventory.generatedFor.domainMetrics === "s5-domain-metrics-v1.0.0", "Domain version mismatch");
assert(inventory.generatedFor.calibration === "s5-calibration-v1.2.0", "Calibration version mismatch");
assert(inventory.generatedFor.uiBaseline === "Phase 07D", "UI baseline mismatch");

const requiredFields = [
  "id", "persianName", "englishName", "category", "level", "dataType", "scaleOrRange", "unit", "nullable",
  "directOrDerived", "singleRunOrMultiRun", "playerVisibleDuringRun", "aarVisible", "hiddenAuditOnly",
  "cognitiveEligible", "crossScenarioAggregationCandidate", "aggregationMethodIfEligible", "sourceFiles",
  "sourceFunctions", "inputFields", "exactFormulaOrRule", "interpretation", "limitations", "validationStatus",
  "notes", "recommendedScenario5Dashboard", "recommendedCrossScenarioDashboard",
] as const;
const levels = new Set(["raw_telemetry", "decision_window", "phase", "convoy", "mission_run", "actor_world_audit", "multi_run", "calibration_only"]);
const derivations = new Set(["direct", "derived", "categorical_rule"]);
const validations = new Set(["frozen_engineering_metric", "engineering_calibrated_not_human_validated", "descriptive_only", "calibration_diagnostic_only", "hidden_audit_only", "not_measured"]);
const crossChoices = new Set(["yes", "no", "conditional"]);
const s5DashboardChoices = new Set(["primary", "secondary", "diagnostic", "hidden", "no"]);
const crossDashboardChoices = new Set(["primary", "secondary", "matrix_only", "no"]);

assert(items.length > 0, "Inventory must not be empty");
assert(byId.size === items.length, "Inventory IDs must be unique");
for (const item of items) {
  for (const field of requiredFields) assert(Object.hasOwn(item, field), `${item.id} missing ${field}`);
  assert(levels.has(String(item.level)), `${item.id} has invalid level`);
  assert(derivations.has(String(item.directOrDerived)), `${item.id} has invalid directOrDerived`);
  assert(validations.has(String(item.validationStatus)), `${item.id} has invalid validationStatus`);
  assert(crossChoices.has(String(item.crossScenarioAggregationCandidate)), `${item.id} has invalid cross-scenario flag`);
  assert(s5DashboardChoices.has(String(item.recommendedScenario5Dashboard)), `${item.id} has invalid Scenario-5 dashboard flag`);
  assert(crossDashboardChoices.has(String(item.recommendedCrossScenarioDashboard)), `${item.id} has invalid cross-scenario dashboard flag`);
  assert(Array.isArray(item.sourceFiles) && item.sourceFiles.length > 0, `${item.id} must cite source files`);
  assert(Array.isArray(item.sourceFunctions) && item.sourceFunctions.length > 0, `${item.id} must cite source functions`);
  assert(String(item.exactFormulaOrRule).trim().length > 0, `${item.id} must provide an exact rule`);
  assert(!item.sourceFiles.some((file) => /scenario[-_/ ]?two|ScenarioTwo/i.test(String(file))), `${item.id} cites Scenario 2`);
}

const requireIds = (label: string, ids: readonly string[]) => {
  for (const id of ids) assert(byId.has(id), `${label} is missing inventory ID ${id}`);
};

// Every scientifically meaningful leaf of Scenario5CognitiveRunResult. scenarioId/runId are implementation-only.
requireIds("Cognitive result", [
  "provenance.cognitive_measurement_model_version", "provenance.cognitive_formula_version",
  "provenance.option_profile_version", "provenance.scenario_content_version", "provenance.reason_model_version",
  "provenance.expert_panel_version", "provenance.validity_status",
  "completeness.overall", "completeness.decisions", "completeness.timing", "completeness.evidence",
  "completeness.estimates", "completeness.reasons",
  "cognitive.osi.overall", "cognitive.osi.phase_a", "cognitive.osi.phase_b", "cognitive.osi.phase_c",
  "cognitive.osi.phase_d", "cognitive.operational_strength", "cognitive.strategic_strength",
  "cognitive.integration", "cognitive.dispersion", "cognitive.information_seeking",
  "cognitive.second_order_thinking", "cognitive.adversary_modeling", "cognitive.escalation_sensitivity",
  "cognitive.information_discipline", "cognitive.evidence_responsive_updating", "cognitive.resource_stewardship",
  "cognitive.planning_foresight", "cognitive.multi_domain_integration", "cognitive.risk_posture",
  "cognitive.decision_coherence", "timing.median_active_decision_ms", "timing.iqr_active_decision_ms",
  "revision.total", "revision.revised_windows", "revision.evidence_triggered_rate",
]);
assert(byId.get("cognitive.information_discipline")?.validationStatus === "not_measured", "Information Discipline must be not_measured");
assert(byId.get("cognitive.information_discipline")?.nullable === true, "Information Discipline must be nullable");

// Every leaf/grouped-record leaf of Scenario5DomainMetrics and GnssPntCheckpointAssessment.
requireIds("Domain result", [
  "provenance.domain_metrics_version", "provenance.mission_model_version",
  "belief.checkpoint_id", "belief.selected_corridor", "belief.corridor_correct_by_checkpoint",
  "belief.corridor_confidence", "belief.targeted_interference_estimate", "belief.targeted_interference_confidence",
  "belief.targeted_recognition_by_checkpoint", "belief.recorded_checkpoint_count",
  "belief.correct_corridor_rate_percent", "belief.first_correct_corridor_checkpoint", "belief.final_corridor_correct",
  "belief.first_targeted_recognition_checkpoint", "belief.final_targeted_interference_estimate",
  "belief.final_targeted_interference_confidence", "belief.corroborated_corridor_ids",
  "belief.true_primary_corroborated", "domain.pnt.final_exposure_by_corridor",
  "domain.pnt.mean_final_exposure", "domain.pnt.max_final_exposure", "domain.navigation.fallback_corridor_ids",
  "domain.navigation.route_hardened_corridor_ids", "domain.navigation.ground_support_corridor_ids",
  "mission.logistics.compromised_convoy_count", "mission.critical_delivery.delivered_by_horizon",
  "mission.critical_delivery.on_time_operational", "mission.critical_delivery.integrity",
  "mission.critical_delivery.delay_minutes", "mission.critical_delivery.projected_arrival_minute",
  "mission.critical_delivery.deadline_minute", "mission.critical_delivery.delivered_at_minute",
  "mission.critical_delivery.alpha_targeted_resource_units", "mission.critical_delivery.total_resource_spent_units",
  "mission.critical_delivery.alpha_targeted_resource_share_percent", "mission.critical_delivery.alpha_targeted_decision_count",
  "mission.network_continuity_percent", "mission.logistics.delivered_convoy_count",
  "mission.logistics.on_time_operational_convoy_count", "mission.logistics.secondary_delivered_convoy_count",
  "mission.logistics.fallback_coverage_count", "mission.logistics.route_hardening_coverage_count",
  "mission.logistics.ground_support_coverage_count", "mission.operational_attribution_status",
  "mission.end_state_id", "mission.threat_contained", "domain.delay.final_by_corridor",
  "domain.delay.actor_added_by_corridor", "domain.delay.player_added_by_corridor",
  "domain.delay.player_recovered_by_corridor", "domain.delay.total_final", "domain.delay.mean_final",
  "domain.delay.total_actor_added", "domain.delay.total_player_added", "domain.delay.total_player_recovered",
  "domain.civilian_proxy.route_diversion_count", "domain.civilian_proxy.checkpoint_operation_count",
  "domain.civilian_proxy.ground_response_count", "domain.civilian_proxy.hold_operation_count",
  "domain.civilian_proxy.localized_disruption_event_count", "domain.civilian_proxy.medical_delivery_delay_minutes",
  "domain.network_balance.secondary_minimum_integrity", "domain.network_balance.secondary_mean_integrity",
  "domain.network_balance.secondary_delivered_count", "domain.network_balance.mean_delay",
  "domain.network_balance.delay_population_sd", "domain.network_balance.targeted_decision_count",
  "domain.network_balance.targeted_decision_count_by_corridor", "domain.network_balance.targeted_attention_hhi",
]);

// Scenario5EndState's three fields and all six active IDs/rules.
requireIds("Mission end state", ["mission.end_state_id", "mission.network_continuity_percent", "mission.threat_contained"]);
const endStateRule = String(byId.get("mission.end_state_id")?.exactFormulaOrRule);
for (const id of [
  "critical_cargo_lost_or_compromised", "priority_delivered_network_degradation",
  "mission_incomplete_continuity_preserved", "delivery_complete_threat_persistent",
  "delivery_complete_attribution_unresolved", "delivery_complete_threat_contained",
]) assert(endStateRule.includes(id), `End-state rule omits ${id}`);

// Meaningful runtime telemetry and Phase-8/8A/8B summary families.
requireIds("Runtime telemetry", [
  "timing.stage_entered_at_ms", "timing.selection_timestamps_ms", "timing.confirmed_at_ms",
  "timing.elapsed_decision_ms", "timing.active_decision_ms", "timing.hidden_tab_ms",
  "timing.outcome_review_dwell_ms", "timing.belief_capture_latency_ms", "timing.reason_capture_latency_ms",
  "decision.selection_count", "decision.revision_count", "decision.effective_target_corridor",
  "evidence.total_active_dwell_ms", "evidence.open_latency_ms", "reason.selected_reason_by_phase",
]);
requireIds("Phase-8/8A/8B summaries", [
  "multi.end_state_distribution", "multi.alpha_delivery_rate", "multi.network_continuity_distribution",
  "multi.actor_signature.mean_actor_delay", "multi.actor_pair.end_state_tv_distance",
  "multi.seed_sensitivity.modal_end_state_share", "multi.seed_sensitivity.unique_end_state_count",
  "multi.seed_sensitivity.alpha_delay_iqr", "multi.seed_sensitivity.high_seed_sensitivity",
  "calibration.coverage.action_selection_count", "calibration.coverage.action_target_counts",
  "calibration.coverage.fallback_selection_count", "calibration.coverage.explicit_target_probe_status",
  "calibration.pareto.dominance_share", "calibration.pareto.universal_across_continuations",
  "multi.shadow.horizon_alpha_delivery_rate", "multi.shadow.deadline_mean_network_continuity",
  "multi.shadow.resource_both_path_feasibility", "calibration.resource.minimum_available_action_distribution",
  "resource.single_option_window_count", "calibration.osi.structural_mean", "calibration.osi.monte_carlo_interval",
  "calibration.cognitive_distribution.floor_percent", "calibration.cognitive_distribution.ceiling_percent",
  "calibration.cognitive_distribution.sd", "calibration.reachability.witness",
  "calibration.reachability.boundary_min_continuity", "calibration.audit.hard_gate_status",
  "calibration.audit.warning_status", "calibration.audit.archive_integrity",
]);

const implementationText = inventory.implementationOnlyFields.join(" ");
for (const token of ["scenarioId", "runId", "eventId", "sequence", "payload", "nextStageId", "CSS"]) {
  assert(implementationText.includes(token), `Implementation-only classification omits ${token}`);
}
assert(inventory.deprecatedLegacyExcluded.some((entry) => /Scenario 2/.test(entry)), "Scenario 2 exclusion is missing");
assert(byId.has("not_measured.global_cognitive_score"), "Global cognitive score must be explicitly not measured");
assert(!items.some((item) => item.id === "cognitive.global_score"), "An unsupported global cognitive score was invented");

const recomputed = {
  totalIndicators: items.length,
  singleRunIndicators: items.filter((item) => ["single_run", "both"].includes(String(item.singleRunOrMultiRun))).length,
  multiRunIndicators: items.filter((item) => ["multi_run", "both"].includes(String(item.singleRunOrMultiRun))).length,
  cognitiveIndicators: items.filter((item) => new Set(["cognitive_v3", "data_completeness", "timing_interaction", "decision_behavior", "evidence_use", "belief_updating", "reason_coherence"]).has(String(item.category))).length,
  missionDomainIndicators: items.filter((item) => new Set(["mission_outcome", "convoy_logistics", "resource_use", "domain_navigation", "domain_attribution", "civilian_proxy", "network_balance"]).has(String(item.category))).length,
  rawTelemetryIndicators: items.filter((item) => item.level === "raw_telemetry").length,
  hiddenAuditIndicators: items.filter((item) => item.hiddenAuditOnly === true).length,
  calibrationOnlyIndicators: items.filter((item) => item.level === "calibration_only").length,
  crossScenarioCandidates: items.filter((item) => ["yes", "conditional"].includes(String(item.crossScenarioAggregationCandidate))).length,
  notMeasuredIndicators: items.filter((item) => item.validationStatus === "not_measured").length,
};
for (const [key, value] of Object.entries(recomputed)) assert(inventory.counts[key] === value, `Count mismatch for ${key}`);

// RFC-4180-compatible row count and exact 27-column schema.
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (!quoted && char === ",") { row.push(field); field = ""; continue; }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
};
const csvRows = parseCsv(read("docs/scenario5-metric-inventory.csv"));
assert(csvRows.length === items.length + 1, "CSV row count differs from JSON inventory");
assert(csvRows[0].join("|") === requiredFields.join("|"), "CSV header/schema mismatch");
for (const row of csvRows) assert(row.length === requiredFields.length, "CSV row has an invalid column count");

const markdown = read("docs/scenario5-metric-inventory.md");
for (let section = 1; section <= 17; section += 1) assert(markdown.includes(`## ${section}.`), `Markdown section ${section} is missing`);
const shortlist = read("docs/scenario5-dashboard-metric-shortlist.md");
for (const heading of [
  "## A. Scenario 5 — Player Cognitive Dashboard", "## B. Scenario 5 — AAR / Mission Dashboard",
  "## C. Cross-Scenario Cognitive Dashboard Candidates", "## D. Admin / Research Only",
]) assert(shortlist.includes(heading), `Shortlist heading missing: ${heading}`);
assert(shortlist.includes("Metrics that must NOT appear in the cross-scenario dashboard"), "Cross-scenario exclusion list is missing");

// Fingerprint the protected Scenario-5 model/runtime/UI/calibration source plus requested shared/root files.
const walk = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const protectedFiles = walk(join(root, "src/ui/components/scenario/scenario-five"))
  .map((file) => relative(root, file).split(sep).join("/"));
protectedFiles.push(
  "src/services/analytics/eventLogger.ts",
  "src/ui/components/scenario/ScenarioFiveSimulation.tsx",
  "src/ui/components/scenario/ScenarioFiveSummary.tsx",
  "src/ui/components/scenario/ScenarioFiveTypes.ts",
);
const uniqueProtectedFiles = [...new Set(protectedFiles)].sort();
const sha256 = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");
const sourceRows = uniqueProtectedFiles.map((file) => `${file}\t${sha256(readFileSync(join(root, file)))}`);
const sourceHash = sha256(sourceRows.join("\n"));
assert(uniqueProtectedFiles.length === 55, "Protected source file count changed");
assert(sourceHash === "5b5a764fe421ccd9efc1c86f1762f27c1b041095d6174ade4f0f54f040a12930", "Protected Scenario-5 source fingerprint changed");

console.log(`Scenario 5 metric inventory verification: PASS — ${assertions} assertions; total=${items.length}; sourceFiles=${uniqueProtectedFiles.length}; sourceHash=${sourceHash}`);
