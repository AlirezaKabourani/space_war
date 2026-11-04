# Phase 09D-0: exact mechanical formula comparison

STATUS: READ-ONLY AUDIT FAIL (strict untouched-workspace baseline); extraction PASS. Concurrent changes are detailed in the audit report and manifest. This is extraction of existing code. SAME IMPLEMENTATION, DIFFERENT IMPLEMENTATION and NOT DETERMINABLE describe mechanics only, never scientific interchangeability, permission to fuse, or semantic harmonization.

S1 means released id=4, internal s4_redesigned_scenario_one. S2 means released id=5, internal s5_silent_waves_redesign. Runtime aliases: S1 `c = finalSnapshot.cognitiveScoresV3 as CognitiveModelV3Result`; S2 `c = result.cognitive: Scenario5CognitiveRunResult`. The S1 parent is optional `Record<string,unknown>` in ScenarioOneFinalSnapshot; the dashboard casts it, without runtime schema validation. Types and every returned path are in the crosswalk CSV.

Notation: WM(v,w)=sum(v*w)/sum(w), retaining finite non-null v and positive w in S1. PB means mean within each available phase followed by equal mean of available phase means in S2. Hn is Shannon entropy divided by ln(n). All reported coefficients and thresholds are existing source constants. No new thresholds have been chosen.

| Construct | S1 player label | S2 player label | S1 formula | S2 formula | Factual annotation | Mechanical difference | Exact formula sources |
| --- | --- | --- | --- | --- | --- | --- | --- |
| informationSeeking | جست‌وجوی اطلاعات | جست‌وجوی اطلاعات | 100*WM(.60*profileSeeking+.25*relevantOpenedFraction+.15*sourceEntropy,diagnosticity.informationSeeking) | 100*PB((.60*profileSeeking+.25*coverage+.15*diversity)/sum(present weights)); omit evidence components if no relevant evidence | DIFFERENT IMPLEMENTATION | S1 requires coverage and diversity in m1_information/m2_investigation; S1 one available source gives diversity=1 even unopened. S2 timestamps openings and deduplicates IDs; no relevant evidence can retain diagnostic profile alone. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:275; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:274 |
| secondOrderThinking | تفکر مرتبه دوم | تفکر مرتبه دوم | 100*WM(.35*future+.25*adversary+.20*reversibility+.20*stewardship,secondOrder=1) | 100*PB(.35*future+.25*adversary+.20*reversibility+.20*stewardship) over D observations | DIFFERENT IMPLEMENTATION | Same inner coefficients; different option profiles, sampling, diagnostic gating and phase aggregation. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:369; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:221 |
| adversaryModeling | مدل‌سازی اسرائیل | مدل‌سازی طرف مقابل | 100*WM(adversaryModeling,1 for communication/response/m3_coa else .55) | 100*PB(adversaryModeling) over diagnostic C2/D1 | DIFFERENT IMPLEMENTATION | Different contextual opponent profiles, eligible windows and weights. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:370; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:440 |
| escalationSensitivity | حساسیت به تشدید | حساسیت به تشدید | 100*WM(escalationSensitivity,1 for m1_communication/m2_response/m3_coa else .55) | 100*PB(escalationSensitivity) over diagnostic B2/D1/D2 | DIFFERENT IMPLEMENTATION | Different windows, profiles and weights; higher means greater coded attention, not better performance. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:371; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:441 |
| informationDiscipline | پرهیز از ادعای فراتر از شواهد | انضباط اطلاعاتی: در نسخه فعلی این سناریو سنجیده نمی‌شود. | 100*mean(clamp(1-.70*max(0,claim-visibleConfidence/100)-.30*max(0,disclosure-meanAvailableShareability),0,1)) | literal null | DIFFERENT IMPLEMENTATION | Measured S1 claim/disclosure proportionality; S2 has explicit null contract and one unscored note. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:283; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:442 |
| evidenceResponsiveUpdating | به‌روزرسانی مبتنی بر شواهد | به‌روزرسانی متناسب با شواهد | 100*WM(.60*direction+.40*(1-min(abs(dP-dE)/.50,1)),max(.25,min(1,abs(dE)/.25))) | 100*mean(.60*direction+.40*(1-min(abs(dP-dE)/.50,1))) | DIFFERENT IMPLEMENTATION | S1 attribution estimate versus visible system confidence, chronologically adjacent records incl stable evidence, tolerant direction rule and change weights. S2 targeted-interference estimate versus visible evidence support, fixed adjacent checkpoint order, omit stable evidence, binary nonzero direction, equal pair weights. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:161; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:443 |
| coalitionOrientation | گرایش ائتلافی | NOT_AVAILABLE | 50*(WM(window-centered coalitionOrientation,1 for communication/response/m3_coa/m3_info else .35)+1) | NOT_AVAILABLE | NOT DETERMINABLE | S2 result has no property; do not synthesize one. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:294; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:421 |
| resourceStewardship | مدیریت منابع | نگهداشت و تخصیص منابع | 100*clamp(WM(.50*resource+.30*contingency+.20*reversibility,1)-min(.30,.10*count(direct-cost shadow/baseline<.20)),0,1) | 100*clamp(PB(diagnostic .50*resource+.30*contingency+.20*reversibility)-.05*I(finalISR<=5)-.05*I(finalSupport<=5),0,1) | DIFFERENT IMPLEMENTATION | S1 direct user_cost shadow starts 85/85/85/75, clamps each update to initial baseline; recoveries excluded. S2 requires visible resources all eight decisions; visible path may reflect world/actor consequences, though no hidden truth or mission success variable is read. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:296; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:317 |
| planningForesight | برنامه‌ریزی و آینده‌نگری | برنامه‌ریزی و آینده‌نگری | 100*WM(.35*contingency+.25*reversibility+.20*resource+.20*future,planning=1) | 100*PB(.35*contingency+.25*reversibility+.20*resource+.20*future) over D observations | DIFFERENT IMPLEMENTATION | Same inner coefficients; different profiles, windows, diagnostic gating and phase balance. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:376; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:225 |
| multiDomainIntegration | یکپارچه‌سازی چندمعیاره | یکپارچه‌سازی چندمعیاره | 100*WM(H7(domainVector)*min(1,sum/3.5),multiDomain=1) | 100*PB(clamp(H9(domainVector)*sum/9,0,1)) over D observations | DIFFERENT IMPLEMENTATION | S1 seven domains incl coalition/legitimacy; S2 nine domains incl navigation/logistics/civilian/network. S1 zero-total entropy=0; S2 profile helper null at <=1e-9 but wrapper substitutes 0 before diagnostic gating. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:301; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:227 |
| riskPosture | گرایش به پذیرش ریسک | موضع نسبی ریسک | WM(window-centered riskExposure,riskPosture=1), signed [-1,1] | PB(available-option-centered riskExposure) over four windows, signed [-1,1] | DIFFERENT IMPLEMENTATION | Different available alternatives and averaging; S1 flat relative metric returns 0; S2 degenerate spread returns null. S1 UI rescales to (r+1)*50 for bar; S2 preserves signed number, only coordinate maps to percentage. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:295; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:334 |
| decisionCoherence | انسجام تصمیم | انسجام تصمیم | 100*(.60*mean(per-move mean(reason matrix for selected actions))+.40*move3 crossRule) | 100*clamp(.60*mean(reason means per eligible B/C/D)+.40*mean(crossMatrix per eligible B/C/D),0,1) | DIFFERENT IMPLEMENTATION | S1 one mapped reason-move suffices if complete move3 cross triple; no explicit before-outcome reason filter. S2 >=2 phases, before-outcome reasons, different seven reason formulae and B/C/D pair matrices. | src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:305; src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:344 |

## Orientation and supporting fields

| Comparison | Annotation | Existing mechanics and null conditions |
| --- | --- | --- |
| Raw orientation and within-window adjustment | DIFFERENT IMPLEMENTATION | Both start (S-O)/(S+O+epsilon), center at option mean and divide by maximum absolute centered value. S1 epsilon=1e-6, fixed full COGNITIVE_WINDOWS_V3 alternatives, zero spread returns measured 0. S2 epsilon=1e-9, deduplicated actually available alternatives, >=2 distinct available actions, denominator<epsilon returns null. |
| Per-phase / overall OSI | DIFFERENT IMPLEMENTATION | S1 requires all three core observations in EACH move, then diagnostic-weighted mean; requires all three moves for equal overall mean. S2 averages available adjusted observations within each A/B/C/D phase, then requires four non-null phases for equal overall mean. A2 excluded. The CSV ordinal phase rows are an inventory of positions, not an assertion of matched decision stages. |
| Operational/strategic strength | DIFFERENT IMPLEMENTATION | S1 weighted selected raw loadings over all nine latest core profiles using diagnosticity.osi, times 100; S2 phase-balanced eligible OSI-window raw loadings times 100; A2 excluded. Both can exist with missing overall OSI. |
| Harmonic integration | DIFFERENT IMPLEMENTATION | Inner 2OS/(O+S) matches for nonzero sum; S1 zero sum returns 0, S2 returns null. S2 clamps [0,100]. Inputs and aggregation differ. |
| Dispersion | DIFFERENT IMPLEMENTATION | Population SD of three complete S1 move scores vs >=2 available S2 phase scores. Both mathematical range [0,1]. S1 produces label/interpretation; S2 returns numeric only. |
| Completeness | DIFFERENT IMPLEMENTATION | Same existing outer .50/.15/.15/.10/.10 coefficients; S1 9 core records and 3 attribution records vs S2 8 decisions and 4 belief checkpoints; different timing/evidence/reason validity predicates. No completeness threshold globally gates cognitive metrics. |
| Timing median/IQR | DIFFERENT IMPLEMENTATION | Same linear quantile interpolation expression; S1 latest core telemetry with present records, no finite filter in this calculation; S2 finite nonnegative times. No times=>null, singleton IQR=>0. 9 vs 8 windows. |
| Revision counts | DIFFERENT IMPLEMENTATION | Sum count and count windows with count>0 use different telemetry contracts/sample selection. S1 also returns first-to-final list; S2 does not. |
| Evidence-triggered revision rate | DIFFERENT IMPLEMENTATION | S1 denominator: changed windows with nonempty evidence timeline; numerator: any nonfirst selection with preceding/simultaneous evidence open, no first/final difference required. S2 denominator: evidence opening strictly after first selection and before confirmation in same window; numerator: non-null first != final. No denominator=>null. Neither proves causation. |
| Inner second-order/stewardship/planning recipes only | SAME IMPLEMENTATION | Coefficient recipes .35/.25/.20/.20, .50/.30/.20, .35/.25/.20/.20 match, respectively. This annotation is limited to these arithmetic subexpressions; full constructs above have DIFFERENT IMPLEMENTATION. |
| Information discipline / coalition counterpart | NOT DETERMINABLE | S2 discipline is intentionally literal null; coalition is absent. No implemented numeric pair to compare or authorize. |

S1 OSI weights by window: m1_information=.85, m1_protection=1, m1_communication=1; m2_investigation=.90, m2_mission=1, m2_response=1.10; m3_threshold=.55, m3_coa=1.20, m3_info=1.10. Other diagnostics: secondOrder/resourceStewardship/planning/multiDomain/riskPosture/reversibility=1; adversaryModeling and escalationSensitivity=1 for communication/response/m3_coa, otherwise .55; coalition=1 for communication/response/m3_coa/m3_info, otherwise .35; seeking=1 for m1_information/m2_investigation, otherwise .25 (only the two seeking windows are actually used). Source: `src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts:75,217`.

