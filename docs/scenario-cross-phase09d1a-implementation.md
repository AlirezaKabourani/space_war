# Phase 09D-1A implementation

Scope: completed cognitive-run archive, immutable attempt ownership, independent logging policies. Released S1 is product 4 (`s4_redesigned_scenario_one`); released S2 is product 5 (`s5_silent_waves_redesign`). No combined-dashboard button, comparison, harmonization, composite score, model change, or Phase 09D-1B/09D-2 work was added.

The user's attached Phase 09D-1A contract was applied. The two 09D-1 design-decision files were absent. Existing 09D-0 readiness/crosswalk materials were read as evidence, not as permission to infer historical ownership or scientific requirements.

## Preflight and change boundary

Original HEAD: `09d591120ef50b5b1f10de983a9862735629e79f`. No commit, reset, revert, clean, LFS change or normalization was performed. The workspace already contained six modified application files and numerous untracked audit/evidence files. `App.tsx` and `App.css` had substantial prior deletions; these were preserved. Prior 09D-0 evidence documented earlier `.gitattributes` activity; at this phase's baseline it was empty, matched HEAD, and remained unchanged. No `.lfsconfig` existed. `.git/config` was hashed and preserved.

Repeated hashes of 250 existing source/script/config files were stable before implementation. Existing processes were the shared Vite dev server, RStudio language server and Codex; no changing source writer was observed. This establishes the current workspace as the baseline, without claiming it is a clean historical checkout. The full initial status, diff stat and hashes are in `scenario-cross-phase09d1a-baseline.json`.

Only three existing application files were edited:

- `src/ui/components/admin/SystemManagement.tsx`: independent archive policy control and precise storage/backup/reset disclosures.
- `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx`: attempt owner capture after introductory screens, direct completed V3 callback and storage status.
- `src/ui/components/scenario/ScenarioFiveSimulation.tsx`: attempt capture at real Start, archive call after authoritative runtime completion and storage status.

Five application files were added:

- `src/services/storage/cognitiveArchivePolicy.ts`
- `src/services/storage/cognitiveRunValidation.ts`
- `src/services/storage/cognitiveRunRepository.ts`
- `src/services/storage/completedCognitiveAttempt.ts`
- `src/ui/components/scenario/CognitiveArchiveDisclosure.tsx`

All other pre-existing source/script/config hashes are unchanged, including `eventLogger`, `systemLogger`, exporters, profile storage, system backup/reset, MiniGameHost, ScenarioRunner, App and the six pre-existing application modifications. Tests and documentation are separate additions.

## Completion and ownership

S1 binds the actual `userProfileId` prop to an existing immutable profile ID when entering the real briefing after the six introductory screens. A new UUID persistence identity is separate from the existing global scientific run ID. In `confirmMove3Reason`, the existing adjudicator and `calculateCognitiveModelV3` run unchanged; the archive receives the same in-memory `cognitiveV3` reference attached to the newly completed snapshot. It never reads the shared `final.snapshot` or legacy events as input. Saving occurs before legacy snapshot writes so a legacy localStorage quota error cannot suppress the independent archive attempt.

S2 binds the owner and new UUID immediately after assigning/creating the real runtime on Start. The existing completion effect still calculates the same result once. Its separate archive call requires `stage.stageId === 'complete'` and `attempt.sourceRunId === runtime.runId === result.runId === result.cognitive.runId`. The exact `result.cognitive` is saved without recomputation. The existing completion log remains independently governed by eventLogger.

An immutable live-attempt handle prevents an absent/deserialized/forged handle from entering the completion adapters. No preview component calls these adapters. The validation rejects explicit preview/demo/fixture IDs, legacy scenarios, malformed/partial cognitive objects and version mismatches. This is provenance plumbing within this browser, not tamper resistance against same-origin JavaScript.

Changing the current profile does not change an attempt's owner. The storage status is hidden when the rendered profile differs from the captured owner. Missing/deleted owners fail closed. Orphaned records are retained without reassignment; profile deletion and old retention policies are unchanged.

## Validation and verification

See `scenario-cross-phase09d1a-verification.json` for final counts and status. Browser checks use a disposable Chromium profile on a dedicated origin. Admin controls are exercised in the actual App after the normal admin login. Real S1/S2 runs then use production components from their initial states, normal button/radio/keyboard input and StrictMode in an explicitly marked test host. No runtime/result state is injected, and no installed user's storage is opened. Adversarial schema/quota/corruption checks operate only on that isolated test database.

S1's existing scientific verifier passes 60 unit tests and its model/anchor/independence audits. S2's existing runtime verifier passes 2,979 assertions. All 112 accepted S2 scientific runs have identical full-run, cognitive, domain, mission and evidence digests. The new validators accept all 112 canonical outputs without mutation. Protected hashes remain unchanged.

Build/typecheck pass. Changed/new application and test files pass targeted lint. Whole-repository lint has the same 140 errors and three warnings before and after. Five historical 08D/09C verifiers fail identically against pre-existing App/MissionEnding baseline mismatches; they were run in isolated mirrors, without rewriting repository baselines or verifier output artifacts. These are not reported as passing.

## Reproduction and artifacts

Run from the repository root:

```powershell
node scripts/verify-cross-phase09d1a-browser.mjs
npx tsx scripts/verify-cross-phase09d1a-scientific.ts
node scripts/check-cross-phase09d1a-history.mjs
npm run build
```

The history runner reconstructs pre-edit application bytes from `scenario-cross-phase09d1a-before-application-files.json` and runs historical tools in disposable mirrors. Its status describes regression parity, not a claim that failing historical tools passed. Browser execution requires Chrome/Edge at the tested Windows locations. The test host is a development-only script entry and is not imported by the production application.

The patch is relative to the captured dirty workspace and excludes unrelated pre-existing changes. The repository also contains the storage contract, logging separation report, scientific parity report, machine verification, genuine completion witness JSON, before/after logs and seven real browser captures. The stop boundary remains Phase 09D-1A.
