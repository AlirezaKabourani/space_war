import type {
  FinalEndState,
  Move3ImpactSeverity,
  ResourceEvent,
  ScenarioOneFinalSnapshot,
  ScenarioOneState,
} from "../model/types";

export type Scenario4NarrativePhase =
  | "intro"
  | "move1"
  | "move2"
  | "move3"
  | "report"
  | "aar"
  | "dashboard";

export type NarrativeSource = "user_choice" | "actor" | "inject" | "state" | "evidence";
export type NarrativeSeverity = "neutral" | "info" | "warning" | "critical" | "positive";
export type NarrativeActor = "israel" | "ally" | "commercial";

export interface NarrativeRenderTrace {
  narrativeId: string;
  sourceType: NarrativeSource;
  sourceIds: string[];
  move?: 1 | 2 | 3;
}

export interface NarrativeSection {
  id: string;
  title: string;
  body: string;
  kicker?: string;
  closingLine?: string;
  severity?: NarrativeSeverity;
  source: NarrativeSource;
  /** Debug metadata. Rendering this field is restricted to admin surfaces. */
  trace?: NarrativeRenderTrace;
}

export interface IntroNarrativeScreen {
  id: "intro_title" | "intro_narrative" | "intro_role" | "intro_objectives" | "intro_how_to" | "intro_rules";
  section: "title" | "crisisNarrative" | "playerRole" | "objectives" | "howToPlay" | "rules";
  title: string;
  kicker?: string;
  subtitle?: string;
  body?: string;
  supportLine?: string;
  closingLine?: string;
  callout?: string;
  items?: readonly { title: string; body: string }[];
  rules?: readonly string[];
  disclaimer?: string;
  cta: string;
}

export interface ScenarioEntryCopy {
  title: string;
  subtitle: string;
  shortDescription: string;
  badges: readonly string[];
  cta: string;
}

export interface HelpSectionCopy {
  id: string;
  title: string;
  body: string;
}

export interface GlossaryEntryCopy {
  id: string;
  term: string;
  definition: string;
}

export interface Scenario4NarrativeContext {
  readonly runId: string;
  readonly phase: Scenario4NarrativePhase;
  readonly move?: 1 | 2 | 3;
  readonly iran: {
    readonly decisions: Readonly<Record<string, string | undefined>>;
    readonly reasons: Readonly<Record<string, string | undefined>>;
    readonly attributionEstimates: Readonly<{ pre?: number; post?: number; final?: number }>;
    readonly resources: Readonly<ScenarioOneState["resources"]>;
    readonly resourceEvents: readonly ResourceEvent[];
    readonly observableSignals: readonly string[];
  };
  readonly israel: {
    readonly observedSignals: readonly string[];
    readonly currentAction?: string;
    readonly previousActions: readonly string[];
    readonly visibleBehaviorSummary?: string;
  };
  readonly ally: { readonly currentAction?: string; readonly visibleState?: string };
  readonly commercial: { readonly currentAction?: string; readonly visibleState?: string };
  readonly evidence: {
    readonly availableIds: readonly string[];
    readonly openedIds: readonly string[];
    readonly visibleConfidence?: number;
  };
  readonly injects: { readonly activeIds: readonly string[] };
  readonly mission: {
    readonly status: number;
    readonly situationAwareness: number;
    readonly escalationPressure: number;
    readonly operationalReadiness: number;
    readonly coalitionCohesion: number;
    readonly informationFootprint: number;
    readonly strategicLegitimacy: number;
    readonly serviceImpactSeverity?: Move3ImpactSeverity;
  };
  readonly flags: Readonly<Record<string, boolean | undefined>>;
  readonly endState?: {
    readonly id: FinalEndState;
    readonly labelFa: string;
    readonly tags?: readonly string[];
  };
  readonly visibility: { readonly canRevealHiddenTruth: false };
}

export interface Scenario4AarNarrativeContext extends Omit<Scenario4NarrativeContext, "phase" | "visibility"> {
  readonly phase: "aar";
  readonly visibility: { readonly canRevealHiddenTruth: true };
  readonly hiddenTruth: Readonly<ScenarioOneFinalSnapshot["hiddenAarData"]>;
}

export interface InjectNarrativeDefinition {
  id: string;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  cta?: string;
  visibility: "immediate" | "report_only" | "hidden";
}

export interface EndStateNarrative {
  id: FinalEndState;
  title: string;
  shortSummary: string;
  causalFacts: string[];
  closingLine: string;
}

export interface FinalReportNarrative {
  crisisPath: NarrativeSection;
  missionOutcome: NarrativeSection;
  attributionEvolution: NarrativeSection;
  finalDecision: NarrativeSection;
  actorOutcome: NarrativeSection;
  resources: NarrativeSection;
  endStateNarrative: EndStateNarrative;
}

export interface Move3EvidenceNarrativeCard {
  id: string;
  title: string;
  status: string;
  text: string;
  limitation: string;
  source: "technical" | "orbital" | "ally" | "commercial";
  sourceSemantics: string;
  visibilityRule: string;
}

export interface AarTurningPoint {
  id: "attribution" | "threshold" | "action" | "israel";
  title: string;
  body: string;
  why: string;
}

export interface AarRunSummary {
  known: string;
  revealed: string;
  difference: string;
}
