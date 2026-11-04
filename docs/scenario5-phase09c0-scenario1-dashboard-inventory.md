# Phase 09C-0 — current Scenario 1 and App dashboard inventory

Read-only factual inventory after 08D.2. Screenshots are from an actual UI run using the repository's existing valid test profile/flow; no metric data, resource state or decision-result fixtures were injected. No dashboard design is proposed.

## Identity and distinct reports

The player-facing released Scenario 1 is **object id=4**, tree `s4_redesigned_scenario_one`, released title «۱ — حریم خاکستری مدار». `src/App.tsx:183–190` maps IDs to tree strings; lines 303–337 define released IDs `[0,4,5]`, display titles and catalog numbering. Internal id=1 (`s1_shadows_low_orbit`) is a legacy scenario exposed in the full test catalog. Internal id=5 is released Scenario 2. These identities are not interchangeable.

Route: catalog id=4 → `src/scenarios/index.ts` → `src/scenarios/s4_redesigned_scenario_one/tree.ts` start mini-game `s4_redesigned_scenario_one_move1` → `ScenarioRunner.tsx:534` `MiniGameHost` → `MiniGameHost.tsx:649–663` → `ScenarioFourRedesignedScenarioOne`. The report/dashboard components are local functions inside `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx` (abbreviated **S4 UI** below), not a generic `DashboardLayout` route.

| Surface | Actual implementation and input | Entry/exit and distinction |
|---|---|---|
| Scenario-specific final report | S4 UI:2748–2780, local phase `final_report`; finalSnapshot end state/narrative/visible final state/playerFacingReport | Move-3 update → report button. Mission outcome without raw hidden-truth revelation. Report sections are narrative, not cognitive dimensions. Button enters AAR and logs `s1_aar_open`. |
| Mission AAR | S4 UI:2799 onward, phase `aar` | Post-game truth/attribution analysis, including Brier comparisons. This is distinct from the player cognitive dashboard. AAR CTA at 2917 logs `s4_cognitive_dashboard_view`, enters dashboard. No AAR screenshot exposing raw truth was taken. |
| Scenario-specific cognitive visualization | Local `CognitiveDashboard`, S4 UI:1064–1283; invoked at 2783–2796 with move1/2/3 records, finalSnapshot, resourceEvents, isAdmin | Phase `dashboard`. `cognitiveV3 = finalSnapshot.cognitiveScoresV3 as unknown as CognitiveModelV3Result` at 1080. End button calls onComplete. This is a run-specific Cognitive V3 report. |
| General App user analytics | `src/App.tsx:1273–2351`, `renderAdminAnalytics`, `buildInsights`, `buildCognitiveInsights`, `buildS1Analytics` | Main menu → profile management → existing admin login → dashboard. Back returns profile management. Tabs «بینش کلی»، «بررسی آماری»، «بررسی شناختی». Event-log heuristics, not S4/S5 V3 result rendering. |

## S4 cognitive visualizations and measures

Model type is `src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:216–225`, `CognitiveModelV3Result`; calculator starts at 249. The real captured run reports measurement `s4-cog-v3`, formula `3.0.0`. The dashboard's cast at S4 UI:1080 is a source fact, not a runtime schema validation step. Public source expressions and exact help text for all twelve dimensions are extracted in the appended table.

| Group / exact visible label | Source at S4 UI; units/range | Rendering, null and help behavior |
|---|---|---|
| «طیف جهت‌گیری تصمیم عملیاتی–راهبردی در این اجرا» / «شاخص کل» | 1082,1128–1141: `cognitiveV3.orientation.overall`, [-1,1], marker `orientation.markerPercent` [0,100] | CSS spectrum, explicit `dir=ltr`, signed 2-decimal number; null shows «داده کافی برای این شاخص ثبت نشده است.» and no marker. Existing band and interpretation strings appear. Help says operational/strategic does not itself mean right/wrong or good/bad. |
| «مرحله ۱»، «مرحله ۲»، «مرحله ۳» | 1083–1087,1144: `orientation.perMove.move1/move2/move3`, [-1,1] | Inline 2-decimal values; null → «داده ناکافی». |
| «قدرت عملیاتی»، «قدرت راهبردی»، «یکپارچگی عملیاتی–راهبردی» | 1150–1152: orientation operationalStrength/strategicStrength/integration, [0,100] | Numeric cards, rounded 0 decimals, `/100`; null → em dash. |
| Dynamic `orientation.dispersionLabel` | 1153: `orientation.dispersion`, population SD [0,1] | 2-decimal card; null → em dash. Existing conditional contextual-orientation sentence at 1157 when dispersion>.15 and abs(overall)<=.15. |
| «کامل‌بودن داده» | 1154: `dataCompleteness.overall`, [0,100]% | 0-decimal card, absent result → em dash. |
| «وضعیت اعتبار مدل: در حال اعتبارسنجی» | 1155 | Hardcoded «آزمایشی», not an inferred score. Proxy boundary at 1160 says these are this-run patterns, not personality diagnosis/definitive psychometrics. |
| «شاخص‌های رفتاری تصمیم‌گیری» | 1094–1107,1163–1172: 12 scores | CSS bars + numeric values + inline small help and native title. Null → 0-width bar **with explicit insufficient-data text**. Risk is displayed as `(rawSignedRisk+1)*50`; other dimensions use their 0–100 results. |
| «میانه زمان فعال تصمیم»، «دامنه میان‌چارکی» | 1177: `timing.medianActiveDecisionMs/iqrActiveDecisionMs` | Core-decision descriptive times converted ms→seconds, 1 decimal; null → insufficient data. Heading says nine core decision points. |
| «بازنگری انتخاب»، number of «پنجره» | 1177: `timing.totalRevisions`, `timing.revisedWindows` | Counts, optional missing result falls back to 0. |
| «شواهد بازشده» | 1089–1093,1177: unique union of move1/2/3 `.evidenceSeen` | Count, set-based distinct IDs. |
| «زمان مطالعه فعال شواهد» | 1178: `timing.totalEvidenceDwellMs` | ms→seconds, 1 decimal; absent/null uses 0. Help says reaction time is descriptive and not part of orientation/decision quality. |
| «طولانی‌ترین تصمیم»، «کوتاه‌ترین تصمیم» | 1179: `timing.longestDecision/shortestDecision` windowId+activeDecisionMs | Named window and seconds, or insufficient data. |
| «تغییر انتخاب اول تا نهایی» | 1180: `timing.firstToFinalChanges.length` | Count of changed windows, missing → 0. |
| «نرخ بازنگری پس از مشاهده شواهد مرتبط» | 1180: `timing.evidenceTriggeredRevisionRate`, [0,100]% | 0 decimals, null → «داده کافی ثبت نشده است». |
| «وضعیت پایانی» | 1181: `END_STATE_LABELS_FA[finalSnapshot.primaryEndState]` | Mission end-state enum label, not a cognitive scalar. |
| «مسیر اطمینان انتساب» | 1184–1191: move2.attributionEstimatePre/Post, move3.playerAttributionEstimateFinal | Three 0–100 estimates positioned on CSS line; help calls these player's estimates, not correctness before AAR. |
| «هم‌سویی برآورد با قدرت شواهد قابل مشاهده» | 1191: `attribution.meanEvidenceAlignment`, [0,100] | 0 decimals `/100`, null → insufficient data. Source uses visible system evidence confidence, not hidden cause. |
| «زمان تصمیم و بازنگری» | 1194–1204: all move records, `telemetryV3?.activeDecisionMs ?? responseTimeMs`, `changeCount` | CSS per-window bars, normalized against max with 4% minimum width; numeric seconds and revisions still explicit. Includes auxiliary windows, not only the nine core windows. Real run has 13 telemetry records. |
| «کمترین ذخیره پایانی» | 1115–1123,1209: min(finalState.resources) | Numeric normalized capacity [0,100]. |
| «پرفشارترین منبع» | same,1210: smallest final resource / initial baseline | Resource name, not min absolute value. |
| «ورود به سطح بحرانی» | 1211: any final resource <30 | «بله»/«خیر»; this checks final values, despite the label wording. |
| «مصرف مستقیم انتخاب‌ها»، «بازیابی بین مراحل» | 1212–1213: sums of resourceAccounting.userSpent/recovered | Nonnegative resource units; missing accounting maps use empty map→0. |
| «مسیر منابع»: «ظرفیت SSA»، «ظرفیت حفاظتی»، «سرمایه سیاسی»، «ظرفیت افشای امن» | 1216–1248: resources.ssaCapacity/protectiveCapacity/politicalCapital/disclosureBudget at move1.before, move1.after, move2.after, move3.after | Four HTML/CSS stage-bar paths, each `/100`, labels «شروع» and «پس از مرحله ۱/۲/۳»; signed interstage deltas, first «مقدار اولیه», zero «بدون تغییر». No missing-state fallback here. |
| «علت تغییرات اصلی منابع» | 1251–1262: resourceEvents filtered by resource, delta+rationale | Native details disclosure; no events→«بدون تغییر». Warning at 1263: resources are scenario-normalized capacities, not empirical national/organizational capability estimates. |

