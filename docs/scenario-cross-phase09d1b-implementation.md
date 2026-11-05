# Phase 09D-1B implementation

This phase implements the supplied approved contract as a read-only, user-scoped two-scenario dashboard. It is a unified view, not a numeric aggregate. Released S1 is product 4 / `s4_redesigned_scenario_one`; released S2 is product 5 / `s5_silent_waves_redesign`. Legacy products 1/2 are excluded. No score averaging, normalization, ranking, pooled value, scientific formula, migration or Phase 09D-2 work was introduced.

## Preflight and changed files

Initial HEAD: `9dd7a7f64e05f978203097aef65b660dc188112c`. Initial status and diff/stat were clean. Repeated preflight hashes were stable. The new baseline captures 260 existing source/script/config files, all 159 prior protected files, and exact pre-edit bytes of the two files edited in this phase. No reset, revert, clean, commit, Git LFS normalization or configuration edit was performed.

Modified application files:

- `src/App.tsx`: existing admin login session integration, per-row action, full-width nested dashboard panel within the existing profile-management view, back/focus restoration. Create/select/delete behavior is retained.
- `src/services/storage/cognitiveRunRepository.ts`: additive narrowly scoped admin read functions and their read-only database helper. The prior owner-only APIs, transaction/write path and completion behavior are unchanged.

Added application files:

- `src/services/storage/cognitiveAdminReadAccess.ts`: live admin-session handle, membership checks and revocation.
- `src/ui/components/admin/CrossScenarioCognitiveDashboard.tsx`: report-only view and numeric/signed presentation components.
- `src/ui/components/admin/CrossScenarioCognitiveDashboard.css`: scoped dark-navy RTL dashboard styles, gold-to-cyan signed spectra and responsive layouts. Existing individual dashboards and other page styles are untouched.
- `src/ui/components/admin/crossScenarioPresentation.ts`: the nine approved conceptual labels, exact absence/unmeasured/error wording, display formatting and safe read-error messages.

## Navigation and selection

After the existing password-based admin login, every existing profile row, including built-ins/test profiles and the admin's own row, has one action: `مشاهده داشبورد شناختی تجمیعی`. Normal-mode profile selection has no such action. The button retains the logged-in admin and passes the row's immutable profile ID to the dedicated panel. It never selects/impersonates the row owner.

The header uses `داشبورد شناختی تجمیعی` and `نمای مشترک سناریوهای ۱ و ۲ — بدون امتیاز شناختی تلفیقی`. Only the target's display name is shown; national/phone/profile identifiers are not displayed. Back returns to the same list and restores focus to the initiating action. On entry, focus moves to the dashboard heading. No public URL route or persisted dashboard target is added. Refresh resets admin mode through the existing app flow; a subsequent real admin login can read the same saved records.

The two independent run selectors use `recordId`, sorted by descending `recordedAtIso` then descending `recordId`. Each defaults to its newest record. A selector change updates only that scenario. Timestamp, Persian local date/time (Asia/Tehran), model/formula and short record UUID distinguish runs. A reused S1 scientific source ID does not collapse attempts. Archive OFF does not block reads of previously saved results.

## Information architecture and scientific boundary

- A: target/header, two run selectors, browser-local and archive-off notice.
- B: separate S1/S2 record availability and completeness; no combined coverage.
- C: independent signed orientation, strengths/integration/dispersion, S1's three moves and S2's four phase spectra.
- D: exactly nine conceptual rows, using S1 `scores` and S2 `constructs`, with two independent values/bars and the always-visible noncomparability note. The group label is `هم‌موضوع؛ محاسبه مستقل در هر سناریو`.
- E: independent signed risk spectra, never percentages or better/worse rankings.
- F: S1 information discipline and coalition orientation; collapsed stored attribution/window/timing/response details; S2 real telemetry summary. S2 information discipline is always labeled `در سناریو ۲ سنجیده نمی‌شود`, including when no S2 archive record exists. Phase charts are not duplicated.
- G: independent completeness components and explicit experimental, browser-local, backup and interface-gate limitations.
- H: optional exact version/provenance metadata, without a default raw cognitive JSON dump.

S2 archive v1 contains cognitive output only. No mission result, convoy state, evidence list, full belief checkpoint timeline or action contribution is reconstructed. S1-specific attribution/window details use only actual stored fields. No engine is called by the view, and it reads neither event logs nor singleton snapshots as a fallback.

The nine rows are informationSeeking, secondOrderThinking, adversaryModeling, escalationSensitivity, evidenceResponsiveUpdating, resourceStewardship, planningForesight, multiDomainIntegration and decisionCoherence. Their approved Persian labels and all presented source paths are documented in the 105-row field-to-UI CSV.

## Data states and interactions

Required values and model stamps are validated by the unchanged archive validator before rendering. Invalid rows cause a visible data error and are not silently dropped. A true numeric zero is displayed as `0.00`; signed zero has a center marker. Null shows `داده کافی برای محاسبه وجود ندارد` and no measurement bar/marker. Intentionally unmeasured is a separate message. Omitted/invalid values are errors, never zero or implicit null.

Valid empty results, unavailable/blocked IndexedDB, schema/read failures, owner deletion and permission loss have distinct visible states. Loading never presents a fabricated count or score. When a target or session changes, request cleanup and identity checks prevent a previous target's data from rendering. All numeric source attributes equal the selected stored payload; formatting and axis geometry affect presentation only.

Dashboard open, close, section navigation, independent selection and read refresh produce no storage writes, telemetry or game mutations. Instrumentation of localStorage mutators and IndexedDB add/put/delete/clear, plus whole localStorage/record snapshots, verifies this. The admin read helper also avoids creating an absent IndexedDB database/schema; unsupported nonmutating enumeration is reported as unavailable.

## Verification and reproduction

```powershell
node scripts/verify-cross-phase09d1b-browser.mjs
npx tsx scripts/verify-cross-phase09d1b-scientific.tsx
node scripts/check-cross-phase09d1b-history.mjs
npm run build
```

Browser verification uses a disposable Chromium profile and the real App -> ScenarioRunner -> production scenario components -> existing 09D-1A completion hooks. Six genuine completions create both/multiple, S1-only, S2-only and neither coverage for four isolated profile fixtures. Two owners deliberately have the same display name. No cognitive payload is injected to generate these records; no installed user browser/IndexedDB is accessed. Later corruption/timestamp/quota/owner-removal tests are explicitly isolated fault injections and restore the original records. Scalar-only endpoint/null fixtures are a separate development test page, never archive inputs or user results.

The real App/admin browser suite passes 76 checks and captures 23 screenshots. The scientific/presentation suite passes 469 checks, including all 159 protected hashes and 112 deterministic S2 results with zero semantic mismatches. Production build/typecheck and scoped lint pass. Final historical before/after results and prior 09D-1A regression status are recorded in the verification JSON and separate scientific parity report; pre-existing failures are not reported as passing.

All required artifacts are under `docs/scenario-cross-phase09d1b-*`. The source patch is relative to the captured baseline and contains only this phase's application/test changes. Phase 09D-1B ends here; no 09D-2 harmonization or combined cognitive score follows.
