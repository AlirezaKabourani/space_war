import type { CorridorId } from "./scenario-five/model/index";
import type { CognitiveWindowId, EvidenceTelemetry } from "./scenario-five/model/cognitive/index";
import type { MissionActionId, MissionConvoyStatus } from "./scenario-five/model/mission/index";
import type { RuntimeStageId } from "./scenario-five/model/runtime/index";

export interface ScenarioFivePlayerConvoy {
  readonly convoyId: "alpha" | "beta" | "gamma" | "delta";
  readonly corridorId: CorridorId;
  readonly integrity: number;
  readonly delayMinutes: number;
  readonly projectedArrivalMinute: number;
  readonly deadlineMinute: number;
  readonly status: MissionConvoyStatus;
  readonly fallbackNav: boolean;
  readonly routeHardened: boolean;
  readonly groundSupport: boolean;
  readonly escortedNow: boolean;
}

export interface ScenarioFivePlayerViewModel {
  readonly stageId: RuntimeStageId;
  readonly phaseId: "A" | "B" | "C" | "D" | null;
  readonly roundId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
  readonly resources: {
    readonly isrCapacity: number;
    readonly supportReserve: number;
    readonly worldClockMinutes: number;
    readonly missionHorizonMinutes: 360;
  };
  readonly convoys: readonly ScenarioFivePlayerConvoy[];
  readonly visibleEvidence: readonly EvidenceTelemetry[];
  readonly availableActionIds: readonly MissionActionId[];
}

export interface ScenarioFiveEvidenceSummary {
  readonly evidenceId: string;
  readonly sourceType: EvidenceTelemetry["sourceType"];
  readonly observedCorridorId: CorridorId | null;
  readonly direction: EvidenceTelemetry["direction"];
  readonly strengthBand: EvidenceTelemetry["strengthBand"];
}

export interface ScenarioFiveEvidenceDetail extends ScenarioFiveEvidenceSummary {
  readonly qualityLabelVisible: string;
  readonly limitationVisible: string;
}

export interface ScenarioFiveOutcomeConvoyChange {
  readonly corridorId: CorridorId;
  readonly statusBefore: MissionConvoyStatus;
  readonly statusAfter: MissionConvoyStatus;
  readonly integrityBefore: number;
  readonly integrityAfter: number;
  readonly delayDelta: number;
  readonly newMitigations: readonly string[];
}

export interface ScenarioFiveOutcomeView {
  readonly roundId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly worldClockBefore: number;
  readonly worldClockAfter: number;
  readonly isrSpent: number;
  readonly supportSpent: number;
  readonly convoyChanges: readonly ScenarioFiveOutcomeConvoyChange[];
  readonly newEvidenceCount: number;
  readonly nextStageId: RuntimeStageId;
}

export interface ScenarioFiveEvidencePanelProps {
  readonly evidence: readonly EvidenceTelemetry[];
  readonly interactive: boolean;
  readonly expandedEvidenceIds: ReadonlySet<string>;
  readonly onOpen: (evidenceId: string) => void;
  readonly onClose: (evidenceId: string) => void;
}

export interface ScenarioFiveReasonContext {
  readonly actionId: MissionActionId;
  readonly targetCorridorId: CorridorId | null;
}

export interface ScenarioFiveEvidenceEventLink {
  readonly evidenceId: string;
  readonly windowId: CognitiveWindowId;
  readonly openedAtMs: number;
  readonly closedAtMs: number | null;
}
