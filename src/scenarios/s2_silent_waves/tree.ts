import type { ScenarioDefinition } from "../../core/types/scenario";

export const S2_SilentWaves: ScenarioDefinition = {
  id: "s2_silent_waves",
  title: "۲ — امواج خاموش",
  description:
    "مأموریت ۸ راندی مدیریت کاروان‌ها تحت اختلال GNSS؛ کشف محل اختلال، طراحی مسیرهای امن، مدیریت منابع و مقابله با تهدید آشکار.",
  start: "decisionSimulation",
  nodes: {
    decisionSimulation: {
      id: "decisionSimulation",
      type: "minigame",
      game: "s2_gnss_logistics_simulation",
      next: "end",
    },
    end: {
      id: "end",
      type: "end",
      summaryText:
        "سناریو ۲ — امواج خاموش به پایان رسید. نتیجه مأموریت بر اساس وضعیت کاروان‌ها، شناسایی تهدید، کنترل ریسک کمین، مصرف منابع و پایداری شبکه ثبت شد.",
    },
  },
};
