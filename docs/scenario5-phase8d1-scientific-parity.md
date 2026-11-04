# Phase 08D.1 scientific parity

**PASS — 112 deterministic complete runs; semantic mismatches: 0.**

The accepted docs/scenario5-phase8d-baseline.json is unchanged. The same 16 canonical worlds and seven player-valid policies are replayed with environmentSeed=1: balanced_network, priority_alpha, information_heavy, mobility_resilience, resource_preserver, high_response, low_response_reversible.

The complete SimulationRun digest matches exactly for every world/policy pair. This covers action sequences, targets, final mission/convoy/resource state, visible evidence IDs and order, attribution, containment, runtime events, domain results, cognitive telemetry and cognitive results. The original frozen progress function and the full monotonic progress effect also match their pre-correction source bytes. Only the mapping from that scalar to SVG coordinates changes for a visible committed reroute.

All 63 frozen hashes match. In particular, missionEngine, actionCatalog, mission config/selectors, endStateResolver, actorModel, evidenceModel, runtimeEngine, stageMachine, telemetryAdapter, domainMetrics, cognitiveEngine, evidenceScoring, optionProfiles, worldCatalog, worldFactory and calibration sources are unchanged. Legacy ScenarioTwo sources and the Phase-8B scientific archive remain unchanged.

The existing Phase-08D verifier passes 32798 presentation assertions and the same 112-run parity corpus. Its sole App expectation change is the exact approved resource-copy replacement in active id=5. This is a strict expected-text update, not a removal of the byte guard: all other App characters, routing and metadata still have exact equality checks. Dedicated AST/source checks also prove id=2, released IDs/title and routing unchanged.

Independent renderer checks prove equal progress, different in-transit coordinates, identical origin/destination, delivered-at-destination behavior and no mission mutation. The real-browser alpha witness has ETA T+235 and cumulative delay 25 minutes both before and after the correction, as recorded against the accepted Phase-08D screenshot inspection data. Actual rendered alternate-route coordinates match within 0.001 SVG units.

Escort changes are limited to presentation strings and history visibility. The tests cover the real R7 applied-and-expired transition, its next stage, a real still-valid R8 escort window and suppression of stale expiry labels for an active event. Belief/reason fields, timing semantics, action costs and budgets are untouched.

No model change, resource rebalance, action change, new end state, cognitive change, new probability, calibration or live hidden-truth exposure is introduced.
