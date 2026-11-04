# Phase 09C-0 — current routing and data availability

Status: read-only extraction after the complete 08D.2 header fix. No dashboard implementation, metric choice or design proposal is part of this delivery.

## Actual released routing

App maps released object id=4 to player Scenario 1 / `s4_redesigned_scenario_one`, and id=5 to player Scenario 2 / `s5_silent_waves_redesign` (`src/App.tsx:183–190,303–337`). ScenarioRunner's mini-game branch (`ScenarioRunner.tsx:534`) delegates to MiniGameHost. The S4 game route at `MiniGameHost.tsx:649` renders ScenarioFourRedesignedScenarioOne; the S5 branch renders ScenarioFiveSimulation. The existing App user-analytics route is `renderAdminAnalytics`, not either scenario's summary. App routing itself was not modified for 08D.2 or for this audit.

## S5 completion → existing compatibility report

1. R8 decision is confirmed and its normal outcome is shown. Outcome continuation advances the canonical runtime using existing runtimeEngine/stageMachine behavior. Local 08D.2 phase-review headers only apply after A/B/C; they do not create a completion stage.
2. On reaching runtime stage `complete`, `ScenarioFiveSimulation.tsx:146–152` calculates `calculateScenario5RuntimeResult(runtime)`, stores it as local result, enables completion UI and logs `s5_v3_run_completed` once. The result is not calculated from DOM labels or global App analytics.
3. The complete branch passes **the same `runtimeState` and `result`** to `ScenarioFiveSummary` (see source excerpt below). `ScenarioFiveSummary.tsx:57–63` initializes `compatibilityOpen=false`, then renders `ScenarioFiveMissionEnding state={runtimeState} result={result}`.
4. Mission Ending → «چرا این پایان؟» / Why This Ending → decision trace → hidden truth/belief timeline are sections/anchors of the same completion screen, not successive runtime decisions. `ScenarioFiveMissionEnding.tsx` requires complete state; ending content is built from `endingPresentation.ts` and guarded AAR presentation. These post-game mission sections are separate from `result.cognitive`.
5. The footer button **«مشاهده الگوی تصمیم‌گیری»** calls `onCognitiveEntry` (`ScenarioFiveMissionEnding.tsx:77`; exact code below). The current callback in `ScenarioFiveSummary.tsx:63` sets `compatibilityOpen=true` and scrolls to top. This exposes the existing compatibility report, whose cognitive section is at 175–193. Its other mission/domain/AAR sections remain mixed in that existing report.
6. The compatibility back button sets the local flag false. Exit/completion delegates `onComplete` to the parent host/runner. There is no separate report route, selected-run query, network request or cross-user lookup in this summary.

The **existing attachment boundary** is the `onCognitiveEntry` prop and the `compatibilityOpen` conditional in `ScenarioFiveSummary`. At that boundary the current-run `Scenario5RuntimeResult`, `result.cognitive`, `result.domain`, `result.missionEndState` and completed runtimeState are already available as typed component props. This identifies the actual seam only; no change, component design or new metric is proposed or implemented.

## Current consumers and truth boundaries

| Consumer | Actual data source | Boundary |
|---|---|---|
| S5 Mission Ending/why/trace/truth | completed runtime mission state, result.missionEndState/domain, endingPresentation and buildScenario5AarView | Post-game domain/truth/actor explanations; not a cognitive score view. |
| S5 compatibility cognitive section | lexical `cognitive = result.cognitive`, exact exported S5 cognitive schema | Current-run Cognitive V3 adapter result, 31 rendered metric leaves, 9 metadata leaves available. |
| Released Scenario 1 cognitive dashboard | finalSnapshot.cognitiveScoresV3, S4 calculateCognitiveModelV3 | Run-specific S4 model; distinct schema/calculation from S5. |
| General App analytics | eventLogger events → buildInsights/buildCognitiveInsights | Generic scored-quiz/minigame heuristics. Does not read either V3 result. |
| General App «سناریو ۱» subsection | legacy s1_cognitive_summary/s1_decision for s1_shadows_low_orbit | Legacy internal id=1, not released id=4. |

