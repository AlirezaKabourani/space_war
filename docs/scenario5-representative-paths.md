# Representative current paths — actual extracted traces

Research document: world/profile/primary fields below were HIDDEN during play. All environment seeds are 1; M10 uses current missionEffectivePolicySeed(worldIndex,1,1001). Timings/beliefs/reasons are those of existing calibration policies, not human behavior. No oracle/stress policy was used. Only three end-state IDs occur in this requested seed-1 corpus; no unobserved end state is fabricated.

| traceId | policy | hiddenActor | hiddenPrimary | endState |
| --- | --- | --- | --- | --- |
| M1-W01-E1 | balanced_network | cautious_denial | corridor_alpha_east | delivery_complete_threat_persistent |
| M10-W08-E1 | M10_uniform_random | pressure_escalator | corridor_beta_south | priority_delivered_network_degradation |
| M2-W14-E1 | priority_alpha | deceptive_diversion | corridor_delta_west | delivery_complete_attribution_unresolved |
| M3-W11-E1 | information_heavy | opportunistic_interdiction | corridor_gamma_northwest | priority_delivered_network_degradation |
| M4-W01-E1 | mobility_resilience | cautious_denial | corridor_alpha_east | delivery_complete_attribution_unresolved |
| M5-W01-E1 | resource_preserver | cautious_denial | corridor_alpha_east | delivery_complete_threat_persistent |
| M6-W01-E1 | high_response | cautious_denial | corridor_alpha_east | delivery_complete_threat_persistent |
| M7-W01-E1 | low_response_reversible | cautious_denial | corridor_alpha_east | delivery_complete_threat_persistent |

