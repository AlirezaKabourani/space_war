# گزارش اجرای فاز ۳ روایت سناریو ۴ — Move 1

## وضعیت اجرا

فاز ۳ مطابق فایل `Scenario4_Codex_Narrative_Phase3_Move1_FA.txt` اجرا شد و در پایان Move 1 متوقف شد. Move 2، Move 3، گزارش نهایی، AAR و فاز ۴ بازنویسی نشده‌اند.

## بخش‌های بازنویسی‌شده Move 1

- افتتاحیه «مرحله اول — نزدیک‌شدن» با برچسب «رفتار مداری مبهم»، سه توضیح ممکن و جمع‌بندی عدم قطعیت
- سه شاهد پایه و محدودیت اختصاصی هر شاهد
- تصمیم ۱ از ۳: کاهش ابهام
- تصمیم ۲ از ۳: حفاظت از A-17 با context پویا بر اساس انتخاب اطلاعاتی
- تصمیم ۳ از ۳: پیام و سیگنال با context پویا بر اساس وضعیت حفاظتی واقعی
- جزئیات و موازنه اصلی تمام ۱۳ گزینه Move 1
- ثبت دلیل با ۶ معنای قبلی و خط معرفی جدید
- سه رخداد شرطی Move 1 و CTA اختصاصی اختلاف برآورد مسیر
- پنج واکنش اسرائیل و متن‌های Move 1 متحد/تجاری
- کپشن نقشه منطبق با action واقعی R-31
- جمع‌بندی مرحله اول، حداکثر در پنج بخش و مبتنی بر snapshot قابل مشاهده
- پیام هزینه قطعی منابع پس از هر تصمیم؛ برای انتخاب بدون هزینه نیز «هزینه مستقیم منابع: ندارد»

تمام متن‌های جدید در `narrativeCatalogFa.ts` یا selectorهای ماژول روایت قرار گرفته‌اند. JSX فقط داده روایی و خروجی selectorها را رندر می‌کند.

## شواهد پایه: مقایسه حجم متن

روش شمارش در هر دو نسخه یکسان است و عنوان، وضعیت، بدنه و limitation نمایش‌داده‌شده هر سه کارت را دربر می‌گیرد.

| وضعیت | تعداد کارت | تعداد واژه |
|---|---:|---:|
| پیش از فاز ۳ | ۳ | ۱۴۴ |
| پس از فاز ۳ | ۳ | ۱۰۰ |

سه تمایز اصلی حفظ شده‌اند: داده مداری، قابلیت‌های R-31 و تحلیل چندفرضیه‌ای. limitation هر کارت اکنون جدا و اختصاصی است.

## تأیید شناسه گزینه‌ها

تعداد گزینه‌ها و شناسه‌ها تغییر نکردند:

| پنجره | شناسه‌ها |
|---|---|
| اطلاعات — ۴ گزینه | `m1_i_passive`، `m1_i_dedicated_ssa`، `m1_i_commercial`، `m1_i_allied_network` |
| حفاظت — ۴ گزینه | `m1_p_hold`، `m1_p_covert_readiness`، `m1_p_visible_protection`، `m1_p_mission_reposition` |
| ارتباطات — ۵ گزینه | `m1_c_none`، `m1_c_private`، `m1_c_allies`، `m1_c_public_warning`، `m1_c_private_allied` |
| ثبت دلیل — ۶ گزینه | همان شش شناسه متنی قبلی؛ برچسب «حفظ هماهنگی با متحدان» بدون تغییر شناسه داخلی قبلی نمایش داده می‌شود. |

وزن‌های چهار گزینه اطلاعاتی نیز با مقادیر پیش از فاز ۳ در آزمون regression مقایسه می‌شوند.

## پوشش واکنش بازیگران

هر پنج action مرحله اول اسرائیل متن و کپشن مستقل دارد:

- `continue_approach`
- `slow_approach`
- `hold_position`
- `send_routine_explanation`
- `break_off`

توضیح عادی اپراتور R-31 صریحاً تأیید مستقل تلقی نمی‌شود. متن actionهای Move 1 متحد و تجاری نیز برای وضوح بازنویسی شد؛ resolver، utility، trigger و consequences آن‌ها تغییر نکرد.

## پوشش رخدادهای شرطی

- `m1_inject_1a_conflicting_data`: اختلاف در برآورد مسیر؛ فقط در صورت فعال‌شدن flag واقعی نمایش داده می‌شود و CTA «ادامه با اطلاعات فعلی» دارد.
- `m1_inject_1b_ally_request`: درخواست توضیح از سوی متحد؛ فقط پس از trigger واقعی در جمع‌بندی ظاهر می‌شود.
- `m1_inject_1c_media`: توجه رسانه‌ای؛ فقط پس از trigger واقعی در جمع‌بندی ظاهر می‌شود.

