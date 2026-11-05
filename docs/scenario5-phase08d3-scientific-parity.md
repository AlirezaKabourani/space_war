# Phase 08D.3 scientific parity — PASS

Before any application edit, docs/scenario5-phase08d3-baseline.json recorded the current HEAD (aed3b973c167b89011a30f2c8a0e76433c02ae95), pre-existing file hashes, exact allowed-source snapshots and the same 112 complete deterministic runs: 16 canonical worlds × seven valid player policy families, environmentSeed=1.

After implementation, all 112 full serialized simulation digests match exactly, with ZERO semantic mismatches. Separate cognitive, domain, mission (including hidden-world/Actor state), and evidence/telemetry bundle digests also match. Action/target traces and all event histories are included in the full run digest. No scientific parameter was changed to force screenshots.

All 63 protected scientific/calibration/legacy/archive hashes match the fresh pre-edit snapshot AND accepted historical scientific hashes. All other pre-existing files outside the four allowed UI/presentation files match their current phase-start hashes. Active id=5 routing, legacy id=2, S1/id=4, storage, profiles, admin and cross-scenario code are untouched.

The pre-edit corpus additionally recorded current AAR end state, narrative, direct facts, continuity rows, late evidence IDs and turning-point digests. All 112 AAR projections remain identical. The six genuine archived ending witnesses retain their original result/end-state identities; all ending explanation/resolver/turning-point function source preceding buildMissionAar is unchanged from this request's source snapshot. Older report prose is not used as a substitute for the current approved pre-edit source.

The new helper is a read-only projection; it imports existing model/AAR TYPES and existing label catalogs, with no game-engine execution. It refuses incomplete stages and mismatched run IDs before reading truth. All 23 pre-completion occurrences of the real 24-occurrence flow render no new section, HTML, title, aria attributes or tooltips; the last occurrence is complete. A real product browser playthrough added 45 live DOM inspections with no hidden truth reveal.

Two small guard changes were necessary in existing endingPresentation.ts and presentation.ts: malformed/missing/duplicate final belief records or invalid evidence-ID arrays no longer throw when old AAR outcome code reads a final snapshot. These are read-only array/shape checks; no model or telemetry field is filled. Valid canonical executions retain exactly the same outputs, as the full corpus proves.

Original verifyPresentation function: 32,798 assertions PASS. Its legacy witness artifact remains byte-identical. New verifier: 25,278 assertions PASS, including 42 malformed cases, numerical zero vs missing data, distinct stable IDs, canonical order, exact fresh/late set treatment, both real revised/unchanged belief trails and six ending witnesses.

Historical wrappers were run unchanged BEFORE and AFTER this feature:

- scripts/verify-s5-phase8d2-ux.tsx: FAIL; already failed before edits: AssertionError [ERR_ASSERTION]: App including legacy id=2 and active id=5 unchanged.
- scripts/verify-s5-phase09c1.tsx: FAIL; already failed before edits: AssertionError [ERR_ASSERTION]: Unchanged existing source src/ui/components/scenario/scenario-five/ui/ScenarioFiveMissionEnding.tsx.
- scripts/verify-s5-c2-refinement.tsx: FAIL; already failed before edits: AssertionError [ERR_ASSERTION]: Unchanged pre-existing file .gitignore.

These are pre-existing snapshot/hash blockers; neither historical baselines nor tests were rewritten. Their detailed before logs remain in baseline.json and after logs in focused-verification.json. PASS here refers to the new feature/scientific gates and the unchanged existing presentation tests, not a claim that all historical wrappers pass.

Reproduce: node node_modules/tsx/dist/cli.mjs scripts/verify-s5-phase08d3-belief-vs-reality.tsx.
