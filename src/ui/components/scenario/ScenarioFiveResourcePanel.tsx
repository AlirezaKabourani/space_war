import type { ScenarioFivePlayerViewModel } from "./ScenarioFiveTypes";

export const ScenarioFiveResourcePanel = ({
  resources,
}: {
  resources: ScenarioFivePlayerViewModel["resources"];
}) => {
  const remaining = Math.max(0, resources.missionHorizonMinutes - resources.worldClockMinutes);
  return (
    <aside className="s5-command-resources" aria-label="منابع مأموریت">
      <div className="s5-command-chip"><span>ISR</span><strong>{resources.isrCapacity}</strong></div>
      <div className="s5-command-chip"><span>پشتیبانی</span><strong>{resources.supportReserve}</strong></div>
      <div className="s5-command-chip"><span>زمان</span><strong>T+{resources.worldClockMinutes}</strong></div>
      <div className="s5-command-chip"><span>باقی‌مانده</span><strong>{remaining}′</strong></div>
      {(resources.isrCapacity <= 20 || resources.supportReserve <= 20) && (
        <span className="s5-operational-warning" title="یکی از ذخایر مأموریت به سطح محدود رسیده است">!</span>
      )}
    </aside>
  );
};
