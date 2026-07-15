/**
 * components/dashboard/QuickActions.tsx
 *
 * Three quick-action cards for the patient dashboard.
 * Provides fast access to the most common patient workflows:
 *  1. Start a new health assessment
 *  2. Upload a medical report for AI explanation
 *  3. Open the voice assistant
 *
 * Layout:
 *  - CSS grid with `auto-fit, minmax(180px, 1fr)` — 3 columns on desktop,
 *    stacks on mobile
 *  - Each card scales up slightly on hover for tactile feedback
 *
 * This component is a pure Server Component — no hooks or browser APIs.
 */

import Link from "next/link";
import { Activity, FileUp, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── DATA ──────────────────────────────────────────────────────────────────── */

interface ActionItem {
  /** The lucide-react icon component */
  Icon: LucideIcon;
  /** Primary label shown below the icon */
  label: string;
  /** Secondary text providing context */
  subtitle: string;
  /** Route to navigate to when clicked */
  href: string;
}

/** The three quick actions available on the dashboard */
const ACTIONS: ActionItem[] = [
  {
    Icon: Activity,
    label: "New Assessment",
    subtitle: "Check your health",
    href: "/dashboard/assessment/new",
  },
  {
    Icon: FileUp,
    label: "Upload Report",
    subtitle: "Get AI explanation",
    href: "/dashboard/reports/new",
  },
  {
    Icon: Mic,
    label: "Voice Assistant",
    subtitle: "Ask a question",
    href: "/dashboard/voice",
  },
];

/* ── ACTION CARD ───────────────────────────────────────────────────────────── */

/**
 * A single clickable action card with icon, label, and subtitle.
 * @param item - The action data to render
 * @param index - Used to generate a unique class name for hover styles
 */
function ActionCard({ item, index }: { item: ActionItem; index: number }) {
  const cardClass = `quick-action-card-${index}`;
  const { Icon } = item;

  return (
    <>
      <Link
        href={item.href}
        className={cardClass}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1.25rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid #F0D9D9",
          borderRadius: "1rem",
          textDecoration: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "#FFF5F5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} color="#C0392B" strokeWidth={2} />
        </div>

        {/* Text */}
        <div>
          <span
            style={{
              display: "block",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "#1A1A1A",
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              display: "block",
              fontSize: "0.8125rem",
              color: "#6B7280",
              marginTop: "0.125rem",
            }}
          >
            {item.subtitle}
          </span>
        </div>
      </Link>

      {/* Hover scale — inline styles cannot contain :hover pseudo-class */}
      <style>{`
        .${cardClass}:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(192, 57, 43, 0.08);
        }
      `}</style>
    </>
  );
}

/* ── MAIN EXPORT ───────────────────────────────────────────────────────────── */

/**
 * Grid of quick-action cards for the patient dashboard.
 *
 * @example
 * ```tsx
 * <QuickActions />
 * ```
 */
export default function QuickActions() {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
      }}
    >
      {ACTIONS.map((action, i) => (
        <ActionCard key={action.href} item={action} index={i} />
      ))}
    </section>
  );
}
