# Scenario 5 Phase 07D — Initial Marker Deconfliction Verification

## Completion and scope

Phase 07D is complete. This is a narrow presentation-only correction layered on the accepted Phase 07C console. No mission, Actor, evidence, cognitive, runtime, domain, calibration, action, timing, resource, ETA, route, scoring, end-state, telemetry, or AAR semantic was changed. Phase 8B was not started.

Changed implementation/QA files:

- `src/ui/components/scenario/ScenarioFiveMap.tsx`
- `scripts/verify-s5-phase7-ui.ts`
- `scripts/capture-s5-phase7c.mjs`

No CSS, simulation orchestration, model source, Phase-3/4/5/6 verifier, Scenario 2 source, `eventLogger`, or AAR content was edited.

## Exact deconfliction behavior

`ORIGIN_DECONFLICTION` contains only:

- alpha: `{ x: 0, y: -12 }`
- delta: `{ x: 0, y: 12 }`

The accepted Phase-07C desired and monotonic visual-progress formulas remain unchanged. Route interpolation is calculated first as `routePoint`. The presentation-only separation weight is then calculated as `clamp(1 - progress / 0.08, 0, 1)`. The offset is applied only when producing `displayPoint`, which alone supplies the SVG transform.

At progress 0, alpha and delta differ by exactly 24 SVG units while remaining attached visually to the common Tehran origin. At progress 0.08 and above, the separation weight is zero. No offset or display point is persisted, exposed through a player-view adapter, logged, or supplied to runtime, telemetry, AAR, scoring, domain metrics, cognitive measurement, or calibration.

## Real-browser QA

Chrome headless was driven through the DevTools protocol. The two captures and machine-readable inspection are in `docs/scenario5-phase7d-screenshots/`.

### Initial T+0 capture

- Screenshot: `01-initial-1440x900.png`
- Visible convoy IDs: alpha, beta, gamma, delta.
- Visible convoy count: 4.
- Distinct marker transforms: 4.
- Alpha SVG center: `(428, 188)`.
- Delta SVG center: `(428, 212)`.
- Alpha/delta SVG-center separation: 24 units.
- Alpha/delta rendered screen-center separation: 22.6625 px at this viewport/map scale.
- `scrollHeight / viewport height`: `900 / 900`.
- `scrollWidth / viewport width`: `1440 / 1440`.
- Controls are physically left of the map.

### Post-action capture

- Screenshot: `02-after-action-1440x900.png`
- Visible convoy count: 4.
- Movement from the initial transforms: confirmed.
- Alpha visual progress: `0.14285714285714285`.
- Delta visual progress: `0.11952191235059761`.
- Both are above 0.08.
- Their SVG centers match ordinary route interpolation within 0.01 SVG unit; temporary offsets are zero.
- `scrollHeight / viewport height`: `900 / 900`.
- `scrollWidth / viewport width`: `1440 / 1440`.
- Controls remain left and the map remains right.

## Player-information firewall

The new constant and intermediate separation variables occur only in `ScenarioFiveMap.tsx`. Inputs remain limited to player-visible convoy identity/status, player-visible projected arrival, and the player-visible operational clock. The map still contains no hidden world truth, primary affected corridor, Actor profile/internal state, or hidden evidence provenance. `eventLogger.ts` remains byte-identical with SHA-256 `7faa68531a38bd3a56facb5e73a7c4e4f5d1e13f4906218ee56147dacd1103b1`.

## Verification results

- Typecheck (`npx tsc -b`): passed.
- Production build (`npm run build`): passed; 118 modules transformed. The existing Vite large-chunk advisory remains non-fatal.
- Phase 3 verifier: passed, 86 assertions.
- Phase 4 verifier: passed, 464 assertions.
- Phase 5 verifier: passed, 388 assertions.
- Phase 6 verifier: passed, 2979 assertions.
- Phase 7 verifier: passed, 600 assertions. All 590 Phase-07C assertions remain, with 10 Phase-07D assertions added.
- `git -c core.autocrlf=false diff --check`: passed.

Model, runtime, cognitive, domain, and calibration versions and semantics remain unchanged.
