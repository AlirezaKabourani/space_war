# Phase 09D-0: cross-scenario cognitive and user-dashboard read-only audit

STATUS: READ-ONLY AUDIT FAIL

Extraction/contract checks: PASS. Strict untouched-workspace baseline: FAIL because concurrent changes outside this audit were observed. This task wrote only the seven new audit artifacts listed below; it did not edit application/model/UI/test/existing-doc/data files, run gameplay, migrate users or implement a dashboard/button. A read-only audit cannot certify byte-identical pre-existing source while another process changes that source. No concurrent changes were reverted or treated as audit-authorized edits.

Date: 2026-11-04 (Asia/Tehran). Initial Git HEAD: `42190a33cfd4421e7eef6b3bbc8453953c0c32a5`; observed subsequent HEAD: `09d591120ef50b5b1f10de983a9862735629e79f`. Initial status was clean. The manifest records start/end hashes and exact concurrent differences; its verification boundary is the final recorded scan, not a guarantee against future changes.

## Released identities and actual profile page

Released Scenario 1 is active product id=4, internal `s4_redesigned_scenario_one`, player title «۱ — حریم خاکستری مدار». Released Scenario 2 is id=5, internal `s5_silent_waves_redesign`, «۲ — امواج خاموش». Legacy ids 1/2 remain in full test catalog, not the released targets. Exact catalog mapping: `src/App.tsx:187-194,307-339`.

Actual existing profile-selection/management UI is local `renderProfileManager` in `src/App.tsx:1189`, mounted by `view === "profileManager"` at 2716. It is a React-state navigation screen, not a URL route and not an admin-only surface. Main menu → «ساخت / انتخاب پروفایل» (1165); global menu → leaveScenarioGeneric("profileManager","global_menu_profile") (2784). Each `profiles.map(profile)` row has key=profile.id, name=profile.name, role/catalog/progress display (1222-1272). `Profile` type: `src/core/types/profile.ts:1`; generated stable id=player-UUID. Ordinary profiles can be selected without a credential check; selecting admin invokes the existing login check. Admin-only controls on this shared page open systemManagement/adminAnalytics. No row cognitive-report button exists.

General App analytics is separate: `renderAdminAnalytics` at App:1278, activeProfile.role admin gate, raw event heuristics through buildInsights/buildCognitiveInsights and legacy S1 branch. It does not render either canonical V3 cognitive result. Full route, identity and authorization evidence is in the storage-readiness artifact.

## Exact active result routes and gates

S1: catalog 4→tree `src/scenarios/s4_redesigned_scenario_one/tree.ts`→ScenarioRunner minigame→MiniGameHost:649→ScenarioFourRedesignedScenarioOne. Final move UI constructs `calculateCognitiveModelV3` at UI:1991, attaches full result and six stamps/telemetry to `ScenarioOneFinalSnapshot` at 1998-2007. Move3 update→final_report→aar→dashboard (2743,2773,2917). Local CognitiveDashboard at 1064 uses finalSnapshot.cognitiveScoresV3 cast to CognitiveModelV3Result; phase+truthy snapshot gate at 2783 has no S2-style equal/nonempty run ID check or owner check. Snapshot parent property is optional Record<string,unknown>; code casts, not runtime validates. CognitiveModelV3Result has no inner runId/scenarioId; wrapper and decision telemetry do.

S2: catalog 5→tree `src/scenarios/s5_silent_waves_redesign/tree.ts`→MiniGameHost:661→ScenarioFiveSimulation. Complete stage→calculateScenario5RuntimeResult (`runtime/domainMetrics.ts:253`)→result.cognitive:Scenario5CognitiveRunResult→ScenarioFiveSummary mission/cognitive/technical screens (`ScenarioFiveSummary.tsx:51-69`). currentRunCognitive (`ui/cognitiveDashboardPresentation.ts:9-17`) requires completed state and nonempty equal runtime/result/cognitive run IDs, plus cognitive literal scenario identity. Missing/mismatched result renders unavailable, never another user's run. This is not an owner authorization check.

Existing admin-only intro preview is a separately marked static DESIGN_SAMPLE with runId ADMIN-DESIGN-PREVIEW-ONLY (`App.tsx:19,2525`; `ScenarioFiveAdminDashboardPreview.tsx:6-71`). It calls the renderer directly; it is not a saved/current user result and does not establish result restoration.

