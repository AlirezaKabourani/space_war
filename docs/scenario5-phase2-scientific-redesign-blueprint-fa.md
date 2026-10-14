# نقشه علمی بازطراحی سناریو ۵ — فاز ۲

وضعیت: **طرح طراحی، بدون پیاده‌سازی**. این سند بر مبنای clone فعلی سناریو ۵ و پیاده‌سازی جاری Cognitive V3 در سناریو ۴ تهیه شده است. همه پروفایل‌ها و پارامترهای عددی آینده تا داوری خبره، آزمون لنگر و کالیبراسیون، موقت خواهند بود. شناسه‌های ردیابی مانند `T-NATO-1` به ماتریس سند `scenario5-phase2-source-traceability-fa.md` ارجاع می‌دهند.

## ۱. خلاصه تصمیم‌های فاز ۲

- ستون روایی هشت‌راندی «امواج خاموش» حفظ می‌شود، اما هر راند به یک یا چند **Decision Window** معنادار تبدیل خواهد شد و چهار فاز وزن برابر خواهند داشت.
- مدل آینده سه مرز صریح دارد: `trueWorldState`، `playerObservableState` و `actorObservableState`. حقیقت پنهان هرگز خودبه‌خود شاهد بازیکن یا ورودی امتیاز شناختی نیست.
- جهان‌ها از یک مجموعه کوچک، کنترل‌شده و بازتولیدپذیر با `worldId` و `seed` ساخته می‌شوند؛ هدف، آزمون robustness و جلوگیری از حفظ‌کردن «مشهد = پاسخ درست» است، نه تصادفی‌سازی سرگرمی. `[T-DCDC-1, T-RAND25-1, D-S5-01]`
- کشف حقیقت از «اسکن شهر درست» به انباشت شواهد چندمنبعی، ناقص و گاهی ناسازگار تغییر می‌کند. `[T-LUSITANIA-1, T-NATO-1, D-S5-02]`
- دو خانواده باور طبیعی‌اند: توزیع باور روی کریدورهای محتمل و برآورد ۰..۱۰۰ از هدفمندبودن اختلال. دومی با checkpointهای قبل/بعد می‌تواند Evidence-Responsive Updating را، مستقل از حقیقت پنهان، پشتیبانی کند.
- حریف یک Actor محدود و غیرهمه‌چیزدان با هدف، پروفایل، حافظه و قواعد واکنش خواهد بود. واکنش فقط به `actorObservableState` انجام می‌شود. `[T-AMS-LOCAL-1, T-RAMS-LOCAL-1, D-S5-03]`
- زنجیره داوری آینده صریح است: تصمیم بازیکن → هزینه → گذار جهان → علائم قابل مشاهده برای Actor → واکنش Actor → inject مشروط → تولید evidence → وضعیت قابل مشاهده جدید.
- `action.effects` و پیامد مأموریت از `action.cognitiveProfile` جدا می‌شوند. هیچ برد/باخت، حقیقت، seed، بقا یا موفقیت حریف مستقیماً نمره شناختی نمی‌سازد.
- OSI با منطق V3 محاسبه می‌شود: مقایسه درون‌پنجره‌ای، تجمیع درون‌فاز و سپس میانگین برابر چهار فاز؛ میانگین خام همه کلیک‌ها ممنوع است.
- GNSS Anomaly Detection یک metric تخصصی سناریو است و با Information Seeking یکی نیست. «Cognitive Score» کل نیز ساخته نمی‌شود.
- مشخصات مسیر فقط در صورت اثر علّی بر زمان، تأخیر، exposure، اثر مدنی و قابلیت مشاهده باقی می‌مانند؛ در غیر این صورت باید از UI حذف شوند.
- فاز ۲ هیچ عدد نهایی برای احتمال جهان، وزن evidence، هزینه، آستانه پایان یا loading شناختی تصویب نمی‌کند.

## ۲. خطوط قرمز روایی و چیزهایی که حفظ می‌شوند

هویت ثابت سناریو چنین است: بازیکن فرمانده مرکز لجستیک است؛ چند کاروان/بسته هم‌زمان به مقصدهای مختلف می‌روند؛ PNT/GNSS و ISR فضایی شبکه را پشتیبانی می‌کنند؛ عملیات ابتدا عادی است و سپس ناهمخوانی مکانی/مسیری ظاهر می‌شود؛ یک یا چند مسیر مسئله‌دار می‌شوند؛ بازیکن باید شبکه را پایش، مسئله را تشخیص، منابع محدود را تخصیص، مسیرها را مدیریت و تداوم لجستیک را حفظ کند؛ کاروان اولویت‌دار با کل شبکه در تعارض منابع قرار می‌گیرد؛ نقشه، کاروان و مسیر هسته تجربه‌اند؛ و ستون هشت‌راندی حفظ می‌شود.

آنچه می‌تواند تغییر کند حقیقت پنهان، شواهد، کریدور درگیر، هدف و واکنش حریف، داوری، نقش واقعی منابع، checkpointهای باور، telemetry و AAR است. داستان به مسئله ژئوپلیتیکی دیگری، بازی هسته‌ای، سناریوی تایوان، یا آزمون چندگزینه‌ای تبدیل نمی‌شود. هیچ حقیقتی پیش از آنکه از راه وضعیت جهان یا evidence قابل مشاهده شود افشا نخواهد شد.

## ۳. ممیزی مسئله علمی نسخه فعلی سناریو ۵

baseline واقعی در `src/ui/components/scenario/ScenarioFiveSimulation.tsx`، `ScenarioFiveTypes.ts`، اجزای کارت/نقشه/منابع/خلاصه، درخت `src/scenarios/s5_silent_waves_redesign/tree.ts`، registry در `src/scenarios/index.ts` و mount در `MiniGameHost.tsx` بررسی شد.

