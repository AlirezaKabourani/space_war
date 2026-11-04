# Phase 09C-0 — active S5 cognitive contract (source audit only)

Status: source extraction, after completed 08D.2. No scoring, version, UI, test or runtime changes were made for this audit. Player-facing Scenario 2 is released object id=5, internal `s5_silent_waves_redesign`.

## Contract and path conventions

`src/ui/components/scenario/scenario-five/model/cognitive/types.ts:143` exports `Scenario5CognitiveRunResult`; `DataCompletenessResult` and `TelemetrySummaryResult` immediately precede it. The runtime wrapper is `model/runtime/types.ts:238`, `Scenario5RuntimeResult.cognitive`. In this document and CSV, **`result.cognitive` is the actual runtime-result path**, not a proposed interface. The summary destructures the same object into the lexical alias `cognitive` (`ScenarioFiveSummary.tsx:59`). `orientation.phaseScores` is a four-element tuple in A/B/C/D order: JS paths are `[0]`, `[1]`, `[2]`, `[3]`; phase names are inventory labels, not object properties.

Coverage is **40 scalar leaves**: 9 identity/version/validity fields, 6 completeness fields, 9 orientation fields (including four tuple elements), 11 construct properties, 5 descriptive telemetry fields. The 11 construct properties contain nine measured 0–100 constructs, one signed risk posture and one always-null information-discipline property. Raw telemetry is inventoried separately and is not counted as extra result metrics.

`model/runtime/domainMetrics.ts:253` (`calculateScenario5RuntimeResult`; see exact source extract below) requires runtime stage `complete`, builds the public telemetry bundle, validates it, and returns separate `cognitive`, `domain`, and `missionEndState` members. `calculateScenario5CognitiveRunResult` (`cognitiveEngine.ts:421`) validates again and assembles the result. This separation does not make mission correctness a cognitive score.

## Current rendering and caveats

The initial post-mission screen is `ScenarioFiveMissionEnding`. It does not render these cognitive metrics. The existing compatibility report is opened by `onCognitiveEntry` in `ScenarioFiveSummary.tsx:63`. Its cognitive section at lines 175–193 renders all 31 metric leaves: completeness percentages, orientation values, phase tuple, all constructs and telemetry summary. The nine metadata values are available on the result but are not rendered there as their actual field values. A static experimental-model warning is not a rendering of the `validityStatus` field.

`valueOrUnavailable` (`ScenarioFiveSummary.tsx:23`) renders null as «در این اجرا قابل اندازه‌گیری نبود»; numbers use two decimals. Completeness uses literal `%`; median/IQR use **milliseconds**, revision rate `%`. `informationDiscipline` has the distinct message «در نسخه فعلی این سناریو اندازه‌گیری نمی‌شود.» Signed risk is not rescaled to 0–100 in this report; its existing note says the sign describes relative choices, without good/bad valuation. `overall < 100` triggers the existing incomplete-data caveat. Zero is a measured value and is not the missing-data sentinel.

Version strings come from `model/cognitive/versions.ts:1–7` and are reproduced exactly in the extracted table below. `expertPanelVersion` is `not-yet-expert-validated`; `validityStatus` is `experimental_pending_expert_and_human_validation`. These are current model metadata, not claims of psychometric validation.

## Faithful formula transcription

All references in this section are to `model/cognitive/cognitiveEngine.ts` unless specified. These describe existing calculations; no alternatives, interpretations or thresholds are proposed.

