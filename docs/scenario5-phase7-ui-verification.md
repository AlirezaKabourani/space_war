# Scenario 5 Phase 7 — Player UI and AAR Verification

## 1. Completion summary

Phase 7, including the Phase-07A scientific UI/telemetry audit corrections and the Phase-07B presentation-only visual-usability correction, is complete. Scenario 5 now presents the frozen Phase-6 runtime as an RTL player flow with briefing, eight decision windows, safe evidence inspection, belief/reason capture, observable outcome review, and a completion-only eight-section AAR. Phase 07B localized the AAR attribution status, corrected RTL/LTR label-value collision, separated Actor audit IDs from Persian prose, normalized belief controls without telemetry changes, and added the smallest S5-owned mobile safe spacing. The briefing shows exactly once: `این زمان، ساعت عملیاتی داخل شبیه‌سازی است و با مدت واقعی اجرای بازی متفاوت است.` Phase 8 was not started.

## 2. Files changed/created

Rewritten presentation files: `ScenarioFiveSimulation.tsx`, `ScenarioFiveTypes.ts`, `ScenarioFiveActionCard.tsx`, `ScenarioFiveMap.tsx`, `ScenarioFiveResourcePanel.tsx`, `ScenarioFiveSummary.tsx`, and `ScenarioFive.css`.

Created UI adapters/components: `scenario-five/ui/uiContentFa.ts`, `runAssignment.ts`, `presentation.ts`, `ScenarioFiveEvidencePanel.tsx`, `ScenarioFiveBeliefPanel.tsx`, `ScenarioFiveReasonPanel.tsx`, and `index.ts`. Created `scripts/verify-s5-phase7-ui.ts`, this verification document, `docs/scenario5-phase7.patch`, and nine real browser captures under `docs/scenario5-phase7-screenshots/`. Phase 07B changed only `ScenarioFiveSummary.tsx`, `ScenarioFive.css`, `uiContentFa.ts`, `ScenarioFiveBeliefPanel.tsx`, the Phase-7 verifier/document/complete patch, and screenshot artifacts 04/07/09.

## 3. Frozen-file verification

The pre/post Phase-7 protected manifest contains 54 files and has aggregate SHA-256 `cc97a3396724a54ba9e22ad76e566204475dd8f4f8e9d79bd69983b606aad225` on both sides of the change. It covers every Phase-3, Phase-4, Phase-5, and Phase-6 Scenario-5 model source; every Scenario-2 source; Scenario-4 Cognitive V3 sources; `eventLogger.ts`; `App.tsx`; `App.css`; `MiniGameHost.tsx`; scenario registry/tree TypeScript files; and `package.json`.

## 4. Runtime integration verification

The UI delegates all state transitions to frozen runtime APIs. The implemented chain is action selection → optional target selection → decision confirmation → pre-outcome reason gate where required → mission commit → safe outcome review → next stage. Completion uses `calculateScenario5RuntimeResult` and does not call `onComplete` automatically.

## 5. Deterministic assignment verification

The UI uses the specified FNV-1a assignment key, canonical world ordering, nonzero seed fallback, and run-ID format. Known vectors pass, equal inputs reproduce equal assignments, `Math.random` is absent, and a deterministic corpus of 10,000 distinct keys reaches all 16 canonical worlds. This is a reachability check, not a claim of statistical randomization.

## 6. Player-information firewall verification

Pre-completion player views were serialized for all 16 initial worlds and checked for hidden truth, world/seed, Actor internals/objective/profile, hidden provenance, Actor delay decomposition, and option cognitive loadings. The Phase-7 verifier also checks non-completion logger payloads and outcome models against the same boundary. All checks pass.

## 7. Action/target UI verification

All 33 action IDs map exactly to the frozen catalog and have Persian title, description, and known effect. Cards expose only frozen cost, duration, and target semantics. Available actions deep-equal the Phase-6 selector. Required targets include active compromised convoys, exclude delivered convoys, and begin unselected; fixed-alpha cannot be overridden and disappears after alpha delivery. Target-only changes do not call `selectRuntimeAction`.

## 8. Resource/map/convoy UI verification

The resource panel shows only ISR capacity, support reserve, operational time, 360-minute horizon, and remaining time. The one-time briefing note explicitly separates this simulated operational clock from real player time; no duration, ETA, deadline, horizon, world-clock, or runtime timing logic changed. Frozen SHA-256 checks cover the Phase-4/6 timing sources. The existing Scenario-5 Iran map geometry is reused for the four canonical convoys. Cards show cargo/route/status/integrity/delay/projected arrival/deadline and known mitigation badges. No raw PNT exposure or hidden Actor/world field is presented.

## 9. Evidence-summary/detail verification

Collapsed cards expose only source, observed corridor, direction, and strength. Visible quality and limitation appear only after deliberate expansion during decision stages. Expansion and collapse call runtime evidence APIs; other stages receive read-only compact summaries. Hidden provenance is absent from the player detail model. The seven player-facing source labels now map one-to-one to the frozen source-type enum: in particular, `field_report` is `گزارش میدانی کاروان` and `radio_timing` is `تحلیل زمان‌بندی رادیویی`. Their labels are explicitly unequal, so the display ontology preserves the distinction used by frozen Cognitive V3 source-diversity mathematics.