| یافته | شاهد پیاده‌سازی فعلی | پیامد علمی/طراحی |
|---|---|---|
| جهان ثابت و پاسخ ثابت | `initialZones`، `initialConvoys` و روایت راندها ثابت‌اند؛ `scan_mashhad`/`scan_all_nodes` همیشه flag را فعال می‌کنند | حفظ پاسخ، جای استدلال تحت عدم‌قطعیت را می‌گیرد |
| اسکن ممتاز راند ۲ | `applyActionSideEffects` فقط اسکن مشهد/سراسری را کشف کامل می‌داند | گزینه با «درست‌بودن پنهان» امتیاز می‌گیرد، نه رفتار قابل مشاهده |
| افشای اجباری و محرومیت دائمی | پس از راند ۲، block خطوط ۱۵۸۴–۱۵۹۱ مشهد را آشکار، منابع را جریمه و `lateDiscoveryPenalty` را فعال می‌کند؛ موفقیت کامل نیز آن flag را رد می‌کند | failure به lookup از پیش‌تعیین‌شده نزدیک است و مسیر بازی را بازنمی‌گذارد |
| Actor مستقل وجود ندارد | واکنش‌ها side effectهای مستقیم action ID هستند | زنجیره تصمیم→مشاهده Actor→واکنش قابل آزمون نیست |
| properties مسیر عمدتاً نمایشی | `travelCost`، `delayRisk`، `gnssRisk` و `civilianImpact` در tooltip نقشه‌اند، اما adjudication از آن‌ها استفاده عمومی نمی‌کند | affordance اطلاعاتی بدون علیت ایجاد می‌شود |
| deltaهای صریح بازنویسی می‌شوند | `applyStatusDelta` پس از delta، `criticalDelivery`، `logisticsContinuity`، `navigationIntegrity` و `remainingResources` را دوباره مشتق می‌کند | اثر کارت ممکن است با مدل واقعی ناسازگار/پنهان شود |
| پیشرفت خودکار پنهان | `progressPenalty` در هر راند جز توقف راند ۴، `alphaProgress:+7` می‌دهد | پیامد خارج از کارت و قرارداد تصمیم است |
| metrics/flags بی‌استفاده یا کم‌اثر | `falseGnssRelianceTime`، `isrUsageQuality`، `routeDiversityScore` و چند score اولیه عملاً update علّی ندارند؛ `alphaMonitored` و `resourcesPreserved` در پایان نقشی روشن ندارند | داشبورد ظاهراً دقیق اما بدون مسیر علّی می‌شود |
| پایان fallback | حالت اولیه پایان `limited_success/delivered_delayed` است و تنها چند شرط آن را عوض می‌کنند | نبود failure به success پیش‌فرض تبدیل می‌شود |
| heuristic شناختی تجمعی | `sumWeights` و خطوط ۱۲۵۰–۱۲۵۴ امتیازهای اولیه را با وزن کارت بالا/پایین می‌برند؛ `operationalStrategicIndex` میانگین چند score است | فاقد profile version، مقایسه درون‌پنجره‌ای، missing=null و جدایی outcome است |
| اختلاط domain و cognition | Summary «تشخیص تهدید» و «مدیریت منابع» را هم در شاخص عملیاتی و هم شناختی نمایش می‌دهد | GNSS skill با Information Seeking و نتیجه با فرایند تصمیم خلط می‌شود |
| زمان تصمیم ناخالص | `responseTimeMs` اختلاف wall-clock است و pause/hidden-tab را جدا نمی‌کند | timing برای تفسیر فرایند پاسخ ضعیف است |
| telemetry شواهد/باور/دلیل ناقص | فقط انتخاب‌ها، target، preview count، منابع و state ثبت می‌شوند | updating، discipline و coherence قابل سنجش دفاع‌پذیر نیستند |

## ۴. معماری پیشنهادی چهار فاز / هشت راند

| فاز | راندها | نقش روایی | پنجره‌های پیشنهادی | خروجی فاز |
|---|---|---|---|---|
| A — پایش مبنا / ناهنجاری ضعیف | ۱–۲ | ساخت baseline و مواجهه با نخستین ناهمخوانی | `A1_baseline_monitoring`؛ `A2_prebelief`؛ `A2_evidence_acquisition`؛ `A2_postbelief` | فرضیه اولیه، شواهد بازشده، تصمیم درباره دامنه پایش |
| B — تشخیص / سازگارسازی مسیر | ۳–۴ | پایش هدفمند و انتخاب سیاست مسیر تحت عدم‌قطعیت | `B1_monitoring_allocation`؛ `B2_route_policy`؛ `B_reason` | وضعیت پایش شبکه، سیاست مسیر و دلیل انتخاب |
| C — فشار لجستیک / رقابت منابع | ۵–۶ | fallback، پشتیبانی، توقف و ذخیره واکنش | `C1_support_and_checkpoints`؛ `C2_resource_portfolio`؛ `C_belief_checkpoint`؛ `C_reason` | ذخیره واقعی، آمادگی جایگزین و belief میانی |
| D — تهدید فعال / حل بحران | ۷–۸ | پاسخ به Actor و رساندن/بازآرایی نهایی | `D1_crisis_response`؛ `D1_information_policy` (مشروط)؛ `D2_final_delivery_policy`؛ `D_final_belief`؛ `D_reason` | state نهایی، outcome مأموریت و ردپای تصمیم |

هر پنجره فقط اگر گزینه‌های واقعی و هم‌سطح دارد وارد measurement می‌شود. checkpoint باور، دلیل، مرور evidence، preview و تأیید نتیجه، «تصمیم شناختی مستقل» نیستند و به OSI وارد نمی‌شوند. برای OSI، ابتدا پنجره‌های معتبر هر فاز با diagnosticity مصوب آینده ترکیب می‌شوند؛ سپس چهار `PhaseIndex` با وزن برابر میانگین می‌شوند. اگر یک فاز داده لازم ندارد، OSI نهایی `null` و completeness جداگانه گزارش می‌شود، نه اینکه missing برابر صفر شود. `[D-S5-04]`

## ۵. معماری حقیقت پنهان، مشاهده بازیکن و مشاهده Actor

### `trueWorldState`

