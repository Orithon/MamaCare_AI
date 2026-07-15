"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Users, Activity, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * components/provider/ProviderSidebar.tsx
 *
 * Navigation for the Provider Dashboard.
 * Left sidebar on desktop, bottom tab bar on mobile.
 */

export default function ProviderSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR safety

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { name: "Overview", href: "/provider", icon: LayoutDashboard },
    { name: "Patients", href: "/provider/patients", icon: Users },
    { name: "Alerts", href: "/provider/alerts", icon: Activity },
  ];

  if (isMobile) {
    // Mobile Bottom Tab Bar
    return (
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #F0D9D9",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 50,
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/provider");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color: isActive ? "#C0392B" : "#6B7280",
                width: "33.33%",
              }}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span
                style={{
                  fontSize: "10px",
                  marginTop: "4px",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      style={{
        width: "260px",
        height: "100vh",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #F0D9D9",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
      }}
    >
      <div style={{ padding: "2rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#C0392B" }}>
          MamaCare <span style={{ color: "#1A1A1A" }}>Provider</span>
        </h2>
      </div>

      <nav style={{ flex: 1, padding: "0 1rem" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/provider");
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    textDecoration: "none",
                    color: isActive ? "#C0392B" : "#4B5563",
                    backgroundColor: isActive ? "#FFF5F5" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ padding: "1.5rem" }}>
        <button
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            color: "#6B7280",
            backgroundColor: "transparent",
            border: "none",
            width: "100%",
            fontFamily: "inherit",
            fontSize: "1rem",
            cursor: "pointer",
            fontWeight: 500,
            borderRadius: "0.5rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
