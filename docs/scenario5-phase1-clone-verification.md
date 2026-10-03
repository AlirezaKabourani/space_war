# Scenario 5 Phase 1 — Clone & Isolation Verification

Date: 2026-10-03

## Completion result

Phase 1 is complete. The current Scenario 2 baseline was cloned into an independently named and styled Scenario 5 implementation. No scientific, narrative, gameplay, scoring, threshold, mission, or adjudication redesign was performed.

## Scenario 5 availability

Scenario 5 was available for this phase.

- Before this phase, `src/scenarios/` had folders only for Scenario 0 through Scenario 4.
- `src/scenarios/index.ts` had no Scenario 5 ID, import, or registry entry.
- `MiniGameHost.tsx` had no Scenario 5 mini-game.
- The only Scenario 5 content was the unimplemented UI placeholder card in `src/App.tsx`:
  - numeric slot: `5`
  - title: `افق ناپایدار`
  - no tree
  - no simulation files
  - no registry entry
- Therefore, no real implemented Scenario 5 existed and nothing was overwritten.

## Exact Scenario 2 → Scenario 5 mapping

| Existing Scenario 2 source | Isolated Scenario 5 clone |
|---|---|
| `src/ui/components/scenario/ScenarioTwoSimulation.tsx` | `src/ui/components/scenario/ScenarioFiveSimulation.tsx` |
| `src/ui/components/scenario/ScenarioTwoTypes.ts` | `src/ui/components/scenario/ScenarioFiveTypes.ts` |
| `src/ui/components/scenario/ScenarioTwoActionCard.tsx` | `src/ui/components/scenario/ScenarioFiveActionCard.tsx` |
| `src/ui/components/scenario/ScenarioTwoMap.tsx` | `src/ui/components/scenario/ScenarioFiveMap.tsx` |
| `src/ui/components/scenario/ScenarioTwoResourcePanel.tsx` | `src/ui/components/scenario/ScenarioFiveResourcePanel.tsx` |
| `src/ui/components/scenario/ScenarioTwoSummary.tsx` | `src/ui/components/scenario/ScenarioFiveSummary.tsx` |
| `src/scenarios/s2_silent_waves/tree.ts` | `src/scenarios/s5_silent_waves_redesign/tree.ts` |
| Scenario 2 rules inside `src/App.css` | `src/ui/components/scenario/ScenarioFive.css` |

Shared immutable assets remain shared:

- `assets/s2/A1.png`
- `public/images/scenario2.png`
- `public/vendor/iranmap/iranmap.svg`

Shared generic infrastructure remains shared, including `eventLogger` and `ResourceState`.

## Registry and routing files changed

- `src/scenarios/index.ts`
  - imports `S5_SilentWavesRedesign`
  - adds `s5_silent_waves_redesign` to `ScenarioId`
  - registers the tree in `AllScenarios`
- `src/core/types/scenario.ts`
  - adds the independent mini-game ID `s5_gnss_logistics_simulation`
- `src/ui/components/scenario/MiniGameHost.tsx`
  - imports and mounts `ScenarioFiveSimulation`
  - adds the Scenario 5 mini-game ID to its accepted union
- `src/App.tsx`
  - maps numeric slot 5 to `s5_silent_waves_redesign`
  - replaces the unused `افق ناپایدار` placeholder card with the cloned Silent Waves entry
  - includes Scenario 5 in the same full-screen play-shell conditions used by the current Scenario 2

Scenario 2 registration was not edited or removed.

## Unique identities changed

| Identity | Scenario 2 | Scenario 5 clone |
|---|---|---|
| tree/scenario ID | `s2_silent_waves` | `s5_silent_waves_redesign` |
| mini-game registry ID | `s2_gnss_logistics_simulation` | `s5_gnss_logistics_simulation` |
| analytics mini-game detail ID | `s2_gnss_logistics_simulation_v2` | `s5_gnss_logistics_simulation_v2` |
| decision event | `s2_decision` | `s5_decision` |
| allocation event | `s2_resource_allocation` | `s5_resource_allocation` |
| summary event | `s2_cognitive_summary` | `s5_cognitive_summary` |
| component/type prefix | `ScenarioTwo*` | `ScenarioFive*` |
| CSS prefix | `s2-*` | `s5-*` |
| displayed title | `سناریو ۲ — امواج خاموش` | `امواج خاموش — نسخه بازطراحی` |

Telemetry field meanings and payload formulas were not changed.

## CSS isolation

Scenario 2 CSS was not edited. Its complete Scenario-2-specific rule sets were duplicated into `ScenarioFive.css`, including responsive rules and animation keyframes, with `s2` identifiers mechanically renamed to `s5`.

Verification:

- Scenario 5 stylesheet selectors with `.s5-`: 403 occurrences
- Scenario 2 selectors/keyframes remaining in Scenario 5 stylesheet: 0
- `ScenarioFiveSimulation.tsx` imports only `ScenarioFive.css` for the cloned component styling.
- `src/App.css` before and after SHA-256 is identical.

## Scenario 2 SHA-256 before/after

