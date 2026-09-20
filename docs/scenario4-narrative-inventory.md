# Scenario 4 Narrative Inventory

> سناریو ۴: «حریم خاکستری مدار»  
> تاریخ ممیزی: ۲۰۲۶-۰۹-۱۴  
> این گزارش فقط وضعیت فعلی کد را استخراج می‌کند؛ هیچ متن، actor، شناسه یا شاخه‌ای بازنویسی نشده است.

## روش و شمارش

فایل JSON همراه سند، استخراج مستقیم AST است و برای هر رخداد متنی source، line، stage، trigger، text، variables و وابستگی‌ها را ثبت می‌کند.

- ۸۲۰ رخداد متنی فارسی در دامنه ممیزی
- ۷۱۹ متن یکتای فارسی قابل نمایش/بررسی
- ۲۱۴ رخداد تولیدشده یا واقع در شاخه شرطی
- ۹ End State واقعی
- ۸ inject واقعی: سه Move 1، چهار Move 2، یک Move 3
- ۱۹ روایت متمایز در situation update که مستقیماً با actor تغییر می‌کند
- ۲۳ مشکل hard-coded/static؛ ده مورد اصلی در بخش ۸

این شمارش شامل UI بازیکن، tooltip/aria و بخش‌های admin-visible سناریو ۴ است. رشته‌های config که مسیر نمایش ندارند در بخش ۹ جدا شده‌اند.

## Schema

هر item در فایل JSON دقیقاً این فیلدها را دارد: ID؛ Source file؛ Source line/location؛ Stage؛ Trigger condition؛ Player sees when؛ Exact current Persian text؛ Variables interpolated؛ Possible alternate versions؛ Depends on actor؛ Depends on hidden truth؛ Depends on user option؛ Static or generated؛ Notes.

فهرست کامل تک‌به‌تک: [scenario4-narrative-inventory.json](./scenario4-narrative-inventory.json)

# 1. Narrative Flow Map

| بخش تجربه | وضعیت فعلی | منبع/نکته |
|---|---|---|
| A. Scenario Card / Entry | موجود | src/App.tsx:268-278 و 2211-2281 |
| B. Intro screens | موجود | intro_title و intro_narrative |
| C. Role briefing | موجود | intro_role |
| D. Objectives | موجود | intro_objectives |
| E. How-to-play | موجود | intro_rules |
| F. Move 1 opening | موجود | phase=brief |
| G. Move 1 evidence | موجود | سه شاهد پایه و دو شاهد شرطی |
| H. DW1 | موجود | m1_information |
| I. injects after DW1 | نمایش ناقص | اختلاف داده ممکن است پیش از DW2 بیاید؛ بقیه نام‌گذاری نمی‌شوند |
| J. DW2 | موجود | m1_protection |
| K. injects/consequences | یک هشدار شرطی | پیش از DW3 |
| L. DW3 | موجود | m1_communication |
| M. actor reactions | موتور موجود؛ UI غیرمستقیم | بعد از reason در update |
| N. Move 1 situation update | موجود | شش بخش تولیدشده |
| O. Move 1 reason capture | موجود | شش گزینه |
| P. Move 2 opening | موجود | متن ثابت + سه hint |
| Q. attribution estimate 1 | موجود | slider |
| R. evidence | موجود | بسته Move 2 |
| S. DW4 | موجود | m2_investigation |
| T. conditional injects | موجود اما پراکنده | delay/restriction/off-ramp/friction |
| U. attribution estimate 2 | موجود | slider دوم |
| V. DW5 | موجود | m2_mission |
| W. DW6 | موجود | m2_response |
| X. actor reactions | موتور موجود؛ متن‌ها گروهی | چند action به یک متن نگاشت می‌شوند |
| Y. Move 2 situation update | موجود | هشت بخش |
| Z. Move 2 reason capture | موجود | هفت گزینه |
| AA. Move 3 opening | موجود | متن ثابت + سه hint |
| AB. final evidence package | موجود | چهار منبع شرطی |
| AC. final attribution | موجود | slider نهایی |
| AD. DW7 | موجود | m3_threshold |
| AE. DW8 | موجود | m3_coa |
| AF. DW9 | موجود | m3_info |
| AG. conditional off-ramp | موجود | فقط با flag یا COA مذاکره‌ای |
| AH. actor final reactions | در موتور موجود، در روایت غایب | فقط snapshot/admin log |
| AI. Move 3 reason | موجود | هشت گزینه |
| AJ. Final report | موجود | چهار بخش عمدتاً template |
| AK. every End State narrative | فقط label | روایت مستقل هر پایان وجود ندارد |
| AL. Cognitive dashboard | موجود | V3؛ methodology برای admin |
| AM. AAR | موجود | حقیقت، برآوردها، Brier، جدول مشاهده |
| AN. Counterfactual/replay | وجود ندارد | هیچ پیام واقعی ندارد |
| AO. Error/loading/empty | محدود | resolving، empty evidence/history و data insufficient؛ error اختصاصی ندارد |

