"use client";
/**
 * components/Navbar.tsx
 *
 * Fixed top navigation bar for MamaCare AI.
 *
 * Behaviour:
 *  - Transparent on the hero section (where the background is red)
 *  - Becomes white with a blur/shadow after the user scrolls 20px
 *  - On mobile: shows a hamburger menu button; nav links are in a dropdown
 *  - On desktop (768px+): shows nav links inline, hamburger is hidden
 *
 * This MUST be a Client Component ("use client") because it uses:
 *  - useState  — to track scroll position and mobile menu open/close state
 *  - useEffect — to attach/detach the scroll event listener
 *  - Browser APIs — window.scrollY, window.addEventListener
 */

import Link from "next/link";
import { useState, useEffect } from "react";

/* ── CONSTANTS ─────────────────────────────────────────────────────────────── */

/** Pixel threshold after which the navbar switches from transparent to white */
const SCROLL_THRESHOLD = 20;

/** Height of the navbar — also used in page sections as a padding-top offset */
export const NAVBAR_HEIGHT = 72;

/* ── SUB-COMPONENTS ────────────────────────────────────────────────────────── */

/**
 * The MamaCare AI logo mark — a red rounded square with a heart icon.
 * @param scrolled - Whether the page has been scrolled (changes text colour)
 */