S2 eligibility: E: final action in available set; all profile IDs known; >=2 distinct available actions. D(g): E and max(g)-min(g)+1e-9>=.1. PB: equal mean of available phase means (not all phases required). OSI/risk use their nondegenerate relative adjustment, not D's .1 rule. Seeking retains an E observation if seeking is diagnostic OR relevant evidence exists. Exact windows: informationSeeking = A1,A2,B1,B2,C1,C2,D1; E and diagnostic informationSeeking OR relevant evidence; secondOrderThinking = A1,B1,B2,C1,C2,D1,D2; D(secondOrder); adversaryModeling = C2,D1; D(adversaryModeling); escalationSensitivity = B2,D1,D2; D(escalationSensitivity); planningForesight = A1,B2,C1,C2,D1,D2; D(planning); resourceStewardship = all eight windows; D(stewardship), exactly 8 decisions and every before/after resource record; multiDomainIntegration = B1,B2,C2,D1; D(MDI); riskPosture = B2,C2,D1,D2; E and nondegenerate risk spread; decisionCoherence = B,C,D action pairs + before-outcome reason + existing cross matrix; >=2 eligible phases; evidenceResponsiveUpdating = adjacent four-checkpoint pairs with both records and abs(evidenceDelta)>1e-9; informationDiscipline = no windows; intentionally unmeasured. Window abbreviations A1..D2 mean exact CognitiveWindowId declarations, `src/ui/components/scenario/scenario-five/model/cognitive/types.ts:10`.

## Evidence contexts and truth boundary

S1 ERU estimates attribution to the scenario's adversary using systemEvidenceConfidence recorded as player-visible confidence, not hidden binary truth. It sorts recorded timestamps and can compare any chronologically adjacent recorded phases. Direction=1 for abs(dE)<.05 AND abs(dP)<.10, otherwise matching signs=>1, otherwise abs(dP)<.05=>.5, else 0. This can score stable belief/evidence pairs. Magnitude=1-min(abs(dP-dE)/.50,1); weight=max(.25,min(1,abs(dE)/.25)); result=100*weighted mean(.6 direction+.4 magnitude). Recorded audit finalContribution is rawScore*weight/sumWeights*100.

S2 ERU is targeted-interference belief movement, not correct corridor identification, corridor-confidence change or hidden cause. Visible evidence support uses weak=.25/moderate=.6/strong=.9 times direction +1/0/-1. For each visible corridor/source keep greatest absolute signed item (ties retain first), average sources per corridor, map clamp(.5+.5*mean,0,1), then take maximum corridor; no observed corridor=>.5. Fixed adjacent A2_prebelief/A2_postbelief/C_belief_checkpoint/D_final_belief pairs only; skip abs(evidenceDelta)<=1e-9. Direction is binary matching nonzero belief delta; no S1 stable-pair tolerance or pair weights. The exact source below retains every coefficient.

Neither cognitive engine reads hidden truth or mission outcome as a scoring operand. S1's separate `calculateAttributionBrier` DOES read hidden truth and is an AAR calibration diagnostic, not one of the twelve V3 scores. S2 resource penalties read visible state and thus can reflect a trajectory affected by the domain/actor model. Visible evidence availability can likewise depend on scenario evolution; absence of a direct hidden-truth argument does not claim experimental independence of all generated inputs.

## Player interpretation and transformations

S1 uses 12 integer bars with existing metricLabel: <30 پایین; <55 متوسط; <75 نسبتاً بالا; otherwise بالا. These labels are pre-existing UI buckets, not audit-selected comparability thresholds. Risk alone is displayed as (signedRisk+1)*50. OSI band uses <−.45, <−.15, <=.15, <=.45, else high strategic band. Stored orientation interpretation prioritizes abs(OSI)<=.15/integration>=70/dispersion<=.15, then contextual dispersion>.15, then integration<45, then directional bands. Exact strings are in the source extract. Dispersion label thresholds <=.15/<=.35 are existing model outputs. Null scores display insufficient-data text with an empty-width visual; the audit does not call that a numeric zero.

S2 renders the nine measured 0..100 constructs with stored 2dp numbers; risk and OSI are signed 2dp with axis coordinate (v+1)*50 only, null omits marker/meter, numeric zero remains visible. Median/IQR are ms/1000 to 1dp seconds; completeness and revision rate are 2dp percent. No numerical aggregation is performed in the dashboard. The technical compatibility report retains milliseconds. Labels/definitions come from `src/ui/components/scenario/scenario-five/ui/cognitiveDashboardPresentation.ts:26,35,55,63`; actual renderer `src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard.tsx:12,30`. The 09C-2 descriptive OSI title, edge-marker hooks and compact-coverage classes are present; no patch was applied here.

## Versions

S1: s4-cog-v3; formula 3.0.0; s4-options-v3.1-postfix; s4-content-2026-09; provisional-unvalidated; s4-anchor-first-options-v1.

S2: s5-cognitive-v3-adapter-v1.0.0; cognitive-v3-semantic-v1.0.0; s5-option-profiles-internal-v1.0.0; s5-silent-waves-redesign-content-v1.0.0; s5-reason-model-internal-v1.0.0; not-yet-expert-validated; experimental_pending_expert_and_human_validation.

S1 has no reasonModelVersion or formal validityStatus result property. S2 has no anchorTestVersion. The S1 UI's experimental wording is hardcoded; responseProcess.status is descriptive response quality, not validation status. Version strings alone do not establish equivalent scientific measurement.

## Full coefficient and domain codebook

The following tables are extracted from the actual exported option profiles without running any gameplay. Units for every loading/salience/claim/disclosure are dimensionless [0,1]; window weights above are diagnostic multipliers (up to 1.20). A larger loading means more of the coded behavior, never a participant rank. S1 informationDisciplineBase participates in reason alignment; the numeric discipline score uses claim/disclosure logic instead. Profile numbers below are code constants, not user results.

### S1 all 41 profiles

Source: `src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts:93,107,155,217`.

| optionId | window | O | S | information | future | adversary | escalation | coalition | reversibility | resources | contingency | disciplineBase | risk | claim | disclosure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m1_i_passive | m1_information | 0.45 | 0.2 | 0.2 | 0.25 | 0.25 | 0.45 | 0.2 | 0.55 | 0.6 | 0.1 | 0.65 | 0.25 | undefined | undefined |
| m1_i_dedicated_ssa | m1_information | 0.6 | 0.55 | 0.9 | 0.6 | 0.55 | 0.55 | 0.2 | 0.55 | 0.45 | 0.6 | 0.75 | 0.45 | undefined | undefined |
| m1_i_commercial | m1_information | 0.4 | 0.7 | 0.85 | 0.7 | 0.55 | 0.5 | 0.35 | 0.7 | 0.65 | 0.65 | 0.8 | 0.35 | undefined | undefined |
| m1_i_allied_network | m1_information | 0.3 | 0.85 | 0.9 | 0.8 | 0.65 | 0.65 | 0.95 | 0.65 | 0.4 | 0.75 | 0.75 | 0.4 | undefined | undefined |
| m1_p_hold | m1_protection | 0.35 | 0.35 | 0.25 | 0.25 | 0.35 | 0.55 | 0.25 | 0.75 | 0.6 | 0.15 | 0.7 | 0.2 | undefined | undefined |
| m1_p_covert_readiness | m1_protection | 0.75 | 0.6 | 0.3 | 0.7 | 0.6 | 0.65 | 0.25 | 0.8 | 0.6 | 0.85 | 0.85 | 0.4 | undefined | undefined |
| m1_p_visible_protection | m1_protection | 0.9 | 0.4 | 0.25 | 0.55 | 0.7 | 0.45 | 0.2 | 0.65 | 0.45 | 0.65 | 0.65 | 0.65 | undefined | undefined |
| m1_p_mission_reposition | m1_protection | 0.95 | 0.25 | 0.2 | 0.45 | 0.55 | 0.3 | 0.15 | 0.25 | 0.25 | 0.5 | 0.55 | 0.9 | undefined | undefined |
| m1_c_none | m1_communication | 0.35 | 0.3 | 0.2 | 0.25 | 0.3 | 0.4 | 0.15 | 0.55 | 0.6 | 0.1 | 0.7 | 0.25 | 0.05 | 0.05 |
| m1_c_private | m1_communication | 0.35 | 0.8 | 0.45 | 0.75 | 0.85 | 0.9 | 0.25 | 0.85 | 0.65 | 0.7 | 0.9 | 0.25 | 0.25 | 0.15 |
| m1_c_allies | m1_communication | 0.3 | 0.9 | 0.55 | 0.8 | 0.7 | 0.75 | 1 | 0.7 | 0.45 | 0.75 | 0.8 | 0.35 | 0.3 | 0.55 |
| m1_c_public_warning | m1_communication | 0.5 | 0.75 | 0.35 | 0.6 | 0.75 | 0.35 | 0.35 | 0.35 | 0.45 | 0.55 | 0.45 | 0.7 | 0.55 | 0.5 |
| m1_c_private_allied | m1_communication | 0.35 | 0.95 | 0.6 | 0.9 | 0.9 | 0.9 | 0.9 | 0.85 | 0.45 | 0.85 | 0.9 | 0.3 | 0.3 | 0.4 |
| m2_a_technical_diagnostics | m2_investigation | 0.65 | 0.55 | 0.85 | 0.6 | 0.45 | 0.55 | 0.2 | 0.6 | 0.7 | 0.7 | 0.9 | 0.3 | undefined | undefined |
| m2_a_second_sensor | m2_investigation | 0.65 | 0.65 | 0.95 | 0.75 | 0.6 | 0.6 | 0.25 | 0.65 | 0.35 | 0.8 | 0.9 | 0.4 | undefined | undefined |
| m2_a_ally_intel | m2_investigation | 0.35 | 0.9 | 0.9 | 0.8 | 0.65 | 0.65 | 0.95 | 0.7 | 0.45 | 0.8 | 0.85 | 0.35 | undefined | undefined |
| m2_a_commercial_validation | m2_investigation | 0.45 | 0.75 | 0.9 | 0.75 | 0.55 | 0.6 | 0.35 | 0.75 | 0.65 | 0.75 | 0.85 | 0.35 | undefined | undefined |
| m2_a_act_with_current_data | m2_investigation | 0.85 | 0.2 | 0.1 | 0.25 | 0.35 | 0.3 | 0.15 | 0.35 | 0.9 | 0.2 | 0.35 | 0.8 | undefined | undefined |
| m2_m_continue_normal | m2_mission | 0.9 | 0.2 | 0.2 | 0.2 | 0.3 | 0.3 | 0.2 | 0.35 | 0.55 | 0.1 | 0.65 | 0.65 | undefined | undefined |
| m2_m_activate_fallback | m2_mission | 0.75 | 0.75 | 0.3 | 0.85 | 0.45 | 0.65 | 0.25 | 0.8 | 0.55 | 0.95 | 0.8 | 0.35 | undefined | undefined |
| m2_m_reduce_load | m2_mission | 0.65 | 0.65 | 0.25 | 0.75 | 0.4 | 0.7 | 0.2 | 0.85 | 0.8 | 0.75 | 0.85 | 0.2 | undefined | undefined |
| m2_m_protective_reconfiguration | m2_mission | 0.85 | 0.5 | 0.25 | 0.65 | 0.55 | 0.5 | 0.2 | 0.65 | 0.55 | 0.75 | 0.7 | 0.55 | undefined | undefined |
| m2_m_split_service | m2_mission | 0.75 | 0.85 | 0.35 | 0.9 | 0.5 | 0.7 | 0.3 | 0.8 | 0.4 | 0.95 | 0.8 | 0.4 | undefined | undefined |
| m2_r_no_counteraction | m2_response | 0.3 | 0.5 | 0.35 | 0.35 | 0.55 | 0.8 | 0.25 | 0.8 | 0.6 | 0.15 | 0.85 | 0.15 | 0.05 | 0.05 |
| m2_r_request_explanation | m2_response | 0.35 | 0.75 | 0.5 | 0.7 | 0.8 | 0.85 | 0.35 | 0.8 | 0.7 | 0.65 | 0.9 | 0.25 | 0.25 | 0.15 |
| m2_r_private_warning | m2_response | 0.55 | 0.75 | 0.35 | 0.65 | 0.85 | 0.65 | 0.25 | 0.65 | 0.6 | 0.65 | 0.75 | 0.55 | 0.5 | 0.15 |
| m2_r_joint_allied_response | m2_response | 0.45 | 0.9 | 0.55 | 0.85 | 0.8 | 0.7 | 1 | 0.65 | 0.35 | 0.85 | 0.8 | 0.5 | 0.5 | 0.55 |
| m2_r_request_defensive_authority | m2_response | 0.8 | 0.65 | 0.3 | 0.7 | 0.7 | 0.55 | 0.35 | 0.75 | 0.45 | 0.85 | 0.7 | 0.65 | 0.55 | 0.2 |
| m2_r_deconfliction_offer | m2_response | 0.35 | 0.95 | 0.45 | 0.9 | 0.9 | 0.95 | 0.5 | 0.9 | 0.55 | 0.85 | 0.9 | 0.2 | 0.2 | 0.15 |
| m3_t_insufficient | m3_threshold | 0.25 | 0.6 | 0.65 | 0.5 | 0.65 | 0.8 | 0.3 | 0.8 | 0.65 | 0.2 | 0.95 | 0.15 | 0.1 | 0.05 |
| m3_t_sufficient_limited | m3_threshold | 0.5 | 0.6 | 0.55 | 0.7 | 0.65 | 0.65 | 0.3 | 0.85 | 0.75 | 0.7 | 0.8 | 0.45 | 0.45 | 0.1 |
| m3_t_sufficient_strong | m3_threshold | 0.65 | 0.5 | 0.4 | 0.55 | 0.65 | 0.4 | 0.25 | 0.35 | 0.7 | 0.55 | 0.55 | 0.8 | 0.8 | 0.15 |
| m3_coa_contain_understand | m3_coa | 0.45 | 0.8 | 0.85 | 0.9 | 0.75 | 0.9 | 0.4 | 0.9 | 0.65 | 0.7 | 0.9 | 0.25 | undefined | undefined |
| m3_coa_controlled_deterrence | m3_coa | 0.8 | 0.8 | 0.5 | 0.8 | 0.9 | 0.65 | 0.35 | 0.7 | 0.45 | 0.85 | 0.75 | 0.6 | undefined | undefined |
| m3_coa_coordinated_response | m3_coa | 0.55 | 0.95 | 0.65 | 0.9 | 0.85 | 0.75 | 1 | 0.7 | 0.3 | 0.9 | 0.8 | 0.5 | undefined | undefined |
| m3_coa_negotiated_deescalation | m3_coa | 0.35 | 0.95 | 0.55 | 0.95 | 0.95 | 0.98 | 0.65 | 0.9 | 0.55 | 0.9 | 0.9 | 0.2 | undefined | undefined |
| m3_coa_unilateral_strong | m3_coa | 0.85 | 0.7 | 0.3 | 0.65 | 0.75 | 0.25 | 0.1 | 0.3 | 0.25 | 0.65 | 0.45 | 0.95 | undefined | undefined |
| m3_info_keep_restricted | m3_info | 0.4 | 0.6 | 0.35 | 0.45 | 0.55 | 0.7 | 0.2 | 0.85 | 0.65 | 0.2 | 0.95 | 0.15 | 0.05 | 0.05 |
| m3_info_share_allies | m3_info | 0.35 | 0.9 | 0.6 | 0.85 | 0.7 | 0.75 | 1 | 0.75 | 0.55 | 0.8 | 0.9 | 0.3 | 0.3 | 0.45 |
| m3_info_public_partial | m3_info | 0.45 | 0.85 | 0.45 | 0.75 | 0.75 | 0.55 | 0.45 | 0.6 | 0.4 | 0.7 | 0.7 | 0.55 | 0.6 | 0.65 |
| m3_info_public_attribution | m3_info | 0.55 | 0.8 | 0.35 | 0.7 | 0.8 | 0.35 | 0.35 | 0.35 | 0.25 | 0.65 | 0.45 | 0.9 | 0.95 | 0.9 |