* Lines 143–179: a score-eligible decision has a non-null selected action included in the available actions, all available profile IDs known, and at least two distinct available actions. `EPSILON=1e-9`. Raw orientation is `(strategicLoading-operationalLoading)/(strategicLoading+operationalLoading+EPSILON)`. Relative adjustment subtracts the mean of **available** option values and divides by the greatest absolute centered value. A denominator below EPSILON returns null; otherwise the selected value is clamped to [-1,1]. Risk uses that same adjustment on `riskExposure`.
* Lines 181–200: `phaseBalanced` averages available observations within each phase, then averages the available phase means. An empty input returns null. `scoreMetric` retains only its configured windows and decisions with option-profile spread `max-min+EPSILON >= .1`, computes the selected profile metric, phase-balances it, then returns `100*clamp(value,0,1)`. This generic operation does not require all four phases.
* Lines 202–219: OSI uses A1/B1/B2/C1/C2/D1/D2. **A2 evidence acquisition is excluded from OSI and operational/strategic loadings**, but is present in information seeking and all-eight-window resource scoring/completeness/telemetry. Information seeking uses A1/A2/B1/B2/C1/C2/D1, not D2. Second-order uses the OSI window set; adversary uses C2/D1; escalation uses B2/D1/D2; planning uses A1/B2/C1/C2/D1/D2; multi-domain uses B1/B2/C2/D1; risk uses B2/C2/D1/D2.
* Lines 244–271: each phase OSI is the mean of available adjusted orientation observations in that phase, or null. Overall OSI requires **all four phase values**, then takes their equal mean. Strengths are 100 times phase-balanced selected operational/strategic loadings from eligible OSI windows; they can exist with partial phases even when overall OSI is null. Integration (`calculateIntegration`, line 238) is `2*O*S/(O+S)` clamped to [0,100]; null input or zero denominator returns null. Dispersion is population SD of available phase OSIs with at least two phases, otherwise null; its mathematical range is [0,1]. No dispersion label or marker-percent property is exported by S5.
* Lines 221–226: second-order profile metric is `.35*futureConsequenceThinking + .25*adversaryModeling + .2*reversibilityPreference + .2*resourceStewardship`. Stewardship is `.5*resourceStewardship + .3*contingencyPlanning + .2*reversibilityPreference`. Planning is `.35*contingencyPlanning + .25*reversibilityPreference + .2*resourceStewardship + .2*futureConsequenceThinking`. Each uses the windows and eligibility described above.
* Lines 274–314: information seeking combines selected profile seeking (.6), fraction of relevant evidence IDs opened (.25), and source diversity (.15). Relevant evidence must list this window and be available no later than confirmation. An opening must belong to this window and occur between entered/confirmed times, inclusive. Relevant evidence absent means the latter two components are omitted and weights renormalized; a non-diagnostic profile with no relevant evidence skips that decision. Diversity is entropy of opened evidence source counts divided by log of available source-type count. One available source and at least one opening gives diversity 1; no openings gives 0. Phase-balanced weighted values are multiplied by 100. There is no minimum dwell-time gate in this calculation.
* Lines 317–327: stewardship requires exactly eight decisions and before/after resource telemetry for every expected window. Its base is `scoreMetric` over all eight windows. Final D2 ISR<=5 subtracts .05, support<=5 subtracts .05, from base/100 before clamping and multiplying by 100. This reads player-visible resources, not hidden world state.
* Lines 227–236, 329–332: multi-domain profile calculation uses nine domain values (missing profile keys become 0): mission, information, navigation, logistics, resources, civilian, escalation, futureOptions, network. Let T be their sum, H normalized Shannon entropy using log(9); return clamp(H*T/9,0,1), or null when T<=EPSILON. The scoring wrapper substitutes profile null with 0 before diagnostic gating and phase-balancing.
* Lines 334–342: signed risk is phase-balanced adjusted risk over its four windows, clamped [-1,1], or null if no observations.
* Lines 344–363: coherence uses B/C/D phases with a reason captured before outcome, both selected actions, and a non-null cross-decision table result. Within each phase, reason alignment is the mean for its two actions. At least two eligible phases are required. Result is `100*clamp(.6*mean(reasonAlignments)+.4*mean(crossValues),0,1)`. Reason-alignment functions and cross-decision matrices are existing `reasonModel.ts` code; no per-decision explanation trace is returned.
* Lines 365–389: completeness components are percentages: valid decisions/8, decisions with all five finite nonnegative timing fields and nondecreasing confirmation time/8, decisions whose available/opened evidence links are valid/8, valid belief checkpoints/4, valid pre-outcome reasons/3. Overall is `clamp(.5*decisions+.15*timing+.15*evidence+.1*estimates+.1*reasons,0,100)`. Empty available/opened evidence arrays satisfy their `.every` checks. A 0 component is a real percentage. Overall completeness does not globally replace scores with null or gate them at a chosen threshold.
* Lines 391–419: active times retain finite nonnegative values and are sorted. Quantile uses linear interpolation at `(n-1)*p`. Median=q(.5), IQR=q(.75)-q(.25); no valid time gives null, one valid time gives IQR 0. `totalRevisions` sums counts; `revisedWindows` counts decisions with count>0. Evidence-revision opportunities require an opening in the same window strictly after first selection and strictly before confirmation. Triggered opportunities have non-null first action different from final. Rate=100*triggered/opportunities, null if no opportunities. This temporal association does not encode causal attribution.

