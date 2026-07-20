/**
 * components/dashboard/RecentReports.tsx
 *
 * Section displaying the patient's recently uploaded medical reports.
 *
 * Features:
 *  - Shows up to 3 most recent reports
 *  - Each card displays: FileText icon, filename, upload date, and a
 *    one-line truncated AI summary
 *  - Friendly empty state when no reports have been uploaded
 *  - "View All →" link in the section header
 *
 * This component is a pure Server Component — no hooks or browser APIs.
 */

import Link from "next/link";
import { FileText } from "lucide-react";
import { ReportEntry } from "@/lib/dashboard-data";

/* ── PROPS ──────────────────────────────────────────────────────────────────── */

interface RecentReportsProps {
  /** Array of uploaded report entries (newest first) */
  reports: ReportEntry[];
  hideViewAll?: boolean;
}

/* ── HELPERS ───────────────────────────────────────────────────────────────── */

/** Maximum number of report cards to display */
const MAX_ENTRIES = 3;

/**
 * Formats an ISO date string into a readable short format.
 * @example formatDate("2026-06-25T00:00:00Z") → "25 Jun 2026"
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── EMPTY STATE ───────────────────────────────────────────────────────────── */

/** Shown when no reports have been uploaded */
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
      No reports uploaded yet. Upload your first lab report!
    </p>
  );
}

/* ── REPORT CARD ───────────────────────────────────────────────────────────── */

/**
 * A single report row displaying the file icon, name, date, and summary.
 * @param report - The report entry data to render
 */
function ReportCard({ report }: { report: ReportEntry }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "1rem",
        backgroundColor: "#FFFFFF",
        border: "1px solid #F0D9D9",
        borderRadius: "0.75rem",
      }}
    >
      {/* File icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "0.5rem",
          backgroundColor: "#FFF5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FileText size={20} color="#C0392B" strokeWidth={2} />
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Header row: Date and Report Status Pill */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "#1A1A1A",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {report.filename}
          </span>

          <span
            style={{
              fontSize: "0.75rem",
              color: "#6B7280",
              flexShrink: 0,
            }}
          >
            {formatDate(report.date)}
          </span>
        </div>

        {/* Summary snippet — clamped to 1 line */}
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#6B7280",
            margin: "0.25rem 0 0 0",
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {report.summarySnippet}
        </p>
      </div>
    </div>
  );
}

/* ── MAIN EXPORT ───────────────────────────────────────────────────────────── */

/**
 * Recent reports section for the patient dashboard.
 *
 * @example
 * ```tsx
 * <RecentReports reports={recentReports} />
 * ```
 */
export default function RecentReports({ reports, hideViewAll = false }: RecentReportsProps) {
  const visible = reports.slice(0, MAX_ENTRIES);

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
          Recent Reports
        </h2>

        {!hideViewAll && (
          <Link
            href="/dashboard/reports"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#C0392B",
              textDecoration: "none",
            }}
          >
            View All →
          </Link>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #F0D9D9",
            borderRadius: "0.75rem",
          }}
        >
          <EmptyState />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {visible.map((report) => (
            <Link key={report.id} href={`/dashboard/reports/details/${report.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <ReportCard report={report} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
