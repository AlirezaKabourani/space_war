# 09C-1 — scientific parity and frozen boundaries

**PASS: 112 complete deterministic runs, zero semantic mismatches.**

The corpus is unchanged: all 16 canonical worlds × seven non-oracle, non-stress, non-random player policy families, environmentSeed=1. Before any application edit, full SimulationRun digests and separate cognitive/domain/mission/cognitive-telemetry-bundle digests were recorded in `scenario5-phase09c1-baseline-corpus.json`. After implementation, every digest matches. The full run digests additionally match the accepted pre-08D corpus in `scenario5-phase8d-baseline.json`.

The comparison covers the complete cognitive object, mission/actor/resource state, action and target traces, runtime timing/telemetry records, evidence chronology and provenance, end-state selection and domain outputs. None of those data are recalculated or reweighted in the new UI. Display-only transformations are signed-axis coordinates, decimal text formatting and median/IQR milliseconds divided by 1000.

All **63 frozen scientific/archive/legacy hashes match**. The full source baseline also guards existing model/runtime/adapter/version/validation files, S4 released Scenario 1, legacy Scenario 2 id=2, App routing and existing gameplay components. Only Summary navigation, scoped completed-report CSS and two added S5 presentation files are allowed application changes. The CSS verifier confirms the entire pre-existing stylesheet remains an unchanged prefix; new rules are scoped to `.s5-cognitive-dashboard`.

Unmodified relevant regression verifiers pass:

| Existing verifier | Result |
| --- | --- |
| 08D integrated presentation | PASS — 32,798 assertions |
| 08D.1 corrections | PASS — 1,516 assertions |
| 08D.2 phase-summary header | PASS — 115 assertions |
| 08D.2 UX / ending explanation | PASS — 2,677 assertions |

Historical verifier code and historical reports were not edited to make these pass. Files that those verifiers generate are backed up and restored byte-for-byte; fresh results are retained in the 09C-1 verification/check logs. No older archived-hash/snapshot verifier was silently reclassified as passing.

The actual browser run separately verifies unchanged live-map geometry at all three desktop sizes, complete current-run identity, exactly one completion event, and unchanged analytics storage through passive report/definition/back/trace/technical-report navigation. Six archived, unmodified scientific ending witnesses exercise the same current-run Summary gate and real navigation controls. They are isolated replay witnesses rather than fabricated user runs; null/zero presentation fixtures are separately labeled TEST ONLY.