Evidence responsive updating is in `model/cognitive/evidenceScoring.ts:7–52`. Visible evidence strengths are weak=.25, moderate=.6, strong=.9; directions targeted=1, ambiguous=0, nonhostile=-1. For each visible (corridor,source) pair, keep the item with greatest absolute signed strength (ties keep first). For each corridor take signed source mean, map to clamp(.5+.5*mean,0,1), then take the maximum corridor support. No corridor gives .5. For adjacent checkpoint pairs A2_prebelief→A2_postbelief→C_belief_checkpoint→D_final_belief, require both records and nonzero evidence-support change. Belief delta is change in targetedInterferenceEstimate/100. Direction agreement is 1 only for matching nonzero belief/evidence directions. Magnitude alignment is `1-min(abs(beliefDelta-evidenceDelta)/.5,1)`. Pair score=.6*direction+.4*magnitude; exported ERU=100*mean(pair scores), null if no informative pairs. Only checkpoint-visible IDs are read, not hidden cause or correctness. Confidence/corridor selections are stored but are not the belief-delta operands in this ERU formula.

## Validation, raw telemetry and truth boundary

`validateScenario5CognitiveTelemetry` (`cognitiveEngine.ts:59–138`) checks the scenario literal, duplicate evidence/window/checkpoint/reason-phase records, exact decision phase/round mapping, known windows/checkpoints/reason IDs/action IDs, final-action availability, evidence-ID links, finite nonnegative recorded clocks and specific confirmation/open ordering, and numeric belief/revision bounds. It does not generally validate all possible runtime facts: e.g. source enums/resource ranges rely on the typed adapter, and reason-phase values rely on the TypeScript type/runtime capture rather than a separate phase-enum check in this validator. It rejects malformed values covered by those checks. Null timestamps/choices represent permitted missing values; malformed non-null values cause errors rather than fabricated zero scores. The adapter exposes only public evidence fields and player action/timing/belief/reason data.

`model/runtime/telemetryAdapter.ts:16–28` explicitly copies evidenceId, sourceType, observedCorridorId, direction, strengthBand, relevantWindowIds, availableAtMs, qualityLabelVisible and limitationVisible. It does **not** copy hidden provenance. `WINDOWS_AFTER_RELEASE` at lines 6–14 makes evidence released after R8 relevant to no earlier window. At lines 42–56, `buildScenario5CognitiveTelemetryBundle` whitelists run/timestamps and decisions/evidence/evidenceOpens/beliefs/reasons; it does not pass `trueWorldState` or actor state.

Raw records exist on `runtimeState.decisions`, `.evidence`, `.evidenceOpens`, `.beliefs`, `.reasons` (and as same-named arrays in the adapter bundle); the CSV inventories their declared properties separately. Four checkpoint IDs and eight window IDs are explicit types. Open duration/closure can be null. Belief numeric fields are non-null on recorded entries (0–100), while the record itself can be absent before submission. A blank local form value is not a recorded belief value. B/C/D reasons record `capturedBeforeOutcome`. Availability of a property type does not assert every run has every record.

After completion these public telemetry records are present for the current run, alongside the cognitive result. They contain no hidden-truth dependency. Existing post-game AAR and mission-domain output additionally read truth: e.g. `domain.gnssPntAssessment` compares the chosen corridor to `trueWorldState.primaryAffectedCorridorId`, whereas cognitive ERU compares belief movement to visible evidence support. `missionEndState`, actor delay attribution, truth revelation and mission correctness are separate sources. `buildScenario5AarView` (`ui/presentation.ts:299`) guards the complete stage before exposing its post-game view. Screenshots in this audit do not expose raw hidden fields.

## Explicitly not available in the S5 result

* Stored/exported per-decision cognitive-contribution array: **NOT_AVAILABLE**. Pure helpers `adjustedOrientationForDecision` and `adjustedRiskForDecision` are exported, and option profiles/raw telemetry exist; these are not a stored returned contribution trace. This audit does not reconstruct one.
* `coalitionOrientation`, `markerPercent`, `dispersionLabel`, `responseProcess`, `missingReasons`, `perWindow`, `totalEvidenceDwellMs`, longest/shortest decision summaries: **NOT_AVAILABLE as S5 result properties**. Raw individual evidence dwell/timing records remain available as typed telemetry. No replacement aggregates are invented here.
* Information-discipline numeric measurement: **NOT_AVAILABLE**; the actual exported property exists with literal type/value null.

