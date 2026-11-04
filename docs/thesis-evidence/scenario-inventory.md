# Scenario and educational-module inventory — فهرست سناریوها و ماژول‌های آموزشی

خلاصه فارسی: مخزن شامل شش تعریف اجرایی است، اما کاربر عادی فقط مسیر آموزشی S0 و دو سناریوی بازطراحی‌شده S4 و S5 را می‌بیند. S1 تا S3 نسخه‌های قدیمی/آزمایشی‌اند و باید در پایان‌نامه با همین وضعیت معرفی شوند، نه به‌عنوان بخش انتشار‌یافته فعلی.

## Catalog truth

Six executable scenario definitions exist. The released player catalog exposes S0, S4, and S5 as display entries 0, 1, and 2; the full catalog exposes all six (`src/scenarios/index.ts:3-25`; `src/App.tsx:303-336`). Therefore “Scenario 1” and “Scenario 2” in the released UI refer to redesigned code IDs S4 and S5, not legacy S1 and S2.

| Code ID | Internal title/function | Released? | Implementation status |
|---|---|---:|---|
| `s0_gateway_space_wargaming` | Guided foundations course + concept laboratory | Yes | Implemented |
| `s1_shadows_low_orbit` | 12-round orbital decision simulation | Full catalog only | Implemented legacy |
| `s2_silent_waves` | 8-round GNSS/logistics simulation | Full catalog only | Implemented legacy; superseded in released catalog by S5 |
| `s3_secure_corridor` | Three-area tactical dungeon | Full catalog only | Implemented prototype/legacy |
| `s4_redesigned_scenario_one` | Three-move orbital crisis simulator | Yes, displayed as Scenario 1 | Implemented redesigned model |
| `s5_silent_waves_redesign` | Four-phase/eight-decision logistics simulator | Yes, displayed as Scenario 2 | Implemented redesigned model; human validation pending |

## S0 — Gateway to Space Wargaming

**Objective.** Teach interaction with an opponent, wargaming as pre-crisis rehearsal, zero/non-zero-sum and incomplete-information concepts, and their application to space systems. The five visible chapter labels are defined at `src/ui/components/scenario/scenario-zero/learningContent.ts:159`; lesson content and real examples are at `:161-235`.

**Stages.** The declarative path includes seven information/example lessons, fourteen quiz nodes, a four-round concept lab, and a final node. Node sequence and types are visible in `src/scenarios/s0_gateway_space_wargaming/tree.ts:14-517`. The concept lab rounds are: classification of game type, action/reaction, incomplete information, and integrated concepts (`MiniGameHost.tsx:85-415`).

**Decision mechanics and actions.** Quiz options have explicit `isCorrect` flags and feedback; selections and confirmation are logged (`ScenarioZeroLearning.tsx:139-153`). The concept lab permits answer selection/change, optional explanation opening, then confirmation; it records correctness, response time, changes, explanation time, and concept tags (`MiniGameHost.tsx:470-609,827-888`).

**State/resources/environment.** State is pedagogical progress, current node/card, answer, reading gate, and interaction timing. There is no adversarial state, resource economy, seeded environment, or mission loss condition. Accuracy and behavioral heuristics are analytics, not psychological tests.

**Status/limitations.** Implemented and browser-tested in archived scripts/screenshots. Historical examples are content assertions rather than citations: the source gives example labels (`learningContent.ts:30-96`) but does not embed bibliographic references, so factual academic use needs external sourcing.

## S1 — Shadows in Low Orbit (legacy)

**Objective and structure.** A 12-round simulation asks the player to interpret an unknown satellite, allocate sensing, manage warning/communication, and contain escalation. The wrapper is a minigame plus end node (`src/scenarios/s1_shadows_low_orbit/tree.ts:3-24`); the 12 round definitions and four options per round are embedded at `src/ui/components/scenario/ScenarioOneSimulation.tsx:358-504`.

**State variables.** `infoCoverage`, `escalationRisk`, `operationalReadiness`, `remainingResources`, `ambiguity`, and `informationExposureRisk`; initial values are created at `ScenarioOneSimulation.tsx:183-190` and the type is at `:8-15`.

