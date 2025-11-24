import type { ScenarioDefinition } from "../../core/types/scenario";

export const S1_ShadowsInLowOrbit: ScenarioDefinition = {
  id: "s1_shadows_low_orbit",
  title: "سایه‌های مدار پایین",
  description:
    "در این سناریو شما مسئول حفظ پوشش اطلاعاتی در مدار پایین هستید و باید با منابع محدود ISR تصمیم‌های صحیح بگیرید.",
  start: "intro",

  nodes: {
    intro: {
      id: "intro",
      type: "info",
      text:
        "ورود به سناریو: یک ماهواره مشکوک در مدار LEO رویت شده است. شما باید تصمیم بگیرید که منابع ISR را چگونه تخصیص دهید.",
      next: "q1",
    },

    q1: {
      id: "q1",
      type: "decision",
      question: "اولویت بررسی کدام بخش از منطقه عملیاتی است؟",
      options: [
        {
          id: "opt1",
          text: "منطقه غربی (فعالیت کم اما حساس)",
          next: "alloc1",
          cognitiveEffects: { situationalAwareness: +2 },
        },
        {
          id: "opt2",
          text: "منطقه شرقی (فعالیت سیگنالی بالا)",
          next: "alloc1",
          cognitiveEffects: { riskTaking: +1 },
        },
      ],
    },

    alloc1: {
      id: "alloc1",
      type: "allocation",
      instructions: "منابع ISR را بین بخش‌های مختلف تخصیص دهید.",
      resources: [
        { name: "satelliteISR", max: 3 },
        { name: "energy", max: 2 },
      ],
      next: "minigame1",
    },

    minigame1: {
      id: "minigame1",
      type: "minigame",
      game: "reaction",
      next: "end",
    },

    end: {
      id: "end",
      type: "end",
      summaryText:
        "سناریو پایان یافت. عملکرد شما بر اساس زمان تصمیم‌گیری و انتخاب‌های انجام‌شده محاسبه خواهد شد.",
    },
  },
};
