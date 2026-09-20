import type { ScenarioDefinition } from "../../core/types/scenario";

export const S4_RedesignedScenarioOne: ScenarioDefinition = {
  id: "s4_redesigned_scenario_one",
  title: "۴ — حریم خاکستری مدار",
  description:
    "حریم خاکستری مدار؛ تمرین سه‌مرحله‌ای تصمیم‌گیری ایران در برابر رفتار مداری مبهم اسرائیل، اختلال بدون امضا و بحران انتساب.",
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
        "سناریو ۴ — حریم خاکستری مدار و تحلیل پس از اقدام آن به پایان رسید.",
    },
  },
};