**Available action families.** Sensor focus/readiness/warning/observe; intent interpretation; selection of motion/signal/history data; local-versus-pattern sensing; deterrent/sensor-lock/delay/warning; alert posture; private/public communication; noisy-data verification; data sharing; and terminal posture. Exact option IDs, text, deltas, and cognitive weights are the `rounds` table at `:358-504`.

The complete S1 option-ID inventory, four per round, is: R1 `r1_focus_sensor`, `r1_raise_readiness`, `r1_indirect_warning`, `r1_observe_only`; R2 `r2_direct_threat`, `r2_probe_test`, `r2_routine_maneuver`, `r2_need_more_data`; R3 `r3_motion_data`, `r3_signal_data`, `r3_behavior_history`, `r3_act_now`; R4 `r4_near_threat_focus`, `r4_pattern_analysis`, `r4_split_capacity`, `r4_save_sensor`; R5 `r5_deterrent_maneuver`, `r5_sensor_lock_only`, `r5_short_delay`, `r5_high_level_warning`; R6 `r6_full_alert`, `r6_limited_silent_alert`, `r6_continue_analysis`, `r6_reduce_sensitivity`; R7 `r7_no_message`, `r7_public_ambiguous`, `r7_private_controlled`, `r7_public_severe_warning`; R8 `r8_act_on_current_data`, `r8_second_sensor`, `r8_reassess_analysis`, `r8_ignore_noise`; R9 `r9_share_none`, `r9_share_full`, `r9_share_limited`, `r9_deceptive_data`; R10 `r10_immediate_avoidance`, `r10_track_hold_path`, `r10_small_low_signal_maneuver`, `r10_message_before_maneuver`; R11 `r11_increase_presence`, `r11_long_term_model`, `r11_deconfliction_channel`, `r11_mixed_posture`; R12 `r12_close_controlled`, `r12_covert_monitoring`, `r12_active_threat`, `r12_future_protocol` (`ScenarioOneSimulation.tsx:358-504`).

**Mechanics.** One option is confirmed per round. State deltas are clamped and applied at `:738-755`; information-exposure side effects depend on the action and exposure mode at `:226-280`; threshold events fire at exposure 45/60/75 (`:322-355`). Round 5 has a 45-second timeout that auto-selects the deterrent option (`:1288-1313`).

**Opponent/environment.** Scene changes are deterministic functions of round/action using a string-derived hash (`makeOption`, `:506-563`); no stochastic draw is used. Nine narrative labels are resolved by ordered conditions (`:758-850`).

**Status.** Implemented legacy scenario. Its option weights and “cognitive” labels have no expert/human validation artifact in this repository.

## S2 — Silent Waves (legacy)

**Objective and structure.** Manage four convoys through eight rounds of GNSS ambiguity, route choice, monitoring, logistics support, resource allocation, and threat response. Round/action definitions are at `src/ui/components/scenario/ScenarioTwoSimulation.tsx:98-798`; data types are at `ScenarioTwoTypes.ts:3-233`.

**State/resources.** Resources include ISR, energy, and time; mission state includes convoy status/health/progress, secondary stability, reserve, ambiguity, GNSS exposure, threat identification, ambush risk, logistics continuity, critical delivery, and navigation integrity. Initial map, routes, convoys, resources, and status are at `ScenarioTwoSimulation.tsx:29-80,803-815`.

**Actions.** Each round exposes a fixed catalog of main/support actions. The UI selects one main action and up to two support actions, subject to affordability; option effects and proxy weights are declared per action at `:98-708`, with round availability at `:709-798`.

All S2 action IDs are: `routine_routes`, `routine_gnss`, `routine_radio`, `routine_preserve`, `scan_all_nodes`, `scan_mashhad`, `scan_tehran`, `scan_tabriz`, `scan_bandar`, `wait_normal`, `alpha_special_monitoring`, `balanced_monitoring`, `alpha_only_focus`, `normal_routine`, `route_main_heavy_watch`, `route_northern`, `route_staged`, `pause_alpha`, `more_checkpoints`, `fewer_stops`, `dispatch_ground_support`, `prioritize_secondary`, `alpha_priority`, `balanced_resources`, `preserve_final_resources`, `sacrifice_delta`, `emergency_safe_route`, `attack_signal_source`, `deception_route`, `fast_escort`, `final_guide`, `final_ground_support`, `final_no_action`, `support_alpha_radio`, `support_secondary_check`, `support_mashhad_quick`, and `support_medical_dest` (`ScenarioTwoSimulation.tsx:98-708`).

