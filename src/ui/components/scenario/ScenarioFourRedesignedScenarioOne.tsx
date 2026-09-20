import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { eventLogger } from "../../../services/analytics/eventLogger";
import { Card } from "../common/Card";
import "./ScenarioFourRedesignedScenarioOne.css";
import friendlySatelliteAsset from "../../../../assets/s1/A2.png";
import unknownSatelliteAsset from "../../../../assets/s1/A3.png";
import { adjudicateMoveOne, applyBlueDecision } from "./scenario-four/adjudication/adjudicator";
import {
  adjudicateMove2,
  applyMove2Decision,
  initializeMove2Incident,
} from "./scenario-four/adjudication/move2Adjudicator";
import {
  adjudicateMove3,
  applyMove3Decision,
  buildConfidencePackage,
  initializeMove3Severity,
} from "./scenario-four/adjudication/move3Adjudicator";
import { selectRedIntent } from "./scenario-four/adjudication/seededRandom";
import { createInitialScenarioOneState, cloneState } from "./scenario-four/model/initialState";
import {
  calculateOrientationV2,
} from "./scenario-four/model/orientationModelV2";
import {
  applyOptionSelectionV3,
  calculateAttributionBrier,
  calculateCognitiveModelV3,
  type CognitiveModelV3Result,
  type SelectionTelemetryStateV3,
} from "./scenario-four/model/cognitiveEngineV3";
import { buildOpponentObservationAAR } from "./scenario-four/model/aarV3";
import { ACTOR_LABELS_FA, SCENARIO_FICTION_DISCLAIMER_FA } from "./scenario-four/model/displayLabelsFa";
import {
  COGNITIVE_FORMULA_VERSION,
  COGNITIVE_MODEL_VERSION,
  ANCHOR_TEST_VERSION,
  CONSTRUCT_DISTRIBUTION_AUDIT_V3,
  EXPERT_PANEL_VERSION,
  OPTION_PROFILE_VERSION,
  SCENARIO_CONTENT_VERSION,
} from "./scenario-four/model/cognitiveOptionProfilesV3";
import {
  applyResourceRecovery,
  captureDecisionResourceEvents,
  getCertainResourceCosts,
  getResourceLabel,
  getResourceStatusLabel,
} from "./scenario-four/model/resourceEngineV2";
import type {
  DecisionOption,
  DecisionWindowId,
  Move2Snapshot,
  Move3Snapshot,
  MoveSnapshot,
  ScenarioOneFinalSnapshot,
  ScenarioOneDecisionRecord,
  ScenarioOneState,
  ResourceEvent,
  AttributionEstimateTelemetryV3,
  DecisionTelemetryV3,
  EvidenceOpenTelemetryV3,
} from "./scenario-four/model/types";
import {
  communicationOptions,
  informationOptions,
  intelCards,
  protectionOptions,
  reasonOptions,
} from "./scenario-four/moves/move1";
import {
  investigationOptions,
  missionOptions,
  move2EvidenceCards,
  move2ReasonOptions,
  responseOptions,
} from "./scenario-four/moves/move2";
import {
  crisisCoaOptions,
  informationPolicyOptions,
  move3ReasonOptions,
  offRampOptions,
  thresholdOptions,
} from "./scenario-four/moves/move3";

interface ScenarioFourRedesignedScenarioOneProps {
  scenarioId: string | number;
  nodeId: string;
  userProfileId?: string;
  onCompletionUiActiveChange?: (active: boolean) => void;
  onComplete: () => void;
}

type Phase =
  | "intro_title"
  | "intro_narrative"
  | "intro_role"
  | "intro_objectives"
  | "intro_rules"
  | "brief"
  | "intel"
  | "dw1"
  | "dw2"
  | "dw3"
  | "reason"
  | "resolving"
  | "update"
  | "move2_brief"
  | "move2_attr_pre"
  | "move2_dw4"
  | "move2_attr_post"
  | "move2_dw5"
  | "move2_dw6"
  | "move2_reason"
  | "move2_update"
  | "move3_brief"
  | "move3_confidence"
  | "move3_attr_final"
  | "move3_dw7"
  | "move3_dw8"
  | "move3_dw9"
  | "move3_offramp"
  | "move3_reason"
  | "final_report"
  | "dashboard"
  | "aar";

const STORAGE_KEY = "space-war.scenario4.redesigned-s1.move1.snapshot";
const RUN_KEY = "space-war.scenario4.redesigned-s1.run";

const getNow = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

const qualitativeStatus = (metric: keyof ScenarioOneState["visible"], value: number) => {
  if (metric === "missionContinuity") {
    if (value < 30) return "مختل";
    if (value < 60) return "تحت فشار";
    if (value < 80) return "پایدار";
    return "بسیار پایدار";
  }
  if (metric === "situationAwareness") {
    if (value < 30) return "ضعیف";
    if (value < 50) return "محدود";
    if (value < 70) return "متوسط";
    if (value < 85) return "خوب";
    return "بسیار خوب";
  }
  if (metric === "escalationPressure") {
    if (value < 25) return "پایین";
    if (value < 50) return "رو به افزایش";
    if (value < 70) return "بالا";
    return "بحرانی";
  }
  if (metric === "coalitionCohesion") {
    if (value < 30) return "شکننده";
    if (value < 60) return "محدود";
    if (value < 80) return "پایدار";
    return "قوی";
  }
  if (value < 35) return "پایین";
  if (value < 70) return "متوسط";
  return "بالا";
};

const attributionLabel = (value: number) => {
  if (value <= 20) return "بسیار بعید";
  if (value <= 40) return "بعید";
  if (value <= 55) return "نامطمئن";
  if (value <= 75) return "محتمل";
  return "بسیار محتمل";
};

const windowTitles: Record<DecisionWindowId, string> = {
  m1_information: "نقطه تصمیم ۱ — اولویت اطلاعاتی",
  m1_protection: "نقطه تصمیم ۲ — وضعیت حفاظتی",
  m1_communication: "نقطه تصمیم ۳ — ارتباطات",
  m1_reason: "ثبت دلیل",
  m2_investigation: "نقطه تصمیم ۴ — بررسی علت",
  m2_mission: "نقطه تصمیم ۵ — تداوم مأموریت",
  m2_response: "نقطه تصمیم ۶ — موضع در برابر اسرائیل",
  m2_reason: "ثبت دلیل مرحله دوم",
  m3_threshold: "نقطه تصمیم ۷ — آستانه اقدام",
  m3_coa: "نقطه تصمیم ۸ — مسیر اقدام",
  m3_info: "نقطه تصمیم ۹ — سیاست اطلاعاتی",
  m3_offramp: "مسیر کاهش تنش",
  m3_reason: "ثبت دلیل نهایی",
};

const getDecisionOrdinalFromTitle = (title: string) => {
  const match = title.match(/نقطه تصمیم\s+(\d+)/);
  return match ? Number(match[1]) : null;
};

const logScenarioFour = (
  type: string,
  scenarioId: string | number,
  nodeId: string,
  detail?: Record<string, unknown>,
  elapsedMs?: number
) =>
  eventLogger.log({
    type,
    scenarioId,
    nodeId,
    detail,
    elapsedMs,
  });

const getPhaseMeta = (phase: Phase) => {
  if (phase.startsWith("intro")) return { move: "پیش‌درآمد", subtitle: "آماده‌سازی ذهنی", decision: "بدون نقطه تصمیم" };
  if (["brief", "intel", "dw1", "dw2", "dw3", "reason", "resolving", "update"].includes(phase)) {
    return { move: "مرحله ۱: نزدیک‌شدن", subtitle: "رفتار مداری مبهم", decision: phase === "dw1" ? "نقطه تصمیم ۱ از ۹" : phase === "dw2" ? "نقطه تصمیم ۲ از ۹" : phase === "dw3" ? "نقطه تصمیم ۳ از ۹" : "مرور و واکنش" };
  }
  if (phase.startsWith("move2")) {
    return { move: "مرحله ۲: اختلال بدون امضا", subtitle: "اثر عملیاتی با انتساب نامطمئن", decision: phase === "move2_dw4" ? "نقطه تصمیم ۴ از ۹" : phase === "move2_dw5" ? "نقطه تصمیم ۵ از ۹" : phase === "move2_dw6" ? "نقطه تصمیم ۶ از ۹" : "برآورد و مرور" };
  }
  if (phase.startsWith("move3")) {
    return { move: "مرحله ۳: بحران انتساب", subtitle: "آستانه اقدام و سیاست اطلاعاتی", decision: phase === "move3_dw7" ? "نقطه تصمیم ۷ از ۹" : phase === "move3_dw8" ? "نقطه تصمیم ۸ از ۹" : phase === "move3_dw9" ? "نقطه تصمیم ۹ از ۹" : "جمع‌بندی نهایی" };
  }
  if (phase === "final_report") return { move: "گزارش", subtitle: "نتیجه بازیکن بدون افشای حقیقت پنهان", decision: "گزارش نهایی" };
  if (phase === "dashboard") return { move: "داشبورد شناختی", subtitle: "تحلیل سبک تصمیم‌گیری", decision: "تحلیل رفتاری" };
  return { move: "تحلیل پس از اقدام", subtitle: "افشای آموزشی حقیقت پنهان", decision: "تحلیل پس از اقدام" };
};

const ScenarioProgress = ({ phase }: { phase: Phase }) => {
  const steps = [
    { id: "m1", label: "نزدیک‌شدن" },
    { id: "m2", label: "اختلال بدون امضا" },
    { id: "m3", label: "بحران انتساب" },
    { id: "report", label: "گزارش نهایی" },
    { id: "aar", label: "تحلیل پس از اقدام" },
    { id: "dashboard", label: "داشبورد شناختی" },
  ];
  const activeIndex = phase.startsWith("move2")
    ? 1
    : phase.startsWith("move3")
      ? 2
      : phase === "final_report"
        ? 3
        : phase === "aar"
          ? 4
          : phase === "dashboard"
            ? 5
            : 0;
  const progressPercent = activeIndex / (steps.length - 1) * 100;
  return (
    <div className="s4-progress" aria-label="پیشرفت سناریو" style={{ "--s4-progress": `${progressPercent}%` } as CSSProperties}>
      <div className="s4-progress-track" aria-hidden="true"><i /></div>
      {steps.map((step, index) => (
        <div key={step.id} className={`s4-progress-step${index === activeIndex ? " active" : ""}${index < activeIndex ? " done" : ""}`} aria-current={index === activeIndex ? "step" : undefined}>
          <span>{["۱", "۲", "۳", "۴", "۵", "۶"][index]}</span>
          <b>{step.label}</b>
        </div>
      ))}
    </div>
  );
};

const GameplayHeader = ({
  phase,
  guideActive,
  onHelp,
  onGlossary,
  onEvidence,
  onExit,
}: {
  phase: Phase;
  guideActive?: boolean;
  onHelp: () => void;
  onGlossary: () => void;
  onEvidence: () => void;
  onExit: () => void;
}) => {
  const meta = getPhaseMeta(phase);
  return (
    <header className={`s4-gameplay-header${guideActive ? " guide-active" : ""}`}>
      <div>
        <strong>حریم خاکستری مدار</strong>
        <span className="s4-current-stage"><em>{meta.move}</em><small>| {meta.subtitle}</small></span>
      </div>
      <div className="s4-header-center">{meta.decision}</div>
      <div className={`s4-header-actions${guideActive ? " guide-active" : ""}`}>
        <div className={`s4-header-tools${guideActive ? " guide-active" : ""}`}>
          <button className="s4-button s4-button-secondary" type="button" onClick={onHelp}>راهنما</button>
          <button className="s4-button s4-button-secondary" type="button" onClick={onGlossary}>واژه‌نامه</button>
          <button className="s4-button s4-button-secondary" type="button" onClick={onEvidence}>شواهد</button>
        </div>
        <button className="s4-button s4-button-ghost" type="button" onClick={onExit}>خروج</button>
      </div>
    </header>
  );
};

const HelpPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="s4-modal-backdrop" role="dialog" aria-modal="true">
    <div className="s4-modal">
      <div className="s4-modal-header">
        <h2>راهنما</h2>
        <button onClick={onClose}>بستن</button>
      </div>
      <section><h3>چطور تصمیم بگیرم؟</h3><p>اطلاعات را بخوانید، محدودیت منابع را ببینید و تصمیمی را انتخاب کنید که با ارزیابی شما از وضعیت سازگار است. سناریو پاسخ صحیح واحد ندارد.</p></section>
      <section><h3>اعداد چرا پنهان‌اند؟</h3><p>هدف بازی آزمون تصمیم در شرایط واقعی‌تر است. شما وضعیت را به‌صورت کیفی می‌بینید، در حالی که موتور داخلی متغیرهای دقیق را برای تحلیل ثبت می‌کند.</p></section>
      <section><h3>آیا اسرائیل همیشه دشمن فرض می‌شود؟</h3><p>خیر. نیت واقعی اسرائیل در هر اجرا پنهان است و می‌تواند از آزمون واکنش تا فشار یا حتی رفتار غیرخصمانه اما مبهم متفاوت باشد.</p></section>
      <section><h3>یادآوری روایی</h3><p>{SCENARIO_FICTION_DISCLAIMER_FA}</p></section>
      <section><h3>آیا می‌توانم تصمیمم را تغییر دهم؟</h3><p>تا قبل از ثبت نهایی هر نقطه تصمیم، بله. تغییر انتخاب برای تحلیل فرایند تصمیم ثبت می‌شود.</p></section>
    </div>
  </div>
);

const GlossaryPanel = ({ onClose }: { onClose: () => void }) => {
  const terms = [
    ["آگاهی موقعیتی فضایی (SSA)", "توان گردآوری و تحلیل داده درباره موقعیت، حرکت و رفتار دارایی‌های فضایی."],
    ["انتساب مسئولیت", "فرایند ارزیابی اینکه چه کسی یا چه عاملی در یک رخداد نقش داشته است."],
    ["هماهنگی کاهش خطر", "ارتباط یا سازوکاری برای کاهش احتمال برخورد، سوءبرداشت یا تداخل ناخواسته."],
    ["مسیر کاهش تنش", "گزینه‌ای برای خروج از مسیر تشدید بدون الزام به حل کامل اختلاف."],
    ["انسجام ائتلاف", "میزان هم‌سویی و اعتماد میان ایران و متحدانش در مدیریت بحران."],
    ["ریسک افشای اطلاعات", "میزان اطلاعاتی که رفتار، ظرفیت، اولویت یا منابع ایران را قابل برداشت می‌کند."],
    ["برگشت‌پذیری", "میزان امکان بازگشت از یک تصمیم یا تغییر آن بدون هزینه بسیار بالا."],
  ];
  return (
    <div className="s4-modal-backdrop" role="dialog" aria-modal="true">
      <div className="s4-modal">
        <div className="s4-modal-header">
          <h2>واژه‌نامه</h2>
          <button onClick={onClose}>بستن</button>
        </div>
        <div className="s4-glossary-list">
          {terms.map(([term, text]) => (
            <section key={term}><h3>{term}</h3><p>{text}</p></section>
          ))}
        </div>
      </div>
    </div>
  );
};

const ToolbarGuideModal = ({ onClose }: { onClose: () => void }) => (
  <div className="s4-modal-backdrop s4-toolbar-guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="s4-toolbar-guide-title">
    <div className="s4-modal s4-toolbar-guide">
      <span className="s4-toolbar-guide-arrow" aria-hidden="true">↖</span>
      <h2 id="s4-toolbar-guide-title">آشنایی با ابزارهای سناریو</h2>
      <p className="s4-toolbar-guide-intro">
        در بالای پنل سه ابزار در دسترس شماست که در طول سناریو می‌توانید هر زمان به آن‌ها مراجعه کنید:
      </p>
      <div className="s4-toolbar-guide-items">
        <section className="s4-toolbar-guide-item">
          <strong>راهنما</strong>
          <p>روش تصمیم‌گیری، قواعد سناریو و نکته‌های لازم برای پیش‌برد مراحل را توضیح می‌دهد.</p>
        </section>
        <section className="s4-toolbar-guide-item">
          <strong>واژه‌نامه</strong>
          <p>معنای اصطلاحات تخصصی و مفاهیم کلیدی به‌کاررفته در سناریو را نمایش می‌دهد.</p>
        </section>
        <section className="s4-toolbar-guide-item">
          <strong>شواهد</strong>
          <p>همه شواهدی را که تا این لحظه کشف کرده‌اید یک‌جا نگه می‌دارد تا بتوانید دوباره مرورشان کنید.</p>
        </section>
      </div>
      <div className="s4-toolbar-guide-action">
        <button className="primary" type="button" autoFocus onClick={onClose}>متوجه شدم</button>
      </div>
    </div>
  </div>
);

