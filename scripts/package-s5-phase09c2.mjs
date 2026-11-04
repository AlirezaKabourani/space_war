import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const prefix='docs/scenario5-phase09c2',read=p=>fs.readFileSync(p,'utf8'),hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read(prefix+'-baseline.json')),focused=JSON.parse(read(prefix+'-focused-verification.json')),browser=JSON.parse(read(prefix+'-screenshots/inspection.json')),checks=JSON.parse(read(prefix+'-build-checks.json'));
assert.equal(focused.status,'PASS');assert.equal(browser.status,'PASS');assert(Object.values(checks).every(c=>c.status==='PASS'));
const applicationFiles=Object.keys(baseline.files),unexpected=[];
for(const[p,h]of Object.entries(baseline.hashes))if(!applicationFiles.includes(p)&&(!fs.existsSync(p)||hash(fs.readFileSync(p))!==h))unexpected.push(p);
assert.deepEqual(unexpected,[]);assert.equal(browser.witnessChecks.length,6);assert.equal(browser.firstFold.complete,true);
assert.equal(hash(fs.readFileSync(prefix+'-screenshots/'+browser.s4Reference.filename)),hash(fs.readFileSync(browser.s4Reference.source)));
const pngs=[...browser.snapshots,...browser.reportShots].map(s=>s.filename).concat(browser.s4Reference.filename);
for(const p of pngs)assert.equal(fs.readFileSync(prefix+'-screenshots/'+p).subarray(1,4).toString(),'PNG');
const reviewed=['00-s4-reference-genuine-09c0.png','01-normal-dashboard-top-1440x900.png','02-orientation-and-phases-1440x900.png','03-all-nine-constructs-1440x900.png','03b-constructs-resources-and-coherence-1440x900.png','05-risk-and-interaction-1440x900.png','07-normal-top-1280x720.png','07-normal-top-1366x768.png','07-normal-top-390x844.png','test-only-positiveEdge-mobile-390x844.png','test-only-null-orientation.png'];
browser.visualReview={reviewedInImageViewer:reviewed,referenceComparison:'Accessible archived released S1 capture and read-only S4 source. Golden/green/cyan palette, rounded substantial track, white vertical marker, navy panel and centered title matched. Not pixel-identical; S5 four phases, signed risk, nine neutral constructs and caveats intentionally preserved.',missingSeparateAttachment:'No separate user image was accessible; no claim of comparison against one.'};
fs.writeFileSync(prefix+'-screenshots/inspection.json',JSON.stringify(browser,null,2)+'\n');
const verification={phase:'PHASE 09C-2',status:'FAIL',implementationStatus:'PASS',strictAcceptanceStatus:'FAIL',strictAcceptanceReason:'The required unchanged historical 09C-1 verifier fails on the pre-existing App.tsx hash from the authorized temporary admin shortcut. It failed before these edits with the same actual/expected hashes. No 09C-2 functional, scientific or browser check failed. Historical tests/baselines were not changed.',applicationFiles,focused,checks:Object.fromEntries(Object.entries(checks).map(([k,v])=>[k,{status:v.status}])),browser:{status:browser.status,screenshotCount:pngs.length,viewports:['1440x900','1366x768','1280x720','390x844'],normalRunSource:browser.normalRunSource,normalRunId:browser.normalRunId,firstFold:browser.firstFold,endpointContainment:'PASS; left edge of marker at -1; right edge at +1; other values use center',negativePointFourteen:'43% from physical left',nullAndZero:'Null has no marker; measured zero retains 50% marker',physicalRtlLabels:'PASS for OSI, all four phases and risk',reducedMotion:browser.reducedMotion,passiveNavigation:browser.navigation,completionEventCount:browser.completionEventCount,sixEndingWitnesses:browser.witnessChecks,liveMapGeometryUnchanged:browser.liveGameplay.every(x=>x.unchanged),inspection:prefix+'-screenshots/inspection.json'},scope:{preexistingFilesCompared:Object.keys(baseline.hashes).length,unexpectedExistingChanges:unexpected,onlyTwoApplicationFilesChanged:true,all63FrozenScientificHashesMatch:true,allOtherScenarioFilesUnchanged:true,appAndAdminShortcutUnchanged:true,historicalVerifierAndBaselinesUnchanged:true},referenceComparison:browser.visualReview,patch:{path:prefix+'.patch',relativeTo:'Workspace captured at start of 09C-2, preserving earlier uncommitted changes',reverseApplyCheck:'PASS',realIndexUnchanged:true},residualIssues:[{id:'PREEXISTING_09C1_APP_HASH',status:'FAIL',reproduction:'node node_modules/tsx/dist/cli.mjs scripts/verify-s5-phase09c1.tsx',beforeLog:prefix+'-09c1-before.txt',afterLog:prefix+'-09c1-after.txt',reason:'Earlier authorized temporary admin shortcut changed App.tsx after the 09C-1 baseline. App.tsx is out of scope in 09C-2.'}]};
fs.writeFileSync(prefix+'-verification.json',JSON.stringify(verification,null,2)+'\n');
fs.writeFileSync(prefix+'-scientific-parity.md',`# 09C-2 scientific parity: PASS

Reproduction: \`node node_modules/tsx/dist/cli.mjs scripts/verify-s5-phase09c2.tsx\`.

- 112 complete deterministic simulations: all 16 catalog worlds × seven valid player-policy families, environmentSeed=1.
- Zero mismatches against both the accepted 08D corpus and the full 09C-1 corpus. Full simulation-object hashes and separate cognitive, domain, mission and evidence/telemetry digests match exactly.
- All 63 frozen file hashes match the original scientific baseline. Existing S1/id=4, legacy S2/id=2, all gameplay/map code, Summary callbacks, same-run gate and App routing are byte-identical to the start of 09C-2.
- All 40 typed scalar leaves equal the unchanged field-to-UI map. Nine construct labels/definitions and their grouping remain exactly approved. The presentation helper itself is byte-identical; SHA-256 ${focused.definitionsAndHelperHash}.
- No score formula, risk normalization, new metric, aggregate score or scientific interpretation was added. The spectrum palette is directional only.

The unchanged 09C-1 verifier was executed before and after this phase. It fails at the same historical \`src/App.tsx\` hash assertion, caused by the previously authorized temporary admin shortcut. That assertion runs before its scientific corpus; therefore it cannot be cited as a passing scientific check. The independent 09C-2 verifier ran the entire corpus and preserved all pre-existing files except the two allowed presentation files. Logs: scenario5-phase09c2-09c1-before.txt and scenario5-phase09c2-09c1-after.txt. No historical baseline, test or App file was altered to hide the failure.
`);
fs.writeFileSync(prefix+'-dashboard-visual-polish.md',`# PHASE 09C-2 STATUS: FAIL — historical verifier; implementation PASS

The requested visual refinements are implemented. Focused, scientific, build and real-browser checks pass. Strict acceptance is FAIL because the required unchanged 09C-1 verifier already fails on App.tsx from the previously authorized admin shortcut. Its identical before/after failure is preserved; App and historical verification files remain unchanged. No new runtime or visual defect was found.

## Exact application changes

- src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard.tsx: descriptive main spectrum title; existing signed-axis helper and stored values retained; endpoint-only marker alignment hooks; compact-M0 class; explicit number/unit whitespace. No source fields or callbacks changed.
- src/ui/components/scenario/ScenarioFive.css: appended rules scoped exclusively under .s5-cognitive-dashboard. All earlier CSS is preserved byte-for-byte. No other application file changed relative to the phase-start snapshot.

New scripts: scripts/verify-s5-phase09c2.tsx, scripts/capture-s5-phase09c2.mjs, scripts/scenario5-phase09c2-witness.html. Documentation, fixtures, logs, baseline, build results, screenshots and patch are confined to the scenario5-phase09c2 artifact namespace. Existing uncommitted user work is preserved.

## Result

- Overall OSI: centered «طیف جهت‌گیری تصمیم عملیاتی–راهبردی در این اجرا», technical OSI label and exact signed numeric value; dark navy panel; 20px rounded S1 spectrum, physical left gold #f59e0b → green #22c55e → right cyan #38bdf8; white 4×34px marker. Physical LEFT=عملیاتی, RIGHT=راهبردی; visible −1/0/+1 ticks. The neutral center tick is short and below the track, distinct from the value marker. Direction does not mean quality.
- Four phases: all original names and values, same palette and white markers; compact 14px tracks, two columns desktop and one mobile. Main spectrum remains prominent.
- Risk: separate signed [-1,1] axis, 18px track and 4×32px white marker. LEFT=پذیرش ریسک کمتر, RIGHT=پذیرش ریسک بیشتر; independent non-evaluative explanatory text preserved.
- Nine construct meters: unchanged 0..100 data, grouping, null handling, definitions and accessible meter attributes. Rounded 11px bars use only a neutral blue/cyan family (#429fc6→#7ed0e4), without directional spectrum, thresholds or ranking.
- M0: compact two-column summary strip on desktop, stacked on mobile; title, overall coverage, coverage-not-performance wording, exact experimental validity note and five expandable percentages retained. Native keyboard disclosure and focus outline work. Main OSI title, value, entire track, ticks and labels are visible on the first real 1440×900 product frame; axis ends at y=${browser.firstFold.axis.bottom} inside report bottom y=${browser.firstFold.root.bottom}. M0 height is ${browser.firstFold.coverage.height.toFixed(2)}px with details closed.
- Number/unit spacing is explicit text whitespace plus flex gap. RTL labels and LTR signed geometry remain independent. Reduced-motion behavior is preserved; no animation added.

## Reference comparison

Actual accessible reference: ${browser.s4Reference.source}, copied byte-for-byte as scenario5-phase09c2-screenshots/00-s4-reference-genuine-09c0.png. Read-only source: released S1/id=4 local CognitiveDashboard and ScenarioFourRedesignedScenarioOne.css. Both genuine images were opened in the image viewer. Navy panels, substantial rounded spectrum, exact gradient stops, thin white vertical marker, centered descriptive heading and endpoint meanings match the S1 visual family. This is not a pixel-identical copy. S5 keeps four phases, exact signed ticks and risk semantics, nine neutral construct meters, data-completeness caveats and its own current-run navigation. No separate user screenshot was accessible, so no comparison against an unavailable image is claimed.

## Verification

- New focused verifier: ${focused.assertions} assertions PASS, including 40 scalar leaves, nine unchanged definitions, signed positions −1/−0.5/−0.14/0/+0.5/+1/null, zero vs missing, gates, immutable rendering and source/instrumentation boundary.
- 112-run deterministic parity: PASS, zero mismatches; all 63 frozen hashes match. Details: scenario5-phase09c2-scientific-parity.md.
- TypeScript typecheck, production build and scoped ESLint: PASS. Actual command outputs are in scenario5-phase09c2-build-checks.json. Existing Vite chunk-size advisory is retained.
- Actual browser at 1440×900, 1366×768, 1280×720 and 390×844: PASS, no horizontal document/report overflow. Mobile vertical scrolling is intentional.
- Browser uses actual unrounded React cognitive props read-only to verify each rendered marker. Interior marker centers match original signed coordinates within 0.1px; −0.14 is 43% from LEFT. At −1 the marker left edge anchors to the track left edge; at +1 its right edge anchors to the track right edge. Both 4px bars stay wholly inside the track horizontally, without changing helper normalization. Null omits the value marker and reports unavailable; 0 retains the center marker. Physical endpoint label coordinates are asserted for all six signed axes despite RTL.
- Real eight-decision product run: dashboard, back/reopen, full eight-decision trace, technical report/back, finish callbacks PASS. Runtime and passive analytics storage unchanged; exactly one real completion event.
- Six archived genuine engine-ending witnesses: correct same-run entry and back/reopen, passive analytics PASS. Synthetic display-only edge/null/zero fixtures are isolated in the QA HTML with a visible TEST ONLY banner; never supplied to production flow or represented as real player data.
- Live map geometry at three desktop sizes matches the archived accepted geometry within 1px; all live source/style bytes unchanged.
- Historical 09C-1 verifier: FAIL before AND after the phase, same App.tsx assertion/actual/expected digests. Reproduce with node node_modules/tsx/dist/cli.mjs scripts/verify-s5-phase09c1.tsx. Logs: scenario5-phase09c2-09c1-before.txt and scenario5-phase09c2-09c1-after.txt. No workaround or historical test modification was made. This is the sole residual acceptance issue, unrelated to these presentation edits.

## Browser evidence

${pngs.length} genuine browser PNGs and inspection.json under scenario5-phase09c2-screenshots/:

- 01-normal-dashboard-top-1440x900.png — actual product first viewport, compact M0 + full overall spectrum.
- 01b-coverage-keyboard-disclosure-1440x900.png — five percentages and keyboard focus.
- 02-orientation-and-phases-1440x900.png — main and all four phases, number/unit spacing.
- 03-all-nine-constructs-1440x900.png plus 03b-constructs-resources-and-coherence-1440x900.png — all nine across consecutive views; 04-construct-definitions-1440x900.png exposes definitions.
- 05-risk-and-interaction-1440x900.png — signed risk and timing caveats.
- 07-normal-top-{1280x720,1366x768,390x844}.png, 08-mobile-constructs-390x844.png, 09-mobile-risk-390x844.png — responsive layout.
- test-only-{negativeEdge,negativeReal,zero,positive,positiveEdge}-osi-and-four-phases.png and matching risk views — exact geometry; edge mobile images confirm containment/wrapping.
- test-only-null-orientation.png, test-only-null-constructs.png, test-only-null-risk-timing.png and partial/unavailable variants — null distinct from 0; absent score never replaced by a false center.
- witness-* — all six existing ending replays; live-unchanged-* — original map and convoy layout.

The screenshot manifest records actual displayed fields, raw marker values and coordinates, root/document widths, source/run IDs, test provenance, navigation and reviewed reference images.

## Delivery

scenario5-phase09c2-verification.json; scenario5-phase09c2-dashboard-visual-polish.md; scenario5-phase09c2-scientific-parity.md; scenario5-phase09c2.patch; scenario5-phase09c2-screenshots/inspection.json and PNGs. Patch is relative to the phase-start workspace, not repository HEAD. Reverse apply check and index preservation are checked by the packaging script. Work stops at 09C-2 for human review.
`);
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const artifacts=[...walk('docs').filter(p=>p.startsWith(prefix)&&!p.endsWith('.patch')),...walk('scripts').filter(p=>p.includes('phase09c2'))],delivery=[...new Set([...applicationFiles,...artifacts])].sort();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-phase09c2-patch-'));
const git=(args,cwd=temp)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:128*1024*1024});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout;};
const indexBefore=git(['diff','--cached'],process.cwd());
const put=(p,bytes)=>{const target=path.resolve(temp,p);assert(target.startsWith(temp+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);};
git(['init','-q']);git(['config','core.autocrlf','false']);for(const p of applicationFiles)put(p,Buffer.from(baseline.files[p],'base64'));git(['add','--',...applicationFiles]);for(const p of delivery)put(p,fs.readFileSync(p));git(['add','-N','--',...artifacts]);
fs.writeFileSync(prefix+'.patch',git(['diff','--binary','--',...delivery]));git(['apply','--check','--reverse','--whitespace=error-all',path.resolve(prefix+'.patch')],process.cwd());assert.equal(git(['diff','--cached'],process.cwd()),indexBefore);
console.log(JSON.stringify({implementation:'PASS',strictAcceptance:'FAIL (pre-existing 09C-1 App hash)',screenshots:pngs.length,patchFiles:delivery.length,patchReverseCheck:'PASS',indexUnchanged:true,unexpectedExistingChanges:unexpected},null,2));
