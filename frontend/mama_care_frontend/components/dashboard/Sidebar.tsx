"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  LayoutDashboard,
  Activity,
  FileText,
  Mic,
  LogOut,
  Settings,
} from "lucide-react";

/**
 * Design tokens used throughout the sidebar.
 */
const TOKENS = {
  primary: "#C0392B",
  primaryHover: "#A93226",
  primaryLight: "#FDECEA",
  background: "#FFF5F5",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#F0D9D9",
  sidebarWidth: 260,
  bottomBarHeight: 64,
  borderRadius: "1rem",
} as const;

/** Navigation item definition. */
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

/** All dashboard navigation items. */
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assessment", href: "/dashboard/assessment", icon: Activity },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Voice", href: "/dashboard/voice", icon: Mic },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

/**
 * Determines whether `pathname` matches the given nav `href`.
 * Exact match for "/dashboard", startsWith for sub-routes.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(href);
}

/**
 * Sidebar / bottom tab bar navigation for the patient dashboard.
 *
 * - **Desktop (≥ 768 px)**: renders as a fixed left sidebar (260 px wide)
 *   with the MamaCare logo, nav links, and a Sign Out button.
 * - **Mobile (< 768 px)**: renders as a fixed bottom tab bar (64 px tall)
 *   without the logo or Sign Out button.
 *
 * Uses `useEffect` + `window.resize` listener with an `isMobile` state
 * variable (defaults to `true` for SSR safety).
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Mobile bottom tab bar                                              */
  /* ------------------------------------------------------------------ */
  if (isMobile) {
    return (
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: TOKENS.bottomBarHeight,
          backgroundColor: TOKENS.surface,
          borderTop: `1px solid ${TOKENS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 50,
        }}
        aria-label="Dashboard navigation"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                textDecoration: "none",
                color: active ? TOKENS.primary : TOKENS.muted,
                fontSize: "0.625rem",
                fontFamily: "Inter, sans-serif",
                fontWeight: active ? 600 : 400,
                transition: "color 0.2s ease",
              }}
            >
              <Icon size={22} color={active ? TOKENS.primary : TOKENS.muted} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Desktop sidebar                                                    */
  /* ------------------------------------------------------------------ */
  return (
    <aside
      style={{
        width: TOKENS.sidebarWidth,
        minHeight: "100vh",
        backgroundColor: TOKENS.surface,
        borderRight: `1px solid ${TOKENS.border}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        flexShrink: 0,
      }}
      aria-label="Dashboard navigation"
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem",
          borderBottom: `1px solid ${TOKENS.border}`,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: TOKENS.primary,
              letterSpacing: "-0.02em",
            }}
          >
            MamaCare
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: TOKENS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            AI
          </span>
        </Link>
      </div>

      {/* Navigation links */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem" }}>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    textDecoration: "none",
                    color: active ? TOKENS.primary : TOKENS.text,
                    backgroundColor: active ? TOKENS.primaryLight : "transparent",
                    fontWeight: active ? 600 : 400,
                    fontSize: "0.9375rem",
                    transition: "background-color 0.2s ease, color 0.2s ease",
                  }}
                >
                  <Icon
                    size={20}
                    color={active ? TOKENS.primary : TOKENS.muted}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out button */}
      <div
        style={{
          padding: "1rem 0.75rem",
          borderTop: `1px solid ${TOKENS.border}`,
        }}
      >
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: "none",
            backgroundColor: "transparent",
            color: TOKENS.muted,
            fontSize: "0.9375rem",
            fontFamily: "Inter, sans-serif",
            cursor: "pointer",
            transition: "background-color 0.2s ease, color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = TOKENS.primaryLight;
            e.currentTarget.style.color = TOKENS.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = TOKENS.muted;
          }}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
