import type { AssessmentEvent } from "../types/scenario";

/**
 * Lightweight in-memory recorder for assessment/telemetry events.
 * Can later be swapped with a persistence-backed implementation via the same interface.
 */
export class AssessmentRecorder {
  private events: AssessmentEvent[] = [];
  private readonly now: () => number;
  private onEvent?: (event: AssessmentEvent) => void;

  constructor(opts?: { now?: () => number; onEvent?: (event: AssessmentEvent) => void }) {
    this.now = opts?.now ?? (() => Date.now());
    this.onEvent = opts?.onEvent;
  }

  /** Start an action; returns the event id (index) to finish later if desired. */
  start(event: Omit<AssessmentEvent, "startedAt" | "endedAt" | "durationMs">): AssessmentEvent {
    const startedAt = this.now();
    const e: AssessmentEvent = { ...event, startedAt };
    this.events.push(e);
    this.onEvent?.(e);
    return e;
  }

  /** Finish an action by computing duration. */
  finish(event: AssessmentEvent): AssessmentEvent {
    if (event.endedAt) return event; // already finished
    const endedAt = this.now();
    event.endedAt = endedAt;
    event.durationMs = endedAt - event.startedAt;
    this.onEvent?.(event);
    return event;
  }

  /** Convenience: record a one-shot action with automatic timestamps. */
  record(event: Omit<AssessmentEvent, "startedAt" | "endedAt" | "durationMs">): AssessmentEvent {
    const startedAt = this.now();
    const endedAt = this.now();
    const e: AssessmentEvent = {
      ...event,
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
    };
    this.events.push(e);
    this.onEvent?.(e);
    return e;
  }

  /** Read-only access to events (e.g., for upload or scoring). */
  getAll(): AssessmentEvent[] {
    return [...this.events];
  }

  /** Reset in-memory state. */
  reset() {
    this.events = [];
  }
}