Existing labels are not harmonized in this audit. `metricLabel` at S4 UI:1049 uses <30 «پایین», <55 «متوسط», <75 «نسبتاً بالا», otherwise «بالا». `operationalStrategicBand` at 1055 uses <-.45 «گرایش عملیاتی مشخص», <-.15 «تمایل عملیاتی», <=.15 «مرکز طیف», <=.45 «تمایل راهبردی», otherwise «گرایش راهبردی مشخص»; null «داده کافی ثبت نشده». These are existing presentation thresholds only.

The persistent side panel also renders seven `finalState.visible` measures: «تداوم مأموریت»، «آگاهی موقعیتی»، «فشار تشدید»، «آمادگی عملیاتی»، «انسجام ائتلاف»، «ردپای اطلاعاتی»، «مشروعیت راهبردی» (StatusPanel, S4 UI:421–464). Bars use 0–100 underlying values; text uses `qualitativeStatus` rather than numeric score. Source-native tooltips are extracted below. ResourcePanel at 466–535 renders the same four resource capacities, numeric `/100`, status tone, recent delta and warnings. These mission/resource displays are distinct from cognitive constructs. Final report at 2756–2758 includes qualitative mission/coalition/escalation, while `playerFacingReport` provides titled narrative sections.

Admin-only S4 methodology at 1265–1278 adds model/formula/profile/anchor/expert versions, oldOSI/V2/V3, response-process status/flags, ERU audit, construct-distribution warnings, perWindow, completeness/missingReasons, full cognitive result and raw telemetry. It does not appear for the captured player. The source does return a S4 per-window cognitive trace; the S5 result does not.

## General App dashboard: data and semantics

`renderAdminAnalytics` requires admin. It loads `eventLogger.getEvents()` (App:1287), filters by selected user ID, then optionally selects a synthetic scenario run by scenario ID and timestamp interval (1293–1344). Synthetic IDs are `${scenarioId}::${attempt}`; they are not detail.runId. Only runs closed by scenario_end or scenario_exit enter its list. Unknown selected run falls back to all events in the selected-user scope. Overview ignores run selection. Filter and tab state are React state, not URL routes/persisted report state.

`buildInsights` (App:582 onward) reports quiz/option-confirm accuracy, question times, references, scenario_end durations and counts. No scored events produces zero accuracy/time. `buildCognitiveInsights` (710–982) is a generic heuristic over scored option/minigame events, explanations/references, revisions and exits. It does **not** consume S4 `cognitiveScoresV3` or S5 `result.cognitive`. Thus a completed active-S4 run with no qualifying scored quiz events can show 0% accuracy, 0 seconds and «مردد/نیازمند آموزش»; that is what the genuine global screenshot shows (95 filtered events), not a substituted S4 V3 score.

The general dashboard's sections named «سناریو ۱» are **legacy internal id=1**: `buildS1Analytics` at 1381 filters `s1_cognitive_summary` / `s1_decision` specifically with `scenarioId==='s1_shadows_low_orbit'`; `isS1RunSelected` at 1511 checks the same ID. The released id=4 cognitive dashboard is separate. Conditional legacy sections are not fabricated in screenshots of the active-S4 run; their source-only inventory is still included below.

Relevant current heuristic formulas: overallAccuracy=correct/scored*100 or 0; decisionSpeedSec is rounded mean of positive responseTimeMs/elapsedMs, or 0. Hesitation=(hesitant nodes+changed mini cards+opened explanations)/max(scored,1)*100. Change/reference rates similarly use counts and max denominator; some rates can exceed 100 and are not globally clamped. Successful-revision, explanation, overconfidence, productive-hesitation and unfinished-exit rates use their own event denominators, zero when no qualifying events. GuidanceBenefit is the accuracy difference with/without explanations, clamped [-100,100], zero unless both groups exist. Concept friction is rounded/clamped [0,100]: .35*miniWrongRate+.25*explanationUsage+.2*min(100,meanResponseMs/100)+.2*min(100,miniChangeRate). Estimated load is rounded/clamped [0,100] from .25*hesitation+.2*answerChange+.15*reference+.2*exit+.2*friction+.15*overconfidence plus the existing long-think error term. App:942 categorizes fast as 0<speed<=2 seconds and accurate as accuracy>=70, producing four speed/accuracy and style labels. These formulas and labels are observed code, not validated construct equivalence.

