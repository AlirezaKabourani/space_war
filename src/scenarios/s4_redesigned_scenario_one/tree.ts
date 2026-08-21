import type { ScenarioDefinition } from "../../core/types/scenario";

export const S4_RedesignedScenarioOne: ScenarioDefinition = {
  id: "s4_redesigned_scenario_one",
  title: "۴ — حریم خاکستری مدار",
  description:
    "بازطراحی سناریو ۱ در جایگاه سناریو ۴؛ Move 1 تصمیم‌محور با actor مستقل، inject شرطی و snapshot قابل replay.",
  start: "redesignedScenarioOneMoveOne",
  nodes: {
    redesignedScenarioOneMoveOne: {
      id: "redesignedScenarioOneMoveOne",
      type: "minigame",
      game: "s4_redesigned_scenario_one_move1",
      next: "end",
    },
    end: {
      id: "end",
      type: "end",
      summaryText:
        "نسخه آزمایشی سناریو ۴ — حریم خاکستری مدار به پایان رسید. Move 1 با Snapshot قابل انتقال به Move 2 ذخیره شد.",
    },
  },
};
