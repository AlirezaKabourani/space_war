# Phase 09D-1A storage contract

Database: `space-war.completed-cognitive-runs.v1`, IndexedDB version 1. Object store: `completedRuns`, keyPath `recordId`. Indexes: `userProfileId`, `releasedScenarioId`, `recordedAtIso`, and compound `ownerScenarioOrder` on `[userProfileId, releasedScenarioId, recordedAtIso, recordId]`. No existing localStorage record is migrated.

Each `SavedCognitiveRunV1` is a discriminated union using the project's `CognitiveModelV3Result` or `Scenario5CognitiveRunResult`:

| Field | Contract |
| --- | --- |
| schemaVersion | Literal `cross-scenario-run-v1` |
| recordId | Independent UUID-v4 generated at the start of the actual attempt |
| userProfileId | Exact existing profile ID captured at attempt start; never a name, seed, event timestamp or inferred owner |
| releasedScenarioId / internalScenarioId | 4 / `s4_redesigned_scenario_one` or 5 / `s5_silent_waves_redesign` |
| sourceRunId | Unchanged scientific identifier; deliberately not a deduplication key |
| recordedAtIso | Actual ISO wall-clock timestamp when the successful insertion is created; not monotonic runtime time or backup time |
| source | Literal `new-completion-v1` |
| cognitive | Exact canonical object, copied with structuredClone, never recomputed or normalized |
| modelStamps | Required exact scenario-specific version/status tuple matching the canonical cognitive result |

The new object is copied before asynchronous storage to prevent caller mutation during database opening. A new success is reported only after the write transaction completes. Duplicate attempt IDs return `already-saved`; conflicting owner/scenario/source/cognitive content never overwrites the existing record. Timestamp differences alone do not produce a conflict or modify the original timestamp.

## Runtime validation

`cognitiveRunValidation.ts` validates all required nested objects, arrays, model stamps, nulls, finite numeric values, signed axes/risk, percentages, nonnegative times, integer revision counts and the four S2 phase scores. Omission is not treated as null or zero. S1 requires all nine distinct core window IDs. S2 requires cognitive run/source identity equality. Unknown fields are rejected visibly, not stripped; schema evolution requires an explicit new contract/version. Validated reads return the original preserved fields.

S1 currently returns full `DecisionTelemetryV3` objects in `timing.longestDecision/shortestDecision` despite exposing a narrower public type there. The validator explicitly handles this actual canonical payload, including resource objects, evidence timelines, selection history, optional estimates/reasons and timestamps. It also accepts the compact shape declared by the type. Optional undefined fields emitted by the engine are retained by IndexedDB structured cloning; optional absence, required null and numeric zero are not conflated.

Required S1 stamps: measurement model, formula, option profiles, content, expert panel and anchor test. Required S2 stamps: measurement model, formula, option profiles, content, reason model, expert panel and experimental validity status. No experimental validity status is reinterpreted as clinical/scientific validation or a success score.

## APIs

- `beginCognitiveAttempt(userProfileId, scenarioId, sourceRunId)`: returns an immutable live handle, new UUID and captured owner; rejects missing/unknown profiles, released-ID mismatch and explicit preview/sample identities.
- `archiveS1Completion(handle, newlyCompletedSnapshot, exactCognitiveObject)`: real completion hook with snapshot/source/reference checks.
- `archiveS2Completion(handle, runtime, result)`: requires complete runtime and three-way run ID equality.
- `insertCompletedCognitiveRunIfAbsent(record)`: typed low-level repository mutation used by the completion adapter. Validates on write, checks current policy and profile existence, performs an atomic get/add transaction. It is not itself an authenticated provenance boundary.
- `listCognitiveRuns(profileId, scenarioId, currentProfileId)`: exact owner/scenario list, validates returned rows, stable descending ISO/record-ID ordering.
- `readCognitiveRun(recordId, currentProfileId)`: validates the stored record and rejects an owner mismatch; missing record returns null.

The caller supplies the currently selected profile ID to read APIs. Matching IDs and existing-profile membership are checked, including after asynchronous reads. No all-users archive enumeration API or new user dashboard UI was introduced. This is client-side profile isolation, not proof of authenticated user identity.

## Failures, ownership and lifecycle limits

Unavailable/blocked IndexedDB, quota failures, transaction aborts, invalid schemas/configuration, identity conflicts and missing owners produce explicit errors. No failed request is described as saved and no missing metric is imputed. Saved records remain readable when the archive switch is OFF. Profile deletion does not rekey/delete archive rows; reads for missing owners are refused. Existing profile/log retention remains untouched.

Deduplication is independent of scientific source IDs, atomic and durable for a saved attempt. Re-render, StrictMode, repeated callbacks and retries with the same handle/recordId cannot create a second row. Existing application runtimes do not resume after reload: an interrupted in-memory attempt cannot be completed or guessed from old snapshots/logs. A reload after successful storage leaves the existing row intact; starting a fresh real run creates a new attempt UUID even when S1 reuses its scientific sourceRunId. No claim is made that unsaved in-memory completion can survive a browser crash.

No remote persistence, encryption, automatic IndexedDB backup or cross-device synchronization exists. Existing legacy backup/reset does not include this database or its opt-in policy; the UI states that limitation. No profile owner is inferred from old or orphaned data.
