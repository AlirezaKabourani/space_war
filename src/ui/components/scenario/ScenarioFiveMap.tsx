import { useEffect, useRef, useState } from "react";
import type { CorridorId } from "./scenario-five/model/index";
import type { ScenarioFivePlayerConvoy } from "./ScenarioFiveTypes";
import { SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_STATUS_LABELS_FA } from "./scenario-five/ui/index";

const POINTS = {
  tehran: { x: 428, y: 200 }, mashhad: { x: 612, y: 175 }, bandar: { x: 541, y: 462 },
  tabriz: { x: 289, y: 102 }, west: { x: 244, y: 246 },
} as const;

const ROUTES: Readonly<Record<CorridorId, { from: { x: number; y: number }; to: { x: number; y: number } }>> = {
  corridor_alpha_east: { from: POINTS.tehran, to: POINTS.mashhad },
  corridor_beta_south: { from: POINTS.bandar, to: POINTS.tehran },
  corridor_gamma_northwest: { from: POINTS.tabriz, to: POINTS.tehran },
  corridor_delta_west: { from: POINTS.tehran, to: POINTS.west },
};

const ORIGIN_DECONFLICTION: Partial<
  Record<ScenarioFivePlayerConvoy["convoyId"], { x: number; y: number }>
> = {
  alpha: { x: 0, y: -12 },
  delta: { x: 0, y: 12 },
};

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const desiredVisualProgress = (convoy: ScenarioFivePlayerConvoy, worldClockMinutes: number): number =>
  convoy.status === "delivered" ? 1 : clamp(worldClockMinutes / Math.max(convoy.projectedArrivalMinute, 1), 0, .97);

const convoySignature = (convoy: ScenarioFivePlayerConvoy): string => JSON.stringify({
  status: convoy.status, integrity: convoy.integrity, delayMinutes: convoy.delayMinutes,
  fallbackNav: convoy.fallbackNav, routeHardened: convoy.routeHardened,
  groundSupport: convoy.groundSupport, escortedNow: convoy.escortedNow,
});

