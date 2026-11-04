import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ScenarioFive.css";
import { eventLogger } from "../../../services/analytics/eventLogger";
import { archiveS2Completion, beginCognitiveAttempt, completionArchiveStatus, type CognitiveAttempt } from "../../../services/storage/completedCognitiveAttempt";
import { CognitiveArchiveDisclosure } from "./CognitiveArchiveDisclosure";
import type { CorridorId } from "./scenario-five/model/index";
import type { ReasonId } from "./scenario-five/model/cognitive/index";
import { getMissionAction } from "./scenario-five/model/mission/index";
import type { MissionActionId, MissionActionSelection } from "./scenario-five/model/mission/index";
import {
  calculateScenario5RuntimeResult,
  closeRuntimeEvidence,
  confirmRuntimeDecision,
  continueRuntimeAfterOutcome,
  createScenario5Runtime,
  isBeliefStage,
  isDecisionStage,
  isReasonStage,
  openRuntimeEvidence,
  selectRuntimeAction,
  submitRuntimeBelief,
  submitRuntimeReason,
} from "./scenario-five/model/runtime/index";
import type { RuntimeBeliefInput, Scenario5RuntimeResult, Scenario5RuntimeState } from "./scenario-five/model/runtime/index";
import {
  SCENARIO5_BRIEFING_FA,
  SCENARIO5_CORRIDOR_CONTENT_FA,
  SCENARIO5_ROUND_CONTENT_FA,
  SCENARIO5_ACTION_COPY_FA,
  SCENARIO5_STATUS_LABELS_FA,
  ScenarioFiveBeliefPanel,
  ScenarioFiveEvidencePanel,
  ScenarioFiveReasonPanel,
  assignScenario5Run,
  buildActionSelectedLogDetail,
  buildBeliefLogDetail,
  buildDecisionLogDetail,
  buildEvidenceLogDetail,
  buildOutcomeContinueLogDetail,
  buildReasonLogDetail,
  buildRunCompletedLogDetail,
  buildRunStartedLogDetail,
  buildScenario5OutcomeView,
  buildEvidenceSummary,
  buildScenario5PlayerView,
  getRuntimeAutoClosedEvidenceOpens,
  getScenario5TargetOptions,
  monotonicNow,
  readHiddenTabMs,
  resetHiddenTabTiming,
  startHiddenTabTiming,
  updateHiddenTabTiming,
} from "./scenario-five/ui/index";
import type { HiddenTabTimingState } from "./scenario-five/ui/index";
import { ScenarioFiveActionCard } from "./ScenarioFiveActionCard";
import { ScenarioFiveMap } from "./ScenarioFiveMap";
import { ScenarioFiveResourcePanel } from "./ScenarioFiveResourcePanel";
import { ScenarioFiveSummary } from "./ScenarioFiveSummary";
import { ScenarioFiveGlossary } from "./scenario-five/ui/ScenarioFiveGlossary";
import { ScenarioFiveOutcomePanel } from "./scenario-five/ui/ScenarioFiveOutcomePanel";
import type { ScenarioFiveBeliefStage } from "./scenario-five/ui/ScenarioFiveBeliefPanel";
import { buildStoredScenario5Outcome } from "./scenario-five/ui/presentation";
import { actionPreview, checkpointCorridors, ESCORT_COMPLETED, phaseNumber, reroutedCorridors } from "./scenario-five/ui/gameplayPresentation";
import { ScenarioFiveAccumulatedProgress, ScenarioFiveLastDecision, ScenarioFivePhaseHeader, ScenarioFivePhaseProgress, ScenarioFivePhaseSummary } from "./scenario-five/ui/ScenarioFiveProgress";
import { buildScenarioFiveHeader } from "./scenario-five/ui/phaseHeader";

interface ScenarioFiveSimulationProps {
  scenarioId: string | number;
  nodeId: string;
  userProfileId?: string;
  onCompletionUiActiveChange?: (active: boolean) => void;
  onComplete: () => void;
}

const ANALYTICS_SCENARIO_ID = "s5_silent_waves_redesign";

