import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const prefix='docs/scenario5-phase09c1',read=p=>fs.readFileSync(p,'utf8'),hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read(prefix+'-baseline.json')),verification=JSON.parse(read(prefix+'-verification.json')),checks=JSON.parse(read(prefix+'-checks.json')),browser=JSON.parse(read(prefix+'-screenshots/inspection.json'));
assert.equal(verification.status,'PASS');assert(checks.every(c=>c.status==='PASS'));assert.equal(browser.status,'PASS');assert.equal(browser.witnessChecks.length,6);assert(browser.witnessChecks.every(w=>w.access==='PASS'&&w.backReopen==='PASS'&&w.passiveTelemetry==='PASS'));
const modified=['src/ui/components/scenario/ScenarioFiveSummary.tsx','src/ui/components/scenario/ScenarioFive.css'],addedApp=['src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard.tsx','src/ui/components/scenario/scenario-five/ui/cognitiveDashboardPresentation.ts'];
const unexpected=[];for(const[p,h]of Object.entries(baseline.hashes))if(!modified.includes(p)&&(!fs.existsSync(p)||hash(fs.readFileSync(p))!==h))unexpected.push(p);assert.deepEqual(unexpected,[],'Unrelated existing files changed');
const csv=read(prefix+'-field-to-ui-map.csv').trimEnd().split(/\r?\n/).map(l=>[...l.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m=>m[1].replace(/""/g,'"')));assert(csv.every(r=>r.length===11));assert.equal(csv.length-1,40);assert.deepEqual(csv.slice(1).map(r=>r[2]).sort(),[...verification.typedScalarLeaves].sort(),'40 real TS leaves mapped exactly');
const ref=browser.s4Reference;assert.equal(hash(fs.readFileSync(prefix+'-screenshots/'+ref.filename)),hash(fs.readFileSync(ref.source)),'Reference is genuine unmodified 09C-0 capture');
const pngFiles=[...browser.snapshots,...browser.reportShots].map(s=>s.filename).concat(ref.filename);assert.equal(new Set(pngFiles).size,pngFiles.length);for(const p of pngFiles){const bytes=fs.readFileSync(prefix+'-screenshots/'+p);assert.equal(bytes.subarray(1,4).toString(),'PNG');}
verification.phase='PHASE 09C-1';verification.finalStatus='PASS';verification.applicationFiles={modified,added:addedApp};verification.fieldToUiCoverage={actualScalarLeaves:40,csvRows:40,nineMeasuredConstructs:9,unmeasuredProperty:'informationDiscipline',signedRiskSeparate:true,scenarioId:'gate only, not an extra score'};
verification.browser={status:'PASS',normalRunId:browser.normalRunId,normalRunSource:browser.normalRunSource,screenshotCount:pngFiles.length,desktopViewports:['1280x720','1366x768','1440x900'],mobileViewport:'390x844',sixEndingWitnesses:browser.witnessChecks,passiveNavigation:browser.navigation,completionEventCount:browser.completionEventCount,liveMapGeometryUnchanged:browser.liveGameplay.every(x=>x.unchanged),hiddenTruthFirewall:browser.hiddenTruthFirewall,nullFixturesExplicitlyTestOnly:true,s4Reference:ref};
verification.checks=checks.map(({id,status,exitCode})=>({id,status,exitCode}));verification.scope={preexistingFilesCompared:Object.keys(baseline.hashes).length,unexpectedExistingChanges:unexpected,existingGameAndMapFilesUnchanged:true,oldVerifierCodeAndArtifactsUnchanged:true};verification.knownObjectiveBlockers=[];verification.preexistingWarnings=checks.filter(c=>c.id==='build'&&c.stderr).map(c=>c.stderr.trim());
fs.writeFileSync(prefix+'-verification.json',JSON.stringify(verification,null,2)+'\n');
const witnessRows=browser.witnessChecks.map(w=>`| ${w.endingId} | ${w.runId} | PASS | PASS |`).join('\n');
const shots=[...browser.snapshots.map(s=>({filename:s.filename,kind:'Actual live product UI; unchanged geometry'})),...browser.reportShots.map(s=>({filename:s.filename,kind:s.filename.startsWith('test-only-')?'Explicit TEST ONLY presentation fixture':s.filename.startsWith('witness-')?'Frozen-engine archived ending replay via real Summary navigation':'Actual product completion/dashboard UI'})),{filename:ref.filename,kind:'Genuine previous 09C-0 released-S1 reference, copied byte-for-byte'}];
fs.writeFileSync(prefix+'-implementation.md',`# PHASE 09C-1 STATUS: PASS

Implemented approved Appendix A for released Scenario 2, active id=5 / s5_silent_waves_redesign. The approved specification is preserved at scenario2-cognitive-dashboard-final-spec-09c1.md. No earlier draft replaced it.

## Application files

- Modified: ${modified[0]} — completed current-run gate and local mission/cognitive/technical navigation; the old technical report body/data is retained.
- Modified: ${modified[1]} — new .s5-cognitive-dashboard-only rules appended; every existing style remains byte-identical.
- Added: ${addedApp[0]} — dedicated RTL player dashboard, native CSS axes/meters/disclosures, unavailable view.
- Added: ${addedApp[1]} — typed field lists, exact approved definitions, current-run gate and display-only formatting.

09C-1 verification/capture/check/package scripts and a clearly isolated test witness HTML page were added under scripts/. Existing scripts and game/model files were not modified. The recently reverted map/card relocation remains reverted: ScenarioFiveMap and all live gameplay components match the start of 09C-1 byte-for-byte.

## Entry, data boundary and navigation

The existing Mission Ending button «مشاهده الگوی تصمیم‌گیری» now opens the dedicated view titled «الگوی تصمیم‌گیری شما». The Summary gate requires runtime stage complete, non-null result and equal nonempty runtimeState.runId / result.runId / result.cognitive.runId; it also checks the literal cognitive scenario identity. Missing/mismatched data renders a truthful unavailable screen. There is no retrieval from storage, another user/run, or global analytics.

The dashboard receives only the identical canonical cognitive object and navigation callbacks. Mission/domain/hidden-world/Actor values never enter score derivations. Back returns to the same immutable completed Mission Ending/AAR. «مرور مسیر تصمیم‌ها» opens its existing complete eight-decision trace without assigning score contributions. «پایان سناریو» delegates the original completion callback. «گزارش فنی کامل» is secondary access to the retained mixed technical report and has an explicit return to the cognitive view. No runtime stage was added, no run restarted and no reload restoration implemented.

## Exact modules and field coverage

The CSV maps all **40 actual scalar leaves**: 9 identity/version/validity fields, 6 completeness, 9 orientation including the four tuple indices, 11 construct properties and 5 descriptive telemetry fields. scenarioId is consumed by the identity gate, not displayed as a score. Eight metadata values are available in the technical disclosure; validityStatus also supplies the exact approved experimental note.

- M0 «درباره داده‌های این گزارش»: actual overall coverage and five detail percentages, explicitly not performance. Zero and partial coverage are preserved.
- M1 «جهت‌گیری تصمیم‌ها»: actual overall and four phase OSIs; physical left=operational / right=strategic, explicit signed two-decimal values and LTR axis math. Three stored strengths and numeric-only dispersion. No UI averaging or missing-phase fill; A2 evidence acquisition remains excluded by the unchanged engine.
- M2 «الگوهای رفتاری مشاهده‌شده»: exactly the approved nine measured constructs, in four approved groups, neutral bars, actual values, one native definition disclosure per card. No grades, ranks, mastery colors, extra construct or global score.
- M3 «موضع ریسک و ویژگی‌های تعامل»: separate signed risk axis; stored revision counts/rate; only median/IQR convert ms to seconds with one decimal. Time is descriptive; revision/evidence rate is temporal association, not demonstrated causation.
- M4 «روش محاسبه و محدودیت‌ها»: scenario-bound proxy/validation/run-boundary caveats, one unscored informationDiscipline note, exact current metadata and non-attributive AAR navigation.

NOT_AVAILABLE / excluded from the score view: coalitionOrientation, perWindow/per-decision cognitive contribution arrays, S4 markerPercent/dispersionLabel/responseProcess/missingReasons, aggregate evidence dwell and longest/shortest decision summaries. No substitute fields, calculations or fabricated action-level contributions were added. The only derived numeric presentation is axis location, numeric formatting and the approved timing-unit conversion.

## S1 visual reference and S5 isolation

The reference is released Scenario 1, id=4, local CognitiveDashboard in ScenarioFourRedesignedScenarioOne. The genuine 09C-0 image is included unchanged, with original source path and digest equivalence recorded. Dark panels, Vazirmatn, blue accents, readable RTL/LTR numbers, text beside charts and native details follow those conventions. No S4 scientific helper, S4 dimension list, risk normalization, thresholds or App heuristic radar is imported. S4 files and general analytics remain unchanged.

## Validation

- New scoped verifier: ${verification.assertions} assertions PASS. Exact nine definitions are checked against approved Appendix A; actual TS leaves and CSV coverage match.
- Same 112 full deterministic traces: 16 worlds × seven player-valid policy families, environmentSeed=1; **zero semantic mismatches** against both the freshly recorded pre-change corpus and the accepted corpus. Complete cognitive/domain/mission/evidence/telemetry digests match.
- All 63 frozen scientific/archive/legacy hashes match. Source guards preserve active S1 id=4, legacy id=2, App routing, live map and existing runtime/gameplay. ${Object.keys(baseline.hashes).length} pre-existing files compared, with only the two approved existing presentation files changed.
- Unmodified 08D/08D.1/08D.2 regressions PASS: 32,798 / 1,516 / 115 / 2,677 assertions. Historical generated files are restored byte-for-byte, not overwritten as new evidence.
- Typecheck, production build and scoped ESLint PASS. Existing Vite >500kB chunk advisory remains; no new compile/lint warning.
- Actual product browser run reaches the dashboard, back/reopen, full immutable trace, old technical report and finish callback. Analytics storage is exactly unchanged through passive navigation/disclosures; the real completion event count is one.
- Desktop 1280×720, 1366×768, 1440×900 and mobile 390×844 pass horizontal-overflow checks. Completed report scrolling is intentional. Three live-map samples retain their previous geometry exactly. Native keyboard detail activation and physical signed-axis position are checked in the browser using the actual unrounded cognitive props.
- ${pngFiles.length} genuine browser PNGs cover normal modules, all nine constructs across sequential frames, definitions, methods, mobile, six endings and test-only null/zero/unavailable states. The test-only pages show a persistent explicit banner; they are not claimed as user-run data.

## Six ending witnesses

Archived unmodified scientific witnesses are loaded by the isolated QA page. Each begins at its genuine Mission Ending, then uses the real entry button to the same Summary/dashboard implementation and tests back/reopen without analytics changes. These complement the actual full product run; they are not six invented user plays.

| Ending | Same runtime/result/cognitive run ID | Access | Back/reopen, passive analytics |
| --- | --- | --- | --- |
${witnessRows}

## Screenshots

All filenames below are under scenario5-phase09c1-screenshots/. inspection.json records actual DOM text, canonical field values, axis geometry, run IDs, viewport and evidence source.

${shots.map(s=>`- ${s.filename} — ${s.kind}`).join('\n')}

## Artifacts and stopping point

- scenario5-phase09c1-field-to-ui-map.csv
- scenario5-phase09c1-null-state-verification.md
- scenario5-phase09c1-scientific-parity.md
- scenario5-phase09c1-verification.json and checks/logs
- scenario5-phase09c1-screenshots/inspection.json
- scenario5-phase09c1.patch, relative to the workspace at the start of this request

Known objective blockers: none. Implementation stops here for human/ChatGPT patch and screenshot review. No general analytics, cross-scenario aggregation, new scientific metric, ending, balancing or validation phase was started.
`);
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):[`${p}/${e.name}`]);
const optionalSpec='docs/scenario2-cognitive-dashboard-final-spec-09c1.md',artifacts=[...walk('docs').filter(p=>p.startsWith(prefix)&&!p.endsWith('.patch')),optionalSpec,...walk('scripts').filter(p=>p.includes('phase09c1'))];
const added=[...addedApp,...artifacts],delivery=[...new Set([...modified,...added])].sort(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-phase09c1-patch-'));
const git=(args,cwd=temp)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:64*1024*1024});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout;};const realIndexBefore=git(['diff','--cached'],process.cwd());
function put(p,bytes){const target=path.resolve(temp,p);assert(target.startsWith(temp+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
git(['init','-q']);for(const p of modified)put(p,Buffer.from(baseline.files[p],'base64'));git(['add','--',...modified]);for(const p of delivery)put(p,fs.readFileSync(p));git(['add','-N','--',...added]);fs.writeFileSync(prefix+'.patch',git(['diff','--binary','--',...delivery]));git(['apply','--check','--reverse','--whitespace=error-all',path.resolve(prefix+'.patch')],process.cwd());assert.equal(git(['diff','--cached'],process.cwd()),realIndexBefore,'Real index unchanged');
console.log(JSON.stringify({status:'PASS',modifiedApplicationFiles:modified,addedApplicationFiles:addedApp,mappedFields:40,screenshots:pngFiles.length,sixEndingWitnesses:6,preexistingFilesCompared:Object.keys(baseline.hashes).length,patchPaths:delivery.length,patchReverseCheck:'PASS',realIndexUnchanged:true,knownBlockers:[]},null,2));
