// Lightweight client-side analytics logger for user interactions.
// Stores events in localStorage and can export them as a text file.

type EventType =
  | "scenario_card_click"
  | "reference_open"
  | "reference_close"
  | "scenario_start"
  | "scenario_end"
  | "scenario_exit"
  | "question_presented"
  | "question_answered"
  | "node_enter"
  | "option_select"
  | "option_confirm";

export interface EventLogEntry {
  id: string;
  ts: number;
  type: EventType | string;
  scenarioId?: string | number;
  nodeId?: string;
  action?: string;
  detail?: Record<string, unknown>;
  elapsedMs?: number;
  userId?: string;
  userName?: string;
  userRole?: string;
}

const STORAGE_KEY = "space-war.analytics.events";
const timers: Record<string, number> = {};
let counter = 0;
let userContext: { id?: string; name?: string; role?: string } = {};

const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

const load = (): EventLogEntry[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventLogEntry[]) : [];
  } catch {
    return [];
  }
};

const persist = (events: EventLogEntry[]) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore quota errors silently
  }
};

const buildId = () => {
  counter += 1;
  return `${Date.now()}-${counter}`;
};

export const eventLogger = {
  getEvents() {
    return load();
  },

  setUserContext(user: { id?: string; name?: string; role?: string }) {
    userContext = user ?? {};
  },

  log(event: Omit<EventLogEntry, "id" | "ts">) {
    const entry: EventLogEntry = {
      id: buildId(),
      ts: Date.now(),
      ...event,
      userId: userContext.id ?? event.userId,
      userName: userContext.name ?? event.userName,
      userRole: userContext.role ?? event.userRole,
    };
    const events = load();
    events.push(entry);
    persist(events);
    return entry;
  },

  startTimer(key: string) {
    timers[key] = now();
    return timers[key];
  },

  stopTimer(key: string) {
    if (!(key in timers)) return undefined;
    const elapsed = now() - timers[key];
    delete timers[key];
    return elapsed;
  },

  exportToText(filename = "scenario-analytics.txt") {
    if (typeof document === "undefined") return;
    const events = load();
    const lines = events.map((e) => {
      const time = new Date(e.ts).toISOString();
      const base = `[${time}] type=${e.type}`;
      const parts = [
        e.scenarioId ? `scenario=${e.scenarioId}` : null,
        e.nodeId ? `node=${e.nodeId}` : null,
        e.action ? `action=${e.action}` : null,
        e.elapsedMs != null ? `elapsedMs=${Math.round(e.elapsedMs)}` : null,
        e.userId ? `userId=${e.userId}` : null,
        e.userName ? `userName=${e.userName}` : null,
        e.userRole ? `userRole=${e.userRole}` : null,
        e.detail ? `detail=${JSON.stringify(e.detail)}` : null,
      ].filter(Boolean);
      return [base, ...parts].join(" | ");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportToCSV(filename = "scenario-analytics.csv") {
    if (typeof document === "undefined") return;
    const events = load();
    const header = [
      "timestamp",
      "type",
      "scenarioId",
      "nodeId",
      "action",
      "elapsedMs",
      "userId",
      "userName",
      "userRole",
      "detail",
    ];
    const rows = events.map((e) => {
      const cells = [
        new Date(e.ts).toISOString(),
        e.type ?? "",
        e.scenarioId ?? "",
        e.nodeId ?? "",
        e.action ?? "",
        e.elapsedMs != null ? Math.round(e.elapsedMs).toString() : "",
        e.userId ?? "",
        e.userName ?? "",
        e.userRole ?? "",
        e.detail ? JSON.stringify(e.detail) : "",
      ];
      // simple CSV escaping: wrap in quotes and escape quotes
      return cells
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  clear() {
    persist([]);
  },
};
