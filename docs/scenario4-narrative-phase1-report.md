# گزارش اجرای فاز ۱ معماری روایت سناریو ۴

## دامنه اجرا

این فاز فقط زیرساخت روایت را از JSX و adjudicatorهای پراکنده جدا کرده است. متن گزینه‌ها و سؤال‌ها، منطق بازیگران، منابع، Cognitive V3، تقدم End State، Brier/BSS، ساختار سه‌مرحله‌ای و جریان بازی تغییر نکرده‌اند. بازنویسی ادبی و طراحی UI عمداً وارد این فاز نشده است.

## ممیزی پیش از تغییر

سه سند الزامی `scenario4-narrative-inventory.md`، `scenario4-narrative-inventory.json` و `scenario4-post-v3-fix-report.md` و مسیرهای اصلی سناریو، moveها، actorها، adjudicatorها، AAR و Cognitive V3 بررسی شدند.

موجودی JSON شامل ۸۲۰ ورودی بود. دسته‌ها هم‌پوشان هستند و جمع آن‌ها نباید به‌عنوان جمع مستقل تفسیر شود:

| دسته ممیزی | تعداد |
|---|---:|
| رشته‌های فایل اصلی ScenarioFourRedesignedScenarioOne.tsx | ۴۹۴ |
| رشته‌های move configهای ۱ تا ۳ | ۱۲۷ |
| actor-driven | ۹۲ |
| injectهای واقعی شناسایی‌شده در کد | ۸ شناسه |
| End State-driven | ۹ |
| AAR اختصاصی | ۲۷ |
| برچسب‌های مشترک status/resources/AAR | ۴۸ |
| static | ۶۰۶ |
| generated/conditional | ۲۱۴ |
| choice-driven | ۲۸۳ |
| hidden-driven | ۸۵ |

موجودی قدیمی در چند نقطه قبل از اصلاحات Post-V3 تولید شده بود؛ بنابراین برای انتقال رشته‌ها، کد جاری مرجع نهایی قرار گرفت و معنای فعلی متن‌ها حفظ شد.

## معماری افزوده‌شده

- `narrativeTypes.ts`: قراردادهای `Scenario4NarrativeContext`، `Scenario4AarNarrativeContext`، `NarrativeSection`، `NarrativeRenderTrace`، inject، End State و گزارش نهایی.
- `buildNarrativeContext.ts`: projection خواندنی از state، snapshot، تصمیم‌ها، telemetry، evidence، actor reaction و injectهای واقعی. این builder عمومی هیچ فیلدی از `state.hidden` یا `hiddenAarData` نمی‌خواند.
- `narrativeCatalogFa.ts`: Intro فعلی، متن‌های افتتاح مرحله، mapping واکنش بازیگران، ۸ inject، برچسب‌ها و ۹ ساختار مستقل End State.
- `narrativeSelectors.ts`: selectorهای افتتاح سه مرحله، situation update، actor/inject، End State و گزارش نهایی.
- `narrativeConsistency.ts`: کنترل رخدادهای ساخته‌نشده، پذیرش کاهش تنش، پیام عمومی، حمایت متحدان و هماهنگی scene/end-state.

برای AAR یک extension صریح و جداگانه با `canRevealHiddenTruth: true` ساخته شد. context عمومی همیشه `canRevealHiddenTruth: false` دارد.

## اتصال به رابط و موتور

- Intro به‌صورت data-driven رندر می‌شود و wording جاری آن حفظ شده است؛ disclaimer Post-V3 نیز در بخش قواعد نمایش داده می‌شود.
- آغاز مرحله ۱، ۲ و ۳ از selector می‌آید.
- اشاره به دارایی دوم اسرائیل فقط با action/flag واقعی نمایش داده می‌شود.
- شدت افت مرحله ۳ در `knowledge.serviceImpactSeverity` به‌عنوان داده قابل‌مشاهده نگهداری و مستقیماً در روایت استفاده می‌شود؛ فرمول تعیین شدت و اثر آن بر state تغییر نکرده است.
- situation update مرحله ۱ و ۲ دیگر در adjudicator ساخته نمی‌شود و از snapshot واقعی تولید می‌شود.
- گزارش نهایی از state، سه برآورد انتساب، واکنش‌های واقعی و End State واقعی تولید می‌شود و hidden truth را نمی‌خواند.
- trace شامل narrative id و source ids فقط برای admin رندر می‌شود.
- برچسب End State در داشبورد و گزارش از catalog مرکزی می‌آید.

