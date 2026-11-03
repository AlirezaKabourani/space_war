# Current screen-by-screen journey

This describes what the existing runtime/UI does. No replacement text or proposed mechanics are included.

## Before runtime

1. In the released catalog, the player sees «۲ — امواج خاموش» (display index2, internal object5). Collapsed card uses preview truncated at140 characters; expanded uses fullDescription. Clicking its CTA logs the existing outer scenario start.
2. Outer introduction uses id5 introTitle/introText; the briefing is mounted behind this modal. «شروع» dismisses only the intro.
3. Internal briefing has وضعیت/آنچه می‌دانید/آنچه هنوز نمی‌دانید/قاعده تصمیم, clock clarification and inline glossary. «آغاز مأموریت» calls deterministic assignment from profile ID+Date.now, creates runtime and logs s5_v3_run_started. No action is preselected.

## 1. decision:A1_baseline_monitoring — R1

- Just done: started the mission.
- Now shows: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟». پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟
- Runtime purpose: Confirm immediately commits mission; then outcome review. No score displayed.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: outcome_review.

## 2. outcome_review — R1

- Just done: left decision:A1_baseline_monitoring.
- Now shows: «پیامد قابل مشاهده — راند 1». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: belief:A2_prebelief.

## 3. belief:A2_prebelief — R1

- Just done: left outcome_review.
- Now shows: «برداشت اولیه — پیش از بررسی تکمیلی». این ثبت، نقطه مبنای برداشت شماست. هنوز اطلاعات کامل ندارید و پایین‌بودن اطمینان کاملاً طبیعی است. فقط بر اساس شواهدی که تا این لحظه دیده‌اید پاسخ دهید؛ در مرحله بعد می‌توانید بررسی اطلاعاتی بیشتری انجام دهید.
- Runtime purpose: No mission time/resource mutation. Inputs initially null and corridor unselected. Header round refers to last committed decision; hidden world/Actor/provenance/scores remain unavailable.
- Information available: all current evidence read-only; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: their own current corridor and targeted-interference beliefs from visible evidence; no correctness feedback.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select one corridor and enter all three real slider values; ثبت برداشت و ادامه.
- Next: decision:A2_evidence_acquisition.

## 4. decision:A2_evidence_acquisition — R2

- Just done: left belief:A2_prebelief.
- Now shows: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟». نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟
- Runtime purpose: Confirm immediately commits mission; then outcome review. No score displayed.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: outcome_review.

## 5. outcome_review — R2

- Just done: left decision:A2_evidence_acquisition.
- Now shows: «پیامد قابل مشاهده — راند 2». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: belief:A2_postbelief.

## 6. belief:A2_postbelief — R2

- Just done: left outcome_review.
- Now shows: «بازنگری برداشت — پس از شواهد جدید». بررسی اطلاعاتی مرحله قبل ممکن است تصویر شما را تغییر داده باشد یا تغییر نداده باشد. با توجه به شواهد فعلی، برداشت خود را دوباره ثبت کنید.
- Runtime purpose: No mission time/resource mutation. Inputs initially null and corridor unselected. Header round refers to last committed decision; hidden world/Actor/provenance/scores remain unavailable.
- Information available: read-only recent-investigation / previous groups; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: their own current corridor and targeted-interference beliefs from visible evidence; no correctness feedback.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select one corridor and enter all three real slider values; ثبت برداشت و ادامه.
- Next: decision:B1_monitoring_allocation.

## 7. decision:B1_monitoring_allocation — R3

- Just done: left belief:A2_postbelief.
- Now shows: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟». ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟
- Runtime purpose: Confirm immediately commits mission; then outcome review. No score displayed.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: outcome_review.

## 8. outcome_review — R3

- Just done: left decision:B1_monitoring_allocation.
- Now shows: «پیامد قابل مشاهده — راند 3». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: decision:B2_route_policy.

## 9. decision:B2_route_policy — R4

- Just done: left outcome_review.
- Now shows: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟». در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟
- Runtime purpose: Confirm defers mission mutation until reason; then commit consumes resources, adds base20+duration, effects/Actor/evidence/status. R8 finalizes at T+360.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: reason:B.

## 10. reason:B — R4

- Just done: left decision:B2_route_policy.
- Now shows: «دلیل اصلی تصمیم». پیش از مشاهده پیامد تصمیم، اصلی‌ترین دلیل انتخاب خود را مشخص کنید.
- Runtime purpose: Map/resources remain PRE-decision until reason submitted; confirmed action/target shown as read-only context.
- Information available: all current evidence read-only; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: the main reason for the already confirmed action, before knowing the consequence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select exactly one reason; ثبت دلیل و اجرای تصمیم.
- Next: outcome_review.

## 11. outcome_review — R4

- Just done: left reason:B.
- Now shows: «پیامد قابل مشاهده — راند 4». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: decision:C1_support_and_checkpoints.

## 12. decision:C1_support_and_checkpoints — R5

- Just done: left outcome_review.
- Now shows: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟». برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟
- Runtime purpose: Confirm immediately commits mission; then outcome review. No score displayed.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: outcome_review.

## 13. outcome_review — R5

- Just done: left decision:C1_support_and_checkpoints.
- Now shows: «پیامد قابل مشاهده — راند 5». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: decision:C2_resource_portfolio.

## 14. decision:C2_resource_portfolio — R6

- Just done: left outcome_review.
- Now shows: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟». ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟
- Runtime purpose: Confirm defers mission mutation until reason; then commit consumes resources, adds base20+duration, effects/Actor/evidence/status. R8 finalizes at T+360.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: reason:C.

