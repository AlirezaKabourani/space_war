import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import "./ui/components/admin/CrossScenarioCognitiveDashboard.css";

import { ScenarioRunner } from "./ui/components/scenario/ScenarioRunner";
import { AllScenarios, type ScenarioId } from "./scenarios";
import { eventLogger } from "./services/analytics/eventLogger";
import scenario2IntroBackground from "../assets/s2/A1.png";
import { SCENARIO4_ENTRY_COPY_FA } from "./ui/components/scenario/scenario-four/narrative/narrativeCatalogFa";
import { canDeleteProfile, createPlayerProfile, validateProfileInput, type Profile, type ProfileInput, type ProfileFormErrors } from "./core/types/profile";
import { deleteProfile, loadProfileState, saveProfileState, selectProfile } from "./services/storage/profileStorage";
import { ProfileCreateForm } from "./ui/components/profile/ProfileCreateForm";
import { AdminLoginForm } from "./ui/components/profile/AdminLoginForm";
import { SystemManagement } from "./ui/components/admin/SystemManagement";
import { SuggestionsManagement } from "./ui/components/admin/SuggestionsManagement";
import { SuggestionForm } from "./ui/components/suggestions/SuggestionForm";
import { CrossScenarioCognitiveDashboard } from "./ui/components/admin/CrossScenarioCognitiveDashboard";
import { createCognitiveAdminReadAccess, revokeCognitiveAdminReadAccess, type CognitiveAdminReadAccess } from "./services/storage/cognitiveAdminReadAccess";
import { systemLogger } from "./services/analytics/systemLogger";
import { ScenarioZeroLearning } from "./ui/components/scenario/scenario-zero/ScenarioZeroLearning";
import { ScenarioFiveAdminDashboardPreview } from "./ui/components/scenario/scenario-five/ui/ScenarioFiveAdminDashboardPreview";

// TEMP-S5-DASHBOARD-PREVIEW: remove after dashboard design review.
const ENABLE_TEMP_SCENARIO_TWO_DASHBOARD_PREVIEW = true;

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
  badges?: readonly string[];
  ctaLabel?: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
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
  2: "s2_silent_waves",
  3: "s3_secure_corridor",
  4: "s4_redesigned_scenario_one",
  5: "s5_silent_waves_redesign",
};


