# گزارش نهایی پاک‌سازی UX منابع سناریو ۴

## نتیجه

سه اصلاح محدود UX انجام شد: تناقض هزینه انتخاب فعلی حذف شد، برچسب سطح ۸۵ تا ۱۰۰ به «ظرفیت بالا» تغییر کرد، و هشدارهای کمبود منبع به زبان ذخیره و انعطاف آینده بازنویسی شدند. منطق اقتصادی منابع و همه مدل‌های تصمیم بدون تغییر باقی ماندند.

## علت باگ هزینه

بنر بالای پنجره تصمیم، هزینه آخرین تصمیم ثبت‌شده را از `resourceEvents` می‌خواند؛ اما projection پایین صفحه، گزینه فعلی را از Resource Engine محاسبه می‌کرد. در نقطه تصمیم ۸، آخرین تصمیم ثبت‌شده همان آستانه اقدام و بدون هزینه بود، در حالی که گزینه فعلی «کاهش تنش مذاکره‌شده» ۱۲ واحد سرمایه سیاسی هزینه داشت.

بنرهای stale از پنجره‌های تصمیم حذف شدند. اکنون `formatDirectResourceCost(selectedOptionId)` و `getResourceProjection(resources, selectedOptionId)` هر دو هزینه را از `getCertainResourceCosts(optionId)` و در نهایت `resourceConsequenceAudit` می‌گیرند. بنر پیش از انتخاب مخفی است و با تغییر انتخاب بدون state جداگانه به‌روز می‌شود.

## شواهد تصویری

- [قبل: تناقض «هزینه مستقیم منابع: ندارد»](screenshots/scenario4-resource-ux-final/before-1440x900-negotiated-deescalation.png)
- [بعد: هزینه سیاسی ۱۲- و projection از ۶۵ به ۵۳](screenshots/scenario4-resource-ux-final/after-1440x900-negotiated-deescalation.png)
- [منبع ۸۵ با برچسب «ظرفیت بالا»](screenshots/scenario4-resource-ux-final/after-1440x900-resource-label-85.png)
- [هشدار ورود به وضعیت بحرانی](screenshots/scenario4-resource-ux-final/after-1440x900-critical-warning.png)
- [گزینه disabled با پیام کمبود منبع](screenshots/scenario4-resource-ux-final/after-1440x900-insufficient-hard-block.png)

## آزمون‌ها

- `npm run build`: پاس
- `npm run test:s4-models`: پاس؛ شامل تمام مجموعه‌های مدل، Cognitive V3، روایت مراحل ۱ تا ۶، AAR/Brier، Attribution Confidence و ۱۴ بررسی منابع
- `npm run test:s4-resource-calibration`: پاس؛ ۱۴ بررسی
- Browser QA: پاس در ۱۹۲۰×۱۰۸۰، ۱۴۴۰×۹۰۰ و ۱۳۶۶×۷۶۸؛ همچنین ۱۶۰۰×۹۰۰ و ۱۲۸۰×۷۲۰
- ۹۰ screenshot در ۱۸ وضعیت؛ بدون overflow افقی، نشت شناسه داخلی یا افشای زودهنگام حقیقت پنهان

## تأیید محدوده تغییر

- Resource baseline بدون تغییر: ۸۵ / ۸۵ / ۸۵ / ۷۵، Profile A
- Resource costs بدون تغییر
- Recovery و recovery ceiling بدون تغییر
- feasibility و insufficient-resource blocking بدون تغییر
- Resource accounting و فرمول Resource Sustainability بدون تغییر
- End State resolver و توزیع پایان‌ها بدون تغییر
- Attribution Confidence بدون تغییر
- Brier/BSS بدون تغییر
- Cognitive V3 بدون تغییر
- hidden truth و actor logic بدون تغییر
