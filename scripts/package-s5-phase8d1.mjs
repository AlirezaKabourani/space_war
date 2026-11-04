import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const verification=JSON.parse(read('docs/scenario5-phase8d1-verification.json'));
const checks=JSON.parse(read('docs/scenario5-phase8d1-checks.json'));
const inspection=JSON.parse(read('docs/scenario5-phase8d1-screenshots/inspection.json'));
const snapshot=JSON.parse(read('docs/scenario5-phase8d1-baseline.json'));
const changed=Object.keys(snapshot.files).filter(p=>!fs.readFileSync(p).equals(Buffer.from(snapshot.files[p],'base64')));
const applications=changed.filter(p=>p.startsWith('src/'));
assert.equal(applications.length,6,'Only the six required presentation/metadata files changed');
assert(checks.every(c=>c.status==='PASS')&&inspection.status==='PASS','All correction checks must pass');
assert.equal(inspection.snapshots.length,6,'Six requested screenshots');
for(const s of inspection.snapshots){assert(fs.existsSync(`docs/scenario5-phase8d1-screenshots/${s.filename}`));assert(s.mapVisible&&s.footerReachable);}
const error=Math.hypot(inspection.reroute.actualRenderedPoint.x-inspection.reroute.alternatePoint.x,inspection.reroute.actualRenderedPoint.y-inspection.reroute.alternatePoint.y);
assert(error<.001,'Actual rendered marker tolerance');
Object.assign(verification,{checks:checks.map(({id,status,exitCode})=>({id,status,exitCode})),changedApplicationFiles:applications,changedVerifierFiles:changed.filter(p=>p.startsWith('scripts/')),browser:{status:'PASS',screenshotCount:6,inspection:'docs/scenario5-phase8d1-screenshots/inspection.json',viewportSizes:[[1280,720],[1366,768],[1440,900]],additionalLayoutChecks:inspection.layoutChecks.length,reroute:inspection.reroute,coordinateErrorSvgUnits:error,toleranceSvgUnits:.001},patchVerification:'PASS'});
write('docs/scenario5-phase8d1-verification.json',JSON.stringify(verification,null,2));