function Logo({ scrolled }: { scrolled: boolean }) {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
      {/* Red square with heart icon */}
      <div style={{
        width: "38px", height: "38px",
        background: "linear-gradient(135deg, #C0392B, #E74C3C)",
        borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(192,57,43,0.3)",
        flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      {/* Brand name — colour changes based on scroll state */}
      <span style={{
        fontWeight: 800, fontSize: "1.2rem",
        color: scrolled ? "#C0392B" : "#ffffff",
        letterSpacing: "-0.02em",
        transition: "color 0.3s ease",
      }}>
        MamaCare
        <span style={{ color: scrolled ? "#1A1A1A" : "rgba(255,255,255,0.8)", fontWeight: 400 }}>
          {" "}AI
        </span>
      </span>
    </Link>
  );
}

/**
 * Desktop navigation links — hidden below 768px via the injected <style>.
 * @param scrolled - Whether scrolled (changes link colour)
 */
function DesktopNav({ scrolled }: { scrolled: boolean }) {
  const linkColour = scrolled ? "#6B7280" : "rgba(255,255,255,0.85)";
  const linkStyle = {
    color: linkColour, textDecoration: "none",
    fontSize: "0.9375rem", fontWeight: 500,
    transition: "color 0.2s ease",
  };

  return (
    /* Shown only on desktop via injected CSS (see <style> at bottom) */
    <nav className="navbar-desktop-nav" style={{ display: "none", gap: "2rem", alignItems: "center" }}>
      <Link href="#features"      style={linkStyle}>Features</Link>
      <Link href="#how-it-works"  style={linkStyle}>How It Works</Link>
    </nav>
  );
}

/**
 * Desktop CTA buttons on the right of the navbar.
 * Hidden below 768px (hamburger takes over).
 * @param scrolled - Controls colours
 */
function DesktopCTAs({ scrolled }: { scrolled: boolean }) {
  return (
    <div className="navbar-desktop-ctas" style={{ display: "none", gap: "0.75rem", alignItems: "center" }}>
      {/* Ghost "Sign In" link */}
      <Link href="/login" style={{
        color: scrolled ? "#C0392B" : "rgba(255,255,255,0.9)",
        textDecoration: "none", fontSize: "0.9375rem", fontWeight: 600,
        padding: "0.5rem 1rem",
      }}>
        Sign In
      </Link>

      {/* Solid "Get Started" button */}
      <Link href="/register" style={{
        backgroundColor: scrolled ? "#C0392B" : "white",
        color: scrolled ? "white" : "#C0392B",
        padding: "0.5rem 1.25rem",
        borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 700,
        textDecoration: "none",
        transition: "all 0.2s ease",
        boxShadow: scrolled ? "0 2px 8px rgba(192,57,43,0.3)" : "0 2px 12px rgba(0,0,0,0.15)",
      }}>
        Get Started
      </Link>
    </div>
  );
}

/**
 * Hamburger / close icon button — visible only on mobile (below 768px).
 * @param isOpen   - Whether the mobile menu is currently open
 * @param scrolled - Controls icon colour
 * @param onToggle - Callback to toggle the menu open/closed
 */
function HamburgerButton({
  isOpen, scrolled, onToggle,
}: {
  isOpen: boolean;
  scrolled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="navbar-hamburger"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "0.25rem",
        color: scrolled ? "#1A1A1A" : "white",
        display: "flex", alignItems: "center",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {/* Animate between hamburger and X */}
        {isOpen ? (
          <>
            <line x1="18" y1="6"  x2="6"  y2="18" />
            <line x1="6"  y1="6"  x2="18" y2="18" />
          </>
        ) : (
          <>
            <line x1="4" y1="6"  x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </>
        )}
      </svg>
    </button>
  );
}

/**
 * Mobile dropdown menu — slides in when the hamburger is pressed.
 * @param onClose - Callback to close the menu (called on any link click)
 */
function MobileMenu({ onClose }: { onClose: () => void }) {
  const linkStyle = {
    color: "#6B7280", textDecoration: "none",
    fontSize: "1rem", fontWeight: 500,
    padding: "0.75rem 0",
    borderBottom: "1px solid #F0D9D9",
    display: "block",
  };

  return (
    <div style={{
      backgroundColor: "white",
      borderTop: "1px solid #F0D9D9",
      padding: "0.5rem 1.5rem 1.5rem",
      display: "flex", flexDirection: "column", gap: "0.25rem",
      boxShadow: "0 8px 24px rgba(192,57,43,0.12)",
    }}>
      <Link href="#features"     onClick={onClose} style={linkStyle}>Features</Link>
      <Link href="#how-it-works" onClick={onClose} style={linkStyle}>How It Works</Link>

      {/* Auth links at the bottom of the mobile menu */}
      <Link href="/login"    onClick={onClose} style={{ ...linkStyle, borderBottom: "none", color: "#C0392B" }}>
        Sign In
      </Link>
      <Link href="/register" onClick={onClose} className="btn-primary" style={{ textAlign: "center", marginTop: "0.5rem" }}>
        Get Started Free
      </Link>
    </div>
  );
}

/* ── MAIN EXPORT ───────────────────────────────────────────────────────────── */

/** Main Navbar component — mounted once in layout/page, fixed to top of viewport */
export default function Navbar() {
  /** Whether the page has scrolled past SCROLL_THRESHOLD pixels */
  const [scrolled, setScrolled] = useState(false);
  /** Whether the mobile menu dropdown is open */
  const [menuOpen, setMenuOpen] = useState(false);

  /** Attach scroll listener on mount, clean up on unmount */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      transition: "all 0.3s ease",
      /* Switch from transparent (on hero) to frosted white (after scroll) */
      backgroundColor: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      boxShadow: scrolled ? "0 1px 16px rgba(192,57,43,0.10)" : "none",
    }}>
      {/* Main navbar row */}
      <div className="section-container" style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: `${NAVBAR_HEIGHT}px`,
      }}>
        <Logo scrolled={scrolled} />
        <DesktopNav scrolled={scrolled} />

        {/* Right side: desktop CTAs + mobile hamburger together */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <DesktopCTAs scrolled={scrolled} />
          <HamburgerButton
            isOpen={menuOpen}
            scrolled={scrolled}
            onToggle={() => setMenuOpen((prev) => !prev)}
          />
        </div>
      </div>

      {/* Mobile dropdown — only rendered when menu is open */}
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}

      {/*
       * Responsive CSS injected into <head> via this <style> tag.
       * We use class names (not Tailwind utilities) because these styles
       * need to apply based on viewport width, and inline styles cannot
       * contain media queries.
       */}
      <style>{`
        /* Desktop nav and CTA: hidden on mobile, shown from 768px */
        @media (min-width: 768px) {
          .navbar-desktop-nav  { display: flex !important; }
          .navbar-desktop-ctas { display: flex !important; }
          .navbar-hamburger    { display: none  !important; }
        }
      `}</style>
    </header>
  );
}
