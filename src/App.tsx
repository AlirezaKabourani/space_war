import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

import { ScenarioRunner } from "./ui/components/scenario/ScenarioRunner";
import { AllScenarios, type ScenarioId } from "./scenarios";
import { eventLogger } from "./services/analytics/eventLogger";
import scenario2IntroBackground from "../assets/s2/A1.png";

type ProfileRole = "admin" | "player";


interface Profile {
  id: string;
  name: string;
  role: ProfileRole;
  progress: number; // برای player: ایندکس سناریوی بعدی که باز است
}

interface Scenario {
  id: number;
  title: string;
  introTitle?: string;
  summary: string;
  fullDescription?: string;
  descriptionPreview?: string;
  introText?: string;
  introBackgroundImage?: string;
  image?: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface UserAnalyticsSummary {
  userId: string;
  userName: string;
  role: string;
  totalEvents: number;
  scenarioStarts: number;
  scenarioEnds: number;
  scenarioExits: number;
  questionsAnswered: number;
  avgScenarioDurationSec: number;
  lastActivityTs: number;
}

interface UserAnalyticsInsights {
  totalQuestions: number;
  answeredQuestions: number;
  scoredAnswers: number;
  correctAnswers: number;
  correctAnswerRate: number;
  avgThinkingMs: number;
  referenceClicks: number;
  descriptionReadSec: number;
  referenceReadSec: number;
  avgScenarioDurationSec: number;
  scenarioRuns: number;
  eventTypeCounts: Array<{ type: string; count: number }>;
  questionThinking: Array<{ question: string; ms: number }>;
  questionTimeline: Array<{ label: string; ms: number }>;
}

interface CognitiveDomainScore {
  domain: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface CognitiveInsights {
  overallAccuracy: number;
  decisionSpeedSec: number;
  hesitationRate: number;
  answerChangeRate: number;
  successfulRevisionRate: number;
  referenceUsageRate: number;
  explanationUsageRate: number;
  avgExplanationSec: number;
  guidanceBenefitScore: number;
  overconfidenceErrorRate: number;
  productiveHesitationRate: number;
  conceptFrictionScore: number;
  unfinishedExitRate: number;
  estimatedCognitiveLoad: number;
  styleLabel: string;
  speedAccuracyQuadrant: string;
  domainScores: CognitiveDomainScore[];
  frequentErrors: Array<{ nodeId: string; wrongCount: number }>;
}

const clampDashboardValue = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const OperationalStrategicScale = ({ value }: { value: number }) => {
  const markerPosition = clampDashboardValue(((value + 1) / 2) * 100, 0, 100);
  return (
    <div
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: "14px",
        padding: "1rem",
        background: "rgba(15, 23, 42, 0.65)",
        marginTop: "0.8rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.65rem" }}>
        <strong>طیف عملیاتی–راهبردی</strong>
        <span>{value.toFixed(2)}</span>
      </div>
      <div
        style={{
          position: "relative",
          height: "18px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, #ef4444 0%, #f59e0b 36%, #22c55e 50%, #38bdf8 64%, #6366f1 100%)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-7px",
            left: `${markerPosition}%`,
            width: "4px",
            height: "32px",
            borderRadius: "999px",
            background: "#fff",
            transform: "translateX(-50%)",
            boxShadow: "0 0 16px rgba(255,255,255,0.85)",
          }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.65rem", fontSize: "0.85rem", color: "var(--text-muted)", direction: "ltr" }}>
        <span style={{ textAlign: "left" }}>عملیاتی (1-)</span>
        <span style={{ textAlign: "center" }}>ترکیبی (0)</span>
        <span style={{ textAlign: "right" }}>راهبردی (1+)</span>
      </div>
    </div>
  );
};

const SCENARIO_QUESTIONS: Record<number, Question[]> = {
  0: [
    {
      id: "q1",
      text: "در این سناریو اولین اقدام شما برای حفظ پوشش اطلاعاتی چه خواهد بود؟",
      options: [
        "افزایش تعداد ماهواره‌های فعال بدون تحلیل وضعیت",
        "تحلیل الگوی حرکت ماهواره‌های دشمن و تنظیم مجدد مدار",
        "خاموش کردن تمام حسگرها برای کاهش ریسک کشف"
      ]
    },
    {
      id: "q2",
      text: "اگر یک لینک ارتباطی در آستانه اخلال باشد، کدام اقدام منطقی‌تر است؟",
      options: [
        "قطع کامل ارتباط تا اطلاع ثانوی",
        "تغییر مسیر ترافیک به لینک پشتیبان و مانیتورینگ لینک اصلی",
        "نادیده گرفتن اخطار تا زمان قطع ارتباط"
      ]
    }
  ],
  // برای بقیه سناریوها فعلاً یک سوال فرضی:
  1: [
    {
      id: "q1",
      text: "در سایه‌های مدار پایین هدف اصلی شما چیست؟",
      options: [
        "کاهش تعداد ماهواره‌ها",
        "حفظ اشراف اطلاعاتی پایدار",
        "خاموش‌کردن تمام لینک‌های ارتباطی"
      ]
    }
  ]
  // می‌توانی بعداً بقیه را اضافه کنی
};

const SCENARIO_TREE_IDS: Partial<Record<number, ScenarioId>> = {
  0: "s0_gateway_space_wargaming",
  1: "s1_shadows_low_orbit",
  2: "s2_silent_waves",
  // بقیه فعلاً درخت ندارند
};


type View =
  | "mainMenu"
  | "scenarioList"
  | "scenarioPlay"
  | "profileManager"
  | "adminAnalytics";

const SCENARIOS: Scenario[] = [
  {
    id: 0,
    title: "آستانه ورود",
    summary: "یک مأموریت ساده و آزمایشی برای آشنایی با محیط تصمیم‌گیری.",
    image: "/images/scenario0.png",
    fullDescription: `پیش از آنکه قدم در میدان نبرد فضایی بگذارید، باید چشمانتان را به جهانی باز کنید که تصمیم‌ها در آن خطی نیستند؛ هر انتخاب شما، پاسخی از سوی بازیگر مقابل می‌آفریند، و هر حرکت، تنها بخشی از حقیقت را آشکار می‌کند.
در «آستانه ورود»، شما در آستانه سفری قرار دارید که فرماندهان فضایی و تحلیلگران امنیتی سال‌ها برای آن تمرین می‌کنند: درک چگونگی فکر کردن در فضای بازی جنگ.
همه‌چیز از یک مرکز شبیه‌سازی آغاز می‌شود؛ جایی که هنوز خبری از ماهواره‌های واقعی، تهدیدات ناشناس یا آشوب‌های مدار پایین نیست. در اینجا محیطی کنترل‌شده و آرام پیش روی شماست؛ اما همین سکوت، مقدمه دنیایی است که در آن هر تصمیم، سرنوشت یک شبکه فضایی را تغییر می‌دهد.`,
    introText: `به سناریو 0 خوش آمدید!
در این سناریو سیستم، سه درگاه مفهومی پیش رویتان می‌گذارد:
درگاه نظریه بازی، جایی که می‌آموزید دشمن همیشه تنها یک «تهدید» نیست، بلکه یک «بازیگر راهبردی» است
درگاه بازی جنگ، جایی که می‌بینید تصمیم‌گیری تنها یک انتخاب نیست، بلکه پاسخی است در برابر پاسخی دیگر
و درگاه بازی جنگ فضایی، جایی که یاد می‌گیرید در مدار، زمان، اطلاعات و منابع همیشه محدودتر از آن‌اند که به نظر می‌رسند.
در این سناریو، هنوز وارد نبرد نمی‌شوید، اما آجرهای اولِ مدل ذهنی‌تان ساخته می‌شود.
با موقعیت‌های ساده، مثال‌های کوچک و انتخاب‌هایی کم‌ریسک روبه‌رو می‌شوید که هرکدام دریچه‌ای است به مفهومی بزرگ:
«تعادل»، «همکاری»، «تهدید»، «عدم قطعیت»، «پوشش اطلاعاتی» و «رفتار دشمن».
«آستانه ورود» تنها یک آموزش نیست، نوعی تطبیق ذهنی است. مسیری است که شما را از یک ناظر بیرونی، به یک تصمیم‌گیرنده راهبردی تبدیل می‌کند، تصمیم‌گیرنده‌ای که در سناریوی‌های بعدی، باید برای نخستین بار با تهدیدی حقیقی روبه‌رو شود.
بازی جنگ جایی است که یاد می‌گیرید «چگونه فکر کنید»، پیش از آنکه بیاموزید «چگونه بجنگید».`
  },
  {
    id: 1,
    title: "۱ — سایه‌های مدار پایین",
    summary: "در مدار پایین زمین، نبردی خاموش در جریان است؛ ماهواره‌ها در ظاهر برای علم و ارتباط پرتاب می‌شوند،",
    image: "/images/scenario1.png",
    fullDescription: `در مدار پایین زمین، نبردی خاموش در جریان است؛ ماهواره‌ها در ظاهر برای علم و ارتباط پرتاب می‌شوند، اما هر حرکت می‌تواند معنایی پنهان داشته باشد. در این سناریو، شما فرمانده عملیات اطلاعاتی ایران هستید. مأموریتتان ساده به نظر می‌رسد: حفظ پوشش اطلاعاتی در چند منطقه کلیدی. اما هر تصمیم شما، می‌تواند تفاوت بین «اشراف فضایی» و «کور شدن میدان نبرد» باشد. آیا می‌توانید پیش از دشمن، حرکت بعدی او را ببینید؟ `
  },
  {
    id: 2,
    title: "۲ — امواج خاموش",
    introTitle: "سناریو ۲ — امواج خاموش",
    summary: "اختلال از آسمان آغاز شده و حالا شبکه لجستیک روی زمین از هماهنگی خارج می‌شود ...",
    image: "/images/scenario2.png",
    descriptionPreview: `اختلال از آسمان آغاز شده و حالا شبکه لجستیک روی زمین از هماهنگی خارج می‌شود. داده‌های ناوبری مشکوک‌اند، مسیر کاروان‌ها قابل اعتماد نیست و فرمانده باید میان تغییر مسیر، سوئیچ به سامانه پشتیبان، توقف بخشی از عملیات یا ادامه جریان پشتیبانی تصمیم بگیرد.`,
    fullDescription: `اختلال ناوبری و آلودگی داده‌ها، زنجیره لجستیک کشور را در آستانه فروپاشی قرار داده است. در این سناریو باید زیر فشار زمان، میان حفظ جریان پشتیبانی و جلوگیری از خسارت بزرگ‌تر تصمیم بگیرید.`,
    introBackgroundImage: scenario2IntroBackground,
    introText: `اختلال از آسمان آغاز شد، اما میدان نبرد روی زمین فرو ریخت.

در ساعات اولیه عملیات، ستون‌های لجستیکی کشور طبق طرح از پیش تعیین‌شده در حال جابه‌جایی بودند. مسیرها امن ارزیابی شده بود، سامانه‌های ناوبری فعال بودند و محموله‌های حیاتی باید در زمان مقرر به مراکز عملیاتی، درمانی و پشتیبانی می‌رسیدند. اما ناگهان، گزارش‌ها یکی پس از دیگری رسید: انحراف از مسیر، تأخیر در رسیدن کاروان‌ها، ناهماهنگی میان واحدها و اختلاف میان مختصات اعلامی و موقعیت واقعی.

هیچ حمله مستقیمی ثبت نشده است. هیچ انفجاری رخ نداده. هیچ پهپاد یا موشکی در آسمان دیده نمی‌شود. اما اثر دشمن در تمام شبکه فرماندهی و پشتیبانی احساس می‌شود.

دشمن این بار زیرساخت فیزیکی را هدف نگرفته است؛ او سامانه ادراک شما را مختل کرده. داده‌ها آلوده شده‌اند، موقعیت‌ها قابل اعتماد نیستند و زنجیره لجستیک، که ستون فقرات عملیات دفاعی کشور است، در معرض فروپاشی قرار دارد.

شما در اتاق فرماندهی قرار دارید. باید در کمترین زمان تصمیم بگیرید: آیا مسیر کاروان‌ها را تغییر می‌دهید؟ آیا به سامانه‌های ناوبری پشتیبان سوئیچ می‌کنید؟ آیا بخشی از عملیات را متوقف می‌کنید تا از خسارت بزرگ‌تر جلوگیری شود؟ یا با پذیرش ریسک، جریان پشتیبانی را ادامه می‌دهید؟

هر تصمیم، پیامد عملیاتی دارد. تأخیر می‌تواند یگان‌های خط مقدم را بدون پشتیبانی بگذارد. تصمیم شتاب‌زده می‌تواند کاروان‌ها را وارد مسیرهای پرخطر کند. اعتماد بیش از حد به داده‌های مخدوش می‌تواند کل عملیات را از کنترل خارج سازد.

در «امواج خاموش»، شما با دشمنی روبه‌رو هستید که دیده نمی‌شود، اما فرماندهی، ناوبری و پشتیبانی کشور را هدف گرفته است. مأموریت شما حفظ پیوستگی عملیات، بازگرداندن کنترل به شبکه لجستیک و جلوگیری از تبدیل یک اختلال فضایی به بحران میدانی است.

زمان محدود است. داده‌ها مشکوک‌اند. و میدان نبرد، پیش از آنکه دیده شود، در سامانه‌های ناوبری آغاز شده است.`
  },
  {
    id: 3,
    title: "۳- کریدور امن",
    summary: "در نبردهای آینده، فاصله میان موفقیت و شکست همیشه روی زمین تعیین نمی‌شود.",
    image: "/images/scenario3.png",
    fullDescription: `در نبردهای آینده، فاصله میان موفقیت و شکست همیشه روی زمین تعیین نمی‌شود. گاهی سرنوشت یک عملیات، در تصویری رقم می‌خورد که از مدار زمین دریافت می‌شود؛ تصویری ناقص، گذرا و وابسته به تصمیمی که باید در لحظه گرفته شود.
یک محموله حساس در آستانه انتقال قرار دارد. ارزش این محموله فقط در مقصد آن نیست؛ در زمانی است که باید برسد، در مسیری است که نباید آشکار شود، و در تصمیم‌هایی است که پیش از دیده‌شدن دشمن باید گرفته شوند.
شما در این مأموریت، چشم عملیات در مدار هستید. وظیفه شما هدایت مستقیم نیست؛ بلکه دیدن پیش از دیگران، تشخیص پیش از تهدید، و هشدار پیش از دیر شدن است. مسیر روی نقشه ساده به نظر می‌رسد، اما در میدان واقعی، هیچ مسیر امنی برای همیشه امن باقی نمی‌ماند. ما دشمن نیز بیکار نیست. واحدهای تعقیب، پهپادهای شناسایی، سامانه‌های اخلال‌گر و ماهواره‌های مراقبتی دشمن در منطقه فعال‌اند.
هر لحظه ممکن است داده‌ای تازه، ردی مشکوک یا تغییری کوچک در محیط، معنای کل مسیر را عوض کند. باید میان سرعت، پنهان‌کاری و امنیت تعادل برقرار کنید؛ زیرا هر انتخاب، فرصت‌هایی می‌سازد و خطرهایی پنهان می‌کند.
مأموریت آغاز می‌شود.
محموله باید حرکت کند.
و این‌بار، آنچه از مدار می‌بینید، می‌تواند تفاوت میان عبور موفق و شکست کامل باشد.
`
  },
  {
    id: 4,
    title: "طوفان در مدار",
    summary: "هماهنگی چند مأموریت فضایی به‌صورت هم‌زمان با منابع محدود.",
    image: "/images/scenario4.png",
    fullDescription: `ناگهان آسمان به میدان نبرد بدل می‌شود. حمله‌ای چندوجهی آغاز شده است — ماهواره‌ها یکی‌یکی از دسترس خارج می‌شوند، ایستگاه‌های زمینی با نفوذ سایبری روبه‌رو شده‌اند، و اطلاعات ضدونقیض از هر سو می‌رسد. در این آشوب، شما باید تصمیم بگیرید: مقابله مستقیم؟ سکوت تاکتیکی؟ یا بازیابی سریع؟ «طوفان در مدار» شما را در قلب یک بحران تمام‌عیار فضایی قرار می‌دهد؛ جایی که هر ثانیه و هر تصمیم می‌تواند مسیر آینده کشور را تغییر دهد.`
  },
  {
    id: 5,
    title: "افق ناپایدار",
    summary: "سناریوی پیشرفته آزمایشی با شرایط تصادفی و پیچیده.",
    image: "/images/scenario5.png",
    fullDescription: `جهان در آستانه بحرانی تمام‌لایه‌ای قرار دارد. هم‌زمان با اختلال در مدارها، رسانه‌ها شعله‌ور شده‌اند، فشار اقتصادی افزایش یافته و ائتلاف‌های منطقه‌ای در حال تغییرند. در این بازی چندمرحله‌ای، شما رهبر عالی راهبردی هستید که باید با تصمیمات سنجیده، بحران را از انفجار به تعادل برسانید. «افق ناپایدار» پیچیده‌ترین سناریوی سامانه است؛ جایی که تصمیمات شما نه تنها نتیجه نبرد، بلکه آینده سیاست فضایی کشور را رقم می‌زند`
  }
];


const App = () => {
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: "admin",
      name: "ادمین",
      role: "admin",
      progress: SCENARIOS.length // برای ادمین مهم نیست ولی می‌گذاریم همه باز باشند
    },
    {
      id: "test-player",
      name: "بازیکن تست",
      role: "player",
      progress: 0 // فقط سناریو ۰ باز است
    }
  ]);

  const [activeProfileId, setActiveProfileId] = useState<string>("test-player");
  const [view, setView] = useState<View>("mainMenu");
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [activeScenarioNodeId, setActiveScenarioNodeId] = useState<string | null>(null);
  const [scenarioCompletionUiActive, setScenarioCompletionUiActive] = useState(false);
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState<boolean>(false);
  const [introModalText, setIntroModalText] = useState<string | null>(null);
  const showBackgroundVideo = view !== "scenarioPlay";
  const scenarioTimerKeyRef = useRef<string | null>(null);
  const scenarioLogIdRef = useRef<string | number | null>(null);
  const questionTimerKeyRef = useRef<string | null>(null);
  const [globalMenuOpen, setGlobalMenuOpen] = useState(false);
  const [selectedAnalyticsUserId, setSelectedAnalyticsUserId] = useState<string>("all");
  const [selectedScenarioRunId, setSelectedScenarioRunId] = useState<string>("all");
  const [analyticsSection, setAnalyticsSection] = useState<"overview" | "stat" | "cognitive">("overview");
  const [showAnalyticsLog, setShowAnalyticsLog] = useState(false);
  const [loggingEnabled, setLoggingEnabled] = useState<boolean>(() => eventLogger.isLoggingEnabled());
  const scenarioDescriptionTimerKeyRef = useRef<string | null>(null);
  const importLogInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSelectedScenarioRunId("all");
  }, [selectedAnalyticsUserId]);

  const handleScenarioNodeChange = useCallback((nodeId: string) => {
    setActiveScenarioNodeId(nodeId);
    if (nodeId !== "end") {
      setScenarioCompletionUiActive(false);
    }
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId)!;
  useEffect(() => {
    eventLogger.setUserContext({
      id: activeProfile.id,
      name: activeProfile.name,
      role: activeProfile.role,
    });
  }, [activeProfile]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

const [expandedScenarioId, setExpandedScenarioId] = useState<number | null>(null);
  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    setView("mainMenu");
  };

  const isScenarioUnlocked = (profile: Profile, scenarioIndex: number) => {
    if (profile.role === "admin") return true;
    return scenarioIndex <= profile.progress;
  };

  const isScenarioCompleted = (profile: Profile, scenarioIndex: number) => {
    if (profile.role === "admin") return false; // برای ادمین فعلاً مفهوم تکمیل را نگه نمی‌داریم
    return scenarioIndex < profile.progress;
  };

  const logScenarioExit = (reason: string) => {
    if (!scenarioLogIdRef.current) return;
    const elapsed =
      scenarioTimerKeyRef.current != null
        ? eventLogger.stopTimer(scenarioTimerKeyRef.current)
        : undefined;
    eventLogger.log({
      type: "scenario_exit",
      scenarioId: scenarioLogIdRef.current,
      action: reason,
      elapsedMs: elapsed,
    });
    scenarioTimerKeyRef.current = null;
    scenarioLogIdRef.current = null;
    if (questionTimerKeyRef.current) {
      eventLogger.stopTimer(questionTimerKeyRef.current);
      questionTimerKeyRef.current = null;
    }
  };

  const leaveScenarioToMainMenu = () => {
    logScenarioExit("main_menu");
    setActiveScenarioId(null);
    setView("mainMenu");
  };

  const leaveScenarioToList = () => {
    logScenarioExit("scenario_list");
    setActiveScenarioId(null);
    setView("scenarioList");
  };

  const leaveScenarioGeneric = (nextView: View, reason: string) => {
    if (view === "scenarioPlay" && scenarioLogIdRef.current) {
      logScenarioExit(reason);
      setActiveScenarioId(null);
    }
    setView(nextView);
    setGlobalMenuOpen(false);
  };

  const handleDownloadLog = () => {
    eventLogger.exportToCSV();
  };

  const handleToggleLogging = () => {
    const next = !loggingEnabled;
    eventLogger.setLoggingEnabled(next);
    setLoggingEnabled(next);
  };

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }
      current += ch;
    }
    values.push(current);
    return values;
  };

  const handleImportLogFile = async (file: File) => {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      alert("CSV معتبر نیست.");
      return;
    }

    const header = parseCsvLine(lines[0]);
    const indexOf = (key: string) => header.indexOf(key);
    const idx = {
      timestamp: indexOf("timestamp"),
      type: indexOf("type"),
      scenarioId: indexOf("scenarioId"),
      nodeId: indexOf("nodeId"),
      action: indexOf("action"),
      elapsedMs: indexOf("elapsedMs"),
      userId: indexOf("userId"),
      userName: indexOf("userName"),
      userRole: indexOf("userRole"),
      detail: indexOf("detail"),
    };
    if (idx.timestamp < 0 || idx.type < 0) {
      alert("ستون‌های ضروری CSV پیدا نشد.");
      return;
    }

    const imported = lines.slice(1).map((line, rowIdx) => {
      const row = parseCsvLine(line);
      const detailRaw = idx.detail >= 0 ? row[idx.detail] ?? "" : "";
      let detail: Record<string, unknown> | undefined;
      if (detailRaw) {
        try {
          detail = JSON.parse(detailRaw) as Record<string, unknown>;
        } catch {
          detail = { raw: detailRaw };
        }
      }
      const tsRaw = row[idx.timestamp];
      const ts = Number.isFinite(Date.parse(tsRaw)) ? Date.parse(tsRaw) : Date.now();
      const elapsedRaw = idx.elapsedMs >= 0 ? row[idx.elapsedMs] : "";
      const elapsedMs = elapsedRaw ? Number(elapsedRaw) : undefined;
      return {
        id: `import-${ts}-${rowIdx}`,
        ts,
        type: row[idx.type] ?? "unknown",
        scenarioId: idx.scenarioId >= 0 && row[idx.scenarioId] !== "" ? row[idx.scenarioId] : undefined,
        nodeId: idx.nodeId >= 0 && row[idx.nodeId] !== "" ? row[idx.nodeId] : undefined,
        action: idx.action >= 0 && row[idx.action] !== "" ? row[idx.action] : undefined,
        elapsedMs: Number.isFinite(elapsedMs) ? elapsedMs : undefined,
        userId: idx.userId >= 0 && row[idx.userId] !== "" ? row[idx.userId] : undefined,
        userName: idx.userName >= 0 && row[idx.userName] !== "" ? row[idx.userName] : undefined,
        userRole: idx.userRole >= 0 && row[idx.userRole] !== "" ? row[idx.userRole] : undefined,
        detail,
      };
    });

    const replace = window.confirm("می‌خواهی لاگ فعلی پاک شود و CSV جایگزین شود؟\nOK = جایگزینی کامل، Cancel = ادغام با لاگ فعلی");
    if (replace) {
      eventLogger.replaceEvents(imported);
      alert(`لاگ با ${imported.length} رویداد جایگزین شد.`);
    } else {
      const added = eventLogger.mergeEvents(imported);
      alert(`${added} رویداد جدید به لاگ اضافه شد (ادغام با حذف تکراری‌ها).`);
    }
  };

  const getUserAnalytics = (): UserAnalyticsSummary[] => {
    const events = eventLogger.getEvents();
    const groups = new Map<string, UserAnalyticsSummary>();
    const scenarioDurations = new Map<string, number[]>();

    for (const event of events) {
      const userId = event.userId ?? "unknown";
      const userName = event.userName ?? "ناشناس";
      const role = event.userRole ?? "unknown";
      const key = `${userId}::${userName}`;

      if (!groups.has(key)) {
        groups.set(key, {
          userId,
          userName,
          role,
          totalEvents: 0,
          scenarioStarts: 0,
          scenarioEnds: 0,
          scenarioExits: 0,
          questionsAnswered: 0,
          avgScenarioDurationSec: 0,
          lastActivityTs: 0,
        });
      }

      const summary = groups.get(key)!;
      summary.totalEvents += 1;
      summary.lastActivityTs = Math.max(summary.lastActivityTs, event.ts);

      if (event.type === "scenario_start") summary.scenarioStarts += 1;
      if (event.type === "scenario_end") {
        summary.scenarioEnds += 1;
        if (event.elapsedMs != null) {
          const list = scenarioDurations.get(key) ?? [];
          list.push(event.elapsedMs);
          scenarioDurations.set(key, list);
        }
      }
      if (event.type === "scenario_exit") summary.scenarioExits += 1;
      if (event.type === "question_answered") summary.questionsAnswered += 1;
    }

    for (const [key, summary] of groups.entries()) {
      const durations = scenarioDurations.get(key) ?? [];
      if (durations.length > 0) {
        const avgMs = durations.reduce((acc, cur) => acc + cur, 0) / durations.length;
        summary.avgScenarioDurationSec = Math.round(avgMs / 1000);
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.lastActivityTs - a.lastActivityTs);
  };

  const buildInsights = (events: ReturnType<typeof eventLogger.getEvents>): UserAnalyticsInsights => {
    const quizQuestionIds = new Set<string>();
    const answeredQuestionIds = new Set<string>();
    let correctAnswers = 0;
    let answerCount = 0;
    let totalThinkingMs = 0;
    let thinkingCount = 0;
    let referenceClicks = 0;
    let descriptionReadMs = 0;
    let referenceReadMs = 0;
    let totalScenarioDurationMs = 0;
    let scenarioDurationCount = 0;
    const eventTypeMap = new Map<string, number>();
    const questionThinkingMap = new Map<string, { total: number; count: number }>();
    const questionTimeline: Array<{ label: string; ms: number }> = [];

    for (const event of events) {
      eventTypeMap.set(event.type, (eventTypeMap.get(event.type) ?? 0) + 1);
      const detail = event.detail ?? {};
      const nodeType = detail["nodeType"];
      const optionId = detail["optionId"];
      const isCorrect = detail["isCorrect"];

      if (
        event.type === "node_enter" &&
        nodeType === "quiz" &&
        event.nodeId
      ) {
        quizQuestionIds.add(event.nodeId);
      }

      if (
        event.type === "option_confirm" &&
        typeof optionId === "string" &&
        typeof isCorrect === "boolean"
      ) {
        answerCount += 1;
        if (event.nodeId) {
          answeredQuestionIds.add(event.nodeId);
          if (event.elapsedMs != null) {
            const prev = questionThinkingMap.get(event.nodeId) ?? { total: 0, count: 0 };
            prev.total += event.elapsedMs;
            prev.count += 1;
            questionThinkingMap.set(event.nodeId, prev);
          }
        }
        if (isCorrect) correctAnswers += 1;
        if (event.elapsedMs != null) {
          totalThinkingMs += event.elapsedMs;
          thinkingCount += 1;
          const qLabel = event.nodeId ?? `q${answerCount}`;
          questionTimeline.push({
            label: qLabel,
            ms: Math.round(event.elapsedMs),
          });
        }
      }

      if (
        event.type === "reference_open" ||
        (event.type === "node_enter" &&
          typeof event.nodeId === "string" &&
          event.nodeId.toLowerCase().includes("example"))
      ) {
        referenceClicks += 1;
      }

      if (event.type === "reference_close" && event.elapsedMs != null) {
        const source = String(detail["source"] ?? "");
        if (source === "scenario_description") {
          descriptionReadMs += event.elapsedMs;
        } else {
          referenceReadMs += event.elapsedMs;
        }
      }

      if (
        event.type === "option_confirm" &&
        event.elapsedMs != null &&
        String(detail["action"] ?? "") === "info_continue"
      ) {
        const nodeId = (event.nodeId ?? "").toLowerCase();
        if (nodeId.includes("example")) {
          referenceReadMs += event.elapsedMs;
        } else {
          descriptionReadMs += event.elapsedMs;
        }
      }

      if (event.type === "scenario_end" && event.elapsedMs != null) {
        totalScenarioDurationMs += event.elapsedMs;
        scenarioDurationCount += 1;
      }
    }

    const eventTypeCounts = Array.from(eventTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const questionThinking = Array.from(questionThinkingMap.entries())
      .map(([question, data]) => ({
        question,
        ms: Math.round(data.total / Math.max(data.count, 1)),
      }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 8);

    return {
      totalQuestions: quizQuestionIds.size,
      answeredQuestions: answeredQuestionIds.size,
      scoredAnswers: answerCount,
      correctAnswers,
      correctAnswerRate: answerCount > 0 ? Math.round((correctAnswers / answerCount) * 100) : 0,
      avgThinkingMs: thinkingCount > 0 ? Math.round(totalThinkingMs / thinkingCount) : 0,
      referenceClicks,
      descriptionReadSec: Math.round(descriptionReadMs / 1000),
      referenceReadSec: Math.round(referenceReadMs / 1000),
      avgScenarioDurationSec:
        scenarioDurationCount > 0
          ? Math.round(totalScenarioDurationMs / scenarioDurationCount / 1000)
          : 0,
      scenarioRuns: scenarioDurationCount,
      eventTypeCounts,
      questionThinking,
      questionTimeline,
    };
  };

  const buildCognitiveInsights = (events: ReturnType<typeof eventLogger.getEvents>): CognitiveInsights => {
    const confirmEvents = events.filter((e) => e.type === "option_confirm");
    const scoredConfirms = confirmEvents.filter(
      (e) => typeof e.detail?.["isCorrect"] === "boolean"
    );
    const miniGameScoredEvents = events.filter(
      (e) =>
        typeof e.type === "string" &&
        e.type.startsWith("mini_game_") &&
        e.type !== "mini_game_start" &&
        e.type !== "mini_game_summary" &&
        typeof e.detail?.["isCorrect"] === "boolean"
    );
    const allScoredEvents = [...scoredConfirms, ...miniGameScoredEvents];
    const allCorrectCount = allScoredEvents.filter((e) => e.detail?.["isCorrect"] === true).length;
    const overallAccuracy = allScoredEvents.length > 0 ? Math.round((allCorrectCount / allScoredEvents.length) * 100) : 0;

    const decisionElapsed = allScoredEvents
      .map((e) => {
        const responseTimeMs = e.detail?.["responseTimeMs"];
        return typeof responseTimeMs === "number" ? responseTimeMs : (e.elapsedMs ?? 0);
      })
      .filter((x) => x > 0);
    const avgDecisionMs = decisionElapsed.length > 0
      ? decisionElapsed.reduce((a, b) => a + b, 0) / decisionElapsed.length
      : 0;
    const decisionSpeedSec = Math.round(avgDecisionMs / 1000);

    const groupByNode = new Map<string, typeof events>();
    for (const event of events) {
      if (!event.nodeId) continue;
      const key = String(event.nodeId);
      groupByNode.set(key, [...(groupByNode.get(key) ?? []), event]);
    }

    let hesitantNodes = 0;
    let changedAnswerNodes = 0;
    let successfulRevisions = 0;
    let revisionCount = 0;
    let referenceUsedNodes = 0;
    let wrongAfterLongThink = 0;
    const wrongCountByNode = new Map<string, number>();
    const domainStat = new Map<string, { total: number; correct: number }>();
    const miniGameTotal = miniGameScoredEvents.length;
    const miniGameOpenedExplanation = miniGameScoredEvents.filter(
      (e) => e.detail?.["openedExplanation"] === true
    );
    const miniGameWithExplanation = miniGameOpenedExplanation;
    const miniGameWithoutExplanation = miniGameScoredEvents.filter(
      (e) => e.detail?.["openedExplanation"] !== true
    );
    const miniGameChangedTotal = miniGameScoredEvents.reduce((sum, event) => {
      const changed = event.detail?.["changedAnswerCount"];
      return sum + (typeof changed === "number" ? changed : 0);
    }, 0);
    const miniGameExplanationMs = miniGameOpenedExplanation
      .map((e) => e.detail?.["explanationTimeMs"])
      .filter((value): value is number => typeof value === "number" && value > 0);
    const explanationUsageRate =
      miniGameTotal > 0 ? Math.round((miniGameOpenedExplanation.length / miniGameTotal) * 100) : 0;
    const avgExplanationSec =
      miniGameExplanationMs.length > 0
        ? Math.round(
            miniGameExplanationMs.reduce((sum, value) => sum + value, 0) /
              miniGameExplanationMs.length /
              1000
          )
        : 0;
    const accuracyOf = (items: typeof events) => {
      const scored = items.filter((e) => typeof e.detail?.["isCorrect"] === "boolean");
      if (scored.length === 0) return 0;
      const correct = scored.filter((e) => e.detail?.["isCorrect"] === true).length;
      return Math.round((correct / scored.length) * 100);
    };
    const accuracyWithExplanation = accuracyOf(miniGameWithExplanation);
    const accuracyWithoutExplanation = accuracyOf(miniGameWithoutExplanation);
    const guidanceBenefitScore =
      miniGameWithExplanation.length > 0 && miniGameWithoutExplanation.length > 0
        ? Math.max(-100, Math.min(100, accuracyWithExplanation - accuracyWithoutExplanation))
        : 0;
    const overconfidenceErrors = miniGameScoredEvents.filter((e) => {
      const changed = e.detail?.["changedAnswerCount"];
      return (
        e.detail?.["isCorrect"] === false &&
        e.detail?.["openedExplanation"] !== true &&
        (typeof changed !== "number" || changed === 0)
      );
    }).length;
    const overconfidenceErrorRate =
      miniGameTotal > 0 ? Math.round((overconfidenceErrors / miniGameTotal) * 100) : 0;
    const hesitantMiniGameEvents = miniGameScoredEvents.filter((e) => {
      const changed = e.detail?.["changedAnswerCount"];
      return e.detail?.["openedExplanation"] === true || (typeof changed === "number" && changed > 0);
    });
    const productiveHesitations = hesitantMiniGameEvents.filter(
      (e) => e.detail?.["isCorrect"] === true
    ).length;
    const productiveHesitationRate =
      hesitantMiniGameEvents.length > 0
        ? Math.round((productiveHesitations / hesitantMiniGameEvents.length) * 100)
        : 0;

    const getDomain = (nodeId: string) => {
      const n = nodeId.toLowerCase();
      if (n.includes("gametheory")) return "نظریه بازی";
      if (n.includes("wargame")) return "بازی جنگ";
      if (n.includes("space")) return "بازی جنگ فضایی";
      return "سایر";
    };
    const getMiniGameDomain = (event: (typeof events)[number]) => {
      const conceptTag = event.detail?.["conceptTag"];
      if (typeof conceptTag === "string" && conceptTag.trim().length > 0) {
        return conceptTag;
      }
      const roundId = String(event.detail?.["roundId"] ?? "");
      const cardId = String(event.detail?.["cardId"] ?? "");
      if (cardId.includes("zero_sum")) return "بازی جمع صفر";
      if (cardId.includes("non_zero_sum")) return "بازی مجموع‌غیرصفر";
      if (roundId.includes("incomplete") || cardId.includes("incomplete")) return "اطلاعات ناقص";
      if (roundId.includes("action_reaction")) return "کنش و واکنش";
      if (roundId.includes("integrated")) return "مفاهیم ترکیبی";
      return "آزمایشگاه مفاهیم";
    };

    for (const [nodeId, nodeEvents] of groupByNode.entries()) {
      const selects = nodeEvents.filter((e) => e.type === "option_select");
      const confirms = nodeEvents.filter((e) => e.type === "option_confirm");
      const confirmsWithScore = confirms.filter((e) => typeof e.detail?.["isCorrect"] === "boolean");
      if (selects.length > 1) hesitantNodes += 1;
      const selectedOptionIds = selects.map((e) => String(e.detail?.["optionId"] ?? ""));
      if (new Set(selectedOptionIds.filter(Boolean)).size > 1) changedAnswerNodes += 1;

      if (confirmsWithScore.length > 0) {
        const c = confirmsWithScore[confirmsWithScore.length - 1];
        const d = getDomain(nodeId);
        const prev = domainStat.get(d) ?? { total: 0, correct: 0 };
        prev.total += 1;
        if (c.detail?.["isCorrect"] === true) prev.correct += 1;
        domainStat.set(d, prev);

        if (c.detail?.["isCorrect"] === false) {
          wrongCountByNode.set(nodeId, (wrongCountByNode.get(nodeId) ?? 0) + 1);
          if ((c.elapsedMs ?? 0) > avgDecisionMs && avgDecisionMs > 0) wrongAfterLongThink += 1;
        }
      }

      const hasReference = nodeEvents.some(
        (e) =>
          e.type === "reference_open" ||
          (e.type === "node_enter" && String(e.nodeId ?? "").toLowerCase().includes("example"))
      );
      if (hasReference) referenceUsedNodes += 1;

      const changed = new Set(selectedOptionIds.filter(Boolean)).size > 1;
      if (changed && confirmsWithScore.length > 0) {
        revisionCount += 1;
        const lastConfirm = confirmsWithScore[confirmsWithScore.length - 1];
        if (lastConfirm.detail?.["isCorrect"] === true) successfulRevisions += 1;
      }
    }

    const scenarioStarts = events.filter((e) => e.type === "scenario_start").length;
    const scenarioExits = events.filter((e) => e.type === "scenario_exit").length;

    for (const event of miniGameScoredEvents) {
      const domain = getMiniGameDomain(event);
      const prev = domainStat.get(domain) ?? { total: 0, correct: 0 };
      prev.total += 1;
      if (event.detail?.["isCorrect"] === true) prev.correct += 1;
      domainStat.set(domain, prev);
      if (event.detail?.["isCorrect"] === false) {
        const cardId = String(event.detail?.["cardId"] ?? event.nodeId ?? "mini_game");
        wrongCountByNode.set(cardId, (wrongCountByNode.get(cardId) ?? 0) + 1);
      }
    }

    const scoredCountForRates = Math.max(allScoredEvents.length, 1);
    const miniChangedCardCount = miniGameScoredEvents.filter((event) => {
      const changed = event.detail?.["changedAnswerCount"];
      return typeof changed === "number" && changed > 0;
    }).length;
    const hesitationRate = Math.round(
      ((hesitantNodes + miniChangedCardCount + miniGameOpenedExplanation.length) / scoredCountForRates) * 100
    );
    const answerChangeRate = Math.round(
      ((changedAnswerNodes + miniChangedCardCount) / scoredCountForRates) * 100
    );
    const successfulRevisionRate = revisionCount > 0 ? Math.round((successfulRevisions / revisionCount) * 100) : 0;
    const referenceUsageRate = scoredCountForRates > 0
      ? Math.round(((referenceUsedNodes + miniGameOpenedExplanation.length) / scoredCountForRates) * 100)
      : 0;
    const unfinishedExitRate = scenarioStarts > 0 ? Math.round((scenarioExits / scenarioStarts) * 100) : 0;
    const miniGameWrongRate =
      miniGameTotal > 0
        ? Math.round(
            (miniGameScoredEvents.filter((e) => e.detail?.["isCorrect"] === false).length /
              miniGameTotal) *
              100
          )
        : 0;
    const miniGameChangeRate =
      miniGameTotal > 0 ? Math.round((miniGameChangedTotal / miniGameTotal) * 100) : 0;
    const miniGameAvgResponseMs =
      miniGameTotal > 0
        ? miniGameScoredEvents.reduce((sum, event) => {
            const responseTimeMs = event.detail?.["responseTimeMs"];
            return sum + (typeof responseTimeMs === "number" ? responseTimeMs : event.elapsedMs ?? 0);
          }, 0) / miniGameTotal
        : 0;
    const conceptFrictionScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          miniGameWrongRate * 0.35 +
            explanationUsageRate * 0.25 +
            Math.min(100, miniGameAvgResponseMs / 100) * 0.2 +
            Math.min(100, miniGameChangeRate) * 0.2
        )
      )
    );

    const loadRaw =
      (hesitationRate * 0.25) +
      (answerChangeRate * 0.2) +
      (referenceUsageRate * 0.15) +
      (unfinishedExitRate * 0.2) +
      (conceptFrictionScore * 0.2) +
      (overconfidenceErrorRate * 0.15) +
      (wrongAfterLongThink > 0 ? Math.min(20, wrongAfterLongThink * 5) : 0);
    const estimatedCognitiveLoad = Math.max(0, Math.min(100, Math.round(loadRaw)));

    const isFast = decisionSpeedSec > 0 && decisionSpeedSec <= 2;
    const isAccurate = overallAccuracy >= 70;
    const speedAccuracyQuadrant = isFast
      ? (isAccurate ? "سریع و دقیق" : "سریع و غیردقیق")
      : (isAccurate ? "کند و دقیق" : "کند و غیردقیق");
    const styleLabel = isFast
      ? (overallAccuracy >= 70 ? "شهودی-عملیاتی" : "شتاب‌زده")
      : (overallAccuracy >= 70 ? "تحلیلی-محتاط" : "مردد/نیازمند آموزش");

    const domainScores: CognitiveDomainScore[] = Array.from(domainStat.entries()).map(([domain, v]) => ({
      domain,
      total: v.total,
      correct: v.correct,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));

    const frequentErrors = Array.from(wrongCountByNode.entries())
      .map(([nodeId, wrongCount]) => ({ nodeId, wrongCount }))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 6);

    return {
      overallAccuracy,
      decisionSpeedSec,
      hesitationRate,
      answerChangeRate,
      successfulRevisionRate,
      referenceUsageRate,
      explanationUsageRate,
      avgExplanationSec,
      guidanceBenefitScore,
      overconfidenceErrorRate,
      productiveHesitationRate,
      conceptFrictionScore,
      unfinishedExitRate,
      estimatedCognitiveLoad,
      styleLabel,
      speedAccuracyQuadrant,
      domainScores,
      frequentErrors,
    };
  };

  const handleConfirmAnswer = (totalQuestions: number) => {
  if (selectedOptionIndex == null) return;

  const scenarioLogId = scenarioLogIdRef.current ?? activeScenarioId ?? "unknown";
  const questions = activeScenarioId != null ? SCENARIO_QUESTIONS[activeScenarioId] || [] : [];
  const currentQuestion = questions[currentQuestionIndex];
  const elapsed =
    questionTimerKeyRef.current != null
      ? eventLogger.stopTimer(questionTimerKeyRef.current)
      : undefined;

  eventLogger.log({
    type: "question_answered",
    scenarioId: scenarioLogId,
    detail: {
      questionId: currentQuestion?.id ?? currentQuestionIndex,
      selectedIndex: selectedOptionIndex,
      selectedText: currentQuestion?.options?.[selectedOptionIndex],
    },
    elapsedMs: elapsed,
  });
  questionTimerKeyRef.current = null;

  const nextIndex = currentQuestionIndex + 1;
  setAnsweredCount((prev) => prev + 1);

  if (nextIndex < totalQuestions) {
    setCurrentQuestionIndex(nextIndex);
    setSelectedOptionIndex(null);
  }
  // اگر آخرین سوال بود، فقط وضعیت را نگه می‌داریم
  // و دکمه "اتمام سناریو" فعال می‌شود
};


  const handleOpenScenario = (scenarioId: number) => {
    const scenarioIndex = SCENARIOS.findIndex((s) => s.id === scenarioId);
    if (scenarioIndex === -1) return;
    const scenario = SCENARIOS[scenarioIndex];
    const scenarioTreeId = SCENARIO_TREE_IDS[scenario.id];
    const scenarioLogId = scenarioTreeId ?? scenario.id;

    eventLogger.log({
      type: "scenario_card_click",
      scenarioId: scenarioLogId,
      detail: { unlocked: isScenarioUnlocked(activeProfile, scenarioIndex) },
    });

    if (!isScenarioUnlocked(activeProfile, scenarioIndex)) {
      return;
    }

    scenarioLogIdRef.current = scenarioLogId;
    scenarioTimerKeyRef.current = `scenario:${scenarioLogId}`;
    eventLogger.startTimer(scenarioTimerKeyRef.current);
    eventLogger.log({
      type: "scenario_start",
      scenarioId: scenarioLogId,
      detail: { role: activeProfile.role, profileId: activeProfile.id },
    });

    setActiveScenarioId(scenarioId);
    setActiveScenarioNodeId(null);
    setScenarioCompletionUiActive(false);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setAnsweredCount(0);
    setIntroModalText(scenario.introText ?? null);
    setScenarioMenuOpen(false);
    setView("scenarioPlay");
  };

  const handleFinishScenario = () => {
    if (activeScenarioId == null) return;

    const scenarioIndex = SCENARIOS.findIndex(
      (s) => s.id === activeScenarioId
    );
    if (scenarioIndex === -1) return;
    const scenarioLogId = scenarioLogIdRef.current ?? activeScenarioId;
    const elapsed =
      scenarioTimerKeyRef.current != null
        ? eventLogger.stopTimer(scenarioTimerKeyRef.current)
        : undefined;
    if (questionTimerKeyRef.current) {
      eventLogger.stopTimer(questionTimerKeyRef.current);
      questionTimerKeyRef.current = null;
    }
    eventLogger.log({
      type: "scenario_end",
      scenarioId: scenarioLogId,
      elapsedMs: elapsed,
      detail: { reason: "completed" },
    });
    scenarioTimerKeyRef.current = null;
    scenarioLogIdRef.current = null;
    setScenarioCompletionUiActive(false);

    // برای player: سناریوی بعدی را باز کن
    if (activeProfile.role === "player") {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== activeProfile.id) return p;
          const nextProgress = Math.max(p.progress, scenarioIndex + 1);
          return { ...p, progress: Math.min(nextProgress, SCENARIOS.length - 1) };
        })
      );
    }

    // بعد از اتمام، برگردیم به لیست سناریوها
    setView("scenarioList");
  };

  const handleStopScenario = () => {
    if (view !== "scenarioPlay" || !scenarioLogIdRef.current) return;
    const shouldStop = window.confirm("آیا واقعا می‌خواهید این سناریو را ناتمام متوقف کنید؟");
    if (!shouldStop) return;
    logScenarioExit("manual_stop_unfinished");
    setActiveScenarioId(null);
    setScenarioCompletionUiActive(false);
    setView("scenarioList");
  };

  useEffect(() => {
    if (view !== "scenarioPlay") return;
    if (activeScenarioId == null) return;
    const scenarioTreeId = SCENARIO_TREE_IDS[activeScenarioId];
    if (scenarioTreeId) return; // tree mode handled elsewhere

    const questions = SCENARIO_QUESTIONS[activeScenarioId] || [];
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const scenarioLogId = scenarioLogIdRef.current ?? activeScenarioId;
    const key = `question:${scenarioLogId}:${currentQuestion.id}`;
    if (questionTimerKeyRef.current === key) return;

    if (questionTimerKeyRef.current) {
      eventLogger.stopTimer(questionTimerKeyRef.current);
    }

    questionTimerKeyRef.current = key;
    eventLogger.startTimer(key);
    eventLogger.log({
      type: "question_presented",
      scenarioId: scenarioLogId,
      detail: { questionId: currentQuestion.id, index: currentQuestionIndex },
    });
  }, [view, activeScenarioId, currentQuestionIndex]);

  const handleExit = () => {
    if (view === "scenarioPlay" && scenarioLogIdRef.current) {
      logScenarioExit("app_exit");
    }
    // فعلاً فقط یک پیام ساده
    alert("خروج از برنامه در نسخه فعلی فقط نمادین است.");
  };

  const renderMainMenu = () => (
    <div className="screen">
      <div className="card main-menu-card">
        <h1 className="app-title">بازی جنگ فضایی</h1>
        <h2 className="screen-title">منو اصلی</h2>

        <div className="active-profile">
          <span>پروفایل فعال:</span>
          <strong>{activeProfile.name}</strong>
          <span className="badge">{activeProfile.role === "admin" ? "ادمین" : "بازیکن"}</span>
        </div>

        <div className="menu-buttons">
          <button onClick={() => setView("scenarioList")}>شروع</button>
          <button onClick={() => setView("profileManager")}>ساخت / انتخاب پروفایل</button>
          <button
            onClick={() =>
              alert("پیشنهاد سناریو در نسخه بعدی فعال خواهد شد.")
            }
          >
            پیشنهاد سناریو
          </button>
          <button
            onClick={() =>
              alert("بخش پیشنهادات در نسخه بعدی فعال خواهد شد.")
            }
          >
            پیشنهادات
          </button>
          <button className="danger" onClick={handleExit}>
            خروج
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfileManager = () => (
    <div className="screen">
      <div className="card">
        <div className="screen-header">
          <h2 className="screen-title">مدیریت پروفایل‌ها</h2>
          <button className="link" onClick={() => setView("mainMenu")}>
            بازگشت به منوی اصلی
          </button>
        </div>

        <p className="hint">
          فعلاً دو پروفایل ثابت داریم؛ بعداً می‌توانیم ساخت پروفایل جدید اضافه کنیم.
        </p>

        {activeProfile.role === "admin" && (
          <div style={{ marginBottom: "1rem" }}>
            <button onClick={() => setView("adminAnalytics")}>
              داشبورد تحلیلی کاربران
            </button>
          </div>
        )}

        <div className="profile-list">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              className={
                "profile-item" +
                (profile.id === activeProfileId ? " profile-item-active" : "")
              }
              onClick={() => handleSelectProfile(profile.id)}
            >
              <div className="profile-name">{profile.name}</div>
              <div className="profile-meta">
                نقش: {profile.role === "admin" ? "ادمین" : "بازیکن تست"}
              </div>
              {profile.role === "player" && (
                <div className="profile-progress">
                  پیشرفت: سناریوی بعدی باز = {profile.progress}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdminAnalytics = () => {
    if (activeProfile.role !== "admin") {
      return (
        <div className="screen">
          <div className="card">
            <p className="hint">دسترسی فقط برای ادمین فعال است.</p>
            <button className="link" onClick={() => setView("mainMenu")}>
              بازگشت به منوی اصلی
            </button>
          </div>
        </div>
      );
    }

    const allEvents = eventLogger.getEvents();
    const users = getUserAnalytics();
    const userScopedEvents =
      selectedAnalyticsUserId === "all"
        ? allEvents
        : allEvents.filter((event) => event.userId === selectedAnalyticsUserId);
    const buildScenarioRuns = (events: typeof userScopedEvents) => {
      const sorted = events.slice().sort((a, b) => a.ts - b.ts);
      const scenarioCounters = new Map<string, number>();
      const openRuns: Record<string, { runId: string; startTs: number }> = {};
      const runs: Array<{
        runId: string;
        label: string;
        startTs: number;
        endTs: number;
        scenarioId: string;
        completed: boolean;
      }> = [];

      for (const event of sorted) {
        const sid = event.scenarioId != null ? String(event.scenarioId) : "";
        if (!sid) continue;
        if (event.type === "scenario_start") {
          const attempt = (scenarioCounters.get(sid) ?? 0) + 1;
          scenarioCounters.set(sid, attempt);
          const runId = `${sid}::${attempt}`;
          openRuns[sid] = { runId, startTs: event.ts };
        }
        if ((event.type === "scenario_end" || event.type === "scenario_exit") && openRuns[sid]) {
          const current = openRuns[sid];
          runs.push({
            runId: current.runId,
            label: `سناریو ${sid} - اجرای ${current.runId.split("::")[1]}`,
            startTs: current.startTs,
            endTs: event.ts,
            scenarioId: sid,
            completed: event.type === "scenario_end",
          });
          delete openRuns[sid];
        }
      }

      return runs.sort((a, b) => b.startTs - a.startTs);
    };
    const scenarioRuns = buildScenarioRuns(userScopedEvents);
    const selectedRun = selectedScenarioRunId === "all"
      ? null
      : scenarioRuns.find((run) => run.runId === selectedScenarioRunId) ?? null;
    const filteredEvents = selectedRun
      ? userScopedEvents.filter((event) => {
          const sid = event.scenarioId != null ? String(event.scenarioId) : "";
          return sid === selectedRun.scenarioId && event.ts >= selectedRun.startTs && event.ts <= selectedRun.endTs;
        })
      : userScopedEvents;
    const insights = buildInsights(filteredEvents);
    const cognitive = buildCognitiveInsights(filteredEvents);
    const overviewInsights = buildInsights(userScopedEvents);
    const overviewCognitive = buildCognitiveInsights(userScopedEvents);
    const getDetailNumber = (event: (typeof userScopedEvents)[number], key: string) => {
      const value = event.detail?.[key];
      return typeof value === "number" ? value : 0;
    };
    const getDetailString = (event: (typeof userScopedEvents)[number], key: string) => {
      const value = event.detail?.[key];
      return typeof value === "string" ? value : "";
    };
    const s1OutcomeLabels = [
      "major_information_compromise",
      "limited_information_compromise",
      "information_control_success",
      "uncontrolled_escalation",
      "high_readiness_high_tension",
      "strategic_information_opportunity",
      "calm_crisis_control",
      "remaining_ambiguity",
      "mixed_crisis_containment",
    ] as const;
    type S1OutcomeLabel = (typeof s1OutcomeLabels)[number];
    const getS1OutcomeTitle = (label: S1OutcomeLabel) =>
      ({
        major_information_compromise: "شکست اطلاعاتی شدید",
        limited_information_compromise: "شکست اطلاعاتی محدود",
        information_control_success: "موفقیت در کنترل اطلاعاتی",
        uncontrolled_escalation: "تشدید کنترل‌نشده بحران",
        high_readiness_high_tension: "آمادگی بالا همراه با تنش بالا",
        strategic_information_opportunity: "فرصت اطلاعاتی راهبردی",
        calm_crisis_control: "کنترل آرام بحران",
        remaining_ambiguity: "باقی‌ماندن ابهام",
        mixed_crisis_containment: "مهار نسبی بحران",
      })[label];
    const avgDetail = (events: typeof userScopedEvents, key: string) =>
      events.length > 0
        ? events.reduce((sum, event) => sum + getDetailNumber(event, key), 0) / events.length
        : 0;
    const buildS1Analytics = (events: typeof userScopedEvents) => {
      const summaryEvents = events.filter(
        (event) =>
          event.type === "s1_cognitive_summary" &&
          event.scenarioId === "s1_shadows_low_orbit"
      );
      const decisionEvents = events.filter(
        (event) =>
          event.type === "s1_decision" &&
          event.scenarioId === "s1_shadows_low_orbit"
      );
      const startedCount = events.filter(
        (event) => event.type === "scenario_start" && event.scenarioId === "s1_shadows_low_orbit"
      ).length;
      const completedCount = summaryEvents.length;
      const styleCounts = summaryEvents.reduce(
        (acc, event) => {
          const label = getDetailString(event, "decisionStyleLabel");
          if (label === "operational" || label === "balanced" || label === "strategic") {
            acc[label] += 1;
          }
          return acc;
        },
        { operational: 0, balanced: 0, strategic: 0 }
      );
      const informationCompromiseCounts = summaryEvents.reduce(
        (acc, event) => {
          const level = getDetailString(event, "informationCompromiseLevel");
          if (level === "none" || level === "limited" || level === "major") {
            acc[level] += 1;
          }
          return acc;
        },
        { none: 0, limited: 0, major: 0 }
      );
      const outcomeCounts = summaryEvents.reduce(
        (acc, event) => {
          const label = getDetailString(event, "finalNarrativeOutcomeLabel");
          if (s1OutcomeLabels.includes(label as S1OutcomeLabel)) {
            acc[label as S1OutcomeLabel] += 1;
          }
          return acc;
        },
        Object.fromEntries(s1OutcomeLabels.map((label) => [label, 0])) as Record<S1OutcomeLabel, number>
      );
      const completedForExposure = Math.max(summaryEvents.length, 1);
      const decisionExposureByRound = Array.from(
        decisionEvents.reduce((acc, event) => {
          const roundId = getDetailString(event, "roundId");
          if (!roundId) return acc;
          const current = acc.get(roundId) ?? { roundId, count: 0, totalAfter: 0, totalDelta: 0, maxDelta: Number.NEGATIVE_INFINITY };
          const after = getDetailNumber(event, "statusAfter_informationExposureRisk");
          const delta = getDetailNumber(event, "informationExposureDelta");
          current.count += 1;
          current.totalAfter += after;
          current.totalDelta += delta;
          current.maxDelta = Math.max(current.maxDelta, delta);
          acc.set(roundId, current);
          return acc;
        }, new Map<string, { roundId: string; count: number; totalAfter: number; totalDelta: number; maxDelta: number }>())
        .values()
      ).map((item) => ({
        roundId: item.roundId,
        avgAfter: item.count > 0 ? item.totalAfter / item.count : 0,
        avgDelta: item.count > 0 ? item.totalDelta / item.count : 0,
        maxDelta: item.maxDelta === Number.NEGATIVE_INFINITY ? 0 : item.maxDelta,
      }));
      const informationCompromiseOutcomePercent =
        summaryEvents.length > 0
          ? Math.round(
              ((informationCompromiseCounts.limited + informationCompromiseCounts.major) /
                summaryEvents.length) *
                100
            )
          : 0;

      return {
        summaryEvents,
        decisionEvents,
        decisionExposureByRound,
        topExposureRounds: decisionExposureByRound
          .slice()
          .sort((a, b) => b.avgDelta - a.avgDelta)
          .slice(0, 5),
        osiExposurePoints: summaryEvents.map((event) => ({
          x: ((getDetailNumber(event, "operationalStrategicIndex") + 1) / 2) * 100,
          y: getDetailNumber(event, "final_informationExposureRisk"),
        })),
        escalationExposurePoints: decisionEvents.map((event) => ({
          x: getDetailNumber(event, "statusAfter_escalationRisk"),
          y: getDetailNumber(event, "statusAfter_informationExposureRisk"),
        })),
        metrics: {
          startedCount,
          completedCount,
          completionRate: startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
          avgScenarioDurationSec: Math.round(avgDetail(summaryEvents, "avgResponseTimeMs") / 1000),
          avgDecisionMs: Math.round(avgDetail(decisionEvents, "responseTimeMs")),
          avgChangedAnswerCount: avgDetail(summaryEvents, "totalChangedAnswerCount"),
          avgPreviewOpenCount: avgDetail(summaryEvents, "totalPreviewOpenCount"),
          avgOperationalStrategicIndex: avgDetail(summaryEvents, "operationalStrategicIndex"),
          avgSecondOrderThinking: avgDetail(summaryEvents, "secondOrderThinkingScore"),
          avgAdversaryModeling: avgDetail(summaryEvents, "adversaryModelingScore"),
          avgEscalationSensitivity: avgDetail(summaryEvents, "escalationSensitivityScore"),
          avgInformationDiscipline: avgDetail(summaryEvents, "informationDisciplineScore"),
          avgCognitiveFlexibility: avgDetail(summaryEvents, "cognitiveFlexibilityScore"),
          avgInformationExposureRisk: avgDetail(summaryEvents, "final_informationExposureRisk"),
          maxInformationExposureRisk: summaryEvents.reduce(
            (max, event) => Math.max(max, getDetailNumber(event, "final_informationExposureRisk")),
            0
          ),
          informationCompromiseNonePercent: Math.round((informationCompromiseCounts.none / completedForExposure) * 100),
          informationCompromiseLimitedPercent: Math.round((informationCompromiseCounts.limited / completedForExposure) * 100),
          informationCompromiseMajorPercent: Math.round((informationCompromiseCounts.major / completedForExposure) * 100),
          informationCompromiseOutcomePercent,
          informationCompromiseCounts,
          outcomeCounts,
          styleCounts,
        },
      };
    };
    const currentS1 = buildS1Analytics(filteredEvents);
    const overviewS1 = buildS1Analytics(userScopedEvents);
    const s1SummaryEvents = currentS1.summaryEvents;
    const s1DecisionExposureByRound = currentS1.decisionExposureByRound;
    const s1TopExposureRounds = currentS1.topExposureRounds;
    const s1OsiExposurePoints = currentS1.osiExposurePoints;
    const s1EscalationExposurePoints = currentS1.escalationExposurePoints;
    const s1Metrics = currentS1.metrics;
    const overviewS1Metrics = overviewS1.metrics;
    const isS1RunSelected = selectedRun?.scenarioId === "s1_shadows_low_orbit";
    const overviewMaxStyleCount = Math.max(
      overviewS1Metrics.styleCounts.operational,
      overviewS1Metrics.styleCounts.balanced,
      overviewS1Metrics.styleCounts.strategic,
      1
    );
    const isSelectedRunUnfinished = Boolean(selectedRun && !selectedRun.completed);
    const selectedSummary =
      selectedAnalyticsUserId === "all"
        ? null
        : users.find((user) => user.userId === selectedAnalyticsUserId) ?? null;
    const maxTypeCount = Math.max(...insights.eventTypeCounts.map((x) => x.count), 1);
    const maxThinkingMs = Math.max(...insights.questionThinking.map((x) => x.ms), 1);
    const totalAnswers = Math.max(insights.scoredAnswers, 0);
    const correctPercent = totalAnswers > 0 ? Math.round((insights.correctAnswers / totalAnswers) * 100) : 0;
    const incorrectPercent = 100 - correctPercent;
    const pieStyle = {
      background: `conic-gradient(#22c55e 0% ${correctPercent}%, #ef4444 ${correctPercent}% 100%)`,
    };
    const translateEventType = (type: string) => {
      const map: Record<string, string> = {
        scenario_card_click: "کلیک کارت سناریو",
        scenario_start: "شروع سناریو",
        scenario_end: "اتمام سناریو",
        scenario_exit: "خروج ناتمام از سناریو",
        question_presented: "نمایش سوال",
        question_answered: "پاسخ به سوال",
        node_enter: "ورود به گره",
        option_select: "انتخاب گزینه",
        option_confirm: "تایید گزینه",
        reference_open: "بازکردن رفرنس",
        reference_close: "بستن رفرنس",
      };
      return map[type] ?? type;
    };
    const translateNodeId = (nodeId: string) => {
      const normalized = nodeId.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
      return normalized;
    };
    const timelineData = insights.questionTimeline.slice(0, 20);
    const timelineMax = Math.max(...timelineData.map((x) => x.ms), 1);
    const timelinePoints = timelineData
      .map((point, index) => {
        const x = timelineData.length > 1 ? 60 + (index / (timelineData.length - 1)) * 540 : 60;
        const y = 210 - (point.ms / timelineMax) * 160;
        return `${x},${y}`;
      })
      .join(" ");
    const timelineTicks = timelineData.map((_, index) => {
      const x = timelineData.length > 1 ? 60 + (index / (timelineData.length - 1)) * 540 : 60;
      return { x, label: index + 1 };
    });
    const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const buildRadarAxes = (
      sourceCognitive: CognitiveInsights,
      sourceS1Metrics: typeof s1Metrics
    ) => [
      { label: "درک مفهومی", value: clamp100(sourceCognitive.overallAccuracy) },
      {
        label: "آگاهی موقعیتی",
        value: clamp100(
          sourceCognitive.referenceUsageRate * 0.35 +
            sourceCognitive.explanationUsageRate * 0.25 +
            sourceCognitive.productiveHesitationRate * 0.25 +
            Math.max(0, sourceS1Metrics.avgInformationDiscipline * 100) * 0.15
        ),
      },
      {
        label: "کیفیت تصمیم",
        value: clamp100(
          sourceCognitive.overallAccuracy * 0.55 +
            Math.max(0, sourceCognitive.guidanceBenefitScore) * 0.2 +
            (100 - sourceCognitive.overconfidenceErrorRate) * 0.15 +
            Math.max(0, sourceS1Metrics.avgCognitiveFlexibility * 100) * 0.1
        ),
      },
      {
        label: "سرعت پردازش",
        value: clamp100(100 - Math.min(100, sourceCognitive.decisionSpeedSec * 20)),
      },
      {
        label: "مدیریت ریسک",
        value: clamp100(
          100 -
            sourceCognitive.unfinishedExitRate * 0.35 -
            sourceCognitive.overconfidenceErrorRate * 0.35 +
            Math.max(0, sourceS1Metrics.avgEscalationSensitivity * 100) * 0.3
        ),
      },
      {
        label: "جست‌وجوی اطلاعات",
        value: clamp100(
          sourceCognitive.referenceUsageRate * 0.35 +
            sourceCognitive.explanationUsageRate * 0.45 +
            Math.min(100, sourceCognitive.avgExplanationSec * 8) * 0.1 +
            Math.max(0, sourceS1Metrics.avgInformationDiscipline * 100) * 0.1
        ),
      },
      {
        label: "یادگیری و سازگاری",
        value: clamp100(
          sourceCognitive.successfulRevisionRate * 0.3 +
            sourceCognitive.productiveHesitationRate * 0.45 +
            Math.max(0, sourceCognitive.guidanceBenefitScore) * 0.15 +
            Math.max(0, sourceS1Metrics.avgSecondOrderThinking * 100) * 0.1
        ),
      },
      {
        label: "مدیریت ابهام",
        value: clamp100(
          (100 - sourceCognitive.conceptFrictionScore) * 0.65 +
            Math.max(0, sourceS1Metrics.avgAdversaryModeling * 100) * 0.2 +
            Math.max(0, sourceS1Metrics.avgInformationDiscipline * 100) * 0.15
        ),
      },
      { label: "پایبندی به مأموریت", value: clamp100(100 - sourceCognitive.unfinishedExitRate * 0.8) },
    ];
    const radarAxes = buildRadarAxes(cognitive, s1Metrics);
    const overviewRadarAxes = buildRadarAxes(overviewCognitive, overviewS1Metrics);
    const radarCx = 220;
    const radarCy = 220;
    const radarR = 150;
    const radarLevels = [20, 40, 60, 80, 100];
    const toRadarPoint = (index: number, normalized: number, axisCount = radarAxes.length) => {
      const angle = (Math.PI * 2 * index) / axisCount - Math.PI / 2;
      const r = radarR * normalized;
      const x = radarCx + r * Math.cos(angle);
      const y = radarCy + r * Math.sin(angle);
      return { x, y };
    };
    const buildRadarPolygon = (axes: typeof radarAxes) =>
      axes
      .map((axis, idx) => {
        const p = toRadarPoint(idx, axis.value / 100, axes.length);
        return `${p.x},${p.y}`;
      })
      .join(" ");
    const radarPolygon = buildRadarPolygon(radarAxes);
    const overviewRadarPolygon = buildRadarPolygon(overviewRadarAxes);

    return (
      <div className="screen admin-analytics-screen">
        <div className="card admin-analytics-card">
          <div className="screen-header">
            <div>
              <h2 className="screen-title">داشبورد تحلیلی کاربران</h2>
              <p className="subtitle">نمایش تحلیل رفتار براساس لاگ کاربران</p>
            </div>
            <button className="link" onClick={() => setView("profileManager")}>
              بازگشت به مدیریت پروفایل
            </button>
          </div>

          <div className="analytics-toolbar">
            <label htmlFor="analytics-user-select">فیلتر کاربر:</label>
            <select
              id="analytics-user-select"
              value={selectedAnalyticsUserId}
              onChange={(event) => setSelectedAnalyticsUserId(event.target.value)}
            >
              <option value="all">همه کاربران</option>
              {users.map((user) => (
                <option key={`${user.userId}-${user.userName}`} value={user.userId}>
                  {user.userName} ({user.userId})
                </option>
              ))}
            </select>

            <label htmlFor="analytics-scenario-run-select">فیلتر اجرای سناریو:</label>
            <select
              id="analytics-scenario-run-select"
              value={selectedScenarioRunId}
              onChange={(event) => setSelectedScenarioRunId(event.target.value)}
              disabled={selectedAnalyticsUserId === "all" || analyticsSection === "overview"}
            >
              <option value="all">نمایش همه سناریوها</option>
              {selectedAnalyticsUserId !== "all" &&
                scenarioRuns.map((run) => (
                  <option key={run.runId} value={run.runId}>
                    {run.label}
                  </option>
                ))}
            </select>
          </div>

          <div className="analytics-tabs">
            <button
              className={analyticsSection === "overview" ? "analytics-tab active" : "analytics-tab"}
              onClick={() => setAnalyticsSection("overview")}
            >
              بینش کلی
            </button>
            <button
              className={analyticsSection === "stat" ? "analytics-tab active" : "analytics-tab"}
              onClick={() => setAnalyticsSection("stat")}
            >
              بررسی آماری
            </button>
            <button
              className={analyticsSection === "cognitive" ? "analytics-tab active" : "analytics-tab"}
              onClick={() => setAnalyticsSection("cognitive")}
            >
              بررسی شناختی
            </button>
          </div>

          <div className="analytics-context-strip">
            <div>
              <span>دامنه داده</span>
              <strong>
                {analyticsSection === "overview"
                  ? selectedAnalyticsUserId === "all"
                    ? "نمای کلی همه کاربران"
                    : "نمای کلی کاربر انتخاب‌شده"
                  : selectedRun
                    ? selectedRun.label
                    : selectedAnalyticsUserId === "all"
                      ? "همه کاربران"
                      : "کاربر انتخاب‌شده"}
              </strong>
            </div>
            <div>
              <span>رخدادهای فیلترشده</span>
              <strong>{analyticsSection === "overview" ? userScopedEvents.length : filteredEvents.length}</strong>
            </div>
            <div>
              <span>دقت پاسخ‌ها</span>
              <strong>{analyticsSection === "overview" ? overviewInsights.correctAnswerRate : insights.correctAnswerRate}%</strong>
            </div>
            <div>
              <span>بار شناختی</span>
              <strong>{analyticsSection === "overview" ? overviewCognitive.estimatedCognitiveLoad : cognitive.estimatedCognitiveLoad}/100</strong>
            </div>
          </div>

          {analyticsSection === "overview" ? (
            <div className="analytics-cognitive">
              <div className="analytics-grid analytics-grid-primary">
                <div className="analytics-stat"><span>کل رخدادها</span><strong>{userScopedEvents.length}</strong></div>
                <div className="analytics-stat"><span>اجرای کامل سناریو</span><strong>{overviewInsights.scenarioRuns}</strong></div>
                <div className="analytics-stat"><span>دقت کلی پاسخ‌ها</span><strong>{overviewInsights.correctAnswerRate}%</strong></div>
                <div className="analytics-stat"><span>بار شناختی کلی</span><strong>{overviewCognitive.estimatedCognitiveLoad}/100</strong></div>
              </div>

              <div className="analytics-charts overview-charts">
                <div className="analytics-chart-card analytics-chart-card-wide">
                  <h3>رادار کلی شناختی</h3>
                  <div className="radar-wrap">
                    <svg viewBox="0 0 440 470" className="radar-svg">
                      {radarLevels.map((level) => {
                        const points = overviewRadarAxes
                          .map((_, idx) => {
                            const p = toRadarPoint(idx, level / 100, overviewRadarAxes.length);
                            return `${p.x},${p.y}`;
                          })
                          .join(" ");
                        return <polygon key={`overview-lvl-${level}`} points={points} className="radar-grid" />;
                      })}

                      {overviewRadarAxes.map((axis, idx) => {
                        const p = toRadarPoint(idx, 1, overviewRadarAxes.length);
                        return (
                          <g key={`overview-axis-${axis.label}`}>
                            <line x1={radarCx} y1={radarCy} x2={p.x} y2={p.y} className="radar-axis-line" />
                            <text x={p.x} y={p.y} className="radar-axis-label">
                              {axis.label}
                            </text>
                          </g>
                        );
                      })}

                      <polygon points={overviewRadarPolygon} className="radar-data-fill" />
                      <polygon points={overviewRadarPolygon} className="radar-data-stroke" />
                    </svg>
                  </div>
                </div>

                <div className="analytics-chart-card">
                  <h3>طیف تفکر عملیاتی/راهبردی</h3>
                  <OperationalStrategicScale value={overviewS1Metrics.avgOperationalStrategicIndex} />
                  <div className="analytics-bar-row">
                    <span className="analytics-bar-label">عملیاتی</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.max((overviewS1Metrics.styleCounts.operational / overviewMaxStyleCount) * 100, overviewS1Metrics.styleCounts.operational > 0 ? 6 : 0)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{overviewS1Metrics.styleCounts.operational}</span>
                  </div>
                  <div className="analytics-bar-row">
                    <span className="analytics-bar-label">ترکیبی</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill" style={{ width: `${Math.max((overviewS1Metrics.styleCounts.balanced / overviewMaxStyleCount) * 100, overviewS1Metrics.styleCounts.balanced > 0 ? 6 : 0)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{overviewS1Metrics.styleCounts.balanced}</span>
                  </div>
                  <div className="analytics-bar-row">
                    <span className="analytics-bar-label">راهبردی</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-alt" style={{ width: `${Math.max((overviewS1Metrics.styleCounts.strategic / overviewMaxStyleCount) * 100, overviewS1Metrics.styleCounts.strategic > 0 ? 6 : 0)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{overviewS1Metrics.styleCounts.strategic}</span>
                  </div>
                </div>

                <div className="analytics-chart-card">
                  <h3>کیفیت کلی پاسخ</h3>
                  <div className="analytics-pie-wrap">
                    <div
                      className="analytics-pie"
                      style={{
                        background: `conic-gradient(#22c55e 0% ${overviewInsights.correctAnswerRate}%, #ef4444 ${overviewInsights.correctAnswerRate}% 100%)`,
                      }}
                    />
                    <div className="analytics-pie-legend">
                      <div><span className="dot dot-ok" /> صحیح: {overviewInsights.correctAnswerRate}%</div>
                      <div><span className="dot dot-bad" /> خطا: {100 - overviewInsights.correctAnswerRate}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : analyticsSection === "stat" ? (
          <>
          <div className="analytics-grid analytics-grid-primary">
            <div className="analytics-stat">
              <span>کل لاگ‌ها</span>
              <strong>{filteredEvents.length}</strong>
            </div>
            <div className="analytics-stat">
              <span>کل کاربران لاگ‌شده</span>
              <strong>{users.length}</strong>
            </div>
            <div className="analytics-stat">
              <span>سوالات پاسخ‌داده‌شده</span>
              <strong>{insights.answeredQuestions}</strong>
            </div>
            <div className="analytics-stat">
              <span>درصد پاسخ صحیح</span>
              <strong>{insights.correctAnswerRate}%</strong>
            </div>
          </div>

          <details className="analytics-section">
            <summary>جزئیات آماری عمومی</summary>
            <div className="analytics-grid analytics-grid-compact">
              <div className="analytics-stat">
                <span>تعداد سوالات (Quiz)</span>
                <strong>{insights.totalQuestions}</strong>
              </div>
              <div className="analytics-stat">
                <span>تعداد گزینه صحیح</span>
                <strong>{insights.correctAnswers}</strong>
              </div>
              <div className="analytics-stat">
                <span>میانگین زمان فکر روی سوال</span>
                <strong>{Math.round(insights.avgThinkingMs / 1000)} ثانیه</strong>
              </div>
              <div className="analytics-stat">
                <span>کلیک روی رفرنس‌ها/مثال‌ها</span>
                <strong>{insights.referenceClicks}</strong>
              </div>
              <div className="analytics-stat">
                <span>میانگین مدت اجرای سناریو</span>
                <strong>
                  {isSelectedRunUnfinished ? "سناریو تکمیل نشد" : `${insights.avgScenarioDurationSec} ثانیه`}
                </strong>
              </div>
              <div className="analytics-stat">
                <span>تعداد اجرای کامل سناریو</span>
                <strong>{insights.scenarioRuns}</strong>
              </div>
              <div className="analytics-stat">
                <span>زمان مطالعه توضیحات</span>
                <strong>{insights.descriptionReadSec} ثانیه</strong>
              </div>
              <div className="analytics-stat">
                <span>زمان مطالعه رفرنس/مثال</span>
                <strong>{insights.referenceReadSec} ثانیه</strong>
              </div>
            </div>
          </details>

          {isS1RunSelected && (
          <>
          <details className="analytics-section">
            <summary>شاخص‌های سناریو ۱ — سایه‌های مدار پایین</summary>
          <div className="analytics-user-summary">
            <h3>شاخص‌های سناریو ۱ — سایه‌های مدار پایین</h3>
            <div className="analytics-grid analytics-grid-compact">
              <div className="analytics-stat">
                <span>تعداد شروع سناریو ۱</span>
                <strong>{s1Metrics.startedCount}</strong>
              </div>
              <div className="analytics-stat">
                <span>اجرای کامل سناریو ۱</span>
                <strong>{s1Metrics.completedCount}</strong>
              </div>
              <div className="analytics-stat">
                <span>نرخ تکمیل سناریو ۱</span>
                <strong>{s1Metrics.completionRate}%</strong>
              </div>
              <div className="analytics-stat">
                <span>میانگین زمان تصمیم هر راند</span>
                <strong>{Math.round(s1Metrics.avgDecisionMs / 1000)} ثانیه</strong>
              </div>
            </div>
            <div className="analytics-grid">
              <div className="analytics-stat">
                <span>میانگین تغییر تصمیم</span>
                <strong>{s1Metrics.avgChangedAnswerCount.toFixed(1)}</strong>
              </div>
              <div className="analytics-stat">
                <span>میانگین Preview</span>
                <strong>{s1Metrics.avgPreviewOpenCount.toFixed(1)}</strong>
              </div>
              <div className="analytics-stat">
                <span>میانگین OSI</span>
                <strong>{s1Metrics.avgOperationalStrategicIndex.toFixed(2)}</strong>
              </div>
              <div className="analytics-stat">
                <span>توزیع سبک</span>
                <strong>
                  عملیاتی {s1Metrics.styleCounts.operational} | ترکیبی {s1Metrics.styleCounts.balanced} | راهبردی {s1Metrics.styleCounts.strategic}
                </strong>
              </div>
            </div>
            <div className="analytics-grid analytics-grid-compact">
              <div className="analytics-stat">
                <span>میانگین ریسک افشای اطلاعات</span>
                <strong>{s1Metrics.avgInformationExposureRisk.toFixed(1)}%</strong>
              </div>
              <div className="analytics-stat">
                <span>بیشترین ریسک افشای اطلاعات</span>
                <strong>{s1Metrics.maxInformationExposureRisk}%</strong>
              </div>
              <div className="analytics-stat">
                <span>سطح افشا: none</span>
                <strong>{s1Metrics.informationCompromiseNonePercent}%</strong>
              </div>
              <div className="analytics-stat">
                <span>سطح افشا: limited / major</span>
                <strong>{s1Metrics.informationCompromiseLimitedPercent}% / {s1Metrics.informationCompromiseMajorPercent}%</strong>
              </div>
            </div>
            <OperationalStrategicScale value={s1Metrics.avgOperationalStrategicIndex} />
            <div className="analytics-grid analytics-grid-compact">
              <div className="analytics-stat">
                <span>تفکر مرحله دوم</span>
                <strong>{s1Metrics.avgSecondOrderThinking.toFixed(2)}</strong>
              </div>
              <div className="analytics-stat">
                <span>مدل‌سازی طرف مقابل</span>
                <strong>{s1Metrics.avgAdversaryModeling.toFixed(2)}</strong>
              </div>
              <div className="analytics-stat">
                <span>حساسیت به تشدید تنش</span>
                <strong>{s1Metrics.avgEscalationSensitivity.toFixed(2)}</strong>
              </div>
              <div className="analytics-stat">
                <span>نظم اطلاعات‌جویی</span>
                <strong>{s1Metrics.avgInformationDiscipline.toFixed(2)}</strong>
              </div>
            </div>
          </div>
          </details>

          <details className="analytics-section">
            <summary>نمودارهای تکمیلی سناریو ۱</summary>
            <div className="analytics-charts" style={{ marginTop: "1rem" }}>
              <div className="analytics-chart-card">
                <h3>توزیع سطح افشای اطلاعات</h3>
                {(["none", "limited", "major"] as const).map((level) => {
                  const count = s1Metrics.informationCompromiseCounts[level];
                  const percent = s1SummaryEvents.length > 0 ? Math.round((count / s1SummaryEvents.length) * 100) : 0;
                  return (
                    <div key={level} className="analytics-bar-row">
                      <span className="analytics-bar-label">{level}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${Math.max(percent, count > 0 ? 6 : 0)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="analytics-chart-card">
                <h3>میانگین ریسک افشا به تفکیک راند</h3>
                {s1DecisionExposureByRound.length === 0 && <p className="hint">داده‌ای برای سناریو ۱ ثبت نشده است.</p>}
                {s1DecisionExposureByRound.map((item) => (
                  <div key={item.roundId} className="analytics-bar-row">
                    <span className="analytics-bar-label">{translateNodeId(item.roundId)}</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.max(item.avgAfter, 4)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{Math.round(item.avgAfter)}%</span>
                  </div>
                ))}
              </div>

              <div className="analytics-chart-card">
                <h3>راندهای با بیشترین افزایش ریسک افشا</h3>
                {s1TopExposureRounds.length === 0 && <p className="hint">داده‌ای برای سناریو ۱ ثبت نشده است.</p>}
                {s1TopExposureRounds.map((item) => (
                  <div key={item.roundId} className="analytics-bar-row">
                    <span className="analytics-bar-label">{translateNodeId(item.roundId)}</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.max(Math.min(item.avgDelta * 4, 100), 4)}%` }} />
                    </div>
                    <span className="analytics-bar-value">{item.avgDelta.toFixed(1)}</span>
                  </div>
                ))}
              </div>

              <div className="analytics-chart-card">
                <h3>Outcomeهای شکست اطلاعاتی</h3>
                <div className="analytics-stat">
                  <span>درصد outcomeهای limited/major</span>
                  <strong>{s1Metrics.informationCompromiseOutcomePercent}%</strong>
                </div>
                <p className="hint">این درصد از summary نهایی سناریو ۱ محاسبه می‌شود.</p>
              </div>

              <div className="analytics-chart-card">
                <h3>توزیع خروجی نهایی سناریو ۱</h3>
                {s1OutcomeLabels.map((label) => {
                  const count = s1Metrics.outcomeCounts[label];
                  const percent = s1SummaryEvents.length > 0 ? Math.round((count / s1SummaryEvents.length) * 100) : 0;
                  return (
                    <div key={label} className="analytics-bar-row">
                      <span className="analytics-bar-label">{getS1OutcomeTitle(label)}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${Math.max(percent, count > 0 ? 6 : 0)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="analytics-chart-card">
                <h3>رابطه OSI و ریسک افشا</h3>
                {s1OsiExposurePoints.length === 0 ? (
                  <p className="hint">داده‌ای برای نمایش رابطه ثبت نشده است.</p>
                ) : (
                  <svg viewBox="0 0 260 170" style={{ width: "100%", height: 170 }}>
                    <line x1="28" y1="138" x2="238" y2="138" stroke="rgba(148,163,184,0.45)" />
                    <line x1="28" y1="18" x2="28" y2="138" stroke="rgba(148,163,184,0.45)" />
                    {s1OsiExposurePoints.map((point, index) => (
                      <circle
                        key={`osi-exposure-${index}`}
                        cx={28 + (point.x / 100) * 210}
                        cy={138 - (point.y / 100) * 120}
                        r="4"
                        fill="#38bdf8"
                        opacity="0.82"
                      />
                    ))}
                    <text x="78" y="162" fill="#94a3b8" fontSize="10">Operational-Strategic Index</text>
                    <text x="34" y="14" fill="#94a3b8" fontSize="10">Exposure</text>
                  </svg>
                )}
              </div>

              <div className="analytics-chart-card">
                <h3>رابطه ریسک تنش و ریسک افشا</h3>
                {s1EscalationExposurePoints.length === 0 ? (
                  <p className="hint">داده‌ای برای نمایش رابطه ثبت نشده است.</p>
                ) : (
                  <svg viewBox="0 0 260 170" style={{ width: "100%", height: 170 }}>
                    <line x1="28" y1="138" x2="238" y2="138" stroke="rgba(148,163,184,0.45)" />
                    <line x1="28" y1="18" x2="28" y2="138" stroke="rgba(148,163,184,0.45)" />
                    {s1EscalationExposurePoints.map((point, index) => (
                      <circle
                        key={`escalation-exposure-${index}`}
                        cx={28 + (point.x / 100) * 210}
                        cy={138 - (point.y / 100) * 120}
                        r="3.4"
                        fill="#f59e0b"
                        opacity="0.78"
                      />
                    ))}
                    <text x="96" y="162" fill="#94a3b8" fontSize="10">Escalation</text>
                    <text x="34" y="14" fill="#94a3b8" fontSize="10">Exposure</text>
                  </svg>
                )}
              </div>
            </div>
          </details>
          </>
          )}

          {selectedSummary && (
            <div className="analytics-user-summary">
              <h3>خلاصه کاربر انتخاب‌شده</h3>
              {selectedRun && <p>فیلتر اجرای فعال: <strong>{selectedRun.label}</strong></p>}
              <p>
                کاربر: <strong>{selectedSummary.userName}</strong> ({selectedSummary.userId}) -
                نقش: {selectedSummary.role}
              </p>
              <p>
                سناریوی کامل: {selectedSummary.scenarioEnds} | خروج از سناریوی ناتمام:{" "}
                {selectedSummary.scenarioExits} | میانگین مدت سناریوی کامل:{" "}
                {selectedSummary.avgScenarioDurationSec} ثانیه
              </p>
            </div>
          )}

          <details className="analytics-section" open>
            <summary>نمودارهای کلیدی آماری</summary>
          <div className="analytics-charts">
            <div className="analytics-chart-card">
              <h3>توزیع نوع رخدادها</h3>
              {insights.eventTypeCounts.map((item) => (
                <div key={item.type} className="analytics-bar-row">
                  <span className="analytics-bar-label">{translateEventType(item.type)}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill"
                      style={{ width: `${Math.max((item.count / maxTypeCount) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="analytics-bar-value">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="analytics-chart-card">
              <h3>نمودار دایره‌ای پاسخ صحیح</h3>
              <div className="analytics-pie-wrap">
                <div className="analytics-pie" style={pieStyle} />
                <div className="analytics-pie-legend">
                  <div><span className="dot dot-ok" /> صحیح: {correctPercent}%</div>
                  <div><span className="dot dot-bad" /> غلط: {incorrectPercent}%</div>
                </div>
              </div>
            </div>

            <div className="analytics-chart-card">
              <h3>میانگین زمان فکر روی سوال‌ها</h3>
              {insights.questionThinking.map((item) => (
                <div key={item.question} className="analytics-bar-row">
                  <span className="analytics-bar-label">{translateNodeId(item.question)}</span>
                  <div className="analytics-bar-track">
                    <div
                      className="analytics-bar-fill analytics-bar-fill-warn"
                      style={{ width: `${Math.max((item.ms / maxThinkingMs) * 100, 6)}%` }}
                    />
                  </div>
                  <span className="analytics-bar-value">{Math.round(item.ms / 1000)} ث</span>
                </div>
              ))}
            </div>
          </div>
          </details>

          <details className="analytics-section">
            <summary>روند زمان پاسخ</summary>
          <div className="analytics-chart-card" style={{ marginBottom: "1rem" }}>
            <h3>روند زمان پاسخ از سوال اول تا آخر</h3>
            {timelineData.length > 1 ? (
              <div className="analytics-line-wrap">
                <svg viewBox="0 0 640 260" preserveAspectRatio="xMidYMid meet" className="analytics-line-svg">
                  <line x1="60" y1="40" x2="60" y2="210" className="analytics-axis" />
                  <line x1="60" y1="210" x2="610" y2="210" className="analytics-axis" />
                  <line x1="60" y1="125" x2="610" y2="125" className="analytics-axis-grid" />
                  <text x="12" y="44" className="analytics-axis-text">زیاد</text>
                  <text x="8" y="129" className="analytics-axis-text">متوسط</text>
                  <text x="20" y="214" className="analytics-axis-text">کم</text>
                  <text x="235" y="246" className="analytics-axis-text">محور X: ترتیب سوال‌ها</text>
                  <text x="70" y="28" className="analytics-axis-text">محور Y: زمان پاسخ</text>
                  <polyline points={timelinePoints} className="analytics-line" />
                  {timelineTicks.map((tick) => (
                    <g key={`tick-${tick.label}`}>
                      <line x1={tick.x} y1="210" x2={tick.x} y2="216" className="analytics-axis" />
                      <text x={tick.x - 3} y="230" className="analytics-axis-text">
                        {tick.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <p className="hint">داده کافی برای نمایش روند زمانی وجود ندارد.</p>
            )}
          </div>
          </details>

          <div className="analytics-log-toggle">
            <button onClick={() => setShowAnalyticsLog((prev) => !prev)}>
              {showAnalyticsLog ? "پنهان کردن لاگ" : "نمایش لاگ"}
            </button>
          </div>

          {showAnalyticsLog && (
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>زمان</th>
                    <th>کاربر</th>
                    <th>نوع رخداد</th>
                    <th>سناریو</th>
                    <th>جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents
                    .slice()
                    .sort((a, b) => b.ts - a.ts)
                    .map((event) => (
                      <tr key={event.id}>
                        <td>{new Date(event.ts).toLocaleString("fa-IR")}</td>
                        <td>{event.userName ?? event.userId ?? "-"}</td>
                        <td>{event.type}</td>
                        <td>{event.scenarioId ?? "-"}</td>
                        <td>{event.detail ? JSON.stringify(event.detail) : "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          </>
          ) : (
            <div className="analytics-cognitive">
              <div className="analytics-grid analytics-grid-primary">
                <div className="analytics-stat"><span>دقت مفهومی کلی</span><strong>{cognitive.overallAccuracy}%</strong></div>
                <div className="analytics-stat"><span>سرعت تصمیم‌گیری</span><strong>{cognitive.decisionSpeedSec} ثانیه</strong></div>
                <div className="analytics-stat"><span>نرخ تردید/بازبینی</span><strong>{cognitive.hesitationRate}%</strong></div>
                <div className="analytics-stat"><span>بار شناختی تخمینی</span><strong>{cognitive.estimatedCognitiveLoad}/100</strong></div>
              </div>

              <div className="analytics-user-summary">
                <h3>خلاصه شناختی</h3>
                <p>سبک تصمیم‌گیری: <strong>{cognitive.styleLabel}</strong></p>
                <p>جایگاه در ماتریس سرعت×دقت: <strong>{cognitive.speedAccuracyQuadrant}</strong></p>
                {isS1RunSelected && <OperationalStrategicScale value={s1Metrics.avgOperationalStrategicIndex} />}
              </div>

              <details className="analytics-section">
                <summary>جزئیات شاخص‌های شناختی</summary>
                <div className="analytics-grid analytics-grid-compact">
                  <div className="analytics-stat"><span>نرخ تغییر پاسخ</span><strong>{cognitive.answerChangeRate}%</strong></div>
                  <div className="analytics-stat"><span>اصلاح موفق پس از تغییر</span><strong>{cognitive.successfulRevisionRate}%</strong></div>
                  <div className="analytics-stat"><span>استفاده از مرجع</span><strong>{cognitive.referenceUsageRate}%</strong></div>
                  <div className="analytics-stat"><span>ترک سناریوی ناتمام</span><strong>{cognitive.unfinishedExitRate}%</strong></div>
                  <div className="analytics-stat"><span>استفاده از توضیح بیشتر</span><strong>{cognitive.explanationUsageRate}%</strong></div>
                  <div className="analytics-stat"><span>زمان مطالعه توضیح</span><strong>{cognitive.avgExplanationSec} ثانیه</strong></div>
                  <div className="analytics-stat"><span>اثر توضیح بر دقت</span><strong>{cognitive.guidanceBenefitScore}%</strong></div>
                  <div className="analytics-stat"><span>خطای با اطمینان بالا</span><strong>{cognitive.overconfidenceErrorRate}%</strong></div>
                  <div className="analytics-stat"><span>تردید مفید</span><strong>{cognitive.productiveHesitationRate}%</strong></div>
                  <div className="analytics-stat"><span>اصطکاک مفهومی</span><strong>{cognitive.conceptFrictionScore}/100</strong></div>
                </div>
              </details>

              {isS1RunSelected && (
                <details className="analytics-section">
                  <summary>شاخص‌های شناختی اختصاصی سناریو ۱</summary>
                  <div className="analytics-grid analytics-grid-compact">
                    <div className="analytics-stat"><span>سناریو ۱: OSI</span><strong>{s1Metrics.avgOperationalStrategicIndex.toFixed(2)}</strong></div>
                    <div className="analytics-stat"><span>سناریو ۱: تفکر مرحله دوم</span><strong>{s1Metrics.avgSecondOrderThinking.toFixed(2)}</strong></div>
                    <div className="analytics-stat"><span>سناریو ۱: مدل‌سازی طرف مقابل</span><strong>{s1Metrics.avgAdversaryModeling.toFixed(2)}</strong></div>
                    <div className="analytics-stat"><span>سناریو ۱: انعطاف شناختی</span><strong>{s1Metrics.avgCognitiveFlexibility.toFixed(2)}</strong></div>
                  </div>
                </details>
              )}

              <details className="analytics-section" open>
                <summary>نمودارهای شناختی</summary>
              <div className="analytics-charts">
                <div className="analytics-chart-card">
                  <h3>نمودار راداری شناختی</h3>
                  <div className="radar-wrap">
                    <svg viewBox="0 0 440 470" className="radar-svg">
                      {radarLevels.map((level) => {
                        const points = radarAxes
                          .map((_, idx) => {
                            const p = toRadarPoint(idx, level / 100);
                            return `${p.x},${p.y}`;
                          })
                          .join(" ");
                        return <polygon key={`lvl-${level}`} points={points} className="radar-grid" />;
                      })}

                      {radarAxes.map((axis, idx) => {
                        const p = toRadarPoint(idx, 1);
                        return (
                          <g key={`axis-${axis.label}`}>
                            <line x1={radarCx} y1={radarCy} x2={p.x} y2={p.y} className="radar-axis-line" />
                            <text x={p.x} y={p.y} className="radar-axis-label">
                              {axis.label}
                            </text>
                          </g>
                        );
                      })}

                      <polygon points={radarPolygon} className="radar-data-fill" />
                      <polygon points={radarPolygon} className="radar-data-stroke" />
                    </svg>
                  </div>
                  <p className="hint">این نمودار بر اساس پروکسی رفتاری و لاگ فعلی محاسبه می‌شود.</p>
                </div>

                <div className="analytics-chart-card">
                  <h3>تسلط مفهومی بر حوزه‌ها</h3>
                  {cognitive.domainScores.map((d) => (
                    <div key={d.domain} className="analytics-bar-row">
                      <span className="analytics-bar-label">{d.domain}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill" style={{ width: `${Math.max(d.accuracy, 4)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{d.accuracy}%</span>
                    </div>
                  ))}
                </div>

                <div className="analytics-chart-card">
                  <h3>ضعف‌های پرتکرار (خطای مفهومی)</h3>
                  {cognitive.frequentErrors.length === 0 && <p className="hint">خطای پرتکرار ثبت نشده است.</p>}
                  {cognitive.frequentErrors.map((e) => (
                    <div key={e.nodeId} className="analytics-bar-row">
                      <span className="analytics-bar-label">{e.nodeId}</span>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar-fill analytics-bar-fill-warn" style={{ width: `${Math.min(100, e.wrongCount * 25)}%` }} />
                      </div>
                      <span className="analytics-bar-value">{e.wrongCount}</span>
                    </div>
                  ))}
                </div>
              </div>
              </details>

            </div>
          )}
        </div>
      </div>
    );
  };

  const renderScenarioList = () => (
    <div className="screen">
      <div className="card">
        <div className="screen-header">
          <div>
            <h2 className="screen-title">انتخاب سناریو</h2>
            <p className="subtitle">
              پروفایل فعال: <strong>{activeProfile.name}</strong>{" "}
              <span className="badge">
                {activeProfile.role === "admin" ? "ادمین" : "بازیکن"}
              </span>
            </p>
          </div>
          <button className="link" onClick={() => setView("mainMenu")}>
            بازگشت به منوی اصلی
          </button>
        </div>

        <div className="scenario-grid">
          {SCENARIOS.map((scenario, index) => {
              const unlocked = isScenarioUnlocked(activeProfile, index);
              const completed = isScenarioCompleted(activeProfile, index);
              const isExpanded = expandedScenarioId === scenario.id;

              return (
                <div
                  key={scenario.id}
                  className={
                    "scenario-card" +
                    (!unlocked ? " scenario-locked" : "") +
                    (completed ? " scenario-completed" : "")
                  }
                >
                  <div className="scenario-image-placeholder">
                    {scenario.image && (
                      <img
                        src={scenario.image}
                        alt={scenario.title}
                        className="scenario-image"
                      />
                    )}
                  </div>

                  <div className="scenario-header">
                    <span className="scenario-id">سناریو {scenario.id}</span>
                    {!unlocked && <span className="lock-label">قفل</span>}
                    {completed && <span className="done-label">تمام شده</span>}
                  </div>

                  <h3 className="scenario-title">{scenario.title}</h3>
                  <p className="scenario-summary">
                    {isExpanded && (scenario.descriptionPreview || scenario.fullDescription)
                      ? scenario.descriptionPreview || scenario.fullDescription
                      : scenario.summary.slice(0, 70) + "…"}
                  </p>

                  <div className="scenario-actions">
                    <button
                      className="secondary"
                      onClick={() => {
                        if (!isExpanded) {
                          const timerKey = `scenario-desc:${scenario.id}`;
                          scenarioDescriptionTimerKeyRef.current = timerKey;
                          eventLogger.startTimer(timerKey);
                          eventLogger.log({
                            type: "reference_open",
                            scenarioId: scenario.id,
                            action: "scenario_full_description",
                            detail: { source: "scenario_description" },
                          });
                        } else if (scenarioDescriptionTimerKeyRef.current) {
                          const elapsed = eventLogger.stopTimer(scenarioDescriptionTimerKeyRef.current);
                          eventLogger.log({
                            type: "reference_close",
                            scenarioId: scenario.id,
                            action: "scenario_full_description",
                            elapsedMs: elapsed,
                            detail: { source: "scenario_description" },
                          });
                          scenarioDescriptionTimerKeyRef.current = null;
                        }
                        setExpandedScenarioId(isExpanded ? null : scenario.id);
                      }}
                    >
                      {isExpanded ? "بستن توضیح" : "نمایش توضیحات کامل"}
                    </button>

                    <button
                      disabled={!unlocked}
                      onClick={() => handleOpenScenario(scenario.id)}
                    >
                      {unlocked ? "شروع سناریو" : "قفل شده"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );


const renderScenarioPlay = () => {
  if (activeScenarioId == null) return null;

  // سناریوی فعال
  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId)!;
  const introModalStyle = scenario.introBackgroundImage
    ? { backgroundImage: `linear-gradient(90deg, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.68)), url(${scenario.introBackgroundImage})` }
    : undefined;

  // اگر سناریو درخت دارد، از ScenarioRunner استفاده می‌کنیم
  const scenarioTreeId = SCENARIO_TREE_IDS[scenario.id];
  const scenarioLogId = scenarioTreeId ?? scenario.id;
  const isScenarioStartNode =
    !scenarioTreeId ||
    activeScenarioNodeId == null ||
    activeScenarioNodeId === AllScenarios[scenarioTreeId].start;
  const isScenarioOne = scenarioTreeId === "s1_shadows_low_orbit";
  const isScenarioTwo = scenarioTreeId === "s2_silent_waves";
  const hideScenarioStopButton =
    Boolean(scenarioTreeId) &&
    (activeScenarioNodeId === "end" || scenarioCompletionUiActive);

  // فقط سناریوهایی که درخت ندارند از سیستم سؤال‌ها استفاده می‌کنند
  const questions: Question[] = scenarioTreeId
    ? []
    : SCENARIO_QUESTIONS[scenario.id] || [];

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div
      className={
        "screen scenario-play-screen" +
        (isScenarioOne || isScenarioTwo ? " scenario-one-play-screen" : "")
      }
    >
      {/* مودال اینترو در شروع سناریو */}
      {introModalText && (
        <div className="intro-modal-backdrop">
          <div
            className={"intro-modal" + (scenario.introBackgroundImage ? " intro-modal-with-bg" : "")}
            style={introModalStyle}
          >
            <h3>{scenario.introTitle ?? "شروع مسیر"}</h3>
            <p className="intro-modal-text">{introModalText}</p>
            <button className="primary" onClick={() => setIntroModalText(null)}>
              شروع
            </button>
          </div>
        </div>
      )}

      {/* منوی سمت چپ */}
      <div
        className={
          "scenario-side-menu" + (scenarioMenuOpen ? " open" : " closed")
        }
      >
        <button
          className="side-menu-toggle"
          onClick={() => setScenarioMenuOpen((v) => !v)}
        >
          {scenarioMenuOpen ? "⟵" : "☰"}
        </button>

        {scenarioMenuOpen && (
          <div className="side-menu-content">
            <h3>منوی سناریو</h3>
            <button onClick={leaveScenarioToMainMenu}>
              بازگشت به منوی اصلی
            </button>
            <button onClick={leaveScenarioToList}>
              بازگشت به لیست سناریوها
            </button>
            <button onClick={() => eventLogger.exportToText()}>
              دانلود لاگ رفتار
            </button>
            <button className="danger" onClick={handleExit}>
              خروج
            </button>
          </div>
        )}
      </div>

      {/* بدنه اصلی سناریو */}
      <div
        className={
          "card scenario-play-card" +
          (isScenarioOne || isScenarioTwo ? " scenario-one-play-card" : "")
        }
      >
        {!isScenarioOne && !isScenarioTwo && (
        <div className="screen-header">
          <div>
            <h2 className="screen-title">{scenario.title}</h2>
            {isScenarioStartNode && (
              <p className="subtitle">{scenario.summary}</p>
            )}
          </div>
          <div className="profile-badge-inline">
            پروفایل: <strong>{activeProfile.name}</strong>{" "}
            <span className="badge">
              {activeProfile.role === "admin" ? "ادمین" : "بازیکن"}
            </span>
          </div>
        </div>
        )}

        {/* اگر درخت داریم، موتور درخت تصمیم را نشان بده */}
        {scenarioTreeId ? (
          <>
            {scenario.id === 0 && isScenarioStartNode && (
              <p className="hint">
                 این سناریو به جهت تست سناریو 0 به هدف معرفی نظریه بازی و بازی جنگ بالاخص بازی جنگ فضایی طراحی شده است.
              </p>
            )}

            <ScenarioRunner
              scenarioId={scenarioTreeId}
              onNodeChange={handleScenarioNodeChange}
              onCompletionUiActiveChange={setScenarioCompletionUiActive}
              allowSkipToMiniGame={activeProfile.role === "admin"}
              userProfileId={activeProfile.id}
              onExit={handleFinishScenario}
            />

            {!hideScenarioStopButton && (
              <div className="scenario-footer">
                <button className="danger" onClick={handleStopScenario}>
                  توقف سناریو
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* نسخه‌ی قدیمی مبتنی بر سؤال‌ها */}
            <div className="scenario-body">
              <p className="hint">
                این صفحه فعلاً شامل یک سؤال در هر مرحله است. بعداً MiniGame و
                درخت تصمیم اضافه می‌شود.
              </p>

              {currentQuestion ? (
                <div className="question-block">
                  <div className="question-header">
                    <span>سؤال {currentQuestionIndex + 1}</span>
                    {totalQuestions > 1 && (
                      <span className="question-progress">
                        {currentQuestionIndex + 1} / {totalQuestions}
                      </span>
                    )}
                  </div>

                  <p className="question-text">{currentQuestion.text}</p>

                  <div className="options-grid">
                    {currentQuestion.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={
                          "option-card" +
                          (selectedOptionIndex === idx
                            ? " option-card-selected"
                            : "")
                        }
                        onClick={() => {
                          setSelectedOptionIndex(idx);
                          eventLogger.log({
                            type: "option_select",
                            scenarioId: scenarioLogId,
                            detail: {
                              questionId: currentQuestion.id,
                              optionIndex: idx,
                              optionText: opt,
                            },
                          });
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="hint">برای این سناریو هنوز سؤال ثبت نشده.</p>
              )}
            </div>

            <div className="scenario-footer">
              {!(totalQuestions > 0 && answeredCount >= totalQuestions) && (
                <button className="danger" onClick={handleStopScenario}>
                  توقف سناریو
                </button>
              )}
              <button
                onClick={() => handleConfirmAnswer(totalQuestions)}
                disabled={selectedOptionIndex == null || !currentQuestion}
              >
                تأیید گزینه
              </button>

              <button
                className="primary"
                onClick={handleFinishScenario}
                disabled={totalQuestions > 0 && answeredCount < totalQuestions}
              >
                پایان سناریو
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};



  return (
    <div className="app-root">
      {showBackgroundVideo && (
        <video
          className="background-video"
          src="/mainMenuVideo.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      {view === "mainMenu" && renderMainMenu()}
      {view === "profileManager" && renderProfileManager()}
      {view === "adminAnalytics" && renderAdminAnalytics()}
      {view === "scenarioList" && renderScenarioList()}
      {view === "scenarioPlay" && renderScenarioPlay()}

      {/* Global quick menu to access navigation and log download anywhere */}
      <div
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column-reverse",
          alignItems: "flex-end",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={() => setGlobalMenuOpen((v) => !v)}
          style={{
            width: "48px",
            height: "48px",
            padding: 0,
            borderRadius: "50%",
            border: "1px solid var(--border-soft)",
            background: "rgba(15, 23, 42, 0.85)",
            color: "var(--text-main)",
            cursor: "pointer",
            fontSize: "1.25rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="منوی سریع"
          title="منوی سریع"
        >
          {globalMenuOpen ? "✕" : "⚙"}
        </button>

        {globalMenuOpen && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.92)",
              border: "1px solid var(--border-soft)",
              borderRadius: "12px",
              padding: "0.75rem",
              minWidth: "200px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <button onClick={() => leaveScenarioGeneric("mainMenu", "global_menu_main")}>
              منوی اصلی
            </button>
            <button onClick={() => leaveScenarioGeneric("scenarioList", "global_menu_list")}>
              لیست سناریوها
            </button>
            <button onClick={() => leaveScenarioGeneric("profileManager", "global_menu_profile")}>
              مدیریت پروفایل
            </button>
            <button onClick={handleDownloadLog}>دانلود لاگ رفتار (CSV)</button>
            <button className="danger" onClick={handleExit}>
              خروج
            </button>
          </div>
        )}
      </div>

      {activeProfile.role === "admin" && import.meta.env.DEV && (
        <div
          style={{
            position: "fixed",
            left: "1rem",
            bottom: "1rem",
            display: "flex",
            gap: "0.5rem",
            zIndex: 2000,
          }}
        >
          <button
            onClick={handleToggleLogging}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid var(--border-soft)",
              background: "rgba(15, 23, 42, 0.85)",
              color: "var(--text-main)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
              cursor: "pointer",
            }}
          >
            {loggingEnabled ? "stop logging" : "start logging"}
          </button>
          <button
            onClick={() => importLogInputRef.current?.click()}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid var(--border-soft)",
              background: "rgba(15, 23, 42, 0.85)",
              color: "var(--text-main)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
              cursor: "pointer",
            }}
          >
            Import log CSV
          </button>
          <button
            onClick={() => eventLogger.clear()}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid var(--border-soft)",
              background: "rgba(15, 23, 42, 0.85)",
              color: "var(--text-main)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
              cursor: "pointer",
            }}
          >
            Reset log
          </button>
          <input
            ref={importLogInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await handleImportLogFile(file);
              event.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
};

export default App;