## 15. reason:C — R6

- Just done: left decision:C2_resource_portfolio.
- Now shows: «دلیل اصلی تصمیم». پیش از مشاهده پیامد تصمیم، اصلی‌ترین دلیل انتخاب خود را مشخص کنید.
- Runtime purpose: Map/resources remain PRE-decision until reason submitted; confirmed action/target shown as read-only context.
- Information available: all current evidence read-only; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: the main reason for the already confirmed action, before knowing the consequence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select exactly one reason; ثبت دلیل و اجرای تصمیم.
- Next: outcome_review.

## 16. outcome_review — R6

- Just done: left reason:C.
- Now shows: «پیامد قابل مشاهده — راند 6». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: belief:C_belief_checkpoint.

## 17. belief:C_belief_checkpoint — R6

- Just done: left outcome_review.
- Now shows: «به‌روزرسانی برداشت — پس از تغییر وضعیت». با توجه به شواهد و روند مأموریت تا این لحظه، برداشت فعلی خود را ثبت کنید.
- Runtime purpose: No mission time/resource mutation. Inputs initially null and corridor unselected. Header round refers to last committed decision; hidden world/Actor/provenance/scores remain unavailable.
- Information available: all current evidence read-only; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: their own current corridor and targeted-interference beliefs from visible evidence; no correctness feedback.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select one corridor and enter all three real slider values; ثبت برداشت و ادامه.
- Next: decision:D1_crisis_response.

## 18. decision:D1_crisis_response — R7

- Just done: left belief:C_belief_checkpoint.
- Now shows: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟». با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟
- Runtime purpose: Confirm immediately commits mission; then outcome review. No score displayed.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: outcome_review.

## 19. outcome_review — R7

- Just done: left decision:D1_crisis_response.
- Now shows: «پیامد قابل مشاهده — راند 7». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: belief:D_final_belief.

## 20. belief:D_final_belief — R7

- Just done: left outcome_review.
- Now shows: «برآورد نهایی — پیش از سیاست تحویل». پیش از تصمیم نهایی تحویل، آخرین برداشت خود از محل و ماهیت اختلال را ثبت کنید.
- Runtime purpose: No mission time/resource mutation. Inputs initially null and corridor unselected. Header round refers to last committed decision; hidden world/Actor/provenance/scores remain unavailable.
- Information available: all current evidence read-only; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: their own current corridor and targeted-interference beliefs from visible evidence; no correctness feedback.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select one corridor and enter all three real slider values; ثبت برداشت و ادامه.
- Next: decision:D2_final_delivery_policy.

## 21. decision:D2_final_delivery_policy — R8

- Just done: left belief:D_final_belief.
- Now shows: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟». برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟
- Runtime purpose: Confirm defers mission mutation until reason; then commit consumes resources, adds base20+duration, effects/Actor/evidence/status. R8 finalizes at T+360.
- Information available: local summaries; explicit open reveals visible quality/limitation; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: which currently affordable action and legal target to select with current resources/evidence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select an action; choose a target only for required-target actions; confirm.
- Next: reason:D.

## 22. reason:D — R8

- Just done: left decision:D2_final_delivery_policy.
- Now shows: «دلیل اصلی تصمیم». پیش از مشاهده پیامد تصمیم، اصلی‌ترین دلیل انتخاب خود را مشخص کنید.
- Runtime purpose: Map/resources remain PRE-decision until reason submitted; confirmed action/target shown as read-only context.
- Information available: all current evidence read-only; map=current safe runtime map; resources=current ISR/support; clock=current T+ clock and remaining horizon.
- What the player is asked to infer: the main reason for the already confirmed action, before knowing the consequence.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: select exactly one reason; ثبت دلیل و اجرای تصمیم.
- Next: outcome_review.

## 23. outcome_review — R8

- Just done: left reason:D.
- Now shows: «پیامد قابل مشاهده — راند 8». اقدام اجراشده / اطلاعات تازه / تغییرات قابل مشاهده
- Runtime purpose: All mission effects already applied. Continue only changes runtime chronology/stage. Final R8 pending evidence may arrive after final belief.
- Information available: NEW evidence read-only; full set remains mounted on obscured map; map=mounted under blurred blocking modal; resources=spent in modal; header obscured; clock=before→after operational minutes.
- What the player is asked to infer: which observable quantities and evidence changed after the action.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ادامه.
- Next: complete.

## 24. complete — R8

- Just done: left outcome_review.
- Now shows: «امواج خاموش — تحلیل اجرای مأموریت». این گزارش، یک تحلیل پس از اقدام برای همین اجرای سناریو است.
- Runtime purpose: Hidden truth and domain/cognitive results may now be shown; completion UI hides host stop control.
- Information available: all evidence with true provenance after completion; map=false; resources=historical resource transitions in AAR; clock=decision history.
- What the player is asked to infer: the recorded mission/domain outcome and context-dependent cognitive proxies separately.
- Unavailable during live play: world identity/seed, true primary, Actor internal state/objective, provenance relation, decomposed Actor delay, end-state forecast and cognitive scores. At AAR these are revealed only to the extent currently rendered.
- Required continuation: ثبت پایان و بازگشت, which actually advances to the outer end node.
- Next: outer end after AAR finish.

## After the AAR

«ثبت پایان و بازگشت» invokes ScenarioFiveSimulation.finish → MiniGameHost onComplete → ScenarioRunner goToNext('end'). The player then sees «پایان مرحله», the current tree summary referencing ambush risk, and «پایان سناریو». Only the latter invokes outer onExit/finish flow. This additional screen is not a runtime stage. It is captured as browser33.
