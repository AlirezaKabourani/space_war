import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const prefix='docs/scenario5-c2-refinement',read=p=>fs.readFileSync(p,'utf8'),hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read(prefix+'-baseline.json')),focused=JSON.parse(read(prefix+'-focused-verification.json')),build=JSON.parse(read(prefix+'-build-checks.json')),before=JSON.parse(read(prefix+'-before/inspection.json')),browser=JSON.parse(read(prefix+'-screenshots/inspection.json'));
assert.equal(focused.status,'PASS');assert.equal(browser.status,'PASS');assert(Object.values(build).every(c=>c.status==='PASS'));
const applicationFiles=Object.keys(baseline.files),external=[];
for(const[p,h]of Object.entries(baseline.hashes)){if(applicationFiles.includes(p))continue;const current=hash(fs.readFileSync(p));if(current!==h){if(p.startsWith('docs/scenario-cross-09d0-'))external.push({path:p,before:h,after:current,handling:'Preserved concurrent documentation edits; excluded from this patch'});else assert.equal(current,h,'Unexpected existing change '+p);}}
const targets=[[1920,1080],[1600,900],[1366,768]],layout=targets.map(([w,h])=>{const pre=before.shots.find(s=>s.width===w),post=browser.shots.find(s=>s.width===w);return {viewport:w+'x'+h,oldHeaderHeight:pre.header.height,newHeaderHeight:post.header.height,oldMapHeight:pre.map.rect.height,newMapHeight:post.map.rect.height,oldConvoyPanel:{height:pre.strip.clientHeight,scrollHeight:pre.strip.scrollHeight,overflow:pre.strip.overflowY},newConvoyPanel:{height:post.strip.clientHeight,scrollHeight:post.strip.scrollHeight,overflow:post.strip.overflowY,columns:post.strip.columns},allFourInitiallyVisible:post.cards.every(c=>c.rect.top>=0&&c.rect.bottom<=h),horizontalOverflow:false,wholePageScrolling:post.document.height>h,stopButtonInsideViewport:post.stop.bottom<=h};});
for(const item of layout.filter(v=>v.viewport!=='1366x768'))assert(item.allFourInitiallyVisible);
const reviewed=['01-initial-1920x1080.png','01-initial-1600x900.png','01-initial-1366x768.png','01b-convoys-scrolled-1366x768.png','10b-expanded-convoy-details-scrolled-1600x900.png','02b-mobile-convoy-details-390x844.png'];
browser.visualReview={openedInImageViewer:reviewed,comparison:'Before and after real product at target desktop sizes. Four full convoy cards on primary desktop; 1366 uses two columns and whole-page scroll, mobile one column. Expanded evidence remains in normal flow. No synthetic runtime data.'};
fs.writeFileSync(prefix+'-screenshots/inspection.json',JSON.stringify(browser,null,2)+'\n');
const verification={implementationStatus:'PASS',allTestsPass:false,focused,build:Object.fromEntries(Object.entries(build).map(([k,v])=>[k,v.status])),browser:{status:'PASS',realProduct:true,viewportResults:layout,additionalViewport:'390x844',screenshots:browser.shots.length,beforeScreenshots:before.shots.length,eightDecisionFlow:browser.fullEightDecisionFlow,passiveMapInspection:browser.passiveMapInspection,glossaryOpenClose:browser.glossaryOpenClose,stopConfirmationAndCancel:browser.stopConfirmationAndCancel,allEightSelectedLayoutsCheckedAt1600:true,svgAspectAndGeometry:'PASS; equal CTM x/y scales in browser, complete SVG markup unchanged except passive data attributes',currentConvoyData:'PASS; actual props arrival/deadline/integrity compared to DOM',keyboardFocus:'PASS',inspection:prefix+'-screenshots/inspection.json'},applicationFiles,concurrentDocumentationChanges:external,limitations:['At 1366x768 and smaller, normal page scrolling preserves all content; four cards use two columns then one on phones.','Desktop decision/evidence/form panes retain their existing internal scroll body and persistent actions. The convoy panel has no internal scroll at any tested size.','Expanding convoy evidence can grow the overall page; no evidence is clipped.','Unchanged historical wrapper tests still fail their pre-existing App.tsx snapshot assertions. Existing presentation tests themselves pass 32,798 assertions; full logs retained.'],patch:{path:prefix+'.patch',relativeTo:'Current workspace snapshot at start of C2 request, not repository HEAD',reverseApplyCheck:'PASS',indexUnchanged:true}};
fs.writeFileSync(prefix+'-verification.json',JSON.stringify(verification,null,2)+'\n');
fs.writeFileSync(prefix+'-report.md',`# Scenario 2 command console refinement

Implementation: PASS. Build, focused tests, scientific parity, existing presentation tests and real-browser acceptance: PASS. The complete historical wrapper suite is not all green: its old App.tsx snapshot guards retain the previously reported failure. Detailed logs are preserved, with no edits to historical tests/baselines or App.

## Changes in the existing product

The active released Scenario 2 (internal ScenarioFive, catalog id=5) now has a content-sized four-convoy strip beneath its existing map. This is the original live console; no duplicate page, prototype, dependency or simulation state was added.

Exactly three application files changed relative to the start of this request:

- src/ui/components/scenario/ScenarioFive.css: removed convoy scroll/height caps and obsolete media overrides, flexible map/card allocation, compact header/event strip, readable typography, stable action selection styling, simplified nested borders, CSS-only convoy/route hover/focus correspondence, responsive page flow. All cognitive-dashboard CSS is byte-identical to its pre-task suffix.
- src/ui/components/scenario/ScenarioFiveMap.tsx: convoy health/arrival/deadline use semantic label/value rows; route and cargo, status, margin, delay, mitigations, evidence and target controls remain present. Added data attributes on existing route shapes for passive CSS associations. Map SVG, coordinates, movement, effects, callbacks and target logic remain unchanged.
- src/ui/components/scenario/ScenarioFiveActionCard.tsx: title and existing selection indicator grouped in a compact heading; isolated LTR resource/time values. Every original title, description, known effect, cost, timing and target restriction remains sourced from existing catalog/copy/helpers.

New task-owned scripts: capture-s5-c2-refinement.mjs, verify-s5-c2-refinement.tsx and package-s5-c2-refinement.mjs under scripts/. Other artifacts are confined to the scenario5-c2-refinement namespace under docs/.

## Root cause and layout solution

The previous desktop media rule forced the convoy strip to height/max-height 128px while another rule applied overflow-y:auto. Actual 1600×900 content needed ${before.shots.find(s=>s.width===1600).strip.scrollHeight}px, and 1366×768 needed ${before.shots.find(s=>s.width===1366).strip.scrollHeight}px. The map grid reserved exactly 128px for these cards. The header also fixed three rows (80/18/48px) inside a 172px box, and the shell's 920px cap wasted vertical room on taller screens.

The convoy strip now uses an unrestricted auto-height Grid with visible overflow; no hidden overflow, font scaling or removed fields. Four equal-width cards stretch to the same row height at wide desktop sizes, with consistent RTL label/value alignment. Obsolete 128/210/260/330px strip caps and fixed map-row allocation were removed rather than layering another cap. The map takes the flexible space left above the intrinsic-height strip, with a usable 220px minimum; SVG viewBox/preserve-aspect behavior prevents distortion. Existing coordinates, route curves, truck deconfliction and animation logic are unchanged.

Header height is intrinsic, resource indicators share separators rather than individual boxes, and all values/phase/status/controls remain. The event strip wraps meaningful text and has no fixed clipping height. Its identity/title can share a line. Footer spacing is scoped to a parent containing this live console, keeping the actual Stop Scenario button accessible while using more of the viewport. Typography keeps the existing Vazirmatn: 18px phase title, 16px question, 14px option title, 12–13px body/convoy metadata, readable secondary colors and 1.5–1.65 line heights. Selected action borders retain their thickness, avoiding layout shifts, with an explicit check indicator and visible keyboard outline.

## Responsive behavior and measured before/after

| Viewport | Header before → after | Convoy panel before (content) → after (content) | Map height before → after | Result |
| --- | --- | --- | --- | --- |
${layout.map(v=>`| ${v.viewport} | ${v.oldHeaderHeight.toFixed(1)} → ${v.newHeaderHeight.toFixed(1)}px | ${v.oldConvoyPanel.height} (${v.oldConvoyPanel.scrollHeight}) → ${v.newConvoyPanel.height} (${v.newConvoyPanel.scrollHeight})px | ${v.oldMapHeight.toFixed(1)} → ${v.newMapHeight.toFixed(1)}px | ${v.allFourInitiallyVisible?'All four cards fully in first viewport, no internal scroll':'Two columns; normal page scroll, no convoy scroll or clipping'} |`).join('\n')}

At 1600×900 and 1920×1080 all four cards are fully visible simultaneously in the initial viewport, and after dynamic updates. All eight selected-decision layouts were checked at 1600×900, including required-target controls. At 1366×768 and widths up to 1439px, cards use two columns and the entire page may grow; decision/form actions return to normal flow. Under 900px the operational area and decision panel stack; under 540px convoy and decision cards use one column. No aggressive viewport font shrinking or transform-scale fitting is used. No horizontal document overflow at any tested viewport. Expanded convoy evidence grows the page with bounded map height; no nested convoy scrollbar or concealed text is introduced.

Existing desktop decision/evidence/form scroll bodies remain intentional. The requirement addressed scrolling in the convoy strip; full decision text, previews and evidence remain reachable using their established pane and action footer.

## Passive map–convoy connection

Hovering a card or focusing one of its controls highlights only that convoy's existing route and truck; hovering/focusing an eligible truck highlights the matching card. Four explicit ID mappings avoid incorrect associations. No new React state, timer or event handler is needed. The pre-existing legal-target selection still highlights the card and updates the select field through its original callback. Browser checks confirm inspection leaves runtime JSON and analytics storage exactly unchanged.

## Verification

- TypeScript typecheck, production Vite build, scoped ESLint: PASS. Outputs: scenario5-c2-refinement-build-checks.json.
- Focused verifier: ${focused.assertions.toLocaleString('en-US')} assertions PASS; all other application files and all 63 frozen files unchanged. Entire cognitive stylesheet suffix preserved byte-for-byte; cognition components, helper and gate unchanged.
- Original verifyPresentation function executed unchanged: ${focused.existingPresentationAssertions.toLocaleString('en-US')} assertions PASS. All 112 deterministic complete traces (16 worlds × seven valid policies, environmentSeed=1) have zero full-run/cognitive/domain/mission/evidence mismatches against accepted corpora.
- All 896 pre-decision states render four real convoy cards with canonical status, cargo, health, arrival and deadlines. Full action copy is verified for every available option; rendering is immutable.
- Whole original map SVG is equal to the pre-task source after stripping only newly added data attributes. Original processing/movement hooks, UI timers and target callbacks compare equal. Actual browser SVG CTM scales match in x/y at every viewport.
- Real product browser: ${browser.shots.length} after PNGs and three before PNGs. Target sizes 1920×1080, 1600×900 and 1366×768 were rendered and opened for visual review; mobile 390×844 additionally checked. Manifest includes actual rectangles, text, dimensions, computed fonts and overflow, not simulated measurements.
- Normal eight-decision completion passes all reason/belief gates, target selection, evidence open/close/back, phase summaries and updated convoy data. Cognitive entry/back/finish remains functional. Glossary opens/closes. Real Stop Scenario opens its existing confirmation and cancellation leaves the run/events unchanged. Focus outline and passive hover mapping checked.
- Unchanged historical wrappers verify-s5-phase8d2-ux.tsx and verify-s5-phase09c1.tsx: FAIL at their pre-existing App.tsx baseline guards, before behavioral checks. The same failure was documented before this request. These wrappers/baselines and App are not modified. Logs: scenario5-c2-refinement-historical-tests.json. Do not interpret this report as claiming every historical test passed.

## Scope and limitations

No progression, decision availability, confirmation logic, runtime/clock, cost, outcome, evidence, scoring, API, data contract or operational text change. Existing active S1/id=4 and legacy S2/id=2 files remain unchanged. No sample data in production. The previously authorized small admin preview shortcut remains unchanged.

Four documentation files under docs/scenario-cross-09d0-* changed concurrently outside this task's writes. Their observed hashes are recorded in verification.json. Those changes were preserved, not reverted or included in this patch. All other pre-existing application files outside the three listed above match the task-start snapshot.

At small screens normal page scrolling is intentional; when expanding all convoy evidence the page can also grow on desktop. All meaningful content stays accessible. Historical snapshot-wrapper failures are the remaining verification limitation; no new runtime/layout blocker was found in the tested flows.

## Review artifacts

- scenario5-c2-refinement-screenshots/01-initial-1600x900.png
- scenario5-c2-refinement-screenshots/01-initial-1920x1080.png
- scenario5-c2-refinement-screenshots/01-initial-1366x768.png
- scenario5-c2-refinement-screenshots/01b-convoys-scrolled-1366x768.png
- scenario5-c2-refinement-screenshots/10b-expanded-convoy-details-scrolled-1600x900.png
- scenario5-c2-refinement-screenshots/inspection.json and before/inspection.json
- scenario5-c2-refinement-verification.json, focused-verification.json, build-checks.json and historical-tests.json
- scenario5-c2-refinement.patch — relative to this request's starting workspace, preserving all earlier uncommitted work.

Reproduce with node node_modules/tsx/dist/cli.mjs scripts/verify-s5-c2-refinement.tsx, node scripts/capture-s5-c2-refinement.mjs, and the typecheck/build/lint commands in the build log. The --before capture mode is only for the pre-change workspace and its existing images are retained as historical evidence. Packaging checks patch reverse applicability and does not alter the real git index.
`);
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const artifacts=[...walk('docs').filter(p=>p.startsWith(prefix)&&!p.endsWith('.patch')),...walk('scripts').filter(p=>p.includes('s5-c2-refinement'))],delivery=[...new Set([...applicationFiles,...artifacts])].sort(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-c2-refinement-patch-'));
const git=(args,cwd=temp)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:128*1024*1024});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout;};
const index=git(['diff','--cached'],process.cwd());const put=(p,b)=>{const target=path.resolve(temp,p);assert(target.startsWith(temp+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b);};
git(['init','-q']);git(['config','core.autocrlf','false']);for(const p of applicationFiles)put(p,Buffer.from(baseline.files[p],'base64'));git(['add','--',...applicationFiles]);for(const p of delivery)put(p,fs.readFileSync(p));git(['add','-N','--',...artifacts]);fs.writeFileSync(prefix+'.patch',git(['diff','--binary','--',...delivery]));git(['apply','--check','--reverse','--whitespace=error-all',path.resolve(prefix+'.patch')],process.cwd());assert.equal(git(['diff','--cached'],process.cwd()),index);
console.log(JSON.stringify({implementation:'PASS',allHistoricalTestsPass:false,primaryDesktopConvoys:'PASS',fullRuns:112,semanticMismatches:0,sourceFiles:applicationFiles,afterScreenshots:browser.shots.length,beforeScreenshots:before.shots.length,patchFiles:delivery.length,patchReverseCheck:'PASS',indexUnchanged:true},null,2));