The tables appended below are mechanically extracted from the current TypeScript declarations and current rendering sources. Source locations identify the actual files, symbols and nearby lines.

## Extracted 40-field result map

| Exact runtime path | Visible label / metadata name | TS type | Range | Nullable when | Source/symbol; declaration |
| --- | --- | --- | --- | --- | --- |
| result.cognitive.scenarioId | scenarioId | "s5_silent_waves_redesign" | literal s5_silent_waves_redesign | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:144; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.runId | runId | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:145; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.measurementModelVersion | measurementModelVersion | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:143; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.formulaVersion | formulaVersion | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:147; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.optionProfileVersion | optionProfileVersion | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:148; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.scenarioContentVersion | scenarioContentVersion | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:149; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.reasonModelVersion | reasonModelVersion | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:150; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.expertPanelVersion | expertPanelVersion | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:151; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.validityStatus | validityStatus | string | string | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:152; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; metadata, not a scalar score |
| result.cognitive.dataCompleteness.overall | کل | number | 0..100 % | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateDataCompleteness:365; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:127; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.dataCompleteness.decisions | تصمیم‌ها | number | 0..100 % | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateDataCompleteness:365; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:128; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.dataCompleteness.timing | زمان | number | 0..100 % | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateDataCompleteness:365; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:129; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.dataCompleteness.evidence | شواهد | number | 0..100 % | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateDataCompleteness:365; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:130; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.dataCompleteness.estimates | برآوردها | number | 0..100 % | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateDataCompleteness:365; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:131; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.dataCompleteness.reasons | دلیل‌ها | number | 0..100 % | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateDataCompleteness:365; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:132; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.orientation.overall | OSI کل | number \| null | -1..1 | Any A/B/C/D phase OSI null | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:155; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.orientation.operationalStrength | عملیاتی | number \| null | 0..100 | No eligible OSI-window raw-loading observations | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:156; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.orientation.strategicStrength | راهبردی | number \| null | 0..100 | No eligible OSI-window raw-loading observations | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:157; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.orientation.integration | یکپارچگی | number \| null | 0..100 | Either strength null or strength sum equals 0 | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:158; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.orientation.dispersion | پراکندگی | number \| null | 0..1 (population SD of signed phase values) | Fewer than 2 non-null phase OSIs | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:159; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.orientation.phaseScores[0] | فاز A | number \| null | -1..1 | No eligible non-degenerate OSI observation in this phase | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:160; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0; tuple indices A/B/C/D |
| result.cognitive.orientation.phaseScores[1] | فاز B | number \| null | -1..1 | No eligible non-degenerate OSI observation in this phase | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:160; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0; tuple indices A/B/C/D |
| result.cognitive.orientation.phaseScores[2] | فاز C | number \| null | -1..1 | No eligible non-degenerate OSI observation in this phase | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:160; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0; tuple indices A/B/C/D |
| result.cognitive.orientation.phaseScores[3] | فاز D | number \| null | -1..1 | No eligible non-degenerate OSI observation in this phase | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — orientationResult:244; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:160; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0; tuple indices A/B/C/D |
| result.cognitive.constructs.informationSeeking | جست‌وجوی اطلاعات | number \| null | 0..100 | No eligible information-seeking observations after configured-window/relevance/diagnostic gates | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — informationSeeking:274; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:163; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.secondOrderThinking | تفکر مرحله دوم | number \| null | 0..100 | No diagnostic eligible SECOND_ORDER_WINDOWS observations | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — scoreMetric:189; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:164; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.adversaryModeling | مدل‌سازی طرف مقابل | number \| null | 0..100 | No diagnostic eligible C2/D1 observations | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — scoreMetric:189; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:165; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.escalationSensitivity | حساسیت به تشدید | number \| null | 0..100 | No diagnostic eligible B2/D1/D2 observations | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — scoreMetric:189; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:166; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.informationDiscipline | نظم اطلاعاتی | null | null | Always null by current exported type and return statement | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateScenario5CognitiveRunResult:421; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:167; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0; dedicated unmeasured message |
| result.cognitive.constructs.evidenceResponsiveUpdating | به‌روزرسانی متناسب با شواهد | number \| null | 0..100 | No adjacent recorded checkpoint pair with nonzero visible-evidence support delta | src/ui/components/scenario/scenario-five/model/cognitive/evidenceScoring.ts — calculateEvidenceResponsiveUpdating:31; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:168; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.resourceStewardship | نگهداشت و تخصیص منابع | number \| null | 0..100 | Not exactly 8 decisions or any expected before/after resources missing or base score null | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — resourceStewardship:317; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:169; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.planningForesight | برنامه‌ریزی و آینده‌نگری | number \| null | 0..100 | No diagnostic eligible PLANNING_WINDOWS observations | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — scoreMetric:189; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:170; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.multiDomainIntegration | یکپارچه‌سازی چندمعیاره | number \| null | 0..100 | No diagnostic eligible MCI_WINDOWS observations | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — multiDomainIntegration:329; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:171; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.constructs.riskPosture | وضعیت نسبی پذیرش ریسک | number \| null | -1..1 | No eligible non-degenerate adjusted-risk observations in RISK_WINDOWS | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — riskPosture:334; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:172; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0; signed value, not rescaled |
| result.cognitive.constructs.decisionCoherence | انسجام تصمیم | number \| null | 0..100 | Fewer than 2 eligible B/C/D phases with reason and action pair/cross rule | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — decisionCoherence:344; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:173; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.telemetrySummary.medianActiveDecisionMs | میانه زمان فعال | number \| null | finite >=0 ms | No finite nonnegative activeDecisionMs values | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateTelemetrySummary:398; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:136; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.telemetrySummary.iqrActiveDecisionMs | IQR | number \| null | finite >=0 ms | No finite nonnegative activeDecisionMs values; one valid value gives 0 | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateTelemetrySummary:398; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:137; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.telemetrySummary.totalRevisions | بازنگری کل | number | integer >=0 | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateTelemetrySummary:398; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:138; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.telemetrySummary.revisedWindows | پنجره‌های بازنگری‌شده | number | integer 0..8 (validated bundle) | Never null; absent record is represented through completeness count | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateTelemetrySummary:398; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:139; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |
| result.cognitive.telemetrySummary.evidenceTriggeredRevisionRate | نرخ بازنگری پس از شواهد | number \| null | 0..100 % | No same-window evidence-open opportunity strictly between first selection and confirmation | src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts — calculateTelemetrySummary:398; Declaration src/ui/components/scenario/scenario-five/model/cognitive/types.ts:140; return src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421; ScenarioFiveSummary.tsx:175-193; null distinct from 0 |

