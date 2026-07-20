/**
 * components/landing/CTASection.tsx
 *
 * Final call-to-action banner before the footer.
 * Large red gradient background with a primary and secondary button.
 * Responsive: CTA buttons stack on mobile, go side-by-side on tablet+.
 *
 * Server Component — no interactivity required.
 */

import Link from "next/link";

/** Main CTA banner section */
export default function CTASection() {
  return (
    <section style={{
      background: "linear-gradient(135deg, #C0392B 0%, #922B21 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative dot grid for visual texture */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "24px 24px", pointerEvents: "none",
      }} />

      {/* Content */}
      <div className="section-container section-padding" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>

        {/* Headline */}
        <h2 style={{
          fontSize: "clamp(1.75rem, 5vw, 3rem)",
          fontWeight: 800, color: "#ffffff",
          marginBottom: "1rem", lineHeight: 1.15,
        }}>
          Ready to take control of your
          <br />pregnancy health?
        </h2>

        {/* Supporting text */}
        <p style={{
          color: "rgba(255,255,255,0.75)", fontSize: "1.125rem",
          maxWidth: "420px", margin: "0 auto 2.5rem", lineHeight: 1.6,
        }}>
          Join thousands of women getting smarter, safer maternal care 
          in their own language.
        </p>

        {/* CTA buttons — stacked on mobile, side-by-side from 480px */}
        <div className="flex-cta">
          {/* Primary CTA — register */}
          <Link href="/register" id="cta-register" style={{
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", gap: "0.5rem",
            backgroundColor: "#ffffff", color: "#C0392B",
            padding: "0.9rem 2.25rem", borderRadius: "9999px",
            fontWeight: 700, fontSize: "1rem", textDecoration: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}>
            Register Now
          </Link>

          {/* Secondary CTA — sign in */}
          <Link href="/login" id="cta-login" style={{
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", gap: "0.5rem",
            backgroundColor: "transparent", color: "rgba(255,255,255,0.88)",
            padding: "0.9rem 2rem", borderRadius: "9999px",
            fontWeight: 600, fontSize: "1rem", textDecoration: "none",
            border: "2px solid rgba(255,255,255,0.4)",
          }}>
            Already have an account? Sign in
          </Link>
        </div>

      </div>
    </section>
  );
}
