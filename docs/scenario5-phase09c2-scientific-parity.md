# 09C-2 scientific parity: PASS

Reproduction: `node node_modules/tsx/dist/cli.mjs scripts/verify-s5-phase09c2.tsx`.

- 112 complete deterministic simulations: all 16 catalog worlds × seven valid player-policy families, environmentSeed=1.
- Zero mismatches against both the accepted 08D corpus and the full 09C-1 corpus. Full simulation-object hashes and separate cognitive, domain, mission and evidence/telemetry digests match exactly.
- All 63 frozen file hashes match the original scientific baseline. Existing S1/id=4, legacy S2/id=2, all gameplay/map code, Summary callbacks, same-run gate and App routing are byte-identical to the start of 09C-2.
- All 40 typed scalar leaves equal the unchanged field-to-UI map. Nine construct labels/definitions and their grouping remain exactly approved. The presentation helper itself is byte-identical; SHA-256 d1c55c6b2e152548f6a0b306636913acf9fe44a9978de4a3b172defcefde8f91.
- No score formula, risk normalization, new metric, aggregate score or scientific interpretation was added. The spectrum palette is directional only.

The unchanged 09C-1 verifier was executed before and after this phase. It fails at the same historical `src/App.tsx` hash assertion, caused by the previously authorized temporary admin shortcut. That assertion runs before its scientific corpus; therefore it cannot be cited as a passing scientific check. The independent 09C-2 verifier ran the entire corpus and preserved all pre-existing files except the two allowed presentation files. Logs: scenario5-phase09c2-09c1-before.txt and scenario5-phase09c2-09c1-after.txt. No historical baseline, test or App file was altered to hide the failure.
