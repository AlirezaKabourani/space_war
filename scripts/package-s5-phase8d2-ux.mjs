import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const prefix='docs/scenario5-phase8d2-ux',read=p=>fs.readFileSync(p,'utf8'),hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read(prefix+'-baseline.json')),checks=JSON.parse(read(prefix+'-checks.json')),verification=JSON.parse(read(prefix+'-verification.json')),browser=JSON.parse(read(prefix+'-screenshots/inspection.json'));
assert(checks.checks.every(c=>c.status==='PASS'));assert.equal(verification.status,'PASS');assert.equal(browser.status,'PASS');assert.equal(browser.snapshots.length,17);assert.equal(browser.geometry.length,63);
const applicationFiles=checks.applicationFiles,allowed=new Set(applicationFiles);
const changedOriginal=[],unexpected=[];
for(const [p,h] of Object.entries(baseline.hashes)){assert(fs.existsSync(p),'Preexisting file deleted: '+p);if(hash(fs.readFileSync(p))!==h){changedOriginal.push(p);if(!allowed.has(p))unexpected.push(p);}}
assert.deepEqual(unexpected,[],'Only active S5 presentation files may change');
assert(applicationFiles.every(p=>p.startsWith('src/ui/components/scenario/ScenarioFive')||p.startsWith('src/ui/components/scenario/scenario-five/ui/')));
assert(applicationFiles.every(p=>!p.includes('/model/')&&!p.includes('/calibration/')));
const addedApplication=applicationFiles.filter(p=>!baseline.hashes[p]);
const maps=browser.geometry.filter(m=>m.map),sizes=[1280,1366,1440].map(width=>{const rows=maps.filter(m=>m.width===width),r=rows[0];for(const m of rows)for(const k of ['x','y','width','height'])assert(Math.abs(m.map[k]-r.map[k])<1);return {viewport:`${width}x${r.height}`,mapWidth:r.map.width,mapHeight:r.map.height,leftPanelWidth:r.leftWidth,samples:rows.length,maxGeometryDelta:Math.max(...rows.flatMap(m=>['x','y','width','height'].map(k=>Math.abs(m.map[k]-r.map[k]))))};});
const write=(p,s)=>fs.writeFileSync(p,s);
const purposes={
 'ScenarioFiveSimulation.tsx':'Recent-action slot inside the top band; neutral initial placeholder; explicit final-horizon copy.',
 'ScenarioFive.css':'Fixed-height top band/map tracks, wider left panel, larger type, corridor disclosures, bounded report scroll and ending comparison styles.',
 'ScenarioFiveMap.tsx':'Explicit map clock and convoy time units; persistent heading instruction line to avoid geometry changes.',
 'ScenarioFiveResourcePanel.tsx':'Clock icon, operational horizon in minutes, and explicit remaining minutes.',
 'ScenarioFiveActionCard.tsx':'Final-horizon time unit in existing action copy.',
 'ScenarioFiveSummary.tsx':'Compatibility AAR arrival/deadline and trace time labels; no score changes.',
 'ScenarioFiveProgress.tsx':'Recent-action hierarchy and explicit phase-review time labels.',
 'ScenarioFiveInformationPicture.tsx':'Passive corridor/unknown-location grouping; every existing evidence summary retained.',
 'ScenarioFiveOutcomePanel.tsx':'Explicit operational, arrival and deadline time wording.',
 'ScenarioFiveMissionEnding.tsx':'Realized-ending emphasis, five other endings and their conditions; explicit time labels.',
 'ScenarioFiveTime.tsx':'Added: shared presentation-only operational-time text and decorative clock icon.',
 'endingAlternatives.ts':'Added: typed Persian copy transcribed from the existing six resolver branches; no resolver.',
 'endingPresentation.ts':'Time-unit wording in existing explanatory strings only; calculation expressions unchanged.',
};
verification.checks=checks.checks.map(({id,status,exitCode})=>({id,status,exitCode}));verification.browser={status:'PASS',screenshots:17,geometrySamples:63,sizes,liveHiddenTruthFirewall:browser.liveHiddenTruthFirewall,groupDisclosuresMutateTelemetry:browser.groupDisclosuresMutateTelemetry,explicitEvidenceOpenCount:browser.explicitEvidenceOpenCount,completionEventCount:browser.completionEventCount,endingAlternatives:browser.endingAlternatives};verification.scope={preexistingFilesCompared:Object.keys(baseline.hashes).length,changedOriginalFiles:changedOriginal,addedApplicationFiles:addedApplication,unexpectedChanges:unexpected,appUnchanged:true,legacyId2Unchanged:true,priorDeliveryAndAuditArtifactsUnchanged:true};
write(prefix+'-verification.json',JSON.stringify(verification,null,2)+'\n');
write(prefix+'-report.md',`# PHASE 08D.2 — Scenario 2 UI/UX refinement and ending explanation pass

**PASS.** Applied to released Scenario 2 / active id=5, internal s5_silent_waves_redesign. The earlier phase-summary-header delivery and 09C-0 audit remain historical artifacts; this distinct delivery uses the suffix phase8d2-ux to avoid overwriting them.

## Visible changes

1. Recent decision is inside the upper information band, with a stronger teal background, accent border, separate label/action hierarchy and unchanged review button. An honest “no decision yet” placeholder reserves the same space initially.
2. Clock icons and explicit operational/map/remaining time labels retain T+ and the exact canonical values. Phase summaries, consequence/review panels, action previews, mission ending and compatibility AAR use explicit time wording/units.
3. On desktop, the top band stays 172px and the recent-action slot 48px. The map's heading and convoy tracks are stable, leaving its central frame unchanged across actions, outcomes, reasons, belief inputs and phase summaries. Convoy details remain available by internal scroll.
4. The left/right split changes from 2:3 to 1.08:1. At 1280px the left pane is about ${sizes[0].leftPanelWidth.toFixed(1)}px wide; decision text, headings and spacing are larger. Desktop page scroll remains absent; long decision/forms retain their own scroll and persistent action footer. This is not a claim that every long form fits without internal scroll.
5. Current information is grouped by corridor/convoy, with a separate unknown-location group when needed. Native keyboard-accessible disclosures show source, original conclusion and strength. Within-group original order and all evidence items are preserved. Up to six items open initially; longer sets start compact. Quality/limitation details remain in the existing explicit evidence-detail flow. Group disclosure does not record evidence-open/dwell telemetry or change belief inputs.
6. The completed mission's “why” section highlights the realized result, then lists exactly five other endings, translated conditions and a short explanation of relevant time/protection/resource/evidence factors. Copy follows the existing resolver's precedence, health 55/60, horizon 360, continuity 75/100, attribution and containment distinctions. No action is claimed to guarantee an alternative. This section exists only behind the pre-existing complete-stage guard.

## Changed application files

${applicationFiles.map(p=>`- ${p} — ${purposes[path.basename(p)]}`).join('\n')}

## Validation

- ${verification.assertions} focused assertions PASS; accepted 08D presentation verifier: ${verification.accepted08DAssertions} assertions PASS, without changing its assertions. Its generated witness artifact is restored byte-for-byte.
- Same scientific corpus: 16 worlds × 7 player-valid policies, seed=1, **112 complete runs / zero digest mismatches**. Full run values include mission/action/actor state, chronology, telemetry, domain and cognitive results.
- All **63 frozen scientific/archive/legacy hashes match**. App.tsx and legacy id=2 remain byte-identical to the start of this request. Runtime/timing/telemetry hook and mutation call expressions in Simulation and Map match their original expressions.
- Typecheck, production build and scoped ESLint PASS. Build retains the existing >500kB chunk-size advisory; it is not a compilation failure.
- **17 actual browser PNG captures**, 63 geometry/layout probes at 1280×720, 1366×768 and 1440×900. No page-level overflow, clipped header/footer or live hidden-truth leak. The completed report scrolls inside its own bounded root.
- The actual full browser run has zero evidence opens from passive group/review interactions and exactly one completion event. Previous exact A/B/C phase-review headers and local Continue invariance pass in the browser.
- ${Object.keys(baseline.hashes).length} pre-existing nonignored files compared; only ${changedOriginal.length} authorized active-presentation files changed, plus ${addedApplication.length} added presentation files. Existing scripts, models, other scenarios, previous evidence and 09C-0 documents remain unchanged.

## Stable map measurements

| Viewport | Frame width | Frame height | Left width | Maximum frame change across sampled gameplay stages |
| --- | --- | --- | --- | --- |
${sizes.map(s=>`| ${s.viewport} | ${s.mapWidth.toFixed(2)}px | ${s.mapHeight.toFixed(2)}px | ${s.leftPanelWidth.toFixed(2)}px | ${s.maxGeometryDelta.toFixed(2)}px |`).join('\n')}

## Browser evidence

All paths are under scenario5-phase8d2-ux-screenshots/:

${browser.snapshots.map(s=>`- ${s.filename} — ${s.stage}`).join('\n')}

inspection.json includes viewport geometry, canonical runtime values and interaction checks. Screenshots use a fresh isolated browser and the repository's existing test-player setup; all gameplay proceeds through actual UI controls. No model/world/resource/result state is injected.

## Delivery

- scenario5-phase8d2-ux-verification.json
- scenario5-phase8d2-ux-checks.json and check logs
- scenario5-phase8d2-ux-file-manifest.json
- scenario5-phase8d2-ux.patch (relative to the workspace at the start of this request)

Scientific logic, cognitive formulas, action/outcome/end-state semantics and legacy id=2 are unchanged. No new dashboard or cross-scenario behavior was implemented.
`);
write(prefix+'-file-manifest.json',JSON.stringify({phase:verification.phase,changedApplicationFiles:applicationFiles.map(p=>({path:p,status:baseline.hashes[p]?'modified':'added',purpose:purposes[path.basename(p)],beforeSha256:baseline.hashes[p]??null,afterSha256:hash(fs.readFileSync(p))})),priorFilesCompared:Object.keys(baseline.hashes).length,unexpectedChanges:[]},null,2)+'\n');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):[`${p}/${e.name}`]);
const artifacts=[...walk('docs').filter(p=>p.startsWith(prefix)&&!p.endsWith('.patch')),...walk('scripts').filter(p=>/s5-phase8d2-ux/.test(p))];
const added=[...addedApplication,...artifacts],delivery=[...new Set([...applicationFiles,...artifacts])].sort();const temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-phase8d2-ux-patch-'));
const git=(args,cwd=temp)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:64*1024*1024});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout;};
function put(p,bytes){const target=path.resolve(temp,p);assert(target.startsWith(temp+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
git(['init','-q']);for(const p of changedOriginal)put(p,Buffer.from(baseline.sources[p],'base64'));git(['add','--',...changedOriginal]);for(const p of delivery)put(p,fs.readFileSync(p));git(['add','-N','--',...added]);write(prefix+'.patch',git(['diff','--binary','--',...delivery]));git(['apply','--check','--reverse','--whitespace=error-all',path.resolve(prefix+'.patch')],process.cwd());
console.log(JSON.stringify({status:'PASS',applicationFiles:applicationFiles.length,changed:changedOriginal.length,added:addedApplication.length,patchPaths:delivery.length,patchReverseCheck:'PASS',sizes},null,2));