| Scenario 2 file | Before | After | Result |
|---|---|---|---|
| `src/ui/components/scenario/ScenarioTwoSimulation.tsx` | `9165644ff753ff728f5dc387edfd9ecda3e859904486fb94b3d0ed8197235b31` | `9165644ff753ff728f5dc387edfd9ecda3e859904486fb94b3d0ed8197235b31` | identical |
| `src/ui/components/scenario/ScenarioTwoTypes.ts` | `ee8b24caf4bc52a6eba4516232958b918ebd8667958dfa5b26a2fd8e742ac455` | `ee8b24caf4bc52a6eba4516232958b918ebd8667958dfa5b26a2fd8e742ac455` | identical |
| `src/ui/components/scenario/ScenarioTwoActionCard.tsx` | `f7822f1b4567329d35fbc2e2a699b5ae528fd0ea775271f78b1dd324678ed027` | `f7822f1b4567329d35fbc2e2a699b5ae528fd0ea775271f78b1dd324678ed027` | identical |
| `src/ui/components/scenario/ScenarioTwoMap.tsx` | `0eb6412dad7d4e2c3359b6e946149438a8d22a1701d66025e5948e488f5ccd41` | `0eb6412dad7d4e2c3359b6e946149438a8d22a1701d66025e5948e488f5ccd41` | identical |
| `src/ui/components/scenario/ScenarioTwoResourcePanel.tsx` | `7e1d2a5d2c28f36f665f34f108632fd7df540bc29cf786d72a9e5983b06572d8` | `7e1d2a5d2c28f36f665f34f108632fd7df540bc29cf786d72a9e5983b06572d8` | identical |
| `src/ui/components/scenario/ScenarioTwoSummary.tsx` | `769e8ab65b336fe2201158dd3eb2d605053bd056a34573626e7769b55c137152` | `769e8ab65b336fe2201158dd3eb2d605053bd056a34573626e7769b55c137152` | identical |
| `src/scenarios/s2_silent_waves/tree.ts` | `920ae74ba46f152613f09f45bf3b0b7ed2a45196ac026aaa176d78e5e3017495` | `920ae74ba46f152613f09f45bf3b0b7ed2a45196ac026aaa176d78e5e3017495` | identical |
| `src/App.css` (contains current Scenario 2 CSS) | `f65d94aed8c646568b69240e5f94558083590d145646af9a51e86bac606c05b7` | `f65d94aed8c646568b69240e5f94558083590d145646af9a51e86bac606c05b7` | identical |

## Scenario-2-only git diff

Command:

```powershell
git diff -- src/ui/components/scenario/ScenarioTwoSimulation.tsx src/ui/components/scenario/ScenarioTwoTypes.ts src/ui/components/scenario/ScenarioTwoActionCard.tsx src/ui/components/scenario/ScenarioTwoMap.tsx src/ui/components/scenario/ScenarioTwoResourcePanel.tsx src/ui/components/scenario/ScenarioTwoSummary.tsx src/scenarios/s2_silent_waves/tree.ts src/App.css
```

Result: empty output. Scenario 2 remained byte-for-byte unchanged.

## Behavioral baseline verification

The six cloned implementation files were compared against an expected mechanical transformation of their Scenario 2 source. Every comparison passed exactly after accounting only for:

- `ScenarioTwo*` → `ScenarioFive*`
- `s2-*` → `s5-*`
- Scenario-specific analytics IDs
- independent stylesheet import
- displayed identity/title and map accessibility label

Code inspection confirmed parity:

| Baseline property | Scenario 2 | Scenario 5 |
|---|---:|---:|
| rounds | 8 | 8 |
| unique action catalogue entries | 38 | 38 |
| initial resources | ISR 80 / energy 80 / time 100 | same |
| mission-state formulas | current baseline | identical |
| final resolver | current four-result resolver | identical |
| cognitive/scoring heuristic | current baseline | identical |
| telemetry payload semantics | current baseline | identical; event namespace only changed |

Scenario 5 is behaviorally still the current Scenario 2 baseline.

## Commands and results

### Typecheck

Command: `npx tsc -b`

Result: **PASS**, exit code 0, no console diagnostics.

### Build

Command: `npm run build`

Result: **PASS**, exit code 0. Vite 7.2.2 transformed 83 modules and completed the production build. The existing chunk-size warning was emitted; it did not fail the build.

### Existing test command

Command: `npm run test:s4-models`

Result: **FAIL at command-launch infrastructure**, exit code 1.

All validators executed before the final command reported `passed`, including model validation, 60 cognitive unit tests, anchor paths, full-path regression, narrative phases 1–6, the 10,000-run seeded QA, AAR/Brier UX, and attribution-confidence validation. The final package-script command could not launch because the locally declared `tsx` executable is missing:

```text
'tsx' is not recognized as an internal or external command,
operable program or batch file.
```

Supplemental execution of that existing final validator:

Command: `npx tsx scripts/validate-s4-resource-calibration.ts`

Result: **PASS**, exit code 0; all 14 resource-calibration checks passed.

No Scenario 5-specific test framework or tests were added in Phase 1.

### Diff hygiene

Command: `git diff --check`

Result: **PASS**, exit code 0. Only Git line-ending conversion notices were printed.

## Deviations

There is no gameplay or behavioral deviation from the current Scenario 2 baseline.

The intentional identity/isolation deviations are limited to:

- Scenario 5 tree, mini-game, component, telemetry-event, and CSS identifiers;
- display title `امواج خاموش — نسخه بازطراحی`;
- replacement of the unused numeric Scenario 5 placeholder card;
- a dedicated imported stylesheet for `s5-*` selectors;
- reuse of immutable Scenario 2 visual assets instead of duplicating them.

Phase 2 has not begun.
