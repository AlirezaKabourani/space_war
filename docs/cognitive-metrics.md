# فرمول شاخص‌های بررسی شناختی

این سند منطق محاسبه شاخص‌های بخش «بررسی شناختی» را بر اساس لاگ فعلی پروژه توضیح می‌دهد. شاخص‌ها پروکسی رفتاری و آموزشی هستند و نباید به‌عنوان نتیجه روان‌سنجی قطعی تفسیر شوند.

## تعاریف پایه

- `QuizScored`: رخدادهای `option_confirm` که در `detail.isCorrect` مقدار boolean دارند.
- `MiniGameScored`: رخدادهای `mini_game_*` به‌جز `mini_game_start` و `mini_game_summary` که در `detail.isCorrect` مقدار boolean دارند.
- `AllScored = QuizScored + MiniGameScored`
- `N_scored`: تعداد `AllScored`
- `N_correct`: تعداد رخدادهای `AllScored` با `isCorrect=true`
- `T_decision_i`: برای Quiz مقدار `elapsedMs` و برای مینی‌گیم مقدار `detail.responseTimeMs`
- `N_start`: تعداد `scenario_start`
- `N_exit`: تعداد `scenario_exit`
- `clamp100(x) = max(0, min(100, round(x)))`

---

## شاخص‌های اصلی شناختی

### 1) دقت مفهومی کلی (`overallAccuracy`)

نسبت پاسخ‌های صحیح در Quiz و مینی‌گیم.

```text
overallAccuracy = round((N_correct / N_scored) * 100)
```

اگر `N_scored = 0` باشد، مقدار `0` است.

### 2) سرعت تصمیم‌گیری (`decisionSpeedSec`)

میانگین زمان تصمیم روی همه پاسخ‌های امتیازدار.

```text
avgDecisionMs = average(T_decision_i where T_decision_i > 0)
decisionSpeedSec = round(avgDecisionMs / 1000)
```

### 3) نرخ تردید/بازبینی (`hesitationRate`)

ترکیبی از تردید در Quiz و مینی‌گیم:

- در Quiz: اگر برای یک `nodeId` بیش از یک `option_select` ثبت شده باشد.
- در مینی‌گیم: اگر `changedAnswerCount > 0` یا `openedExplanation=true` باشد.

```text
hesitationRate =
  round(((N_hesitantQuizNodes + N_changedMiniGameCards + N_explanationMiniGameCards) / N_scored) * 100)
```

### 4) نرخ تغییر پاسخ (`answerChangeRate`)

تعداد تغییر واقعی گزینه قبل از ثبت پاسخ.

```text
answerChangeRate =
  round(((N_changedQuizNodes + N_changedMiniGameCards) / N_scored) * 100)
```

### 5) اصلاح موفق پس از تغییر (`successfulRevisionRate`)

فعلاً بر اساس Quiz محاسبه می‌شود:

```text
successfulRevisionRate = round((N_successfulRevision / N_revision) * 100)
```

- `N_revision`: نودهایی که کاربر گزینه را عوض کرده.
- `N_successfulRevision`: از میان آن‌ها، آخرین پاسخ صحیح بوده.
- اگر `N_revision = 0` باشد، مقدار `0` است.

### 6) استفاده از مرجع (`referenceUsageRate`)

ترکیبی از استفاده از مرجع/مثال در سناریو و توضیح بیشتر در مینی‌گیم.

```text
referenceUsageRate =
  round(((N_referenceUsedQuizNodes + N_explanationMiniGameCards) / N_scored) * 100)
```

### 7) استفاده از توضیح بیشتر (`explanationUsageRate`)

فقط برای مینی‌گیم محاسبه می‌شود.

```text
explanationUsageRate =
  round((N_explanationMiniGameCards / N_miniGameScored) * 100)
```

### 8) میانگین زمان مطالعه توضیح (`avgExplanationSec`)

```text
avgExplanationSec =
  round(average(explanationTimeMs where openedExplanation=true) / 1000)
```

### 9) اثر توضیح بر دقت (`guidanceBenefitScore`)

اختلاف دقت پاسخ‌هایی که با توضیح بیشتر ثبت شده‌اند و پاسخ‌هایی که بدون توضیح ثبت شده‌اند.

```text
accuracyWithExplanation = correct_with_explanation / total_with_explanation * 100
accuracyWithoutExplanation = correct_without_explanation / total_without_explanation * 100
guidanceBenefitScore = max(-100, min(100, accuracyWithExplanation - accuracyWithoutExplanation))
```

