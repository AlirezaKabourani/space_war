import type { DecisionOption } from "../model/types";

export const intelCards = [
  {
    id: "E_BASE_01",
    title: "داده مداری",
    status: "تأییدشده",
    text:
      "R-31 طی دو پنجره اخیر نسبت به پروفایل تاریخی خود تغییر مسیر محدود نشان داده است.\nفاصله نسبی با A-17 در حال کاهش است.\nهیچ مسیر برخورد فوری ثبت نشده است.",
  },
  {
    id: "E_BASE_02",
    title: "مشخصات R-31",
    status: "تأییدشده",
    text:
      "R-31 رسماً یک دارایی خدماتی دوکاربردی معرفی شده است.\nقابلیت‌های اعلام‌شده:\n- بازرسی مداری\n- عملیات نزدیکی\n- سرویس فضایی\nهیچ اقدام خصمانه قبلی به‌طور قطعی به این دارایی منتسب نشده است.",
  },
  {
    id: "E_BASE_03",
    title: "تحلیل اولیه",
    status: "تحلیلی",
    text:
      "رفتار فعلی با بیش از یک فرضیه سازگار است.\nنیت R-31 هنوز قابل تعیین نیست.",
  },
  {
    id: "E_SSA_01",
    title: "تحلیل SSA اختصاصی",
    status: "تحلیلی",
    text:
      "تحلیل دقیق‌تر نشان می‌دهد تغییر مسیر R-31 عمدی بوده، اما از روی مسیر به‌تنهایی نمی‌توان نیت آن را تعیین کرد.",
  },
  {
    id: "E_COMM_CONFLICT_01",
    title: "اختلاف داده تجاری",
    status: "نیازمند بررسی",
    text:
      "داده تجاری کاهش فاصله را تأیید می‌کند، اما نرخ تغییر مسیر R-31 را کمتر از برآورد نظامی گزارش می‌دهد. علت اختلاف هنوز مشخص نیست.",
  },
];

export const informationOptions: DecisionOption[] = [
  {
    id: "m1_i_passive",
    label: "ادامه پایش موجود",
    description: "پایش فعلی ادامه یابد و منابع اضافی فعلاً مصرف نشود.",
    weights: {
      informationSeeking: -0.4,
      resourceDiscipline: 0.7,
      escalationSensitivity: 0.2,
    },
  },
  {
    id: "m1_i_dedicated_ssa",
    label: "افزایش SSA اختصاصی",
    description: "بخشی از ظرفیت رصدی برای پایش دقیق‌تر R-31 اختصاص یابد.",
    weights: {
      informationSeeking: 0.8,
      resourceDiscipline: -0.2,
      secondOrderThinking: 0.4,
    },
  },
  {
    id: "m1_i_commercial",
    label: "دریافت داده تجاری مستقل",
    description:
      "برای مقایسه با داده نظامی، از اپراتور تجاری داده ردیابی مستقل دریافت شود.",
    weights: {
      informationSeeking: 0.7,
      resourceDiscipline: 0.2,
      cognitiveFlexibility: 0.5,
    },
  },
  {
    id: "m1_i_allied_network",
    label: "درخواست شبکه متحدان",
    description:
      "از شبکه شریک/متحد برای رصد تکمیلی و تبادل محدود داده استفاده شود.",
    weights: {
      informationSeeking: 0.8,
      coalitionOrientation: 0.8,
      resourceDiscipline: -0.3,
      secondOrderThinking: 0.5,
    },
  },
];

export const protectionOptions: DecisionOption[] = [
  { id: "m1_p_hold", label: "بدون تغییر" },
  {
    id: "m1_p_covert_readiness",
    label: "افزایش آمادگی پنهان",
    description: "آمادگی داخلی افزایش یابد، بدون اقدام مداری آشکار.",
  },
  {
    id: "m1_p_visible_protection",
    label: "اقدام حفاظتی آشکار اما برگشت‌پذیر",
    description:
      "وضعیت حفاظتی A-17 به‌طور محدود و قابل مشاهده تغییر کند، بدون خروج از مأموریت اصلی.",
  },
  {
    id: "m1_p_mission_reposition",
    label: "تغییر محسوس وضعیت مأموریت",
    description:
      "برای افزایش فاصله یا کاهش ریسک، A-17 به‌صورت آشکار وضعیت عملیاتی خود را تغییر دهد.",
  },
];

export const communicationOptions: DecisionOption[] = [
  { id: "m1_c_none", label: "عدم ارسال پیام" },
  {
    id: "m1_c_private",
    label: "تماس خصوصی برای Deconfliction",
    description:
      "از کانال خصوصی درخواست توضیح و حفظ فاصله ایمن ارسال شود، بدون اتهام عمومی.",
  },
  { id: "m1_c_allies", label: "هماهنگی با متحدان" },
  {
    id: "m1_c_public_warning",
    label: "هشدار عمومی درباره رفتار ناایمن",
  },
  {
    id: "m1_c_private_allied",
    label: "پیام خصوصی + هماهنگی محدود متحدان",
  },
];

export const reasonOptions = [
  "کسب اطلاعات بیشتر",
  "حفاظت از A-17",
  "جلوگیری از تشدید",
  "نمایش عزم",
  "حفظ هماهنگی متحدان",
  "حفظ منابع",
  "سایر",
];
