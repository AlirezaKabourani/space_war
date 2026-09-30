# گزارش فاز ۶ — ممیزی نهایی، QA و بسته خروجی روایت سناریو ۴

## ۱. نتیجه نهایی

فاز ۶ کامل شد. مسیر Player و Admin، متن‌های روایی، شواهد، گزینه‌ها، ۹ وضعیت پایانی، گزارش نهایی، AAR، پنج viewport و ۱۰٬۰۰۰ اجرای seed‌دار بررسی شدند. هیچ crash، mapping گمشده، متن `undefined`، overflow افقی، نشت شناسه داخلی یا افشای حقیقت پنهان پیش از AAR ثبت نشد.

این فاز هیچ مقایسه یا نگاشت خارجی با NPEC/NATO/UK/RAND/CSIS یا منبع دیگری انجام نداده است.

## ۲. فایل‌های اصلاح‌شده یا افزوده‌شده در فاز ۶

پیاده‌سازی:

- `src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts`
- `src/ui/components/scenario/scenario-four/narrative/narrativeTypes.ts`
- `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx`
- `src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts` — فقط همگام‌سازی برچسب DW7؛ اعداد پروفایل تغییر نکردند.
- `src/ui/components/scenario/scenario-four/model/resourceEngineV2.ts` — فقط متن نمایشی متناظر با DW7؛ هزینه و recovery تغییر نکرد.
- `package.json`

ابزارهای QA و خروجی:

- `scripts/validate-s4-narrative-phase6.mjs`
- `scripts/generate-s4-narrative-final-exports.mjs`
- `scripts/capture-s4-phase6-qa.mjs`

اسناد اصلی:

- `docs/scenario4-narrative-final-inventory.md`
- `docs/scenario4-narrative-final-inventory.json`
- `docs/scenario4-full-narrative-transcript.md`
- `docs/scenario4-branch-catalog.md`
- `docs/scenario4-reference-mapping-input.md`
- `docs/scenario4-reference-review-file-list.md`
- `docs/scenario4-evidence-final-audit.md`
- `docs/scenario4-option-neutrality-final-audit.md`
- `docs/scenario4-option-neutrality-final-audit.json`
- `docs/scenario4-duplicate-final-audit.md`
- `docs/scenario4-end-state-resolver-fixtures.json`
- `docs/scenario4-end-state-snapshots.json`
- `docs/scenario4-seeded-qa-10000.json`
- `docs/screenshots/scenario4-phase6/qa-metrics.json` و ۶۰ screenshot.

## ۳. اصلاحات سراسری متن

- helper مشترک `formatAttributionEvolution(before, after)` در جمع‌بندی مرحله ۲ حفظ و در مسیرهای بعدی مبنا قرار گرفت.
- helper مشترک `formatAttributionPath(pre, post, final)` برای جمع‌بندی مرحله ۳، گزارش نهایی و نقاط عطف AAR اضافه شد.
- حالت برابر دو نقطه دقیقاً به صورت «برآورد شما بدون تغییر در 50٪ باقی ماند.» و حالت برابر هر سه نقطه به صورت «برآورد شما در هر سه نقطه روی 50٪ باقی ماند.» نمایش داده می‌شود.
- برچسب DW7 از «برای اقدام قاطع‌تر کافی است» به «برای اقدام با دامنه بیشتر کافی است» تغییر کرد. شناسه، پروفایل، هزینه و اثر گزینه ثابت ماند.
- عنوان BSS به «امتیاز مهارت بریر (BSS) نسبت به مبنای 50/50» تغییر کرد و disclaimer رخداد-محور به آن افزوده شد.
- مثال ساده Brier با برآورد 50٪، نتیجه عدم تأیید نقش اسرائیل و امتیاز 0.25 اضافه شد؛ فرمول محاسباتی تغییر نکرد.

## ۴. ممیزی اصطلاحات

