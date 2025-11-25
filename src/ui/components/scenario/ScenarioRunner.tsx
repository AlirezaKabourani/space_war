import { useEffect, useRef, useState } from "react";
import { AllScenarios } from "../../../scenarios";
import type { ScenarioId } from "../../../scenarios";
import type {
  ScenarioDefinition,
  ScenarioNode,
  InfoNode,
  DecisionNode,
  EndNode,
} from "../../../core/types/scenario";
import { Card } from "../common/Card";
import { eventLogger } from "../../../services/analytics/eventLogger";

interface ScenarioRunnerProps {
  scenarioId: ScenarioId;
  onExit?: () => void;
}

// 🔹 حتماً named export داریم
export const ScenarioRunner = ({ scenarioId, onExit }: ScenarioRunnerProps) => {
  const scenario: ScenarioDefinition = AllScenarios[scenarioId];

  const [currentNodeId, setCurrentNodeId] = useState<string>(scenario.start);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const nodeTimerKeyRef = useRef<string | null>(null);
  const nodeEnteredAtRef = useRef<number | null>(null);

  const node: ScenarioNode = scenario.nodes[currentNodeId];

  const stopNodeTimer = () => {
    if (!nodeTimerKeyRef.current) return undefined;
    const elapsed = eventLogger.stopTimer(nodeTimerKeyRef.current);
    nodeTimerKeyRef.current = null;
    nodeEnteredAtRef.current = null;
    return elapsed;
  };

  useEffect(() => {
    const key = `node:${scenarioId}:${currentNodeId}`;
    if (nodeTimerKeyRef.current && nodeTimerKeyRef.current !== key) {
      eventLogger.stopTimer(nodeTimerKeyRef.current);
    }
    nodeTimerKeyRef.current = key;
    nodeEnteredAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    eventLogger.startTimer(key);
    eventLogger.log({
      type: "node_enter",
      scenarioId,
      nodeId: currentNodeId,
      detail: { nodeType: node?.type },
    });

    return () => {
      if (nodeTimerKeyRef.current === key) {
        eventLogger.stopTimer(key);
        nodeTimerKeyRef.current = null;
      }
    };
  }, [scenarioId, currentNodeId, node?.type]);

  const goToNext = (nextId?: string) => {
    if (!nextId) return;
    if (!scenario.nodes[nextId]) return;
    stopNodeTimer();
    setCurrentNodeId(nextId);
    setSelectedOptionId(null); // هر بار نود عوض می‌شود، انتخاب پاک شود
  };

  // ---------- Info Node ----------
  const renderInfoNode = (infoNode: InfoNode) => (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>briefing</h2>
          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              fontSize: "0.95rem",
            }}
          >
            {infoNode.text}
          </p>
        </div>

        {infoNode.next && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={() => {
                const elapsed = stopNodeTimer();
                eventLogger.log({
                  type: "option_confirm",
                  scenarioId,
                  nodeId: infoNode.id,
                  detail: { action: "info_continue" },
                  elapsedMs: elapsed,
                });
                goToNext(infoNode.next);
              }}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-purple))",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              ادامه
            </button>
          </div>
        )}
      </div>
    </Card>
  );

  // ---------- Decision Node: انتخاب + دکمه تأیید ----------
  const renderDecisionNode = (decisionNode: DecisionNode) => {
    const handleConfirm = () => {
      if (!selectedOptionId) return;
      const chosen = decisionNode.options.find(
        (opt) => opt.id === selectedOptionId
      );
      const elapsed = stopNodeTimer();
      eventLogger.log({
        type: "option_confirm",
        scenarioId,
        nodeId: decisionNode.id,
        detail: { optionId: chosen?.id, optionText: chosen?.text },
        elapsedMs: elapsed,
      });
      if (chosen?.next) {
        goToNext(chosen.next);
      }
    };

    return (
      <Card>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div>
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
              انتخاب تاکتیکی
            </h2>
            <p
              style={{
                margin: 0,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                fontSize: "0.95rem",
              }}
            >
              {decisionNode.question}
            </p>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {decisionNode.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const elapsed =
                      nodeEnteredAtRef.current != null
                        ? (typeof performance !== "undefined"
                            ? performance.now()
                            : Date.now()) - nodeEnteredAtRef.current
                        : undefined;
                    setSelectedOptionId(opt.id); // فقط انتخاب
                    eventLogger.log({
                      type: "option_select",
                      scenarioId,
                      nodeId: decisionNode.id,
                      detail: { optionId: opt.id, optionText: opt.text },
                      elapsedMs: elapsed,
                    });
                  }} // فقط انتخاب
                  style={{
                    padding: "0.6rem 1rem",
                    borderRadius: "12px",
                    border: isSelected
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border-soft)",
                    backgroundColor: isSelected
                      ? "rgba(56, 189, 248, 0.15)"
                      : "rgba(15, 23, 42, 0.9)",
                    color: "var(--text-main)",
                    textAlign: "right",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    lineHeight: 1.8,
                    boxShadow: isSelected
                      ? "0 0 0 1px rgba(56, 189, 248, 0.4)"
                      : "none",
                    transition:
                      "background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={handleConfirm}
              disabled={!selectedOptionId}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                border: "none",
                background: !selectedOptionId
                  ? "rgba(148, 163, 184, 0.3)"
                  : "linear-gradient(135deg, var(--accent), var(--accent-purple))",
                color: "#fff",
                cursor: !selectedOptionId ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                opacity: !selectedOptionId ? 0.7 : 1,
              }}
            >
              تأیید انتخاب
            </button>
          </div>
        </div>
      </Card>
    );
  };

  // ---------- End Node ----------
  const renderEndNode = (endNode: EndNode) => (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>پایان مرحله</h2>
          <p
            style={{
              margin: 0,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              fontSize: "0.95rem",
            }}
          >
            {endNode.summaryText}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {onExit && (
            <button
              onClick={() => {
                stopNodeTimer();
                onExit();
              }}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "999px",
                border: "none",
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-purple))",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              پایان سناریو
            </button>
          )}
        </div>
      </div>
    </Card>
  );

  const renderCurrentNode = () => {
    if (!node) {
      return (
        <Card>
          <p>نود فعلی در سناریو پیدا نشد.</p>
        </Card>
      );
    }

    if (node.type === "info") return renderInfoNode(node as InfoNode);
    if (node.type === "decision" || node.type === "mcq")
      return renderDecisionNode(node as DecisionNode);
    if (node.type === "end") return renderEndNode(node as EndNode);

    return (
      <Card>
        <p>این نوع نود فعلاً در UI پیاده‌سازی نشده: {node.type}</p>
      </Card>
    );
  };

  return (
    <div
      className="scenario-runner"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {renderCurrentNode()}
    </div>
  );
};
