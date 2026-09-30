import assert from "node:assert/strict";
import fs from "node:fs";
import { calculateAttributionBrier } from "../src/ui/components/scenario/scenario-four/model/cognitiveEngineV3.ts";
import { AAR_TRUTH_LABELS_FA, MOVE3_NARRATIVE_COPY_FA } from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import {
  attributionQualitativeLabel,
  buildAarRunSummary,
  buildAarTurningPoints,
  formatAttributionTrajectory,
  getAarResultMeaning,
  getBrierPlainLanguageInterpretation,
  getBssPlainLanguageInterpretation,
  getFinalEstimateExplanation,
  getTruthExplanation,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

// Case A — neutral estimate, role present through a mixed cause.
const caseA = calculateAttributionBrier(50, "mixed");
near(caseA.brier, 0.25);
near(caseA.brierSkillScore, 0);
assert.match(getBrierPlainLanguageInterpretation(caseA.brier), /معادل مبنای خنثی 50\/50/);
assert.match(getBssPlainLanguageInterpretation(caseA.brierSkillScore), /برابر با مبنای 50\/50/);
assert.match(getFinalEstimateExplanation(caseA.estimate, caseA.brier), /موضع احتمالی خنثی/);

// Case B — strong estimate, role confirmed.
const caseB = calculateAttributionBrier(80, "red");
near(caseB.brier, 0.04);
assert.ok(caseB.brierSkillScore > 0);
assert.match(getBrierPlainLanguageInterpretation(caseB.brier), /نزدیک‌تر/);
assert.match(getBssPlainLanguageInterpretation(caseB.brierSkillScore), /بهتر از مبنای/);

// Case C — strong estimate, role absent.
const caseC = calculateAttributionBrier(80, "non_red");
near(caseC.brier, 0.64);
assert.ok(caseC.brierSkillScore < 0);
assert.match(getBrierPlainLanguageInterpretation(caseC.brier), /فاصله بیشتری/);
assert.match(getBssPlainLanguageInterpretation(caseC.brierSkillScore), /ضعیف‌تر از مبنای/);

// Case D — low estimate, role absent.
const caseD = calculateAttributionBrier(20, "non_red");
near(caseD.brier, 0.04);
assert.ok(caseD.brierSkillScore > 0);
assert.match(getBrierPlainLanguageInterpretation(caseD.brier), /نزدیک‌تر/);

// Case E — mixed wording describes partial role and never claims sole/main causation.
const mixedTruth = getTruthExplanation("mixed");
assert.match(mixedTruth, /اسرائیل در بخشی از زنجیره علت رخداد نقش داشته است/);
assert.match(mixedTruth, /صرفاً به اسرائیل محدود نبوده/);
assert.doesNotMatch(mixedTruth, /عامل اصلی بود|انتساب کامل به اسرائیل درست بود/);
assert.match(AAR_TRUTH_LABELS_FA.attribution.mixed, /علت چندعاملی بود/);
assert.doesNotMatch(AAR_TRUTH_LABELS_FA.attribution.mixed, /عامل اصلی/);

// Cases F–H — trajectory copy.
assert.equal(formatAttributionTrajectory(50, 50, 50), "برآورد شما در هر سه نقطه بدون تغییر روی 50٪ باقی ماند؛ یعنی در طول این اجرا همچنان عدم قطعیت بالایی درباره نقش اسرائیل حفظ شد.");
assert.match(formatAttributionTrajectory(30, 50, 70), /با ورود شواهد جدید افزایش یافت/);
assert.match(formatAttributionTrajectory(70, 50, 30), /با ورود شواهد جدید کاهش یافت/);
assert.match(formatAttributionTrajectory(40, 65, 40), /به سطحی نزدیک به برآورد اولیه بازگشت/);

for (const truth of ["red", "mixed", "non_red"]) {
  const explanation = getTruthExplanation(truth);
  assert.ok(explanation.length > 40);
  assert.doesNotMatch(explanation, /undefined|عامل اصلی بود/);
}

const turningPoints = buildAarTurningPoints({
  pre: 50,
  post: 50,
  final: 50,
  thresholdId: "m3_t_sufficient_limited",
  thresholdLabel: "برای اقدام محدود و برگشت‌پذیر کافی است",
  actionId: "m3_coa_controlled_deterrence",
  actionLabel: "بازدارندگی کنترل‌شده",
  israelActionBody: "اسرائیل از اختلاف موجود میان ایران و متحدانش برای حفظ فشار سیاسی/عملیاتی استفاده کرده است.",
  intentLabel: "ایجاد شکاف ائتلافی",
});
assert.equal(turningPoints.length, 4);
assert.ok(turningPoints.every((point) => point.title && point.body && point.why));
assert.match(turningPoints[0].title, /بدون تغییر/);
assert.match(turningPoints[3].why, /ایجاد شکاف ائتلافی/);

const runSummary = buildAarRunSummary({
  finalEstimate: 50,
  visibleConfidence: 48,
  thresholdLabel: "برای اقدام محدود و برگشت‌پذیر کافی است",
  intentLabel: "ایجاد شکاف ائتلافی",
  causeLabel: "ترکیب چند عامل",
  truth: "mixed",
});
assert.equal(runSummary.known, "هنگام تصمیم نهایی، برآورد شما از نقش اسرائیل 50٪ بود و اطمینان سامانه از شواهد 48٪ بود. با وجود باقی‌ماندن عدم‌قطعیت، شما آستانه «برای اقدام محدود و برگشت‌پذیر کافی است» را انتخاب کردید.");
assert.doesNotMatch(runSummary.known, /سامانه.*کافی تلقی/);
assert.match(runSummary.revealed, /ایجاد شکاف ائتلافی.*ترکیب چند عامل/);
assert.match(runSummary.difference, /چندعاملی/);
assert.doesNotMatch(JSON.stringify(runSummary), /باید|بهتر بود|اشتباه/);

const snapshot = `# Text snapshot — AAR Case A

## حقیقت پنهان

- نیت واقعی اسرائیل: ایجاد شکاف ائتلافی
- علت واقعی رخداد مرحله دوم: ترکیب چند عامل
- نتیجه واقعی انتساب: ${AAR_TRUTH_LABELS_FA.attribution.mixed}

${MOVE3_NARRATIVE_COPY_FA.aar.truthNote}

## مسیر برآورد شما درباره نقش اسرائیل

| قبل از بررسی | بعد از بررسی | پایان بحران |
|---|---|---|
| 50٪ — ${attributionQualitativeLabel(50)} | 50٪ — ${attributionQualitativeLabel(50)} | 50٪ — ${attributionQualitativeLabel(50)} |

${formatAttributionTrajectory(50, 50, 50)}

## ارزیابی برآورد انتساب

**برآورد نهایی شما: 50٪**

${mixedTruth}

${getFinalEstimateExplanation(50, caseA.brier)}

**امتیاز Brier: ${caseA.brier.toFixed(2)}**

${MOVE3_NARRATIVE_COPY_FA.aar.brierHelp}

0.00 — تطابق کامل | 0.25 — مبنای خنثی 50/50 | 1.00 — فاصله بسیار زیاد

${getBrierPlainLanguageInterpretation(caseA.brier)}

<details>
<summary>جزئیات آماری</summary>

Brier = (p - y)²

p = 0.50

y = 1

Brier = (0.50 − 1)² = 0.25

BSS نسبت به مبنای 50/50 = ${caseA.brierSkillScore.toFixed(2)}

${getBssPlainLanguageInterpretation(caseA.brierSkillScore)}

</details>

## این نتیجه چه می‌گوید؟

${getAarResultMeaning(50, "mixed")}

${MOVE3_NARRATIVE_COPY_FA.aar.boundary}

## جمع‌بندی این اجرا

### آنچه هنگام تصمیم می‌دانستید
${runSummary.known}

### آنچه بعداً آشکار شد
${runSummary.revealed}

### مهم‌ترین تفاوت
${runSummary.difference}
`;

fs.writeFileSync("docs/scenario4-aar-case-a-snapshot.md", snapshot);

const jsx = fs.readFileSync("src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", "utf8");
assert.match(jsx, /<details className="s4-aar-statistics">/);
assert.doesNotMatch(jsx, /اگر برآورد نهایی 50٪ باشد و در واقع نقش اسرائیل تأیید نشود/);
assert.ok(jsx.indexOf("s4-aar-statistics") < jsx.indexOf("s4-aar-meaning"));

console.log(JSON.stringify({
  suite: "scenario4-aar-brier-ux",
  cases: 8,
  truthVariants: 3,
  turningPoints: 4,
  textSnapshot: "docs/scenario4-aar-case-a-snapshot.md",
  result: "passed",
}, null, 2));
