import type { ScenarioDefinition } from "../../core/types/scenario";

export const S2_SilentWaves: ScenarioDefinition = {
  id: "s2_silent_waves",
  title: "۲ — امواج خاموش",
  description:
    "شبیه‌ساز عملیاتی تاب‌آوری لجستیک تحت اخلال GNSS؛ مدیریت کاروان‌ها، منابع محدود، نقشه تاکتیکی و داده‌های متناقض.",
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
        "سناریو ۲ — امواج خاموش به پایان رسید. نتیجه مأموریت بر اساس پیوستگی لجستیک، سلامت ناوبری، مصرف منابع و کیفیت تصمیم‌گیری شما ثبت شد.",
    },
  },
};