## Exact current version declarations

Source: `src/ui/components/scenario/scenario-five/model/cognitive/versions.ts:1`.

```ts
export const S5_COGNITIVE_MEASUREMENT_MODEL_VERSION = "s5-cognitive-v3-adapter-v1.0.0";
export const S5_COGNITIVE_FORMULA_VERSION = "cognitive-v3-semantic-v1.0.0";
export const S5_OPTION_PROFILE_VERSION = "s5-option-profiles-internal-v1.0.0";
export const S5_REASON_MODEL_VERSION = "s5-reason-model-internal-v1.0.0";
export const S5_SCENARIO_CONTENT_VERSION = "s5-silent-waves-redesign-content-v1.0.0";
export const S5_EXPERT_PANEL_VERSION = "not-yet-expert-validated";
export const S5_VALIDITY_STATUS = "experimental_pending_expert_and_human_validation";
```

## Raw telemetry declarations (separate from result metrics)

`i` and `j` in the CSV mean actual collection indices; they are not extra stored property names. `bundle` is the adapter return object. This source extract retains the exact nullable types.

```ts
// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:32
export interface SelectionTelemetry {
  readonly actionId: MissionActionId;
  readonly selectedAtMs: number;
}

// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:37
export interface VisibleResourceTelemetry {
  readonly isrCapacity: number;
  readonly supportReserve: number;
}

// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:42
export interface DecisionTelemetry {
  readonly phaseId: PhaseId;
  readonly roundId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly windowId: CognitiveWindowId;
  readonly availableActionIds: readonly MissionActionId[];
  readonly firstSelectedActionId: MissionActionId | null;
  readonly finalSelectedActionId: MissionActionId | null;
  readonly selectionHistory: readonly SelectionTelemetry[];
  readonly enteredAtMs: number | null;
  readonly confirmedAtMs: number | null;
  readonly elapsedMs: number | null;
  readonly activeDecisionMs: number | null;
  readonly hiddenTabMs: number | null;
  readonly revisionCount: number;
  readonly availableEvidenceIds: readonly string[];
  readonly openedEvidenceIds: readonly string[];
  readonly playerVisibleResourcesBefore: VisibleResourceTelemetry | null;
  readonly playerVisibleResourcesAfter: VisibleResourceTelemetry | null;
}

// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:62
export interface EvidenceTelemetry {
  readonly evidenceId: string;
  readonly sourceType: EvidenceSourceType;
  readonly observedCorridorId: CorridorId | null;
  readonly direction: EvidenceDirection;
  readonly strengthBand: EvidenceStrengthBand;
  readonly relevantWindowIds: readonly CognitiveWindowId[];
  readonly availableAtMs: number;
  readonly qualityLabelVisible: string;
  readonly limitationVisible: string;
}

// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:74
export interface EvidenceOpenTelemetry {
  readonly evidenceId: string;
  readonly windowId: CognitiveWindowId;
  readonly openedAtMs: number;
  readonly closedAtMs: number | null;
  readonly activeDwellMs: number | null;
}

// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:82
export interface BeliefTelemetry {
  readonly checkpointId: BeliefCheckpointId;
  readonly recordedAtMs: number;
  readonly mostLikelyCorridorId: CorridorId;
  readonly corridorConfidence: number;
  readonly targetedInterferenceEstimate: number;
  readonly targetedInterferenceConfidence: number;
  readonly visibleEvidenceIdsAtCheckpoint: readonly string[];
}

// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:92
export interface ReasonTelemetry {
  readonly phaseId: "B" | "C" | "D";
  readonly reasonId: ReasonId;
  readonly recordedAtMs: number;
  readonly capturedBeforeOutcome: boolean;
}

// src/ui/components/scenario/scenario-five/model/cognitive/types.ts:99
export interface Scenario5CognitiveTelemetryBundle {
  readonly scenarioId: "s5_silent_waves_redesign";
  readonly runId: string;
  readonly startedAtMs: number | null;
  readonly completedAtMs: number | null;
  readonly decisions: readonly DecisionTelemetry[];
  readonly evidence: readonly EvidenceTelemetry[];
  readonly evidenceOpens: readonly EvidenceOpenTelemetry[];
  readonly beliefs: readonly BeliefTelemetry[];
  readonly reasons: readonly ReasonTelemetry[];
}
```

