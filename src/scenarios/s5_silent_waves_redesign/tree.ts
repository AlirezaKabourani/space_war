import type { ScenarioDefinition } from "../../core/types/scenario";

export const S5_SilentWavesRedesign: ScenarioDefinition = {
  id: "s5_silent_waves_redesign",
  title: "امواج خاموش — نسخه بازطراحی",
  description:
    "مأموریت ۸ راندی مدیریت کاروان‌ها تحت اختلال GNSS؛ کشف محل اختلال، طراحی مسیرهای امن، مدیریت منابع و مقابله با تهدید آشکار.",
  start: "decisionSimulation",
  nodes: {
    decisionSimulation: {
      id: "decisionSimulation",
      type: "minigame",
      game: "s5_gnss_logistics_simulation",
      next: "end",
    },
    end: {
      id: "end",
      type: "end",
      summaryText:
        "امواج خاموش — نسخه بازطراحی به پایان رسید. نتیجه مأموریت بر اساس وضعیت کاروان‌ها، شناسایی تهدید، کنترل ریسک کمین، مصرف منابع و پایداری شبکه ثبت شد.",
    },
  },
};