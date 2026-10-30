import { useEffect, useRef, useState } from "react";
import { eventLogger } from "../../../../services/analytics/eventLogger";
import { buildReadingSections, type ReadingSection } from "./learningContent";

const SCENARIO_ID = "s0_gateway_space_wargaming";

interface ReadingPagesProps {
  sections: readonly ReadingSection[];
  nodeId: string;
  kind: "introduction" | "lesson";
  onComplete: () => void;
  completionLabel?: string;
}

const ReadingPages = ({ sections, nodeId, kind, onComplete, completionLabel }: ReadingPagesProps) => {
  const [page, setPage] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const completedRef = useRef(false);
  const current = sections[page];
  const last = page === sections.length - 1;
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: "nearest" });
    eventLogger.log({ type: "s0_reading_section_view", scenarioId: SCENARIO_ID, nodeId, detail: { kind, sectionIndex: page, sectionCount: sections.length } });
  }, [page, nodeId, kind, sections.length]);
  return (
    <div className="s0-reading" data-reading-kind={kind} data-reading-page={page}>
      <div className="s0-reading-meta"><span>{kind === "introduction" ? "آشنایی با مسیر" : "مطالعهٔ توضیحات پیش از تمرین"}</span><span>بخش {(page + 1).toLocaleString("fa-IR")} از {sections.length.toLocaleString("fa-IR")}</span></div>
      <progress max={sections.length} value={page + 1} aria-label="پیشرفت مطالعهٔ توضیحات" />
      <div className="s0-reading-page" key={page}>
        <h3 ref={headingRef} tabIndex={-1}>{current.title}</h3>
        <p>{current.text}</p>
      </div>
      <div className="s0-reading-controls">
        <button className="secondary s0-reading-previous" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>بخش قبل</button>
        <button className="s0-primary s0-reading-next" onClick={() => {
          if (!last) { setPage((value) => Math.min(value + 1, sections.length - 1)); return; }
          if (completedRef.current) return;
          completedRef.current = true;
          eventLogger.log({ type: "s0_reading_acknowledged", scenarioId: SCENARIO_ID, nodeId, detail: { kind, sectionCount: sections.length } });
          onComplete();
        }}>{last ? completionLabel ?? (kind === "introduction" ? "آماده‌ام؛ شروع آموزش" : "توضیحات را خواندم؛ شروع تمرین") : "بخش بعدی توضیحات"}</button>
      </div>
    </div>
  );
};

export const LessonReading = ({ nodeId, text, onComplete, completionLabel }: { nodeId: string; text: string; onComplete: () => void; completionLabel?: string }) => (
  <ReadingPages sections={buildReadingSections(text, nodeId)} nodeId={nodeId} kind="lesson" onComplete={onComplete} completionLabel={completionLabel} />
);

export const IntroductionDialog = ({ text, onComplete }: { text: string; onComplete: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lines = (text || "ابتدا توضیح هر مفهوم را مطالعه کنید و سپس به بررسی مثال‌ها و انتخاب‌های آن بپردازید.").split(/\n+/).filter((line) => line.trim());
  const groups: string[] = [];
  for (let index = 0; index < lines.length; index += 3) groups.push(lines.slice(index, index + 3).join("\n"));
  const sections = buildReadingSections(groups.join("\n\n"), "introduction");
  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={dialogRef} className="s0-introduction" aria-labelledby="s0-introduction-title" onCancel={(event) => event.preventDefault()} dir="rtl">
      <span className="s0-eyebrow">سناریو ۰ · پیش از شروع</span>
      <h2 id="s0-introduction-title">دربارهٔ این مسیر آموزشی</h2>
      <p className="s0-introduction-lead">ابتدا با ساختار مسیر آموزشی آشنا شوید. سپس توضیح هر مفهوم را مطالعه کنید و پس از آن، مثال‌ها و انتخاب‌های مربوط را بررسی کنید.</p>
      <ReadingPages sections={sections} nodeId="gameTheoryIntro" kind="introduction" onComplete={onComplete} />
    </dialog>
  );
};