`model/runtime/telemetryAdapter.ts:42` builds the S5 cognitive bundle from whitelisted public telemetry. Its evidence copy does not include hidden provenance, true actor, hidden world resources or true affected corridor. Pure cognitive scoring reads this bundle and versioned option/reason profiles. By contrast, `model/runtime/domainMetrics.ts` compares belief corridor correctness to hidden trueWorldState in gnssPntAssessment, and post-completion AAR exposes mission/actor truth. `ui/presentation.ts:299` guards completion before building AAR. `buildRunCompletedLogDetail` at 261 includes post-game truth identifiers alongside cognitive/domain results; this is a completion log, not a live cognitive input. No hidden truth was passed into a live dashboard during this audit and no raw hidden fields were captured in screenshots.

## Run identity, persistence and fallback facts

S5 assignment is `assignScenario5Run` (`ui/runAssignment.ts:23–36`): assignment key `${userProfileId ?? 'anonymous'}|${epoch}|s5-v3`, deterministic FNV world/seed, runId `s5-${epoch}-${worldHashHex8}`. World and seed selection occur before gameplay. The cognitive bundle/result retains the runId. Completion result requires stage complete (`model/runtime/domainMetrics.ts`, calculateScenario5RuntimeResult); domain metrics also require completed mission and exactly eight decision records. This is not a nullable partial-run report endpoint.

S5 runtime/result/compatibility flag are component state. No localStorage-based runtime/result restoration is implemented in this path. Reload returns App's normal initial view and loses the visible in-memory summary; a persisted event containing the result is not itself used to reopen the summary. `eventLogger.ts:36` stores events at `space-war.analytics.events`; malformed/non-array storage loads as empty, and a storage failure sets its existing error. On log, active userContext ID/name/role overrides supplied event identity where present. Existing analytics therefore has user association, while `ScenarioFiveSummary` receives a current-run result directly and does not choose another scenario/user as fallback.

S4 stores unscoped RUN_KEY and snapshot keys in localStorage. It reuses only the run identifier on mount; UI phase/decisions/result initialize anew. There is no implemented report-phase rehydration from its saved final snapshot. This differs from global App log persistence and from S5 in-memory completion state. The audit did not alter persistence.

The App analytics user filter defaults to all; a selected user restricts by event.userId. Its synthetic run grouping uses scenarioId and event start/end/exit times, not detail.runId. A missing selected run yields all events within the current user scope, and overview ignores run selection. With 'all users', the scenario-run selector is disabled. A completely open run without end/exit is not appended to the synthetic list. These are current scope/fallback facts; no new guard is suggested here. The browser screenshots explicitly selected the existing test-player, so they do not display another user's records.

## Observed S4 vs S5 differences (no harmonization)

| Aspect | Released Scenario 1 / S4 | Released Scenario 2 / S5 |
|---|---|---|
| Contract | CognitiveModelV3Result, S4 versions s4-cog-v3 / 3.0.0 | Scenario5CognitiveRunResult, S5 adapter/version metadata listed in contract |
| Structure | Three moves, nine core decisions; auxiliary telemetry may add rows | Four phases, eight expected decision windows |
| OSI | Per-window relative adjustment then diagnostic-weighted per-move means; requires each move's expected core inputs for its move score; overall requires all three moves | Equal within-phase means then all-four-phase overall; A2 excluded; no diagnostic weight field in result |
| Strengths/integration | Weighted profile strengths; S4 harmonic helper returns 0 for zero sum | Phase-balanced strengths; zero-sum integration returns null |
| Dispersion | Requires complete three moves; includes interpretation/dispersionLabel/markerPercent | Population SD with >=2 available phases; numeric only |
| Constructs | Twelve scores incl measured informationDiscipline and coalitionOrientation; risk rescaled in player bars | Eleven properties: nine measured 0–100 constructs, signed risk and always-null informationDiscipline; no coalitionOrientation |
| Resource score | Direct user-spend shadow baseline; penalty below 20% baseline, max .30; actor recovery excluded from that accounting | All eight visible before/after resources required, final ISR/support<=5 each penalizes .05 |
| Multi-domain score | Seven-domain entropy times min(1,total/3.5) | Nine-domain entropy times total/9 |
| Coherence | Existing S4 reason/cross rules and weights | Existing S5 reason-alignment functions and B/C/D cross matrices, >=2 eligible phases |
| Trace/quality output | perWindow, missingReasons, responseProcess and ERU audit in result; admin disclosures | No corresponding returned trace/flags/missingReasons fields; raw telemetry is available separately |
| Presentation | CSS spectrum, 12 bars, times shown in seconds, resource/attribution paths | Existing compatibility report renders text/cards, times in ms and signed raw risk |