- نخستین توضیح کامل SSA در متن Player به صورت «آگاهی موقعیتی فضایی (SSA)» وجود دارد؛ glossary نیز همین عبارت را تعریف می‌کند.
- عنوان بخش افشای نهایی «تحلیل پس از اقدام (AAR)» است.
- استفاده‌های ضروری `Brier` و `BSS` با توضیح فارسی و محدودیت تفسیر همراه‌اند.
- جست‌وجوی عبارت‌های بارگذاری‌شده «قاطع، منفعل، هوشمند، جسورانه، ترسو، بهترین، تنها راه درست» در گزینه‌ها انجام شد. ۴۵ گزینه وضعیت `pass` دارند. تنها کاربرد «بهترین» در جمله محدودیت شواهد است که صریحاً می‌گوید گزارش، بهترین مسیر اقدام را ثابت نمی‌کند و توصیه گزینه نیست.
- نام‌های کشور و بازیگران با واژه‌نامه فارسی موجود یکسان باقی ماندند.

## ۵. ممیزی تکرار و بار شناختی

- ۴۰۳ واحد روایی در inventory نهایی ثبت شد.
- بررسی exact duplicate برای بلوک‌های بلندتر از ۸۰ نویسه، صفر تکرار بلند ناخواسته یافت.
- عبارات کوتاه رابط مانند CTA، عنوان مرحله و برچسب‌های مشترک به‌عنوان تکرار روایی معیوب حساب نشدند.
- متن Player در هر مرحله به opening، تصمیم، پیامد و transition تقسیم شده است؛ transcript توسعه‌ای عمداً جامع است، اما همه آن به‌طور هم‌زمان در UI نمایش داده نمی‌شود.

جزئیات در `docs/scenario4-duplicate-final-audit.md` است.

## ۶. ممیزی خنثی‌بودن گزینه‌ها

- ۴۵ گزینه در ۱۰ پنجره تصمیم بررسی شدند.
- جدول ماشین‌خوان شامل حرکت، پنجره، optionId، label، description، tradeoff، loaded-term match و status تولید شد.
- نتیجه: ۴۵ از ۴۵ گزینه `pass`.
- هیچ option ID، utility، توصیه «درست/غلط» یا برچسب شخصیتی در Player نمایش داده نمی‌شود.

جزئیات در `docs/scenario4-option-neutrality-final-audit.json` و نسخه Markdown آن است.

## ۷. ممیزی شواهد

- هر ۱۳ کارت پایه مرحله ۱ و ۲ دارای `id`، عنوان، وضعیت، متن، محدودیت، معنای منبع و قاعده مشاهده‌پذیری است.
- کارت‌های پویای مرحله ۳ نیز برای فنی، مداری، متحد، تجاری و داده متناقض همین metadata را از selector دریافت می‌کنند.
- داده متحد و تجاری فقط در صورت فراهم‌شدن واقعی نمایش داده می‌شود.
- شواهد متناقض حذف یا مصنوعی حل نمی‌شوند.
- `availableIds` و `openedIds` جدا باقی مانده‌اند؛ render شدن کارت به معنی بازکردن آن محسوب نمی‌شود.
- هیچ کارت Player پیش از AAR به `trueRedIntent`، `trueIncidentAttribution` یا `move2IncidentCause` دسترسی ندارد.

جزئیات در `docs/scenario4-evidence-final-audit.md` است.

## ۸. ممیزی ۹ End State

برای هر ۹ پایان fixture قطعی resolver و snapshot روایت تولید و بررسی شد:

1. `escalation_spiral`
2. `intelligence_failure`
3. `coalition_fracture`
4. `negotiated_deescalation`
5. `calm_crisis_control`
6. `costly_deterrence`
7. `persistent_ambiguity`
8. `strategic_information_opportunity`
9. `mixed_crisis_containment`

عنوان، خلاصه، حقایق علّی و خط پایانی هر پایان موجود و متمایز است. precedence موجود resolver تغییر نکرد. fixtureها در `docs/scenario4-end-state-resolver-fixtures.json` و snapshot متن در `docs/scenario4-end-state-snapshots.json` هستند.

## ۹. ممیزی گزارش نهایی

- گزارش نهایی بر اساس state، انتخاب‌ها، واکنش واقعی بازیگران، منابع و End State همان اجرا ساخته می‌شود.
- مسیر انتساب از helper مشترک استفاده می‌کند و حالت بدون تغییر را درست بیان می‌کند.
- علت‌های پایان به ۲ تا ۴ واقعیت run-specific محدود شده‌اند.
- حقیقت پنهان، seed، utility، checkpoint، action ID و option ID در گزارش Player وجود ندارد.
- CTA گزارش فقط به AAR می‌رود.