# 2. Full Text Inventory

## Entry

| ID | Source | Trigger | Exact text | A/H/U | Kind |
|---|---|---|---|---|---|
| ENTRY-01 | App.tsx:269 | کارت | ۴ — حریم خاکستری مدار | خیر/خیر/خیر | ثابت |
| ENTRY-02 | App.tsx:270 | introTitle عمومی | سناریو ۴ — حریم خاکستری مدار | خیر/خیر/خیر | فعلاً بدون introText دسترس‌ناپذیر |
| ENTRY-03 | App.tsx:271 | summary | مدیریت یک بحران مداری سه‌مرحله‌ای؛ از نزدیک‌شدن مبهم R-31 تا اختلال A-17 و تصمیم نهایی درباره انتساب، پاسخ و کاهش تنش. | خیر/خیر/خیر | ثابت |
| ENTRY-04 | App.tsx:273 | کارت بسته | شما رئیس سلول تصمیم‌گیری عملیات فضایی تیم آبی هستید. باید با منابع محدود، شواهد چندمنبعی و نیت نامعلوم طرف مقابل، تداوم مأموریت A-17 را حفظ و مسیر بحران را مدیریت کنید. | خیر/خیر/خیر | ثابت |
| ENTRY-05 | App.tsx:274-278 | توضیح کامل | R-31، یک دارایی فضایی دوکاربردی متعلق به طرف مقابل، از الگوی معمول خود خارج شده و فاصله‌اش با ماهواره مهم A-17 را کاهش داده است… شما در نقش رئیس سلول تصمیم‌گیری عملیات فضایی تیم آبی، بحران را در سه مرحله مدیریت می‌کنید… منابع SSA، ظرفیت حفاظتی، سرمایه سیاسی و ظرفیت افشای امن محدودند… | خیر/خیر/خیر | متن کامل دقیق در JSON |

کنترل‌های کارت: سناریو {id}؛ قفل؛ تمام شده؛ نمایش توضیحات کامل؛ بستن توضیح؛ شروع سناریو؛ قفل شده.

## Intro / Role / Objectives / Rules