Exact card labels/expressions and all chart markup/help are extracted below. Charts comprise CSS bars/conic-gradient accuracy pies, SVG timing lines and legacy exposure scatterplots, and a nine-axis SVG heuristic radar. `buildRadarAxes` is transcribed exactly below: every axis is a clamped/rounded weighted heuristic. The radar can yield high axes from subtraction/default-zero even without scored decisions. Raw event table at App:2218 is a separate admin-only log disclosure; screenshots did not expand private record data. Array charts use existing empty messages; cards often use numeric zero defaults instead of null. The CSV records scalar range/unit and null behavior per card group without treating unchecked legacy log numbers as guaranteed bounded measurements.

## Lifecycle, styling and accessibility facts

S4 UI:1311 initializes phase to intro_title, decisions to empty and finalSnapshot to null. It reads only the unscoped run identifier key `space-war.scenario4.redesigned-s1.run` (1313–1325). Move/final snapshots and final cognitive result are written to localStorage around 1991–2028, but those saved snapshots do not rehydrate this component's phase/result on reload. The completion button delegates onComplete to MiniGameHost/ScenarioRunner. The exit dialog's «ذخیره و خروج» similarly exits; a saved snapshot does not itself implement visual resume. Local run/snapshot keys are not user-scoped. General event analytics persists separately under `space-war.analytics.events`, with profile IDs on each entry; see routing audit for filtering and completion lifecycle.

Styles are CSS/HTML/SVG in the repo, with no chart library for these surfaces. S4 local primitives are `Card`, `S4Header`, `StatusPanel`, `ResourcePanel`, `CognitiveDashboard`; only the outer scenario is exported. This is an inventory of current boundaries, not a recommendation to extract/reuse them. `ScenarioFourRedesignedScenarioOne.css:1` sets RTL shell, max-width 1720 and overflow-x clip. Dashboard selectors at 1065 onward include `.s4-spectrum`, `.s4-per-move`, `.s4-bars`, `.s4-attribution-line`, `.s4-resource-paths`; responsive ranges include 1536+,1280–1535,1024–1279,<1024,<768 and reduced-motion handling near 1829. App uses `.analytics-*` CSS and inline SVG/CSS values. `index.css:1–26` and `App.css:1–22` both define root tokens; they have different root/panel values, so a single universal token value is not assumed. Shared names include --bg-root, --bg-main, --bg-panel, --border-soft, --accent #38bdf8, --text-main, --text-muted; App adds --accent-danger and --shadow-soft. Body font includes Vazirmatn.

Native buttons/selects/details/summary provide existing keyboard primitives; App filters have explicit htmlFor/id labels. S4 spectrum has explicit LTR direction within RTL; resources use bdi/dir=ltr for numbers. Metric help is a native title plus visible small text, without a bespoke keyboard tooltip component. Bars have explicit neighboring value text, but source CSS div/i bars do not declare ARIA progressbar semantics. Source SVG markup and current labels are recorded, without asserting a full accessibility certification. Nested scrolling in the actual screenshots is part of the current layout.

## Genuine browser evidence

`scenario5-phase09c0-scenario1-screenshots/inspection.json` records actual DOM text, filters, viewport and screenshot names. Seven 1440×900 captures cover final report, S4 cognitive dashboard, descriptive telemetry, resources, and all three global tabs. Actual run ID and model versions are in that inspection JSON. The run contains nine core decisions and thirteen total telemetry records including auxiliary windows. Existing valid test-player profile was used; no new result fixture or resource override was used. Existing admin test credentials were read from the repository harness and are not copied into audit artifacts. Captures do not expose raw hidden-world/actor fields. Source-only legacy charts are explicitly distinguished from reachable active-S4 evidence.

The remaining sections below are direct AST/source extractions. Source expressions are lexical aliases in their respective components, not invented persisted properties.

## Extracted twelve S4 dimensions and exact help

| Visible label | Actual render expression | Source line | Exact inline/native-title help |
| --- | --- | --- | --- |
| جست‌وجوی اطلاعات | cognitiveV3?.scores.informationSeeking ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1095 | میزان استفاده از مسیرهای اطلاعاتی و شواهد مرتبط در تصمیم‌های این اجرا. |
| تفکر مرتبه دوم | cognitiveV3?.scores.secondOrderThinking ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1096 | میزان توجه انتخاب‌ها به پیامد مرحله بعد، واکنش اسرائیل و حفظ گزینه‌های آینده. |
| مدل‌سازی اسرائیل | cognitiveV3?.scores.adversaryModeling ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1097 | میزان توجه تصمیم‌ها به اینکه اسرائیل چه چیزی را مشاهده و چگونه تفسیر می‌کند. |
| حساسیت به تشدید | cognitiveV3?.scores.escalationSensitivity ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1098 | میزان وزنی که تصمیم‌ها به پیامدهای تشدید یا کاهش تنش داده‌اند؛ مقدار بالاتر الزاماً بهتر نیست. |
| پرهیز از ادعای فراتر از شواهد | cognitiveV3?.scores.informationDiscipline ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1099 | تناسب شدت ادعا و افشای اطلاعات با قدرت شواهد موجود در زمان تصمیم. این شاخص بیشتر بر جلوگیری از ادعای بیش از شواهد تمرکز دارد و به‌تنهایی میزان استفاده مؤثر از اطلاعات را نمی‌سنجد. |
| به‌روزرسانی مبتنی بر شواهد | cognitiveV3?.scores.evidenceResponsiveUpdating ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1100 | میزان همسویی تغییر برآورد شما با تغییر شواهد در دسترس. |
| گرایش ائتلافی | cognitiveV3?.scores.coalitionOrientation ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1101 | جایگاه نسبی انتخاب‌ها از یک‌جانبه‌تر تا ائتلافی‌تر نسبت به گزینه‌های موجود. |
| مدیریت منابع | cognitiveV3?.scores.resourceStewardship ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1102 | حفظ ظرفیت‌ها بر اساس هزینه مستقیم انتخاب‌های کاربر، بدون امتیازدادن به بازیابی بازیگران. |
| برنامه‌ریزی و آینده‌نگری | cognitiveV3?.scores.planningForesight ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1103 | این شاخص یک پروکسی رفتاری از برنامه‌ریزی در همین سناریو است و جایگزین آزمون مستقل کارکرد برنامه‌ریزی نیست. |
| یکپارچه‌سازی چندمعیاره | cognitiveV3?.scores.multiDomainIntegration ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1104 | میزان پوشش هم‌زمان حوزه‌های مأموریت، اطلاعات، منابع، ائتلاف، مشروعیت و آینده در انتخاب‌ها. |
| گرایش به پذیرش ریسک | cognitiveV3?.scores.riskPosture == null ? null : (cognitiveV3.scores.riskPosture + 1) * 50 | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1105 | جایگاه نسبی انتخاب‌ها در طیف ریسک‌گریز تا ریسک‌پذیر نسبت به گزینه‌های همان موقعیت. |
| انسجام تصمیم | cognitiveV3?.scores.decisionCoherence ?? null | src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx:1106 | هم‌خوانی دلیل اعلام‌شده با مسیر انتخاب‌ها؛ مقدار پایین به معنی تصمیم اشتباه نیست. |