## ۱۰. ممیزی AAR

- مرز افشای حقیقت با warning روشن مشخص است.
- نیت واقعی، علت رخداد و انتساب واقعی از باورها و برآوردهای کاربر جدا نمایش داده می‌شوند.
- Brier و BSS هم فرمول/مثال دارند و هم disclaimer صریح که آن‌ها را سنجه توانایی عمومی فرد نمی‌داند.
- نقاط عطف انتساب با همان helper گزارش و جمع‌بندی تولید می‌شوند.
- جدول «اسرائیل چه دید/چه ندید» از snapshotهای مشاهده‌پذیر ساخته می‌شود.
- CTA AAR فقط به داشبورد شناختی می‌رود و پایان سناریو از داشبورد انجام می‌شود.

## ۱۱. جداسازی Player و Admin

- Player: در ۶۰ capture هیچ پنل Admin، seed، checkpoint، utility، Red action، شناسه داخلی یا حقیقت پنهان زودهنگام مشاهده نشد.
- Admin: پنل اشکال‌زدایی و دکمه فراداده روایت در تست مرورگر قابل مشاهده بود.
- trace روایت تنها با ترکیب `isAdmin && debugEnabled` قابل رندر است.
- AAR تنها ناحیه Player است که اجازه نمایش حقیقت پنهان دارد.

## ۱۲. QA ده‌هزار اجرای seed‌دار

نتیجه ۱۰٬۰۰۰ اجرای کامل و قطعی:

- اجراهای کامل: ۱۰٬۰۰۰
- crash: ۰
- missing mapping: ۰
- assertion failure: ۰
- متن undefined: ۰
- نشت داخلی در روایت Player: ۰
- پوشش action اسرائیل: ۱۹ action
- پوشش action متحد: ۱۱ action
- پوشش action تجاری: ۷ action
- پوشش inject: هر ۸ inject

فراوانی طبیعی End Stateها:

| End State | تعداد |
|---|---:|
| persistent_ambiguity | 6004 |
| negotiated_deescalation | 1630 |
| intelligence_failure | 1131 |
| strategic_information_opportunity | 848 |
| escalation_spiral | 169 |
| calm_crisis_control | 135 |
| costly_deterrence | 68 |
| coalition_fracture | 15 |
| mixed_crisis_containment | 0 |

برای ایجاد فراوانی مصنوعی، هیچ شرط یا وزنی تغییر نکرد. `mixed_crisis_containment` در اجرای تصادفی رخ نداد، اما با fixture قطعی resolver و snapshot مستقل pass شد. داده کامل در `docs/scenario4-seeded-qa-10000.json` است.

## ۱۳. QA رابط و viewport

در zoom 100%، ۱۲ صفحه نماینده در پنج viewport بررسی و ثبت شدند:

- 1920×1080
- 1600×900
- 1440×900
- 1366×768
- 1280×720

صفحات شامل Intro، تصمیم/جمع‌بندی Move1، attribution/تصمیم/جمع‌بندی Move2، Move3، گزارش نهایی، AAR و داشبورد بودند.

نتیجه:

- document horizontal overflow: صفر
- accidental nested horizontal overflow: صفر
- clipping مشاهده‌شده: صفر
- RTL: صحیح
- A-17/R-31: خوانا
- CTAهای تصمیم در action bar چسبان و قابل مشاهده‌اند؛ صفحات بلند گزارش/AAR/داشبورد طبق طراحی اسکرول عمودی دارند.
- هیچ `overflow-x:hidden` سراسری برای پنهان‌کردن مشکل اضافه نشده است.

مدرک در `docs/screenshots/scenario4-phase6/` و `qa-metrics.json` قرار دارد.

## ۱۴. بسته مرور نهایی

- inventory ماشین‌خوان و Markdown: ۴۰۳ واحد
- transcript انسانی در ترتیب تجربه: ۹٬۳۶۵ واژه
- branch catalog: ۱۰۳ ردیف معتبر
- reference mapping input: فقط سه ستون مجاز پر شده و چهار ستون مرجع خالی است.
- فهرست دقیق فایل‌های لازم برای مرور مرجع بعدی تولید شد.

