# Indices and formulas — شاخص‌ها و فرمول‌های پیاده‌سازی‌شده

خلاصه فارسی: شاخص‌های این سامانه از انتخاب‌های کدگذاری‌شده، زمان تعامل، شواهد مشاهده‌شده و وضعیت مأموریت محاسبه می‌شوند. این شاخص‌ها برای تحلیل درون‌شبیه‌ساز مناسب‌اند، اما بدون مطالعه انسانی و اعتبارسنجی روان‌سنجی نباید «آزمون شناختی معتبر» نامیده شوند.

## Interpretation warning

All “cognitive” variables below are **behavioral/cognitive proxies derived from coded option profiles and interaction telemetry**. They are not validated psychological scales. S4 explicitly marks its expert panel `provisional-unvalidated` (`scenario-four/model/cognitiveOptionProfilesV3.ts:3-8`); S5 states `not-yet-expert-validated` and `experimental_pending_expert_and_human_validation` (`scenario-five/model/cognitive/versions.ts:1-7`).

Notation: `clamp(x,a,b)` bounds a value; omitted bounds are normally 0–100 or 0–1 according to the source. `mean` is arithmetic mean. Most option-profile inputs are authored constants, not learned parameters.

## Cross-scenario administrative behavioral analytics

Implemented by `buildCognitiveInsights` in `src/App.tsx:710-980` from quiz and concept-lab events.

| Index | Exact implementation | Range/threshold and limitation |
|---|---|---|
| `overallAccuracy` | `round(100 × correct scored events / all scored events)` (`:723-725`) | 0–100; mixes quiz and minigame items of unequal content/difficulty. |
| `decisionSpeedSec` | `round(mean(responseTimeMs or elapsedMs) / 1000)` (`:727-736`) | Positive seconds; zero means no data, not instant decision. |
| `hesitationRate` | `round(100 × (hesitantNodes + changedMiniGameCards + explanationOpens) / max(scoredEvents,1))` (`:886-893`) | May exceed a pure respondent proportion because heterogeneous counts are added. |
| `answerChangeRate` | `round(100 × (changedAnswerNodes + changedMiniGameCards) / max(scoredEvents,1))` (`:894-896`) | Event-derived heuristic. |
| `successfulRevisionRate` | `round(100 × successfulRevisions/revisionCount)` (`:897`) | Quiz-node revisions only; 0 when no revisions. |
| `referenceUsageRate` | `round(100 × (referenceUsedNodes + explanationOpens)/max(scoredEvents,1))` (`:898-900`) | “Example node entered” also counts as reference use (`:856-861`). |
| `unfinishedExitRate` | `round(100 × scenario_exit/scenario_start)` (`:871-872,901`) | Can be distorted by incomplete/missing lifecycle logs. |
| `guidanceBenefitScore` | `clamp(accuracyWithExplanation − accuracyWithoutExplanation, -100,100)` (`:778-789`) | Observational selection effect, not causal treatment effect; 0 if either group empty. |
| `overconfidenceErrorRate` | Wrong, no explanation, no answer change divided by all minigame items (`:790-799`) | “Overconfidence” is inferred without a confidence question. |
| `productiveHesitationRate` | Correct among items with explanation or answer change (`:800-810`) | Behavioral label only. |
| `conceptFrictionScore` | `clamp(round(.35×wrongRate + .25×explanationUsage + .20×min(100,avgResponseMs/100) + .20×min(100,changeRate)),0,100)` (`:902-930`) | Mixed units and authored weights; longer time is treated as friction. |
| `estimatedCognitiveLoad` | `clamp(round(.25×hesitation + .20×answerChange + .15×referenceUse + .20×unfinishedExit + .20×friction + .15×overconfidenceError + min(20,5×wrongAfterLongThink)),0,100)` (`:932-940`) | Weights sum beyond 1 before clamping; not a validated cognitive-load instrument. |
| speed/accuracy style | Fast if `0 < decisionSpeedSec <= 2`; accurate if `accuracy >= 70`; maps to four quadrants/styles (`:942-949`) | Fixed heuristic thresholds. |

Domain accuracy is `round(100×correct/total)` after rule-based node/concept categorization (`src/App.tsx:812-831,951-956`). S1 admin aggregates are simple event means, completion ratios, and exposure percentages (`src/App.tsx:1377-1499`), not additional individual-level measures.

## S0 concept-lab summaries

`MiniGameHost` calculates `conceptAccuracy = round(100×correct/total)`, per-concept accuracy, strongest/weakest concept by sorted accuracy, and a decision-style preview from authored option `styleWeight` values (`src/ui/components/scenario/MiniGameHost.tsx:470-515,552-609`). Ties depend on sort order; item counts and difficulty are not normalized.