const DecisionInfoGuideModal = ({ onClose }: { onClose: () => void }) => (
  <div className="s4-modal-backdrop s4-info-guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="s4-info-guide-title">
    <div className="s4-modal s4-modal-small s4-info-guide-modal">
      <span className="s4-info-guide-arrow" aria-hidden="true">↙</span>
      <span className="s4-info-guide-symbol" aria-hidden="true">ⓘ</span>
      <h2 id="s4-info-guide-title">توضیحات بیشتر گزینه‌ها</h2>
      <p>دکمه ⓘ کنار هر گزینه، توضیحات تکمیلی همان تصمیم را نمایش می‌دهد. مشاهده توضیحات بیشتر می‌تواند به انتخاب‌های بهتر منجر شود.</p>
      <button className="primary" type="button" autoFocus onClick={onClose}>متوجه شدم</button>
    </div>
  </div>
);

const StatusPanel = ({ state }: { state: ScenarioOneState }) => {
  const rows: Array<{ key: keyof ScenarioOneState["visible"]; label: string }> = [
    { key: "missionContinuity", label: "تداوم مأموریت" },
    { key: "situationAwareness", label: "آگاهی موقعیتی" },
    { key: "escalationPressure", label: "فشار تشدید" },
    { key: "operationalReadiness", label: "آمادگی عملیاتی" },
  ];
  const detailRows: Array<{ key: keyof ScenarioOneState["visible"]; label: string }> = [
    { key: "coalitionCohesion", label: "انسجام ائتلاف" },
    { key: "informationExposure", label: "ردپای اطلاعاتی" },
    { key: "strategicLegitimacy", label: "مشروعیت راهبردی" },
  ];

  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>وضعیت قابل مشاهده</h3>
      <div style={{ display: "grid", gap: "0.55rem" }}>
        {[...rows, ...detailRows].map((row) => (
          <div
            key={row.key}
            className="s4-status-row"
            title={statusTooltips[row.key]}
          >
            <div>
              <span>{row.label}</span>
              <div className="s4-status-track"><div style={{ width: `${state.visible[row.key]}%` }} /></div>
            </div>
            <strong>{qualitativeStatus(row.key, state.visible[row.key])}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
};

const statusTooltips: Record<keyof ScenarioOneState["visible"], string> = {
  missionContinuity: "نشان می‌دهد مأموریت A-17 تا چه حد پایدار و قابل ادامه است.",
  situationAwareness: "نشان می‌دهد تصویر اطلاعاتی شما از وضعیت تا چه حد کامل و منسجم است.",
  escalationPressure: "نشان می‌دهد بحران تا چه حد به سمت تشدید حرکت کرده است.",
  operationalReadiness: "نشان می‌دهد ایران برای حفاظت و بازیابی تا چه حد آماده است.",
  coalitionCohesion: "نشان می‌دهد متحدان تا چه حد با ارزیابی و مسیر اقدام شما هم‌سو هستند.",
  informationExposure: "نشان می‌دهد چه مقدار از ظرفیت، اولویت یا الگوی رفتاری شما قابل برداشت شده است.",
  strategicLegitimacy: "نشان می‌دهد موضع شما از نظر سیاسی/حقوقی تا چه حد قابل دفاع است.",
};

const ResourcePanel = ({
  state,
  recentEvents,
  history,
}: {
  state: ScenarioOneState;
  recentEvents: ResourceEvent[];
  history: ResourceEvent[];
}) => {
  const rows = [
    ["ظرفیت SSA", state.resources.ssaCapacity, "ظرفیت آگاهی موقعیتی فضایی برای تحلیل و رصد تکمیلی."],
    ["ظرفیت حفاظتی", state.resources.protectiveCapacity, "توان فنی/عملیاتی برای حفاظت، پشتیبان‌سازی و بازیابی."],
    ["سرمایه سیاسی", state.resources.politicalCapital, "فضای مانور سیاسی برای پیام، ائتلاف و پاسخ رسمی."],
    ["ظرفیت افشای امن", state.resources.disclosureBudget, "مقدار اطلاعات حساسی که هنوز می‌توان بدون هزینه غیرقابل قبول به اشتراک گذاشت."],
  ] as const;
  const keys = ["ssaCapacity", "protectiveCapacity", "politicalCapital", "disclosureBudget"] as const;
  const statusTone = (value: number) => value >= 85 ? "abundant" : value >= 70 ? "good" : value >= 50 ? "pressure" : "limited";
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>ظرفیت منابع</h3>
      <div className="s4-resource-list s4-resource-grid">
        {rows.map(([label, value, title], index) => {
          const recent = [...recentEvents].reverse().find((event) => event.resource === keys[index]);
          return (
            <div key={label} className="s4-resource-row" title={title}>
              <div className="s4-resource-heading">
                <span>{label}</span>
                <small className={`s4-resource-status ${statusTone(value)}`}>{getResourceStatusLabel(value)}</small>
              </div>
              <div className="s4-resource-track"><div style={{ width: `${value}%` }} /></div>
              <strong className="s4-resource-value">
                <b>{value} / 100</b>
                {recent && <i className={recent.delta > 0 ? "positive" : "negative"}>{recent.delta > 0 ? "+" : ""}{recent.delta}</i>}
              </strong>
            </div>
          );
        })}
      </div>
      <details className="s4-resource-history">
        <summary>چرا تغییر کرد؟</summary>
        {history.length === 0 ? <p>هنوز تغییری ثبت نشده است.</p> : (
          <div>
            {[...history].reverse().slice(0, 12).map((event) => (
              <p key={event.id}>
                <strong>{getResourceLabel(event.resource)} {event.delta > 0 ? "+" : ""}{event.delta}</strong>
                <span>{event.rationale}</span>
              </p>
            ))}
          </div>
        )}
      </details>
    </Card>
  );
};

const incidentCauseLabel = (cause?: string) => {
  const labels: Record<string, string> = {
    red_reversible_interference: "مداخله برگشت‌پذیر منتسب به اسرائیل",
    technical_fault: "نقص فنی داخلی",
    environmental_or_external: "عامل محیطی یا خارجی غیرمنتسب به اسرائیل",
    mixed_cause: "ترکیب چند عامل",
  };
  return cause ? labels[cause] ?? cause : "ثبت نشده";
};

const truthAttributionLabel = (attribution: string) => {
  const labels: Record<string, string> = {
    red: "نقش اسرائیل تأیید می‌شود",
    non_red: "نقش مستقیم اسرائیل در علت اصلی تأیید نشد",
    mixed: "اسرائیل در بخشی از رخداد نقش داشت",
  };
  return labels[attribution] ?? attribution;
};

const redIntentPersianLabel = (intent: string) => {
  const labels: Record<string, string> = {
    probe: "آزمون واکنش",
    coercion: "اعمال فشار",
    intelligence_collection: "جمع‌آوری اطلاعات",
    alliance_fracture: "ایجاد شکاف ائتلافی",
    benign_ambiguous: "رفتار غیرخصمانه اما مبهم",
  };
  return labels[intent] ?? intent;
};

const endStatePersianLabel = (endState: string) => {
  const labels: Record<string, string> = {
    calm_crisis_control: "مهار آرام بحران",
    costly_deterrence: "بازدارندگی پرهزینه",
    persistent_ambiguity: "ابهام پایدار",
    coalition_fracture: "شکاف ائتلافی",
    escalation_spiral: "مارپیچ تشدید",
    intelligence_failure: "شکست اطلاعاتی",
    negotiated_deescalation: "کاهش تنش مذاکره‌شده",
    strategic_information_opportunity: "فرصت اطلاعاتی راهبردی",
    mixed_crisis_containment: "مهار نسبی بحران",
  };
  return labels[endState] ?? endState;
};

const OrbitalScene = ({
  phase,
  protectionChoice,
  redAction,
  state,
  communicationChoice,
  investigationChoice,
  move2ResponseChoice,
  move3Coa,
  primaryEndState,
}: {
  phase: Phase;
  protectionChoice?: string;
  redAction?: string;
  state?: ScenarioOneState;
  communicationChoice?: string;
  investigationChoice?: string;
  move2ResponseChoice?: string;
  move3Coa?: string;
  primaryEndState?: string;
}) => {
  const blueX =
    protectionChoice === "m1_p_mission_reposition" && phase !== "dw2" ? 34 : 40;
  const redX =
    redAction === "continue_approach"
      ? 56
      : redAction === "slow_approach"
        ? 60
        : redAction === "break_off"
          ? 78
          : redAction === "reduce_proximity" || redAction === "deescalate_and_separate"
            ? 75
            : redAction === "maintain_pressure" || redAction === "increase_non_destructive_pressure"
              ? 55
          : 66;
  const blueMapX = blueX * 8;
  const redMapX = redX * 8;
  const proximityLabel =
    Math.abs(redX - blueX) <= 18 ? "فاصله نزدیک" : Math.abs(redX - blueX) <= 30 ? "فاصله تحت پایش" : "فاصله در حال افزایش";
  const showHalo =
    protectionChoice === "m1_p_visible_protection" ||
    protectionChoice === "m1_p_mission_reposition";
  const showCovert = protectionChoice === "m1_p_covert_readiness";
  const showTracking = investigationChoice === "m2_a_second_sensor" || phase === "dw2" || phase === "dw3";
  const showCommercial = investigationChoice === "m2_a_commercial_validation";
  const showAlly = investigationChoice === "m2_a_ally_intel" || communicationChoice === "m1_c_allies" || move2ResponseChoice === "m2_r_joint_allied_response";
  const showFallback = Boolean(state?.flags.m2FallbackActivated);
  const showSecondAsset = Boolean(state?.flags.m2SecondAssetObserved);
  const showOffRamp = Boolean(state?.flags.m2OffRampOfferedByRed || state?.flags.m2OffRampOfferedByBlue || move3Coa === "m3_coa_negotiated_deescalation");
  const publicWarning = communicationChoice === "m1_c_public_warning";
  const privateMessage = communicationChoice === "m1_c_private" || communicationChoice === "m1_c_private_allied" || move2ResponseChoice === "m2_r_request_explanation";
  const finalSceneCaptions: Record<string, string> = {
    calm_crisis_control: "وضعیت مداری: بحران کنترل شده و اسرائیل عملاً از مسیر فشار فاصله گرفته است.",
    costly_deterrence: "وضعیت مداری: اسرائیل فاصله گرفته، اما کنترل بحران برای ایران پرهزینه بوده است.",
    persistent_ambiguity: "وضعیت مداری: مأموریت ادامه دارد، اما رفتار اسرائیل همچنان چندتعبیری و حل‌نشده است.",
    coalition_fracture: "وضعیت مداری: بحران ادامه دارد و شکاف میان متحدان ایران توان پاسخ هماهنگ را کاهش داده است.",
    escalation_spiral: "وضعیت مداری: فشار بحران شدید است و مسیر تشدید ادامه دارد.",
    intelligence_failure: "وضعیت مداری: نتیجه عملیاتی زیر سایه انتساب نادرست و ادعای فراتر از شواهد قرار گرفته است.",
    negotiated_deescalation: "وضعیت مداری: مسیر کاهش تنش با پذیرش یا فاصله‌گذاری متقابل اسرائیل فعال شده است.",
    strategic_information_opportunity: "وضعیت مداری: بحران نسبی مهار شده و فرصت شناخت بیشتر باقی مانده است.",
    mixed_crisis_containment: "وضعیت مداری: بحران تا حدی مهار شده، اما بخشی از ریسک‌ها باقی مانده است.",
  };
  const finalSceneCaption = primaryEndState && ["final_report", "aar", "dashboard"].includes(phase)
    ? finalSceneCaptions[primaryEndState]
    : undefined;
  const orbitalCaption = finalSceneCaption ?? (
    phase.startsWith("move2")
      ? showFallback
        ? "وضعیت A-17: بخشی از سرویس به ظرفیت پشتیبان منتقل شده است."
        : "وضعیت A-17: افت کیفیت سرویس ثبت شده و علت قطعی نیست."
      : phase.startsWith("move3")
        ? showOffRamp
          ? "وضعیت مداری: مسیر کاهش تنش یا فاصله‌گذاری روی میز است."
          : "وضعیت بحران: تصمیم نهایی درباره اقدام و سیاست اطلاعاتی در حال شکل‌گیری است."
        : redAction === "deescalate_and_separate"
          ? "وضعیت مداری: اسرائیل فاصله خود را افزایش داده و فشار بحران کاهش یافته است."
          : redAction === "accept_interim_offramp"
            ? "وضعیت مداری: اسرائیل مسیر موقت کاهش تنش را پذیرفته است."
        : redAction === "break_off"
          ? "وضعیت مداری: R-31 فاصله خود را افزایش داده است."
          : redAction === "slow_approach"
            ? "وضعیت مداری: سرعت نزدیک‌شدن R-31 کاهش یافته است."
            : redAction === "continue_approach"
              ? "وضعیت مداری: روند نزدیک‌شدن R-31 ادامه دارد."
              : "وضعیت مداری: رفتار R-31 هنوز چندتعبیری است."
  );

  return (
    <Card>
      <h3 className="s4-tactical-title">اکنون چه اتفاقی می‌افتد؟</h3>
      <div className="s4-orbital-frame">
        <svg className="s4-orbital-svg" viewBox="0 0 800 450" role="img" aria-label={`نقشه مداری A-17 و R-31؛ ${proximityLabel}`}>
          <defs>
            <linearGradient id="s4-space-background" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="52%" stopColor="#07152e" />
              <stop offset="100%" stopColor="#160b2f" />
            </linearGradient>
            <radialGradient id="s4-earth-body" cx="45%" cy="20%" r="78%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.82" />
              <stop offset="42%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <radialGradient id="s4-earth-glow" cx="50%" cy="50%" r="50%">
              <stop offset="65%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="86%" stopColor="#38bdf8" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="s4-sensor-cone" x1="0" x2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
            <clipPath id="s4-earth-clip">
              <circle cx="400" cy="610" r="305" />
            </clipPath>
            <filter id="s4-blue-glow"><feGaussianBlur stdDeviation="7" /></filter>
            <filter id="s4-red-glow"><feGaussianBlur stdDeviation="7" /></filter>
          </defs>
          <rect width="800" height="450" rx="18" fill="url(#s4-space-background)" />
          {Array.from({ length: 48 }, (_, index) => (
            <circle
              key={`s4-star-${index}`}
              cx={14 + ((index * 137) % 772)}
              cy={12 + ((index * 71) % 315)}
              r={index % 7 === 0 ? 1.7 : index % 3 === 0 ? 1.1 : 0.7}
              fill="#e0f2fe"
              opacity={0.25 + (index % 4) * 0.13}
            />
          ))}
          <circle cx="400" cy="610" r="340" fill="url(#s4-earth-glow)" />
          <circle cx="400" cy="610" r="305" fill="url(#s4-earth-body)" opacity="0.72" />
          <g clipPath="url(#s4-earth-clip)" opacity="0.46">
            <path d="M100 380 C180 342 246 360 302 402 C350 438 414 410 466 444 C528 484 592 428 708 492 L760 690 L70 690 Z" fill="#25a879" />
            <path d="M390 342 C464 326 544 358 574 412 C596 452 570 478 632 522 C676 554 706 590 730 652 L350 670 C326 592 368 540 340 480 C312 418 326 358 390 342 Z" fill="#8ab65a" opacity="0.7" />
            <path d="M86 432 C240 374 520 382 714 452" fill="none" stroke="#e0f2fe" strokeWidth="9" strokeLinecap="round" opacity="0.18" />
            <path d="M140 506 C270 454 532 470 682 536" fill="none" stroke="#bae6fd" strokeWidth="7" strokeLinecap="round" opacity="0.14" />
          </g>
          <circle cx="400" cy="610" r="305" fill="none" stroke="#bae6fd" strokeWidth="3" opacity="0.38" />
          <ellipse cx="400" cy="218" rx="344" ry="142" transform="rotate(-7 400 218)" fill="none" stroke="rgba(203,213,225,0.3)" strokeWidth="1.5" strokeDasharray="7 8" />
          <ellipse cx="400" cy="218" rx="292" ry="108" transform="rotate(5 400 218)" fill="none" stroke="rgba(56,189,248,0.58)" strokeWidth="2" />
          <ellipse cx="400" cy="218" rx="238" ry="79" transform="rotate(-3 400 218)" fill="none" stroke="rgba(251,146,60,0.5)" strokeWidth="1.6" strokeDasharray="9 7" />
          <path d="M74 331 C238 266 548 260 726 332" fill="none" stroke="rgba(248,113,113,0.48)" strokeWidth="1.8" strokeDasharray="10 8" />
          <text x="650" y="45" textAnchor="end" fill="#7dd3fc" fontSize="14" fontWeight="700">LEO / گذر مداری فعال</text>
          <text x="615" y="68" textAnchor="end" fill="#94a3b8" fontSize="12">پنجره پایش مشترک • داده تخمینی</text>
          {protectionChoice === "m1_p_mission_reposition" && (
            <path
              d={`M${blueMapX} 220 C${blueMapX - 34} 176, ${blueMapX - 76} 184, ${blueMapX - 112} 235`}
              fill="none"
              stroke="rgba(34,197,94,0.72)"
              strokeWidth="3"
              strokeDasharray="10 7"
            />
          )}
          {redAction === "send_routine_explanation" && (
            <line
              x1={redMapX - 28}
              y1="176"
              x2={blueMapX + 28}
              y2="212"
              stroke="rgba(125,211,252,0.75)"
              strokeWidth="2"
              strokeDasharray="7 6"
            />
          )}
          {showTracking && (
            <path d={`M${blueMapX + 18} 210 L${redMapX - 22} 142 L${redMapX - 18} 202 Z`} fill="url(#s4-sensor-cone)" stroke="rgba(56,189,248,0.58)" strokeWidth="1.5" strokeDasharray="6 5" />
          )}
          {showCommercial && (
            <g>
              <path d={`M112 326 C244 278, 356 232, ${redMapX} 174`} fill="none" stroke="rgba(168,85,247,0.72)" strokeWidth="2" strokeDasharray="8 6" />
              <circle cx="112" cy="326" r="7" fill="#a855f7" /><text x="126" y="330" fill="#d8b4fe" fontSize="12">حسگر تجاری</text>
            </g>
          )}
          {showAlly && (
            <g>
              <path d={`M690 326 C610 274, 508 238, ${blueMapX} 218`} fill="none" stroke="rgba(34,197,94,0.72)" strokeWidth="2" strokeDasharray="8 6" />
              <circle cx="690" cy="326" r="7" fill="#22c55e" /><text x="674" y="350" textAnchor="end" fill="#bbf7d0" fontSize="12">حسگر متحد</text>
            </g>
          )}
          {showOffRamp && (
            <path d={`M${blueMapX} 244 C392 304, 490 310, ${redMapX} 222`} fill="none" stroke="rgba(34,197,94,0.86)" strokeWidth="3" />
          )}
          {privateMessage && (
            <line x1={blueMapX + 30} y1="214" x2={redMapX - 30} y2="178" stroke="rgba(125,211,252,0.82)" strokeWidth="2" strokeDasharray="6 5" />
          )}
          {publicWarning && (
            <circle cx={blueMapX} cy="220" r="74" fill="none" stroke="rgba(251,191,36,0.68)" strokeWidth="2.5" strokeDasharray="10 8"><animate attributeName="r" values="60;82;60" dur="2s" repeatCount="indefinite" /></circle>
          )}
          <line x1={blueMapX + 32} y1="220" x2={redMapX - 32} y2="177" stroke="rgba(251,191,36,0.74)" strokeWidth="2" strokeDasharray="5 6" />
          <text x={(blueMapX + redMapX) / 2} y="174" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="700">{proximityLabel}</text>
          <circle cx={blueMapX} cy="220" r="34" fill="#38bdf8" opacity="0.16" filter="url(#s4-blue-glow)" />
          {showHalo && (
            <circle
              cx={blueMapX}
              cy="220"
              r="48"
              fill="none"
              stroke="rgba(34,197,94,0.75)"
              strokeWidth="3"
            />
          )}
          {showCovert && <circle cx={blueMapX} cy="220" r="42" fill="rgba(34,197,94,0.16)" stroke="rgba(34,197,94,0.46)" strokeWidth="2" strokeDasharray="5 6" />}
          {showFallback && <g><circle cx={blueMapX - 92} cy="286" r="9" fill="#22c55e" /><text x={blueMapX - 76} y="291" fill="#bbf7d0" fontSize="12">ظرفیت پشتیبان</text></g>}
          <circle cx={redMapX} cy="176" r="34" fill="#f87171" opacity="0.15" filter="url(#s4-red-glow)" />
          {showSecondAsset && <g><circle cx="654" cy="104" r="12" fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth="2" /><text x="634" y="82" textAnchor="middle" fill="#fde68a" fontSize="12">دارایی دوم</text></g>}
          <image href={friendlySatelliteAsset} x={blueMapX - 34} y="186" width="68" height="68" preserveAspectRatio="xMidYMid meet" />
          <image href={unknownSatelliteAsset} x={redMapX - 34} y="142" width="68" height="68" preserveAspectRatio="xMidYMid meet" />
          <g transform={`translate(${blueMapX - 50} 257)`}>
            <rect width="100" height="27" rx="7" fill="rgba(8,47,73,0.9)" stroke="rgba(56,189,248,0.72)" />
            <text x="50" y="18" textAnchor="middle" fill="#e0f2fe" fontSize="13" fontWeight="800">A-17 • {ACTOR_LABELS_FA.blue}</text>
          </g>
          <g transform={`translate(${redMapX - 60} 106)`}>
            <rect width="120" height="27" rx="7" fill="rgba(69,10,10,0.88)" stroke="rgba(248,113,113,0.72)" />
            <text x="60" y="18" textAnchor="middle" fill="#fee2e2" fontSize="13" fontWeight="800">R-31 • {ACTOR_LABELS_FA.red}</text>
          </g>
        </svg>
        {phase.startsWith("move2") || phase.startsWith("move3") ? (
          <div className="s4-service-badge">افت کیفیت سرویس</div>
        ) : null}
      </div>
      <p className="s4-orbit-caption">{orbitalCaption}</p>
    </Card>
  );
};

const DecisionWindow = ({
  title,
  context,
  question,
  why,
  options,
  selectedId,
  onSelect,
  onConfirm,
  infoGuideActive,
}: {
  title: string;
  context?: string;
  question: string;
  why?: string;
  options: DecisionOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  onConfirm: () => void;
  infoGuideActive?: boolean;
}) => (
  <DecisionWindowInner
    title={title}
    context={context}
    question={question}
    why={why}
    options={options}
    selectedId={selectedId}
    onSelect={onSelect}
    onConfirm={onConfirm}
    infoGuideActive={infoGuideActive}
  />
);

const DecisionWindowInner = ({
  title,
  context,
  question,
  why,
  options,
  selectedId,
  onSelect,
  onConfirm,
  infoGuideActive,
}: {
  title: string;
  context?: string;
  question: string;
  why?: string;
  options: DecisionOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  onConfirm: () => void;
  infoGuideActive?: boolean;
}) => {
  const [detailOption, setDetailOption] = useState<DecisionOption | null>(null);
  const selectedOption = options.find((option) => option.id === selectedId);
  const compact = options.length >= 6 || options.every((option) => !option.description);
  const decisionOrdinal = getDecisionOrdinalFromTitle(title);
  return (
    <Card>
      <div className={`s4-decision-window${compact ? " compact" : ""}${infoGuideActive ? " info-guide-active" : ""}`}>
        <div>
          {decisionOrdinal && <span className="s4-decision-kicker">نقطه تصمیم {decisionOrdinal} از ۹</span>}
          <h2>{title}</h2>
          {context && (
            <div className="s4-decision-context">
              <strong>چه اتفاقی افتاده؟</strong>
              <p>{context}</p>
            </div>
          )}
          <p className="s4-decision-question">{question}</p>
          {why && <p className="s4-decision-why"><strong>چرا مهم است؟</strong> {why}</p>}
        </div>
        <div className="s4-options-grid">
          {options.map((option, optionIndex) => {
            const active = option.id === selectedId;
            const certainCosts = getCertainResourceCosts(option.id);
            return (
              <div key={option.id} className={`s4-option-card${active ? " selected" : ""}`}>
                <button type="button" onClick={() => onSelect(option.id)}>
                  <strong>{option.label}</strong>
                  {option.description && <span>{option.description}</span>}
                  {certainCosts.length > 0 && (
                    <small className="s4-option-resource-cost">
                      هزینه قطعی منابع: {certainCosts.map((cost) => `${cost.label} ${cost.delta}`).join("، ")}
                    </small>
                  )}
                </button>
                <button
                  type="button"
                  className={`s4-option-info${infoGuideActive && optionIndex === 0 ? " guide-target" : ""}`}
                  aria-label={`جزئیات ${option.label}`}
                  onClick={() => setDetailOption(option)}
                >
                  ⓘ
                </button>
              </div>
            );
          })}
        </div>
        <div className="s4-confirm-bar">
          <span>انتخاب شما: <strong>{selectedOption?.label ?? "هنوز انتخاب نشده"}</strong></span>
          <button className="primary s4-button s4-button-primary" disabled={!selectedId} onClick={onConfirm}>ثبت تصمیم</button>
        </div>
      </div>
      {detailOption && (
        <div className="s4-modal-backdrop" role="dialog" aria-modal="true">
          <div className="s4-modal s4-modal-small">
            <div className="s4-modal-header">
              <h4>جزئیات این تصمیم</h4>
              <button onClick={() => setDetailOption(null)}>بستن</button>
            </div>
            <h2>{detailOption.label}</h2>
            <p>{detailOption.description ?? "این گزینه یک مسیر فشرده برای ثبت دلیل یا اولویت تصمیم است."}</p>
            <p className="hint">مشاهده توضیحات بیشتر می‌تواند به انتخاب‌های بهتر منجر شود.</p>
          </div>
        </div>
      )}
    </Card>
  );
};

const introScreens: Record<Extract<Phase, "intro_title" | "intro_narrative" | "intro_role" | "intro_objectives" | "intro_rules">, {
  title: string;
  subtitle?: string;
  body?: string;
  cta: string;
}> = {
  intro_title: {
    title: "حریم خاکستری مدار",
    subtitle: "همه تهدیدها با شلیک آغاز نمی‌شوند.",
    body: "سناریو ۴ | بازی جنگ فضایی تصمیم‌محور",
    cta: "ادامه",
  },
  intro_narrative: {
    title: "روایت بحران",
    body:
      "مدار پایین زمین هرگز کاملاً آرام نیست.\n\nصدها دارایی فضایی در مسیرهای مختلف حرکت می‌کنند؛ برخی برای ارتباط، برخی برای تصویربرداری، برخی برای پایش و برخی برای سرویس و بازرسی ماهواره‌های دیگر.\n\nدر چنین محیطی، نزدیک‌شدن یک ماهواره به ماهواره دیگر لزوماً یک اقدام خصمانه نیست. اما وقتی روابط سیاسی روی زمین پرتنش باشد، همان مانور عادی می‌تواند معنای دیگری پیدا کند.\n\nطی چند روز گذشته، سامانه‌های پایش ایران تغییر کوچکی در رفتار یک دارایی فضایی متعلق به اسرائیل ثبت کرده‌اند. این دارایی با شناسه R-31 رسماً برای عملیات خدماتی و بازرسی مداری معرفی شده است.\n\nاکنون مسیر آن تغییر کرده است. فاصله R-31 با A-17، دارایی فضایی ایران، در حال کاهش است.\n\nهنوز هیچ حمله‌ای رخ نداده است. هیچ اختلالی به‌طور قطعی به اسرائیل نسبت داده نشده است. و هیچ مدرکی وجود ندارد که ثابت کند نزدیک‌شدن R-31 مقدمه یک اقدام خصمانه است.\n\nاز این لحظه، هر تصمیم شما فقط وضعیت A-17 را تغییر نمی‌دهد. اسرائیل رفتار ایران را می‌بیند و تفسیر می‌کند. متحدان ایران درباره قضاوت شما تصمیم می‌گیرند. اپراتورهای تجاری ممکن است همکاری کنند یا محتاط‌تر شوند.",
    cta: "نقش من در این بحران چیست؟",
  },
  intro_role: {
    title: "نقش شما",
    body:
      "شما رئیس سلول تصمیم‌گیری عملیات فضایی ایران هستید.\n\nوظیفه شما هدایت مستقیم یک ماهواره یا اجرای یک اقدام فنی خاص نیست. شما باید اطلاعات را ارزیابی کنید، میان گزینه‌های مختلف تعادل برقرار کنید و تصمیم‌هایی بگیرید که پیامد عملیاتی، اطلاعاتی، سیاسی و راهبردی دارند.\n\nدر طول سناریو با سه نوع مسئله روبه‌رو می‌شوید:\n- چه مقدار اطلاعات برای تصمیم کافی است؟\n- چه زمانی حفاظت باید آشکار یا پنهان باشد؟\n- چه زمانی پیام، فشار، همکاری یا کاهش تنش مناسب‌تر است؟\n\nاسرائیل نیز مستقل تصمیم می‌گیرد. بنابراین یک انتخاب مشابه همیشه نتیجه یکسانی ایجاد نمی‌کند.\n\nدر این سناریو پاسخ صحیح واحد وجود ندارد.",
    cta: "اهداف مأموریت",
  },
  intro_objectives: {
    title: "اهداف مأموریت",
    body:
      "۱. حفظ تداوم مأموریت: تا حد امکان عملکرد A-17 و خدمات وابسته به آن حفظ شود.\n\n۲. افزایش شناخت: میان نشانه، فرضیه و شواهد قابل اتکا تفاوت بگذارید.\n\n۳. کنترل تشدید: از تبدیل سوءبرداشت یا حادثه محدود به بحران بزرگ‌تر جلوگیری کنید.\n\n۴. حفظ گزینه‌های آینده: همه منابع، اطلاعات و سرمایه سیاسی را در ابتدای بحران مصرف نکنید.\n\n۵. مدیریت ائتلاف: متحدان ایران می‌توانند منبع قدرت و اطلاعات باشند، اما حمایت آن‌ها خودکار نیست.\n\n۶. پرهیز از ادعای فراتر از شواهد: اشتراک اطلاعات می‌تواند اعتماد بسازد؛ ادعا یا افشای بیش از شواهد نیز هزینه دارد.",
    cta: "قواعد سناریو",
  },
  intro_rules: {
    title: "چگونه بازی می‌کنید؟",
    body:
      "اطلاعات کامل نیست: همه داده‌ها از ابتدا در دسترس نیستند و بعضی گزارش‌ها ممکن است ناقص یا متناقض باشند.\n\nاسرائیل مستقل است: R-31 مستقیماً از گزینه شما به یک پاسخ ثابت نمی‌رود؛ رفتار آن بر اساس هدف و برداشت از اقدامات قابل مشاهده ایران تعیین می‌شود.\n\nتصمیم‌ها حافظه دارند: منابع، اعتماد، افشای اطلاعات و وضعیت بحران از مرحله‌ای به مرحله بعد منتقل می‌شوند.\n\nوضعیت‌های نامطمئن کیفی نمایش داده می‌شوند، اما مقدار دقیق منابع خودی همیشه قابل مشاهده است. موتور داخلی متغیرهای پنهان را برای تحلیل ثبت می‌کند.\n\nحقیقت بعداً آشکار می‌شود: در پایان بازی، ابتدا نتیجه مأموریت را می‌بینید. سپس در تحلیل پس از اقدام مشخص می‌شود واقعاً چه رخ داده بود.",
    cta: "آغاز مرحله اول: نزدیک‌شدن",
  },
};

const IntroScreen = ({ phase, onNext }: { phase: keyof typeof introScreens; onNext: () => void }) => {
  const screen = introScreens[phase];
  return (
    <div className="s4-intro-shell">
      <OrbitalScene phase={phase} />
      <Card>
        <div className="s4-intro-content">
          <span className="s4-kicker">سناریو ۴ | بازی جنگ فضایی</span>
          <h1>{screen.title}</h1>
          {screen.subtitle && <h2>{screen.subtitle}</h2>}
          {screen.body && <p>{screen.body}</p>}
          <button className="primary" onClick={onNext}>{screen.cta}</button>
        </div>
      </Card>
    </div>
  );
};

const EvidenceCard = ({
  card,
  source,
  sensitivity,
  onToggle,
}: {
  card: { id: string; title: string; status: string; text: string };
  source: string;
  sensitivity: string;
  onToggle: (open: boolean) => void;
}) => {
  const badgeVariant =
    card.status.includes("تأیید") || card.status.includes("confirmed")
      ? "confirmed"
      : card.status.includes("تحلیل") || card.status.includes("analytic")
        ? "analytical"
        : card.status.includes("متناقض") || card.status.includes("conflict")
          ? "conflicting"
          : "preliminary";
  return (
    <details className="s4-evidence-card" onToggle={(event) => {
      onToggle((event.currentTarget as HTMLDetailsElement).open);
    }}>
      <summary>
        <span>{card.title}</span>
        <span className={`s4-badge s4-badge-${badgeVariant}`}>{card.status}</span>
      </summary>
      <p>{card.text}</p>
      <footer>
        <span>منبع: {source}</span>
        <span>حساسیت: {sensitivity}</span>
      </footer>
      <details className="s4-evidence-limits" onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) {
          eventLogger.log({ type: "s4_evidence_detail_open", detail: { evidenceId: card.id } });
        }
      }}>
        <summary>این گزارش چه چیزی را ثابت نمی‌کند؟</summary>
        <p>این گزارش به‌تنهایی نیت، مسئولیت قطعی یا بهترین مسیر اقدام را ثابت نمی‌کند؛ فقط بخشی از تصویر را روشن‌تر می‌کند.</p>
      </details>
    </details>
  );
};

