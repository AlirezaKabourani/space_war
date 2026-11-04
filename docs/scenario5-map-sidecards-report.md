# Scenario 2 — enlarged map with flanking convoy cards

PASS. ج و د در چپ نقشه؛ الف و ب در راست. کارت‌ها از زیر نقشه به دو ستون کناری منتقل شدند؛ متن، مقادیر و کنترل‌های هدف/شواهد حفظ شدند.

نسبت فضای اصلی نقشه به حالت بزرگ‌تر ۲:۳ برگشت. ردیف پایین حذف و فضای خالی افقی SVG کم شد؛ مختصات مسیرها، تصویر پایه و منطق حرکت تغییر نکردند.

- src/ui/components/scenario/ScenarioFiveMap.tsx
- src/ui/components/scenario/ScenarioFive.css

Typecheck / build / scoped ESLint: PASS. Nine genuine browser screenshots cover first decision, post-action and selected target at 1280×720, 1366×768 and 1440×900. Physical side placement, stable map geometry, larger actual SVG scale, canonical convoy values, no page overflow and hidden-truth firewall all pass.

All 63 frozen hashes match; all 876 pre-existing files outside the two presentation files are unchanged. Existing scientific/runtime/cognitive/legacy sources are untouched. The existing Vite chunk-size advisory remains.

Screenshots and inspection: scenario5-map-sidecards-screenshots/. Patch: scenario5-map-sidecards.patch (two application files only; reverse check PASS).
