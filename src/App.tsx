import { useEffect, useRef, useState } from "react";
import "./App.css";

import { ScenarioRunner } from "./ui/components/scenario/ScenarioRunner";
import type { ScenarioId } from "./scenarios";
import { eventLogger } from "./services/analytics/eventLogger";

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
  summary: string;
  fullDescription?: string;
  introText?: string;
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
    title: "سایه‌های مدار پایین",
    summary: "پایش ماهواره‌ها و حفظ پوشش اطلاعاتی در مدار پایین زمین.",
    image: "/images/scenario1.png",
    fullDescription: `در مدار پایین زمین، نبردی خاموش در جریان است؛ ماهواره‌ها در ظاهر برای علم و ارتباط پرتاب می‌شوند، اما هر حرکت می‌تواند معنایی پنهان داشته باشد. در این سناریو، شما فرمانده عملیات اطلاعاتی ایران هستید. مأموریتتان ساده به نظر می‌رسد: حفظ پوشش اطلاعاتی در چند منطقه کلیدی. اما هر تصمیم شما، می‌تواند تفاوت بین «اشراف فضایی» و «کور شدن میدان نبرد» باشد. آیا می‌توانید پیش از دشمن، حرکت بعدی او را ببینید؟ `
  },
  {
    id: 2,
    title: "امواج خاموش",
    summary: "حفاظت از لینک‌های ارتباطی در برابر حملات اخلال‌گر.",
    image: "/images/scenario2.png",
    fullDescription: `همه‌چیز در چند دقیقه تغییر می‌کند؛ سامانه‌های ناوبری دچار اختلال شده‌اند و ناوگان لجستیکی کشور در حال از دست دادن هماهنگی است. دشمن هیچ نشانه‌ای از خود بر جای نگذاشته، اما اثرش همه‌جا دیده می‌شود. حالا تصمیم با شماست — آیا مسیرها را تغییر می‌دهید؟ آیا به سامانه‌های پشتیبان اعتماد دارید؟ در «امواج خاموش»، زمان علیه شماست و تنها با هوش، تحلیل و تصمیم‌گیری سریع می‌توانید نظم را بازگردانید.`
  },
  {
    id: 3,
    title: "لبه بازدارندگی",
    summary: "مدیریت زمان و منابع برای دریافت تصاویر کلیدی از منطقه هدف.",
    image: "/images/scenario3.png",
    fullDescription: `بحرانی در حال شکل‌گیری است. دشمن با مانورهای تهدیدآمیز و عملیات سایبری مرزهای تحمل را آزمایش می‌کند. شما باید بین پاسخ سخت، هشدار نرم یا سکوت حساب‌شده یکی را برگزینید. هر حرکت شما، بازتابی جهانی دارد؛ از میدان نبرد تا میز مذاکرات. «لبه بازدارندگی» میدان آزمون رهبران راهبردی است — جایی که هوش دیپلماتیک، درک روان دشمن، و قدرت تصمیم‌گیری چندبعدی تعیین می‌کند چه کسی بحران را مهار می‌کند و چه کسی آن را می‌سوزاند.`
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
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState<boolean>(false);
  const [introModalText, setIntroModalText] = useState<string | null>(null);
  const showBackgroundVideo = view !== "scenarioPlay";
  const scenarioTimerKeyRef = useRef<string | null>(null);
  const scenarioLogIdRef = useRef<string | number | null>(null);
  const questionTimerKeyRef = useRef<string | null>(null);
  const [globalMenuOpen, setGlobalMenuOpen] = useState(false);
  const [selectedAnalyticsUserId, setSelectedAnalyticsUserId] = useState<string>("all");
  const [selectedScenarioRunId, setSelectedScenarioRunId] = useState<string>("all");
  const [showAnalyticsLog, setShowAnalyticsLog] = useState(false);
  const scenarioDescriptionTimerKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setSelectedScenarioRunId("all");
  }, [selectedAnalyticsUserId]);

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
      const runs: Array<{ runId: string; label: string; startTs: number; endTs: number; scenarioId: string }> = [];

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
    const selectedSummary =
      selectedAnalyticsUserId === "all"
        ? null
        : users.find((user) => user.userId === selectedAnalyticsUserId) ?? null;
    const maxTypeCount = Math.max(...insights.eventTypeCounts.map((x) => x.count), 1);
    const maxThinkingMs = Math.max(...insights.questionThinking.map((x) => x.ms), 1);
    const totalAnswers = Math.max(insights.correctAnswers, 0) + Math.max(insights.answeredQuestions - insights.correctAnswers, 0);
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

    return (
      <div className="screen">
        <div className="card">
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
              disabled={selectedAnalyticsUserId === "all"}
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

          <div className="analytics-grid">
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

          <div className="analytics-grid">
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
          </div>

          <div className="analytics-grid">
            <div className="analytics-stat">
              <span>میانگین مدت اجرای سناریو</span>
              <strong>{insights.avgScenarioDurationSec} ثانیه</strong>
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
                    {isExpanded && scenario.fullDescription
                      ? scenario.fullDescription
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

  // اگر سناریو درخت دارد، از ScenarioRunner استفاده می‌کنیم
  const scenarioTreeId = SCENARIO_TREE_IDS[scenario.id];
  const scenarioLogId = scenarioTreeId ?? scenario.id;

  // فقط سناریوهایی که درخت ندارند از سیستم سؤال‌ها استفاده می‌کنند
  const questions: Question[] = scenarioTreeId
    ? []
    : SCENARIO_QUESTIONS[scenario.id] || [];

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="screen scenario-play-screen">
      {/* مودال اینترو در شروع سناریو */}
      {introModalText && (
        <div className="intro-modal-backdrop">
          <div className="intro-modal">
            <h3>شروع مسیر</h3>
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
      <div className="card scenario-play-card">
        <div className="screen-header">
          <div>
            <h2 className="screen-title">{scenario.title}</h2>
            <p className="subtitle">{scenario.summary}</p>
          </div>
          <div className="profile-badge-inline">
            پروفایل: <strong>{activeProfile.name}</strong>{" "}
            <span className="badge">
              {activeProfile.role === "admin" ? "ادمین" : "بازیکن"}
            </span>
          </div>
        </div>

        {/* اگر درخت داریم، موتور درخت تصمیم را نشان بده */}
        {scenarioTreeId ? (
          <>
            <p className="hint">
              این سناریو با موتور درخت تصمیم اجرا می‌شود؛ هر انتخابت مسیر
              داستان را عوض می‌کند.
            </p>

            <ScenarioRunner
              scenarioId={scenarioTreeId}
              onExit={handleFinishScenario}
            />

            <div className="scenario-footer">
              <button className="danger" onClick={handleStopScenario}>
                توقف سناریو
              </button>
            </div>
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
          top: "1rem",
          right: "1rem",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={() => setGlobalMenuOpen((v) => !v)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "999px",
            border: "1px solid var(--border-soft)",
            background: "rgba(15, 23, 42, 0.85)",
            color: "var(--text-main)",
            cursor: "pointer",
          }}
        >
          {globalMenuOpen ? "✕" : "☰"} منوی سریع
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

      {activeProfile.role === "admin" && (
        <button
          onClick={() => eventLogger.clear()}
          style={{
            position: "fixed",
            left: "1rem",
            bottom: "1rem",
            padding: "0.45rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid var(--border-soft)",
            background: "rgba(15, 23, 42, 0.85)",
            color: "var(--text-main)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
            cursor: "pointer",
            zIndex: 2000,
          }}
        >
          Reset log
        </button>
      )}
    </div>
  );
};

export default App;
