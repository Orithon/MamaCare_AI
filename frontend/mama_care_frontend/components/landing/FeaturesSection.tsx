/**
 * components/landing/FeaturesSection.tsx
 *
 * Displays the three core AI features of MamaCare as cards.
 * Responsive: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop).
 *
 * Server Component — no interactivity required.
 */

import { ReactNode } from "react";

/* ── FEATURE DATA ─────────────────────────────────────────────────────────── */

/** Shape of a single feature card */
interface Feature {
  id: string;      /** unique ID for the card element */
  icon: ReactNode; /** SVG icon component */
  title: string;
  description: string;
  highlight: string; /** small pill at the bottom of the card, e.g. "PDF · JPEG · PNG" */
}

/** SVG icon: waveform — used for Risk Prediction */
function WaveformIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

/** SVG icon: document — used for Report Interpreter */
function DocumentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

/** SVG icon: microphone — used for Voice Assistant */
function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/** Static list of all three features */
const FEATURES: Feature[] = [
  {
    id: "risk-prediction",
    icon: <WaveformIcon />,
    title: "Risk Prediction Engine",
    description:
      "Submit your blood pressure, glucose, temperature and symptoms. Our AI predicts your maternal risk level e.g Low, Moderate, High, or Critical in under 10 seconds.",
    highlight: "Preeclampsia · Gestational Diabetes · Anaemia",
  },
  {
    id: "report-interpreter",
    icon: <DocumentIcon />,
    title: "Medical Report Interpreter",
    description:
      "Upload any lab result or scan report (PDF or image). Our AI converts complex medical language into simple, actionable advice in your preferred language.",
    highlight: "PDF · JPEG · PNG · Up to 10MB",
  },
  {
    id: "voice-assistant",
    icon: <MicIcon />,
    title: "Multilingual Voice Assistant",
    description:
      "Ask any pregnancy health question by voice in Yoruba, Igbo, Hausa, or English and hear the answer spoken back to you in your own language.",
    highlight: "English · Yoruba · Igbo · Hausa",
  },
];

/* ── SUB-COMPONENTS ────────────────────────────────────────────────────────── */

/**
 * A single feature card.
 * @param feature - The feature data to display.
 */
function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article id={`feature-${feature.id}`} className="card" style={{ padding: "2rem" }}>
      {/* Coloured icon container */}
      <div style={{
        width: "60px", height: "60px", borderRadius: "14px",
        background: "linear-gradient(135deg, #FDECEA 0%, #FEE2E2 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#C0392B", marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(192,57,43,0.15)",
      }}>
        {feature.icon}
      </div>

      {/* Feature title */}
      <h3 style={{
        fontSize: "1.2rem", fontWeight: 700,
        color: "#1A1A1A", marginBottom: "0.75rem",
      }}>
        {feature.title}
      </h3>

      {/* Description */}
      <p style={{
        color: "#6B7280", fontSize: "0.9375rem",
        lineHeight: 1.7, marginBottom: "1.25rem",
      }}>
        {feature.description}
      </p>

      {/* Technology/format highlight pill */}
      <div style={{
        display: "inline-flex", alignItems: "center",
        backgroundColor: "#FFF5F5", border: "1px solid #F0D9D9",
        borderRadius: "9999px", padding: "0.25rem 0.875rem",
        fontSize: "0.75rem", color: "#C0392B", fontWeight: 600,
      }}>
        {feature.highlight}
      </div>
    </article>
  );
}

/* ── MAIN EXPORT ───────────────────────────────────────────────────────────── */

/** Features section — three AI capability cards in a responsive grid */
export default function FeaturesSection() {
  return (
    <section id="features" className="section-padding" style={{ backgroundColor: "#FFF5F5" }}>
      <div className="section-container">

        {/* Section header */}
        <header style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="section-label">Core Features</span>
          <h2 style={{
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 800, marginBottom: "1rem",
          }}>
            Everything you need for a{" "}
            <span className="gradient-text">safer pregnancy</span>
          </h2>
          <p style={{
            color: "#6B7280", fontSize: "1.0625rem",
            maxWidth: "520px", margin: "0 auto", lineHeight: 1.7,
          }}>
            Three powerful AI tools working together to support you and your
            healthcare provider at every stage.
          </p>
        </header>

        {/* Responsive 1→2→3 column card grid */}
        <div className="grid-1-to-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>

      </div>
    </section>
  );
}
