# Scenario 5 Phase 07C — Single-window Map Motion UI Verification

## Completion and scope

Phase 07C is complete. This was a presentation-only change to the Scenario 5 player UI. No mission, model, Actor/adjudication, cognitive, runtime, domain-metric, scoring, timing, resource, or calibration parameter was changed. Phase 8B was not started.

The live mission now uses one bounded desktop console: compact command resources at the top, controls physically on the left, and the operational map physically on the right. Decision actions use a 2×2 grid. Evidence replaces the decision content locally in the left pane and returns without clearing the selected decision. Belief and reason capture remain in the same left pane. Outcome review is an overlay inside the console. The completed AAR remains intentionally scrollable.

## Presentation files

- `src/ui/components/scenario/ScenarioFiveSimulation.tsx`
- `src/ui/components/scenario/ScenarioFiveMap.tsx`
- `src/ui/components/scenario/ScenarioFiveActionCard.tsx`
- `src/ui/components/scenario/ScenarioFiveResourcePanel.tsx`
- `src/ui/components/scenario/ScenarioFive.css`
- `scripts/verify-s5-phase7-ui.ts`
- `scripts/capture-s5-phase7c.mjs`

No Phase-3/4/5/6 verifier source was edited.

## Convoy movement

Convoy position is a local rendering concern in `ScenarioFiveMap`. Desired progress uses only player-safe `worldClockMinutes / max(projectedArrivalMinute, 1)`, clamped to 0..0.97. Delivered convoys render at 1. Held convoys retain their previous visual progress. Other statuses apply `max(previousVisual, desiredVisualProgress)`, so movement cannot reverse. This visual value is not written to runtime/model state and does not enter adjudication, scoring, telemetry, AAR calculations, or calibration.

Markers are truck-shaped SVG groups with body, cabin, window, two wheels, and Persian convoy letter. Position transitions use 850 ms. Player-visible status changes trigger a 1500 ms pulse. Highlight priority is selected target, then fixed alpha, then expanded evidence; target-free network actions use a low global route pulse.

Real-browser inspection recorded initial and post-decision transforms for all four markers. At least one transform changed, and in the captured run all four changed. The exact values are retained in `docs/scenario5-phase7c-screenshots/inspection.json`.

## Player-information firewall

All motion, status styling, pulses, and route highlights are derived only from the existing player-safe view: visible convoy fields, projected arrival, operational clock, selected player action/target, and opened visible evidence. The map does not import or receive `trueWorldState`, `primaryAffectedCorridorId`, Actor profile/internal state, or hidden provenance. No hidden field was added to a player payload. The completion-only AAR boundary is unchanged.

`eventLogger.ts` remains unchanged (SHA-256 `7faa68531a38bd3a56facb5e73a7c4e4f5d1e13f4906218ee56147dacd1103b1`), and existing runtime API calls and telemetry semantics are unchanged.

## Real-browser verification

Chrome headless was driven through the DevTools protocol by `scripts/capture-s5-phase7c.mjs`. Five PNG captures were created in `docs/scenario5-phase7c-screenshots/` and visually inspected.

| View | Viewport | scrollHeight / height | scrollWidth / width | Physical layout | Additional check |
|---|---:|---:|---:|---|---|
| Initial decision | 1440×900 | 900 / 900 | 1440 / 1440 | controls left, map right | four cards and confirm visible |
| Initial decision | 1366×768 | 768 / 768 | 1366 / 1366 | controls left, map right | four cards and confirm visible |
| Initial decision | 1280×720 | 720 / 720 | 1280 / 1280 | controls left, map right | four cards and confirm visible |
| Belief after action | 1440×900 | 900 / 900 | 1440 / 1440 | controls left, map right | post-action marker transforms differ |
| Evidence local view | 1440×900 | 900 / 900 | 1440 / 1440 | evidence left, map right | internal evidence scrolling only |
| Reason | 1440×900 | 900 / 900 | 1440 / 1440 | reason left, map right | seven reason rows visible |

The 1366×768 pre-run briefing also has `scrollHeight=768`, `scrollWidth=1366`, and a visible start control. At 1366×768, the belief panel fits fully, and all seven reason options plus submit control fit fully. There is no live-gameplay page scrollbar or horizontal overflow at any tested desktop viewport.

Screenshots:

1. `01-decision-1440x900.png`
2. `02-decision-1366x768.png`
3. `03-after-action-1440x900.png`
4. `04-evidence-1440x900.png`
5. `05-reason-1440x900.png`

## Regression results

- Phase 3: passed, 86 assertions.
- Phase 4: passed, 464 assertions.
- Phase 5: passed, 388 assertions.
- Phase 6: passed, 2979 assertions.
- Phase 7: passed, 590 assertions; all prior assertions were retained and Phase-07C checks were added.
- `npx tsc -b`: passed.
- `npm run build`: passed (Vite 7.3.6, 118 modules transformed; only the existing large-chunk advisory was emitted).
- `git -c core.autocrlf=false diff --check`: passed.

## Frozen versions and semantics

The version constants remain unchanged:

- model foundation `s5-model-foundation-v1`
- world `s5-world-v1`
- evidence `s5-evidence-v1`
- Actor `s5-actor-v1`
- adjudication `s5-adjudication-v1`
- cognitive adapter `s5-cognitive-v3-adapter-v1.0.0`
- runtime `s5-runtime-v1.0.1`
- domain metrics `s5-domain-metrics-v1.0.0`
- calibration `s5-calibration-v1.1.0`

Mission outcomes, Actor reactions, decision sequencing, belief/reason semantics, OSI/construct formulas, telemetry contracts, domain metrics, AAR scientific content, and calibration behavior are unchanged.
