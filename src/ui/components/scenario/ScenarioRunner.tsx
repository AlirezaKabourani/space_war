import { useEffect, useState } from "react";
import type {
  ScenarioDefinition,
  ScenarioNode,
  InfoNode,
  DecisionNode,
  EndNode,
  AllocationNode,
  MiniGameNode,
  AssessmentEvent,
} from "../../../core/types/scenario";
import { AllScenarios } from "../../../scenarios";
import type { ScenarioId } from "../../../scenarios";
import { Card } from "../common/Card";
import { ScenarioEngine } from "../../../core/engine/scenarioEngine";
import { AssessmentRecorder } from "../../../core/engine/assessmentRecorder";

interface ScenarioRunnerProps {
  scenarioId: ScenarioId;
  onExit: () => void;
}

export const ScenarioRunner = ({ scenarioId, onExit }: ScenarioRunnerProps) => {
  const scenario = AllScenarios[scenarioId] as ScenarioDefinition;
  const [engine, setEngine] = useState<ScenarioEngine | null>(null);
  const [node, setNode] = useState<ScenarioNode>(scenario.nodes[scenario.start]);
  const [events, setEvents] = useState<AssessmentEvent[]>([]);
  const [allocValues, setAllocValues] = useState<Record<string, number>>({});
  const [minigameStarted, setMinigameStarted] = useState(false);

  useEffect(() => {
    const recorder = new AssessmentRecorder({
      onEvent: (e) => setEvents((prev) => [...prev, e]),
    });
    const eng = new ScenarioEngine(scenario, {
      callbacks: {
        onNodeChange: setNode,
        onScenarioComplete: () => {},
        onEvent: (e) => setEvents((prev) => [...prev, e]),
      },
      recorder,
    });
    setEngine(eng);
    setNode(eng.getCurrentNode());
    setEvents([]);
    setAllocValues({});
    setMinigameStarted(false);
  }, [scenarioId, scenario]);

  useEffect(() => {
    if (node.type === "allocation" || node.type === "resource") {
      const allocNode = node as AllocationNode;
      const initial: Record<string, number> = {};
      allocNode.resources.forEach((r) => {
        initial[r.name] = r.min ?? 0;
      });
      setAllocValues(initial);
    } else {
      setAllocValues({});
    }
    setMinigameStarted(false);
  }, [node]);

  if (!engine) return null;

  const renderNode = () => {
    if (node.type === "info") {
      const infoNode = node as InfoNode;
      return (
        <>
          <h2 style={{ marginTop: 0 }}>{scenario.title}</h2>
          <p style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {infoNode.text}
          </p>
          {infoNode.next && (
            <button
              onClick={() => engine.advanceFromInfo(infoNode.next)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "#0b1020",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              شروع سناریو
            </button>
          )}
        </>
      );
    }

    if (node.type === "decision" || node.type === "mcq") {
      const decisionNode = node as DecisionNode;
      return (
        <>
          <h2 style={{ marginTop: 0 }}>انتخاب تاکتیکی</h2>
          <p style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            {decisionNode.question}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {decisionNode.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => engine.selectDecisionOption(opt.id, opt.next)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-soft)",
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  color: "var(--text-main)",
                  textAlign: "right",
                  cursor: "pointer",
                }}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (node.type === "allocation" || node.type === "resource") {
      const allocNode = node as AllocationNode;
      const handleSubmit = () => {
        engine.submitAllocation(allocValues, allocNode.next);
      };
      return (
        <>
          <h2 style={{ marginTop: 0 }}>تخصیص منابع</h2>
          <p style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>{allocNode.instructions}</p>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {allocNode.resources.map((r) => (
              <label key={r.name} style={{ display: "grid", gap: "0.25rem" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {r.name} (حداکثر {r.max})
                </span>
                <input
                  type="number"
                  min={r.min ?? 0}
                  max={r.max}
                  value={allocValues[r.name] ?? 0}
                  onChange={(e) =>
                    setAllocValues((prev) => ({
                      ...prev,
                      [r.name]: Math.min(r.max, Math.max(r.min ?? 0, Number(e.target.value))),
                    }))
                  }
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "10px",
                    border: "1px solid var(--border-soft)",
                    backgroundColor: "rgba(15, 23, 42, 0.85)",
                    color: "var(--text-main)",
                  }}
                />
              </label>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "#0b1020",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ثبت تخصیص
            </button>
          </div>
        </>
      );
    }

    if (node.type === "minigame") {
      const mgNode = node as MiniGameNode;
      const handleStart = () => {
        engine.startMinigame();
        setMinigameStarted(true);
      };
      const handleFinish = () => {
        engine.endMinigame(mgNode.next, { result: "placeholder" });
      };
      return (
        <>
          <h2 style={{ marginTop: 0 }}>مینی‌گیم ({mgNode.game})</h2>
          <p style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
            این یک جایگزین موقت برای مینی‌گیم است. با شروع، یک رویداد ثبت می‌شود و با پایان به گام بعدی می‌رویم.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleStart}
              disabled={minigameStarted}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "#0b1020",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              شروع مینی‌گیم
            </button>
            <button
              onClick={handleFinish}
              disabled={!minigameStarted}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "999px",
                border: "1px solid var(--border-soft)",
                backgroundColor: "transparent",
                color: "var(--text-main)",
                cursor: "pointer",
              }}
            >
              پایان و رفتن به بعدی
            </button>
          </div>
        </>
      );
    }

    if (node.type === "end") {
      const endNode = node as EndNode;
      return (
        <>
          <h2 style={{ marginTop: 0 }}>پایان سناریو</h2>
          <p style={{ marginTop: "0.5rem" }}>{endNode.summaryText}</p>
        </>
      );
    }

    // Placeholder for other node types (allocation, minigame)
    return (
      <>
        <h2 style={{ marginTop: 0 }}>این نوع نود هنوز پیاده‌سازی نشده است</h2>
        <p style={{ marginTop: "0.5rem" }}>
          نوع نود فعلی: <code>{node.type}</code>
        </p>
      </>
    );
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Card>{renderNode()}</Card>

      {events.length > 0 && (
        <Card>
          <h4 style={{ margin: "0 0 0.5rem" }}>لاگ اقدامات</h4>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "grid", gap: "0.35rem" }}>
            {events.slice(-6).map((e, idx) => (
              <div key={idx}>
                <strong>{e.action}</strong> — node: {e.nodeId} — {e.durationMs ?? 0}ms
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <button
          onClick={onExit}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: "999px",
            border: "1px solid var(--border-soft)",
            backgroundColor: "transparent",
            color: "var(--text-main)",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          بازگشت به فهرست سناریوها
        </button>
      </div>
    </div>
  );
};
