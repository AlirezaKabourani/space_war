# Final post-audit Cognitive Dashboard Specification — Scenario 2 «امواج خاموش»

**Status: DESIGN APPROVED for implementation (09C-1)**  
**Basis:** approved draft v0.1 + read-only 09C-0 audit artifacts supplied by the user, 2026-11-04.  
**Scope:** player-facing dashboard for the active released Scenario 2 (`id=5`); internal `s5_silent_waves_redesign`.  
**Non-goal:** shared/global analytics, cross-scenario aggregation, psychometric validation, new cognitive indicators, or changes to any simulation/model.

## 1. Evidence-based review of 09C-0

- `scenario5-phase09c0-audit-status.json` = PASS, source audit read-only; 40 scalar output leaves, 281 inventory rows, 7 real Scenario-1 browser captures, all original files unchanged.
- **Actual released Scenario 1**: `id=4`, local `CognitiveDashboard` inside `ScenarioFourRedesignedScenarioOne.tsx`, consuming `finalSnapshot.cognitiveScoresV3`. It is **not** the general App admin analytics, nor the inactive/legacy internal `id=1`.
- **Actual Scenario 2 result**: `Scenario5RuntimeResult.cognitive: Scenario5CognitiveRunResult`, current-run completed result via `calculateScenario5RuntimeResult`. Exactly 40 leaves: 9 metadata + 6 completeness + 9 orientation (including four-phase tuple) + 11 construct properties + 5 descriptive telemetry.
- Eleven construct properties comprise **nine scored 0..100 constructs**, one signed `riskPosture` in [-1,1], and **one always-null** `informationDiscipline`. No `coalitionOrientation`.
- **Actual connection**: `ScenarioFiveMissionEnding.onCognitiveEntry` currently flips `ScenarioFiveSummary.compatibilityOpen`; replace that entry with a dedicated player cognitive view for the very same completed `runtimeState` and `result`. Preserve a separate link to the legacy compatibility/technical report if desired; do not discard its data.
- No stored S5 `perWindow`, cognitive contribution-by-action array, S4 `markerPercent`, `dispersionLabel`, `responseProcess`, `missingReasons`, total dwell/longest-shortest summaries. Do not invent these.
- Report is **in-memory for the current run**. Reloading does not restore it; persisted global event logs are not an approved report restoration mechanism in this phase.

## 2. User-facing flow and page structure

After R8 Outcome and completed-run Mission Ending, the AAR includes «چرا این پایان؟», full 8-decision trace and truth/belief timeline. Only after clicking **«مشاهده الگوی تصمیم‌گیری»** show the dedicated dashboard. This UI is not a mission step and does not alter telemetry.

Page title: **الگوی تصمیم‌گیری شما**  
Subtitle: **سناریو ۲ — امواج خاموش | گزارش توصیفی یک اجرای کامل**  
Visible actions: **بازگشت به گزارش مأموریت**, optional **گزارش فنی کامل**, and **پایان سناریو**. Back restores the existing completed Mission Ending without rerunning it. Do not add a dashboard shortcut in live gameplay.

Layout (RTL, visually consistent with released S1):
1. **درباره داده‌های این گزارش**: data completeness, validity note.
2. **جهت‌گیری تصمیم‌ها**: overall signed OSI, four signed phase OSIs, three strengths, optional numeric dispersion.
3. **الگوهای رفتاری مشاهده‌شده**: nine 0..100 constructs grouped into four blocks.
4. **موضع ریسک و ویژگی‌های تعامل**: signed risk axis, timing and revisions from the result.
5. **روش محاسبه و محدودیت‌ها**: clear definitions, unavailable/not-measured distinction, technical metadata, and non-attributive navigation to immutable 8-decision AAR.

No radial/global cognitive score or all-metrics ranking. S4 CSS/SVG typography/layout/RTL conventions can be emulated with scoped S5 components; never import/reuse S4 scoring formulas, normalization, bands or scenario-specific labels.

## 3. Exact canonical result-field mapping

`r` below is a lexical alias for the actual completed `result.cognitive`; it is NOT a new source.

### Data integrity — Module 0

| UI label | Exact value | Meaning |
|---|---|---|
| کامل‌بودن داده‌های ثبت‌شده | `r.dataCompleteness.overall` | percentage, **data coverage**, not aptitude/performance |
| ثبت تصمیم‌ها | `r.dataCompleteness.decisions` | % |
| داده‌های زمانی | `r.dataCompleteness.timing` | % |
| داده‌های شواهد | `r.dataCompleteness.evidence` | % |
| ثبت برآوردها | `r.dataCompleteness.estimates` | % |
| ثبت دلیل‌ها | `r.dataCompleteness.reasons` | % |

All six are numeric 0..100, even if 0. Do not require overall completeness=100 for rendering existing non-null scores. Show model status «آزمایشی؛ در انتظار اعتبارسنجی خبرگان و کاربران» drawn from explicit metadata `r.validityStatus` with safe approved Persian rendering, not a made-up validation result.

### OSI and strengths — Module 1