شامل `worldId/seed`، کریدور اصلی درگیر، cause واقعی (خرابی/محیطی/جمینگ/اسپوفینگ/ترکیبی)، هدف Actor، پروفایل aggressiveness/deception، شدت و زمان‌بندی اختلال PNT، decoy، reliability هر منبع، readiness زمینی، state واقعی کاروان‌ها و منابع Actor است. این state برای موتور، simulation و AAR است و در measurement featureهای بازیکن وارد نمی‌شود.

### `playerObservableState`

فقط داده‌های دیده‌شده: نقشه و وضعیت اعلام‌شده، منابع قابل مصرف، evidenceهای available/opened، سطح کیفیت/محدودیت منبع، گزارش‌های کاروان، تأخیر قابل مشاهده، پیامد تصمیم‌های قبلی و uncertainty صریح. مقدار واقعی location/cause/intent تنها هنگامی وارد می‌شود که رویداد جهان آن را آشکار کرده باشد.

### `actorObservableState`

فقط علائمی که Actor می‌تواند مشاهده یا استنباط کند: تغییر مسیر آشکار، شدت/الگوی ISR قابل آشکارسازی، توقف یا اسکورت آشکار، انتشار هشدار، عملیات زمینی قابل مشاهده، tempo شبکه و decoy قابل کشف. انتخاب UI، باور خصوصی، evidence بازشده محرمانه و reason بازیکن برای Actor نامرئی‌اند.

### ابعاد کنترل‌شده جهان

بدون احتمال عددی در این فاز:

- کریدور اصلی درگیر: یکی از چند کریدور موجود که از نظر روایت معتبر است؛
- cause: اختلال فنی/محیطی، اخلال هدفمند، فریب هدفمند یا علت ترکیبی؛
- objective Actor: تأخیر شبکه، انحراف/سرقت محموله اولویت‌دار، آزمون وابستگی PNT، یا ایجاد diversion؛
- profile: محتاط، فرصت‌طلب، فریبنده یا فشارافزا؛
- reliability: یک منبع دقیق‌تر، noisy یا دیررس، بدون «منبع همیشه دروغگو»؛
- timing/severity: شروع ضعیف/دیرتر و تشدید مشروط؛
- decoy: وجود/عدم وجود ناهنجاری ثانویه؛
- ground readiness: آماده، با تأخیر یا محدود.

ترکیب‌ها باید با constraint table از جهان‌های ناممکن جلوگیری کنند. هر world deterministic تحت seed است؛ تغییر جهان فقط در شروع اجراست و seed برای تغییر نتیجه پس از انتخاب reroll نمی‌شود. `[T-RAND25-1, T-CSIS25-1, D-S5-01]`

## ۶. معماری Evidence و Belief

| نوع evidence | source type | شرط دسترسی | فرضیه‌های تقویت/تضعیف‌شونده | نویز/ناقص‌بودن | آنچه بازیکن می‌بیند |
|---|---|---|---|---|---|
| telemetry ناهنجاری PNT | `pnt_telemetry` | baseline یا تخصیص ISR | کریدور/نوع اختلال | multipath، drift یا spoof شبیه هم‌اند | اختلاف نسبت به baseline، زمان، کیفیت و محدودیت |
| گزارش راننده/کاروان | `field_report` | ارتباط رادیویی/تماس | location واقعی، شرایط مسیر | تأخیر، خطای انسانی، پوشش ناقص | متن گزارش، زمان دریافت و reliability کیفی |
| ناسازگاری زمان رادیویی | `radio_timing` | پایش ارتباط | spoof/jam در برابر مشکل محلی | clock error و packet delay | الگوی ناسازگاری، نه cause قطعی |
| مشاهده ISR ماهواره‌ای | `satellite_isr` | صرف ISR و availability | activity زمینی/مسیر/decoy | revisit gap، ابر/تفکیک | observation و limitation؛ نه برچسب حقیقت |
| شناسایی زمینی | `ground_recon` | اعزام و زمان رسیدن | emitter/کمین/پاک‌بودن مسیر | محدودیت میدان دید و خطر | گزارش موضعی با timestamp |
| الگوی سطح مسیر | `route_pattern` | چند observation یا گذر زمان | کریدور و objective | correlation بدون causation | trend و مقایسه مسیرها |
| سازگاری بین‌منبعی | `cross_source_analysis` | حداقل دو source type | cause/intent/confidence | اختلاف ممکن است باقی بماند | نقاط توافق/تعارض و دامنه اطمینان |

Belief طبیعی و لازم است:

1. `corridorBelief`: توزیع احتمال بازیکن روی کریدورهای نامزد؛ برای AAR، تشخیص دامنه‌ای و پژوهش، نه score مشترک مستقیم.
2. `targetedInterferenceEstimate`: برآورد ۰..۱۰۰ اینکه ناهنجاری هدفمند/خصمانه است؛ همراه confidence. این scalar با semantic فعلی V3 برای Evidence-Responsive Updating سازگار است.

checkpointهای پیشنهادی: پیش از evidence انتخابی راند ۲، پس از evidence راند ۲؛ پیش از بسته شواهد تازه در پایان راند ۶/شروع ۷، پس از آن؛ و برآورد نهایی. score updating فقط هم‌جهتی و تناسب تغییر باور با تغییر **قدرت evidence در دسترس بازیکن** را می‌سنجد، نه نزدیکی به حقیقت پنهان. وزن/aggregation evidence در فاز بعد با panel و calibration تعیین می‌شود. اگر evidence واقعاً تغییر نکند، آن جفت برای diagnostic score معتبر نیست.

## ۷. معماری Actor و واکنش حریف

Actor دارای `objective`، `profile`, `capabilities`, `constraints`, `memory`, `riskBudget`, `deceptionState` و `observationHistory` است. تابع واکنش فقط `(actorInternalState, actorObservableState, seededDraw)` را می‌گیرد و هرگز `playerBelief`، `openedEvidenceIds` یا component selection را نمی‌بیند.

قواعد مفهومی:

