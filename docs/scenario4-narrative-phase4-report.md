# گزارش اجرای فاز ۴ روایت سناریو ۴ — مرحله دوم

## نتیجه

بازنویسی مرحله دوم «اختلال بدون امضا» اجرا شد. جریان مرحله اکنون افت واقعی سرویس را از علت نامطمئن جدا نگه می‌دارد، دو برآورد انتساب را بدون جهت‌دهی ثبت می‌کند، سه تصمیم مرحله را با ۱۶ گزینه خنثی ارائه می‌دهد و جمع‌بندی را حداکثر در شش بخش مبتنی بر وضعیت واقعی می‌سازد.

## فایل‌های تغییرکرده در این فاز

- `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx`
- `src/ui/components/scenario/scenario-four/moves/move2.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts`
- `scripts/validate-s4-narrative-phase1.mjs`
- `scripts/validate-s4-narrative-phase4.mjs`
- `package.json`
- `docs/screenshots/scenario4-phase4/*`
- `docs/scenario4-narrative-phase4-report.md`

## اصلاح نشت trace پیش از Move 2

- نمایش `NarrativeRenderTrace` دیگر با صرف ادمین‌بودن فعال نمی‌شود.
- trace فقط زمانی render می‌شود که کاربر ادمین، گزینه صریح «نمایش فراداده روایت» را در پنل اشکال‌زدایی روشن کند؛ مقدار پیش‌فرض خاموش است.
- در حالت Player، حتی اگر مقدار debug درخواست شود، guard تابع `canRenderNarrativeTrace` اجازه نمایش نمی‌دهد.
- داده trace در `NarrativeSection` و logging حفظ شده و فقط Player DOM پاک شده است؛ پنهان‌سازی CSS استفاده نشده است.
- آزمون و QA مرورگر نبود `move1.update.*`، `move2.update.*`، `mission.status`، `iran.resources` و option idها را در رندر عادی تأیید کردند.

## Opening مرحله دوم

- عنوان: «مرحله دوم — اختلال بدون امضا»
- برچسب وضعیت: «اثر عملیاتی، علت نامطمئن»
- روایت پایه، چهار فرضیه باز و جمله محدودیت انتساب مطابق brief بازنویسی شدند.
- مشاهده دارایی دوم فقط با action/flag واقعی نمایش داده می‌شود.
- زمینه فاصله‌گرفتن R-31 و توجه رسانه‌ای فقط با وضعیت واقعی مرحله قبل افزوده می‌شوند.
- prompt پایانی پیش از برآورد اولیه نمایش داده می‌شود.

## بسته شواهد

شناسه‌های موجود حفظ شدند و هر هشت کارت اکنون عنوان، وضعیت، بدنه و limitation مشخص دارد. سه کارت پایه عبارت‌اند از:

- `E_M2_01`: ثبت افت سرویس
- `E_M2_02`: بررسی فنی اولیه
- `E_M2_03`: زمینه مداری

کارت‌های فنی پویا، داده متحدان و داده تجاری نیز limitation منبع‌محور دارند. نتیجه تازه‌ی بررسی، در صورت ایجاد evidence واقعی، پیش از برآورد دوم نمایش داده می‌شود. هیچ کارت یا متن Player-facing علت پنهان حادثه را آشکار نمی‌کند.

## دو صفحه برآورد انتساب

- هر دو slider در بازه ۰ تا ۱۰۰ و با گام ۵ باقی ماندند.
- برچسب‌ها: بسیار بعید، بعید، نامطمئن، محتمل و بسیار محتمل.
- صفحه اول بر موقتی‌بودن برآورد تأکید می‌کند.
- صفحه دوم مقدار قبلی را نشان می‌دهد و افزایش، کاهش یا ثابت‌ماندن را به‌طور برابر مجاز توصیف می‌کند.
- هیچ correctness، hidden target، cognitive score یا system confidence نمایش داده نمی‌شود.

## تأیید ۱۶ گزینه و شناسه‌ها

### تصمیم ۱ از ۳ — بررسی علت (۵ گزینه)

- `m2_a_technical_diagnostics`
- `m2_a_second_sensor`
- `m2_a_ally_intel`
- `m2_a_commercial_validation`
- `m2_a_act_with_current_data`

### تصمیم ۲ از ۳ — تداوم مأموریت (۵ گزینه)

- `m2_m_continue_normal`
- `m2_m_activate_fallback`
- `m2_m_reduce_load`
- `m2_m_protective_reconfiguration`
- `m2_m_split_service`

### تصمیم ۳ از ۳ — موضع در برابر اسرائیل (۶ گزینه)

- `m2_r_no_counteraction`
- `m2_r_request_explanation`
- `m2_r_private_warning`
- `m2_r_joint_allied_response`
- `m2_r_request_defensive_authority`
- `m2_r_deconfliction_offer`

تمام گزینه‌ها description و trade-off مستقل دارند. شناسه، تعداد و معنای عملیاتی گزینه‌ها ثابت مانده است. ثبت دلیل نیز همان هفت معنا/شناسه را حفظ می‌کند.

## پوشش واکنش بازیگران

متن Player-facing هر هفت action اسرائیل بازنویسی و برای هرکدام caption مستقل نقشه اضافه شد:

- `maintain_pressure`
- `reduce_proximity`
- `introduce_second_asset`
- `continue_ambiguous_activity`
- `issue_denial`
- `offer_mutual_separation`
- `pause_and_observe`