## Extracted S4 visible-status help

| Field | Source-native title |
| --- | --- |
| missionContinuity | نشان می‌دهد مأموریت A-17 تا چه حد پایدار و قابل ادامه است. |
| situationAwareness | نشان می‌دهد تصویر اطلاعاتی شما از وضعیت تا چه حد کامل و منسجم است. |
| escalationPressure | نشان می‌دهد بحران تا چه حد به سمت تشدید حرکت کرده است. |
| operationalReadiness | نشان می‌دهد ایران برای حفاظت و بازیابی تا چه حد آماده است. |
| coalitionCohesion | نشان می‌دهد متحدان تا چه حد با ارزیابی و مسیر اقدام شما هم‌سو هستند. |
| informationExposure | نشان می‌دهد چه مقدار از ظرفیت، اولویت یا الگوی رفتاری شما قابل برداشت شده است. |
| strategicLegitimacy | نشان می‌دهد موضع شما از نظر سیاسی/حقوقی تا چه حد قابل دفاع است. |

## General App cards: exhaustive source-label inventory

Expressions below are lexical JS expressions in App, not persisted V3 fields. Conditions/details affect visibility; the actual active-S4 screenshots do not claim to exercise legacy-id=1 conditions.

| Line | Exact visible label | Exact value expression including display unit | Range/unit |
| --- | --- | --- | --- |
| src/App.tsx:1750 | کل رخدادها | userScopedEvents.length | nonnegative count / seconds as rendered |
| src/App.tsx:1751 | اجرای کامل سناریو | overviewInsights.scenarioRuns | nonnegative count / seconds as rendered |
| src/App.tsx:1752 | دقت کلی پاسخ‌ها | overviewInsights.correctAnswerRate% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:1753 | بار شناختی کلی | overviewCognitive.estimatedCognitiveLoad/100 | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:1835 | کل لاگ‌ها | filteredEvents.length | nonnegative count / seconds as rendered |
| src/App.tsx:1839 | کل کاربران لاگ‌شده | users.length | nonnegative count / seconds as rendered |
| src/App.tsx:1843 | سوالات پاسخ‌داده‌شده | insights.answeredQuestions | nonnegative count / seconds as rendered |
| src/App.tsx:1847 | درصد پاسخ صحیح | insights.correctAnswerRate% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:1856 | تعداد سوالات (Quiz) | insights.totalQuestions | nonnegative count / seconds as rendered |
| src/App.tsx:1860 | تعداد گزینه صحیح | insights.correctAnswers | nonnegative count / seconds as rendered |
| src/App.tsx:1864 | میانگین زمان فکر روی سوال | Math.round(insights.avgThinkingMs / 1000) ثانیه | nonnegative count / seconds as rendered |
| src/App.tsx:1868 | کلیک روی رفرنس‌ها/مثال‌ها | insights.referenceClicks | nonnegative count / seconds as rendered |
| src/App.tsx:1872 | میانگین مدت اجرای سناریو | isSelectedRunUnfinished ? "سناریو تکمیل نشد" : `${insights.avgScenarioDurationSec} ثانیه` | nonnegative count / seconds as rendered |
| src/App.tsx:1878 | تعداد اجرای کامل سناریو | insights.scenarioRuns | nonnegative count / seconds as rendered |
| src/App.tsx:1882 | زمان مطالعه توضیحات | insights.descriptionReadSec ثانیه | nonnegative count / seconds as rendered |
| src/App.tsx:1886 | زمان مطالعه رفرنس/مثال | insights.referenceReadSec ثانیه | nonnegative count / seconds as rendered |
| src/App.tsx:1900 | تعداد شروع سناریو ۱ | s1Metrics.startedCount | nonnegative count / seconds as rendered |
| src/App.tsx:1904 | اجرای کامل سناریو ۱ | s1Metrics.completedCount | nonnegative count / seconds as rendered |
| src/App.tsx:1908 | نرخ تکمیل سناریو ۱ | s1Metrics.completionRate% | >=0 %; no general upper clamp |
| src/App.tsx:1912 | میانگین زمان تصمیم هر راند | Math.round(s1Metrics.avgDecisionMs / 1000) ثانیه | nonnegative count / seconds as rendered |
| src/App.tsx:1918 | میانگین تغییر تصمیم | s1Metrics.avgChangedAnswerCount.toFixed(1) | nonnegative count / seconds as rendered |
| src/App.tsx:1922 | میانگین Preview | s1Metrics.avgPreviewOpenCount.toFixed(1) | nonnegative count / seconds as rendered |
| src/App.tsx:1926 | میانگین OSI | s1Metrics.avgOperationalStrategicIndex.toFixed(2) | legacy nominal -1..1; unchecked log values |
| src/App.tsx:1930 | توزیع سبک | عملیاتی s1Metrics.styleCounts.operational \| ترکیبی s1Metrics.styleCounts.balanced \| راهبردی s1Metrics.styleCounts.strategic | categorical string / counts |
| src/App.tsx:1938 | میانگین ریسک افشای اطلاعات | s1Metrics.avgInformationExposureRisk.toFixed(1)% | nominal 0..100; legacy event values unchecked |
| src/App.tsx:1942 | بیشترین ریسک افشای اطلاعات | s1Metrics.maxInformationExposureRisk% | nominal 0..100; legacy event values unchecked |
| src/App.tsx:1946 | سطح افشا: none | s1Metrics.informationCompromiseNonePercent% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:1950 | سطح افشا: limited / major | s1Metrics.informationCompromiseLimitedPercent% / s1Metrics.informationCompromiseMajorPercent% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:1957 | تفکر مرحله دوم | s1Metrics.avgSecondOrderThinking.toFixed(2) | legacy profile score scale; numeric event payload not range-validated here |
| src/App.tsx:1961 | مدل‌سازی طرف مقابل | s1Metrics.avgAdversaryModeling.toFixed(2) | legacy profile score scale; numeric event payload not range-validated here |
| src/App.tsx:1965 | حساسیت به تشدید تنش | s1Metrics.avgEscalationSensitivity.toFixed(2) | legacy profile score scale; numeric event payload not range-validated here |
| src/App.tsx:1969 | نظم اطلاعات‌جویی | s1Metrics.avgInformationDiscipline.toFixed(2) | legacy profile score scale; numeric event payload not range-validated here |
| src/App.tsx:2027 | درصد outcomeهای limited/major | s1Metrics.informationCompromiseOutcomePercent% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2238 | دقت مفهومی کلی | cognitive.overallAccuracy% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2239 | سرعت تصمیم‌گیری | cognitive.decisionSpeedSec ثانیه | nonnegative count / seconds as rendered |
| src/App.tsx:2240 | نرخ تردید/بازبینی | cognitive.hesitationRate% | >=0 %; no general upper clamp |
| src/App.tsx:2241 | بار شناختی تخمینی | cognitive.estimatedCognitiveLoad/100 | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2254 | نرخ تغییر پاسخ | cognitive.answerChangeRate% | >=0 %; no general upper clamp |
| src/App.tsx:2255 | اصلاح موفق پس از تغییر | cognitive.successfulRevisionRate% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2256 | استفاده از مرجع | cognitive.referenceUsageRate% | >=0 %; no general upper clamp |
| src/App.tsx:2257 | ترک سناریوی ناتمام | cognitive.unfinishedExitRate% | >=0 %; no general upper clamp |
| src/App.tsx:2258 | استفاده از توضیح بیشتر | cognitive.explanationUsageRate% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2259 | زمان مطالعه توضیح | cognitive.avgExplanationSec ثانیه | nonnegative count / seconds as rendered |
| src/App.tsx:2260 | اثر توضیح بر دقت | cognitive.guidanceBenefitScore% | -100..100 percentage-point heuristic |
| src/App.tsx:2261 | خطای با اطمینان بالا | cognitive.overconfidenceErrorRate% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2262 | تردید مفید | cognitive.productiveHesitationRate% | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2263 | اصطکاک مفهومی | cognitive.conceptFrictionScore/100 | 0..100 (% or /100 as rendered; valid inputs) |
| src/App.tsx:2271 | سناریو ۱: OSI | s1Metrics.avgOperationalStrategicIndex.toFixed(2) | legacy nominal -1..1; unchecked log values |
| src/App.tsx:2272 | سناریو ۱: تفکر مرحله دوم | s1Metrics.avgSecondOrderThinking.toFixed(2) | legacy profile score scale; numeric event payload not range-validated here |
| src/App.tsx:2273 | سناریو ۱: مدل‌سازی طرف مقابل | s1Metrics.avgAdversaryModeling.toFixed(2) | legacy profile score scale; numeric event payload not range-validated here |
| src/App.tsx:2274 | سناریو ۱: انعطاف شناختی | s1Metrics.avgCognitiveFlexibility.toFixed(2) | legacy profile score scale; numeric event payload not range-validated here |

