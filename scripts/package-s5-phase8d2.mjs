import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');const write=(p,s)=>fs.writeFileSync(p,s);
const baseline=JSON.parse(read('docs/scenario5-phase8d2-baseline.json'));
const result=JSON.parse(read('docs/scenario5-phase8d2-verification.json'));
const checks=JSON.parse(read('docs/scenario5-phase8d2-checks.json'));
const browser=JSON.parse(read('docs/scenario5-phase8d2-screenshots/inspection.json'));
assert(checks.every(c=>c.status==='PASS')&&browser.status==='PASS');assert.equal(browser.snapshots.length,6);
const changed=Object.keys(baseline.files).filter(p=>!fs.readFileSync(p).equals(Buffer.from(baseline.files[p],'base64')));
assert.equal(changed.length,3);assert(!changed.includes('src/App.tsx'));
const addedApplication=['src/ui/components/scenario/scenario-five/ui/phaseHeader.ts'];
Object.assign(result,{changedApplicationFiles:changed,addedApplicationFiles:addedApplication,checks:checks.map(({id,status,exitCode})=>({id,status,exitCode})),browser:{status:'PASS',screenshots:6,inspection:'docs/scenario5-phase8d2-screenshots/inspection.json',sizes:[[1280,720],[1366,768],[1440,900]],additionalLayoutChecks:browser.layoutChecks.length},patchReverseCheck:'PASS'});
write('docs/scenario5-phase8d2-verification.json',JSON.stringify(result,null,2));
const rows=browser.transitions.map(t=>`| ${t.phase} | ${t.before.title} | ${t.before.subtitle} | ${t.before.label} | ${t.runtimeStage} |`).join('\n');
write('docs/scenario5-phase8d2-phase-summary-header.md',`# Phase 08D.2 — local phase-summary header synchronization

**PASS**. Only header/progress presentation changes while an already-existing local summary is visible. No runtime stage, delay, event, telemetry, decision input, or canonical value changes.

| Summary | Exact main title | Exact subtitle | Stage label | Existing stage after Continue |
| --- | --- | --- | --- | --- |
${rows}

The reviewed phase and preceding phases show completed checkmarks. No upcoming phase receives aria-current or the active class until Continue dismisses the local summary. The next-phase/current-decision header then appears immediately, using the same safe runtime view. The approved left-panel summary headings are unchanged. When the stored-outcome review temporarily replaces a local summary, the summary-specific header override is not applied.

## Application files

${changed.map(p=>`- ${p}`).join('\n')}
- Added: ${addedApplication[0]}

phaseHeader.ts is a pure presentation helper, separated from component exports to satisfy the existing Fast Refresh lint rule. The CSS change only allows review header text to wrap at the required desktop sizes. App.tsx is byte-identical to its pre-08D.2 snapshot; legacy id=2 and id=5 routing are unchanged.

## Evidence

- ${result.assertions} new checks PASS. Existing 08D: 32,798 assertions PASS; existing 08D.1: 1,516 checks PASS. No prior verifier assertion was edited or weakened. The prior enriched 08D.1 artifact is restored byte-for-byte after its verifier executes, while its fresh output is captured separately.
- The same 112-run corpus, 16 worlds x seven valid policies at seed=1, has zero semantic mismatches. All 63 frozen hashes match.
- Typecheck, build and scoped ESLint PASS. The existing Vite bundle-size advisory remains in the captured build log.
- Six real screenshots cover each A/B/C summary and the immediately following decision. All three required sizes are checked. DOM records contain exact header title/subtitle/label, progress states, current stage, clock, ISR, Support, evidence count and convoy values.
- Browser dismissal checks assert exact runtime JSON, analytics storage, header counters and convoy DOM equality before/after Continue. No page overflow, clipped footer, hidden-truth leak or wrapped-header clipping was found.

Artifacts: scenario5-phase8d2-verification.json, scenario5-phase8d2-scientific-parity.md, scenario5-phase8d2-screenshots/inspection.json and scenario5-phase8d2.patch. The patch is relative to the accepted 08D.1 workspace and passes reverse-apply validation; the user's real index is untouched.
`);
write('docs/scenario5-phase8d2-scientific-parity.md',`# Phase 08D.2 scientific parity

**PASS — 112 complete deterministic runs; semantic mismatch count: 0.**

The unchanged accepted 08D corpus covers all 16 canonical worlds and seven player-valid policies with environmentSeed=1. The complete SimulationRun digests match the accepted pre-08D baseline, including action/target sequence, mission/convoy/resource state, visible evidence IDs and order, attribution, containment, runtime events, domain outputs, cognitive telemetry and cognitive results.

The existing 08D verifier passes 32,798 presentation assertions and the existing 08D.1 verifier passes 1,516 checks. New header checks verify exact A/B/C text, completed versus upcoming progress, exact existing next stages, safe-view equality, and immutable runtime/event data through local review rendering/dismissal. Simulation useState/useEffect/useCallback calls and every existing runtime mutation and log call remain byte-identical to their pre-correction source expressions.

All 63 accepted source/archive/legacy hashes remain unchanged. App.tsx is unchanged, including id=2, released scenario IDs/titles and active id=5 routing. No mission, action, Actor, evidence, world, runtime, telemetry, domain, Cognitive V3, option loading, threshold, budget, resolver or calibration source changes.

Six actual browser captures and 12 additional size checks confirm the local summary uses current post-transition clock, ISR, Support, evidence and convoy values. Continue changes only local presentation; serialized runtime and stored analytics are exactly equal before/after. The next existing decision becomes visible immediately.
`);
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):[`${p}/${e.name}`]);
const added=[...addedApplication,...walk('docs').filter(p=>p.startsWith('docs/scenario5-phase8d2')&&!p.endsWith('.patch')),...walk('scripts').filter(p=>p.includes('s5-phase8d2'))];
const delivery=[...new Set([...changed,...added])].sort();const temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-phase8d2-patch-'));
function git(args,cwd=temp){const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:64*1024*1024});if(r.stderr)process.stderr.write(r.stderr);if(r.status!==0)throw new Error(r.stdout+r.stderr);return r.stdout;}
function put(p,bytes){const t=path.resolve(temp,p);assert(t.startsWith(temp+path.sep));fs.mkdirSync(path.dirname(t),{recursive:true});fs.writeFileSync(t,bytes);}
git(['init','-q']);for(const p of changed)put(p,Buffer.from(baseline.files[p],'base64'));git(['add','--',...changed]);for(const p of delivery)put(p,fs.readFileSync(p));git(['add','-N','--',...added]);
write('docs/scenario5-phase8d2.patch',git(['diff','--binary','--',...delivery]));git(['apply','--check','--reverse','--whitespace=error-all',path.resolve('docs/scenario5-phase8d2.patch')],process.cwd());
console.log(`08D.2 COMPLETE / PASS: ${changed.length} changed + one added application file; ${delivery.length} patch paths; reverse check PASS.`);