انکار اسرائیل به‌عنوان موضع آن بازیگر نمایش داده می‌شود، نه حقیقت. پیشنهاد فاصله‌گذاری نیز صرفاً proposal است و پذیرش یا `negotiated_deescalation` را نتیجه نمی‌دهد.

## پوشش injectها

- `m2_inject_2b_intelligence_delay`: تأخیر در داده تکمیلی
- `m2_inject_2c_commercial_restriction`: محدودیت دسترسی به داده تجاری
- `m2_inject_2d_red_offramp`: پیشنهاد فاصله‌گذاری
- `m2_inject_2e_coalition_friction`: اختلاف درباره انتساب

دو inject اطلاعاتی بلافاصله پس از تصمیم بررسی و فقط با flag واقعی نمایش داده می‌شوند. دو inject واکنشی پس از adjudication و از snapshot واقعی وارد جمع‌بندی می‌شوند. اختلاف انتساب به‌طور خودکار «شکاف ائتلافی» نامیده نمی‌شود.

## نتایج ۱۰ شاخه QA

| شاخه | نتیجه |
|---|---|
| A — بررسی فنی داخلی | evidence فنی واقعی اضافه شد؛ انتساب خارجی ساخته نشد. |
| B — منبع رصد دوم | هزینه SSA برابر ۲۰-، پایش مستقل و inject تأخیر واقعی تأیید شد. |
| C — داده متحدان | هزینه سرمایه سیاسی ۸- و افشای امن ۵- ثبت شد؛ توافق متحد خودکار نبود. |
| D — اعتبارسنجی تجاری | هر دو مسیر deterministic با/بدون محدودیت آزمون شد؛ inject فقط با trigger فعال بود. |
| E — تصمیم با اطلاعات فعلی | آگاهی موقعیتی و evidence جدید به‌صورت ساختگی افزایش نیافت. |
| F — ظرفیت جایگزین + بدون اقدام متقابل | تاب‌آوری مأموریت افزایش یافت؛ signal سیاسی/ائتلافی ساخته نشد. |
| G — پاسخ هماهنگ | هزینه سیاسی و اشتراک اطلاعات ثبت و پاسخ واقعی متحد resolve شد. |
| H — مجوز دفاعی | flag و signal دفاعی برگشت‌پذیر ثبت شد و متن آن حمله نیست. |
| I — پیشنهاد فاصله‌گذاری | proposal ثبت شد؛ کاهش تنش مذاکره‌شده resolve نشد. |
| J — انکار | به‌عنوان ادعای اسرائیل همراه با محدودیت آن نمایش داده شد. |

## جمع‌بندی مرحله دوم

خروجی حداکثر شش بخش دارد: وضعیت A-17، ارزیابی علت، تحول برآورد کاربر، رفتار واقعی اسرائیل، محیط ائتلافی/تجاری معنادار و منابع/ورود به مرحله بعد. تغییر ۵۰٪ به ۵۰٪ نیز صریح نمایش داده می‌شود و hidden incident cause در متن وجود ندارد. CTA ورود به مرحله سوم در ارتفاع ۷۶۸ نیز sticky و قابل مشاهده است.

## QA تصویری

در ۱۰۰٪ zoom و دو viewport `1440×900` و `1366×768` از ۹ حالت خواسته‌شده تصویر گرفته شد:

- `opening`
- `attribution-1`
- `decision-1`
- `inject`
- `attribution-2`
- `decision-2`
- `decision-3`
- `reason`
- `update`

تصاویر در `docs/screenshots/scenario4-phase4/` و سنجه‌ها در `qa-metrics.json` هستند. در همه ۱۸ تصویر:

- overflow افقی سند و پنل اصلی وجود ندارد.
- RTL صحیح است.
- trace/شناسه داخلی در متن صفحه دیده نمی‌شود.
- CTA در نقاط لازم قابل مشاهده است؛ اسکرول داخلی فقط برای محتوای بلند استفاده می‌شود.

## آزمون‌ها و build

- `npm run test:s4-narrative-phase4`: موفق
  - ۱۶ گزینه، ۷ دلیل، ۷ واکنش اسرائیل، ۴ inject و ۱۰ شاخه QA
  - guard نشت trace
  - conditional opening و actor-specific caption
  - محدودیت شواهد و عدم افشای حقیقت پنهان
- `npm run test:s4-models`: موفق
  - فازهای ۱، ۲، ۳ و ۴
  - ۶۰ آزمون Cognitive V3
  - آزمون‌های مدل و Monte Carlo با ۱۰۰٬۰۰۰ اجرا
- ESLint فایل‌های تغییرکرده: موفق
- `npm run build`: موفق؛ هشدار شناخته‌شده اندازه chunk باقی است.
- `git diff --check`: موفق؛ فقط هشدار line-ending محیط ویندوز گزارش شد.

## تأیید کنترل دامنه

- در فاز ۴ هیچ منطق adjudication، actor utility/resolution یا trigger تغییر نکرد.
- hidden incident cause و نحوه انتخاب آن تغییر نکرد.
- هزینه، اثر و recovery منابع تغییر نکرد.
- Cognitive V3، loadingها و profileها تغییر نکردند.
- attribution math تغییر نکرد.
- Move 3، End State، Final Report و AAR بازنویسی نشدند.
- فاز ۵ آغاز نشد.
