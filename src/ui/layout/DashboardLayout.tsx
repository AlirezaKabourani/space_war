import type { PropsWithChildren } from "react";
import { Sidebar } from "../components/navigation/Sidebar";
import { TopBar } from "../components/navigation/TopBar";

type DashboardLayoutProps = PropsWithChildren;

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div
      className="app-root"
      style={{
        display: "flex",
        minHeight: "100vh",
        direction: "rtl", 
        flexDirection: "row-reverse", 
      }}
    >
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar />
        <main
          style={{
            flex: 1,
            padding: "1.5rem",
            background: "#050816",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
