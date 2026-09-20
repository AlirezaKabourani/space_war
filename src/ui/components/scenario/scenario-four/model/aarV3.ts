import type { Move2Snapshot, Move3Snapshot, MoveSnapshot } from "./types";

export interface OpponentObservationAARRow {
  moveId: "move_1" | "move_2" | "move_3";
  visibleToIsrael: string[];
  hiddenFromIsrael: string[];
}

export type OpponentObservationAAR = OpponentObservationAARRow[];

const addIf = (target: string[], condition: boolean, text: string) => {
  if (condition) target.push(text);
};

export const buildOpponentObservationAAR = ({
  move1Snapshot,
  move2Snapshot,
  move3Snapshot,
}: {
  move1Snapshot: MoveSnapshot;
  move2Snapshot: Move2Snapshot;
  move3Snapshot: Move3Snapshot;
}): OpponentObservationAAR => {
  const m1 = move1Snapshot.actorObservations.redObserved;
  const m2 = move2Snapshot.actorObservations.redObserved;
  const m3 = move3Snapshot.finalObservableSignal;

  const hasMove1Signal = m1.visibleProtection > 0 || m1.publicPressure > 0 || m1.privateCommunication || m1.coalitionSignal > 0;
  const visibleMove1: string[] = [hasMove1Signal ? "وضعیت عملیاتی آشکار A-17، دارایی فضایی ایران" : "ادامه وضعیت عادی A-17"];
  addIf(visibleMove1, m1.visibleProtection > 0, "افزایش وضعیت حفاظتی قابل مشاهده");
  addIf(visibleMove1, m1.visibleProtection <= 0, "نبود تغییر آشکار در وضعیت حفاظتی");
  addIf(visibleMove1, m1.publicPressure > 0, "هشدار یا فشار عمومی ایران");
  addIf(visibleMove1, m1.privateCommunication, "پیام خصوصی ایران");
  addIf(visibleMove1, !m1.publicPressure && !m1.privateCommunication, "نبود پیام عمومی یا خصوصی قابل مشاهده");
  addIf(visibleMove1, m1.coalitionSignal > 0, "سیگنال هماهنگی متحدان ایران");

  const visibleMove2: string[] = [];
  addIf(visibleMove2, m2.fallbackVisible > 0, "فعال‌شدن ظرفیت پشتیبان قابل مشاهده");
  addIf(visibleMove2, m2.missionReconfigurationVisible > 0, "بازآرایی محسوس مأموریت A-17");
  addIf(visibleMove2, m2.visibleProtection > 0, "افزایش وضعیت حفاظتی قابل مشاهده");
  addIf(visibleMove2, m2.privateCommunication, "پیام یا درخواست رسمی خصوصی ایران");
  addIf(visibleMove2, m2.publicPressure > 0, "فشار یا موضع عمومی ایران");
  addIf(visibleMove2, m2.coalitionSignal > 0, "سیگنال هماهنگی متحدان ایران");
  addIf(visibleMove2, m2.defensiveAuthoritySignal > 0, "نشانه آمادگی برای اختیار دفاعی");
  addIf(visibleMove2, m2.offRampSignal > 0, "پیشنهاد فاصله‌گذاری یا مسیر کاهش تنش");
  addIf(visibleMove2, m2.formalAccusationLevel > 0, "سطحی از اتهام رسمی");
  if (!visibleMove2.length) visibleMove2.push("ادامه مأموریت بدون تغییر محسوس");

  const visibleMove3: string[] = [];
  addIf(visibleMove3, m3.publicAttributionLevel > 0 && m3.publicAttributionLevel < 100, "انتشار عمومی بخشی از شواهد");
  addIf(visibleMove3, m3.publicAttributionLevel >= 100, "انتساب عمومی رخداد به اسرائیل");
  addIf(visibleMove3, m3.coalitionUnitySignal > 0, "سیگنال عمومی یا قابل مشاهده انسجام متحدان ایران");
  addIf(visibleMove3, m3.finalResolveSignal > 0, "نشانه قابل مشاهده عزم ایران");
  addIf(visibleMove3, m3.finalEscalationSignal > 0, "افزایش قابل مشاهده فشار تشدید");
  addIf(visibleMove3, m3.offRampSignal > 0, "پیشنهاد یا تداوم مسیر کاهش تنش");
  addIf(visibleMove3, move3Snapshot.redAction === "accept_interim_offramp", "پذیرش متقابل مسیر موقت کاهش تنش");
  addIf(visibleMove3, move3Snapshot.redAction === "deescalate_and_separate", "فاصله‌گذاری و کاهش تنش عملی اسرائیل");
  addIf(visibleMove3, m3.missionResilienceSignal > 4, "نشانه قابل مشاهده تاب‌آوری مأموریت");
  if (!visibleMove3.length) visibleMove3.push("نبود سیگنال عمومی تازه فراتر از وضعیت جاری مأموریت");

  return [
    {
      moveId: "move_1",
      visibleToIsrael: visibleMove1,
      hiddenFromIsrael: ["دلیل تصمیم", "زمان پاسخ", "برآوردهای داخلی", "پایش و تحلیل داخلی غیرقابل مشاهده"],
    },
    {
      moveId: "move_2",
      visibleToIsrael: visibleMove2,
      hiddenFromIsrael: [
        "برآورد احتمال نقش اسرائیل",
        "دلیل تصمیم",
        ...(move2Snapshot.decisions.some((item) => item.selectedOptionId === "m2_a_technical_diagnostics")
          ? ["بررسی و عیب‌یابی فنی داخلی"]
          : []),
      ],
    },
    {
      moveId: "move_3",
      visibleToIsrael: visibleMove3,
      hiddenFromIsrael: ["آستانه داخلی اقدام", "برآورد خصوصی اطمینان", "مرور داخلی شواهد", "دلیل تصمیم نهایی"],
    },
  ];
};
