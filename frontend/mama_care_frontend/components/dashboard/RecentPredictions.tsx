/**
 * components/dashboard/RecentPredictions.tsx
 *
 * Timeline section showing the patient's recent health-check predictions.
 *
 * Features:
 *  - Vertical timeline line connecting entries on the left
 *  - Short-format date (e.g. "2 Jul") on the left
 *  - Summary text in the centre
 *  - Colour-coded risk-level pill on the right
 *  - Caps display at 5 entries
 *  - Friendly empty state when no predictions exist
 *
 * This component is a pure Server Component — no hooks or browser APIs.
 */

import Link from "next/link";
import { PredictionEntry, RISK_COLOURS } from "@/lib/dashboard-data";

/* ── PROPS ──────────────────────────────────────────────────────────────────── */

interface RecentPredictionsProps {
  /** Array of prediction entries (newest first) */
  predictions: PredictionEntry[];
}

/* ── HELPERS ───────────────────────────────────────────────────────────────── */

/** Maximum number of prediction entries to display */
const MAX_ENTRIES = 5;

/**
 * Formats an ISO date string into a short, scannable format.
 * @example formatShortDate("2026-07-02T14:30:00Z") → "2 Jul"
 */
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ── EMPTY STATE ───────────────────────────────────────────────────────────── */

/** Displayed when the predictions array is empty */
function EmptyState() {
  return (
    <p
      style={{
        fontSize: "0.9375rem",
        color: "#6B7280",
        textAlign: "center",
        padding: "2rem 1rem",
        margin: 0,
      }}
    >
      No health checks yet. Start your first one above!
    </p>
  );
}

/* ── TIMELINE ENTRY ────────────────────────────────────────────────────────── */

/**
 * A single timeline row for one prediction.
 * @param prediction - The prediction data to render
 * @param isLast     - If true, hides the connecting line below the dot
 */
function TimelineEntry({
  prediction,
  isLast,
}: {
  prediction: PredictionEntry;
  isLast: boolean;
}) {
  const colours = RISK_COLOURS[prediction.riskLevel];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        position: "relative",
        paddingBottom: isLast ? 0 : "1.25rem",
      }}
    >
      {/* ── Timeline column: dot + line ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: "12px",
          position: "relative",
          marginTop: "4px",
        }}
      >
        {/* Dot */}
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: colours.text,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        />
        {/* Vertical connecting line (hidden on last entry) */}
        {!isLast && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "2px",
              bottom: "-1.25rem", // Extend down to the next dot
              backgroundColor: "#F0D9D9",
            }}
          />
        )}
      </div>

      {/* ── Content column ─────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Header row: Date and Risk Pill */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#6B7280",
            }}
          >
            {formatShortDate(prediction.date)}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.125rem 0.625rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: colours.bg,
              color: colours.text,
              border: `1px solid ${colours.border}`,
              whiteSpace: "nowrap",
            }}
          >
            {prediction.riskLevel}
          </span>
        </div>

        {/* ── Summary text ───────────────────────────────────────────── */}
        <p
          style={{
            fontSize: "0.9375rem",
            color: "#1A1A1A",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {prediction.summary}
        </p>
      </div>
    </div>
  );
}

/* ── MAIN EXPORT ───────────────────────────────────────────────────────────── */

/**
 * Recent health checks timeline section for the patient dashboard.
 *
 * @example
 * ```tsx
 * <RecentPredictions predictions={recentPredictions} />
 * ```
 */
export default function RecentPredictions({
  predictions,
  hideViewAll = false,
}: RecentPredictionsProps) {
  const visible = predictions.slice(0, MAX_ENTRIES);

  return (
    <section>
      {/* ── Section header ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: 0,
          }}
        >
          Recent Health Checks
        </h2>

        {!hideViewAll && (
          <Link
            href="/dashboard/assessment"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#C0392B",
              textDecoration: "none",
            }}
          >
            View All &rarr;
          </Link>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #F0D9D9",
          borderRadius: "1rem",
          padding: "1.5rem",
        }}
      >
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          visible.map((pred, i) => (
            <Link key={pred.id} href={`/dashboard/assessment/details/${pred.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <TimelineEntry
                prediction={pred}
                isLast={i === visible.length - 1}
              />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
