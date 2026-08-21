import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { ActionCard, Convoy, MapZone, Route, SelectedAction } from "./ScenarioTwoTypes";

const zoneColor: Record<MapZone["threatLevel"], string> = {
  safe: "#22c55e",
  suspicious: "#f59e0b",
  jammed: "#ef4444",
  unknown: "#64748b",
};

const routeColor: Record<Route["visualStatus"], string> = {
  safe: "#22c55e",
  risky: "#f59e0b",
  danger: "#ef4444",
  unknown: "#94a3b8",
};

const mapPointByZoneId: Record<string, { x: number; y: number; city: string; role: string }> = {
  zone_north: { x: 289, y: 102, city: "تبریز", role: "مرکز درمانی شمال‌غرب" },
  zone_east: { x: 612, y: 175, city: "مشهد", role: "هاب پشتیبانی شرق" },
  zone_central: { x: 428, y: 200, city: "تهران", role: "قرارگاه لجستیک" },
  zone_south: { x: 541, y: 462, city: "بندرعباس", role: "هاب دریایی جنوب" },
  zone_west: { x: 244, y: 246, city: "مرز عراق", role: "مقصد غربی کاروان د" },
  zone_support_east: { x: 612, y: 184, city: "پایگاه مشهد", role: "پشتیبانی زمینی" },
  zone_ambush: { x: 584, y: 190, city: "محور مشکوک", role: "نقطه کمین/اختلال" },
};

const facilities = [
  { id: "hub_tehran", x: 428, y: 189, label: "TEHRAN LOGISTICS HUB", type: "ops" },
  { id: "hub_isfahan", x: 440, y: 283, label: "ISFAHAN SUPPORT HUB", type: "support" },
  { id: "medical_tabriz", x: 289, y: 102, label: "TABRIZ MEDICAL", type: "medical" },
  { id: "medical_kerman", x: 567, y: 391, label: "KERMAN MEDICAL", type: "medical" },
  { id: "hub_kermanshah", x: 282, y: 217, label: "KERMANSHAH SUPPORT", type: "support" },
  { id: "port_bandar", x: 541, y: 462, label: "BANDAR ABBAS PORT", type: "port" },
  { id: "support_mashhad", x: 612, y: 175, label: "MASHHAD GROUND SUPPORT", type: "support" },
  { id: "iraq_border", x: 244, y: 246, label: "IRAQ BORDER DEST", type: "support" },
];

const convoyOffsets: Record<string, { x: number; y: number }> = {
  convoy_medical: { x: -16, y: 20 },
  convoy_fuel: { x: 24, y: 18 },
  convoy_comms: { x: 18, y: 30 },
  convoy_supplies: { x: -18, y: -16 },
};

const convoyLetterById: Record<string, string> = {
  convoy_medical: "الف",
  convoy_fuel: "ب",
  convoy_comms: "ج",
  convoy_supplies: "د",
};

const gorganPoint = { x: 478, y: 92, city: "گرگان", role: "Waypoint مسیر شمالی" };

const facilityColor = (type: string) => {
  if (type === "medical") return "#34d399";
  if (type === "ops") return "#dbeafe";
  if (type === "port") return "#38bdf8";
  return "#93c5fd";
};

const getZonePoint = (zoneId: string) => mapPointByZoneId[zoneId] ?? { x: 500, y: 310, city: "نامعلوم", role: "محور ناشناخته" };

const getRoutePoints = (route: Route) => {
  const from = getZonePoint(route.fromZoneId);
  const to = getZonePoint(route.toZoneId);
  if (route.id === "route_north_alt") {
    return [from, gorganPoint, to];
  }
  return [from, to];
};

const interpolateRoutePoint = (points: Array<{ x: number; y: number }>, ratio: number) => {
  if (points.length <= 1) return points[0] ?? { x: 500, y: 310 };
  const segmentCount = points.length - 1;
  const scaled = Math.max(0, Math.min(0.999, ratio)) * segmentCount;
  const index = Math.floor(scaled);
  const localRatio = scaled - index;
  const from = points[index];
  const to = points[index + 1];
  return {
    x: from.x + (to.x - from.x) * localRatio,
    y: from.y + (to.y - from.y) * localRatio,
  };
};

