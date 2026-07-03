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
        "سناریو پایان یافت. جمع‌بندی سبک تصمیم‌گیری شما در همین مأموریت ثبت شد.",
    },
  },
};
