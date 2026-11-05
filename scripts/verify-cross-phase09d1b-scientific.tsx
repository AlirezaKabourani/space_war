import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WORLD_CATALOG } from '../src/ui/components/scenario/scenario-five/model/index';
import { MISSION_POLICIES } from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies';
import { simulateScenario5 } from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver';
import { CognitiveSignedSpectrum, CognitiveStoredValue, CrossScenarioCognitiveDashboard } from '../src/ui/components/admin/CrossScenarioCognitiveDashboard';
import { CROSS_CONCEPTS, CROSS_NULL, CROSS_DATA_ERROR, cognitiveNumber, cognitiveReadError } from '../src/ui/components/admin/crossScenarioPresentation';

(globalThis as unknown as { React: typeof React }).React = React;
const read = (p: string) => fs.readFileSync(p, 'utf8');
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const baseline = JSON.parse(read('docs/scenario-cross-phase09d1b-baseline.json'));
let assertions = 0;
const equal = (a: unknown, b: unknown, label: string) => { assert.deepEqual(a, b, label); assertions++; };
const check = (v: unknown, label: string) => { assert.ok(v, label); assertions++; };
const protectedHashes: Record<string, { before: string; after: string }> = {};
for (const [p, before] of Object.entries(baseline.protected) as [string, string][]) {
  const after = createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  equal(after, before, 'Frozen ' + p); protectedHashes[p] = { before, after };
}
equal(Object.keys(protectedHashes).length, 159, 'Exact protected file manifest');
const allowed = new Set(['src/App.tsx', 'src/services/storage/cognitiveRunRepository.ts']);
for (const [p, before] of Object.entries(baseline.hashes) as [string, string][]) if (!allowed.has(p)) equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'), before, 'Unchanged pre-existing source ' + p);
const beforeRepository = Buffer.from(baseline.beforeFiles['src/services/storage/cognitiveRunRepository.ts'], 'base64').toString('utf8').trim();
const newImport = "import { requireCognitiveAdminReadAccess, type CognitiveAdminReadAccess } from './cognitiveAdminReadAccess';\n";
equal(read('src/services/storage/cognitiveRunRepository.ts').replace(newImport, '').split('// Admin reads use')[0].trim(), beforeRepository, 'Entire pre-existing repository/write path remains byte-identical');
const runs = WORLD_CATALOG.flatMap(w => MISSION_POLICIES.filter(p => !p.oraclePolicy && !p.stressPolicy && !p.randomPolicy).map(policy => simulateScenario5({ worldId: w.worldId, environmentSeed: 1, policy })));
const actual = runs.map(r => ({ worldId: r.worldId, policy: r.policyId, digest: hash(r), cognitive: hash(r.result.cognitive), domain: hash(r.result.domain), mission: hash(r.state.missionState), evidence: hash(r.cognitiveBundle) }));
equal(runs.length, 112, '16 worlds x 7 policies');
equal(actual, JSON.parse(read('docs/scenario5-phase09c1-baseline-corpus.json')), 'Full scientific / cognitive / domain / mission / evidence parity');
for (const risk of [false, true]) for (const value of [-1, -.5, 0, .5, 1, null]) {
  const html = renderToStaticMarkup(<CognitiveSignedSpectrum label="OSI/risk fixture" field="fixture" value={value} risk={risk} />);
  equal(html.includes('data-cross-marker='), value !== null, 'Null has no marker; measured zero has marker');
  if (value !== null) { check(html.includes(`left:${(value + 1) * 50}%`), 'Signed geometry'); check(html.includes(cognitiveNumber(value, true)), 'Signed original value'); }
  else check(html.includes(CROSS_NULL), 'Null differs from zero');
}
for (const value of [undefined, NaN, Infinity, -2, 2]) {
  const html = renderToStaticMarkup(<CognitiveSignedSpectrum label="invalid fixture" field="fixture" value={value as number} />);
  check(html.includes(CROSS_DATA_ERROR) && !html.includes('data-cross-marker='), 'Invalid/missing signed value is explicit data error');
}
const zero = renderToStaticMarkup(<CognitiveStoredValue label="zero" field="fixture" value={0} bar />);
check(zero.includes('0.00') && zero.includes('aria-valuenow="0"'), 'True zero remains visible and measured');
const absent = renderToStaticMarkup(<CognitiveStoredValue label="absent" field="fixture" value={null} bar />);
check(absent.includes(CROSS_NULL) && !absent.includes('role="meter"'), 'Null creates neither zero nor measurement bar');
equal(cognitiveNumber(undefined), CROSS_DATA_ERROR, 'Omitted numeric field is not null or zero');
equal(cognitiveReadError(new DOMException('isolated read restriction', 'QuotaExceededError')).code, 'QuotaExceededError', 'DOM quota error name is retained instead of its numeric legacy code');
equal(CROSS_CONCEPTS.length, 9, 'Exactly nine conceptual groups');
const denied = renderToStaticMarkup(<CrossScenarioCognitiveDashboard targetProfileId="private-owner" access={null} profiles={[]} onBack={() => {}} />);
check(denied.includes('data-cross-error="PermissionDenied"') && !denied.includes('data-cross-field=') && !denied.includes('data-cross-owner='), 'Direct nonadmin component props fail closed');
const ui = read('src/ui/components/admin/CrossScenarioCognitiveDashboard.tsx');
check(!/eventLogger|systemLogger|\.setItem\(|\.put\(|calculate[A-Z]|Math\.abs|\.reduce\(/.test(ui), 'Report view has no write, telemetry, aggregation or cognitive recomputation');
check(!/final\.snapshot|getEvents|sid::attempt/.test(ui), 'No legacy fallback');
check(ui.includes('در سناریو ۲ سنجیده نمی‌شود') && ui.includes('run.cognitive.scores.riskPosture') && ui.includes('run.cognitive.constructs.riskPosture'), 'Explicit unmeasured and raw signed risk contracts');
const result = { status: 'PASS', assertions, protectedFiles: 159, protectedHashes, allOtherPreExistingSourcesUnchanged: true, existingRepositoryAndWritePathUnchanged: true, s2Parity: { runs: 112, worlds: 16, policies: 7, environmentSeed: 1, semanticMismatches: 0, fullCognitiveDomainMissionEvidenceDigestsEqual: true }, presentation: 'PASS; signed endpoints/zero/null/missing, bar zero/null, direct denied props, no telemetry/recomputation/legacy fallback' };
fs.writeFileSync('docs/scenario-cross-phase09d1b-scientific-verification.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, protectedHashes: undefined }));
