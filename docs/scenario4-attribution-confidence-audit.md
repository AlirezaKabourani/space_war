# ممیزی و کالیبراسیون اطمینان انتساب سناریو ۴

## خلاصه نتیجه

مشکل ساختاری baseline این بود که `systemAttributionConfidence` از ۲۰ آغاز می‌شد، اما قوی‌ترین ترکیب واقعی writerها فقط مقدار را تا ۴۲ می‌رساند. در نتیجه readerهای ۴۵ تا ۷۰، شرط `attributionUnresolved < 55` و fallback پایان نهم با دامنه‌ای کار می‌کردند که writerها قادر به تولید آن نبودند.

اصلاح در writerهای evidence انجام شد، نه در resolver: نتیجه حسگر دوم به قوی‌ترین corroboration مستقل تبدیل شد، diagnostics برای علت‌های فنی/non-red confidence را کاهش می‌دهد، mixed از pure-red جدا ماند و داده متحد/تجاری به اعتماد، کیفیت، دسترسی و تعارض وابسته شد. آستانه ۵۵ و ترتیب پایان‌ها تغییر نکردند.

## دامنه و ثابت‌های حفظ‌شده

- شرایط اولیه، هزینه‌ها، recovery و فایل Resource Engine V2 تغییر نکردند.
- فرمول‌های Cognitive V3، OSI، Brier و BSS تغییر نکردند.
- احتمال‌های تولید حقیقت پنهان، وزن نیت‌ها، شناسه/تعداد گزینه‌ها و نام/precedence پایان‌ها تغییر نکردند.
- sliderهای بازیکن به confidence سامانه یا resolver متصل نشدند: `Player belief ≠ System evidence confidence`.
- مقدارهای اولیه منابع همچنان برای هر چهار منبع ۱۰۰ هستند.

## Writerهای confidence

| محل | writer | قبل | بعد | معنای طراحی |
|---|---|---:|---:|---|
| `initialState.ts` | مقدار آغازین | 20 | 20 | prior محتاطانه و مبهم |
| Move 1 / passive | پایش غیرفعال | 0 | 0 | بدون corroboration تازه |
| Move 1 / dedicated SSA | تحلیل SSA اختصاصی | +8 | +12 | کیفیت زمینه بهتر؛ به‌تنهایی اثبات انتساب نیست |
| Move 1 / commercial | داده تجاری | +5 حتی در تعارض | +8 و در تعارض −10 | منبع مستقل مفید، با حفظ اثر شاهد متناقض |
| Move 1 / allied network | شبکه متحد | +6 | +9 | corroboration محدود، نه اثبات |
| Move 2 / diagnostics | red / mixed / technical / environmental | +1 / +3 / −10 / −5 | +10 / +8 / −18 / −12 | تشخیص فنی در non-red کاهش معنادار ایجاد می‌کند؛ red همچنان نامعین است |
| Move 2 / second sensor | red / mixed / technical / environmental | +14 / +10 / +4 / +3 | +40 / +27 / −12 / −10 | قوی‌ترین منبع مستقل؛ pure-red و mixed عمداً trajectory متفاوت دارند |
| Move 2 / ally intel | red / mixed / non-red | +7 / +3 / −4 | +22…30 / +14…20 / −6…−10 | اثر به اعتماد متحد وابسته و از حسگر دوم ضعیف‌تر است |
| Move 2 / commercial validation | همه نتیجه‌ها | red: +4، غیرred: −2 | consistent: +22/+14/−8؛ ambiguous: +6/+3/−5؛ unavailable: −2 | کیفیت و دسترسی داده در update لحاظ می‌شود |
| Move 2 / commercial conflict | تعارض قبلی | بدون اثر | هر افزایش بعدی حداکثر +2 | جلوگیری از تورم confidence در حضور شواهد متناقض |
| `clampScenarioOneState` | clamp نهایی | 0…100 | 0…100 | جلوگیری از خروج از دامنه |

کاهش‌های واقعی اکنون شامل تعارض تجاری Move 1، diagnostics فنی/non-red، حسگر دوم non-red، corroboration متحد non-red و نتیجه تجاری ambiguous/unavailable/non-red هستند.

## Readerها و آستانه‌ها

