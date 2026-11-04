import { useEffect, useRef, useState } from "react";
import type { CorridorId } from "./scenario-five/model/index";
import type { ScenarioFiveEvidenceSummary, ScenarioFivePlayerConvoy } from "./ScenarioFiveTypes";
import { SCENARIO5_CORRIDOR_CONTENT_FA, SCENARIO5_STATUS_LABELS_FA } from "./scenario-five/ui/index";
import { alternateRouteControlPoint, deadlineMargin, ESCORT_EXPIRED, marginLabel, mitigationLabels, routePresentationPoint } from "./scenario-five/ui/gameplayPresentation";
import { ScenarioFiveClockIcon } from "./scenario-five/ui/ScenarioFiveTime";

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
  convoys, worldClockMinutes, highlightedCorridorId, globalRoutePulse, evidence,
  legalTargets = [], onSelectTarget, reroutes = [], checkpoints = [], expiredEscortCorridors = [],
}: {
  convoys: readonly ScenarioFivePlayerConvoy[];
  evidence: readonly ScenarioFiveEvidenceSummary[];
  worldClockMinutes: number;
  highlightedCorridorId: CorridorId | null;
  globalRoutePulse: boolean;
  legalTargets?: readonly CorridorId[];
  onSelectTarget?: (id: CorridorId) => void;
  reroutes?: readonly CorridorId[];
  checkpoints?: readonly CorridorId[];
  expiredEscortCorridors?: readonly CorridorId[];
}) => {
  const previousVisualProgressRef = useRef(new Map(convoys.map((convoy) => [convoy.convoyId, desiredVisualProgress(convoy, worldClockMinutes)])));
  const previousSignatureRef = useRef(new Map(convoys.map((convoy) => [convoy.convoyId, convoySignature(convoy)])));
  const [visualProgress, setVisualProgress] = useState(() => Object.fromEntries(previousVisualProgressRef.current));
  const [pulsingConvoys, setPulsingConvoys] = useState<ReadonlySet<string>>(new Set());
  const previousEvidenceRef = useRef(new Set(evidence.map(e => e.evidenceId)));
  const [freshCorridors, setFreshCorridors] = useState<ReadonlySet<CorridorId>>(new Set());
  useEffect(() => {
    const fresh = evidence.filter(e => !previousEvidenceRef.current.has(e.evidenceId));
    previousEvidenceRef.current = new Set(evidence.map(e => e.evidenceId));
    if (!fresh.length) return;
    setFreshCorridors(new Set(fresh.flatMap(e => e.observedCorridorId ? [e.observedCorridorId] : [])));
  }, [evidence]);
  useEffect(() => {
    if (!freshCorridors.size) return;
    const timer = window.setTimeout(() => setFreshCorridors(new Set()), 1500);
    return () => window.clearTimeout(timer);
  }, [freshCorridors]);

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
  }, [convoys]);
  useEffect(() => {
    if (!pulsingConvoys.size) return;
    const timer = window.setTimeout(() => setPulsingConvoys(new Set()), 1500);
    return () => window.clearTimeout(timer);
  }, [pulsingConvoys]);

  return (
    <section className="s5-panel s5-map-panel" aria-labelledby="s5-map-title">
      <div className="s5-section-heading s5-map-heading">
        <div><span>نمای عملیاتی</span><h3 id="s5-map-title">شبکه چهار کریدور</h3><small>{onSelectTarget ? 'انتخاب هدف: نقشه یا فهرست سمت چپ' : 'جابه‌جایی کاروان‌ها بر اساس زمان عملیاتی'}</small></div>
        <div className="s5-map-clock"><b><ScenarioFiveClockIcon /> زمان فعلی نقشه: <bdi dir="ltr">T+{worldClockMinutes}</bdi> دقیقه</b>
          {evidence.some((item) => item.observedCorridorId === null) && <small>شواهد چندمحوره: {evidence.filter((item) => item.observedCorridorId === null).length}</small>}
        </div>
      </div>
      <div className="s5-map-frame">
        <svg viewBox="130 34 720 540" role="group" aria-label="نقشه عملیاتی چهار کریدور سناریو ۲">
          <image href="/vendor/iranmap/iranmap.svg" x="130" y="34" width="720" height="540" preserveAspectRatio="xMidYMid meet" className="s5-iran-base-image" />
          {(Object.keys(ROUTES) as CorridorId[]).map((corridorId) => {
            const route = ROUTES[corridorId];
            const convoy = convoys.find((item) => item.corridorId === corridorId)!;
            const highlighted = highlightedCorridorId === corridorId;
            const evidenceCount = evidence.filter((item) => item.observedCorridorId === corridorId).length;
            const rerouted = reroutes.includes(corridorId);
            const selectable = legalTargets.includes(corridorId) && !!onSelectTarget;
            const midX = (route.from.x + route.to.x) / 2;
            const midY = (route.from.y + route.to.y) / 2;
            const control = alternateRouteControlPoint(route);
            return <g key={corridorId} className={freshCorridors.has(corridorId) ? 's5-fresh-evidence' : ''}>
              <title>{`${SCENARIO5_CORRIDOR_CONTENT_FA[corridorId].targetLabel}؛ شاهد ${evidenceCount}؛ ${mitigationLabels(convoy).join('، ')}`}</title>
              <line x1={route.from.x} y1={route.from.y} x2={route.to.x} y2={route.to.y} className={`s5-route s5-status-${convoy.status} ${rerouted ? 's5-original-route' : ''} ${highlighted ? "s5-highlighted" : ""} ${globalRoutePulse ? "s5-global-pulse" : ""}`} />
              {rerouted && <g className="s5-alternate-route"><path data-corridor-id={corridorId} d={`M${route.from.x} ${route.from.y} Q${control.x} ${control.y} ${route.to.x} ${route.to.y}`} /><text x={midX + 25} y={midY - 45} textAnchor="middle">مسیر جایگزین</text></g>}
              {convoy.routeHardened && checkpoints.includes(corridorId) && <g className="s5-checkpoints"><title>نقاط کنترل فعال</title>{[.25,.5,.75].map(t => <circle key={t} cx={route.from.x + (route.to.x-route.from.x)*t} cy={route.from.y + (route.to.y-route.from.y)*t} r="5" />)}</g>}
              {selectable && <line role="button" tabIndex={0} aria-label={`انتخاب ${SCENARIO5_CORRIDOR_CONTENT_FA[corridorId].targetLabel}`} aria-pressed={highlighted}
                className="s5-route-hit" x1={route.from.x} y1={route.from.y} x2={route.to.x} y2={route.to.y}
                onClick={() => onSelectTarget(corridorId)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTarget(corridorId); } }} />}
              <circle cx={route.from.x} cy={route.from.y} r="5" className={`s5-route-endpoint ${highlighted ? "s5-highlighted" : ""}`} />
              <circle cx={route.to.x} cy={route.to.y} r="5" className={`s5-route-endpoint ${highlighted ? "s5-highlighted" : ""}`} />
              <g className="s5-route-evidence-badge" transform={`translate(${(route.from.x + route.to.x) / 2}, ${(route.from.y + route.to.y) / 2 - 25})`}>
                <rect x="-37" y="-13" width="74" height="26" rx="10" />
                <text textAnchor="middle" dominantBaseline="central" direction="rtl">شاهد {evidenceCount}</text>
              </g>
            </g>;
          })}
          {convoys.map((convoy) => {
            const route = ROUTES[convoy.corridorId];
            const progress = visualProgress[convoy.convoyId] ?? 0;
            const routePoint = routePresentationPoint(route, progress, reroutes.includes(convoy.corridorId));
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
              role={legalTargets.includes(convoy.corridorId) && onSelectTarget ? 'button' : undefined}
              tabIndex={legalTargets.includes(convoy.corridorId) && onSelectTarget ? 0 : undefined}
              aria-label={SCENARIO5_CORRIDOR_CONTENT_FA[convoy.corridorId].targetLabel}
              onClick={() => legalTargets.includes(convoy.corridorId) && onSelectTarget?.(convoy.corridorId)}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && legalTargets.includes(convoy.corridorId)) { e.preventDefault(); onSelectTarget?.(convoy.corridorId); } }}
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
          const mitigations = [...mitigationLabels(convoy), ...(convoy.routeHardened && checkpoints.includes(convoy.corridorId) ? ['نقاط کنترل فعال'] : [])];
          return <article key={convoy.convoyId} data-convoy-card={convoy.convoyId} className={`s5-convoy-mini s5-status-${convoy.status} ${highlightedCorridorId === convoy.corridorId ? 's5-selected' : ''}`}>
            <header><strong>{content.convoyLabel}</strong><span>{SCENARIO5_STATUS_LABELS_FA[convoy.status]}</span></header>
            <p>{content.cargoLabel} · <bdi>{content.routeLabel}</bdi></p>
            <p>سلامت عملیاتی: <bdi dir="ltr">{convoy.integrity} / 100</bdi></p>
            <p>رسیدن برآوردی: <bdi dir="ltr">T+{convoy.projectedArrivalMinute}</bdi> دقیقه</p>
            <p>مهلت تحویل: <bdi dir="ltr">T+{convoy.deadlineMinute}</bdi> دقیقه</p>
            <p>{marginLabel(deadlineMargin(convoy))}</p>
            <p>تأخیر تجمعی: +{convoy.delayMinutes} دقیقه</p>
            {mitigations.length > 0 && <div className="s5-mini-badges">{mitigations.map((item) => <b key={item}>{item}</b>)}</div>}
            {expiredEscortCorridors.includes(convoy.corridorId) && !convoy.escortedNow && <small>{ESCORT_EXPIRED}</small>}
            {onSelectTarget && <button type="button" className="s5-map-target" disabled={!legalTargets.includes(convoy.corridorId)} aria-pressed={highlightedCorridorId === convoy.corridorId} onClick={() => onSelectTarget(convoy.corridorId)}>انتخاب هدف</button>}
            <details><summary>شواهد این کریدور: {evidence.filter(e => e.observedCorridorId === convoy.corridorId).length}</summary>
              <p>{evidence.filter(e => e.observedCorridorId === convoy.corridorId && e.direction === 'supports_targeted').length} مشاهده سازگار با اخلال هدفمند</p>
              <p>{evidence.filter(e => e.observedCorridorId === convoy.corridorId && e.direction === 'ambiguous').length} مشاهده مبهم / چندتفسیره</p>
              <p>{evidence.filter(e => e.observedCorridorId === convoy.corridorId && e.direction === 'supports_nonhostile').length} مشاهده بیشتر سازگار با علت غیرخصمانه</p>
            </details>
          </article>;
        })}
      </div>
    </section>
  );
};