## All twelve S1 constructs and S2 measured/unmeasured inventory

| Exact construct key | S1 player-facing label | S2 current status |
| --- | --- | --- |
| informationSeeking | جست‌وجوی اطلاعات | Measured [0,100], one of 9 meters |
| secondOrderThinking | تفکر مرتبه دوم | Measured [0,100], one of 9 meters |
| adversaryModeling | مدل‌سازی اسرائیل | Measured [0,100], one of 9 meters |
| escalationSensitivity | حساسیت به تشدید | Measured [0,100], one of 9 meters |
| informationDiscipline | پرهیز از ادعای فراتر از شواهد | Literal null: intentionally unmeasured |
| evidenceResponsiveUpdating | به‌روزرسانی مبتنی بر شواهد | Measured [0,100], one of 9 meters |
| coalitionOrientation | گرایش ائتلافی | Absent property |
| resourceStewardship | مدیریت منابع | Measured [0,100], one of 9 meters |
| planningForesight | برنامه‌ریزی و آینده‌نگری | Measured [0,100], one of 9 meters |
| multiDomainIntegration | یکپارچه‌سازی چندمعیاره | Measured [0,100], one of 9 meters |
| riskPosture | گرایش به پذیرش ریسک | Measured signed [-1,1], separate axis |
| decisionCoherence | انسجام تصمیم | Measured [0,100], one of 9 meters |

S1 has 12 measured-capable score properties, each number|null; “measured-capable” does not imply non-null in every run. S2 has 11 construct properties: nine measured-capable 0..100 proxies + signed risk + intentional-null discipline; coalition is not in the type. Null/absence/0/unmeasured have distinct meanings.

S1 versions: s4-cog-v3; formula 3.0.0; s4-options-v3.1-postfix; s4-content-2026-09; provisional-unvalidated; s4-anchor-first-options-v1.

S2 versions: s5-cognitive-v3-adapter-v1.0.0; cognitive-v3-semantic-v1.0.0; s5-option-profiles-internal-v1.0.0; s5-silent-waves-redesign-content-v1.0.0; s5-reason-model-internal-v1.0.0; not-yet-expert-validated; experimental_pending_expert_and_human_validation.

## Crosswalk coverage and exact codebook

The CSV audits 91 rows with all 19 required columns plus 4 explanatory columns. It covers all 86 extracted S1 result paths (including collection containers, their item fields, six response flags and optional-parent leaves), S1 wrapper scenarioId/runId and ALL 40 scalar S2 result leaves. These counts are not 86 or 40 distinct cognitive constructs. The 40 S2 leaves are 9 identity/version/validity + 6 completeness + 9 orientation (including four tuple indices) + 11 construct + 5 telemetry. A complete mechanical match check found no missing field compared with either the preserved 09C-1 field-to-UI map or 09C-2 typed leaf inventory.

The formula artifact includes every S1 and S2 option profile (41 and 33), all seven/nine domain loadings, diagnostic weights, reason coefficients/matrices, exact engine calculations and auxiliary field expressions. The unique-fields artifact retains raw telemetry/return contracts, units, nullability, dashboard resource/attribution/timing transformations and mission/telemetry boundaries. No combined score or user results were calculated. Empty/dummy telemetry was used solely to test existing null/zero behavior.

Mechanical differences, all factual rather than comparability approvals:

- OSI: S1 epsilon 1e-6/fixed alternatives/diagnostic-weighted three fully observed moves; S2 epsilon 1e-9/available alternatives/equal available observations within four phases, overall requiring all four; A2 excluded. Flat S1 window returns 0; S2 degenerate denominator returns null.
- Strengths/integration/dispersion: nine weighted S1 profile loadings vs phase-balanced S2 OSI-window loadings; zero-sum integration=0 vs null; S1 SD needs all 3 moves, S2 SD >=2 phases.
- Resource stewardship: shared inner .50/.30/.20 coefficients; S1 direct user_cost shadow from selected baseline 85/85/85/75, no recovery credit, .10 penalty per resource below 20% baseline capped .30; S2 all-eight visible resource records, diagnostic/phase-balanced base, .05 each final ISR/support<=5.
- Multi-domain integration: S1 H7*min(1,total/3.5), including coalition/legitimacy; S2 H9*total/9, including navigation/logistics/civilian/network. Distinct zero-total/profile-wrapper behavior.
- Coherence: S1 one reason-alignment dimension matrix and final move threshold/COA/info rules; S2 seven multi-term reason formulas, pre-outcome reason capture, B/C/D action-pair matrices, >=2 eligible phases. Same .60/.40 outer recipe is not same estimator.
- ERU: S1 chronological attribution/system-visible-confidence change with stable-evidence tolerance and change weights; S2 fixed adjacent targeted-interference checkpoints, corridor/source visible-evidence support, informative-change-only pairs and equal pair means.
- Risk: both source scores signed [-1,1], different windows/relative alternatives/aggregation. S1 UI-only (r+1)*50 bar; S2 signed value, percentage coordinate only.
- Other constructs: even where inner coefficients match, option loadings, eligible windows, diagnostics and averaging differ. Seeking differs in relevant-evidence/time gates, missing component handling and single-source/no-opening diversity.
- Completeness/timing/revisions: denominators 9/3 vs 8/4, distinct validity predicates, S2 finite-time filter, different evidence revision opportunities and triggers. Existing zero counts remain zero; missing result never becomes a zero run.