| محل | شرط/خواندن | معنا | در baseline reachable؟ | مسئله baseline |
|---|---|---|---|---|
| `allyActor.ts` | `<35` | جریمه ضعف شواهد در حمایت متحد | بله | بخش بزرگی از مسیرها دائماً زیر این مرز بود |
| `redActor.ts` | `<40` | امکان بهره‌برداری از ادعای عمومی ضعیف | بله، به‌ندرت بالاتر | actor تقریباً همیشه confidence پایین می‌دید |
| `adjudicator.ts` | `<35` و `>=35` | هزینه هشدار عمومی و مشروعیت inject رسانه‌ای | بله | باند بالا محدود بود |
| `move2Adjudicator.ts` | `<45` / `>=45` | denial اسرائیل، مشروعیت و واکنش متحد | خیر | branch بالای ۴۵ structural dead بود |
| `buildConfidencePackage` | باندهای confidence | وضعیت player-facing بسته شواهد | فقط پایین/متوسط | متن «بالا» هرگز نمایش داده نمی‌شد |
| Move 3 / public partial | `>=40`, `>=60` | مشروعیت انتشار بخشی از شواهد | ۴۰ محدود؛ ۶۰ خیر | پاداش بالاتر dead بود |
| Move 3 / public attribution | `>=50`, `>=70` | مشروعیت انتساب عمومی | هر دو خیر | دو باند مثبت dead بودند |
| Red Move 3 | `public level > confidence + 30` | واکنش به overclaim قابل مشاهده | بله | به‌دلیل confidence پایین اغلب فعال می‌شد |
| Ally Move 3 | `<55` | فاصله‌گیری از انتساب عمومی | همیشه true | متحد هرگز مسیر confidence حل‌شده را نمی‌دید |
| `computeMetrics` | `claimLevel - confidence` | information-discipline gap | بله | confidence پایین gap را ساختاری بزرگ می‌کرد |
| `resolvePrimaryEndState` | `<55` | انتساب حل‌نشده | همیشه true | fallback `mixed_crisis_containment` غیرقابل دستیابی بود |
| `narrativeSelectors.ts` | `>=50` | روشن‌تر/محدود بودن تصویر اطلاعاتی | خیر | متن روشن‌تر dead بود |
| UI/telemetry | ثبت confidence زمان تصمیم | تحلیل وضعیت شواهد | بله | فقط ثبت می‌شود؛ slider کاربر در آن دخالت ندارد |
| `cognitiveEngineV3.ts` | confidence ثبت‌شده در telemetry | محاسبه overclaim شناختی | بله | reader حفظ شد و فرمول آن تغییر نکرد |

پس از کالیبراسیون همه آستانه‌های ۳۵، ۴۰، ۴۵، ۵۰، ۵۵، ۶۰ و ۷۰ در فضای واقعی تصمیم reachable هستند. bandهای نمایشی به `بسیار ضعیف / ضعیف / متوسط / نسبتاً قوی / قوی / بسیار قوی` تبدیل شدند.

## دامنه واقعی قبل و بعد

هر دو ستون بر مبنای ۸٬۳۵۲٬۰۰۰ مسیر واقعی، پنج intent و یک جهان deterministic محاسبه شده‌اند.

| معیار | قبل | بعد |
|---|---:|---:|
| min confidence | 15 | 8 |
| max confidence | 42 | 72 |
| p05 | 18 | 14 |
| p25 | 23 | 20 |
| p50 | 26 | 32 |
| p75 | 30 | 43 |
| p95 | 39 | 60 |
| share ≥35 | 12.07٪ | 43.45٪ |
| share ≥40 | 3.45٪ | 34.83٪ |
| share ≥45 | 0٪ | 23.10٪ |
| share ≥50 | 0٪ | 16.21٪ |
| share ≥55 | 0٪ | 13.79٪ |
| share ≥60 | 0٪ | 5.52٪ |
| share ≥70 | 0٪ | 1.72٪ |
| مسیرهای `mixed_crisis_containment` | 0 | 290,106 |

دامنه پایین حذف نشده است: p25 بعد از اصلاح فقط ۲۰ است و ۵۶٫۵۵٪ مسیرها همچنان زیر ۳۵ قرار دارند. مقدار ۷۰+ فقط در ۱٫۷۲٪ مسیرها رخ می‌دهد.

## توزیع پایان‌ها