| optionId | domainMission | domainInformation | domainEscalation | domainCoalition | domainResources | domainLegitimacy | domainFutureOptions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| m1_i_passive | 0.4 | 0.25 | 0 | 0 | 0.65 | 0 | 0.35 |
| m1_i_dedicated_ssa | 0.35 | 0.9 | 0 | 0 | 0.65 | 0 | 0.45 |
| m1_i_commercial | 0.3 | 0.9 | 0 | 0 | 0.55 | 0.45 | 0.45 |
| m1_i_allied_network | 0 | 0.85 | 0 | 0.85 | 0.45 | 0.45 | 0.5 |
| m1_p_hold | 0.45 | 0 | 0.2 | 0 | 0.7 | 0 | 0.45 |
| m1_p_covert_readiness | 0.85 | 0 | 0.55 | 0 | 0.65 | 0 | 0.55 |
| m1_p_visible_protection | 0.9 | 0 | 0.75 | 0 | 0.65 | 0.45 | 0.45 |
| m1_p_mission_reposition | 0.9 | 0 | 0.65 | 0 | 0.8 | 0 | 0.55 |
| m1_c_none | 0 | 0 | 0.35 | 0 | 0.7 | 0.2 | 0.4 |
| m1_c_private | 0 | 0.3 | 0.9 | 0 | 0 | 0.7 | 0.65 |
| m1_c_allies | 0 | 0.35 | 0.65 | 0.95 | 0.3 | 0.75 | 0.65 |
| m1_c_public_warning | 0 | 0.35 | 0.85 | 0 | 0.3 | 0.8 | 0.45 |
| m1_c_private_allied | 0 | 0.45 | 0.9 | 0.9 | 0.35 | 0.8 | 0.7 |
| m2_a_technical_diagnostics | 0.35 | 0.9 | 0 | 0 | 0.5 | 0.25 | 0.4 |
| m2_a_second_sensor | 0.3 | 0.95 | 0 | 0 | 0.7 | 0 | 0.5 |
| m2_a_ally_intel | 0 | 0.9 | 0 | 0.9 | 0.45 | 0.5 | 0.55 |
| m2_a_commercial_validation | 0.2 | 0.9 | 0 | 0 | 0.5 | 0.55 | 0.5 |
| m2_a_act_with_current_data | 0.45 | 0.15 | 0.35 | 0 | 0.7 | 0.3 | 0.3 |
| m2_m_continue_normal | 0.8 | 0 | 0.25 | 0 | 0.65 | 0 | 0.4 |
| m2_m_activate_fallback | 0.9 | 0 | 0.65 | 0 | 0.75 | 0 | 0.75 |
| m2_m_reduce_load | 0.85 | 0 | 0.65 | 0 | 0.75 | 0 | 0.7 |
| m2_m_protective_reconfiguration | 0.9 | 0 | 0.7 | 0 | 0.75 | 0 | 0.55 |
| m2_m_split_service | 0.9 | 0.25 | 0.6 | 0 | 0.8 | 0 | 0.8 |
| m2_r_no_counteraction | 0 | 0 | 0.65 | 0 | 0.6 | 0.5 | 0.55 |
| m2_r_request_explanation | 0 | 0.35 | 0.85 | 0 | 0.25 | 0.75 | 0.65 |
| m2_r_private_warning | 0 | 0.25 | 0.85 | 0 | 0.35 | 0.65 | 0.55 |
| m2_r_joint_allied_response | 0.3 | 0.4 | 0.8 | 0.95 | 0.4 | 0.85 | 0.7 |
| m2_r_request_defensive_authority | 0.75 | 0.2 | 0.75 | 0.25 | 0.7 | 0.75 | 0.65 |
| m2_r_deconfliction_offer | 0 | 0.3 | 0.95 | 0.5 | 0.25 | 0.85 | 0.8 |
| m3_t_insufficient | 0 | 0.9 | 0.45 | 0 | 0 | 0.8 | 0.65 |
| m3_t_sufficient_limited | 0.25 | 0.85 | 0.65 | 0 | 0 | 0.8 | 0.7 |
| m3_t_sufficient_strong | 0.4 | 0.75 | 0.75 | 0 | 0 | 0.7 | 0.6 |
| m3_coa_contain_understand | 0.8 | 0.85 | 0.8 | 0.25 | 0.6 | 0.7 | 0.85 |
| m3_coa_controlled_deterrence | 0.9 | 0 | 0.85 | 0 | 0.7 | 0.75 | 0.75 |
| m3_coa_coordinated_response | 0.9 | 0.65 | 0.85 | 0.95 | 0.7 | 0.9 | 0.85 |
| m3_coa_negotiated_deescalation | 0.35 | 0 | 0.95 | 0.75 | 0.35 | 0.9 | 0.9 |
| m3_coa_unilateral_strong | 0.9 | 0 | 0.9 | 0 | 0.8 | 0.55 | 0.4 |
| m3_info_keep_restricted | 0 | 0.55 | 0 | 0 | 0.65 | 0.55 | 0.6 |
| m3_info_share_allies | 0 | 0.8 | 0 | 0.9 | 0.55 | 0.75 | 0.7 |
| m3_info_public_partial | 0 | 0.85 | 0.65 | 0.45 | 0.6 | 0.85 | 0 |
| m3_info_public_attribution | 0 | 0.9 | 0.85 | 0.35 | 0.7 | 0.9 | 0 |

### S2 all 33 profiles

Source: `src/ui/components/scenario/scenario-five/model/cognitive/optionProfiles.ts:4,16`.