export const ScenarioFiveMap = ({
  convoys, worldClockMinutes, highlightedCorridorId, globalRoutePulse,
}: {
  convoys: readonly ScenarioFivePlayerConvoy[];
  worldClockMinutes: number;
  highlightedCorridorId: CorridorId | null;
  globalRoutePulse: boolean;
}) => {
  const previousVisualProgressRef = useRef(new Map(convoys.map((convoy) => [convoy.convoyId, desiredVisualProgress(convoy, worldClockMinutes)])));
  const previousSignatureRef = useRef(new Map(convoys.map((convoy) => [convoy.convoyId, convoySignature(convoy)])));
  const [visualProgress, setVisualProgress] = useState(() => Object.fromEntries(previousVisualProgressRef.current));
  const [pulsingConvoys, setPulsingConvoys] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const nextProgress: Record<string, number> = {};
    for (const convoy of convoys) {
      const previousVisual = previousVisualProgressRef.current.get(convoy.convoyId) ?? 0;
      const desired = desiredVisualProgress(convoy, worldClockMinutes);
      const visual = convoy.status === "delivered" ? 1
        : convoy.status === "held" ? previousVisual
        : Math.max(previousVisual, desired);
      previousVisualProgressRef.current.set(convoy.convoyId, visual);
      nextProgress[convoy.convoyId] = visual;
    }
    setVisualProgress(nextProgress);
  }, [convoys, worldClockMinutes]);

  useEffect(() => {
    const changed = new Set<string>();
    for (const convoy of convoys) {
      const signature = convoySignature(convoy);
      if (previousSignatureRef.current.get(convoy.convoyId) !== signature) changed.add(convoy.convoyId);
      previousSignatureRef.current.set(convoy.convoyId, signature);
    }
    if (changed.size === 0) return;
    setPulsingConvoys(changed);
    const timer = window.setTimeout(() => setPulsingConvoys(new Set()), 1500);
    return () => window.clearTimeout(timer);
  }, [convoys]);

  return (
    <section className="s5-panel s5-map-panel" aria-labelledby="s5-map-title">
      <div className="s5-section-heading s5-map-heading">
        <div><span>نمای عملیاتی</span><h3 id="s5-map-title">شبکه چهار کریدور</h3></div>
        <b>T+{worldClockMinutes}</b>
      </div>
      <div className="s5-map-frame">
        <svg viewBox="130 34 720 540" role="img" aria-label="نقشه عملیاتی چهار کریدور سناریو پنج">
          <image href="/vendor/iranmap/iranmap.svg" x="130" y="34" width="720" height="540" preserveAspectRatio="xMidYMid meet" className="s5-iran-base-image" />
          {(Object.keys(ROUTES) as CorridorId[]).map((corridorId) => {
            const route = ROUTES[corridorId];
            const convoy = convoys.find((item) => item.corridorId === corridorId)!;
            const highlighted = highlightedCorridorId === corridorId;
            return <g key={corridorId}>
              <line x1={route.from.x} y1={route.from.y} x2={route.to.x} y2={route.to.y} className={`s5-route s5-status-${convoy.status} ${highlighted ? "s5-highlighted" : ""} ${globalRoutePulse ? "s5-global-pulse" : ""}`} />
              <circle cx={route.from.x} cy={route.from.y} r="5" className={`s5-route-endpoint ${highlighted ? "s5-highlighted" : ""}`} />
              <circle cx={route.to.x} cy={route.to.y} r="5" className={`s5-route-endpoint ${highlighted ? "s5-highlighted" : ""}`} />
            </g>;
          })}
          {convoys.map((convoy) => {
            const route = ROUTES[convoy.corridorId];
            const progress = visualProgress[convoy.convoyId] ?? 0;
            const routePoint = { x: route.from.x + (route.to.x - route.from.x) * progress, y: route.from.y + (route.to.y - route.from.y) * progress };
            const originSeparationWeight = clamp(1 - progress / 0.08, 0, 1);
            const originOffset = ORIGIN_DECONFLICTION[convoy.convoyId] ?? { x: 0, y: 0 };
            const displayPoint = {
              x: routePoint.x + originOffset.x * originSeparationWeight,
              y: routePoint.y + originOffset.y * originSeparationWeight,
            };
            const letter = SCENARIO5_CORRIDOR_CONTENT_FA[convoy.corridorId].convoyLabel.replace("کاروان ", "");
            return <g
              key={convoy.convoyId}
              data-convoy-id={convoy.convoyId}
              data-visual-progress={progress}
              style={{ transform: `translate(${displayPoint.x}px, ${displayPoint.y}px)` }}
              className={`s5-convoy-marker s5-status-${convoy.status} ${highlightedCorridorId === convoy.corridorId ? "s5-highlighted" : ""} ${pulsingConvoys.has(convoy.convoyId) ? "s5-state-changed" : ""}`}
            >
              {(convoy.status === "compromised" || highlightedCorridorId === convoy.corridorId) && <circle className="s5-marker-ring" r="29" />}
              {convoy.status === "delivered" && <circle className="s5-completion-ring" r="27" />}
              <g className="s5-truck" aria-label={`نشانگر کامیون ${letter}`}>
                <rect className="s5-truck-body" x="-21" y="-10" width="27" height="18" rx="3" />
                <path className="s5-truck-cabin" d="M6 -7 H15 L21 0 V8 H6 Z" />
                <rect className="s5-truck-window" x="9" y="-4" width="6" height="5" rx="1" />
                <circle className="s5-truck-wheel" cx="-13" cy="10" r="4" />
                <circle className="s5-truck-wheel" cx="14" cy="10" r="4" />
                <text className="s5-truck-letter" textAnchor="middle" x="-7" y="4">{letter}</text>
              </g>
              {convoy.status === "held" && <text className="s5-marker-badge" textAnchor="middle" y="-22">Ⅱ</text>}
              {convoy.status === "delivered" && <text className="s5-marker-check" textAnchor="middle" x="24" y="-17">✓</text>}
            </g>;
          })}
        </svg>
      </div>
      <div className="s5-convoy-strip">
        {convoys.map((convoy) => {
          const content = SCENARIO5_CORRIDOR_CONTENT_FA[convoy.corridorId];
          const mitigations = [convoy.fallbackNav ? "NAV" : null, convoy.routeHardened ? "H" : null, convoy.groundSupport ? "G" : null, convoy.escortedNow ? "E" : null].filter((item): item is string => item !== null);
          return <article key={convoy.convoyId} className={`s5-convoy-mini s5-status-${convoy.status}`}>
            <header><strong>{content.convoyLabel}</strong><span>{SCENARIO5_STATUS_LABELS_FA[convoy.status]}</span></header>
            <div><span>یکپارچگی {convoy.integrity}</span><span>تأخیر {convoy.delayMinutes}′</span></div>
            <small>ETA T+{convoy.projectedArrivalMinute} / D T+{convoy.deadlineMinute}</small>
            {mitigations.length > 0 && <div className="s5-mini-badges">{mitigations.map((item) => <b key={item}>{item}</b>)}</div>}
          </article>;
        })}
      </div>
    </section>
  );
};
