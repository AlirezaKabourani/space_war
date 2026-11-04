import { getMissionAction } from "./scenario-five/model/mission/index";
import type { MissionActionId } from "./scenario-five/model/mission/index";
import { SCENARIO5_ACTION_COPY_FA } from "./scenario-five/ui/index";
import { actionTiming } from "./scenario-five/ui/gameplayPresentation";

export const ScenarioFiveActionCard = ({
  actionId,
  selected,
  onSelect,
}: {
  actionId: MissionActionId;
  selected: boolean;
  onSelect: () => void;
}) => {
  const action = getMissionAction(actionId);
  const copy = SCENARIO5_ACTION_COPY_FA[actionId];
  const timing = actionTiming(actionId);
  const targetText = action.target === "required"
    ? "هدف: انتخاب کریدور توسط شما"
    : action.target === "fixed_alpha"
      ? "هدف ثابت: کریدور شرقی / کاروان الف"
      : "بدون نیاز به انتخاب هدف";
  return (
    <button
      type="button"
      className={`s5-action-card ${selected ? "s5-selected" : ""}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="s5-action-state">{selected ? "✓ انتخاب‌شده" : "انتخاب اقدام"}</span>
      <h3>{copy.title}</h3>
      <p>{copy.description}</p>
      <div className="s5-known-effect"><strong>اثر شناخته‌شده:</strong> {copy.knownEffect}</div>
      <div className="s5-action-metadata">
        <span>هزینه پایش و اطلاعات (ISR): {action.isrCost}</span>
        <span>هزینه پشتیبانی: {action.supportCost}</span>
        <span>زمان اجرای اقدام: {timing.duration} دقیقه</span>
        <span>{timing.final ? "پس از اقدام نهایی، مأموریت تا افق T+360 دقیقه ادامه می‌یابد." : `زمان تا ارزیابی بعدی: ${timing.assessment} دقیقه`}</span>
      </div>
      <small>{targetText}</small>
    </button>
  );
};
