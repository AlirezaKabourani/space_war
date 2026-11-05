# Phase 09D-2A: read-only structural comparison

This is scientific fact extraction and deterministic non-human diagnosis, not approval of numeric aggregation, a calibration design, a linked scale, or interpretation of a participant. No common score, norm, ranking, between-scenario average or fused formula was created.

The referenced `Phase_09D2_Scientific_Harmonization_Framework_v1.md` was not found in the workspace, the visible `E:/war` tree, or matching Downloads filenames. Its contents, methodological requirements and conformance are **NOT DETERMINABLE**. The supplied audit contract governs this bounded extraction. This gap is not replaced by invented methodology. The older `scenario-cross-09d0-formula-comparison.md` was consulted as a reference, and every formula/path/count below was checked against current source rather than inherited line numbers.

## Baseline and read-only boundary

Initial HEAD: `aed3b973c167b89011a30f2c8a0e76433c02ae95`. Preflight captured 1,214 existing files, including 274 source/script files and Git/configuration evidence, and verified stable repeated hashes. There were already four modified tracked presentation files: `ScenarioFive.css`, `ScenarioFiveMissionEnding.tsx`, `endingPresentation.ts`, and `presentation.ts`, plus untracked 08D.3/presentation artifacts and two presentation components. These are part of this audit's initial baseline, not audit edits. The final manifest compares their exact current bytes with that baseline and reports any concurrency separately.

Only new files named `docs/scenario-cross-phase09d2a-*` and audit-only `scripts/scenario-cross-phase09d2a-*` were added. No browser was launched, no installed profiles/IndexedDB/event logs were read, and no game, UI, storage, session, telemetry, scientific model, old script/doc, configuration or Git HEAD was modified. The audit uses literal synthetic input objects, not test-player archive records. Historical verifiers/builds that could write old outputs were not run; new diagnostics and a no-emit audit typecheck/scoped lint supply the current checks.

## Exact current versions and archive

| Stamp | S1: product 4 | S2: product 5 |
| --- | --- | --- |
| Internal ID | `s4_redesigned_scenario_one` | `s5_silent_waves_redesign` |
| measurementModelVersion | `s4-cog-v3` | `s5-cognitive-v3-adapter-v1.0.0` |
| formulaVersion | `3.0.0` | `cognitive-v3-semantic-v1.0.0` |
| optionProfileVersion | `s4-options-v3.1-postfix` | `s5-option-profiles-internal-v1.0.0` |
| scenarioContentVersion | `s4-content-2026-09` | `s5-silent-waves-redesign-content-v1.0.0` |
| expertPanelVersion | `provisional-unvalidated` | `not-yet-expert-validated` |
| anchorTestVersion | `s4-anchor-first-options-v1` | absent |
| reasonModelVersion | absent | `s5-reason-model-internal-v1.0.0` |
| validityStatus | no corresponding result property | `experimental_pending_expert_and_human_validation` |

S1 stamps are in `src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts:3`; S2 stamps are in `src/ui/components/scenario/scenario-five/model/cognitive/versions.ts:1`. S1 nests them at `cognitive.versions`; S2 has top-level cognitive stamp fields. These strings are provenance labels, not empirical equivalence or psychometric validation.

The unchanged archive contract is `cross-scenario-run-v1`, source `new-completion-v1`, database `space-war.completed-cognitive-runs.v1`, store `completedRuns`. It stores the exact scenario-specific cognitive object, not the full runtime/final snapshot. The detailed reanalysis distinction is in the accompanying archive readiness report.

## Complete crosswalk and classification

`scenario-cross-phase09d2a-construct-matrix.csv` contains **39 comparison rows** covering all nine shared concepts, OSI, strengths, integration, dispersion, three-move/four-phase coordinates, signed risk, completeness and each component, timing/revisions, S1-only discipline/coalition, attribution, response flags and auxiliary timing. It records paths, types, units, bounds, exact coefficients, inclusion/gates, missing/zero/partial semantics, dependencies and live file/line anchors. Four additional inner-expression rows explicitly carry **SAME INNER ARITHMETIC ONLY**. Measured counterpart rows with different full estimators carry **DIFFERENT FULL ESTIMATOR**. Missing measured/result counterparts carry **ABSENT COUNTERPART**. No row asserts empirical equivalence.