| ID | Source | Exact current Persian text | Notes |
|---|---|---|---|
| INTRO-01 | TSX:850-855 | حریم خاکستری مدار؛ همه تهدیدها با شلیک آغاز نمی‌شوند؛ سناریو ۴ \| بازی جنگ فضایی تصمیم‌محور؛ ادامه | title |
| INTRO-02 | TSX:856-861 | مدار پایین زمین هرگز کاملاً آرام نیست… طی چند روز گذشته سامانه‌های پایش شما تغییر کوچکی در رفتار یک دارایی متعلق به طرف مقابل ثبت کرده‌اند… فاصله R-31 با A-17 در حال کاهش است… هنوز هیچ حمله‌ای رخ نداده… طرف مقابل رفتار شما را می‌بیند؛ متحدان و اپراتورهای تجاری واکنش دارند. | متن کامل در JSON؛ CTA «نقش من در این بحران چیست؟» |
| INTRO-03 | TSX:862-867 | شما رئیس سلول تصمیم‌گیری عملیات فضایی تیم آبی هستید… باید میان پیامد عملیاتی، اطلاعاتی، سیاسی و راهبردی تعادل برقرار کنید… طرف مقابل مستقل تصمیم می‌گیرد… پاسخ صحیح واحد وجود ندارد. | role؛ متن کامل در JSON |
| INTRO-04 | TSX:868-873 | ۱ حفظ تداوم مأموریت؛ ۲ افزایش شناخت؛ ۳ کنترل تشدید؛ ۴ حفظ گزینه‌های آینده؛ ۵ مدیریت ائتلاف؛ ۶ حفظ انضباط اطلاعاتی | objectives؛ متن کامل در JSON |
| INTRO-05 | TSX:874-879 | اطلاعات کامل نیست؛ طرف مقابل مستقل است؛ تصمیم‌ها حافظه دارند؛ وضعیت‌های نامطمئن کیفی و منابع دقیق‌اند؛ حقیقت بعداً آشکار می‌شود. | rules؛ متن کامل در JSON |

## Help / glossary / onboarding

- HelpPanel در TSX:289-302: «چطور تصمیم بگیرم؟»، «اعداد چرا پنهان‌اند؟»، «آیا طرف مقابل همیشه دشمن است؟»، «آیا می‌توانم تصمیمم را تغییر دهم؟» و چهار پاسخ کامل.
- GlossaryPanel در TSX:304-329: آگاهی موقعیتی فضایی (SSA)، انتساب مسئولیت، هماهنگی کاهش خطر، مسیر کاهش تنش، انسجام ائتلاف، ریسک افشای اطلاعات، برگشت‌پذیری؛ هفت تعریف.
- ToolbarGuideModal در TSX:331-358: معرفی راهنما، واژه‌نامه و شواهد.
- DecisionInfoGuideModal در TSX:360-370: «دکمه ⓘ کنار هر گزینه، توضیحات تکمیلی همان تصمیم را نمایش می‌دهد. مشاهده توضیحات بیشتر می‌تواند به انتخاب‌های بهتر منجر شود.»
- EvidenceCard در TSX:900-941: منبع، حساسیت، «این گزارش چه چیزی را ثابت نمی‌کند؟» و متن محدودیت شاهد.
- DecisionWindowInner در TSX:780-839: چه اتفاقی افتاده؟؛ چرا مهم است؟؛ هزینه قطعی منابع؛ انتخاب شما؛ هنوز انتخاب نشده؛ ثبت تصمیم؛ جزئیات این تصمیم.
- Exit modal در TSX:2697-2705: «اگر خارج شوید، اجرای شما تا آخرین نقطه ثبت‌شده ذخیره می‌شود.»

## Evidence