| actionId | O | S | information | future | adversary | escalation | reversibility | resources | contingency | risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a1_network_baseline | 0.5 | 0.7 | 0.9 | 0.7 | 0.3 | 0.1 | 0.9 | 0.5 | 0.7 | 0.3 |
| a1_priority_focus | 0.7 | 0.3 | 0.7 | 0.3 | 0.1 | 0.1 | 0.7 | 0.5 | 0.3 | 0.5 |
| a1_rotating_watch | 0.5 | 0.7 | 0.9 | 0.7 | 0.3 | 0.1 | 0.9 | 0.7 | 0.7 | 0.3 |
| a1_preserve_reserve | 0.3 | 0.9 | 0.1 | 0.9 | 0.3 | 0.2 | 0.9 | 0.9 | 0.9 | 0.7 |
| a2_focused_pnt | 0.7 | 0.3 | 0.9 | 0.3 | 0.1 | 0.1 | 0.7 | 0.5 | 0.3 | 0.4 |
| a2_broad_sweep | 0.4 | 0.7 | 0.9 | 0.7 | 0.3 | 0.1 | 0.8 | 0.4 | 0.7 | 0.3 |
| a2_field_radio | 0.5 | 0.6 | 0.9 | 0.5 | 0.2 | 0.1 | 0.9 | 0.7 | 0.6 | 0.2 |
| a2_ground_liaison | 0.6 | 0.6 | 0.9 | 0.6 | 0.4 | 0.3 | 0.5 | 0.4 | 0.7 | 0.5 |
| b1_suspect_focus | 0.7 | 0.4 | 0.8 | 0.4 | 0.4 | 0.2 | 0.7 | 0.5 | 0.4 | 0.5 |
| b1_priority_cargo | 0.9 | 0.3 | 0.6 | 0.3 | 0.2 | 0.2 | 0.6 | 0.4 | 0.3 | 0.6 |
| b1_split_attention | 0.5 | 0.8 | 0.8 | 0.7 | 0.5 | 0.2 | 0.8 | 0.6 | 0.7 | 0.3 |
| b1_pulse_network | 0.5 | 0.7 | 0.7 | 0.7 | 0.4 | 0.2 | 0.9 | 0.8 | 0.7 | 0.4 |
| b2_continue_crosscheck | 0.7 | 0.6 | 0.7 | 0.6 | 0.4 | 0.5 | 0.8 | 0.7 | 0.8 | 0.5 |
| b2_reroute | 0.9 | 0.5 | 0.2 | 0.6 | 0.5 | 0.5 | 0.4 | 0.4 | 0.7 | 0.3 |
| b2_staged_checkpoints | 0.7 | 0.8 | 0.7 | 0.8 | 0.5 | 0.5 | 0.8 | 0.6 | 0.9 | 0.3 |
| b2_hold_verify | 0.4 | 0.7 | 0.9 | 0.6 | 0.4 | 0.7 | 0.9 | 0.5 | 0.6 | 0.4 |
| c1_fallback_nav | 0.8 | 0.7 | 0.2 | 0.8 | 0.4 | 0.4 | 0.7 | 0.6 | 0.9 | 0.3 |
| c1_ground_recon | 0.7 | 0.6 | 0.9 | 0.6 | 0.6 | 0.5 | 0.5 | 0.4 | 0.7 | 0.5 |
| c1_checkpoint_spacing | 0.8 | 0.7 | 0.6 | 0.8 | 0.5 | 0.4 | 0.7 | 0.6 | 0.9 | 0.3 |
| c1_preserve_mobile_reserve | 0.3 | 0.9 | 0.1 | 0.9 | 0.4 | 0.4 | 0.9 | 0.9 | 0.9 | 0.7 |
| c2_isr_heavy | 0.6 | 0.5 | 0.9 | 0.5 | 0.4 | 0.3 | 0.6 | 0.3 | 0.5 | 0.5 |
| c2_mobility_heavy | 0.7 | 0.7 | 0.1 | 0.8 | 0.5 | 0.4 | 0.6 | 0.4 | 0.9 | 0.4 |
| c2_balanced | 0.6 | 0.9 | 0.6 | 0.9 | 0.6 | 0.5 | 0.8 | 0.9 | 0.9 | 0.3 |
| c2_priority_surge | 0.9 | 0.4 | 0.7 | 0.3 | 0.3 | 0.4 | 0.3 | 0.2 | 0.3 | 0.7 |
| d1_emergency_reroute | 0.9 | 0.5 | 0.1 | 0.6 | 0.6 | 0.6 | 0.3 | 0.4 | 0.7 | 0.3 |
| d1_ground_containment | 0.9 | 0.7 | 0.8 | 0.6 | 0.9 | 0.9 | 0.2 | 0.3 | 0.5 | 0.8 |
| d1_deception_routing | 0.6 | 0.9 | 0.2 | 0.8 | 0.9 | 0.7 | 0.6 | 0.6 | 0.8 | 0.6 |
| d1_escorted_continuation | 0.9 | 0.5 | 0.5 | 0.5 | 0.6 | 0.7 | 0.3 | 0.4 | 0.5 | 0.7 |
| d1_hold_confirm | 0.4 | 0.8 | 0.9 | 0.7 | 0.6 | 0.8 | 0.9 | 0.6 | 0.7 | 0.4 |
| d2_critical_delivery_surge | 0.9 | 0.4 | 0.1 | 0.3 | 0.3 | 0.6 | 0.2 | 0.3 | 0.3 | 0.7 |
| d2_network_balanced_finish | 0.7 | 0.9 | 0.1 | 0.8 | 0.6 | 0.6 | 0.6 | 0.8 | 0.8 | 0.4 |
| d2_resilient_handoff | 0.7 | 0.8 | 0.1 | 0.9 | 0.5 | 0.4 | 0.8 | 0.7 | 0.9 | 0.3 |
| d2_continuity_first_finish | 0.5 | 0.9 | 0.1 | 0.9 | 0.5 | 0.5 | 0.7 | 0.8 | 0.9 | 0.4 |

| actionId | mission | information | navigation | logistics | resources | civilian | escalation | futureOptions | network |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a1_network_baseline | 0.3 | 0.9 | 0 | 0 | 0 | 0 | 0 | 0.5 | 0.7 |
| a1_priority_focus | 0.9 | 0.7 | 0 | 0.5 | 0 | 0 | 0 | 0 | 0.2 |
| a1_rotating_watch | 0 | 0.9 | 0 | 0.4 | 0 | 0 | 0 | 0.6 | 0.9 |
| a1_preserve_reserve | 0.3 | 0 | 0 | 0 | 0.9 | 0 | 0 | 0.9 | 0.5 |
| a2_focused_pnt | 0.5 | 0.9 | 0.7 | 0 | 0 | 0 | 0 | 0 | 0 |
| a2_broad_sweep | 0 | 0.9 | 0 | 0 | 0 | 0 | 0 | 0.5 | 0.9 |
| a2_field_radio | 0 | 0.9 | 0.6 | 0.5 | 0 | 0 | 0 | 0 | 0 |
| a2_ground_liaison | 0 | 0.9 | 0.7 | 0.6 | 0.4 | 0 | 0 | 0 | 0 |
| b1_suspect_focus | 0.6 | 0.8 | 0.6 | 0 | 0 | 0 | 0 | 0 | 0 |
| b1_priority_cargo | 0.9 | 0.5 | 0 | 0.7 | 0 | 0 | 0 | 0 | 0 |
| b1_split_attention | 0 | 0.8 | 0 | 0 | 0.5 | 0 | 0 | 0.6 | 0.9 |
| b1_pulse_network | 0 | 0.7 | 0 | 0 | 0.7 | 0 | 0 | 0.6 | 0.9 |
| b2_continue_crosscheck | 0.7 | 0.7 | 0.9 | 0 | 0 | 0 | 0 | 0.6 | 0 |
| b2_reroute | 0.8 | 0 | 0.9 | 0.9 | 0.5 | 0.6 | 0 | 0 | 0 |
| b2_staged_checkpoints | 0 | 0.6 | 0.8 | 0.9 | 0 | 0.6 | 0 | 0.8 | 0 |
| b2_hold_verify | 0.6 | 0.9 | 0 | 0.6 | 0.4 | 0 | 0 | 0.6 | 0 |
| c1_fallback_nav | 0.7 | 0 | 0.9 | 0 | 0.6 | 0 | 0 | 0.9 | 0 |
| c1_ground_recon | 0 | 0.9 | 0.7 | 0.6 | 0.5 | 0 | 0.5 | 0 | 0 |
| c1_checkpoint_spacing | 0 | 0 | 0.8 | 0.9 | 0.5 | 0.6 | 0 | 0.8 | 0 |
| c1_preserve_mobile_reserve | 0.4 | 0 | 0 | 0 | 0.9 | 0 | 0 | 0.9 | 0.6 |
| c2_isr_heavy | 0 | 0.9 | 0 | 0 | 0.8 | 0 | 0 | 0.5 | 0.6 |
| c2_mobility_heavy | 0 | 0 | 0 | 0.8 | 0.9 | 0 | 0 | 0.8 | 0.8 |
| c2_balanced | 0 | 0.5 | 0 | 0.8 | 0.9 | 0 | 0 | 0.9 | 0.9 |
| c2_priority_surge | 0.9 | 0.6 | 0 | 0 | 0.8 | 0 | 0 | 0.3 | 0.7 |
| d1_emergency_reroute | 0.8 | 0 | 0.9 | 0.9 | 0 | 0.6 | 0.6 | 0 | 0 |
| d1_ground_containment | 0.8 | 0.7 | 0 | 0.6 | 0 | 0.5 | 0.9 | 0 | 0 |
| d1_deception_routing | 0.6 | 0.4 | 0 | 0 | 0 | 0 | 0.8 | 0.8 | 0.7 |
| d1_escorted_continuation | 0.9 | 0 | 0 | 0.9 | 0.6 | 0 | 0.7 | 0 | 0 |
| d1_hold_confirm | 0.6 | 0.9 | 0.5 | 0 | 0 | 0 | 0.8 | 0.7 | 0 |
| d2_critical_delivery_surge | 0.9 | 0 | 0 | 0.8 | 0.7 | 0 | 0.5 | 0 | 0 |
| d2_network_balanced_finish | 0.7 | 0 | 0 | 0.9 | 0.8 | 0 | 0 | 0.8 | 0.9 |
| d2_resilient_handoff | 0.7 | 0 | 0.9 | 0.8 | 0.6 | 0 | 0 | 0.9 | 0 |
| d2_continuity_first_finish | 0.6 | 0 | 0 | 0.9 | 0.8 | 0 | 0 | 0.9 | 0.9 |

### S1 reason matrix and cross-decision rule

Every matrix cell is exactly the corresponding numeric profile dimension in the tables above, rather than a separate estimated coefficient. Source: `src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts:274`.

| Exact stated reason | Profile dimension supplying matrix cell |
| --- | --- |
| کسب اطلاعات بیشتر | informationSeeking |
| افزایش اطمینان درباره علت حادثه | informationSeeking |
| حفاظت از A-17 | contingencyPlanning |
| حفظ مأموریت | contingencyPlanning |
| حفظ تداوم مأموریت | contingencyPlanning |
| جلوگیری از تشدید | escalationSensitivity |
| ایجاد مسیر کاهش تنش | escalationSensitivity |
| ایجاد مسیر خروج از بحران | escalationSensitivity |
| نمایش عزم | riskExposure |
| بازدارندگی | adversaryModeling |
| حفظ هماهنگی متحدان | coalitionOrientation |
| حفظ ائتلاف | coalitionOrientation |
| انسجام ائتلاف | coalitionOrientation |
| حفظ منابع | resourceStewardship |
| صرفه‌جویی در منابع | resourceStewardship |
| حفظ منابع و قابلیت‌های آینده | resourceStewardship |
| سطح اطمینان انتساب | informationDisciplineBase |
| مشروعیت سیاسی/حقوقی | informationDisciplineBase |

Move3 uses the FIRST matching rule: insufficient threshold + public attribution=>.15; sufficient-strong threshold + contain-understand COA=>.45; negotiated de-escalation + public attribution=>.35; default .80. All three threshold/COA/info choices must be present, otherwise null. Reasons average within each represented move, then equally across represented reason moves.