## S1 legacy cognitive proxies

For each confirmed option, authored weights are recorded: `strategicWeight`, `secondOrderThinkingWeight`, `adversaryModelingWeight`, `escalationWeight`, and `infoSeekingWeight` (`ScenarioOneSimulation.tsx:365-504,1256-1257`). At completion (`:1107-1153`):

- `choiceStrategyScore = mean(strategicWeight)`.
- `secondOrderThinkingScore = mean(secondOrderThinkingWeight)`.
- `adversaryModelingScore = mean(adversaryModelingWeight)`.
- `escalationSensitivityScore = -mean(escalationWeight)`; lower-escalation choices therefore score higher.
- `informationDisciplineScore = mean(infoSeekingWeight)`.
- `cognitiveFlexibilityScore = mean(secondOrderThinking, adversaryModeling, escalationSensitivity, informationDiscipline)`.
- `operationalStrategicIndex = clamp(.60×choiceStrategy + .15×secondOrder + .10×informationDiscipline + .10×escalationSensitivity + .05×adversaryModeling, -1,1)` (`:1119-1125`). Label: operational at `<= -0.25`, strategic at `>= 0.25`, balanced otherwise (`:1129-1133`).

All are means of authored option codes, generally around `[-1,1]`. There is no reliability, construct-validation, or norming study.

S1 information-compromise thresholds are behavioral mission classifications, not cognitive indices: `major` at exposure `>=80`, `limited` at `>=60`, else none (`ScenarioOneSimulation.tsx:277-280`).

## S2 legacy mission and cognitive proxies

### Continuously derived mission state

At each update (`ScenarioTwoSimulation.tsx:838-866`):

- `criticalDelivery = clamp((alphaHealth + alphaProgress)/2)`.
- `logisticsContinuity = clamp(.65×secondaryConvoyStability + .35×resourceReserve)`.
- `navigationIntegrity = clamp(100 − ambiguity − gnssExposureRisk/4 + threatIdentification/5)`.
- `remainingResources = resourceReserve`.

Mission-objective completion (`:915-927`) uses `statusScore = 35 delivered, 28 delivered_delayed, 0 lost_contact, 8 compromised, 18 otherwise`, then:

`completion = clamp(statusScore + .20×alphaHealth + .15×alphaProgress + .12×(100−ambushRisk) + .08×threatIdentification + .06×secondaryStability + .04×resourceReserve)`.

### Final indices

At `ScenarioTwoSimulation.tsx:1302-1411`:

- `criticalDeliveryScore = clamp((alphaHealth+alphaProgress)/2)`.
- `delayManagementScore = clamp(100−cumulativeDelay)`.
- `anomalyRecognitionScore = clamp(threatIdentification − ambiguity/2 + (mashhadIdentified ? 25 : 0))`.
- `logisticsResilienceIndex = clamp(.35×criticalDelivery + .20×secondaryStability + .20×(100−ambushRisk) + .15×resourceReserve + .10×threatIdentification)` (`:1305-1311`).
- `operationalStrategicIndex = clamp(mean(secondOrderThinkingScore, adversaryModelingScore, informationDisciplineScore, cognitiveFlexibilityScore))` (`:1312`). This is 0–100 and is semantically different from signed OSI elsewhere.
- `navigationCompromiseLevel = clamp(100−navigationIntegrity+ambushRisk/2)` (`:1411`).

The component also sums/normalizes authored decision weights into final cognitive scores (`:1273-1312`). These are unvalidated proxies.

## S3

No composite mission/cognitive index is implemented. The five raw state variables are clamped resource/status indicators (`ScenarioThreeDungeon.tsx:110-116,341-347`). Success/failure is categorical (`:510-571`). Any claim of an S3 cognitive score is unsupported.

## S4 redesigned mission-performance indices

`computeMetrics` in `scenario-four/adjudication/move3Adjudicator.ts:376-431` returns 0–100 scores:

| Index | Exact formula |
|---|---|
| `missionOutcomeScore` | `clamp(missionContinuity + 8 if m2FallbackActivated)` |
| `informationQualityScore` | `clamp(situationAwareness + .20×systemAttributionConfidence)` |
| `escalationControlScore` | `clamp(100−escalationPressure + 8 if redAction contains "offramp")` |
| `coalitionOutcomeScore` | `clamp(coalitionCohesion)` |
| `resourceSustainabilityScore` | `.40×missionBenefitPerCost + .25×reserveAtCriticalMoment + .20×avoidedExhaustion + .15×recoveryUtilization`, clamped. `missionBenefitPerCost=clamp(100×(.75×missionContinuity+.25×readiness)/max(35,totalUserCost))`; reserve is mean remaining/baseline percent; avoided exhaustion is `25×resources >=20% baseline`; recovery utilization is 75 if fallback/load reduction, else 50 (`:401-416`). |
| `informationDisciplineScore` | `clamp(100−max(0,claimLevel−evidence)−.25×informationExposure)`, claim levels 100/60/25/0 (`:381-390,423`). |
| `strategicLegitimacyScore` | `clamp(strategicLegitimacy)` |
| `resilienceScore` | `clamp(operationalReadiness + 12 if fallback)` |
| `reversibilityScore` | 82 for negotiated/off-ramp; 35 for unilateral strong; otherwise 65 (`:426-428`). |
| `decisionCoherenceScore` | 35 for insufficient evidence + unilateral strong; 85 for sufficient-limited + controlled deterrence; 75 for sufficient-strong + public attribution; otherwise 65 (`:393-400,429`). |
| `attributionCalibrationScore` | `clamp(100−|playerFinal−truthTarget|)`, truth targets red=90, mixed=55, non-red=10 (`:391-392,430`). |

These formula scores feed ordered ending rules at `move3Adjudicator.ts:441-498`; they are simulation metrics, not externally calibrated mission-effectiveness measures.

## S4 cognitive model V3

### OSI/orientation

For each core window, raw orientation is based on option operational/strategic loading and then centered relative to the options available in that window (`cognitiveEngineV3.ts:35-41,81-89`). Each move is a diagnosticity-weighted mean of its three adjusted window scores; overall OSI is the equal mean of all three complete move scores (`:249-270`). Range is `[-1,1]`; UI marker is `100×(OSI+1)/2` (`:43`). Interpretation thresholds are integrated `|OSI|<=.15` plus integration/dispersion rules, operational `<-.15`/`<-.45`, strategic `>.15`/`>.45` (`:237-245`).

Operational/strategic strengths are weighted raw loadings ×100. Integration is the harmonic mean `2OS/(O+S)` (`:44-45,265-269`). Dispersion is population SD of three move OSIs (`:270,364`).

### Construct formulas

All option-profile means are weighted by construct diagnosticity (`:271-304,367-379`).

- `informationSeeking = 100×weightedMean(.60×profileSeeking + .25×evidenceCoverage + .15×sourceDiversity)` over M1 information and M2 investigation (`:275-282`).
- `secondOrderThinking = 100×WM(.35×futureConsequence + .25×adversaryModeling + .20×reversibility + .20×resourceStewardship)` (`:369`).
- `adversaryModeling = 100×WM(profile.adversaryModeling)`; `escalationSensitivity` analogous (`:370-371`).
- `informationDiscipline = 100×WM(clamp(1−.70×overclaim−.30×overDisclosure))`, where `overclaim=max(0,claimIntensity−visibleConfidence/100)` and `overDisclosure=max(0,disclosureIntensity−meanEvidenceShareability)` (`:283-293,372`).
- `evidenceResponsiveUpdating` uses player/system estimate changes: direction agreement, magnitude agreement and evidence-change weight are combined as `raw=.60×direction+.40×magnitude`, then weighted and ×100 (`cognitiveEngineV3.ts:161-197,373`).
- `coalitionOrientation = 50×(weighted adjusted coalition score+1)` (`:294,374`).
- `resourceStewardship = 100×clamp(WM(.50×stewardship+.30×contingency+.20×reversibility)−penalty)`; penalty is .10 per resource below 20% baseline, capped .30 (`:296-300,375`).
- `planningForesight = 100×WM(.35×contingency+.25×reversibility+.20×stewardship+.20×futureConsequence)` (`:376`).
- `multiDomainIntegration = 100×WM(normalized entropy of seven saliences × min(totalSalience/3.5,1))` (`:301-304,377`).
- `riskPosture = diagnosticity-weighted adjusted risk` (`:295,378`). **Implementation inconsistency:** this returned value remains on `[-1,1]`, while the simulator audit transforms it to `50×(risk+1)` (`:493-494`) and adjacent constructs are 0–100.
- `decisionCoherence = 100×(.60×mean rationale alignment + .40×Move-3 cross-choice coherence)` (`:305-320,379`).

Data completeness is `.50×coreRecords + .15×timing + .15×evidenceTelemetry + .10×threeAttributionEstimates + .10×threeReasons`, each component a percent (`:321-327,381`). Response flags detect uniform option position, median active time below 2 s, zero evidence engagement, invariant attribution, no revisions, and combined rapid straightlining (`:338-391`); these are quality flags, not player penalties.