- حریف محتاط در برابر شناسایی زمینی/route hardening ممکن است شدت را کم یا emitter را جابه‌جا کند؛
- حریف فرصت‌طلب ضعف کریدور یا کاهش ذخیره را دنبال می‌کند؛
- حریف فریبنده decoy یا الگوی mixed signal را حفظ می‌کند و در برابر counter-deception واکنش مشروط دارد؛
- حریف فشارافزا در صورت مشاهده پاسخ شدید ممکن است تشدید کند، اما off-ramp معتبر و constraints مانع escalation اجباری‌اند؛
- objective می‌تواند با همان action بازیکن واکنش متفاوت بسازد؛ بنابراین پاسخ lookup ثابت نیست.

bounded variation از rule set و seed می‌آید، نه مدل زبانی یا randomness آزاد. هر واکنش باید `ruleId`، observationهای استفاده‌شده و state delta را برای audit ثبت کند. `[T-CHINA2104-1, T-LUSITANIA-1, T-AMS-LOCAL-1, T-RAMS-LOCAL-1]`

## ۸. زنجیره Adjudication پیشنهادی

```text
DecisionIntent
→ validate availability/requirements
→ post explicit user_cost resource events
→ apply route/convoy/world transition
→ derive player-visible and actor-visible signals separately
→ actor observes only actorObservableState
→ seeded rule-based actor reaction
→ conditional inject/event
→ generate evidence with provenance/reliability/availability
→ update playerObservableState (not hidden truth)
→ open next decision window
```

هر delta باید یک `causeEventId` داشته باشد. حرکت طبیعی زمان نیز event صریح است و دیگر `+7` پنهان نیست. derived metrics فقط از canonical state محاسبه می‌شوند و effect کارت را بی‌صدا overwrite نمی‌کنند. exogenous loss/recovery با kind جدا ثبت می‌شود و هرگز به resource stewardship شناختی credit نمی‌دهد. `[T-NATO-1, T-CSISMIT24-1, T-RAND-LOCAL-1, D-S5-05]`

## ۹. طراحی منابع و مسیرها

### منابع

- `ISR`: ظرفیت tasking/revisit؛ هزینه بازکردن بعضی evidenceها و فرصت از‌دست‌رفته برای راندهای بعد.
- `energy/fuel`: حرکت، reroute، escort، fallback و ground support؛ باید به asset/convoy مربوط باشد، نه meter انتزاعی صرف.
- `time`: deadline و lag واقعی؛ زمان تصمیم UI از زمان جهان جداست.
- `contingencyReserve`: بخشی نامتعهد از منابع، نه منبع چهارم لزوماً؛ وضعیت آن باید قابل مشاهده باشد.
- availability، cost، user expenditure، exogenous loss و recovery eventهای مستقل‌اند. recovery اگر وجود دارد فقط mission state را بهبود می‌دهد.

### مسیرها

اگر property باقی بماند، نقش علّی آن چنین است:

| property | اثر لازم |
|---|---|
| `travelCost` | مصرف زمان/انرژی و ETA |
| `delayRisk` | risk تابع وضعیت مسیر و جهان، با seeded resolution قابل audit |
| `gnssRisk` | exposure در صورت وابستگی PNT و نبود fallback/corroboration |
| `civilianImpact` | هزینه اختلال/بستن/عملیات زمینی بر ثبات مدنی و محدودیت پاسخ |
| `visualStatus` | فقط projection از player evidence؛ هرگز حقیقت مستقل |

تابع route outcome باید از property مسیر، قابلیت کاروان، fallback navigation، evidence، پشتیبانی و event جهان استفاده کند. property بدون اثر حذف می‌شود. تاب‌آوری یعنی continuity of service از مسیرهای بدیل/ناوبری جایگزین، نه صرفاً سالم‌ماندن یک asset. `[T-PYONGYANG-1, T-CSIS25-1, D-S5-06]`

## ۱۰. Measurement Map کامل راندهای ۱ تا ۸