### S2 all reason formula coefficients and B/C/D matrices


Source `src/ui/components/scenario/scenario-five/model/cognitive/reasonModel.ts:5` (through line 59):

```ts
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


## Exact calculation extracts for every auxiliary field

These excerpts are included to retain exact null/zero predicates, per-window fields, diagnostic source metadata, response flags, evidence relevance/shareability constants, timing formulas and audit trace coefficients alongside the compact crosswalk. They are source text, not newly implemented helpers.


Source `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:26` (through line 49):

```ts
const EPSILON = 1e-6;
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const weightedMean = (pairs: Array<[number | null | undefined, number]>) => {
  const valid = pairs.filter((pair): pair is [number, number] => pair[0] != null && Number.isFinite(pair[0]) && pair[1] > 0);
  const denominator = valid.reduce((sum, [, weight]) => sum + weight, 0);
  return denominator ? valid.reduce((sum, [value, weight]) => sum + value * weight, 0) / denominator : null;
};

export const centerAndNormalizeWithinWindow = (values: number[], selectedIndex: number) => {
  if (!values.length || selectedIndex < 0 || selectedIndex >= values.length) return null;
  const windowMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map((value) => value - windowMean);
  const maxAbsolute = Math.max(...centered.map(Math.abs));
  return maxAbsolute === 0 ? 0 : clamp(centered[selectedIndex] / maxAbsolute, -1, 1);
};

export const markerPercentForOsi = (overall: number) => ((overall + 1) / 2) * 100;
export const harmonicIntegration = (operational: number, strategic: number) =>
  operational + strategic === 0 ? 0 : (2 * operational * strategic) / (operational + strategic);
export const populationDispersion = (values: number[]) => {
  const valueMean = mean(values);
  return valueMean == null ? null : Math.sqrt(values.reduce((sum, value) => sum + (value - valueMean) ** 2, 0) / values.length);
};
```


Source `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:81` (through line 143):

```ts
const rawOrientation = (profile: CognitiveOptionProfileV3) =>
  (profile.strategicLoading - profile.operationalLoading) /
  (profile.strategicLoading + profile.operationalLoading + EPSILON);

export const adjustedOrientationForOption = (windowId: CoreDecisionWindowV3, optionId: string) => {
  const options = COGNITIVE_WINDOWS_V3[windowId];
  const selectedIndex = options.indexOf(optionId);
  return centerAndNormalizeWithinWindow(options.map((id) => rawOrientation(COGNITIVE_OPTION_PROFILES_V3[id])), selectedIndex);
};

type MetricKey = keyof Pick<CognitiveOptionProfileV3,
  "informationSeeking" | "adversaryModeling" | "escalationSensitivity" | "coalitionOrientation" |
  "reversibilityPreference" | "resourceStewardship" | "contingencyPlanning" | "riskExposure">;

const adjustedProfileMetric = (windowId: CoreDecisionWindowV3, optionId: string, key: MetricKey) => {
  const options = COGNITIVE_WINDOWS_V3[windowId];
  return centerAndNormalizeWithinWindow(options.map((id) => Number(COGNITIVE_OPTION_PROFILES_V3[id][key])), options.indexOf(optionId));
};