| پایان | قبل | بعد | سهم بعد |
|---|---:|---:|---:|
| escalation_spiral | 61,593 | 60,765 | 0.728٪ |
| intelligence_failure | 648,000 | 648,000 | 7.759٪ |
| coalition_fracture | 25,056 | 17,484 | 0.209٪ |
| negotiated_deescalation | 2,639,808 | 2,644,704 | 31.666٪ |
| calm_crisis_control | 41,043 | 41,601 | 0.498٪ |
| costly_deterrence | 30,795 | 33,822 | 0.405٪ |
| persistent_ambiguity | 3,847,626 | 3,261,705 | 39.053٪ |
| strategic_information_opportunity | 1,058,079 | 1,353,813 | 16.209٪ |
| mixed_crisis_containment | 0 | 290,106 | 3.473٪ |

`intelligence_failure` افزایش نکرده است. `persistent_ambiguity` همچنان پرتکرارترین پایان است و پایان‌های rare نیز صفر نشده‌اند.

## رفتار به تفکیک intent و cause در جهان اول

| گروه | min–max | p50 | p95 | share ≥55 | share ≥60 | share ≥70 |
|---|---:|---:|---:|---:|---:|---:|
| probe / mixed | 20–59 | 40 | 56 | 15٪ | 0٪ | 0٪ |
| intelligence_collection / red | 18–72 | 38 | 69 | 25٪ | 16٪ | 5٪ |
| coercion / red | 18–72 | 38 | 69 | 25٪ | 16٪ | 5٪ |
| alliance_fracture / mixed | 20–59 | 40 | 56 | 15٪ | 0٪ | 0٪ |
| benign_ambiguous / environmental | 8–32 | 20 | 29 | 0٪ | 0٪ | 0٪ |

این تفکیک نشان می‌دهد mixed می‌تواند از ۵۵ عبور کند، اما به trajectory حالت pure-red و باند ۷۰ نمی‌رسد. technical fault در جهان deterministic اول تولید نشد؛ در smoke سه‌جهانی دامنه آن ۲ تا ۳۲، p50 برابر ۱۹ و p95 برابر ۲۹ بود و هیچ مسیر آن به ۵۵ نرسید. fixture مستقیم diagnostics نیز کاهش ۳۲→۱۴ را تأیید می‌کند.

## robustness سه‌جهانی

اجرای سه‌جهانی ۲۵٬۰۵۶٬۰۰۰ مسیر را پوشش داد. دامنه کل ۲ تا ۷۲، p50 برابر ۳۰ و p95 برابر ۶۲ بود. سهم مسیرهای ≥۵۵ برابر ۱۴٫۰۷٪، ≥۶۰ برابر ۷٫۰۶٪ و ≥۷۰ برابر ۱٫۹۵٪ باقی ماند.

| جهان | مسیرهای `mixed_crisis_containment` | وضعیت ۹ پایان |
|---|---:|---|
| 0 | 290,106 | هر ۹ پایان reachable |
| 1 | 313,281 | هر ۹ پایان reachable |
| 2 | 74,421 | هر ۹ پایان reachable |
| مجموع | 677,808 | هر ۹ پایان reachable |

در هر سه جهان دامنه low تا high حفظ شد و هیچ branch پایانی structural dead نبود.

## مسیر واقعی برای هر ۹ پایان

همه مسیرهای زیر مستقیماً از `analysis/scenario4-confidence-after/summary.json` استخراج شده‌اند و از شناسه‌های واقعی UI استفاده می‌کنند.

