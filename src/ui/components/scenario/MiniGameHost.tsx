import { useMemo, useRef, useState } from "react";
import { eventLogger } from "../../../services/analytics/eventLogger";
import { Card } from "../common/Card";
import { ScenarioOneSimulation } from "./ScenarioOneSimulation";

type DecisionStylePreview =
  | "operational_preview"
  | "strategic_preview"
  | "balanced_preview"
  | "uncertain_preview";

type ConceptLabOption = {
  id: string;
  text: string;
  feedback: string;
  isCorrect?: boolean;
  effectRows?: Array<{ label: string; value: string }>;
  reactionId?: string;
  reactionText?: string;
  educationalTag?: string;
  informationType?: "trajectory" | "signal" | "behavior_history" | "no_more_info";
  conceptTag?: string;
  styleWeight?: number;
};

type ConceptLabCard = {
  id: string;
  title: string;
  narrative: string;
  question?: string;
  correctOptionId?: string;
  explanation: string;
  eventType:
    | "mini_game_concept_classification"
    | "mini_game_action_reaction"
    | "mini_game_information_choice"
    | "mini_game_integrated_concept";
  roundId: string;
  options: ConceptLabOption[];
};

type ConceptLabRound = {
  id: string;
  title: string;
  cards: ConceptLabCard[];
};

type ConceptLabResult = {
  cardId: string;
  roundId: string;
  selectedOptionId: string;
  isCorrect?: boolean;
  responseTimeMs: number;
  changedAnswerCount: number;
  openedExplanation: boolean;
  explanationTimeMs: number;
  conceptTag?: string;
  styleWeight?: number;
};

interface MiniGameHostProps {
  scenarioId: string | number;
  nodeId: string;
  game:
    | "reaction"
    | "memory"
    | "tracking"
    | "scenario0_concept_lab"
    | "s1_decision_simulation";
  userProfileId?: string;
  onComplete: () => void;
}

const MINI_GAME_ID = "scenario0_concept_lab";