Notation in the matrix is fully defined: S1 `WM` drops null/undefined/nonfinite values and nonpositive weights, then divides the retained weighted sum by retained weight; an empty denominator gives null (`cognitiveEngineV3.ts:29`). S2 `PB` first averages retained observations within each phase, then averages the phases that remain (`scenario-five/model/cognitive/cognitiveEngine.ts:181`). OSI overall has its stricter all-phase/all-move requirement. These are descriptions of existing estimators within each scenario, not new cross-scenario arithmetic.

### The nine shared concepts

1. **Information seeking:** both contain `.60*profile + .25*coverage + .15*diversity`, but S1 admits only two information windows and requires usable evidence metadata; S2 has seven possible windows and renormalizes when evidence components are absent. S1's single available source has diversity 1 even with no opens; S2's no-open case has diversity 0. S1's cumulative opened IDs and S2's same-window/time-bounded opens differ. Source: S1 engine `:275`, `:128`, `:135`; S2 engine `:274`.
2. **Second-order thinking:** both inner expressions are `.35*future + .25*adversary + .20*reversibility + .20*resource`. S1 weights all nine chosen core profiles equally. S2 excludes A2, requires actual-set diagnostic spread and phase-balances. Source: S1 engine `:369`; S2 engine `:221`, `:189`.
3. **Adversary modeling:** S1 uses all nine, weight 1 in communication/response/m3_coa and .55 elsewhere. S2 uses C2 and D1 only, with spread gating and phase balance. S1's constant .65 adversary loading in its threshold window still contributes; constant loading is not a gate there. Source: S1 engine `:370`, profiles `makeProfile`; S2 engine `:211` and `:189`.
4. **Escalation sensitivity:** S1 uses the same nine-window 1/.55 pattern; S2 uses only B2, D1 and D2 with its availability/spread gate. The shared label does not make higher values a success criterion. Source: S1 engine `:371`; S2 engine `:212`.
5. **Evidence-responsive updating:** both include `.60*direction + .40*magnitude`, but S1 retains stable-evidence transitions, has tolerant direction categories and change-dependent weights; S2 skips stable evidence support, uses fixed adjacent checkpoint pairs, binary nonzero-direction agreement and equal pair weights. They also use different belief targets and evidence-support estimators. Source: S1 engine `:161`; S2 `evidenceScoring.ts:7`, `:31`.
6. **Resource stewardship:** the base `.50*resource + .30*contingency + .20*reversibility` matches only internally. S1 applies a direct-cost shadow ledger initialized to 85/85/85/75 and a penalty up to .30 for resources strictly below 20%; recoveries are excluded. S2 requires all eight resource-record pairs, uses diagnostic/phase-balanced base scores and subtracts .05 for each final visible resource at or below 5 (max .10). S2 visible resource context may reflect mission/world/actor effects, without a hidden-truth scalar being read directly by the cognitive recipe. Source: S1 engine `:296`; S2 engine `:317`.
7. **Planning foresight:** shared inner coefficients `.35*contingency + .25*reversibility + .20*resource + .20*future` sit inside nine-window S1 weighting versus six-window S2 diagnostic/phase selection. Source: S1 engine `:376`; S2 engine `:225`.
8. **Multi-domain integration:** S1 uses seven domains and `H7 * min(1,sum/3.5)`; S2 uses nine domains and `H9 * sum/9`, followed by diagnostic gating. Domain sets and attenuation differ. **Only C2 can pass S2's current .1 spread gate**; see the exhaustive window results below. Source: S1 engine `:301`; S2 engine `:230`, `:329`.
9. **Decision coherence:** both outer combinations use .60 reason alignment and .40 cross-decision coherence, but S1 looks up reason dimensions and applies a three-choice move-3 rule; S2 evaluates seven weighted reason recipes, B/C/D pair matrices and at least two captured reason phases. S1's current cross-rule maximum .80 gives an upper outer bound of 92 for a non-null current-codebook result; this is not a normative threshold or claim that 92 is reachable in a real path. Source: S1 engine `:305`, profiles `:284`/`:290`; S2 engine `:344`, `reasonModel.ts:8`.