const evidenceMeta: Record<string, { sourceType: string; shareability: number; relevantWindows: CoreDecisionWindowV3[] }> = {
  E_BASE_01: { sourceType: "military_ssa", shareability: .65, relevantWindows: ["m1_information", "m1_communication"] },
  E_BASE_02: { sourceType: "declared_profile", shareability: .90, relevantWindows: ["m1_information", "m1_communication"] },
  E_BASE_03: { sourceType: "analysis", shareability: .45, relevantWindows: ["m1_information", "m1_communication"] },
  E_SSA_01: { sourceType: "military_ssa", shareability: .40, relevantWindows: ["m1_information", "m1_communication", "m2_investigation"] },
  E_COMM_CONFLICT_01: { sourceType: "commercial", shareability: .75, relevantWindows: ["m1_information", "m1_communication", "m2_investigation"] },
  E_M2_01: { sourceType: "mission_telemetry", shareability: .65, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_02: { sourceType: "technical", shareability: .35, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_03: { sourceType: "analysis", shareability: .40, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_TECH_STRONG: { sourceType: "technical", shareability: .35, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_TECH_INCONCLUSIVE: { sourceType: "technical", shareability: .40, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_TECH_MIXED: { sourceType: "technical", shareability: .35, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_ALLY_01: { sourceType: "ally", shareability: .55, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
  E_M2_COMM_01: { sourceType: "commercial", shareability: .80, relevantWindows: ["m2_investigation", "m2_response", "m3_info"] },
};

const entropy = (values: number[], divisor: number) => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return 0;
  return -values.reduce((sum, value) => value ? sum + (value / total) * Math.log(value / total) : sum, 0) / Math.log(divisor);
};

const latestCoreRecords = (records: ScenarioOneDecisionRecord[]) => {
  const latest = new Map<CoreDecisionWindowV3, ScenarioOneDecisionRecord>();
  for (const record of records) if (record.windowId in COGNITIVE_WINDOWS_V3) latest.set(record.windowId as CoreDecisionWindowV3, record);
  return latest;
};

const evidenceCoverageFor = (telemetry: DecisionTelemetryV3, windowId: CoreDecisionWindowV3) => {
  const available = telemetry.evidenceAvailableIds.filter((id) => evidenceMeta[id]?.relevantWindows.includes(windowId));
  if (!available.length) return null;
  const opened = new Set(telemetry.evidenceOpenedIds);
  return available.filter((id) => opened.has(id)).length / available.length;
};

const sourceDiversityFor = (telemetry: DecisionTelemetryV3, windowId: CoreDecisionWindowV3) => {
  const availableTypes = new Set(telemetry.evidenceAvailableIds.flatMap((id) => evidenceMeta[id]?.relevantWindows.includes(windowId) ? [evidenceMeta[id].sourceType] : []));
  if (!availableTypes.size) return null;
  if (availableTypes.size <= 1) return 1;
  const openedTypes = telemetry.evidenceOpenedIds.flatMap((id) => evidenceMeta[id]?.relevantWindows.includes(windowId) ? [evidenceMeta[id].sourceType] : []);
  if (!openedTypes.length) return 0;
  const counts = [...availableTypes].map((type) => openedTypes.filter((opened) => opened === type).length);
  return entropy(counts, availableTypes.size);
};
```


Source `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:145` (through line 205):

```ts
export interface EvidenceUpdateAuditV3 {
  phaseBefore: AttributionEstimateTelemetryV3["phase"];
  phaseAfter: AttributionEstimateTelemetryV3["phase"];
  playerBefore: number;
  playerAfter: number;
  evidenceBefore: number;
  evidenceAfter: number;
  dP: number;
  dE: number;
  directionAgreement: number;
  magnitudeAlignment: number;
  weight: number;
  rawScore: number;
  finalContribution: number;
}

export const calculateEvidenceUpdatingAudit = (estimates: AttributionEstimateTelemetryV3[]) => {
  if (estimates.length < 2) return { score: null, updates: [] as EvidenceUpdateAuditV3[] };
  const ordered = [...estimates].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  const updates: EvidenceUpdateAuditV3[] = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const before = ordered[index - 1];
    const after = ordered[index];
    const dP = (after.playerEstimate - before.playerEstimate) / 100;
    const dE = (after.systemEvidenceConfidence - before.systemEvidenceConfidence) / 100;
    const directionAgreement = Math.abs(dE) < .05 && Math.abs(dP) < .10 ? 1 : Math.sign(dP) === Math.sign(dE) ? 1 : Math.abs(dP) < .05 ? .5 : 0;
    const magnitudeAlignment = 1 - Math.min(Math.abs(dP - dE) / .50, 1);
    const weight = Math.max(.25, Math.min(1, Math.abs(dE) / .25));
    const rawScore = .60 * directionAgreement + .40 * magnitudeAlignment;
    updates.push({
      phaseBefore: before.phase,
      phaseAfter: after.phase,
      playerBefore: before.playerEstimate,
      playerAfter: after.playerEstimate,
      evidenceBefore: before.systemEvidenceConfidence,
      evidenceAfter: after.systemEvidenceConfidence,
      dP,
      dE,
      directionAgreement,
      magnitudeAlignment,
      weight,
      rawScore,
      finalContribution: 0,
    });
  }
  const totalWeight = updates.reduce((sum, update) => sum + update.weight, 0);
  updates.forEach((update) => { update.finalContribution = totalWeight ? update.rawScore * update.weight / totalWeight * 100 : 0; });
  const score = weightedMean(updates.map((update) => [update.rawScore, update.weight]));
  return { score: score == null ? null : score * 100, updates };
};

export const calculateEvidenceUpdating = (estimates: AttributionEstimateTelemetryV3[]) =>
  calculateEvidenceUpdatingAudit(estimates).score;

const percentile = (values: number[], fraction: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
```


Source `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:237` (through line 395):

```ts
export const interpretOrientationV3 = (overall: number | null, integration: number | null, dispersion: number | null) => {
  if (overall == null || integration == null || dispersion == null) return "داده کافی برای تفسیر ثبت نشده است";
  if (Math.abs(overall) <= .15 && integration >= 70 && dispersion <= .15) return "رویکرد یکپارچه عملیاتی–راهبردی";
  if (Math.abs(overall) <= .15 && dispersion > .15) return "جهت‌گیری وابسته به موقعیت";
  if (Math.abs(overall) <= .15 && integration < 45) return "الگوی جهت‌گیری ضعیف/نامتمایز";
  if (overall < -.45) return "گرایش عملیاتی مشخص";
  if (overall < -.15) return "تمایل عملیاتی";
  if (overall > .45) return "گرایش راهبردی مشخص";
  if (overall > .15) return "تمایل راهبردی";
  return "مرکز طیف";
};

export const calculateCognitiveModelV3 = (input: CognitiveModelV3Input): CognitiveModelV3Result => {
  const latest = latestCoreRecords(input.records);
  const telemetryByWindow = new Map(input.telemetry.map((item) => [item.windowId, item]));
  const perWindow = [...latest.entries()].map(([windowId, record]) => {
    const profile = COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId];
    const telemetry = telemetryByWindow.get(windowId);
    return { windowId, optionId: record.selectedOptionId, adjustedOsi: adjustedOrientationForOption(windowId, record.selectedOptionId), operationalLoading: profile?.operationalLoading ?? 0, strategicLoading: profile?.strategicLoading ?? 0, diagnosticWeight: profile?.diagnosticity.osi ?? 0, evidenceCoverage: telemetry ? evidenceCoverageFor(telemetry, windowId) : null };
  });
  const moveIndices = Object.values(CORE_WINDOWS_BY_MOVE).map((windows) => {
    const items = windows.map((windowId) => perWindow.find((row) => row.windowId === windowId));
    if (items.some((item) => !item || item.adjustedOsi == null)) return null;
    return weightedMean(items.map((item) => [item!.adjustedOsi, item!.diagnosticWeight]));
  });
  const completeMoves = moveIndices.every((value) => value != null);
  const overall = completeMoves ? (moveIndices[0]! + moveIndices[1]! + moveIndices[2]!) / 3 : null;
  const selectedProfiles = [...latest.values()].map((record) => COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId]).filter(Boolean);
  const operational = weightedMean(selectedProfiles.map((profile) => [profile.operationalLoading, profile.diagnosticity.osi]));
  const strategic = weightedMean(selectedProfiles.map((profile) => [profile.strategicLoading, profile.diagnosticity.osi]));
  const operationalStrength = operational == null ? null : operational * 100;
  const strategicStrength = strategic == null ? null : strategic * 100;
  const integration = operationalStrength == null || strategicStrength == null ? null : harmonicIntegration(operationalStrength, strategicStrength);
  const dispersion = completeMoves ? populationDispersion(moveIndices as number[]) : null;
  const profileScore = (getter: (profile: CognitiveOptionProfileV3) => number, diagnostic: keyof CognitiveOptionProfileV3["diagnosticity"]) => {
    const value = weightedMean(selectedProfiles.map((profile) => [getter(profile), profile.diagnosticity[diagnostic]]));
    return value == null ? null : value * 100;
  };
  const informationParts = (["m1_information", "m2_investigation"] as CoreDecisionWindowV3[]).flatMap((windowId) => {
    const record = latest.get(windowId); const telemetry = telemetryByWindow.get(windowId);
    if (!record || !telemetry) return [];
    const profile = COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId];
    const coverage = evidenceCoverageFor(telemetry, windowId); const diversity = sourceDiversityFor(telemetry, windowId);
    return coverage == null || diversity == null ? [] : [[.60 * profile.informationSeeking + .25 * coverage + .15 * diversity, profile.diagnosticity.informationSeeking] as [number, number]];
  });
  const informationSeekingRaw = weightedMean(informationParts);
  const informationDisciplineParts = (["m1_communication", "m2_response", "m3_info"] as CoreDecisionWindowV3[]).flatMap((windowId) => {
    const record = latest.get(windowId); const telemetry = telemetryByWindow.get(windowId);
    if (!record || !telemetry) return [];
    const profile = COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId];
    if (profile.claimIntensity == null || profile.disclosureIntensity == null || telemetry.systemAttributionConfidenceVisibleAtDecision == null) return [];
    const shareabilities = telemetry.evidenceAvailableIds.map((id) => evidenceMeta[id]?.shareability).filter((value): value is number => value != null);
    const shareability = mean(shareabilities); if (shareability == null) return [];
    const overclaim = Math.max(0, profile.claimIntensity - telemetry.systemAttributionConfidenceVisibleAtDecision / 100);
    const overDisclosure = Math.max(0, profile.disclosureIntensity - shareability);
    return [[clamp(1 - .70 * overclaim - .30 * overDisclosure), 1] as [number, number]];
  });
  const coalition = weightedMean([...latest.entries()].map(([windowId, record]) => [adjustedProfileMetric(windowId, record.selectedOptionId, "coalitionOrientation"), COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId].diagnosticity.coalitionOrientation]));
  const risk = weightedMean([...latest.entries()].map(([windowId, record]) => [adjustedProfileMetric(windowId, record.selectedOptionId, "riskExposure"), COGNITIVE_OPTION_PROFILES_V3[record.selectedOptionId].diagnosticity.riskPosture]));
  const userCosts = input.resourceEvents.filter((event) => event.kind === "user_cost");
  const shadow: Record<ResourceKey, number> = { ...SCENARIO4_INITIAL_RESOURCE_BASELINE };
  userCosts.forEach((event) => { shadow[event.resource] = clamp(shadow[event.resource] + event.delta, 0, SCENARIO4_INITIAL_RESOURCE_BASELINE[event.resource]); });
  const resourcePenalty = Math.min(.30, Object.entries(shadow).filter(([resource, value]) => value / SCENARIO4_INITIAL_RESOURCE_BASELINE[resource as keyof typeof shadow] < .20).length * .10);
  const stewardshipBase = weightedMean(selectedProfiles.map((profile) => [.50 * profile.resourceStewardship + .30 * profile.contingencyPlanning + .20 * profile.reversibilityPreference, profile.diagnosticity.resourceStewardship]));
  const multiDomain = profileScore((profile) => {
    const values = [profile.domainMission, profile.domainInformation, profile.domainEscalation, profile.domainCoalition, profile.domainResources, profile.domainLegitimacy, profile.domainFutureOptions];
    return entropy(values, 7) * Math.min(1, values.reduce((sum, value) => sum + value, 0) / 3.5);
  }, "multiDomain");
  const reasonAlignments = Object.entries(input.reasons).flatMap(([move, reason]) => {
    if (!reason) return [];
    const records = [...latest.values()].filter((record) => record.moveId === move);
    const values = records.map((record) => REASON_ALIGNMENT_MATRIX_V3[reason]?.[record.selectedOptionId]).filter((value): value is number => value != null);
    const result = mean(values); return result == null ? [] : [result];
  });
  const threshold = latest.get("m3_threshold")?.selectedOptionId;
  const coa = latest.get("m3_coa")?.selectedOptionId;
  const info = latest.get("m3_info")?.selectedOptionId;
  const crossRule = MOVE3_CROSS_COHERENCE_V3.rules.find((rule) =>
    (!("threshold" in rule) || rule.threshold === threshold) &&
    (!("coa" in rule) || rule.coa === coa) &&
    (!("informationPolicy" in rule) || rule.informationPolicy === info));
  const crossCoherence = !threshold || !coa || !info ? null : crossRule?.score ?? MOVE3_CROSS_COHERENCE_V3.defaultScore;
  const reasonMean = mean(reasonAlignments);
  const decisionCoherence = reasonMean == null || crossCoherence == null ? null : 100 * (.60 * reasonMean + .40 * crossCoherence);
  const coreDecisionRecords = latest.size / 9 * 100;
  const coreTelemetry = [...latest.keys()].map((windowId) => telemetryByWindow.get(windowId));
  const timingIntegrity = coreTelemetry.filter((item) => item && Number.isFinite(item.activeDecisionMs) && item.activeDecisionMs >= 0).length / 9 * 100;
  const evidenceTelemetry = coreTelemetry.filter((item) => item && Array.isArray(item.evidenceAvailableIds) && Array.isArray(item.evidenceOpenedIds)).length / 9 * 100;
  const attributionCompleteness = Math.min(3, input.attributionEstimates.length) / 3 * 100;
  const reasonCapture = (["move_1", "move_2", "move_3"] as const).filter((move) => input.reasons[move]).length / 3 * 100;
  const completeness = .50 * coreDecisionRecords + .15 * timingIntegrity + .15 * evidenceTelemetry + .10 * attributionCompleteness + .10 * reasonCapture;
  const times = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item)).map((item) => item.activeDecisionMs);
  const q1 = percentile(times, .25); const q3 = percentile(times, .75);
  const sortedTimes = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item)).sort((a, b) => a.activeDecisionMs - b.activeDecisionMs);
  const totalEvidenceDwellMs = input.telemetry.flatMap((item) => item.evidenceOpenTimeline).reduce((sum, item) => sum + (item.activeDwellMs ?? 0), 0);
  const firstToFinalChanges = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item?.firstSelectedOptionId && item.firstSelectedOptionId !== item.finalSelectedOptionId)).map((item) => ({ windowId: item.windowId, first: item.firstSelectedOptionId, final: item.finalSelectedOptionId }));
  const revisionOpportunities = coreTelemetry.filter((item): item is DecisionTelemetryV3 => Boolean(item && item.optionChangeCount > 0 && item.evidenceOpenTimeline.length > 0));
  const evidenceTriggeredRevisions = revisionOpportunities.filter((item) => item.selectionTimeline.some((selection, index) => index > 0 && item.evidenceOpenTimeline.some((evidence) => Date.parse(evidence.openedAt) <= Date.parse(selection.ts))));
  const evidenceTriggeredRevisionRate = revisionOpportunities.length ? evidenceTriggeredRevisions.length / revisionOpportunities.length * 100 : null;
  const evidenceAlignment = input.attributionEstimates.map((item) => ({ phase: item.phase, score: 100 - Math.abs(item.playerEstimate - item.systemEvidenceConfidence) }));
  const evidenceUpdatingAudit = calculateEvidenceUpdatingAudit(input.attributionEstimates);
  const selectedOrdinals = [...latest.entries()].map(([windowId, record]) => COGNITIVE_WINDOWS_V3[windowId].indexOf(record.selectedOptionId));
  const ordinalCounts = new Map<number, number>();
  selectedOrdinals.forEach((ordinal) => ordinalCounts.set(ordinal, (ordinalCounts.get(ordinal) ?? 0) + 1));
  const maxSameOrdinal = Math.max(0, ...ordinalCounts.values());
  const uniformOptionPosition = selectedOrdinals.length >= 9 && maxSameOrdinal >= 8;
  const medianActiveDecisionMs = percentile(times, .5);
  const veryLowActiveTime = medianActiveDecisionMs != null && medianActiveDecisionMs < 2_000;
  const openedEvidenceCount = new Set(input.telemetry.flatMap((item) => item.evidenceOpenedIds)).size;
  const availableEvidenceCount = new Set(input.telemetry.flatMap((item) => item.evidenceAvailableIds)).size;
  const invariantAttribution = input.attributionEstimates.length >= 3 && new Set(input.attributionEstimates.map((item) => item.playerEstimate)).size === 1;
  const minimalRevision = coreTelemetry.reduce((sum, item) => sum + (item?.optionChangeCount ?? 0), 0) === 0;
  const responseFlags: ResponseProcessFlags = {
    uniform_option_position: uniformOptionPosition,
    very_low_active_time: veryLowActiveTime,
    zero_evidence_engagement: availableEvidenceCount > 0 && openedEvidenceCount === 0,
    invariant_attribution: invariantAttribution,
    minimal_revision: minimalRevision,
    rapid_straightlining: uniformOptionPosition && veryLowActiveTime,
  };
  const activeResponseFlags = (Object.keys(responseFlags) as Array<keyof ResponseProcessFlags>).filter((key) => responseFlags[key]);
  return {
    versions: { measurementModelVersion: COGNITIVE_MODEL_VERSION, formulaVersion: COGNITIVE_FORMULA_VERSION, optionProfileVersion: OPTION_PROFILE_VERSION, scenarioContentVersion: SCENARIO_CONTENT_VERSION, expertPanelVersion: EXPERT_PANEL_VERSION, anchorTestVersion: ANCHOR_TEST_VERSION },
    orientation: {
      overall, markerPercent: overall == null ? null : markerPercentForOsi(overall),
      perMove: { move1: moveIndices[0], move2: moveIndices[1], move3: moveIndices[2] },
      operationalStrength, strategicStrength, integration, dispersion,
      dispersionLabel: dispersion == null ? "داده کافی ثبت نشده است" : dispersion <= .15 ? "جهت‌گیری نسبتاً پایدار" : dispersion <= .35 ? "جهت‌گیری وابسته به موقعیت" : "تغییر جهت محسوس میان مراحل",
      interpretation: interpretOrientationV3(overall, integration, dispersion),
    },
    scores: {
      informationSeeking: informationSeekingRaw == null ? null : informationSeekingRaw * 100,
      secondOrderThinking: profileScore((p) => .35*p.futureConsequenceThinking+.25*p.adversaryModeling+.20*p.reversibilityPreference+.20*p.resourceStewardship, "secondOrder"),
      adversaryModeling: profileScore((p) => p.adversaryModeling, "adversaryModeling"),
      escalationSensitivity: profileScore((p) => p.escalationSensitivity, "escalationSensitivity"),
      informationDiscipline: informationDisciplineParts.length ? (weightedMean(informationDisciplineParts) ?? 0) * 100 : null,
      evidenceResponsiveUpdating: evidenceUpdatingAudit.score,
      coalitionOrientation: coalition == null ? null : 50 * (coalition + 1),
      resourceStewardship: stewardshipBase == null ? null : 100 * clamp(stewardshipBase - resourcePenalty),
      planningForesight: profileScore((p) => .35*p.contingencyPlanning+.25*p.reversibilityPreference+.20*p.resourceStewardship+.20*p.futureConsequenceThinking, "planning"),
      multiDomainIntegration: multiDomain,
      riskPosture: risk,
      decisionCoherence,
    },
    dataCompleteness: { overall: completeness, components: { coreDecisionRecords, timingIntegrity, evidenceTelemetry, attributionEstimates: attributionCompleteness, reasonCapture } },
    timing: {
      medianActiveDecisionMs, iqrActiveDecisionMs: q1 == null || q3 == null ? null : q3 - q1,
      totalEvidenceDwellMs, longestDecision: sortedTimes.at(-1), shortestDecision: sortedTimes[0],
      totalRevisions: coreTelemetry.reduce((sum, item) => sum + (item?.optionChangeCount ?? 0), 0),
      revisedWindows: coreTelemetry.filter((item) => (item?.optionChangeCount ?? 0) > 0).length,
      firstToFinalChanges,
      evidenceTriggeredRevisionRate,
    },
    attribution: { evidenceAlignment, meanEvidenceAlignment: mean(evidenceAlignment.map((item) => item.score)), evidenceUpdatingAudit: evidenceUpdatingAudit.updates },
    responseProcess: { flags: responseFlags, activeFlags: activeResponseFlags, status: activeResponseFlags.length >= 2 ? "caution" : "normal" },
    perWindow,
    missingReasons: Object.entries({ coreDecisionRecords, timingIntegrity, evidenceTelemetry, attributionCompleteness, reasonCapture }).filter(([, value]) => value < 100).map(([key]) => key),
  };
};
```


Source `src/ui/components/scenario/scenario-five/model/cognitive/cognitiveEngine.ts:140` (through line 419):

```ts
const uniqueAvailableProfiles = (decision: DecisionTelemetry): OptionCognitiveProfile[] =>
  [...new Set(decision.availableActionIds)].map((actionId) => getScenario5OptionProfile(actionId));

