import type { EventLogEntry } from "./eventLogger";

export const SYSTEM_LOG_KEY = "space-war.system.events";

export const systemLogger = {
  getEvents(): EventLogEntry[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(SYSTEM_LOG_KEY) ?? "[]");
      return Array.isArray(value) ? value as EventLogEntry[] : [];
    } catch {
      return [];
    }
  },
  log(type: string, actor?: { id: string; name: string; role: string }, detail?: Record<string, unknown>) {
    const event: EventLogEntry = {
      id: crypto.randomUUID(), ts: Date.now(), type,
      userId: actor?.id, userName: actor?.name, userRole: actor?.role, detail,
    };
    try {
      localStorage.setItem(SYSTEM_LOG_KEY, JSON.stringify([...this.getEvents(), event]));
      return event;
    } catch {
      return null;
    }
  },
};
