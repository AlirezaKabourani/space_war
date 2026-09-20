import { COGNITIVE_OPTION_PROFILES_V3, OPTION_PROFILE_VERSION } from "../src/ui/components/scenario/scenario-four/model/cognitiveOptionProfilesV3.ts";
import { pathToFileURL } from "node:url";

export const exportCognitiveProfilesForExpertReview = () => ({
  optionProfileVersion: OPTION_PROFILE_VERSION,
  status: "PROVISIONAL — requires SME validation",
  profiles: Object.values(COGNITIVE_OPTION_PROFILES_V3).map((profile) => ({
    windowId: profile.windowId,
    optionId: profile.optionId,
    optionLabelFa: profile.optionLabelFa,
    ...profile,
  })),
});

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(`${JSON.stringify(exportCognitiveProfilesForExpertReview(), null, 2)}\n`);
}
