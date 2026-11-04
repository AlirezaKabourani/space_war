# 09C-1 — null, zero and current-run boundary verification

Status: PASS in `scripts/verify-s5-phase09c1.tsx`. Browser witnesses are recorded separately in `scenario5-phase09c1-screenshots/inspection.json`.

The original scientific result is never modified for these cases. Isolated presentation fixtures are written to `scenario5-phase09c1-visual-fixtures.json`, loaded only by `scripts/scenario5-phase09c1-witness.html?fixture=...`, and labeled **TEST ONLY** visibly. The normal product run uses its actual result.

| Case | Verified rendering / behavior |
| --- | --- |
| OSI −0.5 / 0 / +0.5 | Marker at 25% / 50% / 75%; explicit signed two-decimal value; negative left = operational, positive right = strategic. |
| OSI null | No marker; exact insufficient-data text. Available phase values remain visible. UI never averages the phases. |
| Risk −0.5 / 0 / +0.5 / null | Same signed axis placement/null rule, separate risk axis; no 0–100 score conversion. |
| Construct 0 | Actual `0.00 / 100`, meter aria-valuenow=0, zero-length fill. |
| Construct null / ERU null | Exact insufficient-data message; no meter/fill. No inference of poor updating. |
| Completeness 0 / partial | `0.00٪` and `62.50٪` render as data coverage; available values are not suppressed. |
| Strengths measured 0, integration null | The two real zeros remain values, integration remains unavailable. No UI harmonic calculation. |
| Revision rate 0 | Real `0.00٪`; no missing-opportunity message. |
| Revision rate null | Exact «در این اجرا فرصت واجد شرایط برای محاسبه این نرخ ثبت نشد.» |
| Information discipline | Exactly one «انضباط اطلاعاتی: در نسخه فعلی این سناریو سنجیده نمی‌شود.» note. No scored card/bar. |
| Median / IQR null vs 0 | Null uses insufficient-data text; actual 0ms displays `0.0 ثانیه`. `1500ms` displays `1.5 ثانیه`. |
| Missing runtime/result | Truthful unavailable screen, no dashboard score and no global retrieval. |
| Incomplete stage | Unavailable even if another completed result is supplied. |
| Runtime/result/cognitive run ID mismatch | Unavailable for each of the three mismatch cases. |
| Domain/ending access trap | The current-run cognitive gate succeeds while forbidden domain/ending getters throw if accessed. |
| Passive rendering | Rendering every normal corpus result leaves its complete serialized run unchanged. |

The source firewall excludes global analytics, engine calls, option-profile calculations, hidden-state input, event logging and localStorage access from the cognitive dashboard and its pure presentation module. The Summary routes to an existing AAR/technical view only via explicit navigation; those reports are not score sources.

The four phase labels and nine construct definitions are copied from approved Appendix A. Each measured construct has a native keyboard-accessible definition disclosure. Actual browser axis placement is also checked against numeric values and physical LTR track coordinates.