These differences are sourced from S4 `model/cognitiveEngineV3.ts:249–395` and S5 `model/cognitive/cognitiveEngine.ts:143–455`, plus the actual renderers. Neither model is reinterpreted as the other. S5 per-decision stored contribution output is **NOT_AVAILABLE**, notwithstanding exported pure adjustment helpers. No new threshold, classification, aggregation or visualization is selected in this audit.

## Evidence and read-only verification

Seven genuine 1440×900 images and actual DOM inspection are in `scenario5-phase09c0-scenario1-screenshots/`. Active-S4 final report/dashboard and global dashboard were reachable through the existing test-player flow and existing admin test login. No new fixtures or private-user records were used. Conditional legacy charts are documented from source and were not simulated for screenshots.

`scenario5-phase09c0-audit-status.json` records the git status, working diff digest, index diff digest and SHA-256 hashes of 829 pre-existing tracked/untracked nonignored files at the B boundary (after A was complete). Its final comparison verifies every original file stayed byte-identical and all newly created paths are exclusively the six permitted audit artifact paths/directories. The A patch and verification artifacts remain separate. This audit ends at extraction; no 09C dashboard implementation has begun.

## Literal integration source excerpts

`src/ui/components/scenario/ScenarioFiveSimulation.tsx:139`

```tsx
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
    onCompletionUiActiveChange?.(true);
    log("s5_v3_run_completed", buildRunCompletedLogDetail(runtime, completedResult));
  }, [runtime, onCompletionUiActiveChange, log]);

  const startRun = () => {
    const epochStartedAt = Date.now();
    const assignment = assignScenario5Run(userProfileId, epochStartedAt);
```

`src/ui/components/scenario/ScenarioFiveSimulation.tsx:278`

```tsx
            <p className="s5-method-note">اطلاعات موقعیت، مسیر و زمان (PNT) از جمله از ناوبری ماهواره‌ای (GNSS/GPS) دریافت می‌شود. ظرفیت پایش و اطلاعات (ISR) و ذخیره پشتیبانی ابزارهای شما برای پیگیری مأموریت‌اند.</p>
            <ScenarioFiveGlossary inline />
          </div>
          <button type="button" className="s5-primary-button" onClick={startRun}>{SCENARIO5_BRIEFING_FA.button}</button>
        </section>
      </main>
    );
  }

  if (runtime.stage.stageId === "complete" && result) {
    return <ScenarioFiveSummary runtimeState={runtime} result={result} onComplete={finish} />;
  }

  if (!view) return null;
  const outcome = runtime.stage.stageId === "outcome_review" ? buildScenario5OutcomeView(runtime) : null;
  const evidenceSummaries = view.visibleEvidence.map(buildEvidenceSummary);
  const newEvidence = evidenceSummaries.filter((item) => !preCommitEvidenceIdsRef.current.has(item.evidenceId));
```

`src/ui/components/scenario/ScenarioFiveSummary.tsx:49`

```tsx
  runtimeState,
  result,
  onComplete,
}: {
  runtimeState: Scenario5RuntimeState;
  result: Scenario5RuntimeResult;
  onComplete: () => void;
}) => {
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);
  const aar = buildScenario5AarView(runtimeState, result);
  const { domain, cognitive } = result;
  const alpha = domain.criticalDelivery;
  const phaseNames = ["A", "B", "C", "D"] as const;
  const reasonByPhase = new Map(runtimeState.reasons.map((reason) => [reason.phaseId, reason.reasonId]));
  if (!compatibilityOpen) return <ScenarioFiveMissionEnding state={runtimeState} result={result} onCognitiveEntry={() => { setCompatibilityOpen(true); window.scrollTo(0,0); }} onComplete={onComplete} />;
  return (
    <main className="s5-root s5-aar" dir="rtl">
      <button type="button" className="s5-secondary-button" onClick={() => setCompatibilityOpen(false)}>بازگشت به گزارش مأموریت</button>
      <header className="s5-aar-header">
        <span>گزارش پس از اقدام</span>
        <h1>امواج خاموش — تحلیل اجرای مأموریت</h1>
        <p>این گزارش، یک تحلیل پس از اقدام برای همین اجرای سناریو است. شاخص‌های شناختی زیر پروکسی‌های رفتاری وابسته به موقعیت‌اند و نمره هوش، شخصیت، توانایی ثابت یا کیفیت کلی فرد نیستند. وزن‌ها و کدگذاری‌های شناختی نسخه فعلی هنوز در انتظار اعتبارسنجی خبرگان و کاربران انسانی‌اند.</p>
      </header>

```