| UI label | Exact value | Scale |
|---|---|---|
| شاخص جهت‌گیری این اجرا (OSI) | `r.orientation.overall` | **signed [-1,1]**, 2 decimals, null-aware |
| فاز ۱ — ساخت تصویر اولیه | `r.orientation.phaseScores[0]` | signed [-1,1] |
| فاز ۲ — تمرکز و مدیریت مسیر | `r.orientation.phaseScores[1]` | signed [-1,1] |
| فاز ۳ — ایجاد تاب‌آوری | `r.orientation.phaseScores[2]` | signed [-1,1] |
| فاز ۴ — مدیریت فشار و تحویل | `r.orientation.phaseScores[3]` | signed [-1,1] |
| قدرت عملیاتی | `r.orientation.operationalStrength` | [0,100] |
| قدرت راهبردی | `r.orientation.strategicStrength` | [0,100] |
| یکپارچگی عملیاتی–راهبردی | `r.orientation.integration` | [0,100] |
| پراکندگی جهت‌گیری بین فازها | `r.orientation.dispersion` | [0,1], numeric, no invented band |

Present signed OSI as bipolar: LEFT = operational / CENTER = 0 / RIGHT = strategic; negative values must be toward operational. Position on the visual axis can be derived by graphical mapping of [-1,1] to its track position; this is not a new cognitive metric. Null = no marker/no false center mark. Four-phase OSI must not count R2/A2 evidence acquisition as an OSI-eligible decision. Overall requires all four phase values; do not fill gaps or average partial results in UI.

Approved short definition:
> این اعداد جهت‌گیری نسبی انتخاب‌های ثبت‌شده را نسبت به گزینه‌های همان موقعیت نشان می‌دهند. عملیاتی‌تر یا راهبردی‌تر بودن، به‌خودی‌خود به معنی تصمیم بهتر یا بدتر نیست.

### Nine behavioral constructs — Module 2

All nine use **the exact stored 0..100 value or null**, neutral bars, no quality grades/thresholds/green-red scoring. For each, show one short text plus expandable «این شاخص چه چیزی را بازتاب می‌دهد؟». Definitions must be restricted to the following evidence-based statements, not claim psychological ability.

| Group | Player label | Exact field | Approved short behavioral interpretation |
|---|---|---|---|
| اطلاعات و بازنگری | جست‌وجوی اطلاعات | `r.constructs.informationSeeking` | الگوی انتخاب روش‌های اطلاعاتی، پوشش شواهد مرتبطِ بازشده و تنوع منابع قابل مشاهده در موقعیت‌های واجد شرایط |
| اطلاعات و بازنگری | به‌روزرسانی متناسب با شواهد | `r.constructs.evidenceResponsiveUpdating` | همسویی تغییر برآورد اخلال هدفمند با تغییر شواهد قابل مشاهده میان نقاط ثبت برداشت؛ نه درستی تشخیص کریدور واقعی |
| تعامل و پیامدهای بعدی | تفکر مرتبه دوم | `r.constructs.secondOrderThinking` | توجه کدگذاری‌شده انتخاب‌ها به پیامدهای آینده، واکنش طرف مقابل، برگشت‌پذیری و منابع |
| تعامل و پیامدهای بعدی | مدل‌سازی طرف مقابل | `r.constructs.adversaryModeling` | میزان وزن‌دادن انتخاب‌ها به واکنش طرف مقابل در گزینه‌های واجد شرایط؛ نه صحت حدس نیت پنهان |
| تعامل و پیامدهای بعدی | حساسیت به تشدید | `r.constructs.escalationSensitivity` | میزان توجه کدگذاری‌شده به پیامدهای تشدید در تصمیم‌های مرتبط؛ مقدار بیشتر الزاماً بهتر نیست |
| منابع و برنامه‌ریزی | نگهداشت و تخصیص منابع | `r.constructs.resourceStewardship` | ترکیب پروفایل گزینه‌ها و وضعیت منابع قابل مشاهده؛ صرفاً میزان ذخیره باقیمانده نیست |
| منابع و برنامه‌ریزی | برنامه‌ریزی و آینده‌نگری | `r.constructs.planningForesight` | توجه کدگذاری‌شده به برنامه جایگزین، برگشت‌پذیری، مدیریت منابع و پیامدهای آینده |
| ترکیب و انسجام تصمیم | یکپارچه‌سازی چندمعیاره | `r.constructs.multiDomainIntegration` | پوشش هم‌زمان ابعاد مرتبط مأموریت در پروفایل انتخاب‌ها؛ شاخصی وابسته به این سناریو |
| ترکیب و انسجام تصمیم | انسجام تصمیم | `r.constructs.decisionCoherence` | سازگاری دلیل‌های ثبت‌شده با گزینه‌ها و ارتباط انتخاب‌های پیاپی در فازهای واجد شرایط؛ نه درست/غلط بودن تصمیم |

Always-null extra property: `r.constructs.informationDiscipline` **must not appear as a tenth scored bar**. Include only:
> انضباط اطلاعاتی: در نسخه فعلی این سناریو سنجیده نمی‌شود.