| راند | فاز پیشنهادی | هدف عملیاتی فعلی | مسئله تصمیم فعلی | ضعف فعلی | پنجره(های) بازطراحی | رفتار واقعاً قابل آشکارسازی | Construct مشترک V3 | metric تخصصی | Evidence موجود | Belief؟ | Reason؟ | telemetry لازم | تشخیص‌گری | مبنای منبع/طراحی | وابستگی فاز بعد |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ۱ | A | پایش روتین شبکه | انتخاب پایش baseline یا حفظ منابع | effect قطعی و heuristic؛ evidence واقعی ندارد | `A1_baseline_monitoring` | دامنه پایش، تنوع منبع، trade-off baseline/ذخیره | Information Seeking؛ Resource Stewardship؛ Planning؛ OSI فقط اگر گزینه‌ها هم‌سطح شوند | کیفیت baseline PNT؛ پوشش شبکه | telemetry عادی، radio check، route manifest | خیر؛ هنوز anomaly مشخص نیست | خیر؛ بار اضافی کم‌ارزش است | available/final action، source opened، cost، active time | متوسط | `T-NATO-1, D-S5-02` | تعریف baseline و evidence metadata |
| ۲ | A | مکان‌یابی اختلال مبهم | انتخاب منبع/گره بررسی | اسکن مشهد ممتاز؛ افشای اجباری | `A2_prebelief`، `A2_evidence_acquisition`، `A2_postbelief` | فرضیه‌سازی، corroboration، allocation اطلاعات | Information Seeking؛ Evidence-Responsive Updating؛ OSI | GNSS anomaly detection؛ localization quality | PNT anomaly، field report، radio timing؛ نتایج مشروط جهان | بله؛ قبل/بعد، طبیعی و ضروری | خیر؛ دلیل در پایان فاز | vector کریدور، targeted estimate/confidence، evidence dwell، revision | بالا | `T-DCDC-1, T-LUSITANIA-1, D-S5-02` | مدل evidence و حذف forced reveal |
| ۳ | B | پایش ویژه بدون رهاکردن شبکه | تخصیص attention میان کاروان اولویت‌دار و شبکه | همیشه الف/مشهد؛ flag کم‌اثر | `B1_monitoring_allocation` | تمرکز، پوشش شبکه، حفظ گزینه‌های بعدی | Multi-Criteria Integration؛ Resource Stewardship؛ Second-Order؛ OSI | network logistics balance؛ monitoring coverage | evidenceهای راند۲ + گزارش جدید کاروان‌ها | خیر؛ checkpoint تازه بدون evidence تازه مصنوعی است | خیر | resource/coverage before-after، available corridors، action history | متوسط-بالا | `T-NATO-1, T-RAND25-1, D-S5-04` | Actor observation از پایش آشکار |
| ۴ | B | انتخاب سیاست مسیر | سرعت/توقف/reroute مرحله‌ای | properties مسیر علّی نیست؛ پاسخ safe از پیش معلوم | `B2_route_policy`، `B_reason` | trade-off سرعت، exposure، reversibility و آینده | Planning & Foresight؛ Risk Posture؛ Multi-Criteria؛ Operational/Strategic؛ Decision Coherence | route robustness؛ delay؛ PNT exposure؛ civilian impact | route pattern، cross-source consistency، ETA/risk ranges | خیر؛ مگر evidence تازه در همین window برسد | بله؛ برای coherence فاز B | first/final، selectedReasonId، route features visible، resource costs | بالا | `T-PYONGYANG-1, T-CSISMIT24-1, D-S5-06` | causal route engine و reason matrix خبره |
| ۵ | C | توقف‌ها و پشتیبانی | checkpoint/fallback/ground support | effect کارت مستقیم؛ readiness جهان ثابت | `C1_support_and_checkpoints` | آمادگی، redundancy، هزینه فرصت و شبکه/کاروان | Planning؛ Second-Order؛ Resource Stewardship؛ OSI | navigation integrity؛ fallback readiness؛ delay control | field/ground availability، route status، ETA | خیر؛ تصمیم resilience است نه attribution | خیر | requirements، cost events، readiness before-after، visible state | بالا | `T-PYONGYANG-1, T-RAMS-LOCAL-1` | مدل fallback و arrival lag |
| ۶ | C | تقسیم منابع کاهش‌یافته | اولویت الف/تعادل/ذخیره/کاهش اولویت | resourceReserve دوگانه و recovery مصنوعی؛ inject ثابت | `C2_resource_portfolio`، `C_belief_checkpoint`، `C_reason` | portfolio منابع، reserve، حفظ شبکه و تفسیر سیگنال Actor | Resource Stewardship؛ Multi-Criteria؛ Planning؛ Second-Order؛ Adversary Modeling؛ Decision Coherence | logistics resilience؛ reserve adequacy؛ network balance | pattern چندراندی، ISR observation یا نبود آن، سیگنال مشکوک مشروط | بله؛ post-evidence میانی؛ pair با checkpoint پیشین | بله؛ نقطه trade-off اصلی | user/exogenous events، belief/confidence، actor-visible signal، reason | بالا | `T-CHINA2104-1, T-RAND25-1, T-AMS-LOCAL-1` | actor rules و shadow resource path |
| ۷ | D | پاسخ به تهدید آشکار/کمین | reroute، فشار زمینی، فریب یا escort | objective همیشه سرقت؛ Actor magic؛ افشای کامل ثابت | `D1_crisis_response`؛ `D1_information_policy` فقط با تأیید | مدل‌سازی واکنش، reversibility، escalation و حفظ off-ramp | Adversary Modeling؛ Escalation Sensitivity؛ Second-Order؛ Risk Posture؛ OSI؛ Information Discipline مشروط | threat containment؛ convoy exposure؛ civilian impact | ISR/ground/cross-source؛ فقط آنچه جهان آشکار کرده | بله؛ پس از evidence بحران و قبل از پاسخ | بله؛ برای پاسخ بحرانی | actor observations، evidence strength/shareability، response/claim intensity، reason | بالا | `T-CHINA2104-1, T-LUSITANIA-1, T-CSISMIT24-1` | تصمیم reviewer درباره window ارتباطی |
| ۸ | D | تحویل/حل نهایی | هدایت، support یا no action | outcome تا حدی fallback؛ اقدام نهایی کم‌تشخیص | `D2_final_delivery_policy`، `D_final_belief`، `D_reason` | تصمیم نهایی وابسته به state و سازگاری با برنامه قبلی | Decision Coherence؛ Planning؛ Risk Posture؛ OSI فقط اگر alternatives واقعی بمانند | critical delivery؛ continuity؛ delay؛ residual threat | state observable نهایی و evidence باقیمانده | بله، برآورد نهایی برای trajectory؛ نه truth score | بله؛ خلاصه فاز D | available actions واقعی، end-state inputs، final belief/reason | متوسط؛ اگر فقط confirm باشد پایین/صفر | `T-NATO-1, T-RAND-LOCAL-2, D-S5-07` | end-state taxonomy و AAR |

پنجره‌های کم/غیرتشخیص‌گر و خارج از score: نمایش outcome، تأیید ادامه، بازکردن help/glossary، انتخاب targetی که عملاً یک target دارد، forced reveal، checkpoint belief بدون evidence تازه، و راند ۸ اگر state فقط یک اقدام feasible باقی گذاشته باشد. این telemetry می‌تواند توصیفی بماند.

## ۱۱. سازگاری Constructهای مشترک با Cognitive V3

مرجع کد جاری: profile و version در `src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts`؛ فرمول‌ها در `.../model/cognitiveEngineV3.ts`؛ telemetry/types در `.../model/types.ts`؛ capture در `ScenarioFourRedesignedScenarioOne.tsx`.

