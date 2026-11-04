import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { WORLD_CATALOG } from '../src/ui/components/scenario/scenario-five/model/index';
import { MISSION_POLICIES } from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies';
import { simulateScenario5 } from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver';
import { S2_STAMPS, validateSavedCognitiveRun } from '../src/services/storage/cognitiveRunValidation';

const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const baseline = JSON.parse(fs.readFileSync('docs/scenario-cross-phase09d1a-baseline.json', 'utf8'));
const accepted = JSON.parse(fs.readFileSync('docs/scenario5-phase09c1-baseline-corpus.json', 'utf8'));
const changedProtected: string[] = [];
const protectedHashes: Record<string, { before: string; after: string }> = {};
for (const [file, before] of Object.entries(baseline.hashes) as [string, string][]) {
  if (/scenario-four\/(model|actors|adjudication|moves|narrative)\/|scenario-five\/(model|calibration)\/|^src\/scenarios\/|Scenario(One|Two)Simulation|^scripts\/|\.gitattributes|\.git\/config/.test(file)) {
    const after = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    protectedHashes[file] = { before, after };
    if (before !== after) changedProtected.push(file);
  }
}
assert.deepEqual(changedProtected, [], 'Protected hashes');
const runs = WORLD_CATALOG.flatMap(w => MISSION_POLICIES.filter(p => !p.oraclePolicy && !p.stressPolicy && !p.randomPolicy).map(policy => simulateScenario5({ worldId: w.worldId, environmentSeed: 1, policy })));
const after = runs.map(r => ({ worldId: r.worldId, policy: r.policyId, digest: hash(r), cognitive: hash(r.result.cognitive), domain: hash(r.result.domain), mission: hash(r.state.missionState), evidence: hash(r.cognitiveBundle) }));
assert.equal(runs.length, 112);
assert.deepEqual(after, accepted, 'All full-object and cognitive/domain/mission/evidence digests');
for (const r of runs) {
  const before = hash(r.result.cognitive);
  validateSavedCognitiveRun({ schemaVersion: 'cross-scenario-run-v1', recordId: crypto.randomUUID(), userProfileId: 'schema-verification-only', releasedScenarioId: 5, internalScenarioId: 's5_silent_waves_redesign', sourceRunId: r.result.runId, recordedAtIso: new Date().toISOString(), source: 'new-completion-v1', cognitive: r.result.cognitive, modelStamps: { ...S2_STAMPS } });
  assert.equal(hash(r.result.cognitive), before, 'Validation must be read-only');
}
const result = { status: 'PASS', protectedFiles: Object.keys(protectedHashes).length, changedProtected, protectedHashes, s2Parity: { runs: 112, worlds: 16, policies: 7, semanticMismatches: 0, fullRunCognitiveDomainMissionEvidenceDigestsEqual: true }, canonicalValidationAcross112Runs: 'PASS' };
fs.writeFileSync('docs/scenario-cross-phase09d1a-scientific-verification.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, protectedHashes: undefined }));
