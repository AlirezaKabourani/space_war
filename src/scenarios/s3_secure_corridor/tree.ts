import type { ScenarioDefinition } from "../../core/types/scenario";

export const S3_SecureCorridor: ScenarioDefinition = {
  id: "s3_secure_corridor",
  title: "۳ — کریدور امن",
  description:
    "Dungeon Crawl تاکتیکی برای پشتیبانی ماهواره‌ای از عبور یک محموله حساس از محوطه‌های عملیاتی ناشناخته.",
  start: "dungeonRunner",
  nodes: {
    dungeonRunner: {
      id: "dungeonRunner",
      type: "minigame",
      game: "s3_secure_corridor_dungeon",
      next: "end",
    },
    end: {
      id: "end",
      type: "end",
      summaryText:
        "سناریو ۳ — کریدور امن به پایان رسید. تصمیم‌های اسکن، حرکت، مصرف کارت و ارتقا برای داشبورد شناختی ثبت شد.",
    },
  },
};
