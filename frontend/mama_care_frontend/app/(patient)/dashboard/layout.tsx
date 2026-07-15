"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import MobileHeader from "@/components/MobileHeader";

/**
 * Layout for all `/dashboard` routes.
 *
 * Renders the {@link Sidebar} on the left (desktop) or as a fixed bottom bar
 * (mobile) alongside the main content area. The Sidebar component handles
 * its own responsive display internally.
 *
 * Extra `paddingBottom` on the `<main>` element ensures page content is not
 * obscured by the mobile bottom tab bar.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#FFF5F5",
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <MobileHeader />
        <div style={{ padding: "1.5rem", paddingBottom: "5rem", flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