const conceptLabRounds: ConceptLabRound[] = [
  {
    id: "round_1_classify_game_type",
    title: "راند ۱ — این موقعیت چه نوع بازی است؟",
    cards: [
      {
        id: "zero_sum_orbit_control",
        title: "کارت ۱",
        narrative:
          "دو بازیگر برای کنترل یک مسیر مداری محدود رقابت می‌کنند. اگر یکی کنترل را به‌دست آورد، دیگری آن را از دست می‌دهد.",
        correctOptionId: "zero_sum",
        explanation:
          "در این موقعیت، به رابطه‌ی منافع دو طرف دقت کن. ببین آیا کنترل این مسیر می‌تواند هم‌زمان برای هر دو بازیگر ممکن باشد یا نه. اگر یک بازیگر کنترل را به‌دست بیاورد، آیا طرف دیگر هنوز می‌تواند همان مزیت را داشته باشد؟\nبرای انتخاب بهتر، به این فکر کن که آیا مسئله بر سر «تقسیم‌پذیری» یک منبع است یا «رقابت مستقیم» بر سر منبعی محدود.",
        eventType: "mini_game_concept_classification",
        roundId: "round_1_classify_game_type",
        options: [
          {
            id: "zero_sum",
            text: "بازی جمع صفر",
            isCorrect: true,
            conceptTag: "بازی جمع صفر",
            feedback:
              "در این وضعیت، سود یک طرف تقریباً برابر با ضرر طرف دیگر است. به همین دلیل، این موقعیت نمونه‌ای از بازی جمع صفر است.",
          },
          {
            id: "non_zero_sum",
            text: "بازی مجموع‌غیرصفر",
            isCorrect: false,
            conceptTag: "بازی جمع صفر",
            feedback:
              "اینجا منفعت مشترک تعریف نشده است؛ کنترل مسیر برای یک طرف به از دست رفتن آن برای طرف دیگر وابسته است.",
          },
          {
            id: "complete_information",
            text: "بازی اطلاعات کامل",
            isCorrect: false,
            conceptTag: "بازی جمع صفر",
            feedback:
              "مسئله اصلی این کارت کامل بودن اطلاعات نیست؛ مسئله این است که برد یک طرف با باخت طرف دیگر گره خورده است.",
          },
          {
            id: "stable_cooperation",
            text: "همکاری پایدار",
            isCorrect: false,
            conceptTag: "بازی جمع صفر",
            feedback:
              "در این موقعیت همکاری پایدار دیده نمی‌شود، چون مسیر محدود است و کنترل یک طرف به زیان طرف مقابل تمام می‌شود.",
          },
        ],
      },
      {
        id: "non_zero_sum_debris_sharing",
        title: "کارت ۲",
        narrative:
          "دو کشور داده‌های رصدی خود را درباره زباله فضایی به اشتراک می‌گذارند تا احتمال برخورد با ماهواره‌های هر دو طرف کاهش یابد.",
        correctOptionId: "non_zero_sum",
        explanation:
          "در این موقعیت، فقط به رقابت دو کشور نگاه نکن. ببین آیا خطری وجود دارد که می‌تواند به هر دو طرف آسیب بزند. گاهی حتی بازیگرانی که رقیب هستند، در برابر یک ریسک مشترک می‌توانند منفعت هم‌زمان داشته باشند.\nبرای انتخاب بهتر، بررسی کن که آیا همکاری باعث می‌شود فقط یک طرف سود ببرد یا ریسک برای هر دو طرف کاهش پیدا می‌کند.",
        eventType: "mini_game_concept_classification",
        roundId: "round_1_classify_game_type",
        options: [
          {
            id: "zero_sum",
            text: "بازی جمع صفر",
            isCorrect: false,
            conceptTag: "بازی مجموع‌غیرصفر",
            feedback:
              "اینجا برد یک طرف الزاماً با باخت طرف دیگر همراه نیست؛ هر دو می‌توانند ریسک برخورد را کم کنند.",
          },
          {
            id: "non_zero_sum",
            text: "بازی مجموع‌غیرصفر",
            isCorrect: true,
            conceptTag: "بازی مجموع‌غیرصفر",
            feedback:
              "اینجا هر دو طرف می‌توانند سود ببرند. همکاری باعث کاهش ریسک برای هر دو می‌شود. این موقعیت نمونه‌ای از بازی مجموع‌غیرصفر است.",
          },
          {
            id: "direct_threat",
            text: "تهدید مستقیم",
            isCorrect: false,
            conceptTag: "بازی مجموع‌غیرصفر",
            feedback:
              "اشتراک داده برای کاهش ریسک، تهدید مستقیم نیست؛ بیشتر نمونه‌ای از همکاری محدود است.",
          },
          {
            id: "certain_failure",
            text: "شکست قطعی",
            isCorrect: false,
            conceptTag: "بازی مجموع‌غیرصفر",
            feedback:
              "هدف این اقدام کاهش احتمال شکست یا برخورد است، نه پذیرش شکست قطعی.",
          },
        ],
      },
      {
        id: "incomplete_information_unknown_object",
        title: "کارت ۳",
        narrative:
          "یک جسم ناشناس در مدار دیده شده است. هنوز مشخص نیست مأموریت آن علمی است، شناسایی است یا نظامی.",
        correctOptionId: "incomplete_information",
        explanation:
          "در این موقعیت، مسئله اصلی این نیست که چه کسی قوی‌تر است؛ مسئله این است که اطلاعات موجود کامل نیست. وقتی نیت، مأموریت یا ماهیت یک جسم مشخص نیست، تصمیم‌گیرنده باید با ابهام کار کند.\nبرای انتخاب بهتر، ببین آیا مشکل اصلی «تعارض منافع» است یا «نامشخص بودن وضعیت».",
        eventType: "mini_game_concept_classification",
        roundId: "round_1_classify_game_type",
        options: [
          {
            id: "zero_sum",
            text: "بازی جمع صفر",
            isCorrect: false,
            conceptTag: "اطلاعات ناقص",
            feedback:
              "ممکن است بعداً رقابت شکل بگیرد، اما در این لحظه مسئله اصلی ناشناخته بودن مأموریت جسم است.",
          },
          {
            id: "incomplete_information",
            text: "بازی اطلاعات ناقص",
            isCorrect: true,
            conceptTag: "اطلاعات ناقص",
            feedback:
              "در این وضعیت، مسئله اصلی این است که نیت و ماهیت بازیگر مقابل روشن نیست. این نمونه‌ای از تصمیم‌گیری در شرایط اطلاعات ناقص است.",
          },
          {
            id: "complete_cooperation",
            text: "همکاری کامل",
            isCorrect: false,
            conceptTag: "اطلاعات ناقص",
            feedback:
              "هنوز نشانه‌ای از همکاری کامل وجود ندارد؛ حتی ماهیت مأموریت جسم هم مشخص نیست.",
          },
          {
            id: "certain_equilibrium",
            text: "تعادل قطعی",
            isCorrect: false,
            conceptTag: "اطلاعات ناقص",
            feedback:
              "تعادل قطعی وقتی معنا دارد که وضعیت و انتخاب‌های طرف‌ها روشن‌تر باشد. اینجا عدم قطعیت غالب است.",
          },
        ],
      },
    ],
  },
  {
    id: "round_2_action_reaction",
    title: "راند ۲ — کنش و واکنش",
    cards: [
      {
        id: "action_reaction_satellite_approach",
        title: "کنش و واکنش",
        narrative:
          "یک ماهواره رقیب به محدوده‌ای نزدیک شده که برای مأموریت تو حساس است. هنوز رفتار آن خصمانه قطعی نیست.",
        question:
          "در بازی جنگ، تصمیم تو پایان ماجرا نیست. طرف مقابل تصمیم تو را می‌بیند، تفسیر می‌کند و پاسخ می‌دهد.",
        explanation:
          "در بازی جنگ، تصمیم تو معمولاً پایان ماجرا نیست. هر اقدام می‌تواند توسط طرف مقابل دیده، تفسیر و پاسخ داده شود.\nقبل از انتخاب، فقط به اثر فوری تصمیم فکر نکن؛ به این هم فکر کن که طرف مقابل ممکن است این تصمیم را نشانه‌ی تهدید، هشدار، ضعف، احتیاط یا آمادگی بداند.\nیک تصمیم خوب در بازی جنگ، هم اثر مستقیم دارد و هم پیام غیرمستقیم.",
        eventType: "mini_game_action_reaction",
        roundId: "round_2_action_reaction",
        options: [
          {
            id: "raise_alert",
            text: "افزایش فوری سطح آماده‌باش",
            feedback:
              "این تصمیم سریع و عملیاتی است. مزیت آن این است که آمادگی تو بالا می‌رود، اما ممکن است طرف مقابل این حرکت را نشانه تشدید تنش بداند.",
            reactionId: "opponent_activity_increased",
            reactionText:
              "طرف مقابل مسیر خود را کمی تغییر داد و سطح فعالیت ارتباطی‌اش افزایش یافت.",
            educationalTag: "action_reaction",
            styleWeight: -0.7,
            effectRows: [
              { label: "آمادگی عملیاتی", value: "افزایش" },
              { label: "ریسک تنش", value: "افزایش" },
              { label: "اطلاعات جدید", value: "بدون تغییر" },
            ],
          },
          {
            id: "collect_more_info",
            text: "جمع‌آوری اطلاعات بیشتر",
            feedback:
              "این تصمیم بر کاهش عدم قطعیت تمرکز دارد. مزیت آن این است که تصویر دقیق‌تری از وضعیت می‌سازی، اما ممکن است زمان واکنش سریع را از دست بدهی.",
            reactionId: "new_data_not_confirmed_threat",
            reactionText:
              "داده‌های جدید نشان داد مسیر جسم هنوز تهدید قطعی نیست.",
            educationalTag: "uncertainty",
            styleWeight: 0.4,
            effectRows: [
              { label: "پوشش اطلاعاتی", value: "افزایش" },
              { label: "آمادگی عملیاتی", value: "کمی کاهش" },
              { label: "ریسک تنش", value: "بدون تغییر" },
            ],
          },
          {
            id: "indirect_warning",
            text: "ارسال پیام هشدار غیرمستقیم",
            feedback:
              "این تصمیم نوعی سیگنال‌دهی است. بدون اقدام مستقیم، به طرف مقابل پیام می‌دهی که رفتار او دیده شده است. این انتخاب بین اقدام عملیاتی و مدیریت راهبردی تنش قرار دارد.",
            reactionId: "opponent_maneuver_slowed",
            reactionText:
              "طرف مقابل واکنش علنی نشان نداد، اما مانور خود را کندتر کرد.",
            educationalTag: "signaling",
            styleWeight: 0.2,
            effectRows: [
              { label: "ریسک تنش", value: "کمی افزایش" },
              { label: "کنترل پیام", value: "افزایش" },
              { label: "اطلاعات جدید", value: "کمی افزایش" },
            ],
          },
          {
            id: "observe_only",
            text: "بی‌عملی و مشاهده",
            feedback:
              "بی‌عملی هم یک تصمیم است. مزیت آن این است که فعلاً تنش ایجاد نمی‌کنی، اما ممکن است فرصت واکنش را از دست بدهی.",
            reactionId: "object_moved_closer",
            reactionText:
              "جسم ناشناس به محدوده حساس نزدیک‌تر شد و عدم قطعیت باقی ماند.",
            educationalTag: "inaction_cost",
            styleWeight: 0,
            effectRows: [
              { label: "ریسک تنش", value: "بدون تغییر" },
              { label: "ریسک غافلگیری", value: "افزایش" },
              { label: "منابع", value: "حفظ می‌شود" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "round_3_incomplete_information",
    title: "راند ۳ — اطلاعات ناقص",
    cards: [
      {
        id: "incomplete_information_data_choice",
        title: "انتخاب نوع اطلاعات",
        narrative:
          "درباره جسم ناشناس سه نوع داده می‌توانی جمع‌آوری کنی، اما زمان و ظرفیت محدود است. کدام را انتخاب می‌کنی؟",
        question:
          "داده‌های اولیه کافی نیست. تو فقط می‌توانی یک نوع اطلاعات تکمیلی بگیری.",
        explanation:
          "وقتی اطلاعات کامل نیست، همیشه سؤال اصلی این نیست که «چه اقدامی انجام بدهم؟» گاهی سؤال مهم‌تر این است که «کدام نوع اطلاعات می‌تواند تصمیم بعدی را بهتر کند؟»\nبعضی داده‌ها برای واکنش فوری مفیدترند، بعضی داده‌ها برای فهم مأموریت طرف مقابل، و بعضی داده‌ها برای شناخت الگوی رفتاری بلندمدت.\nقبل از انتخاب، مشخص کن که می‌خواهی تهدید نزدیک را بهتر بفهمی، مأموریت جسم را حدس بزنی، یا رفتار بازیگر مقابل را در تصویر بزرگ‌تری ببینی.",
        eventType: "mini_game_information_choice",
        roundId: "round_3_incomplete_information",
        options: [
          {
            id: "trajectory",
            text: "مسیر حرکتی دقیق جسم",
            feedback:
              "مسیر حرکتی برای تشخیص تهدید نزدیک مهم است. این داده برای تصمیم‌گیری عملیاتی مفید است.",
            informationType: "trajectory",
            educationalTag: "operational_information",
            conceptTag: "اطلاعات ناقص",
            styleWeight: -0.3,
          },
          {
            id: "signal",
            text: "نوع سیگنال‌های ارتباطی جسم",
            feedback:
              "سیگنال‌های ارتباطی می‌توانند درباره مأموریت جسم سرنخ بدهند. این داده برای کاهش عدم قطعیت مفید است.",
            informationType: "signal",
            educationalTag: "mission_inference",
            conceptTag: "اطلاعات ناقص",
            styleWeight: 0.2,
          },
          {
            id: "behavior_history",
            text: "سابقه رفتار قبلی بازیگر مقابل",
            feedback:
              "سابقه رفتار قبلی کمک می‌کند تصمیم فعلی را در یک الگوی بزرگ‌تر ببینی. این نگاه، مقدمه مدل‌سازی رفتار دشمن است.",
            informationType: "behavior_history",
            educationalTag: "adversary_modeling_intro",
            conceptTag: "مدل‌سازی رفتار دشمن",
            styleWeight: 0.6,
          },
          {
            id: "no_more_info",
            text: "هیچ داده‌ای لازم نیست؛ همین حالا تصمیم می‌گیرم",
            feedback:
              "تصمیم‌گیری بدون داده تکمیلی ممکن است سریع باشد، اما خطر خطای تشخیص را بالا می‌برد.",
            informationType: "no_more_info",
            educationalTag: "premature_decision",
            conceptTag: "اطلاعات ناقص",
            styleWeight: -0.6,
          },
        ],
      },
    ],
  },
  {
    id: "round_4_integrated_concepts",
    title: "راند ۴ — جمع‌بندی مفاهیم",
    cards: [
      {
        id: "integrated_space_wargame_concepts",
        title: "موقعیت ترکیبی",
        narrative:
          "یک ماهواره ناشناس در حال نزدیک شدن به یک محدوده حساس است. اگر واکنش شدید نشان بدهی، ممکن است بحران تشدید شود. اگر همکاری محدودی برای اشتراک داده انجام دهی، احتمال سوءبرداشت کم می‌شود، اما بخشی از توان رصدی تو آشکار می‌شود.",
        question: "در این موقعیت، کدام مفاهیم هم‌زمان دیده می‌شوند؟",
        correctOptionId: "incomplete_information_action_reaction_limited_cooperation",
        explanation:
          "در موقعیت‌های واقعی بازی جنگ، معمولاً فقط یک مفهوم فعال نیست. ممکن است هم‌زمان با ابهام اطلاعاتی، خطر تشدید تنش، امکان همکاری محدود، و واکنش احتمالی طرف مقابل روبه‌رو باشی.\nبرای انتخاب بهتر، به جای اینکه فقط دنبال یک برچسب ساده بگردی، بررسی کن چند لایه در موقعیت وجود دارد:\nآیا اطلاعات کامل است؟ آیا طرف مقابل به تصمیم تو واکنش نشان می‌دهد؟ آیا رقابت کامل است یا امکان کاهش ریسک مشترک هم وجود دارد؟",
        eventType: "mini_game_integrated_concept",
        roundId: "round_4_integrated_concepts",
        options: [
          {
            id: "only_zero_sum",
            text: "فقط بازی جمع صفر",
            isCorrect: false,
            conceptTag: "مفاهیم ترکیبی",
            feedback:
              "این پاسخ بخشی از مسئله را می‌بیند، اما همه تصویر را نه. در بازی جنگ فضایی معمولاً چند مفهوم هم‌زمان فعال‌اند: اطلاعات ناقص، رفتار طرف مقابل، ریسک تشدید تنش و امکان همکاری محدود.",
          },
          {
            id: "only_non_zero_sum",
            text: "فقط بازی مجموع‌غیرصفر",
            isCorrect: false,
            conceptTag: "مفاهیم ترکیبی",
            feedback:
              "این پاسخ همکاری محدود را می‌بیند، اما عدم قطعیت و کنش‌ـواکنش را نادیده می‌گیرد.",
          },
          {
            id: "incomplete_information_action_reaction_limited_cooperation",
            text: "اطلاعات ناقص + کنش و واکنش + امکان همکاری محدود",
            isCorrect: true,
            conceptTag: "مفاهیم ترکیبی",
            feedback:
              "در بازی جنگ فضایی، موقعیت‌ها معمولاً فقط یک مفهوم ساده نیستند. این مثال هم اطلاعات ناقص دارد، هم کنش و واکنش، هم امکان همکاری محدود برای کاهش ریسک. به همین دلیل بازی جنگ به ما کمک می‌کند پیامدهای چندلایه تصمیم‌ها را ببینیم.",
          },
          {
            id: "technical_only",
            text: "هیچ‌کدام؛ این فقط یک مسئله فنی است",
            isCorrect: false,
            conceptTag: "مفاهیم ترکیبی",
            feedback:
              "مسئله فنی هست، اما فقط فنی نیست؛ تصمیم تو پیامد راهبردی و رفتاری هم دارد.",
          },
        ],
      },
    ],
  },
];

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, item) => sum + item, 0) / values.length : 0;

const getDecisionStylePreview = (weights: number[]): DecisionStylePreview => {
  if (weights.length === 0) return "uncertain_preview";
  const previewScore = average(weights);
  if (previewScore <= -0.35) return "operational_preview";
  if (previewScore >= 0.35) return "strategic_preview";
  if (Math.abs(previewScore) < 0.35) return "balanced_preview";
  return "uncertain_preview";
};

const getNow = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export const MiniGameHost = ({
  scenarioId,
  nodeId,
  game,
  userProfileId,
  onComplete,
}: MiniGameHostProps) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confirmedOptionId, setConfirmedOptionId] = useState<string | null>(null);
  const [isConfidencePromptVisible, setIsConfidencePromptVisible] = useState(false);
  const [changedAnswerCount, setChangedAnswerCount] = useState(0);
  const [openedExplanation, setOpenedExplanation] = useState(false);
  const [explanationVisible, setExplanationVisible] = useState(false);
  const [explanationTimeMs, setExplanationTimeMs] = useState(0);
  const [results, setResults] = useState<ConceptLabResult[]>([]);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const cardStartedAtRef = useRef(getNow());
  const explanationOpenedAtRef = useRef<number | null>(null);

  const currentRound = conceptLabRounds[roundIndex];
  const currentCard = currentRound?.cards[cardIndex];
  const selectedOption = currentCard?.options.find((opt) => opt.id === selectedOptionId);

  const summary = useMemo(() => {
    const scored = results.filter((item) => typeof item.isCorrect === "boolean");
    const correct = scored.filter((item) => item.isCorrect).length;
    const conceptAccuracy =
      scored.length > 0 ? Math.round((correct / scored.length) * 100) : 0;
    const avgResponseTimeMs = Math.round(average(results.map((item) => item.responseTimeMs)));
    const totalChangedAnswerCount = results.reduce(
      (sum, item) => sum + item.changedAnswerCount,
      0
    );
    const explanationOpenCount = results.filter((item) => item.openedExplanation).length;
    const explanationOpenRate =
      results.length > 0 ? Math.round((explanationOpenCount / results.length) * 100) : 0;
    const avgExplanationTimeMs = Math.round(
      average(
        results
          .filter((item) => item.openedExplanation)
          .map((item) => item.explanationTimeMs)
      )
    );
    const conceptStats = new Map<string, { total: number; correct: number }>();
    for (const item of results) {
      if (!item.conceptTag || typeof item.isCorrect !== "boolean") continue;
      const stat = conceptStats.get(item.conceptTag) ?? { total: 0, correct: 0 };
      stat.total += 1;
      if (item.isCorrect) stat.correct += 1;
      conceptStats.set(item.conceptTag, stat);
    }
    const conceptRows = Array.from(conceptStats.entries()).map(([concept, stat]) => ({
      concept,
      accuracy: stat.total > 0 ? stat.correct / stat.total : 0,
      total: stat.total,
    }));
    const strongestConcept =
      conceptRows.sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0]
        ?.concept ?? "مفاهیم پایه";
    const weakestConcept =
      conceptRows.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0]
        ?.concept ?? "مفاهیم ترکیبی";
    const decisionStylePreview = getDecisionStylePreview(
      results
        .map((item) => item.styleWeight)
        .filter((weight): weight is number => typeof weight === "number")
    );

    return {
      correct,
      scoredCount: scored.length,
      conceptAccuracy,
      avgResponseTimeMs,
      totalChangedAnswerCount,
      explanationOpenCount,
      explanationOpenRate,
      avgExplanationTimeMs,
      strongestConcept,
      weakestConcept,
      decisionStylePreview,
    };
  }, [results]);

  const closeExplanationTimer = () => {
    if (explanationOpenedAtRef.current == null) return explanationTimeMs;
    const elapsed = getNow() - explanationOpenedAtRef.current;
    explanationOpenedAtRef.current = null;
    const next = explanationTimeMs + elapsed;
    setExplanationTimeMs(next);
    return next;
  };

  const resetCardState = () => {
    setSelectedOptionId(null);
    setConfirmedOptionId(null);
    setIsConfidencePromptVisible(false);
    setChangedAnswerCount(0);
    setOpenedExplanation(false);
    setExplanationVisible(false);
    setExplanationTimeMs(0);
    explanationOpenedAtRef.current = null;
    cardStartedAtRef.current = getNow();
  };

  const logSummary = (finalResults: ConceptLabResult[]) => {
    const scored = finalResults.filter((item) => typeof item.isCorrect === "boolean");
    const correct = scored.filter((item) => item.isCorrect).length;
    const explanationOpenCount = finalResults.filter((item) => item.openedExplanation).length;
    const conceptStats = new Map<string, { total: number; correct: number }>();
    for (const item of finalResults) {
      if (!item.conceptTag || typeof item.isCorrect !== "boolean") continue;
      const stat = conceptStats.get(item.conceptTag) ?? { total: 0, correct: 0 };
      stat.total += 1;
      if (item.isCorrect) stat.correct += 1;
      conceptStats.set(item.conceptTag, stat);
    }
    const conceptRows = Array.from(conceptStats.entries()).map(([concept, stat]) => ({
      concept,
      accuracy: stat.total > 0 ? stat.correct / stat.total : 0,
      total: stat.total,
    }));
    const strongestConcept =
      conceptRows.slice().sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0]
        ?.concept ?? "مفاهیم پایه";
    const weakestConcept =
      conceptRows.slice().sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0]
        ?.concept ?? "مفاهیم ترکیبی";

    eventLogger.log({
      type: "mini_game_summary",
      scenarioId,
      nodeId,
      detail: {
        eventType: "mini_game_summary",
        scenarioId: "scenario_0",
        miniGameId: MINI_GAME_ID,
        totalRounds: 4,
        conceptAccuracy:
          scored.length > 0 ? Math.round((correct / scored.length) * 100) : 0,
        avgResponseTimeMs: Math.round(
          average(finalResults.map((item) => item.responseTimeMs))
        ),
        totalChangedAnswerCount: finalResults.reduce(
          (sum, item) => sum + item.changedAnswerCount,
          0
        ),
        explanationOpenRate:
          finalResults.length > 0
            ? Math.round((explanationOpenCount / finalResults.length) * 100)
            : 0,
        avgExplanationTimeMs: Math.round(
          average(
            finalResults
              .filter((item) => item.openedExplanation)
              .map((item) => item.explanationTimeMs)
          )
        ),
        strongestConcept,
        weakestConcept,
        decisionStylePreview: getDecisionStylePreview(
          finalResults
            .map((item) => item.styleWeight)
            .filter((weight): weight is number => typeof weight === "number")
        ),
        completedAt: new Date().toISOString(),
      },
    });
  };

  if (game === "s1_decision_simulation") {
    return (
      <ScenarioOneSimulation
        scenarioId={scenarioId}
        nodeId={nodeId}
        userProfileId={userProfileId}
        onComplete={onComplete}
      />
    );
  }

  if (game !== "scenario0_concept_lab") {
    return (
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ margin: 0 }}>مینی‌گیم</h2>
          <p style={{ margin: 0, lineHeight: 1.8 }}>
            این مینی‌گیم هنوز برای این سناریو پیاده‌سازی نشده است.
          </p>
          <button onClick={onComplete}>ادامه</button>
        </div>
      </Card>
    );
  }

  if (!hasStarted) {
    return (
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ margin: 0 }}>تمرین کوتاه: آزمایشگاه مفاهیم بازی جنگ</h2>
          <p style={{ margin: 0, lineHeight: 1.9 }}>
            تا اینجا با چند مفهوم پایه آشنا شدی. حالا در یک تمرین کوتاه،
            همان مفاهیم را در چند موقعیت ساده تجربه می‌کنی. این تمرین آزمون
            سخت نیست؛ هدفش این است که ببینی هر تصمیم در بازی جنگ چگونه معنا
            پیدا می‌کند.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={() => {
                setHasStarted(true);
                cardStartedAtRef.current = getNow();
                eventLogger.log({
                  type: "mini_game_start",
                  scenarioId,
                  nodeId,
                  detail: {
                    miniGameId: MINI_GAME_ID,
                    totalRounds: 4,
                  },
                });
              }}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-purple))",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              شروع آزمایش
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (isSummaryVisible) {
    const reviewText =
      summary.weakestConcept === summary.strongestConcept
        ? "عملکرد تو در تشخیص مفاهیم پایه ثبت شد. برای تثبیت بهتر، موقعیت‌های ترکیبی را دوباره مرور کن."
        : `عملکرد تو در تشخیص مفاهیم پایه خوب بود. مفهوم «${summary.strongestConcept}» بهتر تشخیص داده شد، اما «${summary.weakestConcept}» نیاز به مرور بیشتری دارد.`;
    const explanationText =
      summary.explanationOpenCount > 0
        ? "تو قبل از بعضی تصمیم‌ها توضیح بیشتر را بررسی کردی. این رفتار در مراحل بعدی بازی جنگ می‌تواند به کاهش خطای تصمیم‌گیری کمک کند."
        : "در این اجرا کمتر از توضیح بیشتر استفاده شد. در سناریوهای بعدی، بررسی اطلاعات تکمیلی می‌تواند کیفیت تصمیم را بهتر کند.";

    return (
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <h2 style={{ margin: 0 }}>جمع‌بندی آزمایشگاه</h2>
          <p style={{ margin: 0, lineHeight: 1.9 }}>
            در این تمرین دیدی که بازی جنگ فقط انتخاب یک گزینه درست نیست. هر
            تصمیم می‌تواند واکنش طرف مقابل را تغییر دهد، اطلاعات همیشه کامل
            نیست، و بعضی موقعیت‌ها نه کاملاً رقابتی‌اند و نه کاملاً
            همکاری‌محور.
          </p>
          <div style={{ display: "grid", gap: "0.5rem", lineHeight: 1.8 }}>
            <span>• در بازی جمع صفر، سود یک طرف معمولاً به زیان طرف دیگر وابسته است.</span>
            <span>• در بازی مجموع‌غیرصفر، گاهی همکاری محدود می‌تواند ریسک را برای همه کم کند.</span>
            <span>• در بازی جنگ فضایی، اطلاعات ناقص و رفتار طرف مقابل بخش اصلی مسئله‌اند.</span>
          </div>
          <div
            style={{
              border: "1px solid var(--border-soft)",
              borderRadius: "14px",
              padding: "1rem",
              background: "rgba(15, 23, 42, 0.65)",
              display: "grid",
              gap: "0.45rem",
              lineHeight: 1.8,
            }}
          >
            <strong>گزارش آموزشی کوتاه</strong>
            <span>
              مفاهیم درست تشخیص داده‌شده: {summary.correct} از {summary.scoredCount}
            </span>
            <span>مفهوم بهتر فهمیده‌شده: {summary.strongestConcept}</span>
            <span>مفهوم نیازمند مرور: {summary.weakestConcept}</span>
            <span>میانگین زمان تصمیم‌گیری: {Math.round(summary.avgResponseTimeMs / 1000)} ثانیه</span>
            <span>تعداد استفاده از توضیح بیشتر: {summary.explanationOpenCount}</span>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-dim)" }}>
              {reviewText}
            </p>
            <p style={{ margin: 0, color: "var(--text-dim)" }}>{explanationText}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={onComplete}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-purple))",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ادامه به مرحله بعد
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!currentRound || !currentCard) return null;

  const handleSelect = (optionId: string) => {
    if (confirmedOptionId) return;
    if (selectedOptionId && selectedOptionId !== optionId) {
      setChangedAnswerCount((prev) => prev + 1);
    }
    setSelectedOptionId(optionId);
  };

  const openExplanationAfterUncertainty = () => {
    setIsConfidencePromptVisible(false);
    setOpenedExplanation(true);
    setExplanationVisible(true);
    if (explanationOpenedAtRef.current == null) {
      explanationOpenedAtRef.current = getNow();
    }
  };

  const handleConfirm = () => {
    if (!selectedOption) return;
    setIsConfidencePromptVisible(true);
  };

  const advanceAfterFinalAnswer = (finalResults: ConceptLabResult[]) => {
    const nextCardIndex = cardIndex + 1;
    if (nextCardIndex < currentRound.cards.length) {
      setCardIndex(nextCardIndex);
      resetCardState();
      return;
    }

    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex < conceptLabRounds.length) {
      setRoundIndex(nextRoundIndex);
      setCardIndex(0);
      resetCardState();
      return;
    }

    logSummary(finalResults);
    setIsSummaryVisible(true);
  };

  const finalizeAnswer = () => {
    if (!currentCard || !selectedOption) return;
    const finalExplanationTimeMs = closeExplanationTimer();
    setExplanationVisible(false);
    setIsConfidencePromptVisible(false);
    setConfirmedOptionId(selectedOption.id);
    const responseTimeMs = Math.round(getNow() - cardStartedAtRef.current);
    const isCorrect =
      typeof selectedOption.isCorrect === "boolean"
        ? selectedOption.isCorrect
        : currentCard.correctOptionId
          ? selectedOption.id === currentCard.correctOptionId
          : undefined;

    const result: ConceptLabResult = {
      cardId: currentCard.id,
      roundId: currentCard.roundId,
      selectedOptionId: selectedOption.id,
      isCorrect,
      responseTimeMs,
      changedAnswerCount,
      openedExplanation,
      explanationTimeMs: Math.round(finalExplanationTimeMs),
      conceptTag: selectedOption.conceptTag,
      styleWeight: selectedOption.styleWeight,
    };

    const finalResults = [...results, result];
    setResults(finalResults);
    eventLogger.log({
      type: currentCard.eventType,
      scenarioId,
      nodeId,
      elapsedMs: responseTimeMs,
      detail: {
        eventType: currentCard.eventType,
        scenarioId: "scenario_0",
        miniGameId: MINI_GAME_ID,
        roundId: currentCard.roundId,
        cardId: currentCard.id,
        selectedOptionId: selectedOption.id,
        correctOptionId: currentCard.correctOptionId,
        isCorrect,
        responseTimeMs,
        changedAnswerCount,
        openedExplanation,
        explanationTimeMs: Math.round(finalExplanationTimeMs),
        simulatedOpponentReactionId: selectedOption.reactionId,
        educationalTag: selectedOption.educationalTag,
        informationTypeSelected: selectedOption.informationType,
        conceptTag: selectedOption.conceptTag,
      },
    });
    advanceAfterFinalAnswer(finalResults);
  };

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div>
          <div style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
            {roundIndex + 1} / {conceptLabRounds.length}
            {currentRound.cards.length > 1 ? ` — کارت ${cardIndex + 1} از ${currentRound.cards.length}` : ""}
          </div>
          <h2 style={{ margin: 0 }}>{currentRound.title}</h2>
          <h3 style={{ margin: "0.8rem 0 0.35rem" }}>{currentCard.title}</h3>
          {currentCard.question && (
            <p style={{ margin: "0 0 0.6rem", color: "var(--text-dim)", lineHeight: 1.8 }}>
              {currentCard.question}
            </p>
          )}
          <p style={{ margin: 0, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
            {currentCard.narrative}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {currentCard.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isConfirmed = confirmedOptionId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={Boolean(confirmedOptionId)}
                style={{
                  padding: "0.7rem 1rem",
                  borderRadius: "12px",
                  border: isSelected
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border-soft)",
                  background: isConfirmed
                    ? "rgba(56, 189, 248, 0.18)"
                    : isSelected
                      ? "rgba(56, 189, 248, 0.12)"
                      : "rgba(15, 23, 42, 0.9)",
                  color: "var(--text-main)",
                  textAlign: "right",
                  cursor: confirmedOptionId ? "default" : "pointer",
                  lineHeight: 1.8,
                }}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={handleConfirm}
            disabled={!selectedOptionId}
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "999px",
              border: "none",
              background: !selectedOptionId
                ? "rgba(148, 163, 184, 0.3)"
                : "linear-gradient(135deg, var(--accent), var(--accent-purple))",
              color: "#fff",
              cursor: selectedOptionId ? "pointer" : "not-allowed",
            }}
          >
            تأیید
          </button>
        </div>

        {explanationVisible && (
          <div
            style={{
              border: "1px solid var(--border-soft)",
              borderRadius: "12px",
              padding: "0.85rem",
              background: "rgba(2, 6, 23, 0.45)",
              lineHeight: 1.9,
            }}
          >
            {currentCard.explanation}
          </div>
        )}

        {isConfidencePromptVisible && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2100,
              background: "rgba(2, 6, 23, 0.68)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div
              style={{
                width: "min(420px, 100%)",
                border: "1px solid var(--border-soft)",
                borderRadius: "16px",
                background: "rgba(15, 23, 42, 0.98)",
                padding: "1rem",
                boxShadow: "0 20px 60px rgba(2, 6, 23, 0.5)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3 style={{ margin: 0 }}>آیا از پاسخ خود اطمینان دارید؟</h3>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  onClick={finalizeAnswer}
                  style={{
                    padding: "0.55rem 1.1rem",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-purple))",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  بله
                </button>
                <button
                  onClick={openExplanationAfterUncertainty}
                  style={{
                    padding: "0.55rem 1.1rem",
                    borderRadius: "999px",
                    border: "1px solid var(--border-soft)",
                    background: "rgba(15, 23, 42, 0.75)",
                    color: "var(--text-main)",
                    cursor: "pointer",
                  }}
                >
                  خیر (توضیحات بیشتر)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