## ۱۵. خوانش دستی transcript — پاسخ به ۱۰ سؤال

1. **آیا داستان بدون دیدن کد قابل فهم است؟** بله. ورود، ابهام نزدیکی مداری، افت سرویس، بحران انتساب، پیامد و AAR یک خط روایی کامل می‌سازند.
2. **آیا دلیل هر تصمیم روشن است؟** بله. هر پنجره context، سؤال، چرایی، description و tradeoff دارد.
3. **آیا متن بیش از حد توضیح می‌دهد؟** در UI خیر؛ محتوا مرحله‌بندی شده است. transcript عمداً برای مرور توسعه‌ای جامع و طولانی است.
4. **آیا هیچ صفحه‌ای نتیجه را لو می‌دهد؟** خیر. پیش از AAR فقط رفتار و شواهد قابل مشاهده توصیف می‌شود.
5. **آیا اسرائیل زودتر از شواهد عامل قطعی معرفی می‌شود؟** خیر. متن تا AAR میان هم‌بستگی، ظن، نقش احتمالی و علت قطعی تفکیک می‌کند.
6. **آیا گزینه‌ها خنثی‌اند؟** بله؛ ممیزی ۴۵/۴۵ pass است و مزیت/هزینه هر گزینه کنار هم آمده است.
7. **آیا گزارش نهایی run-specific است؟** بله؛ state، انتخاب، actor action، منابع و End State همان اجرا را مصرف می‌کند.
8. **آیا AAR حقیقت پنهان را با باور کاربر قاطی نمی‌کند؟** خیر؛ truth block، estimates، scoring و محدودیت تفسیر بخش‌های جدا دارند.
9. **آیا ۹ پایان واقعاً متفاوت‌اند؟** بله؛ trigger، عنوان، خلاصه، حقایق علّی و closing line متمایز دارند.
10. **آیا Move1 تا AAR پیوسته است؟** بله؛ انتخاب‌ها و مشاهده‌پذیری هر حرکت به snapshot بعدی و نهایتاً گزارش/AAR منتقل می‌شود.

## ۱۶. تست‌ها

- Phase1: pass
- Phase2: pass
- Phase3: pass
- Phase4: pass
- Phase5: pass
- Phase6: pass
- model/cognitive و Monte Carlo 100k: pass
- build: pass
- lint فایل‌های تغییرکرده فاز ۶: pass
- browser Player/Admin: pass
- inventory/transcript/reference-input generation: pass

`npm run lint` کل مخزن هنوز یک خطای ازپیش‌موجود و خارج از سناریو ۴ در `ScenarioThreeDungeon.tsx:720` و سه warning قدیمی hook گزارش می‌کند. این فاز آن فایل را تغییر نداده است.

build فقط warning اندازه chunk موجود را گزارش می‌کند و موفق است.

## ۱۷. موارد حل‌نشده و مرز کار

- `mixed_crisis_containment` در نمونه ۱۰هزار اجرای تصادفی فراوانی صفر داشت؛ مطابق brief هیچ rebalance انجام نشد و پوشش آن با fixture قطعی تأمین شد.
- lint سراسری به علت خطای خارج از محدوده بالا سبز نیست؛ lint همه فایل‌های تغییرکرده این فاز سبز است.
- ستون‌های منبع در reference mapping عمداً خالی مانده‌اند و هیچ ادعای مرجع خارجی ساخته نشده است.

## ۱۸. تأیید invariants

- adjudication: بدون تغییر در فاز ۶
- منابع، هزینه و recovery: بدون تغییر؛ فقط یک عبارت نمایشی DW7 همگام شد
- Cognitive V3 / O-S: بدون تغییر عددی یا فرمولی؛ فقط label متناظر DW7 همگام شد
- End State precedence: بدون تغییر
- hidden state و نحوه تولید آن: بدون تغییر
- actor utility، trigger و resolver: بدون تغییر
- فرمول Brier/BSS: بدون تغییر
- option ID، تعداد گزینه و معنای عملیاتی: بدون تغییر

فاز ۶ در این نقطه متوقف می‌شود؛ نگاشت مرجع خارجی برای مرحله جداگانه باقی مانده است.