const decisionWeight: Record<string, number> = {
  m1_i_passive: -0.35,
  m1_i_dedicated_ssa: 0.45,
  m1_i_commercial: 0.35,
  m1_i_allied_network: 0.55,
  m1_p_hold: 0.15,
  m1_p_covert_readiness: 0.1,
  m1_p_visible_protection: -0.25,
  m1_p_mission_reposition: -0.55,
  m1_c_none: -0.05,
  m1_c_private: 0.35,
  m1_c_allies: 0.45,
  m1_c_public_warning: -0.35,
  m1_c_private_allied: 0.45,
  m2_a_technical_diagnostics: 0.55,
  m2_a_second_sensor: 0.45,
  m2_a_ally_intel: 0.5,
  m2_a_commercial_validation: 0.35,
  m2_a_act_with_current_data: -0.35,
  m2_m_continue_normal: -0.25,
  m2_m_activate_fallback: 0.25,
  m2_m_reduce_load: 0.2,
  m2_m_protective_reconfiguration: -0.1,
  m2_m_split_service: 0.25,
  m2_r_no_counteraction: 0.2,
  m2_r_request_explanation: 0.35,
  m2_r_private_warning: -0.15,
  m2_r_joint_allied_response: 0.25,
  m2_r_request_defensive_authority: -0.35,
  m2_r_deconfliction_offer: 0.65,
  m3_t_insufficient: 0.55,
  m3_t_sufficient_limited: 0.25,
  m3_t_sufficient_strong: -0.2,
  m3_coa_contain_understand: 0.6,
  m3_coa_controlled_deterrence: -0.15,
  m3_coa_coordinated_response: 0.35,
  m3_coa_negotiated_deescalation: 0.65,
  m3_coa_unilateral_strong: -0.65,
  m3_info_keep_restricted: 0.2,
  m3_info_share_allies: 0.35,
  m3_info_public_partial: -0.15,
  m3_info_public_attribution: -0.55,
};

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const metricLabel = (value: number) => {
  if (value < 30) return "پایین";
  if (value < 55) return "متوسط";
  if (value < 75) return "نسبتاً بالا";
  return "بالا";
};
const operationalStrategicBand = (value: number | null) => {
  if (value == null) return "داده کافی ثبت نشده";
  if (value < -0.45) return "گرایش عملیاتی مشخص";
  if (value < -0.15) return "تمایل عملیاتی";
  if (value <= 0.15) return "مرکز طیف";
  if (value <= 0.45) return "تمایل راهبردی";
  return "گرایش راهبردی مشخص";
};