| ID | Source/trigger | Exact current text |
|---|---|---|
| E_BASE_01 | move1.ts:5-9؛ ابتدا | داده مداری — تأییدشده: R-31 طی دو پنجره اخیر نسبت به پروفایل تاریخی خود تغییر مسیر محدود نشان داده است. فاصله نسبی با A-17 در حال کاهش است. هیچ مسیر برخورد فوری ثبت نشده است. |
| E_BASE_02 | move1.ts:12-16؛ ابتدا | مشخصات R-31 — تأییدشده: R-31 رسماً یک دارایی خدماتی دوکاربردی معرفی شده است. قابلیت‌ها: بازرسی مداری، عملیات نزدیکی، سرویس فضایی. هیچ اقدام خصمانه قبلی قطعی نیست. |
| E_BASE_03 | move1.ts:19-23؛ ابتدا | تحلیل اولیه — تحلیلی: رفتار فعلی با بیش از یک فرضیه سازگار است. نیت R-31 هنوز قابل تعیین نیست. |
| E_SSA_01 | dedicated SSA | تحلیل SSA اختصاصی — تحلیلی: تغییر مسیر R-31 عمدی بوده، اما از روی مسیر به‌تنهایی نمی‌توان نیت را تعیین کرد. |
| E_COMM_CONFLICT_01 | commercial + random ≥ 0.8 | اختلاف داده تجاری — نیازمند بررسی: کاهش فاصله تأیید می‌شود، ولی نرخ تغییر مسیر کمتر از برآورد نظامی است؛ علت اختلاف نامشخص. |
| E_M2_01 | شروع Move 2 | رخداد سرویس — تأییدشده: A-17 افت کوتاه‌مدت کیفیت سرویس ثبت کرده؛ بخشی بازیابی و تخریب دائمی تأیید نشده است. |
| E_M2_02 | شروع Move 2 | بررسی فنی اولیه — مقدماتی: نقص داخلی رد نشده و داده برای علت کافی نیست. |
| E_M2_03 | شروع Move 2 | هم‌بستگی زمانی — تحلیلی: افت سرویس هم‌زمان با فعالیت غیرعادی Red است؛ هم‌بستگی انتساب را اثبات نمی‌کند. |
| E_M2_TECH_STRONG | diagnostics + technical fault | نتیجه فنی داخلی: مسیر نقص داخلی محتمل‌تر و انتساب مستقیم به Red ضعیف‌تر است. |
| E_M2_TECH_INCONCLUSIVE | diagnostics + red/environment | نتیجه فنی نامعین: نقص داخلی اثبات نشده، ولی عامل خارجی هم تعیین نشده است. |
| E_M2_TECH_MIXED | diagnostics + mixed | نتیجه فنی ترکیبی: بخشی فنی و بخشی با مداخله خارجی هم‌بستگی دارد. |
| E_M2_ALLY_01 | ally intel | داده متحد تصویر مستقل‌تر می‌دهد، اما «حقیقت پنهان» را به‌تنهایی آشکار نمی‌کند. |
| E_M2_COMM_01 | commercial validation | داده تجاری بخشی از رخداد را تأیید می‌کند، اما کیفیت/دسترسی وابسته به شرایط حقوقی و تجاری است. |

## All decisions and selectable choices

| Window | Context/question/why source | Exact option labels |
|---|---|---|
| DW1 اطلاعات | TSX:2061-2072 | ادامه پایش موجود؛ افزایش SSA اختصاصی؛ دریافت داده تجاری مستقل؛ درخواست شبکه متحدان |
| DW2 حفاظت | TSX:2075-2097 | بدون تغییر؛ افزایش آمادگی پنهان؛ اقدام حفاظتی آشکار اما برگشت‌پذیر؛ تغییر محسوس وضعیت مأموریت |
| DW3 ارتباط | TSX:2101-2123 | عدم ارسال پیام؛ تماس خصوصی برای Deconfliction؛ هماهنگی با متحدان؛ هشدار عمومی درباره رفتار ناایمن؛ پیام خصوصی + هماهنگی محدود متحدان |
| Reason 1 | move1.ts:127-134 | کسب اطلاعات بیشتر؛ حفاظت از A-17؛ جلوگیری از تشدید؛ نمایش عزم؛ حفظ هماهنگی متحدان؛ حفظ منابع |
| DW4 بررسی | TSX:2239-2270 | تمرکز بر بررسی فنی داخلی؛ فعال‌سازی منبع رصد دوم؛ درخواست داده تکمیلی متحد؛ اعتبارسنجی تجاری مستقل؛ عدم صرف زمان بیشتر برای بررسی |
| DW5 مأموریت | TSX:2306-2316 | ادامه مأموریت بدون تغییر؛ فعال‌سازی ظرفیت جایگزین؛ کاهش موقت بار مأموریت؛ بازآرایی حفاظتی؛ تقسیم مأموریت میان A-17 و ظرفیت پشتیبان |
| DW6 پاسخ | TSX:2319-2337 | فعلاً اقدام متقابل انجام نشود؛ درخواست توضیح رسمی؛ هشدار خصوصی کنترل‌شده؛ پاسخ هماهنگ با متحدان؛ درخواست مجوز برای اقدام دفاعی برگشت‌پذیر؛ پیشنهاد فاصله‌گذاری و Deconfliction متقابل |
| Reason 2 | move2.ts:127-135 | افزایش اطمینان درباره علت حادثه؛ حفظ تداوم مأموریت؛ صرفه‌جویی در منابع؛ جلوگیری از تشدید؛ نمایش عزم؛ حفظ ائتلاف؛ ایجاد مسیر کاهش تنش |
| DW7 آستانه | TSX:2451-2469 | برای انتساب راهبردی هنوز کافی نیست؛ برای اقدام محدود و برگشت‌پذیر کافی است؛ برای اقدام قاطع‌تر کافی است |
| DW8 COA | TSX:2472-2485 | مهار و شناخت؛ بازدارندگی کنترل‌شده؛ پاسخ هماهنگ ائتلافی؛ کاهش تنش مذاکره‌شده؛ اقدام یک‌جانبه شدیدتر در سطح حفاظتی/سیاسی |
| DW9 اطلاعات | TSX:2488-2507 | محرمانه باقی بماند؛ اشتراک محدود با متحدان؛ انتشار عمومی بخشی از شواهد؛ انتساب عمومی به Red |
| Off-ramp | TSX:2510-2525 | پذیرش موقت؛ مذاکره دوباره درباره شرایط؛ باز نگه‌داشتن کانال بدون تعهد؛ رد سازوکار |
| Reason 3 | move3.ts:51-60 | حفظ مأموریت؛ سطح اطمینان انتساب؛ بازدارندگی؛ جلوگیری از تشدید؛ انسجام ائتلاف؛ مشروعیت سیاسی/حقوقی؛ حفظ منابع و قابلیت‌های آینده؛ ایجاد مسیر خروج از بحران |