const getConvoyPoint = (convoy: Convoy, routes: Route[]) => {
  const route = routes.find((entry) => entry.id === convoy.routeId);
  const routePoints = route ? getRoutePoints(route) : [getZonePoint(convoy.currentZoneId)];
  const ratio = Math.max(0, Math.min(1, convoy.progress / 100));
  const base = interpolateRoutePoint(routePoints, ratio);
  const offset = convoyOffsets[convoy.id] ?? { x: 0, y: 0 };
  return { x: base.x + offset.x, y: base.y + offset.y };
};

const routePath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
  const lift = Math.max(42, Math.abs(from.x - to.x) * 0.12);
  return `M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - lift}, ${(from.x + to.x) / 2} ${Math.max(from.y, to.y) + lift}, ${to.x} ${to.y}`;
};

const routeDrawPath = (route: Route) => {
  const points = getRoutePoints(route);
  if (points.length === 3) {
    const [from, via, to] = points;
    return `M ${from.x} ${from.y} C ${from.x - 24} ${from.y - 112}, ${via.x + 40} ${via.y - 28}, ${via.x} ${via.y} S ${to.x - 130} ${to.y - 88}, ${to.x} ${to.y}`;
  }
  return routePath(points[0], points[1]);
};

const defaultMapTransform = { zoom: 1, x: 0, y: 0 };
type DragState = {
  pointerX: number;
  pointerY: number;
  startX: number;
  startY: number;
};

