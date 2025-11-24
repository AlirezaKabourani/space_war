import type { ReactNode } from "react";
import { Card } from "../common/Card";
import { AllScenarios } from "../../../scenarios";
import type { ScenarioId } from "../../../scenarios";

interface ScenarioListPanelProps {
  onSelectScenario: (id: ScenarioId) => void;
}

export const ScenarioListPanel = ({ onSelectScenario }: ScenarioListPanelProps) => {
  const scenarios = Object.values(AllScenarios);

  const renderFocus = (focus?: string[] | ReactNode) => {
    if (!focus) return null;
    if (Array.isArray(focus)) {
      return focus.join("، ");
    }
    return focus;
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {scenarios.map((sc) => (
        <div
          key={sc.id}
          style={{ cursor: "pointer" }}
          onClick={() => onSelectScenario(sc.id as ScenarioId)}
        >
          <Card>
            <h2 style={{ margin: 0, marginBottom: "0.25rem" }}>{sc.title}</h2>
            <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>
              سطح دشواری: متوسط
            </p>
            <p
              style={{
                margin: "0.5rem 0 0",
                fontSize: "0.85rem",
                opacity: 0.7,
              }}
            >
              تمرکز شناختی: {renderFocus(["آگاهی موقعیتی", "تخصیص منابع ISR"])}
            </p>
          </Card>
        </div>
      ))}
    </div>
  );
};