S2 reason-alignment coefficients, before the existing phase/coherence aggregation, are exactly:

| Reason ID suffix | Existing profile expression |
| --- | --- |
| mission_speed | `.45*O + .35*domainMission + .20*risk` |
| reduce_exposure | `.35*(1-risk) + .25*domainNavigation + .20*contingency + .20*reversibility` |
| preserve_resources | `.60*resource + .25*future + .15*reversibility` |
| network_continuity | `.40*domainNetwork + .25*domainLogistics + .20*S + .15*contingency` |
| information_confidence | `.60*information + .25*domainInformation + .15*reversibility` |
| limit_actor_reaction | `.40*adversary + .35*escalation + .25*reversibility` |
| preserve_reversibility | `.50*reversibility + .30*contingency + .20*future` |

The exact S1 reason-dimension mapping, its .15/.45/.35/default .80 ordered cross rules, all S2 B/C/D cross matrices, and verbatim live formula declarations are in `scenario-cross-phase09d2a-raw-inventory.json`. No coefficients were estimated or revised.

### Orientation, risk, quality and missingness

S1 raw orientation is `(S-O)/(S+O+1e-6)`; S2 uses `1e-9`. S1 normalizes against all nominal options, uses weights `.85,1,1 / .90,1,1.10 / .55,1.20,1.10` within its three moves and then equal move weights. S2 normalizes against the confirmed available set, excludes A2 and averages within A/B/C/D then across all four phases. S1 requires every core coordinate for each move; S2 can retain a phase with another available constituent. Both overall OSIs are null when a required move/phase is absent, but partial strengths may remain.

S1 flat spread is **0**; S2 flat or maximum centered spread below `1e-9` is **null**. S1 normalizes any strictly positive spread, including `1e-12`. S2's .1 threshold is for scalar `scoreMetric` diagnosticity, not the signed relative OSI/risk gate. Strengths use different pools/weights. Both positive-denominator integrations use `2*O*S/(O+S)`, but `(0,0)` yields 0 in S1 and null in S2. S1 dispersion requires all three moves; S2 needs at least two available phases and may coexist with null overall OSI.

Risk stays signed [-1,+1]: S1 uses all nine core windows, S2 only B2/C2/D1/D2. There is no risk percentage or new reference scale in this audit. S1-only coalition uses its existing internal `50*(relativeCoalition+1)`; S2 has no measured coalition counterpart. S1 discipline is `100*mean(clamp(1-.70*overclaim-.30*overDisclosure))` over three eligible context windows; S2 discipline is intentionally unmeasured null.

Both completeness formulas use `.50/.15/.15/.10/.10`, but S1 expects 9 core records/3 estimates and S2 8 decisions/4 beliefs with different validation predicates; S2 clamps the overall value. Empty evidence reference arrays can satisfy S2 reference consistency; this is not evidence engagement. Synthetic singleton choices can therefore have 80% coverage while cognitive metrics remain null. Coverage is not performance.

Median/IQR share interpolated quantile arithmetic but not input filtering/pools. Revision totals count different source records. Evidence-triggered revision rates have different denominators and clock rules: S1 requires an existing revision to enter its denominator; S2 requires an evidence open strictly between first selection and confirmation and can return a measured 0 without a revision. Both return null when their own denominator is empty. S1 also stores dwell totals, first/final changes and optional extreme decisions; S2 does not store those counterparts.

These bounds and null rules concern valid source inputs. S1's engine is not a complete nested raw-input validator; malformed IDs or nonfinite telemetry can throw or propagate invalid outputs. S2 rejects duplicate/unknown windows, unavailable final selections and invalid timestamps before its normal result calculation, but the typed input contract still matters. The separate archive validator has stricter output/schema/stamp rules; an empty/partial synthetic engine input is not an eligible completed archived run.

## Exhaustive profile and eligibility diagnostics