`src/ui/components/scenario/scenario-five/ui/ScenarioFiveMissionEnding.tsx:68`

```tsx
      <p>وضعیت نهایی عامل مقابل: {{covert:'پنهان',probing:'آزمودن واکنش',committed:'درگیر',disengaging:'کاهش درگیری'}[audit.truth.finalActorPosture] ?? audit.truth.finalActorPosture}</p>
      <p>انتساب عملیاتی: {attribution} · مهار اختلال: {aar.end.threatContained ? 'بله' : 'خیر'}</p>
      <details><summary>حقیقت منشأ شواهد</summary>{audit.evidenceAudit.map(({evidence,hiddenProvenance,opened}) => <p key={evidence.evidenceId}><bdi dir="ltr">{evidence.evidenceId}</bdi> — {SCENARIO5_SOURCE_LABELS_FA[evidence.sourceType]}؛ {SCENARIO5_PROVENANCE_LABELS_FA[hiddenProvenance] ?? hiddenProvenance}؛ {opened ? 'جزئیات باز شد' : 'جزئیات باز نشد'}{aar.lateEvidenceIds.includes(evidence.evidenceId) && '؛ پس از برآورد نهایی دریافت شد'}</p>)}</details>
      <details><summary>اطلاعات پژوهش و بازپخش</summary><p>جهان: <code dir="ltr">{audit.truth.worldId}</code> · بذر: {audit.truth.seed}</p><p>واکنش نهایی: <code dir="ltr">{audit.truth.lastReactionId ?? '—'}</code></p></details>
    </section>
    <section id="s5-belief-timeline" className="s5-panel s5-aar-section" data-aar-section="belief"><h2>مسیر برداشت شما</h2>
      {state.beliefs.map(b=><article className="s5-trace-card" key={b.checkpointId}><h3>{SCENARIO5_BELIEF_COPY_FA[`belief:${b.checkpointId}`].title}</h3><p>{SCENARIO5_CORRIDOR_CONTENT_FA[b.mostLikelyCorridorId].corridorLabel} · اطمینان کریدور: {b.corridorConfidence} · برآورد اخلال هدفمند: {b.targetedInterferenceEstimate} · اطمینان برآورد: {b.targetedInterferenceConfidence}</p><p>شواهد در دسترس آن زمان: {b.visibleEvidenceIdsAtCheckpoint.length} · مقایسه با کریدور واقعی: {b.mostLikelyCorridorId===audit.truth.primaryAffectedCorridorId ? 'یکسان' : 'متفاوت'}</p></article>)}
      <p>شواهدی که پس از برآورد نهایی رسیدند در برداشت‌های ثبت‌شده وارد نمی‌شوند.</p>
    </section>
    <footer className="s5-ending-actions"><button type="button" className="s5-secondary-button" onClick={onCognitiveEntry}>مشاهده الگوی تصمیم‌گیری</button> <button type="button" className="s5-primary-button" onClick={onComplete}>ثبت پایان و بازگشت</button></footer>
  </main>;
};

```

`src/ui/components/scenario/scenario-five/ui/runAssignment.ts:20`

```tsx

export const CANONICAL_SCENARIO5_WORLD_IDS = WORLD_CATALOG.map(({ worldId }) => worldId);

export function assignScenario5Run(userProfileId: string | undefined, epochStartedAt: number): Scenario5RunAssignment {
  const assignmentKey = `${userProfileId ?? "anonymous"}|${epochStartedAt}|s5-v3`;
  const worldHash = fnv1a32(`${assignmentKey}|world`);
  const seedHash = fnv1a32(`${assignmentKey}|seed`);
  const worldId = CANONICAL_SCENARIO5_WORLD_IDS[worldHash % CANONICAL_SCENARIO5_WORLD_IDS.length];
  if (!worldId) throw new Error("Scenario 5 canonical world catalog is empty");
  return {
    assignmentKey,
    worldId,
    seed: seedHash === 0 ? 1 : seedHash,
    runId: `s5-${epochStartedAt}-${worldHash.toString(16).padStart(8, "0")}`,
    epochStartedAt,
  };
}

```
