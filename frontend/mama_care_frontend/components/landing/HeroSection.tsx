/**
 * components/landing/HeroSection.tsx
 *
 * The full-viewport hero section of the MamaCare AI landing page.
 *
 * Layout (responsive):
 *   - Mobile  : Text centred, CTA buttons stacked vertically, floating card hidden
 *   - Tablet+ : CTA buttons in a row, floating card visible
 *
 * This is a Server Component (no interactivity needed here).
 */

import Link from "next/link";
import { HeartPulse, Globe } from "lucide-react";

/** Icon used in the "Get Started" CTA button */
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/** Icon used in the "For Healthcare Providers" CTA button */
function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/** Decorative background layer — circles, dot grid, and pulse rings */
function HeroBackground() {
  return (
    <div aria-hidden="true" style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      overflow: "hidden", pointerEvents: "none",
    }}>
      {/* Large circle top-right */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: "clamp(200px, 40vw, 500px)", height: "clamp(200px, 40vw, 500px)",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
      }} />
      {/* Large circle bottom-left */}
      <div style={{
        position: "absolute", bottom: "-15%", left: "-8%",
        width: "clamp(150px, 30vw, 400px)", height: "clamp(150px, 30vw, 400px)",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
      }} />
      {/* Subtle dot grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
      {/* Outer pulse ring (decorative) */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "clamp(300px, 60vw, 900px)", height: "clamp(300px, 60vw, 900px)",
        borderRadius: "50%", border: "1px solid rgba(255,255,255,0.02)",
      }} />
    </div>
  );
}

/**
 * Small floating card shown below the hero text on tablet and above.
 * Gives a visual preview of what a completed assessment looks like.
 * Hidden on small phones to keep the hero clean.
 */
function FloatingPreviewCard() {
  const previewItems = [
    { label: "Risk Level",    value: "LOW",       color: "#4ADE80" },
    { label: "Blood Pressure", value: "118/76",   color: "rgba(255,255,255,0.9)" },
    { label: "Assessment",    value: "Complete ✓", color: "#4ADE80" },
  ];

  return (
    /* hide-mobile class hides this below 640px — defined in globals.css */
    <div className="hide-mobile" style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
      <div style={{
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "20px",
        padding: "1.25rem 2rem",
        display: "flex",
        gap: "2rem",
        flexWrap: "wrap",
        justifyContent: "center",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        maxWidth: "480px",
        width: "100%",
      }}>
        {previewItems.map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            {/* Stat value */}
            <div style={{ color: item.color, fontSize: "1.2rem", fontWeight: 800 }}>
              {item.value}
            </div>
            {/* Stat label */}
            <div style={{
              color: "rgba(255,255,255,0.55)", fontSize: "0.7rem",
              fontWeight: 500, marginTop: "0.2rem",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The 4 language badge pills shown below the CTA buttons */
function LanguageBadges() {
  /* No flag emojis — Globe icon used instead for cross-platform consistency */
  const languages = [
    { code: "EN", name: "English" },
    { code: "YO", name: "Yoruba"  },
    { code: "IG", name: "Igbo"    },
    { code: "HA", name: "Hausa"   },
  ];

  return (
    <div className="lang-badges">
      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8125rem", fontWeight: 500 }}>
        Available in:
      </span>
      {languages.map((lang) => (
        <span key={lang.code} title={lang.name} style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          backgroundColor: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "9999px", padding: "0.25rem 0.875rem",
          color: "rgba(255,255,255,0.88)", fontSize: "0.8125rem",
          fontWeight: 700, letterSpacing: "0.04em",
        }}>
          {/* Globe icon replaces flag emojis — consistent across all OS/browsers */}
          <Globe size={11} aria-hidden="true" />
          {lang.code}
        </span>
      ))}
    </div>
  );
}

/** Main exported HeroSection component */
export default function HeroSection() {
  return (
    <section id="hero" style={{
      background: "linear-gradient(135deg, #C0392B 0%, #922B21 50%, #7B0D1E 100%)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      paddingTop: "72px", /* offset for the fixed navbar height */
    }}>
      <HeroBackground />

      {/* Hero content — centred on all screen sizes */}
      <div className="section-container" style={{
        position: "relative", zIndex: 1,
        textAlign: "center",
        paddingTop: "3rem", paddingBottom: "4rem",
      }}>

        {/* Main headline — clamp() keeps it readable on all screen sizes */}
        <h1 className="animate-fade-in-up delay-100" style={{
          color: "#ffffff",
          fontSize: "clamp(2.25rem, 7vw, 4.5rem)",
          fontWeight: 800, lineHeight: 1.1,
          letterSpacing: "-0.03em",
          marginBottom: "1.25rem",
          paddingTop: "3.25rem"
        }}>
          Your Pregnancy Health{" "}
          <span style={{ display: "block", color: "rgba(255,255,255,0.75)", fontStyle: "italic" }}>
            Companion
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up delay-200" style={{
          color: "rgba(255,255,255,0.80)",
          fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          maxWidth: "580px", margin: "0 auto 2.25rem",
          lineHeight: 1.7,
        }}>
          AI-powered maternal care for every woman in Nigeria regardless of
          language, location, or literacy level.
        </p>

        {/* CTA buttons — stacked on mobile, side-by-side on tablet+ */}
        <div className="flex-cta animate-fade-in-up delay-300" style={{ marginBottom: "2rem" }}>
          <Link href="/register" id="hero-get-started" style={{
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", gap: "0.5rem",
            backgroundColor: "#ffffff", color: "#C0392B",
            padding: "0.9rem 2rem", borderRadius: "9999px",
            fontWeight: 700, fontSize: "1rem", textDecoration: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}>
            Get Started<ArrowIcon />
          </Link>
          <Link href="/register?role=provider" id="hero-provider" style={{
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", gap: "0.5rem",
            backgroundColor: "transparent", color: "#ffffff",
            padding: "0.9rem 2rem", borderRadius: "9999px",
            fontWeight: 600, fontSize: "1rem", textDecoration: "none",
            border: "2px solid rgba(255,255,255,0.5)",
          }}>
            <PersonIcon /> For Healthcare Providers
          </Link>
        </div>

        {/* Supported language pills */}
        <div className="animate-fade-in-up delay-400">
          <LanguageBadges />
        </div>

        {/* Floating assessment preview card — hidden on mobile */}
        <div className="animate-fade-in-up delay-500">
          <FloatingPreviewCard />
        </div>
      </div>

      {/* Wave SVG that smoothly transitions into the next section */}
      <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none" style={{ width: "100%", height: "60px", display: "block" }}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#FFF5F5" />
        </svg>
      </div>
    </section>
  );
}
