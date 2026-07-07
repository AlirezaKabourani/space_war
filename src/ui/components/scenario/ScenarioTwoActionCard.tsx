import { useState } from "react";
import type { ResourceState } from "../../../core/types/scenario";
import type { ActionCard, SelectedAction } from "./ScenarioTwoTypes";

const categoryLabels: Record<ActionCard["category"], string> = {
  diagnosis: "تشخیص",
  navigation: "ناوبری",
  logistics: "لجستیک",
  command: "فرماندهی",
  civilian: "مدنی",
  deception: "فریب/پراکندگی",
  risky: "پرریسک",
};

const resourceLabels: Record<keyof ResourceState, string> = {
  satelliteISR: "ISR",
  energy: "ENG",
  time: "TIME",
};

const resourceClass: Record<keyof ResourceState, string> = {
  satelliteISR: "isr",
  energy: "energy",
  time: "time",
};

const targetLabels: Record<NonNullable<ActionCard["targetType"]>, string> = {
  zone: "ناحیه",
  convoy: "کاروان",
  route: "مسیر",
  global: "بدون هدف",
};

const getEffectHint = (action: ActionCard) => {
  const effects = action.effects;
  const hints: string[] = [];
  if ((effects.ambiguity ?? 0) < 0) hints.push("ابهام ↓");
  if ((effects.navigationIntegrity ?? 0) > 0) hints.push("ناوبری ↑");
  if ((effects.criticalDelivery ?? 0) > 0) hints.push("تحویل ↑");
  if ((effects.gnssExposureRisk ?? 0) < 0) hints.push("ریسک GNSS ↓");
  if ((effects.logisticsContinuity ?? 0) > 0) hints.push("لجستیک ↑");
  if ((effects.escalationRisk ?? 0) < 0) hints.push("تنش ↓");
  return hints.slice(0, 2).join(" / ") || "اثر عملیاتی مرحله‌ای";
};

const CostChips = ({
  cost,
  unaffordable,
  risky,
}: {
  cost: Partial<ResourceState>;
  unaffordable?: boolean;
  risky?: boolean;
}) => {
  const entries = (Object.entries(cost) as Array<[keyof ResourceState, number]>).filter(([, value]) => value > 0);
  if (entries.length === 0) return <span className="s2-cost-chip free">بدون هزینه فوری</span>;
  return (
    <>
      {entries.map(([key, value]) => (
        <span
          key={key}
          className={`s2-cost-chip ${resourceClass[key]} ${unaffordable ? "unaffordable" : ""} ${risky ? "risky" : ""}`}
        >
          -{value} {resourceLabels[key]}
        </span>
      ))}
    </>
  );
};

export const ScenarioTwoActionCard = ({
  action,
  selectedAction,
  disabledReason,
  isTargeting = false,
  riskReason,
  onPick,
  onRemove,
}: {
  action: ActionCard;
  selectedAction?: SelectedAction;
  disabledReason?: string;
  isTargeting?: boolean;
  riskReason?: string;
  onPick: () => void;
  onRemove: () => void;
}) => {
  const isSelected = Boolean(selectedAction);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const tooltip = disabledReason || riskReason || action.description;
  return (
    <div
      className={`s2-action-card ${isSelected ? "selected" : ""} ${isTargeting ? "targeting" : ""} ${riskReason ? "risky" : ""} ${disabledReason ? "disabled" : ""}`}
      title={tooltip}
    >
      <button
        className="s2-action-card-main"
        onClick={isSelected ? onRemove : onPick}
        disabled={Boolean(disabledReason)}
        type="button"
      >
        <div className="s2-action-card-top">
          <span>{categoryLabels[action.category]}</span>
          <strong>{action.targetType ? `هدف: ${targetLabels[action.targetType]}` : "بدون هدف"}</strong>
        </div>
        <h4>{action.title}</h4>
        <div className="s2-action-effect">{getEffectHint(action)}</div>
        <div className="s2-action-costs">
          <CostChips cost={action.cost} unaffordable={Boolean(disabledReason)} risky={Boolean(riskReason)} />
        </div>
        <div className="s2-action-card-foot">
          <span>{isTargeting ? "هدف را روی نقشه انتخاب کنید" : selectedAction?.targetId ? "هدف ثبت شد" : "آماده انتخاب"}</span>
          {selectedAction?.targetId && <strong>{selectedAction.targetId}</strong>}
          {isTargeting && <em>در انتظار هدف</em>}
          {isSelected && <em>انتخاب شده، برای حذف کلیک کنید</em>}
        </div>
      </button>
      <button
        type="button"
        className={`s2-action-help-button ${isHelpOpen ? "open" : ""}`}
        aria-label={`توضیح ${action.title}`}
        aria-expanded={isHelpOpen}
        onClick={() => setIsHelpOpen((value) => !value)}
      >
        ?
      </button>
      {isHelpOpen && (
        <div className="s2-action-description">
          {action.description}
          {(disabledReason || riskReason) && <strong>{disabledReason || riskReason}</strong>}
        </div>
      )}
    </div>
  );
};