## Actual runtime completion assembly

`src/ui/components/scenario/scenario-five/model/runtime/domainMetrics.ts:253`

```ts
export function calculateScenario5RuntimeResult(state: Scenario5RuntimeState): Scenario5RuntimeResult {
  if (state.stage.stageId !== "complete") throw new Error("Runtime result requires a complete runtime");
  const bundle = buildScenario5CognitiveTelemetryBundle(state);
  validateScenario5CognitiveTelemetry(bundle);
  return {
    runId: state.runId,
    runtimeModelVersion: S5_RUNTIME_MODEL_VERSION,
    missionModelVersion: state.missionState.missionModelVersion,
    cognitiveMeasurementModelVersion: S5_COGNITIVE_MEASUREMENT_MODEL_VERSION,
    domainMetricsVersion: S5_DOMAIN_METRICS_VERSION,
    missionEndState: resolveMissionEndState(state.missionState),
    cognitive: calculateScenario5CognitiveRunResult(bundle),
    domain: calculateScenario5DomainMetrics(state),
  };
}
```

## Literal reason/cross-decision model

The coherence aggregate invokes these existing functions and matrices. Source: `src/ui/components/scenario/scenario-five/model/cognitive/reasonModel.ts:1`.

```ts
import type { MissionActionId } from "../mission/types";
import { getScenario5OptionProfile } from "./optionProfiles";
import type { OptionCognitiveProfile, ReasonId } from "./types";

const domain = (profile: OptionCognitiveProfile, key: keyof OptionCognitiveProfile["domainSalience"]): number =>
  profile.domainSalience[key] ?? 0;

export function calculateReasonAlignment(actionId: MissionActionId, reasonId: ReasonId): number {
  const item = getScenario5OptionProfile(actionId);
  switch (reasonId) {
    case "reason_mission_speed":
      return 0.45 * item.operationalLoading + 0.35 * domain(item, "mission") + 0.2 * item.riskExposure;
    case "reason_reduce_exposure":
      return 0.35 * (1 - item.riskExposure) + 0.25 * domain(item, "navigation")
        + 0.2 * item.contingencyPlanning + 0.2 * item.reversibilityPreference;
    case "reason_preserve_resources":
      return 0.6 * item.resourceStewardship + 0.25 * item.futureConsequenceThinking + 0.15 * item.reversibilityPreference;
    case "reason_network_continuity":
      return 0.4 * domain(item, "network") + 0.25 * domain(item, "logistics")
        + 0.2 * item.strategicLoading + 0.15 * item.contingencyPlanning;
    case "reason_information_confidence":
      return 0.6 * item.informationSeeking + 0.25 * domain(item, "information") + 0.15 * item.reversibilityPreference;
    case "reason_limit_actor_reaction":
      return 0.4 * item.adversaryModeling + 0.35 * item.escalationSensitivity + 0.25 * item.reversibilityPreference;
    case "reason_preserve_reversibility":
      return 0.5 * item.reversibilityPreference + 0.3 * item.contingencyPlanning + 0.2 * item.futureConsequenceThinking;
  }
}

const B_MATRIX: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  b1_suspect_focus: { b2_continue_crosscheck: 1, b2_reroute: .75, b2_staged_checkpoints: .75, b2_hold_verify: 1 },
  b1_priority_cargo: { b2_continue_crosscheck: .75, b2_reroute: .75, b2_staged_checkpoints: .5, b2_hold_verify: .5 },
  b1_split_attention: { b2_continue_crosscheck: .75, b2_reroute: .5, b2_staged_checkpoints: 1, b2_hold_verify: .75 },
  b1_pulse_network: { b2_continue_crosscheck: 1, b2_reroute: .5, b2_staged_checkpoints: .75, b2_hold_verify: .75 },
};
const C_MATRIX: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  c1_fallback_nav: { c2_isr_heavy: .5, c2_mobility_heavy: 1, c2_balanced: 1, c2_priority_surge: .75 },
  c1_ground_recon: { c2_isr_heavy: 1, c2_mobility_heavy: .75, c2_balanced: 1, c2_priority_surge: .5 },
  c1_checkpoint_spacing: { c2_isr_heavy: .5, c2_mobility_heavy: 1, c2_balanced: 1, c2_priority_surge: .5 },
  c1_preserve_mobile_reserve: { c2_isr_heavy: .75, c2_mobility_heavy: .5, c2_balanced: 1, c2_priority_surge: .25 },
};
const D_MATRIX: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  d1_emergency_reroute: { d2_critical_delivery_surge: .75, d2_network_balanced_finish: .75, d2_resilient_handoff: 1, d2_continuity_first_finish: .75 },
  d1_ground_containment: { d2_critical_delivery_surge: .75, d2_network_balanced_finish: 1, d2_resilient_handoff: .5, d2_continuity_first_finish: .75 },
  d1_deception_routing: { d2_critical_delivery_surge: .5, d2_network_balanced_finish: .75, d2_resilient_handoff: .75, d2_continuity_first_finish: 1 },
  d1_escorted_continuation: { d2_critical_delivery_surge: 1, d2_network_balanced_finish: .75, d2_resilient_handoff: .5, d2_continuity_first_finish: .5 },
  d1_hold_confirm: { d2_critical_delivery_surge: .5, d2_network_balanced_finish: .75, d2_resilient_handoff: 1, d2_continuity_first_finish: .75 },
};

export function getCrossDecisionCoherence(
  phaseId: "B" | "C" | "D",
  firstActionId: MissionActionId,
  secondActionId: MissionActionId,
): number | null {
  const matrix = phaseId === "B" ? B_MATRIX : phaseId === "C" ? C_MATRIX : D_MATRIX;
  return matrix[firstActionId]?.[secondActionId] ?? null;
}

export const CROSS_DECISION_COHERENCE_MATRICES = { B: B_MATRIX, C: C_MATRIX, D: D_MATRIX } as const;
```
