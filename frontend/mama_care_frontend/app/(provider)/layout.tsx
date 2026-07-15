"use client";

import ProviderSidebar from "@/components/provider/ProviderSidebar";
import MobileHeader from "@/components/MobileHeader";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#F9FAFB" }}>
      <ProviderSidebar />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <MobileHeader />
        <div style={{ padding: "1.5rem", paddingBottom: "5rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