| Construct | تعریف معنایی دقیق V3 | مسیر/تابع جاری | سنجش طبیعی در S5 | تصمیم‌های آشکارساز | telemetry | همان scale؟ | ریسک اعتبار | توصیه |
|---|---|---|---|---|---|---|---|---|
| OSI | جهت نسبی strategic در برابر operational برای گزینه، پس از مرکز/نرمال‌سازی در همان window؛ تجمیع برابر فازها | `rawOrientation`، `adjustedOrientationForOption`، `centerAndNormalizeWithinWindow`، `calculateCognitiveModelV3` | بله | همه windowهای اصلی با alternatives معتبر | available option IDs، final، profile version، phase | بله، `-1..1` | labelگذاری گزینه به‌جای رفتار | coding خبره و phase-equal aggregation |
| Operational Strength | میانگین وزنی loading عملیاتی خام گزینه‌های انتخابی | `calculateCognitiveModelV3` خطوط operationalStrength | بله | B2، C1، D1/D2 و سایر coreها | profile + diagnosticity | بله، `0..100` | tactical success با loading اشتباه شود | outcome وارد loading نشود |
| Strategic Strength | میانگین وزنی loading راهبردی خام | همان تابع | بله | A1، B2، C2، D1 | همان | بله، `0..100` | «گزینه مطلوب» تلقی شود | هر دو strength مستقل نمایش یابند |
| Integration | میانگین هارمونیک دو strength؛ high-high، نه مرکز OSI | `harmonicIntegration` | بله | مجموع coreها | O/S strength | بله، `0..100` | توازن low-low را integration دانستن | harmonic mean عیناً حفظ شود |
| Dispersion | انحراف معیار جامعه شاخص‌های فاز | `populationDispersion` | بله | چهار PhaseIndex | phase scores | بله، بر پایه `-1..1` | تعداد window نامساوی | فقط dispersion چهار فاز |
| Information Seeking | ۶۰٪ loading گزینه + ۲۵٪ پوشش evidence مرتبط + ۱۵٪ entropy تنوع source | `evidenceCoverageFor`، `sourceDiversityFor`، بخش `informationParts` | بله | A1/A2 و evidence C/D | available/opened/relevance/source/dwell | بله، `0..100` | بازکردن بی‌هدف کارت‌ها | relevance و diversity؛ dwell فقط توصیفی/quality check |
| Second-Order Thinking | ترکیب future consequence، adversary modeling، reversibility و stewardship | `scores.secondOrderThinking` | بله | B2، C1/C2، D1 | profileهای expert-coded | بله، `0..100` | نتیجه خوب به‌جای قصد رفتاری | فقط profile انتخاب، نه outcome |
| Adversary Modeling | loading توجه گزینه به مشاهده/تفسیر/واکنش Actor | `scores.adversaryModeling` | بله | C2، D1 | actor-visible consequences shown، choice | بله، `0..100` | گزینه با نام «فریب» خودکار بالا شود | profile بر مبنای مکانیزم واقعی Actor |
| Escalation Sensitivity | میزان وزن‌دادن گزینه به پیامدهای تشدید/کاهش تنش؛ بالا الزاماً بهتر نیست | `scores.escalationSensitivity` | بله، عمدتاً D | D1 و information policy | response intensity، reversibility، profile | بله، `0..100` | تبدیل به اخلاق/کیفیت | توصیفی و غیرهنجاری نمایش یابد |
| Evidence-Responsive Updating | هم‌جهتی و تناسب تغییر estimate بازیکن با تغییر evidence-visible confidence؛ نه truth accuracy | `calculateEvidenceUpdatingAudit` / `calculateEvidenceUpdating` | بله، مشروط به evidence واقعی | A2 pre/post؛ C→D؛ final | estimates، system evidence support، timestamps | بله، `0..100/null` | evidence index غیرمعتبر | تا calibration evidence aggregation، provisional |
| Information Discipline | محدودکردن overclaim و overdisclosure نسبت به confidence قابل‌مشاهده و shareability evidence | بخش `informationDisciplineParts` | مشروط | فقط `D1_information_policy` طبیعی | claim/disclosure intensity، visible confidence، shareability | بله، `0..100/null` | تحمیل ارتباط سیاسی به داستان لجستیک | بدون تأیید window، `null` و حذف از dashboard |
| Resource Stewardship | profile stewardship/contingency/reversibility منهای penalty فقط هزینه‌های user؛ recovery Actor credit نیست | `userCosts`، `shadow`، `stewardshipBase` | بله | A1، B1/B2، C1/C2، D1 | typed resource events و baseline | بله، `0..100` | کم‌خرجی را همیشه خوب دانستن | opportunity-cost profiles + user-only shadow |
| Planning & Foresight | ترکیب contingency، reversibility، stewardship و future consequence | `scores.planningForesight` | بله | B2، C1/C2، D2 | profile و window diagnosticity | بله، `0..100` | reroute را مستقل از context خوب فرض کردن | با option feasibility و context coding شود |
| Multi-Criteria Integration | entropy پوشش domainها × کف شدت کلی domain؛ تنوع بدون عمق کافی نیست | `multiDomain` در `calculateCognitiveModelV3` | بله | B1/B2، C2، D1 | domain loadings profile | بله، `0..100` | اختلاط domain metrics با construct | domainها: mission/info/escalation/resources/civilian/future؛ coding خبره |
| Risk Posture | جایگاه نسبی riskExposure گزینه نسبت به alternatives همان window | `adjustedProfileMetric(...,"riskExposure")` و `risk` | بله | B2، C2، D1/D2 | option set و profile | بله، `-1..1` | high/low را خوب/بد دانستن | نسبی و غیرهنجاری گزارش شود |
| Decision Coherence | ۶۰٪ همسویی reason با profile انتخاب‌ها + ۴۰٪ سازگاری cross-window | `REASON_ALIGNMENT_MATRIX_V3`، `MOVE3_CROSS_COHERENCE_V3`، `decisionCoherence` | مشروط به reason | پایان B/C/D | selectedReasonId، choices، coherence rules | بله، `0..100/null` | reason پسینی/گزینه‌های هدایتگر | reason محدود و قبل از outcome؛ matrix خبره |

`dataCompleteness` construct نیست؛ شاخص کیفیت/موجودبودن داده است. semantic فعلی آن در `calculateCognitiveModelV3` ترکیب coverage رکورد core، timing integrity، evidence telemetry، estimate و reason است. برای S5 مؤلفه‌ها همان معنا و scale `0..100` دارند، اما ضرایب نهایی تا مشخص‌شدن تعداد windowها بازکالیبره و version می‌شوند. زمان پاسخ نیز descriptive است و بدون norm معتبر score شناختی نیست.

