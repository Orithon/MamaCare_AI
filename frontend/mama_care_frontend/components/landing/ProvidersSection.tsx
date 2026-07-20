/**
 * components/landing/ProvidersSection.tsx
 *
 * Split two-column section targeting healthcare providers (midwives, doctors).
 *  - Left column : headline, bullet list of provider features, CTA button
 *  - Right column: mock provider dashboard showing a patient list with risk levels
 *
 * Responsive:
 *  - Mobile  : columns stack (text first, mock dashboard below)
 *  - Desktop : side-by-side columns, equal width
 *
 * Server Component — no interactivity required.
 */

import Link from "next/link";
import { AlertTriangle, User } from "lucide-react";
import { getMockPatients, MockPatient } from "@/lib/placeholder-data";

/* ── CONSTANTS ─────────────────────────────────────────────────────────────── */

/** Benefits listed in the text column */
const PROVIDER_BENEFITS = [
  "View all assigned patients sorted by risk level",
  "Instant alert when any patient reaches Critical risk",
  "Full prediction history timeline for each patient",
  "Add and manage clinical notes remotely",
  "Patient linking via a simple 6-character Provider Code",
];

/** Maps a risk level string to its display colours */
const RISK_COLOURS: Record<MockPatient["riskLevel"], { bg: string; text: string }> = {
  Critical: { bg: "#FEE2E2", text: "#DC2626" },
  High:     { bg: "#FFEDD5", text: "#EA580C" },
  Moderate: { bg: "#FEF9C3", text: "#CA8A04" },
  Low:      { bg: "#DCFCE7", text: "#16A34A" },
};

/* ── SUB-COMPONENTS ────────────────────────────────────────────────────────── */

/** Check icon used in the benefit bullet list */
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="#C0392B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Left column: marketing text and CTA for healthcare providers.
 */
function ProviderTextColumn() {
  return (
    <div>
      {/* Section label */}
      <span className="section-label">For Healthcare Providers</span>

      {/* Headline */}
      <h2 style={{
        fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
        fontWeight: 800, marginBottom: "1rem", lineHeight: 1.15,
      }}>
        Monitor{" "}
        <span className="gradient-text">all your patients</span>
        {", "}from anywhere
      </h2>

      {/* Intro paragraph */}
      <p style={{
        color: "#6B7280", fontSize: "1.0625rem",
        lineHeight: 1.7, marginBottom: "1.75rem",
      }}>
        Midwives and doctors get a dedicated command centre to manage patient
        risk remotely without needing to see every patient in person every day.
      </p>

      {/* Benefits list */}
      <ul style={{
        listStyle: "none", padding: 0, margin: "0 0 2rem",
        display: "flex", flexDirection: "column", gap: "0.75rem",
      }}>
        {PROVIDER_BENEFITS.map((benefit) => (
          <li key={benefit} style={{
            display: "flex", alignItems: "flex-start",
            gap: "0.75rem", color: "#374151", fontSize: "0.9375rem",
          }}>
            {/* Small red checkmark circle */}
            <span style={{
              width: "22px", height: "22px", borderRadius: "50%",
              backgroundColor: "#FDECEA",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: "1px",
            }}>
              <CheckIcon />
            </span>
            {benefit}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link href="/register?role=provider" id="provider-cta" className="btn-primary">
        Join as a Provider &rarr;
      </Link>
    </div>
  );
}

/**
 * A single patient row inside the mock provider dashboard preview.
 * @param patient - Patient data from getMockPatients()
 */
function MockPatientRow({ patient }: { patient: MockPatient }) {
  const colours = RISK_COLOURS[patient.riskLevel];

  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "1px solid #F0D9D9",
      borderRadius: "12px",
      padding: "0.875rem 1.25rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      boxShadow: "0 1px 4px rgba(192,57,43,0.06)",
    }}>
      {/* Avatar + name + week */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", minWidth: 0 }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "linear-gradient(135deg, #FDECEA, #FEE2E2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#C0392B", flexShrink: 0,
        }}>
          {/* User icon replaces 👩 emoji */}
          <User size={18} aria-hidden="true" />
        </div>
        <div style={{ minWidth: 0 }}>
          {/* Patient name — truncate if too long on small screens */}
          <div style={{
            fontWeight: 600, color: "#1A1A1A",
            fontSize: "0.875rem",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {patient.name}
          </div>
          <div style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>
            {patient.gestationalWeek} · {patient.lastAssessment}
          </div>
        </div>
      </div>

      {/* Risk level badge */}
      <span style={{
        backgroundColor: colours.bg, color: colours.text,
        padding: "0.2rem 0.75rem", borderRadius: "9999px",
        fontSize: "0.75rem", fontWeight: 700,
        letterSpacing: "0.04em", flexShrink: 0,
      }}>
        {patient.riskLevel}
      </span>
    </div>
  );
}

/**
 * Right column: a visual mock of the provider patient dashboard.
 * Uses placeholder data from lib/placeholder-data.ts.
 */
function MockDashboardColumn() {
  const patients = getMockPatients();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      {/* Critical alert banner — shown when any patient has Critical risk */}
      <div style={{
        backgroundColor: "#FEE2E2", border: "1px solid #FECACA",
        borderRadius: "12px", padding: "0.875rem 1rem",
        display: "flex", alignItems: "center", gap: "0.75rem",
      }}>
        {/* AlertTriangle icon replaces ⚠️ emoji */}
        <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} aria-hidden="true" />
        <div>
          <div style={{ fontWeight: 700, color: "#DC2626", fontSize: "0.875rem" }}>
            1 patient needs urgent attention
          </div>
          <div style={{ color: "#EF4444", fontSize: "0.75rem" }}>
            {patients[0].name} — Critical Risk
          </div>
        </div>
      </div>

      {/* Patient rows */}
      {patients.map((patient) => (
        <MockPatientRow key={patient.name} patient={patient} />
      ))}

      {/* "View All" hint */}
      <p style={{ textAlign: "center", color: "#C0392B", fontSize: "0.8125rem", fontWeight: 600 }}>
        + more patients · click any row to see full history
      </p>
    </div>
  );
}

/* ── MAIN EXPORT ───────────────────────────────────────────────────────────── */

/** Providers section — split two-column layout, stacks on mobile */
export default function ProvidersSection() {
  return (
    <section className="section-padding" style={{ backgroundColor: "#FFF5F5" }}>
      <div className="section-container">
        {/* grid-1-to-2 stacks on mobile, goes side-by-side on desktop (from globals.css) */}
        <div className="grid-1-to-2">
          <ProviderTextColumn />
          <MockDashboardColumn />
        </div>
      </div>
    </section>
  );
}