اگر یکی از دو گروه داده نداشته باشد، مقدار `0` است.

### 10) خطای با اطمینان بالا (`overconfidenceErrorRate`)

پاسخ‌های غلط مینی‌گیم که بدون توضیح بیشتر و بدون تغییر گزینه ثبت شده‌اند.

```text
overconfidenceErrorRate =
  round((N_wrong_noExplanation_noChange / N_miniGameScored) * 100)
```

این شاخص به معنی تشخیص قطعی اعتمادبه‌نفس نیست؛ فقط نشان می‌دهد کاربر بدون استفاده از راهنما و بدون بازبینی، پاسخ غلط ثبت کرده است.

### 11) تردید مفید (`productiveHesitationRate`)

از میان پاسخ‌هایی که نشانه تردید داشته‌اند، چند درصد به پاسخ صحیح ختم شده‌اند.

نشانه تردید در مینی‌گیم:

- `openedExplanation=true`
- یا `changedAnswerCount > 0`

```text
productiveHesitationRate =
  round((N_correct_hesitantMiniGame / N_hesitantMiniGame) * 100)
```

اگر `N_hesitantMiniGame = 0` باشد، مقدار `0` است.

### 12) اصطکاک مفهومی (`conceptFrictionScore`)

شاخص ترکیبی برای مفاهیمی که کاربر با آن‌ها درگیرتر بوده است. هرچه بالاتر باشد، یعنی فهم آن بخش احتمالاً سخت‌تر یا کندتر بوده.

```text
miniGameWrongRate = wrongMiniGame / N_miniGameScored * 100
miniGameChangeRate = totalChangedAnswerCount / N_miniGameScored * 100
miniGameAvgResponseFactor = min(100, miniGameAvgResponseMs / 100)

conceptFrictionScore =
  clamp100(
    0.35 * miniGameWrongRate +
    0.25 * explanationUsageRate +
    0.20 * miniGameAvgResponseFactor +
    0.20 * min(100, miniGameChangeRate)
  )
```

### 13) نرخ ترک سناریوی ناتمام (`unfinishedExitRate`)

```text
unfinishedExitRate = round((N_exit / N_start) * 100)
```

اگر `N_start = 0` باشد، مقدار `0` است.

### 14) بار شناختی تخمینی (`estimatedCognitiveLoad`)

فرمول ترکیبی فعلی:

```text
loadRaw =
  0.25 * hesitationRate +
  0.20 * answerChangeRate +
  0.15 * referenceUsageRate +
  0.20 * unfinishedExitRate +
  0.20 * conceptFrictionScore +
  0.15 * overconfidenceErrorRate +
  Penalty_longWrong

Penalty_longWrong = min(20, 5 * N_wrongAfterLongThink)
estimatedCognitiveLoad = clamp100(loadRaw)
```

`N_wrongAfterLongThink` تعداد پاسخ‌های غلط Quiz است که زمان آن‌ها از میانگین زمان تصمیم بیشتر بوده.

### 15) سبک تصمیم‌گیری (`styleLabel`)

```text
isFast = decisionSpeedSec > 0 && decisionSpeedSec <= 2
isAccurate = overallAccuracy >= 70
```

- سریع + دقیق → `شهودی-عملیاتی`
- سریع + غیردقیق → `شتاب‌زده`
- کند + دقیق → `تحلیلی-محتاط`
- کند + غیردقیق → `مردد/نیازمند آموزش`

### 16) ماتریس سرعت × دقت (`speedAccuracyQuadrant`)

- سریع + دقیق → `سریع و دقیق`
- سریع + غیردقیق → `سریع و غیردقیق`
- کند + دقیق → `کند و دقیق`
- کند + غیردقیق → `کند و غیردقیق`

### 17) تسلط حوزه‌ای (`domainScores`)

برای Quiz، حوزه از `nodeId` استخراج می‌شود:

- شامل `gametheory` → `نظریه بازی`
- شامل `wargame` → `بازی جنگ`
- شامل `space` → `بازی جنگ فضایی`
- سایر موارد → `سایر`

برای مینی‌گیم، اگر `detail.conceptTag` وجود داشته باشد همان استفاده می‌شود. در غیر این صورت از `roundId` و `cardId` استنتاج می‌شود:

- `zero_sum` → `بازی جمع صفر`
- `non_zero_sum` → `بازی مجموع‌غیرصفر`
- `incomplete` → `اطلاعات ناقص`
- `action_reaction` → `کنش و واکنش`
- `integrated` → `مفاهیم ترکیبی`