Never render `coalitionOrientation`: absent from S5 contract. Do not copy S4 category labels «بالا / پایین / متوسط» or S4-specific labels (e.g. «مدل‌سازی اسرائیل») into S5.

### Risk and telemetry — Module 3

| UI label | Exact value | Formatting |
|---|---|---|
| موضع نسبی ریسک | `r.constructs.riskPosture` | signed [-1,1] **separate bipolar axis** |
| میانه زمان فعال تصمیم‌ها | `r.telemetrySummary.medianActiveDecisionMs` | ms → seconds, display-only 1 decimal, null-aware |
| دامنه میان‌چارکی زمان فعال تصمیم‌ها | `r.telemetrySummary.iqrActiveDecisionMs` | ms → seconds, display-only 1 decimal, null-aware |
| تعداد بازنگری‌ها | `r.telemetrySummary.totalRevisions` | integer, real 0 allowed |
| پنجره‌های تصمیم دارای بازنگری | `r.telemetrySummary.revisedWindows` | integer 0..8 |
| نرخ بازنگری پس از مشاهده شواهد | `r.telemetrySummary.evidenceTriggeredRevisionRate` | 0..100%, null-aware |

The last rate is a **temporal sequence association**, not proof that evidence caused revision. Timing is descriptive, not processing speed or competence. Risk direction is relative to available choices, not safety judgment.

Optional raw decision trace navigation may link to the **full eight-decision historical trace** without attributing an individual contribution to any cognitive score. The S5 result does **not** expose numeric per-decision contribution output. Do **not** calculate or fabricate one by re-running private scoring helpers in UI. No dedicated S4-style total evidence dwell, longest/shortest decision or response-process score appears here.

## 4. Missing and null behavior

- Stored numeric **zero** = display actual `0`, never missing or inapplicable.
- Stored `null` because no qualifying observations = `داده کافی برای محاسبه این شاخص ثبت نشده است.`
- `r.constructs.informationDiscipline` = `در این سناریو سنجیده نمی‌شود.`
- For known structurally non-applicable derived timings (e.g. revision rate with no qualifying opportunity), show exact nonavailability reason: `در این اجرا فرصت واجد شرایط برای محاسبه این نرخ ثبت نشد.`
- No fake default (50 on signed scales, 0 on 0..100 scales), no imputation, no converting null into 0-width bar with implied numeric 0.
- If one OSI phase is null, overall is null; show real available phase values individually.
- `orientation.integration` may be null when strengths sum to 0 even if strengths are measured zero; preserve distinction.
- Avoid inference that ERU-null implies failure to revise; it means no informative eligible evidence-change checkpoint pair.
- Completeness <100 does not imply all scores null.

## 5. Source, truth boundary, and no false attribution

- Read **only** canonical `result.cognitive` for score values, and public whitelisted decision/evidence/belief telemetry if rendering raw descriptive context. `result.missionEndState`, `result.domain` and true world/actor data must not enter any cognitive calculation or grade.
- Do not show hidden truth within the dashboard as an input to interpretation. Completed AAR can reveal truth separately, but the dashboard itself remains cognition-focused.
- Do not make assertions such as «R4 gave you 15 cognitive points»; **NOT_AVAILABLE**.
- No reuse of global App quiz accuracy, its heuristic radar, legacy id=1 score, or S4 metrics as S5 cognitive values.
- No cross-run retrieval/fallback. Use the exact current run `result.runId` and `runtimeState.runId` consistency.
- Show methodology metadata (`measurementModelVersion`, `formulaVersion`, `optionProfileVersion`, `reasonModelVersion`, `expertPanelVersion`, `validityStatus`) inside a collapse; do not turn version strings into ability labels.
- Model status is experimental and pending expert/human validation; do not require a new validation phase to render an accurately caveated descriptive report.

## 6. Presentation requirements and acceptance

Use existing design language from S4 (Vazirmatn, dark CSS panels, RTL, light accent blue, signed LTR chart axis, neutral bars, readable 0..100 cards). Scope all CSS to S5. Keyboard-accessible details/back/finish; numbers readable in mixed RTL/LTR; textual value present beside charts; responsive 1280×720, 1366×768, 1440×900, and 390×844. Document scroll is allowed for completed reports, not forced into live-map constraints.

**Hard tests:** 112 deterministic complete-run scientific parity (16 worlds × 7 policy families, seed 1) with zero mismatch; zero changes to 63 frozen scientific files; exact typed field binding; null vs zero; OSI/risk signed points; 9 constructs and one unmeasured note; model status; same-run dashboard only after complete; all six ending witnesses can reach dashboard; back to Mission Ending; untouched id=2 and released S1 id=4; typecheck/build/lint; real browser screenshots, inspection manifest and patch. Historical snapshot failures documented without altering legacy checks.

**Gate:** This is the final post-09C-0 data/UX specification for implementation. Codex has no authority to change metric definitions, choose alternate fields, create missing data, alter scoring/telemetry, or start cross-scenario work.

