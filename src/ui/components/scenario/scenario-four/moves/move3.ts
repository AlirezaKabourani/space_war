import type { DecisionOption } from "../model/types";
import { MOVE3_OPTION_COPY_FA, MOVE3_REASON_OPTIONS_FA } from "../narrative/narrativeCatalogFa.ts";

type Move3DecisionOption = DecisionOption & { tradeoff?: string };

export const thresholdOptions: Move3DecisionOption[] = MOVE3_OPTION_COPY_FA.threshold.map((option) => ({ ...option }));
export const crisisCoaOptions: Move3DecisionOption[] = MOVE3_OPTION_COPY_FA.coa.map((option) => ({ ...option }));
export const informationPolicyOptions: Move3DecisionOption[] = MOVE3_OPTION_COPY_FA.information.map((option) => ({ ...option }));
export const offRampOptions: Move3DecisionOption[] = MOVE3_OPTION_COPY_FA.offRamp.map((option) => ({ ...option }));
export const move3ReasonOptions: DecisionOption[] = MOVE3_REASON_OPTIONS_FA.map((option) => ({ ...option }));