توضیح دقیق همه optionها، هزینه‌های قطعی و سه‌گانه context/question/why در JSON ثبت شده است.

# 3. Conditional Branches

## Move 1

- commercial + conflict random: کارت اختلاف داده پیش از DW2.
- mission reposition + situationAwareness < 55: هشدار افشای حساسیت A-17 پیش از DW3.
- هر inject: فقط «رخدادهای شرطی این مرحله برای تحلیل پس از اقدام ثبت شدند.»
- ۱۶ alternate مبتنی بر state/actor در شش بخش situation update.

## Move 2

- break_off: «R-31 در مرحله ۱ فاصله گرفته بود؛ رخداد پس از آن انتساب مسئولیت را پیچیده‌تر می‌کند.»
- continue_approach: «R-31 همچنان نزدیک‌تر از وضعیت پایه در محیط عملیاتی باقی مانده است.»
- media flag: «به دلیل توجه رسانه‌ای قبلی، رخداد جدید حساسیت عمومی بیشتری دارد.»
- m2IntelDelay: «به دلیل فشار بر ظرفیت تحلیل، بخشی از داده تکمیلی با تأخیر در دسترس قرار می‌گیرد.»
- m2CommercialRestriction: متن محدودیت داده پیش از DW6.
- ۱۳ alternate مبتنی بر state/actor در update.

## Move 3

- fallback، Red off-ramp و coalition friction هر کدام hint مستقل دارند.
- چهار ردیف confidence package مجموعاً چند alternate براساس confidence، technical probability، evidence، hidden ally trust و restriction دارند.
- off-ramp فقط با Red/Blue flag یا COA مذاکره‌ای ظاهر می‌شود.
- m3_offramp_reciprocated ثبت می‌شود ولی متن مستقل ندارد.
- End State و dashboard نیز branchهای شرطی خود را دارند.

# 4. Actor/Inject Narrative Map

## Actor actions

