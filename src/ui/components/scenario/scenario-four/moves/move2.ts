import type { DecisionOption } from "../model/types";
import {
  MOVE2_EVIDENCE_COPY_FA,
  MOVE2_OPTION_COPY_FA,
  MOVE2_REASON_OPTIONS_FA,
} from "../narrative/narrativeCatalogFa.ts";

export const move2EvidenceCards = MOVE2_EVIDENCE_COPY_FA;

export const investigationOptions: DecisionOption[] = MOVE2_OPTION_COPY_FA.investigation.map((option) => ({ ...option }));
export const missionOptions: DecisionOption[] = MOVE2_OPTION_COPY_FA.mission.map((option) => ({ ...option }));
export const responseOptions: DecisionOption[] = MOVE2_OPTION_COPY_FA.response.map((option) => ({ ...option }));
export const move2ReasonOptions = MOVE2_REASON_OPTIONS_FA;