Attribution Brier: binary outcome `0` only for `non_red`, otherwise `1`; `p=estimate/100`; `Brier=(p−y)^2`; neutral reference `(.5−y)^2`; skill `1−Brier/reference` (`:397-423`). Consequently `mixed` is treated as the positive class, an important construct simplification.

## S5 cognitive model

S5 centers each selected option relative to available alternatives: `adjusted=(selected−meanAvailable)/maxAbsCentered`, or null if options do not discriminate (`scenario-five/model/cognitive/cognitiveEngine.ts:140-179`). Metrics are phase-balanced: mean within each represented phase, then equal mean across phases (`:181-199`).

- Raw option orientation: `(strategicLoading−operationalLoading)/(strategicLoading+operationalLoading+ε)` (`:148-150`). Overall signed OSI is the mean of four complete phase means; strengths are phase-balanced raw loadings ×100; integration is harmonic mean; dispersion is population SD of phase OSI (`:202-271`).
- `informationSeeking`: phase-balanced weighted combination of selected profile (.60), proportion of relevant evidence opened (.25), and normalized entropy/source diversity (.15); missing components cause weight renormalization (`:274-315`).
- `secondOrderThinking`, stewardship, planning use the same `.35/.25/.20/.20`, `.50/.30/.20`, and `.35/.25/.20/.20` loading formulas shown at `:221-226`.
- `multiDomainIntegration`: normalized entropy over nine saliences multiplied by `total/9`, then scored over diagnostic windows (`:227-235,329-332`).
- `resourceStewardship`: profile score minus .05 for each final ISR/support resource `<=5`, scaled to 0–100 (`:317-327`).
- `riskPosture`: phase-balanced relative risk on `[-1,1]` (`:334-342`).
- `decisionCoherence`: requires at least two of phases B/C/D; `100×clamp(.60×mean rationale alignment+.40×mean cross-choice coherence)` (`:344-363`).
- `informationDiscipline` is explicitly `null`—not implemented (`:421-449`).
- `evidenceResponsiveUpdating` is calculated from the four belief checkpoints and evidence via `calculateEvidenceResponsiveUpdating` (`:443`; exact update scoring in `model/cognitive/evidenceScoring.ts:3-50`).
- Data completeness: `.50×validDecisions + .15×timing + .15×evidence + .10×fourBeliefs + .10×threeReasons` (`:365-389`).

## S5 domain/mission metrics

These are descriptive outputs, not a single composite score (`scenario-five/model/runtime/domainMetrics.ts:40-265`):

- **GNSS/PNT assessment:** corridor correctness at four checkpoints; targeted interference recognized when estimate `>=70` and confidence `>=60`; corroboration requires at least two source types and one moderate/strong supporting item (`:40-80`).
- **Navigation integrity:** final exposure per corridor, mean/max exposure, fallback/hardened/ground-support corridor sets, compromised count (`:83-94`).
- **Critical delivery:** alpha is operational/on-time if integrity `>=60` and projected arrival `<=deadline`; records delay, delivery, and alpha share of total spent resources (`:97-128`).
- **Logistics resilience:** network continuity, delivered/on-time counts, coverage counts, attribution, end state, threat containment (`:131-150`). Network-continuity formula is implemented by `calculateNetworkContinuity` in `model/mission/endStateResolver.ts` and used here.
- **Delay control:** for each corridor, `finalDelay = actorAdded + playerAdded − playerRecovered`; code throws if reconciliation fails. Totals and mean are arithmetic sums/mean (`:153-190`).
- **Civilian-impact proxy:** counts route-diversion, checkpoint, ground-response and hold actions; localized disruption is their sum; also reports medical delay (`:193-208`). It measures coded actions, not actual civilian harm.
- **Network/logistics balance:** secondary minimum/mean integrity, delivered count, continuity, mean delay, population SD, targeted decision counts, and concentration `HHI=Σ(count/total)^2` (`:211-232`).

## Formula-validation limitations

- Weights and thresholds are authored engineering choices. No factor analysis, criterion validity, test–retest reliability, inter-rater calibration, measurement invariance, or human norm sample is present.
- Null handling differs by metric; missing data can become null, zero, or a denominator of `max(count,1)`. Cross-scenario comparison is therefore unsafe without harmonization.
- Three different meanings/scales use the OSI name: S1 signed weighted composite, S2 unsigned 0–100 mean, S4/S5 relative signed orientation.
- Archived Monte Carlo/coverage tests establish code behavior/distribution, not psychological validity.