| Move/actor | Internal action id | Exact player-facing narrative |
|---|---|---|
| M1 Red | continue_approach | روند نزدیکی ادامه دارد و هنوز نشانه قطعی از اقدام خصمانه ثبت نشده است. |
| M1 Red | slow_approach | نرخ نزدیک‌شدن کاهش یافته، اما دارایی از محدوده خارج نشده است. |
| M1 Red | hold_position | موقعیت نسبی R-31 تثبیت شده و حرکت تازه‌ای دیده نمی‌شود. |
| M1 Red | send_routine_explanation | اپراتور R-31 رفتار فعلی را بخشی از مأموریت عادی اعلام کرده است. |
| M1 Red | break_off | R-31 فاصله خود را افزایش داده، اما علت تصمیم آن هنوز قطعی نیست. |
| M1 Ally | quiet_support / public_support | متحد منطقه‌ای از ادامه هماهنگی حمایت کرده و مسیر تبادل اطلاعات باز مانده است. |
| M1 Ally | distance_from_blue | متحد منطقه‌ای با احتیاط بیشتری عمل می‌کند و از موضع Blue فاصله گرفته است. |
| M1 Ally | request_more_information | متحد منطقه‌ای درخواست داده تکمیلی کرده و منتظر روشن‌تر شدن شواهد است. |
| M1 Ally | no_action | وضعیت ائتلاف تغییر عمده‌ای نشان نمی‌دهد. |
| M1 Commercial | offer_followup_data | اپراتور تجاری برای داده تکمیلی اعلام آمادگی کرده است. |
| M1 Commercial | warn_about_public_release / no_new_data | بحران هنوز توجه گسترده رسانه‌ای یا تجاری پیدا نکرده است. |
| M2 Red | offer_mutual_separation | Red مسیر فاصله‌گذاری متقابل را پیشنهاد داده است. |
| M2 Red | introduce_second_asset | یک دارایی دیگر Red در محیط عملیاتی مشاهده شده است. |
| M2 Red | پنج action دیگر | Red همچنان در محیط عملیاتی حضور دارد و رفتار آن قابل تفسیر چندگانه است. |
| M2 Ally | reject_public_attribution | متحد درباره انتساب قطعی احتیاط کرده و اصطکاک ائتلافی ایجاد شده است. |
| M2 Ally | پنج action دیگر | مسیر هماهنگی با متحدان باز مانده، اما حمایت مکانیکی یا نامحدود نیست. |
| M2 Commercial | partial_data_only / pause_sensitive_sharing | دسترسی تجاری به داده‌های دقیق‌تر محدود شده است. |
| M2 Commercial | offer_followup_data / neutral_public_statement | محیط تجاری هنوز امکان داده تکمیلی محدود را حفظ کرده است. |
| M3 Red/Ally/Commercial | همه actionها | متن واکنش نهایی اختصاصی وجود ندارد؛ فقط state/snapshot تغییر می‌کند. |

همه triggerها و state causeهای دقیق در resolverهای redActor.ts، allyActor.ts، commercialActor.ts، move2Adjudicator.ts:311-437 و move3Adjudicator.ts:258-349 آمده‌اند. هیچ action id در AAR بازیکن نمایش داده نمی‌شود.

## Injects

| ID | Trigger | نمایش واقعی |
|---|---|---|
| m1_inject_1a_conflicting_data | conflictingCommercialData | کارت اختلاف داده؛ در update فقط اثر عمومی |
| m1_inject_1b_ally_request | عدم اشتراک + حفاظت شدید/فشار عمومی | متن مستقل ندارد |
| m1_inject_1c_media | public warning یا احتمال ۰٫۳۵ پس از حفاظت آشکار | متن رسانه‌ای در update |
| m2_inject_2b_intelligence_delay | m2IntelDelay | hint تأخیر |
| m2_inject_2c_commercial_restriction | m2CommercialRestriction | کارت + update |
| m2_inject_2d_red_offramp | Red offer_mutual_separation | متن فاصله‌گذاری |
| m2_inject_2e_coalition_friction | coalition friction flag | متن اصطکاک |
| m3_offramp_reciprocated | Red accept_interim_offramp | متن مستقل ندارد؛ فقط outcome |

# 5. End States