const CognitiveDashboard = ({
  move1,
  move2,
  move3,
  finalSnapshot,
  resourceEvents,
  isAdmin,
}: {
  move1: ScenarioOneDecisionRecord[];
  move2: ScenarioOneDecisionRecord[];
  move3: ScenarioOneDecisionRecord[];
  finalSnapshot: ScenarioOneFinalSnapshot;
  resourceEvents: ResourceEvent[];
  isAdmin: boolean;
}) => {
  const all = [...move1, ...move2, ...move3];
  const cognitiveV3 = finalSnapshot.cognitiveScoresV3 as unknown as CognitiveModelV3Result;
  const orientationV2 = isAdmin ? calculateOrientationV2(all, { evidenceInteractionValid: true, timingLogsConsistent: true }) : null;
  const index = cognitiveV3?.orientation.overall ?? null;
  const perMove = [
    ["مرحله ۱", cognitiveV3?.orientation.perMove.move1],
    ["مرحله ۲", cognitiveV3?.orientation.perMove.move2],
    ["مرحله ۳", cognitiveV3?.orientation.perMove.move3],
  ] as const;
  const maxDecisionMs = Math.max(...all.map((item) => item.telemetryV3?.activeDecisionMs ?? item.responseTimeMs), 1);
  const openedEvidenceCount = new Set([
    ...finalSnapshot.move1.evidenceSeen,
    ...finalSnapshot.move2.evidenceSeen,
    ...finalSnapshot.move3.evidenceSeen,
  ]).size;
  const dimensions: Array<[string, number | null, string]> = [
    ["جست‌وجوی اطلاعات", cognitiveV3?.scores.informationSeeking ?? null, "میزان استفاده از مسیرهای اطلاعاتی و شواهد مرتبط در تصمیم‌های این اجرا."],
    ["تفکر مرتبه دوم", cognitiveV3?.scores.secondOrderThinking ?? null, "میزان توجه انتخاب‌ها به پیامد مرحله بعد، واکنش اسرائیل و حفظ گزینه‌های آینده."],
    ["مدل‌سازی اسرائیل", cognitiveV3?.scores.adversaryModeling ?? null, "میزان توجه تصمیم‌ها به اینکه اسرائیل چه چیزی را مشاهده و چگونه تفسیر می‌کند."],
    ["حساسیت به تشدید", cognitiveV3?.scores.escalationSensitivity ?? null, "میزان وزنی که تصمیم‌ها به پیامدهای تشدید یا کاهش تنش داده‌اند؛ مقدار بالاتر الزاماً بهتر نیست."],
    ["پرهیز از ادعای فراتر از شواهد", cognitiveV3?.scores.informationDiscipline ?? null, "تناسب شدت ادعا و افشای اطلاعات با قدرت شواهد موجود در زمان تصمیم. این شاخص بیشتر بر جلوگیری از ادعای بیش از شواهد تمرکز دارد و به‌تنهایی میزان استفاده مؤثر از اطلاعات را نمی‌سنجد."],
    ["به‌روزرسانی مبتنی بر شواهد", cognitiveV3?.scores.evidenceResponsiveUpdating ?? null, "میزان همسویی تغییر برآورد شما با تغییر شواهد در دسترس."],
    ["گرایش ائتلافی", cognitiveV3?.scores.coalitionOrientation ?? null, "جایگاه نسبی انتخاب‌ها از یک‌جانبه‌تر تا ائتلافی‌تر نسبت به گزینه‌های موجود."],
    ["مدیریت منابع", cognitiveV3?.scores.resourceStewardship ?? null, "حفظ ظرفیت‌ها بر اساس هزینه مستقیم انتخاب‌های کاربر، بدون امتیازدادن به بازیابی بازیگران."],
    ["برنامه‌ریزی و آینده‌نگری", cognitiveV3?.scores.planningForesight ?? null, "این شاخص یک پروکسی رفتاری از برنامه‌ریزی در همین سناریو است و جایگزین آزمون مستقل کارکرد برنامه‌ریزی نیست."],
    ["یکپارچه‌سازی چندمعیاره", cognitiveV3?.scores.multiDomainIntegration ?? null, "میزان پوشش هم‌زمان حوزه‌های مأموریت، اطلاعات، منابع، ائتلاف، مشروعیت و آینده در انتخاب‌ها."],
    ["گرایش به پذیرش ریسک", cognitiveV3?.scores.riskPosture == null ? null : (cognitiveV3.scores.riskPosture + 1) * 50, "جایگاه نسبی انتخاب‌ها در طیف ریسک‌گریز تا ریسک‌پذیر نسبت به گزینه‌های همان موقعیت."],
    ["انسجام تصمیم", cognitiveV3?.scores.decisionCoherence ?? null, "هم‌خوانی دلیل اعلام‌شده با مسیر انتخاب‌ها؛ مقدار پایین به معنی تصمیم اشتباه نیست."],
  ];

  return (
    <Card>
      <div className="s4-dashboard">
        <section className="s4-dashboard-hero">
          <h2>طیف جهت‌گیری تصمیم عملیاتی–راهبردی در این اجرا</h2>
          {index == null ? (
            <p>داده کافی برای این شاخص ثبت نشده است.</p>
          ) : (
            <>
              <div className="s4-spectrum" dir="ltr">
                <span>عملیاتی</span>
                <div><i style={{ insetInlineStart: `${cognitiveV3.orientation.markerPercent}%` }} /></div>
                <span>راهبردی</span>
              </div>
              <p>
                شاخص کل: <strong>{index >= 0 ? "+" : ""}{index.toFixed(2)}</strong> — {operationalStrategicBand(index)}. تفسیر: <strong>{cognitiveV3.orientation.interpretation}</strong>.
              </p>
              <p className="hint">عملیاتی یا راهبردی بودن به‌خودی‌خود به معنی درست/غلط یا خوب/بد بودن تصمیم نیست.</p>
            </>
          )}
          <div className="s4-per-move">
            {perMove.map(([label, value]) => (
              <span key={label}>{label}: {value == null ? "داده ناکافی" : value.toFixed(2)}</span>
            ))}
          </div>
          <div className="s4-orientation-supporting">
            <span><strong>{cognitiveV3?.orientation.operationalStrength == null ? "—" : `${cognitiveV3.orientation.operationalStrength.toFixed(0)} / 100`}</strong>قدرت عملیاتی</span>
            <span><strong>{cognitiveV3?.orientation.strategicStrength == null ? "—" : `${cognitiveV3.orientation.strategicStrength.toFixed(0)} / 100`}</strong>قدرت راهبردی</span>
            <span><strong>{cognitiveV3?.orientation.integration == null ? "—" : `${cognitiveV3.orientation.integration.toFixed(0)} / 100`}</strong>یکپارچگی عملیاتی–راهبردی</span>
            <span><strong>{cognitiveV3?.orientation.dispersion == null ? "—" : cognitiveV3.orientation.dispersion.toFixed(2)}</strong>{cognitiveV3?.orientation.dispersionLabel}</span>
            <span><strong>{cognitiveV3 ? `${cognitiveV3.dataCompleteness.overall.toFixed(0)}٪` : "—"}</strong>کامل‌بودن داده</span>
            <span><strong>آزمایشی</strong>وضعیت اعتبار مدل: در حال اعتبارسنجی</span>
          </div>
          {cognitiveV3?.orientation.dispersion != null && cognitiveV3.orientation.dispersion > .15 && Math.abs(index ?? 0) <= .15 && (
            <p>میانگین سه مرحله نزدیک مرکز است، اما جهت‌گیری میان مراحل تغییر کرده؛ این نتیجه بیشتر یک رویکرد وابسته به موقعیت را نشان می‌دهد تا گرایشی ثابت.</p>
          )}
          <p className="s4-proxy-boundary">این شاخص‌ها فقط الگوی تصمیم‌گیری ثبت‌شده در همین اجرای سناریو را توصیف می‌کنند و تشخیص شخصیت یا آزمون روان‌سنجی قطعی محسوب نمی‌شوند.</p>
        </section>
        <section>
          <h3>شاخص‌های رفتاری تصمیم‌گیری</h3>
          <div className="s4-bars">
            {dimensions.map(([label, value, text]) => (
              <div key={label} title={text}>
                <span>{label}</span>
                <div><i style={{ width: `${value ?? 0}%` }} /></div>
                <strong>{value == null ? "داده کافی برای این شاخص ثبت نشده است." : `${value.toFixed(0)} — ${metricLabel(value)}`}</strong>
                <small>{text}</small>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>تله‌متری توصیفی تصمیم</h3>
          <p>۹ نقطه تصمیم اصلی، میانه زمان فعال تصمیم {cognitiveV3?.timing.medianActiveDecisionMs == null ? "داده ناکافی" : `${(cognitiveV3.timing.medianActiveDecisionMs / 1000).toFixed(1)} ثانیه`}، دامنه میان‌چارکی {cognitiveV3?.timing.iqrActiveDecisionMs == null ? "داده ناکافی" : `${(cognitiveV3.timing.iqrActiveDecisionMs / 1000).toFixed(1)} ثانیه`}، بازنگری انتخاب {cognitiveV3?.timing.totalRevisions ?? 0} بار در {cognitiveV3?.timing.revisedWindows ?? 0} پنجره، شواهد بازشده {openedEvidenceCount} مورد.</p>
          <p>زمان مطالعه فعال شواهد: {((cognitiveV3?.timing.totalEvidenceDwellMs ?? 0) / 1000).toFixed(1)} ثانیه. زمان واکنش فقط توصیفی است و در شاخص جهت‌گیری یا کیفیت تصمیم دخالت ندارد.</p>
          <p>طولانی‌ترین تصمیم: {cognitiveV3?.timing.longestDecision ? `${windowTitles[cognitiveV3.timing.longestDecision.windowId as DecisionWindowId]}، ${(cognitiveV3.timing.longestDecision.activeDecisionMs / 1000).toFixed(1)} ثانیه` : "داده ناکافی"}؛ کوتاه‌ترین تصمیم: {cognitiveV3?.timing.shortestDecision ? `${windowTitles[cognitiveV3.timing.shortestDecision.windowId as DecisionWindowId]}، ${(cognitiveV3.timing.shortestDecision.activeDecisionMs / 1000).toFixed(1)} ثانیه` : "داده ناکافی"}.</p>
          <p>تغییر انتخاب اول تا نهایی: {cognitiveV3?.timing.firstToFinalChanges.length ?? 0} پنجره؛ نرخ بازنگری پس از مشاهده شواهد مرتبط: {cognitiveV3?.timing.evidenceTriggeredRevisionRate == null ? "داده کافی ثبت نشده است" : `${cognitiveV3.timing.evidenceTriggeredRevisionRate.toFixed(0)}٪`}.</p>
          <p>وضعیت پایانی: {endStatePersianLabel(finalSnapshot.primaryEndState)}</p>
        </section>
        <section>
          <h3>مسیر اطمینان انتساب</h3>
          <div className="s4-attribution-line">
            {[finalSnapshot.move2.attributionEstimatePre, finalSnapshot.move2.attributionEstimatePost, finalSnapshot.move3.playerAttributionEstimateFinal].map((value, index) => (
              <span key={`${value}-${index}`} style={{ insetInlineStart: `${value}%` }}>{value}</span>
            ))}
          </div>
          <p>این اعداد برآوردهای خود شما هستند و تا تحلیل پس از اقدام به معنای درست/غلط بودن قضاوت نیستند.</p>
          <p>هم‌سویی برآورد با قدرت شواهد قابل مشاهده: {cognitiveV3?.attribution.meanEvidenceAlignment == null ? "داده کافی ثبت نشده است" : `${cognitiveV3.attribution.meanEvidenceAlignment.toFixed(0)} / 100`}.</p>
        </section>
        <section>
          <h3>زمان تصمیم و بازنگری</h3>
          <div className="s4-bars">
            {all.map((item) => (
              <div key={`${item.windowId}-${item.selectedOptionId}`}>
                <span>{windowTitles[item.windowId]}</span>
                <div><i style={{ width: `${Math.max(4, ((item.telemetryV3?.activeDecisionMs ?? item.responseTimeMs) / maxDecisionMs) * 100)}%` }} /></div>
                <strong>{((item.telemetryV3?.activeDecisionMs ?? item.responseTimeMs) / 1000).toFixed(1)} ثانیه فعال</strong>
                <small>بازنگری: {item.changeCount}</small>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>مسیر منابع</h3>
          <div className="s4-resource-paths">
            {[
              ["ظرفیت SSA", "ssaCapacity"],
              ["ظرفیت حفاظتی", "protectiveCapacity"],
              ["سرمایه سیاسی", "politicalCapital"],
              ["ظرفیت افشای امن", "disclosureBudget"],
            ].map(([label, key]) => {
              const points = [
                finalSnapshot.move1.stateBefore.resources,
                move2[0]?.stateBefore.resources ?? finalSnapshot.move1.stateAfter.resources,
                move3[0]?.stateBefore.resources ?? finalSnapshot.move2.stateAfter.resources,
                finalSnapshot.move3.stateAfter.resources,
              ].map((resources) => resources[key as keyof typeof resources]);
              const stageLabels = ["شروع", "پس از مرحله ۱", "پس از مرحله ۲", "پس از مرحله ۳"];
              return (
                <div className="s4-resource-path-row" key={label}>
                  <strong>{label}</strong>
                  <div className="s4-resource-path-stages">
                    {points.map((value, index) => {
                      const delta = index === 0 ? 0 : value - points[index - 1];
                      return (
                        <div key={`${label}-${index}`} className="s4-resource-path-stage">
                          <span>{stageLabels[index]}</span>
                          <b>{value} / 100</b>
                          <div><i style={{ width: `${value}%` }} /></div>
                          <small className={delta > 0 ? "positive" : delta < 0 ? "negative" : ""}>
                            {index === 0 ? "مقدار اولیه" : delta === 0 ? "بدون تغییر" : `${delta > 0 ? "+" : ""}${delta}`}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <details className="s4-resource-dashboard-causes">
            <summary>علت تغییرات اصلی منابع</summary>
            {(["ssaCapacity", "protectiveCapacity", "politicalCapital", "disclosureBudget"] as const).map((resource) => {
              const events = resourceEvents.filter((event) => event.resource === resource);
              return (
                <div key={resource}>
                  <strong>{getResourceLabel(resource)}</strong>
                  <span>{events.length ? events.map((event) => `${event.delta > 0 ? "+" : ""}${event.delta} — ${event.rationale}`).join(" | ") : "بدون تغییر"}</span>
                </div>
              );
            })}
          </details>
        </section>
        {isAdmin && (
          <section className="s4-admin-methodology">
            <h3>روش‌شناسی و داده خام مدیر</h3>
            <p>مدل {finalSnapshot.measurementModelVersion} | فرمول {finalSnapshot.formulaVersion} | پروفایل {finalSnapshot.optionProfileVersion} | آزمون لنگر {finalSnapshot.anchorTestVersion} | پنل خبره {finalSnapshot.expertPanelVersion}</p>
            <p>oldOSI: {finalSnapshot.oldOSI?.toFixed(4) ?? "null"} | V2: {orientationV2?.overall?.toFixed(4) ?? "null"} | V3: {index?.toFixed(4) ?? "null"}</p>
            <p><strong>کیفیت فرایند پاسخ: {cognitiveV3?.responseProcess.status === "caution" ? "نیازمند احتیاط" : "بدون هشدار چندگانه"}</strong></p>
            <details><summary>پرچم‌های توصیفی فرایند پاسخ</summary><pre>{JSON.stringify(cognitiveV3?.responseProcess ?? null, null, 2)}</pre></details>
            <details><summary>ممیزی به‌روزرسانی مبتنی بر شواهد</summary><pre>{JSON.stringify(cognitiveV3?.attribution.evidenceUpdatingAudit ?? [], null, 2)}</pre></details>
            <details><summary>هشدارهای توزیع سازه‌ها</summary><pre>{JSON.stringify(CONSTRUCT_DISTRIBUTION_AUDIT_V3, null, 2)}</pre><p>هشدارها جریمه بازیکن نیستند و فقط برای ممیزی مدل نمایش داده می‌شوند.</p></details>
            <details><summary>ورودی‌های فرمول و مقادیر هر پنجره</summary><pre>{JSON.stringify(cognitiveV3?.perWindow ?? [], null, 2)}</pre></details>
            <details><summary>کامل‌بودن داده و علت مقادیر گمشده</summary><pre>{JSON.stringify({ components: cognitiveV3?.dataCompleteness.components, missing: cognitiveV3?.missingReasons }, null, 2)}</pre></details>
            <details><summary>همه ویژگی‌ها و خروجی‌های مشتق‌شده</summary><pre>{JSON.stringify(cognitiveV3 ?? null, null, 2)}</pre></details>
            <details><summary>تله‌متری خام V3</summary><pre>{JSON.stringify(finalSnapshot.decisionTelemetryV3 ?? [], null, 2)}</pre></details>
          </section>
        )}
      </div>
    </Card>
  );
};

export const ScenarioFourRedesignedScenarioOne = ({
  scenarioId,
  nodeId,
  userProfileId,
  onCompletionUiActiveChange,
  onComplete,
}: ScenarioFourRedesignedScenarioOneProps) => {
  const isAdmin = userProfileId === "admin";
  const runIdRef = useRef<string>("");
  const startedAtRef = useRef(new Date().toISOString());
  const windowStartedAtRef = useRef(getNow());
  const windowEnteredAtRef = useRef(new Date().toISOString());
  const selectionStateRef = useRef<SelectionTelemetryStateV3>({ optionChangeCount: 0, selectionTimeline: [] });
  const stateBeforeWindowRef = useRef<ScenarioOneState | null>(null);
  const evidenceAvailableRef = useRef<string[]>([]);
  const evidenceTimelineRef = useRef<EvidenceOpenTelemetryV3[]>([]);
  const evidenceTimelineStartIndexRef = useRef(0);
  const openEvidenceRef = useRef(new Map<string, { index: number; startedAt: number }>());
  const decisionTelemetryRef = useRef<DecisionTelemetryV3[]>([]);
  const attributionTelemetryRef = useRef<AttributionEstimateTelemetryV3[]>([]);
  const helpOpenedRef = useRef(false);
  const glossaryOpenedRef = useRef(false);
  const activeDecisionAccumulatedRef = useRef(0);
  const activeDecisionStartedRef = useRef<number | null>(null);
  const confirmLockedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("intro_title");
  const [state, setState] = useState<ScenarioOneState>(() => {
    const storedRun = localStorage.getItem(RUN_KEY);
    const run =
      storedRun ??
      JSON.stringify({
        runId: `run-${Date.now()}`,
        seedBase: `${scenarioId}:${userProfileId ?? "anonymous"}:${Date.now()}`,
      });
    localStorage.setItem(RUN_KEY, run);
    const parsed = JSON.parse(run) as { runId: string; seedBase: string };
    runIdRef.current = parsed.runId;
    const intent = selectRedIntent(parsed.seedBase);
    return createInitialScenarioOneState(intent);
  });
  const rngSeed = useMemo(
    () => `${scenarioId}:${userProfileId ?? "anonymous"}:${runIdRef.current}`,
    [scenarioId, userProfileId]
  );
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [decisions, setDecisions] = useState<ScenarioOneDecisionRecord[]>([]);
  const [evidenceSeen, setEvidenceSeen] = useState<string[]>([]);
  const [choices, setChoices] = useState({
    information: "",
    protection: "",
    communication: "",
    reason: "",
  });
  const [snapshot, setSnapshot] = useState<MoveSnapshot | null>(null);
  const [move2Snapshot, setMove2Snapshot] = useState<Move2Snapshot | null>(null);
  const [move3Snapshot, setMove3Snapshot] = useState<Move3Snapshot | null>(null);
  const [finalSnapshot, setFinalSnapshot] = useState<ScenarioOneFinalSnapshot | null>(null);
  const [situationUpdate, setSituationUpdate] = useState<Array<{ title: string; text: string }>>([]);
  const [redScores, setRedScores] = useState<Record<string, number> | null>(null);
  const [checkpointCount, setCheckpointCount] = useState(0);
  const [move2Choices, setMove2Choices] = useState({
    investigation: "",
    mission: "",
    response: "",
    reason: "",
  });
  const [move3Choices, setMove3Choices] = useState({
    threshold: "",
    coa: "",
    informationPolicy: "",
    offRamp: "",
    reason: "",
  });
  const [move2Decisions, setMove2Decisions] = useState<ScenarioOneDecisionRecord[]>([]);
  const [move3Decisions, setMove3Decisions] = useState<ScenarioOneDecisionRecord[]>([]);
  const [move2AttributionPre, setMove2AttributionPre] = useState(50);
  const [move2AttributionPost, setMove2AttributionPost] = useState(50);
  const [move3AttributionFinal, setMove3AttributionFinal] = useState(50);
  const [move2StartedAt, setMove2StartedAt] = useState<string | null>(null);
  const [move3StartedAt, setMove3StartedAt] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [evidenceReviewOpen, setEvidenceReviewOpen] = useState(false);
  const [toolbarGuideOpen, setToolbarGuideOpen] = useState(true);
  const [decisionInfoGuideOpen, setDecisionInfoGuideOpen] = useState(true);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [resourceEvents, setResourceEvents] = useState<ResourceEvent[]>([]);
  const [recentResourceEvents, setRecentResourceEvents] = useState<ResourceEvent[]>([]);
  const resourceDeltaTimerRef = useRef<number | null>(null);

  const publishResourceEvents = (events: ResourceEvent[]) => {
    if (!events.length) return;
    setResourceEvents((current) => [...current, ...events]);
    setRecentResourceEvents(events);
    for (const event of events) {
      logScenarioFour(event.kind === "user_cost" ? "resource_change" : "resource_recovery", scenarioId, nodeId, {
        moveId: event.moveId,
        resource: event.resource,
        resource_source: event.source,
        before: event.before,
        delta: event.delta,
        after: event.after,
        rationale: event.rationale,
      });
    }
    if (resourceDeltaTimerRef.current != null) window.clearTimeout(resourceDeltaTimerRef.current);
    resourceDeltaTimerRef.current = window.setTimeout(() => setRecentResourceEvents([]), 2600);
  };

  useEffect(() => () => {
    if (resourceDeltaTimerRef.current != null) window.clearTimeout(resourceDeltaTimerRef.current);
  }, []);

  useEffect(() => {
    onCompletionUiActiveChange?.(
      phase === "update" ||
        phase === "move2_update" ||
        phase === "final_report" ||
        phase === "dashboard" ||
        phase === "aar"
    );
  }, [onCompletionUiActiveChange, phase]);

  useEffect(() => {
    logScenarioFour("s1_move_start", scenarioId, nodeId, {
      moveId: "move_1",
      hostedInScenarioSlot: 4,
      rngSeed,
    });
  }, [nodeId, rngSeed, scenarioId]);

  useEffect(() => {
    if (phase.startsWith("intro")) {
      logScenarioFour("s4_intro_screen_view", scenarioId, nodeId, { phase });
    }
  }, [nodeId, phase, scenarioId]);

  useEffect(() => {
    const pause = () => {
      if (activeDecisionStartedRef.current == null) return;
      activeDecisionAccumulatedRef.current += getNow() - activeDecisionStartedRef.current;
      activeDecisionStartedRef.current = null;
    };
    const resume = () => {
      if (document.visibilityState === "visible" && document.hasFocus() && activeDecisionStartedRef.current == null) {
        activeDecisionStartedRef.current = getNow();
      }
    };
    const onVisibility = () => document.visibilityState === "hidden" ? pause() : resume();
    window.addEventListener("blur", pause);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const currentActiveDecisionMs = () => activeDecisionAccumulatedRef.current +
    (activeDecisionStartedRef.current == null ? 0 : getNow() - activeDecisionStartedRef.current);

  const snapshotEvidenceTimeline = () => {
    const now = getNow();
    const closedAt = new Date().toISOString();
    for (const [evidenceId, open] of openEvidenceRef.current) {
      const item = evidenceTimelineRef.current[open.index];
      item.closedAt = closedAt;
      item.activeDwellMs = (item.activeDwellMs ?? 0) + Math.max(0, now - open.startedAt);
      openEvidenceRef.current.delete(evidenceId);
    }
    return evidenceTimelineRef.current.slice(evidenceTimelineStartIndexRef.current).map((item) => ({ ...item }));
  };

  const buildDecisionTelemetry = (
    moveId: "move_1" | "move_2" | "move_3",
    windowId: DecisionWindowId,
    finalSelectedOptionId: string,
    before: ScenarioOneState,
    after: ScenarioOneState,
    reason?: string
  ): DecisionTelemetryV3 => ({
    runId: runIdRef.current,
    moveId,
    windowId,
    enteredAt: windowEnteredAtRef.current,
    confirmedAt: new Date().toISOString(),
    elapsedMs: Math.max(0, getNow() - windowStartedAtRef.current),
    activeDecisionMs: currentActiveDecisionMs(),
    firstSelectedOptionId: selectionStateRef.current.firstSelectedOptionId ?? finalSelectedOptionId,
    finalSelectedOptionId,
    optionChangeCount: selectionStateRef.current.optionChangeCount,
    selectionTimeline: [...selectionStateRef.current.selectionTimeline],
    evidenceAvailableIds: [...evidenceAvailableRef.current],
    evidenceOpenedIds: [...new Set(evidenceTimelineRef.current.map((item) => item.evidenceId))],
    evidenceOpenTimeline: snapshotEvidenceTimeline(),
    helpOpened: helpOpenedRef.current,
    glossaryOpened: glossaryOpenedRef.current,
    playerAttributionEstimateBefore: before.knowledge.playerAttributionEstimate,
    playerAttributionEstimateAfter: after.knowledge.playerAttributionEstimate,
    systemAttributionConfidenceVisibleAtDecision: before.knowledge.systemAttributionConfidence,
    statedReasonId: reason,
    statedReasonText: reason,
    resourcesBefore: { ...before.resources },
    resourcesAfterUserAction: { ...after.resources },
  });

  const appendDecisionTelemetry = (telemetry: DecisionTelemetryV3) => {
    const existing = decisionTelemetryRef.current.findIndex((item) => item.windowId === telemetry.windowId);
    if (existing >= 0) decisionTelemetryRef.current[existing] = telemetry;
    else decisionTelemetryRef.current.push(telemetry);
  };

  const enterWindow = (
    windowId: DecisionWindowId,
    moveId: "move_1" | "move_2" | "move_3",
    sourceState: ScenarioOneState = state
  ) => {
    setSelectedId(undefined);
    selectionStateRef.current = { optionChangeCount: 0, selectionTimeline: [], firstSelectedOptionId: undefined, finalSelectedOptionId: undefined };
    evidenceTimelineStartIndexRef.current = decisionTelemetryRef.current.length === 0 ? 0 : evidenceTimelineRef.current.length;
    windowStartedAtRef.current = getNow();
    windowEnteredAtRef.current = new Date().toISOString();
    evidenceAvailableRef.current = [...sourceState.knowledge.evidenceIds];
    helpOpenedRef.current = false;
    glossaryOpenedRef.current = false;
    activeDecisionAccumulatedRef.current = 0;
    activeDecisionStartedRef.current = document.visibilityState === "visible" && document.hasFocus() ? getNow() : null;
    confirmLockedRef.current = false;
    stateBeforeWindowRef.current = cloneState(sourceState);
    logScenarioFour("s1_decision_window_enter", scenarioId, nodeId, {
      moveId,
      windowId,
    });
    setCheckpointCount((count) => count + 1);
  };

  const moveToPhase = (next: Phase) => {
    setPhase(next);
    if (next === "dw1") enterWindow("m1_information", "move_1");
    if (next === "dw2") enterWindow("m1_protection", "move_1");
    if (next === "dw3") enterWindow("m1_communication", "move_1");
    if (next === "reason") enterWindow("m1_reason", "move_1");
    if (next === "move2_dw4") enterWindow("m2_investigation", "move_2");
    if (next === "move2_dw5") enterWindow("m2_mission", "move_2");
    if (next === "move2_dw6") enterWindow("m2_response", "move_2");
    if (next === "move2_reason") enterWindow("m2_reason", "move_2");
    if (next === "move3_dw7") enterWindow("m3_threshold", "move_3");
    if (next === "move3_dw8") enterWindow("m3_coa", "move_3");
    if (next === "move3_dw9") enterWindow("m3_info", "move_3");
    if (next === "move3_offramp") enterWindow("m3_offramp", "move_3");
    if (next === "move3_reason") enterWindow("m3_reason", "move_3");
  };

  const handleSelect = (
    optionId: string,
    windowId: DecisionWindowId,
    moveId: "move_1" | "move_2" | "move_3" = "move_1"
  ) => {
    const previous = selectionStateRef.current;
    const next = applyOptionSelectionV3(previous, optionId, new Date().toISOString());
    selectionStateRef.current = next;
    if (next.optionChangeCount > previous.optionChangeCount) {
      logScenarioFour("s1_option_change", scenarioId, nodeId, {
        moveId,
        windowId,
        fromOptionId: previous.finalSelectedOptionId,
        toOptionId: optionId,
        changeCount: next.optionChangeCount,
      });
    }
    setSelectedId(optionId);
    logScenarioFour("s1_option_select", scenarioId, nodeId, {
      moveId,
      windowId,
      selectedOptionId: optionId,
    });
  };

  const confirmDecision = (
    windowId: "m1_information" | "m1_protection" | "m1_communication",
    nextPhase: Phase
  ) => {
    if (!selectedId || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
    const before = stateBeforeWindowRef.current ?? cloneState(state);
    const after = applyBlueDecision(state, windowId, selectedId, rngSeed);
    const decisionResourceEvents = captureDecisionResourceEvents(before.resources, after.resources, selectedId, "move_1");
    const telemetryV3 = buildDecisionTelemetry("move_1", windowId, selectedId, before, after);
    const elapsed = telemetryV3.elapsedMs;
    const record: ScenarioOneDecisionRecord = {
      moveId: "move_1",
      windowId,
      selectedOptionId: selectedId,
      firstSelectedOptionId: selectionStateRef.current.firstSelectedOptionId ?? selectedId,
      changeCount: selectionStateRef.current.optionChangeCount,
      responseTimeMs: elapsed,
      stateBefore: before,
      stateAfter: after,
      resourcesBefore: before.resources,
      resourcesAfter: after.resources,
      resourceEvents: decisionResourceEvents,
      telemetryV3,
    };
    appendDecisionTelemetry(telemetryV3);
    publishResourceEvents(decisionResourceEvents);
    setState(after);
    setDecisions((items) => [...items, record]);
    setChoices((current) => ({
      ...current,
      information: windowId === "m1_information" ? selectedId : current.information,
      protection: windowId === "m1_protection" ? selectedId : current.protection,
      communication: windowId === "m1_communication" ? selectedId : current.communication,
    }));
    logScenarioFour(
      "s1_decision_confirm",
      scenarioId,
      nodeId,
      {
        moveId: "move_1",
        windowId,
        selectedOptionId: selectedId,
        firstSelectedOptionId: record.firstSelectedOptionId,
        changeCount: record.changeCount,
      },
      elapsed
    );
    logScenarioFour("s1_state_transition", scenarioId, nodeId, {
      moveId: "move_1",
      windowId,
      resourcesBefore: before.resources,
      resourcesAfter: after.resources,
    });
    setPhase(nextPhase);
    if (nextPhase === "dw2") enterWindow("m1_protection", "move_1", after);
    if (nextPhase === "dw3") enterWindow("m1_communication", "move_1", after);
    if (nextPhase === "reason") enterWindow("m1_reason", "move_1", after);
  };

  const confirmReason = () => {
    if (!selectedId || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
    const reasonState = stateBeforeWindowRef.current ?? state;
    appendDecisionTelemetry(buildDecisionTelemetry("move_1", "m1_reason", selectedId, reasonState, state, selectedId));
    setChoices((current) => ({ ...current, reason: selectedId }));
    logScenarioFour("s1_reason_capture", scenarioId, nodeId, {
      moveId: "move_1",
      reason: selectedId,
    });

    const finalChoices = {
      ...choices,
      reason: selectedId,
    };
    setPhase("resolving");
    const result = adjudicateMoveOne({
      startedAt: startedAtRef.current,
      stateBefore: decisions[0]?.stateBefore ?? state,
      stateAfterBlue: state,
      decisions,
      evidenceSeen,
      choices: finalChoices,
      rngSeed,
    });
    setSnapshot(result.snapshot);
    setSituationUpdate(result.situationUpdate);
    setRedScores(result.redScores);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.snapshot));
    localStorage.setItem(
      "space-war.scenario4.redesigned-s1.move2-handoff",
      JSON.stringify({
        previousMoveSnapshot: result.snapshot,
        initialState: result.snapshot.stateAfter,
        runSeed: rngSeed,
        runId: runIdRef.current,
      })
    );
    for (const injectId of result.snapshot.injectsTriggered) {
      logScenarioFour("s1_inject_triggered", scenarioId, nodeId, {
        moveId: "move_1",
        injectId,
      });
    }
    logScenarioFour("s1_actor_resolution", scenarioId, nodeId, {
      actor: "red",
      selectedAction: result.snapshot.redAction,
      observableInputs: result.snapshot.actorObservations.redObserved,
      candidateUtilityScores: result.redScores,
      seed: rngSeed,
      internal: true,
    });
    logScenarioFour("s1_actor_resolution", scenarioId, nodeId, {
      actor: "ally",
      selectedAction: result.snapshot.allyAction,
    });
    logScenarioFour("s1_actor_resolution", scenarioId, nodeId, {
      actor: "commercial",
      selectedAction: result.snapshot.commercialAction,
    });
    logScenarioFour("s1_move_complete", scenarioId, nodeId, {
      moveId: "move_1",
      snapshotPersisted: true,
      handoffReady: true,
    });
    setState(result.snapshot.stateAfter);
    setPhase("update");
  };

  const startMove2 = () => {
    if (!snapshot) return;
    const recovery = applyResourceRecovery(snapshot.stateAfter, "m1_to_m2", {
      choices,
      redAction: snapshot.redAction,
      allyAction: snapshot.allyAction,
      commercialAction: snapshot.commercialAction,
    });
    publishResourceEvents(recovery.events);
    const next = initializeMove2Incident(
      recovery.state,
      `${rngSeed}:move2:${snapshot.completedAt}`
    );
    setMove2StartedAt(new Date().toISOString());
    setState(next);
    logScenarioFour("s1_move_start", scenarioId, nodeId, {
      moveId: "move_2",
      previousMoveSnapshotRef: snapshot.completedAt,
      runSeed: rngSeed,
    });
    logScenarioFour("s1_m2_incident_initialized", scenarioId, nodeId, {
      moveId: "move_2",
      internal: true,
      incidentCause: next.hidden.move2IncidentCause,
      trueIncidentAttribution: next.hidden.trueIncidentAttribution,
    });
    setPhase("move2_brief");
  };

  const saveAttributionEstimate = (
    value: number,
    phaseName: "m2_pre_investigation" | "m2_post_investigation" | "m3_final"
  ) => {
    const next = cloneState(state);
    next.knowledge.playerAttributionEstimate = value;
    if (phaseName === "m2_pre_investigation") {
      next.knowledge.playerAttributionEstimatePreMove2 = value;
    }
    if (phaseName === "m2_post_investigation") {
      next.knowledge.playerAttributionEstimatePostMove2 = value;
    }
    if (phaseName === "m3_final") {
      next.knowledge.playerAttributionEstimateFinal = value;
    }
    const estimateTelemetry: AttributionEstimateTelemetryV3 = {
      phase: phaseName,
      playerEstimate: value,
      systemEvidenceConfidence: state.knowledge.systemAttributionConfidence,
      recordedAt: new Date().toISOString(),
    };
    const priorEstimateIndex = attributionTelemetryRef.current.findIndex((item) => item.phase === phaseName);
    if (priorEstimateIndex >= 0) attributionTelemetryRef.current[priorEstimateIndex] = estimateTelemetry;
    else attributionTelemetryRef.current.push(estimateTelemetry);
    if (phaseName === "m2_post_investigation") {
      const decision = decisionTelemetryRef.current.find((item) => item.windowId === "m2_investigation");
      if (decision) decision.playerAttributionEstimateAfter = value;
    }
    setState(next);
    logScenarioFour("s1_attribution_estimate", scenarioId, nodeId, {
      phase: phaseName,
      value,
    });
  };

  const confirmMove2Decision = (
    windowId: "m2_investigation" | "m2_mission" | "m2_response",
    nextPhase: Phase
  ) => {
    if (!selectedId || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
    const before = stateBeforeWindowRef.current ?? cloneState(state);
    const after = applyMove2Decision(state, windowId, selectedId, `${rngSeed}:move2`);
    const decisionResourceEvents = captureDecisionResourceEvents(before.resources, after.resources, selectedId, "move_2");
    const telemetryV3 = buildDecisionTelemetry("move_2", windowId, selectedId, before, after);
    const elapsed = telemetryV3.elapsedMs;
    const record: ScenarioOneDecisionRecord = {
      moveId: "move_2",
      windowId,
      selectedOptionId: selectedId,
      firstSelectedOptionId: selectionStateRef.current.firstSelectedOptionId ?? selectedId,
      changeCount: selectionStateRef.current.optionChangeCount,
      responseTimeMs: elapsed,
      stateBefore: before,
      stateAfter: after,
      resourcesBefore: before.resources,
      resourcesAfter: after.resources,
      resourceEvents: decisionResourceEvents,
      telemetryV3,
    };
    appendDecisionTelemetry(telemetryV3);
    publishResourceEvents(decisionResourceEvents);
    setState(after);
    setMove2Decisions((items) => [...items, record]);
    setMove2Choices((current) => ({
      ...current,
      investigation: windowId === "m2_investigation" ? selectedId : current.investigation,
      mission: windowId === "m2_mission" ? selectedId : current.mission,
      response: windowId === "m2_response" ? selectedId : current.response,
    }));
    logScenarioFour("s1_decision_confirm", scenarioId, nodeId, {
      moveId: "move_2",
      windowId,
      selectedOptionId: selectedId,
      firstSelectedOptionId: record.firstSelectedOptionId,
      changeCount: record.changeCount,
    }, elapsed);
    logScenarioFour("s1_state_transition", scenarioId, nodeId, {
      moveId: "move_2",
      windowId,
      resourcesBefore: before.resources,
      resourcesAfter: after.resources,
    });
    setPhase(nextPhase);
    if (nextPhase === "move2_dw5") enterWindow("m2_mission", "move_2", after);
    if (nextPhase === "move2_dw6") enterWindow("m2_response", "move_2", after);
    if (nextPhase === "move2_reason") enterWindow("m2_reason", "move_2", after);
  };

  const confirmMove2Reason = () => {
    if (!selectedId || !snapshot || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
    const reasonState = stateBeforeWindowRef.current ?? state;
    appendDecisionTelemetry(buildDecisionTelemetry("move_2", "m2_reason", selectedId, reasonState, state, selectedId));
    const finalChoices = { ...move2Choices, reason: selectedId };
    setMove2Choices(finalChoices);
    logScenarioFour("s1_reason_capture", scenarioId, nodeId, {
      moveId: "move_2",
      reason: selectedId,
    });
    const result = adjudicateMove2({
      startedAt: move2StartedAt ?? new Date().toISOString(),
      stateBefore: move2Decisions[0]?.stateBefore ?? snapshot.stateAfter,
      stateAfterBlue: state,
      attributionEstimatePre: move2AttributionPre,
      attributionEstimatePost: move2AttributionPost,
      decisions: move2Decisions,
      evidenceSeen,
      choices: finalChoices,
      rngSeed: `${rngSeed}:move2`,
      previousMoveSnapshotRef: snapshot.completedAt,
    });
    setMove2Snapshot(result.snapshot);
    setSituationUpdate(result.situationUpdate);
    setState(result.snapshot.stateAfter);
    localStorage.setItem(
      "space-war.scenario4.redesigned-s1.move2.snapshot",
      JSON.stringify(result.snapshot)
    );
    localStorage.setItem(
      "space-war.scenario4.redesigned-s1.move3-handoff",
      JSON.stringify({
        previousMoveSnapshot: result.snapshot,
        initialState: result.snapshot.stateAfter,
        runSeed: rngSeed,
        runId: runIdRef.current,
      })
    );
    for (const injectId of result.snapshot.injectsTriggered) {
      logScenarioFour("s1_inject_triggered", scenarioId, nodeId, {
        moveId: "move_2",
        injectId,
      });
    }
    logScenarioFour("s1_actor_resolution", scenarioId, nodeId, {
      moveId: "move_2",
      actor: "red",
      selectedAction: result.snapshot.redAction,
      observableInputs: result.snapshot.actorObservations.redObserved,
      internal: true,
    });
    logScenarioFour("s1_move_complete", scenarioId, nodeId, {
      moveId: "move_2",
      snapshotPersisted: true,
      handoffReady: true,
    });
    setPhase("move2_update");
  };

  const startMove3 = () => {
    if (!move2Snapshot) return;
    const recovery = applyResourceRecovery(move2Snapshot.stateAfter, "m2_to_m3", {
      choices: {
        investigation: move2Choices.investigation,
        mission: move2Choices.mission,
        response: move2Choices.response,
      },
      redAction: move2Snapshot.redAction,
      allyAction: move2Snapshot.allyAction,
      commercialAction: move2Snapshot.commercialAction,
    });
    publishResourceEvents(recovery.events);
    const next = initializeMove3Severity(
      recovery.state,
      move2Snapshot,
      `${rngSeed}:move3`
    );
    setMove3StartedAt(new Date().toISOString());
    setState(next);
    logScenarioFour("s1_move_start", scenarioId, nodeId, {
      moveId: "move_3",
      previousMoveSnapshotRef: move2Snapshot.completedAt,
      runSeed: rngSeed,
    });
    setPhase("move3_brief");
  };

  const confirmMove3Decision = (
    windowId: "m3_threshold" | "m3_coa" | "m3_info" | "m3_offramp",
    nextPhase: Phase
  ) => {
    if (!selectedId || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
    const before = stateBeforeWindowRef.current ?? cloneState(state);
    const after = applyMove3Decision(state, windowId, selectedId);
    const decisionResourceEvents = captureDecisionResourceEvents(before.resources, after.resources, selectedId, "move_3");
    const telemetryV3 = buildDecisionTelemetry("move_3", windowId, selectedId, before, after);
    const elapsed = telemetryV3.elapsedMs;
    const record: ScenarioOneDecisionRecord = {
      moveId: "move_3",
      windowId,
      selectedOptionId: selectedId,
      firstSelectedOptionId: selectionStateRef.current.firstSelectedOptionId ?? selectedId,
      changeCount: selectionStateRef.current.optionChangeCount,
      responseTimeMs: elapsed,
      stateBefore: before,
      stateAfter: after,
      resourcesBefore: before.resources,
      resourcesAfter: after.resources,
      resourceEvents: decisionResourceEvents,
      telemetryV3,
    };
    appendDecisionTelemetry(telemetryV3);
    publishResourceEvents(decisionResourceEvents);
    const nextChoices = {
      ...move3Choices,
      threshold: windowId === "m3_threshold" ? selectedId : move3Choices.threshold,
      coa: windowId === "m3_coa" ? selectedId : move3Choices.coa,
      informationPolicy: windowId === "m3_info" ? selectedId : move3Choices.informationPolicy,
      offRamp: windowId === "m3_offramp" ? selectedId : move3Choices.offRamp,
    };
    setState(after);
    setMove3Choices(nextChoices);
    setMove3Decisions((items) => [...items, record]);
    logScenarioFour("s1_decision_confirm", scenarioId, nodeId, {
      moveId: "move_3",
      windowId,
      selectedOptionId: selectedId,
      firstSelectedOptionId: record.firstSelectedOptionId,
      changeCount: record.changeCount,
    }, elapsed);
    setPhase(nextPhase);
    if (nextPhase === "move3_dw8") enterWindow("m3_coa", "move_3", after);
    if (nextPhase === "move3_dw9") enterWindow("m3_info", "move_3", after);
    if (nextPhase === "move3_offramp") enterWindow("m3_offramp", "move_3", after);
    if (nextPhase === "move3_reason") enterWindow("m3_reason", "move_3", after);
  };

  const confirmMove3Reason = () => {
    if (!selectedId || !snapshot || !move2Snapshot || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
    const reasonState = stateBeforeWindowRef.current ?? state;
    appendDecisionTelemetry(buildDecisionTelemetry("move_3", "m3_reason", selectedId, reasonState, state, selectedId));
    const finalChoices = { ...move3Choices, reason: selectedId };
    setMove3Choices(finalChoices);
    logScenarioFour("s1_reason_capture", scenarioId, nodeId, {
      moveId: "move_3",
      reason: selectedId,
    });
    const result = adjudicateMove3({
      runId: runIdRef.current,
      scenarioId: String(scenarioId),
      runSeed: rngSeed,
      move1: snapshot,
      move2: move2Snapshot,
      startedAt: move3StartedAt ?? new Date().toISOString(),
      stateBefore: move2Snapshot.stateAfter,
      stateAfterBlue: state,
      playerAttributionEstimateFinal: move3AttributionFinal,
      choices: finalChoices,
      decisions: move3Decisions,
      evidenceSeen,
      rngSeed: `${rngSeed}:move3`,
    });
    result.finalSnapshot.resourceEvents = resourceEvents;
    const allCoreDecisions = [...decisions, ...move2Decisions, ...move3Decisions];
    const legacyOsi = average(allCoreDecisions.map((item) => decisionWeight[item.selectedOptionId]).filter((value): value is number => typeof value === "number"));
    const orientationV2 = calculateOrientationV2(allCoreDecisions, {
      evidenceInteractionValid: true,
      timingLogsConsistent: true,
    });
    const cognitiveV3 = calculateCognitiveModelV3({
      records: allCoreDecisions,
      telemetry: decisionTelemetryRef.current,
      attributionEstimates: attributionTelemetryRef.current,
      reasons: { move_1: choices.reason, move_2: move2Choices.reason, move_3: selectedId },
      resourceEvents,
    });
    result.finalSnapshot.measurementModelVersion = COGNITIVE_MODEL_VERSION;
    result.finalSnapshot.formulaVersion = COGNITIVE_FORMULA_VERSION;
    result.finalSnapshot.optionProfileVersion = OPTION_PROFILE_VERSION;
    result.finalSnapshot.scenarioContentVersion = SCENARIO_CONTENT_VERSION;
    result.finalSnapshot.expertPanelVersion = EXPERT_PANEL_VERSION;
    result.finalSnapshot.anchorTestVersion = ANCHOR_TEST_VERSION;
    result.finalSnapshot.decisionTelemetryV3 = [...decisionTelemetryRef.current];
    result.finalSnapshot.attributionTelemetryV3 = [...attributionTelemetryRef.current];
    result.finalSnapshot.oldOSI = legacyOsi;
    result.finalSnapshot.cognitiveScoresV3 = cognitiveV3 as unknown as Record<string, unknown>;
    logScenarioFour("s4_orientation_models", scenarioId, nodeId, {
      measurementModelVersion: COGNITIVE_MODEL_VERSION,
      oldOSI: legacyOsi,
      v2OSI: orientationV2.overall,
      newOSI: cognitiveV3.orientation.overall,
      newMoveIndices: cognitiveV3.orientation.perMove,
      integrationScore: cognitiveV3.orientation.integration,
      dispersion: cognitiveV3.orientation.dispersion,
      dataCompleteness: cognitiveV3.dataCompleteness.overall,
    });
    setMove3Snapshot(result.move3);
    setFinalSnapshot(result.finalSnapshot);
    setState(result.finalSnapshot.finalState);
    localStorage.setItem(
      "space-war.scenario4.redesigned-s1.move3.snapshot",
      JSON.stringify(result.move3)
    );
    localStorage.setItem(
      "space-war.scenario4.redesigned-s1.final.snapshot",
      JSON.stringify(result.finalSnapshot)
    );
    logScenarioFour("s1_m3_final_actor_resolution", scenarioId, nodeId, {
      redAction: result.move3.redAction,
      allyAction: result.move3.allyAction,
      commercialAction: result.move3.commercialAction,
      internal: true,
    });
    logScenarioFour("s1_m3_end_state", scenarioId, nodeId, {
      primaryEndState: result.finalSnapshot.primaryEndState,
      secondaryOutcomeTags: result.finalSnapshot.secondaryOutcomeTags,
    });
    logScenarioFour("s1_scenario_finalized", scenarioId, nodeId, {
      runId: runIdRef.current,
      completedAt: result.finalSnapshot.completedAt,
    });
    setPhase("final_report");
  };

  const trackEvidenceToggle = (cardId: string, sourceType: string, open: boolean) => {
    if (open) {
      setEvidenceSeen((items) => (items.includes(cardId) ? items : [...items, cardId]));
      const item: EvidenceOpenTelemetryV3 = { evidenceId: cardId, sourceType, openedAt: new Date().toISOString() };
      evidenceTimelineRef.current.push(item);
      openEvidenceRef.current.set(cardId, { index: evidenceTimelineRef.current.length - 1, startedAt: getNow() });
      logScenarioFour("s1_intel_card_open", scenarioId, nodeId, {
        moveId: `move_${state.move}`,
        evidenceId: cardId,
        sourceType,
      });
      return;
    }
    const active = openEvidenceRef.current.get(cardId);
    if (!active) return;
    const item = evidenceTimelineRef.current[active.index];
    item.closedAt = new Date().toISOString();
    item.activeDwellMs = (item.activeDwellMs ?? 0) + Math.max(0, getNow() - active.startedAt);
    openEvidenceRef.current.delete(cardId);
  };

  const unlockedIntel = intelCards.filter((card) => state.knowledge.evidenceIds.includes(card.id));
  const goNextIntro = () => {
    const order: Phase[] = ["intro_title", "intro_narrative", "intro_role", "intro_objectives", "intro_rules", "brief"];
    const current = order.indexOf(phase);
    const next = order[current + 1] ?? "brief";
    if (next === "brief") {
      logScenarioFour("s4_intro_complete", scenarioId, nodeId, { runId: runIdRef.current });
    }
    setPhase(next);
  };
  const allEvidenceCards = [...intelCards, ...move2EvidenceCards].filter((card) =>
    state.knowledge.evidenceIds.includes(card.id)
  );
  const latestRedAction = move3Snapshot?.redAction ?? move2Snapshot?.redAction ?? snapshot?.redAction;
  const attributionBrier = finalSnapshot
    ? calculateAttributionBrier(move3Snapshot?.playerAttributionEstimateFinal, finalSnapshot.hiddenAarData.trueIncidentAttribution)
    : null;
  const opponentObservationAar = snapshot && move2Snapshot && move3Snapshot
    ? buildOpponentObservationAAR({ move1Snapshot: snapshot, move2Snapshot, move3Snapshot })
    : [];

  if (phase.startsWith("intro")) {
    return (
      <div className="s4-shell">
        <IntroScreen phase={phase as keyof typeof introScreens} onNext={goNextIntro} />
      </div>
    );
  }

  return (
    <div className="s4-shell">
      <GameplayHeader
        phase={phase}
        guideActive={toolbarGuideOpen}
        onHelp={() => {
          helpOpenedRef.current = true;
          setHelpOpen(true);
          logScenarioFour("s4_help_open", scenarioId, nodeId, { phase });
        }}
        onGlossary={() => {
          glossaryOpenedRef.current = true;
          setGlossaryOpen(true);
          logScenarioFour("s4_glossary_open", scenarioId, nodeId, { phase });
        }}
        onEvidence={() => setEvidenceReviewOpen(true)}
        onExit={() => setExitConfirmOpen(true)}
      />
      <ScenarioProgress phase={phase} />
      <div className="s4-layout">
        <div className="s4-main">
          {phase === "brief" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>وضعیت اولیه</h2>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.95 }}>
                سامانه پایش مداری تغییر غیرعادی در الگوی حرکت R-31 ثبت کرده است.
                {"\n"}این دارایی که رسماً برای مأموریت‌های سرویس و بازرسی مداری معرفی شده،
                {"\n"}طی آخرین پنجره رصدی از الگوی معمول خود فاصله گرفته و فاصله‌اش با A-17 کاهش یافته است.
                {"\n\n"}هیچ اختلالی در A-17 مشاهده نشده است.
                {"\n"}هیچ اقدام خصمانه‌ای تأیید نشده است.
                {"\n\n"}تحلیل اولیه سه احتمال را مطرح می‌کند:
                {"\n"}- مأموریت فنی یا آزمایشی
                {"\n"}- جمع‌آوری اطلاعات درباره واکنش شما
                {"\n"}- ایجاد فشار و آزمون خطوط قرمز
                {"\n\n"}اطلاعات موجود برای انتساب نیت کافی نیست.
              </p>
              <button className="primary" onClick={() => moveToPhase("intel")}>
                مشاهده بسته اطلاعاتی
              </button>
            </Card>
          )}

          {phase === "intel" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>بسته اطلاعاتی اولیه</h2>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {unlockedIntel.map((card) => (
                  <EvidenceCard
                    key={card.id}
                    card={card}
                    source={card.id.includes("COMM") ? "اپراتور تجاری" : "رصد نظامی"}
                    sensitivity={card.id === "E_BASE_03" ? "تحلیلی" : "عادی"}
                    onToggle={(open) => trackEvidenceToggle(card.id, card.id.includes("COMM") ? "commercial" : "military_ssa", open)}
                  />
                ))}
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button className="primary" onClick={() => moveToPhase("dw1")}>
                  شروع تصمیم‌ها
                </button>
              </div>
            </Card>
          )}

          {phase === "dw1" && (
            <DecisionWindow
              title={windowTitles.m1_information}
              context="رفتار R-31 هنوز چندتعبیری است و برای کاهش عدم قطعیت فقط یک اولویت اطلاعاتی فوری قابل انتخاب است."
              question="برای کاهش عدم قطعیت، اولویت اطلاعاتی شما چیست؟"
              why="نوع اطلاعاتی که ابتدا دنبال می‌کنید، کیفیت شناخت مرحله‌های بعد و میزان مصرف منابع را تغییر می‌دهد."
              options={informationOptions}
              infoGuideActive={decisionInfoGuideOpen}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m1_information")}
              onConfirm={() => confirmDecision("m1_information", "dw2")}
            />
          )}

          {phase === "dw2" && (
            <>
              {choices.information === "m1_i_commercial" &&
                state.flags.conflictingCommercialData && (
                  <Card>
                    <p style={{ margin: 0, lineHeight: 1.9 }}>
                      داده تجاری جدید با تحلیل سنسور اصلی کاملاً منطبق نیست.
                      سامانه تجاری کاهش فاصله را تأیید می‌کند، اما نرخ تغییر مسیر
                      R-31 را کمتر از برآورد نظامی گزارش می‌دهد. علت اختلاف هنوز
                      مشخص نیست.
                    </p>
                  </Card>
                )}
              <DecisionWindow
                title={windowTitles.m1_protection}
                context="A-17 هنوز مختل نشده، اما نزدیک‌شدن R-31 ممکن است نیاز به تغییر وضعیت حفاظتی ایجاد کند."
                question="با اطلاعات فعلی، وضعیت حفاظتی A-17 چگونه تغییر کند؟"
                why="اقدام حفاظتی می‌تواند پنهان، آشکار، برگشت‌پذیر یا پرهزینه باشد و اسرائیل فقط بخش قابل مشاهده آن را می‌بیند."
                options={protectionOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m1_protection")}
                onConfirm={() => confirmDecision("m1_protection", "dw3")}
              />
            </>
          )}

          {phase === "dw3" && (
            <>
              {choices.protection === "m1_p_mission_reposition" &&
                state.visible.situationAwareness < 55 && (
                  <Card>
                    <p style={{ margin: 0, lineHeight: 1.9 }}>
                      تیم تحلیل اطلاعاتی هشدار می‌دهد که تغییر محسوس وضعیت مأموریت
                      پیش از تعیین نیت R-31 ممکن است اطلاعاتی درباره حساسیت A-17
                      در اختیار ناظر خارجی قرار دهد.
                    </p>
                  </Card>
                )}
              <DecisionWindow
                title={windowTitles.m1_communication}
                context="پس از تعیین وضعیت حفاظتی، باید تصمیم بگیرید آیا پیام یا هماهنگی لازم است یا نه."
                question="آیا باید درباره رفتار R-31 پیام ارسال شود؟"
                why="پیام می‌تواند مشروعیت و کنترل تنش بسازد، اما ممکن است ردپای اطلاعاتی یا فشار عمومی ایجاد کند."
                options={communicationOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m1_communication")}
                onConfirm={() => confirmDecision("m1_communication", "reason")}
              />
            </>
          )}

          {phase === "reason" && (
            <DecisionWindow
              title="ثبت دلیل"
              question="مهم‌ترین عامل در مجموعه تصمیم‌های این مرحله چه بود؟"
              options={reasonOptions.map((label) => ({ id: label, label }))}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m1_reason")}
              onConfirm={confirmReason}
            />
          )}

          {phase === "resolving" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>ارزیابی بازیگران</h2>
              <p>پیام ثبت شد. واکنش بازیگران در حال ارزیابی است.</p>
            </Card>
          )}

          {phase === "update" && snapshot && (
            <Card>
              <h2 style={{ marginTop: 0 }}>به‌روزرسانی وضعیت</h2>
              <div className="s4-stage-update-grid">
                {situationUpdate.map((section) => (
                  <section key={section.title}>
                    <h3 style={{ margin: 0, color: "var(--accent)" }}>
                      {section.title}
                    </h3>
                    <p style={{ margin: "0.25rem 0 0", lineHeight: 1.85 }}>
                      {section.text}
                    </p>
                  </section>
                ))}
              </div>
              {snapshot.injectsTriggered.length > 0 && (
                <div
                  style={{
                    marginTop: "1rem",
                    border: "1px solid rgba(245,158,11,0.45)",
                    borderRadius: 8,
                    padding: "0.8rem",
                    background: "rgba(120,53,15,0.16)",
                  }}
                >
                  رخدادهای شرطی این مرحله برای تحلیل پس از اقدام ثبت شدند.
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button className="primary" onClick={startMove2}>
                  ورود به مرحله ۲
                </button>
              </div>
            </Card>
          )}

          {phase === "move2_brief" && snapshot && (
            <Card>
              <h2 style={{ marginTop: 0 }}>مرحله ۲ — اختلال بدون امضا</h2>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.9 }}>
                چند ساعت پس از نخستین رویارویی مداری، A-17 برای مدت کوتاهی با افت کیفیت سرویس روبه‌رو شده است.
                {"\n"}بخشی از عملکرد بازیابی شده، اما تیم فنی هنوز علت را مشخص نکرده است.
                {"\n\n"}در همان بازه زمانی، R-31 همچنان در محیط عملیاتی حضور دارد.
                {"\n"}همچنین یک تغییر رفتاری محدود در یک دارایی دیگر متعلق به اسرائیل ثبت شده است.
                {"\n\n"}در حال حاضر چهار فرضیه در بررسی است:
                {"\n"}- نقص داخلی
                {"\n"}- عامل محیطی یا تداخل غیرخصمانه
                {"\n"}- مداخله خارجی نامشخص
                {"\n"}- ارتباط احتمالی با رفتار R-31
                {"\n\n"}وجود هم‌زمان این رخدادها، احتمال ارتباط را افزایش می‌دهد؛ اما هنوز برای انتساب قطعی کافی نیست.
              </p>
              {snapshot.redAction === "break_off" && (
                <p className="hint">R-31 در مرحله ۱ فاصله گرفته بود؛ رخداد پس از آن انتساب مسئولیت را پیچیده‌تر می‌کند.</p>
              )}
              {snapshot.redAction === "continue_approach" && (
                <p className="hint">R-31 همچنان نزدیک‌تر از وضعیت پایه در محیط عملیاتی باقی مانده است.</p>
              )}
              {state.flags.mediaInjectTriggered && (
                <p className="hint">به دلیل توجه رسانه‌ای قبلی، رخداد جدید حساسیت عمومی بیشتری دارد.</p>
              )}
              <button className="primary" onClick={() => setPhase("move2_attr_pre")}>
                ثبت برآورد اولیه
              </button>
            </Card>
          )}

          {phase === "move2_attr_pre" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>برآورد اولیه انتساب</h2>
              <p>با اطلاعات فعلی، احتمال می‌دهید اسرائیل در افت سرویس A-17 نقش داشته باشد؟</p>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={move2AttributionPre}
                onChange={(event) => setMove2AttributionPre(Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <strong>{move2AttributionPre} — {attributionLabel(move2AttributionPre)}</strong>
              <div style={{ marginTop: "1rem" }}>
                <button
                  className="primary"
                  onClick={() => {
                    saveAttributionEstimate(move2AttributionPre, "m2_pre_investigation");
                    setPhase("move2_dw4");
                    enterWindow("m2_investigation", "move_2", state);
                  }}
                >
                  ادامه به بررسی علت
                </button>
              </div>
            </Card>
          )}

          {phase === "move2_dw4" && (
            <>
              <Card>
                <h2 style={{ marginTop: 0 }}>بسته شواهد مرحله ۲</h2>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {move2EvidenceCards
                    .filter((card) => state.knowledge.evidenceIds.includes(card.id))
                    .map((card) => (
                      <EvidenceCard
                        key={card.id}
                        card={card}
                        source={card.id.includes("TECH") ? "تیم فنی" : card.id.includes("ALLY") ? "متحد" : card.id.includes("COMM") ? "اپراتور تجاری" : "رصد نظامی"}
                        sensitivity="محدود"
                        onToggle={(open) => trackEvidenceToggle(
                          card.id,
                          card.id.includes("TECH") ? "technical" : card.id.includes("ALLY") ? "ally" : card.id.includes("COMM") ? "commercial" : "military_ssa",
                          open
                        )}
                      />
                    ))}
                </div>
              </Card>
              <DecisionWindow
                title={windowTitles.m2_investigation}
                context="افت سرویس واقعی رخ داده، اما علت آن هنوز میان چند فرضیه تقسیم شده است."
                question="برای روشن‌ترشدن علت افت سرویس، کدام اقدام اطلاعاتی را در اولویت قرار می‌دهید؟"
                why="این تصمیم جهت شواهد بعدی را تعیین می‌کند، اما هیچ مسیر بررسی به‌تنهایی حقیقت پنهان را تضمین نمی‌کند."
                options={investigationOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m2_investigation", "move_2")}
                onConfirm={() => confirmMove2Decision("m2_investigation", "move2_attr_post")}
              />
            </>
          )}

          {phase === "move2_attr_post" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>برآورد پس از بررسی</h2>
              {state.flags.m2IntelDelay && (
                <p className="hint">به دلیل فشار بر ظرفیت تحلیل، بخشی از داده تکمیلی با تأخیر در دسترس قرار می‌گیرد.</p>
              )}
              <p>پس از اطلاعات جدید، اکنون احتمال نقش اسرائیل را چقدر می‌دانید؟</p>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={move2AttributionPost}
                onChange={(event) => setMove2AttributionPost(Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <strong>{move2AttributionPost} — {attributionLabel(move2AttributionPost)}</strong>
              <div style={{ marginTop: "1rem" }}>
                <button
                  className="primary"
                  onClick={() => {
                    saveAttributionEstimate(move2AttributionPost, "m2_post_investigation");
                    setPhase("move2_dw5");
                    enterWindow("m2_mission", "move_2", state);
                  }}
                >
                  ادامه به تداوم مأموریت
                </button>
              </div>
            </Card>
          )}

          {phase === "move2_dw5" && (
            <DecisionWindow
              title={windowTitles.m2_mission}
              context="A-17 بخشی از عملکرد خود را بازیابی کرده، اما ریسک وابستگی به یک ظرفیت اصلی باقی است."
              question="با توجه به افت سرویس و وضعیت فعلی، تداوم مأموریت A-17 چگونه مدیریت شود؟"
              why="تداوم مأموریت، تاب‌آوری، مصرف ظرفیت حفاظتی و ریسک افشای اطلاعات در این تصمیم به هم گره خورده‌اند."
              options={missionOptions}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m2_mission", "move_2")}
              onConfirm={() => confirmMove2Decision("m2_mission", "move2_dw6")}
            />
          )}

          {phase === "move2_dw6" && (
            <>
              {state.flags.m2CommercialRestriction && (
                <Card>
                  <p style={{ margin: 0, lineHeight: 1.9 }}>
                    اپراتور تجاری اعلام کرده بخشی از داده‌های دقیق‌تر را به دلیل حساسیت حقوقی و تجاری فعلاً منتشر نمی‌کند.
                  </p>
                </Card>
              )}
              <DecisionWindow
                title={windowTitles.m2_response}
                context="اکنون باید نسبت به رفتار اسرائیل و افت سرویس موضع بگیرید، بدون اینکه انتساب قطعی داشته باشید."
                question="در برابر مجموعه رفتارهای اسرائیل و افت سرویس، چه موضعی اتخاذ شود؟"
                why="پاسخ شما برای اسرائیل، متحدان ایران و محیط عمومی قابل تفسیر است و می‌تواند مسیر کاهش تنش یا فشار را باز کند."
                options={responseOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m2_response", "move_2")}
                onConfirm={() => confirmMove2Decision("m2_response", "move2_reason")}
              />
            </>
          )}

          {phase === "move2_reason" && (
            <DecisionWindow
              title={windowTitles.m2_reason}
              question="در این مرحله کدام عامل بیشترین وزن را در تصمیم شما داشت؟"
              options={move2ReasonOptions.map((label) => ({ id: label, label }))}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m2_reason", "move_2")}
              onConfirm={confirmMove2Reason}
            />
          )}

          {phase === "move2_update" && move2Snapshot && (
            <Card>
              <h2 style={{ marginTop: 0 }}>به‌روزرسانی مرحله ۲</h2>
              <div className="s4-stage-update-grid">
                {situationUpdate.map((section) => (
                  <section key={section.title}>
                    <h3 style={{ margin: 0, color: "var(--accent)" }}>{section.title}</h3>
                    <p style={{ margin: "0.25rem 0 0", lineHeight: 1.85 }}>{section.text}</p>
                  </section>
                ))}
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button className="primary" onClick={startMove3}>ورود به مرحله ۳</button>
              </div>
            </Card>
          )}

          {phase === "move3_brief" && move2Snapshot && (
            <Card>
              <h2 style={{ marginTop: 0 }}>مرحله ۳ — بحران انتساب</h2>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.9 }}>
                بحران وارد مرحله جدیدی شده است.
                {"\n\n"}A-17 اکنون با افت عملکرد جدی‌تری روبه‌رو است. بخشی از سرویس‌ها با تأخیر یا کیفیت پایین‌تر ادامه دارند و تیم فنی در حال تثبیت وضعیت است.
                {"\n\n"}هم‌زمان، داده‌های جدیدی از منابع نظامی، تجاری و متحدان در دسترس قرار گرفته است. برخی شواهد ارتباط میان رفتار اسرائیل و رخدادهای اخیر را تقویت می‌کنند؛ اما هنوز یک توضیح جایگزین به‌طور کامل رد نشده است.
                {"\n\n"}اکنون مسئله فقط تشخیص علت نیست. باید تعیین کنید آیا سطح فعلی اطمینان برای اقدام کافی است، چه نوع پاسخی متناسب است، و چه میزان از شواهد باید با متحدان یا افکار عمومی به اشتراک گذاشته شود.
              </p>
              {state.flags.m2FallbackActivated && <p className="hint">ظرفیت پشتیبان فعال است و اثر مأموریتی افت جدید را کاهش داده است.</p>}
              {state.flags.m2OffRampOfferedByRed && <p className="hint">یک پیشنهاد فاصله‌گذاری از مرحله ۲ باز مانده است.</p>}
              {state.flags.m2CoalitionFriction && <p className="hint">اصطکاک ائتلافی قبلی روی سیاست اطلاعاتی مرحله ۳ اثر می‌گذارد.</p>}
              <button className="primary" onClick={() => setPhase("move3_confidence")}>
                مشاهده بسته اطمینان نهایی
              </button>
            </Card>
          )}

          {phase === "move3_confidence" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>بسته اطمینان نهایی</h2>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {buildConfidencePackage(state).map((item) => (
                  <div
                    key={item.source}
                    style={{
                      border: "1px solid var(--border-soft)",
                      borderRadius: 8,
                      padding: "0.75rem",
                      background: "rgba(15,23,42,0.72)",
                    }}
                  >
                    <strong>{item.source} — {item.status} — اطمینان {item.confidence}</strong>
                    <p style={{ margin: "0.35rem 0", lineHeight: 1.8 }}>{item.finding}</p>
                    <span className="hint">{item.sensitivity}</span>
                  </div>
                ))}
              </div>
              <button
                className="primary"
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  logScenarioFour("s1_m3_confidence_package_open", scenarioId, nodeId, {
                    evidenceIds: state.knowledge.evidenceIds,
                  });
                  setPhase("move3_attr_final");
                }}
              >
                ثبت برآورد نهایی
              </button>
            </Card>
          )}

          {phase === "move3_attr_final" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>برآورد نهایی انتساب</h2>
              <p>با جمع‌بندی شواهد موجود، احتمال می‌دهید اسرائیل در رخداد اخیر نقش داشته باشد؟</p>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={move3AttributionFinal}
                onChange={(event) => setMove3AttributionFinal(Number(event.target.value))}
                style={{ width: "100%" }}
              />
              <strong>{move3AttributionFinal} — {attributionLabel(move3AttributionFinal)}</strong>
              <div style={{ marginTop: "1rem" }}>
                <button
                  className="primary"
                  onClick={() => {
                    saveAttributionEstimate(move3AttributionFinal, "m3_final");
                    setPhase("move3_dw7");
                    enterWindow("m3_threshold", "move_3", state);
                  }}
                >
                  ادامه به آستانه اقدام
                </button>
              </div>
            </Card>
          )}

          {phase === "move3_dw7" && (
            <DecisionWindow
              title={windowTitles.m3_threshold}
              context="بسته شواهد نهایی تصویر را روشن‌تر کرده، اما هنوز همه توضیح‌های جایگزین حذف نشده‌اند."
              question="آیا سطح فعلی اطلاعات را برای اقدام راهبردی کافی می‌دانید؟"
              why="آستانه اقدام نشان می‌دهد با چه میزان عدم قطعیت حاضر به حرکت راهبردی هستید."
              options={thresholdOptions}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m3_threshold", "move_3")}
              onConfirm={() => {
                logScenarioFour("s1_m3_action_threshold", scenarioId, nodeId, {
                  playerEstimate: move3AttributionFinal,
                  systemAttributionConfidence: state.knowledge.systemAttributionConfidence,
                  thresholdChoice: selectedId,
                  calibrationGap: Math.abs(move3AttributionFinal - state.knowledge.systemAttributionConfidence),
                });
                confirmMove3Decision("m3_threshold", "move3_dw8");
              }}
            />
          )}

          {phase === "move3_dw8" && (
            <DecisionWindow
              title={windowTitles.m3_coa}
              context="بحران اکنون به انتخاب مسیر اقدام رسیده است؛ مسیر انتخابی شما همه ابعاد مأموریت، ائتلاف و تشدید را تحت تأثیر قرار می‌دهد."
              question="در این مرحله، مسیر اقدام اصلی شما چیست؟"
              why="مسیر اقدام با آستانه انتساب شما الزاماً هم‌خوان یا ناهم‌خوان می‌شود؛ سیستم این را برای تحلیل ثبت می‌کند، اما در لحظه قضاوت نمی‌کند."
              options={crisisCoaOptions}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m3_coa", "move_3")}
              onConfirm={() => {
                logScenarioFour("s1_m3_coa_confirm", scenarioId, nodeId, { coa: selectedId });
                confirmMove3Decision("m3_coa", "move3_dw9");
              }}
            />
          )}

          {phase === "move3_dw9" && (
            <DecisionWindow
              title={windowTitles.m3_info}
              context="پس از انتخاب مسیر اقدام، باید تعیین کنید شواهد و انتساب چگونه مدیریت شوند."
              question="شواهد و انتساب بحران چگونه مدیریت شود؟"
              why="انتشار یا محدودسازی اطلاعات روی مشروعیت، ائتلاف، افشای منابع و واکنش اسرائیل اثر می‌گذارد."
              options={informationPolicyOptions}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m3_info", "move_3")}
              onConfirm={() => {
                const needsOffRamp =
                  state.flags.m2OffRampOfferedByRed ||
                  state.flags.m2OffRampOfferedByBlue ||
                  move3Choices.coa === "m3_coa_negotiated_deescalation";
                logScenarioFour("s1_m3_information_policy", scenarioId, nodeId, {
                  informationPolicy: selectedId,
                });
                confirmMove3Decision("m3_info", needsOffRamp ? "move3_offramp" : "move3_reason");
              }}
            />
          )}

          {phase === "move3_offramp" && (
            <DecisionWindow
              title={windowTitles.m3_offramp}
              context="یک مسیر کاهش تنش فعال یا قابل ایجاد است، اما موفقیت آن به واکنش اسرائیل وابسته می‌ماند."
              question="در مورد سازوکار فاصله‌گذاری/کاهش تنش موجود چه تصمیمی گرفته شود؟"
              why="مسیر کاهش تنش می‌تواند تشدید را کنترل کند، اما ممکن است از سوی اسرائیل پذیرفته، رد یا بهره‌برداری شود."
              options={offRampOptions}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m3_offramp", "move_3")}
              onConfirm={() => {
                logScenarioFour("s1_m3_offramp_decision", scenarioId, nodeId, {
                  offRampChoice: selectedId,
                });
                confirmMove3Decision("m3_offramp", "move3_reason");
              }}
            />
          )}

          {phase === "move3_reason" && (
            <DecisionWindow
              title={windowTitles.m3_reason}
              question="مهم‌ترین عامل در تصمیم نهایی شما چه بود؟"
              options={move3ReasonOptions.map((label) => ({ id: label, label }))}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m3_reason", "move_3")}
              onConfirm={confirmMove3Reason}
            />
          )}

          {phase === "final_report" && finalSnapshot && (
            <Card>
              <div className="s4-final-hero">
                <span>وضعیت پایانی</span>
                <h2>{endStatePersianLabel(finalSnapshot.primaryEndState)}</h2>
                <p>{finalSnapshot.playerFacingReport.find((section) => section.title === "End State")?.text ?? "نتیجه بر اساس مسیر کامل تصمیم‌ها و واکنش بازیگران شکل گرفت."}</p>
              </div>
              <div className="s4-final-mini">
                <section><strong>مأموریت</strong><span>{qualitativeStatus("missionContinuity", state.visible.missionContinuity)}</span></section>
                <section><strong>ائتلاف</strong><span>{qualitativeStatus("coalitionCohesion", state.visible.coalitionCohesion)}</span></section>
                <section><strong>تشدید</strong><span>{qualitativeStatus("escalationPressure", state.visible.escalationPressure)}</span></section>
              </div>
              <h2 style={{ marginTop: "1rem" }}>گزارش نهایی بازیکن</h2>
              <div className="s4-report-sections">
                {finalSnapshot.playerFacingReport.map((section) => (
                  <section key={section.title}>
                    <h3>{section.title === "End State" ? "وضعیت پایانی" : section.title}</h3>
                    <p style={{ margin: "0.25rem 0 0", lineHeight: 1.85 }}>{section.text}</p>
                  </section>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button
                  className="primary"
                  onClick={() => {
                    logScenarioFour("s1_aar_open", scenarioId, nodeId, { runId: finalSnapshot.runId });
                    setPhase("aar");
                  }}
                >
                  پایان سناریو و ورود به تحلیل پس از اقدام
                </button>
              </div>
            </Card>
          )}

          {phase === "dashboard" && finalSnapshot && (
            <>
              <CognitiveDashboard
                move1={decisions}
                move2={move2Decisions}
                move3={move3Decisions}
                finalSnapshot={finalSnapshot}
                resourceEvents={resourceEvents}
                isAdmin={isAdmin}
              />
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="primary" onClick={onComplete}>پایان سناریو</button>
              </div>
            </>
          )}

          {phase === "aar" && finalSnapshot && (
            <Card>
              <h2 style={{ marginTop: 0 }}>تحلیل پس از اقدام — افشای حقیقت پنهان</h2>
              <div className="s4-aar-warning">
                از این بخش به بعد، اطلاعاتی نمایش داده می‌شود که بازیکن در زمان تصمیم‌گیری به آن دسترسی نداشت.
              </div>
              <div className="s4-aar-truth">
                <section><span>نیت واقعی اسرائیل</span><strong>{redIntentPersianLabel(finalSnapshot.hiddenAarData.trueRedIntent)}</strong></section>
                <section><span>علت رخداد مرحله دوم</span><strong>{incidentCauseLabel(finalSnapshot.hiddenAarData.move2IncidentCause)}</strong></section>
                <section><span>انتساب واقعی</span><strong>{truthAttributionLabel(finalSnapshot.hiddenAarData.trueIncidentAttribution)}</strong></section>
              </div>
              <h3>شما چه فکر می‌کردید؟</h3>
              <div className="s4-aar-estimates">
                <span>قبل بررسی: {move2Snapshot?.attributionEstimatePre}</span>
                <span>بعد بررسی: {move2Snapshot?.attributionEstimatePost}</span>
                <span>پایان بحران: {move3Snapshot?.playerAttributionEstimateFinal}</span>
              </div>
              <div className="s4-aar-brier">
                <p>برآورد نهایی شما: <strong>{attributionBrier ? `${attributionBrier.estimate.toFixed(0)}٪` : "داده کافی ثبت نشده است"}</strong></p>
                <p>{attributionBrier?.outcome === 1 ? "در این رخداد، نقش اسرائیل در زنجیره علت تأیید شد." : "در این رخداد، نقش مستقیم اسرائیل در علت اصلی تأیید نشد."}</p>
                <p>امتیاز Brier: <strong>{attributionBrier?.brier.toFixed(2) ?? "—"}</strong> — هرچه کمتر بهتر</p>
                <p>مهارت نسبت به مبنای خنثی 50/50: <strong>{attributionBrier?.brierSkillScore == null ? "—" : attributionBrier.brierSkillScore.toFixed(2)}</strong></p>
              </div>
              <p className="hint">این نتیجه فقط امتیاز Brier همین رخداد را توصیف می‌کند؛ ارزیابی پایداری برآورد به چند رخداد مستقل نیاز دارد.</p>
              <h3>اسرائیل چه چیزی مشاهده کرد؟</h3>
              <div className="s4-red-observation-table">
                <div><strong>مرحله</strong><strong>قابل مشاهده برای اسرائیل</strong><strong>غیرقابل مشاهده برای اسرائیل</strong></div>
                {opponentObservationAar.map((row, index) => (
                  <div key={row.moveId}>
                    <span>مرحله {index + 1}</span>
                    <span>{row.visibleToIsrael.join("، ")}</span>
                    <span>{row.hiddenFromIsrael.join("، ")}</span>
                  </div>
                ))}
              </div>
              <p className="hint">
                این فهرست مستقیماً از سیگنال‌های ثبت‌شده در همین اجرا ساخته شده است؛ برآوردهای داخلی، دلیل تصمیم و حقیقت پنهان برای اسرائیل قابل مشاهده نبودند.
              </p>
              <button className="primary" onClick={() => {
                logScenarioFour("s4_cognitive_dashboard_view", scenarioId, nodeId, { runId: finalSnapshot.runId, from: "aar" });
                setPhase("dashboard");
              }}>مشاهده داشبورد شناختی</button>
            </Card>
          )}
        </div>

        <div className="s4-sidebar">
          <OrbitalScene
            phase={phase}
            protectionChoice={choices.protection}
            redAction={latestRedAction}
            state={state}
            communicationChoice={choices.communication}
            investigationChoice={move2Choices.investigation}
            move2ResponseChoice={move2Choices.response}
            move3Coa={move3Choices.coa}
            primaryEndState={finalSnapshot?.primaryEndState}
          />
          <div className="s4-sidebar-panels">
            <StatusPanel state={state} />
            <ResourcePanel state={state} recentEvents={recentResourceEvents} history={resourceEvents} />
          </div>
          {isAdmin && (
            <Card>
              <h3 style={{ marginTop: 0 }}>پنل اشکال‌زدایی مدیر</h3>
              <div style={{ display: "grid", gap: "0.45rem", fontSize: "0.88rem" }}>
                <span>Intent مخفی: {state.hidden.trueRedIntent}</span>
                <span>Seed: {rngSeed}</span>
                <span>Checkpointها: {checkpointCount}</span>
                {snapshot && <span>Red action: {snapshot.redAction}</span>}
                {redScores && (
                  <pre style={{ whiteSpace: "pre-wrap", direction: "ltr", textAlign: "left" }}>
                    {JSON.stringify(redScores, null, 2)}
                  </pre>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      {toolbarGuideOpen && <ToolbarGuideModal onClose={() => setToolbarGuideOpen(false)} />}
      {phase === "dw1" && decisionInfoGuideOpen && (
        <DecisionInfoGuideModal onClose={() => setDecisionInfoGuideOpen(false)} />
      )}
      {helpOpen && <HelpPanel onClose={() => setHelpOpen(false)} />}
      {glossaryOpen && <GlossaryPanel onClose={() => setGlossaryOpen(false)} />}
      {evidenceReviewOpen && (
        <div className="s4-modal-backdrop" role="dialog" aria-modal="true">
          <div className="s4-modal">
            <div className="s4-modal-header">
              <h2>مرور شواهد</h2>
              <button onClick={() => setEvidenceReviewOpen(false)}>بستن</button>
            </div>
            <div className="s4-evidence-list">
              {allEvidenceCards.length === 0 && <p>هنوز شواهدی برای مرور ثبت نشده است.</p>}
              {allEvidenceCards.map((card) => (
                <EvidenceCard
                  key={`review-${card.id}`}
                  card={card}
                  source={card.id.includes("ALLY") ? "متحد" : card.id.includes("COMM") ? "اپراتور تجاری" : card.id.includes("TECH") ? "تیم فنی" : "رصد نظامی"}
                  sensitivity="محدود"
                  onToggle={(open) => trackEvidenceToggle(
                    card.id,
                    card.id.includes("ALLY") ? "ally" : card.id.includes("COMM") ? "commercial" : card.id.includes("TECH") ? "technical" : "military_ssa",
                    open
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {exitConfirmOpen && (
        <div className="s4-modal-backdrop" role="dialog" aria-modal="true">
          <div className="s4-modal s4-modal-small">
            <h2>خروج از سناریو</h2>
            <p>اگر خارج شوید، اجرای شما تا آخرین نقطه ثبت‌شده ذخیره می‌شود.</p>
            <div className="s4-modal-actions">
              <button className="primary" onClick={onComplete}>ذخیره و خروج</button>
              <button onClick={() => setExitConfirmOpen(false)}>ادامه سناریو</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
