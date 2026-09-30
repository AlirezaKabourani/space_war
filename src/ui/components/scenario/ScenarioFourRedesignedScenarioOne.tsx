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
import { ACTOR_LABELS_FA } from "./scenario-four/model/displayLabelsFa";
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
  canAffordResourceCosts,
  captureDecisionResourceEvents,
  formatDirectResourceCost,
  getCertainResourceCosts,
  getPersistentResourceWarning,
  getProjectedScarcityWarning,
  getResourceProjection,
  getResourceLabel,
  getResourceStatusLabel,
  getResourceStatusTone,
  getStateResourceBaseline,
  RESOURCE_UX_COPY_FA,
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
import { buildNarrativeContext } from "./scenario-four/narrative/buildNarrativeContext";
import {
  END_STATE_LABELS_FA,
  END_STATE_NARRATIVES_FA,
  GLOSSARY_ENTRIES_FA,
  HELP_SECTIONS_FA,
  AAR_TRUTH_LABELS_FA,
  ACTOR_REACTION_COPY_FA,
  MOVE1_NARRATIVE_COPY_FA,
  MOVE2_NARRATIVE_COPY_FA,
  MOVE3_NARRATIVE_COPY_FA,
} from "./scenario-four/narrative/narrativeCatalogFa";
import {
  canRenderAdminDebugPanel,
  canRenderNarrativeTrace,
  attributionQualitativeLabel,
  buildAarRunSummary,
  buildAarTurningPoints,
  formatAttributionTrajectory,
  getAarResultMeaning,
  getBrierPlainLanguageInterpretation,
  getBssPlainLanguageInterpretation,
  getFinalEstimateExplanation,
  getInjectNarrativeDefinition,
  getIntroScreen,
  getMove1CommunicationContext,
  getMove1OpeningNarrative,
  getMove1ProtectionContext,
  getMove1SceneCaption,
  getMove2OpeningNarrative,
  getMove2ResourceConsequence,
  getMove2SceneCaption,
  getMove3EvidencePackage,
  getMove3OpeningNarrative,
  getMove3SceneCaption,
  getMoveSituationUpdate,
  getTruthExplanation,
} from "./scenario-four/narrative/narrativeSelectors";
import type {
  InjectNarrativeDefinition,
  IntroNarrativeScreen,
  NarrativeSection,
  Scenario4NarrativePhase,
} from "./scenario-four/narrative/narrativeTypes";

interface ScenarioFourRedesignedScenarioOneProps {
  scenarioId: string | number;
  nodeId: string;
  userProfileId?: string;
  onCompletionUiActiveChange?: (active: boolean) => void;
  onComplete: () => void;
}

type DisplayDecisionOption = DecisionOption & { tradeoff?: string };

type Phase =
  | "intro_title"
  | "intro_narrative"
  | "intro_role"
  | "intro_objectives"
  | "intro_how_to"
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
  | "move3_update"
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
  m1_information: MOVE1_NARRATIVE_COPY_FA.decisions.information.title,
  m1_protection: MOVE1_NARRATIVE_COPY_FA.decisions.protection.title,
  m1_communication: MOVE1_NARRATIVE_COPY_FA.decisions.communication.title,
  m1_reason: MOVE1_NARRATIVE_COPY_FA.decisions.reason.title,
  m2_investigation: MOVE2_NARRATIVE_COPY_FA.decisions.investigation.title,
  m2_mission: MOVE2_NARRATIVE_COPY_FA.decisions.mission.title,
  m2_response: MOVE2_NARRATIVE_COPY_FA.decisions.response.title,
  m2_reason: MOVE2_NARRATIVE_COPY_FA.decisions.reason.title,
  m3_threshold: MOVE3_NARRATIVE_COPY_FA.decisions.threshold.title,
  m3_coa: MOVE3_NARRATIVE_COPY_FA.decisions.coa.title,
  m3_info: MOVE3_NARRATIVE_COPY_FA.decisions.information.title,
  m3_offramp: MOVE3_NARRATIVE_COPY_FA.decisions.offRamp.title,
  m3_reason: MOVE3_NARRATIVE_COPY_FA.decisions.reason.title,
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
      {HELP_SECTIONS_FA.map((section) => (
        <section key={section.id}><h3>{section.title}</h3><p>{section.body}</p></section>
      ))}
    </div>
  </div>
);

