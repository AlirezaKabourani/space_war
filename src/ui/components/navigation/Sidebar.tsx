const navButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "var(--text-main)",
  border: "none",
  textAlign: "right",
  cursor: "pointer",
  padding: "0.45rem 0.75rem",
  borderRadius: "999px",
  fontSize: "0.95rem",
};

export const Sidebar = () => {
  return (
    <aside
      style={{
        width: "260px",
        background: "#020617",
        borderLeft: "1px solid rgba(148, 163, 184, 0.25)",
        color: "var(--text-main)",
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          marginBottom: "0.5rem",
          fontWeight: 700,
          fontSize: "1.1rem",
          lineHeight: 1.4,
        }}
      >
        سامانه آموزش و ارزیابی جنگ فضایی
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <button
          style={{
            ...navButtonStyle,
            background:
              "linear-gradient(90deg, var(--accent-soft), transparent)",
          }}
        >
          نمای کلی
        </button>
        <button
          style={{
            ...navButtonStyle,
          }}
        >
          سناریوها
        </button>
        <button
          style={{
            ...navButtonStyle,
          }}
        >
          پروفایل شناختی
        </button>
      </nav>
    </aside>
  );
};
