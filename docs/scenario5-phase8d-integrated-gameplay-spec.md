# Scenario 2 / Phase 08D implementation

The active product remains object **id=5**, displayed as **سناریو ۲ — امواج خاموش**. Internal identities remain `s5_silent_waves_redesign`, `s5_gnss_logistics_simulation`, and the existing `s5_*` model/telemetry names. `src/App.tsx`, inactive id=2, and the legacy ScenarioTwo implementation are unchanged.

This phase changes presentation. It preserves all 16 worlds, assignment/seed logic, four convoys, mission constants, 33 actions, costs/durations/targets, Actor/evidence behavior, runtime ordering, Cognitive V3, domain formulas, and calibration/archive data. No scientific file was edited. The preimplementation baseline records byte hashes and 112 deterministic complete runs before UI edits.

## Implemented experience

- A bounded RTL console keeps header, phase progress, resources, evidence count and map visible. The left stage body scrolls; its action footer remains reachable. Required targets share local state between SVG routes/markers, convoy-card controls and the left selector. Delivered targets are disabled; compromised targets remain legal; fixed-alpha actions cannot retarget.
- Convoy cards expose cargo, route, status, health, arrival, deadline, exact margin, cumulative delay and current mitigation text. Marker progress remains the original monotonic presentation function, including origin separation and delivered-at-destination behavior.
- Every action uses catalog costs and timing. A deterministic preview shows only resources, duration, assessment interval, scope and approved known effect. R8 explains action duration, the existing 20-minute baseline, and passive continuation to T+360 separately.
- Outcome contains executed action, fresh information, observed before/after changes and the new state. A persistent strip reopens the immutable stored outcome without advancing runtime or discarding a partially entered belief.
- Map reroutes derive only from committed visible action history. Checkpoint geometry additionally requires an actual checkpoint-action history and current route hardening; rerouting alone never implies checkpoints. Fallback/ground/escort displays derive from safe current flags. Evidence-count pulses last 1500 ms. Hold explains the completed short stop without creating a persistent held state.
- Beliefs retain null semantic defaults and require all four answers. Previous belief is read-only reference. Seven existing reasons remain unchanged and execute the pending decision only on submission.
- Local summaries after A, B and C reveal the already-next runtime stage. A/B boundaries follow the post-investigation belief / R4 outcome respectively; C follows its belief checkpoint. No new runtime stage or telemetry event is added.
- From B onward an expandable factual progress panel is available on all live stages. It reports evidence coverage, mitigation/action history, reroutes and current resources.
- Mission ending precedes deterministic explanation, eight-decision trace, resources/evidence story, hidden truth and belief timeline. The final entry action opens the existing compatibility report. No new cognitive dashboard is implemented.

## Component map

| File | Responsibility |
| --- | --- |
| `ScenarioFiveSimulation.tsx` | Existing runtime integration; local target/review/phase-summary state; safe header |
| `ScenarioFiveMap.tsx` | Existing marker motion; selectable legal targets; visible reroutes/checkpoints/evidence and convoy cards |
| `ScenarioFiveActionCard.tsx`, `ScenarioFiveResourcePanel.tsx` | Catalog timing and canonical resources |
| `ScenarioFiveTypes.ts` | Presentation-only outcome fields; no runtime/shared scientific type changes |
| `scenario-five/ui/presentation.ts` | Safe view and immutable committed-outcome projection |
| `scenario-five/ui/gameplayPresentation.ts` | Pure timing/preview/margin/mitigation/reroute helpers |
| `scenario-five/ui/ScenarioFiveProgress.tsx` | Last-decision strip, accumulated progress and local phase summary |
| `scenario-five/ui/endingPresentation.ts` | Exact new ending titles, complete-only resolver facts, continuity rows and deterministic turning points; historical compatibility titles remain unchanged |
| `scenario-five/ui/ScenarioFiveMissionEnding.tsx` | Mission ending and AAR flow |
| Existing belief/reason/outcome panels and `uiContentFa.ts` | Approved Persian copy and stage content |
| `ScenarioFiveSummary.tsx` | Entry to the new ending; existing report remains behind explicit entry |
| `ScenarioFive.css` | Scenario-scoped layout, keyboard focus, map feedback and reduced motion |
| `src/scenarios/s5_silent_waves_redesign/tree.ts` | Only active S5 outer-end copy, replacing unsupported ambush-risk wording |

## Verification and limits

The phase-specific verifier, scientific parity, six witnesses, real browser checks, typecheck, build and scoped ESLint pass. See the numeric, ending and parity documents and the screenshot inspection manifest for evidence. Historical verifiers are executed unchanged. Their obsolete UI snapshots/archive hashes and protected-file-count assumptions are reported as failures; they are not relabelled as passes or weakened. Therefore the strict all-verifiers-green acceptance gate is **FAIL**, even though the new implementation checks and frozen scientific parity pass.

No later phase is started. The existing unrelated `docs/thesis-evidence/` directory is excluded from this delivery.