export const ScenarioTwoMap = ({
  zones,
  routes,
  convoys,
  selectedConvoyId,
  activeTargetType,
  pendingActionId,
  selectedActions,
  previewAction,
  ambiguity,
  navigationIntegrity,
  onSelectZone,
  onSelectConvoy,
  onSelectRoute,
  onSelectConvoyForRoute,
}: {
  zones: MapZone[];
  routes: Route[];
  convoys: Convoy[];
  selectedConvoyId?: string;
  activeTargetType?: "convoy" | "zone" | "route" | "global";
  pendingActionId?: string;
  selectedActions: SelectedAction[];
  previewAction?: ActionCard | null;
  ambiguity: number;
  navigationIntegrity: number;
  onSelectZone: (zoneId: string) => void;
  onSelectConvoy: (convoyId: string) => void;
  onSelectRoute: (routeId: string) => void;
  onSelectConvoyForRoute: (convoyId: string) => void;
}) => {
  const [mapTransform, setMapTransform] = useState(defaultMapTransform);
  const [isPanning, setIsPanning] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const mapActions = selectedActions.filter((item) => item.action.targetType && item.action.targetType !== "global");
  const lastMapAction = mapActions.length > 0 ? mapActions[mapActions.length - 1] : undefined;
  const jitter = navigationIntegrity < 50 ? "s2-jitter" : "";
  const fog = ambiguity > 55 ? "s2-map-fog" : "";
  const isNorthernRouteActive = previewAction?.id === "route_northern" || pendingActionId === "route_northern" || selectedActions.some((item) => item.action.id === "route_northern");
  const isStagedRouteActive = previewAction?.id === "route_staged" || pendingActionId === "route_staged" || selectedActions.some((item) => item.action.id === "route_staged");
  const previewRoute = isNorthernRouteActive
    ? routes.find((route) => route.id === "route_north_alt") ?? routes.find((route) => route.visualStatus === "safe")
    : isStagedRouteActive
      ? routes.find((route) => route.id === "route_staged_east") ?? routes.find((route) => route.visualStatus === "safe")
    : undefined;
  const isAmbushZoneRevealed = zones.some((zone) => zone.id === "zone_ambush" && zone.isRevealed);
  const isMashhadDisruptionIdentified = zones.some((zone) => zone.id === "zone_east" && zone.isRevealed && zone.threatLevel !== "safe");
  const hasGroundSupport = convoys.some((convoy) => convoy.hasGroundSupport);
  const medicalConvoy = convoys.find((convoy) => convoy.id === "convoy_medical");
  const medicalPoint = medicalConvoy ? getConvoyPoint(medicalConvoy, routes) : undefined;
  const targetPoint = (() => {
    if (!lastMapAction?.targetId) return undefined;
    const convoy = convoys.find((item) => item.id === lastMapAction.targetId);
    if (convoy) return getConvoyPoint(convoy, routes);
    if (lastMapAction.targetId in mapPointByZoneId) return getZonePoint(lastMapAction.targetId);
    const route = routes.find((item) => item.id === lastMapAction.targetId);
    if (route) {
      const from = getZonePoint(route.fromZoneId);
      const to = getZonePoint(route.toZoneId);
      return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    }
    return undefined;
  })();
  const clampTransform = (x: number, y: number, zoom: number) => {
    const minX = 1000 - 1000 * zoom;
    const minY = 620 - 620 * zoom;
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    };
  };

  const getSvgPointer = (event: MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 1000,
      y: ((event.clientY - bounds.top) / bounds.height) * 620,
    };
  };

  const handlePanStart = (event: MouseEvent<SVGSVGElement>) => {
    if (mapTransform.zoom <= 1.01 || event.button !== 0) return;
    const pointer = getSvgPointer(event);
    dragStateRef.current = {
      pointerX: pointer.x,
      pointerY: pointer.y,
      startX: mapTransform.x,
      startY: mapTransform.y,
    };
    setIsPanning(true);
  };

  const handlePanMove = (event: MouseEvent<SVGSVGElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    event.preventDefault();
    const pointer = getSvgPointer(event);
    const next = clampTransform(
      drag.startX + pointer.x - drag.pointerX,
      drag.startY + pointer.y - drag.pointerY,
      mapTransform.zoom
    );
    setMapTransform((current) => ({ ...current, ...next }));
  };

  const handlePanEnd = () => {
    dragStateRef.current = null;
    setIsPanning(false);
  };
  const adjustZoom = (direction: "in" | "out") => {
    setMapTransform((current) => {
      const nextZoom = direction === "in"
        ? Math.min(3.1, current.zoom * 1.22)
        : Math.max(1, current.zoom / 1.22);
      const centerX = 500;
      const centerY = 310;
      const ratio = nextZoom / current.zoom;
      const nextX = centerX - (centerX - current.x) * ratio;
      const nextY = centerY - (centerY - current.y) * ratio;
      const clamped = clampTransform(nextX, nextY, nextZoom);
      return { zoom: nextZoom, ...clamped };
    });
  };

  return (
    <div className={`s2-panel s2-map-panel ${fog}`}>
      <div className="s2-panel-title">
        نقشه تاکتیکی عملیات
        {activeTargetType && activeTargetType !== "global" && (
          <span>حالت هدف‌گیری: {pendingActionId}</span>
        )}
      </div>
      <svg
        viewBox="0 0 1000 620"
        preserveAspectRatio="xMidYMin meet"
        className={`s2-map-svg ${mapTransform.zoom > 1.01 ? "pan-enabled" : ""} ${isPanning ? "panning" : ""}`}
        role="img"
        aria-label="نقشه تاکتیکی ایران در سناریو ۲"
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <defs>
          <filter id="s2Glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="s2TerrainNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="7" />
            <feColorMatrix type="saturate" values="0.2" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.18" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect x="0" y="0" width="1000" height="620" rx="18" className="s2-map-bg" />
        <rect x="0" y="0" width="1000" height="620" rx="18" filter="url(#s2TerrainNoise)" opacity="0.85" />
        <g transform={`translate(${mapTransform.x} ${mapTransform.y}) scale(${mapTransform.zoom})`}>
        {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
          <line key={`x-${x}`} x1={x} y1="42" x2={x} y2="578" className="s2-grid-line" />
        ))}
        {[80, 160, 240, 320, 400, 480, 560].map((y) => (
          <line key={`y-${y}`} x1="48" y1={y} x2="952" y2={y} className="s2-grid-line" />
        ))}
        <text x="268" y="28" className="s2-map-country-label">ARMENIA</text>
        <text x="365" y="34" className="s2-map-country-label">AZERBAIJAN</text>
        <text x="688" y="72" className="s2-map-country-label">TURKMENISTAN</text>
        <text x="198" y="276" className="s2-map-country-label">IRAQ</text>
        <text x="845" y="290" className="s2-map-country-label">AFGHANISTAN</text>
        <text x="885" y="438" className="s2-map-country-label">PAKISTAN</text>
        <text x="465" y="88" className="s2-map-water-label">CASPIAN SEA</text>
        <text x="472" y="500" className="s2-map-water-label" transform="rotate(45 452 468)">PERSIAN GULF</text>
        <text x="690" y="546" className="s2-map-water-label">GULF OF OMAN</text>

        <image
          href="/vendor/iranmap/iranmap.svg"
          x="130"
          y="34"
          width="720"
          height="540"
          preserveAspectRatio="xMidYMid meet"
          className="s2-iran-base-image"
        />

        {routes.filter((route) => {
          const touchesAmbush = route.fromZoneId === "zone_ambush" || route.toZoneId === "zone_ambush";
          const isSecondaryMashhadRoute = route.id === "route_north_alt" || route.id === "route_staged_east";
          const isDeceptionPreview = previewAction?.id === "deception_route" && route.id === "route_phantom";
          if (isSecondaryMashhadRoute && !isMashhadDisruptionIdentified && !isNorthernRouteActive && !isStagedRouteActive) return false;
          return !touchesAmbush || isAmbushZoneRevealed || isDeceptionPreview;
        }).map((route) => {
          const to = getZonePoint(route.toZoneId);
          const isSelectable = activeTargetType === "route" && Boolean(selectedConvoyId);
          return (
            <g key={route.id} onClick={() => isSelectable && onSelectRoute(route.id)} className={isSelectable ? "s2-clickable" : ""}>
              <path
                d={routeDrawPath(route)}
                fill="none"
                className={`s2-route-line s2-route-${route.visualStatus}`}
                stroke={routeColor[route.visualStatus]}
                strokeWidth={selectedConvoyId ? 5.5 : 3.5}
                strokeDasharray={route.visualStatus === "unknown" ? "10 8" : route.visualStatus === "risky" ? "8 7" : undefined}
                opacity={isSelectable ? 1 : 0.72}
              >
                <title>{`${route.name} | ریسک GNSS ${route.gnssRisk} | هزینه زمانی ${route.travelCost} | اثر مدنی ${route.civilianImpact}`}</title>
              </path>
              <circle cx={to.x} cy={to.y} r="4" fill={routeColor[route.visualStatus]} opacity="0.9" />
            </g>
          );
        })}

        {previewRoute && (
          <path
            d={routeDrawPath(previewRoute)}
            fill="none"
            className="s2-route-preview"
            stroke="#67e8f9"
            strokeWidth="6"
            strokeDasharray="10 8"
          />
        )}

        {(isNorthernRouteActive || isMashhadDisruptionIdentified) && (
          <g className="s2-facility-node">
            <circle cx={gorganPoint.x} cy={gorganPoint.y} r="7" fill="#67e8f9" stroke="#dbeafe" strokeWidth="1.5" />
            <text x={gorganPoint.x + 12} y={gorganPoint.y - 8} className="s2-facility-label">گرگان</text>
          </g>
        )}

        {!isMashhadDisruptionIdentified && (
          <circle cx={590} cy={184} r="16" className="s2-weak-data-pulse">
            <title>نوسان داده‌ای ضعیف</title>
          </circle>
        )}

        {facilities.map((facility) => (
          <g key={facility.id} className="s2-facility-node">
            <path
              d={`M ${facility.x} ${facility.y - 18} L ${facility.x + 16} ${facility.y - 8} L ${facility.x + 16} ${facility.y + 10} L ${facility.x} ${facility.y + 20} L ${facility.x - 16} ${facility.y + 10} L ${facility.x - 16} ${facility.y - 8} Z`}
              fill="rgba(15,23,42,0.86)"
              stroke={facilityColor(facility.type)}
              strokeWidth="2"
            />
            <text x={facility.x} y={facility.y + 5} className="s2-facility-icon">
              {facility.type === "medical" ? "+" : facility.type === "port" ? "⌂" : "◆"}
            </text>
            <text
              x={facility.id === "support_mashhad" ? facility.x + 44 : facility.x + 22}
              y={facility.id === "support_mashhad" ? facility.y + 8 : facility.y - 6}
              className="s2-facility-label"
            >
              {facility.id === "support_mashhad" ? "پایگاه مشهد" : facility.label}
            </text>
          </g>
        ))}

        {zones.map((zone) => {
          if (zone.id === "zone_support_east") return null;
          if (zone.id === "zone_ambush" && !zone.isRevealed) return null;
          const point = getZonePoint(zone.id);
          const x = point.x;
          const y = point.y;
          const visibleThreat = zone.isRevealed ? zone.threatLevel : "unknown";
          const isSelectable = activeTargetType === "zone";
          const hasCivilWarning = zone.civilianSensitivity > 60;
          return (
            <g key={zone.id} className={isSelectable ? "s2-clickable s2-target-pulse" : ""} onClick={() => isSelectable && onSelectZone(zone.id)}>
              {(zone.threatLevel === "jammed" || zone.gnssDisruption > 60) && zone.isRevealed && (
                <>
                  <circle cx={x} cy={y} r="54" className="s2-disruption-wave" />
                  <circle cx={x} cy={y} r="78" className="s2-disruption-wave delayed" />
                  <text x={x + 48} y={y - 42} className="s2-map-threat-label">GNSS JAM</text>
                </>
              )}
              <circle cx={x} cy={y} r="28" fill={zoneColor[visibleThreat]} opacity={zone.isRevealed ? 0.2 : 0.12} stroke={zoneColor[visibleThreat]} strokeWidth="2.5" filter="url(#s2Glow)" />
              {!zone.isRevealed && zone.id !== "zone_east" && <circle cx={x} cy={y} r="40" className="s2-fog-zone" />}
              <text x={x} y={y - 34} className="s2-map-label">{point.city}</text>
              <text x={x} y={y + 48} className="s2-map-value">{zone.isRevealed ? `${zone.gnssDisruption}% اختلال` : `${zone.gnssDisruption}% نوسان`}</text>
              {hasCivilWarning && <text x={x + 42} y={y - 30} className="s2-warning">!</text>}
            </g>
          );
        })}

        {hasGroundSupport && (
          <g className="s2-ground-support-unit">
            <rect x="548" y="190" width="38" height="18" rx="4" fill="#1d4ed8" stroke="#bfdbfe" strokeWidth="1.6" />
            <circle cx="556" cy="211" r="4" fill="#020617" stroke="#e0f2fe" />
            <circle cx="578" cy="211" r="4" fill="#020617" stroke="#e0f2fe" />
            <text x="594" y="204" className="s2-facility-label">پشتیبانی زمینی</text>
          </g>
        )}

        {convoys.map((convoy) => {
          const { x, y } = getConvoyPoint(convoy, routes);
          const isPrimary = convoy.id === "convoy_medical";
          const isPrimaryRevealed = isPrimary && isMashhadDisruptionIdentified;
          const isCritical = convoy.priority >= 4 && (!isPrimary || isPrimaryRevealed);
          const isSelectable = activeTargetType === "convoy" || (activeTargetType === "route" && !selectedConvoyId);
          const select = activeTargetType === "route" ? onSelectConvoyForRoute : onSelectConvoy;
          const fill = convoy.status === "paused"
            ? "#94a3b8"
            : convoy.status === "compromised"
              ? "#ef4444"
              : convoy.id === "convoy_medical" && isMashhadDisruptionIdentified
                ? "#f59e0b"
                : "#38bdf8";
          return (
            <g
              key={convoy.id}
              className={`s2-convoy-node ${isPrimary ? "s2-primary-convoy" : ""} ${isCritical ? "s2-critical-convoy" : ""} ${isSelectable ? "s2-clickable s2-target-pulse" : ""} ${jitter}`}
              onClick={() => isSelectable && select(convoy.id)}
            >
              {isCritical && (
                <>
                  <circle cx={x} cy={y} r={isPrimaryRevealed ? 42 : 34} className="s2-critical-ring" />
                  <text x={x} y={y - (isPrimaryRevealed ? 46 : 38)} className="s2-critical-badge">{isPrimaryRevealed ? "در خطر" : "حیاتی"}</text>
                </>
              )}
              <g className="s2-truck-icon" transform={`translate(${x} ${y})`}>
                <rect x="-21" y="-12" width="28" height="18" rx="3" fill={fill} stroke={selectedConvoyId === convoy.id ? "#facc15" : "#dbeafe"} strokeWidth={selectedConvoyId === convoy.id ? 3 : 1.4} />
                <path d="M 7 -8 L 19 -8 L 25 0 L 25 6 L 7 6 Z" fill={fill} stroke={selectedConvoyId === convoy.id ? "#facc15" : "#dbeafe"} strokeWidth="1.4" />
                <text x="-7" y="-2.5" className="s2-truck-letter">{convoyLetterById[convoy.id] ?? "؟"}</text>
                <circle cx="-12" cy="9" r="4" fill="#020617" stroke="#e0f2fe" strokeWidth="1.2" />
                <circle cx="16" cy="9" r="4" fill="#020617" stroke="#e0f2fe" strokeWidth="1.2" />
              </g>
              <text x={x} y={y + 43} className="s2-convoy-progress">{convoy.progress}%</text>
              {convoy.hasFallbackNav && <text x={x + 34} y={y + 4} className="s2-nav-badge">NAV</text>}
              <text x={x} y={y + 30} className="s2-convoy-status">{convoy.status === "moving" ? "ON ROUTE" : convoy.status.toUpperCase()}</text>
              <title>{`${convoy.name} | ${convoy.cargo} | اعتماد GNSS ${convoy.gnssTrustLevel} | وضعیت ${convoy.status}`}</title>
            </g>
          );
        })}

        {targetPoint && (
          <circle cx={targetPoint.x} cy={targetPoint.y} r="46" className="s2-action-sweep">
            <title>{`بازخورد اقدام: ${lastMapAction?.action.title ?? "اقدام نقشه‌ای"}`}</title>
          </circle>
        )}
        {previewAction?.id === "action_isr_scan" && (
          <circle cx={612} cy={175} r="66" className="s2-preview-sweep">
            <title>پیش‌نمایش: محور شرق برای آشکارسازی spoofing بررسی می‌شود.</title>
          </circle>
        )}
        {previewAction?.id === "action_continue_gnss" && medicalPoint && (
          <>
            <circle cx={medicalPoint.x + 34} cy={medicalPoint.y - 8} r="24" className="s2-preview-risk" />
            <text x={medicalPoint.x + 54} y={medicalPoint.y - 30} className="s2-map-threat-label">ریسک ادامه GNSS</text>
          </>
        )}
        {previewAction?.id === "action_fallback_nav" && medicalPoint && (
          <text x={medicalPoint.x + 38} y={medicalPoint.y + 2} className="s2-nav-badge">NAV PREVIEW</text>
        )}
        </g>
      </svg>
      <div className="s2-map-controls">
        <span>{Math.round(mapTransform.zoom * 100)}%</span>
        <button type="button" onClick={() => adjustZoom("in")} aria-label="بزرگنمایی نقشه">+</button>
        <button type="button" onClick={() => adjustZoom("out")} aria-label="کوچک‌نمایی نقشه">-</button>
        <button type="button" onClick={() => setMapTransform(defaultMapTransform)}>بازنشانی</button>
      </div>
      <button type="button" className="s2-map-legend-toggle" onClick={() => setLegendOpen((value) => !value)}>
        راهنمای نقشه
      </button>
      {legendOpen && (
        <div className="s2-map-html-legend" aria-label="راهنمای نقشه">
          <strong>راهنمای نقشه</strong>
          <div><i className="route safe" /><span>مسیر امن</span></div>
          <div><i className="route risky" /><span>مسیر مشکوک</span></div>
          <div><i className="route danger" /><span>مسیر آلوده</span></div>
          <div><i className="jam" /><span>ناحیه اختلال</span></div>
          <div><i className="truck" /><span>کاروان</span></div>
        </div>
      )}
    </div>
  );
};