Annotations SAME IMPLEMENTATION/Different/Not Determinable are used only at their stated scope; exact full constructs are not approved for fusion. Known unavailable S2 fields: coalition, numeric discipline, returned perWindow/contribution arrays, ERU contribution audit, response flags, missingReasons, markerPercent/dispersionLabel/interpretation and aggregate dwell/extremal decisions. S1 inner result lacks explicit IDs and separate reasonModelVersion/validityStatus; its wrapper has IDs/stamps.

## Persistence, ownership and authorization findings

S1 final.snapshot contains full cognitive result/nulls and stamps after a successful write, but is an unscoped singleton with no userProfileId. Its global run token is reused across mounts and users; current profile does not prove stored owner. Completion overwrites the shared snapshot; a newer incomplete run can leave an older completed object. No latest-per-user policy exists. S1 completion/orientation logs do not include the whole V3 result.

S2 s5_v3_run_completed detail DOES contain full cognitive JSON/nulls plus versions, mission/domain result, canonical runId and contextual event.userId when successfully logged. Its event.ts is wall-clock log time; dedicated completedAt/runtime completedAtMs/stage are absent from payload. The event type signals completion; cognitive.validityStatus is experimental model metadata. Multiple completions can coexist in the event array. getEvents loads/casts the array without nested schema, owner or equal-run read checks. Logging can be disabled; quota/storage failures can lose records.

Neither scenario restores the completed report after refresh/browser restart or after unmount caused by user switching. S1 mounts at intro and reads only global run token; S2 mounts with null runtime/result. Stored bytes survive only under normal same-origin retention; their existence does not create a report route. Profiles/progress are not a run index. No IndexedDB, per-user scientific result repository or external API/database persistence was found in src. Manual raw-string system backup preserves existing entries but does not add missing owner fields or result validation. CSV export converts null to blank; JSON/text detail preserves explicit nulls.

App analytics generates synthetic sid::attempt IDs and uses scenario/time boundaries, not scientific runId. In all-user mode openRuns is keyed only by scenario, so cross-user boundaries can mix. Selected run defaults all, unmatched ID falls back to all user events, not latest completed run. No merges by name, timestamps or synthetic IDs were performed. Client-side profile/admin gates do not provide server record authorization.

### Available snapshots after restart

- S1: conditionally one global full final.snapshot and global run token, no proven owner/history and no UI rehydration.
- S2: conditionally full detail.cognitive in each retained completion event; no full runtime/report restoration, read validator, latest-run selection or owner authorization API.
- Actual real-user run count on this machine: NOT DETERMINABLE, not zero; live browser/user data were not inspected.
- Repository six 08D ending state/result witnesses are QA snapshots. 112-row 09C-1 corpus contains digests, not full user records. 09C visual fixtures and admin preview are test/sample material. No witness was assigned to a real profile.

## Verification and preserved previous phases

Fresh checks: 22 isolated assertions PASS with dummy in-memory storage, write methods throwing and total write calls 0. They test read helpers/null/zero preservation, backup prefix/raw retention, profile-load admin fallback, currentRunCognitive gates, signed coordinates, empty-input semantics and zero-sum integration differences. TypeScript compiler API no-emit/no-incremental check: zero diagnostics. No build/output generation, gameplay/browser capture, live storage access, snapshot rewrite, archive rewrite, import/reset/restore or score reconstruction was run.