## Exact existing radar formula

`src/App.tsx:1565`, used for overview and cognitive tab.

```tsx
buildRadarAxes = (
      sourceCognitive: CognitiveInsights,
      sourceS1Metrics: typeof s1Metrics
    ) => [
      { label: "درک مفهومی", value: clamp100(sourceCognitive.overallAccuracy) },
      {
        label: "آگاهی موقعیتی",
        value: clamp100(
          sourceCognitive.referenceUsageRate * 0.35 +
            sourceCognitive.explanationUsageRate * 0.25 +
            sourceCognitive.productiveHesitationRate * 0.25 +
            Math.max(0, sourceS1Metrics.avgInformationDiscipline * 100) * 0.15
        ),
      },
      {
        label: "کیفیت تصمیم",
        value: clamp100(
          sourceCognitive.overallAccuracy * 0.55 +
            Math.max(0, sourceCognitive.guidanceBenefitScore) * 0.2 +
            (100 - sourceCognitive.overconfidenceErrorRate) * 0.15 +
            Math.max(0, sourceS1Metrics.avgCognitiveFlexibility * 100) * 0.1
        ),
      },
      {
        label: "سرعت پردازش",
        value: clamp100(100 - Math.min(100, sourceCognitive.decisionSpeedSec * 20)),
      },
      {
        label: "مدیریت ریسک",
        value: clamp100(
          100 -
            sourceCognitive.unfinishedExitRate * 0.35 -
            sourceCognitive.overconfidenceErrorRate * 0.35 +
            Math.max(0, sourceS1Metrics.avgEscalationSensitivity * 100) * 0.3
        ),
      },
      {
        label: "جست‌وجوی اطلاعات",
        value: clamp100(
          sourceCognitive.referenceUsageRate * 0.35 +
            sourceCognitive.explanationUsageRate * 0.45 +
            Math.min(100, sourceCognitive.avgExplanationSec * 8) * 0.1 +
            Math.max(0, sourceS1Metrics.avgInformationDiscipline * 100) * 0.1
        ),
      },
      {
        label: "یادگیری و سازگاری",
        value: clamp100(
          sourceCognitive.successfulRevisionRate * 0.3 +
            sourceCognitive.productiveHesitationRate * 0.45 +
            Math.max(0, sourceCognitive.guidanceBenefitScore) * 0.15 +
            Math.max(0, sourceS1Metrics.avgSecondOrderThinking * 100) * 0.1
        ),
      },
      {
        label: "مدیریت ابهام",
        value: clamp100(
          (100 - sourceCognitive.conceptFrictionScore) * 0.65 +
            Math.max(0, sourceS1Metrics.avgAdversaryModeling * 100) * 0.2 +
            Math.max(0, sourceS1Metrics.avgInformationDiscipline * 100) * 0.15
        ),
      },
      { label: "پایبندی به مأموریت", value: clamp100(100 - sourceCognitive.unfinishedExitRate * 0.8) },
    ]
```

## Chart markup / grouping / help / empty behavior

The following are literal current chart renderers, preserving exact Persian chart titles, scales, text and empty-state conditions. They also record visualization primitives without proposing changes. The overview radar at App:1757 is the same radar construction using overviewRadarAxes; the cognitive copy appears below.

### طیف تفکر عملیاتی/راهبردی — src/App.tsx:1789

Data: `overviewS1Metrics.styleCounts`.