| پایان | intent / cause / confidence | Move 1 | Move 2 | Move 3 | Off-ramp / واکنش نهایی اسرائیل |
|---|---|---|---|---|---|
| escalation_spiral | intelligence_collection / red / 30 | `m1_i_passive · m1_p_covert_readiness · m1_c_public_warning` | `m2_a_technical_diagnostics · m2_m_protective_reconfiguration · m2_r_request_defensive_authority` | `m3_t_insufficient · m3_coa_unilateral_strong · m3_info_public_attribution` | — / `deny_and_hold` |
| intelligence_failure | benign_ambiguous / environmental / 8 | `m1_i_passive · m1_p_hold · m1_c_none` | `m2_a_technical_diagnostics · m2_m_continue_normal · m2_r_no_counteraction` | `m3_t_insufficient · m3_coa_contain_understand · m3_info_public_attribution` | `accept_as_interim` / `deny_and_hold` |
| coalition_fracture | probe / mixed / 28 | `m1_i_passive · m1_p_hold · m1_c_public_warning` | `m2_a_technical_diagnostics · m2_m_continue_normal · m2_r_request_defensive_authority` | `m3_t_insufficient · m3_coa_contain_understand · m3_info_public_attribution` | — / `deny_and_hold` |
| negotiated_deescalation | probe / mixed / 28 | `m1_i_passive · m1_p_hold · m1_c_none` | `m2_a_technical_diagnostics · m2_m_continue_normal · m2_r_no_counteraction` | `m3_t_insufficient · m3_coa_negotiated_deescalation · m3_info_keep_restricted` | `accept_as_interim` / `accept_interim_offramp` |
| calm_crisis_control | coercion / red / 30 | `m1_i_passive · m1_p_hold · m1_c_none` | `m2_a_technical_diagnostics · m2_m_activate_fallback · m2_r_no_counteraction` | `m3_t_insufficient · m3_coa_coordinated_response · m3_info_keep_restricted` | — / `deescalate_and_separate` |
| costly_deterrence | coercion / red / 30 | `m1_i_passive · m1_p_hold · m1_c_none` | `m2_a_technical_diagnostics · m2_m_activate_fallback · m2_r_joint_allied_response` | `m3_t_insufficient · m3_coa_coordinated_response · m3_info_public_partial` | — / `deescalate_and_separate` |
| persistent_ambiguity | probe / mixed / 28 | `m1_i_passive · m1_p_hold · m1_c_none` | `m2_a_technical_diagnostics · m2_m_continue_normal · m2_r_no_counteraction` | `m3_t_insufficient · m3_coa_contain_understand · m3_info_keep_restricted` | — / `maintain_ambiguous_pressure` |
| strategic_information_opportunity | probe / mixed / 59 | `m1_i_dedicated_ssa · m1_p_hold · m1_c_none` | `m2_a_second_sensor · m2_m_continue_normal · m2_r_no_counteraction` | `m3_t_insufficient · m3_coa_contain_understand · m3_info_keep_restricted` | — / `maintain_ambiguous_pressure` |
| mixed_crisis_containment | probe / mixed / 59 | `m1_i_dedicated_ssa · m1_p_hold · m1_c_none` | `m2_a_second_sensor · m2_m_continue_normal · m2_r_private_warning` | `m3_t_insufficient · m3_coa_unilateral_strong · m3_info_public_partial` | — / `maintain_ambiguous_pressure` |

پایان نهم یک residual state واقعی است: confidence دیگر unresolved نیست، اما شروط پایان‌های severe، failure، fracture، de-escalation، calm، costly و information opportunity نیز هم‌زمان برقرار نشده‌اند.

## فایل‌ها و دلیل تغییر

- `adjudication/adjudicator.ts`: کالیبراسیون محدود writerهای Move 1 و اعمال واقعی تعارض تجاری.
- `adjudication/move2Adjudicator.ts`: تابع واحد و قابل‌آزمون برای deltaهای cause/source/quality/trust؛ حذف افزایش مصنوعی در unavailable/non-red.
- `adjudication/move3Adjudicator.ts`: فقط band و wording نمایشی confidence؛ resolver دست‌نخورده است.
- `scripts/exhaustive-s4-outcomes.ts`: histogram، صدک، پوشش threshold و تفکیک intent/cause با استفاده از production adjudicatorها.
- `scripts/validate-s4-attribution-confidence.mjs`: fixtureهای A تا G و یک مسیر کامل واقعی برای پایان نهم.
- `package.json`: افزودن تست confidence به regression سناریو ۴.

## شواهد تولیدشده

- baseline: `analysis/scenario4-confidence-before/summary.json` و `confidence-audit.json`
- after: `analysis/scenario4-confidence-after/summary.json` و `confidence-audit.json`
- robustness سه‌جهانی: `analysis/scenario4-confidence-after-worlds3/`

## مرز علمی/طراحی

> مقادیر confidence و thresholdها پارامترهای طراحی سناریو هستند و نباید به‌عنوان برآورد تجربی رفتار یا قابلیت واقعی ایران/اسرائیل معرفی شوند. هدف این کالیبراسیون، ایجاد یک طیف داخلی سازگار، قابل‌دستیابی و تحلیلی برای تصمیم‌گیری تحت عدم‌قطعیت است.