const GlossaryPanel = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="s4-modal-backdrop" role="dialog" aria-modal="true">
      <div className="s4-modal">
        <div className="s4-modal-header">
          <h2>واژه‌نامه</h2>
          <button onClick={onClose}>بستن</button>
        </div>
        <div className="s4-glossary-list">
          {GLOSSARY_ENTRIES_FA.map((entry) => (
            <section key={entry.id}><h3><bdi>{entry.term}</bdi></h3><p>{entry.definition}</p></section>
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
    ["ظرفیت SSA", state.resources.ssaCapacity, "ظرفیت آگاهی موقعیتی فضایی (SSA) برای تحلیل و رصد تکمیلی."],
    ["ظرفیت حفاظتی", state.resources.protectiveCapacity, "توان فنی/عملیاتی برای حفاظت، پشتیبان‌سازی و بازیابی."],
    ["سرمایه سیاسی", state.resources.politicalCapital, "فضای مانور سیاسی برای پیام، ائتلاف و پاسخ رسمی."],
    ["ظرفیت افشای امن", state.resources.disclosureBudget, "مقدار اطلاعات حساسی که هنوز می‌توان بدون هزینه غیرقابل قبول به اشتراک گذاشت."],
  ] as const;
  const keys = ["ssaCapacity", "protectiveCapacity", "politicalCapital", "disclosureBudget"] as const;
  const warningRows = rows.filter(([, value]) => value < 50);
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>ظرفیت منابع</h3>
      {warningRows.length > 0 && (
        <div className={`s4-resource-alert ${warningRows.some(([, value]) => value === 0) ? "exhausted" : warningRows.some(([, value]) => value < 30) ? "critical" : "limited"}`} role="alert">
          {warningRows.map(([label, value]) => (
            <p key={label}>
              <strong>{label}: {value} ({getResourceStatusLabel(value)})</strong>
              <span>{getPersistentResourceWarning(value)}</span>
            </p>
          ))}
        </div>
      )}
      <div className="s4-resource-list s4-resource-grid">
        {rows.map(([label, value, title], index) => {
          const recent = [...recentEvents].reverse().find((event) => event.resource === keys[index]);
          return (
            <div key={label} className="s4-resource-row" title={title}>
              <div className="s4-resource-heading">
                <span>{label}</span>
                <small className={`s4-resource-status ${getResourceStatusTone(value)}`}>{getResourceStatusLabel(value)}</small>
              </div>
              <div className="s4-resource-track"><div className={getResourceStatusTone(value)} style={{ width: `${value}%` }} /></div>
              <strong className="s4-resource-value">
                <b><bdi dir="ltr">{value} / 100</bdi> · شروع <bdi>{state.resourceBaseline?.[keys[index]] ?? 100}</bdi></b>
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
      <p className="s4-resource-boundary">مقادیر منابع، ظرفیت‌های نرمال‌شده درون این سناریو هستند و نباید به‌عنوان اندازه‌گیری یا برآورد تجربی ظرفیت واقعی هیچ کشور یا سازمانی تفسیر شوند.</p>
    </Card>
  );
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
  const finalSceneCaption = primaryEndState && ["final_report", "aar", "dashboard"].includes(phase)
    ? END_STATE_NARRATIVES_FA[primaryEndState as keyof typeof END_STATE_NARRATIVES_FA]?.shortSummary
    : undefined;
  const orbitalCaption = finalSceneCaption ?? (
    phase.startsWith("move2")
      ? getMove2SceneCaption(redAction)
      : phase.startsWith("move3")
        ? getMove3SceneCaption(redAction)
        : getMove1SceneCaption(redAction)
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
  intro,
  context,
  question,
  why,
  options,
  selectedId,
  onSelect,
  onConfirm,
  infoGuideActive,
  resources,
}: {
  title: string;
  intro?: string;
  context?: string;
  question: string;
  why?: string;
  options: DisplayDecisionOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  onConfirm: () => void;
  infoGuideActive?: boolean;
  resources: ScenarioOneState["resources"];
}) => (
  <DecisionWindowInner
    title={title}
    intro={intro}
    context={context}
    question={question}
    why={why}
    options={options}
    selectedId={selectedId}
    onSelect={onSelect}
    onConfirm={onConfirm}
    infoGuideActive={infoGuideActive}
    resources={resources}
  />
);

const DecisionWindowInner = ({
  title,
  intro,
  context,
  question,
  why,
  options,
  selectedId,
  onSelect,
  onConfirm,
  infoGuideActive,
  resources,
}: {
  title: string;
  intro?: string;
  context?: string;
  question: string;
  why?: string;
  options: DisplayDecisionOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  onConfirm: () => void;
  infoGuideActive?: boolean;
  resources: ScenarioOneState["resources"];
}) => {
  const [detailOption, setDetailOption] = useState<DisplayDecisionOption | null>(null);
  const selectedOption = options.find((option) => option.id === selectedId);
  const selectedProjection = selectedId ? getResourceProjection(resources, selectedId) : undefined;
  const selectedDirectCost = selectedId ? formatDirectResourceCost(selectedId) : undefined;
  const compact = options.length >= 6 || options.every((option) => !option.description);
  const decisionOrdinal = getDecisionOrdinalFromTitle(title);
  return (
    <Card className="s4-decision-panel">
      <div className={`s4-decision-window${compact ? " compact" : ""}${infoGuideActive ? " info-guide-active" : ""}`}>
        <div>
          {decisionOrdinal && <span className="s4-decision-kicker">نقطه تصمیم {decisionOrdinal} از ۹</span>}
          <h2>{title}</h2>
          {intro && <p className="s4-decision-intro">{intro}</p>}
          {context && (
            <div className="s4-decision-context">
              <strong>چه اتفاقی افتاده؟</strong>
              <p>{context}</p>
            </div>
          )}
          <p className="s4-decision-question">{question}</p>
          {why && <p className="s4-decision-why"><strong>چرا مهم است؟</strong> {why}</p>}
        </div>
        {selectedDirectCost && <p className="s4-resource-consequence s4-current-resource-cost" role="status" aria-live="polite">{selectedDirectCost}</p>}
        <div className="s4-options-grid">
          {options.map((option, optionIndex) => {
            const active = option.id === selectedId;
            const certainCosts = getCertainResourceCosts(option.id);
            const projection = getResourceProjection(resources, option.id);
            return (
              <div key={option.id} className={`s4-option-card${active ? " selected" : ""}${!projection.affordable ? " unavailable" : ""}`}>
                <button type="button" disabled={!projection.affordable} onClick={() => onSelect(option.id)}>
                  <strong>{option.label}</strong>
                  {option.description && <span>{option.description}</span>}
                  {certainCosts.length > 0 && (
                    <small className="s4-option-resource-cost">
                      هزینه قطعی منابع: {certainCosts.map((cost) => `${cost.label} ${cost.delta}`).join("، ")}
                    </small>
                  )}
                  {!projection.affordable && <small className="s4-option-resource-shortfall">{RESOURCE_UX_COPY_FA.insufficientResource}</small>}
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
          {selectedProjection && selectedProjection.items.length > 0 && (
            <div className="s4-resource-projection" aria-live="polite">
              <strong>برآورد منابع پس از ثبت این تصمیم</strong>
              <div>
                {selectedProjection.items.map((item) => (
                  <span key={item.resource} className={item.crossesBand ? `crosses ${getResourceStatusTone(item.projected)}` : ""}>
                    {item.label}: از {item.current} به {item.projected} ({item.delta}) · {item.afterStatus}
                  </span>
                ))}
              </div>
              <div className="s4-resource-projection-warnings">
                {selectedProjection.items.map((item) => {
                  const warning = getProjectedScarcityWarning(item.projected, item.crossesBand);
                  return warning ? <small key={item.resource}><strong>{item.label}:</strong> {warning}</small> : null;
                })}
              </div>
            </div>
          )}
          <div className="s4-confirm-actions">
            <span>انتخاب شما: <strong>{selectedOption?.label ?? "هنوز انتخاب نشده"}</strong></span>
            <button className="primary s4-button s4-button-primary" disabled={!selectedId || !selectedProjection?.affordable} onClick={onConfirm}>ثبت تصمیم</button>
          </div>
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
            {detailOption.tradeoff && (
              <p className="s4-option-tradeoff"><strong>{MOVE1_NARRATIVE_COPY_FA.ui.tradeoffLabel}:</strong> {detailOption.tradeoff}</p>
            )}
            <p className="hint">مشاهده توضیحات بیشتر می‌تواند به انتخاب‌های بهتر منجر شود.</p>
          </div>
        </div>
      )}
    </Card>
  );
};

const IntroScreen = ({ phase, onNext }: { phase: IntroNarrativeScreen["id"]; onNext: () => void }) => {
  const screen = getIntroScreen(phase);
  return (
    <div className="s4-intro-shell">
      <OrbitalScene phase={phase} />
      <Card>
        <div className="s4-intro-content">
          {screen.kicker && <span className="s4-kicker">{screen.kicker}</span>}
          <h1>{screen.title}</h1>
          {screen.subtitle && <h2>{screen.subtitle}</h2>}
          {screen.supportLine && <p className="s4-intro-support">{screen.supportLine}</p>}
          {screen.body && <p>{screen.body}</p>}
          {screen.closingLine && <p className="s4-intro-callout">{screen.closingLine}</p>}
          {screen.callout && <p className="s4-intro-callout">{screen.callout}</p>}
          {screen.items && (
            <div className="s4-intro-item-grid">
              {screen.items.map((item) => (
                <section key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </section>
              ))}
            </div>
          )}
          {screen.rules && (
            <ul className="s4-intro-rules">
              {screen.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          )}
          {screen.disclaimer && <p className="s4-intro-disclaimer">{screen.disclaimer}</p>}
          <button className="primary" onClick={onNext}>{screen.cta}</button>
        </div>
      </Card>
    </div>
  );
};

const NarrativeTraceForAdmin = ({ section, enabled }: { section: NarrativeSection; enabled: boolean }) =>
  enabled && section.trace
    ? <small className="hint">{section.trace.narrativeId} · {section.trace.sourceIds.join(", ")}</small>
    : null;

const EvidenceCard = ({
  card,
  source,
  sensitivity,
  onToggle,
}: {
  card: { id: string; title: string; status: string; text: string; limitation?: string };
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
        <summary>{MOVE1_NARRATIVE_COPY_FA.ui.evidenceLimitationLabel}</summary>
        <p>{card.limitation ?? MOVE1_NARRATIVE_COPY_FA.ui.genericEvidenceLimitation}</p>
      </details>
    </details>
  );
};

const Move1InjectNotice = ({
  definition,
  onContinue,
}: {
  definition: InjectNarrativeDefinition;
  onContinue?: () => void;
}) => (
  <Card>
    <div className="s4-move1-inject">
      <h2>{definition.title}</h2>
      <p><strong>{MOVE1_NARRATIVE_COPY_FA.ui.injectWhatHappenedLabel}</strong> {definition.whatHappened}</p>
      <p><strong>{MOVE1_NARRATIVE_COPY_FA.ui.injectWhyItMattersLabel}</strong> {definition.whyItMatters}</p>
      {definition.cta && onContinue && <button className="primary" type="button" onClick={onContinue}>{definition.cta}</button>}
    </div>
  </Card>
);

const Move2ResourceNotice = ({ record }: { record?: ScenarioOneDecisionRecord }) => {
  if (!record) return null;
  return <p className="s4-resource-consequence" role="status">{getMove2ResourceConsequence(record.resourceEvents)}</p>;
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
  const resourceNames: Record<keyof ScenarioOneState["resources"], string> = {
    ssaCapacity: "ظرفیت SSA",
    protectiveCapacity: "ظرفیت حفاظتی",
    politicalCapital: "سرمایه سیاسی",
    disclosureBudget: "ظرفیت افشای امن",
  };
  const finalResourceEntries = (Object.entries(finalSnapshot.finalState.resources) as Array<[keyof ScenarioOneState["resources"], number]>);
  const finalResourceBaseline = getStateResourceBaseline(finalSnapshot.finalState);
  const mostPressuredResource = [...finalResourceEntries].sort(([keyA, valueA], [keyB, valueB]) =>
    valueA / finalResourceBaseline[keyA] - valueB / finalResourceBaseline[keyB]
  )[0];
  const minimumFinalResource = Math.min(...finalResourceEntries.map(([, value]) => value));
  const anyCriticalResource = finalResourceEntries.some(([, value]) => value < 30);
  const totalUserSpent = Object.values(finalSnapshot.finalState.resourceAccounting?.userSpent ?? {}).reduce((sum, value) => sum + value, 0);
  const totalRecovered = Object.values(finalSnapshot.finalState.resourceAccounting?.recovered ?? {}).reduce((sum, value) => sum + value, 0);

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
          <p>وضعیت پایانی: {END_STATE_LABELS_FA[finalSnapshot.primaryEndState]}</p>
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
          <div className="s4-resource-summary">
            <span><strong>{minimumFinalResource}</strong>کمترین ذخیره پایانی</span>
            <span><strong>{resourceNames[mostPressuredResource[0]]}</strong>پرفشارترین منبع</span>
            <span><strong>{anyCriticalResource ? "بله" : "خیر"}</strong>ورود به سطح بحرانی</span>
            <span><strong>{totalUserSpent}</strong>مصرف مستقیم انتخاب‌ها</span>
            <span><strong>{totalRecovered}</strong>بازیابی بین مراحل</span>
          </div>
          <div className="s4-resource-paths">
            {[
              ["ظرفیت SSA", "ssaCapacity"],
              ["ظرفیت حفاظتی", "protectiveCapacity"],
              ["سرمایه سیاسی", "politicalCapital"],
              ["ظرفیت افشای امن", "disclosureBudget"],
            ].map(([label, key]) => {
              const points = [
                finalSnapshot.move1.stateBefore.resources,
                finalSnapshot.move1.stateAfter.resources,
                finalSnapshot.move2.stateAfter.resources,
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
                          <b dir="ltr">{value} / 100</b>
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
          <p className="s4-resource-boundary">مقادیر منابع، ظرفیت‌های نرمال‌شده درون این سناریو هستند و نباید به‌عنوان اندازه‌گیری یا برآورد تجربی ظرفیت واقعی هیچ کشور یا سازمانی تفسیر شوند.</p>
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
  const [narrativeDebugEnabled, setNarrativeDebugEnabled] = useState(false);
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
  const [move2InvestigationInjects, setMove2InvestigationInjects] = useState<string[]>([]);
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
  const [move1ConflictAcknowledged, setMove1ConflictAcknowledged] = useState(false);
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
        phase === "move3_update" ||
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
    if (!selectedId || !canAffordResourceCosts(state.resources, selectedId) || confirmLockedRef.current) return;
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
    if (!selectedId || !canAffordResourceCosts(state.resources, selectedId) || confirmLockedRef.current) return;
    confirmLockedRef.current = true;
    const before = stateBeforeWindowRef.current ?? cloneState(state);
    const after = applyMove2Decision(state, windowId, selectedId, `${rngSeed}:move2`);
    if (windowId === "m2_investigation") {
      setMove2InvestigationInjects([
        ...(after.flags.m2IntelDelay ? ["m2_inject_2b_intelligence_delay"] : []),
        ...(after.flags.m2CommercialRestriction ? ["m2_inject_2c_commercial_restriction"] : []),
      ]);
    }
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
    if (!selectedId || !canAffordResourceCosts(state.resources, selectedId) || confirmLockedRef.current) return;
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
    setPhase("move3_update");
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
    const order: Phase[] = ["intro_title", "intro_narrative", "intro_role", "intro_objectives", "intro_how_to", "intro_rules", "brief"];
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
  const attributionBrier = phase === "aar" && finalSnapshot
    ? calculateAttributionBrier(move3Snapshot?.playerAttributionEstimateFinal, finalSnapshot.hiddenAarData.trueIncidentAttribution)
    : null;
  const aarEstimatePre = move2Snapshot?.attributionEstimatePre;
  const aarEstimatePost = move2Snapshot?.attributionEstimatePost;
  const aarEstimateFinal = move3Snapshot?.playerAttributionEstimateFinal;
  const aarTruth = phase === "aar" ? finalSnapshot?.hiddenAarData.trueIncidentAttribution : undefined;
  const aarTruthExplanation = aarTruth ? getTruthExplanation(aarTruth) : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarTrajectory = typeof aarEstimatePre === "number" && typeof aarEstimatePost === "number" && typeof aarEstimateFinal === "number"
    ? formatAttributionTrajectory(aarEstimatePre, aarEstimatePost, aarEstimateFinal)
    : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarBrierInterpretation = attributionBrier
    ? getBrierPlainLanguageInterpretation(attributionBrier.brier)
    : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarEstimateExplanation = attributionBrier
    ? getFinalEstimateExplanation(attributionBrier.estimate, attributionBrier.brier)
    : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarResultMeaning = attributionBrier && aarTruth
    ? getAarResultMeaning(attributionBrier.estimate, aarTruth)
    : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarThresholdLabel = thresholdOptions.find((option) => option.id === move3Choices.threshold)?.label ?? MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarActionLabel = crisisCoaOptions.find((option) => option.id === move3Choices.coa)?.label ?? MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarIntentLabel = phase === "aar" && finalSnapshot ? AAR_TRUTH_LABELS_FA.intent[finalSnapshot.hiddenAarData.trueRedIntent] : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarCauseLabel = phase === "aar" && finalSnapshot?.hiddenAarData.move2IncidentCause
    ? AAR_TRUTH_LABELS_FA.cause[finalSnapshot.hiddenAarData.move2IncidentCause]
    : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarIsraelActionBody = move3Snapshot?.redAction
    ? ACTOR_REACTION_COPY_FA[`israel:${move3Snapshot.redAction}`]?.body ?? MOVE3_NARRATIVE_COPY_FA.aar.unavailable
    : MOVE3_NARRATIVE_COPY_FA.aar.unavailable;
  const aarTurningPoints = typeof aarEstimatePre === "number" && typeof aarEstimatePost === "number" && typeof aarEstimateFinal === "number" && move3Choices.threshold && move3Choices.coa
    ? buildAarTurningPoints({
        pre: aarEstimatePre,
        post: aarEstimatePost,
        final: aarEstimateFinal,
        thresholdId: move3Choices.threshold,
        thresholdLabel: aarThresholdLabel,
        actionId: move3Choices.coa,
        actionLabel: aarActionLabel,
        israelActionBody: aarIsraelActionBody,
        intentLabel: aarIntentLabel,
      })
    : [];
  const aarRunSummary = typeof aarEstimateFinal === "number" && aarTruth
    ? buildAarRunSummary({
        finalEstimate: aarEstimateFinal,
        visibleConfidence: state.knowledge.systemAttributionConfidence,
        thresholdLabel: aarThresholdLabel,
        intentLabel: aarIntentLabel,
        causeLabel: aarCauseLabel,
        truth: aarTruth,
      })
    : null;
  const opponentObservationAar = snapshot && move2Snapshot && move3Snapshot
    ? buildOpponentObservationAAR({ move1Snapshot: snapshot, move2Snapshot, move3Snapshot })
    : [];
  const narrativePhase: Scenario4NarrativePhase = phase.startsWith("intro")
    ? "intro"
    : phase === "final_report"
      ? "report"
      : phase === "aar"
        ? "aar"
        : phase === "dashboard"
          ? "dashboard"
          : phase.startsWith("move3")
            ? "move3"
            : phase.startsWith("move2")
              ? "move2"
              : "move1";
  const narrativeMove: 1 | 2 | 3 | undefined = narrativePhase === "move1"
    ? 1
    : narrativePhase === "move2"
      ? 2
      : ["move3", "report", "aar", "dashboard"].includes(narrativePhase)
        ? 3
        : undefined;
  const narrativeContext = buildNarrativeContext({
    runId: runIdRef.current,
    phase: narrativePhase,
    move: narrativeMove,
    state,
    move1: snapshot,
    move2: move2Snapshot,
    move3: move3Snapshot,
    finalSnapshot,
    decisions: [...decisions, ...move2Decisions, ...move3Decisions],
    telemetry: decisionTelemetryRef.current,
    openedEvidenceIds: evidenceSeen,
  });
  const latestMove2Decision = move2Decisions[move2Decisions.length - 1];
  const move3EvidencePackage = getMove3EvidencePackage(narrativeContext);
  const showNarrativeTrace = canRenderNarrativeTrace(isAdmin, narrativeDebugEnabled);
  const showAdminDebugPanel = canRenderAdminDebugPanel(isAdmin);
  const showMove1ConflictInject = phase === "dw2" &&
    choices.information === "m1_i_commercial" &&
    state.flags.conflictingCommercialData &&
    !move1ConflictAcknowledged;

  if (phase.startsWith("intro")) {
    return (
      <div className="s4-shell">
        <IntroScreen phase={phase as IntroNarrativeScreen["id"]} onNext={goNextIntro} />
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
            <Card className="s4-move1-panel">
              {getMove1OpeningNarrative(narrativeContext).map((section) => (
                <section key={section.id}>
                  {section.kicker && <span className="s4-kicker">{section.kicker}</span>}
                  <h2 style={{ marginTop: 0 }}>{section.title}</h2>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.95 }}>{section.body}</p>
                  {section.closingLine && <p className="s4-move1-closing-prompt">{section.closingLine}</p>}
                  <NarrativeTraceForAdmin section={section} enabled={showNarrativeTrace} />
                </section>
              ))}
              <button className="primary" onClick={() => moveToPhase("intel")}>
                مشاهده بسته اطلاعاتی
              </button>
            </Card>
          )}

          {phase === "intel" && (
            <Card className="s4-move1-panel">
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
              resources={state.resources}
              context={MOVE1_NARRATIVE_COPY_FA.decisions.information.context}
              question={MOVE1_NARRATIVE_COPY_FA.decisions.information.question}
              why={MOVE1_NARRATIVE_COPY_FA.decisions.information.why}
              options={informationOptions}
              infoGuideActive={decisionInfoGuideOpen}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m1_information")}
              onConfirm={() => confirmDecision("m1_information", "dw2")}
            />
          )}

          {phase === "dw2" && (
            <>
              {showMove1ConflictInject ? (
                <Move1InjectNotice
                  definition={getInjectNarrativeDefinition("m1_inject_1a_conflicting_data")}
                  onContinue={() => setMove1ConflictAcknowledged(true)}
                />
              ) : (
                <DecisionWindow
                  title={windowTitles.m1_protection}
                  resources={state.resources}
                  context={getMove1ProtectionContext(narrativeContext)}
                  question={MOVE1_NARRATIVE_COPY_FA.decisions.protection.question}
                  why={MOVE1_NARRATIVE_COPY_FA.decisions.protection.why}
                  options={protectionOptions}
                  selectedId={selectedId}
                  onSelect={(id) => handleSelect(id, "m1_protection")}
                  onConfirm={() => confirmDecision("m1_protection", "dw3")}
                />
              )}
            </>
          )}

          {phase === "dw3" && (
            <>
              <DecisionWindow
                title={windowTitles.m1_communication}
                resources={state.resources}
                context={getMove1CommunicationContext(narrativeContext)}
                question={MOVE1_NARRATIVE_COPY_FA.decisions.communication.question}
                why={MOVE1_NARRATIVE_COPY_FA.decisions.communication.why}
                options={communicationOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m1_communication")}
                onConfirm={() => confirmDecision("m1_communication", "reason")}
              />
            </>
          )}

          {phase === "reason" && (
            <>
              <DecisionWindow
                title={windowTitles.m1_reason}
                resources={state.resources}
                intro={MOVE1_NARRATIVE_COPY_FA.decisions.reason.intro}
                question={MOVE1_NARRATIVE_COPY_FA.decisions.reason.question}
                options={[...reasonOptions]}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m1_reason")}
                onConfirm={confirmReason}
              />
            </>
          )}

          {phase === "resolving" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>ارزیابی بازیگران</h2>
              <p>پیام ثبت شد. واکنش بازیگران در حال ارزیابی است.</p>
            </Card>
          )}

          {phase === "update" && snapshot && (
            <Card className="s4-move1-panel">
              <h2 style={{ marginTop: 0 }}>{MOVE1_NARRATIVE_COPY_FA.update.title}</h2>
              <p className="s4-stage-update-subhead">{MOVE1_NARRATIVE_COPY_FA.update.subhead}</p>
              <div className="s4-stage-update-grid">
                {getMoveSituationUpdate(narrativeContext).map((section) => (
                  <section key={section.id}>
                    <h3 style={{ margin: 0, color: "var(--accent)" }}>
                      {section.title}
                    </h3>
                    <p style={{ margin: "0.25rem 0 0", lineHeight: 1.85 }}>
                      {section.body}
                    </p>
                    <NarrativeTraceForAdmin section={section} enabled={showNarrativeTrace} />
                  </section>
                ))}
              </div>
              <div className="s4-move1-action-bar" style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <button className="primary" onClick={startMove2}>
                  ورود به مرحله ۲
                </button>
              </div>
            </Card>
          )}

          {phase === "move2_brief" && snapshot && (
            <Card className="s4-move1-panel">
              {getMove2OpeningNarrative(narrativeContext).map((section, index) => (
                <section key={section.id}>
                  {section.kicker && <span className="s4-kicker">{section.kicker}</span>}
                  {index === 0 && <h2 style={{ marginTop: 0 }}>{section.title}</h2>}
                  <p className={index === 0 ? undefined : "hint"} style={{ whiteSpace: "pre-wrap", lineHeight: 1.9 }}>{section.body}</p>
                  {section.closingLine && <p className="s4-move1-closing-prompt">{section.closingLine}</p>}
                  <NarrativeTraceForAdmin section={section} enabled={showNarrativeTrace} />
                </section>
              ))}
              <button className="primary" onClick={() => setPhase("move2_attr_pre")}>
                {MOVE2_NARRATIVE_COPY_FA.cta.recordInitialEstimate}
              </button>
            </Card>
          )}

          {phase === "move2_attr_pre" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>{MOVE2_NARRATIVE_COPY_FA.attribution.initialTitle}</h2>
              <p>{MOVE2_NARRATIVE_COPY_FA.attribution.initialQuestion}</p>
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
              <p className="hint">{MOVE2_NARRATIVE_COPY_FA.attribution.initialHelper}</p>
              <div style={{ marginTop: "1rem" }}>
                <button
                  className="primary"
                  onClick={() => {
                    saveAttributionEstimate(move2AttributionPre, "m2_pre_investigation");
                    setPhase("move2_dw4");
                    enterWindow("m2_investigation", "move_2", state);
                  }}
                >
                  {MOVE2_NARRATIVE_COPY_FA.cta.continueToInvestigation}
                </button>
              </div>
            </Card>
          )}

          {phase === "move2_dw4" && (
            <>
              <Card>
                <h2 style={{ marginTop: 0 }}>{MOVE2_NARRATIVE_COPY_FA.evidencePackageTitle}</h2>
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
                resources={state.resources}
                context={MOVE2_NARRATIVE_COPY_FA.decisions.investigation.context}
                question={MOVE2_NARRATIVE_COPY_FA.decisions.investigation.question}
                why={MOVE2_NARRATIVE_COPY_FA.decisions.investigation.why}
                options={investigationOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m2_investigation", "move_2")}
                onConfirm={() => confirmMove2Decision("m2_investigation", "move2_attr_post")}
              />
            </>
          )}

          {phase === "move2_attr_post" && (
            <>
              <Move2ResourceNotice record={latestMove2Decision} />
              {move2EvidenceCards.some((card) => !["E_M2_01", "E_M2_02", "E_M2_03"].includes(card.id) && state.knowledge.evidenceIds.includes(card.id)) && (
                <Card>
                  <h2 style={{ marginTop: 0 }}>{MOVE2_NARRATIVE_COPY_FA.postInvestigationEvidenceTitle}</h2>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {move2EvidenceCards
                      .filter((card) => !["E_M2_01", "E_M2_02", "E_M2_03"].includes(card.id) && state.knowledge.evidenceIds.includes(card.id))
                      .map((card) => (
                        <EvidenceCard
                          key={`post-${card.id}`}
                          card={card}
                          source={card.id.includes("TECH") ? "تیم فنی" : card.id.includes("ALLY") ? "متحد" : "اپراتور تجاری"}
                          sensitivity="محدود"
                          onToggle={(open) => trackEvidenceToggle(card.id, card.id.includes("TECH") ? "technical" : card.id.includes("ALLY") ? "ally" : "commercial", open)}
                        />
                      ))}
                  </div>
                </Card>
              )}
              {move2InvestigationInjects.map((injectId) => (
                <Move1InjectNotice key={injectId} definition={getInjectNarrativeDefinition(injectId)} />
              ))}
              <Card>
                <h2 style={{ marginTop: 0 }}>{MOVE2_NARRATIVE_COPY_FA.attribution.postTitle}</h2>
                <p className="s4-attribution-previous">{MOVE2_NARRATIVE_COPY_FA.attribution.previousEstimate(move2AttributionPre)}</p>
                <p>{MOVE2_NARRATIVE_COPY_FA.attribution.postQuestion}</p>
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
                <p className="hint">{MOVE2_NARRATIVE_COPY_FA.attribution.postHelper}</p>
                <div style={{ marginTop: "1rem" }}>
                  <button
                    className="primary"
                    onClick={() => {
                      saveAttributionEstimate(move2AttributionPost, "m2_post_investigation");
                      setPhase("move2_dw5");
                      enterWindow("m2_mission", "move_2", state);
                    }}
                  >
                    {MOVE2_NARRATIVE_COPY_FA.cta.continueToMission}
                  </button>
                </div>
              </Card>
            </>
          )}

          {phase === "move2_dw5" && (
            <DecisionWindow
              title={windowTitles.m2_mission}
              resources={state.resources}
              context={MOVE2_NARRATIVE_COPY_FA.decisions.mission.context}
              question={MOVE2_NARRATIVE_COPY_FA.decisions.mission.question}
              why={MOVE2_NARRATIVE_COPY_FA.decisions.mission.why}
              options={missionOptions}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m2_mission", "move_2")}
              onConfirm={() => confirmMove2Decision("m2_mission", "move2_dw6")}
            />
          )}

          {phase === "move2_dw6" && (
            <>
              {state.flags.m2CommercialRestriction && !move2InvestigationInjects.includes("m2_inject_2c_commercial_restriction") && (
                <Move1InjectNotice definition={getInjectNarrativeDefinition("m2_inject_2c_commercial_restriction")} />
              )}
              <DecisionWindow
                title={windowTitles.m2_response}
                resources={state.resources}
                question={MOVE2_NARRATIVE_COPY_FA.decisions.response.question}
                why={MOVE2_NARRATIVE_COPY_FA.decisions.response.why}
                options={responseOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m2_response", "move_2")}
                onConfirm={() => confirmMove2Decision("m2_response", "move2_reason")}
              />
            </>
          )}

          {phase === "move2_reason" && (
            <>
              <DecisionWindow
                title={windowTitles.m2_reason}
                resources={state.resources}
                intro={MOVE2_NARRATIVE_COPY_FA.decisions.reason.intro}
                question={MOVE2_NARRATIVE_COPY_FA.decisions.reason.question}
                options={[...move2ReasonOptions]}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m2_reason", "move_2")}
                onConfirm={confirmMove2Reason}
              />
            </>
          )}

          {phase === "move2_update" && move2Snapshot && (
            <Card className="s4-move1-panel">
              <h2 style={{ marginTop: 0 }}>{MOVE2_NARRATIVE_COPY_FA.update.title}</h2>
              <p className="s4-stage-update-subhead">{MOVE2_NARRATIVE_COPY_FA.update.subhead}</p>
              <div className="s4-stage-update-grid">
                {getMoveSituationUpdate(narrativeContext).map((section) => (
                  <section key={section.id}>
                    <h3 style={{ margin: 0, color: "var(--accent)" }}>{section.title}</h3>
                    <p style={{ margin: "0.25rem 0 0", lineHeight: 1.85 }}>{section.body}</p>
                    <NarrativeTraceForAdmin section={section} enabled={showNarrativeTrace} />
                  </section>
                ))}
              </div>
              <div className="s4-move1-action-bar" style={{ marginTop: "1rem" }}>
                <button className="primary" onClick={startMove3}>{MOVE2_NARRATIVE_COPY_FA.cta.continueToMove3}</button>
              </div>
            </Card>
          )}

          {phase === "move3_brief" && move2Snapshot && (
            <Card>
              {getMove3OpeningNarrative(narrativeContext).map((section, index) => (
                <section key={section.id}>
                  {index === 0 && section.kicker && <span className="s4-kicker">{section.kicker}</span>}
                  {index === 0 && <h2 style={{ marginTop: 0 }}>{section.title}</h2>}
                  <p className={index === 0 ? undefined : "hint"} style={{ whiteSpace: "pre-wrap", lineHeight: 1.9 }}>{section.body}</p>
                  {section.closingLine && <p className="s4-move1-closing-prompt">{section.closingLine}</p>}
                  <NarrativeTraceForAdmin section={section} enabled={showNarrativeTrace} />
                </section>
              ))}
              <button className="primary" onClick={() => setPhase("move3_confidence")}>
                {MOVE3_NARRATIVE_COPY_FA.evidence.title}
              </button>
            </Card>
          )}

          {phase === "move3_confidence" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>{MOVE3_NARRATIVE_COPY_FA.evidence.title}</h2>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {move3EvidencePackage.map((card) => (
                  <EvidenceCard
                    key={card.id}
                    card={card}
                    source={card.source === "technical" ? "تیم فنی" : card.source === "orbital" ? "رصد مداری" : card.source === "ally" ? "متحد" : "اپراتور تجاری"}
                    sensitivity="محدود"
                    onToggle={(open) => trackEvidenceToggle(card.id, card.source, open)}
                  />
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
                {MOVE3_NARRATIVE_COPY_FA.evidence.cta}
              </button>
            </Card>
          )}

          {phase === "move3_attr_final" && (
            <Card>
              <h2 style={{ marginTop: 0 }}>{MOVE3_NARRATIVE_COPY_FA.attribution.title}</h2>
              <p className="s4-attribution-previous">{MOVE3_NARRATIVE_COPY_FA.attribution.previous(move2AttributionPre, move2AttributionPost)}</p>
              <p>{MOVE3_NARRATIVE_COPY_FA.attribution.question}</p>
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
              <p className="hint">{MOVE3_NARRATIVE_COPY_FA.attribution.helper}</p>
              <div style={{ marginTop: "1rem" }}>
                <button
                  className="primary"
                  onClick={() => {
                    saveAttributionEstimate(move3AttributionFinal, "m3_final");
                    setPhase("move3_dw7");
                    enterWindow("m3_threshold", "move_3", state);
                  }}
                >
                  {MOVE3_NARRATIVE_COPY_FA.attribution.cta}
                </button>
              </div>
            </Card>
          )}

          {phase === "move3_dw7" && (
            <DecisionWindow
              title={windowTitles.m3_threshold}
              resources={state.resources}
              context={MOVE3_NARRATIVE_COPY_FA.decisions.threshold.context}
              question={MOVE3_NARRATIVE_COPY_FA.decisions.threshold.question}
              why={MOVE3_NARRATIVE_COPY_FA.decisions.threshold.why}
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
            <>
              <DecisionWindow
                title={windowTitles.m3_coa}
                resources={state.resources}
                context={MOVE3_NARRATIVE_COPY_FA.decisions.coa.context}
                question={MOVE3_NARRATIVE_COPY_FA.decisions.coa.question}
                why={MOVE3_NARRATIVE_COPY_FA.decisions.coa.why}
                options={crisisCoaOptions}
                selectedId={selectedId}
                onSelect={(id) => handleSelect(id, "m3_coa", "move_3")}
                onConfirm={() => {
                  logScenarioFour("s1_m3_coa_confirm", scenarioId, nodeId, { coa: selectedId });
                  confirmMove3Decision("m3_coa", "move3_dw9");
                }}
              />
            </>
          )}

          {phase === "move3_dw9" && (
            <>
              <DecisionWindow
              title={windowTitles.m3_info}
              resources={state.resources}
              context={MOVE3_NARRATIVE_COPY_FA.decisions.information.context}
              question={MOVE3_NARRATIVE_COPY_FA.decisions.information.question}
              why={MOVE3_NARRATIVE_COPY_FA.decisions.information.why}
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
            </>
          )}

          {phase === "move3_offramp" && (
            <>
              <DecisionWindow
              title={windowTitles.m3_offramp}
              resources={state.resources}
              context={MOVE3_NARRATIVE_COPY_FA.decisions.offRamp.context}
              question={MOVE3_NARRATIVE_COPY_FA.decisions.offRamp.question}
              why={MOVE3_NARRATIVE_COPY_FA.decisions.offRamp.why}
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
            </>
          )}

          {phase === "move3_reason" && (
            <>
              <DecisionWindow
              title={windowTitles.m3_reason}
              resources={state.resources}
              intro={MOVE3_NARRATIVE_COPY_FA.decisions.reason.intro}
              question={MOVE3_NARRATIVE_COPY_FA.decisions.reason.question}
              options={move3ReasonOptions}
              selectedId={selectedId}
              onSelect={(id) => handleSelect(id, "m3_reason", "move_3")}
              onConfirm={confirmMove3Reason}
              />
            </>
          )}

          {phase === "move3_update" && finalSnapshot && (
            <Card className="s4-move1-panel">
              <h2 style={{ marginTop: 0 }}>{MOVE3_NARRATIVE_COPY_FA.update.title}</h2>
              <div className="s4-stage-update-grid">
                {getMoveSituationUpdate(narrativeContext).map((section) => (
                  <section key={section.id}>
                    <h3 style={{ margin: 0, color: "var(--accent)" }}>{section.title}</h3>
                    <p style={{ margin: "0.25rem 0 0", lineHeight: 1.85 }}>{section.body}</p>
                    <NarrativeTraceForAdmin section={section} enabled={showNarrativeTrace} />
                  </section>
                ))}
              </div>
              <div className="s4-move1-action-bar" style={{ marginTop: "1rem" }}>
                <button className="primary" onClick={() => setPhase("final_report")}>{MOVE3_NARRATIVE_COPY_FA.update.cta}</button>
              </div>
            </Card>
          )}

          {phase === "final_report" && finalSnapshot && (
            <Card>
              <div className="s4-final-hero">
                <span>وضعیت پایانی</span>
                <h2>{END_STATE_LABELS_FA[finalSnapshot.primaryEndState]}</h2>
                <p>{END_STATE_NARRATIVES_FA[finalSnapshot.primaryEndState].shortSummary}</p>
              </div>
              <div className="s4-final-mini">
                <section><strong>مأموریت</strong><span>{qualitativeStatus("missionContinuity", state.visible.missionContinuity)}</span></section>
                <section><strong>ائتلاف</strong><span>{qualitativeStatus("coalitionCohesion", state.visible.coalitionCohesion)}</span></section>
                <section><strong>تشدید</strong><span>{qualitativeStatus("escalationPressure", state.visible.escalationPressure)}</span></section>
              </div>
              <h2 style={{ marginTop: "1rem" }}>{MOVE3_NARRATIVE_COPY_FA.finalReport.title}</h2>
              <div className="s4-report-sections">
                {finalSnapshot.playerFacingReport.map((section) => (
                  <section key={section.title}>
                    <h3>{section.title}</h3>
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
                  {MOVE3_NARRATIVE_COPY_FA.finalReport.cta}
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
              <h2 style={{ marginTop: 0 }}>{MOVE3_NARRATIVE_COPY_FA.aar.title}</h2>
              <div className="s4-aar-warning">
                {MOVE3_NARRATIVE_COPY_FA.aar.intro}
              </div>
              <h3>{MOVE3_NARRATIVE_COPY_FA.aar.truthSectionTitle}</h3>
              <div className="s4-aar-truth">
                <section><span>{MOVE3_NARRATIVE_COPY_FA.aar.intentTitle}</span><strong>{aarIntentLabel}</strong></section>
                <section><span>{MOVE3_NARRATIVE_COPY_FA.aar.causeTitle}</span><strong>{aarCauseLabel}</strong></section>
                <section><span>{MOVE3_NARRATIVE_COPY_FA.aar.truthTitle}</span><strong>{AAR_TRUTH_LABELS_FA.attribution[finalSnapshot.hiddenAarData.trueIncidentAttribution]}</strong></section>
              </div>
              <p className="hint">{MOVE3_NARRATIVE_COPY_FA.aar.truthNote}</p>

              <h3>{MOVE3_NARRATIVE_COPY_FA.aar.estimatesTitle}</h3>
              <div className="s4-aar-estimates" aria-label={MOVE3_NARRATIVE_COPY_FA.aar.estimatesTitle}>
                {[
                  [MOVE3_NARRATIVE_COPY_FA.aar.estimateBefore, aarEstimatePre],
                  [MOVE3_NARRATIVE_COPY_FA.aar.estimateAfter, aarEstimatePost],
                  [MOVE3_NARRATIVE_COPY_FA.aar.estimateFinal, aarEstimateFinal],
                ].map(([label, value]) => (
                  <section key={String(label)}>
                    <span>{label}</span>
                    <strong>{typeof value === "number" ? `${value}٪ — ${attributionQualitativeLabel(value)}` : MOVE3_NARRATIVE_COPY_FA.aar.unavailable}</strong>
                  </section>
                ))}
              </div>
              <p className="s4-aar-trajectory">{aarTrajectory}</p>

              <h3>{MOVE3_NARRATIVE_COPY_FA.aar.brierTitle}</h3>
              <div className="s4-aar-evaluation">
                <p className="s4-aar-final-estimate"><strong>{MOVE3_NARRATIVE_COPY_FA.aar.finalEstimate(attributionBrier ? `${attributionBrier.estimate.toFixed(0)}٪` : MOVE3_NARRATIVE_COPY_FA.aar.unavailable)}</strong></p>
                <p>{aarTruthExplanation}</p>
                <p>{aarEstimateExplanation}</p>
                <div className="s4-brier-score-card">
                  <span>{MOVE3_NARRATIVE_COPY_FA.aar.brierScoreLabel}</span>
                  <strong>{attributionBrier?.brier.toFixed(2) ?? "—"}</strong>
                </div>
                <p>{MOVE3_NARRATIVE_COPY_FA.aar.brierHelp}</p>
                <div className="s4-brier-scale" aria-label="مقیاس امتیاز Brier">
                  <div className="s4-brier-scale-track" aria-hidden="true" />
                  <section><strong>0.00</strong><span>{MOVE3_NARRATIVE_COPY_FA.aar.scalePerfect}</span></section>
                  <section><strong>0.25</strong><span>{MOVE3_NARRATIVE_COPY_FA.aar.scaleNeutral}</span></section>
                  <section><strong>1.00</strong><span>{MOVE3_NARRATIVE_COPY_FA.aar.scaleFar}</span></section>
                </div>
                <p className="s4-aar-interpretation">{aarBrierInterpretation}</p>

                <details className="s4-aar-statistics">
                  <summary>{MOVE3_NARRATIVE_COPY_FA.aar.statisticsTitle}</summary>
                  <div>
                    <p className="s4-aar-formula">{MOVE3_NARRATIVE_COPY_FA.aar.brierFormula}</p>
                    <p>{MOVE3_NARRATIVE_COPY_FA.aar.probabilityDefinition}</p>
                    <p>{MOVE3_NARRATIVE_COPY_FA.aar.outcomeDefinition}</p>
                    <ul>
                      <li>{MOVE3_NARRATIVE_COPY_FA.aar.outcomeOneDefinition}</li>
                      <li>{MOVE3_NARRATIVE_COPY_FA.aar.outcomeZeroDefinition}</li>
                    </ul>
                    {attributionBrier && (
                      <div className="s4-aar-run-calculation">
                        <p>p = {(attributionBrier.estimate / 100).toFixed(2)}</p>
                        <p>y = {attributionBrier.outcome}</p>
                        <p>Brier = ({(attributionBrier.estimate / 100).toFixed(2)} − {attributionBrier.outcome})² = {attributionBrier.brier.toFixed(2)}</p>
                        <p>{MOVE3_NARRATIVE_COPY_FA.aar.bssTitle} = {attributionBrier.brierSkillScore == null ? "—" : attributionBrier.brierSkillScore.toFixed(2)}</p>
                        {attributionBrier.brierSkillScore != null && <p>{getBssPlainLanguageInterpretation(attributionBrier.brierSkillScore)}</p>}
                      </div>
                    )}
                    <p>{MOVE3_NARRATIVE_COPY_FA.aar.bssHelp}</p>
                  </div>
                </details>
              </div>

              <section className="s4-aar-meaning">
                <h3>{MOVE3_NARRATIVE_COPY_FA.aar.meaningTitle}</h3>
                <p>{aarResultMeaning}</p>
                <p className="hint">{MOVE3_NARRATIVE_COPY_FA.aar.boundary}</p>
              </section>

              <h3>{MOVE3_NARRATIVE_COPY_FA.aar.israelSawTitle}</h3>
              <p>{MOVE3_NARRATIVE_COPY_FA.aar.observationIntro}</p>
              <div className="s4-red-observation-table two-column">
                <div><strong>مرحله</strong><strong>{MOVE3_NARRATIVE_COPY_FA.aar.visibleColumn}</strong></div>
                {opponentObservationAar.map((row, index) => (
                  <div key={row.moveId}>
                    <span>{MOVE3_NARRATIVE_COPY_FA.aar.stage(index + 1)}</span>
                    <span>{row.visibleToIsrael.join("، ")}</span>
                  </div>
                ))}
              </div>
              <h3>{MOVE3_NARRATIVE_COPY_FA.aar.israelHiddenTitle}</h3>
              <div className="s4-red-observation-table two-column">
                <div><strong>مرحله</strong><strong>{MOVE3_NARRATIVE_COPY_FA.aar.hiddenColumn}</strong></div>
                {opponentObservationAar.map((row, index) => (
                  <div key={`hidden-${row.moveId}`}><span>{MOVE3_NARRATIVE_COPY_FA.aar.stage(index + 1)}</span><span>{row.hiddenFromIsrael.join("، ")}</span></div>
                ))}
              </div>
              <h3>{MOVE3_NARRATIVE_COPY_FA.aar.milestonesTitle}</h3>
              <div className="s4-aar-turning-points">
                {aarTurningPoints.map((point, index) => (
                  <section key={point.id}>
                    <h4>{index + 1}. {point.title}</h4>
                    <p>{point.body}</p>
                    <strong>{MOVE3_NARRATIVE_COPY_FA.aar.whyImportant}</strong>
                    <p>{point.why}</p>
                  </section>
                ))}
              </div>

              {aarRunSummary && (
                <>
                  <h3>{MOVE3_NARRATIVE_COPY_FA.aar.runSummaryTitle}</h3>
                  <div className="s4-aar-run-summary">
                    <section><h4>{MOVE3_NARRATIVE_COPY_FA.aar.knownTitle}</h4><p>{aarRunSummary.known}</p></section>
                    <section><h4>{MOVE3_NARRATIVE_COPY_FA.aar.revealedTitle}</h4><p>{aarRunSummary.revealed}</p></section>
                    <section><h4>{MOVE3_NARRATIVE_COPY_FA.aar.differenceTitle}</h4><p>{aarRunSummary.difference}</p></section>
                  </div>
                </>
              )}
              <button className="primary" onClick={() => {
                logScenarioFour("s4_cognitive_dashboard_view", scenarioId, nodeId, { runId: finalSnapshot.runId, from: "aar" });
                setPhase("dashboard");
              }}>{MOVE3_NARRATIVE_COPY_FA.aar.dashboardCta}</button>
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
          {showAdminDebugPanel && (
            <Card>
              <h3 style={{ marginTop: 0 }}>پنل اشکال‌زدایی مدیر</h3>
              <div style={{ display: "grid", gap: "0.45rem", fontSize: "0.88rem" }}>
                <button type="button" onClick={() => setNarrativeDebugEnabled((current) => !current)}>
                  {narrativeDebugEnabled ? "پنهان‌کردن فراداده روایت" : "نمایش فراداده روایت"}
                </button>
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