## ۱۲. Telemetry Blueprint

### هویت و نسخه

`runId`, `scenarioId="s5_silent_waves_redesign"`, `worldId`, `seed`, `measurementModelVersion`, `formulaVersion`, `optionProfileVersion`, `scenarioContentVersion`, `expertPanelVersion`, `startedAt`, `completedAt`.

### هر پنجره تصمیم

`phaseId`, `roundId`, `windowId`, `enteredAt`, `confirmedAt`, `elapsedMs`, `activeDecisionMs`, `hiddenTabMs`, `availableActionIds`, `firstSelectedActionIds`, `finalSelectedActionIds`, `selectionHistory[{actionIds,ts}]`, `revisionCount`, `helpOpened`, `glossaryOpened`, `selectedReasonId?`, `playerObservableStateBeforeRef`, `playerObservableStateAfterRef`.

### Evidence

`availableEvidenceIds`, `openedEvidenceIds`, و برای هر evidence: `evidenceId`, `sourceType`, `relevantHypothesisIds`, `relevantWindowIds`, `shareability`, `availableAt`, `openedAt`, `closedAt`, `activeDwellMs`, `qualityLabelVisible`, `limitationVisible`. metadata truth/reliability واقعی در log پنهان جداست و به opened evidence جعل نمی‌شود.

### Belief

`checkpointId`, `recordedAt`, `corridorBelief[{hypothesisId,probability}]`, `targetedInterferenceEstimate`, `confidence`, `evidenceSupportVisibleAtCheckpoint`, `availableEvidenceIdsAtCheckpoint`. جمع probabilityها اعتبارسنجی می‌شود. missing برابر null است.

### Reason

`selectedReasonId`، و در صورت نیاز `reasonPromptVersion`. متن آزاد اختیاری و خارج از score خودکار است تا مشکل پردازش زبان/حریم کاهش یابد.

### منابع و state قابل مشاهده

`playerVisibleResourcesBefore/After`, `resourceEvents[{kind:user_cost|exogenous_loss|actor_recovery|transition_recovery,resource,before,delta,after,sourceEventId}]`, `actionCosts`, `observableMissionStateBefore/After`, `availableRouteIds`, `visibleRouteProperties`, `actorVisibleSignalsGenerated`.

### log پنهان مجزا

`hiddenWorldLog` شامل true state، actor internal state، rule IDs، seeded draws و evidence truth map است؛ namespace و access جدا دارد و در feature extraction بازیکن فقط از طریق evidence واقعاً available/opened قابل استفاده است.

قواعد capture V3: first selection تغییرناپذیر؛ revision فقط تغییر واقعی؛ pause هنگام hidden/blur از active time کم؛ evidence dwell تنها open/close واقعی؛ submit تکراری guard؛ فقدان داده `null`؛ و completeness جدا از score. type مبنا: `DecisionTelemetryV3`, `EvidenceOpenTelemetryV3`, `AttributionEstimateTelemetryV3`, `ResourceEvent` در `scenario-four/model/types.ts`.

## ۱۳. تفکیک Mission Metrics / Cognitive Constructs / Scenario-Specific Metrics

| لایه | نمونه‌ها | ورودی مجاز | ورودی ممنوع/مرز |
|---|---|---|---|
| Mission Outcome | تحویل/سلامت محموله، deadline، تعداد کاروان‌های پایدار، تداوم شبکه، اثر مدنی، threat containment، منابع باقی‌مانده | true transition + rules + seeded world | نباید به cognitive score تبدیل شود |
| Shared Cognitive Constructs | OSI و strength/integration/dispersion؛ Information Seeking؛ Second-Order؛ Actor Modeling؛ Escalation؛ Stewardship؛ Planning؛ Multi-Criteria؛ Risk؛ Updating/Discipline/Coherence مشروط | رفتار خام، گزینه‌های available، profile نسخه‌دار، evidence بازشده، reason و user cost | hidden truth، win/loss، بقا، actor success، RNG و recovery |
| Scenario-Specific Metrics | GNSS/PNT anomaly detection، navigation integrity management، critical-delivery management، logistics resilience، delay control، civilian-impact awareness، network logistics balance | state/evidence/decisions تخصصی سناریو | نباید با semantic construct مشترک برچسب بخورد |
| Data quality/process | completeness، active time، revision، response flags | کیفیت telemetry | نمره توانایی یا شخصیت نیست |

به‌طور صریح: `GNSS Anomaly Detection ≠ Information Seeking`. اولی کیفیت تشخیص دامنه‌ای در این مأموریت است؛ دومی الگوی انتخاب و استفاده از evidence طبق تعریف مشترک V3 است. هیچ «نمره شناختی کل» ساخته نمی‌شود و همه نتایج «پروکسی رفتاری در همین سناریو» توصیف می‌شوند.

## ۱۴. End-state taxonomy پیشنهادی در سطح مفهومی

طبقه‌بندی از بردار state نهایی و با precedence صریح انجام می‌شود؛ thresholdها بعداً کالیبره می‌شوند:

1. `critical_cargo_lost_or_compromised`: از دست‌رفتن/آسیب بحرانی هدف اصلی؛ بالاترین precedence.
2. `priority_delivered_network_failure`: محموله اصلی رسیده، اما تداوم شبکه/کاروان‌های ثانویه فروپاشیده است.
3. `mission_incomplete_continuity_preserved`: شبکه حفظ شده ولی delivery اصلی تا deadline کامل نشده است.
4. `delayed_delivery_persistent_disruption`: تحویل با تأخیر و threat/PNT ambiguity باقیمانده.
5. `resilient_delivery_unresolved_attribution`: continuity و delivery حفظ شده، اما cause/Actor unresolved است؛ unresolved لزوماً failure نیست.
6. `resilient_delivery_threat_contained`: delivery و شبکه حفظ و threat عملیاتی مهار شده، با هزینه/اثر مدنی قابل گزارش.
7. `controlled_disengagement_or_offramp`: Actor عقب‌نشسته/فشار متوقف و continuity با پاسخ برگشت‌پذیر حفظ شده است.