**Mechanics/environment.** State is deterministic. Resource subtraction and derived state are calculated at `:838-930`; additional narrative/mission side effects are at `:1120-1255`. The four terminal outcome classes are resolved at `:1273-1288`. No random number or seed is used.

**Status.** Implemented legacy version. It is not the released “Silent Waves” entry, which is S5. Its OSI is an unsigned 0–100 average and is not comparable to the signed S1/S4/S5 orientation indices.

## S3 — Secure Corridor

**Objective.** Escort a sensitive cargo through three partially visible areas using orbital scan, tactical cards, route choices, and upgrades (`src/App.tsx:248-268`; `ScenarioThreeDungeon.tsx:141-217`).

**Areas/stages.** `area_1` teaches movement/scan/cards; `area_2` emphasizes exposure and active threats; `area_3` emphasizes incomplete/noisy data (`ScenarioThreeDungeon.tsx:141-217`). Manhattan-adjacent movement reveals tiles; an exit advances to an upgrade gate (`:349-430,516-568`).

**State/resources.** Cargo health 100, elapsed time 0, satellite energy 80, exposure 15, and data confidence 55 (`:110-116`), plus position, revealed tiles, cards, abilities, round, active challenge, and upgrades (`:287-300`).

**Available actions.** Move to adjacent normal/shortcut/safe/intel/threat/exit tiles; orbital scan; temporarily mark a safe route; consume one-use cards (`instant_scan`, `signal_decoy`, `emergency_cover`, `route_analysis`, `data_recovery`); resolve ground/air/noise challenges; choose upgrades. Exact card/ability definitions are at `:118-131`, challenge options/effects at `:219-260`, and upgrades at `:265-270`.

**Opponent/environment.** Tile layout and challenge effects are fixed. No adaptive opponent or randomness exists. Failure occurs when `cargoHealth <= 0` or `exposure >= 100`; success requires reaching the final exit (`:510-571`).

**Status/limitations.** Implemented prototype. Events and resource changes are logged (`:309-337`), but no implemented cognitive composite or formal AAR calculation was found.

## S4 — Redesigned Scenario 1 / orbital crisis

**Objective.** Control a gray-zone orbital crisis while balancing mission continuity, attribution confidence, escalation, coalition cohesion, information exposure, legitimacy, readiness, and four finite resources. Released label mapping is at `src/App.tsx:269-278,303-307`.

**Stages and decisions.** Three moves contain nine core decision windows plus rationale/attribution/off-ramp inputs. Window IDs are typed at `src/ui/components/scenario/scenario-four/model/types.ts:100-135`; option catalogs begin in `.../moves/move1.ts:10-71` and the corresponding move 2/3 files. Each move captures choices, rationale, evidence interaction, decision timing, player attribution estimates, actor/inject consequences, and a summary; the final move produces a report and AAR (`ScenarioFourRedesignedScenarioOne.tsx:1426-1500,1628-2043`).

**State/resources/hidden information.** Visible, resource, knowledge, and hidden partitions are explicit (`model/types.ts:18-81`). Default resources are SSA 85, protection 85, political capital 85, disclosure budget 75 (`model/initialState.ts:3-18`). Hidden truth includes one of five red intents with weights 30/25/20/15/10 and incident attribution; initialization is at `model/initialState.ts:20-78`.

**Available action families.** Move 1: information collection, protective posture, communication. Move 2: investigation, mission response, escalation response. Move 3: evidentiary threshold, course of action, information policy, and optional off-ramp. Exact IDs and deltas are in `scenario-four/moves/` and `scenario-four/adjudication/`.

All S4 player action IDs are:

| Window | Action IDs | Definition |
|---|---|---|
| M1 information | `m1_i_passive`, `m1_i_dedicated_ssa`, `m1_i_commercial`, `m1_i_allied_network` | `scenario-four/narrative/narrativeCatalogFa.ts:251-254` |
| M1 protection | `m1_p_hold`, `m1_p_covert_readiness`, `m1_p_visible_protection`, `m1_p_mission_reposition` | `:257-260` |
| M1 communication | `m1_c_none`, `m1_c_private`, `m1_c_allies`, `m1_c_public_warning`, `m1_c_private_allied` | `:263-267` |
| M2 investigation | `m2_a_technical_diagnostics`, `m2_a_second_sensor`, `m2_a_ally_intel`, `m2_a_commercial_validation`, `m2_a_act_with_current_data` | `:392-396` |
| M2 mission | `m2_m_continue_normal`, `m2_m_activate_fallback`, `m2_m_reduce_load`, `m2_m_protective_reconfiguration`, `m2_m_split_service` | `:399-403` |
| M2 response | `m2_r_no_counteraction`, `m2_r_request_explanation`, `m2_r_private_warning`, `m2_r_joint_allied_response`, `m2_r_request_defensive_authority`, `m2_r_deconfliction_offer` | `:406-411` |
| M3 threshold | `m3_t_insufficient`, `m3_t_sufficient_limited`, `m3_t_sufficient_strong` | `:585-587` |
| M3 course of action | `m3_coa_contain_understand`, `m3_coa_controlled_deterrence`, `m3_coa_coordinated_response`, `m3_coa_negotiated_deescalation`, `m3_coa_unilateral_strong` | `:590-594` |
| M3 information | `m3_info_keep_restricted`, `m3_info_share_allies`, `m3_info_public_partial`, `m3_info_public_attribution` | `:597-600` |
| M3 off-ramp | `accept_as_interim`, `renegotiate_terms`, `keep_channel_open_no_commitment`, `reject` | `:603-606` |

Move-specific rationale choices are also player inputs (`narrativeCatalogFa.ts:272-277,416-422,611-618`) but do not directly change the S4 primary ending resolver.

**Opponent/environment.** Red, ally, and commercial actors use deterministic rules plus seeded tie/noise selection (`actors/redActor.ts:11-94`; `actors/allyActor.ts:3-25`; `actors/commercialActor.ts:3-10`; `adjudication/seededRandom.ts:4-56`). Conditional injects and actor consequences occur after each move (`adjudication/adjudicator.ts:147-342`; `move2Adjudicator.ts`; `move3Adjudicator.ts:282-373`).

**Endings.** Ordered resolver conditions yield nine possible primary endings: `escalation_spiral`, `intelligence_failure`, `coalition_fracture`, `negotiated_deescalation`, `calm_crisis_control`, `costly_deterrence`, `persistent_ambiguity`, `strategic_information_opportunity`, and `mixed_crisis_containment` (`move3Adjudicator.ts:441-498`). Archived exhaustive artifacts show every ending reachable; qualification is in `testing-and-validation.md`.

**Status/limitations.** Implemented and extensively engineering-tested. Its expert-panel version is explicitly `provisional-unvalidated`, and distribution warnings identify low discrimination/variance or ceiling effects (`model/cognitiveOptionProfilesV3.ts:3-27`). It is a cognitive-proxy model, not a validated psychometric instrument.

## S5 — Redesigned Silent Waves

**Objective.** Maintain a four-convoy logistics network, construct a defensible information picture, protect the priority medical convoy, and manage PNT/GNSS interference under limited ISR/support resources (`src/App.tsx:280-299`).

**Stages.** Four phases and eight decisions: A1 baseline monitoring, A2 evidence acquisition, B1 monitoring allocation, B2 route policy, C1 support/checkpoints, C2 resource portfolio, D1 crisis response, D2 final delivery policy. Four belief checkpoints, three rationale gates, and outcome-review stages are interleaved by `RUNTIME_STAGE_SEQUENCE` (`scenario-five/model/runtime/stageMachine.ts:8-44`).

**World/opponent.** The hidden world is the Cartesian product of four corridors and four actor profiles (16 templates): cautious denial, deceptive diversion, opportunistic interdiction, and pressure escalation (`model/worldCatalog.ts:9-72`). `createWorld` adds seeded background anomaly and evidence latency (`model/worldFactory.ts:19-51`). Actor response is rule-based and deterministic after world creation (`model/actorModel.ts:14-133`).