const scoreEligible = (decision: DecisionTelemetry): boolean => decision.finalSelectedActionId !== null
  && decision.availableActionIds.includes(decision.finalSelectedActionId)
  && decision.availableActionIds.every((id) => PROFILE_IDS.has(id))
  && new Set(decision.availableActionIds).size >= 2;

export function rawOrientation(profile: OptionCognitiveProfile): number {
  return (profile.strategicLoading - profile.operationalLoading)
    / (profile.strategicLoading + profile.operationalLoading + EPSILON);
}

const adjustedRelative = (
  decision: DecisionTelemetry,
  metric: (profile: OptionCognitiveProfile) => number,
): number | null => {
  if (!scoreEligible(decision) || decision.finalSelectedActionId === null) return null;
  const profiles = uniqueAvailableProfiles(decision);
  const values = profiles.map(metric);
  const baseline = mean(values);
  const centered = values.map((value) => value - baseline);
  const maximum = Math.max(...centered.map(Math.abs));
  if (maximum < EPSILON) return null;
  return clamp((metric(getScenario5OptionProfile(decision.finalSelectedActionId)) - baseline) / maximum, -1, 1);
};

export function adjustedOrientationForDecision(decision: DecisionTelemetry): number | null {
  return adjustedRelative(decision, rawOrientation);
}

export function adjustedRiskForDecision(decision: DecisionTelemetry): number | null {
  return adjustedRelative(decision, ({ riskExposure }) => riskExposure);
}

const diagnostic = (decision: DecisionTelemetry, metric: (profile: OptionCognitiveProfile) => number): boolean => {
  if (!scoreEligible(decision)) return false;
  const values = uniqueAvailableProfiles(decision).map(metric);
  return Math.max(...values) - Math.min(...values) + EPSILON >= 0.1;
};

const phaseBalanced = (entries: readonly { phaseId: PhaseId; value: number }[]): number | null => {
  const phaseMeans = (["A", "B", "C", "D"] as const).flatMap((phaseId) => {
    const values = entries.filter((entry) => entry.phaseId === phaseId).map(({ value }) => value);
    return values.length === 0 ? [] : [mean(values)];
  });
  return phaseMeans.length === 0 ? null : mean(phaseMeans);
};

const scoreMetric = (
  decisions: readonly DecisionTelemetry[],
  windows: ReadonlySet<CognitiveWindowId>,
  metric: (profile: OptionCognitiveProfile) => number,
): number | null => {
  const entries = decisions.flatMap((decision) => {
    if (!windows.has(decision.windowId) || !diagnostic(decision, metric) || decision.finalSelectedActionId === null) return [];
    return [{ phaseId: decision.phaseId, value: metric(getScenario5OptionProfile(decision.finalSelectedActionId)) }];
  });
  const value = phaseBalanced(entries);
  return value === null ? null : 100 * clamp(value, 0, 1);
};

const OSI_WINDOWS = new Set<CognitiveWindowId>([
  "A1_baseline_monitoring", "B1_monitoring_allocation", "B2_route_policy", "C1_support_and_checkpoints",
  "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy",
]);
const INFO_WINDOWS = new Set<CognitiveWindowId>([
  "A1_baseline_monitoring", "A2_evidence_acquisition", "B1_monitoring_allocation", "B2_route_policy",
  "C1_support_and_checkpoints", "C2_resource_portfolio", "D1_crisis_response",
]);
const SECOND_ORDER_WINDOWS = OSI_WINDOWS;
const ADVERSARY_WINDOWS = new Set<CognitiveWindowId>(["C2_resource_portfolio", "D1_crisis_response"]);
const ESCALATION_WINDOWS = new Set<CognitiveWindowId>(["B2_route_policy", "D1_crisis_response", "D2_final_delivery_policy"]);
const PLANNING_WINDOWS = new Set<CognitiveWindowId>([
  "A1_baseline_monitoring", "B2_route_policy", "C1_support_and_checkpoints", "C2_resource_portfolio",
  "D1_crisis_response", "D2_final_delivery_policy",
]);
const MCI_WINDOWS = new Set<CognitiveWindowId>(["B1_monitoring_allocation", "B2_route_policy", "C2_resource_portfolio", "D1_crisis_response"]);
const RISK_WINDOWS = new Set<CognitiveWindowId>(["B2_route_policy", "C2_resource_portfolio", "D1_crisis_response", "D2_final_delivery_policy"]);
const ALL_WINDOWS = new Set<CognitiveWindowId>(EXPECTED_WINDOW_IDS);

const secondOrder = (item: OptionCognitiveProfile): number => .35 * item.futureConsequenceThinking
  + .25 * item.adversaryModeling + .2 * item.reversibilityPreference + .2 * item.resourceStewardship;
const stewardship = (item: OptionCognitiveProfile): number => .5 * item.resourceStewardship
  + .3 * item.contingencyPlanning + .2 * item.reversibilityPreference;
const planning = (item: OptionCognitiveProfile): number => .35 * item.contingencyPlanning
  + .25 * item.reversibilityPreference + .2 * item.resourceStewardship + .2 * item.futureConsequenceThinking;
export const DOMAIN_ORDER: readonly DomainSalienceId[] = [
  "mission", "information", "navigation", "logistics", "resources", "civilian", "escalation", "futureOptions", "network",
];
export function multiCriteriaForProfile(item: OptionCognitiveProfile): number | null {
  const values = DOMAIN_ORDER.map((key) => item.domainSalience[key] ?? 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= EPSILON) return null;
  const entropy = -values.reduce((sum, value) => value <= 0 ? sum : sum + (value / total) * Math.log(value / total), 0) / Math.log(9);
  return clamp(entropy * (total / 9), 0, 1);
}

export function calculateIntegration(operationalStrength: number | null, strategicStrength: number | null): number | null {
  if (operationalStrength === null || strategicStrength === null) return null;
  const denominator = operationalStrength + strategicStrength;
  return denominator === 0 ? null : clamp(2 * operationalStrength * strategicStrength / denominator, 0, 100);
}

const orientationResult = (decisions: readonly DecisionTelemetry[]) => {
  const entries = decisions.flatMap((decision) => {
    if (!OSI_WINDOWS.has(decision.windowId)) return [];
    const value = adjustedOrientationForDecision(decision);
    return value === null ? [] : [{ phaseId: decision.phaseId, value }];
  });
  const byPhase = (["A", "B", "C", "D"] as const).map((phaseId) => {
    const values = entries.filter((entry) => entry.phaseId === phaseId).map(({ value }) => value);
    return values.length === 0 ? null : clamp(mean(values), -1, 1);
  }) as [number | null, number | null, number | null, number | null];
  const overall = byPhase.every((value): value is number => value !== null) ? clamp(mean(byPhase), -1, 1) : null;

  const rawEntries = decisions.flatMap((decision) => {
    if (!OSI_WINDOWS.has(decision.windowId) || !scoreEligible(decision) || decision.finalSelectedActionId === null) return [];
    return [{ phaseId: decision.phaseId, profile: getScenario5OptionProfile(decision.finalSelectedActionId) }];
  });
  const strength = (key: "operationalLoading" | "strategicLoading"): number | null => {
    const value = phaseBalanced(rawEntries.map(({ phaseId, profile }) => ({ phaseId, value: profile[key] })));
    return value === null ? null : clamp(100 * value, 0, 100);
  };
  const operationalStrength = strength("operationalLoading");
  const strategicStrength = strength("strategicLoading");
  const integration = calculateIntegration(operationalStrength, strategicStrength);
  const availablePhases = byPhase.filter((value): value is number => value !== null);
  const dispersion = availablePhases.length < 2
    ? null
    : Math.sqrt(mean(availablePhases.map((value) => (value - mean(availablePhases)) ** 2)));
  return { overall, operationalStrength, strategicStrength, integration, dispersion, phaseScores: byPhase };
};