## 10. Belief checkpoint UI verification

The exact four Phase-5 belief fields are rendered without defaults. All three numeric inputs enforce 0..100 and corridor selection is required. Phase 07B gives all fields a shared label/control structure, navy dark-theme controls, visible focus treatment, at least 42px control height, a desktop select of at least 240px, 135px centered numeric controls, and full-width stacking at 600px or below. Numeric display is explicitly LTR. Requiredness, empty initial state, submitted values, submit behavior, and telemetry are unchanged. No truth, Actor field, hidden relation, or cognitive score is shown at submission.

## 11. Pre-outcome reason UI verification

The exact seven reasons are rendered without a default. The confirmed action and player-selected/fixed target are shown before submission, while outcome information remains unavailable. The runtime commits Phase B/C/D mission decisions only after reason capture.

## 12. Outcome-review firewall verification

Outcome review contains only elapsed operational time, resource spend, player-safe convoy changes, newly activated known mitigations, and new-evidence count. Its serialized model contains no Actor reaction/pressure, primary-corridor truth, provenance, Actor-delay decomposition, end-state forecast, or cognitive result.

## 13. Hidden-tab timing verification

Visibility timing starts and resets only on decision-stage entry/exit. Tests cover a single interval, multiple/current intervals, and nondecision reset. `visibilitychange` wiring uses the shared monotonic clock and passes accumulated `hiddenTabMs` at confirmation.

## 14. eventLogger payload verification

All nine required `s5_v3_*` event names use scenario ID `s5_silent_waves_redesign`, node/user identity, and `detail.runId`. Start, action, evidence, decision, belief, reason, and outcome events are player-safe. Only completion contains world ID, seed, true corridor, Actor profile, mission result, cognitive result, domain result, and completeness. A per-run ref guards completion logging exactly once. Phase 07A mirrors every runtime confirmation-time evidence auto-closure into exactly one `s5_v3_evidence_closed` event with `runId`, `evidenceId`, `windowId`, and runtime `activeDwellMs`; these events precede an immediate decision event. The pure extractor considers only newly appended runtime close rows that were active before confirmation, so manually closed evidence is not double-logged.

## 15. AAR mission/truth verification

The AAR is rejected for incomplete runtime state and rendered only at `stage === "complete"`. Its first two sections provide the exact six-label mission end-state mapping, critical-delivery/network results, controlled-world disclaimer, truth corridor, Actor profile/posture/reaction audit, world ID, and seed. Every stat now uses independent label/value rows with a six-pixel gap and bidi-safe wrapping. Player-facing operational attribution is exactly `حل‌شده` or `حل‌نشده`; the raw enum is not rendered as AAR prose. `الگوی عامل مقابل` retains the approved Persian Actor-profile explanation, while final posture, reaction ID, world ID, and seed are explicit LTR monospace technical audit values separated from Persian prose.

## 16. AAR belief/evidence/decision verification

The belief table compares all four checkpoints with truth correctness only after completion. Evidence audit includes visible semantics, whether detail was opened, and hidden provenance. The decision timeline includes eight actions, effective targets, revisions, active time, resources, mission clock, and pre-outcome phase reasons.

## 17. AAR domain-metrics verification

The AAR reports the frozen Phase-6 GNSS/PNT, navigation integrity, critical delivery, logistics resilience, delay control, civilian-impact proxy, and network-balance metrics. Domain measures remain separate from cognitive constructs, and the civilian section retains its proxy disclaimer. Attribution localization is presentation-only and does not modify the Phase-4/6 enum or result value.

## 18. AAR cognitive-profile and limitations verification

The AAR reports data completeness, OSI orientation, phase orientation, construct values, and telemetry summaries without a global Cognitive Score. Information Discipline is explicitly reported as not measured. The signed relative-risk explanation is rendered only inside the `riskPosture` row; it is not a generic note for other constructs. The separate OSI helper remains unchanged and no good/bad bands were added. All six canonical method limitations are rendered exactly, including the separation of mission outcome from cognitive proxies and pending expert/human validation.

## 19. Responsive/accessibility/static UI verification

All styles are scoped under `.s5-`/`.s5-root`, RTL is retained, and breakpoints cover 1024, 768, 600, 480, and 390 pixels while the default layout supports 1280+. Page-level horizontal overflow is prevented, map/table containment is local, and modals scroll vertically. At 480px or below S5 owns an additional 4.5rem right-side safe inset so global fixed controls do not cover essential S5 inputs, buttons, or AAR values. Action/evidence controls are keyboard reachable, focus is visible, and selection uses text/checkmark and border thickness in addition to color. Raw `RuntimeStageId` values are never rendered in the player header; the chip uses only `تصمیم عملیاتی`, `ثبت برداشت`, `ثبت دلیل پیش از پیامد`, `مرور پیامد`, or `گزارش پس از اقدام`, with unknown IDs rejected. The stage-label regression now calls the real frozen `belief:A2_prebelief` stage, replacing the impossible `belief:CP1` fixture without changing the runtime model.

