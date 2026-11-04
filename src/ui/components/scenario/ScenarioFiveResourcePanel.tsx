import type { ScenarioFivePlayerViewModel } from "./ScenarioFiveTypes";
import { ScenarioFiveClockIcon } from "./scenario-five/ui/ScenarioFiveTime";

export const ScenarioFiveResourcePanel = ({
  resources,
}: {
  resources: ScenarioFivePlayerViewModel["resources"];
}) => {
  const remaining = Math.max(0, resources.missionHorizonMinutes - resources.worldClockMinutes);
  return (
    <aside className="s5-command-resources" aria-label="منابع مأموریت">
      <div className="s5-command-chip"><span>ظرفیت پایش و اطلاعات (ISR)</span><strong>{resources.isrCapacity}/100</strong></div>
      <div className="s5-command-chip"><span>ذخیره پشتیبانی</span><strong>{resources.supportReserve}/100</strong></div>
      <div className="s5-command-chip s5-time-chip"><span><ScenarioFiveClockIcon />زمان عملیاتی</span><strong><bdi dir="ltr">T+{resources.worldClockMinutes}</bdi> از {resources.missionHorizonMinutes} دقیقه</strong></div>
      <div className="s5-command-chip"><span>زمان باقی‌مانده</span><strong>{remaining} دقیقه</strong></div>
      <div className="s5-command-chip"><span>شواهد ثبت‌شده</span><strong>{resources.evidenceCount}</strong></div>
      {(resources.isrCapacity <= 20 || resources.supportReserve <= 20) && (
        <span className="s5-operational-warning" title="یکی از ذخایر مأموریت به سطح محدود رسیده است">!</span>
      )}
    </aside>
  );
};
