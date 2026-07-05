import { useEffect, useRef, useState } from "react";
import { AllScenarios } from "../../../scenarios";
import type { ScenarioId } from "../../../scenarios";
import type {
  ScenarioDefinition,
  ScenarioNode,
  InfoNode,
  DecisionNode,
  QuizNode,
  MiniGameNode,
  EndNode,
} from "../../../core/types/scenario";
import { Card } from "../common/Card";
import { eventLogger } from "../../../services/analytics/eventLogger";
import { MiniGameHost } from "./MiniGameHost";

interface ScenarioRunnerProps {
  scenarioId: ScenarioId;
  onExit?: () => void;
  onNodeChange?: (nodeId: string) => void;
  onCompletionUiActiveChange?: (active: boolean) => void;
  allowSkipToMiniGame?: boolean;
  userProfileId?: string;
}

// 🔹 حتماً named export داریم
export const ScenarioRunner = ({
  scenarioId,
  onExit,
  onNodeChange,
  onCompletionUiActiveChange,
  allowSkipToMiniGame = false,
  userProfileId,
}: ScenarioRunnerProps) => {
  const scenario: ScenarioDefinition = AllScenarios[scenarioId];

  const [currentNodeId, setCurrentNodeId] = useState<string>(scenario.start);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizNextId, setQuizNextId] = useState<string | null>(null);
  const [quizReferenceText, setQuizReferenceText] = useState<string | null>(null);
  const [quizReferenceLabel, setQuizReferenceLabel] = useState<string | null>(null);
  const nodeTimerKeyRef = useRef<string | null>(null);
  const nodeEnteredAtRef = useRef<number | null>(null);

  const node: ScenarioNode = scenario.nodes[currentNodeId];
  const firstMiniGameNodeId = Object.values(scenario.nodes).find(
    (scenarioNode) => scenarioNode.type === "minigame"
  )?.id;

  useEffect(() => {
    setCurrentNodeId(scenario.start);
    onNodeChange?.(scenario.start);
  }, [scenario.start, scenarioId, onNodeChange]);

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
    onNodeChange?.(currentNodeId);

    return () => {
      if (nodeTimerKeyRef.current === key) {
        eventLogger.stopTimer(key);
        nodeTimerKeyRef.current = null;
      }
    };
  }, [scenarioId, currentNodeId, node?.type, onNodeChange]);

  const goToNext = (nextId?: string) => {
    if (!nextId) return;
    if (!scenario.nodes[nextId]) return;
    stopNodeTimer();
    setCurrentNodeId(nextId);
    setSelectedOptionId(null); // هر بار نود عوض می‌شود، انتخاب پاک شود
    setQuizChecked(false);
    setQuizNextId(null);
    setQuizReferenceText(null);
    setQuizReferenceLabel(null);
  };

  const renderQuizQuestion = (quizNode: QuizNode) => {
    if (!quizNode.referenceTexts) return quizNode.question;
    const referenceKeys = Object.keys(quizNode.referenceTexts).filter(
      (key) => key.length > 0
    );
    if (referenceKeys.length === 0) return quizNode.question;

    // Match configured reference labels anywhere in the question text.
    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = referenceKeys
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join("|");
    const splitRegex = new RegExp(`(${pattern})`, "g");
    const parts = quizNode.question.split(splitRegex);

    return parts.map((part, index) => {
      const referenceText = quizNode.referenceTexts?.[part];
      if (!referenceText) return <span key={`${part}-${index}`}>{part}</span>;
      return (
        <button
          key={`${part}-${index}`}
          onClick={() => {
            setQuizReferenceLabel(part);
            setQuizReferenceText(referenceText);
            eventLogger.log({
              type: "option_select",
              scenarioId,
              nodeId: quizNode.id,
              detail: { action: "quiz_reference_open", label: part },
            });
          }}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            color: "var(--accent)",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "inherit",
            lineHeight: "inherit",
          }}
        >
          {part}
        </button>
      );
    });
  };


  const renderQuizNode = (quizNode: QuizNode) => {
  const handleConfirm = () => {
    if (!selectedOptionId) return;
    const chosen = quizNode.options.find((opt) => opt.id === selectedOptionId);
    const elapsed = stopNodeTimer();
    eventLogger.log({
      type: "option_confirm",
      scenarioId,
      nodeId: quizNode.id,
      detail: {
        optionId: chosen?.id,
        optionText: chosen?.text,
        isCorrect: chosen?.isCorrect,
      },
      elapsedMs: elapsed,
    });
    setQuizChecked(true);
    setQuizNextId(chosen?.next ?? null);
  };

  const handleContinue = () => {
    eventLogger.log({
      type: "option_confirm",
      scenarioId,
      nodeId: quizNode.id,
      detail: { action: "quiz_continue" },
    });
    goToNext(quizNextId ?? undefined);
  };

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
            {renderQuizQuestion(quizNode)}
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {quizNode.options.map((opt) => {
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
                  setSelectedOptionId(opt.id);
                  eventLogger.log({
                    type: "option_select",
                    scenarioId,
                    nodeId: quizNode.id,
                    detail: { optionId: opt.id, optionText: opt.text },
                    elapsedMs: elapsed,
                  });
                }} // فقط انتخاب
                disabled={quizChecked}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "12px",
                  border: quizChecked
                    ? opt.isCorrect
                      ? "1px solid #22c55e"
                      : selectedOptionId === opt.id
                        ? "1px solid #ef4444"
                        : "1px solid var(--border-soft)"
                    : isSelected
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border-soft)",
                  backgroundColor: quizChecked
                    ? opt.isCorrect
                      ? "#22c55e"
                      : selectedOptionId === opt.id
                        ? "#ef4444"
                        : "rgba(15, 23, 42, 0.9)"
                    : isSelected
                      ? "rgba(56, 189, 248, 0.15)"
                      : "rgba(15, 23, 42, 0.9)",
                  color:
                    quizChecked && (opt.isCorrect || selectedOptionId === opt.id)
                      ? "#ffffff"
                      : "var(--text-main)",
                  textAlign: "right",
                  cursor: quizChecked ? "default" : "pointer",
                  fontSize: "0.9rem",
                  lineHeight: 1.8,
                  boxShadow: quizChecked
                    ? opt.isCorrect
                      ? "0 0 0 1px rgba(34, 197, 94, 0.35)"
                      : selectedOptionId === opt.id
                        ? "0 0 0 1px rgba(239, 68, 68, 0.35)"
                        : "none"
                    : isSelected
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
          {!quizChecked && (
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
          )}
          {quizChecked && (
            <button
              onClick={handleContinue}
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
          )}
        </div>
      </div>
    </Card>
  );
};


  // ---------- Info Node ----------
  const renderInfoNode = (infoNode: InfoNode) => (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>توضیحات</h2>
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
  const renderEndNode = (endNode: EndNode) => {
    const isScenarioOneEnd = scenarioId === "s1_shadows_low_orbit";
    return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
            {isScenarioOneEnd ? "پایان سناریو ۱" : "پایان مرحله"}
          </h2>
          {isScenarioOneEnd ? (
            <p style={{ margin: 0, lineHeight: 1.9, fontSize: "0.95rem" }}>
              سناریو ۱ — <strong>سایه‌های مدار پایین</strong> به پایان رسید. شما در این مأموریت با رفتار مبهم یک ماهواره ناشناس، محدودیت منابع رصدی، ریسک تشدید تنش و خطر افشای اطلاعات روبه‌رو شدید و تصمیم‌های شما مسیر بحران را شکل داد. اکنون این مرحله کامل شده و آماده ورود به سناریو بعدی هستید: <strong>سناریو ۲ — امواج خاموش</strong>؛ جایی که نبرد از سطح مشاهده مداری فراتر می‌رود و به لایه ارتباطات، سیگنال‌ها و اختلالات پنهان کشیده می‌شود.
            </p>
          ) : (
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
          )}
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
              {isScenarioOneEnd ? "رفتن به منو انتخاب سناریو ها" : "پایان سناریو"}
            </button>
          )}
        </div>
      </div>
    </Card>
    );
  };

  const renderMiniGameNode = (miniGameNode: MiniGameNode) => (
    <MiniGameHost
      scenarioId={scenarioId}
      nodeId={miniGameNode.id}
      game={miniGameNode.game}
      userProfileId={userProfileId}
      onCompletionUiActiveChange={onCompletionUiActiveChange}
      onComplete={() => {
        stopNodeTimer();
        goToNext(miniGameNode.next);
      }}
    />
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
    if (node.type === "quiz") return renderQuizNode(node as QuizNode);
    if (node.type === "minigame") return renderMiniGameNode(node as MiniGameNode);
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
      {allowSkipToMiniGame &&
        firstMiniGameNodeId &&
        node?.type !== "minigame" &&
        node?.type !== "end" && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={() => {
                eventLogger.log({
                  type: "admin_skip_to_minigame",
                  scenarioId,
                  nodeId: currentNodeId,
                  detail: {
                    targetNodeId: firstMiniGameNodeId,
                    reason: "admin_minigame_review",
                  },
                });
                goToNext(firstMiniGameNodeId);
              }}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "999px",
                border: "1px solid var(--border-soft)",
                background: "rgba(15, 23, 42, 0.82)",
                color: "var(--text-main)",
                cursor: "pointer",
              }}
            >
              عبور ادمین به مینی‌گیم
            </button>
          </div>
        )}
      {renderCurrentNode()}
      {quizReferenceText && (
        <div
          onClick={() => {
            setQuizReferenceText(null);
            setQuizReferenceLabel(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.62)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(680px, 100%)",
              background: "rgba(15, 23, 42, 0.98)",
              border: "1px solid var(--border-soft)",
              borderRadius: "14px",
              padding: "1rem",
              boxShadow: "0 20px 60px rgba(2, 6, 23, 0.45)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>
                {quizReferenceLabel ?? "مرجع"}
              </h3>
              <button
                onClick={() => {
                  setQuizReferenceText(null);
                  setQuizReferenceLabel(null);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
              >
                بستن
              </button>
            </div>
            <p
              style={{
                margin: "0.8rem 0 0",
                lineHeight: 1.9,
                whiteSpace: "pre-wrap",
                fontSize: "0.95rem",
              }}
            >
              {quizReferenceText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


