# Scenario 4 Model V2 — validation boundary

The operational–strategic index is a scenario-specific behavioral proxy. It is not a personality diagnosis or a validated psychometric trait measure.

## Implemented construct

- Each of the nine core decision windows uses separate operational and strategic loadings.
- Option differences are centered and normalized inside their own decision window.
- Per-move indices use diagnostic weights; the overall index is the exact mean of the three move indices.
- Reason capture, the optional off-ramp, response time, outcome, hidden intent, and random seed do not shift the core index.
- Integration, cross-move stability, and interpretation confidence are reported separately.

## Validation sequence before stronger scientific claims

1. At least three independent SMEs in wargaming, strategic studies, and space/security operations score every option for operational loading, strategic loading, and diagnosticity.
2. Compute inter-rater reliability (ICC or an appropriate agreement statistic). An ICC of at least 0.75 is desirable; low-agreement items must be rewritten or recoded.
3. Run the deterministic 100,000-run random baseline with `npm run test:s4-models`. The absolute random mean must remain below 0.02.
4. Pilot with 30–50 runs, then calibrate with 100+ runs. Inspect distribution, floor/ceiling effects, item discrimination, move consistency, and scenario-variant sensitivity.
5. Evaluate test–retest and variant robustness before using the result beyond an after-action learning aid.

The coefficients in `orientationModelV2.ts` are an initial expert-coding matrix and remain provisional until this process is complete.