## M1-W01-E1 — balanced_network

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش مبنای سراسری» (a1_network_baseline); target none.
- Visible consequence: T+0→T+30; ISR 100→84; support 100→100. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 4; تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+30; ISR 84; support 100; 4 visible evidence. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پویش سراسری چندکریدوری» (a2_broad_sweep); target none.
- Visible consequence: T+30→T+68; ISR 84→62; support 100→100. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 4; تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+68; ISR 62; support 100; 8 visible evidence. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تقسیم توجه بین کریدورها» (b1_split_attention); target none.
- Visible consequence: T+68→T+100; ISR 62→46; support 100→100. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 4; تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+100; ISR 46; support 100; 12 visible evidence. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «حرکت مرحله‌ای با نقاط کنترل» (b2_staged_checkpoints); target کریدور شرقی / کاروان الف.
- Visible consequence: T+100→T+136; ISR 46→46; support 100→90. alpha: moving, I=100, delay=25, ETA=T+235; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+136; ISR 46; support 90; 14 visible evidence. alpha: moving, I=100, delay=25, ETA=T+235; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «نقاط کنترل و فاصله‌گذاری حرکت» (c1_checkpoint_spacing); target کریدور جنوبی / کاروان ب.
- Visible consequence: T+136→T+171; ISR 46→46; support 90→80. alpha: moving, I=100, delay=28, ETA=T+238; beta: moving, I=100, delay=10, ETA=T+245; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 1; گزارش میدانی کاروان / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+171; ISR 46; support 80; 15 visible evidence. alpha: moving, I=100, delay=28, ETA=T+238; beta: moving, I=100, delay=10, ETA=T+245; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «سبد متوازن شبکه» (c2_balanced); target none.
- Visible consequence: T+171→T+201; ISR 46→36; support 80→70. alpha: moving, I=100, delay=31, ETA=T+241; beta: moving, I=100, delay=10, ETA=T+245; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ گزارش میدانی کاروان / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+201; ISR 36; support 70; 20 visible evidence. alpha: moving, I=100, delay=31, ETA=T+241; beta: moving, I=100, delay=10, ETA=T+245; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «توقف و تأیید نهایی» (d1_hold_confirm); target کریدور شرقی / کاروان الف.
- Visible consequence: T+201→T+241; ISR 36→28; support 70→70. alpha: moving, I=100, delay=54, ETA=T+264; beta: moving, I=100, delay=10, ETA=T+245; gamma: delivered, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+241; ISR 28; support 70; 21 visible evidence. alpha: moving, I=100, delay=54, ETA=T+264; beta: moving, I=100, delay=10, ETA=T+245; gamma: delivered, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایان متوازن شبکه» (d2_network_balanced_finish); target none.
- Visible consequence: T+241→T+360; ISR 28→28; support 70→60. alpha: delivered, I=100, delay=52, ETA=T+262; beta: delivered, I=100, delay=5, ETA=T+240; gamma: delivered, I=100, delay=0, ETA=T+225; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل و تداوم شبکه کامل؛ تهدید مهار نشد»; continuity 100%; alpha integrity 100; alpha ETA 262; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-balanced_network-W-corridor_alpha_east-cautious_denial-1-none",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": 0.3829378156137173,
    "operationalStrength": 58.75,
    "strategicStrength": 78.75,
    "integration": 67.29545454545455,
    "dispersion": 0.20379523151981294,
    "phaseScores": [
      0.11475409833915604,
      0.5290383841514446,
      0.2631342136297392,
      0.6248245663345293
    ]
  },
  "constructs": {
    "informationSeeking": 51.74999999999999,
    "secondOrderThinking": 67.625,
    "adversaryModeling": 60,
    "escalationSensitivity": 60,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": 30.666666666666664,
    "resourceStewardship": 70.625,
    "planningForesight": 76.6875,
    "multiDomainIntegration": 32.13518309332631,
    "riskPosture": -0.5951566951566952,
    "decisionCoherence": 82.06666666666666
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 200,
    "iqrActiveDecisionMs": 0,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_alpha_east-cautious_denial, cautious_denial, true primary corridor_alpha_east, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

## M10-W08-E1 — M10_uniform_random

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش چرخشی شبکه» (a1_rotating_watch); target none.
- Visible consequence: T+0→T+30; ISR 100→88; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=99, delay=2, ETA=T+237; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; گزارش میدانی کاروان / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور جنوبی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور جنوبی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ گزارش میدانی کاروان / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+30; ISR 88; support 100; 5 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=99, delay=2, ETA=T+237; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «اعزام رابط زمینی» (a2_ground_liaison); target کریدور شرقی / کاروان الف.
- Visible consequence: T+30→T+70; ISR 88→88; support 100→88. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=95, delay=9, ETA=T+244; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+70; ISR 88; support 88; 5 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=95, delay=9, ETA=T+244; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش ویژه محموله پزشکی» (b1_priority_cargo); target کریدور شرقی / کاروان الف.
- Visible consequence: T+70→T+98; ISR 88→78; support 88→88. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=88, delay=23, ETA=T+258; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; بررسی زمینی / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+98; ISR 78; support 88; 7 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=88, delay=23, ETA=T+258; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «ادامه مسیر با تطبیق و ناوبری پشتیبان» (b2_continue_crosscheck); target کریدور شرقی / کاروان الف.
- Visible consequence: T+98→T+126; ISR 78→74; support 88→80. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=81, delay=37, ETA=T+272; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 1; گزارش میدانی کاروان / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+126; ISR 74; support 80; 8 visible evidence. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=81, delay=37, ETA=T+272; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «حفظ ذخیره متحرک» (c1_preserve_mobile_reserve); target none.
- Visible consequence: T+126→T+151; ISR 74→74; support 80→80. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=74, delay=51, ETA=T+286; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+151; ISR 74; support 80; 8 visible evidence. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=74, delay=51, ETA=T+286; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «سبد تاب‌آوری حرکتی» (c2_mobility_heavy); target none.
- Visible consequence: T+151→T+181; ISR 74→70; support 80→62. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=68, delay=62, ETA=T+297; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+181; ISR 70; support 62; 8 visible evidence. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=68, delay=62, ETA=T+297; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «مهار زمینی منبع اختلال» (d1_ground_containment); target کریدور شمال‌غربی / کاروان ج.
- Visible consequence: T+181→T+226; ISR 70→70; support 62→40. alpha: delivered, I=100, delay=5, ETA=T+215; beta: moving, I=62, delay=73, ETA=T+308; gamma: moving, I=100, delay=15, ETA=T+240; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+226; ISR 70; support 40; 8 visible evidence. alpha: delivered, I=100, delay=5, ETA=T+215; beta: moving, I=62, delay=73, ETA=T+308; gamma: moving, I=100, delay=15, ETA=T+240; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایان با اولویت تداوم شبکه» (d2_continuity_first_finish); target none.
- Visible consequence: T+226→T+360; ISR 70→70; support 40→32. alpha: delivered, I=100, delay=5, ETA=T+215; beta: delivered, I=55, delay=82, ETA=T+317; gamma: delivered, I=100, delay=10, ETA=T+235; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 1; بررسی زمینی / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل محموله اولویت‌دار با افت تداوم عملیاتی شبکه»; continuity 75%; alpha integrity 100; alpha ETA 215; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-M10_uniform_random-W-corridor_beta_south-pressure_escalator-1-1291852800",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": 0.1176462775428746,
    "operationalStrength": 62.5,
    "strategicStrength": 68.75,
    "integration": 65.47619047619048,
    "dispersion": 0.4641291486152386,
    "phaseScores": [
      0.11475409833915604,
      -0.6270299208623518,
      0.6090808416229565,
      0.3737800910717376
    ]
  },
  "constructs": {
    "informationSeeking": 59.075070732886026,
    "secondOrderThinking": 58.6875,
    "adversaryModeling": 70,
    "escalationSensitivity": 60,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": null,
    "resourceStewardship": 57.25,
    "planningForesight": 67.4375,
    "multiDomainIntegration": 23.111546065617567,
    "riskPosture": 0.5299145299145299,
    "decisionCoherence": 65.56666666666666
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 1100,
    "iqrActiveDecisionMs": 450,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_beta_south-pressure_escalator, pressure_escalator, true primary corridor_beta_south, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

## M2-W14-E1 — priority_alpha

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تمرکز اولیه بر کاروان پزشکی» (a1_priority_focus); target کریدور شرقی / کاروان الف.
- Visible consequence: T+0→T+28; ISR 100→90; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=99, delay=2, ETA=T+252.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+28; ISR 90; support 100; 1 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=99, delay=2, ETA=T+252.
- Selected: «تحلیل هدفمند PNT» (a2_focused_pnt); target کریدور شرقی / کاروان الف.
- Visible consequence: T+28→T+60; ISR 90→76; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=97, delay=6, ETA=T+256.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+60; ISR 76; support 100; 2 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=97, delay=6, ETA=T+256.
- Selected: «پایش ویژه محموله پزشکی» (b1_priority_cargo); target کریدور شرقی / کاروان الف.
- Visible consequence: T+60→T+88; ISR 76→66; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=94, delay=14, ETA=T+264.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+88; ISR 66; support 100; 3 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=94, delay=14, ETA=T+264.
- Selected: «ادامه مسیر با تطبیق و ناوبری پشتیبان» (b2_continue_crosscheck); target کریدور شرقی / کاروان الف.
- Visible consequence: T+88→T+116; ISR 66→62; support 100→92. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=91, delay=22, ETA=T+272.
- Fresh information: 1; گزارش میدانی کاروان / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+116; ISR 62; support 92; 4 visible evidence. alpha: moving, I=100, delay=5, ETA=T+215; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=91, delay=22, ETA=T+272.
- Selected: «فعال‌سازی ناوبری پشتیبان» (c1_fallback_nav); target کریدور شرقی / کاروان الف.
- Visible consequence: T+116→T+148; ISR 62→62; support 92→78. alpha: moving, I=100, delay=10, ETA=T+220; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=88, delay=30, ETA=T+280.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+148; ISR 62; support 78; 4 visible evidence. alpha: moving, I=100, delay=10, ETA=T+220; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=88, delay=30, ETA=T+280.
- Selected: «تمرکز منابع بر کاروان الف» (c2_priority_surge); target کریدور شرقی / کاروان الف.
- Visible consequence: T+148→T+178; ISR 62→50; support 78→58. alpha: moving, I=100, delay=10, ETA=T+220; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=85, delay=39, ETA=T+289.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+178; ISR 50; support 58; 5 visible evidence. alpha: moving, I=100, delay=10, ETA=T+220; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=85, delay=39, ETA=T+289.
- Selected: «ادامه حرکت با اسکورت» (d1_escorted_continuation); target کریدور شرقی / کاروان الف.
- Visible consequence: T+178→T+210; ISR 50→50; support 58→40. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=82, delay=48, ETA=T+298.
- Fresh information: 1; گزارش میدانی کاروان / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+210; ISR 50; support 40; 6 visible evidence. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=82, delay=48, ETA=T+298.
- Selected: «شتاب تحویل محموله حیاتی» (d2_critical_delivery_surge); target کریدور شرقی / کاروان الف.
- Visible consequence: T+210→T+360; ISR 50→50; support 40→26. alpha: delivered, I=100, delay=5, ETA=T+215; beta: delivered, I=100, delay=0, ETA=T+235; gamma: delivered, I=100, delay=0, ETA=T+225; delta: delivered, I=79, delay=56, ETA=T+306.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل و تداوم شبکه کامل؛ منشأ اختلال حل‌نشده»; continuity 100%; alpha integrity 100; alpha ETA 215; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-priority_alpha-W-corridor_delta_west-deceptive_diversion-1-none",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": -0.7838755249720148,
    "operationalStrength": 81.25,
    "strategicStrength": 43.75,
    "integration": 56.875,
    "dispersion": 0.14986369700655391,
    "phaseScores": [
      -1,
      -0.6270299208623518,
      -0.662668665669639,
      -0.8458035133560687
    ]
  },
  "constructs": {
    "informationSeeking": 39.5,
    "secondOrderThinking": 42.125,
    "adversaryModeling": 44.99999999999999,
    "escalationSensitivity": 57.49999999999999,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": null,
    "resourceStewardship": 47.125,
    "planningForesight": 51.4375,
    "multiDomainIntegration": 25.945070179990488,
    "riskPosture": 0.923076923076923,
    "decisionCoherence": 61.78333333333333
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 200,
    "iqrActiveDecisionMs": 0,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_delta_west-deceptive_diversion, deceptive_diversion, true primary corridor_delta_west, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

## M3-W11-E1 — information_heavy

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش مبنای سراسری» (a1_network_baseline); target none.
- Visible consequence: T+0→T+30; ISR 100→84; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=99, delay=2, ETA=T+227; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 4; تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور جنوبی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+30; ISR 84; support 100; 4 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=99, delay=2, ETA=T+227; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پویش سراسری چندکریدوری» (a2_broad_sweep); target none.
- Visible consequence: T+30→T+68; ISR 84→62; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=97, delay=6, ETA=T+231; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 4; تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور جنوبی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+68; ISR 62; support 100; 8 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=97, delay=6, ETA=T+231; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تقسیم توجه بین کریدورها» (b1_split_attention); target none.
- Visible consequence: T+68→T+100; ISR 62→46; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=90, delay=20, ETA=T+245; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 4; تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور جنوبی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+100; ISR 46; support 100; 12 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=90, delay=20, ETA=T+245; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «توقف موقت برای راستی‌آزمایی» (b2_hold_verify); target کریدور شمال‌غربی / کاروان ج.
- Visible consequence: T+100→T+145; ISR 46→40; support 100→100. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=83, delay=64, ETA=T+289; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شمال‌غربی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+145; ISR 40; support 100; 13 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=83, delay=64, ETA=T+289; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «شناسایی و پشتیبانی زمینی» (c1_ground_recon); target کریدور شمال‌غربی / کاروان ج.
- Visible consequence: T+145→T+185; ISR 40→40; support 100→82. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=78, delay=86, ETA=T+311; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+185; ISR 40; support 82; 13 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=78, delay=86, ETA=T+311; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «سبد اطلاعات‌محور» (c2_isr_heavy); target none.
- Visible consequence: T+185→T+215; ISR 40→22; support 82→78. alpha: delivered, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=73, delay=98, ETA=T+323; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; بررسی زمینی / کریدور شمال‌غربی / با فرضیه اخلال هدفمند سازگار / قوی؛ تله‌متری PNT/GNSS / کریدور شرقی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور جنوبی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+215; ISR 22; support 78; 18 visible evidence. alpha: delivered, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=73, delay=98, ETA=T+323; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «توقف و تأیید نهایی» (d1_hold_confirm); target کریدور شمال‌غربی / کاروان ج.
- Visible consequence: T+215→T+255; ISR 22→14; support 78→78. alpha: delivered, I=100, delay=0, ETA=T+210; beta: delivered, I=100, delay=0, ETA=T+235; gamma: moving, I=68, delay=130, ETA=T+355; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شمال‌غربی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+255; ISR 14; support 78; 19 visible evidence. alpha: delivered, I=100, delay=0, ETA=T+210; beta: delivered, I=100, delay=0, ETA=T+235; gamma: moving, I=68, delay=130, ETA=T+355; delta: delivered, I=100, delay=0, ETA=T+250.
- Selected: «پایان متوازن شبکه» (d2_network_balanced_finish); target none.
- Visible consequence: T+255→T+360; ISR 14→14; support 78→68. alpha: delivered, I=100, delay=0, ETA=T+210; beta: delivered, I=100, delay=0, ETA=T+235; gamma: moving, I=64, delay=136, ETA=T+361; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل محموله اولویت‌دار با افت تداوم عملیاتی شبکه»; continuity 75%; alpha integrity 100; alpha ETA 210; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-information_heavy-W-corridor_gamma_northwest-opportunistic_interdiction-1-none",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": 0.20058460333160816,
    "operationalStrength": 53.75,
    "strategicStrength": 71.25,
    "integration": 61.275,
    "dispersion": 0.4186242232542795,
    "phaseScores": [
      0.11475409833915604,
      0.8971307045703334,
      -0.20954638958305674,
      0
    ]
  },
  "constructs": {
    "informationSeeking": 90.16078785931371,
    "secondOrderThinking": 60.3125,
    "adversaryModeling": 50,
    "escalationSensitivity": 70,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": 34.00000000000001,
    "resourceStewardship": 60,
    "planningForesight": 65.5625,
    "multiDomainIntegration": 19.263406092104486,
    "riskPosture": -0.10142450142450131,
    "decisionCoherence": 73.93333333333334
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 3950,
    "iqrActiveDecisionMs": 2175,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_gamma_northwest-opportunistic_interdiction, opportunistic_interdiction, true primary corridor_gamma_northwest, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

## M4-W01-E1 — mobility_resilience

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «حفظ ذخیره پایش» (a1_preserve_reserve); target none.
- Visible consequence: T+0→T+25; ISR 100→100; support 100→100. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+25; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تطبیق گزارش میدانی و رادیویی» (a2_field_radio); target کریدور شرقی / کاروان الف.
- Visible consequence: T+25→T+60; ISR 100→100; support 100→96. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+60; ISR 100; support 96; 2 visible evidence. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش پالسی کل شبکه» (b1_pulse_network); target none.
- Visible consequence: T+60→T+88; ISR 100→92; support 96→96. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ گزارش میدانی کاروان / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+88; ISR 92; support 96; 7 visible evidence. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «ادامه مسیر با تطبیق و ناوبری پشتیبان» (b2_continue_crosscheck); target کریدور شرقی / کاروان الف.
- Visible consequence: T+88→T+116; ISR 92→88; support 96→88. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+116; ISR 88; support 88; 9 visible evidence. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «فعال‌سازی ناوبری پشتیبان» (c1_fallback_nav); target کریدور جنوبی / کاروان ب.
- Visible consequence: T+116→T+148; ISR 88→88; support 88→74. alpha: moving, I=100, delay=18, ETA=T+228; beta: moving, I=100, delay=5, ETA=T+240; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+148; ISR 88; support 74; 9 visible evidence. alpha: moving, I=100, delay=18, ETA=T+228; beta: moving, I=100, delay=5, ETA=T+240; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «سبد تاب‌آوری حرکتی» (c2_mobility_heavy); target none.
- Visible consequence: T+148→T+178; ISR 88→84; support 74→56. alpha: moving, I=100, delay=20, ETA=T+230; beta: moving, I=100, delay=5, ETA=T+240; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+178; ISR 84; support 56; 9 visible evidence. alpha: moving, I=100, delay=20, ETA=T+230; beta: moving, I=100, delay=5, ETA=T+240; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تغییر مسیر فوری» (d1_emergency_reroute); target کریدور شمال‌غربی / کاروان ج.
- Visible consequence: T+178→T+218; ISR 84→84; support 56→40. alpha: moving, I=100, delay=22, ETA=T+232; beta: moving, I=100, delay=5, ETA=T+240; gamma: moving, I=100, delay=20, ETA=T+245; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+218; ISR 84; support 40; 9 visible evidence. alpha: moving, I=100, delay=22, ETA=T+232; beta: moving, I=100, delay=5, ETA=T+240; gamma: moving, I=100, delay=20, ETA=T+245; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایان متوازن شبکه» (d2_network_balanced_finish); target none.
- Visible consequence: T+218→T+360; ISR 84→84; support 40→30. alpha: delivered, I=100, delay=20, ETA=T+230; beta: delivered, I=100, delay=0, ETA=T+235; gamma: delivered, I=100, delay=15, ETA=T+240; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل و تداوم شبکه کامل؛ منشأ اختلال حل‌نشده»; continuity 100%; alpha integrity 100; alpha ETA 230; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-mobility_resilience-W-corridor_alpha_east-cautious_denial-1-none",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": 0.17238877066970035,
    "operationalStrength": 61.25000000000001,
    "strategicStrength": 73.75,
    "integration": 66.9212962962963,
    "dispersion": 0.3754936791459974,
    "phaseScores": [
      0.770491803321688,
      0.19363005042533535,
      -0.053587824046682525,
      -0.2209789470215394
    ]
  },
  "constructs": {
    "informationSeeking": 16.75,
    "secondOrderThinking": 65.625,
    "adversaryModeling": 55.00000000000001,
    "escalationSensitivity": 55.00000000000001,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": 30.000000000000004,
    "resourceStewardship": 71.00000000000001,
    "planningForesight": 75.3125,
    "multiDomainIntegration": 23.111546065617567,
    "riskPosture": 0.022222222222222254,
    "decisionCoherence": 74.86666666666666
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 200,
    "iqrActiveDecisionMs": 0,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_alpha_east-cautious_denial, cautious_denial, true primary corridor_alpha_east, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

## M5-W01-E1 — resource_preserver

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «حفظ ذخیره پایش» (a1_preserve_reserve); target none.
- Visible consequence: T+0→T+25; ISR 100→100; support 100→100. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+25; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تطبیق گزارش میدانی و رادیویی» (a2_field_radio); target کریدور شرقی / کاروان الف.
- Visible consequence: T+25→T+60; ISR 100→100; support 100→96. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+60; ISR 100; support 96; 2 visible evidence. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش پالسی کل شبکه» (b1_pulse_network); target none.
- Visible consequence: T+60→T+88; ISR 100→92; support 96→96. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ گزارش میدانی کاروان / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+88; ISR 92; support 96; 7 visible evidence. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «ادامه مسیر با تطبیق و ناوبری پشتیبان» (b2_continue_crosscheck); target کریدور شرقی / کاروان الف.
- Visible consequence: T+88→T+116; ISR 92→88; support 96→88. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+116; ISR 88; support 88; 9 visible evidence. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «حفظ ذخیره متحرک» (c1_preserve_mobile_reserve); target none.
- Visible consequence: T+116→T+141; ISR 88→88; support 88→88. alpha: moving, I=100, delay=18, ETA=T+228; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+141; ISR 88; support 88; 9 visible evidence. alpha: moving, I=100, delay=18, ETA=T+228; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «سبد متوازن شبکه» (c2_balanced); target none.
- Visible consequence: T+141→T+171; ISR 88→78; support 88→78. alpha: moving, I=100, delay=21, ETA=T+231; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ گزارش میدانی کاروان / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+171; ISR 78; support 78; 14 visible evidence. alpha: moving, I=100, delay=21, ETA=T+231; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «توقف و تأیید نهایی» (d1_hold_confirm); target کریدور شرقی / کاروان الف.
- Visible consequence: T+171→T+211; ISR 78→70; support 78→78. alpha: moving, I=100, delay=44, ETA=T+254; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+211; ISR 70; support 78; 15 visible evidence. alpha: moving, I=100, delay=44, ETA=T+254; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایان با اولویت تداوم شبکه» (d2_continuity_first_finish); target none.
- Visible consequence: T+211→T+360; ISR 70→70; support 78→70. alpha: delivered, I=100, delay=57, ETA=T+267; beta: delivered, I=100, delay=0, ETA=T+235; gamma: delivered, I=100, delay=0, ETA=T+225; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل و تداوم شبکه کامل؛ تهدید مهار نشد»; continuity 100%; alpha integrity 100; alpha ETA 267; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-resource_preserver-W-corridor_alpha_east-cautious_denial-1-none",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": 0.6779490999513605,
    "operationalStrength": 44.99999999999999,
    "strategicStrength": 82.5,
    "integration": 58.23529411764705,
    "dispersion": 0.2851641171564578,
    "phaseScores": [
      0.770491803321688,
      0.19363005042533535,
      0.9258028792993782,
      0.8218716667590407
    ]
  },
  "constructs": {
    "informationSeeking": 31.75,
    "secondOrderThinking": 72.625,
    "adversaryModeling": 60,
    "escalationSensitivity": 57.49999999999999,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": 32.666666666666664,
    "resourceStewardship": 80.37500000000001,
    "planningForesight": 82.6875,
    "multiDomainIntegration": 32.13518309332631,
    "riskPosture": -0.061823361823361865,
    "decisionCoherence": 84.96666666666667
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 200,
    "iqrActiveDecisionMs": 0,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_alpha_east-cautious_denial, cautious_denial, true primary corridor_alpha_east, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

## M6-W01-E1 — high_response

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش مبنای سراسری» (a1_network_baseline); target none.
- Visible consequence: T+0→T+30; ISR 100→84; support 100→100. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 4; تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ تله‌متری PNT/GNSS / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ تله‌متری PNT/GNSS / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+30; ISR 84; support 100; 4 visible evidence. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «اعزام رابط زمینی» (a2_ground_liaison); target کریدور شرقی / کاروان الف.
- Visible consequence: T+30→T+70; ISR 84→84; support 100→88. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+70; ISR 84; support 88; 4 visible evidence. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تمرکز روی کریدور مشکوک» (b1_suspect_focus); target کریدور شرقی / کاروان الف.
- Visible consequence: T+70→T+100; ISR 84→72; support 88→88. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; بررسی زمینی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط؛ تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+100; ISR 72; support 88; 6 visible evidence. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تغییر مسیر اضطراری» (b2_reroute); target کریدور شرقی / کاروان الف.
- Visible consequence: T+100→T+140; ISR 72→72; support 88→74. alpha: moving, I=100, delay=35, ETA=T+245; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+140; ISR 72; support 74; 6 visible evidence. alpha: moving, I=100, delay=35, ETA=T+245; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «شناسایی و پشتیبانی زمینی» (c1_ground_recon); target کریدور شرقی / کاروان الف.
- Visible consequence: T+140→T+180; ISR 72→72; support 74→56. alpha: moving, I=100, delay=48, ETA=T+258; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+180; ISR 72; support 56; 6 visible evidence. alpha: moving, I=100, delay=48, ETA=T+258; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «سبد تاب‌آوری حرکتی» (c2_mobility_heavy); target none.
- Visible consequence: T+180→T+210; ISR 72→68; support 56→38. alpha: moving, I=100, delay=50, ETA=T+260; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 1; بررسی زمینی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+210; ISR 68; support 38; 7 visible evidence. alpha: moving, I=100, delay=50, ETA=T+260; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «مهار زمینی منبع اختلال» (d1_ground_containment); target کریدور شرقی / کاروان الف.
- Visible consequence: T+210→T+255; ISR 68→68; support 38→16. alpha: moving, I=100, delay=67, ETA=T+277; beta: delivered, I=100, delay=0, ETA=T+235; gamma: delivered, I=100, delay=0, ETA=T+225; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+255; ISR 68; support 16; 7 visible evidence. alpha: moving, I=100, delay=67, ETA=T+277; beta: delivered, I=100, delay=0, ETA=T+235; gamma: delivered, I=100, delay=0, ETA=T+225; delta: delivered, I=100, delay=0, ETA=T+250.
- Selected: «شتاب تحویل محموله حیاتی» (d2_critical_delivery_surge); target کریدور شرقی / کاروان الف.
- Visible consequence: T+255→T+360; ISR 68→68; support 16→2. alpha: delivered, I=100, delay=59, ETA=T+269; beta: delivered, I=100, delay=0, ETA=T+235; gamma: delivered, I=100, delay=0, ETA=T+225; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 1; بررسی زمینی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل و تداوم شبکه کامل؛ تهدید مهار نشد»; continuity 100%; alpha integrity 100; alpha ETA 269; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-high_response-W-corridor_alpha_east-cautious_denial-1-none",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": -0.324319298211068,
    "operationalStrength": 72.5,
    "strategicStrength": 58.74999999999999,
    "integration": 64.9047619047619,
    "dispersion": 0.3562370828891697,
    "phaseScores": [
      0.11475409833915604,
      -0.7202295552174001,
      -0.06558182703776563,
      -0.6262199089282623
    ]
  },
  "constructs": {
    "informationSeeking": 45,
    "secondOrderThinking": 51.6875,
    "adversaryModeling": 70,
    "escalationSensitivity": 62.5,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": null,
    "resourceStewardship": 43.375,
    "planningForesight": 55.8125,
    "multiDomainIntegration": 23.111546065617567,
    "riskPosture": 0.009401709401709405,
    "decisionCoherence": 55.800000000000004
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 200,
    "iqrActiveDecisionMs": 0,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_alpha_east-cautious_denial, cautious_denial, true primary corridor_alpha_east, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

## M7-W01-E1 — low_response_reversible

### R1: تصویر مبنا

- Prompt: «پیش از تشدید هرگونه ناهنجاری، چه تصویری از وضعیت شبکه می‌سازید؟»
- Before: T+0; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=0, ETA=T+210; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «حفظ ذخیره پایش» (a1_preserve_reserve); target none.
- Visible consequence: T+0→T+25; ISR 100→100; support 100→100. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: belief:A2_prebelief. 

### R2: بررسی ناهنجاری

- Prompt: «نشانه‌های اولیه با چه روش اطلاعاتی باید بررسی شوند؟»
- Before: T+25; ISR 100; support 100; 0 visible evidence. alpha: moving, I=100, delay=1, ETA=T+211; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تطبیق گزارش میدانی و رادیویی» (a2_field_radio); target کریدور شرقی / کاروان الف.
- Visible consequence: T+25→T+60; ISR 100→100; support 100→96. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف
- Next screen after outcome: belief:A2_postbelief. 

### R3: تخصیص توجه

- Prompt: «ظرفیت توجه و پایش بعدی را کجا متمرکز می‌کنید؟»
- Before: T+60; ISR 100; support 96; 2 visible evidence. alpha: moving, I=100, delay=3, ETA=T+213; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «پایش پالسی کل شبکه» (b1_pulse_network); target none.
- Visible consequence: T+60→T+88; ISR 100→92; support 96→96. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ گزارش میدانی کاروان / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: decision:B2_route_policy. 

### R4: سیاست مسیر

- Prompt: «در شرایطی که هنوز علت اختلال قطعی نیست، سیاست حرکت کریدور انتخابی چیست؟»
- Before: T+88; ISR 92; support 96; 7 visible evidence. alpha: moving, I=100, delay=7, ETA=T+217; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «ادامه مسیر با تطبیق و ناوبری پشتیبان» (b2_continue_crosscheck); target کریدور شرقی / کاروان الف.
- Visible consequence: T+88→T+116; ISR 92→88; support 96→88. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 2; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف
- Next screen after outcome: decision:C1_support_and_checkpoints. This outcome was preceded by the existing reason gate.

### R5: تاب‌آوری و پشتیبانی

- Prompt: «برای افزایش تاب‌آوری شبکه کدام اقدام پشتیبانی را فعال می‌کنید؟»
- Before: T+116; ISR 88; support 88; 9 visible evidence. alpha: moving, I=100, delay=15, ETA=T+225; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «فعال‌سازی ناوبری پشتیبان» (c1_fallback_nav); target کریدور شرقی / کاروان الف.
- Visible consequence: T+116→T+148; ISR 88→88; support 88→74. alpha: moving, I=100, delay=23, ETA=T+233; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: decision:C2_resource_portfolio. 

### R6: سبد منابع

- Prompt: «ذخایر باقی‌مانده را برای ادامه مأموریت چگونه توزیع می‌کنید؟»
- Before: T+148; ISR 88; support 74; 9 visible evidence. alpha: moving, I=100, delay=23, ETA=T+233; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «سبد متوازن شبکه» (c2_balanced); target none.
- Visible consequence: T+148→T+178; ISR 88→78; support 74→64. alpha: moving, I=100, delay=26, ETA=T+236; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 5; گزارش میدانی کاروان / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ تحلیل زمان‌بندی رادیویی / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور جنوبی / بیشتر با علت غیرخصمانه سازگار / ضعیف؛ گزارش میدانی کاروان / کریدور شمال‌غربی / مبهم / چندتفسیره / ضعیف؛ گزارش میدانی کاروان / کریدور غربی / بیشتر با علت غیرخصمانه سازگار / ضعیف
- Next screen after outcome: belief:C_belief_checkpoint. This outcome was preceded by the existing reason gate.

### R7: پاسخ به تهدید فعال

- Prompt: «با فعال‌شدن فشار عملیاتی، پاسخ فوری شبکه چه باشد؟»
- Before: T+178; ISR 78; support 64; 14 visible evidence. alpha: moving, I=100, delay=26, ETA=T+236; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «توقف و تأیید نهایی» (d1_hold_confirm); target کریدور شرقی / کاروان الف.
- Visible consequence: T+178→T+218; ISR 78→70; support 64→64. alpha: moving, I=100, delay=49, ETA=T+259; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Fresh information: 1; تله‌متری PNT/GNSS / کریدور شرقی / با فرضیه اخلال هدفمند سازگار / متوسط
- Next screen after outcome: belief:D_final_belief. 

### R8: سیاست نهایی تحویل

- Prompt: «برای پایان مأموریت، کدام سیاست تحویل و تداوم را انتخاب می‌کنید؟»
- Before: T+218; ISR 70; support 64; 15 visible evidence. alpha: moving, I=100, delay=49, ETA=T+259; beta: moving, I=100, delay=0, ETA=T+235; gamma: moving, I=100, delay=0, ETA=T+225; delta: moving, I=100, delay=0, ETA=T+250.
- Selected: «تحویل تاب‌آور با ناوبری پشتیبان» (d2_resilient_handoff); target کریدور شرقی / کاروان الف.
- Visible consequence: T+218→T+360; ISR 70→70; support 64→52. alpha: delivered, I=100, delay=57, ETA=T+267; beta: delivered, I=100, delay=0, ETA=T+235; gamma: delivered, I=100, delay=0, ETA=T+225; delta: delivered, I=100, delay=0, ETA=T+250.
- Fresh information: 0; شاهد تازه‌ای به تصویر عملیاتی اضافه نشد.
- Next screen after outcome: complete. This outcome was preceded by the existing reason gate.

Final mission result: «تحویل و تداوم شبکه کامل؛ تهدید مهار نشد»; continuity 100%; alpha integrity 100; alpha ETA 267; deadline 300.

Exact current final cognitive output:

```json
{
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "cal-low_response_reversible-W-corridor_alpha_east-cautious_denial-1-none",
  "measurementModelVersion": "s5-cognitive-v3-adapter-v1.0.0",
  "formulaVersion": "cognitive-v3-semantic-v1.0.0",
  "optionProfileVersion": "s5-option-profiles-internal-v1.0.0",
  "scenarioContentVersion": "s5-silent-waves-redesign-content-v1.0.0",
  "reasonModelVersion": "s5-reason-model-internal-v1.0.0",
  "expertPanelVersion": "not-yet-expert-validated",
  "validityStatus": "experimental_pending_expert_and_human_validation",
  "dataCompleteness": {
    "overall": 100,
    "decisions": 100,
    "timing": 100,
    "evidence": 100,
    "estimates": 100,
    "reasons": 100
  },
  "orientation": {
    "overall": 0.44513995857079813,
    "operationalStrength": 53.75,
    "strategicStrength": 78.74999999999999,
    "integration": 63.89150943396225,
    "dispersion": 0.2312663817999513,
    "phaseScores": [
      0.770491803321688,
      0.19363005042533535,
      0.2631342136297392,
      0.5533037669064299
    ]
  },
  "constructs": {
    "informationSeeking": 32.5,
    "secondOrderThinking": 70.93750000000001,
    "adversaryModeling": 60,
    "escalationSensitivity": 55.00000000000001,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": 32.666666666666664,
    "resourceStewardship": 77.62500000000001,
    "planningForesight": 81.125,
    "multiDomainIntegration": 32.13518309332631,
    "riskPosture": -0.12849002849002858,
    "decisionCoherence": 86.45
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 200,
    "iqrActiveDecisionMs": 0,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
}
```

Hidden during play: W-corridor_alpha_east-cautious_denial, cautious_denial, true primary corridor_alpha_east, environment seed 1, evidence provenance and Actor reaction decomposition. Details/counts in current-path-traces.csv are stage-entry snapshots; decision-row selectedAction is the policy's next submitted selection, not a UI default.