پس از اعمال precedence، اگر هیچ predicate منطبق نبود، `unclassified_state` خطای مدل/coverage است، نه موفقیت پیش‌فرض. هر end state باید در فاز ۸ با anchor path و reachability test اثبات شود. outcome و cognitive constructs کنار هم گزارش می‌شوند، نه در یک score.

## ۱۵. AAR پیشنهادی در سطح مفهومی

AAR پس از پایان و با دو ستون «آنچه واقعاً رخ داد» و «آنچه بازیکن می‌توانست/دید» ارائه می‌شود:

- `worldId/seed`، کریدور/cause واقعی و محدودیت‌های جهان؛
- objective/profile و state trajectory حریف؛
- evidence موجود در هر لحظه، evidence بازشده و evidence از‌دست‌رفته، با limitation؛
- trajectory باور کریدور و هدفمندبودن اختلال؛
- آنچه Actor از اقدام بازیکن دید و rule واکنش فعال‌شده؛
- timeline تصمیم‌های first/final، revisions، reasonها و turning pointها؛
- trajectory ISR/energy/time و تفکیک user cost از exogenous change؛
- state/route transitions و علت دقیق end state؛
- mission metrics، scenario metrics و constructهای مشترک در سه بخش جدا؛
- نسخه مدل/فرمول/profile/content و completeness؛
- محدودیت تفسیر: اجرای اکتشافی، نه پیش‌بینی و نه سنجش شخصیت.

هیچ hidden truth در طول بازی به‌خاطر نیاز dashboard افشا نمی‌شود. `[T-RAND-LOCAL-2, T-CSISMIT24-1, D-S5-07]`

## ۱۶. مواردی که عمداً در فاز ۲ عددگذاری نشده‌اند

- احتمال یا فراوانی hidden worldها و seeded draws؛
- reliability و likelihood ratio/weight هر evidence؛
- هزینه ISR/energy/time، recovery و deadline؛
- شدت/زمان Actor reaction و آستانه inject؛
- thresholdهای route risk، civilian impact و end state؛
- همه loadingهای ۰..۱ option cognitive profile و diagnosticity؛
- ضرایب completeness و evidence aggregation ویژه S5؛
- reason alignment و cross-window coherence؛
- anchor cutoffs، floor/ceiling و interpretation bands؛
- benchmark expert/human و هر ادعای اعتبار روان‌سنجی.

این‌ها design parameter هستند، مگر در مرحله بعد منبع مستقیم و مناسب برای عدد خاص ارائه شود.

## ۱۷. تصمیم‌های باز که قبل از implementation نیاز به تأیید دارند

1. آیا کریدور واقعی می‌تواند میان همه چهار مسیر اصلی بچرخد یا فقط subset روایی معتبر؟
2. آیا cause فنی/محیطی بدون Actor فعال نیز world معتبر است، یا همه جهان‌ها Actor دارند؟
3. آیا window ارتباطی واقعی در راند ۷ (هشدار محدود/شبکه‌ای/انتساب) با داستان سازگار است؟ بدون تأیید، Information Discipline سنجیده نمی‌شود.
4. آیا belief هدفمندبودن به‌صورت slider ۰..۱۰۰ و corridor belief به‌صورت توزیع اجباری ثبت شود یا corridor فقط top hypothesis + confidence باشد؟
5. reason capture در پایان هر فاز یا فقط B/C/D؟ پیشنهاد: B/C/D، قبل از outcome.
6. آیا time منبع جهان است یا deadline/ETA مشتق‌شده؟ پیشنهاد: ETA/deadline canonical و meter «زمان» حذف/بازتعریف شود.
7. scope civilianImpact: صرفاً route closure و اخلال ترافیک، یا خدمات غیرنظامی وابسته به PNT نیز وارد روایت شود؟
8. نام‌ها و تعداد end stateها و اینکه off-ramp Actor در همین روایت چگونه قابل مشاهده باشد.
9. schema مشترک cross-scenario: reuse مستقیم engine V3 یا extraction یک هسته مشترک نسخه‌دار؛ پیشنهاد دوم پس از آزمون parity.

## ۱۸. فهرست دقیق فایل‌های کدی که در فاز بعد احتمالاً باید تغییر کنند

فایل‌های موجود:

- `src/ui/components/scenario/ScenarioFiveSimulation.tsx`
- `src/ui/components/scenario/ScenarioFiveTypes.ts`
- `src/ui/components/scenario/ScenarioFiveActionCard.tsx`
- `src/ui/components/scenario/ScenarioFiveMap.tsx`
- `src/ui/components/scenario/ScenarioFiveResourcePanel.tsx`
- `src/ui/components/scenario/ScenarioFiveSummary.tsx`
- `src/ui/components/scenario/ScenarioFive.css`
- `src/scenarios/s5_silent_waves_redesign/tree.ts`
- `src/ui/components/scenario/MiniGameHost.tsx` فقط اگر interface mount تغییر کند
- `src/scenarios/index.ts` فقط اگر metadata/version registry لازم شود
- `src/services/analytics/eventLogger.ts` فقط در صورت نیاز به event schema نسخه‌دار

ماژول‌های جدید پیشنهادی زیر `src/ui/components/scenario/scenario-five/`:

- `model/types.ts`
- `model/worldFactory.ts`
- `model/evidenceModel.ts`
- `model/actorModel.ts`
- `model/adjudicator.ts`
- `model/resourceLedger.ts`
- `model/routeModel.ts`
- `model/endStates.ts`
- `model/cognitiveOptionProfilesV3.ts`
- `model/cognitiveEngineV3.ts` یا adapter به هسته مشترک
- `model/telemetry.ts`
- `model/aar.ts`

در فاز بعد، هیچ فایل `ScenarioTwo*` یا `src/scenarios/s2_silent_waves/*` نباید تغییر کند. استخراج هسته مشترک V3 از سناریو ۴ فقط پس از parity test مجاز است و نباید semantic/output scale فعلی را بشکند.
