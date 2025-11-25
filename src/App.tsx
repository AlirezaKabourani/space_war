import { useState } from "react";
import "./App.css";

import { ScenarioRunner } from "./ui/components/scenario/ScenarioRunner";
import type { ScenarioId } from "./scenarios";

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
  | "profileManager";

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

  const activeProfile = profiles.find((p) => p.id === activeProfileId)!;
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

  const handleConfirmAnswer = (totalQuestions: number) => {
  if (selectedOptionIndex == null) return;

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

    if (!isScenarioUnlocked(activeProfile, scenarioIndex)) {
      return;
    }

    setActiveScenarioId(scenarioId);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setAnsweredCount(0);
    setIntroModalText(SCENARIOS[scenarioIndex].introText ?? null);
    setScenarioMenuOpen(false);
    setView("scenarioPlay");
  };

  const handleFinishScenario = () => {
    if (activeScenarioId == null) return;

    const scenarioIndex = SCENARIOS.findIndex(
      (s) => s.id === activeScenarioId
    );
    if (scenarioIndex === -1) return;

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

  const handleExit = () => {
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
                      onClick={() =>
                        setExpandedScenarioId(isExpanded ? null : scenario.id)
                      }
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
            <button onClick={() => setView("mainMenu")}>
              بازگشت به منوی اصلی
            </button>
            <button onClick={() => setView("scenarioList")}>
              بازگشت به لیست سناریوها
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
              onExit={() => {
                setView("scenarioList");
                setActiveScenarioId(null);
              }}
            />

            <div className="scenario-footer">
              <button className="primary" onClick={handleFinishScenario}>
                اتمام سناریو و باز کردن بعدی
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
                        onClick={() => setSelectedOptionIndex(idx)}
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
                اتمام سناریو و باز کردن بعدی
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
      {view === "scenarioList" && renderScenarioList()}
      {view === "scenarioPlay" && renderScenarioPlay()}
    </div>
  );
};

export default App;
