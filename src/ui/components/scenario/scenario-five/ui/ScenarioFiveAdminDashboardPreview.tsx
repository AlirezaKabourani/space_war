import type { Scenario5CognitiveRunResult } from '../model/cognitive/types';
import { useEffect, useRef } from 'react';
import { ScenarioFiveCognitiveDashboard } from './ScenarioFiveCognitiveDashboard';
import './ScenarioFiveAdminDashboardPreview.css';

// TEMP-S5-DASHBOARD-PREVIEW: remove after design review.
// Cognitive values copied from the existing frozen-engine QA witness; no mission/truth data.
const DESIGN_SAMPLE: Scenario5CognitiveRunResult = {
  "scenarioId": "s5_silent_waves_redesign",
  "runId": "ADMIN-DESIGN-PREVIEW-ONLY",
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
    "overall": 0.29602966260175984,
    "operationalStrength": 51.24999999999999,
    "strategicStrength": 65,
    "integration": 57.31182795698924,
    "dispersion": 0.7658517229540507,
    "phaseScores": [
      -1,
      0.8971307045703334,
      0.46511627907766534,
      0.8218716667590407
    ]
  },
  "constructs": {
    "informationSeeking": 60.542193596455476,
    "secondOrderThinking": 58.06249999999999,
    "adversaryModeling": 50,
    "escalationSensitivity": 67.5,
    "informationDiscipline": null,
    "evidenceResponsiveUpdating": null,
    "resourceStewardship": 66.125,
    "planningForesight": 64.1875,
    "multiDomainIntegration": 19.263406092104486,
    "riskPosture": -0.03219373219373214,
    "decisionCoherence": 75.95
  },
  "telemetrySummary": {
    "medianActiveDecisionMs": 1250,
    "iqrActiveDecisionMs": 1275,
    "totalRevisions": 0,
    "revisedWindows": 0,
    "evidenceTriggeredRevisionRate": null
  }
};

export const ScenarioFiveAdminDashboardPreview = ({ isAdmin, onExit }: { isAdmin: boolean; onExit: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isAdmin && dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, [isAdmin]);
  if (!isAdmin) return null;
  return <dialog ref={dialogRef} className="s5-admin-preview-dialog" aria-label="پیش‌نمایش موقت داشبورد سناریو ۲" onCancel={event => { event.preventDefault(); onExit(); }}><section className="screen s5-admin-design-preview" data-admin-cognitive-preview dir="rtl">
    <aside className="s5-admin-preview-notice" role="status"><div><strong>پیش‌نمایش موقت طراحی — فقط ادمین</strong><p>داده‌های نمونه آزمایشی؛ نتیجه اجرای فعلی شما نیست. دکمه‌های بازگشت و پایان، پیش‌نمایش را می‌بندند.</p></div><button type="button" className="s5-secondary-button" onClick={onExit}>بستن پیش‌نمایش</button></aside>
    <ScenarioFiveCognitiveDashboard cognitive={DESIGN_SAMPLE} onBack={onExit} onComplete={onExit} />
  </section></dialog>;
};