type View =
  | "mainMenu"
  | "scenarioList"
  | "scenarioPlay"
  | "profileManager"
  | "scenarioSuggestion"
  | "generalSuggestion"
  | "suggestionsManagement"
  | "systemManagement";

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
    summary: "مأموریت ۸ راندی مدیریت کاروان‌ها؛ اختلال GNSS از یک هشدار مبهم به تهدید عملیاتی آشکار تبدیل می‌شود.",
    image: "/images/scenario2.png",
    descriptionPreview: `چهار کاروان طبق برنامه در حال حرکت‌اند. ابتدا همه‌چیز عادی است، اما یک اختلاف کوچک در داده‌های ناوبری دیده می‌شود. شما باید محل اختلال را پیدا کنید، مسیرهای امن را مدیریت کنید و هم‌زمان شبکه لجستیک را زنده نگه دارید.`,
    fullDescription: `در این نسخه مأموریت‌محور، شما فرمانده قرارگاه لجستیک هستید. مأموریت اصلی، رساندن همه کاروان‌ها به مقصد تا پایان راند ۸ است. برای موفقیت باید اختلال را به‌موقع شناسایی کنید، مسیرهای امن طراحی کنید، منابع ISR/انرژی/زمان را حفظ کنید، کاروان‌ها را رها نکنید و در صورت آشکار شدن تهدید با مسیر یا منبع اختلال مقابله کنید.`,
    introBackgroundImage: scenario2IntroBackground,
    introText: `شما فرمانده قرارگاه لجستیک هستید. چهار کاروان حیاتی و پشتیبانی در مسیرهای مختلف کشور در حال حرکت‌اند. هر کاروان مقصد و مأموریت خودش را دارد و در آغاز هیچ‌کدام به‌عنوان هدف اصلی تهدید شناخته نشده است.

در آغاز همه‌چیز عادی است؛ اما یک اختلال خاموش در داده‌های ناوبری ظاهر می‌شود. ابتدا فقط یک اختلاف کوچک میان گزارش میدانی و GNSS دیده می‌شود. شما باید بدون فرض زودهنگام، محل واقعی اختلال را پیدا کنید.

مأموریت شما در ۸ راند پیش می‌رود: پایش روتین، کشف محل اختلال، پایش مسیر مشکوک، طراحی مسیر امن، مدیریت توقف‌ها و پشتیبانی، تقسیم منابع، مقابله با تهدید آشکار و نتیجه نهایی.

هدف اصلی روشن است: تمام کاروان‌ها باید تا پایان راند ۸ به مقصد برسند. باید منابع را پیش از راندهای پایانی تمام نکنید و اگر یک کاروان به‌عنوان محموله در خطر آشکار شد، آن را بدون رها کردن بقیه شبکه نجات دهید.

در «امواج خاموش»، دشمن دیده نمی‌شود، اما در داده‌ها، مسیرها و اعتماد شما به سامانه ناوبری حضور دارد. هر تصمیم باید روی نقشه دیده شود، منبع مصرف کند و در پایان قابل توضیح باشد.`
  },
  {
    id: 3,
    title: "۳- کریدور امن",
    introTitle: "سناریو ۳ — کریدور امن",
    summary: "در نبردهای آینده، فاصله میان موفقیت و شکست همیشه روی زمین تعیین نمی‌شود.",
    image: "/images/scenario3.png",
    introBackgroundImage: "/images/scenario3.png",
    introText: `یک محموله حساس باید از چند محوطه عملیاتی عبور کند. شما فرمانده مستقیم محموله نیستید؛ نقش شما هدایت، پایش و هشداردهی ماهواره‌ای است.

در هر محوطه فقط بخشی از نقشه روشن است. باید با اسکن، مصرف کارت‌های یک‌بارمصرف، استفاده از قابلیت‌های تیم ماهواره‌ای و انتخاب مسیر، محموله را تا خروجی هدایت کنید.

هدف فعلی: عبور از کریدورهای ناشناخته با حفظ سلامت محموله، کنترل سطح افشا و نگه داشتن کیفیت داده‌ها.`,
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
    title: SCENARIO4_ENTRY_COPY_FA.title,
    introTitle: SCENARIO4_ENTRY_COPY_FA.title,
    summary: SCENARIO4_ENTRY_COPY_FA.subtitle,
    image: "/images/scenario4.png",
    descriptionPreview: SCENARIO4_ENTRY_COPY_FA.shortDescription,
    fullDescription: `${SCENARIO4_ENTRY_COPY_FA.subtitle}\n\n${SCENARIO4_ENTRY_COPY_FA.shortDescription}`,
    badges: SCENARIO4_ENTRY_COPY_FA.badges,
    ctaLabel: SCENARIO4_ENTRY_COPY_FA.cta,
  },
  {
    id: 5,
    title: "امواج خاموش — نسخه بازطراحی",
    introTitle: `سناریو ۲ — امواج خاموش`,
    summary: `چهار کاروان در شبکه لجستیکی در حرکت‌اند. ناهمخوانی‌های PNT/GNSS به‌تدریج ظاهر می‌شوند؛ با منابع محدود باید تصویر اطلاعاتی قابل اتکایی بسازید، تداوم شبکه را حفظ کنید و محموله اولویت‌دار را از دست ندهید.`,
    image: "/images/scenario2.png",
    badges: ["لجستیک چندمسیره", "اختلال", "منابع محدود", "شواهد متعارض"],
    descriptionPreview: `چهار کاروان به‌طور هم‌زمان در چهار کریدور عملیاتی حرکت می‌کنند. نشانه‌های موقعیتی و گزارش‌های میدانی ممکن است با هم ناسازگار شوند. شما باید بدون فرض زودهنگام، شواهد را بررسی کنید، منابع محدود را مدیریت کنید و بین حفاظت از محموله اولویت‌دار و تداوم کل شبکه تعادل برقرار کنید.`,
    fullDescription: `در نقش فرمانده شبکه لجستیکی، چهار کاروان را در شرایط ابهام اطلاعاتی و اختلال احتمالی PNT هدایت می‌کنید. کاروان الف حامل تجهیزات درمانی اضطراری و از نظر مأموریتی اولویت‌دار است؛ این اولویت به معنی آن نیست که از ابتدا بدانید کدام کاروان یا کریدور هدف اختلال است. تصمیم‌های شما زمان عملیاتی و منابع ISR یا پشتیبانی مصرف می‌کنند. منابع محدودند و نحوه مصرف آنها بر ظرفیت باقی‌مانده، تاب‌آوری و نتیجه مأموریت اثر می‌گذارد. هدف، ساختن تصویر اطلاعاتی قابل دفاع، حفظ تداوم شبکه و مدیریت تحویل کاروان‌ها تحت عدم‌قطعیت است.`,
    introBackgroundImage: scenario2IntroBackground,
    introText: `شما فرمانده شبکه لجستیکی هستید. چهار کاروان به‌طور هم‌زمان در چهار کریدور عملیاتی در حرکت‌اند. کاروان الف حامل تجهیزات درمانی اضطراری و از نظر مأموریتی اولویت‌دار است؛ اما این اولویت، شاهدی درباره محل یا هدف اختلال نیست.

در طول مأموریت ممکن است میان داده‌های موقعیت ماهواره‌ای، گزارش‌های میدانی و زمان‌بندی ارتباطی ناهمخوانی ایجاد شود. در ابتدا مشخص نیست این ناهمخوانی ناشی از اختلال هدفمند، عامل غیرخصمانه یا ترکیبی از چند عامل است.

مأموریت شما در چهار فاز و هشت تصمیم پیش می‌رود: ابتدا تصویر مبنا می‌سازید، سپس نشانه‌ها را بررسی می‌کنید، مسیرها و منابع را تحت فشار مدیریت می‌کنید و در پایان درباره تداوم و تحویل شبکه تصمیم می‌گیرید.

هدف شما پیدا کردن یک «پاسخ از پیش معلوم» نیست. باید فقط بر اساس اطلاعاتی که در همان لحظه در اختیار دارید تصمیم بگیرید، شواهد تازه را در نظر بگیرید و توان واکنش برای مراحل بعد را حفظ کنید.

PNT یعنی «موقعیت‌یابی، ناوبری و زمان‌بندی»؛ یعنی اطلاعاتی که برای دانستن موقعیت، مسیر حرکت و زمان دقیق به کار می‌رود.
GNSS خانواده سامانه‌های ناوبری ماهواره‌ای مانند GPS است و یکی از منابع مهم PNT محسوب می‌شود.
ISR در این سناریو ظرفیت شناسایی، مراقبت و جمع‌آوری اطلاعات است.`
  }
];

