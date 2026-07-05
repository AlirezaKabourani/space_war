import type { ScenarioDefinition } from "../../core/types/scenario";

export const S1_ShadowsInLowOrbit: ScenarioDefinition = {
  id: "s1_shadows_low_orbit",
  title: "۱ — سایه‌های مدار پایین",
  description:
    "اولین سناریوی تصمیم‌محور بازی جنگ فضایی؛ مدیریت پوشش اطلاعاتی، ابهام و ریسک تشدید تنش در مدار پایین.",
  start: "decisionSimulation",

  nodes: {
    decisionSimulation: {
      id: "decisionSimulation",
      type: "minigame",
      game: "s1_decision_simulation",
      next: "end",
    },

    end: {
      id: "end",
      type: "end",
      summaryText:
        "سناریو ۱ — سایه‌های مدار پایین به پایان رسید. شما در این مأموریت با رفتار مبهم یک ماهواره ناشناس، محدودیت منابع رصدی، ریسک تشدید تنش و خطر افشای اطلاعات روبه‌رو شدید و تصمیم‌های شما مسیر بحران را شکل داد. اکنون این مرحله کامل شده و آماده ورود به سناریو بعدی هستید: سناریو ۲ — امواج خاموش؛ جایی که نبرد از سطح مشاهده مداری فراتر می‌رود و به لایه ارتباطات، سیگنال‌ها و اختلالات پنهان کشیده می‌شود.",
    },
  },
};
