# Scenario 4 Cognitive Measurement Engine V3

Status: `PROVISIONAL — requires SME validation`

This model describes behavior recorded in one Scenario 4 run. It is not a personality diagnosis or a validated psychometric instrument.

## Current implementation audit

- Scenario UI, final report, AAR, dashboard, attribution inputs, evidence interactions, and response-time capture: `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx`
- Move 1/2/3 options: `src/ui/components/scenario/scenario-four/moves/move1.ts`, `move2.ts`, `move3.ts`
- State, snapshots, decision records, resource events, and V3 telemetry types: `src/ui/components/scenario/scenario-four/model/types.ts`
- V2 orientation model retained for admin migration comparison: `orientationModelV2.ts`
- V3 profiles and diagnostic weights: `cognitiveOptionProfilesV3.ts`
- Pure V3 formulas: `cognitiveEngineV3.ts`
- Resource costs, recovery, and user-only cost events: `resourceEngineV2.ts`
- Event logger: `src/services/analytics/eventLogger.ts`
- Move handoff and actor/adjudication: `adjudication/adjudicator.ts`, `move2Adjudicator.ts`, `move3Adjudicator.ts`, and `actors/*`

Before V3, player-facing behavioral bars used visible/final outcome state and actor outcomes, integration used the arithmetic mean of operational and strategic loadings, timing used total elapsed time, and evidence telemetry was only a global opened-ID list. V3 removes those dependencies from player cognitive scores.

## Versions persisted in final snapshots

- Measurement model: `s4-cog-v3`
- Formula: `3.0.0`
- Option profile: `s4-options-v3.1-postfix`
- Scenario content: `s4-content-2026-09`
- Expert panel: `provisional-unvalidated`

Raw decision and attribution telemetry are persisted with the final snapshot. `oldOSI` is retained only for admin/debug comparison; the player dashboard reads V3 only.

## Core formulas

For option `o` in window `j`:

```text
D_jo = (S_jo - O_jo) / (S_jo + O_jo + 1e-6)
B_j  = mean(D_jo for all options in j)
C_jo = D_jo - B_j
A_jo = C_jo / max(abs(C_jo))   (or 0 when all centered values are 0)
MoveIndex_m = sum(w_j * A_selected_j) / sum(w_j)
OverallOSI = (Move1Index + Move2Index + Move3Index) / 3
MarkerPercent = ((OverallOSI + 1) / 2) * 100
```

Operational and strategic strengths are independent weighted means of their uncentered loadings. Integration is their harmonic mean:

```text
Integration = 2 * O * S / (O + S)
```

Dispersion is the population standard deviation of the three move indices. Response time, reason capture, optional off-ramp, actor outcome, end state, hidden truth, utility, and RNG seed do not enter OSI.

Data completeness is:

```text
0.50 * core decisions
+ 0.15 * timing integrity
+ 0.15 * evidence telemetry
+ 0.10 * attribution estimates
+ 0.10 * reason capture
```

Information seeking combines selected-option loading (60%), relevant opened-evidence coverage (25%), and opened-source entropy (15%). Second-order thinking, adversary modeling, escalation sensitivity, planning/foresight, multi-domain integration, relative risk posture, coalition orientation, information discipline, evidence-responsive updating, reason alignment, and user-only resource stewardship follow the formulas in `cognitiveEngineV3.ts`.

Missing required observations return `null`; they are never converted into a behavioral score of zero. Data completeness describes telemetry availability, not scientific certainty.

## Timing and evidence boundaries

- `elapsedMs` measures wall-clock duration from entry to confirm.
- `activeDecisionMs` pauses while the document is hidden or the application loses focus.
- Evidence/help/glossary time remains deliberation time.
- Evidence dwell is recorded separately on actual open/close; rendering a card does not count as opening it.
- First selection is immutable; only a real final-option change increments revision count.
- Confirmation is guarded against duplicate submission.

## Resource boundary

The player resource trajectory remains the real state trajectory. Cognitive resource stewardship uses only `user_cost` events in a separate shadow path; `actor_recovery` and `transition_recovery` cannot improve that cognitive score.

## Validation

Run:

```text
npm run test:s4-cognitive-v3
npm run test:s4-models
npm run build
```

The automated suite covers the 26 required formula/telemetry/migration boundaries, operational/strategic/high-high/weak anchor paths, hidden-state independence, and a deterministic 100,000-run random baseline. Expert-review JSON can be generated with:

```text
npm run export:s4-cognitive-profiles
```

All behavioral and domain loadings are provisional expert-coding seeds. They require independent SME scoring, inter-rater reliability analysis, pilot distribution review, and empirical validation before stronger claims are permitted.

## Design rationale

The source brief identifies planning, multi-domain task management, risk-taking, and reaction time as relevant functions. V3 therefore adds Planning/Foresight, Multi-domain Integration, and relative Risk Posture. Reaction time stays descriptive because Scenario 4 has no single correct response or validated speed norm. Article weights are not copied into scoring. The model does not claim to measure real multitasking, so the player-facing term is Multi-domain Integration.