## انتقال رشته‌ها

۵۸ رشته/قطعه ثبت‌شده در موجودی از فایل اصلی TSX خارج شد:

- Intro: ۱۶
- افتتاح مرحله ۱: ۱۱
- افتتاح مرحله ۲: ۱۴
- افتتاح مرحله ۳: ۸
- برچسب‌های ۹ End State: ۹

علاوه بر آن، templateهای situation update مرحله ۱ و ۲ و prose گزارش نهایی از adjudicatorها حذف و در لایه روایت متمرکز شدند. برچسب‌های عمومی UI، متن سؤال‌ها/گزینه‌ها، evidence UI و AAR موجود که جزو منطق روایی این فاز نبودند در محل فعلی باقی ماندند.

## پوشش بازیگران، injectها و End Stateها

۴۱ action در catalog پوشش داده شد:

- اسرائیل، مراحل ۱ تا ۳: ۱۹ action
- متحد، مراحل ۱ تا ۳: ۱۴ action
- تجاری، مراحل ۱ تا ۳: ۸ action

هر action ناشناخته به‌جای fallback گمراه‌کننده خطای توسعه ایجاد می‌کند.

هر ۸ inject خواسته‌شده دارای عنوان، شرح رخداد، اهمیت و وضعیت نمایش است. هر ۹ End State دارای `title`، `shortSummary` و `closingLine` مستقل و `causalFacts` مشتق‌شده از اجرای واقعی هستند. تقدم resolver تغییر نکرده است.

## تست و اعتبارسنجی

- `npm run test:s4-narrative-phase1`: پاس
  - نبود/وجود شرطی دارایی دوم
  - سه شدت متفاوت مرحله ۳
  - ۹ روایت مستقل End State
  - گزارش نهایی state-derived
  - استقلال تمام selectorهای عمومی از hidden truth
  - پوشش ۴۱ actor action و ۸ inject
  - نبود Blue/Red در متن player-facing catalog
  - guardهای A تا F
  - AAR observation مشتق از snapshot واقعی
  - عدم mutation در state
- `npm run test:s4-models`: پاس
  - مدل منابع و orientation قبلی
  - ۶۰ تست Cognitive V3
  - hidden-state independence، AAR consistency، country naming، End State consistency و full-path regression
  - Monte Carlo با ۱۰۰٬۰۰۰ اجرا
- ESLint روی تمام فایل‌های تغییرکرده: پاس
- `npm run build`: پاس

## فایل‌های افزوده یا تغییرکرده

افزوده‌شده:

- `src/ui/components/scenario/scenario-four/narrative/narrativeTypes.ts`
- `src/ui/components/scenario/scenario-four/narrative/buildNarrativeContext.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeConsistency.ts`
- `scripts/validate-s4-narrative-phase1.mjs`
- `docs/scenario4-narrative-phase1-report.md`

تغییرکرده:

- `ScenarioFourRedesignedScenarioOne.tsx`
- `adjudication/adjudicator.ts`
- `adjudication/move2Adjudicator.ts`
- `adjudication/move3Adjudicator.ts`
- `model/types.ts`
- `package.json`

## موارد باقی‌مانده برای فازهای بعد

- بازنویسی و پرداخت ادبی فارسی، کوتاه‌سازی Intro و تغییر لحن انجام نشده است.
- متن سؤال‌ها، گزینه‌ها، evidence package، Help/Glossary و prose نمایشی AAR طبق محدودیت فاز ۱ بازنویسی نشده‌اند.
- موجودی narrative بهتر است بعد از پایان فازهای محتوایی دوباره تولید شود تا شماره خطوط و wording Post-V3 را منعکس کند.

فاز ۱ در همین نقطه متوقف شده است و هیچ کار Phase 2 انجام نشده است.