write('docs/scenario5-phase8d1-corrections.md',`# Phase 08D.1 — four presentation corrections

Status: **PASS**. Scope is restricted to the four approved corrections. No later phase is started.

## Changes

1. The existing canonical progress scalar is unchanged. routePresentationPoint maps it to the original straight segment or the same quadratic Bezier used by the committed alternate SVG path. The curve has the existing midpoint offset (+45,-60). SVG path and marker share alternateRouteControlPoint. The original monotonic/held/delivered progress effect, destination, Tehran origin offsets and their decay remain byte-identical. No geometry enters mission, domain or cognitive data. The map tooltip serializes the same text as a single SVG title string for reliable React rendering.
2. Only active id=5 fullDescription receives the exact approved resource sentence. All other App.tsx bytes, id=2 metadata, routing, released IDs and the released title remain unchanged.
3. Summary headings are exactly: «فاز ۱ — ساخت تصویر اولیه کامل شد»، «فاز ۲ — تمرکز و مدیریت مسیر کامل شد»، «فاز ۳ — ایجاد تاب‌آوری کامل شد». Runtime phases and telemetry still use A/B/C/D. The existing phase-D live header remains unchanged.
4. R7 escort outcome uses one message: «اسکورت در جریان این اقدام اعمال شد و با ورود به مرحله بعد پایان یافت.» It does not also emit an active/expired pair. A still-valid existing window displays «اسکورت فعال». An expired next-stage window may show only «اسکورت مرحله قبل پایان یافت». The outcome projection preserves this lifecycle wording in stored review and AAR. Map history is shown after outcome continuation and is suppressed for a currently active escort.

## Changed application files

${applications.map(p=>`- ${p}`).join('\n')}

presentation.ts is the additional presentation file required to keep the stored Outcome and AAR consistent with the live lifecycle labels; no model/type/runtime source is changed. No CSS change was needed.

## Verification

- Correction suite: ${verification.assertions} checks PASS.
- Existing Phase-08D presentation suite: ${verification.phase08d.assertions} assertions PASS. Its exact whole-App guard is updated only to expect the newly approved, uniquely identified id=5 sentence replacement. Every other character remains guarded; no assertion is removed or disabled. The prior immutable 08D baseline is not edited.
- Scientific parity: the same 112 complete runs, 16 worlds, seven valid policies, environmentSeed=1; zero semantic mismatches.
- Frozen guards: all ${verification.frozenFileCount} accepted scientific/archive/legacy hashes match. Changed frozen files: none.
- TypeScript, production build and scoped ESLint: PASS. The existing Vite bundle-size advisory remains in the build log.
- Six real player-flow browser screenshots; all three requested viewport sizes checked at every capture. No new page overflow, clipped footer or live hidden-truth leak.
- Browser reroute witness: alpha, progress ${inspection.reroute.progress}; original point (${inspection.reroute.originalPoint.x}, ${inspection.reroute.originalPoint.y}); alternate point (${inspection.reroute.alternatePoint.x}, ${inspection.reroute.alternatePoint.y}); actual point (${inspection.reroute.actualRenderedPoint.x}, ${inspection.reroute.actualRenderedPoint.y}). Error ${error} SVG units, below 0.001. ETA T+${inspection.reroute.projectedArrivalMinute} and delay ${inspection.reroute.delayMinutes} match the accepted 08D browser witness exactly.

## Artifacts

scenario5-phase8d1-verification.json, scenario5-phase8d1-scientific-parity.md, scenario5-phase8d1-screenshots/inspection.json and scenario5-phase8d1.patch. The patch is relative to the already implemented 08D workspace, not to an earlier Git commit, and includes only the correction files and their verification artifacts. Its reverse apply check passes. The user's actual Git index is untouched.
`);
write('docs/scenario5-phase8d1-scientific-parity.md',`# Phase 08D.1 scientific parity

**PASS — 112 deterministic complete runs; semantic mismatches: 0.**

The accepted docs/scenario5-phase8d-baseline.json is unchanged. The same 16 canonical worlds and seven player-valid policies are replayed with environmentSeed=1: balanced_network, priority_alpha, information_heavy, mobility_resilience, resource_preserver, high_response, low_response_reversible.

The complete SimulationRun digest matches exactly for every world/policy pair. This covers action sequences, targets, final mission/convoy/resource state, visible evidence IDs and order, attribution, containment, runtime events, domain results, cognitive telemetry and cognitive results. The original frozen progress function and the full monotonic progress effect also match their pre-correction source bytes. Only the mapping from that scalar to SVG coordinates changes for a visible committed reroute.

All ${verification.frozenFileCount} frozen hashes match. In particular, missionEngine, actionCatalog, mission config/selectors, endStateResolver, actorModel, evidenceModel, runtimeEngine, stageMachine, telemetryAdapter, domainMetrics, cognitiveEngine, evidenceScoring, optionProfiles, worldCatalog, worldFactory and calibration sources are unchanged. Legacy ScenarioTwo sources and the Phase-8B scientific archive remain unchanged.

The existing Phase-08D verifier passes ${verification.phase08d.assertions} presentation assertions and the same 112-run parity corpus. Its sole App expectation change is the exact approved resource-copy replacement in active id=5. This is a strict expected-text update, not a removal of the byte guard: all other App characters, routing and metadata still have exact equality checks. Dedicated AST/source checks also prove id=2, released IDs/title and routing unchanged.

Independent renderer checks prove equal progress, different in-transit coordinates, identical origin/destination, delivered-at-destination behavior and no mission mutation. The real-browser alpha witness has ETA T+235 and cumulative delay 25 minutes both before and after the correction, as recorded against the accepted Phase-08D screenshot inspection data. Actual rendered alternate-route coordinates match within 0.001 SVG units.

Escort changes are limited to presentation strings and history visibility. The tests cover the real R7 applied-and-expired transition, its next stage, a real still-valid R8 escort window and suppression of stale expiry labels for an active event. Belief/reason fields, timing semantics, action costs and budgets are untouched.

No model change, resource rebalance, action change, new end state, cognitive change, new probability, calibration or live hidden-truth exposure is introduced.
`);

const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):[`${p}/${e.name}`]);
const added=[...walk('docs').filter(p=>p.startsWith('docs/scenario5-phase8d1')&&!p.endsWith('.patch')),...walk('scripts').filter(p=>/s5-phase8d1/.test(p))];
const delivery=[...new Set([...changed,...added])].sort();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-phase8d1-patch-'));
function git(args,cwd=temp){const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:64*1024*1024});if(r.stderr)process.stderr.write(r.stderr);if(r.status!==0)throw new Error(`git ${args[0]}: ${r.stdout} ${r.stderr}`);return r.stdout;}
function temporaryFile(p,bytes){const target=path.resolve(temp,p);assert(target.startsWith(temp+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
git(['init','-q']);
for(const p of changed)temporaryFile(p,Buffer.from(snapshot.files[p],'base64'));
git(['add','--',...changed]);
for(const p of delivery)temporaryFile(p,fs.readFileSync(p));
git(['add','-N','--',...added]);
const patch=git(['diff','--binary','--',...delivery]);
write('docs/scenario5-phase8d1.patch',patch);
git(['apply','--check','--reverse','--whitespace=error-all',path.resolve('docs/scenario5-phase8d1.patch')],process.cwd());
console.log(`Phase 08D.1 delivery PASS: ${applications.length} application files; ${delivery.length} correction files; ${Buffer.byteLength(patch)} patch bytes; reverse check PASS.`);