const informationSeeking = (bundle: Scenario5CognitiveTelemetryBundle): number | null => {
  const evidenceById = new Map(bundle.evidence.map((item) => [item.evidenceId, item]));
  const entries = bundle.decisions.flatMap((decision) => {
    if (!INFO_WINDOWS.has(decision.windowId) || !scoreEligible(decision) || decision.finalSelectedActionId === null) return [];
    const relevant = decision.confirmedAtMs === null ? [] : bundle.evidence.filter((item) =>
      item.relevantWindowIds.includes(decision.windowId) && item.availableAtMs <= decision.confirmedAtMs!);
    const relevantIds = new Set(relevant.map(({ evidenceId }) => evidenceId));
    const openedIds = new Set(bundle.evidenceOpens.filter((opened) =>
      opened.windowId === decision.windowId
      && relevantIds.has(opened.evidenceId)
      && decision.enteredAtMs !== null
      && decision.confirmedAtMs !== null
      && opened.openedAtMs >= decision.enteredAtMs
      && opened.openedAtMs <= decision.confirmedAtMs).map(({ evidenceId }) => evidenceId));
    const selected = getScenario5OptionProfile(decision.finalSelectedActionId);
    if (!diagnostic(decision, ({ informationSeeking: value }) => value) && relevant.length === 0) return [];
    const components: { weight: number; value: number }[] = [{ weight: .6, value: selected.informationSeeking }];
    if (relevant.length > 0) {
      components.push({ weight: .25, value: openedIds.size / new Set(relevant.map(({ evidenceId }) => evidenceId)).size });
      const availableSources = new Set(relevant.map(({ sourceType }) => sourceType));
      let diversity = 0;
      if (openedIds.size > 0 && availableSources.size === 1) diversity = 1;
      else if (openedIds.size > 0 && availableSources.size >= 2) {
        const counts = new Map<string, number>();
        for (const id of openedIds) {
          const source = evidenceById.get(id)?.sourceType;
          if (source) counts.set(source, (counts.get(source) ?? 0) + 1);
        }
        diversity = -[...counts.values()].reduce((sum, count) => {
          const proportion = count / openedIds.size;
          return sum + proportion * Math.log(proportion);
        }, 0) / Math.log(availableSources.size);
      }
      components.push({ weight: .15, value: clamp(diversity, 0, 1) });
    }
    const weighted = components.reduce((sum, component) => sum + component.weight * component.value, 0)
      / components.reduce((sum, component) => sum + component.weight, 0);
    return [{ phaseId: decision.phaseId, value: weighted }];
  });
  const value = phaseBalanced(entries);
  return value === null ? null : 100 * clamp(value, 0, 1);
};

const resourceStewardship = (bundle: Scenario5CognitiveTelemetryBundle): number | null => {
  if (bundle.decisions.length !== 8 || EXPECTED_WINDOW_IDS.some((windowId) => {
    const decision = bundle.decisions.find((item) => item.windowId === windowId);
    return !decision || decision.playerVisibleResourcesBefore === null || decision.playerVisibleResourcesAfter === null;
  })) return null;
  const base = scoreMetric(bundle.decisions, ALL_WINDOWS, stewardship);
  if (base === null) return null;
  const final = bundle.decisions.find(({ windowId }) => windowId === "D2_final_delivery_policy")!.playerVisibleResourcesAfter!;
  const penalty = .05 * Number(final.isrCapacity <= 5) + .05 * Number(final.supportReserve <= 5);
  return 100 * clamp(base / 100 - penalty, 0, 1);
};

const multiDomainIntegration = (decisions: readonly DecisionTelemetry[]): number | null => {
  const metric = (item: OptionCognitiveProfile): number => multiCriteriaForProfile(item) ?? 0;
  return scoreMetric(decisions, MCI_WINDOWS, metric);
};

const riskPosture = (decisions: readonly DecisionTelemetry[]): number | null => {
  const entries = decisions.flatMap((decision) => {
    if (!RISK_WINDOWS.has(decision.windowId)) return [];
    const value = adjustedRiskForDecision(decision);
    return value === null ? [] : [{ phaseId: decision.phaseId, value }];
  });
  const value = phaseBalanced(entries);
  return value === null ? null : clamp(value, -1, 1);
};

const decisionCoherence = (bundle: Scenario5CognitiveTelemetryBundle): number | null => {
  const windows = { B: ["B1_monitoring_allocation", "B2_route_policy"], C: ["C1_support_and_checkpoints", "C2_resource_portfolio"], D: ["D1_crisis_response", "D2_final_delivery_policy"] } as const;
  const phases = (["B", "C", "D"] as const).flatMap((phaseId) => {
    const reason = bundle.reasons.find((item) => item.phaseId === phaseId && item.capturedBeforeOutcome);
    const first = bundle.decisions.find((item) => item.windowId === windows[phaseId][0]);
    const second = bundle.decisions.find((item) => item.windowId === windows[phaseId][1]);
    if (!reason || !first?.finalSelectedActionId || !second?.finalSelectedActionId) return [];
    const cross = getCrossDecisionCoherence(phaseId, first.finalSelectedActionId, second.finalSelectedActionId);
    if (cross === null) return [];
    return [{
      reason: mean([
        calculateReasonAlignment(first.finalSelectedActionId, reason.reasonId),
        calculateReasonAlignment(second.finalSelectedActionId, reason.reasonId),
      ]),
      cross,
    }];
  });
  if (phases.length < 2) return null;
  return 100 * clamp(.6 * mean(phases.map(({ reason }) => reason)) + .4 * mean(phases.map(({ cross }) => cross)), 0, 1);
};

export function calculateDataCompleteness(bundle: Scenario5CognitiveTelemetryBundle): DataCompletenessResult {
  const evidenceIds = new Set(bundle.evidence.map(({ evidenceId }) => evidenceId));
  const validDecisions = bundle.decisions.filter((decision) => {
    const expected = EXPECTED_WINDOWS[decision.windowId];
    return expected && expected.phaseId === decision.phaseId && expected.roundId === decision.roundId
      && decision.finalSelectedActionId !== null && decision.availableActionIds.includes(decision.finalSelectedActionId);
  }).length;
  const timingComplete = bundle.decisions.filter((decision) =>
    finiteNonnegative(decision.enteredAtMs) && finiteNonnegative(decision.confirmedAtMs)
    && finiteNonnegative(decision.elapsedMs) && finiteNonnegative(decision.activeDecisionMs)
    && finiteNonnegative(decision.hiddenTabMs) && decision.confirmedAtMs >= decision.enteredAtMs).length;
  const evidenceComplete = bundle.decisions.filter((decision) =>
    decision.availableEvidenceIds.every((id) => evidenceIds.has(id))
    && decision.openedEvidenceIds.every((id) => evidenceIds.has(id) && decision.availableEvidenceIds.includes(id))).length;
  const validBeliefs = bundle.beliefs.filter((belief) => BELIEF_IDS.has(belief.checkpointId)
    && [belief.corridorConfidence, belief.targetedInterferenceEstimate, belief.targetedInterferenceConfidence]
      .every((value) => Number.isFinite(value) && value >= 0 && value <= 100)).length;
  const validReasons = bundle.reasons.filter((reason) => REASON_IDS.has(reason.reasonId) && reason.capturedBeforeOutcome).length;
  const decisions = 100 * validDecisions / 8;
  const timing = 100 * timingComplete / 8;
  const evidence = 100 * evidenceComplete / 8;
  const estimates = 100 * validBeliefs / 4;
  const reasons = 100 * validReasons / 3;
  return { overall: clamp(.5 * decisions + .15 * timing + .15 * evidence + .1 * estimates + .1 * reasons, 0, 100), decisions, timing, evidence, estimates, reasons };
}

const quantile = (sorted: readonly number[], probability: number): number => {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower]! + (index - lower) * (sorted[upper]! - sorted[lower]!);
};

export function calculateTelemetrySummary(bundle: Scenario5CognitiveTelemetryBundle): TelemetrySummaryResult {
  const activeTimes = bundle.decisions.map(({ activeDecisionMs }) => activeDecisionMs)
    .filter(finiteNonnegative).sort((left, right) => left - right);
  const medianActiveDecisionMs = activeTimes.length === 0 ? null : quantile(activeTimes, .5);
  const iqrActiveDecisionMs = activeTimes.length === 0 ? null : quantile(activeTimes, .75) - quantile(activeTimes, .25);
  const totalRevisions = bundle.decisions.reduce((sum, { revisionCount }) => sum + revisionCount, 0);
  const revisedWindows = bundle.decisions.filter(({ revisionCount }) => revisionCount > 0).length;
  const eligible = bundle.decisions.filter((decision) => {
    const firstSelectionAt = decision.selectionHistory[0]?.selectedAtMs;
    return firstSelectionAt !== undefined && decision.confirmedAtMs !== null && bundle.evidenceOpens.some((opened) =>
      opened.windowId === decision.windowId && opened.openedAtMs > firstSelectionAt! && opened.openedAtMs < decision.confirmedAtMs!);
  });
  const triggered = eligible.filter((decision) =>
    decision.firstSelectedActionId !== null && decision.firstSelectedActionId !== decision.finalSelectedActionId).length;
  return {
    medianActiveDecisionMs,
    iqrActiveDecisionMs,
    totalRevisions,
    revisedWindows,
    evidenceTriggeredRevisionRate: eligible.length === 0 ? null : 100 * triggered / eligible.length,
  };
}
```


Source `src/ui/components/scenario/scenario-five/model/cognitive/evidenceScoring.ts:3` (through line 51):

```ts
const STRENGTH = { weak: 0.25, moderate: 0.6, strong: 0.9 } as const;
const DIRECTION = { supports_targeted: 1, ambiguous: 0, supports_nonhostile: -1 } as const;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));

export function calculatePlayerVisibleEvidenceSupport(
  evidence: readonly EvidenceTelemetry[],
  visibleEvidenceIds: readonly string[],
): number {
  const visible = new Set(visibleEvidenceIds);
  const byCorridor = new Map<string, Map<string, number>>();
  for (const item of evidence) {
    if (!visible.has(item.evidenceId) || item.observedCorridorId === null) continue;
    const signed = STRENGTH[item.strengthBand] * DIRECTION[item.direction];
    const bySource = byCorridor.get(item.observedCorridorId) ?? new Map<string, number>();
    const existing = bySource.get(item.sourceType);
    if (existing === undefined || Math.abs(signed) > Math.abs(existing)) bySource.set(item.sourceType, signed);
    byCorridor.set(item.observedCorridorId, bySource);
  }
  if (byCorridor.size === 0) return 0.5;
  return Math.max(...[...byCorridor.values()].map((sources) => {
    const values = [...sources.values()];
    const signedMean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return clamp(0.5 + 0.5 * signedMean, 0, 1);
  }));
}

const CHECKPOINT_ORDER = ["A2_prebelief", "A2_postbelief", "C_belief_checkpoint", "D_final_belief"] as const;

export function calculateEvidenceResponsiveUpdating(
  beliefs: readonly BeliefTelemetry[],
  evidence: readonly EvidenceTelemetry[],
): number | null {
  const byCheckpoint = new Map(beliefs.map((item) => [item.checkpointId, item]));
  const scores: number[] = [];
  for (let index = 0; index < CHECKPOINT_ORDER.length - 1; index += 1) {
    const before = byCheckpoint.get(CHECKPOINT_ORDER[index]!);
    const after = byCheckpoint.get(CHECKPOINT_ORDER[index + 1]!);
    if (!before || !after) continue;
    const beforeSupport = calculatePlayerVisibleEvidenceSupport(evidence, before.visibleEvidenceIdsAtCheckpoint);
    const afterSupport = calculatePlayerVisibleEvidenceSupport(evidence, after.visibleEvidenceIdsAtCheckpoint);
    const beliefDelta = after.targetedInterferenceEstimate / 100 - before.targetedInterferenceEstimate / 100;
    const evidenceDelta = afterSupport - beforeSupport;
    if (Math.abs(evidenceDelta) <= 1e-9) continue;
    const directionAgreement = Math.sign(beliefDelta) === Math.sign(evidenceDelta) && Math.abs(beliefDelta) > 1e-9 ? 1 : 0;
    const magnitudeAlignment = 1 - Math.min(Math.abs(beliefDelta - evidenceDelta) / 0.5, 1);
    scores.push(0.6 * directionAgreement + 0.4 * magnitudeAlignment);
  }
  return scores.length === 0 ? null : 100 * scores.reduce((sum, value) => sum + value, 0) / scores.length;
}
```
