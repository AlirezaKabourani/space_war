import { seededNoise } from "../adjudication/seededRandom.ts";
import type {
  RedIntent,
  RedMove1Action,
  RedObservation,
  ScenarioOneState,
} from "../model/types";

type RedScores = Record<RedMove1Action, number>;

const baselineScores: Record<RedIntent, RedScores> = {
  probe: {
    continue_approach: 0.8,
    slow_approach: 0.7,
    hold_position: 0.3,
    send_routine_explanation: 0.1,
    break_off: -0.3,
  },
  intelligence_collection: {
    continue_approach: 0.7,
    slow_approach: 0.6,
    hold_position: 0.5,
    send_routine_explanation: 0,
    break_off: -0.4,
  },
  coercion: {
    continue_approach: 0.9,
    slow_approach: 0.4,
    hold_position: 0.2,
    send_routine_explanation: -0.2,
    break_off: -0.6,
  },
  alliance_fracture: {
    continue_approach: 0.5,
    slow_approach: 0.5,
    hold_position: 0.3,
    send_routine_explanation: 0.4,
    break_off: -0.1,
  },
  benign_ambiguous: {
    continue_approach: -0.2,
    slow_approach: 0.1,
    hold_position: 0.5,
    send_routine_explanation: 0.8,
    break_off: 0.7,
  },
};

export const resolveRedActor = ({
  state,
  observation,
  seed,
}: {
  state: ScenarioOneState;
  observation: RedObservation;
  seed: string;
}) => {
  const intent = state.hidden.trueRedIntent;
  const scores: RedScores = { ...baselineScores[intent] };
  const redEscalationAversion = 1 - state.hidden.redRiskAppetite / 100;

  scores.continue_approach += observation.visibleProtection > 0 ? -0.08 : 0.08;
  scores.slow_approach += observation.blueResolveSignal > 12 ? 0.1 : 0;
  scores.hold_position += observation.coalitionSignal > 8 ? 0.08 : 0;
  scores.send_routine_explanation += observation.privateCommunication ? 0.15 : 0;
  scores.break_off += observation.blueEscalationSignal > 28 ? 0.18 : 0;

  if (observation.blueEscalationSignal > 20) {
    scores.break_off += redEscalationAversion * 0.5;
    scores.send_routine_explanation += 0.25;
  }
  if (intent === "probe" && observation.blueResolveSignal < 8) {
    scores.continue_approach += 0.35;
  }
  if (
    intent === "alliance_fracture" &&
    observation.publicPressure > 0 &&
    state.knowledge.systemAttributionConfidence < 40
  ) {
    scores.send_routine_explanation += 0.4;
  }
  if (intent === "benign_ambiguous" && observation.privateCommunication) {
    scores.send_routine_explanation += 0.35;
    scores.break_off += 0.2;
  }

  for (const action of Object.keys(scores) as RedMove1Action[]) {
    scores[action] += seededNoise(seed, `red:${intent}:${action}`);
  }

  const selectedAction = (Object.entries(scores) as Array<[RedMove1Action, number]>)
    .sort((a, b) => b[1] - a[1])[0][0];

  return { selectedAction, candidateUtilityScores: scores };
};