```tsx
<div className="analytics-chart-card">
                  <h3>طیف تفکر عملیاتی/راهبردی</h3>
                  <OperationalStrategicScale value={overviewS1Metrics.avgOperationalStrategicIndex} />
                  <div className="analytics-bar-row">
                    <span className="analytics-bar-label">عملیاتی</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.max((overviewS1Metrics.styleCounts.operational / overviewMaxStyleCount) * 100, overviewS1Metrics.styleCounts.operational > 0 ? 6 : 0)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{overviewS1Metrics.styleCounts.operational}</span>
                  </div>
                  <div className="analytics-bar-row">
                    <span className="analytics-bar-label">ترکیبی</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill" style={{ width: `${Math.max((overviewS1Metrics.styleCounts.balanced / overviewMaxStyleCount) * 100, overviewS1Metrics.styleCounts.balanced > 0 ? 6 : 0)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{overviewS1Metrics.styleCounts.balanced}</span>
                  </div>
                  <div className="analytics-bar-row">
                    <span className="analytics-bar-label">راهبردی</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-alt" style={{ width: `${Math.max((overviewS1Metrics.styleCounts.strategic / overviewMaxStyleCount) * 100, overviewS1Metrics.styleCounts.strategic > 0 ? 6 : 0)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{overviewS1Metrics.styleCounts.strategic}</span>
                  </div>
                </div>
```

### کیفیت کلی پاسخ — src/App.tsx:1815

Data: `overviewInsights.correctAnswerRate`.

```tsx
<div className="analytics-chart-card">
                  <h3>کیفیت کلی پاسخ</h3>
                  <div className="analytics-pie-wrap">
                    <div
                      className="analytics-pie"
                      style={{
                        background: `conic-gradient(#22c55e 0% ${overviewInsights.correctAnswerRate}%, #ef4444 ${overviewInsights.correctAnswerRate}% 100%)`,
                      }}
                    />
                    <div className="analytics-pie-legend">
                      <div><span className="dot dot-ok" /> صحیح: {overviewInsights.correctAnswerRate}%</div>
                      <div><span className="dot dot-bad" /> خطا: {100 - overviewInsights.correctAnswerRate}%</div>
                    </div>
                  </div>
                </div>
```

### توزیع سطح افشای اطلاعات — src/App.tsx:1980

Data: `s1Metrics.informationCompromiseCounts`.

```tsx
<div className="analytics-chart-card">
                <h3>توزیع سطح افشای اطلاعات</h3>
                {(["none", "limited", "major"] as const).map((level) => {
                  const count = s1Metrics.informationCompromiseCounts[level];
                  const percent = s1SummaryEvents.length > 0 ? Math.round((count / s1SummaryEvents.length) * 100) : 0;
                  return (
                    <div key={level} className="analytics-bar-row">
                      <span className="analytics-bar-label">{level}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${Math.max(percent, count > 0 ? 6 : 0)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{count}</span>
                    </div>
                  );
                })}
              </div>
```

### میانگین ریسک افشا به تفکیک راند — src/App.tsx:1997

Data: `s1DecisionExposureByRound`.

```tsx
<div className="analytics-chart-card">
                <h3>میانگین ریسک افشا به تفکیک راند</h3>
                {s1DecisionExposureByRound.length === 0 && <p className="hint">داده‌ای برای سناریو ۱ ثبت نشده است.</p>}
                {s1DecisionExposureByRound.map((item) => (
                  <div key={item.roundId} className="analytics-bar-row">
                    <span className="analytics-bar-label">{translateNodeId(item.roundId)}</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.max(item.avgAfter, 4)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{Math.round(item.avgAfter)}%</span>
                  </div>
                ))}
              </div>
```

### راندهای با بیشترین افزایش ریسک افشا — src/App.tsx:2011

Data: `s1TopExposureRounds`.

```tsx
<div className="analytics-chart-card">
                <h3>راندهای با بیشترین افزایش ریسک افشا</h3>
                {s1TopExposureRounds.length === 0 && <p className="hint">داده‌ای برای سناریو ۱ ثبت نشده است.</p>}
                {s1TopExposureRounds.map((item) => (
                  <div key={item.roundId} className="analytics-bar-row">
                    <span className="analytics-bar-label">{translateNodeId(item.roundId)}</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.max(Math.min(item.avgDelta * 4, 100), 4)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{item.avgDelta.toFixed(1)}</span>
                  </div>
                ))}
              </div>
```

### Outcomeهای شکست اطلاعاتی — src/App.tsx:2025

Data: `s1Metrics.informationCompromiseOutcomePercent`.

```tsx
<div className="analytics-chart-card">
                <h3>Outcomeهای شکست اطلاعاتی</h3>
                <div className="analytics-stat">
                  <span>درصد outcomeهای limited/major</span>
                  <strong>{s1Metrics.informationCompromiseOutcomePercent}%</strong>
                </div>
                <p className="hint">این درصد از summary نهایی سناریو ۱ محاسبه می‌شود.</p>
              </div>
```

### توزیع خروجی نهایی سناریو ۱ — src/App.tsx:2034

Data: `s1Metrics.outcomeCounts`.

```tsx
<div className="analytics-chart-card">
                <h3>توزیع خروجی نهایی سناریو ۱</h3>
                {s1OutcomeLabels.map((label) => {
                  const count = s1Metrics.outcomeCounts[label];
                  const percent = s1SummaryEvents.length > 0 ? Math.round((count / s1SummaryEvents.length) * 100) : 0;
                  return (
                    <div key={label} className="analytics-bar-row">
                      <span className="analytics-bar-label">{getS1OutcomeTitle(label)}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${Math.max(percent, count > 0 ? 6 : 0)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{count}</span>
                    </div>
                  );
                })}
              </div>
```

### رابطه OSI و ریسک افشا — src/App.tsx:2051

Data: `s1OsiExposurePoints`.

```tsx
<div className="analytics-chart-card">
                <h3>رابطه OSI و ریسک افشا</h3>
                {s1OsiExposurePoints.length === 0 ? (
                  <p className="hint">داده‌ای برای نمایش رابطه ثبت نشده است.</p>
                ) : (
                  <svg viewBox="0 0 260 170" style={{ width: "100%", height: 170 }}>
                    <line x1="28" y1="138" x2="238" y2="138" stroke="rgba(148,163,184,0.45)" />
                    <line x1="28" y1="18" x2="28" y2="138" stroke="rgba(148,163,184,0.45)" />
                    {s1OsiExposurePoints.map((point, index) => (
                      <circle
                        key={`osi-exposure-${index}`}
                        cx={28 + (point.x / 100) * 210}
                        cy={138 - (point.y / 100) * 120}
                        r="4"
                        fill="#38bdf8"
                        opacity="0.82"
                      />
                    ))}
                    <text x="78" y="162" fill="#94a3b8" fontSize="10">Operational-Strategic Index</text>
                    <text x="34" y="14" fill="#94a3b8" fontSize="10">Exposure</text>
                  </svg>
                )}
              </div>
```

### رابطه ریسک تنش و ریسک افشا — src/App.tsx:2075

Data: `s1EscalationExposurePoints`.

```tsx
<div className="analytics-chart-card">
                <h3>رابطه ریسک تنش و ریسک افشا</h3>
                {s1EscalationExposurePoints.length === 0 ? (
                  <p className="hint">داده‌ای برای نمایش رابطه ثبت نشده است.</p>
                ) : (
                  <svg viewBox="0 0 260 170" style={{ width: "100%", height: 170 }}>
                    <line x1="28" y1="138" x2="238" y2="138" stroke="rgba(148,163,184,0.45)" />
                    <line x1="28" y1="18" x2="28" y2="138" stroke="rgba(148,163,184,0.45)" />
                    {s1EscalationExposurePoints.map((point, index) => (
                      <circle
                        key={`escalation-exposure-${index}`}
                        cx={28 + (point.x / 100) * 210}
                        cy={138 - (point.y / 100) * 120}
                        r="3.4"
                        fill="#f59e0b"
                        opacity="0.78"
                      />
                    ))}
                    <text x="96" y="162" fill="#94a3b8" fontSize="10">Escalation</text>
                    <text x="34" y="14" fill="#94a3b8" fontSize="10">Exposure</text>
                  </svg>
                )}
              </div>
```

### توزیع نوع رخدادها — src/App.tsx:2122

Data: `insights.eventTypeCounts`.

```tsx
<div className="analytics-chart-card">
              <h3>توزیع نوع رخدادها</h3>
              {insights.eventTypeCounts.map((item) => (
                <div key={item.type} className="analytics-bar-row">
                  <span className="analytics-bar-label">{translateEventType(item.type)}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill"
                      style={{ width: `${Math.max((item.count / maxTypeCount) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="analytics-bar-value">{item.count}</span>
                </div>
              ))}
            </div>
```

### نمودار دایره‌ای پاسخ صحیح — src/App.tsx:2138

Data: `insights.correctAnswerRate`.

```tsx
<div className="analytics-chart-card">
              <h3>نمودار دایره‌ای پاسخ صحیح</h3>
              <div className="analytics-pie-wrap">
                <div className="analytics-pie" style={pieStyle} />
                <div className="analytics-pie-legend">
                  <div><span className="dot dot-ok" /> صحیح: {correctPercent}%</div>
                  <div><span className="dot dot-bad" /> غلط: {incorrectPercent}%</div>
                </div>
              </div>
            </div>
```

### میانگین زمان فکر روی سوال‌ها — src/App.tsx:2149

Data: `insights.questionThinking`.

```tsx
<div className="analytics-chart-card">
              <h3>میانگین زمان فکر روی سوال‌ها</h3>
              {insights.questionThinking.map((item) => (
                <div key={item.question} className="analytics-bar-row">
                  <span className="analytics-bar-label">{translateNodeId(item.question)}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill analytics-bar-fill-warn"
                      style={{ width: `${Math.max((item.ms / maxThinkingMs) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="analytics-bar-value">{Math.round(item.ms / 1000)} ث</span>
                </div>
              ))}
            </div>
```

### روند زمان پاسخ از سوال اول تا آخر — src/App.tsx:2169

Data: `timelineData`.

```tsx
<div className="analytics-chart-card" style={{ marginBottom: "1rem" }}>
            <h3>روند زمان پاسخ از سوال اول تا آخر</h3>
            {timelineData.length > 1 ? (
              <div className="analytics-line-wrap">
                <svg viewBox="0 0 640 260" preserveAspectRatio="xMidYMid meet" className="analytics-line-svg">
                  <line x1="60" y1="40" x2="60" y2="210" className="analytics-axis" />
                  <line x1="60" y1="210" x2="610" y2="210" className="analytics-axis" />
                  <line x1="60" y1="125" x2="610" y2="125" className="analytics-axis-grid" />
                  <text x="12" y="44" className="analytics-axis-text">زیاد</text>
                  <text x="8" y="129" className="analytics-axis-text">متوسط</text>
                  <text x="20" y="214" className="analytics-axis-text">کم</text>
                  <text x="235" y="246" className="analytics-axis-text">محور X: ترتیب سوال‌ها</text>
                  <text x="70" y="28" className="analytics-axis-text">محور Y: زمان پاسخ</text>
                  <polyline points={timelinePoints} className="analytics-line" />
                  {timelineTicks.map((tick) => (
                    <g key={`tick-${tick.label}`}>
                      <line x1={tick.x} y1="210" x2={tick.x} y2="216" className="analytics-axis" />
                      <text x={tick.x - 3} y="230" className="analytics-axis-text">
                        {tick.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <p className="hint">داده کافی برای نمایش روند زمانی وجود ندارد.</p>
            )}
          </div>
```

### نمودار راداری شناختی — src/App.tsx:2282

Data: `radarAxes`.

```tsx
<div className="analytics-chart-card">
                  <h3>نمودار راداری شناختی</h3>
                  <div className="radar-wrap">
                    <svg viewBox="0 0 440 470" className="radar-svg">
                      {radarLevels.map((level) => {
                        const points = radarAxes
                          .map((_, idx) => {
                            const p = toRadarPoint(idx, level / 100);
                            return `${p.x},${p.y}`;
                          })
                          .join(" ");
                        return <polygon key={`lvl-${level}`} points={points} className="radar-grid" />;
                      })}

                      {radarAxes.map((axis, idx) => {
                        const p = toRadarPoint(idx, 1);
                        return (
                          <g key={`axis-${axis.label}`}>
                            <line x1={radarCx} y1={radarCy} x2={p.x} y2={p.y} className="radar-axis-line" />
                            <text x={p.x} y={p.y} className="radar-axis-label">
                              {axis.label}
                            </text>
                          </g>
                        );
                      })}

                      <polygon points={radarPolygon} className="radar-data-fill" />
                      <polygon points={radarPolygon} className="radar-data-stroke" />
                    </svg>
                  </div>
                  <p className="hint">این نمودار بر اساس پروکسی رفتاری و لاگ فعلی محاسبه می‌شود.</p>
                </div>
```

### تسلط مفهومی بر حوزه‌ها — src/App.tsx:2315

Data: `cognitive.domainScores`.

```tsx
<div className="analytics-chart-card">
                  <h3>تسلط مفهومی بر حوزه‌ها</h3>
                  {cognitive.domainScores.map((d) => (
                    <div key={d.domain} className="analytics-bar-row">
                      <span className="analytics-bar-label">{d.domain}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${Math.max(d.accuracy, 4)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{d.accuracy}%</span>
                    </div>
                  ))}
                </div>
```

### ضعف‌های پرتکرار (خطای مفهومی) — src/App.tsx:2328

Data: `cognitive.frequentErrors`.

```tsx
<div className="analytics-chart-card">
                  <h3>ضعف‌های پرتکرار (خطای مفهومی)</h3>
                  {cognitive.frequentErrors.length === 0 && <p className="hint">خطای پرتکرار ثبت نشده است.</p>}
                  {cognitive.frequentErrors.map((e) => (
                    <div key={e.nodeId} className="analytics-bar-row">
                      <span className="analytics-bar-label">{e.nodeId}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.min(100, e.wrongCount * 25)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{e.wrongCount}</span>
                    </div>
                  ))}
                </div>
```

## Additional visible contextual/report fields

The statistical selected-user summary at App:2103 renders userName/userId/role plus scenarioEnds, scenarioExits and avgScenarioDurationSec. `getUserAnalytics` (App:528) groups stored events by userId+userName, counts scenario_end/scenario_exit, and rounds mean scenario_end elapsedMs to seconds (0 without durations). The selectedSummary is chosen from these user totals at 1519; unlike filteredEvents charts it is not recomputed for a selected synthetic run. Overview also renders OperationalStrategicScale with overviewS1Metrics.avgOperationalStrategicIndex separately from its three style-count bars. These scalar/context fields are included in the CSV.

`OperationalStrategicScale` (App:98) displays title «طیف عملیاتی–راهبردی», numeric toFixed(2), and labels «عملیاتی (-1)»، «ترکیبی (0)»، «راهبردی (+1)»; marker=((value+1)/2)*100 clamped [0,100]. No null branch exists; absent legacy summaries produce upstream 0. The active-S4 general chart accordingly shows legacy-scale 0.00, zero style counts and no completed general scenario_end count, while the actual local S4 run report exists. The general accuracy pie displays 0% correct and 100% incorrect without scored answers because its second segment is 100-correctPercent; this is existing empty-data behavior.

Scenario final-report narrative is assembled by `scenario-four/adjudication/move3Adjudicator.ts:596–609` using `getFinalReport` and `finalReportToSections` in `scenario-four/narrative/narrativeSelectors.ts:699–761`. Visible section titles are «مسیر بحران»، «وضعیت مأموریت»، «تحول برآورد انتساب»، «تصمیم نهایی ایران»، «واکنش بازیگران»، «وضعیت منابع»، «چرایی وضعیت پایانی». They render finalSnapshot.playerFacingReport[index].text; each is a narrative string, not a cognitive scalar. Its resource text includes numeric final capacities and direct-cost explanation. Empty reports are permitted by includeNarrative=false in the adjudicator; the actual normal UI flow generated the captured report.

## Literal S4 contract and aggregate calculation

These excerpts ground the types, available traces, weights and missingness used by the existing S4 display. They are not a proposed S5 mapping.

`src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:35`

```ts
centerAndNormalizeWithinWindow = (values: number[], selectedIndex: number) => {
  if (!values.length || selectedIndex < 0 || selectedIndex >= values.length) return null;
  const windowMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map((value) => value - windowMean);
  const maxAbsolute = Math.max(...centered.map(Math.abs));
  return maxAbsolute === 0 ? 0 : clamp(centered[selectedIndex] / maxAbsolute, -1, 1);
}
```

`src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:44`

```ts
harmonicIntegration = (operational: number, strategic: number) =>
  operational + strategic === 0 ? 0 : (2 * operational * strategic) / (operational + strategic)
```

`src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:216`

```ts
export interface CognitiveModelV3Result {
  versions: { measurementModelVersion: typeof COGNITIVE_MODEL_VERSION; formulaVersion: typeof COGNITIVE_FORMULA_VERSION; optionProfileVersion: typeof OPTION_PROFILE_VERSION; scenarioContentVersion: typeof SCENARIO_CONTENT_VERSION; expertPanelVersion: typeof EXPERT_PANEL_VERSION; anchorTestVersion: typeof ANCHOR_TEST_VERSION };
  orientation: { overall: number | null; markerPercent: number | null; perMove: { move1: number | null; move2: number | null; move3: number | null }; operationalStrength: number | null; strategicStrength: number | null; integration: number | null; dispersion: number | null; dispersionLabel: string; interpretation: string };
  scores: Record<"informationSeeking" | "secondOrderThinking" | "adversaryModeling" | "escalationSensitivity" | "informationDiscipline" | "evidenceResponsiveUpdating" | "coalitionOrientation" | "resourceStewardship" | "planningForesight" | "multiDomainIntegration" | "riskPosture" | "decisionCoherence", number | null>;
  dataCompleteness: { overall: number; components: { coreDecisionRecords: number; timingIntegrity: number; evidenceTelemetry: number; attributionEstimates: number; reasonCapture: number } };
  timing: { medianActiveDecisionMs: number | null; iqrActiveDecisionMs: number | null; totalEvidenceDwellMs: number; longestDecision?: { windowId: string; activeDecisionMs: number }; shortestDecision?: { windowId: string; activeDecisionMs: number }; totalRevisions: number; revisedWindows: number; firstToFinalChanges: Array<{ windowId: string; first?: string; final: string }>; evidenceTriggeredRevisionRate: number | null };
  attribution: { evidenceAlignment: Array<{ phase: string; score: number }>; meanEvidenceAlignment: number | null; evidenceUpdatingAudit: EvidenceUpdateAuditV3[] };
  responseProcess: { flags: ResponseProcessFlags; activeFlags: Array<keyof ResponseProcessFlags>; status: "normal" | "caution" };
  perWindow: Array<{ windowId: string; optionId: string; adjustedOsi: number | null; operationalLoading: number; strategicLoading: number; diagnosticWeight: number; evidenceCoverage: number | null }>;
  missingReasons: string[];
}
```

`src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts:249`

```ts
calculateCognitiveModelV3 = (input: CognitiveModelV3Input): CognitiveModelV3Result => {
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
}
```

### رادار کلی شناختی — src/App.tsx:1757

Data: overviewRadarAxes (overviewCognitive + overviewS1Metrics); SVG with exact same nine heuristic axis formulas.

```tsx
<div className="analytics-chart-card analytics-chart-card-wide">
                  <h3>رادار کلی شناختی</h3>
                  <div className="radar-wrap">
                    <svg viewBox="0 0 440 470" className="radar-svg">
                      {radarLevels.map((level) => {
                        const points = overviewRadarAxes
                          .map((_, idx) => {
                            const p = toRadarPoint(idx, level / 100, overviewRadarAxes.length);
                            return `${p.x},${p.y}`;
                          })
                          .join(" ");
                        return <polygon key={`overview-lvl-${level}`} points={points} className="radar-grid" />;
                      })}

                      {overviewRadarAxes.map((axis, idx) => {
                        const p = toRadarPoint(idx, 1, overviewRadarAxes.length);
                        return (
                          <g key={`overview-axis-${axis.label}`}>
                            <line x1={radarCx} y1={radarCy} x2={p.x} y2={p.y} className="radar-axis-line" />
                            <text x={p.x} y={p.y} className="radar-axis-label">
                              {axis.label}
                            </text>
                          </g>
                        );
                      })}

                      <polygon points={overviewRadarPolygon} className="radar-data-fill" />
                      <polygon points={overviewRadarPolygon} className="radar-data-stroke" />
                    </svg>
                  </div>
                </div>
```