Real screenshots were captured from the running Vite application through installed headless Chrome at 100% browser zoom. Phase 07B recaptured 04, 07, and 09; the other six captures were preserved and rechecked. The longer desktop pages use full-page capture while retaining the stated 1440×900 browser viewport so all required panels remain reviewable. Automated capture checks confirmed empty belief controls with dark navy backgrounds and ≥42px heights, 30 structured AAR stats, four technical LTR values, no raw `unresolved`, no label/value collision, no page-level horizontal overflow, and a 72px mobile right inset. The images were also visually inspected for overlaps, hierarchy, and readability.

| Filename | Viewport | Runtime stage represented | Visual checks performed | Result |
|---|---:|---|---|---|
| `01-briefing-desktop.png` | 1440×900 | Briefing | Exact simulated-time note and start button visible; no overlap/clipping | PASS |
| `02-decision-desktop.png` | 1440×900 | `decision:A2_evidence_acquisition` | Resources, map/convoys, compact evidence, action cards, Persian stage chip | PASS |
| `03-evidence-expanded-desktop.png` | 1440×900 | A2 decision, one evidence expanded | Quality/limitation hierarchy visible; no provenance/truth | PASS |
| `04-belief-checkpoint-desktop.png` | 1440×900 | `belief:A2_prebelief` | RECAPPED: four empty dark-theme controls, readable label/control separation, disabled submit, no overflow | PASS |
| `05-reason-gate-desktop.png` | 1440×900 | `reason:B` | Confirmed action/target and seven empty reasons; no outcome | PASS |
| `06-outcome-review-desktop.png` | 1440×900 | `outcome_review` | Observable outcome only; no Actor truth, provenance, cognitive score, or forecast | PASS |
| `07-aar-desktop.png` | 1440×900 | Completed AAR | RECAPPED: separate stat labels/values, Persian `حل‌نشده`, and technical Actor IDs isolated from prose | PASS |
| `08-decision-mobile.png` | 390×844 | `decision:A2_evidence_acquisition` | No horizontal overflow; action cards remain readable/selectable | PASS |
| `09-aar-mobile.png` | 390×844 | Completed AAR | RECAPPED: no stat collision/overflow; 72px right safe inset keeps global controls off essential content | PASS |

These screenshots are visual-review evidence only. Their existence and this inspection are not expert validation, human validation, scientific validation, or proof that the UI is user-friendly.

## 20. Legacy Scenario-5 logic removal

Static checks confirm the active Scenario-5 UI no longer contains `mashhadIdentified`, `lateDiscoveryPenalty`, `secondaryConvoyStability`, `ambushRisk`, `gnssExposureRisk`, `ScenarioFiveDecisionWeights`, `supportActionIds`, legacy hidden-progress helpers, or the old energy resource display. The UI defines no cognitive formulas, Actor reaction rules, mission cost tables, or end-state thresholds.

## 21. Phase-3/4/5/6 regression results

- Phase 3: PASS — 86 assertions.
- Phase 4: PASS — 464 assertions.
- Phase 5: PASS — 388 assertions.
- Phase 6: PASS — 2,979 assertions.
- Phase 7: PASS — 562 assertions.

## 22. Typecheck/build/test exact commands and results

- `npx tsc -b` — PASS.
- `npm run build` — PASS; Vite transformed 118 modules. The existing chunk-size advisory remains non-fatal.
- `npx tsx scripts/verify-s5-phase3-model.ts` — PASS, 86 assertions.
- `npx tsx scripts/verify-s5-phase4-mission.ts` — PASS, 464 assertions.
- `npx tsx scripts/verify-s5-phase5-cognitive.ts` — PASS, 388 assertions.
- `npx tsx scripts/verify-s5-phase6-runtime.ts` — PASS, 2,979 assertions.
- `npx tsx scripts/verify-s5-phase7-ui.ts` — PASS, 562 assertions.
- `git -c core.autocrlf=false diff --check` — PASS.
- Phase-7 patch warning scan (`warning:`, LF/CRLF replacement warnings) — PASS, no contamination.
- `git apply --stat docs/scenario5-phase7.patch` — PASS.
- `git apply --check --reverse docs/scenario5-phase7.patch` — PASS against the completed working tree.

## 23. Known intentional omissions

- no admin/scientific aggregate dashboard integration
- no cross-scenario aggregation UI
- no expert validation
- no human validation
- no interpretation-band calibration
- no exhaustive 16-world × policy calibration in UI
- no claim of randomized controlled assignment
- no screenshot/browser-based human usability validation (real screenshots are visual-review evidence only)

## 24. Statement

Phase 07B was presentation-only. No mission, Actor, evidence, cognitive, domain, end-state, runtime-stage, world-assignment, or telemetry semantics were redesigned, and Phase 8 was not started.