export const ScenarioFiveSimulation = ({
  scenarioId,
  nodeId,
  userProfileId,
  onCompletionUiActiveChange,
  onComplete,
}: ScenarioFiveSimulationProps) => {
  const [runtime, setRuntime] = useState<Scenario5RuntimeState | null>(null);
  const [result, setResult] = useState<Scenario5RuntimeResult | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<CorridorId | null>(null);
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Set<string>>(new Set());
  const [evidenceViewOpen, setEvidenceViewOpen] = useState(false);
  const [reviewLastOutcome, setReviewLastOutcome] = useState(false);
  const [phaseSummary, setPhaseSummary] = useState<'A'|'B'|'C'|null>(null);
  // Presentation snapshots never enter runtime state or telemetry. Held across pending reason stages.
  const preCommitEvidenceIdsRef = useRef<ReadonlySet<string>>(new Set());
  const investigationEvidenceIdsRef = useRef<ReadonlySet<string>>(new Set());
  const hiddenTimingRef = useRef<HiddenTabTimingState>(resetHiddenTabTiming());
  const completionLoggedRunRef = useRef<string | null>(null);
  const archiveAttemptRef = useRef<CognitiveAttempt | null>(null);
  const [archiveStatus, setArchiveStatus] = useState("");

  const log = useCallback((type: string, detail: Readonly<Record<string, unknown>>) => {
    eventLogger.log({
      type,
      scenarioId: ANALYTICS_SCENARIO_ID,
      nodeId,
      userId: userProfileId,
      detail: { ...detail },
    });
  }, [nodeId, userProfileId]);

  const view = useMemo(() => runtime ? buildScenario5PlayerView(runtime) : null, [runtime]);
  const selectedActionId = runtime?.currentSelectionHistory.at(-1)?.actionId ?? null;
  const selectedAction = selectedActionId ? getMissionAction(selectedActionId) : null;
  const targetOptions = runtime ? getScenario5TargetOptions(runtime) : [];
  const evidenceHighlightedCorridorId = view?.visibleEvidence.find(
    (evidence) => expandedEvidenceIds.has(evidence.evidenceId),
  )?.observedCorridorId ?? null;
  const highlightedCorridorId = selectedTarget
    ?? runtime?.pendingDecision?.selection.targetCorridorId
    ?? (runtime?.pendingDecision && getMissionAction(runtime.pendingDecision.selection.actionId).target === 'fixed_alpha' ? 'corridor_alpha_east' : null)
    ?? (runtime?.stage.stageId === 'outcome_review' ? runtime.domainDecisionRecords.at(-1)?.effectiveTargetCorridorId : null)
    ?? (selectedAction?.target === "fixed_alpha" ? "corridor_alpha_east" : null)
    ?? evidenceHighlightedCorridorId;
  const globalRoutePulse = selectedAction?.target === "none";
  const liveStageId = runtime?.stage.stageId;
  const outcomes = useMemo(() => runtime ? runtime.domainDecisionRecords.map((_, i) => buildStoredScenario5Outcome(runtime, i)) : [], [runtime]);
  const lastOutcome = outcomes.at(-1);
  const history = runtime?.domainDecisionRecords.map(r => ({actionId: r.actionId, effectiveTargetCorridorId: r.effectiveTargetCorridorId})) ?? [];

  useEffect(() => {
    setExpandedEvidenceIds(new Set());
    setEvidenceViewOpen(false);
    setReviewLastOutcome(false);
  }, [runtime?.stage.stageId]);

  useEffect(() => {
    if (!liveStageId || !isDecisionStage(liveStageId)) {
      hiddenTimingRef.current = resetHiddenTabTiming();
      return;
    }
    const initialAt = monotonicNow();
    hiddenTimingRef.current = startHiddenTabTiming(initialAt, typeof document !== "undefined" && document.hidden);
    const handleVisibility = () => {
      hiddenTimingRef.current = updateHiddenTabTiming(hiddenTimingRef.current, monotonicNow(), document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      hiddenTimingRef.current = resetHiddenTabTiming();
    };
  }, [liveStageId]);

  useEffect(() => {
    if (!runtime || runtime.stage.stageId !== "complete" || completionLoggedRunRef.current === runtime.runId) return;
    const completedResult = calculateScenario5RuntimeResult(runtime);
    completionLoggedRunRef.current = runtime.runId;
    setResult(completedResult);
    setArchiveStatus("در حال بررسی ذخیره گزارش شناختی…");
    void completionArchiveStatus(() => archiveS2Completion(archiveAttemptRef.current, runtime, completedResult)).then(setArchiveStatus);
    onCompletionUiActiveChange?.(true);
    log("s5_v3_run_completed", buildRunCompletedLogDetail(runtime, completedResult));
  }, [runtime, onCompletionUiActiveChange, log]);

  const startRun = () => {
    const epochStartedAt = Date.now();
    const assignment = assignScenario5Run(userProfileId, epochStartedAt);
    const next = createScenario5Runtime({
      runId: assignment.runId,
      worldId: assignment.worldId,
      seed: assignment.seed,
      startedAtMs: monotonicNow(),
    });
    archiveAttemptRef.current = null;
    setArchiveStatus("");
    try { archiveAttemptRef.current = beginCognitiveAttempt(userProfileId, scenarioId, next.runId); }
    catch (error) { setArchiveStatus(error instanceof Error ? error.message : "هویت تلاش برای آرشیو معتبر نیست."); }
    preCommitEvidenceIdsRef.current = new Set(next.evidence.map((item) => item.evidenceId));
    investigationEvidenceIdsRef.current = new Set();
    completionLoggedRunRef.current = null;
    setResult(null);
    setSelectedTarget(null);
    setExpandedEvidenceIds(new Set());
    setEvidenceViewOpen(false);
    setRuntime(next);
    log("s5_v3_run_started", buildRunStartedLogDetail(next));
  };

  const selectAction = (actionId: MissionActionId) => {
    if (!runtime) return;
    const next = selectRuntimeAction(runtime, actionId, monotonicNow());
    if (selectedActionId !== actionId) setSelectedTarget(null);
    setRuntime(next);
    log("s5_v3_action_selected", buildActionSelectedLogDetail(next, actionId));
  };

  const openEvidence = (evidenceId: string) => {
    if (!runtime || !isDecisionStage(runtime.stage.stageId)) return;
    const next = openRuntimeEvidence(runtime, evidenceId, monotonicNow());
    setRuntime(next);
    setExpandedEvidenceIds((current) => new Set(current).add(evidenceId));
    log("s5_v3_evidence_opened", buildEvidenceLogDetail(next, evidenceId));
  };

  const closeEvidence = (evidenceId: string) => {
    if (!runtime || !isDecisionStage(runtime.stage.stageId)) return;
    const next = closeRuntimeEvidence(runtime, evidenceId, monotonicNow());
    const dwell = [...next.evidenceOpens].reverse().find((item) => item.evidenceId === evidenceId)?.activeDwellMs;
    setRuntime(next);
    setExpandedEvidenceIds((current) => {
      const copy = new Set(current);
      copy.delete(evidenceId);
      return copy;
    });
    log("s5_v3_evidence_closed", buildEvidenceLogDetail(next, evidenceId, dwell));
  };

  const confirmDecision = () => {
    if (!runtime || !selectedActionId || !selectedAction) return;
    if (selectedAction.target === "required" && !selectedTarget) return;
    if (!view || !actionPreview(view, selectedActionId, selectedTarget).valid) return;
    const confirmedAtMs = monotonicNow();
    const hiddenTabMs = readHiddenTabMs(hiddenTimingRef.current, confirmedAtMs);
    const selection: MissionActionSelection = {
      actionId: selectedActionId,
      ...(selectedAction.target === "required" && selectedTarget ? { targetCorridorId: selectedTarget } : {}),
    };
    preCommitEvidenceIdsRef.current = new Set(view?.visibleEvidence.map((item) => item.evidenceId));
    const before = runtime;
    const next = confirmRuntimeDecision(before, selection, confirmedAtMs, hiddenTabMs);
    const autoClosedEvidence = getRuntimeAutoClosedEvidenceOpens(before, next);
    setRuntime(next);
    setSelectedTarget(null);
    setExpandedEvidenceIds(new Set());
    setEvidenceViewOpen(false);
    for (const closed of autoClosedEvidence) {
      log("s5_v3_evidence_closed", buildEvidenceLogDetail(next, closed.evidenceId, closed.activeDwellMs));
    }
    if (next.decisions.length > before.decisions.length) {
      log("s5_v3_decision", buildDecisionLogDetail(next));
    }
  };

  const submitBelief = (input: Omit<RuntimeBeliefInput, "recordedAtMs">) => {
    if (!runtime) return;
    const next = submitRuntimeBelief(runtime, { ...input, recordedAtMs: monotonicNow() });
    if (next.stage.stageId === "decision:A2_evidence_acquisition") {
      investigationEvidenceIdsRef.current = new Set(next.evidence.map((item) => item.evidenceId));
    }
    if (next.stage.stageId === "decision:B1_monitoring_allocation") setPhaseSummary('A');
    if (next.stage.stageId === "decision:D1_crisis_response") setPhaseSummary('C');
    setRuntime(next);
    log("s5_v3_belief", buildBeliefLogDetail(next, next.beliefs.at(-1)!));
  };

  const submitReason = (reasonId: ReasonId) => {
    if (!runtime) return;
    const next = submitRuntimeReason(runtime, reasonId, monotonicNow());
    setRuntime(next);
    log("s5_v3_reason", buildReasonLogDetail(next, next.reasons.at(-1)!));
    log("s5_v3_decision", buildDecisionLogDetail(next));
  };

  const continueOutcome = () => {
    if (!runtime || runtime.stage.stageId !== "outcome_review") return;
    const outcome = buildScenario5OutcomeView(runtime);
    const next = continueRuntimeAfterOutcome(runtime, monotonicNow());
    if (outcome.roundId === 4) setPhaseSummary('B');
    setRuntime(next);
    log("s5_v3_outcome_continue", buildOutcomeContinueLogDetail(next, outcome.roundId, next.stage.stageId));
  };

  const finish = () => {
    onCompletionUiActiveChange?.(false);
    onComplete();
  };

  if (!runtime) {
    return (
      <main className="s5-root s5-briefing" dir="rtl">
        <section className="s5-briefing-card">
          <CognitiveArchiveDisclosure />
          <span>{SCENARIO5_BRIEFING_FA.heading}</span>
          <h1>{SCENARIO5_BRIEFING_FA.title}</h1>
          <div className="s5-briefing-scroll">
            <div className="s5-briefing-body"><h2>وضعیت</h2><p>{SCENARIO5_BRIEFING_FA.situation}</p></div>
            <div className="s5-briefing-columns">
              <section><h2>آنچه می‌دانید</h2><ul>{SCENARIO5_BRIEFING_FA.known.map((text) => <li key={text}>{text}</li>)}</ul></section>
              <section><h2>آنچه هنوز نمی‌دانید</h2><ul>{SCENARIO5_BRIEFING_FA.unknown.map((text) => <li key={text}>{text}</li>)}</ul></section>
            </div>
            <section className="s5-briefing-body"><h2>قاعده تصمیم</h2><p>{SCENARIO5_BRIEFING_FA.decisionRule}</p></section>
            <p className="s5-method-note">افق مأموریت ۳۶۰ دقیقه؛ هشت تصمیم در چهار فاز. {SCENARIO5_BRIEFING_FA.timeClarification}</p>
            <p className="s5-method-note">اطلاعات موقعیت، مسیر و زمان (PNT) از جمله از ناوبری ماهواره‌ای (GNSS/GPS) دریافت می‌شود. ظرفیت پایش و اطلاعات (ISR) و ذخیره پشتیبانی ابزارهای شما برای پیگیری مأموریت‌اند.</p>
            <ScenarioFiveGlossary inline />
          </div>
          <button type="button" className="s5-primary-button" onClick={startRun}>{SCENARIO5_BRIEFING_FA.button}</button>
        </section>
      </main>
    );
  }

  if (runtime.stage.stageId === "complete" && result) {
    return <>{archiveStatus && (!archiveAttemptRef.current || archiveAttemptRef.current.userProfileId === userProfileId) && <p role="status" dir="rtl" data-cognitive-archive-status>{archiveStatus}</p>}<ScenarioFiveSummary runtimeState={runtime} result={result} onComplete={finish} /></>;
  }

  if (!view) return null;
  const outcome = runtime.stage.stageId === "outcome_review" ? buildScenario5OutcomeView(runtime) : null;
  const evidenceSummaries = view.visibleEvidence.map(buildEvidenceSummary);
  const newEvidence = evidenceSummaries.filter((item) => !preCommitEvidenceIdsRef.current.has(item.evidenceId));
  const recentInvestigationIds = new Set(evidenceSummaries.filter((item) => !investigationEvidenceIdsRef.current.has(item.evidenceId)).map((item) => item.evidenceId));
  const reasonContext = runtime.pendingDecision ? {
    actionId: runtime.pendingDecision.selection.actionId,
    targetCorridorId: runtime.pendingDecision.selection.targetCorridorId
      ?? (getMissionAction(runtime.pendingDecision.selection.actionId).target === "fixed_alpha" ? "corridor_alpha_east" : null),
  } : null;
  const preview = selectedActionId ? actionPreview(view, selectedActionId, selectedTarget) : null;
  const canPickTarget = isDecisionStage(runtime.stage.stageId) && selectedAction?.target === 'required' && !phaseSummary && !reviewLastOutcome;
  const header = buildScenarioFiveHeader(view, reviewLastOutcome ? null : phaseSummary);

  return (
    <main className="s5-root s5-live-shell" dir="rtl">
      <header className={`s5-command-bar${header.reviewing ? ' s5-phase-review' : ''}`}>
        <ScenarioFivePhaseHeader header={header} />
        <ScenarioFiveResourcePanel resources={view.resources} />
        <ScenarioFiveGlossary />
        <ScenarioFivePhaseProgress header={header} />
        <div className="s5-recent-action-slot">
          {lastOutcome ? <ScenarioFiveLastDecision outcome={lastOutcome} onReview={() => setReviewLastOutcome(true)} /> :
            <aside className="s5-last-decision s5-no-last-decision"><strong>آخرین تصمیم</strong><span>هنوز تصمیمی اجرا نشده است؛ پیامد اقدام شما اینجا نمایش داده می‌شود.</span></aside>}
        </div>
      </header>

      <div className="s5-workspace">
        <section className="s5-control-pane" aria-label="پنل تعامل مأموریت">
          {view.phaseId !== 'A' && <ScenarioFiveAccumulatedProgress view={view} history={history} />}
          <div className="s5-stage-body" hidden={reviewLastOutcome || phaseSummary !== null}>
          {isDecisionStage(runtime.stage.stageId) && view.roundId && (evidenceViewOpen ? (
            <div className="s5-local-evidence-view">
              <ScenarioFiveEvidencePanel
                evidence={view.visibleEvidence}
                interactive
                expandedEvidenceIds={expandedEvidenceIds}
                onOpen={openEvidence}
                onClose={closeEvidence}
              />
              <footer className="s5-control-footer"><button type="button" className="s5-secondary-button s5-back-to-decision" onClick={() => setEvidenceViewOpen(false)}>بازگشت به تصمیم</button></footer>
            </div>
          ) : (
            <section className="s5-panel s5-decision-panel">
              <div className="s5-control-scroll" tabIndex={0} aria-label="گزینه‌های تصمیم">
              <div className="s5-section-heading"><div><span>راند {view.roundId} · پنجره تصمیم</span><h2>{SCENARIO5_ROUND_CONTENT_FA[view.roundId].problem}</h2></div></div>
              <div className="s5-action-grid">{view.availableActionIds.map((actionId) => (
                <ScenarioFiveActionCard key={actionId} actionId={actionId} selected={selectedActionId === actionId} onSelect={() => selectAction(actionId)} />
              ))}</div>
              <p className="s5-availability-note">گزینه‌ها بر اساس منابع و وضعیت قابل مشاهده فعلی‌اند.</p>
              {selectedAction?.target === "required" && (
                <label className="s5-target-picker">انتخاب کریدور هدف
                  <select value={selectedTarget ?? ""} onChange={(event) => setSelectedTarget((event.target.value || null) as CorridorId | null)}>
                    <option value="" disabled>هیچ هدفی از پیش انتخاب نشده است</option>
                    {targetOptions.map((corridorId) => <option key={corridorId} value={corridorId}>{SCENARIO5_CORRIDOR_CONTENT_FA[corridorId].targetLabel}{view.convoys.find((convoy) => convoy.corridorId === corridorId)?.status === "compromised" ? ` — ${SCENARIO5_STATUS_LABELS_FA.compromised}` : ""}</option>)}
                  </select>
                </label>
              )}
              {selectedAction?.target === "fixed_alpha" && <p className="s5-fixed-target">کاروان الف به دلیل اولویت مأموریتی هدف این اقدام است؛ این اولویت به معنی مشکوک‌تر بودن این کریدور نیست.</p>}
              {preview?.valid && selectedActionId && <aside className="s5-action-preview"><h3>اگر این اقدام را اجرا کنید</h3>
                <p>ظرفیت پایش و اطلاعات (ISR): <bdi dir="ltr">{preview.isrBefore} → {preview.isrAfter}</bdi> · پشتیبانی: <bdi dir="ltr">{preview.supportBefore} → {preview.supportAfter}</bdi></p>
                <p>زمان اجرای اقدام: {preview.duration} دقیقه · {preview.final ? 'ادامه مأموریت تا افق T+360 دقیقه' : `زمان تا ارزیابی بعدی: ${preview.assessment} دقیقه`}</p>
                <p>هدف: {preview.effectiveTarget ? SCENARIO5_CORRIDOR_CONTENT_FA[preview.effectiveTarget].targetLabel : 'کل شبکه / بدون هدف انتخابی'}</p>
                <p>{SCENARIO5_ACTION_COPY_FA[selectedActionId].knownEffect}</p>
              </aside>}
              {view.roundId === 6 && <p className="s5-method-note">منابع محدودند و نحوه مصرف آنها بر ظرفیت باقی‌مانده، تاب‌آوری و نتیجه مأموریت اثر می‌گذارد.</p>}
              </div>
              <footer className="s5-control-footer s5-decision-actions">
                <button type="button" className="s5-primary-button" disabled={!preview?.valid} onClick={confirmDecision}>تأیید تصمیم</button>
                <button type="button" className="s5-secondary-button s5-evidence-access" onClick={() => setEvidenceViewOpen(true)}>شواهد موجود ({view.visibleEvidence.length})</button>
              </footer>
            </section>
          ))}

          {isBeliefStage(runtime.stage.stageId) && <ScenarioFiveBeliefPanel key={runtime.stage.stageId} stageId={runtime.stage.stageId as ScenarioFiveBeliefStage} evidence={evidenceSummaries} recentEvidenceIds={recentInvestigationIds} previousBelief={runtime.beliefs.at(-1)} onSubmit={submitBelief} />}
          {isReasonStage(runtime.stage.stageId) && reasonContext && <ScenarioFiveReasonPanel key={runtime.stage.stageId} context={reasonContext} evidence={evidenceSummaries} onSubmit={submitReason} />}
          {outcome && <ScenarioFiveOutcomePanel outcome={outcome} newEvidence={newEvidence} onContinue={continueOutcome} />}
          </div>
          {reviewLastOutcome && lastOutcome && <ScenarioFiveOutcomePanel outcome={lastOutcome} review onContinue={() => setReviewLastOutcome(false)} />}
          {phaseSummary && !reviewLastOutcome && <ScenarioFivePhaseSummary phase={phaseSummary} outcomes={outcomes.filter(o => o.roundId > (phaseNumber(phaseSummary)-1)*2 && o.roundId <= phaseNumber(phaseSummary)*2)} view={view} onContinue={() => setPhaseSummary(null)} />}
        </section>

        <div className="s5-map-pane">
          <ScenarioFiveMap
            key={runtime.runId}
            convoys={view.convoys}
            worldClockMinutes={view.resources.worldClockMinutes}
            highlightedCorridorId={highlightedCorridorId}
            globalRoutePulse={globalRoutePulse}
            evidence={evidenceSummaries}
            legalTargets={canPickTarget ? targetOptions : []}
            onSelectTarget={canPickTarget ? setSelectedTarget : undefined}
            reroutes={reroutedCorridors(history)}
            checkpoints={checkpointCorridors(history)}
            expiredEscortCorridors={runtime.stage.stageId === 'outcome_review' ? [] : lastOutcome?.convoyChanges.filter(c => c.expiredMitigations.length || c.newMitigations.includes(ESCORT_COMPLETED)).map(c => c.corridorId)}
          />
        </div>
      </div>

    </main>
  );
};