const RELEASED_SCENARIO_IDS = [0, 4, 5] as const;
const RELEASED_SCENARIO_TITLES: Record<number, string> = {
  0: "آستانه ورود",
  4: "۱ — حریم خاکستری مدار",
  5: "۲ — امواج خاموش",
};

interface ScenarioCatalogEntry {
  scenario: Scenario;
  displayId: number;
  displayTitle: string;
}

const getScenarioCatalog = (profile: Profile): ScenarioCatalogEntry[] => {
  if (profile.scenarioCatalog === "full") {
    return SCENARIOS.map((scenario) => ({
      scenario,
      displayId: scenario.id,
      displayTitle: scenario.title,
    }));
  }

  return RELEASED_SCENARIO_IDS.map((scenarioId, displayId) => {
    const scenario = SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} is missing from the catalog.`);
    }

    return {
      scenario,
      displayId,
      displayTitle: RELEASED_SCENARIO_TITLES[scenarioId],
    };
  });
};

const getProfileTypeLabel = (profile: Profile) => {
  if (profile.role === "admin") return "ادمین";
  if (profile.scenarioCatalog === "full") return "تست سناریو";
  return "بازیکن";
};


const App = () => {
  const [profileState, setProfileState] = useState(() => loadProfileState(SCENARIOS.length));
  const { profiles, activeProfileId } = profileState;
  const profileStateRef = useRef(profileState);
  profileStateRef.current = profileState;
  const cognitiveAdminAccessRef = useRef<CognitiveAdminReadAccess | null>(null);
  const [cognitiveDashboardTargetId, setCognitiveDashboardTargetId] = useState<string | null>(null);
  const cognitiveDashboardTriggerRef = useRef<HTMLButtonElement | null>(null);
  const cognitiveDashboardReturnProfileRef = useRef<string | null>(null);
  const [profileStorageError, setProfileStorageError] = useState<string | null>(null);
  const [profileDeletionError, setProfileDeletionError] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const adminProfileButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    try {
      saveProfileState(profileState);
      setProfileStorageError(null);
    } catch {
      setProfileStorageError("ذخیره اطلاعات پروفایل انجام نشد؛ فضای ذخیره‌سازی مرورگر را بررسی کنید. تغییرات فعلی با بستن صفحه از دست می‌روند.");
    }
  }, [profileState]);
  const [view, setView] = useState<View>("mainMenu");
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [activeScenarioNodeId, setActiveScenarioNodeId] = useState<string | null>(null);
  const [scenarioCompletionUiActive, setScenarioCompletionUiActive] = useState(false);
  const [scenarioFivePreviewOpen, setScenarioFivePreviewOpen] = useState(false); // TEMP-S5-DASHBOARD-PREVIEW
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState<boolean>(false);
  const [introModalText, setIntroModalText] = useState<string | null>(null);
  const showBackgroundVideo = view !== "scenarioPlay";
  const scenarioTimerKeyRef = useRef<string | null>(null);
  const scenarioLogIdRef = useRef<string | number | null>(null);
  const questionTimerKeyRef = useRef<string | null>(null);
  const [globalMenuOpen, setGlobalMenuOpen] = useState(false);
  const scenarioDescriptionTimerKeyRef = useRef<string | null>(null);
  const handleScenarioNodeChange = useCallback((nodeId: string) => {
    setActiveScenarioNodeId(nodeId);
    if (nodeId !== "end") {
      setScenarioCompletionUiActive(false);
    }
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId)!;
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      systemLogger.log("application_error", activeProfile, { message: event.message, filename: event.filename, line: event.lineno });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      systemLogger.log("unhandled_rejection", activeProfile, { message: event.reason instanceof Error ? event.reason.message : String(event.reason) });
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [activeProfile]);
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
  const handleSelectProfile = async (id: string) => {
    const target = profiles.find((profile) => profile.id === id);
    if (!target) return;
    if (target.role === "admin") {
      setShowAdminLogin(true);
      return;
    }
    setProfileDeletionError(null);
    setShowAdminLogin(false);
    revokeCognitiveAdminReadAccess(cognitiveAdminAccessRef.current);
    cognitiveAdminAccessRef.current = null;
    setCognitiveDashboardTargetId(null);
    setProfileState(await selectProfile(profileStateRef.current, id));
    systemLogger.log("profile_selected", target);
    setView("mainMenu");
  };

  const handleAdminLogin = async (password: string): Promise<boolean> => {
    const currentState = profileStateRef.current;
    const nextState = await selectProfile(currentState, "admin", password);
    if (nextState === currentState || profileStateRef.current !== currentState) {
      systemLogger.log("admin_login_failed");
      return false;
    }
    systemLogger.log("admin_login_succeeded", nextState.profiles.find((profile) => profile.id === "admin"));
    revokeCognitiveAdminReadAccess(cognitiveAdminAccessRef.current);
    cognitiveAdminAccessRef.current = createCognitiveAdminReadAccess(() => profileStateRef.current);
    setProfileState(nextState);
    setProfileDeletionError(null);
    setShowAdminLogin(false);
    setView("mainMenu");
    return true;
  };

  const handleDeleteProfile = (profile: Profile) => {
    if (!canDeleteProfile(activeProfile, profile)) return;
    if (!window.confirm(`پروفایل «${profile.name}» و پیشرفت بازی آن حذف شود؟ این کار قابل بازگشت نیست.`)) return;
    const nextState = deleteProfile(profileState, profile.id);
    if (nextState === profileState) return;
    try {
      saveProfileState(nextState);
    } catch {
      setProfileDeletionError("پروفایل حذف نشد. فضای ذخیره‌سازی مرورگر را بررسی و دوباره تلاش کنید.");
      return;
    }
    setProfileState(nextState);
    setProfileDeletionError(null);
    systemLogger.log("profile_deleted", activeProfile, { profileId: profile.id, profileName: profile.name });
  };

  const handleCreateProfile = (input: ProfileInput): ProfileFormErrors => {
    const errors = validateProfileInput(input, profiles);
    if (Object.keys(errors).length) return errors;
    const profile = createPlayerProfile(input);
    const nextState = { profiles: [...profiles, profile], activeProfileId: profile.id };
    try {
      saveProfileState(nextState);
    } catch {
      return { form: "پروفایل ذخیره نشد. فضای ذخیره‌سازی مرورگر را بررسی و دوباره تلاش کنید." };
    }
    setProfileState(nextState);
    setShowAdminLogin(false);
    revokeCognitiveAdminReadAccess(cognitiveAdminAccessRef.current);
    cognitiveAdminAccessRef.current = null;
    setCognitiveDashboardTargetId(null);
    systemLogger.log("profile_created", profile);
    setView("mainMenu");
    return {};
  };

  const isScenarioUnlocked = (profile: Profile, catalogIndex: number) => {
    if (profile.role === "admin" || profile.scenarioCatalog === "full") return true;
    return catalogIndex <= profile.progress;
  };

  const isScenarioCompleted = (profile: Profile, catalogIndex: number) => {
    if (profile.role === "admin" || profile.scenarioCatalog === "full") return false;
    return catalogIndex < profile.progress;
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
    const scenarioCatalog = getScenarioCatalog(activeProfile);
    const catalogIndex = scenarioCatalog.findIndex(({ scenario }) => scenario.id === scenarioId);
    if (catalogIndex === -1) return;
    const scenario = scenarioCatalog[catalogIndex].scenario;
    const scenarioTreeId = SCENARIO_TREE_IDS[scenario.id];
    const scenarioLogId = scenarioTreeId ?? scenario.id;

    eventLogger.log({
      type: "scenario_card_click",
      scenarioId: scenarioLogId,
      detail: { unlocked: isScenarioUnlocked(activeProfile, catalogIndex) },
    });

    if (!isScenarioUnlocked(activeProfile, catalogIndex)) {
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

    const scenarioCatalog = getScenarioCatalog(activeProfile);
    const catalogIndex = scenarioCatalog.findIndex(
      ({ scenario }) => scenario.id === activeScenarioId
    );
    if (catalogIndex === -1) return;
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
    if (activeProfile.role === "player" && activeProfile.scenarioCatalog === "released") {
      setProfileState((current) => ({
        ...current,
        profiles: current.profiles.map((p) => {
          if (p.id !== activeProfile.id) return p;
          const nextProgress = Math.max(p.progress, catalogIndex + 1);
          return { ...p, progress: Math.min(nextProgress, scenarioCatalog.length) };
        }),
      }));
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
        <h1 className="app-title">سامانه راهبردی آموزش و شبیه‌ساز تصمیم سازی بازی جنگ فضایی</h1>
        <h2 className="screen-title">منو اصلی</h2>

        <div className="active-profile">
          <span>پروفایل فعال:</span>
          <strong>{activeProfile.name}</strong>
          <span className="badge">{getProfileTypeLabel(activeProfile)}</span>
        </div>

        <div className="menu-buttons">
          <button onClick={() => setView("scenarioList")}>شروع</button>
          <button onClick={() => setView("profileManager")}>ساخت / انتخاب پروفایل</button>
          {activeProfile.role === "admin" && <button onClick={() => setView("systemManagement")}>مدیریت سامانه</button>}
          <button onClick={() => setView("scenarioSuggestion")}>
            پیشنهاد سناریو
          </button>
          <button onClick={() => setView("generalSuggestion")}>
            پیشنهادات
          </button>
          <button className="danger" onClick={handleExit}>
            خروج
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfileManager = () => cognitiveDashboardTargetId !== null ? (
    <CrossScenarioCognitiveDashboard
      targetProfileId={cognitiveDashboardTargetId}
      access={cognitiveAdminAccessRef.current}
      profiles={profiles}
      onBack={() => {
        setCognitiveDashboardTargetId(null);
        requestAnimationFrame(() => cognitiveDashboardTriggerRef.current?.focus());
      }}
    />
  ) : (
    <div className="screen">
      <div className="card profile-manager-card">
        <div className="screen-header">
          <h2 className="screen-title">مدیریت پروفایل‌ها</h2>
          <button className="link" onClick={() => {
            setShowAdminLogin(false);
            setView("mainMenu");
          }}>
            بازگشت به منوی اصلی
          </button>
        </div>

        <p className="hint">
          پروفایل خود را بسازید یا برای ادامه بازی، یکی از پروفایل‌های موجود را انتخاب کنید.
        </p>

        <ProfileCreateForm onCreate={handleCreateProfile} />

        <h3 id="profile-list-title">انتخاب پروفایل موجود</h3>

        {activeProfile.role === "admin" && (
          <div style={{ marginBottom: "1rem" }}>
            <p className="hint">می‌توانید پروفایل‌ها را حذف کنید. پروفایل‌های «ادمین» و «تست سناریو» قابل حذف نیستند.</p>
            <button onClick={() => setView("systemManagement")}>مدیریت سامانه</button>
          </div>
        )}

        {profileDeletionError && <p className="profile-field-error" role="alert">{profileDeletionError}</p>}

        <div className="profile-list" role="group" aria-labelledby="profile-list-title">
          {profiles.map((profile) => (
            <div className="profile-list-entry" key={profile.id}>
              <div className="profile-row">
                <button
                  ref={profile.role === "admin" ? adminProfileButtonRef : undefined}
                  className={
                    "profile-item" +
                    (profile.id === activeProfileId ? " profile-item-active" : "")
                  }
                  onClick={() => handleSelectProfile(profile.id)}
                  aria-pressed={profile.id === activeProfileId}
                  aria-expanded={profile.role === "admin" ? showAdminLogin : undefined}
                >
                  <div className="profile-name">{profile.name}</div>
                  <div className="profile-meta">
                    نقش: {getProfileTypeLabel(profile)}
                  </div>
                  {profile.role === "player" && profile.scenarioCatalog === "released" && (
                    <div className="profile-progress">
                      پیشرفت: سناریوی بعدی باز = {profile.progress}
                    </div>
                  )}
                  {profile.scenarioCatalog === "full" && (
                    <div className="profile-progress">
                      دسترسی کامل به همه سناریوهای قدیمی و جدید
                    </div>
                  )}
                </button>
                {activeProfile.role === "admin" && cognitiveAdminAccessRef.current && (
                  <button type="button" className="secondary cross-profile-action" data-cognitive-dashboard-profile={profile.id}
                    aria-label={`مشاهده داشبورد شناختی تجمیعی برای ${profile.name}`}
                    ref={button => { if (profile.id === cognitiveDashboardReturnProfileRef.current) cognitiveDashboardTriggerRef.current = button; }}
                    onClick={event => {
                      cognitiveDashboardReturnProfileRef.current = profile.id;
                      cognitiveDashboardTriggerRef.current = event.currentTarget;
                      setCognitiveDashboardTargetId(profile.id);
                    }}>
                    مشاهده داشبورد شناختی تجمیعی
                  </button>
                )}
                {canDeleteProfile(activeProfile, profile) && (
                  <button
                    type="button"
                    className="danger profile-delete-button"
                    onClick={() => handleDeleteProfile(profile)}
                    aria-label={`حذف پروفایل ${profile.name}`}
                  >
                    حذف پروفایل
                  </button>
                )}
              </div>
              {profile.role === "admin" && showAdminLogin && (
                <AdminLoginForm
                  onLogin={handleAdminLogin}
                  onCancel={() => {
                    setShowAdminLogin(false);
                    adminProfileButtonRef.current?.focus();
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  const renderScenarioList = () => {
    const scenarioCatalog = getScenarioCatalog(activeProfile);
    const isFullCatalog = activeProfile.scenarioCatalog === "full";

    return (
    <div className="screen scenario-selection-screen">
      <div className="card scenario-selection-card">
        <div className="screen-header">
          <div>
            <h2 className="screen-title">انتخاب سناریو</h2>
            <p className="subtitle">
              پروفایل فعال: <strong>{activeProfile.name}</strong>{" "}
              <span className="badge">
                {getProfileTypeLabel(activeProfile)}
              </span>
            </p>
            <p className="scenario-catalog-note">
              {isFullCatalog
                ? "حالت آزمون: همه سناریوهای قدیمی و جدید در دسترس‌اند."
                : "مسیر اصلی نسخه فعلی سامانه شامل سه سناریو است."}
            </p>
          </div>
          <button className="link" onClick={() => setView("mainMenu")}>
            بازگشت به منوی اصلی
          </button>
        </div>

        <div className={`scenario-grid ${isFullCatalog ? "scenario-grid--full" : "scenario-grid--released"}`}>
          {scenarioCatalog.map(({ scenario, displayId, displayTitle }, index) => {
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
                        alt={displayTitle}
                        className="scenario-image"
                      />
                    )}
                  </div>

                  <div className="scenario-header">
                    <span className="scenario-id">سناریو {displayId}</span>
                    {!unlocked && <span className="lock-label">قفل</span>}
                    {completed && <span className="done-label">تمام شده</span>}
                  </div>

                  <h3 className="scenario-title">{displayTitle}</h3>
                  <p className="scenario-summary">
                    {isExpanded
                      ? scenario.fullDescription || scenario.descriptionPreview || scenario.summary
                      : (() => {
                          const preview = scenario.descriptionPreview || scenario.summary;
                          return preview.length > 140 ? `${preview.slice(0, 140)}…` : preview;
                        })()}
                  </p>
                  {scenario.badges && (
                    <div className="scenario-badges" aria-label="ویژگی‌های سناریو">
                      {scenario.badges.map((badge) => <span key={badge}>{badge}</span>)}
                    </div>
                  )}

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
                      {unlocked ? (scenario.ctaLabel ?? "شروع سناریو") : "قفل شده"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
  };


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
  const isScenarioZero = scenarioTreeId === "s0_gateway_space_wargaming";
  const isScenarioOne = scenarioTreeId === "s1_shadows_low_orbit";
  const isScenarioTwo = scenarioTreeId === "s2_silent_waves";
  const isScenarioFour = scenarioTreeId === "s4_redesigned_scenario_one";
  const isScenarioFive = scenarioTreeId === "s5_silent_waves_redesign";
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
        (isScenarioZero ? " scenario-zero-play-screen" : "") +
        (isScenarioOne || isScenarioTwo || isScenarioFour || isScenarioFive ? " scenario-one-play-screen" : "")
      }
    >
      {/* مودال اینترو در شروع سناریو */}
      {introModalText && !isScenarioZero && (
        <div className="intro-modal-backdrop">
          <div
            className={"intro-modal" + (scenario.introBackgroundImage ? " intro-modal-with-bg" : "") + (isScenarioFive && activeProfile.role === "admin" ? " s5-admin-intro" : "")}
            style={introModalStyle}
          >
            {ENABLE_TEMP_SCENARIO_TWO_DASHBOARD_PREVIEW && isScenarioFive && activeProfile.role === "admin" && (
              <>
                <button type="button" className="s5-admin-dashboard-shortcut" data-admin-s5-dashboard-shortcut title="پیش‌نمایش موقت داشبورد سناریو ۲" aria-label="پیش‌نمایش موقت داشبورد سناریو ۲" onClick={() => setScenarioFivePreviewOpen(true)}>داشبورد موقت</button>
                {scenarioFivePreviewOpen && <ScenarioFiveAdminDashboardPreview isAdmin={activeProfile.role === "admin"} onExit={() => setScenarioFivePreviewOpen(false)} />}
              </>
            )}
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
          (isScenarioOne || isScenarioTwo || isScenarioFour || isScenarioFive ? " scenario-one-play-card" : "")
        }
      >
        {!isScenarioZero && !isScenarioOne && !isScenarioTwo && !isScenarioFour && !isScenarioFive && (
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
              {getProfileTypeLabel(activeProfile)}
            </span>
          </div>
        </div>
        )}

        {/* اگر درخت داریم، موتور درخت تصمیم را نشان بده */}
        {scenarioTreeId ? (
          <>
            {isScenarioZero ? (
              <ScenarioZeroLearning
                introduction={scenario.introText ?? ""}
                userProfileId={activeProfile.id}
                onNodeChange={handleScenarioNodeChange}
                onComplete={handleFinishScenario}
              />
            ) : <ScenarioRunner
              scenarioId={scenarioTreeId}
              onNodeChange={handleScenarioNodeChange}
              onCompletionUiActiveChange={setScenarioCompletionUiActive}
              allowSkipToMiniGame={activeProfile.role === "admin"}
              userProfileId={activeProfile.id}
              onExit={handleFinishScenario}
            />}

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
    <div className={"app-root" + (view === "scenarioPlay" && activeScenarioId === 0 ? " app-root--scenario-zero" : "")}>
      {profileStorageError && <div className="profile-storage-error" role="alert">{profileStorageError}</div>}
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
      {(view === "scenarioSuggestion" || view === "generalSuggestion") && (
        <SuggestionForm key={`${activeProfile.id}:${view}`} activeProfile={activeProfile}
          kind={view === "scenarioSuggestion" ? "scenario" : "general"}
          onBack={() => setView("mainMenu")} />
      )}
      {view === "systemManagement" && (
        <SystemManagement
          activeProfile={activeProfile}
          profiles={profiles}
          onBack={() => setView("mainMenu")}
          onManageProfiles={() => setView("profileManager")}
          onManageSuggestions={() => setView("suggestionsManagement")}
          adminAccess={cognitiveAdminAccessRef.current}
        />
      )}
      {view === "suggestionsManagement" && activeProfile.role === "admin" && (
        <SuggestionsManagement
          profiles={profiles}
          adminAccess={cognitiveAdminAccessRef.current}
          onBack={() => setView("systemManagement")}
        />
      )}
      {view === "scenarioList" && renderScenarioList()}
      {view === "scenarioPlay" && renderScenarioPlay()}

      {/* Global quick navigation menu */}
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
            {activeProfile.role === "admin" && (
              <button onClick={() => leaveScenarioGeneric("systemManagement", "global_menu_system_management")}>مدیریت سامانه</button>
            )}
            <button className="danger" onClick={handleExit}>
              خروج
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default App;
