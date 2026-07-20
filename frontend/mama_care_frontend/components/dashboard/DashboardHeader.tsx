/**
 * components/dashboard/DashboardHeader.tsx
 *
 * Top-level header bar for the Patient Dashboard.
 *
 * Displays:
 *  - A warm personalised greeting with the patient's name
 *  - The current gestational week as a subtitle
 *  - A colour-coded pill showing days remaining until the due date
 *
 * Layout:
 *  - On desktop: greeting on the left, pill on the right (row)
 *  - On mobile: pill wraps below the greeting (column)
 *
 * This component is a pure Server Component — no hooks or browser APIs used.
 */

import { CalendarDays } from "lucide-react";

/* ── PROPS ──────────────────────────────────────────────────────────────────── */

/** @param fullName        Patient's display name */
/** @param gestationalWeek Current week of pregnancy (1–42) */
/** @param daysUntilDue    Number of days remaining until EDD */
interface DashboardHeaderProps {
  fullName: string;
  gestationalWeek: number;
  daysUntilDue: number;
}

/* ── COMPONENT ─────────────────────────────────────────────────────────────── */

/**
 * Dashboard greeting header with due-date countdown pill.
 *
 * @example
 * ```tsx
 * <DashboardHeader fullName="Amina" gestationalWeek={32} daysUntilDue={56} />
 * ```
 */
export default function DashboardHeader({
  fullName,
  gestationalWeek,
  daysUntilDue,
}: DashboardHeaderProps) {
  return (
    <header
      className="dashboard-header"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "1.5rem 0",
      }}
    >
      {/* ── Left: Greeting & subtitle ─────────────────────────────────── */}
      <div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Hello, {fullName} 
        </h1>

        <p
          style={{
            fontSize: "0.9375rem",
            color: "#6B7280",
            margin: "0.25rem 0 0 0",
            fontWeight: 400,
          }}
        >
          Week {gestationalWeek} of pregnancy
        </p>
      </div>

      {/* ── Right: Due-date pill ──────────────────────────────────────── */}
      <div
        className="dashboard-header-pill"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "#FFF5F5",
          color: "#C0392B",
          padding: "0.5rem 1rem",
          borderRadius: "9999px",
          fontSize: "0.875rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
          border: "1px solid #F0D9D9",
        }}
      >
        <CalendarDays size={16} strokeWidth={2.25} />
        {daysUntilDue} days until due date
      </div>

      {/*
       * Responsive override:
       * On narrow screens the pill wraps below the greeting.
       */}
      <style>{`
        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </header>
  );
}
