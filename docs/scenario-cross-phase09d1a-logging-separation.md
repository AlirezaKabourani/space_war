# Phase 09D-1A logging separation

| Legacy event logging | Completed archive | Future real completed S1/S2 result |
| --- | --- | --- |
| OFF | OFF | No new legacy behavioral events and no new canonical archive records |
| OFF | ON | Exact canonical cognitive result saved; no legacy behavioral event required |
| ON | OFF | Legacy events continue, no new canonical archive record |
| ON | ON | Both independent streams operate; one archive record per attempt |

System administrative events remain independent in all four settings. Switching either setting does not delete old data. Existing logger/exporter/user-envelope and retention behavior were not edited. In particular, the legacy logger's existing default-ON behavior is preserved; this phase does not set or activate that flag on mount. The new archive defaults OFF without creating configuration.

## Exact controls and policy

System Management still requires `activeProfile.role === 'admin'`:

- `ثبت رویدادهای رفتاری (سامانه قدیمی)` retains the original start/stop action and `space-war.analytics.enabled` flag. Its description states that it governs detailed legacy events in this browser/origin, independently of the completed-result archive and without device synchronization.
- `ذخیره گزارش‌های شناختی تکمیل‌شده (داشبورد کاربران)` is a separate accessible switch. Its version-1 policy is stored at `space-war-cognitive-archive.policy.v1`. Only explicit admin activation enables it. Missing, malformed or inaccessible configuration fails closed. State is re-read at completion and again immediately before insertion after asynchronous database opening.

The policy uses a separate namespace from the old `space-war.*` backup/reset scope. Importing a legacy backup therefore cannot enable new report recording on a different browser/origin. Neither the new database nor this policy is part of the existing backup. Existing reset clears legacy storage only; the new policy/archive remain, as explicitly disclosed beside the reset control. Orphaned records are never attached to another profile.

Enabled entry disclosure, shown in both actual scenario entry components:

> با تکمیل این اجرا، گزارش شناختی برای پروفایل آغازکننده در همین مرورگر و مبدأ سایت ذخیره می‌شود. همگام‌سازی بین دستگاه‌ها وجود ندارد؛ این تنظیم از ثبت رویدادهای رفتاری مستقل است.

Successful status is displayed only after transaction completion. Disabled status says no new report was archived. Failure status says the report was not saved and includes the storage failure. A storage failure does not alter the scientific result or mission outcome.

## Scientific data-flow proof

`eventLogger.log` checks `loadLoggingEnabled()` and returns before appending/persisting a behavioral event when OFF. Its timers do not supply S1's V3 active-time calculations or S2's runtime telemetry. The module's SHA-256 is identical before/after.

S1 `buildDecisionTelemetry`, `appendDecisionTelemetry`, `decisionTelemetryRef`, `attributionTelemetryRef`, pause/active duration tracking and `calculateCognitiveModelV3` remain on the component's state/ref path. Calls to `logScenarioFour`/`eventLogger.log` serialize event copies separately. The canonical archive hook consumes the authoritative in-memory completion, not `getEvents`, the legacy envelope, synthetic analytics attempts, the singleton run key or the final localStorage snapshot.

S2 `runtimeEngine`, `telemetryAdapter` and `calculateScenario5RuntimeResult` operate on runtime state without importing or consulting `eventLogger`. The UI's `log` callback serializes runtime/result details separately. Completion archiving is beside the unchanged completion log call, with a separate policy and store. Scientific/model hashes and the 112-run digest check independently corroborate this separation.

## Existing storage that is deliberately preserved

Legacy S2 completion events can contain the full cognitive result whenever legacy event logging is ON, even if the new archive is OFF. S1 still writes its previous global technical final snapshot independently of both controls. Admin wording discloses these facts and does not claim that all storage is stopped. These old objects have no trustworthy owner-bound archive identity and are never migrated, imported, selected or reconstructed as new records.

Local profile selection and admin login are interface gates. There is no authenticated server authorization, encryption, anonymity guarantee, cloud protection, synchronization or automatic backup of the new archive. Same-origin JavaScript/browser access can inspect or modify local data. Clearing site data or browser eviction can remove it. The new repository's exact-owner checks prevent accidental cross-profile lookup within the application contract; they are not a security boundary against someone controlling the client.