شناسه‌ها و منطق triggerها تغییر نکرده‌اند.

## نتایج شش مسیر QA

1. **A — پایش موجود + بدون تغییر + بدون پیام:** سیگنال حفاظتی، عمومی یا ائتلافی ساخته نشد؛ ابهام در جمع‌بندی باقی ماند و هزینه مستقیم منابع «ندارد» نمایش داده شد.
2. **B — SSA اختصاصی + آمادگی پنهان + تماس خصوصی:** شاهد `E_SSA_01` اضافه شد، تماس خصوصی ثبت شد، هشدار عمومی ساخته نشد و هزینه SSA برابر با `−18` باقی ماند.
3. **C — داده تجاری + حفاظت آشکار + هشدار عمومی:** با seed قطعی، اختلاف داده و توجه رسانه‌ای فعال شدند؛ هیچ انتساب حمله‌ای در متن ساخته نشد.
4. **D — شبکه متحدان + تغییر محسوس مأموریت + هماهنگی متحدان:** اشتراک با متحد، سیگنال ائتلافی و هزینه‌های واقعی سیاسی/افشا/حفاظتی در snapshot حفظ شدند.
5. **E — `break_off`:** متن واکنش و کپشن نقشه هر دو افزایش فاصله R-31 از A-17 را نشان دادند.
6. **F — `send_routine_explanation`:** توضیح اپراتور نمایش داده شد، اما حقیقت تأییدشده تلقی نشد.

## QA رابط کاربری

بازبینی RTL در بزرگ‌نمایی ۱۰۰٪ برای `1440×900` و `1366×768` انجام شد. افتتاحیه، شواهد و limitation، هر سه تصمیم، ثبت دلیل و جمع‌بندی بررسی شدند:

- شکست افقی: صفر
- سؤال تصمیم در هر سه پنجره قابل مشاهده
- تعداد کارت‌ها: ۴، ۴ و ۵
- CTA در تمام صفحات آزموده‌شده قابل مشاهده و در صفحات بلند ثابت
- مرور داخلی فقط برای محتوای بلند فعال است
- متن A-17 و R-31 و جهت RTL صحیح است

تصاویر و سنجه‌ها در `docs/screenshots/scenario4-phase3/` قرار دارند:

- `1366x768-opening.png`
- `1366x768-evidence.png`
- `1366x768-decision-1.png`
- `1366x768-decision-2.png`
- `1366x768-decision-3.png`
- `1366x768-reason.png`
- `1366x768-update.png`
- نسخه‌های متناظر `1440x900-*`
- `qa-metrics.json`

## آزمون‌ها

- `npm run test:s4-narrative-phase3`: موفق
  - ۳ شاهد پایه و limitationها
  - ۴/۴/۵ گزینه و ۶ دلیل با شناسه‌های ثابت
  - وزن‌های شناختی ثابت
  - ۵ action اسرائیل و ۳ inject
  - استقلال از hidden truth
  - حداکثر پنج بخش در situation update
  - شش مسیر QA
  - نبود Blue/Red، شناسه‌های حقیقت پنهان و Deconfliction در متن player-facing Move 1
- `npm run test:s4-models`: موفق؛ شامل آزمون‌های مدل، ۶۰ آزمون Cognitive V3، Monte Carlo صد هزار اجرا و تست‌های فازهای ۱ تا ۳
- ESLint فایل‌های تغییرکرده: موفق
- `npm run build`: موفق؛ هشدار قبلی اندازه chunk همچنان وجود دارد.

## فایل‌های تغییرکرده در فاز ۳

- `src/ui/components/common/Card.tsx`
- `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx`
- `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.css`
- `src/ui/components/scenario/scenario-four/moves/move1.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeTypes.ts`
- `scripts/validate-s4-narrative-phase3.mjs`
- `package.json`
- `docs/screenshots/scenario4-phase3/*`
- `docs/scenario4-narrative-phase3-report.md`

## تأیید کنترل دامنه

- adjudication، actor resolverها، utility و triggerهای بازیگران تغییر نکردند.
- resource cost/effect و recovery تغییر نکردند.
- Cognitive V3، O/S loadingها و profileها تغییر نکردند.
- hidden state و حقیقت پنهان تغییر نکردند و در Move 1 افشا نمی‌شوند.
- تعداد گزینه‌ها، معنای آن‌ها و شناسه‌های داخلی ثابت ماندند.
- متن Move 2 و Move 3 بازنویسی نشد.
- فاز ۴ آغاز نشده است.
