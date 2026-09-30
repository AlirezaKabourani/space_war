import type { DecisionOption } from "../model/types";
import {
  MOVE1_EVIDENCE_COPY_FA,
  MOVE1_OPTION_COPY_FA,
  MOVE1_REASON_OPTIONS_FA,
} from "../narrative/narrativeCatalogFa.ts";

export const intelCards = MOVE1_EVIDENCE_COPY_FA;

export const informationOptions = [
  {
    ...MOVE1_OPTION_COPY_FA.information[0],
    weights: {
      informationSeeking: -0.4,
      resourceDiscipline: 0.7,
      escalationSensitivity: 0.2,
    },
  },
  {
    ...MOVE1_OPTION_COPY_FA.information[1],
    weights: {
      informationSeeking: 0.8,
      resourceDiscipline: -0.2,
      secondOrderThinking: 0.4,
    },
  },
  {
    ...MOVE1_OPTION_COPY_FA.information[2],
    weights: {
      informationSeeking: 0.7,
      resourceDiscipline: 0.2,
      cognitiveFlexibility: 0.5,
    },
  },
  {
    ...MOVE1_OPTION_COPY_FA.information[3],
    weights: {
      informationSeeking: 0.8,
      coalitionOrientation: 0.8,
      resourceDiscipline: -0.3,
      secondOrderThinking: 0.5,
    },
  },
] satisfies DecisionOption[];

export const protectionOptions = [
  { ...MOVE1_OPTION_COPY_FA.protection[0] },
  {
    ...MOVE1_OPTION_COPY_FA.protection[1],
  },
  {
    ...MOVE1_OPTION_COPY_FA.protection[2],
  },
  {
    ...MOVE1_OPTION_COPY_FA.protection[3],
  },
] satisfies DecisionOption[];

export const communicationOptions = [
  { ...MOVE1_OPTION_COPY_FA.communication[0] },
  {
    ...MOVE1_OPTION_COPY_FA.communication[1],
  },
  { ...MOVE1_OPTION_COPY_FA.communication[2] },
  {
    ...MOVE1_OPTION_COPY_FA.communication[3],
  },
  {
    ...MOVE1_OPTION_COPY_FA.communication[4],
  },
] satisfies DecisionOption[];

export const reasonOptions = MOVE1_REASON_OPTIONS_FA;
