import { useEffect, useRef, useState } from "react";
import type { InfoNode, QuizNode } from "../../../../core/types/scenario";
import { S0_GatewayToSpaceWargaming as scenario } from "../../../../scenarios/s0_gateway_space_wargaming/tree";
import { eventLogger } from "../../../../services/analytics/eventLogger";
import { MiniGameHost } from "../MiniGameHost";
import { getLearningChapter, getLearningPath, learningChapters, learningLessons, prisonersProblem, quizFeedback, type LearningCard } from "./learningContent";
import { IntroductionDialog, LessonReading } from "./LessonReading";
import { QuestionReference } from "./QuestionReference";
import "./ScenarioZeroLearning.css";

interface ScenarioZeroLearningProps {
  introduction: string;
  userProfileId: string;
  onNodeChange: (nodeId: string) => void;
  onComplete: () => void;
}

const logInteraction = (nodeId: string, interactionId: string, selectionId: string) => {
  eventLogger.log({ type: "s0_learning_interaction", scenarioId: scenario.id, nodeId, detail: { interactionId, selectionId } });
};

const OriginalText = ({ nodeId, text, label = "متن کامل و جزئیات بیشتر" }: { nodeId: string; text: string; label?: string }) => (
  <details className="s0-original" onToggle={(event) => {
    eventLogger.log({ type: event.currentTarget.open ? "reference_open" : "reference_close", scenarioId: scenario.id, nodeId, action: "learning_full_text" });
  }}>
    <summary>{label}<span aria-hidden="true">＋</span></summary>
    <div>{text.split(/\n\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
  </details>
);

const MarketPrediction = () => {
  const [selection, setSelection] = useState<number | null>(null);
  return (
    <div className="s0-experiment">
      <span className="s0-eyebrow">موقعیت را از دیدگاه تصمیم‌گیرنده بررسی کنید</span>
      <h3>اگر قیمت محصول خود را کاهش دهید، واکنش رقیب چه خواهد بود؟</h3>
      <div className="s0-choice-grid">
        {["ممکن است او هم قیمت را پایین بیاورد", "نتیجه فقط به انتخاب من بستگی دارد"].map((text, index) => (
          <button key={text} className={selection === index ? "is-selected" : ""} aria-pressed={selection === index} onClick={() => {
            setSelection(index); logInteraction("gameTheoryIntro", "market_prediction", String(index));
          }}>{text}</button>
        ))}
      </div>
      {selection !== null && <p className="s0-insight" role="status">{selection === 0 ? "پاسخ صحیح است؛ رقیب نیز امکان انتخاب دارد. کاهش قیمت از سوی هر دو طرف ممکن است سود هر دو را کاهش دهد." : "واکنش رقیب نیز بر نتیجه اثر دارد؛ او می‌تواند در پاسخ به کاهش قیمت، تصمیم خود را تغییر دهد."} این وابستگی، از مفاهیم اصلی نظریه بازی است.</p>}
    </div>
  );
};

const PrisonersDilemma = () => {
  const [choices, setChoices] = useState<[number | null, number | null]>([null, null]);
  const ready = choices.every((choice) => choice !== null);
  const outcome = choices[0] === choices[1] ? (choices[0] === 0 ? [1, 1] : [5, 5]) : choices[0] === 1 ? [0, 10] : [10, 0];
  return (
    <div className="s0-experiment">
      <span className="s0-eyebrow">ترکیب انتخاب‌ها و پیامدهای آن را بررسی کنید</span>
      <div className="s0-prisoners">
        {[0, 1].map((person) => <div key={person} className="s0-person">
          <h3>نفر {person === 0 ? "اول" : "دوم"}</h3>
          <div className="s0-choice-grid">{["سکوت", "اعتراف"].map((choice, index) => <button key={choice} aria-label={`نفر ${person === 0 ? "اول" : "دوم"}: ${choice}`} aria-pressed={choices[person] === index} className={choices[person] === index ? "is-selected" : ""} onClick={() => {
            setChoices((current) => person === 0 ? [index, current[1]] : [current[0], index]);
            logInteraction("gameTheoryExample", "prisoners_choice", `${person}:${choice}`);
          }}>{choice}</button>)}</div>
          {ready && <p className="s0-prison-term"><strong>{outcome[person].toLocaleString("fa-IR")}</strong> سال زندان</p>}
        </div>)}
      </div>
      <p className="s0-insight" role="status">{ready ? choices[0] === 0 && choices[1] === 0 ? "هر دو سکوت کردند: یک سال برای هر نفر. کمترین مجموع مجازات در این مثال." : choices[0] === 1 && choices[1] === 1 ? "هر دو اعتراف کردند: پنج سال برای هر نفر. انتخاب فردی الزاماً بهترین نتیجهٔ مشترک را ایجاد نمی‌کند." : "اعتراف‌کننده آزاد می‌شود و فردی که سکوت کرده است ده سال زندان خواهد داشت. نتیجهٔ هر نفر به انتخاب دیگری نیز وابسته است." : "برای هر دو نفر یک گزینه انتخاب کنید و سپس ترکیب‌های دیگر را بررسی کنید. این بخش امتیاز ندارد."}</p>
      <details className="s0-matrix"><summary>مقایسهٔ هر چهار ترکیب</summary><div className="s0-table-scroll"><table><caption>مدت زندانِ نفر اول / نفر دوم، به سال</caption><thead><tr><th scope="col">انتخاب‌ها</th><th scope="col">دوم: سکوت</th><th scope="col">دوم: اعتراف</th></tr></thead><tbody><tr><th scope="row">اول: سکوت</th><td>۱ / ۱</td><td>۱۰ / ۰</td></tr><tr><th scope="row">اول: اعتراف</th><td>۰ / ۱۰</td><td>۵ / ۵</td></tr></tbody></table></div></details>
    </div>
  );
};

const ExampleExplorer = ({ nodeId, cards }: { nodeId: string; cards: readonly LearningCard[] }) => {
  const [selected, setSelected] = useState(0);
  const select = (index: number) => { setSelected(index); logInteraction(nodeId, "example_explorer", cards[index].label); };
  return (
    <div className="s0-explorer">
      <div role="tablist" aria-label="مرور مثال‌ها" className="s0-tabs">{cards.map((card, index) => (
        <button key={card.label} role="tab" id={`${nodeId}-tab-${index}`} aria-controls={`${nodeId}-example`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => select(index)} onKeyDown={(event) => {
          const next = event.key === "ArrowLeft" ? (selected + 1) % cards.length : event.key === "ArrowRight" ? (selected + cards.length - 1) % cards.length : event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : null;
          if (next === null) return;
          event.preventDefault(); select(next); document.getElementById(`${nodeId}-tab-${next}`)?.focus();
        }}>{card.label}</button>
      ))}</div>
      <div id={`${nodeId}-example`} role="tabpanel" aria-labelledby={`${nodeId}-tab-${selected}`} tabIndex={0} className="s0-example-panel">
        {nodeId === "spaceWarGameIntro" && <div className={`s0-orbit s0-orbit--${selected}`} aria-hidden="true"><i /><i /><span>مدار<br />و زمین</span><b /></div>}
        <div><span className="s0-eyebrow">{cards[selected].label}</span><h3>{cards[selected].title}</h3><p>{cards[selected].body}</p>
          {cards[selected].realExample && <article className="s0-real-example">
            <span className="s0-eyebrow">نمونهٔ واقعی</span>
            <h4>{cards[selected].realExample.title}</h4>
            <p>{cards[selected].realExample.text}</p>
            <a href={cards[selected].realExample.sourceUrl} target="_blank" rel="noopener noreferrer">منبع: {cards[selected].realExample.sourceTitle}</a>
          </article>}
        </div>
      </div>
    </div>
  );
};

const InfoLesson = ({ node, hasRead, onRead, onReview, onNext }: { node: InfoNode; hasRead: boolean; onRead: () => void; onReview: () => void; onNext: () => void }) => {
  const lesson = learningLessons[node.id];
  const isTypesLesson = node.id === "warGameTypesIntro";
  const practiceHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!hasRead) return;
    practiceHeadingRef.current?.focus({ preventScroll: true });
    practiceHeadingRef.current?.scrollIntoView({ block: "nearest" });
  }, [hasRead]);
  const isExplorer = ["warGameExample", "warGameTypesIntro", "warGameTypesExample", "spaceWarGameIntro", "spaceWarGameExample"].includes(node.id);
  const nextIsQuiz = node.next ? scenario.nodes[node.next]?.type === "quiz" : false;
  const supplementary = node.id === "warGameTypesIntro" ? scenario.nodes.warGameTypesExample : undefined;
  const reviewText = supplementary?.type === "info" ? `${node.text}\n\n${supplementary.text}` : node.text;
  return (
    <>
      <div className="s0-lesson-heading"><span className="s0-eyebrow">{isTypesLesson && !hasRead ? "مقدمهٔ آموزشی · رقابت، همکاری، ابهام" : lesson.eyebrow}</span><h2>{isTypesLesson && !hasRead ? "آشنایی با انواع بازی جنگ" : lesson.title}</h2><p>{isTypesLesson && !hasRead ? "پیش از بررسی مثال‌ها، با تعریف بازی جمع صفر، بازی مجموع غیرصفر و تصمیم‌گیری با اطلاعات ناقص آشنا شوید. توضیحات این بخش به‌صورت مرحله‌به‌مرحله ارائه می‌شوند." : lesson.lead}</p></div>
      {!hasRead ? <LessonReading nodeId={node.id} text={node.id === "gameTheoryExample" ? prisonersProblem : node.text} onComplete={onRead} completionLabel={isTypesLesson ? "ادامه به بررسی مثال‌ها" : undefined} /> : <>
      <div className="s0-practice-heading"><span className="s0-eyebrow">مطالعهٔ توضیحات این بخش تکمیل شد</span><h3 ref={practiceHeadingRef} tabIndex={-1}>بررسی مثال</h3></div>
      {isTypesLesson && <button type="button" className="secondary s0-review-presentation" onClick={onReview}>بازگشت به توضیحات اولیه</button>}
      {node.id === "gameTheoryIntro" && <MarketPrediction />}
      {node.id === "gameTheoryExample" && <PrisonersDilemma />}
      {node.id === "gameTheoryExample" && <section className="s0-prisoner-explanation"><h3>توضیح کامل مثال</h3>{node.text.split(/\n\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>}
      {isExplorer ? <ExampleExplorer nodeId={node.id} cards={lesson.cards} /> : lesson.cards.length > 0 && <div className="s0-concept-grid">{lesson.cards.map((card) => <article key={card.label}><span className="s0-eyebrow">{card.label}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>}
      <div className="s0-takeaway"><span aria-hidden="true">↳</span><div><strong>به خاطر بسپار</strong><p>{lesson.takeaway}</p></div></div>
      {node.id !== "gameTheoryExample" && <OriginalText nodeId={node.id} text={reviewText} label="مرور مجدد توضیحات این بخش" />}
      <div className="s0-next-row"><p>در صورت نیاز، توضیحات این بخش را مجدداً مطالعه کنید.</p><button className="s0-primary" onClick={onNext}>{nextIsQuiz ? "پاسخ به پرسش‌های این بخش" : "ادامه با یک مثال"}<span aria-hidden="true">←</span></button></div>
      </>}
    </>
  );
};

const LearningQuiz = ({ node, onNext }: { node: QuizNode; onNext: (next: string) => void }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const lockedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const selected = node.options.find((option) => option.id === selectedId);
  const correct = node.options.find((option) => option.isCorrect);
  return (
    <div className="s0-quiz">
      <div className="s0-lesson-heading"><span className="s0-eyebrow">مرور و تثبیت یادگیری</span><QuestionReference node={node} /><p>یک گزینه انتخاب کنید. پس از بررسی پاسخ، توضیح مرتبط نمایش داده می‌شود.</p></div>
      <div className="s0-quiz-options" role="group" aria-label="گزینه‌های سؤال">{node.options.map((option, index) => (
        <button key={option.id} disabled={checked} aria-pressed={selectedId === option.id} className={(selectedId === option.id ? "is-selected " : "") + (checked && option.isCorrect ? "is-correct" : checked && selectedId === option.id ? "is-incorrect" : "")} onClick={() => {
          setSelectedId(option.id);
          eventLogger.log({ type: "option_select", scenarioId: scenario.id, nodeId: node.id, elapsedMs: performance.now() - startedAtRef.current, detail: { optionId: option.id, optionText: option.text } });
        }}><span className="s0-option-marker">{checked && option.isCorrect ? "✓" : checked && selectedId === option.id ? "↺" : (index + 1).toLocaleString("fa-IR")}</span><span>{option.text}</span>{checked && option.isCorrect && <small>پاسخ درست</small>}</button>
      ))}</div>
      {checked && <div className={`s0-quiz-feedback ${selected?.isCorrect ? "is-positive" : ""}`} role="status"><strong>{selected?.isCorrect ? "پاسخ صحیح است." : "پاسخ انتخاب‌شده نیازمند بازبینی است."}</strong>{!selected?.isCorrect && <p>پاسخ درست: {correct?.text}</p>}<p>{quizFeedback[node.id]}</p></div>}
      <div className="s0-next-row"><p>{checked ? "این نکته در تحلیل موقعیت‌های بعدی نیز کاربرد دارد." : "پیش از بررسی پاسخ، امکان تغییر گزینه وجود دارد."}</p>{checked ? <button className="s0-primary" onClick={() => {
        eventLogger.log({ type: "option_confirm", scenarioId: scenario.id, nodeId: node.id, detail: { action: "quiz_continue" } });
        onNext(selected!.next);
      }}>ادامهٔ مسیر<span aria-hidden="true">←</span></button> : <button className="s0-primary" disabled={!selected} onClick={() => {
        if (!selected || lockedRef.current) return;
        lockedRef.current = true;
        eventLogger.log({ type: "option_confirm", scenarioId: scenario.id, nodeId: node.id, elapsedMs: performance.now() - startedAtRef.current, detail: { optionId: selected.id, optionText: selected.text, isCorrect: selected.isCorrect } });
        setChecked(true);
      }}>بررسی پاسخ</button>}</div>
    </div>
  );
};

export const ScenarioZeroLearning = ({ introduction, userProfileId, onNodeChange, onComplete }: ScenarioZeroLearningProps) => {
  const [nodeId, setNodeId] = useState(scenario.start);
  const [history, setHistory] = useState<string[]>([]);
  const [introductionRead, setIntroductionRead] = useState(false);
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [readLessons, setReadLessons] = useState<ReadonlySet<string>>(() => new Set());
  const lessonRef = useRef<HTMLElement>(null);
  const nodeStartedAtRef = useRef(performance.now());
  const node = scenario.nodes[nodeId];
  const readingKey = nodeId === "warGameTypesIntro" ? `${nodeId}:explanation-v2` : nodeId;
  const chapter = getLearningChapter(nodeId);
  const path = getLearningPath(scenario);
  const step = path.indexOf(nodeId);
  const isEnd = node.type === "end";
  useEffect(() => {
    if (!introductionRead) return;
    nodeStartedAtRef.current = performance.now();
    onNodeChange(nodeId);
    eventLogger.log({ type: "node_enter", scenarioId: scenario.id, nodeId, detail: { nodeType: scenario.nodes[nodeId].type, presentation: "guided_learning_v3" } });
    const heading = lessonRef.current?.querySelector<HTMLHeadingElement>("h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    lessonRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [nodeId, onNodeChange, introductionRead]);
  const advance = (next: string) => {
    if (!scenario.nodes[next]) return;
    setProgressExpanded(false);
    setHistory((current) => [...current, nodeId]);
    setNodeId(next);
  };
  if (!introductionRead) return (
    <main className="s0-learning s0-introduction-screen" data-node-id={nodeId} dir="rtl">
      <IntroductionDialog text={introduction} onComplete={() => setIntroductionRead(true)} />
    </main>
  );
  return (
    <main className="s0-learning" data-node-id={nodeId} dir="rtl">
      <aside className={`s0-course-panel${progressExpanded ? " is-expanded" : ""}`} aria-label="راهنمای پیشرفت آموزش">
      <button className="s0-progress-toggle" aria-expanded={progressExpanded} aria-controls="s0-progress-body" onClick={() => setProgressExpanded((current) => !current)}><span>مسیر آموزش · گام {(step + 1).toLocaleString("fa-IR")} از {path.length.toLocaleString("fa-IR")}</span><span aria-hidden="true">{progressExpanded ? "−" : "+"}</span></button>
      <div className="s0-progress-body" id="s0-progress-body">
      <header className="s0-course-header"><div><span className="s0-eyebrow">سناریو ۰ · مسیر آشنایی</span><h1>آستانهٔ ورود</h1><p>ابتدا شناخت مفهوم، سپس بررسی کاربرد آن.</p></div><span className="s0-learning-badge">آموزش، مثال و انتخاب</span></header>
      <nav className="s0-chapters" aria-label="مسیر یادگیری"><ol>{learningChapters.map((label, index) => <li key={label} aria-current={chapter === index ? "step" : undefined} className={chapter > index ? "is-done" : chapter === index ? "is-current" : ""}><span aria-hidden="true">{chapter > index ? "✓" : (index + 1).toLocaleString("fa-IR")}</span><span>{label}</span></li>)}</ol></nav>
      <div className="s0-stage-meta"><span>{node.type === "quiz" ? "مرور کوتاه" : node.type === "minigame" ? "تمرین کاربردی" : isEnd ? "آموزش تکمیل شد" : "مطالعهٔ مفهوم"}</span><span>گام {(step + 1).toLocaleString("fa-IR")} از {path.length.toLocaleString("fa-IR")}</span></div>
      <progress className="s0-course-progress" max={path.length} value={isEnd ? path.length : step} aria-label="پیشرفت مسیر آموزش" />
      {userProfileId === "admin" && node.type !== "minigame" && !isEnd && <button className="s0-admin-skip" onClick={() => {
        eventLogger.log({ type: "admin_skip_to_minigame", scenarioId: scenario.id, nodeId, detail: { targetNodeId: "conceptLab", reason: "admin_minigame_review" } });
        advance("conceptLab");
      }}>عبور ادمین به مینی‌گیم</button>}
      </div>
      </aside>
      <div className="s0-content">
      <section className="s0-lesson" key={nodeId} ref={lessonRef}>
        {node.type === "info" && <InfoLesson node={node} hasRead={readLessons.has(readingKey)} onRead={() => {
          setReadLessons((current) => new Set([...current, readingKey]));
        }} onReview={() => {
          setReadLessons((current) => {
            const next = new Set(current);
            next.delete(readingKey);
            return next;
          });
          logInteraction(nodeId, "review_lesson_presentation", readingKey);
        }} onNext={() => {
          eventLogger.log({ type: "option_confirm", scenarioId: scenario.id, nodeId, elapsedMs: performance.now() - nodeStartedAtRef.current, detail: { action: "info_continue" } });
          if (node.next) advance(node.next);
        }} />}
        {node.type === "quiz" && <LearningQuiz node={node} onNext={advance} />}
        {node.type === "minigame" && <MiniGameHost scenarioId={scenario.id} nodeId={nodeId} game={node.game} userProfileId={userProfileId} onComplete={() => advance(node.next)} />}
        {node.type === "end" && <div className="s0-finish"><span className="s0-finish-mark" aria-hidden="true">✓</span><span className="s0-eyebrow">آمادگی برای مرحلهٔ بعد</span><h2>آشنایی با مفاهیم پایه تکمیل شد</h2><p>{node.summaryText}</p><div className="s0-concept-grid">{["بررسی واکنش طرف مقابل", "ارزیابی امکان همکاری", "توجه به محدودیت اطلاعات"].map((text) => <article key={text}><h3>{text}</h3></article>)}</div><button className="s0-primary" onClick={onComplete}>پایان آموزش و انتخاب سناریو</button></div>}
      </section>
      {history.length > 0 && node.type !== "minigame" && !isEnd && <button className="s0-back" onClick={() => {
        const previous = history.at(-1)!;
        logInteraction(nodeId, "learning_back", previous);
        setHistory((current) => current.slice(0, -1)); setNodeId(previous);
      }}>→ بازگشت به گام قبل</button>}
      </div>
    </main>
  );
};
