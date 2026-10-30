import type { EventLogEntry } from "./eventLogger";

const scenarioNames: Record<string, string> = {
  "0": "آستانه ورود",
  "1": "سایه‌ها در مدار پایین (قدیمی)",
  "2": "امواج خاموش (قدیمی)",
  "3": "کریدور امن (قدیمی)",
  "4": "۱ — حریم خاکستری مدار",
  "5": "۲ — امواج خاموش",
  s0_gateway_space_wargaming: "آستانه ورود",
  s1_shadows_low_orbit: "سایه‌ها در مدار پایین (قدیمی)",
  s2_silent_waves: "امواج خاموش (قدیمی)",
  s3_secure_corridor: "کریدور امن (قدیمی)",
  s4_redesigned_scenario_one: "۱ — حریم خاکستری مدار",
  s5_silent_waves_redesign: "۲ — امواج خاموش",
};

const flatten = (value: Record<string, unknown>, prefix = "detail"): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const path = `${prefix}.${key}`;
    if (item !== null && typeof item === "object" && !Array.isArray(item) && Object.keys(item).length) {
      Object.assign(result, flatten(item as Record<string, unknown>, path));
    } else {
      result[path] = item;
    }
  }
  return result;
};

const csvCell = (value: unknown) => {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  // Keep player names and other text from being interpreted as spreadsheet formulas.
  const safeText = /^[\s]*[=+@-]/.test(text) && typeof value !== "number" ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

export const buildLogCSV = (events: readonly EventLogEntry[]): string => {
  const rows = events.map((event) => ({
    id: event.id,
    timestamp: new Date(event.ts).toISOString(),
    type: event.type,
    scenarioId: event.scenarioId,
    scenarioTitle: scenarioNames[String(event.scenarioId)] ?? "",
    nodeId: event.nodeId,
    action: event.action,
    elapsedMs: event.elapsedMs,
    userId: event.userId,
    userName: event.userName,
    userRole: event.userRole,
    detail: event.detail,
    ...flatten(event.detail ?? {}),
  }));
  const headers = ["id", "timestamp", "type", "scenarioId", "scenarioTitle", "nodeId", "action", "elapsedMs", "userId", "userName", "userRole", "detail"];
  const dynamicHeaders = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !headers.includes(key))))].sort();
  const columns = [...headers, ...dynamicHeaders];
  return "\uFEFF" + [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((key) => csvCell((row as Record<string, unknown>)[key])).join(","))].join("\r\n");
};

export const downloadFile = (filename: string, content: string, type = "application/json") => {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
