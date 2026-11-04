# Phase 08D numeric synchronization

Phase-specific numeric/UI checks: **PASS**. 32798 assertions across the presentation suite, including numeric and firewall checks. Scientific runs: 112; mismatches: 0. No stale-number discrepancy found.

| Surface | Canonical source / rule |
| --- | --- |
| Header and map clock | buildScenario5PlayerView -> missionState.worldClockMinutes |
| Remaining time | max(0, 360 - current safe clock) |
| ISR / Support | Current missionState.resources; preview subtracts frozen catalog costs only |
| Convoy health / delay / status | Current convoy integrity / delayMinutes / status |
| Projected arrival | Existing canonical baselineArrivalMinute + delayMinutes projection |
| Deadline and margin | deadlineMinute; deadlineMinute - projectedArrivalMinute |
| Evidence count and route summaries | Current visible evidence; no hidden provenance or probability |
| Outcome / review / trace | Exact immutable domainDecisionRecords before/after snapshots |
| Phase summary | Current safe view and the actual two committed phase records |
| Final result | Unmodified resolveMissionEndState and current final safe view |


Checks compare every convoy at every committed decision in all 112 runs. Adjacent records must share exact convoy, resource and clock values. Actual outcome continuation is also tested for all 16 worlds. Header, map and convoy cards receive the same safe projection. Resource previews never commit state.

R8 reconciliation is exact: previous clock + catalog duration + existing 20-minute baseline + passive horizon continuation = 360. The UI labels all three components separately.

Late evidence is the final visible-ID set minus D_final_belief.visibleEvidenceIdsAtCheckpoint. Stored outcome evidence is selected by the corresponding newVisibleEvidenceIds. No late item is added to the final belief retroactively.

Browser result: 28 real captures, 30 additional layout comparisons. Every live capture checks document overflow, map visibility, accessible footer position and current arrival/deadline text against the actual runtime. Required sizes: 1280x720, 1366x768, 1440x900. Stored-outcome review preserves partial belief input and emits no runtime/telemetry changes. Both target-selection directions are exercised; passive evidence summaries produce zero evidence-open events.

Machine evidence: scenario5-phase8d-verification.json and scenario5-phase8d-screenshots/inspection.json. Historical verifier failures are documented separately; numeric PASS does not relabel the historical suite as passing.
