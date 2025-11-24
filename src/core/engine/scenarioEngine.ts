import type {
  AllocationNode,
  AssessmentEvent,
  DecisionNode,
  MiniGameNode,
  ScenarioDefinition,
  ScenarioNode,
} from "../types/scenario";
import { AssessmentRecorder } from "./assessmentRecorder";

type EngineCallbacks = {
  onNodeChange?: (node: ScenarioNode) => void;
  onScenarioComplete?: () => void;
  onEvent?: (event: AssessmentEvent) => void;
};

/**
 * ScenarioEngine is a simple state machine that walks through ScenarioDefinition nodes
 * and emits assessment events. UI layers (React components) call its methods to advance.
 */
export class ScenarioEngine {
  private scenario: ScenarioDefinition;
  private currentNodeId: string;
  private readonly recorder: AssessmentRecorder;
  private readonly cb: EngineCallbacks;
  private readonly now: () => number;
  private scenarioStartedAt: number;

  constructor(
    scenario: ScenarioDefinition,
    opts?: { callbacks?: EngineCallbacks; now?: () => number; recorder?: AssessmentRecorder }
  ) {
    this.scenario = scenario;
    this.currentNodeId = scenario.start;
    this.cb = opts?.callbacks ?? {};
    this.now = opts?.now ?? (() => Date.now());
    this.recorder = opts?.recorder ?? new AssessmentRecorder({ onEvent: this.cb.onEvent });
    this.scenarioStartedAt = this.now();
  }

  getCurrentNode(): ScenarioNode {
    return this.scenario.nodes[this.currentNodeId];
  }

  getRecorder(): AssessmentRecorder {
    return this.recorder;
  }

  /** Move to a node by id; if end, trigger completion callback. */
  private goTo(nextId: string) {
    this.currentNodeId = nextId;
    const node = this.getCurrentNode();
    this.cb.onNodeChange?.(node);
    if (node.type === "end") {
      this.cb.onScenarioComplete?.();
    }
  }

  /** Handle info nodes (continue). */
  advanceFromInfo(nextId?: string) {
    if (!nextId) return;
    this.recorder.record({
      scenarioId: this.scenario.id,
      nodeId: this.currentNodeId,
      action: "info_next",
    });
    this.goTo(nextId);
  }

  /** Handle decision/mcq selections. */
  selectDecisionOption(optionId: string, nextId: string) {
    const node = this.getCurrentNode() as DecisionNode;
    this.recorder.record({
      scenarioId: this.scenario.id,
      nodeId: node.id,
      action: "select_option",
      payload: { optionId },
    });
    this.goTo(nextId);
  }

  /** Handle resource allocation steps. */
  submitAllocation(values: Record<string, number>, nextId: string) {
    const node = this.getCurrentNode() as AllocationNode;
    this.recorder.record({
      scenarioId: this.scenario.id,
      nodeId: node.id,
      action: "allocate_resource",
      payload: { values },
    });
    this.goTo(nextId);
  }

  /** Handle minigame transitions (start/end markers). */
  startMinigame() {
    const node = this.getCurrentNode() as MiniGameNode;
    this.recorder.start({
      scenarioId: this.scenario.id,
      nodeId: node.id,
      action: "start_minigame",
    });
  }

  endMinigame(nextId: string, payload?: Record<string, unknown>) {
    const node = this.getCurrentNode() as MiniGameNode;
    this.recorder.record({
      scenarioId: this.scenario.id,
      nodeId: node.id,
      action: "end_minigame",
      payload,
    });
    this.goTo(nextId);
  }

  /** Total elapsed time for the scenario. */
  getElapsedMs(): number {
    return this.now() - this.scenarioStartedAt;
  }
}
