# فرمول شاخص‌های بررسی شناختی

این سند، فرمول‌ها و منطق محاسبه شاخص‌های بخش «بررسی شناختی» را بر اساس لاگ فعلی پروژه توضیح می‌دهد.

## تعاریف پایه

- `N_scored`: تعداد رخدادهای `option_confirm` که در `detail` مقدار `isCorrect` دارند.
- `N_correct`: تعداد رخدادهای `option_confirm` با `isCorrect=true`.
- `T_decision_i`: مقدار `elapsedMs` برای هر پاسخ امتیازدار.
- `Node`: یک `nodeId` (گره/سوال).
- `N_start`: تعداد `scenario_start`.
- `N_exit`: تعداد `scenario_exit` (خروج ناتمام).

---

## 1) دقت مفهومی کلی (`overallAccuracy`)

```text
overallAccuracy = round((N_correct / N_scored) * 100)
```

- اگر `N_scored = 0` باشد، مقدار `0` در نظر گرفته می‌شود.

## 2) سرعت تصمیم‌گیری (`decisionSpeedSec`)

ابتدا میانگین زمان تصمیم روی پاسخ‌های امتیازدار:

```text
avgDecisionMs = sum(T_decision_i) / count(T_decision_i > 0)
```

سپس:

```text
decisionSpeedSec = round(avgDecisionMs / 1000)
```

## 3) نرخ تردید/بازبینی (`hesitationRate`)

- برای هر `nodeId` اگر تعداد `option_select` بیشتر از ۱ باشد، آن نود «مردد» حساب می‌شود.
- `N_hesitantNodes`: تعداد این نودها.

```text
hesitationRate = round((N_hesitantNodes / N_scored) * 100)
```

## 4) نرخ تغییر پاسخ (`answerChangeRate`)

- برای هر `nodeId`، اگر تعداد `optionId` یکتای انتخاب‌شده > 1 باشد، تغییر پاسخ رخ داده است.
- `N_changedNodes`: تعداد نودهای تغییرپاسخ.

```text
answerChangeRate = round((N_changedNodes / N_scored) * 100)
```

## 5) نرخ اصلاح موفق پس از تغییر (`successfulRevisionRate`)

- فقط نودهایی که تغییر پاسخ داشته‌اند:
  - `N_revision`: تعداد این نودها
  - `N_successfulRevision`: از میان آن‌ها، نودهایی که آخرین `option_confirm` امتیازدارشان `isCorrect=true` است

```text
successfulRevisionRate = round((N_successfulRevision / N_revision) * 100)
```

- اگر `N_revision = 0` باشد، مقدار `0` است.

## 6) نرخ استفاده از مرجع (`referenceUsageRate`)

در هر `nodeId` اگر یکی از شرایط زیر برقرار باشد:

- رخداد `reference_open` ثبت شده باشد
- یا `node_enter` با `nodeId` شامل `example` ثبت شده باشد

آنگاه آن نود «استفاده از مرجع» دارد.

```text
referenceUsageRate = round((N_referenceUsedNodes / N_scored) * 100)
```

## 7) نرخ ترک سناریوی ناتمام (`unfinishedExitRate`)

```text
unfinishedExitRate = round((N_exit / N_start) * 100)
```

- اگر `N_start = 0` باشد، مقدار `0` است.

## 8) بار شناختی تخمینی (`estimatedCognitiveLoad`)

فرمول ترکیبی وزنی:

```text
loadRaw =
  0.25 * hesitationRate +
  0.20 * answerChangeRate +
  0.15 * referenceUsageRate +
  0.20 * unfinishedExitRate +
  Penalty_longWrong
```

که:

```text
Penalty_longWrong = min(20, 5 * N_wrongAfterLongThink)
```

- `N_wrongAfterLongThink`: تعداد پاسخ‌های غلطی که `elapsedMs` آن‌ها از میانگین زمان تصمیم بیشتر بوده.

خروجی نهایی:

```text
estimatedCognitiveLoad = clamp(round(loadRaw), 0, 100)
```

## 9) سبک تصمیم‌گیری (`styleLabel`)

تعاریف:

- `isFast`: اگر `decisionSpeedSec <= 2` و بزرگ‌تر از صفر
- `isAccurate`: اگر `overallAccuracy >= 70`

قواعد:

- سریع + دقیق: `شهودی-عملیاتی`
- سریع + غیردقیق: `شتاب‌زده`
- کند + دقیق: `تحلیلی-محتاط`
- کند + غیردقیق: `مردد/نیازمند آموزش`

## 10) ماتریس سرعت×دقت (`speedAccuracyQuadrant`)

با همان قواعد `isFast` و `isAccurate`:

- سریع + دقیق: `سریع و دقیق`
- سریع + غیردقیق: `سریع و غیردقیق`
- کند + دقیق: `کند و دقیق`
- کند + غیردقیق: `کند و غیردقیق`

## 11) تسلط حوزه‌ای (`domainScores`)

نگاشت حوزه از `nodeId`:

- شامل `gametheory` → `نظریه بازی`
- شامل `wargame` → `بازی جنگ`
- شامل `space` → `بازی جنگ فضایی`
- غیر از این‌ها → `سایر`

برای هر حوزه:

```text
accuracy_domain = round((N_correct_domain / N_total_domain) * 100)
```

## 12) ضعف‌های پرتکرار (`frequentErrors`)

برای هر `nodeId`:

```text
wrongCount_node = count(option_confirm scored with isCorrect=false)
```

سپس نزولی مرتب می‌شود و ۶ مورد اول نمایش داده می‌شود.

---

## نکته تفسیری

این شاخص‌ها «پروکسی رفتاری» هستند و تشخیص بالینی/روان‌سنجی قطعی محسوب نمی‌شوند. خروجی باید در کنار زمینه سناریو و قضاوت آموزشی/عملیاتی تفسیر شود.

---

## فرمول ۹ محور نمودار راداری شناختی

در نمودار راداریِ صفحه «بررسی شناختی»، هر محور به بازه ۰ تا ۱۰۰ نگاشت می‌شود:

### 1) درک مفهومی

```text
درک مفهومی = clamp( overallAccuracy , 0, 100 )
```

### 2) آگاهی موقعیتی

```text
آگاهی موقعیتی = clamp( 0.4 * referenceUsageRate + 0.6 * successfulRevisionRate , 0, 100 )
```

### 3) کیفیت تصمیم

```text
کیفیت تصمیم = clamp( 0.7 * overallAccuracy + 0.3 * successfulRevisionRate , 0, 100 )
```

### 4) سرعت پردازش

```text
سرعت پردازش = clamp( 100 - min(100, decisionSpeedSec * 20) , 0, 100 )
```

### 5) مدیریت ریسک

```text
مدیریت ریسک = clamp( 100 - unfinishedExitRate , 0, 100 )
```

### 6) جست‌وجوی اطلاعات

```text
جست‌وجوی اطلاعات = clamp( referenceUsageRate , 0, 100 )
```

### 7) یادگیری و سازگاری

```text
یادگیری و سازگاری = clamp( successfulRevisionRate , 0, 100 )
```

### 8) مدیریت منابع

در نسخه فعلی به دلیل نبود فیلدهای مستقیم منابع در لاگ، مقدار ثابت استفاده می‌شود:

```text
مدیریت منابع = 50
```

### 9) پایبندی به مأموریت

```text
پایبندی به مأموریت = clamp( 100 - 0.8 * unfinishedExitRate , 0, 100 )
```

---

### تعریف clamp

```text
clamp(x, 0, 100) = max(0, min(100, round(x)))
```