فرمول هر حوزه:

```text
accuracy_domain = round((N_correct_domain / N_total_domain) * 100)
```

### 18) ضعف‌های پرتکرار (`frequentErrors`)

برای Quiz بر اساس `nodeId` و برای مینی‌گیم بر اساس `cardId` محاسبه می‌شود.

```text
wrongCount_item = count(scored event with isCorrect=false)
```

۶ مورد با بیشترین خطا نمایش داده می‌شوند.

---

## فرمول محورهای نمودار راداری شناختی

نمودار راداری ۹ محور دارد. همه محورها به بازه ۰ تا ۱۰۰ نگاشت می‌شوند.

### 1) درک مفهومی

**معنا:** توان تشخیص درست مفاهیم در Quiz و مینی‌گیم.

```text
درک مفهومی = clamp100(overallAccuracy)
```

### 2) آگاهی موقعیتی

**معنا:** استفاده مؤثر از اطلاعات تکمیلی و تبدیل تردید به پاسخ درست.

```text
آگاهی موقعیتی =
  clamp100(
    0.35 * referenceUsageRate +
    0.25 * explanationUsageRate +
    0.40 * productiveHesitationRate
  )
```

### 3) کیفیت تصمیم

**معنا:** ترکیب دقت، اثر مثبت توضیح، و کم بودن خطای بدون بازبینی.

```text
کیفیت تصمیم =
  clamp100(
    0.55 * overallAccuracy +
    0.20 * max(0, guidanceBenefitScore) +
    0.25 * (100 - overconfidenceErrorRate)
  )
```

### 4) سرعت پردازش

**معنا:** سرعت نسبی رسیدن به پاسخ. زمان کمتر امتیاز بالاتر می‌دهد.

```text
سرعت پردازش =
  clamp100(100 - min(100, decisionSpeedSec * 20))
```

نمونه:

- `1s` → حدود `80`
- `3s` → حدود `40`
- `5s` یا بیشتر → `0`

### 5) مدیریت ریسک

**معنا:** ترکیب کامل‌کردن سناریو و پرهیز از پاسخ غلطِ بدون توضیح/بازبینی.

```text
مدیریت ریسک =
  clamp100(
    100 -
    0.45 * unfinishedExitRate -
    0.55 * overconfidenceErrorRate
  )
```

### 6) جست‌وجوی اطلاعات

**معنا:** تمایل به استفاده از مرجع، توضیح بیشتر و صرف زمان معقول برای مطالعه توضیح.

```text
جست‌وجوی اطلاعات =
  clamp100(
    0.35 * referenceUsageRate +
    0.45 * explanationUsageRate +
    0.20 * min(100, avgExplanationSec * 8)
  )
```

### 7) یادگیری و سازگاری

**معنا:** اینکه بازبینی، تردید یا توضیح بیشتر به تصمیم بهتر منجر شده یا نه.

```text
یادگیری و سازگاری =
  clamp100(
    0.30 * successfulRevisionRate +
    0.45 * productiveHesitationRate +
    0.25 * max(0, guidanceBenefitScore)
  )
```

### 8) مدیریت ابهام

**معنا:** توان تصمیم‌گیری در موقعیت‌های مبهم بدون خطای زیاد، مکث شدید یا نیاز بیش از حد به کمک.

```text
مدیریت ابهام = clamp100(100 - conceptFrictionScore)
```

هرچه `conceptFrictionScore` بالاتر باشد، مدیریت ابهام پایین‌تر نمایش داده می‌شود.

### 9) پایبندی به مأموریت

**معنا:** ادامه دادن سناریو تا پایان و ترک نکردن مسیر. فعلاً بر اساس خروج ناتمام محاسبه می‌شود.

```text
پایبندی به مأموریت =
  clamp100(100 - 0.8 * unfinishedExitRate)
```

نمونه:

- `unfinishedExitRate = 0` → امتیاز `100`
- `unfinishedExitRate = 50` → امتیاز `60`
- `unfinishedExitRate = 100` → امتیاز `20`

---

## نکات تفسیری

- شاخص‌های مینی‌گیم آموزشی‌اند و برای تثبیت مفهوم استفاده می‌شوند، نه سنجش روان‌شناختی قطعی.
- `decisionStylePreview` در مینی‌گیم فقط در لاگ داخلی ذخیره می‌شود و در داشبورد به‌عنوان برچسب قطعی نمایش داده نمی‌شود.
- شاخص جدی `Operational–Strategic Index` برای سناریوهای تصمیم‌محور بعدی رزرو شده است.