Source-level contracts were parsed directly with TypeScript AST. The CSV has 91 data rows, 23 columns with equal row widths, 40/40 distinct S2 paths, all requested annotation values valid and source-file/line references existent. Its S2 coverage matches all 40 preserved 09C-1 map fields and all 40 09C-2 typed leaves. The preserved 09C-0 S5 contract has the same 40-field scientific schema/formulas. Its old compatibility-screen navigation describes the pre-09C-1 UI and is superseded by current source, not silently treated as current navigation.

09C-2 visual patch HAS LANDED: current dashboard source contains descriptive spectrum title, data-axis-edge hooks and compact coverage module; current scoped CSS contains those hooks/rules. Preserved focused verification reports 1,591 assertions PASS; scientific parity reports 112 runs / zero mismatches / 63 frozen hashes; existing build/browser artifacts report PASS. Those are historical evidence, not rerun claims. Historical strictAcceptanceStatus remains FAIL for the unchanged 09C-1 App hash assertion from the existing admin shortcut, documented in before/after logs. This audit applied no patch and changed no prior verification baseline.

### Untouched-source/hash check

The audit captured SHA-256 for 1042 existing regular files before creating artifacts, excluding .git internals and node_modules; included src, scripts, existing docs/archives/screenshots, public/assets, analysis and dist. Initial Git status was clean. The later whole-tree comparison detected these pre-existing-file changes outside audit writes:

| Pre-existing path | Initial SHA-256 | Observed later SHA-256 |
| --- | --- | --- |
| .gitattributes | 8542760a75edf261379bd4a501b97938ac92b50b56a9747cd5071b2bd56deae8 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| .gitignore | cc09f8295be3fb1d68d101991023fb15a210bf82776f2de56fbc38744362d222 | 25cabdcceb277a7d2a9117131821cce956309bb65212b07e5d5936c4fc358241 |
| src/ui/components/scenario/ScenarioFive.css | 331ad5fe212809a57220db6918c6961f8f66b87a717d5be014684413dfcd966a | 6aecb2ca2d81ea6cde38a47e6915f60a0da9babdc51f9a79faa53e99ca3c52b0 |
| src/ui/components/scenario/ScenarioFiveActionCard.tsx | ddf0bea3bea185b3bab9d7dded20494dc26b0ef8c9138f1ef2c3008da681141b | 84558e4f0395132238a4fbcd28b7ed2a74c584854b2dde2249afb24e185b8130 |
| src/ui/components/scenario/ScenarioFiveMap.tsx | 53ca5481a8fd5d0d712aa1c3e40f3daf0419e8da6a3ed755f6635363a06d9f25 | f6518e014b51ef814126ccbd673b0aa0f83334c00d47fd327dbe9459652ab2e4 |

The Git HEAD also changed during the task. Additional refinement files appeared outside the seven allowed audit names. At the manifest scan, 1,037 of 1,042 pre-existing files matched; five differed, and 22 non-audit new files were present. The manifest records them separately. Extracted cognitive-engine/type/profile/persistence/routing sources retain their baseline hashes at the recorded scan; observed src changes are action-card/map presentation files and ScenarioFive.css. That narrower fact does NOT make the required all-source byte-identity check pass. No original bytes were overwritten to hide concurrent changes. Strict status is therefore FAIL, while extraction artifacts and isolated checks are complete.

## Seven new artifacts

- [scenario-cross-09d0-audit-report.md](scenario-cross-09d0-audit-report.md)
- [scenario-cross-09d0-cognitive-crosswalk.csv](scenario-cross-09d0-cognitive-crosswalk.csv)
- [scenario-cross-09d0-formula-comparison.md](scenario-cross-09d0-formula-comparison.md)
- [scenario-cross-09d0-user-run-storage-readiness.md](scenario-cross-09d0-user-run-storage-readiness.md)
- [scenario-cross-09d0-unique-fields.md](scenario-cross-09d0-unique-fields.md)
- [scenario-cross-09d0-source-hash-manifest.json](scenario-cross-09d0-source-hash-manifest.json)
- [scenario-cross-09d0-open-questions-factual.md](scenario-cross-09d0-open-questions-factual.md)

The manifest contains source bytes/hash inventory, observed concurrent changes, artifact hashes (excluding its own recursive digest), checks and limitations. Extraction stops here. No user button, combined cognitive dashboard, cross-run aggregation, formula change or semantic harmonization approval is implemented.
