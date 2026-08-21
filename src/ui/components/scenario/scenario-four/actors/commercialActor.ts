import type { CommercialAction, ScenarioOneState } from "../model/types";

export const resolveCommercialActor = (state: ScenarioOneState): CommercialAction => {
  if (state.flags.publicWarningIssued && state.flags.conflictingCommercialData) {
    return "warn_about_public_release";
  }
  if (state.flags.conflictingCommercialData || state.hidden.commercialTrust >= 73) {
    return "offer_followup_data";
  }
  return "no_new_data";
};
