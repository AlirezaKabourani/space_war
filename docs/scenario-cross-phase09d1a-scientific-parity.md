# Phase 09D-1A scientific parity

No scientific, actor, mission, evidence, domain, world, Cognitive V3, end-state or legacy scenario module was edited. The three application edits are presentation/storage plumbing. Existing scientific IDs, timestamps, telemetry collection and result computation remain intact.

`scenario-cross-phase09d1a-scientific-verification.json` records 159 protected file hashes: all match the current preflight baseline. This includes S1 models/adjudicators/moves/actors/narrative, S2 models/calibration, scenario trees, legacy simulation code, pre-existing verification scripts and Git/LFS configuration. The overall final verification separately confirms that all other pre-existing source/config files are unchanged except the three authorized presentation components.

S1: unchanged `validate-s4-cognitive-v3.mjs` passes before and after, reporting 60 unit tests plus anchor paths, hidden-state independence, AAR consistency, country naming, end-state consistency and distribution audits. Source hashing confirms the entire V3 engine and option profiles remain identical.

S2: the 16-world × 7 player-valid-policy corpus at environment seed 1 was regenerated using the unchanged scientific simulation driver. All 112 full-run digests and the cognitive/domain/mission/evidence digests exactly match `scenario5-phase09c1-baseline-corpus.json`. Semantic mismatches: **0**. The new runtime validator accepts all 112 canonical cognitive results without mutation. The unchanged Phase-6 runtime verifier passes **2,979 assertions** before and after.

## Historical verifier failures, kept separate

The before and after copies retain the user's pre-existing dirty-tree changes. Historical tools execute in disposable filesystem mirrors, preserving their exact source and historical baselines; no repository baseline is rewritten to manufacture a pass.

| Historical verifier | Before / after | First failure in both |
| --- | --- | --- |
| 08D integrated gameplay | FAIL / FAIL | App identity differs from its old frozen App text |
| 08D.2 header | FAIL / FAIL | App routing/metadata frozen-text mismatch |
| 08D.2 UX | FAIL / FAIL | Existing App frozen-text mismatch |
| 09C-1 | FAIL / FAIL | Existing `ScenarioFiveMissionEnding.tsx` hash differs from the old baseline |
| 09C-2 | FAIL / FAIL | Same existing `ScenarioFiveMissionEnding.tsx` frozen hash mismatch |

The first failure messages and exit statuses are the same before/after. App and MissionEnding hashes are unchanged by this phase. These tools stop before their later assertions, so their complete historical assertion sets are not claimed as passing. Independent current 112-run parity and model hashes establish the scientific result separately.

`validate-profiles.ts` and `validate-system-management.ts` pass unchanged before/after. Whole-repository lint has **140 errors and 3 warnings** before/after with identical issue lists; targeted lint for all new/changed application and test files passes. Production build and TypeScript project check pass, with Vite's existing large-bundle advisory. Detailed logs are in `scenario-cross-phase09d1a-checks/` and the historical verification JSON.
