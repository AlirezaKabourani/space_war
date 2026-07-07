// Node types inside a scenario decision tree
// NOTE: "mcq" and "resource" are aliases for "decision" and "allocation" to support the new step model
export type ScenarioNodeType =
  | "info" // Shows text / briefing
  | "decision" // Multiple choice question
  | "mcq" // alias for decision
  | "quiz" // quiz node with answer validation
  | "allocation" // Resource allocation node
  | "resource" // alias for allocation
  | "minigame" // A mini-game trigger
  | "end"; // End of scenario

// Option type for decision and quiz nodes
export interface DecisionOption {
  id: string;
  text: string; // text displayed to the user
  next: string; // ID of next node
  isCorrect?: boolean;
  cognitiveEffects?: Partial<CognitiveScore>;
  resourceEffects?: Partial<ResourceState>;
}

// Node definition
export interface ScenarioNodeBase {
  id: string;
  type: ScenarioNodeType;
}

// Info node
export interface InfoNode extends ScenarioNodeBase {
  type: "info";
  text: string;
  next?: string;
}

// Decision node
export interface DecisionNode extends ScenarioNodeBase {
  type: "decision" | "mcq";
  question: string;
  options: DecisionOption[];
}

// Quiz node
export interface QuizNode extends ScenarioNodeBase {
  type: "quiz";
  question: string;
  referenceTexts?: Record<string, string>;
  options: DecisionOption[];
}

// Allocation node (resource choices)
export interface AllocationNode extends ScenarioNodeBase {
  type: "allocation" | "resource";
  instructions: string;
  resources: ResourceDescriptor[];
  next: string;
}

// Mini-game node
export interface MiniGameNode extends ScenarioNodeBase {
  type: "minigame";
  game:
    | "reaction"
    | "memory"
    | "tracking"
    | "scenario0_concept_lab"
    | "s1_decision_simulation"
    | "s2_gnss_logistics_simulation"
    | "s3_secure_corridor_dungeon"; // extendable
  next: string;
}

// End node
export interface EndNode extends ScenarioNodeBase {
  type: "end";
  summaryText: string;
}

// Union type
export type ScenarioNode =
  | InfoNode
  | DecisionNode
  | QuizNode
  | AllocationNode
  | MiniGameNode
  | EndNode;

// Scenario definition (root object)
export interface ScenarioDefinition {
  id: string;
  title: string;
  description: string;
  start: string; // first node
  nodes: Record<string, ScenarioNode>;
  // optional metadata to help scoring or grouping
  tags?: string[];
}

// Cognitive score model
export interface CognitiveScore {
  focus: number;
  situationalAwareness: number;
  riskTaking: number;
  reactionSpeed: number;
}

// Player resource state
export interface ResourceState {
  satelliteISR: number;
  energy: number;
  time: number;
}

// Generic resource descriptor used by allocation/resource steps
export interface ResourceDescriptor {
  name: string;
  max: number;
  min?: number;
}

// Assessment / telemetry events for cognitive scoring
export interface AssessmentEvent {
  scenarioId: string;
  nodeId: string;
  action: string; // e.g. "select_option", "allocate_resource", "start_minigame", "end_minigame"
  payload?: Record<string, unknown>; // details of the action (option id, amounts, etc.)
  startedAt: number; // epoch ms
  endedAt?: number; // epoch ms
  durationMs?: number;
  metadata?: Record<string, unknown>;
}