Current counts are **41 S1 profiles in 9 core windows** (4/4/5/5/5/6/3/5/4) and **33 S2 profiles in 8 windows** (4/4/4/4/4/4/5/4). All 74 entries are preserved in the raw inventory. The primary diagnostics CSV has 30 rows: the ten exactly shared atomic field names in both scenarios plus five same-named domain mappings in their different vector representations. Each reports min/max, unweighted entry mean, population SD (divisor N), unique values, nominal window presence and explicitly qualified potential scoring-window counts. Counts exclude the separate reason-alignment reuse where stated.

**These are codebook statistics, not player distributions, norms or expected behavior.** Every option entry has equal weight for this descriptive table; windows with more options contribute more entries. This is not even an equal-window response model. No observed participants or empirical score distributions were used.

S1's UI can disable unaffordable choices, but relative OSI/risk/coalition calculations still use the fixed whole window codebook. S2 snapshots the actually available action IDs at confirmation after resource, current-round, active-convoy/fixed-alpha filtering; target validity is checked separately. Thus selection constraints can change both S2's relative origin and which scalar observations pass diagnosticity. Live anchors: S1 component `:829`, resource projection `resourceEngineV2.ts:142`; S2 runtime `:135` and `:353`, mission selectors `:24`.

`scenario-cross-phase09d2a-window-diagnostics.csv` enumerates 153 construct/window relationships. For S2 MCI, full nominal spreads are B1 **0.091556**, B2 **0.096958**, C2 **0.128718**, D1 **0.091074** (rounded here only; raw values are in CSV). A subset cannot have greater max-minus-min spread than the whole set. Therefore only C2 can ever pass .1 with these current profile values; further dynamic filtering can also remove C2 diagnosticity. This is a mathematical property of the codebook/gate, not a finding about humans.

`scenario-cross-phase09d2a-recipe-support-bounds.csv` gives 14 per-scenario current-recipe outer support bounds. For example, non-null S2 MCI can only use the C2 profile support, approximately **19.2634..32.1352**; S1's profile support outer envelope is approximately **31.3007..99.5892**. These are convex-support guarantees, not jointly attainable complete-path extrema and not a proposed transformation. The matrix distinguishes formula bounds, codebook outer bounds and **NOT DETERMINABLE** legal full-run joint extrema, since resources/targets/evidence couple choices across states. No state-path search or empirical range inference is substituted for that missing evidence.

## Anchors, tests and identifiability limits

The inspected nine S1 and eight S2 core questions share **zero exact question strings**, and the 41/33 core option title sets and response ID sets have **zero exact shared members**. No implemented shared cross-scenario anchor item/task/response linkage was found in the active catalogs. S1's `s4-anchor-first-options-v1` is a within-S1 deterministic regression fixture (`scripts/validate-s4-cognitive-v3.mjs:163`), not a respondent anchor administered in both scenarios. This absence does not decide whether a future human-designed study is possible; source alone supplies no empirical linking observations.

The audit passes **202 deterministic assertions**: profile/window counts, all signed codebook coordinates' bounds/nulls, flat/sub-epsilon behavior, zero/null integration, partial moves/phases, required stewardship resources, exact depletion boundaries, stable-evidence updating, revision-opportunity distinctions, source output bounds, missing-scenario display, a full-vector raw-input non-identifiability witness and zero storage access attempts. Two minimal current-source examples are decisive against equating inner coefficients with full-score equality:

- Same selected information loading .9, the existing .60/.25/.15 coefficients, one available source and none opened: S1's existing function returns **69**, S2's **54**, because diversity semantics differ. These are synthetic partial inputs, not paired people or a comparison score.
- Same second-order inner coefficient vector: S1's investigation decision is included and the selected current profile returns **58.25** on a minimal partial input; S2's A2 information-acquisition decision is excluded and returns **null** for second-order output. There is no common number to average.

All tests are **non-human mechanical diagnostics, not psychometric validation**. Framework contents, installed archive counts, human response covariance/reliability/invariance, actual common-subject study pairs, participant-level exposure/visit metadata and legal full-path joint score extrema remain **NOT DETERMINABLE** where explicitly identified. No calibration method, sample size or fused formula is proposed. The final verification/manifest provide the source guards and artifact paths. Stop at 09D-2A.