سه tag قبل از primary محاسبه می‌شوند: coalition_risk اگر cohesion < 45؛ escalation_risk اگر pressure > 65؛ information_discipline_risk اگر score < 45.

| تقدم | ID / label | Trigger |
|---:|---|---|
| 1 | intelligence_failure / شکست اطلاعاتی | public attribution و true attribution=non_red و informationDiscipline<55 |
| 2 | escalation_spiral / مارپیچ تشدید | pressure>=75 و Red final=increase_non_destructive_pressure |
| 3 | coalition_fracture / شکاف ائتلافی | cohesion<35 |
| 4 | negotiated_deescalation / کاهش تنش مذاکره‌شده | Red accepts interim off-ramp و mission>=55 |
| 5 | calm_crisis_control / مهار آرام بحران | missionOutcome>=75 و escalationControl>=70 و coalitionOutcome>=60 |
| 6 | costly_deterrence / بازدارندگی پرهزینه | Red deescalates/separates و exposure>45 |
| 7 | strategic_information_opportunity / فرصت اطلاعاتی راهبردی | informationQuality>=70 و escalationControl>=55 |
| 8 | persistent_ambiguity / ابهام پایدار | system attribution confidence<55 |
| 9 | mixed_crisis_containment / مهار نسبی بحران | fallback نهایی |

روایت دقیق همه پایان‌ها فقط این template مشترک است: «{label}: این نتیجه بر اساس ترکیب مأموریت، تشدید، ائتلاف، منابع، سیاست اطلاعاتی و واکنش بازیگران شکل گرفت.» هیچ End State اضافه‌ای در type فعلی نیست.

# 6. AAR Texts

Final report چهار بخش دارد:

- «بحران از رفتار مداری مبهم شروع شد، در Move 2 به افت سرویس با انتساب نامطمئن رسید و در Move 3 به تصمیم درباره آستانه اقدام تبدیل شد.»
- مأموریت: دو نسخه برای missionContinuity بالاتر/پایین‌تر از ۷۰.
- «برآوردهای شما درباره نقش Red از {pre} به {post} و سپس {final} رسید.»
- template مشترک End State بالا.

AAR:

- «تحلیل پس از اقدام — افشای حقیقت پنهان»
- هشدار دسترسی‌نداشتن بازیکن در زمان تصمیم
- نیت‌ها: آزمون واکنش؛ اعمال فشار؛ جمع‌آوری اطلاعات؛ ایجاد شکاف ائتلافی؛ رفتار غیرخصمانه اما مبهم
- علت‌ها: مداخله برگشت‌پذیر منتسب به Red؛ نقص فنی داخلی؛ عامل محیطی/خارجی غیرمنتسب؛ ترکیب چند عامل
- انتساب‌ها: نقش Red تأیید؛ رخداد به Red منتسب نبود؛ Red بخشی از علت بود
- مسیر برآورد pre/post/final و امتیاز تک‌رخدادی Brier
- جدول ثابت «طرف مقابل چه چیزی دید؟» برای سه مرحله
- دکمه مشاهده داشبورد شناختی

Dashboard تفسیرهای «داده کافی…»، «رویکرد یکپارچه…»، «جهت‌گیری وابسته به موقعیت»، «الگوی ضعیف/نامتمایز»، گرایش/تمایل عملیاتی یا راهبردی و «مرکز طیف» را تولید می‌کند. همه labels، ۱۲ توضیح شاخص، telemetry، attribution و resource path در JSON با stage مربوط ثبت شده‌اند.

Counterfactual/replay در کد وجود ندارد.

# 7. Naming Audit

| واژه | رخداد استخراج‌شده | محل‌های مهم | rename مرحله بعد |
|---|---:|---|---|
| Blue | ۱ | adjudicator.ts:323 | ایران |
| Red | ۲۷ | Help، intro، evidence، DW، update، report، AAR، App | اسرائیل |
| تیم آبی | ۷ | App، role، glossary، status، map | ایران |
| طرف مقابل | ۱۷ | entry، intro، Help، DW، dashboard، AAR | نیازمند سیاست یکپارچه؛ طبق brief بعدی اسرائیل |
| دشمن | ۱ | پرسش Help «آیا طرف مقابل همیشه دشمن است؟» | rename مکانیکی Blue/Red نیست |
| حریف | ۰ | هیچ مورد Scenario 4 | هیچ |

