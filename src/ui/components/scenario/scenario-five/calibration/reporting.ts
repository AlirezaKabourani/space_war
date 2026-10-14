import type { CalibrationSummary } from "./types";

const escapeCsv = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function toCsv(rows: readonly Readonly<Record<string, unknown>>[], headers?: readonly string[]): string {
  const columns = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  return `${columns.join(",")}\n${rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(",")).join("\n")}\n`;
}
export function buildPersianCalibrationReport(summary: CalibrationSummary): string {
  const failed = summary.hardGates.filter(({ status }) => status === "FAIL");
  const warnings = summary.warnings.filter(({ status }) => status === "WARNING");
  const list = (items: readonly { gateId: string; detail: string }[]) => items.length === 0 ? "- هیچ‌کدام" : items.map((item) => `- ${item.gateId}: ${item.detail}`).join("\n");
  return `# گزارش کالیبراسیون مهندسی فاز ۸ — سناریو ۵

## 1. خلاصه اجرایی

وضعیت نهایی audit: **${summary.overallStatus}**. این نتیجه فقط وضعیت gateهای مهندسی تعریف‌شده را گزارش می‌کند و هیچ پارامتر مدل را تغییر نداده است.

## 2. دامنه و محدودیت اعتبار

این audit از عامل‌های مصنوعی، جهان‌های کنترل‌شده و seedهای قطعی استفاده می‌کند. فراوانی جهان‌ها و seedها احتمال واقعی رخدادهای بیرونی نیست.

## 3. پوشش ۱۶ جهان و seedها

پنل پایه شامل ۱۶ جهان و seedهای ۱ تا ۶۴ است. جزئیات در summary JSON و CSV اجراها ثبت شده است.

## 4. پوشش Actionها و targetها

پوشش ۳۳ Action و targetهای قانونی در action-coverage.csv ثبت شده است.

## 5. پوشش شش End State

طبقه‌بندی مشاهده در audit اصلی یا witness search در end-state-coverage.csv ثبت شده است.

## 6. وضعیت منابع و forced-choice

توزیع گزینه‌های در دسترس، تک‌گزینه‌ای‌شدن و منابع پایانی با thresholdهای داخلی مهندسی غربال شدند.

## 7. تمرکز نتایج مأموریت

تمرکز End State در جمعیت M1..M7 و M10 بررسی شد؛ این توزیع احتمال واقعی نیست.

## 8. تمایز چهار Actor

چهار Actor بر اساس delay، containment، TV توزیع End State و اثر ثانویه مقایسه شدند.

## 9. حساسیت به seed

حساسیت در سلول‌های world×policy برای M1..M7 محاسبه شد و برآورد عدم‌قطعیت دنیای واقعی نیست.

## 10. آزمون Pareto dominance گزینه‌ها

مقایسه بدون امتیاز کل و با بردار چندبعدی outcome انجام شد.

## 11. تحلیل افق ۳۶۰ دقیقه

افق ۳۶۰ دقیقه همچنان یک پارامتر طراحی در انتظار بازبینی خبرگان است؛ جدول shadow فقط post-hoc است.

## 12. Shadow deadline sensitivity

deadlineها تغییر نکردند؛ shiftهای −۳۰ تا +۳۰ دقیقه فقط بازطبقه‌بندی post-hoc هستند.

## 13. Shadow resource path-feasibility

path-feasibility shadow analysis, not a full counterfactual replay. این جدول سازگاری سیاست با budget جدید را مدل نمی‌کند.

## 14. Random-policy OSI centering

عامل تصادفی C16 یک عامل مصنوعی است و فقط centering مهندسی OSI را می‌سنجد.

## 15. Cognitive anchor calibration

anchorهای C1..C15 ترتیب داخلی مورد انتظار loadingها و formulaهای frozen را بررسی می‌کنند.

## 16. Engineering distribution screen شاخص‌های شناختی

floor/ceiling/variance فقط engineering distribution screen است و اثر روان‌سنجی تلقی نمی‌شود.

## 17. Hidden-truth/outcome firewall

bundle شناختی بدون worldId، seed، End State یا domain output ساخته شد و paired fixtureها نتیجه برابر دادند.

## 18. فهرست Hard Gateها

${summary.hardGates.map((gate) => `- ${gate.gateId}: ${gate.status} — ${gate.detail}`).join("\n")}

## 19. فهرست Warningها

${list(warnings)}

## 20. موارد نیازمند تصمیم انسانی

${list([...failed, ...warnings])}

هر alternative توصیفی صرفاً برای تصمیم reviewer، نه تغییر خودکار است.

## 21. محدودیت‌های فاز ۸

- عامل‌های مصنوعی این فاز نماینده رفتار انسان نیستند.
- موفقیت در calibration مهندسی به معنی اعتبار روان‌سنجی نیست.
- پارامترهای زمان، هزینه، threshold و loadingها هنوز برای اعتبار نهایی به بازبینی خبرگان و اجرای انسانی نیاز دارند.
- Phase 8 هیچ پارامتر مدل را به‌صورت خودکار تغییر نمی‌دهد.
- این audit اعتبار خبرگی، construct validity، human usability یا احتمال دنیای واقعی را اثبات نمی‌کند.
`;
}
