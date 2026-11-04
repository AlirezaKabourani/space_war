export const ScenarioFiveClockIcon = () => <svg className="s5-clock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg>;

export const ScenarioFiveOperationalTime = ({ minutes, horizon = 360 }: { minutes: number; horizon?: number }) =>
  <span className="s5-operational-time">زمان عملیاتی: <bdi dir="ltr">T+{minutes}</bdi> از {horizon} دقیقه</span>;