**State/resources.** Initial ISR capacity and support reserve are both 100; horizon is 360 minutes; convoy baseline arrival/deadline/integrity are explicit (`model/mission/config.ts:4-23`). State includes four convoys, visible evidence, pending evidence, resources, phase/round/clock, true world, attribution status, action/actor event history, beliefs, reason telemetry, decision telemetry, and domain records (`model/mission/types.ts`; `model/runtime/types.ts:21-247`).

**Actions.** There are 33 actions across eight rounds. They cover network/focused/rotating monitoring, evidence collection, route policy, fallback navigation, ground recon/checkpoints, ISR/mobility/balanced resource portfolios, emergency response, and final delivery policy. Every action's target requirement, ISR/support cost, duration, delay effect, evidence request, response intensity, and flags are declared at `model/mission/actionCatalog.ts:30-71`. Required-target actions also select a corridor.

Complete S5 action inventory:

| Round/window | Action IDs |
|---|---|
| 1 / A1 | `a1_network_baseline`, `a1_priority_focus`, `a1_rotating_watch`, `a1_preserve_reserve` |
| 2 / A2 | `a2_focused_pnt`, `a2_broad_sweep`, `a2_field_radio`, `a2_ground_liaison` |
| 3 / B1 | `b1_suspect_focus`, `b1_priority_cargo`, `b1_split_attention`, `b1_pulse_network` |
| 4 / B2 | `b2_continue_crosscheck`, `b2_reroute`, `b2_staged_checkpoints`, `b2_hold_verify` |
| 5 / C1 | `c1_fallback_nav`, `c1_ground_recon`, `c1_checkpoint_spacing`, `c1_preserve_mobile_reserve` |
| 6 / C2 | `c2_isr_heavy`, `c2_mobility_heavy`, `c2_balanced`, `c2_priority_surge` |
| 7 / D1 | `d1_emergency_reroute`, `d1_ground_containment`, `d1_deception_routing`, `d1_escorted_continuation`, `d1_hold_confirm` |
| 8 / D2 | `d2_critical_delivery_surge`, `d2_network_balanced_finish`, `d2_resilient_handoff`, `d2_continuity_first_finish` |

The authoritative cost/effect rows are `scenario-five/model/mission/actionCatalog.ts:31-70`; this table intentionally does not duplicate numeric values that could drift from the source.

**Decision mechanics.** The runtime records selection and evidence interaction, requires confirmation, captures beliefs/reasons at designated stages, steps the mission engine, exposes only player-visible projections, and advances to outcome review (`model/runtime/runtimeEngine.ts:148-457`). The mission engine applies cost/time/effects, actor response, operational impact, evidence latency, convoy updates, and finalization (`model/mission/missionEngine.ts:61-428`).

**Endings.** Six active terminal IDs are resolved in priority order at `model/mission/endStateResolver.ts:11-111`: critical cargo lost/compromised; priority delivered with network degradation; mission incomplete but continuity preserved; delivery complete with threat persistent; delivery complete with attribution unresolved; delivery complete with threat contained.

**Status/limitations.** Implemented redesigned scenario. Measurement status is explicitly `experimental_pending_expert_and_human_validation`, and calibration is `engineering_audit_not_human_validated` (`model/cognitive/versions.ts:1-7`; `calibration/versions.ts:1-2`). Current verifier artifacts include two infrastructure/source-freeze failures even though core phase verifiers and the archived Phase 8B calibration report pass; see `testing-and-validation.md`.

## Planned, partial, and unverified items

- Empty scoring/store/time/storage-adapter files are scaffolds, not features (listed in `system-architecture.md`).
- S3 has behavioral event logging but no formal cognitive score/AAR implementation: partial analytics only.
- S4 snapshots are persisted, but no general decision-replay engine that re-simulates an arbitrary saved trace was found.
- S5 has an AAR and deterministic replay tests, but an in-progress run is not hydrated from storage after refresh.
- Educational effectiveness, construct validity, transfer of learning, reliability, and operational realism are unverified by human-subject evidence in this repository.
