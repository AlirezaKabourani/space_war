import type { CorridorId } from '../model/index';
import { BASE_ROUND_MINUTES, getMissionAction } from '../model/mission/index';
import type { MissionActionId } from '../model/mission/index';
import type { ScenarioFivePlayerConvoy, ScenarioFivePlayerViewModel } from '../../ScenarioFiveTypes';

interface PresentationPoint { readonly x: number; readonly y: number }
interface PresentationRoute { readonly from: PresentationPoint; readonly to: PresentationPoint }
export const alternateRouteControlPoint = (route: PresentationRoute): PresentationPoint => ({
  x: (route.from.x + route.to.x) / 2 + 45,
  y: (route.from.y + route.to.y) / 2 - 60,
});
// Only the SVG position changes. The caller supplies the existing progress scalar.
export function routePresentationPoint(route: PresentationRoute, progress: number, rerouted: boolean): PresentationPoint {
  if (!rerouted) return {
    x: route.from.x + (route.to.x - route.from.x) * progress,
    y: route.from.y + (route.to.y - route.from.y) * progress,
  };
  const control = alternateRouteControlPoint(route);
  const remaining = 1 - progress;
  return {
    x: remaining * remaining * route.from.x + 2 * remaining * progress * control.x + progress * progress * route.to.x,
    y: remaining * remaining * route.from.y + 2 * remaining * progress * control.y + progress * progress * route.to.y,
  };
}

export const ESCORT_ACTIVE = 'اسکورت فعال';
export const ESCORT_EXPIRED = 'اسکورت مرحله قبل پایان یافت';
export const ESCORT_COMPLETED = 'اسکورت در جریان این اقدام اعمال شد و با ورود به مرحله بعد پایان یافت.';
export const escortOutcomeLabel = (applied: boolean, activeAfter: boolean) => applied ? (activeAfter ? ESCORT_ACTIVE : ESCORT_COMPLETED) : null;

export const phaseNumber = (phase: string) => ['A', 'B', 'C', 'D'].indexOf(phase) + 1;
export const deadlineMargin = (c: ScenarioFivePlayerConvoy) => c.deadlineMinute - c.projectedArrivalMinute;
export const marginLabel = (margin: number) => margin >= 0 ? `${margin} دقیقه تا مهلت` : `${Math.abs(margin)} دقیقه عبور از مهلت`;
export const mitigationLabels = (c: ScenarioFivePlayerConvoy) => [
  c.fallbackNav ? 'ناوبری پشتیبان' : null, c.routeHardened ? 'مسیر تقویت‌شده' : null,
  c.groundSupport ? 'پشتیبانی زمینی' : null, c.escortedNow ? ESCORT_ACTIVE : null,
].filter((s): s is string => s !== null);
export const actionTiming = (id: MissionActionId) => {
  const a = getMissionAction(id);
  return { duration: a.durationMinutes, assessment: BASE_ROUND_MINUTES + a.durationMinutes, final: a.roundId === 8 };
};
export function actionPreview(view: ScenarioFivePlayerViewModel, id: MissionActionId, target: CorridorId | null) {
  const a = getMissionAction(id);
  const effectiveTarget = a.target === 'fixed_alpha' ? 'corridor_alpha_east' : a.target === 'required' ? target : null;
  const valid = view.availableActionIds.includes(id) && a.isrCost <= view.resources.isrCapacity && a.supportCost <= view.resources.supportReserve
    && (a.target === 'none' || view.convoys.some(c => c.corridorId === effectiveTarget && c.status !== 'delivered'));
  return { valid, effectiveTarget, isrBefore: view.resources.isrCapacity, isrAfter: view.resources.isrCapacity - a.isrCost,
    supportBefore: view.resources.supportReserve, supportAfter: view.resources.supportReserve - a.supportCost, ...actionTiming(id) };
}
export interface VisibleDecision { readonly actionId: MissionActionId; readonly effectiveTargetCorridorId: CorridorId | null }
// Geometry consumes only the player's own committed actions and safe convoy flags.
export const reroutedCorridors = (records: readonly VisibleDecision[]) => records.flatMap(r =>
  getMissionAction(r.actionId).visibleReroute && r.effectiveTargetCorridorId ? [r.effectiveTargetCorridorId] : []);
export const checkpointCorridors = (records: readonly VisibleDecision[]) => records.flatMap(r =>
  (r.actionId === 'b2_staged_checkpoints' || r.actionId === 'c1_checkpoint_spacing') && r.effectiveTargetCorridorId ? [r.effectiveTargetCorridorId] : []);
