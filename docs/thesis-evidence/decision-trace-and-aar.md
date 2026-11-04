# Decision trace and after-action review — رد تصمیم و مرور پس از اقدام

خلاصه فارسی: رد تصمیم شامل شناسه رویداد، زمان، سناریو، کاربر، عمل و جزئیات آزاد است و در `localStorage` ذخیره می‌شود. S4 و S5 مرور پس از اقدام غنی دارند، ولی ذخیره‌سازی سمت سرور، تمامیت رمزنگاری‌شده و بازپخش پایدار کاربرمحور پیاده‌سازی نشده است.

## Global event schema

`EventLogEntry` is defined at `src/services/analytics/eventLogger.ts:19-31`:

```ts
interface EventLogEntry {
  id: string;                 // crypto.randomUUID()
  ts: number;                 // Date.now(), Unix epoch ms
  type: string;
  scenarioId?: string | number;
  nodeId?: string | number;
  userId?: string;
  userName?: string;
  userRole?: string;
  action?: string;
  elapsedMs?: number;
  detail?: Record<string, unknown>;
}
```

IDs and wall-clock timestamps are created in `eventLogger.log` (`:63,109-123`). Scenario-local active timing generally uses `performance.now()` and is stored as elapsed milliseconds (`:40,125-135`). This distinction matters: `ts` supports ordering across page events, while monotonic elapsed values are safer for within-session durations.

## Storage and export

- Behavior events are held in an in-memory array loaded from and persisted to localStorage key `space-war.analytics.events` (`eventLogger.ts:33,42-60,65-123`).
- Logging has an independent enabled flag `space-war.analytics.enabled` and defaults enabled if absent (`:34,175-188`).
- Merge deduplicates using a compound key and sorts events (`:83-103`); it is not a cryptographic identity/integrity check.
- Text and CSV exports are implemented at `:137-168`; CSV columns/JSON flattening are in `src/services/analytics/logExport.ts:18-57`.
- System actions use a separate `space-war.system.events` array (`systemLogger.ts:3-24`). Admin UI exports behavior/system CSV or JSON and combined logs (`src/ui/components/admin/SystemManagement.tsx:149-158`).
- Whole-system backup includes profiles, logs, and accepted S4 keys after validation (`systemStorage.ts:77-132`).

توضیح فارسی: لاگ‌ها محلی و قابل خروجی‌گرفتن هستند، اما پایگاه داده پژوهشی یا زنجیره ضد‌دستکاری نیستند. حذف حافظه مرورگر یا ویرایش دستی localStorage می‌تواند داده‌ها را تغییر دهد.

## Event coverage by scenario

| Scope | Recorded evidence | Source |
|---|---|---|
| Application lifecycle | scenario open/start/end/exit, profile/admin/system operations | `src/App.tsx:1020-1136`; `systemLogger.ts` |
| Generic nodes | node entry, reference open/close, info continue, option select/confirm, allocation/minigame/admin skip | `ScenarioRunner.tsx:64-88,102-180,309-476,534-592` |
| S0 | lesson interaction, reading/reference, quiz selection/correctness, concept-lab answer changes/explanations/timing/summary | `ScenarioZeroLearning.tsx:19-24,139-178,205-228`; `MiniGameHost.tsx:470-609,827-888` |
| S1 | per-decision option, response time, changes/previews, option weights, status before/after/deltas; final cognitive/status summary | `ScenarioOneSimulation.tsx:1164-1281` |
| S2 | selected actions, costs, state/convoy before-after, status deltas, final mission/cognitive summary | `ScenarioTwoSimulation.tsx:1340-1519,1553-1570` |
| S3 | area/tile/action, before-after resources, elapsed, round, confidence/exposure, success/failure | `ScenarioThreeDungeon.tsx:309-337,398-568` |
| S4 | run/move choices, selection timelines, active/hidden time, evidence opens/dwell, attribution estimates, rationale, resource events, actor/inject consequences, snapshots, cognitive/final report | types `scenario-four/model/types.ts:122-193,347-378`; component `ScenarioFourRedesignedScenarioOne.tsx:1426-1500,1628-2043` |
| S5 | sequence-numbered runtime events, decision selection/history/timing, evidence opens, belief/reason records, domain decision records, run-start/complete summaries | `scenario-five/model/runtime/types.ts:21-247`; `runtimeEngine.ts:69-92,148-457`; `ui/presentation.ts:173-247` |

## Run segmentation

The admin dashboard reconstructs runs rather than storing a universal run ID on every global event. It sorts by timestamp, opens a run at `scenario_start`, and closes the current scenario's run at `scenario_end`/`scenario_exit` (`src/App.tsx:1293-1339`). Consequences:

- overlapping tabs/runs for the same scenario can overwrite `openRuns[scenarioId]`;
- missing lifecycle events leave runs unclosed;
- S4/S5 internal `runId` fields are more precise than this derived attempt counter, but they are normally inside event detail rather than a mandatory top-level field.

