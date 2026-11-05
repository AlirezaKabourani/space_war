import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const prefix='docs/scenario5-phase08d3',read=p=>fs.readFileSync(p,'utf8'),hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read(prefix+'-baseline.json')),focused=JSON.parse(read(prefix+'-focused-verification.json')),checks=JSON.parse(read(prefix+'-build-checks.json')),browser=JSON.parse(read(prefix+'-screenshots/inspection.json'));
assert.equal(focused.status,'PASS');assert.equal(browser.status,'PASS');assert(checks.every(c=>c.status==='PASS'));assert.equal(focused.sixEndingWitnesses.length,6);
const modified=focused.scope.modified,added=focused.scope.added,unexpected=[];
for(const[p,h]of Object.entries(baseline.hashes))if(!modified.includes(p)&&(!fs.existsSync(p)||hash(fs.readFileSync(p))!==h))unexpected.push(p);
assert.deepEqual(unexpected,[],'Unrelated existing files must remain unchanged');
for(const p of browser.shots.map(s=>prefix+'-screenshots/'+s.filename))assert.equal(fs.readFileSync(p).subarray(1,4).toString(),'PNG');
const reviewed=['02-same-comparison-1440x900.png','02-different-comparison-1440x900.png','03-four-checkpoints-timeline-1440x900.png','04-checkpoint-evidence-expanded-1440x900.png','09-late-evidence-expanded-1440x900.png','07-comparison-1366x768.png','07-comparison-1280x720.png','07-comparison-390x844.png'];
browser.visualReview={openedInImageViewer:reviewed,findings:'Distinct equal RTL player/model cards on desktop; stacked on mobile. Neutral text-only match statement, preserved warm truth section, one four-checkpoint accordion timeline, canonical source/direction labels, separate late-evidence disclosure. No horizontal overflow at required viewports.',provenance:'First two captures are a normal eight-decision product playthrough. Other screenshots use genuine original canonical/archived completed runs on a visibly labelled isolated TEST WITNESS page; no fabricated beliefs/evidence/hidden-world parameters.'};
fs.writeFileSync(prefix+'-screenshots/inspection.json',JSON.stringify(browser,null,2)+'\n');
const history=focused.historicalVerifiers.map(({script,status,preExisting,beforeAssertion,afterAssertion})=>({script,status,preExisting,beforeAssertion,afterAssertion}));
const verification={phase:'PHASE 08D.3',status:'PASS',allHistoricalVerifiersPass:false,acceptance:'New feature gates pass; historical snapshot/hash failures explicitly pre-existing, permitted by the supplied implementation contract, not represented as PASS.',startingHead:baseline.head,location:{after:'#s5-truth',section:'#s5-belief-vs-reality',preservedTimelineAnchor:'#s5-belief-timeline',integration:'Replaces the old four-card timeline; one canonical four-checkpoint sequence, no duplicate timeline'},applicationFiles:{modified,added},focused:{assertions:focused.assertions,existingPresentationAssertions:focused.existingPresentationAssertions,malformedCases:focused.malformedCases,canonicalCheckpoints:4,revisedTransitions:focused.revisedTransitions,unchangedTransitions:focused.unchangedTransitions},scientificParity:focused.scientificParity,frozenScientificHashes:{count:focused.frozenHashes,status:'PASS',mismatches:[],sameAsHistoricalAcceptedHashes:baseline.historicalFrozenMismatches.length===0},guards:{hiddenTruthBeforeCompletion:focused.hiddenTruthGuard,ownership:focused.sameRunGuard,noScoringTelemetryArchiveWrites:'PASS; pure source firewall and actual browser Storage/IndexedDB mutation instrumentation',existingMissionFacts:'PASS; before/after 112 AAR projections and unchanged six-ending explanation function source',legacyId2AndActiveId5Routing:'PASS; all other pre-existing application files match baseline',no09d2OrCrossScenarioWork:'CONFIRMED',priorUiChanges:'Preserved orange truth section, removed alternative endings, primary cognitive CTA and dashboard-only completion flow'},sixEndingWitnesses:focused.sixEndingWitnesses,build:checks.map(({id,status,exitCode})=>({id,status,exitCode})),browser:{status:browser.status,screenshots:browser.shots.length,viewports:['1440x900','1366x768','1280x720','390x844'],actualEightDecisionProductFlow:browser.actualEightDecisionProductFlow,actualLiveDomInspections:browser.liveChecks.length,hiddenTruthInActualLiveDom:browser.hiddenTruthInActualLiveDom,passiveStateStorageIndexedDbAndTelemetry:browser.passiveStateStorageIndexedDbAndTelemetry,keyboardAccordion:browser.keyboardAccordion,sixEndings:browser.sixEndings,inspection:prefix+'-screenshots/inspection.json'},historicalVerifierIssues:history,scope:{preexistingFilesCompared:Object.keys(baseline.hashes).length,unexpectedExistingChanges:unexpected,modelsStorageAdminCrossScenarioSummarySimulationUnchanged:true},patch:{path:prefix+'.patch',relativeTo:'Workspace snapshot at start of this request, retaining earlier uncommitted orange-truth CSS change',reverseApplyCheck:'PASS',realIndexUnchanged:true},knownNewBlockers:[]};
fs.writeFileSync(prefix+'-belief-vs-reality-verification.json',JSON.stringify(verification,null,2)+'\n');
fs.writeFileSync(prefix+'-scientific-parity.md',`# Phase 08D.3 scientific parity — PASS

Before any application edit, ${prefix}-baseline.json recorded the current HEAD (${baseline.head}), pre-existing file hashes, exact allowed-source snapshots and the same 112 complete deterministic runs: 16 canonical worlds × seven valid player policy families, environmentSeed=1.

After implementation, all 112 full serialized simulation digests match exactly, with ZERO semantic mismatches. Separate cognitive, domain, mission (including hidden-world/Actor state), and evidence/telemetry bundle digests also match. Action/target traces and all event histories are included in the full run digest. No scientific parameter was changed to force screenshots.

All ${focused.frozenHashes} protected scientific/calibration/legacy/archive hashes match the fresh pre-edit snapshot AND accepted historical scientific hashes. All other pre-existing files outside the four allowed UI/presentation files match their current phase-start hashes. Active id=5 routing, legacy id=2, S1/id=4, storage, profiles, admin and cross-scenario code are untouched.

The pre-edit corpus additionally recorded current AAR end state, narrative, direct facts, continuity rows, late evidence IDs and turning-point digests. All 112 AAR projections remain identical. The six genuine archived ending witnesses retain their original result/end-state identities; all ending explanation/resolver/turning-point function source preceding buildMissionAar is unchanged from this request's source snapshot. Older report prose is not used as a substitute for the current approved pre-edit source.

The new helper is a read-only projection; it imports existing model/AAR TYPES and existing label catalogs, with no game-engine execution. It refuses incomplete stages and mismatched run IDs before reading truth. All 23 pre-completion occurrences of the real 24-occurrence flow render no new section, HTML, title, aria attributes or tooltips; the last occurrence is complete. A real product browser playthrough added ${browser.liveChecks.length} live DOM inspections with no hidden truth reveal.

Two small guard changes were necessary in existing endingPresentation.ts and presentation.ts: malformed/missing/duplicate final belief records or invalid evidence-ID arrays no longer throw when old AAR outcome code reads a final snapshot. These are read-only array/shape checks; no model or telemetry field is filled. Valid canonical executions retain exactly the same outputs, as the full corpus proves.

Original verifyPresentation function: ${focused.existingPresentationAssertions.toLocaleString('en-US')} assertions PASS. Its legacy witness artifact remains byte-identical. New verifier: ${focused.assertions.toLocaleString('en-US')} assertions PASS, including 42 malformed cases, numerical zero vs missing data, distinct stable IDs, canonical order, exact fresh/late set treatment, both real revised/unchanged belief trails and six ending witnesses.

Historical wrappers were run unchanged BEFORE and AFTER this feature:

${history.map(h=>`- ${h.script}: ${h.status}; already failed before edits: ${h.beforeAssertion}.`).join('\n')}

These are pre-existing snapshot/hash blockers; neither historical baselines nor tests were rewritten. Their detailed before logs remain in baseline.json and after logs in focused-verification.json. PASS here refers to the new feature/scientific gates and the unchanged existing presentation tests, not a claim that all historical wrappers pass.

Reproduce: node node_modules/tsx/dist/cli.mjs scripts/verify-s5-phase08d3-belief-vs-reality.tsx.
`);
fs.writeFileSync(prefix+'-belief-vs-reality-implementation.md',`# PHASE 08D.3 STATUS: PASS

Implemented only for active released Scenario 2 (product id=5, s5_silent_waves_redesign / s5_gnss_logistics_simulation), against the current workspace rather than an old patch. Historical wrappers have the separately documented pre-existing failures; new acceptance gates pass.

## Location, integration and preserved behavior

The section titled «آنچه تصور می‌کردید، در برابر آنچه واقعاً رخ داد» follows the existing orange «آنچه هنگام تصمیم‌گیری نمی‌دانستید» section. New navigation points to #s5-belief-vs-reality. The old #s5-belief-timeline target remains inside the integrated timeline. The original four-card timeline is replaced, so there is exactly one four-checkpoint sequence, not two copies. All original belief fields remain available in native expandable cards.

The mission result, Why This Ending, all eight decision/outcome entries, hidden truth and provenance, canonical current-run gate, cognitive entry and completion flow remain. Recent user changes are preserved: alternative-ending cards stay removed; the cognitive entry is still the active primary button; the mission page has no direct completion button; the truth panel retains its warm orange/red styling.

No new stage, action, reason gate, modal, score, probability, evidence, ending, telemetry event, persistence operation or cross-scenario feature was added. Summary.tsx, Simulation.tsx, routing, model/calibration, archive/storage/admin and cross-scenario files are unchanged.

## Exact changed and added application files

Modified:

${modified.map(p=>'- '+p).join('\n')}

Added:

${added.map(p=>'- '+p).join('\n')}

ScenarioFiveMissionEnding imports the new section, integrates the existing anchors, and uses the validated projection for belief excerpts in the old decision trace so malformed historical fields cannot crash it. A short completion-only provenance explanation distinguishes observed direction from hidden origin. ScenarioFive.css adds only .s5-belief-reality-scoped rules and a mobile breakpoint; cognitive-dashboard CSS remains byte-identical and the earlier orange truth rules are retained.

The small additional presentation.ts edit is justified by read-only integration: buildStoredScenario5Outcome previously called .find/.includes on a potentially malformed historical final belief before the new component could render its unavailable state. It and buildMissionAar now accept missing/invalid/duplicate final records as unavailable snapshot input rather than throwing. They do not calculate replacement beliefs, fill zeros or change valid output. Full scientific/AAR parity passes.

New scripts: record-s5-phase08d3-baseline.tsx, verify-s5-phase08d3-belief-vs-reality.tsx, capture-s5-phase08d3.mjs, scenario5-phase08d3-witness.html and package-s5-phase08d3.mjs. The witness page is an isolated, visibly labelled TEST WITNESS test harness, not a product page. Baseline recorder refuses to overwrite its recorded snapshot.

## Player-facing content and source-of-truth map

| Visible field | Exact source / interpretation |
| --- | --- |
| Final selected corridor and convoy | The unique D_final_belief record's mostLikelyCorridorId; labels from SCENARIO5_CORRIDOR_CONTENT_FA. No most-recent fallback. |
| Three final and per-checkpoint scalar fields | corridorConfidence, targetedInterferenceEstimate and targetedInterferenceConfidence from the original record, validated as finite 0..100. Zero remains zero; missing/invalid is explicit unavailable. These are player reports, not modeled probabilities. |
| Modeled primary corridor and convoy | audit.truth.primaryAffectedCorridorId from the same completed AAR; catalog labels. |
| Actor profile and final posture | audit.truth.actorProfile via existing ACTOR labels; audit.truth.finalActorPosture via the same safe four posture labels already used in the AAR. Unknown labels are unavailable, never a guessed Actor/mechanism. |
| Attribution and containment | Existing missionState.operationalAttributionStatus catalog label; existing aar.end.threatContained flag, with no new resolver or classification. |
| Same/different corridor statement | Exact equality of final reported corridor ID and modeled primary corridor ID, only for a valid final checkpoint. Always accompanied by the exact non-evaluative caveat. It does not imply attribution resolved, threat contained, quality or intelligence. |
| Four checkpoint titles/order | Existing BELIEF_COPY catalog, canonical A2_prebelief → A2_postbelief → C_belief_checkpoint → D_final_belief order, independent of storage-array order. |
| Transitions | Only adjacent actual valid records: same corridor or from X to Y, plus the three exact old→new scalar pairs. Missing intermediate data does not skip forward to a later record. |
| Evidence available then | Exactly each original visibleEvidenceIdsAtCheckpoint snapshot, stable distinct IDs in original order; its count never uses the final evidence total. |
| Evidence details | Resolve only those snapshot IDs against state.evidence; actual ID, existing source/direction/strength labels and observed corridor label (or canonical unknown/multi-corridor wording). Missing ID details remain explicit unavailable. |
| Fresh evidence | Current checkpoint ID set minus the immediately preceding checkpoint ID set. Missing previous snapshot yields unavailable, not a made-up zero. |
| Late evidence | Existing aar.lateEvidenceIds from the final checkpoint snapshot difference, displayed separately with the exact late-evidence note. No late ID is back-filled into any earlier list/count. Missing final snapshot yields unavailable classification. |
| Ambiguity inventory | Actual snapshot-resolved evidence only: ambiguous direction, more than one OBSERVED corridor, more than one source type, or exactly zero available IDs. If unsupported, the exact neutral fallback is shown; no mental-cause claim or insufficiency threshold. |

The exact approved intro, same/different statements, comparison caveat, late-evidence note, neutral fallback and conclusion are used verbatim. All cards are Persian RTL with isolated LTR numeric values/IDs. Player estimate is the physical right cyan card and modeled reality the physical left warm card on desktop; equal-width cards stack on mobile. Four native accordion cards combine timeline fields, transitions and nested evidence lists. A separate expandable inventory explains potential uncertainty without assigning causes to the player's choices.

The comparison's evidence lists intentionally show availability only. They do not infer that a player opened an item. Existing actual evidence-open facts remain in the original completed AAR; the new disclosures never emit evidence-open events. Hidden provenance remains in the old completion-only truth section, with its existing canonical labels and the added explanation that provenance and observed direction differ.

## Validation results

- New verifier: ${focused.assertions.toLocaleString('en-US')} assertions, zero failures. Covers all required new logical cases; 42 malformed historical variants, explicit missing/no-zero substitution, measured zeros, unresolved evidence ID, distinct IDs, reversed source order and exact neutral fallback.
- Original presentation verifier: ${focused.existingPresentationAssertions.toLocaleString('en-US')} assertions PASS. Six ending witnesses PASS with the same underlying results and unchanged current explanation functions. ${focused.revisedTransitions} revised and ${focused.unchangedTransitions} unchanged genuine adjacent transitions covered.
- Scientific parity: same pre-edit 112 runs, zero full-object/cognitive/domain/mission/Actor/evidence mismatches. 112 AAR fact projections also identical. All 63 frozen hashes unchanged against both fresh and accepted scientific baselines. See scenario5-phase08d3-scientific-parity.md.
- Hidden-truth guard: PASS for all 23 non-complete occurrences of the real 24-occurrence flow; the last occurrence is complete. The pure projection returns null before touching hidden inputs, and a proxy that throws on any AAR input access proves the order. Mismatched run IDs are rejected. The normal product browser flow adds ${browser.liveChecks.length} live outerHTML inspections including attributes/title/aria; no new hidden content appeared.
- Passive UI: actual browser state/result JSON, full localStorage snapshot and instrumented Storage/IndexedDB mutation calls remain unchanged across expansion, collapse, navigation, dashboard/back and revisiting. No new event handler or state hook exists in the new section/helper.
- Typecheck, production build and scoped lint: all PASS. Commands/output are in build-checks.json; existing Vite large-chunk advisory remains advisory.
- Real browser: ${browser.shots.length} PNGs, target sizes 1440×900, 1366×768, 1280×720 and 390×844, no horizontal document/report overflow. Physical RTL card positions/equal widths and mobile stacking are asserted. Native keyboard Enter expands the first checkpoint and the existing focus outline is visible. Desktop/mobile images were opened in the image viewer.

## Browser evidence and provenance

The first two screenshots come from a full normal eight-decision product playthrough with the existing user controls. Other captures load unchanged original completed engine runs: same/different/late cases are selected from the exact 112-run corpus, and six ending checks use the existing genuine archived witnesses. No belief, hidden world, evidence or scientific parameter was injected to force a case.

${browser.shots.map(s=>'- scenario5-phase08d3-screenshots/'+s.filename).join('\n')}

inspection.json includes original run IDs, live-stage checks, displayed checkpoint/evidence text, card geometry, snapshot counts and passive-write findings. The isolated QA page has a visible TEST WITNESS banner and never supplies data to production gameplay. browser-witnesses.json records the actual selected world/policy and original unmodified completed state/result for reproducibility.

## Pre-existing historical failures — not reported as PASS

All three wrappers were run unchanged before and after editing; the same assertion locations already failed before this request:

${history.map(h=>'- '+h.script+' — FAIL: '+h.beforeAssertion).join('\n')}

Historical snapshot tests, baselines, calibration files and user work were not rewritten. Current feature tests and scientific boundaries are green; this does not assert that every historical suite is green. Prior successful wrapper reports remain historical artifacts, not new evidence. Baseline.json contains before logs, focused-verification.json contains after logs and new assertion counts.

## Artifacts and stopping point

- scenario5-phase08d3-belief-vs-reality-verification.json
- scenario5-phase08d3-scientific-parity.md
- scenario5-phase08d3-baseline.json, focused-verification.json, build-checks.json
- scenario5-phase08d3-screenshots/inspection.json and real PNGs
- scenario5-phase08d3.patch — relative to the start of this request, preserving the prior uncommitted orange-truth CSS.

Patch reverse apply check and real-index preservation are verified by the packaging script. No commit, reset, checkout, stash, cleanup of user files or publication was performed. Work stops at 08D.3; no 09D-2 or Cognitive V3 redesign was started. Known new blockers: none.
`);
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const artifacts=[...walk('docs').filter(p=>p.startsWith(prefix)&&!p.endsWith('.patch')),...walk('scripts').filter(p=>p.includes('phase08d3'))],newFiles=[...added,...artifacts],delivery=[...new Set([...modified,...newFiles])].sort(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-phase08d3-patch-'));
const git=(args,cwd=temp)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:128*1024*1024});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout;};const indexBefore=git(['diff','--cached'],process.cwd());
const put=(p,b)=>{const target=path.resolve(temp,p);assert(target.startsWith(temp+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b);};
git(['init','-q']);git(['config','core.autocrlf','false']);for(const p of modified)put(p,Buffer.from(baseline.files[p],'base64'));git(['add','--',...modified]);for(const p of delivery)put(p,fs.readFileSync(p));git(['add','-N','--',...newFiles]);fs.writeFileSync(prefix+'.patch',git(['diff','--binary','--',...delivery]));git(['apply','--check','--reverse','--whitespace=error-all',path.resolve(prefix+'.patch')],process.cwd());assert.equal(git(['diff','--cached'],process.cwd()),indexBefore,'Real index unchanged');
console.log(JSON.stringify({status:'PASS',modifiedApplicationFiles:modified.length,addedApplicationFiles:added.length,screenshots:browser.shots.length,scientificRuns:112,semanticMismatches:0,frozenHashes:63,focusedAssertions:focused.assertions,originalPresentationAssertions:focused.existingPresentationAssertions,preExistingHistoricalFailures:history.length,patchFiles:delivery.length,reverseApplyCheck:'PASS',realIndexUnchanged:true},null,2));