موارد سناریوهای دیگر در App از شمارش حذف شده‌اند.

# 8. Narrative Problems

## Top 10

1. **P0:** واکنش‌های نهایی Move 3 هیچ روایت player-facing ندارند.
2. **P0:** هر ۹ End State فقط label متفاوت و boilerplate یکسان دارند.
3. **P0:** Move 2 opening همیشه «دارایی دیگر Red» را ذکر می‌کند، ولی flag آن فقط برای introduce_second_asset فعال می‌شود.
4. **P0:** Move 3 opening همیشه افت «جدی‌تر» می‌گوید، در حالی که severity سه سطح دارد.
5. **P0:** بیشتر injectها نام و consequence روشن برای کاربر ندارند.
6. **P1:** چند actor action متفاوت به یک متن عمومی collapse شده‌اند.
7. **P1:** Blue/Red/تیم آبی/طرف مقابل مخلوط و ناسازگارند.
8. **P1:** Move، End State، fallback، task، offload، authority، Deconfliction، Brier و oldOSI/V2/V3 بدون توضیح کافی دیده می‌شوند.
9. **P1:** final report از مسیر actual run جمله‌سازی نمی‌کند.
10. **P1:** جدول دیده‌شد/دیده‌نشد AAR ثابت است و از telemetry اجرای واقعی ساخته نمی‌شود.

سایر موارد: جمله‌های طولانی intro؛ عبارت developer-facing «حقیقت پنهان» در evidence؛ نام انگلیسی چهار منبع confidence؛ ناسازگاری بالقوه map/report؛ گم‌شدن معنای warn_about_public_release؛ عبارت نامأنوس «حمایت مکانیکی»؛ توضیح ناکافی چرایی تغییر status؛ تکیه confidence متحد بر hidden allyTrust؛ نبود error/loading اختصاصی؛ resolving تقریباً نامرئی؛ نبود replay/counterfactual.

# 9. Missing/Dead/Unused Strings

- stateEffects و opportunityCost برای ۴۵ resource audit تعریف شده‌اند ولی UI فقط deltas و rationale را مصرف می‌کند.
- introTitle سناریو ۴ بدون introText به modal عمومی App نمی‌رسد.
- resolving در همان call stack به update تبدیل می‌شود؛ متن آن احتمالاً قابل مشاهده نیست.
- Move 3 actor ids و m3_offramp_reciprocated mapper روایی ندارند.
- secondary outcome tags ذخیره می‌شوند ولی label/توضیح فارسی ندارند.
- candidate utility scores فقط admin debug است.
- source بازیابی resource ذخیره می‌شود اما پنل تاریخچه فقط rationale را نشان می‌دهد.
- هیچ counterfactual/replay string وجود ندارد.
- error text اختصاصی برای localStorage/snapshot/adjudication وجود ندارد.
- labelهای فارسی cognitive profile تکرار canonical option labels فایل‌های moves هستند.

# 10. Recommended Rewrite Priorities

1. P0 — روایت اختصاصی Move 3 actor reactions
2. P0 — روایت causal هر End State
3. P0 — همگام‌سازی openingهای Move 2/3 با actual run
4. P0 — متن اختصاصی هر inject و علت تغییر state
5. P1 — final report مبتنی بر snapshot
6. P1 — AAR observation table مبتنی بر telemetry
7. P1 — یکپارچه‌سازی Blue/Red با ایران/اسرائیل
8. P1 — حذف/توضیح اصطلاحات انگلیسی و developer-facing
9. P2 — تمایز actor actions در situation update
10. P2 — نمایش سود/هزینه فرصت resource choices
11. P2 — کوتاه‌سازی intro
12. P3 — error/loading و replay/counterfactual

