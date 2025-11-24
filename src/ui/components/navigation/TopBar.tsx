export const TopBar = () => {
  return (
    <header
      style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(5, 8, 22, 0.95)",
        color: "white",
      }}
    >
      <div>مرکز فرماندهی عملیات فضایی</div>
      <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>کاربر: فرمانده تست</div>
    </header>
  );
};
