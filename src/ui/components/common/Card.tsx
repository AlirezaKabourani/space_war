import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren;

export const Card = ({ children }: CardProps) => {
  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderRadius: "16px",
        border: "1px solid var(--border-soft)",
        padding: "1rem 1.25rem",
        color: "var(--text-main)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
        direction: "rtl",
        textAlign: "right",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* accent top border */}
      <div
        style={{
          position: "absolute",
          insetInlineStart: 0,
          insetInlineEnd: 0,
          top: 0,
          height: "2px",
          background:
            "linear-gradient(90deg, rgba(56,189,248,0.2), rgba(168,85,247,0.6), rgba(56,189,248,0.2))",
          opacity: 0.9,
        }}
      />
      {children}
    </div>
  );
};