## S4 trace schema and persistence

`DecisionRecord` captures move/window/selected option/timestamp (`scenario-four/model/types.ts:122-135`). `DecisionTelemetryV3` adds first/final option, selection timeline, change count, entry/confirmation/active/hidden times, evidence available/opened and detailed dwell timeline (`:137-169`). Attribution and resource events are typed at `:171-193`. Move/final snapshots include model state, actor outcomes, observations, choices, metrics, cognitive output, and version metadata (`:347-378` and adjacent interfaces).

The component persists move 1, move 2, and final snapshots and logs completion (`ScenarioFourRedesignedScenarioOne.tsx:1628-1722,1820-1905,1907-2043`). The AAR uses final snapshot records plus `buildOpponentObservationAAR` to distinguish what the opponent saw, did not see, and inferred (`scenario-four/model/aarV3.ts:15-84`). It presents mission metrics, OSI/proxies, Brier assessment, resources, decisions, actor actions, injects, evidence, and hidden truth; UI narrative definitions are in `scenario-four/narrative/narrativeCatalogFa.ts:539-542` and AAR selectors.

**Replay finding.** Persistence supports archival inspection and deterministic re-computation in scripts, but no general UI function was found that loads an arbitrary saved snapshot and replays each transition. Component initialization reuses run metadata but does not reconstruct a partially completed move sequence from all snapshots. Therefore “decision replay” should be stated as script/model reproducibility, not an implemented end-user replay player.

## S5 trace schema and AAR

S5's runtime event appender assigns deterministic sequence IDs and timestamps (`scenario-five/model/runtime/runtimeEngine.ts:69-92`). Runtime state includes:

- eight decision telemetry records with available/first/final actions, selection history, revisions, timing, resources, and evidence IDs;
- evidence-open telemetry and materialized evidence;
- four beliefs and three reason records;
- eight domain decision records with convoy/resources before-after and actor-delay decomposition;
- ordered runtime events and mission event history.

The types are explicit at `scenario-five/model/runtime/types.ts:21-247`. Player-facing global log builders emit run-start, action-selected, evidence, decision, belief, reason, outcome, and run-completed details (`scenario-five/ui/presentation.ts:173-247`). `buildScenario5AarView` constructs AAR sections after completion (`:249-318`), including true world, decisions, beliefs, cognitive proxies, domain metrics, and stated method limitations. Hidden truth is intentionally absent from the run-start projection and disclosed in AAR.

**Persistence/replay finding.** `ScenarioFiveSimulation` keeps `Scenario5RuntimeState` in React state and logs the completion bundle (`ScenarioFiveSimulation.tsx:143-161` and completion handlers). No S5 localStorage hydration key exists. A refresh loses the live run, although pure engines and verifier scripts can replay a supplied seed/world/action trace. Thus runtime replay is test infrastructure, not a user feature.

At the audit cutoff, an uncommitted Phase 8D presentation helper `buildStoredScenario5Outcome` could reconstruct a past outcome-view model from an in-memory immutable `domainDecisionRecord` without rerunning transitions (`scenario-five/ui/presentation.ts:97-173`). It was used by the current-outcome builder but no user-facing historical-outcome navigation or persistent hydration path referenced it. This is partial presentation support, not durable replay.

## AAR coverage by scenario

| Scenario | Implemented AAR level |
|---|---|
| S0 | Learning summary: accuracy, concept strengths/weaknesses, style preview. No adversarial AAR. |
| S1 | Final narrative and cognitive/status summary; admin aggregates. |
| S2 | Final mission result, indices and decision summary. |
| S3 | Local event list and categorical success/failure; no formal analytical AAR. |
| S4 | Full final report/AAR with visible/hidden actor view, resources, evidence, Brier and cognitive/mission proxies. |
| S5 | Full runtime AAR with hidden world disclosure, decision/evidence/belief/reason traces, cognitive proxies and domain metrics. |

## Data-quality and research limitations

1. Browser timestamps and profile IDs are client-provided; clock changes and manual storage edits are not detected.
2. No schema version is mandatory on the global `EventLogEntry`; S4/S5 model-version fields appear in their detailed outputs, but older generic events can be heterogeneous.
3. Event `detail` is untyped at the global boundary, so CSV flattening cannot guarantee a stable longitudinal column schema.
4. Logging can be disabled, storage can fill/fail silently, and `persist` catches errors (`eventLogger.ts:53-60`). Missingness is therefore not necessarily participant behavior.
5. No server-side consent, participant pseudonymization workflow, data retention, audit signature, or immutable research ledger exists.
6. The literal admin password and local-only profiles are unsuitable as research access control (`profileStorage.ts:92-95`).
7. AAR calculations are deterministic descriptions of coded rules; they should not be presented as validated expert adjudication.
